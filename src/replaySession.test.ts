import { describe, expect, it } from "vitest";
import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  impulseFadeLifecycleConfigHash,
  type SetupStateName,
  type SetupStateSnapshot,
} from "./indicators";
import {
  createRadarSelectionProfile,
  scanRadarEpisodes,
  type RadarEpisode,
  type RadarSelectionProfile,
  type ReplayCaseManifest,
} from "./radar";
import {
  InMemoryReplayHistoricalDataAdapter,
  REPLAY_COMMAND_SCHEMA_VERSION,
  REPLAY_ENGINE_VERSION,
  REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  createReplayAnalysisStateObservation,
  createReplayCandleRecord,
  createReplayKnownEvent,
  createReplaySessionConfig,
  loadReplayCase,
  type ReplayAnalysisStateObservation,
  type ReplayCandleRecord,
  type ReplayKnownEvent,
  type ReplayLoadedCase,
  type ReplaySessionConfig,
  type ReplaySessionConfigDefinition,
} from "./replay";
import {
  InMemoryReplayOutcomeStore,
  applyReplayCommand,
  createReplaySession,
  createReplayWakePlan,
  deserializeReplaySession,
  reconstructReplaySession,
  resumeReplaySession,
  serializeReplaySession,
  type ReplayCaseOutcome,
  type ReplayCommand,
  type ReplaySession,
  type ReplayWakePlan,
} from "./replaySession";
import { canonicalHash } from "./serialization";
import {
  createDecisionReferenceLevel,
  createImpulseFadeResearchProfile,
  type DecisionReferenceLevel,
  type StrategyProfile,
} from "./strategy";
import type { VenueRiskRules } from "./tradePlanning";
import type { CandidateMetrics, CandleRecord } from "./types";

const HOUR = 3_600;
const DAY = 86_400;
const DETECTION = Date.parse("2024-07-01T00:00:00Z") / 1_000;
const ANALYSIS_START = DETECTION - 180 * DAY;
const SYMBOL = "FILUSDT";
const SOURCE = "bybit";
const ALL_WAKE_CONDITIONS = [
  "NextLifecycleTransition",
  "LifecycleStateEntered",
  "StructureEventConfirmed",
  "AvwapEventConfirmed",
  "RelativeStrengthEventConfirmed",
  "PriceCrossesKnownLevel",
  "PriceEntersKnownZone",
  "RadarOrLifecycleTerminal",
  "AnyOf",
] as const;

interface ReplayFixture {
  strategyProfile: StrategyProfile;
  radarSelectionProfile: RadarSelectionProfile;
  manifest: ReplayCaseManifest;
  episode: RadarEpisode;
  sessionConfig: ReplaySessionConfig;
  candles: ReplayCandleRecord[];
  analysisStateHistory: ReplayAnalysisStateObservation[];
  knownEvents: ReplayKnownEvent[];
  venueRules: VenueRiskRules | null;
  loaded: ReplayLoadedCase;
}

interface ReplayFixtureOptions {
  futureCloses?: number[];
  futureCandles?: ReplayCandleRecord[];
  extraCandles?: ReplayCandleRecord[];
  initialReferences?: DecisionReferenceLevel[];
  laterAnalysisStates?: ReplayAnalysisStateObservation[];
  knownEvents?: ReplayKnownEvent[];
  maximumCaseDuration?: number;
  maximumSingleWaitDuration?: number;
  allowEarlyReveal?: boolean;
  venueRules?: VenueRiskRules | null;
  initialLifecycleState?: SetupStateName;
  initialCandidateMetrics?: CandidateMetrics | null;
  radarCandles?: CandleRecord[];
  historicalCandles?: ReplayCandleRecord[];
}

