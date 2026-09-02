<template>
  <div
    ref="shellRef"
    class="gpu-chart-shell"
    :data-last-close="lastCloseText"
    :data-change-pct="changePctText"
    :data-live-updates="liveUpdates"
    :data-candle-count="candleCount"
    :data-view-min-x="viewMinX"
    :data-view-max-x="viewMaxX"
    :style="shellStyle"
    :class="{
      'gpu-chart-shell-link': openOnChartClickActive,
      'gpu-chart-shell-picking': anchoredVwapPickMode,
    }"
    @click="handleShellClick"
  >
    <canvas ref="canvasRef" class="gpu-chart-canvas"></canvas>
    <canvas ref="hudRef" class="gpu-chart-hud"></canvas>
    <div
      v-if="indicatorPaneVisible"
      class="gpu-chart-pane-divider"
      :class="{ resizing: indicatorPaneResizing }"
      :style="indicatorPaneDividerStyle"
      title="Drag to resize"
      @mousedown.stop.prevent="startIndicatorPaneResize"
      @dblclick.stop.prevent="resetIndicatorPaneHeight"
    ></div>
    <div
      v-for="header in indicatorPaneHeaders"
      :key="header.id"
      class="gpu-chart-indicator-toolbar"
      :style="indicatorPaneToolbarStyle(header)"
      @click.stop
      @mousedown.stop
      @dblclick.stop
    >
      <div class="gpu-chart-indicator-heading">
        <span class="gpu-chart-indicator-title">{{ header.label }}</span>
        <button
          type="button"
          class="gpu-chart-indicator-gear"
          :aria-expanded="indicatorSettingsOpen"
          :aria-label="`${header.label} settings`"
          :title="`${header.label} settings`"
          @click="toggleIndicatorSettings(header.id)"
        >
          &#9881;
        </button>
        <button
          type="button"
          class="gpu-chart-indicator-minimize"
          aria-label="Minimize indicator pane"
          title="Minimize indicator pane"
          @click="minimizeIndicatorPane(header.id)"
        >
          -
        </button>
        <span
          v-for="value in header.values"
          :key="`${header.id}-${value.className}-${value.label}`"
          class="gpu-chart-indicator-value"
          :class="value.className"
        >
          {{ value.label }} {{ value.value }}
        </span>
      </div>
    </div>
    <div
      v-if="indicatorSettingsOpen"
      ref="indicatorSettingsRef"
      class="gpu-chart-indicator-settings-modal"
      :style="indicatorSettingsModalStyle"
      @click.stop
      @mousedown.stop
      @dblclick.stop
      @wheel.stop
    >
      <div
        class="gpu-chart-indicator-settings-header"
        :class="{ dragging: indicatorSettingsDragging }"
        title="Drag to move"
        @mousedown.stop.prevent="startIndicatorSettingsDrag"
      >
        <span class="gpu-chart-indicator-settings-title">
          {{ activeIndicatorPaneLabel }} Settings
        </span>
        <button
          type="button"
          class="gpu-chart-indicator-settings-close"
          aria-label="Close indicator settings"
          title="Close"
          @click="closeIndicatorSettings"
        >
          x
        </button>
      </div>
      <div class="gpu-chart-indicator-settings-grid">
        <label
          v-for="field in activeIndicatorColorFields"
          :key="field.key"
          class="gpu-chart-indicator-field"
        >
          <span>{{ field.label }}</span>
          <input
            type="color"
            class="gpu-chart-indicator-color"
            :value="resolvedAppearance[field.key]"
            @input="setIndicatorColor(field.key, $event)"
          />
        </label>
        <label
          v-for="field in activeIndicatorNumberFields"
          :key="field.key"
          class="gpu-chart-indicator-field"
        >
          <span class="gpu-chart-indicator-range-label">
            <span>{{ field.label }}</span>
            <span>{{ formatIndicatorSetting(field.key) }}</span>
          </span>
          <input
            type="range"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            class="gpu-chart-indicator-range"
            :value="resolvedAppearance[field.key]"
            @input="setIndicatorNumber(field.key, $event)"
          />
        </label>
        <label
          v-for="field in activeIndicatorToggleFields"
          :key="field.key"
          class="gpu-chart-indicator-toggle"
        >
          <input
            type="checkbox"
            class="gpu-chart-indicator-check"
            :checked="resolvedAppearance[field.key]"
            @change="setIndicatorBool(field.key, $event)"
          />
          <span>{{ field.label }}</span>
        </label>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="chartSettingsOpen"
        ref="chartSettingsRef"
        class="gpu-chart-settings-modal"
        :style="chartSettingsModalStyle"
        @click.stop
        @mousedown.stop
        @dblclick.stop
        @wheel.stop
      >
        <div
          class="gpu-chart-settings-header"
          :class="{ dragging: chartSettingsDragging }"
          title="Drag to move"
          @mousedown.stop.prevent="startChartSettingsDrag"
        >
          <span class="gpu-chart-settings-title">{{ displaySymbol }} Settings</span>
          <button
            type="button"
            class="gpu-chart-settings-close"
            aria-label="Close chart settings"
            title="Close"
            @click="closeChartSettings"
          >
            x
          </button>
        </div>
        <div class="gpu-chart-settings-tabs">
          <button
            v-for="tab in chartSettingsTabs"
            :key="tab.id"
            type="button"
            class="gpu-chart-settings-tab"
            :class="{ active: chartSettingsTab === tab.id }"
            @click="chartSettingsTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="gpu-chart-settings-body">
          <div v-if="chartSettingsTab === 'appearance'" class="gpu-chart-settings-grid">
            <label
              v-for="field in chartAppearanceColorFields"
              :key="field.key"
              class="gpu-chart-settings-field"
            >
              <span>{{ field.label }}</span>
              <input
                type="color"
                class="gpu-chart-settings-color"
                :value="resolvedAppearance[field.key]"
                @input="setChartColor(field.key, $event)"
              />
            </label>
            <label
              v-for="field in chartAppearanceNumberFields"
              :key="field.key"
              class="gpu-chart-settings-field"
            >
              <span class="gpu-chart-settings-range-label">
                <span>{{ field.label }}</span>
                <span>{{ formatChartSetting(field.key) }}</span>
              </span>
              <input
                type="range"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                class="gpu-chart-settings-range"
                :value="resolvedAppearance[field.key]"
                @input="setChartNumber(field.key, $event)"
              />
            </label>
            <label
              v-for="field in chartDisplayToggleFields"
              :key="field.key"
              class="gpu-chart-settings-toggle"
            >
              <input
                type="checkbox"
                class="gpu-chart-settings-check"
                :checked="resolvedAppearance[field.key]"
                @change="setChartBool(field.key, $event)"
              />
              <span>{{ field.label }}</span>
            </label>
          </div>
          <div v-else class="gpu-chart-indicator-manager">
            <div class="gpu-chart-indicator-list">
              <div
                v-for="indicator in chartIndicatorRows"
                :key="indicator.id"
                class="gpu-chart-indicator-row"
                :class="{ selected: indicator.selected }"
              >
                <input
                  type="checkbox"
                  class="gpu-chart-settings-check"
                  :checked="indicator.enabled"
                  @click.stop
                  @mousedown.stop
                  @change="setChartIndicatorInstanceEnabled(indicator.id, $event)"
                />
                <button
                  type="button"
                  class="gpu-chart-indicator-row-main"
                  :aria-label="`${indicator.label} settings`"
                  @click="configureChartIndicator(indicator.id)"
                >
                  <span class="gpu-chart-indicator-row-text">
                    <span class="gpu-chart-indicator-row-label">{{ indicator.label }}</span>
                    <span class="gpu-chart-indicator-row-meta">{{ indicator.meta }}</span>
                  </span>
                </button>
                <div class="gpu-chart-indicator-row-actions">
                  <button
                    v-if="indicator.canAdd"
                    type="button"
                    class="gpu-chart-indicator-config-button"
                    :aria-label="`Add ${indicator.type.toUpperCase()}`"
                    :title="`Add ${indicator.type.toUpperCase()}`"
                    @click="addChartIndicatorInstance(indicator.type)"
                  >
                    +
                  </button>
                  <button
                    v-if="indicator.canRemove"
                    type="button"
                    class="gpu-chart-indicator-config-button"
                    :aria-label="`Remove ${indicator.label}`"
                    :title="`Remove ${indicator.label}`"
                    @click="removeChartIndicatorInstance(indicator.id)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    class="gpu-chart-indicator-config-button"
                    :aria-label="`${indicator.label} settings`"
                    :title="`${indicator.label} settings`"
                    @click="configureChartIndicator(indicator.id)"
                  >
                    &#9881;
                  </button>
                </div>
              </div>
            </div>
            <div
              v-if="selectedChartIndicatorOption"
              class="gpu-chart-selected-indicator-settings"
            >
              <div class="gpu-chart-selected-indicator-header">
                <span>{{ selectedChartIndicatorLabel }}</span>
                <span>{{ selectedChartIndicatorPlacement }}</span>
              </div>
              <div v-if="selectedMovingAverageIndicator" class="gpu-chart-settings-grid compact">
                <label class="gpu-chart-settings-field">
                  <span>Color</span>
                  <input
                    type="color"
                    class="gpu-chart-settings-color"
                    :value="selectedMovingAverageColor"
                    @input="setSelectedMovingAverageColor"
                  />
                </label>
                <label class="gpu-chart-settings-field">
                  <span class="gpu-chart-settings-range-label">
                    <span>Period</span>
                    <span>{{ selectedMovingAveragePeriod }}</span>
                  </span>
                  <input
                    type="range"
                    min="2"
                    max="250"
                    step="1"
                    class="gpu-chart-settings-range"
                    :value="selectedMovingAveragePeriod"
                    @input="setSelectedMovingAveragePeriod"
                  />
                </label>
              </div>
              <div v-else class="gpu-chart-settings-grid compact">
                <label
                  v-for="field in selectedChartIndicatorOption.colorFields"
                  :key="field.key"
                  class="gpu-chart-settings-field"
                >
                  <span>{{ field.label }}</span>
                  <input
                    type="color"
                    class="gpu-chart-settings-color"
                    :value="resolvedAppearance[field.key]"
                    @input="setChartIndicatorColor(field.key, $event)"
                  />
                </label>
                <label
                  v-for="field in selectedChartIndicatorOption.numberFields"
                  :key="field.key"
                  class="gpu-chart-settings-field"
                >
                  <span class="gpu-chart-settings-range-label">
                    <span>{{ field.label }}</span>
                    <span>{{ formatChartSetting(field.key) }}</span>
                  </span>
                  <input
                    type="range"
                    :min="field.min"
                    :max="field.max"
                    :step="field.step"
                    class="gpu-chart-settings-range"
                    :value="resolvedAppearance[field.key]"
                    @input="setChartIndicatorNumber(field.key, $event)"
                  />
                </label>
                <label
                  v-for="field in selectedChartIndicatorOption.toggleFields"
                  :key="field.key"
                  class="gpu-chart-settings-toggle"
                >
                  <input
                    type="checkbox"
                    class="gpu-chart-settings-check"
                    :checked="resolvedAppearance[field.key]"
                    @change="setChartIndicatorBool(field.key, $event)"
                  />
                  <span>{{ field.label }}</span>
                </label>
                <div
                  v-if="selectedChartIndicatorIsAnchoredVwap"
                  class="gpu-chart-avwap-actions"
                >
                  <button
                    type="button"
                    class="gpu-chart-avwap-action"
                    :class="{ active: anchoredVwapPickMode }"
                    @click="startAnchoredVwapPick"
                  >
                    {{ anchoredVwapPickMode ? "Picking" : "Pick Candle" }}
                  </button>
                  <button
                    type="button"
                    class="gpu-chart-avwap-action"
                    @click="setAnchoredVwapAnchorFromRecentSwing('SwingLow')"
                  >
                    Swing Low
                  </button>
                  <button
                    type="button"
                    class="gpu-chart-avwap-action"
                    @click="setAnchoredVwapAnchorFromRecentSwing('SwingHigh')"
                  >
                    Swing High
                  </button>
                  <button
                    type="button"
                    class="gpu-chart-avwap-action"
                    @click="setAnchoredVwapAnchorFromLastBreak"
                  >
                    Last Break
                  </button>
                  <button
                    type="button"
                    class="gpu-chart-avwap-action"
                    @click="clearAnchoredVwapAnchor"
                  >
                    Clear
                  </button>
                  <span class="gpu-chart-avwap-anchor">
                    {{ anchoredVwapAnchorLabel }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="gpu-chart-settings-actions">
          <button type="button" class="gpu-chart-settings-action" @click="resetChartSettings">
            Reset
          </button>
          <button
            type="button"
            class="gpu-chart-settings-action primary"
            @click="saveChartSettings"
          >
            Save
          </button>
        </div>
        <div
          class="gpu-chart-settings-resize"
          :class="{ resizing: chartSettingsResizing }"
          aria-hidden="true"
          @mousedown.stop.prevent="startChartSettingsResize"
        ></div>
      </div>
    </Teleport>
    <div
      v-if="indicatorTabsVisible"
      class="gpu-chart-indicator-tabs"
      :style="indicatorPaneTabsStyle"
      @click.stop
      @mousedown.stop
      @dblclick.stop
      @wheel.stop
    >
      <button
        v-for="tab in indicatorPaneTabs"
        :key="tab.id"
        type="button"
        class="gpu-chart-indicator-tab"
        :class="{
          active: indicatorPaneTabActive(tab.id),
          disabled: indicatorPaneTabDisabled(tab.id),
        }"
        :aria-pressed="indicatorPaneTabActive(tab.id)"
        :disabled="indicatorPaneTabDisabled(tab.id)"
        @click="selectIndicatorPane(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <component
      v-if="resolvedAppearance.showBadge"
      :is="badgeComponent"
      class="gpu-chart-badge"
      :class="{ 'gpu-chart-badge-link': openOnChartClickActive }"
      v-bind="badgeProps"
    >
      <span class="gpu-chart-dot" :class="{ live: streaming }"></span>
      <span class="gpu-chart-symbol">{{ displaySymbol }}</span>
      <button
        v-if="chartSettingsEnabled"
        type="button"
        class="gpu-chart-badge-gear"
        :aria-expanded="chartSettingsOpen"
        :aria-label="`${displaySymbol} settings`"
        :title="`${displaySymbol} settings`"
        @click.stop.prevent="toggleChartSettings"
      >
        &#9881;
      </button>
      <span v-if="lastCloseText" class="gpu-chart-price">{{ lastCloseText }}</span>
      <span v-if="changePctText" class="gpu-chart-change" :class="changeClass">
        {{ changePctText }}
      </span>
      <select
        v-if="timeframeSelectable"
        class="gpu-chart-timeframe-select"
        :value="displayTimeframe"
        :aria-label="`${displaySymbol} timeframe`"
        title="Timeframe"
        @click.stop
        @mousedown.stop
        @dblclick.stop
        @change="setDisplayTimeframe"
      >
        <option v-for="option in selectableTimeframes" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <span v-else class="gpu-chart-timeframe">{{ displayTimeframe }}</span>
      <span
        v-if="anchoredVwapDistanceText"
        class="gpu-chart-avwap-distance"
        :class="anchoredVwapDistanceClass"
      >
        {{ anchoredVwapDistanceText }}
      </span>
      <span
        v-if="structureSummaryText"
        class="gpu-chart-structure-summary"
        :class="structureSummaryClass"
      >
        {{ structureSummaryText }}
      </span>
    </component>
    <button
      v-else-if="chartSettingsEnabled"
      type="button"
      class="gpu-chart-floating-settings"
      :aria-expanded="chartSettingsOpen"
      :aria-label="`${displaySymbol} settings`"
      :title="`${displaySymbol} settings`"
      @click.stop.prevent="toggleChartSettings"
    >
      &#9881;
    </button>
    <div v-if="loading" class="gpu-chart-state">Loading</div>
    <div v-else-if="error" class="gpu-chart-state error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type {
  CandleRecord,
  GpuChartDataAdapter,
  GpuChartDataQuery,
  GpuChartOpenPayload,
  GpuChartTimeSyncAction,
  GpuChartTimeSyncCommand,
  GpuChartTimeWindow,
  GpuSeriesState,
  ViewBounds,
} from "./types";
import type { GpuChartHandle } from "./wasm";
import {
  appendSyntheticCandle,
  candlesToBytes,
  computeCloseChangePct,
  computeViewBounds,
  makeSyntheticCandles,
  mergeLiveCandle,
  normalizeRestTimeframe,
  packHistoricalCandles,
  prependHistoricalCandles,
} from "./data";
import {
  computeAnchoredVwapLine,
  computeAnchoredVwapSignals,
  computeAnchoredVwapSnapshot,
  computeAtrLine,
  computeBollingerBands,
  computeEmaLine,
  computeMacd,
  computeMarketStructure,
  computeRelativeCumulativeReturnLine,
  computeRsiLine,
  computeSmaLine,
  computeStochRsi,
  computeSupportResistanceZones,
  computeWmaLine,
  lineToBytes,
  type AnchoredVwapSignal,
  type MarketStructureState,
  type StructureBreak,
  type StructureSummaryState,
  type SupportResistanceZone,
  type SwingPoint,
  type SwingPointKind,
} from "./indicators";
import {
  GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE,
  GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE,
  GPU_CHART_MOVING_AVERAGE_COLOR_KEY_BY_TYPE,
  GPU_CHART_MOVING_AVERAGE_PERIOD_KEY_BY_TYPE,
  MAX_ACTIVE_GPU_CHART_INDICATOR_PANES,
  defaultGpuChartAppearance,
  gpuChartIndicatorCanAddInstance,
  gpuChartIndicatorEnabled as appearanceIndicatorEnabled,
  gpuChartMovingAverageColor,
  gpuChartMovingAveragePeriod,
  hexToRgb01,
  hexToRgba,
  normalizeGpuChartAppearance,
  type GpuChartAppearance,
  type GpuChartIndicatorInstance,
  type GpuChartIndicatorPane,
  type GpuChartIndicatorPlacement,
  type GpuChartIndicatorType,
  type GpuChartMovingAverageIndicatorType,
} from "./appearance";
import { sliverGapBarWidth } from "./bars";
import { cancelScheduledGpuRender, scheduleGpuRender } from "./scheduler";
import {
  estimateTimeAxisLabelWidth,
  formatTimeAxisLabel,
  timeAxisStepSeconds,
} from "./timeAxis";
import {
  clampXView,
  computeVisibleYBounds,
  isFollowingLatest,
  isYBoundsClose,
  RIGHT_EDGE_PADDING_CANDLES,
  reserveLowerPaneYBounds,
  scaleYView,
  smoothVisibleYBounds,
  timeWindowToXBounds,
  viewBoundsToTimeWindow,
  withRightPadding,
  wheelZoomScale,
} from "./viewport";
import { loadGpuChartModule } from "./wasm";

const LINE_SLOTS = [0, 1, 2, 3, 4, 5] as const;
const PRICE_SCALE_DRAG_WIDTH_PX = 76;
const Y_AXIS_SCALE_SENSITIVITY_PX = 180;
const WHEEL_GESTURE_QUIET_MS = 180;
const SMOOTH_X_EASE = 0.32;
const SMOOTH_X_EPSILON_CANDLES = 0.002;
const MIN_INDICATOR_PANE_HEIGHT_PX = 88;
const MIN_PRICE_PANE_HEIGHT_PX = 180;
const INDICATOR_TAB_BAR_HEIGHT_PX = 30;
const MAX_STACKED_INDICATOR_PANE_HEIGHT_RATIO = 0.62;
const MIN_INDICATOR_WARMUP_CANDLES = 160;
const MAX_HISTORY_LOAD_CANDLES = 5000;
const RIGHT_LABEL_MIN_RESERVE_PX = 88;
const DEFAULT_INDICATOR_PANE_HEIGHT_RATIO = 0.24;
const MIN_INDICATOR_PANE_HEIGHT_RATIO = 0.12;
const MAX_INDICATOR_PANE_HEIGHT_RATIO = 0.4;
const DEFAULT_CHART_SETTINGS_WIDTH_PX = 560;
const DEFAULT_CHART_SETTINGS_HEIGHT_PX = 500;
const MIN_CHART_SETTINGS_WIDTH_PX = 360;
const MIN_CHART_SETTINGS_HEIGHT_PX = 320;
const CHART_SETTINGS_VIEWPORT_PADDING_PX = 12;
const MOVING_AVERAGE_PERIOD_SUGGESTIONS: Record<
  GpuChartMovingAverageIndicatorType,
  number[]
> = {
  sma: [20, 50, 100, 200, 9, 21],
  ema: [9, 21, 50, 100, 200, 20],
  wma: [20, 50, 100, 200, 9, 21],
};
const MOVING_AVERAGE_COLOR_SUGGESTIONS = [
  "#1fc7f2",
  "#f59e0b",
  "#a78bfa",
  "#22c55e",
  "#f97316",
  "#e879f9",
  "#38bdf8",
];

interface IndicatorPaneLayout {
  id: GpuChartIndicatorPane;
  top: number;
  bottom: number;
  height: number;
  innerTop: number;
  innerBottom: number;
  innerHeight: number;
}

interface HudLabelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

type IndicatorColorField = Extract<
  keyof GpuChartAppearance,
  | "stochRsiKColor"
  | "stochRsiDColor"
  | "stochRsiRangeColor"
  | "rsiColor"
  | "rsiRangeColor"
  | "macdLineColor"
  | "macdSignalColor"
  | "macdHistogramUpColor"
  | "macdHistogramDownColor"
  | "atrColor"
  | "relativeReturnColor"
  | "relativeReturnZeroColor"
>;
type IndicatorNumberField = Extract<
  keyof GpuChartAppearance,
  | "stochRsiRsiPeriod"
  | "stochRsiPeriod"
  | "stochRsiKPeriod"
  | "stochRsiDPeriod"
  | "stochRsiRangeLower"
  | "stochRsiRangeUpper"
  | "rsiPeriod"
  | "rsiRangeLower"
  | "rsiRangeUpper"
  | "macdFastPeriod"
  | "macdSlowPeriod"
  | "macdSignalPeriod"
  | "atrPeriod"
>;
type IndicatorToggleField = Extract<
  keyof GpuChartAppearance,
  "stochRsiSmooth" | "rsiSmooth" | "macdSmooth" | "atrSmooth" | "relativeReturnSmooth"
>;
type ChartSettingsTab = "indicators" | "appearance";
type ChartSettingsColorField = Extract<
  keyof GpuChartAppearance,
  | "backgroundColor"
  | "upColor"
  | "downColor"
  | "gridColor"
  | "textColor"
  | "crosshairColor"
  | "lastPriceColor"
  | "windowHighColor"
  | "windowLowColor"
  | "tooltipBackgroundColor"
>;
type ChartSettingsNumberField = Extract<
  keyof GpuChartAppearance,
  "candleWidth" | "wickWidth" | "fontSize"
>;
type ChartSettingsToggleField = Extract<
  keyof GpuChartAppearance,
  | "showGrid"
  | "showTimeAxis"
  | "showLastPriceLine"
  | "showWindowHighLow"
  | "showCrosshair"
  | "showTooltip"
  | "showBadge"
>;
type ChartIndicatorColorField = Extract<
  keyof GpuChartAppearance,
  | "smaColor"
  | "emaColor"
  | "wmaColor"
  | "bollingerBasisColor"
  | "bollingerUpperColor"
  | "bollingerLowerColor"
  | "srSupportZoneColor"
  | "srResistanceZoneColor"
  | "marketStructureHighColor"
  | "marketStructureLowColor"
  | "marketStructureBreakColor"
  | "anchoredVwapColor"
  | "anchoredVwapAnchorColor"
  | "volumeUpColor"
  | "volumeDownColor"
  | "stochRsiKColor"
  | "stochRsiDColor"
  | "stochRsiRangeColor"
  | "rsiColor"
  | "rsiRangeColor"
  | "macdLineColor"
  | "macdSignalColor"
  | "macdHistogramUpColor"
  | "macdHistogramDownColor"
  | "atrColor"
  | "relativeReturnColor"
  | "relativeReturnZeroColor"
