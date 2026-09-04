import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseCliOptions } from "./options.mjs";

test("parses explicit symbols and frozen profile defaults", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "trainer-options-"));
  await writeFile(path.join(directory, "symbols.json"), JSON.stringify({ symbols: ["filusdt", "BTCUSDT", "FILUSDT"] }));
  const options = await parseCliOptions([
    "--symbols", "symbols.json",
    "--from", "2024-01-01T00:00:00Z",
    "--to", "2024-02-01T00:00:00Z",
    "--output-dir", "out",
    "--snapshot-dir", "snapshots",
    "--analysis-preroll", "90d",
    "--display-preroll", "7d",
    "--execution-postroll", "48h",
    "--max-cases", "8",
    "--offline",
  ], directory);
  assert.deepEqual(options.symbols, ["FILUSDT"]);
  assert.equal(options.analysisPreroll, 90 * 86_400);
  assert.equal(options.executionPostroll, 48 * 3_600);
  assert.equal(options.maxCases, 8);
  assert.equal(options.offline, true);
  assert.equal(options.radarProfile, "experimental-impulse-fade");
});
test("rejects non-Bybit sources", async () => {
  await assert.rejects(
    () => parseCliOptions(["--source", "binance"]),
    /supports --source bybit only/,
  );
});
