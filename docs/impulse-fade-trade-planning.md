# Impulse Fade v1 Trade Planning

## Status and scope

This document describes the current headless strategy-profile and deterministic
trade-planning APIs. The domain logic is exported from
`@cryptodouche/gpu-chart-vue/core`; it does not depend on Vue component state and
can be consumed by the chart, a future replay runner, a journal, or an analytical
service.

The implementation currently supports one research setup:

- setup family: `impulse_fade_v1`
- direction: short only
- lifecycle: `impulse_fade_v1.lifecycle.1`
- profile: `impulse_fade_v1.research.default`, version `1`

The default profile is a research starting point, not an optimized or validated
trading strategy.

## Strategy profile

`StrategyProfile` freezes the policy under which a decision and plan are judged.
It contains the setup and lifecycle identity, explicit timeframe roles, entry,
stop, target, risk, and execution policies, and a deterministic `profileHash`.

### Timeframe roles

Timeframe roles are strategy inputs. They are not inferred from the chart pane
that happens to be visible.

| Role | Research default | Meaning |
| --- | --- | --- |
| `candidateTimeframe` | `1h` | Timeframe used to identify an Impulse Fade candidate |
| `structureTimeframe` | `1h` | Timeframe whose structure governs the setup lifecycle |
| `executionTimeframe` | `15m` | Timeframe used to plan an entry |
| `triggerTimeframe` | `15m` | Optional lower-timeframe confirmation source |
| `contextTimeframes` | `4h`, `1d` | Higher-timeframe location and regime context |

Another stack can be created with `createImpulseFadeResearchProfile()` without
changing the engine. Replay and live planning must always load the profile that
was selected for the session rather than substitute the visible chart timeframe.

### Default policy

The research default treats `entryCandidate` as the only rules-compliant entry
state. It requires a confirmed retest/rejection, limits entry-candidate age to six
hours, requires projected cost-adjusted R of at least `1.5`, and requires
candidate metrics with at least `0.9` history coverage and no rejected `error`
data-quality notes.

Earlier entries remain recordable. They are classified as discretionary
overrides when they have no hard errors and include a user-supplied reason.

The profile categorizes factors as:

- **Hard gates:** active candidate, entry-candidate state, confirmed retest,
  reference integrity, data quality, risk, margin, and reward-to-risk.
- **Contextual confluence:** higher-timeframe resistance, relative-strength
  weakness, and AVWAP failure.
- **Informational:** Stoch RSI, volume, and extension badges.

These lists describe policy intent and are part of the supported lifecycle-v1
contract. The core validates that the required hard-gate factors retain those
roles. Reclassifying a required gate is a strategy/lifecycle semantics change,
not a runtime customization, and therefore requires a new supported engine and
version rather than silently changing old decisions.

## Versioning and identity

Each serialized artifact carries its own schema identity as well as the relevant
strategy and lifecycle identity.

| Object | Current identifier |
| --- | --- |
| Setup family | `impulse_fade_v1` |
| Lifecycle semantics | `impulse_fade_v1.lifecycle.1` |
| Lifecycle configuration | canonical `lifecycleConfigHash` |
| Strategy profile schema | `strategy-profile.1` |
| Default profile version | `1` |
| Strategy configuration | canonical `profileHash` |
| Decision snapshot schema | `decision-snapshot.1` |
| Decision record schema | `decision-record.1` |
| Trade plan schema | `trade-plan.1` |
| Sizing result schema | `sizing-result.1` |
| Sizing model | `linear-quote-perpetual-risk.1` |

Configuration hashes use sorted-key canonical JSON followed by 64-bit FNV-1a.
They are deterministic identity checks, not cryptographic signatures. A change
to lifecycle semantics requires a new lifecycle version. A threshold-only change
must at least produce a new lifecycle configuration hash. A changed strategy
policy requires a new profile version/hash. Historical records retain all of
these values so later software changes cannot silently reinterpret them.

