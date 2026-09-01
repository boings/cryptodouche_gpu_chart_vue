import { ref } from "vue";

export type GpuChartIndicatorPane = "stochRsi" | "rsi" | "macd" | "atr";
export type GpuChartIndicatorType =
  | "sma"
  | "ema"
  | "wma"
  | "bollinger"
  | "volume"
  | "stochRsi"
  | "rsi"
  | "macd"
  | "atr";
export type GpuChartIndicatorPlacement = "price" | "lower";

export interface GpuChartIndicatorInstance {
  id: string;
  type: GpuChartIndicatorType;
  enabled: boolean;
  placement: GpuChartIndicatorPlacement;
  label?: string;
}

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
  macdLineColor: string;
  macdSignalColor: string;
  macdHistogramUpColor: string;
  macdHistogramDownColor: string;
  atrColor: string;
  volumeUpColor: string;
  volumeDownColor: string;
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
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  macdSmooth: boolean;
  atrPeriod: number;
  atrSmooth: boolean;
  volumeHeightRatio: number;
  volumeOpacity: number;
  activeIndicatorPane: GpuChartIndicatorPane;
  activeIndicatorPanes: GpuChartIndicatorPane[];
  indicatorPaneMinimized: boolean;
  indicators: GpuChartIndicatorInstance[];
  showGrid: boolean;
  showTimeAxis: boolean;
  showLastPriceLine: boolean;
  showWindowHighLow: boolean;
  showCrosshair: boolean;
  showTooltip: boolean;
  showBadge: boolean;
  showSma: boolean;
  showEma: boolean;
  showWma: boolean;
  showBollinger: boolean;
  showStochRsi: boolean;
  showRsi: boolean;
  showMacd: boolean;
  showAtr: boolean;
  showVolume: boolean;
}

export const GPU_CHART_APPEARANCE_KEY = "gpu_chart_appearance_v1";
export type GpuChartAppearanceScope = "single" | "grid" | (string & {});
export const MAX_ACTIVE_GPU_CHART_INDICATOR_PANES = 3;

type IndicatorShowKey = Extract<
  keyof GpuChartAppearance,
  | "showSma"
  | "showEma"
  | "showWma"
  | "showBollinger"
  | "showVolume"
  | "showStochRsi"
  | "showRsi"
  | "showMacd"
  | "showAtr"
>;

export const GPU_CHART_INDICATOR_TYPES: GpuChartIndicatorType[] = [
  "sma",
  "ema",
  "wma",
  "bollinger",
  "volume",
  "stochRsi",
  "rsi",
  "macd",
  "atr",
];

export const GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE: Record<
  GpuChartIndicatorType,
  GpuChartIndicatorPlacement
> = {
  sma: "price",
  ema: "price",
  wma: "price",
  bollinger: "price",
  volume: "price",
  stochRsi: "lower",
  rsi: "lower",
  macd: "lower",
  atr: "lower",
};

export const GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE: Record<
  GpuChartIndicatorType,
  IndicatorShowKey
> = {
  sma: "showSma",
  ema: "showEma",
  wma: "showWma",
  bollinger: "showBollinger",
  volume: "showVolume",
  stochRsi: "showStochRsi",
  rsi: "showRsi",
  macd: "showMacd",
  atr: "showAtr",
};

export const DEFAULT_GPU_CHART_INDICATORS: GpuChartIndicatorInstance[] = [
  { id: "sma", type: "sma", enabled: true, placement: "price" },
  { id: "ema", type: "ema", enabled: true, placement: "price" },
  { id: "wma", type: "wma", enabled: false, placement: "price" },
  { id: "bollinger", type: "bollinger", enabled: false, placement: "price" },
  { id: "volume", type: "volume", enabled: true, placement: "price" },
  { id: "stochRsi", type: "stochRsi", enabled: true, placement: "lower" },
  { id: "rsi", type: "rsi", enabled: true, placement: "lower" },
  { id: "macd", type: "macd", enabled: true, placement: "lower" },
  { id: "atr", type: "atr", enabled: true, placement: "lower" },
];