describe("Replay Phase 1 session engine", () => {
  it("starts at the causal radar boundary and exposes only completed, cutoff-visible display candles", async () => {
    const correction = replayCandle(DETECTION - HOUR, 99, {
      knownAt: DETECTION + 2 * HOUR,
      revision: 2,
    });
    const fixture = await buildReplayFixture({ extraCandles: [correction] });
    const created = createReplaySession(fixture.loaded);

    expect(created).toMatchObject({ state: "Created", currentAsOf: null, frames: [] });

    const started = await applyReplayCommand(
      fixture.loaded,
      created,
      startCommand(created, "start:causal"),
    );
    const frame = currentFrame(started.session);
    const visible = frame.visibleCandlesByTimeframe["1h"];

    expect(frame).toMatchObject({
      requestedAsOf: DETECTION,
      effectiveAsOf: DETECTION,
      generatedAtLogicalTime: DETECTION,
    });
    expect(started.session.currentAsOf).toBe(fixture.manifest.startAsOf);
    expect(visible.map((item) => item.openTime)).toEqual([
      DETECTION - 2 * HOUR,
      DETECTION - HOUR,
    ]);
    expect(visible.every((item) => item.closeTime <= DETECTION && item.knownAt <= DETECTION)).toBe(
      true,
    );
    expect(visible.some((item) => item.observationId === correction.observationId)).toBe(false);
    expect(visible.some((item) => item.openTime === ANALYSIS_START)).toBe(false);
    expect(frame.latestVisibleCandleByTimeframe["1h"]?.c).toBe(92);
  });

  it("produces identical initial sessions and frames for divergent future paths", async () => {
    const pathA = await buildReplayFixture({ futureCloses: [94, 95, 96, 97] });
    const pathB = await buildReplayFixture({ futureCloses: [170, 140, 110, 80] });

    expect(pathA.loaded.dataBundle.causalPrefixFingerprint).toBe(
      pathB.loaded.dataBundle.causalPrefixFingerprint,
    );
    expect(pathA.loaded.dataBundle.internalBundleFingerprint).not.toBe(
      pathB.loaded.dataBundle.internalBundleFingerprint,
    );

    const createdA = createReplaySession(pathA.loaded);
    const createdB = createReplaySession(pathB.loaded);
    expect(createdA).toEqual(createdB);

    const startedA = await applyReplayCommand(
      pathA.loaded,
      createdA,
      startCommand(createdA, "start:future-independent"),
    );
    const startedB = await applyReplayCommand(
      pathB.loaded,
      createdB,
      startCommand(createdB, "start:future-independent"),
    );

    expect(startedA.session).toEqual(startedB.session);
    expect(serializeReplaySession(startedA.session)).toBe(
      serializeReplaySession(startedB.session),
    );
  });

  it("supports next-candle and elapsed-duration scheduled reviews with completed-candle alignment", async () => {
    const fixture = await buildReplayFixture();

    const nextStarted = await startSession(fixture.loaded, "start:next-candle");
    const nextPlan = wakePlan(nextStarted, {
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: DETECTION + 4 * HOUR,
    });
    const next = await applyReplayCommand(
      fixture.loaded,
      nextStarted,
      waitCommand(nextStarted, nextPlan, "wait:next-candle"),
    );

    expect(currentFrame(next.session)).toMatchObject({
      requestedAsOf: DETECTION + HOUR,
      effectiveAsOf: DETECTION + HOUR,
      activeWakeResult: { reason: "SCHEDULED_REVIEW", effectiveAsOf: DETECTION + HOUR },
    });

    const elapsedStarted = await startSession(fixture.loaded, "start:elapsed");
    const elapsedPlan = wakePlan(elapsedStarted, {
      scheduledReview: { mode: "elapsedDuration", durationSeconds: HOUR + HOUR / 2 },
      deadlineAsOf: DETECTION + 4 * HOUR,
    });
    const elapsed = await applyReplayCommand(
      fixture.loaded,
      elapsedStarted,
      waitCommand(elapsedStarted, elapsedPlan, "wait:elapsed"),
    );

    expect(currentFrame(elapsed.session)).toMatchObject({
      requestedAsOf: DETECTION + HOUR + HOUR / 2,
      effectiveAsOf: DETECTION + 2 * HOUR,
      activeWakeResult: { reason: "SCHEDULED_REVIEW", effectiveAsOf: DETECTION + 2 * HOUR },
    });
  });

  it("wakes an event condition at knownAt rather than its earlier eventTime", async () => {
    const shift = knownEvent({
      kind: "structure",
      eventType: "Shift",
      direction: "bearish",
      timeframe: "1h",
      eventTime: DETECTION + HOUR,
      knownAt: DETECTION + 3 * HOUR,
    });
    const fixture = await buildReplayFixture({ knownEvents: [shift] });
    const started = await startSession(fixture.loaded, "start:known-at");
    const plan = wakePlan(started, {
      conditions: [
        {
          type: "StructureEventConfirmed",
          timeframe: "1h",
          eventType: "Shift",
          direction: "bearish",
        },
      ],
      deadlineAsOf: DETECTION + 5 * HOUR,
    });
    const waited = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, plan, "wait:known-at"),
    );
    const wake = currentFrame(waited.session).activeWakeResult!;

    expect(wake).toMatchObject({
      reason: "CONDITION_TRIGGERED",
      effectiveAsOf: DETECTION + 3 * HOUR,
      triggeringEventIds: [shift.id],
      auditTrace: { firstTriggeringEffectiveAsOf: DETECTION + 3 * HOUR },
    });
    expect(wake.auditTrace.evaluationPointsChecked).toContain(DETECTION + HOUR);
    expect(wake.effectiveAsOf).not.toBe(shift.eventTime);
  });

  it("reports all conditions at the earliest matching time and ignores later matches", async () => {
    const shift = knownEvent({
      kind: "structure",
      eventType: "Shift",
      direction: "bearish",
      timeframe: "1h",
      eventTime: DETECTION + HOUR,
      knownAt: DETECTION + 2 * HOUR,
    });
    const rsBreak = knownEvent({
      kind: "relativeStrength",
      eventType: "break",
      direction: "bearish",
      timeframe: "1h",
      eventTime: DETECTION + HOUR,
      knownAt: DETECTION + 2 * HOUR,
    });
    const laterAvwap = knownEvent({
      kind: "avwap",
      eventType: "loss",
      direction: "bearish",
      timeframe: "1h",
      eventTime: DETECTION + 2 * HOUR,
      knownAt: DETECTION + 3 * HOUR,
      avwapId: "pump-avwap",
    });
    const fixture = await buildReplayFixture({ knownEvents: [laterAvwap, rsBreak, shift] });
    const started = await startSession(fixture.loaded, "start:same-time");
    const plan = wakePlan(started, {
      conditions: [
        {
          type: "StructureEventConfirmed",
          timeframe: "1h",
          eventType: "Shift",
          direction: "bearish",
        },
        { type: "RelativeStrengthEventConfirmed", timeframe: "1h", eventType: "break" },
        { type: "AvwapEventConfirmed", avwapId: "pump-avwap", eventType: "loss" },
      ],
      deadlineAsOf: DETECTION + 5 * HOUR,
    });
    const waited = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, plan, "wait:same-time"),
    );
    const wake = currentFrame(waited.session).activeWakeResult!;

    expect(wake.effectiveAsOf).toBe(DETECTION + 2 * HOUR);
    expect(new Set(wake.triggeredConditionIds)).toEqual(
      new Set([plan.conditions[0].id, plan.conditions[1].id]),
    );
    expect(new Set(wake.triggeringEventIds)).toEqual(new Set([shift.id, rsBreak.id]));
    expect(wake.triggeringEventIds).not.toContain(laterAvwap.id);
  });

  it("advances across many candles to an explicit deadline when no condition matches", async () => {
    const fixture = await buildReplayFixture();
    const started = await startSession(fixture.loaded, "start:deadline");
    const plan = wakePlan(started, {
      conditions: [
        { type: "RelativeStrengthEventConfirmed", timeframe: "1h", eventType: "never" },
      ],
      deadlineAsOf: DETECTION + 6 * HOUR,
    });
    const waited = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, plan, "wait:deadline"),
    );
    const wake = currentFrame(waited.session).activeWakeResult!;

    expect(wake).toMatchObject({
      reason: "DEADLINE_REACHED",
      effectiveAsOf: DETECTION + 6 * HOUR,
      triggeredConditionIds: [],
      triggeringEventIds: [],
    });
    expect(wake.auditTrace.evaluationPointsChecked).toEqual(
      Array.from({ length: 6 }, (_, index) => DETECTION + (index + 1) * HOUR),
    );
    expect(waited.session.frames).toHaveLength(2);
    expect(waited.session.decisionRecords).toHaveLength(1);
  });

  it("freezes known references, rejects unknown or changed references, and reveals corrections only at knownAt", async () => {
    const resistance = referenceLevel("resistance:100", 100, DETECTION);
    const futureReference = referenceLevel(
      "future:resistance:105",
      105,
      DETECTION + HOUR,
    );
    const original = replayCandle(DETECTION, 99, {
      knownAt: DETECTION + HOUR,
      revision: 1,
    });
    const correction = replayCandle(DETECTION, 101, {
      knownAt: DETECTION + HOUR + HOUR / 2,
      revision: 2,
    });
    const laterState = analysisState(
      DETECTION + HOUR,
      "notCandidate",
      [resistance, futureReference],
    );
    const fixture = await buildReplayFixture({
      futureCloses: [99, 102, 103, 104],
      extraCandles: [correction],
      initialReferences: [resistance],
      laterAnalysisStates: [laterState],
    });
    expect(
      fixture.candles.some((item) => item.observationId === original.observationId),
    ).toBe(true);
    const started = await startSession(fixture.loaded, "start:reference");
    expect(currentFrame(started).latestVisibleCandleByTimeframe["1h"]?.c).toBe(92);

    const changedPrice = wakePlan(started, {
      conditions: [
        {
          type: "PriceCrossesKnownLevel",
          timeframe: "1h",
          direction: "above",
          referenceId: resistance.id,
          frozenPrice: 101,
        },
      ],
      deadlineAsOf: DETECTION + 3 * HOUR,
    });
    await expect(
      applyReplayCommand(
        fixture.loaded,
        started,
        waitCommand(started, changedPrice, "wait:changed-reference"),
      ),
    ).rejects.toThrow("Frozen level price does not match");

    const unknownReference = wakePlan(started, {
      conditions: [
        {
          type: "PriceCrossesKnownLevel",
          timeframe: "1h",
          direction: "above",
          referenceId: futureReference.id,
          frozenPrice: futureReference.price,
        },
      ],
      deadlineAsOf: DETECTION + 3 * HOUR,
    });
    await expect(
      applyReplayCommand(
        fixture.loaded,
        started,
        waitCommand(started, unknownReference, "wait:future-reference"),
      ),
    ).rejects.toThrow("Unknown current-frame reference");

    const valid = wakePlan(started, {
      conditions: [
        {
          type: "PriceCrossesKnownLevel",
          timeframe: "1h",
          direction: "above",
          referenceId: resistance.id,
          frozenPrice: resistance.price,
        },
      ],
      deadlineAsOf: DETECTION + 3 * HOUR,
    });
    const waited = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, valid, "wait:correction-cross"),
    );
    const frame = currentFrame(waited.session);

    expect(frame.effectiveAsOf).toBe(correction.knownAt);
    expect(frame.latestVisibleCandleByTimeframe["1h"]).toMatchObject({
      observationId: correction.observationId,
      c: 101,
      knownAt: correction.knownAt,
    });
    expect(frame.visibleCandlesByTimeframe["1h"].some((item) => item.c === 101)).toBe(true);
    expect(valid.conditions[0]).toMatchObject({ referenceId: resistance.id, frozenPrice: 100 });
  });

  it("records Wait and Skip against their exact frames with structured rationale", async () => {
    const fixture = await buildReplayFixture();
    const started = await startSession(fixture.loaded, "start:records");
    const initialFrame = currentFrame(started);
    const plan = wakePlan(started, {
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: DETECTION + 3 * HOUR,
    });
    const waited = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, plan, "wait:records", {
        reason: "waiting_for_structure_break",
        confidence: 0.6,
        thesis: "Wait for confirmation",
        tags: ["manual-review"],
      }),
    );
    const waitRecord = waited.session.decisionRecords[0];
    const postWaitFrame = currentFrame(waited.session);

    expect(waitRecord).toMatchObject({
      action: "Wait",
      snapshotId: initialFrame.decisionSnapshot.id,
      decisionTime: initialFrame.effectiveAsOf,
      confidence: 0.6,
      thesis: "Wait for confirmation",
    });
    expect(waitRecord.tags).toEqual(["waiting_for_structure_break", "manual-review"]);
    expect(postWaitFrame.priorDecisionSummary).toEqual([
      expect.objectContaining({
        decisionRecordId: waitRecord.id,
        frameId: initialFrame.id,
        action: "Wait",
      }),
    ]);

    const skipped = await applyReplayCommand(
      fixture.loaded,
      waited.session,
      skipCommand(waited.session, "skip:records", {
        reasons: ["insufficientRewardRisk", "eventTooMature"],
        confidence: 0.8,
        thesis: "Geometry remains poor",
        tags: ["reviewed"],
      }),
    );
    const skipRecord = skipped.session.decisionRecords[1];

    expect(skipped.session.state).toBe("Skipped");
    expect(skipRecord).toMatchObject({
      action: "Skip",
      snapshotId: postWaitFrame.decisionSnapshot.id,
      skipReason: "insufficientRewardRisk",
      confidence: 0.8,
      thesis: "Geometry remains poor",
    });
    expect(skipRecord.tags).toEqual(["reviewed", "eventTooMature"]);
  });

  it("integrates compliant, overridden, and invalid finalized trade plans without fills or P&L", async () => {
    const rules = venueRulesFixture();
    const episodeHigh = candidateEpisodeReference(DETECTION);

    const compliantFixture = await buildReplayFixture({
      venueRules: rules,
      initialLifecycleState: "entryCandidate",
      initialCandidateMetrics: candidateMetrics(DETECTION),
      initialReferences: [episodeHigh],
    });
    const compliantStarted = await startSession(
      compliantFixture.loaded,
      "start:trade-compliant",
    );
    const compliant = await applyReplayCommand(
      compliantFixture.loaded,
      compliantStarted,
      proposeTradeCommand(
        compliantStarted,
        tradePlanProposal(compliantStarted),
        "trade:compliant",
      ),
    );
    const compliantAttempt = compliant.session.planningAttempts[0];

    expect(compliant.session.state).toBe("TradePlanRecorded");
    expect(compliantAttempt).toMatchObject({ accepted: true, rejectionReason: null });
    expect(compliantAttempt.tradePlan).toMatchObject({
      status: "finalized",
      complianceResult: {
        classification: "Compliant",
        hardErrors: [],
        strategyViolations: [],
      },
    });
    expect(compliant.session.decisionRecords[0]).toMatchObject({
      action: "ProposeTrade",
      tradePlan: { id: compliantAttempt.tradePlan.id },
    });
    expectNoFillOrPnlKeys(compliant.session);

    const overrideFixture = await buildReplayFixture({
      venueRules: rules,
      initialLifecycleState: "deteriorating",
      initialCandidateMetrics: candidateMetrics(DETECTION),
      initialReferences: [episodeHigh],
    });
    const overrideStarted = await startSession(overrideFixture.loaded, "start:trade-override");
    const overrideReason = "Researching relative deterioration before absolute structure breaks";
    const overrideProposal = tradePlanProposal(overrideStarted, {
      discretionaryOverrideReason: overrideReason,
    });
    const overridden = await applyReplayCommand(
      overrideFixture.loaded,
      overrideStarted,
      proposeTradeCommand(overrideStarted, overrideProposal, "trade:override"),
    );
    const overrideAttempt = overridden.session.planningAttempts[0];

    expect(overridden.session.state).toBe("TradePlanRecorded");
    expect(overrideAttempt).toMatchObject({ accepted: true, rejectionReason: null });
    expect(overrideAttempt.tradePlan.complianceResult).toMatchObject({
      classification: "Overridden",
      overrideReason,
    });
    expect(
      overrideAttempt.tradePlan.complianceResult.strategyViolations.map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "ENTRY_BEFORE_ENTRY_CANDIDATE",
        "ENTRY_BEFORE_STRUCTURE_BREAK",
        "ENTRY_BEFORE_RETEST",
      ]),
    );
    expectNoFillOrPnlKeys(overridden.session);

    const invalidFixture = await buildReplayFixture({
      venueRules: rules,
      initialLifecycleState: "entryCandidate",
      initialCandidateMetrics: candidateMetrics(DETECTION),
      initialReferences: [episodeHigh],
    });
    const invalidStarted = await startSession(invalidFixture.loaded, "start:trade-invalid");
    const validProposal = tradePlanProposal(invalidStarted);
    const invalidProposal = {
      ...validProposal,
      stopPlan: { ...validProposal.stopPlan, stopPrice: validProposal.entryPlan.intendedPrice },
    };
    const invalid = await applyReplayCommand(
      invalidFixture.loaded,
      invalidStarted,
      proposeTradeCommand(invalidStarted, invalidProposal, "trade:invalid"),
    );
    const invalidAttempt = invalid.session.planningAttempts[0];

    expect(invalid.session.state).toBe("Active");
    expect(invalid.session.currentFrameId).toBe(invalidStarted.currentFrameId);
    expect(invalid.session.decisionRecords).toEqual([]);
    expect(invalidAttempt).toMatchObject({ accepted: false, rejectionReason: "InvalidPlan" });
    expect(invalidAttempt.tradePlan.complianceResult.classification).toBe("InvalidPlan");
    expect(invalidAttempt.tradePlan.complianceResult.hardErrors.map((issue) => issue.code)).toContain(
      "STOP_NOT_ABOVE_ENTRY",
    );
    expectNoFillOrPnlKeys(invalid.session);
  });

  it("makes repeated command IDs idempotent and rejects reused payloads or stale revisions", async () => {
    const fixture = await buildReplayFixture();
    const created = createReplaySession(fixture.loaded);
    const start = startCommand(created, "start:idempotent");
    const first = await applyReplayCommand(fixture.loaded, created, start);
    const repeated = await applyReplayCommand(fixture.loaded, first.session, start);

    expect(repeated.idempotent).toBe(true);
    expect(repeated.session).toEqual(first.session);
    expect(repeated.session.events).toHaveLength(1);

    await expect(
      applyReplayCommand(fixture.loaded, first.session, {
        ...start,
        submittedLogicalTime: start.submittedLogicalTime + 1,
      }),
    ).rejects.toThrow("was reused with a different payload");

    const stale = {
      ...skipCommand(first.session, "skip:stale", { reasons: ["other"] }),
      expectedRevision: 0,
    };
    await expect(applyReplayCommand(fixture.loaded, first.session, stale)).rejects.toThrow(
      "Stale replay revision",
    );
  });

  it("serializes only the public causal session and rejects validly rehashed future payload injection", async () => {
    const fixture = await buildReplayFixture({ futureCloses: [987_654, 876_543, 765_432] });
    const started = await startSession(fixture.loaded, "start:serialization");
    const serialized = serializeReplaySession(started);
    const parsed = JSON.parse(serialized) as ReplaySession;

    expect(serialized).not.toContain("987654");
    expect(serialized).not.toContain("futureCandlesByTimeframe");
    expect(serialized).not.toContain("maximumFavorablePriceExcursionFromDetected");
    expect(parsed.frames.every(frameIsCutoffSafe)).toBe(true);
    expect(deserializeReplaySession(serialized)).toEqual(started);

    const { integrityHash: _ignored, ...sessionDefinition } = started;
    const contaminatedDefinition = {
      ...sessionDefinition,
      futureCandlesByTimeframe: { "1h": fixture.loaded.dataBundle.candlesByTimeframe["1h"] },
    };
    const contaminated = {
      ...contaminatedDefinition,
      integrityHash: canonicalHash(contaminatedDefinition),
    } as unknown as ReplaySession;

    expect(() => serializeReplaySession(contaminated)).toThrow(
      "Public replay session contains forbidden key futureCandlesByTimeframe",
    );
  });

  it("resumes to the same state and produces the same next frame without duplicating history", async () => {
    const fixture = await buildReplayFixture();
    const started = await startSession(fixture.loaded, "start:resume");
    const serialized = serializeReplaySession(started);
    const resumed = await resumeReplaySession(serialized, fixture.loaded);

    expect(resumed).toEqual(started);
    expect(reconstructReplaySession(resumed)).toEqual(resumed);

    const plan = wakePlan(started, {
      scheduledReview: { mode: "elapsedDuration", durationSeconds: 2 * HOUR },
      deadlineAsOf: DETECTION + 4 * HOUR,
    });
    const command = waitCommand(started, plan, "wait:resume");
    const continuous = await applyReplayCommand(fixture.loaded, started, command);
    const afterResume = await applyReplayCommand(fixture.loaded, resumed, command);

    expect(afterResume.session).toEqual(continuous.session);
    expect(afterResume.event).toEqual(continuous.event);
    expect(afterResume.session.events).toHaveLength(2);
    expect(afterResume.session.decisionRecords).toHaveLength(1);
    await expect(
      resumeReplaySession(serializeReplaySession(afterResume.session), fixture.loaded),
    ).resolves.toEqual(afterResume.session);
  });

  it("keeps outcomes behind the reveal barrier and permanently marks explicit early reveal", async () => {
    const normalFixture = await buildReplayFixture({ allowEarlyReveal: false });
    const normalStarted = await startSession(normalFixture.loaded, "start:reveal-normal");
    const normalStore = outcomeStore(normalFixture);

    await expect(
      applyReplayCommand(
        normalFixture.loaded,
        normalStarted,
        revealCommand(normalStarted, "reveal:blocked", true),
        normalStore,
      ),
    ).rejects.toThrow("Active replay reveal requires configured explicit abandon-and-reveal");

    const skipped = await applyReplayCommand(
      normalFixture.loaded,
      normalStarted,
      skipCommand(normalStarted, "skip:before-reveal", { reasons: ["discretionaryRejection"] }),
    );
    const revealed = await applyReplayCommand(
      normalFixture.loaded,
      skipped.session,
      revealCommand(skipped.session, "reveal:normal", false),
      normalStore,
    );

    expect(revealed.session).toMatchObject({
      state: "Revealed",
      revealedBeforeDecisionCompletion: false,
      revealedOutcomeEnvelopeId: revealed.outcomeEnvelope?.id,
    });
    expect(revealed.outcomeEnvelope?.outcome.radarTerminalResult).toEqual({
      secret: "FUTURE_OUTCOME_SENTINEL",
    });
    expect(serializeReplaySession(revealed.session)).not.toContain("FUTURE_OUTCOME_SENTINEL");
    await expect(
      applyReplayCommand(
        normalFixture.loaded,
        revealed.session,
        skipCommand(revealed.session, "skip:after-reveal", { reasons: ["other"] }),
      ),
    ).rejects.toThrow("No commands are accepted after Revealed");

    const earlyFixture = await buildReplayFixture({ allowEarlyReveal: true });
    const earlyStarted = await startSession(earlyFixture.loaded, "start:reveal-early");
    const earlyStore = outcomeStore(earlyFixture);

    await expect(
      applyReplayCommand(
        earlyFixture.loaded,
        earlyStarted,
        revealCommand(earlyStarted, "reveal:no-abandon", false),
        earlyStore,
      ),
    ).rejects.toThrow("Active replay reveal requires configured explicit abandon-and-reveal");

    const early = await applyReplayCommand(
      earlyFixture.loaded,
      earlyStarted,
      revealCommand(earlyStarted, "reveal:early", true),
      earlyStore,
    );
    expect(early.session).toMatchObject({
      state: "Revealed",
      revealedBeforeDecisionCompletion: true,
    });
    expect(early.outcomeEnvelope?.revealedBeforeDecisionCompletion).toBe(true);
  });

  it("produces the same current frame from full history and history physically truncated at the cutoff", async () => {
    const allFutureCandles = Array.from({ length: 8 }, (_, index) =>
      replayCandle(DETECTION + index * HOUR, 94 + index, { revision: 1 }),
    );
    const cutoff = DETECTION + 3 * HOUR;
    const full = await buildReplayFixture({ futureCandles: allFutureCandles });
    const truncated = await buildReplayFixture({ futureCandles: allFutureCandles.slice(0, 3) });

    expect(full.loaded.dataBundle.causalPrefixFingerprint).toBe(
      truncated.loaded.dataBundle.causalPrefixFingerprint,
    );
    expect(full.loaded.dataBundle.internalBundleFingerprint).not.toBe(
      truncated.loaded.dataBundle.internalBundleFingerprint,
    );

    const fullStarted = await startSession(full.loaded, "start:truncated-equivalence");
    const truncatedStarted = await startSession(
      truncated.loaded,
      "start:truncated-equivalence",
    );
    const fullPlan = wakePlan(fullStarted, {
      scheduledReview: { mode: "elapsedDuration", durationSeconds: 3 * HOUR },
      deadlineAsOf: cutoff,
    });
    const truncatedPlan = wakePlan(truncatedStarted, {
      scheduledReview: { mode: "elapsedDuration", durationSeconds: 3 * HOUR },
      deadlineAsOf: cutoff,
    });
    const fullAtCutoff = await applyReplayCommand(
      full.loaded,
      fullStarted,
      waitCommand(fullStarted, fullPlan, "wait:truncated-equivalence"),
    );
    const truncatedAtCutoff = await applyReplayCommand(
      truncated.loaded,
      truncatedStarted,
      waitCommand(truncatedStarted, truncatedPlan, "wait:truncated-equivalence"),
    );

    expect(currentFrame(fullAtCutoff.session)).toEqual(currentFrame(truncatedAtCutoff.session));
    expect(currentFrame(fullAtCutoff.session).effectiveAsOf).toBe(cutoff);
    expectNoFillOrPnlKeys(fullAtCutoff.session);
    expectNoFillOrPnlKeys(truncatedAtCutoff.session);
  });

  it("keeps a 100 to 120 to 145 to 170 continuation path replay-legitimate without assuming reversal", async () => {
    const continuation = await buildReplayFixture({
      radarCandles: [
        radarCandle(DETECTION - 2 * HOUR, 100),
        radarCandle(DETECTION - HOUR, 120),
      ],
      historicalCandles: [
        replayCandle(ANALYSIS_START, 100, { revision: 1 }),
        replayCandle(DETECTION - 2 * HOUR, 100, { revision: 1 }),
        replayCandle(DETECTION - HOUR, 120, { revision: 1 }),
      ],
      futureCandles: [
        replayCandle(DETECTION, 145, { revision: 1 }),
        replayCandle(DETECTION + HOUR, 170, { revision: 1 }),
      ],
    });

    expect(continuation.episode).toMatchObject({
      detectedAt: DETECTION,
      effectiveAsOf: DETECTION,
      triggeringDetectorIds: ["recent-trough-runup"],
    });
    const started = await startSession(continuation.loaded, "start:continuation");
    expect(currentFrame(started).latestVisibleCandleByTimeframe["1h"]?.c).toBe(120);

    const firstPlan = wakePlan(started, {
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: DETECTION + 2 * HOUR,
    });
    const after145 = await applyReplayCommand(
      continuation.loaded,
      started,
      waitCommand(started, firstPlan, "wait:continuation-145"),
    );
    expect(after145.session.state).toBe("Active");
    expect(currentFrame(after145.session).latestVisibleCandleByTimeframe["1h"]?.c).toBe(145);

    const secondPlan = wakePlan(after145.session, {
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: DETECTION + 2 * HOUR,
    });
    const after170 = await applyReplayCommand(
      continuation.loaded,
      after145.session,
      waitCommand(after145.session, secondPlan, "wait:continuation-170"),
    );
    expect(after170.session.state).toBe("Active");
    expect(currentFrame(after170.session).latestVisibleCandleByTimeframe["1h"]?.c).toBe(170);

    const skipped = await applyReplayCommand(
      continuation.loaded,
      after170.session,
      skipCommand(after170.session, "skip:continuation", {
        reasons: ["higherTimeframeContinuationTooStrong"],
        thesis: "Continuation invalidates the fade thesis",
      }),
    );
    expect(skipped.session.state).toBe("Skipped");
    expectNoFillOrPnlKeys(skipped.session);
  });

  it("starts the 100 to 80 to 92 rebound only at the crossing and freezes its path context", async () => {
    const fixture = await buildReplayFixture();
    const beforeCross = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        [SYMBOL]: {
          symbol: SYMBOL,
          source: SOURCE,
          dataOrigin: "test",
          candlesByTimeframe: {
            "1h": [
              radarCandle(DETECTION - 25 * HOUR, 100),
              radarCandle(DETECTION - 2 * HOUR, 80),
            ],
          },
        },
      },
      selectionProfile: fixture.radarSelectionProfile,
      strategyProfile: fixture.strategyProfile,
      from: DETECTION - 25 * HOUR,
      to: DETECTION - HOUR,
    });

    expect(beforeCross.episodes).toEqual([]);
    expect(fixture.episode).toMatchObject({
      detectedAt: DETECTION,
      effectiveAsOf: DETECTION,
      selectionAnchor: { price: 80, timestamp: DETECTION - 2 * HOUR },
      pathContext: {
        net24hReturnPct: expect.any(Number),
        priorDrawdownPct: expect.any(Number),
        triggeringLocalImpulseReturnPct: expect.any(Number),
        selectionAnchorPrice: 80,
        selectionAnchorTime: DETECTION - 2 * HOUR,
      },
    });
    expect(fixture.episode.pathContext.net24hReturnPct).toBeCloseTo(-8, 12);
    expect(fixture.episode.pathContext.priorDrawdownPct).toBeCloseTo(-20, 12);
    expect(fixture.episode.pathContext.triggeringLocalImpulseReturnPct).toBeCloseTo(15, 12);

    const started = await startSession(fixture.loaded, "start:drop-rebound");
    const frozenAnchor = currentFrame(started).radarContext.selectionAnchor;
    expect(frozenAnchor).toEqual(fixture.episode.selectionAnchor);

    const plan = wakePlan(started, {
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: DETECTION + HOUR,
    });
    const advanced = await applyReplayCommand(
      fixture.loaded,
      started,
      waitCommand(started, plan, "wait:drop-rebound"),
    );
    expect(currentFrame(advanced.session).radarContext).toMatchObject({
      selectionAnchor: frozenAnchor,
      pathContext: {
        net24hReturnPct: fixture.episode.pathContext.net24hReturnPct,
        priorDrawdownPct: fixture.episode.pathContext.priorDrawdownPct,
        triggeringLocalImpulseReturnPct:
          fixture.episode.pathContext.triggeringLocalImpulseReturnPct,
      },
    });
    expectNoFillOrPnlKeys(advanced.session);
  });
});

