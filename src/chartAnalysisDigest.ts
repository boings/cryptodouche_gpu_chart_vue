import { strictTimeframeToSeconds } from "./data";
import {
  replayCandleLogicalId,
  replayCandleObservationId,
  type ReplayCandleRecord,
} from "./replay";
import type {
  ReplayAnalysisFreshness,
  ReplayAnalysisState,
  ReplayAnalysisStructureState,
} from "./replayAnalysis";
import { canonicalHash, canonicalSerialize, immutableJsonClone, type JsonValue } from "./serialization";
import type { DecisionDataQualityNote, DecisionReferenceLevel } from "./strategy";
import type { CandidateMetrics } from "./types";

export const CHART_ANALYSIS_DIGEST_SCHEMA_VERSION = "chart-analysis-digest.1" as const;
export const CHART_ANALYSIS_COMPARISON_SCHEMA_VERSION = "chart-analysis-comparison.1" as const;

export type ChartAnalysisDigestMode = "liveHistorical" | "replay";
export type ChartAnalysisDigestAvailability = "development" | "test" | "audit";

export type ChartAnalysisNumericFamily =
  | "price"
  | "volume"
  | "percentage"
  | "ratio"
  | "oscillator"
  | "score";

/** Fixed decimal places used before analytical equality checks. */
export const CHART_ANALYSIS_NUMERIC_PRECISION: Readonly<Record<ChartAnalysisNumericFamily, number>> =
  Object.freeze({
    price: 12,
    volume: 8,
    percentage: 8,
    ratio: 10,
    oscillator: 8,
    score: 8,
  });

export interface ChartAnalysisCandlePrefixDigest {
  timeframe: string;
  count: number;
  firstOpenTime: number | null;
  latestCloseTime: number | null;
  logicalCandleIds: string[];
  observationIds: string[];
  prefixFingerprint: string;
}

export interface ChartAnalysisLifecycleState {
  candidateId: string | null;
  state: ReplayAnalysisState["lifecycleResult"]["currentState"];
  stateSince: number | null;
}

export interface ChartAnalysisSetupState {
  label: string;
  reason: string;
  checks: ReplayAnalysisState["setupState"]["checks"];
  transitions: ReplayAnalysisState["setupState"]["transitions"];
  activeBreakLevel: ReplayAnalysisState["setupState"]["activeBreakLevel"];
  retestLevel: ReplayAnalysisState["setupState"]["retestLevel"];
  confluence: ReplayAnalysisState["setupState"]["confluence"];
  invalidationReason: string | null;
  expiryReason: string | null;
  dataQuality: string[];
}

export interface ChartAnalysisDigest {
  schemaVersion: typeof CHART_ANALYSIS_DIGEST_SCHEMA_VERSION;
  mode: ChartAnalysisDigestMode;
  symbolOrRedactedAlias: string;
  sourceOrRedactedSource: string;
  requestedAsOf: number;
  effectiveAsOf: number;
  candlePrefixByTimeframe: ChartAnalysisCandlePrefixDigest[];
  candidateMetrics: CandidateMetrics;
  extensionContext: ReplayAnalysisState["extensionContext"];
  stochasticRsiByTimeframe: Record<
    string,
    NonNullable<ReplayAnalysisState["indicatorSeries"][string]["stochRsi"]> & {
      configurationHash: string;
    }
  >;
  structureByTimeframe: Record<string, ReplayAnalysisStructureState>;
  structureEvents: ReplayAnalysisState["structureEvents"];
  activeStructureLevels: DecisionReferenceLevel[];
  supportResistanceZones: ReplayAnalysisState["supportResistanceZones"];
  relativeStrengthState: ReplayAnalysisState["relativeStrength"];
  relativeStrengthEvents: ReplayAnalysisState["relativeStrengthEvents"];
  avwapStates: ReplayAnalysisState["avwapStates"];
  avwapEvents: ReplayAnalysisState["avwapEvents"];
  lifecycleState: ChartAnalysisLifecycleState;
  lifecycleEvidence: ReplayAnalysisState["lifecycleResult"]["evidence"];
  pendingConditions: string[];
  setupState: ChartAnalysisSetupState;
  componentCoverage: Record<string, ReplayAnalysisFreshness>;
  componentFreshness: Record<string, ReplayAnalysisFreshness>;
  dataQualityNotes: DecisionDataQualityNote[];
  profileAndConfigRefs: Record<string, JsonValue>;
  digestFingerprint: string;
}

