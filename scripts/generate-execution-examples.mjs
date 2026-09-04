#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as api from "../dist/core.js";

const decisionTime = 1_700_000_000;
const firstOpen = 1_700_000_100;
const outputDirectory = resolve("fixtures/generated/execution");
const planning = JSON.parse(await readFile(resolve("fixtures/impulse-fade-trade-planning.example.json"), "utf8"));
const strategyProfile = planning.strategyProfile;
const snapshot = planning.snapshots.entryCandidate;
const sourcePlan = planning.decisions.proposeCompliant.tradePlan;

await mkdir(outputDirectory, { recursive: true });

const scenarios = [
  {
    id: "clean-stop",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.83, 0.79, 0.82)],
  },
  {
    id: "multiple-targets",
    plan: marketPlan(twoTargets()),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.79, 0.8, 0.75, 0.77), candle(2, 0.77, 0.78, 0.71, 0.72)],
  },
  {
    id: "target-then-stop",
    plan: marketPlan(twoTargets()),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.79, 0.8, 0.75, 0.77), candle(2, 0.78, 0.84, 0.77, 0.83)],
  },
  {
    id: "unfilled-entry",
    plan: replan(sourcePlan, { entryPlan: { ...sourcePlan.entryPlan, intendedPrice: 0.9 } }),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.81, 0.77, 0.78), candle(2, 0.78, 0.79, 0.76, 0.77)],
  },
  {
    id: "gap-through-stop",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.9, 0.92, 0.88, 0.91)],
  },
  {
    id: "unresolved-ambiguity",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.84, 0.7, 0.8)],
  },
  lowerTimeframeScenario(),
  {
    id: "funding-after-partial",
    plan: marketPlan(twoTargets()),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.79, 0.8, 0.75, 0.77), candle(2, 0.77, 0.78, 0.74, 0.76), candle(3, 0.76, 0.77, 0.71, 0.72)],
    funding: [api.createFundingObservation({
      venue: "bybit",
      symbol: "FILUSDT",
      fundingTime: firstOpen + 1_800,
      rate: 0.001,
      markPrice: 0.77,
      markPriceSource: "fixture-mark",
      dataProvenance: "Deterministic execution example",
    })],
  },
  {
    id: "missing-funding",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.8, 0.83, 0.79, 0.82)],
    fundingDataAvailable: false,
  },
  {
    id: "open-at-horizon",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.8, 0.78, 0.795), candle(1, 0.795, 0.8, 0.77, 0.78), candle(2, 0.78, 0.79, 0.76, 0.77)],
  },
];

for (const scenario of scenarios) {
  const loaded = await loadScenario(scenario);
  const session = api.simulateExecutionToHorizon(loaded);
  const incremental = api.advanceExecutionTo(
    api.advanceExecutionTo(api.createExecutionSession(loaded), loaded, firstOpen + 900),
    loaded,
    session.executionHorizonTime + 900,
  );
  if (api.canonicalSerialize(incremental) !== api.canonicalSerialize(session)) {
    throw new Error(`${scenario.id}: incremental execution differs from batch`);
  }
  const publicReplayJson = api.canonicalSerialize(loaded.replaySession);
  for (const forbidden of ["executionResult", "actualNetPnl", "executionEvents", "fills"]) {
    if (publicReplayJson.includes(forbidden)) throw new Error(`${scenario.id}: public replay leaked ${forbidden}`);
  }
  const output = {
    schemaVersion: "execution-example.1",
    scenario: scenario.id,
    publicReplaySessionSha256: await api.replaySha256(loaded.replaySession),
    publicReplayContainsExecutionOutcome: false,
    executionSession: {
      id: session.id,
      schemaVersion: session.schemaVersion,
      state: session.state,
      currentAsOf: session.currentAsOf,
      revision: session.revision,
      integrityHash: session.integrityHash,
    },
    executionEvents: session.executionEvents.map(compactEvent),
    executionResult: session.result,
  };
  const path = resolve(outputDirectory, `${scenario.id}.json`);
  await writeFile(path, `${api.canonicalSerialize(output)}\n`, "utf8");
  console.log(`${scenario.id}: ${session.state} ${session.result?.closeReason ?? "-"} -> ${path}`);
}

