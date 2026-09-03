import { describe, expect, it } from "vitest";
import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  impulseFadeLifecycleConfigHash,
  type SetupStateName,
  type SetupStateSnapshot,
} from "./indicators";
import {
  DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  createDecisionReferenceLevel,
  createDecisionSnapshot,
  createImpulseFadeResearchProfile,
  type DecisionSnapshot,
} from "./strategy";
import {
  calculateLinearPerpetualSizing,
  createDecisionRecord,
  createTradePlan,
  evaluateTradePlanCompliance,
  type CreateTradePlanInput,
  type LinearPerpetualSizingInput,
  type TargetPlan,
} from "./tradePlanning";

const baseSizingInput = {
  side: "short",
  intendedEntryPrice: 100,
  stopPrice: 105,
  targets: [
    {
      id: "target-1",
      targetPrice: 90,
      positionFraction: 1,
      derivationType: "manual",
      referenceLevelId: null,
      referenceLevel: null,
      rationale: "Research target",
    },
  ],
  accountState: {
    equity: 10_000,
    availableBalance: 5_000,
    quoteCurrency: "USDT",
  },
  riskRequest: {
    accountRiskFraction: 0.01,
    fixedRiskAmount: null,
    maximumMarginAllocationFraction: 0.25,
    maximumNotional: null,
  },
  executionAssumptions: {
    entryFeeRate: 0.00055,
    stopExitFeeRate: 0.00055,
    targetExitFeeRate: 0.00055,
    adverseEntrySlippageBps: 5,
    adverseStopSlippageBps: 5,
    adverseTargetSlippageBps: 5,
  },
  venueRules: {
    venue: "bybit",
    symbol: "FILUSDT",
    quantityStep: 0.1,
    priceTick: 0.001,
    minQuantity: 0.1,
    minNotional: 5,
    maxLeverage: 25,
    leverageStep: 1,
    feeSchedule: {
      makerRate: 0.0002,
      takerRate: 0.00055,
      version: "research-2026-09",
    },
    maintenanceMarginModel: null,
    liquidationModel: null,
  },
  leveragePolicy: { mode: "manual", leverage: 2 },
  stopDistanceAtr: 1.25,
} as const;