## Decision snapshots

`createDecisionSnapshot()` creates a deeply frozen, JSON-serializable analytical
snapshot. Its deterministic ID is derived from the canonical serialized content.
The same inputs and cutoff therefore produce deeply equal output.

The two times have distinct meanings:

- `decisionTime` is when the decision is recorded.
- `effectiveAsOf` is the latest market-information cutoff allowed in the
  snapshot, and cannot be later than `decisionTime`.

The supplied lifecycle snapshot must have been evaluated at exactly
`effectiveAsOf`. The builder then applies these cutoff rules:

- lifecycle evidence, AVWAP events, RS events, and reference levels are retained
  only when `knownAt <= effectiveAsOf`;
- structure summaries are retained only when `updatedTs <= effectiveAsOf`;
- candidate metrics are retained only when their `effectiveAsOf` exists and is
  no later than the snapshot cutoff;
- the candidate episode is retained only when its `detectedAt` is no later than
  the cutoff;
- future AVWAP and RS state is replaced with `null`;
- missing candidate metrics remain `null`; they are never converted to zero.

The snapshot preserves the active candidate ID, lifecycle state and state start,
evidence and pending conditions, metrics, structure by timeframe, structural and
S/R references, AVWAP state/events, relative-strength state/events, selected
references, data-quality notes, and all version/hash identities.

Snapshots are analytical source-of-truth objects. A screenshot or chart display
configuration may be stored separately but cannot replace the structured
snapshot.

## Decisions

`DecisionRecord` supports three first-class actions:

- `Wait`: record that no trade is being proposed yet, optionally with a thesis,
  confidence, tags, and the next awaited condition.
- `Skip`: record a structured reason such as insufficient extension, poor
  liquidity, missing venue listing, strong HTF continuation, no viable stop,
  insufficient R, excessive maturity, insufficient data quality, discretionary
  rejection, or `other`.
- `ProposeTrade`: attach a `TradePlan` built against the same snapshot.

A skip requires `skipReason`. A proposed trade requires a plan whose `snapshotId`
matches the decision snapshot. Waits and skips are valid research outcomes; a
replay case does not need a trade to be useful.

## Plan, not execution

`TradePlan` records intended entry, stop, one or more targets, account state,
risk request, venue rules, execution assumptions, sizing result, leverage policy,
compliance result, optional override reason, and whether the plan is `draft` or
`finalized`.

It is not an order, fill, position, or executed trade. An intended price is a
planning input. No fill probability, order-book interaction, partial fill,
intra-candle ordering, realized P&L, funding, or liquidation event is inferred.

Supported entry plans are next-available market, limit, stop-market, and manual
reference. Stops and targets retain both the selected numeric price and their
frozen source reference when structurally derived. Target fractions must be
positive and sum to one within the profile tolerance. The research default
allows at most four targets.

## Risk-first sizing

`calculateLinearPerpetualSizing()` sizes a linear quote-margined perpetual in a
fixed order. Exactly one of account-risk fraction or fixed risk amount must be
provided.

For account risk fraction `r`, equity `E`, intended short entry `P_e`, stop `P_s`,
entry and stop fee rates `f_e` and `f_s`, and adverse slippage in basis points
`b_e` and `b_s`:

```text
riskBudget = E * r

effectiveEntry = P_e * (1 - b_e / 10,000)
effectiveStop  = P_s * (1 + b_s / 10,000)

riskPerUnit =
  (effectiveStop - effectiveEntry)
  + effectiveEntry * f_e
  + effectiveStop * f_s

rawQuantity = riskBudget / riskPerUnit
roundedQuantity = floorToVenueStep(rawQuantity)

grossNotional = roundedQuantity * P_e
projectedLossAtStop = roundedQuantity * riskPerUnit
```

