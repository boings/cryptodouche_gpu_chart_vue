import { describe, expect, it } from "vitest";
import {
  createReplayCandleRecord,
  replayCandleLogicalId,
  replayCandleObservationId,
  type ReplayCandleRecord,
} from "./replay";
import {
  JsonReplayAnalysisDataAdapter,
  REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
  parseReplayAnalysisJsonDataFixture,
  type ReplayAnalysisJsonDataFixture,
} from "./replayAnalysisJsonAdapter";

const MINUTE = 60;
const START = Date.parse("2024-07-01T00:00:00Z") / 1_000;
const TARGET = { symbol: "FILUSDT", source: "bybit" } as const;
const REFERENCE = { symbol: "BTCUSDT", source: "binance" } as const;

describe("JSON replay analysis-data adapter", () => {
  it("parses JSON, sorts and freezes both instruments, and exposes coverage", async () => {
    const fixture = analysisFixture();
    const json = JSON.parse(JSON.stringify(fixture)) as ReplayAnalysisJsonDataFixture;
    json.target.candles.reverse();
    json.reference.candles.reverse();
    const adapter = new JsonReplayAnalysisDataAdapter(json);
    json.target.candles.length = 0;

    const parsed = parseReplayAnalysisJsonDataFixture(
      JSON.parse(JSON.stringify(fixture)) as unknown,
    );
    expect(parsed.schemaVersion).toBe("replay-analysis-data.1");
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.target.candles)).toBe(true);
    expect(parsed.target.candles.map((item) => item.openTime)).toEqual([
      START,
      START + 15 * MINUTE,
    ]);

    await expect(
      adapter.getCoverage({ ...TARGET, timeframe: "15m" }),
    ).resolves.toEqual({
      timeframe: "15m",
      earliestOpenTime: START,
      latestCloseTime: START + 30 * MINUTE,
      revisionHistoryAvailable: true,
    });
    await expect(
      adapter.coverage({ ...REFERENCE, timeframe: "15m" }),
    ).resolves.toEqual({
      timeframe: "15m",
      earliestOpenTime: START,
      latestCloseTime: START + 30 * MINUTE,
      revisionHistoryAvailable: true,
    });
  });

  it("loads target and reference base/revision series without cross-instrument leakage", async () => {
    const adapter = new JsonReplayAnalysisDataAdapter(analysisFixture());
    const range = { timeframe: "15m", from: START, to: START + 15 * MINUTE };

    const target = await adapter.loadCandles({ ...TARGET, ...range });
    expect(target.map((item) => item.symbol)).toEqual(["FILUSDT", "FILUSDT"]);
    expect(Object.isFrozen(target)).toBe(true);
    expect(Object.isFrozen(target[0])).toBe(true);

    const targetRevisions = await adapter.loadCandleRevisions({ ...TARGET, ...range });
    expect(targetRevisions).toHaveLength(1);
    expect(targetRevisions[0]).toMatchObject({
      symbol: "FILUSDT",
      revision: 2,
      correctionPublishedAt: START + 31 * MINUTE,
    });

    const reference = await adapter.loadReferenceCandles({ ...REFERENCE, ...range });
    expect(reference.map((item) => item.symbol)).toEqual(["BTCUSDT", "BTCUSDT"]);
    await expect(
      adapter.loadReferenceCandleRevisions({ ...REFERENCE, ...range }),
    ).resolves.toHaveLength(1);

    await expect(adapter.loadCandles({ ...REFERENCE, ...range })).resolves.toEqual([]);
    await expect(
      adapter.loadReferenceCandles({ ...TARGET, ...range }),
    ).resolves.toEqual([]);
    await expect(
      adapter.getCoverage({ symbol: "ETHUSDT", source: "bybit", timeframe: "15m" }),
    ).resolves.toEqual({
      timeframe: "15m",
      earliestOpenTime: null,
      latestCloseTime: null,
      revisionHistoryAvailable: false,
    });
  });

  it("rejects forged observation and logical identities", () => {
    const fixture = analysisFixture();
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: {
          ...fixture.target,
          candles: [{
            ...fixture.target.candles[0],
            c: (fixture.target.candles[0].c + fixture.target.candles[0].h) / 2,
          }],
        },
      }),
    ).toThrow("Invalid target replay candle");

    const wrongLogicalId = {
      ...fixture.reference.candles[0],
      logicalCandleId: replayCandleLogicalId({
        ...fixture.reference.candles[0],
        symbol: "ETHUSDT",
      }),
    };
    wrongLogicalId.observationId = replayCandleObservationId(wrongLogicalId);
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        reference: { ...fixture.reference, candles: [wrongLogicalId] },
      }),
    ).toThrow("Invalid reference replay candle");
  });

  it("rejects symbol, source, timeframe, close, and knowledge-time provenance mismatches", () => {
    const fixture = analysisFixture();
    const base = fixture.target.candles[0];
    const invalid = [
      { ...base, symbol: "BTCUSDT" },
      { ...base, source: "okx" },
      { ...base, timeframe: "5m" },
      { ...base, closeTime: base.closeTime + 1 },
      { ...base, knownAt: base.closeTime - 1 },
    ];

    for (const candle of invalid) {
      if (candle.knownAt >= candle.closeTime) {
        candle.logicalCandleId = replayCandleLogicalId(candle);
        candle.observationId = replayCandleObservationId(candle as ReplayCandleRecord);
      }
      expect(() =>
        parseReplayAnalysisJsonDataFixture({
          ...fixture,
          target: { ...fixture.target, candles: [candle] },
        }),
      ).toThrow();
    }
  });

  it("requires revisions to bind to a base and carry monotonic correction provenance", () => {
    const fixture = analysisFixture();
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: { ...fixture.target, revisionHistoryAvailable: false },
      }),
    ).toThrow("target candle revisions require revisionHistoryAvailable=true");

    const correction = fixture.target.candleRevisions[0];
    const missingPublication = reidentify({ ...correction, correctionPublishedAt: null });
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: { ...fixture.target, candleRevisions: [missingPublication] },
      }),
    ).toThrow("requires revision and correction provenance");

    const foreignBase = createReplayCandleRecord({
      symbol: TARGET.symbol,
      source: TARGET.source,
      timeframe: "15m",
      openTime: START + 30 * MINUTE,
      o: 96,
      h: 98,
      l: 95,
      c: 97,
      revision: 2,
      knownAt: START + 46 * MINUTE,
      correctionPublishedAt: START + 46 * MINUTE,
    });
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: { ...fixture.target, candleRevisions: [foreignBase] },
      }),
    ).toThrow("has no base record");

    const nonMonotonic = reidentify({
      ...correction,
      revision: 1,
    });
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: { ...fixture.target, candleRevisions: [nonMonotonic] },
      }),
    ).toThrow("monotonic correction provenance");

    const originalBase = fixture.target.candles[0];
    const baseWithCorrection = reidentify({
      ...originalBase,
      knownAt: originalBase.closeTime + MINUTE,
      correctionPublishedAt: originalBase.closeTime + MINUTE,
      revision: 1,
    });
    expect(() =>
      parseReplayAnalysisJsonDataFixture({
        ...fixture,
        target: { ...fixture.target, candles: [baseWithCorrection] },
      }),
    ).toThrow("Base target candle cannot have correction provenance");
  });

  it("validates schema shape and ordered query ranges", async () => {
    const fixture = analysisFixture();
    expect(() =>
      parseReplayAnalysisJsonDataFixture({ ...fixture, schemaVersion: "replay-analysis-data.2" }),
    ).toThrow("Unsupported Replay analysis JSON data schema");
    expect(() =>
      parseReplayAnalysisJsonDataFixture({ ...fixture, eventualOutcome: "future" }),
    ).toThrow("unsupported or missing fields");

    const adapter = new JsonReplayAnalysisDataAdapter(fixture);
    await expect(
      adapter.loadCandles({
        ...TARGET,
        timeframe: "15m",
        from: START + MINUTE,
        to: START,
      }),
    ).rejects.toThrow("ordered Unix-second timestamps");
  });
});

