import { describe, expect, it } from "vitest";

import { computeSupportResistanceZones } from "./indicators";
import type { CandleRecord } from "./types";

function candle(index: number, low: number, high: number): CandleRecord {
  const close = (low + high) / 2;
  return {
    ts: index * 60,
    bucket: index * 60,
    x: index,
    o: close,
    h: high,
    l: low,
    c: close,
    v_base: 1,
    v_quote: close,
  };
}

describe("gpu chart indicators", () => {
  it("clusters repeated pivot highs and lows into support and resistance zones", () => {
    const candles = [
      candle(0, 96, 102),
      candle(1, 94, 104),
      candle(2, 90, 110),
      candle(3, 95, 103),
      candle(4, 92, 106),
      candle(5, 89.95, 109.8),
      candle(6, 96, 104),
      candle(7, 93, 107),
      candle(8, 90.05, 110.1),
      candle(9, 95, 105),
    ];

    const zones = computeSupportResistanceZones(candles, {
      lookback: 20,
      pivotStrength: 1,
      maxZones: 4,
      thicknessBps: 20,
    });

    const support = zones.find((zone) => zone.kind === "support");
    const resistance = zones.find((zone) => zone.kind === "resistance");

    expect(support?.touches).toBeGreaterThanOrEqual(2);
    expect(support?.center).toBeCloseTo(90, 1);
    expect(resistance?.touches).toBeGreaterThanOrEqual(2);
    expect(resistance?.center).toBeCloseTo(110, 1);
  });

  it("honors the max zone limit", () => {
    const candles = Array.from({ length: 80 }, (_, index) => {
      const wave = index % 6;
      const high = wave === 2 ? 120 + index * 0.2 : 105 + wave;
      const low = wave === 5 ? 80 - index * 0.1 : 95 - wave;
      return candle(index, low, high);
    });

    expect(
      computeSupportResistanceZones(candles, {
        pivotStrength: 1,
        maxZones: 2,
      }),
    ).toHaveLength(2);
  });
});
