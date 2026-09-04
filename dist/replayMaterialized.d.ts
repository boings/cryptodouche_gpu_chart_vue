import type { ImpulseFadeTimelineConfig } from "./indicators";
import { REPLAY_MATERIALIZED_ENGINE_VERSION, type LoadReplayCaseInput, type ReplayAnalysisStateObservation, type ReplayKnownEvent, type ReplayLoadedCase, type ReplaySessionConfig, type ReplaySessionConfigDefinition } from "./replay";
import { type AvwapAnchorSpec, type ReplayAnalysisProfile, type ReplayAnalysisState } from "./replayAnalysis";
import type { ReplayAnalysisDataAdapter } from "./replayAnalysisJsonAdapter";
import type { StrategyProfile } from "./strategy";
export interface LoadMaterializedReplayCaseInput extends Omit<LoadReplayCaseInput, "sessionConfig" | "materializedAnalysisBinding"> {
    sessionConfig: ReplaySessionConfig;
    analysisDataAdapter: ReplayAnalysisDataAdapter;
    analysisProfile: ReplayAnalysisProfile;
    avwapAnchors?: AvwapAnchorSpec[];
    lifecycleConfig?: ImpulseFadeTimelineConfig;
}
export declare function createMaterializedReplaySessionConfig(definition: Omit<ReplaySessionConfigDefinition, "replayEngineVersion"> & {
    replayEngineVersion?: typeof REPLAY_MATERIALIZED_ENGINE_VERSION;
}, strategyProfile: StrategyProfile): ReplaySessionConfig;
export declare function loadMaterializedReplayCase(input: LoadMaterializedReplayCaseInput): Promise<ReplayLoadedCase>;
export declare function materializedStateToReplayObservation(state: ReplayAnalysisState): ReplayAnalysisStateObservation;
export declare function materializedAnalysisKnownEvents(states: ReplayAnalysisState[]): ReplayKnownEvent[];
