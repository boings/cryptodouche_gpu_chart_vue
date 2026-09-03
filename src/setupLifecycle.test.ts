import { describe, expect, it } from "vitest";
import {
  candleCloseTime,
  computeMarketStructure,
  evaluateImpulseFadeSnapshot,
  evaluateImpulseFadeTimeline,
  IMPULSE_FADE_LIFECYCLE_VERSION,
  impulseFadeLifecycleConfigHash,
} from "./indicators";
import type {
  AnchoredVwapSignal,
  ImpulseFadeStructureEvent,
  RelativeStrengthDivergence,
} from "./indicators";
import type { CandleRecord } from "./types";
import solTerminalRegression from "../fixtures/sol-terminal-regression.json";

function candle(index: number, close: number, range = 1): CandleRecord {
  const open = index === 0 ? close : close - 0.25;
  return {
    ts: index * 60,
    bucket: index * 60,
    x: index,
    o: open,
    h: Math.max(open, close) + range,
    l: Math.min(open, close) - range,
    c: close,
    v_base: 100,
    v_quote: close * 100,
  };
}

const candles = [100, 101, 102, 103, 112, 109, 108, 107].map((close, index) =>
  candle(index, close, index === 4 ? 6 : 1),
);

const lifecycleExtensionOptions = {
  windowSeconds: 60,
  historyDays: 1,
  minSamples: 1,
  emaPeriod: 2,
  atrPeriod: 2,
};

const input = {
  symbol: "FILUSDT",
  source: "external",
  venue: "bybit",
  executionTimeframe: "1m",
  candlesByTimeframe: { "1m": candles },
  from: 60,
  to: 480,
  config: {
    extensionOptions: lifecycleExtensionOptions,
  },
} as const;

function bearishRsEvent(eventTime: number, knownAt: number): RelativeStrengthDivergence {
  return {
    kind: "bearishBreak",
    signal: "break",
    direction: "bearish",
    label: "RS BREAK ↓",
    index: eventTime / 60,
    x: eventTime / 60,
    ts: eventTime,
    bucket: eventTime,
    price: 108,
    previousPrice: null,
    rs: -2,
    previousRs: 0,
    priceLabel: "Break",
    sourceBreak: null,
    priceStructureState: "bullish",
    rsStructureState: "bearish",
    eventTime,
    knownAt,
  };
}

function bearishBreak(
  eventTime = 300,
  knownAt = 360,
  level = 110,
): ImpulseFadeStructureEvent {
  return {
    kind: "StructureShift",
    direction: "bearish",
    label: "Shift",
    index: eventTime / 60,
    x: eventTime / 60,
    ts: eventTime,
    bucket: eventTime,
    level,
    sourceSwingX: 4,
    sourceSwingPrice: level,
    eventTime,
    knownAt,
    sourceTimeframe: "1m",
  };
}

function bullishBreak(
  eventTime = 360,
  knownAt = 420,
  level = 118,
): ImpulseFadeStructureEvent {
  return {
    ...bearishBreak(eventTime, knownAt, level),
    kind: "StructureBreak",
    direction: "bullish",
    label: "BOS",
  };
}

function avwapEvent(
  kind: AnchoredVwapSignal["kind"],
  eventTime: number,
  knownAt: number,
): AnchoredVwapSignal {
  return {
    kind,
    label:
      kind === "loss"
        ? "AVWAP loss"
        : kind === "reclaim"
          ? "AVWAP reclaim"
          : "Failed AVWAP reclaim",
    index: eventTime / 60,
    x: eventTime / 60,
    ts: eventTime,
    bucket: eventTime,
    price: 108,
    vwap: 110,
    eventTime,
    knownAt,
  };
}

