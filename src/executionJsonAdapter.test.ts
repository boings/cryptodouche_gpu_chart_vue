import { describe, expect, it } from "vitest";
import {
  VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  createExecutionCandleObservation,
  createExecutionQuoteObservation,
  createExecutionTradeObservation,
  createFundingObservation,
  createVenueExecutionRules,
  createVenueFeeSchedule,
} from "./execution";
import {
  EXECUTION_JSON_DATA_SCHEMA_VERSION,
  JsonReplayExecutionDataAdapter,
  parseExecutionJsonHistoricalDataFixture,
} from "./executionJsonAdapter";

describe("execution JSON adapter", () => {
  it("strictly rebuilds identities, preserves funding availability, and returns ordered clones", async () => {
    const fixture = makeFixture();
    const parsed = parseExecutionJsonHistoricalDataFixture(fixture);
    const adapter = new JsonReplayExecutionDataAdapter(fixture);
    const query = { venue: "bybit", symbol: "FILUSDT", from: 0, to: 2_000 };

    expect(parsed.funding).toMatchObject({ availability: "available" });
    expect(adapter.fundingDataAvailable).toBe(true);
    expect((await adapter.loadCandles({ ...query, timeframe: "1m" })).map((item) => item.openTime)).toEqual([900, 960]);
    expect(await adapter.loadTrades(query)).toHaveLength(1);
    expect(await adapter.loadFundingObservations(query)).toHaveLength(1);
  });

  it("rejects unknown fields, forged observation IDs, duplicate intervals, and unavailable funding with data", () => {
    const fixture = makeFixture();
    expect(() => parseExecutionJsonHistoricalDataFixture({ ...fixture, surprise: true })).toThrow("unknown fields");

    const forged = structuredClone(fixture);
    forged.candles[0]!.id = "execution-candle:forged";
    expect(() => parseExecutionJsonHistoricalDataFixture(forged)).toThrow("Non-canonical");

    const duplicate = structuredClone(fixture);
    duplicate.candles.push(duplicate.candles[0]!);
    expect(() => parseExecutionJsonHistoricalDataFixture(duplicate)).toThrow("Duplicate candle interval");

    const unavailable = structuredClone(fixture) as Record<string, unknown>;
    unavailable.funding = { availability: "unavailable", reason: "not supplied", observations: [] };
    expect(() => parseExecutionJsonHistoricalDataFixture(unavailable)).toThrow("missing or unknown fields");
  });
});

function makeFixture() {
  const fee = createVenueFeeSchedule({
    id: "fee:test",
    version: "1",
    schemaVersion: VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
    venue: "bybit",
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: 0,
    effectiveUntil: null,
    makerRate: 0.0002,
    takerRate: 0.00055,
    provenance: "test",
    assumptionStatus: "researchAssumption",
  });
  const rules = createVenueExecutionRules({
    id: "rules:test",
    version: "1",
    schemaVersion: VENUE_EXECUTION_RULES_SCHEMA_VERSION,
    venue: "bybit",
    symbol: "FILUSDT",
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: 0,
    effectiveUntil: null,
    priceTick: 0.0001,
    quantityStep: 0.1,
    minimumQuantity: 0.1,
    minimumNotional: 5,
    maximumQuantity: null,
    maximumNotional: null,
    maximumLeverage: 25,
    feeScheduleRef: { id: fee.id, version: fee.version, hash: fee.canonicalConfigHash },
    stopTriggerSources: ["last"],
    supportedOrderTypes: ["market", "limit", "stopMarket"],
    maintenanceMarginModel: null,
    liquidationModel: null,
    fundingConvention: { positiveRateMeaning: "longsPayShorts", sameTimestampOrdering: "ambiguous" },
    provenance: "test",
    assumptionStatus: "researchAssumption",
  }, fee);
  const candles = [
    createExecutionCandleObservation({ venue: "bybit", symbol: "FILUSDT", timeframe: "1m", openTime: 960, o: 0.8, h: 0.81, l: 0.79, c: 0.8 }),
    createExecutionCandleObservation({ venue: "bybit", symbol: "FILUSDT", timeframe: "1m", openTime: 900, o: 0.79, h: 0.8, l: 0.78, c: 0.795 }),
  ];
  return {
    schemaVersion: EXECUTION_JSON_DATA_SCHEMA_VERSION,
    venue: "bybit",
    symbol: "FILUSDT",
    candles,
    trades: [createExecutionTradeObservation({ venue: "bybit", symbol: "FILUSDT", eventTime: 1_000, price: 0.8, quantity: 10, side: "buy" })],
    tradeDataCompleteness: "partial" as const,
    quotes: [createExecutionQuoteObservation({ venue: "bybit", symbol: "FILUSDT", eventTime: 1_000, bid: 0.799, ask: 0.801 })],
    quoteDataCompleteness: "partial" as const,
    markPrices: [],
    indexPrices: [],
    funding: {
      availability: "available" as const,
      observations: [createFundingObservation({ venue: "bybit", symbol: "FILUSDT", fundingTime: 1_200, rate: 0.001, markPrice: 0.8, dataProvenance: "test" })],
    },
    venueRuleEvidence: [rules],
  };
}
