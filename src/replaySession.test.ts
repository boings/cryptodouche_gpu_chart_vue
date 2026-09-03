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
import type { CandleRecord } from "./types";

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
});

async function buildReplayFixture(options: ReplayFixtureOptions = {}): Promise<ReplayFixture> {
  const strategyProfile = strategyProfileFixture();
  const radarSelectionProfile = radarProfileFixture();
  const scan = scanRadarEpisodes({
    candlesBySymbolAndTimeframe: {
      [SYMBOL]: {
        symbol: SYMBOL,
        source: SOURCE,
        dataOrigin: "test",
        candlesByTimeframe: {
          "1h": [
            radarCandle(DETECTION - 25 * HOUR, 100),
            radarCandle(DETECTION - 2 * HOUR, 80),
            radarCandle(DETECTION - HOUR, 92),
          ],
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
  const candles = [
    replayCandle(ANALYSIS_START, 70, { revision: 1 }),
    replayCandle(DETECTION - 2 * HOUR, 80, { revision: 1 }),
    replayCandle(DETECTION - HOUR, 92, { revision: 1 }),
    ...futureCandles,
    ...(options.extraCandles ?? []),
  ];
  const analysisStateHistory = [
    analysisState(DETECTION, "notCandidate", options.initialReferences ?? []),
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
) {
  return createReplayAnalysisStateObservation({
    symbol: SYMBOL,
    source: SOURCE,
    knownAt,
    lifecycle: lifecycleSnapshot(knownAt, state),
    candidateMetrics: null,
    structureByTimeframe: { "1h": null },
    activeStructureLevels: [],
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
    candidate: null,
    evidence: [],
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
