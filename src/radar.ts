import { candleCloseTime, IMPULSE_FADE_LIFECYCLE_VERSION, type SetupFamily, type SetupStateSnapshot } from "./indicators";
import { timeframeToSeconds } from "./data";
import {
  canonicalHash,
  canonicalSerialize,
  immutableJsonClone,
  type JsonValue,
} from "./serialization";
import {
  createStrategyProfile,
  DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  strategyProfileHash,
  type DataQualitySeverity,
  type StrategyProfile,
} from "./strategy";
import type { CandleRecord } from "./types";

export const RADAR_SELECTION_PROFILE_SCHEMA_VERSION = "radar-selection-profile.1" as const;
export const RADAR_EPISODE_SCHEMA_VERSION = "radar-episode.1" as const;
export const REPLAY_CASE_MANIFEST_SCHEMA_VERSION = "replay-case-manifest.1" as const;
export const RADAR_METRIC_OBSERVATION_SCHEMA_VERSION = "radar-metric-observation.1" as const;
export const RADAR_SCAN_RESULT_SCHEMA_VERSION = "radar-scan-result.1" as const;
export const RADAR_STATUS_OBSERVATION_SCHEMA_VERSION = "radar-episode-status.1" as const;
export const EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION =
  "execution-venue-eligibility.1" as const;
export const RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION =
  "radar-structure-observation.1" as const;
export const RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION =
  "radar-universe-membership.1" as const;

export type RadarMetricUnit = "percent" | "atr" | "quoteNotional";
export type RadarHardGateCode =
  | "dataQuality"
  | "liquidity"
  | "selectedUniverse"
  | "sourcePolicy"
  | "executionVenueEligibility";
export type RadarContextTag =
  | "rebound_after_drawdown"
  | "fresh_high_extension"
  | "continuation_leg"
  | "unknown";
export type ExecutionVenueEligibilityStatus = "Available" | "Unavailable" | "Unknown";
export type ExecutionVenuePolicyMode =
  | "requireKnownAvailable"
  | "allowUnknown"
  | "ignore"
  | "rejectKnownUnavailable";

export interface RadarDataQualityNote {
  code: string;
  severity: DataQualitySeverity;
  message: string;
}

export interface RadarDetectorThresholds {
  minimumReturnPct: number | null;
  minimumPercentile: number | null;
  minimumZScore: number | null;
  minimumSampleCount: number;
  historyLookbackSeconds: number;
  maximumReferenceStalenessSeconds: number | null;
}

export interface ElapsedWindowReturnDetector extends RadarDetectorThresholds {
  id: string;
  type: "elapsedWindowReturn";
  windowSeconds: number;
}

export interface RollingTroughRunupDetector {
  id: string;
  type: "rollingTroughRunup";
  lookbackSeconds: number;
  minimumRunupPct: number;
  maximumTroughAgeSeconds: number;
  referenceField: "close";
  minimumPercentile: number | null;
  minimumZScore: number | null;
  minimumSampleCount: number;
  historyLookbackSeconds: number;
}

export interface EmaAtrDisplacementDetector {
  id: string;
  type: "emaAtrDisplacement";
  analysisTimeframe: string;
  emaPeriod: number;
  atrPeriod: number;
  minimumAtrDisplacement: number;
  minimumSampleCount: number;
}

export interface MaximumWindowReturnDetector extends RadarDetectorThresholds {
  id: string;
  type: "maximumWindowReturn";
  windowsSeconds: number[];
}

export type RadarMoveDetector =
  | ElapsedWindowReturnDetector
  | RollingTroughRunupDetector
  | EmaAtrDisplacementDetector
  | MaximumWindowReturnDetector;

export type RadarDetectorCombination =
  | { mode: "any" }
  | { mode: "all" }
  | { mode: "atLeast"; count: number };

export interface RadarSelectionProfileDefinition {
  schemaVersion: typeof RADAR_SELECTION_PROFILE_SCHEMA_VERSION;
  id: string;
  version: string;
  name: string;
  setupFamily: SetupFamily;
  scanTimeframe: string;
  evaluationCadence: {
    mode: "completedScanCandle";
    everyBars: number;
  };
  moveDetectors: RadarMoveDetector[];
  detectorCombination: RadarDetectorCombination;
  hardGates: RadarHardGateCode[];
  resetPolicy: {
    minimumFalseDurationSeconds: number;
  };
  episodeExpiry: {
    maximumAgeSeconds: number;
  };
  sourcePolicy: {
    allowedSources: string[] | null;
  };
  executionVenuePolicy: {
    intendedVenue: string | null;
    mode: ExecutionVenuePolicyMode;
  };
  liquidityPolicy: {
    minimumQuoteNotional: number | null;
    windowSeconds: number;
    missingData: "fail" | "warn";
  };
  createdAt: number;
}

export interface RadarSelectionProfile extends RadarSelectionProfileDefinition {
  canonicalConfigHash: string;
}

export interface RadarMetricObservation {
  schemaVersion: typeof RADAR_METRIC_OBSERVATION_SCHEMA_VERSION;
  logicalObjectId: string;
  observationId: string;
  requestId: string;
  metricCode: string;
  metricVersion: string;
  symbol: string;
  source: string;
  dataOrigin: string | null;
  timeframe: string | null;
  requestedAsOf: number;
  effectiveAsOf: number;
  knownAt: number;
  window: number | null;
  referenceTime: number | null;
  referenceValue: number | null;
  value: number | null;
  unit: RadarMetricUnit;
  percentile: number | null;
  zScore: number | null;
  sampleCount: number;
  historyStart: number | null;
  historyEnd: number | null;
  configHash: string;
  inputHash: string;
  dataQualityNotes: RadarDataQualityNote[];
}

export interface RadarSelectionAnchor {
  logicalObjectId: string;
  observationId: string;
  timestamp: number;
  price: number;
  ageSeconds: number;
  referenceField: "close";
  sourceObservationId: string;
}

export interface RadarPathContext {
  net24hReturnPct: number | null;
  net48hReturnPct: number | null;
  triggeringLocalImpulseReturnPct: number | null;
  triggeringDetectorId: string;
  triggeringWindowSeconds: number | null;
  selectionAnchorPrice: number | null;
  selectionAnchorTime: number | null;
  selectionAnchorAgeSeconds: number | null;
  priorPeakPrice: number | null;
  priorPeakTime: number | null;
  priorDrawdownPct: number | null;
  recoveryFraction: number | null;
  currentAtrDisplacement: number | null;
  triggeringPercentile: number | null;
  triggeringZScore: number | null;
  quoteNotional: number | null;
  mtfStructureStates: Record<string, string>;
  contextTags: RadarContextTag[];
}

export interface DurableObjectReference {
  logicalObjectId: string;
  observationId: string;
  objectType: string;
  eventTime: number | null;
  knownAt: number;
  snapshot: JsonValue;
}

export interface RadarStructureObservation {
  schemaVersion: typeof RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION;
  logicalObjectId: string;
  observationId: string;
  symbol: string;
  source: string;
  timeframe: string;
  state: string;
  eventTime: number;
  knownAt: number;
  snapshot: JsonValue;
}

export type CreateRadarStructureObservationInput = Omit<
  RadarStructureObservation,
  "schemaVersion" | "observationId"
>;

export interface ExecutionVenueEligibilityObservation {
  schemaVersion: typeof EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION;
  logicalObjectId: string;
  observationId: string;
  symbol: string;
  marketDataSource: string;
  executionVenue: string;
  status: ExecutionVenueEligibilityStatus;
  effectiveFrom: number;
  effectiveTo: number | null;
  knownAt: number;
  evidenceSource: string;
  dataQualityNotes: RadarDataQualityNote[];
}

export type CreateExecutionVenueEligibilityObservationInput = Omit<
  ExecutionVenueEligibilityObservation,
  "schemaVersion" | "logicalObjectId" | "observationId"
>;

export interface UniverseMembershipObservation {
  schemaVersion: typeof RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION;
  logicalObjectId: string;
  observationId: string;
  symbol: string;
  source: string;
  included: boolean;
  effectiveFrom: number;
  effectiveTo: number | null;
  knownAt: number;
}

export type CreateUniverseMembershipObservationInput = Omit<
  UniverseMembershipObservation,
  "schemaVersion" | "logicalObjectId" | "observationId"
>;

export interface RadarHardGateResult {
  code: RadarHardGateCode;
  passed: boolean;
  explanation: string;
  evidenceObservationIds: string[];
  evidenceRequestIds: string[];
}

export type RadarHardGateEvidence =
  | RadarMetricObservation
  | UniverseMembershipObservation
  | ExecutionVenueEligibilityObservation;

export interface RadarDetectorResult {
  detectorId: string;
  detectorType: RadarMoveDetector["type"];
  evaluable: boolean;
  passed: boolean;
  observationIds: string[];
  observationRequestIds: string[];
  winningObservationId: string | null;
  winningObservationRequestId: string | null;
  explanation: string;
}

export interface RadarGateEvaluation {
  id: string;
  symbol: string;
  source: string;
  asOf: number;
  detectorResults: RadarDetectorResult[];
  hardGateResults: RadarHardGateResult[];
  hardGateEvidence: RadarHardGateEvidence[];
  evaluable: boolean;
  detectorGatePassed: boolean;
  hardGatesPassed: boolean;
  compositePassed: boolean;
}

export interface RadarEpisode {
  id: string;
  logicalObjectId: string;
  observationId: string;
  schemaVersion: typeof RADAR_EPISODE_SCHEMA_VERSION;
  symbol: string;
  source: string;
  setupFamily: SetupFamily;
  selectionProfileId: string;
  selectionProfileVersion: string;
  selectionProfileHash: string;
  detectedAt: number;
  effectiveAsOf: number;
  scanTimeframe: string;
  triggeringDetectorIds: string[];
  triggeringObservations: RadarMetricObservation[];
  selectionGateEvaluationId: string;
  hardGateResults: RadarHardGateResult[];
  hardGateEvidence: RadarHardGateEvidence[];
  contextObservations: RadarMetricObservation[];
  selectionAnchor: RadarSelectionAnchor | null;
  pathContext: RadarPathContext;
  initialLifecycleCandidateId: string | null;
  initialLifecycleCandidateRef: DurableObjectReference | null;
  initialLifecycleState: string | null;
  initialLifecycleStateRef: DurableObjectReference | null;
  initialMtfStructure: Record<string, DurableObjectReference>;
  activeUntil: number;
  terminalAt: null;
  terminalReason: null;
  rearmState: "blockedUntilReset";
  executionVenueEligibility: ExecutionVenueEligibilityObservation;
  dataQualityNotes: RadarDataQualityNote[];
}

export interface RadarEpisodeStatusObservation {
  schemaVersion: typeof RADAR_STATUS_OBSERVATION_SCHEMA_VERSION;
  logicalObjectId: string;
  observationId: string;
  episodeId: string;
  asOf: number;
  status: "active" | "expired" | "reset";
  reason: "detected" | "maximumAgeElapsed" | "radarGateReset";
  rearmState: "blockedUntilReset" | "armed";
}

