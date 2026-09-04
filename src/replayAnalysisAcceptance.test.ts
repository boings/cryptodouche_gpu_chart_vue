import { describe, expect, it } from "vitest";

import { EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE, type RadarEpisode } from "./radar";
import { createReplayCandleRecord, type ReplayCandleRecord } from "./replay";
import {
  createAvwapAnchorSpec,
  createExperimentalReplayAnalysisProfile,
  materializeReplayAnalysis,
  type MaterializeReplayAnalysisInput,
} from "./replayAnalysis";
import { createImpulseFadeResearchProfile } from "./strategy";

const STEP = 900;
const HOUR = 3_600;
const START = 1_700_006_400;
const SYMBOL = "FILUSDT";
const SOURCE = "bybit";

function inputFor(
  targetCloses: number[],
  referenceCloses = targetCloses.map(() => 100),
): MaterializeReplayAnalysisInput {
  const strategyProfile = createImpulseFadeResearchProfile({
    id: "analysis-acceptance.strategy",
    version: "1",
    timeframeRoles: {
      candidateTimeframe: "15m",
      structureTimeframe: "15m",
      executionTimeframe: "15m",
      triggerTimeframe: "15m",
      contextTimeframes: [],
    },
    createdAt: START,
  });
  const analysisProfile = createExperimentalReplayAnalysisProfile(strategyProfile, {
    evaluatedTimeframes: ["15m"],
    contextTimeframes: [],
    extensionConfig: {
      windowSeconds: STEP,
      historyDays: 2,
      minSamples: 1,
      emaPeriod: 2,
      atrPeriod: 2,
    },
    stochasticRsiConfig: {
      timeframe: "15m",
      rsiPeriod: 2,
      stochPeriod: 2,
      kPeriod: 1,
      dPeriod: 1,
    },
    structureConfig: {
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
      maxSwings: 50,
      maxBreaks: 20,
    },
    supportResistanceConfig: {
      maxZones: 8,
      thicknessBps: 100,
      latestX: 0,
      referencePrice: null,
      zonesPerSide: 8,
    },
    relativeStrengthConfig: {
      timeframe: "15m",
      formulaVersion: "relative-ratio.1",
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
      maxSwings: 50,
      maxBreaks: 20,
      minDeltaPct: 0.1,
      maxAgeBars: 100,
      maxDivergences: 20,
      includeDivergences: true,
      includeLeads: true,
      includeBreaks: true,
    },
  });
  return {
    symbol: SYMBOL,
    source: SOURCE,
    asOf: START + targetCloses.length * STEP,
    candlesByTimeframe: {
      "15m": targetCloses.map((close, index) => replayCandle(SYMBOL, index, close)),
    },
    referenceCandlesByTimeframe: {
      "15m": referenceCloses.map((close, index) => replayCandle("BTCUSDT", index, close)),
    },
    radarEpisode: { id: "acceptance-episode", symbol: SYMBOL, source: SOURCE } as RadarEpisode,
    radarSelectionProfile: EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
    strategyProfile,
    analysisProfile,
  };
}

function replayCandle(symbol: string, index: number, close: number) {
  return createReplayCandleRecord({
    symbol,
    source: SOURCE,
    timeframe: "15m",
    openTime: START + index * STEP,
    o: close,
    h: close + 1,
    l: close - 1,
    c: close,
    vBase: 100,
    vQuote: close * 100,
    revision: 1,
  });
}

