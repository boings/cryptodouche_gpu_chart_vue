# Radar Selection and Replay Manifests

## Status and scope

This document describes the framework-independent radar API implemented in
`src/radar.ts` and exported from `@cryptodouche/gpu-chart-vue/core`.

The radar answers a discovery question:

> At what first causal moment did an unusual upward move become interesting
> enough to place on the research radar?

It does not decide that an Impulse Fade setup exists, propose a trade, inspect
future outcomes, or change the semantics of `impulse_fade_v1.lifecycle.1`.
Visual replay controls, fills, P&L simulation, automatic threshold optimization,
and execution are outside this API.

The radar objects are immutable, JSON-serializable research artifacts. Canonical
serialization and stable hashes make repeated scans of identical cutoff-resolved
inputs deterministic.

## Domain boundaries

The discovery, setup, and planning layers are deliberately separate.

| Object | Question answered | What it does not mean |
| --- | --- | --- |
| `RadarSelectionProfile` | Which historical moves would have reached the radar? | That the move is a valid short setup |
| `RadarEpisode` | When did the configured radar gate first cross from false to true? | That an Impulse Fade candidate or trade exists |
| Impulse Fade lifecycle candidate | What setup state was causally supported at a cutoff? | That entry and risk rules are satisfied |
| `StrategyProfile` | What constitutes a compliant Impulse Fade trade? | That an episode should have entered the research corpus |
| `TradePlan` | How would a particular decision snapshot be entered, stopped, targeted, and sized? | An order, fill, or executed position |

A `RadarEpisode` may therefore begin while the lifecycle has no active candidate
or is only `Developing`. The episode records the lifecycle state known at
detection, when one exists, but lifecycle state does not determine radar
selection. Likewise, a later `EntryCandidate`, reversal, profitable short, or
invalidation cannot retroactively create or remove a radar case.

## Public API

The main constructors and evaluator are:

```ts
import {
  EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  canonicalRadarJson,
  createDurableObjectReference,
  createExecutionVenueEligibilityObservation,
  createRadarSelectionProfile,
  createRadarStructureObservation,
  createUniverseMembershipObservation,
  executionVenueEligibilityObservationId,
  radarSelectionProfileHash,
  radarStructureObservationId,
  scanRadarEpisodes,
  universeMembershipObservationId,
} from "@cryptodouche/gpu-chart-vue/core";
```

`scanRadarEpisodes(input)` is the pure entry point. Its `RadarScanInput` contains:

- symbol/source series with OHLCV grouped by timeframe;
- a `RadarSelectionProfile`;
- inclusive `from` and `to` Unix-second bounds;
- optional `StrategyProfile` identity for generated manifests;
- optional cutoff-safe lifecycle, universe-membership, execution-venue, and
  structure histories.

The returned `RadarScanResult` contains:

- every retained `RadarMetricObservation`;
- a `RadarGateEvaluation` at each in-range evaluation cutoff;
- detection-time `RadarEpisode` objects;
- append-only `RadarEpisodeStatusObservation` revisions;
- one `ReplayCaseManifest` for each detected episode.

The API also exports its profile, detector, observation, episode, manifest,
gate-result, path-context, series, scan-input, and scan-result interfaces. The
current schema identifiers are:

| Artifact | Schema identifier |
| --- | --- |
| Radar selection profile | `radar-selection-profile.1` |
| Radar metric observation | `radar-metric-observation.1` |
| Radar episode | `radar-episode.1` |
| Radar episode status | `radar-episode-status.1` |
| Radar scan result | `radar-scan-result.1` |
| Replay case manifest | `replay-case-manifest.1` |
| Execution-venue eligibility | `execution-venue-eligibility.1` |
| Structure observation | `radar-structure-observation.1` |
| Universe membership | `radar-universe-membership.1` |

`canonicalRadarJson(value)` exposes the canonical JSON representation used for
deterministic audit output. The `*ObservationId` helpers recompute IDs for
integrity verification.

## Radar selection profile