export interface ReplayCaseManifest {
  id: string;
  schemaVersion: typeof REPLAY_CASE_MANIFEST_SCHEMA_VERSION;
  radarEpisodeId: string;
  radarEpisodeObservationId: string;
  symbol: string;
  source: string;
  detectedAt: number;
  startAsOf: number;
  selectionProfileRef: {
    id: string;
    version: string;
    canonicalConfigHash: string;
  };
  lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
  strategyProfileRef: {
    id: string;
    version: string;
    profileHash: string;
  };
  availableTimeframes: string[];
  preRollRequirements: Array<{
    timeframe: string;
    minimumDurationSeconds: number;
    minimumBars: number;
    purposes: string[];
  }>;
  dataCoverageByTimeframe: Record<
    string,
    {
      availableStart: number | null;
      availableEnd: number | null;
      completedThrough: number | null;
      completedCandleCount: number;
    }
  >;
  initialRadarObservations: RadarMetricObservation[];
  initialHardGateResults: RadarHardGateResult[];
  initialHardGateEvidence: RadarHardGateEvidence[];
  initialLifecycleState: string | null;
  initialLifecycleStateRef: DurableObjectReference | null;
  executionVenueEligibility: ExecutionVenueEligibilityObservation;
  dataQualityNotes: RadarDataQualityNote[];
  futureOutcomeRef: null;
}

export interface RadarSymbolSeries {
  symbol: string;
  source: string;
  dataOrigin?: string | null;
  candlesByTimeframe: Record<string, readonly CandleRecord[]>;
}

export interface RadarScanInput {
  candlesBySymbolAndTimeframe: Record<string, RadarSymbolSeries>;
  selectionProfile: RadarSelectionProfile;
  from: number;
  to: number;
  strategyProfile?: StrategyProfile;
  lifecycleHistory?: Record<string, readonly SetupStateSnapshot[]>;
  universeHistory?: readonly UniverseMembershipObservation[];
  venueEligibilityHistory?: readonly ExecutionVenueEligibilityObservation[];
  structureHistory?: readonly RadarStructureObservation[];
}

export interface RadarScanResult {
  schemaVersion: typeof RADAR_SCAN_RESULT_SCHEMA_VERSION;
  selectionProfileRef: {
    id: string;
    version: string;
    canonicalConfigHash: string;
  };
  from: number;
  to: number;
  observations: RadarMetricObservation[];
  gateEvaluations: RadarGateEvaluation[];
  episodes: RadarEpisode[];
  episodeStatusObservations: RadarEpisodeStatusObservation[];
  replayCaseManifests: ReplayCaseManifest[];
}

interface DetectorEvaluationInternal {
  result: RadarDetectorResult;
  observations: RadarMetricObservation[];
  anchor: RadarSelectionAnchor | null;
}

interface MutableRadarState {
  previousGate: boolean | null;
  previousEvaluationAsOf: number | null;
  activeEpisode: RadarEpisode | null;
  blockedEpisode: RadarEpisode | null;
  falseSince: number | null;
  armed: boolean;
}

interface HardGateEvaluationInternal {
  results: RadarHardGateResult[];
  evidence: RadarHardGateEvidence[];
}

export function radarSelectionProfileHash(
  profile: RadarSelectionProfileDefinition | RadarSelectionProfile,
) {
  const { canonicalConfigHash: _hash, ...definition } = profile as RadarSelectionProfile;
  return canonicalHash(definition);
}

export function createRadarSelectionProfile(
  definition: RadarSelectionProfileDefinition,
): RadarSelectionProfile {
  validateProfile(definition);
  return immutableJsonClone({
    ...definition,
    canonicalConfigHash: radarSelectionProfileHash(definition),
  });
}

export function createExecutionVenueEligibilityObservation(
  input: CreateExecutionVenueEligibilityObservationInput,
): ExecutionVenueEligibilityObservation {
  if (
    !input.symbol.trim() ||
    !input.marketDataSource.trim() ||
    !input.executionVenue.trim() ||
    !input.evidenceSource.trim() ||
    !Number.isFinite(input.effectiveFrom) ||
    !Number.isFinite(input.knownAt) ||
    (input.effectiveTo != null &&
      (!Number.isFinite(input.effectiveTo) || input.effectiveTo < input.effectiveFrom))
  ) {
    throw new RangeError("Execution-venue eligibility observation is invalid");
  }
  const definition = {
    schemaVersion: EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
    logicalObjectId: `execution-venue:${input.executionVenue.toLowerCase()}:${input.symbol.toUpperCase()}`,
    ...input,
  };
  return immutableJsonClone({
    ...definition,
    observationId: executionVenueEligibilityObservationId(definition),
  });
}

export function createRadarStructureObservation(
  input: CreateRadarStructureObservationInput,
): RadarStructureObservation {
  if (
    !input.logicalObjectId.trim() ||
    !input.symbol.trim() ||
    !input.source.trim() ||
    !isStrictTimeframe(input.timeframe) ||
    !input.state.trim() ||
    !Number.isFinite(input.eventTime) ||
    !Number.isFinite(input.knownAt) ||
    input.knownAt < input.eventTime
  ) {
    throw new RangeError("Radar structure observation is invalid");
  }
  const definition = {
    schemaVersion: RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
    ...input,
  };
  return immutableJsonClone({
    ...definition,
    observationId: radarStructureObservationId(definition),
  });
}

export function createUniverseMembershipObservation(
  input: CreateUniverseMembershipObservationInput,
): UniverseMembershipObservation {
  if (
    !input.symbol.trim() ||
    !input.source.trim() ||
    !Number.isFinite(input.effectiveFrom) ||
    !Number.isFinite(input.knownAt) ||
    (input.effectiveTo != null &&
      (!Number.isFinite(input.effectiveTo) || input.effectiveTo < input.effectiveFrom))
  ) {
    throw new RangeError("Universe membership observation is invalid");
  }
  const definition = {
    schemaVersion: RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
    logicalObjectId: `radar-universe:${input.source}:${input.symbol.toUpperCase()}`,
    ...input,
  };
  return immutableJsonClone({
    ...definition,
    observationId: universeMembershipObservationId(definition),
  });
}

export function universeMembershipObservationId(
  observation: Omit<UniverseMembershipObservation, "observationId"> | UniverseMembershipObservation,
) {
  const { observationId: _observationId, ...definition } = observation as UniverseMembershipObservation;
  return `radar-universe-observation:${hashSuffix(definition)}`;
}

export function radarStructureObservationId(
  observation: Omit<RadarStructureObservation, "observationId"> | RadarStructureObservation,
) {
  const { observationId: _observationId, ...definition } = observation as RadarStructureObservation;
  return `radar-structure-observation:${hashSuffix(definition)}`;
}

export function createDurableObjectReference(input: {
  logicalObjectId: string;
  objectType: string;
  eventTime: number | null;
  knownAt: number;
  snapshot: unknown;
}): DurableObjectReference {
  if (
    !input.logicalObjectId.trim() ||
    !input.objectType.trim() ||
    !Number.isFinite(input.knownAt) ||
    (input.eventTime != null &&
      (!Number.isFinite(input.eventTime) || input.eventTime > input.knownAt))
  ) {
    throw new RangeError("Durable object reference is invalid");
  }
  const snapshot = JSON.parse(canonicalSerialize(input.snapshot)) as JsonValue;
  return immutableJsonClone({
    logicalObjectId: input.logicalObjectId,
    observationId: `${input.objectType.toLowerCase()}-observation:${hashSuffix({
      logicalObjectId: input.logicalObjectId,
      eventTime: input.eventTime,
      knownAt: input.knownAt,
      snapshot,
    })}`,
    objectType: input.objectType,
    eventTime: input.eventTime,
    knownAt: input.knownAt,
    snapshot,
  });
}

export function executionVenueEligibilityObservationId(
  observation: Omit<ExecutionVenueEligibilityObservation, "observationId"> | ExecutionVenueEligibilityObservation,
) {
  const { observationId: _observationId, ...definition } =
    observation as ExecutionVenueEligibilityObservation;
  return `execution-venue-observation:${hashSuffix(definition)}`;
}

export const EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE = createRadarSelectionProfile({
  schemaVersion: RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  id: "impulse_fade_v1.radar.experimental",
  version: "1",
  name: "Impulse Fade radar experimental default (unoptimized)",
  setupFamily: "impulse_fade_v1",
  scanTimeframe: "1h",
  evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
  moveDetectors: [
    {
      id: "max-local-return",
      type: "maximumWindowReturn",
      windowsSeconds: [2, 4, 8, 12, 24].map((hours) => hours * 3_600),
      minimumReturnPct: 8,
      minimumPercentile: 95,
      minimumZScore: 2,
      minimumSampleCount: 20,
      historyLookbackSeconds: 180 * 86_400,
      maximumReferenceStalenessSeconds: 3_600,
    },
    {
      id: "recent-trough-runup",
      type: "rollingTroughRunup",
      lookbackSeconds: 48 * 3_600,
      minimumRunupPct: 12,
      maximumTroughAgeSeconds: 24 * 3_600,
      referenceField: "close",
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 20,
      historyLookbackSeconds: 180 * 86_400,
    },
    {
      id: "one-hour-atr-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: "1h",
      emaPeriod: 20,
      atrPeriod: 14,
      minimumAtrDisplacement: 2,
      minimumSampleCount: 20,
    },
  ],
  detectorCombination: { mode: "any" },
  hardGates: ["dataQuality", "sourcePolicy", "executionVenueEligibility", "liquidity"],
  resetPolicy: { minimumFalseDurationSeconds: 4 * 3_600 },
  episodeExpiry: { maximumAgeSeconds: 72 * 3_600 },
  sourcePolicy: { allowedSources: ["bybit", "binance", "okx"] },
  executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
  liquidityPolicy: {
    minimumQuoteNotional: 1_000_000,
    windowSeconds: 24 * 3_600,
    missingData: "warn",
  },
  createdAt: 1_700_000_000,
});