export interface CreateChartAnalysisDigestInput {
  availability: ChartAnalysisDigestAvailability;
  mode: ChartAnalysisDigestMode;
  state: ReplayAnalysisState;
  candlePrefixesByTimeframe: Readonly<Record<string, readonly ReplayCandleRecord[]>>;
  symbolOrRedactedAlias?: string;
  sourceOrRedactedSource?: string;
  /** Additional pinned references such as replay session, execution, venue, and fee profiles. */
  profileAndConfigRefs: Readonly<Record<string, JsonValue>>;
}

export const CHART_ANALYSIS_DISCREPANCY_CLASSES = [
  "SCHEMA_VERSION_MISMATCH",
  "MODE_MISMATCH",
  "IDENTITY_MISMATCH",
  "DIGEST_FINGERPRINT_MISMATCH",
  "REQUESTED_ASOF_MISMATCH",
  "EFFECTIVE_ASOF_MISMATCH",
  "CANDLE_PREFIX_MISMATCH",
  "TIMEFRAME_BUCKET_MISMATCH",
  "REFERENCE_ALIGNMENT_MISMATCH",
  "PROFILE_CONFIG_MISMATCH",
  "CANDIDATE_METRIC_MISMATCH",
  "STOCH_RSI_MISMATCH",
  "STRUCTURE_STATE_MISMATCH",
  "STRUCTURE_EVENT_MISMATCH",
  "ACTIVE_LEVEL_MISMATCH",
  "SR_ZONE_MISMATCH",
  "RS_VALUE_MISMATCH",
  "RS_EVENT_MISMATCH",
  "AVWAP_VALUE_MISMATCH",
  "AVWAP_EVENT_MISMATCH",
  "LIFECYCLE_STATE_MISMATCH",
  "LIFECYCLE_EVIDENCE_MISMATCH",
  "SETUP_STATE_MISMATCH",
  "DATA_QUALITY_MISMATCH",
  "RENDERING_CONTENT_MISMATCH",
  "FUTURE_DATA_EXPOSURE",
  "UNKNOWN",
] as const;

export type ChartAnalysisDiscrepancyClass =
  (typeof CHART_ANALYSIS_DISCREPANCY_CLASSES)[number];

export interface ChartAnalysisDiscrepancy {
  id: string;
  classification: ChartAnalysisDiscrepancyClass;
  path: string;
  liveFingerprint: string;
  replayFingerprint: string;
  message: string;
}

export interface ChartAnalysisComparison {
  schemaVersion: typeof CHART_ANALYSIS_COMPARISON_SCHEMA_VERSION;
  liveDigestFingerprint: string;
  replayDigestFingerprint: string;
  discrepancies: ChartAnalysisDiscrepancy[];
  analyticalParityPassed: boolean;
  comparisonFingerprint: string;
}

const RESERVED_PROFILE_REF_KEYS = new Set([
  "analysisProfileRef",
  "lifecycleConfigRef",
  "radarProfileRef",
  "strategyProfileRef",
]);

const FUTURE_EVIDENCE_TIME_KEYS = new Set([
  "asOf",
  "effectiveAsOf",
  "eventTime",
  "knownAt",
  "evaluatedAt",
  "updatedAt",
  "updatedTs",
  "stateSince",
  "detectedAt",
  "detectionEventTime",
  "episodeHighTime",
  "terminalAt",
  "selectedAt",
  "anchorTime",
  "closeTime",
  "correctionPublishedAt",
  "latestCloseTime",
  "latestInputCloseTime",
  "latestInputKnownAt",
  "latestTs",
  "referenceTs",
  "availableEndTs",
  "requestedEndTs",
]);

export function canonicalizeChartAnalysisNumber(
  value: number,
  family: ChartAnalysisNumericFamily,
): number {
  if (!Number.isFinite(value)) throw new TypeError(`${family} metric must be finite`);
  const canonical = Number(value.toFixed(CHART_ANALYSIS_NUMERIC_PRECISION[family]));
  return Object.is(canonical, -0) ? 0 : canonical;
}

