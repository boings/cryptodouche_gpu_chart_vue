import { IMPULSE_FADE_LIFECYCLE_VERSION, type SetupFamily, type SetupStateSnapshot } from "./indicators";
import { type DataQualitySeverity, type StrategyProfile } from "./strategy";
import type { CandleRecord } from "./types";
export declare const RADAR_SELECTION_PROFILE_SCHEMA_VERSION: "radar-selection-profile.1";
export declare const RADAR_EPISODE_SCHEMA_VERSION: "radar-episode.1";
export declare const REPLAY_CASE_MANIFEST_SCHEMA_VERSION: "replay-case-manifest.1";
export declare const RADAR_METRIC_OBSERVATION_SCHEMA_VERSION: "radar-metric-observation.1";
export declare const RADAR_SCAN_RESULT_SCHEMA_VERSION: "radar-scan-result.1";
export declare const RADAR_STATUS_OBSERVATION_SCHEMA_VERSION: "radar-episode-status.1";
export declare const EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION: "execution-venue-eligibility.1";
export type RadarMetricUnit = "percent" | "atr" | "quoteNotional";
export type RadarHardGateCode = "dataQuality" | "liquidity" | "selectedUniverse" | "sourcePolicy" | "executionVenueEligibility";
export type RadarContextTag = "rebound_after_drawdown" | "fresh_high_extension" | "continuation_leg" | "unknown";
export type ExecutionVenueEligibilityStatus = "Available" | "Unavailable" | "Unknown";
export type ExecutionVenuePolicyMode = "requireKnownAvailable" | "allowUnknown" | "ignore" | "rejectKnownUnavailable";
export interface RadarDataQualityNote {
    code: string;
    severity: DataQualitySeverity;
    message: string;
}
export interface RadarDetectorThresholds {
    minimumReturnPct: number | null;
    minimumPercentile: number | null;
    minimumZScore: number | null;
    minimumSampleCount: number;
    historyLookbackSeconds: number;
    maximumReferenceStalenessSeconds: number | null;
}
export interface ElapsedWindowReturnDetector extends RadarDetectorThresholds {
    id: string;
    type: "elapsedWindowReturn";
    windowSeconds: number;
}
export interface RollingTroughRunupDetector {
    id: string;
    type: "rollingTroughRunup";
    lookbackSeconds: number;
    minimumRunupPct: number;
    maximumTroughAgeSeconds: number;
    referenceField: "close";
    minimumPercentile: number | null;
    minimumZScore: number | null;
    minimumSampleCount: number;
    historyLookbackSeconds: number;
}
export interface EmaAtrDisplacementDetector {
    id: string;
    type: "emaAtrDisplacement";
    analysisTimeframe: string;
    emaPeriod: number;
    atrPeriod: number;
    minimumAtrDisplacement: number;
    minimumSampleCount: number;
}
export interface MaximumWindowReturnDetector extends RadarDetectorThresholds {
    id: string;
    type: "maximumWindowReturn";
    windowsSeconds: number[];
}
export type RadarMoveDetector = ElapsedWindowReturnDetector | RollingTroughRunupDetector | EmaAtrDisplacementDetector | MaximumWindowReturnDetector;
export type RadarDetectorCombination = {
    mode: "any";
} | {
    mode: "all";
} | {
    mode: "atLeast";
    count: number;
};
export interface RadarSelectionProfileDefinition {
    schemaVersion: typeof RADAR_SELECTION_PROFILE_SCHEMA_VERSION;
    id: string;
    version: string;
    name: string;
    setupFamily: SetupFamily;
    scanTimeframe: string;
    evaluationCadence: {
        mode: "completedScanCandle";
        everyBars: number;
    };
    moveDetectors: RadarMoveDetector[];
    detectorCombination: RadarDetectorCombination;
    hardGates: RadarHardGateCode[];
    resetPolicy: {
        minimumFalseDurationSeconds: number;
    };
    episodeExpiry: {
        maximumAgeSeconds: number;
    };
    sourcePolicy: {
        allowedSources: string[] | null;
    };
    executionVenuePolicy: {
        intendedVenue: string | null;
        mode: ExecutionVenuePolicyMode;
    };
    liquidityPolicy: {
        minimumQuoteNotional: number | null;
        windowSeconds: number;
        missingData: "fail" | "warn";
    };
    createdAt: number;
}
export interface RadarSelectionProfile extends RadarSelectionProfileDefinition {
    canonicalConfigHash: string;
}
export interface RadarMetricObservation {
    schemaVersion: typeof RADAR_METRIC_OBSERVATION_SCHEMA_VERSION;
    logicalObjectId: string;
    observationId: string;
    metricCode: string;
    metricVersion: string;
    symbol: string;
    source: string;
    dataOrigin: string | null;
    timeframe: string | null;
    requestedAsOf: number;
    effectiveAsOf: number;
    knownAt: number;
    window: number | null;
    referenceTime: number | null;
    referenceValue: number | null;
    value: number | null;
    unit: RadarMetricUnit;
    percentile: number | null;
    zScore: number | null;
    sampleCount: number;
    historyStart: number | null;
    historyEnd: number | null;
    configHash: string;
    inputHash: string;
    dataQualityNotes: RadarDataQualityNote[];
}
export interface RadarSelectionAnchor {
    logicalObjectId: string;
    observationId: string;
    timestamp: number;
    price: number;
    ageSeconds: number;
    referenceField: "close";
    sourceObservationId: string;
}
export interface RadarPathContext {
    net24hReturnPct: number | null;
    net48hReturnPct: number | null;
    triggeringLocalImpulseReturnPct: number | null;
    triggeringDetectorId: string;
    triggeringWindowSeconds: number | null;
    selectionAnchorPrice: number | null;
    selectionAnchorTime: number | null;
    selectionAnchorAgeSeconds: number | null;
    priorPeakPrice: number | null;
    priorPeakTime: number | null;
    priorDrawdownPct: number | null;
    recoveryFraction: number | null;
    currentAtrDisplacement: number | null;
    triggeringPercentile: number | null;
    triggeringZScore: number | null;
    quoteNotional: number | null;
    contextTags: RadarContextTag[];
}
export interface DurableObjectReference {
    logicalObjectId: string;
    observationId: string;
    objectType: string;
    eventTime: number | null;
    knownAt: number;
}
export interface ExecutionVenueEligibilityObservation {
    schemaVersion: typeof EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION;
    logicalObjectId: string;
    observationId: string;
    symbol: string;
    marketDataSource: string;
    executionVenue: string;
    status: ExecutionVenueEligibilityStatus;
    effectiveFrom: number;
    effectiveTo: number | null;
    knownAt: number;
    evidenceSource: string;
    dataQualityNotes: RadarDataQualityNote[];
}
export interface UniverseMembershipObservation {
    logicalObjectId: string;
    observationId: string;
    symbol: string;
    source: string;
    included: boolean;
    effectiveFrom: number;
    effectiveTo: number | null;
    knownAt: number;
}
export interface RadarHardGateResult {
    code: RadarHardGateCode;
    passed: boolean;
    explanation: string;
}
export interface RadarDetectorResult {
    detectorId: string;
    detectorType: RadarMoveDetector["type"];
    passed: boolean;
    observationIds: string[];
    winningObservationId: string | null;
    explanation: string;
}
export interface RadarGateEvaluation {
    id: string;
    symbol: string;
    source: string;
    asOf: number;
    detectorResults: RadarDetectorResult[];
    hardGateResults: RadarHardGateResult[];
    detectorGatePassed: boolean;
    hardGatesPassed: boolean;
    compositePassed: boolean;
}
export interface RadarEpisode {
    id: string;
    logicalObjectId: string;
    observationId: string;
    schemaVersion: typeof RADAR_EPISODE_SCHEMA_VERSION;
    symbol: string;
    source: string;
    setupFamily: SetupFamily;
    selectionProfileId: string;
    selectionProfileVersion: string;
    selectionProfileHash: string;
    detectedAt: number;
    effectiveAsOf: number;
    scanTimeframe: string;
    triggeringDetectorIds: string[];
    triggeringObservations: RadarMetricObservation[];
    contextObservations: RadarMetricObservation[];
    selectionAnchor: RadarSelectionAnchor | null;
    pathContext: RadarPathContext;
    initialLifecycleCandidateId: string | null;
    initialLifecycleCandidateRef: DurableObjectReference | null;
    initialLifecycleState: string | null;
    initialMtfStructure: Record<string, DurableObjectReference>;
    activeUntil: number;
    terminalAt: null;
    terminalReason: null;
    rearmState: "blockedUntilReset";
    executionVenueEligibility: ExecutionVenueEligibilityObservation;
    dataQualityNotes: RadarDataQualityNote[];
}
export interface RadarEpisodeStatusObservation {
    schemaVersion: typeof RADAR_STATUS_OBSERVATION_SCHEMA_VERSION;
    logicalObjectId: string;
    observationId: string;
    episodeId: string;
    asOf: number;
    status: "active" | "expired" | "reset";
    reason: "detected" | "maximumAgeElapsed" | "radarGateReset";
    rearmState: "blockedUntilReset" | "armed";
}
export interface ReplayCaseManifest {
    id: string;
    schemaVersion: typeof REPLAY_CASE_MANIFEST_SCHEMA_VERSION;
    radarEpisodeId: string;
    radarEpisodeObservationId: string;
    symbol: string;
    source: string;
    detectedAt: number;
    startAsOf: number;
    selectionProfileRef: {
        id: string;
        version: string;
        canonicalConfigHash: string;
    };
    lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
    strategyProfileRef: {
        id: string;
        version: string;
        profileHash: string;
    };
    availableTimeframes: string[];
    preRollRequirements: Array<{
        timeframe: string;
        minimumDurationSeconds: number;
        minimumBars: number;
        purposes: string[];
    }>;
    dataCoverageByTimeframe: Record<string, {
        availableStart: number | null;
        availableEnd: number | null;
        completedThrough: number | null;
        completedCandleCount: number;
    }>;
    initialRadarObservations: RadarMetricObservation[];
    initialLifecycleState: string | null;
    executionVenueEligibility: ExecutionVenueEligibilityObservation;
    dataQualityNotes: RadarDataQualityNote[];
    futureOutcomeRef: null;
}
export interface RadarSymbolSeries {
    symbol: string;
    source: string;
    dataOrigin?: string | null;
    candlesByTimeframe: Record<string, readonly CandleRecord[]>;
}
export interface RadarScanInput {
    candlesBySymbolAndTimeframe: Record<string, RadarSymbolSeries>;
    selectionProfile: RadarSelectionProfile;
    from: number;
    to: number;
    strategyProfile?: StrategyProfile;
    lifecycleHistory?: Record<string, readonly SetupStateSnapshot[]>;
    universeHistory?: readonly UniverseMembershipObservation[];
    venueEligibilityHistory?: readonly ExecutionVenueEligibilityObservation[];
}
export interface RadarScanResult {
    schemaVersion: typeof RADAR_SCAN_RESULT_SCHEMA_VERSION;
    selectionProfileRef: {
        id: string;
        version: string;
        canonicalConfigHash: string;
    };
    from: number;
    to: number;
    observations: RadarMetricObservation[];
    gateEvaluations: RadarGateEvaluation[];
    episodes: RadarEpisode[];
    episodeStatusObservations: RadarEpisodeStatusObservation[];
    replayCaseManifests: ReplayCaseManifest[];
}
export declare function radarSelectionProfileHash(profile: RadarSelectionProfileDefinition | RadarSelectionProfile): string;
export declare function createRadarSelectionProfile(definition: RadarSelectionProfileDefinition): RadarSelectionProfile;
export declare const EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE: RadarSelectionProfile;
export declare function scanRadarEpisodes(input: RadarScanInput): RadarScanResult;
export declare function canonicalRadarJson(value: unknown): string;
