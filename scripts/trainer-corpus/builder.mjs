import path from "node:path";
import {
  EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  createDefaultReplaySessionConfig,
  createExecutionVenueEligibilityObservation,
  createExperimentalExecutionProfile,
  createExperimentalReplayAnalysisProfile,
  createImpulseFadeResearchProfile,
  createMaterializedReplaySessionConfig,
  createReplayCandleRecord,
  createResearchVenueExecutionRules,
  createVenueFeeSchedule,
  executionCandleFromReplay,
} from "../../dist/core.js";
import { bundleFingerprint, hashSuffix, sha256, writeCanonicalJson } from "./canonical.mjs";
import { BYBIT_INTERVALS, loadBybitSnapshot, nativeRowsToCandles } from "./bybit.mjs";
import { prefilterRadarPoints, scanPrefilteredRadar } from "./prefilter.mjs";
import {
  hasErrors,
  standingResearchWarnings,
  validateCaseCoverage,
  validateSeries,
} from "./validation.mjs";

const ANALYSIS_TIMEFRAMES = Object.freeze(["15m", "1h", "4h", "1d"]);
const SOURCE = "bybit";
const REFERENCE_SYMBOL = "BTCUSDT";

export async function buildTrainerCorpus(options, dependencies = {}) {
  const snapshotLoader = dependencies.snapshotLoader ?? ((query) => loadBybitSnapshot(query, {
    snapshotDir: options.snapshotDir,
    offline: options.offline,
    fetchImpl: dependencies.fetchImpl,
  }));
  const profiles = resolveProfiles(options);
  const requiredPrerollResolver = dependencies.requiredAnalysisPrerollResolver ?? requiredAnalysisPreroll;
  const fetchEnd = options.to + options.executionPostroll;
  if (fetchEnd > Math.floor(Date.now() / 1000)) {
    throw new Error("The requested execution post-roll extends beyond completed historical time");
  }

  const snapshots = new Map();
  const referenceSnapshotFingerprints = [];
  const referenceByTimeframe = {};
  for (const timeframe of ANALYSIS_TIMEFRAMES) {
    const range = alignedRange(options.from - options.analysisPreroll, fetchEnd, timeframe);
    const snapshot = await snapshotLoader({ source: SOURCE, symbol: REFERENCE_SYMBOL, timeframe, ...range });
    snapshots.set(snapshotIdentity(snapshot), snapshot);
    referenceSnapshotFingerprints.push(snapshot.fingerprint);
    const candles = nativeRowsToCandles(snapshot);
    const issues = validateSeries(candles, { symbol: REFERENCE_SYMBOL, timeframe, ...range });
    if (hasErrors(issues)) throw new CorpusBuildError(`Reference data failed validation for ${timeframe}`, issues);
    referenceByTimeframe[timeframe] = candles;
  }

  const candidates = [];
  const rejectedSymbols = [];
  for (const symbol of options.symbols) {
    const targetByTimeframe = {};
    const analysisSnapshotFingerprints = [];
    const sourceIssues = [];
    for (const timeframe of ANALYSIS_TIMEFRAMES) {
      const range = alignedRange(options.from - options.analysisPreroll, fetchEnd, timeframe);
      const snapshot = await snapshotLoader({ source: SOURCE, symbol, timeframe, ...range });
      snapshots.set(snapshotIdentity(snapshot), snapshot);
      analysisSnapshotFingerprints.push(snapshot.fingerprint);
      const candles = nativeRowsToCandles(snapshot);
      targetByTimeframe[timeframe] = candles;
      sourceIssues.push(...validateSeries(candles, { symbol, timeframe, ...range }));
    }
    if (hasErrors(sourceIssues)) {
      rejectedSymbols.push({ symbol, issues: sourceIssues });
      continue;
    }
    const radarCandles = toRadarCandles(targetByTimeframe["1h"]);
    const candidatePoints = prefilterRadarPoints(radarCandles, profiles.radar);
    const venueEvidence = createExecutionVenueEligibilityObservation({
      symbol,
      marketDataSource: SOURCE,
      executionVenue: "phemex",
      status: "Unknown",
      effectiveFrom: options.from - options.analysisPreroll,
      effectiveTo: fetchEnd,
      knownAt: options.from - options.analysisPreroll,
      evidenceSource: "Explicit research assumption; no point-in-time Phemex instrument archive supplied",
      dataQualityNotes: [standingResearchWarnings().find((item) => item.code === "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN")],
    });
    const scanInput = {
      candlesBySymbolAndTimeframe: {
        [symbol]: {
          symbol,
          source: SOURCE,
          dataOrigin: "bybit-v5-native-kline-snapshot",
          candlesByTimeframe: Object.fromEntries(
            ANALYSIS_TIMEFRAMES.map((timeframe) => [timeframe, toRadarCandles(targetByTimeframe[timeframe])]),
          ),
        },
      },
      selectionProfile: profiles.radar,
      strategyProfile: profiles.strategy,
      venueEligibilityHistory: [venueEvidence],
      from: options.from,
      to: options.to,
    };
    const result = scanPrefilteredRadar(scanInput, candidatePoints.filter((point) => point >= options.from && point <= options.to));
    const manifestByEpisode = new Map(result.replayCaseManifests.map((item) => [item.radarEpisodeId, item]));
    for (const episode of result.episodes) {
      candidates.push({
        symbol,
        episode,
        manifest: manifestByEpisode.get(episode.id),
        targetByTimeframe,
        analysisSnapshotFingerprints: [...analysisSnapshotFingerprints, ...referenceSnapshotFingerprints].sort(),
      });
    }
  }

  const selected = deterministicSelect(candidates.filter((item) => item.manifest), options.seed, options.maxCases);
  const bundles = [];
  const rejectedCases = [];
  for (const candidate of selected) {
    const detectedAt = candidate.episode.detectedAt;
    const horizonAsOf = detectedAt + options.executionPostroll;
    const range = alignedRange(detectedAt, horizonAsOf, "1m");
    const executionSnapshot = await snapshotLoader({
      source: SOURCE,
      symbol: candidate.symbol,
      timeframe: "1m",
      ...range,
    });
    snapshots.set(snapshotIdentity(executionSnapshot), executionSnapshot);
    const executionCandles = nativeRowsToCandles(executionSnapshot);
    const issues = [
      ...validateSeries(executionCandles, { symbol: candidate.symbol, timeframe: "1m", ...range }),
      ...validateCaseCoverage({
        detectedAt,
        horizonAsOf,
        analysisPreroll: options.analysisPreroll,
        requiredAnalysisPrerollByTimeframe: requiredPrerollResolver(candidate.manifest, profiles.strategy),
        targetByTimeframe: candidate.targetByTimeframe,
        referenceByTimeframe,
        executionCandles,
      }),
    ];
    if (hasErrors(issues)) {
      rejectedCases.push({ radarEpisodeId: candidate.episode.id, symbol: candidate.symbol, detectedAt, issues });
      continue;
    }
    bundles.push(createDashboardBundle({
      candidate,
      referenceByTimeframe,
      executionCandles,
      profiles,
      options,
      snapshotFingerprints: [...candidate.analysisSnapshotFingerprints, executionSnapshot.fingerprint].sort(),
      issues,
    }, bundles.length));
  }

  if (bundles.length === 0) {
    throw new CorpusBuildError("No valid RadarEpisodes had complete analysis and execution coverage", [
      ...rejectedSymbols.flatMap((item) => item.issues),
      ...rejectedCases.flatMap((item) => item.issues),
    ]);
  }

  const corpusId = `bybit-phase3b-${hashSuffix({
    source: options.source,
    symbols: options.symbols,
    from: options.from,
    to: options.to,
    seed: options.seed,
    profile: profiles.radar.canonicalConfigHash,
    bundles: bundles.map((item) => item.bundleFingerprint),
  })}`;
  const imported = { schemaVersion: "trainer-imported-corpus.1", corpusId, bundles };
  const safeDefinition = {
    schemaVersion: "trainer-corpus-index.1",
    corpusId,
    cases: bundles.map((item) => item.safeDescriptor),
  };
  const safeIndex = { ...safeDefinition, corpusFingerprint: sha256(safeDefinition) };
  // real-corpus.1 is the public portability manifest. It contains only safe
  // descriptors and paths/fingerprints; all future candles remain under private/.
  const portableDefinition = {
    schemaVersion: "real-corpus.1",
    corpusId,
    source: SOURCE,
    referenceSymbol: REFERENCE_SYMBOL,
    completedUtc: options.to,
    universeProvenance: {
      mode: "ExplicitSymbolList",
      symbols: options.symbols,
      warning: "This is not a point-in-time universe and may contain survivor bias.",
    },
    executionSemantics: {
      analysisSource: "bybit",
      referenceSource: "bybit",
      executionPriceDataSource: "bybit",
      intendedExecutionVenue: "phemex",
      executionSimulationMode: "ResearchProxyExecution",
    },
    profileRefs: Object.fromEntries(Object.entries(profiles).map(([name, profile]) => [name, profileRef(profile)])),
    snapshotFingerprints: [...snapshots.values()].map((item) => item.fingerprint).sort(),
    caseFiles: bundles.map((bundle) => `private/cases/${bundle.safeDescriptor.caseId}.json`),
    safeIndexFile: "safe/corpus-index.json",
    importedCorpusFile: "private/trainer-imported-corpus.json",
  };
  const portable = { ...portableDefinition, corpusFingerprint: sha256(portableDefinition) };
  const auditDefinition = {
    schemaVersion: "trainer-corpus-audit.1",
    corpusId,
    completedUtc: options.to,
    requested: {
      symbols: options.symbols,
      from: options.from,
      to: options.to,
      analysisPreroll: options.analysisPreroll,
      displayPreroll: options.displayPreroll,
      executionPostroll: options.executionPostroll,
      maxCases: options.maxCases,
      seed: options.seed,
    },
    counts: {
      symbolsRequested: options.symbols.length,
      symbolsRejected: rejectedSymbols.length,
      radarEpisodesFound: candidates.length,
      episodesSelected: selected.length,
      casesAccepted: bundles.length,
      casesRejected: rejectedCases.length,
    },
    warnings: standingResearchWarnings(),
    rejectedSymbols,
    rejectedCases,
    bundleFingerprints: bundles.map((item) => item.bundleFingerprint),
    snapshotFingerprints: portable.snapshotFingerprints,
  };
  const audit = { ...auditDefinition, auditFingerprint: sha256(auditDefinition) };
  await writeOutputs(options.outputDir, { imported, safeIndex, portable, audit, bundles });
  return { corpusId, bundles, safeIndex, portable, audit };
}