export function createChartAnalysisDigest(
  input: CreateChartAnalysisDigestInput,
): ChartAnalysisDigest {
  validateDigestInput(input);
  const { state } = input;
  const stochasticRsiByTimeframe = Object.fromEntries(
    Object.entries(state.indicatorSeries).flatMap(([timeframe, indicator]) =>
      indicator.stochRsi
        ? [[timeframe, { ...indicator.stochRsi, configurationHash: indicator.configurationHash }]]
        : [],
    ),
  );
  const profileAndConfigRefs = {
    analysisProfileRef: state.analysisProfileRef,
    lifecycleConfigRef: state.lifecycleConfigRef,
    radarProfileRef: state.radarProfileRef,
    strategyProfileRef: state.strategyProfileRef,
    ...input.profileAndConfigRefs,
  };
  const setup = state.setupState;
  const definition = {
    schemaVersion: CHART_ANALYSIS_DIGEST_SCHEMA_VERSION,
    mode: input.mode,
    symbolOrRedactedAlias: input.symbolOrRedactedAlias ?? state.symbol,
    sourceOrRedactedSource: input.sourceOrRedactedSource ?? state.source,
    requestedAsOf: state.requestedAsOf,
    effectiveAsOf: state.effectiveAsOf,
    candlePrefixByTimeframe: createCandlePrefixDigests(
      input.candlePrefixesByTimeframe,
      state,
    ),
    candidateMetrics: canonicalizeComponent(state.candidateMetrics, "ratio"),
    extensionContext: canonicalizeComponent(state.extensionContext, "price"),
    stochasticRsiByTimeframe: canonicalizeComponent(stochasticRsiByTimeframe, "oscillator"),
    structureByTimeframe: canonicalizeComponent(state.structureByTimeframe, "price"),
    structureEvents: canonicalizeComponent(state.structureEvents, "price"),
    activeStructureLevels: canonicalizeComponent(state.activeStructureLevels, "price"),
    supportResistanceZones: canonicalizeComponent(state.supportResistanceZones, "price"),
    relativeStrengthState: canonicalizeComponent(state.relativeStrength, "ratio"),
    relativeStrengthEvents: canonicalizeComponent(state.relativeStrengthEvents, "ratio"),
    avwapStates: canonicalizeComponent(state.avwapStates, "price"),
    avwapEvents: canonicalizeComponent(state.avwapEvents, "price"),
    lifecycleState: canonicalizeComponent({
      candidateId: state.lifecycleResult.candidate?.id ?? null,
      state: state.lifecycleResult.currentState,
      stateSince: state.lifecycleResult.stateSince,
    }, "ratio"),
    lifecycleEvidence: canonicalizeComponent(state.lifecycleResult.evidence, "ratio"),
    pendingConditions: [...state.lifecycleResult.pendingConditions],
    setupState: canonicalizeComponent({
      label: setup.label,
      reason: setup.reason,
      checks: setup.checks,
      transitions: setup.transitions,
      activeBreakLevel: setup.activeBreakLevel,
      retestLevel: setup.retestLevel,
      confluence: setup.confluence,
      invalidationReason: setup.invalidationReason,
      expiryReason: setup.expiryReason,
      dataQuality: setup.dataQuality,
    }, "ratio"),
    componentCoverage: canonicalizeComponent(state.coverageByComponent, "ratio"),
    componentFreshness: canonicalizeComponent(state.freshnessByComponent, "ratio"),
    dataQualityNotes: immutableJsonClone(state.dataQualityNotes),
    profileAndConfigRefs: immutableJsonClone(profileAndConfigRefs) as Record<string, JsonValue>,
  };
  return immutableJsonClone({
    ...definition,
    digestFingerprint: chartAnalysisDigestFingerprint(definition),
  });
}

export function chartAnalysisDigestFingerprint(
  digest: Omit<ChartAnalysisDigest, "digestFingerprint"> | ChartAnalysisDigest,
): string {
  const { digestFingerprint: _ignored, ...definition } = digest as ChartAnalysisDigest;
  return canonicalHash(definition);
}

