import type { CandleRecord } from "./types";

export interface SupportResistanceZone {
  kind: "support" | "resistance";
  low: number;
  high: number;
  center: number;
  touches: number;
  score: number;
  strength: number;
  lastX: number;
  source: "swing";
  structures: SwingPointStructure[];
}

export interface SupportResistanceZoneFromSwingsOptions {
  maxZones?: number;
  thicknessBps?: number;
  latestX?: number;
  referencePrice?: number | null;
  zonesPerSide?: number;
}

export interface SupportResistanceZoneOptions extends SupportResistanceZoneFromSwingsOptions {
  lookback?: number;
  pivotStrength?: number;
  atrPeriod?: number;
  minMoveAtr?: number;
}

export type SwingPointKind = "SwingHigh" | "SwingLow";
export type SwingPointStructure =
  | SwingPointKind
  | "HigherHigh"
  | "HigherLow"
  | "LowerHigh"
  | "LowerLow";
export type SwingPointLabel = "SH" | "SL" | "HH" | "HL" | "LH" | "LL";
export type StructureBreakKind = "StructureBreak" | "StructureShift";
export type StructureDirection = "bullish" | "bearish";
export type StructureSummaryState = StructureDirection | "transitional" | "range" | "neutral";
export type StructureActiveLevelRole = "continuation" | "shift" | "rangeHigh" | "rangeLow";
export type RelativeStrengthDivergenceKind =
  | "bearishHigh"
  | "bearishLow"
  | "bullishHigh"
  | "bullishLow";

export interface SwingPoint {
  kind: SwingPointKind;
  structure: SwingPointStructure;
  label: SwingPointLabel;
  index: number;
  x: number;
  ts: number;
  bucket: number;
  price: number;
  atr: number | null;
}

export interface StructureBreak {
  kind: StructureBreakKind;
  direction: StructureDirection;
  label: "BOS" | "Shift";
  index: number;
  x: number;
  ts: number;
  bucket: number;
  level: number;
  sourceSwingX: number;
  sourceSwingPrice: number;
}

export interface MarketStructureOptions {
  lookback?: number;
  pivotStrength?: number;
  atrPeriod?: number;
  minMoveAtr?: number;
  maxSwings?: number;
  maxBreaks?: number;
}

export interface MarketStructureSummary {
  state: StructureSummaryState;
  trend: StructureDirection | "neutral";
  transitionDirection: StructureDirection | null;
  lastBreak: StructureBreak | null;
  lastSwingHigh: SwingPoint | null;
  lastSwingLow: SwingPoint | null;
  updatedX: number | null;
  updatedTs: number | null;
}

export interface MarketStructureState {
  swings: SwingPoint[];
  breaks: StructureBreak[];
  trend: StructureDirection | "neutral";
  summary: MarketStructureSummary;
}

export interface StructureActiveLevel {
  role: StructureActiveLevelRole;
  direction: StructureDirection | null;
  price: number;
  x: number;
  ts: number;
  bucket: number;
  sourceSwing: SwingPoint;
}

export interface RelativeStrengthDivergence {
  kind: RelativeStrengthDivergenceKind;
  direction: StructureDirection;
  label: "RS LH" | "RS LL" | "RS HH" | "RS HL";
  index: number;
  x: number;
  ts: number;
  bucket: number;
  price: number;
  previousPrice: number;
  rs: number;
  previousRs: number;
  priceLabel: SwingPointLabel;
}

export interface RelativeStrengthDivergenceOptions extends MarketStructureOptions {
  minDeltaPct?: number;
  maxDivergences?: number;
}

export interface AnchoredVwapOptions {
  anchorBucket?: number | null;
  anchorX?: number | null;
}

export interface AnchoredVwapSnapshot {
  anchorBucket: number | null;
  anchorX: number | null;
  value: number | null;
  distancePct: number | null;
  candle: CandleRecord | null;
}

export type AnchoredVwapSignalKind = "loss" | "reclaim" | "failedReclaim";

export interface AnchoredVwapSignal {
  kind: AnchoredVwapSignalKind;
  label: "AVWAP loss" | "AVWAP reclaim" | "Failed AVWAP reclaim";
  index: number;
  x: number;
  ts: number;
  bucket: number;
  price: number;
  vwap: number;
}

export function computeSmaLine(candles: CandleRecord[], period = 20): Float32Array {
  if (candles.length < period) return new Float32Array();
  const points: number[] = [];
  let sum = 0;
  candles.forEach((candle, index) => {
    sum += candle.c;
    if (index >= period) sum -= candles[index - period].c;
    if (index >= period - 1) {
      points.push(candle.x, sum / period);
    }
  });
  return new Float32Array(points);
}

export function computeEmaLine(candles: CandleRecord[], period = 20): Float32Array {
  if (candles.length < period) return new Float32Array();
  const points: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += candles[i].c;
  }
  ema /= period;
  points.push(candles[period - 1].x, ema);
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].c - ema) * multiplier + ema;
    points.push(candles[i].x, ema);
  }
  return new Float32Array(points);
}

