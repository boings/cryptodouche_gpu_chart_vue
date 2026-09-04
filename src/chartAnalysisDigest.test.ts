import { describe, expect, it } from "vitest";

import {
  CHART_ANALYSIS_NUMERIC_PRECISION,
  canonicalizeChartAnalysisNumber,
  chartAnalysisDigestFingerprint,
  compareChartAnalysisDigests,
  createChartAnalysisDigest,
  type ChartAnalysisDigest,
} from "./core";
import { EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE, type RadarEpisode } from "./radar";
import { createReplayCandleRecord, type ReplayCandleRecord } from "./replay";
import {
  createExperimentalReplayAnalysisProfile,
  materializeReplayAnalysis,
  type MaterializeReplayAnalysisInput,
  type ReplayAnalysisState,
} from "./replayAnalysis";
import { DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE } from "./strategy";

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;
const START = 1_700_006_400;
const SYMBOL = "FILUSDT";
const REFERENCE = "BTCUSDT";
const SOURCE = "bybit";

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
  return {
    symbol: SYMBOL,
    source: SOURCE,
    asOf: START + 8 * HOUR + 7 * MINUTE,
    candlesByTimeframe: {
      "15m": records(SYMBOL, "15m", 36, START, 80),
      "1h": records(SYMBOL, "1h", 12, START, 80),
      "4h": records(SYMBOL, "4h", 5, START, 80),
      "1d": records(SYMBOL, "1d", 3, START, 80),
    },
    referenceCandlesByTimeframe: {
      "15m": records(REFERENCE, "15m", 36, START, 40_000),
      "1h": records(REFERENCE, "1h", 12, START, 40_000),
      "4h": records(REFERENCE, "4h", 5, START, 40_000),
      "1d": records(REFERENCE, "1d", 3, START, 40_000),
    },
    radarEpisode: { symbol: SYMBOL, source: SOURCE } as RadarEpisode,
    radarSelectionProfile: EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
    strategyProfile,
    analysisProfile,
  };
}

function causalPrefixes(input: MaterializeReplayAnalysisInput, state: ReplayAnalysisState) {
  return Object.fromEntries(Object.entries(input.candlesByTimeframe).map(([timeframe, candles]) => [
    timeframe,
    candles.filter((candle) =>
      candle.closeTime <= state.effectiveAsOf && candle.knownAt <= state.effectiveAsOf),
  ]));
}

function digest(
  input: MaterializeReplayAnalysisInput,
  state: ReplayAnalysisState,
  mode: "liveHistorical" | "replay",
  refs: Record<string, string> = {},
) {
  return createChartAnalysisDigest({
    availability: "test",
    mode,
    state,
    candlePrefixesByTimeframe: causalPrefixes(input, state),
    profileAndConfigRefs: {
      replaySessionConfigRef: "replay-session-config:test:v1",
      executionProfileRef: "execution-profile:test:v1",
      ...refs,
    },
  });
}

function mutable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function refingerprint(value: ChartAnalysisDigest): ChartAnalysisDigest {
  value.digestFingerprint = chartAnalysisDigestFingerprint(value);
  return value;
}