export const DEFAULT_GRID_GPU_CHART_INDICATORS: GpuChartIndicatorInstance[] =
  DEFAULT_GPU_CHART_INDICATORS.map((indicator) => ({
    ...indicator,
    enabled: indicator.type === "sma" || indicator.type === "ema",
  }));

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
  macdLineColor: "#38bdf8",
  macdSignalColor: "#f59e0b",
  macdHistogramUpColor: "#22c55e",
  macdHistogramDownColor: "#ef4444",
  atrColor: "#eab308",
  volumeUpColor: "#22c55e",
  volumeDownColor: "#ef4444",
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
  macdFastPeriod: 12,
  macdSlowPeriod: 26,
  macdSignalPeriod: 9,
  macdSmooth: false,
  atrPeriod: 14,
  atrSmooth: false,
  volumeHeightRatio: 0.18,
  volumeOpacity: 0.34,
  activeIndicatorPane: "stochRsi",
  activeIndicatorPanes: ["stochRsi"],
  indicatorPaneMinimized: false,
  indicators: cloneIndicatorInstances(DEFAULT_GPU_CHART_INDICATORS),
  showGrid: true,
  showTimeAxis: true,
  showLastPriceLine: true,
  showWindowHighLow: true,
  showCrosshair: true,
  showTooltip: true,
  showBadge: true,
  showSma: true,
  showEma: true,
  showWma: false,
  showBollinger: false,
  showStochRsi: true,
  showRsi: true,
  showMacd: true,
  showAtr: true,
  showVolume: true,
};

export const DEFAULT_GRID_GPU_CHART_APPEARANCE: GpuChartAppearance = {
  ...DEFAULT_GPU_CHART_APPEARANCE,
  indicators: cloneIndicatorInstances(DEFAULT_GRID_GPU_CHART_INDICATORS),
  candleWidth: 3,
  fontSize: 10,
  showWindowHighLow: false,
  showTimeAxis: false,
  showStochRsi: false,
  showRsi: false,
  showMacd: false,
  showAtr: false,
  showVolume: false,
  activeIndicatorPanes: [],
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
  const normalized: GpuChartAppearance = {
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
    macdLineColor: colorValue(value.macdLineColor, defaults.macdLineColor),
    macdSignalColor: colorValue(value.macdSignalColor, defaults.macdSignalColor),
    macdHistogramUpColor: colorValue(
      value.macdHistogramUpColor,
      defaults.macdHistogramUpColor,
    ),
    macdHistogramDownColor: colorValue(
      value.macdHistogramDownColor,
      defaults.macdHistogramDownColor,
    ),
    atrColor: colorValue(value.atrColor, defaults.atrColor),
    volumeUpColor: colorValue(value.volumeUpColor, defaults.volumeUpColor),
    volumeDownColor: colorValue(value.volumeDownColor, defaults.volumeDownColor),
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
    macdFastPeriod: clampInteger(value.macdFastPeriod, 2, 100, defaults.macdFastPeriod),
    macdSlowPeriod: clampInteger(value.macdSlowPeriod, 2, 200, defaults.macdSlowPeriod),
    macdSignalPeriod: clampInteger(
      value.macdSignalPeriod,
      1,
      100,
      defaults.macdSignalPeriod,
    ),
    macdSmooth: boolValue(value.macdSmooth, defaults.macdSmooth),
    atrPeriod: clampInteger(value.atrPeriod, 2, 100, defaults.atrPeriod),
    atrSmooth: boolValue(value.atrSmooth, defaults.atrSmooth),
    volumeHeightRatio: clampNumber(
      value.volumeHeightRatio,
      0.05,
      0.35,
      defaults.volumeHeightRatio,
    ),
    volumeOpacity: clampNumber(value.volumeOpacity, 0.05, 1, defaults.volumeOpacity),
    activeIndicatorPane: indicatorPaneValue(
      value.activeIndicatorPane,
      defaults.activeIndicatorPane,
    ),
    activeIndicatorPanes: [...defaults.activeIndicatorPanes],
    indicatorPaneMinimized: boolValue(
      value.indicatorPaneMinimized,
      defaults.indicatorPaneMinimized,
    ),
    indicators: [],
    showGrid: boolValue(value.showGrid, defaults.showGrid),
    showTimeAxis: boolValue(value.showTimeAxis, defaults.showTimeAxis),
    showLastPriceLine: boolValue(value.showLastPriceLine, defaults.showLastPriceLine),
    showWindowHighLow: boolValue(value.showWindowHighLow, defaults.showWindowHighLow),
    showCrosshair: boolValue(value.showCrosshair, defaults.showCrosshair),
    showTooltip: boolValue(value.showTooltip, defaults.showTooltip),
    showBadge: boolValue(value.showBadge, defaults.showBadge),
    showSma: boolValue(value.showSma, defaults.showSma),
    showEma: boolValue(value.showEma, defaults.showEma),
    showWma: boolValue(value.showWma, defaults.showWma),
    showBollinger: boolValue(value.showBollinger, defaults.showBollinger),
    showStochRsi: boolValue(value.showStochRsi, defaults.showStochRsi),
    showRsi: boolValue(value.showRsi, defaults.showRsi),
    showMacd: boolValue(value.showMacd, defaults.showMacd),
    showAtr: boolValue(value.showAtr, defaults.showAtr),
    showVolume: boolValue(value.showVolume, defaults.showVolume),
  };
  normalized.indicators = indicatorInstancesValue(value.indicators, normalized, defaults);
  syncIndicatorFlags(normalized);
  normalized.activeIndicatorPanes = indicatorPaneListValue(
    value.activeIndicatorPanes,
    normalized,
  );
  if (normalized.indicatorPaneMinimized) {
    normalized.activeIndicatorPanes = [];
  }
  if (
    !normalized.activeIndicatorPanes.length &&
    !normalized.indicatorPaneMinimized &&
    gpuChartIndicatorEnabled(normalized, normalized.activeIndicatorPane)
  ) {
    normalized.activeIndicatorPanes = [normalized.activeIndicatorPane];
  }
  normalized.activeIndicatorPane =
    normalized.activeIndicatorPanes[0] ?? normalized.activeIndicatorPane;
  return normalized;
}

