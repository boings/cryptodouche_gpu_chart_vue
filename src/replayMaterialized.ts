import type { ImpulseFadeTimelineConfig } from "./indicators";
import {
  REPLAY_MATERIALIZED_ENGINE_VERSION,
  createReplayAnalysisStateObservation,
  createReplayKnownEvent,
  createReplaySessionConfig,
  loadReplayCase,
  type LoadReplayCaseInput,
  type ReplayAnalysisStateObservation,
  type ReplayCandleQuery,
  type ReplayCandleRecord,
  type ReplayCoverageQuery,
  type ReplayDataCoverage,
  type ReplayEvidenceQuery,
  type ReplayHistoricalDataAdapter,
  type ReplayKnownEvent,
  type ReplayLoadedCase,
  type ReplaySessionConfig,
  type ReplaySessionConfigDefinition,
} from "./replay";
import {
  MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  MATERIALIZED_REPLAY_ENGINE_VERSION,
  REPLAY_ANALYSIS_ENGINE_VERSION,
  materializeReplayAnalysis,
  replayAnalysisAvwapDecisionState,
  replayAnalysisRelativeStrengthDecisionState,
  replayAnalysisSupportResistanceReferences,
  selectReplayRecordsAt,
  type AvwapAnchorSpec,
  type ReplayAnalysisProfile,
  type ReplayAnalysisState,
} from "./replayAnalysis";
import type { ReplayAnalysisDataAdapter } from "./replayAnalysisJsonAdapter";
import { registerReplayTimelineMaterializer } from "./replayInternal";
import {
  ensureReplayAnalysisThrough,
  replayPrivilegedDataBundle,
} from "./replayInternal";
import type { ReplayCaseOutcome } from "./replaySession";
import { canonicalHash, immutableJsonClone, type JsonValue } from "./serialization";
import type { StrategyProfile } from "./strategy";

export interface LoadMaterializedReplayCaseInput
  extends Omit<LoadReplayCaseInput, "sessionConfig" | "materializedAnalysisBinding"> {
  sessionConfig: ReplaySessionConfig;
  analysisDataAdapter: ReplayAnalysisDataAdapter;
  analysisProfile: ReplayAnalysisProfile;
  avwapAnchors?: AvwapAnchorSpec[];
  lifecycleConfig?: ImpulseFadeTimelineConfig;
}

export function createMaterializedReplaySessionConfig(
  definition: Omit<ReplaySessionConfigDefinition, "replayEngineVersion"> & {
    replayEngineVersion?: typeof REPLAY_MATERIALIZED_ENGINE_VERSION;
  },
  strategyProfile: StrategyProfile,
): ReplaySessionConfig {
  return createReplaySessionConfig({
    ...definition,
    replayEngineVersion: REPLAY_MATERIALIZED_ENGINE_VERSION,
  }, strategyProfile);
}

