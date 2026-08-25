/* tslint:disable */
/* eslint-disable */
export function wasm_bootstrap(): void;
export function create_chart(canvas: HTMLCanvasElement): Promise<GpuChart>;
export class GpuChart {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  replace_at(index: number, bytes: Uint8Array): void;
  debug_counts(): number;
  set_line_series(slot: number, bytes: Uint8Array, r: number, g: number, b: number, a: number): void;
  clear_line_series(slot: number): void;
  set_candle_colors(bull_r: number, bull_g: number, bull_b: number, bull_a: number, bear_r: number, bear_g: number, bear_b: number, bear_a: number): void;
  render(): void;
  resize(): void;
  set_view(min_x: number, max_x: number, min_y: number, max_y: number): void;
  append_at(index: number, bytes: Uint8Array): void;
  push_ohlc(bytes: Uint8Array): void;
  set_clear(r: number, g: number, b: number, a: number): void;
  set_style(candle_px: number, wick_px: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_gpuchart_free: (a: number, b: number) => void;
  readonly create_chart: (a: any) => any;
  readonly gpuchart_append_at: (a: number, b: number, c: number, d: number) => void;
  readonly gpuchart_clear_line_series: (a: number, b: number) => void;
  readonly gpuchart_debug_counts: (a: number) => number;
  readonly gpuchart_push_ohlc: (a: number, b: number, c: number) => void;
  readonly gpuchart_render: (a: number) => void;
  readonly gpuchart_replace_at: (a: number, b: number, c: number, d: number) => void;
  readonly gpuchart_resize: (a: number) => void;
  readonly gpuchart_set_candle_colors: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly gpuchart_set_clear: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gpuchart_set_line_series: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly gpuchart_set_style: (a: number, b: number, c: number) => void;
  readonly gpuchart_set_view: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly wasm_bootstrap: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly closure148_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure168_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
