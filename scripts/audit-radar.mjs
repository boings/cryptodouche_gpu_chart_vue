#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  RADAR_SCAN_RESULT_SCHEMA_VERSION,
  createExecutionVenueEligibilityObservation,
  createRadarSelectionProfile,
  impulseFadeLifecycleConfigHash,
  scanRadarEpisodes,
} from "../dist/core.js";

const HOUR = 3_600;
const DAY = 86_400;
const START = Date.parse("2024-01-01T00:00:00Z") / 1_000;

const options = parseArguments(process.argv.slice(2));

if (options.help) {
  printUsage();
} else {
  const audit = options.inputPath
    ? await buildConfiguredAudit(options.inputPath)
    : buildDefaultAudit();
  printAudit(audit);

  if (options.outputPath) {
    const outputPath = resolve(options.outputPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
    console.log(`\nWrote ${outputPath}`);
  }
}

function buildDefaultAudit() {
  const rebound = runScenario({
    id: "rebound-negative-24h",
    description: "A 100 -> 80 -> 92 rebound qualifies even though its elapsed 24h return is negative.",
    symbol: "REBOUNDUSDT",
    candles: [
      candle(START, 100),
      candle(START + 23 * HOUR, 80),
      candle(START + 24 * HOUR, 92),
    ],
    profile: radarProfile({ id: "radar-audit.rebound" }),
    to: START + 25 * HOUR,
    lifecycleHistory: [
      lifecycleSnapshot("REBOUNDUSDT", START + 25 * HOUR, "developing", 92),
    ],
    expected: (result) => ({
      oneEpisode: result.episodes.length === 1,
      detectedAtFinalClose: result.episodes[0]?.detectedAt === START + 25 * HOUR,
      troughAnchorIs80: result.episodes[0]?.selectionAnchor?.price === 80,
      negative24hReturn: nearlyEqual(result.episodes[0]?.pathContext.net24hReturnPct, -8),
      fifteenPercentRebound: nearlyEqual(
        result.episodes[0]?.pathContext.triggeringLocalImpulseReturnPct,
        15,
      ),
      manifestCreated: result.replayCaseManifests.length === 1,
    }),
  });

  const rearm = runScenario({
    id: "reset-and-rearm",
    description: "A sustained false gate resets the first episode before a later crossing rearms detection.",
    symbol: "REARMUSDT",
    candles: [100, 120, 121, 100, 100, 120].map((close, index) =>
      candle(START + index * HOUR, close),
    ),
    profile: radarProfile({
      id: "radar-audit.reset-rearm",
      detectorLookbackSeconds: 2 * HOUR,
      maximumTroughAgeSeconds: 2 * HOUR,
      minimumFalseDurationSeconds: HOUR,
    }),
    to: START + 6 * HOUR,
    lifecycleHistory: [
      lifecycleSnapshot("REARMUSDT", START + 2 * HOUR, "developing", 120, "first"),
      lifecycleSnapshot("REARMUSDT", START + 6 * HOUR, "deteriorating", 120, "second"),
    ],
    expected: (result) => ({
      twoEpisodes: result.episodes.length === 2,
      firstDetection: result.episodes[0]?.detectedAt === START + 2 * HOUR,
      resetAfterSustainedFalseGate: result.episodeStatusObservations.some(
        (event) =>
          event.reason === "radarGateReset" &&
          event.rearmState === "armed" &&
          event.asOf === START + 5 * HOUR,
      ),
      secondDetection: result.episodes[1]?.detectedAt === START + 6 * HOUR,
      distinctEpisodeIds:
        result.episodes.length === 2 && result.episodes[0].id !== result.episodes[1].id,
      bothManifestsCreated: result.replayCaseManifests.length === 2,
    }),
  });

  const continuation = runScenario({
    id: "continuation-retained",
    description: "A qualifying pump that continues higher remains in the replay corpus.",
    symbol: "CONTINUEUSDT",
    candles: [100, 120, 145, 170].map((close, index) =>
      candle(START + index * HOUR, close),
    ),
    profile: radarProfile({ id: "radar-audit.continuation" }),
    to: START + 4 * HOUR,
    lifecycleHistory: [
      lifecycleSnapshot("CONTINUEUSDT", START + 2 * HOUR, "developing", 120),
    ],
    expected: (result) => ({
      oneEpisode: result.episodes.length === 1,
      detectedBeforeContinuation: result.episodes[0]?.detectedAt === START + 2 * HOUR,
      finalPriceContinuedHigher: 170 > 120,
      retainedManifest: result.replayCaseManifests.length === 1,
      noFutureOutcomeLeakage: result.replayCaseManifests[0]?.futureOutcomeRef === null,
    }),
  });

  return {
    auditSchemaVersion: "radar-audit.1",
    runtimeModule: "dist/core.js",
    radarScanSchemaVersion: RADAR_SCAN_RESULT_SCHEMA_VERSION,
    mode: "deterministic-fixtures",
    scenarios: [rebound, rearm, continuation],
  };
}

async function buildConfiguredAudit(inputPath) {
  const absoluteInputPath = resolve(inputPath);
  const document = JSON.parse(await readFile(absoluteInputPath, "utf8"));
  const configured = document.scanInput ?? document;
  const rawProfile = configured.selectionProfile ?? configured.profile;
  if (!rawProfile) {
    throw new Error("Configured input must include selectionProfile or profile");
  }

  const selectionProfile = rawProfile.canonicalConfigHash
    ? rawProfile
    : createRadarSelectionProfile(rawProfile);
  const { profile: _profile, ...inputWithoutAlias } = configured;
  const scanInput = { ...inputWithoutAlias, selectionProfile };
  const result = scanRadarEpisodes(scanInput);

  return {
    auditSchemaVersion: "radar-audit.1",
    runtimeModule: "dist/core.js",
    radarScanSchemaVersion: RADAR_SCAN_RESULT_SCHEMA_VERSION,
    mode: "configured-input",
    inputPath: absoluteInputPath,
    scenarios: [
      summarizeScenario({
        id: document.id ?? "configured-input",
        description: document.description ?? "Configured JSON radar scan.",
        scanInput,
        result,
        checks: {},
      }),
    ],
  };
}

function runScenario({
  id,
  description,
  symbol,
  candles,
  profile,
  to,
  lifecycleHistory,
  expected,
}) {
  const venueEligibility = createExecutionVenueEligibilityObservation({
    symbol,
    marketDataSource: "bybit",
    executionVenue: "phemex",
    status: "Available",
    effectiveFrom: START - HOUR,
    effectiveTo: null,
    knownAt: START - HOUR,
    evidenceSource: "deterministic-radar-audit",
    dataQualityNotes: [],
  });
  const scanInput = {
    candlesBySymbolAndTimeframe: {
      [symbol]: {
        symbol,
        source: "bybit",
        dataOrigin: "audit-fixture",
        candlesByTimeframe: { "1h": candles },
      },
    },
    selectionProfile: profile,
    from: START,
    to,
    lifecycleHistory: { [symbol]: lifecycleHistory },
    venueEligibilityHistory: [venueEligibility],
  };
  const result = scanRadarEpisodes(scanInput);
  const checks = expected(result);
  const failures = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (failures.length > 0) {
    throw new Error(`${id} audit checks failed: ${failures.join(", ")}`);
  }

  return summarizeScenario({ id, description, scanInput, result, checks });
}

function summarizeScenario({ id, description, scanInput, result, checks }) {
  return {
    id,
    description,
    checks,
    summary: {
      detections: result.episodes.map((episode) => ({
        detectedAt: episode.detectedAt,
        triggeringDetectorIds: episode.triggeringDetectorIds,
        triggeringMetrics: episode.triggeringObservations.map((observation) => ({
          metricCode: observation.metricCode,
          value: observation.value,
          unit: observation.unit,
          window: observation.window,
          percentile: observation.percentile,
          zScore: observation.zScore,
          referenceTime: observation.referenceTime,
          observationId: observation.observationId,
        })),
        hardGates: episode.hardGateResults,
        context: episode.pathContext,
        executionVenueEligibility: episode.executionVenueEligibility,
        initialLifecycleState: episode.initialLifecycleState,
        episodeId: episode.id,
        manifestId:
          result.replayCaseManifests.find((manifest) => manifest.radarEpisodeId === episode.id)?.id ??
          null,
      })),
      statusEvents: result.episodeStatusObservations,
      manifestIds: result.replayCaseManifests.map((manifest) => manifest.id),
    },
    scanInput,
    result,
  };
}

function radarProfile({
  id,
  detectorLookbackSeconds = 48 * HOUR,
  maximumTroughAgeSeconds = 48 * HOUR,
  minimumFalseDurationSeconds = 2 * HOUR,
}) {
  return createRadarSelectionProfile({
    schemaVersion: "radar-selection-profile.1",
    id,
    version: "1",
    name: `${id} deterministic audit profile`,
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [
      {
        id: "recent-trough-runup",
        type: "rollingTroughRunup",
        lookbackSeconds: detectorLookbackSeconds,
        minimumRunupPct: 15,
        maximumTroughAgeSeconds,
        referenceField: "close",
        minimumPercentile: null,
        minimumZScore: null,
        minimumSampleCount: 0,
        historyLookbackSeconds: 90 * DAY,
      },
    ],
    detectorCombination: { mode: "any" },
    hardGates: ["executionVenueEligibility"],
    resetPolicy: { minimumFalseDurationSeconds },
    episodeExpiry: { maximumAgeSeconds: 72 * HOUR },
    sourcePolicy: { allowedSources: ["bybit"] },
    executionVenuePolicy: { intendedVenue: "phemex", mode: "requireKnownAvailable" },
    liquidityPolicy: {
      minimumQuoteNotional: null,
      windowSeconds: DAY,
      missingData: "warn",
    },
    createdAt: START,
  });
}

function lifecycleSnapshot(symbol, asOf, state, price, suffix = "primary") {
  const lifecycleConfigHash = impulseFadeLifecycleConfigHash();
  const candidateId = `audit-candidate:${symbol}:${suffix}:${asOf}`;
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: "impulse_fade_v1.lifecycle.1",
    lifecycleConfigHash,
    asOf,
    executionTimeframe: "15m",
    state,
    currentState: state,
    stateSince: asOf,
    label: `PUMP FADE ${humanize(state)}`,
    reason: "Deterministic lifecycle context supplied by the radar audit fixture",
    checks: [],
    updatedTs: asOf,
    candidate: {
      id: candidateId,
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: "impulse_fade_v1.lifecycle.1",
      lifecycleConfigHash,
      symbol,
      source: "bybit",
      venue: "bybit",
      executionTimeframe: "15m",
      detectedAt: asOf,
      detectionEventTime: asOf,
      detectionMetrics: {
        returnPct: null,
        percentile: null,
        zScore: null,
        atrExtension: null,
      },
      initialMtfContext: [],
      episodeHigh: price,
      episodeHighTime: asOf,
      currentState: state,
      stateSince: asOf,
      terminalAt: null,
    },
    evidence: [],
    transitions: [],
    pendingConditions: [],
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: null,
    expiryReason: null,
    dataQuality: [],
  };
}

