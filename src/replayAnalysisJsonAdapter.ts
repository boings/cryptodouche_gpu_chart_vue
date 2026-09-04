import { strictTimeframeToSeconds } from "./data";
import {
  createReplayCandleRecord,
  replayCandleLogicalId,
  replayCandleObservationId,
  type ReplayCandleQuery,
  type ReplayCandleRecord,
  type ReplayCoverageQuery,
  type ReplayDataCoverage,
} from "./replay";
import { canonicalSerialize, immutableJsonClone } from "./serialization";

export const REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION = "replay-analysis-data.1" as const;

export interface ReplayAnalysisJsonCandleSeries {
  symbol: string;
  source: string;
  candles: ReplayCandleRecord[];
  candleRevisions: ReplayCandleRecord[];
  revisionHistoryAvailable: boolean;
}

export interface ReplayAnalysisJsonDataFixture {
  schemaVersion: typeof REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION;
  target: ReplayAnalysisJsonCandleSeries;
  reference: ReplayAnalysisJsonCandleSeries;
}

export interface ReplayAnalysisDataAdapter {
  getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
  coverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
  loadCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
  loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
  loadReferenceCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
  loadReferenceCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
}

/**
 * Parses the portable raw-data boundary used by replay-engine.2. File I/O remains
 * outside this module so the adapter can be used in browsers and headless tools.
 */
export function parseReplayAnalysisJsonDataFixture(
  input: unknown,
): ReplayAnalysisJsonDataFixture {
  const record = requireRecord(input, "Replay analysis JSON data");
  assertExactKeys(record, ["schemaVersion", "target", "reference"], "Replay analysis JSON data");
  if (record.schemaVersion !== REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION) {
    throw new Error("Unsupported Replay analysis JSON data schema");
  }

  const target = parseSeries(record.target, "target");
  const reference = parseSeries(record.reference, "reference");
  return immutableJsonClone({
    schemaVersion: REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
    target,
    reference,
  });
}

export class JsonReplayAnalysisDataAdapter implements ReplayAnalysisDataAdapter {
  readonly #fixture: ReplayAnalysisJsonDataFixture;

  constructor(input: unknown) {
    this.#fixture = parseReplayAnalysisJsonDataFixture(input);
  }

  async getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage> {
    validateCoverageQuery(query);
    const series = this.#matchingConfiguredSeries(query);
    if (!series) return emptyCoverage(query.timeframe);
    const candles = [...series.candles, ...series.candleRevisions].filter(
      (candle) => candle.timeframe === query.timeframe,
    );
    return immutableJsonClone({
      timeframe: query.timeframe,
      earliestOpenTime: candles.length
        ? Math.min(...candles.map((candle) => candle.openTime))
        : null,
      latestCloseTime: candles.length
        ? Math.max(...candles.map((candle) => candle.closeTime))
        : null,
      revisionHistoryAvailable: series.revisionHistoryAvailable,
    });
  }

  // Kept as a plain-language alias for callers that model coverage as a query operation.
  async coverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage> {
    return this.getCoverage(query);
  }

