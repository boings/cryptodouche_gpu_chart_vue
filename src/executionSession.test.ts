import { describe, expect, it } from "vitest";
import planningFixture from "../fixtures/impulse-fade-trade-planning.example.json";
import {
  createExecutionCandleObservation,
  createExecutionQuoteObservation,
  createExecutionTradeObservation,
  createExecutionProfile,
  createExperimentalExecutionProfile,
  createFundingObservation,
  createResearchVenueExecutionRules,
  createVenueFeeSchedule,
  createVenueExecutionRules,
  InMemoryReplayExecutionDataAdapter,
  loadExecutionCase,
  VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  type ExecutionCandleObservation,
  type ExecutionLoadedCase,
  type ExecutionProfile,
  type ExecutionProfileDefinition,
  type ExecutionQuoteObservation,
  type ExecutionTradeObservation,
  type FundingObservation,
} from "./execution";
import {
  advanceExecutionTo,
  createExecutionSession,
  deserializeExecutionSession,
  reconstructExecutionSessionFromEvents,
  serializeExecutionSession,
  simulateExecutionToHorizon,
} from "./executionSession";
import { revealExecutionOutcome } from "./executionReveal";
import { REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION } from "./replay";
import type { ReplayDecisionFrame, ReplayOutcomeEnvelope, ReplaySession } from "./replaySession";
import { canonicalHash } from "./serialization";
import type { StrategyProfile } from "./strategy";
import { tradePlanId, type TargetPlan, type TradePlan } from "./tradePlanning";

const decisionTime = 1_700_000_000;
const firstOpen = 1_700_000_100;
const baseProfile = planningFixture.strategyProfile as StrategyProfile;
const baseSnapshot = planningFixture.snapshots.entryCandidate as ReplayDecisionFrame["decisionSnapshot"];
const basePlan = planningFixture.decisions.proposeCompliant.tradePlan as TradePlan;

