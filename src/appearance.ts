import { ref } from "vue";

export type GpuChartIndicatorPane = "stochRsi" | "rsi";

export interface GpuChartAppearance {
  backgroundColor: string;
  upColor: string;
  downColor: string;
  smaColor: string;
  emaColor: string;
  wmaColor: string;
  bollingerBasisColor: string;
  bollingerUpperColor: string;
  bollingerLowerColor: string;
  stochRsiKColor: string;
  stochRsiDColor: string;
  stochRsiRangeColor: string;
  rsiColor: string;
  rsiRangeColor: string;
  gridColor: string;
  textColor: string;
  crosshairColor: string;
  lastPriceColor: string;
  windowHighColor: string;
  windowLowColor: string;
  tooltipBackgroundColor: string;
  candleWidth: number;
  wickWidth: number;
  fontSize: number;
  smaPeriod: number;
  emaPeriod: number;
  wmaPeriod: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
  stochRsiRsiPeriod: number;
  stochRsiPeriod: number;
  stochRsiKPeriod: number;
  stochRsiDPeriod: number;
  stochRsiPaneHeight: number;
  stochRsiRangeLower: number;
  stochRsiRangeUpper: number;
  stochRsiSmooth: boolean;
  rsiPeriod: number;
  rsiRangeLower: number;
  rsiRangeUpper: number;
  rsiSmooth: boolean;
  activeIndicatorPane: GpuChartIndicatorPane;
  indicatorPaneMinimized: boolean;
  showGrid: boolean;
  showLastPriceLine: boolean;
  showWindowHighLow: boolean;
  showCrosshair: boolean;
  showTooltip: boolean;
  showBadge: boolean;
  showWma: boolean;
  showBollinger: boolean;
  showStochRsi: boolean;
  showRsi: boolean;
}

export const GPU_CHART_APPEARANCE_KEY = "gpu_chart_appearance_v1";
export type GpuChartAppearanceScope = "single" | "grid";

export const DEFAULT_GPU_CHART_APPEARANCE: GpuChartAppearance = {
  backgroundColor: "#03060b",
  upColor: "#54d986",
  downColor: "#db5151",
  smaColor: "#f2a12e",
  emaColor: "#1fc7f2",
  wmaColor: "#c084fc",
  bollingerBasisColor: "#94a3b8",
  bollingerUpperColor: "#38bdf8",
  bollingerLowerColor: "#38bdf8",
  stochRsiKColor: "#f59e0b",
  stochRsiDColor: "#a78bfa",
  stochRsiRangeColor: "#64748b",
  rsiColor: "#22c55e",
  rsiRangeColor: "#64748b",
  gridColor: "#27313d",
  textColor: "#aeb7c2",
  crosshairColor: "#e5edf7",
  lastPriceColor: "#f87171",
  windowHighColor: "#38bdf8",
  windowLowColor: "#f97316",
  tooltipBackgroundColor: "#05070c",
  candleWidth: 5,
  wickWidth: 1,
  fontSize: 14,
  smaPeriod: 20,
  emaPeriod: 20,
  wmaPeriod: 20,
  bollingerPeriod: 20,
  bollingerStdDev: 2,
  stochRsiRsiPeriod: 14,
  stochRsiPeriod: 14,
  stochRsiKPeriod: 3,
  stochRsiDPeriod: 3,
  stochRsiPaneHeight: 0.24,
  stochRsiRangeLower: 20,
  stochRsiRangeUpper: 80,
  stochRsiSmooth: false,
  rsiPeriod: 14,
  rsiRangeLower: 20,
  rsiRangeUpper: 80,
  rsiSmooth: false,
  activeIndicatorPane: "stochRsi",
  indicatorPaneMinimized: false,
  showGrid: true,
  showLastPriceLine: true,
  showWindowHighLow: true,
  showCrosshair: true,
  showTooltip: true,
  showBadge: true,
  showWma: false,
  showBollinger: false,
  showStochRsi: true,
  showRsi: true,
};

