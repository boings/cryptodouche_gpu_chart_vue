import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  IMPULSE_FADE_SETUP_FAMILY,
  impulseFadeLifecycleConfigHash,
  type AnchoredVwapSignal,
  type MarketStructureSummary,
  type RelativeStrengthDivergence,
  type SetupCandidateEpisode,
  type SetupFamily,
  type SetupStateEvidence,
  type SetupStateName,
  type SetupStateSnapshot,
} from "./indicators";
import {
  canonicalHash,
  canonicalSerialize,
  immutableJsonClone,
  type JsonValue,
} from "./serialization";
import type { CandidateMetrics } from "./types";

export const STRATEGY_PROFILE_SCHEMA_VERSION = "strategy-profile.1" as const;
export const DECISION_SNAPSHOT_SCHEMA_VERSION = "decision-snapshot.1" as const;
export const IMPULSE_FADE_RESEARCH_PROFILE_ID =
  "impulse_fade_v1.research.default" as const;
export const IMPULSE_FADE_RESEARCH_PROFILE_VERSION = "1" as const;

export type StrategySide = "short";
export type EntryOrderPlanType =
  | "marketNextAvailable"
  | "limit"
  | "stopMarket"
  | "manualReference";
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

export type StopDerivationType =
  | "episodeHigh"
  | "structuralInvalidation"
  | "supportResistanceZoneBoundary"
  | "avwapReference"
  | "manual";

export type TargetDerivationType =
  | "supportZone"
  | "avwap"
  | "preImpulseBase"
  | "fixedRMultiple"
  | "manual";

export type DecisionReferenceKind =
  | "swing"
  | "structureLevel"
  | "supportZone"
  | "resistanceZone"
  | "avwap"
  | "candidateEpisodeHigh"
  | "preImpulseBase"
  | "manual";

export interface DecisionReferenceSource {
  objectType: string;
  objectId: string;
  observationId: string;
  snapshot: { [key: string]: JsonValue };
}

export interface DecisionReferenceSourceInput {
  objectType: string;
  objectId: string;
  observationId?: string;
  snapshot: { [key: string]: JsonValue };
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
  sourceObject: DecisionReferenceSourceInput;
}

export function decisionReferenceObservationId(
  source: Omit<DecisionReferenceSource, "observationId"> | DecisionReferenceSourceInput,
) {
  return `decision-reference-observation:${canonicalHash({
    objectType: source.objectType,
    objectId: source.objectId,
    snapshot: source.snapshot,
  }).slice("fnv1a64:".length)}`;
}

export function strategyProfileHash(
  profile: StrategyProfile | StrategyProfileDefinition,
): string {
  const { profileHash: _ignored, ...definition } = profile as StrategyProfile;
  return canonicalHash(definition);
}

