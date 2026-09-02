import type { CandleRecord } from "./types";

export interface SupportResistanceZone {
  kind: "support" | "resistance";
  low: number;
  high: number;
  center: number;
  touches: number;
  score: number;
  lastX: number;
}

export interface SupportResistanceZoneOptions {
  lookback?: number;
  pivotStrength?: number;
  maxZones?: number;
  thicknessBps?: number;
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

export interface MarketStructureState {
  swings: SwingPoint[];
  breaks: StructureBreak[];
  trend: StructureDirection | "neutral";
}

export interface AnchoredVwapOptions {
  anchorBucket?: number | null;
  anchorX?: number | null;
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

  return {
    swings: swings.slice(-maxSwings),
    breaks: breaks.slice(-maxBreaks),
    trend,
  };
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

  const clusters: SupportResistanceZone[] = [];
  const swings = computeSwingPoints(candles, {
    lookback,
    pivotStrength,
    atrPeriod: options.atrPeriod,
    minMoveAtr: options.minMoveAtr ?? 0,
    maxSwings: lookback,
  });
  for (const swing of swings) {
    addZonePivot(
      clusters,
      swing.kind === "SwingHigh" ? "resistance" : "support",
      swing.price,
      swing.x,
      latestX - swing.x + 1,
      thicknessBps,
    );
  }

  return clusters
    .filter((zone) => Number.isFinite(zone.center) && zone.high > zone.low)
    .sort((a, b) => b.score - a.score || b.touches - a.touches || b.lastX - a.lastX)
    .slice(0, maxZones);
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

export function lineToBytes(line: Float32Array): Uint8Array {
  return new Uint8Array(line.buffer);
}

function validPositivePrice(value: number) {
  return Number.isFinite(value) && value > 0;
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
  if (Number.isFinite(candle.v_base) && candle.v_base > 0) return candle.v_base;
  if (Number.isFinite(candle.v_quote) && candle.v_quote > 0 && typicalPrice > 0) {
    return candle.v_quote / typicalPrice;
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
  value: number,
  x: number,
  age: number,
  thicknessBps: number,
) {
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
      lastX: x,
    });
    return;
  }

  const totalTouches = existing.touches + 1;
  existing.center = (existing.center * existing.touches + value) / totalTouches;
  existing.touches = totalTouches;
  existing.score += 1 + recencyScore;
  existing.lastX = Math.max(existing.lastX, x);
  const nextHalfSpan = Math.max(existing.center * (thicknessBps / 10000), Number.EPSILON);
  existing.low = Math.min(existing.low, existing.center - nextHalfSpan, low);
  existing.high = Math.max(existing.high, existing.center + nextHalfSpan, high);
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
