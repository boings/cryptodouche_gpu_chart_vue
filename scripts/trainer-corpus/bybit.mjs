import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, hashSuffix, sha256 } from "./canonical.mjs";

export const BYBIT_INTERVALS = Object.freeze({
  "1m": { native: "1", seconds: 60 },
  "15m": { native: "15", seconds: 900 },
  "1h": { native: "60", seconds: 3_600 },
  "4h": { native: "240", seconds: 14_400 },
  "1d": { native: "D", seconds: 86_400 },
});

const ENDPOINT = "https://api.bybit.com/v5/market/kline";

export async function loadBybitSnapshot(query, options = {}) {
  validateQuery(query);
  const directory = path.resolve(options.snapshotDir);
  const prefix = snapshotPrefix(query);
  const existing = await findSnapshots(directory, prefix);
  if (options.offline) {
    if (existing.length !== 1) {
      throw new Error(existing.length === 0
        ? `Offline snapshot missing for ${prefix}`
        : `Offline snapshot is ambiguous for ${prefix}; found ${existing.length} immutable versions`);
    }
    return parseSnapshot(await readFile(path.join(directory, existing[0]), "utf8"), query);
  }

  const nativeRows = await fetchBackward(query, options.fetchImpl ?? fetch, {
    maximumAttempts: options.maximumAttempts ?? 6,
    retryBaseDelayMs: options.retryBaseDelayMs ?? (options.fetchImpl ? 0 : 1_000),
    requestIntervalMs: options.requestIntervalMs ?? (options.fetchImpl ? 0 : 125),
  });
  const definition = {
    schemaVersion: "bybit-kline-snapshot.1",
    source: "bybit",
    endpoint: ENDPOINT,
    category: "linear",
    symbol: query.symbol.toUpperCase(),
    timeframe: query.timeframe,
    nativeInterval: BYBIT_INTERVALS[query.timeframe].native,
    from: query.from,
    to: query.to,
    boundary: "openTime >= from and closeTime <= to; to is exclusive for open time",
    nativeRows,
  };
  const snapshot = { ...definition, fingerprint: sha256(definition) };
  const file = `${prefix}.${snapshot.fingerprint.slice("sha256:".length)}.json`;
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, file);
  try {
    await writeFile(target, `${canonicalJson(snapshot)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const current = await readFile(target, "utf8");
    if (current !== `${canonicalJson(snapshot)}\n`) throw new Error(`Immutable snapshot collision: ${target}`);
  }
  return snapshot;
}

export function nativeRowsToCandles(snapshot) {
  const seconds = BYBIT_INTERVALS[snapshot.timeframe].seconds;
  return snapshot.nativeRows.map((row) => ({
    openTime: Number(row[0]) / 1000,
    closeTime: Number(row[0]) / 1000 + seconds,
    o: Number(row[1]),
    h: Number(row[2]),
    l: Number(row[3]),
    c: Number(row[4]),
    vBase: Number(row[5]),
    vQuote: Number(row[6]),
  }));
}

export async function fetchBackward(query, fetchImpl, options = {}) {
  const interval = BYBIT_INTERVALS[query.timeframe];
  const fromMs = query.from * 1000;
  const toMs = query.to * 1000;
  let cursorEnd = toMs - 1;
  let requests = 0;
  const rows = [];
  while (cursorEnd >= fromMs) {
    if (++requests > 20_000) throw new Error("Bybit pagination exceeded the deterministic request bound");
    const url = new URL(ENDPOINT);
    url.search = new URLSearchParams({
      category: "linear",
      symbol: query.symbol.toUpperCase(),
      interval: interval.native,
      start: String(fromMs),
      end: String(cursorEnd),
      limit: "1000",
    }).toString();
    const body = await fetchPageWithRetry(url, query, fetchImpl, options);
    const page = body.result.list.map(normalizeNativeRow);
    if (page.length === 0) break;
    let oldest = Number.POSITIVE_INFINITY;
    for (const row of page) {
      const open = Number(row[0]);
      oldest = Math.min(oldest, open);
      if (open >= fromMs && open < toMs && open + interval.seconds * 1000 <= toMs) {
        rows.push(row);
      }
    }
    if (!Number.isFinite(oldest) || oldest > cursorEnd) throw new Error("Bybit pagination did not move backward");
    if (oldest <= fromMs || page.length < 1000) break;
    cursorEnd = oldest - 1;
    if ((options.requestIntervalMs ?? 0) > 0) await sleep(options.requestIntervalMs);
  }
  return rows.sort((left, right) => Number(left[0]) - Number(right[0]) || canonicalJson(left).localeCompare(canonicalJson(right)));
}

async function fetchPageWithRetry(url, query, fetchImpl, options) {
  const maximumAttempts = Math.max(1, Number(options.maximumAttempts ?? 1));
  const baseDelay = Math.max(0, Number(options.retryBaseDelayMs ?? 0));
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
    const body = response.ok ? await response.json() : null;
    if (response.ok && body?.retCode === 0 && Array.isArray(body?.result?.list)) return body;
    const rejectedForRateLimit = response.status === 429 || response.status === 403 ||
      body?.retCode === 10006 || /too many visits|rate limit/i.test(String(body?.retMsg ?? ""));
    if (!rejectedForRateLimit || attempt === maximumAttempts) {
      if (!response.ok) {
        throw new Error(`Bybit HTTP ${response.status} for ${query.symbol} ${query.timeframe}`);
      }
      throw new Error(`Bybit rejected ${query.symbol} ${query.timeframe}: ${body?.retMsg ?? "invalid response"}`);
    }
    await sleep(baseDelay * 2 ** (attempt - 1));
  }
  throw new Error(`Bybit request exhausted retries for ${query.symbol} ${query.timeframe}`);
}

function sleep(milliseconds) {
  return milliseconds > 0
    ? new Promise((resolve) => setTimeout(resolve, milliseconds))
    : Promise.resolve();
}

function normalizeNativeRow(row) {
  if (!Array.isArray(row) || row.length < 7) throw new Error("Bybit kline row has fewer than seven fields");
  return row.slice(0, 7).map((value) => String(value));
}

function validateQuery(query) {
  if (!BYBIT_INTERVALS[query.timeframe]) throw new Error(`Unsupported Bybit timeframe ${query.timeframe}`);
  if (!/^[A-Z0-9]+USDT$/.test(query.symbol.toUpperCase())) throw new Error(`Invalid Bybit symbol ${query.symbol}`);
  if (!Number.isSafeInteger(query.from) || !Number.isSafeInteger(query.to) || query.from >= query.to) {
    throw new Error("Snapshot range must be integer UTC seconds with from < to");
  }
}

function snapshotPrefix(query) {
  return ["bybit", query.symbol.toUpperCase(), query.timeframe, query.from, query.to, hashSuffix(query, 12)].join("-");
}

async function findSnapshots(directory, prefix) {
  try {
    return (await readdir(directory)).filter((file) => file.startsWith(`${prefix}.`) && file.endsWith(".json")).sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function parseSnapshot(text, query) {
  const parsed = JSON.parse(text);
  const { fingerprint, ...definition } = parsed;
  if (parsed.schemaVersion !== "bybit-kline-snapshot.1" || fingerprint !== sha256(definition)) {
    throw new Error("Bybit snapshot failed its immutable fingerprint check");
  }
  for (const key of ["symbol", "timeframe", "from", "to"]) {
    const expected = key === "symbol" ? query.symbol.toUpperCase() : query[key];
    if (parsed[key] !== expected) throw new Error(`Bybit snapshot ${key} does not match the request`);
  }
  return parsed;
}