export function createStrategyProfile(definition: StrategyProfileDefinition): StrategyProfile {
  validateFiniteTimestamp(definition.createdAt, "createdAt");
  if (
    definition.setupFamily !== IMPULSE_FADE_SETUP_FAMILY ||
    definition.lifecycleVersion !== IMPULSE_FADE_LIFECYCLE_VERSION ||
    definition.side !== "short"
  ) {
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  }
  if (!definition.id.trim() || !definition.version.trim() || !definition.lifecycleConfigHash.trim()) {
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  }
  for (const [role, timeframe] of Object.entries(definition.timeframeRoles)) {
    if (role === "contextTimeframes") {
      if (!(timeframe as string[]).every((item) => item.trim())) {
        throw new TypeError("Context timeframes cannot contain blank values");
      }
    } else if (timeframe != null && !(timeframe as string).trim()) {
      throw new TypeError(`${role} cannot be blank`);
    }
  }
  validateFraction(definition.riskPolicy.maximumAccountRiskFraction, "maximum account risk");
  validateFraction(
    definition.riskPolicy.maximumMarginAllocationFraction,
    "maximum margin allocation",
  );
  if (
    !Number.isInteger(definition.targetPolicy.maximumTargets) ||
    definition.targetPolicy.maximumTargets < 1 ||
    !Number.isFinite(definition.targetPolicy.fractionTolerance) ||
    definition.targetPolicy.fractionTolerance < 0
  ) {
    throw new RangeError("Target policy limits are invalid");
  }
  const requiredHardGates = [
    "activeCandidate",
    "entryCandidate",
    "confirmedRetest",
    "referenceIntegrity",
    "dataQuality",
    "risk",
    "margin",
    "rewardRisk",
  ];
  const assignedFactors = Object.values(definition.entryPolicy.factors).flat();
  if (
    new Set(assignedFactors).size !== assignedFactors.length ||
    requiredHardGates.some(
      (factor) => !definition.entryPolicy.factors.hardGate.includes(factor),
    )
  ) {
    throw new RangeError(
      "Impulse Fade lifecycle 1 requires unique, supported hard-gate factor roles",
    );
  }
  if (
    Object.values(definition.executionAssumptions).some(
      (value) => !Number.isFinite(value) || value < 0,
    )
  ) {
    throw new RangeError("Execution assumptions must be non-negative finite numbers");
  }
  if (
    definition.executionAssumptions.adverseEntrySlippageBps >= 10_000 ||
    definition.executionAssumptions.adverseStopSlippageBps >= 10_000 ||
    definition.executionAssumptions.adverseTargetSlippageBps >= 10_000
  ) {
    throw new RangeError("Adverse-slippage allowances must be below 10,000 basis points");
  }
  const normalized = immutableJsonClone(definition);
  return immutableJsonClone({
    ...normalized,
    profileHash: strategyProfileHash(normalized),
  });
}

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

export function createImpulseFadeResearchProfile(
  overrides: ImpulseFadeResearchProfileOverrides = {},
): StrategyProfile {
  const timeframeRoles: StrategyTimeframeRoles = {
    candidateTimeframe: "1h",
    structureTimeframe: "1h",
    executionTimeframe: "15m",
    triggerTimeframe: "15m",
    contextTimeframes: ["4h", "1d"],
    ...overrides.timeframeRoles,
  };
  const requiredDataQuality: StrategyEntryPolicy["requiredDataQuality"] = {
    candidateMetricsRequired: true,
    minimumHistoryCoverageRatio: 0.9,
    rejectedNoteSeverities: ["error"],
    ...overrides.entryPolicy?.requiredDataQuality,
  };
  const factors: StrategyEntryPolicy["factors"] = {
    hardGate: [
      "activeCandidate",
      "entryCandidate",
      "confirmedRetest",
      "referenceIntegrity",
      "dataQuality",
      "risk",
      "margin",
      "rewardRisk",
    ],
    contextualConfluence: ["higherTimeframeResistance", "relativeStrengthWeakness", "avwapFailure"],
    informational: ["stochRsi", "volume", "extensionBadges"],
    ...overrides.entryPolicy?.factors,
  };
  const entryPolicy: StrategyEntryPolicy = {
    eligibleLifecycleStates: ["entryCandidate"],
    retestRequired: true,
    confirmedRejectionRequired: true,
    permittedOrderPlanTypes: [
      "marketNextAvailable",
      "limit",
      "stopMarket",
      "manualReference",
    ],
    maxAgeSinceEntryCandidateSeconds: 6 * 60 * 60,
    minimumRewardRisk: 1.5,
    ...overrides.entryPolicy,
    requiredDataQuality,
    factors,
  };

  return createStrategyProfile({
    schemaVersion: STRATEGY_PROFILE_SCHEMA_VERSION,
    id: overrides.id ?? IMPULSE_FADE_RESEARCH_PROFILE_ID,
    version: overrides.version ?? IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
    name: overrides.name ?? "Impulse Fade v1 research default",
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash:
      overrides.lifecycleConfigHash ?? impulseFadeLifecycleConfigHash(),
    side: "short",
    timeframeRoles,
    entryPolicy,
    stopPolicy: {
      permittedDerivations: [
        "episodeHigh",
        "structuralInvalidation",
        "supportResistanceZoneBoundary",
        "avwapReference",
        "manual",
      ],
      requireOutsideEpisodeHigh: true,
      ...overrides.stopPolicy,
    },
    targetPolicy: {
      permittedDerivations: [
        "supportZone",
        "avwap",
        "preImpulseBase",
        "fixedRMultiple",
        "manual",
      ],
      maximumTargets: 4,
      fractionTolerance: 1e-8,
      ...overrides.targetPolicy,
    },
    riskPolicy: {
      maximumAccountRiskFraction: 0.01,
      maximumMarginAllocationFraction: 0.25,
      maximumNotional: null,
      ...overrides.riskPolicy,
    },
    executionAssumptions: {
      entryFeeRate: 0.00055,
      stopExitFeeRate: 0.00055,
      targetExitFeeRate: 0.00055,
      adverseEntrySlippageBps: 5,
      adverseStopSlippageBps: 5,
      adverseTargetSlippageBps: 5,
      ...overrides.executionAssumptions,
    },
    createdAt: overrides.createdAt ?? 1_788_393_600,
  });
}

