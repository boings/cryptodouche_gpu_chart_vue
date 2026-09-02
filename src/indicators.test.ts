import { describe, expect, it } from "vitest";

import {
  computeAnchoredVwapLine,
  computeAnchoredVwapSignals,
  computeAnchoredVwapSnapshot,
  computeMarketStructure,
  computeRelativeCumulativeReturnLine,
  computeRelativeStrengthDivergences,
  computeStructureActiveLevels,
  computeSupportResistanceZones,
  computeSupportResistanceZonesFromSwings,
  computeSwingPoints,
  type MarketStructureState,
  type SwingPoint,
} from "./indicators";
import type { CandleRecord } from "./types";

function candle(index: number, low: number, high: number, close = (low + high) / 2): CandleRecord {
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

function structureCandles() {
  return [
    candle(0, 90, 100, 95),
    candle(1, 100, 110, 105),
    candle(2, 92, 104, 96),
    candle(3, 101, 108, 106),
    candle(4, 106, 116, 112),
    candle(5, 98, 109, 102),
    candle(6, 105, 112, 111),
    candle(7, 88, 107, 90),
    candle(8, 84, 94, 86),
    candle(9, 91, 118, 117),
    candle(10, 104, 113, 110),
  ];
}

function swing(
  index: number,
  kind: SwingPoint["kind"],
  price: number,
  structure: SwingPoint["structure"] = kind,
): SwingPoint {
  return {
    kind,
    structure,
    label:
      structure === "HigherHigh"
        ? "HH"
        : structure === "HigherLow"
          ? "HL"
          : structure === "LowerHigh"
            ? "LH"
            : structure === "LowerLow"
              ? "LL"
              : kind === "SwingHigh"
                ? "SH"
                : "SL",
    index,
    x: index,
    ts: index * 60,
    bucket: index * 60,
    price,
    atr: null,
  };
}

function structureState(
  state: MarketStructureState["summary"]["state"],
  swings: SwingPoint[],
  transitionDirection: MarketStructureState["summary"]["transitionDirection"] = null,
): MarketStructureState {
  const swingHighs = swings.filter((item) => item.kind === "SwingHigh");
  const swingLows = swings.filter((item) => item.kind === "SwingLow");
  const lastSwing = swings.length > 0 ? swings[swings.length - 1] : null;

  return {
    swings,
    breaks: [],
    trend:
      state === "bullish" || state === "bearish"
        ? state
        : transitionDirection ?? "neutral",
    summary: {
      state,
      trend:
        state === "bullish" || state === "bearish"
          ? state
          : transitionDirection ?? "neutral",
      transitionDirection,
      lastBreak: null,
      lastSwingHigh: swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null,
      lastSwingLow: swingLows.length > 0 ? swingLows[swingLows.length - 1] : null,
      updatedX: lastSwing?.x ?? null,
      updatedTs: lastSwing?.ts ?? null,
    },
  };
}

describe("gpu chart indicators", () => {
  it("computes anchored VWAP from the selected bucket", () => {
    const candles = [
      candle(0, 9, 11, 10),
      candle(1, 18, 24, 21),
      candle(2, 30, 36, 33),
    ];
    candles[1].v_base = 2;
    candles[2].v_base = 1;

    const line = Array.from(computeAnchoredVwapLine(candles, { anchorBucket: 60 }));

    expect(line[0]).toBe(1);
    expect(line[1]).toBeCloseTo(21, 6);
    expect(line[2]).toBe(2);
    expect(line[3]).toBeCloseTo((21 * 2 + 33) / 3, 6);
  });

  it("falls back to quote volume for anchored VWAP", () => {
    const candles = [
      candle(0, 9, 11, 10),
      candle(1, 18, 24, 21),
      candle(2, 30, 36, 33),
    ];
    candles[1].v_base = 0;
    candles[1].v_quote = 84;
    candles[2].v_base = 0;
    candles[2].v_quote = 33;

    const line = Array.from(computeAnchoredVwapLine(candles, { anchorX: 1 }));

    expect(line[1]).toBeCloseTo(21, 6);
    expect(line[3]).toBeCloseTo((21 * 4 + 33) / 5, 6);
  });

  it("returns no anchored VWAP without an anchor", () => {
    expect(computeAnchoredVwapLine([candle(0, 9, 11)]).length).toBe(0);
  });

  it("summarizes anchored VWAP distance from the latest close", () => {
    const candles = [
      candle(0, 9, 11, 10),
      candle(1, 18, 24, 21),
      candle(2, 30, 36, 33),
    ];
    candles[1].v_base = 2;
    candles[2].v_base = 1;

    const snapshot = computeAnchoredVwapSnapshot(candles, { anchorBucket: 60 });

    expect(snapshot.value).toBeCloseTo((21 * 2 + 33) / 3, 6);
    expect(snapshot.distancePct).toBeCloseTo((33 / 25 - 1) * 100, 6);
    expect(snapshot.candle?.x).toBe(2);
  });

  it("marks anchored VWAP loss, reclaim, and failed reclaim events", () => {
    const candles = [
      candle(0, 9, 11, 10),
      candle(1, 11, 13, 12),
      candle(2, 8, 14, 9),
      candle(3, 7, 10.5, 8),
      candle(4, 10, 14, 13),
    ];

    const signals = computeAnchoredVwapSignals(candles, { anchorX: 0 }, 10);

    expect(signals.map((signal) => signal.kind)).toEqual([
      "loss",
      "failedReclaim",
      "reclaim",
    ]);
    expect(signals.map((signal) => signal.label)).toEqual([
      "AVWAP loss",
      "Failed AVWAP reclaim",
      "AVWAP reclaim",
    ]);
  });

  it("computes relative cumulative return anchored at zero", () => {
    const current = [
      candle(0, 9, 11),
      candle(1, 11, 13),
      candle(2, 15, 17),
    ];
    const benchmark = [
      candle(0, 99, 101),
      candle(1, 109, 111),
      candle(2, 119, 121),
    ];

    const line = Array.from(computeRelativeCumulativeReturnLine(current, benchmark));

    expect(line[0]).toBe(0);
    expect(line[1]).toBe(0);
    expect(line[2]).toBe(1);
    expect(line[3]).toBeCloseTo((12 / 10 / (110 / 100) - 1) * 100, 5);
    expect(line[4]).toBe(2);
    expect(line[5]).toBeCloseTo((16 / 10 / (120 / 100) - 1) * 100, 5);
  });

  it("skips relative return points without matching benchmark candles", () => {
    const current = [candle(0, 9, 11), candle(1, 11, 13), candle(2, 15, 17)];
    const benchmark = [candle(0, 99, 101), candle(2, 119, 121)];

    expect(Array.from(computeRelativeCumulativeReturnLine(current, benchmark))).toEqual([
      0,
      0,
      2,
      expect.closeTo((16 / 10 / (120 / 100) - 1) * 100, 5),
    ]);
  });

  it("normalizes relative return as bounded price-ratio percent change", () => {
    const current = [candle(0, 99, 101), candle(1, 29, 31)];
    const benchmark = [candle(0, 99, 101), candle(1, 99, 101)];

    const line = Array.from(computeRelativeCumulativeReturnLine(current, benchmark));

    expect(line[3]).toBeCloseTo(-70, 6);
  });

  it("marks price strength that diverges from normalized RS versus benchmark", () => {
    const current = [
      candle(0, 98, 101, 100),
      candle(1, 108, 112, 111),
      candle(2, 102, 105, 104),
      candle(3, 114, 118, 117),
      candle(4, 107, 110, 109),
      candle(5, 112, 116, 115),
    ];
    const benchmark = [
      candle(0, 98, 101, 100),
      candle(1, 99, 102, 101),
      candle(2, 100, 103, 102),
      candle(3, 129, 133, 131),
      candle(4, 126, 130, 128),
      candle(5, 127, 131, 129),
    ];

    const divergences = computeRelativeStrengthDivergences(current, benchmark, {
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
      minDeltaPct: 0.5,
      maxDivergences: 10,
    });

    expect(divergences.map((item) => item.label)).toEqual(["RS LH", "RS LL"]);
    expect(divergences.every((item) => item.direction === "bearish")).toBe(true);
    expect(divergences[0].priceLabel).toBe("HH");
    expect(divergences[1].priceLabel).toBe("HL");
  });

  it("filters small swing reversals with an ATR threshold", () => {
    const unfiltered = computeSwingPoints(structureCandles(), {
      pivotStrength: 1,
      atrPeriod: 3,
      minMoveAtr: 0,
      maxSwings: 20,
    });
    const filtered = computeSwingPoints(structureCandles(), {
      pivotStrength: 1,
      atrPeriod: 3,
      minMoveAtr: 1.5,
      maxSwings: 20,
    });

    expect(unfiltered.length).toBeGreaterThan(filtered.length);
    expect(filtered.length).toBeGreaterThan(1);
  });

  it("labels market structure swings and break direction changes", () => {
    const structure = computeMarketStructure(structureCandles(), {
      pivotStrength: 1,
      atrPeriod: 3,
      minMoveAtr: 0.2,
      maxSwings: 20,
      maxBreaks: 10,
    });

    expect(structure.swings.map((swing) => swing.label)).toEqual([
      "SH",
      "SL",
      "HH",
      "HL",
      "LH",
      "LL",
      "HH",
    ]);
    expect(structure.breaks.map((item) => `${item.label}:${item.direction}`)).toEqual([
      "BOS:bullish",
      "Shift:bearish",
      "Shift:bullish",
    ]);
    expect(structure.trend).toBe("bullish");
    expect(structure.summary.state).toBe("transitional");
    expect(structure.summary.trend).toBe("bullish");
    expect(structure.summary.lastBreak?.label).toBe("Shift");
    expect(structure.summary.lastSwingHigh?.label).toBe("HH");
    expect(structure.summary.lastSwingLow?.label).toBe("LL");
  });

  it("summarizes continuation breaks as directional structure", () => {
    const structure = computeMarketStructure(
      [
        candle(0, 90, 100, 95),
        candle(1, 100, 110, 105),
        candle(2, 92, 104, 96),
        candle(3, 101, 108, 106),
        candle(4, 106, 116, 112),
        candle(5, 108, 113, 111),
        candle(6, 111, 121, 120),
      ],
      {
        pivotStrength: 1,
        atrPeriod: 3,
        minMoveAtr: 0,
        maxSwings: 20,
        maxBreaks: 10,
      },
    );

    expect(structure.breaks.map((item) => `${item.label}:${item.direction}`)).toEqual([
      "BOS:bullish",
      "BOS:bullish",
    ]);
    expect(structure.summary.state).toBe("bullish");
    expect(structure.summary.lastBreak?.kind).toBe("StructureBreak");
  });

  it("exposes active continuation and shift levels for directional structure", () => {
    const swings = [
      swing(0, "SwingLow", 90, "SwingLow"),
      swing(1, "SwingHigh", 110, "SwingHigh"),
      swing(2, "SwingLow", 100, "HigherLow"),
      swing(3, "SwingHigh", 125, "HigherHigh"),
    ];

    const levels = computeStructureActiveLevels(structureState("bullish", swings));

    expect(levels.map((level) => `${level.role}:${level.direction}:${level.sourceSwing.label}`)).toEqual([
      "continuation:bullish:HH",
      "shift:bearish:HL",
    ]);
  });

  it("uses the transition direction for active transitional levels", () => {
    const swings = [
      swing(0, "SwingLow", 90, "SwingLow"),
      swing(1, "SwingHigh", 120, "SwingHigh"),
      swing(2, "SwingLow", 100, "HigherLow"),
      swing(3, "SwingHigh", 114, "LowerHigh"),
      swing(4, "SwingLow", 82, "LowerLow"),
    ];

    const levels = computeStructureActiveLevels(
      structureState("transitional", swings, "bearish"),
    );

    expect(levels.map((level) => `${level.role}:${level.direction}:${level.sourceSwing.label}`)).toEqual([
      "continuation:bearish:LL",
      "shift:bullish:LH",
    ]);
  });

  it("exposes range high and low when no directional break is established", () => {
    const swings = [
      swing(0, "SwingLow", 90, "SwingLow"),
      swing(1, "SwingHigh", 110, "SwingHigh"),
      swing(2, "SwingLow", 92, "HigherLow"),
      swing(3, "SwingHigh", 108, "LowerHigh"),
    ];

    const levels = computeStructureActiveLevels(structureState("range", swings));

    expect(levels.map((level) => `${level.role}:${level.direction}:${level.price}`)).toEqual([
      "rangeHigh:null:110",
      "rangeLow:null:90",
    ]);
  });

  it("returns a flat zero relative return line for a self benchmark", () => {
    const candles = [candle(0, 9, 11), candle(1, 11, 13), candle(2, 15, 17)];

    expect(Array.from(computeRelativeCumulativeReturnLine(candles, candles))).toEqual([
      0,
      0,
      1,
      0,
      2,
      0,
    ]);
  });

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

  it("builds support and resistance zones directly from swings", () => {
    const zones = computeSupportResistanceZonesFromSwings(
      [
        swing(0, "SwingLow", 90, "SwingLow"),
        swing(1, "SwingHigh", 110, "SwingHigh"),
        swing(2, "SwingLow", 90.1, "HigherLow"),
        swing(3, "SwingHigh", 110.2, "HigherHigh"),
        swing(4, "SwingLow", 80, "LowerLow"),
        swing(5, "SwingHigh", 130, "HigherHigh"),
      ],
      {
        maxZones: 2,
        thicknessBps: 25,
        latestX: 5,
        referencePrice: 100,
        zonesPerSide: 1,
      },
    );

    const support = zones.find((zone) => zone.kind === "support");
    const resistance = zones.find((zone) => zone.kind === "resistance");

    expect(zones).toHaveLength(2);
    expect(support?.center).toBeCloseTo(90.05, 2);
    expect(support?.touches).toBe(2);
    expect(support?.source).toBe("swing");
    expect(support?.structures).toContain("HigherLow");
    expect(resistance?.center).toBeCloseTo(110.1, 2);
    expect(resistance?.touches).toBe(2);
  });
});