export function compareChartAnalysisDigests(
  live: ChartAnalysisDigest,
  replay: ChartAnalysisDigest,
): ChartAnalysisComparison {
  const discrepancies: ChartAnalysisDiscrepancy[] = [];
  compareValue(discrepancies, "MODE_MISMATCH", "live.mode", live.mode, "liveHistorical");
  compareValue(discrepancies, "MODE_MISMATCH", "replay.mode", replay.mode, "replay");
  compareValue(
    discrepancies,
    "DIGEST_FINGERPRINT_MISMATCH",
    "live.digestFingerprint",
    live.digestFingerprint,
    chartAnalysisDigestFingerprint(live),
  );
  compareValue(
    discrepancies,
    "DIGEST_FINGERPRINT_MISMATCH",
    "replay.digestFingerprint",
    replay.digestFingerprint,
    chartAnalysisDigestFingerprint(replay),
  );
  for (const path of futureEvidencePaths(live)) {
    discrepancies.push(discrepancy(
      "FUTURE_DATA_EXPOSURE",
      `live.${path}`,
      pathValue(live, path),
      null,
    ));
  }
  for (const path of futureEvidencePaths(replay)) {
    discrepancies.push(discrepancy(
      "FUTURE_DATA_EXPOSURE",
      `replay.${path}`,
      null,
      pathValue(replay, path),
    ));
  }

  compareValue(discrepancies, "SCHEMA_VERSION_MISMATCH", "schemaVersion", live.schemaVersion, replay.schemaVersion);
  compareValue(discrepancies, "IDENTITY_MISMATCH", "symbolOrRedactedAlias", live.symbolOrRedactedAlias, replay.symbolOrRedactedAlias);
  compareValue(discrepancies, "IDENTITY_MISMATCH", "sourceOrRedactedSource", live.sourceOrRedactedSource, replay.sourceOrRedactedSource);
  compareValue(discrepancies, "REQUESTED_ASOF_MISMATCH", "requestedAsOf", live.requestedAsOf, replay.requestedAsOf);
  compareValue(discrepancies, "EFFECTIVE_ASOF_MISMATCH", "effectiveAsOf", live.effectiveAsOf, replay.effectiveAsOf);
  compareCandlePrefixes(discrepancies, live.candlePrefixByTimeframe, replay.candlePrefixByTimeframe);
  compareValue(discrepancies, "PROFILE_CONFIG_MISMATCH", "profileAndConfigRefs", live.profileAndConfigRefs, replay.profileAndConfigRefs);
  compareValue(discrepancies, "CANDIDATE_METRIC_MISMATCH", "candidateMetrics", live.candidateMetrics, replay.candidateMetrics);
  compareValue(discrepancies, "CANDIDATE_METRIC_MISMATCH", "extensionContext", live.extensionContext, replay.extensionContext);
  compareValue(discrepancies, "STOCH_RSI_MISMATCH", "stochasticRsiByTimeframe", live.stochasticRsiByTimeframe, replay.stochasticRsiByTimeframe);
  compareValue(discrepancies, "STRUCTURE_STATE_MISMATCH", "structureByTimeframe", live.structureByTimeframe, replay.structureByTimeframe);
  compareValue(discrepancies, "STRUCTURE_EVENT_MISMATCH", "structureEvents", live.structureEvents, replay.structureEvents);
  compareValue(discrepancies, "ACTIVE_LEVEL_MISMATCH", "activeStructureLevels", live.activeStructureLevels, replay.activeStructureLevels);
  compareValue(discrepancies, "SR_ZONE_MISMATCH", "supportResistanceZones", live.supportResistanceZones, replay.supportResistanceZones);
  compareReferenceAlignment(discrepancies, live.relativeStrengthState, replay.relativeStrengthState);
  compareValue(discrepancies, "RS_VALUE_MISMATCH", "relativeStrengthState", relativeStrengthValues(live), relativeStrengthValues(replay));
  compareValue(discrepancies, "RS_EVENT_MISMATCH", "relativeStrengthEvents", live.relativeStrengthEvents, replay.relativeStrengthEvents);
  compareValue(discrepancies, "AVWAP_VALUE_MISMATCH", "avwapStates", live.avwapStates, replay.avwapStates);
  compareValue(discrepancies, "AVWAP_EVENT_MISMATCH", "avwapEvents", live.avwapEvents, replay.avwapEvents);
  compareValue(discrepancies, "LIFECYCLE_STATE_MISMATCH", "lifecycleState", live.lifecycleState, replay.lifecycleState);
  compareValue(discrepancies, "LIFECYCLE_EVIDENCE_MISMATCH", "lifecycleEvidence", live.lifecycleEvidence, replay.lifecycleEvidence);
  compareValue(discrepancies, "LIFECYCLE_EVIDENCE_MISMATCH", "pendingConditions", live.pendingConditions, replay.pendingConditions);
  compareValue(discrepancies, "SETUP_STATE_MISMATCH", "setupState", live.setupState, replay.setupState);
  compareValue(discrepancies, "DATA_QUALITY_MISMATCH", "componentCoverage", live.componentCoverage, replay.componentCoverage);
  compareValue(discrepancies, "DATA_QUALITY_MISMATCH", "componentFreshness", live.componentFreshness, replay.componentFreshness);
  compareValue(discrepancies, "DATA_QUALITY_MISMATCH", "dataQualityNotes", live.dataQualityNotes, replay.dataQualityNotes);

  discrepancies.sort((left, right) =>
    CHART_ANALYSIS_DISCREPANCY_CLASSES.indexOf(left.classification) -
      CHART_ANALYSIS_DISCREPANCY_CLASSES.indexOf(right.classification) ||
    left.path.localeCompare(right.path),
  );
  const definition = {
    schemaVersion: CHART_ANALYSIS_COMPARISON_SCHEMA_VERSION,
    liveDigestFingerprint: live.digestFingerprint,
    replayDigestFingerprint: replay.digestFingerprint,
    discrepancies,
    analyticalParityPassed: discrepancies.length === 0,
  };
  return immutableJsonClone({
    ...definition,
    comparisonFingerprint: canonicalHash(definition),
  });
}