export function scanRadarEpisodes(input: RadarScanInput): RadarScanResult {
  validateScanInput(input);
  const strategyProfile = input.strategyProfile ?? DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;
  const observations = new Map<string, RadarMetricObservation>();
  const gateEvaluations: RadarGateEvaluation[] = [];
  const episodes: RadarEpisode[] = [];
  const episodeStatusObservations: RadarEpisodeStatusObservation[] = [];
  const replayCaseManifests: ReplayCaseManifest[] = [];
  const seriesIdentities = new Set<string>();

  for (const [seriesKey, suppliedSeries] of Object.entries(input.candlesBySymbolAndTimeframe).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const series = cutoffSeries(suppliedSeries, input.to);
    const seriesIdentity = `${series.symbol.toUpperCase()}\u0000${series.source.toLowerCase()}`;
    if (seriesIdentities.has(seriesIdentity)) {
      throw new Error(`Duplicate radar series identity for ${series.symbol} from ${series.source}`);
    }
    seriesIdentities.add(seriesIdentity);
    const scanCandles = completedCandles(
      series.candlesByTimeframe[input.selectionProfile.scanTimeframe] ?? [],
      input.selectionProfile.scanTimeframe,
      input.to,
    );
    const points = scanCandles
      .map((item) => candleCloseTime(item, input.selectionProfile.scanTimeframe))
      .filter((asOf) => asOf <= input.to)
      .filter((asOf) => cadenceIncludes(asOf, input.selectionProfile));
    const state: MutableRadarState = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: true,
    };

    for (const asOf of points) {
      const expectedCadenceSeconds =
        strictTimeframeSeconds(input.selectionProfile.scanTimeframe) *
        input.selectionProfile.evaluationCadence.everyBars;
      if (
        state.previousEvaluationAsOf != null &&
        asOf - state.previousEvaluationAsOf > expectedCadenceSeconds
      ) {
        state.previousGate = null;
        state.falseSince = null;
      }
      const inRequestedRange = asOf >= input.from;
      const detectorEvaluations = input.selectionProfile.moveDetectors.map((detector) =>
        evaluateDetector(detector, series, asOf, input.selectionProfile.scanTimeframe),
      );
      if (inRequestedRange) {
        for (const evaluation of detectorEvaluations) {
          for (const observation of evaluation.observations) {
            observations.set(observation.requestId, observation);
          }
        }
      }
      const detectorGate = combineDetectorResults(
        detectorEvaluations.map((item) => item.result),
        input.selectionProfile.detectorCombination,
      );
      const venueEligibility = venueEligibilityAt(
        series,
        asOf,
        input.selectionProfile,
        input.venueEligibilityHistory ?? [],
      );
      const hardGateEvaluation = evaluateHardGates(
        series,
        asOf,
        input.selectionProfile,
        detectorEvaluations,
        venueEligibility,
        input.universeHistory ?? [],
      );
      const hardGateResults = hardGateEvaluation.results;
      const hardGatesPassed = hardGateResults.every((gate) => gate.passed);
      const compositePassed = detectorGate.passed && hardGatesPassed;
      const compositeEvaluable = !hardGatesPassed || detectorGate.evaluable;
      if (inRequestedRange) {
        for (const evidence of hardGateEvaluation.evidence) {
          if (evidence.schemaVersion === RADAR_METRIC_OBSERVATION_SCHEMA_VERSION) {
            observations.set(evidence.requestId, evidence);
          }
        }
      }
      const evaluation = createGateEvaluation(
        series,
        asOf,
        detectorEvaluations.map((item) => item.result),
        hardGateResults,
        hardGateEvaluation.evidence,
        detectorGate.passed,
        hardGatesPassed,
        compositePassed,
        compositeEvaluable,
      );
      if (inRequestedRange) gateEvaluations.push(evaluation);

      if (state.activeEpisode && asOf >= state.activeEpisode.activeUntil) {
        if (
          state.activeEpisode.detectedAt >= input.from &&
          state.activeEpisode.activeUntil <= input.to
        ) {
          episodeStatusObservations.push(
            createStatusObservation(
              state.activeEpisode,
              state.activeEpisode.activeUntil,
              "expired",
              "maximumAgeElapsed",
              "blockedUntilReset",
            ),
          );
        }
        state.activeEpisode = null;
      }

      if (compositeEvaluable && !compositePassed) {
        state.falseSince ??= asOf;
        if (
          !state.armed &&
          asOf - state.falseSince >= input.selectionProfile.resetPolicy.minimumFalseDurationSeconds
        ) {
          if (inRequestedRange && state.blockedEpisode?.detectedAt != null && state.blockedEpisode.detectedAt >= input.from) {
            episodeStatusObservations.push(
              createStatusObservation(state.blockedEpisode, asOf, "reset", "radarGateReset", "armed"),
            );
          }
          state.activeEpisode = null;
          state.blockedEpisode = null;
          state.armed = true;
        }
      } else if (compositeEvaluable) {
        state.falseSince = null;
      } else {
        state.falseSince = null;
      }

      if (compositeEvaluable && compositePassed && state.previousGate === false && state.armed) {
        const episode = createRadarEpisode({
          series,
          seriesKey,
          asOf,
          profile: input.selectionProfile,
          strategyProfile,
          detectorEvaluations,
          selectionEvaluation: evaluation,
          hardGateEvidence: hardGateEvaluation.evidence,
          venueEligibility,
          lifecycleHistory: input.lifecycleHistory?.[seriesKey] ?? [],
          structureHistory: input.structureHistory ?? [],
        });
        if (inRequestedRange) {
          episodes.push(episode);
          episodeStatusObservations.push(
            createStatusObservation(episode, asOf, "active", "detected", "blockedUntilReset"),
          );
          const manifest = createReplayCaseManifest(episode, series, input.selectionProfile, strategyProfile);
          replayCaseManifests.push(manifest);
          for (const observation of episode.contextObservations) {
            observations.set(observation.requestId, observation);
          }
        }
        state.activeEpisode = episode;
        state.blockedEpisode = episode;
        state.armed = false;
      }

      state.previousGate = compositeEvaluable ? compositePassed : null;
      state.previousEvaluationAsOf = asOf;
    }
  }

  return immutableJsonClone({
    schemaVersion: RADAR_SCAN_RESULT_SCHEMA_VERSION,
    selectionProfileRef: profileRef(input.selectionProfile),
    from: input.from,
    to: input.to,
    observations: [...observations.values()].sort(compareObservations),
    gateEvaluations: gateEvaluations.sort(compareEvaluations),
    episodes: episodes.sort(compareEpisodes),
    episodeStatusObservations: episodeStatusObservations.sort(compareStatusObservations),
    replayCaseManifests: replayCaseManifests.sort((left, right) => left.id.localeCompare(right.id)),
  });
}

function evaluateDetector(
  detector: RadarMoveDetector,
  series: RadarSymbolSeries,
  asOf: number,
  scanTimeframe: string,
): DetectorEvaluationInternal {
  if (detector.type === "rollingTroughRunup") {
    return evaluateRollingTroughRunup(detector, series, asOf, scanTimeframe);
  }
  if (detector.type === "elapsedWindowReturn") {
    return evaluateElapsedWindowReturn(detector, series, asOf, scanTimeframe);
  }
  if (detector.type === "maximumWindowReturn") {
    return evaluateMaximumWindowReturn(detector, series, asOf, scanTimeframe);
  }
  return evaluateEmaAtrDisplacement(detector, series, asOf);
}

function evaluateRollingTroughRunup(
  detector: RollingTroughRunupDetector,
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
): DetectorEvaluationInternal {
  const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const current = candles.at(-1) ?? null;
  const eligible = current
    ? candles.filter(
        (item) =>
          item.bucket >= current.bucket - detector.lookbackSeconds &&
          item.bucket <= current.bucket &&
          current.bucket - item.bucket <= detector.maximumTroughAgeSeconds,
      )
    : [];
  const trough = eligible.reduce<CandleRecord | null>((selected, item) => {
    if (!validPositive(item.c)) return selected;
    if (!selected || item.c < selected.c || (item.c === selected.c && item.bucket < selected.bucket)) {
      return item;
    }
    return selected;
  }, null);
  const value = current && trough && validPositive(trough.c) ? (current.c / trough.c - 1) * 100 : null;
  const historicalValues = historicalRunups(candles, current, detector);
  const statistics = distributionStatistics(historicalValues, value, detector.minimumSampleCount);
  const notes: RadarDataQualityNote[] = [];
  if (!current) notes.push(note("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff"));
  if (!trough) notes.push(note("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const configHash = canonicalHash(detector);
  const observation = createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: "rolling_trough_runup",
    metricVersion: "rolling-trough-runup.1",
    window: detector.lookbackSeconds,
    referenceTime: trough?.bucket ?? null,
    referenceValue: trough?.c ?? null,
    value,
    unit: "percent",
    percentile: statistics.percentile,
    zScore: statistics.zScore,
    sampleCount: historicalValues.length,
    historyCandles: relevantHistoryCandles(candles, current, detector.historyLookbackSeconds + detector.lookbackSeconds),
    configHash,
    notes: [...notes, ...statistics.notes],
  });
  const thresholdsPass =
    value != null &&
    value + 1e-12 >= detector.minimumRunupPct &&
    optionalMinimum(observation.percentile, detector.minimumPercentile) &&
    optionalMinimum(observation.zScore, detector.minimumZScore) &&
    observation.sampleCount >= detector.minimumSampleCount;
  const anchor = trough
    ? createSelectionAnchor(series, asOf, trough, observation)
    : null;
  return {
    result: detectorResult(
      detector,
      thresholdsPass,
      [observation],
      thresholdsPass ? observation.observationId : null,
      value == null
        ? "Run-up unavailable"
        : `Completed-close run-up ${formatPct(value)} versus ${formatPct(detector.minimumRunupPct)} minimum`,
    ),
    observations: [observation],
    anchor,
  };
}

function evaluateElapsedWindowReturn(
  detector: ElapsedWindowReturnDetector,
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
): DetectorEvaluationInternal {
  const observation = computeElapsedReturnObservation(detector, series, asOf, timeframe);
  const passed = returnThresholdsPass(observation, detector);
  return {
    result: detectorResult(
      detector,
      passed,
      [observation],
      passed ? observation.observationId : null,
      observation.value == null
        ? "Elapsed return unavailable"
        : `${formatDuration(detector.windowSeconds)} return ${formatPct(observation.value)}`,
    ),
    observations: [observation],
    anchor: null,
  };
}

function evaluateMaximumWindowReturn(
  detector: MaximumWindowReturnDetector,
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
): DetectorEvaluationInternal {
  const individual = [...new Set(detector.windowsSeconds)]
    .sort((left, right) => left - right)
    .map((windowSeconds) =>
      computeElapsedReturnObservation(
        {
          ...detector,
          id: `${detector.id}:${windowSeconds}`,
          type: "elapsedWindowReturn",
          windowSeconds,
        },
        series,
        asOf,
        timeframe,
      ),
    );
  const winner = individual
    .filter((item) => item.value != null)
    .sort((left, right) =>
      (right.value ?? -Infinity) - (left.value ?? -Infinity) ||
      (left.window ?? Infinity) - (right.window ?? Infinity),
    )[0] ?? null;
  const historyCandles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const aggregate = createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: "maximum_window_return",
    metricVersion: "maximum-window-return.1",
    window: winner?.window ?? null,
    logicalWindow: null,
    referenceTime: winner?.referenceTime ?? null,
    referenceValue: winner?.referenceValue ?? null,
    value: winner?.value ?? null,
    unit: "percent",
    percentile: winner?.percentile ?? null,
    zScore: winner?.zScore ?? null,
    sampleCount: winner?.sampleCount ?? 0,
    historyCandles: relevantHistoryCandles(
      historyCandles,
      historyCandles.at(-1) ?? null,
      detector.historyLookbackSeconds + Math.max(...detector.windowsSeconds),
    ),
    configHash: canonicalHash(detector),
    notes: winner
      ? winner.dataQualityNotes
      : [note("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")],
  });
  const passed = returnThresholdsPass(aggregate, detector);
  const observations = [...individual, aggregate];
  return {
    result: detectorResult(
      detector,
      passed,
      observations,
      passed ? winner?.observationId ?? null : null,
      winner?.value == null
        ? "Maximum elapsed return unavailable"
        : `Winning ${formatDuration(winner.window ?? 0)} return ${formatPct(winner.value)}`,
    ),
    observations,
    anchor: null,
  };
}

