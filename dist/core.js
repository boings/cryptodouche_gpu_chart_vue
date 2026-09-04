import { s as C, i as L, c as u } from "./trainer-QOJCGisK.js";
import { A as ie, C as oe, D as te, a as re, b as ce, E as Ee, d as le, e as Se, f as me, g as _e, h as ue, j as Ie, k as Ae, l as Re, m as Ne, n as Ce, o as de, p as pe, q as Te, r as Oe, t as fe, F as Le, I as ye, u as ve, v as Me, w as he, x as be, y as Ve, z as ge, B as He, G as Pe, H as De, J as Ue, K as Fe, L as xe, M as Ye, N as we, O as qe, P as Be, R as Ge, Q as ze, S as Xe, T as ke, U as We, V as Ke, W as Je, X as $e, Y as Qe, Z as Ze, _ as je, $ as ea, a0 as aa, a1 as sa, a2 as na, a3 as ia, a4 as oa, a5 as ta, a6 as ra, a7 as ca, a8 as Ea, a9 as la, aa as Sa, ab as ma, ac as _a, ad as ua, ae as Ia, af as Aa, ag as Ra, ah as Na, ai as Ca, aj as da, ak as pa, al as Ta, am as Oa, an as fa, ao as La, ap as ya, aq as va, ar as Ma, as as ha, at as ba, au as Va, av as ga, aw as Ha, ax as Pa, ay as Da, az as Ua, aA as Fa, aB as xa, aC as Ya, aD as wa, aE as qa, aF as Ba, aG as Ga, aH as za, aI as Xa, aJ as ka, aK as Wa, aL as Ka, aM as Ja, aN as $a, aO as Qa, aP as Za, aQ as ja, aR as es, aS as as, aT as ss, aU as ns, aV as is, aW as os, aX as ts, aY as rs, aZ as cs, a_ as Es, a$ as ls, b0 as Ss, b1 as ms, b2 as _s, b3 as us, b4 as Is, b5 as As, b6 as Rs, b7 as Ns, b8 as Cs, b9 as ds, ba as ps, bb as Ts, bc as Os, bd as fs, be as Ls, bf as ys, bg as vs, bh as Ms, bi as hs, bj as bs, bk as Vs, bl as gs, bm as Hs, bn as Ps, bo as Ds, bp as Us, bq as Fs, br as xs, bs as Ys, bt as ws, bu as qs, bv as Bs, bw as Gs, bx as zs, by as Xs, bz as ks, bA as Ws, bB as Ks, bC as Js, bD as $s, bE as Qs, bF as Zs, bG as js, bH as en, bI as an, bJ as sn, bK as nn, bL as on, bM as tn, bN as rn, bO as cn, bP as En, bQ as ln, bR as Sn, bS as mn, bT as _n, bU as un, bV as In, bW as An, bX as Rn, bY as Nn, bZ as Cn, b_ as dn, b$ as pn, c0 as Tn, c1 as On, c2 as fn, c3 as Ln, c4 as yn, c5 as vn, c6 as Mn, c7 as hn, c8 as bn, c9 as Vn, ca as gn, cb as Hn, cc as Pn, cd as Dn, ce as Un, cf as Fn, cg as xn, ch as Yn, ci as wn, cj as qn, ck as Bn, cl as Gn, cm as zn, cn as Xn, co as kn, cp as Wn, cq as Kn, cr as Jn, cs as $n, ct as Qn, cu as Zn, cv as jn, cw as ei, cx as ai, cy as si, cz as ni, cA as ii, cB as oi, cC as ti, cD as ri, cE as ci, cF as Ei, cG as li, cH as Si, cI as mi, cJ as _i, cK as ui, cL as Ii, cM as Ai, cN as Ri, cO as Ni, cP as Ci, cQ as di, cR as pi, cS as Ti, cT as Oi, cU as fi, cV as Li, cW as yi, cX as vi, cY as Mi } from "./trainer-QOJCGisK.js";
const g = "historical-candle.1", H = "historical-validation.1", G = "historical-aggregation.1", M = 60, z = /* @__PURE__ */ new Set([
  "MISSING_CANDLE_INTERVAL",
  "DUPLICATE_CANDLE",
  "INVALID_OHLC",
  "TARGET_REFERENCE_MISALIGNMENT",
  "INSUFFICIENT_ANALYSIS_PREROLL",
  "INSUFFICIENT_DISPLAY_PREROLL",
  "INSUFFICIENT_EXECUTION_POSTROLL",
  "INVALID_CANDLE_INTERVAL",
  "INCOMPLETE_CANDLE",
  "NEGATIVE_VOLUME",
  "NON_MONOTONIC_CANDLES",
  "SOURCE_MISMATCH",
  "SYMBOL_MISMATCH"
]);
function P(e) {
  return `historical-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function d(e) {
  return u(T(e));
}
function j(e) {
  const a = C(e.timeframe), n = e.scope ?? "target", o = [], r = [];
  let t = Number.NEGATIVE_INFINITY;
  for (const s of e.candles) {
    if (s.openTime < t && o.push(c("NON_MONOTONIC_CANDLES", n, "Input candles are not monotonic", s.openTime)), t = s.openTime, s.source !== e.source) {
      o.push(c("SOURCE_MISMATCH", n, "Candle source does not match the requested source", s.openTime, e.source, s.source));
      continue;
    }
    if (s.symbol.toUpperCase() !== e.symbol.toUpperCase()) {
      o.push(c("SYMBOL_MISMATCH", n, "Candle symbol does not match the requested symbol", s.openTime, e.symbol.toUpperCase(), s.symbol.toUpperCase()));
      continue;
    }
    if (s.timeframe !== e.timeframe || !b(s.openTime) || !b(s.closeTime) || s.openTime % a !== 0 || s.closeTime !== s.openTime + a) {
      o.push(c("INVALID_CANDLE_INTERVAL", n, "Candle must use explicit UTC-aligned open and close times", s.openTime, a, s.closeTime - s.openTime));
      continue;
    }
    const m = s.knownAt ?? s.closeTime;
    if (s.closeTime > e.completedThrough || m > e.completedThrough || m < s.closeTime) {
      o.push(c("INCOMPLETE_CANDLE", n, "Candle is not completed and known by the requested cutoff", s.openTime, e.completedThrough, m));
      continue;
    }
    if (!x(s)) {
      o.push(c("INVALID_OHLC", n, "OHLC values must be positive finite values contained by high and low", s.openTime));
      continue;
    }
    if (!O(s.volumeBase) || !O(s.volumeQuote)) {
      o.push(c("NEGATIVE_VOLUME", n, "Candle volume must be finite and non-negative when supplied", s.openTime));
      continue;
    }
    if (s.revision != null && (!Number.isInteger(s.revision) || s.revision < 0)) {
      o.push(c("INVALID_CANDLE_INTERVAL", n, "Candle revision must be a non-negative integer", s.openTime));
      continue;
    }
    s.active !== !1 && r.push({
      schemaVersion: g,
      logicalId: P(s),
      source: s.source,
      symbol: s.symbol.toUpperCase(),
      timeframe: s.timeframe,
      openTime: s.openTime,
      closeTime: s.closeTime,
      knownAt: m,
      o: s.o,
      h: s.h,
      l: s.l,
      c: s.c,
      volumeBase: s.volumeBase ?? null,
      volumeQuote: s.volumeQuote ?? null,
      revision: s.revision ?? 0
    });
  }
  const i = /* @__PURE__ */ new Map();
  for (const s of r) {
    const m = i.get(s.logicalId) ?? [];
    m.push(s), i.set(s.logicalId, m);
  }
  const l = [];
  for (const s of i.values()) {
    if (s.length > 1) {
      const m = s[0];
      o.push(c("DUPLICATE_CANDLE", n, "More than one active candle has the same logical identity", m.openTime, 1, s.length));
      continue;
    }
    l.push(s[0]);
  }
  return l.sort(y), o.push(...D(l, a, n)), $(l, o, u(Q(e.candles)));
}
function ee(e, a) {
  const n = C(a), o = d(e), r = p(e, "target", "1m"), t = /* @__PURE__ */ new Map(), i = T(e)[0];
  for (const E of T(e)) {
    if (E.timeframe !== "1m") continue;
    if (i && E.source !== i.source) {
      r.push(c("SOURCE_MISMATCH", "target", "One-minute aggregation cannot mix sources", E.openTime, i.source, E.source));
      continue;
    }
    if (i && E.symbol !== i.symbol) {
      r.push(c("SYMBOL_MISMATCH", "target", "One-minute aggregation cannot mix symbols", E.openTime, i.symbol, E.symbol));
      continue;
    }
    const A = Math.floor(E.openTime / n) * n, S = t.get(A) ?? [];
    S.push(E), t.set(A, S);
  }
  const l = [], s = n / M;
  for (const [E, A] of [...t].sort(([S], [R]) => S - R)) {
    const S = A.sort(y);
    if (!(S.length === s && S.every((_, B) => _.openTime === E + B * M))) {
      r.push(c("MISSING_CANDLE_INTERVAL", "target", `Incomplete ${a} aggregation bucket; no candle was synthesized`, E, s, S.length));
      continue;
    }
    const N = S[0], Y = S[S.length - 1], w = V(S.map((_) => _.volumeBase)), q = V(S.map((_) => _.volumeQuote));
    l.push({
      schemaVersion: g,
      logicalId: P({ source: N.source, symbol: N.symbol, timeframe: a, openTime: E }),
      source: N.source,
      symbol: N.symbol,
      timeframe: a,
      openTime: E,
      closeTime: E + n,
      knownAt: Math.max(...S.map((_) => _.knownAt)),
      o: N.o,
      h: Math.max(...S.map((_) => _.h)),
      l: Math.min(...S.map((_) => _.l)),
      c: Y.c,
      volumeBase: w,
      volumeQuote: q,
      revision: Math.max(...S.map((_) => _.revision))
    });
  }
  const m = v(r), I = {
    schemaVersion: G,
    sourceTimeframe: "1m",
    targetTimeframe: a,
    candles: l,
    issues: m,
    valid: !m.some((E) => E.severity === "error"),
    sourceFingerprint: o
  };
  return L({ ...I, fingerprint: u(I) });
}
function ae(e) {
  const a = new Set(e.requirements.permittedWarningCodes ?? []), n = [
    ...p(e.targetCandles, "target"),
    ...p(e.referenceCandles, "reference"),
    ...p(e.executionCandles, "execution", e.requirements.executionTimeframe)
  ];
  X(e, n), k(e, n), W(e, n), K(e, n), J(e, n);
  const o = v(n.map(
    (s) => a.has(s.code) && !z.has(s.code) ? { ...s, severity: "warning" } : s
  )), r = d(e.targetCandles), t = d(e.referenceCandles), i = d(e.executionCandles), l = {
    schemaVersion: H,
    valid: !o.some((s) => s.severity === "error"),
    issues: o,
    targetFingerprint: r,
    referenceFingerprint: t,
    executionFingerprint: i
  };
  return L({
    ...l,
    bundleFingerprint: u({
      ...l,
      provenance: e.provenance,
      universe: e.universe,
      requirements: e.requirements,
      fundingObservations: [...e.fundingObservations].sort((s, m) => s.timestamp - m.timestamp)
    })
  });
}
function p(e, a, n) {
  const o = [];
  let r = Number.NEGATIVE_INFINITY;
  const t = /* @__PURE__ */ new Set();
  for (const i of e) {
    let l;
    try {
      l = C(i.timeframe);
    } catch {
      o.push(c("INVALID_CANDLE_INTERVAL", a, "Candle timeframe is invalid", i.openTime));
      continue;
    }
    i.openTime < r && o.push(c("NON_MONOTONIC_CANDLES", a, "Candles are not in monotonic order", i.openTime)), r = i.openTime, t.has(i.logicalId) && o.push(c("DUPLICATE_CANDLE", a, "Duplicate canonical logical candle identity", i.openTime)), t.add(i.logicalId), (n != null && i.timeframe !== n || i.openTime % l !== 0 || i.closeTime !== i.openTime + l || i.knownAt < i.closeTime) && o.push(c("INVALID_CANDLE_INTERVAL", a, "Canonical candle interval or completion time is invalid", i.openTime)), x(i) || o.push(c("INVALID_OHLC", a, "Canonical candle violates OHLC invariants", i.openTime)), (!O(i.volumeBase) || !O(i.volumeQuote)) && o.push(c("NEGATIVE_VOLUME", a, "Canonical candle volume is invalid", i.openTime));
  }
  if (e.length) {
    const i = e[0].timeframe;
    if (e.every((l) => l.timeframe === i))
      try {
        o.push(...D(e, C(i), a));
      } catch {
      }
  }
  return o;
}
function X(e, a) {
  f(e.targetCandles, e.provenance.analysisSource, "target", a), f(e.referenceCandles, e.provenance.referenceSource, "reference", a), e.provenance.executionPriceDataSource && f(e.executionCandles, e.provenance.executionPriceDataSource, "execution", a);
}
function f(e, a, n, o) {
  for (const r of e)
    r.source !== a.id && o.push(c("SOURCE_MISMATCH", n, "Candle source differs from provenance", r.openTime, a.id, r.source)), r.symbol !== a.symbol.toUpperCase() && o.push(c("SYMBOL_MISMATCH", n, "Candle symbol differs from provenance", r.openTime, a.symbol.toUpperCase(), r.symbol));
}
function k(e, a) {
  const n = e.requirements.decisionTime - e.requirements.analysisPreRollSeconds, o = e.requirements.decisionTime, r = new Set(e.targetCandles.filter((i) => i.openTime >= n && i.closeTime <= o).map((i) => `${i.timeframe}:${i.openTime}`)), t = new Set(e.referenceCandles.filter((i) => i.openTime >= n && i.closeTime <= o).map((i) => `${i.timeframe}:${i.openTime}`));
  for (const i of /* @__PURE__ */ new Set([...r, ...t]))
    if (r.has(i) !== t.has(i)) {
      const l = Number(i.slice(i.indexOf(":") + 1));
      a.push(c("TARGET_REFERENCE_MISALIGNMENT", "bundle", "Target and reference completed candles do not align", l));
    }
}
function W(e, a) {
  const { decisionTime: n, analysisPreRollSeconds: o, displayPreRollSeconds: r, executionPostRollSeconds: t, executionTimeframe: i } = e.requirements, l = [...new Set(e.requirements.requiredAnalysisTimeframes)];
  l.length || a.push(c("INSUFFICIENT_ANALYSIS_PREROLL", "bundle", "At least one required analysis timeframe must be declared"));
  for (const E of l) {
    const A = e.targetCandles.filter((R) => R.timeframe === E), S = e.referenceCandles.filter((R) => R.timeframe === E);
    h(A, E, "target", n, o, a), h(S, E, "reference", n, o, a);
  }
  const s = U(e.targetCandles);
  s > n - r && a.push(c("INSUFFICIENT_DISPLAY_PREROLL", "target", "Target history does not cover the required display pre-roll", null, n - r, Number.isFinite(s) ? s : null));
  const m = C(i), I = F(e.executionCandles);
  I < n + t && a.push(c("INSUFFICIENT_EXECUTION_POSTROLL", "execution", "Execution history does not cover the required future horizon", null, n + t, Number.isFinite(I) ? I : null)), (!e.executionCandles.length || e.executionCandles.some((E) => E.timeframe !== i || E.closeTime - E.openTime !== m)) && a.push(c("EXECUTION_RESOLUTION_UNAVAILABLE", "execution", `Required ${i} execution candles are unavailable`));
}
function K(e, a) {
  var n;
  e.requirements.revisionHistoryRequired && (!e.targetRevisionHistoryAvailable || !e.referenceRevisionHistoryAvailable) && a.push(c("CANDLE_REVISION_HISTORY_UNAVAILABLE", "bundle", "Point-in-time candle revision history is unavailable")), e.requirements.pointInTimeUniverseRequired && (e.universe.mode !== "PointInTimeUniverse" || e.universe.status !== "verified") && a.push(c("POINT_IN_TIME_UNIVERSE_UNKNOWN", "universe", "Point-in-time universe membership is not verified")), e.requirements.pointInTimeExecutionVenueRequired && e.provenance.intendedExecutionVenue.status !== "verified" && a.push(c("POINT_IN_TIME_EXECUTION_VENUE_UNKNOWN", "venue", "Point-in-time intended execution venue availability is not verified")), e.provenance.executionSimulationMode === "ResearchProxyExecution" ? a.push(c("RESEARCH_PROXY_EXECUTION", "venue", "Execution prices are a research proxy and are not fills from the intended venue")) : ((n = e.provenance.executionPriceDataSource) == null ? void 0 : n.venue) !== e.provenance.intendedExecutionVenue.venue && a.push(c("SOURCE_MISMATCH", "venue", "Same-venue simulation requires matching price-data and intended venues"));
}
function J(e, a) {
  if (!e.requirements.fundingRequired) return;
  const n = e.provenance.executionPriceDataSource, o = n == null ? [] : e.fundingObservations.filter(
    (t) => t.venue === n.venue && t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.timestamp >= e.requirements.decisionTime && t.timestamp <= e.requirements.decisionTime + e.requirements.executionPostRollSeconds && t.knownAt >= t.timestamp && Number.isFinite(t.rate)
  ), r = e.requirements.requiredFundingTimestamps ?? [];
  (!o.length || r.some((t) => !o.some((i) => i.timestamp === t))) && a.push(c("FUNDING_DATA_UNAVAILABLE", "funding", "Funding data for the simulated execution instrument is unavailable or incomplete")), e.fundingObservations.some((t) => n != null && t.venue !== n.venue) && a.push(c("FUNDING_SOURCE_MISMATCH", "funding", "Funding observations from another venue cannot be applied to this simulation"));
}
function $(e, a, n) {
  const o = v(a), r = {
    schemaVersion: H,
    candles: e,
    issues: o,
    valid: !o.some((t) => t.severity === "error"),
    rawFingerprint: n
  };
  return L({ ...r, fingerprint: u(r) });
}
function D(e, a, n) {
  const o = T(e), r = [];
  for (let t = 1; t < o.length; t += 1) {
    const i = o[t - 1].openTime + a;
    o[t].openTime !== i && r.push(c("MISSING_CANDLE_INTERVAL", n, "Candle sequence has a gap; no interpolation was performed", i, i, o[t].openTime));
  }
  return r;
}
function T(e) {
  return [...e].sort(y);
}
function Q(e) {
  return [...e].sort(
    (a, n) => a.openTime - n.openTime || (a.knownAt ?? a.closeTime) - (n.knownAt ?? n.closeTime) || (a.revision ?? 0) - (n.revision ?? 0) || u(a).localeCompare(u(n))
  );
}
function h(e, a, n, o, r, t) {
  const i = U(e), l = F(e);
  (i > o - r || l < o) && t.push(c(
    "INSUFFICIENT_ANALYSIS_PREROLL",
    n,
    `${a} history does not cover the required analysis pre-roll through the decision time`,
    null,
    o - r,
    Number.isFinite(i) ? i : null
  ));
}
function U(e) {
  return e.length ? Math.min(...e.map((a) => a.openTime)) : Number.POSITIVE_INFINITY;
}
function F(e) {
  return e.length ? Math.max(...e.map((a) => a.closeTime)) : Number.NEGATIVE_INFINITY;
}
function y(e, a) {
  return e.openTime - a.openTime || e.knownAt - a.knownAt || e.logicalId.localeCompare(a.logicalId) || u(e).localeCompare(u(a));
}
function v(e) {
  return [...e].sort(
    (a, n) => (a.openTime ?? -1) - (n.openTime ?? -1) || a.code.localeCompare(n.code) || a.scope.localeCompare(n.scope) || u(a).localeCompare(u(n))
  );
}
function x(e) {
  return [e.o, e.h, e.l, e.c].every((a) => Number.isFinite(a) && a > 0) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function O(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function b(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function V(e) {
  return e.every((a) => a != null) ? e.reduce((a, n) => a + (n ?? 0), 0) : null;
}
function c(e, a, n, o = null, r = null, t = null) {
  return { code: e, severity: "error", scope: a, message: n, openTime: o, expected: r, actual: t };
}
export {
  ie as AVWAP_ANCHOR_SCHEMA_VERSION,
  oe as CANDLE_TIMESTAMP_SEMANTICS,
  te as DECISION_RECORD_SCHEMA_VERSION,
  re as DECISION_SNAPSHOT_SCHEMA_VERSION,
  ce as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Ee as EXECUTION_CANDLE_SCHEMA_VERSION,
  le as EXECUTION_DATA_BUNDLE_SCHEMA_VERSION,
  Se as EXECUTION_ENGINE_VERSION,
  me as EXECUTION_EVENT_SCHEMA_VERSION,
  _e as EXECUTION_FILL_SCHEMA_VERSION,
  ue as EXECUTION_JSON_DATA_SCHEMA_VERSION,
  Ie as EXECUTION_ORDER_SCHEMA_VERSION,
  Ae as EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
  Re as EXECUTION_PROFILE_SCHEMA_VERSION,
  Ne as EXECUTION_QUOTE_SCHEMA_VERSION,
  Ce as EXECUTION_RESULT_SCHEMA_VERSION,
  de as EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION,
  pe as EXECUTION_SESSION_SCHEMA_VERSION,
  Te as EXECUTION_TRADE_SCHEMA_VERSION,
  Oe as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  fe as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  Le as FUNDING_OBSERVATION_SCHEMA_VERSION,
  G as HISTORICAL_AGGREGATION_SCHEMA_VERSION,
  g as HISTORICAL_CANDLE_SCHEMA_VERSION,
  H as HISTORICAL_VALIDATION_SCHEMA_VERSION,
  ye as IMPULSE_FADE_CANDIDATE_GATE,
  ve as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  Me as IMPULSE_FADE_LIFECYCLE_VERSION,
  he as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  be as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  Ve as IMPULSE_FADE_SETUP_FAMILY,
  ge as InMemoryReplayAnalysisDataAdapter,
  He as InMemoryReplayExecutionDataAdapter,
  Pe as InMemoryReplayHistoricalDataAdapter,
  De as InMemoryReplayOutcomeStore,
  Ue as JsonReplayAnalysisDataAdapter,
  Fe as JsonReplayExecutionDataAdapter,
  xe as JsonReplayHistoricalDataAdapter,
  Ye as MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  we as MATERIALIZED_REPLAY_ENGINE_VERSION,
  qe as MaterializedReplayAnalysisProvider,
  Be as POSITION_LEDGER_SCHEMA_VERSION,
  Ge as RADAR_EPISODE_SCHEMA_VERSION,
  ze as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  Xe as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  ke as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  We as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  Ke as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  Je as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  $e as RELATIVE_STRENGTH_FORMULA_VERSION,
  Qe as REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION,
  Ze as REPLAY_ANALYSIS_ENGINE_VERSION,
  je as REPLAY_ANALYSIS_FRAME_SCHEMA_VERSION,
  ea as REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
  aa as REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION,
  sa as REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION,
  na as REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION,
  ia as REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION,
  oa as REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  ta as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  ra as REPLAY_COMMAND_SCHEMA_VERSION,
  ca as REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
  Ea as REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  la as REPLAY_ENGINE_VERSION,
  Sa as REPLAY_EVENT_SCHEMA_VERSION,
  ma as REPLAY_JSON_DATA_SCHEMA_VERSION,
  _a as REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  ua as REPLAY_MATERIALIZED_ENGINE_VERSION,
  Ia as REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  Aa as REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  Ra as REPLAY_SESSION_SCHEMA_VERSION,
  Na as REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  Ca as REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  da as REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  pa as SIZING_MODEL_VERSION,
  Ta as SIZING_RESULT_SCHEMA_VERSION,
  Oa as STRATEGY_PROFILE_SCHEMA_VERSION,
  fa as SuppliedObservationReplayAnalysisProvider,
  La as TRADE_PLAN_SCHEMA_VERSION,
  ya as TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION,
  va as TRAINER_CASE_BUNDLE_SCHEMA_VERSION,
  Ma as TRAINER_CORPUS_INDEX_SCHEMA_VERSION,
  ha as TRAINER_LOCAL_STORE_SCHEMA_VERSION,
  ba as TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION,
  Va as TRAINER_PUBLIC_FRAME_SCHEMA_VERSION,
  ga as TRAINER_REVIEW_RECORD_SCHEMA_VERSION,
  Ha as TRAINER_STUDY_CASE_SCHEMA_VERSION,
  Pa as TRAINER_STUDY_RUN_SCHEMA_VERSION,
  Da as TRAINER_UI_VERSION,
  Ua as TRAINER_WORKER_PROTOCOL_VERSION,
  Fa as VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  xa as VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  Ya as advanceExecutionTo,
  wa as advanceReplayAnalysisTo,
  ee as aggregateCanonicalOneMinuteCandles,
  qa as appendSyntheticCandle,
  Ba as applyReplayCommand,
  Ga as bucketStart,
  za as calculateLinearPerpetualSizing,
  Xa as candleCloseTime,
  ka as candleRevisionKnownAt,
  Wa as candleToBytes,
  Ka as candlesToBytes,
  u as canonicalHash,
  Ja as canonicalRadarJson,
  $a as canonicalSerialize,
  Qa as clearReplayAnalysisCache,
  Za as computeAnchoredVwapLine,
  ja as computeAnchoredVwapSignals,
  es as computeAnchoredVwapSnapshot,
  as as computeAtrLine,
  ss as computeBollingerBands,
  ns as computeCloseChangePct,
  is as computeEmaLine,
  os as computeExtensionSnapshot,
  ts as computeMacd,
  rs as computeMarketStructure,
  cs as computeRelativeCumulativeReturnLine,
  Es as computeRelativeStrengthDivergences,
  ls as computeRsiLine,
  Ss as computeSetupState,
  ms as computeSmaLine,
  _s as computeStochRsi,
  us as computeStructureActiveLevels,
  Is as computeSupportResistanceZones,
  As as computeSupportResistanceZonesFromSwings,
  Rs as computeSwingPoints,
  Ns as computeViewBounds,
  Cs as computeWmaLine,
  ds as createAvwapAnchorSpec,
  ps as createDecisionRecord,
  Ts as createDecisionReferenceLevel,
  Os as createDecisionSnapshot,
  fs as createDefaultReplaySessionConfig,
  Ls as createDurableObjectReference,
  ys as createExecutionCandleObservation,
  vs as createExecutionProfile,
  Ms as createExecutionQuoteObservation,
  hs as createExecutionSession,
  bs as createExecutionTradeObservation,
  Vs as createExecutionVenueEligibilityObservation,
  gs as createExperimentalExecutionProfile,
  Hs as createExperimentalReplayAnalysisProfile,
  Ps as createFundingObservation,
  Ds as createImpulseFadeResearchProfile,
  Us as createMaterializedReplaySessionConfig,
  Fs as createRadarSelectionProfile,
  xs as createRadarStructureObservation,
  Ys as createReplayAnalysisProfile,
  ws as createReplayAnalysisSession,
  qs as createReplayAnalysisStateObservation,
  Bs as createReplayCandleRecord,
  Gs as createReplayCommand,
  zs as createReplayKnownEvent,
  Xs as createReplaySession,
  ks as createReplaySessionConfig,
  Ws as createReplayWakeCondition,
  Ks as createReplayWakePlan,
  Js as createResearchVenueExecutionRules,
  $s as createStrategyProfile,
  Qs as createTradePlan,
  Zs as createTrainerCaseBundle,
  js as createTrainerCorpusIndex,
  en as createTrainerPresentationProfile,
  an as createTrainerReviewRecord,
  sn as createTrainerStudyRun,
  nn as createUniverseMembershipObservation,
  on as createVenueExecutionRules,
  tn as createVenueFeeSchedule,
  rn as decisionReferenceObservationId,
  cn as decisionSnapshotId,
  En as decisionSnapshotReferenceLevels,
  ln as deserializeExecutionSession,
  Sn as deserializeReplayAnalysisSession,
  mn as deserializeReplaySession,
  _n as effectiveReplayAnalysisAsOf,
  un as evaluateImpulseFadeSnapshot,
  In as evaluateImpulseFadeTimeline,
  An as evaluateTradePlanCompliance,
  Rn as executionCandleFromReplay,
  Nn as executionProfileHash,
  Cn as executionVenueEligibilityObservationId,
  dn as feeScheduleHash,
  pn as finalizeExecutionAtHorizon,
  P as historicalCandleLogicalId,
  d as historicalCandlesFingerprint,
  L as immutableJsonClone,
  Tn as impulseFadeLifecycleConfigHash,
  On as isStrictTimeframe,
  fn as isSupportedReplayEngineVersion,
  Ln as lineToBytes,
  yn as loadExecutionCase,
  vn as loadMaterializedReplayCase,
  Mn as loadReplayCase,
  hn as makeSyntheticCandles,
  bn as materializeReplayAnalysis,
  Vn as materializeReplayAnalysisAt,
  gn as materializeReplayCaseOutcome,
  Hn as materializedAnalysisKnownEvents,
  Pn as materializedStateToReplayObservation,
  Dn as mergeLiveCandle,
  j as normalizeCompletedUtcCandles,
  Un as normalizeOhlcvPoint,
  Fn as normalizeRestTimeframe,
  xn as packHistoricalCandles,
  Yn as parseExecutionJsonHistoricalDataFixture,
  wn as parseReplayAnalysisJsonDataFixture,
  qn as parseReplayJsonHistoricalDataFixture,
  Bn as prependHistoricalCandles,
  Gn as radarEpisodeObservationId,
  zn as radarSelectionProfileHash,
  Xn as radarStructureObservationId,
  kn as reconstructExecutionSessionFromEvents,
  Wn as reconstructReplaySession,
  Kn as redactTrainerSafeDescriptor,
  Jn as replayAnalysisAvwapDecisionState,
  $n as replayAnalysisCacheKey,
  Qn as replayAnalysisCacheSize,
  Zn as replayAnalysisProfileHash,
  jn as replayAnalysisRelativeStrengthDecisionState,
  ei as replayAnalysisRequiredCoverage,
  ai as replayAnalysisStateObservationId,
  si as replayAnalysisSupportResistanceReferences,
  ni as replayCandleLogicalId,
  ii as replayCandleObservationId,
  oi as replayCaseManifestId,
  ti as replayDataFingerprintAt,
  ri as replayKnownEventId,
  ci as replaySessionConfigHash,
  Ei as replaySha256,
  li as resumeReplaySession,
  Si as revealExecutionOutcome,
  mi as scanRadarEpisodes,
  _i as selectCompletedCandleRevisionsAt,
  ui as selectReplayRecordsAt,
  Ii as selectTrainerCases,
  Ai as serializeExecutionSession,
  Ri as serializeReplayAnalysisSession,
  Ni as serializeReplaySession,
  Ci as simulateExecutionToHorizon,
  di as strategyProfileHash,
  C as strictTimeframeToSeconds,
  pi as timeframeToSeconds,
  Ti as tradePlanId,
  Oi as trainerCaseBundleFingerprint,
  fi as universeMembershipObservationId,
  Li as validateExecutionSessionIntegrity,
  ae as validateHistoricalCase,
  yi as validateReplayAnalysisSession,
  vi as validateTrainerCaseBundle,
  Mi as venueExecutionRulesHash
};
