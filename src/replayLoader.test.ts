import { describe, expect, it } from "vitest";
import {
  IMPULSE_FADE_LIFECYCLE_VERSION,
  impulseFadeLifecycleConfigHash,
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
  REPLAY_ENGINE_VERSION,
  REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  createDefaultReplaySessionConfig,
  createReplayAnalysisStateObservation,
  createReplayCandleRecord,
  createReplaySessionConfig,
  loadReplayCase,
  replayCandleLogicalId,
  replayCandleObservationId,
  replayDataFingerprintAt,
  replaySessionConfigHash,
  type ReplayAnalysisStateObservation,
  type ReplayCandleRecord,
  type ReplaySessionConfig,
  type ReplaySessionConfigDefinition,
} from "./replay";
import {
  createImpulseFadeResearchProfile,
  type StrategyProfile,
} from "./strategy";
import type { CandleRecord } from "./types";

const HOUR = 3_600;
const DAY = 86_400;
const DETECTION = Date.parse("2024-07-01T00:00:00Z") / 1_000;
const ANALYSIS_START = DETECTION - 180 * DAY;
const SYMBOL = "FILUSDT";
const SOURCE = "bybit";

interface ReplayFixture {
  strategyProfile: StrategyProfile;
  radarSelectionProfile: RadarSelectionProfile;
  manifest: ReplayCaseManifest;
  episode: RadarEpisode;
  sessionConfig: ReplaySessionConfig;
  candles: ReplayCandleRecord[];
  analysisState: ReplayAnalysisStateObservation;
}

describe("replay configuration", () => {
  it("defaults optional settings and binds the canonical hash to the normalized config", () => {
    const strategyProfile = strategyProfileFixture();
    const definition = replayConfigDefinition(strategyProfile);
    const config = createReplaySessionConfig(definition, strategyProfile);
    const repeated = createReplaySessionConfig(definition, strategyProfile);

    expect(config).toMatchObject({
      evaluationTimeframe: "1h",
      defaultWaitDeadline: null,
      identityPresentationMode: null,
      endOnRadarEpisodeTerminal: false,
      endOnLifecycleTerminal: false,
      venueRulesRef: null,
    });
    expect(config.canonicalConfigHash).toBe(replaySessionConfigHash(config));
    expect(repeated).toEqual(config);
    expect(Object.isFrozen(config)).toBe(true);

    const defaults = createDefaultReplaySessionConfig(strategyProfile);
    expect(defaults.evaluationTimeframe).toBe("1h");
    expect(defaults.visibleTimeframes).toEqual(["1h", "4h", "1d"]);
    expect(defaults.canonicalConfigHash).toBe(replaySessionConfigHash(defaults));
  });

  it("rejects unsupported versions and a config changed after hashing", async () => {
    const fixture = buildReplayFixture();
    const invalidSchema = {
      ...replayConfigDefinition(fixture.strategyProfile),
      schemaVersion: "replay-session-config.0",
    } as ReplaySessionConfigDefinition;
    const invalidVersion = {
      ...replayConfigDefinition(fixture.strategyProfile),
      replayEngineVersion: "replay-engine.0",
    } as ReplaySessionConfigDefinition;

    expect(() =>
      createReplaySessionConfig(invalidSchema, fixture.strategyProfile),
    ).toThrow("Unsupported replay session configuration version");
    expect(() =>
      createReplaySessionConfig(invalidVersion, fixture.strategyProfile),
    ).toThrow("Unsupported replay session configuration version");

    const tamperedConfig = {
      ...fixture.sessionConfig,
      maximumCaseDuration: fixture.sessionConfig.maximumCaseDuration + HOUR,
    };
    await expect(loadFixture(fixture, { sessionConfig: tamperedConfig })).rejects.toThrow(
      "Replay configuration failed version or hash verification",
    );
  });
});