export function resolveProfiles(options) {
  expectProfile(options.radarProfile, "experimental-impulse-fade", "radar");
  expectProfile(options.strategyProfile, "impulse-fade-research-default", "strategy");
  expectProfile(options.analysisProfile, "experimental-impulse-fade", "analysis");
  expectProfile(options.replayProfile, "materialized-default", "replay");
  expectProfile(options.executionProfile, "experimental-candle-only", "execution");
  const strategy = createImpulseFadeResearchProfile();
  const analysis = createExperimentalReplayAnalysisProfile(strategy, {
    referenceMarketPolicy: {
      symbol: REFERENCE_SYMBOL,
      source: SOURCE,
      requireExactCompletedCloseAlignment: true,
      allowForwardFill: false,
    },
  });
  const defaultReplay = createDefaultReplaySessionConfig(strategy);
  const { canonicalConfigHash: _hash, replayEngineVersion: _engine, ...replayDefinition } = defaultReplay;
  const replay = createMaterializedReplaySessionConfig({
    ...replayDefinition,
    id: "impulse_fade_v1.replay.materialized.phase3b",
    version: "1",
  }, strategy);
  return Object.freeze({
    radar: EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
    strategy,
    analysis,
    replay,
    execution: createExperimentalExecutionProfile(["1m"]),
  });
}