`RadarSelectionProfile` is built with `createRadarSelectionProfile()` and
contains:

```text
schemaVersion, id, version, name, setupFamily
scanTimeframe, evaluationCadence
moveDetectors[], detectorCombination, hardGates[]
resetPolicy, episodeExpiry
sourcePolicy, executionVenuePolicy, liquidityPolicy
createdAt, canonicalConfigHash
```

The profile hash is derived from the canonical serialized definition. Changing
a detector, threshold, gate, timeframe, reset rule, or other configuration
changes the hash. Every episode and manifest preserves the exact profile ID,
version, and hash that selected it.

This is separate from `StrategyProfile`. Radar selection should not be tightened
or loosened by trade-entry, stop, target, reward-to-risk, or sizing rules. A
research corpus must retain qualifying continuation pumps and failed fade
candidates, not only episodes that later became tradable.

### Experimental bundled profile

`EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE` is
`impulse_fade_v1.radar.experimental`, version `1`. It evaluates each completed
`1h` scan candle and combines these detectors with `any` semantics:

- maximum elapsed return across 2h, 4h, 8h, 12h, and 24h windows;
- run-up from a completed-close trough in the recent 48h path, with a maximum
  trough age of 24h;
- 1h displacement from EMA 20 in ATR 14 units.

Its hard gates cover data quality, source policy, execution-venue eligibility,
and liquidity. It requires four continuous hours of a false composite gate to
rearm and expires an active episode after 72 hours.

The current experimental thresholds are intentionally explicit:

| Detector or gate | Experimental value |
| --- | --- |
| Maximum-window return | At least 8%, percentile 95, Z-score 2, and 20 samples over a 180-day lookback |
| Elapsed reference staleness | At most 1 hour |
| Rolling-trough run-up | At least 12% from a trough no older than 24 hours within a 48-hour lookback |
| EMA/ATR displacement | At least 2 ATR above 1h EMA 20, using ATR 14 and at least 20 samples |
| Quote-notional liquidity | At least 1,000,000 over 24 hours; missing volume warns rather than fails |
| Allowed market-data sources | Bybit, Binance, and OKX |
| Intended execution venue | Phemex; unknown historical eligibility is allowed with a warning |

The profile is explicitly **experimental and unoptimized**. Its thresholds are
research defaults, not evidence of profitability or a universal definition of
a pump. Create a new versioned profile to evaluate other assumptions; do not
silently reinterpret historical episodes under edited settings.

## Path-aware detection

An endpoint return only compares two prices. That can hide an important local
move when the path first fell sharply and then rebounded. The radar therefore
supports both endpoint and path-aware detectors.

### Elapsed-window return

For a configured elapsed duration `w`:

```text
return(w) = (current completed close / reference completed close - 1) * 100
```

The reference is the latest completed scan-timeframe close at or before
`currentTime - w`. The observation records the actual reference timestamp and
price. `maximumReferenceStalenessSeconds` can reject an old reference rather
than pretending it represents the requested elapsed boundary.

An `ElapsedWindowReturnDetector` can independently require:

- `minimumReturnPct`;
- `minimumPercentile`;
- `minimumZScore`;
- `minimumSampleCount` over `historyLookbackSeconds`.

Null thresholds are disabled. Missing or stale references produce explicit data
quality notes and a null metric rather than zero.

### Maximum-window return

`MaximumWindowReturnDetector` evaluates every configured elapsed window and
stores each individual observation. It also creates an aggregate
`maximum_window_return` observation identifying the winner.

The highest available return wins. Equal returns are resolved in favor of the
shorter window. Displaying one winner does not discard the component
observations, their reference times, percentiles, or Z-scores.

### Rolling-trough run-up

For the lowest eligible completed close in a configured lookback:

```text
runup = (current completed close / trough completed close - 1) * 100
```

`RollingTroughRunupDetector` also constrains the maximum age of the trough. The
current implementation uses `referenceField: "close"`; it does not select an
intrabar low. If equal completed closes share the minimum, the earliest bucket
wins deterministically.

