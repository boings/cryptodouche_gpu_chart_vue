import {
  EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  RADAR_EPISODE_SCHEMA_VERSION,
  RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  executionVenueEligibilityObservationId,
  radarEpisodeObservationId,
  universeMembershipObservationId,
  type ExecutionVenueEligibilityObservation,
  type RadarEpisode,
  type UniverseMembershipObservation,
} from "./radar";
import {
  REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  replayAnalysisStateObservationId,
  replayCandleLogicalId,
  replayCandleObservationId,
  replayKnownEventId,
  type ReplayAnalysisStateObservation,
  type ReplayCandleQuery,
  type ReplayCandleRecord,
  type ReplayCoverageQuery,
  type ReplayDataCoverage,
  type ReplayEvidenceQuery,
  type ReplayHistoricalDataAdapter,
  type ReplayKnownEvent,
} from "./replay";
import { canonicalSerialize, immutableJsonClone } from "./serialization";
import { strictTimeframeToSeconds } from "./data";

export const REPLAY_JSON_DATA_SCHEMA_VERSION = "replay-json-data.1" as const;

export interface ReplayJsonHistoricalDataFixture {
  schemaVersion: typeof REPLAY_JSON_DATA_SCHEMA_VERSION;
  symbol: string;
  source: string;
  candles: ReplayCandleRecord[];
  candleRevisions: ReplayCandleRecord[];
  radarEpisodes: RadarEpisode[];
  analysisStateHistory: ReplayAnalysisStateObservation[];
  knownEvents: ReplayKnownEvent[];
  venueEvidence: ExecutionVenueEligibilityObservation[];
  universeEvidence: UniverseMembershipObservation[];
  revisionHistoryAvailable: boolean;
}

/**
 * Validates the complete JSON data sidecar before exposing any replay query.
 * File I/O stays in the Node CLI so this module remains browser-compatible.
 */
export function parseReplayJsonHistoricalDataFixture(
  input: unknown,
): ReplayJsonHistoricalDataFixture {
  const record = requireRecord(input, "Replay JSON data");
  if (record.schemaVersion !== REPLAY_JSON_DATA_SCHEMA_VERSION) {
    throw new Error("Unsupported Replay JSON data schema");
  }
  const symbol = requireString(record.symbol, "Replay JSON data symbol").toUpperCase();
  const source = requireString(record.source, "Replay JSON data source");
  const candles = requireArray(record.candles, "candles") as ReplayCandleRecord[];
  const candleRevisions = optionalArray(
    record.candleRevisions,
    "candleRevisions",
  ) as ReplayCandleRecord[];
  const radarEpisodes = requireArray(record.radarEpisodes, "radarEpisodes") as RadarEpisode[];
  const analysisStateHistory = optionalArray(
    record.analysisStateHistory,
    "analysisStateHistory",
  ) as ReplayAnalysisStateObservation[];
  const knownEvents = optionalArray(record.knownEvents, "knownEvents") as ReplayKnownEvent[];
  const venueEvidence = optionalArray(
    record.venueEvidence,
    "venueEvidence",
  ) as ExecutionVenueEligibilityObservation[];
  const universeEvidence = optionalArray(
    record.universeEvidence,
    "universeEvidence",
  ) as UniverseMembershipObservation[];
  const revisionHistoryAvailable = requireBoolean(
    record.revisionHistoryAvailable,
    "revisionHistoryAvailable",
  );

  if (candleRevisions.length > 0 && !revisionHistoryAvailable) {
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  }

  validateCandles(candles, candleRevisions, symbol, source);
  validateRadarEpisodes(radarEpisodes, symbol, source);
  validateAnalysisStates(analysisStateHistory, symbol, source);
  validateKnownEvents(knownEvents, symbol, source);
  validateVenueEvidence(venueEvidence, symbol, source);
  validateUniverseEvidence(universeEvidence, symbol, source);

  return immutableJsonClone({
    schemaVersion: REPLAY_JSON_DATA_SCHEMA_VERSION,
    symbol,
    source,
    candles: sortCandles(candles),
    candleRevisions: sortCandles(candleRevisions),
    radarEpisodes: [...radarEpisodes].sort(
      (left, right) => left.detectedAt - right.detectedAt || left.id.localeCompare(right.id),
    ),
    analysisStateHistory: [...analysisStateHistory].sort(
      (left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id),
    ),
    knownEvents: [...knownEvents].sort(
      (left, right) => left.knownAt - right.knownAt || left.id.localeCompare(right.id),
    ),
    venueEvidence: [...venueEvidence].sort(comparePointInTimeEvidence),
    universeEvidence: [...universeEvidence].sort(comparePointInTimeEvidence),
    revisionHistoryAvailable,
  });
}

