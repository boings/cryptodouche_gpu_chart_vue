import type {
  ReplayAnalysisStateObservation,
  ReplayDataBundle,
  ReplayKnownEvent,
  ReplayLoadedCase,
} from "./replay";

export interface ReplayPrivilegedDataBundle extends ReplayDataBundle {
  internalBundleFingerprint: string;
}

const privilegedBundles = new WeakMap<ReplayLoadedCase, ReplayPrivilegedDataBundle>();
const timelineMaterializers = new WeakMap<ReplayLoadedCase, ReplayTimelineMaterializer>();

export interface ReplayTimelineMaterialization {
  analysisStateHistory: ReplayAnalysisStateObservation[];
  knownEvents: ReplayKnownEvent[];
}

export interface ReplayTimelineMaterializer {
  materializeThrough(asOf: number): Promise<ReplayTimelineMaterialization>;
}

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

export function registerReplayTimelineMaterializer(
  loaded: ReplayLoadedCase,
  materializer: ReplayTimelineMaterializer,
) {
  timelineMaterializers.set(loaded, materializer);
}

export async function ensureReplayAnalysisThrough(loaded: ReplayLoadedCase, asOf: number) {
  const materializer = timelineMaterializers.get(loaded);
  if (!materializer) return;
  const current = replayPrivilegedDataBundle(loaded);
  if ((current.analysisStateHistory.at(-1)?.knownAt ?? -Infinity) >= asOf) return;
  const timeline = await materializer.materializeThrough(asOf);
  registerReplayPrivilegedDataBundle(loaded, Object.freeze({
    ...current,
    analysisStateHistory: Object.freeze([...timeline.analysisStateHistory]),
    knownEvents: Object.freeze([...timeline.knownEvents]),
  }) as unknown as ReplayPrivilegedDataBundle);
}