function compactEvent(event) {
  const {
    ordersAfter: _orders,
    fillsAfter: _fills,
    positionLedgerAfter: _ledger,
    pathResolutionRecordsAfter: _paths,
    fundingRecordsAfter: _funding,
    excursionObservationsAfter: _excursions,
    resultAfter: _result,
    errorsAfter: _errors,
    ...compact
  } = event;
  return compact;
}

async function loadScenario(scenario) {
  const frame = {
    id: `replay-frame:${scenario.id}`,
    sessionId: `replay-session:${scenario.id}`,
    effectiveAsOf: decisionTime,
    decisionSnapshot: snapshot,
  };
  const replaySession = {
    id: frame.sessionId,
    replayEngineVersion: "replay-engine.1",
    state: "TradePlanRecorded",
    currentFrameId: frame.id,
    lifecycleVersion: scenario.plan.lifecycleVersion,
    lifecycleConfigHash: scenario.plan.lifecycleConfigHash,
    planningAttempts: [{
      id: `planning-attempt:${scenario.id}`,
      frameId: frame.id,
      attemptedAt: decisionTime,
      tradePlan: scenario.plan,
      accepted: true,
      rejectionReason: null,
    }],
  };
  const feeSchedule = api.createVenueFeeSchedule({
    id: "bybit:linear-perp:research-fees",
    version: "2023-fixture.1",
    schemaVersion: api.VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
    venue: "bybit",
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: decisionTime,
    effectiveUntil: null,
    makerRate: scenario.plan.venueRules.feeSchedule.makerRate,
    takerRate: scenario.plan.venueRules.feeSchedule.takerRate,
    provenance: "Deterministic research fixture",
    assumptionStatus: "researchAssumption",
  });
  const venueRules = api.createResearchVenueExecutionRules(scenario.plan.venueRules, feeSchedule, decisionTime);
  const standard = api.createExperimentalExecutionProfile(["1m", "15m"]);
  const { canonicalConfigHash: _hash, ...definition } = standard;
  const executionProfile = api.createExecutionProfile({ ...definition, maximumExecutionHorizon: 3_600 });
  return api.loadExecutionCase({
    replaySession,
    replayFrame: frame,
    tradePlan: scenario.plan,
    strategyProfile,
    executionProfile,
    venueRules,
    feeSchedule,
    historicalDataAdapter: new api.InMemoryReplayExecutionDataAdapter({
      candles: scenario.candles,
      funding: scenario.funding,
      fundingDataAvailable: scenario.fundingDataAvailable,
      venueRuleEvidence: [venueRules],
    }),
  });
}

function marketPlan(targetPlans = sourcePlan.targetPlans) {
  return replan(sourcePlan, {
    entryPlan: { ...sourcePlan.entryPlan, orderPlanType: "marketNextAvailable", expiresAt: null },
    targetPlans,
  });
}

function twoTargets() {
  return [
    { ...sourcePlan.targetPlans[0], id: "target:one", targetPrice: 0.76, positionFraction: 0.5 },
    { ...sourcePlan.targetPlans[0], id: "target:two", targetPrice: 0.72, positionFraction: 0.5 },
  ];
}

function replan(plan, changes) {
  const changed = { ...structuredClone(plan), ...changes };
  return { ...changed, id: api.tradePlanId(changed) };
}

function candle(offset, o, h, l, c) {
  return api.createExecutionCandleObservation({
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

function minute(openTime, o, h, l, c) {
  return api.createExecutionCandleObservation({
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

function lowerTimeframeScenario() {
  const fine = [];
  for (let index = 0; index < 15; index += 1) {
    const open = firstOpen + index * 60;
    if (index === 0) fine.push(minute(open, 0.79, 0.8, 0.78, 0.795));
    else if (index === 4) fine.push(minute(open, 0.79, 0.8, 0.71, 0.73));
    else if (index === 10) fine.push(minute(open, 0.8, 0.84, 0.78, 0.83));
    else fine.push(minute(open, 0.78, 0.8, 0.77, 0.79));
  }
  return {
    id: "lower-timeframe-resolved",
    plan: marketPlan(),
    candles: [candle(0, 0.79, 0.84, 0.7, 0.8), ...fine],
  };
}