async function buildReplayFixture(options: ReplayFixtureOptions = {}): Promise<ReplayFixture> {
  const strategyProfile = strategyProfileFixture();
  const radarSelectionProfile = radarProfileFixture();
  const radarCandles = options.radarCandles ?? [
    radarCandle(DETECTION - 25 * HOUR, 100),
    radarCandle(DETECTION - 2 * HOUR, 80),
    radarCandle(DETECTION - HOUR, 92),
  ];
  const scan = scanRadarEpisodes({
    candlesBySymbolAndTimeframe: {
      [SYMBOL]: {
        symbol: SYMBOL,
        source: SOURCE,
        dataOrigin: "test",
        candlesByTimeframe: {
          "1h": radarCandles,
        },
      },
    },
    selectionProfile: radarSelectionProfile,
    strategyProfile,
    from: DETECTION - 25 * HOUR,
    to: DETECTION,
  });
  if (scan.episodes.length !== 1 || scan.replayCaseManifests.length !== 1) {
    throw new Error("Replay session fixture must create exactly one radar episode and manifest");
  }

  const futureCandles = options.futureCandles ?? Array.from(
    { length: 12 },
    (_, index) => replayCandle(
      DETECTION + index * HOUR,
      options.futureCloses?.[index] ?? 94 + index,
      { revision: 1 },
    ),
  );
  const historicalCandles = options.historicalCandles ?? [
    replayCandle(ANALYSIS_START, 70, { revision: 1 }),
    replayCandle(DETECTION - 2 * HOUR, 80, { revision: 1 }),
    replayCandle(DETECTION - HOUR, 92, { revision: 1 }),
  ];
  const candles = [
    ...historicalCandles,
    ...futureCandles,
    ...(options.extraCandles ?? []),
  ];
  const analysisStateHistory = [
    analysisState(
      DETECTION,
      options.initialLifecycleState ?? "notCandidate",
      options.initialReferences ?? [],
      options.initialCandidateMetrics ?? null,
    ),
    ...(options.laterAnalysisStates ?? []),
  ];
  const sessionConfig = createReplaySessionConfig(
    replayConfigDefinition(strategyProfile, options),
    strategyProfile,
  );
  const adapter = new InMemoryReplayHistoricalDataAdapter({
    candles,
    radarEpisodes: [scan.episodes[0]],
    analysisStateHistory,
    knownEvents: options.knownEvents ?? [],
    revisionHistoryAvailable: true,
  });
  const loaded = await loadReplayCase({
    manifest: scan.replayCaseManifests[0],
    sessionConfig,
    historicalDataAdapter: adapter,
    strategyProfile,
    radarSelectionProfile,
    venueRules: options.venueRules ?? null,
  });

  return {
    strategyProfile,
    radarSelectionProfile,
    manifest: scan.replayCaseManifests[0],
    episode: scan.episodes[0],
    sessionConfig,
    candles,
    analysisStateHistory,
    knownEvents: options.knownEvents ?? [],
    venueRules: options.venueRules ?? null,
    loaded,
  };
}

