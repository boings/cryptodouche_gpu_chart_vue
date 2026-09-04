import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  type AnchoredVwapSignal,
  type MarketStructureSummary,
  type RelativeStrengthDivergence,
  type SetupStateName,
  type SetupStateSnapshot,
} from "./indicators";
import {
  selectCompletedCandleRevisionsAt,
  strictTimeframeToSeconds,
} from "./data";
import {
  EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  RADAR_EPISODE_SCHEMA_VERSION,
  RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  executionVenueEligibilityObservationId,
  radarEpisodeObservationId,
  radarSelectionProfileHash,
  replayCaseManifestId,
  universeMembershipObservationId,
  type ExecutionVenueEligibilityObservation,
  type RadarEpisode,
  type RadarPathContext,
  type RadarSelectionAnchor,
  type RadarSelectionProfile,
  type ReplayCaseManifest,
  type UniverseMembershipObservation,
} from "./radar";
import {
  canonicalHash,
  canonicalSerialize,
  immutableJsonClone,
  type JsonValue,
} from "./serialization";
import {
  createDecisionSnapshot,
  strategyProfileHash,
  type AnchoredVwapDecisionState,
  type DecisionDataQualityNote,
  type DecisionReferenceLevel,
  type DecisionSnapshot,
  type RelativeStrengthDecisionState,
  type StrategyProfile,
} from "./strategy";
import {
  type VenueRiskRules,
} from "./tradePlanning";
import type { CandidateMetrics, CandleRecord } from "./types";
import { registerReplayPrivilegedDataBundle } from "./replayInternal";

export const REPLAY_ENGINE_VERSION = "replay-engine.1" as const;
export const REPLAY_MATERIALIZED_ENGINE_VERSION = "replay-engine.2" as const;
export type ReplayEngineVersion =
  | typeof REPLAY_ENGINE_VERSION
  | typeof REPLAY_MATERIALIZED_ENGINE_VERSION;
export const REPLAY_SESSION_CONFIG_SCHEMA_VERSION = "replay-session-config.1" as const;
export const REPLAY_SESSION_SCHEMA_VERSION = "replay-session.1" as const;
export const REPLAY_COMMAND_SCHEMA_VERSION = "replay-command.1" as const;
export const REPLAY_EVENT_SCHEMA_VERSION = "replay-event.1" as const;
export const REPLAY_DECISION_FRAME_SCHEMA_VERSION = "replay-decision-frame.1" as const;
export const REPLAY_WAKE_PLAN_SCHEMA_VERSION = "replay-wake-plan.1" as const;
export const REPLAY_WAKE_CONDITION_SCHEMA_VERSION = "replay-wake-condition.1" as const;
export const REPLAY_WAKE_RESULT_SCHEMA_VERSION = "replay-wake-result.1" as const;
export const REPLAY_DATA_BUNDLE_SCHEMA_VERSION = "replay-data-bundle.1" as const;
export const REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION = "replay-outcome-envelope.1" as const;
export const REPLAY_ANALYSIS_STATE_SCHEMA_VERSION = "replay-analysis-state.1" as const;
export const REPLAY_KNOWN_EVENT_SCHEMA_VERSION = "replay-known-event.1" as const;

export type ReplaySessionState =
  | "Created"
  | "Active"
  | "TradePlanRecorded"
  | "Skipped"
  | "CaseWindowEnded"
  | "Abandoned"
  | "Revealed"
  | "Failed";

export type ReplayTerminalReason =
  | "MAXIMUM_CASE_DURATION"
  | "DATA_COVERAGE_ENDED"
  | "RADAR_EPISODE_TERMINAL"
  | "LIFECYCLE_TERMINAL"
  | "OTHER";

export type ReplayWaitReason =
  | "waiting_for_structure_break"
  | "waiting_for_retest"
  | "waiting_for_avwap_failure"
  | "waiting_for_rs_weakness"
  | "waiting_for_stoch_reset"
  | "waiting_for_higher_timeframe_close"
  | "insufficient_trade_geometry"
  | "other";

export type ReplayWakeConditionType =
  | "NextLifecycleTransition"
  | "LifecycleStateEntered"
  | "StructureEventConfirmed"
  | "AvwapEventConfirmed"
  | "RelativeStrengthEventConfirmed"
  | "PriceCrossesKnownLevel"
  | "PriceEntersKnownZone"
  | "RadarOrLifecycleTerminal"
  | "AnyOf";