>;
type ChartIndicatorNumberField = Extract<
  keyof GpuChartAppearance,
  | "smaPeriod"
  | "emaPeriod"
  | "wmaPeriod"
  | "bollingerPeriod"
  | "bollingerStdDev"
  | "srZoneLookback"
  | "srZonePivotStrength"
  | "srZoneMaxZones"
  | "srZoneThicknessBps"
  | "marketStructureLookback"
  | "marketStructurePivotStrength"
  | "marketStructureAtrPeriod"
  | "marketStructureMinMoveAtr"
  | "marketStructureMaxLabels"
  | "volumeHeightRatio"
  | "volumeOpacity"
  | "stochRsiRsiPeriod"
  | "stochRsiPeriod"
  | "stochRsiKPeriod"
  | "stochRsiDPeriod"
  | "stochRsiRangeLower"
  | "stochRsiRangeUpper"
  | "rsiPeriod"
  | "rsiRangeLower"
  | "rsiRangeUpper"
  | "macdFastPeriod"
  | "macdSlowPeriod"
  | "macdSignalPeriod"
  | "atrPeriod"
>;
type ChartIndicatorToggleField = IndicatorToggleField;
type ChartNumberField = ChartSettingsNumberField | ChartIndicatorNumberField;

interface ChartIndicatorOption {
  type: GpuChartIndicatorType;
  label: string;
  placement: GpuChartIndicatorPlacement;
  colorFields: Array<{ key: ChartIndicatorColorField; label: string }>;
  toggleFields: Array<{ key: ChartIndicatorToggleField; label: string }>;
  numberFields: Array<{
    key: ChartIndicatorNumberField;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
}

interface ChartIndicatorRow {
  id: string;
  type: GpuChartIndicatorType;
  label: string;
  meta: string;
  enabled: boolean;
  selected: boolean;
  canAdd: boolean;
  canRemove: boolean;
}

interface IndicatorPaneOption {
  id: GpuChartIndicatorPane;
  label: string;
  colorFields: Array<{ key: IndicatorColorField; label: string }>;
  toggleFields: Array<{ key: IndicatorToggleField; label: string }>;
  numberFields: Array<{
    key: IndicatorNumberField;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
}

interface IndicatorHeaderValue {
  label: string;
  value: string;
  className: string;
}

interface IndicatorPaneHeader {
  id: GpuChartIndicatorPane;
  label: string;
  top: number;
  values: IndicatorHeaderValue[];
}

interface IndicatorPaneDrawResult {
  pane: IndicatorPaneLayout;
  series: IndicatorPaneSeries;
}

interface IndicatorRangeBand {
  lower: number;
  upper: number;
  color: string;
}

interface IndicatorValueScale {
  min: number;
  max: number;
}

interface VisibleWindowExtrema {
  high: number;
  low: number;
}

type IndicatorPaneSeries =
  | { id: "stochRsi"; k: Float32Array; d: Float32Array }
  | { id: "rsi"; rsi: Float32Array }
  | { id: "macd"; macd: Float32Array; signal: Float32Array; histogram: Float32Array }
  | { id: "atr"; atr: Float32Array }
  | { id: "relativeReturn"; relativeReturn: Float32Array };

const stochRsiColorFields: IndicatorPaneOption["colorFields"] = [
  { key: "stochRsiKColor", label: "K Color" },
  { key: "stochRsiDColor", label: "D Color" },
  { key: "stochRsiRangeColor", label: "Range Color" },
];
const stochRsiNumberFields: IndicatorPaneOption["numberFields"] = [
  { key: "stochRsiRsiPeriod", label: "RSI Period", min: 2, max: 100, step: 1 },
  { key: "stochRsiPeriod", label: "Stoch Period", min: 2, max: 100, step: 1 },
  { key: "stochRsiKPeriod", label: "K Smooth", min: 1, max: 20, step: 1 },
  { key: "stochRsiDPeriod", label: "D Smooth", min: 1, max: 20, step: 1 },
  { key: "stochRsiRangeLower", label: "Range Low", min: 0, max: 100, step: 1 },
  { key: "stochRsiRangeUpper", label: "Range High", min: 0, max: 100, step: 1 },
];
const stochRsiToggleFields: IndicatorPaneOption["toggleFields"] = [
  { key: "stochRsiSmooth", label: "Smooth Line" },
];
const rsiColorFields: IndicatorPaneOption["colorFields"] = [
  { key: "rsiColor", label: "RSI Color" },
  { key: "rsiRangeColor", label: "Range Color" },
];
const rsiNumberFields: IndicatorPaneOption["numberFields"] = [
  { key: "rsiPeriod", label: "RSI Period", min: 2, max: 100, step: 1 },
  { key: "rsiRangeLower", label: "Range Low", min: 0, max: 100, step: 1 },
  { key: "rsiRangeUpper", label: "Range High", min: 0, max: 100, step: 1 },
];
const rsiToggleFields: IndicatorPaneOption["toggleFields"] = [
  { key: "rsiSmooth", label: "Smooth Line" },
];
const macdColorFields: IndicatorPaneOption["colorFields"] = [
  { key: "macdLineColor", label: "MACD Color" },
  { key: "macdSignalColor", label: "Signal Color" },
  { key: "macdHistogramUpColor", label: "Histogram Up" },
  { key: "macdHistogramDownColor", label: "Histogram Down" },
];
const macdNumberFields: IndicatorPaneOption["numberFields"] = [
  { key: "macdFastPeriod", label: "Fast EMA", min: 2, max: 100, step: 1 },
  { key: "macdSlowPeriod", label: "Slow EMA", min: 2, max: 200, step: 1 },
  { key: "macdSignalPeriod", label: "Signal EMA", min: 1, max: 100, step: 1 },
];
const macdToggleFields: IndicatorPaneOption["toggleFields"] = [
  { key: "macdSmooth", label: "Smooth Lines" },
];
const atrColorFields: IndicatorPaneOption["colorFields"] = [
  { key: "atrColor", label: "ATR Color" },
];
const atrNumberFields: IndicatorPaneOption["numberFields"] = [
  { key: "atrPeriod", label: "ATR Period", min: 2, max: 100, step: 1 },
];
const atrToggleFields: IndicatorPaneOption["toggleFields"] = [
  { key: "atrSmooth", label: "Smooth Line" },
];
const relativeReturnColorFields: IndicatorPaneOption["colorFields"] = [
  { key: "relativeReturnColor", label: "Line Color" },
  { key: "relativeReturnZeroColor", label: "Zero Line" },
];
const relativeReturnToggleFields: IndicatorPaneOption["toggleFields"] = [
  { key: "relativeReturnSmooth", label: "Smooth Line" },
];
const INDICATOR_PANES: IndicatorPaneOption[] = [
  {
    id: "stochRsi",
    label: "Stoch RSI",
    colorFields: stochRsiColorFields,
    toggleFields: stochRsiToggleFields,
    numberFields: stochRsiNumberFields,
  },
  {
    id: "rsi",
    label: "RSI",
    colorFields: rsiColorFields,
    toggleFields: rsiToggleFields,
    numberFields: rsiNumberFields,
  },
  {
    id: "macd",
    label: "MACD",
    colorFields: macdColorFields,
    toggleFields: macdToggleFields,
    numberFields: macdNumberFields,
  },
  {
    id: "atr",
    label: "ATR",
    colorFields: atrColorFields,
    toggleFields: atrToggleFields,
    numberFields: atrNumberFields,
  },
  {
    id: "relativeReturn",
    label: "RS vs BTC",
    colorFields: relativeReturnColorFields,
    toggleFields: relativeReturnToggleFields,
    numberFields: [],
  },
];
const chartSettingsTabs: Array<{ id: ChartSettingsTab; label: string }> = [
  { id: "indicators", label: "Indicators" },
  { id: "appearance", label: "Appearance" },
];
const chartAppearanceColorFields: Array<{ key: ChartSettingsColorField; label: string }> = [
  { key: "backgroundColor", label: "Background" },
  { key: "upColor", label: "Up" },
  { key: "downColor", label: "Down" },
  { key: "gridColor", label: "Grid" },
  { key: "textColor", label: "Text" },
  { key: "crosshairColor", label: "Crosshair" },
  { key: "lastPriceColor", label: "Last Price" },
  { key: "windowHighColor", label: "Window High" },
  { key: "windowLowColor", label: "Window Low" },
  { key: "tooltipBackgroundColor", label: "Tooltip" },
];
const chartAppearanceNumberFields: Array<{
  key: ChartSettingsNumberField;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "candleWidth", label: "Candle Width", min: 1, max: 24, step: 0.5 },
  { key: "wickWidth", label: "Wick Width", min: 0.5, max: 8, step: 0.5 },
  { key: "fontSize", label: "Font Size", min: 10, max: 28, step: 1 },
];
const chartDisplayToggleFields: Array<{ key: ChartSettingsToggleField; label: string }> = [
  { key: "showGrid", label: "Grid" },
  { key: "showTimeAxis", label: "Time Axis" },
  { key: "showLastPriceLine", label: "Last Price" },
  { key: "showWindowHighLow", label: "Window High/Low" },
  { key: "showCrosshair", label: "Crosshair" },
  { key: "showTooltip", label: "Tooltip" },
  { key: "showBadge", label: "Badge" },
];
const chartBollingerColorFields: Array<{ key: ChartIndicatorColorField; label: string }> = [
  { key: "bollingerBasisColor", label: "Basis Color" },
  { key: "bollingerUpperColor", label: "Upper Color" },
  { key: "bollingerLowerColor", label: "Lower Color" },
];
const chartBollingerNumberFields: Array<{
  key: ChartIndicatorNumberField;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "bollingerPeriod", label: "Period", min: 2, max: 250, step: 1 },
  { key: "bollingerStdDev", label: "Std Dev", min: 0.5, max: 5, step: 0.25 },
];
const chartSrZonesColorFields: Array<{ key: ChartIndicatorColorField; label: string }> = [
  { key: "srSupportZoneColor", label: "Support Color" },
  { key: "srResistanceZoneColor", label: "Resistance Color" },
];
const chartSrZonesNumberFields: Array<{
  key: ChartIndicatorNumberField;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "srZoneLookback", label: "Lookback", min: 20, max: 1000, step: 10 },
  { key: "srZonePivotStrength", label: "Pivot Strength", min: 1, max: 20, step: 1 },
  { key: "srZoneMaxZones", label: "Max Zones", min: 1, max: 12, step: 1 },
  { key: "srZoneThicknessBps", label: "Width bps", min: 1, max: 100, step: 1 },
];
const chartMarketStructureColorFields: Array<{ key: ChartIndicatorColorField; label: string }> = [
  { key: "marketStructureHighColor", label: "High Labels" },
  { key: "marketStructureLowColor", label: "Low Labels" },
  { key: "marketStructureBreakColor", label: "Break Labels" },
];
const chartMarketStructureNumberFields: Array<{
  key: ChartIndicatorNumberField;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "marketStructureLookback", label: "Lookback", min: 20, max: 2000, step: 10 },
  { key: "marketStructurePivotStrength", label: "Pivot Strength", min: 1, max: 20, step: 1 },
  { key: "marketStructureAtrPeriod", label: "ATR Period", min: 2, max: 100, step: 1 },
  { key: "marketStructureMinMoveAtr", label: "Min Move ATR", min: 0, max: 10, step: 0.05 },
  { key: "marketStructureMaxLabels", label: "Max Labels", min: 1, max: 100, step: 1 },
];
const chartAnchoredVwapColorFields: Array<{ key: ChartIndicatorColorField; label: string }> = [
  { key: "anchoredVwapColor", label: "VWAP Color" },
  { key: "anchoredVwapAnchorColor", label: "Anchor Color" },
];
const CHART_INDICATOR_OPTIONS: ChartIndicatorOption[] = [
  {
    type: "sma",
    label: "SMA",
    placement: "price",
    colorFields: [{ key: "smaColor", label: "Color" }],
    toggleFields: [],
    numberFields: [{ key: "smaPeriod", label: "Period", min: 2, max: 250, step: 1 }],
  },
  {
    type: "ema",
    label: "EMA",
    placement: "price",
    colorFields: [{ key: "emaColor", label: "Color" }],
    toggleFields: [],
    numberFields: [{ key: "emaPeriod", label: "Period", min: 2, max: 250, step: 1 }],
  },
  {
    type: "wma",
    label: "WMA",
    placement: "price",
    colorFields: [{ key: "wmaColor", label: "Color" }],
    toggleFields: [],
    numberFields: [{ key: "wmaPeriod", label: "Period", min: 2, max: 250, step: 1 }],
  },
  {
    type: "bollinger",
    label: "Bollinger",
    placement: "price",
    colorFields: chartBollingerColorFields,
    toggleFields: [],
    numberFields: chartBollingerNumberFields,
  },
  {
    type: "srZones",
    label: "Auto S/R",
    placement: "price",
    colorFields: chartSrZonesColorFields,
    toggleFields: [],
    numberFields: chartSrZonesNumberFields,
  },
  {
    type: "marketStructure",
    label: "Market Structure",
    placement: "price",
    colorFields: chartMarketStructureColorFields,
    toggleFields: [],
    numberFields: chartMarketStructureNumberFields,
  },
  {
    type: "anchoredVwap",
    label: "Anchored VWAP",
    placement: "price",
    colorFields: chartAnchoredVwapColorFields,
    toggleFields: [],
    numberFields: [],
  },
  {
    type: "volume",
    label: "Volume",
    placement: "price",
    colorFields: [
      { key: "volumeUpColor", label: "Up Color" },
      { key: "volumeDownColor", label: "Down Color" },
    ],
    toggleFields: [],
    numberFields: [
      { key: "volumeHeightRatio", label: "Height", min: 0.05, max: 0.35, step: 0.01 },
      { key: "volumeOpacity", label: "Opacity", min: 0.05, max: 1, step: 0.05 },
    ],
  },
  {
    type: "stochRsi",
    label: "Stoch RSI",
    placement: "lower",
    colorFields: stochRsiColorFields,
    toggleFields: stochRsiToggleFields,
    numberFields: stochRsiNumberFields,
  },
  {
    type: "rsi",
    label: "RSI",
    placement: "lower",
    colorFields: rsiColorFields,
    toggleFields: rsiToggleFields,
    numberFields: rsiNumberFields,
  },
  {
    type: "macd",
    label: "MACD",
    placement: "lower",
    colorFields: macdColorFields,
    toggleFields: macdToggleFields,
    numberFields: macdNumberFields,
  },
  {
    type: "atr",
    label: "ATR",
    placement: "lower",
    colorFields: atrColorFields,
    toggleFields: atrToggleFields,
    numberFields: atrNumberFields,
  },
  {
    type: "relativeReturn",
    label: "RS vs BTC",
    placement: "lower",
    colorFields: relativeReturnColorFields,
    toggleFields: relativeReturnToggleFields,
    numberFields: [],
  },
];

const props = withDefaults(
  defineProps<{
    symbol: string;
    exchange?: string;
    marketType?: string;
    timeframe: string | number;
    timeframeOptions?: Array<string | number>;
    limit: number;
    candles?: unknown[];
    dataAdapter?: GpuChartDataAdapter;
    showSma?: boolean;
    showEma?: boolean;
    synthetic?: boolean;
    title?: string;
    openOnChartClick?: boolean;
    showIndicatorPanes?: boolean;
    showChartSettings?: boolean;
    syncId?: string | number;
    timeSyncCommand?: GpuChartTimeSyncCommand | null;
    appearance?: Partial<GpuChartAppearance>;
  }>(),
  {
    candles: undefined,
    dataAdapter: undefined,
    exchange: undefined,
    marketType: undefined,
    timeframeOptions: () => [],
    showSma: true,
    showEma: true,
    synthetic: false,
    title: "",
    openOnChartClick: false,
    showIndicatorPanes: false,
    showChartSettings: false,
    syncId: "",
    timeSyncCommand: null,
  },
);

const emit = defineEmits<{
  streaming: [active: boolean];
  error: [message: string | null];
  open: [payload: GpuChartOpenPayload];
  "update:timeframe": [value: string];
  "update:appearance": [value: GpuChartAppearance];
  "save-appearance": [value: GpuChartAppearance];
  "reset-appearance": [];
  "time-sync": [value: GpuChartTimeSyncAction];
}>();

const shellRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const hudRef = ref<HTMLCanvasElement | null>(null);
const indicatorSettingsRef = ref<HTMLDivElement | null>(null);
const chartSettingsRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const streaming = ref(false);
const lastClose = ref<number | null>(null);
const changePct = ref<number | null>(null);
const liveUpdates = ref(0);
const candleCount = ref(0);
const viewMinX = ref(0);
const viewMaxX = ref(1);
const historicalLoading = ref(false);
const localAppearance = ref(normalizeGpuChartAppearance(props.appearance));
const localActiveIndicatorPanes = ref<GpuChartIndicatorPane[]>([
  ...localAppearance.value.activeIndicatorPanes,
]);
const localActiveIndicatorPane = ref<GpuChartIndicatorPane>(
  localActiveIndicatorPanes.value[0] ?? localAppearance.value.activeIndicatorPane,
);
const indicatorPaneMinimized = ref(
  localAppearance.value.indicatorPaneMinimized || !localActiveIndicatorPanes.value.length,
);
const indicatorPaneHeightRatio = ref(
  clampIndicatorPaneHeightRatio(localAppearance.value.stochRsiPaneHeight),
);
const indicatorPaneVisible = ref(false);
const indicatorPaneTopCss = ref(0);
const indicatorPaneHeaders = ref<IndicatorPaneHeader[]>([]);
const indicatorSettingsOpen = ref(false);
const indicatorSettingsDragging = ref(false);
const indicatorSettingsPosition = ref<{ left: number; top: number } | null>(null);
const indicatorPaneResizing = ref(false);
const chartSettingsOpen = ref(false);
const chartSettingsDragging = ref(false);
const chartSettingsPosition = ref<{ left: number; top: number } | null>(null);
const chartSettingsDimensions = ref<{ width: number; height: number } | null>(null);
const chartSettingsResizing = ref(false);
const chartSettingsTab = ref<ChartSettingsTab>("indicators");
const selectedChartIndicatorId = ref("ema");
const anchoredVwapPickMode = ref(false);

let chart: GpuChartHandle | null = null;
let state: GpuSeriesState | null = null;
let benchmarkState: GpuSeriesState | null = null;
let view: ViewBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
let resizeObs: ResizeObserver | null = null;
let unsubscribe: (() => void) | null = null;
let benchmarkUnsubscribe: (() => void) | null = null;
let syntheticTimer: ReturnType<typeof setInterval> | null = null;
let cleanupFns: Array<() => void> = [];
let mounted = false;
let mousePos: { px: number; py: number } | null = null;
let hasMoreHistory = true;
let draggedDuringPointer = false;
let autoFitVisibleY = true;
let smoothXFrame: number | null = null;
let smoothXTarget: Pick<ViewBounds, "minX" | "maxX"> | null = null;
let stopPaneResizeDrag: (() => void) | null = null;
let stopSettingsDrag: (() => void) | null = null;
let stopChartSettingsDrag: (() => void) | null = null;
let stopChartSettingsResize: (() => void) | null = null;
let benchmarkLoadGeneration = 0;
let benchmarkLoadKey = "";
let lastAppliedTimeSyncSeq = 0;