describe("Impulse Fade lifecycle timeline", () => {
  it("treats candle timestamps as open time and closes them at the timeframe boundary", () => {
    expect(candleCloseTime(candle(0, 100), "15m")).toBe(900);
    expect(candleCloseTime(candle(0, 100), "1h")).toBe(3_600);
  });

  it("keeps a pivot unavailable until its confirmation candle closes", () => {
    const fixture = [
      { ...candle(0, 100), h: 101, l: 99 },
      { ...candle(1, 104), h: 106, l: 100 },
      { ...candle(2, 101), h: 103, l: 99 },
    ];
    const structure = computeMarketStructure(fixture, {
      pivotStrength: 1,
      atrPeriod: 2,
      minMoveAtr: 0,
    });
    const pivot = structure.swings.find((swing) => swing.kind === "SwingHigh");

    expect(pivot).toMatchObject({ eventTime: 60, knownAt: 180 });
    expect(pivot?.knownAt).toBeGreaterThan(pivot?.eventTime ?? 0);
  });

  it("returns a deterministic trace from ordered historical inputs", () => {
    const first = evaluateImpulseFadeTimeline(input);
    const second = evaluateImpulseFadeTimeline(input);

    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.at(-1)).toMatchObject({
      setupFamily: "impulse_fade_v1",
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash: impulseFadeLifecycleConfigHash(input.config),
      candidateGatePassed: false,
      candidateDetectedAt: 300,
      candidateId: "impulse_fade_v1:filusdt:external:bybit:1m:300",
      currentState: "developing",
    });
    expect(evaluateImpulseFadeSnapshot(input)?.candidate).toMatchObject({
      lifecycleVersion: IMPULSE_FADE_LIFECYCLE_VERSION,
      lifecycleConfigHash: impulseFadeLifecycleConfigHash(input.config),
    });
  });

  it("does not apply a candle correction before its knownAt", () => {
    const original = { ...candle(4, 112, 6), knownAt: 300 };
    const correction = { ...candle(4, 120, 8), knownAt: 420, ver: 2 };
    const history = [...candles.slice(0, 4), original, correction, ...candles.slice(5)];
    const beforeCorrection = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": history },
      to: 360,
    });
    const physicallyTruncated = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": history.filter((item) => item !== correction) },
      to: 360,
    });
    const afterCorrection = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": history },
      to: 420,
    });
    const withoutCorrection = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": history.filter((item) => item !== correction) },
      to: 420,
    });

    expect(beforeCorrection).toEqual(physicallyTruncated);
    expect(afterCorrection.some((snapshot) => snapshot.asOf === 420)).toBe(true);
    expect(afterCorrection).not.toEqual(withoutCorrection);
  });

  it("does not reuse a pre-detection event that is confirmed later", () => {
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      to: 420,
      relativeStrengthEvents: [bearishRsEvent(240, 420)],
    });

    expect(trace.at(-1)).toMatchObject({
      candidateDetectedAt: 300,
      currentState: "developing",
    });
    expect(trace.flatMap((record) => record.evidenceAdded).map((event) => event.code)).toEqual([
      "candidate_detected",
    ]);
  });

  it("does not expose a forming higher-timeframe structure result", () => {
    const executionCandles = Array.from({ length: 16 }, (_, index) =>
      candle(index * 15, index < 4 ? 100 : 110),
    );
    const hourlyCandles: CandleRecord[] = [
      { ...candle(0, 101), ts: 0, bucket: 0, x: 0, o: 100, h: 102, l: 99, c: 101 },
      {
        ...candle(60, 104),
        ts: 3_600,
        bucket: 3_600,
        x: 1,
        o: 101,
        h: 105,
        l: 100,
        c: 104,
      },
      {
        ...candle(120, 100),
        ts: 7_200,
        bucket: 7_200,
        x: 2,
        o: 104,
        h: 104,
        l: 98,
        c: 100,
      },
      {
        ...candle(180, 106),
        ts: 10_800,
        bucket: 10_800,
        x: 3,
        o: 100,
        h: 107,
        l: 99,
        c: 106,
      },
    ];
    const trace = evaluateImpulseFadeTimeline({
      symbol: "FILUSDT",
      executionTimeframe: "15m",
      candlesByTimeframe: { "15m": executionCandles, "1h": hourlyCandles },
      evaluationPoints: [13_500, 14_400],
      from: 13_500,
      to: 14_400,
      config: {
        extensionOptions: {
          windowSeconds: 900,
          historyDays: 1,
          minSamples: 1,
          emaPeriod: 2,
          atrPeriod: 2,
        },
        marketStructureOptions: {
          pivotStrength: 1,
          atrPeriod: 2,
          minMoveAtr: 0,
        },
      },
    });

    const beforeClose = trace.find((record) => record.asOf === 13_500);
    const afterClose = trace.find((record) => record.asOf === 14_400);
    expect(beforeClose?.confluence).toContainEqual(
      expect.objectContaining({ label: "1h structure", detail: "range" }),
    );
    expect(beforeClose?.confluence).not.toContainEqual(
      expect.objectContaining({ label: "1h structure", detail: "bullish" }),
    );
    expect(afterClose?.confluence).toContainEqual(
      expect.objectContaining({ label: "1h structure", detail: "bullish" }),
    );
  });

  it("freezes initial higher-timeframe context at candidate detection", () => {
    const executionCandles = Array.from({ length: 16 }, (_, index) =>
      candle(index * 15, index < 4 ? 100 : 110),
    );
    const hourlyCandles: CandleRecord[] = [
      { ...candle(0, 101), ts: 0, bucket: 0, x: 0, o: 100, h: 102, l: 99, c: 101 },
      { ...candle(60, 104), ts: 3_600, bucket: 3_600, x: 1, o: 101, h: 105, l: 100, c: 104 },
      { ...candle(120, 100), ts: 7_200, bucket: 7_200, x: 2, o: 104, h: 104, l: 98, c: 100 },
      { ...candle(180, 106), ts: 10_800, bucket: 10_800, x: 3, o: 100, h: 107, l: 99, c: 106 },
    ];
    const trace = evaluateImpulseFadeTimeline({
      symbol: "FILUSDT",
      executionTimeframe: "15m",
      candlesByTimeframe: { "15m": executionCandles, "1h": hourlyCandles },
      candidateMetrics: [
        { asOf: 900, metrics: { returnPct: 0 } },
        { asOf: 3_600, metrics: { returnPct: 10 } },
      ],
      from: 900,
      to: 14_400,
      config: {
        extensionOptions: { ...lifecycleExtensionOptions, windowSeconds: 900 },
        marketStructureOptions: { pivotStrength: 1, atrPeriod: 2, minMoveAtr: 0 },
      },
    });

    expect(trace.at(-1)?.initialMtfContext).toContainEqual(
      expect.objectContaining({ timeframe: "1h", state: "neutral", updatedTs: 3_600 }),
    );
    expect(trace.at(-1)?.confluence).toContainEqual(
      expect.objectContaining({ label: "1h structure", detail: "bullish" }),
    );
  });

  it("detects the candidate at the historical CandidateMetrics cutoff", () => {
    const flatCandles = Array.from({ length: 8 }, (_, index) => candle(index, 100));
    const trace = evaluateImpulseFadeTimeline({
      symbol: "ARBUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "1m",
      candlesByTimeframe: { "1m": flatCandles },
      candidateMetrics: [
        { asOf: 60, metrics: { returnPct: 0, percentile: 50, zScore: 0, atrExtension: 0 } },
        {
          asOf: 300,
          metrics: { returnPct: 11, percentile: 98, zScore: 2.4, atrExtension: 2.2 },
          sampleCount: 90,
        },
      ],
      from: 60,
      to: 420,
      config: { extensionOptions: lifecycleExtensionOptions },
    });

    expect(trace.at(-1)).toMatchObject({
      candidateDetectedAt: 300,
      candidateId: "impulse_fade_v1:arbusdt:external:bybit:1m:300",
      currentState: "developing",
    });
  });

  it("requires a later candle for break, retest, and rejection chronology", () => {
    const retestCandles = candles.map((item) => ({ ...item }));
    retestCandles[5] = {
      ...retestCandles[5],
      o: 111,
      h: 112,
      l: 108,
      c: 109,
    };
    retestCandles[6] = {
      ...retestCandles[6],
      o: 109.5,
      h: 110.1,
      l: 106.8,
      c: 108,
    };
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": retestCandles },
      structureEvents: [bearishBreak()],
      evaluationPoints: [360, 420],
      to: 420,
    });

    expect(trace.find((record) => record.asOf === 360)).toMatchObject({
      currentState: "waitingForRetest",
      retestLevel: null,
    });
    expect(trace.find((record) => record.asOf === 420)).toMatchObject({
      currentState: "entryCandidate",
      activeBreakLevel: expect.objectContaining({ level: 110, knownAt: 360 }),
      retestLevel: expect.objectContaining({ level: 110, knownAt: 360 }),
    });
  });

  it("lets a failed AVWAP reclaim deteriorate without creating an entry", () => {
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      avwapEvents: [avwapEvent("failedReclaim", 300, 360)],
      to: 420,
    });

    expect(trace.at(-1)).toMatchObject({
      currentState: "deteriorating",
      activeBreakLevel: null,
      retestLevel: null,
    });
    expect(trace.flatMap((record) => record.evidenceAdded)).toContainEqual(
      expect.objectContaining({ code: "avwap_failed_reclaim", knownAt: 360 }),
    );
  });

  it("keeps AVWAP loss, reclaim, and continuation out of the entry path", () => {
    const continuationCandles = candles.map((item) => ({ ...item }));
    continuationCandles[6] = {
      ...continuationCandles[6],
      o: 110,
      h: 121,
      l: 109,
      c: 120,
    };
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": continuationCandles },
      avwapEvents: [avwapEvent("loss", 300, 360), avwapEvent("reclaim", 360, 420)],
      structureEvents: [bullishBreak()],
      to: 420,
    });

    expect(trace.at(-1)).toMatchObject({
      currentState: "developing",
      activeBreakLevel: null,
      retestLevel: null,
      terminalReason: null,
    });
    expect(trace.at(-1)?.confluence).toContainEqual(
      expect.objectContaining({ code: "avwap_loss_context" }),
    );
  });

  it("invalidates a deteriorating episode on confirmed continuation beyond its high", () => {
    const continuationCandles = candles.map((item) => ({ ...item }));
    continuationCandles[6] = {
      ...continuationCandles[6],
      o: 110,
      h: 121,
      l: 109,
      c: 120,
    };
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": continuationCandles },
      avwapEvents: [avwapEvent("failedReclaim", 300, 360)],
      structureEvents: [bullishBreak()],
      to: 420,
    });

    expect(trace.at(-1)).toMatchObject({
      currentState: "invalidated",
      stateSince: 420,
      terminalReason: expect.stringContaining("episode high"),
    });
    expect(trace.flatMap((record) => record.transitions).map((transition) => transition.to)).toEqual([
      "developing",
      "deteriorating",
      "invalidated",
    ]);
  });

  it("keeps an expired episode terminal while the gate remains true", () => {
    const flatCandles = Array.from({ length: 10 }, (_, index) => candle(index, 100));
    const trace = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      executionTimeframe: "1m",
      candlesByTimeframe: { "1m": flatCandles },
      candidateMetrics: [
        { asOf: 60, metrics: { returnPct: 0 } },
        { asOf: 300, metrics: { returnPct: 10 } },
        { asOf: 360, metrics: { returnPct: 10 } },
        { asOf: 420, metrics: { returnPct: 10 } },
        { asOf: 480, metrics: { returnPct: 10 } },
        { asOf: 540, metrics: { returnPct: 10 } },
      ],
      avwapEvents: [avwapEvent("failedReclaim", 420, 480)],
      from: 60,
      to: 540,
      config: {
        extensionOptions: lifecycleExtensionOptions,
        maxCandidateAgeSeconds: 120,
      },
    });

    expect(trace.at(-1)).toMatchObject({
      candidateId: "impulse_fade_v1:solusdt:chart:na:1m:300",
      currentState: "expired",
      stateSince: 420,
    });
    expect(trace.flatMap((record) => record.transitions).map((transition) => transition.to)).toEqual([
      "developing",
      "expired",
    ]);
    expect(trace.flatMap((record) => record.evidenceAdded).map((event) => event.code)).not.toContain(
      "avwap_failed_reclaim",
    );
  });

  it("does not replace an active candidate when the extension gate flaps", () => {
    const flatCandles = Array.from({ length: 10 }, (_, index) => candle(index, 100));
    const trace = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      executionTimeframe: "1m",
      candlesByTimeframe: { "1m": flatCandles },
      candidateMetrics: [
        { asOf: 60, metrics: { returnPct: 0 } },
        { asOf: 300, metrics: { returnPct: 10 } },
        { asOf: 360, metrics: { returnPct: 0 } },
        { asOf: 420, metrics: { returnPct: 10 } },
      ],
      from: 60,
      to: 540,
      config: {
        extensionOptions: lifecycleExtensionOptions,
        maxCandidateAgeSeconds: 1_000,
      },
    });

    expect(new Set(trace.map((record) => record.candidateId).filter(Boolean))).toEqual(
      new Set(["impulse_fade_v1:solusdt:chart:na:1m:300"]),
    );
  });

  it("re-arms only after terminal state, gate reset, and a fresh crossing", () => {
    const flatCandles = Array.from({ length: 11 }, (_, index) => candle(index, 100));
    const trace = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      executionTimeframe: "1m",
      candlesByTimeframe: { "1m": flatCandles },
      candidateMetrics: [
        { asOf: 60, metrics: { returnPct: 0 } },
        { asOf: 300, metrics: { returnPct: 10 } },
        { asOf: 360, metrics: { returnPct: 10 } },
        { asOf: 420, metrics: { returnPct: 10 } },
        { asOf: 480, metrics: { returnPct: 0 } },
        { asOf: 540, metrics: { returnPct: 10 } },
      ],
      from: 60,
      to: 600,
      config: {
        extensionOptions: lifecycleExtensionOptions,
        maxCandidateAgeSeconds: 120,
      },
    });

    expect(trace.find((record) => record.asOf === 420)).toMatchObject({
      candidateId: "impulse_fade_v1:solusdt:chart:na:1m:300",
      currentState: "expired",
    });
    expect(trace.at(-1)).toMatchObject({
      candidateId: "impulse_fade_v1:solusdt:chart:na:1m:540",
      candidateDetectedAt: 540,
      currentState: "developing",
    });
  });

  it("is equivalent when future candles and events are physically truncated", () => {
    const full = evaluateImpulseFadeTimeline({
      ...input,
      structureEvents: [bearishBreak(), bullishBreak(420, 480, 120)],
      relativeStrengthEvents: [bearishRsEvent(300, 360), bearishRsEvent(420, 480)],
      evaluationPoints: [360, 420],
      to: 420,
    });
    const truncated = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": candles.filter((item) => candleCloseTime(item, "1m") <= 420) },
      structureEvents: [bearishBreak()],
      relativeStrengthEvents: [bearishRsEvent(300, 360)],
      evaluationPoints: [360, 420],
      to: 420,
    });

    expect(truncated).toEqual(full);
    expect(JSON.stringify(truncated)).toBe(JSON.stringify(full));
  });

  it("emits chronological, legal, non-duplicated transitions and evidence", () => {
    const retestCandles = candles.map((item) => ({ ...item }));
    retestCandles[7] = { ...retestCandles[7], o: 109.5, h: 110.1, l: 106.8, c: 108 };
    const trace = evaluateImpulseFadeTimeline({
      ...input,
      candlesByTimeframe: { "1m": retestCandles },
      relativeStrengthEvents: [bearishRsEvent(300, 360)],
      structureEvents: [bearishBreak(360, 420)],
      evaluationPoints: [360, 420],
      to: 480,
    });
    const evidence = trace.flatMap((record) => record.evidenceAdded);
    const transitions = trace.flatMap((record) => record.transitions);

    expect(new Set(evidence.map((event) => event.id)).size).toBe(evidence.length);
    expect(new Set(transitions.map((transition) => JSON.stringify(transition))).size).toBe(
      transitions.length,
    );
    expect(transitions.map((transition) => `${transition.from}->${transition.to}`)).toEqual([
      "notCandidate->developing",
      "developing->deteriorating",
      "deteriorating->waitingForRetest",
      "waitingForRetest->entryCandidate",
    ]);
    expect(transitions.map((transition) => transition.knownAt)).toEqual([300, 360, 420, 480]);
  });

  it("retains a real confirmed SOL terminal event before re-arming", () => {
    const fixtureCandles = solTerminalRegression.candles.map(
      ([ts, o, h, l, c, vBase, vQuote], x) => ({
        ts,
        bucket: ts,
        x,
        o,
        h,
        l,
        c,
        v_base: vBase,
        v_quote: vQuote,
      }),
    );
    const trace = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "1h",
      candlesByTimeframe: { "1h": fixtureCandles },
      from: Date.parse(solTerminalRegression.from) / 1_000,
      to: Date.parse(solTerminalRegression.to) / 1_000,
      config: solTerminalRegression.config,
    });
    const terminalId = "impulse_fade_v1:solusdt:external:bybit:1h:1787245200";

    expect(trace.find((record) => record.asOf === 1_787_821_200)).toMatchObject({
      candidateId: terminalId,
      currentState: "invalidated",
    });
    expect(trace.find((record) => record.asOf === 1_787_835_600)).toMatchObject({
      candidateId: terminalId,
      currentState: "invalidated",
    });
    expect(trace.find((record) => record.asOf === 1_787_839_200)).toMatchObject({
      candidateId: "impulse_fade_v1:solusdt:external:bybit:1h:1787839200",
      currentState: "developing",
    });
    expect(evaluateImpulseFadeSnapshot({
      symbol: "SOLUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "1h",
      candlesByTimeframe: { "1h": fixtureCandles },
      from: Date.parse(solTerminalRegression.from) / 1_000,
      to: Date.parse(solTerminalRegression.to) / 1_000,
      config: solTerminalRegression.config,
    })).toMatchObject({
      candidate: { id: "impulse_fade_v1:solusdt:external:bybit:1h:1787839200" },
      currentState: "entryCandidate",
    });

    const cutoff = 1_787_835_600;
    const fullAtCutoff = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "1h",
      candlesByTimeframe: { "1h": fixtureCandles },
      from: Date.parse(solTerminalRegression.from) / 1_000,
      to: cutoff,
      config: solTerminalRegression.config,
    });
    const truncatedAtCutoff = evaluateImpulseFadeTimeline({
      symbol: "SOLUSDT",
      source: "external",
      venue: "bybit",
      executionTimeframe: "1h",
      candlesByTimeframe: {
        "1h": fixtureCandles.filter((item) => candleCloseTime(item, "1h") <= cutoff),
      },
      from: Date.parse(solTerminalRegression.from) / 1_000,
      to: cutoff,
      config: solTerminalRegression.config,
    });

    expect(truncatedAtCutoff).toEqual(fullAtCutoff);
  });
});