function validateDigestInput(input: CreateChartAnalysisDigestInput) {
  if (!["development", "test", "audit"].includes(input.availability)) {
    throw new Error("ChartAnalysisDigest is available only in development, test, or audit contexts");
  }
  if (input.mode !== "liveHistorical" && input.mode !== "replay") {
    throw new TypeError("Unsupported ChartAnalysisDigest mode");
  }
  const { state } = input;
  if (!Number.isFinite(state.requestedAsOf) || !Number.isFinite(state.effectiveAsOf)) {
    throw new TypeError("ChartAnalysisDigest cutoffs must be finite");
  }
  if (state.effectiveAsOf > state.requestedAsOf) {
    throw new RangeError("effectiveAsOf cannot exceed requestedAsOf");
  }
  if (!(input.symbolOrRedactedAlias ?? state.symbol).trim()) {
    throw new TypeError("ChartAnalysisDigest symbol or alias is required");
  }
  if (!(input.sourceOrRedactedSource ?? state.source).trim()) {
    throw new TypeError("ChartAnalysisDigest source or redacted source is required");
  }
  for (const key of Object.keys(input.profileAndConfigRefs)) {
    if (RESERVED_PROFILE_REF_KEYS.has(key)) {
      throw new Error(`Additional profile/config reference cannot override ${key}`);
    }
  }
  if (state.candidateMetrics.effectiveAsOf !== state.effectiveAsOf) {
    throw new Error("Candidate metrics cutoff does not match analysis effectiveAsOf");
  }
  if (state.lifecycleResult.asOf !== state.effectiveAsOf || state.setupState.asOf !== state.effectiveAsOf) {
    throw new Error("Lifecycle/setup state cutoff does not match analysis effectiveAsOf");
  }
  assertNoFutureEvidence({
    candidateMetrics: state.candidateMetrics,
    extensionContext: state.extensionContext,
    structureByTimeframe: state.structureByTimeframe,
    structureEvents: state.structureEvents,
    activeStructureLevels: state.activeStructureLevels,
    supportResistanceZones: state.supportResistanceZones,
    relativeStrength: state.relativeStrength,
    relativeStrengthEvents: state.relativeStrengthEvents,
    avwapStates: state.avwapStates,
    avwapEvents: state.avwapEvents,
    lifecycleResult: state.lifecycleResult,
    setupState: state.setupState,
    coverageByComponent: state.coverageByComponent,
    freshnessByComponent: state.freshnessByComponent,
  }, state.effectiveAsOf, "state");
  validateEmbeddedCompletedCandles(state);
}