function candle(bucket, close) {
  return {
    ts: bucket,
    bucket,
    x: (bucket - START) / HOUR,
    o: close,
    h: close,
    l: close,
    c: close,
    v_base: 10_000,
    v_quote: close * 10_000,
  };
}

function printAudit(audit) {
  console.log(`Radar audit via ${audit.runtimeModule} (${audit.mode})`);
  for (const scenario of audit.scenarios) {
    console.log(`\n[${scenario.id}] ${scenario.description}`);
    if (scenario.summary.detections.length === 0) {
      console.log("  detections: none");
    }
    for (const detection of scenario.summary.detections) {
      const trigger = detection.triggeringMetrics
        .map((metric) => {
          const statistics = [
            metric.percentile == null ? null : `Pctl ${metric.percentile.toFixed(1)}`,
            metric.zScore == null ? null : `Z ${metric.zScore >= 0 ? "+" : ""}${metric.zScore.toFixed(2)}`,
          ].filter(Boolean);
          return `${metric.metricCode} ${formatMetric(metric.value, metric.unit)}${statistics.length ? `; ${statistics.join(", ")}` : ""}`;
        })
        .join(", ");
      const context = detection.context;
      console.log(
        `  detected ${formatTime(detection.detectedAt)}: ${detection.triggeringDetectorIds.join(", ")} (${trigger})`,
      );
      console.log(
        `  context: 24h ${formatPercent(context.net24hReturnPct)}, local ${formatPercent(context.triggeringLocalImpulseReturnPct)}, tags ${context.contextTags.join(", ") || "none"}`,
      );
      console.log(
        `  venue: ${detection.executionVenueEligibility.executionVenue} ${detection.executionVenueEligibility.status}; lifecycle: ${detection.initialLifecycleState ?? "not supplied"}`,
      );
      for (const gate of detection.hardGates) {
        console.log(
          `  hard gate ${gate.code}: ${gate.passed ? "pass" : "fail"} (${gate.explanation}; evidence ${gate.evidenceObservationIds.join(", ") || "profile-only"})`,
        );
      }
      console.log(`  episode: ${detection.episodeId}`);
      console.log(`  manifest: ${detection.manifestId ?? "none"}`);
    }
    const transitionEvents = scenario.summary.statusEvents.filter(
      (event) => event.reason === "radarGateReset" || event.reason === "maximumAgeElapsed",
    );
    for (const event of transitionEvents) {
      console.log(
        `  ${event.status}: ${formatTime(event.asOf)} (${event.reason}, rearm ${event.rearmState})`,
      );
    }
    if (Object.keys(scenario.checks).length > 0) {
      console.log(`  checks: ${Object.keys(scenario.checks).join(", ")}`);
    }
  }
}

