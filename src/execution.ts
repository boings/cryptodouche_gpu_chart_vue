import { strictTimeframeToSeconds } from "./data";
import {
  REPLAY_ENGINE_VERSION,
  replaySha256,
  type ReplayCandleRecord,
  type ReplayEngineVersion,
} from "./replay";
import type { ReplayDecisionFrame, ReplaySession } from "./replaySession";
import {
  canonicalHash,
  canonicalSerialize,
  immutableJsonClone,
  type JsonValue,
} from "./serialization";
import {
  decisionSnapshotId,
  strategyProfileHash,
  type StrategyProfile,
} from "./strategy";
import {
  SIZING_MODEL_VERSION,
  TRADE_PLAN_SCHEMA_VERSION,
  tradePlanId,
  type TradePlan,
  type VenueRiskRules,
} from "./tradePlanning";

export const EXECUTION_ENGINE_VERSION = "execution-engine.1" as const;
export const EXECUTION_PROFILE_SCHEMA_VERSION = "execution-profile.1" as const;
export const EXECUTION_SESSION_SCHEMA_VERSION = "execution-session.1" as const;
export const EXECUTION_ORDER_SCHEMA_VERSION = "execution-order.1" as const;
export const EXECUTION_FILL_SCHEMA_VERSION = "execution-fill.1" as const;
export const EXECUTION_EVENT_SCHEMA_VERSION = "execution-event.1" as const;
export const EXECUTION_RESULT_SCHEMA_VERSION = "execution-result.1" as const;
export const EXECUTION_DATA_BUNDLE_SCHEMA_VERSION = "execution-data-bundle.1" as const;
export const EXECUTION_CANDLE_SCHEMA_VERSION = "execution-candle.1" as const;
export const EXECUTION_TRADE_SCHEMA_VERSION = "execution-trade.1" as const;
export const EXECUTION_QUOTE_SCHEMA_VERSION = "execution-quote.1" as const;
export const EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION = "execution-path-resolution.1" as const;
export const VENUE_EXECUTION_RULES_SCHEMA_VERSION = "venue-execution-rules.1" as const;
export const VENUE_FEE_SCHEDULE_SCHEMA_VERSION = "venue-fee-schedule.1" as const;
export const FUNDING_OBSERVATION_SCHEMA_VERSION = "funding-observation.1" as const;
export const POSITION_LEDGER_SCHEMA_VERSION = "position-ledger.1" as const;

export type ExecutionSessionState =
  | "Created"
  | "PendingEntry"
  | "Open"
  | "PartiallyClosed"
  | "Closed"
  | "EntryExpired"
  | "OpenAtHorizon"
  | "Ambiguous"
  | "Failed";

export type ExecutionCloseReason =
  | "Stop"
  | "AllTargets"
  | "StopAfterPartialTargets"
  | "ForcedHorizonClose"
  | "Liquidation";

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
  orderActivationPolicy: { delaySeconds: number };
  entryFillPolicy: { marketDataPreference: "orderedTradesThenCandles" };
  restingLimitFillPolicy: {
    policy: RestingLimitFillPolicy;
    penetrationTicks: number;
  };
  stopTriggerPolicy: {
    source: "last" | "mark" | "index";
    authorizedFallback: "last" | null;
  };
  targetFillPolicy: { policy: RestingLimitFillPolicy; penetrationTicks: number };
  slippageModel: FixedBpsSlippage;
  feePolicy: { requirePointInTimeSchedule: true };
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
  maintenanceMarginModel: { id: string; version: string; verifiedAt: number } | null;
  liquidationModel: { id: string; version: string; verifiedAt: number } | null;
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
  getCoverage(query: ExecutionDataQuery): Promise<Record<string, { from: number; to: number; count: number }>>;
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

export class InMemoryReplayExecutionDataAdapter implements ReplayExecutionDataAdapter {
  readonly #input: InMemoryExecutionDataInput;
  readonly fundingDataAvailable: boolean;
  readonly tradeDataCompleteness: "complete" | "partial" | "unavailable";
  readonly quoteDataCompleteness: "complete" | "partial" | "unavailable";

