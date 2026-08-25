import type { ViewBounds } from "./types";

export const MIN_VISIBLE_CANDLES = 8;
export const RIGHT_EDGE_PADDING_CANDLES = 2;
export const FOLLOW_LATEST_EPSILON = 0.05;
export const VISIBLE_Y_PADDING_RATIO = 0.12;

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

export function isFollowingLatest(
  view: Pick<ViewBounds, "maxX">,
  latestX: number | null | undefined,
  rightPaddingCandles = RIGHT_EDGE_PADDING_CANDLES,
  epsilon = FOLLOW_LATEST_EPSILON,
): boolean {
  if (latestX == null) return true;
  return (
    view.maxX >= latestX - epsilon &&
    view.maxX <= latestX + Math.max(0, rightPaddingCandles) + epsilon
  );
}

export function withRightPadding(
  bounds: ViewBounds,
  rightPaddingCandles = RIGHT_EDGE_PADDING_CANDLES,
): ViewBounds {
  const padding = Math.max(0, rightPaddingCandles);
  return {
    ...bounds,
    maxX: bounds.maxX + padding,
  };
}

export function clampXView(
  view: ViewBounds,
  domain: XViewDomain,
  anchor?: XViewAnchor,
): ViewBounds {
  if (!Number.isFinite(domain.firstX) || !Number.isFinite(domain.lastX)) return view;

  const minAllowed = Math.min(domain.firstX, domain.lastX);
  const latestX = Math.max(domain.firstX, domain.lastX);
  const initialPadding = Math.max(0, domain.rightPaddingCandles ?? RIGHT_EDGE_PADDING_CANDLES);
  const maxInitialRightEdge = latestX + initialPadding;
  const maxDefaultWidth = Math.max(1, maxInitialRightEdge - minAllowed);
  const minWidth = Math.min(
    Math.max(1, domain.minVisibleCandles ?? MIN_VISIBLE_CANDLES),
    maxDefaultWidth,
  );
  const maxWidth = Math.max(minWidth, maxDefaultWidth);
  const currentWidth = Number.isFinite(view.maxX - view.minX) ? view.maxX - view.minX : minWidth;
  const width = Math.min(maxWidth, Math.max(minWidth, currentWidth));

  let minX: number;
  if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.ratio)) {
    const ratio = Math.max(0, Math.min(1, anchor.ratio));
    minX = anchor.x - ratio * width;
  } else {
    const center = Number.isFinite(view.minX + view.maxX)
      ? (view.minX + view.maxX) * 0.5
      : minAllowed + maxDefaultWidth * 0.5;
    minX = center - width * 0.5;
  }

  let maxX = minX + width;
  if (minX < minAllowed) {
    minX = minAllowed;
    maxX = minX + width;
  }
  if (minX > latestX) {
    minX = latestX;
    maxX = minX + width;
  }

  return { ...view, minX, maxX };
}

export interface YRangePoint {
  x: number;
  h: number;
  l: number;
}

export function computeVisibleYBounds(
  candles: YRangePoint[],
  view: Pick<ViewBounds, "minX" | "maxX">,
  paddingRatio = VISIBLE_Y_PADDING_RATIO,
): Pick<ViewBounds, "minY" | "maxY"> | null {
  if (!candles.length) return null;

  const minVisibleX = Math.min(view.minX, view.maxX) - 0.5;
  const maxVisibleX = Math.max(view.minX, view.maxX) + 0.5;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const candle of candles) {
    if (candle.x < minVisibleX || candle.x > maxVisibleX) continue;
    if (Number.isFinite(candle.l)) minY = Math.min(minY, candle.l);
    if (Number.isFinite(candle.h)) maxY = Math.max(maxY, candle.h);
  }

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return null;
  return paddedYBounds(minY, maxY, paddingRatio);
}

export function scaleYView(
  view: ViewBounds,
  anchorRatio: number,
  scale: number,
): ViewBounds {
  const span = view.maxY - view.minY;
  if (!Number.isFinite(span) || span <= 0 || !Number.isFinite(scale) || scale <= 0) {
    return view;
  }

  const ratio = Math.max(0, Math.min(1, anchorRatio));
  const nextSpan = Math.max(1e-12, span * scale);
  const anchorY = view.maxY - ratio * span;
  const maxY = anchorY + ratio * nextSpan;
  return {
    ...view,
    minY: maxY - nextSpan,
    maxY,
  };
}

function paddedYBounds(
  rawMinY: number,
  rawMaxY: number,
  paddingRatio: number,
): Pick<ViewBounds, "minY" | "maxY"> {
  const midpoint = (rawMinY + rawMaxY) * 0.5;
  const minSpan = Math.max(Math.abs(midpoint) * 0.001, 1e-9);
  const span = Math.max(rawMaxY - rawMinY, minSpan);
  const minY = midpoint - span * 0.5;
  const maxY = midpoint + span * 0.5;
  const pad = span * Math.max(0, paddingRatio);
  return {
    minY: minY - pad,
    maxY: maxY + pad,
  };
}
