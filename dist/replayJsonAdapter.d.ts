import { type ExecutionVenueEligibilityObservation, type RadarEpisode, type UniverseMembershipObservation } from "./radar";
import { type ReplayAnalysisStateObservation, type ReplayCandleQuery, type ReplayCandleRecord, type ReplayCoverageQuery, type ReplayDataCoverage, type ReplayEvidenceQuery, type ReplayHistoricalDataAdapter, type ReplayKnownEvent } from "./replay";
export declare const REPLAY_JSON_DATA_SCHEMA_VERSION: "replay-json-data.1";
export interface ReplayJsonHistoricalDataFixture {
    schemaVersion: typeof REPLAY_JSON_DATA_SCHEMA_VERSION;
    symbol: string;
    source: string;
    candles: ReplayCandleRecord[];
    candleRevisions: ReplayCandleRecord[];
    radarEpisodes: RadarEpisode[];
    analysisStateHistory: ReplayAnalysisStateObservation[];
    knownEvents: ReplayKnownEvent[];
    venueEvidence: ExecutionVenueEligibilityObservation[];
    universeEvidence: UniverseMembershipObservation[];
    revisionHistoryAvailable: boolean;
}
/**
 * Validates the complete JSON data sidecar before exposing any replay query.
 * File I/O stays in the Node CLI so this module remains browser-compatible.
 */
export declare function parseReplayJsonHistoricalDataFixture(input: unknown): ReplayJsonHistoricalDataFixture;
export declare class JsonReplayHistoricalDataAdapter implements ReplayHistoricalDataAdapter {
    #private;
    constructor(input: unknown);
    getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    loadCandleHistory(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadPointInTimeVenueEvidence(query: ReplayEvidenceQuery): Promise<ExecutionVenueEligibilityObservation[]>;
    loadPointInTimeUniverseEvidence(query: ReplayEvidenceQuery): Promise<UniverseMembershipObservation[]>;
    loadAnalysisStateHistory(query: ReplayEvidenceQuery): Promise<ReplayAnalysisStateObservation[]>;
    loadKnownEvents(query: ReplayEvidenceQuery): Promise<ReplayKnownEvent[]>;
    loadRadarEpisode(radarEpisodeId: string): Promise<RadarEpisode | null>;
}
