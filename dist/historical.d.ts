export declare const HISTORICAL_CANDLE_SCHEMA_VERSION: "historical-candle.1";
export declare const HISTORICAL_VALIDATION_SCHEMA_VERSION: "historical-validation.1";
export declare const HISTORICAL_AGGREGATION_SCHEMA_VERSION: "historical-aggregation.1";
export type HistoricalAnalysisTimeframe = "15m" | "1h" | "4h" | "1d";
export type HistoricalExecutionSimulationMode = "SameVenueHistoricalSimulation" | "ResearchProxyExecution";
export type HistoricalUniverseProvenanceMode = "PointInTimeUniverse" | "CurrentUniverseResearchAssumption" | "ExplicitSymbolList";
export type HistoricalProvenanceStatus = "verified" | "researchAssumption" | "unknown";
export interface HistoricalSourceRef {
    id: string;
    venue: string;
    instrumentType: "linearUsdtPerpetual";
    symbol: string;
    timezone: "UTC";
    intervalBoundaries: "utcEpoch";
    candleConstruction: "canonical1m" | "aggregatedCanonical1m" | "exchangeNative";
}
export interface HistoricalVenueProvenance {
    analysisSource: HistoricalSourceRef;
    referenceSource: HistoricalSourceRef;
    executionPriceDataSource: HistoricalSourceRef | null;
    intendedExecutionVenue: {
        venue: string;
        status: HistoricalProvenanceStatus;
        evidence: string | null;
    };
    executionSimulationMode: HistoricalExecutionSimulationMode;
}
export interface HistoricalUniverseProvenance {
    mode: HistoricalUniverseProvenanceMode;
    status: HistoricalProvenanceStatus;
    asOf: number | null;
    symbols: string[];
    evidence: string | null;
}
export interface HistoricalFundingObservation {
    venue: string;
    symbol: string;
    timestamp: number;
    rate: number;
    knownAt: number;
}
export interface HistoricalCandleInput {
    source: string;
    symbol: string;
    timeframe: string;
    openTime: number;
    closeTime: number;
    knownAt?: number;
    o: number;
    h: number;
    l: number;
    c: number;
    volumeBase?: number | null;
    volumeQuote?: number | null;
    revision?: number;
    active?: boolean;
}
export interface CanonicalHistoricalCandle {
    schemaVersion: typeof HISTORICAL_CANDLE_SCHEMA_VERSION;
    logicalId: string;
    source: string;
    symbol: string;
    timeframe: string;
    openTime: number;
    closeTime: number;
    knownAt: number;
    o: number;
    h: number;
    l: number;
    c: number;
    volumeBase: number | null;
    volumeQuote: number | null;
    revision: number;
}
export type HistoricalDataIssueCode = "MISSING_CANDLE_INTERVAL" | "DUPLICATE_CANDLE" | "INVALID_OHLC" | "TARGET_REFERENCE_MISALIGNMENT" | "INSUFFICIENT_ANALYSIS_PREROLL" | "INSUFFICIENT_DISPLAY_PREROLL" | "INSUFFICIENT_EXECUTION_POSTROLL" | "FUNDING_DATA_UNAVAILABLE" | "EXECUTION_RESOLUTION_UNAVAILABLE" | "CANDLE_REVISION_HISTORY_UNAVAILABLE" | "POINT_IN_TIME_UNIVERSE_UNKNOWN" | "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN" | "INVALID_CANDLE_INTERVAL" | "INCOMPLETE_CANDLE" | "NEGATIVE_VOLUME" | "NON_MONOTONIC_CANDLES" | "SOURCE_MISMATCH" | "SYMBOL_MISMATCH" | "FUNDING_SOURCE_MISMATCH" | "RESEARCH_PROXY_EXECUTION";
export interface HistoricalDataIssue {
    code: HistoricalDataIssueCode;
    severity: "error" | "warning";
    scope: "target" | "reference" | "execution" | "funding" | "universe" | "venue" | "bundle";
    message: string;
    openTime: number | null;
    expected: string | number | null;
    actual: string | number | null;
}
export interface HistoricalNormalizationInput {
    candles: readonly HistoricalCandleInput[];
    source: string;
    symbol: string;
    timeframe: string;
    completedThrough: number;
    scope?: "target" | "reference" | "execution";
}
export interface HistoricalNormalizationResult {
    schemaVersion: typeof HISTORICAL_VALIDATION_SCHEMA_VERSION;
    candles: CanonicalHistoricalCandle[];
    issues: HistoricalDataIssue[];
    valid: boolean;
    rawFingerprint: string;
    fingerprint: string;
}
export interface HistoricalAggregationResult {
    schemaVersion: typeof HISTORICAL_AGGREGATION_SCHEMA_VERSION;
    sourceTimeframe: "1m";
    targetTimeframe: HistoricalAnalysisTimeframe;
    candles: CanonicalHistoricalCandle[];
    issues: HistoricalDataIssue[];
    valid: boolean;
    sourceFingerprint: string;
    fingerprint: string;
}
export interface HistoricalValidationRequirements {
    decisionTime: number;
    analysisPreRollSeconds: number;
    displayPreRollSeconds: number;
    executionPostRollSeconds: number;
    executionTimeframe: string;
    fundingRequired: boolean;
    revisionHistoryRequired: boolean;
    pointInTimeUniverseRequired: boolean;
    pointInTimeExecutionVenueRequired: boolean;
    requiredAnalysisTimeframes: readonly string[];
    requiredFundingTimestamps?: readonly number[];
    permittedWarningCodes?: readonly HistoricalDataIssueCode[];
}
export interface HistoricalCaseValidationInput {
    targetCandles: readonly CanonicalHistoricalCandle[];
    referenceCandles: readonly CanonicalHistoricalCandle[];
    executionCandles: readonly CanonicalHistoricalCandle[];
    fundingObservations: readonly HistoricalFundingObservation[];
    targetRevisionHistoryAvailable: boolean;
    referenceRevisionHistoryAvailable: boolean;
    provenance: HistoricalVenueProvenance;
    universe: HistoricalUniverseProvenance;
    requirements: HistoricalValidationRequirements;
}
export interface HistoricalCaseValidationResult {
    schemaVersion: typeof HISTORICAL_VALIDATION_SCHEMA_VERSION;
    valid: boolean;
    issues: HistoricalDataIssue[];
    targetFingerprint: string;
    referenceFingerprint: string;
    executionFingerprint: string;
    bundleFingerprint: string;
}
export declare function historicalCandleLogicalId(input: {
    source: string;
    symbol: string;
    timeframe: string;
    openTime: number;
}): string;
export declare function historicalCandlesFingerprint(candles: readonly CanonicalHistoricalCandle[]): string;
export declare function normalizeCompletedUtcCandles(input: HistoricalNormalizationInput): HistoricalNormalizationResult;
export declare function aggregateCanonicalOneMinuteCandles(candles: readonly CanonicalHistoricalCandle[], targetTimeframe: HistoricalAnalysisTimeframe): HistoricalAggregationResult;
export declare function validateHistoricalCase(input: HistoricalCaseValidationInput): HistoricalCaseValidationResult;
