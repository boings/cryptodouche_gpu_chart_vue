import { describe, expect, it } from "vitest";

import {
  DEFAULT_GPU_CHART_APPEARANCE,
  DEFAULT_GRID_GPU_CHART_APPEARANCE,
  GPU_CHART_APPEARANCE_KEY,
  gpuChartIndicatorEnabled,
  gpuChartMovingAverageColor,
  gpuChartMovingAveragePeriod,
  hexToRgb01,
  loadGpuChartAppearance,
  normalizeGpuChartAppearance,
  saveGpuChartAppearance,
} from "./appearance";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("gpu chart appearance", () => {
  it("normalizes invalid persisted values", () => {
    const appearance = normalizeGpuChartAppearance({
      backgroundColor: "black",
      candleWidth: 100,
      wickWidth: -2,
      fontSize: 100,
      smaPeriod: 1,
      bollingerStdDev: 99,
      stochRsiKColor: "orange",
      stochRsiRsiPeriod: 1,
      stochRsiPaneHeight: 1,
      stochRsiRangeColor: "gray",
      stochRsiRangeLower: -10,
      stochRsiRangeUpper: 120,
      stochRsiSmooth: "yes" as unknown as boolean,
      rsiColor: "lime",
      rsiPeriod: 1,
      rsiRangeColor: "gray",
      rsiRangeLower: -5,
      rsiRangeUpper: 105,
      rsiSmooth: "yes" as unknown as boolean,
      macdLineColor: "blue",
      macdSignalColor: "orange",
      macdHistogramUpColor: "green",
      macdHistogramDownColor: "red",
      srSupportZoneColor: "green",
      srResistanceZoneColor: "red",
      srZoneLookback: 5,
      srZonePivotStrength: 99,
      srZoneMaxZones: 99,
      srZoneThicknessBps: 0,
      macdFastPeriod: 1,
      macdSlowPeriod: 999,
      macdSignalPeriod: -3,
      macdSmooth: "yes" as unknown as boolean,
      atrColor: "yellow",
      atrPeriod: 999,
      atrSmooth: "yes" as unknown as boolean,
      relativeReturnColor: "lime",
      relativeReturnZeroColor: "gray",
      relativeReturnSmooth: "yes" as unknown as boolean,
      volumeUpColor: "green",
      volumeDownColor: "red",
      volumeHeightRatio: 9,
      volumeOpacity: 9,
      windowHighColor: "blue",
      showTimeAxis: "yes" as unknown as boolean,
      showWindowHighLow: "yes" as unknown as boolean,
      activeIndicatorPane: "not-a-pane" as unknown as "rsi",
      activeIndicatorPanes: "bad" as unknown as [],
      indicatorPaneMinimized: "no" as unknown as boolean,
      indicators: "bad" as unknown as [],
      showSma: "yes" as unknown as boolean,
      showEma: "yes" as unknown as boolean,
      showStochRsi: "yes" as unknown as boolean,
      showRsi: "yes" as unknown as boolean,
      showMacd: "yes" as unknown as boolean,
      showAtr: "yes" as unknown as boolean,
      showRelativeReturn: "yes" as unknown as boolean,
      showVolume: "yes" as unknown as boolean,
      showGrid: "yes" as unknown as boolean,
    });

    expect(appearance.backgroundColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.backgroundColor);
    expect(appearance.candleWidth).toBe(24);
    expect(appearance.wickWidth).toBe(0.5);
    expect(appearance.fontSize).toBe(28);
    expect(appearance.smaPeriod).toBe(2);
    expect(appearance.bollingerStdDev).toBe(5);
    expect(appearance.stochRsiKColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.stochRsiKColor);
    expect(appearance.stochRsiRsiPeriod).toBe(2);
    expect(appearance.stochRsiPaneHeight).toBe(0.4);
    expect(appearance.stochRsiRangeColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.stochRsiRangeColor);
    expect(appearance.stochRsiRangeLower).toBe(0);
    expect(appearance.stochRsiRangeUpper).toBe(100);
    expect(appearance.stochRsiSmooth).toBe(DEFAULT_GPU_CHART_APPEARANCE.stochRsiSmooth);
    expect(appearance.rsiColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.rsiColor);
    expect(appearance.rsiPeriod).toBe(2);
    expect(appearance.rsiRangeColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.rsiRangeColor);
    expect(appearance.rsiRangeLower).toBe(0);
    expect(appearance.rsiRangeUpper).toBe(100);
    expect(appearance.rsiSmooth).toBe(DEFAULT_GPU_CHART_APPEARANCE.rsiSmooth);
    expect(appearance.macdLineColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.macdLineColor);
    expect(appearance.macdSignalColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.macdSignalColor);
    expect(appearance.macdHistogramUpColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.macdHistogramUpColor,
    );
    expect(appearance.macdHistogramDownColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.macdHistogramDownColor,
    );
    expect(appearance.srSupportZoneColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.srSupportZoneColor,
    );
    expect(appearance.srResistanceZoneColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.srResistanceZoneColor,
    );
    expect(appearance.srZoneLookback).toBe(20);
    expect(appearance.srZonePivotStrength).toBe(20);
    expect(appearance.srZoneMaxZones).toBe(12);
    expect(appearance.srZoneThicknessBps).toBe(1);
    expect(appearance.macdFastPeriod).toBe(2);
    expect(appearance.macdSlowPeriod).toBe(200);
    expect(appearance.macdSignalPeriod).toBe(1);
    expect(appearance.macdSmooth).toBe(DEFAULT_GPU_CHART_APPEARANCE.macdSmooth);
    expect(appearance.atrColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.atrColor);
    expect(appearance.atrPeriod).toBe(100);
    expect(appearance.atrSmooth).toBe(DEFAULT_GPU_CHART_APPEARANCE.atrSmooth);
    expect(appearance.relativeReturnColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.relativeReturnColor,
    );
    expect(appearance.relativeReturnZeroColor).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.relativeReturnZeroColor,
    );
    expect(appearance.relativeReturnSmooth).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.relativeReturnSmooth,
    );
    expect(appearance.volumeUpColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.volumeUpColor);
    expect(appearance.volumeDownColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.volumeDownColor);
    expect(appearance.volumeHeightRatio).toBe(0.35);
    expect(appearance.volumeOpacity).toBe(1);
    expect(appearance.windowHighColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.windowHighColor);
    expect(appearance.showTimeAxis).toBe(DEFAULT_GPU_CHART_APPEARANCE.showTimeAxis);
    expect(appearance.showWindowHighLow).toBe(DEFAULT_GPU_CHART_APPEARANCE.showWindowHighLow);
    expect(appearance.activeIndicatorPane).toBe(DEFAULT_GPU_CHART_APPEARANCE.activeIndicatorPane);
    expect(appearance.activeIndicatorPanes).toEqual(
      DEFAULT_GPU_CHART_APPEARANCE.activeIndicatorPanes,
    );
    expect(appearance.indicatorPaneMinimized).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.indicatorPaneMinimized,
    );
    expect(appearance.indicators).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "sma", enabled: true, period: 2 }),
        expect.objectContaining({ type: "ema", enabled: true, period: 20 }),
        expect.objectContaining({ type: "srZones", enabled: false }),
        expect.objectContaining({ type: "relativeReturn", enabled: false }),
      ]),
    );
    expect(appearance.showSma).toBe(DEFAULT_GPU_CHART_APPEARANCE.showSma);
    expect(appearance.showEma).toBe(DEFAULT_GPU_CHART_APPEARANCE.showEma);
    expect(appearance.showStochRsi).toBe(DEFAULT_GPU_CHART_APPEARANCE.showStochRsi);
    expect(appearance.showRsi).toBe(DEFAULT_GPU_CHART_APPEARANCE.showRsi);
    expect(appearance.showMacd).toBe(DEFAULT_GPU_CHART_APPEARANCE.showMacd);
    expect(appearance.showAtr).toBe(DEFAULT_GPU_CHART_APPEARANCE.showAtr);
    expect(appearance.showRelativeReturn).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.showRelativeReturn,
    );
    expect(appearance.showVolume).toBe(DEFAULT_GPU_CHART_APPEARANCE.showVolume);
    expect(appearance.showGrid).toBe(DEFAULT_GPU_CHART_APPEARANCE.showGrid);
  });

  it("loads and saves a partial style", () => {
    const storage = new MemoryStorage();
    const saved = saveGpuChartAppearance(
      {
        backgroundColor: "#111827",
        fontSize: 18,
        showBadge: false,
        showSma: false,
        showEma: false,
        showWma: true,
        showWindowHighLow: false,
        windowHighColor: "#0ea5e9",
        windowLowColor: "#fb923c",
        showTimeAxis: false,
        showVolume: false,
        volumeUpColor: "#10b981",
        volumeDownColor: "#f43f5e",
        volumeHeightRatio: 0.22,
        volumeOpacity: 0.45,
        showStochRsi: false,
        showRsi: false,
        stochRsiRangeColor: "#334155",
        stochRsiRangeLower: 25,
        stochRsiRangeUpper: 75,
        stochRsiSmooth: true,
        rsiRangeColor: "#475569",
        rsiRangeLower: 30,
        rsiRangeUpper: 70,
        rsiSmooth: true,
        showMacd: false,
        showAtr: false,
        showRelativeReturn: true,
        showSrZones: true,
        srSupportZoneColor: "#059669",
        srResistanceZoneColor: "#dc2626",
        srZoneLookback: 320,
        srZonePivotStrength: 4,
        srZoneMaxZones: 5,
        srZoneThicknessBps: 14,
        macdLineColor: "#0284c7",
        macdSignalColor: "#f97316",
        macdHistogramUpColor: "#16a34a",
        macdHistogramDownColor: "#dc2626",
        macdFastPeriod: 8,
        macdSlowPeriod: 21,
        macdSignalPeriod: 5,
        macdSmooth: true,
        atrColor: "#facc15",
        atrPeriod: 22,
        atrSmooth: true,
        relativeReturnColor: "#2dd4bf",
        relativeReturnZeroColor: "#94a3b8",
        relativeReturnSmooth: true,
        activeIndicatorPane: "macd",
        indicatorPaneMinimized: true,
      },
      storage,
    );

    expect(saved.backgroundColor).toBe("#111827");
    expect(saved.fontSize).toBe(18);
    expect(saved.showBadge).toBe(false);
    expect(saved.showSma).toBe(false);
    expect(saved.showEma).toBe(false);
    expect(saved.showWma).toBe(true);
    expect(saved.showWindowHighLow).toBe(false);
    expect(saved.windowHighColor).toBe("#0ea5e9");
    expect(saved.windowLowColor).toBe("#fb923c");
    expect(saved.showTimeAxis).toBe(false);
    expect(saved.showVolume).toBe(false);
    expect(saved.volumeUpColor).toBe("#10b981");
    expect(saved.volumeDownColor).toBe("#f43f5e");
    expect(saved.volumeHeightRatio).toBe(0.22);
    expect(saved.volumeOpacity).toBe(0.45);
    expect(saved.showStochRsi).toBe(false);
    expect(saved.showRsi).toBe(false);
    expect(saved.stochRsiRangeColor).toBe("#334155");
    expect(saved.stochRsiRangeLower).toBe(25);
    expect(saved.stochRsiRangeUpper).toBe(75);
    expect(saved.stochRsiSmooth).toBe(true);
    expect(saved.rsiRangeColor).toBe("#475569");
    expect(saved.rsiRangeLower).toBe(30);
    expect(saved.rsiRangeUpper).toBe(70);
    expect(saved.rsiSmooth).toBe(true);
    expect(saved.showMacd).toBe(false);
    expect(saved.showAtr).toBe(false);
    expect(saved.showRelativeReturn).toBe(true);
    expect(saved.showSrZones).toBe(true);
    expect(saved.indicators.find((item) => item.type === "srZones")?.enabled).toBe(true);
    expect(saved.srSupportZoneColor).toBe("#059669");
    expect(saved.srResistanceZoneColor).toBe("#dc2626");
    expect(saved.srZoneLookback).toBe(320);
    expect(saved.srZonePivotStrength).toBe(4);
    expect(saved.srZoneMaxZones).toBe(5);
    expect(saved.srZoneThicknessBps).toBe(14);
    expect(saved.indicators.find((item) => item.type === "sma")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "ema")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "wma")?.enabled).toBe(true);
    expect(saved.indicators.find((item) => item.type === "volume")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "stochRsi")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "rsi")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "macd")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "atr")?.enabled).toBe(false);
    expect(saved.indicators.find((item) => item.type === "relativeReturn")?.enabled).toBe(true);
    expect(saved.macdLineColor).toBe("#0284c7");
    expect(saved.macdSignalColor).toBe("#f97316");
    expect(saved.macdHistogramUpColor).toBe("#16a34a");
    expect(saved.macdHistogramDownColor).toBe("#dc2626");
    expect(saved.macdFastPeriod).toBe(8);
    expect(saved.macdSlowPeriod).toBe(21);
    expect(saved.macdSignalPeriod).toBe(5);
    expect(saved.macdSmooth).toBe(true);
    expect(saved.atrColor).toBe("#facc15");
    expect(saved.atrPeriod).toBe(22);
    expect(saved.atrSmooth).toBe(true);
    expect(saved.relativeReturnColor).toBe("#2dd4bf");
    expect(saved.relativeReturnZeroColor).toBe("#94a3b8");
    expect(saved.relativeReturnSmooth).toBe(true);
    expect(saved.activeIndicatorPane).toBe("macd");
    expect(saved.indicatorPaneMinimized).toBe(true);
    expect(JSON.parse(storage.getItem(`${GPU_CHART_APPEARANCE_KEY}:single`) ?? "{}")).toMatchObject({
      backgroundColor: "#111827",
      fontSize: 18,
      showBadge: false,
      showSma: false,
      showEma: false,
      showWma: true,
      showWindowHighLow: false,
      windowHighColor: "#0ea5e9",
      windowLowColor: "#fb923c",
      showTimeAxis: false,
      showVolume: false,
      volumeUpColor: "#10b981",
      volumeDownColor: "#f43f5e",
      volumeHeightRatio: 0.22,
      volumeOpacity: 0.45,
      showStochRsi: false,
      showRsi: false,
      stochRsiRangeColor: "#334155",
      stochRsiRangeLower: 25,
      stochRsiRangeUpper: 75,
      stochRsiSmooth: true,
      rsiRangeColor: "#475569",
      rsiRangeLower: 30,
      rsiRangeUpper: 70,
      rsiSmooth: true,
      showMacd: false,
      showAtr: false,
      showRelativeReturn: true,
      indicators: expect.arrayContaining([
        expect.objectContaining({ type: "sma", enabled: false }),
        expect.objectContaining({ type: "ema", enabled: false }),
        expect.objectContaining({ type: "wma", enabled: true }),
        expect.objectContaining({ type: "volume", enabled: false }),
        expect.objectContaining({ type: "stochRsi", enabled: false }),
        expect.objectContaining({ type: "rsi", enabled: false }),
        expect.objectContaining({ type: "macd", enabled: false }),
        expect.objectContaining({ type: "atr", enabled: false }),
        expect.objectContaining({ type: "relativeReturn", enabled: true }),
      ]),
      macdLineColor: "#0284c7",
      macdSignalColor: "#f97316",
      macdHistogramUpColor: "#16a34a",
      macdHistogramDownColor: "#dc2626",
      macdFastPeriod: 8,
      macdSlowPeriod: 21,
      macdSignalPeriod: 5,
      macdSmooth: true,
      atrColor: "#facc15",
      atrPeriod: 22,
      atrSmooth: true,
      relativeReturnColor: "#2dd4bf",
      relativeReturnZeroColor: "#94a3b8",
      relativeReturnSmooth: true,
      activeIndicatorPane: "macd",
      indicatorPaneMinimized: true,
    });
    expect(loadGpuChartAppearance(storage)).toMatchObject(saved);
  });

  it("uses indicator instances as the enablement source of truth", () => {
    const appearance = normalizeGpuChartAppearance({
      showMacd: true,
      showVolume: true,
      indicators: [
        { id: "macd", type: "macd", enabled: false, placement: "lower" },
        { id: "volume", type: "volume", enabled: false, placement: "price" },
        { id: "bollinger", type: "bollinger", enabled: true, placement: "price" },
      ],
    });

    expect(appearance.showMacd).toBe(false);
    expect(appearance.showVolume).toBe(false);
    expect(appearance.showBollinger).toBe(true);
    expect(appearance.indicators.find((item) => item.type === "macd")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "volume")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "bollinger")?.enabled).toBe(true);
    expect(appearance.indicators.find((item) => item.type === "sma")?.enabled).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.showSma,
    );
  });

  it("keeps multiple moving average instances with per-instance settings", () => {
    const appearance = normalizeGpuChartAppearance({
      emaPeriod: 21,
      emaColor: "#38bdf8",
      indicators: [
        { id: "ema", type: "ema", enabled: false, placement: "price", period: 9, color: "#f59e0b" },
        { id: "ema", type: "ema", enabled: true, placement: "price", period: 50, color: "#a78bfa" },
        { id: "macd", type: "macd", enabled: true, placement: "lower" },
        { id: "macd-copy", type: "macd", enabled: false, placement: "lower" },
      ],
    });

    const emas = appearance.indicators.filter((item) => item.type === "ema");
    const macds = appearance.indicators.filter((item) => item.type === "macd");

    expect(emas).toHaveLength(2);
    expect(emas.map((item) => item.id)).toEqual(["ema", "ema-2"]);
    expect(emas.map((item) => item.period)).toEqual([9, 50]);
    expect(emas.map((item) => item.color)).toEqual(["#f59e0b", "#a78bfa"]);
    expect(macds).toHaveLength(1);
    expect(appearance.showEma).toBe(true);
    expect(gpuChartIndicatorEnabled(appearance, "ema")).toBe(true);
    expect(gpuChartMovingAveragePeriod(appearance, emas[1])).toBe(50);
    expect(gpuChartMovingAverageColor(appearance, emas[0])).toBe("#f59e0b");
  });

  it("clamps moving average instance settings and disables the type when all are off", () => {
    const appearance = normalizeGpuChartAppearance({
      emaPeriod: 21,
      emaColor: "#38bdf8",
      indicators: [
        { id: "ema-fast", type: "ema", enabled: false, placement: "price", period: 1, color: "cyan" },
        { id: "ema-slow", type: "ema", enabled: false, placement: "price", period: 999, color: "#f97316" },
      ],
    });

    const emas = appearance.indicators.filter((item) => item.type === "ema");

    expect(emas.map((item) => item.period)).toEqual([2, 250]);
    expect(emas.map((item) => item.color)).toEqual(["#38bdf8", "#f97316"]);
    expect(appearance.showEma).toBe(false);
    expect(gpuChartIndicatorEnabled(appearance, "ema")).toBe(false);
  });

  it("normalizes active lower pane selections", () => {
    const appearance = normalizeGpuChartAppearance({
      activeIndicatorPane: "macd",
      activeIndicatorPanes: ["macd", "rsi", "atr", "stochRsi"],
    });

    expect(appearance.activeIndicatorPane).toBe("macd");
    expect(appearance.activeIndicatorPanes).toEqual(["macd", "rsi", "atr"]);
  });

  it("derives active lower pane selections from legacy state", () => {
    const appearance = normalizeGpuChartAppearance({
      activeIndicatorPane: "macd",
    });

    expect(appearance.activeIndicatorPane).toBe("macd");
    expect(appearance.activeIndicatorPanes).toEqual(["macd"]);
  });

  it("clears active lower panes when minimized", () => {
    const appearance = normalizeGpuChartAppearance({
      activeIndicatorPane: "macd",
      activeIndicatorPanes: [],
      indicatorPaneMinimized: true,
    });

    expect(appearance.activeIndicatorPanes).toEqual([]);
  });

  it("keeps explicit active lower panes over a stale minimized flag", () => {
    const appearance = normalizeGpuChartAppearance({
      activeIndicatorPane: "stochRsi",
      activeIndicatorPanes: ["stochRsi", "relativeReturn"],
      indicatorPaneMinimized: true,
      showRelativeReturn: true,
    });

    expect(appearance.indicatorPaneMinimized).toBe(false);
    expect(appearance.activeIndicatorPane).toBe("stochRsi");
    expect(appearance.activeIndicatorPanes).toEqual(["stochRsi", "relativeReturn"]);
  });

  it("derives indicator instances from legacy show flags", () => {
    const appearance = normalizeGpuChartAppearance({
      showSma: false,
      showBollinger: true,
      showStochRsi: false,
      showMacd: false,
      showRelativeReturn: true,
      showVolume: false,
      showSrZones: true,
    });

    expect(appearance.indicators.find((item) => item.type === "sma")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "bollinger")?.enabled).toBe(true);
    expect(appearance.indicators.find((item) => item.type === "stochRsi")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "macd")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "relativeReturn")?.enabled).toBe(true);
    expect(appearance.indicators.find((item) => item.type === "volume")?.enabled).toBe(false);
    expect(appearance.indicators.find((item) => item.type === "srZones")?.enabled).toBe(true);
  });

  it("uses legacy moving average style fields when no instances are persisted", () => {
    const appearance = normalizeGpuChartAppearance({
      emaPeriod: 34,
      emaColor: "#14b8a6",
      indicators: "bad" as unknown as [],
    });

    const ema = appearance.indicators.find((item) => item.type === "ema");

    expect(ema?.period).toBe(34);
    expect(ema?.color).toBe("#14b8a6");
  });

  it("keeps grid and single chart styles separate", () => {
    const storage = new MemoryStorage();
    const single = saveGpuChartAppearance({ fontSize: 18 }, storage, "single");
    const grid = saveGpuChartAppearance({ fontSize: 11 }, storage, "grid");

    expect(loadGpuChartAppearance(storage, "single").fontSize).toBe(single.fontSize);
    expect(loadGpuChartAppearance(storage, "grid").fontSize).toBe(grid.fontSize);
  });

  it("persists custom chart scopes independently", () => {
    const storage = new MemoryStorage();

    const first = saveGpuChartAppearance({ fontSize: 16 }, storage, "single:chart-0");
    const second = saveGpuChartAppearance({ fontSize: 21 }, storage, "single:chart-1");

    expect(loadGpuChartAppearance(storage, "single:chart-0").fontSize).toBe(first.fontSize);
    expect(loadGpuChartAppearance(storage, "single:chart-1").fontSize).toBe(second.fontSize);
    expect(loadGpuChartAppearance(storage, "single").fontSize).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.fontSize,
    );
  });

  it("uses a smaller grid default", () => {
    const storage = new MemoryStorage();

    expect(loadGpuChartAppearance(storage, "grid").fontSize).toBe(
      DEFAULT_GRID_GPU_CHART_APPEARANCE.fontSize,
    );
    expect(loadGpuChartAppearance(storage, "single").fontSize).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.fontSize,
    );
    expect(loadGpuChartAppearance(storage, "grid").showStochRsi).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showStochRsi).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showRsi).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showRsi).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showMacd).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showMacd).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showAtr).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showAtr).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showRelativeReturn).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showRelativeReturn).toBe(false);
    expect(loadGpuChartAppearance(storage, "grid").showVolume).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showVolume).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showTimeAxis).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showTimeAxis).toBe(true);
    expect(loadGpuChartAppearance(storage, "grid").showWindowHighLow).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showWindowHighLow).toBe(true);
  });

  it("converts hex colors into renderer color channels", () => {
    expect(hexToRgb01("#336699")).toEqual([0.2, 0.4, 0.6]);
  });
});