describe("linear perpetual risk sizing", () => {
  it("keeps quantity and stop risk invariant when leverage changes", () => {
    const lowLeverage = calculateLinearPerpetualSizing(baseSizingInput);
    const highLeverage = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      leveragePolicy: { mode: "manual", leverage: 10 },
    });

    expect(lowLeverage.roundedQuantity).toBe(highLeverage.roundedQuantity);
    expect(lowLeverage.projectedLossAtStop).toBe(highLeverage.projectedLossAtStop);
    expect(highLeverage.initialMargin).toBeLessThan(lowLeverage.initialMargin);
  });

  it("reduces quantity for wider stops", () => {
    const narrow = calculateLinearPerpetualSizing(baseSizingInput);
    const wide = calculateLinearPerpetualSizing({ ...baseSizingInput, stopPrice: 110 });

    expect(wide.roundedQuantity).toBeLessThan(narrow.roundedQuantity ?? 0);
    expect(wide.projectedLossAtStop).toBeLessThanOrEqual(wide.riskBudget ?? 0);
  });

  it("accounts for fees and adverse slippage before rounding quantity down", () => {
    const frictionless = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      executionAssumptions: {
        entryFeeRate: 0,
        stopExitFeeRate: 0,
        targetExitFeeRate: 0,
        adverseEntrySlippageBps: 0,
        adverseStopSlippageBps: 0,
        adverseTargetSlippageBps: 0,
      },
    });
    const costAware = calculateLinearPerpetualSizing(baseSizingInput);

    expect(costAware.roundedQuantity).toBeLessThan(frictionless.roundedQuantity ?? 0);
    expect(costAware.projectedLossAtStop).toBeLessThanOrEqual(costAware.riskBudget ?? 0);
    expect((costAware.rawQuantity ?? 0) % baseSizingInput.venueRules.quantityStep).not.toBe(0);
    expect((costAware.roundedQuantity ?? 0) % baseSizingInput.venueRules.quantityStep).toBeCloseTo(0);
    expect(costAware.effectiveEntry).toBeCloseTo(99.95, 12);
    expect(costAware.effectiveStop).toBeCloseTo(105.0525, 12);
    expect(costAware.rawQuantity).toBeCloseTo(19.174531161, 9);
    expect(costAware.roundedQuantity).toBe(19.1);
    expect(costAware.projectedLossAtStop).toBeCloseTo(99.6113012625, 9);
  });

  it("rejects invalid short stops and targets", () => {
    const invalid = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      stopPrice: 99,
      targets: [{ ...baseSizingInput.targets[0], targetPrice: 101 }],
    });

    expect(invalid.hardErrors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["STOP_NOT_ABOVE_ENTRY", "NO_VALID_TARGET"]),
    );
  });

  it("requires partial targets to sum to one and weights their projected R", () => {
    const targets: TargetPlan[] = [
      { ...baseSizingInput.targets[0], id: "target-1", targetPrice: 95, positionFraction: 0.25 },
      { ...baseSizingInput.targets[0], id: "target-2", targetPrice: 90, positionFraction: 0.75 },
    ];
    const valid = calculateLinearPerpetualSizing({ ...baseSizingInput, targets });
    const invalid = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      targets: targets.map((target) => ({ ...target, positionFraction: 0.4 })),
    });

    expect(valid.targetOutcomes[0]?.projectedR).toBeCloseTo(0.9194669691257217, 12);
    expect(valid.targetOutcomes[1]?.projectedR).toBeCloseTo(1.8792004536885822, 12);
    expect(valid.weightedProjectedR).toBeCloseTo(1.639267082547867, 12);
    expect(invalid.hardErrors.map((error) => error.code)).toContain(
      "TARGET_FRACTIONS_INVALID",
    );
  });

  it("validates manual leverage and derives minimum practical leverage", () => {
    const excessive = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      leveragePolicy: { mode: "manual", leverage: 30 },
    });
    const derivedInput: LinearPerpetualSizingInput = {
      ...baseSizingInput,
      riskRequest: {
        ...baseSizingInput.riskRequest,
        maximumMarginAllocationFraction: 0.02,
      },
      leveragePolicy: { mode: "derivedMinimum" },
    };
    const derived = calculateLinearPerpetualSizing(derivedInput);
    const impossible = calculateLinearPerpetualSizing({
      ...derivedInput,
      venueRules: { ...derivedInput.venueRules, maxLeverage: 2 },
    });

    expect(excessive.hardErrors.map((error) => error.code)).toContain(
      "MAX_LEVERAGE_EXCEEDED",
    );
    expect(derived.minimumRequiredLeverage).toBeGreaterThan(1);
    expect(derived.selectedLeverage).toBe(Math.ceil(derived.minimumRequiredLeverage ?? 0));
    expect(derived.initialMargin).toBeLessThanOrEqual(200);
    expect(impossible.hardErrors.map((error) => error.code)).toContain(
      "MAX_LEVERAGE_EXCEEDED",
    );

    const balanceAware = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      accountState: { ...baseSizingInput.accountState, availableBalance: 200 },
      leveragePolicy: { mode: "derivedMinimum" },
    });
    expect(balanceAware.minimumRequiredLeverage).toBeGreaterThan(9);
    expect(balanceAware.selectedLeverage).toBe(10);
    expect(balanceAware.hardErrors.map((error) => error.code)).not.toContain(
      "AVAILABLE_BALANCE_EXCEEDED",
    );
  });

  it("rejects impossible slippage, off-tick prices, and unsupported leverage steps", () => {
    const invalid = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      targets: [{ ...baseSizingInput.targets[0], targetPrice: 90.0005 }],
      executionAssumptions: {
        ...baseSizingInput.executionAssumptions,
        adverseEntrySlippageBps: 10_000,
      },
      leveragePolicy: { mode: "manual", leverage: 2.5 },
    });

    expect(invalid.hardErrors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "INVALID_NUMERIC_INPUT",
        "PRICE_TICK_MISMATCH",
        "LEVERAGE_STEP_MISMATCH",
      ]),
    );
  });

  it("returns hard errors for margin, balance, and venue minimum constraints", () => {
    const margin = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      riskRequest: {
        ...baseSizingInput.riskRequest,
        maximumMarginAllocationFraction: 0.02,
      },
      leveragePolicy: { mode: "manual", leverage: 2 },
    });
    const balance = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      accountState: { ...baseSizingInput.accountState, availableBalance: 100 },
    });
    const venueMinimum = calculateLinearPerpetualSizing({
      ...baseSizingInput,
      riskRequest: {
        ...baseSizingInput.riskRequest,
        accountRiskFraction: null,
        fixedRiskAmount: 0.01,
      },
    });

    expect(margin.hardErrors.map((error) => error.code)).toContain(
      "MARGIN_ALLOCATION_EXCEEDED",
    );
    expect(balance.hardErrors.map((error) => error.code)).toContain(
      "AVAILABLE_BALANCE_EXCEEDED",
    );
    expect(venueMinimum.hardErrors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["MINIMUM_QUANTITY_NOT_MET", "MINIMUM_NOTIONAL_NOT_MET"]),
    );
  });

  it("does not claim an exact liquidation price without a verified calculator", () => {
    const sizing = calculateLinearPerpetualSizing(baseSizingInput);

    expect(sizing.liquidationStatus).toEqual({
      status: "unavailable",
      exactPrice: null,
      modelVersion: null,
      reason: "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
    });
    expect(sizing.warnings.map((warning) => warning.code)).toContain(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
    );
  });
});

