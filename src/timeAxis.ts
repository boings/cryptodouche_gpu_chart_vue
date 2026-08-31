const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MULTI_DAY_DATE_LABEL_SPAN_SEC = 2 * DAY;

const TIME_AXIS_STEPS_SEC = [
  1 * MINUTE,
  2 * MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  1 * HOUR,
  2 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  1 * DAY,
  2 * DAY,
  3 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
] as const;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function estimateTimeAxisLabelWidth(
  fontPx: number,
  scale: number,
  spanSec: number,
) {
  if (spanSec >= 365 * DAY) return Math.max(78 * scale, fontPx * 6.1);
  if (spanSec >= MULTI_DAY_DATE_LABEL_SPAN_SEC) {
    return Math.max(58 * scale, fontPx * 4.8);
  }
  return Math.max(46 * scale, fontPx * 4.2);
}

export function timeAxisStepSeconds(
  targetSec: number,
  timeframeSec: number,
  spanSec = targetSec,
) {
  const minStep = minimumStepSeconds(timeframeSec, spanSec);
  const target = Math.max(minStep, targetSec);
  for (const step of TIME_AXIS_STEPS_SEC) {
    if (step >= target && step >= minStep) return step;
  }
  return Math.ceil(target / minStep) * minStep;
}

export function formatTimeAxisLabel(tsSec: number, spanSec: number, stepSec: number) {
  const date = new Date(tsSec * 1000);
  if (spanSec >= 365 * DAY || stepSec >= 30 * DAY) {
    return `${monthLabel(date)} ${date.getFullYear()}`;
  }
  if (spanSec >= MULTI_DAY_DATE_LABEL_SPAN_SEC || stepSec >= DAY) {
    return `${monthLabel(date)} ${date.getDate()}`;
  }
  if (isLocalDayBoundary(date) && spanSec >= 18 * HOUR) {
    return `${monthLabel(date)} ${date.getDate()}`;
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function minimumStepSeconds(timeframeSec: number, spanSec: number) {
  const timeframeStep = Math.max(1, timeframeSec);
  if (spanSec >= 90 * DAY) return Math.max(timeframeStep, 7 * DAY);
  if (spanSec >= MULTI_DAY_DATE_LABEL_SPAN_SEC) return Math.max(timeframeStep, DAY);
  return timeframeStep;
}

function isLocalDayBoundary(date: Date) {
  return date.getHours() === 0 && date.getMinutes() === 0;
}

function monthLabel(date: Date) {
  return MONTH_LABELS[date.getMonth()] ?? "";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
