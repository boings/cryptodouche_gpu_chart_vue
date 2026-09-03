import {
  EXECUTION_CANDLE_SCHEMA_VERSION,
  EXECUTION_QUOTE_SCHEMA_VERSION,
  EXECUTION_TRADE_SCHEMA_VERSION,
  FUNDING_OBSERVATION_SCHEMA_VERSION,
  VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  InMemoryReplayExecutionDataAdapter,
  createExecutionCandleObservation,
  createExecutionQuoteObservation,
  createExecutionTradeObservation,
  createFundingObservation,
  venueExecutionRulesHash,
  type ExecutionCandleObservation,
  type ExecutionCandleQuery,
  type ExecutionDataQuery,
  type ExecutionQuoteObservation,
  type ExecutionTradeObservation,
  type FundingObservation,
  type ReplayExecutionDataAdapter,
  type VenueExecutionRules,
} from "./execution";
import { canonicalSerialize, immutableJsonClone } from "./serialization";

export const EXECUTION_JSON_DATA_SCHEMA_VERSION = "execution-json-data.1" as const;

export interface ExecutionJsonHistoricalDataFixture {
  schemaVersion: typeof EXECUTION_JSON_DATA_SCHEMA_VERSION;
  venue: string;
  symbol: string;
  candles: ExecutionCandleObservation[];
  trades: ExecutionTradeObservation[];
  tradeDataCompleteness: "complete" | "partial" | "unavailable";
  quotes: ExecutionQuoteObservation[];
  quoteDataCompleteness: "complete" | "partial" | "unavailable";
  markPrices: ExecutionQuoteObservation[];
  indexPrices: ExecutionQuoteObservation[];
  funding:
    | { availability: "available"; observations: FundingObservation[] }
    | { availability: "unavailable"; reason: string };
  venueRuleEvidence: VenueExecutionRules[];
}

export function parseExecutionJsonHistoricalDataFixture(
  input: unknown,
): ExecutionJsonHistoricalDataFixture {
  const record = requireRecord(input, "Execution JSON data");
  requireExactKeys(record, [
    "schemaVersion",
    "venue",
    "symbol",
    "candles",
    "trades",
    "tradeDataCompleteness",
    "quotes",
    "quoteDataCompleteness",
    "markPrices",
    "indexPrices",
    "funding",
    "venueRuleEvidence",
  ], "Execution JSON data");
  if (record.schemaVersion !== EXECUTION_JSON_DATA_SCHEMA_VERSION) {
    throw new Error("Unsupported execution JSON data schema");
  }
  const venue = requireString(record.venue, "venue");
  const symbol = requireString(record.symbol, "symbol").toUpperCase();
  const candles = parseCandles(record.candles, venue, symbol);
  const trades = parseTrades(record.trades, venue, symbol);
  const quotes = parseQuotes(record.quotes, venue, symbol, "quotes");
  const markPrices = parseQuotes(record.markPrices, venue, symbol, "markPrices");
  const indexPrices = parseQuotes(record.indexPrices, venue, symbol, "indexPrices");
  const tradeDataCompleteness = parseCompleteness(record.tradeDataCompleteness, "tradeDataCompleteness");
  const quoteDataCompleteness = parseCompleteness(record.quoteDataCompleteness, "quoteDataCompleteness");
  if (tradeDataCompleteness === "unavailable" && trades.length) {
    throw new Error("Unavailable trade data cannot contain observations");
  }
  if (quoteDataCompleteness === "unavailable" && quotes.length) {
    throw new Error("Unavailable quote data cannot contain observations");
  }
  const fundingRecord = requireRecord(record.funding, "funding");
  let funding: ExecutionJsonHistoricalDataFixture["funding"];
  if (fundingRecord.availability === "available") {
    requireExactKeys(fundingRecord, ["availability", "observations"], "available funding");
    funding = {
      availability: "available",
      observations: parseFunding(fundingRecord.observations, venue, symbol),
    };
  } else if (fundingRecord.availability === "unavailable") {
    requireExactKeys(fundingRecord, ["availability", "reason"], "unavailable funding");
    funding = {
      availability: "unavailable",
      reason: requireString(fundingRecord.reason, "funding reason"),
    };
  } else {
    throw new Error("Funding availability must be available or unavailable");
  }
  const venueRuleEvidence = requireArray(record.venueRuleEvidence, "venueRuleEvidence")
    .map((value, index) => parseVenueRules(value, venue, symbol, index));
  assertGloballyUniqueIds([
    ...candles,
    ...trades,
    ...quotes,
    ...markPrices,
    ...indexPrices,
    ...(funding.availability === "available" ? funding.observations : []),
    ...venueRuleEvidence,
  ]);
  return immutableJsonClone({
    schemaVersion: EXECUTION_JSON_DATA_SCHEMA_VERSION,
    venue,
    symbol,
    candles: sortCandles(candles),
    trades: sortTimed(trades),
    tradeDataCompleteness,
    quotes: sortTimed(quotes),
    quoteDataCompleteness,
    markPrices: sortTimed(markPrices),
    indexPrices: sortTimed(indexPrices),
    funding: funding.availability === "available"
      ? {
          availability: "available",
          observations: [...funding.observations].sort(
            (left, right) => left.fundingTime - right.fundingTime || left.knownAt - right.knownAt || left.id.localeCompare(right.id),
          ),
        }
      : funding,
    venueRuleEvidence: [...venueRuleEvidence].sort((left, right) =>
      (left.effectiveFrom ?? -1) - (right.effectiveFrom ?? -1) || left.id.localeCompare(right.id),
    ),
  });
}

