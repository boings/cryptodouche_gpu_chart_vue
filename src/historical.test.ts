import { describe, expect, it } from "vitest";
import {
  aggregateCanonicalOneMinuteCandles,
  historicalCandlesFingerprint,
  normalizeCompletedUtcCandles,
  validateHistoricalCase,
  type CanonicalHistoricalCandle,
  type HistoricalCaseValidationInput,
  type HistoricalCandleInput,
} from "./historical";

const START = Date.parse("2024-01-01T00:00:00Z") / 1_000;
const MINUTE = 60;

function inputCandle(index: number, overrides: Partial<HistoricalCandleInput> = {}): HistoricalCandleInput {
  const openTime = START + index * MINUTE;
  const close = 100 + index;
  return {
    source: "bybit",
    symbol: "FILUSDT",
    timeframe: "1m",
    openTime,
    closeTime: openTime + MINUTE,
    knownAt: openTime + MINUTE,
    o: close - 0.5,
    h: close + 1,
    l: close - 1,
    c: close,
    volumeBase: 10,
    volumeQuote: close * 10,
    revision: 0,
    ...overrides,
  };
}

function normalized(count = 60, overrides: HistoricalCandleInput[] | null = null) {
  return normalizeCompletedUtcCandles({
    candles: overrides ?? Array.from({ length: count }, (_, index) => inputCandle(index)),
    source: "bybit",
    symbol: "FILUSDT",
    timeframe: "1m",
    completedThrough: START + count * MINUTE,
  });
}

describe("historical candle normalization", () => {
  it("reports missing intervals without interpolation", () => {
    const result = normalized(3, [inputCandle(0), inputCandle(2)]);

    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toContain("MISSING_CANDLE_INTERVAL");
    expect(result.candles.map((candle) => candle.openTime)).toEqual([START, START + 2 * MINUTE]);
  });

  it("rejects duplicate active logical candles", () => {
    const result = normalized(2, [inputCandle(0), inputCandle(0)]);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DUPLICATE_CANDLE", actual: 2 }),
    ]));
    expect(result.candles).toHaveLength(0);
  });

  it("rejects invalid OHLC values", () => {
    const result = normalized(1, [inputCandle(0, { h: 99, c: 100 })]);

    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(["INVALID_OHLC"]);
    expect(result.candles).toHaveLength(0);
  });
});

describe("canonical one-minute aggregation", () => {
  it("deterministically aggregates complete UTC buckets and fingerprints them", () => {
    const source = normalized(60);
    const first = aggregateCanonicalOneMinuteCandles(source.candles, "15m");
    const second = aggregateCanonicalOneMinuteCandles(source.candles, "15m");

    expect(first.valid).toBe(true);
    expect(first.candles).toHaveLength(4);
    expect(first.candles[0]).toMatchObject({
      openTime: START,
      closeTime: START + 15 * MINUTE,
      o: 99.5,
      h: 115,
      l: 99,
      c: 114,
      volumeBase: 150,
    });
    expect(second.candles).toEqual(first.candles);
    expect(second.sourceFingerprint).toBe(first.sourceFingerprint);
    expect(second.fingerprint).toBe(first.fingerprint);
    expect(historicalCandlesFingerprint([...source.candles].reverse())).toBe(
      historicalCandlesFingerprint(source.candles),
    );
  });

  it("does not emit a bucket when a constituent minute is absent", () => {
    const source = normalized(15, Array.from({ length: 15 }, (_, index) => inputCandle(index)).filter((_, index) => index !== 7));
    const result = aggregateCanonicalOneMinuteCandles(source.candles, "15m");

    expect(result.valid).toBe(false);
    expect(result.candles).toHaveLength(0);
    expect(result.issues.map((item) => item.code)).toContain("MISSING_CANDLE_INTERVAL");
  });

  it("supports every Phase 3B analysis timeframe from the same canonical day", () => {
    const source = normalized(1_440);

    expect(aggregateCanonicalOneMinuteCandles(source.candles, "15m").candles).toHaveLength(96);
    expect(aggregateCanonicalOneMinuteCandles(source.candles, "1h").candles).toHaveLength(24);
    expect(aggregateCanonicalOneMinuteCandles(source.candles, "4h").candles).toHaveLength(6);
    expect(aggregateCanonicalOneMinuteCandles(source.candles, "1d").candles).toHaveLength(1);
  });
});