function createDashboardBundle(input, index) {
  const { candidate, referenceByTimeframe, executionCandles, profiles, options } = input;
  const detectedAt = candidate.episode.detectedAt;
  const horizonAsOf = detectedAt + options.executionPostroll;
  const analysisStart = detectedAt - options.analysisPreroll;
  const displayStart = detectedAt - options.displayPreroll;
  const targetRecords = flattenReplayRecords(candidate.targetByTimeframe, candidate.symbol, analysisStart, horizonAsOf);
  const referenceRecords = flattenReplayRecords(referenceByTimeframe, REFERENCE_SYMBOL, analysisStart, horizonAsOf);
  const displayByTimeframe = Object.fromEntries(ANALYSIS_TIMEFRAMES.map((timeframe) => [
    timeframe,
    toDashboardCandles(targetRecords.filter((item) => item.timeframe === timeframe && item.closeTime >= displayStart)),
  ]));
  const executionRecords = executionCandles.map((item) => replayRecord(candidate.symbol, "1m", item));
  const planningVenueRiskRules = createPlanningVenueRiskRules(candidate.symbol);
  const feeSchedule = createProxyFeeSchedule(detectedAt);
  const venueExecutionRules = createResearchVenueExecutionRules(
    planningVenueRiskRules,
    feeSchedule,
    detectedAt,
  );
  const number = index + 1;
  const caseId = `phase3b-case-${hashSuffix({ episode: candidate.episode.id, seed: options.seed }, 18)}`;
  const bundleId = `phase3b-bundle-${hashSuffix({ caseId, snapshots: input.snapshotFingerprints }, 18)}`;
  const trigger = candidate.episode.triggeringDetectorIds[0] ?? "unknown";
  const warnings = [...standingResearchWarnings(), ...input.issues];
  const safeDescriptor = {
    schemaVersion: "trainer-safe-case.1",
    caseId,
    bundleId,
    caseAlias: `Case ${String(number).padStart(2, "0")}`,
    episodeAlias: `Episode ${hashSuffix(candidate.episode.id, 8).toUpperCase()}`,
    replayCaseManifestId: candidate.manifest.id,
    radarEpisodeId: candidate.episode.id,
    radarSelectionProfileRef: {
      id: profiles.radar.id,
      version: profiles.radar.version,
      hash: profiles.radar.canonicalConfigHash,
    },
    detectedAt,
    symbol: candidate.symbol,
    source: SOURCE,
    marketType: "PERP",
    scanTimeframe: "1h",
    triggerDetector: trigger,
    dataQualityStatus: warnings.length ? "warning" : "complete",
    venueEligibility: "unknown",
    selectionMetrics: {
      return24h: candidate.episode.pathContext.net24hReturnPct,
      percentile: candidate.episode.pathContext.triggeringPercentile,
      zScore: candidate.episode.pathContext.triggeringZScore,
      atrExtension: candidate.episode.pathContext.currentAtrDisplacement,
    },
    pathContextTags: candidate.episode.pathContext.contextTags,
  };
  const historicalData = {
    schemaVersion: "replay-json-data.1",
    symbol: candidate.symbol,
    source: SOURCE,
    candles: targetRecords,
    candleRevisions: [],
    radarEpisodes: [candidate.episode],
    analysisStateHistory: [],
    knownEvents: [],
    venueEvidence: [candidate.episode.executionVenueEligibility],
    universeEvidence: [],
    revisionHistoryAvailable: false,
  };
  const replayCaseOutcome = {
    futureCandlesByTimeframe: Object.fromEntries(ANALYSIS_TIMEFRAMES.map((timeframe) => [
      timeframe,
      targetRecords.filter((item) => item.timeframe === timeframe && item.closeTime > detectedAt),
    ])),
    lifecycleTimeline: [],
    radarTerminalResult: null,
    maximumFavorablePriceExcursionFromDetected: null,
    maximumAdversePriceExcursionFromDetected: null,
    lifecycleStateTimestamps: {},
    dataQualityNotes: standingResearchWarnings().map((item) => ({
      code: item.code,
      severity: item.severity,
      message: item.message,
    })),
  };
  const executionData = {
    schemaVersion: "execution-json-data.1",
    venue: SOURCE,
    symbol: candidate.symbol,
    candles: executionRecords.map((item) => executionCandleFromReplay(item, SOURCE)),
    trades: [],
    tradeDataCompleteness: "unavailable",
    quotes: [],
    quoteDataCompleteness: "unavailable",
    markPrices: [],
    indexPrices: [],
    funding: { availability: "unavailable", reason: "No point-in-time historical funding snapshot was supplied." },
    venueRuleEvidence: [],
  };
  const bundle = {
    schemaVersion: "trainer-case-bundle.1",
    bundleId,
    bundleFingerprint: "",
    safeDescriptor,
    replayCaseManifest: candidate.manifest,
    replayAnalysisData: {
      schemaVersion: "replay-analysis-data.1",
      target: { symbol: candidate.symbol, source: SOURCE, candles: targetRecords, candleRevisions: [], revisionHistoryAvailable: false },
      reference: { symbol: REFERENCE_SYMBOL, source: SOURCE, candles: referenceRecords, candleRevisions: [], revisionHistoryAvailable: false },
    },
    replayFutureData: {
      schemaVersion: "trainer-real-private-future.1",
      historicalData,
      candlesByTimeframe: displayByTimeframe,
      horizonAsOf,
      replayCaseOutcome,
      outcomeDerivation: {
        mode: "deriveFromHistoricalData",
        analysisEngineVersion: profiles.analysis.analysisEngineVersion,
        executionEngineVersion: profiles.execution.executionEngineVersion,
        note: "Lifecycle, decisions, plans, fills, and P/L are not authored by the corpus builder.",
      },
      planningVenueRiskRules,
    },
    executionData,
    radarSelectionProfile: profiles.radar,
    strategyProfile: profiles.strategy,
    replayAnalysisProfile: profiles.analysis,
    replaySessionConfig: profiles.replay,
    executionProfile: profiles.execution,
    venueExecutionRules,
    feeSchedule,
    fundingObservations: [],
    provenance: {
      schemaVersion: "trainer-real-provenance.1",
      producer: "CryptoDouche Replay Phase 3B offline corpus builder",
      completedUtc: options.to,
      sourceDescription: "Bybit v5 native linear-perpetual klines from immutable response-derived snapshots",
      analysisSource: SOURCE,
      referenceSource: SOURCE,
      executionPriceDataSource: SOURCE,
      intendedExecutionVenue: "phemex",
      executionSimulationMode: "ResearchProxyExecution",
      proxyAssumption: "Bybit candles and frozen research-only Bybit rule/fee assumptions are used to simulate execution; no Phemex fill or fee claim is made.",
      universeProvenance: "ExplicitSymbolList",
      snapshotFingerprints: input.snapshotFingerprints,
    },
    dataQualityNotes: warnings,
  };
  bundle.bundleFingerprint = bundleFingerprint(bundle);
  return bundle;
}