describe("deterministic execution session", () => {
  it("fails closed on an advertised ambiguity policy the engine does not implement", () => {
    const standard = createExperimentalExecutionProfile(["1m", "15m"]);
    const { canonicalConfigHash: _hash, ...definition } = standard;
    expect(() => createExecutionProfile({
      ...definition,
      ambiguityPolicy: "WorstCaseBranch",
    })).toThrow("only implements StrictAmbiguity");
  });

  it("activates causally, fills the next open, and applies adverse entry and stop slippage once", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.8, 0.83, 0.79, 0.82),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.state).toBe("Closed");
    expect(result.result?.closeReason).toBe("Stop");
    expect(result.fills).toHaveLength(2);
    expect(result.fills[0]).toMatchObject({ side: "sell", referencePrice: 0.79, price: 0.7896 });
    expect(result.fills[1]).toMatchObject({ side: "buy", referencePrice: 0.825, price: 0.8259 });
    expect(result.result?.actualRealizedLossOrProfit).toBeLessThan(0);
    expect(result.positionLedger.totalFees).toBe(
      result.fills.reduce((sum, fill) => sum + fill.feeAmount, 0),
    );
    expect(result.executionEvents.find((event) => event.type === "EntryOrderFilled")?.eventTime).toBe(firstOpen);
  });

  it("fills two stepped partial targets, adjusts the stop, and cancels it at zero quantity", async () => {
    const loaded = await fixture({
      plan: marketPlan(twoTargets()),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.79, 0.8, 0.75, 0.77),
        candle(2, 0.77, 0.78, 0.71, 0.72),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);
    const targets = result.fills.filter((fill) => fill.liquidityRole === "assumedMaker");

    expect(result.state).toBe("Closed");
    expect(result.result?.closeReason).toBe("AllTargets");
    expect(targets.map((fill) => fill.quantity)).toEqual([1362.5, 1362.6]);
    expect(targets.every((fill) => fill.price <= fill.referencePrice)).toBe(true);
    expect(result.positionLedger.remainingQuantity).toBe(0);
    expect(result.orders.find((order) => order.kind === "protectiveStop")?.status).toBe("cancelled");
    expect(result.executionEvents.filter((event) => event.type === "ProtectiveStopQuantityAdjusted")).toHaveLength(1);
  });

  it("preserves target-then-stop chronology and uses StopAfterPartialTargets", async () => {
    const loaded = await fixture({
      plan: marketPlan(twoTargets()),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.79, 0.8, 0.75, 0.77),
        candle(2, 0.78, 0.84, 0.77, 0.83),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.result?.closeReason).toBe("StopAfterPartialTargets");
    expect(result.result?.targetSummary).toHaveLength(1);
    expect(result.positionLedger.remainingQuantity).toBe(0);
    expect(result.fills.reduce((sum, fill) => sum + (fill.side === "buy" ? fill.quantity : 0), 0)).toBe(2725.1);
  });

  it("expires an unfilled sell limit without creating a position or P&L", async () => {
    const plan = replan(basePlan, { entryPlan: { ...basePlan.entryPlan, intendedPrice: 0.9 } });
    const loaded = await fixture({
      plan,
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.8, 0.81, 0.77, 0.78),
        candle(2, 0.78, 0.79, 0.76, 0.77),
      ],
      horizonSeconds: 3_600,
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.state).toBe("EntryExpired");
    expect(result.fills).toEqual([]);
    expect(result.result).toMatchObject({ actualRealizedLossOrProfit: 0, netPnlExcludingUnknownFunding: 0 });
  });

  it("uses the gap opening reference and permits actual stop loss to exceed projected risk", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.9, 0.92, 0.88, 0.91),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);
    const stop = result.fills.at(-1)!;

    expect(stop.referencePrice).toBe(0.9);
    expect(stop.price).toBe(0.9009);
    expect(result.result?.actualVsProjectedStopLoss).toBeGreaterThan(0);
  });

  it("refuses to invent same-candle stop/target ordering", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.84, 0.7, 0.8)],
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.state).toBe("Ambiguous");
    expect(result.result?.actualNetPnl).toBeNull();
    expect(result.result?.ambiguity).toMatchObject({
      code: "STOP_AND_TARGET_INTRABAR_ORDER_UNKNOWN",
    });
    expect(result.result?.ambiguity?.branches.map((branch) => branch.label)).toEqual([
      "stop-first",
      "target-first",
    ]);
  });

  it("uses complete lower-timeframe candles to resolve a coarse ambiguity", async () => {
    const fine: ExecutionCandleObservation[] = [];
    for (let index = 0; index < 15; index += 1) {
      const open = firstOpen + index * 60;
      if (index === 0) fine.push(minute(open, 0.79, 0.8, 0.78, 0.795));
      else if (index === 4) fine.push(minute(open, 0.79, 0.8, 0.71, 0.73));
      else if (index === 10) fine.push(minute(open, 0.8, 0.84, 0.78, 0.83));
      else fine.push(minute(open, 0.78, 0.8, 0.77, 0.79));
    }
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.84, 0.7, 0.8), ...fine],
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.state).toBe("Closed");
    expect(result.result?.closeReason).toBe("AllTargets");
    expect(result.pathResolutionRecords.every((record) => record.selectedResolution === "1m")).toBe(true);
  });

  it("applies signed funding to the remaining short quantity and marks unavailable funding incomplete", async () => {
    const fundingTime = firstOpen + 1_800;
    const loaded = await fixture({
      plan: marketPlan(twoTargets()),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.79, 0.8, 0.75, 0.77),
        candle(2, 0.77, 0.78, 0.74, 0.76),
        candle(3, 0.76, 0.77, 0.71, 0.72),
      ],
      funding: [createFundingObservation({
        venue: "bybit",
        symbol: "FILUSDT",
        fundingTime,
        rate: 0.001,
        markPrice: 0.77,
        markPriceSource: "fixture-mark",
        dataProvenance: "deterministic test",
      })],
    });
    const funded = simulateExecutionToHorizon(loaded);
    expect(funded.fundingRecords[0]).toMatchObject({ positionQuantity: 1362.6 });
    expect(funded.positionLedger.netFunding).toBeGreaterThan(0);

    const missing = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.83, 0.79, 0.82)],
      fundingDataAvailable: false,
    }));
    expect(missing.result?.actualNetPnlCompleteness).toBe("fundingIncomplete");
    expect(missing.result?.actualNetPnl).toBeNull();
  });

  it("keeps an open position open at horizon and separates marked unrealized P&L", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      horizonSeconds: 3_600,
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.795, 0.8, 0.77, 0.78),
        candle(2, 0.78, 0.79, 0.76, 0.77),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);

    expect(result.state).toBe("OpenAtHorizon");
    expect(result.positionLedger.remainingQuantity).toBe(2725.1);
    expect(result.positionLedger.realizedGrossPnl).toBe(0);
    expect(result.positionLedger.unrealizedGrossPnl).toBeGreaterThan(0);
  });

  it("keeps incremental, batch, serialized resume, truncation, and idempotent advance equivalent", async () => {
    const candles = [
      candle(0, 0.79, 0.8, 0.78, 0.795),
      candle(1, 0.79, 0.8, 0.75, 0.77),
      candle(2, 0.78, 0.84, 0.77, 0.83),
    ];
    const loaded = await fixture({ plan: marketPlan(twoTargets()), candles });
    const batch = simulateExecutionToHorizon(loaded);
    const initial = createExecutionSession(loaded);
    expect(reconstructExecutionSessionFromEvents(initial)).toEqual(initial);
    const first = advanceExecutionTo(initial, loaded, firstOpen + 900);
    expect(reconstructExecutionSessionFromEvents(first)).toEqual(first);
    expect(advanceExecutionTo(first, loaded, firstOpen + 900)).toEqual(first);
    const resumed = deserializeExecutionSession(serializeExecutionSession(first));
    const incremental = advanceExecutionTo(resumed, loaded, firstOpen + 3 * 900);
    expect(incremental).toEqual(batch);

    const truncated = await fixture({ plan: marketPlan(twoTargets()), candles: candles.slice(0, 2) });
    const cutoff = firstOpen + 2 * 900;
    expect(advanceExecutionTo(initial, loaded, cutoff)).toEqual(
      advanceExecutionTo(createExecutionSession(truncated), truncated, cutoff),
    );
  });

  it("never exposes execution outcome through public ReplaySession serialization", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.83, 0.79, 0.82)],
    });
    simulateExecutionToHorizon(loaded);
    const publicJson = JSON.stringify(loaded.replaySession);
    expect(publicJson).not.toContain("execution-result");
    expect(publicJson).not.toContain("actualNetPnl");
    expect(publicJson).not.toContain("fills");
  });

  it("implements touch, penetration, and exact-data sell-limit policies", async () => {
    const touchCandles = [
      candle(0, 0.78, 0.79, 0.77, 0.785),
      candle(1, 0.79, 0.83, 0.78, 0.82),
      candle(2, 0.8, 0.81, 0.76, 0.77),
    ];
    const touch = simulateExecutionToHorizon(await fixture({ plan: basePlan, candles: touchCandles }));
    expect(touch.fills[0]).toMatchObject({ price: 0.79, liquidityRole: "assumedMaker" });

    for (const policy of ["PenetrationByTicks", "ExactDataRequired"] as const) {
      const unfilled = simulateExecutionToHorizon(await fixture({
        plan: basePlan,
        candles: [
          candle(0, 0.78, 0.79, 0.77, 0.785),
          candle(1, 0.78, 0.7899, 0.77, 0.78),
          candle(2, 0.78, 0.7899, 0.76, 0.77),
        ],
        profileOverrides: { restingLimitFillPolicy: { policy, penetrationTicks: 1 } },
      }));
      expect(unfilled.state).toBe("EntryExpired");
      expect(unfilled.fills).toEqual([]);
    }
  });

  it("supports sell stop-market entry and activates protection only after its fill", async () => {
    const stopEntry = replan(basePlan, {
      entryPlan: { ...basePlan.entryPlan, orderPlanType: "stopMarket", intendedPrice: 0.79, expiresAt: null },
    });
    const loaded = await fixture({
      plan: stopEntry,
      candles: [candle(0, 0.8, 0.81, 0.785, 0.79), candle(1, 0.8, 0.83, 0.79, 0.82)],
    });
    const before = advanceExecutionTo(createExecutionSession(loaded), loaded, firstOpen - 1);
    expect(before.orders.some((order) => order.reduceOnly)).toBe(false);
    const result = simulateExecutionToHorizon(loaded);
    expect(result.fills[0]).toMatchObject({ side: "sell", referencePrice: 0.79, price: 0.7896 });
    expect(result.executionEvents.findIndex((event) => event.type === "ProtectiveStopActivated")).toBeGreaterThan(
      result.executionEvents.findIndex((event) => event.type === "EntryOrderFilled"),
    );
  });

  it("force closes at the first observation after horizon with adverse market-exit slippage", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      horizonSeconds: 1_800,
      profileOverrides: { forceCloseAtHorizon: true },
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.795, 0.8, 0.77, 0.78),
        candle(2, 0.78, 0.79, 0.76, 0.77),
      ],
    });
    const result = simulateExecutionToHorizon(loaded);
    expect(result.result?.closeReason).toBe("ForcedHorizonClose");
    expect(result.fills.at(-1)).toMatchObject({ referencePrice: 0.78, price: 0.7808, liquidityRole: "taker" });
  });

  it("charges negative funding and rejects a stop beyond the bankruptcy bound", async () => {
    const funded = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [
        candle(0, 0.79, 0.8, 0.78, 0.795),
        candle(1, 0.79, 0.8, 0.78, 0.79),
        candle(2, 0.79, 0.8, 0.78, 0.79),
      ],
      funding: [createFundingObservation({
        venue: "bybit",
        symbol: "FILUSDT",
        fundingTime: firstOpen + 900,
        rate: -0.001,
        markPrice: 0.79,
        dataProvenance: "deterministic test",
      })],
    }));
    expect(funded.positionLedger.fundingPaid).toBeGreaterThan(0);
    expect(funded.positionLedger.netFunding).toBeLessThan(0);

    const underMargined = replan(basePlan, {
      sizingResult: { ...basePlan.sizingResult, initialMargin: 25 },
    });
    await expect(fixture({ plan: underMargined, candles: [candle(0, 0.79, 0.8, 0.78, 0.79)] })).rejects.toThrow(
      "bankruptcy bound",
    );
  });

  it("marks bankruptcy-bound crossing ambiguous instead of claiming a stop fill", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 1.7, 0.79, 1.6)],
    });
    const result = simulateExecutionToHorizon(loaded);
    expect(result.state).toBe("Ambiguous");
    expect(result.result?.ambiguity?.code).toBe("BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    expect(result.executionEvents.some((event) => event.type === "BankruptcyBoundCrossed")).toBe(true);
  });

  it("falls back from incomplete finer coverage and uses exact ordered trades only when declared complete", async () => {
    const incompleteFine = Array.from({ length: 14 }, (_, index) =>
      minute(firstOpen + index * 60, 0.79, index === 4 ? 0.84 : 0.8, index === 8 ? 0.7 : 0.78, 0.79),
    );
    const unresolved = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.84, 0.7, 0.8), ...incompleteFine],
    }));
    expect(unresolved.state).toBe("Ambiguous");
    expect(unresolved.pathResolutionRecords[0]?.selectedResolution).toBe("15m");

    const exact = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [],
      trades: [
        createExecutionTradeObservation({ venue: "bybit", symbol: "FILUSDT", eventTime: firstOpen, price: 0.79, quantity: 1, side: "buy" }),
        createExecutionTradeObservation({ venue: "bybit", symbol: "FILUSDT", eventTime: firstOpen + 60, price: 0.72, quantity: 1, side: "sell" }),
      ],
      tradeDataCompleteness: "complete",
    }));
    expect(exact.result?.closeReason).toBe("AllTargets");
    expect(exact.pathResolutionRecords.every((record) => record.exactOrApproximate === "exact")).toBe(true);
  });

  it("uses the configured mark series for protective stops and fails if it is unavailable", async () => {
    const markCross = createExecutionQuoteObservation({
      venue: "bybit",
      symbol: "FILUSDT",
      eventTime: firstOpen + 900,
      bid: 0.829,
      ask: 0.831,
    });
    const stopped = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.81, 0.79, 0.8)],
      markPrices: [
        createExecutionQuoteObservation({ venue: "bybit", symbol: "FILUSDT", eventTime: firstOpen, bid: 0.79, ask: 0.791 }),
        markCross,
      ],
      venueStopTriggerSources: ["last", "mark"],
      profileOverrides: { stopTriggerPolicy: { source: "mark", authorizedFallback: null } },
    }));
    expect(stopped.result?.closeReason).toBe("Stop");
    expect(stopped.fills.at(-1)?.referencePrice).toBe(0.83);

    const missing = simulateExecutionToHorizon(await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795)],
      venueStopTriggerSources: ["last", "mark"],
      profileOverrides: { stopTriggerPolicy: { source: "mark", authorizedFallback: null } },
    }));
    expect(missing.state).toBe("Failed");
    expect(missing.errors[0]).toContain("mark stop-trigger series");
  });

  it("reveals execution only after the replay outcome boundary has opened", async () => {
    const loaded = await fixture({
      plan: marketPlan(),
      candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.83, 0.79, 0.82)],
    });
    const execution = simulateExecutionToHorizon(loaded);
    const outcomeDefinition = {
      schemaVersion: REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
      sessionId: loaded.replaySession.id,
      manifestId: "manifest:execution-test",
      revealedAt: decisionTime + 10,
      revealedBeforeDecisionCompletion: false,
      outcome: {
        futureCandlesByTimeframe: {},
        lifecycleTimeline: [],
        radarTerminalResult: null,
        maximumFavorablePriceExcursionFromDetected: null,
        maximumAdversePriceExcursionFromDetected: null,
        lifecycleStateTimestamps: {},
        dataQualityNotes: [],
      },
    };
    const replayOutcomeEnvelope: ReplayOutcomeEnvelope = {
      ...outcomeDefinition,
      id: `replay-outcome:${canonicalHash(outcomeDefinition).slice("fnv1a64:".length)}`,
    };
    expect(() => revealExecutionOutcome({
      replaySession: loaded.replaySession,
      replayOutcomeEnvelope,
      executionSession: execution,
      revealedAt: decisionTime + 10,
    })).toThrow("explicit reveal boundary");

    const revealedReplay = {
      ...loaded.replaySession,
      state: "Revealed",
      revealedOutcomeEnvelopeId: replayOutcomeEnvelope.id,
    } as ReplaySession;
    const revealed = revealExecutionOutcome({
      replaySession: revealedReplay,
      replayOutcomeEnvelope,
      executionSession: execution,
      revealedAt: decisionTime + 10,
    });
    expect(revealed.executionResult.id).toBe(execution.result?.id);
    expect(revealed.executionEvents).toEqual(execution.executionEvents);
  });
});