export class JsonReplayHistoricalDataAdapter implements ReplayHistoricalDataAdapter {
  readonly #fixture: ReplayJsonHistoricalDataFixture;

  constructor(input: unknown) {
    this.#fixture = parseReplayJsonHistoricalDataFixture(input);
  }

  async getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage> {
    validateCoverageQuery(query);
    const candles = this.#matchingCandles(
      [...this.#fixture.candles, ...this.#fixture.candleRevisions],
      query,
    );
    return immutableJsonClone({
      timeframe: query.timeframe,
      earliestOpenTime: candles[0]?.openTime ?? null,
      latestCloseTime: candles.length
        ? Math.max(...candles.map((candle) => candle.closeTime))
        : null,
      revisionHistoryAvailable: this.#fixture.revisionHistoryAvailable,
    });
  }

  async loadCandleHistory(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    validateRangeQuery(query);
    return immutableJsonClone(
      this.#matchingCandles(this.#fixture.candles, query).filter(
        (candle) => candle.openTime >= query.from && candle.openTime <= query.to,
      ),
    );
  }

  async loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]> {
    validateRangeQuery(query);
    if (!this.#fixture.revisionHistoryAvailable) return [];
    return immutableJsonClone(
      this.#matchingCandles(this.#fixture.candleRevisions, query).filter(
        (candle) => candle.openTime >= query.from && candle.openTime <= query.to,
      ),
    );
  }

  async loadPointInTimeVenueEvidence(
    query: ReplayEvidenceQuery,
  ): Promise<ExecutionVenueEligibilityObservation[]> {
    validateEvidenceQuery(query);
    return immutableJsonClone(
      this.#fixture.venueEvidence.filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.marketDataSource === query.source &&
          pointInTimeEvidenceOverlaps(item, query),
      ),
    );
  }

  async loadPointInTimeUniverseEvidence(
    query: ReplayEvidenceQuery,
  ): Promise<UniverseMembershipObservation[]> {
    validateEvidenceQuery(query);
    return immutableJsonClone(
      this.#fixture.universeEvidence.filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.source === query.source &&
          pointInTimeEvidenceOverlaps(item, query),
      ),
    );
  }

  async loadAnalysisStateHistory(
    query: ReplayEvidenceQuery,
  ): Promise<ReplayAnalysisStateObservation[]> {
    validateEvidenceQuery(query);
    return immutableJsonClone(
      this.#fixture.analysisStateHistory.filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.source === query.source &&
          item.knownAt >= query.from &&
          item.knownAt <= query.to,
      ),
    );
  }

  async loadKnownEvents(query: ReplayEvidenceQuery): Promise<ReplayKnownEvent[]> {
    validateEvidenceQuery(query);
    if (!this.#matchesFixture(query)) return [];
    return immutableJsonClone(
      this.#fixture.knownEvents.filter(
        (item) =>
          item.symbol.toUpperCase() === query.symbol.toUpperCase() &&
          item.source === query.source &&
          item.knownAt >= query.from &&
          item.knownAt <= query.to,
      ),
    );
  }

  async loadRadarEpisode(radarEpisodeId: string): Promise<RadarEpisode | null> {
    if (typeof radarEpisodeId !== "string" || !radarEpisodeId.trim()) {
      throw new TypeError("Radar episode id is required");
    }
    return immutableJsonClone(
      this.#fixture.radarEpisodes.find((item) => item.id === radarEpisodeId) ?? null,
    );
  }

  #matchingCandles(
    candles: readonly ReplayCandleRecord[],
    query: ReplayCoverageQuery,
  ): ReplayCandleRecord[] {
    if (!this.#matchesFixture(query)) return [];
    return candles.filter((item) => item.timeframe === query.timeframe);
  }

  #matchesFixture(query: { symbol: string; source: string }) {
    return (
      query.symbol.toUpperCase() === this.#fixture.symbol &&
      query.source === this.#fixture.source
    );
  }
}

