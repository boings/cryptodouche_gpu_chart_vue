import { describe, expect, it } from "vitest";
import type { SetupStateSnapshot } from "./indicators";
import type { CandleRecord } from "./types";
import {
  createRadarSelectionProfile,
  createExecutionVenueEligibilityObservation,
  createUniverseMembershipObservation,
  radarSelectionProfileHash,
  scanRadarEpisodes,
  createRadarStructureObservation,
  radarEpisodeObservationId,
  replayCaseManifestId,
  EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  type ElapsedWindowReturnDetector,
  type EmaAtrDisplacementDetector,
  type MaximumWindowReturnDetector,
  type RadarDetectorCombination,
  type RadarScanInput,
  type RadarSelectionProfileDefinition,
  type RollingTroughRunupDetector,
} from "./radar";
import {
  DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  strategyProfileHash,
} from "./strategy";

const HOUR = 3_600;
const DAY = 86_400;
const START = 1_699_992_000;

function candle(bucket: number, close: number): CandleRecord {
  return {
    ts: bucket,
    bucket,
    x: (bucket - START) / HOUR,
    o: close,
    h: close,
    l: close,
    c: close,
    v_base: 1_000,
    v_quote: close * 1_000,
  };
}

function profileDefinition(
  overrides: Partial<RadarSelectionProfileDefinition> = {},
): RadarSelectionProfileDefinition {
  return {
    schemaVersion: "radar-selection-profile.1",
    id: "impulse-fade-radar.test",
    version: "1",
    name: "Impulse Fade radar test profile",
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [troughDetector()],
    detectorCombination: { mode: "any" },
    hardGates: [],
    resetPolicy: { minimumFalseDurationSeconds: 2 * HOUR },
    episodeExpiry: { maximumAgeSeconds: 72 * HOUR },
    sourcePolicy: { allowedSources: ["bybit"] },
    executionVenuePolicy: {
      intendedVenue: "phemex",
      mode: "allowUnknown",
    },
    liquidityPolicy: {
      minimumQuoteNotional: null,
      windowSeconds: DAY,
      missingData: "warn",
    },
    createdAt: START,
    ...overrides,
  };
}

function troughDetector(
  overrides: Partial<RollingTroughRunupDetector> = {},
): RollingTroughRunupDetector {
  return {
    id: "recent-trough-runup",
    type: "rollingTroughRunup",
    lookbackSeconds: 48 * HOUR,
    minimumRunupPct: 15,
    maximumTroughAgeSeconds: 48 * HOUR,
    referenceField: "close",
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: 90 * DAY,
    ...overrides,
  };
}

function elapsedDetector(
  id: string,
  windowSeconds: number,
  minimumReturnPct: number,
): ElapsedWindowReturnDetector {
  return {
    id,
    type: "elapsedWindowReturn",
    windowSeconds,
    minimumReturnPct,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: 90 * DAY,
    maximumReferenceStalenessSeconds: null,
  };
}

function scan(
  candlesByTimeframe: Record<string, CandleRecord[]>,
  overrides: Partial<RadarSelectionProfileDefinition>,
  to: number,
  inputOverrides: Partial<RadarScanInput> = {},
) {
  return scanRadarEpisodes({
    candlesBySymbolAndTimeframe: {
      FILUSDT: {
        symbol: "FILUSDT",
        source: "bybit",
        dataOrigin: "external",
        candlesByTimeframe,
      },
    },
    selectionProfile: createRadarSelectionProfile(profileDefinition(overrides)),
    from: START - DAY,
    to,
    ...inputOverrides,
  });
}

function lifecycleSnapshot(
  overrides: Partial<SetupStateSnapshot> = {},
): SetupStateSnapshot {
  const lifecycleConfigHash = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE.lifecycleConfigHash;
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: "impulse_fade_v1.lifecycle.1",
    lifecycleConfigHash,
    asOf: START + 2 * HOUR,
    executionTimeframe: "15m",
    state: "developing",
    currentState: "developing",
    stateSince: START + 2 * HOUR,
    label: "PUMP FADE DEVELOPING",
    reason: "test",
    checks: [],
    updatedTs: START + 2 * HOUR,
    candidate: {
      id: "candidate:fil",
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: "impulse_fade_v1.lifecycle.1",
      lifecycleConfigHash,
      symbol: "FILUSDT",
      source: "bybit",
      venue: "bybit",
      executionTimeframe: "15m",
      detectedAt: START + HOUR,
      detectionEventTime: START,
      detectionMetrics: { returnPct: null, percentile: null, zScore: null, atrExtension: null },
      initialMtfContext: [],
      episodeHigh: 120,
      episodeHighTime: START + HOUR,
      currentState: "developing",
      stateSince: START + HOUR,
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
    ...overrides,
  };
}