describe("replay candle identity", () => {
  it("uses aligned open/close timestamps and separates logical candles from revisions", () => {
    const original = replayCandle(DETECTION - HOUR, 90, {
      knownAt: DETECTION,
      revision: 1,
    });
    const repeated = replayCandle(DETECTION - HOUR, 90, {
      knownAt: DETECTION,
      revision: 1,
    });
    const correction = replayCandle(DETECTION - HOUR, 92, {
      knownAt: DETECTION + HOUR,
      revision: 2,
    });
    const next = replayCandle(DETECTION, 93, {
      knownAt: DETECTION + HOUR,
      revision: 1,
    });

    expect(original).toMatchObject({
      openTime: DETECTION - HOUR,
      closeTime: DETECTION,
      knownAt: DETECTION,
      logicalCandleId: replayCandleLogicalId({
        symbol: SYMBOL,
        source: SOURCE,
        timeframe: "1h",
        openTime: DETECTION - HOUR,
      }),
    });
    expect(original.observationId).toBe(replayCandleObservationId(original));
    expect(repeated).toEqual(original);
    expect(correction.logicalCandleId).toBe(original.logicalCandleId);
    expect(correction.observationId).not.toBe(original.observationId);
    expect(next.logicalCandleId).not.toBe(original.logicalCandleId);
  });

  it("rejects unaligned candles and revisions known before candle close", () => {
    expect(() => replayCandle(DETECTION - HOUR + 1, 90)).toThrow(
      "Candle openTime must align to its timeframe",
    );
    expect(() =>
      replayCandle(DETECTION - HOUR, 90, { knownAt: DETECTION - 1 }),
    ).toThrow("Candle knownAt cannot precede its close");
  });
});

