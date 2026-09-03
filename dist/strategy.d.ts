import { IMPULSE_FADE_LIFECYCLE_VERSION, type AnchoredVwapSignal, type MarketStructureSummary, type RelativeStrengthDivergence, type SetupCandidateEpisode, type SetupFamily, type SetupStateEvidence, type SetupStateName, type SetupStateSnapshot } from "./indicators";
import { type JsonValue } from "./serialization";
import type { CandidateMetrics } from "./types";
export declare const STRATEGY_PROFILE_SCHEMA_VERSION: "strategy-profile.1";
export declare const DECISION_SNAPSHOT_SCHEMA_VERSION: "decision-snapshot.1";
export declare const IMPULSE_FADE_RESEARCH_PROFILE_ID: "impulse_fade_v1.research.default";
export declare const IMPULSE_FADE_RESEARCH_PROFILE_VERSION: "1";
export type StrategySide = "short";
export type EntryOrderPlanType = "marketNextAvailable" | "limit" | "stopMarket" | "manualReference";
export type StrategyFactorRole = "hardGate" | "contextualConfluence" | "informational";
export interface StrategyTimeframeRoles {
    candidateTimeframe: string;
    structureTimeframe: string;
    executionTimeframe: string;
    triggerTimeframe: string | null;
    contextTimeframes: string[];
}
export interface StrategyEntryPolicy {
    eligibleLifecycleStates: SetupStateName[];
    retestRequired: boolean;
    confirmedRejectionRequired: boolean;
    permittedOrderPlanTypes: EntryOrderPlanType[];
    maxAgeSinceEntryCandidateSeconds: number | null;
    minimumRewardRisk: number | null;
    requiredDataQuality: {
        candidateMetricsRequired: boolean;
        minimumHistoryCoverageRatio: number | null;
        rejectedNoteSeverities: DataQualitySeverity[];
    };
    factors: Record<StrategyFactorRole, string[]>;
}
export interface StrategyStopPolicy {
    permittedDerivations: StopDerivationType[];
    requireOutsideEpisodeHigh: boolean;
}
export interface StrategyTargetPolicy {
    permittedDerivations: TargetDerivationType[];
    maximumTargets: number;
    fractionTolerance: number;
}
export interface StrategyRiskPolicy {
    maximumAccountRiskFraction: number;
    maximumMarginAllocationFraction: number;
    maximumNotional: number | null;
}
export interface StrategyExecutionAssumptions {
    entryFeeRate: number;
    stopExitFeeRate: number;
    targetExitFeeRate: number;
    adverseEntrySlippageBps: number;
    adverseStopSlippageBps: number;
    adverseTargetSlippageBps: number;
}
export interface StrategyProfileDefinition {
    schemaVersion: typeof STRATEGY_PROFILE_SCHEMA_VERSION;
    id: string;
    version: string;
    name: string;
    setupFamily: SetupFamily;
    lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
    lifecycleConfigHash: string;
    side: StrategySide;
    timeframeRoles: StrategyTimeframeRoles;
    entryPolicy: StrategyEntryPolicy;
    stopPolicy: StrategyStopPolicy;
    targetPolicy: StrategyTargetPolicy;
    riskPolicy: StrategyRiskPolicy;
    executionAssumptions: StrategyExecutionAssumptions;
    createdAt: number;
}
export interface StrategyProfile extends StrategyProfileDefinition {
    profileHash: string;
}
export type StopDerivationType = "episodeHigh" | "structuralInvalidation" | "supportResistanceZoneBoundary" | "avwapReference" | "manual";
export type TargetDerivationType = "supportZone" | "avwap" | "preImpulseBase" | "fixedRMultiple" | "manual";
export type DecisionReferenceKind = "swing" | "structureLevel" | "supportZone" | "resistanceZone" | "avwap" | "candidateEpisodeHigh" | "preImpulseBase" | "manual";
export interface DecisionReferenceSource {
    objectType: string;
    objectId: string;
    snapshot: {
        [key: string]: JsonValue;
    };
}
export interface DecisionReferenceLevel {
    id: string;
    kind: DecisionReferenceKind;
    price: number;
    rangeLow: number | null;
    rangeHigh: number | null;
    sourceTimeframe: string | null;
    eventTime: number;
    knownAt: number;
    sourceObject: DecisionReferenceSource;
}
export interface AnchoredVwapDecisionState {
    reference: DecisionReferenceLevel;
    distancePct: number | null;
    anchorReason: string | null;
    eventTime: number;
    knownAt: number;
}
export interface RelativeStrengthDecisionState {
    referenceSymbol: string;
    normalized: boolean;
    value: number | null;
    structure: MarketStructureSummary | null;
    eventTime: number;
    knownAt: number;
}
export type DataQualitySeverity = "info" | "warning" | "error";
export interface DecisionDataQualityNote {
    code: string;
    severity: DataQualitySeverity;
    message: string;
}
export interface DecisionSnapshot {
    snapshotSchemaVersion: typeof DECISION_SNAPSHOT_SCHEMA_VERSION;
    id: string;
    symbol: string;
    source: string;
    decisionTime: number;
    effectiveAsOf: number;
    setupFamily: SetupFamily;
    lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
    lifecycleConfigHash: string;
    strategyProfileId: string;
    strategyProfileVersion: string;
    strategyProfileHash: string;
    candidateEpisode: SetupCandidateEpisode | null;
    activeCandidateId: string | null;
    lifecycleState: SetupStateName;
    lifecycleStateSince: number | null;
    lifecycleEvidence: SetupStateEvidence[];
    pendingConditions: string[];
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
export interface DecisionSnapshotInput {
    symbol: string;
    source: string;
    decisionTime: number;
    effectiveAsOf: number;
    strategyProfile: StrategyProfile;
    lifecycle: SetupStateSnapshot;
    candidateMetrics: CandidateMetrics | null;
    structureByTimeframe: Readonly<Record<string, MarketStructureSummary | null>>;
    activeStructureLevels: readonly DecisionReferenceLevel[];
    supportResistanceZones: readonly DecisionReferenceLevel[];
    avwapState: AnchoredVwapDecisionState | null;
    avwapEvents: readonly AnchoredVwapSignal[];
    relativeStrengthState: RelativeStrengthDecisionState | null;
    relativeStrengthEvents: readonly RelativeStrengthDivergence[];
    visibleOrSelectedReferenceLevels: readonly DecisionReferenceLevel[];
    dataQualityNotes: readonly DecisionDataQualityNote[];
}
export interface CreateDecisionReferenceLevelInput {
    id: string;
    kind: DecisionReferenceKind;
    price: number;
    rangeLow?: number | null;
    rangeHigh?: number | null;
    sourceTimeframe?: string | null;
    eventTime: number;
    knownAt: number;
    sourceObject: DecisionReferenceSource;
}
export declare function strategyProfileHash(profile: StrategyProfile | StrategyProfileDefinition): string;
export declare function createStrategyProfile(definition: StrategyProfileDefinition): StrategyProfile;
export interface ImpulseFadeResearchProfileOverrides {
    id?: string;
    version?: string;
    name?: string;
    lifecycleConfigHash?: string;
    timeframeRoles?: Partial<StrategyTimeframeRoles>;
    entryPolicy?: Partial<Omit<StrategyEntryPolicy, "requiredDataQuality" | "factors">> & {
        requiredDataQuality?: Partial<StrategyEntryPolicy["requiredDataQuality"]>;
        factors?: Partial<StrategyEntryPolicy["factors"]>;
    };
    stopPolicy?: Partial<StrategyStopPolicy>;
    targetPolicy?: Partial<StrategyTargetPolicy>;
    riskPolicy?: Partial<StrategyRiskPolicy>;
    executionAssumptions?: Partial<StrategyExecutionAssumptions>;
    createdAt?: number;
}
export declare function createImpulseFadeResearchProfile(overrides?: ImpulseFadeResearchProfileOverrides): StrategyProfile;
export declare const DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE: StrategyProfile;
export declare function createDecisionReferenceLevel(input: CreateDecisionReferenceLevelInput): DecisionReferenceLevel;
export declare function createDecisionSnapshot(input: DecisionSnapshotInput): DecisionSnapshot;
export declare function decisionSnapshotId(snapshot: DecisionSnapshot | Omit<DecisionSnapshot, "id">): string;
export declare function decisionSnapshotReferenceLevels(snapshot: DecisionSnapshot): DecisionReferenceLevel[];