describe("ChartAnalysisDigest", () => {
  it("builds deterministic renderer-independent digests and exact live/replay parity", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const first = digest(input, state, "liveHistorical", { zRef: "last", aRef: "first" });
    const second = digest(input, state, "liveHistorical", { aRef: "first", zRef: "last" });
    const replay = digest(input, state, "replay", { zRef: "last", aRef: "first" });

    expect(second).toEqual(first);
    expect(first.digestFingerprint).toBe(second.digestFingerprint);
    expect(first.digestFingerprint).not.toBe(replay.digestFingerprint);
    expect(first.candlePrefixByTimeframe.map((item) => item.timeframe)).toEqual([
      "15m", "1h", "4h", "1d",
    ]);
    expect(first.candlePrefixByTimeframe.every((item) =>
      item.logicalCandleIds.length === item.count && item.observationIds.length === item.count,
    )).toBe(true);

    const comparison = compareChartAnalysisDigests(first, replay);
    expect(comparison.analyticalParityPassed).toBe(true);
    expect(comparison.discrepancies).toEqual([]);
    expect(compareChartAnalysisDigests(first, replay)).toEqual(comparison);
  });

  it("uses explicit decimal precision per metric family without epsilon comparisons", () => {
    expect(CHART_ANALYSIS_NUMERIC_PRECISION).toEqual({
      price: 12,
      volume: 8,
      percentage: 8,
      ratio: 10,
      oscillator: 8,
      score: 8,
    });
    expect(canonicalizeChartAnalysisNumber(1.123456789011, "percentage")).toBe(1.12345679);
    expect(canonicalizeChartAnalysisNumber(1.123456789019, "percentage")).toBe(1.12345679);
    expect(canonicalizeChartAnalysisNumber(1.123456799, "percentage")).toBe(1.1234568);
    expect(canonicalizeChartAnalysisNumber(-0.000000000001, "percentage")).toBe(0);
  });

  it("rejects future state evidence and candles beyond the causal cutoff", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const contaminatedState = mutable(state);
    contaminatedState.candidateMetrics.updatedAt = state.effectiveAsOf + 1;

    expect(() => digest(input, contaminatedState, "replay")).toThrow(
      "FUTURE_DATA_EXPOSURE:state.candidateMetrics.updatedAt",
    );

    const prefixes = causalPrefixes(input, state);
    prefixes["15m"]!.push(input.candlesByTimeframe["15m"]!.find(
      (candle) => candle.closeTime > state.effectiveAsOf,
    )!);
    expect(() => createChartAnalysisDigest({
      availability: "audit",
      mode: "liveHistorical",
      state,
      candlePrefixesByTimeframe: prefixes,
      profileAndConfigRefs: {},
    })).toThrow("FUTURE_DATA_EXPOSURE:candlePrefixesByTimeframe.15m");
  });

  it("rejects corrupted stable candle identities", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const prefixes = mutable(causalPrefixes(input, state));
    prefixes["15m"]![0]!.observationId = "replay-candle-observation:corrupt";

    expect(() => createChartAnalysisDigest({
      availability: "test",
      mode: "replay",
      state,
      candlePrefixesByTimeframe: prefixes,
      profileAndConfigRefs: {},
    })).toThrow("Invalid candle observation identity for 15m");
  });

  it("classifies exact analytical discrepancies in stable order", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const live = digest(input, state, "liveHistorical");
    const replay = mutable(digest(input, state, "replay"));

    replay.candlePrefixByTimeframe[0]!.count += 1;
    replay.candlePrefixByTimeframe[0]!.observationIds.pop();
    replay.profileAndConfigRefs.executionProfileRef = "execution-profile:changed";
    replay.candidateMetrics.extension.returnPct =
      (replay.candidateMetrics.extension.returnPct ?? 0) + 0.25;
    replay.structureByTimeframe["1h"]!.observation.value.summary.state = "bearish";
    replay.pendingConditions.push("changed-condition");
    refingerprint(replay);

    const comparison = compareChartAnalysisDigests(live, replay);
    expect(comparison.analyticalParityPassed).toBe(false);
    expect(comparison.discrepancies.map((item) => item.classification)).toEqual([
      "CANDLE_PREFIX_MISMATCH",
      "TIMEFRAME_BUCKET_MISMATCH",
      "PROFILE_CONFIG_MISMATCH",
      "CANDIDATE_METRIC_MISMATCH",
      "STRUCTURE_STATE_MISMATCH",
      "LIFECYCLE_EVIDENCE_MISMATCH",
    ]);
    expect(comparison.discrepancies.every((item) =>
      item.id.startsWith("chart-analysis-discrepancy:"
      ) && item.liveFingerprint.startsWith("fnv1a64:") && item.replayFingerprint.startsWith("fnv1a64:"),
    )).toBe(true);
  });

  it("fails closed when a hand-authored digest exposes future evidence", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const live = digest(input, state, "liveHistorical");
    const replay = mutable(digest(input, state, "replay"));
    replay.lifecycleState.stateSince = replay.effectiveAsOf + 1;
    refingerprint(replay);

    const comparison = compareChartAnalysisDigests(live, replay);
    expect(comparison.analyticalParityPassed).toBe(false);
    expect(comparison.discrepancies.map((item) => item.classification)).toContain(
      "FUTURE_DATA_EXPOSURE",
    );
  });

  it("detects stale digest fingerprints instead of trusting hand-authored content", () => {
    const input = fixture();
    const state = materializeReplayAnalysis(input);
    const live = digest(input, state, "liveHistorical");
    const replay = mutable(digest(input, state, "replay"));
    replay.dataQualityNotes.push({ code: "ALTERED", severity: "warning", message: "altered" });

    const comparison = compareChartAnalysisDigests(live, replay);
    expect(comparison.discrepancies.map((item) => item.classification)).toEqual([
      "DIGEST_FINGERPRINT_MISMATCH",
      "DATA_QUALITY_MISMATCH",
    ]);
  });
});
