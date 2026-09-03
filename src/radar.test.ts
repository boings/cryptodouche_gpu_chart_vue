import { describe, expect, it } from "vitest";
import type { CandleRecord } from "./types";
import {
  createRadarSelectionProfile,
  scanRadarEpisodes,
  type ElapsedWindowReturnDetector,
  type EmaAtrDisplacementDetector,
  type MaximumWindowReturnDetector,
  type RadarDetectorCombination,
  type RadarSelectionProfileDefinition,
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
        historyLookbackSeconds: 90 * DAY,
      },
    ],
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
});