export function computeWmaLine(candles: CandleRecord[], period = 20): Float32Array {
  if (candles.length < period) return new Float32Array();
  const points: number[] = [];
  const weightTotal = (period * (period + 1)) / 2;
  for (let i = period - 1; i < candles.length; i++) {
    let weighted = 0;
    for (let offset = 0; offset < period; offset++) {
      weighted += candles[i - period + 1 + offset].c * (offset + 1);
    }
    points.push(candles[i].x, weighted / weightTotal);
  }
  return new Float32Array(points);
}

export function computeBollingerBands(
  candles: CandleRecord[],
  period = 20,
  stdDev = 2,
): { basis: Float32Array; upper: Float32Array; lower: Float32Array } {
  if (candles.length < period) {
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array(),
    };
  }

  const basis: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  let sum = 0;
  let sumSq = 0;

  candles.forEach((candle, index) => {
    sum += candle.c;
    sumSq += candle.c * candle.c;
    if (index >= period) {
      const dropped = candles[index - period].c;
      sum -= dropped;
      sumSq -= dropped * dropped;
    }
    if (index >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(0, sumSq / period - mean * mean);
      const band = Math.sqrt(variance) * stdDev;
      basis.push(candle.x, mean);
      upper.push(candle.x, mean + band);
      lower.push(candle.x, mean - band);
    }
  });

  return {
    basis: new Float32Array(basis),
    upper: new Float32Array(upper),
    lower: new Float32Array(lower),
  };
}

export function computeRsiLine(candles: CandleRecord[], period = 14): Float32Array {
  return pointsToLine(computeRsiPoints(candles, period));
}