export async function loadMaterializedReplayCase(
  input: LoadMaterializedReplayCaseInput,
): Promise<ReplayLoadedCase> {
  if (input.sessionConfig.replayEngineVersion !== REPLAY_MATERIALIZED_ENGINE_VERSION) {
    throw new RangeError("Materialized replay loading requires replay-engine.2");
  }
  if (
    input.analysisProfile.executionTimeframe !== input.sessionConfig.evaluationTimeframe ||
    input.analysisProfile.canonicalConfigHash === "" ||
    input.analysisProfile.lifecycleConfigRef.configHash !== input.strategyProfile.lifecycleConfigHash
  ) throw new Error("Materialized replay analysis/profile configuration mismatch");

  const horizon = input.manifest.startAsOf + input.sessionConfig.maximumCaseDuration;
  const referenceSymbol = input.analysisProfile.referenceMarketPolicy.symbol;
  const referenceSource = input.analysisProfile.referenceMarketPolicy.source ?? input.manifest.source;
  const targetBaseByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const targetRevisionsByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const referenceByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const referenceRevisionsByTimeframe: Record<string, ReplayCandleRecord[]> = {};
  const targetCoverage: Record<string, ReplayDataCoverage> = {};

  for (const timeframe of input.analysisProfile.evaluatedTimeframes) {
    const targetQuery = { symbol: input.manifest.symbol, source: input.manifest.source, timeframe };
    const referenceQuery = { symbol: referenceSymbol, source: referenceSource, timeframe };
    const [coverage, referenceCoverage] = await Promise.all([
      input.analysisDataAdapter.getCoverage(targetQuery),
      input.analysisDataAdapter.getCoverage(referenceQuery),
    ]);
    targetCoverage[timeframe] = coverage;
    const requiredStart = Math.max(
      0,
      input.manifest.startAsOf - materializedHistorySeconds(input, timeframe),
    );
    const targetRange = rangeFromCoverage(targetQuery, coverage, requiredStart, horizon);
    const referenceRange = rangeFromCoverage(referenceQuery, referenceCoverage, requiredStart, horizon);
    targetBaseByTimeframe[timeframe] = targetRange
      ? await input.analysisDataAdapter.loadCandles(targetRange)
      : [];
    targetRevisionsByTimeframe[timeframe] = targetRange
      ? await input.analysisDataAdapter.loadCandleRevisions(targetRange)
      : [];
    referenceByTimeframe[timeframe] = referenceRange
      ? await input.analysisDataAdapter.loadReferenceCandles(referenceRange)
      : [];
    referenceRevisionsByTimeframe[timeframe] = referenceRange
      ? await input.analysisDataAdapter.loadReferenceCandleRevisions(referenceRange)
      : [];
  }

  const targetByTimeframe = combineSeries(targetBaseByTimeframe, targetRevisionsByTimeframe);
  const referenceCombined = combineSeries(referenceByTimeframe, referenceRevisionsByTimeframe);
  const materializationBase = {
    symbol: input.manifest.symbol,
    source: input.manifest.source,
    candlesByTimeframe: targetByTimeframe,
    referenceCandlesByTimeframe: referenceCombined,
    avwapAnchors: input.avwapAnchors,
    radarEpisode: await requireRadarEpisode(input.historicalDataAdapter, input.manifest.radarEpisodeId),
    radarSelectionProfile: input.radarSelectionProfile,
    strategyProfile: input.strategyProfile,
    analysisProfile: input.analysisProfile,
    lifecycleConfig: input.lifecycleConfig,
  };
  const points = new Set<number>([input.manifest.startAsOf]);
  for (const candle of selectReplayRecordsAt(
    targetByTimeframe[input.analysisProfile.executionTimeframe] ?? [],
    horizon,
  )) {
    if (candle.closeTime >= input.manifest.startAsOf && candle.closeTime <= horizon) {
      points.add(candle.closeTime);
    }
  }
  const evaluationPoints = [...points].sort((left, right) => left - right);
  const states: ReplayAnalysisState[] = [];
  const observations: ReplayAnalysisStateObservation[] = [];
  let knownEvents: ReplayKnownEvent[] = [];
  let materializedThroughIndex = -1;
  const materializeThrough = async (asOf: number) => {
    while (
      materializedThroughIndex + 1 < evaluationPoints.length &&
      evaluationPoints[materializedThroughIndex + 1]! <= asOf
    ) {
      materializedThroughIndex += 1;
      const state = materializeReplayAnalysis({
        ...materializationBase,
        asOf: evaluationPoints[materializedThroughIndex]!,
        includeIndicatorSeries: false,
        includeComponentProvenance: false,
      });
      states.push(state);
      observations.push(materializedStateToReplayObservation(state));
    }
    knownEvents = materializedAnalysisKnownEvents(states);
    return { analysisStateHistory: observations, knownEvents };
  };
  await materializeThrough(input.manifest.startAsOf);
  const startState = states.find((state) => state.effectiveAsOf === input.manifest.startAsOf) ??
    states[0];
  if (!startState) throw new Error("No materialized analysis state exists at replay start");
  const bindingStartState = (input.avwapAnchors ?? []).some((anchor) => anchor.type === "manual")
    ? materializeReplayAnalysis({
        ...materializationBase,
        avwapAnchors: (input.avwapAnchors ?? []).filter((anchor) => anchor.type !== "manual"),
        asOf: startState.effectiveAsOf,
        includeIndicatorSeries: false,
        includeComponentProvenance: false,
      })
    : startState;

  const adapter = new MaterializedHistoryAdapter({
    evidence: input.historicalDataAdapter,
    targetBaseByTimeframe,
    targetRevisionsByTimeframe,
    targetCoverage,
    observations,
    knownEvents,
    radarEpisode: materializationBase.radarEpisode,
  });
  const loaded = await loadReplayCase({
    manifest: input.manifest,
    sessionConfig: input.sessionConfig,
    historicalDataAdapter: adapter,
    strategyProfile: input.strategyProfile,
    radarSelectionProfile: input.radarSelectionProfile,
    venueRules: input.venueRules,
    materializedAnalysisBinding: {
      replayEngineVersion: REPLAY_MATERIALIZED_ENGINE_VERSION,
      analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
      analysisProfileRef: {
        id: input.analysisProfile.id,
        version: input.analysisProfile.version,
        hash: input.analysisProfile.canonicalConfigHash,
      },
      referenceMarket: { symbol: referenceSymbol, source: referenceSource },
      // Runtime manual anchors are append-only analysis actions. They must not
      // replace the immutable case/session binding established at detection.
      causalDataBundleFingerprint: bindingStartState.dataBundleFingerprint,
      lifecycleConfigHash: input.strategyProfile.lifecycleConfigHash,
      radarProfileHash: input.radarSelectionProfile.canonicalConfigHash,
      strategyProfileHash: input.strategyProfile.profileHash,
    },
  });
  registerReplayTimelineMaterializer(loaded, { materializeThrough });
  return loaded;
}

