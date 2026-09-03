import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  IMPULSE_FADE_SETUP_FAMILY,
  type SetupStateName,
} from "./indicators";
import { canonicalHash, canonicalSerialize, immutableJsonClone } from "./serialization";
import {
  DECISION_SNAPSHOT_SCHEMA_VERSION,
  type DecisionReferenceLevel,
  type DecisionSnapshot,
  type EntryOrderPlanType,
  type StopDerivationType,
  type StrategyExecutionAssumptions,
  type StrategyProfile,
  type StrategySide,
  type TargetDerivationType,
  decisionSnapshotId,
  decisionSnapshotReferenceLevels,
  strategyProfileHash,
} from "./strategy";

export const SIZING_MODEL_VERSION = "linear-quote-perpetual-risk.1" as const;
export const SIZING_RESULT_SCHEMA_VERSION = "sizing-result.1" as const;
export const TRADE_PLAN_SCHEMA_VERSION = "trade-plan.1" as const;
export const DECISION_RECORD_SCHEMA_VERSION = "decision-record.1" as const;

export type TradePlanStatus = "draft" | "finalized";
export type ComplianceClassification =
  | "Compliant"
  | "Overridden"
  | "OutOfStrategy"
  | "InvalidPlan";

export type TradePlanRuleCode =
  | "NO_ACTIVE_CANDIDATE"
  | "ENTRY_BEFORE_ENTRY_CANDIDATE"
  | "ENTRY_BEFORE_STRUCTURE_BREAK"
  | "ENTRY_BEFORE_RETEST"
  | "RETEST_TOO_OLD"
  | "STOP_NOT_ABOVE_ENTRY"
  | "STOP_INSIDE_INVALIDATION_LEVEL"
  | "NO_VALID_TARGET"
  | "TARGET_FRACTIONS_INVALID"
  | "REWARD_RISK_BELOW_MINIMUM"
  | "RISK_ABOVE_PROFILE_LIMIT"
  | "MARGIN_ALLOCATION_EXCEEDED"
  | "MAX_LEVERAGE_EXCEEDED"
  | "AVAILABLE_BALANCE_EXCEEDED"
  | "MINIMUM_QUANTITY_NOT_MET"
  | "MINIMUM_NOTIONAL_NOT_MET"
  | "MAXIMUM_NOTIONAL_EXCEEDED"
  | "DATA_QUALITY_INSUFFICIENT"
  | "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME"
  | "REFERENCE_LEVEL_NOT_IN_SNAPSHOT"
  | "REFERENCE_LEVEL_SNAPSHOT_MISMATCH"
  | "STRATEGY_PROFILE_VERSION_MISMATCH"
  | "ENTRY_ORDER_TYPE_NOT_PERMITTED"
  | "STOP_DERIVATION_NOT_PERMITTED"
  | "TARGET_DERIVATION_NOT_PERMITTED"
  | "TOO_MANY_TARGETS"
  | "RISK_REQUEST_INVALID"
  | "INVALID_NUMERIC_INPUT"
  | "UNSUPPORTED_SIDE"
  | "OVERRIDE_REASON_REQUIRED"
  | "EXACT_LIQUIDATION_MODEL_UNAVAILABLE"
  | "SERIALIZED_INTEGRITY_MISMATCH"
  | "INSTRUMENT_IDENTITY_MISMATCH"
  | "PRICE_TICK_MISMATCH"
  | "LEVERAGE_STEP_MISMATCH"
  | "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE"
  | "REFERENCE_PRICE_MISMATCH";

export interface TradePlanIssue {
  code: TradePlanRuleCode;
  message: string;
}

export interface AccountState {
  equity: number;
  availableBalance: number | null;
  quoteCurrency: string;
}

export interface RiskRequest {
  accountRiskFraction: number | null;
  fixedRiskAmount: number | null;
  maximumMarginAllocationFraction: number;
  maximumNotional: number | null;
}

export type LeveragePolicy =
  | { mode: "manual"; leverage: number }
  | { mode: "derivedMinimum" };

export interface VenueModelReference {
  modelId: string;
  version: string;
  verifiedAt: number;
}

export interface VenueRiskRules {
  venue: string;
  symbol: string;
  quantityStep: number;
  priceTick: number;
  minQuantity: number;
  minNotional: number;
  maxLeverage: number;
  leverageStep: number;
  feeSchedule: {
    makerRate: number;
    takerRate: number;
    version: string;
  };
  maintenanceMarginModel: VenueModelReference | null;
  liquidationModel: VenueModelReference | null;
}

export interface EntryPlan {
  orderPlanType: EntryOrderPlanType;
  intendedPrice: number;
  priceSource: string;
  associatedReferenceLevelId: string | null;
  associatedReferenceLevel: DecisionReferenceLevel | null;
  expiresAt: number | null;
  cancellationCondition: string | null;
}

export interface StopBuffer {
  basisPoints: number | null;
  atrFraction: number | null;
  atrValue: number | null;
}

export interface StopPlan {
  stopPrice: number;
  derivationType: StopDerivationType;
  referenceLevelId: string | null;
  referenceLevel: DecisionReferenceLevel | null;
  buffer: StopBuffer;
  rationale: string;
}

export interface TargetPlan {
  id: string;
  targetPrice: number;
  positionFraction: number;
  derivationType: TargetDerivationType;
  referenceLevelId: string | null;
  referenceLevel: DecisionReferenceLevel | null;
  rationale: string;
}

export interface TargetOutcome {
  targetId: string;
  targetPrice: number;
  effectiveTargetPrice: number;
  positionFraction: number;
  grossReward: number;
  expectedEntryFee: number;
  expectedExitFee: number;
  netProjectedReward: number;
  grossR: number | null;
  projectedR: number | null;
  weightedGrossRContribution: number | null;
  weightedRContribution: number | null;
}

