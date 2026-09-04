#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const EXECUTION_AUDIT_INPUT_SCHEMA_VERSION = "execution-audit-input.1";

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) printUsage();
  else await run(options);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function run({ replayPath, inputPath, outputPath, reveal }) {
  if (!replayPath || !inputPath) throw new Error("Replay-session and execution-input paths are required");
  const api = await import("../dist/core.js");
  const replaySerialized = await readFile(resolve(replayPath), "utf8");
  const replaySession = api.deserializeReplaySession(replaySerialized);
  const input = requireAuditInput(JSON.parse(await readFile(resolve(inputPath), "utf8")));
  if (
    input.replaySessionId !== replaySession.id ||
    input.replayFrameId !== replaySession.currentFrameId
  ) throw new Error("Execution audit input does not match the replay session/frame");
  const frame = replaySession.frames.find((item) => item.id === input.replayFrameId);
  if (!frame) throw new Error("Replay execution frame is absent from the session");
  const accepted = replaySession.planningAttempts.filter(
    (attempt) => attempt.accepted && attempt.frameId === frame.id,
  );
  if (accepted.length !== 1 || accepted[0].tradePlan.id !== input.tradePlanId) {
    throw new Error("Expected exactly one accepted finalized TradePlan for the current frame");
  }
  const plan = accepted[0].tradePlan;
  const strategyProfile = api.createStrategyProfile(withoutHash(input.strategyProfile, "profileHash"));
  const executionProfile = api.createExecutionProfile(withoutHash(input.executionProfile, "canonicalConfigHash"));
  const feeSchedule = api.createVenueFeeSchedule(withoutHash(input.feeSchedule, "canonicalConfigHash"));
  const venueRules = api.createVenueExecutionRules(
    withoutHash(input.venueRules, "canonicalConfigHash"),
    feeSchedule,
  );
  assertSuppliedHash(input.strategyProfile, strategyProfile, "profileHash", "strategy profile");
  assertSuppliedHash(input.executionProfile, executionProfile, "canonicalConfigHash", "execution profile");
  assertSuppliedHash(input.feeSchedule, feeSchedule, "canonicalConfigHash", "fee schedule");
  assertSuppliedHash(input.venueRules, venueRules, "canonicalConfigHash", "venue rules");
  const adapter = new api.JsonReplayExecutionDataAdapter(input.data);
  const loaded = await api.loadExecutionCase({
    replaySession,
    replayFrame: frame,
    tradePlan: plan,
    strategyProfile,
    executionProfile,
    venueRules,
    feeSchedule,
    historicalDataAdapter: adapter,
  });

  const checkpoints = executionCheckpoints(loaded);
  let incremental = api.createExecutionSession(loaded);
  printSession("CREATED", incremental);
  for (const checkpoint of checkpoints) {
    incremental = api.advanceExecutionTo(incremental, loaded, checkpoint);
    incremental = api.deserializeExecutionSession(api.serializeExecutionSession(incremental));
    printSession("ADVANCE", incremental);
    if (isTerminal(incremental.state)) break;
  }
  incremental = api.finalizeExecutionAtHorizon(incremental, loaded);
  const batch = api.simulateExecutionToHorizon(loaded);
  if (api.canonicalSerialize(incremental) !== api.canonicalSerialize(batch)) {
    throw new Error("Incremental execution differs from one-shot execution");
  }

  let output = incremental;
  if (reveal) {
    if (!input.replayOutcomeEnvelope) {
      throw new Error("--reveal requires replayOutcomeEnvelope in the execution audit input");
    }
    output = api.revealExecutionOutcome({
      replaySession,
      replayOutcomeEnvelope: input.replayOutcomeEnvelope,
      executionSession: incremental,
      revealedAt: replaySession.currentAsOf ?? incremental.currentAsOf,
    });
    console.log(`REVEAL ${output.id} result=${output.executionResult.id}`);
  }
  if (reveal) printResult(incremental);
  else console.log(`RESULT hidden=true execution_session=${incremental.id}`);
  if (outputPath) {
    const absolute = resolve(outputPath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, `${api.canonicalSerialize(output)}\n`, "utf8");
    console.log(`OUTPUT ${absolute}`);
  }
}