const decisionTime = 1_700_000_000;
const lifecycleConfigHash = impulseFadeLifecycleConfigHash();

function lifecycleSnapshot(
  state: SetupStateName,
  candidate = true,
): SetupStateSnapshot {
  const evidence = state === "entryCandidate"
    ? [
        {
          id: "retest-1",
          code: "bearish_retest_rejection",
          explanation: "Retest rejected",
          eventTime: decisionTime - 1_800,
          knownAt: decisionTime - 900,
          sourceTimeframe: "15m",
          contributesTo: "entryCandidate" as const,
        },
      ]
    : [];
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash,
    asOf: decisionTime,
    executionTimeframe: "15m",
    state,
    currentState: state,
    stateSince: decisionTime - 900,
    label: state,
    reason: state,
    checks: [],
    updatedTs: decisionTime,
    candidate: candidate
      ? {
          id: "candidate-1",
          setupFamily: "impulse_fade_v1",
          lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
          lifecycleConfigHash,
          symbol: "FILUSDT",
          source: "external",
          venue: "bybit",
          executionTimeframe: "15m",
          detectedAt: decisionTime - 7_200,
          detectionEventTime: decisionTime - 8_100,
          detectionMetrics: {
            returnPct: 12,
            percentile: 98,
            zScore: 2.7,
            atrExtension: 2.4,
          },
          initialMtfContext: [],
          episodeHigh: 104,
          episodeHighTime: decisionTime - 3_600,
          currentState: state,
          stateSince: decisionTime - 900,
          terminalAt: null,
        }
      : null,
    evidence,
    transitions: [],
    pendingConditions: [],
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: null,
    expiryReason: null,
    dataQuality: [],
  };
}

function episodeHighReference(knownAt = decisionTime - 2_700) {
  return createDecisionReferenceLevel({
    id: "candidate-1:episode-high",
    kind: "candidateEpisodeHigh",
    price: 104,
    sourceTimeframe: "1h",
    eventTime: decisionTime - 3_600,
    knownAt,
    sourceObject: {
      objectType: "SetupCandidateEpisode",
      objectId: "candidate-1",
      snapshot: { episodeHigh: 104 },
    },
  });
}

