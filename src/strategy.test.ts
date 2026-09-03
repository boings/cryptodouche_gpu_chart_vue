import { describe, expect, it } from "vitest";
import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  impulseFadeLifecycleConfigHash,
  type SetupStateSnapshot,
} from "./indicators";
import {
  DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  createDecisionReferenceLevel,
  createDecisionSnapshot,
  createImpulseFadeResearchProfile,
  strategyProfileHash,
} from "./strategy";
import type { CandidateMetrics } from "./types";

const asOf = 1_700_000_000;

function lifecycle(state: SetupStateSnapshot["currentState"] = "entryCandidate"):
  SetupStateSnapshot {
  const lifecycleConfigHash = impulseFadeLifecycleConfigHash();
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash,
    asOf,
    executionTimeframe: "15m",
    state,
    currentState: state,
    stateSince: asOf - 900,
    label: "Entry candidate",
    reason: "Retest confirmed",
    checks: [],
    updatedTs: asOf,
    candidate: {
      id: "candidate-1",
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash,
      symbol: "FILUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "15m",
      detectedAt: asOf - 7_200,
      detectionEventTime: asOf - 8_100,
      detectionMetrics: { returnPct: 12, percentile: 98, zScore: 2.7, atrExtension: 2.4 },
      initialMtfContext: [],
      episodeHigh: 0.82,
      episodeHighTime: asOf - 3_600,
      currentState: state,
      stateSince: asOf - 900,
      terminalAt: null,
    },
    evidence: [
      {
        id: "retest-1",
        code: "bearish_retest_rejection",
        explanation: "Retest rejected",
        eventTime: asOf - 1_800,
        knownAt: asOf - 900,
        sourceTimeframe: "15m",
        contributesTo: "entryCandidate",
      },
    ],
    transitions: [],
    pendingConditions: [],
    activeBreakLevel: {
      level: 0.79,
      sourceTimeframe: "15m",
      eventTime: asOf - 2_700,
      knownAt: asOf - 1_800,
      evidenceId: "break-1",
    },
    retestLevel: {
      level: 0.79,
      sourceTimeframe: "15m",
      eventTime: asOf - 2_700,
      knownAt: asOf - 1_800,
      evidenceId: "break-1",
    },
    confluence: [],
    invalidationReason: null,
    expiryReason: null,
    dataQuality: [],
  };
}

function minimalSnapshotInput(
  lifecycleSnapshot = lifecycle(),
): Parameters<typeof createDecisionSnapshot>[0] {
  return {
    symbol: "FILUSDT",
    source: "external",
    decisionTime: asOf,
    effectiveAsOf: asOf,
    strategyProfile: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
    lifecycle: lifecycleSnapshot,
    candidateMetrics: null,
    structureByTimeframe: {},
    activeStructureLevels: [],
    supportResistanceZones: [],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: [],
    dataQualityNotes: [],
  };
}

function candidateMetrics(source: CandidateMetrics["source"] = "external"): CandidateMetrics {
  return {
    symbol: "FILUSDT",
    exchange: "bybit",
    marketType: "perp",
    source,
    baseTimeframe: "1h",
    requestedAsOf: asOf,
    effectiveAsOf: asOf,
    sampleCount: 100,
    historyCoverage: {
      requestedStartTs: asOf - 180 * 86_400,
      requestedEndTs: asOf,
      availableStartTs: asOf - 180 * 86_400,
      availableEndTs: asOf,
      coveredSeconds: 180 * 86_400,
      requestedSeconds: 180 * 86_400,
      coverageRatio: 1,
    },
    insufficientDataReasons: [],
    extension: {
      windowSeconds: 86_400,
      historyDays: 180,
      sampleCount: 100,
      latestTs: asOf,
      referenceTs: asOf - 86_400,
      latestClose: 1,
      referenceClose: 0.8,
      returnPct: 25,
      percentile: 99,
      zScore: 3,
    },
    timeframeExtensions: {},
    updatedAt: asOf,
  };
}