  async loadCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    return this.#load(this.#fixture.target, this.#fixture.target.candles, query);
  }

  async loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    if (!this.#fixture.target.revisionHistoryAvailable) return immutableJsonClone([]);
    return this.#load(this.#fixture.target, this.#fixture.target.candleRevisions, query);
  }

  async loadReferenceCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    return this.#load(this.#fixture.reference, this.#fixture.reference.candles, query);
  }

  async loadReferenceCandleRevisions(
    query: ReplayCandleQuery,
  ): Promise<ReplayCandleRecord[]> {
    if (!this.#fixture.reference.revisionHistoryAvailable) return immutableJsonClone([]);
    return this.#load(
      this.#fixture.reference,
      this.#fixture.reference.candleRevisions,
      query,
    );
  }

  #load(
    series: ReplayAnalysisJsonCandleSeries,
    candles: readonly ReplayCandleRecord[],
    query: ReplayCandleQuery,
  ): ReplayCandleRecord[] {
    validateRangeQuery(query);
    if (!matchesSeries(series, query)) return immutableJsonClone([]);
    return immutableJsonClone(
      candles.filter(
        (candle) =>
          candle.timeframe === query.timeframe &&
          candle.openTime >= query.from &&
          candle.openTime <= query.to,
      ),
    );
  }

  #matchingConfiguredSeries(
    query: Pick<ReplayCoverageQuery, "symbol" | "source">,
  ): ReplayAnalysisJsonCandleSeries | null {
    if (matchesSeries(this.#fixture.target, query)) return this.#fixture.target;
    if (matchesSeries(this.#fixture.reference, query)) return this.#fixture.reference;
    return null;
  }
}

export class InMemoryReplayAnalysisDataAdapter extends JsonReplayAnalysisDataAdapter {
  constructor(input: ReplayAnalysisJsonDataFixture) {
    super(input);
  }
}

function parseSeries(input: unknown, role: "target" | "reference"): ReplayAnalysisJsonCandleSeries {
  const record = requireRecord(input, `Replay analysis ${role} series`);
  assertExactKeys(
    record,
    ["symbol", "source", "candles", "candleRevisions", "revisionHistoryAvailable"],
    `Replay analysis ${role} series`,
  );
  const symbol = requireString(record.symbol, `${role} symbol`).toUpperCase();
  const source = requireString(record.source, `${role} source`);
  const candles = requireArray(record.candles, `${role} candles`) as ReplayCandleRecord[];
  const candleRevisions = requireArray(
    record.candleRevisions,
    `${role} candleRevisions`,
  ) as ReplayCandleRecord[];
  const revisionHistoryAvailable = requireBoolean(
    record.revisionHistoryAvailable,
    `${role} revisionHistoryAvailable`,
  );
  if (candleRevisions.length > 0 && !revisionHistoryAvailable) {
    throw new Error(`${role} candle revisions require revisionHistoryAvailable=true`);
  }
  validateSeriesCandles(candles, candleRevisions, symbol, source, role);
  return {
    symbol,
    source,
    candles: sortCandles(candles),
    candleRevisions: sortCandles(candleRevisions),
    revisionHistoryAvailable,
  };
}

function validateSeriesCandles(
  candles: readonly ReplayCandleRecord[],
  revisions: readonly ReplayCandleRecord[],
  symbol: string,
  source: string,
  role: "target" | "reference",
) {
  const baseByLogicalId = new Map<string, ReplayCandleRecord>();
  const byObservationId = new Set<string>();
  const byLogicalIdAndKnownAt = new Set<string>();

  for (const candle of [...candles, ...revisions]) {
    validateCandleRecord(candle, symbol, source, role);
    if (byObservationId.has(candle.observationId)) {
      throw new Error(`Duplicate ${role} candle observation ${candle.observationId}`);
    }
    byObservationId.add(candle.observationId);
    const precedenceKey = `${candle.logicalCandleId}\u0000${candle.knownAt}`;
    if (byLogicalIdAndKnownAt.has(precedenceKey)) {
      throw new Error(`Conflicting ${role} candle revision precedence for ${candle.logicalCandleId}`);
    }
    byLogicalIdAndKnownAt.add(precedenceKey);
  }

  for (const candle of candles) {
    if (candle.correctionPublishedAt != null) {
      throw new Error(`Base ${role} candle cannot have correction provenance`);
    }
    if (baseByLogicalId.has(candle.logicalCandleId)) {
      throw new Error(`Base ${role} history contains revisions for ${candle.logicalCandleId}`);
    }
    baseByLogicalId.set(candle.logicalCandleId, candle);
  }

  const revisionsByLogicalId = new Map<string, ReplayCandleRecord[]>();
  for (const revision of revisions) {
    const base = baseByLogicalId.get(revision.logicalCandleId);
    if (!base) {
      throw new Error(`${role} candle revision has no base record: ${revision.logicalCandleId}`);
    }
    if (revision.revision == null || revision.correctionPublishedAt == null) {
      throw new Error(`${role} candle revision requires revision and correction provenance`);
    }
    const history = revisionsByLogicalId.get(revision.logicalCandleId) ?? [];
    history.push(revision);
    revisionsByLogicalId.set(revision.logicalCandleId, history);
  }

  for (const [logicalId, history] of revisionsByLogicalId) {
    const base = baseByLogicalId.get(logicalId)!;
    let previousKnownAt = base.knownAt;
    let previousPublishedAt = base.knownAt;
    let previousRevision = base.revision ?? -1;
    for (const revision of [...history].sort(
      (left, right) =>
        left.knownAt - right.knownAt ||
        left.correctionPublishedAt! - right.correctionPublishedAt! ||
        left.revision! - right.revision!,
    )) {
      if (
        revision.knownAt <= previousKnownAt ||
        revision.correctionPublishedAt! <= previousPublishedAt ||
        revision.revision! <= previousRevision
      ) {
        throw new Error(`${role} candle revisions must have monotonic correction provenance: ${logicalId}`);
      }
      previousKnownAt = revision.knownAt;
      previousPublishedAt = revision.correctionPublishedAt!;
      previousRevision = revision.revision!;
    }
  }
}

function validateCandleRecord(
  input: unknown,
  symbol: string,
  source: string,
  role: "target" | "reference",
): asserts input is ReplayCandleRecord {
  const candle = requireRecord(input, `Replay analysis ${role} candle`) as unknown as ReplayCandleRecord;
  const timeframeSeconds = strictTimeframeToSeconds(candle.timeframe);
  let rebuilt: ReplayCandleRecord;
  try {
    rebuilt = createReplayCandleRecord({
      symbol: candle.symbol,
      source: candle.source,
      timeframe: candle.timeframe,
      openTime: candle.openTime,
      o: candle.o,
      h: candle.h,
      l: candle.l,
      c: candle.c,
      vBase: candle.vBase,
      vQuote: candle.vQuote,
      knownAt: candle.knownAt,
      revision: candle.revision,
      correctionPublishedAt: candle.correctionPublishedAt,
    });
  } catch {
    throw new Error(`Invalid ${role} replay candle ${candle.observationId ?? "<unknown>"}`);
  }
  if (
    candle.symbol !== symbol ||
    candle.source !== source ||
    !nonnegativeSafeInteger(candle.openTime) ||
    candle.openTime % timeframeSeconds !== 0 ||
    candle.closeTime !== candle.openTime + timeframeSeconds ||
    !nonnegativeSafeInteger(candle.closeTime) ||
    !nonnegativeSafeInteger(candle.knownAt) ||
    candle.knownAt < candle.closeTime ||
    (candle.correctionPublishedAt != null &&
      !nonnegativeSafeInteger(candle.correctionPublishedAt)) ||
    candle.logicalCandleId !== replayCandleLogicalId(candle) ||
    candle.observationId !== replayCandleObservationId(candle) ||
    !nullableNonnegative(candle.vBase) ||
    !nullableNonnegative(candle.vQuote) ||
    canonicalSerialize(candle) !== canonicalSerialize(rebuilt)
  ) {
    throw new Error(`Invalid ${role} replay candle ${candle.observationId ?? "<unknown>"}`);
  }
}

function matchesSeries(
  series: Pick<ReplayAnalysisJsonCandleSeries, "symbol" | "source">,
  query: Pick<ReplayCoverageQuery, "symbol" | "source">,
) {
  return query.symbol.toUpperCase() === series.symbol && query.source === series.source;
}

function emptyCoverage(timeframe: string): ReplayDataCoverage {
  return immutableJsonClone({
    timeframe,
    earliestOpenTime: null,
    latestCloseTime: null,
    revisionHistoryAvailable: false,
  });
}

function validateCoverageQuery(query: ReplayCoverageQuery) {
  requireString(query.symbol, "Replay analysis query symbol");
  requireString(query.source, "Replay analysis query source");
  strictTimeframeToSeconds(query.timeframe);
}

function validateRangeQuery(query: ReplayCandleQuery) {
  validateCoverageQuery(query);
  if (
    !nonnegativeSafeInteger(query.from) ||
    !nonnegativeSafeInteger(query.to) ||
    query.to < query.from
  ) {
    throw new RangeError("Replay analysis query range must contain ordered Unix-second timestamps");
  }
}

function sortCandles(candles: readonly ReplayCandleRecord[]) {
  return [...candles].sort(
    (left, right) =>
      left.timeframe.localeCompare(right.timeframe) ||
      left.openTime - right.openTime ||
      left.knownAt - right.knownAt ||
      left.observationId.localeCompare(right.observationId),
  );
}

function assertExactKeys(record: Record<string, unknown>, expected: string[], label: string) {
  const actual = Object.keys(record).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${label} has unsupported or missing fields`);
  }
}

function nullableNonnegative(value: number | null) {
  return value == null || (Number.isFinite(value) && value >= 0);
}

function nonnegativeSafeInteger(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required`);
  return value;
}

function requireBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}
