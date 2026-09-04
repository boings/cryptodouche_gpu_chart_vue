import { describe, expect, it } from "vitest";

import {
  TRAINER_CASE_BUNDLE_SCHEMA_VERSION,
  TRAINER_CORPUS_INDEX_SCHEMA_VERSION,
  TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION,
  TRAINER_REVIEW_RECORD_SCHEMA_VERSION,
  TRAINER_STUDY_RUN_SCHEMA_VERSION,
  createTrainerCorpusIndex,
  createTrainerPresentationProfile,
  createTrainerReviewRecord,
  redactTrainerSafeDescriptor,
  selectTrainerCases,
  type TrainerSafeCaseDescriptor,
} from "./trainer";

function descriptor(index: number, episode = `episode-${index}`): TrainerSafeCaseDescriptor {
  return {
    id: `case-${index}`,
    alias: `Case ${String(index).padStart(2, "0")}`,
    episodeAlias: `Episode ${index}`,
    replayCaseManifestId: `manifest-${index}`,
    radarEpisodeId: episode,
    radarSelectionProfileRef: { id: "radar", version: "1", hash: "hash-radar" },
    detectedAt: 1_700_000_000 + index,
    symbol: `COIN${index}USDT`,
    source: "bybit",
    scanTimeframe: "1h",
    triggerDetectorIds: [index % 2 ? "runup" : "displacement"],
    dataQualityStatus: "complete",
    venueEligibility: "eligible",
    selectionMetrics: { return24h: index * 2 },
    pathContextTags: [index % 2 ? "rebound" : "continuation"],
  };
}

describe("trainer contracts", () => {
  it("uses stable trainer schemas independent of the package version", () => {
    expect(TRAINER_CASE_BUNDLE_SCHEMA_VERSION).toBe("trainer-case-bundle.1");
    expect(TRAINER_STUDY_RUN_SCHEMA_VERSION).toBe("trainer-study-run.1");
    expect(TRAINER_REVIEW_RECORD_SCHEMA_VERSION).toBe("trainer-review-record.1");
    expect(TRAINER_CORPUS_INDEX_SCHEMA_VERSION).toBe("trainer-corpus-index.1");
  });

  it("selects deterministically without duplicate episodes", () => {
    const cases = [descriptor(1), descriptor(2), descriptor(3), descriptor(4, "episode-1")];
    const corpus = createTrainerCorpusIndex("demo", cases);
    const first = selectTrainerCases(corpus, "seed-a", 3);
    const second = selectTrainerCases(corpus, "seed-a", 3);

    expect(second.map((item) => item.id)).toEqual(first.map((item) => item.id));
    expect(new Set(first.map((item) => item.radarEpisodeId)).size).toBe(first.length);
  });

  it("filters only safe selection-time metadata", () => {
    const corpus = createTrainerCorpusIndex("demo", [descriptor(1), descriptor(2)]);
    expect(selectTrainerCases(corpus, "seed", 2, {
      triggerDetectorId: "runup",
      minimumSelectionMetric: { key: "return24h", value: 2 },
    }).map((item) => item.id)).toEqual(["case-1"]);
  });

  it("redacts identity in blind mode until reveal", () => {
    const hidden = redactTrainerSafeDescriptor(descriptor(1), true, false);
    expect(hidden.symbol).toBeNull();
    expect(hidden.source).toBeNull();
    expect(hidden.detectedAt).toBeNull();
    expect(JSON.stringify(hidden)).not.toContain("COIN1USDT");

    expect(redactTrainerSafeDescriptor(descriptor(1), true, true).symbol).toBe("COIN1USDT");
  });

  it("hashes presentation profiles and validates reviews", () => {
    const profile = createTrainerPresentationProfile({
      id: "pump-fade",
      version: "1",
      schemaVersion: TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION,
      layout: "four",
      paneTimeframes: ["15m", "1h", "4h", "1d"],
      blindModeDefaults: true,
      overlayPreset: "Pump Fade",
      showSymbol: false,
      showDate: false,
      showSource: false,
      showVenue: false,
      showAbsoluteClock: false,
      showRelativeClock: true,
      chartControlDefaults: {},
    });
    expect(profile.canonicalConfigHash).toMatch(/^fnv1a64:/);
    expect(() => createTrainerReviewRecord({
      id: "review",
      studyRunId: "study",
      trainerSessionId: "session",
      replayFrameId: "frame",
      reviewedAt: 1,
      decisionQualityRating: 6,
      tags: [],
    })).toThrow("1 through 5");
  });
});
