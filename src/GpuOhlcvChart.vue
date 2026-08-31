<template>
  <div
    class="gpu-chart-shell"
    :data-last-close="lastCloseText"
    :data-change-pct="changePctText"
    :data-live-updates="liveUpdates"
    :data-candle-count="candleCount"
    :data-view-min-x="viewMinX"
    :data-view-max-x="viewMaxX"
    :style="shellStyle"
    :class="{ 'gpu-chart-shell-link': openOnChartClickActive }"
    @click="handleShellClick"
  >
    <canvas ref="canvasRef" class="gpu-chart-canvas"></canvas>
    <canvas ref="hudRef" class="gpu-chart-hud"></canvas>
    <component
      v-if="resolvedAppearance.showBadge"
      :is="badgeComponent"
      class="gpu-chart-badge"
      :class="{ 'gpu-chart-badge-link': openOnChartClickActive }"
      v-bind="badgeProps"
    >
      <span class="gpu-chart-dot" :class="{ live: streaming }"></span>
      <span class="gpu-chart-symbol">{{ displaySymbol }}</span>
      <span v-if="lastCloseText" class="gpu-chart-price">{{ lastCloseText }}</span>
      <span v-if="changePctText" class="gpu-chart-change" :class="changeClass">
        {{ changePctText }}
      </span>
      <span class="gpu-chart-timeframe">{{ displayTimeframe }}</span>
    </component>
    <div v-if="loading" class="gpu-chart-state">Loading</div>
    <div v-else-if="error" class="gpu-chart-state error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type {
  GpuChartDataAdapter,
  GpuChartDataQuery,
  GpuChartOpenPayload,
  GpuSeriesState,
  ViewBounds,
} from "./types";
import type { GpuChartHandle } from "./wasm";
import {
  appendSyntheticCandle,
  candlesToBytes,
  computeViewBounds,
  makeSyntheticCandles,
  mergeLiveCandle,
  normalizeRestTimeframe,
  packHistoricalCandles,
  prependHistoricalCandles,
} from "./data";
import {
  computeBollingerBands,
  computeEmaLine,
  computeSmaLine,
  computeWmaLine,
  lineToBytes,
} from "./indicators";
import {
  hexToRgb01,
  hexToRgba,
  normalizeGpuChartAppearance,
  type GpuChartAppearance,
} from "./appearance";
import { cancelScheduledGpuRender, scheduleGpuRender } from "./scheduler";
import {
  clampXView,
  computeVisibleYBounds,
  isFollowingLatest,
  isYBoundsClose,
  RIGHT_EDGE_PADDING_CANDLES,
  scaleYView,
  smoothVisibleYBounds,
  withRightPadding,
} from "./viewport";
import { loadGpuChartModule } from "./wasm";

const LINE_SLOTS = [0, 1, 2, 3, 4, 5] as const;
const PRICE_SCALE_DRAG_WIDTH_PX = 76;
const Y_AXIS_SCALE_SENSITIVITY_PX = 180;
const WHEEL_GESTURE_QUIET_MS = 180;
const SMOOTH_SHIFT_PAN_EASE = 0.32;
const SMOOTH_SHIFT_PAN_EPSILON_CANDLES = 0.002;

const props = withDefaults(
  defineProps<{
    symbol: string;
    exchange?: string;
    marketType?: string;
    timeframe: string | number;
    limit: number;
    candles?: unknown[];
    dataAdapter?: GpuChartDataAdapter;
    showSma?: boolean;
    showEma?: boolean;
    synthetic?: boolean;
    title?: string;
    openOnChartClick?: boolean;
    appearance?: Partial<GpuChartAppearance>;
  }>(),
  {
    candles: undefined,
    dataAdapter: undefined,
    exchange: undefined,
    marketType: undefined,
    showSma: true,
    showEma: true,
    synthetic: false,
    title: "",
    openOnChartClick: false,
  },
);

