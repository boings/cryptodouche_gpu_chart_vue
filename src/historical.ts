import { strictTimeframeToSeconds } from "./data";
import { canonicalHash, immutableJsonClone } from "./serialization";

export const HISTORICAL_CANDLE_SCHEMA_VERSION = "historical-candle.1" as const;
export const HISTORICAL_VALIDATION_SCHEMA_VERSION = "historical-validation.1" as const;
export const HISTORICAL_AGGREGATION_SCHEMA_VERSION = "historical-aggregation.1" as const;

export type HistoricalAnalysisTimeframe = "15m" | "1h" | "4h" | "1d";
export type HistoricalExecutionSimulationMode =
  | "SameVenueHistoricalSimulation"
  | "ResearchProxyExecution";
export type HistoricalUniverseProvenanceMode =
  | "PointInTimeUniverse"
  | "CurrentUniverseResearchAssumption"
  | "ExplicitSymbolList";
export type HistoricalProvenanceStatus = "verified" | "researchAssumption" | "unknown";

export interface HistoricalSourceRef {
  id: string;
  venue: string;
  instrumentType: "linearUsdtPerpetual";
  symbol: string;
  timezone: "UTC";
  intervalBoundaries: "utcEpoch";
  candleConstruction: "canonical1m" | "aggregatedCanonical1m" | "exchangeNative";
}

export interface HistoricalVenueProvenance {
  analysisSource: HistoricalSourceRef;
  referenceSource: HistoricalSourceRef;
  executionPriceDataSource: HistoricalSourceRef | null;
  intendedExecutionVenue: {
    venue: string;
    status: HistoricalProvenanceStatus;
    evidence: string | null;
  };
  executionSimulationMode: HistoricalExecutionSimulationMode;
}

export interface HistoricalUniverseProvenance {
  mode: HistoricalUniverseProvenanceMode;
  status: HistoricalProvenanceStatus;
  asOf: number | null;
  symbols: string[];
  evidence: string | null;
}

export interface HistoricalFundingObservation {
  venue: string;
  symbol: string;
  timestamp: number;
  rate: number;
  knownAt: number;
}

export interface HistoricalCandleInput {
  source: string;
  symbol: string;
  timeframe: string;
  openTime: number;
  closeTime: number;
  knownAt?: number;
  o: number;
  h: number;
  l: number;
  c: number;
  volumeBase?: number | null;
  volumeQuote?: number | null;
  revision?: number;
  active?: boolean;
}

export interface CanonicalHistoricalCandle {
  schemaVersion: typeof HISTORICAL_CANDLE_SCHEMA_VERSION;
  logicalId: string;
  source: string;
  symbol: string;
  timeframe: string;
  openTime: number;
  closeTime: number;
  knownAt: number;
  o: number;
  h: number;
  l: number;
  c: number;
  volumeBase: number | null;
  volumeQuote: number | null;
  revision: number;
}

export type HistoricalDataIssueCode =
  | "MISSING_CANDLE_INTERVAL"
  | "DUPLICATE_CANDLE"
  | "INVALID_OHLC"
  | "TARGET_REFERENCE_MISALIGNMENT"
  | "INSUFFICIENT_ANALYSIS_PREROLL"
  | "INSUFFICIENT_DISPLAY_PREROLL"
  | "INSUFFICIENT_EXECUTION_POSTROLL"
  | "FUNDING_DATA_UNAVAILABLE"
  | "EXECUTION_RESOLUTION_UNAVAILABLE"
  | "CANDLE_REVISION_HISTORY_UNAVAILABLE"
  | "POINT_IN_TIME_UNIVERSE_UNKNOWN"
  | "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN"
  | "INVALID_CANDLE_INTERVAL"
  | "INCOMPLETE_CANDLE"
  | "NEGATIVE_VOLUME"
  | "NON_MONOTONIC_CANDLES"
  | "SOURCE_MISMATCH"
  | "SYMBOL_MISMATCH"
  | "FUNDING_SOURCE_MISMATCH"
  | "RESEARCH_PROXY_EXECUTION";

