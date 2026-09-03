#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateImpulseFadeTimeline } from "../dist/index.js";

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const outputFlag = args.indexOf("--out");
const outputPath = outputFlag >= 0 ? args[outputFlag + 1] : null;

if (!inputPath || (outputFlag >= 0 && !outputPath)) {
  console.error("Usage: pnpm audit:impulse-fade <input.json> [--out trace.json]");
  process.exitCode = 1;
} else {
  const input = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const trace = evaluateImpulseFadeTimeline(input);
  const json = `${JSON.stringify(trace, null, 2)}\n`;
  if (outputPath) await writeFile(resolve(outputPath), json, "utf8");
  process.stdout.write(json);
}
