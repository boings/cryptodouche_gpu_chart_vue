import type { ReplayDataBundle, ReplayLoadedCase } from "./replay";
export interface ReplayPrivilegedDataBundle extends ReplayDataBundle {
    internalBundleFingerprint: string;
}
export declare function registerReplayPrivilegedDataBundle(loaded: ReplayLoadedCase, bundle: ReplayPrivilegedDataBundle): void;
export declare function replayPrivilegedDataBundle(loaded: ReplayLoadedCase): ReplayPrivilegedDataBundle;
