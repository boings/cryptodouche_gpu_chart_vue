function we(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function zn(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function Q(e, t) {
  return Math.floor(e / t) * t;
}
function qe(e) {
  const t = ze(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = vt(n.ts), s = j(n.o), i = j(n.h), a = j(n.l), c = j(n.c);
  return r == null || s == null || i == null || a == null || c == null ? null : {
    ts: r,
    o: s,
    h: i,
    l: a,
    c,
    v_base: j(n.v_base),
    v_quote: j(n.v_quote),
    ver: j(n.ver)
  };
}
function $e(e, t, n) {
  const r = we(t), s = ht(
    e.map((c, o) => Ue(c, o)).filter((c) => c != null),
    r
  ).slice(-Math.max(1, n));
  if (!s.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const i = Q(s[0].ts, r), a = s.map((c) => {
    const o = Q(c.ts, r);
    return {
      ...c,
      bucket: o,
      x: (o - i) / r
    };
  });
  return be({
    timeframeSec: r,
    firstBucket: i,
    candles: a,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Xn(e, t, n) {
  const r = e.candles.length, s = t.map((a, c) => Ue(a, c)).filter((a) => a != null).filter((a) => Q(a.ts, e.timeframeSec) < e.firstBucket).sort(je);
  if (!s.length) return 0;
  const i = $e(
    [...s, ...e.candles],
    n,
    s.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function ft(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function Ie(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function Wn(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function dt(e, t, n, r = 3) {
  const s = qe(t);
  if (!s) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = Q(s.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const a = e.positionByBucket.get(i), c = (i - e.firstBucket) / e.timeframeSec, o = { ...s, bucket: i, x: c };
  if (a != null)
    return At(o, e.candles[a]) ? { kind: "ignore", reason: "stale-version" } : St(e.candles[a], o) ? (e.candles[a] = o, { kind: "ignore", reason: "unchanged" }) : (e.candles[a] = o, {
      kind: "replace",
      position: a,
      bytes: Ie(o)
    });
  const l = e.candles[e.candles.length - 1];
  return i <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - l.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(o), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), mt(e), { kind: "reset", bytes: ft(e.candles) }) : (be(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: Ie(o)
  }));
}
function Gn(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, r = -1 / 0;
  for (const a of e)
    n = Math.min(n, a.l), r = Math.max(r, a.h);
  for (const a of t)
    for (let c = 1; c < a.length; c += 2) {
      const o = a[c];
      Number.isFinite(o) && (n = Math.min(n, o), r = Math.max(r, o));
    }
  const i = Math.max(1e-9, r - n) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: n - i,
    maxY: r + i
  };
}
function Qn(e, t, n) {
  const r = we(n), s = Math.floor(Date.now() / 1e3), i = Q(s, r), a = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), c = [];
  let o = 40 + a % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = i - l * r, f = Math.sin((t - l + a) / 9) * 0.8, d = o, h = Math.max(1e-4, d + f + Math.cos((t - l) / 13) * 0.35), m = Math.max(d, h) + 0.35 + Math.abs(Math.sin(l + a)) * 0.5, y = Math.min(d, h) - 0.35 - Math.abs(Math.cos(l + a)) * 0.5, A = 50 + a % 90 + Math.abs(Math.sin((t - l + a) / 5)) * 180;
    c.push({ ts: u, o: d, h: m, l: y, c: h, v_base: A, v_quote: A * h }), o = h;
  }
  return $e(c, n, t);
}
function Kn(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, s = Math.sin(r / 600) * 0.7, i = n.c, a = Math.max(1e-4, i + s), c = Math.max(i, a) + 0.5, o = Math.min(i, a) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(s) * 0.36));
  return dt(e, { ts: r, o: i, h: c, l: o, c: a, v_base: l, v_quote: l * a }, t);
}
function mt(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  be(e);
}
function be(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function Ue(e, t) {
  const n = qe(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function ht(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = Q(r.ts, t), i = n.get(s);
    (!i || je(r, i) > 0) && n.set(s, r);
  }
  return Array.from(n.entries()).sort(([r], [s]) => r - s).map(([, r]) => gt(r));
}
function je(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function gt(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function vt(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? yt(e) : pt(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function yt(e) {
  const [
    t,
    n = 1,
    r = 0,
    s = 0,
    i = 0,
    a = 0,
    c = 0,
    o = 0,
    l = 0
  ] = e, u = Math.floor(Number(a) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(r) - Number(c),
    Number(s) - Number(o),
    Number(i) - Number(l),
    u
  );
}
function pt(e) {
  const [t, n = 1, r = 1, s = 0, i = 0, a = 0, c = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(r),
    Number(s),
    Number(i),
    Number(a),
    Number(c)
  );
}
function St(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function At(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function j(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function ze(e) {
  if (typeof e == "string")
    try {
      return ze(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
function M(e) {
  const t = /* @__PURE__ */ new Set();
  function n(s, i = !1) {
    if (s === null) return "null";
    if (typeof s == "string" || typeof s == "boolean")
      return JSON.stringify(s);
    if (typeof s == "number") {
      if (!Number.isFinite(s))
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      return Object.is(s, -0) ? "0" : JSON.stringify(s);
    }
    if (s === void 0) return i ? "null" : void 0;
    if (typeof s != "object")
      throw new TypeError(`Canonical JSON does not support ${typeof s}`);
    if (Object.getPrototypeOf(s) !== Object.prototype && !Array.isArray(s))
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    if (t.has(s)) throw new TypeError("Canonical JSON does not support cycles");
    t.add(s);
    let a;
    return Array.isArray(s) ? a = `[${s.map((c) => n(c, !0) ?? "null").join(",")}]` : a = `{${Object.keys(s).sort().flatMap((o) => {
      const l = n(s[o]);
      return l == null ? [] : [`${JSON.stringify(o)}:${l}`];
    }).join(",")}}`, t.delete(s), a;
  }
  const r = n(e);
  if (r == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return r;
}
function G(e) {
  const t = new TextEncoder().encode(M(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function V(e) {
  return Xe(JSON.parse(M(e)));
}
function Xe(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) Xe(t);
    Object.freeze(e);
  }
  return e;
}
const H = "impulse_fade_v1", q = "impulse_fade_v1.lifecycle.1", wt = "impulse_fade_v1.lifecycle-config.1", Z = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function Yn(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(s.x, r / t);
  }), new Float32Array(n);
}
function Zn(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = 2 / (t + 1);
  let s = 0;
  for (let i = 0; i < t; i++)
    s += e[i].c;
  s /= t, n.push(e[t - 1].x, s);
  for (let i = t; i < e.length; i++)
    s = (e[i].c - s) * r + s, n.push(e[i].x, s);
  return new Float32Array(n);
}
function Jn(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = t * (t + 1) / 2;
  for (let s = t - 1; s < e.length; s++) {
    let i = 0;
    for (let a = 0; a < t; a++)
      i += e[s - t + 1 + a].c * (a + 1);
    n.push(e[s].x, i / r);
  }
  return new Float32Array(n);
}
function er(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const r = [], s = [], i = [];
  let a = 0, c = 0;
  return e.forEach((o, l) => {
    if (a += o.c, c += o.c * o.c, l >= t) {
      const u = e[l - t].c;
      a -= u, c -= u * u;
    }
    if (l >= t - 1) {
      const u = a / t, f = Math.max(0, c / t - u * u), d = Math.sqrt(f) * n;
      r.push(o.x, u), s.push(o.x, u + d), i.push(o.x, u - d);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(s),
    lower: new Float32Array(i)
  };
}
function tr(e, t = 14) {
  return X(it(e, t));
}
function nr(e, t = 14, n = 14, r = 3, s = 3) {
  const i = it(e, t), a = W(n);
  if (i.length < a)
    return { k: new Float32Array(), d: new Float32Array() };
  const c = [];
  for (let u = a - 1; u < i.length; u++) {
    let f = 1 / 0, d = -1 / 0;
    for (let y = 0; y < a; y++) {
      const A = i[u - y].value;
      f = Math.min(f, A), d = Math.max(d, A);
    }
    const h = d - f, m = h > 0 ? (i[u].value - f) / h * 100 : 50;
    c.push({ x: i[u].x, value: m });
  }
  const o = Be(c, W(r)), l = Be(o, W(s));
  return {
    k: X(o),
    d: X(l)
  };
}
function rr(e, t = 12, n = 26, r = 9) {
  const s = Ae(e, t), i = Ae(e, n), a = [];
  for (let u = 0; u < e.length; u++) {
    const f = s[u], d = i[u];
    f == null || d == null || a.push({ x: e[u].x, value: f - d });
  }
  const c = An(a, r), o = new Map(a.map((u) => [u.x, u.value])), l = c.map((u) => ({
    x: u.x,
    value: (o.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: X(a),
    signal: X(c),
    histogram: X(l)
  };
}
function ir(e, t = 14) {
  const n = he(e, t), r = [];
  return n.forEach((s, i) => {
    s != null && r.push({ x: e[i].x, value: s });
  }), X(r);
}
function ke(e, t = {}) {
  const n = w(t.windowSeconds, 60, 2592e3, 86400), r = w(t.historyDays, 1, 365, 180), s = w(t.minSamples, 1, 5e3, 20), i = w(t.emaPeriod, 2, 500, 20), a = w(t.atrPeriod, 2, 500, 14), c = nt(e);
  if (!c)
    return en(n);
  const o = e.indexOf(c), l = rt(e, c.bucket - n, o), u = l && I(l.c) ? (c.c / l.c - 1) * 100 : null, f = u == null ? [] : tn(e, {
    windowSeconds: n,
    earliestBucket: c.bucket - r * 86400,
    excludeBucket: c.bucket
  }), d = u != null && f.length >= s ? nn(f, u) : null, h = u != null && f.length >= s ? rn(f, u) : null, m = Ae(e, i)[o] ?? null, y = he(e, a)[o] ?? null, A = m != null && y != null && Number.isFinite(m) && Number.isFinite(y) && y > 0 ? (c.c - m) / y : null;
  return {
    candle: c,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: d,
    zScore: h,
    rollingReturnCount: f.length,
    ema: m,
    atr: y,
    atrExtension: A
  };
}
function bt(e = {}) {
  var se, ae, ce;
  const t = e.executionTimeframe ?? "chart", n = v(e.asOf), r = v(e.latestTs) ?? qt(e.candles ?? [], t) ?? v((se = e.structure) == null ? void 0 : se.updatedTs) ?? v((ae = e.marketStructure) == null ? void 0 : ae.summary.updatedTs) ?? null, s = n ?? r, i = s == null ? null : Pe(e.candles ?? [], s, t), a = (i == null ? void 0 : i.candle.c) ?? v(e.latestPrice), c = kt(e.marketStructure ?? null, n), o = (c == null ? void 0 : c.summary) ?? Tt(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : xe(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (U) => n == null || T(U) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (U) => n == null || T(U) <= n
  ), h = (e.anchoredVwapSignals ?? []).filter(
    (U) => n == null || T(U) <= n
  ), m = C(e.resistanceNearPct, 0, 10, 1.5), y = C(e.retestNearPct, 0, 10, 0.8), A = zt(e.extension ?? null), k = Xt(f, a, m), R = Wt(d), x = Gt(o), E = Qt(
    h,
    e.avwapDistancePct
  ), N = Kt(o, f, a, y), S = Yt(A, k, o, a), g = [
    A,
    k,
    R,
    x,
    E,
    N
  ], b = {
    checks: g,
    asOf: s,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? K({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, _ = Ft({
    extension: A,
    htfResistance: k,
    htfStructures: u,
    rsWeakness: R,
    structureShift: x,
    avwapFailure: E,
    retest: N,
    invalidated: S
  });
  return (ce = e.candles) != null && ce.length && s != null ? Et({
    ...e,
    asOf: s,
    latestPrice: a,
    marketStructure: c,
    structure: o,
    htfStructures: l,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: h,
    checks: g,
    executionTimeframe: t
  }) : Ze({
    ...b,
    state: _,
    reason: Jt(_, g),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function kt(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((a) => a.knownAt <= t), r = e.breaks.filter((a) => a.knownAt <= t), s = ((i = $(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: s,
    summary: Ce(n, r, s)
  };
}
function Tt(e, t) {
  if (!e || t == null) return e ?? null;
  const n = v(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function sr(e) {
  return xt(e).records;
}
function K(e = {}) {
  var t, n, r, s, i, a, c, o, l, u, f;
  return G({
    lifecycleVersion: q,
    lifecycleConfigVersion: wt,
    candidateGate: Z,
    extension: {
      windowSeconds: w(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: w((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: w((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: w((s = e.extensionOptions) == null ? void 0 : s.emaPeriod, 2, 500, 20),
      atrPeriod: w((i = e.extensionOptions) == null ? void 0 : i.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: w(
        (a = e.marketStructureOptions) == null ? void 0 : a.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: w(
        (c = e.marketStructureOptions) == null ? void 0 : c.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: w((o = e.marketStructureOptions) == null ? void 0 : o.atrPeriod, 2, 100, 14),
      minMoveAtr: C((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: w((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: w((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: C(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: C(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: C(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: C(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: C(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: w(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function ar(e) {
  var c;
  const t = Qe(e), n = $(t);
  if (n == null) return null;
  const r = Ge(e, n), s = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], a = new Set(
    i.map((o) => ie(o, e.executionTimeframe)).filter((o) => o <= n)
  );
  for (const o of e.structureEvents ?? [])
    (!o.sourceTimeframe || o.sourceTimeframe === e.executionTimeframe) && T(o) <= n && a.add(T(o));
  for (const o of [...a].sort((l, u) => l - u))
    Te(
      de(i, e.executionTimeframe, o),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (c = e.config) == null ? void 0 : c.marketStructureOptions,
      o,
      s
    );
  return We(
    e,
    n,
    s,
    r
  );
}
function xt(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, s = K(r), i = Qe(e), a = Ge(
    e,
    $(i) ?? 0
  ), c = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = v(e.from) ?? -1 / 0;
  let f = null;
  return { records: i.map((h) => {
    var x, E, N, S, g;
    const m = We(
      e,
      h,
      c,
      a
    ), y = Ke(e.candidateMetrics, h), A = (y == null ? void 0 : y.metrics) ?? Ee(
      ke(
        de(n, t, h),
        r.extensionOptions
      )
    );
    f = m;
    const k = m.evidence.filter((b) => o.has(b.id) ? !1 : (o.add(b.id), b.knownAt >= u)), R = m.transitions.filter((b) => {
      const _ = Rt(b);
      return l.has(_) ? !1 : (l.add(_), b.knownAt >= u);
    });
    return {
      asOf: h,
      setupFamily: H,
      lifecycleVersion: q,
      lifecycleConfigHash: s,
      candidateGatePassed: ne(A),
      candidateId: ((x = m.candidate) == null ? void 0 : x.id) ?? null,
      candidateDetectedAt: ((E = m.candidate) == null ? void 0 : E.detectedAt) ?? null,
      initialMtfContext: ((N = m.candidate) == null ? void 0 : N.initialMtfContext) ?? [],
      currentState: m.currentState,
      stateSince: m.stateSince,
      transition: $(R) ?? null,
      transitions: R,
      evidenceAdded: k,
      pendingConditions: m.pendingConditions,
      confluence: m.confluence,
      episodeHigh: ((S = m.candidate) == null ? void 0 : S.episodeHigh) ?? null,
      episodeHighTime: ((g = m.candidate) == null ? void 0 : g.episodeHighTime) ?? null,
      activeBreakLevel: m.activeBreakLevel,
      retestLevel: m.retestLevel,
      terminalReason: m.invalidationReason ?? m.expiryReason,
      dataQualityNotes: m.dataQuality
    };
  }), latestSnapshot: f };
}
function We(e, t, n, r) {
  const s = e.executionTimeframe, i = e.candlesByTimeframe[s] ?? [], a = e.config ?? {}, c = K(a), o = de(i, s, t), l = ke(o, a.extensionOptions), u = Ke(e.candidateMetrics, t), f = (u == null ? void 0 : u.metrics) ?? Ee(l), d = Te(
    o,
    s,
    e.structureEvents ?? [],
    a.marketStructureOptions,
    t,
    n
  ), h = r.filter(
    (y) => (y.summary.updatedTs ?? 0) <= t
  ), m = $(o) ?? null;
  return bt({
    candles: i,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: s,
    asOf: t,
    extensionOptions: a.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: f,
    marketStructure: d,
    structure: d.summary,
    htfStructures: h,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (m == null ? void 0 : m.c) ?? null,
    latestTs: t,
    resistanceNearPct: a.resistanceNearPct,
    retestNearPct: a.retestNearPct,
    retestToleranceBps: a.retestToleranceBps,
    retestToleranceAtr: a.retestToleranceAtr,
    invalidationBps: a.invalidationBps,
    maxCandidateAgeSeconds: a.maxCandidateAgeSeconds,
    lifecycleConfigHash: c
  });
}
function Ge(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const s = new Set(
      r.map((i) => ie(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && T(i) <= t && s.add(T(i));
    return [...s].sort((i, a) => i - a).map((i) => {
      var c;
      const a = Te(
        de(r, n, i),
        n,
        e.structureEvents ?? [],
        (c = e.config) == null ? void 0 : c.marketStructureOptions,
        i
      );
      return {
        timeframe: n,
        summary: { ...a.summary, updatedTs: i }
      };
    });
  });
}
const cr = "openTime";
function ie(e, t) {
  return (v(e.bucket) ?? v(e.ts) ?? 0) + Math.max(1, we(t));
}
function de(e, t, n) {
  return e.filter((r) => ie(r, t) <= n);
}
function Qe(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, a] of Object.entries(e.candlesByTimeframe))
    for (const c of a) t.add(ie(c, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(v(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(T(i));
  for (const i of e.avwapEvents ?? []) t.add(T(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(T(i));
  for (const i of e.supportResistanceZones ?? []) t.add(T(i));
  for (const i of e.evaluationPoints ?? []) {
    const a = v(i);
    a != null && t.add(a);
  }
  const n = [...t].filter(Number.isFinite).sort((i, a) => i - a), r = v(e.from) ?? n[0] ?? 0, s = v(e.to) ?? $(n) ?? r;
  return t.add(r), t.add(s), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= s).sort((i, a) => i - a);
}
function Ke(e, t) {
  return $([...e ?? []].filter((n) => (v(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (v(n.knownAt) ?? n.asOf) - (v(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function Te(e, t, n, r, s, i) {
  var f;
  const a = ee(e, r), c = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && T(d) <= s
  ), o = i ?? /* @__PURE__ */ new Map();
  for (const d of [...a.breaks, ...c])
    o.set(
      D(
        d.kind,
        t,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const l = [...o.values()].filter((d) => d.knownAt <= s).sort(
    (d, h) => d.knownAt - h.knownAt || d.eventTime - h.eventTime
  );
  if (!l.length) return a;
  const u = ((f = $(l)) == null ? void 0 : f.direction) ?? a.trend;
  return {
    swings: a.swings,
    breaks: l,
    trend: u,
    summary: Ce(a.swings, l, u)
  };
}
function Rt(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function Et(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = Pt(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), s = Dt(r, n);
  let i = Nt(r, e);
  if (!i && ne(e.extension ?? null)) {
    const a = Pe(t, e.asOf, e.executionTimeframe);
    a && (i = {
      index: a.index,
      candle: a.candle,
      eventTime: L(a.candle),
      knownAt: Math.min(
        e.asOf,
        B(t, a.index, e.executionTimeframe)
      ),
      metrics: Re(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, s.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? Ye(i, e, e.asOf, s) : Ze({
    checks: e.checks,
    asOf: e.asOf,
    updatedTs: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: "notCandidate",
    reason: "No active Impulse Fade v1 candidate",
    dataQuality: s,
    lifecycleConfigHash: e.lifecycleConfigHash
  });
}
function Pt(e, t, n, r, s) {
  if (s != null && s.length)
    return [...s].map((a) => {
      const c = v(a.knownAt) ?? a.asOf, o = Pe(e, c, r);
      if (!o || c > n) return null;
      const l = v(a.eventTime) ?? L(o.candle), u = Re(a.metrics);
      return {
        index: o.index,
        candle: o.candle,
        eventTime: l,
        knownAt: c,
        metrics: u,
        pass: ne(u),
        rollingReturnCount: Math.max(0, Math.trunc(a.sampleCount ?? 0))
      };
    }).filter((a) => a != null).sort((a, c) => a.knownAt - c.knownAt || a.eventTime - c.eventTime);
  const i = [];
  for (let a = 0; a < e.length; a += 1) {
    const c = e[a], o = B(e, a, r);
    if (o > n) continue;
    const l = ke(e.slice(0, a + 1), t), u = Ee(l);
    i.push({
      index: a,
      candle: c,
      eventTime: L(c),
      knownAt: o,
      metrics: u,
      pass: ne(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return i;
}
function Nt(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const a of e)
    a.pass && !r && n.push(a), r = a.pass;
  if (!n.length) return null;
  let s = n[0];
  for (const a of n.slice(1)) {
    const o = ((i = Ye(s, t, a.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    o != null && e.some((l) => l.knownAt > o && l.knownAt < a.knownAt && !l.pass) && (s = a);
  }
  return s;
}
function Ye(e, t, n, r) {
  const s = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", a = t.venue ?? "", c = t.executionTimeframe, o = xe(
    t.htfStructures ?? [],
    e.knownAt
  ).map((g) => ({
    timeframe: g.timeframe,
    state: g.summary.state,
    trend: g.summary.trend,
    transitionDirection: g.summary.transitionDirection,
    updatedTs: g.summary.updatedTs
  })), l = Vt({
    setupFamily: H,
    symbol: s,
    source: i,
    venue: a,
    executionTimeframe: c,
    detectedAt: e.knownAt
  }), u = [
    {
      id: D("candidate_detected", c, e.eventTime, e.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      sourceTimeframe: c,
      price: e.candle.c,
      contributesTo: "developing"
    }
  ], f = [
    {
      from: "notCandidate",
      to: "developing",
      knownAt: e.knownAt,
      evidenceIds: [u[0].id],
      evidenceCodes: [u[0].code],
      explanation: "Candidate episode detected"
    }
  ], d = _t(t, e, n), h = Ct(e, t, n);
  let m = "developing", y = e.knownAt, A = null, k = null, R = null, x = null, E = null;
  for (const g of h) {
    if (A != null) break;
    if (!(g.knownAt < e.knownAt || g.knownAt > n)) {
      if (g.lifecycleKind === "deterioration") {
        u.push({ ...g, contributesTo: "deteriorating" }), m === "developing" && (f.push(Y(m, "deteriorating", g)), m = "deteriorating", y = g.knownAt);
        continue;
      }
      if (g.lifecycleKind === "bearishBreak") {
        u.push({ ...g, contributesTo: "waitingForRetest" }), (m === "developing" || m === "deteriorating") && (f.push(Y(m, "waitingForRetest", g)), m = "waitingForRetest", y = g.knownAt, k = g.breakLevel ?? null);
        continue;
      }
      if (g.lifecycleKind === "retest") {
        m === "waitingForRetest" && k && g.relatedEventId === k.evidenceId && g.knownAt > k.knownAt && (u.push({ ...g, contributesTo: "entryCandidate" }), f.push(Y(m, "entryCandidate", g)), m = "entryCandidate", y = g.knownAt, R = g.breakLevel ?? k);
        continue;
      }
      if (g.lifecycleKind === "invalidation") {
        (m === "deteriorating" || m === "waitingForRetest" || m === "entryCandidate") && (u.push({ ...g, contributesTo: "invalidated" }), f.push(Y(m, "invalidated", g)), m = "invalidated", y = g.knownAt, A = g.knownAt, x = g.explanation);
        continue;
      }
      g.lifecycleKind === "expiry" && m !== "entryCandidate" && (u.push({ ...g, contributesTo: "expired" }), f.push(Y(m, "expired", g)), m = "expired", y = g.knownAt, A = g.knownAt, E = g.explanation);
    }
  }
  const N = tt(
    t.candles ?? [],
    e.eventTime,
    n,
    c
  ), S = {
    id: l,
    setupFamily: H,
    lifecycleVersion: q,
    lifecycleConfigHash: t.lifecycleConfigHash ?? K({
      extensionOptions: t.extensionOptions,
      resistanceNearPct: t.resistanceNearPct,
      retestNearPct: t.retestNearPct,
      retestToleranceBps: t.retestToleranceBps,
      retestToleranceAtr: t.retestToleranceAtr,
      invalidationBps: t.invalidationBps,
      maxCandidateAgeSeconds: t.maxCandidateAgeSeconds
    }),
    symbol: s,
    source: i,
    venue: a,
    executionTimeframe: c,
    detectedAt: e.knownAt,
    detectionEventTime: e.eventTime,
    detectionMetrics: e.metrics,
    initialMtfContext: o,
    episodeHigh: (N == null ? void 0 : N.price) ?? null,
    episodeHighTime: (N == null ? void 0 : N.eventTime) ?? null,
    currentState: m,
    stateSince: y,
    terminalAt: A
  };
  return {
    strategy: "pumpFade",
    setupFamily: H,
    lifecycleVersion: q,
    lifecycleConfigHash: S.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: c,
    state: m,
    currentState: m,
    stateSince: y,
    label: me(m),
    reason: Ht(m, u, f, x, E),
    checks: t.checks,
    updatedTs: n,
    candidate: S,
    evidence: u.sort((g, b) => g.knownAt - b.knownAt || g.eventTime - b.eventTime),
    transitions: f,
    pendingConditions: et(m, k),
    activeBreakLevel: k,
    retestLevel: R,
    confluence: d,
    invalidationReason: x,
    expiryReason: E,
    dataQuality: r
  };
}
function Ct(e, t, n) {
  const r = [], s = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = T(l);
    if (!J(l, e, n)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: D(f, s, l.eventTime, u, l.x),
      code: f,
      explanation: `${l.label}: bearish relative-strength deterioration`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      price: l.price,
      value: l.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const l of t.anchoredVwapSignals ?? []) {
    const u = T(l);
    l.kind !== "failedReclaim" || !J(l, e, n) || r.push({
      id: D("avwap_failed_reclaim", s, l.eventTime, u, l.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      price: l.price,
      level: l.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const i = Mt(t), a = [];
  for (const l of i) {
    const u = T(l);
    if (l.direction !== "bearish" || !J(l, e, n)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = D(f, s, l.eventTime, u, l.x), h = {
      level: l.level,
      sourceTimeframe: s,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: d
    }, m = {
      id: d,
      code: f,
      explanation: `${l.label} down through ${O(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: h
    };
    a.push(m), r.push(m);
  }
  for (const l of a) {
    const u = It(e, l, t, n);
    u && r.push(u);
  }
  for (const l of i) {
    const u = T(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !J(l, e, n))
      continue;
    const f = (t.candles ?? [])[l.index], d = tt(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      s
    ), h = C(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + h / 1e4) || r.push({
      id: D("bullish_continuation_invalidation", s, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${O(d.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const c = w(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), o = e.knownAt + c;
  return o <= n && r.push({
    id: D("candidate_expired", s, e.eventTime, o),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${jt(c)}`,
    eventTime: o,
    knownAt: o,
    sourceTimeframe: s,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function It(e, t, n, r) {
  var u;
  const s = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const a = C(n.retestToleranceBps, 0, 1e3, 35), c = C(n.retestToleranceAtr, 0, 10, 0.25), o = w((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = he(s, o);
  for (let f = 0; f < s.length; f += 1) {
    const d = s[f], h = B(s, f, n.executionTimeframe), m = L(d);
    if (h <= t.knownAt || m < t.knownAt || m < e.knownAt || h > r)
      continue;
    const y = l[f] ?? 0, A = Math.max(
      i.level * (a / 1e4),
      Number.isFinite(y) ? y * c : 0
    );
    if (d.h >= i.level - A && d.l <= i.level + A && d.c < i.level && d.c <= d.o)
      return {
        id: D(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          L(d),
          h,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${O(i.level)}`,
        eventTime: m,
        knownAt: h,
        sourceTimeframe: i.sourceTimeframe,
        price: d.c,
        level: i.level,
        relatedEventId: i.evidenceId,
        lifecycleKind: "retest",
        sortPriority: 40,
        breakLevel: i
      };
  }
  return null;
}
function _t(e, t, n) {
  const r = [], s = Ne(
    e.srZones.filter((c) => T(c) <= n),
    e.latestPrice,
    C(e.resistanceNearPct, 0, 10, 1.5)
  );
  s && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${O(s.low)}-${O(s.high)}`,
    eventTime: s.eventTime,
    knownAt: s.knownAt,
    sourceTimeframe: "MTF",
    level: s.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (c) => c.kind === "loss" && J(c, t, n)
  ).sort((c, o) => T(o) - T(c))[0];
  i && T(i) <= n && r.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: i.eventTime,
    knownAt: i.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: i.vwap
  });
  const a = v(e.avwapDistancePct);
  a != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${te(a, 1)}% from AVWAP`,
    value: a,
    sourceTimeframe: e.executionTimeframe
  });
  for (const c of xe(e.htfStructures, n))
    c.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${c.timeframe} structure`,
      detail: Ut(c.summary),
      eventTime: c.summary.updatedTs,
      knownAt: c.summary.updatedTs,
      sourceTimeframe: c.timeframe
    });
  return r;
}
function xe(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = v(r.summary.updatedTs);
    if (s != null && s > t) continue;
    const i = n.get(r.timeframe), a = v(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (s ?? -1 / 0) >= a) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function Mt(e) {
  var r, s, i;
  const t = (s = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && s.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((a) => {
    const c = `${a.kind}:${a.direction}:${a.x}:${a.level}:${T(a)}`;
    return n.has(c) ? !1 : (n.add(c), !0);
  });
}
function Ft(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && _e(e.htfResistance, e.htfStructures) ? "deteriorating" : _e(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function Ze(e) {
  return {
    strategy: "pumpFade",
    setupFamily: H,
    lifecycleVersion: q,
    lifecycleConfigHash: e.lifecycleConfigHash ?? K(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: me(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: et(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function Je(e, t = {}) {
  const n = sn(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let s = 0, i = 0;
  for (let a = n; a < e.length; a += 1) {
    const c = e[a];
    if (!c) continue;
    const o = (c.h + c.l + c.c) / 3;
    if (!I(o)) continue;
    const l = an(c, o);
    l <= 0 || (s += l, i += o * l, r.push(c.x, i / s));
  }
  return new Float32Array(r);
}
function or(e, t = {}) {
  const n = v(t.anchorBucket), r = v(t.anchorX), s = Je(e, t);
  if (s.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = s[s.length - 1], a = nt(e), c = a && I(i) ? (a.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: c,
    candle: a
  };
}
function lr(e, t = {}, n = 20) {
  const r = w(n, 1, 200, 20), s = Je(e, t);
  if (s.length < 4) return [];
  const i = new Map(e.map((o, l) => [o.x, { candle: o, index: l }])), a = [];
  let c = null;
  for (let o = 0; o < s.length; o += 2) {
    const l = s[o], u = s[o + 1], f = i.get(l);
    if (!f || !I(u) || !I(f.candle.c)) continue;
    const d = B(e, f.index), h = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    h && (c === "above" && h === "below" ? a.push(ge("loss", f.index, f.candle, u, d)) : c === "below" && h === "above" ? a.push(ge("reclaim", f.index, f.candle, u, d)) : c === "below" && h === "below" && f.candle.h >= u && f.candle.c < u && a.push(
      ge("failedReclaim", f.index, f.candle, u, d)
    ), c = h);
  }
  return a.slice(-r);
}
function Lt(e, t = {}) {
  const n = w(t.lookback, 20, 2e3, 500), r = w(t.pivotStrength, 1, 20, 3), s = w(t.atrPeriod, 2, 100, 14), i = C(t.minMoveAtr, 0, 10, 0.75), a = w(t.maxSwings, 1, 500, 120), c = Math.max(0, e.length - n), o = e.slice(c);
  if (o.length < r * 2 + 1) return [];
  const l = he(e, s), u = [];
  for (let d = r; d < o.length - r; d += 1) {
    const h = o[d], m = c + d, y = l[m] ?? null, A = B(e, m + r);
    vn(o, d, r) && u.push(Me("SwingHigh", m, h, h.h, y, A)), yn(o, d, r) && u.push(Me("SwingLow", m, h, h.l, y, A));
  }
  const f = [];
  for (const d of u) {
    const h = f[f.length - 1];
    if (!h) {
      f.push(d);
      continue;
    }
    if (h.kind === d.kind) {
      dn(d, h) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - h.price) >= mn(d, h, i) && f.push(d);
  }
  return cn(f).slice(-a);
}
function ee(e, t = {}) {
  const n = w(t.maxSwings, 1, 500, 120), r = w(t.maxBreaks, 1, 200, 24), s = Lt(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], a = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set();
  let o = 0, l = null, u = null, f = "neutral";
  for (let m = 0; m < e.length; m += 1) {
    const y = B(e, m);
    for (; o < s.length && s[o].index < m && s[o].knownAt <= y; ) {
      const k = s[o];
      k.kind === "SwingHigh" ? l = k : u = k, o += 1;
    }
    const A = e[m];
    if (l && !a.has(l.x) && A.c > l.price) {
      const k = f === "bearish" ? "StructureShift" : "StructureBreak";
      i.push(Fe(k, "bullish", m, A, l, y)), a.add(l.x), f = "bullish";
    }
    if (u && !c.has(u.x) && A.c < u.price) {
      const k = f === "bullish" ? "StructureShift" : "StructureBreak";
      i.push(Fe(k, "bearish", m, A, u, y)), c.add(u.x), f = "bearish";
    }
  }
  const d = s.slice(-n), h = i.slice(-r);
  return {
    swings: d,
    breaks: h,
    trend: f,
    summary: Ce(d, h, f)
  };
}
function ur(e) {
  var s;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Oe(t, "SwingHigh", "rangeHigh", null, !0),
      Oe(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((s = n.lastBreak) == null ? void 0 : s.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    le(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    le(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((i) => !!i) : r === "bearish" ? [
    le(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    le(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((i) => !!i) : [];
}
function fr(e, t = {}) {
  var o, l;
  const n = w(t.lookback, 20, 1e3, 240), r = w(t.pivotStrength, 1, 20, 3), s = w(t.maxZones, 1, 12, 6), i = C(t.thicknessBps, 1, 100, 10), a = ((o = e[e.length - 1]) == null ? void 0 : o.x) ?? 0, c = ee(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return Ot(c.swings, {
    maxZones: s,
    thicknessBps: i,
    latestX: a,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function Ot(e, t = {}) {
  var l;
  const n = w(t.maxZones, 1, 12, 6), r = C(t.thicknessBps, 1, 100, 10), s = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, i = v(t.referencePrice), a = t.zonesPerSide == null ? null : w(t.zonesPerSide, 1, 12, 3), c = [];
  for (const u of e)
    hn(
      c,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      s - u.x + 1,
      r
    );
  const o = c.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return gn(o, n, i, a);
}
function Bt(e, t) {
  const n = new Map(
    t.filter((a) => I(a.c)).map((a) => [a.bucket, a])
  );
  let r = null, s = null;
  const i = [];
  for (const a of e) {
    if (!I(a.c)) continue;
    const c = n.get(a.bucket);
    if (!c || !I(c.c)) continue;
    (r == null || s == null) && (r = a.c, s = c.c);
    const o = a.c / r / (c.c / s);
    i.push(a.x, (o - 1) * 100);
  }
  return new Float32Array(i);
}
function dr(e, t, n = {}) {
  var N;
  const r = w(n.maxDivergences, 1, 100, 16), s = C(n.minDeltaPct, 0, 50, 0.5), i = w(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), a = n.includeDivergences ?? !0, c = n.includeLeads ?? !0, o = n.includeBreaks ?? !0, l = Bt(e, t), u = Sn(l);
  if (!e.length || u.size < 2) return [];
  const d = (((N = e[e.length - 1]) == null ? void 0 : N.x) ?? 0) - i, h = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, m = ee(e, {
    ...h
  }), y = ln(e, l), A = ee(y, {
    ...h
  }), k = new Map(e.map((S, g) => [S.x, { candle: S, index: g }])), R = [];
  let x = null, E = null;
  for (const S of m.swings) {
    const g = u.get(S.x);
    if (!(g == null || !Number.isFinite(g))) {
      if (S.kind === "SwingHigh") {
        if (x) {
          const b = u.get(x.x);
          b != null && Number.isFinite(b) && (S.price > x.price && g <= b - s ? a && R.push(
            oe(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              S,
              x,
              g,
              b,
              m.summary.state,
              A.summary.state
            )
          ) : S.price < x.price && g >= b + s && c && R.push(
            oe(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              S,
              x,
              g,
              b,
              m.summary.state,
              A.summary.state
            )
          ));
        }
        x = S;
        continue;
      }
      if (E) {
        const b = u.get(E.x);
        b != null && Number.isFinite(b) && (S.price > E.price && g <= b - s ? c && R.push(
          oe(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            S,
            E,
            g,
            b,
            m.summary.state,
            A.summary.state
          )
        ) : S.price < E.price && g >= b + s && a && R.push(
          oe(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            S,
            E,
            g,
            b,
            m.summary.state,
            A.summary.state
          )
        ));
      }
      E = S;
    }
  }
  if (o)
    for (const S of A.breaks) {
      if (S.x < d) continue;
      const g = k.get(S.x), b = u.get(S.x);
      if (!g || b == null || !Number.isFinite(b)) continue;
      const _ = ee(e.slice(0, g.index + 1), {
        ...h,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      un(S.direction, _.summary.state) && R.push(
        on(
          S.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          S.direction,
          S.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          g.index,
          g.candle,
          b,
          S,
          _.summary.state,
          A.summary.state
        )
      );
    }
  return R.filter((S) => S.x >= d).sort((S, g) => S.x - g.x || Le(S.signal) - Le(g.signal)).slice(-r);
}
function mr(e) {
  return new Uint8Array(e.buffer);
}
function Re(e) {
  return {
    returnPct: v(e == null ? void 0 : e.returnPct),
    percentile: v(e == null ? void 0 : e.percentile),
    zScore: v(e == null ? void 0 : e.zScore),
    atrExtension: v(e == null ? void 0 : e.atrExtension)
  };
}
function Ee(e) {
  return {
    returnPct: v(e.returnPct),
    percentile: v(e.percentile),
    zScore: v(e.zScore),
    atrExtension: v(e.atrExtension)
  };
}
function ne(e) {
  const t = Re(e);
  return t.returnPct != null && t.returnPct >= Z.returnPct || t.percentile != null && t.percentile >= Z.percentile || t.zScore != null && t.zScore >= Z.zScore || t.atrExtension != null && t.atrExtension >= Z.atrExtension;
}
function Dt(e, t) {
  const n = [], r = w(t.minSamples, 1, 1e4, 20), s = e[e.length - 1] ?? null;
  return s ? s.rollingReturnCount < r && n.push(
    `Rolling-return history has ${s.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function Y(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function Ht(e, t, n, r, s) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return s ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const a = t.filter((o) => o.contributesTo === e), c = a[a.length - 1];
  return (c == null ? void 0 : c.explanation) ?? me(e);
}
function et(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${O(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
      ];
    case "entryCandidate":
      return ["Discretionary review; no simulated trade is generated yet"];
    case "notCandidate":
      return ["Candidate extension gate must cross from false to true"];
    case "invalidated":
    case "expired":
      return [];
  }
}
function Vt(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function D(e, t, n, r, s) {
  return [e, t, n, r, s ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function tt(e, t, n, r) {
  let s = null;
  for (let i = 0; i < e.length; i += 1) {
    const a = e[i], c = L(a);
    c < t || B(e, i, r) > n || Number.isFinite(a.h) && (!s || a.h > s.price) && (s = { price: a.h, eventTime: c });
  }
  return s;
}
function qt(e, t) {
  return e.length ? B(e, e.length - 1, t) : null;
}
function Pe(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (B(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function L(e) {
  const t = v(e.ts);
  return t ?? v(e.bucket) ?? 0;
}
function B(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? ie(r, n) : (v(r.bucket) ?? L(r)) + $t(e, t) : 0;
}
function $t(e, t) {
  var i, a, c;
  const n = v((i = e[t]) == null ? void 0 : i.bucket) ?? L(e[t]), r = v((a = e[t + 1]) == null ? void 0 : a.bucket);
  if (r != null && r > n) return r - n;
  const s = v((c = e[t - 1]) == null ? void 0 : c.bucket);
  return s != null && n > s ? n - s : 1;
}
function T(e) {
  return v(e.knownAt) ?? v(e.eventTime) ?? v(e.ts) ?? v(e.bucket) ?? 0;
}
function J(e, t, n) {
  const r = T(e), s = v(e.eventTime) ?? v(e.ts) ?? v(e.bucket) ?? r;
  return r > t.knownAt && r <= n && s >= t.knownAt;
}
function Ut(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function jt(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function I(e) {
  return Number.isFinite(e) && e > 0;
}
function zt(e) {
  const t = v(e == null ? void 0 : e.returnPct), n = v(e == null ? void 0 : e.percentile), r = v(e == null ? void 0 : e.zScore), s = v(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${te(t, 1)}%`,
    s == null ? null : `Ext ${te(s, 1)} ATR`,
    r == null ? null : `Z ${te(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((c) => !!c);
  return {
    key: "extension",
    label: "Extension",
    status: ne({ returnPct: t, percentile: n, zScore: r, atrExtension: s }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function Xt(e, t, n) {
  const r = Ne(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${O(r.low)}-${O(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Wt(e) {
  const t = [...e].reverse().find((n) => n.direction === "bearish");
  return t ? {
    key: "rsWeakness",
    label: "RS weakness",
    status: "pass",
    detail: t.label
  } : {
    key: "rsWeakness",
    label: "RS weakness",
    status: "pending",
    detail: "No bearish RS event"
  };
}
function Gt(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Qt(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = v(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${te(r, 1)}%`)
  };
}
function Kt(e, t, n, r) {
  var o;
  const s = v((o = e == null ? void 0 : e.lastBreak) == null ? void 0 : o.level), i = s != null && n != null && Zt(n, s) <= r, a = Ne(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || a) ? "pass" : "pending",
    detail: i ? `Retesting ${O(s)}` : a ? `Near R ${O(a.center)}` : "No retest yet"
  };
}
function Yt(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const s = v((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return s != null && r > s * 1.01;
}
function _e(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Ne(e, t, n) {
  return t == null || !I(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, s) => r.distance - s.distance || s.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function Zt(e, t) {
  return !I(e) || !I(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function me(e) {
  switch (e) {
    case "developing":
      return "Developing";
    case "deteriorating":
      return "Deteriorating";
    case "waitingForRetest":
      return "Waiting for Retest";
    case "entryCandidate":
      return "Entry Candidate";
    case "invalidated":
      return "Invalidated";
    case "expired":
      return "Expired";
    case "notCandidate":
      return "Not Candidate";
  }
}
function Jt(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : me(e);
}
function te(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function O(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function v(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function $(e) {
  return e[e.length - 1];
}
function nt(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (I(n.c)) return n;
  }
  return null;
}
function en(e) {
  return {
    candle: null,
    referenceCandle: null,
    windowSeconds: e,
    returnPct: null,
    percentile: null,
    zScore: null,
    rollingReturnCount: 0,
    ema: null,
    atr: null,
    atrExtension: null
  };
}
function rt(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let s = null;
  for (let i = r; i >= 0; i -= 1) {
    const a = e[i];
    if (a.bucket <= t && I(a.c)) {
      s = a;
      break;
    }
  }
  return s;
}
function tn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const s = e[r];
    if (s.bucket < t.earliestBucket || s.bucket >= t.excludeBucket || !I(s.c)) continue;
    const i = rt(e, s.bucket - t.windowSeconds, r);
    !i || !I(i.c) || n.push((s.c / i.c - 1) * 100);
  }
  return n;
}
function nn(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, s = n.filter((i) => i === t).length;
  return (r + s * 0.5) / n.length * 100;
}
function rn(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((a, c) => a + c, 0) / n.length, s = n.reduce((a, c) => a + (c - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(s);
  return i > 0 ? (t - r) / i : null;
}
function ge(e, t, n, r, s) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: L(n),
    knownAt: s
  };
}
function sn(e, t) {
  const n = t.anchorBucket == null ? null : Number(t.anchorBucket);
  if (n != null && Number.isFinite(n)) {
    const s = e.findIndex((i) => i.bucket >= n);
    return s >= 0 ? s : null;
  }
  const r = t.anchorX == null ? null : Number(t.anchorX);
  if (r != null && Number.isFinite(r)) {
    const s = e.findIndex((i) => i.x >= r);
    return s >= 0 ? s : null;
  }
  return null;
}
function an(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function Me(e, t, n, r, s, i) {
  return {
    kind: e,
    structure: e,
    label: e === "SwingHigh" ? "SH" : "SL",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: r,
    atr: s,
    eventTime: L(n),
    knownAt: i
  };
}
function cn(e) {
  let t = null, n = null;
  return e.map((r) => {
    if (r.kind === "SwingHigh") {
      const c = t == null ? "SwingHigh" : r.price > t.price ? "HigherHigh" : "LowerHigh", l = { ...r, structure: c, label: c === "SwingHigh" ? "SH" : c === "HigherHigh" ? "HH" : "LH" };
      return t = l, l;
    }
    const s = n == null ? "SwingLow" : r.price > n.price ? "HigherLow" : "LowerLow", a = { ...r, structure: s, label: s === "SwingLow" ? "SL" : s === "HigherLow" ? "HL" : "LL" };
    return n = a, a;
  });
}
function Fe(e, t, n, r, s, i) {
  return {
    kind: e,
    direction: t,
    label: e === "StructureBreak" ? "BOS" : "Shift",
    index: n,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    level: s.price,
    sourceSwingX: s.x,
    sourceSwingPrice: s.price,
    eventTime: L(r),
    knownAt: i
  };
}
function oe(e, t, n, r, s, i, a, c, o, l) {
  return {
    kind: e,
    signal: t,
    direction: n,
    label: r,
    index: s.index,
    x: s.x,
    ts: s.ts,
    bucket: s.bucket,
    price: s.price,
    previousPrice: i.price,
    rs: a,
    previousRs: c,
    priceLabel: s.label,
    sourceBreak: null,
    priceStructureState: o,
    rsStructureState: l,
    eventTime: s.eventTime,
    knownAt: Math.max(s.knownAt, i.knownAt)
  };
}
function on(e, t, n, r, s, i, a, c, o) {
  return {
    kind: e,
    signal: "break",
    direction: t,
    label: n,
    index: r,
    x: s.x,
    ts: s.ts,
    bucket: s.bucket,
    price: t === "bearish" ? s.l : s.h,
    previousPrice: null,
    rs: i,
    previousRs: a.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak: a,
    priceStructureState: c,
    rsStructureState: o,
    eventTime: a.eventTime,
    knownAt: a.knownAt
  };
}
function ln(e, t) {
  const n = new Map(e.map((i) => [i.x, i])), r = [];
  let s = null;
  for (let i = 0; i < t.length; i += 2) {
    const a = t[i], c = t[i + 1], o = n.get(a);
    if (!o || !Number.isFinite(c)) continue;
    const l = s ?? c;
    r.push({
      ...o,
      o: l,
      h: c,
      l: c,
      c,
      v_base: 0,
      v_quote: 0
    }), s = c;
  }
  return r;
}
function un(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Le(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function Ce(e, t, n) {
  const r = t[t.length - 1] ?? null, s = Se(e, "SwingHigh"), i = Se(e, "SwingLow"), a = e[e.length - 1] ?? null, c = fn(t), o = e.length === 0 ? "neutral" : r == null || c ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, l = o === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
  return {
    state: o,
    trend: n,
    transitionDirection: l,
    lastBreak: r,
    lastSwingHigh: s,
    lastSwingLow: i,
    updatedX: (r == null ? void 0 : r.x) ?? (a == null ? void 0 : a.x) ?? null,
    updatedTs: (r == null ? void 0 : r.knownAt) ?? (a == null ? void 0 : a.knownAt) ?? null
  };
}
function le(e, t, n, r, s) {
  for (let a = e.length - 1; a >= 0; a -= 1) {
    const c = e[a];
    if (c.kind === t && n.includes(c.structure))
      return pe(r, s, c);
  }
  const i = Se(e, t);
  return i ? pe(r, s, i) : null;
}
function Oe(e, t, n, r, s) {
  let i = null;
  for (const a of e)
    a.kind === t && (!i || (s ? a.price > i.price : a.price < i.price)) && (i = a);
  return i ? pe(n, r, i) : null;
}
function pe(e, t, n) {
  return {
    role: e,
    direction: t,
    price: n.price,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    eventTime: n.eventTime,
    knownAt: n.knownAt,
    sourceSwing: n
  };
}
function fn(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Se(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function dn(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function mn(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function he(e, t) {
  const n = W(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const s = e.map((a, c) => {
    if (c === 0) return a.h - a.l;
    const o = e[c - 1].c;
    return Math.max(
      a.h - a.l,
      Math.abs(a.h - o),
      Math.abs(a.l - o)
    );
  });
  let i = 0;
  for (let a = 0; a < n; a += 1) i += s[a];
  i /= n, r[n - 1] = i;
  for (let a = n; a < e.length; a += 1)
    i = (i * (n - 1) + s[a]) / n, r[a] = i;
  return r;
}
function hn(e, t, n, r, s) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const a = Math.max(i * (s / 1e4), Number.EPSILON), c = i - a, o = i + a, l = 1 / Math.max(1, r), u = e.find(
    (h) => h.kind === t && pn(h.low, h.high, c, o)
  );
  if (!u) {
    e.push({
      kind: t,
      low: c,
      high: o,
      center: i,
      touches: 1,
      score: 1 + l,
      strength: 1 + l,
      lastX: n.x,
      eventTime: n.eventTime,
      knownAt: n.knownAt,
      source: "swing",
      structures: [n.structure]
    });
    return;
  }
  const f = u.touches + 1;
  u.center = (u.center * u.touches + i) / f, u.touches = f, u.score += 1 + l, u.strength = u.score, u.lastX = Math.max(u.lastX, n.x), u.eventTime = Math.max(u.eventTime, n.eventTime), u.knownAt = Math.max(u.knownAt, n.knownAt), u.structures.push(n.structure);
  const d = Math.max(u.center * (s / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - d, c), u.high = Math.max(u.high, u.center + d, o);
}
function gn(e, t, n, r) {
  if (!n || !r) return e.slice(0, t);
  const s = /* @__PURE__ */ new Set(), i = e.filter((c) => c.center <= n).sort((c, o) => n - c.center - (n - o.center) || o.score - c.score).slice(0, r), a = e.filter((c) => c.center > n).sort((c, o) => c.center - n - (o.center - n) || o.score - c.score).slice(0, r);
  for (const c of [...i, ...a])
    s.add(c);
  for (const c of e) {
    if (s.size >= t) break;
    s.add(c);
  }
  return Array.from(s).sort((c, o) => o.score - c.score || o.touches - c.touches || o.lastX - c.lastX).slice(0, t);
}
function vn(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].h >= r || e[t + s].h > r) return !1;
  return !0;
}
function yn(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].l <= r || e[t + s].l < r) return !1;
  return !0;
}
function pn(e, t, n, r) {
  return e <= r && n <= t;
}
function Sn(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], s = e[n + 1];
    Number.isFinite(r) && Number.isFinite(s) && t.set(r, s);
  }
  return t;
}
function Ae(e, t) {
  const n = W(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const s = 2 / (n + 1);
  let i = 0;
  for (let a = 0; a < n; a++) i += e[a].c;
  i /= n, r[n - 1] = i;
  for (let a = n; a < e.length; a++)
    i = (e[a].c - i) * s + i, r[a] = i;
  return r;
}
function An(e, t) {
  const n = W(t);
  if (e.length < n) return [];
  const r = [], s = 2 / (n + 1);
  let i = 0;
  for (let a = 0; a < n; a++) i += e[a].value;
  i /= n, r.push({ x: e[n - 1].x, value: i });
  for (let a = n; a < e.length; a++)
    i = (e[a].value - i) * s + i, r.push({ x: e[a].x, value: i });
  return r;
}
function it(e, t) {
  const n = W(t);
  if (e.length <= n) return [];
  let r = 0, s = 0;
  for (let a = 1; a <= n; a++) {
    const c = e[a].c - e[a - 1].c;
    c >= 0 ? r += c : s += Math.abs(c);
  }
  r /= n, s /= n;
  const i = [
    { x: e[n].x, value: De(r, s) }
  ];
  for (let a = n + 1; a < e.length; a++) {
    const c = e[a].c - e[a - 1].c, o = Math.max(0, c), l = Math.max(0, -c);
    r = (r * (n - 1) + o) / n, s = (s * (n - 1) + l) / n, i.push({ x: e[a].x, value: De(r, s) });
  }
  return i;
}
function Be(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.value, i >= t && (r -= e[i - t].value), i >= t - 1 && n.push({ x: s.x, value: r / t });
  }), n;
}
function X(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function De(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function W(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function w(e, t, n, r) {
  return Math.floor(C(e, t, n, r));
}
function C(e, t, n, r) {
  const s = Number(e);
  return Number.isFinite(s) ? Math.max(t, Math.min(n, s)) : r;
}
const wn = "strategy-profile.1", st = "decision-snapshot.1", bn = "impulse_fade_v1.research.default", kn = "1";
function at(e) {
  const { profileHash: t, ...n } = e;
  return G(n);
}
function Tn(e) {
  if (re(e.createdAt, "createdAt"), e.setupFamily !== H || e.lifecycleVersion !== q || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [s, i] of Object.entries(e.timeframeRoles))
    if (s === "contextTimeframes") {
      if (!i.every((a) => a.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${s} cannot be blank`);
  if (He(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), He(
    e.riskPolicy.maximumMarginAllocationFraction,
    "maximum margin allocation"
  ), !Number.isInteger(e.targetPolicy.maximumTargets) || e.targetPolicy.maximumTargets < 1 || !Number.isFinite(e.targetPolicy.fractionTolerance) || e.targetPolicy.fractionTolerance < 0)
    throw new RangeError("Target policy limits are invalid");
  const t = [
    "activeCandidate",
    "entryCandidate",
    "confirmedRetest",
    "referenceIntegrity",
    "dataQuality",
    "risk",
    "margin",
    "rewardRisk"
  ], n = Object.values(e.entryPolicy.factors).flat();
  if (new Set(n).size !== n.length || t.some(
    (s) => !e.entryPolicy.factors.hardGate.includes(s)
  ))
    throw new RangeError(
      "Impulse Fade lifecycle 1 requires unique, supported hard-gate factor roles"
    );
  if (Object.values(e.executionAssumptions).some(
    (s) => !Number.isFinite(s) || s < 0
  ))
    throw new RangeError("Execution assumptions must be non-negative finite numbers");
  if (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4)
    throw new RangeError("Adverse-slippage allowances must be below 10,000 basis points");
  const r = V(e);
  return V({
    ...r,
    profileHash: at(r)
  });
}
function xn(e = {}) {
  var i, a;
  const t = {
    candidateTimeframe: "1h",
    structureTimeframe: "1h",
    executionTimeframe: "15m",
    triggerTimeframe: "15m",
    contextTimeframes: ["4h", "1d"],
    ...e.timeframeRoles
  }, n = {
    candidateMetricsRequired: !0,
    minimumHistoryCoverageRatio: 0.9,
    rejectedNoteSeverities: ["error"],
    ...(i = e.entryPolicy) == null ? void 0 : i.requiredDataQuality
  }, r = {
    hardGate: [
      "activeCandidate",
      "entryCandidate",
      "confirmedRetest",
      "referenceIntegrity",
      "dataQuality",
      "risk",
      "margin",
      "rewardRisk"
    ],
    contextualConfluence: ["higherTimeframeResistance", "relativeStrengthWeakness", "avwapFailure"],
    informational: ["stochRsi", "volume", "extensionBadges"],
    ...(a = e.entryPolicy) == null ? void 0 : a.factors
  }, s = {
    eligibleLifecycleStates: ["entryCandidate"],
    retestRequired: !0,
    confirmedRejectionRequired: !0,
    permittedOrderPlanTypes: [
      "marketNextAvailable",
      "limit",
      "stopMarket",
      "manualReference"
    ],
    maxAgeSinceEntryCandidateSeconds: 360 * 60,
    minimumRewardRisk: 1.5,
    ...e.entryPolicy,
    requiredDataQuality: n,
    factors: r
  };
  return Tn({
    schemaVersion: wn,
    id: e.id ?? bn,
    version: e.version ?? kn,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: H,
    lifecycleVersion: q,
    lifecycleConfigHash: e.lifecycleConfigHash ?? K(),
    side: "short",
    timeframeRoles: t,
    entryPolicy: s,
    stopPolicy: {
      permittedDerivations: [
        "episodeHigh",
        "structuralInvalidation",
        "supportResistanceZoneBoundary",
        "avwapReference",
        "manual"
      ],
      requireOutsideEpisodeHigh: !0,
      ...e.stopPolicy
    },
    targetPolicy: {
      permittedDerivations: [
        "supportZone",
        "avwap",
        "preImpulseBase",
        "fixedRMultiple",
        "manual"
      ],
      maximumTargets: 4,
      fractionTolerance: 1e-8,
      ...e.targetPolicy
    },
    riskPolicy: {
      maximumAccountRiskFraction: 0.01,
      maximumMarginAllocationFraction: 0.25,
      maximumNotional: null,
      ...e.riskPolicy
    },
    executionAssumptions: {
      entryFeeRate: 55e-5,
      stopExitFeeRate: 55e-5,
      targetExitFeeRate: 55e-5,
      adverseEntrySlippageBps: 5,
      adverseStopSlippageBps: 5,
      adverseTargetSlippageBps: 5,
      ...e.executionAssumptions
    },
    createdAt: e.createdAt ?? 1788393600
  });
}
const hr = xn();
function gr(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (In(e.price, "reference price"), re(e.eventTime, "reference eventTime"), re(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  return V({
    id: e.id,
    kind: e.kind,
    price: e.price,
    rangeLow: e.rangeLow ?? null,
    rangeHigh: e.rangeHigh ?? null,
    sourceTimeframe: e.sourceTimeframe ?? null,
    eventTime: e.eventTime,
    knownAt: e.knownAt,
    sourceObject: e.sourceObject
  });
}
function vr(e) {
  var i, a, c, o;
  if (re(e.decisionTime, "decisionTime"), re(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  const t = [...e.dataQualityNotes];
  Cn([
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ]);
  for (const l of e.lifecycle.dataQuality)
    t.push({
      code: "LIFECYCLE_DATA_QUALITY_NOTE",
      severity: "warning",
      message: l
    });
  const n = En(
    e.candidateMetrics,
    e.effectiveAsOf,
    e.symbol,
    e.lifecycle.candidate ?? null
  );
  e.candidateMetrics && !n && t.push({
    code: "CANDIDATE_METRICS_AFTER_CUTOFF",
    severity: "error",
    message: "Candidate metrics were not valid for the symbol, venue, or decision cutoff"
  });
  for (const l of (n == null ? void 0 : n.insufficientDataReasons) ?? [])
    t.push({
      code: `CANDIDATE_METRICS_${l.code}`,
      severity: "error",
      message: l.message
    });
  const r = {
    snapshotSchemaVersion: st,
    symbol: e.symbol.toUpperCase(),
    source: e.source,
    decisionTime: e.decisionTime,
    effectiveAsOf: e.effectiveAsOf,
    setupFamily: e.lifecycle.setupFamily,
    lifecycleVersion: e.lifecycle.lifecycleVersion,
    lifecycleConfigHash: e.lifecycle.lifecycleConfigHash,
    strategyProfileId: e.strategyProfile.id,
    strategyProfileVersion: e.strategyProfile.version,
    strategyProfileHash: e.strategyProfile.profileHash,
    candidateEpisode: ((i = e.lifecycle.candidate) == null ? void 0 : i.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate : null,
    activeCandidateId: ((a = e.lifecycle.candidate) == null ? void 0 : a.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate.id : null,
    lifecycleState: e.lifecycle.currentState,
    lifecycleStateSince: e.lifecycle.stateSince,
    lifecycleEvidence: ye(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: Pn(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: ve(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: ve(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((c = e.avwapState) == null ? void 0 : c.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: ye(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((o = e.relativeStrengthState) == null ? void 0 : o.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: ye(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: ve(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, s = ct(r);
  return V({ ...r, id: s });
}
function ct(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${G(n).slice(8)}`;
}
function Rn(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const s = n.get(r.id);
    if (s && M(s) !== M(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function En(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function Pn(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      Nn(r) <= t ? r : null
    ])
  );
}
function ve(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function ye(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || G(n).localeCompare(G(r))
  );
}
function Nn(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function Cn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && M(r) !== M(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function re(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function In(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function He(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const _n = "linear-quote-perpetual-risk.1", Mn = "sizing-result.1", Fn = "trade-plan.1", Ln = "decision-record.1";
function ot(e) {
  const t = [], n = [
    z(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(z("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
    e.intendedEntryPrice,
    e.stopPrice,
    e.accountState.equity,
    e.riskRequest.maximumMarginAllocationFraction,
    e.venueRules.quantityStep,
    e.venueRules.maxLeverage,
    e.venueRules.priceTick,
    e.venueRules.leverageStep,
    e.venueRules.minQuantity,
    e.venueRules.minNotional
  ].some((P) => !Number.isFinite(P) || P <= 0) && t.push(z("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(z("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && p(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!ue(e.intendedEntryPrice, e.venueRules.priceTick) || !ue(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (P) => !ue(P.targetPrice, e.venueRules.priceTick)
  )) && p(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !ue(e.leveragePolicy.leverage, e.venueRules.leverageStep) && p(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    z(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const s = e.riskRequest.accountRiskFraction != null, i = e.riskRequest.fixedRiskAmount != null;
  s === i && t.push(
    z(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (s && (!F(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!F(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && p(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (P) => !Number.isFinite(P) || P < 0
  ) && p(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && p(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const a = i ? e.riskRequest.fixedRiskAmount : s ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (a == null || !Number.isFinite(a) || a <= 0) && p(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Bn(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const c = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), o = F(c) ? c : null, l = F(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = o != null && l != null ? l - o + o * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && p(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = a != null && u != null && u > 0 ? a / u : null;
  let d = f == null ? null : Ve(f, e.venueRules.quantityStep);
  if (d != null && a != null && u != null)
    for (; d > 0 && d * u > a + Math.max(1e-10, a * 1e-12); )
      d = Ve(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const h = d != null && d > 0 ? d : null, m = h == null ? null : h * e.intendedEntryPrice, y = h == null || o == null ? null : h * o * e.executionAssumptions.entryFeeRate, A = h == null || l == null ? null : h * l * e.executionAssumptions.stopExitFeeRate, k = h == null || u == null ? null : h * u;
  (h == null || h < e.venueRules.minQuantity) && p(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (m == null || m < e.venueRules.minNotional) && p(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const R = e.riskRequest.maximumNotional;
  R != null && m != null && m > R && p(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${R}`
  );
  const x = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, E = e.accountState.availableBalance == null ? x : Math.min(x, e.accountState.availableBalance), N = m != null && E > 0 ? m / E : null, S = Un(
    e.leveragePolicy,
    N,
    e.venueRules.leverageStep
  );
  S != null && S > e.venueRules.maxLeverage && p(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${S} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const g = m != null && S != null && S > 0 ? m / S : null;
  g != null && g > x + 1e-10 && p(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), g != null && e.accountState.availableBalance != null && g > e.accountState.availableBalance + 1e-10 && p(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const b = h != null && o != null && l != null ? h * (l - o) : null, _ = Dn(
    e.targets,
    h,
    o,
    b,
    k,
    e.executionAssumptions
  ), se = fe(
    _.map((P) => P.grossReward * P.positionFraction)
  ), ae = fe(
    _.map((P) => P.netProjectedReward * P.positionFraction)
  ), ce = fe(
    _.map(
      (P) => P.weightedGrossRContribution == null ? null : P.weightedGrossRContribution
    )
  ), U = fe(
    _.map(
      (P) => P.weightedRContribution == null ? null : P.weightedRContribution
    )
  );
  return V({
    schemaVersion: Mn,
    sizingModelVersion: _n,
    side: e.side,
    riskBudget: a,
    rawQuantity: f,
    roundedQuantity: h,
    effectiveEntry: o,
    effectiveStop: l,
    stopDistanceAbsolute: o == null || l == null ? null : l - o,
    stopDistancePercent: o == null || l == null ? null : (l - o) / o * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: m,
    estimatedEntryFee: y,
    estimatedStopFee: A,
    projectedLossAtStop: k,
    projectedLossPercentEquity: k == null || e.accountState.equity <= 0 ? null : k / e.accountState.equity * 100,
    selectedLeverage: S,
    minimumRequiredLeverage: N,
    initialMargin: g,
    marginPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    marginPercentAvailableBalance: g == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : g / e.accountState.availableBalance * 100,
    targetOutcomes: _,
    weightedGrossReward: se,
    weightedProjectedReward: ae,
    weightedGrossR: ce,
    weightedProjectedR: U,
    liquidationStatus: {
      status: "unavailable",
      exactPrice: null,
      modelVersion: null,
      reason: "EXACT_LIQUIDATION_MODEL_UNAVAILABLE"
    },
    hardErrors: t,
    warnings: n
  });
}
function yr(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = ot({
    side: "short",
    intendedEntryPrice: e.entryPlan.intendedPrice,
    stopPrice: e.stopPlan.stopPrice,
    targets: e.targetPlans,
    accountState: e.accountState,
    riskRequest: e.riskRequest,
    executionAssumptions: e.strategyProfile.executionAssumptions,
    venueRules: e.venueRules,
    leveragePolicy: e.leveragePolicy,
    stopDistanceAtr: e.stopDistanceAtr,
    targetFractionTolerance: e.strategyProfile.targetPolicy.fractionTolerance
  }), n = {
    schemaVersion: Fn,
    snapshotId: e.snapshot.id,
    setupFamily: H,
    lifecycleVersion: q,
    lifecycleConfigHash: e.snapshot.lifecycleConfigHash,
    strategyProfileId: e.strategyProfile.id,
    strategyProfileVersion: e.strategyProfile.version,
    strategyProfileHash: e.strategyProfile.profileHash,
    side: "short",
    entryPlan: e.entryPlan,
    stopPlan: e.stopPlan,
    targetPlans: [...e.targetPlans],
    accountState: e.accountState,
    riskRequest: e.riskRequest,
    sizingResult: t,
    venueRules: e.venueRules,
    leveragePolicy: e.leveragePolicy,
    executionAssumptions: e.strategyProfile.executionAssumptions,
    discretionaryOverrideReason: ((i = e.discretionaryOverrideReason) == null ? void 0 : i.trim()) || null,
    status: e.status,
    createdAt: e.createdAt
  }, r = { ...n, id: e.id ?? lt(n) }, s = On({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return V({ ...r, complianceResult: s });
}
function On(e) {
  var d, h, m;
  const { strategyProfile: t, snapshot: n, plan: r } = e, s = [...r.sizingResult.hardErrors], i = [], a = [...r.sizingResult.warnings], c = ot({
    side: r.side,
    intendedEntryPrice: r.entryPlan.intendedPrice,
    stopPrice: r.stopPlan.stopPrice,
    targets: r.targetPlans,
    accountState: r.accountState,
    riskRequest: r.riskRequest,
    executionAssumptions: r.executionAssumptions,
    venueRules: r.venueRules,
    leveragePolicy: r.leveragePolicy,
    stopDistanceAtr: r.sizingResult.stopDistanceAtr,
    targetFractionTolerance: t.targetPolicy.fractionTolerance
  });
  (at(t) !== t.profileHash || ct(n) !== n.id || lt(r) !== r.id || M(c) !== M(r.sizingResult)) && p(
    s,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (d = n.candidateEpisode) != null && d.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && p(
    s,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== st || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || M(r.executionAssumptions) !== M(t.executionAssumptions)) && p(
    s,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(r.entryPlan.orderPlanType) || p(
    i,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${r.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(r.stopPlan.derivationType) || p(
    i,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${r.stopPlan.derivationType} is not permitted`
  );
  for (const y of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(y.derivationType) || p(
      i,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${y.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && p(
    i,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const o = r.targetPlans.reduce(
    (y, A) => y + A.positionFraction,
    0
  );
  Math.abs(o - 1) > t.targetPolicy.fractionTolerance && p(
    s,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), qn(n, r, s), $n(r, s), Hn(n, t, i), Vn(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((h = n.candidateEpisode) == null ? void 0 : h.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && p(
    i,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), r.sizingResult.initialMargin != null && r.sizingResult.initialMargin > r.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && p(
    i,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && r.sizingResult.grossNotional != null && r.sizingResult.grossNotional > t.riskPolicy.maximumNotional && p(
    i,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && r.sizingResult.weightedProjectedR != null && r.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && p(
    i,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${r.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), r.sizingResult.projectedLossAtStop != null && r.sizingResult.projectedLossAtStop > r.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && p(
    i,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = i.some((y) => y.code === "NO_ACTIVE_CANDIDATE"), u = ((m = r.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  r.status === "finalized" && i.length > 0 && !l && !u && p(
    s,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return s.length > 0 ? f = "InvalidPlan" : l ? f = "OutOfStrategy" : i.length === 0 ? f = "Compliant" : u ? f = "Overridden" : f = "OutOfStrategy", V({
    classification: f,
    hardErrors: s,
    strategyViolations: i,
    warnings: a,
    overrideReason: u
  });
}
function pr(e) {
  var r, s;
  if (!Number.isFinite(e.decisionTime) || e.decisionTime < 0)
    throw new RangeError("Decision time must be a non-negative finite Unix timestamp");
  if (e.decisionTime !== e.snapshot.decisionTime)
    throw new RangeError("Decision record time must match its frozen snapshot");
  if (e.confidence != null && (!Number.isFinite(e.confidence) || e.confidence < 0 || e.confidence > 1))
    throw new RangeError("Decision confidence must be between 0 and 1");
  if (e.action === "Skip" && !e.skipReason)
    throw new TypeError("Skip decisions require a structured skipReason");
  if (e.action === "ProposeTrade" && !e.tradePlan)
    throw new TypeError("ProposeTrade decisions require a tradePlan");
  if (e.action === "Wait" && (e.skipReason || e.tradePlan) || e.action === "Skip" && e.tradePlan || e.action === "ProposeTrade" && e.skipReason)
    throw new TypeError("Decision action contains an incompatible payload");
  if (e.tradePlan && e.tradePlan.snapshotId !== e.snapshot.id)
    throw new RangeError("Decision trade plan must reference the same snapshot");
  const t = {
    schemaVersion: Ln,
    sessionId: e.sessionId ?? null,
    snapshotId: e.snapshot.id,
    decisionTime: e.decisionTime,
    action: e.action,
    confidence: e.confidence ?? null,
    thesis: ((r = e.thesis) == null ? void 0 : r.trim()) || null,
    tags: [...e.tags ?? []],
    nextCondition: ((s = e.nextCondition) == null ? void 0 : s.trim()) || null,
    skipReason: e.skipReason ?? null,
    tradePlan: e.tradePlan ?? null
  }, n = e.id ?? `decision:${G(t).slice(8)}`;
  return V({ ...t, id: n });
}
function Bn(e, t, n, r) {
  (!e.length || e.some((i) => i.targetPrice >= t)) && p(r, "NO_VALID_TARGET", "Every short target must be below entry");
  const s = e.reduce((i, a) => i + a.positionFraction, 0);
  (e.some(
    (i) => !Number.isFinite(i.positionFraction) || i.positionFraction <= 0
  ) || Math.abs(s - 1) > n) && p(
    r,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function Dn(e, t, n, r, s, i) {
  return t == null || n == null ? [] : e.map((a) => {
    const c = a.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), o = t * (n - c), l = t * n * i.entryFeeRate, u = t * c * i.targetExitFeeRate, f = o - l - u, d = r != null && r > 0 ? o / r : null, h = s != null && s > 0 ? f / s : null;
    return {
      targetId: a.id,
      targetPrice: a.targetPrice,
      effectiveTargetPrice: c,
      positionFraction: a.positionFraction,
      grossReward: o,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: f,
      grossR: d,
      projectedR: h,
      weightedGrossRContribution: d == null ? null : d * a.positionFraction,
      weightedRContribution: h == null ? null : h * a.positionFraction
    };
  });
}
function Hn(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    p(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (p(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && p(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && p(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const s = e.lifecycleEvidence.some(
    (i) => i.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !s && p(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && p(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function Vn(e, t, n) {
  var o;
  const r = t.entryPolicy.requiredDataQuality, s = r.candidateMetricsRequired && e.candidateMetrics == null, i = ((o = e.candidateMetrics) == null ? void 0 : o.historyCoverage.coverageRatio) ?? null, a = r.minimumHistoryCoverageRatio != null && (i == null || i < r.minimumHistoryCoverageRatio), c = e.dataQualityNotes.some(
    (l) => r.rejectedNoteSeverities.includes(l.severity)
  );
  (s || a || c) && p(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function qn(e, t, n) {
  const r = new Map(
    Rn(e).map((i) => [i.id, i])
  ), s = [
    {
      requiresReference: !1,
      id: t.entryPlan.associatedReferenceLevelId,
      reference: t.entryPlan.associatedReferenceLevel
    },
    {
      requiresReference: t.stopPlan.derivationType !== "manual",
      id: t.stopPlan.referenceLevelId,
      reference: t.stopPlan.referenceLevel
    },
    ...t.targetPlans.map((i) => ({
      requiresReference: i.derivationType !== "manual" && i.derivationType !== "fixedRMultiple",
      id: i.referenceLevelId,
      reference: i.referenceLevel
    }))
  ];
  for (const i of s) {
    if (!i.id && !i.reference && !i.requiresReference) continue;
    if (!i.id || !i.reference) {
      p(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    i.reference.knownAt > e.effectiveAsOf && p(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${i.id} was not known at the decision cutoff`
    );
    const a = r.get(i.id);
    a ? M(a) !== M(i.reference) && p(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${i.id} differs from the frozen snapshot object`
    ) : p(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${i.id} is absent from the decision snapshot`
    );
  }
}
function $n(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && p(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const s = e.stopPlan.referenceLevel;
  if (s && e.stopPlan.derivationType !== "manual") {
    const i = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? s.rangeHigh ?? s.price : s.price, { basisPoints: a, atrFraction: c, atrValue: o } = e.stopPlan.buffer;
    let l = i;
    a != null && c != null ? p(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : a != null ? l = i * (1 + a / 1e4) : c != null && (F(o ?? 0) ? l = i + c * (o ?? 0) : p(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && p(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const i of e.targetPlans) {
    const a = i.referenceLevel;
    if (!a || i.derivationType === "manual" || i.derivationType === "fixedRMultiple")
      continue;
    (i.derivationType === "supportZone" ? i.targetPrice >= (a.rangeLow ?? a.price) - n && i.targetPrice <= (a.rangeHigh ?? a.price) + n : Math.abs(i.targetPrice - a.price) <= n + 1e-12) || p(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${i.id} does not match its frozen reference`
    );
  }
}
function Un(e, t, n) {
  return e.mode === "manual" ? F(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, jn(t, n));
}
function lt(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${G(r).slice(8)}`;
}
function Ve(e, t) {
  if (!F(e) || !F(t)) return 0;
  const n = ut(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function jn(e, t) {
  if (!F(e) || !F(t)) return e;
  const n = ut(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function ut(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function ue(e, t) {
  if (!Number.isFinite(e) || !F(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function fe(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function F(e) {
  return Number.isFinite(e) && e > 0;
}
function z(e, t) {
  return { code: e, message: t };
}
function p(e, t, n) {
  e.some((r) => r.code === t) || e.push(z(t, n));
}
export {
  cr as CANDLE_TIMESTAMP_SEMANTICS,
  Ln as DECISION_RECORD_SCHEMA_VERSION,
  st as DECISION_SNAPSHOT_SCHEMA_VERSION,
  hr as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Z as IMPULSE_FADE_CANDIDATE_GATE,
  wt as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  q as IMPULSE_FADE_LIFECYCLE_VERSION,
  bn as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  kn as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  H as IMPULSE_FADE_SETUP_FAMILY,
  _n as SIZING_MODEL_VERSION,
  Mn as SIZING_RESULT_SCHEMA_VERSION,
  wn as STRATEGY_PROFILE_SCHEMA_VERSION,
  Fn as TRADE_PLAN_SCHEMA_VERSION,
  Kn as appendSyntheticCandle,
  Q as bucketStart,
  ot as calculateLinearPerpetualSizing,
  ie as candleCloseTime,
  Ie as candleToBytes,
  ft as candlesToBytes,
  G as canonicalHash,
  M as canonicalSerialize,
  Je as computeAnchoredVwapLine,
  lr as computeAnchoredVwapSignals,
  or as computeAnchoredVwapSnapshot,
  ir as computeAtrLine,
  er as computeBollingerBands,
  Wn as computeCloseChangePct,
  Zn as computeEmaLine,
  ke as computeExtensionSnapshot,
  rr as computeMacd,
  ee as computeMarketStructure,
  Bt as computeRelativeCumulativeReturnLine,
  dr as computeRelativeStrengthDivergences,
  tr as computeRsiLine,
  bt as computeSetupState,
  Yn as computeSmaLine,
  nr as computeStochRsi,
  ur as computeStructureActiveLevels,
  fr as computeSupportResistanceZones,
  Ot as computeSupportResistanceZonesFromSwings,
  Lt as computeSwingPoints,
  Gn as computeViewBounds,
  Jn as computeWmaLine,
  pr as createDecisionRecord,
  gr as createDecisionReferenceLevel,
  vr as createDecisionSnapshot,
  xn as createImpulseFadeResearchProfile,
  Tn as createStrategyProfile,
  yr as createTradePlan,
  ct as decisionSnapshotId,
  Rn as decisionSnapshotReferenceLevels,
  ar as evaluateImpulseFadeSnapshot,
  sr as evaluateImpulseFadeTimeline,
  On as evaluateTradePlanCompliance,
  V as immutableJsonClone,
  K as impulseFadeLifecycleConfigHash,
  mr as lineToBytes,
  Qn as makeSyntheticCandles,
  dt as mergeLiveCandle,
  qe as normalizeOhlcvPoint,
  zn as normalizeRestTimeframe,
  $e as packHistoricalCandles,
  Xn as prependHistoricalCandles,
  at as strategyProfileHash,
  we as timeframeToSeconds,
  lt as tradePlanId
};