  constructor(input: InMemoryExecutionDataInput) {
    this.fundingDataAvailable = input.fundingDataAvailable ?? input.funding !== undefined;
    this.tradeDataCompleteness = input.tradeDataCompleteness ?? (input.trades ? "partial" : "unavailable");
    this.quoteDataCompleteness = input.quoteDataCompleteness ?? (input.quotes ? "partial" : "unavailable");
    this.#input = immutableJsonClone({
      ...input,
      funding: input.funding ?? [],
      fundingDataAvailable: input.fundingDataAvailable ?? input.funding !== undefined,
      trades: input.trades ?? [],
      tradeDataCompleteness: input.tradeDataCompleteness ?? (input.trades ? "partial" : "unavailable"),
      quotes: input.quotes ?? [],
      quoteDataCompleteness: input.quoteDataCompleteness ?? (input.quotes ? "partial" : "unavailable"),
      markPrices: input.markPrices ?? [],
      indexPrices: input.indexPrices ?? [],
      venueRuleEvidence: input.venueRuleEvidence ?? [],
    });
  }

  async getCoverage(query: ExecutionDataQuery) {
    const grouped = new Map<string, ExecutionCandleObservation[]>();
    for (const candle of this.#input.candles.filter((item) => sameExecutionInstrument(item, query))) {
      const list = grouped.get(candle.timeframe) ?? [];
      list.push(candle);
      grouped.set(candle.timeframe, list);
    }
    return immutableJsonClone(Object.fromEntries([...grouped].map(([timeframe, candles]) => [
      timeframe,
      {
        from: Math.min(...candles.map((item) => item.openTime)),
        to: Math.max(...candles.map((item) => item.closeTime)),
        count: candles.length,
      },
    ])));
  }

  async loadCandles(query: ExecutionCandleQuery) {
    return immutableJsonClone(this.#input.candles.filter(
      (item) =>
        sameExecutionInstrument(item, query) &&
        item.timeframe === query.timeframe &&
        item.openTime >= query.from &&
        item.openTime <= query.to,
    ).sort(compareExecutionObservations));
  }

  async loadTrades(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.trades ?? []).filter(
      (item) => sameExecutionInstrument(item, query) && inExecutionRange(item.eventTime, query),
    ).sort(compareTimedObservations));
  }

  async loadQuotes(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.quotes ?? []).filter(
      (item) => sameExecutionInstrument(item, query) && inExecutionRange(item.eventTime, query),
    ).sort(compareTimedObservations));
  }

  async loadMarkPrices(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.markPrices ?? []).filter(
      (item) => sameExecutionInstrument(item, query) && inExecutionRange(item.eventTime, query),
    ).sort(compareTimedObservations));
  }

  async loadIndexPrices(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.indexPrices ?? []).filter(
      (item) => sameExecutionInstrument(item, query) && inExecutionRange(item.eventTime, query),
    ).sort(compareTimedObservations));
  }

  async loadFundingObservations(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.funding ?? []).filter(
      (item) => sameExecutionInstrument(item, query) && inExecutionRange(item.fundingTime, query),
    ).sort((left, right) => left.fundingTime - right.fundingTime || left.id.localeCompare(right.id)));
  }

  async loadVenueRuleEvidence(query: ExecutionDataQuery) {
    return immutableJsonClone((this.#input.venueRuleEvidence ?? []).filter(
      (item) => sameExecutionInstrument(item, query),
    ));
  }
}

export function executionProfileHash(
  profile: ExecutionProfileDefinition | ExecutionProfile,
) {
  const { canonicalConfigHash: _ignored, ...definition } = profile as ExecutionProfile;
  return canonicalHash(definition);
}

export function createExecutionProfile(definition: ExecutionProfileDefinition): ExecutionProfile {
  if (
    definition.schemaVersion !== EXECUTION_PROFILE_SCHEMA_VERSION ||
    definition.executionEngineVersion !== EXECUTION_ENGINE_VERSION
  ) throw new Error("Unsupported execution profile schema or engine version");
  if (!definition.id.trim() || !definition.version.trim()) {
    throw new TypeError("Execution profile id and version are required");
  }
  if (definition.ambiguityPolicy !== "StrictAmbiguity") {
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  }
  validateNonnegativeInteger(definition.orderActivationPolicy.delaySeconds, "activation delay");
  validatePositiveInteger(definition.maximumExecutionHorizon, "execution horizon");
  validateNonnegativeInteger(
    definition.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks",
  );
  validateNonnegativeInteger(
    definition.targetFillPolicy.penetrationTicks,
    "target penetration ticks",
  );
  for (const value of [
    definition.slippageModel.marketEntryBps,
    definition.slippageModel.stopExitBps,
    definition.slippageModel.marketExitBps,
  ]) if (!Number.isFinite(value) || value < 0) throw new RangeError("Slippage bps must be non-negative");
  const timeframes = [...new Set(definition.pathResolutionPolicy.candleTimeframesFinestFirst)];
  timeframes.forEach(strictTimeframeToSeconds);
  if (!timeframes.length) throw new RangeError("Execution profile requires candle resolution timeframes");
  const normalized = immutableJsonClone({
    ...definition,
    pathResolutionPolicy: { candleTimeframesFinestFirst: timeframes },
  });
  return immutableJsonClone({ ...normalized, canonicalConfigHash: executionProfileHash(normalized) });
}