export interface HistoricalDataIssue {
  code: HistoricalDataIssueCode;
  severity: "error" | "warning";
  scope: "target" | "reference" | "execution" | "funding" | "universe" | "venue" | "bundle";
  message: string;
  openTime: number | null;
  expected: string | number | null;
  actual: string | number | null;
}

export interface HistoricalNormalizationInput {
  candles: readonly HistoricalCandleInput[];
  source: string;
  symbol: string;
  timeframe: string;
  completedThrough: number;
  scope?: "target" | "reference" | "execution";
}

export interface HistoricalNormalizationResult {
  schemaVersion: typeof HISTORICAL_VALIDATION_SCHEMA_VERSION;
  candles: CanonicalHistoricalCandle[];
  issues: HistoricalDataIssue[];
  valid: boolean;
  rawFingerprint: string;
  fingerprint: string;
}

export interface HistoricalAggregationResult {
  schemaVersion: typeof HISTORICAL_AGGREGATION_SCHEMA_VERSION;
  sourceTimeframe: "1m";
  targetTimeframe: HistoricalAnalysisTimeframe;
  candles: CanonicalHistoricalCandle[];
  issues: HistoricalDataIssue[];
  valid: boolean;
  sourceFingerprint: string;
  fingerprint: string;
}

export interface HistoricalValidationRequirements {
  decisionTime: number;
  analysisPreRollSeconds: number;
  displayPreRollSeconds: number;
  executionPostRollSeconds: number;
  executionTimeframe: string;
  fundingRequired: boolean;
  revisionHistoryRequired: boolean;
  pointInTimeUniverseRequired: boolean;
  pointInTimeExecutionVenueRequired: boolean;
  requiredAnalysisTimeframes: readonly string[];
  requiredFundingTimestamps?: readonly number[];
  permittedWarningCodes?: readonly HistoricalDataIssueCode[];
}

export interface HistoricalCaseValidationInput {
  targetCandles: readonly CanonicalHistoricalCandle[];
  referenceCandles: readonly CanonicalHistoricalCandle[];
  executionCandles: readonly CanonicalHistoricalCandle[];
  fundingObservations: readonly HistoricalFundingObservation[];
  targetRevisionHistoryAvailable: boolean;
  referenceRevisionHistoryAvailable: boolean;
  provenance: HistoricalVenueProvenance;
  universe: HistoricalUniverseProvenance;
  requirements: HistoricalValidationRequirements;
}

export interface HistoricalCaseValidationResult {
  schemaVersion: typeof HISTORICAL_VALIDATION_SCHEMA_VERSION;
  valid: boolean;
  issues: HistoricalDataIssue[];
  targetFingerprint: string;
  referenceFingerprint: string;
  executionFingerprint: string;
  bundleFingerprint: string;
}

const MINUTE = 60;
const HARD_ERROR_CODES = new Set<HistoricalDataIssueCode>([
  "MISSING_CANDLE_INTERVAL",
  "DUPLICATE_CANDLE",
  "INVALID_OHLC",
  "TARGET_REFERENCE_MISALIGNMENT",
  "INSUFFICIENT_ANALYSIS_PREROLL",
  "INSUFFICIENT_DISPLAY_PREROLL",
  "INSUFFICIENT_EXECUTION_POSTROLL",
  "INVALID_CANDLE_INTERVAL",
  "INCOMPLETE_CANDLE",
  "NEGATIVE_VOLUME",
  "NON_MONOTONIC_CANDLES",
  "SOURCE_MISMATCH",
  "SYMBOL_MISMATCH",
]);

export function historicalCandleLogicalId(input: {
  source: string;
  symbol: string;
  timeframe: string;
  openTime: number;
}): string {
  return `historical-candle:${input.source}:${input.symbol.toUpperCase()}:${input.timeframe}:${input.openTime}`;
}

