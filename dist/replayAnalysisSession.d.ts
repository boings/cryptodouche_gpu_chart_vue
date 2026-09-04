import type { ReplayAnalysisStateObservation } from "./replay";
import { MATERIALIZED_REPLAY_ENGINE_VERSION, REPLAY_ANALYSIS_ENGINE_VERSION, type AvwapAnchorSpec, type MaterializeReplayAnalysisInput, type ReplayAnalysisState } from "./replayAnalysis";
export declare const REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION: "replay-analysis-session.1";
export declare const REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION: "replay-analysis-session-event.1";
export interface ReplayAnalysisSessionEvent {
    schemaVersion: typeof REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION;
    id: string;
    sequence: number;
    kind: "materialized" | "invalidated";
    effectiveAsOf: number;
    analysisStateId: string | null;
    invalidatedStateIds: string[];
    sourceObservationIds: string[];
}
export interface ReplayAnalysisSession {
    schemaVersion: typeof REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION;
    id: string;
    replayEngineVersion: typeof MATERIALIZED_REPLAY_ENGINE_VERSION;
    analysisEngineVersion: typeof REPLAY_ANALYSIS_ENGINE_VERSION;
    revision: number;
    input: Omit<MaterializeReplayAnalysisInput, "asOf">;
    currentRequestedAsOf: number | null;
    currentEffectiveAsOf: number | null;
    states: ReplayAnalysisState[];
    events: ReplayAnalysisSessionEvent[];
    integrityHash: string;
}
export interface ReplayAnalysisSessionUpdates {
    candlesByTimeframe?: MaterializeReplayAnalysisInput["candlesByTimeframe"];
    referenceCandlesByTimeframe?: MaterializeReplayAnalysisInput["referenceCandlesByTimeframe"];
    avwapAnchors?: AvwapAnchorSpec[];
}
export interface ReplayAnalysisCoverageRequirement {
    component: string;
    timeframe: string;
    minimumSamples: number;
    minimumSeconds: number;
}
export interface ReplayAnalysisProvider<TState> {
    readonly replayEngineVersion: string;
    getRequiredCoverage(): ReplayAnalysisCoverageRequirement[];
    materializeAt(asOf: number): TState;
    advanceTo(asOf: number, updates?: ReplayAnalysisSessionUpdates): TState;
    serializeState(): string;
    resumeState(serialized: string): void;
}
export declare function createReplayAnalysisSession(input: Omit<MaterializeReplayAnalysisInput, "asOf">): ReplayAnalysisSession;
export declare function materializeReplayAnalysisAt(session: ReplayAnalysisSession, asOf: number): ReplayAnalysisState;
export declare function advanceReplayAnalysisTo(session: ReplayAnalysisSession, asOf: number, updates?: ReplayAnalysisSessionUpdates): ReplayAnalysisSession;
export declare function serializeReplayAnalysisSession(session: ReplayAnalysisSession): string;
export declare function deserializeReplayAnalysisSession(serialized: string): ReplayAnalysisSession;
export declare function validateReplayAnalysisSession(session: ReplayAnalysisSession): void;
export declare function replayAnalysisRequiredCoverage(input: Pick<MaterializeReplayAnalysisInput, "analysisProfile">): ReplayAnalysisCoverageRequirement[];
export declare class MaterializedReplayAnalysisProvider implements ReplayAnalysisProvider<ReplayAnalysisState> {
    #private;
    readonly replayEngineVersion: "replay-engine.2";
    constructor(session: ReplayAnalysisSession);
    getRequiredCoverage(): ReplayAnalysisCoverageRequirement[];
    materializeAt(asOf: number): ReplayAnalysisState;
    advanceTo(asOf: number, updates?: ReplayAnalysisSessionUpdates): ReplayAnalysisState;
    serializeState(): string;
    resumeState(serialized: string): void;
    snapshot(): ReplayAnalysisSession;
}
export declare class SuppliedObservationReplayAnalysisProvider implements ReplayAnalysisProvider<ReplayAnalysisStateObservation> {
    #private;
    readonly replayEngineVersion = "replay-engine.1";
    constructor(observations: ReplayAnalysisStateObservation[]);
    getRequiredCoverage(): never[];
    materializeAt(asOf: number): ReplayAnalysisStateObservation;
    advanceTo(asOf: number): ReplayAnalysisStateObservation;
    serializeState(): string;
    resumeState(serialized: string): void;
}
export declare function clearReplayAnalysisCache(): void;
export declare function replayAnalysisCacheSize(): number;
export declare function replayAnalysisCacheKey(input: MaterializeReplayAnalysisInput): string;