const resolvedAppearance = computed(() => localAppearance.value);
const chartSettingsEnabled = computed(() => Boolean(props.showChartSettings));
const chartIndicatorRows = computed<ChartIndicatorRow[]>(() => {
  const appearance = resolvedAppearance.value;
  const movingAverageCounts = movingAverageInstanceCounts(appearance.indicators);
  return orderedChartIndicators(appearance.indicators).map((indicator) => ({
    id: indicator.id,
    type: indicator.type,
    label: chartIndicatorInstanceLabel(indicator, appearance),
    meta: chartIndicatorInstanceMeta(indicator, appearance),
    enabled: indicator.enabled,
    selected: selectedChartIndicatorId.value === indicator.id,
    canAdd: gpuChartIndicatorCanAddInstance(indicator.type),
    canRemove:
      gpuChartIndicatorCanAddInstance(indicator.type) &&
      (movingAverageCounts.get(indicator.type) ?? 0) > 1,
  }));
});
const selectedChartIndicatorInstance = computed(() => {
  const indicators = resolvedAppearance.value.indicators;
  return (
    indicators.find((indicator) => indicator.id === selectedChartIndicatorId.value) ??
    indicators.find((indicator) => indicator.type === "ema") ??
    indicators[0] ??
    null
  );
});
const selectedChartIndicatorOption = computed(() =>
  selectedChartIndicatorInstance.value
    ? CHART_INDICATOR_OPTIONS.find(
        (indicator) => indicator.type === selectedChartIndicatorInstance.value?.type,
      ) ?? CHART_INDICATOR_OPTIONS[0]
    : null,
);
const selectedMovingAverageIndicator = computed(() => {
  const indicator = selectedChartIndicatorInstance.value;
  return indicator && gpuChartIndicatorCanAddInstance(indicator.type) ? indicator : null;
});
const selectedMovingAveragePeriod = computed(() =>
  selectedMovingAverageIndicator.value
    ? gpuChartMovingAveragePeriod(
        resolvedAppearance.value,
        selectedMovingAverageIndicator.value,
      )
    : 0,
);
const selectedMovingAverageColor = computed(() =>
  selectedMovingAverageIndicator.value
    ? gpuChartMovingAverageColor(resolvedAppearance.value, selectedMovingAverageIndicator.value)
    : resolvedAppearance.value.textColor,
);
const selectedChartIndicatorIsAnchoredVwap = computed(
  () => selectedChartIndicatorInstance.value?.type === "anchoredVwap",
);
const selectedChartIndicatorLabel = computed(() =>
  selectedChartIndicatorInstance.value
    ? chartIndicatorInstanceLabel(selectedChartIndicatorInstance.value, resolvedAppearance.value)
    : "",
);
const selectedChartIndicatorPlacement = computed(() =>
  selectedChartIndicatorInstance.value
    ? chartIndicatorPlacementLabel(
        GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[selectedChartIndicatorInstance.value.type],
      )
    : "",
);
const shellStyle = computed<Record<string, string>>(() => {
  const appearance = resolvedAppearance.value;
  return {
    backgroundColor: appearance.backgroundColor,
    "--gpu-chart-font-size": `${appearance.fontSize}px`,
    "--gpu-chart-text-color": hexToRgba(appearance.textColor, 0.9),
    "--gpu-chart-badge-bg": hexToRgba(appearance.tooltipBackgroundColor, 0.55),
    "--gpu-chart-up-color": appearance.upColor,
    "--gpu-chart-down-color": appearance.downColor,
  };
});
const indicatorPaneTabs = computed(() => {
  if (!props.showIndicatorPanes) return [];
  const appearance = resolvedAppearance.value;
  return INDICATOR_PANES.filter((pane) => chartIndicatorEnabled(pane.id, appearance));
});
const indicatorTabsVisible = computed(() => indicatorPaneTabs.value.length > 0);
const activeIndicatorPaneIds = computed(() => {
  if (indicatorPaneMinimized.value) return [];
  const available = new Set(indicatorPaneTabs.value.map((pane) => pane.id));
  return localActiveIndicatorPanes.value
    .filter((id) => available.has(id))
    .slice(0, MAX_ACTIVE_GPU_CHART_INDICATOR_PANES);
});
const visibleIndicatorPanes = computed(() => {
  const byId = new Map(indicatorPaneTabs.value.map((pane) => [pane.id, pane]));
  return activeIndicatorPaneIds.value
    .map((id) => byId.get(id))
    .filter((pane): pane is IndicatorPaneOption => Boolean(pane));
});
const indicatorPaneSelectionLimitReached = computed(
  () => activeIndicatorPaneIds.value.length >= MAX_ACTIVE_GPU_CHART_INDICATOR_PANES,
);
const activeIndicatorPane = computed(() => {
  const tabs = indicatorPaneTabs.value;
  if (!tabs.length) return null;
  return (
    tabs.find((pane) => pane.id === localActiveIndicatorPane.value) ??
    visibleIndicatorPanes.value[0] ??
    tabs[0]
  );
});
const activeIndicatorPaneId = computed(() => activeIndicatorPane.value?.id ?? null);
const activeIndicatorPaneLabel = computed(() => activeIndicatorPane.value?.label ?? "Indicator");
const activeIndicatorColorFields = computed(() => activeIndicatorPane.value?.colorFields ?? []);
const activeIndicatorNumberFields = computed(() => activeIndicatorPane.value?.numberFields ?? []);
const activeIndicatorToggleFields = computed(() => activeIndicatorPane.value?.toggleFields ?? []);
const indicatorPaneDividerStyle = computed<Record<string, string>>(() => {
  const appearance = resolvedAppearance.value;
  return {
    top: `${indicatorPaneTopCss.value}px`,
    "--gpu-chart-divider-color": hexToRgba(appearance.gridColor, 0.86),
  };
});
function indicatorPaneToolbarStyle(header: IndicatorPaneHeader): Record<string, string> {
  const appearance = resolvedAppearance.value;
  return {
    top: `${header.top + 7}px`,
    "--gpu-chart-indicator-font-size": `${Math.max(11, appearance.fontSize * 0.86)}px`,
    "--gpu-chart-indicator-text": hexToRgba(appearance.textColor, 0.92),
    "--gpu-chart-indicator-muted": hexToRgba(appearance.textColor, 0.68),
    "--gpu-chart-indicator-panel-bg": hexToRgba(appearance.tooltipBackgroundColor, 0.94),
    "--gpu-chart-indicator-border": hexToRgba(appearance.gridColor, 0.72),
    "--gpu-chart-indicator-k": appearance.stochRsiKColor,
    "--gpu-chart-indicator-d": appearance.stochRsiDColor,
    "--gpu-chart-indicator-rsi": appearance.rsiColor,
    "--gpu-chart-indicator-macd": appearance.macdLineColor,
    "--gpu-chart-indicator-signal": appearance.macdSignalColor,
    "--gpu-chart-indicator-atr": appearance.atrColor,
    "--gpu-chart-indicator-relative-return": appearance.relativeReturnColor,
    "--gpu-chart-indicator-histogram-up": appearance.macdHistogramUpColor,
    "--gpu-chart-indicator-histogram-down": appearance.macdHistogramDownColor,
  };
}
const indicatorSettingsModalStyle = computed<Record<string, string>>(() => {
  const appearance = resolvedAppearance.value;
  const position = indicatorSettingsPosition.value ?? defaultIndicatorSettingsPosition();
  return {
    left: `${position.left}px`,
    top: `${position.top}px`,
    "--gpu-chart-indicator-font-size": `${Math.max(11, appearance.fontSize * 0.86)}px`,
    "--gpu-chart-indicator-text": hexToRgba(appearance.textColor, 0.92),
    "--gpu-chart-indicator-muted": hexToRgba(appearance.textColor, 0.68),
    "--gpu-chart-indicator-panel-bg": hexToRgba(appearance.tooltipBackgroundColor, 0.96),
    "--gpu-chart-indicator-border": hexToRgba(appearance.gridColor, 0.76),
  };
});
const chartSettingsModalStyle = computed<Record<string, string>>(() => {
  const appearance = resolvedAppearance.value;
  const size = clampChartSettingsSize(chartSettingsDimensions.value ?? defaultChartSettingsSize());
  const position = clampChartSettingsPosition(
    chartSettingsPosition.value ?? defaultChartSettingsPosition(size),
    size,
  );
  return {
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    "--gpu-chart-settings-font-size": `${Math.max(11, appearance.fontSize * 0.86)}px`,
    "--gpu-chart-settings-text": hexToRgba(appearance.textColor, 0.92),
    "--gpu-chart-settings-muted": hexToRgba(appearance.textColor, 0.68),
    "--gpu-chart-settings-panel-bg": hexToRgba(appearance.tooltipBackgroundColor, 0.96),
    "--gpu-chart-settings-border": hexToRgba(appearance.gridColor, 0.76),
  };
});
const indicatorPaneTabsStyle = computed<Record<string, string>>(() => {
  const appearance = resolvedAppearance.value;
  return {
    "--gpu-chart-indicator-font-size": `${Math.max(11, appearance.fontSize * 0.82)}px`,
    "--gpu-chart-indicator-text": hexToRgba(appearance.textColor, 0.9),
    "--gpu-chart-indicator-muted": hexToRgba(appearance.textColor, 0.62),
    "--gpu-chart-indicator-panel-bg": hexToRgba(appearance.tooltipBackgroundColor, 0.96),
    "--gpu-chart-indicator-border": hexToRgba(appearance.gridColor, 0.68),
  };
});
const displaySymbol = computed(() => props.symbol.toUpperCase());
const displayTimeframe = computed(() => normalizeRestTimeframe(props.timeframe));
const selectableTimeframes = computed(() => {
  const options = [
    displayTimeframe.value,
    ...props.timeframeOptions.map((option) => normalizeRestTimeframe(option)),
  ];
  return Array.from(new Set(options.filter(Boolean)));
});
const timeframeSelectable = computed(() => selectableTimeframes.value.length > 1);
const displayTitle = computed(() => props.title || `${displaySymbol.value} ${displayTimeframe.value}`);
const lastCloseText = computed(() => (lastClose.value == null ? "" : formatPrice(lastClose.value)));
const changePctText = computed(() => {
  if (changePct.value == null) return "";
  const sign = changePct.value > 0 ? "+" : "";
  return `${sign}${changePct.value.toFixed(2)}%`;
});
const changeClass = computed(() => ({
  up: (changePct.value ?? 0) > 0,
  down: (changePct.value ?? 0) < 0,
}));
const anchoredVwapDistancePct = computed(() => {
  void candleCount.value;
  void liveUpdates.value;
  const appearance = resolvedAppearance.value;
  if (!state?.candles.length || !chartIndicatorEnabled("anchoredVwap", appearance)) return null;
  const snapshot = computeAnchoredVwapSnapshot(state.candles, {
    anchorBucket: appearance.anchoredVwapAnchorBucket,
  });
  return snapshot.distancePct;
});
const anchoredVwapDistanceText = computed(() => {
  const pct = anchoredVwapDistancePct.value;
  if (pct == null || !Number.isFinite(pct)) return "";
  const sign = pct > 0 ? "+" : "";
  return `AVWAP ${sign}${pct.toFixed(1)}%`;
});
const anchoredVwapDistanceClass = computed(() => ({
  above: (anchoredVwapDistancePct.value ?? 0) > 0,
  below: (anchoredVwapDistancePct.value ?? 0) < 0,
}));
const structureSummary = computed(() => {
  void candleCount.value;
  void liveUpdates.value;
  const appearance = resolvedAppearance.value;
  if (!state?.candles.length || !chartIndicatorEnabled("marketStructure", appearance)) return null;
  const summary = currentMarketStructure().summary;
  return summary.state === "neutral" ? null : summary;
});
const structureSummaryText = computed(() => {
  const summary = structureSummary.value;
  if (!summary) return "";
  return `${displayTimeframe.value} structure: ${formatStructureSummaryState(summary.state)}`;
});
const structureSummaryClass = computed(() => {
  const state = structureSummary.value?.state ?? "neutral";
  return {
    bullish: state === "bullish",
    bearish: state === "bearish",
    transitional: state === "transitional",
  };
});
const openOnChartClickActive = computed(
  () => Boolean(props.openOnChartClick && !anchoredVwapPickMode.value),
);
const badgeComponent = computed(() => "div");
const badgeTitle = computed(() =>
  [
    displayTitle.value,
    lastCloseText.value,
    changePctText.value,
    anchoredVwapDistanceText.value,
    structureSummaryText.value,
  ]
    .filter(Boolean)
    .join(" "),
);
const badgeProps = computed(() => {
  const attrs = {
    title: badgeTitle.value,
    "aria-label": badgeTitle.value,
  };
  return attrs;
});

const renderNow = () => {
  chart?.render();
};

const anchoredVwapAnchorLabel = computed(() => {
  const bucket = resolvedAppearance.value.anchoredVwapAnchorBucket;
  if (bucket == null || !Number.isFinite(bucket)) return "No anchor";
  const candle = anchoredVwapAnchorCandle();
  return `Anchor ${formatAnchorDate(candle?.ts ?? bucket)}`;
});

function handleShellClick(event: MouseEvent) {
  if (draggedDuringPointer) {
    draggedDuringPointer = false;
    return;
  }
  if (anchoredVwapPickMode.value) {
    setAnchoredVwapAnchorFromPointer(event);
    return;
  }
  if (!props.openOnChartClick) return;
  emit("open", openPayload());
}

onMounted(async () => {
  mounted = true;
  await boot();
});

onBeforeUnmount(() => {
  mounted = false;
  stopStream();
  stopBenchmarkStream();
  stopSynthetic();
  cancelSmoothX();
  stopPaneResizeDrag?.();
  stopPaneResizeDrag = null;
  stopSettingsDrag?.();
  stopSettingsDrag = null;
  stopChartSettingsDrag?.();
  stopChartSettingsDrag = null;
  stopChartSettingsResize?.();
  stopChartSettingsResize = null;
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
  resizeObs?.disconnect();
  resizeObs = null;
  cancelScheduledGpuRender(renderNow);
  chart?.free?.();
  chart = null;
});

watch(
  () => [
    props.symbol,
    props.exchange,
    props.marketType,
    props.timeframe,
    props.limit,
    props.synthetic,
    props.candles,
    props.dataAdapter,
  ],
  () => {
    if (mounted && chart) {
      void loadSeries();
    }
  },
);

watch(
  () => props.appearance,
  (appearance) => {
    const next = normalizeGpuChartAppearance(appearance);
    localAppearance.value = next;
    syncLocalIndicatorPaneState(next);
  },
  { deep: true },
);

watch(
  () => [props.showSma, props.showEma],
  () => {
    if (!chart || !state) return;
    updateOverlays();
    fitVisibleYIfEnabled();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  },
);

watch(
  resolvedAppearance,
  () => {
    if (!chart) return;
    applyChartAppearance();
    if (relativeReturnEnabled()) {
      void ensureRelativeBenchmarkState(Math.max(historyLoadLimit(), state?.candles.length ?? 0));
    } else {
      benchmarkState = null;
      benchmarkLoadKey = "";
      stopBenchmarkStream();
    }
    updateOverlays();
    fitVisibleYIfEnabled();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  },
  { deep: true },
);

watch(
  () => props.timeSyncCommand,
  (command) => {
    applyTimeSyncCommand(command);
  },
  { deep: true },
);

watch(
  () => props.showIndicatorPanes,
  () => {
    if (!chart) return;
    fitVisibleYIfEnabled();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  },
);

async function boot() {
  if (!("gpu" in navigator)) {
    setError("WebGPU unsupported");
    return;
  }
  const canvas = canvasRef.value;
  const hud = hudRef.value;
  if (!canvas || !hud) return;

  try {
    loading.value = true;
    fitCanvases();
    const module = await loadGpuChartModule();
    chart = await module.create_chart(canvas);
    applyChartAppearance();
    attachInteractions(canvas, hud);
    resizeObs = new ResizeObserver(() => {
      fitCanvases();
      chart?.resize();
      if (indicatorSettingsOpen.value) placeIndicatorSettingsModal();
      if (chartSettingsOpen.value) placeChartSettingsModal();
      fitVisibleYIfEnabled();
      applyView();
      drawHud(mousePos);
      scheduleGpuRender(renderNow);
    });
    resizeObs.observe(canvas);
    const onWindowResize = () => {
      if (chartSettingsOpen.value) placeChartSettingsModal();
    };
    window.addEventListener("resize", onWindowResize);
    cleanupFns.push(() => window.removeEventListener("resize", onWindowResize));
    await loadSeries();
  } catch (e) {
    setError(e instanceof Error ? e.message : "GPU chart failed to start");
  } finally {
    loading.value = false;
  }
}

function applyChartAppearance() {
  if (!chart) return;
  const appearance = resolvedAppearance.value;
  const [bgR, bgG, bgB] = hexToRgb01(appearance.backgroundColor);
  const [upR, upG, upB] = hexToRgb01(appearance.upColor);
  const [downR, downG, downB] = hexToRgb01(appearance.downColor);
  chart.set_clear(bgR, bgG, bgB, 1);
  chart.set_style(appearance.candleWidth, appearance.wickWidth);
  chart.set_candle_colors?.(upR, upG, upB, 1, downR, downG, downB, 1);
}

async function loadSeries() {
  stopStream();
  stopBenchmarkStream();
  stopSynthetic();
  cancelSmoothX();
  loading.value = true;
  setError(null);
  hasMoreHistory = true;
  benchmarkState = null;
  benchmarkLoadKey = "";
  try {
    const loadLimit = historyLoadLimit();
    if (props.synthetic) {
      state = makeSyntheticCandles(props.symbol, loadLimit, props.timeframe);
    } else if (props.candles) {
      state = packHistoricalCandles(props.candles, props.timeframe, loadLimit);
    } else if (props.dataAdapter) {
      const rows = await props.dataAdapter.loadLatest(dataQuery({ limit: loadLimit }));
      state = packHistoricalCandles(rows, props.timeframe, loadLimit);
    } else {
      throw new Error("No OHLCV data source provided");
    }
    await ensureRelativeBenchmarkState(loadLimit);

    liveUpdates.value = 0;
    updateSummaryMetrics();
    updateCandleCount();
    chart?.push_ohlc(candlesToBytes(state.candles));
    updateOverlays();
    autoFitVisibleY = true;
    updateView(computeViewBounds(initialVisibleCandles()));
    fitVisibleY();
    applyView();
    drawHud(null);
    scheduleGpuRender(renderNow);
    applyTimeSyncCommand(props.timeSyncCommand);

    if (props.synthetic) startSynthetic();
    else await startStream();
  } catch (e) {
    setError(e instanceof Error ? e.message : "Failed to load OHLCV");
  } finally {
    loading.value = false;
  }
}

async function startStream() {
  if (!props.symbol || props.synthetic || !props.dataAdapter?.subscribe) return;
  const stop = await props.dataAdapter.subscribe(dataQuery(), {
    onCandle: (payload) => {
      applyLivePayload(payload);
      if (!streaming.value) setStreaming(true);
    },
    onStatus: (status) => {
      setStreaming(status === "open");
    },
    onError: (message) => {
      setStreaming(false);
      console.warn(message);
    },
  });
  unsubscribe = stop;
  await startBenchmarkStream();
}

function stopStream() {
  if (unsubscribe) {
    try {
      unsubscribe();
    } catch {
      // ignore unsubscribe races
    }
  }
  unsubscribe = null;
  setStreaming(false);
}

async function startBenchmarkStream() {
  if (benchmarkUnsubscribe) return;
  if (
    !state ||
    !relativeReturnEnabled() ||
    props.synthetic ||
    !props.dataAdapter?.subscribe ||
    isBenchmarkSelf()
  ) {
    return;
  }
  try {
    const stop = await props.dataAdapter.subscribe(
      dataQuery({ symbol: relativeReturnBenchmarkSymbol() }),
      {
        onCandle: applyBenchmarkLivePayload,
        onError: (message) => {
          console.warn(message);
        },
      },
    );
    benchmarkUnsubscribe = stop;
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Failed to subscribe BTC benchmark");
  }
}

function stopBenchmarkStream() {
  if (benchmarkUnsubscribe) {
    try {
      benchmarkUnsubscribe();
    } catch {
      // ignore unsubscribe races
    }
  }
  benchmarkUnsubscribe = null;
}

function relativeReturnEnabled(appearance = resolvedAppearance.value) {
  return chartIndicatorEnabled("relativeReturn", appearance);
}

function relativeReturnBenchmarkSymbol() {
  return benchmarkSymbolFor(props.symbol);
}

function isBenchmarkSelf() {
  return props.symbol.toUpperCase() === relativeReturnBenchmarkSymbol();
}

function benchmarkSymbolFor(symbol: string) {
  const upper = symbol.toUpperCase();
  if (upper.startsWith("BTC")) return upper;
  for (const quote of ["USDT", "USDC", "USD"]) {
    if (upper.endsWith(quote)) return `BTC${quote}`;
  }
  return "BTCUSDT";
}

async function ensureRelativeBenchmarkState(limit = historyLoadLimit()) {
  const generation = ++benchmarkLoadGeneration;
  if (!relativeReturnEnabled() || !state) {
    benchmarkState = null;
    benchmarkLoadKey = "";
    stopBenchmarkStream();
    return;
  }
  if (isBenchmarkSelf()) {
    benchmarkState = state;
    benchmarkLoadKey = relativeBenchmarkKey(limit);
    drawHud(mousePos);
    return;
  }
  const nextLoadKey = relativeBenchmarkKey(limit);
  if (benchmarkState && benchmarkLoadKey === nextLoadKey) {
    await startBenchmarkStream();
    return;
  }
  try {
    const nextBenchmarkState = await loadRelativeBenchmarkLatest(limit);
    if (generation !== benchmarkLoadGeneration) return;
    benchmarkState = nextBenchmarkState;
    benchmarkLoadKey = nextLoadKey;
    await startBenchmarkStream();
    drawHud(mousePos);
  } catch (error) {
    if (generation !== benchmarkLoadGeneration) return;
    benchmarkState = null;
    benchmarkLoadKey = "";
    stopBenchmarkStream();
    console.warn(error instanceof Error ? error.message : "Failed to load BTC benchmark");
  }
}

async function loadRelativeBenchmarkLatest(limit: number) {
  if (props.synthetic) {
    return makeSyntheticCandles(relativeReturnBenchmarkSymbol(), limit, props.timeframe);
  }
  if (!props.dataAdapter) {
    throw new Error("No BTC benchmark data source provided");
  }
  const rows = await props.dataAdapter.loadLatest(
    dataQuery({ symbol: relativeReturnBenchmarkSymbol(), limit }),
  );
  return packHistoricalCandles(rows, props.timeframe, limit);
}

async function loadOlderRelativeBenchmarkCandles(start: number, end: number, limit: number) {
  if (!state || !relativeReturnEnabled()) return;
  if (isBenchmarkSelf()) {
    benchmarkState = state;
    return;
  }
  if (!benchmarkState) {
    await ensureRelativeBenchmarkState(Math.max(limit, state.candles.length));
    return;
  }
  if (!props.dataAdapter?.loadRange) return;
  try {
    const rows = await props.dataAdapter.loadRange(
      dataQuery({
        symbol: relativeReturnBenchmarkSymbol(),
        start,
        end,
        limit,
      }),
    );
    prependHistoricalCandles(benchmarkState, rows, props.timeframe);
    benchmarkLoadKey = relativeBenchmarkKey(Math.max(limit, state.candles.length));
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Failed to load older BTC benchmark");
  }
}

function relativeBenchmarkKey(limit: number) {
  const last = state?.candles[state.candles.length - 1];
  return [
    relativeReturnBenchmarkSymbol(),
    props.exchange ?? "",
    props.marketType ?? "",
    normalizeRestTimeframe(props.timeframe),
    state?.firstBucket ?? 0,
    last?.bucket ?? 0,
    limit,
  ].join(":");
}

function startSynthetic() {
  setStreaming(true);
  syntheticTimer = setInterval(() => {
    if (!state) return;
    if (relativeReturnEnabled() && benchmarkState && benchmarkState !== state) {
      appendSyntheticCandle(benchmarkState, liveRetentionLimit());
    }
    const wasFollowingLatest = isViewFollowingLatest();
    const previousFirstBucket = state.firstBucket;
    applyMergeResult(appendSyntheticCandle(state, liveRetentionLimit()), {
      previousFirstBucket,
      wasFollowingLatest,
    });
  }, 1000);
}

function stopSynthetic() {
  if (syntheticTimer) clearInterval(syntheticTimer);
  syntheticTimer = null;
}

async function maybeLoadOlderCandles() {
  if (
    !state ||
    props.synthetic ||
    !props.dataAdapter?.loadRange ||
    historicalLoading.value ||
    !hasMoreHistory
  ) {
    return;
  }
  const first = state.candles[0];
  if (!first || view.minX > first.x + 1.5) return;

  const end = state.firstBucket;
  const pageLimit = historyPageLimit();
  const start = Math.max(0, end - state.timeframeSec * pageLimit);
  if (end <= start) {
    hasMoreHistory = false;
    return;
  }

  historicalLoading.value = true;
  try {
    const rows = await props.dataAdapter.loadRange(dataQuery({ start, end, limit: pageLimit }));
    const previousFirstBucket = state.firstBucket;
    const added = prependHistoricalCandles(state, rows, props.timeframe);
    if (added === 0) {
      hasMoreHistory = false;
      return;
    }
    await loadOlderRelativeBenchmarkCandles(start, end, pageLimit);

    const xShift = (previousFirstBucket - state.firstBucket) / state.timeframeSec;
    chart?.push_ohlc(candlesToBytes(state.candles));
    if (Number.isFinite(xShift)) {
      view.minX += xShift;
      view.maxX += xShift;
      if (smoothXTarget) {
        smoothXTarget.minX += xShift;
        smoothXTarget.maxX += xShift;
      }
    }
    updateSummaryMetrics();
    updateCandleCount();
    updateOverlays();
    fitVisibleYIfEnabled();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  } catch (e) {
    console.warn(e instanceof Error ? e.message : "Failed to load older OHLCV");
  } finally {
    historicalLoading.value = false;
  }
}

function dataQuery(extra: Partial<GpuChartDataQuery> = {}): GpuChartDataQuery {
  return {
    symbol: props.symbol.toUpperCase(),
    exchange: props.exchange,
    marketType: props.marketType,
    timeframe: normalizeRestTimeframe(props.timeframe),
    limit: extra.limit ?? historyPageLimit(),
    ...extra,
  };
}

function openPayload(): GpuChartOpenPayload {
  return {
    symbol: props.symbol.toUpperCase(),
    exchange: props.exchange,
    marketType: props.marketType,
    timeframe: props.timeframe,
  };
}

function applyLivePayload(payload: unknown) {
  if (!state) return;
  const wasFollowingLatest = isViewFollowingLatest();
  const previousFirstBucket = state.firstBucket;
  const result = mergeLiveCandle(state, payload, liveRetentionLimit());
  applyMergeResult(result, { previousFirstBucket, wasFollowingLatest });
}

function applyBenchmarkLivePayload(payload: unknown) {
  if (!benchmarkState || benchmarkState === state) return;
  const result = mergeLiveCandle(benchmarkState, payload, liveRetentionLimit());
  if (result.kind === "ignore") return;
  drawHud(mousePos);
}

function liveRetentionLimit() {
  if (!state) return historyLoadLimit();
  return Math.max(historyLoadLimit(), state.candles.length + 1);
}