export function createExperimentalExecutionProfile(
  candleTimeframesFinestFirst: string[],
): ExecutionProfile {
  return createExecutionProfile({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: EXECUTION_PROFILE_SCHEMA_VERSION,
    executionEngineVersion: EXECUTION_ENGINE_VERSION,
    supportedInstrumentType: "linearQuotePerpetual",
    supportedPositionMode: "oneWaySinglePosition",
    supportedMarginMode: "isolatedResearch",
    orderActivationPolicy: { delaySeconds: 0 },
    entryFillPolicy: { marketDataPreference: "orderedTradesThenCandles" },
    restingLimitFillPolicy: { policy: "TouchFills", penetrationTicks: 1 },
    stopTriggerPolicy: { source: "last", authorizedFallback: null },
    targetFillPolicy: { policy: "TouchFills", penetrationTicks: 1 },
    slippageModel: {
      model: "FixedBpsSlippage",
      version: "1",
      marketEntryBps: 5,
      stopExitBps: 10,
      marketExitBps: 10,
    },
    feePolicy: { requirePointInTimeSchedule: true },
    fundingPolicy: { absence: "markIncomplete" },
    pathResolutionPolicy: { candleTimeframesFinestFirst },
    maximumExecutionHorizon: 72 * 3_600,
    forceCloseAtHorizon: false,
    ambiguityPolicy: "StrictAmbiguity",
  });
}

export function feeScheduleHash(
  schedule: VenueFeeScheduleDefinition | VenueFeeSchedule,
) {
  const { canonicalConfigHash: _ignored, ...definition } = schedule as VenueFeeSchedule;
  return canonicalHash(definition);
}

export function createVenueFeeSchedule(
  definition: VenueFeeScheduleDefinition,
): VenueFeeSchedule {
  if (definition.schemaVersion !== VENUE_FEE_SCHEDULE_SCHEMA_VERSION) {
    throw new Error("Unsupported venue fee schedule schema");
  }
  validateEffectiveWindow(definition.effectiveFrom, definition.effectiveUntil, "fee schedule");
  if (
    !Number.isFinite(definition.makerRate) ||
    definition.makerRate < 0 ||
    !Number.isFinite(definition.takerRate) ||
    definition.takerRate < 0
  ) throw new RangeError("Fee rates must be non-negative finite values");
  if (!definition.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return immutableJsonClone({
    ...definition,
    canonicalConfigHash: feeScheduleHash(definition),
  });
}

export function venueExecutionRulesHash(
  rules: VenueExecutionRulesDefinition | VenueExecutionRules,
) {
  const { canonicalConfigHash: _ignored, ...definition } = rules as VenueExecutionRules;
  return canonicalHash(definition);
}

export function createVenueExecutionRules(
  definition: VenueExecutionRulesDefinition,
  feeSchedule: VenueFeeSchedule,
): VenueExecutionRules {
  if (definition.schemaVersion !== VENUE_EXECUTION_RULES_SCHEMA_VERSION) {
    throw new Error("Unsupported venue execution rules schema");
  }
  validateEffectiveWindow(definition.effectiveFrom, definition.effectiveUntil, "venue rules");
  for (const value of [
    definition.priceTick,
    definition.quantityStep,
    definition.minimumQuantity,
    definition.minimumNotional,
    definition.maximumLeverage,
  ]) if (!Number.isFinite(value) || value <= 0) throw new RangeError("Venue execution limits must be positive");
  for (const [value, label] of [
    [definition.maximumQuantity, "maximumQuantity"],
    [definition.maximumNotional, "maximumNotional"],
  ] as const) {
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      throw new RangeError(`${label} must be null or positive`);
    }
  }
  if (
    definition.feeScheduleRef.id !== feeSchedule.id ||
    definition.feeScheduleRef.version !== feeSchedule.version ||
    definition.feeScheduleRef.hash !== feeSchedule.canonicalConfigHash
  ) throw new Error("Venue execution rules fee schedule reference mismatch");
  if (!definition.stopTriggerSources.length || !definition.supportedOrderTypes.length) {
    throw new RangeError("Venue execution rules require trigger sources and order types");
  }
  if (!definition.provenance.trim()) throw new TypeError("Venue rules provenance is required");
  return immutableJsonClone({
    ...definition,
    symbol: definition.symbol.toUpperCase(),
    canonicalConfigHash: venueExecutionRulesHash({
      ...definition,
      symbol: definition.symbol.toUpperCase(),
    }),
  });
}