export function historicalCandlesFingerprint(
  candles: readonly CanonicalHistoricalCandle[],
): string {
  return canonicalHash(canonicalCandleOrder(candles));
}

export function normalizeCompletedUtcCandles(
  input: HistoricalNormalizationInput,
): HistoricalNormalizationResult {
  const timeframeSeconds = strictTimeframeToSeconds(input.timeframe);
  const scope = input.scope ?? "target";
  const issues: HistoricalDataIssue[] = [];
  const normalized: CanonicalHistoricalCandle[] = [];
  let previousInputOpenTime = Number.NEGATIVE_INFINITY;

  for (const candle of input.candles) {
    if (candle.openTime < previousInputOpenTime) {
      issues.push(issue("NON_MONOTONIC_CANDLES", scope, "Input candles are not monotonic", candle.openTime));
    }
    previousInputOpenTime = candle.openTime;
    if (candle.source !== input.source) {
      issues.push(issue("SOURCE_MISMATCH", scope, "Candle source does not match the requested source", candle.openTime, input.source, candle.source));
      continue;
    }
    if (candle.symbol.toUpperCase() !== input.symbol.toUpperCase()) {
      issues.push(issue("SYMBOL_MISMATCH", scope, "Candle symbol does not match the requested symbol", candle.openTime, input.symbol.toUpperCase(), candle.symbol.toUpperCase()));
      continue;
    }
    if (
      candle.timeframe !== input.timeframe ||
      !isIntegerTimestamp(candle.openTime) ||
      !isIntegerTimestamp(candle.closeTime) ||
      candle.openTime % timeframeSeconds !== 0 ||
      candle.closeTime !== candle.openTime + timeframeSeconds
    ) {
      issues.push(issue("INVALID_CANDLE_INTERVAL", scope, "Candle must use explicit UTC-aligned open and close times", candle.openTime, timeframeSeconds, candle.closeTime - candle.openTime));
      continue;
    }
    const knownAt = candle.knownAt ?? candle.closeTime;
    if (candle.closeTime > input.completedThrough || knownAt > input.completedThrough || knownAt < candle.closeTime) {
      issues.push(issue("INCOMPLETE_CANDLE", scope, "Candle is not completed and known by the requested cutoff", candle.openTime, input.completedThrough, knownAt));
      continue;
    }
    if (!validOhlc(candle)) {
      issues.push(issue("INVALID_OHLC", scope, "OHLC values must be positive finite values contained by high and low", candle.openTime));
      continue;
    }
    if (!validVolume(candle.volumeBase) || !validVolume(candle.volumeQuote)) {
      issues.push(issue("NEGATIVE_VOLUME", scope, "Candle volume must be finite and non-negative when supplied", candle.openTime));
      continue;
    }
    if (candle.revision != null && (!Number.isInteger(candle.revision) || candle.revision < 0)) {
      issues.push(issue("INVALID_CANDLE_INTERVAL", scope, "Candle revision must be a non-negative integer", candle.openTime));
      continue;
    }
    if (candle.active === false) continue;
    normalized.push({
      schemaVersion: HISTORICAL_CANDLE_SCHEMA_VERSION,
      logicalId: historicalCandleLogicalId(candle),
      source: candle.source,
      symbol: candle.symbol.toUpperCase(),
      timeframe: candle.timeframe,
      openTime: candle.openTime,
      closeTime: candle.closeTime,
      knownAt,
      o: candle.o,
      h: candle.h,
      l: candle.l,
      c: candle.c,
      volumeBase: candle.volumeBase ?? null,
      volumeQuote: candle.volumeQuote ?? null,
      revision: candle.revision ?? 0,
    });
  }

  const grouped = new Map<string, CanonicalHistoricalCandle[]>();
  for (const candle of normalized) {
    const group = grouped.get(candle.logicalId) ?? [];
    group.push(candle);
    grouped.set(candle.logicalId, group);
  }
  const unique: CanonicalHistoricalCandle[] = [];
  for (const group of grouped.values()) {
    if (group.length > 1) {
      const first = group[0];
      issues.push(issue("DUPLICATE_CANDLE", scope, "More than one active candle has the same logical identity", first.openTime, 1, group.length));
      continue;
    }
    unique.push(group[0]);
  }
  unique.sort(compareCandles);
  issues.push(...missingIntervalIssues(unique, timeframeSeconds, scope));
  return freezeValidationResult(unique, issues, canonicalHash(canonicalRawCandleOrder(input.candles)));
}

