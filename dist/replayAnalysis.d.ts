import { computeAnchoredVwapSnapshot, computeExtensionSnapshot, type AnchoredVwapSignal, type ExtensionSnapshotOptions, type ImpulseFadeTimelineConfig, type MarketStructureOptions, type MarketStructureState, type RelativeStrengthDivergence, type RelativeStrengthDivergenceOptions, type SetupStateSnapshot, type SupportResistanceZone, type SupportResistanceZoneFromSwingsOptions } from "./indicators";
import type { RadarEpisode, RadarSelectionProfile } from "./radar";
import { type AnchoredVwapDecisionState, type DecisionDataQualityNote, type DecisionReferenceLevel, type RelativeStrengthDecisionState, type StrategyProfile } from "./strategy";
import { type ReplayCandleRecord } from "./replay";
import type { CandidateMetrics } from "./types";
export declare const MATERIALIZED_REPLAY_ENGINE_VERSION: "replay-engine.2";
export declare const REPLAY_ANALYSIS_ENGINE_VERSION: "replay-analysis-engine.1";
export declare const REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION: "replay-analysis-profile.1";
export declare const MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION: "replay-analysis-state.2";
export declare const REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION: "replay-analysis-observation.1";
export declare const REPLAY_ANALYSIS_FRAME_SCHEMA_VERSION: "replay-analysis-frame.1";
export declare const REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION: "replay-analysis-data-bundle.1";
export declare const AVWAP_ANCHOR_SCHEMA_VERSION: "avwap-anchor-spec.1";
export declare const RELATIVE_STRENGTH_FORMULA_VERSION: "relative-ratio.1";
export type ReplayAnalysisComponentStatus = "available" | "insufficientHistory" | "missingSynchronizedReferenceData" | "unavailable";
export interface ReplayAnalysisFreshness {
    component: string;
    evaluatedAt: number;
    latestInputCloseTime: number | null;
    latestInputKnownAt: number | null;
    status: ReplayAnalysisComponentStatus;
    sampleCount: number;
    requiredCoverage: number | null;
    availableCoverage: number | null;
    sourceObservationIds: string[];
    configurationHash: string;
}
export interface ReplayAnalysisProfileDefinition {
    id: string;
    version: string;
    schemaVersion: typeof REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION;
    analysisEngineVersion: typeof REPLAY_ANALYSIS_ENGINE_VERSION;
    symbolSourcePolicy: {
        marketType: string;
        requireConfiguredSource: boolean;
    };
    referenceMarketPolicy: {
        symbol: string;
        source: string | null;
        requireExactCompletedCloseAlignment: boolean;
        allowForwardFill: boolean;
    };
    evaluatedTimeframes: string[];
    executionTimeframe: string;
    contextTimeframes: string[];
    extensionConfig: Required<ExtensionSnapshotOptions>;
    stochasticRsiConfig: {
        timeframe: string;
        rsiPeriod: number;
        stochPeriod: number;
        kPeriod: number;
        dPeriod: number;
    };
    structureConfig: Required<MarketStructureOptions>;
    supportResistanceConfig: Required<SupportResistanceZoneFromSwingsOptions>;
    relativeStrengthConfig: Required<RelativeStrengthDivergenceOptions> & {
        timeframe: string;
        formulaVersion: typeof RELATIVE_STRENGTH_FORMULA_VERSION;
    };
    avwapConfig: {
        maxSignals: number;
        priceBasis: "typical";
        volumeBasis: "baseThenQuote";
    };
    lifecycleConfigRef: {
        version: string;
        configHash: string;
    };
    completedCandlesOnly: true;
    missingDataPolicy: "componentUnavailable";
    alignmentPolicy: "exactCompletedClose";
    correctionPolicy: "latestKnownRevisionAtCutoff";
}
export interface ReplayAnalysisProfile extends ReplayAnalysisProfileDefinition {
    canonicalConfigHash: string;
}
export interface AvwapAnchorSpec {
    id: string;
    schemaVersion: typeof AVWAP_ANCHOR_SCHEMA_VERSION;
    type: "manual" | "radarSelection" | "structureBreak" | "swing" | "manifest";
    symbol: string;
    source: string;
    timeframe: string;
    anchorCandleLogicalId: string;
    anchorCandleObservationId: string;
    anchorTime: number;
    priceBasis: "typical";
    volumeBasis: "baseThenQuote";
    selectedAt: number;
    knownAt: number;
    provenance: string;
}
export interface ReplayAnalysisLinePoint {
    x: number;
    value: number;
}
export interface ReplayAnalysisObservation<T> {
    schemaVersion: typeof REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION;
    logicalId: string;
    observationId: string;
    component: string;
    timeframe: string;
    eventTime: number;
    knownAt: number;
    evaluatedAt: number;
    configurationHash: string;
    sourceObservationIds: string[];
    value: T;
}
export interface ReplayAnalysisStructureState {
    timeframe: string;
    observation: ReplayAnalysisObservation<MarketStructureState>;
}
export interface ReplayAnalysisZoneValue extends SupportResistanceZone {
    originatingSwingIds: string[];
}
export interface ReplayAnalysisRelativeStrength {
    targetSymbol: string;
    targetSource: string;
    referenceSymbol: string;
    referenceSource: string;
    formulaVersion: typeof RELATIVE_STRENGTH_FORMULA_VERSION;
    normalizationAnchor: {
        targetObservationId: string;
        referenceObservationId: string;
        closeTime: number;
    } | null;
    series: ReplayAnalysisLinePoint[];
    structure: MarketStructureState | null;
    status: ReplayAnalysisComponentStatus;
}
export interface ReplayAnalysisAvwapState {
    anchor: AvwapAnchorSpec;
    series: ReplayAnalysisLinePoint[];
    snapshot: ReturnType<typeof computeAnchoredVwapSnapshot>;
    observation: ReplayAnalysisObservation<ReturnType<typeof computeAnchoredVwapSnapshot>>;
}
export interface ReplayAnalysisState {
    id: string;
    schemaVersion: typeof MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION;
    replayEngineVersion: typeof MATERIALIZED_REPLAY_ENGINE_VERSION;
    analysisEngineVersion: typeof REPLAY_ANALYSIS_ENGINE_VERSION;
    symbol: string;
    source: string;
    requestedAsOf: number;
    effectiveAsOf: number;
    analysisProfileRef: {
        id: string;
        version: string;
        hash: string;
    };
    lifecycleConfigRef: {
        version: string;
        configHash: string;
    };
    radarProfileRef: {
        id: string;
        version: string;
        hash: string;
    };
    strategyProfileRef: {
        id: string;
        version: string;
        hash: string;
    };
    referenceMarket: {
        symbol: string;
        source: string;
    };
    dataBundleFingerprint: string;
    candidateMetrics: CandidateMetrics;
    extensionContext: Record<string, ReturnType<typeof computeExtensionSnapshot>>;
    indicatorSeries: Record<string, {
        ema: ReplayAnalysisLinePoint[];
        atr: ReplayAnalysisLinePoint[];
        stochRsi: {
            k: ReplayAnalysisLinePoint[];
            d: ReplayAnalysisLinePoint[];
        } | null;
        configurationHash: string;
    }>;
    structureByTimeframe: Record<string, ReplayAnalysisStructureState>;
    structureEvents: ReplayAnalysisObservation<MarketStructureState["breaks"][number]>[];
    activeStructureLevels: DecisionReferenceLevel[];
    supportResistanceZones: ReplayAnalysisObservation<ReplayAnalysisZoneValue>[];
    relativeStrength: ReplayAnalysisRelativeStrength;
    relativeStrengthEvents: ReplayAnalysisObservation<RelativeStrengthDivergence>[];
    avwapStates: ReplayAnalysisAvwapState[];
    avwapEvents: ReplayAnalysisObservation<AnchoredVwapSignal>[];
    lifecycleResult: SetupStateSnapshot;
    setupState: SetupStateSnapshot;
    coverageByComponent: Record<string, ReplayAnalysisFreshness>;
    freshnessByComponent: Record<string, ReplayAnalysisFreshness>;
    dataQualityNotes: DecisionDataQualityNote[];
}
export interface MaterializeReplayAnalysisInput {
    symbol: string;
    source: string;
    asOf: number;
    candlesByTimeframe: Record<string, ReplayCandleRecord[]>;
    referenceCandlesByTimeframe: Record<string, ReplayCandleRecord[]>;
    avwapAnchors?: AvwapAnchorSpec[];
    radarEpisode: RadarEpisode;
    radarSelectionProfile: RadarSelectionProfile;
    strategyProfile: StrategyProfile;
    analysisProfile: ReplayAnalysisProfile;
    lifecycleConfig?: ImpulseFadeTimelineConfig;
    /**
     * Replay timelines retain decision objects and event provenance but do not
     * need chart-rendering line arrays for every historical evaluation point.
     */
    includeIndicatorSeries?: boolean;
    /** Keep verbose source-id arrays and line series in the returned state. */
    includeComponentProvenance?: boolean;
}
export declare function replayAnalysisProfileHash(profile: ReplayAnalysisProfile | ReplayAnalysisProfileDefinition): string;
export declare function createReplayAnalysisProfile(definition: ReplayAnalysisProfileDefinition, strategyProfile?: StrategyProfile): ReplayAnalysisProfile;
export declare function createExperimentalReplayAnalysisProfile(strategyProfile: StrategyProfile, overrides?: Partial<ReplayAnalysisProfileDefinition>): ReplayAnalysisProfile;
export declare function materializeReplayAnalysis(input: MaterializeReplayAnalysisInput): ReplayAnalysisState;
export declare function effectiveReplayAnalysisAsOf(input: MaterializeReplayAnalysisInput): number;
export declare function selectReplayRecordsAt(records: readonly ReplayCandleRecord[], asOf: number): ReplayCandleRecord[];
export declare function createAvwapAnchorSpec(input: Omit<AvwapAnchorSpec, "schemaVersion">): AvwapAnchorSpec;
export declare function replayAnalysisAvwapDecisionState(state: ReplayAnalysisState): AnchoredVwapDecisionState | null;
export declare function replayAnalysisRelativeStrengthDecisionState(state: ReplayAnalysisState): RelativeStrengthDecisionState | null;
export declare function replayAnalysisSupportResistanceReferences(state: ReplayAnalysisState): DecisionReferenceLevel[];