Rounding is always downward and is checked again so projected loss cannot exceed
the requested risk budget due to floating-point or step-size effects. The result
also reports effective stop distance in absolute, percentage, and optionally ATR
terms, fees, notional, equity-risk percentage, and venue minimum/maximum errors.

## Leverage is margin configuration

Leverage is selected after quantity and notional. It does not determine position
risk and does not change quantity or projected stop loss when the plan's entry,
stop, costs, and risk budget are held constant.

```text
maximumAllocatedMargin = equity * maximumMarginAllocationFraction
minimumRequiredLeverage = grossNotional / maximumAllocatedMargin
initialMargin = grossNotional / selectedLeverage
```

Manual mode validates the supplied leverage. Derived-minimum mode rounds
`minimumRequiredLeverage` upward to the venue leverage step, with a floor of 1x.
The engine reports hard errors when selected leverage exceeds the venue maximum,
initial margin exceeds the configured allocation or available balance, or venue
quantity/notional constraints cannot be met. It does not silently shrink a plan
to make leverage fit.

Higher leverage lowers initial margin but brings liquidation closer and increases
operational fragility. It does not reduce the loss at the structural stop.

## Targets and projected R

For a short target `P_t` and adverse target slippage `b_t`:

```text
effectiveTarget = P_t * (1 + b_t / 10,000)
grossReward = quantity * (effectiveEntry - effectiveTarget)
targetEntryFee = quantity * effectiveEntry * entryFeeRate
targetExitFee = quantity * effectiveTarget * targetExitFeeRate
netProjectedReward = grossReward - targetEntryFee - targetExitFee

grossR = grossReward / grossStopLoss
projectedR = netProjectedReward / projectedLossAtStop
weightedProjectedR = sum(projectedR_i * positionFraction_i)
```

The cost-adjusted denominator includes adverse entry/stop slippage and entry/stop
fees. Each target's numerator includes adverse entry/target slippage and
entry/target fees. These are planning estimates, not simulated outcomes.

For partial exits, the engine reports each target and its weighted contribution,
plus aggregate gross and cost-adjusted rewards and R multiples.

## Structural reference provenance

Every non-manual entry, stop, or target must carry both a
`DecisionReferenceLevel` ID and the complete frozen reference object. A reference
contains:

- stable ID and kind;
- selected price and optional range boundaries;
- source timeframe;
- `eventTime` and `knownAt`;
- source object type, source object ID, exact source-observation ID, and a JSON
  snapshot of the source object.

`createDecisionReferenceLevel()` derives the observation ID from the canonical
source object snapshot and rejects a supplied ID that does not match.

The validator requires `reference.knownAt <= snapshot.effectiveAsOf`, requires the
ID to exist in the snapshot's reference set, and compares the supplied and frozen
objects using canonical serialization. A later-discovered or modified level is a
hard error. The final selected numeric stop/target remains in the plan so future
changes to swing or S/R algorithms cannot alter historical plans.

Upstream calculations are responsible for assigning durable logical object IDs.
The trade-planning layer derives and verifies the exact revision identity from
the frozen source snapshot; it cannot invent source provenance that was not
supplied.

## Compliance and overrides

Compliance returns three separate lists:

- `hardErrors`: mathematical, temporal, identity, or venue failures that make a
  plan invalid;
- `strategyViolations`: departures from the selected research profile that may
  remain useful to study;
- `warnings`: limitations such as unavailable exact liquidation.

Classification precedence is:

1. Any hard error: `InvalidPlan`.
2. No active candidate: `OutOfStrategy`.
3. No strategy violations: `Compliant`.
4. Violations plus a user reason: `Overridden`.
5. Other violations: `OutOfStrategy`.

A finalized plan with overridable violations requires a nonblank user reason;
without one it becomes `InvalidPlan`. The violations are retained on overridden
plans and are never rewritten as compliant later.