export function aggregateCanonicalOneMinuteCandles(
  candles: readonly CanonicalHistoricalCandle[],
  targetTimeframe: HistoricalAnalysisTimeframe,
): HistoricalAggregationResult {
  const targetSeconds = strictTimeframeToSeconds(targetTimeframe);
  const sourceFingerprint = historicalCandlesFingerprint(candles);
  const issues = validateCanonicalSeries(candles, "target", "1m");
  const byBucket = new Map<number, CanonicalHistoricalCandle[]>();
  const baseline = canonicalCandleOrder(candles)[0];

  for (const candle of canonicalCandleOrder(candles)) {
    if (candle.timeframe !== "1m") continue;
    if (baseline && candle.source !== baseline.source) {
      issues.push(issue("SOURCE_MISMATCH", "target", "One-minute aggregation cannot mix sources", candle.openTime, baseline.source, candle.source));
      continue;
    }
    if (baseline && candle.symbol !== baseline.symbol) {
      issues.push(issue("SYMBOL_MISMATCH", "target", "One-minute aggregation cannot mix symbols", candle.openTime, baseline.symbol, candle.symbol));
      continue;
    }
    const bucket = Math.floor(candle.openTime / targetSeconds) * targetSeconds;
    const group = byBucket.get(bucket) ?? [];
    group.push(candle);
    byBucket.set(bucket, group);
  }

  const aggregated: CanonicalHistoricalCandle[] = [];
  const expectedCount = targetSeconds / MINUTE;
  for (const [openTime, group] of [...byBucket].sort(([left], [right]) => left - right)) {
    const ordered = group.sort(compareCandles);
    const complete =
      ordered.length === expectedCount &&
      ordered.every((candle, index) => candle.openTime === openTime + index * MINUTE);
    if (!complete) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", "target", `Incomplete ${targetTimeframe} aggregation bucket; no candle was synthesized`, openTime, expectedCount, ordered.length));
      continue;
    }
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const volumeBase = sumNullable(ordered.map((candle) => candle.volumeBase));
    const volumeQuote = sumNullable(ordered.map((candle) => candle.volumeQuote));
    aggregated.push({
      schemaVersion: HISTORICAL_CANDLE_SCHEMA_VERSION,
      logicalId: historicalCandleLogicalId({ source: first.source, symbol: first.symbol, timeframe: targetTimeframe, openTime }),
      source: first.source,
      symbol: first.symbol,
      timeframe: targetTimeframe,
      openTime,
      closeTime: openTime + targetSeconds,
      knownAt: Math.max(...ordered.map((candle) => candle.knownAt)),
      o: first.o,
      h: Math.max(...ordered.map((candle) => candle.h)),
      l: Math.min(...ordered.map((candle) => candle.l)),
      c: last.c,
      volumeBase,
      volumeQuote,
      revision: Math.max(...ordered.map((candle) => candle.revision)),
    });
  }
  const sortedIssues = sortIssues(issues);
  const definition = {
    schemaVersion: HISTORICAL_AGGREGATION_SCHEMA_VERSION,
    sourceTimeframe: "1m" as const,
    targetTimeframe,
    candles: aggregated,
    issues: sortedIssues,
    valid: !sortedIssues.some((item) => item.severity === "error"),
    sourceFingerprint,
  };
  return immutableJsonClone({ ...definition, fingerprint: canonicalHash(definition) });
}

