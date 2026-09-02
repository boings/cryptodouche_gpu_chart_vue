import { ref } from "vue";

export type GpuChartIndicatorPane = "stochRsi" | "rsi" | "macd" | "atr" | "relativeReturn";
export type GpuChartIndicatorType =
  | "sma"
  | "ema"
  | "wma"
  | "bollinger"
  | "srZones"
  | "volume"
  | "stochRsi"
  | "rsi"
  | "macd"
  | "atr"
  | "relativeReturn";
export type GpuChartIndicatorPlacement = "price" | "lower";

export interface GpuChartIndicatorInstance {
  id: string;
  type: GpuChartIndicatorType;
  enabled: boolean;
  placement: GpuChartIndicatorPlacement;
  label?: string;
  period?: number;
  color?: string;
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
  srSupportZoneColor: string;
  srResistanceZoneColor: string;
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
  relativeReturnColor: string;
  relativeReturnZeroColor: string;
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
  srZoneLookback: number;
  srZonePivotStrength: number;
  srZoneMaxZones: number;
  srZoneThicknessBps: number;
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
  relativeReturnSmooth: boolean;
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
  showSrZones: boolean;
  showStochRsi: boolean;
  showRsi: boolean;
  showMacd: boolean;
  showAtr: boolean;
  showRelativeReturn: boolean;
  showVolume: boolean;
}

export const GPU_CHART_APPEARANCE_KEY = "gpu_chart_appearance_v1";
export type GpuChartAppearanceScope = "single" | "grid" | (string & {});
export const MAX_ACTIVE_GPU_CHART_INDICATOR_PANES = 3;

export type GpuChartMovingAverageIndicatorType = Extract<
  GpuChartIndicatorType,
  "sma" | "ema" | "wma"
>;
export type GpuChartMovingAveragePeriodKey = Extract<
  keyof GpuChartAppearance,
  "smaPeriod" | "emaPeriod" | "wmaPeriod"
>;
export type GpuChartMovingAverageColorKey = Extract<
  keyof GpuChartAppearance,
  "smaColor" | "emaColor" | "wmaColor"
>;

type IndicatorShowKey = Extract<
  keyof GpuChartAppearance,
  | "showSma"
  | "showEma"
  | "showWma"
  | "showBollinger"
  | "showSrZones"
  | "showVolume"
  | "showStochRsi"
  | "showRsi"
  | "showMacd"
  | "showAtr"
  | "showRelativeReturn"
>;

export const GPU_CHART_INDICATOR_TYPES: GpuChartIndicatorType[] = [
  "sma",
  "ema",
  "wma",
  "bollinger",
  "srZones",
  "volume",
  "stochRsi",
  "rsi",
  "macd",
  "atr",
  "relativeReturn",
];

export const GPU_CHART_MOVING_AVERAGE_INDICATOR_TYPES: GpuChartMovingAverageIndicatorType[] = [
  "sma",
  "ema",
  "wma",
];

export const GPU_CHART_MOVING_AVERAGE_PERIOD_KEY_BY_TYPE: Record<
  GpuChartMovingAverageIndicatorType,
  GpuChartMovingAveragePeriodKey
> = {
  sma: "smaPeriod",
  ema: "emaPeriod",
  wma: "wmaPeriod",
};

export const GPU_CHART_MOVING_AVERAGE_COLOR_KEY_BY_TYPE: Record<
  GpuChartMovingAverageIndicatorType,
  GpuChartMovingAverageColorKey
> = {
  sma: "smaColor",
  ema: "emaColor",
  wma: "wmaColor",
};

export const GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE: Record<
  GpuChartIndicatorType,
  GpuChartIndicatorPlacement
> = {
  sma: "price",
  ema: "price",
  wma: "price",
  bollinger: "price",
  srZones: "price",
  volume: "price",
  stochRsi: "lower",
  rsi: "lower",
  macd: "lower",
  atr: "lower",
  relativeReturn: "lower",
};

export const GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE: Record<
  GpuChartIndicatorType,
  IndicatorShowKey
> = {
  sma: "showSma",
  ema: "showEma",
  wma: "showWma",
  bollinger: "showBollinger",
  srZones: "showSrZones",
  volume: "showVolume",
  stochRsi: "showStochRsi",
  rsi: "showRsi",
  macd: "showMacd",
  atr: "showAtr",
  relativeReturn: "showRelativeReturn",
};

