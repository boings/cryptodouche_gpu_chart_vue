import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { once } from "node:events";
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
  const stream = createWriteStream(file, { encoding: "utf8", flags: "w" });
  try {
    for (const chunk of canonicalChunks(value)) {
      if (!stream.write(chunk)) await once(stream, "drain");
    }
    stream.end("\n");
    await once(stream, "finish");
  } catch (error) {
    stream.destroy();
    throw error;
  }
}

function* canonicalChunks(value) {
  if (value === null || typeof value !== "object") {
    yield JSON.stringify(value);
    return;
  }
  if (Array.isArray(value)) {
    yield "[";
    for (let index = 0; index < value.length; index += 1) {
      if (index > 0) yield ",";
      yield* canonicalChunks(value[index]);
    }
    yield "]";
    return;
  }
  yield "{";
  const keys = Object.keys(value).sort();
  for (let index = 0; index < keys.length; index += 1) {
    if (index > 0) yield ",";
    const key = keys[index];
    yield `${JSON.stringify(key)}:`;
    yield* canonicalChunks(value[key]);
  }
  yield "}";
}

export function bundleFingerprint(bundle) {
  const { bundleFingerprint: _ignored, ...contents } = bundle;
  return sha256(contents);
}