export function validateHistoricalCase(
  input: HistoricalCaseValidationInput,
): HistoricalCaseValidationResult {
  const permitted = new Set(input.requirements.permittedWarningCodes ?? []);
  const issues = [
    ...validateCanonicalSeries(input.targetCandles, "target"),
    ...validateCanonicalSeries(input.referenceCandles, "reference"),
    ...validateCanonicalSeries(input.executionCandles, "execution", input.requirements.executionTimeframe),
  ];
  validateSourceAndSymbol(input, issues);
  validateAlignment(input, issues);
  validateCoverage(input, issues);
  validateProvenance(input, issues);
  validateFunding(input, issues);

  const normalizedIssues = sortIssues(issues.map((item) =>
    permitted.has(item.code) && !HARD_ERROR_CODES.has(item.code)
      ? { ...item, severity: "warning" as const }
      : item,
  ));
  const targetFingerprint = historicalCandlesFingerprint(input.targetCandles);
  const referenceFingerprint = historicalCandlesFingerprint(input.referenceCandles);
  const executionFingerprint = historicalCandlesFingerprint(input.executionCandles);
  const definition = {
    schemaVersion: HISTORICAL_VALIDATION_SCHEMA_VERSION,
    valid: !normalizedIssues.some((item) => item.severity === "error"),
    issues: normalizedIssues,
    targetFingerprint,
    referenceFingerprint,
    executionFingerprint,
  };
  return immutableJsonClone({
    ...definition,
    bundleFingerprint: canonicalHash({
      ...definition,
      provenance: input.provenance,
      universe: input.universe,
      requirements: input.requirements,
      fundingObservations: [...input.fundingObservations].sort((left, right) => left.timestamp - right.timestamp),
    }),
  });
}

function validateCanonicalSeries(
  candles: readonly CanonicalHistoricalCandle[],
  scope: HistoricalDataIssue["scope"],
  expectedTimeframe?: string,
): HistoricalDataIssue[] {
  const issues: HistoricalDataIssue[] = [];
  let previousOpen = Number.NEGATIVE_INFINITY;
  const logicalIds = new Set<string>();
  for (const candle of candles) {
    let timeframeSeconds: number;
    try {
      timeframeSeconds = strictTimeframeToSeconds(candle.timeframe);
    } catch {
      issues.push(issue("INVALID_CANDLE_INTERVAL", scope, "Candle timeframe is invalid", candle.openTime));
      continue;
    }
    if (candle.openTime < previousOpen) {
      issues.push(issue("NON_MONOTONIC_CANDLES", scope, "Candles are not in monotonic order", candle.openTime));
    }
    previousOpen = candle.openTime;
    if (logicalIds.has(candle.logicalId)) {
      issues.push(issue("DUPLICATE_CANDLE", scope, "Duplicate canonical logical candle identity", candle.openTime));
    }
    logicalIds.add(candle.logicalId);
    if (
      (expectedTimeframe != null && candle.timeframe !== expectedTimeframe) ||
      candle.openTime % timeframeSeconds !== 0 ||
      candle.closeTime !== candle.openTime + timeframeSeconds ||
      candle.knownAt < candle.closeTime
    ) {
      issues.push(issue("INVALID_CANDLE_INTERVAL", scope, "Canonical candle interval or completion time is invalid", candle.openTime));
    }
    if (!validOhlc(candle)) issues.push(issue("INVALID_OHLC", scope, "Canonical candle violates OHLC invariants", candle.openTime));
    if (!validVolume(candle.volumeBase) || !validVolume(candle.volumeQuote)) issues.push(issue("NEGATIVE_VOLUME", scope, "Canonical candle volume is invalid", candle.openTime));
  }
  if (candles.length) {
    const firstTimeframe = candles[0].timeframe;
    if (candles.every((candle) => candle.timeframe === firstTimeframe)) {
      try {
        issues.push(...missingIntervalIssues(candles, strictTimeframeToSeconds(firstTimeframe), scope));
      } catch {
        // The invalid timeframe was recorded above.
      }
    }
  }
  return issues;
}

