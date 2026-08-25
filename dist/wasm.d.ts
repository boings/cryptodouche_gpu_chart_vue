export interface GpuChartHandle {
    push_ohlc(bytes: Uint8Array): void;
    replace_at(index: number, bytes: Uint8Array): void;
    append_at(index: number, bytes: Uint8Array): void;
    set_view(minX: number, maxX: number, minY: number, maxY: number): void;
    resize(): void;
    render(): void;
    set_clear(r: number, g: number, b: number, a: number): void;
    set_style(candlePx: number, wickPx: number): void;
    set_candle_colors?(bullR: number, bullG: number, bullB: number, bullA: number, bearR: number, bearG: number, bearB: number, bearA: number): void;
    set_line_series(slot: number, bytes: Uint8Array, r: number, g: number, b: number, a: number): void;
    clear_line_series(slot: number): void;
    free?(): void;
}
interface GpuChartModule {
    create_chart(canvas: HTMLCanvasElement): Promise<GpuChartHandle>;
}
export declare function loadGpuChartModule(): Promise<GpuChartModule>;
export {};