export interface ReplaySessionConfigDefinition {
  id: string;
  version: string;
  schemaVersion: typeof REPLAY_SESSION_CONFIG_SCHEMA_VERSION;
  replayEngineVersion: ReplayEngineVersion;
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

export interface ReplaySessionConfig
  extends Omit<ReplaySessionConfigDefinition, "evaluationTimeframe"> {
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
  materializedStateRef?: ReplayMaterializedAnalysisStateRef;
}

export interface ReplayMaterializedAnalysisStateRef {
  id: string;
  schemaVersion: string;
  analysisEngineVersion: string;
  analysisProfileHash: string;
  dataBundleFingerprint: string;
}

export interface ReplayMaterializedAnalysisBinding {
  replayEngineVersion: typeof REPLAY_MATERIALIZED_ENGINE_VERSION;
  analysisEngineVersion: string;
  analysisProfileRef: { id: string; version: string; hash: string };
  referenceMarket: { symbol: string; source: string };
  causalDataBundleFingerprint: string;
  lifecycleConfigHash: string;
  radarProfileHash: string;
  strategyProfileHash: string;
}

export type ReplayKnownEventKind =
  | "lifecycleTransition"
  | "structure"
  | "avwap"
  | "relativeStrength"
  | "radarTerminal"
  | "lifecycleTerminal";

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
  detail: { [key: string]: JsonValue };
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
  materializedAnalysisBinding?: ReplayMaterializedAnalysisBinding;
}

export interface LoadReplayCaseInput {
  manifest: ReplayCaseManifest;
  sessionConfig: ReplaySessionConfig;
  historicalDataAdapter: ReplayHistoricalDataAdapter;
  strategyProfile: StrategyProfile;
  radarSelectionProfile: RadarSelectionProfile;
  venueRules?: VenueRiskRules | null;
  materializedAnalysisBinding?: ReplayMaterializedAnalysisBinding;
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

export class InMemoryReplayHistoricalDataAdapter implements ReplayHistoricalDataAdapter {
  readonly #input: InMemoryReplayAdapterInput;

  constructor(input: InMemoryReplayAdapterInput) {
    this.#input = immutableJsonClone({
      ...input,
      analysisStateHistory: input.analysisStateHistory ?? [],
      knownEvents: input.knownEvents ?? [],
      venueEvidence: input.venueEvidence ?? [],
      universeEvidence: input.universeEvidence ?? [],
      revisionHistoryAvailable: input.revisionHistoryAvailable ?? false,
    });
  }

  async getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage> {
    const candles = this.#matchingCandles(query);
    return {
      timeframe: query.timeframe,
      earliestOpenTime: candles[0]?.openTime ?? null,
      latestCloseTime: candles.at(-1)?.closeTime ?? null,
      revisionHistoryAvailable: this.#input.revisionHistoryAvailable ?? false,
    };
  }

  async loadCandleHistory(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    return immutableJsonClone(
      this.#matchingCandles(query).filter(
        (item) => item.openTime >= query.from && item.openTime <= query.to,
      ),
    );
  }

  async loadCandleRevisions(): Promise<ReplayCandleRecord[]> {
    return [];
  }

  async loadAnalysisStateHistory(query: ReplayEvidenceQuery) {
    return immutableJsonClone(
      (this.#input.analysisStateHistory ?? []).filter(
        (item) =>
          sameInstrument(item, query) && item.knownAt >= query.from && item.knownAt <= query.to,
      ),
    );
  }

  async loadKnownEvents(query: ReplayEvidenceQuery) {
    return immutableJsonClone(
      (this.#input.knownEvents ?? []).filter(
        (item) =>
          sameInstrument(item, query) && item.knownAt >= query.from && item.knownAt <= query.to,
      ),
    );
  }

  async loadPointInTimeVenueEvidence(query: ReplayEvidenceQuery) {
    return immutableJsonClone(
      (this.#input.venueEvidence ?? []).filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.marketDataSource === query.source &&
          item.knownAt <= query.to &&
          item.effectiveFrom <= query.to &&
          (item.effectiveTo == null || item.effectiveTo >= query.from),
      ),
    );
  }

  async loadPointInTimeUniverseEvidence(query: ReplayEvidenceQuery) {
    return immutableJsonClone(
      (this.#input.universeEvidence ?? []).filter(
        (item) =>
          sameInstrument(item, query) &&
          item.knownAt <= query.to &&
          item.effectiveFrom <= query.to &&
          (item.effectiveTo == null || item.effectiveTo >= query.from),
      ),
    );
  }

  async loadRadarEpisode(manifestId: string) {
    return immutableJsonClone(
      this.#input.radarEpisodes.find((item) => item.id === manifestId) ?? null,
    );
  }

  #matchingCandles(query: ReplayCoverageQuery) {
    return [...this.#input.candles]
      .filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.source === query.source &&
          item.timeframe === query.timeframe,
      )
      .sort(
        (left, right) =>
          left.openTime - right.openTime ||
          left.knownAt - right.knownAt ||
          left.observationId.localeCompare(right.observationId),
      );
  }
}

export function replaySessionConfigHash(
  config: ReplaySessionConfig | ReplaySessionConfigDefinition,
): string {
  const { canonicalConfigHash: _ignored, ...definition } = config as ReplaySessionConfig;
  return canonicalHash(definition);
}

