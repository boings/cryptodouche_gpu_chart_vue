import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  auditImportedCorpusDocument,
  parseArguments,
  readImportedCorpusSelection,
} from "./audit-real-trainer-corpus.mjs";

test("streams only the requested leading bundles while counting and hashing the full corpus", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "real-corpus-audit-reader-"));
  const inputPath = path.join(outputDir, "trainer-imported-corpus.json");
  const document = {
    bundles: Array.from({ length: 8 }, (_, index) => ({
      bundleId: `bundle-${index + 1}`,
      nested: [{ text: `quoted } bracket ] value \\"${index + 1}` }],
    })),
    corpusId: "test-corpus",
    schemaVersion: "trainer-imported-corpus.1",
  };
  const serialized = JSON.stringify(document);
  await writeFile(inputPath, serialized, "utf8");

  const selected = await readImportedCorpusSelection(inputPath, 6);

  assert.equal(selected.totalBundleCount, 8);
  assert.equal(selected.document.bundles.length, 6);
  assert.deepEqual(
    selected.document.bundles.map((item) => item.bundleId),
    ["bundle-1", "bundle-2", "bundle-3", "bundle-4", "bundle-5", "bundle-6"],
  );
  assert.equal(selected.document.corpusId, document.corpusId);
  assert.equal(selected.document.schemaVersion, document.schemaVersion);
  assert.equal(
    selected.inputFingerprint,
    `sha256:${createHash("sha256").update(serialized).digest("hex")}`,
  );
});

test("enforces the standalone six-case audit boundary", async () => {
  assert.deepEqual(parseArguments(["private/trainer-imported-corpus.json"]), {
    inputPath: "private/trainer-imported-corpus.json",
    outputPath: null,
    count: 6,
    help: false,
  });
  assert.deepEqual(
    parseArguments(["--input", "in.json", "--output", "out.json", "--count", "8"]),
    { inputPath: "in.json", outputPath: "out.json", count: 8, help: false },
  );
  assert.throws(() => parseArguments(["--count", "5"]), /at least 6/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
  await assert.rejects(
    auditImportedCorpusDocument({
      schemaVersion: "trainer-imported-corpus.1",
      corpusId: "too-small",
      bundles: [],
    }, { totalBundleCount: 5 }),
    /at least 6 are required/,
  );
});
