import assert from "node:assert/strict";
import test from "node:test";
import { validateAlignment, validateCaseCoverage, validateSeries } from "./validation.mjs";

test("reports gaps, duplicates, and invalid OHLC without interpolation", () => {
  const candles = [
    candle(0, 100),
    candle(60, 100),
    { ...candle(60, 100), h: 99 },
    candle(180, 100),
  ];
  const codes = validateSeries(candles, { symbol: "FILUSDT", timeframe: "1m", from: 0, to: 240 }).map((item) => item.code);
  assert.ok(codes.includes("DUPLICATE_CANDLE"));
  assert.ok(codes.includes("INVALID_OHLC"));
  assert.ok(codes.includes("MISSING_CANDLE_INTERVAL"));
});

test("reports exact target/reference interval misalignment", () => {
  const target = [candle(0, 100), candle(3_600, 101)];
  const reference = [candle(0, 40_000)];
  const issues = validateAlignment(target, reference, "1h", 0, 7_200);
  assert.equal(issues[0].code, "TARGET_REFERENCE_MISALIGNMENT");
  assert.equal(issues[0].count, 1);
});

test("rejects caller preroll that is shorter than the shared profile requirement", () => {
  const detectedAt = 200 * 86_400;
  const short = [candle(detectedAt - 3_600, 100)];
  const issues = validateCaseCoverage({
    detectedAt,
    horizonAsOf: detectedAt + 60,
    analysisPreroll: 3_600,
    requiredAnalysisPrerollByTimeframe: { "15m": 90 * 86_400, "1h": 181 * 86_400, "4h": 90 * 86_400, "1d": 90 * 86_400 },
    targetByTimeframe: { "15m": short, "1h": short, "4h": short, "1d": short },
    referenceByTimeframe: { "15m": short, "1h": short, "4h": short, "1d": short },
    executionCandles: [candle(detectedAt, 100)],
  });
  assert.ok(issues.some((item) => item.code === "INSUFFICIENT_ANALYSIS_PREROLL"));
});

function candle(openTime, close) {
  return { openTime, closeTime: openTime + 60, o: close, h: close + 1, l: close - 1, c: close, vBase: 1, vQuote: close };
}