export function defaultGpuChartAppearance(scope: GpuChartAppearanceScope = "single") {
  const defaults =
    scope === "grid" ? DEFAULT_GRID_GPU_CHART_APPEARANCE : DEFAULT_GPU_CHART_APPEARANCE;
  return {
    ...defaults,
    activeIndicatorPanes: [...defaults.activeIndicatorPanes],
    indicators: cloneIndicatorInstances(defaults.indicators),
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

export function gpuChartIndicatorEnabled(
  appearance: GpuChartAppearance,
  type: GpuChartIndicatorType,
) {
  const indicator = appearance.indicators.find((item) => item.type === type);
  if (indicator) return indicator.enabled;
  return appearance[GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[type]];
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
  return value === "stochRsi" || value === "rsi" || value === "macd" || value === "atr"
    ? value
    : fallback;
}

function indicatorPaneListValue(
  value: unknown,
  appearance: GpuChartAppearance,
) {
  const fallback = appearance.indicatorPaneMinimized
    ? []
    : [appearance.activeIndicatorPane];
  const source = Array.isArray(value) ? value : fallback;
  const panes: GpuChartIndicatorPane[] = [];
  for (const item of source) {
    const pane = indicatorPaneValue(item, appearance.activeIndicatorPane);
    if (
      panes.includes(pane) ||
      !gpuChartIndicatorEnabled(appearance, pane)
    ) {
      continue;
    }
    panes.push(pane);
    if (panes.length >= MAX_ACTIVE_GPU_CHART_INDICATOR_PANES) break;
  }
  return panes;
}

function indicatorInstancesValue(
  value: unknown,
  appearance: GpuChartAppearance,
  defaults: GpuChartAppearance,
) {
  const defaultIndicators = defaults.indicators.length
    ? defaults.indicators
    : DEFAULT_GPU_CHART_INDICATORS;
  if (!Array.isArray(value)) {
    return defaultIndicators.map((indicator) => ({
      ...indicator,
      enabled: appearance[GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[indicator.type]],
    }));
  }

  const byType = new Map<GpuChartIndicatorType, unknown>();
  for (const item of value) {
    if (!isObjectRecord(item)) continue;
    const type = indicatorTypeValue(item.type);
    if (!type || byType.has(type)) continue;
    byType.set(type, item);
  }

  return defaultIndicators.map((defaultIndicator) => {
    const source = byType.get(defaultIndicator.type);
    if (!isObjectRecord(source)) return { ...defaultIndicator };
    const id = typeof source.id === "string" && source.id.trim() ? source.id : defaultIndicator.id;
    const label =
      typeof source.label === "string" && source.label.trim() ? source.label.trim() : undefined;
    return {
      id,
      type: defaultIndicator.type,
      enabled: boolValue(source.enabled, defaultIndicator.enabled),
      placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[defaultIndicator.type],
      ...(label ? { label } : {}),
    };
  });
}

function syncIndicatorFlags(appearance: GpuChartAppearance) {
  for (const type of GPU_CHART_INDICATOR_TYPES) {
    const key = GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[type];
    const indicator = appearance.indicators.find((item) => item.type === type);
    if (indicator) appearance[key] = indicator.enabled;
  }
}

function indicatorTypeValue(value: unknown): GpuChartIndicatorType | null {
  return typeof value === "string" && GPU_CHART_INDICATOR_TYPES.includes(value as GpuChartIndicatorType)
    ? (value as GpuChartIndicatorType)
    : null;
}

function cloneIndicatorInstances(instances: GpuChartIndicatorInstance[]) {
  return instances.map((indicator) => ({ ...indicator }));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  return Math.floor(clampNumber(value, min, max, fallback));
}
