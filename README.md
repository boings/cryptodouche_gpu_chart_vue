# Cryptodouche GPU Chart Vue

Reusable Vue 3 candlestick chart package backed by a WebGPU/WASM renderer.

This repository is intended to be the shared chart source of truth for Cryptodouche and other Vue projects. The chart package is data-source agnostic: consuming apps provide historical candles, optional older-range loading, and optional live updates through a small adapter interface.

The package is not currently published to npm. Install it from a Git tag or a local packed tarball.

## Install

Use a tag or commit SHA for reproducible installs.

```sh
pnpm add 'git+https://github.com/boings/cryptodouche_gpu_chart_vue.git#v0.1.21'
```

SSH works too:

```sh
pnpm add 'git+ssh://git@github.com/boings/cryptodouche_gpu_chart_vue.git#v0.1.21'
```

Import the component and CSS:

```ts
import { GpuOhlcvChart, type GpuChartDataAdapter } from "@cryptodouche/gpu-chart-vue";
import "@cryptodouche/gpu-chart-vue/style.css";
```

The chart fills its parent. Give the parent a real height.

## Minimal Usage

```vue
<template>
  <div style="height: 640px">
    <GpuOhlcvChart
      symbol="BTCUSDT"
      exchange="bybit"
      market-type="perp"
      :timeframe="timeframe"
      :timeframe-options="timeframeOptions"
      :limit="500"
      :data-adapter="adapter"
      show-indicator-panes
      show-chart-settings
      v-model:appearance="appearance"
      open-on-chart-click
      @update:timeframe="timeframe = $event"
      @open="openSymbol"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  GpuOhlcvChart,
  useGpuChartAppearance,
  type GpuChartDataAdapter,
  type GpuChartOpenPayload,
} from "@cryptodouche/gpu-chart-vue";
import "@cryptodouche/gpu-chart-vue/style.css";

const { appearance, saveAppearance } = useGpuChartAppearance("single");
const timeframe = ref("1m");
const timeframeOptions = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"];

const adapter: GpuChartDataAdapter = {
  async loadLatest(query) {
    const params = new URLSearchParams({
      exchange: query.exchange ?? "",
      marketType: query.marketType ?? "",
      timeframe: String(query.timeframe),
      limit: String(query.limit),
    });
    const response = await fetch(`/api/ohlcv/${query.symbol}?${params}`);
    const payload = await response.json();
    return payload.data ?? [];
  },

  async loadRange(query) {
    const params = new URLSearchParams({
      exchange: query.exchange ?? "",
      marketType: query.marketType ?? "",
      timeframe: String(query.timeframe),
      start: String(query.start ?? 0),
      end: String(query.end ?? 0),
      limit: String(query.limit),
    });
    const response = await fetch(`/api/ohlcv/range/${query.symbol}?${params}`);
    const payload = await response.json();
    return payload.data ?? [];
  },
};

function openSymbol(payload: GpuChartOpenPayload) {
  console.log(payload.symbol);
}
</script>
```

## Data Adapter

```ts
export interface GpuChartDataAdapter {
  loadLatest(query: GpuChartDataQuery): Promise<unknown[]>;
  loadRange?(query: GpuChartDataQuery): Promise<unknown[]>;
  subscribe?(
    query: GpuChartDataQuery,
    handlers: GpuChartStreamHandlers,
  ): GpuChartUnsubscribe | Promise<GpuChartUnsubscribe>;
}
```

`loadLatest` is required unless using the `candles` or `synthetic` props. `loadRange` is optional and enables older candle loading when the user pans or scrolls left. `subscribe` is optional and enables live candle updates. The chart may request more rows than the visible `limit` so indicators have warm-up history before the first visible candle.

Rows are normalized from objects with:

```ts
{
  ts: number | string | unknown[];
  o: number;
  h: number;
  l: number;
  c: number;
  v_base?: number;
  v_quote?: number;
  ver?: number;
}
```

`ts` may be seconds, milliseconds, an ISO timestamp string, or the OffsetDateTime tuple shape used by the Cryptodouche backend. Duplicate buckets are collapsed before rendering; when `ver` is present, the latest version wins.

## Important Props