function evaluateEmaAtrDisplacement(
  detector: EmaAtrDisplacementDetector,
  series: RadarSymbolSeries,
  asOf: number,
): DetectorEvaluationInternal {
  const timeframe = detector.analysisTimeframe;
  const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const current = candles.at(-1) ?? null;
  const ema = emaValues(candles, detector.emaPeriod).at(-1) ?? null;
  const atr = atrValues(candles, detector.atrPeriod).at(-1) ?? null;
  const value = current && ema != null && atr != null && atr > 0 ? (current.c - ema) / atr : null;
  const requiredSamples = Math.max(detector.minimumSampleCount, detector.emaPeriod, detector.atrPeriod);
  const notes: RadarDataQualityNote[] = [];
  if (!current) notes.push(note("NO_COMPLETED_CANDLE", "error", `No completed ${timeframe} candle exists at cutoff`));
  if (candles.length < requiredSamples || value == null) {
    notes.push(
      note(
        "INSUFFICIENT_METRIC_HISTORY",
        "error",
        `EMA/ATR displacement requires ${requiredSamples} completed ${timeframe} candles`,
      ),
    );
  }
  const observation = createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: current?.bucket ?? null,
    referenceValue: ema,
    value,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: candles.length,
    historyCandles: candles.slice(-requiredSamples),
    configHash: canonicalHash(detector),
    notes: dedupeNotes(notes),
  });
  const passed =
    value != null &&
    candles.length >= requiredSamples &&
    value + 1e-12 >= detector.minimumAtrDisplacement;
  return {
    result: detectorResult(
      detector,
      passed,
      [observation],
      passed ? observation.observationId : null,
      value == null ? "EMA/ATR displacement unavailable" : `EMA displacement ${value.toFixed(2)} ATR`,
    ),
    observations: [observation],
    anchor: null,
  };
}

function computeElapsedReturnObservation(
  detector: ElapsedWindowReturnDetector,
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
) {
  const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const current = candles.at(-1) ?? null;
  const reference = current ? latestAtOrBefore(candles, current.bucket - detector.windowSeconds) : null;
  const referenceStaleness = current && reference
    ? current.bucket - detector.windowSeconds - reference.bucket
    : null;
  const stale =
    referenceStaleness != null &&
    detector.maximumReferenceStalenessSeconds != null &&
    referenceStaleness > detector.maximumReferenceStalenessSeconds;
  const value = current && reference && !stale && validPositive(reference.c)
    ? (current.c / reference.c - 1) * 100
    : null;
  const historicalValues = historicalElapsedReturns(candles, current, detector);
  const statistics = distributionStatistics(historicalValues, value, detector.minimumSampleCount);
  const notes = [...statistics.notes];
  if (!current) notes.push(note("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff"));
  if (!reference) {
    notes.push(note("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists"));
  } else if (stale) {
    notes.push(note("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness"));
  }
  return createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: detector.windowSeconds,
    referenceTime: reference?.bucket ?? null,
    referenceValue: reference?.c ?? null,
    value,
    unit: "percent",
    percentile: statistics.percentile,
    zScore: statistics.zScore,
    sampleCount: historicalValues.length,
    historyCandles: relevantHistoryCandles(
      candles,
      current,
      detector.historyLookbackSeconds + detector.windowSeconds,
    ),
    configHash: canonicalHash(detector),
    notes: dedupeNotes(notes),
  });
}

function createRadarEpisode(input: {
  series: RadarSymbolSeries;
  seriesKey: string;
  asOf: number;
  profile: RadarSelectionProfile;
  strategyProfile: StrategyProfile;
  detectorEvaluations: DetectorEvaluationInternal[];
  selectionEvaluation: RadarGateEvaluation;
  hardGateEvidence: RadarHardGateEvidence[];
  venueEligibility: ExecutionVenueEligibilityObservation;
  lifecycleHistory: readonly SetupStateSnapshot[];
  structureHistory: readonly RadarStructureObservation[];
}): RadarEpisode {
  const passing = input.detectorEvaluations.filter((item) => item.result.passed);
  const triggeringObservations = dedupeObservations(
    passing.flatMap((item) =>
      item.observations.filter((observation) =>
        observation.observationId === item.result.winningObservationId,
      ),
    ),
  );
  const anchor = passing.find((item) => item.anchor)?.anchor ?? null;
  const scanCandles = completedCandles(
    input.series.candlesByTimeframe[input.profile.scanTimeframe] ?? [],
    input.profile.scanTimeframe,
    input.asOf,
  );
  const net24h = elapsedReturnObservation(input.series, input.asOf, input.profile.scanTimeframe, 86_400);
  const net48h = elapsedReturnObservation(input.series, input.asOf, input.profile.scanTimeframe, 172_800);
  const volume = quoteNotionalObservation(input.series, input.asOf, input.profile);
  const configuredAtrObservation = input.detectorEvaluations
    .flatMap((item) => item.observations)
    .find((item) => item.metricCode === "ema_atr_displacement") ?? null;
  const atrObservation = configuredAtrObservation ?? evaluateEmaAtrDisplacement(
    {
      id: "context-ema-atr-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: input.profile.scanTimeframe,
      emaPeriod: 20,
      atrPeriod: 14,
      minimumAtrDisplacement: 0,
      minimumSampleCount: 20,
    },
    input.series,
    input.asOf,
  ).observations[0];
  const initialMtfStructure = structureAt(
    input.structureHistory,
    input.series,
    input.asOf,
  );
  const contextObservations = dedupeObservations([
    ...triggeringObservations,
    net24h,
    net48h,
    volume,
    atrObservation,
  ]);
  const primaryResult = passing[0];
  const primaryObservation = primaryResult
    ? triggeringObservations.find(
        (observation) => observation.observationId === primaryResult.result.winningObservationId,
      ) ?? triggeringObservations[0] ?? null
    : null;
  const pathContext = buildPathContext(
    scanCandles,
    anchor,
    primaryResult?.result.detectorId ?? "unknown",
    primaryObservation,
    net24h,
    net48h,
    volume,
    atrObservation,
    initialMtfStructure,
  );
  const lifecycleSnapshot = latestLifecycleAt(
    input.lifecycleHistory,
    input.series,
    input.asOf,
    input.strategyProfile,
  );
  const lifecycle = lifecycleSnapshot?.candidate ? lifecycleSnapshot : null;
  const candidate = lifecycle?.candidate ?? null;
  const lifecycleKnownAt = lifecycle?.asOf ?? null;
  const lifecycleStateRef = lifecycle && lifecycleKnownAt != null
    ? createDurableObjectReference({
        logicalObjectId: candidate?.id ?? `impulse-fade-lifecycle:${input.series.source}:${input.series.symbol}`,
        objectType: "SetupStateSnapshot",
        eventTime: lifecycle.updatedTs,
        knownAt: lifecycleKnownAt,
        snapshot: lifecycle,
      })
    : null;
  const candidateRef = candidate
    ? createDurableObjectReference({
        logicalObjectId: candidate.id,
        objectType: "SetupCandidateEpisode",
        eventTime: candidate.detectionEventTime,
        knownAt: lifecycleKnownAt ?? candidate.detectedAt,
        snapshot: candidate,
      })
    : null;
  const episodeBase = {
    schemaVersion: RADAR_EPISODE_SCHEMA_VERSION,
    symbol: input.series.symbol,
    source: input.series.source,
    setupFamily: input.profile.setupFamily,
    selectionProfileId: input.profile.id,
    selectionProfileVersion: input.profile.version,
    selectionProfileHash: input.profile.canonicalConfigHash,
    detectedAt: input.asOf,
    effectiveAsOf: input.asOf,
    scanTimeframe: input.profile.scanTimeframe,
    triggeringDetectorIds: passing.map((item) => item.result.detectorId),
    triggeringObservations,
    selectionGateEvaluationId: input.selectionEvaluation.id,
    hardGateResults: input.selectionEvaluation.hardGateResults,
    hardGateEvidence: input.hardGateEvidence,
    contextObservations,
    selectionAnchor: anchor,
    pathContext,
    initialLifecycleCandidateId: candidate?.id ?? null,
    initialLifecycleCandidateRef: candidateRef,
    initialLifecycleState: lifecycle?.state ?? null,
    initialLifecycleStateRef: lifecycleStateRef,
    initialMtfStructure,
    activeUntil: input.asOf + input.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset" as const,
    executionVenueEligibility: input.venueEligibility,
    dataQualityNotes: dedupeNotes([
      ...contextObservations.flatMap((item) => item.dataQualityNotes),
      ...input.venueEligibility.dataQualityNotes,
    ]),
  };
  const id = `radar-episode:${hashSuffix({
    symbol: episodeBase.symbol,
    source: episodeBase.source,
    profileHash: episodeBase.selectionProfileHash,
    detectedAt: episodeBase.detectedAt,
    triggeringObservationIds: triggeringObservations.map((item) => item.observationId),
  })}`;
  const exact = { ...episodeBase, id, logicalObjectId: id };
  return immutableJsonClone({
    ...exact,
    observationId: `radar-episode-observation:${hashSuffix(exact)}`,
  });
}

function createReplayCaseManifest(
  episode: RadarEpisode,
  series: RadarSymbolSeries,
  profile: RadarSelectionProfile,
  strategyProfile: StrategyProfile,
): ReplayCaseManifest {
  const inputTimeframes = Object.keys(series.candlesByTimeframe)
    .filter(
      (timeframe) =>
        completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, episode.detectedAt)
          .length > 0,
    )
    .sort(compareTimeframes);
  const dataCoverageByTimeframe = Object.fromEntries(
    inputTimeframes.map((timeframe) => {
      const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, episode.detectedAt);
      return [
        timeframe,
        {
          availableStart: candles[0]?.bucket ?? null,
          availableEnd: candles.at(-1)?.bucket ?? null,
          completedThrough: candles.at(-1) ? candleCloseTime(candles.at(-1)!, timeframe) : null,
          completedCandleCount: candles.length,
        },
      ];
    }),
  );
  const availableTimeframes = inputTimeframes.filter(
    (timeframe) => dataCoverageByTimeframe[timeframe].completedCandleCount > 0,
  );
  const definition = {
    schemaVersion: REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
    radarEpisodeId: episode.id,
    radarEpisodeObservationId: episode.observationId,
    symbol: episode.symbol,
    source: episode.source,
    detectedAt: episode.detectedAt,
    startAsOf: episode.detectedAt,
    selectionProfileRef: profileRef(profile),
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    strategyProfileRef: {
      id: strategyProfile.id,
      version: strategyProfile.version,
      profileHash: strategyProfile.profileHash,
    },
    availableTimeframes,
    preRollRequirements: preRollRequirements(profile),
    dataCoverageByTimeframe,
    initialRadarObservations: episode.contextObservations,
    initialHardGateResults: episode.hardGateResults,
    initialHardGateEvidence: episode.hardGateEvidence,
    initialLifecycleState: episode.initialLifecycleState,
    initialLifecycleStateRef: episode.initialLifecycleStateRef,
    executionVenueEligibility: episode.executionVenueEligibility,
    dataQualityNotes: episode.dataQualityNotes,
    futureOutcomeRef: null,
  };
  return immutableJsonClone({
    ...definition,
    id: `replay-case:${hashSuffix(definition)}`,
  });
}