function validateCandles(
  candles: readonly ReplayCandleRecord[],
  revisions: readonly ReplayCandleRecord[],
  symbol: string,
  source: string,
) {
  const baseByLogicalId = new Map<string, ReplayCandleRecord>();
  const byObservationId = new Map<string, ReplayCandleRecord>();
  const byLogicalIdAndKnownAt = new Map<string, ReplayCandleRecord>();

  for (const candle of [...candles, ...revisions]) {
    requireRecord(candle, "Replay candle");
    const timeframeSeconds = strictTimeframeToSeconds(candle.timeframe);
    if (
      candle.symbol.toUpperCase() !== symbol ||
      candle.source !== source ||
      !nonnegativeFinite(candle.openTime) ||
      candle.openTime % timeframeSeconds !== 0 ||
      candle.closeTime !== candle.openTime + timeframeSeconds ||
      !nonnegativeFinite(candle.knownAt) ||
      candle.knownAt < candle.closeTime ||
      candle.logicalCandleId !== replayCandleLogicalId(candle) ||
      candle.observationId !== replayCandleObservationId(candle) ||
      !validOhlc(candle) ||
      !nullableNonnegative(candle.vBase) ||
      !nullableNonnegative(candle.vQuote) ||
      !nullableNonnegativeInteger(candle.revision) ||
      !nullableNonnegative(candle.correctionPublishedAt) ||
      (candle.correctionPublishedAt != null &&
        (candle.correctionPublishedAt < candle.closeTime ||
          candle.correctionPublishedAt > candle.knownAt))
    ) {
      throw new Error(`Invalid replay candle ${candle.observationId ?? "<unknown>"}`);
    }
    assertNoConflict(byObservationId, candle.observationId, candle, "candle observation");
    assertNoConflict(
      byLogicalIdAndKnownAt,
      `${candle.logicalCandleId}\u0000${candle.knownAt}`,
      candle,
      "candle revision precedence",
    );
  }

  for (const candle of candles) {
    const existing = baseByLogicalId.get(candle.logicalCandleId);
    if (existing && existing.observationId !== candle.observationId) {
      throw new Error(`Base candle history contains revisions for ${candle.logicalCandleId}`);
    }
    baseByLogicalId.set(candle.logicalCandleId, candle);
  }
  for (const revision of revisions) {
    const base = baseByLogicalId.get(revision.logicalCandleId);
    if (!base) throw new Error(`Candle revision has no base record: ${revision.logicalCandleId}`);
    if (revision.knownAt <= base.knownAt) {
      throw new Error(`Candle revision must be published after its base record: ${revision.logicalCandleId}`);
    }
  }
}

function validateRadarEpisodes(
  episodes: readonly RadarEpisode[],
  symbol: string,
  source: string,
) {
  const byId = new Map<string, RadarEpisode>();
  for (const episode of episodes) {
    requireRecord(episode, "Radar episode");
    if (
      episode.schemaVersion !== RADAR_EPISODE_SCHEMA_VERSION ||
      episode.symbol.toUpperCase() !== symbol ||
      episode.source !== source ||
      episode.observationId !== radarEpisodeObservationId(episode)
    ) {
      throw new Error(`Invalid radar episode ${episode.id ?? "<unknown>"}`);
    }
    assertNoConflict(byId, episode.id, episode, "radar episode");
  }
}

function validateAnalysisStates(
  history: readonly ReplayAnalysisStateObservation[],
  symbol: string,
  source: string,
) {
  const byId = new Map<string, ReplayAnalysisStateObservation>();
  const byKnownAt = new Map<number, ReplayAnalysisStateObservation>();
  for (const item of history) {
    requireRecord(item, "Replay analysis state");
    if (
      item.schemaVersion !== REPLAY_ANALYSIS_STATE_SCHEMA_VERSION ||
      item.symbol.toUpperCase() !== symbol ||
      item.source !== source ||
      !nonnegativeFinite(item.knownAt) ||
      item.lifecycle.asOf == null ||
      item.lifecycle.asOf > item.knownAt ||
      item.id !== replayAnalysisStateObservationId(item)
    ) {
      throw new Error(`Invalid replay analysis state ${item.id ?? "<unknown>"}`);
    }
    assertNoConflict(byId, item.id, item, "analysis state observation");
    assertNoConflict(byKnownAt, item.knownAt, item, "analysis state knowledge time");
  }
}

function validateKnownEvents(
  events: readonly ReplayKnownEvent[],
  symbol: string,
  source: string,
) {
  const byId = new Map<string, ReplayKnownEvent>();
  for (const event of events) {
    requireRecord(event, "Replay known event");
    if (
      event.schemaVersion !== REPLAY_KNOWN_EVENT_SCHEMA_VERSION ||
      event.symbol.toUpperCase() !== symbol ||
      event.source !== source ||
      !nonnegativeFinite(event.eventTime) ||
      !nonnegativeFinite(event.knownAt) ||
      event.knownAt < event.eventTime ||
      event.id !== replayKnownEventId(event)
    ) {
      throw new Error(`Invalid replay known event ${event.id ?? "<unknown>"}`);
    }
    if (event.timeframe != null) strictTimeframeToSeconds(event.timeframe);
    assertNoConflict(byId, event.id, event, "known event");
  }
}

