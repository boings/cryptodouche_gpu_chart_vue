import type { ViewBounds } from "./types";
export declare const MIN_VISIBLE_CANDLES = 8;
export declare const RIGHT_EDGE_PADDING_CANDLES = 2;
export declare const FOLLOW_LATEST_EPSILON = 0.05;
export declare const VISIBLE_Y_PADDING_RATIO = 0.12;
export declare const VISIBLE_Y_SMOOTHING_RATIO = 0.28;
export declare const WHEEL_ZOOM_SENSITIVITY = 0.0011;
export declare const WHEEL_ZOOM_MAX_DELTA_PX = 220;
export interface XViewDomain {
    firstX: number;
    lastX: number;
    minVisibleCandles?: number;
    rightPaddingCandles?: number;
}
export interface XViewAnchor {
    x: number;
    ratio: number;
}
export declare function isFollowingLatest(view: Pick<ViewBounds, "maxX">, latestX: number | null | undefined, rightPaddingCandles?: number, epsilon?: number): boolean;
export declare function withRightPadding(bounds: ViewBounds, rightPaddingCandles?: number): ViewBounds;
export declare function clampXView(view: ViewBounds, domain: XViewDomain, anchor?: XViewAnchor): ViewBounds;
export interface YRangePoint {
    x: number;
    h: number;
    l: number;
}
export declare function computeVisibleYBounds(candles: YRangePoint[], view: Pick<ViewBounds, "minX" | "maxX">, paddingRatio?: number): Pick<ViewBounds, "minY" | "maxY"> | null;
export declare function smoothVisibleYBounds(current: Pick<ViewBounds, "minY" | "maxY">, target: Pick<ViewBounds, "minY" | "maxY">, ratio?: number): Pick<ViewBounds, "minY" | "maxY">;
export declare function isYBoundsClose(current: Pick<ViewBounds, "minY" | "maxY">, target: Pick<ViewBounds, "minY" | "maxY">, epsilonRatio?: number): boolean;
export declare function wheelZoomScale(deltaPx: number, sensitivity?: number, maxAbsDeltaPx?: number): number;
export declare function scaleYView(view: ViewBounds, anchorRatio: number, scale: number): ViewBounds;
