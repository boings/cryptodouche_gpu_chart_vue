import type { CandleRecord } from "./types";
export declare const IMPULSE_FADE_SETUP_FAMILY: "impulse_fade_v1";
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
export type SwingPointStructure = SwingPointKind | "HigherHigh" | "HigherLow" | "LowerHigh" | "LowerLow";
export type SwingPointLabel = "SH" | "SL" | "HH" | "HL" | "LH" | "LL";
export type StructureBreakKind = "StructureBreak" | "StructureShift";
export type StructureDirection = "bullish" | "bearish";
export type StructureSummaryState = StructureDirection | "transitional" | "range" | "neutral";
export type StructureActiveLevelRole = "continuation" | "shift" | "rangeHigh" | "rangeLow";
export type RelativeStrengthDivergenceKind = "bearishHigh" | "bearishLow" | "bearishBreak" | "bullishHigh" | "bullishLow" | "bullishBreak";
export type RelativeStrengthSignalKind = "divergence" | "lead" | "break";
export type RelativeStrengthDivergenceLabel = "RS DIV ↓" | "RS LEAD ↓" | "RS BREAK ↓" | "RS DIV ↑" | "RS LEAD ↑" | "RS BREAK ↑";
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
export type SetupStateName = "notCandidate" | "developing" | "deteriorating" | "waitingForRetest" | "entryCandidate" | "invalidated" | "expired";
export type SetupStateCheckStatus = "pass" | "pending" | "fail";
export interface SetupExtensionMetrics {
    returnPct?: number | null;
    percentile?: number | null;
    zScore?: number | null;
    atrExtension?: number | null;
}
export interface SetupStateCheck {
    key: "extension" | "htfResistance" | "rsWeakness" | "structureShift" | "avwapFailure" | "retest";
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
    htfStructures?: Array<{
        timeframe: string;
        summary: MarketStructureSummary;
    }>;
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
}
export interface SetupStateSnapshot {
    strategy: "pumpFade";
    setupFamily: SetupFamily;
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
export declare function computeSmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeEmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeWmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeBollingerBands(candles: CandleRecord[], period?: number, stdDev?: number): {
    basis: Float32Array;
    upper: Float32Array;
    lower: Float32Array;
};
export declare function computeRsiLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeStochRsi(candles: CandleRecord[], rsiPeriod?: number, stochPeriod?: number, kPeriod?: number, dPeriod?: number): {
    k: Float32Array;
    d: Float32Array;
};
export declare function computeMacd(candles: CandleRecord[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
    macd: Float32Array;
    signal: Float32Array;
    histogram: Float32Array;
};
export declare function computeAtrLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeExtensionSnapshot(candles: CandleRecord[], options?: ExtensionSnapshotOptions): ExtensionSnapshot;
export declare function computeSetupState(options?: SetupStateOptions): SetupStateSnapshot;
export declare function evaluateImpulseFadeTimeline(options: ImpulseFadeTimelineOptions): ImpulseFadeTimelineRecord[];
export declare function evaluateImpulseFadeSnapshot(options: ImpulseFadeTimelineOptions): SetupStateSnapshot | null;
export declare const CANDLE_TIMESTAMP_SEMANTICS: "openTime";
export declare function candleCloseTime(candle: Pick<CandleRecord, "ts" | "bucket">, timeframe: string | number): number;
export declare function computeAnchoredVwapLine(candles: CandleRecord[], options?: AnchoredVwapOptions): Float32Array;
export declare function computeAnchoredVwapSnapshot(candles: CandleRecord[], options?: AnchoredVwapOptions): AnchoredVwapSnapshot;
export declare function computeAnchoredVwapSignals(candles: CandleRecord[], options?: AnchoredVwapOptions, maxSignals?: number): AnchoredVwapSignal[];
export declare function computeSwingPoints(candles: CandleRecord[], options?: MarketStructureOptions): SwingPoint[];
export declare function computeMarketStructure(candles: CandleRecord[], options?: MarketStructureOptions): MarketStructureState;
export declare function computeStructureActiveLevels(structure: MarketStructureState): StructureActiveLevel[];
export declare function computeSupportResistanceZones(candles: CandleRecord[], options?: SupportResistanceZoneOptions): SupportResistanceZone[];
export declare function computeSupportResistanceZonesFromSwings(swings: SwingPoint[], options?: SupportResistanceZoneFromSwingsOptions): SupportResistanceZone[];
export declare function computeRelativeCumulativeReturnLine(candles: CandleRecord[], benchmarkCandles: CandleRecord[]): Float32Array;
export declare function computeRelativeStrengthDivergences(candles: CandleRecord[], benchmarkCandles: CandleRecord[], options?: RelativeStrengthDivergenceOptions): RelativeStrengthDivergence[];
export declare function lineToBytes(line: Float32Array): Uint8Array;