function applyMergeResult(
  result: ReturnType<typeof mergeLiveCandle>,
  options: { previousFirstBucket?: number; wasFollowingLatest?: boolean } = {},
) {
  if (!state || !chart || result.kind === "ignore") return;
  if (result.kind === "replace") chart.replace_at(result.position, result.bytes);
  if (result.kind === "append") chart.append_at(result.position, result.bytes);
  if (result.kind === "reset") chart.push_ohlc(result.bytes);

  const wasFollowingLatest = options.wasFollowingLatest ?? true;
  if (
    !wasFollowingLatest &&
    result.kind === "reset" &&
    options.previousFirstBucket != null &&
    state.timeframeSec > 0
  ) {
    const xShift = (options.previousFirstBucket - state.firstBucket) / state.timeframeSec;
    if (Number.isFinite(xShift)) {
      view.minX += xShift;
      view.maxX += xShift;
      if (smoothXTarget) {
        smoothXTarget.minX += xShift;
        smoothXTarget.maxX += xShift;
      }
    }
  }

  liveUpdates.value += 1;
  updateSummaryMetrics();
  updateCandleCount();
  updateOverlays();
  if (wasFollowingLatest && state.candles.length) {
    const width = Math.max(1, view.maxX - view.minX);
    const maxX = state.candles[state.candles.length - 1].x + rightEdgePaddingCandles(width);
    view.minX = maxX - width;
    view.maxX = maxX;
  }
  fitVisibleYIfEnabled();
  clampViewX();
  applyView();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);
}

function updateSummaryMetrics() {
  if (!state?.candles.length) {
    lastClose.value = null;
    changePct.value = null;
    return;
  }
  const last = state.candles[state.candles.length - 1];
  lastClose.value = last.c;
  changePct.value = computeCloseChangePct(state.candles);
}

function updateCandleCount() {
  candleCount.value = state?.candles.length ?? 0;
}

function updateOverlays() {
  if (!chart || !state) return;
  const series = indicatorSeries();
  const activeSlots = new Set(series.map((item) => item.slot));
  for (const slot of LINE_SLOTS) {
    if (!activeSlots.has(slot)) chart.clear_line_series(slot);
  }
  for (const item of series) {
    const [r, g, b] = hexToRgb01(item.color);
    chart.set_line_series(item.slot, lineToBytes(item.line), r, g, b, item.alpha);
  }
}

function indicatorSeries() {
  if (!state) return [];
  const appearance = resolvedAppearance.value;
  const series: Array<{ slot: number; line: Float32Array; color: string; alpha: number }> = [];
  const add = (line: Float32Array, color: string, alpha = 0.95) => {
    const slot = LINE_SLOTS[series.length];
    if (slot == null || line.length < 4) return;
    series.push({ slot, line, color, alpha });
  };

  for (const indicator of appearance.indicators) {
    if (!indicator.enabled || !gpuChartIndicatorCanAddInstance(indicator.type)) continue;
    if (indicator.type === "sma" && !props.showSma) continue;
    if (indicator.type === "ema" && !props.showEma) continue;
    const period = gpuChartMovingAveragePeriod(appearance, indicator);
    const color = gpuChartMovingAverageColor(appearance, indicator);
    if (indicator.type === "sma") {
      add(computeSmaLine(state.candles, period), color);
    } else if (indicator.type === "ema") {
      add(computeEmaLine(state.candles, period), color);
    } else {
      add(computeWmaLine(state.candles, period), color);
    }
  }
  if (chartIndicatorEnabled("anchoredVwap", appearance)) {
    add(
      computeAnchoredVwapLine(state.candles, {
        anchorBucket: appearance.anchoredVwapAnchorBucket,
      }),
      appearance.anchoredVwapColor,
      0.95,
    );
  }
  if (chartIndicatorEnabled("bollinger", appearance) && series.length <= LINE_SLOTS.length - 3) {
    const bands = computeBollingerBands(
      state.candles,
      appearance.bollingerPeriod,
      appearance.bollingerStdDev,
    );
    add(bands.basis, appearance.bollingerBasisColor, 0.72);
    add(bands.upper, appearance.bollingerUpperColor, 0.88);
    add(bands.lower, appearance.bollingerLowerColor, 0.88);
  }

  return series;
}

function updateView(bounds: ViewBounds) {
  const visibleCount = visibleCandleCountForBounds(bounds);
  const paddedBounds = withRightPadding(bounds, rightEdgePaddingCandles(visibleCount));
  const xSpan = Math.max(1, paddedBounds.maxX - paddedBounds.minX);
  view = {
    minX: paddedBounds.minX,
    maxX: paddedBounds.minX + xSpan,
    minY: bounds.minY,
    maxY: bounds.maxY,
  };
  clampViewX();
  applyView();
}

function applyView() {
  viewMinX.value = view.minX;
  viewMaxX.value = view.maxX;
  chart?.set_view(view.minX, view.maxX, view.minY, view.maxY);
}

function fitVisibleYIfEnabled(options: { smooth?: boolean } = {}) {
  if (!autoFitVisibleY) return true;
  return fitVisibleY(options);
}

function fitVisibleY(options: { smooth?: boolean } = {}) {
  if (!state?.candles.length) return true;
  const yBounds = computeVisibleYBounds(state.candles, view);
  if (!yBounds) return true;
  const targetYBounds = adjustYBoundsForIndicatorPane(yBounds);
  const nextYBounds = options.smooth ? smoothVisibleYBounds(view, targetYBounds) : targetYBounds;
  view.minY = nextYBounds.minY;
  view.maxY = nextYBounds.maxY;
  return isYBoundsClose(nextYBounds, targetYBounds);
}

function adjustYBoundsForIndicatorPane(
  bounds: Pick<ViewBounds, "minY" | "maxY">,
): Pick<ViewBounds, "minY" | "maxY"> {
  const hud = hudRef.value;
  if (!hud || hud.height <= 0) return bounds;
  const panes = currentIndicatorPaneLayouts();
  const scale = canvasScale(hud);
  const lowerReservedHeight = panes.length
    ? hud.height - panes[0].top
    : indicatorTabBarHeight(scale);
  if (lowerReservedHeight <= 0) return bounds;
  return reserveLowerPaneYBounds(bounds, lowerReservedHeight / hud.height);
}

function resetVisibleYMode() {
  cancelSmoothX();
  autoFitVisibleY = true;
  fitVisibleY();
  applyView();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);
}

function toggleIndicatorSettings(id = activeIndicatorPaneId.value) {
  if (!id) return;
  const samePaneOpen = indicatorSettingsOpen.value && activeIndicatorPaneId.value === id;
  localActiveIndicatorPane.value = id;
  if (samePaneOpen) {
    closeIndicatorSettings();
    return;
  }
  closeChartSettings();
  indicatorSettingsOpen.value = true;
  placeIndicatorSettingsModal();
}

function closeIndicatorSettings() {
  stopSettingsDrag?.();
  indicatorSettingsOpen.value = false;
}

function placeIndicatorSettingsModal() {
  if (!indicatorSettingsPosition.value) {
    indicatorSettingsPosition.value = defaultIndicatorSettingsPosition();
  }
  indicatorSettingsPosition.value = clampIndicatorSettingsPosition(indicatorSettingsPosition.value);
  void nextTick(() => {
    if (!indicatorSettingsOpen.value || !indicatorSettingsPosition.value) return;
    indicatorSettingsPosition.value = clampIndicatorSettingsPosition(indicatorSettingsPosition.value);
  });
}

function setIndicatorColor(field: IndicatorColorField, event: Event) {
  patchAppearance({ [field]: inputValue(event) });
}

function setIndicatorNumber(field: IndicatorNumberField, event: Event) {
  patchAppearance({ [field]: Number(inputValue(event)) });
}

function setIndicatorBool(field: IndicatorToggleField, event: Event) {
  patchAppearance({ [field]: (event.target as HTMLInputElement).checked });
}

function toggleChartSettings() {
  if (chartSettingsOpen.value) {
    closeChartSettings();
    return;
  }
  closeIndicatorSettings();
  chartSettingsOpen.value = true;
  placeChartSettingsModal();
}

function closeChartSettings() {
  stopChartSettingsDrag?.();
  stopChartSettingsResize?.();
  chartSettingsOpen.value = false;
}

function placeChartSettingsModal() {
  chartSettingsDimensions.value = clampChartSettingsSize(
    chartSettingsDimensions.value ?? defaultChartSettingsSize(),
  );
  if (!chartSettingsPosition.value) {
    chartSettingsPosition.value = defaultChartSettingsPosition(chartSettingsDimensions.value);
  }
  chartSettingsPosition.value = clampChartSettingsPosition(
    chartSettingsPosition.value,
    chartSettingsDimensions.value,
  );
  void nextTick(() => {
    if (!chartSettingsOpen.value || !chartSettingsPosition.value) return;
    chartSettingsDimensions.value = clampChartSettingsSize(
      chartSettingsDimensions.value ?? defaultChartSettingsSize(),
    );
    chartSettingsPosition.value = clampChartSettingsPosition(
      chartSettingsPosition.value,
      chartSettingsDimensions.value,
    );
  });
}

function setChartColor(field: ChartSettingsColorField, event: Event) {
  patchAppearance({ [field]: inputValue(event) });
}

function setChartNumber(field: ChartSettingsNumberField, event: Event) {
  patchAppearance({ [field]: Number(inputValue(event)) });
}

function setChartBool(field: ChartSettingsToggleField, event: Event) {
  patchAppearance({ [field]: (event.target as HTMLInputElement).checked });
}

function chartIndicatorEnabled(
  type: GpuChartIndicatorType,
  appearance = resolvedAppearance.value,
) {
  return appearanceIndicatorEnabled(appearance, type);
}

function chartIndicatorLabel(type: GpuChartIndicatorType) {
  const appearance = resolvedAppearance.value;
  switch (type) {
    case "sma":
      return `SMA ${appearance.smaPeriod}`;
    case "ema":
      return `EMA ${appearance.emaPeriod}`;
    case "wma":
      return `WMA ${appearance.wmaPeriod}`;
    case "bollinger":
      return `BB ${appearance.bollingerPeriod} ${formatCompactNumber(appearance.bollingerStdDev)}`;
    case "srZones":
      return `S/R ${appearance.srZoneLookback}`;
    case "marketStructure":
      return `Structure ${appearance.marketStructureLookback}`;
    case "anchoredVwap":
      return "AVWAP";
    case "volume":
      return "Volume";
    case "stochRsi":
      return `Stoch RSI ${appearance.stochRsiRsiPeriod} ${appearance.stochRsiPeriod}`;
    case "rsi":
      return `RSI ${appearance.rsiPeriod}`;
    case "macd":
      return `MACD ${appearance.macdFastPeriod} ${appearance.macdSlowPeriod} ${appearance.macdSignalPeriod}`;
    case "atr":
      return `ATR ${appearance.atrPeriod}`;
    case "relativeReturn":
      return "RS vs BTC";
  }
}

function chartIndicatorInstanceLabel(
  indicator: GpuChartIndicatorInstance,
  appearance: GpuChartAppearance,
) {
  if (gpuChartIndicatorCanAddInstance(indicator.type)) {
    return `${indicator.type.toUpperCase()} ${gpuChartMovingAveragePeriod(appearance, indicator)}`;
  }
  return chartIndicatorLabel(indicator.type);
}

function chartIndicatorInstanceMeta(
  indicator: GpuChartIndicatorInstance,
  appearance: GpuChartAppearance,
) {
  if (gpuChartIndicatorCanAddInstance(indicator.type)) {
    return `${chartIndicatorPlacementLabel(indicator.placement)} ${gpuChartMovingAverageColor(
      appearance,
      indicator,
    )}`;
  }
  return chartIndicatorPlacementLabel(indicator.placement);
}

function orderedChartIndicators(instances: GpuChartIndicatorInstance[]) {
  const order = new Map(
    CHART_INDICATOR_OPTIONS.map((indicator, index) => [indicator.type, index]),
  );
  return instances
    .map((indicator, index) => ({ indicator, index }))
    .sort(
      (a, b) =>
        (order.get(a.indicator.type) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.indicator.type) ?? Number.MAX_SAFE_INTEGER) ||
        a.index - b.index,
    )
    .map((item) => item.indicator);
}

function movingAverageInstanceCounts(instances: GpuChartIndicatorInstance[]) {
  const counts = new Map<GpuChartMovingAverageIndicatorType, number>();
  for (const indicator of instances) {
    if (!gpuChartIndicatorCanAddInstance(indicator.type)) continue;
    counts.set(indicator.type, (counts.get(indicator.type) ?? 0) + 1);
  }
  return counts;
}

function chartIndicatorPlacementLabel(placement: GpuChartIndicatorPlacement) {
  return placement === "price" ? "Price" : "Pane";
}

function indicatorPaneLabel(id: GpuChartIndicatorPane) {
  return INDICATOR_PANES.find((pane) => pane.id === id)?.label ?? "Indicator";
}

function configureChartIndicator(id: string) {
  selectedChartIndicatorId.value = id;
  chartSettingsTab.value = "indicators";
}

function setChartIndicatorInstanceEnabled(id: string, event: Event) {
  const enabled = (event.target as HTMLInputElement).checked;
  const targetType = resolvedAppearance.value.indicators.find(
    (indicator) => indicator.id === id,
  )?.type;
  const nextIndicators = resolvedAppearance.value.indicators.map((indicator) =>
    indicator.id === id
      ? {
          ...indicator,
          enabled,
          placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[indicator.type],
        }
      : { ...indicator },
  );
  patchAppearance({ indicators: nextIndicators });
  if (targetType && !enabled && isIndicatorPaneType(targetType)) {
    setLocalActiveIndicatorPanes(
      localActiveIndicatorPanes.value.filter((pane) => pane !== targetType),
    );
  }
}

function setChartIndicatorEnabledValue(type: GpuChartIndicatorType, enabled: boolean) {
  const nextIndicators = resolvedAppearance.value.indicators.map((indicator) =>
    indicator.type === type
      ? {
          ...indicator,
          enabled,
          placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[type],
        }
      : { ...indicator },
  );
  if (!nextIndicators.some((indicator) => indicator.type === type)) {
    nextIndicators.push({
      id: type,
      type,
      enabled,
      placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[type],
    });
  }
  patchAppearance({
    indicators: nextIndicators,
    [GPU_CHART_INDICATOR_SHOW_KEY_BY_TYPE[type]]: enabled,
  } as Partial<GpuChartAppearance>);
  if (!enabled && isIndicatorPaneType(type)) {
    setLocalActiveIndicatorPanes(
      localActiveIndicatorPanes.value.filter((pane) => pane !== type),
    );
  }
}

function startAnchoredVwapPick() {
  patchAnchoredVwap({ anchoredVwapAnchorBucket: resolvedAppearance.value.anchoredVwapAnchorBucket });
  anchoredVwapPickMode.value = true;
  canvasRef.value?.focus?.();
  if (canvasRef.value) canvasRef.value.style.cursor = "crosshair";
}

function clearAnchoredVwapAnchor() {
  anchoredVwapPickMode.value = false;
  patchAppearance({ anchoredVwapAnchorBucket: null });
}

function setAnchoredVwapAnchorFromPointer(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas || !state?.candles.length) {
    anchoredVwapPickMode.value = false;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0) return;
  const scale = canvasScale(canvas);
  const x = pxToX((event.clientX - rect.left) * scale, canvas.width);
  const candle = nearestCandle(x);
  setAnchoredVwapAnchorCandle(candle);
}

function setAnchoredVwapAnchorFromRecentSwing(kind: SwingPointKind) {
  const swing = [...currentMarketStructure().swings]
    .reverse()
    .find((item) => item.kind === kind);
  setAnchoredVwapAnchorBucket(swing?.bucket ?? null);
}

function setAnchoredVwapAnchorFromLastBreak() {
  const breaks = currentMarketStructure().breaks;
  const breakItem = breaks[breaks.length - 1];
  setAnchoredVwapAnchorBucket(breakItem?.bucket ?? null);
}

function setAnchoredVwapAnchorCandle(candle: CandleRecord | null) {
  setAnchoredVwapAnchorBucket(candle?.bucket ?? null);
}

function setAnchoredVwapAnchorBucket(bucket: number | null) {
  if (bucket == null || !Number.isFinite(bucket)) return;
  anchoredVwapPickMode.value = false;
  patchAnchoredVwap({ anchoredVwapAnchorBucket: bucket });
}

function patchAnchoredVwap(partial: Partial<GpuChartAppearance>) {
  const nextIndicators = resolvedAppearance.value.indicators.map((indicator) =>
    indicator.type === "anchoredVwap"
      ? {
          ...indicator,
          enabled: true,
          placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE.anchoredVwap,
        }
      : { ...indicator },
  );
  if (!nextIndicators.some((indicator) => indicator.type === "anchoredVwap")) {
    nextIndicators.push({
      id: "anchoredVwap",
      type: "anchoredVwap",
      enabled: true,
      placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE.anchoredVwap,
    });
  }
  patchAppearance({
    ...partial,
    indicators: nextIndicators,
    showAnchoredVwap: true,
  });
}

function addChartIndicatorInstance(type: GpuChartIndicatorType) {
  if (!gpuChartIndicatorCanAddInstance(type)) return;
  const appearance = resolvedAppearance.value;
  const nextIndicator: GpuChartIndicatorInstance = {
    id: nextIndicatorInstanceId(type, appearance.indicators),
    type,
    enabled: true,
    placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[type],
    period: nextMovingAveragePeriod(type, appearance),
    color: nextMovingAverageColor(type, appearance),
  };
  selectedChartIndicatorId.value = nextIndicator.id;
  const nextIndicators = appearance.indicators.map((item) => ({ ...item }));
  const insertIndex =
    nextIndicators.reduce(
      (latestIndex, indicator, index) =>
        indicator.type === type ? index : latestIndex,
      -1,
    ) + 1;
  nextIndicators.splice(insertIndex || nextIndicators.length, 0, nextIndicator);
  patchAppearance({ indicators: nextIndicators });
}

function removeChartIndicatorInstance(id: string) {
  const appearance = resolvedAppearance.value;
  const target = appearance.indicators.find((indicator) => indicator.id === id);
  if (!target || !gpuChartIndicatorCanAddInstance(target.type)) return;
  const instancesOfType = appearance.indicators.filter(
    (indicator) => indicator.type === target.type,
  );
  if (instancesOfType.length <= 1) {
    setChartIndicatorEnabledValue(target.type, false);
    return;
  }
  const nextIndicators = appearance.indicators
    .filter((indicator) => indicator.id !== id)
    .map((indicator) => ({ ...indicator }));
  selectedChartIndicatorId.value =
    nextIndicators.find((indicator) => indicator.type === target.type)?.id ??
    nextIndicators[0]?.id ??
    "ema";
  patchAppearance({ indicators: nextIndicators });
}

function setSelectedMovingAverageColor(event: Event) {
  const indicator = selectedMovingAverageIndicator.value;
  if (!indicator) return;
  updateChartIndicatorInstance(indicator.id, { color: inputValue(event) });
}

function setSelectedMovingAveragePeriod(event: Event) {
  const indicator = selectedMovingAverageIndicator.value;
  if (!indicator) return;
  updateChartIndicatorInstance(indicator.id, { period: Number(inputValue(event)) });
}

function updateChartIndicatorInstance(
  id: string,
  patch: Partial<GpuChartIndicatorInstance>,
) {
  const nextIndicators = resolvedAppearance.value.indicators.map((indicator) =>
    indicator.id === id
      ? {
          ...indicator,
          ...patch,
          placement: GPU_CHART_INDICATOR_PLACEMENT_BY_TYPE[indicator.type],
        }
      : { ...indicator },
  );
  patchAppearance({ indicators: nextIndicators });
}

function nextIndicatorInstanceId(
  type: GpuChartMovingAverageIndicatorType,
  indicators: GpuChartIndicatorInstance[],
) {
  let index = 2;
  let id = `${type}-${index}`;
  const usedIds = new Set(indicators.map((indicator) => indicator.id));
  while (usedIds.has(id)) {
    index += 1;
    id = `${type}-${index}`;
  }
  return id;
}

function nextMovingAveragePeriod(
  type: GpuChartMovingAverageIndicatorType,
  appearance: GpuChartAppearance,
) {
  const usedPeriods = new Set(
    appearance.indicators
      .filter((indicator) => indicator.type === type)
      .map((indicator) => gpuChartMovingAveragePeriod(appearance, indicator)),
  );
  const suggested = MOVING_AVERAGE_PERIOD_SUGGESTIONS[type].find(
    (period) => !usedPeriods.has(period),
  );
  if (suggested) return suggested;
  const key = GPU_CHART_MOVING_AVERAGE_PERIOD_KEY_BY_TYPE[type];
  return Math.min(250, Math.max(2, appearance[key] + usedPeriods.size * 10));
}

function nextMovingAverageColor(
  type: GpuChartMovingAverageIndicatorType,
  appearance: GpuChartAppearance,
) {
  const usedColors = new Set(
    appearance.indicators
      .filter((indicator) => indicator.type === type)
      .map((indicator) => gpuChartMovingAverageColor(appearance, indicator).toLowerCase()),
  );
  const suggested = MOVING_AVERAGE_COLOR_SUGGESTIONS.find(
    (color) => !usedColors.has(color.toLowerCase()),
  );
  if (suggested) return suggested;
  const key = GPU_CHART_MOVING_AVERAGE_COLOR_KEY_BY_TYPE[type];
  return appearance[key];
}

function setChartIndicatorColor(field: ChartIndicatorColorField, event: Event) {
  patchAppearance({ [field]: inputValue(event) });
}

function setChartIndicatorNumber(field: ChartIndicatorNumberField, event: Event) {
  patchAppearance({ [field]: Number(inputValue(event)) });
}

function setChartIndicatorBool(field: ChartIndicatorToggleField, event: Event) {
  patchAppearance({ [field]: (event.target as HTMLInputElement).checked });
}

function setDisplayTimeframe(event: Event) {
  const next = normalizeRestTimeframe(inputValue(event));
  if (next && next !== displayTimeframe.value) {
    emit("update:timeframe", next);
  }
}

function resetChartSettings() {
  const next = defaultGpuChartAppearance();
  localAppearance.value = next;
  syncLocalIndicatorPaneState(next);
  emit("update:appearance", next);
  emit("reset-appearance");
}

function saveChartSettings() {
  emit(
    "save-appearance",
    normalizeGpuChartAppearance({
      ...resolvedAppearance.value,
      ...localIndicatorPaneAppearance(),
    }),
  );
}

function startChartSettingsDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  stopChartSettingsResize?.();
  stopChartSettingsDrag?.();
  chartSettingsDragging.value = true;
  const size = chartSettingsSize();
  const startPosition = chartSettingsPosition.value ?? defaultChartSettingsPosition(size);
  const startX = event.clientX;
  const startY = event.clientY;
  const previousCursor = document.body.style.cursor;
  document.body.style.cursor = "grabbing";

  const onMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    chartSettingsPosition.value = clampChartSettingsPosition({
      left: startPosition.left + moveEvent.clientX - startX,
      top: startPosition.top + moveEvent.clientY - startY,
    }, size);
  };
  const onUp = () => {
    stopChartSettingsDrag?.();
  };

  stopChartSettingsDrag = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = previousCursor;
    chartSettingsDragging.value = false;
    stopChartSettingsDrag = null;
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startChartSettingsResize(event: MouseEvent) {
  if (event.button !== 0) return;
  stopChartSettingsDrag?.();
  stopChartSettingsResize?.();
  chartSettingsResizing.value = true;
  const startSize = chartSettingsSize();
  const startPosition = chartSettingsPosition.value ?? defaultChartSettingsPosition(startSize);
  const startX = event.clientX;
  const startY = event.clientY;
  const previousCursor = document.body.style.cursor;
  document.body.style.cursor = "nwse-resize";

  const onMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    const nextSize = clampChartSettingsSize({
      width: startSize.width + moveEvent.clientX - startX,
      height: startSize.height + moveEvent.clientY - startY,
    });
    chartSettingsDimensions.value = nextSize;
    chartSettingsPosition.value = clampChartSettingsPosition(startPosition, nextSize);
  };
  const onUp = () => {
    stopChartSettingsResize?.();
  };

  stopChartSettingsResize = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = previousCursor;
    chartSettingsResizing.value = false;
    stopChartSettingsResize = null;
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function defaultChartSettingsPosition(size = chartSettingsSize()) {
  const shellRect = shellRef.value?.getBoundingClientRect();
  const pad = CHART_SETTINGS_VIEWPORT_PADDING_PX;
  const position = {
    left: shellRect ? shellRect.left + 8 : pad,
    top: shellRect ? shellRect.top + 34 : pad,
  };
  return clampChartSettingsPosition(position, size);
}