const emit = defineEmits<{
  streaming: [active: boolean];
  error: [message: string | null];
  open: [payload: GpuChartOpenPayload];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hudRef = ref<HTMLCanvasElement | null>(null);
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

let chart: GpuChartHandle | null = null;
let state: GpuSeriesState | null = null;
let view: ViewBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
let resizeObs: ResizeObserver | null = null;
let unsubscribe: (() => void) | null = null;
let syntheticTimer: ReturnType<typeof setInterval> | null = null;
let cleanupFns: Array<() => void> = [];
let mounted = false;
let mousePos: { px: number; py: number } | null = null;
let hasMoreHistory = true;
let draggedDuringPointer = false;
let autoFitVisibleY = true;
let smoothPanFrame: number | null = null;
let smoothPanTarget: Pick<ViewBounds, "minX" | "maxX"> | null = null;

const resolvedAppearance = computed(() => normalizeGpuChartAppearance(props.appearance));
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
const displaySymbol = computed(() => props.symbol.toUpperCase());
const displayTimeframe = computed(() => normalizeRestTimeframe(props.timeframe));
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
const openOnChartClickActive = computed(() => Boolean(props.openOnChartClick));
const badgeComponent = computed(() => "div");
const badgeTitle = computed(() =>
  [displayTitle.value, lastCloseText.value, changePctText.value].filter(Boolean).join(" "),
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

function handleShellClick() {
  if (!props.openOnChartClick || draggedDuringPointer) {
    draggedDuringPointer = false;
    return;
  }
  emit("open", openPayload());
}

onMounted(async () => {
  mounted = true;
  await boot();
});

onBeforeUnmount(() => {
  mounted = false;
  stopStream();
  stopSynthetic();
  cancelSmoothPan();
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
    updateOverlays();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  },
  { deep: true },
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
      fitVisibleYIfEnabled();
      applyView();
      drawHud(mousePos);
      scheduleGpuRender(renderNow);
    });
    resizeObs.observe(canvas);
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
  stopSynthetic();
  cancelSmoothPan();
  loading.value = true;
  setError(null);
  hasMoreHistory = true;
  try {
    if (props.synthetic) {
      state = makeSyntheticCandles(props.symbol, props.limit, props.timeframe);
    } else if (props.candles) {
      state = packHistoricalCandles(props.candles, props.timeframe, props.limit);
    } else if (props.dataAdapter) {
      const rows = await props.dataAdapter.loadLatest(dataQuery());
      state = packHistoricalCandles(rows, props.timeframe, props.limit);
    } else {
      throw new Error("No OHLCV data source provided");
    }

    liveUpdates.value = 0;
    updateSummaryMetrics();
    updateCandleCount();
    chart?.push_ohlc(candlesToBytes(state.candles));
    updateOverlays();
    autoFitVisibleY = true;
    updateView(computeViewBounds(state.candles, overlayLines()));
    fitVisibleY();
    applyView();
    drawHud(null);
    scheduleGpuRender(renderNow);

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

function startSynthetic() {
  setStreaming(true);
  syntheticTimer = setInterval(() => {
    if (!state) return;
    const wasFollowingLatest = isViewFollowingLatest();
    const previousFirstBucket = state.firstBucket;
    applyMergeResult(appendSyntheticCandle(state, props.limit), {
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
  const start = Math.max(0, end - state.timeframeSec * props.limit);
  if (end <= start) {
    hasMoreHistory = false;
    return;
  }

  historicalLoading.value = true;
  try {
    const rows = await props.dataAdapter.loadRange(dataQuery({ start, end }));
    const previousFirstBucket = state.firstBucket;
    const added = prependHistoricalCandles(state, rows, props.timeframe);
    if (added === 0) {
      hasMoreHistory = false;
      return;
    }

    const xShift = (previousFirstBucket - state.firstBucket) / state.timeframeSec;
    chart?.push_ohlc(candlesToBytes(state.candles));
    if (Number.isFinite(xShift)) {
      view.minX += xShift;
      view.maxX += xShift;
      if (smoothPanTarget) {
        smoothPanTarget.minX += xShift;
        smoothPanTarget.maxX += xShift;
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
    limit: props.limit,
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

function liveRetentionLimit() {
  if (props.synthetic || !state) return props.limit;
  return Math.max(props.limit, state.candles.length + 1);
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
      if (smoothPanTarget) {
        smoothPanTarget.minX += xShift;
        smoothPanTarget.maxX += xShift;
      }
    }
  }

  liveUpdates.value += 1;
  updateSummaryMetrics();
  updateCandleCount();
  updateOverlays();
  if (wasFollowingLatest && state.candles.length) {
    const width = Math.max(1, view.maxX - view.minX);
    const maxX = state.candles[state.candles.length - 1].x + RIGHT_EDGE_PADDING_CANDLES;
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
  const first = state.candles[0];
  const last = state.candles[state.candles.length - 1];
  lastClose.value = last.c;
  const base = Number.isFinite(first.o) && first.o !== 0 ? first.o : first.c;
  changePct.value =
    Number.isFinite(base) && base !== 0 ? ((last.c - base) / Math.abs(base)) * 100 : null;
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

function overlayLines() {
  return indicatorSeries().map((item) => item.line);
}

function indicatorSeries() {
  if (!state) return [];
  const appearance = resolvedAppearance.value;
  const series: Array<{ slot: number; line: Float32Array; color: string; alpha: number }> = [];
  const add = (slot: number, line: Float32Array, color: string, alpha = 0.95) => {
    if (line.length >= 4) series.push({ slot, line, color, alpha });
  };

  if (props.showSma) {
    add(0, computeSmaLine(state.candles, appearance.smaPeriod), appearance.smaColor);
  }
  if (props.showEma) {
    add(1, computeEmaLine(state.candles, appearance.emaPeriod), appearance.emaColor);
  }
  if (appearance.showWma) {
    add(2, computeWmaLine(state.candles, appearance.wmaPeriod), appearance.wmaColor);
  }
  if (appearance.showBollinger) {
    const bands = computeBollingerBands(
      state.candles,
      appearance.bollingerPeriod,
      appearance.bollingerStdDev,
    );
    add(3, bands.basis, appearance.bollingerBasisColor, 0.72);
    add(4, bands.upper, appearance.bollingerUpperColor, 0.88);
    add(5, bands.lower, appearance.bollingerLowerColor, 0.88);
  }

  return series;
}

function updateView(bounds: ViewBounds) {
  const paddedBounds = withRightPadding(bounds);
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
  const nextYBounds = options.smooth ? smoothVisibleYBounds(view, yBounds) : yBounds;
  view.minY = nextYBounds.minY;
  view.maxY = nextYBounds.maxY;
  return isYBoundsClose(nextYBounds, yBounds);
}

function resetVisibleYMode() {
  cancelSmoothPan();
  autoFitVisibleY = true;
  fitVisibleY();
  applyView();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);
}

function smoothShiftPanBy(shift: number) {
  if (!Number.isFinite(shift) || shift === 0 || !state?.candles.length) return;
  const base = smoothPanTarget ?? { minX: view.minX, maxX: view.maxX };
  const target = clampXBounds({
    ...view,
    minX: base.minX + shift,
    maxX: base.maxX + shift,
  });
  smoothPanTarget = { minX: target.minX, maxX: target.maxX };
  if (smoothPanFrame == null) {
    smoothPanFrame = requestAnimationFrame(stepSmoothPan);
  }
}

function stepSmoothPan() {
  smoothPanFrame = null;
  if (!mounted || !chart || !smoothPanTarget) {
    smoothPanTarget = null;
    return;
  }

  const target = smoothPanTarget;
  const nextMinX = view.minX + (target.minX - view.minX) * SMOOTH_SHIFT_PAN_EASE;
  const nextMaxX = view.maxX + (target.maxX - view.maxX) * SMOOTH_SHIFT_PAN_EASE;
  const xDone =
    Math.abs(target.minX - nextMinX) <= SMOOTH_SHIFT_PAN_EPSILON_CANDLES &&
    Math.abs(target.maxX - nextMaxX) <= SMOOTH_SHIFT_PAN_EPSILON_CANDLES;

  view.minX = xDone ? target.minX : nextMinX;
  view.maxX = xDone ? target.maxX : nextMaxX;
  clampViewX();
  const yDone = fitVisibleY({ smooth: true });
  applyView();
  void maybeLoadOlderCandles();
  drawHud(mousePos);
  scheduleGpuRender(renderNow);

  if (xDone && yDone) {
    smoothPanTarget = null;
    fitVisibleY();
    applyView();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
    return;
  }

  smoothPanFrame = requestAnimationFrame(stepSmoothPan);
}

function cancelSmoothPan() {
  if (smoothPanFrame != null) {
    cancelAnimationFrame(smoothPanFrame);
  }
  smoothPanFrame = null;
  smoothPanTarget = null;
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

    if (event.shiftKey) {
      wheelMode = "shift-pan";
      resetWheelModeSoon();
      const delta = normalizedWheelDeltaPx(event, rect.height);
      const xSpan = view.maxX - view.minX;
      const shift = (delta / rect.width) * xSpan;
      autoFitVisibleY = true;
      smoothShiftPanBy(shift);
      return;
    }

    if (wheelMode === "shift-pan") {
      resetWheelModeSoon();
      return;
    }

    cancelSmoothPan();
    wheelMode = "zoom";
    resetWheelModeSoon();
    const alpha = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const anchorX = view.minX + alpha * (view.maxX - view.minX);
    const zoom = event.deltaY < 0 ? 0.88 : 1.14;
    const nextWidth = (view.maxX - view.minX) * zoom;
    view.minX = anchorX - alpha * nextWidth;
    view.maxX = view.minX + nextWidth;
    clampViewX({ x: anchorX, ratio: alpha });
    fitVisibleYIfEnabled();
    applyView();
    void maybeLoadOlderCandles();
    drawHud(mousePos);
    scheduleGpuRender(renderNow);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    cancelSmoothPan();
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
    canvas.style.cursor = "";
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
        const dx = ((event.clientX - startX) / rect.width) * (startView.maxX - startView.minX);
        const dy = ((event.clientY - startY) / rect.height) * (startView.maxY - startView.minY);
        view.minX = startView.minX - dx;
        view.maxX = startView.maxX - dx;
        view.minY = startView.minY + dy;
        view.maxY = startView.maxY + dy;
        clampViewX();
        void maybeLoadOlderCandles();
      }
      applyView();
      scheduleGpuRender(renderNow);
    } else {
      canvas.style.cursor = isPriceScaleDragZone(event, rect) ? "ns-resize" : "";
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
    resetVisibleYMode();
  };

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("mouseup", onMouseUp);
  cleanupFns.push(
    () => canvas.removeEventListener("wheel", onWheel),
    () => canvas.removeEventListener("mousedown", onMouseDown),
    () => canvas.removeEventListener("mousemove", onMouseMove),
    () => canvas.removeEventListener("mouseleave", onMouseLeave),
    () => canvas.removeEventListener("dblclick", onDoubleClick),
    () => window.removeEventListener("mouseup", onMouseUp),
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
  return rect.right - event.clientX <= PRICE_SCALE_DRAG_WIDTH_PX;
}

function pointerYRatio(event: MouseEvent, rect: DOMRect) {
  if (rect.height <= 0) return 0.5;
  return Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
}

function isViewFollowingLatest() {
  const last = state?.candles[state.candles.length - 1];
  return isFollowingLatest(view, last?.x);
}

function clampXBounds(nextView: ViewBounds, anchor?: { x: number; ratio: number }): ViewBounds {
  if (!state?.candles.length) return nextView;
  return clampXView(
    nextView,
    {
      firstX: state.candles[0].x,
      lastX: state.candles[state.candles.length - 1].x,
    },
    anchor,
  );
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
      const label = formatPrice(tick);
      const labelWidth = ctx.measureText(label).width;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
      ctx.fillText(label, Math.max(4 * scale, w - labelWidth - pad), y);
    }
  }

  const last = state?.candles[state.candles.length - 1];
  if (last && appearance.showLastPriceLine) {
    const y = yToPx(last.c, h);
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

  if (pos) {
    if (appearance.showCrosshair) {
      ctx.strokeStyle = hexToRgba(appearance.crosshairColor, 0.38);
      ctx.beginPath();
      ctx.moveTo(pos.px + 0.5, 0);
      ctx.lineTo(pos.px + 0.5, h);
      ctx.moveTo(0, pos.py + 0.5);
      ctx.lineTo(w, pos.py + 0.5);
      ctx.stroke();
    }
    const candle = nearestCandle(pxToX(pos.px, w));
    if (candle && appearance.showTooltip) {
      ctx.font = `${smallFontPx}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      drawTooltip(ctx, pos.px + 8 * scale, pos.py - 8 * scale, candle);
    }
  }
  ctx.restore();
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  candle: { o: number; h: number; l: number; c: number; ts: number },
) {
  const text = `O ${formatPrice(candle.o)} H ${formatPrice(candle.h)} L ${formatPrice(
    candle.l,
  )} C ${formatPrice(candle.c)}`;
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

function yToPx(y: number, height: number) {
  return (1 - (y - view.minY) / (view.maxY - view.minY)) * height;
}

function pxToX(px: number, width: number) {
  return view.minX + (px / width) * (view.maxX - view.minX);
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
.gpu-chart-price,
.gpu-chart-change {
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