function parseArguments(args) {
  const parsed = { inputPath: null, outputPath: null, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      parsed.help = true;
    } else if (argument === "--out" || argument === "--input") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
      if (argument === "--out") parsed.outputPath = value;
      else parsed.inputPath = value;
      index += 1;
    } else if (argument.startsWith("--out=")) {
      parsed.outputPath = argument.slice("--out=".length);
    } else if (argument.startsWith("--input=")) {
      parsed.inputPath = argument.slice("--input=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return parsed;
}

function printUsage() {
  console.log("Usage: node scripts/audit-radar.mjs [--out PATH] [--input PATH]");
  console.log("Without --input, runs the deterministic rebound, reset/rearm, and continuation corpus.");
  console.log("Configured input may be a RadarScanInput object or { scanInput, id, description }.");
}

function formatTime(timestamp) {
  return new Date(timestamp * 1_000).toISOString();
}

function formatMetric(value, unit) {
  if (value == null) return "n/a";
  if (unit === "percent") return formatPercent(value);
  return `${value.toFixed(2)} ${unit}`;
}

function formatPercent(value) {
  if (value == null) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function humanize(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
}

function nearlyEqual(left, right, epsilon = 1e-9) {
  return typeof left === "number" && Math.abs(left - right) <= epsilon;
}
