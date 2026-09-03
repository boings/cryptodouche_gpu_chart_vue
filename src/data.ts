import type {
  CandleRecord,
  GpuSeriesState,
  LiveMergeResult,
  OhlcvPoint,
  ViewBounds,
} from "./types";
import { canonicalSerialize } from "./serialization";

const FLOATS_PER_CANDLE = 5;

interface RankedOhlcvPoint extends OhlcvPoint {
  sourceOrder: number;
}

export function timeframeToSeconds(timeframe: string | number): number {
  const raw = String(timeframe).trim().toLowerCase();
  if (raw.endsWith("m")) return parseInt(raw, 10) * 60;
  if (raw.endsWith("h")) return parseInt(raw, 10) * 60 * 60;
  if (raw.endsWith("d")) return parseInt(raw, 10) * 24 * 60 * 60;
  return parseInt(raw, 10) * 60;
}

export function isStrictTimeframe(timeframe: string): boolean {
  if (!/^[1-9]\d*[mhd]$/.test(timeframe)) return false;
  const value = Number.parseInt(timeframe, 10);
  const multiplier = timeframe.endsWith("m")
    ? 60
    : timeframe.endsWith("h")
      ? 3_600
      : 86_400;
  return Number.isSafeInteger(value) && Number.isSafeInteger(value * multiplier);
}

export function strictTimeframeToSeconds(timeframe: string): number {
  if (!isStrictTimeframe(timeframe)) {
    throw new RangeError(`Invalid radar/replay timeframe ${timeframe}`);
  }
  return timeframeToSeconds(timeframe);
}

export function candleRevisionKnownAt(candle: CandleRecord, timeframe: string): number {
  return candle.knownAt ?? candle.bucket + strictTimeframeToSeconds(timeframe);
}

export function selectCompletedCandleRevisionsAt(
  candles: readonly CandleRecord[],
  timeframe: string,
  asOf: number,
): CandleRecord[] {
  const timeframeSeconds = strictTimeframeToSeconds(timeframe);
  const selected = new Map<number, CandleRecord>();
  const eligible = candles.filter((candle) => {
    if (!Number.isFinite(candle.bucket)) {
      throw new RangeError("Candle bucket must be finite");
    }
    if (candle.bucket + timeframeSeconds > asOf) return false;
    if (candle.knownAt != null && !Number.isFinite(candle.knownAt)) {
      throw new RangeError(`Invalid candle revision time for bucket ${candle.bucket}`);
    }
    return candleRevisionKnownAt(candle, timeframe) <= asOf;
  });

  for (const candle of [...eligible].sort(
    (left, right) => left.bucket - right.bucket || left.ts - right.ts,
  )) {
    if (
      !validHistoricalCandle(candle) ||
      candle.bucket % timeframeSeconds !== 0 ||
      Math.floor(candle.ts / timeframeSeconds) * timeframeSeconds !== candle.bucket
    ) {
      throw new RangeError(`Invalid candle for bucket ${candle.bucket}`);
    }
    const knownAt = candleRevisionKnownAt(candle, timeframe);
    if (knownAt < candle.bucket + timeframeSeconds) {
      throw new RangeError(`Candle revision predates close for bucket ${candle.bucket}`);
    }
    const existing = selected.get(candle.bucket);
    if (existing) {
      const existingKnownAt = candleRevisionKnownAt(existing, timeframe);
      if (
        existingKnownAt === knownAt &&
        canonicalHistoricalCandle(existing, timeframe) !==
          canonicalHistoricalCandle(candle, timeframe)
      ) {
        throw new Error(`Conflicting candle revisions for bucket ${candle.bucket} at ${knownAt}`);
      }
      if (existingKnownAt > knownAt) continue;
    }
    selected.set(candle.bucket, candle);
  }
  return [...selected.values()].sort((left, right) => left.bucket - right.bucket);
}

export function normalizeRestTimeframe(timeframe: string | number): string {
  const raw = String(timeframe).trim().toLowerCase();
  if (raw === "60") return "1h";
  if (raw.endsWith("m") || raw.endsWith("h") || raw.endsWith("d")) return raw;
  return `${raw}m`;
}

export function bucketStart(tsSec: number, timeframeSec: number): number {
  return Math.floor(tsSec / timeframeSec) * timeframeSec;
}

