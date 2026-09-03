function J(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function jr(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ee(e, t) {
  return Math.floor(e / t) * t;
}
function Je(e) {
  const t = rt(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = Lt(n.ts), s = W(n.o), i = W(n.h), o = W(n.l), a = W(n.c);
  return r == null || s == null || i == null || o == null || a == null ? null : {
    ts: r,
    o: s,
    h: i,
    l: o,
    c: a,
    v_base: W(n.v_base),
    v_quote: W(n.v_quote),
    ver: W(n.ver)
  };
}
function et(e, t, n) {
  const r = J(t), s = Ft(
    e.map((a, c) => tt(a, c)).filter((a) => a != null),
    r
  ).slice(-Math.max(1, n));
  if (!s.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const i = ee(s[0].ts, r), o = s.map((a) => {
    const c = ee(a.ts, r);
    return {
      ...a,
      bucket: c,
      x: (c - i) / r
    };
  });
  return Ne({
    timeframeSec: r,
    firstBucket: i,
    candles: o,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Gr(e, t, n) {
  const r = e.candles.length, s = t.map((o, a) => tt(o, a)).filter((o) => o != null).filter((o) => ee(o.ts, e.timeframeSec) < e.firstBucket).sort(nt);
  if (!s.length) return 0;
  const i = et(
    [...s, ...e.candles],
    n,
    s.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function It(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function He(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function Qr(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function _t(e, t, n, r = 3) {
  const s = Je(t);
  if (!s) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = ee(s.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const o = e.positionByBucket.get(i), a = (i - e.firstBucket) / e.timeframeSec, c = { ...s, bucket: i, x: a };
  if (o != null)
    return Vt(c, e.candles[o]) ? { kind: "ignore", reason: "stale-version" } : Ht(e.candles[o], c) ? (e.candles[o] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[o] = c, {
      kind: "replace",
      position: o,
      bytes: He(c)
    });
  const l = e.candles[e.candles.length - 1];
  return i <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - l.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Mt(e), { kind: "reset", bytes: It(e.candles) }) : (Ne(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: He(c)
  }));
}
function Xr(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, r = -1 / 0;
  for (const o of e)
    n = Math.min(n, o.l), r = Math.max(r, o.h);
  for (const o of t)
    for (let a = 1; a < o.length; a += 2) {
      const c = o[a];
      Number.isFinite(c) && (n = Math.min(n, c), r = Math.max(r, c));
    }
  const i = Math.max(1e-9, r - n) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: n - i,
    maxY: r + i
  };
}
function Wr(e, t, n) {
  const r = J(n), s = Math.floor(Date.now() / 1e3), i = ee(s, r), o = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), a = [];
  let c = 40 + o % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = i - l * r, d = Math.sin((t - l + o) / 9) * 0.8, f = c, h = Math.max(1e-4, f + d + Math.cos((t - l) / 13) * 0.35), m = Math.max(f, h) + 0.35 + Math.abs(Math.sin(l + o)) * 0.5, y = Math.min(f, h) - 0.35 - Math.abs(Math.cos(l + o)) * 0.5, b = 50 + o % 90 + Math.abs(Math.sin((t - l + o) / 5)) * 180;
    a.push({ ts: u, o: f, h: m, l: y, c: h, v_base: b, v_quote: b * h }), c = h;
  }
  return et(a, n, t);
}
function Kr(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, s = Math.sin(r / 600) * 0.7, i = n.c, o = Math.max(1e-4, i + s), a = Math.max(i, o) + 0.5, c = Math.min(i, o) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(s) * 0.36));
  return _t(e, { ts: r, o: i, h: a, l: c, c: o, v_base: l, v_quote: l * o }, t);
}
function Mt(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  Ne(e);
}
function Ne(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function tt(e, t) {
  const n = Je(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function Ft(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = ee(r.ts, t), i = n.get(s);
    (!i || nt(r, i) > 0) && n.set(s, r);
  }
  return Array.from(n.entries()).sort(([r], [s]) => r - s).map(([, r]) => Ot(r));
}
function nt(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function Ot(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function Lt(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? Bt(e) : Dt(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function Bt(e) {
  const [
    t,
    n = 1,
    r = 0,
    s = 0,
    i = 0,
    o = 0,
    a = 0,
    c = 0,
    l = 0
  ] = e, u = Math.floor(Number(o) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(r) - Number(a),
    Number(s) - Number(c),
    Number(i) - Number(l),
    u
  );
}
function Dt(e) {
  const [t, n = 1, r = 1, s = 0, i = 0, o = 0, a = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(r),
    Number(s),
    Number(i),
    Number(o),
    Number(a)
  );
}
function Ht(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function Vt(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function W(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function rt(e) {
  if (typeof e == "string")
    try {
      return rt(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
function L(e) {
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
    let o;
    return Array.isArray(s) ? o = `[${s.map((a) => n(a, !0) ?? "null").join(",")}]` : o = `{${Object.keys(s).sort().flatMap((c) => {
      const l = n(s[c]);
      return l == null ? [] : [`${JSON.stringify(c)}:${l}`];
    }).join(",")}}`, t.delete(s), o;
  }
  const r = n(e);
  if (r == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return r;
}
function F(e) {
  const t = new TextEncoder().encode(L(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function N(e) {
  return it(JSON.parse(L(e)));
}
function it(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) it(t);
    Object.freeze(e);
  }
  return e;
}
const G = "impulse_fade_v1", $ = "impulse_fade_v1.lifecycle.1", qt = "impulse_fade_v1.lifecycle-config.1", ie = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function Zr(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(s.x, r / t);
  }), new Float32Array(n);
}
function Yr(e, t = 20) {
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
function Jr(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = t * (t + 1) / 2;
  for (let s = t - 1; s < e.length; s++) {
    let i = 0;
    for (let o = 0; o < t; o++)
      i += e[s - t + 1 + o].c * (o + 1);
    n.push(e[s].x, i / r);
  }
  return new Float32Array(n);
}
function ei(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const r = [], s = [], i = [];
  let o = 0, a = 0;
  return e.forEach((c, l) => {
    if (o += c.c, a += c.c * c.c, l >= t) {
      const u = e[l - t].c;
      o -= u, a -= u * u;
    }
    if (l >= t - 1) {
      const u = o / t, d = Math.max(0, a / t - u * u), f = Math.sqrt(d) * n;
      r.push(c.x, u), s.push(c.x, u + f), i.push(c.x, u - f);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(s),
    lower: new Float32Array(i)
  };
}
function ti(e, t = 14) {
  return Z(yt(e, t));
}
function ni(e, t = 14, n = 14, r = 3, s = 3) {
  const i = yt(e, t), o = Y(n);
  if (i.length < o)
    return { k: new Float32Array(), d: new Float32Array() };
  const a = [];
  for (let u = o - 1; u < i.length; u++) {
    let d = 1 / 0, f = -1 / 0;
    for (let y = 0; y < o; y++) {
      const b = i[u - y].value;
      d = Math.min(d, b), f = Math.max(f, b);
    }
    const h = f - d, m = h > 0 ? (i[u].value - d) / h * 100 : 50;
    a.push({ x: i[u].x, value: m });
  }
  const c = je(a, Y(r)), l = je(c, Y(s));
  return {
    k: Z(c),
    d: Z(l)
  };
}
function ri(e, t = 12, n = 26, r = 9) {
  const s = Ce(e, t), i = Ce(e, n), o = [];
  for (let u = 0; u < e.length; u++) {
    const d = s[u], f = i[u];
    d == null || f == null || o.push({ x: e[u].x, value: d - f });
  }
  const a = Vn(o, r), c = new Map(o.map((u) => [u.x, u.value])), l = a.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: Z(o),
    signal: Z(a),
    histogram: Z(l)
  };
}
function ii(e, t = 14) {
  const n = Ae(e, t), r = [];
  return n.forEach((s, i) => {
    s != null && r.push({ x: e[i].x, value: s });
  }), Z(r);
}
function Ie(e, t = {}) {
  const n = T(t.windowSeconds, 60, 2592e3, 86400), r = T(t.historyDays, 1, 365, 180), s = T(t.minSamples, 1, 5e3, 20), i = T(t.emaPeriod, 2, 500, 20), o = T(t.atrPeriod, 2, 500, 14), a = ht(e);
  if (!a)
    return An(n);
  const c = e.indexOf(a), l = vt(e, a.bucket - n, c), u = l && _(l.c) ? (a.c / l.c - 1) * 100 : null, d = u == null ? [] : wn(e, {
    windowSeconds: n,
    earliestBucket: a.bucket - r * 86400,
    excludeBucket: a.bucket
  }), f = u != null && d.length >= s ? Rn(d, u) : null, h = u != null && d.length >= s ? Tn(d, u) : null, m = Ce(e, i)[c] ?? null, y = Ae(e, o)[c] ?? null, b = m != null && y != null && Number.isFinite(m) && Number.isFinite(y) && y > 0 ? (a.c - m) / y : null;
  return {
    candle: a,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: f,
    zScore: h,
    rollingReturnCount: d.length,
    ema: m,
    atr: y,
    atrExtension: b
  };
}
function $t(e = {}) {
  var fe, de, me;
  const t = e.executionTimeframe ?? "chart", n = g(e.asOf), r = g(e.latestTs) ?? cn(e.candles ?? [], t) ?? g((fe = e.structure) == null ? void 0 : fe.updatedTs) ?? g((de = e.marketStructure) == null ? void 0 : de.summary.updatedTs) ?? null, s = n ?? r, i = s == null ? null : Le(e.candles ?? [], s, t), o = (i == null ? void 0 : i.candle.c) ?? g(e.latestPrice), a = Ut(e.marketStructure ?? null, n), c = (a == null ? void 0 : a.summary) ?? zt(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : Me(e.htfStructures ?? [], n), d = (e.srZones ?? []).filter(
    (X) => n == null || P(X) <= n
  ), f = (e.rsDivergences ?? []).filter(
    (X) => n == null || P(X) <= n
  ), h = (e.anchoredVwapSignals ?? []).filter(
    (X) => n == null || P(X) <= n
  ), m = I(e.resistanceNearPct, 0, 10, 1.5), y = I(e.retestNearPct, 0, 10, 0.8), b = dn(e.extension ?? null), w = mn(d, o, m), x = hn(f), A = vn(c), E = yn(
    h,
    e.avwapDistancePct
  ), R = gn(c, d, o, y), p = pn(b, w, c, o), v = [
    b,
    w,
    x,
    A,
    E,
    R
  ], k = {
    checks: v,
    asOf: s,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ne({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, M = en({
    extension: b,
    htfResistance: w,
    htfStructures: u,
    rsWeakness: x,
    structureShift: A,
    avwapFailure: E,
    retest: R,
    invalidated: p
  });
  return (me = e.candles) != null && me.length && s != null ? Qt({
    ...e,
    asOf: s,
    latestPrice: o,
    marketStructure: a,
    structure: c,
    htfStructures: l,
    srZones: d,
    rsDivergences: f,
    anchoredVwapSignals: h,
    checks: v,
    executionTimeframe: t
  }) : ut({
    ...k,
    state: M,
    reason: Sn(M, v),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function Ut(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((o) => o.knownAt <= t), r = e.breaks.filter((o) => o.knownAt <= t), s = ((i = Q(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: s,
    summary: De(n, r, s)
  };
}
function zt(e, t) {
  if (!e || t == null) return e ?? null;
  const n = g(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function si(e) {
  return jt(e).records;
}
function ne(e = {}) {
  var t, n, r, s, i, o, a, c, l, u, d;
  return F({
    lifecycleVersion: $,
    lifecycleConfigVersion: qt,
    candidateGate: ie,
    extension: {
      windowSeconds: T(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: T((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: T((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: T((s = e.extensionOptions) == null ? void 0 : s.emaPeriod, 2, 500, 20),
      atrPeriod: T((i = e.extensionOptions) == null ? void 0 : i.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: T(
        (o = e.marketStructureOptions) == null ? void 0 : o.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: T(
        (a = e.marketStructureOptions) == null ? void 0 : a.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: T((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: I((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: T((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: T((d = e.marketStructureOptions) == null ? void 0 : d.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: I(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: I(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: I(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: I(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: I(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: T(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function oi(e) {
  var a;
  const t = at(e), n = Q(t);
  if (n == null) return null;
  const r = ot(e, n), s = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], o = new Set(
    i.map((c) => U(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && P(c) <= n && o.add(P(c));
  for (const c of [...o].sort((l, u) => l - u))
    _e(
      be(i, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (a = e.config) == null ? void 0 : a.marketStructureOptions,
      c,
      s
    );
  return st(
    e,
    n,
    s,
    r
  );
}
function jt(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, s = ne(r), i = at(e), o = ot(
    e,
    Q(i) ?? 0
  ), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = g(e.from) ?? -1 / 0;
  let d = null;
  return { records: i.map((h) => {
    var A, E, R, p, v;
    const m = st(
      e,
      h,
      a,
      o
    ), y = ct(e.candidateMetrics, h), b = (y == null ? void 0 : y.metrics) ?? Oe(
      Ie(
        be(n, t, h),
        r.extensionOptions
      )
    );
    d = m;
    const w = m.evidence.filter((k) => c.has(k.id) ? !1 : (c.add(k.id), k.knownAt >= u)), x = m.transitions.filter((k) => {
      const M = Gt(k);
      return l.has(M) ? !1 : (l.add(M), k.knownAt >= u);
    });
    return {
      asOf: h,
      setupFamily: G,
      lifecycleVersion: $,
      lifecycleConfigHash: s,
      candidateGatePassed: ce(b),
      candidateId: ((A = m.candidate) == null ? void 0 : A.id) ?? null,
      candidateDetectedAt: ((E = m.candidate) == null ? void 0 : E.detectedAt) ?? null,
      initialMtfContext: ((R = m.candidate) == null ? void 0 : R.initialMtfContext) ?? [],
      currentState: m.currentState,
      stateSince: m.stateSince,
      transition: Q(x) ?? null,
      transitions: x,
      evidenceAdded: w,
      pendingConditions: m.pendingConditions,
      confluence: m.confluence,
      episodeHigh: ((p = m.candidate) == null ? void 0 : p.episodeHigh) ?? null,
      episodeHighTime: ((v = m.candidate) == null ? void 0 : v.episodeHighTime) ?? null,
      activeBreakLevel: m.activeBreakLevel,
      retestLevel: m.retestLevel,
      terminalReason: m.invalidationReason ?? m.expiryReason,
      dataQualityNotes: m.dataQuality
    };
  }), latestSnapshot: d };
}
function st(e, t, n, r) {
  const s = e.executionTimeframe, i = e.candlesByTimeframe[s] ?? [], o = e.config ?? {}, a = ne(o), c = be(i, s, t), l = Ie(c, o.extensionOptions), u = ct(e.candidateMetrics, t), d = (u == null ? void 0 : u.metrics) ?? Oe(l), f = _e(
    c,
    s,
    e.structureEvents ?? [],
    o.marketStructureOptions,
    t,
    n
  ), h = r.filter(
    (y) => (y.summary.updatedTs ?? 0) <= t
  ), m = Q(c) ?? null;
  return $t({
    candles: i,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: s,
    asOf: t,
    extensionOptions: o.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: d,
    marketStructure: f,
    structure: f.summary,
    htfStructures: h,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (m == null ? void 0 : m.c) ?? null,
    latestTs: t,
    resistanceNearPct: o.resistanceNearPct,
    retestNearPct: o.retestNearPct,
    retestToleranceBps: o.retestToleranceBps,
    retestToleranceAtr: o.retestToleranceAtr,
    invalidationBps: o.invalidationBps,
    maxCandidateAgeSeconds: o.maxCandidateAgeSeconds,
    lifecycleConfigHash: a
  });
}
function ot(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const s = new Set(
      r.map((i) => U(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && P(i) <= t && s.add(P(i));
    return [...s].sort((i, o) => i - o).map((i) => {
      var a;
      const o = _e(
        be(r, n, i),
        n,
        e.structureEvents ?? [],
        (a = e.config) == null ? void 0 : a.marketStructureOptions,
        i
      );
      return {
        timeframe: n,
        summary: { ...o.summary, updatedTs: i }
      };
    });
  });
}
const ai = "openTime";
function U(e, t) {
  return (g(e.bucket) ?? g(e.ts) ?? 0) + Math.max(1, J(t));
}
function be(e, t, n) {
  return e.filter((r) => U(r, t) <= n);
}
function at(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, o] of Object.entries(e.candlesByTimeframe))
    for (const a of o) t.add(U(a, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(g(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(P(i));
  for (const i of e.avwapEvents ?? []) t.add(P(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(P(i));
  for (const i of e.supportResistanceZones ?? []) t.add(P(i));
  for (const i of e.evaluationPoints ?? []) {
    const o = g(i);
    o != null && t.add(o);
  }
  const n = [...t].filter(Number.isFinite).sort((i, o) => i - o), r = g(e.from) ?? n[0] ?? 0, s = g(e.to) ?? Q(n) ?? r;
  return t.add(r), t.add(s), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= s).sort((i, o) => i - o);
}
function ct(e, t) {
  return Q([...e ?? []].filter((n) => (g(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (g(n.knownAt) ?? n.asOf) - (g(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function _e(e, t, n, r, s, i) {
  var d;
  const o = oe(e, r), a = n.filter(
    (f) => (!f.sourceTimeframe || f.sourceTimeframe === t) && P(f) <= s
  ), c = i ?? /* @__PURE__ */ new Map();
  for (const f of [...o.breaks, ...a])
    c.set(
      j(
        f.kind,
        t,
        f.eventTime,
        f.knownAt,
        `${f.direction}:${f.level}`
      ),
      f
    );
  const l = [...c.values()].filter((f) => f.knownAt <= s).sort(
    (f, h) => f.knownAt - h.knownAt || f.eventTime - h.eventTime
  );
  if (!l.length) return o;
  const u = ((d = Q(l)) == null ? void 0 : d.direction) ?? o.trend;
  return {
    swings: o.swings,
    breaks: l,
    trend: u,
    summary: De(o.swings, l, u)
  };
}
function Gt(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function Qt(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = Xt(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), s = sn(r, n);
  let i = Wt(r, e);
  if (!i && ce(e.extension ?? null)) {
    const o = Le(t, e.asOf, e.executionTimeframe);
    o && (i = {
      index: o.index,
      candle: o.candle,
      eventTime: H(o.candle),
      knownAt: Math.min(
        e.asOf,
        z(t, o.index, e.executionTimeframe)
      ),
      metrics: Fe(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, s.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? lt(i, e, e.asOf, s) : ut({
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
function Xt(e, t, n, r, s) {
  if (s != null && s.length)
    return [...s].map((o) => {
      const a = g(o.knownAt) ?? o.asOf, c = Le(e, a, r);
      if (!c || a > n) return null;
      const l = g(o.eventTime) ?? H(c.candle), u = Fe(o.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: a,
        metrics: u,
        pass: ce(u),
        rollingReturnCount: Math.max(0, Math.trunc(o.sampleCount ?? 0))
      };
    }).filter((o) => o != null).sort((o, a) => o.knownAt - a.knownAt || o.eventTime - a.eventTime);
  const i = [];
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], c = z(e, o, r);
    if (c > n) continue;
    const l = Ie(e.slice(0, o + 1), t), u = Oe(l);
    i.push({
      index: o,
      candle: a,
      eventTime: H(a),
      knownAt: c,
      metrics: u,
      pass: ce(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return i;
}
function Wt(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const o of e)
    o.pass && !r && n.push(o), r = o.pass;
  if (!n.length) return null;
  let s = n[0];
  for (const o of n.slice(1)) {
    const c = ((i = lt(s, t, o.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < o.knownAt && !l.pass) && (s = o);
  }
  return s;
}
function lt(e, t, n, r) {
  const s = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", o = t.venue ?? "", a = t.executionTimeframe, c = Me(
    t.htfStructures ?? [],
    e.knownAt
  ).map((v) => ({
    timeframe: v.timeframe,
    state: v.summary.state,
    trend: v.summary.trend,
    transitionDirection: v.summary.transitionDirection,
    updatedTs: v.summary.updatedTs
  })), l = an({
    setupFamily: G,
    symbol: s,
    source: i,
    venue: o,
    executionTimeframe: a,
    detectedAt: e.knownAt
  }), u = [
    {
      id: j("candidate_detected", a, e.eventTime, e.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      sourceTimeframe: a,
      price: e.candle.c,
      contributesTo: "developing"
    }
  ], d = [
    {
      from: "notCandidate",
      to: "developing",
      knownAt: e.knownAt,
      evidenceIds: [u[0].id],
      evidenceCodes: [u[0].code],
      explanation: "Candidate episode detected"
    }
  ], f = Yt(t, e, n), h = Kt(e, t, n);
  let m = "developing", y = e.knownAt, b = null, w = null, x = null, A = null, E = null;
  for (const v of h) {
    if (b != null) break;
    if (!(v.knownAt < e.knownAt || v.knownAt > n)) {
      if (v.lifecycleKind === "deterioration") {
        u.push({ ...v, contributesTo: "deteriorating" }), m === "developing" && (d.push(re(m, "deteriorating", v)), m = "deteriorating", y = v.knownAt);
        continue;
      }
      if (v.lifecycleKind === "bearishBreak") {
        u.push({ ...v, contributesTo: "waitingForRetest" }), (m === "developing" || m === "deteriorating") && (d.push(re(m, "waitingForRetest", v)), m = "waitingForRetest", y = v.knownAt, w = v.breakLevel ?? null);
        continue;
      }
      if (v.lifecycleKind === "retest") {
        m === "waitingForRetest" && w && v.relatedEventId === w.evidenceId && v.knownAt > w.knownAt && (u.push({ ...v, contributesTo: "entryCandidate" }), d.push(re(m, "entryCandidate", v)), m = "entryCandidate", y = v.knownAt, x = v.breakLevel ?? w);
        continue;
      }
      if (v.lifecycleKind === "invalidation") {
        (m === "deteriorating" || m === "waitingForRetest" || m === "entryCandidate") && (u.push({ ...v, contributesTo: "invalidated" }), d.push(re(m, "invalidated", v)), m = "invalidated", y = v.knownAt, b = v.knownAt, A = v.explanation);
        continue;
      }
      v.lifecycleKind === "expiry" && m !== "entryCandidate" && (u.push({ ...v, contributesTo: "expired" }), d.push(re(m, "expired", v)), m = "expired", y = v.knownAt, b = v.knownAt, E = v.explanation);
    }
  }
  const R = mt(
    t.candles ?? [],
    e.eventTime,
    n,
    a
  ), p = {
    id: l,
    setupFamily: G,
    lifecycleVersion: $,
    lifecycleConfigHash: t.lifecycleConfigHash ?? ne({
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
    venue: o,
    executionTimeframe: a,
    detectedAt: e.knownAt,
    detectionEventTime: e.eventTime,
    detectionMetrics: e.metrics,
    initialMtfContext: c,
    episodeHigh: (R == null ? void 0 : R.price) ?? null,
    episodeHighTime: (R == null ? void 0 : R.eventTime) ?? null,
    currentState: m,
    stateSince: y,
    terminalAt: b
  };
  return {
    strategy: "pumpFade",
    setupFamily: G,
    lifecycleVersion: $,
    lifecycleConfigHash: p.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: a,
    state: m,
    currentState: m,
    stateSince: y,
    label: Se(m),
    reason: on(m, u, d, A, E),
    checks: t.checks,
    updatedTs: n,
    candidate: p,
    evidence: u.sort((v, k) => v.knownAt - k.knownAt || v.eventTime - k.eventTime),
    transitions: d,
    pendingConditions: dt(m, w),
    activeBreakLevel: w,
    retestLevel: x,
    confluence: f,
    invalidationReason: A,
    expiryReason: E,
    dataQuality: r
  };
}
function Kt(e, t, n) {
  const r = [], s = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = P(l);
    if (!se(l, e, n)) continue;
    const d = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: j(d, s, l.eventTime, u, l.x),
      code: d,
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
    const u = P(l);
    l.kind !== "failedReclaim" || !se(l, e, n) || r.push({
      id: j("avwap_failed_reclaim", s, l.eventTime, u, l.x),
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
  const i = Jt(t), o = [];
  for (const l of i) {
    const u = P(l);
    if (l.direction !== "bearish" || !se(l, e, n)) continue;
    const d = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", f = j(d, s, l.eventTime, u, l.x), h = {
      level: l.level,
      sourceTimeframe: s,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: f
    }, m = {
      id: f,
      code: d,
      explanation: `${l.label} down through ${q(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: h
    };
    o.push(m), r.push(m);
  }
  for (const l of o) {
    const u = Zt(e, l, t, n);
    u && r.push(u);
  }
  for (const l of i) {
    const u = P(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !se(l, e, n))
      continue;
    const d = (t.candles ?? [])[l.index], f = mt(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      s
    ), h = I(t.invalidationBps, 0, 1e3, 10);
    !d || (f == null ? void 0 : f.price) == null || d.c <= f.price * (1 + h / 1e4) || r.push({
      id: j("bullish_continuation_invalidation", s, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${q(f.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      price: d.c,
      level: f.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const a = T(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + a;
  return c <= n && r.push({
    id: j("candidate_expired", s, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${fn(a)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: s,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function Zt(e, t, n, r) {
  var u;
  const s = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const o = I(n.retestToleranceBps, 0, 1e3, 35), a = I(n.retestToleranceAtr, 0, 10, 0.25), c = T((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = Ae(s, c);
  for (let d = 0; d < s.length; d += 1) {
    const f = s[d], h = z(s, d, n.executionTimeframe), m = H(f);
    if (h <= t.knownAt || m < t.knownAt || m < e.knownAt || h > r)
      continue;
    const y = l[d] ?? 0, b = Math.max(
      i.level * (o / 1e4),
      Number.isFinite(y) ? y * a : 0
    );
    if (f.h >= i.level - b && f.l <= i.level + b && f.c < i.level && f.c <= f.o)
      return {
        id: j(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          H(f),
          h,
          d
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${q(i.level)}`,
        eventTime: m,
        knownAt: h,
        sourceTimeframe: i.sourceTimeframe,
        price: f.c,
        level: i.level,
        relatedEventId: i.evidenceId,
        lifecycleKind: "retest",
        sortPriority: 40,
        breakLevel: i
      };
  }
  return null;
}
function Yt(e, t, n) {
  const r = [], s = Be(
    e.srZones.filter((a) => P(a) <= n),
    e.latestPrice,
    I(e.resistanceNearPct, 0, 10, 1.5)
  );
  s && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${q(s.low)}-${q(s.high)}`,
    eventTime: s.eventTime,
    knownAt: s.knownAt,
    sourceTimeframe: "MTF",
    level: s.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (a) => a.kind === "loss" && se(a, t, n)
  ).sort((a, c) => P(c) - P(a))[0];
  i && P(i) <= n && r.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: i.eventTime,
    knownAt: i.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: i.vwap
  });
  const o = g(e.avwapDistancePct);
  o != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${ae(o, 1)}% from AVWAP`,
    value: o,
    sourceTimeframe: e.executionTimeframe
  });
  for (const a of Me(e.htfStructures, n))
    a.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${a.timeframe} structure`,
      detail: un(a.summary),
      eventTime: a.summary.updatedTs,
      knownAt: a.summary.updatedTs,
      sourceTimeframe: a.timeframe
    });
  return r;
}
function Me(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = g(r.summary.updatedTs);
    if (s != null && s > t) continue;
    const i = n.get(r.timeframe), o = g(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (s ?? -1 / 0) >= o) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function Jt(e) {
  var r, s, i;
  const t = (s = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && s.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((o) => {
    const a = `${o.kind}:${o.direction}:${o.x}:${o.level}:${P(o)}`;
    return n.has(a) ? !1 : (n.add(a), !0);
  });
}
function en(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && Ve(e.htfResistance, e.htfStructures) ? "deteriorating" : Ve(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function ut(e) {
  return {
    strategy: "pumpFade",
    setupFamily: G,
    lifecycleVersion: $,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ne(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: Se(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: dt(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function ft(e, t = {}) {
  const n = kn(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let s = 0, i = 0;
  for (let o = n; o < e.length; o += 1) {
    const a = e[o];
    if (!a) continue;
    const c = (a.h + a.l + a.c) / 3;
    if (!_(c)) continue;
    const l = xn(a, c);
    l <= 0 || (s += l, i += c * l, r.push(a.x, i / s));
  }
  return new Float32Array(r);
}
function ci(e, t = {}) {
  const n = g(t.anchorBucket), r = g(t.anchorX), s = ft(e, t);
  if (s.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = s[s.length - 1], o = ht(e), a = o && _(i) ? (o.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: a,
    candle: o
  };
}
function li(e, t = {}, n = 20) {
  const r = T(n, 1, 200, 20), s = ft(e, t);
  if (s.length < 4) return [];
  const i = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), o = [];
  let a = null;
  for (let c = 0; c < s.length; c += 2) {
    const l = s[c], u = s[c + 1], d = i.get(l);
    if (!d || !_(u) || !_(d.candle.c)) continue;
    const f = z(e, d.index), h = d.candle.c > u ? "above" : d.candle.c < u ? "below" : null;
    h && (a === "above" && h === "below" ? o.push(Re("loss", d.index, d.candle, u, f)) : a === "below" && h === "above" ? o.push(Re("reclaim", d.index, d.candle, u, f)) : a === "below" && h === "below" && d.candle.h >= u && d.candle.c < u && o.push(
      Re("failedReclaim", d.index, d.candle, u, f)
    ), a = h);
  }
  return o.slice(-r);
}
function tn(e, t = {}) {
  const n = T(t.lookback, 20, 2e3, 500), r = T(t.pivotStrength, 1, 20, 3), s = T(t.atrPeriod, 2, 100, 14), i = I(t.minMoveAtr, 0, 10, 0.75), o = T(t.maxSwings, 1, 500, 120), a = Math.max(0, e.length - n), c = e.slice(a);
  if (c.length < r * 2 + 1) return [];
  const l = Ae(e, s), u = [];
  for (let f = r; f < c.length - r; f += 1) {
    const h = c[f], m = a + f, y = l[m] ?? null, b = z(e, m + r);
    Ln(c, f, r) && u.push(qe("SwingHigh", m, h, h.h, y, b)), Bn(c, f, r) && u.push(qe("SwingLow", m, h, h.l, y, b));
  }
  const d = [];
  for (const f of u) {
    const h = d[d.length - 1];
    if (!h) {
      d.push(f);
      continue;
    }
    if (h.kind === f.kind) {
      _n(f, h) && (d[d.length - 1] = f);
      continue;
    }
    Math.abs(f.price - h.price) >= Mn(f, h, i) && d.push(f);
  }
  return En(d).slice(-o);
}
function oe(e, t = {}) {
  const n = T(t.maxSwings, 1, 500, 120), r = T(t.maxBreaks, 1, 200, 24), s = tn(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], o = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, d = "neutral";
  for (let m = 0; m < e.length; m += 1) {
    const y = z(e, m);
    for (; c < s.length && s[c].index < m && s[c].knownAt <= y; ) {
      const w = s[c];
      w.kind === "SwingHigh" ? l = w : u = w, c += 1;
    }
    const b = e[m];
    if (l && !o.has(l.x) && b.c > l.price) {
      const w = d === "bearish" ? "StructureShift" : "StructureBreak";
      i.push($e(w, "bullish", m, b, l, y)), o.add(l.x), d = "bullish";
    }
    if (u && !a.has(u.x) && b.c < u.price) {
      const w = d === "bullish" ? "StructureShift" : "StructureBreak";
      i.push($e(w, "bearish", m, b, u, y)), a.add(u.x), d = "bearish";
    }
  }
  const f = s.slice(-n), h = i.slice(-r);
  return {
    swings: f,
    breaks: h,
    trend: d,
    summary: De(f, h, d)
  };
}
function ui(e) {
  var s;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      ze(t, "SwingHigh", "rangeHigh", null, !0),
      ze(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((s = n.lastBreak) == null ? void 0 : s.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    ve(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    ve(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((i) => !!i) : r === "bearish" ? [
    ve(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    ve(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((i) => !!i) : [];
}
function fi(e, t = {}) {
  var c, l;
  const n = T(t.lookback, 20, 1e3, 240), r = T(t.pivotStrength, 1, 20, 3), s = T(t.maxZones, 1, 12, 6), i = I(t.thicknessBps, 1, 100, 10), o = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, a = oe(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return nn(a.swings, {
    maxZones: s,
    thicknessBps: i,
    latestX: o,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function nn(e, t = {}) {
  var l;
  const n = T(t.maxZones, 1, 12, 6), r = I(t.thicknessBps, 1, 100, 10), s = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, i = g(t.referencePrice), o = t.zonesPerSide == null ? null : T(t.zonesPerSide, 1, 12, 3), a = [];
  for (const u of e)
    Fn(
      a,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      s - u.x + 1,
      r
    );
  const c = a.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, d) => d.score - u.score || d.touches - u.touches || d.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return On(c, n, i, o);
}
function rn(e, t) {
  const n = new Map(
    t.filter((o) => _(o.c)).map((o) => [o.bucket, o])
  );
  let r = null, s = null;
  const i = [];
  for (const o of e) {
    if (!_(o.c)) continue;
    const a = n.get(o.bucket);
    if (!a || !_(a.c)) continue;
    (r == null || s == null) && (r = o.c, s = a.c);
    const c = o.c / r / (a.c / s);
    i.push(o.x, (c - 1) * 100);
  }
  return new Float32Array(i);
}
function di(e, t, n = {}) {
  var R;
  const r = T(n.maxDivergences, 1, 100, 16), s = I(n.minDeltaPct, 0, 50, 0.5), i = T(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), o = n.includeDivergences ?? !0, a = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = rn(e, t), u = Hn(l);
  if (!e.length || u.size < 2) return [];
  const f = (((R = e[e.length - 1]) == null ? void 0 : R.x) ?? 0) - i, h = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, m = oe(e, {
    ...h
  }), y = Cn(e, l), b = oe(y, {
    ...h
  }), w = new Map(e.map((p, v) => [p.x, { candle: p, index: v }])), x = [];
  let A = null, E = null;
  for (const p of m.swings) {
    const v = u.get(p.x);
    if (!(v == null || !Number.isFinite(v))) {
      if (p.kind === "SwingHigh") {
        if (A) {
          const k = u.get(A.x);
          k != null && Number.isFinite(k) && (p.price > A.price && v <= k - s ? o && x.push(
            he(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              p,
              A,
              v,
              k,
              m.summary.state,
              b.summary.state
            )
          ) : p.price < A.price && v >= k + s && a && x.push(
            he(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              p,
              A,
              v,
              k,
              m.summary.state,
              b.summary.state
            )
          ));
        }
        A = p;
        continue;
      }
      if (E) {
        const k = u.get(E.x);
        k != null && Number.isFinite(k) && (p.price > E.price && v <= k - s ? a && x.push(
          he(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            p,
            E,
            v,
            k,
            m.summary.state,
            b.summary.state
          )
        ) : p.price < E.price && v >= k + s && o && x.push(
          he(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            p,
            E,
            v,
            k,
            m.summary.state,
            b.summary.state
          )
        ));
      }
      E = p;
    }
  }
  if (c)
    for (const p of b.breaks) {
      if (p.x < f) continue;
      const v = w.get(p.x), k = u.get(p.x);
      if (!v || k == null || !Number.isFinite(k)) continue;
      const M = oe(e.slice(0, v.index + 1), {
        ...h,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      Nn(p.direction, M.summary.state) && x.push(
        Pn(
          p.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          p.direction,
          p.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          v.index,
          v.candle,
          k,
          p,
          M.summary.state,
          b.summary.state
        )
      );
    }
  return x.filter((p) => p.x >= f).sort((p, v) => p.x - v.x || Ue(p.signal) - Ue(v.signal)).slice(-r);
}
function mi(e) {
  return new Uint8Array(e.buffer);
}
function Fe(e) {
  return {
    returnPct: g(e == null ? void 0 : e.returnPct),
    percentile: g(e == null ? void 0 : e.percentile),
    zScore: g(e == null ? void 0 : e.zScore),
    atrExtension: g(e == null ? void 0 : e.atrExtension)
  };
}
function Oe(e) {
  return {
    returnPct: g(e.returnPct),
    percentile: g(e.percentile),
    zScore: g(e.zScore),
    atrExtension: g(e.atrExtension)
  };
}
function ce(e) {
  const t = Fe(e);
  return t.returnPct != null && t.returnPct >= ie.returnPct || t.percentile != null && t.percentile >= ie.percentile || t.zScore != null && t.zScore >= ie.zScore || t.atrExtension != null && t.atrExtension >= ie.atrExtension;
}
function sn(e, t) {
  const n = [], r = T(t.minSamples, 1, 1e4, 20), s = e[e.length - 1] ?? null;
  return s ? s.rollingReturnCount < r && n.push(
    `Rolling-return history has ${s.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function re(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function on(e, t, n, r, s) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return s ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const o = t.filter((c) => c.contributesTo === e), a = o[o.length - 1];
  return (a == null ? void 0 : a.explanation) ?? Se(e);
}
function dt(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${q(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function an(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function j(e, t, n, r, s) {
  return [e, t, n, r, s ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function mt(e, t, n, r) {
  let s = null;
  for (let i = 0; i < e.length; i += 1) {
    const o = e[i], a = H(o);
    a < t || z(e, i, r) > n || Number.isFinite(o.h) && (!s || o.h > s.price) && (s = { price: o.h, eventTime: a });
  }
  return s;
}
function cn(e, t) {
  return e.length ? z(e, e.length - 1, t) : null;
}
function Le(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (z(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function H(e) {
  const t = g(e.ts);
  return t ?? g(e.bucket) ?? 0;
}
function z(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? U(r, n) : (g(r.bucket) ?? H(r)) + ln(e, t) : 0;
}
function ln(e, t) {
  var i, o, a;
  const n = g((i = e[t]) == null ? void 0 : i.bucket) ?? H(e[t]), r = g((o = e[t + 1]) == null ? void 0 : o.bucket);
  if (r != null && r > n) return r - n;
  const s = g((a = e[t - 1]) == null ? void 0 : a.bucket);
  return s != null && n > s ? n - s : 1;
}
function P(e) {
  return g(e.knownAt) ?? g(e.eventTime) ?? g(e.ts) ?? g(e.bucket) ?? 0;
}
function se(e, t, n) {
  const r = P(e), s = g(e.eventTime) ?? g(e.ts) ?? g(e.bucket) ?? r;
  return r > t.knownAt && r <= n && s >= t.knownAt;
}
function un(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function fn(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function _(e) {
  return Number.isFinite(e) && e > 0;
}
function dn(e) {
  const t = g(e == null ? void 0 : e.returnPct), n = g(e == null ? void 0 : e.percentile), r = g(e == null ? void 0 : e.zScore), s = g(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${ae(t, 1)}%`,
    s == null ? null : `Ext ${ae(s, 1)} ATR`,
    r == null ? null : `Z ${ae(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((a) => !!a);
  return {
    key: "extension",
    label: "Extension",
    status: ce({ returnPct: t, percentile: n, zScore: r, atrExtension: s }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function mn(e, t, n) {
  const r = Be(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${q(r.low)}-${q(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function hn(e) {
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
function vn(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function yn(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = g(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${ae(r, 1)}%`)
  };
}
function gn(e, t, n, r) {
  var c;
  const s = g((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), i = s != null && n != null && bn(n, s) <= r, o = Be(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || o) ? "pass" : "pending",
    detail: i ? `Retesting ${q(s)}` : o ? `Near R ${q(o.center)}` : "No retest yet"
  };
}
function pn(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const s = g((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return s != null && r > s * 1.01;
}
function Ve(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Be(e, t, n) {
  return t == null || !_(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, s) => r.distance - s.distance || s.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function bn(e, t) {
  return !_(e) || !_(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function Se(e) {
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
function Sn(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : Se(e);
}
function ae(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function q(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function g(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function Q(e) {
  return e[e.length - 1];
}
function ht(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (_(n.c)) return n;
  }
  return null;
}
function An(e) {
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
function vt(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let s = null;
  for (let i = r; i >= 0; i -= 1) {
    const o = e[i];
    if (o.bucket <= t && _(o.c)) {
      s = o;
      break;
    }
  }
  return s;
}
function wn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const s = e[r];
    if (s.bucket < t.earliestBucket || s.bucket >= t.excludeBucket || !_(s.c)) continue;
    const i = vt(e, s.bucket - t.windowSeconds, r);
    !i || !_(i.c) || n.push((s.c / i.c - 1) * 100);
  }
  return n;
}
function Rn(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, s = n.filter((i) => i === t).length;
  return (r + s * 0.5) / n.length * 100;
}
function Tn(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((o, a) => o + a, 0) / n.length, s = n.reduce((o, a) => o + (a - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(s);
  return i > 0 ? (t - r) / i : null;
}
function Re(e, t, n, r, s) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: H(n),
    knownAt: s
  };
}
function kn(e, t) {
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
function xn(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function qe(e, t, n, r, s, i) {
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
    eventTime: H(n),
    knownAt: i
  };
}
function En(e) {
  let t = null, n = null;
  return e.map((r) => {
    if (r.kind === "SwingHigh") {
      const a = t == null ? "SwingHigh" : r.price > t.price ? "HigherHigh" : "LowerHigh", l = { ...r, structure: a, label: a === "SwingHigh" ? "SH" : a === "HigherHigh" ? "HH" : "LH" };
      return t = l, l;
    }
    const s = n == null ? "SwingLow" : r.price > n.price ? "HigherLow" : "LowerLow", o = { ...r, structure: s, label: s === "SwingLow" ? "SL" : s === "HigherLow" ? "HL" : "LL" };
    return n = o, o;
  });
}
function $e(e, t, n, r, s, i) {
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
    eventTime: H(r),
    knownAt: i
  };
}
function he(e, t, n, r, s, i, o, a, c, l) {
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
    rs: o,
    previousRs: a,
    priceLabel: s.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: l,
    eventTime: s.eventTime,
    knownAt: Math.max(s.knownAt, i.knownAt)
  };
}
function Pn(e, t, n, r, s, i, o, a, c) {
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
    previousRs: o.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak: o,
    priceStructureState: a,
    rsStructureState: c,
    eventTime: o.eventTime,
    knownAt: o.knownAt
  };
}
function Cn(e, t) {
  const n = new Map(e.map((i) => [i.x, i])), r = [];
  let s = null;
  for (let i = 0; i < t.length; i += 2) {
    const o = t[i], a = t[i + 1], c = n.get(o);
    if (!c || !Number.isFinite(a)) continue;
    const l = s ?? a;
    r.push({
      ...c,
      o: l,
      h: a,
      l: a,
      c: a,
      v_base: 0,
      v_quote: 0
    }), s = a;
  }
  return r;
}
function Nn(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Ue(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function De(e, t, n) {
  const r = t[t.length - 1] ?? null, s = Pe(e, "SwingHigh"), i = Pe(e, "SwingLow"), o = e[e.length - 1] ?? null, a = In(t), c = e.length === 0 ? "neutral" : r == null || a ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, l = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: l,
    lastBreak: r,
    lastSwingHigh: s,
    lastSwingLow: i,
    updatedX: (r == null ? void 0 : r.x) ?? (o == null ? void 0 : o.x) ?? null,
    updatedTs: (r == null ? void 0 : r.knownAt) ?? (o == null ? void 0 : o.knownAt) ?? null
  };
}
function ve(e, t, n, r, s) {
  for (let o = e.length - 1; o >= 0; o -= 1) {
    const a = e[o];
    if (a.kind === t && n.includes(a.structure))
      return Ee(r, s, a);
  }
  const i = Pe(e, t);
  return i ? Ee(r, s, i) : null;
}
function ze(e, t, n, r, s) {
  let i = null;
  for (const o of e)
    o.kind === t && (!i || (s ? o.price > i.price : o.price < i.price)) && (i = o);
  return i ? Ee(n, r, i) : null;
}
function Ee(e, t, n) {
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
function In(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Pe(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function _n(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Mn(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function Ae(e, t) {
  const n = Y(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const s = e.map((o, a) => {
    if (a === 0) return o.h - o.l;
    const c = e[a - 1].c;
    return Math.max(
      o.h - o.l,
      Math.abs(o.h - c),
      Math.abs(o.l - c)
    );
  });
  let i = 0;
  for (let o = 0; o < n; o += 1) i += s[o];
  i /= n, r[n - 1] = i;
  for (let o = n; o < e.length; o += 1)
    i = (i * (n - 1) + s[o]) / n, r[o] = i;
  return r;
}
function Fn(e, t, n, r, s) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const o = Math.max(i * (s / 1e4), Number.EPSILON), a = i - o, c = i + o, l = 1 / Math.max(1, r), u = e.find(
    (h) => h.kind === t && Dn(h.low, h.high, a, c)
  );
  if (!u) {
    e.push({
      kind: t,
      low: a,
      high: c,
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
  const d = u.touches + 1;
  u.center = (u.center * u.touches + i) / d, u.touches = d, u.score += 1 + l, u.strength = u.score, u.lastX = Math.max(u.lastX, n.x), u.eventTime = Math.max(u.eventTime, n.eventTime), u.knownAt = Math.max(u.knownAt, n.knownAt), u.structures.push(n.structure);
  const f = Math.max(u.center * (s / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - f, a), u.high = Math.max(u.high, u.center + f, c);
}
function On(e, t, n, r) {
  if (!n || !r) return e.slice(0, t);
  const s = /* @__PURE__ */ new Set(), i = e.filter((a) => a.center <= n).sort((a, c) => n - a.center - (n - c.center) || c.score - a.score).slice(0, r), o = e.filter((a) => a.center > n).sort((a, c) => a.center - n - (c.center - n) || c.score - a.score).slice(0, r);
  for (const a of [...i, ...o])
    s.add(a);
  for (const a of e) {
    if (s.size >= t) break;
    s.add(a);
  }
  return Array.from(s).sort((a, c) => c.score - a.score || c.touches - a.touches || c.lastX - a.lastX).slice(0, t);
}
function Ln(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].h >= r || e[t + s].h > r) return !1;
  return !0;
}
function Bn(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].l <= r || e[t + s].l < r) return !1;
  return !0;
}
function Dn(e, t, n, r) {
  return e <= r && n <= t;
}
function Hn(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], s = e[n + 1];
    Number.isFinite(r) && Number.isFinite(s) && t.set(r, s);
  }
  return t;
}
function Ce(e, t) {
  const n = Y(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const s = 2 / (n + 1);
  let i = 0;
  for (let o = 0; o < n; o++) i += e[o].c;
  i /= n, r[n - 1] = i;
  for (let o = n; o < e.length; o++)
    i = (e[o].c - i) * s + i, r[o] = i;
  return r;
}
function Vn(e, t) {
  const n = Y(t);
  if (e.length < n) return [];
  const r = [], s = 2 / (n + 1);
  let i = 0;
  for (let o = 0; o < n; o++) i += e[o].value;
  i /= n, r.push({ x: e[n - 1].x, value: i });
  for (let o = n; o < e.length; o++)
    i = (e[o].value - i) * s + i, r.push({ x: e[o].x, value: i });
  return r;
}
function yt(e, t) {
  const n = Y(t);
  if (e.length <= n) return [];
  let r = 0, s = 0;
  for (let o = 1; o <= n; o++) {
    const a = e[o].c - e[o - 1].c;
    a >= 0 ? r += a : s += Math.abs(a);
  }
  r /= n, s /= n;
  const i = [
    { x: e[n].x, value: Ge(r, s) }
  ];
  for (let o = n + 1; o < e.length; o++) {
    const a = e[o].c - e[o - 1].c, c = Math.max(0, a), l = Math.max(0, -a);
    r = (r * (n - 1) + c) / n, s = (s * (n - 1) + l) / n, i.push({ x: e[o].x, value: Ge(r, s) });
  }
  return i;
}
function je(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.value, i >= t && (r -= e[i - t].value), i >= t - 1 && n.push({ x: s.x, value: r / t });
  }), n;
}
function Z(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function Ge(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function Y(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function T(e, t, n, r) {
  return Math.floor(I(e, t, n, r));
}
function I(e, t, n, r) {
  const s = Number(e);
  return Number.isFinite(s) ? Math.max(t, Math.min(n, s)) : r;
}
const qn = "strategy-profile.1", gt = "decision-snapshot.1", $n = "impulse_fade_v1.research.default", Un = "1";
function pt(e) {
  const { profileHash: t, ...n } = e;
  return F(n);
}
function zn(e) {
  if (le(e.createdAt, "createdAt"), e.setupFamily !== G || e.lifecycleVersion !== $ || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [s, i] of Object.entries(e.timeframeRoles))
    if (s === "contextTimeframes") {
      if (!i.every((o) => o.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${s} cannot be blank`);
  if (Qe(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), Qe(
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
  const r = N(e);
  return N({
    ...r,
    profileHash: pt(r)
  });
}
function jn(e = {}) {
  var i, o;
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
    ...(o = e.entryPolicy) == null ? void 0 : o.factors
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
  return zn({
    schemaVersion: qn,
    id: e.id ?? $n,
    version: e.version ?? Un,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: G,
    lifecycleVersion: $,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ne(),
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
const Gn = jn();
function hi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (Yn(e.price, "reference price"), le(e.eventTime, "reference eventTime"), le(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  return N({
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
function vi(e) {
  var i, o, a, c;
  if (le(e.decisionTime, "decisionTime"), le(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
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
  Zn([
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
  const n = Xn(
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
    snapshotSchemaVersion: gt,
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
    activeCandidateId: ((o = e.lifecycle.candidate) == null ? void 0 : o.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate.id : null,
    lifecycleState: e.lifecycle.currentState,
    lifecycleStateSince: e.lifecycle.stateSince,
    lifecycleEvidence: ke(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: Wn(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: Te(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: Te(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((a = e.avwapState) == null ? void 0 : a.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: ke(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: ke(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: Te(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, s = bt(r);
  return N({ ...r, id: s });
}
function bt(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${F(n).slice(8)}`;
}
function Qn(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const s = n.get(r.id);
    if (s && L(s) !== L(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function Xn(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function Wn(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      Kn(r) <= t ? r : null
    ])
  );
}
function Te(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function ke(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || F(n).localeCompare(F(r))
  );
}
function Kn(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function Zn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && L(r) !== L(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function le(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function Yn(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function Qe(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const St = "radar-selection-profile.1", Jn = "radar-episode.1", er = "replay-case-manifest.1", tr = "radar-metric-observation.1", nr = "radar-scan-result.1", rr = "radar-episode-status.1", ir = "execution-venue-eligibility.1";
function At(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return F(n);
}
function sr(e) {
  return Tr(e), N({
    ...e,
    canonicalConfigHash: At(e)
  });
}
const yi = sr({
  schemaVersion: St,
  id: "impulse_fade_v1.radar.experimental",
  version: "1",
  name: "Impulse Fade radar experimental default (unoptimized)",
  setupFamily: "impulse_fade_v1",
  scanTimeframe: "1h",
  evaluationCadence: { mode: "completedScanCandle", everyBars: 1 },
  moveDetectors: [
    {
      id: "max-local-return",
      type: "maximumWindowReturn",
      windowsSeconds: [2, 4, 8, 12, 24].map((e) => e * 3600),
      minimumReturnPct: 8,
      minimumPercentile: 95,
      minimumZScore: 2,
      minimumSampleCount: 20,
      historyLookbackSeconds: 180 * 86400
    },
    {
      id: "recent-trough-runup",
      type: "rollingTroughRunup",
      lookbackSeconds: 48 * 3600,
      minimumRunupPct: 12,
      maximumTroughAgeSeconds: 24 * 3600,
      referenceField: "close",
      minimumPercentile: null,
      minimumZScore: null,
      minimumSampleCount: 20,
      historyLookbackSeconds: 180 * 86400
    },
    {
      id: "one-hour-atr-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: "1h",
      emaPeriod: 20,
      atrPeriod: 14,
      minimumAtrDisplacement: 2,
      minimumSampleCount: 20
    }
  ],
  detectorCombination: { mode: "any" },
  hardGates: ["dataQuality", "sourcePolicy", "executionVenueEligibility", "liquidity"],
  resetPolicy: { minimumFalseDurationSeconds: 4 * 3600 },
  episodeExpiry: { maximumAgeSeconds: 72 * 3600 },
  sourcePolicy: { allowedSources: ["external", "local"] },
  executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
  liquidityPolicy: {
    minimumQuoteNotional: 1e6,
    windowSeconds: 24 * 3600,
    missingData: "warn"
  },
  createdAt: 17e8
});
function gi(e) {
  var a;
  xr(e);
  const t = e.strategyProfile ?? Gn, n = /* @__PURE__ */ new Map(), r = [], s = [], i = [], o = [];
  for (const [c, l] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([u], [d]) => u.localeCompare(d)
  )) {
    const d = Tt(l.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? []).map((h) => U(h, e.selectionProfile.scanTimeframe)).filter((h) => h >= e.from && h <= e.to).filter((h) => Rr(h, e.selectionProfile)), f = {
      previousGate: !1,
      activeEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const h of d) {
      const m = e.selectionProfile.moveDetectors.map(
        (R) => or(R, l, h, e.selectionProfile.scanTimeframe)
      );
      for (const R of m)
        for (const p of R.observations)
          n.set(p.observationId, p);
      const y = Ar(
        m.map((R) => R.result.passed),
        e.selectionProfile.detectorCombination
      ), b = dr(
        l,
        h,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), w = fr(
        l,
        h,
        e.selectionProfile,
        m,
        b,
        e.universeHistory ?? []
      ), x = w.every((R) => R.passed), A = y && x, E = vr(
        l,
        h,
        m.map((R) => R.result),
        w,
        y,
        x,
        A
      );
      if (r.push(E), f.activeEpisode && h >= f.activeEpisode.activeUntil && (i.push(
        xe(f.activeEpisode, h, "expired", "maximumAgeElapsed", "blockedUntilReset")
      ), f.activeEpisode = null), A ? f.falseSince = null : (f.falseSince ?? (f.falseSince = h), !f.armed && h - f.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (f.activeEpisode && i.push(
        xe(f.activeEpisode, h, "reset", "radarGateReset", "armed")
      ), f.activeEpisode = null, f.armed = !0)), A && !f.previousGate && f.armed) {
        const R = cr({
          series: l,
          asOf: h,
          profile: e.selectionProfile,
          detectorEvaluations: m,
          venueEligibility: b,
          lifecycleHistory: ((a = e.lifecycleHistory) == null ? void 0 : a[c]) ?? []
        });
        s.push(R), i.push(
          xe(R, h, "active", "detected", "blockedUntilReset")
        );
        const p = lr(R, l, e.selectionProfile, t);
        o.push(p);
        for (const v of R.contextObservations)
          n.set(v.observationId, v);
        f.activeEpisode = R, f.armed = !1;
      }
      f.previousGate = A;
    }
  }
  return N({
    schemaVersion: nr,
    selectionProfileRef: Et(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(kt),
    gateEvaluations: r.sort(Cr),
    episodes: s.sort(Nr),
    episodeStatusObservations: i.sort(Ir),
    replayCaseManifests: o.sort((c, l) => c.id.localeCompare(l.id))
  });
}
function or(e, t, n, r) {
  if (e.type !== "rollingTroughRunup") {
    const s = yr(
      e,
      t,
      n,
      e.type === "emaAtrDisplacement" ? e.analysisTimeframe : r,
      "DETECTOR_NOT_IMPLEMENTED",
      `Detector ${e.type} is not implemented`
    );
    return {
      result: Rt(e, !1, [s], null, "Detector unavailable"),
      observations: [s],
      anchor: null
    };
  }
  return ar(e, t, n, r);
}
function ar(e, t, n, r) {
  const s = ue(t.candlesByTimeframe[r] ?? [], r, n), i = s.at(-1) ?? null, a = (i ? s.filter(
    (m) => m.bucket >= i.bucket - e.lookbackSeconds && m.bucket <= i.bucket && i.bucket - m.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((m, y) => B(y.c) && (!m || y.c < m.c || y.c === m.c && y.bucket < m.bucket) ? y : m, null), c = i && a && B(a.c) ? (i.c / a.c - 1) * 100 : null, l = [];
  i || l.push(te("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a || l.push(te("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const u = F(e), d = we({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "rolling_trough_runup",
    metricVersion: "rolling-trough-runup.1",
    window: e.lookbackSeconds,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: (a == null ? void 0 : a.c) ?? null,
    value: c,
    unit: "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: s,
    configHash: u,
    notes: l
  }), f = c != null && c + 1e-12 >= e.minimumRunupPct && We(d.percentile, e.minimumPercentile) && We(d.zScore, e.minimumZScore) && d.sampleCount >= e.minimumSampleCount, h = a ? mr(t, n, a, d) : null;
  return {
    result: Rt(
      e,
      f,
      [d],
      f ? d.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${Ze(c)} versus ${Ze(e.minimumRunupPct)} minimum`
    ),
    observations: [d],
    anchor: h
  };
}
function cr(e) {
  var x;
  const t = e.detectorEvaluations.filter((A) => A.result.passed), n = Ke(
    t.flatMap(
      (A) => A.observations.filter(
        (E) => A.result.observationIds.includes(E.observationId)
      )
    )
  ), r = ((x = t.find((A) => A.anchor)) == null ? void 0 : x.anchor) ?? null, s = ue(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), i = Xe(e.series, e.asOf, e.profile.scanTimeframe, 86400), o = Xe(e.series, e.asOf, e.profile.scanTimeframe, 172800), a = wt(e.series, e.asOf, e.profile), c = Ke([
    ...n,
    i,
    o,
    a
  ]), l = t[0], u = l ? n.find(
    (A) => A.observationId === l.result.winningObservationId
  ) ?? n[0] ?? null : null, d = ur(
    s,
    r,
    (l == null ? void 0 : l.result.detectorId) ?? "unknown",
    u,
    i,
    o,
    a
  ), f = pr(e.lifecycleHistory, e.asOf), h = (f == null ? void 0 : f.candidate) ?? null, m = h ? hr(
    h.id,
    "SetupCandidateEpisode",
    h.detectionEventTime,
    h.detectedAt,
    h
  ) : null, y = {
    schemaVersion: Jn,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((A) => A.result.detectorId),
    triggeringObservations: n,
    contextObservations: c,
    selectionAnchor: r,
    pathContext: d,
    initialLifecycleCandidateId: (h == null ? void 0 : h.id) ?? null,
    initialLifecycleCandidateRef: m,
    initialLifecycleState: (f == null ? void 0 : f.state) ?? null,
    initialMtfStructure: {},
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Pr(c.flatMap((A) => A.dataQualityNotes))
  }, b = `radar-episode:${V({
    symbol: y.symbol,
    source: y.source,
    profileHash: y.selectionProfileHash,
    detectedAt: y.detectedAt,
    triggeringObservationIds: n.map((A) => A.observationId)
  })}`, w = { ...y, id: b, logicalObjectId: b };
  return N({
    ...w,
    observationId: `radar-episode-observation:${V(w)}`
  });
}
function lr(e, t, n, r) {
  const s = Object.keys(t.candlesByTimeframe).sort(xt), i = Object.fromEntries(
    s.map((a) => {
      var l, u;
      const c = ue(t.candlesByTimeframe[a] ?? [], a, e.detectedAt);
      return [
        a,
        {
          availableStart: ((l = c[0]) == null ? void 0 : l.bucket) ?? null,
          availableEnd: ((u = c.at(-1)) == null ? void 0 : u.bucket) ?? null,
          completedThrough: c.at(-1) ? U(c.at(-1), a) : null,
          completedCandleCount: c.length
        }
      ];
    })
  ), o = {
    schemaVersion: er,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Et(n),
    lifecycleVersion: $,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: s,
    preRollRequirements: Sr(n),
    dataCoverageByTimeframe: i,
    initialRadarObservations: e.contextObservations,
    initialLifecycleState: e.initialLifecycleState,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return N({
    ...o,
    id: `replay-case:${V(o)}`
  });
}
function Xe(e, t, n, r) {
  const s = {
    id: `context-return-${r}`,
    type: "elapsedWindowReturn",
    windowSeconds: r,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: r
  }, i = ue(e.candlesByTimeframe[n] ?? [], n, t), o = i.at(-1) ?? null, a = o ? gr(i, o.bucket - r) : null, c = o && a && B(a.c) ? (o.c / a.c - 1) * 100 : null, l = c == null ? [te("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return we({
    series: e,
    asOf: t,
    timeframe: n,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: r,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: (a == null ? void 0 : a.c) ?? null,
    value: c,
    unit: "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: i,
    configHash: F(s),
    notes: l
  });
}
function wt(e, t, n) {
  var d;
  const r = n.scanTimeframe, s = ue(e.candlesByTimeframe[r] ?? [], r, t), i = s.at(-1) ?? null, o = i ? s.filter((f) => f.bucket > i.bucket - n.liquidityPolicy.windowSeconds) : [], a = o.map(
    (f) => pe(f.v_quote) ? f.v_quote : pe(f.v_base) ? f.v_base * f.c : null
  ), c = a.length > 0 && a.every((f) => f != null), l = c ? a.reduce((f, h) => f + (h ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return we({
    series: e,
    asOf: t,
    timeframe: r,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((d = o[0]) == null ? void 0 : d.bucket) ?? null,
    referenceValue: null,
    value: l,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: o.length,
    historyCandles: o,
    configHash: F(u),
    notes: c ? [] : [te("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function we(e) {
  var o, a;
  const t = ((o = e.historyCandles[0]) == null ? void 0 : o.bucket) ?? null, n = ((a = e.historyCandles.at(-1)) == null ? void 0 : a.bucket) ?? null, r = F(
    e.historyCandles.map((c) => ({
      bucket: c.bucket,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      vBase: pe(c.v_base) ? c.v_base : null,
      vQuote: pe(c.v_quote) ? c.v_quote : null
    }))
  ), s = `radar-metric:${V({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    timeframe: e.timeframe,
    window: e.window,
    configHash: e.configHash
  })}`, i = {
    schemaVersion: tr,
    logicalObjectId: s,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    timeframe: e.timeframe,
    requestedAsOf: e.asOf,
    effectiveAsOf: e.asOf,
    knownAt: e.asOf,
    window: e.window,
    referenceTime: e.referenceTime,
    referenceValue: e.referenceValue,
    value: e.value,
    unit: e.unit,
    percentile: e.percentile,
    zScore: e.zScore,
    sampleCount: e.sampleCount,
    historyStart: t,
    historyEnd: n,
    configHash: e.configHash,
    inputHash: r,
    dataQualityNotes: e.notes
  };
  return N({
    ...i,
    observationId: `radar-observation:${V(i)}`
  });
}
function ur(e, t, n, r, s, i, o) {
  const a = t ? e.find((m) => m.bucket === t.timestamp) ?? null : null, l = (a ? e.filter((m) => m.bucket <= a.bucket) : []).reduce((m, y) => B(y.c) && (!m || y.c > m.c || y.c === m.c && y.bucket < m.bucket) ? y : m, null), u = e.at(-1) ?? null, d = t && l && B(l.c) ? (t.price / l.c - 1) * 100 : null, f = t && l && u && l.c > t.price ? (u.c - t.price) / (l.c - t.price) : null, h = t && d != null && d < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: s.value,
    net48hReturnPct: i.value,
    triggeringLocalImpulseReturnPct: (r == null ? void 0 : r.unit) === "percent" ? r.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (r == null ? void 0 : r.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (l == null ? void 0 : l.c) ?? null,
    priorPeakTime: (l == null ? void 0 : l.bucket) ?? null,
    priorDrawdownPct: d,
    recoveryFraction: f,
    currentAtrDisplacement: (r == null ? void 0 : r.unit) === "atr" ? r.value : null,
    triggeringPercentile: (r == null ? void 0 : r.percentile) ?? null,
    triggeringZScore: (r == null ? void 0 : r.zScore) ?? null,
    quoteNotional: o.value,
    contextTags: h
  };
}
function fr(e, t, n, r, s, i) {
  return n.hardGates.map((o) => {
    if (o === "sourcePolicy") {
      const u = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
      return { code: o, passed: u, explanation: u ? "Source allowed" : "Source excluded" };
    }
    if (o === "dataQuality") {
      const u = !r.some(
        (d) => d.observations.some(
          (f) => f.dataQualityNotes.some((h) => h.severity === "error")
        )
      );
      return { code: o, passed: u, explanation: u ? "Required metrics available" : "Required metric data unavailable" };
    }
    if (o === "executionVenueEligibility") {
      const u = wr(s.status, n.executionVenuePolicy.mode);
      return { code: o, passed: u, explanation: `Execution venue ${s.status}` };
    }
    if (o === "selectedUniverse") {
      const u = br(i, e, t);
      return {
        code: o,
        passed: (u == null ? void 0 : u.included) === !0,
        explanation: u ? u.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown"
      };
    }
    const a = wt(e, t, n), c = n.liquidityPolicy.minimumQuoteNotional, l = c == null || a.value == null ? c == null || n.liquidityPolicy.missingData === "warn" : a.value >= c;
    return {
      code: o,
      passed: l,
      explanation: c == null ? "No minimum liquidity configured" : a.value == null ? "Quote-notional history unavailable" : `Quote notional ${a.value} versus ${c} minimum`
    };
  });
}
function dr(e, t, n, r) {
  const s = n.executionVenuePolicy.intendedVenue ?? "ignored", i = [...r].filter(
    (a) => a.symbol.toUpperCase() === e.symbol.toUpperCase() && a.marketDataSource === e.source && a.executionVenue.toLowerCase() === s.toLowerCase() && a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo >= t)
  ).sort((a, c) => a.effectiveFrom - c.effectiveFrom || a.knownAt - c.knownAt).at(-1);
  if (i) return i;
  const o = {
    schemaVersion: ir,
    logicalObjectId: `execution-venue:${s}:${e.symbol}`,
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: s,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      te(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  };
  return N({
    ...o,
    observationId: `execution-venue-observation:${V(o)}`
  });
}
function mr(e, t, n, r) {
  const s = {
    logicalObjectId: `selection-anchor:${V({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - U(n, r.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: r.observationId
  };
  return N({
    ...s,
    observationId: `selection-anchor-observation:${V(s)}`
  });
}
function xe(e, t, n, r, s) {
  const i = {
    schemaVersion: rr,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: r,
    rearmState: s
  };
  return N({
    ...i,
    observationId: `radar-status:${V(i)}`
  });
}
function hr(e, t, n, r, s) {
  return N({
    logicalObjectId: e,
    observationId: `${t.toLowerCase()}-observation:${V({ logicalObjectId: e, knownAt: r, snapshot: s })}`,
    objectType: t,
    eventTime: n,
    knownAt: r
  });
}
function vr(e, t, n, r, s, i, o) {
  const a = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: r,
    detectorGatePassed: s,
    hardGatesPassed: i,
    compositePassed: o
  };
  return N({
    ...a,
    id: `radar-gate:${V(a)}`
  });
}
function Rt(e, t, n, r, s) {
  return {
    detectorId: e.id,
    detectorType: e.type,
    passed: t,
    observationIds: n.map((i) => i.observationId),
    winningObservationId: r,
    explanation: s
  };
}
function yr(e, t, n, r, s, i) {
  return we({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: e.type,
    metricVersion: `${e.type}.1`,
    window: null,
    referenceTime: null,
    referenceValue: null,
    value: null,
    unit: e.type === "emaAtrDisplacement" ? "atr" : "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: [],
    configHash: F(e),
    notes: [te(s, "error", i)]
  });
}
function ue(e, t, n) {
  return Tt(e).filter((r) => U(r, t) <= n);
}
function Tt(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of [...e].sort((r, s) => r.bucket - s.bucket || r.ts - s.ts))
    Er(n) && t.set(n.bucket, n);
  return [...t.values()].sort((n, r) => n.bucket - r.bucket);
}
function gr(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function pr(e, t) {
  return [...e].filter((n) => n.asOf != null && n.asOf <= t).sort((n, r) => (n.asOf ?? 0) - (r.asOf ?? 0)).at(-1) ?? null;
}
function br(e, t, n) {
  return [...e].filter(
    (r) => r.symbol.toUpperCase() === t.symbol.toUpperCase() && r.source === t.source && r.knownAt <= n && r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo >= n)
  ).sort((r, s) => r.effectiveFrom - s.effectiveFrom || r.knownAt - s.knownAt).at(-1) ?? null;
}
function Sr(e) {
  const t = /* @__PURE__ */ new Map();
  function n(r, s, i, o) {
    const a = t.get(r) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    a.duration = Math.max(a.duration, s), a.bars = Math.max(a.bars, i), a.purposes.add(o), t.set(r, a);
  }
  n(e.scanTimeframe, 172800, 0, "24h/48h path context"), n(e.scanTimeframe, e.liquidityPolicy.windowSeconds, 0, "liquidity context");
  for (const r of e.moveDetectors)
    r.type === "rollingTroughRunup" ? n(e.scanTimeframe, r.lookbackSeconds, 0, r.id) : r.type === "elapsedWindowReturn" ? n(e.scanTimeframe, r.windowSeconds + r.historyLookbackSeconds, 0, r.id) : r.type === "maximumWindowReturn" ? n(
      e.scanTimeframe,
      Math.max(...r.windowsSeconds) + r.historyLookbackSeconds,
      0,
      r.id
    ) : n(
      r.analysisTimeframe,
      0,
      Math.max(r.emaPeriod, r.atrPeriod) + 1,
      r.id
    );
  return [...t.entries()].sort(([r], [s]) => xt(r, s)).map(([r, s]) => ({
    timeframe: r,
    minimumDurationSeconds: s.duration,
    minimumBars: s.bars,
    purposes: [...s.purposes].sort()
  }));
}
function Ar(e, t) {
  return t.mode === "all" ? e.every(Boolean) : t.mode === "atLeast" ? e.filter(Boolean).length >= t.count : e.some(Boolean);
}
function wr(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Rr(e, t) {
  const n = J(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function O(e) {
  throw new RangeError(e);
}
function Tr(e) {
  e.schemaVersion !== St && O("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && O("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && O("Only impulse_fade_v1 radar profiles are supported"), Number.isFinite(J(e.scanTimeframe)) || O("scanTimeframe must be valid"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && O("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || O("At least one move detector is required"), new Set(e.moveDetectors.map((t) => t.id)).size !== e.moveDetectors.length && O("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && O("Hard gates must be unique"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && O("atLeast detector count must be between one and the detector count"), (!B(e.episodeExpiry.maximumAgeSeconds) || !B(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && O("Episode expiry, reset duration, and createdAt must be valid");
  for (const t of e.moveDetectors) kr(t);
}
function kr(e) {
  e.id.trim() || O("Detector ID is required"), Object.entries(e).filter(([n, r]) => n !== "minimumReturnPct" && n !== "minimumPercentile" && n !== "minimumZScore" && typeof r == "number").map(([, n]) => n).some((n) => !Number.isFinite(n) || n < 0) && O(`Detector ${e.id} contains invalid numeric settings`), e.type === "maximumWindowReturn" && !e.windowsSeconds.length && O(`Detector ${e.id} requires at least one window`);
}
function xr(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (At(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
}
function We(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function Er(e) {
  return Number.isFinite(e.bucket) && B(e.o) && B(e.h) && B(e.l) && B(e.c);
}
function B(e) {
  return Number.isFinite(e) && e > 0;
}
function pe(e) {
  return e != null && Number.isFinite(e);
}
function te(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Pr(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Ke(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(kt);
}
function kt(e, t) {
  return e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function Cr(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function Nr(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function Ir(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function xt(e, t) {
  return J(e) - J(t) || e.localeCompare(t);
}
function Et(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function Ze(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function V(e) {
  return F(e).slice(8);
}
function pi(e) {
  return L(e);
}
const _r = "linear-quote-perpetual-risk.1", Mr = "sizing-result.1", Fr = "trade-plan.1", Or = "decision-record.1";
function Pt(e) {
  const t = [], n = [
    K(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(K("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((C) => !Number.isFinite(C) || C <= 0) && t.push(K("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(K("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && S(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!ye(e.intendedEntryPrice, e.venueRules.priceTick) || !ye(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (C) => !ye(C.targetPrice, e.venueRules.priceTick)
  )) && S(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !ye(e.leveragePolicy.leverage, e.venueRules.leverageStep) && S(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    K(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const s = e.riskRequest.accountRiskFraction != null, i = e.riskRequest.fixedRiskAmount != null;
  s === i && t.push(
    K(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (s && (!D(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!D(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && S(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (C) => !Number.isFinite(C) || C < 0
  ) && S(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && S(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const o = i ? e.riskRequest.fixedRiskAmount : s ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (o == null || !Number.isFinite(o) || o <= 0) && S(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Br(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const a = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = D(a) ? a : null, l = D(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && S(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const d = o != null && u != null && u > 0 ? o / u : null;
  let f = d == null ? null : Ye(d, e.venueRules.quantityStep);
  if (f != null && o != null && u != null)
    for (; f > 0 && f * u > o + Math.max(1e-10, o * 1e-12); )
      f = Ye(
        f - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const h = f != null && f > 0 ? f : null, m = h == null ? null : h * e.intendedEntryPrice, y = h == null || c == null ? null : h * c * e.executionAssumptions.entryFeeRate, b = h == null || l == null ? null : h * l * e.executionAssumptions.stopExitFeeRate, w = h == null || u == null ? null : h * u;
  (h == null || h < e.venueRules.minQuantity) && S(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (m == null || m < e.venueRules.minNotional) && S(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const x = e.riskRequest.maximumNotional;
  x != null && m != null && m > x && S(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${x}`
  );
  const A = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, E = e.accountState.availableBalance == null ? A : Math.min(A, e.accountState.availableBalance), R = m != null && E > 0 ? m / E : null, p = Ur(
    e.leveragePolicy,
    R,
    e.venueRules.leverageStep
  );
  p != null && p > e.venueRules.maxLeverage && S(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${p} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const v = m != null && p != null && p > 0 ? m / p : null;
  v != null && v > A + 1e-10 && S(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), v != null && e.accountState.availableBalance != null && v > e.accountState.availableBalance + 1e-10 && S(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const k = h != null && c != null && l != null ? h * (l - c) : null, M = Dr(
    e.targets,
    h,
    c,
    k,
    w,
    e.executionAssumptions
  ), fe = ge(
    M.map((C) => C.grossReward * C.positionFraction)
  ), de = ge(
    M.map((C) => C.netProjectedReward * C.positionFraction)
  ), me = ge(
    M.map(
      (C) => C.weightedGrossRContribution == null ? null : C.weightedGrossRContribution
    )
  ), X = ge(
    M.map(
      (C) => C.weightedRContribution == null ? null : C.weightedRContribution
    )
  );
  return N({
    schemaVersion: Mr,
    sizingModelVersion: _r,
    side: e.side,
    riskBudget: o,
    rawQuantity: d,
    roundedQuantity: h,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: m,
    estimatedEntryFee: y,
    estimatedStopFee: b,
    projectedLossAtStop: w,
    projectedLossPercentEquity: w == null || e.accountState.equity <= 0 ? null : w / e.accountState.equity * 100,
    selectedLeverage: p,
    minimumRequiredLeverage: R,
    initialMargin: v,
    marginPercentEquity: v == null || e.accountState.equity <= 0 ? null : v / e.accountState.equity * 100,
    marginPercentAvailableBalance: v == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : v / e.accountState.availableBalance * 100,
    targetOutcomes: M,
    weightedGrossReward: fe,
    weightedProjectedReward: de,
    weightedGrossR: me,
    weightedProjectedR: X,
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
function bi(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = Pt({
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
    schemaVersion: Fr,
    snapshotId: e.snapshot.id,
    setupFamily: G,
    lifecycleVersion: $,
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
  }, r = { ...n, id: e.id ?? Ct(n) }, s = Lr({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return N({ ...r, complianceResult: s });
}
function Lr(e) {
  var f, h, m;
  const { strategyProfile: t, snapshot: n, plan: r } = e, s = [...r.sizingResult.hardErrors], i = [], o = [...r.sizingResult.warnings], a = Pt({
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
  (pt(t) !== t.profileHash || bt(n) !== n.id || Ct(r) !== r.id || L(a) !== L(r.sizingResult)) && S(
    s,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (f = n.candidateEpisode) != null && f.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && S(
    s,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== gt || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || L(r.executionAssumptions) !== L(t.executionAssumptions)) && S(
    s,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(r.entryPlan.orderPlanType) || S(
    i,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${r.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(r.stopPlan.derivationType) || S(
    i,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${r.stopPlan.derivationType} is not permitted`
  );
  for (const y of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(y.derivationType) || S(
      i,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${y.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && S(
    i,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = r.targetPlans.reduce(
    (y, b) => y + b.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && S(
    s,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), qr(n, r, s), $r(r, s), Hr(n, t, i), Vr(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((h = n.candidateEpisode) == null ? void 0 : h.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && S(
    i,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), r.sizingResult.initialMargin != null && r.sizingResult.initialMargin > r.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && S(
    i,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && r.sizingResult.grossNotional != null && r.sizingResult.grossNotional > t.riskPolicy.maximumNotional && S(
    i,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && r.sizingResult.weightedProjectedR != null && r.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && S(
    i,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${r.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), r.sizingResult.projectedLossAtStop != null && r.sizingResult.projectedLossAtStop > r.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && S(
    i,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = i.some((y) => y.code === "NO_ACTIVE_CANDIDATE"), u = ((m = r.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  r.status === "finalized" && i.length > 0 && !l && !u && S(
    s,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let d;
  return s.length > 0 ? d = "InvalidPlan" : l ? d = "OutOfStrategy" : i.length === 0 ? d = "Compliant" : u ? d = "Overridden" : d = "OutOfStrategy", N({
    classification: d,
    hardErrors: s,
    strategyViolations: i,
    warnings: o,
    overrideReason: u
  });
}
function Si(e) {
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
    schemaVersion: Or,
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
  }, n = e.id ?? `decision:${F(t).slice(8)}`;
  return N({ ...t, id: n });
}
function Br(e, t, n, r) {
  (!e.length || e.some((i) => i.targetPrice >= t)) && S(r, "NO_VALID_TARGET", "Every short target must be below entry");
  const s = e.reduce((i, o) => i + o.positionFraction, 0);
  (e.some(
    (i) => !Number.isFinite(i.positionFraction) || i.positionFraction <= 0
  ) || Math.abs(s - 1) > n) && S(
    r,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function Dr(e, t, n, r, s, i) {
  return t == null || n == null ? [] : e.map((o) => {
    const a = o.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), c = t * (n - a), l = t * n * i.entryFeeRate, u = t * a * i.targetExitFeeRate, d = c - l - u, f = r != null && r > 0 ? c / r : null, h = s != null && s > 0 ? d / s : null;
    return {
      targetId: o.id,
      targetPrice: o.targetPrice,
      effectiveTargetPrice: a,
      positionFraction: o.positionFraction,
      grossReward: c,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: d,
      grossR: f,
      projectedR: h,
      weightedGrossRContribution: f == null ? null : f * o.positionFraction,
      weightedRContribution: h == null ? null : h * o.positionFraction
    };
  });
}
function Hr(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    S(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (S(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && S(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && S(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const s = e.lifecycleEvidence.some(
    (i) => i.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !s && S(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && S(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function Vr(e, t, n) {
  var c;
  const r = t.entryPolicy.requiredDataQuality, s = r.candidateMetricsRequired && e.candidateMetrics == null, i = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, o = r.minimumHistoryCoverageRatio != null && (i == null || i < r.minimumHistoryCoverageRatio), a = e.dataQualityNotes.some(
    (l) => r.rejectedNoteSeverities.includes(l.severity)
  );
  (s || o || a) && S(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function qr(e, t, n) {
  const r = new Map(
    Qn(e).map((i) => [i.id, i])
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
      S(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    i.reference.knownAt > e.effectiveAsOf && S(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${i.id} was not known at the decision cutoff`
    );
    const o = r.get(i.id);
    o ? L(o) !== L(i.reference) && S(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${i.id} differs from the frozen snapshot object`
    ) : S(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${i.id} is absent from the decision snapshot`
    );
  }
}
function $r(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && S(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const s = e.stopPlan.referenceLevel;
  if (s && e.stopPlan.derivationType !== "manual") {
    const i = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? s.rangeHigh ?? s.price : s.price, { basisPoints: o, atrFraction: a, atrValue: c } = e.stopPlan.buffer;
    let l = i;
    o != null && a != null ? S(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : o != null ? l = i * (1 + o / 1e4) : a != null && (D(c ?? 0) ? l = i + a * (c ?? 0) : S(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && S(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const i of e.targetPlans) {
    const o = i.referenceLevel;
    if (!o || i.derivationType === "manual" || i.derivationType === "fixedRMultiple")
      continue;
    (i.derivationType === "supportZone" ? i.targetPrice >= (o.rangeLow ?? o.price) - n && i.targetPrice <= (o.rangeHigh ?? o.price) + n : Math.abs(i.targetPrice - o.price) <= n + 1e-12) || S(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${i.id} does not match its frozen reference`
    );
  }
}
function Ur(e, t, n) {
  return e.mode === "manual" ? D(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, zr(t, n));
}
function Ct(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${F(r).slice(8)}`;
}
function Ye(e, t) {
  if (!D(e) || !D(t)) return 0;
  const n = Nt(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function zr(e, t) {
  if (!D(e) || !D(t)) return e;
  const n = Nt(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Nt(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function ye(e, t) {
  if (!Number.isFinite(e) || !D(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function ge(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function D(e) {
  return Number.isFinite(e) && e > 0;
}
function K(e, t) {
  return { code: e, message: t };
}
function S(e, t, n) {
  e.some((r) => r.code === t) || e.push(K(t, n));
}
export {
  ai as CANDLE_TIMESTAMP_SEMANTICS,
  Or as DECISION_RECORD_SCHEMA_VERSION,
  gt as DECISION_SNAPSHOT_SCHEMA_VERSION,
  Gn as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  ir as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  yi as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  ie as IMPULSE_FADE_CANDIDATE_GATE,
  qt as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  $ as IMPULSE_FADE_LIFECYCLE_VERSION,
  $n as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  Un as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  G as IMPULSE_FADE_SETUP_FAMILY,
  Jn as RADAR_EPISODE_SCHEMA_VERSION,
  tr as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  nr as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  St as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  rr as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  er as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  _r as SIZING_MODEL_VERSION,
  Mr as SIZING_RESULT_SCHEMA_VERSION,
  qn as STRATEGY_PROFILE_SCHEMA_VERSION,
  Fr as TRADE_PLAN_SCHEMA_VERSION,
  Kr as appendSyntheticCandle,
  ee as bucketStart,
  Pt as calculateLinearPerpetualSizing,
  U as candleCloseTime,
  He as candleToBytes,
  It as candlesToBytes,
  F as canonicalHash,
  pi as canonicalRadarJson,
  L as canonicalSerialize,
  ft as computeAnchoredVwapLine,
  li as computeAnchoredVwapSignals,
  ci as computeAnchoredVwapSnapshot,
  ii as computeAtrLine,
  ei as computeBollingerBands,
  Qr as computeCloseChangePct,
  Yr as computeEmaLine,
  Ie as computeExtensionSnapshot,
  ri as computeMacd,
  oe as computeMarketStructure,
  rn as computeRelativeCumulativeReturnLine,
  di as computeRelativeStrengthDivergences,
  ti as computeRsiLine,
  $t as computeSetupState,
  Zr as computeSmaLine,
  ni as computeStochRsi,
  ui as computeStructureActiveLevels,
  fi as computeSupportResistanceZones,
  nn as computeSupportResistanceZonesFromSwings,
  tn as computeSwingPoints,
  Xr as computeViewBounds,
  Jr as computeWmaLine,
  Si as createDecisionRecord,
  hi as createDecisionReferenceLevel,
  vi as createDecisionSnapshot,
  jn as createImpulseFadeResearchProfile,
  sr as createRadarSelectionProfile,
  zn as createStrategyProfile,
  bi as createTradePlan,
  bt as decisionSnapshotId,
  Qn as decisionSnapshotReferenceLevels,
  oi as evaluateImpulseFadeSnapshot,
  si as evaluateImpulseFadeTimeline,
  Lr as evaluateTradePlanCompliance,
  N as immutableJsonClone,
  ne as impulseFadeLifecycleConfigHash,
  mi as lineToBytes,
  Wr as makeSyntheticCandles,
  _t as mergeLiveCandle,
  Je as normalizeOhlcvPoint,
  jr as normalizeRestTimeframe,
  et as packHistoricalCandles,
  Gr as prependHistoricalCandles,
  At as radarSelectionProfileHash,
  gi as scanRadarEpisodes,
  pt as strategyProfileHash,
  J as timeframeToSeconds,
  Ct as tradePlanId
};
