import { describe, expect, it } from "vitest";

import {
  DEFAULT_GPU_CHART_APPEARANCE,
  DEFAULT_GRID_GPU_CHART_APPEARANCE,
  GPU_CHART_APPEARANCE_KEY,
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
      windowHighColor: "blue",
      showWindowHighLow: "yes" as unknown as boolean,
      activeIndicatorPane: "macd" as unknown as "rsi",
      indicatorPaneMinimized: "no" as unknown as boolean,
      showStochRsi: "yes" as unknown as boolean,
      showRsi: "yes" as unknown as boolean,
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
    expect(appearance.windowHighColor).toBe(DEFAULT_GPU_CHART_APPEARANCE.windowHighColor);
    expect(appearance.showWindowHighLow).toBe(DEFAULT_GPU_CHART_APPEARANCE.showWindowHighLow);
    expect(appearance.activeIndicatorPane).toBe(DEFAULT_GPU_CHART_APPEARANCE.activeIndicatorPane);
    expect(appearance.indicatorPaneMinimized).toBe(
      DEFAULT_GPU_CHART_APPEARANCE.indicatorPaneMinimized,
    );
    expect(appearance.showStochRsi).toBe(DEFAULT_GPU_CHART_APPEARANCE.showStochRsi);
    expect(appearance.showRsi).toBe(DEFAULT_GPU_CHART_APPEARANCE.showRsi);
    expect(appearance.showGrid).toBe(DEFAULT_GPU_CHART_APPEARANCE.showGrid);
  });

  it("loads and saves a partial style", () => {
    const storage = new MemoryStorage();
    const saved = saveGpuChartAppearance(
      {
        backgroundColor: "#111827",
        fontSize: 18,
        showBadge: false,
        showWma: true,
        showWindowHighLow: false,
        windowHighColor: "#0ea5e9",
        windowLowColor: "#fb923c",
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
        activeIndicatorPane: "rsi",
        indicatorPaneMinimized: true,
      },
      storage,
    );

    expect(saved.backgroundColor).toBe("#111827");
    expect(saved.fontSize).toBe(18);
    expect(saved.showBadge).toBe(false);
    expect(saved.showWma).toBe(true);
    expect(saved.showWindowHighLow).toBe(false);
    expect(saved.windowHighColor).toBe("#0ea5e9");
    expect(saved.windowLowColor).toBe("#fb923c");
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
    expect(saved.activeIndicatorPane).toBe("rsi");
    expect(saved.indicatorPaneMinimized).toBe(true);
    expect(JSON.parse(storage.getItem(`${GPU_CHART_APPEARANCE_KEY}:single`) ?? "{}")).toMatchObject({
      backgroundColor: "#111827",
      fontSize: 18,
      showBadge: false,
      showWma: true,
      showWindowHighLow: false,
      windowHighColor: "#0ea5e9",
      windowLowColor: "#fb923c",
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
      activeIndicatorPane: "rsi",
      indicatorPaneMinimized: true,
    });
    expect(loadGpuChartAppearance(storage)).toMatchObject(saved);
  });

  it("keeps grid and single chart styles separate", () => {
    const storage = new MemoryStorage();
    const single = saveGpuChartAppearance({ fontSize: 18 }, storage, "single");
    const grid = saveGpuChartAppearance({ fontSize: 11 }, storage, "grid");

    expect(loadGpuChartAppearance(storage, "single").fontSize).toBe(single.fontSize);
    expect(loadGpuChartAppearance(storage, "grid").fontSize).toBe(grid.fontSize);
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
    expect(loadGpuChartAppearance(storage, "grid").showWindowHighLow).toBe(false);
    expect(loadGpuChartAppearance(storage, "single").showWindowHighLow).toBe(true);
  });

  it("converts hex colors into renderer color channels", () => {
    expect(hexToRgb01("#336699")).toEqual([0.2, 0.4, 0.6]);
  });
});
