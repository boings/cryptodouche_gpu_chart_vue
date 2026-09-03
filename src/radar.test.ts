import { describe, expect, it } from "vitest";
import type { CandleRecord } from "./types";
import {
  createRadarSelectionProfile,
  scanRadarEpisodes,
  type RadarSelectionProfileDefinition,
} from "./radar";

const HOUR = 3_600;
const DAY = 86_400;
const START = 1_700_000_000;

function candle(bucket: number, close: number): CandleRecord {
  return {
    ts: bucket,
    bucket,
    x: (bucket - START) / HOUR,
    o: close,
    h: close,
    l: close,
    c: close,
    v_base: 1_000,
    v_quote: close * 1_000,
  };
}

function profileDefinition(
  overrides: Partial<RadarSelectionProfileDefinition> = {},
): RadarSelectionProfileDefinition {
  return {
    schemaVersion: "radar-selection-profile.1",
    id: "impulse-fade-radar.test",
    version: "1",
    name: "Impulse Fade radar test profile",
    setupFamily: "impulse_fade_v1",
    scanTimeframe: "1h",
    evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
    moveDetectors: [
      {
        id: "recent-trough-runup",
        type: "rollingTroughRunup",
        lookbackSeconds: 48 * HOUR,
        minimumRunupPct: 15,
        maximumTroughAgeSeconds: 48 * HOUR,
        referenceField: "close",
        minimumPercentile: null,
        minimumZScore: null,
        minimumSampleCount: 0,
        historyLookbackSeconds: 90 * DAY,
      },
    ],
    detectorCombination: { mode: "any" },
    hardGates: [],
    resetPolicy: { minimumFalseDurationSeconds: 2 * HOUR },
    episodeExpiry: { maximumAgeSeconds: 72 * HOUR },
    sourcePolicy: { allowedSources: ["external"] },
    executionVenuePolicy: {
      intendedVenue: "phemex",
      mode: "allowUnknown",
    },
    liquidityPolicy: {
      minimumQuoteNotional: null,
      windowSeconds: DAY,
      missingData: "warn",
    },
    createdAt: START,
    ...overrides,
  };
}

describe("path-aware radar scanning", () => {
  it("selects a 100 to 80 to 92 rebound despite its negative 24h return", () => {
    const candles = [
      candle(START, 100),
      candle(START + 23 * HOUR, 80),
      candle(START + 24 * HOUR, 92),
    ];
    const result = scanRadarEpisodes({
      candlesBySymbolAndTimeframe: {
        FILUSDT: {
          symbol: "FILUSDT",
          source: "external",
          candlesByTimeframe: { "1h": candles },
        },
      },
      selectionProfile: createRadarSelectionProfile(profileDefinition()),
      from: START,
      to: START + 25 * HOUR,
    });

    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toMatchObject({
      symbol: "FILUSDT",
      detectedAt: START + 25 * HOUR,
      triggeringDetectorIds: ["recent-trough-runup"],
      selectionAnchor: {
        price: 80,
        timestamp: START + 23 * HOUR,
      },
    });
    expect(result.episodes[0].pathContext.net24hReturnPct).toBeCloseTo(-8, 12);
    expect(result.episodes[0].pathContext.triggeringLocalImpulseReturnPct).toBeCloseTo(15, 12);
    expect(result.episodes[0].pathContext.priorDrawdownPct).toBeCloseTo(-20, 12);
    expect(result.episodes[0].pathContext.recoveryFraction).toBeCloseTo(0.6, 12);
  });
});