Examples of hard failures include an invalid short stop/target, malformed risk
request, bad target fractions, venue/margin failure, reference cutoff or snapshot
mismatch, and strategy/profile version mismatch. Examples of overridable policy
violations include entering before `EntryCandidate`, structure break, or retest,
stale retest, inadequate data quality, a stop inside the episode high, and R below
the profile minimum.

## Venue and liquidation limitations

`VenueRiskRules` records venue/symbol identity, quantity and price increments,
minimum quantity/notional, maximum leverage and leverage increment, fee-schedule
metadata, and optional maintenance-margin/liquidation model references. The core
validates price-tick and leverage-step alignment and warns when the serialized
execution fee assumptions are lower than the supplied venue schedule. It is an
input contract; this milestone does not fetch exchange rules.

The current sizing result always reports:

```text
liquidationStatus.status = unavailable
liquidationStatus.reason = EXACT_LIQUIDATION_MODEL_UNAVAILABLE
```

No generic formula is presented as an exact liquidation price. A future venue
adapter must implement and verify the venue's tiered maintenance margin,
contract, fee, and liquidation rules before exact liquidation can be reported.

## Acceptance coverage

The public-core tests cover the milestone requirements directly:

| Requirement | Covered behavior |
| --- | --- |
| A | Leverage changes margin, not risk-sized quantity or stop loss |
| B | A wider stop reduces quantity at fixed account risk |
| C | Fees and adverse slippage reduce allowable quantity |
| D | Quantity rounds down and projected loss remains within budget |
| E | Invalid short stops and targets are rejected |
| F | Partial targets must sum to one and produce weighted R |
| G | Manual, derived, impossible-margin, balance, and venue limits are validated |
| H | References learned after the decision cutoff are rejected |
| I | Compliant, overridden early, and no-candidate plans remain distinct |
| J | JSON-round-tripped inputs produce deeply equal outputs and tampering is detected |
| K | Advancing live state cannot mutate a prior snapshot |
| L | Profile/lifecycle version and hash mismatches and serialized-data tampering are surfaced |
| M | Exact liquidation remains unavailable without a verified calculator |

## Worked example 1: narrow, compliant plan

Assume a completed `EntryCandidate` snapshot with an active candidate, confirmed
retest/rejection, full candidate-metric coverage, and a frozen episode-high
reference at `104`, known before the cutoff.

```text
Account equity                 10,000 USDT
Available balance               5,000 USDT
Risk request                         1.00% = 100 USDT
Entry                                      100.00
Stop                                       105.00
Target                                      90.00 at 100%
Quantity step                                 0.1
Entry/stop/target fee rate                 0.055%
Adverse slippage, each leg                    5 bp
Manual leverage                                2x
Maximum margin allocation                     25%
```

The stop is beyond the frozen episode high and uses that exact reference; the
selected buffer from `104` to `105` is approximately `96.15 bp`.

```text
effectiveEntry                   99.950000
effectiveStop                   105.052500
riskPerUnit                       5.215251375
rawQuantity                      19.174531161
roundedQuantity                         19.1
grossNotional                 1,910.00 USDT
projectedLossAtStop               99.6113 USDT (0.9961% equity)
minimumRequiredLeverage              0.764x (therefore 1x practical minimum)
selectedLeverage                         2x
initialMargin                    955.00 USDT (9.55% equity)
effectiveTarget                       90.045
netProjectedReward               187.1896 USDT
cost-adjusted projected R             1.8792
```

With no other violations, the plan is `Compliant`. It still carries the
`EXACT_LIQUIDATION_MODEL_UNAVAILABLE` warning.

## Worked example 2: wide, overridden early plan

Use the same account, fees, slippage, risk budget, and venue rules, but freeze the
decision while the lifecycle is only `deteriorating`. The trader chooses a wider
stop at `110`, derived from the same frozen episode high at `104`, and a target at
`80`. The selected stop buffer is approximately `576.92 bp`.

```text
Entry                                      100.00
Stop                                       110.00
Target                                      80.00 at 100%
Override reason        "Testing RS lead before price structure breaks"
```

