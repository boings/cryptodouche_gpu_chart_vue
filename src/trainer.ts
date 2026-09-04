import type { ExecutionProfile, FundingObservation, VenueExecutionRules } from "./execution";
import type { RadarSelectionProfile, ReplayCaseManifest } from "./radar";
import type { ReplayAnalysisProfile } from "./replayAnalysis";
import type { ReplaySessionConfig } from "./replay";
import type { ReplaySession } from "./replaySession";
import { canonicalHash, immutableJsonClone, type JsonValue } from "./serialization";
import type { StrategyProfile } from "./strategy";
import type { AccountState, LeveragePolicy, RiskRequest, TradePlan } from "./tradePlanning";

export const TRAINER_UI_VERSION = "trainer-ui.1" as const;
export const TRAINER_WORKER_PROTOCOL_VERSION = "trainer-worker-protocol.1" as const;
export const TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION =
  "trainer-presentation-profile.1" as const;
export const TRAINER_STUDY_RUN_SCHEMA_VERSION = "trainer-study-run.1" as const;
export const TRAINER_STUDY_CASE_SCHEMA_VERSION = "trainer-study-case.1" as const;
export const TRAINER_CASE_BUNDLE_SCHEMA_VERSION = "trainer-case-bundle.1" as const;
export const TRAINER_PUBLIC_FRAME_SCHEMA_VERSION = "trainer-public-frame.1" as const;
export const TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION = "trainer-analysis-action.1" as const;
export const TRAINER_REVIEW_RECORD_SCHEMA_VERSION = "trainer-review-record.1" as const;
export const TRAINER_LOCAL_STORE_SCHEMA_VERSION = "trainer-local-store.1" as const;
export const TRAINER_CORPUS_INDEX_SCHEMA_VERSION = "trainer-corpus-index.1" as const;

export interface TrainerVersionedRef {
  id: string;
  version: string;
  hash: string;
}

export interface TrainerSafeCaseDescriptor {
  id: string;
  alias: string;
  episodeAlias: string;
  replayCaseManifestId: string;
  radarEpisodeId: string;
  radarSelectionProfileRef: TrainerVersionedRef;
  detectedAt: number;
  symbol: string;
  source: string;
  scanTimeframe: string;
  triggerDetectorIds: string[];
  dataQualityStatus: "complete" | "warning" | "error";
  venueEligibility: "eligible" | "ineligible" | "unknown";
  selectionMetrics: Record<string, number | string | boolean | null>;
  pathContextTags: string[];
}

export type TrainerSafeCaseDescriptorPublic = Omit<
  TrainerSafeCaseDescriptor,
  "detectedAt" | "symbol" | "source"
> & {
  detectedAt: number | null;
  symbol: string | null;
  source: string | null;
};

export interface TrainerCorpusIndex {
  schemaVersion: typeof TRAINER_CORPUS_INDEX_SCHEMA_VERSION;
  id: string;
  fingerprint: string;
  cases: TrainerSafeCaseDescriptor[];
}

export interface TrainerBundleProvenance {
  producer: string;
  createdAt: number;
  sourceDescription: string;
  license?: string | null;
}

export interface TrainerCaseBundle {
  schemaVersion: typeof TRAINER_CASE_BUNDLE_SCHEMA_VERSION;
  bundleId: string;
  bundleFingerprint: string;
  safeDescriptor: TrainerSafeCaseDescriptor;
  replayCaseManifest: ReplayCaseManifest;
  replayAnalysisData: JsonValue;
  replayFutureData: JsonValue;
  executionData?: JsonValue;
  radarSelectionProfile: RadarSelectionProfile;
  strategyProfile: StrategyProfile;
  replayAnalysisProfile: ReplayAnalysisProfile;
  replaySessionConfig: ReplaySessionConfig;
  executionProfile?: ExecutionProfile;
  venueExecutionRules?: VenueExecutionRules;
  feeSchedule?: JsonValue;
  fundingObservations?: FundingObservation[];
  provenance: TrainerBundleProvenance;
  dataQualityNotes: string[];
}

export type CreateTrainerCaseBundleInput = Omit<TrainerCaseBundle, "bundleFingerprint">;

export interface TrainerPresentationProfileDefinition {
  id: string;
  version: string;
  schemaVersion: typeof TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION;
  layout: "one" | "four";
  paneTimeframes: string[];
  blindModeDefaults: boolean;
  overlayPreset: string;
  showSymbol: boolean;
  showDate: boolean;
  showSource: boolean;
  showVenue: boolean;
  showAbsoluteClock: boolean;
  showRelativeClock: boolean;
  chartControlDefaults: Record<string, JsonValue>;
}