describe("replay case loading", () => {
  it("loads a causally complete case with verified manifest, profiles, and RadarEpisode", async () => {
    const fixture = buildReplayFixture();
    const loaded = await loadFixture(fixture);

    expect(loaded.manifest.id).toBe(fixture.manifest.id);
    expect(loaded.strategyProfile.profileHash).toBe(fixture.strategyProfile.profileHash);
    expect(loaded.radarSelectionProfile.canonicalConfigHash).toBe(
      fixture.radarSelectionProfile.canonicalConfigHash,
    );
    expect(loaded.dataBundle.radarEpisode).toEqual(fixture.episode);
    expect(loaded.dataBundle.causalPrefixFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("rejects broken manifest, profile, and RadarEpisode provenance", async () => {
    const fixture = buildReplayFixture();
    const tamperedManifest = { ...fixture.manifest, source: "binance" };
    const tamperedStrategy = { ...fixture.strategyProfile, name: "tampered" };
    const tamperedRadarProfile = { ...fixture.radarSelectionProfile, name: "tampered" };
    const tamperedEpisode = {
      ...fixture.episode,
      effectiveAsOf: fixture.episode.effectiveAsOf + HOUR,
    };

    await expect(loadFixture(fixture, { manifest: tamperedManifest })).rejects.toThrow(
      "ReplayCaseManifest failed schema or deterministic identity verification",
    );
    await expect(
      loadFixture(fixture, { strategyProfile: tamperedStrategy }),
    ).rejects.toThrow("Strategy profile reference mismatch");
    await expect(
      loadFixture(fixture, { radarSelectionProfile: tamperedRadarProfile }),
    ).rejects.toThrow("Radar selection profile reference mismatch");
    await expect(loadFixture(fixture, { episode: tamperedEpisode })).rejects.toThrow(
      "RadarEpisode sidecar does not match the ReplayCaseManifest",
    );
  });

  it("fails closed when analysis pre-roll begins after the required boundary", async () => {
    const fixture = buildReplayFixture();
    const lateCandles = fixture.candles.filter(
      (candle) => candle.openTime !== ANALYSIS_START,
    );

    await expect(loadFixture(fixture, { candles: lateCandles })).rejects.toThrow(
      "INSUFFICIENT_ANALYSIS_PREROLL:1h",
    );
  });

  it("loads with a warning when display pre-roll exceeds otherwise sufficient analysis history", async () => {
    const fixture = buildReplayFixture();
    const sessionConfig = createReplaySessionConfig(
      {
        ...replayConfigDefinition(fixture.strategyProfile),
        displayPreRollByTimeframe: { "1h": 200 * DAY },
      },
      fixture.strategyProfile,
    );
    const loaded = await loadFixture(fixture, { sessionConfig });

    expect(loaded.dataBundle.analysisStartByTimeframe["1h"]).toBe(ANALYSIS_START);
    expect(loaded.dataBundle.displayStartByTimeframe["1h"]).toBe(
      DETECTION - 200 * DAY,
    );
    expect(loaded.dataBundle.dataQualityNotes).toContainEqual(
      expect.objectContaining({
        code: "INSUFFICIENT_DISPLAY_PREROLL",
        severity: "warning",
      }),
    );
  });

  it("keeps a later-known candle revision out of the detection-time prefix", async () => {
    const fixture = buildReplayFixture();
    const correction = replayCandle(DETECTION - HOUR, 95, {
      knownAt: DETECTION + HOUR,
      revision: 2,
    });
    const baseline = await loadFixture(fixture, { revisionHistoryAvailable: true });
    const revised = await loadFixture(fixture, {
      candles: [...fixture.candles, correction],
      revisionHistoryAvailable: true,
    });

    const revisions = revised.dataBundle.candlesByTimeframe["1h"].filter(
      (candle) => candle.logicalCandleId === correction.logicalCandleId,
    );
    expect(revisions.map((candle) => candle.revision)).toEqual([1, 2]);
    expect(revised.dataBundle.causalPrefixFingerprint).toBe(
      baseline.dataBundle.causalPrefixFingerprint,
    );
    expect(revised.dataBundle.internalBundleFingerprint).not.toBe(
      baseline.dataBundle.internalBundleFingerprint,
    );
    await expect(replayDataFingerprintAt(revised, DETECTION + HOUR)).resolves.not.toBe(
      revised.dataBundle.causalPrefixFingerprint,
    );
  });

  it("produces the same causal prefix for divergent future price paths", async () => {
    const fixture = buildReplayFixture();
    const pathA = replaceFutureCandle(fixture.candles, replayCandle(DETECTION, 94));
    const pathB = replaceFutureCandle(fixture.candles, replayCandle(DETECTION, 130));
    const loadedA = await loadFixture(fixture, {
      candles: pathA,
      revisionHistoryAvailable: true,
    });
    const loadedB = await loadFixture(fixture, {
      candles: pathB,
      revisionHistoryAvailable: true,
    });

    expect(loadedA.dataBundle.causalPrefixFingerprint).toBe(
      loadedB.dataBundle.causalPrefixFingerprint,
    );
    expect(loadedA.dataBundle.internalBundleFingerprint).not.toBe(
      loadedB.dataBundle.internalBundleFingerprint,
    );
    await expect(replayDataFingerprintAt(loadedA, DETECTION)).resolves.toBe(
      loadedA.dataBundle.causalPrefixFingerprint,
    );
    await expect(replayDataFingerprintAt(loadedB, DETECTION)).resolves.toBe(
      loadedB.dataBundle.causalPrefixFingerprint,
    );
  });
});

function buildReplayFixture(): ReplayFixture {
  const strategyProfile = strategyProfileFixture();
  const radarSelectionProfile = createRadarSelectionProfile({
    schemaVersion: "radar-selection-profile.1",
    id: "replay-loader.radar.fixture",
    version: "1",
    name: "Replay loader radar fixture",
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
    liquidityPolicy: {
      minimumQuoteNotional: null,
      windowSeconds: DAY,
      missingData: "warn",
    },
    createdAt: DETECTION - DAY,
  });
  const radarCandles = [
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
        candlesByTimeframe: { "1h": radarCandles },
      },
    },
    selectionProfile: radarSelectionProfile,
    strategyProfile,
    from: DETECTION - 25 * HOUR,
    to: DETECTION,
  });
  if (scan.episodes.length !== 1 || scan.replayCaseManifests.length !== 1) {
    throw new Error("Replay loader fixture must create exactly one radar episode and manifest");
  }

  const candles = [
    replayCandle(ANALYSIS_START, 70, { revision: 1 }),
    replayCandle(DETECTION - 2 * HOUR, 80, { revision: 1 }),
    replayCandle(DETECTION - HOUR, 92, { revision: 1 }),
    replayCandle(DETECTION, 94, { revision: 1 }),
  ];
  const analysisState = createReplayAnalysisStateObservation({
    symbol: SYMBOL,
    source: SOURCE,
    knownAt: DETECTION,
    lifecycle: lifecycleSnapshot(DETECTION),
    candidateMetrics: null,
    structureByTimeframe: { "1h": null },
    activeStructureLevels: [],
    supportResistanceZones: [],
    avwapState: null,
    avwapEvents: [],
    relativeStrengthState: null,
    relativeStrengthEvents: [],
    visibleOrSelectedReferenceLevels: [],
    dataQualityNotes: [],
  });
  const sessionConfig = createReplaySessionConfig(
    replayConfigDefinition(strategyProfile),
    strategyProfile,
  );

  return {
    strategyProfile,
    radarSelectionProfile,
    manifest: scan.replayCaseManifests[0],
    episode: scan.episodes[0],
    sessionConfig,
    candles,
    analysisState,
  };
}