function strategyProfileFixture() {
  return createImpulseFadeResearchProfile({
    id: "replay-session.strategy.fixture",
    version: "1",
    name: "Replay session strategy fixture",
    timeframeRoles: { executionTimeframe: "1h", triggerTimeframe: "1h" },
    createdAt: DETECTION - DAY,
  });
}

function radarProfileFixture() {
  return createRadarSelectionProfile({
    schemaVersion: "radar-selection-profile.1",
    id: "replay-session.radar.fixture",
    version: "1",
    name: "Replay session radar fixture",
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [
      {
        id: "recent-trough-runup",
        type: "rollingTroughRunup",
        lookbackSeconds: 48 * HOUR,
        minimumRunupPct: 15,
        maximumTroughAgeSeconds: 48 * HOUR,
        referenceField: "close",
        minimumPercentile: null,
        minimumZScore: null,
        minimumSampleCount: 0,
        historyLookbackSeconds: 90 * DAY,
      },
    ],
    detectorCombination: { mode: "any" },
    hardGates: [],
    resetPolicy: { minimumFalseDurationSeconds: 2 * HOUR },
    episodeExpiry: { maximumAgeSeconds: 72 * HOUR },
    sourcePolicy: { allowedSources: [SOURCE] },
    executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
    liquidityPolicy: { minimumQuoteNotional: null, windowSeconds: DAY, missingData: "warn" },
    createdAt: DETECTION - DAY,
  });
}

