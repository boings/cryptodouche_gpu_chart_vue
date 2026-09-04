import { BYBIT_INTERVALS } from "./bybit.mjs";

export const HISTORICAL_ISSUE_CODES = Object.freeze([
  "MISSING_CANDLE_INTERVAL",
  "DUPLICATE_CANDLE",
  "INVALID_OHLC",
  "TARGET_REFERENCE_MISALIGNMENT",
  "INSUFFICIENT_ANALYSIS_PREROLL",
  "INSUFFICIENT_EXECUTION_POSTROLL",
  "FUNDING_DATA_UNAVAILABLE",
  "EXECUTION_RESOLUTION_UNAVAILABLE",
  "CANDLE_REVISION_HISTORY_UNAVAILABLE",
  "POINT_IN_TIME_UNIVERSE_UNKNOWN",
  "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN",
]);

export function validateSeries(candles, query) {
  const issues = [];
  const seconds = BYBIT_INTERVALS[query.timeframe]?.seconds;
  if (!seconds) throw new Error(`Unsupported validation timeframe ${query.timeframe}`);
  const seen = new Set();
  let previous = null;
  for (const candle of [...candles].sort((left, right) => left.openTime - right.openTime)) {
    if (seen.has(candle.openTime)) {
      issues.push(issue("DUPLICATE_CANDLE", "error", query, candle.openTime, "Duplicate candle open time"));
    }
    seen.add(candle.openTime);
    if (
      ![candle.o, candle.h, candle.l, candle.c].every((value) => Number.isFinite(value) && value > 0) ||
      candle.h < Math.max(candle.o, candle.c) ||
      candle.l > Math.min(candle.o, candle.c)
    ) {
      issues.push(issue("INVALID_OHLC", "error", query, candle.openTime, "OHLC values are non-positive or violate high/low containment"));
    }
    if (candle.openTime % seconds !== 0) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", "error", query, candle.openTime, "Candle is not aligned to its native interval"));
    }
    if (previous != null && candle.openTime !== previous + seconds) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", "error", query, previous + seconds, `Expected ${previous + seconds}, found ${candle.openTime}`));
    }
    previous = candle.openTime;
  }
  if (candles.length === 0) {
    issues.push(issue("MISSING_CANDLE_INTERVAL", "error", query, query.from, "No completed candles were returned"));
  } else {
    const expectedFirst = Math.ceil(query.from / seconds) * seconds;
    const expectedLast = Math.floor((query.to - seconds) / seconds) * seconds;
    const ordered = [...candles].sort((left, right) => left.openTime - right.openTime);
    if (ordered[0].openTime !== expectedFirst) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", "error", query, expectedFirst, `Expected range to begin at ${expectedFirst}`));
    }
    if (ordered.at(-1).openTime !== expectedLast) {
      issues.push(issue("MISSING_CANDLE_INTERVAL", "error", query, expectedLast, `Expected range to end at ${expectedLast}`));
    }
  }
  return dedupeIssues(issues);
}

export function validateAlignment(target, reference, timeframe, from, to) {
  const targetTimes = new Set(target.filter((item) => item.openTime >= from && item.closeTime <= to).map((item) => item.openTime));
  const referenceTimes = new Set(reference.filter((item) => item.openTime >= from && item.closeTime <= to).map((item) => item.openTime));
  const mismatches = [...new Set([...targetTimes, ...referenceTimes])]
    .filter((time) => targetTimes.has(time) !== referenceTimes.has(time))
    .sort((left, right) => left - right);
  return mismatches.length === 0 ? [] : [{
    code: "TARGET_REFERENCE_MISALIGNMENT",
    severity: "error",
    timeframe,
    at: mismatches[0],
    count: mismatches.length,
    message: `Target and BTCUSDT do not share ${mismatches.length} completed ${timeframe} intervals`,
  }];
}

export function validateCaseCoverage({
  detectedAt,
  horizonAsOf,
  analysisPreroll,
  requiredAnalysisPrerollByTimeframe = {},
  targetByTimeframe,
  referenceByTimeframe,
  executionCandles,
}) {
  const issues = [];
  for (const timeframe of ["15m", "1h", "4h", "1d"]) {
    const target = targetByTimeframe[timeframe] ?? [];
    const reference = referenceByTimeframe[timeframe] ?? [];
    const seconds = BYBIT_INTERVALS[timeframe].seconds;
    const requiredStart = detectedAt - Math.max(
      analysisPreroll,
      requiredAnalysisPrerollByTimeframe[timeframe] ?? 0,
    );
    const expectedStart = Math.ceil(requiredStart / seconds) * seconds;
    const targetStart = target.find((item) => item.openTime >= expectedStart)?.openTime;
    const referenceStart = reference.find((item) => item.openTime >= expectedStart)?.openTime;
    if (targetStart !== expectedStart || referenceStart !== expectedStart) {
      issues.push({
        code: "INSUFFICIENT_ANALYSIS_PREROLL",
        severity: "error",
        timeframe,
        at: expectedStart,
        message: `Analysis requires completed target and BTCUSDT coverage from ${expectedStart}`,
      });
    }
    issues.push(...validateAlignment(target, reference, timeframe, expectedStart, horizonAsOf));
  }
  const finalExecutionClose = executionCandles.at(-1)?.closeTime ?? null;
  if (finalExecutionClose == null || finalExecutionClose < horizonAsOf) {
    issues.push({
      code: "INSUFFICIENT_EXECUTION_POSTROLL",
      severity: "error",
      timeframe: "1m",
      at: horizonAsOf,
      message: "The 1m execution series does not reach the case horizon",
    });
  }
  if (executionCandles.length === 0) {
    issues.push({
      code: "EXECUTION_RESOLUTION_UNAVAILABLE",
      severity: "error",
      timeframe: "1m",
      at: detectedAt,
      message: "Native Bybit 1m execution candles are unavailable",
    });
  }
  return dedupeIssues(issues);
}

export function standingResearchWarnings() {
  return [
    {
      code: "FUNDING_DATA_UNAVAILABLE",
      severity: "warning",
      message: "No point-in-time historical funding observations are included; net P/L must remain incomplete.",
    },
    {
      code: "CANDLE_REVISION_HISTORY_UNAVAILABLE",
      severity: "warning",
      message: "Bybit kline snapshots expose final observed candles, not their historical revision publication sequence.",
    },
    {
      code: "POINT_IN_TIME_UNIVERSE_UNKNOWN",
      severity: "warning",
      message: "The universe is an explicit symbol list, not reconstructed point-in-time exchange membership; survivor bias is possible.",
    },
    {
      code: "POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN",
      severity: "warning",
      message: "Phemex listing, rules, fees, funding, and tradability are unknown at the historical cutoff.",
    },
  ];
}

export function hasErrors(issues) {
  return issues.some((item) => item.severity === "error");
}

function issue(code, severity, query, at, message) {
  return { code, severity, symbol: query.symbol, timeframe: query.timeframe, at, message };
}

function dedupeIssues(issues) {
  const keyed = new Map();
  for (const item of issues) {
    const key = [item.code, item.symbol ?? "", item.timeframe ?? "", item.at ?? "", item.message].join("\u0000");
    keyed.set(key, item);
  }
  return [...keyed.values()].sort((left, right) =>
    left.code.localeCompare(right.code) ||
    String(left.symbol ?? "").localeCompare(String(right.symbol ?? "")) ||
    String(left.timeframe ?? "").localeCompare(String(right.timeframe ?? "")) ||
    Number(left.at ?? 0) - Number(right.at ?? 0));
}