export const DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE =
  createImpulseFadeResearchProfile();

export function createDecisionReferenceLevel(
  input: CreateDecisionReferenceLevelInput,
): DecisionReferenceLevel {
  if (!input.id.trim()) throw new TypeError("Decision reference id is required");
  validatePositiveNumber(input.price, "reference price");
  validateFiniteTimestamp(input.eventTime, "reference eventTime");
  validateFiniteTimestamp(input.knownAt, "reference knownAt");
  if (input.knownAt < input.eventTime) {
    throw new RangeError("Reference knownAt cannot precede eventTime");
  }
  const observationId = decisionReferenceObservationId(input.sourceObject);
  if (
    input.sourceObject.observationId != null &&
    input.sourceObject.observationId !== observationId
  ) {
    throw new Error("Decision reference source observation failed deterministic verification");
  }
  return immutableJsonClone({
    id: input.id,
    kind: input.kind,
    price: input.price,
    rangeLow: input.rangeLow ?? null,
    rangeHigh: input.rangeHigh ?? null,
    sourceTimeframe: input.sourceTimeframe ?? null,
    eventTime: input.eventTime,
    knownAt: input.knownAt,
    sourceObject: {
      ...input.sourceObject,
      observationId,
    },
  });
}

export function createDecisionSnapshot(input: DecisionSnapshotInput): DecisionSnapshot {
  validateFiniteTimestamp(input.decisionTime, "decisionTime");
  validateFiniteTimestamp(input.effectiveAsOf, "effectiveAsOf");
  if (input.effectiveAsOf > input.decisionTime) {
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  }
  if (input.lifecycle.asOf !== input.effectiveAsOf) {
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  }
  if (input.lifecycle.executionTimeframe !== input.strategyProfile.timeframeRoles.executionTimeframe) {
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  }
  if (
    (input.lifecycle.updatedTs != null && input.lifecycle.updatedTs > input.effectiveAsOf) ||
    (input.lifecycle.stateSince != null && input.lifecycle.stateSince > input.effectiveAsOf)
  ) {
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  }
  if (
    input.lifecycle.candidate &&
    (input.lifecycle.candidate.lifecycleVersion !== input.lifecycle.lifecycleVersion ||
      input.lifecycle.candidate.lifecycleConfigHash !== input.lifecycle.lifecycleConfigHash ||
      input.lifecycle.candidate.symbol.toUpperCase() !== input.symbol.toUpperCase() ||
      input.lifecycle.candidate.source !== input.source)
  ) {
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  }
  assertCandidateKnownAt(input.lifecycle.candidate, input.effectiveAsOf);
  assertCandidateMetricsKnownAt(input.candidateMetrics, input.effectiveAsOf);

  const notes = [...input.dataQualityNotes];
  assertReferenceConsistency([
    ...input.activeStructureLevels,
    ...input.supportResistanceZones,
    ...input.visibleOrSelectedReferenceLevels,
    ...(input.avwapState ? [input.avwapState.reference] : []),
  ]);
  for (const message of input.lifecycle.dataQuality) {
    notes.push({
      code: "LIFECYCLE_DATA_QUALITY_NOTE",
      severity: "warning",
      message,
    });
  }

  const candidateMetrics = candidateMetricsAt(
    input.candidateMetrics,
    input.effectiveAsOf,
    input.symbol,
    input.lifecycle.candidate ?? null,
  );
  if (input.candidateMetrics && !candidateMetrics) {
    notes.push({
      code: "CANDIDATE_METRICS_AFTER_CUTOFF",
      severity: "error",
      message: "Candidate metrics were not valid for the symbol, venue, or decision cutoff",
    });
  }
  for (const reason of candidateMetrics?.insufficientDataReasons ?? []) {
    notes.push({
      code: `CANDIDATE_METRICS_${reason.code}`,
      severity: "error",
      message: reason.message,
    });
  }

  const definition = {
    snapshotSchemaVersion: DECISION_SNAPSHOT_SCHEMA_VERSION,
    symbol: input.symbol.toUpperCase(),
    source: input.source,
    decisionTime: input.decisionTime,
    effectiveAsOf: input.effectiveAsOf,
    setupFamily: input.lifecycle.setupFamily,
    lifecycleVersion: input.lifecycle.lifecycleVersion,
    lifecycleConfigHash: input.lifecycle.lifecycleConfigHash,
    strategyProfileId: input.strategyProfile.id,
    strategyProfileVersion: input.strategyProfile.version,
    strategyProfileHash: input.strategyProfile.profileHash,
    candidateEpisode:
      input.lifecycle.candidate?.detectedAt != null &&
      input.lifecycle.candidate.detectedAt <= input.effectiveAsOf
        ? input.lifecycle.candidate
        : null,
    activeCandidateId:
      input.lifecycle.candidate?.detectedAt != null &&
      input.lifecycle.candidate.detectedAt <= input.effectiveAsOf
        ? input.lifecycle.candidate.id
        : null,
    lifecycleState: input.lifecycle.currentState,
    lifecycleStateSince: input.lifecycle.stateSince,
    lifecycleEvidence: knownEventsAt(input.lifecycle.evidence, input.effectiveAsOf),
    pendingConditions: [...input.lifecycle.pendingConditions],
    candidateMetrics,
    structureByTimeframe: structuresAt(input.structureByTimeframe, input.effectiveAsOf),
    activeStructureLevels: referencesAt(input.activeStructureLevels, input.effectiveAsOf),
    supportResistanceZones: referencesAt(
      input.supportResistanceZones,
      input.effectiveAsOf,
    ),
    avwapState:
      input.avwapState?.knownAt != null &&
      input.avwapState.knownAt <= input.effectiveAsOf &&
      input.avwapState.reference.knownAt <= input.effectiveAsOf
        ? input.avwapState
        : null,
    avwapEvents: knownEventsAt(input.avwapEvents, input.effectiveAsOf),
    relativeStrengthState:
      input.relativeStrengthState?.knownAt != null &&
      input.relativeStrengthState.knownAt <= input.effectiveAsOf
        ? input.relativeStrengthState
        : null,
    relativeStrengthEvents: knownEventsAt(
      input.relativeStrengthEvents,
      input.effectiveAsOf,
    ),
    visibleOrSelectedReferenceLevels: referencesAt(
      input.visibleOrSelectedReferenceLevels,
      input.effectiveAsOf,
    ),
    dataQualityNotes: notes,
  };
  const id = decisionSnapshotId(definition);
  return immutableJsonClone({ ...definition, id });
}

