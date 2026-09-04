import { selectCompletedCandleRevisionsAt, timeframeToSeconds } from "./data";
import { canonicalHash } from "./serialization";
import type { CandleRecord } from "./types";

export const IMPULSE_FADE_SETUP_FAMILY = "impulse_fade_v1" as const;
export const IMPULSE_FADE_LIFECYCLE_VERSION = "impulse_fade_v1.lifecycle.1" as const;
export const IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION =
  "impulse_fade_v1.lifecycle-config.1" as const;
export const IMPULSE_FADE_CANDIDATE_GATE = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any" as const,
});

export type SetupFamily = typeof IMPULSE_FADE_SETUP_FAMILY;

export interface SupportResistanceZone {
  kind: "support" | "resistance";
  low: number;
  high: number;
  center: number;
  touches: number;
  score: number;
  strength: number;
  lastX: number;
  eventTime: number;
  knownAt: number;
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
  | "bearishBreak"
  | "bullishHigh"
  | "bullishLow"
  | "bullishBreak";
export type RelativeStrengthSignalKind = "divergence" | "lead" | "break";
export type RelativeStrengthDivergenceLabel =
  | "RS DIV ↓"
  | "RS LEAD ↓"
  | "RS BREAK ↓"
  | "RS DIV ↑"
  | "RS LEAD ↑"
  | "RS BREAK ↑";

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
  eventTime: number;
  knownAt: number;
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
  eventTime: number;
  knownAt: number;
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
  eventTime: number;
  knownAt: number;
  sourceSwing: SwingPoint;
}

export interface RelativeStrengthDivergence {
  kind: RelativeStrengthDivergenceKind;
  signal: RelativeStrengthSignalKind;
  direction: StructureDirection;
  label: RelativeStrengthDivergenceLabel;
  index: number;
  x: number;
  ts: number;
  bucket: number;
  price: number;
  previousPrice: number | null;
  rs: number;
  previousRs: number | null;
  priceLabel: SwingPointLabel | "Break";
  sourceBreak: StructureBreak | null;
  priceStructureState: StructureSummaryState;
  rsStructureState: StructureSummaryState;
  eventTime: number;
  knownAt: number;
}

export interface RelativeStrengthDivergenceOptions extends MarketStructureOptions {
  minDeltaPct?: number;
  maxAgeBars?: number;
  maxDivergences?: number;
  includeDivergences?: boolean;
  includeLeads?: boolean;
  includeBreaks?: boolean;
}

export interface ExtensionSnapshotOptions {
  windowSeconds?: number;
  historyDays?: number;
  minSamples?: number;
  emaPeriod?: number;
  atrPeriod?: number;
}

export interface ExtensionSnapshot {
  candle: CandleRecord | null;
  referenceCandle: CandleRecord | null;
  windowSeconds: number;
  returnPct: number | null;
  percentile: number | null;
  zScore: number | null;
  rollingReturnCount: number;
  ema: number | null;
  atr: number | null;
  atrExtension: number | null;
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
  eventTime: number;
  knownAt: number;
}

export type SetupStateName =
  | "notCandidate"
  | "developing"
  | "deteriorating"
  | "waitingForRetest"
  | "entryCandidate"
  | "invalidated"
  | "expired";

export type SetupStateCheckStatus = "pass" | "pending" | "fail";

export interface SetupExtensionMetrics {
  returnPct?: number | null;
  percentile?: number | null;
  zScore?: number | null;
  atrExtension?: number | null;
}

export interface SetupStateCheck {
  key:
    | "extension"
    | "htfResistance"
    | "rsWeakness"
    | "structureShift"
    | "avwapFailure"
    | "retest";
  label: string;
  status: SetupStateCheckStatus;
  detail: string;
}

export interface SetupStateOptions {
  candles?: CandleRecord[];
  symbol?: string;
  source?: string;
  venue?: string;
  executionTimeframe?: string;
  asOf?: number | null;
  extensionOptions?: ExtensionSnapshotOptions;
  candidateMetrics?: ImpulseFadeCandidateMetricObservation[];
  extension?: SetupExtensionMetrics | null;
  marketStructure?: MarketStructureState | null;
  structure?: MarketStructureSummary | null;
  htfStructures?: Array<{ timeframe: string; summary: MarketStructureSummary }>;
  srZones?: SupportResistanceZone[];
  rsDivergences?: RelativeStrengthDivergence[];
  anchoredVwapSignals?: AnchoredVwapSignal[];
  avwapDistancePct?: number | null;
  latestPrice?: number | null;
  latestTs?: number | null;
  resistanceNearPct?: number;
  retestNearPct?: number;
  retestToleranceBps?: number;
  retestToleranceAtr?: number;
  invalidationBps?: number;
  maxCandidateAgeSeconds?: number;
  lifecycleConfigHash?: string;
}

export interface SetupStateSnapshot {
  strategy: "pumpFade";
  setupFamily: SetupFamily;
  lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
  lifecycleConfigHash: string;
  asOf: number | null;
  executionTimeframe: string;
  state: SetupStateName;
  currentState: SetupStateName;
  stateSince: number | null;
  label: string;
  reason: string;
  checks: SetupStateCheck[];
  updatedTs: number | null;
  candidate: SetupCandidateEpisode | null;
  evidence: SetupStateEvidence[];
  transitions: SetupStateTransition[];
  pendingConditions: string[];
  activeBreakLevel: SetupLifecycleLevel | null;
  retestLevel: SetupLifecycleLevel | null;
  confluence: SetupConfluenceItem[];
  invalidationReason: string | null;
  expiryReason: string | null;
  dataQuality: string[];
}

export interface SetupCandidateEpisode {
  id: string;
  setupFamily: SetupFamily;
  lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
  lifecycleConfigHash: string;
  symbol: string;
  source: string;
  venue: string;
  executionTimeframe: string;
  detectedAt: number;
  detectionEventTime: number;
  detectionMetrics: SetupExtensionMetrics;
  initialMtfContext: SetupMtfContextSnapshot[];
  episodeHigh: number | null;
  episodeHighTime: number | null;
  currentState: SetupStateName;
  stateSince: number;
  terminalAt: number | null;
}

export interface SetupMtfContextSnapshot {
  timeframe: string;
  state: StructureSummaryState;
  trend: StructureDirection | "neutral";
  transitionDirection: StructureDirection | null;
  updatedTs: number | null;
}

export interface SetupStateEvidence {
  id: string;
  code: string;
  explanation: string;
  eventTime: number;
  knownAt: number;
  sourceTimeframe: string;
  price?: number | null;
  level?: number | null;
  value?: number | null;
  relatedEventId?: string;
  contributesTo?: SetupStateName;
}

export interface SetupStateTransition {
  from: SetupStateName;
  to: SetupStateName;
  knownAt: number;
  evidenceIds: string[];
  evidenceCodes: string[];
  explanation: string;
}

export interface SetupLifecycleLevel {
  level: number;
  sourceTimeframe: string;
  eventTime: number;
  knownAt: number;
  evidenceId: string;
}

export interface SetupConfluenceItem {
  code: string;
  label: string;
  detail: string;
  eventTime?: number | null;
  knownAt?: number | null;
  sourceTimeframe?: string;
  level?: number | null;
  value?: number | null;
}

export interface ImpulseFadeCandidateMetricObservation {
  asOf: number;
  knownAt?: number;
  eventTime?: number;
  metrics: SetupExtensionMetrics;
  sampleCount?: number;
}

export type ImpulseFadeStructureEvent = StructureBreak & {
  sourceTimeframe?: string;
};

export interface ImpulseFadeTimelineConfig {
  extensionOptions?: ExtensionSnapshotOptions;
  marketStructureOptions?: MarketStructureOptions;
  resistanceNearPct?: number;
  retestNearPct?: number;
  retestToleranceBps?: number;
  retestToleranceAtr?: number;
  invalidationBps?: number;
  maxCandidateAgeSeconds?: number;
}

export interface ImpulseFadeTimelineOptions {
  symbol: string;
  source?: string;
  venue?: string;
  executionTimeframe: string;
  candlesByTimeframe: Record<string, CandleRecord[]>;
  candidateMetrics?: ImpulseFadeCandidateMetricObservation[];
  structureEvents?: ImpulseFadeStructureEvent[];
  supportResistanceZones?: SupportResistanceZone[];
  avwapEvents?: AnchoredVwapSignal[];
  relativeStrengthEvents?: RelativeStrengthDivergence[];
  config?: ImpulseFadeTimelineConfig;
  evaluationPoints?: number[];
  from?: number;
  to?: number;
}