function elapsedReturnObservation(
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
  windowSeconds: number,
) {
  const detector: ElapsedWindowReturnDetector = {
    id: `context-return-${windowSeconds}`,
    type: "elapsedWindowReturn",
    windowSeconds,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: windowSeconds,
    maximumReferenceStalenessSeconds: null,
  };
  const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const current = candles.at(-1) ?? null;
  const reference = current
    ? latestAtOrBefore(candles, current.bucket - windowSeconds)
    : null;
  const value = current && reference && validPositive(reference.c)
    ? (current.c / reference.c - 1) * 100
    : null;
  const notes = value == null
    ? [note("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${windowSeconds}-second reference exists`)]
    : [];
  return createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: windowSeconds,
    referenceTime: reference?.bucket ?? null,
    referenceValue: reference?.c ?? null,
    value,
    unit: "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: candles,
    configHash: canonicalHash(detector),
    notes,
  });
}

function quoteNotionalObservation(
  series: RadarSymbolSeries,
  asOf: number,
  profile: RadarSelectionProfile,
) {
  const timeframe = profile.scanTimeframe;
  const candles = completedCandles(series.candlesByTimeframe[timeframe] ?? [], timeframe, asOf);
  const current = candles.at(-1) ?? null;
  const windowCandles = current
    ? candles.filter((item) => item.bucket > current.bucket - profile.liquidityPolicy.windowSeconds)
    : [];
  const values = windowCandles.map((item) =>
    finite(item.v_quote) ? item.v_quote! : finite(item.v_base) ? item.v_base! * item.c : null,
  );
  const complete = values.length > 0 && values.every((value) => value != null);
  const value = complete ? values.reduce<number>((sum, item) => sum + (item ?? 0), 0) : null;
  const config = {
    metric: "quote_notional",
    timeframe,
    windowSeconds: profile.liquidityPolicy.windowSeconds,
  };
  return createMetricObservation({
    detector: config,
    series,
    asOf,
    timeframe,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: profile.liquidityPolicy.windowSeconds,
    referenceTime: windowCandles[0]?.bucket ?? null,
    referenceValue: null,
    value,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: windowCandles.length,
    historyCandles: windowCandles,
    configHash: canonicalHash(config),
    notes: complete
      ? []
      : [note("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")],
  });
}

function createMetricObservation(input: {
  detector: unknown;
  series: RadarSymbolSeries;
  asOf: number;
  timeframe: string | null;
  metricCode: string;
  metricVersion: string;
  window: number | null;
  logicalWindow?: number | null;
  referenceTime: number | null;
  referenceValue: number | null;
  value: number | null;
  unit: RadarMetricUnit;
  percentile: number | null;
  zScore: number | null;
  sampleCount: number;
  historyCandles: readonly CandleRecord[];
  configHash: string;
  notes: RadarDataQualityNote[];
}): RadarMetricObservation {
  const historyStart = input.historyCandles[0]?.bucket ?? null;
  const historyEnd = input.historyCandles.at(-1)?.bucket ?? null;
  const effectiveAsOf =
    input.timeframe && input.historyCandles.at(-1)
      ? candleCloseTime(input.historyCandles.at(-1)!, input.timeframe)
      : input.asOf;
  const knownAt = input.timeframe
    ? input.historyCandles.reduce(
        (latest, item) => Math.max(latest, candleRevisionKnownAt(item, input.timeframe!)),
        effectiveAsOf,
      )
    : input.asOf;
  const inputHash = canonicalHash(
    input.historyCandles.map((item) => ({
      bucket: item.bucket,
      ts: item.ts,
      o: item.o,
      h: item.h,
      l: item.l,
      c: item.c,
      vBase: finite(item.v_base) ? item.v_base : null,
      vQuote: finite(item.v_quote) ? item.v_quote : null,
      ver: finite(item.ver) ? item.ver : null,
      knownAt: input.timeframe ? candleRevisionKnownAt(item, input.timeframe) : null,
    })),
  );
  const logicalObjectId = `radar-metric:${hashSuffix({
    metricCode: input.metricCode,
    symbol: input.series.symbol,
    source: input.series.source,
    dataOrigin: input.series.dataOrigin ?? null,
    timeframe: input.timeframe,
    window: input.logicalWindow === undefined ? input.window : input.logicalWindow,
    configHash: input.configHash,
  })}`;
  const revisionDefinition = {
    schemaVersion: RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
    logicalObjectId,
    metricCode: input.metricCode,
    metricVersion: input.metricVersion,
    symbol: input.series.symbol,
    source: input.series.source,
    dataOrigin: input.series.dataOrigin ?? null,
    timeframe: input.timeframe,
    effectiveAsOf,
    knownAt,
    window: input.window,
    referenceTime: input.referenceTime,
    referenceValue: input.referenceValue,
    value: input.value,
    unit: input.unit,
    percentile: input.percentile,
    zScore: input.zScore,
    sampleCount: input.sampleCount,
    historyStart,
    historyEnd,
    configHash: input.configHash,
    inputHash,
    dataQualityNotes: input.notes,
  };
  const observationId = `radar-observation:${hashSuffix(revisionDefinition)}`;
  const requestedAsOf = input.asOf;
  return immutableJsonClone({
    ...revisionDefinition,
    observationId,
    requestId: `radar-observation-request:${hashSuffix({ observationId, requestedAsOf })}`,
    requestedAsOf,
  });
}

function buildPathContext(
  candles: readonly CandleRecord[],
  anchor: RadarSelectionAnchor | null,
  detectorId: string,
  trigger: RadarMetricObservation | null,
  net24h: RadarMetricObservation,
  net48h: RadarMetricObservation,
  volume: RadarMetricObservation,
  atrObservation: RadarMetricObservation,
  initialMtfStructure: Record<string, DurableObjectReference>,
): RadarPathContext {
  const anchorCandle = anchor
    ? candles.find((item) => item.bucket === anchor.timestamp) ?? null
    : null;
  const prior = anchorCandle
    ? candles.filter((item) => item.bucket <= anchorCandle.bucket)
    : [];
  const priorPeak = prior.reduce<CandleRecord | null>((selected, item) => {
    if (!validPositive(item.c)) return selected;
    if (!selected || item.c > selected.c || (item.c === selected.c && item.bucket < selected.bucket)) {
      return item;
    }
    return selected;
  }, null);
  const current = candles.at(-1) ?? null;
  const priorDrawdownPct = anchor && priorPeak && validPositive(priorPeak.c)
    ? (anchor.price / priorPeak.c - 1) * 100
    : null;
  const recoveryFraction = anchor && priorPeak && current && priorPeak.c > anchor.price
    ? (current.c - anchor.price) / (priorPeak.c - anchor.price)
    : null;
  const contextTags: RadarContextTag[] = anchor && priorDrawdownPct != null && priorDrawdownPct < -5
    ? ["rebound_after_drawdown"]
    : ["unknown"];
  return {
    net24hReturnPct: net24h.value,
    net48hReturnPct: net48h.value,
    triggeringLocalImpulseReturnPct: trigger?.unit === "percent" ? trigger.value : null,
    triggeringDetectorId: detectorId,
    triggeringWindowSeconds: trigger?.window ?? null,
    selectionAnchorPrice: anchor?.price ?? null,
    selectionAnchorTime: anchor?.timestamp ?? null,
    selectionAnchorAgeSeconds: anchor?.ageSeconds ?? null,
    priorPeakPrice: priorPeak?.c ?? null,
    priorPeakTime: priorPeak?.bucket ?? null,
    priorDrawdownPct,
    recoveryFraction,
    currentAtrDisplacement: atrObservation.value,
    triggeringPercentile: trigger?.percentile ?? null,
    triggeringZScore: trigger?.zScore ?? null,
    quoteNotional: volume.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(initialMtfStructure).map(([timeframe, reference]) => [
        timeframe,
        typeof reference.snapshot === "object" &&
        reference.snapshot != null &&
        !Array.isArray(reference.snapshot) &&
        typeof reference.snapshot.state === "string"
          ? reference.snapshot.state
          : "unknown",
      ]),
    ),
    contextTags,
  };
}

function evaluateHardGates(
  series: RadarSymbolSeries,
  asOf: number,
  profile: RadarSelectionProfile,
  detectors: readonly DetectorEvaluationInternal[],
  venueEligibility: ExecutionVenueEligibilityObservation,
  universeHistory: readonly UniverseMembershipObservation[],
): HardGateEvaluationInternal {
  const evidence: RadarHardGateEvidence[] = [];
  const results = profile.hardGates.map((code) => {
    if (code === "sourcePolicy") {
      const passed =
        profile.sourcePolicy.allowedSources == null ||
        profile.sourcePolicy.allowedSources.includes(series.source);
      return hardGateResult(code, passed, passed ? "Source allowed" : "Source excluded", []);
    }
    if (code === "dataQuality") {
      const observations = dedupeObservations(detectors.flatMap((item) => item.observations));
      evidence.push(...observations);
      const passed = !detectors.some((item) =>
        item.observations.some((observation) =>
          observation.dataQualityNotes.some((item) => item.severity === "error"),
        ),
      );
      return hardGateResult(
        code,
        passed,
        passed ? "Required metrics available" : "Required metric data unavailable",
        observations,
      );
    }
    if (code === "executionVenueEligibility") {
      evidence.push(venueEligibility);
      const passed = venuePolicyPasses(venueEligibility.status, profile.executionVenuePolicy.mode);
      return hardGateResult(
        code,
        passed,
        `Execution venue ${venueEligibility.status}`,
        [venueEligibility],
      );
    }
    if (code === "selectedUniverse") {
      const membership = latestUniverseAt(universeHistory, series, asOf);
      if (membership) evidence.push(membership);
      return hardGateResult(
        code,
        membership?.included === true,
        membership
          ? membership.included
            ? "Symbol included"
            : "Symbol excluded"
          : "Historical universe membership unknown",
        membership ? [membership] : [],
      );
    }
    const volume = quoteNotionalObservation(series, asOf, profile);
    evidence.push(volume);
    const threshold = profile.liquidityPolicy.minimumQuoteNotional;
    const passed = threshold == null || volume.value == null
      ? threshold == null || profile.liquidityPolicy.missingData === "warn"
      : volume.value >= threshold;
    return hardGateResult(
      code,
      passed,
      threshold == null
        ? "No minimum liquidity configured"
        : volume.value == null
          ? "Quote-notional history unavailable"
          : `Quote notional ${volume.value} versus ${threshold} minimum`,
      [volume],
    );
  });
  return {
    results,
    evidence: dedupeHardGateEvidence(evidence),
  };
}

function hardGateResult(
  code: RadarHardGateCode,
  passed: boolean,
  explanation: string,
  evidence: readonly RadarHardGateEvidence[],
): RadarHardGateResult {
  return {
    code,
    passed,
    explanation,
    evidenceObservationIds: [...new Set(evidence.map((item) => item.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        evidence.flatMap((item) =>
          item.schemaVersion === RADAR_METRIC_OBSERVATION_SCHEMA_VERSION
            ? [item.requestId]
            : [],
        ),
      ),
    ].sort(),
  };
}

function venueEligibilityAt(
  series: RadarSymbolSeries,
  asOf: number,
  profile: RadarSelectionProfile,
  history: readonly ExecutionVenueEligibilityObservation[],
): ExecutionVenueEligibilityObservation {
  const venue = profile.executionVenuePolicy.intendedVenue ?? "ignored";
  const candidates = [...history]
    .filter(
      (item) =>
        item.symbol.toUpperCase() === series.symbol.toUpperCase() &&
        item.executionVenue.toLowerCase() === venue.toLowerCase() &&
        item.knownAt <= asOf &&
        item.effectiveFrom <= asOf &&
        (item.effectiveTo == null || item.effectiveTo >= asOf),
    );
  for (const item of candidates) {
    if (executionVenueEligibilityObservationId(item) !== item.observationId) {
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
    }
  }
  const match = latestUniqueObservation(
    candidates,
    (item) => [item.effectiveFrom, item.knownAt],
    "execution-venue eligibility",
  );
  if (match) {
    return match;
  }
  return createExecutionVenueEligibilityObservation({
    symbol: series.symbol,
    marketDataSource: series.source,
    executionVenue: venue,
    status: "Unknown" as const,
    effectiveFrom: asOf,
    effectiveTo: null,
    knownAt: asOf,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      note(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied",
      ),
    ],
  });
}

