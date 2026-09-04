import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const goldenFiles = {
  "replay-continuation.json": "c101a4731c2397455304cc33977a31bb99c67f8e616eef99def4ebdfcb15d870",
  "replay-continuation.session.json": "955d0df4799368498f0560e0b3076ba14bbe98984be142a95e664ed6530576f9",
  "replay-drop-rebound.json": "f34db56082629128801e0f9bd87ddf0e344f5f936a19751fafb705fe249c7d11",
  "replay-drop-rebound.session.json": "db3cbdde2c98782fffd1a8685f8a8aada971e8a271c3173636ee3a22dabc2348",
};

describe("replay-engine.1 byte compatibility", () => {
  for (const [name, expected] of Object.entries(goldenFiles)) {
    it(`preserves ${name}`, () => {
      const bytes = readFileSync(new URL(`../fixtures/generated/${name}`, import.meta.url));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(expected);
    });
  }
});
