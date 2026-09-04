import { type ReplayCandleRecord, type ReplayEngineVersion } from "./replay";
import type { ReplayDecisionFrame, ReplaySession } from "./replaySession";
import { type StrategyProfile } from "./strategy";
import { SIZING_MODEL_VERSION, TRADE_PLAN_SCHEMA_VERSION, type TradePlan, type VenueRiskRules } from "./tradePlanning";
export declare const EXECUTION_ENGINE_VERSION: "execution-engine.1";
export declare const EXECUTION_PROFILE_SCHEMA_VERSION: "execution-profile.1";
export declare const EXECUTION_SESSION_SCHEMA_VERSION: "execution-session.1";
export declare const EXECUTION_ORDER_SCHEMA_VERSION: "execution-order.1";
export declare const EXECUTION_FILL_SCHEMA_VERSION: "execution-fill.1";
export declare const EXECUTION_EVENT_SCHEMA_VERSION: "execution-event.1";
export declare const EXECUTION_RESULT_SCHEMA_VERSION: "execution-result.1";
export declare const EXECUTION_DATA_BUNDLE_SCHEMA_VERSION: "execution-data-bundle.1";
export declare const EXECUTION_CANDLE_SCHEMA_VERSION: "execution-candle.1";
export declare const EXECUTION_TRADE_SCHEMA_VERSION: "execution-trade.1";
export declare const EXECUTION_QUOTE_SCHEMA_VERSION: "execution-quote.1";
export declare const EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION: "execution-path-resolution.1";
export declare const VENUE_EXECUTION_RULES_SCHEMA_VERSION: "venue-execution-rules.1";
export declare const VENUE_FEE_SCHEDULE_SCHEMA_VERSION: "venue-fee-schedule.1";
export declare const FUNDING_OBSERVATION_SCHEMA_VERSION: "funding-observation.1";
export declare const POSITION_LEDGER_SCHEMA_VERSION: "position-ledger.1";
export type ExecutionSessionState = "Created" | "PendingEntry" | "Open" | "PartiallyClosed" | "Closed" | "EntryExpired" | "OpenAtHorizon" | "Ambiguous" | "Failed";
export type ExecutionCloseReason = "Stop" | "AllTargets" | "StopAfterPartialTargets" | "ForcedHorizonClose" | "Liquidation";
export type ExecutionAmbiguityPolicy = "StrictAmbiguity" | "WorstCaseBranch";
export type RestingLimitFillPolicy = "TouchFills" | "PenetrationByTicks" | "ExactDataRequired";
export type ExecutionLiquidityRole = "maker" | "taker" | "assumedMaker" | "assumedTaker";
export type ExecutionOrderStatus = "pending" | "active" | "filled" | "cancelled" | "expired";
export type ExecutionOrderKind = "entryMarket" | "entryLimit" | "entryStopMarket" | "protectiveStop" | "target";
export type ActualNetPnlCompleteness = "complete" | "fundingIncomplete" | "ambiguous";
export interface ExecutionVersionedRef {
    id: string;
    version: string;
    hash: string;
}
export interface FixedBpsSlippage {
    model: "FixedBpsSlippage";
    version: "1";
    marketEntryBps: number;
    stopExitBps: number;
    marketExitBps: number;
}
export interface ExecutionProfileDefinition {
    id: string;
    version: string;
    schemaVersion: typeof EXECUTION_PROFILE_SCHEMA_VERSION;
    executionEngineVersion: typeof EXECUTION_ENGINE_VERSION;
    supportedInstrumentType: "linearQuotePerpetual";
    supportedPositionMode: "oneWaySinglePosition";
    supportedMarginMode: "isolatedResearch";
    orderActivationPolicy: {
        delaySeconds: number;
    };
    entryFillPolicy: {
        marketDataPreference: "orderedTradesThenCandles";
    };
    restingLimitFillPolicy: {
        policy: RestingLimitFillPolicy;
        penetrationTicks: number;
    };
    stopTriggerPolicy: {
        source: "last" | "mark" | "index";
        authorizedFallback: "last" | null;
    };
    targetFillPolicy: {
        policy: RestingLimitFillPolicy;
        penetrationTicks: number;
    };
    slippageModel: FixedBpsSlippage;
    feePolicy: {
        requirePointInTimeSchedule: true;
    };
    fundingPolicy: {
        absence: "markIncomplete" | "requireComplete";
    };
    pathResolutionPolicy: {
        candleTimeframesFinestFirst: string[];
    };
    maximumExecutionHorizon: number;
    forceCloseAtHorizon: boolean;
    ambiguityPolicy: ExecutionAmbiguityPolicy;
}
export interface ExecutionProfile extends ExecutionProfileDefinition {
    canonicalConfigHash: string;
}
export interface VenueFeeScheduleDefinition {
    id: string;
    version: string;
    schemaVersion: typeof VENUE_FEE_SCHEDULE_SCHEMA_VERSION;
    venue: string;
    instrumentType: "linearQuotePerpetual";
    effectiveFrom: number | null;
    effectiveUntil: number | null;
    makerRate: number;
    takerRate: number;
    provenance: string;
    assumptionStatus: "verifiedHistorical" | "researchAssumption" | "unknown";
}
export interface VenueFeeSchedule extends VenueFeeScheduleDefinition {
    canonicalConfigHash: string;
}
export interface FundingConvention {
    positiveRateMeaning: "longsPayShorts";
    sameTimestampOrdering: "positionBeforeFunding" | "fundingBeforePosition" | "ambiguous";
}
export interface VenueExecutionRulesDefinition {
    id: string;
    version: string;
    schemaVersion: typeof VENUE_EXECUTION_RULES_SCHEMA_VERSION;
    venue: string;
    symbol: string;
    instrumentType: "linearQuotePerpetual";
    effectiveFrom: number | null;
    effectiveUntil: number | null;
    priceTick: number;
    quantityStep: number;
    minimumQuantity: number;
    minimumNotional: number;
    maximumQuantity: number | null;
    maximumNotional: number | null;
    maximumLeverage: number;
    feeScheduleRef: ExecutionVersionedRef;
    stopTriggerSources: Array<"last" | "mark" | "index">;
    supportedOrderTypes: Array<"market" | "limit" | "stopMarket">;
    maintenanceMarginModel: {
        id: string;
        version: string;
        verifiedAt: number;
    } | null;
    liquidationModel: {
        id: string;
        version: string;
        verifiedAt: number;
    } | null;
    fundingConvention: FundingConvention;
    provenance: string;
    assumptionStatus: "verifiedHistorical" | "researchAssumption" | "unknown";
}
export interface VenueExecutionRules extends VenueExecutionRulesDefinition {
    canonicalConfigHash: string;
}
export interface ExecutionCandleObservation {
    schemaVersion: typeof EXECUTION_CANDLE_SCHEMA_VERSION;
    id: string;
    venue: string;
    symbol: string;
    timeframe: string;
    openTime: number;
    closeTime: number;
    knownAt: number;
    o: number;
    h: number;
    l: number;
    c: number;
    vBase: number | null;
    sourceObservationId: string | null;
}
export interface CreateExecutionCandleInput {
    venue: string;
    symbol: string;
    timeframe: string;
    openTime: number;
    knownAt?: number;
    o: number;
    h: number;
    l: number;
    c: number;
    vBase?: number | null;
    sourceObservationId?: string | null;
}
export interface FundingObservation {
    schemaVersion: typeof FUNDING_OBSERVATION_SCHEMA_VERSION;
    id: string;
    venue: string;
    symbol: string;
    fundingTime: number;
    knownAt: number;
    rate: number;
    rateConvention: "positiveLongsPayShorts";
    markPrice: number | null;
    markPriceSource: string | null;
    dataProvenance: string;
}
export interface CreateFundingObservationInput {
    venue: string;
    symbol: string;
    fundingTime: number;
    knownAt?: number;
    rate: number;
    rateConvention?: "positiveLongsPayShorts";
    markPrice?: number | null;
    markPriceSource?: string | null;
    dataProvenance: string;
}
export interface ExecutionTradeObservation {
    schemaVersion: typeof EXECUTION_TRADE_SCHEMA_VERSION;
    id: string;
    venue: string;
    symbol: string;
    eventTime: number;
    knownAt: number;
    price: number;
    quantity: number;
    side: "buy" | "sell";
}
export interface ExecutionQuoteObservation {
    schemaVersion: typeof EXECUTION_QUOTE_SCHEMA_VERSION;
    id: string;
    venue: string;
    symbol: string;
    eventTime: number;
    knownAt: number;
    bid: number;
    ask: number;
}
export interface CreateExecutionTradeInput {
    venue: string;
    symbol: string;
    eventTime: number;
    knownAt?: number;
    price: number;
    quantity: number;
    side: "buy" | "sell";
}
export interface CreateExecutionQuoteInput {
    venue: string;
    symbol: string;
    eventTime: number;
    knownAt?: number;
    bid: number;
    ask: number;
}
export interface ExecutionDataQuery {
    venue: string;
    symbol: string;
    from: number;
    to: number;
}
export interface ExecutionCandleQuery extends ExecutionDataQuery {
    timeframe: string;
}
export interface ReplayExecutionDataAdapter {
    readonly fundingDataAvailable?: boolean;
    readonly tradeDataCompleteness?: "complete" | "partial" | "unavailable";
    readonly quoteDataCompleteness?: "complete" | "partial" | "unavailable";
    getCoverage(query: ExecutionDataQuery): Promise<Record<string, {
        from: number;
        to: number;
        count: number;
    }>>;
    loadCandles(query: ExecutionCandleQuery): Promise<ExecutionCandleObservation[]>;
    loadTrades?(query: ExecutionDataQuery): Promise<ExecutionTradeObservation[]>;
    loadQuotes?(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadMarkPrices?(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadIndexPrices?(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadFundingObservations?(query: ExecutionDataQuery): Promise<FundingObservation[]>;
    loadVenueRuleEvidence?(query: ExecutionDataQuery): Promise<VenueExecutionRules[]>;
}
export interface InMemoryExecutionDataInput {
    candles: ExecutionCandleObservation[];
    funding?: FundingObservation[];
    fundingDataAvailable?: boolean;
    trades?: ExecutionTradeObservation[];
    tradeDataCompleteness?: "complete" | "partial" | "unavailable";
    quotes?: ExecutionQuoteObservation[];
    quoteDataCompleteness?: "complete" | "partial" | "unavailable";
    markPrices?: ExecutionQuoteObservation[];
    indexPrices?: ExecutionQuoteObservation[];
    venueRuleEvidence?: VenueExecutionRules[];
}
export interface ExecutionDataBundle {
    schemaVersion: typeof EXECUTION_DATA_BUNDLE_SCHEMA_VERSION;
    venue: string;
    symbol: string;
    from: number;
    to: number;
    candlesByTimeframe: Record<string, ExecutionCandleObservation[]>;
    trades: ExecutionTradeObservation[];
    tradeDataCompleteness: "complete" | "partial" | "unavailable";
    quotes: ExecutionQuoteObservation[];
    quoteDataCompleteness: "complete" | "partial" | "unavailable";
    markPrices: ExecutionQuoteObservation[];
    indexPrices: ExecutionQuoteObservation[];
    funding: FundingObservation[];
    fundingDataAvailable: boolean;
    venueRuleEvidence: VenueExecutionRules[];
    causalPrefixFingerprint: string;
    internalBundleFingerprint: string;
    fundingDataFingerprint: string | null;
    dataQualityNotes: string[];
}
export interface ExecutionLoadedCase {
    replaySession: ReplaySession;
    replayFrame: ReplayDecisionFrame;
    tradePlan: TradePlan;
    strategyProfile: StrategyProfile;
    executionProfile: ExecutionProfile;
    venueRules: VenueExecutionRules;
    feeSchedule: VenueFeeSchedule;
    dataBundle: ExecutionDataBundle;
}
export interface LoadExecutionCaseInput {
    replaySession: ReplaySession;
    replayFrame: ReplayDecisionFrame;
    tradePlan: TradePlan;
    strategyProfile: StrategyProfile;
    executionProfile: ExecutionProfile;
    venueRules: VenueExecutionRules;
    feeSchedule: VenueFeeSchedule;
    historicalDataAdapter: ReplayExecutionDataAdapter;
}
export declare class InMemoryReplayExecutionDataAdapter implements ReplayExecutionDataAdapter {
    #private;
    readonly fundingDataAvailable: boolean;
    readonly tradeDataCompleteness: "complete" | "partial" | "unavailable";
    readonly quoteDataCompleteness: "complete" | "partial" | "unavailable";
    constructor(input: InMemoryExecutionDataInput);
    getCoverage(query: ExecutionDataQuery): Promise<{
        [k: string]: {
            from: number;
            to: number;
            count: number;
        };
    }>;
    loadCandles(query: ExecutionCandleQuery): Promise<ExecutionCandleObservation[]>;
    loadTrades(query: ExecutionDataQuery): Promise<ExecutionTradeObservation[]>;
    loadQuotes(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadMarkPrices(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadIndexPrices(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadFundingObservations(query: ExecutionDataQuery): Promise<FundingObservation[]>;
    loadVenueRuleEvidence(query: ExecutionDataQuery): Promise<VenueExecutionRules[]>;
}
export declare function executionProfileHash(profile: ExecutionProfileDefinition | ExecutionProfile): string;
export declare function createExecutionProfile(definition: ExecutionProfileDefinition): ExecutionProfile;
export declare function createExperimentalExecutionProfile(candleTimeframesFinestFirst: string[]): ExecutionProfile;
export declare function feeScheduleHash(schedule: VenueFeeScheduleDefinition | VenueFeeSchedule): string;
export declare function createVenueFeeSchedule(definition: VenueFeeScheduleDefinition): VenueFeeSchedule;
export declare function venueExecutionRulesHash(rules: VenueExecutionRulesDefinition | VenueExecutionRules): string;
export declare function createVenueExecutionRules(definition: VenueExecutionRulesDefinition, feeSchedule: VenueFeeSchedule): VenueExecutionRules;
export declare function createResearchVenueExecutionRules(legacy: VenueRiskRules, feeSchedule: VenueFeeSchedule, decisionTime: number): VenueExecutionRules;
export declare function createExecutionCandleObservation(input: CreateExecutionCandleInput): ExecutionCandleObservation;
export declare function executionCandleFromReplay(candle: ReplayCandleRecord, venue?: string): ExecutionCandleObservation;
export declare function createExecutionTradeObservation(input: CreateExecutionTradeInput): ExecutionTradeObservation;
export declare function createExecutionQuoteObservation(input: CreateExecutionQuoteInput): ExecutionQuoteObservation;
export declare function createFundingObservation(input: CreateFundingObservationInput): FundingObservation;
export interface ExecutionOrder {
    schemaVersion: typeof EXECUTION_ORDER_SCHEMA_VERSION;
    id: string;
    kind: ExecutionOrderKind;
    side: "sell" | "buy";
    quantity: number;
    remainingQuantity: number;
    limitPrice: number | null;
    triggerPrice: number | null;
    activationTime: number;
    status: ExecutionOrderStatus;
    reduceOnly: boolean;
    parentTargetId: string | null;
    liquidityAssumption: ExecutionLiquidityRole;
}
export interface ExecutionSlippageRecord {
    model: FixedBpsSlippage["model"];
    version: FixedBpsSlippage["version"];
    bps: number;
    referencePrice: number;
    signedPriceAdjustment: number;
    finalFillPrice: number;
}
export interface ExecutionFill {
    schemaVersion: typeof EXECUTION_FILL_SCHEMA_VERSION;
    id: string;
    orderId: string;
    eventTime: number;
    processingAsOf: number;
    side: "sell" | "buy";
    quantity: number;
    referencePrice: number;
    price: number;
    slippage: ExecutionSlippageRecord | null;
    liquidityRole: ExecutionLiquidityRole;
    feeRate: number;
    feeAmount: number;
    feeCurrency: string;
    feeScheduleRef: ExecutionVersionedRef;
    sourceObservationIds: string[];
    dataQualityNotes: string[];
}
export interface ExecutionFundingRecord {
    id: string;
    observationId: string;
    fundingTime: number;
    processingAsOf: number;
    positionQuantity: number;
    referencePrice: number;
    rate: number;
    amount: number;
    quoteCurrency: string;
}
export interface ExecutionAmbiguityBranch {
    id: string;
    label: string;
    orderedOrderIds: string[];
    estimatedNetPnl: number | null;
}
export interface ExecutionAmbiguity {
    code: string;
    intervalStart: number;
    intervalEnd: number;
    orderIds: string[];
    sourceObservationIds: string[];
    branches: ExecutionAmbiguityBranch[];
    lowerNetPnlBound: number | null;
    upperNetPnlBound: number | null;
    explanation: string;
}
export interface ExecutionPathResolution {
    schemaVersion: typeof EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION;
    id: string;
    intervalStart: number;
    intervalEnd: number;
    requestedResolution: string;
    selectedResolution: string;
    dataSource: "candles" | "trades" | "quotes";
    dataFingerprint: string;
    exactOrApproximate: "exact" | "approximate";
    sourceObservationIds: string[];
    ambiguities: string[];
}
export interface PositionLedger {
    schemaVersion: typeof POSITION_LEDGER_SCHEMA_VERSION;
    originalFilledQuantity: number;
    remainingQuantity: number;
    averageEntryPrice: number | null;
    averageExitPrice: number | null;
    initialNotional: number;
    initialMargin: number;
    maximumMarginUsed: number;
    realizedGrossPnl: number;
    unrealizedGrossPnl: number;
    entryFees: number;
    exitFees: number;
    totalFees: number;
    fundingReceived: number;
    fundingPaid: number;
    netFunding: number;
    realizedNetPnl: number;
    unrealizedNetPnlExcludingUnknownFutureCosts: number;
    accountEquityBefore: number;
    accountEquityAfter: number | null;
    remainingProtectiveStopQuantity: number;
    openTargetQuantities: Record<string, number>;
    selectedLeverage: number;
    marginAllocation: number;
    maximumAdverseUnrealizedLoss: number;
    bankruptcyBoundApprox: number | null;
    liquidationEvaluation: "Unavailable" | "VerifiedModelNotImplemented";
}
export interface ExecutionExcursionObservation {
    sourceObservationId: string;
    eventTime: number;
    processingAsOf: number;
    resolution: string;
    high: number;
    low: number;
}
export type ExecutionEventType = "ExecutionCreated" | "EntryOrderActivated" | "EntryOrderExpired" | "EntryOrderFilled" | "ProtectiveStopActivated" | "TargetActivated" | "TargetFilled" | "ProtectiveStopQuantityAdjusted" | "ProtectiveStopTriggered" | "ProtectiveStopFilled" | "OrderCancelled" | "FundingApplied" | "PositionPartiallyClosed" | "PositionClosed" | "ExecutionHorizonReached" | "ForcedHorizonClose" | "AmbiguityDetected" | "BankruptcyBoundCrossed" | "ExecutionFailed" | "PathResolved";
export interface ExecutionEvent {
    schemaVersion: typeof EXECUTION_EVENT_SCHEMA_VERSION;
    id: string;
    executionSessionId: string;
    sequence: number;
    type: ExecutionEventType;
    eventTime: number;
    processingAsOf: number;
    stateBefore: ExecutionSessionState;
    stateAfter: ExecutionSessionState;
    orderIds: string[];
    fillIds: string[];
    quantity: number | null;
    referencePrice: number | null;
    actualPrice: number | null;
    feeAmount: number | null;
    fundingAmount: number | null;
    sourceObservationIds: string[];
    explanation: string;
    dataQualityNotes: string[];
    ordersAfter: ExecutionOrder[];
    fillsAfter: ExecutionFill[];
    positionLedgerAfter: PositionLedger;
    pathResolutionRecordsAfter: ExecutionPathResolution[];
    fundingRecordsAfter: ExecutionFundingRecord[];
    excursionObservationsAfter: ExecutionExcursionObservation[];
    resultAfter: ExecutionResult | null;
    sessionDataQualityNotesAfter: string[];
    errorsAfter: string[];
}
export interface ExecutionExitSummary {
    fillId: string;
    kind: "target" | "stop" | "forcedHorizonClose";
    targetId: string | null;
    quantity: number;
    price: number;
    eventTime: number;
    grossPnl: number;
    fee: number;
}
export interface ExecutionResult {
    schemaVersion: typeof EXECUTION_RESULT_SCHEMA_VERSION;
    id: string;
    executionSessionId: string;
    replaySessionId: string;
    replayFrameId: string;
    decisionSnapshotId: string;
    tradePlanId: string;
    tradePlanSchemaVersion: typeof TRADE_PLAN_SCHEMA_VERSION;
    strategyProfileRef: ExecutionVersionedRef;
    lifecycleVersion: string;
    lifecycleConfigHash: string;
    sizingModelVersion: typeof SIZING_MODEL_VERSION;
    replayEngineVersion: ReplayEngineVersion;
    executionProfileRef: ExecutionVersionedRef;
    venueRulesRef: ExecutionVersionedRef;
    feeScheduleRef: ExecutionVersionedRef;
    marketDataBundleFingerprint: string;
    usedMarketDataFingerprint: string;
    pathResolutionRecords: ExecutionPathResolution[];
    fundingDataFingerprint: string | null;
    status: Extract<ExecutionSessionState, "Closed" | "EntryExpired" | "OpenAtHorizon" | "Ambiguous" | "Failed">;
    closeReason: ExecutionCloseReason | null;
    entrySummary: ExecutionFill | null;
    exitSummary: ExecutionExitSummary[];
    targetSummary: ExecutionExitSummary[];
    stopSummary: ExecutionExitSummary | null;
    fundingSummary: {
        received: number;
        paid: number;
        net: number;
        records: number;
    };
    feeSummary: {
        entry: number;
        exit: number;
        total: number;
        currency: string;
    };
    plannedRiskBudget: number | null;
    projectedLossAtStop: number | null;
    actualRealizedLossOrProfit: number;
    actualNetPnl: number | null;
    netPnlExcludingUnknownFunding: number;
    actualNetPnlCompleteness: ActualNetPnlCompleteness;
    budgetR: number | null;
    plannedRiskR: number | null;
    grossR: number | null;
    netR: number | null;
    maximumAdverseExcursion: number | null;
    maximumFavorableExcursion: number | null;
    maePrice: number | null;
    mfePrice: number | null;
    maeTime: number | null;
    mfeTime: number | null;
    excursionResolution: string | null;
    holdingDuration: number | null;
    timeToFirstTarget: number | null;
    timeToStop: number | null;
    timeToFullExit: number | null;
    initialNotional: number;
    averageEntry: number | null;
    averageExit: number | null;
    maximumMarginUsed: number;
    entrySlippage: ExecutionSlippageRecord | null;
    stopSlippage: ExecutionSlippageRecord | null;
    actualVsProjectedStopLoss: number | null;
    ambiguity: ExecutionAmbiguity | null;
    dataQualityNotes: string[];
    executionModelVersion: typeof EXECUTION_ENGINE_VERSION;
}
export interface ExecutionSessionIdentity {
    id: string;
    schemaVersion: typeof EXECUTION_SESSION_SCHEMA_VERSION;
    replaySessionId: string;
    replayFrameId: string;
    decisionSnapshotId: string;
    tradePlanId: string;
    tradePlanSchemaVersion: typeof TRADE_PLAN_SCHEMA_VERSION;
    strategyProfileRef: ExecutionVersionedRef;
    lifecycleVersion: string;
    lifecycleConfigHash: string;
    sizingModelVersion: typeof SIZING_MODEL_VERSION;
    replayEngineVersion: ReplayEngineVersion;
    executionEngineVersion: typeof EXECUTION_ENGINE_VERSION;
    executionProfileRef: ExecutionVersionedRef;
    venueRulesRef: ExecutionVersionedRef;
    feeScheduleRef: ExecutionVersionedRef;
    marketDataBundleFingerprint: string;
    fundingDataFingerprint: string | null;
    decisionTime: number;
    orderActivationTime: number;
    executionHorizonTime: number;
}
export interface ExecutionSession extends ExecutionSessionIdentity {
    revision: number;
    currentAsOf: number;
    state: ExecutionSessionState;
    stateSince: number;
    orders: ExecutionOrder[];
    fills: ExecutionFill[];
    positionLedger: PositionLedger;
    executionEvents: ExecutionEvent[];
    pathResolutionRecords: ExecutionPathResolution[];
    fundingRecords: ExecutionFundingRecord[];
    excursionObservations: ExecutionExcursionObservation[];
    result: ExecutionResult | null;
    dataQualityNotes: string[];
    errors: string[];
    integrityHash: string;
}
export declare function loadExecutionCase(input: LoadExecutionCaseInput): Promise<ExecutionLoadedCase>;