function replayConfigDefinition(
  strategyProfile: StrategyProfile,
  options: ReplayFixtureOptions,
): ReplaySessionConfigDefinition {
  return {
    id: "replay-session.session.fixture",
    version: "1",
    schemaVersion: REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
    replayEngineVersion: REPLAY_ENGINE_VERSION,
    visibleTimeframes: ["1h"],
    displayPreRollByTimeframe: { "1h": 48 * HOUR },
    maximumCaseDuration: options.maximumCaseDuration ?? 12 * HOUR,
    maximumSingleWaitDuration: options.maximumSingleWaitDuration ?? 12 * HOUR,
    allowedWakeConditionTypes: [...ALL_WAKE_CONDITIONS],
    completedCandlesOnly: true,
    allowEarlyReveal: options.allowEarlyReveal ?? false,
    allowOutOfStrategyPlans: false,
    allowDiscretionaryOverrides: true,
    strategyProfileRef: {
      id: strategyProfile.id,
      version: strategyProfile.version,
      profileHash: strategyProfile.profileHash,
    },
    venueRulesRef: options.venueRules
      ? {
          id: `${options.venueRules.venue}:${options.venueRules.symbol}`,
          version: options.venueRules.feeSchedule.version,
          hash: canonicalHash(options.venueRules),
        }
      : null,
  };
}

