export function sliverGapBarWidth(slotWidthPx: number, scale: number) {
  if (!Number.isFinite(slotWidthPx) || slotWidthPx <= 0) return 0;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const gapPx = Math.min(2 * safeScale, slotWidthPx * 0.18);
  return Math.max(0.5, slotWidthPx - gapPx);
}
