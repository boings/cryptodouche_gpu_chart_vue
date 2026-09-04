import assert from "node:assert/strict";
import { mkdtemp, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadBybitSnapshot } from "./bybit.mjs";

test("paginates backward, canonicalizes rows, and reuses the immutable snapshot offline", async () => {
  const snapshotDir = await mkdtemp(path.join(os.tmpdir(), "trainer-bybit-"));
  const start = 1_704_067_200;
  const rows = Array.from({ length: 1_001 }, (_, index) => nativeRow(start + index * 60, 100 + index / 100));
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    const end = Number(url.searchParams.get("end"));
    const startMs = Number(url.searchParams.get("start"));
    const page = rows
      .filter((row) => Number(row[0]) >= startMs && Number(row[0]) <= end)
      .slice(-1_000)
      .reverse();
    return { ok: true, json: async () => ({ retCode: 0, result: { list: page } }) };
  };
  const query = { source: "bybit", symbol: "FILUSDT", timeframe: "1m", from: start, to: start + 1_001 * 60 };
  const online = await loadBybitSnapshot(query, { snapshotDir, fetchImpl, offline: false });
  assert.equal(calls, 2);
  assert.equal(online.nativeRows.length, 1_001);
  assert.equal((await readdir(snapshotDir)).length, 1);
  const offline = await loadBybitSnapshot(query, { snapshotDir, offline: true });
  assert.deepEqual(offline, online);
});

test("retries a bounded Bybit rate-limit response before accepting the page", async () => {
  const snapshotDir = await mkdtemp(path.join(os.tmpdir(), "trainer-bybit-retry-"));
  const start = 1_704_067_200;
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ retCode: 10006, retMsg: "Too many visits. Exceeded the API Rate Limit." }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ retCode: 0, result: { list: [nativeRow(start, 100)] } }),
    };
  };
  const query = { source: "bybit", symbol: "FILUSDT", timeframe: "1h", from: start, to: start + 3_600 };
  const snapshot = await loadBybitSnapshot(query, {
    snapshotDir,
    fetchImpl,
    maximumAttempts: 2,
    retryBaseDelayMs: 0,
  });
  assert.equal(calls, 2);
  assert.equal(snapshot.nativeRows.length, 1);
});

function nativeRow(openTime, close) {
  return [String(openTime * 1000), String(close), String(close + 1), String(close - 1), String(close), "1000", String(close * 1000)];
}
