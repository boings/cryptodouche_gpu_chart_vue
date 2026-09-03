import { IMPULSE_FADE_LIFECYCLE_VERSION, IMPULSE_FADE_SETUP_FAMILY } from "./indicators";
import { type DecisionReferenceLevel, type DecisionSnapshot, type EntryOrderPlanType, type StopDerivationType, type StrategyExecutionAssumptions, type StrategyProfile, type StrategySide, type TargetDerivationType } from "./strategy";
export declare const SIZING_MODEL_VERSION: "linear-quote-perpetual-risk.1";
export declare const SIZING_RESULT_SCHEMA_VERSION: "sizing-result.1";
export declare const TRADE_PLAN_SCHEMA_VERSION: "trade-plan.1";
export declare const DECISION_RECORD_SCHEMA_VERSION: "decision-record.1";
export type TradePlanStatus = "draft" | "finalized";
export type ComplianceClassification = "Compliant" | "Overridden" | "OutOfStrategy" | "InvalidPlan";
export type TradePlanRuleCode = "NO_ACTIVE_CANDIDATE" | "ENTRY_BEFORE_ENTRY_CANDIDATE" | "ENTRY_BEFORE_STRUCTURE_BREAK" | "ENTRY_BEFORE_RETEST" | "RETEST_TOO_OLD" | "STOP_NOT_ABOVE_ENTRY" | "STOP_INSIDE_INVALIDATION_LEVEL" | "NO_VALID_TARGET" | "TARGET_FRACTIONS_INVALID" | "REWARD_RISK_BELOW_MINIMUM" | "RISK_ABOVE_PROFILE_LIMIT" | "MARGIN_ALLOCATION_EXCEEDED" | "MAX_LEVERAGE_EXCEEDED" | "AVAILABLE_BALANCE_EXCEEDED" | "MINIMUM_QUANTITY_NOT_MET" | "MINIMUM_NOTIONAL_NOT_MET" | "MAXIMUM_NOTIONAL_EXCEEDED" | "DATA_QUALITY_INSUFFICIENT" | "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME" | "REFERENCE_LEVEL_NOT_IN_SNAPSHOT" | "REFERENCE_LEVEL_SNAPSHOT_MISMATCH" | "STRATEGY_PROFILE_VERSION_MISMATCH" | "ENTRY_ORDER_TYPE_NOT_PERMITTED" | "STOP_DERIVATION_NOT_PERMITTED" | "TARGET_DERIVATION_NOT_PERMITTED" | "TOO_MANY_TARGETS" | "RISK_REQUEST_INVALID" | "INVALID_NUMERIC_INPUT" | "UNSUPPORTED_SIDE" | "OVERRIDE_REASON_REQUIRED" | "EXACT_LIQUIDATION_MODEL_UNAVAILABLE" | "SERIALIZED_INTEGRITY_MISMATCH" | "INSTRUMENT_IDENTITY_MISMATCH" | "PRICE_TICK_MISMATCH" | "LEVERAGE_STEP_MISMATCH" | "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE" | "REFERENCE_PRICE_MISMATCH";
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
export type LeveragePolicy = {
    mode: "manual";
    leverage: number;
} | {
    mode: "derivedMinimum";
};
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
export type SkipReasonCode = "insufficientExtension" | "poorLiquidity" | "noExecutionVenueListing" | "higherTimeframeContinuationTooStrong" | "noViableStop" | "insufficientRewardRisk" | "eventTooMature" | "dataQualityInsufficient" | "discretionaryRejection" | "other";
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
export declare function calculateLinearPerpetualSizing(input: LinearPerpetualSizingInput): SizingResult;
export declare function createTradePlan(input: CreateTradePlanInput): TradePlan;
export declare function evaluateTradePlanCompliance(input: {
    strategyProfile: StrategyProfile;
    snapshot: DecisionSnapshot;
    plan: Omit<TradePlan, "complianceResult"> | TradePlan;
}): ComplianceResult;
export declare function createDecisionRecord(input: CreateDecisionRecordInput): DecisionRecord;
export declare function tradePlanId(plan: Omit<TradePlan, "id" | "complianceResult"> | Omit<TradePlan, "complianceResult"> | TradePlan): string;