function validateVenueEvidence(
  history: readonly ExecutionVenueEligibilityObservation[],
  symbol: string,
  source: string,
) {
  const byId = new Map<string, ExecutionVenueEligibilityObservation>();
  for (const item of history) {
    requireRecord(item, "Venue evidence");
    if (
      item.schemaVersion !== EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION ||
      item.symbol.toUpperCase() !== symbol ||
      item.marketDataSource !== source ||
      item.observationId !== executionVenueEligibilityObservationId(item)
    ) {
      throw new Error(`Invalid execution-venue evidence ${item.observationId ?? "<unknown>"}`);
    }
    assertPointInTimeEvidence(item, "execution-venue evidence");
    assertNoConflict(byId, item.observationId, item, "execution-venue evidence");
  }
}

function validateUniverseEvidence(
  history: readonly UniverseMembershipObservation[],
  symbol: string,
  source: string,
) {
  const byId = new Map<string, UniverseMembershipObservation>();
  for (const item of history) {
    requireRecord(item, "Universe evidence");
    if (
      item.schemaVersion !== RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION ||
      item.symbol.toUpperCase() !== symbol ||
      item.source !== source ||
      item.observationId !== universeMembershipObservationId(item)
    ) {
      throw new Error(`Invalid universe evidence ${item.observationId ?? "<unknown>"}`);
    }
    assertPointInTimeEvidence(item, "universe evidence");
    assertNoConflict(byId, item.observationId, item, "universe evidence");
  }
}

function assertPointInTimeEvidence(
  item: { effectiveFrom: number; effectiveTo: number | null; knownAt: number },
  label: string,
) {
  if (
    !nonnegativeFinite(item.effectiveFrom) ||
    !nonnegativeFinite(item.knownAt) ||
    (item.effectiveTo != null &&
      (!nonnegativeFinite(item.effectiveTo) || item.effectiveTo < item.effectiveFrom))
  ) {
    throw new Error(`Invalid ${label} interval`);
  }
}

function pointInTimeEvidenceOverlaps(
  item: { effectiveFrom: number; effectiveTo: number | null; knownAt: number },
  query: ReplayEvidenceQuery,
) {
  return (
    item.knownAt <= query.to &&
    item.effectiveFrom <= query.to &&
    (item.effectiveTo == null || item.effectiveTo >= query.from)
  );
}

function validateCoverageQuery(query: ReplayCoverageQuery) {
  requireString(query.symbol, "Replay query symbol");
  requireString(query.source, "Replay query source");
  strictTimeframeToSeconds(query.timeframe);
}

function validateRangeQuery(query: ReplayCandleQuery) {
  validateCoverageQuery(query);
  validateOrderedRange(query.from, query.to);
}

function validateEvidenceQuery(query: ReplayEvidenceQuery) {
  requireString(query.symbol, "Replay evidence query symbol");
  requireString(query.source, "Replay evidence query source");
  validateOrderedRange(query.from, query.to);
}

function validateOrderedRange(from: number, to: number) {
  if (!nonnegativeFinite(from) || !nonnegativeFinite(to) || to < from) {
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
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

function comparePointInTimeEvidence(
  left: { effectiveFrom: number; knownAt: number; observationId: string },
  right: { effectiveFrom: number; knownAt: number; observationId: string },
) {
  return (
    left.effectiveFrom - right.effectiveFrom ||
    left.knownAt - right.knownAt ||
    left.observationId.localeCompare(right.observationId)
  );
}

function assertNoConflict<K, T>(
  values: Map<K, T>,
  key: K,
  value: T,
  label: string,
) {
  const existing = values.get(key);
  if (existing && canonicalSerialize(existing) !== canonicalSerialize(value)) {
    throw new Error(`Conflicting ${label}`);
  }
  values.set(key, value);
}

function validOhlc(candle: ReplayCandleRecord) {
  return (
    positiveFinite(candle.o) &&
    positiveFinite(candle.h) &&
    positiveFinite(candle.l) &&
    positiveFinite(candle.c) &&
    candle.h >= Math.max(candle.o, candle.c, candle.l) &&
    candle.l <= Math.min(candle.o, candle.c, candle.h)
  );
}

function positiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

function nullableNonnegative(value: number | null) {
  return value == null || (Number.isFinite(value) && value >= 0);
}

function nullableNonnegativeInteger(value: number | null) {
  return value == null || nonnegativeInteger(value);
}

function nonnegativeInteger(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

function nonnegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0;
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

function optionalArray(value: unknown, label: string): unknown[] {
  return value == null ? [] : requireArray(value, label);
}
