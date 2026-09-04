import { type ReplayCandleRecord } from "./replay";
import type { ReplayAnalysisFreshness, ReplayAnalysisState, ReplayAnalysisStructureState } from "./replayAnalysis";
import { type JsonValue } from "./serialization";
import type { DecisionDataQualityNote, DecisionReferenceLevel } from "./strategy";
import type { CandidateMetrics } from "./types";
export declare const CHART_ANALYSIS_DIGEST_SCHEMA_VERSION: "chart-analysis-digest.1";
export declare const CHART_ANALYSIS_COMPARISON_SCHEMA_VERSION: "chart-analysis-comparison.1";
export type ChartAnalysisDigestMode = "liveHistorical" | "replay";
export type ChartAnalysisDigestAvailability = "development" | "test" | "audit";
export type ChartAnalysisNumericFamily = "price" | "volume" | "percentage" | "ratio" | "oscillator" | "score";
/** Fixed decimal places used before analytical equality checks. */
export declare const CHART_ANALYSIS_NUMERIC_PRECISION: Readonly<Record<ChartAnalysisNumericFamily, number>>;
export interface ChartAnalysisCandlePrefixDigest {
    timeframe: string;
    count: number;
    firstOpenTime: number | null;
    latestCloseTime: number | null;
    logicalCandleIds: string[];
    observationIds: string[];
    prefixFingerprint: string;
}
export interface ChartAnalysisLifecycleState {
    candidateId: string | null;
    state: ReplayAnalysisState["lifecycleResult"]["currentState"];
    stateSince: number | null;
}
export interface ChartAnalysisSetupState {
    label: string;
    reason: string;
    checks: ReplayAnalysisState["setupState"]["checks"];
    transitions: ReplayAnalysisState["setupState"]["transitions"];
    activeBreakLevel: ReplayAnalysisState["setupState"]["activeBreakLevel"];
    retestLevel: ReplayAnalysisState["setupState"]["retestLevel"];
    confluence: ReplayAnalysisState["setupState"]["confluence"];
    invalidationReason: string | null;
    expiryReason: string | null;
    dataQuality: string[];
}
export interface ChartAnalysisDigest {
    schemaVersion: typeof CHART_ANALYSIS_DIGEST_SCHEMA_VERSION;
    mode: ChartAnalysisDigestMode;
    symbolOrRedactedAlias: string;
    sourceOrRedactedSource: string;
    requestedAsOf: number;
    effectiveAsOf: number;
    candlePrefixByTimeframe: ChartAnalysisCandlePrefixDigest[];
    candidateMetrics: CandidateMetrics;
    extensionContext: ReplayAnalysisState["extensionContext"];
    stochasticRsiByTimeframe: Record<string, NonNullable<ReplayAnalysisState["indicatorSeries"][string]["stochRsi"]> & {
        configurationHash: string;
    }>;
    structureByTimeframe: Record<string, ReplayAnalysisStructureState>;
    structureEvents: ReplayAnalysisState["structureEvents"];
    activeStructureLevels: DecisionReferenceLevel[];
    supportResistanceZones: ReplayAnalysisState["supportResistanceZones"];
    relativeStrengthState: ReplayAnalysisState["relativeStrength"];
    relativeStrengthEvents: ReplayAnalysisState["relativeStrengthEvents"];
    avwapStates: ReplayAnalysisState["avwapStates"];
    avwapEvents: ReplayAnalysisState["avwapEvents"];
    lifecycleState: ChartAnalysisLifecycleState;
    lifecycleEvidence: ReplayAnalysisState["lifecycleResult"]["evidence"];
    pendingConditions: string[];
    setupState: ChartAnalysisSetupState;
    componentCoverage: Record<string, ReplayAnalysisFreshness>;
    componentFreshness: Record<string, ReplayAnalysisFreshness>;
    dataQualityNotes: DecisionDataQualityNote[];
    profileAndConfigRefs: Record<string, JsonValue>;
    digestFingerprint: string;
}
export interface CreateChartAnalysisDigestInput {
    availability: ChartAnalysisDigestAvailability;
    mode: ChartAnalysisDigestMode;
    state: ReplayAnalysisState;
    candlePrefixesByTimeframe: Readonly<Record<string, readonly ReplayCandleRecord[]>>;
    symbolOrRedactedAlias?: string;
    sourceOrRedactedSource?: string;
    /** Additional pinned references such as replay session, execution, venue, and fee profiles. */
    profileAndConfigRefs: Readonly<Record<string, JsonValue>>;
}
export declare const CHART_ANALYSIS_DISCREPANCY_CLASSES: readonly ["SCHEMA_VERSION_MISMATCH", "MODE_MISMATCH", "IDENTITY_MISMATCH", "DIGEST_FINGERPRINT_MISMATCH", "REQUESTED_ASOF_MISMATCH", "EFFECTIVE_ASOF_MISMATCH", "CANDLE_PREFIX_MISMATCH", "TIMEFRAME_BUCKET_MISMATCH", "REFERENCE_ALIGNMENT_MISMATCH", "PROFILE_CONFIG_MISMATCH", "CANDIDATE_METRIC_MISMATCH", "STOCH_RSI_MISMATCH", "STRUCTURE_STATE_MISMATCH", "STRUCTURE_EVENT_MISMATCH", "ACTIVE_LEVEL_MISMATCH", "SR_ZONE_MISMATCH", "RS_VALUE_MISMATCH", "RS_EVENT_MISMATCH", "AVWAP_VALUE_MISMATCH", "AVWAP_EVENT_MISMATCH", "LIFECYCLE_STATE_MISMATCH", "LIFECYCLE_EVIDENCE_MISMATCH", "SETUP_STATE_MISMATCH", "DATA_QUALITY_MISMATCH", "RENDERING_CONTENT_MISMATCH", "FUTURE_DATA_EXPOSURE", "UNKNOWN"];
export type ChartAnalysisDiscrepancyClass = (typeof CHART_ANALYSIS_DISCREPANCY_CLASSES)[number];
export interface ChartAnalysisDiscrepancy {
    id: string;
    classification: ChartAnalysisDiscrepancyClass;
    path: string;
    liveFingerprint: string;
    replayFingerprint: string;
    message: string;
}
export interface ChartAnalysisComparison {
    schemaVersion: typeof CHART_ANALYSIS_COMPARISON_SCHEMA_VERSION;
    liveDigestFingerprint: string;
    replayDigestFingerprint: string;
    discrepancies: ChartAnalysisDiscrepancy[];
    analyticalParityPassed: boolean;
    comparisonFingerprint: string;
}
export declare function canonicalizeChartAnalysisNumber(value: number, family: ChartAnalysisNumericFamily): number;
export declare function createChartAnalysisDigest(input: CreateChartAnalysisDigestInput): ChartAnalysisDigest;
export declare function chartAnalysisDigestFingerprint(digest: Omit<ChartAnalysisDigest, "digestFingerprint"> | ChartAnalysisDigest): string;
export declare function compareChartAnalysisDigests(live: ChartAnalysisDigest, replay: ChartAnalysisDigest): ChartAnalysisComparison;