function strategyProfileFixture() {
  return createImpulseFadeResearchProfile({
    id: "replay-loader.strategy.fixture",
    version: "1",
    name: "Replay loader strategy fixture",
    timeframeRoles: {
      executionTimeframe: "1h",
      triggerTimeframe: "1h",
    },
    createdAt: DETECTION - DAY,
  });
}

function replayConfigDefinition(
  strategyProfile: StrategyProfile,
): ReplaySessionConfigDefinition {
  return {
    id: "replay-loader.session.fixture",
    version: "1",
    schemaVersion: REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
    replayEngineVersion: REPLAY_ENGINE_VERSION,
    visibleTimeframes: ["1h"],
    displayPreRollByTimeframe: { "1h": 48 * HOUR },
    maximumCaseDuration: 3 * HOUR,
    maximumSingleWaitDuration: 2 * HOUR,
    allowedWakeConditionTypes: ["NextLifecycleTransition"],
    completedCandlesOnly: true,
    allowEarlyReveal: false,
    allowOutOfStrategyPlans: false,
    allowDiscretionaryOverrides: true,
    strategyProfileRef: {
      id: strategyProfile.id,
      version: strategyProfile.version,
      profileHash: strategyProfile.profileHash,
    },
  };
}

async function loadFixture(
  fixture: ReplayFixture,
  overrides: {
    manifest?: ReplayCaseManifest;
    sessionConfig?: ReplaySessionConfig;
    strategyProfile?: StrategyProfile;
    radarSelectionProfile?: RadarSelectionProfile;
    episode?: RadarEpisode;
    candles?: ReplayCandleRecord[];
    revisionHistoryAvailable?: boolean;
  } = {},
) {
  const adapter = new InMemoryReplayHistoricalDataAdapter({
    candles: overrides.candles ?? fixture.candles,
    radarEpisodes: [overrides.episode ?? fixture.episode],
    analysisStateHistory: [fixture.analysisState],
    revisionHistoryAvailable: overrides.revisionHistoryAvailable ?? false,
  });
  return loadReplayCase({
    manifest: overrides.manifest ?? fixture.manifest,
    sessionConfig: overrides.sessionConfig ?? fixture.sessionConfig,
    historicalDataAdapter: adapter,
    strategyProfile: overrides.strategyProfile ?? fixture.strategyProfile,
    radarSelectionProfile:
      overrides.radarSelectionProfile ?? fixture.radarSelectionProfile,
  });
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

function lifecycleSnapshot(asOf: number): SetupStateSnapshot {
  return {
    strategy: "pumpFade",
    setupFamily: "impulse_fade_v1",
    lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
    lifecycleConfigHash: impulseFadeLifecycleConfigHash(),
    asOf,
    executionTimeframe: "1h",
    state: "notCandidate",
    currentState: "notCandidate",
    stateSince: asOf,
    label: "PUMP FADE Not Candidate",
    reason: "Replay loader fixture",
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

function replaceFutureCandle(
  candles: ReplayCandleRecord[],
  replacement: ReplayCandleRecord,
) {
  return [
    ...candles.filter((candle) => candle.logicalCandleId !== replacement.logicalCandleId),
    replacement,
  ];
}
