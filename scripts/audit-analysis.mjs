#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const AUDIT_SCHEMA_VERSION = "replay-analysis-audit.1";

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) printUsage();
  else await runAudit(options);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runAudit(options) {
  if (!options.casePath || !options.dataPath) {
    throw new Error("Replay case and analysis-data JSON paths are required");
  }
  if (!options.timeline && options.at == null) {
    throw new Error("Choose one cutoff with --at or request --timeline");
  }

  const api = await loadApi();
  const replayCase = requireRecord(
    JSON.parse(await readFile(resolve(options.casePath), "utf8")),
    "Replay case",
  );
  const manifest = requireRecord(replayCase.manifest ?? replayCase, "ReplayCaseManifest");
  const profiles = requireRecord(replayCase.profiles, "Replay case profiles");
  const strategyProfile = requireRecord(profiles.strategy, "Strategy profile");
  const radarSelectionProfile = requireRecord(
    profiles.radarSelection,
    "Radar selection profile",
  );
  const radarEpisode = findRadarEpisode(replayCase, manifest);
  const analysisData = JSON.parse(await readFile(resolve(options.dataPath), "utf8"));
  const adapter = new api.JsonReplayAnalysisDataAdapter(analysisData);
  const analysisProfile = await loadAnalysisProfile(
    api,
    options.profilePath,
    profiles.analysis,
    strategyProfile,
  );
  const avwapAnchors = options.anchorsPath
    ? requireArray(
        JSON.parse(await readFile(resolve(options.anchorsPath), "utf8")),
        "AVWAP anchors",
      )
    : requireOptionalArray(replayCase.avwapAnchors, "Replay case AVWAP anchors");

  const loaded = await loadRawSeries(api, adapter, manifest, analysisProfile);
  const baseInput = {
    symbol: requireString(manifest.symbol, "Manifest symbol"),
    source: requireString(manifest.source, "Manifest source"),
    candlesByTimeframe: loaded.target,
    referenceCandlesByTimeframe: loaded.reference,
    avwapAnchors,
    radarEpisode,
    radarSelectionProfile,
    strategyProfile,
    analysisProfile,
  };

  const maximumCutoff = options.at ?? caseHorizon(replayCase, manifest, loaded.latestTargetClose);
  const points = options.timeline
    ? timelinePoints(api, baseInput, requireTimestamp(manifest.startAsOf, "Manifest startAsOf"), maximumCutoff)
    : [maximumCutoff];
  if (!points.length) throw new Error("No completed execution candle exists in the requested range");

  const batchStates = points.map((asOf) => api.materializeReplayAnalysis({ ...baseInput, asOf }));
  let session = api.createReplayAnalysisSession(baseInput);
  const incrementalStates = [];
  for (const point of points) {
    session = api.advanceReplayAnalysisTo(session, point);
    const resumed = api.deserializeReplayAnalysisSession(
      api.serializeReplayAnalysisSession(session),
    );
    const state = resumed.states.at(-1);
    if (!state) throw new Error(`Incremental analysis produced no state at ${point}`);
    incrementalStates.push(state);
    session = resumed;
  }
  assertCanonicalEqual(
    api,
    batchStates,
    incrementalStates,
    "Batch and incremental analysis differ",
  );
  for (const state of batchStates) assertCausalState(state);

  const liveComparison = options.comparePath
    ? await compareLiveFixture(api, options.comparePath, batchStates, options.timeline)
    : { requested: false, equal: null, fixturePath: null };
  const summaries = batchStates.map(summarizeState);
  const definition = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    mode: options.timeline ? "timeline" : "cutoff",
    manifestRef: {
      id: requireString(manifest.id, "Manifest id"),
      symbol: baseInput.symbol.toUpperCase(),
      source: baseInput.source,
      radarEpisodeId: requireString(manifest.radarEpisodeId, "Manifest radarEpisodeId"),
    },
    replayEngineVersion: api.REPLAY_MATERIALIZED_ENGINE_VERSION,
    analysisEngineVersion: api.REPLAY_ANALYSIS_ENGINE_VERSION,
    analysisProfileRef: {
      id: analysisProfile.id,
      version: analysisProfile.version,
      hash: analysisProfile.canonicalConfigHash,
    },
    requestedCutoff: maximumCutoff,
    requiredCoverage: api.replayAnalysisRequiredCoverage({ analysisProfile }),
    inputCoverage: loaded.coverage,
    comparison: {
      batchVsIncremental: "equal",
      serializeResume: "equal",
      liveFixture: liveComparison,
    },
    summaries,
    states: batchStates,
  };
  const output = {
    ...definition,
    id: `replay-analysis-audit:${api.canonicalHash(definition).slice("fnv1a64:".length)}`,
  };
  const serialized = api.canonicalSerialize(output);

  for (const summary of summaries) printSummary(summary);
  console.log(
    `VERIFY batch=incremental resume=equal future=isolated live=${liveComparison.equal == null ? "not-requested" : liveComparison.equal ? "equal" : "different"}`,
  );
  if (options.outputPath) {
    const path = resolve(options.outputPath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${serialized}\n`, "utf8");
    console.log(`ANALYSIS ${path} id=${output.id}`);
  } else {
    process.stdout.write(`${serialized}\n`);
  }
}

async function loadApi() {
  const api = await import("../dist/core.js");
  const required = [
    "JsonReplayAnalysisDataAdapter",
    "REPLAY_ANALYSIS_ENGINE_VERSION",
    "REPLAY_MATERIALIZED_ENGINE_VERSION",
    "advanceReplayAnalysisTo",
    "canonicalHash",
    "canonicalSerialize",
    "createExperimentalReplayAnalysisProfile",
    "createReplayAnalysisProfile",
    "createReplayAnalysisSession",
    "deserializeReplayAnalysisSession",
    "materializeReplayAnalysis",
    "replayAnalysisProfileHash",
    "replayAnalysisRequiredCoverage",
    "selectReplayRecordsAt",
    "serializeReplayAnalysisSession",
  ];
  const missing = required.filter((name) => api[name] == null);
  if (missing.length) throw new Error(`dist/core.js is missing analysis exports: ${missing.join(", ")}`);
  return api;
}

async function loadAnalysisProfile(api, path, embedded, strategyProfile) {
  const raw = path
    ? JSON.parse(await readFile(resolve(path), "utf8"))
    : embedded ?? null;
  if (raw == null) return api.createExperimentalReplayAnalysisProfile(strategyProfile);
  const record = requireRecord(raw, "Replay analysis profile");
  if (
    typeof record.canonicalConfigHash === "string" &&
    record.canonicalConfigHash !== api.replayAnalysisProfileHash(record)
  ) throw new Error("Replay analysis profile failed deterministic hash verification");
  return api.createReplayAnalysisProfile(record, strategyProfile);
}

async function loadRawSeries(api, adapter, manifest, profile) {
  const target = {};
  const reference = {};
  const coverage = {};
  let latestTargetClose = 0;
  const referenceSymbol = profile.referenceMarketPolicy.symbol;
  const referenceSource = profile.referenceMarketPolicy.source ?? manifest.source;
  for (const timeframe of profile.evaluatedTimeframes) {
    const targetQuery = { symbol: manifest.symbol, source: manifest.source, timeframe };
    const referenceQuery = { symbol: referenceSymbol, source: referenceSource, timeframe };
    const targetCoverage = await adapter.getCoverage(targetQuery);
    const referenceCoverage = await adapter.getCoverage(referenceQuery);
    coverage[timeframe] = { target: targetCoverage, reference: referenceCoverage };
    target[timeframe] = await loadCoveredSeries(
      adapter.loadCandles.bind(adapter),
      adapter.loadCandleRevisions.bind(adapter),
      targetQuery,
      targetCoverage,
    );
    reference[timeframe] = await loadCoveredSeries(
      adapter.loadReferenceCandles.bind(adapter),
      adapter.loadReferenceCandleRevisions.bind(adapter),
      referenceQuery,
      referenceCoverage,
    );
    latestTargetClose = Math.max(latestTargetClose, targetCoverage.latestCloseTime ?? 0);
  }
  return { target, reference, coverage, latestTargetClose };
}

async function loadCoveredSeries(loadBase, loadRevisions, identity, coverage) {
  if (coverage.earliestOpenTime == null || coverage.latestCloseTime == null) return [];
  const query = {
    ...identity,
    from: coverage.earliestOpenTime,
    to: coverage.latestCloseTime,
  };
  const records = [...await loadBase(query), ...await loadRevisions(query)];
  return records.sort(
    (left, right) => left.openTime - right.openTime || left.knownAt - right.knownAt ||
      left.observationId.localeCompare(right.observationId),
  );
}

function timelinePoints(api, input, start, end) {
  if (end < start) throw new RangeError("Timeline cutoff cannot precede manifest startAsOf");
  const records = api.selectReplayRecordsAt(
    input.candlesByTimeframe[input.analysisProfile.executionTimeframe] ?? [],
    end,
  );
  const points = records
    .map((candle) => candle.closeTime)
    .filter((closeTime) => closeTime >= start && closeTime <= end);
  if (start <= end) points.push(start);
  return [...new Set(points)].sort((left, right) => left - right);
}

function caseHorizon(replayCase, manifest, latestTargetClose) {
  const duration = replayCase.config?.maximumCaseDuration;
  if (typeof duration === "number" && Number.isFinite(duration) && duration >= 0) {
    return Math.min(manifest.startAsOf + duration, latestTargetClose || Infinity);
  }
  if (!latestTargetClose) throw new Error("Cannot infer timeline cutoff from empty target data");
  return latestTargetClose;
}

function findRadarEpisode(replayCase, manifest) {
  const episodes = requireArray(replayCase.data?.radarEpisodes, "Replay case radarEpisodes");
  const episode = episodes.find((item) => item?.id === manifest.radarEpisodeId);
  if (!episode) throw new Error("Replay case does not contain the manifest RadarEpisode sidecar");
  return requireRecord(episode, "RadarEpisode");
}

async function compareLiveFixture(api, path, states, timeline) {
  const fixture = JSON.parse(await readFile(resolve(path), "utf8"));
  const expected = timeline
    ? fixture.states ?? fixture
    : fixture.analysisState ?? fixture.state ?? fixture.states?.at?.(-1) ?? fixture;
  const actual = timeline ? states : states.at(-1);
  const equal = api.canonicalSerialize(expected) === api.canonicalSerialize(actual);
  if (!equal) throw new Error("Live/shared analysis fixture differs from replay materialization");
  return { requested: true, equal: true, fixturePath: resolve(path) };
}

function assertCausalState(state) {
  if (state.effectiveAsOf > state.requestedAsOf) {
    throw new Error(`Analysis state ${state.id} exceeds its requested cutoff`);
  }
  walk(state, (key, value) => {
    if (
      ["knownAt", "evaluatedAt", "latestInputKnownAt", "latestInputCloseTime"].includes(key) &&
      typeof value === "number" && value > state.effectiveAsOf
    ) throw new Error(`Analysis state ${state.id} exposes future ${key}=${value}`);
  });
  if (state.dataQualityNotes.some((note) => note.code === "CARRIED_FORWARD_ANALYSIS_STATE")) {
    throw new Error(`Materialized state ${state.id} contains carried-forward analysis`);
  }
}

function summarizeState(state) {
  return {
    requestedAsOf: state.requestedAsOf,
    effectiveAsOf: state.effectiveAsOf,
    stateId: state.id,
    lifecycleState: state.lifecycleResult.currentState,
    lifecycleTransitions: state.lifecycleResult.transitions,
    freshness: state.freshnessByComponent,
    observationIds: collectObservationIds(state),
    dataQualityNotes: state.dataQualityNotes,
  };
}

function collectObservationIds(value) {
  const ids = new Set();
  walk(value, (key, item) => {
    if (key === "observationId" && typeof item === "string") ids.add(item);
    if (key === "sourceObservationIds" && Array.isArray(item)) {
      for (const id of item) if (typeof id === "string") ids.add(id);
    }
  });
  return [...ids].sort();
}

function printSummary(summary) {
  const available = Object.values(summary.freshness).filter((item) => item.status === "available").length;
  const unavailable = Object.values(summary.freshness).length - available;
  console.log(
    `STATE requested=${formatTime(summary.requestedAsOf)} effective=${formatTime(summary.effectiveAsOf)} id=${summary.stateId} lifecycle=${summary.lifecycleState} available=${available} unavailable=${unavailable} observations=${summary.observationIds.length} transitions=${summary.lifecycleTransitions.length}`,
  );
}

function assertCanonicalEqual(api, left, right, message) {
  if (api.canonicalSerialize(left) !== api.canonicalSerialize(right)) throw new Error(message);
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    visit(key, item);
    walk(item, visit);
  }
}

function parseArguments(args) {
  const options = {
    casePath: null,
    dataPath: null,
    at: null,
    timeline: false,
    outputPath: null,
    profilePath: null,
    anchorsPath: null,
    comparePath: null,
    help: false,
  };
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--timeline") options.timeline = true;
    else if (arg === "--at") options.at = parseTime(requireArgument(args, ++index, "--at"));
    else if (arg === "--out") options.outputPath = requireArgument(args, ++index, "--out");
    else if (arg === "--profile") options.profilePath = requireArgument(args, ++index, "--profile");
    else if (arg === "--anchors") options.anchorsPath = requireArgument(args, ++index, "--anchors");
    else if (arg === "--compare-live-fixture") {
      options.comparePath = requireArgument(args, ++index, "--compare-live-fixture");
    } else if (arg.startsWith("-")) throw new Error(`Unknown option ${arg}`);
    else positional.push(arg);
  }
  if (positional.length > 2) throw new Error("Expected replay-case.json and analysis-data.json");
  [options.casePath, options.dataPath] = positional;
  return options;
}

function parseTime(value) {
  if (/^\d+$/.test(value)) return requireTimestamp(Number(value), "--at");
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new Error(`Invalid --at timestamp ${value}`);
  return Math.floor(milliseconds / 1_000);
}

function requireArgument(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

function requireRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireOptionalArray(value, label) {
  return value == null ? [] : requireArray(value, label);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} is required`);
  return value;
}

function requireTimestamp(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a Unix-second timestamp`);
  return value;
}

function formatTime(value) {
  return new Date(value * 1_000).toISOString();
}

function printUsage() {
  console.log(`Usage:
  pnpm audit:analysis replay-case.json analysis-data.json --at <ISO|unix> [--out file]
  pnpm audit:analysis replay-case.json analysis-data.json --timeline [--at <upper-cutoff>] [--out file]

Options:
  --profile file                 Load a versioned ReplayAnalysisProfile JSON
  --anchors file                 Load an array of explicit AvwapAnchorSpec objects
  --compare-live-fixture file    Require canonical equality with shared/live output
  --out file                     Write canonical deterministic JSON
  --help                         Show this help`);
}
