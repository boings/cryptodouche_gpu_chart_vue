import { describe, expect, it } from "vitest";

import { sliverGapBarWidth } from "./bars";

describe("chart bar geometry", () => {
  it("keeps a small pixel gap as bars get wider", () => {
    expect(sliverGapBarWidth(8, 1)).toBeCloseTo(6.56);
    expect(sliverGapBarWidth(40, 1)).toBeCloseTo(38);
    expect(sliverGapBarWidth(80, 2)).toBeCloseTo(76);
  });

  it("still leaves a proportional gap when bars are crowded", () => {
    expect(sliverGapBarWidth(2, 1)).toBeCloseTo(1.64);
  });

  it("handles invalid geometry safely", () => {
    expect(sliverGapBarWidth(0, 1)).toBe(0);
    expect(sliverGapBarWidth(Number.NaN, 1)).toBe(0);
  });
});
