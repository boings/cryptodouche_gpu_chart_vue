import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
export function sha256(value) {
  const bytes = typeof value === "string" ? value : canonicalJson(value);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function hashSuffix(value, length = 20) {
  return sha256(value).slice("sha256:".length, "sha256:".length + length);
}

export async function writeCanonicalJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${canonicalJson(value)}\n`, { encoding: "utf8", flag: "w" });
}

export function bundleFingerprint(bundle) {
  const { bundleFingerprint: _ignored, ...contents } = bundle;
  return sha256(contents);
}