export class JsonReplayExecutionDataAdapter implements ReplayExecutionDataAdapter {
  readonly fundingDataAvailable: boolean;
  readonly tradeDataCompleteness: "complete" | "partial" | "unavailable";
  readonly quoteDataCompleteness: "complete" | "partial" | "unavailable";
  readonly #delegate: InMemoryReplayExecutionDataAdapter;

  constructor(input: unknown) {
    const fixture = parseExecutionJsonHistoricalDataFixture(input);
    this.fundingDataAvailable = fixture.funding.availability === "available";
    this.tradeDataCompleteness = fixture.tradeDataCompleteness;
    this.quoteDataCompleteness = fixture.quoteDataCompleteness;
    this.#delegate = new InMemoryReplayExecutionDataAdapter({
      candles: fixture.candles,
      trades: fixture.trades,
      tradeDataCompleteness: fixture.tradeDataCompleteness,
      quotes: fixture.quotes,
      quoteDataCompleteness: fixture.quoteDataCompleteness,
      markPrices: fixture.markPrices,
      indexPrices: fixture.indexPrices,
      funding: fixture.funding.availability === "available" ? fixture.funding.observations : [],
      fundingDataAvailable: this.fundingDataAvailable,
      venueRuleEvidence: fixture.venueRuleEvidence,
    });
  }

  getCoverage(query: ExecutionDataQuery) {
    return this.#delegate.getCoverage(query);
  }

  loadCandles(query: ExecutionCandleQuery) {
    return this.#delegate.loadCandles(query);
  }

  loadTrades(query: ExecutionDataQuery) {
    return this.#delegate.loadTrades(query);
  }

  loadQuotes(query: ExecutionDataQuery) {
    return this.#delegate.loadQuotes(query);
  }

  loadMarkPrices(query: ExecutionDataQuery) {
    return this.#delegate.loadMarkPrices(query);
  }

  loadIndexPrices(query: ExecutionDataQuery) {
    return this.#delegate.loadIndexPrices(query);
  }

  loadFundingObservations(query: ExecutionDataQuery) {
    return this.#delegate.loadFundingObservations(query);
  }

  loadVenueRuleEvidence(query: ExecutionDataQuery) {
    return this.#delegate.loadVenueRuleEvidence(query);
  }
}

function parseCandles(input: unknown, venue: string, symbol: string) {
  const seen = new Set<string>();
  return requireArray(input, "candles").map((value, index) => {
    const item = requireRecord(value, `candles[${index}]`) as unknown as ExecutionCandleObservation;
    if (item.schemaVersion !== EXECUTION_CANDLE_SCHEMA_VERSION) throw new Error(`Invalid candle schema at ${index}`);
    const rebuilt = createExecutionCandleObservation(item);
    assertCanonicalRecord(item, rebuilt, `candle ${index}`);
    assertInstrument(rebuilt, venue, symbol, `candle ${index}`);
    const logical = `${rebuilt.timeframe}:${rebuilt.openTime}`;
    if (seen.has(logical)) throw new Error(`Duplicate candle interval ${logical}`);
    seen.add(logical);
    return rebuilt;
  });
}

