import { describe, expect, it } from "vitest";

import {
  estimateTimeAxisLabelWidth,
  formatTimeAxisLabel,
  timeAxisStepSeconds,
} from "./timeAxis";

describe("time axis helpers", () => {
  it("uses daily labels when a multi-day view is zoomed out", () => {
    const spanSec = 4 * 24 * 60 * 60;
    const stepSec = timeAxisStepSeconds(4 * 60 * 60, 60 * 60, spanSec);

    expect(stepSec).toBe(24 * 60 * 60);
    expect(formatTimeAxisLabel(Date.UTC(2026, 7, 28, 12) / 1000, spanSec, stepSec)).toBe(
      "Aug 28",
    );
  });

  it("uses compact time labels when zoomed into an intraday view", () => {
    const spanSec = 18 * 60 * 60;
    const stepSec = timeAxisStepSeconds(60 * 60, 60, spanSec);
    const label = formatTimeAxisLabel(Date.UTC(2026, 7, 28, 12) / 1000, spanSec, stepSec);

    expect(stepSec).toBe(60 * 60);
    expect(label).toMatch(/^\d{2}:\d{2}$/);
  });

  it("estimates shorter labels for intraday views", () => {
    const intraday = estimateTimeAxisLabelWidth(14, 1, 12 * 60 * 60);
    const yearly = estimateTimeAxisLabelWidth(14, 1, 400 * 24 * 60 * 60);

    expect(intraday).toBeLessThan(yearly);
  });
});