function validateSourceAndSymbol(input: HistoricalCaseValidationInput, issues: HistoricalDataIssue[]) {
  checkSeriesIdentity(input.targetCandles, input.provenance.analysisSource, "target", issues);
  checkSeriesIdentity(input.referenceCandles, input.provenance.referenceSource, "reference", issues);
  if (input.provenance.executionPriceDataSource) {
    checkSeriesIdentity(input.executionCandles, input.provenance.executionPriceDataSource, "execution", issues);
  }
}

function checkSeriesIdentity(
  candles: readonly CanonicalHistoricalCandle[],
  source: HistoricalSourceRef,
  scope: HistoricalDataIssue["scope"],
  issues: HistoricalDataIssue[],
) {
  for (const candle of candles) {
    if (candle.source !== source.id) issues.push(issue("SOURCE_MISMATCH", scope, "Candle source differs from provenance", candle.openTime, source.id, candle.source));
    if (candle.symbol !== source.symbol.toUpperCase()) issues.push(issue("SYMBOL_MISMATCH", scope, "Candle symbol differs from provenance", candle.openTime, source.symbol.toUpperCase(), candle.symbol));
  }
}

function validateAlignment(input: HistoricalCaseValidationInput, issues: HistoricalDataIssue[]) {
  const start = input.requirements.decisionTime - input.requirements.analysisPreRollSeconds;
  const end = input.requirements.decisionTime;
  const target = new Set(input.targetCandles.filter((candle) => candle.openTime >= start && candle.closeTime <= end).map((candle) => `${candle.timeframe}:${candle.openTime}`));
  const reference = new Set(input.referenceCandles.filter((candle) => candle.openTime >= start && candle.closeTime <= end).map((candle) => `${candle.timeframe}:${candle.openTime}`));
  for (const identity of new Set([...target, ...reference])) {
    if (target.has(identity) !== reference.has(identity)) {
      const openTime = Number(identity.slice(identity.indexOf(":") + 1));
      issues.push(issue("TARGET_REFERENCE_MISALIGNMENT", "bundle", "Target and reference completed candles do not align", openTime));
    }
  }
}

function validateCoverage(input: HistoricalCaseValidationInput, issues: HistoricalDataIssue[]) {
  const { decisionTime, analysisPreRollSeconds, displayPreRollSeconds, executionPostRollSeconds, executionTimeframe } = input.requirements;
  const analysisTimeframes = [...new Set(input.requirements.requiredAnalysisTimeframes)];
  if (!analysisTimeframes.length) {
    issues.push(issue("INSUFFICIENT_ANALYSIS_PREROLL", "bundle", "At least one required analysis timeframe must be declared"));
  }
  for (const timeframe of analysisTimeframes) {
    const target = input.targetCandles.filter((candle) => candle.timeframe === timeframe);
    const reference = input.referenceCandles.filter((candle) => candle.timeframe === timeframe);
    validateAnalysisSeriesCoverage(target, timeframe, "target", decisionTime, analysisPreRollSeconds, issues);
    validateAnalysisSeriesCoverage(reference, timeframe, "reference", decisionTime, analysisPreRollSeconds, issues);
  }
  const earliestTarget = minimumOpenTime(input.targetCandles);
  if (earliestTarget > decisionTime - displayPreRollSeconds) issues.push(issue("INSUFFICIENT_DISPLAY_PREROLL", "target", "Target history does not cover the required display pre-roll", null, decisionTime - displayPreRollSeconds, Number.isFinite(earliestTarget) ? earliestTarget : null));
  const executionSeconds = strictTimeframeToSeconds(executionTimeframe);
  const latestExecutionClose = maximumCloseTime(input.executionCandles);
  if (latestExecutionClose < decisionTime + executionPostRollSeconds) issues.push(issue("INSUFFICIENT_EXECUTION_POSTROLL", "execution", "Execution history does not cover the required future horizon", null, decisionTime + executionPostRollSeconds, Number.isFinite(latestExecutionClose) ? latestExecutionClose : null));
  if (!input.executionCandles.length || input.executionCandles.some((candle) => candle.timeframe !== executionTimeframe || candle.closeTime - candle.openTime !== executionSeconds)) {
    issues.push(issue("EXECUTION_RESOLUTION_UNAVAILABLE", "execution", `Required ${executionTimeframe} execution candles are unavailable`));
  }
}

