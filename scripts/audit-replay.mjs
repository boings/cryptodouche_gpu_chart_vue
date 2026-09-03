#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const REPLAY_AUDIT_FIXTURE_SCHEMA_VERSION = "replay-audit-fixture.1";
const COMMAND_TYPES = new Set([
  "StartSession",
  "Wait",
  "Skip",
  "ProposeTrade",
  "Abandon",
  "RevealOutcome",
]);

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printUsage();
  } else {
    await runAudit(options);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runAudit({ inputPath, outputPath }) {
  if (!inputPath) throw new Error("A replay fixture JSON path is required");
  const api = await loadReplayApi();
  const fixture = requireRecord(
    JSON.parse(await readFile(resolve(inputPath), "utf8")),
    "Replay audit fixture",
  );
  if (fixture.schemaVersion !== REPLAY_AUDIT_FIXTURE_SCHEMA_VERSION) {
    throw new Error(`Unsupported replay audit fixture schema ${String(fixture.schemaVersion)}`);
  }
  const manifest = requireRecord(fixture.manifest, "manifest");
  const config = requireRecord(fixture.config, "config");
  const profiles = requireRecord(fixture.profiles, "profiles");
  const strategyProfile = requireRecord(profiles.strategy, "profiles.strategy");
  const radarSelectionProfile = requireRecord(
    profiles.radarSelection,
    "profiles.radarSelection",
  );
  const venueRules = profiles.venueRules ?? null;
  if (venueRules != null) requireRecord(venueRules, "profiles.venueRules");
  const outcomes = requireRecord(fixture.outcomes, "outcomes");
  const commands = requireArray(fixture.commands, "commands");
  if (!commands.length || requireRecord(commands[0], "commands[0]").type !== "StartSession") {
    throw new Error("The first scripted command must be StartSession");
  }

  const adapter = new api.JsonReplayHistoricalDataAdapter(fixture.data);
  const loaded = await api.loadReplayCase({
    manifest,
    sessionConfig: config,
    historicalDataAdapter: adapter,
    strategyProfile,
    radarSelectionProfile,
    venueRules,
  });
  let session = api.createReplaySession(loaded);
  const commandCache = new Map();
  let explicitRevealSeen = false;
  let preRevealExposureChecks = 0;

  assertNoFutureExposure(session);
  preRevealExposureChecks += 1;
  console.log(
    `REPLAY manifest=${loaded.manifest.id} session=${session.id} start=${formatTime(loaded.manifest.startAsOf)} state=${session.state} exposure=outcome-sealed/session-sealed`,
  );

  for (let index = 0; index < commands.length; index += 1) {
    const raw = requireRecord(commands[index], `commands[${index}]`);
    const before = session;
    const command = materializeCommand(api, config, session, raw, commandCache);
    const isReveal = command.type === "RevealOutcome";
    const outcomeStore = isReveal
      ? new api.InMemoryReplayOutcomeStore(outcomes)
      : undefined;

    const result = await api.applyReplayCommand(loaded, session, command, outcomeStore);
    if (!isReveal && result.outcomeEnvelope != null) {
      throw new Error("Outcome data crossed the explicit RevealOutcome boundary");
    }
    if (isReveal && result.outcomeEnvelope == null && !result.idempotent) {
      throw new Error("RevealOutcome completed without an outcome envelope");
    }
    explicitRevealSeen ||= isReveal;

    assertNoFutureExposure(result.session);
    if (!explicitRevealSeen) preRevealExposureChecks += 1;
    const serialized = api.serializeReplaySession(result.session);
    assertNoFutureExposure(JSON.parse(serialized));
    const resumed = await api.resumeReplaySession(serialized, loaded);
    const resumedSerialized = api.serializeReplaySession(resumed);
    if (resumedSerialized !== serialized) {
      throw new Error(`Resume changed deterministic session state after command ${command.id}`);
    }
    session = resumed;

    console.log(
      auditLine(index + 1, before, command, result, result.outcomeEnvelope, true),
    );
  }

  const finalSerialized = api.serializeReplaySession(session);
  assertNoFutureExposure(session);
  console.log(
    `FINAL clock=${formatTime(session.currentAsOf)} frame=${session.currentFrameId ?? "-"} state=${session.state}${session.terminalReason ? `:${session.terminalReason}` : ""} revision=${session.revision} events=${session.events.length} pre_reveal_checks=${preRevealExposureChecks} exposure=${session.state === "Revealed" ? "outcome-explicit/session-sealed" : "outcome-sealed/session-sealed"} resume=deterministic`,
  );

  if (outputPath) {
    const absoluteOutputPath = resolve(outputPath);
    await mkdir(dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, `${finalSerialized}\n`, "utf8");
    console.log(`SESSION ${absoluteOutputPath} future_session=sealed`);
  }
}

async function loadReplayApi() {
  const api = await import("../dist/core.js");
  const required = [
    "JsonReplayHistoricalDataAdapter",
    "InMemoryReplayOutcomeStore",
    "applyReplayCommand",
    "canonicalSerialize",
    "createReplayCommand",
    "createReplaySession",
    "createReplayWakePlan",
    "loadReplayCase",
    "resumeReplaySession",
    "serializeReplaySession",
  ];
  const missing = required.filter((name) => typeof api[name] === "undefined");
  if (missing.length) {
    throw new Error(
      `dist/core.js is missing Replay Phase 1 exports (${missing.join(", ")}); build after the replay modules are integrated into the package exports`,
    );
  }
  return api;
}

function materializeCommand(api, config, session, raw, cache) {
  const id = requireString(raw.id, "command id");
  const prior = cache.get(id);
  const rawSignature = api.canonicalSerialize(raw);
  if (prior) {
    if (prior.rawSignature !== rawSignature) {
      throw new Error(`Scripted command id ${id} is reused with different input`);
    }
    return prior.command;
  }

  const type = requireString(raw.type, `command ${id} type`);
  if (!COMMAND_TYPES.has(type)) throw new Error(`Unsupported replay command type ${type}`);
  const payload = normalizePayload(api, config, session, type, raw.payload);
  const generated = api.createReplayCommand(session, { id, type, payload });
  const command = {
    ...generated,
    ...(hasOwn(raw, "schemaVersion") ? { schemaVersion: raw.schemaVersion } : {}),
    ...(hasOwn(raw, "sessionId") ? { sessionId: raw.sessionId } : {}),
    ...(hasOwn(raw, "expectedRevision")
      ? { expectedRevision: raw.expectedRevision }
      : {}),
    ...(hasOwn(raw, "currentFrameId") ? { currentFrameId: raw.currentFrameId } : {}),
    ...(hasOwn(raw, "submittedLogicalTime")
      ? { submittedLogicalTime: raw.submittedLogicalTime }
      : {}),
  };
  cache.set(id, { rawSignature, command });
  return command;
}

function normalizePayload(api, config, session, type, rawPayload) {
  const payload = rawPayload == null ? {} : requireRecord(rawPayload, `${type} payload`);
  if (type !== "Wait") return payload;
  const wakePlanInput = requireRecord(payload.wakePlan, "Wait payload wakePlan");
  if (typeof wakePlanInput.schemaVersion === "string" && typeof wakePlanInput.id === "string") {
    return { ...payload, wakePlan: wakePlanInput };
  }
  if (session.currentFrameId == null || session.currentAsOf == null) {
    throw new Error("Wait wake-plan shorthand requires an active replay frame");
  }
  const deadlineAfterSeconds =
    wakePlanInput.deadlineAfterSeconds ?? config.defaultWaitDeadline;
  const deadlineAsOf =
    wakePlanInput.deadlineAsOf ??
    (typeof deadlineAfterSeconds === "number"
      ? session.currentAsOf + deadlineAfterSeconds
      : null);
  if (typeof deadlineAsOf !== "number") {
    throw new Error("Wait wake plan requires deadlineAsOf or deadlineAfterSeconds");
  }
  const conditions = wakePlanInput.conditions == null
    ? []
    : requireArray(wakePlanInput.conditions, "Wait wakePlan.conditions");
  return {
    ...payload,
    wakePlan: api.createReplayWakePlan({
      submittedFrameId: session.currentFrameId,
      createdAt: session.currentAsOf,
      scheduledReview: wakePlanInput.scheduledReview ?? null,
      conditions,
      deadlineAsOf,
    }),
  };
}

function auditLine(index, before, command, result, outcomeEnvelope, resumed) {
  const frame = result.event.frame ?? currentFrame(result.session);
  const radar = frame ? radarSummary(frame.radarContext) : "-";
  const lifecycle = frame?.lifecycleState ?? "-";
  const decision = decisionSummary(command, result);
  const wake = wakeSummary(result.event);
  const compliance =
    result.event.planningAttempt?.tradePlan?.complianceResult?.classification ?? "-";
  const reveal = outcomeEnvelope
    ? ` outcome=${outcomeEnvelope.id}${outcomeEnvelope.revealedBeforeDecisionCompletion ? ":early" : ""}`
    : "";
  const exposure = result.session.state === "Revealed"
    ? "outcome-explicit/session-sealed"
    : "outcome-sealed/session-sealed";
  return `[${String(index).padStart(2, "0")}] ${command.type}${result.idempotent ? ":idempotent" : ""} clock=${formatTime(before.currentAsOf)}->${formatTime(result.session.currentAsOf)} frame=${result.session.currentFrameId ?? "-"} radar=${radar} lifecycle=${lifecycle} decision=${decision} wake=${wake} compliance=${compliance} state=${result.session.state}${result.session.terminalReason ? `:${result.session.terminalReason}` : ""} exposure=${exposure} resume=${resumed ? "ok" : "failed"}${reveal}`;
}

function radarSummary(context) {
  const detectors = context.triggeringDetectorIds.join("+") || "none";
  const path = context.pathContext;
  return `${detectors}(24h=${formatPercent(path.net24hReturnPct)},impulse=${formatPercent(path.triggeringLocalImpulseReturnPct)})`;
}

function decisionSummary(command, result) {
  if (command.type === "Wait") return `Wait:${command.payload.reason}`;
  if (command.type === "Skip") return `Skip:${command.payload.reasons.join("+")}`;
  if (command.type === "ProposeTrade") {
    const attempt = result.event.planningAttempt;
    return attempt?.accepted ? "ProposeTrade:accepted" : `ProposeTrade:rejected:${attempt?.rejectionReason ?? "unknown"}`;
  }
  if (command.type === "Abandon") return `Abandon:${compact(command.payload.reason)}`;
  if (command.type === "RevealOutcome") return "RevealOutcome:explicit";
  return "StartSession";
}

function wakeSummary(event) {
  const plan = event.wakePlan ? wakePlanSummary(event.wakePlan) : null;
  if (event.wakeResult) {
    const triggered = event.wakeResult.triggeredConditionIds.join("+") || "none";
    return `${plan ?? "plan:-"}->${event.wakeResult.reason}@${formatTime(event.wakeResult.effectiveAsOf)}[${triggered}]`;
  }
  return plan ?? "-";
}

function wakePlanSummary(wakePlan) {
  const conditions = wakePlan.conditions.map(conditionSummary).join("+") || "none";
  const review = wakePlan.scheduledReview
    ? apiScheduledReview(wakePlan.scheduledReview)
    : "none";
  return `plan:${conditions}|review:${review}|deadline:${formatTime(wakePlan.deadlineAsOf)}`;
}

function conditionSummary(condition) {
  if (condition.type === "AnyOf") {
    return `AnyOf(${condition.conditions.map(conditionSummary).join("|")})`;
  }
  const timeframe = condition.timeframe ? `:${condition.timeframe}` : "";
  const eventType = condition.eventType ? `:${condition.eventType}` : "";
  const direction = condition.direction ? `:${condition.direction}` : "";
  const state = condition.state ? `:${condition.state}` : "";
  return `${condition.type}${timeframe}${eventType}${direction}${state}`;
}

function apiScheduledReview(review) {
  return review.mode === "nextCompletedCandle"
    ? `next:${review.timeframe}`
    : `after:${review.durationSeconds}s`;
}

function assertNoFutureExposure(session) {
  const forbidden = new Set([
    "futureCandlesByTimeframe",
    "outcome",
    "radarTerminalResult",
    "maximumFavorablePriceExcursionFromDetected",
    "maximumAdversePriceExcursionFromDetected",
    "lifecycleStateTimestamps",
  ]);
  walkObject(session, (key) => {
    if (forbidden.has(key)) throw new Error(`Serialized session exposes future field ${key}`);
  });
  for (const frame of session.frames) {
    for (const candles of Object.values(frame.visibleCandlesByTimeframe)) {
      for (const candle of candles) {
        if (candle.closeTime > frame.effectiveAsOf || candle.knownAt > frame.effectiveAsOf) {
          throw new Error(`Frame ${frame.id} exposes candle data after its effective clock`);
        }
      }
    }
  }
}

function walkObject(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walkObject(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    visit(key, item);
    walkObject(item, visit);
  }
}

function currentFrame(session) {
  return session.frames.find((frame) => frame.id === session.currentFrameId) ?? null;
}

function parseArguments(args) {
  let inputPath = null;
  let outputPath = null;
  let help = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--out") {
      outputPath = args[++index] ?? null;
      if (!outputPath || outputPath.startsWith("--")) {
        throw new Error("--out requires a session JSON path");
      }
    }
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else if (inputPath == null) inputPath = arg;
    else throw new Error(`Unexpected argument ${arg}`);
  }
  return { inputPath, outputPath, help };
}

function printUsage() {
  console.log(`Usage: node scripts/audit-replay.mjs <fixture.json> [--out session.json]

Fixture keys:
  schemaVersion="replay-audit-fixture.1", manifest, config,
  profiles.{strategy,radarSelection,venueRules?}, data, outcomes (keyed by
  manifest ID), and commands.

Wait commands may supply a complete wakePlan or shorthand with
scheduledReview, conditions, and deadlineAsOf/deadlineAfterSeconds.`);
}

function formatTime(value) {
  return value == null ? "none" : new Date(value * 1_000).toISOString();
}

function formatPercent(value) {
  return value == null || !Number.isFinite(value)
    ? "-"
    : `${Number(value.toFixed(3))}%`;
}

function compact(value) {
  return String(value).trim().replaceAll(/\s+/g, "_");
}

function requireRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required`);
  return value;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