export interface ImpulseFadeTimelineRecord {
  asOf: number;
  setupFamily: SetupFamily;
  lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
  lifecycleConfigHash: string;
  candidateGatePassed: boolean;
  candidateId: string | null;
  candidateDetectedAt: number | null;
  initialMtfContext: SetupMtfContextSnapshot[];
  currentState: SetupStateName;
  stateSince: number | null;
  transition: SetupStateTransition | null;
  transitions: SetupStateTransition[];
  evidenceAdded: SetupStateEvidence[];
  pendingConditions: string[];
  confluence: SetupConfluenceItem[];
  episodeHigh: number | null;
  episodeHighTime: number | null;
  activeBreakLevel: SetupLifecycleLevel | null;
  retestLevel: SetupLifecycleLevel | null;
  terminalReason: string | null;
  dataQualityNotes: string[];
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

export function computeExtensionSnapshot(
  candles: CandleRecord[],
  options: ExtensionSnapshotOptions = {},
): ExtensionSnapshot {
  const windowSeconds = clampIntegerOption(options.windowSeconds, 60, 30 * 24 * 60 * 60, 86_400);
  const historyDays = clampIntegerOption(options.historyDays, 1, 365, 180);
  const minSamples = clampIntegerOption(options.minSamples, 1, 5000, 20);
  const emaPeriod = clampIntegerOption(options.emaPeriod, 2, 500, 20);
  const atrPeriod = clampIntegerOption(options.atrPeriod, 2, 500, 14);
  const candle = latestValidCloseCandle(candles);
  if (!candle) {
    return emptyExtensionSnapshot(windowSeconds);
  }

  const latestIndex = candles.indexOf(candle);
  const referenceCandle = findReferenceCandle(candles, candle.bucket - windowSeconds, latestIndex);
  const returnPct =
    referenceCandle && validPositivePrice(referenceCandle.c)
      ? ((candle.c / referenceCandle.c) - 1) * 100
      : null;
  const rollingReturns =
    returnPct == null
      ? []
      : rollingWindowReturns(candles, {
          windowSeconds,
          earliestBucket: candle.bucket - historyDays * 86_400,
          excludeBucket: candle.bucket,
        });

  const percentile =
    returnPct != null && rollingReturns.length >= minSamples
      ? percentileRank(rollingReturns, returnPct)
      : null;
  const zScore =
    returnPct != null && rollingReturns.length >= minSamples
      ? zScoreAgainst(rollingReturns, returnPct)
      : null;
  const ema = emaValues(candles, emaPeriod)[latestIndex] ?? null;
  const atr = atrValues(candles, atrPeriod)[latestIndex] ?? null;
  const atrExtension =
    ema != null && atr != null && Number.isFinite(ema) && Number.isFinite(atr) && atr > 0
      ? (candle.c - ema) / atr
      : null;

  return {
    candle,
    referenceCandle,
    windowSeconds,
    returnPct,
    percentile,
    zScore,
    rollingReturnCount: rollingReturns.length,
    ema,
    atr,
    atrExtension,
  };
}

export function computeSetupState(options: SetupStateOptions = {}): SetupStateSnapshot {
  const executionTimeframe = options.executionTimeframe ?? "chart";
  const explicitAsOf = normalizedNullableNumber(options.asOf);
  const latestTs =
    normalizedNullableNumber(options.latestTs) ??
    latestKnownAt(options.candles ?? [], executionTimeframe) ??
    normalizedNullableNumber(options.structure?.updatedTs) ??
    normalizedNullableNumber(options.marketStructure?.summary.updatedTs) ??
    null;
  const asOf = explicitAsOf ?? latestTs;
  const latestCandle = asOf == null
    ? null
    : latestKnownCandle(options.candles ?? [], asOf, executionTimeframe);
  const latestPrice = latestCandle?.candle.c ?? normalizedNullableNumber(options.latestPrice);
  const marketStructure = marketStructureAtCutoff(options.marketStructure ?? null, explicitAsOf);
  const structure = marketStructure?.summary ?? structureSummaryAtCutoff(options.structure, explicitAsOf);
  const htfStructureHistory = options.htfStructures ?? [];
  const htfStructures = explicitAsOf == null
    ? options.htfStructures ?? []
    : latestHtfStructureSnapshots(options.htfStructures ?? [], explicitAsOf);
  const srZones = (options.srZones ?? []).filter(
    (zone) => explicitAsOf == null || setupEventKnownAt(zone) <= explicitAsOf,
  );
  const rsDivergences = (options.rsDivergences ?? []).filter(
    (event) => explicitAsOf == null || setupEventKnownAt(event) <= explicitAsOf,
  );
  const anchoredVwapSignals = (options.anchoredVwapSignals ?? []).filter(
    (event) => explicitAsOf == null || setupEventKnownAt(event) <= explicitAsOf,
  );
  const resistanceNearPct = clampNumberOption(options.resistanceNearPct, 0, 10, 1.5);
  const retestNearPct = clampNumberOption(options.retestNearPct, 0, 10, 0.8);

  const extension = setupExtensionCheck(options.extension ?? null);
  const htfResistance = setupResistanceCheck(srZones, latestPrice, resistanceNearPct);
  const rsWeakness = setupRsWeaknessCheck(rsDivergences);
  const structureShift = setupStructureShiftCheck(structure);
  const avwapFailure = setupAvwapFailureCheck(
    anchoredVwapSignals,
    options.avwapDistancePct,
  );
  const retest = setupRetestCheck(structure, srZones, latestPrice, retestNearPct);
  const invalidated = setupInvalidated(extension, htfResistance, structure, latestPrice);

  const checks = [
    extension,
    htfResistance,
    rsWeakness,
    structureShift,
    avwapFailure,
    retest,
  ];
  const base = {
    checks,
    asOf,
    updatedTs: latestTs,
    executionTimeframe,
    lifecycleConfigHash:
      options.lifecycleConfigHash ?? impulseFadeLifecycleConfigHash({
        extensionOptions: options.extensionOptions,
        resistanceNearPct: options.resistanceNearPct,
        retestNearPct: options.retestNearPct,
        retestToleranceBps: options.retestToleranceBps,
        retestToleranceAtr: options.retestToleranceAtr,
        invalidationBps: options.invalidationBps,
        maxCandidateAgeSeconds: options.maxCandidateAgeSeconds,
      }),
  };
  const fallbackState = snapshotSetupState({
    extension,
    htfResistance,
    htfStructures,
    rsWeakness,
    structureShift,
    avwapFailure,
    retest,
    invalidated,
  });

  if (options.candles?.length && asOf != null) {
    return computeImpulseFadeLifecycle({
      ...options,
      asOf,
      latestPrice,
      marketStructure,
      structure,
      htfStructures: htfStructureHistory,
      srZones,
      rsDivergences,
      anchoredVwapSignals,
      checks,
      executionTimeframe,
    });
  }

  return snapshotFallbackSetupState({
    ...base,
    state: fallbackState,
    reason: setupStateReason(fallbackState, checks),
    dataQuality: ["Chronological setup lifecycle requires candle history"],
  });
}

function marketStructureAtCutoff(
  structure: MarketStructureState | null,
  asOf: number | null,
) {
  if (!structure || asOf == null) return structure;
  const swings = structure.swings.filter((swing) => swing.knownAt <= asOf);
  const breaks = structure.breaks.filter((event) => event.knownAt <= asOf);
  const trend = lastItem(breaks)?.direction ?? "neutral";
  return {
    swings,
    breaks,
    trend,
    summary: summarizeMarketStructure(swings, breaks, trend),
  } satisfies MarketStructureState;
}

function structureSummaryAtCutoff(
  structure: MarketStructureSummary | null | undefined,
  asOf: number | null,
) {
  if (!structure || asOf == null) return structure ?? null;
  const updatedTs = normalizedNullableNumber(structure.updatedTs);
  return updatedTs == null || updatedTs <= asOf ? structure : null;
}

export function evaluateImpulseFadeTimeline(
  options: ImpulseFadeTimelineOptions,
): ImpulseFadeTimelineRecord[] {
  return evaluateImpulseFadeTimelineInternal(options).records;
}

export function impulseFadeLifecycleConfigHash(
  config: ImpulseFadeTimelineConfig = {},
): string {
  return canonicalHash({
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigVersion: IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
    candidateGate: IMPULSE_FADE_CANDIDATE_GATE,
    extension: {
      windowSeconds: clampIntegerOption(
        config.extensionOptions?.windowSeconds,
        60,
        30 * 86_400,
        86_400,
      ),
      historyDays: clampIntegerOption(config.extensionOptions?.historyDays, 1, 365, 180),
      minSamples: clampIntegerOption(config.extensionOptions?.minSamples, 1, 5000, 20),
      emaPeriod: clampIntegerOption(config.extensionOptions?.emaPeriod, 2, 500, 20),
      atrPeriod: clampIntegerOption(config.extensionOptions?.atrPeriod, 2, 500, 14),
    },
    marketStructure: {
      lookback: clampIntegerOption(
        config.marketStructureOptions?.lookback,
        20,
        2000,
        500,
      ),
      pivotStrength: clampIntegerOption(
        config.marketStructureOptions?.pivotStrength,
        1,
        20,
        3,
      ),
      atrPeriod: clampIntegerOption(config.marketStructureOptions?.atrPeriod, 2, 100, 14),
      minMoveAtr: clampNumberOption(config.marketStructureOptions?.minMoveAtr, 0, 10, 0.75),
      maxSwings: clampIntegerOption(config.marketStructureOptions?.maxSwings, 1, 500, 120),
      maxBreaks: clampIntegerOption(config.marketStructureOptions?.maxBreaks, 1, 200, 24),
    },
    resistanceNearPct: clampNumberOption(config.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: clampNumberOption(config.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: clampNumberOption(config.retestToleranceBps, 0, 1000, 35),
    retestToleranceAtr: clampNumberOption(config.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: clampNumberOption(config.invalidationBps, 0, 1000, 10),
    maxCandidateAgeSeconds: clampIntegerOption(
      config.maxCandidateAgeSeconds,
      60,
      30 * 86_400,
      72 * 60 * 60,
    ),
  });
}

export function evaluateImpulseFadeSnapshot(
  options: ImpulseFadeTimelineOptions,
): SetupStateSnapshot | null {
  const points = impulseFadeEvaluationPoints(options);
  const asOf = lastItem(points);
  if (asOf == null) return null;
  const evaluateFrom = normalizedNullableNumber(options.from) ?? -Infinity;
  const htfStructureHistory = buildHtfStructureHistory(options, asOf);
  const confirmedExecutionBreaks = new Map<string, StructureBreak>();
  const executionCandles = options.candlesByTimeframe[options.executionTimeframe] ?? [];
  const structurePoints = new Set(
    executionCandles
      .map((candle) => candleCloseTime(candle, options.executionTimeframe))
      .filter((knownAt) => knownAt >= evaluateFrom && knownAt <= asOf),
  );
  for (const event of options.structureEvents ?? []) {
    if (
      (!event.sourceTimeframe || event.sourceTimeframe === options.executionTimeframe) &&
      setupEventKnownAt(event) >= evaluateFrom &&
      setupEventKnownAt(event) <= asOf
    ) {
      structurePoints.add(setupEventKnownAt(event));
    }
  }
  for (const point of [...structurePoints].sort((a, b) => a - b)) {
    timelineMarketStructure(
      completedCandlesAt(executionCandles, options.executionTimeframe, point),
      options.executionTimeframe,
      options.structureEvents ?? [],
      options.config?.marketStructureOptions,
      point,
      confirmedExecutionBreaks,
    );
  }
  return impulseFadeSnapshotAt(
    options,
    asOf,
    confirmedExecutionBreaks,
    htfStructureHistory,
  );
}

function evaluateImpulseFadeTimelineInternal(options: ImpulseFadeTimelineOptions) {
  const executionTimeframe = options.executionTimeframe;
  const executionCandles = options.candlesByTimeframe[executionTimeframe] ?? [];
  const config = options.config ?? {};
  const lifecycleConfigHash = impulseFadeLifecycleConfigHash(config);
  const points = impulseFadeEvaluationPoints(options);
  const htfStructureHistory = buildHtfStructureHistory(
    options,
    lastItem(points) ?? 0,
  );
  const confirmedExecutionBreaks = new Map<string, StructureBreak>();
  const seenEvidence = new Set<string>();
  const seenTransitions = new Set<string>();
  const emitFrom = normalizedNullableNumber(options.from) ?? -Infinity;
  let latestSnapshot: SetupStateSnapshot | null = null;

  const records = points.map((asOf) => {
    const snapshot = impulseFadeSnapshotAt(
      options,
      asOf,
      confirmedExecutionBreaks,
      htfStructureHistory,
    );
    const metricObservation = latestCandidateMetricObservation(options.candidateMetrics, asOf);
    const extension = metricObservation?.metrics ?? setupMetricsFromExtensionSnapshot(
      computeExtensionSnapshot(
        completedCandlesAt(executionCandles, executionTimeframe, asOf),
        config.extensionOptions,
      ),
    );
    latestSnapshot = snapshot;
    const evidenceAdded = snapshot.evidence.filter((item) => {
      if (seenEvidence.has(item.id)) return false;
      seenEvidence.add(item.id);
      return item.knownAt >= emitFrom;
    });
    const transitions = snapshot.transitions.filter((item) => {
      const key = setupTransitionKey(item);
      if (seenTransitions.has(key)) return false;
      seenTransitions.add(key);
      return item.knownAt >= emitFrom;
    });

    return {
      asOf,
      setupFamily: IMPULSE_FADE_SETUP_FAMILY,
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash,
      candidateGatePassed: setupExtensionGatePass(extension),
      candidateId: snapshot.candidate?.id ?? null,
      candidateDetectedAt: snapshot.candidate?.detectedAt ?? null,
      initialMtfContext: snapshot.candidate?.initialMtfContext ?? [],
      currentState: snapshot.currentState,
      stateSince: snapshot.stateSince,
      transition: lastItem(transitions) ?? null,
      transitions,
      evidenceAdded,
      pendingConditions: snapshot.pendingConditions,
      confluence: snapshot.confluence,
      episodeHigh: snapshot.candidate?.episodeHigh ?? null,
      episodeHighTime: snapshot.candidate?.episodeHighTime ?? null,
      activeBreakLevel: snapshot.activeBreakLevel,
      retestLevel: snapshot.retestLevel,
      terminalReason: snapshot.invalidationReason ?? snapshot.expiryReason,
      dataQualityNotes: snapshot.dataQuality,
    };
  });
  return { records, latestSnapshot };
}

function impulseFadeSnapshotAt(
  options: ImpulseFadeTimelineOptions,
  asOf: number,
  confirmedExecutionBreaks: Map<string, StructureBreak>,
  htfStructureHistory: Array<{ timeframe: string; summary: MarketStructureSummary }>,
) {
  const executionTimeframe = options.executionTimeframe;
  const executionCandles = options.candlesByTimeframe[executionTimeframe] ?? [];
  const config = options.config ?? {};
  const lifecycleConfigHash = impulseFadeLifecycleConfigHash(config);
  const closedExecutionCandles = completedCandlesAt(executionCandles, executionTimeframe, asOf);
  const extensionSnapshot = computeExtensionSnapshot(closedExecutionCandles, config.extensionOptions);
  const metricObservation = latestCandidateMetricObservation(options.candidateMetrics, asOf);
  const extension = metricObservation?.metrics ?? setupMetricsFromExtensionSnapshot(extensionSnapshot);
  const marketStructure = timelineMarketStructure(
    closedExecutionCandles,
    executionTimeframe,
    options.structureEvents ?? [],
    config.marketStructureOptions,
    asOf,
    confirmedExecutionBreaks,
  );
  const htfStructures = htfStructureHistory.filter(
    (entry) => (entry.summary.updatedTs ?? 0) <= asOf,
  );
  const latestCandle = lastItem(closedExecutionCandles) ?? null;
  return computeSetupState({
    candles: executionCandles,
    symbol: options.symbol,
    source: options.source,
    venue: options.venue,
    executionTimeframe,
    asOf,
    extensionOptions: config.extensionOptions,
    candidateMetrics: options.candidateMetrics,
    extension,
    marketStructure,
    structure: marketStructure.summary,
    htfStructures,
    srZones: options.supportResistanceZones,
    rsDivergences: options.relativeStrengthEvents,
    anchoredVwapSignals: options.avwapEvents,
    latestPrice: latestCandle?.c ?? null,
    latestTs: asOf,
    resistanceNearPct: config.resistanceNearPct,
    retestNearPct: config.retestNearPct,
    retestToleranceBps: config.retestToleranceBps,
    retestToleranceAtr: config.retestToleranceAtr,
    invalidationBps: config.invalidationBps,
    maxCandidateAgeSeconds: config.maxCandidateAgeSeconds,
    lifecycleConfigHash,
  });
}

function buildHtfStructureHistory(
  options: ImpulseFadeTimelineOptions,
  through: number,
) {
  const evaluateFrom = normalizedNullableNumber(options.from) ?? -Infinity;
  return Object.entries(options.candlesByTimeframe)
    .filter(([timeframe]) => timeframe !== options.executionTimeframe)
    .flatMap(([timeframe, candles]) => {
      const knownTimes = new Set(
        candles
          .map((candle) => candleCloseTime(candle, timeframe))
          .filter((knownAt) => knownAt >= evaluateFrom && knownAt <= through),
      );
      if (Number.isFinite(evaluateFrom) && evaluateFrom <= through) knownTimes.add(evaluateFrom);
      for (const event of options.structureEvents ?? []) {
        if (
          event.sourceTimeframe === timeframe &&
          setupEventKnownAt(event) >= evaluateFrom &&
          setupEventKnownAt(event) <= through
        ) {
          knownTimes.add(setupEventKnownAt(event));
        }
      }
      return [...knownTimes]
        .sort((a, b) => a - b)
        .map((knownAt) => {
          const structure = timelineMarketStructure(
            completedCandlesAt(candles, timeframe, knownAt),
            timeframe,
            options.structureEvents ?? [],
            options.config?.marketStructureOptions,
            knownAt,
          );
          return {
            timeframe,
            summary: { ...structure.summary, updatedTs: knownAt },
          };
        });
    });
}

export const CANDLE_TIMESTAMP_SEMANTICS = "openTime" as const;

export function candleCloseTime(
  candle: Pick<CandleRecord, "ts" | "bucket">,
  timeframe: string | number,
) {
  const openTime =
    normalizedNullableNumber(candle.bucket) ?? normalizedNullableNumber(candle.ts) ?? 0;
  return openTime + Math.max(1, timeframeToSeconds(timeframe));
}

function completedCandlesAt(
  candles: CandleRecord[],
  timeframe: string,
  asOf: number,
) {
  return selectCompletedCandleRevisionsAt(candles, timeframe, asOf);
}

function impulseFadeEvaluationPoints(options: ImpulseFadeTimelineOptions) {
  const points = new Set<number>();
  for (const [timeframe, candles] of Object.entries(options.candlesByTimeframe)) {
    for (const candle of candles) {
      points.add(candle.knownAt ?? candleCloseTime(candle, timeframe));
    }
  }
  for (const observation of options.candidateMetrics ?? []) {
    points.add(normalizedNullableNumber(observation.knownAt) ?? observation.asOf);
  }
  for (const event of options.structureEvents ?? []) points.add(setupEventKnownAt(event));
  for (const event of options.avwapEvents ?? []) points.add(setupEventKnownAt(event));
  for (const event of options.relativeStrengthEvents ?? []) points.add(setupEventKnownAt(event));
  for (const zone of options.supportResistanceZones ?? []) points.add(setupEventKnownAt(zone));
  for (const point of options.evaluationPoints ?? []) {
    const normalized = normalizedNullableNumber(point);
    if (normalized != null) points.add(normalized);
  }

  const ordered = [...points].filter(Number.isFinite).sort((a, b) => a - b);
  const from = normalizedNullableNumber(options.from) ?? ordered[0] ?? 0;
  const to = normalizedNullableNumber(options.to) ?? lastItem(ordered) ?? from;
  points.add(from);
  points.add(to);
  return [...points]
    .filter((point) => Number.isFinite(point) && point >= from && point <= to)
    .sort((a, b) => a - b);
}

function latestCandidateMetricObservation(
  observations: ImpulseFadeCandidateMetricObservation[] | undefined,
  asOf: number,
) {
  return lastItem([...(observations ?? [])]
    .filter((item) => (normalizedNullableNumber(item.knownAt) ?? item.asOf) <= asOf)
    .sort(
      (a, b) =>
        (normalizedNullableNumber(a.knownAt) ?? a.asOf) -
          (normalizedNullableNumber(b.knownAt) ?? b.asOf) ||
        a.asOf - b.asOf,
    )) ?? null;
}

function timelineMarketStructure(
  candles: CandleRecord[],
  executionTimeframe: string,
  suppliedEvents: ImpulseFadeStructureEvent[],
  options: MarketStructureOptions | undefined,
  asOf: number,
  confirmedBreaks?: Map<string, StructureBreak>,
) {
  const derived = computeMarketStructure(candles, options);
  const supplied = suppliedEvents.filter(
    (event) =>
      (!event.sourceTimeframe || event.sourceTimeframe === executionTimeframe) &&
      setupEventKnownAt(event) <= asOf,
  );
  const byId = confirmedBreaks ?? new Map<string, StructureBreak>();
  for (const event of [...derived.breaks, ...supplied]) {
    byId.set(
      setupEventId(
        event.kind,
        executionTimeframe,
        event.eventTime,
        event.knownAt,
        `${event.direction}:${event.level}`,
      ),
      event,
    );
  }
  const breaks = [...byId.values()].filter((event) => event.knownAt <= asOf).sort(
    (a, b) => a.knownAt - b.knownAt || a.eventTime - b.eventTime,
  );
  if (!breaks.length) return derived;
  const trend = lastItem(breaks)?.direction ?? derived.trend;
  return {
    swings: derived.swings,
    breaks,
    trend,
    summary: summarizeMarketStructure(derived.swings, breaks, trend),
  } satisfies MarketStructureState;
}

function setupTransitionKey(transition: SetupStateTransition) {
  return [
    transition.from,
    transition.to,
    transition.knownAt,
    ...transition.evidenceIds,
  ].join(":");
}

interface ExtensionGatePoint {
  index: number;
  candle: CandleRecord;
  eventTime: number;
  knownAt: number;
  metrics: SetupExtensionMetrics;
  pass: boolean;
  rollingReturnCount: number;
}

type SetupLifecycleEventKind =
  | "deterioration"
  | "bearishBreak"
  | "retest"
  | "invalidation"
  | "expiry";

interface SetupLifecycleEvent extends SetupStateEvidence {
  lifecycleKind: SetupLifecycleEventKind;
  sortPriority: number;
  breakLevel?: SetupLifecycleLevel;
}

interface ComputeImpulseFadeLifecycleOptions extends SetupStateOptions {
  asOf: number;
  latestPrice: number | null;
  marketStructure: MarketStructureState | null;
  structure: MarketStructureSummary | null;
  htfStructures: Array<{ timeframe: string; summary: MarketStructureSummary }>;
  srZones: SupportResistanceZone[];
  checks: SetupStateCheck[];
  executionTimeframe: string;
}

function computeImpulseFadeLifecycle(
  options: ComputeImpulseFadeLifecycleOptions,
): SetupStateSnapshot {
  const candles = options.candles ?? [];
  const extensionOptions = options.extensionOptions ?? {};
  const gateSeries = buildExtensionGateSeries(
    candles,
    extensionOptions,
    options.asOf,
    options.executionTimeframe,
    options.candidateMetrics,
  );
  const dataQuality = setupDataQualityNotes(gateSeries, extensionOptions);
  let selectedGate = selectLifecycleCandidateGate(gateSeries, options);

  if (!selectedGate && setupExtensionGatePass(options.extension ?? null)) {
    const latest = latestKnownCandle(candles, options.asOf, options.executionTimeframe);
    if (latest) {
      selectedGate = {
        index: latest.index,
        candle: latest.candle,
        eventTime: candleEventTime(latest.candle),
        knownAt: Math.min(
          options.asOf,
          candleKnownAt(candles, latest.index, options.executionTimeframe),
        ),
        metrics: setupMetricsFromPartial(options.extension ?? null),
        pass: true,
        rollingReturnCount: 0,
      };
      dataQuality.push(
        "Candidate gate used latest shared metrics because chart history had no passing gate edge",
      );
    }
  }

  if (!selectedGate) {
    return snapshotFallbackSetupState({
      checks: options.checks,
      asOf: options.asOf,
      updatedTs: options.asOf,
      executionTimeframe: options.executionTimeframe,
      state: "notCandidate",
      reason: "No active Impulse Fade v1 candidate",
      dataQuality,
      lifecycleConfigHash: options.lifecycleConfigHash,
    });
  }

  return evaluateImpulseFadeCandidate(selectedGate, options, options.asOf, dataQuality);
}

function buildExtensionGateSeries(
  candles: CandleRecord[],
  options: ExtensionSnapshotOptions,
  asOf: number,
  executionTimeframe: string,
  observations: ImpulseFadeCandidateMetricObservation[] | undefined,
): ExtensionGatePoint[] {
  if (observations?.length) {
    return [...observations]
      .map((observation) => {
        const knownAt = normalizedNullableNumber(observation.knownAt) ?? observation.asOf;
        const latest = latestKnownCandle(candles, knownAt, executionTimeframe);
        if (!latest || knownAt > asOf) return null;
        const eventTime =
          normalizedNullableNumber(observation.eventTime) ?? candleEventTime(latest.candle);
        const metrics = setupMetricsFromPartial(observation.metrics);
        return {
          index: latest.index,
          candle: latest.candle,
          eventTime,
          knownAt,
          metrics,
          pass: setupExtensionGatePass(metrics),
          rollingReturnCount: Math.max(0, Math.trunc(observation.sampleCount ?? 0)),
        } satisfies ExtensionGatePoint;
      })
      .filter((point): point is ExtensionGatePoint => point != null)
      .sort((a, b) => a.knownAt - b.knownAt || a.eventTime - b.eventTime);
  }

  const gates: ExtensionGatePoint[] = [];
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const knownAt = candleKnownAt(candles, index, executionTimeframe);
    if (knownAt > asOf) continue;
    const snapshot = computeExtensionSnapshot(candles.slice(0, index + 1), options);
    const metrics = setupMetricsFromExtensionSnapshot(snapshot);
    gates.push({
      index,
      candle,
      eventTime: candleEventTime(candle),
      knownAt,
      metrics,
      pass: setupExtensionGatePass(metrics),
      rollingReturnCount: snapshot.rollingReturnCount,
    });
  }
  return gates;
}

function selectLifecycleCandidateGate(
  gateSeries: ExtensionGatePoint[],
  options: ComputeImpulseFadeLifecycleOptions,
) {
  const edges: ExtensionGatePoint[] = [];
  let previousPass = false;
  for (const gate of gateSeries) {
    if (gate.pass && !previousPass) edges.push(gate);
    previousPass = gate.pass;
  }
  if (!edges.length) return null;

  let selected = edges[0];
  for (const edge of edges.slice(1)) {
    const prior = evaluateImpulseFadeCandidate(selected, options, edge.knownAt, []);
    const terminalAt = prior.candidate?.terminalAt ?? null;
    if (
      terminalAt != null &&
      gateSeries.some((gate) => gate.knownAt > terminalAt && gate.knownAt < edge.knownAt && !gate.pass)
    ) {
      selected = edge;
    }
  }
  return selected;
}

function evaluateImpulseFadeCandidate(
  gate: ExtensionGatePoint,
  options: ComputeImpulseFadeLifecycleOptions,
  asOf: number,
  dataQuality: string[],
): SetupStateSnapshot {
  const symbol = (options.symbol ?? "UNKNOWN").toUpperCase();
  const source = options.source ?? "chart";
  const venue = options.venue ?? "";
  const executionTimeframe = options.executionTimeframe;
  const initialMtfContext = latestHtfStructureSnapshots(
    options.htfStructures ?? [],
    gate.knownAt,
  ).map((entry) => ({
    timeframe: entry.timeframe,
    state: entry.summary.state,
    trend: entry.summary.trend,
    transitionDirection: entry.summary.transitionDirection,
    updatedTs: entry.summary.updatedTs,
  }));
  const candidateId = deterministicSetupCandidateId({
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    symbol,
    source,
    venue,
    executionTimeframe,
    detectedAt: gate.knownAt,
  });
  const evidence: SetupStateEvidence[] = [
    {
      id: setupEventId("candidate_detected", executionTimeframe, gate.eventTime, gate.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: gate.eventTime,
      knownAt: gate.knownAt,
      sourceTimeframe: executionTimeframe,
      price: gate.candle.c,
      contributesTo: "developing",
    },
  ];
  const transitions: SetupStateTransition[] = [
    {
      from: "notCandidate",
      to: "developing",
      knownAt: gate.knownAt,
      evidenceIds: [evidence[0].id],
      evidenceCodes: [evidence[0].code],
      explanation: "Candidate episode detected",
    },
  ];
  const confluence = collectSetupConfluence(options, gate, asOf);
  const events = collectImpulseFadeLifecycleEvents(gate, options, asOf);

  let state: SetupStateName = "developing";
  let stateSince = gate.knownAt;
  let terminalAt: number | null = null;
  let activeBreakLevel: SetupLifecycleLevel | null = null;
  let retestLevel: SetupLifecycleLevel | null = null;
  let invalidationReason: string | null = null;
  let expiryReason: string | null = null;

  for (const event of events) {
    if (terminalAt != null) break;
    if (event.knownAt < gate.knownAt || event.knownAt > asOf) continue;

    if (event.lifecycleKind === "deterioration") {
      evidence.push({ ...event, contributesTo: "deteriorating" });
      if (state === "developing") {
        transitions.push(setupTransition(state, "deteriorating", event));
        state = "deteriorating";
        stateSince = event.knownAt;
      }
      continue;
    }

    if (event.lifecycleKind === "bearishBreak") {
      evidence.push({ ...event, contributesTo: "waitingForRetest" });
      if (state === "developing" || state === "deteriorating") {
        transitions.push(setupTransition(state, "waitingForRetest", event));
        state = "waitingForRetest";
        stateSince = event.knownAt;
        activeBreakLevel = event.breakLevel ?? null;
      }
      continue;
    }

    if (event.lifecycleKind === "retest") {
      if (
        state === "waitingForRetest" &&
        activeBreakLevel &&
        event.relatedEventId === activeBreakLevel.evidenceId &&
        event.knownAt > activeBreakLevel.knownAt
      ) {
        evidence.push({ ...event, contributesTo: "entryCandidate" });
        transitions.push(setupTransition(state, "entryCandidate", event));
        state = "entryCandidate";
        stateSince = event.knownAt;
        retestLevel = event.breakLevel ?? activeBreakLevel;
      }
      continue;
    }

    if (event.lifecycleKind === "invalidation") {
      if (state === "deteriorating" || state === "waitingForRetest" || state === "entryCandidate") {
        evidence.push({ ...event, contributesTo: "invalidated" });
        transitions.push(setupTransition(state, "invalidated", event));
        state = "invalidated";
        stateSince = event.knownAt;
        terminalAt = event.knownAt;
        invalidationReason = event.explanation;
      }
      continue;
    }

    if (event.lifecycleKind === "expiry" && state !== "entryCandidate") {
      evidence.push({ ...event, contributesTo: "expired" });
      transitions.push(setupTransition(state, "expired", event));
      state = "expired";
      stateSince = event.knownAt;
      terminalAt = event.knownAt;
      expiryReason = event.explanation;
    }
  }

  const episodeHigh = episodeHighSnapshot(
    options.candles ?? [],
    gate.eventTime,
    asOf,
    executionTimeframe,
  );
  const candidate: SetupCandidateEpisode = {
    id: candidateId,
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash:
      options.lifecycleConfigHash ?? impulseFadeLifecycleConfigHash({
        extensionOptions: options.extensionOptions,
        resistanceNearPct: options.resistanceNearPct,
        retestNearPct: options.retestNearPct,
        retestToleranceBps: options.retestToleranceBps,
        retestToleranceAtr: options.retestToleranceAtr,
        invalidationBps: options.invalidationBps,
        maxCandidateAgeSeconds: options.maxCandidateAgeSeconds,
      }),
    symbol,
    source,
    venue,
    executionTimeframe,
    detectedAt: gate.knownAt,
    detectionEventTime: gate.eventTime,
    detectionMetrics: gate.metrics,
    initialMtfContext,
    episodeHigh: episodeHigh?.price ?? null,
    episodeHighTime: episodeHigh?.eventTime ?? null,
    currentState: state,
    stateSince,
    terminalAt,
  };

  return {
    strategy: "pumpFade",
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash: candidate.lifecycleConfigHash,
    asOf,
    executionTimeframe,
    state,
    currentState: state,
    stateSince,
    label: setupStateLabel(state),
    reason: setupStateReasonFromLifecycle(state, evidence, transitions, invalidationReason, expiryReason),
    checks: options.checks,
    updatedTs: asOf,
    candidate,
    evidence: evidence.sort((a, b) => a.knownAt - b.knownAt || a.eventTime - b.eventTime),
    transitions,
    pendingConditions: setupPendingConditions(state, activeBreakLevel),
    activeBreakLevel,
    retestLevel,
    confluence,
    invalidationReason,
    expiryReason,
    dataQuality,
  };
}

function collectImpulseFadeLifecycleEvents(
  gate: ExtensionGatePoint,
  options: ComputeImpulseFadeLifecycleOptions,
  asOf: number,
): SetupLifecycleEvent[] {
  const events: SetupLifecycleEvent[] = [];
  const executionTimeframe = options.executionTimeframe;

  for (const event of options.rsDivergences ?? []) {
    if (event.direction !== "bearish") continue;
    const knownAt = setupEventKnownAt(event);
    if (!isCandidateRelativeEvent(event, gate, asOf)) continue;
    const code =
      event.signal === "break"
        ? "rs_break_bearish"
        : event.signal === "lead"
          ? "rs_lead_bearish"
          : "rs_div_bearish";
    events.push({
      id: setupEventId(code, executionTimeframe, event.eventTime, knownAt, event.x),
      code,
      explanation: `${event.label}: bearish relative-strength deterioration`,
      eventTime: event.eventTime,
      knownAt,
      sourceTimeframe: executionTimeframe,
      price: event.price,
      value: event.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10,
    });
  }

  for (const signal of options.anchoredVwapSignals ?? []) {
    const knownAt = setupEventKnownAt(signal);
    if (signal.kind !== "failedReclaim" || !isCandidateRelativeEvent(signal, gate, asOf)) {
      continue;
    }
    events.push({
      id: setupEventId("avwap_failed_reclaim", executionTimeframe, signal.eventTime, knownAt, signal.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: signal.eventTime,
      knownAt,
      sourceTimeframe: executionTimeframe,
      price: signal.price,
      level: signal.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20,
    });
  }

  const structureBreaks = setupStructureBreaks(options);
  const bearishBreaks: SetupLifecycleEvent[] = [];
  for (const item of structureBreaks) {
    const knownAt = setupEventKnownAt(item);
    if (item.direction !== "bearish" || !isCandidateRelativeEvent(item, gate, asOf)) continue;
    const code =
      item.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break";
    const eventId = setupEventId(code, executionTimeframe, item.eventTime, knownAt, item.x);
    const breakLevel = {
      level: item.level,
      sourceTimeframe: executionTimeframe,
      eventTime: item.eventTime,
      knownAt,
      evidenceId: eventId,
    };
    const event: SetupLifecycleEvent = {
      id: eventId,
      code,
      explanation: `${item.label} down through ${formatSetupPrice(item.level)}`,
      eventTime: item.eventTime,
      knownAt,
      sourceTimeframe: executionTimeframe,
      level: item.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel,
    };
    bearishBreaks.push(event);
    events.push(event);
  }

  for (const event of bearishBreaks) {
    const retest = findRetestRejectionEvent(gate, event, options, asOf);
    if (retest) events.push(retest);
  }

  for (const item of structureBreaks) {
    const knownAt = setupEventKnownAt(item);
    if (
      item.kind !== "StructureBreak" ||
      item.direction !== "bullish" ||
      !isCandidateRelativeEvent(item, gate, asOf)
    ) {
      continue;
    }
    const sourceCandle = (options.candles ?? [])[item.index];
    const highBefore = episodeHighSnapshot(
      options.candles ?? [],
      gate.eventTime,
      knownAt - 1,
      executionTimeframe,
    );
    const invalidationBps = clampNumberOption(options.invalidationBps, 0, 1000, 10);
    if (
      !sourceCandle ||
      highBefore?.price == null ||
      sourceCandle.c <= highBefore.price * (1 + invalidationBps / 10000)
    ) {
      continue;
    }
    events.push({
      id: setupEventId("bullish_continuation_invalidation", executionTimeframe, item.eventTime, knownAt, item.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${formatSetupPrice(highBefore.price)}`,
      eventTime: item.eventTime,
      knownAt,
      sourceTimeframe: executionTimeframe,
      price: sourceCandle.c,
      level: highBefore.price,
      lifecycleKind: "invalidation",
      sortPriority: 50,
    });
  }

  const maxAge = clampIntegerOption(
    options.maxCandidateAgeSeconds,
    60,
    30 * 86_400,
    72 * 60 * 60,
  );
  const expiresAt = gate.knownAt + maxAge;
  if (expiresAt <= asOf) {
    events.push({
      id: setupEventId("candidate_expired", executionTimeframe, gate.eventTime, expiresAt),
      code: "candidate_expired",
      explanation: `Candidate did not reach entry state within ${formatSetupDuration(maxAge)}`,
      eventTime: expiresAt,
      knownAt: expiresAt,
      sourceTimeframe: executionTimeframe,
      lifecycleKind: "expiry",
      sortPriority: 90,
    });
  }

  return events.sort(
    (a, b) =>
      a.knownAt - b.knownAt ||
      a.eventTime - b.eventTime ||
      a.sortPriority - b.sortPriority ||
      a.code.localeCompare(b.code),
  );
}

function findRetestRejectionEvent(
  gate: ExtensionGatePoint,
  breakEvent: SetupLifecycleEvent,
  options: ComputeImpulseFadeLifecycleOptions,
  asOf: number,
): SetupLifecycleEvent | null {
  const candles = options.candles ?? [];
  const breakLevel = breakEvent.breakLevel;
  if (!breakLevel || !Number.isFinite(breakLevel.level)) return null;
  const retestToleranceBps = clampNumberOption(options.retestToleranceBps, 0, 1000, 35);
  const retestToleranceAtr = clampNumberOption(options.retestToleranceAtr, 0, 10, 0.25);
  const atrPeriod = clampIntegerOption(options.extensionOptions?.atrPeriod, 2, 100, 14);
  const atrByIndex = atrValues(candles, atrPeriod);

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const knownAt = candleKnownAt(candles, index, options.executionTimeframe);
    const eventTime = candleEventTime(candle);
    if (
      knownAt <= breakEvent.knownAt ||
      eventTime < breakEvent.knownAt ||
      eventTime < gate.knownAt ||
      knownAt > asOf
    ) {
      continue;
    }
    const atr = atrByIndex[index] ?? 0;
    const tolerance = Math.max(
      breakLevel.level * (retestToleranceBps / 10000),
      Number.isFinite(atr) ? atr * retestToleranceAtr : 0,
    );
    const touched =
      candle.h >= breakLevel.level - tolerance && candle.l <= breakLevel.level + tolerance;
    const rejected = touched && candle.c < breakLevel.level && candle.c <= candle.o;
    if (!rejected) continue;
    return {
      id: setupEventId(
        "bearish_retest_rejection",
        breakLevel.sourceTimeframe,
        candleEventTime(candle),
        knownAt,
        index,
      ),
      code: "bearish_retest_rejection",
      explanation: `Bearish rejection after retest of ${formatSetupPrice(breakLevel.level)}`,
      eventTime,
      knownAt,
      sourceTimeframe: breakLevel.sourceTimeframe,
      price: candle.c,
      level: breakLevel.level,
      relatedEventId: breakLevel.evidenceId,
      lifecycleKind: "retest",
      sortPriority: 40,
      breakLevel,
    };
  }
  return null;
}

function collectSetupConfluence(
  options: ComputeImpulseFadeLifecycleOptions,
  gate: ExtensionGatePoint,
  asOf: number,
): SetupConfluenceItem[] {
  const confluence: SetupConfluenceItem[] = [];
  const resistance = nearestResistanceZone(
    options.srZones.filter((zone) => setupEventKnownAt(zone) <= asOf),
    options.latestPrice,
    clampNumberOption(options.resistanceNearPct, 0, 10, 1.5),
  );
  if (resistance) {
    confluence.push({
      code: "near_htf_resistance",
      label: "HTF resistance",
      detail: `Near R ${formatSetupPrice(resistance.low)}-${formatSetupPrice(resistance.high)}`,
      eventTime: resistance.eventTime,
      knownAt: resistance.knownAt,
      sourceTimeframe: "MTF",
      level: resistance.center,
    });
  }

  const avwapLoss = [...(options.anchoredVwapSignals ?? [])]
    .filter(
      (signal) =>
        signal.kind === "loss" && isCandidateRelativeEvent(signal, gate, asOf),
    )
    .sort((a, b) => setupEventKnownAt(b) - setupEventKnownAt(a))[0];
  if (avwapLoss && setupEventKnownAt(avwapLoss) <= asOf) {
    confluence.push({
      code: "avwap_loss_context",
      label: "AVWAP loss",
      detail: "Weak context only",
      eventTime: avwapLoss.eventTime,
      knownAt: avwapLoss.knownAt,
      sourceTimeframe: options.executionTimeframe,
      level: avwapLoss.vwap,
    });
  }

  const avwapDistance = normalizedNullableNumber(options.avwapDistancePct);
  if (avwapDistance != null) {
    confluence.push({
      code: "avwap_distance",
      label: "AVWAP distance",
      detail: `${formatSetupSigned(avwapDistance, 1)}% from AVWAP`,
      value: avwapDistance,
      sourceTimeframe: options.executionTimeframe,
    });
  }

  for (const entry of latestHtfStructureSnapshots(options.htfStructures, asOf)) {
    if (entry.summary.state === "neutral") continue;
    confluence.push({
      code: "mtf_structure_context",
      label: `${entry.timeframe} structure`,
      detail: formatSetupStructure(entry.summary),
      eventTime: entry.summary.updatedTs,
      knownAt: entry.summary.updatedTs,
      sourceTimeframe: entry.timeframe,
    });
  }

  return confluence;
}

function latestHtfStructureSnapshots(
  entries: Array<{ timeframe: string; summary: MarketStructureSummary }>,
  asOf: number,
) {
  const latest = new Map<string, { timeframe: string; summary: MarketStructureSummary }>();
  for (const entry of entries) {
    const knownAt = normalizedNullableNumber(entry.summary.updatedTs);
    if (knownAt != null && knownAt > asOf) continue;
    const current = latest.get(entry.timeframe);
    const currentKnownAt = normalizedNullableNumber(current?.summary.updatedTs) ?? -Infinity;
    if (!current || (knownAt ?? -Infinity) >= currentKnownAt) latest.set(entry.timeframe, entry);
  }
  return [...latest.values()];
}

function setupStructureBreaks(options: ComputeImpulseFadeLifecycleOptions): StructureBreak[] {
  const breaks = options.marketStructure?.breaks?.length
    ? options.marketStructure.breaks
    : options.structure?.lastBreak
      ? [options.structure.lastBreak]
      : [];
  const seen = new Set<string>();
  return breaks.filter((item) => {
    const key = `${item.kind}:${item.direction}:${item.x}:${item.level}:${setupEventKnownAt(item)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function snapshotSetupState(options: {
  extension: SetupStateCheck;
  htfResistance: SetupStateCheck;
  htfStructures: Array<{ timeframe: string; summary: MarketStructureSummary }>;
  rsWeakness: SetupStateCheck;
  structureShift: SetupStateCheck;
  avwapFailure: SetupStateCheck;
  retest: SetupStateCheck;
  invalidated: boolean;
}): SetupStateName {
  if (options.extension.status !== "pass") return "notCandidate";
  if (options.invalidated) return "invalidated";
  if (
    options.structureShift.status === "pass" &&
    options.retest.status === "pass" &&
    (options.rsWeakness.status === "pass" || options.avwapFailure.status === "pass")
  ) {
    return "entryCandidate";
  }
  if (options.structureShift.status === "pass") return "waitingForRetest";
  if (
    (options.rsWeakness.status === "pass" || options.avwapFailure.status === "pass") &&
    hasContextForDeveloping(options.htfResistance, options.htfStructures)
  ) {
    return "deteriorating";
  }
  if (hasContextForDeveloping(options.htfResistance, options.htfStructures)) return "developing";
  return "notCandidate";
}

function snapshotFallbackSetupState(options: {
  checks: SetupStateCheck[];
  asOf: number | null;
  updatedTs: number | null;
  executionTimeframe: string;
  state: SetupStateName;
  reason: string;
  dataQuality?: string[];
  lifecycleConfigHash?: string;
}): SetupStateSnapshot {
  return {
    strategy: "pumpFade",
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash:
      options.lifecycleConfigHash ?? impulseFadeLifecycleConfigHash(),
    asOf: options.asOf,
    executionTimeframe: options.executionTimeframe,
    state: options.state,
    currentState: options.state,
    stateSince: options.asOf,
    label: setupStateLabel(options.state),
    reason: options.reason,
    checks: options.checks,
    updatedTs: options.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: setupPendingConditions(options.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: options.state === "invalidated" ? options.reason : null,
    expiryReason: options.state === "expired" ? options.reason : null,
    dataQuality: options.dataQuality ?? [],
  };
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
    const knownAt = candleKnownAt(candles, source.index);

    const relation: "above" | "below" | null =
      source.candle.c > vwap ? "above" : source.candle.c < vwap ? "below" : null;
    if (!relation) continue;

    if (previousRelation === "above" && relation === "below") {
      signals.push(createAnchoredVwapSignal("loss", source.index, source.candle, vwap, knownAt));
    } else if (previousRelation === "below" && relation === "above") {
      signals.push(createAnchoredVwapSignal("reclaim", source.index, source.candle, vwap, knownAt));
    } else if (
      previousRelation === "below" &&
      relation === "below" &&
      source.candle.h >= vwap &&
      source.candle.c < vwap
    ) {
      signals.push(
        createAnchoredVwapSignal("failedReclaim", source.index, source.candle, vwap, knownAt),
      );
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
    const knownAt = candleKnownAt(candles, sourceIndex + pivotStrength);
    if (isPivotHigh(source, index, pivotStrength)) {
      raw.push(createSwingPoint("SwingHigh", sourceIndex, candle, candle.h, atr, knownAt));
    }
    if (isPivotLow(source, index, pivotStrength)) {
      raw.push(createSwingPoint("SwingLow", sourceIndex, candle, candle.l, atr, knownAt));
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
    const knownAt = candleKnownAt(candles, index);
    while (
      swingIndex < swings.length &&
      swings[swingIndex].index < index &&
      swings[swingIndex].knownAt <= knownAt
    ) {
      const swing = swings[swingIndex];
      if (swing.kind === "SwingHigh") activeHigh = swing;
      else activeLow = swing;
      swingIndex += 1;
    }

    const candle = candles[index];
    if (activeHigh && !brokenHighs.has(activeHigh.x) && candle.c > activeHigh.price) {
      const kind: StructureBreakKind = trend === "bearish" ? "StructureShift" : "StructureBreak";
      breaks.push(createStructureBreak(kind, "bullish", index, candle, activeHigh, knownAt));
      brokenHighs.add(activeHigh.x);
      trend = "bullish";
    }
    if (activeLow && !brokenLows.has(activeLow.x) && candle.c < activeLow.price) {
      const kind: StructureBreakKind = trend === "bullish" ? "StructureShift" : "StructureBreak";
      breaks.push(createStructureBreak(kind, "bearish", index, candle, activeLow, knownAt));
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
  const maxAgeBars = clampIntegerOption(
    options.maxAgeBars,
    1,
    2000,
    options.lookback ?? 240,
  );
  const includeDivergences = options.includeDivergences ?? true;
  const includeLeads = options.includeLeads ?? true;
  const includeBreaks = options.includeBreaks ?? true;
  const rsLine = computeRelativeCumulativeReturnLine(candles, benchmarkCandles);
  const rsByX = linePointMap(rsLine);
  if (!candles.length || rsByX.size < 2) return [];

  const latestX = candles[candles.length - 1]?.x ?? 0;
  const minEventX = latestX - maxAgeBars;
  const structureOptions: MarketStructureOptions = {
    ...options,
    maxSwings: Math.max(options.maxSwings ?? 120, maxDivergences * 4),
    maxBreaks: Math.max(options.maxBreaks ?? 24, maxDivergences * 2),
  };
  const structure = computeMarketStructure(candles, {
    ...structureOptions,
  });
  const rsCandles = relativeStrengthCandlesFromLine(candles, rsLine);
  const rsStructure = computeMarketStructure(rsCandles, {
    ...structureOptions,
  });
  const priceSourceByX = new Map(candles.map((candle, index) => [candle.x, { candle, index }]));
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
            if (includeDivergences) {
              divergences.push(
                createRelativeStrengthDivergence(
                  "bearishHigh",
                  "divergence",
                  "bearish",
                  "RS DIV ↓",
                  swing,
                  previousHigh,
                  rs,
                  previousRs,
                  structure.summary.state,
                  rsStructure.summary.state,
                ),
              );
            }
          } else if (swing.price < previousHigh.price && rs >= previousRs + minDeltaPct) {
            if (includeLeads) {
              divergences.push(
                createRelativeStrengthDivergence(
                  "bullishHigh",
                  "lead",
                  "bullish",
                  "RS LEAD ↑",
                  swing,
                  previousHigh,
                  rs,
                  previousRs,
                  structure.summary.state,
                  rsStructure.summary.state,
                ),
              );
            }
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
          if (includeLeads) {
            divergences.push(
              createRelativeStrengthDivergence(
                "bearishLow",
                "lead",
                "bearish",
                "RS LEAD ↓",
                swing,
                previousLow,
                rs,
                previousRs,
                structure.summary.state,
                rsStructure.summary.state,
              ),
            );
          }
        } else if (swing.price < previousLow.price && rs >= previousRs + minDeltaPct) {
          if (includeDivergences) {
            divergences.push(
              createRelativeStrengthDivergence(
                "bullishLow",
                "divergence",
                "bullish",
                "RS DIV ↑",
                swing,
                previousLow,
                rs,
                previousRs,
                structure.summary.state,
                rsStructure.summary.state,
              ),
            );
          }
        }
      }
    }
    previousLow = swing;
  }

  if (includeBreaks) {
    for (const rsBreak of rsStructure.breaks) {
      if (rsBreak.x < minEventX) continue;
      const source = priceSourceByX.get(rsBreak.x);
      const rs = rsByX.get(rsBreak.x);
      if (!source || rs == null || !Number.isFinite(rs)) continue;

      const priceStructureAtBreak = computeMarketStructure(candles.slice(0, source.index + 1), {
        ...structureOptions,
        maxBreaks: Math.max(8, options.maxBreaks ?? 24),
      });
      if (!priceStructureAllowsRsBreak(rsBreak.direction, priceStructureAtBreak.summary.state)) {
        continue;
      }

      divergences.push(
        createRelativeStrengthBreakSignal(
          rsBreak.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          rsBreak.direction,
          rsBreak.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          source.index,
          source.candle,
          rs,
          rsBreak,
          priceStructureAtBreak.summary.state,
          rsStructure.summary.state,
        ),
      );
    }
  }

  return divergences
    .filter((item) => item.x >= minEventX)
    .sort((a, b) => a.x - b.x || signalPriority(a.signal) - signalPriority(b.signal))
    .slice(-maxDivergences);
}

export function lineToBytes(line: Float32Array): Uint8Array {
  return new Uint8Array(line.buffer);
}

function setupMetricsFromPartial(metrics: SetupExtensionMetrics | null): SetupExtensionMetrics {
  return {
    returnPct: normalizedNullableNumber(metrics?.returnPct),
    percentile: normalizedNullableNumber(metrics?.percentile),
    zScore: normalizedNullableNumber(metrics?.zScore),
    atrExtension: normalizedNullableNumber(metrics?.atrExtension),
  };
}

function setupMetricsFromExtensionSnapshot(snapshot: ExtensionSnapshot): SetupExtensionMetrics {
  return {
    returnPct: normalizedNullableNumber(snapshot.returnPct),
    percentile: normalizedNullableNumber(snapshot.percentile),
    zScore: normalizedNullableNumber(snapshot.zScore),
    atrExtension: normalizedNullableNumber(snapshot.atrExtension),
  };
}

function setupExtensionGatePass(extension: SetupExtensionMetrics | null) {
  const metrics = setupMetricsFromPartial(extension);
  return (
    (metrics.returnPct != null && metrics.returnPct >= IMPULSE_FADE_CANDIDATE_GATE.returnPct) ||
    (metrics.percentile != null &&
      metrics.percentile >= IMPULSE_FADE_CANDIDATE_GATE.percentile) ||
    (metrics.zScore != null && metrics.zScore >= IMPULSE_FADE_CANDIDATE_GATE.zScore) ||
    (metrics.atrExtension != null &&
      metrics.atrExtension >= IMPULSE_FADE_CANDIDATE_GATE.atrExtension)
  );
}

function setupDataQualityNotes(
  gates: ExtensionGatePoint[],
  options: ExtensionSnapshotOptions,
) {
  const notes: string[] = [];
  const minSamples = clampIntegerOption(options.minSamples, 1, 10_000, 20);
  const latest = gates[gates.length - 1] ?? null;
  if (!latest) {
    notes.push("No candle history was available at the requested asOf time");
  } else if (latest.rollingReturnCount < minSamples) {
    notes.push(
      `Rolling-return history has ${latest.rollingReturnCount}/${minSamples} samples for percentile and Z-score`,
    );
  }
  return notes;
}

function setupTransition(
  from: SetupStateName,
  to: SetupStateName,
  event: SetupStateEvidence,
): SetupStateTransition {
  return {
    from,
    to,
    knownAt: event.knownAt,
    evidenceIds: [event.id],
    evidenceCodes: [event.code],
    explanation: event.explanation,
  };
}

function setupStateReasonFromLifecycle(
  state: SetupStateName,
  evidence: SetupStateEvidence[],
  transitions: SetupStateTransition[],
  invalidationReason: string | null,
  expiryReason: string | null,
) {
  if (state === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (state === "invalidated") return invalidationReason ?? "Continuation invalidated the fade setup";
  if (state === "expired") return expiryReason ?? "Candidate expired before progressing";
  const lastTransition = transitions[transitions.length - 1];
  if (lastTransition && lastTransition.to === state) return lastTransition.explanation;
  const stateEvidence = evidence.filter((item) => item.contributesTo === state);
  const latestEvidence = stateEvidence[stateEvidence.length - 1];
  return latestEvidence?.explanation ?? setupStateLabel(state);
}

function setupPendingConditions(
  state: SetupStateName,
  activeBreakLevel: SetupLifecycleLevel | null,
) {
  switch (state) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break",
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        activeBreakLevel
          ? `Retest ${formatSetupPrice(activeBreakLevel.level)} and confirm bearish rejection`
          : "Retest the broken structure level and confirm bearish rejection",
      ];
    case "entryCandidate":
      return ["Discretionary review; no simulated trade is generated yet"];
    case "notCandidate":
      return ["Candidate extension gate must cross from false to true"];
    case "invalidated":
    case "expired":
      return [];
  }
}

function deterministicSetupCandidateId(options: {
  setupFamily: SetupFamily;
  symbol: string;
  source: string;
  venue: string;
  executionTimeframe: string;
  detectedAt: number;
}) {
  return [
    options.setupFamily,
    options.symbol,
    options.source,
    options.venue,
    options.executionTimeframe,
    String(options.detectedAt),
  ]
    .map((part) => String(part || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-"))
    .join(":");
}

function setupEventId(
  code: string,
  sourceTimeframe: string,
  eventTime: number,
  knownAt: number,
  salt?: string | number | null,
) {
  return [code, sourceTimeframe, eventTime, knownAt, salt ?? ""]
    .map((part) => String(part).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-"))
    .join(":");
}

function episodeHighSnapshot(
  candles: CandleRecord[],
  detectedEventTime: number,
  asOf: number,
  timeframe?: string | number,
) {
  let best: { price: number; eventTime: number } | null = null;
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const eventTime = candleEventTime(candle);
    if (eventTime < detectedEventTime || candleKnownAt(candles, index, timeframe) > asOf) continue;
    if (!Number.isFinite(candle.h)) continue;
    if (!best || candle.h > best.price) best = { price: candle.h, eventTime };
  }
  return best;
}

function latestKnownAt(candles: CandleRecord[], timeframe?: string | number) {
  if (!candles.length) return null;
  return candleKnownAt(candles, candles.length - 1, timeframe);
}

function latestKnownCandle(
  candles: CandleRecord[],
  asOf: number,
  timeframe?: string | number,
) {
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    if (candleKnownAt(candles, index, timeframe) <= asOf) {
      return { candle: candles[index], index };
    }
  }
  return null;
}

function candleEventTime(candle: CandleRecord) {
  const ts = normalizedNullableNumber(candle.ts);
  if (ts != null) return ts;
  const bucket = normalizedNullableNumber(candle.bucket);
  return bucket ?? 0;
}

function candleKnownAt(
  candles: CandleRecord[],
  index: number,
  timeframe?: string | number,
) {
  const candle = candles[index];
  if (!candle) return 0;
  if (candle.knownAt != null && Number.isFinite(candle.knownAt)) return candle.knownAt;
  if (timeframe != null && String(timeframe).trim() !== "chart") {
    return candleCloseTime(candle, timeframe);
  }
  const start = normalizedNullableNumber(candle.bucket) ?? candleEventTime(candle);
  return start + inferredCandleSeconds(candles, index);
}

function inferredCandleSeconds(candles: CandleRecord[], index: number) {
  const current = normalizedNullableNumber(candles[index]?.bucket) ?? candleEventTime(candles[index]);
  const next = normalizedNullableNumber(candles[index + 1]?.bucket);
  if (next != null && next > current) return next - current;
  const previous = normalizedNullableNumber(candles[index - 1]?.bucket);
  if (previous != null && current > previous) return current - previous;
  return 1;
}

function setupEventKnownAt(event: {
  knownAt?: number | null;
  eventTime?: number | null;
  ts?: number | null;
  bucket?: number | null;
}) {
  return (
    normalizedNullableNumber(event.knownAt) ??
    normalizedNullableNumber(event.eventTime) ??
    normalizedNullableNumber(event.ts) ??
    normalizedNullableNumber(event.bucket) ??
    0
  );
}

function isCandidateRelativeEvent(
  event: {
    knownAt?: number | null;
    eventTime?: number | null;
    ts?: number | null;
    bucket?: number | null;
  },
  gate: ExtensionGatePoint,
  asOf: number,
) {
  const knownAt = setupEventKnownAt(event);
  const eventTime =
    normalizedNullableNumber(event.eventTime) ??
    normalizedNullableNumber(event.ts) ??
    normalizedNullableNumber(event.bucket) ??
    knownAt;
  return knownAt > gate.knownAt && knownAt <= asOf && eventTime >= gate.knownAt;
}

function formatSetupStructure(summary: MarketStructureSummary) {
  if (summary.state === "transitional" && summary.transitionDirection) {
    return `Transitional ${summary.transitionDirection}`;
  }
  return summary.state;
}

function formatSetupDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  if (safe >= 86_400) return `${Math.round(safe / 86_400)}d`;
  if (safe >= 3_600) return `${Math.round(safe / 3_600)}h`;
  if (safe >= 60) return `${Math.round(safe / 60)}m`;
  return `${safe}s`;
}

function validPositivePrice(value: number) {
  return Number.isFinite(value) && value > 0;
}

function setupExtensionCheck(extension: SetupExtensionMetrics | null): SetupStateCheck {
  const returnPct = normalizedNullableNumber(extension?.returnPct);
  const percentile = normalizedNullableNumber(extension?.percentile);
  const zScore = normalizedNullableNumber(extension?.zScore);
  const atrExtension = normalizedNullableNumber(extension?.atrExtension);
  const detailParts = [
    returnPct == null ? null : `24h ${formatSetupSigned(returnPct, 1)}%`,
    atrExtension == null ? null : `Ext ${formatSetupSigned(atrExtension, 1)} ATR`,
    zScore == null ? null : `Z ${formatSetupSigned(zScore, 1)}`,
    percentile == null ? null : `Pctl ${Math.round(percentile)}`,
  ].filter((item): item is string => Boolean(item));
  const pass = setupExtensionGatePass({ returnPct, percentile, zScore, atrExtension });

  return {
    key: "extension",
    label: "Extension",
    status: pass ? "pass" : "pending",
    detail: detailParts.join(" | ") || "No extension context yet",
  };
}

function setupResistanceCheck(
  zones: SupportResistanceZone[],
  latestPrice: number | null,
  nearPct: number,
): SetupStateCheck {
  const zone = nearestResistanceZone(zones, latestPrice, nearPct);
  if (!zone) {
    return {
      key: "htfResistance",
      label: "HTF resistance",
      status: "pending",
      detail: "No nearby resistance zone",
    };
  }
  return {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${formatSetupPrice(zone.low)}-${formatSetupPrice(zone.high)} strength ${zone.strength.toFixed(1)}`,
  };
}

function setupRsWeaknessCheck(divergences: RelativeStrengthDivergence[]): SetupStateCheck {
  const event = [...divergences].reverse().find((item) => item.direction === "bearish");
  if (!event) {
    return {
      key: "rsWeakness",
      label: "RS weakness",
      status: "pending",
      detail: "No bearish RS event",
    };
  }
  return {
    key: "rsWeakness",
    label: "RS weakness",
    status: "pass",
    detail: event.label,
  };
}

function setupStructureShiftCheck(structure: MarketStructureSummary | null): SetupStateCheck {
  const bearish =
    structure?.state === "bearish" ||
    (structure?.state === "transitional" && structure.transitionDirection === "bearish");
  return {
    key: "structureShift",
    label: "Structure shift",
    status: bearish ? "pass" : "pending",
    detail: bearish
      ? structure.state === "bearish"
        ? "Bearish structure"
        : "Bearish transition"
      : "No bearish structure shift",
  };
}

function setupAvwapFailureCheck(
  signals: AnchoredVwapSignal[],
  distancePct: number | null | undefined,
): SetupStateCheck {
  const signal = [...signals]
    .reverse()
    .find((item) => item.kind === "loss" || item.kind === "failedReclaim");
  const normalizedDistance = normalizedNullableNumber(distancePct);
  const pass = Boolean(signal) || (normalizedDistance != null && normalizedDistance <= -0.2);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: pass ? "pass" : "pending",
    detail: signal?.label ?? (normalizedDistance == null
      ? "No AVWAP failure"
      : `AVWAP ${formatSetupSigned(normalizedDistance, 1)}%`),
  };
}

function setupRetestCheck(
  structure: MarketStructureSummary | null,
  zones: SupportResistanceZone[],
  latestPrice: number | null,
  nearPct: number,
): SetupStateCheck {
  const breakLevel = normalizedNullableNumber(structure?.lastBreak?.level);
  const nearBreak =
    breakLevel != null && latestPrice != null && distancePct(latestPrice, breakLevel) <= nearPct;
  const nearResistance = nearestResistanceZone(zones, latestPrice, nearPct);
  const pass = Boolean(nearBreak || nearResistance);
  return {
    key: "retest",
    label: "Retest",
    status: pass ? "pass" : "pending",
    detail: nearBreak
      ? `Retesting ${formatSetupPrice(breakLevel)}`
      : nearResistance
        ? `Near R ${formatSetupPrice(nearResistance.center)}`
        : "No retest yet",
  };
}

function setupInvalidated(
  extension: SetupStateCheck,
  htfResistance: SetupStateCheck,
  structure: MarketStructureSummary | null,
  latestPrice: number | null,
) {
  if (extension.status !== "pass" || htfResistance.status !== "pass") return false;
  if (structure?.state !== "bullish" || latestPrice == null) return false;
  const high = normalizedNullableNumber(structure.lastSwingHigh?.price);
  return high != null && latestPrice > high * 1.01;
}

function hasContextForDeveloping(
  htfResistance: SetupStateCheck,
  htfStructures: Array<{ timeframe: string; summary: MarketStructureSummary }>,
) {
  return (
    htfResistance.status === "pass" ||
    htfStructures.some((entry) => entry.summary.state !== "neutral")
  );
}

function nearestResistanceZone(
  zones: SupportResistanceZone[],
  latestPrice: number | null,
  nearPct: number,
) {
  if (latestPrice == null || !validPositivePrice(latestPrice)) return null;
  return zones
    .filter((zone) => zone.kind === "resistance")
    .map((zone) => ({
      zone,
      distance:
        latestPrice >= zone.low && latestPrice <= zone.high
          ? 0
          : latestPrice < zone.low
            ? ((zone.low - latestPrice) / latestPrice) * 100
            : ((latestPrice - zone.high) / latestPrice) * 100,
    }))
    .filter((item) => item.distance <= nearPct)
    .sort((a, b) => a.distance - b.distance || b.zone.strength - a.zone.strength)
    .map((item) => item.zone)[0] ?? null;
}

function distancePct(value: number, reference: number) {
  if (!validPositivePrice(value) || !validPositivePrice(reference)) return Infinity;
  return Math.abs((value / reference - 1) * 100);
}

function setupStateLabel(state: SetupStateName) {
  switch (state) {
    case "developing":
      return "Developing";
    case "deteriorating":
      return "Deteriorating";
    case "waitingForRetest":
      return "Waiting for Retest";
    case "entryCandidate":
      return "Entry Candidate";
    case "invalidated":
      return "Invalidated";
    case "expired":
      return "Expired";
    case "notCandidate":
      return "Not Candidate";
  }
}

function setupStateReason(state: SetupStateName, checks: SetupStateCheck[]) {
  if (state === "notCandidate") return "Waiting for extension context";
  if (state === "invalidated") return "Continuation invalidated the fade setup";
  if (state === "expired") return "Candidate expired before progressing";
  const passed = checks.filter((check) => check.status === "pass").map((check) => check.label);
  return passed.length ? passed.join(" + ") : setupStateLabel(state);
}

function formatSetupSigned(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatSetupPrice(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(3).replace(/\.?0+$/, "");
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function normalizedNullableNumber(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? null : Number(value);
}

function lastItem<T>(items: T[]) {
  return items[items.length - 1];
}

function latestValidCloseCandle(candles: CandleRecord[]) {
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    const candle = candles[index];
    if (validPositivePrice(candle.c)) return candle;
  }
  return null;
}

function emptyExtensionSnapshot(windowSeconds: number): ExtensionSnapshot {
  return {
    candle: null,
    referenceCandle: null,
    windowSeconds,
    returnPct: null,
    percentile: null,
    zScore: null,
    rollingReturnCount: 0,
    ema: null,
    atr: null,
    atrExtension: null,
  };
}

function findReferenceCandle(
  candles: CandleRecord[],
  targetBucket: number,
  beforeIndex: number,
) {
  const endIndex = Math.min(candles.length - 1, Math.max(0, beforeIndex - 1));
  let low = 0;
  let high = endIndex;
  let candidate = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (candles[middle].bucket <= targetBucket) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  while (candidate >= 0 && !validPositivePrice(candles[candidate].c)) candidate -= 1;
  return candidate >= 0 ? candles[candidate] : null;
}

function rollingWindowReturns(
  candles: CandleRecord[],
  options: {
    windowSeconds: number;
    earliestBucket: number;
    excludeBucket: number;
  },
) {
  const returns: number[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const candle = candles[index];
    if (candle.bucket < options.earliestBucket || candle.bucket >= options.excludeBucket) continue;
    if (!validPositivePrice(candle.c)) continue;
    const reference = findReferenceCandle(candles, candle.bucket - options.windowSeconds, index);
    if (!reference || !validPositivePrice(reference.c)) continue;
    returns.push(((candle.c / reference.c) - 1) * 100);
  }
  return returns;
}

function percentileRank(values: number[], value: number) {
  if (!values.length || !Number.isFinite(value)) return null;
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  const below = valid.filter((item) => item < value).length;
  const equal = valid.filter((item) => item === value).length;
  return ((below + equal * 0.5) / valid.length) * 100;
}

function zScoreAgainst(values: number[], value: number) {
  const valid = values.filter(Number.isFinite);
  if (valid.length < 2 || !Number.isFinite(value)) return null;
  const mean = valid.reduce((sum, item) => sum + item, 0) / valid.length;
  const variance =
    valid.reduce((sum, item) => sum + (item - mean) ** 2, 0) / (valid.length - 1);
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? (value - mean) / stdDev : null;
}

function createAnchoredVwapSignal(
  kind: AnchoredVwapSignalKind,
  index: number,
  candle: CandleRecord,
  vwap: number,
  knownAt: number,
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
    eventTime: candleEventTime(candle),
    knownAt,
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
  knownAt: number,
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
    eventTime: candleEventTime(candle),
    knownAt,
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
  knownAt: number,
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
    eventTime: candleEventTime(candle),
    knownAt,
  };
}

function createRelativeStrengthDivergence(
  kind: RelativeStrengthDivergenceKind,
  signal: RelativeStrengthSignalKind,
  direction: StructureDirection,
  label: RelativeStrengthDivergence["label"],
  swing: SwingPoint,
  previousSwing: SwingPoint,
  rs: number,
  previousRs: number,
  priceStructureState: StructureSummaryState,
  rsStructureState: StructureSummaryState,
): RelativeStrengthDivergence {
  return {
    kind,
    signal,
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
    sourceBreak: null,
    priceStructureState,
    rsStructureState,
    eventTime: swing.eventTime,
    knownAt: Math.max(swing.knownAt, previousSwing.knownAt),
  };
}

function createRelativeStrengthBreakSignal(
  kind: "bearishBreak" | "bullishBreak",
  direction: StructureDirection,
  label: RelativeStrengthDivergence["label"],
  index: number,
  candle: CandleRecord,
  rs: number,
  sourceBreak: StructureBreak,
  priceStructureState: StructureSummaryState,
  rsStructureState: StructureSummaryState,
): RelativeStrengthDivergence {
  return {
    kind,
    signal: "break",
    direction,
    label,
    index,
    x: candle.x,
    ts: candle.ts,
    bucket: candle.bucket,
    price: direction === "bearish" ? candle.l : candle.h,
    previousPrice: null,
    rs,
    previousRs: sourceBreak.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak,
    priceStructureState,
    rsStructureState,
    eventTime: sourceBreak.eventTime,
    knownAt: sourceBreak.knownAt,
  };
}

function relativeStrengthCandlesFromLine(
  candles: CandleRecord[],
  line: Float32Array,
): CandleRecord[] {
  const candleByX = new Map(candles.map((candle) => [candle.x, candle]));
  const result: CandleRecord[] = [];
  let previousValue: number | null = null;

  for (let index = 0; index < line.length; index += 2) {
    const x = line[index];
    const value = line[index + 1];
    const source = candleByX.get(x);
    if (!source || !Number.isFinite(value)) continue;
    const open = previousValue ?? value;
    result.push({
      ...source,
      o: open,
      h: value,
      l: value,
      c: value,
      v_base: 0,
      v_quote: 0,
    });
    previousValue = value;
  }

  return result;
}

function priceStructureAllowsRsBreak(
  rsDirection: StructureDirection,
  priceState: StructureSummaryState,
) {
  if (rsDirection === "bearish") return priceState === "bullish" || priceState === "transitional";
  return priceState === "bearish" || priceState === "transitional";
}

function signalPriority(signal: RelativeStrengthSignalKind) {
  switch (signal) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
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
    updatedTs: lastBreak?.knownAt ?? latestSwing?.knownAt ?? null,
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
    eventTime: sourceSwing.eventTime,
    knownAt: sourceSwing.knownAt,
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
      eventTime: swing.eventTime,
      knownAt: swing.knownAt,
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
  existing.eventTime = Math.max(existing.eventTime, swing.eventTime);
  existing.knownAt = Math.max(existing.knownAt, swing.knownAt);
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