export function decisionSnapshotId(
  snapshot: DecisionSnapshot | Omit<DecisionSnapshot, "id">,
): string {
  const { id: _ignored, ...definition } = snapshot as DecisionSnapshot;
  return `decision-snapshot:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

export function decisionSnapshotReferenceLevels(
  snapshot: DecisionSnapshot,
): DecisionReferenceLevel[] {
  const references = [
    ...snapshot.activeStructureLevels,
    ...snapshot.supportResistanceZones,
    ...snapshot.visibleOrSelectedReferenceLevels,
    ...(snapshot.avwapState ? [snapshot.avwapState.reference] : []),
  ];
  const unique = new Map<string, DecisionReferenceLevel>();
  for (const reference of references) {
    const existing = unique.get(reference.id);
    if (existing && canonicalSerialize(existing) !== canonicalSerialize(reference)) {
      throw new RangeError(`Conflicting decision reference id ${reference.id}`);
    }
    unique.set(reference.id, reference);
  }
  return [...unique.values()];
}

function candidateMetricsAt(
  metrics: CandidateMetrics | null,
  asOf: number,
  symbol: string,
  candidate: SetupCandidateEpisode | null,
): CandidateMetrics | null {
  if (
    !metrics ||
    metrics.effectiveAsOf == null ||
    metrics.effectiveAsOf > asOf ||
    metrics.symbol.toUpperCase() !== symbol.toUpperCase() ||
    metrics.marketType.toLowerCase() !== "perp" ||
    (candidate != null && metrics.source !== candidate.source) ||
    (candidate?.venue && metrics.exchange.toLowerCase() !== candidate.venue.toLowerCase())
  ) {
    return null;
  }
  return metrics;
}

function assertCandidateKnownAt(
  candidate: SetupCandidateEpisode | null,
  asOf: number,
) {
  if (!candidate) return;
  const timestamps = [
    candidate.detectedAt,
    candidate.detectionEventTime,
    candidate.stateSince,
    candidate.episodeHighTime,
    candidate.terminalAt,
    ...candidate.initialMtfContext.map((item) => item.updatedTs),
  ].filter((value): value is number => value != null);
  if (timestamps.some((value) => !Number.isFinite(value) || value > asOf)) {
    throw new RangeError("Candidate episode contains information after effectiveAsOf");
  }
}

function assertCandidateMetricsKnownAt(metrics: CandidateMetrics | null, asOf: number) {
  if (!metrics) return;
  const timestamps = [
    metrics.requestedAsOf,
    metrics.effectiveAsOf,
    metrics.updatedAt,
    metrics.historyCoverage.requestedEndTs,
    metrics.historyCoverage.availableEndTs,
    metrics.extension.latestTs,
    metrics.extension.referenceTs,
    ...Object.values(metrics.timeframeExtensions).map((item) => item.latestTs),
  ].filter((value): value is number => value != null);
  if (timestamps.some((value) => !Number.isFinite(value) || value > asOf)) {
    throw new RangeError("Candidate metrics contain information after effectiveAsOf");
  }
}

function structuresAt(
  structures: Readonly<Record<string, MarketStructureSummary | null>>,
  asOf: number,
) {
  return Object.fromEntries(
    Object.entries(structures)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([timeframe, summary]) => [
        timeframe,
        structureSummaryKnownAt(summary) <= asOf ? summary : null,
      ]),
  );
}

function referencesAt(references: readonly DecisionReferenceLevel[], asOf: number) {
  return references
    .filter((reference) => reference.knownAt <= asOf)
    .sort((left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id));
}

function knownEventsAt<T extends { eventTime: number; knownAt: number }>(
  events: readonly T[],
  asOf: number,
) {
  return events
    .filter((event) => event.knownAt <= asOf)
    .sort(
      (left, right) =>
        left.knownAt - right.knownAt ||
        left.eventTime - right.eventTime ||
        canonicalHash(left).localeCompare(canonicalHash(right)),
    );
}

function structureSummaryKnownAt(summary: MarketStructureSummary | null) {
  if (!summary) return -Infinity;
  return Math.max(
    summary.updatedTs ?? -Infinity,
    summary.lastBreak?.knownAt ?? -Infinity,
    summary.lastSwingHigh?.knownAt ?? -Infinity,
    summary.lastSwingLow?.knownAt ?? -Infinity,
  );
}

function assertReferenceConsistency(references: readonly DecisionReferenceLevel[]) {
  const byId = new Map<string, DecisionReferenceLevel>();
  for (const reference of references) {
    const existing = byId.get(reference.id);
    if (existing && canonicalSerialize(existing) !== canonicalSerialize(reference)) {
      throw new RangeError(`Conflicting decision reference id ${reference.id}`);
    }
    byId.set(reference.id, reference);
  }
}

function validateFiniteTimestamp(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite Unix timestamp`);
  }
}

function validatePositiveNumber(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
}

function validateFraction(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new RangeError(`${label} must be in (0, 1]`);
  }
}