async function fixture(options: {
  plan: TradePlan;
  candles: ExecutionCandleObservation[];
  funding?: FundingObservation[];
  fundingDataAvailable?: boolean;
  horizonSeconds?: number;
  profileOverrides?: Partial<ExecutionProfileDefinition>;
  trades?: ExecutionTradeObservation[];
  tradeDataCompleteness?: "complete" | "partial" | "unavailable";
  markPrices?: ExecutionQuoteObservation[];
  venueStopTriggerSources?: Array<"last" | "mark" | "index">;
}): Promise<ExecutionLoadedCase> {
  const frame = {
    id: "replay-frame:execution-test",
    sessionId: "replay-session:execution-test",
    effectiveAsOf: decisionTime,
    decisionSnapshot: baseSnapshot,
  } as ReplayDecisionFrame;
  const replaySession = {
    id: frame.sessionId,
    replayEngineVersion: "replay-engine.1",
    state: "TradePlanRecorded",
    currentFrameId: frame.id,
    lifecycleVersion: options.plan.lifecycleVersion,
    lifecycleConfigHash: options.plan.lifecycleConfigHash,
    planningAttempts: [{
      id: "planning-attempt:execution-test",
      frameId: frame.id,
      attemptedAt: decisionTime,
      tradePlan: options.plan,
      accepted: true,
      rejectionReason: null,
    }],
  } as ReplaySession;
  const feeSchedule = createVenueFeeSchedule({
    id: "bybit:linear-perp:research-fees",
    version: "2023-fixture.1",
    schemaVersion: VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
    venue: "bybit",
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: decisionTime,
    effectiveUntil: null,
    makerRate: options.plan.venueRules.feeSchedule.makerRate,
    takerRate: options.plan.venueRules.feeSchedule.takerRate,
    provenance: "Deterministic research fixture",
    assumptionStatus: "researchAssumption",
  });
  const researchRules = createResearchVenueExecutionRules(options.plan.venueRules, feeSchedule, decisionTime);
  const { canonicalConfigHash: _rulesHash, ...rulesDefinition } = researchRules;
  const venueRules = createVenueExecutionRules({
    ...rulesDefinition,
    stopTriggerSources: options.venueStopTriggerSources ?? rulesDefinition.stopTriggerSources,
  }, feeSchedule);
  const standard = createExperimentalExecutionProfile(["1m", "15m"]);
  const { canonicalConfigHash: _hash, ...definition } = standard;
  const executionProfile: ExecutionProfile = createExecutionProfile({
    ...definition,
    maximumExecutionHorizon: options.horizonSeconds ?? 3_600,
    ...options.profileOverrides,
  });
  return loadExecutionCase({
    replaySession,
    replayFrame: frame,
    tradePlan: options.plan,
    strategyProfile: baseProfile,
    executionProfile,
    venueRules,
    feeSchedule,
    historicalDataAdapter: new InMemoryReplayExecutionDataAdapter({
      candles: options.candles,
      funding: options.funding,
      fundingDataAvailable: options.fundingDataAvailable,
      trades: options.trades,
      tradeDataCompleteness: options.tradeDataCompleteness,
      markPrices: options.markPrices,
      venueRuleEvidence: [venueRules],
    }),
  });
}