export interface TrainerPresentationProfile extends TrainerPresentationProfileDefinition {
  canonicalConfigHash: string;
}

export interface TrainerStudyCase {
  schemaVersion: typeof TRAINER_STUDY_CASE_SCHEMA_VERSION;
  id: string;
  studyRunId: string;
  caseId: string;
  replayCaseManifestId: string;
  radarEpisodeId: string;
  bundleFingerprint: string;
  state: "pending" | "active" | "completed" | "skipped" | "abandoned" | "revealed";
  replaySessionId: string | null;
  decisionRecordIds: string[];
  analysisActionIds: string[];
  tradePlanId: string | null;
  reviewRecordId: string | null;
}

export interface TrainerStudyRunDefinition {
  id: string;
  name?: string | null;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  radarSelectionProfileRef: TrainerVersionedRef;
  strategyProfileRef: TrainerVersionedRef;
  replayAnalysisProfileRef: TrainerVersionedRef;
  replaySessionConfigRef: TrainerVersionedRef;
  executionProfileRef?: TrainerVersionedRef | null;
  selectionSeed: string;
  requestedCaseCount: number;
  selectedCaseIds: string[];
  currentCaseIndex: number;
  blindMode: boolean;
  presentationProfileRef: TrainerVersionedRef;
  accountPreset: AccountState;
  defaultRiskRequest: RiskRequest;
  defaultLeveragePolicy: LeveragePolicy;
  completedCases: string[];
  skippedCases: string[];
  abandonedCases: string[];
  state: "created" | "active" | "paused" | "completed" | "closed";
}

export interface TrainerStudyRun extends TrainerStudyRunDefinition {
  schemaVersion: typeof TRAINER_STUDY_RUN_SCHEMA_VERSION;
  trainerVersion: typeof TRAINER_UI_VERSION;
  canonicalConfigHash: string;
}

export interface TrainerCaseSelectionFilters {
  radarSelectionProfileId?: string;
  triggerDetectorId?: string;
  scanTimeframe?: string;
  source?: string;
  dataQualityStatus?: TrainerSafeCaseDescriptor["dataQualityStatus"];
  venueEligibility?: TrainerSafeCaseDescriptor["venueEligibility"];
  pathContextTag?: string;
  minimumSelectionMetric?: { key: string; value: number };
  maximumSelectionMetric?: { key: string; value: number };
}

export type TrainerAnalysisAction =
  | {
      schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
      id: string;
      type: "SetManualAvwapAnchor";
      sessionId: string;
      frameId: string;
      selectedAt: number;
      anchor: {
        id: string;
        label: string;
        kind: "manualPumpOrigin" | "manualBreakout" | "manualStructural";
        timeframe: string;
        candleObservationId: string;
        candleRevision: number | null;
        anchorTime: number;
        anchorPrice: number;
        knownAt: number;
      };
    }
  | {
      schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
      id: string;
      type: "RemoveManualAvwapAnchor";
      sessionId: string;
      frameId: string;
      selectedAt: number;
      anchorId: string;
    }
  | {
      schemaVersion: typeof TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION;
      id: string;
      type: "UpdateManualAvwapAnchorLabel";
      sessionId: string;
      frameId: string;
      selectedAt: number;
      anchorId: string;
      label: string;
    };

export interface TrainerReviewRecordDefinition {
  id: string;
  studyRunId: string;
  trainerSessionId: string;
  replayFrameId: string;
  decisionRecordId?: string | null;
  tradePlanId?: string | null;
  executionResultId?: string | null;
  reviewedAt: number;
  decisionQualityRating?: number | null;
  processFollowed?: boolean | null;
  confidenceAfterReview?: number | null;
  thesisReview?: string | null;
  whatWasObserved?: string | null;
  whatWasMissed?: string | null;
  whatWouldBeRepeated?: string | null;
  whatWouldBeChanged?: string | null;
  tags: string[];
  notes?: string | null;
}

export interface TrainerReviewRecord extends TrainerReviewRecordDefinition {
  schemaVersion: typeof TRAINER_REVIEW_RECORD_SCHEMA_VERSION;
}

