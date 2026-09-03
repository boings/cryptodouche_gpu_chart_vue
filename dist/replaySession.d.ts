import { type DecisionDataQualityNote, type DecisionSnapshot } from "./strategy";
import { type CreateTradePlanInput, type DecisionRecord, type SkipReasonCode, type TradePlan } from "./tradePlanning";
import { REPLAY_COMMAND_SCHEMA_VERSION, REPLAY_DECISION_FRAME_SCHEMA_VERSION, REPLAY_ENGINE_VERSION, REPLAY_EVENT_SCHEMA_VERSION, REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION, REPLAY_SESSION_SCHEMA_VERSION, REPLAY_WAKE_CONDITION_SCHEMA_VERSION, REPLAY_WAKE_PLAN_SCHEMA_VERSION, REPLAY_WAKE_RESULT_SCHEMA_VERSION, type ReplayCandleRecord, type ReplayLoadedCase, type ReplayRadarContext, type ReplaySessionState, type ReplayTerminalReason, type ReplayWaitReason, type ReplayWakeConditionType } from "./replay";
import { type JsonValue } from "./serialization";
import type { SetupStateName } from "./indicators";
export type ReplayStructureEventType = "BOS" | "Shift" | string;
export type ReplayAvwapEventType = "loss" | "reclaim" | "failedReclaim" | string;
export type ReplayRelativeStrengthEventType = "divergence" | "lead" | "break" | string;
interface ReplayWakeConditionBase {
    schemaVersion: typeof REPLAY_WAKE_CONDITION_SCHEMA_VERSION;
    id: string;
    type: ReplayWakeConditionType;
}
export type ReplayWakeCondition = (ReplayWakeConditionBase & {
    type: "NextLifecycleTransition";
}) | (ReplayWakeConditionBase & {
    type: "LifecycleStateEntered";
    state: SetupStateName;
}) | (ReplayWakeConditionBase & {
    type: "StructureEventConfirmed";
    timeframe: string;
    eventType: ReplayStructureEventType;
    direction: "bullish" | "bearish";
}) | (ReplayWakeConditionBase & {
    type: "AvwapEventConfirmed";
    avwapId: string | null;
    eventType: ReplayAvwapEventType;
}) | (ReplayWakeConditionBase & {
    type: "RelativeStrengthEventConfirmed";
    timeframe: string | null;
    eventType: ReplayRelativeStrengthEventType;
}) | (ReplayWakeConditionBase & {
    type: "PriceCrossesKnownLevel";
    timeframe: string;
    direction: "above" | "below";
    referenceId: string;
    frozenPrice: number;
}) | (ReplayWakeConditionBase & {
    type: "PriceEntersKnownZone";
    timeframe: string;
    zoneObservationId: string;
    frozenLowerBound: number;
    frozenUpperBound: number;
}) | (ReplayWakeConditionBase & {
    type: "RadarOrLifecycleTerminal";
}) | (ReplayWakeConditionBase & {
    type: "AnyOf";
    conditions: ReplayWakeCondition[];
});
export type CreateReplayWakeConditionInput = {
    type: "NextLifecycleTransition";
} | {
    type: "LifecycleStateEntered";
    state: SetupStateName;
} | {
    type: "StructureEventConfirmed";
    timeframe: string;
    eventType: ReplayStructureEventType;
    direction: "bullish" | "bearish";
} | {
    type: "AvwapEventConfirmed";
    avwapId?: string | null;
    eventType: ReplayAvwapEventType;
} | {
    type: "RelativeStrengthEventConfirmed";
    timeframe?: string | null;
    eventType: ReplayRelativeStrengthEventType;
} | {
    type: "PriceCrossesKnownLevel";
    timeframe: string;
    direction: "above" | "below";
    referenceId: string;
    frozenPrice: number;
} | {
    type: "PriceEntersKnownZone";
    timeframe: string;
    zoneObservationId: string;
    frozenLowerBound: number;
    frozenUpperBound: number;
} | {
    type: "RadarOrLifecycleTerminal";
} | {
    type: "AnyOf";
    conditions: CreateReplayWakeConditionInput[];
};
export type ReplayScheduledReview = {
    mode: "nextCompletedCandle";
    timeframe: string;
} | {
    mode: "elapsedDuration";
    durationSeconds: number;
};
export interface ReplayWakePlan {
    schemaVersion: typeof REPLAY_WAKE_PLAN_SCHEMA_VERSION;
    id: string;
    submittedFrameId: string;
    createdAt: number;
    scheduledReview: ReplayScheduledReview | null;
    conditions: ReplayWakeCondition[];
    deadlineAsOf: number;
}
export interface CreateReplayWakePlanInput {
    submittedFrameId: string;
    createdAt: number;
    scheduledReview?: ReplayScheduledReview | null;
    conditions?: CreateReplayWakeConditionInput[];
    deadlineAsOf: number;
}
export interface ReplayWakeConditionEvaluation {
    conditionId: string;
    effectiveAsOf: number;
    matched: boolean;
    matchedEventIds: string[];
}
export interface ReplayWakeAuditTrace {
    evaluationPointsChecked: number[];
    lifecycleTransitionsEncountered: string[];
    conditionEvaluations: ReplayWakeConditionEvaluation[];
    firstTriggeringEffectiveAsOf: number | null;
}
export interface ReplayWakeResult {
    schemaVersion: typeof REPLAY_WAKE_RESULT_SCHEMA_VERSION;
    id: string;
    wakePlanId: string;
    startedAt: number;
    effectiveAsOf: number;
    reason: "CONDITION_TRIGGERED" | "SCHEDULED_REVIEW" | "DEADLINE_REACHED" | "CASE_BOUNDARY_REACHED";
    triggeredConditionIds: string[];
    triggeringEventIds: string[];
    auditTrace: ReplayWakeAuditTrace;
}
export interface ReplayVisibleCoverage {
    timeframe: string;
    displayStart: number;
    visibleStart: number | null;
    visibleEnd: number | null;
    completedCandleCount: number;
}
export interface ReplayPriorDecisionSummary {
    decisionRecordId: string;
    frameId: string;
    action: DecisionRecord["action"];
    decisionTime: number;
}
export interface ReplayDecisionFrame {
    id: string;
    schemaVersion: typeof REPLAY_DECISION_FRAME_SCHEMA_VERSION;
    sessionId: string;
    manifestId: string;
    radarEpisodeId: string;
    requestedAsOf: number;
    effectiveAsOf: number;
    evaluationTimeframe: string;
    radarContext: ReplayRadarContext;
    decisionSnapshot: DecisionSnapshot;
    visibleCandlesByTimeframe: Record<string, ReplayCandleRecord[]>;
    visibleCoverageByTimeframe: Record<string, ReplayVisibleCoverage>;
    latestVisibleCandleByTimeframe: Record<string, ReplayCandleRecord | null>;
    visibleDataFingerprint: string;
    lifecycleState: SetupStateName;
    lifecycleStateSince: number | null;
    pendingConditions: string[];
    priorDecisionSummary: ReplayPriorDecisionSummary[];
    activeWakeResult: ReplayWakeResult | null;
    dataQualityNotes: DecisionDataQualityNote[];
    generatedAtLogicalTime: number;
}
export interface ReplayPlanningAttempt {
    id: string;
    frameId: string;
    attemptedAt: number;
    tradePlan: TradePlan;
    accepted: boolean;
    rejectionReason: string | null;
}
export interface ReplaySessionIdentity {
    schemaVersion: typeof REPLAY_SESSION_SCHEMA_VERSION;
    id: string;
    replayEngineVersion: typeof REPLAY_ENGINE_VERSION;
    manifestId: string;
    manifestSchemaVersion: string;
    radarEpisodeId: string;
    radarEpisodeObservationId: string;
    radarSelectionProfileRef: {
        id: string;
        version: string;
        hash: string;
    };
    strategyProfileRef: {
        id: string;
        version: string;
        hash: string;
    };
    lifecycleVersion: string;
    lifecycleConfigHash: string;
    sessionConfigRef: {
        id: string;
        version: string;
        hash: string;
    };
    marketDataBundleFingerprint: string;
    venueRulesRef: {
        id: string;
        version: string;
        hash: string;
    } | null;
    createdAtLogicalTime: number;
}
export interface ReplaySession extends ReplaySessionIdentity {
    revision: number;
    state: ReplaySessionState;
    currentAsOf: number | null;
    currentFrameId: string | null;
    frames: ReplayDecisionFrame[];
    decisionRecords: DecisionRecord[];
    planningAttempts: ReplayPlanningAttempt[];
    events: ReplayEvent[];
    terminalReason: ReplayTerminalReason | null;
    revealedBeforeDecisionCompletion: boolean;
    revealedOutcomeEnvelopeId: string | null;
    integrityHash: string;
}
interface ReplayCommandBase {
    schemaVersion: typeof REPLAY_COMMAND_SCHEMA_VERSION;
    id: string;
    sessionId: string;
    expectedRevision: number;
    currentFrameId: string | null;
    submittedLogicalTime: number;
}
export type ReplayTradePlanProposal = Omit<CreateTradePlanInput, "id" | "snapshot" | "strategyProfile" | "venueRules" | "createdAt"> & {
    id?: string;
};
export type ReplayCommand = (ReplayCommandBase & {
    type: "StartSession";
    payload: Record<string, never>;
}) | (ReplayCommandBase & {
    type: "Wait";
    payload: {
        reason: ReplayWaitReason;
        confidence?: number | null;
        thesis?: string | null;
        tags?: string[];
        wakePlan: ReplayWakePlan;
    };
}) | (ReplayCommandBase & {
    type: "Skip";
    payload: {
        reasons: SkipReasonCode[];
        confidence?: number | null;
        thesis?: string | null;
        tags?: string[];
    };
}) | (ReplayCommandBase & {
    type: "ProposeTrade";
    payload: ReplayTradePlanProposal;
}) | (ReplayCommandBase & {
    type: "Abandon";
    payload: {
        reason: string;
    };
}) | (ReplayCommandBase & {
    type: "RevealOutcome";
    payload: {
        abandonActive: boolean;
    };
});
export type ReplayCommandRequest = {
    id: string;
    type: "StartSession";
    payload?: Record<string, never>;
} | {
    id: string;
    type: "Wait";
    payload: Extract<ReplayCommand, {
        type: "Wait";
    }>["payload"];
} | {
    id: string;
    type: "Skip";
    payload: Extract<ReplayCommand, {
        type: "Skip";
    }>["payload"];
} | {
    id: string;
    type: "ProposeTrade";
    payload: Extract<ReplayCommand, {
        type: "ProposeTrade";
    }>["payload"];
} | {
    id: string;
    type: "Abandon";
    payload: Extract<ReplayCommand, {
        type: "Abandon";
    }>["payload"];
} | {
    id: string;
    type: "RevealOutcome";
    payload: Extract<ReplayCommand, {
        type: "RevealOutcome";
    }>["payload"];
};
export interface ReplayEvent {
    schemaVersion: typeof REPLAY_EVENT_SCHEMA_VERSION;
    id: string;
    sequence: number;
    command: ReplayCommand;
    stateAfter: ReplaySessionState;
    currentAsOfAfter: number | null;
    frame: ReplayDecisionFrame | null;
    decisionRecord: DecisionRecord | null;
    planningAttempt: ReplayPlanningAttempt | null;
    wakePlan: ReplayWakePlan | null;
    wakeResult: ReplayWakeResult | null;
    terminalReasonAfter: ReplayTerminalReason | null;
    revealedBeforeDecisionCompletionAfter: boolean;
    revealedOutcomeEnvelopeIdAfter: string | null;
}
export interface ReplayCaseOutcome {
    futureCandlesByTimeframe: Record<string, ReplayCandleRecord[]>;
    lifecycleTimeline: Array<{
        knownAt: number;
        state: SetupStateName;
    }>;
    radarTerminalResult: JsonValue | null;
    maximumFavorablePriceExcursionFromDetected: number | null;
    maximumAdversePriceExcursionFromDetected: number | null;
    lifecycleStateTimestamps: Partial<Record<SetupStateName, number>>;
    dataQualityNotes: DecisionDataQualityNote[];
}
export interface ReplayOutcomeEnvelope {
    schemaVersion: typeof REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION;
    id: string;
    sessionId: string;
    manifestId: string;
    revealedAt: number;
    revealedBeforeDecisionCompletion: boolean;
    outcome: ReplayCaseOutcome;
}
export interface ReplayOutcomeStore {
    revealCaseOutcome(input: {
        sessionId: string;
        manifestId: string;
        revealedAt: number;
        revealedBeforeDecisionCompletion: boolean;
    }): Promise<ReplayOutcomeEnvelope>;
}
export declare class InMemoryReplayOutcomeStore implements ReplayOutcomeStore {
    #private;
    constructor(outcomes: Record<string, ReplayCaseOutcome>);
    revealCaseOutcome(input: {
        sessionId: string;
        manifestId: string;
        revealedAt: number;
        revealedBeforeDecisionCompletion: boolean;
    }): Promise<ReplayOutcomeEnvelope>;
}
export interface ApplyReplayCommandResult {
    session: ReplaySession;
    event: ReplayEvent;
    outcomeEnvelope: ReplayOutcomeEnvelope | null;
    idempotent: boolean;
}
export declare function createReplayCommand(session: ReplaySession, request: ReplayCommandRequest): ReplayCommand;
export declare function createReplayWakeCondition(input: CreateReplayWakeConditionInput): ReplayWakeCondition;
export declare function createReplayWakePlan(input: CreateReplayWakePlanInput): ReplayWakePlan;
export declare function createReplaySession(loaded: ReplayLoadedCase): ReplaySession;
export declare function applyReplayCommand(loaded: ReplayLoadedCase, session: ReplaySession, command: ReplayCommand, outcomeStore?: ReplayOutcomeStore): Promise<ApplyReplayCommandResult>;
export declare function serializeReplaySession(session: ReplaySession): string;
export declare function deserializeReplaySession(serialized: string): ReplaySession;
export declare function resumeReplaySession(serialized: string, loaded: ReplayLoadedCase): Promise<ReplaySession>;
export declare function reconstructReplaySession(session: ReplaySession): ReplaySession;
export {};
