import { strictTimeframeToSeconds } from "./data";
import type { ReplayAnalysisStateObservation } from "./replay";
import {
  MATERIALIZED_REPLAY_ENGINE_VERSION,
  REPLAY_ANALYSIS_ENGINE_VERSION,
  materializeReplayAnalysis,
  selectReplayRecordsAt,
  type AvwapAnchorSpec,
  type MaterializeReplayAnalysisInput,
  type ReplayAnalysisState,
} from "./replayAnalysis";
import { canonicalHash, canonicalSerialize, immutableJsonClone } from "./serialization";

export const REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION = "replay-analysis-session.1" as const;
export const REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION =
  "replay-analysis-session-event.1" as const;

export interface ReplayAnalysisSessionEvent {
  schemaVersion: typeof REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION;
  id: string;
  sequence: number;
  kind: "materialized" | "invalidated";
  effectiveAsOf: number;
  analysisStateId: string | null;
  invalidatedStateIds: string[];
  sourceObservationIds: string[];
}

export interface ReplayAnalysisSession {
  schemaVersion: typeof REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION;
  id: string;
  replayEngineVersion: typeof MATERIALIZED_REPLAY_ENGINE_VERSION;
  analysisEngineVersion: typeof REPLAY_ANALYSIS_ENGINE_VERSION;
  revision: number;
  input: Omit<MaterializeReplayAnalysisInput, "asOf">;
  currentRequestedAsOf: number | null;
  currentEffectiveAsOf: number | null;
  states: ReplayAnalysisState[];
  events: ReplayAnalysisSessionEvent[];
  integrityHash: string;
}

export interface ReplayAnalysisSessionUpdates {
  candlesByTimeframe?: MaterializeReplayAnalysisInput["candlesByTimeframe"];
  referenceCandlesByTimeframe?: MaterializeReplayAnalysisInput["referenceCandlesByTimeframe"];
  avwapAnchors?: AvwapAnchorSpec[];
}

export interface ReplayAnalysisCoverageRequirement {
  component: string;
  timeframe: string;
  minimumSamples: number;
  minimumSeconds: number;
}

export interface ReplayAnalysisProvider<TState> {
  readonly replayEngineVersion: string;
  getRequiredCoverage(): ReplayAnalysisCoverageRequirement[];
  materializeAt(asOf: number): TState;
  advanceTo(asOf: number, updates?: ReplayAnalysisSessionUpdates): TState;
  serializeState(): string;
  resumeState(serialized: string): void;
}

const ANALYSIS_CACHE_LIMIT = 128;
const analysisCache = new Map<string, ReplayAnalysisState>();

export function createReplayAnalysisSession(
  input: Omit<MaterializeReplayAnalysisInput, "asOf">,
): ReplayAnalysisSession {
  const frozenInput = immutableJsonClone(input);
  const definition = {
    schemaVersion: REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION,
    id: `replay-analysis-session:${canonicalHash({
      symbol: input.symbol.toUpperCase(),
      source: input.source,
      analysisProfileHash: input.analysisProfile.canonicalConfigHash,
      strategyProfileHash: input.strategyProfile.profileHash,
      radarProfileHash: input.radarSelectionProfile.canonicalConfigHash,
      radarEpisodeId: input.radarEpisode.id,
      referenceMarket: input.analysisProfile.referenceMarketPolicy,
      anchors: input.avwapAnchors ?? [],
    }).slice("fnv1a64:".length)}`,
    replayEngineVersion: MATERIALIZED_REPLAY_ENGINE_VERSION,
    analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
    revision: 0,
    input: frozenInput,
    currentRequestedAsOf: null,
    currentEffectiveAsOf: null,
    states: [],
    events: [],
  };
  return withIntegrity(definition);
}

export function materializeReplayAnalysisAt(
  session: ReplayAnalysisSession,
  asOf: number,
): ReplayAnalysisState {
  validateReplayAnalysisSession(session);
  return materializeWithCache({ ...session.input, asOf });
}