export interface TrainerPublicFrame {
  schemaVersion: typeof TRAINER_PUBLIC_FRAME_SCHEMA_VERSION;
  revision: number;
  studyRunId: string;
  studyCaseId: string;
  caseAlias: string;
  effectiveAsOf: number;
  identity: { symbol: string; source: string; detectedAt: number } | null;
  replaySession: ReplaySession;
  visibleCandlesByTimeframe: ReplaySession["frames"][number]["visibleCandlesByTimeframe"];
  currentFrame: ReplaySession["frames"][number];
  analysisActions: TrainerAnalysisAction[];
  tradePlan: TradePlan | null;
  revealedOutcome: JsonValue | null;
}

export function createTrainerCaseBundle(input: CreateTrainerCaseBundleInput): TrainerCaseBundle {
  const definition = immutableJsonClone(input) as CreateTrainerCaseBundleInput;
  const bundle = {
    ...definition,
    bundleFingerprint: trainerCaseBundleFingerprint(definition),
  } as TrainerCaseBundle;
  validateTrainerCaseBundle(bundle);
  return immutableJsonClone(bundle);
}

export function trainerCaseBundleFingerprint(
  bundle: Omit<TrainerCaseBundle, "bundleFingerprint"> | TrainerCaseBundle,
) {
  const { bundleFingerprint: _ignored, ...definition } = bundle as TrainerCaseBundle;
  return canonicalHash(definition);
}

export function validateTrainerCaseBundle(input: unknown): asserts input is TrainerCaseBundle {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("TrainerCaseBundle must be an object");
  }
  const bundle = input as TrainerCaseBundle;
  if (bundle.schemaVersion !== TRAINER_CASE_BUNDLE_SCHEMA_VERSION) {
    throw new Error(`Unsupported trainer case bundle schema: ${String(bundle.schemaVersion)}`);
  }
  assertText(bundle.bundleId, "bundleId");
  assertText(bundle.bundleFingerprint, "bundleFingerprint");
  if (bundle.bundleFingerprint !== trainerCaseBundleFingerprint(bundle)) {
    throw new Error("TrainerCaseBundle fingerprint mismatch");
  }
  if (bundle.safeDescriptor.replayCaseManifestId !== bundle.replayCaseManifest.id) {
    throw new Error("Safe descriptor ReplayCaseManifest reference mismatch");
  }
  if (bundle.safeDescriptor.radarEpisodeId !== bundle.replayCaseManifest.radarEpisodeId) {
    throw new Error("Safe descriptor RadarEpisode reference mismatch");
  }
  const selectionRef = bundle.replayCaseManifest.selectionProfileRef;
  if (
    selectionRef.id !== bundle.radarSelectionProfile.id ||
    selectionRef.version !== bundle.radarSelectionProfile.version ||
    selectionRef.canonicalConfigHash !== bundle.radarSelectionProfile.canonicalConfigHash
  ) throw new Error("RadarSelectionProfile reference mismatch");
  const strategyRef = bundle.replayCaseManifest.strategyProfileRef;
  if (
    strategyRef.id !== bundle.strategyProfile.id ||
    strategyRef.version !== bundle.strategyProfile.version ||
    strategyRef.profileHash !== bundle.strategyProfile.profileHash
  ) throw new Error("StrategyProfile reference mismatch");
  if (
    bundle.replaySessionConfig.strategyProfileRef.id !== bundle.strategyProfile.id ||
    bundle.replaySessionConfig.strategyProfileRef.profileHash !== bundle.strategyProfile.profileHash
  ) throw new Error("ReplaySessionConfig strategy reference mismatch");
  if (
    bundle.replayAnalysisProfile.lifecycleConfigRef.version !==
      bundle.strategyProfile.lifecycleVersion ||
    bundle.replayAnalysisProfile.lifecycleConfigRef.configHash !==
      bundle.strategyProfile.lifecycleConfigHash
  ) throw new Error("ReplayAnalysisProfile lifecycle reference mismatch");
  if (bundle.safeDescriptor.symbol !== bundle.replayCaseManifest.symbol) {
    throw new Error("Safe descriptor symbol mismatch");
  }
  if (bundle.safeDescriptor.source !== bundle.replayCaseManifest.source) {
    throw new Error("Safe descriptor source mismatch");
  }
}

export function createTrainerCorpusIndex(id: string, cases: TrainerSafeCaseDescriptor[]) {
  assertText(id, "corpus id");
  assertUnique(cases.map((item) => item.id), "case id");
  const definition = {
    schemaVersion: TRAINER_CORPUS_INDEX_SCHEMA_VERSION,
    id,
    cases: immutableJsonClone(cases),
  };
  return immutableJsonClone({ ...definition, fingerprint: canonicalHash(definition) });
}

