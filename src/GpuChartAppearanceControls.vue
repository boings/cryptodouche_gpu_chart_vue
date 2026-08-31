<template>
  <details class="cdgc-appearance">
    <summary class="cdgc-appearance-summary">Appearance</summary>
    <div class="cdgc-appearance-panel" @click.stop>
      <div class="cdgc-appearance-color-grid">
        <label v-for="field in colorFields" :key="field.key" class="cdgc-field">
          <span class="cdgc-label">{{ field.label }}</span>
          <input
            type="color"
            class="cdgc-color-input"
            :value="modelValue[field.key]"
            @input="setColor(field.key, $event)"
          />
        </label>
      </div>

      <div class="cdgc-appearance-number-grid">
        <label v-for="field in numberFields" :key="field.key" class="cdgc-field">
          <span class="cdgc-range-label">
            <span>{{ field.label }}</span>
            <span>{{ formatNumberValue(field.key) }}</span>
          </span>
          <input
            type="range"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            class="cdgc-range"
            :value="modelValue[field.key]"
            @input="setNumber(field.key, $event)"
          />
        </label>
      </div>

      <div class="cdgc-toggle-grid">
        <label v-for="field in toggleFields" :key="field.key" class="cdgc-toggle">
          <input
            type="checkbox"
            class="cdgc-checkbox"
            :checked="modelValue[field.key]"
            @change="setBool(field.key, $event)"
          />
          <span>{{ field.label }}</span>
        </label>
      </div>

      <div class="cdgc-indicator-grid">
        <label
          v-for="field in indicatorNumberFields"
          :key="field.key"
          class="cdgc-field"
        >
          <span class="cdgc-range-label">
            <span>{{ field.label }}</span>
            <span>{{ formatNumberValue(field.key) }}</span>
          </span>
          <input
            type="range"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            class="cdgc-range"
            :value="modelValue[field.key]"
            @input="setNumber(field.key, $event)"
          />
        </label>
      </div>

      <div class="cdgc-actions">
        <button type="button" class="cdgc-button cdgc-button-ghost" @click="$emit('reset')">
          Reset
        </button>
        <button type="button" class="cdgc-button cdgc-button-primary" @click="$emit('save')">
          Save Style
        </button>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import {
  normalizeGpuChartAppearance,
  type GpuChartAppearance,
} from "./appearance";

const props = defineProps<{
  modelValue: GpuChartAppearance;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: GpuChartAppearance];
  save: [];
  reset: [];
}>();

type ColorField = Extract<
  keyof GpuChartAppearance,
  | "backgroundColor"
  | "upColor"
  | "downColor"
  | "smaColor"
  | "emaColor"
  | "wmaColor"
  | "bollingerBasisColor"
  | "bollingerUpperColor"
  | "bollingerLowerColor"
  | "gridColor"
  | "textColor"
  | "crosshairColor"
  | "lastPriceColor"
  | "tooltipBackgroundColor"
>;
type NumberField = Extract<
  keyof GpuChartAppearance,
  | "candleWidth"
  | "wickWidth"
  | "fontSize"
  | "smaPeriod"
  | "emaPeriod"
  | "wmaPeriod"
  | "bollingerPeriod"
  | "bollingerStdDev"
>;
type ToggleField = Extract<
  keyof GpuChartAppearance,
  | "showGrid"
  | "showLastPriceLine"
  | "showCrosshair"
  | "showTooltip"
  | "showBadge"
  | "showWma"
  | "showBollinger"
  | "showStochRsi"
>;

const colorFields: Array<{ key: ColorField; label: string }> = [
  { key: "backgroundColor", label: "Background" },
  { key: "upColor", label: "Up" },
  { key: "downColor", label: "Down" },
  { key: "smaColor", label: "SMA" },
  { key: "emaColor", label: "EMA" },
  { key: "wmaColor", label: "WMA" },
  { key: "bollingerBasisColor", label: "BB Basis" },
  { key: "bollingerUpperColor", label: "BB Upper" },
  { key: "bollingerLowerColor", label: "BB Lower" },
  { key: "gridColor", label: "Grid" },
  { key: "textColor", label: "Text" },
  { key: "crosshairColor", label: "Crosshair" },
  { key: "lastPriceColor", label: "Last Price" },
  { key: "tooltipBackgroundColor", label: "Tooltip" },
];