export function createReplaySessionConfig(
  definition: ReplaySessionConfigDefinition,
  strategyProfile: StrategyProfile,
): ReplaySessionConfig {
  if (
    definition.schemaVersion !== REPLAY_SESSION_CONFIG_SCHEMA_VERSION ||
    !isSupportedReplayEngineVersion(definition.replayEngineVersion)
  ) {
    throw new RangeError("Unsupported replay session configuration version");
  }
  if (!definition.id.trim() || !definition.version.trim()) {
    throw new TypeError("Replay session configuration id and version are required");
  }
  assertStrategyProfileRef(definition.strategyProfileRef, strategyProfile);
  const evaluationTimeframe =
    definition.evaluationTimeframe ?? strategyProfile.timeframeRoles.executionTimeframe;
  strictTimeframeToSeconds(evaluationTimeframe);
  const visibleTimeframes = uniqueTimeframes(definition.visibleTimeframes);
  if (!visibleTimeframes.includes(evaluationTimeframe)) {
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  }
  if (!definition.completedCandlesOnly) {
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  }
  assertPositiveDuration(definition.maximumCaseDuration, "maximumCaseDuration");
  assertPositiveDuration(definition.maximumSingleWaitDuration, "maximumSingleWaitDuration");
  if (
    definition.defaultWaitDeadline != null &&
    (definition.defaultWaitDeadline <= 0 ||
      definition.defaultWaitDeadline > definition.maximumSingleWaitDuration)
  ) {
    throw new RangeError("defaultWaitDeadline must fit within maximumSingleWaitDuration");
  }
  for (const timeframe of visibleTimeframes) {
    const duration = definition.displayPreRollByTimeframe[timeframe];
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError(`Missing non-negative display pre-roll for ${timeframe}`);
    }
  }
  const allowedWakeConditionTypes = [...new Set(definition.allowedWakeConditionTypes)];
  if (!allowedWakeConditionTypes.length) {
    throw new RangeError("At least one wake condition type must be allowed");
  }
  const normalized = {
    ...definition,
    evaluationTimeframe,
    visibleTimeframes,
    displayPreRollByTimeframe: Object.fromEntries(
      Object.entries(definition.displayPreRollByTimeframe).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    allowedWakeConditionTypes,
    defaultWaitDeadline: definition.defaultWaitDeadline ?? null,
    identityPresentationMode: definition.identityPresentationMode ?? null,
    endOnRadarEpisodeTerminal: definition.endOnRadarEpisodeTerminal ?? false,
    endOnLifecycleTerminal: definition.endOnLifecycleTerminal ?? false,
    venueRulesRef: definition.venueRulesRef ?? null,
  };
  return immutableJsonClone({
    ...normalized,
    canonicalConfigHash: replaySessionConfigHash(normalized),
  });
}

export function createDefaultReplaySessionConfig(
  strategyProfile: StrategyProfile,
): ReplaySessionConfig {
  const visibleTimeframes = uniqueTimeframes([
    strategyProfile.timeframeRoles.executionTimeframe,
    strategyProfile.timeframeRoles.structureTimeframe,
    ...strategyProfile.timeframeRoles.contextTimeframes,
  ]);
  return createReplaySessionConfig(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
      replayEngineVersion: REPLAY_ENGINE_VERSION,
      visibleTimeframes,
      displayPreRollByTimeframe: Object.fromEntries(
        visibleTimeframes.map((timeframe) => [
          timeframe,
          Math.max(strictTimeframeToSeconds(timeframe) * 200, 86_400),
        ]),
      ),
      maximumCaseDuration: 72 * 3_600,
      maximumSingleWaitDuration: 24 * 3_600,
      defaultWaitDeadline: 12 * 3_600,
      allowedWakeConditionTypes: [
        "NextLifecycleTransition",
        "LifecycleStateEntered",
        "StructureEventConfirmed",
        "AvwapEventConfirmed",
        "RelativeStrengthEventConfirmed",
        "PriceCrossesKnownLevel",
        "PriceEntersKnownZone",
        "RadarOrLifecycleTerminal",
        "AnyOf",
      ],
      completedCandlesOnly: true,
      identityPresentationMode: "full",
      allowEarlyReveal: false,
      allowOutOfStrategyPlans: false,
      allowDiscretionaryOverrides: true,
      endOnRadarEpisodeTerminal: false,
      endOnLifecycleTerminal: false,
      strategyProfileRef: {
        id: strategyProfile.id,
        version: strategyProfile.version,
        profileHash: strategyProfile.profileHash,
      },
    },
    strategyProfile,
  );
}

export function replayCandleLogicalId(input: {
  symbol: string;
  source: string;
  timeframe: string;
  openTime: number;
}): string {
  return `replay-candle:${input.source}:${input.symbol.toUpperCase()}:${input.timeframe}:${input.openTime}`;
}

