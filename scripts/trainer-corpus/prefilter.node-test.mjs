import assert from "node:assert/strict";
import test from "node:test";
import { createRadarSelectionProfile } from "../../dist/core.js";
import { comparePrefilteredWithFullScan, prefilterRadarPoints } from "./prefilter.mjs";

test("bounded prefilter scan matches a full causal scan on a small fixture", () => {
  const start = 1_699_999_200;
  const candles = Array.from({ length: 40 }, (_, index) => {
    const close = index === 25 ? 108 : index > 25 ? 100 : 100;
    return { ts: start + index * 3_600, bucket: start + index * 3_600, x: index, o: close, h: close + 1, l: close - 1, c: close, v_base: 1_000, v_quote: close * 1_000 };
  });
  const profile = createRadarSelectionProfile({
    schemaVersion: "radar-selection-profile.1",
    id: "prefilter-test",
    version: "1",
    name: "Prefilter parity",
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [{
      id: "one-hour-return",
      type: "elapsedWindowReturn",
      windowSeconds: 3_600,
      minimumReturnPct: 5,
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 0,
      historyLookbackSeconds: 24 * 3_600,
      maximumReferenceStalenessSeconds: 0,
    }],
    detectorCombination: { mode: "any" },
    hardGates: [],
    resetPolicy: { minimumFalseDurationSeconds: 3_600 },
    episodeExpiry: { maximumAgeSeconds: 8 * 3_600 },
    sourcePolicy: { allowedSources: ["bybit"] },
    executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
    liquidityPolicy: { minimumQuoteNotional: null, windowSeconds: 24 * 3_600, missingData: "warn" },
    createdAt: start,
  });
  const input = {
    candlesBySymbolAndTimeframe: {
      FILUSDT: { symbol: "FILUSDT", source: "bybit", dataOrigin: "fixture", candlesByTimeframe: { "1h": candles } },
    },
    selectionProfile: profile,
    from: start + 2 * 3_600,
    to: start + 40 * 3_600,
  };
  const points = prefilterRadarPoints(candles, profile);
  assert.ok(points.length > 0);
  const comparison = comparePrefilteredWithFullScan(input, points);
  assert.equal(comparison.equal, true, JSON.stringify(comparison));
  assert.equal(comparison.fullEpisodeIds.length, 1);
});