This detector is causal because both current price and the eligible trough come
only from candles completed by the evaluation cutoff. It describes a local
impulse along the observed path, not a retrospectively optimized pump origin.

### EMA/ATR displacement

`EmaAtrDisplacementDetector` calculates:

```text
displacement = (completed close - EMA(period)) / ATR(period)
```

The detector explicitly identifies its analysis timeframe, EMA period, ATR
period, minimum sample count, and required displacement. A higher-timeframe
instance remains unavailable until enough candles on that timeframe have
closed. The metric is expressed in ATR units and does not use percentile or
Z-score fields in the current implementation.

### Percentile and Z-score semantics

Historical distributions exclude the current observation and are bounded by
the detector's configured history lookback.

```text
percentile = 100 * count(historical value <= current value) / sample count
zScore     = (current value - historical mean) / population standard deviation
```

The calculation uses the empirical distribution without winsorization or
robust outlier adjustment. Z-score is null when the historical standard
deviation is zero. Both values are null when the configured minimum sample
count is not met, and the observation receives
`INSUFFICIENT_METRIC_HISTORY`; a percentile or Z-score gate cannot pass on
insufficient data.

## Metric observation schema

Every selection metric is serialized as `RadarMetricObservation` with:

```text
schemaVersion, logicalObjectId, observationId
metricCode, metricVersion, configHash, inputHash
symbol, source, dataOrigin, timeframe
requestedAsOf, effectiveAsOf, knownAt
window, referenceTime, referenceValue, value, unit
percentile, zScore, sampleCount, historyStart, historyEnd
dataQualityNotes[]
```

Missing values remain `null` with an explanatory note and never become a valid
zero. `inputHash` covers candle timestamps, buckets, OHLCV values, and supplied
revision numbers, while chart-only x coordinates are excluded.

## Selection-anchor freeze

When a rolling-trough detector participates in the first passing composite
gate, the episode freezes a `RadarSelectionAnchor` containing:

- the selected completed-close timestamp and price;
- its age at detection;
- its logical and exact observation IDs;
- the metric observation that selected it.

Later candles cannot move that anchor. Re-running the same episode with future
data therefore does not replace the trough with a later, visually preferable
origin. If multiple passing detectors exist, detector profile order is stable;
the first passing detector with an anchor supplies the episode anchor.

The anchor is intentionally named a **selection anchor**, not an automatically
detected pump origin.

## Detector composition and hard gates

`RadarDetectorCombination` supports:

- `{ mode: "any" }`: at least one move detector passes;
- `{ mode: "all" }`: every move detector passes;
- `{ mode: "atLeast", count: N }`: at least N of M detectors pass.

Detector IDs must be unique, and `N` must be between one and the detector
count. Detector evaluation order follows profile order, while serialized result
ordering is deterministic.

Hard gates are evaluated separately and then combined as:

```text
compositePassed = detectorGatePassed && hardGatesPassed
```

Supported hard gates are:

| Gate | Meaning |
| --- | --- |
| `dataQuality` | No configured detector observation contains an error note |
| `liquidity` | Quote notional satisfies the configured minimum, or configured missing-data policy permits a warning |
| `selectedUniverse` | A point-in-time universe observation says the symbol was included |
| `sourcePolicy` | The market-data source is allowed by the profile |
| `executionVenueEligibility` | Point-in-time intended-venue status satisfies the profile policy |

`RadarGateEvaluation` retains every detector result, every hard-gate result,
their explanations, exact evidence observation IDs, embedded cutoff-safe gate
evidence, and the final composite result. The episode and manifest preserve the
same evidence. Hard gates constrain corpus eligibility; they are not silently
folded into a move score.

## Completed candles and `asOf`

Candle timestamps are open times in Unix seconds. A candle is eligible only
when:

```text
candle open time + timeframe duration <= asOf
```

The scanner evaluates at completed `scanTimeframe` candle boundaries that also
match `evaluationCadence.everyBars`. Forming candles cannot trigger selection.
A 4h EMA/ATR detector used by a 1h scanner, for example, cannot consume the 4h
candle until its 4h close.