```ts
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
appearance?: Partial<GpuChartAppearance>;
showIndicatorPanes?: boolean;
showChartSettings?: boolean;
openOnChartClick?: boolean;
```

When `openOnChartClick` is true, the chart emits `open` with `{ symbol, exchange, marketType, timeframe }`. The package does not depend on Vue Router; consuming apps handle navigation.

Passing `timeframeOptions` turns the timeframe badge into a compact selector. The chart emits `update:timeframe` with the selected value; consuming apps should update the prop and reload data through their adapter.

`showIndicatorPanes` enables the lower indicator pane area. The current panes are Stoch RSI, RSI, MACD, and ATR, selected from the solid bottom tab strip. Up to three lower panes can be active at once; active selections stack vertically, and clicking an active tab removes that pane while keeping the tabs available.

Use `v-model:appearance` when enabling in-chart controls. Each pane exposes its own gear menu for indicator-specific settings, including period, upper/lower range, and range color. The range is shaded with dashed threshold lines. The divider between price and indicator panes can be dragged to update pane height. Persist those changes with the `saveAppearance` helper or your app's own storage.

The price pane can show the current visible-window high and low as dashed horizontal labels, a local-time x-axis, and a translucent volume overlay. Lower panes include per-indicator period, color, and Smooth Line controls in their gear menus. RSI-style oscillator panes also expose shaded range settings. The right edge reserves label space so the latest candle and price marker do not overlap.

The single-chart appearance default enables the time axis and volume overlay. The grid-chart default keeps both off so compact chart cells stay readable.

## Interaction Model

- Normal scroll zooms horizontally.
- Shift-scroll pans sideways and fits the Y axis to visible candles.
- Dragging the chart body leaves auto-fit mode and pans manually.
- Double-click resets visible-candle Y auto-fit.
- Dragging the right-side price area scales the Y axis.
- Panning near the left edge calls `dataAdapter.loadRange` when available.

## Appearance

`GpuChartAppearanceControls` is included, but apps can also build their own controls with:

```ts
useGpuChartAppearance()
normalizeGpuChartAppearance()
DEFAULT_GPU_CHART_APPEARANCE
DEFAULT_GRID_GPU_CHART_APPEARANCE
```

The included controls are self-styled and do not require Tailwind or DaisyUI.

The single-chart appearance default enables Stoch RSI and RSI when lower panes are opted in. The grid-chart default keeps lower pane indicators off so small chart cells stay readable.

## Extending The Chart

Keep reusable chart features in this package. App-specific data fetching, routing, auth, exchange conventions, and stream details belong in adapters or wrapper components in the consuming app.

For position entries, fills, trades, alerts, or labels, prefer a normalized overlay API in this package rather than app-specific drawing code. A future shape should look more like this:

```ts
positionMarkers?: GpuChartPositionMarker[];
```

or a more general overlay model:

```ts
overlays?: GpuChartOverlay[];
```

The package should remain usable by any Vue app that can provide normalized data.

## Development

```sh
pnpm install
pnpm test
pnpm build
```

The deterministic Impulse Fade lifecycle and its audit input format are documented in
[`docs/impulse-fade-v1.md`](docs/impulse-fade-v1.md). To print a historical lifecycle trace as
JSON, run:

```sh
pnpm audit:impulse-fade ./path/to/input.json
```

Add `--out ./trace.json` to also write the trace to a file.

Consumers do not need Rust or `wasm-pack` when installing a built Git tag. Maintainers only need those tools when changing the renderer under `renderer/src`.

Rebuild the renderer after Rust/WebGPU changes:

```sh
pnpm build:renderer
pnpm build
```

## Release Flow

Before pushing a tag:

```sh
pnpm clean:appledouble
pnpm test
pnpm build
git status
git add README.md AGENTS.md package.json pnpm-lock.yaml docs fixtures scripts src dist renderer/pkg renderer/src
git commit -m "Describe change"
git tag v0.1.12
git push origin main --tags
```

This repo may be worked on from an ExFAT external drive. Always run `pnpm clean:appledouble` before committing or pushing so `._*` AppleDouble files do not get into Git metadata or package contents.

## Publishing

`private: true` is currently intentional: the repo is public, but the package is meant to be consumed from Git until npm package naming, license, and publishing policy are decided.
