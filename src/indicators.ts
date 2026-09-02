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
  const length = normalizedPeriod(period);
  if (candles.length < length) return new Float32Array();
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
  for (let i = 0; i < length; i++) atr += trueRanges[i];
  atr /= length;
  const points: Array<{ x: number; value: number }> = [{ x: candles[length - 1].x, value: atr }];
  for (let i = length; i < candles.length; i++) {
    atr = (atr * (length - 1) + trueRanges[i]) / length;
    points.push({ x: candles[i].x, value: atr });
  }
  return pointsToLine(points);
}

export function computeSupportResistanceZones(
  candles: CandleRecord[],
  options: SupportResistanceZoneOptions = {},
): SupportResistanceZone[] {
  const lookback = clampIntegerOption(options.lookback, 20, 1000, 240);
  const pivotStrength = clampIntegerOption(options.pivotStrength, 1, 20, 3);
  const maxZones = clampIntegerOption(options.maxZones, 1, 12, 6);
  const thicknessBps = clampNumberOption(options.thicknessBps, 1, 100, 10);
  const source = candles.slice(-lookback);
  if (source.length < pivotStrength * 2 + 1) return [];

  const clusters: SupportResistanceZone[] = [];
  for (let index = pivotStrength; index < source.length - pivotStrength; index += 1) {
    const candle = source[index];
    if (isPivotHigh(source, index, pivotStrength)) {
      addZonePivot(clusters, "resistance", candle.h, candle.x, source.length - index, thicknessBps);
    }
    if (isPivotLow(source, index, pivotStrength)) {
      addZonePivot(clusters, "support", candle.l, candle.x, source.length - index, thicknessBps);
    }
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

    points.push(
      candle.x,
      Math.log(candle.c / anchorPrice) - Math.log(benchmark.c / anchorBenchmarkPrice),
    );
  }

  return new Float32Array(points);
}

export function lineToBytes(line: Float32Array): Uint8Array {
  return new Uint8Array(line.buffer);
}

function validPositivePrice(value: number) {
  return Number.isFinite(value) && value > 0;
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