function replayCandle(
  openTime: number,
  close: number,
  overrides: { knownAt?: number; revision?: number | null } = {},
) {
  return createReplayCandleRecord({
    symbol: SYMBOL,
    source: SOURCE,
    timeframe: "1h",
    openTime,
    o: close,
    h: close,
    l: close,
    c: close,
    vBase: 1_000,
    vQuote: close * 1_000,
    ...overrides,
  });
}

function radarCandle(openTime: number, close: number): CandleRecord {
  return {
    ts: openTime,
    bucket: openTime,
    x: openTime,
    o: close,
    h: close,
    l: close,
    c: close,
    v_base: 1_000,
    v_quote: close * 1_000,
    knownAt: openTime + HOUR,
  };
}

function analysisState(
  knownAt: number,
  state: SetupStateName,
  references: DecisionReferenceLevel[] = [],
  metrics: CandidateMetrics | null = null,
) {
  return createReplayAnalysisStateObservation({
    symbol: SYMBOL,
    source: SOURCE,
    knownAt,
    lifecycle: lifecycleSnapshot(knownAt, state),
    candidateMetrics: metrics,
    structureByTimeframe: { "1h": null },
    activeStructureLevels: references,
    supportResistanceZones: [],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: references,
    dataQualityNotes: [],
  });
}

