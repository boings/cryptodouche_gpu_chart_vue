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
      showStochRsi: "yes" as unknown as boolean,
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
    expect(appearance.showStochRsi).toBe(DEFAULT_GPU_CHART_APPEARANCE.showStochRsi);
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
        showStochRsi: false,
      },
      storage,
    );

    expect(saved.backgroundColor).toBe("#111827");
    expect(saved.fontSize).toBe(18);
    expect(saved.showBadge).toBe(false);
    expect(saved.showWma).toBe(true);
    expect(saved.showStochRsi).toBe(false);
    expect(JSON.parse(storage.getItem(`${GPU_CHART_APPEARANCE_KEY}:single`) ?? "{}")).toMatchObject({
      backgroundColor: "#111827",
      fontSize: 18,
      showBadge: false,
      showWma: true,
      showStochRsi: false,
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
  });

  it("converts hex colors into renderer color channels", () => {
    expect(hexToRgb01("#336699")).toEqual([0.2, 0.4, 0.6]);
  });
});