export function normalizeOhlcvPoint(input: unknown): OhlcvPoint | null {
  const raw = unwrapPayload(input);
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const ts = parseTimestamp(record.ts);
  const o = finiteNumber(record.o);
  const h = finiteNumber(record.h);
  const l = finiteNumber(record.l);
  const c = finiteNumber(record.c);
  const knownAt = record.knownAt == null ? undefined : parseTimestamp(record.knownAt);
  if (
    ts == null ||
    o == null ||
    h == null ||
    l == null ||
    c == null ||
    (record.knownAt != null && knownAt == null)
  ) return null;
  return {
    ts,
    o,
    h,
    l,
    c,
    v_base: finiteNumber(record.v_base),
    v_quote: finiteNumber(record.v_quote),
    ver: finiteNumber(record.ver),
    knownAt: knownAt ?? undefined,
  };
}

export function packHistoricalCandles(
  rawRows: unknown[],
  timeframe: string | number,
  limit: number,
): GpuSeriesState {
  const timeframeSec = timeframeToSeconds(timeframe);
  const normalized = collapseDuplicateBuckets(
    rawRows
      .map((row, sourceOrder) => normalizeRankedOhlcvPoint(row, sourceOrder))
      .filter((row): row is RankedOhlcvPoint => row != null),
    timeframeSec,
  )
    .slice(-Math.max(1, limit));

  if (!normalized.length) {
    return {
      timeframeSec,
      firstBucket: 0,
      candles: [],
      positionByBucket: new Map(),
    };
  }

  const firstBucket = bucketStart(normalized[0].ts, timeframeSec);
  const candles = normalized.map((row) => {
    const bucket = bucketStart(row.ts, timeframeSec);
    return {
      ...row,
      bucket,
      x: (bucket - firstBucket) / timeframeSec,
    };
  });

  return rebuildPositions({
    timeframeSec,
    firstBucket,
    candles,
    positionByBucket: new Map(),
  });
}

export function prependHistoricalCandles(
  state: GpuSeriesState,
  rawRows: unknown[],
  timeframe: string | number,
): number {
  const previousLength = state.candles.length;
  const rows = rawRows
    .map((row, sourceOrder) => normalizeRankedOhlcvPoint(row, sourceOrder))
    .filter((row): row is RankedOhlcvPoint => row != null)
    .filter((row) => bucketStart(row.ts, state.timeframeSec) < state.firstBucket)
    .sort(compareHistoricalCandles);

  if (!rows.length) return 0;

  const next = packHistoricalCandles(
    [...rows, ...state.candles],
    timeframe,
    rows.length + state.candles.length,
  );
  state.timeframeSec = next.timeframeSec;
  state.firstBucket = next.firstBucket;
  state.candles = next.candles;
  state.positionByBucket = next.positionByBucket;
  return Math.max(0, state.candles.length - previousLength);
}

export function candlesToBytes(candles: CandleRecord[]): Uint8Array {
  const floats = new Float32Array(candles.length * FLOATS_PER_CANDLE);
  candles.forEach((candle, index) => {
    floats.set([candle.x, candle.o, candle.h, candle.l, candle.c], index * FLOATS_PER_CANDLE);
  });
  return new Uint8Array(floats.buffer);
}

export function candleToBytes(candle: CandleRecord): Uint8Array {
  const floats = new Float32Array([candle.x, candle.o, candle.h, candle.l, candle.c]);
  return new Uint8Array(floats.buffer);
}

export function computeCloseChangePct(candles: CandleRecord[]): number | null {
  if (candles.length < 2) return null;
  const previous = candles[candles.length - 2];
  const latest = candles[candles.length - 1];
  if (!Number.isFinite(previous.c) || !Number.isFinite(latest.c) || previous.c === 0) {
    return null;
  }
  return ((latest.c - previous.c) / Math.abs(previous.c)) * 100;
}