export function replayCandleObservationId(
  candle: ReplayCandleRecord | Omit<ReplayCandleRecord, "observationId">,
): string {
  const { observationId: _ignored, ...definition } = candle as ReplayCandleRecord;
  return `replay-candle-observation:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

export function createReplayCandleRecord(input: CreateReplayCandleInput): ReplayCandleRecord {
  const timeframeSeconds = strictTimeframeToSeconds(input.timeframe);
  if (!Number.isFinite(input.openTime) || input.openTime < 0) {
    throw new RangeError("Candle openTime must be a non-negative finite timestamp");
  }
  if (input.openTime % timeframeSeconds !== 0) {
    throw new RangeError("Candle openTime must align to its timeframe");
  }
  for (const [name, value] of Object.entries({ o: input.o, h: input.h, l: input.l, c: input.c })) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`Candle ${name} must be positive`);
  }
  if (input.h < Math.max(input.o, input.c) || input.l > Math.min(input.o, input.c)) {
    throw new RangeError("Candle high/low do not contain open and close");
  }
  const closeTime = input.openTime + timeframeSeconds;
  const knownAt = input.knownAt ?? input.correctionPublishedAt ?? closeTime;
  if (!Number.isFinite(knownAt) || knownAt < closeTime) {
    throw new RangeError("Candle knownAt cannot precede its close");
  }
  if (
    input.correctionPublishedAt != null &&
    (!Number.isFinite(input.correctionPublishedAt) ||
      input.correctionPublishedAt < closeTime ||
      input.correctionPublishedAt > knownAt)
  ) {
    throw new RangeError("Correction publication time must fall between closeTime and knownAt");
  }
  if (input.revision != null && (!Number.isInteger(input.revision) || input.revision < 0)) {
    throw new RangeError("Candle revision must be a non-negative integer");
  }
  const definition = {
    logicalCandleId: replayCandleLogicalId(input),
    symbol: input.symbol.toUpperCase(),
    source: input.source,
    timeframe: input.timeframe,
    openTime: input.openTime,
    closeTime,
    o: input.o,
    h: input.h,
    l: input.l,
    c: input.c,
    vBase: input.vBase ?? null,
    vQuote: input.vQuote ?? null,
    knownAt,
    revision: input.revision ?? null,
    correctionPublishedAt: input.correctionPublishedAt ?? null,
  };
  return immutableJsonClone({ ...definition, observationId: replayCandleObservationId(definition) });
}

export type CreateReplayAnalysisStateInput = Omit<
  ReplayAnalysisStateObservation,
  "schemaVersion" | "id"
>;

export function replayAnalysisStateObservationId(
  observation:
    | ReplayAnalysisStateObservation
    | Omit<ReplayAnalysisStateObservation, "id">,
): string {
  const { id: _ignored, ...definition } = observation as ReplayAnalysisStateObservation;
  return `replay-analysis-state:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

export function createReplayAnalysisStateObservation(
  input: CreateReplayAnalysisStateInput,
): ReplayAnalysisStateObservation {
  assertFiniteTimestamp(input.knownAt, "analysis state knownAt");
  if (input.lifecycle.asOf == null || input.lifecycle.asOf > input.knownAt) {
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  }
  const definition = {
    schemaVersion: REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
    ...input,
    symbol: input.symbol.toUpperCase(),
  };
  return immutableJsonClone({ ...definition, id: replayAnalysisStateObservationId(definition) });
}

export type CreateReplayKnownEventInput = Omit<
  ReplayKnownEvent,
  "schemaVersion" | "id"
>;

export function replayKnownEventId(
  event: ReplayKnownEvent | Omit<ReplayKnownEvent, "id">,
): string {
  const { id: _ignored, ...definition } = event as ReplayKnownEvent;
  return `replay-known-event:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

export function createReplayKnownEvent(input: CreateReplayKnownEventInput): ReplayKnownEvent {
  assertFiniteTimestamp(input.eventTime, "eventTime");
  assertFiniteTimestamp(input.knownAt, "knownAt");
  if (input.knownAt < input.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  if (input.timeframe != null) strictTimeframeToSeconds(input.timeframe);
  const definition = {
    schemaVersion: REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
    ...input,
    symbol: input.symbol.toUpperCase(),
  };
  return immutableJsonClone({ ...definition, id: replayKnownEventId(definition) });
}

export async function loadReplayCase(input: LoadReplayCaseInput): Promise<ReplayLoadedCase> {
  validateReplayProvenance(input);
  const { manifest, sessionConfig: config, historicalDataAdapter: adapter } = input;
  const episode = await adapter.loadRadarEpisode?.(manifest.radarEpisodeId);
  if (!episode) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  validateRadarEpisode(manifest, episode);

  const timeframes = uniqueTimeframes([
    ...config.visibleTimeframes,
    config.evaluationTimeframe,
    ...manifest.preRollRequirements.map((item) => item.timeframe),
  ]);
  const horizon = manifest.startAsOf + config.maximumCaseDuration;
  const analysisStartByTimeframe: Record<string, number> = {};
  const displayStartByTimeframe: Record<string, number> = {};
  const candlesByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const notes: DecisionDataQualityNote[] = [];

  for (const timeframe of timeframes) {
    const requirement = analysisPreRollSeconds(manifest, input.strategyProfile, timeframe);
    const analysisStart = Math.max(0, manifest.startAsOf - requirement);
    const displayDuration = config.displayPreRollByTimeframe[timeframe] ?? 0;
    const displayStart = Math.max(0, manifest.startAsOf - displayDuration);
    analysisStartByTimeframe[timeframe] = analysisStart;
    displayStartByTimeframe[timeframe] = displayStart;
    const coverage = await adapter.getCoverage({
      symbol: manifest.symbol,
      source: manifest.source,
      timeframe,
    });
    if (coverage.timeframe !== timeframe) throw new Error(`Coverage timeframe mismatch for ${timeframe}`);
    if (coverage.earliestOpenTime == null || coverage.earliestOpenTime > analysisStart) {
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${timeframe}`);
    }
    if (coverage.earliestOpenTime > displayStart) {
      notes.push({
        code: "INSUFFICIENT_DISPLAY_PREROLL",
        severity: "warning",
        message: `${timeframe} display history begins after the configured display pre-roll`,
      });
    }
    if (!coverage.revisionHistoryAvailable) {
      notes.push({
        code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
        severity: "warning",
        message: `${timeframe} candle revision history is unavailable`,
      });
    }
    const history = await adapter.loadCandleHistory({
      symbol: manifest.symbol,
      source: manifest.source,
      timeframe,
      from: analysisStart,
      to: horizon,
    });
    const revisions = coverage.revisionHistoryAvailable
      ? await adapter.loadCandleRevisions?.({
          symbol: manifest.symbol,
          source: manifest.source,
          timeframe,
          from: analysisStart,
          to: horizon,
        }) ?? []
      : [];
    candlesByTimeframe[timeframe] = validateReplayCandles(
      [...history, ...revisions].filter((candle) => candle.knownAt <= horizon),
      manifest,
      timeframe,
      analysisStart,
      horizon,
    );
  }

  const evidenceQuery = {
    symbol: manifest.symbol,
    source: manifest.source,
    from: Math.min(...Object.values(analysisStartByTimeframe)),
    to: horizon,
  };
  const analysisStateHistory = validateAnalysisStateHistory(
    (await adapter.loadAnalysisStateHistory?.(evidenceQuery)) ?? [],
    manifest,
  );
  if (!analysisStateHistory.some((item) => item.knownAt <= manifest.startAsOf)) {
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  }
  const knownEvents = validateKnownEvents(
    (await adapter.loadKnownEvents?.(evidenceQuery)) ?? [],
    manifest,
  );
  const venueEvidence = validateVenueEvidence(
    (await adapter.loadPointInTimeVenueEvidence?.(evidenceQuery)) ?? [],
    manifest,
  );
  const universeEvidence = validateUniverseEvidence(
    (await adapter.loadPointInTimeUniverseEvidence?.(evidenceQuery)) ?? [],
    manifest,
  );
  const common = {
    schemaVersion: REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
    symbol: manifest.symbol.toUpperCase(),
    source: manifest.source,
    analysisStartByTimeframe,
    displayStartByTimeframe,
    candlesByTimeframe,
    analysisStateHistory,
    knownEvents,
    venueEvidence,
    universeEvidence,
    radarEpisode: episode,
    dataQualityNotes: notes,
  };
  const internalBundleFingerprint = await replaySha256(common);
  const causalPrefixFingerprint = await causalBundleFingerprint(common, manifest.startAsOf);
  const privilegedDataBundle = immutableJsonClone({
    ...common,
    causalPrefixFingerprint,
    internalBundleFingerprint,
  });
  const dataBundle: ReplayDataBundle = immutableJsonClone({
    ...common,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(candlesByTimeframe).map(([timeframe, candles]) => [
        timeframe,
        candles.filter(
          (candle) =>
            candle.closeTime <= manifest.startAsOf && candle.knownAt <= manifest.startAsOf,
        ),
      ]),
    ),
    analysisStateHistory: analysisStateHistory.filter(
      (item) => item.knownAt <= manifest.startAsOf,
    ),
    knownEvents: knownEvents.filter((item) => item.knownAt <= manifest.startAsOf),
    venueEvidence: venueEvidence.filter((item) => item.knownAt <= manifest.startAsOf),
    universeEvidence: universeEvidence.filter((item) => item.knownAt <= manifest.startAsOf),
    causalPrefixFingerprint,
  });
  const loaded: ReplayLoadedCase = {
    manifest: immutableJsonClone(manifest),
    sessionConfig: immutableJsonClone(config),
    strategyProfile: immutableJsonClone(input.strategyProfile),
    radarSelectionProfile: immutableJsonClone(input.radarSelectionProfile),
    venueRules: immutableJsonClone(input.venueRules ?? null),
    dataBundle,
    ...(input.materializedAnalysisBinding
      ? { materializedAnalysisBinding: immutableJsonClone(input.materializedAnalysisBinding) }
      : {}),
  };
  registerReplayPrivilegedDataBundle(loaded, privilegedDataBundle);
  return loaded;
}

