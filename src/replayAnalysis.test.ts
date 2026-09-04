import { describe, expect, it } from "vitest";

import {
  computeAnchoredVwapLine,
  computeAnchoredVwapSignals,
  computeAnchoredVwapSnapshot,
  computeAtrLine,
  computeEmaLine,
  computeExtensionSnapshot,
  computeMarketStructure,
  computeRelativeCumulativeReturnLine,
  computeRelativeStrengthDivergences,
  computeStochRsi,
  computeStructureActiveLevels,
  computeSupportResistanceZonesFromSwings,
} from "./indicators";
import { EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE, type RadarEpisode } from "./radar";
import { createReplayCandleRecord, type ReplayCandleRecord } from "./replay";
import {
  AVWAP_ANCHOR_SCHEMA_VERSION,
  MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  MATERIALIZED_REPLAY_ENGINE_VERSION,
  REPLAY_ANALYSIS_ENGINE_VERSION,
  createAvwapAnchorSpec,
  createExperimentalReplayAnalysisProfile,
  materializeReplayAnalysis,
  type MaterializeReplayAnalysisInput,
} from "./replayAnalysis";
import { DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE } from "./strategy";

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;
const SOURCE = "bybit";
const SYMBOL = "FILUSDT";
const REFERENCE = "BTCUSDT";
const START = 1_700_006_400;

function records(
  symbol: string,
  timeframe: string,
  count: number,
  start: number,
  base: number,
): ReplayCandleRecord[] {
  const seconds = timeframe.endsWith("m")
    ? Number.parseInt(timeframe, 10) * MINUTE
    : timeframe.endsWith("h")
      ? Number.parseInt(timeframe, 10) * HOUR
      : Number.parseInt(timeframe, 10) * DAY;
  return Array.from({ length: count }, (_, index) => {
    const close = base + index * 0.8 + Math.sin(index / 2) * 2;
    return createReplayCandleRecord({
      symbol,
      source: SOURCE,
      timeframe,
      openTime: start + index * seconds,
      o: close - 0.3,
      h: close + 1,
      l: close - 1,
      c: close,
      vBase: 1_000 + index,
      vQuote: close * (1_000 + index),
      revision: 1,
    });
  });
}