export function computeStochRsi(
  candles: CandleRecord[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kPeriod = 3,
  dPeriod = 3,
): { k: Float32Array; d: Float32Array } {
  const rsiPoints = computeRsiPoints(candles, rsiPeriod);
  const stochLength = normalizedPeriod(stochPeriod);
  if (rsiPoints.length < stochLength) {
    return { k: new Float32Array(), d: new Float32Array() };
  }

  const rawK: Array<{ x: number; value: number }> = [];
  for (let i = stochLength - 1; i < rsiPoints.length; i++) {
    let min = Infinity;
    let max = -Infinity;
    for (let offset = 0; offset < stochLength; offset++) {
      const value = rsiPoints[i - offset].value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    const span = max - min;
    const value = span > 0 ? ((rsiPoints[i].value - min) / span) * 100 : 50;
    rawK.push({ x: rsiPoints[i].x, value });
  }

  const k = movingAveragePoints(rawK, normalizedPeriod(kPeriod));
  const d = movingAveragePoints(k, normalizedPeriod(dPeriod));
  return {
    k: pointsToLine(k),
    d: pointsToLine(d),
  };
}

export function computeMacd(
  candles: CandleRecord[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): { macd: Float32Array; signal: Float32Array; histogram: Float32Array } {
  const fast = emaValues(candles, fastPeriod);
  const slow = emaValues(candles, slowPeriod);
  const macdPoints: Array<{ x: number; value: number }> = [];
  for (let i = 0; i < candles.length; i++) {
    const fastValue = fast[i];
    const slowValue = slow[i];
    if (fastValue == null || slowValue == null) continue;
    macdPoints.push({ x: candles[i].x, value: fastValue - slowValue });
  }

  const signalPoints = emaLinePoints(macdPoints, signalPeriod);
  const macdByX = new Map(macdPoints.map((point) => [point.x, point.value]));
  const histogramPoints = signalPoints.map((point) => ({
    x: point.x,
    value: (macdByX.get(point.x) ?? point.value) - point.value,
  }));

  return {
    macd: pointsToLine(macdPoints),
    signal: pointsToLine(signalPoints),
    histogram: pointsToLine(histogramPoints),
  };
}

export function computeAtrLine(candles: CandleRecord[], period = 14): Float32Array {
  const values = atrValues(candles, period);
  const points: Array<{ x: number; value: number }> = [];
  values.forEach((value, index) => {
    if (value != null) points.push({ x: candles[index].x, value });
  });
  return pointsToLine(points);
}

export function computeAnchoredVwapLine(
  candles: CandleRecord[],
  options: AnchoredVwapOptions = {},
): Float32Array {
  const startIndex = anchoredVwapStartIndex(candles, options);
  if (startIndex == null) return new Float32Array();

  const points: number[] = [];
  let cumulativeVolume = 0;
  let cumulativeNotional = 0;
  for (let index = startIndex; index < candles.length; index += 1) {
    const candle = candles[index];
    if (!candle) continue;
    const typical = (candle.h + candle.l + candle.c) / 3;
    if (!validPositivePrice(typical)) continue;
    const volume = anchoredVwapBaseVolume(candle, typical);
    if (volume <= 0) continue;
    cumulativeVolume += volume;
    cumulativeNotional += typical * volume;
    points.push(candle.x, cumulativeNotional / cumulativeVolume);
  }

  return new Float32Array(points);
}

export function computeAnchoredVwapSnapshot(
  candles: CandleRecord[],
  options: AnchoredVwapOptions = {},
): AnchoredVwapSnapshot {
  const anchorBucket = normalizedNullableNumber(options.anchorBucket);
  const anchorX = normalizedNullableNumber(options.anchorX);
  const line = computeAnchoredVwapLine(candles, options);
  if (line.length < 2) {
    return {
      anchorBucket,
      anchorX,
      value: null,
      distancePct: null,
      candle: null,
    };
  }

  const value = line[line.length - 1];
  const candle = latestValidCloseCandle(candles);
  const distancePct =
    candle && validPositivePrice(value) ? ((candle.c - value) / value) * 100 : null;
  return {
    anchorBucket,
    anchorX,
    value,
    distancePct,
    candle,
  };
}

export function computeAnchoredVwapSignals(
  candles: CandleRecord[],
  options: AnchoredVwapOptions = {},
  maxSignals = 20,
): AnchoredVwapSignal[] {
  const cappedMaxSignals = clampIntegerOption(maxSignals, 1, 200, 20);
  const line = computeAnchoredVwapLine(candles, options);
  if (line.length < 4) return [];

  const candleByX = new Map(candles.map((candle, index) => [candle.x, { candle, index }]));
  const signals: AnchoredVwapSignal[] = [];
  let previousRelation: "above" | "below" | null = null;
  for (let pointIndex = 0; pointIndex < line.length; pointIndex += 2) {
    const x = line[pointIndex];
    const vwap = line[pointIndex + 1];
    const source = candleByX.get(x);
    if (!source || !validPositivePrice(vwap) || !validPositivePrice(source.candle.c)) continue;

    const relation: "above" | "below" | null =
      source.candle.c > vwap ? "above" : source.candle.c < vwap ? "below" : null;
    if (!relation) continue;

    if (previousRelation === "above" && relation === "below") {
      signals.push(createAnchoredVwapSignal("loss", source.index, source.candle, vwap));
    } else if (previousRelation === "below" && relation === "above") {
      signals.push(createAnchoredVwapSignal("reclaim", source.index, source.candle, vwap));
    } else if (
      previousRelation === "below" &&
      relation === "below" &&
      source.candle.h >= vwap &&
      source.candle.c < vwap
    ) {
      signals.push(createAnchoredVwapSignal("failedReclaim", source.index, source.candle, vwap));
    }

    previousRelation = relation;
  }

  return signals.slice(-cappedMaxSignals);
}

export function computeSwingPoints(
  candles: CandleRecord[],
  options: MarketStructureOptions = {},
): SwingPoint[] {
  const lookback = clampIntegerOption(options.lookback, 20, 2000, 500);
  const pivotStrength = clampIntegerOption(options.pivotStrength, 1, 20, 3);
  const atrPeriod = clampIntegerOption(options.atrPeriod, 2, 100, 14);
  const minMoveAtr = clampNumberOption(options.minMoveAtr, 0, 10, 0.75);
  const maxSwings = clampIntegerOption(options.maxSwings, 1, 500, 120);
  const startIndex = Math.max(0, candles.length - lookback);
  const source = candles.slice(startIndex);
  if (source.length < pivotStrength * 2 + 1) return [];

  const atrByIndex = atrValues(candles, atrPeriod);
  const raw: SwingPoint[] = [];
  for (let index = pivotStrength; index < source.length - pivotStrength; index += 1) {
    const candle = source[index];
    const sourceIndex = startIndex + index;
    const atr = atrByIndex[sourceIndex] ?? null;
    if (isPivotHigh(source, index, pivotStrength)) {
      raw.push(createSwingPoint("SwingHigh", sourceIndex, candle, candle.h, atr));
    }
    if (isPivotLow(source, index, pivotStrength)) {
      raw.push(createSwingPoint("SwingLow", sourceIndex, candle, candle.l, atr));
    }
  }

  const accepted: SwingPoint[] = [];
  for (const candidate of raw) {
    const last = accepted[accepted.length - 1];
    if (!last) {
      accepted.push(candidate);
      continue;
    }
    if (last.kind === candidate.kind) {
      if (isMoreExtremeSwing(candidate, last)) accepted[accepted.length - 1] = candidate;
      continue;
    }
    if (Math.abs(candidate.price - last.price) >= swingMoveThreshold(candidate, last, minMoveAtr)) {
      accepted.push(candidate);
    }
  }

  return classifySwingPoints(accepted).slice(-maxSwings);
}

export function computeMarketStructure(
  candles: CandleRecord[],
  options: MarketStructureOptions = {},
): MarketStructureState {
  const maxSwings = clampIntegerOption(options.maxSwings, 1, 500, 120);
  const maxBreaks = clampIntegerOption(options.maxBreaks, 1, 200, 24);
  const swings = computeSwingPoints(candles, {
    ...options,
    maxSwings: Math.max(maxSwings, maxBreaks * 4),
  });
  const breaks: StructureBreak[] = [];
  const brokenHighs = new Set<number>();
  const brokenLows = new Set<number>();
  let swingIndex = 0;
  let activeHigh: SwingPoint | null = null;
  let activeLow: SwingPoint | null = null;
  let trend: MarketStructureState["trend"] = "neutral";

  for (let index = 0; index < candles.length; index += 1) {
    while (swingIndex < swings.length && swings[swingIndex].index < index) {
      const swing = swings[swingIndex];
      if (swing.kind === "SwingHigh") activeHigh = swing;
      else activeLow = swing;
      swingIndex += 1;
    }

    const candle = candles[index];
    if (activeHigh && !brokenHighs.has(activeHigh.x) && candle.c > activeHigh.price) {
      const kind: StructureBreakKind = trend === "bearish" ? "StructureShift" : "StructureBreak";
      breaks.push(createStructureBreak(kind, "bullish", index, candle, activeHigh));
      brokenHighs.add(activeHigh.x);
      trend = "bullish";
    }
    if (activeLow && !brokenLows.has(activeLow.x) && candle.c < activeLow.price) {
      const kind: StructureBreakKind = trend === "bullish" ? "StructureShift" : "StructureBreak";
      breaks.push(createStructureBreak(kind, "bearish", index, candle, activeLow));
      brokenLows.add(activeLow.x);
      trend = "bearish";
    }
  }

  const visibleSwings = swings.slice(-maxSwings);
  const visibleBreaks = breaks.slice(-maxBreaks);
  return {
    swings: visibleSwings,
    breaks: visibleBreaks,
    trend,
    summary: summarizeMarketStructure(visibleSwings, visibleBreaks, trend),
  };
}

export function computeStructureActiveLevels(
  structure: MarketStructureState,
): StructureActiveLevel[] {
  const { swings, summary } = structure;
  if (!swings.length || summary.state === "neutral") return [];

  if (summary.state === "range") {
    return [
      latestExtremeSwingLevel(swings, "SwingHigh", "rangeHigh", null, true),
      latestExtremeSwingLevel(swings, "SwingLow", "rangeLow", null, false),
    ].filter((level): level is StructureActiveLevel => Boolean(level));
  }

  const direction =
    summary.state === "transitional"
      ? summary.transitionDirection ?? summary.lastBreak?.direction ?? structure.trend
      : summary.state;

  if (direction === "bullish") {
    return [
      latestPreferredSwingLevel(
        swings,
        "SwingHigh",
        ["HigherHigh", "SwingHigh"],
        "continuation",
        "bullish",
      ),
      latestPreferredSwingLevel(
        swings,
        "SwingLow",
        ["HigherLow", "SwingLow"],
        "shift",
        "bearish",
      ),
    ].filter((level): level is StructureActiveLevel => Boolean(level));
  }

  if (direction === "bearish") {
    return [
      latestPreferredSwingLevel(
        swings,
        "SwingLow",
        ["LowerLow", "SwingLow"],
        "continuation",
        "bearish",
      ),
      latestPreferredSwingLevel(
        swings,
        "SwingHigh",
        ["LowerHigh", "SwingHigh"],
        "shift",
        "bullish",
      ),
    ].filter((level): level is StructureActiveLevel => Boolean(level));
  }

  return [];
}

export function computeSupportResistanceZones(
  candles: CandleRecord[],
  options: SupportResistanceZoneOptions = {},
): SupportResistanceZone[] {
  const lookback = clampIntegerOption(options.lookback, 20, 1000, 240);
  const pivotStrength = clampIntegerOption(options.pivotStrength, 1, 20, 3);
  const maxZones = clampIntegerOption(options.maxZones, 1, 12, 6);
  const thicknessBps = clampNumberOption(options.thicknessBps, 1, 100, 10);
  const latestX = candles[candles.length - 1]?.x ?? 0;
  const structure = computeMarketStructure(candles, {
    lookback,
    pivotStrength,
    atrPeriod: options.atrPeriod,
    minMoveAtr: options.minMoveAtr ?? 0,
    maxSwings: Math.min(500, lookback),
    maxBreaks: 24,
  });

  return computeSupportResistanceZonesFromSwings(structure.swings, {
    maxZones,
    thicknessBps,
    latestX,
    referencePrice: options.referencePrice ?? candles[candles.length - 1]?.c ?? null,
    zonesPerSide: options.zonesPerSide,
  });
}

export function computeSupportResistanceZonesFromSwings(
  swings: SwingPoint[],
  options: SupportResistanceZoneFromSwingsOptions = {},
): SupportResistanceZone[] {
  const maxZones = clampIntegerOption(options.maxZones, 1, 12, 6);
  const thicknessBps = clampNumberOption(options.thicknessBps, 1, 100, 10);
  const latestX = options.latestX ?? swings[swings.length - 1]?.x ?? 0;
  const referencePrice = normalizedNullableNumber(options.referencePrice);
  const zonesPerSide =
    options.zonesPerSide == null
      ? null
      : clampIntegerOption(options.zonesPerSide, 1, 12, 3);
  const clusters: SupportResistanceZone[] = [];

  for (const swing of swings) {
    addZonePivot(
      clusters,
      swing.kind === "SwingHigh" ? "resistance" : "support",
      swing,
      latestX - swing.x + 1,
      thicknessBps,
    );
  }

  const ranked = clusters
    .filter((zone) => Number.isFinite(zone.center) && zone.high > zone.low)
    .sort((a, b) => b.score - a.score || b.touches - a.touches || b.lastX - a.lastX)
    .slice(0, Math.max(maxZones * 2, maxZones));
  return selectSupportResistanceZones(ranked, maxZones, referencePrice, zonesPerSide);
}

export function computeRelativeCumulativeReturnLine(
  candles: CandleRecord[],
  benchmarkCandles: CandleRecord[],
): Float32Array {
  const benchmarkByBucket = new Map(
    benchmarkCandles
      .filter((candle) => validPositivePrice(candle.c))
      .map((candle) => [candle.bucket, candle]),
  );
  let anchorPrice: number | null = null;
  let anchorBenchmarkPrice: number | null = null;
  const points: number[] = [];

  for (const candle of candles) {
    if (!validPositivePrice(candle.c)) continue;
    const benchmark = benchmarkByBucket.get(candle.bucket);
    if (!benchmark || !validPositivePrice(benchmark.c)) continue;

    if (anchorPrice == null || anchorBenchmarkPrice == null) {
      anchorPrice = candle.c;
      anchorBenchmarkPrice = benchmark.c;
    }

    const relativeRatio = candle.c / anchorPrice / (benchmark.c / anchorBenchmarkPrice);
    points.push(candle.x, (relativeRatio - 1) * 100);
  }

  return new Float32Array(points);
}

export function computeRelativeStrengthDivergences(
  candles: CandleRecord[],
  benchmarkCandles: CandleRecord[],
  options: RelativeStrengthDivergenceOptions = {},
): RelativeStrengthDivergence[] {
  const maxDivergences = clampIntegerOption(options.maxDivergences, 1, 100, 16);
  const minDeltaPct = clampNumberOption(options.minDeltaPct, 0, 50, 0.5);
  const rsByX = linePointMap(computeRelativeCumulativeReturnLine(candles, benchmarkCandles));
  if (!candles.length || rsByX.size < 2) return [];

  const structure = computeMarketStructure(candles, {
    ...options,
    maxSwings: Math.max(options.maxSwings ?? 120, maxDivergences * 4),
    maxBreaks: options.maxBreaks ?? 24,
  });
  const divergences: RelativeStrengthDivergence[] = [];
  let previousHigh: SwingPoint | null = null;
  let previousLow: SwingPoint | null = null;

  for (const swing of structure.swings) {
    const rs = rsByX.get(swing.x);
    if (rs == null || !Number.isFinite(rs)) continue;

    if (swing.kind === "SwingHigh") {
      if (previousHigh) {
        const previousRs = rsByX.get(previousHigh.x);
        if (previousRs != null && Number.isFinite(previousRs)) {
          if (swing.price > previousHigh.price && rs <= previousRs - minDeltaPct) {
            divergences.push(
              createRelativeStrengthDivergence(
                "bearishHigh",
                "bearish",
                "RS LH",
                swing,
                previousHigh,
                rs,
                previousRs,
              ),
            );
          } else if (swing.price < previousHigh.price && rs >= previousRs + minDeltaPct) {
            divergences.push(
              createRelativeStrengthDivergence(
                "bullishHigh",
                "bullish",
                "RS HH",
                swing,
                previousHigh,
                rs,
                previousRs,
              ),
            );
          }
        }
      }
      previousHigh = swing;
      continue;
    }

    if (previousLow) {
      const previousRs = rsByX.get(previousLow.x);
      if (previousRs != null && Number.isFinite(previousRs)) {
        if (swing.price > previousLow.price && rs <= previousRs - minDeltaPct) {
          divergences.push(
            createRelativeStrengthDivergence(
              "bearishLow",
              "bearish",
              "RS LL",
              swing,
              previousLow,
              rs,
              previousRs,
            ),
          );
        } else if (swing.price < previousLow.price && rs >= previousRs + minDeltaPct) {
          divergences.push(
            createRelativeStrengthDivergence(
              "bullishLow",
              "bullish",
              "RS HL",
              swing,
              previousLow,
              rs,
              previousRs,
            ),
          );
        }
      }
    }
    previousLow = swing;
  }

  return divergences.slice(-maxDivergences);
}

export function lineToBytes(line: Float32Array): Uint8Array {
  return new Uint8Array(line.buffer);
}

function validPositivePrice(value: number) {
  return Number.isFinite(value) && value > 0;
}

function normalizedNullableNumber(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? null : Number(value);
}

function latestValidCloseCandle(candles: CandleRecord[]) {
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    const candle = candles[index];
    if (validPositivePrice(candle.c)) return candle;
  }
  return null;
}

function createAnchoredVwapSignal(
  kind: AnchoredVwapSignalKind,
  index: number,
  candle: CandleRecord,
  vwap: number,
): AnchoredVwapSignal {
  return {
    kind,
    label:
      kind === "loss"
        ? "AVWAP loss"
        : kind === "reclaim"
          ? "AVWAP reclaim"
          : "Failed AVWAP reclaim",
    index,
    x: candle.x,
    ts: candle.ts,
    bucket: candle.bucket,
    price: candle.c,
    vwap,
  };
}

function anchoredVwapStartIndex(
  candles: CandleRecord[],
  options: AnchoredVwapOptions,
) {
  const anchorBucket =
    options.anchorBucket == null ? null : Number(options.anchorBucket);
  if (anchorBucket != null && Number.isFinite(anchorBucket)) {
    const index = candles.findIndex((candle) => candle.bucket >= anchorBucket);
    return index >= 0 ? index : null;
  }

  const anchorX = options.anchorX == null ? null : Number(options.anchorX);
  if (anchorX != null && Number.isFinite(anchorX)) {
    const index = candles.findIndex((candle) => candle.x >= anchorX);
    return index >= 0 ? index : null;
  }

  return null;
}

function anchoredVwapBaseVolume(candle: CandleRecord, typicalPrice: number) {
  const baseVolume = Number(candle.v_base);
  if (Number.isFinite(baseVolume) && baseVolume > 0) return baseVolume;
  const quoteVolume = Number(candle.v_quote);
  if (Number.isFinite(quoteVolume) && quoteVolume > 0 && typicalPrice > 0) {
    return quoteVolume / typicalPrice;
  }
  return 0;
}

function createSwingPoint(
  kind: SwingPointKind,
  index: number,
  candle: CandleRecord,
  price: number,
  atr: number | null,
): SwingPoint {
  return {
    kind,
    structure: kind,
    label: kind === "SwingHigh" ? "SH" : "SL",
    index,
    x: candle.x,
    ts: candle.ts,
    bucket: candle.bucket,
    price,
    atr,
  };
}

function classifySwingPoints(swings: SwingPoint[]): SwingPoint[] {
  let lastHigh: SwingPoint | null = null;
  let lastLow: SwingPoint | null = null;
  return swings.map((swing) => {
    if (swing.kind === "SwingHigh") {
      const structure: SwingPointStructure =
        lastHigh == null ? "SwingHigh" : swing.price > lastHigh.price ? "HigherHigh" : "LowerHigh";
      const label: SwingPointLabel =
        structure === "SwingHigh" ? "SH" : structure === "HigherHigh" ? "HH" : "LH";
      const next = { ...swing, structure, label };
      lastHigh = next;
      return next;
    }

    const structure: SwingPointStructure =
      lastLow == null ? "SwingLow" : swing.price > lastLow.price ? "HigherLow" : "LowerLow";
    const label: SwingPointLabel =
      structure === "SwingLow" ? "SL" : structure === "HigherLow" ? "HL" : "LL";
    const next = { ...swing, structure, label };
    lastLow = next;
    return next;
  });
}

function createStructureBreak(
  kind: StructureBreakKind,
  direction: StructureDirection,
  index: number,
  candle: CandleRecord,
  sourceSwing: SwingPoint,
): StructureBreak {
  return {
    kind,
    direction,
    label: kind === "StructureBreak" ? "BOS" : "Shift",
    index,
    x: candle.x,
    ts: candle.ts,
    bucket: candle.bucket,
    level: sourceSwing.price,
    sourceSwingX: sourceSwing.x,
    sourceSwingPrice: sourceSwing.price,
  };
}

function createRelativeStrengthDivergence(
  kind: RelativeStrengthDivergenceKind,
  direction: StructureDirection,
  label: RelativeStrengthDivergence["label"],
  swing: SwingPoint,
  previousSwing: SwingPoint,
  rs: number,
  previousRs: number,
): RelativeStrengthDivergence {
  return {
    kind,
    direction,
    label,
    index: swing.index,
    x: swing.x,
    ts: swing.ts,
    bucket: swing.bucket,
    price: swing.price,
    previousPrice: previousSwing.price,
    rs,
    previousRs,
    priceLabel: swing.label,
  };
}

function summarizeMarketStructure(
  swings: SwingPoint[],
  breaks: StructureBreak[],
  trend: StructureDirection | "neutral",
): MarketStructureSummary {
  const lastBreak = breaks[breaks.length - 1] ?? null;
  const lastSwingHigh = findLastSwing(swings, "SwingHigh");
  const lastSwingLow = findLastSwing(swings, "SwingLow");
  const latestSwing = swings[swings.length - 1] ?? null;
  const repeatedOpposingShifts = hasRepeatedOpposingShifts(breaks);
  const state: StructureSummaryState =
    swings.length === 0
      ? "neutral"
      : lastBreak == null || repeatedOpposingShifts
        ? "range"
        : lastBreak.kind === "StructureShift"
          ? "transitional"
          : lastBreak.direction;
  const transitionDirection =
    state === "transitional" ? lastBreak?.direction ?? null : null;

  return {
    state,
    trend,
    transitionDirection,
    lastBreak,
    lastSwingHigh,
    lastSwingLow,
    updatedX: lastBreak?.x ?? latestSwing?.x ?? null,
    updatedTs: lastBreak?.ts ?? latestSwing?.ts ?? null,
  };
}

function latestPreferredSwingLevel(
  swings: SwingPoint[],
  kind: SwingPointKind,
  preferredStructures: SwingPointStructure[],
  role: StructureActiveLevelRole,
  direction: StructureDirection | null,
) {
  for (let index = swings.length - 1; index >= 0; index -= 1) {
    const swing = swings[index];
    if (swing.kind === kind && preferredStructures.includes(swing.structure)) {
      return createStructureActiveLevel(role, direction, swing);
    }
  }
  const fallback = findLastSwing(swings, kind);
  return fallback ? createStructureActiveLevel(role, direction, fallback) : null;
}

function latestExtremeSwingLevel(
  swings: SwingPoint[],
  kind: SwingPointKind,
  role: StructureActiveLevelRole,
  direction: StructureDirection | null,
  highest: boolean,
) {
  let best: SwingPoint | null = null;
  for (const swing of swings) {
    if (swing.kind !== kind) continue;
    if (!best || (highest ? swing.price > best.price : swing.price < best.price)) {
      best = swing;
    }
  }
  return best ? createStructureActiveLevel(role, direction, best) : null;
}

function createStructureActiveLevel(
  role: StructureActiveLevelRole,
  direction: StructureDirection | null,
  sourceSwing: SwingPoint,
): StructureActiveLevel {
  return {
    role,
    direction,
    price: sourceSwing.price,
    x: sourceSwing.x,
    ts: sourceSwing.ts,
    bucket: sourceSwing.bucket,
    sourceSwing,
  };
}

function hasRepeatedOpposingShifts(breaks: StructureBreak[]) {
  const recentShifts = breaks
    .slice(-5)
    .filter((item) => item.kind === "StructureShift");
  if (recentShifts.length < 3) return false;
  for (let index = 1; index < recentShifts.length; index += 1) {
    if (recentShifts[index].direction === recentShifts[index - 1].direction) {
      return false;
    }
  }
  return true;
}

function findLastSwing(swings: SwingPoint[], kind: SwingPointKind) {
  for (let index = swings.length - 1; index >= 0; index -= 1) {
    const swing = swings[index];
    if (swing.kind === kind) return swing;
  }
  return null;
}

function isMoreExtremeSwing(candidate: SwingPoint, existing: SwingPoint) {
  if (candidate.kind === "SwingHigh") return candidate.price > existing.price;
  return candidate.price < existing.price;
}

function swingMoveThreshold(candidate: SwingPoint, previous: SwingPoint, minMoveAtr: number) {
  const atr =
    candidate.atr != null && Number.isFinite(candidate.atr)
      ? candidate.atr
      : previous.atr != null && Number.isFinite(previous.atr)
        ? previous.atr
        : 0;
  return Math.max(0, atr * minMoveAtr);
}

function atrValues(candles: CandleRecord[], period: number) {
  const length = normalizedPeriod(period);
  const values: Array<number | null> = Array(candles.length).fill(null);
  if (candles.length < length) return values;
  const trueRanges = candles.map((candle, index) => {
    if (index === 0) return candle.h - candle.l;
    const previousClose = candles[index - 1].c;
    return Math.max(
      candle.h - candle.l,
      Math.abs(candle.h - previousClose),
      Math.abs(candle.l - previousClose),
    );
  });

  let atr = 0;
  for (let i = 0; i < length; i += 1) atr += trueRanges[i];
  atr /= length;
  values[length - 1] = atr;
  for (let i = length; i < candles.length; i += 1) {
    atr = (atr * (length - 1) + trueRanges[i]) / length;
    values[i] = atr;
  }
  return values;
}

function addZonePivot(
  zones: SupportResistanceZone[],
  kind: SupportResistanceZone["kind"],
  swing: SwingPoint,
  age: number,
  thicknessBps: number,
) {
  const value = swing.price;
  if (!Number.isFinite(value) || value <= 0) return;
  const halfSpan = Math.max(value * (thicknessBps / 10000), Number.EPSILON);
  const low = value - halfSpan;
  const high = value + halfSpan;
  const recencyScore = 1 / Math.max(1, age);
  const existing = zones.find(
    (zone) => zone.kind === kind && rangesOverlap(zone.low, zone.high, low, high),
  );
  if (!existing) {
    zones.push({
      kind,
      low,
      high,
      center: value,
      touches: 1,
      score: 1 + recencyScore,
      strength: 1 + recencyScore,
      lastX: swing.x,
      source: "swing",
      structures: [swing.structure],
    });
    return;
  }

  const totalTouches = existing.touches + 1;
  existing.center = (existing.center * existing.touches + value) / totalTouches;
  existing.touches = totalTouches;
  existing.score += 1 + recencyScore;
  existing.strength = existing.score;
  existing.lastX = Math.max(existing.lastX, swing.x);
  existing.structures.push(swing.structure);
  const nextHalfSpan = Math.max(existing.center * (thicknessBps / 10000), Number.EPSILON);
  existing.low = Math.min(existing.low, existing.center - nextHalfSpan, low);
  existing.high = Math.max(existing.high, existing.center + nextHalfSpan, high);
}

function selectSupportResistanceZones(
  zones: SupportResistanceZone[],
  maxZones: number,
  referencePrice: number | null,
  zonesPerSide: number | null,
) {
  if (!referencePrice || !zonesPerSide) return zones.slice(0, maxZones);

  const selected = new Set<SupportResistanceZone>();
  const nearestSupports = zones
    .filter((zone) => zone.center <= referencePrice)
    .sort((a, b) => referencePrice - a.center - (referencePrice - b.center) || b.score - a.score)
    .slice(0, zonesPerSide);
  const nearestResistances = zones
    .filter((zone) => zone.center > referencePrice)
    .sort((a, b) => a.center - referencePrice - (b.center - referencePrice) || b.score - a.score)
    .slice(0, zonesPerSide);

  for (const zone of [...nearestSupports, ...nearestResistances]) {
    selected.add(zone);
  }
  for (const zone of zones) {
    if (selected.size >= maxZones) break;
    selected.add(zone);
  }

  return Array.from(selected)
    .sort((a, b) => b.score - a.score || b.touches - a.touches || b.lastX - a.lastX)
    .slice(0, maxZones);
}

function isPivotHigh(candles: CandleRecord[], index: number, strength: number) {
  const value = candles[index].h;
  if (!Number.isFinite(value)) return false;
  for (let offset = 1; offset <= strength; offset += 1) {
    if (candles[index - offset].h >= value || candles[index + offset].h > value) return false;
  }
  return true;
}

function isPivotLow(candles: CandleRecord[], index: number, strength: number) {
  const value = candles[index].l;
  if (!Number.isFinite(value)) return false;
  for (let offset = 1; offset <= strength; offset += 1) {
    if (candles[index - offset].l <= value || candles[index + offset].l < value) return false;
  }
  return true;
}

function rangesOverlap(aLow: number, aHigh: number, bLow: number, bHigh: number) {
  return aLow <= bHigh && bLow <= aHigh;
}

function linePointMap(line: Float32Array) {
  const points = new Map<number, number>();
  for (let index = 0; index < line.length; index += 2) {
    const x = line[index];
    const value = line[index + 1];
    if (Number.isFinite(x) && Number.isFinite(value)) points.set(x, value);
  }
  return points;
}

function emaValues(candles: CandleRecord[], period: number) {
  const length = normalizedPeriod(period);
  const values: Array<number | null> = Array(candles.length).fill(null);
  if (candles.length < length) return values;
  const multiplier = 2 / (length + 1);
  let ema = 0;
  for (let i = 0; i < length; i++) ema += candles[i].c;
  ema /= length;
  values[length - 1] = ema;
  for (let i = length; i < candles.length; i++) {
    ema = (candles[i].c - ema) * multiplier + ema;
    values[i] = ema;
  }
  return values;
}

function emaLinePoints(points: Array<{ x: number; value: number }>, period: number) {
  const length = normalizedPeriod(period);
  if (points.length < length) return [];
  const averaged: Array<{ x: number; value: number }> = [];
  const multiplier = 2 / (length + 1);
  let ema = 0;
  for (let i = 0; i < length; i++) ema += points[i].value;
  ema /= length;
  averaged.push({ x: points[length - 1].x, value: ema });
  for (let i = length; i < points.length; i++) {
    ema = (points[i].value - ema) * multiplier + ema;
    averaged.push({ x: points[i].x, value: ema });
  }
  return averaged;
}

function computeRsiPoints(candles: CandleRecord[], period: number) {
  const length = normalizedPeriod(period);
  if (candles.length <= length) return [];

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= length; i++) {
    const change = candles[i].c - candles[i - 1].c;
    if (change >= 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= length;
  avgLoss /= length;

  const points: Array<{ x: number; value: number }> = [
    { x: candles[length].x, value: rsiFromAverages(avgGain, avgLoss) },
  ];

  for (let i = length + 1; i < candles.length; i++) {
    const change = candles[i].c - candles[i - 1].c;
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;
    points.push({ x: candles[i].x, value: rsiFromAverages(avgGain, avgLoss) });
  }

  return points;
}

function movingAveragePoints(points: Array<{ x: number; value: number }>, period: number) {
  if (points.length < period) return [];
  const averaged: Array<{ x: number; value: number }> = [];
  let sum = 0;
  points.forEach((point, index) => {
    sum += point.value;
    if (index >= period) sum -= points[index - period].value;
    if (index >= period - 1) {
      averaged.push({ x: point.x, value: sum / period });
    }
  });
  return averaged;
}

function pointsToLine(points: Array<{ x: number; value: number }>) {
  const line: number[] = [];
  for (const point of points) {
    line.push(point.x, point.value);
  }
  return new Float32Array(line);
}

function rsiFromAverages(avgGain: number, avgLoss: number) {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  if (avgGain === 0) return 0;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function normalizedPeriod(period: number) {
  const value = Math.floor(Number(period));
  return Number.isFinite(value) ? Math.max(1, value) : 1;
}

function clampIntegerOption(value: unknown, min: number, max: number, fallback: number) {
  return Math.floor(clampNumberOption(value, min, max, fallback));
}

function clampNumberOption(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
