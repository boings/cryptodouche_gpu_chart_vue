import type { ReplayAnalysisStateObservation, ReplayDataBundle, ReplayKnownEvent, ReplayLoadedCase } from "./replay";
export interface ReplayPrivilegedDataBundle extends ReplayDataBundle {
    internalBundleFingerprint: string;
}
export interface ReplayTimelineMaterialization {
    analysisStateHistory: ReplayAnalysisStateObservation[];
    knownEvents: ReplayKnownEvent[];
}
export interface ReplayTimelineMaterializer {
    materializeThrough(asOf: number): Promise<ReplayTimelineMaterialization>;
}
export declare function registerReplayPrivilegedDataBundle(loaded: ReplayLoadedCase, bundle: ReplayPrivilegedDataBundle): void;
export declare function replayPrivilegedDataBundle(loaded: ReplayLoadedCase): ReplayPrivilegedDataBundle;
export declare function registerReplayTimelineMaterializer(loaded: ReplayLoadedCase, materializer: ReplayTimelineMaterializer): void;
export declare function ensureReplayAnalysisThrough(loaded: ReplayLoadedCase, asOf: number): Promise<void>;
