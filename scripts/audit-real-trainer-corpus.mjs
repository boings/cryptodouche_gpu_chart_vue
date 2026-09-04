#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as core from "@cryptodouche/gpu-chart-vue/core";
import { bundleFingerprint } from "./trainer-corpus/canonical.mjs";

const AUDIT_SCHEMA_VERSION = "real-trainer-corpus-audit.1";
const IMPORT_SCHEMA_VERSION = "trainer-imported-corpus.1";
const DEFAULT_AUDIT_COUNT = 6;
const REQUIRED_CORE_EXPORTS = [
  "JsonReplayAnalysisDataAdapter",
  "JsonReplayHistoricalDataAdapter",
  "applyReplayCommand",
  "canonicalHash",
  "canonicalSerialize",
  "createAvwapAnchorSpec",
  "createReplayCommand",
  "createReplaySession",
  "createReplayWakePlan",
  "loadMaterializedReplayCase",
];
const FORBIDDEN_SAFE_DESCRIPTOR_KEYS = new Set([
  "executionresult",
  "futurecandlesbytimeframe",
  "lifecycletimeline",
  "maximumadversepriceexcursionfromdetected",
  "maximumfavorablepriceexcursionfromdetected",
  "outcome",
  "profit",
  "pnl",
  "radarterminalresult",
  "targethit",
]);

export function parseArguments(argv) {
  const result = { inputPath: null, outputPath: null, count: DEFAULT_AUDIT_COUNT, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      result.help = true;
      continue;
    }
    if (!token.startsWith("--") && result.inputPath == null) {
      result.inputPath = token;
      continue;
    }
    if (!["--input", "--output", "--count"].includes(token)) {
      throw new Error(`Unknown option ${token}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    if (token === "--input") result.inputPath = value;
    if (token === "--output") result.outputPath = value;
    if (token === "--count") {
      result.count = Number(value);
      if (!Number.isSafeInteger(result.count) || result.count < DEFAULT_AUDIT_COUNT) {
        throw new Error(`--count must be an integer of at least ${DEFAULT_AUDIT_COUNT}`);
      }
    }
    index += 1;
  }
  return result;
}

export async function auditImportedCorpusDocument(document, options = {}) {
  requireCoreExports();
  const imported = requireRecord(document, "Imported trainer corpus");
  if (imported.schemaVersion !== IMPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported imported corpus schema ${String(imported.schemaVersion)}`);
  }
  const corpusId = requireText(imported.corpusId, "corpusId");
  const bundles = requireArray(imported.bundles, "bundles");
  const minimumBundles = options.minimumBundles ?? DEFAULT_AUDIT_COUNT;
  const requestedCount = options.count ?? DEFAULT_AUDIT_COUNT;
  const totalBundleCount = options.totalBundleCount ?? bundles.length;
  if (!Number.isSafeInteger(minimumBundles) || minimumBundles <= 0) {
    throw new Error("minimumBundles must be a positive integer");
  }
  if (!Number.isSafeInteger(requestedCount) || requestedCount < minimumBundles) {
    throw new Error(`Audit count must be at least ${minimumBundles}`);
  }
  if (!Number.isSafeInteger(totalBundleCount) || totalBundleCount < bundles.length) {
    throw new Error("totalBundleCount must cover every supplied bundle");
  }
  if (totalBundleCount < minimumBundles) {
    throw new Error(
      `Corpus contains ${totalBundleCount} bundles; at least ${minimumBundles} are required for this audit`,
    );
  }

  const selected = bundles.slice(0, Math.min(requestedCount, bundles.length));
  if (selected.length < Math.min(requestedCount, totalBundleCount)) {
    throw new Error("The imported corpus selection does not contain every requested leading bundle");
  }
  assertUniqueBundleIdentities(selected);
  const cases = [];
  for (let index = 0; index < selected.length; index += 1) {
    cases.push(await auditBundle(requireRecord(selected[index], `bundles[${index}]`), index));
  }
  const definition = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    corpusId,
    inputFingerprint: options.inputFingerprint ?? core.canonicalHash(imported),
    bundleCount: totalBundleCount,
    auditedBundleCount: cases.length,
    auditedBundleRange: { firstIndex: 0, lastIndex: cases.length - 1 },
    coreVersions: {
      replay: core.REPLAY_MATERIALIZED_ENGINE_VERSION,
      analysis: core.REPLAY_ANALYSIS_ENGINE_VERSION,
      execution: core.EXECUTION_ENGINE_VERSION,
    },
    method: {
      outcomeRevealApplied: false,
      executionSimulationApplied: false,
      conditionalWaitEvidence: "bounded replay-engine.2 audit probes from the initial causal frame",
      futureIndependenceEvidence:
        "strictly post-detection OHLC causal-input counterfactual; no second analysis materialization",
    },
    cases,
  };
  return Object.freeze({
    ...definition,
    auditFingerprint: core.canonicalHash(definition),
  });
}

export async function runAudit({ inputPath, outputPath, count = DEFAULT_AUDIT_COUNT }) {
  if (!inputPath) throw new Error("A private trainer-imported-corpus.json path is required");
  const imported = await readImportedCorpusSelection(resolve(inputPath), count);
  const audit = await auditImportedCorpusDocument(imported.document, {
    count,
    minimumBundles: DEFAULT_AUDIT_COUNT,
    totalBundleCount: imported.totalBundleCount,
    inputFingerprint: imported.inputFingerprint,
  });
  const serialized = `${core.canonicalSerialize(audit)}\n`;
  if (outputPath) {
    const target = resolve(outputPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, serialized, "utf8");
  }
  process.stdout.write(serialized);
  return audit;
}