describe("Replay Phase 2B causal acceptance fixtures", () => {
  it("defers a swing until confirmation while retaining its eventTime", () => {
    const input = inputFor([100, 102, 110, 103, 105]);
    const before = materializeReplayAnalysis({ ...input, asOf: START + 3 * STEP });
    const after = materializeReplayAnalysis({ ...input, asOf: START + 4 * STEP });
    const beforeHigh = before.structureByTimeframe["15m"]!.observation.value.swings
      .find((swing) => swing.bucket === START + 2 * STEP && swing.kind === "SwingHigh");
    const afterHigh = after.structureByTimeframe["15m"]!.observation.value.swings
      .find((swing) => swing.bucket === START + 2 * STEP && swing.kind === "SwingHigh");

    expect(beforeHigh).toBeUndefined();
    expect(afterHigh).toMatchObject({
      eventTime: START + 2 * STEP,
      knownAt: START + 4 * STEP,
    });
  });

  it("keeps a zone logical ID while assigning a new observation to revised evidence", () => {
    const input = inputFor([100, 102, 110, 103, 109.8, 104, 106]);
    const first = materializeReplayAnalysis({ ...input, asOf: START + 4 * STEP });
    const revised = materializeReplayAnalysis({ ...input, asOf: START + 6 * STEP });
    const initialZone = first.supportResistanceZones.find((zone) => zone.value.kind === "resistance")!;
    const revisedZone = revised.supportResistanceZones.find(
      (zone) => zone.logicalId === initialZone.logicalId,
    )!;

    expect(initialZone).toBeTruthy();
    expect(revisedZone).toBeTruthy();
    expect(revisedZone.observationId).not.toBe(initialZone.observationId);
    expect(revisedZone.value.touches).toBeGreaterThanOrEqual(initialZone.value.touches);
  });

  it("publishes RS divergence only after both price and reference pivots are known", () => {
    const input = inputFor(
      [100, 101, 110, 102, 112, 103, 104],
      [100, 100, 100, 100, 106.7, 110, 110],
    );
    const before = materializeReplayAnalysis({ ...input, asOf: START + 5 * STEP });
    const after = materializeReplayAnalysis({ ...input, asOf: START + 6 * STEP });

    expect(before.relativeStrengthEvents.some((event) => event.value.kind === "bearishHigh"))
      .toBe(false);
    const divergence = after.relativeStrengthEvents.find(
      (event) => event.value.kind === "bearishHigh",
    );
    expect(divergence).toMatchObject({
      eventTime: START + 4 * STEP,
      knownAt: START + 6 * STEP,
      evaluatedAt: START + 6 * STEP,
    });
    expect(divergence?.sourceObservationIds).toContain(
      input.referenceCandlesByTimeframe["15m"][5]!.observationId,
    );
  });

  it("materializes AVWAP loss, reclaim, and failed-reclaim chronologically", () => {
    const input = inputFor([100, 110, 90, 110, 100, 101, 100]);
    const anchorCandle = input.candlesByTimeframe["15m"][0]!;
    const anchor = createAvwapAnchorSpec({
      id: "manual-avwap",
      type: "manual",
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      anchorCandleLogicalId: anchorCandle.logicalCandleId,
      anchorCandleObservationId: anchorCandle.observationId,
      anchorTime: anchorCandle.openTime,
      priceBasis: "typical",
      volumeBasis: "baseThenQuote",
      selectedAt: anchorCandle.closeTime,
      knownAt: anchorCandle.closeTime,
      provenance: "acceptance fixture",
    });
    const state = materializeReplayAnalysis({ ...input, avwapAnchors: [anchor] });
    const kinds = state.avwapEvents.map((event) => event.value.kind);

    expect(kinds).toEqual(expect.arrayContaining(["loss", "reclaim", "failedReclaim"]));
    expect(state.avwapEvents.every((event) =>
      event.knownAt === event.value.knownAt && event.knownAt <= state.effectiveAsOf)).toBe(true);
  });

  it("uses the previous valid boundary when an execution candle is published late", () => {
    const input = inputFor([100, 101, 102, 103]);
    const original = input.candlesByTimeframe["15m"][2]!;
    input.candlesByTimeframe["15m"][2] = createReplayCandleRecord({
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      openTime: original.openTime,
      o: original.o,
      h: original.h,
      l: original.l,
      c: original.c,
      vBase: original.vBase,
      revision: 1,
      knownAt: original.closeTime + 2 * 60,
    });
    const state = materializeReplayAnalysis({
      ...input,
      asOf: original.closeTime + 60,
    });

    expect(state.effectiveAsOf).toBe(original.openTime);
    expect(state.freshnessByComponent["timeframe:15m"]?.sourceObservationIds)
      .not.toContain(input.candlesByTimeframe["15m"][2]!.observationId);
  });

  it("preserves drop/rebound and continuation context without fabricating deterioration", () => {
    const drop = inputFor([100, 80, 92], [100, 100, 100]);
    drop.analysisProfile = createExperimentalReplayAnalysisProfile(drop.strategyProfile, {
      extensionConfig: { ...drop.analysisProfile.extensionConfig, windowSeconds: 2 * STEP },
    });
    const dropState = materializeReplayAnalysis(drop);
    expect(dropState.candidateMetrics.extension.returnPct).toBeCloseTo(-8, 8);

    const continuation = materializeReplayAnalysis(inputFor(
      [100, 120, 145, 170],
      [100, 120, 145, 170],
    ));
    expect(continuation.relativeStrengthEvents.filter((event) =>
      event.value.direction === "bearish")).toEqual([]);
    expect(continuation.avwapEvents).toEqual([]);
  });
});