function viewportSize() {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  return {
    width: window.innerWidth || 1024,
    height: window.innerHeight || 768,
  };
}

function chartSettingsSize() {
  return clampChartSettingsSize(chartSettingsDimensions.value ?? defaultChartSettingsSize());
}

function defaultChartSettingsSize() {
  return clampChartSettingsSize({
    width: DEFAULT_CHART_SETTINGS_WIDTH_PX,
    height: DEFAULT_CHART_SETTINGS_HEIGHT_PX,
  });
}

function clampChartSettingsSize(size: { width: number; height: number }) {
  const { width, height } = viewportSize();
  const pad = CHART_SETTINGS_VIEWPORT_PADDING_PX;
  const maxWidth = Math.max(240, width - pad * 2);
  const maxHeight = Math.max(240, height - pad * 2);
  const minWidth = Math.min(MIN_CHART_SETTINGS_WIDTH_PX, maxWidth);
  const minHeight = Math.min(MIN_CHART_SETTINGS_HEIGHT_PX, maxHeight);
  return {
    width: Math.max(minWidth, Math.min(maxWidth, size.width)),
    height: Math.max(minHeight, Math.min(maxHeight, size.height)),
  };
}

function clampChartSettingsPosition(
  position: { left: number; top: number },
  size = chartSettingsSize(),
) {
  const { width, height } = viewportSize();
  const pad = CHART_SETTINGS_VIEWPORT_PADDING_PX;
  const maxLeft = Math.max(pad, width - size.width - pad);
  const maxTop = Math.max(pad, height - size.height - pad);
  return {
    left: Math.max(pad, Math.min(maxLeft, position.left)),
    top: Math.max(pad, Math.min(maxTop, position.top)),
  };
}

function formatChartSetting(field: ChartNumberField) {
  const value = resolvedAppearance.value[field];
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value;
}

function resetIndicatorPaneHeight() {
  setLocalIndicatorPaneHeight(DEFAULT_INDICATOR_PANE_HEIGHT_RATIO);
}

function minimizeIndicatorPane(id = activeIndicatorPaneId.value) {
  closeIndicatorSettings();
  setLocalActiveIndicatorPanes(
    id ? localActiveIndicatorPanes.value.filter((pane) => pane !== id) : [],
  );
}

function selectIndicatorPane(id: GpuChartIndicatorPane) {
  closeIndicatorSettings();
  localActiveIndicatorPane.value = id;
  if (indicatorPaneTabActive(id)) {
    setLocalActiveIndicatorPanes(
      localActiveIndicatorPanes.value.filter((pane) => pane !== id),
    );
    return;
  }
  if (indicatorPaneSelectionLimitReached.value) return;
  setLocalActiveIndicatorPanes([...localActiveIndicatorPanes.value, id]);
}

function startIndicatorPaneResize(event: MouseEvent) {
  const hud = hudRef.value;
  if (!hud) return;
  const rect = hud.getBoundingClientRect();
  if (rect.height <= 0) return;

  stopPaneResizeDrag?.();
  cancelSmoothX();
  autoFitVisibleY = true;
  draggedDuringPointer = true;
  indicatorPaneResizing.value = true;
  const previousCursor = document.body.style.cursor;
  document.body.style.cursor = "ns-resize";

  const updateHeight = (clientY: number) => {
    const tabBarHeight = indicatorTabBarHeightCss();
    const paneCount = Math.max(1, activeIndicatorPaneIds.value.length);
    const nextRatio = (rect.bottom - tabBarHeight - clientY) / rect.height / paneCount;
    setLocalIndicatorPaneHeight(nextRatio);
  };
  const onMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    updateHeight(moveEvent.clientY);
  };
  const onUp = () => {
    stopPaneResizeDrag?.();
  };

  stopPaneResizeDrag = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = previousCursor;
    indicatorPaneResizing.value = false;
    stopPaneResizeDrag = null;
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  updateHeight(event.clientY);
}

function startIndicatorSettingsDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  stopSettingsDrag?.();
  indicatorSettingsDragging.value = true;
  const startPosition = indicatorSettingsPosition.value ?? defaultIndicatorSettingsPosition();
  const startX = event.clientX;
  const startY = event.clientY;
  const previousCursor = document.body.style.cursor;
  document.body.style.cursor = "grabbing";

  const onMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    indicatorSettingsPosition.value = clampIndicatorSettingsPosition({
      left: startPosition.left + moveEvent.clientX - startX,
      top: startPosition.top + moveEvent.clientY - startY,
    });
  };
  const onUp = () => {
    stopSettingsDrag?.();
  };

  stopSettingsDrag = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = previousCursor;
    indicatorSettingsDragging.value = false;
    stopSettingsDrag = null;
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function defaultIndicatorSettingsPosition() {
  const shell = shellRef.value;
  const shellHeight = shell?.clientHeight ?? 360;
  const top = Math.min(
    Math.max(12, indicatorPaneTopCss.value + 32),
    Math.max(12, shellHeight - indicatorSettingsSize().height - 12),
  );
  return { left: 12, top };
}

function indicatorSettingsSize() {
  const rect = indicatorSettingsRef.value?.getBoundingClientRect();
  return {
    width: rect?.width && Number.isFinite(rect.width) ? rect.width : 336,
    height: rect?.height && Number.isFinite(rect.height) ? rect.height : 260,
  };
}

function clampIndicatorSettingsPosition(position: { left: number; top: number }) {
  const shell = shellRef.value;
  const width = shell?.clientWidth ?? 640;
  const height = shell?.clientHeight ?? 360;
  const size = indicatorSettingsSize();
  const pad = 8;
  const maxLeft = Math.max(pad, width - size.width - pad);
  const maxTop = Math.max(pad, height - size.height - pad);
  return {
    left: Math.max(pad, Math.min(maxLeft, position.left)),
    top: Math.max(pad, Math.min(maxTop, position.top)),
  };
}

function setLocalIndicatorPaneHeight(value: number) {
  indicatorPaneHeightRatio.value = clampIndicatorPaneHeightRatio(value);
  fitVisibleYIfEnabled();
  applyView();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);
}

function clampIndicatorPaneHeightRatio(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_INDICATOR_PANE_HEIGHT_RATIO;
  return Math.max(
    MIN_INDICATOR_PANE_HEIGHT_RATIO,
    Math.min(MAX_INDICATOR_PANE_HEIGHT_RATIO, parsed),
  );
}

function syncLocalIndicatorPaneState(appearance: GpuChartAppearance) {
  localActiveIndicatorPanes.value = [...appearance.activeIndicatorPanes];
  localActiveIndicatorPane.value =
    appearance.activeIndicatorPanes[0] ?? appearance.activeIndicatorPane;
  indicatorPaneMinimized.value =
    appearance.indicatorPaneMinimized || appearance.activeIndicatorPanes.length === 0;
  indicatorPaneHeightRatio.value = clampIndicatorPaneHeightRatio(appearance.stochRsiPaneHeight);
}

function indicatorPaneTabActive(id: GpuChartIndicatorPane) {
  return activeIndicatorPaneIds.value.includes(id);
}

function indicatorPaneTabDisabled(id: GpuChartIndicatorPane) {
  return !indicatorPaneTabActive(id) && indicatorPaneSelectionLimitReached.value;
}

function setLocalActiveIndicatorPanes(value: GpuChartIndicatorPane[]) {
  const next = normalizeIndicatorPaneSelection(value);
  localActiveIndicatorPanes.value = next;
  indicatorPaneMinimized.value = next.length === 0;
  if (next.length && !next.includes(localActiveIndicatorPane.value)) {
    localActiveIndicatorPane.value = next[0] ?? localActiveIndicatorPane.value;
  }
  if (indicatorSettingsOpen.value && !next.includes(localActiveIndicatorPane.value)) {
    closeIndicatorSettings();
  }
  const nextAppearance = patchAppearance({});
  emit("save-appearance", nextAppearance);
  fitVisibleYIfEnabled();
  applyView();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);
}

function normalizeIndicatorPaneSelection(value: GpuChartIndicatorPane[]) {
  const available = new Set(indicatorPaneTabs.value.map((pane) => pane.id));
  const next: GpuChartIndicatorPane[] = [];
  for (const id of value) {
    if (!available.has(id) || next.includes(id)) continue;
    next.push(id);
    if (next.length >= MAX_ACTIVE_GPU_CHART_INDICATOR_PANES) break;
  }
  return next;
}

function localIndicatorPaneAppearance() {
  const activePanes = normalizeIndicatorPaneSelection(localActiveIndicatorPanes.value);
  return {
    activeIndicatorPane: localActiveIndicatorPane.value,
    activeIndicatorPanes: activePanes,
    indicatorPaneMinimized: activePanes.length === 0,
    stochRsiPaneHeight: indicatorPaneHeightRatio.value,
  };
}

function isIndicatorPaneType(type: GpuChartIndicatorType): type is GpuChartIndicatorPane {
  return (
    type === "stochRsi" ||
    type === "rsi" ||
    type === "macd" ||
    type === "atr" ||
    type === "relativeReturn"
  );
}

function indicatorTabBarHeight(scale: number) {
  return indicatorTabsVisible.value ? INDICATOR_TAB_BAR_HEIGHT_PX * scale : 0;
}

function indicatorTabBarHeightCss() {
  return indicatorTabsVisible.value ? INDICATOR_TAB_BAR_HEIGHT_PX : 0;
}

function patchAppearance(partial: Partial<GpuChartAppearance>) {
  const next = normalizeGpuChartAppearance({
    ...resolvedAppearance.value,
    ...localIndicatorPaneAppearance(),
    ...partial,
  });
  localAppearance.value = next;
  emit("update:appearance", next);
  return next;
}

function applyTimeSyncCommand(command: GpuChartTimeSyncCommand | null | undefined) {
  if (!command || command.seq === lastAppliedTimeSyncSeq) return;
  if (!chart || !state?.candles.length) return;
  lastAppliedTimeSyncSeq = command.seq;
  if (String(command.sourceId ?? "") === String(props.syncId ?? "")) return;
  applyTimeSyncWindow(command.window);
}

function applyTimeSyncWindow(timeWindow: GpuChartTimeWindow) {
  if (!state?.candles.length) return;
  const xBounds = timeWindowToXBounds(timeWindow, state.firstBucket, state.timeframeSec);
  if (!xBounds) return;
  const target = clampXBounds({
    ...view,
    minX: xBounds.minX,
    maxX: xBounds.maxX,
  });
  if (
    Math.abs(target.minX - view.minX) <= SMOOTH_X_EPSILON_CANDLES &&
    Math.abs(target.maxX - view.maxX) <= SMOOTH_X_EPSILON_CANDLES
  ) {
    return;
  }
  setSmoothXTarget(target);
  void maybeLoadOlderCandles();
}

function emitTimeSync(value: GpuChartTimeSyncAction) {
  emit("time-sync", value);
}

function emitTimeSyncWindowForView(nextView: Pick<ViewBounds, "minX" | "maxX">) {
  if (!state?.candles.length) return;
  const timeWindow = viewBoundsToTimeWindow(nextView, state.firstBucket, state.timeframeSec);
  if (!timeWindow) return;
  emitTimeSync({ kind: "window", window: timeWindow });
}

function smoothShiftPanBy(shift: number, options: { emit?: boolean } = {}) {
  if (!Number.isFinite(shift) || shift === 0 || !state?.candles.length) return;
  const base = smoothXTarget ?? { minX: view.minX, maxX: view.maxX };
  const target = clampXBounds({
    ...view,
    minX: base.minX + shift,
    maxX: base.maxX + shift,
  });
  if (options.emit !== false) {
    const actualShift = target.minX - base.minX;
    if (Number.isFinite(actualShift) && actualShift !== 0) {
      emitTimeSyncWindowForView(target);
    }
  }
  setSmoothXTarget(target);
}

function smoothZoomBy(
  scale: number,
  anchorRatio: number,
  options: { emit?: boolean } = {},
) {
  if (!Number.isFinite(scale) || scale <= 0 || !state?.candles.length) return;
  const ratio = Math.max(0, Math.min(1, anchorRatio));
  const base = smoothXTarget ?? { minX: view.minX, maxX: view.maxX };
  const width = Math.max(1e-9, base.maxX - base.minX);
  const anchorX = base.minX + ratio * width;
  const nextWidth = width * scale;
  const target = clampXBounds(
    {
      ...view,
      minX: anchorX - ratio * nextWidth,
      maxX: anchorX + (1 - ratio) * nextWidth,
    },
    { x: anchorX, ratio },
  );
  if (options.emit !== false) {
    const actualScale = Math.max(1e-9, target.maxX - target.minX) / width;
    if (Number.isFinite(actualScale) && Math.abs(actualScale - 1) > 1e-6) {
      emitTimeSyncWindowForView(target);
    }
  }
  setSmoothXTarget(target);
}

function setSmoothXTarget(target: ViewBounds) {
  smoothXTarget = { minX: target.minX, maxX: target.maxX };
  if (smoothXFrame == null) {
    smoothXFrame = requestAnimationFrame(stepSmoothX);
  }
}

function stepSmoothX() {
  smoothXFrame = null;
  if (!mounted || !chart || !smoothXTarget) {
    smoothXTarget = null;
    return;
  }

  const target = smoothXTarget;
  const nextMinX = view.minX + (target.minX - view.minX) * SMOOTH_X_EASE;
  const nextMaxX = view.maxX + (target.maxX - view.maxX) * SMOOTH_X_EASE;
  const xDone =
    Math.abs(target.minX - nextMinX) <= SMOOTH_X_EPSILON_CANDLES &&
    Math.abs(target.maxX - nextMaxX) <= SMOOTH_X_EPSILON_CANDLES;

  view.minX = xDone ? target.minX : nextMinX;
  view.maxX = xDone ? target.maxX : nextMaxX;
  clampViewX();
  const yDone = fitVisibleYIfEnabled({ smooth: true });
  applyView();
  void maybeLoadOlderCandles();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);

  if (xDone && yDone) {
    smoothXTarget = null;
    fitVisibleYIfEnabled();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
    return;
  }

  smoothXFrame = requestAnimationFrame(stepSmoothX);
}

function cancelSmoothX() {
  if (smoothXFrame != null) {
    cancelAnimationFrame(smoothXFrame);
  }
  smoothXFrame = null;
  smoothXTarget = null;
}

function attachInteractions(canvas: HTMLCanvasElement, hud: HTMLCanvasElement) {
  let dragging = false;
  let dragMode: "pan" | "scale-y" = "pan";
  let wheelMode: "shift-pan" | "zoom" | null = null;
  let wheelModeResetTimer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let startView = { ...view };
  let startAnchorRatio = 0.5;

  const resetWheelModeSoon = () => {
    if (wheelModeResetTimer) clearTimeout(wheelModeResetTimer);
    wheelModeResetTimer = setTimeout(() => {
      wheelMode = null;
      wheelModeResetTimer = null;
    }, WHEEL_GESTURE_QUIET_MS);
  };

  const clearWheelModeTimer = () => {
    if (wheelModeResetTimer) clearTimeout(wheelModeResetTimer);
    wheelModeResetTimer = null;
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;

    if (event.shiftKey || isHorizontalWheelPan(event)) {
      wheelMode = "shift-pan";
      resetWheelModeSoon();
      const delta = normalizedWheelDeltaPx(event, rect.height);
      const xSpan = view.maxX - view.minX;
      const shift = (delta / rect.width) * xSpan;
      smoothShiftPanBy(shift);
      return;
    }

    if (wheelMode === "shift-pan") {
      resetWheelModeSoon();
      return;
    }

    wheelMode = "zoom";
    resetWheelModeSoon();
    const alpha = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const delta = normalizedWheelDeltaPx(event, rect.height);
    smoothZoomBy(wheelZoomScale(delta), alpha);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    if (anchoredVwapPickMode.value) {
      draggedDuringPointer = false;
      canvas.style.cursor = "crosshair";
      return;
    }
    cancelSmoothX();
    const rect = canvas.getBoundingClientRect();
    dragging = true;
    draggedDuringPointer = false;
    dragMode = isPriceScaleDragZone(event, rect) ? "scale-y" : "pan";
    startX = event.clientX;
    startY = event.clientY;
    startView = { ...view };
    startAnchorRatio = pointerYRatio(event, rect);
    canvas.style.cursor = dragMode === "scale-y" ? "ns-resize" : "grabbing";
  };

  const onMouseUp = () => {
    dragging = false;
    canvas.style.cursor = anchoredVwapPickMode.value ? "crosshair" : "";
  };

  const onMouseMove = (event: MouseEvent) => {
    const rect = hud.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mousePos = {
      px: (event.clientX - rect.left) * dpr,
      py: (event.clientY - rect.top) * dpr,
    };
    if (dragging) {
      if (Math.abs(event.clientX - startX) > 3 || Math.abs(event.clientY - startY) > 3) {
        draggedDuringPointer = true;
        autoFitVisibleY = false;
      }

      if (dragMode === "scale-y") {
        const scale = Math.exp((event.clientY - startY) / Y_AXIS_SCALE_SENSITIVITY_PX);
        view = scaleYView(startView, startAnchorRatio, scale);
      } else {
        const previousMinX = view.minX;
        const dx = ((event.clientX - startX) / rect.width) * (startView.maxX - startView.minX);
        const dy =
          ((event.clientY - startY) / pricePaneHeightCss(rect)) *
          (startView.maxY - startView.minY);
        view.minX = startView.minX - dx;
        view.maxX = startView.maxX - dx;
        view.minY = startView.minY + dy;
        view.maxY = startView.maxY + dy;
        clampViewX();
        const actualShift = view.minX - previousMinX;
        if (Number.isFinite(actualShift) && actualShift !== 0) {
          emitTimeSyncWindowForView(view);
        }
        void maybeLoadOlderCandles();
      }
      applyView();
      scheduleGpuRender(renderNow);
    } else {
      canvas.style.cursor = anchoredVwapPickMode.value
        ? "crosshair"
        : isPriceScaleDragZone(event, rect)
          ? "ns-resize"
          : "";
    }
    drawHud(mousePos);
  };

  const onMouseLeave = () => {
    mousePos = null;
    if (!dragging) canvas.style.cursor = "";
    drawHud(null);
  };

  const onDoubleClick = (event: MouseEvent) => {
    event.preventDefault();
    if (anchoredVwapPickMode.value) {
      anchoredVwapPickMode.value = false;
      return;
    }
    resetVisibleYMode();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !anchoredVwapPickMode.value) return;
    anchoredVwapPickMode.value = false;
    canvas.style.cursor = "";
  };

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);
  cleanupFns.push(
    () => canvas.removeEventListener("wheel", onWheel),
    () => canvas.removeEventListener("mousedown", onMouseDown),
    () => canvas.removeEventListener("mousemove", onMouseMove),
    () => canvas.removeEventListener("mouseleave", onMouseLeave),
    () => canvas.removeEventListener("dblclick", onDoubleClick),
    () => window.removeEventListener("mouseup", onMouseUp),
    () => window.removeEventListener("keydown", onKeyDown),
    clearWheelModeTimer,
  );
}

function normalizedWheelDeltaPx(event: WheelEvent, pageHeight: number) {
  let delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (event.deltaMode === 1) delta *= 16;
  if (event.deltaMode === 2) delta *= Math.max(1, pageHeight);
  return delta;
}

function isPriceScaleDragZone(event: MouseEvent, rect: DOMRect) {
  if (rect.width <= PRICE_SCALE_DRAG_WIDTH_PX * 2) return false;
  if (event.clientY - rect.top > pricePaneHeightCss(rect)) return false;
  return rect.right - event.clientX <= PRICE_SCALE_DRAG_WIDTH_PX;
}

function pointerYRatio(event: MouseEvent, rect: DOMRect) {
  const priceHeight = pricePaneHeightCss(rect);
  if (priceHeight <= 0) return 0.5;
  return Math.max(0, Math.min(1, (event.clientY - rect.top) / priceHeight));
}

function pricePaneHeightCss(rect: DOMRect) {
  const hud = hudRef.value;
  if (!hud) return Math.max(1, rect.height);
  const panes = currentIndicatorPaneLayouts();
  const scale = canvasScale(hud);
  if (panes.length) return Math.max(1, panes[0].top / scale);
  return Math.max(1, rect.height - indicatorTabBarHeightCss());
}

function isViewFollowingLatest() {
  const last = state?.candles[state.candles.length - 1];
  return isFollowingLatest(view, last?.x, rightEdgePaddingCandles());
}

function clampXBounds(nextView: ViewBounds, anchor?: { x: number; ratio: number }): ViewBounds {
  if (!state?.candles.length) return nextView;
  return clampXView(
    nextView,
    {
      firstX: state.candles[0].x,
      lastX: state.candles[state.candles.length - 1].x,
      rightPaddingCandles: rightEdgePaddingCandles(nextView.maxX - nextView.minX),
    },
    anchor,
  );
}

function displayCandleLimit() {
  return Math.max(1, Math.floor(Number.isFinite(props.limit) ? props.limit : 1));
}

function indicatorWarmupCandles() {
  const appearance = resolvedAppearance.value;
  const movingAverageWarmup = Math.max(
    0,
    ...appearance.indicators
      .filter((indicator) => indicator.enabled && gpuChartIndicatorCanAddInstance(indicator.type))
      .map((indicator) => gpuChartMovingAveragePeriod(appearance, indicator)),
  );
  return Math.max(
    MIN_INDICATOR_WARMUP_CANDLES,
    movingAverageWarmup,
    appearance.bollingerPeriod,
    chartIndicatorEnabled("srZones", appearance) ? appearance.srZoneLookback : 0,
    chartIndicatorEnabled("marketStructure", appearance)
      ? Math.max(appearance.marketStructureLookback, appearance.marketStructureAtrPeriod)
      : 0,
    appearance.rsiPeriod,
    appearance.macdSlowPeriod + appearance.macdSignalPeriod,
    appearance.atrPeriod,
    appearance.stochRsiRsiPeriod +
      appearance.stochRsiPeriod +
      appearance.stochRsiKPeriod +
      appearance.stochRsiDPeriod,
  );
}

function historyLoadLimit() {
  const visible = displayCandleLimit();
  return Math.min(
    MAX_HISTORY_LOAD_CANDLES,
    Math.max(visible * 2, visible + indicatorWarmupCandles()),
  );
}

function historyPageLimit() {
  return Math.min(MAX_HISTORY_LOAD_CANDLES, Math.max(displayCandleLimit(), indicatorWarmupCandles()));
}

function initialVisibleCandles() {
  if (!state?.candles.length) return [];
  return state.candles.slice(-displayCandleLimit());
}

function visibleCandleCountForBounds(bounds: Pick<ViewBounds, "minX" | "maxX">) {
  return Math.max(1, Math.round(Math.abs(bounds.maxX - bounds.minX)) + 1);
}

function rightEdgePaddingCandles(visibleCandles = displayCandleLimit()) {
  const hud = hudRef.value;
  const widthPx = hud?.width ?? 0;
  const scale = hud ? canvasScale(hud) : Math.max(1, window.devicePixelRatio || 1);
  const reservePx = Math.max(
    RIGHT_LABEL_MIN_RESERVE_PX * scale,
    resolvedAppearance.value.fontSize * scale * 5,
  );
  const visible = Math.max(
    1,
    Number.isFinite(visibleCandles) ? visibleCandles : displayCandleLimit(),
  );
  if (!Number.isFinite(widthPx) || widthPx <= 0 || reservePx >= widthPx * 0.45) {
    return RIGHT_EDGE_PADDING_CANDLES;
  }
  const padding = Math.ceil((reservePx * visible) / Math.max(1, widthPx - reservePx)) + 1;
  return Math.max(RIGHT_EDGE_PADDING_CANDLES, padding);
}

