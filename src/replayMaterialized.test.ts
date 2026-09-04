import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { JsonReplayHistoricalDataAdapter } from "./replayJsonAdapter";
import { createReplayCandleRecord, type ReplayCandleRecord } from "./replay";
import { createExperimentalReplayAnalysisProfile } from "./replayAnalysis";
import {
  InMemoryReplayAnalysisDataAdapter,
  type ReplayAnalysisJsonDataFixture,
} from "./replayAnalysisJsonAdapter";
import {
  createMaterializedReplaySessionConfig,
  loadMaterializedReplayCase,
} from "./replayMaterialized";
import {
  applyReplayCommand,
  createReplayCommand,
  createReplaySession,
  createReplayWakePlan,
} from "./replaySession";
import type { RadarSelectionProfile, ReplayCaseManifest } from "./radar";
import type { ReplaySessionConfig } from "./replay";
import type { StrategyProfile } from "./strategy";

const fixturePath = new URL("../fixtures/generated/replay-drop-rebound.json", import.meta.url);

interface LegacyAuditFixture {
  manifest: ReplayCaseManifest;
  config: ReplaySessionConfig;
  profiles: { radarSelection: RadarSelectionProfile; strategy: StrategyProfile; venueRules: null };
  data: ConstructorParameters<typeof JsonReplayHistoricalDataAdapter>[0];
}

describe("materialized replay-engine.2 integration", () => {
  it("starts and waits with raw-derived frames instead of carried observations", async () => {
    const audit = JSON.parse(readFileSync(fixturePath, "utf8")) as LegacyAuditFixture;
    const target = (audit.data as { candles: ReplayCandleRecord[]; candleRevisions: ReplayCandleRecord[] });
    const referenceCandles = target.candles.map((candle, index) => referenceCandle(candle, index));
    const analysisData: ReplayAnalysisJsonDataFixture = {
      schemaVersion: "replay-analysis-data.1",
      target: {
        symbol: audit.manifest.symbol,
        source: audit.manifest.source,
        candles: target.candles,
        candleRevisions: target.candleRevisions,
        revisionHistoryAvailable: false,
      },
      reference: {
        symbol: "BTCUSDT",
        source: audit.manifest.source,
        candles: referenceCandles,
        candleRevisions: [],
        revisionHistoryAvailable: false,
      },
    };
    const profile = createExperimentalReplayAnalysisProfile(audit.profiles.strategy, {
      evaluatedTimeframes: ["1h"],
      contextTimeframes: [],
      stochasticRsiConfig: {
        timeframe: "1h",
        rsiPeriod: 2,
        stochPeriod: 2,
        kPeriod: 1,
        dPeriod: 1,
      },
      relativeStrengthConfig: {
        timeframe: "1h",
        formulaVersion: "relative-ratio.1",
        lookback: 100,
        pivotStrength: 1,
        atrPeriod: 2,
        minMoveAtr: 0,
        maxSwings: 30,
        maxBreaks: 10,
        minDeltaPct: 0.1,
        maxAgeBars: 100,
        maxDivergences: 10,
        includeDivergences: true,
        includeLeads: true,
        includeBreaks: true,
      },
      extensionConfig: {
        windowSeconds: 3_600,
        historyDays: 180,
        minSamples: 1,
        emaPeriod: 2,
        atrPeriod: 2,
      },
      structureConfig: {
        lookback: 100,
        pivotStrength: 1,
        atrPeriod: 2,
        minMoveAtr: 0,
        maxSwings: 30,
        maxBreaks: 10,
      },
    });
    const { canonicalConfigHash: _ignored, ...legacyDefinition } = audit.config;
    const config = createMaterializedReplaySessionConfig({
      ...legacyDefinition,
      id: `${audit.config.id}.materialized`,
      version: "2",
    }, audit.profiles.strategy);
    const loaded = await loadMaterializedReplayCase({
      manifest: audit.manifest,
      sessionConfig: config,
      historicalDataAdapter: new JsonReplayHistoricalDataAdapter(audit.data),
      analysisDataAdapter: new InMemoryReplayAnalysisDataAdapter(analysisData),
      strategyProfile: audit.profiles.strategy,
      radarSelectionProfile: audit.profiles.radarSelection,
      venueRules: audit.profiles.venueRules,
      analysisProfile: profile,
    });

    let session = createReplaySession(loaded);
    expect(session.replayEngineVersion).toBe("replay-engine.2");
    const started = await applyReplayCommand(
      loaded,
      session,
      createReplayCommand(session, { id: "materialized:start", type: "StartSession" }),
    );
    session = started.session;
    const first = session.frames.at(-1)!;
    expect(first.materializedAnalysisStateRef?.schemaVersion).toBe("replay-analysis-state.2");
    expect(first.dataQualityNotes.map((note) => note.code)).not.toContain(
      "CARRIED_FORWARD_ANALYSIS_STATE",
    );

    const wakePlan = createReplayWakePlan({
      submittedFrameId: first.id,
      createdAt: first.effectiveAsOf,
      scheduledReview: { mode: "nextCompletedCandle", timeframe: "1h" },
      deadlineAsOf: first.effectiveAsOf + 2 * 3_600,
    });
    const waited = await applyReplayCommand(
      loaded,
      session,
      createReplayCommand(session, {
        id: "materialized:wait",
        type: "Wait",
        payload: { reason: "waiting_for_structure_break", wakePlan },
      }),
    );
    const next = waited.session.frames.at(-1)!;
    expect(next.effectiveAsOf).toBe(first.effectiveAsOf + 3_600);
    expect(next.materializedAnalysisStateRef?.id).not.toBe(
      first.materializedAnalysisStateRef?.id,
    );
    expect(next.dataQualityNotes.map((note) => note.code)).not.toContain(
      "CARRIED_FORWARD_ANALYSIS_STATE",
    );
    expect(next.visibleCandlesByTimeframe["1h"].every((candle) =>
      candle.closeTime <= next.effectiveAsOf && candle.knownAt <= next.effectiveAsOf)).toBe(true);
  });
});

function referenceCandle(candle: ReplayCandleRecord, index: number) {
  const close = 40_000 + index * 100;
  return createReplayCandleRecord({
    symbol: "BTCUSDT",
    source: candle.source,
    timeframe: candle.timeframe,
    openTime: candle.openTime,
    o: close,
    h: close + 50,
    l: close - 50,
    c: close,
    vBase: 1_000,
    revision: 1,
  });
}