function createCandlePrefixDigests(
  prefixes: Readonly<Record<string, readonly ReplayCandleRecord[]>>,
  state: ReplayAnalysisState,
): ChartAnalysisCandlePrefixDigest[] {
  return Object.keys(prefixes)
    .sort((left, right) => strictTimeframeToSeconds(left) - strictTimeframeToSeconds(right) || left.localeCompare(right))
    .map((timeframe) => {
      const candles = prefixes[timeframe] ?? [];
      let previousOpenTime = -Infinity;
      const logicalIds = new Set<string>();
      const observationIds = new Set<string>();
      for (const candle of candles) {
        if (candle.symbol !== state.symbol || candle.source !== state.source || candle.timeframe !== timeframe) {
          throw new Error(`Candle prefix identity mismatch for ${timeframe}`);
        }
        if (candle.openTime <= previousOpenTime) {
          throw new Error(`Candle prefix must be strictly ordered for ${timeframe}`);
        }
        if (candle.closeTime > state.effectiveAsOf || candle.knownAt > state.effectiveAsOf) {
          throw new Error(`FUTURE_DATA_EXPOSURE:candlePrefixesByTimeframe.${timeframe}`);
        }
        if (candle.logicalCandleId !== replayCandleLogicalId(candle)) {
          throw new Error(`Invalid logical candle identity for ${timeframe}`);
        }
        if (candle.observationId !== replayCandleObservationId(candle)) {
          throw new Error(`Invalid candle observation identity for ${timeframe}`);
        }
        if (logicalIds.has(candle.logicalCandleId) || observationIds.has(candle.observationId)) {
          throw new Error(`Duplicate candle identity in ${timeframe} prefix`);
        }
        previousOpenTime = candle.openTime;
        logicalIds.add(candle.logicalCandleId);
        observationIds.add(candle.observationId);
      }
      const canonicalCandles = canonicalizeComponent(candles, "price");
      return {
        timeframe,
        count: candles.length,
        firstOpenTime: candles[0]?.openTime ?? null,
        latestCloseTime: candles.at(-1)?.closeTime ?? null,
        logicalCandleIds: candles.map((candle) => candle.logicalCandleId),
        observationIds: candles.map((candle) => candle.observationId),
        prefixFingerprint: canonicalHash(canonicalCandles),
      };
    });
}

function validateEmbeddedCompletedCandles(state: ReplayAnalysisState) {
  for (const [timeframe, extension] of Object.entries(state.extensionContext)) {
    const seconds = strictTimeframeToSeconds(timeframe);
    for (const [name, candle] of [["candle", extension.candle], ["referenceCandle", extension.referenceCandle]] as const) {
      if (!candle) continue;
      if (candle.bucket + seconds > state.effectiveAsOf || (candle.knownAt ?? 0) > state.effectiveAsOf) {
        throw new Error(`FUTURE_DATA_EXPOSURE:extensionContext.${timeframe}.${name}`);
      }
    }
  }
  for (const [timeframe, extension] of Object.entries(state.candidateMetrics.timeframeExtensions)) {
    if (extension.latestTs != null && extension.latestTs + strictTimeframeToSeconds(timeframe) > state.effectiveAsOf) {
      throw new Error(`FUTURE_DATA_EXPOSURE:candidateMetrics.timeframeExtensions.${timeframe}.latestTs`);
    }
  }
  const baseSeconds = strictTimeframeToSeconds(state.candidateMetrics.baseTimeframe);
  for (const [name, timestamp] of [
    ["latestTs", state.candidateMetrics.extension.latestTs],
    ["referenceTs", state.candidateMetrics.extension.referenceTs],
  ] as const) {
    if (timestamp != null && timestamp + baseSeconds > state.effectiveAsOf) {
      throw new Error(`FUTURE_DATA_EXPOSURE:candidateMetrics.extension.${name}`);
    }
  }
  for (const avwap of state.avwapStates) {
    if (avwap.anchor.anchorTime + strictTimeframeToSeconds(avwap.anchor.timeframe) > state.effectiveAsOf) {
      throw new Error(`FUTURE_DATA_EXPOSURE:avwapStates.${avwap.anchor.id}.anchorTime`);
    }
  }
}