function decisionSnapshot(
  state: SetupStateName = "entryCandidate",
  candidate = true,
  strategyProfile = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
): DecisionSnapshot {
  const reference = episodeHighReference();
  return createDecisionSnapshot({
    symbol: "FILUSDT",
    source: "external",
    decisionTime,
    effectiveAsOf: decisionTime,
    strategyProfile,
    lifecycle: lifecycleSnapshot(state, candidate),
    candidateMetrics: {
      symbol: "FILUSDT",
      exchange: "bybit",
      marketType: "perp",
      source: "external",
      baseTimeframe: "1h",
      requestedAsOf: decisionTime,
      effectiveAsOf: decisionTime,
      sampleCount: 100,
      historyCoverage: {
        requestedStartTs: decisionTime - 180 * 86_400,
        requestedEndTs: decisionTime,
        availableStartTs: decisionTime - 180 * 86_400,
        availableEndTs: decisionTime,
        coveredSeconds: 180 * 86_400,
        requestedSeconds: 180 * 86_400,
        coverageRatio: 1,
      },
      insufficientDataReasons: [],
      extension: {
        windowSeconds: 86_400,
        historyDays: 180,
        sampleCount: 100,
        latestTs: decisionTime - 3_600,
        referenceTs: decisionTime - 86_400,
        latestClose: 100,
        referenceClose: 88,
        returnPct: 13.6,
        percentile: 98,
        zScore: 2.7,
      },
      timeframeExtensions: {},
      updatedAt: decisionTime,
    },
    structureByTimeframe: {},
    activeStructureLevels: [reference],
    supportResistanceZones: [],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: [reference],
    dataQualityNotes: [],
  });
}

function tradePlanInput(
  snapshot = decisionSnapshot(),
  overrides: Partial<CreateTradePlanInput> = {},
): CreateTradePlanInput {
  const reference = snapshot.activeStructureLevels[0] ?? episodeHighReference();
  return {
    snapshot,
    strategyProfile: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
    entryPlan: {
      orderPlanType: "manualReference",
      intendedPrice: 100,
      priceSource: "decision snapshot",
      associatedReferenceLevelId: null,
      associatedReferenceLevel: null,
      expiresAt: null,
      cancellationCondition: null,
    },
    stopPlan: {
      stopPrice: 105,
      derivationType: "episodeHigh",
      referenceLevelId: reference.id,
      referenceLevel: reference,
      buffer: { basisPoints: 96.1538461538, atrFraction: null, atrValue: null },
      rationale: "Beyond the frozen episode high",
    },
    targetPlans: [
      {
        id: "target-1",
        targetPrice: 90,
        positionFraction: 1,
        derivationType: "manual",
        referenceLevelId: null,
        referenceLevel: null,
        rationale: "Research target",
      },
    ],
    accountState: baseSizingInput.accountState,
    riskRequest: baseSizingInput.riskRequest,
    venueRules: baseSizingInput.venueRules,
    leveragePolicy: baseSizingInput.leveragePolicy,
    stopDistanceAtr: 1.25,
    discretionaryOverrideReason: null,
    status: "finalized",
    createdAt: decisionTime,
    ...overrides,
  };
}

