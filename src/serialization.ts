export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export function canonicalSerialize(value: unknown): string {
  const seen = new Set<object>();

  function encode(input: unknown, inArray = false): string | undefined {
    if (input === null) return "null";
    if (typeof input === "string" || typeof input === "boolean") {
      return JSON.stringify(input);
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input)) {
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      }
      return Object.is(input, -0) ? "0" : JSON.stringify(input);
    }
    if (input === undefined) return inArray ? "null" : undefined;
    if (typeof input !== "object") {
      throw new TypeError(`Canonical JSON does not support ${typeof input}`);
    }
    if (Object.getPrototypeOf(input) !== Object.prototype && !Array.isArray(input)) {
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    }
    if (seen.has(input)) throw new TypeError("Canonical JSON does not support cycles");

    seen.add(input);
    let encoded: string;
    if (Array.isArray(input)) {
      encoded = `[${input.map((item) => encode(item, true) ?? "null").join(",")}]`;
    } else {
      const entries = Object.keys(input as Record<string, unknown>)
        .sort()
        .flatMap((key) => {
          const item = encode((input as Record<string, unknown>)[key]);
          return item == null ? [] : [`${JSON.stringify(key)}:${item}`];
        });
      encoded = `{${entries.join(",")}}`;
    }
    seen.delete(input);
    return encoded;
  }

  const encoded = encode(value);
  if (encoded == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return encoded;
}

export function canonicalHash(value: unknown): string {
  const bytes = new TextEncoder().encode(canonicalSerialize(value));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

export function immutableJsonClone<T>(value: T): T {
  return deepFreeze(JSON.parse(canonicalSerialize(value)) as T);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}
