import { describe, expect, it } from "vitest";
import {
  createExecutionVenueEligibilityObservation,
  createUniverseMembershipObservation,
} from "./radar";
import {
  createReplayCandleRecord,
  createReplayKnownEvent,
  replayCandleObservationId,
  replayKnownEventId,
} from "./replay";
import {
  JsonReplayHistoricalDataAdapter,
  REPLAY_JSON_DATA_SCHEMA_VERSION,
  parseReplayJsonHistoricalDataFixture,
  type ReplayJsonHistoricalDataFixture,
} from "./replayJsonAdapter";

const HOUR = 3_600;
const START = Date.parse("2024-07-01T00:00:00Z") / 1_000;
const SYMBOL = "FILUSDT";
const SOURCE = "bybit";

describe("JSON replay historical-data adapter", () => {
  it("validates, freezes, sorts, and defensively owns JSON fixture data", async () => {
    const fixture = jsonFixture();
    const mutableJson = JSON.parse(JSON.stringify(fixture)) as ReplayJsonHistoricalDataFixture;
    mutableJson.candles.reverse();
    const adapter = new JsonReplayHistoricalDataAdapter(mutableJson);
    mutableJson.candles.length = 0;

    const parsed = parseReplayJsonHistoricalDataFixture(fixture);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.candles)).toBe(true);

    const history = await adapter.loadCandleHistory({
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "1h",
      from: START,
      to: START + HOUR,
    });
    expect(history.map((item) => item.openTime)).toEqual([START, START + HOUR]);
    expect(Object.isFrozen(history)).toBe(true);

    const coverage = await adapter.getCoverage({
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "1h",
    });
    expect(coverage).toEqual({
      timeframe: "1h",
      earliestOpenTime: START,
      latestCloseTime: START + 2 * HOUR,
      revisionHistoryAvailable: true,
    });

    const revisions = await adapter.loadCandleRevisions({
      symbol: SYMBOL,
      source: SOURCE,
      timeframe: "1h",
      from: START,
      to: START,
    });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({ revision: 2, correctionPublishedAt: START + 2 * HOUR });
  });

  it("filters point-in-time sidecars and never leaks one instrument into another", async () => {
    const adapter = new JsonReplayHistoricalDataAdapter(jsonFixture());
    const query = { symbol: SYMBOL, source: SOURCE, from: START, to: START + 2 * HOUR };

    await expect(adapter.loadKnownEvents(query)).resolves.toHaveLength(1);
    await expect(adapter.loadPointInTimeVenueEvidence(query)).resolves.toHaveLength(1);
    await expect(adapter.loadPointInTimeUniverseEvidence(query)).resolves.toHaveLength(1);
    await expect(
      adapter.loadKnownEvents({ ...query, symbol: "BTCUSDT" }),
    ).resolves.toEqual([]);
    await expect(
      adapter.loadCandleHistory({ ...query, symbol: "BTCUSDT", timeframe: "1h" }),
    ).resolves.toEqual([]);
  });

  it("rejects tampered identities and non-causal correction publication times", () => {
    const fixture = jsonFixture();
    expect(() =>
      parseReplayJsonHistoricalDataFixture({
        ...fixture,
        candles: [{ ...fixture.candles[0], c: 999 }],
      }),
    ).toThrow("Invalid replay candle");

    const correction = fixture.candleRevisions[0];
    const invalidCorrection = {
      ...correction,
      correctionPublishedAt: correction.closeTime - 1,
    };
    invalidCorrection.observationId = replayCandleObservationId(invalidCorrection);
    expect(() =>
      parseReplayJsonHistoricalDataFixture({
        ...fixture,
        candleRevisions: [invalidCorrection],
      }),
    ).toThrow("Invalid replay candle");

    expect(() =>
      parseReplayJsonHistoricalDataFixture({
        ...fixture,
        revisionHistoryAvailable: false,
      }),
    ).toThrow("Candle revisions require revisionHistoryAvailable=true");

    const foreignEvent = { ...fixture.knownEvents[0], symbol: "BTCUSDT" };
    foreignEvent.id = replayKnownEventId(foreignEvent);
    expect(() =>
      parseReplayJsonHistoricalDataFixture({
        ...fixture,
        knownEvents: [foreignEvent],
      }),
    ).toThrow("Invalid replay known event");
  });
});

function jsonFixture(): ReplayJsonHistoricalDataFixture {
  const first = createReplayCandleRecord({
    symbol: SYMBOL,
    source: SOURCE,
    timeframe: "1h",
    openTime: START,
    o: 100,
    h: 102,
    l: 99,
    c: 101,
    vBase: 10,
    revision: 1,
  });
  const second = createReplayCandleRecord({
    symbol: SYMBOL,
    source: SOURCE,
    timeframe: "1h",
    openTime: START + HOUR,
    o: 101,
    h: 104,
    l: 100,
    c: 103,
    vBase: 20,
    revision: 1,
  });
  const correction = createReplayCandleRecord({
    symbol: SYMBOL,
    source: SOURCE,
    timeframe: "1h",
    openTime: START,
    o: 100,
    h: 103,
    l: 99,
    c: 102,
    vBase: 11,
    knownAt: START + 2 * HOUR,
    revision: 2,
    correctionPublishedAt: START + 2 * HOUR,
  });
  const knownEvent = createReplayKnownEvent({
    symbol: SYMBOL,
    source: SOURCE,
    kind: "structure",
    eventType: "Shift",
    direction: "bearish",
    timeframe: "1h",
    lifecycleState: null,
    avwapId: null,
    eventTime: START + HOUR,
    knownAt: START + 2 * HOUR,
    detail: { fixture: true },
  });
  const venue = createExecutionVenueEligibilityObservation({
    symbol: SYMBOL,
    marketDataSource: SOURCE,
    executionVenue: "phemex",
    status: "Available",
    effectiveFrom: START,
    effectiveTo: null,
    knownAt: START,
    evidenceSource: "fixture",
    dataQualityNotes: [],
  });
  const universe = createUniverseMembershipObservation({
    symbol: SYMBOL,
    source: SOURCE,
    included: true,
    effectiveFrom: START,
    effectiveTo: null,
    knownAt: START,
  });

  return {
    schemaVersion: REPLAY_JSON_DATA_SCHEMA_VERSION,
    symbol: SYMBOL,
    source: SOURCE,
    candles: [second, first],
    candleRevisions: [correction],
    radarEpisodes: [],
    analysisStateHistory: [],
    knownEvents: [knownEvent],
    venueEvidence: [venue],
    universeEvidence: [universe],
    revisionHistoryAvailable: true,
  };
}