describe("historical case validation", () => {
  it("detects target/reference misalignment", () => {
    const target = normalized(3).candles;
    const reference = target.map((candle) => ({ ...candle, symbol: "BTCUSDT", logicalId: candle.logicalId.replace("FILUSDT", "BTCUSDT") })).slice(1);
    const result = validateHistoricalCase(caseInput(target, reference));

    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toContain("TARGET_REFERENCE_MISALIGNMENT");
  });

  it("allows only explicit non-structural warnings and keeps a deterministic bundle fingerprint", () => {
    const target = normalized(3).candles;
    const reference = target.map((candle) => ({ ...candle, symbol: "BTCUSDT", logicalId: candle.logicalId.replace("FILUSDT", "BTCUSDT") }));
    const firstInput = caseInput(target, reference);
    firstInput.requirements.permittedWarningCodes = [
      "FUNDING_DATA_UNAVAILABLE",
      "CANDLE_REVISION_HISTORY_UNAVAILABLE",
      "POINT_IN_TIME_UNIVERSE_UNKNOWN",
      "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN",
      "RESEARCH_PROXY_EXECUTION",
    ];
    const first = validateHistoricalCase(firstInput);
    const second = validateHistoricalCase({
      ...firstInput,
      targetCandles: [...firstInput.targetCandles],
      referenceCandles: [...firstInput.referenceCandles],
      executionCandles: [...firstInput.executionCandles],
    });

    expect(first.valid).toBe(true);
    expect(first.issues.length).toBeGreaterThan(0);
    expect(first.issues.every((item) => item.severity === "warning")).toBe(true);
    expect(first.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "FUNDING_DATA_UNAVAILABLE",
      "CANDLE_REVISION_HISTORY_UNAVAILABLE",
      "POINT_IN_TIME_UNIVERSE_UNKNOWN",
      "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN",
      "RESEARCH_PROXY_EXECUTION",
    ]));
    expect(second.bundleFingerprint).toBe(first.bundleFingerprint);
  });
});

function caseInput(
  targetCandles: CanonicalHistoricalCandle[],
  referenceCandles: CanonicalHistoricalCandle[],
): HistoricalCaseValidationInput {
  const executionCandles = targetCandles;
  return {
    targetCandles,
    referenceCandles,
    executionCandles,
    fundingObservations: [],
    targetRevisionHistoryAvailable: false,
    referenceRevisionHistoryAvailable: false,
    provenance: {
      analysisSource: sourceRef("FILUSDT"),
      referenceSource: sourceRef("BTCUSDT"),
      executionPriceDataSource: sourceRef("FILUSDT"),
      intendedExecutionVenue: { venue: "phemex", status: "unknown", evidence: null },
      executionSimulationMode: "ResearchProxyExecution",
    },
    universe: {
      mode: "ExplicitSymbolList",
      status: "researchAssumption",
      asOf: null,
      symbols: ["FILUSDT"],
      evidence: "Test fixture",
    },
    requirements: {
      decisionTime: START + MINUTE,
      analysisPreRollSeconds: MINUTE,
      displayPreRollSeconds: MINUTE,
      executionPostRollSeconds: 2 * MINUTE,
      executionTimeframe: "1m",
      fundingRequired: true,
      revisionHistoryRequired: true,
      pointInTimeUniverseRequired: true,
      pointInTimeExecutionVenueRequired: true,
      requiredAnalysisTimeframes: ["1m"],
      permittedWarningCodes: [],
    },
  };
}

function sourceRef(symbol: string) {
  return {
    id: "bybit",
    venue: "bybit",
    instrumentType: "linearUsdtPerpetual" as const,
    symbol,
    timezone: "UTC" as const,
    intervalBoundaries: "utcEpoch" as const,
    candleConstruction: "canonical1m" as const,
  };
}