Each metric observation records `requestedAsOf`, `effectiveAsOf`, and `knownAt`.
`requestedAsOf` is the scan-candle evaluation boundary. `effectiveAsOf` and
`knownAt` are the close time of the latest completed candle actually used by
that metric. A 4h observation requested by consecutive 1h evaluations therefore
retains one observation ID until another 4h candle closes. The gate evaluation
preserves each 1h request time. Reference times may be older and are stored
explicitly.

An unavailable detector is not treated as a confirmed false value. A first
measurable gate that is already true cannot invent a false-to-true crossing at
the data-availability boundary; a genuine evaluable false state must precede
selection. Unknown intervals also interrupt the continuous-false reset clock.

History before `from` is still processed to establish detector and reset state;
only in-range observations and artifacts are emitted. Callers must supply enough
pre-roll to establish a genuine prior false gate and the requested statistical
history. The generated manifest reports required pre-roll by timeframe.

Rows after `to` are removed before duplicate-revision and candle validation, so
a future-only conflict cannot alter or abort a historical result. In-cutoff
malformed candles and conflicting same-bucket revisions fail closed instead of
being discarded. Future-only timeframes are omitted from manifest coverage.

## Episode lifecycle, reset, and rearm

The scanner maintains one radar state per symbol/source/profile scan:

```text
armed + false -> true crossing
    create one RadarEpisode
    block additional episodes

activeUntil reached
    emit expired status revision
    remain blocked until reset

composite gate continuously false for minimumFalseDurationSeconds
    emit reset status revision
    rearm

next false -> true crossing
    create a new RadarEpisode with a new deterministic ID
```

A sustained true gate creates one episode, not one episode per candle. A single
noisy false candle does not rearm unless it satisfies the full elapsed reset
duration. Expiry also does not rearm while the gate remains true.

`RadarEpisode` is the immutable detection artifact. Its detection-time fields
remain:

```text
terminalAt: null
terminalReason: null
rearmState: "blockedUntilReset"
```

Later active, expired, and reset facts are separate
`RadarEpisodeStatusObservation` revisions with the episode ID as their logical
object ID. This prevents post-detection terminal information from leaking into
the artifact consumed by a future replay.

## Path context at detection

An episode stores trigger observations separately from descriptive context.
`RadarPathContext` includes:

- net 24h and 48h returns;
- the triggering local impulse and detector/window;
- frozen selection-anchor price, time, and age;
- the preceding completed-close peak;
- drawdown from that peak to the anchor;
- recovery fraction from anchor toward the prior peak;
- current EMA/ATR displacement;
- triggering percentile and Z-score;
- quote notional when complete volume data is available;
- point-in-time MTF structure states;
- descriptive context tags.

The episode can also retain exact durable references to the lifecycle candidate,
lifecycle snapshot, and latest structure observation known at detection. These
are context only. The current context tags are descriptive and non-prescriptive;
for example, `rebound_after_drawdown` does not make a trade eligible.

## Worked path: `100 -> 80 -> 92`

Suppose completed closes follow this path:

```text
prior close/peak    100
recent trough       80
current close       92
```

The endpoint return from 100 to 92 is:

```text
(92 / 100 - 1) * 100 = -8%
```

A fixed rule requiring a positive 24h gain can miss the move entirely. The
path-aware trough detector instead observes:

```text
local run-up     = (92 / 80 - 1) * 100 = +15%
prior drawdown   = (80 / 100 - 1) * 100 = -20%
recovery fraction = (92 - 80) / (100 - 80) = 0.60
```

With a 15% trough-run-up threshold and an eligible, completed trough, the local
detector passes even though net return is negative. The episode records the
80-price trough as its frozen selection anchor and preserves the negative net
return as path context. This is a valid radar discovery event, not a claim that
the rebound should be shorted.

## Point-in-time venue eligibility

The API keeps three identities distinct:

- `source`: market-data venue, such as Bybit, Binance, or OKX;
- `dataOrigin`: optional transport/origin label, such as local or external;
- `executionVenue`: intended trading venue, such as Phemex.

`ExecutionVenueEligibilityObservation` has an effective interval, `knownAt`,
evidence source, status, data-quality notes, logical ID, and exact observation
ID. The scanner uses only an observation whose effective interval contains the
cutoff and whose `knownAt <= asOf`. Eligibility is keyed by symbol and intended
execution venue, not by the venue that supplied candles. Its
`marketDataSource` field records evidence provenance and does not couple Phemex
listing status to a Bybit, Binance, or OKX feed.

Supported policy modes are:

| Mode | Behavior |
| --- | --- |
| `requireKnownAvailable` | Only `Available` passes |
| `allowUnknown` | `Available` and `Unknown` pass; `Unavailable` fails |
| `ignore` | Eligibility status does not block selection |
| `rejectKnownUnavailable` | `Available` and `Unknown` pass; `Unavailable` fails |

If no historical observation is supplied, the scanner creates an honest
`Unknown` observation with an `EXECUTION_VENUE_HISTORY_UNAVAILABLE` warning. It
never treats current listing status as proof of historical availability.

## Logical IDs and observation IDs

The identity model distinguishes a logical object from one exact revision:

- **logical object ID:** stable identity of the metric definition, episode,
  structure object, eligibility fact, or other evolving domain object;
- **observation ID:** exact cutoff-safe representation, including the values and
  source inputs known for that revision.

For a radar metric, logical identity includes its metric code, symbol, source,
data origin, timeframe, window, and configuration hash. Its observation identity
also includes the effective data cutoff, actual reference, calculated value,
distribution statistics, input-candle hash, and data-quality notes. The request
time is audit metadata; it does not create a new metric revision while the
effective completed-candle inputs remain unchanged.

Consequences:

- identical input and cutoff produce identical objects and IDs;
- a later effective data cutoff produces a new metric observation ID;
- repeated higher-timeframe requests before its next close reuse the same ID;
- changed cutoff-resolved candle values produce a new observation ID while the
  metric's logical ID remains stable;
- changed detector configuration produces a new logical ID;
- conflicting same-bucket candles are rejected instead of resolved by array
  order.

`RadarEpisode.id` is derived from symbol, source, profile hash, detection time,
and the exact triggering observation IDs. It is also the episode's logical ID.
The episode observation ID hashes the complete immutable detection artifact.
Status revisions retain the episode logical ID and receive their own observation
IDs.

`createDurableObjectReference()` applies the same pattern to lifecycle,
structure, S/R, AVWAP, RS, or other upstream snapshots supplied by a caller.
Historical decisions must retain the original numeric snapshot and observation
ID rather than resolving the logical object to its latest revision.

The hashes provide deterministic identity and integrity checks; they are not
cryptographic signatures.

## Replay case manifests

`ReplayCaseManifest` is created at radar detection time and defines the future
replay case without implementing replay. It records:

- exact radar episode and observation IDs;
- symbol, source, `detectedAt`, and `startAsOf`;
- selection-profile, lifecycle-version, and strategy-profile references;
- timeframes available at detection;
- calculated pre-roll requirements;
- data coverage through the detection cutoff;
- initial radar observations, hard-gate evidence, and lifecycle state/reference;
- point-in-time execution-venue eligibility;
- detection-time data-quality notes.

Coverage is calculated from candles completed by `detectedAt`; later candles do
not expand the manifest. `futureOutcomeRef` is always `null` in this schema.
Episode expiry/reset revisions are not embedded.

This boundary is central to hidden-future safety. Two price paths that are
identical through detection but diverge afterward must produce identical
episodes and manifests. Continuation pumps, immediate reversals, failed fades,
expired candidates, and cases that never produce a trade all remain eligible for
the corpus when they pass the same point-in-time selection profile.