export function selectTrainerCases(
  corpus: TrainerCorpusIndex,
  seed: string,
  count: number,
  filters: TrainerCaseSelectionFilters = {},
) {
  assertText(seed, "selection seed");
  if (!Number.isInteger(count) || count < 1) throw new RangeError("Case count must be positive");
  const eligible = corpus.cases.filter((item) => matchesFilters(item, filters));
  const byEpisode = new Map<string, TrainerSafeCaseDescriptor>();
  for (const item of eligible) {
    if (!byEpisode.has(item.radarEpisodeId)) byEpisode.set(item.radarEpisodeId, item);
  }
  return immutableJsonClone([...byEpisode.values()]
    .sort((left, right) => {
      const a = canonicalHash({ seed, corpus: corpus.fingerprint, caseId: left.id });
      const b = canonicalHash({ seed, corpus: corpus.fingerprint, caseId: right.id });
      return a.localeCompare(b) || left.id.localeCompare(right.id);
    })
    .slice(0, count));
}

export function redactTrainerSafeDescriptor(
  descriptor: TrainerSafeCaseDescriptor,
  blindMode: boolean,
  revealed = false,
): TrainerSafeCaseDescriptorPublic {
  if (!blindMode || revealed) return immutableJsonClone(descriptor);
  return immutableJsonClone({
    ...descriptor,
    detectedAt: null,
    symbol: null,
    source: null,
  });
}

export function createTrainerPresentationProfile(
  definition: TrainerPresentationProfileDefinition,
): TrainerPresentationProfile {
  if (definition.schemaVersion !== TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION) {
    throw new Error("Unsupported trainer presentation profile schema");
  }
  assertText(definition.id, "presentation profile id");
  assertText(definition.version, "presentation profile version");
  if (!definition.paneTimeframes.length || definition.paneTimeframes.length > 4) {
    throw new RangeError("A presentation profile requires one to four panes");
  }
  return immutableJsonClone({ ...definition, canonicalConfigHash: canonicalHash(definition) });
}

export function createTrainerStudyRun(definition: TrainerStudyRunDefinition): TrainerStudyRun {
  assertText(definition.id, "study run id");
  assertText(definition.selectionSeed, "selection seed");
  if (definition.requestedCaseCount !== definition.selectedCaseIds.length) {
    throw new Error("Requested and selected case counts must match");
  }
  assertUnique(definition.selectedCaseIds, "selected case id");
  const base = {
    ...immutableJsonClone(definition),
    schemaVersion: TRAINER_STUDY_RUN_SCHEMA_VERSION,
    trainerVersion: TRAINER_UI_VERSION,
  };
  return immutableJsonClone({ ...base, canonicalConfigHash: canonicalHash(base) });
}

export function createTrainerReviewRecord(
  definition: TrainerReviewRecordDefinition,
): TrainerReviewRecord {
  assertText(definition.id, "review id");
  if (
    definition.decisionQualityRating != null &&
    (!Number.isInteger(definition.decisionQualityRating) ||
      definition.decisionQualityRating < 1 ||
      definition.decisionQualityRating > 5)
  ) throw new RangeError("Decision quality rating must be from 1 through 5");
  return immutableJsonClone({
    ...definition,
    schemaVersion: TRAINER_REVIEW_RECORD_SCHEMA_VERSION,
  });
}

function matchesFilters(item: TrainerSafeCaseDescriptor, filters: TrainerCaseSelectionFilters) {
  if (filters.radarSelectionProfileId && item.radarSelectionProfileRef.id !== filters.radarSelectionProfileId) return false;
  if (filters.triggerDetectorId && !item.triggerDetectorIds.includes(filters.triggerDetectorId)) return false;
  if (filters.scanTimeframe && item.scanTimeframe !== filters.scanTimeframe) return false;
  if (filters.source && item.source !== filters.source) return false;
  if (filters.dataQualityStatus && item.dataQualityStatus !== filters.dataQualityStatus) return false;
  if (filters.venueEligibility && item.venueEligibility !== filters.venueEligibility) return false;
  if (filters.pathContextTag && !item.pathContextTags.includes(filters.pathContextTag)) return false;
  if (filters.minimumSelectionMetric) {
    const value = item.selectionMetrics[filters.minimumSelectionMetric.key];
    if (typeof value !== "number" || value < filters.minimumSelectionMetric.value) return false;
  }
  if (filters.maximumSelectionMetric) {
    const value = item.selectionMetrics[filters.maximumSelectionMetric.key];
    if (typeof value !== "number" || value > filters.maximumSelectionMetric.value) return false;
  }
  return true;
}

function assertText(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required`);
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