function executionCheckpoints(loaded) {
  const points = new Set([loaded.replayFrame.effectiveAsOf, loaded.replayFrame.effectiveAsOf + 1]);
  for (const candles of Object.values(loaded.dataBundle.candlesByTimeframe)) {
    for (const candle of candles) points.add(candle.knownAt);
  }
  for (const item of loaded.dataBundle.trades) points.add(item.knownAt);
  for (const item of loaded.dataBundle.funding) points.add(item.knownAt);
  points.add(loaded.replayFrame.effectiveAsOf + loaded.executionProfile.maximumExecutionHorizon);
  return [...points].sort((left, right) => left - right);
}

function printSession(label, session) {
  const last = session.executionEvents.at(-1);
  console.log(
    `${label} as_of=${session.currentAsOf} state=${session.state} event=${last?.type ?? "-"} ` +
    `fills=${session.fills.length} remaining=${session.positionLedger.remainingQuantity} ` +
    `gross=${session.positionLedger.realizedGrossPnl} fees=${session.positionLedger.totalFees} ` +
    `funding=${session.positionLedger.netFunding}`,
  );
}

function printResult(session) {
  const result = session.result;
  if (!result) {
    console.log("RESULT hidden=not-terminal");
    return;
  }
  console.log(
    `RESULT status=${result.status} close=${result.closeReason ?? "-"} net=${result.actualNetPnl ?? "incomplete"} ` +
    `gross_r=${result.grossR ?? "-"} net_r=${result.netR ?? "-"} ` +
    `mae=${result.maximumAdverseExcursion ?? "-"} mfe=${result.maximumFavorableExcursion ?? "-"} ` +
    `ambiguity=${result.ambiguity?.code ?? "none"}`,
  );
}

function requireAuditInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Execution audit input must be an object");
  const allowed = [
    "schemaVersion",
    "replaySessionId",
    "replayFrameId",
    "tradePlanId",
    "strategyProfile",
    "executionProfile",
    "venueRules",
    "feeSchedule",
    "data",
    "replayOutcomeEnvelope",
  ];
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown execution audit field ${key}`);
  if (value.schemaVersion !== EXECUTION_AUDIT_INPUT_SCHEMA_VERSION) throw new Error("Unsupported execution audit input schema");
  for (const key of ["replaySessionId", "replayFrameId", "tradePlanId"]) {
    if (typeof value[key] !== "string" || !value[key]) throw new TypeError(`${key} is required`);
  }
  for (const key of ["strategyProfile", "executionProfile", "venueRules", "feeSchedule", "data"]) {
    if (!value[key] || typeof value[key] !== "object" || Array.isArray(value[key])) throw new TypeError(`${key} must be an object`);
  }
  return value;
}

function withoutHash(value, key) {
  const clone = structuredClone(value);
  delete clone[key];
  return clone;
}

function assertSuppliedHash(supplied, rebuilt, key, label) {
  if (supplied[key] !== rebuilt[key]) throw new Error(`Supplied ${label} hash is invalid`);
}

function isTerminal(state) {
  return ["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(state);
}

function parseArguments(args) {
  const options = { replayPath: null, inputPath: null, outputPath: null, reveal: false, help: false };
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--reveal") options.reveal = true;
    else if (value === "--out") options.outputPath = args[++index] ?? null;
    else if (value.startsWith("-")) throw new Error(`Unknown option ${value}`);
    else positional.push(value);
  }
  [options.replayPath, options.inputPath] = positional;
  return options;
}

function printUsage() {
  console.log(`Usage:
  pnpm audit:execution <replay-session.json> <execution-input.json> [--out <path>]
  pnpm audit:execution <replay-session.json> <execution-input.json> --reveal [--out <path>]

The public ReplaySession is read and validated but never modified. Without --reveal,
the hidden ExecutionSession is written separately. --reveal requires an already
revealed ReplaySession and its exact replayOutcomeEnvelope in the input.`);
}
