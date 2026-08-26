# Agent Notes

This repo is a reusable Vue chart package. Treat it as the shared source of truth for the GPU candlestick chart used by multiple projects.

## Architecture Rules

- Keep the package data-source agnostic.
- Do not import app-specific APIs such as Cryptodouche REST helpers, NATS subjects, Pinia stores, Vue Router, auth clients, or environment conventions into package components.
- Use `GpuChartDataAdapter` for data loading and live updates.
- Emit events for navigation or selection. Consuming apps own routing.
- Keep reusable rendering, interactions, indicators, appearance settings, and overlay drawing in this package.
- Keep app-specific symbol discovery, exchange naming, permission handling, and stream connection details in consuming apps.

## Public API

Prefer additive API changes. Avoid breaking existing props, emitted events, adapter types, or exported utility names unless the consuming projects are updated in the same release.

Important exports:

- `GpuOhlcvChart`
- `GpuChartAppearanceControls`
- `GpuChartDataAdapter`
- `GpuChartDataQuery`
- `GpuChartStreamHandlers`
- `GpuChartOpenPayload`
- `GpuChartAppearance`
- data, indicator, viewport, and appearance utilities

## Expected Extension Path

For position entries, fills, trades, alerts, labels, and strategy annotations, add a normalized overlay API to this package. Do not hard-code one consuming app's position model into the renderer or Vue component.

Good direction:

```ts
positionMarkers?: GpuChartPositionMarker[];
```

or:

```ts
overlays?: GpuChartOverlay[];
```

The consuming app should adapt its domain records into the normalized chart API.

## Renderer Boundary

`renderer/src` is the Rust/WebGPU source. `renderer/pkg` is generated output committed so Git consumers do not need Rust or `wasm-pack`.

If renderer code changes:

```sh
pnpm build:renderer
pnpm build
pnpm test
```

Commit both source and generated output.

## Build Output

`dist/` is committed intentionally. Git-tag consumers install this package without running a package prepare step.

If TypeScript/Vue source changes:

```sh
pnpm test
pnpm build
```

Commit source and rebuilt `dist/`.

## Release Checklist

1. Update `package.json` version for a released tag.
2. Run `pnpm clean:appledouble`.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Confirm `git status` only shows intended files.
6. Commit.
7. Tag the commit, for example `v0.1.3`.
8. Push branch and tags.

This repo may live on ExFAT. Clean `._*` files before committing or pushing.
