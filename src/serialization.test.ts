import { describe, expect, it } from "vitest";
import { canonicalHash, canonicalSerialize, immutableJsonClone } from "./serialization";

describe("canonical serialization", () => {
  it("produces the same bytes and hash regardless of object key order", () => {
    const first = { z: 3, nested: { b: true, a: [1, null, "x"] }, omitted: undefined };
    const second = { nested: { a: [1, null, "x"], b: true }, z: 3 };

    expect(canonicalSerialize(first)).toBe(canonicalSerialize(second));
    expect(canonicalHash(first)).toBe(canonicalHash(second));
  });

  it("preserves the legacy BigInt FNV-1a result", () => {
    const values = [
      null,
      "",
      "CryptoDouche",
      { z: 3, nested: { b: true, a: [1, null, "x"] } },
      { unicode: "BTC \u2192 FIL", number: 0.00000001 },
    ];
    for (const value of values) {
      expect(canonicalHash(value)).toBe(legacyHash(value));
    }
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

function legacyHash(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalSerialize(value));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}
