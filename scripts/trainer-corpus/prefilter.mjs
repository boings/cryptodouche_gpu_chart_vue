import { scanRadarEpisodes } from "../../dist/core.js";

const HOUR = 3_600;

export function prefilterRadarPoints(candles, profile) {
  const ordered = [...candles].sort((left, right) => left.bucket - right.bucket);
  const points = [];
  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    if (profile.moveDetectors.some((detector) => rawDetectorCouldPass(detector, ordered, index))) {
      points.push(current.bucket + HOUR);
    }
  }
  return points;
}

export function scanPrefilteredRadar(input, candidatePoints, options = {}) {
  if (candidatePoints.length === 0) return emptyLike(input);
  const points = [...new Set(candidatePoints)]
    .filter((point) => point >= input.from && point <= input.to)
    .sort((left, right) => left - right);
  if (points.length === 0) return emptyLike(input);
  const blocks = groupCandidatePoints(points, options.maximumGapSeconds ?? 6 * HOUR);
  const episodeMap = new Map();
  const manifestMap = new Map();
  const observationMap = new Map();
  const evaluationMap = new Map();
  const statusMap = new Map();
  for (const block of blocks) {
    const result = scanRadarEpisodes({ ...input, from: block[0], to: block.at(-1) });
    const accepted = new Set(block);
    for (const episode of result.episodes) {
      if (accepted.has(episode.detectedAt)) episodeMap.set(episode.id, episode);
    }
    for (const manifest of result.replayCaseManifests) {
      if (episodeMap.has(manifest.radarEpisodeId)) manifestMap.set(manifest.id, manifest);
    }
    for (const item of result.observations) observationMap.set(item.observationId, item);
    for (const item of result.gateEvaluations) evaluationMap.set(item.id, item);
    for (const item of result.episodeStatusObservations) statusMap.set(item.observationId, item);
  }
  return {
    schemaVersion: "radar-scan-result.1",
    selectionProfileRef: {
      id: input.selectionProfile.id,
      version: input.selectionProfile.version,
      canonicalConfigHash: input.selectionProfile.canonicalConfigHash,
    },
    from: input.from,
    to: input.to,
    observations: sorted(observationMap),
    gateEvaluations: sorted(evaluationMap),
    episodes: [...episodeMap.values()].sort(compareEpisodes),
    episodeStatusObservations: sorted(statusMap),
    replayCaseManifests: [...manifestMap.values()].sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function comparePrefilteredWithFullScan(input, candidatePoints) {
  const full = scanRadarEpisodes(input);
  const bounded = scanPrefilteredRadar(input, candidatePoints);
  const fullIds = full.episodes.map((item) => item.id).sort();
  const boundedIds = bounded.episodes.map((item) => item.id).sort();
  return {
    equal: JSON.stringify(fullIds) === JSON.stringify(boundedIds),
    fullEpisodeIds: fullIds,
    boundedEpisodeIds: boundedIds,
    missingFromBounded: fullIds.filter((id) => !boundedIds.includes(id)),
    extraInBounded: boundedIds.filter((id) => !fullIds.includes(id)),
  };
}

function rawDetectorCouldPass(detector, candles, currentIndex) {
  const current = candles[currentIndex];
  if (detector.type === "rollingTroughRunup") {
    const eligible = candles.slice(0, currentIndex + 1).filter((item) =>
      item.bucket >= current.bucket - detector.lookbackSeconds &&
      current.bucket - item.bucket <= detector.maximumTroughAgeSeconds);
    const trough = eligible.reduce((best, item) => !best || item.c < best.c ? item : best, null);
    return trough != null && percent(current.c, trough.c) + 1e-12 >= detector.minimumRunupPct;
  }
  if (detector.type === "elapsedWindowReturn") {
    const reference = latestAtOrBefore(candles, currentIndex, current.bucket - detector.windowSeconds);
    if (!reference) return false;
    const staleness = current.bucket - detector.windowSeconds - reference.bucket;
    return (detector.maximumReferenceStalenessSeconds == null || staleness <= detector.maximumReferenceStalenessSeconds) &&
      (detector.minimumReturnPct == null || percent(current.c, reference.c) + 1e-12 >= detector.minimumReturnPct);
  }
  if (detector.type === "maximumWindowReturn") {
    return detector.windowsSeconds.some((windowSeconds) => {
      const reference = latestAtOrBefore(candles, currentIndex, current.bucket - windowSeconds);
      if (!reference) return false;
      const staleness = current.bucket - windowSeconds - reference.bucket;
      return (detector.maximumReferenceStalenessSeconds == null || staleness <= detector.maximumReferenceStalenessSeconds) &&
        (detector.minimumReturnPct == null || percent(current.c, reference.c) + 1e-12 >= detector.minimumReturnPct);
    });
  }
  if (detector.type === "emaAtrDisplacement") {
    if (detector.analysisTimeframe !== "1h") return true;
    const required = Math.max(detector.minimumSampleCount, detector.emaPeriod, detector.atrPeriod);
    if (currentIndex + 1 < required) return false;
    const subset = candles.slice(0, currentIndex + 1);
    const ema = emaLast(subset, detector.emaPeriod);
    const atr = atrLast(subset, detector.atrPeriod);
    return atr > 0 && (current.c - ema) / atr + 1e-12 >= detector.minimumAtrDisplacement;
  }
  return true;
}

function latestAtOrBefore(candles, currentIndex, timestamp) {
  for (let index = currentIndex; index >= 0; index -= 1) {
    if (candles[index].bucket <= timestamp) return candles[index];
  }
  return null;
}

function percent(current, reference) {
  return reference > 0 ? (current / reference - 1) * 100 : Number.NEGATIVE_INFINITY;
}

function emaLast(candles, period) {
  const alpha = 2 / (period + 1);
  let value = candles.slice(0, period).reduce((sum, item) => sum + item.c, 0) / period;
  for (let index = period; index < candles.length; index += 1) value = candles[index].c * alpha + value * (1 - alpha);
  return value;
}

function atrLast(candles, period) {
  const ranges = candles.map((item, index) => {
    const priorClose = candles[index - 1]?.c ?? item.c;
    return Math.max(item.h - item.l, Math.abs(item.h - priorClose), Math.abs(item.l - priorClose));
  });
  let value = ranges.slice(0, period).reduce((sum, item) => sum + item, 0) / period;
  for (let index = period; index < ranges.length; index += 1) value = (value * (period - 1) + ranges[index]) / period;
  return value;
}

function groupCandidatePoints(points, maximumGapSeconds) {
  const blocks = [];
  for (const point of points) {
    const current = blocks.at(-1);
    if (!current || point - current.at(-1) > maximumGapSeconds) blocks.push([point]);
    else current.push(point);
  }
  return blocks;
}

function sorted(map) {
  return [...map.values()].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function compareEpisodes(left, right) {
  return left.detectedAt - right.detectedAt || left.symbol.localeCompare(right.symbol) || left.id.localeCompare(right.id);
}

function emptyLike(input) {
  return {
    schemaVersion: "radar-scan-result.1",
    selectionProfileRef: {
      id: input.selectionProfile.id,
      version: input.selectionProfile.version,
      canonicalConfigHash: input.selectionProfile.canonicalConfigHash,
    },
    from: input.from,
    to: input.to,
    observations: [],
    gateEvaluations: [],
    episodes: [],
    episodeStatusObservations: [],
    replayCaseManifests: [],
  };
}
