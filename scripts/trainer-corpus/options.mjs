import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULTS = Object.freeze({
  source: "bybit",
  radarProfile: "experimental-impulse-fade",
  strategyProfile: "impulse-fade-research-default",
  analysisProfile: "experimental-impulse-fade",
  replayProfile: "materialized-default",
  executionProfile: "experimental-candle-only",
  analysisPreroll: 181 * 86_400,
  displayPreroll: 14 * 86_400,
  executionPostroll: 72 * 3_600,
  maxCases: 20,
  seed: "phase-3b",
  offline: false,
});

export async function parseCliOptions(argv, cwd = process.cwd()) {
  const allowed = new Set([
    "source", "symbols", "from", "to", "output-dir", "snapshot-dir",
    "radar-profile", "strategy-profile", "analysis-profile", "replay-profile",
    "execution-profile", "analysis-preroll", "display-preroll",
    "execution-postroll", "max-cases", "seed",
  ]);
  const values = new Map();
  const flags = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--offline") {
      flags.add("offline");
      continue;
    }
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    if (!allowed.has(name)) throw new Error(`Unknown option --${name}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
    values.set(name, value);
    index += 1;
  }

  const source = values.get("source") ?? DEFAULTS.source;
  if (source !== "bybit") throw new Error("Replay Phase 3B currently supports --source bybit only");
  const symbolsFile = required(values, "symbols");
  const from = parseUtc(required(values, "from"), "from");
  const to = parseUtc(required(values, "to"), "to");
  if (from >= to) throw new Error("--from must precede --to");
  const symbols = await readSymbols(path.resolve(cwd, symbolsFile));
  const outputDir = path.resolve(cwd, required(values, "output-dir"));
  const snapshotDir = path.resolve(cwd, required(values, "snapshot-dir"));

  const result = {
    source,
    symbols,
    symbolsFile: path.resolve(cwd, symbolsFile),
    from,
    to,
    radarProfile: values.get("radar-profile") ?? DEFAULTS.radarProfile,
    strategyProfile: values.get("strategy-profile") ?? DEFAULTS.strategyProfile,
    analysisProfile: values.get("analysis-profile") ?? DEFAULTS.analysisProfile,
    replayProfile: values.get("replay-profile") ?? DEFAULTS.replayProfile,
    executionProfile: values.get("execution-profile") ?? DEFAULTS.executionProfile,
    analysisPreroll: parseDuration(values.get("analysis-preroll"), DEFAULTS.analysisPreroll, "analysis-preroll"),
    displayPreroll: parseDuration(values.get("display-preroll"), DEFAULTS.displayPreroll, "display-preroll"),
    executionPostroll: parseDuration(values.get("execution-postroll"), DEFAULTS.executionPostroll, "execution-postroll"),
    maxCases: parsePositiveInteger(values.get("max-cases"), DEFAULTS.maxCases, "max-cases"),
    outputDir,
    snapshotDir,
    seed: values.get("seed") ?? DEFAULTS.seed,
    offline: flags.has("offline"),
  };
  if (result.displayPreroll > result.analysisPreroll) {
    throw new Error("--display-preroll cannot exceed --analysis-preroll");
  }
  if (result.to > Math.floor(Date.now() / 1000)) {
    throw new Error("--to cannot be in the future because completed-candle output must be stable");
  }
  return Object.freeze(result);
}

export function usage() {
  return `Usage: node scripts/build-trainer-corpus.mjs \\
  --source bybit --symbols symbols.json --from <UTC> --to <UTC> \\
  --output-dir <dir> --snapshot-dir <dir> [--offline] \\
  [--radar-profile experimental-impulse-fade] \\
  [--strategy-profile impulse-fade-research-default] \\
  [--analysis-profile experimental-impulse-fade] \\
  [--replay-profile materialized-default] \\
  [--execution-profile experimental-candle-only] \\
  [--analysis-preroll 181d] [--display-preroll 14d] \\
  [--execution-postroll 72h] [--max-cases 20] [--seed phase-3b]`;
}

async function readSymbols(file) {
  const parsed = JSON.parse(await readFile(file, "utf8"));
  const supplied = Array.isArray(parsed) ? parsed : parsed?.symbols;
  if (!Array.isArray(supplied) || supplied.length === 0) {
    throw new Error("Symbols JSON must be a non-empty array or an object with a symbols array");
  }
  const symbols = [...new Set(supplied.map((value) => String(value).trim().toUpperCase()))].sort();
  for (const symbol of symbols) {
    if (!/^[A-Z0-9]{2,30}USDT$/.test(symbol)) throw new Error(`Invalid USDT perpetual symbol: ${symbol}`);
  }
  const targets = symbols.filter((symbol) => symbol !== "BTCUSDT");
  if (targets.length === 0) throw new Error("Symbols JSON must include at least one non-BTCUSDT target");
  return targets;
}

function required(values, name) {
  const value = values.get(name);
  if (!value) throw new Error(`Missing required --${name}`);
  return value;
}

function parseUtc(value, label) {
  if (!/(?:Z|[+-]\d\d:\d\d)$/.test(value)) throw new Error(`--${label} must include an explicit UTC offset`);
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || milliseconds % 1000 !== 0) throw new Error(`Invalid --${label} timestamp`);
  return milliseconds / 1000;
}

function parseDuration(value, fallback, label) {
  if (value == null) return fallback;
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`--${label} must be an integer duration such as 72h or 14d`);
  const multiplier = { s: 1, m: 60, h: 3_600, d: 86_400 }[match[2]];
  const result = Number(match[1]) * multiplier;
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error(`--${label} must be positive`);
  return result;
}

function parsePositiveInteger(value, fallback, label) {
  if (value == null) return fallback;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error(`--${label} must be a positive integer`);
  return result;
}