export const DEFAULT_GRID_GPU_CHART_APPEARANCE: GpuChartAppearance = {
  ...DEFAULT_GPU_CHART_APPEARANCE,
  candleWidth: 3,
  fontSize: 10,
  showWindowHighLow: false,
  showStochRsi: false,
  showRsi: false,
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function normalizeGpuChartAppearance(
  input: Partial<GpuChartAppearance> | null | undefined,
  scope: GpuChartAppearanceScope = "single",
): GpuChartAppearance {
  const value = input ?? {};
  const defaults = defaultGpuChartAppearance(scope);
  return {
    backgroundColor: colorValue(value.backgroundColor, defaults.backgroundColor),
    upColor: colorValue(value.upColor, defaults.upColor),
    downColor: colorValue(value.downColor, defaults.downColor),
    smaColor: colorValue(value.smaColor, defaults.smaColor),
    emaColor: colorValue(value.emaColor, defaults.emaColor),
    wmaColor: colorValue(value.wmaColor, defaults.wmaColor),
    bollingerBasisColor: colorValue(
      value.bollingerBasisColor,
      defaults.bollingerBasisColor,
    ),
    bollingerUpperColor: colorValue(
      value.bollingerUpperColor,
      defaults.bollingerUpperColor,
    ),
    bollingerLowerColor: colorValue(
      value.bollingerLowerColor,
      defaults.bollingerLowerColor,
    ),
    stochRsiKColor: colorValue(value.stochRsiKColor, defaults.stochRsiKColor),
    stochRsiDColor: colorValue(value.stochRsiDColor, defaults.stochRsiDColor),
    stochRsiRangeColor: colorValue(value.stochRsiRangeColor, defaults.stochRsiRangeColor),
    rsiColor: colorValue(value.rsiColor, defaults.rsiColor),
    rsiRangeColor: colorValue(value.rsiRangeColor, defaults.rsiRangeColor),
    gridColor: colorValue(value.gridColor, defaults.gridColor),
    textColor: colorValue(value.textColor, defaults.textColor),
    crosshairColor: colorValue(value.crosshairColor, defaults.crosshairColor),
    lastPriceColor: colorValue(value.lastPriceColor, defaults.lastPriceColor),
    windowHighColor: colorValue(value.windowHighColor, defaults.windowHighColor),
    windowLowColor: colorValue(value.windowLowColor, defaults.windowLowColor),
    tooltipBackgroundColor: colorValue(value.tooltipBackgroundColor, defaults.tooltipBackgroundColor),
    candleWidth: clampNumber(value.candleWidth, 1, 24, defaults.candleWidth),
    wickWidth: clampNumber(value.wickWidth, 0.5, 8, defaults.wickWidth),
    fontSize: clampNumber(value.fontSize, 10, 28, defaults.fontSize),
    smaPeriod: clampInteger(value.smaPeriod, 2, 250, defaults.smaPeriod),
    emaPeriod: clampInteger(value.emaPeriod, 2, 250, defaults.emaPeriod),
    wmaPeriod: clampInteger(value.wmaPeriod, 2, 250, defaults.wmaPeriod),
    bollingerPeriod: clampInteger(
      value.bollingerPeriod,
      2,
      250,
      defaults.bollingerPeriod,
    ),
    bollingerStdDev: clampNumber(
      value.bollingerStdDev,
      0.5,
      5,
      defaults.bollingerStdDev,
    ),
    stochRsiRsiPeriod: clampInteger(
      value.stochRsiRsiPeriod,
      2,
      100,
      defaults.stochRsiRsiPeriod,
    ),
    stochRsiPeriod: clampInteger(
      value.stochRsiPeriod,
      2,
      100,
      defaults.stochRsiPeriod,
    ),
    stochRsiKPeriod: clampInteger(
      value.stochRsiKPeriod,
      1,
      20,
      defaults.stochRsiKPeriod,
    ),
    stochRsiDPeriod: clampInteger(
      value.stochRsiDPeriod,
      1,
      20,
      defaults.stochRsiDPeriod,
    ),
    stochRsiPaneHeight: clampNumber(
      value.stochRsiPaneHeight,
      0.12,
      0.4,
      defaults.stochRsiPaneHeight,
    ),
    stochRsiRangeLower: clampNumber(
      value.stochRsiRangeLower,
      0,
      100,
      defaults.stochRsiRangeLower,
    ),
    stochRsiRangeUpper: clampNumber(
      value.stochRsiRangeUpper,
      0,
      100,
      defaults.stochRsiRangeUpper,
    ),
    stochRsiSmooth: boolValue(value.stochRsiSmooth, defaults.stochRsiSmooth),
    rsiPeriod: clampInteger(value.rsiPeriod, 2, 100, defaults.rsiPeriod),
    rsiRangeLower: clampNumber(value.rsiRangeLower, 0, 100, defaults.rsiRangeLower),
    rsiRangeUpper: clampNumber(value.rsiRangeUpper, 0, 100, defaults.rsiRangeUpper),
    rsiSmooth: boolValue(value.rsiSmooth, defaults.rsiSmooth),
    activeIndicatorPane: indicatorPaneValue(
      value.activeIndicatorPane,
      defaults.activeIndicatorPane,
    ),
    indicatorPaneMinimized: boolValue(
      value.indicatorPaneMinimized,
      defaults.indicatorPaneMinimized,
    ),
    showGrid: boolValue(value.showGrid, defaults.showGrid),
    showLastPriceLine: boolValue(value.showLastPriceLine, defaults.showLastPriceLine),
    showWindowHighLow: boolValue(value.showWindowHighLow, defaults.showWindowHighLow),
    showCrosshair: boolValue(value.showCrosshair, defaults.showCrosshair),
    showTooltip: boolValue(value.showTooltip, defaults.showTooltip),
    showBadge: boolValue(value.showBadge, defaults.showBadge),
    showWma: boolValue(value.showWma, defaults.showWma),
    showBollinger: boolValue(value.showBollinger, defaults.showBollinger),
    showStochRsi: boolValue(value.showStochRsi, defaults.showStochRsi),
    showRsi: boolValue(value.showRsi, defaults.showRsi),
  };
}

export function defaultGpuChartAppearance(scope: GpuChartAppearanceScope = "single") {
  return {
    ...(scope === "grid" ? DEFAULT_GRID_GPU_CHART_APPEARANCE : DEFAULT_GPU_CHART_APPEARANCE),
  };
}

export function loadGpuChartAppearance(
  storage = browserStorage(),
  scope: GpuChartAppearanceScope = "single",
): GpuChartAppearance {
  if (!storage) return defaultGpuChartAppearance(scope);
  try {
    const raw =
      storage.getItem(scopedAppearanceKey(scope)) ??
      (scope === "single" ? storage.getItem(GPU_CHART_APPEARANCE_KEY) : null);
    return normalizeGpuChartAppearance(raw ? JSON.parse(raw) : null, scope);
  } catch {
    return defaultGpuChartAppearance(scope);
  }
}

export function saveGpuChartAppearance(
  appearance: Partial<GpuChartAppearance>,
  storage = browserStorage(),
  scope: GpuChartAppearanceScope = "single",
) {
  const normalized = normalizeGpuChartAppearance(appearance, scope);
  storage?.setItem(scopedAppearanceKey(scope), JSON.stringify(normalized));
  return normalized;
}

export function resetGpuChartAppearance(
  storage = browserStorage(),
  scope: GpuChartAppearanceScope = "single",
) {
  storage?.removeItem(scopedAppearanceKey(scope));
  return defaultGpuChartAppearance(scope);
}

export function useGpuChartAppearance(
  scope: GpuChartAppearanceScope = "single",
  storage = browserStorage(),
) {
  const appearance = ref(loadGpuChartAppearance(storage, scope));
  function saveAppearance() {
    appearance.value = saveGpuChartAppearance(appearance.value, storage, scope);
  }
  function resetAppearance() {
    appearance.value = resetGpuChartAppearance(storage, scope);
  }
  return { appearance, saveAppearance, resetAppearance };
}

export function hexToRgb01(hex: string): [number, number, number] {
  const color = colorValue(hex, "#000000").slice(1);
  return [
    parseInt(color.slice(0, 2), 16) / 255,
    parseInt(color.slice(2, 4), 16) / 255,
    parseInt(color.slice(4, 6), 16) / 255,
  ];
}

export function hexToRgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb01(hex).map((part) => Math.round(part * 255));
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function scopedAppearanceKey(scope: GpuChartAppearanceScope) {
  return `${GPU_CHART_APPEARANCE_KEY}:${scope}`;
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function indicatorPaneValue(value: unknown, fallback: GpuChartIndicatorPane) {
  return value === "stochRsi" || value === "rsi" ? value : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  return Math.floor(clampNumber(value, min, max, fallback));
}