function clampViewX(anchor?: { x: number; ratio: number }) {
  view = clampXBounds(view, anchor);
}

function fitCanvases() {
  const canvas = canvasRef.value;
  const hud = hudRef.value;
  if (!canvas || !hud) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  for (const target of [canvas, hud]) {
    const rect = target.getBoundingClientRect();
    const width = Math.max(2, Math.floor(rect.width * dpr));
    const height = Math.max(2, Math.floor(rect.height * dpr));
    if (target.width !== width) target.width = width;
    if (target.height !== height) target.height = height;
  }
}

function currentIndicatorPaneLayouts(): IndicatorPaneLayout[] {
  const hud = hudRef.value;
  if (!hud || !indicatorPaneAvailable()) return [];
  return indicatorPaneLayouts(hud.height, canvasScale(hud), activeIndicatorPaneIds.value);
}

function indicatorPaneAvailable() {
  return Boolean(
    props.showIndicatorPanes &&
      !indicatorPaneMinimized.value &&
      activeIndicatorPaneIds.value.length &&
      state?.candles.length &&
      state.candles.length > 0,
  );
}

function indicatorPaneLayouts(
  height: number,
  scale: number,
  paneIds: GpuChartIndicatorPane[],
): IndicatorPaneLayout[] {
  const count = paneIds.length;
  if (!count) return [];
  const footerHeight = indicatorTabBarHeight(scale);
  const chartHeight = Math.max(1, height - footerHeight);
  const minPaneHeight = MIN_INDICATOR_PANE_HEIGHT_PX * scale;
  const minPriceHeight = MIN_PRICE_PANE_HEIGHT_PX * scale;
  const maxPaneHeight = Math.max(0, chartHeight - minPriceHeight);
  if (maxPaneHeight <= 0) return [];

  const totalPaneHeight = Math.max(
    Math.min(maxPaneHeight, minPaneHeight * count),
    Math.min(
      chartHeight * MAX_STACKED_INDICATOR_PANE_HEIGHT_RATIO,
      chartHeight * indicatorPaneHeightRatio.value * count,
      maxPaneHeight,
    ),
  );
  const paneHeight = Math.max(1, totalPaneHeight / count);
  const appearance = resolvedAppearance.value;
  const pad = Math.min(
    paneHeight * 0.3,
    Math.max(8 * scale, appearance.fontSize * scale * 0.8),
  );
  const top = chartHeight - totalPaneHeight;
  return paneIds.map((id, index) => {
    const paneTop = top + paneHeight * index;
    const paneBottom = index === count - 1 ? chartHeight : paneTop + paneHeight;
    return {
      id,
      top: paneTop,
      bottom: paneBottom,
      height: paneBottom - paneTop,
      innerTop: paneTop + pad,
      innerBottom: paneBottom - pad,
      innerHeight: Math.max(1, paneBottom - paneTop - pad * 2),
    };
  });
}

