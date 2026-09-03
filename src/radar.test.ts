import { describe, expect, it } from "vitest";
import type { CandleRecord } from "./types";
import {
  createRadarSelectionProfile,
  createExecutionVenueEligibilityObservation,
  scanRadarEpisodes,
  createRadarStructureObservation,
  EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  type ElapsedWindowReturnDetector,
  type EmaAtrDisplacementDetector,
  type MaximumWindowReturnDetector,
  type RadarDetectorCombination,
  type RadarScanInput,
  type RadarSelectionProfileDefinition,
  type RollingTroughRunupDetector,
} from "./radar";

const HOUR = 3_600;
const DAY = 86_400;
const START = 1_700_000_000;

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
      detectedAt: START + 25 * HOUR,
      triggeringDetectorIds: ["recent-trough-runup"],
      selectionAnchor: {
        price: 80,
        timestamp: START + 23 * HOUR,
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
      candle(START, 100),
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
        "1h": [candle(START, 100), candle(START + 2 * HOUR, 102), candle(START + 4 * HOUR, 110)],
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
    const fourHourCandles = [candle(START, 100), candle(START + 4 * HOUR, 120)];
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

  it("rejects conflicting same-bucket candles instead of using array order", () => {
    expect(() =>
      scan(
        { "1h": [candle(START, 100), candle(START, 101), candle(START + HOUR, 120)] },
        {},
        START + 2 * HOUR,
      ),
    ).toThrow("Conflicting candle revisions");
  });
});
