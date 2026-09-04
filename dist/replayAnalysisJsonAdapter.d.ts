import { type ReplayCandleQuery, type ReplayCandleRecord, type ReplayCoverageQuery, type ReplayDataCoverage } from "./replay";
export declare const REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION: "replay-analysis-data.1";
export interface ReplayAnalysisJsonCandleSeries {
    symbol: string;
    source: string;
    candles: ReplayCandleRecord[];
    candleRevisions: ReplayCandleRecord[];
    revisionHistoryAvailable: boolean;
}
export interface ReplayAnalysisJsonDataFixture {
    schemaVersion: typeof REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION;
    target: ReplayAnalysisJsonCandleSeries;
    reference: ReplayAnalysisJsonCandleSeries;
}
export interface ReplayAnalysisDataAdapter {
    getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    coverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    loadCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadReferenceCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadReferenceCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
}
/**
 * Parses the portable raw-data boundary used by replay-engine.2. File I/O remains
 * outside this module so the adapter can be used in browsers and headless tools.
 */
export declare function parseReplayAnalysisJsonDataFixture(input: unknown): ReplayAnalysisJsonDataFixture;
export declare class JsonReplayAnalysisDataAdapter implements ReplayAnalysisDataAdapter {
    #private;
    constructor(input: unknown);
    getCoverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    coverage(query: ReplayCoverageQuery): Promise<ReplayDataCoverage>;
    loadCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadReferenceCandles(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
    loadReferenceCandleRevisions(query: ReplayCandleQuery): Promise<ReplayCandleRecord[]>;
}
export declare class InMemoryReplayAnalysisDataAdapter extends JsonReplayAnalysisDataAdapter {
    constructor(input: ReplayAnalysisJsonDataFixture);
}