function drawHud(pos: { px: number; py: number } | null) {
  const hud = hudRef.value;
  if (!hud) return;
  const ctx = hud.getContext("2d");
  if (!ctx) return;
  const w = hud.width;
  const h = hud.height;
  const appearance = resolvedAppearance.value;
  const scale = canvasScale(hud);
  const fontPx = appearance.fontSize * scale;
  const smallFontPx = Math.max(10 * scale, fontPx * 0.86);
  const pad = 6 * scale;
  const panes = currentIndicatorPaneLayouts();
  const firstPane = panes[0] ?? null;
  const priceBottom = firstPane?.top ?? h;
  const bottomChromeReserve = firstPane ? 0 : indicatorTabBarHeight(scale);
  const priceAxisBottom = Math.max(fontPx * 2, priceBottom - bottomChromeReserve);
  const timeAxisHeightPx = appearance.showTimeAxis ? timeAxisHeight(scale, fontPx) : 0;
  const priceDecorationBottom = Math.max(fontPx * 1.4, priceAxisBottom - timeAxisHeightPx);
  const labelRects: HudLabelRect[] = [];
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "middle";
  if (appearance.showGrid) {
    ctx.strokeStyle = hexToRgba(appearance.gridColor, 0.45);
    ctx.fillStyle = hexToRgba(appearance.textColor, 0.72);
    const ticks = yTicks(view.minY, view.maxY, 5);
    for (const tick of ticks) {
      const y = yToPx(tick, h);
      if (y < 0 || y > priceDecorationBottom - fontPx * 0.65) continue;
      const label = formatPrice(tick);
      const labelWidth = ctx.measureText(label).width;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
      ctx.fillText(label, Math.max(4 * scale, w - labelWidth - pad), y);
    }
  }
  if (chartIndicatorEnabled("srZones", appearance)) {
    drawSupportResistanceZones(ctx, priceDecorationBottom, scale, labelRects);
  }
  if (chartIndicatorEnabled("volume", appearance)) {
    drawVolumeOverlay(ctx, priceDecorationBottom, scale);
  }
  if (chartIndicatorEnabled("marketStructure", appearance)) {
    drawMarketStructureOverlay(ctx, priceDecorationBottom, scale, labelRects);
  }
  if (appearance.showGrid || appearance.showTimeAxis) {
    drawTimeAxis(ctx, priceAxisBottom, priceDecorationBottom, scale, fontPx, pad);
  }
  if (chartIndicatorEnabled("anchoredVwap", appearance)) {
    drawAnchoredVwapSignals(ctx, priceDecorationBottom, scale, labelRects);
    drawAnchoredVwapAnchor(ctx, priceDecorationBottom, scale, labelRects);
  }

  if (appearance.showWindowHighLow) {
    const extrema = visibleWindowExtrema();
    if (extrema) {
      drawWindowPriceLine(
        ctx,
        extrema.high,
        "H",
        appearance.windowHighColor,
        priceDecorationBottom,
        fontPx,
        pad,
        scale,
      );
      if (extrema.low !== extrema.high) {
        drawWindowPriceLine(
          ctx,
          extrema.low,
          "L",
          appearance.windowLowColor,
          priceDecorationBottom,
          fontPx,
          pad,
          scale,
        );
      }
    }
  }

  const last = state?.candles[state.candles.length - 1];
  if (last && appearance.showLastPriceLine) {
    const y = yToPx(last.c, h);
    if (y >= 0 && y <= priceDecorationBottom) {
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.strokeStyle = hexToRgba(appearance.lastPriceColor, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      const label = formatPrice(last.c);
      const labelWidth = ctx.measureText(label).width;
      const boxWidth = labelWidth + pad * 2;
      const boxHeight = fontPx + pad * 1.4;
      const boxX = Math.max(0, w - boxWidth - 4 * scale);
      const boxY = y - boxHeight / 2;
      ctx.fillStyle = hexToRgba(appearance.lastPriceColor, 0.95);
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.fillStyle = "white";
      ctx.fillText(label, boxX + pad, y);
    }
  }

  const paneResults: IndicatorPaneDrawResult[] = [];
  for (const pane of panes) {
    const series = drawIndicatorPane(ctx, pane, scale);
    if (series) paneResults.push({ pane, series });
  }
  syncIndicatorPaneUi(panes, paneResults, scale);

  if (pos) {
    if (appearance.showCrosshair) {
      ctx.strokeStyle = hexToRgba(appearance.crosshairColor, 0.38);
      ctx.beginPath();
      ctx.moveTo(pos.px + 0.5, 0);
      ctx.lineTo(pos.px + 0.5, h);
      ctx.moveTo(0, pos.py + 0.5);
      ctx.lineTo(w, pos.py + 0.5);
      ctx.stroke();
      if (pos.py >= 0 && pos.py <= priceDecorationBottom) {
        drawPointerPriceLabel(ctx, pos.py, priceDecorationBottom, fontPx, pad, scale);
      }
    }
    const candle = nearestCandle(pxToX(pos.px, w));
    if (candle && appearance.showTooltip) {
      ctx.font = `${smallFontPx}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      const hoveredPane = paneResults.find(
        (result) => pos.py >= result.pane.top && pos.py <= result.pane.bottom,
      );
      if (hoveredPane) {
        drawIndicatorTooltip(
          ctx,
          pos.px + 8 * scale,
          pos.py - 8 * scale,
          candle.x,
          hoveredPane.series,
        );
      } else {
        drawTooltip(ctx, pos.px + 8 * scale, pos.py - 8 * scale, candle);
      }
    }
  }
  ctx.restore();
}

function drawVolumeOverlay(
  ctx: CanvasRenderingContext2D,
  priceBottom: number,
  scale: number,
) {
  if (!state?.candles.length || priceBottom <= 0) return;
  const appearance = resolvedAppearance.value;
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  let maxVolume = 0;
  for (const candle of state.candles) {
    if (candle.x < minX || candle.x > maxX) continue;
    const volume = candleVolumeValue(candle);
    if (volume != null) maxVolume = Math.max(maxVolume, volume);
  }
  if (maxVolume <= 0) return;

  const span = Math.max(1, view.maxX - view.minX);
  const slotWidth = ctx.canvas.width / span;
  const barWidth = sliverGapBarWidth(slotWidth, scale);
  const height = Math.max(
    18 * scale,
    Math.min(180 * scale, priceBottom * appearance.volumeHeightRatio),
  );
  const bottom = Math.max(height, priceBottom - 4 * scale);
  const top = Math.max(0, bottom - height);

  ctx.save();
  ctx.strokeStyle = hexToRgba(appearance.gridColor, 0.2);
  ctx.beginPath();
  ctx.moveTo(0, bottom + 0.5);
  ctx.lineTo(ctx.canvas.width, bottom + 0.5);
  ctx.stroke();
  for (const candle of state.candles) {
    if (candle.x < minX || candle.x > maxX) continue;
    const volume = candleVolumeValue(candle);
    if (volume == null || volume <= 0) continue;
    const px = xToPx(candle.x, ctx.canvas.width);
    const barHeight = Math.max(1 * scale, (volume / maxVolume) * height);
    ctx.fillStyle = hexToRgba(
      candle.c >= candle.o ? appearance.volumeUpColor : appearance.volumeDownColor,
      appearance.volumeOpacity,
    );
    ctx.fillRect(px - barWidth / 2, Math.max(top, bottom - barHeight), barWidth, barHeight);
  }
  ctx.restore();
}

function currentMarketStructure() {
  const appearance = resolvedAppearance.value;
  return state?.candles.length
    ? computeMarketStructure(state.candles, {
        lookback: appearance.marketStructureLookback,
        pivotStrength: appearance.marketStructurePivotStrength,
        atrPeriod: appearance.marketStructureAtrPeriod,
        minMoveAtr: appearance.marketStructureMinMoveAtr,
        maxSwings: appearance.marketStructureMaxLabels,
        maxBreaks: Math.max(4, Math.ceil(appearance.marketStructureMaxLabels / 2)),
      })
    : emptyMarketStructure();
}

function emptyMarketStructure(): MarketStructureState {
  return {
    swings: [],
    breaks: [],
    trend: "neutral",
    summary: {
      state: "neutral",
      trend: "neutral",
      lastBreak: null,
      lastSwingHigh: null,
      lastSwingLow: null,
      updatedX: null,
      updatedTs: null,
    },
  };
}

function formatStructureSummaryState(state: StructureSummaryState) {
  switch (state) {
    case "bullish":
      return "Bullish";
    case "bearish":
      return "Bearish";
    case "transitional":
      return "Transitional";
    case "neutral":
      return "Neutral";
  }
}

function drawAnchoredVwapAnchor(
  ctx: CanvasRenderingContext2D,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  const candle = anchoredVwapAnchorCandle();
  if (!candle || priceBottom <= 0) return;
  const x = xToPx(candle.x, ctx.canvas.width);
  if (x < -24 * scale || x > ctx.canvas.width + 24 * scale) return;

  const appearance = resolvedAppearance.value;
  const y = Math.max(
    0,
    Math.min(priceBottom, yToPx((candle.h + candle.l + candle.c) / 3, ctx.canvas.height)),
  );
  const label = "AVWAP";
  const padX = 5 * scale;
  const boxHeight = Math.max(14 * scale, appearance.fontSize * scale * 0.95);
  const boxWidth = ctx.measureText(label).width + padX * 2;
  const boxX = x + 5 * scale;
  const boxY = y - boxHeight / 2;

  ctx.save();
  ctx.setLineDash([3 * scale, 5 * scale]);
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeStyle = hexToRgba(appearance.anchoredVwapAnchorColor, 0.56);
  ctx.beginPath();
  ctx.moveTo(x + 0.5, 0);
  ctx.lineTo(x + 0.5, priceBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  const rect = placeHudLabelRect(
    ctx,
    labelRects,
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    priceBottom,
    scale,
    [0, -1, 1, -2, 2],
  );
  if (!rect) {
    ctx.restore();
    return;
  }
  ctx.fillStyle = hexToRgba(appearance.anchoredVwapAnchorColor, 0.2);
  ctx.strokeStyle = hexToRgba(appearance.anchoredVwapAnchorColor, 0.72);
  ctx.fillRect(rect.left, rect.top, boxWidth, boxHeight);
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, boxWidth, boxHeight);
  ctx.fillStyle = hexToRgba(appearance.anchoredVwapAnchorColor, 0.98);
  ctx.fillText(label, rect.left + padX, rect.top + boxHeight / 2);
  ctx.restore();
}

function drawAnchoredVwapSignals(
  ctx: CanvasRenderingContext2D,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  if (!state?.candles.length || priceBottom <= 0) return;
  const appearance = resolvedAppearance.value;
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  const signals = computeAnchoredVwapSignals(
    state.candles,
    { anchorBucket: appearance.anchoredVwapAnchorBucket },
    32,
  ).filter((signal) => signal.x >= minX && signal.x <= maxX);
  if (!signals.length) return;

  ctx.save();
  ctx.font = `${Math.max(9 * scale, appearance.fontSize * scale * 0.68)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "middle";
  for (const signal of signals) {
    drawAnchoredVwapSignal(ctx, signal, priceBottom, scale, labelRects);
  }
  ctx.restore();
}

function drawAnchoredVwapSignal(
  ctx: CanvasRenderingContext2D,
  signal: AnchoredVwapSignal,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  const appearance = resolvedAppearance.value;
  const x = xToPx(signal.x, ctx.canvas.width);
  const y = yToPx(signal.price, ctx.canvas.height);
  if (x < -48 * scale || x > ctx.canvas.width + 48 * scale || y < -24 * scale || y > priceBottom + 24 * scale) {
    return;
  }
  const isReclaim = signal.kind === "reclaim";
  const color = isReclaim
    ? appearance.upColor
    : signal.kind === "failedReclaim"
      ? appearance.anchoredVwapColor
      : appearance.downColor;
  const text =
    signal.kind === "loss"
      ? "AVWAP loss"
      : signal.kind === "reclaim"
        ? "AVWAP reclaim"
        : "Fail reclaim";
  const padX = 5 * scale;
  const boxHeight = Math.max(13 * scale, appearance.fontSize * scale * 0.92);
  const boxWidth = ctx.measureText(text).width + padX * 2;
  const offset = (isReclaim ? -1 : 1) * (boxHeight * 1.1);
  const rect = placeHudLabelRect(
    ctx,
    labelRects,
    x - boxWidth / 2,
    y + offset,
    boxWidth,
    boxHeight,
    priceBottom,
    scale,
    isReclaim ? [0, -1, 1, -2, 2, -3, 3] : [0, 1, -1, 2, -2, 3, -3],
  );
  if (!rect) return;

  ctx.fillStyle = hexToRgba(color, 0.16);
  ctx.strokeStyle = hexToRgba(color, 0.68);
  ctx.fillRect(rect.left, rect.top, boxWidth, boxHeight);
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, boxWidth, boxHeight);
  ctx.fillStyle = hexToRgba(color, 0.96);
  ctx.fillText(text, rect.left + padX, rect.top + boxHeight / 2);
}

function drawMarketStructureOverlay(
  ctx: CanvasRenderingContext2D,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  if (!state?.candles.length || priceBottom <= 0) return;
  const appearance = resolvedAppearance.value;
  const structure = currentMarketStructure();
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  const swings = structure.swings
    .filter((swing) => swing.x >= minX && swing.x <= maxX)
    .slice(-appearance.marketStructureMaxLabels);
  const breaks = structure.breaks.filter(
    (item) =>
      (item.x >= minX && item.x <= maxX) ||
      (item.sourceSwingX >= minX && item.sourceSwingX <= maxX),
  );
  if (!swings.length && !breaks.length) return;

  ctx.save();
  ctx.font = `${Math.max(9 * scale, appearance.fontSize * scale * 0.72)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "middle";
  for (const item of breaks) {
    drawStructureBreak(ctx, item, priceBottom, scale, labelRects);
  }
  for (const swing of swings) {
    drawSwingLabel(ctx, swing, priceBottom, scale, labelRects);
  }
  ctx.restore();
}

function drawSwingLabel(
  ctx: CanvasRenderingContext2D,
  swing: SwingPoint,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  const appearance = resolvedAppearance.value;
  const color =
    swing.kind === "SwingHigh"
      ? appearance.marketStructureHighColor
      : appearance.marketStructureLowColor;
  const x = xToPx(swing.x, ctx.canvas.width);
  const y = yToPx(swing.price, ctx.canvas.height);
  if (x < -48 * scale || x > ctx.canvas.width + 48 * scale || y < -24 * scale || y > priceBottom + 24 * scale) {
    return;
  }
  const padX = 4 * scale;
  const boxHeight = Math.max(12 * scale, appearance.fontSize * scale * 0.95);
  const boxWidth = ctx.measureText(swing.label).width + padX * 2;
  const offset = (swing.kind === "SwingHigh" ? -1 : 1) * (boxHeight * 0.9);
  const rect = placeHudLabelRect(
    ctx,
    labelRects,
    x - boxWidth / 2,
    y + offset,
    boxWidth,
    boxHeight,
    priceBottom,
    scale,
    swing.kind === "SwingHigh" ? [0, -1, 1, -2, 2, -3, 3] : [0, 1, -1, 2, -2, 3, -3],
  );
  if (!rect) return;
  ctx.fillStyle = hexToRgba(color, 0.16);
  ctx.strokeStyle = hexToRgba(color, 0.72);
  ctx.fillRect(rect.left, rect.top, boxWidth, boxHeight);
  ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, boxWidth, boxHeight);
  ctx.fillStyle = hexToRgba(color, 0.95);
  ctx.fillText(swing.label, rect.left + padX, rect.top + boxHeight / 2);
}

function drawStructureBreak(
  ctx: CanvasRenderingContext2D,
  item: StructureBreak,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  const appearance = resolvedAppearance.value;
  const y = yToPx(item.level, ctx.canvas.height);
  if (y < 0 || y > priceBottom) return;
  const startX = Math.max(0, Math.min(ctx.canvas.width, xToPx(item.sourceSwingX, ctx.canvas.width)));
  const endX = Math.max(0, Math.min(ctx.canvas.width, xToPx(item.x, ctx.canvas.width)));
  if (Math.abs(endX - startX) <= 1) return;
  const color = appearance.marketStructureBreakColor;
  ctx.save();
  ctx.setLineDash([4 * scale, 5 * scale]);
  ctx.strokeStyle = hexToRgba(color, 0.68);
  ctx.beginPath();
  ctx.moveTo(startX, y + 0.5);
  ctx.lineTo(endX, y + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  const text = `${item.label} ${item.direction === "bullish" ? "UP" : "DN"}`;
  const padX = 5 * scale;
  const boxHeight = Math.max(13 * scale, appearance.fontSize * scale);
  const boxWidth = ctx.measureText(text).width + padX * 2;
  const rect = placeHudLabelRect(
    ctx,
    labelRects,
    endX + 4 * scale,
    y - boxHeight / 2,
    boxWidth,
    boxHeight,
    priceBottom,
    scale,
    [0, -1, 1, -2, 2, -3, 3],
    [0, -1, 1, -2],
  );
  if (rect) {
    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.strokeStyle = hexToRgba(color, 0.72);
    ctx.fillRect(rect.left, rect.top, boxWidth, boxHeight);
    ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, boxWidth, boxHeight);
    ctx.fillStyle = hexToRgba(color, 0.98);
    ctx.fillText(text, rect.left + padX, rect.top + boxHeight / 2);
  }
  ctx.restore();
}

function drawSupportResistanceZones(
  ctx: CanvasRenderingContext2D,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  if (!state?.candles.length || priceBottom <= 0) return;
  const appearance = resolvedAppearance.value;
  const zones = computeSupportResistanceZones(state.candles, {
    lookback: appearance.srZoneLookback,
    pivotStrength: appearance.srZonePivotStrength,
    maxZones: appearance.srZoneMaxZones,
    thicknessBps: appearance.srZoneThicknessBps,
    referencePrice: state.candles[state.candles.length - 1]?.c ?? null,
    zonesPerSide: Math.max(1, Math.ceil(appearance.srZoneMaxZones / 2)),
  });
  if (!zones.length) return;

  const minY = Math.min(view.minY, view.maxY);
  const maxY = Math.max(view.minY, view.maxY);
  ctx.save();
  ctx.lineWidth = Math.max(1, scale);
  ctx.font = `${Math.max(9 * scale, appearance.fontSize * scale * 0.78)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  for (const zone of zones) {
    if (zone.high < minY || zone.low > maxY) continue;
    drawSupportResistanceZone(ctx, zone, priceBottom, scale, labelRects);
  }
  ctx.restore();
}

function drawSupportResistanceZone(
  ctx: CanvasRenderingContext2D,
  zone: SupportResistanceZone,
  priceBottom: number,
  scale: number,
  labelRects: HudLabelRect[],
) {
  const appearance = resolvedAppearance.value;
  const color =
    zone.kind === "support"
      ? appearance.srSupportZoneColor
      : appearance.srResistanceZoneColor;
  const highY = yToPx(zone.high, ctx.canvas.height);
  const lowY = yToPx(zone.low, ctx.canvas.height);
  const centerY = yToPx(zone.center, ctx.canvas.height);
  let top = Math.max(0, Math.min(highY, lowY));
  let bottom = Math.min(priceBottom, Math.max(highY, lowY));
  if (bottom <= 0 || top >= priceBottom) return;
  if (bottom - top < 2 * scale) {
    top = Math.max(0, Math.min(priceBottom - 2 * scale, centerY - scale));
    bottom = Math.min(priceBottom, Math.max(2 * scale, centerY + scale));
  }

  const strengthAlpha = Math.min(0.16, 0.07 + zone.touches * 0.018);
  ctx.fillStyle = hexToRgba(color, strengthAlpha);
  ctx.fillRect(0, top, ctx.canvas.width, Math.max(1, bottom - top));
  ctx.setLineDash([4 * scale, 5 * scale]);
  ctx.strokeStyle = hexToRgba(color, 0.48);
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(ctx.canvas.width, top + 0.5);
  ctx.moveTo(0, bottom + 0.5);
  ctx.lineTo(ctx.canvas.width, bottom + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  const label = `${zone.kind === "support" ? "S" : "R"} ${formatPrice(zone.center)} x${zone.touches}`;
  const padX = 5 * scale;
  const boxHeight = Math.max(14 * scale, resolvedAppearance.value.fontSize * scale * 1.05);
  const labelWidth = ctx.measureText(label).width;
  const boxWidth = labelWidth + padX * 2;
  const boxX = 4 * scale;
  const boxY = centerY - boxHeight / 2;
  const rect = placeHudLabelRect(
    ctx,
    labelRects,
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    priceBottom,
    scale,
    [0, -1, 1, -2, 2],
  );
  if (!rect) return;
  ctx.fillStyle = hexToRgba(color, 0.72);
  ctx.fillRect(rect.left, rect.top, boxWidth, boxHeight);
  ctx.fillStyle = "white";
  ctx.fillText(label, rect.left + padX, rect.top + boxHeight / 2);
}

function placeHudLabelRect(
  ctx: CanvasRenderingContext2D,
  occupied: HudLabelRect[],
  preferredLeft: number,
  preferredTop: number,
  width: number,
  height: number,
  priceBottom: number,
  scale: number,
  ySteps: number[],
  xSteps = [0],
): HudLabelRect | null {
  const boundsPad = 2 * scale;
  const minLeft = boundsPad;
  const maxRight = ctx.canvas.width - boundsPad;
  const minTop = boundsPad;
  const maxBottom = priceBottom - boundsPad;
  if (maxRight - minLeft < width || maxBottom - minTop < height) return null;

  const gap = Math.max(2 * scale, 3);
  for (const yStep of ySteps) {
    for (const xStep of xSteps) {
      const rect = {
        left: clampLabelCoord(preferredLeft + xStep * (width + gap), width, minLeft, maxRight),
        top: clampLabelCoord(preferredTop + yStep * (height + gap), height, minTop, maxBottom),
        width,
        height,
      };
      if (!occupied.some((candidate) => hudLabelRectsOverlap(rect, candidate, gap))) {
        occupied.push(rect);
        return rect;
      }
    }
  }

  return null;
}

function clampLabelCoord(value: number, size: number, min: number, max: number) {
  return Math.max(min, Math.min(max - size, value));
}

function hudLabelRectsOverlap(a: HudLabelRect, b: HudLabelRect, gap: number) {
  return (
    a.left < b.left + b.width + gap &&
    a.left + a.width + gap > b.left &&
    a.top < b.top + b.height + gap &&
    a.top + a.height + gap > b.top
  );
}

function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  axisBottom: number,
  gridBottom: number,
  scale: number,
  fontPx: number,
  pad: number,
) {
  if (!state?.candles.length || state.timeframeSec <= 0 || view.maxX <= view.minX) return;
  const appearance = resolvedAppearance.value;
  const ticks = timeAxisTicks(ctx.canvas.width, fontPx, scale);
  if (!ticks.length) return;

  ctx.save();
  if (appearance.showGrid) {
    ctx.strokeStyle = hexToRgba(appearance.gridColor, 0.26);
    for (const tick of ticks) {
      const x = xToPx(tick.x, ctx.canvas.width);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, gridBottom);
      ctx.stroke();
    }
  }

  if (appearance.showTimeAxis) {
    const axisTop = Math.max(0, axisBottom - timeAxisHeight(scale, fontPx));
    ctx.fillStyle = hexToRgba(appearance.backgroundColor, 0.72);
    ctx.fillRect(0, axisTop, ctx.canvas.width, Math.max(1, axisBottom - axisTop));
    ctx.strokeStyle = hexToRgba(appearance.gridColor, 0.48);
    ctx.beginPath();
    ctx.moveTo(0, axisTop + 0.5);
    ctx.lineTo(ctx.canvas.width, axisTop + 0.5);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(appearance.textColor, 0.72);
    ctx.textBaseline = "middle";
    let lastRight = -Infinity;
    const labelY = axisTop + Math.max(1, axisBottom - axisTop) * 0.58;
    for (const tick of ticks) {
      const x = xToPx(tick.x, ctx.canvas.width);
      const width = ctx.measureText(tick.label).width;
      const left = Math.max(pad, Math.min(ctx.canvas.width - width - pad, x - width / 2));
      if (left < lastRight + 12 * scale) continue;
      ctx.fillText(tick.label, left, labelY);
      lastRight = left + width;
    }
  }
  ctx.restore();
}

function timeAxisTicks(width: number, fontPx: number, scale: number) {
  if (!state?.candles.length || state.timeframeSec <= 0) return [];
  const spanSec = Math.max(1, (view.maxX - view.minX) * state.timeframeSec);
  const estimatedLabelWidth = estimateTimeAxisLabelWidth(fontPx, scale, spanSec);
  const targetTickCount = Math.max(2, Math.floor(width / Math.max(1, estimatedLabelWidth)));
  const stepSec = timeAxisStepSeconds(spanSec / targetTickCount, state.timeframeSec, spanSec);
  const minTs = state.firstBucket + view.minX * state.timeframeSec;
  const maxTs = state.firstBucket + view.maxX * state.timeframeSec;
  const ticks: Array<{ x: number; ts: number; label: string }> = [];
  let ts = Math.ceil(minTs / stepSec) * stepSec;
  const maxIterations = Math.ceil((maxTs - ts) / stepSec) + 4;
  for (let i = 0; i < maxIterations && ts <= maxTs + stepSec * 0.001; i++, ts += stepSec) {
    const x = (ts - state.firstBucket) / state.timeframeSec;
    const px = xToPx(x, width);
    if (px >= -estimatedLabelWidth && px <= width + estimatedLabelWidth) {
      ticks.push({ x, ts, label: formatTimeAxisLabel(ts, spanSec, stepSec) });
    }
  }
  return ticks;
}

function timeAxisHeight(scale: number, fontPx: number) {
  return Math.max(18 * scale, fontPx * 1.5);
}

function drawIndicatorPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
): IndicatorPaneSeries | null {
  const appearance = resolvedAppearance.value;
  ctx.save();
  ctx.fillStyle = hexToRgba(appearance.backgroundColor, 0.97);
  ctx.fillRect(0, pane.top, ctx.canvas.width, pane.height);
  ctx.strokeStyle = hexToRgba(appearance.gridColor, 0.7);
  ctx.beginPath();
  ctx.moveTo(0, pane.top + 0.5);
  ctx.lineTo(ctx.canvas.width, pane.top + 0.5);
  ctx.stroke();

  ctx.font = `${Math.max(10 * scale, appearance.fontSize * scale * 0.86)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.fillStyle = hexToRgba(appearance.textColor, 0.7);
  let series: IndicatorPaneSeries;
  if (pane.id === "rsi") {
    drawOscillatorPaneDecorations(ctx, pane, scale, indicatorRangeBand(pane.id, appearance));
    series = drawRsiPane(ctx, pane, scale, appearance);
  } else if (pane.id === "macd") {
    series = drawMacdPane(ctx, pane, scale, appearance);
  } else if (pane.id === "atr") {
    series = drawAtrPane(ctx, pane, scale, appearance);
  } else if (pane.id === "relativeReturn") {
    series = drawRelativeReturnPane(ctx, pane, scale, appearance);
  } else {
    drawOscillatorPaneDecorations(ctx, pane, scale, indicatorRangeBand(pane.id, appearance));
    series = drawStochRsiPane(ctx, pane, scale, appearance);
  }
  ctx.restore();
  return series;
}

function drawOscillatorPaneDecorations(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  band: IndicatorRangeBand,
) {
  const valueScale = oscillatorIndicatorScale();
  drawIndicatorBandFill(ctx, pane, band, valueScale);
  drawIndicatorLevels(ctx, pane, scale, [50], valueScale);
  drawIndicatorBandLines(ctx, pane, scale, band, valueScale);
}

function drawStochRsiPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  appearance: GpuChartAppearance,
): IndicatorPaneSeries {
  const series = state
    ? computeStochRsi(
        state.candles,
        appearance.stochRsiRsiPeriod,
        appearance.stochRsiPeriod,
        appearance.stochRsiKPeriod,
        appearance.stochRsiDPeriod,
      )
    : { k: new Float32Array(), d: new Float32Array() };
  drawIndicatorLine(
    ctx,
    series.k,
    pane,
    appearance.stochRsiKColor,
    0.95,
    1.4 * scale,
    appearance.stochRsiSmooth,
    oscillatorIndicatorScale(),
  );
  drawIndicatorLine(
    ctx,
    series.d,
    pane,
    appearance.stochRsiDColor,
    0.88,
    1.4 * scale,
    appearance.stochRsiSmooth,
    oscillatorIndicatorScale(),
  );
  return { id: "stochRsi", k: series.k, d: series.d };
}

function drawRsiPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  appearance: GpuChartAppearance,
): IndicatorPaneSeries {
  const rsi = state ? computeRsiLine(state.candles, appearance.rsiPeriod) : new Float32Array();
  drawIndicatorLine(
    ctx,
    rsi,
    pane,
    appearance.rsiColor,
    0.95,
    1.5 * scale,
    appearance.rsiSmooth,
    oscillatorIndicatorScale(),
  );
  return { id: "rsi", rsi };
}

function drawMacdPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  appearance: GpuChartAppearance,
): IndicatorPaneSeries {
  const series = state
    ? computeMacd(
        state.candles,
        appearance.macdFastPeriod,
        appearance.macdSlowPeriod,
        appearance.macdSignalPeriod,
      )
    : {
        macd: new Float32Array(),
        signal: new Float32Array(),
        histogram: new Float32Array(),
      };
  const valueScale = indicatorLineBounds([series.macd, series.signal, series.histogram], {
    includeZero: true,
  });
  drawIndicatorScaleLabels(ctx, pane, scale, valueScale);
  drawIndicatorLevels(ctx, pane, scale, [0], valueScale);
  drawIndicatorHistogram(ctx, series.histogram, pane, valueScale, appearance, scale);
  drawIndicatorLine(
    ctx,
    series.macd,
    pane,
    appearance.macdLineColor,
    0.95,
    1.35 * scale,
    appearance.macdSmooth,
    valueScale,
  );
  drawIndicatorLine(
    ctx,
    series.signal,
    pane,
    appearance.macdSignalColor,
    0.9,
    1.35 * scale,
    appearance.macdSmooth,
    valueScale,
  );
  return { id: "macd", ...series };
}

function drawAtrPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  appearance: GpuChartAppearance,
): IndicatorPaneSeries {
  const atr = state ? computeAtrLine(state.candles, appearance.atrPeriod) : new Float32Array();
  const valueScale = indicatorLineBounds([atr], { minAtZero: true });
  drawIndicatorScaleLabels(ctx, pane, scale, valueScale);
  drawIndicatorLine(
    ctx,
    atr,
    pane,
    appearance.atrColor,
    0.95,
    1.45 * scale,
    appearance.atrSmooth,
    valueScale,
  );
  return { id: "atr", atr };
}

function drawRelativeReturnPane(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  appearance: GpuChartAppearance,
): IndicatorPaneSeries {
  const relativeReturn =
    state && benchmarkState
      ? computeRelativeCumulativeReturnLine(state.candles, benchmarkState.candles)
      : new Float32Array();
  const valueScale = indicatorLineBounds([relativeReturn], { includeZero: true });
  drawIndicatorScaleLabels(ctx, pane, scale, valueScale, formatRelativeReturnValue);
  drawIndicatorLevels(
    ctx,
    pane,
    scale,
    [0],
    valueScale,
    formatRelativeReturnValue,
    appearance.relativeReturnZeroColor,
  );
  drawIndicatorLine(
    ctx,
    relativeReturn,
    pane,
    appearance.relativeReturnColor,
    0.95,
    1.5 * scale,
    appearance.relativeReturnSmooth,
    valueScale,
  );
  return { id: "relativeReturn", relativeReturn };
}

function indicatorRangeBand(
  paneId: GpuChartIndicatorPane,
  appearance: GpuChartAppearance,
): IndicatorRangeBand {
  const lower =
    paneId === "rsi" ? appearance.rsiRangeLower : appearance.stochRsiRangeLower;
  const upper =
    paneId === "rsi" ? appearance.rsiRangeUpper : appearance.stochRsiRangeUpper;
  return {
    lower: Math.min(lower, upper),
    upper: Math.max(lower, upper),
    color: paneId === "rsi" ? appearance.rsiRangeColor : appearance.stochRsiRangeColor,
  };
}

function drawIndicatorBandFill(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  band: IndicatorRangeBand,
  valueScale: IndicatorValueScale,
) {
  const top = indicatorValueToPx(band.upper, pane, valueScale);
  const bottom = indicatorValueToPx(band.lower, pane, valueScale);
  ctx.fillStyle = hexToRgba(band.color, 0.12);
  ctx.fillRect(0, top, ctx.canvas.width, Math.max(1, bottom - top));
}

function drawIndicatorBandLines(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  band: IndicatorRangeBand,
  valueScale: IndicatorValueScale,
) {
  const levels = band.lower === band.upper ? [band.lower] : [band.upper, band.lower];
  ctx.save();
  ctx.setLineDash([5 * scale, 4 * scale]);
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeStyle = hexToRgba(band.color, 0.78);
  ctx.fillStyle = hexToRgba(band.color, 0.88);
  for (const level of levels) {
    const y = indicatorValueToPx(level, pane, valueScale);
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(ctx.canvas.width, y + 0.5);
    ctx.stroke();
    const label = formatIndicatorLevel(level);
    ctx.fillText(
      label,
      Math.max(4 * scale, ctx.canvas.width - ctx.measureText(label).width - 6 * scale),
      y,
    );
  }
  ctx.restore();
}

function drawIndicatorLevels(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  levels: number[],
  valueScale: IndicatorValueScale,
  formatLabel: (value: number) => string = String,
  color?: string,
) {
  const appearance = resolvedAppearance.value;
  ctx.fillStyle = hexToRgba(appearance.textColor, 0.7);
  for (const level of levels) {
    const y = indicatorValueToPx(level, pane, valueScale);
    ctx.strokeStyle = hexToRgba(
      color ?? appearance.gridColor,
      color ? 0.72 : level === 50 ? 0.46 : 0.3,
    );
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(ctx.canvas.width, y + 0.5);
    ctx.stroke();
    const label = formatLabel(level);
    ctx.fillText(
      label,
      Math.max(4 * scale, ctx.canvas.width - ctx.measureText(label).width - 6 * scale),
      y,
    );
  }
}

function drawIndicatorScaleLabels(
  ctx: CanvasRenderingContext2D,
  pane: IndicatorPaneLayout,
  scale: number,
  valueScale: IndicatorValueScale,
  formatLabel: (value: number) => string = formatDynamicIndicatorValue,
) {
  const appearance = resolvedAppearance.value;
  const levels = [valueScale.max, valueScale.min];
  ctx.save();
  ctx.fillStyle = hexToRgba(appearance.textColor, 0.66);
  for (const level of levels) {
    const y = indicatorValueToPx(level, pane, valueScale);
    const label = formatLabel(level);
    ctx.fillText(
      label,
      Math.max(4 * scale, ctx.canvas.width - ctx.measureText(label).width - 6 * scale),
      y,
    );
  }
  ctx.restore();
}

function oscillatorIndicatorScale(): IndicatorValueScale {
  return { min: 0, max: 100 };
}

function indicatorLineBounds(
  lines: Float32Array[],
  options: { includeZero?: boolean; minAtZero?: boolean } = {},
): IndicatorValueScale {
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  let min = Infinity;
  let max = -Infinity;
  for (const line of lines) {
    for (let i = 0; i < line.length; i += 2) {
      const x = line[i];
      const value = line[i + 1];
      if (!Number.isFinite(x) || !Number.isFinite(value) || x < minX || x > maxX) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return options.minAtZero ? { min: 0, max: 1 } : { min: -1, max: 1 };
  }
  if (options.includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (options.minAtZero) {
    min = 0;
    max = Math.max(max, 0);
  }
  if (max <= min) {
    const expansion = Math.max(Math.abs(max), 1);
    if (options.minAtZero) {
      max = min + expansion;
    } else {
      min -= expansion * 0.5;
      max += expansion * 0.5;
    }
  }

  const span = max - min;
  const pad = span * 0.08;
  return {
    min: options.minAtZero ? min : min - pad,
    max: max + pad,
  };
}

function syncIndicatorPaneUi(
  panes: IndicatorPaneLayout[],
  results: IndicatorPaneDrawResult[],
  scale: number,
) {
  if (!panes.length) {
    indicatorPaneVisible.value = false;
    indicatorPaneHeaders.value = [];
    if (indicatorSettingsOpen.value) closeIndicatorSettings();
    return;
  }

  indicatorPaneVisible.value = true;
  indicatorPaneTopCss.value = panes[0]?.top ? panes[0].top / scale : 0;
  const resultById = new Map(results.map((result) => [result.series.id, result]));
  indicatorPaneHeaders.value = panes.map((pane) => {
    const result = resultById.get(pane.id);
    return {
      id: pane.id,
      label: indicatorPaneLabel(pane.id),
      top: pane.top / scale,
      values: result ? indicatorHeaderValuesForSeries(result.series) : [],
    };
  });
  if (indicatorSettingsOpen.value && indicatorSettingsPosition.value) {
    if (!activeIndicatorPaneIds.value.includes(localActiveIndicatorPane.value)) {
      closeIndicatorSettings();
    } else {
      indicatorSettingsPosition.value = clampIndicatorSettingsPosition(indicatorSettingsPosition.value);
    }
  }
}

function indicatorHeaderValuesForSeries(series: IndicatorPaneSeries): IndicatorHeaderValue[] {
  if (series.id === "rsi") {
    const latestRsi = lastVisibleLineValue(series.rsi);
    return latestRsi == null
      ? []
      : [{ label: "RSI", value: formatIndicatorValue(latestRsi), className: "rsi" }];
  }

  if (series.id === "macd") {
    const latestMacd = lastVisibleLineValue(series.macd);
    const latestSignal = lastVisibleLineValue(series.signal);
    const latestHistogram = lastVisibleLineValue(series.histogram);
    const values: IndicatorHeaderValue[] = [];
    if (latestMacd != null) {
      values.push({ label: "M", value: formatDynamicIndicatorValue(latestMacd), className: "macd" });
    }
    if (latestSignal != null) {
      values.push({ label: "S", value: formatDynamicIndicatorValue(latestSignal), className: "signal" });
    }
    if (latestHistogram != null) {
      values.push({
        label: "H",
        value: formatSignedIndicatorValue(latestHistogram),
        className: latestHistogram >= 0 ? "histogram-up" : "histogram-down",
      });
    }
    return values;
  }

  if (series.id === "atr") {
    const latestAtr = lastVisibleLineValue(series.atr);
    return latestAtr == null
      ? []
      : [{ label: "ATR", value: formatDynamicIndicatorValue(latestAtr), className: "atr" }];
  }

  if (series.id === "relativeReturn") {
    const latestRelativeReturn = lastVisibleLineValue(series.relativeReturn);
    return latestRelativeReturn == null
      ? []
      : [
          {
            label: "RS",
            value: formatRelativeReturnValue(latestRelativeReturn),
            className: "relative-return",
          },
        ];
  }

  const values: IndicatorHeaderValue[] = [];
  const latestK = lastVisibleLineValue(series.k);
  const latestD = lastVisibleLineValue(series.d);
  if (latestK != null) {
    values.push({ label: "K", value: formatIndicatorValue(latestK), className: "k" });
  }
  if (latestD != null) {
    values.push({ label: "D", value: formatIndicatorValue(latestD), className: "d" });
  }
  return values;
}

function drawIndicatorLine(
  ctx: CanvasRenderingContext2D,
  line: Float32Array,
  pane: IndicatorPaneLayout,
  color: string,
  alpha: number,
  width: number,
  smooth = false,
  valueScale: IndicatorValueScale,
) {
  if (line.length < 4) return;
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = Math.max(1, width);
  let segment: Array<{ x: number; y: number }> = [];
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  const flushSegment = () => {
    if (segment.length < 2) {
      segment = [];
      return;
    }
    const first = segment[0];
    if (!first) {
      segment = [];
      return;
    }
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    if (smooth && segment.length > 2) {
      for (let i = 1; i < segment.length - 1; i++) {
        const current = segment[i];
        const next = segment[i + 1];
        if (!current || !next) continue;
        ctx.quadraticCurveTo(
          current.x,
          current.y,
          (current.x + next.x) / 2,
          (current.y + next.y) / 2,
        );
      }
      const last = segment[segment.length - 1];
      if (last) ctx.lineTo(last.x, last.y);
    } else {
      for (let i = 1; i < segment.length; i++) {
        const point = segment[i];
        if (point) ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
    segment = [];
  };
  for (let i = 0; i < line.length; i += 2) {
    const x = line[i];
    const value = line[i + 1];
    if (!Number.isFinite(x) || !Number.isFinite(value) || x < minX || x > maxX) {
      flushSegment();
      continue;
    }
    const px = xToPx(x, ctx.canvas.width);
    const py = indicatorValueToPx(value, pane, valueScale);
    segment.push({ x: px, y: py });
  }
  flushSegment();
  ctx.restore();
}

function drawIndicatorHistogram(
  ctx: CanvasRenderingContext2D,
  line: Float32Array,
  pane: IndicatorPaneLayout,
  valueScale: IndicatorValueScale,
  appearance: GpuChartAppearance,
  scale: number,
) {
  if (line.length < 2) return;
  const minX = Math.min(view.minX, view.maxX) - 1;
  const maxX = Math.max(view.minX, view.maxX) + 1;
  const slotWidth = ctx.canvas.width / Math.max(1, view.maxX - view.minX);
  const barWidth = sliverGapBarWidth(slotWidth, scale);
  const zeroY = indicatorValueToPx(0, pane, valueScale);
  ctx.save();
  for (let i = 0; i < line.length; i += 2) {
    const x = line[i];
    const value = line[i + 1];
    if (!Number.isFinite(x) || !Number.isFinite(value) || x < minX || x > maxX) continue;
    const px = xToPx(x, ctx.canvas.width);
    const py = indicatorValueToPx(value, pane, valueScale);
    const top = Math.min(py, zeroY);
    const height = Math.max(1 * scale, Math.abs(py - zeroY));
    ctx.fillStyle = hexToRgba(
      value >= 0 ? appearance.macdHistogramUpColor : appearance.macdHistogramDownColor,
      0.46,
    );
    ctx.fillRect(px - barWidth / 2, top, barWidth, height);
  }
  ctx.restore();
}

function drawIndicatorTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  candleX: number,
  series: IndicatorPaneSeries,
) {
  if (series.id === "rsi") {
    const rsi = lineValueNearX(series.rsi, candleX);
    if (rsi == null) return;
    drawTextBox(ctx, x, y, `RSI ${formatIndicatorValue(rsi)}`);
    return;
  }

  if (series.id === "macd") {
    const macd = lineValueNearX(series.macd, candleX);
    const signal = lineValueNearX(series.signal, candleX);
    const histogram = lineValueNearX(series.histogram, candleX);
    if (macd == null && signal == null && histogram == null) return;
    const parts = ["MACD"];
    if (macd != null) parts.push(`M ${formatDynamicIndicatorValue(macd)}`);
    if (signal != null) parts.push(`S ${formatDynamicIndicatorValue(signal)}`);
    if (histogram != null) parts.push(`H ${formatSignedIndicatorValue(histogram)}`);
    drawTextBox(ctx, x, y, parts.join("  "));
    return;
  }

  if (series.id === "atr") {
    const atr = lineValueNearX(series.atr, candleX);
    if (atr == null) return;
    drawTextBox(ctx, x, y, `ATR ${formatDynamicIndicatorValue(atr)}`);
    return;
  }

  if (series.id === "relativeReturn") {
    const relativeReturn = lineValueNearX(series.relativeReturn, candleX);
    if (relativeReturn == null) return;
    drawTextBox(
      ctx,
      x,
      y,
      `RS vs ${relativeReturnBenchmarkSymbol()} ${formatRelativeReturnValue(relativeReturn)}`,
    );
    return;
  }

  const k = lineValueNearX(series.k, candleX);
  const d = lineValueNearX(series.d, candleX);
  if (k == null && d == null) return;
  const parts = ["Stoch RSI"];
  if (k != null) parts.push(`K ${formatIndicatorValue(k)}`);
  if (d != null) parts.push(`D ${formatIndicatorValue(d)}`);
  drawTextBox(ctx, x, y, parts.join("  "));
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  candle: CandleRecord,
) {
  const volume = candleVolumeValue(candle);
  const volumeText = volume == null ? "" : ` V ${formatVolume(volume)}`;
  const text = `O ${formatPrice(candle.o)} H ${formatPrice(candle.h)} L ${formatPrice(
    candle.l,
  )} C ${formatPrice(candle.c)}${volumeText}`;
  drawTextBox(ctx, x, y, text);
}

function candleVolumeValue(candle: Pick<CandleRecord, "v_base" | "v_quote">) {
  if (Number.isFinite(candle.v_quote)) return candle.v_quote;
  if (Number.isFinite(candle.v_base)) return candle.v_base;
  return null;
}

function visibleWindowExtrema(): VisibleWindowExtrema | null {
  if (!state?.candles.length) return null;
  const minX = Math.min(view.minX, view.maxX) - 0.5;
  const maxX = Math.max(view.minX, view.maxX) + 0.5;
  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;
  for (const candle of state.candles) {
    if (candle.x < minX || candle.x > maxX) continue;
    if (Number.isFinite(candle.h)) high = Math.max(high, candle.h);
    if (Number.isFinite(candle.l)) low = Math.min(low, candle.l);
  }
  return Number.isFinite(high) && Number.isFinite(low) ? { high, low } : null;
}

function drawWindowPriceLine(
  ctx: CanvasRenderingContext2D,
  value: number,
  prefix: string,
  color: string,
  priceBottom: number,
  fontPx: number,
  pad: number,
  scale: number,
) {
  const y = yToPx(value, ctx.canvas.height);
  if (y < 0 || y > priceBottom) return;
  ctx.save();
  ctx.setLineDash([6 * scale, 5 * scale]);
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeStyle = hexToRgba(color, 0.76);
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(ctx.canvas.width, y + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  const label = `${prefix} ${formatPrice(value)}`;
  const labelWidth = ctx.measureText(label).width;
  const boxWidth = labelWidth + pad * 2;
  const boxHeight = fontPx + pad * 1.2;
  const boxX = Math.max(0, ctx.canvas.width - boxWidth - 4 * scale);
  const boxY = Math.max(2 * scale, Math.min(priceBottom - boxHeight - 2 * scale, y - boxHeight / 2));
  ctx.fillStyle = hexToRgba(color, 0.88);
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.fillStyle = "white";
  ctx.fillText(label, boxX + pad, boxY + boxHeight / 2);
  ctx.restore();
}

function drawPointerPriceLabel(
  ctx: CanvasRenderingContext2D,
  y: number,
  priceBottom: number,
  fontPx: number,
  pad: number,
  scale: number,
) {
  const appearance = resolvedAppearance.value;
  const value = pxToY(y, ctx.canvas.height);
  if (!Number.isFinite(value)) return;
  const label = formatPrice(value);
  const labelWidth = ctx.measureText(label).width;
  const boxWidth = labelWidth + pad * 2;
  const boxHeight = fontPx + pad * 1.2;
  const boxX = Math.max(0, ctx.canvas.width - boxWidth - 4 * scale);
  const boxY = Math.max(
    2 * scale,
    Math.min(priceBottom - boxHeight - 2 * scale, y - boxHeight / 2),
  );
  ctx.save();
  ctx.fillStyle = hexToRgba(appearance.tooltipBackgroundColor, 0.94);
  ctx.strokeStyle = hexToRgba(appearance.crosshairColor, 0.72);
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth, boxHeight);
  ctx.fillStyle = hexToRgba(appearance.textColor, 0.98);
  ctx.fillText(label, boxX + pad, boxY + boxHeight / 2);
  ctx.restore();
}

function drawTextBox(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  const appearance = resolvedAppearance.value;
  const scale = canvasScale(ctx.canvas);
  const padX = 8 * scale;
  const padY = 6 * scale;
  const metrics = ctx.measureText(text);
  const width = metrics.width + padX * 2;
  const height = appearance.fontSize * scale + padY * 2;
  const boxX = Math.min(Math.max(4 * scale, x), ctx.canvas.width - width - 4 * scale);
  const boxY = Math.max(height + 4 * scale, Math.min(y, ctx.canvas.height - 4 * scale));
  ctx.fillStyle = hexToRgba(appearance.tooltipBackgroundColor, 0.82);
  ctx.fillRect(boxX, boxY - height, width, height);
  ctx.fillStyle = hexToRgba(appearance.textColor, 0.95);
  ctx.fillText(text, boxX + padX, boxY - height / 2);
}

function indicatorValueToPx(
  value: number,
  pane: IndicatorPaneLayout,
  valueScale: IndicatorValueScale,
) {
  const span = Math.max(1e-9, valueScale.max - valueScale.min);
  const ratio = (value - valueScale.min) / span;
  const bounded = Math.max(0, Math.min(1, ratio));
  return pane.innerTop + (1 - bounded) * pane.innerHeight;
}

function lastVisibleLineValue(line: Float32Array) {
  const minX = Math.min(view.minX, view.maxX) - 0.5;
  const maxX = Math.max(view.minX, view.maxX) + 0.5;
  for (let i = line.length - 2; i >= 0; i -= 2) {
    const x = line[i];
    const value = line[i + 1];
    if (Number.isFinite(x) && Number.isFinite(value) && x >= minX && x <= maxX) return value;
  }
  return null;
}

function lineValueNearX(line: Float32Array, targetX: number) {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (let i = 0; i < line.length; i += 2) {
    const x = line[i];
    const value = line[i + 1];
    if (!Number.isFinite(x) || !Number.isFinite(value)) continue;
    const distance = Math.abs(x - targetX);
    if (distance < bestDistance) {
      best = value;
      bestDistance = distance;
    }
  }
  return bestDistance <= 1 ? best : null;
}

function nearestCandle(x: number) {
  if (!state?.candles.length) return null;
  let best = state.candles[0];
  let bestDist = Math.abs(best.x - x);
  for (const candle of state.candles) {
    const dist = Math.abs(candle.x - x);
    if (dist < bestDist) {
      best = candle;
      bestDist = dist;
    }
  }
  return best;
}

function anchoredVwapAnchorCandle() {
  if (!state?.candles.length) return null;
  const bucket = resolvedAppearance.value.anchoredVwapAnchorBucket;
  if (bucket == null || !Number.isFinite(bucket)) return null;
  return (
    state.candles.find((candle) => candle.bucket === bucket) ??
    state.candles.find((candle) => candle.bucket >= bucket) ??
    null
  );
}

function yToPx(y: number, height: number) {
  return (1 - (y - view.minY) / (view.maxY - view.minY)) * height;
}

function xToPx(x: number, width: number) {
  return ((x - view.minX) / (view.maxX - view.minX)) * width;
}

function pxToX(px: number, width: number) {
  return view.minX + (px / width) * (view.maxX - view.minX);
}

function pxToY(px: number, height: number) {
  return view.maxY - (px / height) * (view.maxY - view.minY);
}

function isHorizontalWheelPan(event: WheelEvent) {
  return Math.abs(event.deltaX) > Math.abs(event.deltaY);
}

function canvasScale(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return rect.width > 0 ? canvas.width / rect.width : Math.max(1, window.devicePixelRatio || 1);
}

function yTicks(min: number, max: number, count: number) {
  const span = Math.max(1e-9, max - min);
  const step = niceStep(span / count);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.25; value += step) ticks.push(value);
  return ticks;
}

function niceStep(value: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function formatPrice(value: number) {
  const abs = Math.abs(value);
  const maximumFractionDigits =
    abs >= 1_000 ? 0 : abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 3 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatVolume(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 1 ? 2 : 6,
  });
}

function formatIndicatorValue(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDynamicIndicatorValue(value: number) {
  const abs = Math.abs(value);
  const maximumFractionDigits =
    abs >= 1_000 ? 0 : abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 3 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatSignedIndicatorValue(value: number) {
  const formatted = formatDynamicIndicatorValue(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function formatRelativeReturnValue(value: number) {
  const percent = value;
  const formatted = Math.abs(percent).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${percent > 0 ? "+" : percent < 0 ? "-" : ""}${formatted}%`;
}

function formatAnchorDate(ts: number) {
  if (!Number.isFinite(ts)) return "Unknown";
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompactNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function formatIndicatorLevel(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatIndicatorSetting(field: IndicatorNumberField) {
  return resolvedAppearance.value[field];
}

function setStreaming(active: boolean) {
  streaming.value = active;
  emit("streaming", active);
}

function setError(message: string | null) {
  error.value = message;
  emit("error", message);
}
</script>

<style scoped>
.gpu-chart-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 120px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: #03060b;
}

.gpu-chart-shell-link {
  cursor: pointer;
}

.gpu-chart-shell-picking {
  cursor: crosshair;
}

.gpu-chart-canvas,
.gpu-chart-hud {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.gpu-chart-hud {
  pointer-events: none;
}

.gpu-chart-pane-divider {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 4;
  height: 10px;
  transform: translateY(-5px);
  cursor: ns-resize;
}

.gpu-chart-pane-divider::before {
  position: absolute;
  left: 0;
  right: 0;
  top: 5px;
  height: 1px;
  content: "";
  background: var(--gpu-chart-divider-color, rgba(148, 163, 184, 0.72));
  opacity: 0.72;
  transition:
    height 120ms ease,
    opacity 120ms ease;
}

.gpu-chart-pane-divider:hover::before,
.gpu-chart-pane-divider.resizing::before {
  top: 4px;
  height: 3px;
  opacity: 1;
}

.gpu-chart-indicator-toolbar {
  position: absolute;
  left: 8px;
  z-index: 5;
  max-width: min(360px, calc(100% - 96px));
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.9));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--gpu-chart-indicator-font-size, 12px);
  line-height: 1.25;
  pointer-events: auto;
}

.gpu-chart-indicator-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.18);
}