function validateProvenance(input: HistoricalCaseValidationInput, issues: HistoricalDataIssue[]) {
  if (input.requirements.revisionHistoryRequired && (!input.targetRevisionHistoryAvailable || !input.referenceRevisionHistoryAvailable)) {
    issues.push(issue("CANDLE_REVISION_HISTORY_UNAVAILABLE", "bundle", "Point-in-time candle revision history is unavailable"));
  }
  if (input.requirements.pointInTimeUniverseRequired && (input.universe.mode !== "PointInTimeUniverse" || input.universe.status !== "verified")) {
    issues.push(issue("POINT_IN_TIME_UNIVERSE_UNKNOWN", "universe", "Point-in-time universe membership is not verified"));
  }
  if (input.requirements.pointInTimeExecutionVenueRequired && input.provenance.intendedExecutionVenue.status !== "verified") {
    issues.push(issue("POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN", "venue", "Point-in-time intended execution venue availability is not verified"));
  }
  if (input.provenance.executionSimulationMode === "ResearchProxyExecution") {
    issues.push(issue("RESEARCH_PROXY_EXECUTION", "venue", "Execution prices are a research proxy and are not fills from the intended venue"));
  } else if (input.provenance.executionPriceDataSource?.venue !== input.provenance.intendedExecutionVenue.venue) {
    issues.push(issue("SOURCE_MISMATCH", "venue", "Same-venue simulation requires matching price-data and intended venues"));
  }
}

function validateFunding(input: HistoricalCaseValidationInput, issues: HistoricalDataIssue[]) {
  if (!input.requirements.fundingRequired) return;
  const executionSource = input.provenance.executionPriceDataSource;
  const matching = executionSource == null ? [] : input.fundingObservations.filter((observation) =>
    observation.venue === executionSource.venue &&
    observation.symbol.toUpperCase() === executionSource.symbol.toUpperCase() &&
    observation.timestamp >= input.requirements.decisionTime &&
    observation.timestamp <= input.requirements.decisionTime + input.requirements.executionPostRollSeconds &&
    observation.knownAt >= observation.timestamp &&
    Number.isFinite(observation.rate),
  );
  const requiredTimestamps = input.requirements.requiredFundingTimestamps ?? [];
  if (!matching.length || requiredTimestamps.some((timestamp) => !matching.some((observation) => observation.timestamp === timestamp))) {
    issues.push(issue("FUNDING_DATA_UNAVAILABLE", "funding", "Funding data for the simulated execution instrument is unavailable or incomplete"));
  }
  if (input.fundingObservations.some((observation) => executionSource != null && observation.venue !== executionSource.venue)) {
    issues.push(issue("FUNDING_SOURCE_MISMATCH", "funding", "Funding observations from another venue cannot be applied to this simulation"));
  }
}

function freezeValidationResult(
  candles: CanonicalHistoricalCandle[],
  issues: HistoricalDataIssue[],
  rawFingerprint: string,
): HistoricalNormalizationResult {
  const sortedIssues = sortIssues(issues);
  const definition = {
    schemaVersion: HISTORICAL_VALIDATION_SCHEMA_VERSION,
    candles,
    issues: sortedIssues,
    valid: !sortedIssues.some((item) => item.severity === "error"),
    rawFingerprint,
  };
  return immutableJsonClone({ ...definition, fingerprint: canonicalHash(definition) });
}