export function mergeLiveCandle(
  state: GpuSeriesState,
  payload: unknown,
  limit: number,
  gapLimit = 3,
): LiveMergeResult {
  const point = normalizeOhlcvPoint(payload);
  if (!point) return { kind: "ignore", reason: "invalid-payload" };
  if (!state.candles.length || state.firstBucket === 0) {
    return { kind: "ignore", reason: "empty-history" };
  }

  const bucket = bucketStart(point.ts, state.timeframeSec);
  if (bucket < state.firstBucket) return { kind: "ignore", reason: "before-history" };

  const existingPosition = state.positionByBucket.get(bucket);
  const x = (bucket - state.firstBucket) / state.timeframeSec;
  const candle: CandleRecord = { ...point, bucket, x };

  if (existingPosition != null) {
    if (isStaleVersion(candle, state.candles[existingPosition])) {
      return { kind: "ignore", reason: "stale-version" };
    }
    if (candlesEqual(state.candles[existingPosition], candle)) {
      state.candles[existingPosition] = candle;
      return { kind: "ignore", reason: "unchanged" };
    }
    state.candles[existingPosition] = candle;
    return {
      kind: "replace",
      position: existingPosition,
      bytes: candleToBytes(candle),
    };
  }

  const last = state.candles[state.candles.length - 1];
  if (bucket <= last.bucket) return { kind: "ignore", reason: "stale-gap" };
  const bucketGap = (bucket - last.bucket) / state.timeframeSec;
  if (bucketGap > gapLimit) return { kind: "ignore", reason: "gap-too-large" };

  state.candles.push(candle);
  if (state.candles.length > Math.max(1, limit)) {
    state.candles.splice(0, state.candles.length - Math.max(1, limit));
    reanchor(state);
    return { kind: "reset", bytes: candlesToBytes(state.candles) };
  }

  rebuildPositions(state);
  return {
    kind: "append",
    position: state.candles.length - 1,
    bytes: candleToBytes(candle),
  };
}

