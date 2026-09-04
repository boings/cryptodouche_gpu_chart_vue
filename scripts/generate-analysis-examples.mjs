#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
  canonicalSerialize,
  createReplayCandleRecord,
} from "../dist/core.js";

const examples = ["drop-rebound", "continuation"];

try {
  for (const name of examples) {
    const replayPath = resolve(`fixtures/generated/replay-${name}.json`);
    const outputPath = resolve(`fixtures/generated/replay-analysis-${name}.data.json`);
    const replay = JSON.parse(await readFile(replayPath, "utf8"));
    const target = replay.data.candles;
    const reference = target.map((candle) => createReplayCandleRecord({
      symbol: "BTCUSDT",
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
    }));
    const fixture = {
      schemaVersion: REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
      target: {
        symbol: replay.manifest.symbol,
        source: replay.manifest.source,
        candles: target,
        candleRevisions: replay.data.candleRevisions,
        revisionHistoryAvailable: replay.data.revisionHistoryAvailable,
      },
      reference: {
        symbol: "BTCUSDT",
        source: replay.manifest.source,
        candles: reference,
        candleRevisions: [],
        revisionHistoryAvailable: false,
      },
    };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${canonicalSerialize(fixture)}\n`, "utf8");
    console.log(`GENERATED ${outputPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
