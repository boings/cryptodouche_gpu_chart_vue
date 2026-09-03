#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import * as api from "../dist/core.js";

const HOUR = 3_600;
const DAY = 86_400;
const ANALYSIS_DAYS = 180;
const SOURCE = "bybit";
const ALL_WAKE_CONDITIONS = [
  "NextLifecycleTransition",
  "LifecycleStateEntered",
  "StructureEventConfirmed",
  "AvwapEventConfirmed",
  "RelativeStrengthEventConfirmed",
  "PriceCrossesKnownLevel",
  "PriceEntersKnownZone",
  "RadarOrLifecycleTerminal",
  "AnyOf",
];

const options = parseArguments(process.argv.slice(2));

if (options.help) {
  printUsage();
} else {
  try {
    requireReplayApi();
    const outputPaths = resolveOutputPaths(options);
    const fixtures = [
      {
        path: outputPaths.dropRebound,
        fixture: buildDropReboundFixture(),
      },
      {
        path: outputPaths.continuation,
        fixture: buildContinuationFixture(),
      },
    ];

    for (const { path, fixture } of fixtures) {
      await writeFixture(path, fixture);
      console.log(`GENERATED ${path}`);
      console.log(`AUDIT node scripts/audit-replay.mjs ${quoteArgument(path)}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function buildDropReboundFixture() {
  const detectedAt = Date.parse("2024-07-01T00:00:00Z") / 1_000;
  const scenario = createScenario({
    slug: "drop-rebound",
    symbol: "FILUSDT",
    detectedAt,
    radarPoints: [
      { openTime: detectedAt - 25 * HOUR, close: 100 },
      { openTime: detectedAt - 2 * HOUR, close: 80 },
      { openTime: detectedAt - HOUR, close: 92 },
    ],
    futurePoints: [
      { openTime: detectedAt, close: 95 },
      { openTime: detectedAt + HOUR, close: 90 },
      { openTime: detectedAt + 2 * HOUR, close: 85 },
    ],
    commands: [
      command("drop-rebound:start", "StartSession", {}),
      command("drop-rebound:wait", "Wait", {
        reason: "waiting_for_structure_break",
        thesis: "Observe one completed candle without exposing the remaining path",
        wakePlan: {
          scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
          conditions: [],
          deadlineAfterSeconds: 2 * HOUR,
        },
      }),
      command("drop-rebound:skip", "Skip", {
        reasons: ["discretionaryRejection"],
        thesis: "Example session ends without proposing a trade",
      }),
      command("drop-rebound:reveal", "RevealOutcome", { abandonActive: false }),
    ],
    outcome: {
      lifecycleTimeline: [
        { knownAt: detectedAt, state: "developing" },
        { knownAt: detectedAt + 2 * HOUR, state: "deteriorating" },
      ],
      radarTerminalResult: {
        scenario: "drop-rebound",
        finalClose: 85,
      },
      maximumFavorablePriceExcursionFromDetected: 7,
      maximumAdversePriceExcursionFromDetected: 3,
      lifecycleStateTimestamps: {
        developing: detectedAt,
        deteriorating: detectedAt + 2 * HOUR,
      },
    },
  });

  assertClose(scenario.episode.pathContext.net24hReturnPct, -8, "negative net 24h return");
  assertClose(scenario.episode.pathContext.priorDrawdownPct, -20, "prior drawdown");
  assertClose(
    scenario.episode.pathContext.triggeringLocalImpulseReturnPct,
    15,
    "positive local rebound",
  );
  if (
    scenario.episode.selectionAnchor.price !== 80 ||
    scenario.episode.selectionAnchor.timestamp !== detectedAt - 2 * HOUR ||
    scenario.episode.pathContext.selectionAnchorPrice !== 80 ||
    scenario.episode.pathContext.selectionAnchorTime !== detectedAt - 2 * HOUR
  ) {
    throw new Error("Drop/rebound fixture did not preserve the frozen 80 anchor");
  }

  return scenario.fixture;
}

function buildContinuationFixture() {
  const detectedAt = Date.parse("2024-07-02T00:00:00Z") / 1_000;
  return createScenario({
    slug: "continuation",
    symbol: "SOLUSDT",
    detectedAt,
    radarPoints: [
      { openTime: detectedAt - 2 * HOUR, close: 100 },
      { openTime: detectedAt - HOUR, close: 120 },
    ],
    futurePoints: [
      { openTime: detectedAt, close: 145 },
      { openTime: detectedAt + HOUR, close: 170 },
    ],
    commands: [
      command("continuation:start", "StartSession", {}),
      command("continuation:wait-145", "Wait", {
        reason: "waiting_for_structure_break",
        thesis: "Review the first completed continuation candle",
        wakePlan: {
          scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
          conditions: [],
          deadlineAfterSeconds: 2 * HOUR,
        },
      }),
      command("continuation:wait-170", "Wait", {
        reason: "waiting_for_structure_break",
        thesis: "Review one additional completed continuation candle",
        wakePlan: {
          scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
          conditions: [],
          deadlineAfterSeconds: 2 * HOUR,
        },
      }),
      command("continuation:skip", "Skip", {
        reasons: ["higherTimeframeContinuationTooStrong"],
        thesis: "Continuation invalidates the fade thesis",
      }),
      command("continuation:reveal", "RevealOutcome", { abandonActive: false }),
    ],
    outcome: {
      lifecycleTimeline: [
        { knownAt: detectedAt, state: "developing" },
        { knownAt: detectedAt + HOUR, state: "invalidated" },
      ],
      radarTerminalResult: {
        scenario: "continuation",
        closePath: [100, 120, 145, 170],
      },
      maximumFavorablePriceExcursionFromDetected: 0,
      maximumAdversePriceExcursionFromDetected: 50,
      lifecycleStateTimestamps: {
        developing: detectedAt,
        invalidated: detectedAt + HOUR,
      },
    },
  }).fixture;
}

function createScenario({
  slug,
  symbol,
  detectedAt,
  radarPoints,
  futurePoints,
  commands,
  outcome,
}) {
  const strategyProfile = api.createImpulseFadeResearchProfile({
    id: `replay-example.${slug}.strategy`,
    version: "1",
    name: `Replay example ${slug} strategy`,
    timeframeRoles: {
      candidateTimeframe: "1h",
      structureTimeframe: "1h",
      executionTimeframe: "1h",
      triggerTimeframe: "1h",
      contextTimeframes: [],
    },
    createdAt: detectedAt - DAY,
  });
  const radarSelectionProfile = api.createRadarSelectionProfile({
    schemaVersion: api.RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
    id: `replay-example.${slug}.radar`,
    version: "1",
    name: `Replay example ${slug} radar`,
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [
      {
        id: "recent-trough-runup",
        type: "rollingTroughRunup",
        lookbackSeconds: 48 * HOUR,
        minimumRunupPct: 15,
        maximumTroughAgeSeconds: 48 * HOUR,
        referenceField: "close",
        minimumPercentile: null,
        minimumZScore: null,
        minimumSampleCount: 0,
        historyLookbackSeconds: ANALYSIS_DAYS * DAY,
      },
    ],
    detectorCombination: { mode: "any" },
    hardGates: [],
    resetPolicy: { minimumFalseDurationSeconds: 2 * HOUR },
    episodeExpiry: { maximumAgeSeconds: 6 * HOUR },
    sourcePolicy: { allowedSources: [SOURCE] },
    executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
    liquidityPolicy: {
      minimumQuoteNotional: null,
      windowSeconds: DAY,
      missingData: "warn",
    },
    createdAt: detectedAt - DAY,
  });
  const radarCandles = radarPoints.map(({ openTime, close }) =>
    createRadarCandle(openTime, close),
  );
  const scan = api.scanRadarEpisodes({
    candlesBySymbolAndTimeframe: {
      [symbol]: {
        symbol,
        source: SOURCE,
        dataOrigin: "generated-replay-example",
        candlesByTimeframe: { "1h": radarCandles },
      },
    },
    selectionProfile: radarSelectionProfile,
    strategyProfile,
    from: radarPoints[0].openTime,
    to: detectedAt,
  });
  if (scan.episodes.length !== 1 || scan.replayCaseManifests.length !== 1) {
    throw new Error(`${slug} must produce exactly one radar episode and replay manifest`);
  }

  const episode = scan.episodes[0];
  const manifest = scan.replayCaseManifests[0];
  const config = api.createReplaySessionConfig(
    {
      id: `replay-example.${slug}.session`,
      version: "1",
      schemaVersion: api.REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
      replayEngineVersion: api.REPLAY_ENGINE_VERSION,
      evaluationTimeframe: "1h",
      visibleTimeframes: ["1h"],
      displayPreRollByTimeframe: { "1h": 48 * HOUR },
      maximumCaseDuration: 6 * HOUR,
      maximumSingleWaitDuration: 4 * HOUR,
      defaultWaitDeadline: 2 * HOUR,
      allowedWakeConditionTypes: ALL_WAKE_CONDITIONS,
      completedCandlesOnly: true,
      identityPresentationMode: "full",
      allowEarlyReveal: false,
      allowOutOfStrategyPlans: false,
      allowDiscretionaryOverrides: true,
      endOnRadarEpisodeTerminal: false,
      endOnLifecycleTerminal: false,
      strategyProfileRef: {
        id: strategyProfile.id,
        version: strategyProfile.version,
        profileHash: strategyProfile.profileHash,
      },
      venueRulesRef: null,
    },
    strategyProfile,
  );

  // The Phase 1 loader currently verifies analysis span, not candle density.
  const analysisAnchor = createReplayCandle(
    symbol,
    detectedAt - ANALYSIS_DAYS * DAY,
    radarPoints[0].close,
  );
  const historicalCandles = radarPoints.map(({ openTime, close }) =>
    createReplayCandle(symbol, openTime, close),
  );
  const futureCandles = futurePoints.map(({ openTime, close }) =>
    createReplayCandle(symbol, openTime, close),
  );
  const analysisState = api.createReplayAnalysisStateObservation({
    symbol,
    source: SOURCE,
    knownAt: detectedAt,
    lifecycle: createLifecycleSnapshot(strategyProfile, detectedAt),
    candidateMetrics: null,
    structureByTimeframe: { "1h": null },
    activeStructureLevels: [],
    supportResistanceZones: [],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: [],
    dataQualityNotes: [],
  });
  const data = api.parseReplayJsonHistoricalDataFixture({
    schemaVersion: api.REPLAY_JSON_DATA_SCHEMA_VERSION,
    symbol,
    source: SOURCE,
    candles: [analysisAnchor, ...historicalCandles, ...futureCandles],
    candleRevisions: [],
    radarEpisodes: [episode],
    analysisStateHistory: [analysisState],
    knownEvents: [],
    venueEvidence: [],
    universeEvidence: [],
    revisionHistoryAvailable: true,
  });

  return {
    episode,
    fixture: {
      schemaVersion: "replay-audit-fixture.1",
      id: `replay-example.${slug}`,
      description: `Deterministic Replay Phase 1 ${slug} example`,
      manifest,
      config,
      profiles: {
        strategy: strategyProfile,
        radarSelection: radarSelectionProfile,
        venueRules: null,
      },
      data,
      commands,
      outcomes: {
        [manifest.id]: {
          futureCandlesByTimeframe: { "1h": futureCandles },
          lifecycleTimeline: outcome.lifecycleTimeline,
          radarTerminalResult: outcome.radarTerminalResult,
          maximumFavorablePriceExcursionFromDetected:
            outcome.maximumFavorablePriceExcursionFromDetected,
          maximumAdversePriceExcursionFromDetected:
            outcome.maximumAdversePriceExcursionFromDetected,
          lifecycleStateTimestamps: outcome.lifecycleStateTimestamps,
          dataQualityNotes: [],
        },
      },
    },
  };
}

function createReplayCandle(symbol, openTime, close) {
  return api.createReplayCandleRecord({
    symbol,
    source: SOURCE,
    timeframe: "1h",
    openTime,
    o: close,
    h: close,
    l: close,
    c: close,
    vBase: 1_000,
    vQuote: close * 1_000,
    revision: 1,
  });
}

function createRadarCandle(openTime, close) {
  return {
    ts: openTime,
    bucket: openTime,
    x: openTime,
    o: close,
    h: close,
    l: close,
    c: close,
    v_base: 1_000,
    v_quote: close * 1_000,
    knownAt: openTime + HOUR,
  };
}

function createLifecycleSnapshot(strategyProfile, asOf) {
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: strategyProfile.lifecycleVersion,
    lifecycleConfigHash: strategyProfile.lifecycleConfigHash,
    asOf,
    executionTimeframe: "1h",
    state: "notCandidate",
    currentState: "notCandidate",
    stateSince: asOf,
    label: "PUMP FADE NOT CANDIDATE",
    reason: "Deterministic replay example initial state",
    checks: [],
    updatedTs: asOf,
    candidate: null,
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

function command(id, type, payload) {
  return { id, type, payload };
}

async function writeFixture(path, fixture) {
  const canonical = JSON.parse(api.canonicalSerialize(fixture));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(canonical, null, 2)}\n`, "utf8");
}

function requireReplayApi() {
  const required = [
    "RADAR_SELECTION_PROFILE_SCHEMA_VERSION",
    "REPLAY_ENGINE_VERSION",
    "REPLAY_JSON_DATA_SCHEMA_VERSION",
    "REPLAY_SESSION_CONFIG_SCHEMA_VERSION",
    "canonicalSerialize",
    "createImpulseFadeResearchProfile",
    "createRadarSelectionProfile",
    "createReplayAnalysisStateObservation",
    "createReplayCandleRecord",
    "createReplaySessionConfig",
    "parseReplayJsonHistoricalDataFixture",
    "scanRadarEpisodes",
  ];
  const missing = required.filter((name) => typeof api[name] === "undefined");
  if (missing.length) {
    throw new Error(
      `dist/core.js is missing Replay Phase 1 exports (${missing.join(", ")}); run the package build after replay exports are integrated`,
    );
  }
}

function assertClose(actual, expected, label) {
  if (typeof actual !== "number" || Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${label} must be ${expected}, received ${actual}`);
  }
}

function resolveOutputPaths(options) {
  const outputDirectory = resolve(options.outputDirectory ?? "fixtures/generated");
  const dropRebound = resolve(
    options.dropReboundPath ?? resolve(outputDirectory, "replay-drop-rebound.json"),
  );
  const continuation = resolve(
    options.continuationPath ?? resolve(outputDirectory, "replay-continuation.json"),
  );
  if (dropRebound === continuation) throw new Error("Fixture output paths must be different");
  return { dropRebound, continuation };
}

function parseArguments(args) {
  const options = {
    outputDirectory: null,
    dropReboundPath: null,
    continuationPath: null,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--out-dir") options.outputDirectory = requireArgument(args, ++index, argument);
    else if (argument === "--drop-rebound") {
      options.dropReboundPath = requireArgument(args, ++index, argument);
    } else if (argument === "--continuation") {
      options.continuationPath = requireArgument(args, ++index, argument);
    } else {
      throw new Error(`Unknown option ${argument}`);
    }
  }
  return options;
}

function requireArgument(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a path`);
  return value;
}

function quoteArgument(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function printUsage() {
  console.log(`Usage: node scripts/generate-replay-examples.mjs [options]

Options:
  --out-dir <directory>       Output directory (default: fixtures/generated)
  --drop-rebound <file>       Explicit drop/rebound fixture path
  --continuation <file>       Explicit continuation fixture path
  -h, --help                  Show this help`);
}