describe("Impulse Fade strategy profile and decision snapshots", () => {
  it("assigns exact revision identity to frozen structural references", () => {
    const reference = createDecisionReferenceLevel({
      id: "zone-1",
      kind: "resistanceZone",
      price: 105,
      rangeLow: 104,
      rangeHigh: 106,
      sourceTimeframe: "4h",
      eventTime: asOf - 7_200,
      knownAt: asOf - 3_600,
      sourceObject: {
        objectType: "SupportResistanceZone",
        objectId: "zone-1",
        snapshot: { low: 104, high: 106, strength: 8.1 },
      },
    });

    expect(reference.sourceObject.observationId).toMatch(/^decision-reference-observation:/);
    expect(() =>
      createDecisionReferenceLevel({
        ...reference,
        sourceObject: { ...reference.sourceObject, observationId: "tampered" },
      }),
    ).toThrow("deterministic verification");
  });

  it("exposes a stable, self-hashed research profile with explicit timeframe roles", () => {
    const profile = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;

    expect(profile).toMatchObject({
      id: "impulse_fade_v1.research.default",
      version: "1",
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash: impulseFadeLifecycleConfigHash(),
      timeframeRoles: {
        candidateTimeframe: "1h",
        structureTimeframe: "1h",
        executionTimeframe: "15m",
        contextTimeframes: ["4h", "1d"],
      },
    });
    expect(profile.profileHash).toBe(strategyProfileHash(profile));
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it("allows a different timeframe stack without relying on chart state", () => {
    const profile = createImpulseFadeResearchProfile({
      id: "impulse_fade_v1.research.fast",
      version: "1",
      timeframeRoles: {
        candidateTimeframe: "4h",
        structureTimeframe: "1h",
        executionTimeframe: "5m",
        triggerTimeframe: null,
        contextTimeframes: ["1d"],
      },
    });

    expect(profile.timeframeRoles).toEqual({
      candidateTimeframe: "4h",
      structureTimeframe: "1h",
      executionTimeframe: "5m",
      triggerTimeframe: null,
      contextTimeframes: ["1d"],
    });
    expect(profile.profileHash).toBe(strategyProfileHash(profile));
  });

  it("rejects unsupported factor reclassification and impossible slippage", () => {
    expect(() =>
      createImpulseFadeResearchProfile({
        entryPolicy: {
          factors: {
            hardGate: [],
          },
        },
      }),
    ).toThrow("hard-gate factor roles");
    expect(() =>
      createImpulseFadeResearchProfile({
        executionAssumptions: { adverseEntrySlippageBps: 10_000 },
      }),
    ).toThrow("below 10,000 basis points");
  });

  it("creates deeply equal immutable snapshots and excludes future-known facts", () => {
    const episodeHigh = createDecisionReferenceLevel({
      id: "candidate-1:episode-high",
      kind: "candidateEpisodeHigh",
      price: 0.82,
      sourceTimeframe: "1h",
      eventTime: asOf - 3_600,
      knownAt: asOf - 2_700,
      sourceObject: {
        objectType: "SetupCandidateEpisode",
        objectId: "candidate-1",
        snapshot: { episodeHigh: 0.82 },
      },
    });
    const futureLevel = createDecisionReferenceLevel({
      id: "future-level",
      kind: "structureLevel",
      price: 0.84,
      sourceTimeframe: "1h",
      eventTime: asOf,
      knownAt: asOf + 3_600,
      sourceObject: {
        objectType: "StructureActiveLevel",
        objectId: "future-level",
        snapshot: { price: 0.84 },
      },
    });
    const input = {
      symbol: "FILUSDT",
      source: "external",
      decisionTime: asOf,
      effectiveAsOf: asOf,
      strategyProfile: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
      lifecycle: lifecycle(),
      candidateMetrics: null,
      structureByTimeframe: {},
      activeStructureLevels: [episodeHigh, futureLevel],
      supportResistanceZones: [],
      avwapState: null,
      avwapEvents: [],
      relativeStrengthState: null,
      relativeStrengthEvents: [],
      visibleOrSelectedReferenceLevels: [episodeHigh],
      dataQualityNotes: [],
    } as const;

    const first = createDecisionSnapshot(input);
    const second = createDecisionSnapshot(input);

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.activeStructureLevels.map((level) => level.id)).toEqual([
      "candidate-1:episode-high",
    ]);
    expect(first.candidateMetrics).toBeNull();
    expect(first.candidateEpisode?.id).toBe("candidate-1");
    expect(first.strategyProfileHash).toBe(DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE.profileHash);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.candidateEpisode)).toBe(true);
  });

  it("distinguishes metric data origin from exchange stream provenance", () => {
    const exchangeLifecycle = lifecycle();
    if (!exchangeLifecycle.candidate) throw new Error("fixture candidate is required");
    exchangeLifecycle.candidate.source = "bybit";
    const snapshot = createDecisionSnapshot({
      ...minimalSnapshotInput(exchangeLifecycle),
      source: "bybit",
      candidateMetrics: candidateMetrics("external"),
    });

    expect(snapshot.candidateMetrics?.source).toBe("external");
    expect(snapshot.candidateMetrics?.exchange).toBe("bybit");
    expect(snapshot.candidateEpisode?.source).toBe("bybit");
  });

  it("does not mutate a prior snapshot when live lifecycle state advances", () => {
    const liveLifecycle = lifecycle("deteriorating");
    const snapshot = createDecisionSnapshot({
      symbol: "FILUSDT",
      source: "external",
      decisionTime: asOf,
      effectiveAsOf: asOf,
      strategyProfile: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
      lifecycle: liveLifecycle,
      candidateMetrics: null,
      structureByTimeframe: {},
      activeStructureLevels: [],
      supportResistanceZones: [],
      avwapState: null,
      avwapEvents: [],
      relativeStrengthState: null,
      relativeStrengthEvents: [],
      visibleOrSelectedReferenceLevels: [],
      dataQualityNotes: [],
    });

    liveLifecycle.currentState = "entryCandidate";
    if (liveLifecycle.candidate) liveLifecycle.candidate.currentState = "entryCandidate";

    expect(snapshot.lifecycleState).toBe("deteriorating");
    expect(snapshot.candidateEpisode?.currentState).toBe("deteriorating");
  });

  it("rejects future facts nested inside candidate and metric snapshots", () => {
    const futureCandidate = lifecycle();
    futureCandidate.candidate!.episodeHighTime = asOf + 900;
    expect(() => createDecisionSnapshot(minimalSnapshotInput(futureCandidate))).toThrow(
      "Candidate episode contains information after effectiveAsOf",
    );

    const futureMetrics = {
      symbol: "FILUSDT",
      exchange: "bybit",
      marketType: "perp",
      source: "external" as const,
      baseTimeframe: "1h",
      requestedAsOf: asOf,
      effectiveAsOf: asOf,
      sampleCount: 1,
      historyCoverage: {
        requestedStartTs: asOf - 86_400,
        requestedEndTs: asOf,
        availableStartTs: asOf - 86_400,
        availableEndTs: asOf,
        coveredSeconds: 86_400,
        requestedSeconds: 86_400,
        coverageRatio: 1,
      },
      insufficientDataReasons: [],
      extension: {
        windowSeconds: 86_400,
        historyDays: 1,
        sampleCount: 1,
        latestTs: asOf,
        referenceTs: asOf - 86_400,
        latestClose: 1,
        referenceClose: 1,
        returnPct: 0,
        percentile: 50,
        zScore: 0,
      },
      timeframeExtensions: {},
      updatedAt: asOf + 1,
    };
    expect(() =>
      createDecisionSnapshot({
        ...minimalSnapshotInput(),
        candidateMetrics: futureMetrics,
      }),
    ).toThrow("Candidate metrics contain information after effectiveAsOf");
  });

  it("excludes nested structure and AVWAP values learned after the cutoff", () => {
    const avwapReference = createDecisionReferenceLevel({
      id: "avwap-1",
      kind: "avwap",
      price: 0.78,
      sourceTimeframe: "15m",
      eventTime: asOf - 3_600,
      knownAt: asOf - 2_700,
      sourceObject: {
        objectType: "AnchoredVwap",
        objectId: "avwap-1",
        snapshot: { value: 0.78 },
      },
    });
    const snapshot = createDecisionSnapshot({
      symbol: "FILUSDT",
      source: "external",
      decisionTime: asOf,
      effectiveAsOf: asOf,
      strategyProfile: DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
      lifecycle: lifecycle(),
      candidateMetrics: null,
      structureByTimeframe: {
        "1h": {
          state: "bullish",
          trend: "bullish",
          transitionDirection: null,
          lastBreak: {
            kind: "StructureBreak",
            direction: "bullish",
            label: "BOS",
            index: 1,
            x: 1,
            ts: asOf - 3_600,
            bucket: asOf - 3_600,
            level: 0.8,
            sourceSwingX: 0,
            sourceSwingPrice: 0.8,
            eventTime: asOf - 3_600,
            knownAt: asOf + 1,
          },
          lastSwingHigh: null,
          lastSwingLow: null,
          updatedX: 1,
          updatedTs: asOf - 1,
        },
      },
      activeStructureLevels: [],
      supportResistanceZones: [],
      avwapState: {
        reference: avwapReference,
        distancePct: 2.1,
        anchorReason: "Breakout candle",
        eventTime: asOf - 900,
        knownAt: asOf + 1,
      },
      avwapEvents: [],
      relativeStrengthState: null,
      relativeStrengthEvents: [],
      visibleOrSelectedReferenceLevels: [],
      dataQualityNotes: [],
    });

    expect(snapshot.structureByTimeframe["1h"]).toBeNull();
    expect(snapshot.avwapState).toBeNull();
  });
});
