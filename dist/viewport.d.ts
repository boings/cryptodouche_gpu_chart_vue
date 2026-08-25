import type { ViewBounds } from "./types";
export declare const MIN_VISIBLE_CANDLES = 8;
export declare const RIGHT_EDGE_PADDING_CANDLES = 2;
export declare const FOLLOW_LATEST_EPSILON = 0.05;
export declare const VISIBLE_Y_PADDING_RATIO = 0.12;
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
export declare function scaleYView(view: ViewBounds, anchorRatio: number, scale: number): ViewBounds;