export function advanceReplayAnalysisTo(
  session: ReplayAnalysisSession,
  asOf: number,
  updates: ReplayAnalysisSessionUpdates = {},
): ReplayAnalysisSession {
  validateReplayAnalysisSession(session);
  if (!Number.isFinite(asOf) || asOf < 0) {
    throw new RangeError("Analysis session asOf must be a non-negative finite timestamp");
  }
  const merged = mergeSessionInput(session.input, updates);
  const invalidationBoundary = correctionInvalidationBoundary(
    session.input,
    merged,
    session.input.analysisProfile.executionTimeframe,
  );
  const retainedStates = invalidationBoundary == null
    ? [...session.states]
    : session.states.filter((state) => state.effectiveAsOf < invalidationBoundary);
  const invalidatedStateIds = session.states
    .filter((state) => !retainedStates.some((retained) => retained.id === state.id))
    .map((state) => state.id);
  const events = [...session.events];
  if (invalidatedStateIds.length) {
    events.push(createSessionEvent({
      sequence: events.length,
      kind: "invalidated",
      effectiveAsOf: invalidationBoundary!,
      analysisStateId: null,
      invalidatedStateIds,
      sourceObservationIds: updatedObservationIds(session.input, merged),
    }));
  }

  const lastEffective = retainedStates.at(-1)?.effectiveAsOf ?? -Infinity;
  const evaluationPoints = selectReplayRecordsAt(
    merged.candlesByTimeframe[merged.analysisProfile.executionTimeframe] ?? [],
    asOf,
  )
    .map((candle) => candle.closeTime)
    .filter((point) => point > lastEffective && point <= asOf);
  const states = [...retainedStates];
  for (const point of evaluationPoints) {
    appendState(states, events, materializeWithCache({ ...merged, asOf: point }));
  }
  const final = materializeWithCache({ ...merged, asOf });
  if (states.at(-1)?.id !== final.id) appendState(states, events, final);

  return withIntegrity({
    schemaVersion: REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION,
    id: session.id,
    replayEngineVersion: MATERIALIZED_REPLAY_ENGINE_VERSION,
    analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
    revision: session.revision + 1,
    input: merged,
    currentRequestedAsOf: asOf,
    currentEffectiveAsOf: final.effectiveAsOf,
    states,
    events,
  });
}

export function serializeReplayAnalysisSession(session: ReplayAnalysisSession): string {
  validateReplayAnalysisSession(session);
  return canonicalSerialize(session);
}

export function deserializeReplayAnalysisSession(serialized: string): ReplayAnalysisSession {
  const parsed = JSON.parse(serialized) as ReplayAnalysisSession;
  validateReplayAnalysisSession(parsed);
  return immutableJsonClone(parsed);
}

export function validateReplayAnalysisSession(session: ReplayAnalysisSession) {
  if (
    session.schemaVersion !== REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION ||
    session.replayEngineVersion !== MATERIALIZED_REPLAY_ENGINE_VERSION ||
    session.analysisEngineVersion !== REPLAY_ANALYSIS_ENGINE_VERSION
  ) throw new Error("Unsupported replay analysis session version");
  const { integrityHash: _ignored, ...definition } = session;
  if (session.integrityHash !== canonicalHash(definition)) {
    throw new Error("Replay analysis session failed integrity verification");
  }
  if (session.events.some((event, index) => event.sequence !== index || event.id !== sessionEventId(event))) {
    throw new Error("Replay analysis session event log failed integrity verification");
  }
  const stateIds = session.states.map((state) => state.id);
  if (new Set(stateIds).size !== stateIds.length) {
    throw new Error("Replay analysis session contains duplicate states");
  }
}

export function replayAnalysisRequiredCoverage(
  input: Pick<MaterializeReplayAnalysisInput, "analysisProfile">,
): ReplayAnalysisCoverageRequirement[] {
  const profile = input.analysisProfile;
  return profile.evaluatedTimeframes.flatMap((timeframe) => {
    const seconds = strictTimeframeToSeconds(timeframe);
    const base = [{
      component: `timeframe:${timeframe}`,
      timeframe,
      minimumSamples: Math.max(
        profile.extensionConfig.emaPeriod,
        profile.extensionConfig.atrPeriod + 1,
        profile.structureConfig.pivotStrength * 2 + 1,
      ),
      minimumSeconds: profile.extensionConfig.historyDays * 86_400,
    }];
    if (timeframe === profile.relativeStrengthConfig.timeframe) {
      base.push({
        component: "relativeStrength",
        timeframe,
        minimumSamples: profile.structureConfig.pivotStrength * 2 + 1,
        minimumSeconds: profile.relativeStrengthConfig.maxAgeBars * seconds,
      });
    }
    return base;
  });
}