.gpu-chart-indicator-title {
  flex: 0 0 auto;
  font-weight: 700;
}

.gpu-chart-indicator-gear,
.gpu-chart-indicator-minimize {
  display: inline-grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-indicator-muted, rgba(255, 255, 255, 0.66));
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.gpu-chart-indicator-gear:hover,
.gpu-chart-indicator-gear[aria-expanded="true"],
.gpu-chart-indicator-minimize:hover {
  border-color: var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.92));
  background: rgba(255, 255, 255, 0.08);
}

.gpu-chart-indicator-value {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.gpu-chart-indicator-value.k {
  color: var(--gpu-chart-indicator-k, #f59e0b);
}

.gpu-chart-indicator-value.d {
  color: var(--gpu-chart-indicator-d, #a78bfa);
}

.gpu-chart-indicator-value.rsi {
  color: var(--gpu-chart-indicator-rsi, #22c55e);
}

.gpu-chart-indicator-value.macd {
  color: var(--gpu-chart-indicator-macd, #38bdf8);
}

.gpu-chart-indicator-value.signal {
  color: var(--gpu-chart-indicator-signal, #f59e0b);
}

.gpu-chart-indicator-value.atr {
  color: var(--gpu-chart-indicator-atr, #eab308);
}

.gpu-chart-indicator-value.relative-return {
  color: var(--gpu-chart-indicator-relative-return, #34d399);
}

.gpu-chart-indicator-value.histogram-up {
  color: var(--gpu-chart-indicator-histogram-up, #22c55e);
}

.gpu-chart-indicator-value.histogram-down {
  color: var(--gpu-chart-indicator-histogram-down, #ef4444);
}

.gpu-chart-indicator-settings-modal {
  position: absolute;
  z-index: 9;
  width: min(336px, calc(100% - 16px));
  overflow: hidden;
  border: 1px solid var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.7));
  border-radius: 6px;
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.9));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--gpu-chart-indicator-font-size, 12px);
  background: var(--gpu-chart-indicator-panel-bg, rgba(3, 6, 11, 0.94));
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.42);
  pointer-events: auto;
}

.gpu-chart-indicator-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.7));
  cursor: grab;
  user-select: none;
}

.gpu-chart-indicator-settings-header.dragging {
  cursor: grabbing;
}

.gpu-chart-indicator-settings-title {
  min-width: 0;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-chart-indicator-settings-close {
  display: inline-grid;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-indicator-muted, rgba(255, 255, 255, 0.66));
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.gpu-chart-indicator-settings-close:hover {
  border-color: var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.92));
  background: rgba(255, 255, 255, 0.08);
}

.gpu-chart-indicator-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  padding: 10px;
}

.gpu-chart-indicator-field {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: var(--gpu-chart-indicator-muted, rgba(255, 255, 255, 0.68));
  font-size: 11px;
}

.gpu-chart-indicator-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.9));
  font-size: 11px;
}

.gpu-chart-indicator-check {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  accent-color: #d6a23d;
}

.gpu-chart-indicator-range-label {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.gpu-chart-indicator-range,
.gpu-chart-indicator-color {
  width: 100%;
  accent-color: #d6a23d;
}

.gpu-chart-indicator-color {
  height: 28px;
  padding: 0;
  border: 1px solid var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.7));
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.gpu-chart-settings-modal {
  position: fixed;
  z-index: 10000;
  display: flex;
  box-sizing: border-box;
  width: min(560px, calc(100vw - 24px));
  height: min(500px, calc(100vh - 24px));
  min-width: min(360px, calc(100vw - 24px));
  min-height: min(320px, calc(100vh - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  border-radius: 6px;
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--gpu-chart-settings-font-size, 12px);
  background: var(--gpu-chart-settings-panel-bg, rgba(3, 6, 11, 0.96));
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.44);
  pointer-events: auto;
}

.gpu-chart-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  cursor: grab;
  user-select: none;
}

.gpu-chart-settings-header.dragging {
  cursor: grabbing;
}

.gpu-chart-settings-title {
  min-width: 0;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-chart-settings-close,
.gpu-chart-badge-gear,
.gpu-chart-floating-settings {
  display: inline-grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.66));
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.gpu-chart-settings-close {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
}

.gpu-chart-badge-gear {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  color: var(--gpu-chart-text-color, rgba(255, 255, 255, 0.72));
  opacity: 0.86;
}

.gpu-chart-floating-settings {
  position: absolute;
  left: 6px;
  top: 5px;
  z-index: 6;
  width: 24px;
  height: 24px;
  border-color: var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.5));
  color: var(--gpu-chart-text-color, rgba(255, 255, 255, 0.82));
  background: var(--gpu-chart-badge-bg, rgba(0, 0, 0, 0.42));
}

.gpu-chart-settings-close:hover,
.gpu-chart-badge-gear:hover,
.gpu-chart-badge-gear[aria-expanded="true"],
.gpu-chart-floating-settings:hover,
.gpu-chart-floating-settings[aria-expanded="true"] {
  border-color: var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.92));
  background: rgba(255, 255, 255, 0.08);
  opacity: 1;
}

.gpu-chart-settings-tabs {
  display: flex;
  gap: 4px;
  padding: 6px;
  border-bottom: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  overflow-x: auto;
}

.gpu-chart-settings-tab {
  flex: 0 0 auto;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.68));
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  white-space: nowrap;
}

.gpu-chart-settings-tab:hover,
.gpu-chart-settings-tab.active {
  border-color: var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.92));
  background: rgba(255, 255, 255, 0.08);
}

.gpu-chart-settings-body {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
}

.gpu-chart-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  padding: 10px;
}

.gpu-chart-settings-grid.compact {
  padding: 0;
}

.gpu-chart-settings-field {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.68));
  font-size: 11px;
}

.gpu-chart-settings-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  font-size: 11px;
}

.gpu-chart-settings-check {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  accent-color: #d6a23d;
}

.gpu-chart-settings-range-label {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.gpu-chart-settings-range,
.gpu-chart-settings-color {
  width: 100%;
  accent-color: #d6a23d;
}

.gpu-chart-settings-color {
  height: 28px;
  padding: 0;
  border: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.gpu-chart-avwap-actions {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}

.gpu-chart-avwap-action {
  flex: 0 0 auto;
  padding: 5px 7px;
  border: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.gpu-chart-avwap-action:hover,
.gpu-chart-avwap-action.active {
  border-color: rgba(214, 162, 61, 0.82);
  background: rgba(214, 162, 61, 0.16);
}

.gpu-chart-avwap-anchor {
  flex: 1 1 150px;
  min-width: 0;
  overflow: hidden;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.68));
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-chart-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 24px 8px 10px;
  border-top: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
}

.gpu-chart-settings-action {
  padding: 6px 10px;
  border: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.gpu-chart-settings-action:hover,
.gpu-chart-settings-action.primary {
  background: rgba(214, 162, 61, 0.16);
  border-color: rgba(214, 162, 61, 0.82);
}

.gpu-chart-settings-resize {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 3;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
}

.gpu-chart-settings-resize::before,
.gpu-chart-settings-resize::after {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 9px;
  height: 1px;
  content: "";
  background: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.66));
  opacity: 0.72;
  transform: rotate(135deg);
  transform-origin: right center;
}

.gpu-chart-settings-resize::after {
  right: 5px;
  bottom: 9px;
  width: 5px;
}

.gpu-chart-settings-resize:hover::before,
.gpu-chart-settings-resize:hover::after,
.gpu-chart-settings-resize.resizing::before,
.gpu-chart-settings-resize.resizing::after {
  opacity: 1;
}

.gpu-chart-indicator-manager {
  display: grid;
  grid-template-columns: minmax(156px, 0.82fr) minmax(0, 1.18fr);
  gap: 10px;
  min-height: 100%;
  padding: 10px;
}

.gpu-chart-indicator-list {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.gpu-chart-indicator-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  min-width: 0;
  padding: 6px 7px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.025);
}

.gpu-chart-indicator-row:hover,
.gpu-chart-indicator-row.selected {
  border-color: var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  background: rgba(255, 255, 255, 0.075);
}

.gpu-chart-indicator-row-main {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.gpu-chart-indicator-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.gpu-chart-indicator-row-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.gpu-chart-indicator-row-label,
.gpu-chart-indicator-row-meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-chart-indicator-row-label {
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  font-size: 11px;
  font-weight: 700;
}

.gpu-chart-indicator-row-meta {
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.68));
  font-size: 10px;
}

.gpu-chart-indicator-config-button {
  display: inline-grid;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.66));
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.gpu-chart-indicator-config-button:hover,
.gpu-chart-indicator-row.selected .gpu-chart-indicator-config-button {
  border-color: var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.92));
  background: rgba(255, 255, 255, 0.08);
}

.gpu-chart-selected-indicator-settings {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
}

.gpu-chart-selected-indicator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--gpu-chart-settings-border, rgba(148, 163, 184, 0.7));
  color: var(--gpu-chart-settings-text, rgba(255, 255, 255, 0.9));
  font-size: 11px;
  font-weight: 700;
}

.gpu-chart-selected-indicator-header span:last-child {
  flex: 0 0 auto;
  color: var(--gpu-chart-settings-muted, rgba(255, 255, 255, 0.68));
  font-size: 10px;
}

.gpu-chart-indicator-tabs {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  box-sizing: border-box;
  gap: 4px;
  padding: 3px 8px;
  overflow-x: auto;
  border-top: 1px solid var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.68));
  background: var(--gpu-chart-indicator-panel-bg, rgba(3, 6, 11, 0.96));
  box-shadow: 0 -8px 22px rgba(0, 0, 0, 0.38);
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.9));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--gpu-chart-indicator-font-size, 12px);
  line-height: 1;
  pointer-events: auto;
}

.gpu-chart-indicator-tab {
  flex: 0 0 auto;
  min-width: 0;
  padding: 5px 9px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gpu-chart-indicator-muted, rgba(255, 255, 255, 0.62));
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  white-space: nowrap;
}

.gpu-chart-indicator-tab:hover,
.gpu-chart-indicator-tab.active {
  border-color: var(--gpu-chart-indicator-border, rgba(148, 163, 184, 0.68));
  background: rgba(255, 255, 255, 0.08);
  color: var(--gpu-chart-indicator-text, rgba(255, 255, 255, 0.9));
}

.gpu-chart-indicator-tab:disabled,
.gpu-chart-indicator-tab.disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.gpu-chart-indicator-tab:disabled:hover {
  border-color: transparent;
  background: transparent;
  color: var(--gpu-chart-indicator-muted, rgba(255, 255, 255, 0.62));
}

.gpu-chart-badge {
  position: absolute;
  left: 6px;
  top: 5px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: calc(100% - 12px);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--gpu-chart-badge-bg, rgba(0, 0, 0, 0.42));
  color: var(--gpu-chart-text-color, rgba(255, 255, 255, 0.86));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--gpu-chart-font-size, 11px);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.gpu-chart-badge-link {
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease;
}

.gpu-chart-badge-link:hover {
  background: rgba(12, 18, 28, 0.82);
  color: rgba(255, 255, 255, 0.98);
}

.gpu-chart-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgb(239, 68, 68);
}

.gpu-chart-dot.live {
  background: rgb(34, 197, 94);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
}

.gpu-chart-symbol,
.gpu-chart-timeframe,
.gpu-chart-timeframe-select,
.gpu-chart-price,
.gpu-chart-change,
.gpu-chart-avwap-distance,
.gpu-chart-structure-summary {
  overflow: hidden;
  text-overflow: ellipsis;
}

.gpu-chart-symbol {
  min-width: 0;
  flex: 0 1 auto;
  font-weight: 700;
}

.gpu-chart-timeframe {
  flex: 0 0 auto;
  color: var(--gpu-chart-text-color, rgba(255, 255, 255, 0.62));
  font-size: 0.86em;
  opacity: 0.72;
}

.gpu-chart-timeframe-select {
  flex: 0 0 auto;
  max-width: 5.4em;
  padding: 0 15px 0 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--gpu-chart-text-color, rgba(255, 255, 255, 0.72));
  cursor: pointer;
  font: inherit;
  font-size: 0.86em;
  line-height: 1.25;
  opacity: 0.82;
}

.gpu-chart-timeframe-select:hover,
.gpu-chart-timeframe-select:focus {
  border-color: rgba(255, 255, 255, 0.22);
  outline: none;
  opacity: 1;
}

.gpu-chart-timeframe-select option {
  background: #0b1018;
  color: rgba(255, 255, 255, 0.9);
}

.gpu-chart-price {
  min-width: 0;
  flex: 0 1 auto;
  color: rgba(255, 255, 255, 0.95);
  font-variant-numeric: tabular-nums;
}

.gpu-chart-change {
  flex: 0 0 auto;
  font-size: 0.86em;
  font-variant-numeric: tabular-nums;
}

.gpu-chart-change.up {
  color: var(--gpu-chart-up-color, rgb(74, 222, 128));
}

.gpu-chart-change.down {
  color: var(--gpu-chart-down-color, rgb(248, 113, 113));
}

.gpu-chart-avwap-distance {
  flex: 0 0 auto;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(203, 213, 225, 0.9);
  font-size: 0.82em;
  font-variant-numeric: tabular-nums;
}

.gpu-chart-avwap-distance.above {
  color: rgb(74, 222, 128);
}

.gpu-chart-avwap-distance.below {
  color: rgb(248, 113, 113);
}

.gpu-chart-structure-summary {
  flex: 0 0 auto;
  max-width: min(22em, 42vw);
  padding: 0 4px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.52);
  color: rgba(203, 213, 225, 0.92);
  font-size: 0.82em;
}

.gpu-chart-structure-summary.bullish {
  border-color: rgba(34, 197, 94, 0.22);
  color: rgb(74, 222, 128);
}

.gpu-chart-structure-summary.bearish {
  border-color: rgba(248, 113, 113, 0.24);
  color: rgb(248, 113, 113);
}

.gpu-chart-structure-summary.transitional {
  border-color: rgba(245, 158, 11, 0.24);
  color: rgb(251, 191, 36);
}

.gpu-chart-state {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.32);
  color: rgba(255, 255, 255, 0.74);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.gpu-chart-state.error {
  color: rgb(252, 165, 165);
  padding: 10px;
  text-align: center;
}
</style>