export function createResearchVenueExecutionRules(
  legacy: VenueRiskRules,
  feeSchedule: VenueFeeSchedule,
  decisionTime: number,
): VenueExecutionRules {
  return createVenueExecutionRules({
    id: `${legacy.venue}:${legacy.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: VENUE_EXECUTION_RULES_SCHEMA_VERSION,
    venue: legacy.venue,
    symbol: legacy.symbol,
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: decisionTime,
    effectiveUntil: null,
    priceTick: legacy.priceTick,
    quantityStep: legacy.quantityStep,
    minimumQuantity: legacy.minQuantity,
    minimumNotional: legacy.minNotional,
    maximumQuantity: null,
    maximumNotional: null,
    maximumLeverage: legacy.maxLeverage,
    feeScheduleRef: versionedRef(feeSchedule),
    stopTriggerSources: ["last"],
    supportedOrderTypes: ["market", "limit", "stopMarket"],
    maintenanceMarginModel: legacy.maintenanceMarginModel
      ? {
          id: legacy.maintenanceMarginModel.modelId,
          version: legacy.maintenanceMarginModel.version,
          verifiedAt: legacy.maintenanceMarginModel.verifiedAt,
        }
      : null,
    liquidationModel: legacy.liquidationModel
      ? {
          id: legacy.liquidationModel.modelId,
          version: legacy.liquidationModel.version,
          verifiedAt: legacy.liquidationModel.verifiedAt,
        }
      : null,
    fundingConvention: {
      positiveRateMeaning: "longsPayShorts",
      sameTimestampOrdering: "ambiguous",
    },
    provenance: "Research adaptation of frozen TradePlan VenueRiskRules",
    assumptionStatus: "researchAssumption",
  }, feeSchedule);
}

export function createExecutionCandleObservation(
  input: CreateExecutionCandleInput,
): ExecutionCandleObservation {
  const seconds = strictTimeframeToSeconds(input.timeframe);
  if (!Number.isInteger(input.openTime) || input.openTime < 0 || input.openTime % seconds !== 0) {
    throw new RangeError("Execution candle openTime must align to its timeframe");
  }
  for (const value of [input.o, input.h, input.l, input.c]) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError("Execution OHLC must be positive");
  }
  if (input.h < Math.max(input.o, input.c) || input.l > Math.min(input.o, input.c)) {
    throw new RangeError("Execution candle high/low do not contain open and close");
  }
  const definition = {
    schemaVersion: EXECUTION_CANDLE_SCHEMA_VERSION,
    venue: input.venue,
    symbol: input.symbol.toUpperCase(),
    timeframe: input.timeframe,
    openTime: input.openTime,
    closeTime: input.openTime + seconds,
    knownAt: input.knownAt ?? input.openTime + seconds,
    o: input.o,
    h: input.h,
    l: input.l,
    c: input.c,
    vBase: input.vBase ?? null,
    sourceObservationId: input.sourceObservationId ?? null,
  };
  if (definition.knownAt < definition.closeTime) {
    throw new RangeError("Execution candle knownAt cannot precede closeTime");
  }
  return immutableJsonClone({
    ...definition,
    id: `execution-candle:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

export function executionCandleFromReplay(
  candle: ReplayCandleRecord,
  venue = candle.source,
): ExecutionCandleObservation {
  return createExecutionCandleObservation({
    venue,
    symbol: candle.symbol,
    timeframe: candle.timeframe,
    openTime: candle.openTime,
    knownAt: candle.knownAt,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    vBase: candle.vBase,
    sourceObservationId: candle.observationId,
  });
}

export function createExecutionTradeObservation(
  input: CreateExecutionTradeInput,
): ExecutionTradeObservation {
  assertTimestamp(input.eventTime, "trade eventTime");
  const knownAt = input.knownAt ?? input.eventTime;
  assertTimestamp(knownAt, "trade knownAt");
  if (knownAt < input.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(input.price) || input.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const definition = {
    schemaVersion: EXECUTION_TRADE_SCHEMA_VERSION,
    venue: input.venue,
    symbol: input.symbol.toUpperCase(),
    eventTime: input.eventTime,
    knownAt,
    price: input.price,
    quantity: input.quantity,
    side: input.side,
  };
  return immutableJsonClone({
    ...definition,
    id: `execution-trade:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

export function createExecutionQuoteObservation(
  input: CreateExecutionQuoteInput,
): ExecutionQuoteObservation {
  assertTimestamp(input.eventTime, "quote eventTime");
  const knownAt = input.knownAt ?? input.eventTime;
  assertTimestamp(knownAt, "quote knownAt");
  if (knownAt < input.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (
    !Number.isFinite(input.bid) ||
    !Number.isFinite(input.ask) ||
    input.bid <= 0 ||
    input.ask <= 0 ||
    input.bid > input.ask
  ) throw new RangeError("Quote requires positive bid <= ask");
  const definition = {
    schemaVersion: EXECUTION_QUOTE_SCHEMA_VERSION,
    venue: input.venue,
    symbol: input.symbol.toUpperCase(),
    eventTime: input.eventTime,
    knownAt,
    bid: input.bid,
    ask: input.ask,
  };
  return immutableJsonClone({
    ...definition,
    id: `execution-quote:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

export function createFundingObservation(
  input: CreateFundingObservationInput,
): FundingObservation {
  assertTimestamp(input.fundingTime, "fundingTime");
  const knownAt = input.knownAt ?? input.fundingTime;
  assertTimestamp(knownAt, "funding knownAt");
  if (knownAt < input.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(input.rate)) throw new RangeError("Funding rate must be finite");
  if (input.markPrice != null && (!Number.isFinite(input.markPrice) || input.markPrice <= 0)) {
    throw new RangeError("Funding mark price must be positive");
  }
  const definition = {
    schemaVersion: FUNDING_OBSERVATION_SCHEMA_VERSION,
    venue: input.venue,
    symbol: input.symbol.toUpperCase(),
    fundingTime: input.fundingTime,
    knownAt,
    rate: input.rate,
    rateConvention: input.rateConvention ?? "positiveLongsPayShorts" as const,
    markPrice: input.markPrice ?? null,
    markPriceSource: input.markPriceSource ?? null,
    dataProvenance: input.dataProvenance,
  };
  return immutableJsonClone({
    ...definition,
    id: `funding-observation:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}

function versionedRef(value: { id: string; version: string; canonicalConfigHash: string }): ExecutionVersionedRef {
  return { id: value.id, version: value.version, hash: value.canonicalConfigHash };
}

function sameExecutionInstrument(
  item: { venue: string; symbol: string },
  query: { venue: string; symbol: string },
) {
  return item.venue.toLowerCase() === query.venue.toLowerCase() &&
    item.symbol.toUpperCase() === query.symbol.toUpperCase();
}

function inExecutionRange(timestamp: number, query: ExecutionDataQuery) {
  return timestamp >= query.from && timestamp <= query.to;
}

function compareExecutionObservations(
  left: ExecutionCandleObservation,
  right: ExecutionCandleObservation,
) {
  return left.openTime - right.openTime || left.knownAt - right.knownAt || left.id.localeCompare(right.id);
}

function compareTimedObservations(
  left: { eventTime: number; id: string },
  right: { eventTime: number; id: string },
) {
  return left.eventTime - right.eventTime || left.id.localeCompare(right.id);
}

function validateEffectiveWindow(from: number | null, until: number | null, label: string) {
  if (from != null) assertTimestamp(from, `${label} effectiveFrom`);
  if (until != null) assertTimestamp(until, `${label} effectiveUntil`);
  if (from != null && until != null && until <= from) {
    throw new RangeError(`${label} effectiveUntil must follow effectiveFrom`);
  }
}

function validateNonnegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${label} must be non-negative`);
}

function validatePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${label} must be positive`);
}

function assertTimestamp(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be a valid timestamp`);
}

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

export type ExecutionEventType =
  | "ExecutionCreated"
  | "EntryOrderActivated"
  | "EntryOrderExpired"
  | "EntryOrderFilled"
  | "ProtectiveStopActivated"
  | "TargetActivated"
  | "TargetFilled"
  | "ProtectiveStopQuantityAdjusted"
  | "ProtectiveStopTriggered"
  | "ProtectiveStopFilled"
  | "OrderCancelled"
  | "FundingApplied"
  | "PositionPartiallyClosed"
  | "PositionClosed"
  | "ExecutionHorizonReached"
  | "ForcedHorizonClose"
  | "AmbiguityDetected"
  | "BankruptcyBoundCrossed"
  | "ExecutionFailed"
  | "PathResolved";

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
  fundingSummary: { received: number; paid: number; net: number; records: number };
  feeSummary: { entry: number; exit: number; total: number; currency: string };
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

export async function loadExecutionCase(input: LoadExecutionCaseInput): Promise<ExecutionLoadedCase> {
  validateExecutionCaseIdentity(input);
  const decisionTime = input.replayFrame.effectiveAsOf;
  const activationTime = decisionTime + input.executionProfile.orderActivationPolicy.delaySeconds;
  const horizonTime = activationTime + input.executionProfile.maximumExecutionHorizon;
  const largestTimeframe = Math.max(
    ...input.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(strictTimeframeToSeconds),
  );
  const query = {
    venue: input.venueRules.venue,
    symbol: input.venueRules.symbol,
    from: decisionTime,
    to: horizonTime + (input.executionProfile.forceCloseAtHorizon ? largestTimeframe : 0),
  };
  const candlesByTimeframe: Record<string, ExecutionCandleObservation[]> = {};
  for (const timeframe of input.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const candles = await input.historicalDataAdapter.loadCandles({ ...query, timeframe });
    validateExecutionCandles(candles, query.venue, query.symbol, timeframe);
    candlesByTimeframe[timeframe] = candles;
  }
  const trades = await optionalLoad(input.historicalDataAdapter.loadTrades, input.historicalDataAdapter, query);
  const quotes = await optionalLoad(input.historicalDataAdapter.loadQuotes, input.historicalDataAdapter, query);
  const markPrices = await optionalLoad(input.historicalDataAdapter.loadMarkPrices, input.historicalDataAdapter, query);
  const indexPrices = await optionalLoad(input.historicalDataAdapter.loadIndexPrices, input.historicalDataAdapter, query);
  const fundingDataAvailable = input.historicalDataAdapter.fundingDataAvailable ??
    input.historicalDataAdapter.loadFundingObservations != null;
  const funding = await optionalLoad(
    input.historicalDataAdapter.loadFundingObservations,
    input.historicalDataAdapter,
    query,
  );
  const venueRuleEvidence = await optionalLoad(
    input.historicalDataAdapter.loadVenueRuleEvidence,
    input.historicalDataAdapter,
    query,
  );
  validateTimedExecutionData(trades, quotes, markPrices, indexPrices, funding, query.venue, query.symbol);
  if (
    input.historicalDataAdapter.tradeDataCompleteness === "complete" &&
    trades.some((item) => item.knownAt !== item.eventTime)
  ) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
  const futureData = {
    candlesByTimeframe,
    trades,
    tradeDataCompleteness: input.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes,
    quoteDataCompleteness: input.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices,
    indexPrices,
    funding,
  };
  const causalPrefix = {
    candlesByTimeframe: Object.fromEntries(Object.entries(candlesByTimeframe).map(([timeframe, candles]) => [
      timeframe,
      candles.filter((candle) => candle.knownAt <= decisionTime),
    ])),
    trades: trades.filter((item) => item.knownAt <= decisionTime),
    quotes: quotes.filter((item) => item.knownAt <= decisionTime),
    markPrices: markPrices.filter((item) => item.knownAt <= decisionTime),
    indexPrices: indexPrices.filter((item) => item.knownAt <= decisionTime),
  };
  const dataQualityNotes = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...(input.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : []),
    ...(input.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : []),
    ...(!fundingDataAvailable ? ["FUNDING_DATA_UNAVAILABLE"] : []),
    ...(!input.venueRules.liquidationModel ? ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"] : []),
    ...(trades.length && input.historicalDataAdapter.tradeDataCompleteness !== "complete"
      ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"]
      : []),
    ...(
      input.executionProfile.stopTriggerPolicy.source !== "last" &&
      input.executionProfile.stopTriggerPolicy.authorizedFallback === "last"
        ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"]
        : []
    ),
  ];
  const dataBundle: ExecutionDataBundle = {
    schemaVersion: EXECUTION_DATA_BUNDLE_SCHEMA_VERSION,
    venue: query.venue,
    symbol: query.symbol,
    from: query.from,
    to: query.to,
    candlesByTimeframe: immutableJsonClone(candlesByTimeframe),
    trades: immutableJsonClone(trades),
    tradeDataCompleteness: input.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: immutableJsonClone(quotes),
    quoteDataCompleteness: input.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: immutableJsonClone(markPrices),
    indexPrices: immutableJsonClone(indexPrices),
    funding: immutableJsonClone(funding),
    fundingDataAvailable,
    venueRuleEvidence: immutableJsonClone(venueRuleEvidence),
    causalPrefixFingerprint: await replaySha256(causalPrefix),
    internalBundleFingerprint: await replaySha256(futureData),
    fundingDataFingerprint: fundingDataAvailable
      ? await replaySha256(funding.filter((item) => item.knownAt <= decisionTime))
      : null,
    dataQualityNotes,
  };
  return immutableJsonClone({
    replaySession: input.replaySession,
    replayFrame: input.replayFrame,
    tradePlan: input.tradePlan,
    strategyProfile: input.strategyProfile,
    executionProfile: input.executionProfile,
    venueRules: input.venueRules,
    feeSchedule: input.feeSchedule,
    dataBundle,
  });
}

function validateExecutionCaseIdentity(input: LoadExecutionCaseInput) {
  const { replaySession, replayFrame: frame, tradePlan: plan, strategyProfile, executionProfile, venueRules, feeSchedule } = input;
  if (frame.sessionId !== replaySession.id || frame.id !== replaySession.currentFrameId) {
    throw new Error("Execution frame does not match the replay session");
  }
  if (
    replaySession.state !== "TradePlanRecorded" &&
    replaySession.state !== "Revealed"
  ) throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (
    frame.decisionSnapshot.id !== plan.snapshotId ||
    decisionSnapshotId(frame.decisionSnapshot) !== frame.decisionSnapshot.id ||
    plan.id !== tradePlanId(plan) ||
    plan.schemaVersion !== TRADE_PLAN_SCHEMA_VERSION ||
    plan.status !== "finalized" ||
    plan.side !== "short" ||
    plan.complianceResult.hardErrors.length > 0
  ) throw new Error("Execution requires an intact finalized short TradePlan");
  const acceptedPlan = replaySession.planningAttempts.some(
    (attempt) => attempt.accepted && attempt.frameId === frame.id && attempt.tradePlan.id === plan.id,
  );
  if (!acceptedPlan) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (
    strategyProfileHash(strategyProfile) !== strategyProfile.profileHash ||
    plan.strategyProfileId !== strategyProfile.id ||
    plan.strategyProfileVersion !== strategyProfile.version ||
    plan.strategyProfileHash !== strategyProfile.profileHash ||
    plan.lifecycleVersion !== replaySession.lifecycleVersion ||
    plan.lifecycleConfigHash !== replaySession.lifecycleConfigHash
  ) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (executionProfile.canonicalConfigHash !== executionProfileHash(executionProfile)) {
    throw new Error("Execution profile hash mismatch");
  }
  if (venueRules.canonicalConfigHash !== venueExecutionRulesHash(venueRules)) {
    throw new Error("Venue execution rules hash mismatch");
  }
  if (feeSchedule.canonicalConfigHash !== feeScheduleHash(feeSchedule)) {
    throw new Error("Venue fee schedule hash mismatch");
  }
  const decisionTime = frame.effectiveAsOf;
  assertEffectiveAt(feeSchedule, decisionTime, "fee schedule");
  assertEffectiveAt(venueRules, decisionTime, "venue execution rules");
  const requiredThrough = decisionTime +
    executionProfile.orderActivationPolicy.delaySeconds +
    executionProfile.maximumExecutionHorizon +
    (executionProfile.forceCloseAtHorizon
      ? Math.max(...executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(strictTimeframeToSeconds))
      : 0);
  if (
    (feeSchedule.effectiveUntil != null && feeSchedule.effectiveUntil <= requiredThrough) ||
    (venueRules.effectiveUntil != null && venueRules.effectiveUntil <= requiredThrough)
  ) throw new Error("Selected fee schedule and venue rules must cover the execution horizon");
  if (
    venueRules.venue.toLowerCase() !== plan.venueRules.venue.toLowerCase() ||
    venueRules.symbol !== plan.venueRules.symbol.toUpperCase() ||
    venueRules.quantityStep !== plan.venueRules.quantityStep ||
    venueRules.priceTick !== plan.venueRules.priceTick ||
    venueRules.maximumLeverage !== plan.venueRules.maxLeverage ||
    venueRules.feeScheduleRef.hash !== feeSchedule.canonicalConfigHash
  ) throw new Error("Execution rules do not match the frozen planning-rule subset");
  if (plan.entryPlan.orderPlanType === "manualReference") {
    throw new Error("manualReference is not an executable entry order type");
  }
  const requiredOrderType = plan.entryPlan.orderPlanType === "limit"
    ? "limit"
    : plan.entryPlan.orderPlanType === "stopMarket"
      ? "stopMarket"
      : "market";
  if (!venueRules.supportedOrderTypes.includes(requiredOrderType)) {
    throw new Error(`Venue rules do not support ${requiredOrderType}`);
  }
  if (!venueRules.stopTriggerSources.includes(executionProfile.stopTriggerPolicy.source)) {
    throw new Error("Configured protective-stop trigger source is unsupported by venue rules");
  }
  const quantity = plan.sizingResult.roundedQuantity;
  if (quantity == null || quantity <= 0 || !isStepAligned(quantity, venueRules.quantityStep)) {
    throw new Error("TradePlan has no executable step-aligned quantity");
  }
  const plannedNotional = quantity * plan.entryPlan.intendedPrice;
  if (
    quantity < venueRules.minimumQuantity ||
    plannedNotional < venueRules.minimumNotional ||
    (venueRules.maximumQuantity != null && quantity > venueRules.maximumQuantity) ||
    (venueRules.maximumNotional != null && plannedNotional > venueRules.maximumNotional) ||
    (plan.sizingResult.selectedLeverage ?? Number.POSITIVE_INFINITY) > venueRules.maximumLeverage
  ) throw new Error("TradePlan exceeds selected venue execution limits");
  if (!executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.includes(
    strategyProfile.timeframeRoles.executionTimeframe,
  )) throw new Error("Execution profile must include the strategy execution timeframe");
  const initialMargin = plan.sizingResult.initialMargin;
  if (initialMargin == null || initialMargin <= 0) throw new Error("TradePlan has no initial margin");
  const plannedBankruptcyBound = plan.entryPlan.intendedPrice + initialMargin / quantity;
  if (plan.stopPlan.stopPrice >= plannedBankruptcyBound) {
    throw new Error("Planned stop reaches the bankruptcy bound without a verified liquidation model");
  }
}

function assertEffectiveAt(
  value: { effectiveFrom: number | null; effectiveUntil: number | null },
  timestamp: number,
  label: string,
) {
  if (
    (value.effectiveFrom != null && timestamp < value.effectiveFrom) ||
    (value.effectiveUntil != null && timestamp >= value.effectiveUntil)
  ) throw new Error(`${label} is not effective at the decision time`);
}

async function optionalLoad<T>(
  loader: ((query: ExecutionDataQuery) => Promise<T[]>) | undefined,
  receiver: ReplayExecutionDataAdapter,
  query: ExecutionDataQuery,
): Promise<T[]> {
  return loader ? loader.call(receiver, query) : [];
}

function validateExecutionCandles(
  candles: readonly ExecutionCandleObservation[],
  venue: string,
  symbol: string,
  timeframe: string,
) {
  const ids = new Set<string>();
  let priorOpen = -1;
  for (const candle of candles) {
    if (
      candle.schemaVersion !== EXECUTION_CANDLE_SCHEMA_VERSION ||
      candle.venue.toLowerCase() !== venue.toLowerCase() ||
      candle.symbol !== symbol.toUpperCase() ||
      candle.timeframe !== timeframe ||
      candle.id !== createExecutionCandleObservation(candle).id ||
      candle.openTime <= priorOpen ||
      ids.has(candle.id)
    ) throw new Error(`Invalid or duplicate execution candle ${candle.id}`);
    priorOpen = candle.openTime;
    ids.add(candle.id);
  }
}

function validateTimedExecutionData(
  trades: readonly ExecutionTradeObservation[],
  quotes: readonly ExecutionQuoteObservation[],
  markPrices: readonly ExecutionQuoteObservation[],
  indexPrices: readonly ExecutionQuoteObservation[],
  funding: readonly FundingObservation[],
  venue: string,
  symbol: string,
) {
  const all = [...trades, ...quotes, ...markPrices, ...indexPrices];
  const ids = new Set<string>();
  for (const item of all) {
    if (
      item.venue.toLowerCase() !== venue.toLowerCase() ||
      item.symbol.toUpperCase() !== symbol.toUpperCase() ||
      item.knownAt < item.eventTime ||
      ids.has(item.id)
    ) throw new Error(`Invalid or duplicate execution observation ${item.id}`);
    const canonicalId = "price" in item
      ? createExecutionTradeObservation(item).id
      : createExecutionQuoteObservation(item).id;
    if (item.id !== canonicalId) throw new Error(`Execution observation identity mismatch ${item.id}`);
    ids.add(item.id);
  }
  for (const item of funding) {
    if (
      item.venue.toLowerCase() !== venue.toLowerCase() ||
      item.symbol.toUpperCase() !== symbol.toUpperCase() ||
      item.id !== createFundingObservation(item).id ||
      ids.has(item.id)
    ) throw new Error(`Invalid or duplicate funding observation ${item.id}`);
    ids.add(item.id);
  }
}

function isStepAligned(value: number, step: number) {
  const nearest = Math.round(value / step) * step;
  return Math.abs(value - nearest) <= Math.max(1e-12, step * 1e-9);
}