Any later outcome labels must live in a physically or logically separate store
that the replay session cannot access before completion or explicit reveal.
Selecting cases because they later reversed, reached `EntryCandidate`, hit a
target, or produced favorable P&L would introduce outcome-selection bias.

## Headless audit CLI

Build and run the bundled deterministic audit corpus with:

```sh
pnpm audit:radar
pnpm audit:radar --out ./radar-audit.json
```

The audit includes the negative-24h rebound, reset/rearm, and continuing-pump
cases. It prints detector values, hard-gate decisions and evidence IDs,
lifecycle context, episode IDs, reset events, and manifest IDs. The JSON output
contains the complete scan inputs and outputs.

To scan a caller-provided JSON `RadarScanInput`, or an object with a `scanInput`
member:

```sh
pnpm build
node scripts/audit-radar.mjs --input ./scan-input.json --out ./scan-output.json
```

## Example

```ts
const profile = createRadarSelectionProfile({
  schemaVersion: RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  id: "impulse-fade-radar.rebound-study",
  version: "1",
  name: "Completed-close rebound study",
  setupFamily: "impulse_fade_v1",
  scanTimeframe: "1h",
  evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
  moveDetectors: [
    {
      id: "recent-trough-runup",
      type: "rollingTroughRunup",
      lookbackSeconds: 48 * 60 * 60,
      minimumRunupPct: 15,
      maximumTroughAgeSeconds: 24 * 60 * 60,
      referenceField: "close",
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 20,
      historyLookbackSeconds: 180 * 24 * 60 * 60,
    },
  ],
  detectorCombination: { mode: "any" },
  hardGates: ["dataQuality", "sourcePolicy"],
  resetPolicy: { minimumFalseDurationSeconds: 4 * 60 * 60 },
  episodeExpiry: { maximumAgeSeconds: 72 * 60 * 60 },
  sourcePolicy: { allowedSources: ["bybit", "binance", "okx"] },
  executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
  liquidityPolicy: {
    minimumQuoteNotional: null,
    windowSeconds: 24 * 60 * 60,
    missingData: "warn",
  },
  createdAt: 1_700_000_000,
});

const result = scanRadarEpisodes({
  candlesBySymbolAndTimeframe: {
    FILUSDT: {
      symbol: "FILUSDT",
      source: "bybit",
      dataOrigin: "external",
      candlesByTimeframe: { "1h": candles },
    },
  },
  selectionProfile: profile,
  from,
  to,
});
```

The scanner returns explanations and immutable artifacts; it does not inspect a
chart component or mutate the input series.

## Known limitations and caller obligations

- Candle rows do not yet carry a historical revision `knownAt`. The caller must
  provide history already resolved to the revision that was knowable at the
  requested cutoff. The scanner can detect conflicting same-bucket rows and can
  hash changed inputs, but it cannot reconstruct which corrected candle revision
  was historically visible.
- A scan must include enough pre-roll to establish historical distributions and
  a genuine prior false gate. Beginning with an already-true gate and no earlier
  state cannot prove the actual crossing time.
- Scan state is reconstructed within one pure batch invocation. Persisted
  incremental scanner state and cross-process continuation are not implemented.
- Historical Phemex eligibility ingestion is not implemented. Missing evidence
  remains `Unknown` and is governed by the selected policy.
- Quote notional requires complete usable volume data across its configured
  window. Partial volume history is reported as unavailable rather than silently
  extrapolated.
- Percentiles and Z-scores use a simple empirical historical distribution and
  population variance. They are not regime-adjusted, volatility-clustered,
  winsorized, or optimized.
- The bundled profile supports `impulse_fade_v1` only and is an unoptimized
  research configuration. No automatic parameter fitting or profitability claim
  is provided.
- MTF structure and lifecycle context are only as complete as the cutoff-safe
  histories supplied by the caller. Missing upstream history is not inferred
  from future state.
- `ReplayCaseManifest` prepares the causal boundary but does not implement
  replay stepping, scheduled decisions, fills, funding, liquidation, MAE/MFE,
  target/stop execution, or outcome reveal.
