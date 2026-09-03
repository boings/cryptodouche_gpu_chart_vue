import type { ReplayDataBundle, ReplayLoadedCase } from "./replay";

export interface ReplayPrivilegedDataBundle extends ReplayDataBundle {
  internalBundleFingerprint: string;
}

const privilegedBundles = new WeakMap<ReplayLoadedCase, ReplayPrivilegedDataBundle>();

export function registerReplayPrivilegedDataBundle(
  loaded: ReplayLoadedCase,
  bundle: ReplayPrivilegedDataBundle,
) {
  privilegedBundles.set(loaded, bundle);
}

export function replayPrivilegedDataBundle(
  loaded: ReplayLoadedCase,
): ReplayPrivilegedDataBundle {
  const bundle = privilegedBundles.get(loaded);
  if (!bundle) {
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  }
  return bundle;
}
