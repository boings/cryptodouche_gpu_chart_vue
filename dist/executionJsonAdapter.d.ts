import { type ExecutionCandleObservation, type ExecutionCandleQuery, type ExecutionDataQuery, type ExecutionQuoteObservation, type ExecutionTradeObservation, type FundingObservation, type ReplayExecutionDataAdapter, type VenueExecutionRules } from "./execution";
export declare const EXECUTION_JSON_DATA_SCHEMA_VERSION: "execution-json-data.1";
export interface ExecutionJsonHistoricalDataFixture {
    schemaVersion: typeof EXECUTION_JSON_DATA_SCHEMA_VERSION;
    venue: string;
    symbol: string;
    candles: ExecutionCandleObservation[];
    trades: ExecutionTradeObservation[];
    tradeDataCompleteness: "complete" | "partial" | "unavailable";
    quotes: ExecutionQuoteObservation[];
    quoteDataCompleteness: "complete" | "partial" | "unavailable";
    markPrices: ExecutionQuoteObservation[];
    indexPrices: ExecutionQuoteObservation[];
    funding: {
        availability: "available";
        observations: FundingObservation[];
    } | {
        availability: "unavailable";
        reason: string;
    };
    venueRuleEvidence: VenueExecutionRules[];
}
export declare function parseExecutionJsonHistoricalDataFixture(input: unknown): ExecutionJsonHistoricalDataFixture;
export declare class JsonReplayExecutionDataAdapter implements ReplayExecutionDataAdapter {
    #private;
    readonly fundingDataAvailable: boolean;
    readonly tradeDataCompleteness: "complete" | "partial" | "unavailable";
    readonly quoteDataCompleteness: "complete" | "partial" | "unavailable";
    constructor(input: unknown);
    getCoverage(query: ExecutionDataQuery): Promise<{
        [k: string]: {
            from: number;
            to: number;
            count: number;
        };
    }>;
    loadCandles(query: ExecutionCandleQuery): Promise<ExecutionCandleObservation[]>;
    loadTrades(query: ExecutionDataQuery): Promise<ExecutionTradeObservation[]>;
    loadQuotes(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadMarkPrices(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadIndexPrices(query: ExecutionDataQuery): Promise<ExecutionQuoteObservation[]>;
    loadFundingObservations(query: ExecutionDataQuery): Promise<FundingObservation[]>;
    loadVenueRuleEvidence(query: ExecutionDataQuery): Promise<VenueExecutionRules[]>;
}
