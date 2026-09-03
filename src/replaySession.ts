import {
  createDecisionSnapshot,
  decisionSnapshotReferenceLevels,
  type DecisionDataQualityNote,
  type DecisionSnapshot,
} from "./strategy";
import {
  createDecisionRecord,
  createTradePlan,
  SIZING_MODEL_VERSION,
  type CreateTradePlanInput,
  type DecisionRecord,
  type SkipReasonCode,
  type TradePlan,
} from "./tradePlanning";
import {
  REPLAY_COMMAND_SCHEMA_VERSION,
  REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  REPLAY_ENGINE_VERSION,
  REPLAY_EVENT_SCHEMA_VERSION,
  REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  REPLAY_SESSION_SCHEMA_VERSION,
  REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  replayAnalysisStateObservationId,
  replaySessionConfigHash,
  replaySha256,
  type ReplayAnalysisStateObservation,
  type ReplayCandleRecord,
  type ReplayKnownEvent,
  type ReplayLoadedCase,
  type ReplayRadarContext,
  type ReplaySessionState,
  type ReplayTerminalReason,
  type ReplayWaitReason,
  type ReplayWakeConditionType,
} from "./replay";
import { strictTimeframeToSeconds } from "./data";
import { canonicalHash, canonicalSerialize, immutableJsonClone, type JsonValue } from "./serialization";
import type { SetupStateName } from "./indicators";
import { replayPrivilegedDataBundle } from "./replayInternal";

export type ReplayStructureEventType = "BOS" | "Shift" | string;
export type ReplayAvwapEventType = "loss" | "reclaim" | "failedReclaim" | string;
export type ReplayRelativeStrengthEventType = "divergence" | "lead" | "break" | string;

interface ReplayWakeConditionBase {
  schemaVersion: typeof REPLAY_WAKE_CONDITION_SCHEMA_VERSION;
  id: string;
  type: ReplayWakeConditionType;
}

export type ReplayWakeCondition =
  | (ReplayWakeConditionBase & { type: "NextLifecycleTransition" })
  | (ReplayWakeConditionBase & {
      type: "LifecycleStateEntered";
      state: SetupStateName;
    })
  | (ReplayWakeConditionBase & {
      type: "StructureEventConfirmed";
      timeframe: string;
      eventType: ReplayStructureEventType;
      direction: "bullish" | "bearish";
    })
  | (ReplayWakeConditionBase & {
      type: "AvwapEventConfirmed";
      avwapId: string | null;
      eventType: ReplayAvwapEventType;
    })
  | (ReplayWakeConditionBase & {
      type: "RelativeStrengthEventConfirmed";
      timeframe: string | null;
      eventType: ReplayRelativeStrengthEventType;
    })
  | (ReplayWakeConditionBase & {
      type: "PriceCrossesKnownLevel";
      timeframe: string;
      direction: "above" | "below";
      referenceId: string;
      frozenPrice: number;
    })
  | (ReplayWakeConditionBase & {
      type: "PriceEntersKnownZone";
      timeframe: string;
      zoneObservationId: string;
      frozenLowerBound: number;
      frozenUpperBound: number;
    })
  | (ReplayWakeConditionBase & { type: "RadarOrLifecycleTerminal" })
  | (ReplayWakeConditionBase & { type: "AnyOf"; conditions: ReplayWakeCondition[] });

export type CreateReplayWakeConditionInput =
  | { type: "NextLifecycleTransition" }
  | { type: "LifecycleStateEntered"; state: SetupStateName }
  | {
      type: "StructureEventConfirmed";
      timeframe: string;
      eventType: ReplayStructureEventType;
      direction: "bullish" | "bearish";
    }
  | { type: "AvwapEventConfirmed"; avwapId?: string | null; eventType: ReplayAvwapEventType }
  | {
      type: "RelativeStrengthEventConfirmed";
      timeframe?: string | null;
      eventType: ReplayRelativeStrengthEventType;
    }
  | {
      type: "PriceCrossesKnownLevel";
      timeframe: string;
      direction: "above" | "below";
      referenceId: string;
      frozenPrice: number;
    }
  | {
      type: "PriceEntersKnownZone";
      timeframe: string;
      zoneObservationId: string;
      frozenLowerBound: number;
      frozenUpperBound: number;
    }
  | { type: "RadarOrLifecycleTerminal" }
  | { type: "AnyOf"; conditions: CreateReplayWakeConditionInput[] };

export type ReplayScheduledReview =
  | { mode: "nextCompletedCandle"; timeframe: string }
  | { mode: "elapsedDuration"; durationSeconds: number };

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
  reason:
    | "CONDITION_TRIGGERED"
    | "SCHEDULED_REVIEW"
    | "DEADLINE_REACHED"
    | "CASE_BOUNDARY_REACHED";
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
  radarSelectionProfileRef: { id: string; version: string; hash: string };
  strategyProfileRef: { id: string; version: string; hash: string };
  lifecycleVersion: string;
  lifecycleConfigHash: string;
  sessionConfigRef: { id: string; version: string; hash: string };
  marketDataBundleFingerprint: string;
  venueRulesRef: { id: string; version: string; hash: string } | null;
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

export type ReplayTradePlanProposal = Omit<
  CreateTradePlanInput,
  "id" | "snapshot" | "strategyProfile" | "venueRules" | "createdAt"
> & { id?: string };

export type ReplayCommand =
  | (ReplayCommandBase & { type: "StartSession"; payload: Record<string, never> })
  | (ReplayCommandBase & {
      type: "Wait";
      payload: {
        reason: ReplayWaitReason;
        confidence?: number | null;
        thesis?: string | null;
        tags?: string[];
        wakePlan: ReplayWakePlan;
      };
    })
  | (ReplayCommandBase & {
      type: "Skip";
      payload: {
        reasons: SkipReasonCode[];
        confidence?: number | null;
        thesis?: string | null;
        tags?: string[];
      };
    })
  | (ReplayCommandBase & { type: "ProposeTrade"; payload: ReplayTradePlanProposal })
  | (ReplayCommandBase & { type: "Abandon"; payload: { reason: string } })
  | (ReplayCommandBase & { type: "RevealOutcome"; payload: { abandonActive: boolean } });