export function computeViewBounds(
  candles: CandleRecord[],
  lineSeries: Float32Array[] = [],
): ViewBounds {
  if (!candles.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let minY = Infinity;
  let maxY = -Infinity;
  for (const candle of candles) {
    minY = Math.min(minY, candle.l);
    maxY = Math.max(maxY, candle.h);
  }
  for (const line of lineSeries) {
    for (let i = 1; i < line.length; i += 2) {
      const y = line[i];
      if (Number.isFinite(y)) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const span = Math.max(1e-9, maxY - minY);
  const pad = span * 0.08;
  return {
    minX: candles[0].x,
    maxX: candles[candles.length - 1].x,
    minY: minY - pad,
    maxY: maxY + pad,
  };
}

export function makeSyntheticCandles(
  symbol: string,
  limit: number,
  timeframe: string | number,
): GpuSeriesState {
  const timeframeSec = timeframeToSeconds(timeframe);
  const now = Math.floor(Date.now() / 1000);
  const endBucket = bucketStart(now, timeframeSec);
  const seed = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rows: OhlcvPoint[] = [];
  let close = 40 + (seed % 160);
  for (let i = Math.max(1, limit) - 1; i >= 0; i--) {
    const ts = endBucket - i * timeframeSec;
    const drift = Math.sin((limit - i + seed) / 9) * 0.8;
    const o = close;
    const c = Math.max(0.0001, o + drift + Math.cos((limit - i) / 13) * 0.35);
    const h = Math.max(o, c) + 0.35 + Math.abs(Math.sin(i + seed)) * 0.5;
    const l = Math.min(o, c) - 0.35 - Math.abs(Math.cos(i + seed)) * 0.5;
    const v_base = 50 + (seed % 90) + Math.abs(Math.sin((limit - i + seed) / 5)) * 180;
    rows.push({ ts, o, h, l, c, v_base, v_quote: v_base * c });
    close = c;
  }
  return packHistoricalCandles(rows, timeframe, limit);
}

export function appendSyntheticCandle(
  state: GpuSeriesState,
  limit: number,
): LiveMergeResult {
  const last = state.candles[state.candles.length - 1];
  if (!last) return { kind: "ignore", reason: "empty-history" };
  const ts = last.bucket + state.timeframeSec;
  const wave = Math.sin(ts / 600) * 0.7;
  const o = last.c;
  const c = Math.max(0.0001, o + wave);
  const h = Math.max(o, c) + 0.5;
  const l = Math.min(o, c) - 0.5;
  const v_base = Math.max(1, (last.v_base ?? 100) * (0.82 + Math.abs(wave) * 0.36));
  return mergeLiveCandle(state, { ts, o, h, l, c, v_base, v_quote: v_base * c }, limit);
}

function reanchor(state: GpuSeriesState) {
  const first = state.candles[0];
  state.firstBucket = first ? first.bucket : 0;
  for (const candle of state.candles) {
    candle.x = (candle.bucket - state.firstBucket) / state.timeframeSec;
  }
  rebuildPositions(state);
}

function rebuildPositions(state: GpuSeriesState): GpuSeriesState {
  state.positionByBucket = new Map();
  state.candles.forEach((candle, index) => {
    state.positionByBucket.set(candle.bucket, index);
  });
  return state;
}

function normalizeRankedOhlcvPoint(input: unknown, sourceOrder: number): RankedOhlcvPoint | null {
  const point = normalizeOhlcvPoint(input);
  return point ? { ...point, sourceOrder } : null;
}

function collapseDuplicateBuckets(rows: RankedOhlcvPoint[], timeframeSec: number): OhlcvPoint[] {
  const byBucket = new Map<number, RankedOhlcvPoint>();
  for (const row of rows) {
    const bucket = bucketStart(row.ts, timeframeSec);
    const previous = byBucket.get(bucket);
    if (!previous || compareHistoricalCandles(row, previous) > 0) {
      byBucket.set(bucket, row);
    }
  }

  return Array.from(byBucket.entries())
    .sort(([leftBucket], [rightBucket]) => leftBucket - rightBucket)
    .map(([, row]) => stripRank(row));
}

function compareHistoricalCandles(left: RankedOhlcvPoint, right: RankedOhlcvPoint): number {
  const leftVersion = left.ver ?? Number.NEGATIVE_INFINITY;
  const rightVersion = right.ver ?? Number.NEGATIVE_INFINITY;
  if (leftVersion !== rightVersion) return leftVersion - rightVersion;
  if (left.ts !== right.ts) return left.ts - right.ts;
  return left.sourceOrder - right.sourceOrder;
}

function stripRank(row: RankedOhlcvPoint): OhlcvPoint {
  const { sourceOrder: _sourceOrder, ...point } = row;
  return point;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value >= 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
  }
  if (Array.isArray(value)) {
    const parsed = value.length >= 9 ? parseOffsetDateTimeArray(value) : parseDateArray(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
  }
  return null;
}

function parseOffsetDateTimeArray(value: unknown[]): number {
  const [
    y,
    ordinal = 1,
    hh = 0,
    mm = 0,
    ss = 0,
    ns = 0,
    offsetH = 0,
    offsetM = 0,
    offsetS = 0,
  ] = value;
  const ms = Math.floor(Number(ns) / 1_000_000);
  return Date.UTC(
    Number(y),
    0,
    Number(ordinal),
    Number(hh) - Number(offsetH),
    Number(mm) - Number(offsetM),
    Number(ss) - Number(offsetS),
    ms,
  );
}

function parseDateArray(value: unknown[]): number {
  const [y, m = 1, d = 1, hh = 0, mm = 0, ss = 0, ms = 0] = value;
  return Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    Number(ms),
  );
}

function candlesEqual(left: CandleRecord, right: CandleRecord): boolean {
  return (
    left.o === right.o &&
    left.h === right.h &&
    left.l === right.l &&
    left.c === right.c &&
    Object.is(left.v_base, right.v_base) &&
    Object.is(left.v_quote, right.v_quote)
  );
}

function isStaleVersion(incoming: CandleRecord, existing: CandleRecord): boolean {
  if (incoming.ver == null || existing.ver == null) return false;
  return incoming.ver < existing.ver;
}

function finiteNumber(value: unknown): number | undefined {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(num) ? num : undefined;
}

function validHistoricalCandle(candle: CandleRecord) {
  return (
    Number.isFinite(candle.bucket) &&
    Number.isFinite(candle.ts) &&
    positiveFinite(candle.o) &&
    positiveFinite(candle.h) &&
    positiveFinite(candle.l) &&
    positiveFinite(candle.c) &&
    candle.h >= Math.max(candle.o, candle.c, candle.l) &&
    candle.l <= Math.min(candle.o, candle.c, candle.h) &&
    optionalNonnegativeFinite(candle.v_base) &&
    optionalNonnegativeFinite(candle.v_quote) &&
    optionalNonnegativeFinite(candle.ver) &&
    optionalNonnegativeFinite(candle.knownAt)
  );
}

function canonicalHistoricalCandle(candle: CandleRecord, timeframe: string) {
  return canonicalSerialize({
    bucket: candle.bucket,
    ts: candle.ts,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    vBase: finiteNumber(candle.v_base) ?? null,
    vQuote: finiteNumber(candle.v_quote) ?? null,
    ver: finiteNumber(candle.ver) ?? null,
    knownAt: candleRevisionKnownAt(candle, timeframe),
  });
}

function positiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

function optionalNonnegativeFinite(value: number | undefined) {
  return value == null || (Number.isFinite(value) && value >= 0);
}

function unwrapPayload(input: unknown): unknown {
  if (typeof input === "string") {
    try {
      return unwrapPayload(JSON.parse(input));
    } catch {
      return null;
    }
  }
  if (input && typeof input === "object" && "data" in input) {
    const data = (input as { data?: unknown }).data;
    if (data && typeof data === "object") return data;
  }
  return input;
}