function marketPlan(targetPlans = basePlan.targetPlans): TradePlan {
  return replan(basePlan, {
    entryPlan: { ...basePlan.entryPlan, orderPlanType: "marketNextAvailable", expiresAt: null },
    targetPlans,
  });
}

function twoTargets(): TargetPlan[] {
  return [
    { ...basePlan.targetPlans[0]!, id: "target:one", targetPrice: 0.76, positionFraction: 0.5 },
    { ...basePlan.targetPlans[0]!, id: "target:two", targetPrice: 0.72, positionFraction: 0.5 },
  ];
}

function replan(plan: TradePlan, changes: Partial<TradePlan>): TradePlan {
  const changed = { ...structuredClone(plan), ...changes };
  return { ...changed, id: tradePlanId(changed) };
}

function candle(
  offset: number,
  o: number,
  h: number,
  l: number,
  c: number,
): ExecutionCandleObservation {
  return createExecutionCandleObservation({
    venue: "bybit",
    symbol: "FILUSDT",
    timeframe: "15m",
    openTime: firstOpen + offset * 900,
    o,
    h,
    l,
    c,
  });
}

function minute(
  openTime: number,
  o: number,
  h: number,
  l: number,
  c: number,
): ExecutionCandleObservation {
  return createExecutionCandleObservation({
    venue: "bybit",
    symbol: "FILUSDT",
    timeframe: "1m",
    openTime,
    o,
    h,
    l,
    c,
  });
}