function assertNoFutureEvidence(value: unknown, effectiveAsOf: number, path: string) {
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoFutureEvidence(item, effectiveAsOf, `${path}[${index}]`));
    return;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.eventTime === "number" &&
    typeof record.knownAt === "number" &&
    record.knownAt < record.eventTime
  ) {
    throw new Error(`Invalid evidence chronology at ${path}`);
  }
  for (const [key, item] of Object.entries(record)) {
    const itemPath = `${path}.${key}`;
    if (FUTURE_EVIDENCE_TIME_KEYS.has(key) && typeof item === "number" && item > effectiveAsOf) {
      throw new Error(`FUTURE_DATA_EXPOSURE:${itemPath}`);
    }
    assertNoFutureEvidence(item, effectiveAsOf, itemPath);
  }
}

function canonicalizeComponent<T>(value: T, defaultFamily: ChartAnalysisNumericFamily): T {
  return immutableJsonClone(canonicalizeValue(value, defaultFamily)) as T;
}

function canonicalizeValue(value: unknown, defaultFamily: ChartAnalysisNumericFamily, key = ""): unknown {
  if (typeof value === "number") {
    if (isExactNumberKey(key)) {
      if (!Number.isFinite(value)) throw new TypeError(`${key || "numeric"} value must be finite`);
      return Object.is(value, -0) ? 0 : value;
    }
    return canonicalizeChartAnalysisNumber(value, numericFamilyForKey(key, defaultFamily));
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item, defaultFamily, key));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, item]) => [
      childKey,
      canonicalizeValue(item, defaultFamily, childKey),
    ]));
  }
  return value;
}

function isExactNumberKey(key: string) {
  return FUTURE_EVIDENCE_TIME_KEYS.has(key) || [
    "openTime",
    "firstOpenTime",
    "bucket",
    "ts",
    "x",
    "index",
    "lastX",
    "sourceSwingX",
    "count",
    "sampleCount",
    "requiredCoverage",
    "availableCoverage",
    "rollingReturnCount",
    "touches",
    "revision",
    "windowSeconds",
    "historyDays",
    "emaPeriod",
    "atrPeriod",
    "rsiPeriod",
    "stochPeriod",
    "kPeriod",
    "dPeriod",
    "coveredSeconds",
    "requestedSeconds",
    "requestedStartTs",
    "availableStartTs",
  ].includes(key);
}

function numericFamilyForKey(key: string, fallback: ChartAnalysisNumericFamily): ChartAnalysisNumericFamily {
  if (["vBase", "vQuote", "volume", "volumeBase", "volumeQuote"].includes(key)) return "volume";
  if (key === "percentile" || key.endsWith("Pct") || key.endsWith("Percent")) return "percentage";
  if (["zScore", "coverageRatio", "atrExtension"].includes(key)) return "ratio";
  if (["score", "strength"].includes(key)) return "score";
  if ([
    "o", "h", "l", "c", "open", "high", "low", "close", "price", "previousPrice",
    "level", "sourceSwingPrice", "rangeLow", "rangeHigh", "center", "latestClose",
    "referenceClose", "ema", "atr", "vwap", "episodeHigh",
  ].includes(key)) return "price";
  return fallback;
}

function futureEvidencePaths(digest: ChartAnalysisDigest): string[] {
  const paths: string[] = [];
  for (const [index, prefix] of digest.candlePrefixByTimeframe.entries()) {
    if (prefix.latestCloseTime != null && prefix.latestCloseTime > digest.effectiveAsOf) {
      paths.push(`candlePrefixByTimeframe[${index}].latestCloseTime`);
    }
  }
  collectFutureEvidencePaths({
    candidateMetrics: digest.candidateMetrics,
    extensionContext: digest.extensionContext,
    structureByTimeframe: digest.structureByTimeframe,
    structureEvents: digest.structureEvents,
    activeStructureLevels: digest.activeStructureLevels,
    supportResistanceZones: digest.supportResistanceZones,
    relativeStrengthState: digest.relativeStrengthState,
    relativeStrengthEvents: digest.relativeStrengthEvents,
    avwapStates: digest.avwapStates,
    avwapEvents: digest.avwapEvents,
    lifecycleState: digest.lifecycleState,
    lifecycleEvidence: digest.lifecycleEvidence,
    setupState: digest.setupState,
    componentCoverage: digest.componentCoverage,
    componentFreshness: digest.componentFreshness,
  }, digest.effectiveAsOf, "", paths);
  return [...new Set(paths)].sort();
}