function createSelectionAnchor(
  series: RadarSymbolSeries,
  asOf: number,
  trough: CandleRecord,
  observation: RadarMetricObservation,
): RadarSelectionAnchor {
  const definition = {
    logicalObjectId: `selection-anchor:${hashSuffix({
      symbol: series.symbol,
      source: series.source,
      timestamp: trough.bucket,
      price: trough.c,
      referenceField: "close",
    })}`,
    timestamp: trough.bucket,
    price: trough.c,
    ageSeconds: Math.max(0, asOf - candleCloseTime(trough, observation.timeframe ?? "1h")),
    referenceField: "close" as const,
    sourceObservationId: observation.observationId,
  };
  return immutableJsonClone({
    ...definition,
    observationId: `selection-anchor-observation:${hashSuffix(definition)}`,
  });
}

function createStatusObservation(
  episode: RadarEpisode,
  asOf: number,
  status: RadarEpisodeStatusObservation["status"],
  reason: RadarEpisodeStatusObservation["reason"],
  rearmState: RadarEpisodeStatusObservation["rearmState"],
): RadarEpisodeStatusObservation {
  const definition = {
    schemaVersion: RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
    logicalObjectId: episode.id,
    episodeId: episode.id,
    asOf,
    status,
    reason,
    rearmState,
  };
  return immutableJsonClone({
    ...definition,
    observationId: `radar-status:${hashSuffix(definition)}`,
  });
}

function createGateEvaluation(
  series: RadarSymbolSeries,
  asOf: number,
  detectorResults: RadarDetectorResult[],
  hardGateResults: RadarHardGateResult[],
  hardGateEvidence: RadarHardGateEvidence[],
  detectorGatePassed: boolean,
  hardGatesPassed: boolean,
  compositePassed: boolean,
  evaluable: boolean,
): RadarGateEvaluation {
  const definition = {
    symbol: series.symbol,
    source: series.source,
    asOf,
    detectorResults,
    hardGateResults,
    hardGateEvidence,
    evaluable,
    detectorGatePassed,
    hardGatesPassed,
    compositePassed,
  };
  return immutableJsonClone({
    ...definition,
    id: `radar-gate:${hashSuffix(definition)}`,
  });
}

function detectorResult(
  detector: RadarMoveDetector,
  passed: boolean,
  observations: RadarMetricObservation[],
  winningObservationId: string | null,
  explanation: string,
): RadarDetectorResult {
  const evaluable =
    passed ||
    observations.every((observation) =>
      observation.dataQualityNotes.every((item) => item.severity !== "error"),
    );
  return {
    detectorId: detector.id,
    detectorType: detector.type,
    evaluable,
    passed,
    observationIds: observations.map((item) => item.observationId),
    observationRequestIds: observations.map((item) => item.requestId),
    winningObservationId,
    winningObservationRequestId:
      observations.find((item) => item.observationId === winningObservationId)?.requestId ?? null,
    explanation,
  };
}

function missingObservation(
  detector: RadarMoveDetector,
  series: RadarSymbolSeries,
  asOf: number,
  timeframe: string,
  code: string,
  message: string,
) {
  return createMetricObservation({
    detector,
    series,
    asOf,
    timeframe,
    metricCode: detector.type,
    metricVersion: `${detector.type}.1`,
    window: null,
    referenceTime: null,
    referenceValue: null,
    value: null,
    unit: detector.type === "emaAtrDisplacement" ? "atr" : "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: [],
    configHash: canonicalHash(detector),
    notes: [note(code, "error", message)],
  });
}

function completedCandles(
  candles: readonly CandleRecord[],
  timeframe: string,
  asOf: number,
) {
  return orderedCandles(cutoffCandleRevisions(candles, timeframe, asOf), timeframe);
}

function cutoffCandleRevisions(
  candles: readonly CandleRecord[],
  timeframe: string,
  asOf: number,
) {
  const timeframeSeconds = strictTimeframeSeconds(timeframe);
  return candles.filter((item) => {
    if (!Number.isFinite(item.bucket)) {
      throw new RangeError("Candle bucket must be finite");
    }
    const closeTime = item.bucket + timeframeSeconds;
    if (closeTime > asOf) return false;
    if (item.knownAt != null && !Number.isFinite(item.knownAt)) {
      throw new RangeError(`Invalid candle revision time for bucket ${item.bucket}`);
    }
    return candleRevisionKnownAt(item, timeframe) <= asOf;
  });
}

function orderedCandles(candles: readonly CandleRecord[], timeframe: string) {
  const timeframeSeconds = strictTimeframeSeconds(timeframe);
  const byBucket = new Map<number, CandleRecord>();
  for (const candle of [...candles].sort((left, right) => left.bucket - right.bucket || left.ts - right.ts)) {
    if (
      !validCandle(candle) ||
      candle.bucket % timeframeSeconds !== 0 ||
      Math.floor(candle.ts / timeframeSeconds) * timeframeSeconds !== candle.bucket
    ) {
      throw new RangeError(`Invalid candle for bucket ${candle.bucket}`);
    }
    const closeTime = candle.bucket + timeframeSeconds;
    const revisionKnownAt = candleRevisionKnownAt(candle, timeframe);
    if (revisionKnownAt < closeTime) {
      throw new RangeError(`Candle revision predates close for bucket ${candle.bucket}`);
    }
    const existing = byBucket.get(candle.bucket);
    if (existing) {
      const existingKnownAt = candleRevisionKnownAt(existing, timeframe);
      if (
        existingKnownAt === revisionKnownAt &&
        canonicalCandle(existing, timeframe) !== canonicalCandle(candle, timeframe)
      ) {
        throw new Error(
          `Conflicting candle revisions for bucket ${candle.bucket} at ${revisionKnownAt}`,
        );
      }
      if (existingKnownAt > revisionKnownAt) continue;
    }
    byBucket.set(candle.bucket, candle);
  }
  return [...byBucket.values()].sort((left, right) => left.bucket - right.bucket);
}

function cutoffSeries(series: RadarSymbolSeries, asOf: number): RadarSymbolSeries {
  if (!series.symbol.trim() || !series.source.trim()) {
    throw new RangeError("Radar symbol and market-data source are required");
  }
  const candlesByTimeframe = Object.fromEntries(
    Object.entries(series.candlesByTimeframe).map(([timeframe, candles]) => {
      strictTimeframeSeconds(timeframe);
      return [timeframe, cutoffCandleRevisions(candles, timeframe, asOf)];
    }),
  );
  return {
    symbol: series.symbol,
    source: series.source,
    dataOrigin: series.dataOrigin ?? null,
    candlesByTimeframe,
  };
}

function structureAt(
  history: readonly RadarStructureObservation[],
  series: RadarSymbolSeries,
  asOf: number,
) {
  const eligible = history.filter(
    (entry) =>
      entry.symbol.toUpperCase() === series.symbol.toUpperCase() &&
      entry.source === series.source &&
      entry.knownAt <= asOf,
  );
  for (const item of eligible) {
    if (radarStructureObservationId(item) !== item.observationId) {
      throw new Error("Radar structure observation failed deterministic verification");
    }
  }
  const latest = new Map<string, RadarStructureObservation>();
  for (const timeframe of new Set(eligible.map((item) => item.timeframe))) {
    const selected = latestUniqueObservation(
      eligible.filter((item) => item.timeframe === timeframe),
      (item) => [item.knownAt, item.eventTime],
      `market-structure ${timeframe}`,
    );
    if (selected) latest.set(timeframe, selected);
  }
  return Object.fromEntries(
    [...latest.entries()].sort(([left], [right]) => compareTimeframes(left, right)).map(
      ([timeframe, item]) => [
        timeframe,
        createDurableObjectReference({
          logicalObjectId: item.logicalObjectId,
          objectType: "MarketStructure",
          eventTime: item.eventTime,
          knownAt: item.knownAt,
          snapshot: { state: item.state, detail: item.snapshot },
        }),
      ],
    ),
  );
}

function canonicalCandle(candle: CandleRecord, timeframe: string) {
  return canonicalSerialize({
    bucket: candle.bucket,
    ts: candle.ts,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    vBase: finite(candle.v_base) ? candle.v_base : null,
    vQuote: finite(candle.v_quote) ? candle.v_quote : null,
    ver: finite(candle.ver) ? candle.ver : null,
    knownAt: candleRevisionKnownAt(candle, timeframe),
  });
}

function candleRevisionKnownAt(candle: CandleRecord, timeframe: string) {
  return candle.knownAt ?? candleCloseTime(candle, timeframe);
}

function latestAtOrBefore(candles: readonly CandleRecord[], target: number) {
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    if (candles[index].bucket <= target) return candles[index];
  }
  return null;
}

function historicalElapsedReturns(
  candles: readonly CandleRecord[],
  current: CandleRecord | null,
  detector: ElapsedWindowReturnDetector,
) {
  if (!current) return [];
  const earliest = current.bucket - detector.historyLookbackSeconds;
  const values: number[] = [];
  for (const candidate of candles) {
    if (candidate.bucket < earliest || candidate.bucket >= current.bucket) continue;
    const reference = latestAtOrBefore(candles, candidate.bucket - detector.windowSeconds);
    if (!reference || !validPositive(reference.c)) continue;
    const staleness = candidate.bucket - detector.windowSeconds - reference.bucket;
    if (
      detector.maximumReferenceStalenessSeconds != null &&
      staleness > detector.maximumReferenceStalenessSeconds
    ) {
      continue;
    }
    values.push((candidate.c / reference.c - 1) * 100);
  }
  return values;
}

function historicalRunups(
  candles: readonly CandleRecord[],
  current: CandleRecord | null,
  detector: RollingTroughRunupDetector,
) {
  if (!current) return [];
  const earliest = current.bucket - detector.historyLookbackSeconds;
  const values: number[] = [];
  for (const candidate of candles) {
    if (candidate.bucket < earliest || candidate.bucket >= current.bucket) continue;
    const trough = candles
      .filter(
        (item) =>
          item.bucket <= candidate.bucket &&
          item.bucket >= candidate.bucket - detector.lookbackSeconds &&
          candidate.bucket - item.bucket <= detector.maximumTroughAgeSeconds &&
          validPositive(item.c),
      )
      .sort((left, right) => left.c - right.c || left.bucket - right.bucket)[0];
    if (trough) values.push((candidate.c / trough.c - 1) * 100);
  }
  return values;
}