export type ReplayCommandRequest =
  | { id: string; type: "StartSession"; payload?: Record<string, never> }
  | { id: string; type: "Wait"; payload: Extract<ReplayCommand, { type: "Wait" }>["payload"] }
  | { id: string; type: "Skip"; payload: Extract<ReplayCommand, { type: "Skip" }>["payload"] }
  | {
      id: string;
      type: "ProposeTrade";
      payload: Extract<ReplayCommand, { type: "ProposeTrade" }>["payload"];
    }
  | { id: string; type: "Abandon"; payload: Extract<ReplayCommand, { type: "Abandon" }>["payload"] }
  | {
      id: string;
      type: "RevealOutcome";
      payload: Extract<ReplayCommand, { type: "RevealOutcome" }>["payload"];
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
  lifecycleTimeline: Array<{ knownAt: number; state: SetupStateName }>;
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

export class InMemoryReplayOutcomeStore implements ReplayOutcomeStore {
  readonly #outcomes: Record<string, ReplayCaseOutcome>;

  constructor(outcomes: Record<string, ReplayCaseOutcome>) {
    this.#outcomes = immutableJsonClone(outcomes);
  }

  async revealCaseOutcome(input: {
    sessionId: string;
    manifestId: string;
    revealedAt: number;
    revealedBeforeDecisionCompletion: boolean;
  }): Promise<ReplayOutcomeEnvelope> {
    const outcome = this.#outcomes[input.manifestId];
    if (!outcome) throw new Error(`No outcome is available for ${input.manifestId}`);
    const definition = {
      schemaVersion: REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
      sessionId: input.sessionId,
      manifestId: input.manifestId,
      revealedAt: input.revealedAt,
      revealedBeforeDecisionCompletion: input.revealedBeforeDecisionCompletion,
      outcome,
    };
    return immutableJsonClone({
      ...definition,
      id: `replay-outcome:${canonicalHash(definition).slice("fnv1a64:".length)}`,
    });
  }
}

export interface ApplyReplayCommandResult {
  session: ReplaySession;
  event: ReplayEvent;
  outcomeEnvelope: ReplayOutcomeEnvelope | null;
  idempotent: boolean;
}

export function createReplayCommand(
  session: ReplaySession,
  request: ReplayCommandRequest,
): ReplayCommand {
  validateSessionIntegrity(session);
  return immutableJsonClone({
    schemaVersion: REPLAY_COMMAND_SCHEMA_VERSION,
    id: request.id,
    sessionId: session.id,
    expectedRevision: session.revision,
    currentFrameId: session.currentFrameId,
    submittedLogicalTime: session.currentAsOf ?? session.createdAtLogicalTime,
    type: request.type,
    payload: request.payload ?? {},
  } as ReplayCommand);
}

export function createReplayWakeCondition(
  input: CreateReplayWakeConditionInput,
): ReplayWakeCondition {
  if (input.type === "AnyOf" && input.conditions.length === 0) {
    throw new RangeError("AnyOf requires at least one condition");
  }
  if ("timeframe" in input && input.timeframe != null) strictTimeframeToSeconds(input.timeframe);
  if (input.type === "PriceCrossesKnownLevel" && !positiveFinite(input.frozenPrice)) {
    throw new RangeError("Frozen level price must be positive");
  }
  if (
    input.type === "PriceEntersKnownZone" &&
    (!positiveFinite(input.frozenLowerBound) ||
      !positiveFinite(input.frozenUpperBound) ||
      input.frozenLowerBound > input.frozenUpperBound)
  ) {
    throw new RangeError("Frozen zone bounds are invalid");
  }
  const definition = {
    schemaVersion: REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
    ...input,
    ...(input.type === "AnyOf"
      ? { conditions: input.conditions.map(createReplayWakeCondition) }
      : {}),
    ...(input.type === "AvwapEventConfirmed" ? { avwapId: input.avwapId ?? null } : {}),
    ...(input.type === "RelativeStrengthEventConfirmed"
      ? { timeframe: input.timeframe ?? null }
      : {}),
  } as Omit<ReplayWakeCondition, "id">;
  return immutableJsonClone({
    ...definition,
    id: `replay-wake-condition:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  } as ReplayWakeCondition);
}

export function createReplayWakePlan(input: CreateReplayWakePlanInput): ReplayWakePlan {
  assertTimestamp(input.createdAt, "wake plan createdAt");
  assertTimestamp(input.deadlineAsOf, "wake plan deadlineAsOf");
  if (input.deadlineAsOf <= input.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (input.scheduledReview?.mode === "nextCompletedCandle") {
    strictTimeframeToSeconds(input.scheduledReview.timeframe);
  }
  if (
    input.scheduledReview?.mode === "elapsedDuration" &&
    (!Number.isInteger(input.scheduledReview.durationSeconds) ||
      input.scheduledReview.durationSeconds <= 0)
  ) {
    throw new RangeError("Elapsed review duration must be a positive integer");
  }
  const definition = {
    schemaVersion: REPLAY_WAKE_PLAN_SCHEMA_VERSION,
    submittedFrameId: input.submittedFrameId,
    createdAt: input.createdAt,
    scheduledReview: input.scheduledReview ?? null,
    conditions: (input.conditions ?? []).map(createReplayWakeCondition),
    deadlineAsOf: input.deadlineAsOf,
  };
  if (!definition.scheduledReview && !definition.conditions.length) {
    throw new RangeError("A wake plan requires a review or condition");
  }
  return immutableJsonClone({
    ...definition,
    id: `replay-wake-plan:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

export function createReplaySession(loaded: ReplayLoadedCase): ReplaySession {
  validateLoadedIdentity(loaded);
  const definition: ReplaySessionIdentity = {
    schemaVersion: REPLAY_SESSION_SCHEMA_VERSION,
    id: replaySessionId(loaded),
    replayEngineVersion: REPLAY_ENGINE_VERSION,
    manifestId: loaded.manifest.id,
    manifestSchemaVersion: loaded.manifest.schemaVersion,
    radarEpisodeId: loaded.dataBundle.radarEpisode.id,
    radarEpisodeObservationId: loaded.dataBundle.radarEpisode.observationId,
    radarSelectionProfileRef: {
      id: loaded.radarSelectionProfile.id,
      version: loaded.radarSelectionProfile.version,
      hash: loaded.radarSelectionProfile.canonicalConfigHash,
    },
    strategyProfileRef: {
      id: loaded.strategyProfile.id,
      version: loaded.strategyProfile.version,
      hash: loaded.strategyProfile.profileHash,
    },
    lifecycleVersion: loaded.strategyProfile.lifecycleVersion,
    lifecycleConfigHash: loaded.strategyProfile.lifecycleConfigHash,
    sessionConfigRef: {
      id: loaded.sessionConfig.id,
      version: loaded.sessionConfig.version,
      hash: loaded.sessionConfig.canonicalConfigHash,
    },
    marketDataBundleFingerprint: loaded.dataBundle.causalPrefixFingerprint,
    venueRulesRef: loaded.sessionConfig.venueRulesRef,
    createdAtLogicalTime: loaded.manifest.startAsOf,
  };
  return withSessionIntegrity({
    ...definition,
    revision: 0,
    state: "Created",
    currentAsOf: null,
    currentFrameId: null,
    frames: [],
    decisionRecords: [],
    planningAttempts: [],
    events: [],
    terminalReason: null,
    revealedBeforeDecisionCompletion: false,
    revealedOutcomeEnvelopeId: null,
  });
}

function replaySessionId(loaded: ReplayLoadedCase) {
  return `replay-session:${canonicalHash({
    manifestId: loaded.manifest.id,
    sessionConfigHash: loaded.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: loaded.dataBundle.causalPrefixFingerprint,
  }).slice("fnv1a64:".length)}`;
}

async function createDecisionFrame(input: {
  loaded: ReplayLoadedCase;
  session: ReplaySession;
  requestedAsOf: number;
  effectiveAsOf: number;
  wakeResult?: ReplayWakeResult | null;
}): Promise<ReplayDecisionFrame> {
  const { loaded, session, effectiveAsOf } = input;
  const dataBundle = replayPrivilegedDataBundle(loaded);
  if (effectiveAsOf < loaded.manifest.startAsOf) {
    throw new RangeError("A replay frame cannot precede radar detection");
  }
  const analysis = latestAnalysisStateAt(loaded, effectiveAsOf);
  const lifecycle = immutableJsonClone({ ...analysis.lifecycle, asOf: effectiveAsOf });
  const dataQualityNotes = [
    ...dataBundle.dataQualityNotes,
    ...analysis.dataQualityNotes,
    ...(analysis.lifecycle.asOf != null && analysis.lifecycle.asOf < effectiveAsOf
      ? [{
          code: "CARRIED_FORWARD_ANALYSIS_STATE",
          severity: "warning" as const,
          message: `Analysis observation ${analysis.id} was carried forward from ${analysis.lifecycle.asOf}`,
        }]
      : []),
  ];
  const snapshot = createDecisionSnapshot({
    symbol: loaded.manifest.symbol,
    source: loaded.manifest.source,
    decisionTime: effectiveAsOf,
    effectiveAsOf,
    strategyProfile: loaded.strategyProfile,
    lifecycle,
    candidateMetrics: analysis.candidateMetrics,
    structureByTimeframe: analysis.structureByTimeframe,
    activeStructureLevels: analysis.activeStructureLevels,
    supportResistanceZones: analysis.supportResistanceZones,
    avwapState: analysis.avwapState,
    avwapEvents: analysis.avwapEvents,
    relativeStrengthState: analysis.relativeStrengthState,
    relativeStrengthEvents: analysis.relativeStrengthEvents,
    visibleOrSelectedReferenceLevels: analysis.visibleOrSelectedReferenceLevels,
    dataQualityNotes,
  });
  const visibleCandlesByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const visibleCoverageByTimeframe: Record<string, ReplayVisibleCoverage> = {};
  const latestVisibleCandleByTimeframe: Record<string, ReplayCandleRecord | null> = {};
  for (const timeframe of loaded.sessionConfig.visibleTimeframes) {
    const visible = selectedReplayCandlesAt(
      dataBundle.candlesByTimeframe[timeframe] ?? [],
      effectiveAsOf,
    ).filter((candle) => candle.openTime >= dataBundle.displayStartByTimeframe[timeframe]!);
    visibleCandlesByTimeframe[timeframe] = visible;
    latestVisibleCandleByTimeframe[timeframe] = visible.at(-1) ?? null;
    visibleCoverageByTimeframe[timeframe] = {
      timeframe,
      displayStart: dataBundle.displayStartByTimeframe[timeframe]!,
      visibleStart: visible[0]?.openTime ?? null,
      visibleEnd: visible.at(-1)?.closeTime ?? null,
      completedCandleCount: visible.length,
    };
  }
  const visibleDataFingerprint = await replaySha256({
    effectiveAsOf,
    analysisObservationId: analysis.id,
    visibleCandlesByTimeframe,
  });
  const priorDecisionSummary = session.decisionRecords.map((record) => ({
    decisionRecordId: record.id,
    frameId: session.frames.find((frame) => frame.decisionSnapshot.id === record.snapshotId)?.id ?? "",
    action: record.action,
    decisionTime: record.decisionTime,
  }));
  const definition = {
    schemaVersion: REPLAY_DECISION_FRAME_SCHEMA_VERSION,
    sessionId: session.id,
    manifestId: loaded.manifest.id,
    radarEpisodeId: loaded.dataBundle.radarEpisode.id,
    requestedAsOf: input.requestedAsOf,
    effectiveAsOf,
    evaluationTimeframe: loaded.sessionConfig.evaluationTimeframe,
    radarContext: replayRadarContext(loaded),
    decisionSnapshot: snapshot,
    visibleCandlesByTimeframe,
    visibleCoverageByTimeframe,
    latestVisibleCandleByTimeframe,
    visibleDataFingerprint,
    lifecycleState: snapshot.lifecycleState,
    lifecycleStateSince: snapshot.lifecycleStateSince,
    pendingConditions: snapshot.pendingConditions,
    priorDecisionSummary,
    activeWakeResult: input.wakeResult ?? null,
    dataQualityNotes,
    generatedAtLogicalTime: effectiveAsOf,
  };
  return immutableJsonClone({
    ...definition,
    id: `replay-frame:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

function replayRadarContext(loaded: ReplayLoadedCase): ReplayRadarContext {
  const episode = loaded.dataBundle.radarEpisode;
  return immutableJsonClone({
    radarEpisodeId: episode.id,
    triggeringDetectorIds: episode.triggeringDetectorIds,
    triggeringObservations: episode.triggeringObservations,
    selectionAnchor: episode.selectionAnchor,
    pathContext: episode.pathContext,
    hardGateResults: episode.hardGateResults,
  });
}

function latestAnalysisStateAt(loaded: ReplayLoadedCase, asOf: number) {
  const eligible = replayPrivilegedDataBundle(loaded).analysisStateHistory.filter(
    (item) => item.knownAt <= asOf,
  );
  const latest = eligible.at(-1);
  if (!latest || latest.id !== replayAnalysisStateObservationId(latest)) {
    throw new Error(`No verified point-in-time analysis state is available at ${asOf}`);
  }
  return latest;
}

function selectedReplayCandlesAt(candles: ReplayCandleRecord[], asOf: number) {
  const selected = new Map<string, ReplayCandleRecord>();
  for (const candle of candles) {
    if (candle.closeTime > asOf || candle.knownAt > asOf) continue;
    const current = selected.get(candle.logicalCandleId);
    if (!current || current.knownAt < candle.knownAt) selected.set(candle.logicalCandleId, candle);
    else if (
      current.knownAt === candle.knownAt &&
      canonicalSerialize(current) !== canonicalSerialize(candle)
    ) {
      throw new Error(`Conflicting candle revisions for ${candle.logicalCandleId}`);
    }
  }
  return immutableJsonClone(
    [...selected.values()].sort(
      (left, right) => left.openTime - right.openTime || left.knownAt - right.knownAt,
    ),
  );
}

export async function applyReplayCommand(
  loaded: ReplayLoadedCase,
  session: ReplaySession,
  command: ReplayCommand,
  outcomeStore?: ReplayOutcomeStore,
): Promise<ApplyReplayCommandResult> {
  validateLoadedIdentity(loaded);
  validateSessionIntegrity(session);
  assertSessionMatchesLoaded(session, loaded);
  const prior = session.events.find((event) => event.command.id === command.id);
  if (prior) {
    if (canonicalSerialize(prior.command) !== canonicalSerialize(command)) {
      throw new Error(`Command id ${command.id} was reused with a different payload`);
    }
    return { session: immutableJsonClone(session), event: prior, outcomeEnvelope: null, idempotent: true };
  }
  validateReplayCommand(session, command);

  let eventInput: Omit<ReplayEvent, "id" | "sequence" | "schemaVersion">;
  let outcomeEnvelope: ReplayOutcomeEnvelope | null = null;
  if (command.type === "StartSession") {
    if (session.state !== "Created") throw new Error("Only a Created replay session can start");
    const frame = await createDecisionFrame({
      loaded,
      session,
      requestedAsOf: loaded.manifest.startAsOf,
      effectiveAsOf: loaded.manifest.startAsOf,
    });
    eventInput = replayEventInput(command, "Active", frame.effectiveAsOf, { frame });
  } else {
    if (session.state !== "Active" && command.type !== "RevealOutcome") {
      throw new Error(`Command ${command.type} is not allowed while session is ${session.state}`);
    }
    const currentFrame = requireCurrentFrame(session);
    if (command.type === "Wait") {
      validateWakePlan(loaded, session, currentFrame, command.payload.wakePlan);
      const decisionRecord = createDecisionRecord({
        sessionId: session.id,
        snapshot: currentFrame.decisionSnapshot,
        decisionTime: currentFrame.effectiveAsOf,
        action: "Wait",
        confidence: command.payload.confidence,
        thesis: command.payload.thesis,
        tags: [command.payload.reason, ...(command.payload.tags ?? [])],
        nextCondition: describeWakePlan(command.payload.wakePlan),
      });
      const advanced = await advanceReplayWait(
        loaded,
        session,
        currentFrame,
        command.payload.wakePlan,
      );
      const sessionForFrame = immutableJsonClone({
        ...session,
        decisionRecords: [...session.decisionRecords, decisionRecord],
      });
      const frame = await createDecisionFrame({
        loaded,
        session: sessionForFrame,
        requestedAsOf: advanced.requestedAsOf,
        effectiveAsOf: advanced.effectiveAsOf,
        wakeResult: advanced.wakeResult,
      });
      eventInput = replayEventInput(command, advanced.state, frame.effectiveAsOf, {
        frame,
        decisionRecord,
        wakePlan: command.payload.wakePlan,
        wakeResult: advanced.wakeResult,
        terminalReason: advanced.terminalReason,
      });
    } else if (command.type === "Skip") {
      if (!command.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const decisionRecord = createDecisionRecord({
        sessionId: session.id,
        snapshot: currentFrame.decisionSnapshot,
        decisionTime: currentFrame.effectiveAsOf,
        action: "Skip",
        confidence: command.payload.confidence,
        thesis: command.payload.thesis,
        tags: [...(command.payload.tags ?? []), ...command.payload.reasons.slice(1)],
        skipReason: command.payload.reasons[0],
      });
      eventInput = replayEventInput(command, "Skipped", currentFrame.effectiveAsOf, {
        decisionRecord,
      });
    } else if (command.type === "ProposeTrade") {
      if (!loaded.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const tradePlan = createTradePlan({
        ...command.payload,
        snapshot: currentFrame.decisionSnapshot,
        strategyProfile: loaded.strategyProfile,
        venueRules: loaded.venueRules,
        createdAt: currentFrame.effectiveAsOf,
      });
      const rejectionReason = tradePlanRejectionReason(loaded, tradePlan);
      const planningAttempt: ReplayPlanningAttempt = immutableJsonClone({
        id: `replay-planning-attempt:${canonicalHash({
          sessionId: session.id,
          frameId: currentFrame.id,
          tradePlan,
        }).slice("fnv1a64:".length)}`,
        frameId: currentFrame.id,
        attemptedAt: currentFrame.effectiveAsOf,
        tradePlan,
        accepted: rejectionReason == null,
        rejectionReason,
      });
      const decisionRecord = rejectionReason
        ? null
        : createDecisionRecord({
            sessionId: session.id,
            snapshot: currentFrame.decisionSnapshot,
            decisionTime: currentFrame.effectiveAsOf,
            action: "ProposeTrade",
            tradePlan,
          });
      eventInput = replayEventInput(
        command,
        rejectionReason ? "Active" : "TradePlanRecorded",
        currentFrame.effectiveAsOf,
        { planningAttempt, decisionRecord },
      );
    } else if (command.type === "Abandon") {
      if (!command.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      eventInput = replayEventInput(command, "Abandoned", currentFrame.effectiveAsOf);
    } else {
      const reveal = await prepareOutcomeReveal(loaded, session, command, outcomeStore);
      outcomeEnvelope = reveal.envelope;
      eventInput = replayEventInput(command, "Revealed", reveal.revealedAt, {
        terminalReason: session.terminalReason,
        revealedBeforeDecisionCompletion: reveal.early,
        outcomeEnvelopeId: reveal.envelope.id,
      });
    }
  }
  const event = createReplayEvent(session, eventInput);
  return {
    session: applyReplayEvent(session, event),
    event,
    outcomeEnvelope,
    idempotent: false,
  };
}

interface ReplayEventOptions {
  frame?: ReplayDecisionFrame | null;
  decisionRecord?: DecisionRecord | null;
  planningAttempt?: ReplayPlanningAttempt | null;
  wakePlan?: ReplayWakePlan | null;
  wakeResult?: ReplayWakeResult | null;
  terminalReason?: ReplayTerminalReason | null;
  revealedBeforeDecisionCompletion?: boolean;
  outcomeEnvelopeId?: string | null;
}

function replayEventInput(
  command: ReplayCommand,
  stateAfter: ReplaySessionState,
  currentAsOfAfter: number | null,
  options: ReplayEventOptions = {},
): Omit<ReplayEvent, "id" | "sequence" | "schemaVersion"> {
  return {
    command,
    stateAfter,
    currentAsOfAfter,
    frame: options.frame ?? null,
    decisionRecord: options.decisionRecord ?? null,
    planningAttempt: options.planningAttempt ?? null,
    wakePlan: options.wakePlan ?? null,
    wakeResult: options.wakeResult ?? null,
    terminalReasonAfter: options.terminalReason ?? null,
    revealedBeforeDecisionCompletionAfter:
      options.revealedBeforeDecisionCompletion ?? false,
    revealedOutcomeEnvelopeIdAfter: options.outcomeEnvelopeId ?? null,
  };
}

function createReplayEvent(
  session: ReplaySession,
  input: Omit<ReplayEvent, "id" | "sequence" | "schemaVersion">,
): ReplayEvent {
  const definition = {
    schemaVersion: REPLAY_EVENT_SCHEMA_VERSION,
    sequence: session.revision + 1,
    ...input,
  };
  return immutableJsonClone({
    ...definition,
    id: `replay-event:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

function applyReplayEvent(session: ReplaySession, event: ReplayEvent): ReplaySession {
  if (event.schemaVersion !== REPLAY_EVENT_SCHEMA_VERSION) {
    throw new Error("Replay event schema is invalid");
  }
  if (event.sequence !== session.revision + 1) throw new Error("Replay event sequence is invalid");
  if (event.id !== replayEventId(event)) throw new Error("Replay event identity is invalid");
  if (event.command.sessionId !== session.id || event.command.expectedRevision !== session.revision) {
    throw new Error("Replay event command provenance is invalid");
  }
  if (event.frame) {
    const { id: _frameId, ...frameDefinition } = event.frame;
    if (
      event.frame.id !==
        `replay-frame:${canonicalHash(frameDefinition).slice("fnv1a64:".length)}` ||
      event.frame.sessionId !== session.id ||
      event.frame.manifestId !== session.manifestId
    ) throw new Error("Replay event frame identity is invalid");
    assertFrameCutoff(event.frame);
  }
  if (event.decisionRecord && event.decisionRecord.sessionId !== session.id) {
    throw new Error("Replay event decision record targets another session");
  }
  if (event.wakePlan && event.wakePlan.id !== replayWakePlanId(event.wakePlan)) {
    throw new Error("Replay event wake plan identity is invalid");
  }
  if (event.wakeResult) {
    const { id: _wakeId, ...wakeDefinition } = event.wakeResult;
    if (
      event.wakeResult.id !==
      `replay-wake-result:${canonicalHash(wakeDefinition).slice("fnv1a64:".length)}`
    ) throw new Error("Replay event wake result identity is invalid");
  }
  validateReplayEventTransition(session, event);
  return withSessionIntegrity({
    ...session,
    revision: event.sequence,
    state: event.stateAfter,
    currentAsOf: event.currentAsOfAfter,
    currentFrameId: event.frame?.id ?? session.currentFrameId,
    frames: event.frame ? [...session.frames, event.frame] : session.frames,
    decisionRecords: event.decisionRecord
      ? [...session.decisionRecords, event.decisionRecord]
      : session.decisionRecords,
    planningAttempts: event.planningAttempt
      ? [...session.planningAttempts, event.planningAttempt]
      : session.planningAttempts,
    events: [...session.events, event],
    terminalReason: event.terminalReasonAfter,
    revealedBeforeDecisionCompletion:
      session.revealedBeforeDecisionCompletion ||
      event.revealedBeforeDecisionCompletionAfter,
    revealedOutcomeEnvelopeId:
      event.revealedOutcomeEnvelopeIdAfter ?? session.revealedOutcomeEnvelopeId,
  });
}

function validateReplayEventTransition(session: ReplaySession, event: ReplayEvent) {
  const unchangedClock = event.currentAsOfAfter === session.currentAsOf;
  const noFrame = event.frame == null;
  const noDecision = event.decisionRecord == null;
  const noPlanning = event.planningAttempt == null;
  const noWake = event.wakePlan == null && event.wakeResult == null;
  const noReveal =
    !event.revealedBeforeDecisionCompletionAfter &&
    event.revealedOutcomeEnvelopeIdAfter == null;

  if (event.stateAfter === "Failed") {
    throw new Error("Failed replay sessions cannot be synthesized from accepted commands");
  }

  if (event.command.type === "StartSession") {
    if (
      session.state !== "Created" ||
      event.stateAfter !== "Active" ||
      !event.frame ||
      event.currentAsOfAfter !== event.frame.effectiveAsOf ||
      event.currentAsOfAfter !== session.createdAtLogicalTime ||
      !noDecision ||
      !noPlanning ||
      !noWake ||
      !noReveal ||
      event.terminalReasonAfter != null
    ) throw new Error("StartSession event transition is invalid");
    return;
  }

  if (event.command.type === "Wait") {
    const terminal = event.stateAfter === "CaseWindowEnded";
    if (
      session.state !== "Active" ||
      !event.frame ||
      !event.decisionRecord ||
      event.decisionRecord.action !== "Wait" ||
      !event.wakePlan ||
      !event.wakeResult ||
      event.wakeResult.wakePlanId !== event.wakePlan.id ||
      event.frame.activeWakeResult?.id !== event.wakeResult.id ||
      event.currentAsOfAfter !== event.frame.effectiveAsOf ||
      !["Active", "CaseWindowEnded"].includes(event.stateAfter) ||
      terminal !== (event.terminalReasonAfter != null) ||
      !noPlanning ||
      !noReveal
    ) throw new Error("Wait event transition is invalid");
    return;
  }

  if (event.command.type === "Skip") {
    if (
      session.state !== "Active" ||
      event.stateAfter !== "Skipped" ||
      !event.decisionRecord ||
      event.decisionRecord.action !== "Skip" ||
      !unchangedClock ||
      !noFrame ||
      !noPlanning ||
      !noWake ||
      !noReveal ||
      event.terminalReasonAfter != null
    ) throw new Error("Skip event transition is invalid");
    return;
  }

  if (event.command.type === "ProposeTrade") {
    const accepted = event.planningAttempt?.accepted === true;
    const expectedAttemptId = event.planningAttempt
      ? `replay-planning-attempt:${canonicalHash({
          sessionId: session.id,
          frameId: event.planningAttempt.frameId,
          tradePlan: event.planningAttempt.tradePlan,
        }).slice("fnv1a64:".length)}`
      : null;
    if (
      session.state !== "Active" ||
      !event.planningAttempt ||
      event.planningAttempt.id !== expectedAttemptId ||
      event.planningAttempt.frameId !== session.currentFrameId ||
      event.planningAttempt.attemptedAt !== session.currentAsOf ||
      event.stateAfter !== (accepted ? "TradePlanRecorded" : "Active") ||
      (accepted
        ? event.decisionRecord?.action !== "ProposeTrade"
        : event.decisionRecord != null) ||
      !unchangedClock ||
      !noFrame ||
      !noWake ||
      !noReveal ||
      event.terminalReasonAfter != null
    ) throw new Error("ProposeTrade event transition is invalid");
    return;
  }

  if (event.command.type === "Abandon") {
    if (
      session.state !== "Active" ||
      event.stateAfter !== "Abandoned" ||
      !unchangedClock ||
      !noFrame ||
      !noDecision ||
      !noPlanning ||
      !noWake ||
      !noReveal ||
      event.terminalReasonAfter != null
    ) throw new Error("Abandon event transition is invalid");
    return;
  }

  const terminalReveal = [
    "Skipped",
    "TradePlanRecorded",
    "CaseWindowEnded",
    "Abandoned",
  ].includes(session.state);
  const earlyReveal =
    session.state === "Active" &&
    event.command.payload.abandonActive &&
    event.revealedBeforeDecisionCompletionAfter;
  if (
    (!terminalReveal && !earlyReveal) ||
    event.stateAfter !== "Revealed" ||
    !unchangedClock ||
    !noFrame ||
    !noDecision ||
    !noPlanning ||
    !noWake ||
    event.revealedOutcomeEnvelopeIdAfter == null ||
    event.terminalReasonAfter !== session.terminalReason
  ) throw new Error("RevealOutcome event transition is invalid");
}

function replayEventId(event: ReplayEvent) {
  const { id: _ignored, ...definition } = event;
  return `replay-event:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

function validateReplayCommand(session: ReplaySession, command: ReplayCommand) {
  if (command.schemaVersion !== REPLAY_COMMAND_SCHEMA_VERSION || !command.id.trim()) {
    throw new Error("Replay command schema or id is invalid");
  }
  if (command.sessionId !== session.id) throw new Error("Replay command targets another session");
  if (command.expectedRevision !== session.revision) {
    throw new Error(`Stale replay revision ${command.expectedRevision}; expected ${session.revision}`);
  }
  if (command.currentFrameId !== session.currentFrameId) {
    throw new Error("Replay command does not reference the current frame");
  }
  const expectedTime = session.currentAsOf ?? session.createdAtLogicalTime;
  if (command.submittedLogicalTime !== expectedTime) {
    throw new Error("Replay command submittedLogicalTime must equal the current replay clock");
  }
  if (session.state === "Revealed" || session.state === "Failed") {
    throw new Error(`No commands are accepted after ${session.state}`);
  }
}

function requireCurrentFrame(session: ReplaySession) {
  const frame = session.frames.find((item) => item.id === session.currentFrameId);
  if (!frame || frame.effectiveAsOf !== session.currentAsOf) {
    throw new Error("Active replay session has no valid current frame");
  }
  return frame;
}

function tradePlanRejectionReason(loaded: ReplayLoadedCase, plan: TradePlan): string | null {
  if (plan.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (plan.sizingResult.sizingModelVersion !== SIZING_MODEL_VERSION) {
    return "Sizing model version mismatch";
  }
  if (plan.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (
    plan.complianceResult.classification === "OutOfStrategy" &&
    !loaded.sessionConfig.allowOutOfStrategyPlans
  ) {
    return "OutOfStrategy plans are disabled by the replay configuration";
  }
  if (
    plan.complianceResult.classification === "Overridden" &&
    !loaded.sessionConfig.allowDiscretionaryOverrides
  ) {
    return "Discretionary overrides are disabled by the replay configuration";
  }
  if (loaded.venueRules && canonicalSerialize(plan.venueRules) !== canonicalSerialize(loaded.venueRules)) {
    return "Trade plan venue rules differ from the loaded replay rules";
  }
  const executionVenue = loaded.manifest.executionVenueEligibility.executionVenue;
  if (executionVenue && plan.venueRules.venue.toLowerCase() !== executionVenue.toLowerCase()) {
    return "Trade plan venue does not match the manifest execution venue";
  }
  const eligibility = executionVenueEligibilityAt(loaded, plan.createdAt, executionVenue);
  if (eligibility === "Unavailable") {
    return "Execution venue was unavailable at the replay decision time";
  }
  return null;
}

function executionVenueEligibilityAt(
  loaded: ReplayLoadedCase,
  asOf: number,
  executionVenue: string,
) {
  const evidence = replayPrivilegedDataBundle(loaded).venueEvidence
    .filter(
      (item) =>
        item.knownAt <= asOf &&
        item.effectiveFrom <= asOf &&
        (item.effectiveTo == null || item.effectiveTo > asOf) &&
        item.executionVenue.toLowerCase() === executionVenue.toLowerCase(),
    )
    .at(-1);
  if (evidence) return evidence.status;
  const manifestEvidence = loaded.manifest.executionVenueEligibility;
  if (
    manifestEvidence.effectiveFrom <= asOf &&
    (manifestEvidence.effectiveTo == null || manifestEvidence.effectiveTo > asOf)
  ) return manifestEvidence.status;
  return "Unavailable";
}

function validateWakePlan(
  loaded: ReplayLoadedCase,
  session: ReplaySession,
  frame: ReplayDecisionFrame,
  plan: ReplayWakePlan,
) {
  if (plan.id !== replayWakePlanId(plan)) throw new Error("Wake plan identity is invalid");
  if (plan.submittedFrameId !== frame.id || plan.createdAt !== frame.effectiveAsOf) {
    throw new Error("Wake plan must be frozen against the current frame");
  }
  if (
    plan.deadlineAsOf > frame.effectiveAsOf + loaded.sessionConfig.maximumSingleWaitDuration ||
    plan.deadlineAsOf > loaded.manifest.startAsOf + loaded.sessionConfig.maximumCaseDuration
  ) {
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  }
  if (
    plan.scheduledReview?.mode === "nextCompletedCandle" &&
    !Object.hasOwn(
      replayPrivilegedDataBundle(loaded).candlesByTimeframe,
      plan.scheduledReview.timeframe,
    )
  ) {
    throw new RangeError(
      `Scheduled review timeframe ${plan.scheduledReview.timeframe} is not loaded`,
    );
  }
  for (const condition of flattenWakeConditions(plan.conditions)) {
    if (!loaded.sessionConfig.allowedWakeConditionTypes.includes(condition.type)) {
      throw new RangeError(`Wake condition ${condition.type} is not allowed`);
    }
    if (condition.id !== replayWakeConditionId(condition)) {
      throw new Error(`Wake condition ${condition.id} failed deterministic verification`);
    }
  }
  validateWakeReferences(frame, plan.conditions);
  if (wakeAlreadyTrue(loaded, frame, plan.conditions)) {
    throw new RangeError("A submitted wake condition is already true in the current frame");
  }
  if (session.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}

function replayWakePlanId(plan: ReplayWakePlan) {
  const { id: _ignored, ...definition } = plan;
  return `replay-wake-plan:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

function replayWakeConditionId(condition: ReplayWakeCondition) {
  const { id: _ignored, ...definition } = condition;
  return `replay-wake-condition:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

function validateWakeReferences(frame: ReplayDecisionFrame, conditions: ReplayWakeCondition[]) {
  const references = decisionSnapshotReferenceLevels(frame.decisionSnapshot);
  for (const condition of flattenWakeConditions(conditions)) {
    if (condition.type === "PriceCrossesKnownLevel") {
      const reference = references.find((item) => item.id === condition.referenceId);
      if (!reference || reference.knownAt > frame.effectiveAsOf) {
        throw new Error(`Unknown current-frame reference ${condition.referenceId}`);
      }
      if (reference.price !== condition.frozenPrice) {
        throw new Error("Frozen level price does not match the current DecisionFrame");
      }
    }
    if (condition.type === "PriceEntersKnownZone") {
      const reference = references.find(
        (item) => item.sourceObject.observationId === condition.zoneObservationId,
      );
      if (!reference || reference.knownAt > frame.effectiveAsOf) {
        throw new Error(`Unknown current-frame zone ${condition.zoneObservationId}`);
      }
      if (
        reference.rangeLow !== condition.frozenLowerBound ||
        reference.rangeHigh !== condition.frozenUpperBound
      ) {
        throw new Error("Frozen zone bounds do not match the current DecisionFrame");
      }
    }
  }
}

function wakeAlreadyTrue(
  loaded: ReplayLoadedCase,
  frame: ReplayDecisionFrame,
  conditions: ReplayWakeCondition[],
) {
  for (const condition of flattenWakeConditions(conditions)) {
    if (
      condition.type === "LifecycleStateEntered" &&
      frame.lifecycleState === condition.state
    ) return true;
    if (condition.type === "PriceCrossesKnownLevel") {
      const close = latestCloseAt(loaded, condition.timeframe, frame.effectiveAsOf);
      if (
        close != null &&
        ((condition.direction === "above" && close >= condition.frozenPrice) ||
          (condition.direction === "below" && close <= condition.frozenPrice))
      ) return true;
    }
    if (condition.type === "PriceEntersKnownZone") {
      const close = latestCloseAt(loaded, condition.timeframe, frame.effectiveAsOf);
      if (
        close != null &&
        close >= condition.frozenLowerBound &&
        close <= condition.frozenUpperBound
      ) return true;
    }
  }
  return false;
}

function flattenWakeConditions(conditions: ReplayWakeCondition[]): ReplayWakeCondition[] {
  return conditions.flatMap((condition) =>
    condition.type === "AnyOf" ? [condition, ...flattenWakeConditions(condition.conditions)] : [condition],
  );
}

function describeWakePlan(plan: ReplayWakePlan) {
  return canonicalSerialize({
    scheduledReview: plan.scheduledReview,
    conditionIds: plan.conditions.map((item) => item.id),
    deadlineAsOf: plan.deadlineAsOf,
  });
}

interface ReplayAdvanceResult {
  requestedAsOf: number;
  effectiveAsOf: number;
  state: "Active" | "CaseWindowEnded";
  terminalReason: ReplayTerminalReason | null;
  wakeResult: ReplayWakeResult;
}

async function advanceReplayWait(
  loaded: ReplayLoadedCase,
  session: ReplaySession,
  frame: ReplayDecisionFrame,
  plan: ReplayWakePlan,
): Promise<ReplayAdvanceResult> {
  const start = frame.effectiveAsOf;
  const dataBundle = replayPrivilegedDataBundle(loaded);
  const caseHorizon = loaded.manifest.startAsOf + loaded.sessionConfig.maximumCaseDuration;
  const coverageEnd = evaluationCoverageEnd(loaded);
  const scheduledTarget = scheduledReviewTarget(loaded, start, plan.scheduledReview);
  const requestedAsOf =
    plan.scheduledReview?.mode === "elapsedDuration"
      ? start + plan.scheduledReview.durationSeconds
      : scheduledTarget ?? plan.deadlineAsOf;
  const boundary = Math.min(plan.deadlineAsOf, caseHorizon, coverageEnd);
  if (boundary < start) throw new Error("Historical coverage ends before the replay clock");

  const points = new Set<number>([boundary]);
  for (const state of dataBundle.analysisStateHistory) {
    if (state.knownAt > start && state.knownAt <= boundary) points.add(state.knownAt);
  }
  for (const event of dataBundle.knownEvents) {
    if (event.knownAt > start && event.knownAt <= boundary) points.add(event.knownAt);
  }
  for (const candles of Object.values(dataBundle.candlesByTimeframe)) {
    for (const candle of candles) {
      const effective = Math.max(candle.closeTime, candle.knownAt);
      if (effective > start && effective <= boundary) points.add(effective);
    }
  }
  if (scheduledTarget != null && scheduledTarget > start && scheduledTarget <= boundary) {
    points.add(scheduledTarget);
  }
  if (plan.deadlineAsOf > start && plan.deadlineAsOf <= boundary) points.add(plan.deadlineAsOf);
  if (caseHorizon > start && caseHorizon <= boundary) points.add(caseHorizon);
  if (coverageEnd > start && coverageEnd <= boundary) points.add(coverageEnd);

  const audit: ReplayWakeAuditTrace = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null,
  };
  const sortedPoints = [...points].sort((left, right) => left - right);
  let effectiveAsOf = boundary;
  let reason: ReplayWakeResult["reason"] = "DEADLINE_REACHED";
  let triggeredConditionIds: string[] = [];
  let triggeringEventIds: string[] = [];
  let terminalReason: ReplayTerminalReason | null = null;

  for (const point of sortedPoints) {
    audit.evaluationPointsChecked.push(point);
    const transitions = lifecycleTransitionsAt(loaded, point, start);
    audit.lifecycleTransitionsEncountered.push(...transitions);
    const matches = evaluateWakeConditions(loaded, plan.conditions, start, point, audit);
    const configuredTerminal = configuredTerminalAt(loaded, point, start);
    if (configuredTerminal) {
      effectiveAsOf = point;
      reason = "CASE_BOUNDARY_REACHED";
      terminalReason = configuredTerminal;
      triggeredConditionIds = matches.conditionIds;
      triggeringEventIds = matches.eventIds;
      if (matches.conditionIds.length) audit.firstTriggeringEffectiveAsOf = point;
      break;
    }
    if (matches.conditionIds.length) {
      effectiveAsOf = point;
      reason = "CONDITION_TRIGGERED";
      triggeredConditionIds = matches.conditionIds;
      triggeringEventIds = matches.eventIds;
      audit.firstTriggeringEffectiveAsOf = point;
      break;
    }
    if (scheduledTarget != null && point >= scheduledTarget) {
      effectiveAsOf = point;
      reason = "SCHEDULED_REVIEW";
      break;
    }
    if (point >= boundary) {
      effectiveAsOf = boundary;
      if (boundary === caseHorizon) {
        reason = "CASE_BOUNDARY_REACHED";
        terminalReason = "MAXIMUM_CASE_DURATION";
      } else if (boundary === coverageEnd) {
        reason = "CASE_BOUNDARY_REACHED";
        terminalReason = "DATA_COVERAGE_ENDED";
      } else {
        reason = "DEADLINE_REACHED";
      }
      break;
    }
  }
  const definition = {
    schemaVersion: REPLAY_WAKE_RESULT_SCHEMA_VERSION,
    wakePlanId: plan.id,
    startedAt: start,
    effectiveAsOf,
    reason,
    triggeredConditionIds: [...new Set(triggeredConditionIds)],
    triggeringEventIds: [...new Set(triggeringEventIds)],
    auditTrace: audit,
  };
  const wakeResult: ReplayWakeResult = immutableJsonClone({
    ...definition,
    id: `replay-wake-result:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
  return {
    requestedAsOf,
    effectiveAsOf,
    state: terminalReason ? "CaseWindowEnded" : "Active",
    terminalReason,
    wakeResult,
  };
}

function scheduledReviewTarget(
  loaded: ReplayLoadedCase,
  start: number,
  review: ReplayScheduledReview | null,
): number | null {
  if (!review) return null;
  if (review.mode === "nextCompletedCandle") {
    return nextCandleKnowledgePoint(loaded, review.timeframe, start);
  }
  const timeframeSeconds = strictTimeframeToSeconds(loaded.sessionConfig.evaluationTimeframe);
  const requested = start + review.durationSeconds;
  const aligned = Math.ceil(requested / timeframeSeconds) * timeframeSeconds;
  return nextCandleKnowledgePoint(loaded, loaded.sessionConfig.evaluationTimeframe, aligned - 1);
}

function nextCandleKnowledgePoint(
  loaded: ReplayLoadedCase,
  timeframe: string,
  after: number,
): number | null {
  return (replayPrivilegedDataBundle(loaded).candlesByTimeframe[timeframe] ?? [])
    .filter((candle) => candle.closeTime > after)
    .map((candle) => Math.max(candle.closeTime, candle.knownAt))
    .sort((left, right) => left - right)[0] ?? null;
}

function evaluationCoverageEnd(loaded: ReplayLoadedCase) {
  const candles =
    replayPrivilegedDataBundle(loaded).candlesByTimeframe[
      loaded.sessionConfig.evaluationTimeframe
    ] ?? [];
  const values = candles.map((candle) => candle.closeTime);
  return values.length ? Math.max(...values) : loaded.manifest.startAsOf;
}

function lifecycleTransitionsAt(loaded: ReplayLoadedCase, point: number, after: number) {
  const eventIds = replayPrivilegedDataBundle(loaded).knownEvents
    .filter(
      (event) =>
        event.kind === "lifecycleTransition" &&
        event.knownAt === point &&
        event.knownAt > after,
    )
    .map((event) => event.id);
  const before = analysisStateBefore(loaded, point)?.lifecycle.currentState;
  const at = latestAnalysisStateAt(loaded, point);
  if (before !== at.lifecycle.currentState) eventIds.push(at.id);
  return [...new Set(eventIds)];
}

function analysisStateBefore(loaded: ReplayLoadedCase, asOf: number) {
  return replayPrivilegedDataBundle(loaded).analysisStateHistory
    .filter((item) => item.knownAt < asOf)
    .at(-1) ?? null;
}

function evaluateWakeConditions(
  loaded: ReplayLoadedCase,
  conditions: ReplayWakeCondition[],
  start: number,
  point: number,
  audit: ReplayWakeAuditTrace,
): { conditionIds: string[]; eventIds: string[] } {
  const conditionIds: string[] = [];
  const eventIds: string[] = [];
  for (const condition of conditions) {
    const result = evaluateWakeCondition(loaded, condition, start, point, audit);
    if (result.matched) {
      conditionIds.push(...result.conditionIds);
      eventIds.push(...result.eventIds);
    }
  }
  return { conditionIds: [...new Set(conditionIds)], eventIds: [...new Set(eventIds)] };
}

function evaluateWakeCondition(
  loaded: ReplayLoadedCase,
  condition: ReplayWakeCondition,
  start: number,
  point: number,
  audit: ReplayWakeAuditTrace,
): { matched: boolean; conditionIds: string[]; eventIds: string[] } {
  if (condition.type === "AnyOf") {
    const child = evaluateWakeConditions(loaded, condition.conditions, start, point, audit);
    const matched = child.conditionIds.length > 0;
    audit.conditionEvaluations.push({
      conditionId: condition.id,
      effectiveAsOf: point,
      matched,
      matchedEventIds: child.eventIds,
    });
    return {
      matched,
      conditionIds: matched ? [condition.id, ...child.conditionIds] : [],
      eventIds: child.eventIds,
    };
  }
  const events = replayPrivilegedDataBundle(loaded).knownEvents.filter(
    (event) => event.knownAt === point && event.knownAt > start,
  );
  let matchedEvents: ReplayKnownEvent[] = [];
  let matched = false;
  if (condition.type === "NextLifecycleTransition") {
    matchedEvents = events.filter((event) => event.kind === "lifecycleTransition");
    matched =
      matchedEvents.length > 0 ||
      analysisStateBefore(loaded, point)?.lifecycle.currentState !==
        latestAnalysisStateAt(loaded, point).lifecycle.currentState;
  } else if (condition.type === "LifecycleStateEntered") {
    matchedEvents = events.filter(
      (event) =>
        event.kind === "lifecycleTransition" && event.lifecycleState === condition.state,
    );
    matched =
      matchedEvents.length > 0 ||
      (latestAnalysisStateAt(loaded, point).lifecycle.currentState === condition.state &&
        analysisStateBefore(loaded, point)?.lifecycle.currentState !== condition.state);
  } else if (condition.type === "StructureEventConfirmed") {
    matchedEvents = events.filter(
      (event) =>
        event.kind === "structure" &&
        event.timeframe === condition.timeframe &&
        event.eventType === condition.eventType &&
        event.direction === condition.direction,
    );
    matched = matchedEvents.length > 0;
  } else if (condition.type === "AvwapEventConfirmed") {
    matchedEvents = events.filter(
      (event) =>
        event.kind === "avwap" &&
        event.eventType === condition.eventType &&
        (condition.avwapId == null || event.avwapId === condition.avwapId),
    );
    matched = matchedEvents.length > 0;
  } else if (condition.type === "RelativeStrengthEventConfirmed") {
    matchedEvents = events.filter(
      (event) =>
        event.kind === "relativeStrength" &&
        event.eventType === condition.eventType &&
        (condition.timeframe == null || event.timeframe === condition.timeframe),
    );
    matched = matchedEvents.length > 0;
  } else if (condition.type === "RadarOrLifecycleTerminal") {
    matchedEvents = events.filter(
      (event) => event.kind === "radarTerminal" || event.kind === "lifecycleTerminal",
    );
    matched = matchedEvents.length > 0;
  } else if (condition.type === "PriceCrossesKnownLevel") {
    const previous = latestCloseBefore(loaded, condition.timeframe, point);
    const current = latestCloseAt(loaded, condition.timeframe, point);
    matched =
      previous != null &&
      current != null &&
      (condition.direction === "above"
        ? previous < condition.frozenPrice && current >= condition.frozenPrice
        : previous > condition.frozenPrice && current <= condition.frozenPrice);
  } else if (condition.type === "PriceEntersKnownZone") {
    const previous = latestCloseBefore(loaded, condition.timeframe, point);
    const current = latestCloseAt(loaded, condition.timeframe, point);
    const inside = (value: number) =>
      value >= condition.frozenLowerBound && value <= condition.frozenUpperBound;
    matched = previous != null && current != null && !inside(previous) && inside(current);
  }
  const matchedEventIds = matchedEvents.map((event) => event.id);
  audit.conditionEvaluations.push({
    conditionId: condition.id,
    effectiveAsOf: point,
    matched,
    matchedEventIds,
  });
  return {
    matched,
    conditionIds: matched ? [condition.id] : [],
    eventIds: matchedEventIds,
  };
}

function configuredTerminalAt(
  loaded: ReplayLoadedCase,
  point: number,
  after: number,
): ReplayTerminalReason | null {
  const events = replayPrivilegedDataBundle(loaded).knownEvents.filter(
    (event) => event.knownAt === point && event.knownAt > after,
  );
  if (
    loaded.sessionConfig.endOnRadarEpisodeTerminal &&
    events.some((event) => event.kind === "radarTerminal")
  ) return "RADAR_EPISODE_TERMINAL";
  if (
    loaded.sessionConfig.endOnLifecycleTerminal &&
    (events.some((event) => event.kind === "lifecycleTerminal") ||
      ["invalidated", "expired"].includes(latestAnalysisStateAt(loaded, point).lifecycle.currentState))
  ) return "LIFECYCLE_TERMINAL";
  return null;
}

function latestCloseAt(loaded: ReplayLoadedCase, timeframe: string, asOf: number) {
  return selectedReplayCandlesAt(
    replayPrivilegedDataBundle(loaded).candlesByTimeframe[timeframe] ?? [],
    asOf,
  ).at(-1)?.c ?? null;
}

function latestCloseBefore(loaded: ReplayLoadedCase, timeframe: string, asOf: number) {
  const candles = replayPrivilegedDataBundle(loaded).candlesByTimeframe[timeframe] ?? [];
  const knowledgePoints = candles
    .map((candle) => Math.max(candle.closeTime, candle.knownAt))
    .filter((point) => point < asOf);
  if (!knowledgePoints.length) return null;
  return latestCloseAt(loaded, timeframe, Math.max(...knowledgePoints));
}

async function prepareOutcomeReveal(
  loaded: ReplayLoadedCase,
  session: ReplaySession,
  command: Extract<ReplayCommand, { type: "RevealOutcome" }>,
  outcomeStore?: ReplayOutcomeStore,
) {
  if (!outcomeStore) throw new Error("Outcome reveal requires a separate ReplayOutcomeStore");
  const normalTerminal = ["Skipped", "TradePlanRecorded", "CaseWindowEnded", "Abandoned"].includes(
    session.state,
  );
  const early = session.state === "Active";
  if (early && (!command.payload.abandonActive || !loaded.sessionConfig.allowEarlyReveal)) {
    throw new Error("Active replay reveal requires configured explicit abandon-and-reveal");
  }
  if (!normalTerminal && !early) throw new Error(`Outcome cannot be revealed from ${session.state}`);
  const revealedAt = session.currentAsOf ?? loaded.manifest.startAsOf;
  const envelope = await outcomeStore.revealCaseOutcome({
    sessionId: session.id,
    manifestId: session.manifestId,
    revealedAt,
    revealedBeforeDecisionCompletion: early,
  });
  validateOutcomeEnvelope(session, envelope, early);
  return { envelope, early, revealedAt };
}

function validateOutcomeEnvelope(
  session: ReplaySession,
  envelope: ReplayOutcomeEnvelope,
  early: boolean,
) {
  const { id: _ignored, ...definition } = envelope;
  if (
    envelope.schemaVersion !== REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION ||
    envelope.id !== `replay-outcome:${canonicalHash(definition).slice("fnv1a64:".length)}` ||
    envelope.sessionId !== session.id ||
    envelope.manifestId !== session.manifestId ||
    envelope.revealedBeforeDecisionCompletion !== early
  ) {
    throw new Error("Outcome envelope failed boundary or identity verification");
  }
}

export function serializeReplaySession(session: ReplaySession): string {
  validateSessionIntegrity(session);
  assertNoFutureOutcomePayload(session);
  for (const frame of session.frames) assertFrameCutoff(frame);
  return canonicalSerialize(session);
}

export function deserializeReplaySession(serialized: string): ReplaySession {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("Serialized replay session must be an object");
  }
  const session = parsed as ReplaySession;
  validateSessionIntegrity(session);
  assertNoFutureOutcomePayload(session);
  for (const frame of session.frames) assertFrameCutoff(frame);
  return immutableJsonClone(session);
}

export async function resumeReplaySession(
  serialized: string,
  loaded: ReplayLoadedCase,
): Promise<ReplaySession> {
  const session = deserializeReplaySession(serialized);
  validateLoadedIdentity(loaded);
  assertSessionMatchesLoaded(session, loaded);
  const reconstructed = reconstructReplaySession(session);
  if (canonicalSerialize(reconstructed) !== canonicalSerialize(session)) {
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  }
  if (session.currentAsOf != null && session.currentFrameId != null) {
    const current = requireCurrentFrame(session);
    const frameEventIndex = session.events.findIndex((event) => event.frame?.id === current.id);
    if (frameEventIndex < 0) throw new Error("Current replay frame is absent from the event log");
    let sessionAtFrame = replaySessionFromIdentity(replaySessionIdentity(session));
    for (const event of session.events.slice(0, frameEventIndex)) {
      sessionAtFrame = applyReplayEvent(sessionAtFrame, event);
    }
    const frameEvent = session.events[frameEventIndex]!;
    let verifiedWakeResult = current.activeWakeResult;
    if (frameEvent.command.type === "Wait") {
      const submittedFrame = requireCurrentFrame(sessionAtFrame);
      if (!frameEvent.wakePlan || !frameEvent.wakeResult) {
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      }
      validateWakePlan(
        loaded,
        sessionAtFrame,
        submittedFrame,
        frameEvent.wakePlan,
      );
      const advanced = await advanceReplayWait(
        loaded,
        sessionAtFrame,
        submittedFrame,
        frameEvent.wakePlan,
      );
      if (
        canonicalSerialize(advanced.wakeResult) !== canonicalSerialize(frameEvent.wakeResult) ||
        advanced.requestedAsOf !== current.requestedAsOf ||
        advanced.effectiveAsOf !== current.effectiveAsOf ||
        advanced.state !== frameEvent.stateAfter ||
        advanced.terminalReason !== frameEvent.terminalReasonAfter
      ) {
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      }
      verifiedWakeResult = advanced.wakeResult;
    }
    if (frameEvent.decisionRecord) {
      sessionAtFrame = immutableJsonClone({
        ...sessionAtFrame,
        decisionRecords: [...sessionAtFrame.decisionRecords, frameEvent.decisionRecord],
      });
    }
    const recreated = await createDecisionFrame({
      loaded,
      session: sessionAtFrame,
      requestedAsOf: current.requestedAsOf,
      effectiveAsOf: current.effectiveAsOf,
      wakeResult: verifiedWakeResult,
    });
    if (recreated.id !== current.id) {
      throw new Error("Replay resume data does not reproduce the current DecisionFrame");
    }
  }
  return session;
}

export function reconstructReplaySession(session: ReplaySession): ReplaySession {
  let reconstructed = replaySessionFromIdentity(replaySessionIdentity(session));
  const commandIds = new Set<string>();
  for (const event of session.events) {
    if (commandIds.has(event.command.id)) throw new Error("Replay event log repeats a command id");
    commandIds.add(event.command.id);
    validateReplayCommand(reconstructed, event.command);
    reconstructed = applyReplayEvent(reconstructed, event);
  }
  return reconstructed;
}

function replaySessionFromIdentity(identity: ReplaySessionIdentity): ReplaySession {
  return withSessionIntegrity({
    ...identity,
    revision: 0,
    state: "Created",
    currentAsOf: null,
    currentFrameId: null,
    frames: [],
    decisionRecords: [],
    planningAttempts: [],
    events: [],
    terminalReason: null,
    revealedBeforeDecisionCompletion: false,
    revealedOutcomeEnvelopeId: null,
  });
}

function replaySessionIdentity(session: ReplaySession): ReplaySessionIdentity {
  return immutableJsonClone({
    schemaVersion: session.schemaVersion,
    id: session.id,
    replayEngineVersion: session.replayEngineVersion,
    manifestId: session.manifestId,
    manifestSchemaVersion: session.manifestSchemaVersion,
    radarEpisodeId: session.radarEpisodeId,
    radarEpisodeObservationId: session.radarEpisodeObservationId,
    radarSelectionProfileRef: session.radarSelectionProfileRef,
    strategyProfileRef: session.strategyProfileRef,
    lifecycleVersion: session.lifecycleVersion,
    lifecycleConfigHash: session.lifecycleConfigHash,
    sessionConfigRef: session.sessionConfigRef,
    marketDataBundleFingerprint: session.marketDataBundleFingerprint,
    venueRulesRef: session.venueRulesRef,
    createdAtLogicalTime: session.createdAtLogicalTime,
  });
}

function withSessionIntegrity(
  session: Omit<ReplaySession, "integrityHash"> | ReplaySession,
): ReplaySession {
  const { integrityHash: _ignored, ...definition } = session as ReplaySession;
  return immutableJsonClone({ ...definition, integrityHash: canonicalHash(definition) });
}

function validateSessionIntegrity(session: ReplaySession) {
  if (
    session.schemaVersion !== REPLAY_SESSION_SCHEMA_VERSION ||
    session.replayEngineVersion !== REPLAY_ENGINE_VERSION
  ) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash, ...definition } = session;
  if (integrityHash !== canonicalHash(definition)) throw new Error("Replay session integrity mismatch");
  if (session.revision !== session.events.length) throw new Error("Replay revision does not match event count");
}

function validateLoadedIdentity(loaded: ReplayLoadedCase) {
  if (
    replaySessionConfigHash(loaded.sessionConfig) !== loaded.sessionConfig.canonicalConfigHash ||
    loaded.sessionConfig.replayEngineVersion !== REPLAY_ENGINE_VERSION ||
    loaded.manifest.radarEpisodeId !== loaded.dataBundle.radarEpisode.id ||
    loaded.manifest.radarEpisodeObservationId !== loaded.dataBundle.radarEpisode.observationId ||
    loaded.manifest.selectionProfileRef.canonicalConfigHash !==
      loaded.radarSelectionProfile.canonicalConfigHash ||
    loaded.manifest.strategyProfileRef.profileHash !== loaded.strategyProfile.profileHash
  ) {
    throw new Error("Loaded replay case identity is inconsistent");
  }
}

function assertSessionMatchesLoaded(session: ReplaySession, loaded: ReplayLoadedCase) {
  if (
    session.id !== replaySessionId(loaded) ||
    session.manifestId !== loaded.manifest.id ||
    session.radarEpisodeId !== loaded.dataBundle.radarEpisode.id ||
    session.radarEpisodeObservationId !== loaded.dataBundle.radarEpisode.observationId ||
    session.radarSelectionProfileRef.hash !== loaded.radarSelectionProfile.canonicalConfigHash ||
    session.strategyProfileRef.hash !== loaded.strategyProfile.profileHash ||
    session.lifecycleVersion !== loaded.strategyProfile.lifecycleVersion ||
    session.lifecycleConfigHash !== loaded.strategyProfile.lifecycleConfigHash ||
    session.sessionConfigRef.hash !== loaded.sessionConfig.canonicalConfigHash ||
    session.marketDataBundleFingerprint !== loaded.dataBundle.causalPrefixFingerprint ||
    canonicalSerialize(session.venueRulesRef) !== canonicalSerialize(loaded.sessionConfig.venueRulesRef)
  ) {
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
  }
}

function assertFrameCutoff(frame: ReplayDecisionFrame) {
  if (
    frame.decisionSnapshot.effectiveAsOf !== frame.effectiveAsOf ||
    frame.generatedAtLogicalTime !== frame.effectiveAsOf
  ) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const candles of Object.values(frame.visibleCandlesByTimeframe)) {
    if (candles.some((candle) => candle.closeTime > frame.effectiveAsOf || candle.knownAt > frame.effectiveAsOf)) {
      throw new Error("Replay frame contains a future or incomplete candle");
    }
  }
  assertNoKnowledgeTimestampAfter(frame, frame.effectiveAsOf);
}

function assertNoKnowledgeTimestampAfter(value: unknown, cutoff: number) {
  const visit = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return;
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(entry)) {
      if (key === "knownAt" && typeof child === "number" && child > cutoff) {
        throw new Error("Replay frame contains evidence not known at its cutoff");
      }
      visit(child);
    }
  };
  visit(value);
}

function assertNoFutureOutcomePayload(value: unknown) {
  const forbidden = new Set([
    "futureOutcomeRef",
    "futureCandlesByTimeframe",
    "outcome",
    "maximumFavorablePriceExcursionFromDetected",
    "maximumAdversePriceExcursionFromDetected",
    "radarTerminalResult",
    "lifecycleStateTimestamps",
  ]);
  const visit = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return;
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(entry)) {
      if (forbidden.has(key)) throw new Error(`Public replay session contains forbidden key ${key}`);
      visit(child);
    }
  };
  visit(value);
}

function positiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

function assertTimestamp(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite timestamp`);
  }
}
