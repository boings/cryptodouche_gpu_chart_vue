import {
  computeAnchoredVwapLine,
  computeAnchoredVwapSignals,
  computeAnchoredVwapSnapshot,
  computeAtrLine,
  computeEmaLine,
  computeExtensionSnapshot,
  computeMarketStructure,
  computeRelativeCumulativeReturnLine,
  computeRelativeStrengthDivergences,
  computeStochRsi,
  computeStructureActiveLevels,
  computeSupportResistanceZonesFromSwings,
  evaluateImpulseFadeSnapshot,
  impulseFadeLifecycleConfigHash,
  type AnchoredVwapSignal,
  type ExtensionSnapshotOptions,
  type ImpulseFadeCandidateMetricObservation,
  type ImpulseFadeTimelineConfig,
  type MarketStructureOptions,
  type MarketStructureState,
  type RelativeStrengthDivergence,
  type RelativeStrengthDivergenceOptions,
  type SetupStateSnapshot,
  type StructureActiveLevel,
  type SupportResistanceZone,
  type SupportResistanceZoneFromSwingsOptions,
  type SwingPoint,
} from "./indicators";
import { selectCompletedCandleRevisionsAt, strictTimeframeToSeconds } from "./data";
import type { RadarEpisode, RadarSelectionProfile } from "./radar";
import {
  createDecisionReferenceLevel,
  type AnchoredVwapDecisionState,
  type DecisionDataQualityNote,
  type DecisionReferenceLevel,
  type RelativeStrengthDecisionState,
  type StrategyProfile,
} from "./strategy";
import {
  canonicalHash,
  canonicalSerialize,
  immutableJsonClone,
  type JsonValue,
} from "./serialization";
import {
  REPLAY_MATERIALIZED_ENGINE_VERSION,
  replayCandleObservationId,
  type ReplayCandleRecord,
} from "./replay";
import type { CandidateMetrics, CandleRecord } from "./types";

export const MATERIALIZED_REPLAY_ENGINE_VERSION = REPLAY_MATERIALIZED_ENGINE_VERSION;
export const REPLAY_ANALYSIS_ENGINE_VERSION = "replay-analysis-engine.1" as const;
export const REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION = "replay-analysis-profile.1" as const;
// replay-analysis-state.1 is retained by replay-engine.1 for supplied observations.
export const MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION =
  "replay-analysis-state.2" as const;
export const REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION =
  "replay-analysis-observation.1" as const;
export const REPLAY_ANALYSIS_FRAME_SCHEMA_VERSION = "replay-analysis-frame.1" as const;
export const REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION =
  "replay-analysis-data-bundle.1" as const;
export const AVWAP_ANCHOR_SCHEMA_VERSION = "avwap-anchor-spec.1" as const;
export const RELATIVE_STRENGTH_FORMULA_VERSION = "relative-ratio.1" as const;

export type ReplayAnalysisComponentStatus =
  | "available"
  | "insufficientHistory"
  | "missingSynchronizedReferenceData"
  | "unavailable";

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
  analysisProfileRef: { id: string; version: string; hash: string };
  lifecycleConfigRef: { version: string; configHash: string };
  radarProfileRef: { id: string; version: string; hash: string };
  strategyProfileRef: { id: string; version: string; hash: string };
  referenceMarket: { symbol: string; source: string };
  dataBundleFingerprint: string;
  candidateMetrics: CandidateMetrics;
  extensionContext: Record<string, ReturnType<typeof computeExtensionSnapshot>>;
  indicatorSeries: Record<
    string,
    {
      ema: ReplayAnalysisLinePoint[];
      atr: ReplayAnalysisLinePoint[];
      stochRsi: { k: ReplayAnalysisLinePoint[]; d: ReplayAnalysisLinePoint[] } | null;
      configurationHash: string;
    }
  >;
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
}

interface SelectedSeries {
  replay: ReplayCandleRecord[];
  candles: CandleRecord[];
}

const DEFAULT_EXTENSION_CONFIG: Required<ExtensionSnapshotOptions> = {
  windowSeconds: 86_400,
  historyDays: 180,
  minSamples: 20,
  emaPeriod: 20,
  atrPeriod: 14,
};

const DEFAULT_STRUCTURE_CONFIG: Required<MarketStructureOptions> = {
  lookback: 500,
  pivotStrength: 3,
  atrPeriod: 14,
  minMoveAtr: 0.75,
  maxSwings: 120,
  maxBreaks: 24,
};

export function replayAnalysisProfileHash(
  profile: ReplayAnalysisProfile | ReplayAnalysisProfileDefinition,
): string {
  const { canonicalConfigHash: _ignored, ...definition } = profile as ReplayAnalysisProfile;
  return canonicalHash(definition);
}

export function createReplayAnalysisProfile(
  definition: ReplayAnalysisProfileDefinition,
  strategyProfile?: StrategyProfile,
): ReplayAnalysisProfile {
  if (
    definition.schemaVersion !== REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION ||
    definition.analysisEngineVersion !== REPLAY_ANALYSIS_ENGINE_VERSION
  ) {
    throw new RangeError("Unsupported replay analysis profile version");
  }
  if (!definition.id.trim() || !definition.version.trim()) {
    throw new TypeError("Replay analysis profile id and version are required");
  }
  const evaluatedTimeframes = uniqueTimeframes(definition.evaluatedTimeframes);
  if (!evaluatedTimeframes.includes(definition.executionTimeframe)) {
    throw new RangeError("The execution timeframe must be evaluated");
  }
  for (const timeframe of [
    ...evaluatedTimeframes,
    ...definition.contextTimeframes,
    definition.stochasticRsiConfig.timeframe,
    definition.relativeStrengthConfig.timeframe,
  ]) strictTimeframeToSeconds(timeframe);
  if (!definition.completedCandlesOnly) {
    throw new RangeError("Replay analysis requires completedCandlesOnly=true");
  }
  if (
    definition.referenceMarketPolicy.allowForwardFill ||
    !definition.referenceMarketPolicy.requireExactCompletedCloseAlignment ||
    definition.alignmentPolicy !== "exactCompletedClose"
  ) {
    throw new RangeError("Analysis engine 1 requires exact reference-bar alignment");
  }
  if (
    strategyProfile &&
    (definition.executionTimeframe !== strategyProfile.timeframeRoles.executionTimeframe ||
      definition.lifecycleConfigRef.configHash !== strategyProfile.lifecycleConfigHash)
  ) {
    throw new RangeError("Analysis profile does not match strategy timeframe/lifecycle roles");
  }
  const normalized = immutableJsonClone({
    ...definition,
    evaluatedTimeframes,
    contextTimeframes: uniqueTimeframes(definition.contextTimeframes),
    referenceMarketPolicy: {
      ...definition.referenceMarketPolicy,
      symbol: definition.referenceMarketPolicy.symbol.toUpperCase(),
    },
  });
  return immutableJsonClone({
    ...normalized,
    canonicalConfigHash: replayAnalysisProfileHash(normalized),
  });
}

