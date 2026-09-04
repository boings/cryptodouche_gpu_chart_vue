import {
  EXECUTION_ENGINE_VERSION,
  EXECUTION_EVENT_SCHEMA_VERSION,
  EXECUTION_FILL_SCHEMA_VERSION,
  EXECUTION_ORDER_SCHEMA_VERSION,
  EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
  EXECUTION_RESULT_SCHEMA_VERSION,
  EXECUTION_SESSION_SCHEMA_VERSION,
  POSITION_LEDGER_SCHEMA_VERSION,
  type ExecutionAmbiguity,
  type ExecutionAmbiguityBranch,
  type ExecutionCandleObservation,
  type ExecutionEvent,
  type ExecutionEventType,
  type ExecutionExitSummary,
  type ExecutionFill,
  type ExecutionFundingRecord,
  type ExecutionLoadedCase,
  type ExecutionOrder,
  type ExecutionOrderKind,
  type ExecutionPathResolution,
  type ExecutionResult,
  type ExecutionSession,
  type ExecutionSessionIdentity,
  type ExecutionSessionState,
  type ExecutionSlippageRecord,
  type ExecutionExcursionObservation,
  type FundingObservation,
  type PositionLedger,
} from "./execution";
import { strictTimeframeToSeconds } from "./data";
import { canonicalHash, canonicalSerialize, immutableJsonClone } from "./serialization";

interface AtomicPricePath {
  id: string;
  eventTime: number;
  intervalEnd: number;
  processingAsOf: number;
  open: number;
  high: number;
  low: number;
  close: number;
  resolution: string;
  exact: boolean;
}

interface WorkingSession extends Omit<ExecutionSession, "integrityHash"> {}

interface EventInput {
  type: ExecutionEventType;
  eventTime: number;
  processingAsOf: number;
  stateAfter?: ExecutionSessionState;
  orderIds?: string[];
  fillIds?: string[];
  quantity?: number | null;
  referencePrice?: number | null;
  actualPrice?: number | null;
  feeAmount?: number | null;
  fundingAmount?: number | null;
  sourceObservationIds?: string[];
  explanation: string;
  dataQualityNotes?: string[];
}

const TERMINAL_STATES = new Set<ExecutionSessionState>([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed",
]);

export function createExecutionSession(loaded: ExecutionLoadedCase): ExecutionSession {
  assertLoadedCase(loaded);
  const plan = loaded.tradePlan;
  const frame = loaded.replayFrame;
  const activationTime = frame.effectiveAsOf + loaded.executionProfile.orderActivationPolicy.delaySeconds;
  const identityDefinition: Omit<ExecutionSessionIdentity, "id"> = {
    schemaVersion: EXECUTION_SESSION_SCHEMA_VERSION,
    replaySessionId: loaded.replaySession.id,
    replayFrameId: frame.id,
    decisionSnapshotId: frame.decisionSnapshot.id,
    tradePlanId: plan.id,
    tradePlanSchemaVersion: plan.schemaVersion,
    strategyProfileRef: {
      id: loaded.strategyProfile.id,
      version: loaded.strategyProfile.version,
      hash: loaded.strategyProfile.profileHash,
    },
    lifecycleVersion: plan.lifecycleVersion,
    lifecycleConfigHash: plan.lifecycleConfigHash,
    sizingModelVersion: plan.sizingResult.sizingModelVersion,
    replayEngineVersion: loaded.replaySession.replayEngineVersion,
    executionEngineVersion: EXECUTION_ENGINE_VERSION,
    executionProfileRef: versionedRef(loaded.executionProfile),
    venueRulesRef: versionedRef(loaded.venueRules),
    feeScheduleRef: versionedRef(loaded.feeSchedule),
    marketDataBundleFingerprint: loaded.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: loaded.dataBundle.fundingDataFingerprint,
    decisionTime: frame.effectiveAsOf,
    orderActivationTime: activationTime,
    executionHorizonTime: activationTime + loaded.executionProfile.maximumExecutionHorizon,
  };
  const identity: ExecutionSessionIdentity = {
    ...identityDefinition,
    id: `execution-session:${canonicalHash(identityDefinition).slice("fnv1a64:".length)}`,
  };
  const working: WorkingSession = {
    ...identity,
    revision: 0,
    currentAsOf: identity.decisionTime,
    state: "Created",
    stateSince: identity.decisionTime,
    orders: [],
    fills: [],
    positionLedger: emptyLedger(loaded),
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [...loaded.dataBundle.dataQualityNotes],
    errors: [],
  };
  appendEvent(working, {
    type: "ExecutionCreated",
    eventTime: identity.decisionTime,
    processingAsOf: identity.decisionTime,
    explanation: "Execution inputs validated and bound to the finalized TradePlan",
  });
  return sealSession(working);
}