/** Materialize reveal-only outcome data without exposing the privileged bundle. */
export async function materializeReplayCaseOutcome(
  loaded: ReplayLoadedCase,
): Promise<ReplayCaseOutcome> {
  const start = loaded.manifest.startAsOf;
  const horizon = start + loaded.sessionConfig.maximumCaseDuration;
  await ensureReplayAnalysisThrough(loaded, horizon);
  const bundle = replayPrivilegedDataBundle(loaded);
  const selectedByTimeframe = Object.fromEntries(
    Object.entries(bundle.candlesByTimeframe).map(([timeframe, candles]) => [
      timeframe,
      selectReplayRecordsAt(candles, horizon),
    ]),
  );
  const futureCandlesByTimeframe = Object.fromEntries(
    Object.entries(selectedByTimeframe).map(([timeframe, candles]) => [
      timeframe,
      candles.filter((candle) => candle.closeTime > start && candle.knownAt <= horizon),
    ]),
  );
  const lifecycleTimeline = bundle.analysisStateHistory
    .filter((item) => item.knownAt >= start && item.knownAt <= horizon)
    .map((item) => ({ knownAt: item.knownAt, state: item.lifecycle.currentState }));
  const lifecycleStateTimestamps: ReplayCaseOutcome["lifecycleStateTimestamps"] = {};
  for (const item of lifecycleTimeline) {
    if (lifecycleStateTimestamps[item.state] == null) {
      lifecycleStateTimestamps[item.state] = item.knownAt;
    }
  }
  const evaluationCandles = selectedByTimeframe[loaded.sessionConfig.evaluationTimeframe] ?? [];
  const startPrice = evaluationCandles
    .filter((candle) => candle.closeTime <= start && candle.knownAt <= start)
    .at(-1)?.c ?? null;
  const futureEvaluationCandles = futureCandlesByTimeframe[
    loaded.sessionConfig.evaluationTimeframe
  ] ?? [];
  const radarTerminalEvents = bundle.knownEvents.filter((event) =>
    (event.kind === "radarTerminal" || event.kind === "lifecycleTerminal") &&
    event.knownAt >= start && event.knownAt <= horizon);

  return immutableJsonClone({
    futureCandlesByTimeframe,
    lifecycleTimeline,
    radarTerminalResult: radarTerminalEvents.length
      ? jsonObject({ events: radarTerminalEvents })
      : null,
    maximumFavorablePriceExcursionFromDetected: startPrice && futureEvaluationCandles.length
      ? ((startPrice - Math.min(...futureEvaluationCandles.map((candle) => candle.l))) / startPrice) * 100
      : null,
    maximumAdversePriceExcursionFromDetected: startPrice && futureEvaluationCandles.length
      ? ((Math.max(...futureEvaluationCandles.map((candle) => candle.h)) - startPrice) / startPrice) * 100
      : null,
    lifecycleStateTimestamps,
    dataQualityNotes: bundle.dataQualityNotes,
  });
}

export function materializedStateToReplayObservation(
  state: ReplayAnalysisState,
): ReplayAnalysisStateObservation {
  const zones = replayAnalysisSupportResistanceReferences(state);
  const avwapState = replayAnalysisAvwapDecisionState(state);
  return createReplayAnalysisStateObservation({
    symbol: state.symbol,
    source: state.source,
    knownAt: state.effectiveAsOf,
    lifecycle: state.lifecycleResult,
    candidateMetrics: state.candidateMetrics,
    structureByTimeframe: Object.fromEntries(
      Object.entries(state.structureByTimeframe).map(([timeframe, structure]) => [
        timeframe,
        structure.observation.value.summary,
      ]),
    ),
    activeStructureLevels: state.activeStructureLevels,
    supportResistanceZones: zones,
    avwapState,
    avwapEvents: state.avwapEvents.map((event) => event.value),
    relativeStrengthState: replayAnalysisRelativeStrengthDecisionState(state),
    relativeStrengthEvents: state.relativeStrengthEvents.map((event) => event.value),
    visibleOrSelectedReferenceLevels: [
      ...state.activeStructureLevels,
      ...zones,
      ...(avwapState ? [avwapState.reference] : []),
    ],
    dataQualityNotes: state.dataQualityNotes,
    materializedStateRef: {
      id: state.id,
      schemaVersion: MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
      analysisEngineVersion: state.analysisEngineVersion,
      analysisProfileHash: state.analysisProfileRef.hash,
      dataBundleFingerprint: state.dataBundleFingerprint,
    },
  });
}