export function createExperimentalReplayAnalysisProfile(
  strategyProfile: StrategyProfile,
  overrides: Partial<ReplayAnalysisProfileDefinition> = {},
): ReplayAnalysisProfile {
  const evaluatedTimeframes = uniqueTimeframes([
    strategyProfile.timeframeRoles.executionTimeframe,
    strategyProfile.timeframeRoles.structureTimeframe,
    ...strategyProfile.timeframeRoles.contextTimeframes,
  ]);
  const lifecycleConfigHash = strategyProfile.lifecycleConfigHash;
  return createReplayAnalysisProfile(
    {
      id: "impulse_fade_v1.replay-analysis.experimental",
      version: "1",
      schemaVersion: REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION,
      analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
      symbolSourcePolicy: { marketType: "perp", requireConfiguredSource: true },
      referenceMarketPolicy: {
        symbol: "BTCUSDT",
        source: null,
        requireExactCompletedCloseAlignment: true,
        allowForwardFill: false,
      },
      evaluatedTimeframes,
      executionTimeframe: strategyProfile.timeframeRoles.executionTimeframe,
      contextTimeframes: strategyProfile.timeframeRoles.contextTimeframes,
      extensionConfig: DEFAULT_EXTENSION_CONFIG,
      stochasticRsiConfig: {
        timeframe: strategyProfile.timeframeRoles.executionTimeframe,
        rsiPeriod: 14,
        stochPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      },
      structureConfig: DEFAULT_STRUCTURE_CONFIG,
      supportResistanceConfig: {
        maxZones: 6,
        thicknessBps: 10,
        latestX: 0,
        referencePrice: null,
        zonesPerSide: 3,
      },
      relativeStrengthConfig: {
        ...DEFAULT_STRUCTURE_CONFIG,
        timeframe: strategyProfile.timeframeRoles.executionTimeframe,
        formulaVersion: RELATIVE_STRENGTH_FORMULA_VERSION,
        minDeltaPct: 0.5,
        maxAgeBars: 240,
        maxDivergences: 16,
        includeDivergences: true,
        includeLeads: true,
        includeBreaks: true,
      },
      avwapConfig: { maxSignals: 20, priceBasis: "typical", volumeBasis: "baseThenQuote" },
      lifecycleConfigRef: {
        version: "impulse_fade_v1.lifecycle.1",
        configHash: lifecycleConfigHash,
      },
      completedCandlesOnly: true,
      missingDataPolicy: "componentUnavailable",
      alignmentPolicy: "exactCompletedClose",
      correctionPolicy: "latestKnownRevisionAtCutoff",
      ...overrides,
    },
    strategyProfile,
  );
}

