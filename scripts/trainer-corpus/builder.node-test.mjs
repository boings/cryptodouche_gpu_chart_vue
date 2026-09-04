import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildTrainerCorpus } from "./builder.mjs";
import { bundleFingerprint, sha256 } from "./canonical.mjs";

test("builds a deterministic dashboard-importable real corpus without authored outcomes", async () => {
  const base = 1_704_067_200;
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "trainer-corpus-out-"));
  const options = {
    source: "bybit",
    symbols: ["FILUSDT"],
    from: base + 3 * 86_400,
    to: base + 5 * 86_400,
    radarProfile: "experimental-impulse-fade",
    strategyProfile: "impulse-fade-research-default",
    analysisProfile: "experimental-impulse-fade",
    replayProfile: "materialized-default",
    executionProfile: "experimental-candle-only",
    analysisPreroll: 3 * 86_400,
    displayPreroll: 2 * 86_400,
    executionPostroll: 24 * 3_600,
    maxCases: 1,
    seed: "deterministic-test",
    outputDir,
    snapshotDir: path.join(outputDir, "snapshots"),
    offline: true,
  };
  const snapshotLoader = async (query) => syntheticSnapshot(query, options.from + 6 * 3_600);
  const dependencies = {
    snapshotLoader,
    requiredAnalysisPrerollResolver: () => ({
      "15m": options.analysisPreroll,
      "1h": options.analysisPreroll,
      "4h": options.analysisPreroll,
      "1d": options.analysisPreroll,
    }),
  };
  const result = await buildTrainerCorpus(options, dependencies);
  assert.equal(result.bundles.length, 1);
  const bundle = result.bundles[0];
  assert.equal(bundle.schemaVersion, "trainer-case-bundle.1");
  assert.equal(bundle.bundleFingerprint, bundleFingerprint(bundle));
  assert.equal(bundle.executionData.funding.availability, "unavailable");
  assert.equal(bundle.provenance.executionSimulationMode, "ResearchProxyExecution");
  assert.equal(bundle.venueExecutionRules.assumptionStatus, "researchAssumption");
  assert.equal(bundle.feeSchedule.assumptionStatus, "researchAssumption");
  assert.equal(bundle.replayFutureData.planningVenueRiskRules.venue, "bybit");
  assert.equal(bundle.replayFutureData.replayCaseOutcome.futureCandlesByTimeframe["15m"].length > 0, true);
  assert.deepEqual(bundle.replayFutureData.replayCaseOutcome.lifecycleTimeline, []);
  assert.equal(bundle.replayFutureData.outcomeDerivation.mode, "deriveFromHistoricalData");
  assert.equal(bundle.replayFutureData.historicalData.radarEpisodes.length, 1);
  assert.equal("outcome" in bundle.replayFutureData, false);
  assert.equal(bundle.executionData.trades.length, 0);
  const imported = JSON.parse(await readFile(path.join(outputDir, "private", "trainer-imported-corpus.json"), "utf8"));
  const safe = JSON.parse(await readFile(path.join(outputDir, "safe", "corpus-index.json"), "utf8"));
  assert.equal(imported.schemaVersion, "trainer-imported-corpus.1");
  assert.equal(imported.bundles[0].bundleFingerprint, bundle.bundleFingerprint);
  assert.equal(safe.cases[0].bundleId, bundle.bundleId);
  assert.equal(JSON.stringify(safe).includes("candlesByTimeframe"), false);

  const secondOutput = await mkdtemp(path.join(os.tmpdir(), "trainer-corpus-out-"));
  await buildTrainerCorpus({ ...options, outputDir: secondOutput, offline: false }, dependencies);
  for (const relative of [
    "corpus.json",
    "audit-report.json",
    "safe/corpus-index.json",
    "private/trainer-imported-corpus.json",
  ]) {
    assert.equal(
      await readFile(path.join(secondOutput, relative), "utf8"),
      await readFile(path.join(outputDir, relative), "utf8"),
      `${relative} must be byte deterministic across snapshot reuse modes`,
    );
  }
});

function syntheticSnapshot(query, pumpTime) {
  const seconds = { "1m": 60, "15m": 900, "1h": 3_600, "4h": 14_400, "1d": 86_400 }[query.timeframe];
  const nativeRows = [];
  for (let open = query.from; open + seconds <= query.to; open += seconds) {
    const targetPump = query.symbol === "FILUSDT" && open >= pumpTime;
    const price = query.symbol === "BTCUSDT" ? 40_000 : targetPump ? 113 : 100;
    nativeRows.push([String(open * 1000), String(price), String(price * 1.002), String(price * 0.998), String(price), "20000", String(price * 20000)]);
  }
  const definition = {
    schemaVersion: "bybit-kline-snapshot.1",
    source: "bybit",
    endpoint: "fixture",
    category: "linear",
    symbol: query.symbol,
    timeframe: query.timeframe,
    nativeInterval: { "1m": "1", "15m": "15", "1h": "60", "4h": "240", "1d": "D" }[query.timeframe],
    from: query.from,
    to: query.to,
    boundary: "fixture",
    nativeRows,
  };
  return { ...definition, fingerprint: sha256(definition) };
}