function createPlanningVenueRiskRules(symbol) {
  return {
    venue: SOURCE,
    symbol,
    quantityStep: 0.001,
    priceTick: 0.00000001,
    minQuantity: 0.001,
    minNotional: 1,
    maxLeverage: 10,
    leverageStep: 1,
    feeSchedule: {
      makerRate: 0.0002,
      takerRate: 0.00055,
      version: "phase3b-research-assumption.1",
    },
    maintenanceMarginModel: null,
    liquidationModel: null,
  };
}

function createProxyFeeSchedule(detectedAt) {
  return createVenueFeeSchedule({
    id: "bybit:linear-perpetual:phase3b-research-fees",
    version: "phase3b-research-assumption.1",
    schemaVersion: "venue-fee-schedule.1",
    venue: SOURCE,
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: detectedAt,
    effectiveUntil: null,
    makerRate: 0.0002,
    takerRate: 0.00055,
    provenance: "Frozen research assumption only; not verified as the account fee tier at this historical cutoff",
    assumptionStatus: "researchAssumption",
  });
}

function replayRecord(symbol, timeframe, candle) {
  return createReplayCandleRecord({
    symbol,
    source: SOURCE,
    timeframe,
    openTime: candle.openTime,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    vBase: candle.vBase,
    vQuote: candle.vQuote,
    knownAt: candle.closeTime,
    revision: null,
  });
}