export async function replayDataFingerprintAt(
  loaded: ReplayLoadedCase,
  asOf: number,
): Promise<string> {
  if (asOf > loaded.manifest.startAsOf) {
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  }
  const { causalPrefixFingerprint: _prefix, ...bundle } = loaded.dataBundle;
  return causalBundleFingerprint(bundle, asOf);
}

async function causalBundleFingerprint(
  bundle: Omit<ReplayDataBundle, "causalPrefixFingerprint">,
  asOf: number,
): Promise<string> {
  return replaySha256({
    schemaVersion: bundle.schemaVersion,
    symbol: bundle.symbol,
    source: bundle.source,
    radarEpisode: bundle.radarEpisode,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(bundle.candlesByTimeframe).map(([timeframe, candles]) => [
        timeframe,
        candles.filter((candle) => candle.closeTime <= asOf && candle.knownAt <= asOf),
      ]),
    ),
    analysisStateHistory: bundle.analysisStateHistory.filter((item) => item.knownAt <= asOf),
    knownEvents: bundle.knownEvents.filter((item) => item.knownAt <= asOf),
    venueEvidence: bundle.venueEvidence.filter((item) => item.knownAt <= asOf),
    universeEvidence: bundle.universeEvidence.filter((item) => item.knownAt <= asOf),
    dataQualityNotes: bundle.dataQualityNotes,
  });
}

