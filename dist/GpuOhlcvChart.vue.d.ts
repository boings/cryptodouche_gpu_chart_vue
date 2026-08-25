import type { GpuChartDataAdapter, GpuChartOpenPayload } from "./types";
import { type GpuChartAppearance } from "./appearance";
type __VLS_Props = {
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
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    open: (payload: GpuChartOpenPayload) => any;
    error: (message: string | null) => any;
    streaming: (active: boolean) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    onOpen?: ((payload: GpuChartOpenPayload) => any) | undefined;
    onError?: ((message: string | null) => any) | undefined;
    onStreaming?: ((active: boolean) => any) | undefined;
}>, {
    title: string;
    exchange: string;
    marketType: string;
    candles: unknown[];
    dataAdapter: GpuChartDataAdapter;
    showSma: boolean;
    showEma: boolean;
    synthetic: boolean;
    openOnChartClick: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