function flattenReplayRecords(byTimeframe, symbol, from, to) {
  return ANALYSIS_TIMEFRAMES.flatMap((timeframe) =>
    (byTimeframe[timeframe] ?? [])
      .filter((item) => item.closeTime >= from && item.closeTime <= to)
      .map((item) => replayRecord(symbol, timeframe, item)))
    .sort((left, right) => left.openTime - right.openTime || left.timeframe.localeCompare(right.timeframe));
}

function toRadarCandles(candles) {
  return candles.map((item, index) => ({
    ts: item.openTime,
    bucket: item.openTime,
    x: index,
    o: item.o,
    h: item.h,
    l: item.l,
    c: item.c,
    v_base: item.vBase,
    v_quote: item.vQuote,
  }));
}

function toDashboardCandles(records) {
  return records.map((item, index) => ({
    ...item,
    ts: item.openTime,
    bucket: item.openTime,
    x: index,
    v_base: item.vBase,
    v_quote: item.vQuote,
  }));
}

function deterministicSelect(candidates, seed, maximum) {
  return [...candidates]
    .sort((left, right) => {
      const a = sha256({ seed, episode: left.episode.id });
      const b = sha256({ seed, episode: right.episode.id });
      return a.localeCompare(b) || left.episode.id.localeCompare(right.episode.id);
    })
    .slice(0, maximum);
}