describe("trade-plan compliance and decision records", () => {
  it("accepts an EntryCandidate plan under the research profile", () => {
    const plan = createTradePlan(tradePlanInput());

    expect(plan.complianceResult.classification).toBe("Compliant");
    expect(plan.complianceResult.hardErrors).toEqual([]);
    expect(plan.complianceResult.strategyViolations).toEqual([]);
  });

  it("allows non-structural market entries and fixed-R targets without fake references", () => {
    const snapshot = decisionSnapshot();
    const plan = createTradePlan(
      tradePlanInput(snapshot, {
        entryPlan: {
          ...tradePlanInput(snapshot).entryPlan,
          orderPlanType: "marketNextAvailable",
        },
        targetPlans: [
          {
            ...tradePlanInput(snapshot).targetPlans[0],
            derivationType: "fixedRMultiple",
          },
        ],
      }),
    );

    expect(plan.complianceResult.classification).toBe("Compliant");
    expect(plan.complianceResult.hardErrors).toEqual([]);
  });

  it("preserves early-entry violations and requires a reason to finalize an override", () => {
    const snapshot = decisionSnapshot("deteriorating");
    const missingReason = createTradePlan(tradePlanInput(snapshot));
    const overridden = createTradePlan(
      tradePlanInput(snapshot, {
        discretionaryOverrideReason: "Testing relative-strength lead before price breaks",
      }),
    );

    expect(missingReason.complianceResult.classification).toBe("InvalidPlan");
    expect(missingReason.complianceResult.hardErrors.map((error) => error.code)).toContain(
      "OVERRIDE_REASON_REQUIRED",
    );
    expect(overridden.complianceResult.classification).toBe("Overridden");
    expect(overridden.complianceResult.strategyViolations.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "ENTRY_BEFORE_ENTRY_CANDIDATE",
        "ENTRY_BEFORE_STRUCTURE_BREAK",
        "ENTRY_BEFORE_RETEST",
      ]),
    );
  });

  it("classifies a plan without an active candidate as out of strategy", () => {
    const snapshot = decisionSnapshot("notCandidate", false);
    const plan = createTradePlan(tradePlanInput(snapshot));

    expect(plan.complianceResult.classification).toBe("OutOfStrategy");
    expect(plan.complianceResult.strategyViolations.map((error) => error.code)).toContain(
      "NO_ACTIVE_CANDIDATE",
    );
  });

  it("rejects a structural reference learned after the decision cutoff", () => {
    const snapshot = decisionSnapshot();
    const future = createDecisionReferenceLevel({
      id: "future-episode-high",
      kind: "candidateEpisodeHigh",
      price: 106,
      sourceTimeframe: "1h",
      eventTime: decisionTime - 1_800,
      knownAt: decisionTime + 900,
      sourceObject: {
        objectType: "SetupCandidateEpisode",
        objectId: "future-candidate",
        snapshot: { episodeHigh: 106 },
      },
    });
    const plan = createTradePlan(
      tradePlanInput(snapshot, {
        stopPlan: {
          ...tradePlanInput(snapshot).stopPlan,
          referenceLevelId: future.id,
          referenceLevel: future,
        },
      }),
    );

    expect(plan.complianceResult.classification).toBe("InvalidPlan");
    expect(plan.complianceResult.hardErrors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      ]),
    );
  });

  it("rejects mismatched instruments and prices that do not follow their references", () => {
    const snapshot = decisionSnapshot();
    const base = tradePlanInput(snapshot);
    const plan = createTradePlan({
      ...base,
      venueRules: { ...base.venueRules, symbol: "BTCUSDT" },
      stopPlan: { ...base.stopPlan, stopPrice: 106 },
    });

    expect(plan.complianceResult.hardErrors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "INSTRUMENT_IDENTITY_MISMATCH",
        "REFERENCE_PRICE_MISMATCH",
      ]),
    );
  });

  it("surfaces profile and lifecycle version mismatches", () => {
    const snapshot = decisionSnapshot();
    const changedProfile = createImpulseFadeResearchProfile({
      id: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE.id,
      version: "2",
      lifecycleConfigHash: "fnv1a64:changed",
    });
    const plan = createTradePlan(
      tradePlanInput(snapshot, { strategyProfile: changedProfile }),
    );

    expect(plan.complianceResult.hardErrors.map((error) => error.code)).toContain(
      "STRATEGY_PROFILE_VERSION_MISMATCH",
    );
  });

  it("preserves profile risk and margin departures as override violations", () => {
    const strictProfile = createImpulseFadeResearchProfile({
      id: "impulse_fade_v1.research.strict",
      riskPolicy: {
        maximumAccountRiskFraction: 0.005,
        maximumMarginAllocationFraction: 0.05,
      },
    });
    const snapshot = decisionSnapshot("entryCandidate", true, strictProfile);
    const plan = createTradePlan(
      tradePlanInput(snapshot, {
        strategyProfile: strictProfile,
        discretionaryOverrideReason: "Testing the stricter profile boundary",
      }),
    );

    expect(plan.complianceResult.classification).toBe("Overridden");
    expect(plan.complianceResult.strategyViolations.map((error) => error.code)).toEqual(
      expect.arrayContaining(["RISK_ABOVE_PROFILE_LIMIT", "MARGIN_ALLOCATION_EXCEEDED"]),
    );
  });

  it("surfaces stale retests and stops inside the frozen episode high", () => {
    const staleProfile = createImpulseFadeResearchProfile({
      id: "impulse_fade_v1.research.stale-test",
      entryPolicy: { maxAgeSinceEntryCandidateSeconds: 60 },
    });
    const snapshot = decisionSnapshot("entryCandidate", true, staleProfile);
    const base = tradePlanInput(snapshot);
    const plan = createTradePlan({
      ...base,
      strategyProfile: staleProfile,
      stopPlan: {
        ...base.stopPlan,
        stopPrice: 103,
        derivationType: "manual",
        referenceLevelId: null,
        referenceLevel: null,
        buffer: { basisPoints: null, atrFraction: null, atrValue: null },
      },
      discretionaryOverrideReason: "Studying stale retest and tighter invalidation",
    });

    expect(plan.complianceResult.classification).toBe("Overridden");
    expect(plan.complianceResult.strategyViolations.map((error) => error.code)).toEqual(
      expect.arrayContaining(["RETEST_TOO_OLD", "STOP_INSIDE_INVALIDATION_LEVEL"]),
    );
  });

  it("produces deeply equal sizing, validation, plan, and decision outputs", () => {
    const input = tradePlanInput();
    const first = createTradePlan(input);
    const second = createTradePlan(input);
    const firstRecord = createDecisionRecord({
      snapshot: input.snapshot,
      decisionTime,
      action: "ProposeTrade",
      tradePlan: first,
      thesis: "Structure broke and retest rejected",
      tags: ["training"],
    });
    const secondRecord = createDecisionRecord({
      snapshot: input.snapshot,
      decisionTime,
      action: "ProposeTrade",
      tradePlan: second,
      thesis: "Structure broke and retest rejected",
      tags: ["training"],
    });

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(firstRecord).toEqual(secondRecord);

    const serializedInput = JSON.parse(JSON.stringify(input));
    expect(createTradePlan(serializedInput)).toEqual(first);
  });

  it("detects tampering in serialized profile, snapshot, plan, and sizing data", () => {
    const input = tradePlanInput();
    const plan = createTradePlan(input);
    const tamperedPlan = JSON.parse(JSON.stringify(plan));
    tamperedPlan.sizingResult.weightedProjectedR = 99;
    const planResult = evaluateTradePlanCompliance({
      strategyProfile: input.strategyProfile,
      snapshot: input.snapshot,
      plan: tamperedPlan,
    });
    const tamperedProfile = JSON.parse(JSON.stringify(input.strategyProfile));
    tamperedProfile.entryPolicy.minimumRewardRisk = 0;
    const profileResult = evaluateTradePlanCompliance({
      strategyProfile: tamperedProfile,
      snapshot: input.snapshot,
      plan,
    });

    expect(planResult.hardErrors.map((error) => error.code)).toContain(
      "SERIALIZED_INTEGRITY_MISMATCH",
    );
    expect(profileResult.hardErrors.map((error) => error.code)).toContain(
      "SERIALIZED_INTEGRITY_MISMATCH",
    );
  });

  it("records Wait and Skip as first-class outcomes with action-safe payloads", () => {
    const snapshot = decisionSnapshot("developing");
    const wait = createDecisionRecord({
      snapshot,
      decisionTime,
      action: "Wait",
      thesis: "Structure is not ready",
      nextCondition: "Bearish structure break",
      confidence: 0.7,
    });
    const skip = createDecisionRecord({
      snapshot,
      decisionTime,
      action: "Skip",
      skipReason: "noViableStop",
      thesis: "Structural stop is too wide",
    });

    expect(wait).toMatchObject({ action: "Wait", tradePlan: null, skipReason: null });
    expect(skip).toMatchObject({
      action: "Skip",
      tradePlan: null,
      skipReason: "noViableStop",
    });
    expect(() =>
      createDecisionRecord({
        snapshot,
        decisionTime,
        action: "Skip",
      }),
    ).toThrow("skipReason");
    expect(() =>
      createDecisionRecord({
        snapshot,
        decisionTime,
        action: "Wait",
        confidence: 1.1,
      }),
    ).toThrow("between 0 and 1");
  });
});