describe("path-aware radar scanning", () => {
  it("selects a 100 to 80 to 92 rebound despite its negative 24h return", () => {
    const candles = [
      candle(START, 100),
      candle(START + 23 * HOUR, 80),
      candle(START + 24 * HOUR, 92),
    ];
    const result = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          dataOrigin: "external",
          candlesByTimeframe: { "1h": candles },
        },
      },
      selectionProfile: createRadarSelectionProfile(profileDefinition()),
      from: START,
      to: START + 25 * HOUR,
    });

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toMatchObject({
      symbol: "FILUSDT",
      source: "bybit",
      detectedAt: START + 25 * HOUR,
      triggeringDetectorIds: ["recent-trough-runup"],
      selectionAnchor: {
        price: 80,
        timestamp: START + 23 * HOUR,
      },
      executionVenueEligibility: {
        executionVenue: "phemex",
        status: "Unknown",
      },
    });
    expect(result.episodes[0].pathContext.net24hReturnPct).toBeCloseTo(-8, 12);
    expect(result.episodes[0].pathContext.triggeringLocalImpulseReturnPct).toBeCloseTo(15, 12);
    expect(result.episodes[0].pathContext.priorDrawdownPct).toBeCloseTo(-20, 12);
    expect(result.episodes[0].pathContext.recoveryFraction).toBeCloseTo(0.6, 12);
  });

  it("records a qualifying 4h move when its net 24h path is negative", () => {
    const candles = [
      candle(START - 20 * HOUR, 115),
      ...Array.from({ length: 8 }, (_, index) => candle(START - (4 - index) * HOUR, 100)),
      candle(START + 4 * HOUR, 110),
    ];
    const result = scan(
      { "1h": candles },
      { moveDetectors: [elapsedDetector("four-hour-return", 4 * HOUR, 8)] },
      START + 5 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0].triggeringDetectorIds).toEqual(["four-hour-return"]);
    expect(result.episodes[0].triggeringObservations[0].window).toBe(4 * HOUR);
    expect(result.episodes[0].pathContext.net24hReturnPct).toBeLessThan(0);
  });

  it("retains every maximum-window observation and records the winning window", () => {
    const detector: MaximumWindowReturnDetector = {
      id: "maximum-local-return",
      type: "maximumWindowReturn",
      windowsSeconds: [2 * HOUR, 4 * HOUR],
      minimumReturnPct: 5,
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 0,
      historyLookbackSeconds: 90 * DAY,
      maximumReferenceStalenessSeconds: null,
    };
    const result = scan(
      {
        "1h": [
          candle(START - 4 * HOUR, 100),
          candle(START - 3 * HOUR, 100),
          candle(START - 2 * HOUR, 100),
          candle(START - HOUR, 100),
          candle(START, 100),
          candle(START + HOUR, 101),
          candle(START + 2 * HOUR, 102),
          candle(START + 3 * HOUR, 104),
          candle(START + 4 * HOUR, 110),
        ],
      },
      { moveDetectors: [detector] },
      START + 5 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0].pathContext.triggeringWindowSeconds).toBe(4 * HOUR);
    expect(
      result.observations
        .filter(
          (item) =>
            item.metricCode === "elapsed_window_return" &&
            item.effectiveAsOf === START + 5 * HOUR &&
            [2 * HOUR, 4 * HOUR].includes(item.window ?? 0),
        )
        .map((item) => item.window)
        .sort((left, right) => (left ?? 0) - (right ?? 0)),
    ).toEqual([2 * HOUR, 4 * HOUR]);
    expect(
      result.observations.some(
        (item) => item.metricCode === "maximum_window_return" && item.window === 4 * HOUR,
      ),
    ).toBe(true);
  });

  it("keeps one maximum-window logical ID when the winning window changes", () => {
    const detector: MaximumWindowReturnDetector = {
      id: "maximum-local-return",
      type: "maximumWindowReturn",
      windowsSeconds: [HOUR, 2 * HOUR],
      minimumReturnPct: 100,
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 0,
      historyLookbackSeconds: 90 * DAY,
      maximumReferenceStalenessSeconds: null,
    };
    const result = scan(
      {
        "1h": [
          candle(START - 2 * HOUR, 100),
          candle(START - HOUR, 100),
          candle(START, 100),
          candle(START + HOUR, 110),
          candle(START + 2 * HOUR, 120),
        ],
      },
      { moveDetectors: [detector] },
      START + 3 * HOUR,
    );
    const aggregate = result.observations.filter(
      (item) => item.metricCode === "maximum_window_return" && item.effectiveAsOf >= START + 2 * HOUR,
    );

    expect(aggregate.map((item) => item.window)).toEqual([HOUR, 2 * HOUR]);
    expect(new Set(aggregate.map((item) => item.logicalObjectId)).size).toBe(1);
    expect(new Set(aggregate.map((item) => item.observationId)).size).toBe(2);
  });

  it("does not use a higher-timeframe candle until that candle closes", () => {
    const detector: EmaAtrDisplacementDetector = {
      id: "four-hour-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: "4h",
      emaPeriod: 2,
      atrPeriod: 2,
      minimumAtrDisplacement: 0.5,
      minimumSampleCount: 2,
    };
    const scanCandles = Array.from({ length: 8 }, (_, index) => candle(START + index * HOUR, 100));
    const fourHourCandles = [
      candle(START - 8 * HOUR, 100),
      candle(START - 4 * HOUR, 99),
      candle(START, 100),
      candle(START + 4 * HOUR, 120),
    ];
    const beforeClose = scan(
      { "1h": scanCandles, "4h": fourHourCandles },
      { moveDetectors: [detector] },
      START + 7 * HOUR,
    );
    const atClose = scan(
      { "1h": scanCandles, "4h": fourHourCandles },
      { moveDetectors: [detector] },
      START + 8 * HOUR,
    );

    expect(beforeClose.episodes).toHaveLength(0);
    expect(atClose.episodes).toHaveLength(1);
    expect(atClose.episodes[0].detectedAt).toBe(START + 8 * HOUR);
  });

  it.each([
    [{ mode: "any" } as RadarDetectorCombination, true],
    [{ mode: "all" } as RadarDetectorCombination, false],
    [{ mode: "atLeast", count: 1 } as RadarDetectorCombination, true],
    [{ mode: "atLeast", count: 2 } as RadarDetectorCombination, false],
  ])("applies %o detector composition deterministically", (detectorCombination, expected) => {
    const result = scan(
      {
        "1h": [candle(START, 100), candle(START + 2 * HOUR, 110)],
      },
      {
        moveDetectors: [
          elapsedDetector("passes", 2 * HOUR, 5),
          elapsedDetector("fails", 2 * HOUR, 20),
        ],
        detectorCombination,
      },
      START + 3 * HOUR,
    );

    expect(result.gateEvaluations.at(-1)?.compositePassed).toBe(expected);
  });

  it("does not create episodes in a flat market", () => {
    const candles = Array.from({ length: 100 }, (_, index) =>
      candle(START + index * HOUR, 100),
    );

    expect(scan({ "1h": candles }, {}, START + 100 * HOUR).episodes).toHaveLength(0);
  });

  it("creates no early episode and is unchanged when future candles are removed", () => {
    const prefix = [
      candle(START - 2 * HOUR, 100),
      candle(START, 100),
      candle(START + HOUR, 105),
      candle(START + 2 * HOUR, 111),
    ];
    const full = scan(
      { "1h": [...prefix, candle(START + 3 * HOUR, 140)] },
      { moveDetectors: [elapsedDetector("two-hour-return", 2 * HOUR, 10)] },
      START + 3 * HOUR,
    );
    const truncated = scan(
      { "1h": prefix },
      { moveDetectors: [elapsedDetector("two-hour-return", 2 * HOUR, 10)] },
      START + 3 * HOUR,
    );

    expect(full.episodes).toEqual(truncated.episodes);
    expect(full.episodes[0].detectedAt).toBe(START + 3 * HOUR);
    expect(
      full.gateEvaluations.filter((item) => item.asOf < START + 3 * HOUR),
    ).toSatisfy((items: typeof full.gateEvaluations) => items.every((item) => !item.compositePassed));
  });

  it("produces deeply equal cutoff results for full and physically truncated history", () => {
    const prefix = [
      candle(START, 100),
      candle(START + HOUR, 90),
      candle(START + 2 * HOUR, 108),
    ];
    const profile = createRadarSelectionProfile(profileDefinition());
    const baseInput = {
      selectionProfile: profile,
      from: START,
      to: START + 3 * HOUR,
    } as const;
    const truncated = scanRadarEpisodes({
      ...baseInput,
      candlesBySymbolAndTimeframe: {
        FILUSDT: { symbol: "FILUSDT", source: "bybit", candlesByTimeframe: { "1h": prefix } },
      },
    });
    const full = scanRadarEpisodes({
      ...baseInput,
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          candlesByTimeframe: { "1h": [...prefix, candle(START + 3 * HOUR, 160)] },
        },
      },
    });

    expect(full).toEqual(truncated);
  });

  it("creates one episode while the radar gate remains continuously true", () => {
    const candles = [100, 120, 125, 130, 135].map((close, index) =>
      candle(START + index * HOUR, close),
    );
    const result = scan({ "1h": candles }, {}, START + 5 * HOUR);

    expect(result.episodes).toHaveLength(1);
    expect(result.episodeStatusObservations.filter((item) => item.reason === "detected")).toHaveLength(1);
  });

  it("warms episode state near the requested range without replaying all analysis history", () => {
    const from = START + 200 * DAY;
    const history = Array.from({ length: 200 * 24 - 4 }, (_, index) =>
      candle(START + index * HOUR, 100),
    );
    const candles = [
      ...history,
      candle(from - 4 * HOUR, 80),
      candle(from - 3 * HOUR, 92),
      candle(from - 2 * HOUR, 92),
      candle(from - HOUR, 92),
      candle(from, 92),
      candle(from + HOUR, 92),
    ];
    const result = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          candlesByTimeframe: { "1h": candles },
        },
      },
      selectionProfile: createRadarSelectionProfile(profileDefinition()),
      from,
      to: from + 2 * HOUR,
    });

    expect(result.episodes).toHaveLength(0);
    expect(result.gateEvaluations).toHaveLength(3);
    expect(result.gateEvaluations.every((item) => item.compositePassed)).toBe(true);
  });

  it("requires a continuous false duration before rearming a later crossing", () => {
    const candles = [100, 120, 121, 100, 100, 120].map((close, index) =>
      candle(START + index * HOUR, close),
    );
    const result = scan(
      { "1h": candles },
      {
        moveDetectors: [
          troughDetector({ lookbackSeconds: 2 * HOUR, maximumTroughAgeSeconds: 2 * HOUR }),
        ],
        resetPolicy: { minimumFalseDurationSeconds: HOUR },
      },
      START + 6 * HOUR,
    );

    expect(result.episodes).toHaveLength(2);
    expect(result.episodes.map((item) => item.detectedAt)).toEqual([
      START + 2 * HOUR,
      START + 6 * HOUR,
    ]);
    expect(result.episodes[0].id).not.toBe(result.episodes[1].id);
    expect(result.episodeStatusObservations.some((item) => item.reason === "radarGateReset")).toBe(true);
  });

  it("does not infer a continuous false reset across missing scan candles", () => {
    const result = scan(
      {
        "1h": [
          candle(START, 100),
          candle(START + HOUR, 120),
          candle(START + 2 * HOUR, 100),
          candle(START + 10 * HOUR, 100),
          candle(START + 11 * HOUR, 120),
        ],
      },
      {
        moveDetectors: [
          troughDetector({ lookbackSeconds: 2 * HOUR, maximumTroughAgeSeconds: 2 * HOUR }),
        ],
        resetPolicy: { minimumFalseDurationSeconds: 4 * HOUR },
      },
      START + 12 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodeStatusObservations.some((item) => item.reason === "radarGateReset")).toBe(false);
  });

  it("does not use a trough older than the configured maximum age", () => {
    const result = scan(
      { "1h": [candle(START, 80), candle(START + 3 * HOUR, 92)] },
      {
        moveDetectors: [
          troughDetector({ lookbackSeconds: 48 * HOUR, maximumTroughAgeSeconds: 2 * HOUR }),
        ],
      },
      START + 4 * HOUR,
    );

    expect(result.episodes).toHaveLength(0);
    expect(result.gateEvaluations.at(-1)?.detectorResults[0].passed).toBe(false);
  });

  it("does not create an episode from an intrabar threshold crossing", () => {
    const candles = [candle(START, 100), candle(START + HOUR, 120)];
    const beforeClose = scan({ "1h": candles }, {}, START + HOUR + 1_800);
    const afterClose = scan({ "1h": candles }, {}, START + 2 * HOUR);

    expect(beforeClose.episodes).toHaveLength(0);
    expect(afterClose.episodes).toHaveLength(1);
  });

  it("makes insufficient statistical history explicit and non-passing", () => {
    const detector = elapsedDetector("percentile-gate", HOUR, 1);
    detector.minimumPercentile = 95;
    detector.minimumZScore = 2;
    detector.minimumSampleCount = 20;
    const result = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
      { moveDetectors: [detector], hardGates: ["dataQuality"] },
      START + 2 * HOUR,
    );
    const latest = result.observations.find(
      (item) => item.metricCode === "elapsed_window_return" && item.effectiveAsOf === START + 2 * HOUR,
    );

    expect(result.episodes).toHaveLength(0);
    expect(latest).toMatchObject({ percentile: null, zScore: null, sampleCount: 0 });
    expect(latest?.dataQualityNotes.map((item) => item.code)).toContain(
      "INSUFFICIENT_METRIC_HISTORY",
    );
  });

  it("applies point-in-time execution-venue eligibility without current-listing leakage", () => {
    const candles = [candle(START, 100), candle(START + HOUR, 120)];
    const detectedAt = START + 2 * HOUR;
    const unavailable = createExecutionVenueEligibilityObservation({
      symbol: "FILUSDT",
      marketDataSource: "bybit",
      executionVenue: "phemex",
      status: "Unavailable",
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
      evidenceSource: "historical-listing-fixture",
      dataQualityNotes: [],
    });
    const futureAvailable = createExecutionVenueEligibilityObservation({
      symbol: "FILUSDT",
      marketDataSource: "bybit",
      executionVenue: "phemex",
      status: "Available",
      effectiveFrom: detectedAt + DAY,
      effectiveTo: null,
      knownAt: detectedAt + DAY,
      evidenceSource: "current-listing-fixture",
      dataQualityNotes: [],
    });
    const requiredProfile = {
      hardGates: ["executionVenueEligibility" as const],
      executionVenuePolicy: { intendedVenue: "phemex", mode: "requireKnownAvailable" as const },
    };
    const unavailableResult = scan(
      { "1h": candles },
      requiredProfile,
      detectedAt,
      { venueEligibilityHistory: [unavailable] },
    );
    const futureResult = scan(
      { "1h": candles },
      requiredProfile,
      detectedAt,
      { venueEligibilityHistory: [futureAvailable] },
    );
    const unknownAllowed = scan(
      { "1h": candles },
      {
        hardGates: ["executionVenueEligibility"],
        executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
      },
      detectedAt,
    );

    expect(unavailableResult.episodes).toHaveLength(0);
    expect(futureResult.episodes).toHaveLength(0);
    expect(futureResult.gateEvaluations.at(-1)?.hardGateResults[0]).toMatchObject({
      passed: false,
      explanation: "Execution venue Unknown",
    });
    expect(unknownAllowed.episodes).toHaveLength(1);
    expect(unknownAllowed.episodes[0].executionVenueEligibility.status).toBe("Unknown");
  });

  it("uses durable metric IDs and changes revisions with cutoff or config", () => {
    const candles = [candle(START, 100), candle(START + HOUR, 120), candle(START + 2 * HOUR, 130)];
    const first = scan({ "1h": candles }, {}, START + 2 * HOUR);
    const repeated = scan({ "1h": candles }, {}, START + 2 * HOUR);
    const later = scan({ "1h": candles }, {}, START + 3 * HOUR);
    const changed = scan(
      { "1h": candles },
      { moveDetectors: [troughDetector({ minimumRunupPct: 16 })] },
      START + 2 * HOUR,
    );
    const firstMetric = first.observations.find((item) => item.metricCode === "rolling_trough_runup")!;
    const repeatedMetric = repeated.observations.find((item) => item.metricCode === "rolling_trough_runup")!;
    const laterMetric = later.observations.find(
      (item) => item.metricCode === "rolling_trough_runup" && item.effectiveAsOf === START + 3 * HOUR,
    )!;
    const changedMetric = changed.observations.find((item) => item.metricCode === "rolling_trough_runup")!;

    expect(firstMetric).toEqual(repeatedMetric);
    expect(firstMetric.observationId).toBe(repeatedMetric.observationId);
    expect(laterMetric.observationId).not.toBe(firstMetric.observationId);
    expect(changedMetric.logicalObjectId).not.toBe(firstMetric.logicalObjectId);
    expect(changedMetric.observationId).not.toBe(firstMetric.observationId);
  });

  it("keeps detection artifacts identical for divergent future paths", () => {
    const prefix = [candle(START, 100), candle(START + HOUR, 120)];
    const continuation = scan(
      { "1h": [...prefix, candle(START + 2 * HOUR, 150)] },
      {},
      START + 3 * HOUR,
    );
    const reversal = scan(
      { "1h": [...prefix, candle(START + 2 * HOUR, 80)] },
      {},
      START + 3 * HOUR,
    );

    expect(continuation.episodes[0]).toEqual(reversal.episodes[0]);
    expect(continuation.replayCaseManifests[0]).toEqual(reversal.replayCaseManifests[0]);
    expect(continuation.replayCaseManifests[0]).toMatchObject({
      startAsOf: START + 2 * HOUR,
      futureOutcomeRef: null,
    });
  });

  it("retains a qualifying pump that continues upward", () => {
    const result = scan(
      {
        "1h": [
          candle(START, 100),
          candle(START + HOUR, 120),
          candle(START + 2 * HOUR, 145),
          candle(START + 3 * HOUR, 170),
        ],
      },
      {},
      START + 4 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0].detectedAt).toBe(START + 2 * HOUR);
    expect(result.replayCaseManifests).toHaveLength(1);
  });

  it("labels the bundled research profile as experimental and unoptimized", () => {
    expect(EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE).toMatchObject({
      id: "impulse_fade_v1.radar.experimental",
      version: "1",
      schemaVersion: "radar-selection-profile.1",
    });
    expect(EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE.name.toLowerCase()).toContain("unoptimized");
  });

  it("serializes immutable detection artifacts and rejects a tampered profile hash", () => {
    const profile = createRadarSelectionProfile(profileDefinition());
    const input: RadarScanInput = {
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          dataOrigin: "external",
          candlesByTimeframe: {
            "1h": [candle(START, 100), candle(START + HOUR, 120)],
          },
        },
      },
      selectionProfile: profile,
      from: START,
      to: START + 2 * HOUR,
    };
    const result = scanRadarEpisodes(input);
    const roundTripped = JSON.parse(JSON.stringify(result));

    expect(roundTripped).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.episodes[0])).toBe(true);
    expect(result.episodes[0]).toMatchObject({
      schemaVersion: "radar-episode.1",
      selectionProfileId: profile.id,
      selectionProfileVersion: profile.version,
      selectionProfileHash: profile.canonicalConfigHash,
      selectionGateEvaluationId: expect.stringMatching(/^radar-gate:/),
    });
    expect(result.replayCaseManifests[0]).toMatchObject({
      schemaVersion: "replay-case-manifest.1",
      selectionProfileRef: {
        id: profile.id,
        version: profile.version,
        canonicalConfigHash: profile.canonicalConfigHash,
      },
      lifecycleVersion: "impulse_fade_v1.lifecycle.1",
      futureOutcomeRef: null,
    });
    expect(replayCaseManifestId(result.replayCaseManifests[0])).toBe(
      result.replayCaseManifests[0].id,
    );
    expect(radarEpisodeObservationId(result.episodes[0])).toBe(
      result.episodes[0].observationId,
    );

    const tampered = JSON.parse(JSON.stringify(profile));
    tampered.moveDetectors[0].minimumRunupPct = 1;
    expect(() => scanRadarEpisodes({ ...input, selectionProfile: tampered })).toThrow(
      "hash verification",
    );
  });

  it("does not rearm from one noisy false candle", () => {
    const candles = [100, 120, 100, 120].map((close, index) =>
      candle(START + index * HOUR, close),
    );
    const result = scan(
      { "1h": candles },
      { resetPolicy: { minimumFalseDurationSeconds: 2 * HOUR } },
      START + 4 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodeStatusObservations.some((item) => item.reason === "radarGateReset")).toBe(false);
  });

  it("expires an episode without rearming while the radar gate remains true", () => {
    const candles = [100, 120, 125, 130, 135].map((close, index) =>
      candle(START + index * HOUR, close),
    );
    const result = scan(
      { "1h": candles },
      { episodeExpiry: { maximumAgeSeconds: 2 * HOUR } },
      START + 5 * HOUR,
    );

    expect(result.episodes).toHaveLength(1);
    expect(result.episodeStatusObservations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "expired", reason: "maximumAgeElapsed" }),
      ]),
    );
  });

  it("captures only structure observations known at detection", () => {
    const known = createRadarStructureObservation({
      logicalObjectId: "fil-structure-1h",
      symbol: "FILUSDT",
      source: "bybit",
      timeframe: "1h",
      state: "Bullish",
      eventTime: START,
      knownAt: START + HOUR,
      snapshot: { trend: "up" },
    });
    const future = createRadarStructureObservation({
      logicalObjectId: "fil-structure-4h",
      symbol: "FILUSDT",
      source: "bybit",
      timeframe: "4h",
      state: "Bearish",
      eventTime: START + 2 * HOUR,
      knownAt: START + 3 * HOUR,
      snapshot: { trend: "down" },
    });
    const result = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
      {},
      START + 2 * HOUR,
      { structureHistory: [known, future] },
    );

    expect(Object.keys(result.episodes[0].initialMtfStructure)).toEqual(["1h"]);
    expect(result.episodes[0].initialMtfStructure["1h"]).toMatchObject({
      logicalObjectId: "fil-structure-1h",
      objectType: "MarketStructure",
      snapshot: { state: "Bullish", detail: { trend: "up" } },
    });
    expect(result.episodes[0].pathContext.mtfStructureStates).toEqual({ "1h": "Bullish" });
  });

  it("changes a metric revision ID when cutoff-resolved candle data changes", () => {
    const first = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
      {},
      START + 2 * HOUR,
    );
    const corrected = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 121)] },
      {},
      START + 2 * HOUR,
    );
    const firstObservation = first.observations.find(
      (item) =>
        item.metricCode === "rolling_trough_runup" && item.effectiveAsOf === START + 2 * HOUR,
    )!;
    const correctedObservation = corrected.observations.find(
      (item) =>
        item.metricCode === "rolling_trough_runup" && item.effectiveAsOf === START + 2 * HOUR,
    )!;

    expect(correctedObservation.logicalObjectId).toBe(firstObservation.logicalObjectId);
    expect(correctedObservation.observationId).not.toBe(firstObservation.observationId);
  });

  it("applies candle corrections only after their publication cutoff", () => {
    const original = { ...candle(START, 100), knownAt: START + HOUR };
    const correction = { ...candle(START, 90), knownAt: START + 3 * HOUR, ver: 2 };
    const history = [
      candle(START - HOUR, 100),
      original,
      correction,
      candle(START + HOUR, 110),
      candle(START + 2 * HOUR, 110),
    ];
    const beforeCorrection = scan(
      { "1h": history },
      {},
      START + 2 * HOUR,
    );
    const physicallyTruncated = scan(
      { "1h": history.filter((item) => item !== correction) },
      {},
      START + 2 * HOUR,
    );
    const afterCorrection = scan(
      { "1h": history },
      {},
      START + 3 * HOUR,
    );
    const before = beforeCorrection.observations.find(
      (item) =>
        item.metricCode === "rolling_trough_runup" &&
        item.requestedAsOf === START + 2 * HOUR,
    )!;
    const after = afterCorrection.observations.find(
      (item) =>
        item.metricCode === "rolling_trough_runup" &&
        item.requestedAsOf === START + 3 * HOUR,
    )!;
    const preservedBeforeRequest = afterCorrection.observations.find(
      (item) => item.requestId === before.requestId,
    );

    expect(beforeCorrection).toEqual(physicallyTruncated);
    expect(preservedBeforeRequest).toEqual(before);
    expect(before.value).toBeCloseTo(10);
    expect(before.knownAt).toBe(START + 2 * HOUR);
    expect(after.value).toBeCloseTo((110 / 90 - 1) * 100);
    expect(after.knownAt).toBe(START + 3 * HOUR);
    expect(after.logicalObjectId).toBe(before.logicalObjectId);
    expect(after.observationId).not.toBe(before.observationId);
    expect(afterCorrection.episodes[0].detectedAt).toBe(START + 3 * HOUR);
  });

  it("rejects conflicting same-bucket candles instead of using array order", () => {
    expect(() =>
      scan(
        { "1h": [candle(START, 100), candle(START, 101), candle(START + HOUR, 120)] },
        {},
        START + 2 * HOUR,
      ),
    ).toThrow("Conflicting candle revisions");
  });

  it("ignores conflicting and future-only candle data beyond the scan cutoff", () => {
    const profile = createRadarSelectionProfile(profileDefinition());
    const prefix = [candle(START, 100), candle(START + HOUR, 120)];
    const base = {
      selectionProfile: profile,
      from: START,
      to: START + 2 * HOUR,
    } as const;
    const truncated = scanRadarEpisodes({
      ...base,
      candlesBySymbolAndTimeframe: {
        FILUSDT: { symbol: "FILUSDT", source: "bybit", candlesByTimeframe: { "1h": prefix } },
      },
    });
    const futureBucket = START + 10 * HOUR;
    const full = scanRadarEpisodes({
      ...base,
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          candlesByTimeframe: {
            "1h": [...prefix, candle(futureBucket, 130), candle(futureBucket, 140)],
            "4h": [candle(START + 4 * HOUR, 200)],
          },
        },
      },
    });

    expect(full).toEqual(truncated);
    expect(full.replayCaseManifests[0].availableTimeframes).toEqual(["1h"]);
  });

  it("does not invent a crossing when the first evaluable gate is already true", () => {
    const result = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
      { moveDetectors: [elapsedDetector("one-hour-return", HOUR, 10)] },
      START + 2 * HOUR,
    );

    expect(result.gateEvaluations.at(-1)).toMatchObject({ evaluable: true, compositePassed: true });
    expect(result.episodes).toHaveLength(0);
  });

  it("reuses higher-timeframe metric identity until a new candle closes", () => {
    const detector: EmaAtrDisplacementDetector = {
      id: "four-hour-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: "4h",
      emaPeriod: 2,
      atrPeriod: 2,
      minimumAtrDisplacement: 100,
      minimumSampleCount: 2,
    };
    const scanCandles = Array.from({ length: 11 }, (_, index) =>
      candle(START + index * HOUR, 100),
    );
    const fourHourCandles = [
      candle(START - 8 * HOUR, 100),
      candle(START - 4 * HOUR, 99),
      candle(START, 100),
      candle(START + 4 * HOUR, 101),
    ];
    const result = scan(
      { "1h": scanCandles, "4h": fourHourCandles },
      { moveDetectors: [detector] },
      START + 11 * HOUR,
    );
    const ids = result.gateEvaluations
      .filter((item) => item.asOf >= START + 8 * HOUR)
      .map((item) => item.detectorResults[0].observationIds[0]);
    const requests = result.observations.filter((item) => item.observationId === ids[0]);

    expect(new Set(ids).size).toBe(1);
    expect(requests.map((item) => item.requestedAsOf)).toEqual([
      START + 8 * HOUR,
      START + 9 * HOUR,
      START + 10 * HOUR,
      START + 11 * HOUR,
    ]);
    expect(new Set(requests.map((item) => item.requestId)).size).toBe(4);
    expect(requests.every((item) => item.effectiveAsOf === START + 8 * HOUR)).toBe(true);
    expect(requests.every((item) => item.knownAt === START + 8 * HOUR)).toBe(true);

    const revised = fourHourCandles.map((item, index) =>
      index === fourHourCandles.length - 1 ? { ...item, ver: 2 } : item,
    );
    const revisedResult = scan(
      { "1h": scanCandles, "4h": revised },
      { moveDetectors: [detector] },
      START + 11 * HOUR,
    );
    expect(revisedResult.gateEvaluations.at(-1)?.detectorResults[0].observationIds[0]).not.toBe(
      ids[0],
    );
  });

  it("validates self-consistently rehashed radar and strategy profiles", () => {
    const profile = createRadarSelectionProfile(profileDefinition());
    const invalidRadar = {
      ...profile,
      hardGates: ["not-a-hard-gate"],
    } as unknown as typeof profile;
    invalidRadar.canonicalConfigHash = radarSelectionProfileHash(invalidRadar);
    const input: RadarScanInput = {
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          candlesByTimeframe: { "1h": [candle(START, 100)] },
        },
      },
      selectionProfile: invalidRadar,
      from: START,
      to: START + HOUR,
    };
    expect(() => scanRadarEpisodes(input)).toThrow("unsupported hard gate");

    const invalidStrategy = {
      ...DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
      side: "long",
    } as unknown as typeof DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;
    invalidStrategy.profileHash = strategyProfileHash(invalidStrategy);
    expect(() =>
      scanRadarEpisodes({
        ...input,
        selectionProfile: profile,
        strategyProfile: invalidStrategy,
      }),
    ).toThrow("supports only the short Impulse Fade");
  });

  it("rejects future-contaminated, mismatched, and conflicting lifecycle context", () => {
    const candles = [candle(START, 100), candle(START + HOUR, 120)];
    const futureEvidence = lifecycleSnapshot({
      evidence: [
        {
          id: "future-evidence",
          code: "future",
          explanation: "not yet known",
          eventTime: START + 3 * HOUR,
          knownAt: START + 3 * HOUR,
          sourceTimeframe: "1h",
        },
      ],
    });
    expect(() =>
      scan({ "1h": candles }, {}, START + 2 * HOUR, {
        lifecycleHistory: { FILUSDT: [futureEvidence] },
      }),
    ).toThrow("exceeds the radar cutoff");

    const mismatched = lifecycleSnapshot({
      candidate: {
        id: "candidate:wrong",
        setupFamily: "impulse_fade_v1",
        lifecycleVersion: "impulse_fade_v1.lifecycle.1",
        lifecycleConfigHash: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE.lifecycleConfigHash,
        symbol: "ARBUSDT",
        source: "bybit",
        venue: "bybit",
        executionTimeframe: "15m",
        detectedAt: START + HOUR,
        detectionEventTime: START,
        detectionMetrics: { returnPct: null, percentile: null, zScore: null, atrExtension: null },
        initialMtfContext: [],
        episodeHigh: 120,
        episodeHighTime: START + HOUR,
        currentState: "developing",
        stateSince: START + HOUR,
        terminalAt: null,
      },
    });
    expect(() =>
      scan({ "1h": candles }, {}, START + 2 * HOUR, {
        lifecycleHistory: { FILUSDT: [mismatched] },
      }),
    ).toThrow("does not match the radar series");

    expect(() =>
      scan({ "1h": candles }, {}, START + 2 * HOUR, {
        lifecycleHistory: {
          FILUSDT: [
            lifecycleSnapshot(),
            lifecycleSnapshot({ state: "deteriorating", currentState: "deteriorating" }),
          ],
        },
      }),
    ).toThrow("Conflicting lifecycle snapshots");
  });

  it("binds active lifecycle context to the manifest strategy profile", () => {
    const candles = [candle(START, 100), candle(START + HOUR, 120)];
    const mismatchedConfig = "different-lifecycle-config";
    const mismatched = lifecycleSnapshot({
      lifecycleConfigHash: mismatchedConfig,
      candidate: {
        ...lifecycleSnapshot().candidate!,
        lifecycleConfigHash: mismatchedConfig,
      },
    });
    expect(() =>
      scan({ "1h": candles }, {}, START + 2 * HOUR, {
        lifecycleHistory: { FILUSDT: [mismatched] },
      }),
    ).toThrow("manifest strategy profile");

    const ignoredCandidateLess = lifecycleSnapshot({
      lifecycleConfigHash: mismatchedConfig,
      candidate: null,
    });
    const result = scan({ "1h": candles }, {}, START + 2 * HOUR, {
      lifecycleHistory: { FILUSDT: [ignoredCandidateLess] },
    });
    expect(result.episodes[0]).toMatchObject({
      initialLifecycleCandidateId: null,
      initialLifecycleState: null,
      initialLifecycleStateRef: null,
    });
  });

  it("keeps execution venue eligibility independent of the candle source", () => {
    const eligibility = createExecutionVenueEligibilityObservation({
      symbol: "FILUSDT",
      marketDataSource: "bybit",
      executionVenue: "phemex",
      status: "Available",
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
      evidenceSource: "listing-history",
      dataQualityNotes: [],
    });
    const profile = createRadarSelectionProfile(
      profileDefinition({
        sourcePolicy: { allowedSources: ["binance"] },
        hardGates: ["executionVenueEligibility"],
        executionVenuePolicy: { intendedVenue: "phemex", mode: "requireKnownAvailable" },
      }),
    );
    const result = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "binance",
          candlesByTimeframe: { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
        },
      },
      selectionProfile: profile,
      venueEligibilityHistory: [eligibility],
      from: START,
      to: START + 2 * HOUR,
    });

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toMatchObject({
      source: "binance",
      executionVenueEligibility: { marketDataSource: "bybit", executionVenue: "phemex" },
    });
  });

  it("rejects conflicting point-in-time gate evidence and preserves selected evidence", () => {
    const available = createExecutionVenueEligibilityObservation({
      symbol: "FILUSDT",
      marketDataSource: "bybit",
      executionVenue: "phemex",
      status: "Available",
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
      evidenceSource: "listing-history-a",
      dataQualityNotes: [],
    });
    const unavailable = createExecutionVenueEligibilityObservation({
      symbol: "FILUSDT",
      marketDataSource: "bybit",
      executionVenue: "phemex",
      status: "Unavailable",
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
      evidenceSource: "listing-history-b",
      dataQualityNotes: [],
    });
    const required = {
      hardGates: ["executionVenueEligibility" as const],
      executionVenuePolicy: { intendedVenue: "phemex", mode: "requireKnownAvailable" as const },
    };
    expect(() =>
      scan(
        { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
        required,
        START + 2 * HOUR,
        { venueEligibilityHistory: [available, unavailable] },
      ),
    ).toThrow("Conflicting execution-venue eligibility");

    const membership = createUniverseMembershipObservation({
      symbol: "FILUSDT",
      source: "bybit",
      included: true,
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
    });
    const excludedMembership = createUniverseMembershipObservation({
      symbol: "FILUSDT",
      source: "bybit",
      included: false,
      effectiveFrom: START,
      effectiveTo: null,
      knownAt: START,
    });
    expect(() =>
      scan(
        { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
        { hardGates: ["selectedUniverse"] },
        START + 2 * HOUR,
        { universeHistory: [membership, excludedMembership] },
      ),
    ).toThrow("Conflicting universe membership");

    const result = scan(
      { "1h": [candle(START, 100), candle(START + HOUR, 120)] },
      {
        hardGates: ["dataQuality", "liquidity", "selectedUniverse", "executionVenueEligibility"],
        executionVenuePolicy: { intendedVenue: "phemex", mode: "requireKnownAvailable" },
      },
      START + 2 * HOUR,
      { venueEligibilityHistory: [available], universeHistory: [membership] },
    );
    const episode = result.episodes[0];
    const evidenceIds = episode.hardGateEvidence.map((item) => item.observationId);

    expect(episode.hardGateResults.every((item) => item.evidenceObservationIds.length > 0)).toBe(
      true,
    );
    expect(episode.hardGateResults.flatMap((item) => item.evidenceObservationIds)).toSatisfy(
      (ids: string[]) => ids.every((id) => evidenceIds.includes(id)),
    );
    expect(result.replayCaseManifests[0].initialHardGateEvidence).toEqual(
      episode.hardGateEvidence,
    );
  });

  it("does not emit status records for episodes omitted before the requested range", () => {
    const profile = createRadarSelectionProfile(
      profileDefinition({ episodeExpiry: { maximumAgeSeconds: 2 * HOUR } }),
    );
    const result = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "bybit",
          candlesByTimeframe: {
            "1h": [100, 120, 125, 130].map((close, index) =>
              candle(START + index * HOUR, close),
            ),
          },
        },
      },
      selectionProfile: profile,
      from: START + 3 * HOUR,
      to: START + 4 * HOUR,
    });

    expect(result.episodes).toHaveLength(0);
    expect(result.episodeStatusObservations).toHaveLength(0);
  });

  it("rejects malformed candles at or before the cutoff", () => {
    const malformed = { ...candle(START, 100), h: 90 };
    expect(() => scan({ "1h": [malformed] }, {}, START + HOUR)).toThrow("Invalid candle");
  });

  it("rejects permissive timeframe aliases and misaligned candle buckets", () => {
    const profile = createRadarSelectionProfile(profileDefinition());
    const invalidTimeframe = {
      ...profile,
      scanTimeframe: "1hour",
    } as typeof profile;
    invalidTimeframe.canonicalConfigHash = radarSelectionProfileHash(invalidTimeframe);
    expect(() =>
      scanRadarEpisodes({
        candlesBySymbolAndTimeframe: {},
        selectionProfile: invalidTimeframe,
        from: START,
        to: START + HOUR,
      }),
    ).toThrow("scanTimeframe must be valid");

    const misaligned = candle(START + 1, 100);
    expect(() => scan({ "1h": [misaligned] }, {}, START + 2 * HOUR)).toThrow(
      "Invalid candle",
    );
  });
});