function distributionStatistics(
  values: readonly number[],
  currentValue: number | null,
  minimumSampleCount: number,
) {
  const notes: RadarDataQualityNote[] = [];
  if (values.length < minimumSampleCount) {
    notes.push(
      note(
        "INSUFFICIENT_METRIC_HISTORY",
        "error",
        `Metric requires ${minimumSampleCount} historical samples but has ${values.length}`,
      ),
    );
  }
  if (currentValue == null || values.length === 0 || values.length < minimumSampleCount) {
    return { percentile: null, zScore: null, notes };
  }
  const percentile =
    (values.filter((value) => value <= currentValue).length / values.length) * 100;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const zScore = standardDeviation > 0 ? (currentValue - mean) / standardDeviation : null;
  return { percentile, zScore, notes };
}

function relevantHistoryCandles(
  candles: readonly CandleRecord[],
  current: CandleRecord | null,
  durationSeconds: number,
) {
  if (!current) return [];
  return candles.filter((item) => item.bucket >= current.bucket - durationSeconds);
}

function returnThresholdsPass(
  observation: RadarMetricObservation,
  detector: RadarDetectorThresholds,
) {
  return (
    observation.value != null &&
    optionalMinimum(observation.value, detector.minimumReturnPct) &&
    optionalMinimum(observation.percentile, detector.minimumPercentile) &&
    optionalMinimum(observation.zScore, detector.minimumZScore) &&
    observation.sampleCount >= detector.minimumSampleCount
  );
}

function emaValues(candles: readonly CandleRecord[], period: number) {
  const values: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period) return values;
  let ema = candles.slice(0, period).reduce((sum, item) => sum + item.c, 0) / period;
  values[period - 1] = ema;
  const alpha = 2 / (period + 1);
  for (let index = period; index < candles.length; index += 1) {
    ema = candles[index].c * alpha + ema * (1 - alpha);
    values[index] = ema;
  }
  return values;
}

function atrValues(candles: readonly CandleRecord[], period: number) {
  const values: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period) return values;
  const ranges = candles.map((item, index) => {
    const previousClose = candles[index - 1]?.c ?? item.c;
    return Math.max(item.h - item.l, Math.abs(item.h - previousClose), Math.abs(item.l - previousClose));
  });
  let atr = ranges.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  values[period - 1] = atr;
  for (let index = period; index < ranges.length; index += 1) {
    atr = (atr * (period - 1) + ranges[index]) / period;
    values[index] = atr;
  }
  return values;
}

function latestLifecycleAt(
  history: readonly SetupStateSnapshot[],
  series: RadarSymbolSeries,
  asOf: number,
  strategyProfile: StrategyProfile,
) {
  const eligible = history.filter(
    (item) => item.candidate != null && item.asOf != null && item.asOf <= asOf,
  );
  for (const item of eligible) {
    validateLifecycleSnapshotAt(item, series, asOf, strategyProfile);
  }
  const maximumAsOf = Math.max(...eligible.map((item) => item.asOf ?? -Infinity));
  const latest = eligible.filter((item) => item.asOf === maximumAsOf);
  if (new Set(latest.map((item) => canonicalSerialize(item))).size > 1) {
    throw new Error(`Conflicting lifecycle snapshots at ${maximumAsOf}`);
  }
  return latest[0] ?? null;
}

function validateLifecycleSnapshotAt(
  snapshot: SetupStateSnapshot,
  series: RadarSymbolSeries,
  cutoff: number,
  strategyProfile: StrategyProfile,
) {
  if (
    snapshot.setupFamily !== "impulse_fade_v1" ||
    snapshot.lifecycleVersion !== IMPULSE_FADE_LIFECYCLE_VERSION ||
    snapshot.lifecycleVersion !== strategyProfile.lifecycleVersion ||
    snapshot.lifecycleConfigHash !== strategyProfile.lifecycleConfigHash ||
    snapshot.executionTimeframe !== strategyProfile.timeframeRoles.executionTimeframe
  ) {
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  }
  assertCausalTime(snapshot.asOf, cutoff, "lifecycle asOf");
  assertCausalTime(snapshot.updatedTs, cutoff, "lifecycle updatedTs");
  assertCausalTime(snapshot.stateSince, cutoff, "lifecycle stateSince");
  const candidate = snapshot.candidate;
  if (candidate) {
    const sourceMatches = [series.source, series.dataOrigin]
      .filter((item): item is string => item != null)
      .some((item) => item.toLowerCase() === candidate.source.toLowerCase());
    const venueMatches =
      !candidate.venue.trim() || candidate.venue.toLowerCase() === series.source.toLowerCase();
    if (
      candidate.symbol.toUpperCase() !== series.symbol.toUpperCase() ||
      !sourceMatches ||
      !venueMatches ||
      candidate.setupFamily !== snapshot.setupFamily ||
      candidate.lifecycleVersion !== snapshot.lifecycleVersion ||
      candidate.lifecycleConfigHash !== snapshot.lifecycleConfigHash ||
      candidate.executionTimeframe !== strategyProfile.timeframeRoles.executionTimeframe
    ) {
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    }
    for (const [label, value] of [
      ["candidate detectedAt", candidate.detectedAt],
      ["candidate detectionEventTime", candidate.detectionEventTime],
      ["candidate episodeHighTime", candidate.episodeHighTime],
      ["candidate stateSince", candidate.stateSince],
      ["candidate terminalAt", candidate.terminalAt],
    ] as const) {
      assertCausalTime(value, cutoff, label);
    }
    for (const item of candidate.initialMtfContext) {
      assertCausalTime(item.updatedTs, cutoff, "candidate MTF context updatedTs");
    }
  }
  for (const item of snapshot.evidence) {
    assertCausalTime(item.eventTime, cutoff, "lifecycle evidence eventTime");
    assertCausalTime(item.knownAt, cutoff, "lifecycle evidence knownAt");
    if (item.knownAt < item.eventTime) {
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
    }
  }
  for (const item of snapshot.transitions) {
    assertCausalTime(item.knownAt, cutoff, "lifecycle transition knownAt");
  }
  for (const [label, item] of [
    ["active break", snapshot.activeBreakLevel],
    ["retest", snapshot.retestLevel],
  ] as const) {
    if (!item) continue;
    assertCausalTime(item.eventTime, cutoff, `${label} eventTime`);
    assertCausalTime(item.knownAt, cutoff, `${label} knownAt`);
    if (item.knownAt < item.eventTime) {
      throw new Error(`${label} knownAt precedes eventTime`);
    }
  }
  for (const item of snapshot.confluence) {
    assertCausalTime(item.eventTime, cutoff, "lifecycle confluence eventTime");
    assertCausalTime(item.knownAt, cutoff, "lifecycle confluence knownAt");
    if (item.eventTime != null && item.knownAt != null && item.knownAt < item.eventTime) {
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
    }
  }
}

function assertCausalTime(value: number | null | undefined, cutoff: number, label: string) {
  if (value != null && (!Number.isFinite(value) || value > cutoff)) {
    throw new Error(`${label} exceeds the radar cutoff`);
  }
}

function latestUniverseAt(
  history: readonly UniverseMembershipObservation[],
  series: RadarSymbolSeries,
  asOf: number,
) {
  const candidates = [...history]
    .filter(
      (item) =>
        item.symbol.toUpperCase() === series.symbol.toUpperCase() &&
        item.source === series.source &&
        item.knownAt <= asOf &&
        item.effectiveFrom <= asOf &&
        (item.effectiveTo == null || item.effectiveTo >= asOf),
    );
  for (const item of candidates) {
    if (universeMembershipObservationId(item) !== item.observationId) {
      throw new Error("Universe membership observation failed deterministic verification");
    }
  }
  return latestUniqueObservation(
    candidates,
    (item) => [item.effectiveFrom, item.knownAt],
    "universe membership",
  );
}

function preRollRequirements(profile: RadarSelectionProfile) {
  const byTimeframe = new Map<string, { duration: number; bars: number; purposes: Set<string> }>();
  function include(timeframe: string, duration: number, bars: number, purpose: string) {
    const current = byTimeframe.get(timeframe) ?? { duration: 0, bars: 0, purposes: new Set<string>() };
    current.duration = Math.max(current.duration, duration);
    current.bars = Math.max(current.bars, bars);
    current.purposes.add(purpose);
    byTimeframe.set(timeframe, current);
  }
  include(profile.scanTimeframe, 172_800, 0, "24h/48h path context");
  include(profile.scanTimeframe, profile.liquidityPolicy.windowSeconds, 0, "liquidity context");
  for (const detector of profile.moveDetectors) {
    if (detector.type === "rollingTroughRunup") {
      include(profile.scanTimeframe, detector.lookbackSeconds, 0, detector.id);
    } else if (detector.type === "elapsedWindowReturn") {
      include(profile.scanTimeframe, detector.windowSeconds + detector.historyLookbackSeconds, 0, detector.id);
    } else if (detector.type === "maximumWindowReturn") {
      include(
        profile.scanTimeframe,
        Math.max(...detector.windowsSeconds) + detector.historyLookbackSeconds,
        0,
        detector.id,
      );
    } else {
      include(
        detector.analysisTimeframe,
        0,
        Math.max(detector.emaPeriod, detector.atrPeriod) + 1,
        detector.id,
      );
    }
  }
  return [...byTimeframe.entries()]
    .sort(([left], [right]) => compareTimeframes(left, right))
    .map(([timeframe, value]) => ({
      timeframe,
      minimumDurationSeconds: value.duration,
      minimumBars: value.bars,
      purposes: [...value.purposes].sort(),
    }));
}

function combineDetectorResults(
  results: readonly RadarDetectorResult[],
  combination: RadarDetectorCombination,
) {
  const passing = results.filter((item) => item.passed).length;
  const unavailable = results.filter((item) => !item.evaluable).length;
  if (combination.mode === "all") {
    return {
      passed: passing === results.length,
      evaluable: results.some((item) => item.evaluable && !item.passed) || unavailable === 0,
    };
  }
  if (combination.mode === "atLeast") {
    return {
      passed: passing >= combination.count,
      evaluable: passing >= combination.count || passing + unavailable < combination.count,
    };
  }
  return {
    passed: passing > 0,
    evaluable: passing > 0 || unavailable === 0,
  };
}

function venuePolicyPasses(status: ExecutionVenueEligibilityStatus, mode: ExecutionVenuePolicyMode) {
  if (mode === "ignore") return true;
  if (mode === "requireKnownAvailable") return status === "Available";
  return status !== "Unavailable";
}

function cadenceIncludes(asOf: number, profile: RadarSelectionProfile) {
  const timeframe = strictTimeframeSeconds(profile.scanTimeframe);
  const closeIndex = Math.floor(asOf / timeframe);
  return closeIndex % profile.evaluationCadence.everyBars === 0;
}

function createProfileError(message: string): never {
  throw new RangeError(message);
}