function parseTrades(input: unknown, venue: string, symbol: string) {
  return requireArray(input, "trades").map((value, index) => {
    const item = requireRecord(value, `trades[${index}]`) as unknown as ExecutionTradeObservation;
    if (item.schemaVersion !== EXECUTION_TRADE_SCHEMA_VERSION) throw new Error(`Invalid trade schema at ${index}`);
    const rebuilt = createExecutionTradeObservation(item);
    assertCanonicalRecord(item, rebuilt, `trade ${index}`);
    assertInstrument(rebuilt, venue, symbol, `trade ${index}`);
    return rebuilt;
  });
}

function parseQuotes(input: unknown, venue: string, symbol: string, label: string) {
  return requireArray(input, label).map((value, index) => {
    const item = requireRecord(value, `${label}[${index}]`) as unknown as ExecutionQuoteObservation;
    if (item.schemaVersion !== EXECUTION_QUOTE_SCHEMA_VERSION) throw new Error(`Invalid quote schema at ${label}[${index}]`);
    const rebuilt = createExecutionQuoteObservation(item);
    assertCanonicalRecord(item, rebuilt, `${label}[${index}]`);
    assertInstrument(rebuilt, venue, symbol, `${label}[${index}]`);
    return rebuilt;
  });
}

function parseFunding(input: unknown, venue: string, symbol: string) {
  return requireArray(input, "funding observations").map((value, index) => {
    const item = requireRecord(value, `funding[${index}]`) as unknown as FundingObservation;
    if (item.schemaVersion !== FUNDING_OBSERVATION_SCHEMA_VERSION) throw new Error(`Invalid funding schema at ${index}`);
    const rebuilt = createFundingObservation(item);
    assertCanonicalRecord(item, rebuilt, `funding ${index}`);
    assertInstrument(rebuilt, venue, symbol, `funding ${index}`);
    return rebuilt;
  });
}

function parseVenueRules(input: unknown, venue: string, symbol: string, index: number) {
  const item = requireRecord(input, `venueRuleEvidence[${index}]`) as unknown as VenueExecutionRules;
  if (
    item.schemaVersion !== VENUE_EXECUTION_RULES_SCHEMA_VERSION ||
    item.canonicalConfigHash !== venueExecutionRulesHash(item)
  ) throw new Error(`Invalid venue-rule evidence at ${index}`);
  assertInstrument(item, venue, symbol, `venueRuleEvidence[${index}]`);
  return immutableJsonClone(item);
}

function assertCanonicalRecord(input: unknown, rebuilt: unknown, label: string) {
  if (canonicalSerialize(input) !== canonicalSerialize(rebuilt)) {
    throw new Error(`Non-canonical or unknown fields in ${label}`);
  }
}

function assertInstrument(
  item: { venue: string; symbol: string },
  venue: string,
  symbol: string,
  label: string,
) {
  if (item.venue.toLowerCase() !== venue.toLowerCase() || item.symbol.toUpperCase() !== symbol) {
    throw new Error(`${label} instrument identity mismatch`);
  }
}

function assertGloballyUniqueIds(items: Array<{ id: string }>) {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate execution observation id ${item.id}`);
    ids.add(item.id);
  }
}

function parseCompleteness(value: unknown, label: string) {
  if (value !== "complete" && value !== "partial" && value !== "unavailable") {
    throw new Error(`${label} must be complete, partial, or unavailable`);
  }
  return value;
}

function sortCandles(items: ExecutionCandleObservation[]) {
  return [...items].sort((left, right) =>
    left.openTime - right.openTime || left.knownAt - right.knownAt || left.id.localeCompare(right.id),
  );
}

function sortTimed<T extends { eventTime: number; knownAt: number; id: string }>(items: T[]) {
  return [...items].sort((left, right) =>
    left.eventTime - right.eventTime || left.knownAt - right.knownAt || left.id.localeCompare(right.id),
  );
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function requireExactKeys(record: Record<string, unknown>, keys: string[], label: string) {
  const expected = [...keys].sort();
  const actual = Object.keys(record).sort();
  if (canonicalSerialize(actual) !== canonicalSerialize(expected)) {
    throw new Error(`${label} has missing or unknown fields`);
  }
}