function analysisFixture(): ReplayAnalysisJsonDataFixture {
  const targetFirst = candle(TARGET, START, 100, 98);
  const targetSecond = candle(TARGET, START + 15 * MINUTE, 98, 101);
  const targetCorrection = createReplayCandleRecord({
    symbol: TARGET.symbol,
    source: TARGET.source,
    timeframe: "15m",
    openTime: START,
    o: 100,
    h: 102,
    l: 96,
    c: 99,
    vBase: 12,
    vQuote: 1_188,
    knownAt: START + 31 * MINUTE,
    revision: 2,
    correctionPublishedAt: START + 31 * MINUTE,
  });
  const referenceFirst = candle(REFERENCE, START, 60_000, 60_100);
  const referenceSecond = candle(REFERENCE, START + 15 * MINUTE, 60_100, 60_050);
  const referenceCorrection = createReplayCandleRecord({
    symbol: REFERENCE.symbol,
    source: REFERENCE.source,
    timeframe: "15m",
    openTime: START,
    o: 60_000,
    h: 60_250,
    l: 59_900,
    c: 60_150,
    vBase: 25,
    vQuote: 1_503_750,
    knownAt: START + 32 * MINUTE,
    revision: 2,
    correctionPublishedAt: START + 32 * MINUTE,
  });

  return {
    schemaVersion: REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
    target: {
      ...TARGET,
      candles: [targetSecond, targetFirst],
      candleRevisions: [targetCorrection],
      revisionHistoryAvailable: true,
    },
    reference: {
      ...REFERENCE,
      candles: [referenceSecond, referenceFirst],
      candleRevisions: [referenceCorrection],
      revisionHistoryAvailable: true,
    },
  };
}

function candle(
  instrument: { symbol: string; source: string },
  openTime: number,
  open: number,
  close: number,
) {
  return createReplayCandleRecord({
    ...instrument,
    timeframe: "15m",
    openTime,
    o: open,
    h: Math.max(open, close) + Math.max(1, open * 0.001),
    l: Math.min(open, close) - Math.max(1, open * 0.001),
    c: close,
    vBase: 10,
    vQuote: close * 10,
    revision: 1,
  });
}

function reidentify(candle: ReplayCandleRecord): ReplayCandleRecord {
  return {
    ...candle,
    logicalCandleId: replayCandleLogicalId(candle),
    observationId: replayCandleObservationId(candle),
  };
}