function collectFutureEvidencePaths(value: unknown, cutoff: number, path: string, output: string[]) {
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFutureEvidencePaths(item, cutoff, `${path}[${index}]`, output));
    return;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const itemPath = path ? `${path}.${key}` : key;
    if (FUTURE_EVIDENCE_TIME_KEYS.has(key) && typeof item === "number" && item > cutoff) {
      output.push(itemPath);
    }
    collectFutureEvidencePaths(item, cutoff, itemPath, output);
  }
}

function compareCandlePrefixes(
  output: ChartAnalysisDiscrepancy[],
  live: readonly ChartAnalysisCandlePrefixDigest[],
  replay: readonly ChartAnalysisCandlePrefixDigest[],
) {
  const liveByTimeframe = new Map(live.map((item) => [item.timeframe, item]));
  const replayByTimeframe = new Map(replay.map((item) => [item.timeframe, item]));
  const timeframes = [...new Set([...liveByTimeframe.keys(), ...replayByTimeframe.keys()])]
    .sort((left, right) => strictTimeframeToSeconds(left) - strictTimeframeToSeconds(right) || left.localeCompare(right));
  for (const timeframe of timeframes) {
    const livePrefix = liveByTimeframe.get(timeframe);
    const replayPrefix = replayByTimeframe.get(timeframe);
    if (!livePrefix || !replayPrefix) {
      output.push(discrepancy("TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${timeframe}`, livePrefix ?? null, replayPrefix ?? null));
      continue;
    }
    compareValue(output, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${timeframe}.count`, livePrefix.count, replayPrefix.count);
    compareValue(output, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${timeframe}.firstOpenTime`, livePrefix.firstOpenTime, replayPrefix.firstOpenTime);
    compareValue(output, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${timeframe}.latestCloseTime`, livePrefix.latestCloseTime, replayPrefix.latestCloseTime);
    compareValue(output, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${timeframe}.logicalCandleIds`, livePrefix.logicalCandleIds, replayPrefix.logicalCandleIds);
    compareValue(output, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${timeframe}.observationIds`, livePrefix.observationIds, replayPrefix.observationIds);
    compareValue(output, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${timeframe}.prefixFingerprint`, livePrefix.prefixFingerprint, replayPrefix.prefixFingerprint);
  }
}

function compareReferenceAlignment(
  output: ChartAnalysisDiscrepancy[],
  live: ChartAnalysisDigest["relativeStrengthState"],
  replay: ChartAnalysisDigest["relativeStrengthState"],
) {
  compareValue(output, "REFERENCE_ALIGNMENT_MISMATCH", "relativeStrengthState.referenceAlignment", {
    targetSymbol: live.targetSymbol,
    targetSource: live.targetSource,
    referenceSymbol: live.referenceSymbol,
    referenceSource: live.referenceSource,
    formulaVersion: live.formulaVersion,
    normalizationAnchor: live.normalizationAnchor,
    status: live.status,
  }, {
    targetSymbol: replay.targetSymbol,
    targetSource: replay.targetSource,
    referenceSymbol: replay.referenceSymbol,
    referenceSource: replay.referenceSource,
    formulaVersion: replay.formulaVersion,
    normalizationAnchor: replay.normalizationAnchor,
    status: replay.status,
  });
}

function relativeStrengthValues(digest: ChartAnalysisDigest) {
  return {
    series: digest.relativeStrengthState.series,
    structure: digest.relativeStrengthState.structure,
  };
}

function compareValue(
  output: ChartAnalysisDiscrepancy[],
  classification: ChartAnalysisDiscrepancyClass,
  path: string,
  live: unknown,
  replay: unknown,
) {
  if (canonicalSerialize(live) === canonicalSerialize(replay)) return;
  output.push(discrepancy(classification, path, live, replay));
}

function discrepancy(
  classification: ChartAnalysisDiscrepancyClass,
  path: string,
  live: unknown,
  replay: unknown,
): ChartAnalysisDiscrepancy {
  const definition = {
    classification,
    path,
    liveFingerprint: canonicalHash(live),
    replayFingerprint: canonicalHash(replay),
    message: `${classification} at ${path}`,
  };
  return {
    id: `chart-analysis-discrepancy:${canonicalHash(definition).slice("fnv1a64:".length)}`,
    ...definition,
  };
}

function pathValue(root: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  return parts.reduce<unknown>((current, part) =>
    current && typeof current === "object"
      ? (current as Record<string, unknown>)[part]
      : null,
  root);
}