export function advanceExecutionTo(
  session: ExecutionSession,
  loaded: ExecutionLoadedCase,
  targetAsOf: number,
): ExecutionSession {
  validateExecutionSessionIntegrity(session);
  assertSessionMatchesLoaded(session, loaded);
  assertTimestamp(targetAsOf, "targetAsOf");
  if (targetAsOf < session.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (TERMINAL_STATES.has(session.state)) return immutableJsonClone(session);
  const recomputed = runExecutionTo(loaded, targetAsOf);
  if (recomputed.executionEvents.length < session.executionEvents.length) {
    throw new Error("Execution target precedes already processed causal events");
  }
  const prefix = recomputed.executionEvents.slice(0, session.executionEvents.length);
  if (canonicalSerialize(prefix) !== canonicalSerialize(session.executionEvents)) {
    throw new Error("Execution history changed under the same session identity");
  }
  return recomputed;
}

export function finalizeExecutionAtHorizon(
  session: ExecutionSession,
  loaded: ExecutionLoadedCase,
): ExecutionSession {
  const lookahead = loaded.executionProfile.forceCloseAtHorizon
    ? 2 * Math.max(...loaded.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(strictTimeframeToSeconds))
    : 0;
  return advanceExecutionTo(session, loaded, session.executionHorizonTime + lookahead);
}

export function simulateExecutionToHorizon(loaded: ExecutionLoadedCase): ExecutionSession {
  return finalizeExecutionAtHorizon(createExecutionSession(loaded), loaded);
}

function runExecutionTo(loaded: ExecutionLoadedCase, cutoff: number): ExecutionSession {
  const initial = createExecutionSession(loaded);
  const working = mutableSession(initial);
  if (cutoff < working.orderActivationTime) return initial;
  activateEntry(working, loaded);
  const dataCutoff = loaded.executionProfile.forceCloseAtHorizon
    ? cutoff
    : Math.min(cutoff, working.executionHorizonTime);
  const paths = resolvedPricePaths(loaded, dataCutoff);
  const funding = loaded.dataBundle.funding.filter((item) => item.knownAt <= dataCutoff);
  let fundingIndex = 0;
  for (const path of paths) {
    if (TERMINAL_STATES.has(working.state)) break;
    while (fundingIndex < funding.length && funding[fundingIndex]!.fundingTime < path.eventTime) {
      applyFunding(working, loaded, funding[fundingIndex++]!, null);
      if (TERMINAL_STATES.has(working.state)) break;
    }
    if (TERMINAL_STATES.has(working.state)) break;
    if (expireEntryBefore(working, loaded, path.eventTime, cutoff)) break;
    if (
      loaded.executionProfile.forceCloseAtHorizon &&
      path.eventTime >= working.executionHorizonTime &&
      (working.state === "Open" || working.state === "PartiallyClosed")
    ) {
      forceCloseAtPath(working, loaded, path);
      break;
    }
    recordPath(working, loaded, path);
    const fillsBefore = working.fills.length;
    processPricePath(working, loaded, path);
    const fillsInPath = working.fills.length > fillsBefore;
    while (
      fundingIndex < funding.length &&
      funding[fundingIndex]!.fundingTime >= path.eventTime &&
      funding[fundingIndex]!.fundingTime < path.intervalEnd
    ) {
      applyFunding(working, loaded, funding[fundingIndex++]!, fillsInPath ? path : null);
      if (TERMINAL_STATES.has(working.state)) break;
    }
    if (!TERMINAL_STATES.has(working.state)) {
      appendEvent(working, {
        type: "PathResolved",
        eventTime: path.intervalEnd,
        processingAsOf: path.processingAsOf,
        sourceObservationIds: [path.id],
        explanation: `Execution interval resolved with ${path.resolution} ${path.exact ? "ordered" : "OHLC"} data`,
      });
    }
  }
  while (
    !TERMINAL_STATES.has(working.state) &&
    fundingIndex < funding.length &&
    funding[fundingIndex]!.fundingTime <= Math.min(cutoff, working.executionHorizonTime)
  ) applyFunding(working, loaded, funding[fundingIndex++]!, null);

  if (!TERMINAL_STATES.has(working.state)) finishAtCutoff(working, loaded, paths, cutoff);
  return sealSession(working);
}

function activateEntry(working: WorkingSession, loaded: ExecutionLoadedCase) {
  const plan = loaded.tradePlan;
  const kind: ExecutionOrderKind = plan.entryPlan.orderPlanType === "marketNextAvailable"
    ? "entryMarket"
    : plan.entryPlan.orderPlanType === "limit"
      ? "entryLimit"
      : "entryStopMarket";
  const order = makeOrder(working.id, {
    kind,
    side: "sell",
    quantity: plan.sizingResult.roundedQuantity!,
    remainingQuantity: plan.sizingResult.roundedQuantity!,
    limitPrice: kind === "entryLimit" ? normalizePrice(plan.entryPlan.intendedPrice, loaded.venueRules.priceTick, "up") : null,
    triggerPrice: kind === "entryStopMarket" ? normalizePrice(plan.entryPlan.intendedPrice, loaded.venueRules.priceTick, "down") : null,
    activationTime: working.orderActivationTime,
    status: "active",
    reduceOnly: false,
    parentTargetId: null,
    liquidityAssumption: kind === "entryLimit" ? "assumedMaker" : "taker",
  });
  working.orders.push(order);
  appendEvent(working, {
    type: "EntryOrderActivated",
    eventTime: working.orderActivationTime,
    processingAsOf: working.orderActivationTime,
    stateAfter: "PendingEntry",
    orderIds: [order.id],
    quantity: order.quantity,
    referencePrice: order.limitPrice ?? order.triggerPrice,
    explanation: "Finalized entry order became active after the configured causal delay",
  });
}

function resolvedPricePaths(loaded: ExecutionLoadedCase, cutoff: number): AtomicPricePath[] {
  const activation = loaded.replayFrame.effectiveAsOf + loaded.executionProfile.orderActivationPolicy.delaySeconds;
  const horizon = activation + loaded.executionProfile.maximumExecutionHorizon;
  const pathEnd = loaded.executionProfile.forceCloseAtHorizon
    ? horizon + Math.max(...loaded.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(strictTimeframeToSeconds))
    : horizon;
  const trades = loaded.dataBundle.trades.filter(
    (item) => item.knownAt <= cutoff && item.eventTime >= activation && item.eventTime <= pathEnd,
  );
  if (trades.length && loaded.dataBundle.tradeDataCompleteness === "complete") return trades.map((trade) => ({
    id: trade.id,
    eventTime: trade.eventTime,
    intervalEnd: trade.eventTime,
    processingAsOf: trade.knownAt,
    open: trade.price,
    high: trade.price,
    low: trade.price,
    close: trade.price,
    resolution: "trade",
    exact: true,
  }));

  const executionTimeframe = loaded.strategyProfile.timeframeRoles.executionTimeframe;
  const coarseCandles = loaded.dataBundle.candlesByTimeframe[executionTimeframe] ?? [];
  const paths: AtomicPricePath[] = [];
  for (const coarse of coarseCandles) {
    if (
      coarse.knownAt > cutoff ||
      coarse.closeTime <= activation ||
      coarse.openTime > pathEnd
    ) continue;
    const selected = selectFinerCompletePath(loaded, coarse, cutoff) ?? [coarse];
    for (const candle of selected) {
      if (candle.closeTime <= activation || candle.openTime > pathEnd) continue;
      paths.push(candlePath(candle));
    }
  }
  const byId = new Map(paths.map((path) => [path.id, path]));
  return [...byId.values()].sort(
    (left, right) => left.eventTime - right.eventTime || left.processingAsOf - right.processingAsOf || left.id.localeCompare(right.id),
  );
}

function selectFinerCompletePath(
  loaded: ExecutionLoadedCase,
  coarse: ExecutionCandleObservation,
  cutoff: number,
): ExecutionCandleObservation[] | null {
  const coarseSeconds = strictTimeframeToSeconds(coarse.timeframe);
  const candidates = [...loaded.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst]
    .filter((timeframe) => strictTimeframeToSeconds(timeframe) < coarseSeconds)
    .sort((left, right) => strictTimeframeToSeconds(left) - strictTimeframeToSeconds(right));
  for (const timeframe of candidates) {
    const seconds = strictTimeframeToSeconds(timeframe);
    const expected = coarseSeconds / seconds;
    if (!Number.isInteger(expected)) continue;
    const candles = (loaded.dataBundle.candlesByTimeframe[timeframe] ?? []).filter(
      (item) =>
        item.openTime >= coarse.openTime &&
        item.closeTime <= coarse.closeTime &&
        item.knownAt <= Math.min(cutoff, coarse.knownAt),
    );
    if (candles.length !== expected) continue;
    let cursor = coarse.openTime;
    let complete = true;
    for (const candle of candles) {
      if (candle.openTime !== cursor) {
        complete = false;
        break;
      }
      cursor = candle.closeTime;
    }
    if (complete && cursor === coarse.closeTime) return candles;
  }
  return null;
}

function candlePath(candle: ExecutionCandleObservation): AtomicPricePath {
  return {
    id: candle.id,
    eventTime: candle.openTime,
    intervalEnd: candle.closeTime,
    processingAsOf: candle.knownAt,
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    resolution: candle.timeframe,
    exact: false,
  };
}

function recordPath(working: WorkingSession, loaded: ExecutionLoadedCase, path: AtomicPricePath) {
  const definition = {
    schemaVersion: EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
    intervalStart: path.eventTime,
    intervalEnd: path.intervalEnd,
    requestedResolution: loaded.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: path.resolution,
    dataSource: (path.exact ? "trades" : "candles") as "trades" | "candles",
    dataFingerprint: canonicalHash([path.id]),
    exactOrApproximate: (path.exact ? "exact" : "approximate") as "exact" | "approximate",
    sourceObservationIds: [path.id],
    ambiguities: [],
  };
  const record: ExecutionPathResolution = {
    ...definition,
    id: `execution-path:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
  working.pathResolutionRecords.push(record);
}

function processPricePath(working: WorkingSession, loaded: ExecutionLoadedCase, path: AtomicPricePath) {
  if (working.state === "PendingEntry") processEntry(working, loaded, path);
  if (working.state === "Open" || working.state === "PartiallyClosed") {
    trackExcursion(working, path);
    processActivePosition(working, loaded, path);
  }
}

function processEntry(working: WorkingSession, loaded: ExecutionLoadedCase, path: AtomicPricePath) {
  const order = activeEntry(working);
  if (!order || path.eventTime < order.activationTime) return;
  let referencePrice: number | null = null;
  let liquidity = order.liquidityAssumption;
  let slippageBps = 0;
  if (order.kind === "entryMarket") {
    referencePrice = path.open;
    liquidity = "taker";
    slippageBps = loaded.executionProfile.slippageModel.marketEntryBps;
  } else if (order.kind === "entryLimit") {
    const limit = order.limitPrice!;
    if (path.open >= limit) {
      referencePrice = path.open;
      liquidity = "assumedTaker";
    } else if (limitSellFills(path, limit, loaded.executionProfile.restingLimitFillPolicy, loaded.venueRules.priceTick)) {
      referencePrice = limit;
      liquidity = "assumedMaker";
    }
  } else {
    const trigger = order.triggerPrice!;
    if (path.open <= trigger) referencePrice = path.open;
    else if (path.low <= trigger) referencePrice = trigger;
    if (referencePrice != null) {
      liquidity = "taker";
      slippageBps = loaded.executionProfile.slippageModel.marketEntryBps;
    }
  }
  if (referencePrice == null) return;
  const barrierTouches = touchedExitOrderIdsForProspectiveEntry(loaded, path);
  if (!path.exact && order.kind !== "entryMarket" && barrierTouches.length) {
    markAmbiguous(working, loaded, path, [order.id, ...barrierTouches], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const fill = makeFill(working, loaded, order, path, referencePrice, liquidity, slippageBps, "entry");
  const actualNotional = fill.price * fill.quantity;
  if (
    fill.quantity < loaded.venueRules.minimumQuantity ||
    actualNotional < loaded.venueRules.minimumNotional ||
    (loaded.venueRules.maximumQuantity != null && fill.quantity > loaded.venueRules.maximumQuantity) ||
    (loaded.venueRules.maximumNotional != null && actualNotional > loaded.venueRules.maximumNotional)
  ) {
    failExecution(working, loaded, path.eventTime, path.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  order.status = "filled";
  order.remainingQuantity = 0;
  working.fills.push(fill);
  applyEntryToLedger(working, loaded, fill);
  appendEvent(working, {
    type: "EntryOrderFilled",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    stateAfter: "Open",
    orderIds: [order.id],
    fillIds: [fill.id],
    quantity: fill.quantity,
    referencePrice,
    actualPrice: fill.price,
    feeAmount: fill.feeAmount,
    sourceObservationIds: [path.id],
    explanation: order.kind === "entryMarket"
      ? "Short entry filled at the next eligible observation with adverse slippage"
      : "Short entry filled under the configured deterministic entry policy",
    dataQualityNotes: path.exact ? [] : ["CANDLE_ENTRY_FILL_APPROXIMATION"],
  });
  activateProtection(working, loaded, fill);
}

function activateProtection(working: WorkingSession, loaded: ExecutionLoadedCase, entry: ExecutionFill) {
  const stop = makeOrder(working.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: entry.quantity,
    remainingQuantity: entry.quantity,
    limitPrice: null,
    triggerPrice: normalizePrice(loaded.tradePlan.stopPlan.stopPrice, loaded.venueRules.priceTick, "up"),
    activationTime: entry.eventTime,
    status: "active",
    reduceOnly: true,
    parentTargetId: null,
    liquidityAssumption: "taker",
  });
  working.orders.push(stop);
  appendEvent(working, {
    type: "ProtectiveStopActivated",
    eventTime: entry.eventTime,
    processingAsOf: entry.processingAsOf,
    orderIds: [stop.id],
    quantity: stop.quantity,
    referencePrice: stop.triggerPrice,
    explanation: "Static reduce-only protective buy stop activated after entry",
  });
  const allocations = allocateTargets(entry.quantity, loaded.tradePlan.targetPlans.map((target) => ({
    id: target.id,
    fraction: target.positionFraction,
  })), loaded.venueRules.quantityStep);
  for (const targetPlan of [...loaded.tradePlan.targetPlans].sort((a, b) => b.targetPrice - a.targetPrice || a.id.localeCompare(b.id))) {
    const quantity = allocations[targetPlan.id] ?? 0;
    if (quantity <= 0) continue;
    const target = makeOrder(working.id, {
      kind: "target",
      side: "buy",
      quantity,
      remainingQuantity: quantity,
      limitPrice: normalizePrice(targetPlan.targetPrice, loaded.venueRules.priceTick, "down"),
      triggerPrice: null,
      activationTime: entry.eventTime,
      status: "active",
      reduceOnly: true,
      parentTargetId: targetPlan.id,
      liquidityAssumption: "assumedMaker",
    });
    working.orders.push(target);
    working.positionLedger.openTargetQuantities[targetPlan.id] = quantity;
    appendEvent(working, {
      type: "TargetActivated",
      eventTime: entry.eventTime,
      processingAsOf: entry.processingAsOf,
      orderIds: [target.id],
      quantity,
      referencePrice: target.limitPrice,
      explanation: "Static reduce-only target activated after entry",
    });
  }
}

function processActivePosition(working: WorkingSession, loaded: ExecutionLoadedCase, path: AtomicPricePath) {
  const stop = activeStop(working);
  const targets = activeTargets(working);
  const stopEvaluation = stop ? evaluateStopTrigger(loaded, path, stop.triggerPrice!) : null;
  if (stopEvaluation?.unavailable) {
    failExecution(
      working,
      loaded,
      path.eventTime,
      path.processingAsOf,
      `Required ${loaded.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`,
    );
    return;
  }
  const stopTouched = stopEvaluation?.touched ?? false;
  const touchedTargets = targets.filter((target) =>
    limitBuyFills(path, target.limitPrice!, loaded.executionProfile.targetFillPolicy, loaded.venueRules.priceTick),
  );
  if (!path.exact && stopTouched && touchedTargets.length) {
    markAmbiguous(
      working,
      loaded,
      path,
      [stop!.id, ...touchedTargets.map((target) => target.id)],
      "STOP_AND_TARGET_INTRABAR_ORDER_UNKNOWN",
    );
    return;
  }
  const bound = working.positionLedger.bankruptcyBoundApprox;
  if (bound != null && path.high >= bound) {
    appendEvent(working, {
      type: "BankruptcyBoundCrossed",
      eventTime: path.eventTime,
      processingAsOf: path.processingAsOf,
      quantity: working.positionLedger.remainingQuantity,
      referencePrice: bound,
      sourceObservationIds: [path.id],
      explanation: "Simple isolated-margin bankruptcy bound crossed without a verified liquidation model",
      dataQualityNotes: ["BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL"],
    });
    markAmbiguous(working, loaded, path, stop ? [stop.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (stopTouched) {
    fillStop(working, loaded, path, stop!, stopEvaluation?.referencePrice ?? stop!.triggerPrice!);
    return;
  }
  for (const target of touchedTargets.sort((left, right) => right.limitPrice! - left.limitPrice! || left.id.localeCompare(right.id))) {
    if (working.positionLedger.remainingQuantity <= 0) break;
    fillTarget(working, loaded, path, target);
  }
}

function fillTarget(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  order: ExecutionOrder,
) {
  const quantity = Math.min(order.remainingQuantity, working.positionLedger.remainingQuantity);
  const fill = makeFill(working, loaded, order, path, order.limitPrice!, "assumedMaker", 0, "target", quantity);
  order.status = "filled";
  order.remainingQuantity = 0;
  working.fills.push(fill);
  applyExitToLedger(working, fill);
  delete working.positionLedger.openTargetQuantities[order.parentTargetId!];
  appendEvent(working, {
    type: "TargetFilled",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    orderIds: [order.id],
    fillIds: [fill.id],
    quantity,
    referencePrice: order.limitPrice,
    actualPrice: fill.price,
    feeAmount: fill.feeAmount,
    sourceObservationIds: [path.id],
    explanation: "Reduce-only target filled without market slippage",
    dataQualityNotes: path.exact ? [] : ["RESTING_LIMIT_FILL_ASSUMPTION"],
  });
  const stop = activeStop(working);
  if (working.positionLedger.remainingQuantity > 0 && stop) {
    stop.quantity = working.positionLedger.remainingQuantity;
    stop.remainingQuantity = working.positionLedger.remainingQuantity;
    working.positionLedger.remainingProtectiveStopQuantity = working.positionLedger.remainingQuantity;
    appendEvent(working, {
      type: "ProtectiveStopQuantityAdjusted",
      eventTime: path.eventTime,
      processingAsOf: path.processingAsOf,
      orderIds: [stop.id],
      quantity: stop.quantity,
      sourceObservationIds: [path.id],
      explanation: "Protective stop reduced to the exact remaining position",
    });
    appendEvent(working, {
      type: "PositionPartiallyClosed",
      eventTime: path.eventTime,
      processingAsOf: path.processingAsOf,
      stateAfter: "PartiallyClosed",
      fillIds: [fill.id],
      quantity: working.positionLedger.remainingQuantity,
      sourceObservationIds: [path.id],
      explanation: "A planned target reduced the position",
    });
    return;
  }
  if (stop) cancelOrder(working, stop, path, "All planned target quantity filled");
  closePosition(working, loaded, path, "AllTargets", fill);
}

function fillStop(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  stop: ExecutionOrder,
  evaluatedReferencePrice: number,
) {
  const referencePrice = evaluatedReferencePrice;
  appendEvent(working, {
    type: "ProtectiveStopTriggered",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    orderIds: [stop.id],
    quantity: working.positionLedger.remainingQuantity,
    referencePrice,
    sourceObservationIds: [path.id],
    explanation: path.open >= stop.triggerPrice! ? "Protective stop triggered by an adverse gap" : "Protective stop trigger crossed",
  });
  const fill = makeFill(
    working,
    loaded,
    stop,
    path,
    referencePrice,
    "taker",
    loaded.executionProfile.slippageModel.stopExitBps,
    "stop",
    working.positionLedger.remainingQuantity,
  );
  stop.status = "filled";
  stop.remainingQuantity = 0;
  working.fills.push(fill);
  applyExitToLedger(working, fill);
  working.positionLedger.remainingProtectiveStopQuantity = 0;
  appendEvent(working, {
    type: "ProtectiveStopFilled",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    orderIds: [stop.id],
    fillIds: [fill.id],
    quantity: fill.quantity,
    referencePrice,
    actualPrice: fill.price,
    feeAmount: fill.feeAmount,
    sourceObservationIds: [path.id],
    explanation: "Protective buy stop filled with adverse stop slippage",
  });
  for (const target of activeTargets(working)) cancelOrder(working, target, path, "Protective stop closed the position");
  const hadTarget = working.fills.some((item) => orderById(working, item.orderId)?.kind === "target");
  closePosition(working, loaded, path, hadTarget ? "StopAfterPartialTargets" : "Stop", fill);
}

function closePosition(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  reason: "Stop" | "StopAfterPartialTargets" | "AllTargets" | "ForcedHorizonClose",
  fill: ExecutionFill,
) {
  finalizeLedger(working);
  working.result = buildResult(working, loaded, "Closed", reason, null);
  appendEvent(working, {
    type: "PositionClosed",
    eventTime: fill.eventTime,
    processingAsOf: fill.processingAsOf,
    stateAfter: "Closed",
    fillIds: [fill.id],
    quantity: 0,
    actualPrice: fill.price,
    sourceObservationIds: [path.id],
    explanation: `Position closed: ${reason}`,
  });
}

function applyFunding(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  observation: FundingObservation,
  conflictingPath: AtomicPricePath | null,
) {
  if (working.state !== "Open" && working.state !== "PartiallyClosed") return;
  if (working.fundingRecords.some((item) => item.observationId === observation.id)) return;
  if (conflictingPath && loaded.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    markAmbiguous(
      working,
      loaded,
      conflictingPath,
      activeProtection(working).map((order) => order.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN",
    );
    return;
  }
  const referencePrice = observation.markPrice;
  if (referencePrice == null) {
    if (!working.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE")) {
      working.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE");
    }
    if (loaded.executionProfile.fundingPolicy.absence === "requireComplete") {
      failExecution(working, loaded, observation.fundingTime, observation.knownAt, "Funding reference price is unavailable");
    }
    return;
  }
  const ordering = loaded.venueRules.fundingConvention.sameTimestampOrdering;
  const fillsAtTimestamp = working.fills.filter((fill) => fill.eventTime === observation.fundingTime);
  const entryAtTimestamp = fillsAtTimestamp.find((fill) => fill.side === "sell");
  const exitsAtTimestamp = fillsAtTimestamp.filter((fill) => fill.side === "buy");
  const positionQuantity = ordering === "fundingBeforePosition"
    ? quantity(
        working.positionLedger.remainingQuantity +
        exitsAtTimestamp.reduce((sum, fill) => sum + fill.quantity, 0) -
        (entryAtTimestamp?.quantity ?? 0),
        12,
      )
    : working.positionLedger.remainingQuantity;
  if (positionQuantity <= 0) return;
  const amount = money(positionQuantity * referencePrice * observation.rate);
  const definition = {
    observationId: observation.id,
    fundingTime: observation.fundingTime,
    processingAsOf: Math.max(observation.knownAt, conflictingPath?.processingAsOf ?? observation.knownAt),
    positionQuantity,
    referencePrice,
    rate: observation.rate,
    amount,
    quoteCurrency: loaded.tradePlan.accountState.quoteCurrency,
  };
  const record: ExecutionFundingRecord = {
    ...definition,
    id: `execution-funding:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
  working.fundingRecords.push(record);
  if (amount >= 0) working.positionLedger.fundingReceived = money(working.positionLedger.fundingReceived + amount);
  else working.positionLedger.fundingPaid = money(working.positionLedger.fundingPaid + -amount);
  working.positionLedger.netFunding = money(
    working.positionLedger.fundingReceived - working.positionLedger.fundingPaid,
  );
  refreshNetLedger(working);
  appendEvent(working, {
    type: "FundingApplied",
    eventTime: observation.fundingTime,
    processingAsOf: record.processingAsOf,
    quantity: record.positionQuantity,
    referencePrice,
    fundingAmount: amount,
    sourceObservationIds: [observation.id],
    explanation: amount >= 0 ? "Positive funding paid to the open short" : "Negative funding charged to the open short",
  });
}

function finishAtCutoff(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  paths: AtomicPricePath[],
  cutoff: number,
) {
  const expiry = entryExpiry(working, loaded);
  if ((working.state === "Created" || working.state === "PendingEntry") && cutoff >= expiry) {
    if (!hasFreshCoverageThrough(paths, expiry, loaded)) {
      failExecution(working, loaded, expiry, cutoff, "Price data does not cover the entry expiry window");
      return;
    }
    const entry = activeEntry(working);
    if (entry) {
      entry.status = "expired";
      appendEvent(working, {
        type: "EntryOrderExpired",
        eventTime: expiry,
        processingAsOf: expiry,
        stateAfter: "EntryExpired",
        orderIds: [entry.id],
        quantity: entry.quantity,
        explanation: "Entry remained unfilled through its deterministic expiry",
      });
      working.result = buildResult(working, loaded, "EntryExpired", null, null);
      replaceLastEventResult(working);
    }
    return;
  }
  if (cutoff < working.executionHorizonTime || (working.state !== "Open" && working.state !== "PartiallyClosed")) return;
  const lastBeforeHorizon = [...paths].reverse().find((item) => item.eventTime <= working.executionHorizonTime);
  if (!lastBeforeHorizon || !hasFreshCoverageThrough(paths, working.executionHorizonTime, loaded)) {
    failExecution(working, loaded, working.executionHorizonTime, cutoff, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (loaded.executionProfile.forceCloseAtHorizon) {
    const closePath = paths.find((item) => item.eventTime >= working.executionHorizonTime);
    if (!closePath) return;
    forceCloseAtPath(working, loaded, closePath);
    return;
  }
  markOpenLedger(working, lastBeforeHorizon.close);
  appendEvent(working, {
    type: "ExecutionHorizonReached",
    eventTime: working.executionHorizonTime,
    processingAsOf: Math.max(working.executionHorizonTime, lastBeforeHorizon.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: working.positionLedger.remainingQuantity,
    referencePrice: lastBeforeHorizon.close,
    sourceObservationIds: [lastBeforeHorizon.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon",
  });
  working.result = buildResult(working, loaded, "OpenAtHorizon", null, null);
  replaceLastEventResult(working);
}

function hasFreshCoverageThrough(
  paths: AtomicPricePath[],
  timestamp: number,
  loaded: ExecutionLoadedCase,
) {
  const last = [...paths].reverse().find((item) => item.eventTime <= timestamp);
  if (!last) return false;
  const maximumStaleness = strictTimeframeToSeconds(loaded.strategyProfile.timeframeRoles.executionTimeframe);
  return timestamp - last.intervalEnd <= maximumStaleness;
}

function forceCloseAtPath(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  closePath: AtomicPricePath,
) {
  const synthetic = makeOrder(working.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: working.positionLedger.remainingQuantity,
    remainingQuantity: working.positionLedger.remainingQuantity,
    limitPrice: null,
    triggerPrice: null,
    activationTime: working.executionHorizonTime,
    status: "active",
    reduceOnly: true,
    parentTargetId: null,
    liquidityAssumption: "taker",
  });
  working.orders.push(synthetic);
  const fill = makeFill(
    working,
    loaded,
    synthetic,
    closePath,
    closePath.open,
    "taker",
    loaded.executionProfile.slippageModel.marketExitBps,
    "forcedHorizonClose",
    working.positionLedger.remainingQuantity,
  );
  synthetic.status = "filled";
  synthetic.remainingQuantity = 0;
  working.fills.push(fill);
  applyExitToLedger(working, fill);
  for (const order of activeProtection(working).filter((item) => item.id !== synthetic.id)) {
    cancelOrder(working, order, closePath, "Forced horizon close cancelled protection");
  }
  appendEvent(working, {
    type: "ForcedHorizonClose",
    eventTime: closePath.eventTime,
    processingAsOf: closePath.processingAsOf,
    fillIds: [fill.id],
    orderIds: [synthetic.id],
    quantity: fill.quantity,
    referencePrice: closePath.open,
    actualPrice: fill.price,
    feeAmount: fill.feeAmount,
    sourceObservationIds: [closePath.id],
    explanation: "Configured research policy forced a market close at the first eligible observation",
  });
  closePosition(working, loaded, closePath, "ForcedHorizonClose", fill);
}

function expireEntryBefore(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  nextEventTime: number,
  cutoff: number,
) {
  if (working.state !== "PendingEntry") return false;
  const expiry = entryExpiry(working, loaded);
  if (nextEventTime < expiry || cutoff < expiry) return false;
  const entry = activeEntry(working)!;
  entry.status = "expired";
  appendEvent(working, {
    type: "EntryOrderExpired",
    eventTime: expiry,
    processingAsOf: expiry,
    stateAfter: "EntryExpired",
    orderIds: [entry.id],
    quantity: entry.quantity,
    explanation: "Entry expired before the next eligible observation",
  });
  working.result = buildResult(working, loaded, "EntryExpired", null, null);
  replaceLastEventResult(working);
  return true;
}

function markAmbiguous(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  orderIds: string[],
  code: string,
) {
  const branches = ambiguityBranches(working, loaded, path, orderIds);
  const values = branches.map((branch) => branch.estimatedNetPnl).filter((value): value is number => value != null);
  const ambiguity: ExecutionAmbiguity = {
    code,
    intervalStart: path.eventTime,
    intervalEnd: path.intervalEnd,
    orderIds,
    sourceObservationIds: [path.id],
    branches,
    lowerNetPnlBound: values.length ? Math.min(...values) : null,
    upperNetPnlBound: values.length ? Math.max(...values) : null,
    explanation: "Available observations do not establish a unique chronological execution path",
  };
  const lastPath = working.pathResolutionRecords.at(-1);
  if (lastPath && !lastPath.ambiguities.includes(code)) lastPath.ambiguities.push(code);
  working.result = buildResult(working, loaded, "Ambiguous", null, ambiguity);
  appendEvent(working, {
    type: "AmbiguityDetected",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    stateAfter: "Ambiguous",
    orderIds,
    sourceObservationIds: [path.id],
    explanation: ambiguity.explanation,
    dataQualityNotes: [code],
  });
}

function ambiguityBranches(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  orderIds: string[],
): ExecutionAmbiguityBranch[] {
  const entry = entryFill(working);
  const positionQuantity = entry?.quantity ?? loaded.tradePlan.sizingResult.roundedQuantity!;
  const remainingQuantity = entry ? working.positionLedger.remainingQuantity : positionQuantity;
  const entryPrice = entry?.price ?? loaded.tradePlan.entryPlan.intendedPrice;
  const stopPrice = adversePrice(
    Math.max(path.open, loaded.tradePlan.stopPlan.stopPrice),
    loaded.executionProfile.slippageModel.stopExitBps,
    "buy",
    loaded.venueRules.priceTick,
  ).price;
  const baseGross = working.positionLedger.realizedGrossPnl;
  const baseFees = working.positionLedger.totalFees || money(positionQuantity * entryPrice * loaded.feeSchedule.takerRate);
  const stopNet = money(
    baseGross +
    remainingQuantity * (entryPrice - stopPrice) -
    baseFees -
    remainingQuantity * stopPrice * loaded.feeSchedule.takerRate +
    working.positionLedger.netFunding,
  );
  const branches: ExecutionAmbiguityBranch[] = [{
    id: `execution-branch:${canonicalHash([working.id, path.id, "stop-first"]).slice("fnv1a64:".length)}`,
    label: "stop-first",
    orderedOrderIds: orderIds.filter((id) => id.includes("stop") || orderById(working, id)?.kind === "protectiveStop"),
    estimatedNetPnl: stopNet,
  }];
  const touchedTargetOrders = activeTargets(working)
    .filter((order) => orderIds.includes(order.id))
    .sort((left, right) => right.limitPrice! - left.limitPrice! || left.id.localeCompare(right.id));
  const targetAllocations = touchedTargetOrders.length
    ? touchedTargetOrders.map((order) => ({ quantity: order.remainingQuantity, price: order.limitPrice!, id: order.id }))
    : [...loaded.tradePlan.targetPlans]
        .filter((target) => orderIds.includes(target.id))
        .sort((left, right) => right.targetPrice - left.targetPrice || left.id.localeCompare(right.id))
        .map((target) => ({
          quantity: floorToStep(positionQuantity * target.positionFraction, loaded.venueRules.quantityStep),
          price: target.targetPrice,
          id: target.id,
        }));
  if (targetAllocations.length) {
    let branchRemaining = remainingQuantity;
    let branchGross = baseGross;
    let branchFees = baseFees;
    const branchOrderIds: string[] = [];
    for (const target of targetAllocations) {
      const fillQuantity = Math.min(branchRemaining, target.quantity);
      if (fillQuantity <= 0) continue;
      branchGross += fillQuantity * (entryPrice - target.price);
      branchFees += fillQuantity * target.price * loaded.feeSchedule.makerRate;
      branchRemaining = quantity(branchRemaining - fillQuantity, 12);
      branchOrderIds.push(target.id);
    }
    const stopInBranch = orderIds.some((id) => id.includes("stop") || orderById(working, id)?.kind === "protectiveStop");
    if (stopInBranch && branchRemaining > 0) {
      branchGross += branchRemaining * (entryPrice - stopPrice);
      branchFees += branchRemaining * stopPrice * loaded.feeSchedule.takerRate;
      branchOrderIds.push(...orderIds.filter((id) => id.includes("stop") || orderById(working, id)?.kind === "protectiveStop"));
    }
    const targetNet = money(branchGross - branchFees + working.positionLedger.netFunding);
    branches.push({
      id: `execution-branch:${canonicalHash([working.id, path.id, "target-first"]).slice("fnv1a64:".length)}`,
      label: "target-first",
      orderedOrderIds: branchOrderIds,
      estimatedNetPnl: targetNet,
    });
  }
  return branches;
}

function failExecution(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  eventTime: number,
  processingAsOf: number,
  error: string,
) {
  working.errors.push(error);
  working.result = buildResult(working, loaded, "Failed", null, null);
  appendEvent(working, {
    type: "ExecutionFailed",
    eventTime,
    processingAsOf,
    stateAfter: "Failed",
    explanation: error,
  });
}

function makeFill(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  order: ExecutionOrder,
  path: AtomicPricePath,
  referencePrice: number,
  liquidityRole: ExecutionFill["liquidityRole"],
  slippageBps: number,
  purpose: "entry" | "target" | "stop" | "forcedHorizonClose",
  quantity = order.quantity,
): ExecutionFill {
  const slipped = slippageBps > 0
    ? adversePrice(referencePrice, slippageBps, order.side, loaded.venueRules.priceTick)
    : { price: referencePrice, adjustment: 0 };
  const slippage: ExecutionSlippageRecord | null = slippageBps > 0 ? {
    model: loaded.executionProfile.slippageModel.model,
    version: loaded.executionProfile.slippageModel.version,
    bps: slippageBps,
    referencePrice,
    signedPriceAdjustment: slipped.adjustment,
    finalFillPrice: slipped.price,
  } : null;
  const feeRate = liquidityRole === "maker" || liquidityRole === "assumedMaker"
    ? loaded.feeSchedule.makerRate
    : loaded.feeSchedule.takerRate;
  const definition = {
    schemaVersion: EXECUTION_FILL_SCHEMA_VERSION,
    orderId: order.id,
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    side: order.side,
    quantity,
    referencePrice,
    price: slipped.price,
    slippage,
    liquidityRole,
    feeRate,
    feeAmount: money(slipped.price * quantity * feeRate),
    feeCurrency: loaded.tradePlan.accountState.quoteCurrency,
    feeScheduleRef: versionedRef(loaded.feeSchedule),
    sourceObservationIds: [path.id],
    dataQualityNotes: [
      ...(path.exact ? [] : [`${purpose.toUpperCase()}_CANDLE_APPROXIMATION`]),
      ...(liquidityRole.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []),
    ],
  };
  return {
    ...definition,
    id: `execution-fill:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
}

function applyEntryToLedger(working: WorkingSession, loaded: ExecutionLoadedCase, fill: ExecutionFill) {
  const ledger = working.positionLedger;
  ledger.originalFilledQuantity = fill.quantity;
  ledger.remainingQuantity = fill.quantity;
  ledger.averageEntryPrice = fill.price;
  ledger.initialNotional = money(fill.quantity * fill.price);
  ledger.initialMargin = money(ledger.initialNotional / ledger.selectedLeverage);
  ledger.maximumMarginUsed = ledger.initialMargin;
  ledger.marginAllocation = ledger.initialMargin;
  ledger.entryFees = fill.feeAmount;
  ledger.totalFees = fill.feeAmount;
  ledger.remainingProtectiveStopQuantity = fill.quantity;
  ledger.bankruptcyBoundApprox = fill.price + ledger.initialMargin / fill.quantity;
  refreshNetLedger(working);
}

function applyExitToLedger(working: WorkingSession, fill: ExecutionFill) {
  const ledger = working.positionLedger;
  const priorExitQuantity = ledger.originalFilledQuantity - ledger.remainingQuantity;
  const newExitQuantity = priorExitQuantity + fill.quantity;
  ledger.averageExitPrice = newExitQuantity > 0
    ? money(((ledger.averageExitPrice ?? 0) * priorExitQuantity + fill.price * fill.quantity) / newExitQuantity)
    : null;
  ledger.realizedGrossPnl = money(
    ledger.realizedGrossPnl + fill.quantity * (ledger.averageEntryPrice! - fill.price),
  );
  ledger.remainingQuantity = quantity(
    Math.max(0, ledger.remainingQuantity - fill.quantity),
    12,
  );
  ledger.exitFees = money(ledger.exitFees + fill.feeAmount);
  ledger.totalFees = money(ledger.entryFees + ledger.exitFees);
  ledger.remainingProtectiveStopQuantity = ledger.remainingQuantity;
  refreshNetLedger(working);
}

function finalizeLedger(working: WorkingSession) {
  const ledger = working.positionLedger;
  ledger.remainingQuantity = 0;
  ledger.unrealizedGrossPnl = 0;
  ledger.unrealizedNetPnlExcludingUnknownFutureCosts = 0;
  ledger.remainingProtectiveStopQuantity = 0;
  ledger.openTargetQuantities = {};
  refreshNetLedger(working);
  ledger.accountEquityAfter = money(ledger.accountEquityBefore + ledger.realizedNetPnl);
}

function markOpenLedger(working: WorkingSession, mark: number) {
  const ledger = working.positionLedger;
  ledger.unrealizedGrossPnl = money(ledger.remainingQuantity * (ledger.averageEntryPrice! - mark));
  ledger.unrealizedNetPnlExcludingUnknownFutureCosts = ledger.unrealizedGrossPnl;
  refreshNetLedger(working);
}

function refreshNetLedger(working: WorkingSession) {
  const ledger = working.positionLedger;
  ledger.realizedNetPnl = money(ledger.realizedGrossPnl - ledger.totalFees + ledger.netFunding);
}

function trackExcursion(working: WorkingSession, path: AtomicPricePath) {
  const entry = entryFill(working);
  if (!entry) return;
  const entryOrder = orderById(working, entry.orderId);
  if (!path.exact && entry.eventTime === path.eventTime && entryOrder?.kind !== "entryMarket") return;
  const observation: ExecutionExcursionObservation = {
    sourceObservationId: path.id,
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    resolution: path.resolution,
    high: path.high,
    low: path.low,
  };
  if (!working.excursionObservations.some((item) => item.sourceObservationId === path.id)) {
    working.excursionObservations.push(observation);
  }
  const adverseLoss = working.positionLedger.remainingQuantity * Math.max(
    0,
    path.high - working.positionLedger.averageEntryPrice!,
  );
  working.positionLedger.maximumAdverseUnrealizedLoss = money(Math.max(
    working.positionLedger.maximumAdverseUnrealizedLoss,
    adverseLoss,
  ));
}

function buildResult(
  working: WorkingSession,
  loaded: ExecutionLoadedCase,
  status: ExecutionResult["status"],
  closeReason: ExecutionResult["closeReason"],
  ambiguity: ExecutionAmbiguity | null,
): ExecutionResult {
  const entry = entryFill(working);
  const exits = working.fills.filter((fill) => fill.side === "buy").map((fill): ExecutionExitSummary => {
    const order = orderById(working, fill.orderId)!;
    const kind = order.kind === "target" ? "target" : closeReason === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: fill.id,
      kind,
      targetId: order.parentTargetId,
      quantity: fill.quantity,
      price: fill.price,
      eventTime: fill.eventTime,
      grossPnl: entry ? money(fill.quantity * (entry.price - fill.price)) : 0,
      fee: fill.feeAmount,
    };
  });
  const stopExit = exits.find((item) => item.kind === "stop") ?? null;
  const excursion = excursionMetrics(working, entry);
  const fundingIncomplete =
    !loaded.dataBundle.fundingDataAvailable ||
    working.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE");
  const markedNet = money(
    working.positionLedger.realizedNetPnl + working.positionLedger.unrealizedGrossPnl,
  );
  const completeness: ExecutionResult["actualNetPnlCompleteness"] = ambiguity
    ? "ambiguous"
    : fundingIncomplete
      ? "fundingIncomplete"
      : "complete";
  const actualNetPnl = completeness === "complete" ? markedNet : null;
  const projected = loaded.tradePlan.sizingResult.projectedLossAtStop;
  const budget = loaded.tradePlan.sizingResult.riskBudget;
  const firstTargetTime = exits.filter((item) => item.kind === "target").map((item) => item.eventTime).sort()[0] ?? null;
  const lastExitTime = exits.length ? Math.max(...exits.map((item) => item.eventTime)) : null;
  const definition = {
    schemaVersion: EXECUTION_RESULT_SCHEMA_VERSION,
    executionSessionId: working.id,
    replaySessionId: working.replaySessionId,
    replayFrameId: working.replayFrameId,
    decisionSnapshotId: working.decisionSnapshotId,
    tradePlanId: loaded.tradePlan.id,
    tradePlanSchemaVersion: working.tradePlanSchemaVersion,
    strategyProfileRef: working.strategyProfileRef,
    lifecycleVersion: working.lifecycleVersion,
    lifecycleConfigHash: working.lifecycleConfigHash,
    sizingModelVersion: working.sizingModelVersion,
    replayEngineVersion: working.replayEngineVersion,
    executionProfileRef: working.executionProfileRef,
    venueRulesRef: working.venueRulesRef,
    feeScheduleRef: working.feeScheduleRef,
    marketDataBundleFingerprint: working.marketDataBundleFingerprint,
    usedMarketDataFingerprint: canonicalHash(
      working.pathResolutionRecords.flatMap((record) => record.sourceObservationIds),
    ),
    pathResolutionRecords: immutableJsonClone(working.pathResolutionRecords),
    fundingDataFingerprint: loaded.dataBundle.fundingDataAvailable
      ? canonicalHash(working.fundingRecords.map((record) => record.observationId))
      : null,
    status,
    closeReason,
    entrySummary: entry,
    exitSummary: exits,
    targetSummary: exits.filter((item) => item.kind === "target"),
    stopSummary: stopExit,
    fundingSummary: {
      received: working.positionLedger.fundingReceived,
      paid: working.positionLedger.fundingPaid,
      net: working.positionLedger.netFunding,
      records: working.fundingRecords.length,
    },
    feeSummary: {
      entry: working.positionLedger.entryFees,
      exit: working.positionLedger.exitFees,
      total: working.positionLedger.totalFees,
      currency: loaded.tradePlan.accountState.quoteCurrency,
    },
    plannedRiskBudget: budget,
    projectedLossAtStop: projected,
    actualRealizedLossOrProfit: working.positionLedger.realizedGrossPnl,
    actualNetPnl,
    netPnlExcludingUnknownFunding: markedNet,
    actualNetPnlCompleteness: completeness,
    budgetR: actualNetPnl != null && budget ? actualNetPnl / budget : null,
    plannedRiskR: actualNetPnl != null && projected ? actualNetPnl / projected : null,
    grossR: projected ? working.positionLedger.realizedGrossPnl / projected : null,
    netR: actualNetPnl != null && projected ? actualNetPnl / projected : null,
    ...excursion,
    holdingDuration: entry ? (lastExitTime ?? working.executionHorizonTime) - entry.eventTime : null,
    timeToFirstTarget: entry && firstTargetTime != null ? firstTargetTime - entry.eventTime : null,
    timeToStop: entry && stopExit ? stopExit.eventTime - entry.eventTime : null,
    timeToFullExit: entry && lastExitTime != null && working.positionLedger.remainingQuantity === 0
      ? lastExitTime - entry.eventTime
      : null,
    initialNotional: working.positionLedger.initialNotional,
    averageEntry: working.positionLedger.averageEntryPrice,
    averageExit: working.positionLedger.averageExitPrice,
    maximumMarginUsed: working.positionLedger.maximumMarginUsed,
    entrySlippage: entry?.slippage ?? null,
    stopSlippage: stopExit ? working.fills.find((fill) => fill.id === stopExit.fillId)?.slippage ?? null : null,
    actualVsProjectedStopLoss: stopExit && projected
      ? money(-working.positionLedger.realizedNetPnl - projected)
      : null,
    ambiguity,
    dataQualityNotes: [...new Set(working.dataQualityNotes)],
    executionModelVersion: EXECUTION_ENGINE_VERSION,
  };
  return {
    ...definition,
    id: `execution-result:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
}

function excursionMetrics(working: WorkingSession, entry: ExecutionFill | null) {
  if (!entry || !working.excursionObservations.length) return {
    maximumAdverseExcursion: null,
    maximumFavorableExcursion: null,
    maePrice: null,
    mfePrice: null,
    maeTime: null,
    mfeTime: null,
    excursionResolution: null,
  };
  const highest = working.excursionObservations.reduce((best, item) => item.high > best.high ? item : best);
  const lowest = working.excursionObservations.reduce((best, item) => item.low < best.low ? item : best);
  return {
    maximumAdverseExcursion: Math.max(0, highest.high - entry.price),
    maximumFavorableExcursion: Math.max(0, entry.price - lowest.low),
    maePrice: highest.high,
    mfePrice: lowest.low,
    maeTime: highest.eventTime,
    mfeTime: lowest.eventTime,
    excursionResolution: finestResolution(working.excursionObservations.map((item) => item.resolution)),
  };
}

function appendEvent(working: WorkingSession, input: EventInput) {
  const stateBefore = working.state;
  const prior = working.executionEvents.at(-1);
  if (prior && input.processingAsOf < prior.processingAsOf) {
    throw new Error("Execution event processing time cannot move backward");
  }
  if (input.stateAfter && input.stateAfter !== stateBefore) {
    assertTransition(stateBefore, input.stateAfter);
    working.state = input.stateAfter;
    working.stateSince = input.eventTime;
  }
  working.currentAsOf = Math.max(working.currentAsOf, input.processingAsOf);
  const definition = {
    schemaVersion: EXECUTION_EVENT_SCHEMA_VERSION,
    executionSessionId: working.id,
    sequence: working.executionEvents.length,
    type: input.type,
    eventTime: input.eventTime,
    processingAsOf: input.processingAsOf,
    stateBefore,
    stateAfter: working.state,
    orderIds: input.orderIds ?? [],
    fillIds: input.fillIds ?? [],
    quantity: input.quantity ?? null,
    referencePrice: input.referencePrice ?? null,
    actualPrice: input.actualPrice ?? null,
    feeAmount: input.feeAmount ?? null,
    fundingAmount: input.fundingAmount ?? null,
    sourceObservationIds: input.sourceObservationIds ?? [],
    explanation: input.explanation,
    dataQualityNotes: input.dataQualityNotes ?? [],
    ordersAfter: immutableJsonClone(working.orders),
    fillsAfter: immutableJsonClone(working.fills),
    positionLedgerAfter: immutableJsonClone(working.positionLedger),
    pathResolutionRecordsAfter: immutableJsonClone(working.pathResolutionRecords),
    fundingRecordsAfter: immutableJsonClone(working.fundingRecords),
    excursionObservationsAfter: immutableJsonClone(working.excursionObservations),
    resultAfter: immutableJsonClone(working.result),
    sessionDataQualityNotesAfter: [...working.dataQualityNotes],
    errorsAfter: [...working.errors],
  };
  const event: ExecutionEvent = {
    ...definition,
    id: `execution-event:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
  working.executionEvents.push(event);
  working.revision = working.executionEvents.length;
}

function replaceLastEventResult(working: WorkingSession) {
  const prior = working.executionEvents.pop();
  if (!prior) throw new Error("Execution has no event to finalize");
  const definition = {
    ...prior,
    id: undefined,
    sequence: working.executionEvents.length,
    ordersAfter: immutableJsonClone(working.orders),
    fillsAfter: immutableJsonClone(working.fills),
    positionLedgerAfter: immutableJsonClone(working.positionLedger),
    pathResolutionRecordsAfter: immutableJsonClone(working.pathResolutionRecords),
    fundingRecordsAfter: immutableJsonClone(working.fundingRecords),
    excursionObservationsAfter: immutableJsonClone(working.excursionObservations),
    resultAfter: immutableJsonClone(working.result),
    sessionDataQualityNotesAfter: [...working.dataQualityNotes],
    errorsAfter: [...working.errors],
  };
  const { id: _undefined, ...eventDefinition } = definition;
  working.executionEvents.push({
    ...eventDefinition,
    id: `execution-event:${canonicalHash(eventDefinition).slice("fnv1a64:".length)}`,
  });
  working.revision = working.executionEvents.length;
}

function cancelOrder(
  working: WorkingSession,
  order: ExecutionOrder,
  path: AtomicPricePath,
  explanation: string,
) {
  order.status = "cancelled";
  order.remainingQuantity = 0;
  if (order.parentTargetId) delete working.positionLedger.openTargetQuantities[order.parentTargetId];
  appendEvent(working, {
    type: "OrderCancelled",
    eventTime: path.eventTime,
    processingAsOf: path.processingAsOf,
    orderIds: [order.id],
    sourceObservationIds: [path.id],
    explanation,
  });
}

function makeOrder(
  sessionId: string,
  input: Omit<ExecutionOrder, "schemaVersion" | "id">,
): ExecutionOrder {
  const definition = { schemaVersion: EXECUTION_ORDER_SCHEMA_VERSION, ...input };
  return {
    ...definition,
    id: `execution-order:${canonicalHash([sessionId, definition]).slice("fnv1a64:".length)}`,
  };
}

function emptyLedger(loaded: ExecutionLoadedCase): PositionLedger {
  return {
    schemaVersion: POSITION_LEDGER_SCHEMA_VERSION,
    originalFilledQuantity: 0,
    remainingQuantity: 0,
    averageEntryPrice: null,
    averageExitPrice: null,
    initialNotional: 0,
    initialMargin: 0,
    maximumMarginUsed: 0,
    realizedGrossPnl: 0,
    unrealizedGrossPnl: 0,
    entryFees: 0,
    exitFees: 0,
    totalFees: 0,
    fundingReceived: 0,
    fundingPaid: 0,
    netFunding: 0,
    realizedNetPnl: 0,
    unrealizedNetPnlExcludingUnknownFutureCosts: 0,
    accountEquityBefore: loaded.tradePlan.accountState.equity,
    accountEquityAfter: null,
    remainingProtectiveStopQuantity: 0,
    openTargetQuantities: {},
    selectedLeverage: loaded.tradePlan.sizingResult.selectedLeverage!,
    marginAllocation: 0,
    maximumAdverseUnrealizedLoss: 0,
    bankruptcyBoundApprox: null,
    liquidationEvaluation: loaded.venueRules.liquidationModel ? "VerifiedModelNotImplemented" : "Unavailable",
  };
}

function allocateTargets(
  total: number,
  targets: Array<{ id: string; fraction: number }>,
  step: number,
) {
  const allocations: Record<string, number> = {};
  let allocated = 0;
  targets.forEach((target, index) => {
    const amount = index === targets.length - 1
      ? quantity(total - allocated, decimalPlaces(step))
      : floorToStep(total * target.fraction, step);
    allocations[target.id] = Math.max(0, amount);
    allocated = quantity(allocated + amount, decimalPlaces(step));
  });
  if (allocated > total + step * 1e-9) throw new Error("Target allocation exceeds filled position");
  return allocations;
}

function limitSellFills(
  path: AtomicPricePath,
  limit: number,
  policy: { policy: string; penetrationTicks: number },
  tick: number,
) {
  if (policy.policy === "ExactDataRequired") return path.exact && path.high >= limit;
  if (policy.policy === "PenetrationByTicks") return path.high >= limit + policy.penetrationTicks * tick;
  return path.high >= limit;
}

function limitBuyFills(
  path: AtomicPricePath,
  limit: number,
  policy: { policy: string; penetrationTicks: number },
  tick: number,
) {
  if (policy.policy === "ExactDataRequired") return path.exact && path.low <= limit;
  if (policy.policy === "PenetrationByTicks") return path.low <= limit - policy.penetrationTicks * tick;
  return path.low <= limit;
}

function evaluateStopTrigger(
  loaded: ExecutionLoadedCase,
  path: AtomicPricePath,
  triggerPrice: number,
): { touched: boolean; referencePrice: number; unavailable: boolean } {
  const source = loaded.executionProfile.stopTriggerPolicy.source;
  if (source === "last") {
    return {
      touched: path.high >= triggerPrice,
      referencePrice: path.open >= triggerPrice ? path.open : triggerPrice,
      unavailable: false,
    };
  }
  const observations = source === "mark"
    ? loaded.dataBundle.markPrices
    : loaded.dataBundle.indexPrices;
  const points = observations.filter((item) =>
    item.eventTime >= path.eventTime &&
    item.eventTime < Math.max(path.intervalEnd, path.eventTime + 1) &&
    item.knownAt <= path.processingAsOf,
  );
  const crossing = points.find((item) => (item.bid + item.ask) / 2 >= triggerPrice);
  if (crossing) {
    return {
      touched: true,
      referencePrice: Math.max(triggerPrice, (crossing.bid + crossing.ask) / 2),
      unavailable: false,
    };
  }
  if (points.length) return { touched: false, referencePrice: triggerPrice, unavailable: false };
  if (loaded.executionProfile.stopTriggerPolicy.authorizedFallback === "last") {
    return {
      touched: path.high >= triggerPrice,
      referencePrice: path.open >= triggerPrice ? path.open : triggerPrice,
      unavailable: false,
    };
  }
  return { touched: false, referencePrice: triggerPrice, unavailable: true };
}

function touchedExitOrderIdsForProspectiveEntry(loaded: ExecutionLoadedCase, path: AtomicPricePath) {
  const ids: string[] = [];
  if (evaluateStopTrigger(loaded, path, loaded.tradePlan.stopPlan.stopPrice).touched) ids.push("planned-stop");
  for (const target of loaded.tradePlan.targetPlans) if (path.low <= target.targetPrice) ids.push(target.id);
  return ids;
}

function adversePrice(reference: number, bps: number, side: "sell" | "buy", tick: number) {
  const raw = side === "sell" ? reference * (1 - bps / 10_000) : reference * (1 + bps / 10_000);
  const price = normalizePrice(raw, tick, side === "sell" ? "down" : "up");
  return { price, adjustment: money(price - reference) };
}

function normalizePrice(value: number, tick: number, direction: "up" | "down") {
  const units = direction === "up"
    ? Math.ceil(value / tick - 1e-12)
    : Math.floor(value / tick + 1e-12);
  return quantity(units * tick, decimalPlaces(tick));
}

function floorToStep(value: number, step: number) {
  return quantity(Math.floor(value / step + 1e-12) * step, decimalPlaces(step));
}

function money(value: number) {
  return quantity(value, 12);
}

function quantity(value: number, decimals: number) {
  return Number(value.toFixed(Math.min(15, Math.max(decimals, 0))));
}

function decimalPlaces(value: number) {
  const text = value.toString().toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
}

function entryExpiry(working: WorkingSession, loaded: ExecutionLoadedCase) {
  return Math.min(
    loaded.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    working.executionHorizonTime,
  );
}

function activeEntry(working: WorkingSession) {
  return working.orders.find((order) => order.kind.startsWith("entry") && order.status === "active") ?? null;
}

function entryFill(working: WorkingSession) {
  return working.fills.find((fill) => orderById(working, fill.orderId)?.kind.startsWith("entry")) ?? null;
}

function activeStop(working: WorkingSession) {
  return working.orders.find((order) => order.kind === "protectiveStop" && order.status === "active") ?? null;
}

function activeTargets(working: WorkingSession) {
  return working.orders.filter((order) => order.kind === "target" && order.status === "active");
}

function activeProtection(working: WorkingSession) {
  return working.orders.filter((order) =>
    (order.kind === "protectiveStop" || order.kind === "target") && order.status === "active",
  );
}

function orderById(working: WorkingSession, id: string) {
  return working.orders.find((order) => order.id === id) ?? null;
}

function versionedRef(value: { id: string; version: string; canonicalConfigHash: string }) {
  return { id: value.id, version: value.version, hash: value.canonicalConfigHash };
}

function finestResolution(resolutions: string[]) {
  if (resolutions.includes("trade")) return "trade";
  return [...resolutions].sort((left, right) => strictTimeframeToSeconds(left) - strictTimeframeToSeconds(right))[0] ?? null;
}

function assertTransition(before: ExecutionSessionState, after: ExecutionSessionState) {
  const allowed: Record<ExecutionSessionState, ExecutionSessionState[]> = {
    Created: ["PendingEntry", "Failed"],
    PendingEntry: ["Open", "EntryExpired", "Ambiguous", "Failed"],
    Open: ["PartiallyClosed", "Closed", "OpenAtHorizon", "Ambiguous", "Failed"],
    PartiallyClosed: ["PartiallyClosed", "Closed", "OpenAtHorizon", "Ambiguous", "Failed"],
    Closed: [],
    EntryExpired: [],
    OpenAtHorizon: [],
    Ambiguous: [],
    Failed: [],
  };
  if (!allowed[before].includes(after)) throw new Error(`Invalid execution transition ${before} -> ${after}`);
}

function assertLoadedCase(loaded: ExecutionLoadedCase) {
  if (
    loaded.dataBundle.schemaVersion !== "execution-data-bundle.1" ||
    loaded.executionProfile.executionEngineVersion !== EXECUTION_ENGINE_VERSION
  ) throw new Error("Execution case identity is invalid");
  if (loaded.tradePlan.snapshotId !== loaded.replayFrame.decisionSnapshot.id) {
    throw new Error("Execution TradePlan snapshot mismatch");
  }
}

function assertSessionMatchesLoaded(session: ExecutionSession, loaded: ExecutionLoadedCase) {
  const fresh = createExecutionSession(loaded);
  const sessionIdentity = executionSessionIdentity(session);
  const freshIdentity = executionSessionIdentity(fresh);
  if (canonicalSerialize(sessionIdentity) !== canonicalSerialize(freshIdentity)) {
    throw new Error("Execution session does not match the loaded case");
  }
}

function mutableSession(session: ExecutionSession): WorkingSession {
  const mutable = JSON.parse(canonicalSerialize(session)) as ExecutionSession;
  const { integrityHash: _ignored, ...definition } = mutable;
  return definition;
}

function sealSession(working: WorkingSession): ExecutionSession {
  const definition = immutableJsonClone(working);
  return immutableJsonClone({ ...definition, integrityHash: canonicalHash(definition) });
}

function executionSessionIdentity(session: ExecutionSession): ExecutionSessionIdentity {
  return {
    id: session.id,
    schemaVersion: session.schemaVersion,
    replaySessionId: session.replaySessionId,
    replayFrameId: session.replayFrameId,
    decisionSnapshotId: session.decisionSnapshotId,
    tradePlanId: session.tradePlanId,
    tradePlanSchemaVersion: session.tradePlanSchemaVersion,
    strategyProfileRef: session.strategyProfileRef,
    lifecycleVersion: session.lifecycleVersion,
    lifecycleConfigHash: session.lifecycleConfigHash,
    sizingModelVersion: session.sizingModelVersion,
    replayEngineVersion: session.replayEngineVersion,
    executionEngineVersion: session.executionEngineVersion,
    executionProfileRef: session.executionProfileRef,
    venueRulesRef: session.venueRulesRef,
    feeScheduleRef: session.feeScheduleRef,
    marketDataBundleFingerprint: session.marketDataBundleFingerprint,
    fundingDataFingerprint: session.fundingDataFingerprint,
    decisionTime: session.decisionTime,
    orderActivationTime: session.orderActivationTime,
    executionHorizonTime: session.executionHorizonTime,
  };
}

export function validateExecutionSessionIntegrity(session: ExecutionSession) {
  if (session.schemaVersion !== EXECUTION_SESSION_SCHEMA_VERSION) {
    throw new Error("Unsupported execution session schema");
  }
  const { integrityHash, ...definition } = session;
  if (canonicalHash(definition) !== integrityHash) throw new Error("Execution session integrity mismatch");
  const reconstructed = reconstructExecutionSessionFromEvents(session);
  if (canonicalSerialize(reconstructed) !== canonicalSerialize(session)) {
    throw new Error("Execution event-log reconstruction differs from direct state");
  }
}

export function reconstructExecutionSessionFromEvents(session: ExecutionSession): ExecutionSession {
  const identity = executionSessionIdentity(session);
  const working: WorkingSession = {
    ...identity,
    revision: 0,
    currentAsOf: identity.decisionTime,
    state: "Created",
    stateSince: identity.decisionTime,
    orders: [],
    fills: [],
    positionLedger: session.executionEvents[0]?.positionLedgerAfter ?? session.positionLedger,
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [],
    errors: [],
  };
  for (const event of session.executionEvents) {
    const { id, ...definition } = event;
    if (
      event.schemaVersion !== EXECUTION_EVENT_SCHEMA_VERSION ||
      event.executionSessionId !== session.id ||
      event.sequence !== working.executionEvents.length ||
      id !== `execution-event:${canonicalHash(definition).slice("fnv1a64:".length)}` ||
      event.stateBefore !== working.state
    ) throw new Error(`Invalid execution event ${event.id}`);
    if (event.stateAfter !== event.stateBefore) assertTransition(event.stateBefore, event.stateAfter);
    if (event.processingAsOf < working.currentAsOf) {
      throw new Error(`Execution event processing time moved backward at ${event.id}`);
    }
    working.state = event.stateAfter;
    if (event.stateAfter !== event.stateBefore) working.stateSince = event.eventTime;
    working.currentAsOf = Math.max(working.currentAsOf, event.processingAsOf);
    working.orders = immutableJsonClone(event.ordersAfter);
    working.fills = immutableJsonClone(event.fillsAfter);
    working.positionLedger = immutableJsonClone(event.positionLedgerAfter);
    working.pathResolutionRecords = immutableJsonClone(event.pathResolutionRecordsAfter);
    working.fundingRecords = immutableJsonClone(event.fundingRecordsAfter);
    working.excursionObservations = immutableJsonClone(event.excursionObservationsAfter);
    working.result = immutableJsonClone(event.resultAfter);
    working.dataQualityNotes = [...event.sessionDataQualityNotesAfter];
    working.errors = [...event.errorsAfter];
    assertEventSnapshotInvariants(working, event);
    working.executionEvents.push(immutableJsonClone(event));
    working.revision += 1;
  }
  return sealSession(working);
}

function assertEventSnapshotInvariants(working: WorkingSession, event: ExecutionEvent) {
  const orderIds = new Set<string>();
  for (const order of working.orders) {
    if (
      orderIds.has(order.id) ||
      order.quantity <= 0 ||
      order.remainingQuantity < 0 ||
      order.remainingQuantity > order.quantity
    ) throw new Error(`Invalid execution order snapshot at ${event.id}`);
    orderIds.add(order.id);
  }
  const fillIds = new Set<string>();
  let entered = 0;
  let exited = 0;
  let fees = 0;
  for (const fill of working.fills) {
    if (
      fillIds.has(fill.id) ||
      !orderIds.has(fill.orderId) ||
      fill.quantity <= 0 ||
      fill.price <= 0 ||
      fill.feeAmount < 0
    ) throw new Error(`Invalid execution fill snapshot at ${event.id}`);
    fillIds.add(fill.id);
    if (fill.side === "sell") entered += fill.quantity;
    else exited += fill.quantity;
    fees += fill.feeAmount;
  }
  if (exited > entered + 1e-9 || Math.abs(working.positionLedger.remainingQuantity - (entered - exited)) > 1e-8) {
    throw new Error(`Execution quantity conservation failed at ${event.id}`);
  }
  if (Math.abs(working.positionLedger.totalFees - money(fees)) > 1e-9) {
    throw new Error(`Execution fee conservation failed at ${event.id}`);
  }
  if (TERMINAL_STATES.has(working.state) && working.result == null) {
    throw new Error(`Terminal execution event has no result at ${event.id}`);
  }
  if (working.result) {
    const { id, ...definition } = working.result;
    if (id !== `execution-result:${canonicalHash(definition).slice("fnv1a64:".length)}`) {
      throw new Error(`Execution result identity mismatch at ${event.id}`);
    }
  }
}

export function serializeExecutionSession(session: ExecutionSession) {
  validateExecutionSessionIntegrity(session);
  return canonicalSerialize(session);
}

export function deserializeExecutionSession(serialized: string): ExecutionSession {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("Serialized execution session must be an object");
  }
  const session = parsed as ExecutionSession;
  validateExecutionSessionIntegrity(session);
  return immutableJsonClone(session);
}

function assertTimestamp(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be a valid timestamp`);
}