export class MaterializedReplayAnalysisProvider
  implements ReplayAnalysisProvider<ReplayAnalysisState> {
  readonly replayEngineVersion = MATERIALIZED_REPLAY_ENGINE_VERSION;
  #session: ReplayAnalysisSession;

  constructor(session: ReplayAnalysisSession) {
    validateReplayAnalysisSession(session);
    this.#session = immutableJsonClone(session);
  }

  getRequiredCoverage() {
    return replayAnalysisRequiredCoverage(this.#session.input);
  }

  materializeAt(asOf: number) {
    return materializeReplayAnalysisAt(this.#session, asOf);
  }

  advanceTo(asOf: number, updates: ReplayAnalysisSessionUpdates = {}) {
    this.#session = advanceReplayAnalysisTo(this.#session, asOf, updates);
    return this.#session.states.at(-1)!;
  }

  serializeState() {
    return serializeReplayAnalysisSession(this.#session);
  }

  resumeState(serialized: string) {
    this.#session = deserializeReplayAnalysisSession(serialized);
  }

  snapshot() {
    return immutableJsonClone(this.#session);
  }
}

export class SuppliedObservationReplayAnalysisProvider
  implements ReplayAnalysisProvider<ReplayAnalysisStateObservation> {
  readonly replayEngineVersion = "replay-engine.1";
  readonly #observations: ReplayAnalysisStateObservation[];

  constructor(observations: ReplayAnalysisStateObservation[]) {
    this.#observations = immutableJsonClone([...observations].sort(
      (left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id),
    ));
  }

  getRequiredCoverage() { return []; }

  materializeAt(asOf: number) {
    const latest = this.#observations.filter((item) => item.knownAt <= asOf).at(-1);
    if (!latest) throw new Error(`No supplied replay analysis observation is known at ${asOf}`);
    return immutableJsonClone(latest);
  }

  advanceTo(asOf: number) { return this.materializeAt(asOf); }

  serializeState() { return canonicalSerialize(this.#observations); }

  resumeState(serialized: string) {
    if (canonicalSerialize(JSON.parse(serialized)) !== canonicalSerialize(this.#observations)) {
      throw new Error("Supplied replay analysis observations cannot be replaced during resume");
    }
  }
}

export function clearReplayAnalysisCache() {
  analysisCache.clear();
}

export function replayAnalysisCacheSize() {
  return analysisCache.size;
}

function materializeWithCache(input: MaterializeReplayAnalysisInput) {
  const key = replayAnalysisCacheKey(input);
  const cached = analysisCache.get(key);
  if (cached) {
    analysisCache.delete(key);
    analysisCache.set(key, cached);
    return immutableJsonClone(cached);
  }
  const state = materializeReplayAnalysis(input);
  analysisCache.set(key, state);
  while (analysisCache.size > ANALYSIS_CACHE_LIMIT) {
    const oldest = analysisCache.keys().next().value as string | undefined;
    if (oldest == null) break;
    analysisCache.delete(oldest);
  }
  return immutableJsonClone(state);
}

export function replayAnalysisCacheKey(input: MaterializeReplayAnalysisInput) {
  const effective = latestEvaluationClose(input);
  const causal = (series: Record<string, typeof input.candlesByTimeframe[string]>) =>
    Object.fromEntries(Object.entries(series).map(([timeframe, candles]) => [
      timeframe,
      selectReplayRecordsAt(candles, effective).map((candle) => candle.observationId),
    ]));
  return canonicalHash({
    symbol: input.symbol.toUpperCase(),
    source: input.source,
    referenceMarket: input.analysisProfile.referenceMarketPolicy,
    effectiveAsOf: effective,
    requestedAsOf: input.asOf,
    target: causal(input.candlesByTimeframe),
    reference: causal(input.referenceCandlesByTimeframe),
    analysisProfileHash: input.analysisProfile.canonicalConfigHash,
    lifecycleConfigHash: input.analysisProfile.lifecycleConfigRef.configHash,
    radarProfileHash: input.radarSelectionProfile.canonicalConfigHash,
    strategyProfileHash: input.strategyProfile.profileHash,
    anchors: input.avwapAnchors ?? [],
  });
}

function latestEvaluationClose(input: MaterializeReplayAnalysisInput) {
  const selected = selectReplayRecordsAt(
    input.candlesByTimeframe[input.analysisProfile.executionTimeframe] ?? [],
    input.asOf,
  );
  const latest = selected.at(-1);
  if (!latest) throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
  return latest.closeTime;
}

function appendState(
  states: ReplayAnalysisState[],
  events: ReplayAnalysisSessionEvent[],
  state: ReplayAnalysisState,
) {
  if (states.some((item) => item.id === state.id)) return;
  states.push(state);
  events.push(createSessionEvent({
    sequence: events.length,
    kind: "materialized",
    effectiveAsOf: state.effectiveAsOf,
    analysisStateId: state.id,
    invalidatedStateIds: [],
    sourceObservationIds: analysisSourceObservationIds(state),
  }));
}

function analysisSourceObservationIds(state: ReplayAnalysisState) {
  return [...new Set(Object.values(state.freshnessByComponent)
    .flatMap((freshness) => freshness.sourceObservationIds))].sort();
}

function createSessionEvent(
  input: Omit<ReplayAnalysisSessionEvent, "schemaVersion" | "id">,
): ReplayAnalysisSessionEvent {
  const definition = {
    schemaVersion: REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION,
    ...input,
  };
  return immutableJsonClone({ ...definition, id: sessionEventId(definition) });
}

function sessionEventId(
  event: ReplayAnalysisSessionEvent | Omit<ReplayAnalysisSessionEvent, "id">,
) {
  const { id: _ignored, ...definition } = event as ReplayAnalysisSessionEvent;
  return `replay-analysis-session-event:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

function mergeSessionInput(
  original: ReplayAnalysisSession["input"],
  updates: ReplayAnalysisSessionUpdates,
): ReplayAnalysisSession["input"] {
  const mergeSeries = (
    current: MaterializeReplayAnalysisInput["candlesByTimeframe"],
    incoming: MaterializeReplayAnalysisInput["candlesByTimeframe"] = {},
  ) => Object.fromEntries([...new Set([...Object.keys(current), ...Object.keys(incoming)])].map(
    (timeframe) => {
      const byId = new Map<string, typeof current[string][number]>();
      for (const candle of [...(current[timeframe] ?? []), ...(incoming[timeframe] ?? [])]) {
        byId.set(candle.observationId, candle);
      }
      return [timeframe, [...byId.values()].sort(
        (left, right) => left.openTime - right.openTime || left.knownAt - right.knownAt,
      )];
    },
  ));
  return immutableJsonClone({
    ...original,
    candlesByTimeframe: mergeSeries(original.candlesByTimeframe, updates.candlesByTimeframe),
    referenceCandlesByTimeframe: mergeSeries(
      original.referenceCandlesByTimeframe,
      updates.referenceCandlesByTimeframe,
    ),
    avwapAnchors: updates.avwapAnchors ?? original.avwapAnchors,
  });
}

function correctionInvalidationBoundary(
  previous: ReplayAnalysisSession["input"],
  next: ReplayAnalysisSession["input"],
  executionTimeframe: string,
) {
  const oldIds = new Set([
    ...Object.values(previous.candlesByTimeframe).flat().map((item) => item.observationId),
    ...Object.values(previous.referenceCandlesByTimeframe).flat().map((item) => item.observationId),
  ]);
  const additions = [
    ...Object.values(next.candlesByTimeframe).flat(),
    ...Object.values(next.referenceCandlesByTimeframe).flat(),
  ].filter((item) => !oldIds.has(item.observationId));
  const anchorsChanged = canonicalSerialize(previous.avwapAnchors ?? []) !==
    canonicalSerialize(next.avwapAnchors ?? []);
  const earliestKnownAt = Math.min(
    ...additions.map((item) => item.knownAt),
    ...(anchorsChanged ? (next.avwapAnchors ?? []).map((anchor) => anchor.knownAt) : []),
  );
  if (!Number.isFinite(earliestKnownAt)) return null;
  const seconds = strictTimeframeToSeconds(executionTimeframe);
  return Math.ceil(earliestKnownAt / seconds) * seconds;
}

function updatedObservationIds(
  previous: ReplayAnalysisSession["input"],
  next: ReplayAnalysisSession["input"],
) {
  const oldIds = new Set([
    ...Object.values(previous.candlesByTimeframe).flat().map((item) => item.observationId),
    ...Object.values(previous.referenceCandlesByTimeframe).flat().map((item) => item.observationId),
  ]);
  return [
    ...Object.values(next.candlesByTimeframe).flat(),
    ...Object.values(next.referenceCandlesByTimeframe).flat(),
  ].map((item) => item.observationId).filter((id) => !oldIds.has(id)).sort();
}

function withIntegrity<T extends Omit<ReplayAnalysisSession, "integrityHash">>(
  definition: T,
): ReplayAnalysisSession {
  return immutableJsonClone({
    ...definition,
    integrityHash: canonicalHash(definition),
  }) as ReplayAnalysisSession;
}