export function materializedAnalysisKnownEvents(
  states: ReplayAnalysisState[],
): ReplayKnownEvent[] {
  const events = new Map<string, ReplayKnownEvent>();
  const add = (event: ReplayKnownEvent) => events.set(event.id, event);
  for (const state of states) {
    for (const item of state.structureEvents) {
      if (item.evaluatedAt !== state.effectiveAsOf) continue;
      add(createReplayKnownEvent({
        symbol: state.symbol,
        source: state.source,
        kind: "structure",
        eventType: item.value.label,
        direction: item.value.direction,
        timeframe: item.timeframe,
        lifecycleState: null,
        avwapId: null,
        eventTime: item.eventTime,
        knownAt: state.effectiveAsOf,
        detail: jsonObject({ observationId: item.observationId, rawKnownAt: item.knownAt, value: item.value }),
      }));
    }
    for (const item of state.relativeStrengthEvents) {
      if (item.evaluatedAt !== state.effectiveAsOf) continue;
      add(createReplayKnownEvent({
        symbol: state.symbol,
        source: state.source,
        kind: "relativeStrength",
        eventType: item.value.signal,
        direction: item.value.direction,
        timeframe: item.timeframe,
        lifecycleState: null,
        avwapId: null,
        eventTime: item.eventTime,
        knownAt: state.effectiveAsOf,
        detail: jsonObject({ observationId: item.observationId, rawKnownAt: item.knownAt, value: item.value }),
      }));
    }
    for (const item of state.avwapEvents) {
      if (item.evaluatedAt !== state.effectiveAsOf) continue;
      const suffix = `:${item.value.kind}:${item.eventTime}`;
      const avwapId = item.logicalId.startsWith("avwap-event:") && item.logicalId.endsWith(suffix)
        ? item.logicalId.slice("avwap-event:".length, -suffix.length)
        : null;
      add(createReplayKnownEvent({
        symbol: state.symbol,
        source: state.source,
        kind: "avwap",
        eventType: item.value.kind,
        direction: item.value.kind === "loss" || item.value.kind === "failedReclaim"
          ? "bearish"
          : "bullish",
        timeframe: item.timeframe,
        lifecycleState: null,
        avwapId,
        eventTime: item.eventTime,
        knownAt: state.effectiveAsOf,
        detail: jsonObject({ observationId: item.observationId, rawKnownAt: item.knownAt, value: item.value }),
      }));
    }
    for (const transition of state.lifecycleResult.transitions) {
      if (transition.knownAt !== state.effectiveAsOf) continue;
      add(createReplayKnownEvent({
        symbol: state.symbol,
        source: state.source,
        kind: "lifecycleTransition",
        eventType: `${transition.from}->${transition.to}`,
        direction: null,
        timeframe: state.lifecycleResult.executionTimeframe,
        lifecycleState: transition.to,
        avwapId: null,
        eventTime: transition.knownAt,
        knownAt: state.effectiveAsOf,
        detail: jsonObject(transition),
      }));
    }
  }
  return immutableJsonClone([...events.values()].sort(
    (left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id),
  ));
}

interface MaterializedHistoryAdapterInput {
  evidence: ReplayHistoricalDataAdapter;
  targetBaseByTimeframe: Record<string, ReplayCandleRecord[]>;
  targetRevisionsByTimeframe: Record<string, ReplayCandleRecord[]>;
  targetCoverage: Record<string, ReplayDataCoverage>;
  observations: ReplayAnalysisStateObservation[];
  knownEvents: ReplayKnownEvent[];
  radarEpisode: Awaited<ReturnType<typeof requireRadarEpisode>>;
}

class MaterializedHistoryAdapter implements ReplayHistoricalDataAdapter {
  readonly #input: MaterializedHistoryAdapterInput;