const numberFields: Array<{ key: NumberField; label: string; min: number; max: number; step: number }> = [
  { key: "candleWidth", label: "Candle Width", min: 1, max: 24, step: 0.5 },
  { key: "wickWidth", label: "Wick Width", min: 0.5, max: 8, step: 0.5 },
  { key: "fontSize", label: "Font Size", min: 10, max: 28, step: 1 },
];

const indicatorNumberFields: Array<{
  key: NumberField;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "smaPeriod", label: "SMA Period", min: 2, max: 250, step: 1 },
  { key: "emaPeriod", label: "EMA Period", min: 2, max: 250, step: 1 },
  { key: "wmaPeriod", label: "WMA Period", min: 2, max: 250, step: 1 },
  { key: "bollingerPeriod", label: "BB Period", min: 2, max: 250, step: 1 },
  { key: "bollingerStdDev", label: "BB Std Dev", min: 0.5, max: 5, step: 0.25 },
];

const toggleFields: Array<{ key: ToggleField; label: string }> = [
  { key: "showGrid", label: "Grid" },
  { key: "showLastPriceLine", label: "Last Price" },
  { key: "showCrosshair", label: "Crosshair" },
  { key: "showTooltip", label: "Tooltip" },
  { key: "showBadge", label: "Badge" },
  { key: "showWma", label: "WMA" },
  { key: "showBollinger", label: "Bollinger" },
  { key: "showStochRsi", label: "Stoch RSI" },
];

function setColor(field: ColorField, event: Event) {
  patch({ [field]: inputValue(event) });
}

function setNumber(field: NumberField, event: Event) {
  patch({ [field]: Number(inputValue(event)) });
}

function setBool(field: ToggleField, event: Event) {
  patch({ [field]: (event.target as HTMLInputElement).checked });
}

function patch(partial: Partial<GpuChartAppearance>) {
  emit("update:modelValue", normalizeGpuChartAppearance({ ...props.modelValue, ...partial }));
}

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value;
}

function formatNumberValue(field: NumberField) {
  return props.modelValue[field];
}
</script>

<style scoped>
.cdgc-appearance {
  position: relative;
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.cdgc-appearance-summary {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(193, 145, 55, 0.72);
  border-radius: 6px;
  color: #d6a23d;
  background: rgba(13, 15, 19, 0.84);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  list-style: none;
}

.cdgc-appearance-summary::-webkit-details-marker {
  display: none;
}

.cdgc-appearance-panel {
  position: absolute;
  right: 0;
  top: 34px;
  z-index: 50;
  width: min(460px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #101317;
  color: rgba(232, 238, 247, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.38);
}

.cdgc-appearance-color-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.cdgc-appearance-number-grid,
.cdgc-indicator-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.cdgc-indicator-grid {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cdgc-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.cdgc-field {
  display: grid;
  gap: 4px;
  min-width: 0;
  font-size: 12px;
}

.cdgc-label,
.cdgc-range-label {
  color: rgba(232, 238, 247, 0.72);
}

.cdgc-range-label {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.cdgc-color-input {
  width: 100%;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.cdgc-range {
  width: 100%;
  accent-color: #d6a23d;
}

.cdgc-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  color: rgba(232, 238, 247, 0.86);
}

.cdgc-checkbox {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  accent-color: #d6a23d;
}

.cdgc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.cdgc-button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.cdgc-button-ghost {
  color: rgba(232, 238, 247, 0.86);
  background: transparent;
}

.cdgc-button-primary {
  color: #120f09;
  background: #d6a23d;
}

@media (max-width: 560px) {
  .cdgc-appearance-color-grid,
  .cdgc-appearance-number-grid,
  .cdgc-indicator-grid,
  .cdgc-toggle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
