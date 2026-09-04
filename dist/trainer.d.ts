import type { ExecutionProfile, FundingObservation, VenueExecutionRules } from "./execution";
import type { RadarSelectionProfile, ReplayCaseManifest } from "./radar";
import type { ReplayAnalysisProfile } from "./replayAnalysis";
import type { ReplaySessionConfig } from "./replay";
import type { ReplaySession } from "./replaySession";
import { type JsonValue } from "./serialization";
import type { StrategyProfile } from "./strategy";
import type { AccountState, LeveragePolicy, RiskRequest, TradePlan } from "./tradePlanning";
export declare const TRAINER_UI_VERSION: "trainer-ui.1";
export declare const TRAINER_WORKER_PROTOCOL_VERSION: "trainer-worker-protocol.1";
export declare const TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION: "trainer-presentation-profile.1";
export declare const TRAINER_STUDY_RUN_SCHEMA_VERSION: "trainer-study-run.1";
export declare const TRAINER_STUDY_CASE_SCHEMA_VERSION: "trainer-study-case.1";
export declare const TRAINER_CASE_BUNDLE_SCHEMA_VERSION: "trainer-case-bundle.1";
export declare const TRAINER_PUBLIC_FRAME_SCHEMA_VERSION: "trainer-public-frame.1";
export declare const TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION: "trainer-analysis-action.1";
export declare const TRAINER_REVIEW_RECORD_SCHEMA_VERSION: "trainer-review-record.1";
export declare const TRAINER_LOCAL_STORE_SCHEMA_VERSION: "trainer-local-store.1";
export declare const TRAINER_CORPUS_INDEX_SCHEMA_VERSION: "trainer-corpus-index.1";
export interface TrainerVersionedRef {
    id: string;
    version: string;
    hash: string;
}
export interface TrainerSafeCaseDescriptor {
    id: string;
    alias: string;
    episodeAlias: string;
    replayCaseManifestId: string;
    radarEpisodeId: string;
    radarSelectionProfileRef: TrainerVersionedRef;
    detectedAt: number;
    symbol: string;
    source: string;
    scanTimeframe: string;
    triggerDetectorIds: string[];
    dataQualityStatus: "complete" | "warning" | "error";
    venueEligibility: "eligible" | "ineligible" | "unknown";
    selectionMetrics: Record<string, number | string | boolean | null>;
    pathContextTags: string[];
}
export type TrainerSafeCaseDescriptorPublic = Omit<TrainerSafeCaseDescriptor, "detectedAt" | "symbol" | "source"> & {
    detectedAt: number | null;
    symbol: string | null;
    source: string | null;
};
export interface TrainerCorpusIndex {
    schemaVersion: typeof TRAINER_CORPUS_INDEX_SCHEMA_VERSION;
    id: string;
    fingerprint: string;
    cases: TrainerSafeCaseDescriptor[];
}
export interface TrainerBundleProvenance {
    producer: string;
    createdAt: number;
    sourceDescription: string;
    license?: string | null;
}
export interface TrainerCaseBundle {
    schemaVersion: typeof TRAINER_CASE_BUNDLE_SCHEMA_VERSION;
    bundleId: string;
    bundleFingerprint: string;
    safeDescriptor: TrainerSafeCaseDescriptor;
    replayCaseManifest: ReplayCaseManifest;
    replayAnalysisData: JsonValue;
    replayFutureData: JsonValue;
    executionData?: JsonValue;
    radarSelectionProfile: RadarSelectionProfile;
    strategyProfile: StrategyProfile;
    replayAnalysisProfile: ReplayAnalysisProfile;
    replaySessionConfig: ReplaySessionConfig;
    executionProfile?: ExecutionProfile;
    venueExecutionRules?: VenueExecutionRules;
    feeSchedule?: JsonValue;
    fundingObservations?: FundingObservation[];
    provenance: TrainerBundleProvenance;
    dataQualityNotes: string[];
}
export type CreateTrainerCaseBundleInput = Omit<TrainerCaseBundle, "bundleFingerprint">;
export interface TrainerPresentationProfileDefinition {
    id: string;
    version: string;
    schemaVersion: typeof TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION;
    layout: "one" | "four";
    paneTimeframes: string[];
    blindModeDefaults: boolean;
    overlayPreset: string;
    showSymbol: boolean;
    showDate: boolean;
    showSource: boolean;
    showVenue: boolean;
    showAbsoluteClock: boolean;
    showRelativeClock: boolean;
    chartControlDefaults: Record<string, JsonValue>;
}
export interface TrainerPresentationProfile extends TrainerPresentationProfileDefinition {
    canonicalConfigHash: string;
}
export interface TrainerStudyCase {
    schemaVersion: typeof TRAINER_STUDY_CASE_SCHEMA_VERSION;
    id: string;
    studyRunId: string;
    caseId: string;
    replayCaseManifestId: string;
    radarEpisodeId: string;
    bundleFingerprint: string;
    state: "pending" | "active" | "completed" | "skipped" | "abandoned" | "revealed";
    replaySessionId: string | null;
    decisionRecordIds: string[];
    analysisActionIds: string[];
    tradePlanId: string | null;
    reviewRecordId: string | null;
}
export interface TrainerStudyRunDefinition {
    id: string;
    name?: string | null;
    createdAt: number;
    startedAt?: number | null;
    completedAt?: number | null;
    radarSelectionProfileRef: TrainerVersionedRef;
    strategyProfileRef: TrainerVersionedRef;
    replayAnalysisProfileRef: TrainerVersionedRef;
    replaySessionConfigRef: TrainerVersionedRef;
    executionProfileRef?: TrainerVersionedRef | null;
    selectionSeed: string;
    requestedCaseCount: number;
    selectedCaseIds: string[];
    currentCaseIndex: number;
    blindMode: boolean;
    presentationProfileRef: TrainerVersionedRef;
    accountPreset: AccountState;
    defaultRiskRequest: RiskRequest;
    defaultLeveragePolicy: LeveragePolicy;
    completedCases: string[];
    skippedCases: string[];
    abandonedCases: string[];
    state: "created" | "active" | "paused" | "completed" | "closed";
}
export interface TrainerStudyRun extends TrainerStudyRunDefinition {
    schemaVersion: typeof TRAINER_STUDY_RUN_SCHEMA_VERSION;
    trainerVersion: typeof TRAINER_UI_VERSION;
    canonicalConfigHash: string;
}
export interface TrainerCaseSelectionFilters {
    radarSelectionProfileId?: string;
    triggerDetectorId?: string;
    scanTimeframe?: string;
    source?: string;
    dataQualityStatus?: TrainerSafeCaseDescriptor["dataQualityStatus"];
    venueEligibility?: TrainerSafeCaseDescriptor["venueEligibility"];
    pathContextTag?: string;
    minimumSelectionMetric?: {
        key: string;
        value: number;
    };
    maximumSelectionMetric?: {
        key: string;
        value: number;
    };
}
export type TrainerAnalysisAction = {
    schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
    id: string;
    type: "SetManualAvwapAnchor";
    sessionId: string;
    frameId: string;
    selectedAt: number;
    anchor: {
        id: string;
        label: string;
        kind: "manualPumpOrigin" | "manualBreakout" | "manualStructural";
        timeframe: string;
        candleObservationId: string;
        candleRevision: number | null;
        anchorTime: number;
        anchorPrice: number;
        knownAt: number;
    };
} | {
    schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
    id: string;
    type: "RemoveManualAvwapAnchor";
    sessionId: string;
    frameId: string;
    selectedAt: number;
    anchorId: string;
} | {
    schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
    id: string;
    type: "UpdateManualAvwapAnchorLabel";
    sessionId: string;
    frameId: string;
    selectedAt: number;
    anchorId: string;
    label: string;
};
export interface TrainerReviewRecordDefinition {
    id: string;
    studyRunId: string;
    trainerSessionId: string;
    replayFrameId: string;
    decisionRecordId?: string | null;
    tradePlanId?: string | null;
    executionResultId?: string | null;
    reviewedAt: number;
    decisionQualityRating?: number | null;
    processFollowed?: boolean | null;
    confidenceAfterReview?: number | null;
    thesisReview?: string | null;
    whatWasObserved?: string | null;
    whatWasMissed?: string | null;
    whatWouldBeRepeated?: string | null;
    whatWouldBeChanged?: string | null;
    tags: string[];
    notes?: string | null;
}
export interface TrainerReviewRecord extends TrainerReviewRecordDefinition {
    schemaVersion: typeof TRAINER_REVIEW_RECORD_SCHEMA_VERSION;
}
export interface TrainerPublicFrame {
    schemaVersion: typeof TRAINER_PUBLIC_FRAME_SCHEMA_VERSION;
    revision: number;
    studyRunId: string;
    studyCaseId: string;
    caseAlias: string;
    effectiveAsOf: number;
    identity: {
        symbol: string;
        source: string;
        detectedAt: number;
    } | null;
    replaySession: ReplaySession;
    visibleCandlesByTimeframe: ReplaySession["frames"][number]["visibleCandlesByTimeframe"];
    currentFrame: ReplaySession["frames"][number];
    analysisActions: TrainerAnalysisAction[];
    tradePlan: TradePlan | null;
    revealedOutcome: JsonValue | null;
}
export declare function createTrainerCaseBundle(input: CreateTrainerCaseBundleInput): TrainerCaseBundle;
export declare function trainerCaseBundleFingerprint(bundle: Omit<TrainerCaseBundle, "bundleFingerprint"> | TrainerCaseBundle): string;
export declare function validateTrainerCaseBundle(input: unknown): asserts input is TrainerCaseBundle;
export declare function createTrainerCorpusIndex(id: string, cases: TrainerSafeCaseDescriptor[]): {
    fingerprint: string;
    schemaVersion: "trainer-corpus-index.1";
    id: string;
    cases: TrainerSafeCaseDescriptor[];
};
export declare function selectTrainerCases(corpus: TrainerCorpusIndex, seed: string, count: number, filters?: TrainerCaseSelectionFilters): TrainerSafeCaseDescriptor[];
export declare function redactTrainerSafeDescriptor(descriptor: TrainerSafeCaseDescriptor, blindMode: boolean, revealed?: boolean): TrainerSafeCaseDescriptorPublic;
export declare function createTrainerPresentationProfile(definition: TrainerPresentationProfileDefinition): TrainerPresentationProfile;
export declare function createTrainerStudyRun(definition: TrainerStudyRunDefinition): TrainerStudyRun;
export declare function createTrainerReviewRecord(definition: TrainerReviewRecordDefinition): TrainerReviewRecord;
