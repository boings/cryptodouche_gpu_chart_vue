export interface OhlcvPoint {
    ts: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v_base?: number;
    v_quote?: number;
    ver?: number;
}
export interface CandleRecord extends OhlcvPoint {
    bucket: number;
    x: number;
}
export interface GpuSeriesState {
    timeframeSec: number;
    firstBucket: number;
    candles: CandleRecord[];
    positionByBucket: Map<number, number>;
}
export type LiveMergeResult = {
    kind: "ignore";
    reason: string;
} | {
    kind: "replace";
    position: number;
    bytes: Uint8Array;
} | {
    kind: "append";
    position: number;
    bytes: Uint8Array;
} | {
    kind: "reset";
    bytes: Uint8Array;
};
export interface ViewBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
export type GpuChartStreamStatus = "open" | "closed" | "error";
export interface GpuChartDataQuery {
    symbol: string;
    exchange?: string;
    marketType?: string;
    timeframe: string | number;
    limit: number;
    start?: number;
    end?: number;
}
export interface GpuChartStreamHandlers {
    onCandle: (payload: unknown) => void;
    onStatus?: (status: GpuChartStreamStatus) => void;
    onError?: (message: string) => void;
}
export type GpuChartUnsubscribe = () => void;
export interface GpuChartDataAdapter {
    loadLatest(query: GpuChartDataQuery): Promise<unknown[]>;
    loadRange?(query: GpuChartDataQuery): Promise<unknown[]>;
    subscribe?(query: GpuChartDataQuery, handlers: GpuChartStreamHandlers): GpuChartUnsubscribe | Promise<GpuChartUnsubscribe>;
}
export interface GpuChartOpenPayload {
    symbol: string;
    exchange?: string;
    marketType?: string;
    timeframe: string | number;
}