export async function readImportedCorpusSelection(inputPath, count = DEFAULT_AUDIT_COUNT) {
  if (!Number.isSafeInteger(count) || count <= 0) throw new Error("Selection count must be positive");
  const inputHash = createHash("sha256");
  const bundles = [];
  let totalBundleCount = 0;
  let state = "before-bundles";
  let searchBuffer = "";
  let trailingBuffer = "";
  let bundleBuffer = "";
  let objectDepth = 0;
  let arrayDepth = 0;
  let inString = false;
  let escaped = false;

  const consumeBundles = (text) => {
    let index = 0;
    for (; index < text.length; index += 1) {
      const character = text[index];
      if (inString) {
        if (totalBundleCount < count) bundleBuffer += character;
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        if (totalBundleCount < count) bundleBuffer += character;
        continue;
      }
      if (character === "{") {
        objectDepth += 1;
        if (totalBundleCount < count) bundleBuffer += character;
        continue;
      }
      if (character === "}") {
        if (objectDepth <= 0) throw new Error("Malformed imported corpus bundle object");
        if (totalBundleCount < count) bundleBuffer += character;
        objectDepth -= 1;
        if (objectDepth === 0 && arrayDepth === 0) {
          if (totalBundleCount < count) bundles.push(JSON.parse(bundleBuffer));
          totalBundleCount += 1;
          bundleBuffer = "";
        }
        continue;
      }
      if (character === "[") {
        arrayDepth += 1;
        if (totalBundleCount < count) bundleBuffer += character;
        continue;
      }
      if (character === "]") {
        if (objectDepth === 0 && arrayDepth === 0) {
          state = "after-bundles";
          return text.slice(index + 1);
        }
        arrayDepth -= 1;
        if (arrayDepth < 0) throw new Error("Malformed imported corpus bundle array");
        if (totalBundleCount < count) bundleBuffer += character;
        continue;
      }
      if (totalBundleCount < count && objectDepth > 0) bundleBuffer += character;
    }
    return "";
  };

  const stream = createReadStream(inputPath);
  stream.setEncoding("utf8");
  for await (const chunk of stream) {
    inputHash.update(chunk, "utf8");
    if (state === "before-bundles") {
      searchBuffer += chunk;
      const match = /"bundles"\s*:\s*\[/.exec(searchBuffer);
      if (!match) {
        searchBuffer = searchBuffer.slice(-64);
        continue;
      }
      state = "in-bundles";
      const remainder = searchBuffer.slice(match.index + match[0].length);
      searchBuffer = "";
      const trailing = consumeBundles(remainder);
      if (state === "after-bundles") trailingBuffer += trailing;
      continue;
    }
    if (state === "in-bundles") {
      const trailing = consumeBundles(chunk);
      if (state === "after-bundles") trailingBuffer += trailing;
      continue;
    }
    trailingBuffer += chunk;
    if (trailingBuffer.length > 1_000_000) {
      throw new Error("Imported corpus has an unexpectedly large top-level trailer");
    }
  }

  if (state !== "after-bundles" || objectDepth !== 0 || arrayDepth !== 0 || inString) {
    throw new Error("Imported corpus bundles array is incomplete or malformed");
  }
  const corpusId = topLevelString(trailingBuffer, "corpusId");
  const schemaVersion = topLevelString(trailingBuffer, "schemaVersion");
  return {
    document: { schemaVersion, corpusId, bundles },
    totalBundleCount,
    inputFingerprint: `sha256:${inputHash.digest("hex")}`,
  };
}

async function auditBundle(bundle, index) {
  validateBundleEnvelope(bundle, index);
  const expectedFingerprint = bundleFingerprint(bundle);
  if (bundle.bundleFingerprint !== expectedFingerprint) {
    throw new Error(`Bundle ${bundle.bundleId} failed its builder fingerprint check`);
  }
  const future = requireRecord(bundle.replayFutureData, `${bundle.bundleId}.replayFutureData`);
  if (future.schemaVersion !== "trainer-real-private-future.1") {
    throw new Error(`Bundle ${bundle.bundleId} is not a real historical trainer bundle`);
  }
  const historical = requireRecord(future.historicalData, `${bundle.bundleId}.historicalData`);
  const episode = findEpisode(bundle, historical);
  const anchors = automaticAvwapAnchors(bundle, historical, episode);
  const materializationInput = boundedMaterializationInput(bundle);
  let loaded = await loadCoreCase(bundle, anchors, materializationInput);
  const initial = await startCoreSession(loaded, `${index}:initial`);
  const repeatedFrame = (await startCoreSession(loaded, `${index}:initial`)).frame;
  if (core.canonicalSerialize(initial.frame) !== core.canonicalSerialize(repeatedFrame)) {
    throw new Error(`Bundle ${bundle.bundleId} did not reproduce its initial core frame`);
  }

  const lifecycleTransitions = await probeLifecycleTransitions(loaded, initial.session, 3, index);
  const conditionalWakes = [];
  for (const probe of conditionalProbeDefinitions(bundle, initial.frame, anchors)) {
    conditionalWakes.push(await probeCondition(loaded, initial.session, probe, index));
  }
  const dataQuality = dataQualityEvidence(bundle, loaded, initial.frame, materializationInput);
  const causalPrefixFingerprint = loaded.dataBundle.causalPrefixFingerprint;
  loaded = null;
  const selectionFutureIndependence = await futureIndependenceEvidence(
    bundle,
    episode,
    causalPrefixFingerprint,
    initial.frame,
  );

  return {
    ordinal: index + 1,
    caseId: String(bundle.safeDescriptor.caseId ?? bundle.safeDescriptor.id ?? ""),
    bundleId: bundle.bundleId,
    bundleFingerprint: bundle.bundleFingerprint,
    builderFingerprintVerified: true,
    replayCaseManifestId: bundle.replayCaseManifest.id,
    radarEpisodeId: episode.id,
    radar: {
      detectedAt: episode.detectedAt,
      startAsOf: bundle.replayCaseManifest.startAsOf,
      triggeringDetectorIds: [...episode.triggeringDetectorIds],
      triggeringObservations: clone(episode.triggeringObservations),
      pathContext: clone(episode.pathContext),
      selectionAnchor: clone(episode.selectionAnchor),
    },
    preTriggerChartContext: preTriggerContext(bundle, episode.detectedAt),
    initialLifecycle: {
      manifestDeclaredState: bundle.replayCaseManifest.initialLifecycleState ?? null,
      radarDeclaredState: episode.initialLifecycleState ?? null,
      materializedState: initial.frame.lifecycleState,
      stateSince: initial.frame.lifecycleStateSince,
      effectiveAsOf: initial.frame.effectiveAsOf,
      decisionSnapshotId: initial.frame.decisionSnapshot.id,
      materializedAnalysisStateRef: clone(initial.frame.materializedAnalysisStateRef ?? null),
      evidenceIds: initial.frame.decisionSnapshot.lifecycleEvidence.map((item) => item.id),
    },
    firstRelevantLifecycleTransitions: lifecycleTransitions,
    conditionalWakeEvidence: conditionalWakes,
    dataQuality,
    sourceReferenceAlignment: sourceReferenceAlignment(bundle),
    executionSemantics: executionEvidence(bundle, episode.detectedAt),
    selectionFutureIndependence,
    deterministicInitialReplay: {
      status: "equal",
      visibleDataFingerprint: initial.frame.visibleDataFingerprint,
      causalPrefixFingerprint,
    },
    outcomeEvidence: {
      status: "not-derived",
      reason: "The audit applies no reveal, TradePlan, or execution simulation",
    },
  };
}

function validateBundleEnvelope(bundle, index) {
  if (bundle.schemaVersion !== "trainer-case-bundle.1") {
    throw new Error(`bundles[${index}] has unsupported schema ${String(bundle.schemaVersion)}`);
  }
  requireText(bundle.bundleId, `bundles[${index}].bundleId`);
  requireText(bundle.bundleFingerprint, `bundles[${index}].bundleFingerprint`);
  const descriptor = requireRecord(bundle.safeDescriptor, `bundles[${index}].safeDescriptor`);
  const manifest = requireRecord(bundle.replayCaseManifest, `bundles[${index}].replayCaseManifest`);
  const caseId = String(descriptor.caseId ?? descriptor.id ?? "");
  if (!caseId) throw new Error(`bundles[${index}] has no case id`);
  if (descriptor.bundleId !== bundle.bundleId) throw new Error(`Bundle ${bundle.bundleId} descriptor mismatch`);
  if (descriptor.replayCaseManifestId !== manifest.id) {
    throw new Error(`Bundle ${bundle.bundleId} manifest reference mismatch`);
  }
  if (descriptor.radarEpisodeId !== manifest.radarEpisodeId) {
    throw new Error(`Bundle ${bundle.bundleId} episode reference mismatch`);
  }
  if (descriptor.symbol !== manifest.symbol || descriptor.source !== manifest.source) {
    throw new Error(`Bundle ${bundle.bundleId} source or symbol mismatch`);
  }
}

function assertUniqueBundleIdentities(bundles) {
  const dimensions = [
    ["bundleId", (item) => item.bundleId],
    ["caseId", (item) => item.safeDescriptor?.caseId ?? item.safeDescriptor?.id],
    ["radarEpisodeId", (item) => item.safeDescriptor?.radarEpisodeId],
  ];
  for (const [label, selector] of dimensions) {
    const values = bundles.map((item) => selector(requireRecord(item, "bundle")));
    if (values.some((value) => typeof value !== "string" || !value)) {
      throw new Error(`Corpus contains a bundle without ${label}`);
    }
    if (new Set(values).size !== values.length) throw new Error(`Corpus contains duplicate ${label}`);
  }
}

async function loadCoreCase(bundle, anchors, materializationInput) {
  return core.loadMaterializedReplayCase({
    manifest: bundle.replayCaseManifest,
    sessionConfig: bundle.replaySessionConfig,
    historicalDataAdapter: new core.JsonReplayHistoricalDataAdapter(materializationInput.historicalData),
    analysisDataAdapter: new core.JsonReplayAnalysisDataAdapter(materializationInput.analysisData),
    strategyProfile: bundle.strategyProfile,
    radarSelectionProfile: bundle.radarSelectionProfile,
    venueRules: venueRiskRules(bundle),
    analysisProfile: bundle.replayAnalysisProfile,
    avwapAnchors: anchors,
  });
}

function boundedMaterializationInput(bundle) {
  const manifest = requireRecord(bundle.replayCaseManifest, "replayCaseManifest");
  const config = requireRecord(bundle.replaySessionConfig, "replaySessionConfig");
  const strategy = requireRecord(bundle.strategyProfile, "strategyProfile");
  const roles = requireRecord(strategy.timeframeRoles, "strategyProfile.timeframeRoles");
  const contextTimeframes = requireArray(
    roles.contextTimeframes,
    "strategyProfile.timeframeRoles.contextTimeframes",
  );
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = requireRecord(analysis.target, "replayAnalysisData.target");
  const reference = requireRecord(analysis.reference, "replayAnalysisData.reference");
  const historical = requireRecord(bundle.replayFutureData.historicalData, "historicalData");
  const horizon = manifest.startAsOf + config.maximumCaseDuration;
  const starts = Object.fromEntries(bundle.replayAnalysisProfile.evaluatedTimeframes.map((timeframe) => {
    const declared = requireArray(manifest.preRollRequirements ?? [], "preRollRequirements")
      .filter((item) => item.timeframe === timeframe)
      .reduce((maximum, item) => Math.max(
        maximum,
        Number(item.minimumDurationSeconds ?? 0),
        Number(item.minimumBars ?? 0) * timeframeSeconds(timeframe),
      ), 0);
    const roleDuration = timeframe === roles.candidateTimeframe
      ? 180 * 86_400
      : timeframe === roles.structureTimeframe || contextTimeframes.includes(timeframe)
        ? 90 * 86_400
        : timeframeSeconds(timeframe) * 250;
    return [timeframe, Math.max(0, manifest.startAsOf - Math.max(declared, roleDuration))];
  }));
  const select = (candles) => requireArray(candles, "materialization candles").filter((candle) => {
    const start = starts[candle.timeframe];
    return start != null && candle.openTime >= start - timeframeSeconds(candle.timeframe) &&
      candle.closeTime <= horizon;
  });
  const targetCandles = select(target.candles);
  const referenceCandles = select(reference.candles);
  const historicalCandles = select(historical.candles);
  return {
    analysisData: {
      ...analysis,
      target: {
        ...target,
        candles: targetCandles,
        candleRevisions: select(target.candleRevisions ?? []),
      },
      reference: {
        ...reference,
        candles: referenceCandles,
        candleRevisions: select(reference.candleRevisions ?? []),
      },
    },
    historicalData: {
      ...historical,
      candles: historicalCandles,
      candleRevisions: select(historical.candleRevisions ?? []),
    },
    coverage: {
      policy: "strategy-required pre-roll through replay horizon",
      startByTimeframe: starts,
      horizonAsOf: horizon,
      target: compactSeriesCoverage(targetCandles),
      reference: compactSeriesCoverage(referenceCandles),
      historical: compactSeriesCoverage(historicalCandles),
    },
  };
}

async function startCoreSession(loaded, idSuffix) {
  let session = core.createReplaySession(loaded);
  const result = await core.applyReplayCommand(
    loaded,
    session,
    core.createReplayCommand(session, {
      id: `real-corpus-audit:start:${idSuffix}`,
      type: "StartSession",
    }),
  );
  session = result.session;
  const frame = currentFrame(session);
  return { session, frame };
}

async function probeLifecycleTransitions(loaded, initialSession, maximum, caseIndex) {
  let session = initialSession;
  let previousState = currentFrame(session).lifecycleState;
  const transitions = [];
  for (let index = 0; index < maximum && session.state === "Active"; index += 1) {
    const result = await probeCondition(
      loaded,
      session,
      { key: `lifecycle-transition-${index + 1}`, condition: { type: "NextLifecycleTransition" } },
      caseIndex,
      true,
    );
    session = result.session;
    if (result.status !== "triggered") break;
    const frame = currentFrame(session);
    transitions.push({
      fromState: previousState,
      toState: frame.lifecycleState,
      effectiveAsOf: result.effectiveAsOf,
      triggeringEventIds: result.triggeringEventIds,
      wakeResultId: result.wakeResultId,
    });
    previousState = frame.lifecycleState;
  }
  return transitions;
}

async function probeCondition(loaded, initialSession, probe, caseIndex, includeSession = false) {
  let session = initialSession;
  let chunks = 0;
  let pointsChecked = 0;
  let firstPoint = null;
  let lastPoint = null;
  const wakeReasons = {};
  while (session.state === "Active") {
    if (++chunks > 10_000) throw new Error(`Audit probe ${probe.key} exceeded its deterministic bound`);
    const frame = currentFrame(session);
    const horizon = loaded.manifest.startAsOf + loaded.sessionConfig.maximumCaseDuration;
    const deadline = Math.min(
      horizon,
      frame.effectiveAsOf + loaded.sessionConfig.maximumSingleWaitDuration,
    );
    if (deadline <= frame.effectiveAsOf) break;
    const wakePlan = core.createReplayWakePlan({
      submittedFrameId: frame.id,
      createdAt: frame.effectiveAsOf,
      conditions: [probe.condition],
      deadlineAsOf: deadline,
    });
    let result;
    try {
      result = await core.applyReplayCommand(
        loaded,
        session,
        core.createReplayCommand(session, {
          id: `real-corpus-audit:${caseIndex}:${probe.key}:${chunks}`,
          type: "Wait",
          payload: { reason: "other", thesis: "Causal audit probe", wakePlan },
        }),
      );
    } catch (error) {
      return {
        key: probe.key,
        condition: clone(probe.condition),
        status: "not-applicable-at-initial-frame",
        reason: error instanceof Error ? error.message : String(error),
        effectiveAsOf: null,
        wakeResultId: null,
        triggeringEventIds: [],
        evaluation: { chunks, pointsChecked, firstPoint, lastPoint, wakeReasons },
        ...(includeSession ? { session } : {}),
      };
    }
    session = result.session;
    const wake = result.event.wakeResult;
    if (!wake) throw new Error(`Audit probe ${probe.key} produced no wake result`);
    wakeReasons[wake.reason] = (wakeReasons[wake.reason] ?? 0) + 1;
    pointsChecked += wake.auditTrace.evaluationPointsChecked.length;
    firstPoint ??= wake.auditTrace.evaluationPointsChecked[0] ?? null;
    lastPoint = wake.auditTrace.evaluationPointsChecked.at(-1) ?? lastPoint;
    if (wake.reason === "CONDITION_TRIGGERED") {
      return {
        key: probe.key,
        condition: clone(probe.condition),
        status: "triggered",
        reason: wake.reason,
        effectiveAsOf: wake.effectiveAsOf,
        wakeResultId: wake.id,
        triggeringEventIds: [...wake.triggeringEventIds],
        evaluation: { chunks, pointsChecked, firstPoint, lastPoint, wakeReasons },
        ...(includeSession ? { session } : {}),
      };
    }
  }
  return {
    key: probe.key,
    condition: clone(probe.condition),
    status: "not-triggered-within-case",
    reason: session.terminalReason ?? "audit horizon reached",
    effectiveAsOf: session.currentAsOf,
    wakeResultId: null,
    triggeringEventIds: [],
    evaluation: { chunks, pointsChecked, firstPoint, lastPoint, wakeReasons },
    ...(includeSession ? { session } : {}),
  };
}

function conditionalProbeDefinitions(bundle, frame, anchors) {
  const probes = [
    { key: "next-lifecycle-transition", condition: { type: "NextLifecycleTransition" } },
    { key: "radar-or-lifecycle-terminal", condition: { type: "RadarOrLifecycleTerminal" } },
    {
      key: "any-lifecycle-transition-or-terminal",
      condition: {
        type: "AnyOf",
        conditions: [
          { type: "NextLifecycleTransition" },
          { type: "RadarOrLifecycleTerminal" },
        ],
      },
    },
  ];
  for (const state of [
    "notCandidate",
    "developing",
    "deteriorating",
    "waitingForRetest",
    "entryCandidate",
    "invalidated",
    "expired",
  ]) {
    if (state !== frame.lifecycleState) {
      probes.push({
        key: `lifecycle-state-${state}`,
        condition: { type: "LifecycleStateEntered", state },
      });
    }
  }
  for (const timeframe of [...bundle.replayAnalysisProfile.evaluatedTimeframes].sort()) {
    for (const eventType of ["BOS", "Shift"]) {
      probes.push({
        key: `structure-${timeframe}-${eventType.toLowerCase()}-bearish`,
        condition: { type: "StructureEventConfirmed", timeframe, eventType, direction: "bearish" },
      });
    }
  }
  const rsTimeframe = bundle.replayAnalysisProfile.relativeStrengthConfig?.timeframe ?? null;
  for (const eventType of ["divergence", "lead", "break"]) {
    probes.push({
      key: `relative-strength-${eventType}`,
      condition: { type: "RelativeStrengthEventConfirmed", timeframe: rsTimeframe, eventType },
    });
  }
  for (const anchor of anchors) {
    for (const eventType of ["loss", "reclaim", "failedReclaim"]) {
      probes.push({
        key: `avwap-${anchor.id}-${eventType}`,
        condition: { type: "AvwapEventConfirmed", avwapId: anchor.id, eventType },
      });
    }
  }
  const level = [...frame.decisionSnapshot.activeStructureLevels]
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  if (level) {
    for (const direction of ["above", "below"]) {
      probes.push({
        key: `price-cross-${direction}-${level.id}`,
        condition: {
          type: "PriceCrossesKnownLevel",
          timeframe: level.sourceTimeframe ?? frame.evaluationTimeframe,
          direction,
          referenceId: level.id,
          frozenPrice: level.price,
        },
      });
    }
  }
  const zone = [...frame.decisionSnapshot.supportResistanceZones]
    .filter((item) => item.rangeLow != null && item.rangeHigh != null)
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  if (zone) {
    probes.push({
      key: `price-enter-zone-${zone.id}`,
      condition: {
        type: "PriceEntersKnownZone",
        timeframe: zone.sourceTimeframe ?? frame.evaluationTimeframe,
        zoneObservationId: zone.sourceObject.observationId,
        frozenLowerBound: zone.rangeLow,
        frozenUpperBound: zone.rangeHigh,
      },
    });
  }
  return probes;
}

function preTriggerContext(bundle, detectedAt) {
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = requireRecord(analysis.target, "replayAnalysisData.target");
  const byTimeframe = groupCandles(requireArray(target.candles, "target candles"));
  return Object.fromEntries([...byTimeframe.entries()].sort(([left], [right]) => left.localeCompare(right)).map(
    ([timeframe, source]) => {
      const candles = source.filter((item) => item.closeTime <= detectedAt && item.knownAt <= detectedAt);
      const first = candles[0] ?? null;
      const latest = candles.at(-1) ?? null;
      return [timeframe, {
        completedCandleCount: candles.length,
        firstOpenTime: first?.openTime ?? null,
        latestCloseTime: latest?.closeTime ?? null,
        returnFromFirstClosePct: first && latest ? ((latest.c / first.c) - 1) * 100 : null,
        latestCompletedCandle: latest ? candleEvidence(latest) : null,
      }];
    },
  ));
}

function dataQualityEvidence(bundle, loaded, initialFrame, materializationInput) {
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = requireRecord(analysis.target, "replayAnalysisData.target");
  const reference = requireRecord(analysis.reference, "replayAnalysisData.reference");
  const execution = requireRecord(bundle.executionData ?? {}, "executionData");
  return {
    declaredStatus: bundle.safeDescriptor.dataQualityStatus ?? null,
    declaredNotes: clone(bundle.dataQualityNotes ?? []),
    replayLoaderNotes: clone(loaded.dataBundle.dataQualityNotes),
    initialFrameNotes: clone(initialFrame.dataQualityNotes),
    coreMaterializationInput: materializationInput.coverage,
    coverageChecks: coverageChecks(bundle, materializationInput),
    targetSeries: seriesValidation(requireArray(target.candles, "target candles")),
    referenceSeries: seriesValidation(requireArray(reference.candles, "reference candles")),
    executionSeries: seriesValidation(requireArray(execution.candles ?? [], "execution candles")),
    targetRevisionRecords: revisionValidation(target.candleRevisions ?? []),
    referenceRevisionRecords: revisionValidation(reference.candleRevisions ?? []),
    interpolationApplied: false,
  };
}

function coverageChecks(bundle, materializationInput) {
  const manifest = requireRecord(bundle.replayCaseManifest, "replayCaseManifest");
  const config = requireRecord(bundle.replaySessionConfig, "replaySessionConfig");
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = groupCandles(requireArray(analysis.target.candles, "target candles"));
  const reference = groupCandles(requireArray(analysis.reference.candles, "reference candles"));
  const horizon = manifest.startAsOf + config.maximumCaseDuration;
  return Object.fromEntries(bundle.replayAnalysisProfile.evaluatedTimeframes.map((timeframe) => {
    const targetSeries = target.get(timeframe) ?? [];
    const referenceSeries = reference.get(timeframe) ?? [];
    const requiredAnalysisStart = materializationInput.coverage.startByTimeframe[timeframe];
    const requiredDisplayStart = Math.max(
      0,
      manifest.startAsOf - Number(config.displayPreRollByTimeframe[timeframe] ?? 0),
    );
    const requiredCompletedThrough = Math.floor(horizon / timeframeSeconds(timeframe)) *
      timeframeSeconds(timeframe);
    return [timeframe, {
      requiredAnalysisStart,
      requiredDisplayStart,
      requiredHorizonAsOf: horizon,
      requiredCompletedThrough,
      targetAvailableStart: targetSeries[0]?.openTime ?? null,
      referenceAvailableStart: referenceSeries[0]?.openTime ?? null,
      targetCompletedThrough: targetSeries.at(-1)?.closeTime ?? null,
      referenceCompletedThrough: referenceSeries.at(-1)?.closeTime ?? null,
      targetAnalysisPreRollCovered: targetSeries[0]?.openTime <= requiredAnalysisStart,
      referenceAnalysisPreRollCovered: referenceSeries[0]?.openTime <= requiredAnalysisStart,
      targetDisplayPreRollCovered: targetSeries[0]?.openTime <= requiredDisplayStart,
      referenceDisplayPreRollCovered: referenceSeries[0]?.openTime <= requiredDisplayStart,
      targetFutureHorizonCovered: targetSeries.at(-1)?.closeTime >= requiredCompletedThrough,
      referenceFutureHorizonCovered: referenceSeries.at(-1)?.closeTime >= requiredCompletedThrough,
    }];
  }));
}

function sourceReferenceAlignment(bundle) {
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = requireRecord(analysis.target, "replayAnalysisData.target");
  const reference = requireRecord(analysis.reference, "replayAnalysisData.reference");
  const targetByTimeframe = groupCandles(requireArray(target.candles, "target candles"));
  const referenceByTimeframe = groupCandles(requireArray(reference.candles, "reference candles"));
  const timeframes = [...new Set([...targetByTimeframe.keys(), ...referenceByTimeframe.keys()])].sort();
  return {
    target: { symbol: target.symbol, source: target.source },
    reference: { symbol: reference.symbol, source: reference.source },
    expectedReference: clone(bundle.replayAnalysisProfile.referenceMarketPolicy),
    sourceConsistency: target.symbol === bundle.replayCaseManifest.symbol &&
      target.source === bundle.replayCaseManifest.source &&
      reference.symbol === bundle.replayAnalysisProfile.referenceMarketPolicy.symbol &&
      reference.source === (bundle.replayAnalysisProfile.referenceMarketPolicy.source ?? target.source),
    byTimeframe: Object.fromEntries(timeframes.map((timeframe) => {
      const targetTimes = new Set((targetByTimeframe.get(timeframe) ?? []).map((item) => item.closeTime));
      const referenceTimes = new Set((referenceByTimeframe.get(timeframe) ?? []).map((item) => item.closeTime));
      const mismatches = [...new Set([...targetTimes, ...referenceTimes])]
        .filter((time) => targetTimes.has(time) !== referenceTimes.has(time))
        .sort((left, right) => left - right);
      return [timeframe, {
        targetCompletedCount: targetTimes.size,
        referenceCompletedCount: referenceTimes.size,
        mismatchCount: mismatches.length,
        firstMismatchAt: mismatches[0] ?? null,
        exactCompletedCloseAlignment: mismatches.length === 0,
      }];
    })),
  };
}

function executionEvidence(bundle, detectedAt) {
  const provenance = requireRecord(bundle.provenance, "provenance");
  const execution = requireRecord(bundle.executionData ?? {}, "executionData");
  const candles = requireArray(execution.candles ?? [], "execution candles");
  const byTimeframe = groupCandles(candles);
  const resolution = [...byTimeframe.keys()].sort((left, right) =>
    timeframeSeconds(left) - timeframeSeconds(right))[0] ?? null;
  const resolutionCandles = resolution ? byTimeframe.get(resolution) ?? [] : [];
  const horizon = requireRecord(bundle.replayFutureData, "replayFutureData").horizonAsOf;
  return {
    analysisSource: provenance.analysisSource ?? bundle.safeDescriptor.source,
    referenceSource: provenance.referenceSource ?? null,
    executionPriceDataSource: provenance.executionPriceDataSource ?? execution.venue ?? null,
    intendedExecutionVenue: provenance.intendedExecutionVenue ?? null,
    executionSimulationMode: provenance.executionSimulationMode ?? null,
    proxyAssumption: provenance.proxyAssumption ?? null,
    feeAssumptionStatus: bundle.feeSchedule?.assumptionStatus ?? null,
    venueRuleAssumptionStatus: bundle.venueExecutionRules?.assumptionStatus ?? null,
    funding: clone(execution.funding ?? { availability: "unavailable" }),
    finerResolution: {
      timeframe: resolution,
      candleCount: resolutionCandles.length,
      startsAt: resolutionCandles[0]?.openTime ?? null,
      completedThrough: resolutionCandles.at(-1)?.closeTime ?? null,
      coversDecisionToHorizon: resolutionCandles[0]?.openTime <= detectedAt &&
        resolutionCandles.at(-1)?.closeTime >= horizon,
    },
    ambiguityResolution: {
      status: "not-evaluated-without-finalized-trade-plan",
      resolved: null,
      explanation: "Finer data availability is derivable; order-path ambiguity is not",
    },
  };
}

function futureIndependenceEvidence(
  bundle,
  episode,
  originalCausalPrefixFingerprint,
  originalFrame,
) {
  const checks = {
    manifestStartMatchesDetectedAt:
      bundle.replayCaseManifest.startAsOf === episode.detectedAt &&
      bundle.replayCaseManifest.detectedAt === episode.detectedAt,
    triggerObservationsKnownByDetection: episode.triggeringObservations.every((item) =>
      item.knownAt <= episode.detectedAt && item.effectiveAsOf <= episode.detectedAt),
    manifestFutureOutcomeRefIsNull: bundle.replayCaseManifest.futureOutcomeRef == null,
    safeDescriptorHasNoFutureFields: findForbiddenKeys(bundle.safeDescriptor).length === 0,
    initialFrameContainsCompletedKnownCandlesOnly: Object.values(originalFrame.visibleCandlesByTimeframe)
      .flat()
      .every((item) => item.closeTime <= originalFrame.effectiveAsOf && item.knownAt <= originalFrame.effectiveAsOf),
  };
  const counterfactualEvidence = counterfactualCausalInputEvidence(bundle, episode);
  const pass = Object.values(checks).every(Boolean) &&
    (counterfactualEvidence.status !== "performed" || (
      counterfactualEvidence.causalSelectionInputFingerprintEqual &&
      counterfactualEvidence.futureMutationWitness.differs
    ));
  return {
    status: pass ? "structural-and-counterfactual-checks-passed" : "failed",
    checks,
    forbiddenSafeDescriptorKeys: findForbiddenKeys(bundle.safeDescriptor),
    counterfactual: counterfactualEvidence,
    coreCausalPrefixFingerprint: originalCausalPrefixFingerprint,
    coreInitialDecisionSnapshotId: originalFrame.decisionSnapshot.id,
    limitation:
      "The counterfactual checks selection inputs, not a second full analysis materialization; point-in-time universe and candle revision history remain unproved",
  };
}

function counterfactualCausalInputEvidence(bundle, episode) {
  const detectedAt = episode.detectedAt;
  const analysis = requireRecord(bundle.replayAnalysisData, "replayAnalysisData");
  const target = requireRecord(analysis.target, "replayAnalysisData.target");
  const reference = requireRecord(analysis.reference, "replayAnalysisData.reference");
  const historical = requireRecord(bundle.replayFutureData.historicalData, "historicalData");
  const targetCandles = requireArray(target.candles, "target candles");
  const referenceCandles = requireArray(reference.candles, "reference candles");
  const historicalCandles = requireArray(historical.candles, "historical candles");
  const allMutableRecords = [...targetCandles, ...historicalCandles];
  const futureRecords = allMutableRecords.filter((candle) => candle.closeTime > detectedAt);
  if (futureRecords.length === 0) {
    return {
      status: "not-performed-no-post-detection-candles",
      changedCandleRecordCount: 0,
      causalSelectionInputFingerprintEqual: null,
      futureMutationWitness: { differs: null },
    };
  }

  const originalInput = selectionCausalInput(
    targetCandles,
    referenceCandles,
    episode,
    detectedAt,
    false,
  );
  const counterfactualInput = selectionCausalInput(
    targetCandles,
    referenceCandles,
    episode,
    detectedAt,
    true,
  );
  const witness = futureRecords[0];
  const changedWitness = counterfactualCandle(witness);
  const originalFingerprint = core.canonicalHash(originalInput);
  const changedFingerprint = core.canonicalHash(counterfactualInput);
  return {
    status: "performed",
    mutation: "multiply strictly post-detection OHLC by 1.000001",
    changedCandleRecordCount: futureRecords.length,
    firstChangedRecord: {
      observationId: witness.observationId,
      timeframe: witness.timeframe,
      closeTime: witness.closeTime,
    },
    causalSelectionInputFingerprint: originalFingerprint,
    counterfactualCausalSelectionInputFingerprint: changedFingerprint,
    causalSelectionInputFingerprintEqual: originalFingerprint === changedFingerprint,
    futureMutationWitness: {
      originalFingerprint: core.canonicalHash(witness),
      counterfactualFingerprint: core.canonicalHash(changedWitness),
      differs: core.canonicalSerialize(witness) !== core.canonicalSerialize(changedWitness),
    },
  };
}

function selectionCausalInput(target, reference, episode, detectedAt, mutateFuture) {
  const select = (candles) => candles
    .map((candle) => mutateFuture && candle.closeTime > detectedAt
      ? counterfactualCandle(candle)
      : candle)
    .filter((candle) => candle.closeTime <= detectedAt && candle.knownAt <= detectedAt);
  return {
    detectedAt,
    radarEpisode: episode,
    targetCandles: select(target),
    referenceCandles: select(reference),
  };
}

function counterfactualCandle(candle) {
  const multiplier = 1.000001;
  return {
    ...candle,
    o: candle.o * multiplier,
    h: candle.h * multiplier,
    l: candle.l * multiplier,
    c: candle.c * multiplier,
  };
}

function seriesValidation(candles) {
  const groups = groupCandles(candles, false);
  return Object.fromEntries([...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(
    ([timeframe, source]) => {
      const ordered = [...source].sort((left, right) => left.openTime - right.openTime);
      const seconds = timeframeSeconds(timeframe);
      let duplicateOpenTimes = 0;
      let duplicateLogicalIds = 0;
      let duplicateObservationIds = 0;
      let nonMonotonicSourceRecords = 0;
      let gapSegments = 0;
      let missingIntervals = 0;
      let invalidTimeFields = 0;
      let invalidIntervalBoundaries = 0;
      let knownBeforeClose = 0;
      let invalidOhlc = 0;
      let negativeVolume = 0;
      let prior = null;
      const sourcePriorByTimeframe = new Map();
      for (const candle of source) {
        const sourcePrior = sourcePriorByTimeframe.get(timeframe);
        if (sourcePrior != null && candle.openTime <= sourcePrior) nonMonotonicSourceRecords += 1;
        sourcePriorByTimeframe.set(timeframe, candle.openTime);
      }
      const seenOpenTimes = new Set();
      const seenLogicalIds = new Set();
      const seenObservationIds = new Set();
      for (const candle of ordered) {
        if (seenOpenTimes.has(candle.openTime)) duplicateOpenTimes += 1;
        seenOpenTimes.add(candle.openTime);
        if (candle.logicalCandleId != null) {
          if (seenLogicalIds.has(candle.logicalCandleId)) duplicateLogicalIds += 1;
          seenLogicalIds.add(candle.logicalCandleId);
        }
        if (candle.observationId != null) {
          if (seenObservationIds.has(candle.observationId)) duplicateObservationIds += 1;
          seenObservationIds.add(candle.observationId);
        }
        if (!Number.isSafeInteger(candle.openTime) || !Number.isSafeInteger(candle.closeTime)) {
          invalidTimeFields += 1;
        } else if (candle.openTime % seconds !== 0 || candle.closeTime !== candle.openTime + seconds) {
          invalidIntervalBoundaries += 1;
        }
        if (!Number.isFinite(candle.knownAt) || candle.knownAt < candle.closeTime) knownBeforeClose += 1;
        if (prior != null && candle.openTime > prior + seconds) {
          gapSegments += 1;
          missingIntervals += Math.max(1, Math.round((candle.openTime - prior) / seconds) - 1);
        }
        prior = candle.openTime;
        if (
          ![candle.o, candle.h, candle.l, candle.c].every((value) => Number.isFinite(value) && value > 0) ||
          candle.h < Math.max(candle.o, candle.c) ||
          candle.l > Math.min(candle.o, candle.c)
        ) invalidOhlc += 1;
        if ([candle.vBase, candle.vQuote].some((value) => value != null && (!Number.isFinite(value) || value < 0))) {
          negativeVolume += 1;
        }
      }
      return [timeframe, {
        candleCount: ordered.length,
        duplicateOpenTimeCount: duplicateOpenTimes,
        duplicateLogicalIdCount: duplicateLogicalIds,
        duplicateObservationIdCount: duplicateObservationIds,
        nonMonotonicSourceRecordCount: nonMonotonicSourceRecords,
        gapSegmentCount: gapSegments,
        missingIntervalCount: missingIntervals,
        invalidTimeFieldCount: invalidTimeFields,
        invalidIntervalBoundaryCount: invalidIntervalBoundaries,
        knownBeforeCloseCount: knownBeforeClose,
        invalidOhlcCount: invalidOhlc,
        negativeVolumeCount: negativeVolume,
      }];
    },
  ));
}

function revisionValidation(revisions) {
  const records = requireArray(revisions, "candle revisions");
  const activeIdentities = new Set();
  const observationIds = new Set();
  let duplicateActiveRevisionCount = 0;
  let duplicateObservationIdCount = 0;
  for (const revision of records) {
    const identity = `${revision.logicalCandleId ?? "unknown"}:${revision.revision ?? "unknown"}`;
    if (activeIdentities.has(identity)) duplicateActiveRevisionCount += 1;
    activeIdentities.add(identity);
    if (revision.observationId != null) {
      if (observationIds.has(revision.observationId)) duplicateObservationIdCount += 1;
      observationIds.add(revision.observationId);
    }
  }
  return {
    recordCount: records.length,
    duplicateActiveRevisionCount,
    duplicateObservationIdCount,
  };
}

function automaticAvwapAnchors(bundle, historical, episode) {
  const selection = episode.selectionAnchor;
  if (!selection?.sourceObservationId) return [];
  const candle = requireArray(historical.candles, "historical candles")
    .find((item) => item.observationId === selection.sourceObservationId);
  if (!candle) return [];
  return [core.createAvwapAnchorSpec({
    id: `radar-anchor:${episode.id}`,
    type: "radarSelection",
    symbol: bundle.safeDescriptor.symbol,
    source: bundle.safeDescriptor.source,
    timeframe: candle.timeframe,
    anchorCandleLogicalId: candle.logicalCandleId,
    anchorCandleObservationId: candle.observationId,
    anchorTime: candle.openTime,
    priceBasis: "typical",
    volumeBasis: "baseThenQuote",
    selectedAt: episode.detectedAt,
    knownAt: candle.knownAt,
    provenance: "Radar selection anchor",
  })];
}

function venueRiskRules(bundle) {
  const raw = bundle.venueExecutionRules;
  const fee = bundle.feeSchedule ?? raw?.feeSchedule ?? {};
  if (!raw?.venue || !raw?.symbol || !raw?.priceTick || !raw?.quantityStep) return null;
  return {
    venue: String(raw.venue),
    symbol: String(raw.symbol),
    quantityStep: Number(raw.quantityStep),
    priceTick: Number(raw.priceTick),
    minQuantity: Number(raw.minimumQuantity ?? raw.minQuantity ?? raw.quantityStep),
    minNotional: Number(raw.minimumNotional ?? raw.minNotional ?? 1),
    maxLeverage: Number(raw.maximumLeverage ?? raw.maxLeverage ?? 10),
    leverageStep: Number(raw.leverageStep ?? 1),
    feeSchedule: {
      makerRate: Number(fee.makerRate ?? 0),
      takerRate: Number(fee.takerRate ?? 0),
      version: String(fee.version ?? "unavailable"),
    },
    maintenanceMarginModel: null,
    liquidationModel: null,
  };
}

function findEpisode(bundle, historical) {
  const episodes = requireArray(historical.radarEpisodes, "historicalData.radarEpisodes");
  const episode = episodes.find((item) => item.id === bundle.safeDescriptor.radarEpisodeId);
  if (!episode) throw new Error(`Bundle ${bundle.bundleId} has no matching RadarEpisode`);
  return requireRecord(episode, "RadarEpisode");
}

function groupCandles(candles, sort = true) {
  const result = new Map();
  for (const value of candles) {
    const candle = requireRecord(value, "candle");
    const timeframe = requireText(candle.timeframe, "candle.timeframe");
    if (!result.has(timeframe)) result.set(timeframe, []);
    result.get(timeframe).push(candle);
  }
  if (sort) {
    for (const values of result.values()) values.sort((left, right) => left.openTime - right.openTime);
  }
  return result;
}

function compactSeriesCoverage(candles) {
  return Object.fromEntries([...groupCandles(candles).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([timeframe, source]) => [timeframe, {
      candleCount: source.length,
      earliestOpenTime: source[0]?.openTime ?? null,
      completedThrough: source.at(-1)?.closeTime ?? null,
    }]));
}

function candleEvidence(candle) {
  return {
    observationId: candle.observationId,
    openTime: candle.openTime,
    closeTime: candle.closeTime,
    knownAt: candle.knownAt,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    vBase: candle.vBase ?? null,
    vQuote: candle.vQuote ?? null,
  };
}

function currentFrame(session) {
  const frame = session.frames.find((item) => item.id === session.currentFrameId);
  if (!frame) throw new Error("Replay audit session has no current frame");
  return frame;
}

function findForbiddenKeys(value, path = "safeDescriptor", result = []) {
  if (!value || typeof value !== "object") return result;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`, result));
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_SAFE_DESCRIPTOR_KEYS.has(key.toLowerCase())) result.push(`${path}.${key}`);
    findForbiddenKeys(child, `${path}.${key}`, result);
  }
  return result.sort();
}

function timeframeSeconds(timeframe) {
  const match = /^(\d+)(m|h|d)$/i.exec(String(timeframe));
  if (!match) throw new Error(`Unsupported audit timeframe ${timeframe}`);
  return Number(match[1]) * { m: 60, h: 3_600, d: 86_400 }[match[2].toLowerCase()];
}

function requireCoreExports() {
  const missing = REQUIRED_CORE_EXPORTS.filter((name) => core[name] == null);
  if (missing.length) throw new Error(`Shared core is missing audit exports: ${missing.join(", ")}`);
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

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be non-empty text`);
  return value;
}

function topLevelString(trailer, key) {
  const match = new RegExp(`"${key}"\\s*:\\s*("(?:\\\\.|[^"\\\\])*")`).exec(trailer);
  if (!match) throw new Error(`Imported corpus has no top-level ${key}`);
  return requireText(JSON.parse(match[1]), key);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function printUsage() {
  process.stdout.write(
    "Usage: node scripts/audit-real-trainer-corpus.mjs --input <private/trainer-imported-corpus.json> [--output <audit.json>] [--count <at-least-6>]\n",
  );
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) printUsage();
    else await runAudit(options);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
