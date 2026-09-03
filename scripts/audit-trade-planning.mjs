#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  IMPULSE_FADE_LIFECYCLE_VERSION,
  createDecisionRecord,
  createDecisionReferenceLevel,
  createDecisionSnapshot,
  createTradePlan,
  impulseFadeLifecycleConfigHash,
} from "../dist/core.js";

const args = process.argv.slice(2);
const outputFlag = args.indexOf("--out");
const outputPath = outputFlag >= 0 ? args[outputFlag + 1] : null;

if (outputFlag >= 0 && !outputPath) {
  console.error("Usage: pnpm audit:trade-plan [--out audit.json]");
  process.exitCode = 1;
} else {
  const audit = buildAudit();
  const json = `${JSON.stringify(audit, null, 2)}\n`;
  if (outputPath) await writeFile(resolve(outputPath), json, "utf8");
  process.stdout.write(json);
}

function buildAudit() {
  const effectiveAsOf = 1_700_000_000;
  const profile = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;
  const episodeHigh = createDecisionReferenceLevel({
    id: "fil-episode-1:high",
    kind: "candidateEpisodeHigh",
    price: 0.82,
    sourceTimeframe: "1h",
    eventTime: effectiveAsOf - 3_600,
    knownAt: effectiveAsOf - 2_700,
    sourceObject: {
      objectType: "SetupCandidateEpisode",
      objectId: "fil-episode-1",
      snapshot: { episodeHigh: 0.82, episodeHighTime: effectiveAsOf - 3_600 },
    },
  });
  const support = createDecisionReferenceLevel({
    id: "fil-support-zone-1",
    kind: "supportZone",
    price: 0.72,
    rangeLow: 0.715,
    rangeHigh: 0.725,
    sourceTimeframe: "4h",
    eventTime: effectiveAsOf - 86_400,
    knownAt: effectiveAsOf - 72_000,
    sourceObject: {
      objectType: "SupportResistanceZone",
      objectId: "fil-support-zone-1",
      snapshot: { kind: "support", low: 0.715, high: 0.725, strength: 8.1 },
    },
  });
  const retestLevel = createDecisionReferenceLevel({
    id: "fil-break-retest-1",
    kind: "structureLevel",
    price: 0.79,
    sourceTimeframe: "15m",
    eventTime: effectiveAsOf - 1_800,
    knownAt: effectiveAsOf - 900,
    sourceObject: {
      objectType: "SetupLifecycleLevel",
      objectId: "fil-break-retest-1",
      snapshot: { level: 0.79, evidenceId: "retest-rejection" },
    },
  });
  const snapshots = {
    developing: snapshotFor(
      "developing",
      effectiveAsOf,
      profile,
      episodeHigh,
      retestLevel,
      support,
    ),
    deteriorating: snapshotFor(
      "deteriorating",
      effectiveAsOf,
      profile,
      episodeHigh,
      retestLevel,
      support,
    ),
    entryCandidate: snapshotFor(
      "entryCandidate",
      effectiveAsOf,
      profile,
      episodeHigh,
      retestLevel,
      support,
    ),
  };
  const venueRules = {
    venue: "bybit",
    symbol: "FILUSDT",
    quantityStep: 0.1,
    priceTick: 0.0001,
    minQuantity: 0.1,
    minNotional: 5,
    maxLeverage: 25,
    leverageStep: 1,
    feeSchedule: {
      makerRate: 0.0002,
      takerRate: 0.00055,
      version: "research-example.1",
    },
    maintenanceMarginModel: null,
    liquidationModel: null,
  };
  const accountState = {
    equity: 10_000,
    availableBalance: 6_000,
    quoteCurrency: "USDT",
  };
  const riskRequest = {
    accountRiskFraction: 0.01,
    fixedRiskAmount: null,
    maximumMarginAllocationFraction: 0.25,
    maximumNotional: null,
  };
  const entryPlan = {
    orderPlanType: "limit",
    intendedPrice: 0.79,
    priceSource: "frozen retest level",
    associatedReferenceLevelId: retestLevel.id,
    associatedReferenceLevel: retestLevel,
    expiresAt: effectiveAsOf + 3_600,
    cancellationCondition: "Cancel if price closes above the episode high",
  };
  const stopPlan = {
    stopPrice: 0.825,
    derivationType: "episodeHigh",
    referenceLevelId: episodeHigh.id,
    referenceLevel: episodeHigh,
    buffer: { basisPoints: 60.9756097561, atrFraction: null, atrValue: null },
    rationale: "Stop beyond the frozen candidate episode high",
  };
  const targetPlans = [
    {
      id: "target-support",
      targetPrice: 0.72,
      positionFraction: 1,
      derivationType: "supportZone",
      referenceLevelId: support.id,
      referenceLevel: support,
      rationale: "Nearest frozen 4h support zone",
    },
  ];
  const commonPlan = {
    strategyProfile: profile,
    entryPlan,
    stopPlan,
    targetPlans,
    accountState,
    riskRequest,
    venueRules,
    leveragePolicy: { mode: "derivedMinimum" },
    stopDistanceAtr: 1.4,
    status: "finalized",
    createdAt: effectiveAsOf,
  };
  const compliantPlan = createTradePlan({
    ...commonPlan,
    snapshot: snapshots.entryCandidate,
  });
  const overriddenPlan = createTradePlan({
    ...commonPlan,
    snapshot: snapshots.deteriorating,
    discretionaryOverrideReason: "Researching RS deterioration before price structure breaks",
  });
  const wait = createDecisionRecord({
    snapshot: snapshots.developing,
    decisionTime: effectiveAsOf,
    action: "Wait",
    confidence: 0.7,
    thesis: "Extension is present but structure has not deteriorated",
    nextCondition: "Wait for RS weakness or a bearish structure break",
    tags: ["training", "impulse-fade-v1"],
  });
  const skip = createDecisionRecord({
    snapshot: snapshots.developing,
    decisionTime: effectiveAsOf,
    action: "Skip",
    confidence: 0.85,
    thesis: "No viable structural stop inside the risk envelope",
    skipReason: "noViableStop",
    tags: ["training", "risk-first"],
  });
  const proposeCompliant = createDecisionRecord({
    snapshot: snapshots.entryCandidate,
    decisionTime: effectiveAsOf,
    action: "ProposeTrade",
    thesis: "Structure broke and the later retest rejected",
    tradePlan: compliantPlan,
    tags: ["training", "compliant"],
  });
  const proposeOverride = createDecisionRecord({
    snapshot: snapshots.deteriorating,
    decisionTime: effectiveAsOf,
    action: "ProposeTrade",
    thesis: "Relative weakness leads absolute structure",
    tradePlan: overriddenPlan,
    tags: ["training", "override"],
  });

  return {
    auditSchemaVersion: "impulse-fade-trade-plan-audit.1",
    setupFamily: profile.setupFamily,
    lifecycleVersion: profile.lifecycleVersion,
    lifecycleConfigHash: profile.lifecycleConfigHash,
    strategyProfile: profile,
    snapshots,
    decisions: { wait, skip, proposeCompliant, proposeOverride },
    summary: {
      riskBudget: compliantPlan.sizingResult.riskBudget,
      quantity: compliantPlan.sizingResult.roundedQuantity,
      notional: compliantPlan.sizingResult.grossNotional,
      selectedLeverage: compliantPlan.sizingResult.selectedLeverage,
      initialMargin: compliantPlan.sizingResult.initialMargin,
      projectedLossAtStop: compliantPlan.sizingResult.projectedLossAtStop,
      projectedR: compliantPlan.sizingResult.weightedProjectedR,
      compliantClassification: compliantPlan.complianceResult.classification,
      overrideClassification: overriddenPlan.complianceResult.classification,
      overrideViolations: overriddenPlan.complianceResult.strategyViolations.map(
        (violation) => violation.code,
      ),
      liquidationStatus: compliantPlan.sizingResult.liquidationStatus,
    },
  };
}