  constructor(input: MaterializedHistoryAdapterInput) {
    this.#input = input;
  }

  async getCoverage(query: ReplayCoverageQuery) {
    return immutableJsonClone(this.#input.targetCoverage[query.timeframe] ?? {
      timeframe: query.timeframe,
      earliestOpenTime: null,
      latestCloseTime: null,
      revisionHistoryAvailable: false,
    });
  }

  async loadCandleHistory(query: ReplayCandleQuery) {
    return range(this.#input.targetBaseByTimeframe[query.timeframe] ?? [], query);
  }

  async loadCandleRevisions(query: ReplayCandleQuery) {
    return range(this.#input.targetRevisionsByTimeframe[query.timeframe] ?? [], query);
  }

  async loadAnalysisStateHistory(query: ReplayEvidenceQuery) {
    return immutableJsonClone(this.#input.observations.filter((item) =>
      item.symbol === query.symbol.toUpperCase() &&
      item.source === query.source &&
      item.knownAt >= query.from && item.knownAt <= query.to));
  }

  async loadKnownEvents(query: ReplayEvidenceQuery) {
    return immutableJsonClone(this.#input.knownEvents.filter((item) =>
      item.symbol === query.symbol.toUpperCase() &&
      item.source === query.source &&
      item.knownAt >= query.from && item.knownAt <= query.to));
  }

  async loadPointInTimeVenueEvidence(query: ReplayEvidenceQuery) {
    return this.#input.evidence.loadPointInTimeVenueEvidence?.(query) ?? [];
  }

  async loadPointInTimeUniverseEvidence(query: ReplayEvidenceQuery) {
    return this.#input.evidence.loadPointInTimeUniverseEvidence?.(query) ?? [];
  }

  async loadRadarEpisode(id: string) {
    return id === this.#input.radarEpisode.id
      ? immutableJsonClone(this.#input.radarEpisode)
      : null;
  }
}

function range(candles: ReplayCandleRecord[], query: ReplayCandleQuery) {
  return immutableJsonClone(candles.filter((candle) =>
    candle.symbol === query.symbol.toUpperCase() &&
    candle.source === query.source &&
    candle.timeframe === query.timeframe &&
    candle.openTime >= query.from && candle.openTime <= query.to));
}

async function requireRadarEpisode(adapter: ReplayHistoricalDataAdapter, id: string) {
  const episode = await adapter.loadRadarEpisode?.(id);
  if (!episode) throw new Error("Exact RadarEpisode sidecar is required for materialized replay");
  return episode;
}

function rangeFromCoverage(
  query: ReplayCoverageQuery,
  coverage: ReplayDataCoverage,
  requiredStart: number,
  to: number,
): ReplayCandleQuery | null {
  return coverage.earliestOpenTime == null
    ? null
    : { ...query, from: Math.max(coverage.earliestOpenTime, requiredStart), to };
}

function materializedHistorySeconds(
  input: LoadMaterializedReplayCaseInput,
  timeframe: string,
) {
  const declared = input.manifest.preRollRequirements
    .filter((item) => item.timeframe === timeframe)
    .reduce((maximum, item) => Math.max(
      maximum,
      item.minimumDurationSeconds,
      item.minimumBars * timeframeSeconds(timeframe),
    ), 0);
  const roles = input.strategyProfile.timeframeRoles;
  const roleDuration = timeframe === roles.candidateTimeframe
    ? input.analysisProfile.extensionConfig.historyDays * 86_400
    : timeframe === roles.structureTimeframe || roles.contextTimeframes.includes(timeframe)
      ? 90 * 86_400
      : timeframeSeconds(timeframe) * 250;
  return Math.max(declared, roleDuration);
}

function timeframeSeconds(timeframe: string) {
  const match = /^(\d+)(m|h|d)$/i.exec(timeframe);
  if (!match) throw new RangeError(`Unsupported materialized replay timeframe ${timeframe}`);
  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  return value * (unit === "m" ? 60 : unit === "h" ? 3_600 : 86_400);
}

function combineSeries(
  base: Record<string, ReplayCandleRecord[]>,
  revisions: Record<string, ReplayCandleRecord[]>,
) {
  return Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(revisions)])].map(
    (timeframe) => [timeframe, Object.freeze([
      ...(base[timeframe] ?? []),
      ...(revisions[timeframe] ?? []),
    ]) as unknown as ReplayCandleRecord[]],
  ));
}

function jsonObject(value: unknown): { [key: string]: JsonValue } {
  return immutableJsonClone(value) as { [key: string]: JsonValue };
}