export const DEFAULT_GPU_CHART_INDICATORS: GpuChartIndicatorInstance[] = [
  { id: "sma", type: "sma", enabled: true, placement: "price", period: 20, color: "#f2a12e" },
  { id: "ema", type: "ema", enabled: true, placement: "price", period: 20, color: "#1fc7f2" },
  { id: "wma", type: "wma", enabled: false, placement: "price", period: 20, color: "#c084fc" },
  { id: "bollinger", type: "bollinger", enabled: false, placement: "price" },
  { id: "srZones", type: "srZones", enabled: false, placement: "price" },
  { id: "volume", type: "volume", enabled: true, placement: "price" },
  { id: "stochRsi", type: "stochRsi", enabled: true, placement: "lower" },
  { id: "rsi", type: "rsi", enabled: true, placement: "lower" },
  { id: "macd", type: "macd", enabled: true, placement: "lower" },
  { id: "atr", type: "atr", enabled: true, placement: "lower" },
  { id: "relativeReturn", type: "relativeReturn", enabled: false, placement: "lower" },
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
  srSupportZoneColor: "#22c55e",
  srResistanceZoneColor: "#ef4444",
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
  relativeReturnColor: "#34d399",
  relativeReturnZeroColor: "#64748b",
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
  srZoneLookback: 240,
  srZonePivotStrength: 3,
  srZoneMaxZones: 6,
  srZoneThicknessBps: 10,
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
  relativeReturnSmooth: false,
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
  showSrZones: false,
  showStochRsi: true,
  showRsi: true,
  showMacd: true,
  showAtr: true,
  showRelativeReturn: false,
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
    srSupportZoneColor: colorValue(value.srSupportZoneColor, defaults.srSupportZoneColor),
    srResistanceZoneColor: colorValue(
      value.srResistanceZoneColor,
      defaults.srResistanceZoneColor,
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
    relativeReturnColor: colorValue(
      value.relativeReturnColor,
      defaults.relativeReturnColor,
    ),
    relativeReturnZeroColor: colorValue(
      value.relativeReturnZeroColor,
      defaults.relativeReturnZeroColor,
    ),
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
    srZoneLookback: clampInteger(value.srZoneLookback, 20, 1000, defaults.srZoneLookback),
    srZonePivotStrength: clampInteger(
      value.srZonePivotStrength,
      1,
      20,
      defaults.srZonePivotStrength,
    ),
    srZoneMaxZones: clampInteger(value.srZoneMaxZones, 1, 12, defaults.srZoneMaxZones),
    srZoneThicknessBps: clampNumber(
      value.srZoneThicknessBps,
      1,
      100,
      defaults.srZoneThicknessBps,
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
    relativeReturnSmooth: boolValue(
      value.relativeReturnSmooth,
      defaults.relativeReturnSmooth,
    ),
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
    showSrZones: boolValue(value.showSrZones, defaults.showSrZones),
    showStochRsi: boolValue(value.showStochRsi, defaults.showStochRsi),
    showRsi: boolValue(value.showRsi, defaults.showRsi),
    showMacd: boolValue(value.showMacd, defaults.showMacd),
    showAtr: boolValue(value.showAtr, defaults.showAtr),
    showRelativeReturn: boolValue(value.showRelativeReturn, defaults.showRelativeReturn),
    showVolume: boolValue(value.showVolume, defaults.showVolume),
  };
  normalized.indicators = indicatorInstancesValue(value.indicators, normalized, defaults);
  syncIndicatorFlags(normalized);
  const hasExplicitIndicatorPanes = Array.isArray(value.activeIndicatorPanes);
  normalized.activeIndicatorPanes = indicatorPaneListValue(
    value.activeIndicatorPanes,
    normalized,
  );
  if (normalized.indicatorPaneMinimized && !normalized.activeIndicatorPanes.length) {
    normalized.activeIndicatorPanes = [];
  } else if (hasExplicitIndicatorPanes && normalized.activeIndicatorPanes.length) {
    normalized.indicatorPaneMinimized = false;
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
  if (appearance.indicators.some((item) => item.type === type)) {
    return appearance.indicators.some((item) => item.type === type && item.enabled);
  }
  return appearance[GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[type]];
}

export function gpuChartIndicatorCanAddInstance(
  type: GpuChartIndicatorType,
): type is GpuChartMovingAverageIndicatorType {
  return GPU_CHART_MOVING_AVERAGE_INDICATOR_TYPES.includes(
    type as GpuChartMovingAverageIndicatorType,
  );
}

export function gpuChartMovingAveragePeriod(
  appearance: GpuChartAppearance,
  indicator: GpuChartIndicatorInstance,
) {
  if (!gpuChartIndicatorCanAddInstance(indicator.type)) return 0;
  const key = GPU_CHART_MOVING_AVERAGE_PERIOD_KEY_BY_TYPE[indicator.type];
  return clampInteger(indicator.period, 2, 250, appearance[key]);
}

export function gpuChartMovingAverageColor(
  appearance: GpuChartAppearance,
  indicator: GpuChartIndicatorInstance,
) {
  if (!gpuChartIndicatorCanAddInstance(indicator.type)) return appearance.textColor;
  const key = GPU_CHART_MOVING_AVERAGE_COLOR_KEY_BY_TYPE[indicator.type];
  return colorValue(indicator.color, appearance[key]);
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
  return value === "stochRsi" ||
    value === "rsi" ||
    value === "macd" ||
    value === "atr" ||
    value === "relativeReturn"
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
    const seenIds = new Set<string>();
    return defaultIndicators.map((indicator) =>
      normalizedIndicatorInstance(
        {
          id: indicator.id,
          type: indicator.type,
          enabled: appearance[GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[indicator.type]],
          placement: indicator.placement,
          ...(indicator.label ? { label: indicator.label } : {}),
        },
        indicator,
        appearance,
        seenIds,
      ),
    );
  }

  const normalized: GpuChartIndicatorInstance[] = [];
  const presentTypes = new Set<GpuChartIndicatorType>();
  const seenIds = new Set<string>();
  const seenSingleInstanceTypes = new Set<GpuChartIndicatorType>();
  for (const item of value) {
    if (!isObjectRecord(item)) continue;
    const type = indicatorTypeValue(item.type);
    if (!type) continue;
    if (!gpuChartIndicatorCanAddInstance(type)) {
      if (seenSingleInstanceTypes.has(type)) continue;
      seenSingleInstanceTypes.add(type);
    }
    const defaultIndicator =
      defaultIndicators.find((indicator) => indicator.type === type) ?? defaultIndicatorForType(type);
    normalized.push(normalizedIndicatorInstance(item, defaultIndicator, appearance, seenIds));
    presentTypes.add(type);
  }

  for (const defaultIndicator of defaultIndicators) {
    if (presentTypes.has(defaultIndicator.type)) continue;
    normalized.push(
      normalizedIndicatorInstance(
        {
          id: defaultIndicator.id,
          type: defaultIndicator.type,
          enabled: defaultIndicator.enabled,
          placement: defaultIndicator.placement,
          ...(defaultIndicator.label ? { label: defaultIndicator.label } : {}),
        },
        defaultIndicator,
        appearance,
        seenIds,
      ),
    );
  }

  return normalized;
}

function syncIndicatorFlags(appearance: GpuChartAppearance) {
  for (const type of GPU_CHART_INDICATOR_TYPES) {
    const key = GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[type];
    if (appearance.indicators.some((item) => item.type === type)) {
      appearance[key] = appearance.indicators.some(
        (item) => item.type === type && item.enabled,
      );
    }
  }
}

function normalizedIndicatorInstance(
  source: Record<string, unknown> | GpuChartIndicatorInstance,
  defaultIndicator: GpuChartIndicatorInstance,
  appearance: GpuChartAppearance,
  seenIds: Set<string>,
): GpuChartIndicatorInstance {
  const type = defaultIndicator.type;
  const id = uniqueIndicatorId(
    type,
    typeof source.id === "string" && source.id.trim() ? source.id.trim() : defaultIndicator.id,
    seenIds,
  );
  const label =
    typeof source.label === "string" && source.label.trim() ? source.label.trim() : undefined;
  const indicator: GpuChartIndicatorInstance = {
    id,
    type,
    enabled: boolValue(source.enabled, defaultIndicator.enabled),
    placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[type],
    ...(label ? { label } : {}),
  };

  if (gpuChartIndicatorCanAddInstance(type)) {
    const periodKey = GPU_CHART_MOVING_AVERAGE_PERIOD_KEY_BY_TYPE[type];
    const colorKey = GPU_CHART_MOVING_AVERAGE_COLOR_KEY_BY_TYPE[type];
    indicator.period = clampInteger(source.period, 2, 250, appearance[periodKey]);
    indicator.color = colorValue(source.color, appearance[colorKey]);
  }

  return indicator;
}

function defaultIndicatorForType(type: GpuChartIndicatorType): GpuChartIndicatorInstance {
  return {
    id: type,
    type,
    enabled: true,
    placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[type],
  };
}

function uniqueIndicatorId(
  type: GpuChartIndicatorType,
  preferredId: string,
  seenIds: Set<string>,
) {
  const base = preferredId || type;
  let next = base;
  let suffix = 2;
  while (seenIds.has(next)) {
    next = `${base}-${suffix}`;
    suffix += 1;
  }
  seenIds.add(next);
  return next;
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
