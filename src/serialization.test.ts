import { describe, expect, it } from "vitest";
import { canonicalHash, canonicalSerialize, immutableJsonClone } from "./serialization";

describe("canonical serialization", () => {
  it("produces the same bytes and hash regardless of object key order", () => {
    const first = { z: 3, nested: { b: true, a: [1, null, "x"] }, omitted: undefined };
    const second = { nested: { a: [1, null, "x"], b: true }, z: 3 };

    expect(canonicalSerialize(first)).toBe(canonicalSerialize(second));
    expect(canonicalHash(first)).toBe(canonicalHash(second));
  });

  it("returns an immutable JSON clone rather than retaining live references", () => {
    const source = { state: { value: 1 } };
    const snapshot = immutableJsonClone(source);
    source.state.value = 2;

    expect(snapshot).toEqual({ state: { value: 1 } });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.state)).toBe(true);
  });
});
