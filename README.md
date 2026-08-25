# Cryptodouche GPU Chart Vue

Reusable Vue 3 wrapper for the Cryptodouche WebGPU candlestick renderer.

The package is intentionally data-source agnostic. Applications provide candle history, optional historical range loading, and optional live updates through a `GpuChartDataAdapter`.

## Install From Git

Use a tag or commit SHA for reproducible installs:

```sh
pnpm add git+ssh://git@github.com/OWNER/cryptodouche-gpu-chart-vue.git#v0.1.0
```

Import the component and CSS:

```ts
import { GpuOhlcvChart, type GpuChartDataAdapter } from "@cryptodouche/gpu-chart-vue";
import "@cryptodouche/gpu-chart-vue/style.css";
```

## Minimal Usage

```vue
<template>
  <div style="height: 640px">
    <GpuOhlcvChart
      symbol="BTCUSDT"
      exchange="bybit"
      market-type="perp"
      timeframe="1m"
      :limit="500"
      :data-adapter="adapter"
      @open="openSymbol"
    />
  </div>
</template>

<script setup lang="ts">
import {
  GpuOhlcvChart,
  type GpuChartDataAdapter,
  type GpuChartOpenPayload,
} from "@cryptodouche/gpu-chart-vue";
import "@cryptodouche/gpu-chart-vue/style.css";

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

Rows are normalized from objects with `ts`, `o`, `h`, `l`, and `c`. The timestamp can be seconds, milliseconds, an ISO string, or the OffsetDateTime tuple shape used by the Cryptodouche backend.

## Development

```sh
pnpm install
pnpm test
pnpm build
```

Consumers do not need Rust or `wasm-pack` when installing a built Git tag. Maintainers only need those tools when rebuilding `renderer/pkg`.