function alignedRange(from, to, timeframe) {
  const seconds = BYBIT_INTERVALS[timeframe].seconds;
  return {
    from: Math.floor(from / seconds) * seconds,
    to: Math.ceil(to / seconds) * seconds,
  };
}

function requiredAnalysisPreroll(manifest, strategyProfile) {
  const result = Object.fromEntries(ANALYSIS_TIMEFRAMES.map((timeframe) => [timeframe, 0]));
  for (const requirement of manifest.preRollRequirements ?? []) {
    result[requirement.timeframe] = Math.max(
      result[requirement.timeframe] ?? 0,
      requirement.minimumDurationSeconds ?? 0,
      (requirement.minimumBars ?? 0) * (BYBIT_INTERVALS[requirement.timeframe]?.seconds ?? 0),
    );
  }
  for (const timeframe of ANALYSIS_TIMEFRAMES) {
    const roleDuration = timeframe === strategyProfile.timeframeRoles.candidateTimeframe
      ? 180 * 86_400
      : timeframe === strategyProfile.timeframeRoles.structureTimeframe ||
          strategyProfile.timeframeRoles.contextTimeframes.includes(timeframe)
        ? 90 * 86_400
        : BYBIT_INTERVALS[timeframe].seconds * 250;
    result[timeframe] = Math.max(result[timeframe] ?? 0, roleDuration);
  }
  return result;
}

function profileRef(profile) {
  return {
    id: profile.id,
    version: profile.version,
    hash: profile.canonicalConfigHash ?? profile.profileHash,
  };
}

function expectProfile(actual, expected, kind) {
  if (actual !== expected) throw new Error(`Unsupported frozen ${kind} profile '${actual}'; expected '${expected}'`);
}

function snapshotIdentity(snapshot) {
  return [snapshot.symbol, snapshot.timeframe, snapshot.from, snapshot.to, snapshot.fingerprint].join(":");
}

async function writeOutputs(outputDir, outputs) {
  await writeCanonicalJson(path.join(outputDir, "safe", "corpus-index.json"), outputs.safeIndex);
  await writeCanonicalJson(path.join(outputDir, "private", "trainer-imported-corpus.json"), outputs.imported);
  await writeCanonicalJson(path.join(outputDir, "corpus.json"), outputs.portable);
  await writeCanonicalJson(path.join(outputDir, "audit-report.json"), outputs.audit);
  for (const bundle of outputs.bundles) {
    await writeCanonicalJson(path.join(outputDir, "private", "cases", `${bundle.safeDescriptor.caseId}.json`), bundle);
  }
}

export class CorpusBuildError extends Error {
  constructor(message, issues) {
    super(message);
    this.name = "CorpusBuildError";
    this.issues = issues;
  }
}
