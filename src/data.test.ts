import { describe, expect, it } from "vitest";
import {
  candlesToBytes,
  mergeLiveCandle,
  normalizeOhlcvPoint,
  packHistoricalCandles,
  prependHistoricalCandles,
} from "./data";
import {
  computeBollingerBands,
  computeEmaLine,
  computeSmaLine,
  computeWmaLine,
} from "./indicators";
import {
  clampXView,
  computeVisibleYBounds,
  isFollowingLatest,
  scaleYView,
  withRightPadding,
} from "./viewport";

describe("gpu chart data utilities", () => {
  it("anchors firstBucket before deriving x indexes", () => {
    const state = packHistoricalCandles(
      [
        { ts: 120, o: 1, h: 3, l: 0.5, c: 2 },
        { ts: 60, o: 1, h: 2, l: 0.5, c: 1.5 },
      ],
      "1m",
      500,
    );

    expect(state.firstBucket).toBe(60);
    expect(state.candles.map((candle) => candle.x)).toEqual([0, 1]);
    expect(candlesToBytes(state.candles).byteLength).toBe(2 * 5 * 4);
  });

  it("replaces same-bucket live updates", () => {
    const state = packHistoricalCandles(
      [
        { ts: 60, o: 1, h: 2, l: 0.5, c: 1.5 },
        { ts: 120, o: 1.5, h: 3, l: 1, c: 2.5 },
      ],
      "1m",
      500,
    );

    const result = mergeLiveCandle(
      state,
      { ts: 120, o: 2, h: 4, l: 1.5, c: 3 },
      500,
    );

    expect(result.kind).toBe("replace");
    expect(result.kind === "replace" ? result.position : -1).toBe(1);
    expect(state.candles[1].c).toBe(3);
  });

  it("ignores unchanged same-bucket live updates", () => {
    const state = packHistoricalCandles(
      [
        { ts: 60, o: 1, h: 2, l: 0.5, c: 1.5 },
        { ts: 120, o: 1.5, h: 3, l: 1, c: 2.5 },
      ],
      "1m",
      500,
    );

    const result = mergeLiveCandle(
      state,
      { ts: 120, o: 1.5, h: 3, l: 1, c: 2.5 },
      500,
    );

    expect(result.kind).toBe("ignore");
    expect(result.kind === "ignore" ? result.reason : "").toBe("unchanged");
  });

  it("parses backend OffsetDateTime tuple timestamps", () => {
    const point = normalizeOhlcvPoint({
      ts: [2026, 178, 11, 54, 0, 0, 0, 0, 0],
      o: 1,
      h: 2,
      l: 0.5,
      c: 1.5,
    });

    expect(point?.ts).toBe(Date.UTC(2026, 5, 27, 11, 54, 0, 0) / 1000);
  });

  it("appends next-bucket live updates and ignores malformed or large-gap data", () => {
    const state = packHistoricalCandles(
      [
        { ts: 60, o: 1, h: 2, l: 0.5, c: 1.5 },
        { ts: 120, o: 1.5, h: 3, l: 1, c: 2.5 },
      ],
      "1m",
      500,
    );

    expect(mergeLiveCandle(state, { ts: 180, o: 2, h: 4, l: 1, c: 3 }, 500).kind).toBe(
      "append",
    );
    expect(state.candles).toHaveLength(3);
    expect(mergeLiveCandle(state, { ts: 240, o: 2 }, 500).kind).toBe("ignore");
    expect(mergeLiveCandle(state, { ts: 600, o: 2, h: 4, l: 1, c: 3 }, 500).kind).toBe(
      "ignore",
    );
  });

  it("prepends older historical candles and reanchors x indexes", () => {
    const state = packHistoricalCandles(
      [
        { ts: 180, o: 3, h: 4, l: 2, c: 3.5 },
        { ts: 240, o: 4, h: 5, l: 3, c: 4.5 },
      ],
      "1m",
      500,
    );

    const added = prependHistoricalCandles(
      state,
      [
        { ts: 60, o: 1, h: 2, l: 0.5, c: 1.5 },
        { ts: 120, o: 2, h: 3, l: 1, c: 2.5 },
        { ts: 180, o: 30, h: 40, l: 20, c: 35 },
      ],
      "1m",
    );

    expect(added).toBe(2);
    expect(state.firstBucket).toBe(60);
    expect(state.candles.map((candle) => candle.ts)).toEqual([60, 120, 180, 240]);
    expect(state.candles.map((candle) => candle.x)).toEqual([0, 1, 2, 3]);
  });

  it("computes SMA and EMA line buffers", () => {
    const state = packHistoricalCandles(
      Array.from({ length: 25 }, (_, i) => ({
        ts: 60 + i * 60,
        o: i + 1,
        h: i + 2,
        l: i,
        c: i + 1,
      })),
      "1m",
      500,
    );

    const sma = computeSmaLine(state.candles, 20);
    const ema = computeEmaLine(state.candles, 20);

    expect(sma.length).toBe(12);
    expect(ema.length).toBe(12);
    expect(Array.from(sma.slice(0, 2))).toEqual([19, 10.5]);
    expect(Array.from(ema.slice(0, 2))).toEqual([19, 10.5]);
  });

  it("computes WMA and Bollinger Band line buffers", () => {
    const state = packHistoricalCandles(
      Array.from({ length: 5 }, (_, i) => ({
        ts: 60 + i * 60,
        o: i + 1,
        h: i + 1,
        l: i + 1,
        c: i + 1,
      })),
      "1m",
      500,
    );

    const wma = computeWmaLine(state.candles, 3);
    const bands = computeBollingerBands(state.candles, 3, 1);

    expect(wma.length).toBe(6);
    expect(wma[0]).toBe(2);
    expect(wma[1]).toBeCloseTo(14 / 6);
    expect(bands.basis.length).toBe(6);
    expect(bands.basis[1]).toBeCloseTo(2);
    expect(bands.upper[1]).toBeCloseTo(2.816496, 5);
    expect(bands.lower[1]).toBeCloseTo(1.183503, 5);
  });

  it("only follows live updates when the latest candle is in view", () => {
    expect(isFollowingLatest({ maxX: 100 }, 100)).toBe(true);
    expect(isFollowingLatest({ maxX: 102 }, 100)).toBe(true);
    expect(isFollowingLatest({ maxX: 103 }, 100)).toBe(false);
    expect(isFollowingLatest({ maxX: 99.8 }, 100)).toBe(false);
  });

  it("clamps x zoom to useful chart spans", () => {
    expect(
      clampXView({ minX: 40, maxX: 42, minY: 0, maxY: 1 }, { firstX: 0, lastX: 99 }),
    ).toMatchObject({ minX: 37, maxX: 45 });

    expect(
      clampXView({ minX: -100, maxX: 200, minY: 0, maxY: 1 }, { firstX: 0, lastX: 99 }),
    ).toMatchObject({ minX: 0, maxX: 101 });

    expect(
      clampXView(
        { minX: 9, maxX: 17, minY: 0, maxY: 1 },
        { firstX: 0, lastX: 99 },
        { x: 10, ratio: 0.25 },
      ),
    ).toMatchObject({ minX: 8, maxX: 16 });

    expect(
      clampXView({ minX: 120, maxX: 128, minY: 0, maxY: 1 }, { firstX: 0, lastX: 99 }),
    ).toMatchObject({ minX: 99, maxX: 107 });
  });

  it("adds initial right-side padding so the latest candle is not clipped", () => {
    expect(withRightPadding({ minX: 0, maxX: 99, minY: 0, maxY: 1 })).toMatchObject({
      minX: 0,
      maxX: 101,
    });
  });

  it("fits y bounds to visible candles with top and bottom clearance", () => {
    const bounds = computeVisibleYBounds(
      [
        { x: 0, h: 100, l: 90 },
        { x: 1, h: 102, l: 92 },
        { x: 20, h: 1_000, l: 1 },
      ],
      { minX: -0.25, maxX: 1.25 },
    );

    expect(bounds?.minY).toBeCloseTo(88.56);
    expect(bounds?.maxY).toBeCloseTo(103.44);
  });

  it("scales y bounds around the dragged price-axis anchor", () => {
    expect(
      scaleYView({ minX: 0, maxX: 10, minY: 90, maxY: 110 }, 0.5, 0.5),
    ).toMatchObject({ minY: 95, maxY: 105 });

    expect(
      scaleYView({ minX: 0, maxX: 10, minY: 90, maxY: 110 }, 0, 2),
    ).toMatchObject({ minY: 70, maxY: 110 });
  });
});
