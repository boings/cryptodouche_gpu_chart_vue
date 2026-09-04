import { describe, expect, it } from "vitest";

import { EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE, type RadarEpisode } from "./radar";
import { createReplayCandleRecord, type ReplayCandleRecord } from "./replay";
import { createExperimentalReplayAnalysisProfile, type MaterializeReplayAnalysisInput } from "./replayAnalysis";
import {
  MaterializedReplayAnalysisProvider,
  advanceReplayAnalysisTo,
  clearReplayAnalysisCache,
  createReplayAnalysisSession,
  deserializeReplayAnalysisSession,
  materializeReplayAnalysisAt,
  replayAnalysisCacheSize,
  serializeReplayAnalysisSession,
} from "./replayAnalysisSession";
import { canonicalSerialize } from "./serialization";
import { DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE } from "./strategy";

const HOUR = 3_600;
const QUARTER = 900;
const START = 1_700_006_400;

function candleSeries(symbol: string, timeframe: "15m" | "1h", count: number) {
  const seconds = timeframe === "15m" ? QUARTER : HOUR;
  return Array.from({ length: count }, (_, index) => {
    const close = (symbol === "BTCUSDT" ? 40_000 : 100) + index;
    return createReplayCandleRecord({
      symbol,
      source: "bybit",
      timeframe,
      openTime: START + index * seconds,
      o: close - 0.5,
      h: close + 1,
      l: close - 1,
      c: close,
      vBase: 1_000,
      revision: 1,
    });
  });
}

function sessionInput(): Omit<MaterializeReplayAnalysisInput, "asOf"> {
  const strategyProfile = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;
  const analysisProfile = createExperimentalReplayAnalysisProfile(strategyProfile, {
    evaluatedTimeframes: ["15m", "1h"],
    contextTimeframes: [],
    extensionConfig: {
      windowSeconds: HOUR,
      historyDays: 1,
      minSamples: 1,
      emaPeriod: 2,
      atrPeriod: 2,
    },
    structureConfig: {
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
      maxSwings: 30,
      maxBreaks: 10,
    },
    relativeStrengthConfig: {
      timeframe: "15m",
      formulaVersion: "relative-ratio.1",
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
      maxSwings: 30,
      maxBreaks: 10,
      minDeltaPct: 0.1,
      maxAgeBars: 100,
      maxDivergences: 10,
      includeDivergences: true,
      includeLeads: true,
      includeBreaks: true,
    },
  });
  return {
    symbol: "FILUSDT",
    source: "bybit",
    candlesByTimeframe: {
      "15m": candleSeries("FILUSDT", "15m", 32),
      "1h": candleSeries("FILUSDT", "1h", 8),
    },
    referenceCandlesByTimeframe: {
      "15m": candleSeries("BTCUSDT", "15m", 32),
      "1h": candleSeries("BTCUSDT", "1h", 8),
    },
    radarEpisode: { id: "episode-1", symbol: "FILUSDT", source: "bybit" } as RadarEpisode,
    radarSelectionProfile: EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
    strategyProfile,
    analysisProfile,
  };
}

describe("replay analysis sessions", () => {
  it("produces the same current state through batch, incremental, and resume paths", () => {
    const input = sessionInput();
    const target = START + 6 * HOUR + 7 * 60;
    const oneShot = advanceReplayAnalysisTo(createReplayAnalysisSession(input), target);
    const halfway = advanceReplayAnalysisTo(
      createReplayAnalysisSession(input),
      START + 3 * HOUR,
    );
    const incremental = advanceReplayAnalysisTo(halfway, target);
    const resumed = advanceReplayAnalysisTo(
      deserializeReplayAnalysisSession(serializeReplayAnalysisSession(halfway)),
      target,
    );

    expect(incremental.states).toEqual(oneShot.states);
    expect(resumed).toEqual(incremental);
    expect(oneShot.states.at(-1)).toEqual(
      materializeReplayAnalysisAt(createReplayAnalysisSession(input), target),
    );
    expect(new Set(oneShot.states.map((state) => state.id)).size).toBe(oneShot.states.length);
  });

  it("invalidates only correction-affected states and preserves prior frozen results", () => {
    const input = sessionInput();
    const original = input.candlesByTimeframe["15m"][4]!;
    const before = advanceReplayAnalysisTo(
      createReplayAnalysisSession(input),
      START + 6 * HOUR,
    );
    const frozenIds = before.states
      .filter((state) => state.effectiveAsOf < START + 4 * HOUR + QUARTER)
      .map((state) => state.id);
    const correction = createReplayCandleRecord({
      symbol: original.symbol,
      source: original.source,
      timeframe: original.timeframe,
      openTime: original.openTime,
      o: original.o,
      h: original.h + 20,
      l: original.l,
      c: original.c + 10,
      vBase: original.vBase,
      revision: 2,
      knownAt: START + 4 * HOUR + 60,
      correctionPublishedAt: START + 4 * HOUR + 60,
    });
    const after = advanceReplayAnalysisTo(before, START + 7 * HOUR, {
      candlesByTimeframe: { "15m": [correction] },
    });

    expect(after.states.filter((state) => state.effectiveAsOf < START + 4 * HOUR + QUARTER)
      .map((state) => state.id)).toEqual(frozenIds);
    expect(after.events.some((event) =>
      event.kind === "invalidated" && event.sourceObservationIds.includes(correction.observationId),
    )).toBe(true);
    expect(after.states.at(-1)?.freshnessByComponent["timeframe:15m"]?.sourceObservationIds)
      .toContain(correction.observationId);
  });

  it("provides a bounded reusable materialized provider", () => {
    clearReplayAnalysisCache();
    const provider = new MaterializedReplayAnalysisProvider(
      createReplayAnalysisSession(sessionInput()),
    );
    const first = provider.materializeAt(START + 2 * HOUR);
    const repeated = provider.materializeAt(START + 2 * HOUR);
    expect(repeated).toEqual(first);
    expect(replayAnalysisCacheSize()).toBe(1);
    expect(provider.getRequiredCoverage().map((item) => item.component)).toContain(
      "relativeStrength",
    );

    const advanced = provider.advanceTo(START + 3 * HOUR);
    const serialized = provider.serializeState();
    const restored = new MaterializedReplayAnalysisProvider(createReplayAnalysisSession(sessionInput()));
    restored.resumeState(serialized);
    expect(restored.materializeAt(START + 3 * HOUR)).toEqual(advanced);
  });

  it("rejects a tampered serialized session", () => {
    const session = advanceReplayAnalysisTo(
      createReplayAnalysisSession(sessionInput()),
      START + 2 * HOUR,
    );
    const tampered = canonicalSerialize({
      ...session,
      revision: session.revision + 1,
    });
    expect(() => deserializeReplayAnalysisSession(tampered)).toThrow(
      "integrity verification",
    );
  });
});