export function materializeReplayAnalysis(
  input: MaterializeReplayAnalysisInput,
): ReplayAnalysisState {
  validateMaterializationInput(input);
  const effectiveAsOf = effectiveReplayAnalysisAsOf(input);
  const profile = input.analysisProfile;
  const symbol = input.symbol.toUpperCase();
  const referenceSymbol = profile.referenceMarketPolicy.symbol;
  const referenceSource = profile.referenceMarketPolicy.source ?? input.source;
  const selectedByTimeframe: Record<string, SelectedSeries> = {};
  const referenceByTimeframe: Record<string, SelectedSeries> = {};
  for (const timeframe of profile.evaluatedTimeframes) {
    selectedByTimeframe[timeframe] = selectedSeriesAt(
      input.candlesByTimeframe[timeframe] ?? [],
      timeframe,
      effectiveAsOf,
    );
    referenceByTimeframe[timeframe] = selectedSeriesAt(
      input.referenceCandlesByTimeframe[timeframe] ?? [],
      timeframe,
      effectiveAsOf,
    );
  }

  const dataBundleFingerprint = canonicalHash({
    schemaVersion: REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION,
    symbol,
    source: input.source,
    referenceSymbol,
    referenceSource,
    effectiveAsOf,
    targetObservationIds: observationIdsByTimeframe(selectedByTimeframe),
    referenceObservationIds: observationIdsByTimeframe(referenceByTimeframe),
    anchorObservationIds: (input.avwapAnchors ?? [])
      .filter((anchor) => anchor.knownAt <= effectiveAsOf)
      .map((anchor) => anchor.anchorCandleObservationId)
      .sort(),
  });
  const componentConfigHash = canonicalHash({
    analysisEngineVersion: profile.analysisEngineVersion,
    profileHash: profile.canonicalConfigHash,
  });

  const extensionContext: ReplayAnalysisState["extensionContext"] = {};
  const indicatorSeries: ReplayAnalysisState["indicatorSeries"] = {};
  const structureByTimeframe: ReplayAnalysisState["structureByTimeframe"] = {};
  const structureEvents: ReplayAnalysisState["structureEvents"] = [];
  const activeStructureLevels: DecisionReferenceLevel[] = [];
  const supportResistanceZones: ReplayAnalysisState["supportResistanceZones"] = [];
  const freshnessByComponent: Record<string, ReplayAnalysisFreshness> = {};
  const notes: DecisionDataQualityNote[] = [];
  const rawZones: SupportResistanceZone[] = [];

  for (const timeframe of profile.evaluatedTimeframes) {
    const selected = selectedByTimeframe[timeframe]!;
    const extension = computeExtensionSnapshot(selected.candles, profile.extensionConfig);
    extensionContext[timeframe] = extension;
    const stoch =
      timeframe === profile.stochasticRsiConfig.timeframe
        ? computeStochRsi(
            selected.candles,
            profile.stochasticRsiConfig.rsiPeriod,
            profile.stochasticRsiConfig.stochPeriod,
            profile.stochasticRsiConfig.kPeriod,
            profile.stochasticRsiConfig.dPeriod,
          )
        : null;
    indicatorSeries[timeframe] = {
      ema: linePoints(computeEmaLine(selected.candles, profile.extensionConfig.emaPeriod)),
      atr: linePoints(computeAtrLine(selected.candles, profile.extensionConfig.atrPeriod)),
      stochRsi: stoch ? { k: linePoints(stoch.k), d: linePoints(stoch.d) } : null,
      configurationHash: canonicalHash({
        extension: profile.extensionConfig,
        stochasticRsi:
          timeframe === profile.stochasticRsiConfig.timeframe
            ? profile.stochasticRsiConfig
            : null,
      }),
    };

    const structure = computeMarketStructure(selected.candles, profile.structureConfig);
    const structureConfigHash = canonicalHash(profile.structureConfig);
    const structureObservation = createAnalysisObservation({
      logicalId: `market-structure:${input.source}:${symbol}:${timeframe}`,
      component: `structure:${timeframe}`,
      timeframe,
      eventTime: structure.summary.updatedTs ?? effectiveAsOf,
      knownAt: Math.max(
        structure.summary.lastBreak?.knownAt ?? 0,
        structure.summary.lastSwingHigh?.knownAt ?? 0,
        structure.summary.lastSwingLow?.knownAt ?? 0,
      ) || effectiveAsOf,
      evaluatedAt: effectiveAsOf,
      configurationHash: structureConfigHash,
      sourceObservationIds: selected.replay.map((candle) => candle.observationId),
      value: structure,
    });
    structureByTimeframe[timeframe] = { timeframe, observation: structureObservation };
    for (const event of structure.breaks) {
      structureEvents.push(createAnalysisObservation({
        logicalId: structureEventLogicalId(input.source, symbol, timeframe, event),
        component: "structureEvent",
        timeframe,
        eventTime: event.eventTime,
        knownAt: event.knownAt,
        evaluatedAt: eventEvaluationAsOf(event.knownAt, profile.executionTimeframe),
        configurationHash: structureConfigHash,
        sourceObservationIds: sourceIdsThrough(selected, event.knownAt),
        value: event,
      }));
    }
    for (const level of computeStructureActiveLevels(structure)) {
      activeStructureLevels.push(structureLevelReference(input, timeframe, level));
    }

    const latest = selected.candles.at(-1);
    const zoneConfig = {
      ...profile.supportResistanceConfig,
      latestX: latest?.x ?? 0,
      referencePrice: latest?.c ?? null,
    };
    const zones = computeSupportResistanceZonesFromSwings(structure.swings, zoneConfig);
    rawZones.push(...zones);
    const zoneConfigHash = canonicalHash(profile.supportResistanceConfig);
    for (const zone of zones) {
      const origins = originatingSwings(structure.swings, zone, input, timeframe);
      supportResistanceZones.push(createAnalysisObservation({
        logicalId: `sr-zone:${input.source}:${symbol}:${timeframe}:${zone.kind}:${origins[0] ?? zone.eventTime}`,
        component: "supportResistanceZone",
        timeframe,
        eventTime: zone.eventTime,
        knownAt: zone.knownAt,
        evaluatedAt: effectiveAsOf,
        configurationHash: zoneConfigHash,
        sourceObservationIds: sourceIdsThrough(selected, zone.knownAt),
        value: { ...zone, originatingSwingIds: origins },
      }));
    }

    const componentKey = `timeframe:${timeframe}`;
    freshnessByComponent[componentKey] = freshnessFor(
      componentKey,
      effectiveAsOf,
      selected,
      componentConfigHash,
      minimumRequiredSamples(profile, timeframe),
    );
    freshnessByComponent[`extension:${timeframe}`] = freshnessFor(
      `extension:${timeframe}`,
      effectiveAsOf,
      selected,
      canonicalHash(profile.extensionConfig),
      Math.max(
        profile.extensionConfig.emaPeriod,
        profile.extensionConfig.atrPeriod + 1,
        Math.ceil(profile.extensionConfig.windowSeconds / strictTimeframeToSeconds(timeframe)) + 1,
      ),
    );
    freshnessByComponent[`structure:${timeframe}`] = freshnessFor(
      `structure:${timeframe}`,
      effectiveAsOf,
      selected,
      structureConfigHash,
      profile.structureConfig.pivotStrength * 2 + 1,
    );
    freshnessByComponent[`supportResistance:${timeframe}`] = freshnessFor(
      `supportResistance:${timeframe}`,
      effectiveAsOf,
      selected,
      zoneConfigHash,
      profile.structureConfig.pivotStrength * 2 + 1,
    );
    if (timeframe === profile.stochasticRsiConfig.timeframe) {
      const stochRequired =
        profile.stochasticRsiConfig.rsiPeriod +
        profile.stochasticRsiConfig.stochPeriod +
        profile.stochasticRsiConfig.kPeriod +
        profile.stochasticRsiConfig.dPeriod - 3;
      freshnessByComponent[`stochRsi:${timeframe}`] = freshnessFor(
        `stochRsi:${timeframe}`,
        effectiveAsOf,
        selected,
        canonicalHash(profile.stochasticRsiConfig),
        stochRequired,
      );
    }
    if (!selected.candles.length) {
      notes.push(componentNote("ANALYSIS_COMPONENT_UNAVAILABLE", componentKey, "No completed candles"));
    }
  }

  const candidateTimeframe = input.strategyProfile.timeframeRoles.candidateTimeframe;
  const candidateSelected = selectedByTimeframe[candidateTimeframe] ?? selectedSeriesAt(
    input.candlesByTimeframe[candidateTimeframe] ?? [],
    candidateTimeframe,
    effectiveAsOf,
  );
  const candidateMetrics = candidateMetricsAt(
    input,
    candidateTimeframe,
    candidateSelected,
    effectiveAsOf,
  );
  for (const reason of candidateMetrics.insufficientDataReasons) {
    notes.push(componentNote(reason.code, `extension:${candidateTimeframe}`, reason.message));
  }
  freshnessByComponent.candidateMetrics = {
    ...freshnessFor(
      "candidateMetrics",
      effectiveAsOf,
      candidateSelected,
      canonicalHash(profile.extensionConfig),
      profile.extensionConfig.minSamples,
    ),
    status: candidateMetrics.insufficientDataReasons.length
      ? "insufficientHistory"
      : "available",
  };

  const rsTimeframe = profile.relativeStrengthConfig.timeframe;
  const rsTarget = selectedByTimeframe[rsTimeframe] ?? selectedSeriesAt(
    input.candlesByTimeframe[rsTimeframe] ?? [],
    rsTimeframe,
    effectiveAsOf,
  );
  const rsReference = referenceByTimeframe[rsTimeframe] ?? selectedSeriesAt(
    input.referenceCandlesByTimeframe[rsTimeframe] ?? [],
    rsTimeframe,
    effectiveAsOf,
  );
  const relativeStrength = materializeRelativeStrength(
    input,
    rsTimeframe,
    rsTarget,
    rsReference,
    referenceSource,
    effectiveAsOf,
  );
  const relativeStrengthEvents = relativeStrength.status === "available"
    ? computeRelativeStrengthDivergences(
        rsTarget.candles,
        rsReference.candles,
        profile.relativeStrengthConfig,
      ).map((event) => {
        const referenceKnownAt = rsReference.replay.find(
          (candle) => candle.openTime === event.bucket,
        )?.knownAt ?? event.knownAt;
        const knownAt = Math.max(event.knownAt, referenceKnownAt);
        return createAnalysisObservation({
          logicalId: `rs-event:${input.source}:${symbol}:${rsTimeframe}:${event.kind}:${event.bucket}`,
          component: "relativeStrengthEvent",
          timeframe: rsTimeframe,
          eventTime: event.eventTime,
          knownAt,
          evaluatedAt: eventEvaluationAsOf(
            knownAt,
            input.analysisProfile.executionTimeframe,
          ),
          configurationHash: canonicalHash(profile.relativeStrengthConfig),
          sourceObservationIds: alignedSourceIdsThrough(rsTarget, rsReference, knownAt),
          value: { ...event, knownAt },
        });
      })
    : [];
  freshnessByComponent.relativeStrength = freshnessForRelativeStrength(
    effectiveAsOf,
    rsTarget,
    rsReference,
    relativeStrength.status,
    canonicalHash(profile.relativeStrengthConfig),
  );
  if (relativeStrength.status !== "available") {
    notes.push(componentNote(
      relativeStrength.status === "missingSynchronizedReferenceData"
        ? "MISSING_SYNCHRONIZED_REFERENCE_DATA"
        : "ANALYSIS_COMPONENT_UNAVAILABLE",
      "relativeStrength",
      "RS-vs-BTC requires exact completed target/reference bar alignment",
    ));
  }

  const avwap = materializeAvwap(input, selectedByTimeframe, effectiveAsOf);
  notes.push(...avwap.notes);
  freshnessByComponent.avwap = avwap.freshness;

  const candidateHistory = candidateMetricHistory(
    input,
    candidateTimeframe,
    effectiveAsOf,
  );
  const executionStructure = structureByTimeframe[profile.executionTimeframe]?.observation.value ?? null;
  const lifecycleResult = evaluateImpulseFadeSnapshot({
    symbol,
    source: input.source,
    venue: input.source,
    executionTimeframe: profile.executionTimeframe,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(selectedByTimeframe).map(([timeframe, selected]) => [
        timeframe,
        selected.candles,
      ]),
    ),
    candidateMetrics: candidateHistory,
    structureEvents: structureEvents.map((item) => ({
      ...item.value,
      sourceTimeframe: item.timeframe,
    })),
    supportResistanceZones: rawZones,
    avwapEvents: avwap.events.map((item) => item.value),
    relativeStrengthEvents: relativeStrengthEvents.map((item) => item.value),
    config: input.lifecycleConfig,
    to: effectiveAsOf,
  }) ?? fallbackLifecycle(input, effectiveAsOf, executionStructure);

  const definition = {
    schemaVersion: MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
    replayEngineVersion: MATERIALIZED_REPLAY_ENGINE_VERSION,
    analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
    symbol,
    source: input.source,
    requestedAsOf: input.asOf,
    effectiveAsOf,
    analysisProfileRef: {
      id: profile.id,
      version: profile.version,
      hash: profile.canonicalConfigHash,
    },
    lifecycleConfigRef: profile.lifecycleConfigRef,
    radarProfileRef: {
      id: input.radarSelectionProfile.id,
      version: input.radarSelectionProfile.version,
      hash: input.radarSelectionProfile.canonicalConfigHash,
    },
    strategyProfileRef: {
      id: input.strategyProfile.id,
      version: input.strategyProfile.version,
      hash: input.strategyProfile.profileHash,
    },
    referenceMarket: { symbol: referenceSymbol, source: referenceSource },
    dataBundleFingerprint,
    candidateMetrics,
    extensionContext,
    indicatorSeries,
    structureByTimeframe,
    structureEvents,
    activeStructureLevels,
    supportResistanceZones,
    relativeStrength,
    relativeStrengthEvents,
    avwapStates: avwap.states,
    avwapEvents: avwap.events,
    lifecycleResult,
    setupState: lifecycleResult,
    coverageByComponent: freshnessByComponent,
    freshnessByComponent,
    dataQualityNotes: uniqueNotes(notes),
  };
  return immutableJsonClone({
    ...definition,
    id: `replay-analysis-state:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

function validateMaterializationInput(input: MaterializeReplayAnalysisInput) {
  if (!Number.isFinite(input.asOf) || input.asOf < 0) {
    throw new RangeError("Analysis asOf must be a non-negative finite timestamp");
  }
  if (replayAnalysisProfileHash(input.analysisProfile) !== input.analysisProfile.canonicalConfigHash) {
    throw new Error("Replay analysis profile failed deterministic hash verification");
  }
  if (
    input.strategyProfile.lifecycleConfigHash !== input.analysisProfile.lifecycleConfigRef.configHash
  ) {
    throw new Error("Analysis lifecycle configuration does not match the strategy profile");
  }
  if (
    input.radarEpisode.symbol.toUpperCase() !== input.symbol.toUpperCase() ||
    input.radarEpisode.source !== input.source
  ) {
    throw new Error("Radar episode does not match the materialized instrument");
  }
  const referenceSymbol = input.analysisProfile.referenceMarketPolicy.symbol;
  const referenceSource = input.analysisProfile.referenceMarketPolicy.source ?? input.source;
  validateCausalSeriesIdentity(
    input.candlesByTimeframe,
    input.symbol,
    input.source,
    input.asOf,
    "target",
  );
  validateCausalSeriesIdentity(
    input.referenceCandlesByTimeframe,
    referenceSymbol,
    referenceSource,
    input.asOf,
    "reference",
  );
}

function validateCausalSeriesIdentity(
  series: Record<string, ReplayCandleRecord[]>,
  symbol: string,
  source: string,
  asOf: number,
  role: string,
) {
  for (const [timeframe, candles] of Object.entries(series)) {
    strictTimeframeToSeconds(timeframe);
    for (const candle of candles) {
      if (candle.knownAt > asOf) continue;
      if (
        candle.symbol.toUpperCase() !== symbol.toUpperCase() ||
        candle.source !== source ||
        candle.timeframe !== timeframe
      ) throw new Error(`Materialized ${role} candle identity mismatch for ${timeframe}`);
    }
  }
}

export function effectiveReplayAnalysisAsOf(input: MaterializeReplayAnalysisInput): number {
  const timeframe = input.analysisProfile.executionTimeframe;
  const records = input.candlesByTimeframe[timeframe] ?? [];
  const boundaries = [...new Set(records
    .map((candle) => candle.closeTime)
    .filter((closeTime) => closeTime <= input.asOf))]
    .sort((left, right) => right - left);
  for (const boundary of boundaries) {
    if (selectReplayRecordsAt(records, boundary).some((candle) => candle.closeTime === boundary)) {
      return boundary;
    }
  }
  throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
}

function selectedSeriesAt(
  records: readonly ReplayCandleRecord[],
  timeframe: string,
  asOf: number,
): SelectedSeries {
  const selected = selectReplayRecordsAt(records, asOf);
  const firstBucket = records.length
    ? Math.min(...records.map((record) => record.openTime))
    : selected[0]?.openTime ?? 0;
  const seconds = strictTimeframeToSeconds(timeframe);
  const candles = selected.map((record) => replayToCandle(record, firstBucket, seconds));
  selectCompletedCandleRevisionsAt(candles, timeframe, asOf);
  return { replay: selected, candles };
}

export function selectReplayRecordsAt(
  records: readonly ReplayCandleRecord[],
  asOf: number,
): ReplayCandleRecord[] {
  const selected = new Map<string, ReplayCandleRecord>();
  for (const candle of records) {
    if (candle.closeTime > asOf || candle.knownAt > asOf) continue;
    if (replayCandleObservationId(candle) !== candle.observationId) {
      throw new Error(`Candle observation ${candle.observationId} failed identity verification`);
    }
    const current = selected.get(candle.logicalCandleId);
    if (!current || current.knownAt < candle.knownAt) {
      selected.set(candle.logicalCandleId, candle);
    } else if (
      current.knownAt === candle.knownAt &&
      canonicalSerialize(current) !== canonicalSerialize(candle)
    ) {
      throw new Error(`Conflicting candle revisions for ${candle.logicalCandleId}`);
    }
  }
  return immutableJsonClone([...selected.values()].sort(
    (left, right) => left.openTime - right.openTime || left.knownAt - right.knownAt,
  ));
}

function replayToCandle(
  record: ReplayCandleRecord,
  firstBucket: number,
  timeframeSeconds: number,
): CandleRecord {
  return {
    ts: record.openTime,
    bucket: record.openTime,
    x: (record.openTime - firstBucket) / timeframeSeconds,
    o: record.o,
    h: record.h,
    l: record.l,
    c: record.c,
    v_base: record.vBase ?? undefined,
    v_quote: record.vQuote ?? undefined,
    ver: record.revision ?? undefined,
    knownAt: record.knownAt,
  };
}

function linePoints(line: Float32Array): ReplayAnalysisLinePoint[] {
  const points: ReplayAnalysisLinePoint[] = [];
  for (let index = 0; index < line.length; index += 2) {
    points.push({ x: line[index]!, value: line[index + 1]! });
  }
  return points;
}

function eventEvaluationAsOf(knownAt: number, executionTimeframe: string) {
  const seconds = strictTimeframeToSeconds(executionTimeframe);
  return Math.ceil(knownAt / seconds) * seconds;
}

function createAnalysisObservation<T>(
  input: Omit<ReplayAnalysisObservation<T>, "schemaVersion" | "observationId">,
): ReplayAnalysisObservation<T> {
  const definition = {
    schemaVersion: REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION,
    ...input,
    sourceObservationIds: [...new Set(input.sourceObservationIds)].sort(),
  };
  return immutableJsonClone({
    ...definition,
    observationId: `replay-analysis-observation:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

function candidateMetricsAt(
  input: MaterializeReplayAnalysisInput,
  timeframe: string,
  selected: SelectedSeries,
  effectiveAsOf: number,
): CandidateMetrics {
  const profile = input.analysisProfile;
  const extension = computeExtensionSnapshot(selected.candles, profile.extensionConfig);
  const requestedStartTs = Math.max(0, effectiveAsOf - profile.extensionConfig.historyDays * 86_400);
  const availableStartTs = selected.replay[0]?.openTime ?? null;
  const availableEndTs = selected.replay.at(-1)?.closeTime ?? null;
  const requestedSeconds = effectiveAsOf - requestedStartTs;
  const coveredSeconds = availableStartTs == null || availableEndTs == null
    ? null
    : Math.max(0, availableEndTs - Math.max(availableStartTs, requestedStartTs));
  const insufficientDataReasons: CandidateMetrics["insufficientDataReasons"] = [];
  if (!extension.candle || !extension.referenceCandle) {
    insufficientDataReasons.push({
      code: "INSUFFICIENT_ANALYSIS_HISTORY",
      scope: `extension:${timeframe}`,
      message: `Elapsed ${profile.extensionConfig.windowSeconds}s return is unavailable`,
      required: profile.extensionConfig.windowSeconds,
      available: coveredSeconds,
      unit: "seconds",
    });
  }
  if (extension.rollingReturnCount < profile.extensionConfig.minSamples) {
    insufficientDataReasons.push({
      code: "INSUFFICIENT_ANALYSIS_HISTORY",
      scope: `extension-distribution:${timeframe}`,
      message: `Rolling-return history has ${extension.rollingReturnCount}/${profile.extensionConfig.minSamples} samples`,
      required: profile.extensionConfig.minSamples,
      available: extension.rollingReturnCount,
      unit: "samples",
    });
  }
  const timeframeExtensions = Object.fromEntries(
    profile.evaluatedTimeframes.map((item) => {
      const series = selectedSeriesAt(
        input.candlesByTimeframe[item] ?? [],
        item,
        effectiveAsOf,
      );
      const snapshot = computeExtensionSnapshot(series.candles, profile.extensionConfig);
      return [item, {
        timeframe: item,
        emaPeriod: profile.extensionConfig.emaPeriod,
        atrPeriod: profile.extensionConfig.atrPeriod,
        latestTs: snapshot.candle?.bucket ?? null,
        latestClose: snapshot.candle?.c ?? null,
        ema: snapshot.ema,
        atr: snapshot.atr,
        atrExtension: snapshot.atrExtension,
      }];
    }),
  );
  return immutableJsonClone({
    symbol: input.symbol.toUpperCase(),
    exchange: input.source,
    marketType: profile.symbolSourcePolicy.marketType,
    source: "external",
    baseTimeframe: timeframe,
    requestedAsOf: input.asOf,
    effectiveAsOf,
    sampleCount: selected.candles.length,
    historyCoverage: {
      requestedStartTs,
      requestedEndTs: effectiveAsOf,
      availableStartTs,
      availableEndTs,
      coveredSeconds,
      requestedSeconds,
      coverageRatio: coveredSeconds == null || requestedSeconds === 0
        ? null
        : Math.min(1, coveredSeconds / requestedSeconds),
    },
    insufficientDataReasons,
    extension: {
      windowSeconds: extension.windowSeconds,
      historyDays: profile.extensionConfig.historyDays,
      sampleCount: extension.rollingReturnCount,
      latestTs: extension.candle?.bucket ?? null,
      referenceTs: extension.referenceCandle?.bucket ?? null,
      latestClose: extension.candle?.c ?? null,
      referenceClose: extension.referenceCandle?.c ?? null,
      returnPct: extension.returnPct,
      percentile: extension.percentile,
      zScore: extension.zScore,
    },
    timeframeExtensions,
    updatedAt: effectiveAsOf,
  });
}

function candidateMetricHistory(
  input: MaterializeReplayAnalysisInput,
  timeframe: string,
  effectiveAsOf: number,
): ImpulseFadeCandidateMetricObservation[] {
  const executionRecords = selectReplayRecordsAt(
    input.candlesByTimeframe[input.analysisProfile.executionTimeframe] ?? [],
    effectiveAsOf,
  );
  return executionRecords.map((record) => {
    const selected = selectedSeriesAt(
      input.candlesByTimeframe[timeframe] ?? [],
      timeframe,
      record.closeTime,
    );
    const extension = computeExtensionSnapshot(selected.candles, input.analysisProfile.extensionConfig);
    return {
      asOf: record.closeTime,
      eventTime: record.closeTime,
      knownAt: record.closeTime,
      metrics: {
        returnPct: extension.returnPct,
        percentile: extension.percentile,
        zScore: extension.zScore,
        atrExtension: extension.atrExtension,
      },
      sampleCount: extension.rollingReturnCount,
    };
  });
}

function materializeRelativeStrength(
  input: MaterializeReplayAnalysisInput,
  timeframe: string,
  target: SelectedSeries,
  reference: SelectedSeries,
  referenceSource: string,
  effectiveAsOf: number,
): ReplayAnalysisRelativeStrength {
  const targetBuckets = new Set(target.replay.map((candle) => candle.openTime));
  const referenceByBucket = new Map(reference.replay.map((candle) => [candle.openTime, candle]));
  const missing = [...targetBuckets].some((bucket) => !referenceByBucket.has(bucket));
  const status: ReplayAnalysisComponentStatus = !target.replay.length || !reference.replay.length
    ? "unavailable"
    : missing
      ? "missingSynchronizedReferenceData"
      : "available";
  if (status !== "available") {
    return {
      targetSymbol: input.symbol.toUpperCase(),
      targetSource: input.source,
      referenceSymbol: input.analysisProfile.referenceMarketPolicy.symbol,
      referenceSource,
      formulaVersion: RELATIVE_STRENGTH_FORMULA_VERSION,
      normalizationAnchor: null,
      series: [],
      structure: null,
      status,
    };
  }
  const line = computeRelativeCumulativeReturnLine(target.candles, reference.candles);
  const points = linePoints(line);
  const byX = new Map(target.candles.map((candle) => [candle.x, candle]));
  const rsCandles = points.map((point) => {
    const source = byX.get(point.x)!;
    return { ...source, o: point.value, h: point.value, l: point.value, c: point.value };
  });
  const firstTarget = target.replay[0]!;
  const firstReference = referenceByBucket.get(firstTarget.openTime)!;
  return {
    targetSymbol: input.symbol.toUpperCase(),
    targetSource: input.source,
    referenceSymbol: input.analysisProfile.referenceMarketPolicy.symbol,
    referenceSource,
    formulaVersion: RELATIVE_STRENGTH_FORMULA_VERSION,
    normalizationAnchor: {
      targetObservationId: firstTarget.observationId,
      referenceObservationId: firstReference.observationId,
      closeTime: firstTarget.closeTime,
    },
    series: points,
    structure: computeMarketStructure(rsCandles, input.analysisProfile.structureConfig),
    status,
  };
}

function materializeAvwap(
  input: MaterializeReplayAnalysisInput,
  selectedByTimeframe: Record<string, SelectedSeries>,
  effectiveAsOf: number,
) {
  const states: ReplayAnalysisAvwapState[] = [];
  const events: ReplayAnalysisObservation<AnchoredVwapSignal>[] = [];
  const notes: DecisionDataQualityNote[] = [];
  let freshness: ReplayAnalysisFreshness = {
    component: "avwap",
    evaluatedAt: effectiveAsOf,
    latestInputCloseTime: null,
    latestInputKnownAt: null,
    status: "unavailable",
    sampleCount: 0,
    requiredCoverage: null,
    availableCoverage: null,
    sourceObservationIds: [],
    configurationHash: canonicalHash(input.analysisProfile.avwapConfig),
  };
  const anchors = input.avwapAnchors ?? [];
  if (!anchors.length) {
    notes.push(componentNote("ANALYSIS_COMPONENT_UNAVAILABLE", "avwap", "No explicit AVWAP anchor was supplied"));
    return { states, events, notes, freshness };
  }
  for (const anchor of anchors) {
    validateAnchor(anchor, input, selectedByTimeframe, effectiveAsOf);
    const selected = selectedByTimeframe[anchor.timeframe]!;
    const options = { anchorBucket: anchor.anchorTime };
    const snapshot = computeAnchoredVwapSnapshot(selected.candles, options);
    const sourceObservationIds = selected.replay
      .filter((candle) => candle.openTime >= anchor.anchorTime)
      .map((candle) => candle.observationId);
    const observation = createAnalysisObservation({
      logicalId: `avwap:${anchor.id}`,
      component: "avwap",
      timeframe: anchor.timeframe,
      eventTime: anchor.anchorTime,
      knownAt: Math.max(
        anchor.knownAt,
        anchor.selectedAt,
        selected.replay.at(-1)?.knownAt ?? anchor.knownAt,
      ),
      evaluatedAt: effectiveAsOf,
      configurationHash: canonicalHash({ anchor, config: input.analysisProfile.avwapConfig }),
      sourceObservationIds: [anchor.anchorCandleObservationId, ...sourceObservationIds],
      value: snapshot,
    });
    states.push({
      anchor,
      series: linePoints(computeAnchoredVwapLine(selected.candles, options)),
      snapshot,
      observation,
    });
    for (const event of computeAnchoredVwapSignals(
      selected.candles,
      options,
      input.analysisProfile.avwapConfig.maxSignals,
    )) {
      const knownAt = Math.max(event.knownAt, anchor.selectedAt);
      events.push(createAnalysisObservation({
        logicalId: `avwap-event:${anchor.id}:${event.kind}:${event.bucket}`,
        component: "avwapEvent",
        timeframe: anchor.timeframe,
        eventTime: event.eventTime,
        knownAt,
        evaluatedAt: eventEvaluationAsOf(
          knownAt,
          input.analysisProfile.executionTimeframe,
        ),
        configurationHash: observation.configurationHash,
        sourceObservationIds: [anchor.anchorCandleObservationId, ...sourceIdsThrough(selected, event.knownAt)],
        value: { ...event, knownAt },
      }));
    }
    freshness = freshnessFor(
      "avwap",
      effectiveAsOf,
      selected,
      observation.configurationHash,
      1,
    );
  }
  return { states, events, notes, freshness };
}

function validateAnchor(
  anchor: AvwapAnchorSpec,
  input: MaterializeReplayAnalysisInput,
  selectedByTimeframe: Record<string, SelectedSeries>,
  effectiveAsOf: number,
) {
  if (
    anchor.schemaVersion !== AVWAP_ANCHOR_SCHEMA_VERSION ||
    anchor.symbol.toUpperCase() !== input.symbol.toUpperCase() ||
    anchor.source !== input.source ||
    anchor.knownAt > effectiveAsOf ||
    anchor.selectedAt > effectiveAsOf
  ) throw new RangeError(`AVWAP anchor ${anchor.id} was not known at the cutoff`);
  const selected = selectedByTimeframe[anchor.timeframe];
  if (!selected) throw new RangeError(`AVWAP anchor timeframe ${anchor.timeframe} is not evaluated`);
  const candle = selected.replay.find(
    (item) => item.logicalCandleId === anchor.anchorCandleLogicalId,
  );
  if (
    !candle ||
    candle.observationId !== anchor.anchorCandleObservationId ||
    candle.openTime !== anchor.anchorTime ||
    candle.knownAt > anchor.selectedAt
  ) throw new RangeError(`AVWAP anchor ${anchor.id} does not reference the visible frozen revision`);
}

export function createAvwapAnchorSpec(
  input: Omit<AvwapAnchorSpec, "schemaVersion">,
): AvwapAnchorSpec {
  if (!input.id.trim() || !input.provenance.trim()) {
    throw new TypeError("AVWAP anchor id and provenance are required");
  }
  if (input.knownAt > input.selectedAt) {
    throw new RangeError("AVWAP anchor cannot be selected before it is known");
  }
  strictTimeframeToSeconds(input.timeframe);
  return immutableJsonClone({
    ...input,
    schemaVersion: AVWAP_ANCHOR_SCHEMA_VERSION,
    symbol: input.symbol.toUpperCase(),
  });
}

function fallbackLifecycle(
  input: MaterializeReplayAnalysisInput,
  effectiveAsOf: number,
  structure: MarketStructureState | null,
): SetupStateSnapshot {
  const selected = selectedSeriesAt(
    input.candlesByTimeframe[input.analysisProfile.executionTimeframe] ?? [],
    input.analysisProfile.executionTimeframe,
    effectiveAsOf,
  );
  const snapshot = evaluateImpulseFadeSnapshot({
    symbol: input.symbol,
    source: input.source,
    executionTimeframe: input.analysisProfile.executionTimeframe,
    candlesByTimeframe: {
      [input.analysisProfile.executionTimeframe]: selected.candles,
    },
    structureEvents: structure?.breaks ?? [],
    config: input.lifecycleConfig,
    to: effectiveAsOf,
  });
  if (!snapshot) throw new Error("Unable to materialize lifecycle at the evaluation cutoff");
  return snapshot;
}

function structureLevelReference(
  input: MaterializeReplayAnalysisInput,
  timeframe: string,
  level: StructureActiveLevel,
): DecisionReferenceLevel {
  const swingId = swingLogicalId(input.source, input.symbol, timeframe, level.sourceSwing);
  const id = `structure-level:${input.source}:${input.symbol.toUpperCase()}:${timeframe}:${level.role}:${swingId}`;
  return createDecisionReferenceLevel({
    id,
    kind: "structureLevel",
    price: level.price,
    sourceTimeframe: timeframe,
    eventTime: level.eventTime,
    knownAt: level.knownAt,
    sourceObject: {
      objectType: "StructureActiveLevel",
      objectId: id,
      snapshot: immutableJsonClone(level) as unknown as { [key: string]: JsonValue },
    },
  });
}

function structureEventLogicalId(
  source: string,
  symbol: string,
  timeframe: string,
  event: MarketStructureState["breaks"][number],
) {
  return `structure-event:${source}:${symbol}:${timeframe}:${event.kind}:${event.direction}:${event.bucket}:${event.sourceSwingX}`;
}

function swingLogicalId(
  source: string,
  symbol: string,
  timeframe: string,
  swing: SwingPoint,
) {
  return `swing:${source}:${symbol.toUpperCase()}:${timeframe}:${swing.kind}:${swing.bucket}`;
}

function originatingSwings(
  swings: SwingPoint[],
  zone: SupportResistanceZone,
  input: MaterializeReplayAnalysisInput,
  timeframe: string,
) {
  return swings
    .filter((swing) =>
      swing.price >= zone.low &&
      swing.price <= zone.high &&
      (zone.kind === "resistance" ? swing.kind === "SwingHigh" : swing.kind === "SwingLow"))
    .sort((left, right) => left.bucket - right.bucket || left.knownAt - right.knownAt)
    .map((swing) => swingLogicalId(input.source, input.symbol, timeframe, swing));
}

function freshnessFor(
  component: string,
  evaluatedAt: number,
  selected: SelectedSeries,
  configurationHash: string,
  requiredSamples: number,
): ReplayAnalysisFreshness {
  const latest = selected.replay.at(-1);
  return {
    component,
    evaluatedAt,
    latestInputCloseTime: latest?.closeTime ?? null,
    latestInputKnownAt: latest?.knownAt ?? null,
    status: selected.replay.length >= requiredSamples ? "available" : "insufficientHistory",
    sampleCount: selected.replay.length,
    requiredCoverage: requiredSamples,
    availableCoverage: selected.replay.length,
    sourceObservationIds: selected.replay.map((candle) => candle.observationId),
    configurationHash,
  };
}

function freshnessForRelativeStrength(
  evaluatedAt: number,
  target: SelectedSeries,
  reference: SelectedSeries,
  status: ReplayAnalysisComponentStatus,
  configurationHash: string,
): ReplayAnalysisFreshness {
  const latestTarget = target.replay.at(-1);
  const latestReference = reference.replay.at(-1);
  return {
    component: "relativeStrength",
    evaluatedAt,
    latestInputCloseTime: Math.max(
      latestTarget?.closeTime ?? 0,
      latestReference?.closeTime ?? 0,
    ) || null,
    latestInputKnownAt: Math.max(
      latestTarget?.knownAt ?? 0,
      latestReference?.knownAt ?? 0,
    ) || null,
    status,
    sampleCount: Math.min(target.replay.length, reference.replay.length),
    requiredCoverage: target.replay.length,
    availableCoverage: reference.replay.length,
    sourceObservationIds: [
      ...target.replay.map((candle) => candle.observationId),
      ...reference.replay.map((candle) => candle.observationId),
    ].sort(),
    configurationHash,
  };
}

function minimumRequiredSamples(profile: ReplayAnalysisProfile, timeframe: string) {
  return Math.max(
    profile.extensionConfig.emaPeriod,
    profile.extensionConfig.atrPeriod + 1,
    timeframe === profile.stochasticRsiConfig.timeframe
      ? profile.stochasticRsiConfig.rsiPeriod +
        profile.stochasticRsiConfig.stochPeriod +
        profile.stochasticRsiConfig.kPeriod +
        profile.stochasticRsiConfig.dPeriod
      : 0,
    profile.structureConfig.pivotStrength * 2 + 1,
  );
}

function sourceIdsThrough(selected: SelectedSeries, knownAt: number) {
  return selected.replay
    .filter((candle) => candle.knownAt <= knownAt)
    .map((candle) => candle.observationId);
}

function alignedSourceIdsThrough(
  target: SelectedSeries,
  reference: SelectedSeries,
  knownAt: number,
) {
  const referenceByBucket = new Map(reference.replay.map((candle) => [candle.openTime, candle]));
  return target.replay.flatMap((candle) => {
    if (candle.knownAt > knownAt) return [];
    const paired = referenceByBucket.get(candle.openTime);
    return paired && paired.knownAt <= knownAt
      ? [candle.observationId, paired.observationId]
      : [];
  });
}

function observationIdsByTimeframe(series: Record<string, SelectedSeries>) {
  return Object.fromEntries(Object.entries(series).map(([timeframe, selected]) => [
    timeframe,
    selected.replay.map((candle) => candle.observationId),
  ]));
}

function componentNote(code: string, component: string, message: string): DecisionDataQualityNote {
  return { code, severity: "warning", message: `${component}: ${message}` };
}

function uniqueNotes(notes: DecisionDataQualityNote[]) {
  return [...new Map(notes.map((note) => [canonicalSerialize(note), note])).values()];
}

function uniqueTimeframes(timeframes: readonly string[]) {
  const result: string[] = [];
  for (const timeframe of timeframes) {
    strictTimeframeToSeconds(timeframe);
    if (!result.includes(timeframe)) result.push(timeframe);
  }
  return result;
}

export function replayAnalysisAvwapDecisionState(
  state: ReplayAnalysisState,
): AnchoredVwapDecisionState | null {
  const avwap = state.avwapStates[0];
  if (!avwap || avwap.snapshot.value == null) return null;
  const reference = createDecisionReferenceLevel({
    id: `avwap-reference:${avwap.anchor.id}`,
    kind: "avwap",
    price: avwap.snapshot.value,
    sourceTimeframe: avwap.anchor.timeframe,
    eventTime: avwap.anchor.anchorTime,
    knownAt: avwap.observation.knownAt,
    sourceObject: {
      objectType: "AnchoredVwap",
      objectId: avwap.observation.logicalId,
      snapshot: immutableJsonClone({
        ...avwap.snapshot,
        analysisObservationId: avwap.observation.observationId,
      }) as unknown as { [key: string]: JsonValue },
    },
  });
  return {
    reference,
    distancePct: avwap.snapshot.distancePct,
    anchorReason: avwap.anchor.provenance,
    eventTime: avwap.anchor.anchorTime,
    knownAt: avwap.observation.knownAt,
  };
}

export function replayAnalysisRelativeStrengthDecisionState(
  state: ReplayAnalysisState,
): RelativeStrengthDecisionState | null {
  const latest = state.relativeStrength.series.at(-1);
  const freshness = state.freshnessByComponent.relativeStrength;
  if (!latest || !freshness || state.relativeStrength.status !== "available") return null;
  return {
    referenceSymbol: state.relativeStrength.referenceSymbol,
    normalized: true,
    value: latest.value,
    structure: state.relativeStrength.structure?.summary ?? null,
    eventTime: freshness.latestInputCloseTime ?? state.effectiveAsOf,
    knownAt: freshness.latestInputKnownAt ?? state.effectiveAsOf,
  };
}

export function replayAnalysisSupportResistanceReferences(
  state: ReplayAnalysisState,
): DecisionReferenceLevel[] {
  return state.supportResistanceZones.map((zone) => createDecisionReferenceLevel({
    id: zone.logicalId,
    kind: zone.value.kind === "support" ? "supportZone" : "resistanceZone",
    price: zone.value.center,
    rangeLow: zone.value.low,
    rangeHigh: zone.value.high,
    sourceTimeframe: zone.timeframe,
    eventTime: zone.eventTime,
    knownAt: zone.knownAt,
    sourceObject: {
      objectType: "SupportResistanceZone",
      objectId: zone.logicalId,
      snapshot: immutableJsonClone({
        ...zone.value,
        analysisObservationId: zone.observationId,
      }) as unknown as { [key: string]: JsonValue },
    },
  }));
}
