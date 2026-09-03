import { type AnchoredVwapSignal, type MarketStructureSummary, type RelativeStrengthDivergence, type SetupStateName, type SetupStateSnapshot } from "./indicators";
import { type ExecutionVenueEligibilityObservation, type RadarEpisode, type RadarPathContext, type RadarSelectionAnchor, type RadarSelectionProfile, type ReplayCaseManifest, type UniverseMembershipObservation } from "./radar";
import { type JsonValue } from "./serialization";
import { type AnchoredVwapDecisionState, type DecisionDataQualityNote, type DecisionReferenceLevel, type RelativeStrengthDecisionState, type StrategyProfile } from "./strategy";
import { type VenueRiskRules } from "./tradePlanning";
import type { CandidateMetrics } from "./types";
export declare const REPLAY_ENGINE_VERSION: "replay-engine.1";
export declare const REPLAY_SESSION_CONFIG_SCHEMA_VERSION: "replay-session-config.1";
export declare const REPLAY_SESSION_SCHEMA_VERSION: "replay-session.1";
export declare const REPLAY_COMMAND_SCHEMA_VERSION: "replay-command.1";
export declare const REPLAY_EVENT_SCHEMA_VERSION: "replay-event.1";
export declare const REPLAY_DECISION_FRAME_SCHEMA_VERSION: "replay-decision-frame.1";
export declare const REPLAY_WAKE_PLAN_SCHEMA_VERSION: "replay-wake-plan.1";
export declare const REPLAY_WAKE_CONDITION_SCHEMA_VERSION: "replay-wake-condition.1";
export declare const REPLAY_WAKE_RESULT_SCHEMA_VERSION: "replay-wake-result.1";
export declare const REPLAY_DATA_BUNDLE_SCHEMA_VERSION: "replay-data-bundle.1";
export declare const REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION: "replay-outcome-envelope.1";
export declare const REPLAY_ANALYSIS_STATE_SCHEMA_VERSION: "replay-analysis-state.1";
export declare const REPLAY_KNOWN_EVENT_SCHEMA_VERSION: "replay-known-event.1";
export type ReplaySessionState = "Created" | "Active" | "TradePlanRecorded" | "Skipped" | "CaseWindowEnded" | "Abandoned" | "Revealed" | "Failed";
export type ReplayTerminalReason = "MAXIMUM_CASE_DURATION" | "DATA_COVERAGE_ENDED" | "RADAR_EPISODE_TERMINAL" | "LIFECYCLE_TERMINAL" | "OTHER";
export type ReplayWaitReason = "waiting_for_structure_break" | "waiting_for_retest" | "waiting_for_avwap_failure" | "waiting_for_rs_weakness" | "waiting_for_stoch_reset" | "waiting_for_higher_timeframe_close" | "insufficient_trade_geometry" | "other";
export type ReplayWakeConditionType = "NextLifecycleTransition" | "LifecycleStateEntered" | "StructureEventConfirmed" | "AvwapEventConfirmed" | "RelativeStrengthEventConfirmed" | "PriceCrossesKnownLevel" | "PriceEntersKnownZone" | "RadarOrLifecycleTerminal" | "AnyOf";
export interface ReplaySessionConfigDefinition {
    id: string;
    version: string;
    schemaVersion: typeof REPLAY_SESSION_CONFIG_SCHEMA_VERSION;
    replayEngineVersion: typeof REPLAY_ENGINE_VERSION;
    evaluationTimeframe?: string;
    visibleTimeframes: string[];
    displayPreRollByTimeframe: Record<string, number>;
    maximumCaseDuration: number;
    maximumSingleWaitDuration: number;
    allowedWakeConditionTypes: ReplayWakeConditionType[];
    defaultWaitDeadline?: number | null;
    completedCandlesOnly: boolean;
    identityPresentationMode?: "full" | "masked" | null;
    allowEarlyReveal: boolean;
    allowOutOfStrategyPlans: boolean;
    allowDiscretionaryOverrides: boolean;
    endOnRadarEpisodeTerminal?: boolean;
    endOnLifecycleTerminal?: boolean;
    strategyProfileRef: ReplayStrategyProfileRef;
    venueRulesRef?: ReplayVersionedReference | null;
}
export interface ReplaySessionConfig extends Omit<ReplaySessionConfigDefinition, "evaluationTimeframe"> {
    evaluationTimeframe: string;
    defaultWaitDeadline: number | null;
    identityPresentationMode: "full" | "masked" | null;
    endOnRadarEpisodeTerminal: boolean;
    endOnLifecycleTerminal: boolean;
    venueRulesRef: ReplayVersionedReference | null;
    canonicalConfigHash: string;
}
export interface ReplayStrategyProfileRef {
    id: string;
    version: string;
    profileHash: string;
}
export interface ReplayVersionedReference {
    id: string;
    version: string;
    hash: string;
}
export interface ReplayCoverageQuery {
    symbol: string;
    source: string;
    timeframe: string;
}
export interface ReplayCandleQuery extends ReplayCoverageQuery {
    from: number;
    to: number;
}
export interface ReplayEvidenceQuery {
    symbol: string;
    source: string;
    from: number;
    to: number;
}
export interface ReplayDataCoverage {
    timeframe: string;
    earliestOpenTime: number | null;
    latestCloseTime: number | null;
    revisionHistoryAvailable: boolean;
}
export interface ReplayCandleRecord {
    logicalCandleId: string;
    observationId: string;
    symbol: string;
    source: string;
    timeframe: string;
    openTime: number;
    closeTime: number;
    o: number;
    h: number;
    l: number;
    c: number;
    vBase: number | null;
    vQuote: number | null;
    knownAt: number;
    revision: number | null;
    correctionPublishedAt: number | null;
}
export interface CreateReplayCandleInput {
    symbol: string;
    source: string;
    timeframe: string;
    openTime: number;
    o: number;
    h: number;
    l: number;
    c: number;
    vBase?: number | null;
    vQuote?: number | null;
    knownAt?: number;
    revision?: number | null;
    correctionPublishedAt?: number | null;
}
export interface ReplayAnalysisStateObservation {
    schemaVersion: typeof REPLAY_ANALYSIS_STATE_SCHEMA_VERSION;
    id: string;
    symbol: string;
    source: string;
    knownAt: number;
    lifecycle: SetupStateSnapshot;
    candidateMetrics: CandidateMetrics | null;
    structureByTimeframe: Record<string, MarketStructureSummary | null>;
    activeStructureLevels: DecisionReferenceLevel[];
    supportResistanceZones: DecisionReferenceLevel[];
    avwapState: AnchoredVwapDecisionState | null;
    avwapEvents: AnchoredVwapSignal[];
    relativeStrengthState: RelativeStrengthDecisionState | null;
    relativeStrengthEvents: RelativeStrengthDivergence[];
    visibleOrSelectedReferenceLevels: DecisionReferenceLevel[];
    dataQualityNotes: DecisionDataQualityNote[];
}
export type ReplayKnownEventKind = "lifecycleTransition" | "structure" | "avwap" | "relativeStrength" | "radarTerminal" | "lifecycleTerminal";
export interface ReplayKnownEvent {
    schemaVersion: typeof REPLAY_KNOWN_EVENT_SCHEMA_VERSION;
    id: string;
    symbol: string;
    source: string;
    kind: ReplayKnownEventKind;
    eventType: string;
    direction: "bullish" | "bearish" | null;
    timeframe: string | null;
    lifecycleState: SetupStateName | null;
    avwapId: string | null;
    eventTime: number;
    knownAt: number;
    detail: {
        [key: string]: JsonValue;
    };
}
export interface ReplayHistoricalDataAdapter {
    getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    loadCandleHistory(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadCandleRevisions?(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadPointInTimeVenueEvidence?(query: ReplayEvidenceQuery): Promise<unknown[]>;
    loadPointInTimeUniverseEvidence?(query: ReplayEvidenceQuery): Promise<unknown[]>;
    loadAnalysisStateHistory?(query: ReplayEvidenceQuery): Promise<ReplayAnalysisStateObservation[]>;
    loadKnownEvents?(query: ReplayEvidenceQuery): Promise<ReplayKnownEvent[]>;
    loadRadarEpisode?(manifestId: string): Promise<RadarEpisode | null>;
}
export interface ReplayDataBundle {
    schemaVersion: typeof REPLAY_DATA_BUNDLE_SCHEMA_VERSION;
    symbol: string;
    source: string;
    analysisStartByTimeframe: Record<string, number>;
    displayStartByTimeframe: Record<string, number>;
    candlesByTimeframe: Record<string, ReplayCandleRecord[]>;
    analysisStateHistory: ReplayAnalysisStateObservation[];
    knownEvents: ReplayKnownEvent[];
    venueEvidence: ExecutionVenueEligibilityObservation[];
    universeEvidence: UniverseMembershipObservation[];
    radarEpisode: RadarEpisode;
    causalPrefixFingerprint: string;
    dataQualityNotes: DecisionDataQualityNote[];
}
export interface ReplayRadarContext {
    radarEpisodeId: string;
    triggeringDetectorIds: string[];
    triggeringObservations: RadarEpisode["triggeringObservations"];
    selectionAnchor: RadarSelectionAnchor | null;
    pathContext: RadarPathContext;
    hardGateResults: RadarEpisode["hardGateResults"];
}
export interface ReplayLoadedCase {
    manifest: ReplayCaseManifest;
    sessionConfig: ReplaySessionConfig;
    strategyProfile: StrategyProfile;
    radarSelectionProfile: RadarSelectionProfile;
    venueRules: VenueRiskRules | null;
    dataBundle: ReplayDataBundle;
}
export interface LoadReplayCaseInput {
    manifest: ReplayCaseManifest;
    sessionConfig: ReplaySessionConfig;
    historicalDataAdapter: ReplayHistoricalDataAdapter;
    strategyProfile: StrategyProfile;
    radarSelectionProfile: RadarSelectionProfile;
    venueRules?: VenueRiskRules | null;
}
export interface InMemoryReplayAdapterInput {
    candles: ReplayCandleRecord[];
    radarEpisodes: RadarEpisode[];
    analysisStateHistory?: ReplayAnalysisStateObservation[];
    knownEvents?: ReplayKnownEvent[];
    venueEvidence?: ExecutionVenueEligibilityObservation[];
    universeEvidence?: UniverseMembershipObservation[];
    revisionHistoryAvailable?: boolean;
}
export declare class InMemoryReplayHistoricalDataAdapter implements ReplayHistoricalDataAdapter {
    #private;
    constructor(input: InMemoryReplayAdapterInput);
    getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    loadCandleHistory(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadCandleRevisions(): Promise<ReplayCandleRecord[]>;
    loadAnalysisStateHistory(query: ReplayEvidenceQuery): Promise<ReplayAnalysisStateObservation[]>;
    loadKnownEvents(query: ReplayEvidenceQuery): Promise<ReplayKnownEvent[]>;
    loadPointInTimeVenueEvidence(query: ReplayEvidenceQuery): Promise<ExecutionVenueEligibilityObservation[]>;
    loadPointInTimeUniverseEvidence(query: ReplayEvidenceQuery): Promise<UniverseMembershipObservation[]>;
    loadRadarEpisode(manifestId: string): Promise<RadarEpisode | null>;
}
export declare function replaySessionConfigHash(config: ReplaySessionConfig | ReplaySessionConfigDefinition): string;
export declare function createReplaySessionConfig(definition: ReplaySessionConfigDefinition, strategyProfile: StrategyProfile): ReplaySessionConfig;
export declare function createDefaultReplaySessionConfig(strategyProfile: StrategyProfile): ReplaySessionConfig;
export declare function replayCandleLogicalId(input: {
    symbol: string;
    source: string;
    timeframe: string;
    openTime: number;
}): string;
export declare function replayCandleObservationId(candle: ReplayCandleRecord | Omit<ReplayCandleRecord, "observationId">): string;
export declare function createReplayCandleRecord(input: CreateReplayCandleInput): ReplayCandleRecord;
export type CreateReplayAnalysisStateInput = Omit<ReplayAnalysisStateObservation, "schemaVersion" | "id">;
export declare function replayAnalysisStateObservationId(observation: ReplayAnalysisStateObservation | Omit<ReplayAnalysisStateObservation, "id">): string;
export declare function createReplayAnalysisStateObservation(input: CreateReplayAnalysisStateInput): ReplayAnalysisStateObservation;
export type CreateReplayKnownEventInput = Omit<ReplayKnownEvent, "schemaVersion" | "id">;
export declare function replayKnownEventId(event: ReplayKnownEvent | Omit<ReplayKnownEvent, "id">): string;
export declare function createReplayKnownEvent(input: CreateReplayKnownEventInput): ReplayKnownEvent;
export declare function loadReplayCase(input: LoadReplayCaseInput): Promise<ReplayLoadedCase>;
export declare function replayDataFingerprintAt(loaded: ReplayLoadedCase, asOf: number): Promise<string>;
export declare function replaySha256(value: unknown): Promise<string>;