export async function replaySha256(value: unknown): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto SHA-256 is required");
  const bytes = new TextEncoder().encode(canonicalSerialize(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function validateReplayProvenance(input: LoadReplayCaseInput) {
  const { manifest, sessionConfig: config, strategyProfile, radarSelectionProfile } = input;
  if (
    manifest.schemaVersion !== REPLAY_CASE_MANIFEST_SCHEMA_VERSION ||
    replayCaseManifestId(manifest) !== manifest.id ||
    manifest.futureOutcomeRef !== null
  ) {
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  }
  if (manifest.startAsOf !== manifest.detectedAt) {
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  }
  if (
    radarSelectionProfileHash(radarSelectionProfile) !== radarSelectionProfile.canonicalConfigHash ||
    manifest.selectionProfileRef.id !== radarSelectionProfile.id ||
    manifest.selectionProfileRef.version !== radarSelectionProfile.version ||
    manifest.selectionProfileRef.canonicalConfigHash !== radarSelectionProfile.canonicalConfigHash
  ) {
    throw new Error("Radar selection profile reference mismatch");
  }
  if (
    strategyProfileHash(strategyProfile) !== strategyProfile.profileHash ||
    strategyProfile.lifecycleVersion !== IMPULSE_FADE_LIFECYCLE_VERSION ||
    manifest.lifecycleVersion !== strategyProfile.lifecycleVersion ||
    manifest.strategyProfileRef.id !== strategyProfile.id ||
    manifest.strategyProfileRef.version !== strategyProfile.version ||
    manifest.strategyProfileRef.profileHash !== strategyProfile.profileHash
  ) {
    throw new Error("Strategy profile reference mismatch");
  }
  if (
    config.schemaVersion !== REPLAY_SESSION_CONFIG_SCHEMA_VERSION ||
    !isSupportedReplayEngineVersion(config.replayEngineVersion) ||
    replaySessionConfigHash(config) !== config.canonicalConfigHash
  ) {
    throw new Error("Replay configuration failed version or hash verification");
  }
  if (
    config.replayEngineVersion === REPLAY_MATERIALIZED_ENGINE_VERSION &&
    (!input.materializedAnalysisBinding ||
      input.materializedAnalysisBinding.replayEngineVersion !== REPLAY_MATERIALIZED_ENGINE_VERSION ||
      input.materializedAnalysisBinding.lifecycleConfigHash !== strategyProfile.lifecycleConfigHash ||
      input.materializedAnalysisBinding.radarProfileHash !== radarSelectionProfile.canonicalConfigHash ||
      input.materializedAnalysisBinding.strategyProfileHash !== strategyProfile.profileHash)
  ) {
    throw new Error("Materialized replay configuration is missing its analysis binding");
  }
  if (
    config.replayEngineVersion === REPLAY_ENGINE_VERSION &&
    input.materializedAnalysisBinding
  ) {
    throw new Error("replay-engine.1 cannot accept a materialized analysis binding");
  }
  assertStrategyProfileRef(config.strategyProfileRef, strategyProfile);
  if (config.evaluationTimeframe !== strategyProfile.timeframeRoles.executionTimeframe) {
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  }
  if (config.venueRulesRef && !input.venueRules) {
    throw new Error("Referenced venue rules were not supplied");
  }
  if (config.venueRulesRef && input.venueRules) {
    const supplied = venueRulesReference(input.venueRules);
    if (canonicalSerialize(supplied) !== canonicalSerialize(config.venueRulesRef)) {
      throw new Error("Venue rules reference mismatch");
    }
  }
}

export function isSupportedReplayEngineVersion(value: unknown): value is ReplayEngineVersion {
  return value === REPLAY_ENGINE_VERSION || value === REPLAY_MATERIALIZED_ENGINE_VERSION;
}

function validateRadarEpisode(manifest: ReplayCaseManifest, episode: RadarEpisode) {
  if (
    episode.schemaVersion !== RADAR_EPISODE_SCHEMA_VERSION ||
    episode.id !== manifest.radarEpisodeId ||
    episode.observationId !== manifest.radarEpisodeObservationId ||
    radarEpisodeObservationId(episode) !== episode.observationId ||
    episode.symbol.toUpperCase() !== manifest.symbol.toUpperCase() ||
    episode.source !== manifest.source ||
    episode.detectedAt !== manifest.detectedAt ||
    episode.effectiveAsOf !== manifest.startAsOf
  ) {
    throw new Error("RadarEpisode sidecar does not match the ReplayCaseManifest");
  }
  const causalTimestamps = [
    ...episode.triggeringObservations.flatMap((item) => [item.effectiveAsOf, item.knownAt]),
    ...episode.contextObservations.flatMap((item) => [item.effectiveAsOf, item.knownAt]),
    ...episode.hardGateEvidence.map((item) => item.knownAt),
    episode.selectionAnchor?.timestamp,
    episode.initialLifecycleCandidateRef?.knownAt,
    episode.initialLifecycleStateRef?.knownAt,
    ...Object.values(episode.initialMtfStructure).map((item) => item.knownAt),
  ].filter((value): value is number => value != null);
  if (causalTimestamps.some((value) => !Number.isFinite(value) || value > manifest.startAsOf)) {
    throw new Error("RadarEpisode contains evidence unavailable at replay start");
  }
}

function validateReplayCandles(
  candles: ReplayCandleRecord[],
  manifest: ReplayCaseManifest,
  timeframe: string,
  from: number,
  to: number,
): ReplayCandleRecord[] {
  const deduplicated = new Map<string, ReplayCandleRecord>();
  for (const candle of candles) {
    const rebuilt = createReplayCandleRecord({
      symbol: candle.symbol,
      source: candle.source,
      timeframe: candle.timeframe,
      openTime: candle.openTime,
      o: candle.o,
      h: candle.h,
      l: candle.l,
      c: candle.c,
      vBase: candle.vBase,
      vQuote: candle.vQuote,
      knownAt: candle.knownAt,
      revision: candle.revision,
      correctionPublishedAt: candle.correctionPublishedAt,
    });
    if (
      candle.symbol.toUpperCase() !== manifest.symbol.toUpperCase() ||
      candle.source !== manifest.source ||
      candle.timeframe !== timeframe ||
      candle.openTime < from ||
      candle.openTime > to ||
      candle.logicalCandleId !== replayCandleLogicalId(candle) ||
      candle.observationId !== replayCandleObservationId(candle) ||
      canonicalSerialize(candle) !== canonicalSerialize(rebuilt)
    ) {
      throw new Error(`Invalid replay candle provenance for ${timeframe}`);
    }
    const canonical = canonicalSerialize(candle);
    const existing = deduplicated.get(candle.observationId);
    if (existing && canonicalSerialize(existing) !== canonical) {
      throw new Error(`Conflicting candle observation ${candle.observationId}`);
    }
    deduplicated.set(candle.observationId, candle);
  }
  const validated = [...deduplicated.values()].sort(
    (left, right) =>
      left.openTime - right.openTime ||
      left.knownAt - right.knownAt ||
      left.observationId.localeCompare(right.observationId),
  );
  const revisionKnowledgePoints = validated.some((item) => item.correctionPublishedAt != null)
    ? [...new Set(validated
        .filter((item) => item.correctionPublishedAt != null)
        .map((item) => item.knownAt))]
    : [];
  const latestKnowledgePoint = validated.length
    ? Math.max(...validated.map((item) => item.knownAt))
    : null;
  for (const asOf of [...new Set([
    ...revisionKnowledgePoints,
    ...(latestKnowledgePoint == null ? [] : [latestKnowledgePoint]),
  ])]) {
    selectCompletedCandleRevisionsAt(validated.map(replayCandleToCandle), timeframe, asOf);
  }
  return immutableJsonClone(validated);
}

function validateAnalysisStateHistory(
  history: ReplayAnalysisStateObservation[],
  manifest: ReplayCaseManifest,
): ReplayAnalysisStateObservation[] {
  const sorted = [...history].sort((left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id));
  const byKnownAt = new Map<number, ReplayAnalysisStateObservation>();
  for (const item of sorted) {
    if (
      item.schemaVersion !== REPLAY_ANALYSIS_STATE_SCHEMA_VERSION ||
      item.id !== replayAnalysisStateObservationId(item) ||
      !sameInstrument(item, manifest)
    ) {
      throw new Error("Analysis state observation failed provenance verification");
    }
    const existing = byKnownAt.get(item.knownAt);
    if (existing && canonicalSerialize(existing) !== canonicalSerialize(item)) {
      throw new Error(`Conflicting analysis states at ${item.knownAt}`);
    }
    byKnownAt.set(item.knownAt, item);
  }
  return immutableJsonClone([...byKnownAt.values()]);
}

function validateKnownEvents(
  events: ReplayKnownEvent[],
  manifest: ReplayCaseManifest,
): ReplayKnownEvent[] {
  const result = [...events].sort((left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id));
  const byId = new Map<string, ReplayKnownEvent>();
  for (const event of result) {
    if (
      event.schemaVersion !== REPLAY_KNOWN_EVENT_SCHEMA_VERSION ||
      event.id !== replayKnownEventId(event) ||
      !sameInstrument(event, manifest) ||
      event.knownAt < event.eventTime
    ) {
      throw new Error("Replay known event failed deterministic verification");
    }
    const existing = byId.get(event.id);
    if (existing && canonicalSerialize(existing) !== canonicalSerialize(event)) {
      throw new Error(`Conflicting replay known event ${event.id}`);
    }
    byId.set(event.id, event);
  }
  return immutableJsonClone([...byId.values()]);
}

function validateVenueEvidence(
  evidence: unknown[],
  manifest: ReplayCaseManifest,
): ExecutionVenueEligibilityObservation[] {
  return immutableJsonClone(
    evidence.map((entry) => {
      const item = entry as ExecutionVenueEligibilityObservation;
      if (
        item.schemaVersion !== EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION ||
        item.symbol?.toUpperCase() !== manifest.symbol.toUpperCase() ||
        item.marketDataSource !== manifest.source ||
        !Number.isFinite(item.knownAt) ||
        !Number.isFinite(item.effectiveFrom) ||
        (item.effectiveTo != null &&
          (!Number.isFinite(item.effectiveTo) || item.effectiveTo <= item.effectiveFrom)) ||
        item.observationId !== executionVenueEligibilityObservationId(item)
      ) {
        throw new Error("Execution-venue evidence failed provenance verification");
      }
      return item;
    }).sort((left, right) => left.knownAt - right.knownAt),
  );
}

function validateUniverseEvidence(
  evidence: unknown[],
  manifest: ReplayCaseManifest,
): UniverseMembershipObservation[] {
  return immutableJsonClone(
    evidence.map((entry) => {
      const item = entry as UniverseMembershipObservation;
      if (
        item.schemaVersion !== RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION ||
        item.symbol?.toUpperCase() !== manifest.symbol.toUpperCase() ||
        item.source !== manifest.source ||
        !Number.isFinite(item.knownAt) ||
        !Number.isFinite(item.effectiveFrom) ||
        (item.effectiveTo != null &&
          (!Number.isFinite(item.effectiveTo) || item.effectiveTo <= item.effectiveFrom)) ||
        item.observationId !== universeMembershipObservationId(item)
      ) {
        throw new Error("Universe evidence failed provenance verification");
      }
      return item;
    }).sort((left, right) => left.knownAt - right.knownAt),
  );
}

function replayCandleToCandle(candle: ReplayCandleRecord): CandleRecord {
  return {
    bucket: candle.openTime,
    ts: candle.openTime,
    x: candle.openTime,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    v_base: candle.vBase ?? undefined,
    v_quote: candle.vQuote ?? undefined,
    ver: candle.revision ?? undefined,
    knownAt: candle.knownAt,
  };
}

function analysisPreRollSeconds(
  manifest: ReplayCaseManifest,
  profile: StrategyProfile,
  timeframe: string,
): number {
  const declared = manifest.preRollRequirements
    .filter((item) => item.timeframe === timeframe)
    .reduce(
      (maximum, item) =>
        Math.max(
          maximum,
          item.minimumDurationSeconds,
          item.minimumBars * strictTimeframeToSeconds(timeframe),
        ),
      0,
    );
  const roleDuration =
    timeframe === profile.timeframeRoles.candidateTimeframe
      ? 180 * 86_400
      : timeframe === profile.timeframeRoles.structureTimeframe ||
          profile.timeframeRoles.contextTimeframes.includes(timeframe)
        ? 90 * 86_400
        : strictTimeframeToSeconds(timeframe) * 250;
  return Math.max(declared, roleDuration);
}

function venueRulesReference(rules: VenueRiskRules): ReplayVersionedReference {
  return {
    id: `${rules.venue}:${rules.symbol}`,
    version: rules.feeSchedule.version,
    hash: canonicalHash(rules),
  };
}

function assertStrategyProfileRef(ref: ReplayStrategyProfileRef, profile: StrategyProfile) {
  if (
    ref.id !== profile.id ||
    ref.version !== profile.version ||
    ref.profileHash !== profile.profileHash
  ) {
    throw new Error("Replay strategy profile reference mismatch");
  }
}

function uniqueTimeframes(timeframes: readonly string[]): string[] {
  const result: string[] = [];
  for (const timeframe of timeframes) {
    strictTimeframeToSeconds(timeframe);
    if (!result.includes(timeframe)) result.push(timeframe);
  }
  if (!result.length) throw new RangeError("At least one timeframe is required");
  return result;
}

function assertPositiveDuration(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new RangeError(`${name} must be a positive integer number of seconds`);
  }
}

function assertFiniteTimestamp(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite timestamp`);
  }
}

function sameInstrument(
  left: { symbol: string; source: string },
  right: { symbol: string; source: string },
) {
  return left.symbol.toUpperCase() === right.symbol.toUpperCase() && left.source === right.source;
}