```text
effectiveEntry                   99.950000
effectiveStop                   110.055000
riskPerUnit                      10.220502750
rawQuantity                       9.784254498
roundedQuantity                          9.7
grossNotional                   970.00 USDT
projectedLossAtStop               99.1389 USDT (0.9914% equity)
minimumRequiredLeverage              0.388x (therefore 1x practical minimum)
selectedLeverage                         2x
initialMargin                    485.00 USDT (4.85% equity)
effectiveTarget                       80.040
netProjectedReward               192.1668 USDT
cost-adjusted projected R             1.9384
```

The wider stop approximately halves quantity and notional while preserving the
same risk budget. The plan retains `ENTRY_BEFORE_ENTRY_CANDIDATE`,
`ENTRY_BEFORE_STRUCTURE_BREAK`, and `ENTRY_BEFORE_RETEST`. Because the plan has
no hard errors and supplies an explicit reason, its classification is
`Overridden`, not `Compliant`.

Under fixed equity, risk budget, and margin allocation, the wider-stop plan also
has a lower minimum leverage requirement because its risk-sized notional is
smaller. Leverage does not compensate for a wide stop; position quantity does.

## Future replay integration

A replay system can use these objects without changing their meaning:

1. Load an exact `StrategyProfile` version/hash and lifecycle version/hash.
2. Advance data to a completed-candle `effectiveAsOf` cutoff.
3. Build and persist one immutable `DecisionSnapshot` from facts knowable at that
   cutoff.
4. Record `Wait`, `Skip`, or `ProposeTrade` against the snapshot.
5. For a proposed plan, preserve references, assumptions, sizing, compliance,
   and any override reason exactly as created.
6. In a separate future execution simulator, process only data after the
   decision/order eligibility time and produce fills and outcomes as new objects.

The replay runner must own chronological data delivery, hidden-future controls,
venue-rule selection, session identity, and persistence. It must not mutate a
snapshot or recompute an old plan using newer profiles, lifecycle rules, market
objects, or venue metadata.

## Assumptions before replay

The planning core is complete for this milestone. A replay runner still needs to
make these integration assumptions explicit:

- The lifecycle must be evaluated from the same cutoff-safe CandidateMetrics
  observation stream stored in the `DecisionSnapshot`. The current chart UI is
  not itself a decision-snapshot producer.
- CandidateMetrics observations should be unique at a given `knownAt` cutoff.
  A future ingestion contract should reject or version conflicting observations
  instead of depending on arrival order.
- The sizing calculation intentionally uses the profile's serialized execution
  assumptions. A venue adapter must select and record fee assumptions that agree
  with its versioned `VenueRiskRules.feeSchedule` before live planning.
- Liquidation stays unavailable even when model metadata is present. A verified,
  executable venue calculator is required before an exact price can be emitted.
- Pending conditions and data-quality notes belong to the exact lifecycle
  snapshot supplied at `effectiveAsOf`; they are not independent event streams.
- Proposing a draft, overridden, out-of-strategy, or invalid plan remains
  recordable for research. A future replay session policy may restrict which
  plans can advance to a fill simulator, but it must preserve the original plan.
- Durable IDs and complete source snapshots for swing, S/R, AVWAP, and structure
  references must be supplied by upstream calculators.

Under otherwise identical risk inputs, a wider stop produces smaller quantity
and notional, so it also has a lower minimum leverage requirement. Leverage does
not compensate for a wide stop; risk-based quantity does.

## Non-goals

This milestone does not implement replay controls, scenario selection,
hidden-future rendering, fills, stop/target execution, intra-candle fill ordering,
P&L progression, MAE/MFE, funding accrual, persistence, post-trade review UI,
exchange order placement, exact liquidation without a verified venue model,
automatic strategy optimization, new setup families, new indicators, or
lifecycle-threshold tuning.