export interface LiquidationUnavailable {
  status: "unavailable";
  exactPrice: null;
  modelVersion: null;
  reason: "EXACT_LIQUIDATION_MODEL_UNAVAILABLE";
}

export interface SizingResult {
  schemaVersion: typeof SIZING_RESULT_SCHEMA_VERSION;
  sizingModelVersion: typeof SIZING_MODEL_VERSION;
  side: StrategySide;
  riskBudget: number | null;
  rawQuantity: number | null;
  roundedQuantity: number | null;
  effectiveEntry: number | null;
  effectiveStop: number | null;
  stopDistanceAbsolute: number | null;
  stopDistancePercent: number | null;
  stopDistanceAtr: number | null;
  grossNotional: number | null;
  estimatedEntryFee: number | null;
  estimatedStopFee: number | null;
  projectedLossAtStop: number | null;
  projectedLossPercentEquity: number | null;
  selectedLeverage: number | null;
  minimumRequiredLeverage: number | null;
  initialMargin: number | null;
  marginPercentEquity: number | null;
  marginPercentAvailableBalance: number | null;
  targetOutcomes: TargetOutcome[];
  weightedGrossReward: number | null;
  weightedProjectedReward: number | null;
  weightedGrossR: number | null;
  weightedProjectedR: number | null;
  liquidationStatus: LiquidationUnavailable;
  hardErrors: TradePlanIssue[];
  warnings: TradePlanIssue[];
}

export interface LinearPerpetualSizingInput {
  side: StrategySide;
  intendedEntryPrice: number;
  stopPrice: number;
  targets: readonly TargetPlan[];
  accountState: AccountState;
  riskRequest: RiskRequest;
  executionAssumptions: StrategyExecutionAssumptions;
  venueRules: VenueRiskRules;
  leveragePolicy: LeveragePolicy;
  stopDistanceAtr?: number | null;
  targetFractionTolerance?: number;
}

export interface ComplianceResult {
  classification: ComplianceClassification;
  hardErrors: TradePlanIssue[];
  strategyViolations: TradePlanIssue[];
  warnings: TradePlanIssue[];
  overrideReason: string | null;
}

export interface TradePlan {
  schemaVersion: typeof TRADE_PLAN_SCHEMA_VERSION;
  id: string;
  snapshotId: string;
  setupFamily: typeof IMPULSE_FADE_SETUP_FAMILY;
  lifecycleVersion: typeof IMPULSE_FADE_LIFECYCLE_VERSION;
  lifecycleConfigHash: string;
  strategyProfileId: string;
  strategyProfileVersion: string;
  strategyProfileHash: string;
  side: StrategySide;
  entryPlan: EntryPlan;
  stopPlan: StopPlan;
  targetPlans: TargetPlan[];
  accountState: AccountState;
  riskRequest: RiskRequest;
  sizingResult: SizingResult;
  venueRules: VenueRiskRules;
  leveragePolicy: LeveragePolicy;
  executionAssumptions: StrategyExecutionAssumptions;
  complianceResult: ComplianceResult;
  discretionaryOverrideReason: string | null;
  status: TradePlanStatus;
  createdAt: number;
}

export interface CreateTradePlanInput {
  id?: string;
  snapshot: DecisionSnapshot;
  strategyProfile: StrategyProfile;
  entryPlan: EntryPlan;
  stopPlan: StopPlan;
  targetPlans: readonly TargetPlan[];
  accountState: AccountState;
  riskRequest: RiskRequest;
  venueRules: VenueRiskRules;
  leveragePolicy: LeveragePolicy;
  stopDistanceAtr?: number | null;
  discretionaryOverrideReason?: string | null;
  status: TradePlanStatus;
  createdAt: number;
}

export type DecisionAction = "Wait" | "Skip" | "ProposeTrade";
export type SkipReasonCode =
  | "insufficientExtension"
  | "poorLiquidity"
  | "noExecutionVenueListing"
  | "higherTimeframeContinuationTooStrong"
  | "noViableStop"
  | "insufficientRewardRisk"
  | "eventTooMature"
  | "dataQualityInsufficient"
  | "discretionaryRejection"
  | "other";

export interface DecisionRecord {
  schemaVersion: typeof DECISION_RECORD_SCHEMA_VERSION;
  id: string;
  sessionId: string | null;
  snapshotId: string;
  decisionTime: number;
  action: DecisionAction;
  confidence: number | null;
  thesis: string | null;
  tags: string[];
  nextCondition: string | null;
  skipReason: SkipReasonCode | null;
  tradePlan: TradePlan | null;
}

export interface CreateDecisionRecordInput {
  id?: string;
  sessionId?: string | null;
  snapshot: DecisionSnapshot;
  decisionTime: number;
  action: DecisionAction;
  confidence?: number | null;
  thesis?: string | null;
  tags?: readonly string[];
  nextCondition?: string | null;
  skipReason?: SkipReasonCode | null;
  tradePlan?: TradePlan | null;
}