function snapshotFor(state, effectiveAsOf, profile, episodeHigh, retestLevel, support) {
  const lifecycleConfigHash = impulseFadeLifecycleConfigHash();
  const evidence = [
    {
      id: "candidate-detected",
      code: "candidate_detected",
      explanation: "Extension gate crossed from false to true",
      eventTime: effectiveAsOf - 8_100,
      knownAt: effectiveAsOf - 7_200,
      sourceTimeframe: "1h",
      contributesTo: "developing",
    },
  ];
  if (state === "deteriorating" || state === "entryCandidate") {
    evidence.push({
      id: "rs-break",
      code: "rs_bearish_break",
      explanation: "RS/BTC structure broke bearishly",
      eventTime: effectiveAsOf - 3_600,
      knownAt: effectiveAsOf - 2_700,
      sourceTimeframe: "1h",
      contributesTo: "deteriorating",
    });
  }
  if (state === "entryCandidate") {
    evidence.push({
      id: "retest-rejection",
      code: "bearish_retest_rejection",
      explanation: "Later candle retested and rejected the break level",
      eventTime: effectiveAsOf - 1_800,
      knownAt: effectiveAsOf - 900,
      sourceTimeframe: "15m",
      contributesTo: "entryCandidate",
    });
  }
  const lifecycle = {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash,
    asOf: effectiveAsOf,
    executionTimeframe: "15m",
    state,
    currentState: state,
    stateSince: effectiveAsOf - 900,
    label: state,
    reason: evidence.at(-1).explanation,
    checks: [],
    updatedTs: effectiveAsOf,
    candidate: {
      id: "fil-episode-1",
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash,
      symbol: "FILUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "15m",
      detectedAt: effectiveAsOf - 7_200,
      detectionEventTime: effectiveAsOf - 8_100,
      detectionMetrics: {
        returnPct: 13.6,
        percentile: 98,
        zScore: 2.7,
        atrExtension: 2.4,
      },
      initialMtfContext: [],
      episodeHigh: 0.82,
      episodeHighTime: effectiveAsOf - 3_600,
      currentState: state,
      stateSince: effectiveAsOf - 900,
      terminalAt: null,
    },
    evidence,
    transitions: [],
    pendingConditions: state === "entryCandidate" ? [] : ["Confirmed structure and retest"],
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: null,
    expiryReason: null,
    dataQuality: [],
  };
  return createDecisionSnapshot({
    symbol: "FILUSDT",
    source: "external",
    decisionTime: effectiveAsOf,
    effectiveAsOf,
    strategyProfile: profile,
    lifecycle,
    candidateMetrics: candidateMetrics(effectiveAsOf),
    structureByTimeframe: {},
    activeStructureLevels: [episodeHigh, retestLevel],
    supportResistanceZones: [support],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: [episodeHigh, retestLevel, support],
    dataQualityNotes: [],
  });
}

function candidateMetrics(effectiveAsOf) {
  return {
    symbol: "FILUSDT",
    exchange: "bybit",
    marketType: "perp",
    source: "external",
    baseTimeframe: "1h",
    requestedAsOf: effectiveAsOf,
    effectiveAsOf,
    sampleCount: 100,
    historyCoverage: {
      requestedStartTs: effectiveAsOf - 180 * 86_400,
      requestedEndTs: effectiveAsOf,
      availableStartTs: effectiveAsOf - 180 * 86_400,
      availableEndTs: effectiveAsOf,
      coveredSeconds: 180 * 86_400,
      requestedSeconds: 180 * 86_400,
      coverageRatio: 1,
    },
    insufficientDataReasons: [],
    extension: {
      windowSeconds: 86_400,
      historyDays: 180,
      sampleCount: 100,
      latestTs: effectiveAsOf - 3_600,
      referenceTs: effectiveAsOf - 86_400,
      latestClose: 0.79,
      referenceClose: 0.695,
      returnPct: 13.6,
      percentile: 98,
      zScore: 2.7,
    },
    timeframeExtensions: {},
    updatedAt: effectiveAsOf,
  };
}