function validateProfile(definition: RadarSelectionProfileDefinition) {
  if (definition.schemaVersion !== RADAR_SELECTION_PROFILE_SCHEMA_VERSION) {
    createProfileError("Unsupported radar selection profile schema");
  }
  if (!definition.id.trim() || !definition.version.trim() || !definition.name.trim()) {
    createProfileError("Radar profile identity fields are required");
  }
  if (definition.setupFamily !== "impulse_fade_v1") {
    createProfileError("Only impulse_fade_v1 radar profiles are supported");
  }
  try {
    strictTimeframeSeconds(definition.scanTimeframe);
  } catch {
    createProfileError("scanTimeframe must be valid");
  }
  if (definition.evaluationCadence.mode !== "completedScanCandle") {
    createProfileError("Only completed-scan-candle evaluation is supported");
  }
  if (!Number.isInteger(definition.evaluationCadence.everyBars) || definition.evaluationCadence.everyBars < 1) {
    createProfileError("evaluation cadence must contain a positive integer bar count");
  }
  if (!definition.moveDetectors.length) createProfileError("At least one move detector is required");
  if (new Set(definition.moveDetectors.map((item) => item.id)).size !== definition.moveDetectors.length) {
    createProfileError("Move detector IDs must be unique");
  }
  if (new Set(definition.hardGates).size !== definition.hardGates.length) {
    createProfileError("Hard gates must be unique");
  }
  const supportedHardGates = new Set<RadarHardGateCode>([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility",
  ]);
  if (definition.hardGates.some((item) => !supportedHardGates.has(item))) {
    createProfileError("Radar profile contains an unsupported hard gate");
  }
  if (!["any", "all", "atLeast"].includes(definition.detectorCombination.mode)) {
    createProfileError("Radar profile contains an unsupported detector combination");
  }
  if (
    definition.detectorCombination.mode === "atLeast" &&
    (!Number.isInteger(definition.detectorCombination.count) ||
      definition.detectorCombination.count < 1 ||
      definition.detectorCombination.count > definition.moveDetectors.length)
  ) {
    createProfileError("atLeast detector count must be between one and the detector count");
  }
  if (
    !validPositive(definition.episodeExpiry.maximumAgeSeconds) ||
    !validPositive(definition.resetPolicy.minimumFalseDurationSeconds) ||
    !Number.isFinite(definition.createdAt)
  ) {
    createProfileError("Episode expiry, reset duration, and createdAt must be valid");
  }
  if (
    (definition.sourcePolicy.allowedSources != null &&
      (definition.sourcePolicy.allowedSources.some((item) => !item.trim()) ||
        new Set(definition.sourcePolicy.allowedSources).size !==
          definition.sourcePolicy.allowedSources.length)) ||
    !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
      definition.executionVenuePolicy.mode,
    ) ||
    (definition.executionVenuePolicy.mode !== "ignore" &&
      !definition.executionVenuePolicy.intendedVenue?.trim()) ||
    (definition.liquidityPolicy.minimumQuoteNotional != null &&
      (!Number.isFinite(definition.liquidityPolicy.minimumQuoteNotional) ||
        definition.liquidityPolicy.minimumQuoteNotional < 0)) ||
    !validPositive(definition.liquidityPolicy.windowSeconds) ||
    !["fail", "warn"].includes(definition.liquidityPolicy.missingData)
  ) {
    createProfileError("Radar profile policies are invalid");
  }
  for (const detector of definition.moveDetectors) validateDetector(detector);
}

function validateDetector(detector: RadarMoveDetector) {
  if (!detector.id.trim()) createProfileError("Detector ID is required");
  if (!["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(detector.type)) {
    createProfileError(`Detector ${detector.id} has an unsupported type`);
  }
  if (!Number.isInteger(detector.minimumSampleCount) || detector.minimumSampleCount < 0) {
    createProfileError(`Detector ${detector.id} has an invalid sample count`);
  }
  if (detector.type === "emaAtrDisplacement") {
    if (
      !isStrictTimeframe(detector.analysisTimeframe) ||
      !Number.isInteger(detector.emaPeriod) ||
      detector.emaPeriod < 1 ||
      !Number.isInteger(detector.atrPeriod) ||
      detector.atrPeriod < 1 ||
      !Number.isFinite(detector.minimumAtrDisplacement)
    ) {
      createProfileError(`Detector ${detector.id} has invalid EMA/ATR settings`);
    }
    return;
  }
  if (
    !validPositive(detector.historyLookbackSeconds) ||
    !validNullableNumber(detector.minimumPercentile, 0, 100) ||
    !validNullableNumber(detector.minimumZScore)
  ) {
    createProfileError(`Detector ${detector.id} contains invalid statistical settings`);
  }
  if (detector.type === "rollingTroughRunup") {
    if (
      !validPositive(detector.lookbackSeconds) ||
      !Number.isFinite(detector.minimumRunupPct) ||
      detector.minimumRunupPct < 0 ||
      !validPositive(detector.maximumTroughAgeSeconds) ||
      detector.referenceField !== "close"
    ) {
      createProfileError(`Detector ${detector.id} has invalid rolling-trough settings`);
    }
    return;
  }
  if (
    !validNullableNumber(detector.minimumReturnPct) ||
    (detector.maximumReferenceStalenessSeconds != null &&
      (!Number.isFinite(detector.maximumReferenceStalenessSeconds) ||
        detector.maximumReferenceStalenessSeconds < 0))
  ) {
    createProfileError(`Detector ${detector.id} has invalid return settings`);
  }
  if (detector.type === "elapsedWindowReturn" && !validPositive(detector.windowSeconds)) {
    createProfileError(`Detector ${detector.id} requires a positive window`);
  }
  if (
    detector.type === "maximumWindowReturn" &&
    (!detector.windowsSeconds.length ||
      detector.windowsSeconds.some((item) => !validPositive(item)) ||
      new Set(detector.windowsSeconds).size !== detector.windowsSeconds.length)
  ) {
    createProfileError(`Detector ${detector.id} requires unique positive windows`);
  }
}

function validateScanInput(input: RadarScanInput) {
  if (!Number.isFinite(input.from) || !Number.isFinite(input.to) || input.to < input.from) {
    throw new RangeError("Radar scan range must be finite and ordered");
  }
  if (radarSelectionProfileHash(input.selectionProfile) !== input.selectionProfile.canonicalConfigHash) {
    throw new Error("Radar selection profile failed deterministic hash verification");
  }
  const { canonicalConfigHash: _profileHash, ...profileDefinition } = input.selectionProfile;
  validateProfile(profileDefinition);
  if (input.strategyProfile) {
    if (strategyProfileHash(input.strategyProfile) !== input.strategyProfile.profileHash) {
      throw new Error("Strategy profile failed deterministic hash verification");
    }
    const { profileHash: _strategyHash, ...strategyDefinition } = input.strategyProfile;
    createStrategyProfile(strategyDefinition);
  }
}

function validNullableNumber(value: number | null, minimum = -Infinity, maximum = Infinity) {
  return value == null || (Number.isFinite(value) && value >= minimum && value <= maximum);
}

function optionalMinimum(value: number | null, required: number | null) {
  return required == null || (value != null && value + 1e-12 >= required);
}

function validCandle(candle: CandleRecord) {
  return (
    Number.isFinite(candle.bucket) &&
    Number.isFinite(candle.ts) &&
    validPositive(candle.o) &&
    validPositive(candle.h) &&
    validPositive(candle.l) &&
    validPositive(candle.c) &&
    candle.h >= Math.max(candle.o, candle.c, candle.l) &&
    candle.l <= Math.min(candle.o, candle.c, candle.h) &&
    optionalNonnegative(candle.v_base) &&
    optionalNonnegative(candle.v_quote) &&
    optionalNonnegative(candle.ver) &&
    optionalNonnegative(candle.knownAt)
  );
}

function optionalNonnegative(value: number | undefined) {
  return value == null || (Number.isFinite(value) && value >= 0);
}

function validPositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function finite(value: number | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function note(code: string, severity: DataQualitySeverity, message: string): RadarDataQualityNote {
  return { code, severity, message };
}

function dedupeNotes(notes: readonly RadarDataQualityNote[]) {
  return [...new Map(notes.map((item) => [`${item.code}:${item.severity}:${item.message}`, item])).values()]
    .sort((left, right) => left.code.localeCompare(right.code));
}

function dedupeObservations(observations: readonly RadarMetricObservation[]) {
  return [...new Map(observations.map((item) => [item.requestId, item])).values()]
    .sort(compareObservations);
}

function dedupeHardGateEvidence(evidence: readonly RadarHardGateEvidence[]) {
  return [...new Map(evidence.map((item) => [item.observationId, item])).values()].sort(
    (left, right) => left.observationId.localeCompare(right.observationId),
  );
}

function latestUniqueObservation<T extends { observationId: string }>(
  observations: readonly T[],
  precedence: (item: T) => readonly number[],
  label: string,
): T | null {
  if (!observations.length) return null;
  const ordered = [...observations].sort((left, right) => {
    const leftKey = precedence(left);
    const rightKey = precedence(right);
    for (let index = 0; index < Math.max(leftKey.length, rightKey.length); index += 1) {
      const difference = (leftKey[index] ?? -Infinity) - (rightKey[index] ?? -Infinity);
      if (difference !== 0) return difference;
    }
    return left.observationId.localeCompare(right.observationId);
  });
  const selected = ordered.at(-1)!;
  const selectedKey = precedence(selected);
  const competing = ordered.filter((item) => {
    const key = precedence(item);
    return key.length === selectedKey.length && key.every((value, index) => value === selectedKey[index]);
  });
  if (new Set(competing.map((item) => item.observationId)).size > 1) {
    throw new Error(`Conflicting ${label} observations at the same precedence`);
  }
  return selected;
}

function compareObservations(left: RadarMetricObservation, right: RadarMetricObservation) {
  return (
    left.requestedAsOf - right.requestedAsOf ||
    left.observationId.localeCompare(right.observationId) ||
    left.requestId.localeCompare(right.requestId)
  );
}

function compareEvaluations(left: RadarGateEvaluation, right: RadarGateEvaluation) {
  return left.asOf - right.asOf || left.symbol.localeCompare(right.symbol) || left.source.localeCompare(right.source);
}

function compareEpisodes(left: RadarEpisode, right: RadarEpisode) {
  return left.detectedAt - right.detectedAt || left.id.localeCompare(right.id);
}

function compareStatusObservations(
  left: RadarEpisodeStatusObservation,
  right: RadarEpisodeStatusObservation,
) {
  return left.asOf - right.asOf || left.observationId.localeCompare(right.observationId);
}

function compareTimeframes(left: string, right: string) {
  return strictTimeframeSeconds(left) - strictTimeframeSeconds(right) || left.localeCompare(right);
}

function isStrictTimeframe(timeframe: string) {
  return /^[1-9]\d*[mhd]$/.test(timeframe) && validPositive(timeframeToSeconds(timeframe));
}

function strictTimeframeSeconds(timeframe: string) {
  if (!isStrictTimeframe(timeframe)) {
    throw new RangeError(`Invalid radar timeframe ${timeframe}`);
  }
  return timeframeToSeconds(timeframe);
}

function profileRef(profile: RadarSelectionProfile) {
  return {
    id: profile.id,
    version: profile.version,
    canonicalConfigHash: profile.canonicalConfigHash,
  };
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDuration(seconds: number) {
  if (seconds % 86_400 === 0) return `${seconds / 86_400}d`;
  if (seconds % 3_600 === 0) return `${seconds / 3_600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

function hashSuffix(value: unknown) {
  return canonicalHash(value).slice("fnv1a64:".length);
}

export function canonicalRadarJson(value: unknown) {
  return canonicalSerialize(value);
}