export function calculateLinearPerpetualSizing(
  input: LinearPerpetualSizingInput,
): SizingResult {
  const hardErrors: TradePlanIssue[] = [];
  const warnings: TradePlanIssue[] = [
    issue(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator",
    ),
  ];
  if (input.side !== "short") {
    hardErrors.push(issue("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported"));
  }

  const numbers = [
    input.intendedEntryPrice,
    input.stopPrice,
    input.accountState.equity,
    input.riskRequest.maximumMarginAllocationFraction,
    input.venueRules.quantityStep,
    input.venueRules.maxLeverage,
    input.venueRules.priceTick,
    input.venueRules.leverageStep,
    input.venueRules.minQuantity,
    input.venueRules.minNotional,
  ];
  if (numbers.some((value) => !Number.isFinite(value) || value <= 0)) {
    hardErrors.push(issue("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers"));
  }
  if (input.stopPrice <= input.intendedEntryPrice) {
    hardErrors.push(issue("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry"));
  }
  if (
    (input.accountState.availableBalance != null && input.accountState.availableBalance < 0) ||
    (input.riskRequest.maximumNotional != null && input.riskRequest.maximumNotional <= 0) ||
    input.venueRules.feeSchedule.makerRate < 0 ||
    input.venueRules.feeSchedule.takerRate < 0
  ) {
    addIssue(
      hardErrors,
      "INVALID_NUMERIC_INPUT",
      "Balances, notional limits, and venue fee rates must be valid non-negative values",
    );
  }
  if (
    !isStepAligned(input.intendedEntryPrice, input.venueRules.priceTick) ||
    !isStepAligned(input.stopPrice, input.venueRules.priceTick) ||
    input.targets.some((target) =>
      !isStepAligned(target.targetPrice, input.venueRules.priceTick),
    )
  ) {
    addIssue(
      hardErrors,
      "PRICE_TICK_MISMATCH",
      `Entry, stop, and targets must align to price tick ${input.venueRules.priceTick}`,
    );
  }
  if (
    input.leveragePolicy.mode === "manual" &&
    !isStepAligned(input.leveragePolicy.leverage, input.venueRules.leverageStep)
  ) {
    addIssue(
      hardErrors,
      "LEVERAGE_STEP_MISMATCH",
      `Manual leverage must align to venue step ${input.venueRules.leverageStep}`,
    );
  }
  if (
    input.executionAssumptions.entryFeeRate < input.venueRules.feeSchedule.makerRate ||
    input.executionAssumptions.stopExitFeeRate < input.venueRules.feeSchedule.takerRate ||
    input.executionAssumptions.targetExitFeeRate < input.venueRules.feeSchedule.makerRate
  ) {
    warnings.push(
      issue(
        "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
        "One or more fee assumptions are below the supplied venue schedule",
      ),
    );
  }

  const hasFraction = input.riskRequest.accountRiskFraction != null;
  const hasFixed = input.riskRequest.fixedRiskAmount != null;
  if (hasFraction === hasFixed) {
    hardErrors.push(
      issue(
        "RISK_REQUEST_INVALID",
        "Specify exactly one of accountRiskFraction or fixedRiskAmount",
      ),
    );
  }
  if (
    (hasFraction &&
      (!validPositive(input.riskRequest.accountRiskFraction ?? 0) ||
        (input.riskRequest.accountRiskFraction ?? 0) > 1)) ||
    (hasFixed &&
      (!validPositive(input.riskRequest.fixedRiskAmount ?? 0) ||
        (input.riskRequest.fixedRiskAmount ?? 0) > input.accountState.equity)) ||
    input.riskRequest.maximumMarginAllocationFraction > 1
  ) {
    addIssue(
      hardErrors,
      "RISK_REQUEST_INVALID",
      "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity",
    );
  }
  if (
    Object.values(input.executionAssumptions).some(
      (value) => !Number.isFinite(value) || value < 0,
    )
  ) {
    addIssue(
      hardErrors,
      "INVALID_NUMERIC_INPUT",
      "Fees and adverse-slippage allowances must be non-negative finite numbers",
    );
  }
  if (
    input.executionAssumptions.adverseEntrySlippageBps >= 10_000 ||
    input.executionAssumptions.adverseStopSlippageBps >= 10_000 ||
    input.executionAssumptions.adverseTargetSlippageBps >= 10_000
  ) {
    addIssue(
      hardErrors,
      "INVALID_NUMERIC_INPUT",
      "Adverse-slippage allowances must be below 10,000 basis points",
    );
  }
  const riskBudget = hasFixed
    ? input.riskRequest.fixedRiskAmount
    : hasFraction
      ? input.accountState.equity * (input.riskRequest.accountRiskFraction ?? 0)
      : null;
  if (riskBudget == null || !Number.isFinite(riskBudget) || riskBudget <= 0) {
    addIssue(hardErrors, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite");
  }

  validateTargets(
    input.targets,
    input.intendedEntryPrice,
    input.targetFractionTolerance ?? 1e-8,
    hardErrors,
  );

  const effectiveEntryValue = input.intendedEntryPrice *
    (1 - input.executionAssumptions.adverseEntrySlippageBps / 10_000);
  const effectiveEntry = validPositive(effectiveEntryValue) ? effectiveEntryValue : null;
  const effectiveStop = validPositive(input.stopPrice)
    ? input.stopPrice *
      (1 + input.executionAssumptions.adverseStopSlippageBps / 10_000)
    : null;
  const riskPerUnit =
    effectiveEntry != null && effectiveStop != null
      ? effectiveStop - effectiveEntry +
        effectiveEntry * input.executionAssumptions.entryFeeRate +
        effectiveStop * input.executionAssumptions.stopExitFeeRate
      : null;
  if (riskPerUnit == null || !Number.isFinite(riskPerUnit) || riskPerUnit <= 0) {
    addIssue(hardErrors, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  }

  const rawQuantity = riskBudget != null && riskPerUnit != null && riskPerUnit > 0
    ? riskBudget / riskPerUnit
    : null;
  let roundedQuantity = rawQuantity == null
    ? null
    : roundDownToStep(rawQuantity, input.venueRules.quantityStep);
  if (roundedQuantity != null && riskBudget != null && riskPerUnit != null) {
    while (
      roundedQuantity > 0 &&
      roundedQuantity * riskPerUnit > riskBudget + Math.max(1e-10, riskBudget * 1e-12)
    ) {
      roundedQuantity = roundDownToStep(
        roundedQuantity - input.venueRules.quantityStep,
        input.venueRules.quantityStep,
      );
    }
  }
  const quantity = roundedQuantity != null && roundedQuantity > 0 ? roundedQuantity : null;
  const grossNotional = quantity == null ? null : quantity * input.intendedEntryPrice;
  const estimatedEntryFee =
    quantity == null || effectiveEntry == null
      ? null
      : quantity * effectiveEntry * input.executionAssumptions.entryFeeRate;
  const estimatedStopFee =
    quantity == null || effectiveStop == null
      ? null
      : quantity * effectiveStop * input.executionAssumptions.stopExitFeeRate;
  const projectedLossAtStop =
    quantity == null || riskPerUnit == null ? null : quantity * riskPerUnit;

  if (quantity == null || quantity < input.venueRules.minQuantity) {
    addIssue(
      hardErrors,
      "MINIMUM_QUANTITY_NOT_MET",
      `Rounded quantity is below venue minimum ${input.venueRules.minQuantity}`,
    );
  }
  if (grossNotional == null || grossNotional < input.venueRules.minNotional) {
    addIssue(
      hardErrors,
      "MINIMUM_NOTIONAL_NOT_MET",
      `Notional is below venue minimum ${input.venueRules.minNotional}`,
    );
  }
  const maxNotional = input.riskRequest.maximumNotional;
  if (maxNotional != null && grossNotional != null && grossNotional > maxNotional) {
    addIssue(
      hardErrors,
      "MAXIMUM_NOTIONAL_EXCEEDED",
      `Notional exceeds configured maximum ${maxNotional}`,
    );
  }

  const maximumAllocatedMargin =
    input.accountState.equity * input.riskRequest.maximumMarginAllocationFraction;
  const usableMargin = input.accountState.availableBalance == null
    ? maximumAllocatedMargin
    : Math.min(maximumAllocatedMargin, input.accountState.availableBalance);
  const minimumRequiredLeverage =
    grossNotional != null && usableMargin > 0
      ? grossNotional / usableMargin
      : null;
  const selectedLeverage = selectLeverage(
    input.leveragePolicy,
    minimumRequiredLeverage,
    input.venueRules.leverageStep,
  );
  if (selectedLeverage != null && selectedLeverage > input.venueRules.maxLeverage) {
    addIssue(
      hardErrors,
      "MAX_LEVERAGE_EXCEEDED",
      `Required leverage ${selectedLeverage} exceeds venue maximum ${input.venueRules.maxLeverage}`,
    );
  }
  const initialMargin =
    grossNotional != null && selectedLeverage != null && selectedLeverage > 0
      ? grossNotional / selectedLeverage
      : null;
  if (initialMargin != null && initialMargin > maximumAllocatedMargin + 1e-10) {
    addIssue(
      hardErrors,
      "MARGIN_ALLOCATION_EXCEEDED",
      "Initial margin exceeds the configured account-equity allocation",
    );
  }
  if (
    initialMargin != null &&
    input.accountState.availableBalance != null &&
    initialMargin > input.accountState.availableBalance + 1e-10
  ) {
    addIssue(
      hardErrors,
      "AVAILABLE_BALANCE_EXCEEDED",
      "Initial margin exceeds available balance",
    );
  }

  const grossStopLoss =
    quantity != null && effectiveEntry != null && effectiveStop != null
      ? quantity * (effectiveStop - effectiveEntry)
      : null;
  const targetOutcomes = projectTargetOutcomes(
    input.targets,
    quantity,
    effectiveEntry,
    grossStopLoss,
    projectedLossAtStop,
    input.executionAssumptions,
  );
  const weightedGrossReward = sumNullable(
    targetOutcomes.map((target) => target.grossReward * target.positionFraction),
  );
  const weightedProjectedReward = sumNullable(
    targetOutcomes.map((target) => target.netProjectedReward * target.positionFraction),
  );
  const weightedGrossR = sumNullable(
    targetOutcomes.map((target) =>
      target.weightedGrossRContribution == null ? null : target.weightedGrossRContribution,
    ),
  );
  const weightedProjectedR = sumNullable(
    targetOutcomes.map((target) =>
      target.weightedRContribution == null ? null : target.weightedRContribution,
    ),
  );

  return immutableJsonClone({
    schemaVersion: SIZING_RESULT_SCHEMA_VERSION,
    sizingModelVersion: SIZING_MODEL_VERSION,
    side: input.side,
    riskBudget,
    rawQuantity,
    roundedQuantity: quantity,
    effectiveEntry,
    effectiveStop,
    stopDistanceAbsolute:
      effectiveEntry == null || effectiveStop == null ? null : effectiveStop - effectiveEntry,
    stopDistancePercent:
      effectiveEntry == null || effectiveStop == null
        ? null
        : ((effectiveStop - effectiveEntry) / effectiveEntry) * 100,
    stopDistanceAtr: input.stopDistanceAtr ?? null,
    grossNotional,
    estimatedEntryFee,
    estimatedStopFee,
    projectedLossAtStop,
    projectedLossPercentEquity:
      projectedLossAtStop == null || input.accountState.equity <= 0
        ? null
        : (projectedLossAtStop / input.accountState.equity) * 100,
    selectedLeverage,
    minimumRequiredLeverage,
    initialMargin,
    marginPercentEquity:
      initialMargin == null || input.accountState.equity <= 0
        ? null
        : (initialMargin / input.accountState.equity) * 100,
    marginPercentAvailableBalance:
      initialMargin == null ||
      input.accountState.availableBalance == null ||
      input.accountState.availableBalance <= 0
        ? null
        : (initialMargin / input.accountState.availableBalance) * 100,
    targetOutcomes,
    weightedGrossReward,
    weightedProjectedReward,
    weightedGrossR,
    weightedProjectedR,
    liquidationStatus: {
      status: "unavailable",
      exactPrice: null,
      modelVersion: null,
      reason: "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
    },
    hardErrors,
    warnings,
  });
}

export function createTradePlan(input: CreateTradePlanInput): TradePlan {
  if (!Number.isFinite(input.createdAt) || input.createdAt < input.snapshot.decisionTime) {
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  }
  const sizingResult = calculateLinearPerpetualSizing({
    side: "short",
    intendedEntryPrice: input.entryPlan.intendedPrice,
    stopPrice: input.stopPlan.stopPrice,
    targets: input.targetPlans,
    accountState: input.accountState,
    riskRequest: input.riskRequest,
    executionAssumptions: input.strategyProfile.executionAssumptions,
    venueRules: input.venueRules,
    leveragePolicy: input.leveragePolicy,
    stopDistanceAtr: input.stopDistanceAtr,
    targetFractionTolerance: input.strategyProfile.targetPolicy.fractionTolerance,
  });
  const definition = {
    schemaVersion: TRADE_PLAN_SCHEMA_VERSION,
    snapshotId: input.snapshot.id,
    setupFamily: IMPULSE_FADE_SETUP_FAMILY,
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash: input.snapshot.lifecycleConfigHash,
    strategyProfileId: input.strategyProfile.id,
    strategyProfileVersion: input.strategyProfile.version,
    strategyProfileHash: input.strategyProfile.profileHash,
    side: "short" as const,
    entryPlan: input.entryPlan,
    stopPlan: input.stopPlan,
    targetPlans: [...input.targetPlans],
    accountState: input.accountState,
    riskRequest: input.riskRequest,
    sizingResult,
    venueRules: input.venueRules,
    leveragePolicy: input.leveragePolicy,
    executionAssumptions: input.strategyProfile.executionAssumptions,
    discretionaryOverrideReason: input.discretionaryOverrideReason?.trim() || null,
    status: input.status,
    createdAt: input.createdAt,
  };
  const provisional = { ...definition, id: input.id ?? tradePlanId(definition) };
  const complianceResult = evaluateTradePlanCompliance({
    strategyProfile: input.strategyProfile,
    snapshot: input.snapshot,
    plan: provisional,
  });
  return immutableJsonClone({ ...provisional, complianceResult });
}

export function evaluateTradePlanCompliance(input: {
  strategyProfile: StrategyProfile;
  snapshot: DecisionSnapshot;
  plan: Omit<TradePlan, "complianceResult"> | TradePlan;
}): ComplianceResult {
  const { strategyProfile: profile, snapshot, plan } = input;
  const hardErrors = [...plan.sizingResult.hardErrors];
  const strategyViolations: TradePlanIssue[] = [];
  const warnings = [...plan.sizingResult.warnings];
  const recomputedSizing = calculateLinearPerpetualSizing({
    side: plan.side,
    intendedEntryPrice: plan.entryPlan.intendedPrice,
    stopPrice: plan.stopPlan.stopPrice,
    targets: plan.targetPlans,
    accountState: plan.accountState,
    riskRequest: plan.riskRequest,
    executionAssumptions: plan.executionAssumptions,
    venueRules: plan.venueRules,
    leveragePolicy: plan.leveragePolicy,
    stopDistanceAtr: plan.sizingResult.stopDistanceAtr,
    targetFractionTolerance: profile.targetPolicy.fractionTolerance,
  });
  if (
    strategyProfileHash(profile) !== profile.profileHash ||
    decisionSnapshotId(snapshot) !== snapshot.id ||
    tradePlanId(plan) !== plan.id ||
    canonicalSerialize(recomputedSizing) !== canonicalSerialize(plan.sizingResult)
  ) {
    addIssue(
      hardErrors,
      "SERIALIZED_INTEGRITY_MISMATCH",
      "A serialized profile, snapshot, plan, or sizing result failed deterministic verification",
    );
  }

  if (plan.venueRules.symbol.toUpperCase() !== snapshot.symbol.toUpperCase()) {
    addIssue(
      hardErrors,
      "INSTRUMENT_IDENTITY_MISMATCH",
      "Venue risk rules do not match the snapshot symbol",
    );
  }

  if (
    snapshot.snapshotSchemaVersion !== DECISION_SNAPSHOT_SCHEMA_VERSION ||
    snapshot.strategyProfileId !== profile.id ||
    snapshot.strategyProfileVersion !== profile.version ||
    snapshot.strategyProfileHash !== profile.profileHash ||
    snapshot.lifecycleVersion !== profile.lifecycleVersion ||
    snapshot.lifecycleConfigHash !== profile.lifecycleConfigHash ||
    plan.setupFamily !== profile.setupFamily ||
    plan.lifecycleVersion !== profile.lifecycleVersion ||
    plan.lifecycleConfigHash !== profile.lifecycleConfigHash ||
    plan.strategyProfileId !== profile.id ||
    plan.strategyProfileVersion !== profile.version ||
    plan.strategyProfileHash !== profile.profileHash ||
    canonicalSerialize(plan.executionAssumptions) !==
      canonicalSerialize(profile.executionAssumptions)
  ) {
    addIssue(
      hardErrors,
      "STRATEGY_PROFILE_VERSION_MISMATCH",
      "Snapshot and strategy profile versions or hashes do not match",
    );
  }

  if (!profile.entryPolicy.permittedOrderPlanTypes.includes(plan.entryPlan.orderPlanType)) {
    addIssue(
      strategyViolations,
      "ENTRY_ORDER_TYPE_NOT_PERMITTED",
      `Entry type ${plan.entryPlan.orderPlanType} is not permitted by the profile`,
    );
  }
  if (!profile.stopPolicy.permittedDerivations.includes(plan.stopPlan.derivationType)) {
    addIssue(
      strategyViolations,
      "STOP_DERIVATION_NOT_PERMITTED",
      `Stop derivation ${plan.stopPlan.derivationType} is not permitted`,
    );
  }
  for (const target of plan.targetPlans) {
    if (!profile.targetPolicy.permittedDerivations.includes(target.derivationType)) {
      addIssue(
        strategyViolations,
        "TARGET_DERIVATION_NOT_PERMITTED",
        `Target derivation ${target.derivationType} is not permitted`,
      );
    }
  }
  if (plan.targetPlans.length > profile.targetPolicy.maximumTargets) {
    addIssue(
      strategyViolations,
      "TOO_MANY_TARGETS",
      `Plan has more than ${profile.targetPolicy.maximumTargets} targets`,
    );
  }
  const targetFractionSum = plan.targetPlans.reduce(
    (sum, target) => sum + target.positionFraction,
    0,
  );
  if (Math.abs(targetFractionSum - 1) > profile.targetPolicy.fractionTolerance) {
    addIssue(
      hardErrors,
      "TARGET_FRACTIONS_INVALID",
      `Target fractions exceed profile tolerance ${profile.targetPolicy.fractionTolerance}`,
    );
  }

  validatePlanReferences(snapshot, plan, hardErrors);
  validateReferencePrices(plan, hardErrors);
  validateLifecycleCompliance(snapshot, profile, strategyViolations);
  validateDataQuality(snapshot, profile, strategyViolations);

  if (
    profile.stopPolicy.requireOutsideEpisodeHigh &&
    snapshot.candidateEpisode?.episodeHigh != null &&
    plan.stopPlan.stopPrice <= snapshot.candidateEpisode.episodeHigh
  ) {
    addIssue(
      strategyViolations,
      "STOP_INSIDE_INVALIDATION_LEVEL",
      "Short stop is not beyond the candidate episode high",
    );
  }
  if (
    plan.sizingResult.initialMargin != null &&
    plan.sizingResult.initialMargin >
      plan.accountState.equity * profile.riskPolicy.maximumMarginAllocationFraction + 1e-10
  ) {
    addIssue(
      strategyViolations,
      "MARGIN_ALLOCATION_EXCEEDED",
      "Initial margin exceeds the strategy profile allocation",
    );
  }
  if (
    profile.riskPolicy.maximumNotional != null &&
    plan.sizingResult.grossNotional != null &&
    plan.sizingResult.grossNotional > profile.riskPolicy.maximumNotional
  ) {
    addIssue(
      strategyViolations,
      "MAXIMUM_NOTIONAL_EXCEEDED",
      "Notional exceeds the strategy profile maximum",
    );
  }
  if (
    profile.entryPolicy.minimumRewardRisk != null &&
    plan.sizingResult.weightedProjectedR != null &&
    plan.sizingResult.weightedProjectedR < profile.entryPolicy.minimumRewardRisk
  ) {
    addIssue(
      strategyViolations,
      "REWARD_RISK_BELOW_MINIMUM",
      `Projected R ${plan.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${profile.entryPolicy.minimumRewardRisk}`,
    );
  }
  if (
    plan.sizingResult.projectedLossAtStop != null &&
    plan.sizingResult.projectedLossAtStop >
      plan.accountState.equity * profile.riskPolicy.maximumAccountRiskFraction + 1e-10
  ) {
    addIssue(
      strategyViolations,
      "RISK_ABOVE_PROFILE_LIMIT",
      "Projected stop loss exceeds the profile risk limit",
    );
  }

  const noCandidate = strategyViolations.some((item) => item.code === "NO_ACTIVE_CANDIDATE");
  const overrideReason = plan.discretionaryOverrideReason?.trim() || null;
  if (
    plan.status === "finalized" &&
    strategyViolations.length > 0 &&
    !noCandidate &&
    !overrideReason
  ) {
    addIssue(
      hardErrors,
      "OVERRIDE_REASON_REQUIRED",
      "A finalized discretionary override requires a user-supplied reason",
    );
  }

  let classification: ComplianceClassification;
  if (hardErrors.length > 0) classification = "InvalidPlan";
  else if (noCandidate) classification = "OutOfStrategy";
  else if (strategyViolations.length === 0) classification = "Compliant";
  else if (overrideReason) classification = "Overridden";
  else classification = "OutOfStrategy";

  return immutableJsonClone({
    classification,
    hardErrors,
    strategyViolations,
    warnings,
    overrideReason,
  });
}

export function createDecisionRecord(input: CreateDecisionRecordInput): DecisionRecord {
  if (!Number.isFinite(input.decisionTime) || input.decisionTime < 0) {
    throw new RangeError("Decision time must be a non-negative finite Unix timestamp");
  }
  if (input.decisionTime !== input.snapshot.decisionTime) {
    throw new RangeError("Decision record time must match its frozen snapshot");
  }
  if (
    input.confidence != null &&
    (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
  ) {
    throw new RangeError("Decision confidence must be between 0 and 1");
  }
  if (input.action === "Skip" && !input.skipReason) {
    throw new TypeError("Skip decisions require a structured skipReason");
  }
  if (input.action === "ProposeTrade" && !input.tradePlan) {
    throw new TypeError("ProposeTrade decisions require a tradePlan");
  }
  if (
    (input.action === "Wait" && (input.skipReason || input.tradePlan)) ||
    (input.action === "Skip" && input.tradePlan) ||
    (input.action === "ProposeTrade" && input.skipReason)
  ) {
    throw new TypeError("Decision action contains an incompatible payload");
  }
  if (input.tradePlan && input.tradePlan.snapshotId !== input.snapshot.id) {
    throw new RangeError("Decision trade plan must reference the same snapshot");
  }
  const definition = {
    schemaVersion: DECISION_RECORD_SCHEMA_VERSION,
    sessionId: input.sessionId ?? null,
    snapshotId: input.snapshot.id,
    decisionTime: input.decisionTime,
    action: input.action,
    confidence: input.confidence ?? null,
    thesis: input.thesis?.trim() || null,
    tags: [...(input.tags ?? [])],
    nextCondition: input.nextCondition?.trim() || null,
    skipReason: input.skipReason ?? null,
    tradePlan: input.tradePlan ?? null,
  };
  const id = input.id ?? `decision:${canonicalHash(definition).slice("fnv1a64:".length)}`;
  return immutableJsonClone({ ...definition, id });
}

function validateTargets(
  targets: readonly TargetPlan[],
  entry: number,
  fractionTolerance: number,
  hardErrors: TradePlanIssue[],
) {
  if (!targets.length || targets.some((target) => target.targetPrice >= entry)) {
    addIssue(hardErrors, "NO_VALID_TARGET", "Every short target must be below entry");
  }
  const fractionSum = targets.reduce((sum, target) => sum + target.positionFraction, 0);
  if (
    targets.some(
      (target) => !Number.isFinite(target.positionFraction) || target.positionFraction <= 0,
    ) ||
    Math.abs(fractionSum - 1) > fractionTolerance
  ) {
    addIssue(
      hardErrors,
      "TARGET_FRACTIONS_INVALID",
      "Target fractions must be positive and sum to 1",
    );
  }
}

function projectTargetOutcomes(
  targets: readonly TargetPlan[],
  quantity: number | null,
  effectiveEntry: number | null,
  grossStopLoss: number | null,
  projectedLossAtStop: number | null,
  assumptions: StrategyExecutionAssumptions,
): TargetOutcome[] {
  if (quantity == null || effectiveEntry == null) return [];
  return targets.map((target) => {
    const effectiveTargetPrice =
      target.targetPrice * (1 + assumptions.adverseTargetSlippageBps / 10_000);
    const grossReward = quantity * (effectiveEntry - effectiveTargetPrice);
    const expectedEntryFee = quantity * effectiveEntry * assumptions.entryFeeRate;
    const expectedExitFee =
      quantity * effectiveTargetPrice * assumptions.targetExitFeeRate;
    const netProjectedReward = grossReward - expectedEntryFee - expectedExitFee;
    const grossR = grossStopLoss != null && grossStopLoss > 0
      ? grossReward / grossStopLoss
      : null;
    const projectedR = projectedLossAtStop != null && projectedLossAtStop > 0
      ? netProjectedReward / projectedLossAtStop
      : null;
    return {
      targetId: target.id,
      targetPrice: target.targetPrice,
      effectiveTargetPrice,
      positionFraction: target.positionFraction,
      grossReward,
      expectedEntryFee,
      expectedExitFee,
      netProjectedReward,
      grossR,
      projectedR,
      weightedGrossRContribution:
        grossR == null ? null : grossR * target.positionFraction,
      weightedRContribution:
        projectedR == null ? null : projectedR * target.positionFraction,
    };
  });
}

function validateLifecycleCompliance(
  snapshot: DecisionSnapshot,
  profile: StrategyProfile,
  violations: TradePlanIssue[],
) {
  const activeCandidate =
    snapshot.candidateEpisode != null &&
    snapshot.activeCandidateId === snapshot.candidateEpisode.id &&
    !["notCandidate", "invalidated", "expired"].includes(snapshot.lifecycleState);
  if (!activeCandidate) {
    addIssue(violations, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  if (!profile.entryPolicy.eligibleLifecycleStates.includes(snapshot.lifecycleState)) {
    addIssue(
      violations,
      "ENTRY_BEFORE_ENTRY_CANDIDATE",
      `Lifecycle state ${snapshot.lifecycleState} is not entry-eligible`,
    );
    if (snapshot.lifecycleState === "developing" || snapshot.lifecycleState === "deteriorating") {
      addIssue(
        violations,
        "ENTRY_BEFORE_STRUCTURE_BREAK",
        "Entry precedes a confirmed bearish structure break",
      );
    }
    if (snapshot.lifecycleState === "waitingForRetest") {
      addIssue(
        violations,
        "ENTRY_BEFORE_RETEST",
        "Entry precedes a confirmed retest and rejection",
      );
    }
  }
  const hasRetest = snapshot.lifecycleEvidence.some(
    (event) => event.code === "bearish_retest_rejection",
  );
  if ((profile.entryPolicy.retestRequired || profile.entryPolicy.confirmedRejectionRequired) && !hasRetest) {
    addIssue(
      violations,
      "ENTRY_BEFORE_RETEST",
      "The profile requires a confirmed retest rejection",
    );
  }
  if (
    snapshot.lifecycleState === "entryCandidate" &&
    snapshot.lifecycleStateSince != null &&
    profile.entryPolicy.maxAgeSinceEntryCandidateSeconds != null &&
    snapshot.effectiveAsOf - snapshot.lifecycleStateSince >
      profile.entryPolicy.maxAgeSinceEntryCandidateSeconds
  ) {
    addIssue(violations, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
  }
}

function validateDataQuality(
  snapshot: DecisionSnapshot,
  profile: StrategyProfile,
  violations: TradePlanIssue[],
) {
  const policy = profile.entryPolicy.requiredDataQuality;
  const missingMetrics = policy.candidateMetricsRequired && snapshot.candidateMetrics == null;
  const coverage = snapshot.candidateMetrics?.historyCoverage.coverageRatio ?? null;
  const lowCoverage =
    policy.minimumHistoryCoverageRatio != null &&
    (coverage == null || coverage < policy.minimumHistoryCoverageRatio);
  const rejectedNote = snapshot.dataQualityNotes.some((note) =>
    policy.rejectedNoteSeverities.includes(note.severity),
  );
  if (missingMetrics || lowCoverage || rejectedNote) {
    addIssue(
      violations,
      "DATA_QUALITY_INSUFFICIENT",
      "Decision snapshot does not meet the profile data-quality requirements",
    );
  }
}

function validatePlanReferences(
  snapshot: DecisionSnapshot,
  plan: Omit<TradePlan, "complianceResult"> | TradePlan,
  hardErrors: TradePlanIssue[],
) {
  const byId = new Map(
    decisionSnapshotReferenceLevels(snapshot).map((reference) => [reference.id, reference]),
  );
  const candidates: Array<{
    requiresReference: boolean;
    id: string | null;
    reference: DecisionReferenceLevel | null;
  }> = [
    {
      requiresReference: false,
      id: plan.entryPlan.associatedReferenceLevelId,
      reference: plan.entryPlan.associatedReferenceLevel,
    },
    {
      requiresReference: plan.stopPlan.derivationType !== "manual",
      id: plan.stopPlan.referenceLevelId,
      reference: plan.stopPlan.referenceLevel,
    },
    ...plan.targetPlans.map((target) => ({
      requiresReference:
        target.derivationType !== "manual" && target.derivationType !== "fixedRMultiple",
      id: target.referenceLevelId,
      reference: target.referenceLevel,
    })),
  ];
  for (const candidate of candidates) {
    if (!candidate.id && !candidate.reference && !candidate.requiresReference) continue;
    if (!candidate.id || !candidate.reference) {
      addIssue(
        hardErrors,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object",
      );
      continue;
    }
    if (candidate.reference.knownAt > snapshot.effectiveAsOf) {
      addIssue(
        hardErrors,
        "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
        `Reference ${candidate.id} was not known at the decision cutoff`,
      );
    }
    const frozen = byId.get(candidate.id);
    if (!frozen) {
      addIssue(
        hardErrors,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        `Reference ${candidate.id} is absent from the decision snapshot`,
      );
    } else if (canonicalSerialize(frozen) !== canonicalSerialize(candidate.reference)) {
      addIssue(
        hardErrors,
        "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
        `Reference ${candidate.id} differs from the frozen snapshot object`,
      );
    }
  }
}

function validateReferencePrices(
  plan: Omit<TradePlan, "complianceResult"> | TradePlan,
  hardErrors: TradePlanIssue[],
) {
  const tick = plan.venueRules.priceTick;
  const entryReference = plan.entryPlan.associatedReferenceLevel;
  if (
    entryReference &&
    Math.abs(plan.entryPlan.intendedPrice - entryReference.price) > tick + 1e-12
  ) {
    addIssue(
      hardErrors,
      "REFERENCE_PRICE_MISMATCH",
      "Entry price does not match its frozen reference level",
    );
  }

  const stopReference = plan.stopPlan.referenceLevel;
  if (stopReference && plan.stopPlan.derivationType !== "manual") {
    const base = plan.stopPlan.derivationType === "supportResistanceZoneBoundary"
      ? stopReference.rangeHigh ?? stopReference.price
      : stopReference.price;
    const { basisPoints, atrFraction, atrValue } = plan.stopPlan.buffer;
    let expected = base;
    if (basisPoints != null && atrFraction != null) {
      addIssue(
        hardErrors,
        "REFERENCE_PRICE_MISMATCH",
        "Stop buffer must use basis points or ATR, not both",
      );
    } else if (basisPoints != null) {
      expected = base * (1 + basisPoints / 10_000);
    } else if (atrFraction != null) {
      if (!validPositive(atrValue ?? 0)) {
        addIssue(
          hardErrors,
          "REFERENCE_PRICE_MISMATCH",
          "ATR stop buffers require the frozen ATR value",
        );
      } else {
        expected = base + atrFraction * (atrValue ?? 0);
      }
    }
    if (Math.abs(plan.stopPlan.stopPrice - expected) > tick + 1e-12) {
      addIssue(
        hardErrors,
        "REFERENCE_PRICE_MISMATCH",
        "Stop price does not match its frozen reference and recorded buffer",
      );
    }
  }

  for (const target of plan.targetPlans) {
    const reference = target.referenceLevel;
    if (!reference || target.derivationType === "manual" || target.derivationType === "fixedRMultiple") {
      continue;
    }
    const matches = target.derivationType === "supportZone"
      ? target.targetPrice >= (reference.rangeLow ?? reference.price) - tick &&
        target.targetPrice <= (reference.rangeHigh ?? reference.price) + tick
      : Math.abs(target.targetPrice - reference.price) <= tick + 1e-12;
    if (!matches) {
      addIssue(
        hardErrors,
        "REFERENCE_PRICE_MISMATCH",
        `Target ${target.id} does not match its frozen reference`,
      );
    }
  }
}

function selectLeverage(
  policy: LeveragePolicy,
  minimumRequired: number | null,
  step: number,
) {
  if (policy.mode === "manual") return validPositive(policy.leverage) ? policy.leverage : null;
  if (minimumRequired == null) return null;
  return Math.max(1, roundUpToStep(minimumRequired, step));
}

export function tradePlanId(
  plan: Omit<TradePlan, "id" | "complianceResult"> | Omit<TradePlan, "complianceResult"> | TradePlan,
) {
  const {
    id: _ignoredId,
    complianceResult: _ignoredCompliance,
    ...definition
  } = plan as TradePlan;
  return `trade-plan:${canonicalHash(definition).slice("fnv1a64:".length)}`;
}

function roundDownToStep(value: number, step: number) {
  if (!validPositive(value) || !validPositive(step)) return 0;
  const decimals = decimalPlaces(step);
  return Number((Math.floor(value / step + 1e-12) * step).toFixed(decimals));
}

function roundUpToStep(value: number, step: number) {
  if (!validPositive(value) || !validPositive(step)) return value;
  const decimals = decimalPlaces(step);
  return Number((Math.ceil(value / step - 1e-12) * step).toFixed(decimals));
}

function decimalPlaces(value: number) {
  const text = value.toString().toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
}

function isStepAligned(value: number, step: number) {
  if (!Number.isFinite(value) || !validPositive(step)) return false;
  const nearest = Math.round(value / step) * step;
  return Math.abs(value - nearest) <= Math.max(1e-12, step * 1e-9);
}

function sumNullable(values: Array<number | null>) {
  return values.some((value) => value == null)
    ? null
    : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function validPositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function issue(code: TradePlanRuleCode, message: string): TradePlanIssue {
  return { code, message };
}

function addIssue(
  issues: TradePlanIssue[],
  code: TradePlanRuleCode,
  message: string,
) {
  if (!issues.some((item) => item.code === code)) issues.push(issue(code, message));
}