function fixture(): MaterializeReplayAnalysisInput {
  const strategyProfile = DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE;
  const analysisProfile = createExperimentalReplayAnalysisProfile(strategyProfile, {
    extensionConfig: {
      windowSeconds: HOUR,
      historyDays: 2,
      minSamples: 2,
      emaPeriod: 3,
      atrPeriod: 3,
    },
    structureConfig: {
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 3,
      minMoveAtr: 0,
      maxSwings: 50,
      maxBreaks: 20,
    },
    relativeStrengthConfig: {
      timeframe: "15m",
      formulaVersion: "relative-ratio.1",
      lookback: 100,
      pivotStrength: 1,
      atrPeriod: 3,
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
  const candlesByTimeframe = {
    "15m": records(SYMBOL, "15m", 36, START, 80),
    "1h": records(SYMBOL, "1h", 12, START, 80),
    "4h": records(SYMBOL, "4h", 5, START, 80),
    "1d": records(SYMBOL, "1d", 3, START, 80),
  };
  const referenceCandlesByTimeframe = {
    "15m": records(REFERENCE, "15m", 36, START, 40_000),
    "1h": records(REFERENCE, "1h", 12, START, 40_000),
    "4h": records(REFERENCE, "4h", 5, START, 40_000),
    "1d": records(REFERENCE, "1d", 3, START, 40_000),
  };
  return {
    symbol: SYMBOL,
    source: SOURCE,
    asOf: START + 8 * HOUR + 7 * MINUTE,
    candlesByTimeframe,
    referenceCandlesByTimeframe,
    radarEpisode: { symbol: SYMBOL, source: SOURCE } as RadarEpisode,
    radarSelectionProfile: EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
    strategyProfile,
    analysisProfile,
  };
}

describe("replay analysis materializer", () => {
  it("is deterministic, versioned, and selects the latest completed evaluation boundary", () => {
    const input = fixture();
    const first = materializeReplayAnalysis(input);
    const second = materializeReplayAnalysis(input);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion: MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
      replayEngineVersion: MATERIALIZED_REPLAY_ENGINE_VERSION,
      analysisEngineVersion: REPLAY_ANALYSIS_ENGINE_VERSION,
      effectiveAsOf: START + 8 * HOUR,
      requestedAsOf: input.asOf,
    });
    expect(first.id).toMatch(/^replay-analysis-state:/);
    expect(first.lifecycleResult.asOf).toBe(first.effectiveAsOf);
    expect(first.dataQualityNotes.map((note) => note.code)).not.toContain(
      "CARRIED_FORWARD_ANALYSIS_STATE",
    );
  });

  it("matches physically truncated input and ignores future higher-timeframe candles", () => {
    const input = fixture();
    const full = materializeReplayAnalysis(input);
    const truncate = (items: ReplayCandleRecord[]) =>
      items.filter((item) => item.closeTime <= full.effectiveAsOf && item.knownAt <= full.effectiveAsOf);
    const truncated = materializeReplayAnalysis({
      ...input,
      candlesByTimeframe: Object.fromEntries(
        Object.entries(input.candlesByTimeframe).map(([key, value]) => [key, truncate(value)]),
      ),
      referenceCandlesByTimeframe: Object.fromEntries(
        Object.entries(input.referenceCandlesByTimeframe).map(([key, value]) => [key, truncate(value)]),
      ),
    });

    expect(truncated).toEqual(full);
    expect(full.freshnessByComponent["timeframe:4h"]?.latestInputCloseTime).toBe(
      START + 8 * HOUR,
    );
    expect(full.freshnessByComponent["timeframe:1d"]?.latestInputCloseTime).toBeNull();
  });

  it("reuses the shared extension, structure, Stoch RSI, and RS calculations", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const selected = state.freshnessByComponent["timeframe:15m"]!.sampleCount;
    const candles = input.candlesByTimeframe["15m"].slice(0, selected).map((item, index) => ({
      ts: item.openTime,
      bucket: item.openTime,
      x: index,
      o: item.o,
      h: item.h,
      l: item.l,
      c: item.c,
      v_base: item.vBase ?? undefined,
      v_quote: item.vQuote ?? undefined,
      ver: item.revision ?? undefined,
      knownAt: item.knownAt,
    }));
    const reference = input.referenceCandlesByTimeframe["15m"].slice(0, selected).map((item, index) => ({
      ts: item.openTime,
      bucket: item.openTime,
      x: index,
      o: item.o,
      h: item.h,
      l: item.l,
      c: item.c,
      ver: item.revision ?? undefined,
      knownAt: item.knownAt,
    }));

    expect(state.extensionContext["15m"]).toEqual(
      computeExtensionSnapshot(candles, input.analysisProfile.extensionConfig),
    );
    expect(state.indicatorSeries["15m"]!.ema).toEqual(
      line(computeEmaLine(candles, input.analysisProfile.extensionConfig.emaPeriod)),
    );
    expect(state.indicatorSeries["15m"]!.atr).toEqual(
      line(computeAtrLine(candles, input.analysisProfile.extensionConfig.atrPeriod)),
    );
    const structure = computeMarketStructure(candles, input.analysisProfile.structureConfig);
    expect(state.structureByTimeframe["15m"]!.observation.value).toEqual(structure);
    expect(state.indicatorSeries["15m"]!.stochRsi).toEqual({
      k: line(computeStochRsi(candles).k),
      d: line(computeStochRsi(candles).d),
    });
    expect(state.activeStructureLevels
      .filter((level) => level.sourceTimeframe === "15m")
      .map((level) => level.sourceObject.snapshot)).toEqual(
        computeStructureActiveLevels(structure),
      );
    const directZones = computeSupportResistanceZonesFromSwings(structure.swings, {
      ...input.analysisProfile.supportResistanceConfig,
      latestX: candles.at(-1)!.x,
      referencePrice: candles.at(-1)!.c,
    });
    expect(state.supportResistanceZones
      .filter((zone) => zone.timeframe === "15m")
      .map((zone) => {
        const { originatingSwingIds: _ignored, ...value } = zone.value;
        return value;
      })).toEqual(directZones);
    expect(state.relativeStrength.series).toEqual(
      line(computeRelativeCumulativeReturnLine(candles, reference)),
    );
    expect(state.relativeStrengthEvents.map((event) => event.value)).toEqual(
      computeRelativeStrengthDivergences(
        candles,
        reference,
        input.analysisProfile.relativeStrengthConfig,
      ),
    );
    expect(state.setupState).toEqual(state.lifecycleResult);
  });

  it("reuses the shared AVWAP series, snapshot, and chronological events", () => {
    const input = fixture();
    const anchorCandle = input.candlesByTimeframe["15m"][3]!;
    const anchor = createAvwapAnchorSpec({
      id: "parity-anchor",
      type: "manual",
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      anchorCandleLogicalId: anchorCandle.logicalCandleId,
      anchorCandleObservationId: anchorCandle.observationId,
      anchorTime: anchorCandle.openTime,
      priceBasis: "typical",
      volumeBasis: "baseThenQuote",
      selectedAt: anchorCandle.knownAt,
      knownAt: anchorCandle.knownAt,
      provenance: "shared calculation parity",
    });
    const state = materializeReplayAnalysis({ ...input, avwapAnchors: [anchor] });
    const sampleCount = state.freshnessByComponent["timeframe:15m"]!.sampleCount;
    const candles = replayCandles(input.candlesByTimeframe["15m"].slice(0, sampleCount), "15m");
    const options = { anchorBucket: anchor.anchorTime };

    expect(state.avwapStates[0]!.series).toEqual(line(computeAnchoredVwapLine(candles, options)));
    expect(state.avwapStates[0]!.snapshot).toEqual(computeAnchoredVwapSnapshot(candles, options));
    expect(state.avwapEvents.map((event) => event.value)).toEqual(
      computeAnchoredVwapSignals(candles, options, input.analysisProfile.avwapConfig.maxSignals),
    );
    expect(state.avwapEvents.every((event, index, events) =>
      index === 0 || event.knownAt >= events[index - 1]!.knownAt)).toBe(true);
  });

  it("does not backdate AVWAP events created by a later manual selection", () => {
    const input = fixture();
    const anchorCandle = input.candlesByTimeframe["15m"][3]!;
    const selectedAt = START + 8 * HOUR;
    const anchor = createAvwapAnchorSpec({
      id: "late-manual-anchor",
      type: "manual",
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      anchorCandleLogicalId: anchorCandle.logicalCandleId,
      anchorCandleObservationId: anchorCandle.observationId,
      anchorTime: anchorCandle.openTime,
      priceBasis: "typical",
      volumeBasis: "baseThenQuote",
      selectedAt,
      knownAt: anchorCandle.knownAt,
      provenance: "selected during replay",
    });
    const state = materializeReplayAnalysis({ ...input, asOf: selectedAt, avwapAnchors: [anchor] });

    expect(state.avwapStates[0]!.observation.knownAt).toBe(selectedAt);
    expect(state.avwapEvents.length).toBeGreaterThan(0);
    expect(state.avwapEvents.every((event) =>
      event.knownAt >= selectedAt &&
      event.evaluatedAt >= selectedAt &&
      event.value.knownAt >= selectedAt)).toBe(true);
    expect(state.lifecycleResult.evidence.every((evidence) => evidence.knownAt >= selectedAt ||
      evidence.kind !== "avwapFailure")).toBe(true);
  });

  it("keeps valid components when synchronized reference data is missing", () => {
    const input = fixture();
    input.referenceCandlesByTimeframe["15m"] = input.referenceCandlesByTimeframe["15m"].filter(
      (_, index) => index !== 5,
    );
    const state = materializeReplayAnalysis(input);

    expect(state.relativeStrength.status).toBe("missingSynchronizedReferenceData");
    expect(state.relativeStrength.series).toEqual([]);
    expect(state.structureByTimeframe["15m"]?.observation.value).toBeTruthy();
    expect(state.candidateMetrics.extension.returnPct).not.toBeNull();
  });

  it("publishes a correction only at the next evaluation boundary after knownAt", () => {
    const input = fixture();
    const original = input.candlesByTimeframe["15m"][4]!;
    const correction = createReplayCandleRecord({
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      openTime: original.openTime,
      o: original.o,
      h: original.h + 10,
      l: original.l,
      c: original.c + 5,
      vBase: original.vBase,
      revision: 2,
      knownAt: START + 6 * HOUR + 2 * MINUTE,
      correctionPublishedAt: START + 6 * HOUR + 2 * MINUTE,
    });
    input.candlesByTimeframe["15m"] = [...input.candlesByTimeframe["15m"], correction];
    const before = materializeReplayAnalysis({ ...input, asOf: START + 6 * HOUR + MINUTE });
    const after = materializeReplayAnalysis({ ...input, asOf: START + 6 * HOUR + 16 * MINUTE });

    expect(before.dataBundleFingerprint).not.toBe(after.dataBundleFingerprint);
    expect(before.freshnessByComponent["timeframe:15m"]!.sourceObservationIds).not.toContain(
      correction.observationId,
    );
    expect(after.freshnessByComponent["timeframe:15m"]!.sourceObservationIds).toContain(
      correction.observationId,
    );
  });

  it("freezes explicit AVWAP anchor revisions and rejects a future anchor", () => {
    const input = fixture();
    const anchorCandle = input.candlesByTimeframe["15m"][3]!;
    const anchor = createAvwapAnchorSpec({
      id: "manual-anchor-1",
      type: "manual",
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "15m",
      anchorCandleLogicalId: anchorCandle.logicalCandleId,
      anchorCandleObservationId: anchorCandle.observationId,
      anchorTime: anchorCandle.openTime,
      priceBasis: "typical",
      volumeBasis: "baseThenQuote",
      selectedAt: anchorCandle.knownAt,
      knownAt: anchorCandle.knownAt,
      provenance: "test selection",
    });
    const anchored = materializeReplayAnalysis({ ...input, avwapAnchors: [anchor] });
    expect(anchored.avwapStates[0]?.anchor).toEqual({
      ...anchor,
      schemaVersion: AVWAP_ANCHOR_SCHEMA_VERSION,
    });

    expect(() => materializeReplayAnalysis({
      ...input,
      avwapAnchors: [{ ...anchor, selectedAt: input.asOf + HOUR, knownAt: input.asOf + HOUR }],
    })).toThrow("was not known at the cutoff");
  });
});

function line(values: Float32Array) {
  const result: Array<{ x: number; value: number }> = [];
  for (let index = 0; index < values.length; index += 2) {
    result.push({ x: values[index]!, value: values[index + 1]! });
  }
  return result;
}

function replayCandles(records: ReplayCandleRecord[], timeframe: string) {
  const seconds = timeframe.endsWith("m")
    ? Number.parseInt(timeframe, 10) * MINUTE
    : timeframe.endsWith("h")
      ? Number.parseInt(timeframe, 10) * HOUR
      : Number.parseInt(timeframe, 10) * DAY;
  const first = records[0]?.openTime ?? 0;
  return records.map((item) => ({
    ts: item.openTime,
    bucket: item.openTime,
    x: (item.openTime - first) / seconds,
    o: item.o,
    h: item.h,
    l: item.l,
    c: item.c,
    v_base: item.vBase ?? undefined,
    v_quote: item.vQuote ?? undefined,
    ver: item.revision ?? undefined,
    knownAt: item.knownAt,
  }));
}