function missingIntervalIssues(
  candles: readonly CanonicalHistoricalCandle[],
  timeframeSeconds: number,
  scope: HistoricalDataIssue["scope"],
): HistoricalDataIssue[] {
  const ordered = canonicalCandleOrder(candles);
  const issues: HistoricalDataIssue[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const expected = ordered[index - 1].openTime + timeframeSeconds;
    if (ordered[index].openTime !== expected) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", scope, "Candle sequence has a gap; no interpolation was performed", expected, expected, ordered[index].openTime));
    }
  }
  return issues;
}

function canonicalCandleOrder(candles: readonly CanonicalHistoricalCandle[]) {
  return [...candles].sort(compareCandles);
}

function canonicalRawCandleOrder(candles: readonly HistoricalCandleInput[]) {
  return [...candles].sort((left, right) =>
    left.openTime - right.openTime ||
    (left.knownAt ?? left.closeTime) - (right.knownAt ?? right.closeTime) ||
    (left.revision ?? 0) - (right.revision ?? 0) ||
    canonicalHash(left).localeCompare(canonicalHash(right)),
  );
}

function validateAnalysisSeriesCoverage(
  candles: readonly CanonicalHistoricalCandle[],
  timeframe: string,
  scope: "target" | "reference",
  decisionTime: number,
  preRollSeconds: number,
  issues: HistoricalDataIssue[],
) {
  const earliest = minimumOpenTime(candles);
  const latest = maximumCloseTime(candles);
  if (earliest > decisionTime - preRollSeconds || latest < decisionTime) {
    issues.push(issue(
      "INSUFFICIENT_ANALYSIS_PREROLL",
      scope,
      `${timeframe} history does not cover the required analysis pre-roll through the decision time`,
      null,
      decisionTime - preRollSeconds,
      Number.isFinite(earliest) ? earliest : null,
    ));
  }
}

function minimumOpenTime(candles: readonly CanonicalHistoricalCandle[]) {
  return candles.length ? Math.min(...candles.map((candle) => candle.openTime)) : Number.POSITIVE_INFINITY;
}

function maximumCloseTime(candles: readonly CanonicalHistoricalCandle[]) {
  return candles.length ? Math.max(...candles.map((candle) => candle.closeTime)) : Number.NEGATIVE_INFINITY;
}

function compareCandles(left: CanonicalHistoricalCandle, right: CanonicalHistoricalCandle) {
  return left.openTime - right.openTime ||
    left.knownAt - right.knownAt ||
    left.logicalId.localeCompare(right.logicalId) ||
    canonicalHash(left).localeCompare(canonicalHash(right));
}

function sortIssues(issues: HistoricalDataIssue[]) {
  return [...issues].sort((left, right) =>
    (left.openTime ?? -1) - (right.openTime ?? -1) ||
    left.code.localeCompare(right.code) ||
    left.scope.localeCompare(right.scope) ||
    canonicalHash(left).localeCompare(canonicalHash(right)),
  );
}

function validOhlc(candle: Pick<HistoricalCandleInput, "o" | "h" | "l" | "c">) {
  return [candle.o, candle.h, candle.l, candle.c].every((value) => Number.isFinite(value) && value > 0) &&
    candle.h >= Math.max(candle.o, candle.c, candle.l) &&
    candle.l <= Math.min(candle.o, candle.c, candle.h);
}

function validVolume(value: number | null | undefined) {
  return value == null || (Number.isFinite(value) && value >= 0);
}

function isIntegerTimestamp(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

function sumNullable(values: readonly (number | null)[]) {
  return values.every((value) => value != null)
    ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
}

function issue(
  code: HistoricalDataIssueCode,
  scope: HistoricalDataIssue["scope"],
  message: string,
  openTime: number | null = null,
  expected: string | number | null = null,
  actual: string | number | null = null,
): HistoricalDataIssue {
  return { code, severity: "error", scope, message, openTime, expected, actual };
}