function lifecycleSnapshot(asOf: number, state: SetupStateName): SetupStateSnapshot {
  const hasCandidate = !["notCandidate", "invalidated", "expired"].includes(state);
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash: impulseFadeLifecycleConfigHash(),
    asOf,
    executionTimeframe: "1h",
    state,
    currentState: state,
    stateSince: asOf,
    label: `PUMP FADE ${state}`,
    reason: "Replay session fixture",
    checks: [],
    updatedTs: asOf,
    candidate: hasCandidate
      ? {
          id: "replay-session:candidate",
          setupFamily: "impulse_fade_v1",
          lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
          lifecycleConfigHash: impulseFadeLifecycleConfigHash(),
          symbol: SYMBOL,
          source: SOURCE,
          venue: SOURCE,
          executionTimeframe: "1h",
          detectedAt: asOf - HOUR,
          detectionEventTime: asOf - 2 * HOUR,
          detectionMetrics: {
            returnPct: 15,
            percentile: 98,
            zScore: 2.7,
            atrExtension: 2.4,
          },
          initialMtfContext: [],
          episodeHigh: 100,
          episodeHighTime: asOf - HOUR,
          currentState: state,
          stateSince: asOf,
          terminalAt: null,
        }
      : null,
    evidence: state === "entryCandidate"
      ? [
          {
            id: "replay-session:retest",
            code: "bearish_retest_rejection",
            explanation: "Replay fixture retest rejected",
            eventTime: asOf - HOUR,
            knownAt: asOf,
            sourceTimeframe: "1h",
            contributesTo: "entryCandidate",
          },
        ]
      : [],
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

function candidateEpisodeReference(knownAt: number) {
  return createDecisionReferenceLevel({
    id: "replay-session:candidate:episode-high",
    kind: "candidateEpisodeHigh",
    price: 100,
    sourceTimeframe: "1h",
    eventTime: knownAt - HOUR,
    knownAt,
    sourceObject: {
      objectType: "SetupCandidateEpisode",
      objectId: "replay-session:candidate",
      snapshot: { episodeHigh: 100, episodeHighTime: knownAt - HOUR },
    },
  });
}

function candidateMetrics(asOf: number): CandidateMetrics {
  return {
    symbol: SYMBOL,
    exchange: SOURCE,
    marketType: "perp",
    source: "external",
    baseTimeframe: "1h",
    requestedAsOf: asOf,
    effectiveAsOf: asOf,
    sampleCount: 100,
    historyCoverage: {
      requestedStartTs: asOf - 180 * DAY,
      requestedEndTs: asOf,
      availableStartTs: asOf - 180 * DAY,
      availableEndTs: asOf,
      coveredSeconds: 180 * DAY,
      requestedSeconds: 180 * DAY,
      coverageRatio: 1,
    },
    insufficientDataReasons: [],
    extension: {
      windowSeconds: DAY,
      historyDays: 180,
      sampleCount: 100,
      latestTs: asOf - HOUR,
      referenceTs: asOf - DAY,
      latestClose: 92,
      referenceClose: 80,
      returnPct: 15,
      percentile: 98,
      zScore: 2.7,
    },
    timeframeExtensions: {},
    updatedAt: asOf,
  };
}

function venueRulesFixture(): VenueRiskRules {
  return {
    venue: "phemex",
    symbol: SYMBOL,
    quantityStep: 0.1,
    priceTick: 0.001,
    minQuantity: 0.1,
    minNotional: 5,
    maxLeverage: 25,
    leverageStep: 1,
    feeSchedule: { makerRate: 0.0002, takerRate: 0.00055, version: "replay-test.1" },
    maintenanceMarginModel: null,
    liquidationModel: null,
  };
}

function referenceLevel(id: string, price: number, knownAt: number) {
  return createDecisionReferenceLevel({
    id,
    kind: "structureLevel",
    price,
    sourceTimeframe: "1h",
    eventTime: knownAt - HOUR,
    knownAt,
    sourceObject: {
      objectType: "MarketStructureLevel",
      objectId: id,
      snapshot: { price, knownAt },
    },
  });
}

function knownEvent(
  input: Pick<
    ReplayKnownEvent,
    "kind" | "eventType" | "direction" | "timeframe" | "eventTime" | "knownAt"
  > & { avwapId?: string | null },
) {
  return createReplayKnownEvent({
    ...input,
    lifecycleState: null,
    avwapId: input.avwapId ?? null,
    detail: { fixture: true },
  });
}

function commandBase(session: ReplaySession, id: string) {
  return {
    schemaVersion: REPLAY_COMMAND_SCHEMA_VERSION,
    id,
    sessionId: session.id,
    expectedRevision: session.revision,
    currentFrameId: session.currentFrameId,
    submittedLogicalTime: session.currentAsOf ?? session.createdAtLogicalTime,
  } as const;
}

function startCommand(
  session: ReplaySession,
  id: string,
): Extract<ReplayCommand, { type: "StartSession" }> {
  return { ...commandBase(session, id), type: "StartSession", payload: {} };
}

function waitCommand(
  session: ReplaySession,
  plan: ReplayWakePlan,
  id: string,
  overrides: Partial<Extract<ReplayCommand, { type: "Wait" }>["payload"]> = {},
): Extract<ReplayCommand, { type: "Wait" }> {
  return {
    ...commandBase(session, id),
    type: "Wait",
    payload: {
      reason: "other",
      wakePlan: plan,
      ...overrides,
    },
  };
}

function skipCommand(
  session: ReplaySession,
  id: string,
  payload: Extract<ReplayCommand, { type: "Skip" }>["payload"],
): Extract<ReplayCommand, { type: "Skip" }> {
  return { ...commandBase(session, id), type: "Skip", payload };
}

type TradePlanProposal = Extract<ReplayCommand, { type: "ProposeTrade" }>["payload"];

function tradePlanProposal(
  session: ReplaySession,
  overrides: Partial<TradePlanProposal> = {},
): TradePlanProposal {
  const snapshot = currentFrame(session).decisionSnapshot;
  const episodeHigh = snapshot.visibleOrSelectedReferenceLevels.find(
    (reference) => reference.kind === "candidateEpisodeHigh",
  );
  if (!episodeHigh) throw new Error("Expected a frozen candidate episode-high reference");
  return {
    entryPlan: {
      orderPlanType: "manualReference",
      intendedPrice: 92,
      priceSource: "decision snapshot",
      associatedReferenceLevelId: null,
      associatedReferenceLevel: null,
      expiresAt: null,
      cancellationCondition: null,
    },
    stopPlan: {
      stopPrice: 101,
      derivationType: "episodeHigh",
      referenceLevelId: episodeHigh.id,
      referenceLevel: episodeHigh,
      buffer: { basisPoints: 100, atrFraction: null, atrValue: null },
      rationale: "One percent beyond the frozen episode high",
    },
    targetPlans: [
      {
        id: "target-1",
        targetPrice: 70,
        positionFraction: 1,
        derivationType: "manual",
        referenceLevelId: null,
        referenceLevel: null,
        rationale: "Deterministic replay research target",
      },
    ],
    accountState: { equity: 10_000, availableBalance: 5_000, quoteCurrency: "USDT" },
    riskRequest: {
      accountRiskFraction: 0.01,
      fixedRiskAmount: null,
      maximumMarginAllocationFraction: 0.25,
      maximumNotional: null,
    },
    leveragePolicy: { mode: "manual", leverage: 2 },
    stopDistanceAtr: 1.25,
    discretionaryOverrideReason: null,
    status: "finalized",
    ...overrides,
  };
}

function proposeTradeCommand(
  session: ReplaySession,
  payload: TradePlanProposal,
  id: string,
): Extract<ReplayCommand, { type: "ProposeTrade" }> {
  return { ...commandBase(session, id), type: "ProposeTrade", payload };
}

function revealCommand(
  session: ReplaySession,
  id: string,
  abandonActive: boolean,
): Extract<ReplayCommand, { type: "RevealOutcome" }> {
  return {
    ...commandBase(session, id),
    type: "RevealOutcome",
    payload: { abandonActive },
  };
}

async function startSession(loaded: ReplayLoadedCase, commandId: string) {
  const created = createReplaySession(loaded);
  return (await applyReplayCommand(loaded, created, startCommand(created, commandId))).session;
}

function currentFrame(session: ReplaySession) {
  const frame = session.frames.find((item) => item.id === session.currentFrameId);
  if (!frame) throw new Error("Expected current replay frame");
  return frame;
}

function wakePlan(
  session: ReplaySession,
  input: Omit<Parameters<typeof createReplayWakePlan>[0], "submittedFrameId" | "createdAt">,
) {
  const frame = currentFrame(session);
  return createReplayWakePlan({
    ...input,
    submittedFrameId: frame.id,
    createdAt: frame.effectiveAsOf,
  });
}

function frameIsCutoffSafe(frame: ReplaySession["frames"][number]) {
  return Object.values(frame.visibleCandlesByTimeframe)
    .flat()
    .every(
      (candle) => candle.closeTime <= frame.effectiveAsOf && candle.knownAt <= frame.effectiveAsOf,
    );
}

function expectNoFillOrPnlKeys(value: unknown) {
  const forbidden = new Set([
    "fill",
    "fills",
    "pnl",
    "realizedpnl",
    "unrealizedpnl",
    "profitandloss",
    "profitloss",
  ]);
  const found: string[] = [];
  const visit = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return;
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(entry)) {
      if (forbidden.has(key.toLowerCase())) found.push(key);
      visit(child);
    }
  };
  visit(value);
  expect(found).toEqual([]);
}

function outcomeStore(fixture: ReplayFixture) {
  const outcome: ReplayCaseOutcome = {
    futureCandlesByTimeframe: fixture.loaded.dataBundle.candlesByTimeframe,
    lifecycleTimeline: [{ knownAt: DETECTION + HOUR, state: "deteriorating" }],
    radarTerminalResult: { secret: "FUTURE_OUTCOME_SENTINEL" },
    maximumFavorablePriceExcursionFromDetected: 12,
    maximumAdversePriceExcursionFromDetected: 4,
    lifecycleStateTimestamps: { deteriorating: DETECTION + HOUR },
    dataQualityNotes: [],
  };
  return new InMemoryReplayOutcomeStore({ [fixture.manifest.id]: outcome });
}
