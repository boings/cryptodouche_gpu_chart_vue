function K(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function pi(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ae(e, t) {
  return Math.floor(e / t) * t;
}
function dt(e) {
  const t = yt(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = nn(n.ts), o = re(n.o), i = re(n.h), s = re(n.l), a = re(n.c);
  return r == null || o == null || i == null || s == null || a == null ? null : {
    ts: r,
    o,
    h: i,
    l: s,
    c: a,
    v_base: re(n.v_base),
    v_quote: re(n.v_quote),
    ver: re(n.ver)
  };
}
function mt(e, t, n) {
  const r = K(t), o = en(
    e.map((a, c) => ht(a, c)).filter((a) => a != null),
    r
  ).slice(-Math.max(1, n));
  if (!o.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const i = ae(o[0].ts, r), s = o.map((a) => {
    const c = ae(a.ts, r);
    return {
      ...a,
      bucket: c,
      x: (c - i) / r
    };
  });
  return He({
    timeframeSec: r,
    firstBucket: i,
    candles: s,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Si(e, t, n) {
  const r = e.candles.length, o = t.map((s, a) => ht(s, a)).filter((s) => s != null).filter((s) => ae(s.ts, e.timeframeSec) < e.firstBucket).sort(vt);
  if (!o.length) return 0;
  const i = mt(
    [...o, ...e.candles],
    n,
    o.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function Yt(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function et(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function wi(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function Zt(e, t, n, r = 3) {
  const o = dt(t);
  if (!o) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = ae(o.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const s = e.positionByBucket.get(i), a = (i - e.firstBucket) / e.timeframeSec, c = { ...o, bucket: i, x: a };
  if (s != null)
    return an(c, e.candles[s]) ? { kind: "ignore", reason: "stale-version" } : sn(e.candles[s], c) ? (e.candles[s] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[s] = c, {
      kind: "replace",
      position: s,
      bytes: et(c)
    });
  const l = e.candles[e.candles.length - 1];
  return i <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - l.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Jt(e), { kind: "reset", bytes: Yt(e.candles) }) : (He(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: et(c)
  }));
}
function Ai(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, r = -1 / 0;
  for (const s of e)
    n = Math.min(n, s.l), r = Math.max(r, s.h);
  for (const s of t)
    for (let a = 1; a < s.length; a += 2) {
      const c = s[a];
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
function ki(e, t, n) {
  const r = K(n), o = Math.floor(Date.now() / 1e3), i = ae(o, r), s = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), a = [];
  let c = 40 + s % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = i - l * r, f = Math.sin((t - l + s) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((t - l) / 13) * 0.35), h = Math.max(d, m) + 0.35 + Math.abs(Math.sin(l + s)) * 0.5, b = Math.min(d, m) - 0.35 - Math.abs(Math.cos(l + s)) * 0.5, v = 50 + s % 90 + Math.abs(Math.sin((t - l + s) / 5)) * 180;
    a.push({ ts: u, o: d, h, l: b, c: m, v_base: v, v_quote: v * m }), c = m;
  }
  return mt(a, n, t);
}
function Ti(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, o = Math.sin(r / 600) * 0.7, i = n.c, s = Math.max(1e-4, i + o), a = Math.max(i, s) + 0.5, c = Math.min(i, s) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(o) * 0.36));
  return Zt(e, { ts: r, o: i, h: a, l: c, c: s, v_base: l, v_quote: l * s }, t);
}
function Jt(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  He(e);
}
function He(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function ht(e, t) {
  const n = dt(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function en(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = ae(r.ts, t), i = n.get(o);
    (!i || vt(r, i) > 0) && n.set(o, r);
  }
  return Array.from(n.entries()).sort(([r], [o]) => r - o).map(([, r]) => tn(r));
}
function vt(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function tn(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function nn(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? rn(e) : on(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function rn(e) {
  const [
    t,
    n = 1,
    r = 0,
    o = 0,
    i = 0,
    s = 0,
    a = 0,
    c = 0,
    l = 0
  ] = e, u = Math.floor(Number(s) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(r) - Number(a),
    Number(o) - Number(c),
    Number(i) - Number(l),
    u
  );
}
function on(e) {
  const [t, n = 1, r = 1, o = 0, i = 0, s = 0, a = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(r),
    Number(o),
    Number(i),
    Number(s),
    Number(a)
  );
}
function sn(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function an(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function re(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function yt(e) {
  if (typeof e == "string")
    try {
      return yt(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
function D(e) {
  const t = /* @__PURE__ */ new Set();
  function n(o, i = !1) {
    if (o === null) return "null";
    if (typeof o == "string" || typeof o == "boolean")
      return JSON.stringify(o);
    if (typeof o == "number") {
      if (!Number.isFinite(o))
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      return Object.is(o, -0) ? "0" : JSON.stringify(o);
    }
    if (o === void 0) return i ? "null" : void 0;
    if (typeof o != "object")
      throw new TypeError(`Canonical JSON does not support ${typeof o}`);
    if (Object.getPrototypeOf(o) !== Object.prototype && !Array.isArray(o))
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    if (t.has(o)) throw new TypeError("Canonical JSON does not support cycles");
    t.add(o);
    let s;
    return Array.isArray(o) ? s = `[${o.map((a) => n(a, !0) ?? "null").join(",")}]` : s = `{${Object.keys(o).sort().flatMap((c) => {
      const l = n(o[c]);
      return l == null ? [] : [`${JSON.stringify(c)}:${l}`];
    }).join(",")}}`, t.delete(o), s;
  }
  const r = n(e);
  if (r == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return r;
}
function L(e) {
  const t = new TextEncoder().encode(D(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function M(e) {
  return bt(JSON.parse(D(e)));
}
function bt(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) bt(t);
    Object.freeze(e);
  }
  return e;
}
const J = "impulse_fade_v1", Q = "impulse_fade_v1.lifecycle.1", cn = "impulse_fade_v1.lifecycle-config.1", de = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function Ri(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((o, i) => {
    r += o.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(o.x, r / t);
  }), new Float32Array(n);
}
function Ei(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = 2 / (t + 1);
  let o = 0;
  for (let i = 0; i < t; i++)
    o += e[i].c;
  o /= t, n.push(e[t - 1].x, o);
  for (let i = t; i < e.length; i++)
    o = (e[i].c - o) * r + o, n.push(e[i].x, o);
  return new Float32Array(n);
}
function xi(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = t * (t + 1) / 2;
  for (let o = t - 1; o < e.length; o++) {
    let i = 0;
    for (let s = 0; s < t; s++)
      i += e[o - t + 1 + s].c * (s + 1);
    n.push(e[o].x, i / r);
  }
  return new Float32Array(n);
}
function Pi(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const r = [], o = [], i = [];
  let s = 0, a = 0;
  return e.forEach((c, l) => {
    if (s += c.c, a += c.c * c.c, l >= t) {
      const u = e[l - t].c;
      s -= u, a -= u * u;
    }
    if (l >= t - 1) {
      const u = s / t, f = Math.max(0, a / t - u * u), d = Math.sqrt(f) * n;
      r.push(c.x, u), o.push(c.x, u + d), i.push(c.x, u - d);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(o),
    lower: new Float32Array(i)
  };
}
function Ci(e, t = 14) {
  return oe(Ct(e, t));
}
function Ii(e, t = 14, n = 14, r = 3, o = 3) {
  const i = Ct(e, t), s = se(n);
  if (i.length < s)
    return { k: new Float32Array(), d: new Float32Array() };
  const a = [];
  for (let u = s - 1; u < i.length; u++) {
    let f = 1 / 0, d = -1 / 0;
    for (let b = 0; b < s; b++) {
      const v = i[u - b].value;
      f = Math.min(f, v), d = Math.max(d, v);
    }
    const m = d - f, h = m > 0 ? (i[u].value - f) / m * 100 : 50;
    a.push({ x: i[u].x, value: h });
  }
  const c = st(a, se(r)), l = st(c, se(o));
  return {
    k: oe(c),
    d: oe(l)
  };
}
function Ni(e, t = 12, n = 26, r = 9) {
  const o = Le(e, t), i = Le(e, n), s = [];
  for (let u = 0; u < e.length; u++) {
    const f = o[u], d = i[u];
    f == null || d == null || s.push({ x: e[u].x, value: f - d });
  }
  const a = sr(s, r), c = new Map(s.map((u) => [u.x, u.value])), l = a.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: oe(s),
    signal: oe(a),
    histogram: oe(l)
  };
}
function _i(e, t = 14) {
  const n = Ee(e, t), r = [];
  return n.forEach((o, i) => {
    o != null && r.push({ x: e[i].x, value: o });
  }), oe(r);
}
function Ve(e, t = {}) {
  const n = k(t.windowSeconds, 60, 2592e3, 86400), r = k(t.historyDays, 1, 365, 180), o = k(t.minSamples, 1, 5e3, 20), i = k(t.emaPeriod, 2, 500, 20), s = k(t.atrPeriod, 2, 500, 14), a = xt(e);
  if (!a)
    return $n(n);
  const c = e.indexOf(a), l = Pt(e, a.bucket - n, c), u = l && B(l.c) ? (a.c / l.c - 1) * 100 : null, f = u == null ? [] : qn(e, {
    windowSeconds: n,
    earliestBucket: a.bucket - r * 86400,
    excludeBucket: a.bucket
  }), d = u != null && f.length >= o ? Un(f, u) : null, m = u != null && f.length >= o ? jn(f, u) : null, h = Le(e, i)[c] ?? null, b = Ee(e, s)[c] ?? null, v = h != null && b != null && Number.isFinite(h) && Number.isFinite(b) && b > 0 ? (a.c - h) / b : null;
  return {
    candle: a,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: d,
    zScore: m,
    rollingReturnCount: f.length,
    ema: h,
    atr: b,
    atrExtension: v
  };
}
function ln(e = {}) {
  var G, ne, x;
  const t = e.executionTimeframe ?? "chart", n = w(e.asOf), r = w(e.latestTs) ?? Pn(e.candles ?? [], t) ?? w((G = e.structure) == null ? void 0 : G.updatedTs) ?? w((ne = e.marketStructure) == null ? void 0 : ne.summary.updatedTs) ?? null, o = n ?? r, i = o == null ? null : ze(e.candles ?? [], o, t), s = (i == null ? void 0 : i.candle.c) ?? w(e.latestPrice), a = un(e.marketStructure ?? null, n), c = (a == null ? void 0 : a.summary) ?? fn(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : qe(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (V) => n == null || _(V) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (V) => n == null || _(V) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (V) => n == null || _(V) <= n
  ), h = F(e.resistanceNearPct, 0, 10, 1.5), b = F(e.retestNearPct, 0, 10, 0.8), v = _n(e.extension ?? null), g = On(f, s, h), E = Mn(d), R = Fn(c), T = Ln(
    m,
    e.avwapDistancePct
  ), P = Dn(c, f, s, b), S = Bn(v, g, c, s), y = [
    v,
    g,
    E,
    R,
    T,
    P
  ], p = {
    checks: y,
    asOf: o,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ce({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, O = wn({
    extension: v,
    htfResistance: g,
    htfStructures: u,
    rsWeakness: E,
    structureShift: R,
    avwapFailure: T,
    retest: P,
    invalidated: S
  });
  return (x = e.candles) != null && x.length && o != null ? hn({
    ...e,
    asOf: o,
    latestPrice: s,
    marketStructure: a,
    structure: c,
    htfStructures: l,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: m,
    checks: y,
    executionTimeframe: t
  }) : kt({
    ...p,
    state: O,
    reason: Vn(O, y),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function un(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((s) => s.knownAt <= t), r = e.breaks.filter((s) => s.knownAt <= t), o = ((i = te(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: o,
    summary: Qe(n, r, o)
  };
}
function fn(e, t) {
  if (!e || t == null) return e ?? null;
  const n = w(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function Oi(e) {
  return dn(e).records;
}
function ce(e = {}) {
  var t, n, r, o, i, s, a, c, l, u, f;
  return L({
    lifecycleVersion: Q,
    lifecycleConfigVersion: cn,
    candidateGate: de,
    extension: {
      windowSeconds: k(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: k((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: k((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: k((o = e.extensionOptions) == null ? void 0 : o.emaPeriod, 2, 500, 20),
      atrPeriod: k((i = e.extensionOptions) == null ? void 0 : i.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: k(
        (s = e.marketStructureOptions) == null ? void 0 : s.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: k(
        (a = e.marketStructureOptions) == null ? void 0 : a.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: k((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: F((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: k((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: k((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: F(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: F(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: F(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: F(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: F(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: k(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Mi(e) {
  var a;
  const t = St(e), n = te(t);
  if (n == null) return null;
  const r = pt(e, n), o = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], s = new Set(
    i.map((c) => X(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && _(c) <= n && s.add(_(c));
  for (const c of [...s].sort((l, u) => l - u))
    $e(
      Te(i, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (a = e.config) == null ? void 0 : a.marketStructureOptions,
      c,
      o
    );
  return gt(
    e,
    n,
    o,
    r
  );
}
function dn(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, o = ce(r), i = St(e), s = pt(
    e,
    te(i) ?? 0
  ), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = w(e.from) ?? -1 / 0;
  let f = null;
  return { records: i.map((m) => {
    var R, T, P, S, y;
    const h = gt(
      e,
      m,
      a,
      s
    ), b = wt(e.candidateMetrics, m), v = (b == null ? void 0 : b.metrics) ?? je(
      Ve(
        Te(n, t, m),
        r.extensionOptions
      )
    );
    f = h;
    const g = h.evidence.filter((p) => c.has(p.id) ? !1 : (c.add(p.id), p.knownAt >= u)), E = h.transitions.filter((p) => {
      const O = mn(p);
      return l.has(O) ? !1 : (l.add(O), p.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: J,
      lifecycleVersion: Q,
      lifecycleConfigHash: o,
      candidateGatePassed: be(v),
      candidateId: ((R = h.candidate) == null ? void 0 : R.id) ?? null,
      candidateDetectedAt: ((T = h.candidate) == null ? void 0 : T.detectedAt) ?? null,
      initialMtfContext: ((P = h.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: h.currentState,
      stateSince: h.stateSince,
      transition: te(E) ?? null,
      transitions: E,
      evidenceAdded: g,
      pendingConditions: h.pendingConditions,
      confluence: h.confluence,
      episodeHigh: ((S = h.candidate) == null ? void 0 : S.episodeHigh) ?? null,
      episodeHighTime: ((y = h.candidate) == null ? void 0 : y.episodeHighTime) ?? null,
      activeBreakLevel: h.activeBreakLevel,
      retestLevel: h.retestLevel,
      terminalReason: h.invalidationReason ?? h.expiryReason,
      dataQualityNotes: h.dataQuality
    };
  }), latestSnapshot: f };
}
function gt(e, t, n, r) {
  const o = e.executionTimeframe, i = e.candlesByTimeframe[o] ?? [], s = e.config ?? {}, a = ce(s), c = Te(i, o, t), l = Ve(c, s.extensionOptions), u = wt(e.candidateMetrics, t), f = (u == null ? void 0 : u.metrics) ?? je(l), d = $e(
    c,
    o,
    e.structureEvents ?? [],
    s.marketStructureOptions,
    t,
    n
  ), m = r.filter(
    (b) => (b.summary.updatedTs ?? 0) <= t
  ), h = te(c) ?? null;
  return ln({
    candles: i,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: o,
    asOf: t,
    extensionOptions: s.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: f,
    marketStructure: d,
    structure: d.summary,
    htfStructures: m,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (h == null ? void 0 : h.c) ?? null,
    latestTs: t,
    resistanceNearPct: s.resistanceNearPct,
    retestNearPct: s.retestNearPct,
    retestToleranceBps: s.retestToleranceBps,
    retestToleranceAtr: s.retestToleranceAtr,
    invalidationBps: s.invalidationBps,
    maxCandidateAgeSeconds: s.maxCandidateAgeSeconds,
    lifecycleConfigHash: a
  });
}
function pt(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const o = new Set(
      r.map((i) => X(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && _(i) <= t && o.add(_(i));
    return [...o].sort((i, s) => i - s).map((i) => {
      var a;
      const s = $e(
        Te(r, n, i),
        n,
        e.structureEvents ?? [],
        (a = e.config) == null ? void 0 : a.marketStructureOptions,
        i
      );
      return {
        timeframe: n,
        summary: { ...s.summary, updatedTs: i }
      };
    });
  });
}
const Fi = "openTime";
function X(e, t) {
  return (w(e.bucket) ?? w(e.ts) ?? 0) + Math.max(1, K(t));
}
function Te(e, t, n) {
  return e.filter((r) => X(r, t) <= n);
}
function St(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, s] of Object.entries(e.candlesByTimeframe))
    for (const a of s) t.add(X(a, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(w(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(_(i));
  for (const i of e.avwapEvents ?? []) t.add(_(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(_(i));
  for (const i of e.supportResistanceZones ?? []) t.add(_(i));
  for (const i of e.evaluationPoints ?? []) {
    const s = w(i);
    s != null && t.add(s);
  }
  const n = [...t].filter(Number.isFinite).sort((i, s) => i - s), r = w(e.from) ?? n[0] ?? 0, o = w(e.to) ?? te(n) ?? r;
  return t.add(r), t.add(o), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= o).sort((i, s) => i - s);
}
function wt(e, t) {
  return te([...e ?? []].filter((n) => (w(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (w(n.knownAt) ?? n.asOf) - (w(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function $e(e, t, n, r, o, i) {
  var f;
  const s = he(e, r), a = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && _(d) <= o
  ), c = i ?? /* @__PURE__ */ new Map();
  for (const d of [...s.breaks, ...a])
    c.set(
      Z(
        d.kind,
        t,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const l = [...c.values()].filter((d) => d.knownAt <= o).sort(
    (d, m) => d.knownAt - m.knownAt || d.eventTime - m.eventTime
  );
  if (!l.length) return s;
  const u = ((f = te(l)) == null ? void 0 : f.direction) ?? s.trend;
  return {
    swings: s.swings,
    breaks: l,
    trend: u,
    summary: Qe(s.swings, l, u)
  };
}
function mn(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function hn(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = vn(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), o = Rn(r, n);
  let i = yn(r, e);
  if (!i && be(e.extension ?? null)) {
    const s = ze(t, e.asOf, e.executionTimeframe);
    s && (i = {
      index: s.index,
      candle: s.candle,
      eventTime: j(s.candle),
      knownAt: Math.min(
        e.asOf,
        Y(t, s.index, e.executionTimeframe)
      ),
      metrics: Ue(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, o.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? At(i, e, e.asOf, o) : kt({
    checks: e.checks,
    asOf: e.asOf,
    updatedTs: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: "notCandidate",
    reason: "No active Impulse Fade v1 candidate",
    dataQuality: o,
    lifecycleConfigHash: e.lifecycleConfigHash
  });
}
function vn(e, t, n, r, o) {
  if (o != null && o.length)
    return [...o].map((s) => {
      const a = w(s.knownAt) ?? s.asOf, c = ze(e, a, r);
      if (!c || a > n) return null;
      const l = w(s.eventTime) ?? j(c.candle), u = Ue(s.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: a,
        metrics: u,
        pass: be(u),
        rollingReturnCount: Math.max(0, Math.trunc(s.sampleCount ?? 0))
      };
    }).filter((s) => s != null).sort((s, a) => s.knownAt - a.knownAt || s.eventTime - a.eventTime);
  const i = [];
  for (let s = 0; s < e.length; s += 1) {
    const a = e[s], c = Y(e, s, r);
    if (c > n) continue;
    const l = Ve(e.slice(0, s + 1), t), u = je(l);
    i.push({
      index: s,
      candle: a,
      eventTime: j(a),
      knownAt: c,
      metrics: u,
      pass: be(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return i;
}
function yn(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const s of e)
    s.pass && !r && n.push(s), r = s.pass;
  if (!n.length) return null;
  let o = n[0];
  for (const s of n.slice(1)) {
    const c = ((i = At(o, t, s.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < s.knownAt && !l.pass) && (o = s);
  }
  return o;
}
function At(e, t, n, r) {
  const o = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", s = t.venue ?? "", a = t.executionTimeframe, c = qe(
    t.htfStructures ?? [],
    e.knownAt
  ).map((y) => ({
    timeframe: y.timeframe,
    state: y.summary.state,
    trend: y.summary.trend,
    transitionDirection: y.summary.transitionDirection,
    updatedTs: y.summary.updatedTs
  })), l = xn({
    setupFamily: J,
    symbol: o,
    source: i,
    venue: s,
    executionTimeframe: a,
    detectedAt: e.knownAt
  }), u = [
    {
      id: Z("candidate_detected", a, e.eventTime, e.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      sourceTimeframe: a,
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
  ], d = pn(t, e, n), m = bn(e, t, n);
  let h = "developing", b = e.knownAt, v = null, g = null, E = null, R = null, T = null;
  for (const y of m) {
    if (v != null) break;
    if (!(y.knownAt < e.knownAt || y.knownAt > n)) {
      if (y.lifecycleKind === "deterioration") {
        u.push({ ...y, contributesTo: "deteriorating" }), h === "developing" && (f.push(ue(h, "deteriorating", y)), h = "deteriorating", b = y.knownAt);
        continue;
      }
      if (y.lifecycleKind === "bearishBreak") {
        u.push({ ...y, contributesTo: "waitingForRetest" }), (h === "developing" || h === "deteriorating") && (f.push(ue(h, "waitingForRetest", y)), h = "waitingForRetest", b = y.knownAt, g = y.breakLevel ?? null);
        continue;
      }
      if (y.lifecycleKind === "retest") {
        h === "waitingForRetest" && g && y.relatedEventId === g.evidenceId && y.knownAt > g.knownAt && (u.push({ ...y, contributesTo: "entryCandidate" }), f.push(ue(h, "entryCandidate", y)), h = "entryCandidate", b = y.knownAt, E = y.breakLevel ?? g);
        continue;
      }
      if (y.lifecycleKind === "invalidation") {
        (h === "deteriorating" || h === "waitingForRetest" || h === "entryCandidate") && (u.push({ ...y, contributesTo: "invalidated" }), f.push(ue(h, "invalidated", y)), h = "invalidated", b = y.knownAt, v = y.knownAt, R = y.explanation);
        continue;
      }
      y.lifecycleKind === "expiry" && h !== "entryCandidate" && (u.push({ ...y, contributesTo: "expired" }), f.push(ue(h, "expired", y)), h = "expired", b = y.knownAt, v = y.knownAt, T = y.explanation);
    }
  }
  const P = Et(
    t.candles ?? [],
    e.eventTime,
    n,
    a
  ), S = {
    id: l,
    setupFamily: J,
    lifecycleVersion: Q,
    lifecycleConfigHash: t.lifecycleConfigHash ?? ce({
      extensionOptions: t.extensionOptions,
      resistanceNearPct: t.resistanceNearPct,
      retestNearPct: t.retestNearPct,
      retestToleranceBps: t.retestToleranceBps,
      retestToleranceAtr: t.retestToleranceAtr,
      invalidationBps: t.invalidationBps,
      maxCandidateAgeSeconds: t.maxCandidateAgeSeconds
    }),
    symbol: o,
    source: i,
    venue: s,
    executionTimeframe: a,
    detectedAt: e.knownAt,
    detectionEventTime: e.eventTime,
    detectionMetrics: e.metrics,
    initialMtfContext: c,
    episodeHigh: (P == null ? void 0 : P.price) ?? null,
    episodeHighTime: (P == null ? void 0 : P.eventTime) ?? null,
    currentState: h,
    stateSince: b,
    terminalAt: v
  };
  return {
    strategy: "pumpFade",
    setupFamily: J,
    lifecycleVersion: Q,
    lifecycleConfigHash: S.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: a,
    state: h,
    currentState: h,
    stateSince: b,
    label: Re(h),
    reason: En(h, u, f, R, T),
    checks: t.checks,
    updatedTs: n,
    candidate: S,
    evidence: u.sort((y, p) => y.knownAt - p.knownAt || y.eventTime - p.eventTime),
    transitions: f,
    pendingConditions: Rt(h, g),
    activeBreakLevel: g,
    retestLevel: E,
    confluence: d,
    invalidationReason: R,
    expiryReason: T,
    dataQuality: r
  };
}
function bn(e, t, n) {
  const r = [], o = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = _(l);
    if (!me(l, e, n)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: Z(f, o, l.eventTime, u, l.x),
      code: f,
      explanation: `${l.label}: bearish relative-strength deterioration`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
      price: l.price,
      value: l.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const l of t.anchoredVwapSignals ?? []) {
    const u = _(l);
    l.kind !== "failedReclaim" || !me(l, e, n) || r.push({
      id: Z("avwap_failed_reclaim", o, l.eventTime, u, l.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
      price: l.price,
      level: l.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const i = Sn(t), s = [];
  for (const l of i) {
    const u = _(l);
    if (l.direction !== "bearish" || !me(l, e, n)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = Z(f, o, l.eventTime, u, l.x), m = {
      level: l.level,
      sourceTimeframe: o,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: d
    }, h = {
      id: d,
      code: f,
      explanation: `${l.label} down through ${W(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    s.push(h), r.push(h);
  }
  for (const l of s) {
    const u = gn(e, l, t, n);
    u && r.push(u);
  }
  for (const l of i) {
    const u = _(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !me(l, e, n))
      continue;
    const f = (t.candles ?? [])[l.index], d = Et(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      o
    ), m = F(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || r.push({
      id: Z("bullish_continuation_invalidation", o, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${W(d.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const a = k(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + a;
  return c <= n && r.push({
    id: Z("candidate_expired", o, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Nn(a)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: o,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function gn(e, t, n, r) {
  var u;
  const o = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const s = F(n.retestToleranceBps, 0, 1e3, 35), a = F(n.retestToleranceAtr, 0, 10, 0.25), c = k((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = Ee(o, c);
  for (let f = 0; f < o.length; f += 1) {
    const d = o[f], m = Y(o, f, n.executionTimeframe), h = j(d);
    if (m <= t.knownAt || h < t.knownAt || h < e.knownAt || m > r)
      continue;
    const b = l[f] ?? 0, v = Math.max(
      i.level * (s / 1e4),
      Number.isFinite(b) ? b * a : 0
    );
    if (d.h >= i.level - v && d.l <= i.level + v && d.c < i.level && d.c <= d.o)
      return {
        id: Z(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          j(d),
          m,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${W(i.level)}`,
        eventTime: h,
        knownAt: m,
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
function pn(e, t, n) {
  const r = [], o = Ge(
    e.srZones.filter((a) => _(a) <= n),
    e.latestPrice,
    F(e.resistanceNearPct, 0, 10, 1.5)
  );
  o && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${W(o.low)}-${W(o.high)}`,
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: "MTF",
    level: o.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (a) => a.kind === "loss" && me(a, t, n)
  ).sort((a, c) => _(c) - _(a))[0];
  i && _(i) <= n && r.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: i.eventTime,
    knownAt: i.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: i.vwap
  });
  const s = w(e.avwapDistancePct);
  s != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${ve(s, 1)}% from AVWAP`,
    value: s,
    sourceTimeframe: e.executionTimeframe
  });
  for (const a of qe(e.htfStructures, n))
    a.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${a.timeframe} structure`,
      detail: In(a.summary),
      eventTime: a.summary.updatedTs,
      knownAt: a.summary.updatedTs,
      sourceTimeframe: a.timeframe
    });
  return r;
}
function qe(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = w(r.summary.updatedTs);
    if (o != null && o > t) continue;
    const i = n.get(r.timeframe), s = w(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (o ?? -1 / 0) >= s) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function Sn(e) {
  var r, o, i;
  const t = (o = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && o.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((s) => {
    const a = `${s.kind}:${s.direction}:${s.x}:${s.level}:${_(s)}`;
    return n.has(a) ? !1 : (n.add(a), !0);
  });
}
function wn(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && tt(e.htfResistance, e.htfStructures) ? "deteriorating" : tt(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function kt(e) {
  return {
    strategy: "pumpFade",
    setupFamily: J,
    lifecycleVersion: Q,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ce(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: Re(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: Rt(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function Tt(e, t = {}) {
  const n = zn(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let o = 0, i = 0;
  for (let s = n; s < e.length; s += 1) {
    const a = e[s];
    if (!a) continue;
    const c = (a.h + a.l + a.c) / 3;
    if (!B(c)) continue;
    const l = Gn(a, c);
    l <= 0 || (o += l, i += c * l, r.push(a.x, i / o));
  }
  return new Float32Array(r);
}
function Li(e, t = {}) {
  const n = w(t.anchorBucket), r = w(t.anchorX), o = Tt(e, t);
  if (o.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = o[o.length - 1], s = xt(e), a = s && B(i) ? (s.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: a,
    candle: s
  };
}
function Di(e, t = {}, n = 20) {
  const r = k(n, 1, 200, 20), o = Tt(e, t);
  if (o.length < 4) return [];
  const i = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), s = [];
  let a = null;
  for (let c = 0; c < o.length; c += 2) {
    const l = o[c], u = o[c + 1], f = i.get(l);
    if (!f || !B(u) || !B(f.candle.c)) continue;
    const d = Y(e, f.index), m = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    m && (a === "above" && m === "below" ? s.push(Pe("loss", f.index, f.candle, u, d)) : a === "below" && m === "above" ? s.push(Pe("reclaim", f.index, f.candle, u, d)) : a === "below" && m === "below" && f.candle.h >= u && f.candle.c < u && s.push(
      Pe("failedReclaim", f.index, f.candle, u, d)
    ), a = m);
  }
  return s.slice(-r);
}
function An(e, t = {}) {
  const n = k(t.lookback, 20, 2e3, 500), r = k(t.pivotStrength, 1, 20, 3), o = k(t.atrPeriod, 2, 100, 14), i = F(t.minMoveAtr, 0, 10, 0.75), s = k(t.maxSwings, 1, 500, 120), a = Math.max(0, e.length - n), c = e.slice(a);
  if (c.length < r * 2 + 1) return [];
  const l = Ee(e, o), u = [];
  for (let d = r; d < c.length - r; d += 1) {
    const m = c[d], h = a + d, b = l[h] ?? null, v = Y(e, h + r);
    nr(c, d, r) && u.push(nt("SwingHigh", h, m, m.h, b, v)), rr(c, d, r) && u.push(nt("SwingLow", h, m, m.l, b, v));
  }
  const f = [];
  for (const d of u) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      Zn(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= Jn(d, m, i) && f.push(d);
  }
  return Qn(f).slice(-s);
}
function he(e, t = {}) {
  const n = k(t.maxSwings, 1, 500, 120), r = k(t.maxBreaks, 1, 200, 24), o = An(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], s = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, f = "neutral";
  for (let h = 0; h < e.length; h += 1) {
    const b = Y(e, h);
    for (; c < o.length && o[c].index < h && o[c].knownAt <= b; ) {
      const g = o[c];
      g.kind === "SwingHigh" ? l = g : u = g, c += 1;
    }
    const v = e[h];
    if (l && !s.has(l.x) && v.c > l.price) {
      const g = f === "bearish" ? "StructureShift" : "StructureBreak";
      i.push(rt(g, "bullish", h, v, l, b)), s.add(l.x), f = "bullish";
    }
    if (u && !a.has(u.x) && v.c < u.price) {
      const g = f === "bullish" ? "StructureShift" : "StructureBreak";
      i.push(rt(g, "bearish", h, v, u, b)), a.add(u.x), f = "bearish";
    }
  }
  const d = o.slice(-n), m = i.slice(-r);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: Qe(d, m, f)
  };
}
function Bi(e) {
  var o;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      ot(t, "SwingHigh", "rangeHigh", null, !0),
      ot(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((o = n.lastBreak) == null ? void 0 : o.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    Se(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    Se(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((i) => !!i) : r === "bearish" ? [
    Se(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    Se(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((i) => !!i) : [];
}
function Hi(e, t = {}) {
  var c, l;
  const n = k(t.lookback, 20, 1e3, 240), r = k(t.pivotStrength, 1, 20, 3), o = k(t.maxZones, 1, 12, 6), i = F(t.thicknessBps, 1, 100, 10), s = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, a = he(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return kn(a.swings, {
    maxZones: o,
    thicknessBps: i,
    latestX: s,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function kn(e, t = {}) {
  var l;
  const n = k(t.maxZones, 1, 12, 6), r = F(t.thicknessBps, 1, 100, 10), o = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, i = w(t.referencePrice), s = t.zonesPerSide == null ? null : k(t.zonesPerSide, 1, 12, 3), a = [];
  for (const u of e)
    er(
      a,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      o - u.x + 1,
      r
    );
  const c = a.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return tr(c, n, i, s);
}
function Tn(e, t) {
  const n = new Map(
    t.filter((s) => B(s.c)).map((s) => [s.bucket, s])
  );
  let r = null, o = null;
  const i = [];
  for (const s of e) {
    if (!B(s.c)) continue;
    const a = n.get(s.bucket);
    if (!a || !B(a.c)) continue;
    (r == null || o == null) && (r = s.c, o = a.c);
    const c = s.c / r / (a.c / o);
    i.push(s.x, (c - 1) * 100);
  }
  return new Float32Array(i);
}
function Vi(e, t, n = {}) {
  var P;
  const r = k(n.maxDivergences, 1, 100, 16), o = F(n.minDeltaPct, 0, 50, 0.5), i = k(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), s = n.includeDivergences ?? !0, a = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = Tn(e, t), u = or(l);
  if (!e.length || u.size < 2) return [];
  const d = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - i, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, h = he(e, {
    ...m
  }), b = Xn(e, l), v = he(b, {
    ...m
  }), g = new Map(e.map((S, y) => [S.x, { candle: S, index: y }])), E = [];
  let R = null, T = null;
  for (const S of h.swings) {
    const y = u.get(S.x);
    if (!(y == null || !Number.isFinite(y))) {
      if (S.kind === "SwingHigh") {
        if (R) {
          const p = u.get(R.x);
          p != null && Number.isFinite(p) && (S.price > R.price && y <= p - o ? s && E.push(
            pe(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              S,
              R,
              y,
              p,
              h.summary.state,
              v.summary.state
            )
          ) : S.price < R.price && y >= p + o && a && E.push(
            pe(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              S,
              R,
              y,
              p,
              h.summary.state,
              v.summary.state
            )
          ));
        }
        R = S;
        continue;
      }
      if (T) {
        const p = u.get(T.x);
        p != null && Number.isFinite(p) && (S.price > T.price && y <= p - o ? a && E.push(
          pe(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            S,
            T,
            y,
            p,
            h.summary.state,
            v.summary.state
          )
        ) : S.price < T.price && y >= p + o && s && E.push(
          pe(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            S,
            T,
            y,
            p,
            h.summary.state,
            v.summary.state
          )
        ));
      }
      T = S;
    }
  }
  if (c)
    for (const S of v.breaks) {
      if (S.x < d) continue;
      const y = g.get(S.x), p = u.get(S.x);
      if (!y || p == null || !Number.isFinite(p)) continue;
      const O = he(e.slice(0, y.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      Kn(S.direction, O.summary.state) && E.push(
        Wn(
          S.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          S.direction,
          S.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          y.index,
          y.candle,
          p,
          S,
          O.summary.state,
          v.summary.state
        )
      );
    }
  return E.filter((S) => S.x >= d).sort((S, y) => S.x - y.x || it(S.signal) - it(y.signal)).slice(-r);
}
function $i(e) {
  return new Uint8Array(e.buffer);
}
function Ue(e) {
  return {
    returnPct: w(e == null ? void 0 : e.returnPct),
    percentile: w(e == null ? void 0 : e.percentile),
    zScore: w(e == null ? void 0 : e.zScore),
    atrExtension: w(e == null ? void 0 : e.atrExtension)
  };
}
function je(e) {
  return {
    returnPct: w(e.returnPct),
    percentile: w(e.percentile),
    zScore: w(e.zScore),
    atrExtension: w(e.atrExtension)
  };
}
function be(e) {
  const t = Ue(e);
  return t.returnPct != null && t.returnPct >= de.returnPct || t.percentile != null && t.percentile >= de.percentile || t.zScore != null && t.zScore >= de.zScore || t.atrExtension != null && t.atrExtension >= de.atrExtension;
}
function Rn(e, t) {
  const n = [], r = k(t.minSamples, 1, 1e4, 20), o = e[e.length - 1] ?? null;
  return o ? o.rollingReturnCount < r && n.push(
    `Rolling-return history has ${o.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function ue(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function En(e, t, n, r, o) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return o ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const s = t.filter((c) => c.contributesTo === e), a = s[s.length - 1];
  return (a == null ? void 0 : a.explanation) ?? Re(e);
}
function Rt(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${W(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function xn(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Z(e, t, n, r, o) {
  return [e, t, n, r, o ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Et(e, t, n, r) {
  let o = null;
  for (let i = 0; i < e.length; i += 1) {
    const s = e[i], a = j(s);
    a < t || Y(e, i, r) > n || Number.isFinite(s.h) && (!o || s.h > o.price) && (o = { price: s.h, eventTime: a });
  }
  return o;
}
function Pn(e, t) {
  return e.length ? Y(e, e.length - 1, t) : null;
}
function ze(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (Y(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function j(e) {
  const t = w(e.ts);
  return t ?? w(e.bucket) ?? 0;
}
function Y(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? X(r, n) : (w(r.bucket) ?? j(r)) + Cn(e, t) : 0;
}
function Cn(e, t) {
  var i, s, a;
  const n = w((i = e[t]) == null ? void 0 : i.bucket) ?? j(e[t]), r = w((s = e[t + 1]) == null ? void 0 : s.bucket);
  if (r != null && r > n) return r - n;
  const o = w((a = e[t - 1]) == null ? void 0 : a.bucket);
  return o != null && n > o ? n - o : 1;
}
function _(e) {
  return w(e.knownAt) ?? w(e.eventTime) ?? w(e.ts) ?? w(e.bucket) ?? 0;
}
function me(e, t, n) {
  const r = _(e), o = w(e.eventTime) ?? w(e.ts) ?? w(e.bucket) ?? r;
  return r > t.knownAt && r <= n && o >= t.knownAt;
}
function In(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Nn(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function B(e) {
  return Number.isFinite(e) && e > 0;
}
function _n(e) {
  const t = w(e == null ? void 0 : e.returnPct), n = w(e == null ? void 0 : e.percentile), r = w(e == null ? void 0 : e.zScore), o = w(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${ve(t, 1)}%`,
    o == null ? null : `Ext ${ve(o, 1)} ATR`,
    r == null ? null : `Z ${ve(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((a) => !!a);
  return {
    key: "extension",
    label: "Extension",
    status: be({ returnPct: t, percentile: n, zScore: r, atrExtension: o }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function On(e, t, n) {
  const r = Ge(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${W(r.low)}-${W(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Mn(e) {
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
function Fn(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Ln(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = w(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${ve(r, 1)}%`)
  };
}
function Dn(e, t, n, r) {
  var c;
  const o = w((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), i = o != null && n != null && Hn(n, o) <= r, s = Ge(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || s) ? "pass" : "pending",
    detail: i ? `Retesting ${W(o)}` : s ? `Near R ${W(s.center)}` : "No retest yet"
  };
}
function Bn(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const o = w((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return o != null && r > o * 1.01;
}
function tt(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Ge(e, t, n) {
  return t == null || !B(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, o) => r.distance - o.distance || o.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function Hn(e, t) {
  return !B(e) || !B(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function Re(e) {
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
function Vn(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : Re(e);
}
function ve(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function W(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function w(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function te(e) {
  return e[e.length - 1];
}
function xt(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (B(n.c)) return n;
  }
  return null;
}
function $n(e) {
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
function Pt(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let o = null;
  for (let i = r; i >= 0; i -= 1) {
    const s = e[i];
    if (s.bucket <= t && B(s.c)) {
      o = s;
      break;
    }
  }
  return o;
}
function qn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const o = e[r];
    if (o.bucket < t.earliestBucket || o.bucket >= t.excludeBucket || !B(o.c)) continue;
    const i = Pt(e, o.bucket - t.windowSeconds, r);
    !i || !B(i.c) || n.push((o.c / i.c - 1) * 100);
  }
  return n;
}
function Un(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, o = n.filter((i) => i === t).length;
  return (r + o * 0.5) / n.length * 100;
}
function jn(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((s, a) => s + a, 0) / n.length, o = n.reduce((s, a) => s + (a - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(o);
  return i > 0 ? (t - r) / i : null;
}
function Pe(e, t, n, r, o) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: j(n),
    knownAt: o
  };
}
function zn(e, t) {
  const n = t.anchorBucket == null ? null : Number(t.anchorBucket);
  if (n != null && Number.isFinite(n)) {
    const o = e.findIndex((i) => i.bucket >= n);
    return o >= 0 ? o : null;
  }
  const r = t.anchorX == null ? null : Number(t.anchorX);
  if (r != null && Number.isFinite(r)) {
    const o = e.findIndex((i) => i.x >= r);
    return o >= 0 ? o : null;
  }
  return null;
}
function Gn(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function nt(e, t, n, r, o, i) {
  return {
    kind: e,
    structure: e,
    label: e === "SwingHigh" ? "SH" : "SL",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: r,
    atr: o,
    eventTime: j(n),
    knownAt: i
  };
}
function Qn(e) {
  let t = null, n = null;
  return e.map((r) => {
    if (r.kind === "SwingHigh") {
      const a = t == null ? "SwingHigh" : r.price > t.price ? "HigherHigh" : "LowerHigh", l = { ...r, structure: a, label: a === "SwingHigh" ? "SH" : a === "HigherHigh" ? "HH" : "LH" };
      return t = l, l;
    }
    const o = n == null ? "SwingLow" : r.price > n.price ? "HigherLow" : "LowerLow", s = { ...r, structure: o, label: o === "SwingLow" ? "SL" : o === "HigherLow" ? "HL" : "LL" };
    return n = s, s;
  });
}
function rt(e, t, n, r, o, i) {
  return {
    kind: e,
    direction: t,
    label: e === "StructureBreak" ? "BOS" : "Shift",
    index: n,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    level: o.price,
    sourceSwingX: o.x,
    sourceSwingPrice: o.price,
    eventTime: j(r),
    knownAt: i
  };
}
function pe(e, t, n, r, o, i, s, a, c, l) {
  return {
    kind: e,
    signal: t,
    direction: n,
    label: r,
    index: o.index,
    x: o.x,
    ts: o.ts,
    bucket: o.bucket,
    price: o.price,
    previousPrice: i.price,
    rs: s,
    previousRs: a,
    priceLabel: o.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: l,
    eventTime: o.eventTime,
    knownAt: Math.max(o.knownAt, i.knownAt)
  };
}
function Wn(e, t, n, r, o, i, s, a, c) {
  return {
    kind: e,
    signal: "break",
    direction: t,
    label: n,
    index: r,
    x: o.x,
    ts: o.ts,
    bucket: o.bucket,
    price: t === "bearish" ? o.l : o.h,
    previousPrice: null,
    rs: i,
    previousRs: s.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak: s,
    priceStructureState: a,
    rsStructureState: c,
    eventTime: s.eventTime,
    knownAt: s.knownAt
  };
}
function Xn(e, t) {
  const n = new Map(e.map((i) => [i.x, i])), r = [];
  let o = null;
  for (let i = 0; i < t.length; i += 2) {
    const s = t[i], a = t[i + 1], c = n.get(s);
    if (!c || !Number.isFinite(a)) continue;
    const l = o ?? a;
    r.push({
      ...c,
      o: l,
      h: a,
      l: a,
      c: a,
      v_base: 0,
      v_quote: 0
    }), o = a;
  }
  return r;
}
function Kn(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function it(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function Qe(e, t, n) {
  const r = t[t.length - 1] ?? null, o = Fe(e, "SwingHigh"), i = Fe(e, "SwingLow"), s = e[e.length - 1] ?? null, a = Yn(t), c = e.length === 0 ? "neutral" : r == null || a ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, l = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: l,
    lastBreak: r,
    lastSwingHigh: o,
    lastSwingLow: i,
    updatedX: (r == null ? void 0 : r.x) ?? (s == null ? void 0 : s.x) ?? null,
    updatedTs: (r == null ? void 0 : r.knownAt) ?? (s == null ? void 0 : s.knownAt) ?? null
  };
}
function Se(e, t, n, r, o) {
  for (let s = e.length - 1; s >= 0; s -= 1) {
    const a = e[s];
    if (a.kind === t && n.includes(a.structure))
      return Me(r, o, a);
  }
  const i = Fe(e, t);
  return i ? Me(r, o, i) : null;
}
function ot(e, t, n, r, o) {
  let i = null;
  for (const s of e)
    s.kind === t && (!i || (o ? s.price > i.price : s.price < i.price)) && (i = s);
  return i ? Me(n, r, i) : null;
}
function Me(e, t, n) {
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
function Yn(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Fe(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function Zn(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Jn(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function Ee(e, t) {
  const n = se(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const o = e.map((s, a) => {
    if (a === 0) return s.h - s.l;
    const c = e[a - 1].c;
    return Math.max(
      s.h - s.l,
      Math.abs(s.h - c),
      Math.abs(s.l - c)
    );
  });
  let i = 0;
  for (let s = 0; s < n; s += 1) i += o[s];
  i /= n, r[n - 1] = i;
  for (let s = n; s < e.length; s += 1)
    i = (i * (n - 1) + o[s]) / n, r[s] = i;
  return r;
}
function er(e, t, n, r, o) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const s = Math.max(i * (o / 1e4), Number.EPSILON), a = i - s, c = i + s, l = 1 / Math.max(1, r), u = e.find(
    (m) => m.kind === t && ir(m.low, m.high, a, c)
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
  const f = u.touches + 1;
  u.center = (u.center * u.touches + i) / f, u.touches = f, u.score += 1 + l, u.strength = u.score, u.lastX = Math.max(u.lastX, n.x), u.eventTime = Math.max(u.eventTime, n.eventTime), u.knownAt = Math.max(u.knownAt, n.knownAt), u.structures.push(n.structure);
  const d = Math.max(u.center * (o / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - d, a), u.high = Math.max(u.high, u.center + d, c);
}
function tr(e, t, n, r) {
  if (!n || !r) return e.slice(0, t);
  const o = /* @__PURE__ */ new Set(), i = e.filter((a) => a.center <= n).sort((a, c) => n - a.center - (n - c.center) || c.score - a.score).slice(0, r), s = e.filter((a) => a.center > n).sort((a, c) => a.center - n - (c.center - n) || c.score - a.score).slice(0, r);
  for (const a of [...i, ...s])
    o.add(a);
  for (const a of e) {
    if (o.size >= t) break;
    o.add(a);
  }
  return Array.from(o).sort((a, c) => c.score - a.score || c.touches - a.touches || c.lastX - a.lastX).slice(0, t);
}
function nr(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].h >= r || e[t + o].h > r) return !1;
  return !0;
}
function rr(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].l <= r || e[t + o].l < r) return !1;
  return !0;
}
function ir(e, t, n, r) {
  return e <= r && n <= t;
}
function or(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], o = e[n + 1];
    Number.isFinite(r) && Number.isFinite(o) && t.set(r, o);
  }
  return t;
}
function Le(e, t) {
  const n = se(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const o = 2 / (n + 1);
  let i = 0;
  for (let s = 0; s < n; s++) i += e[s].c;
  i /= n, r[n - 1] = i;
  for (let s = n; s < e.length; s++)
    i = (e[s].c - i) * o + i, r[s] = i;
  return r;
}
function sr(e, t) {
  const n = se(t);
  if (e.length < n) return [];
  const r = [], o = 2 / (n + 1);
  let i = 0;
  for (let s = 0; s < n; s++) i += e[s].value;
  i /= n, r.push({ x: e[n - 1].x, value: i });
  for (let s = n; s < e.length; s++)
    i = (e[s].value - i) * o + i, r.push({ x: e[s].x, value: i });
  return r;
}
function Ct(e, t) {
  const n = se(t);
  if (e.length <= n) return [];
  let r = 0, o = 0;
  for (let s = 1; s <= n; s++) {
    const a = e[s].c - e[s - 1].c;
    a >= 0 ? r += a : o += Math.abs(a);
  }
  r /= n, o /= n;
  const i = [
    { x: e[n].x, value: at(r, o) }
  ];
  for (let s = n + 1; s < e.length; s++) {
    const a = e[s].c - e[s - 1].c, c = Math.max(0, a), l = Math.max(0, -a);
    r = (r * (n - 1) + c) / n, o = (o * (n - 1) + l) / n, i.push({ x: e[s].x, value: at(r, o) });
  }
  return i;
}
function st(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((o, i) => {
    r += o.value, i >= t && (r -= e[i - t].value), i >= t - 1 && n.push({ x: o.x, value: r / t });
  }), n;
}
function oe(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function at(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function se(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function k(e, t, n, r) {
  return Math.floor(F(e, t, n, r));
}
function F(e, t, n, r) {
  const o = Number(e);
  return Number.isFinite(o) ? Math.max(t, Math.min(n, o)) : r;
}
const ar = "strategy-profile.1", It = "decision-snapshot.1", cr = "impulse_fade_v1.research.default", lr = "1";
function ur(e) {
  return `decision-reference-observation:${L({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function We(e) {
  const { profileHash: t, ...n } = e;
  return L(n);
}
function Nt(e) {
  if (ge(e.createdAt, "createdAt"), e.setupFamily !== J || e.lifecycleVersion !== Q || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [o, i] of Object.entries(e.timeframeRoles))
    if (o === "contextTimeframes") {
      if (!i.every((s) => s.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${o} cannot be blank`);
  if (ct(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), ct(
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
    (o) => !e.entryPolicy.factors.hardGate.includes(o)
  ))
    throw new RangeError(
      "Impulse Fade lifecycle 1 requires unique, supported hard-gate factor roles"
    );
  if (Object.values(e.executionAssumptions).some(
    (o) => !Number.isFinite(o) || o < 0
  ))
    throw new RangeError("Execution assumptions must be non-negative finite numbers");
  if (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4)
    throw new RangeError("Adverse-slippage allowances must be below 10,000 basis points");
  const r = M(e);
  return M({
    ...r,
    profileHash: We(r)
  });
}
function fr(e = {}) {
  var i, s;
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
    ...(s = e.entryPolicy) == null ? void 0 : s.factors
  }, o = {
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
  return Nt({
    schemaVersion: ar,
    id: e.id ?? cr,
    version: e.version ?? lr,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: J,
    lifecycleVersion: Q,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ce(),
    side: "short",
    timeframeRoles: t,
    entryPolicy: o,
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
const dr = fr();
function qi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (gr(e.price, "reference price"), ge(e.eventTime, "reference eventTime"), ge(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = ur(e.sourceObject);
  if (e.sourceObject.observationId != null && e.sourceObject.observationId !== t)
    throw new Error("Decision reference source observation failed deterministic verification");
  return M({
    id: e.id,
    kind: e.kind,
    price: e.price,
    rangeLow: e.rangeLow ?? null,
    rangeHigh: e.rangeHigh ?? null,
    sourceTimeframe: e.sourceTimeframe ?? null,
    eventTime: e.eventTime,
    knownAt: e.knownAt,
    sourceObject: {
      ...e.sourceObject,
      observationId: t
    }
  });
}
function Ui(e) {
  var i, s, a, c;
  if (ge(e.decisionTime, "decisionTime"), ge(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
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
  br([
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
  const n = hr(
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
    snapshotSchemaVersion: It,
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
    activeCandidateId: ((s = e.lifecycle.candidate) == null ? void 0 : s.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate.id : null,
    lifecycleState: e.lifecycle.currentState,
    lifecycleStateSince: e.lifecycle.stateSince,
    lifecycleEvidence: Ie(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: vr(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: Ce(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: Ce(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((a = e.avwapState) == null ? void 0 : a.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: Ie(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: Ie(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: Ce(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, o = _t(r);
  return M({ ...r, id: o });
}
function _t(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${L(n).slice(8)}`;
}
function mr(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const o = n.get(r.id);
    if (o && D(o) !== D(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function hr(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function vr(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      yr(r) <= t ? r : null
    ])
  );
}
function Ce(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function Ie(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || L(n).localeCompare(L(r))
  );
}
function yr(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function br(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && D(r) !== D(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function ge(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function gr(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function ct(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const Ot = "radar-selection-profile.1", pr = "radar-episode.1", Sr = "replay-case-manifest.1", Mt = "radar-metric-observation.1", wr = "radar-scan-result.1", Ar = "radar-episode-status.1", kr = "execution-venue-eligibility.1", Tr = "radar-structure-observation.1", Rr = "radar-universe-membership.1";
function Ft(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return L(n);
}
function Er(e) {
  return jt(e), M({
    ...e,
    canonicalConfigHash: Ft(e)
  });
}
function xr(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: kr,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return M({
    ...t,
    observationId: Bt(t)
  });
}
function ji(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !e.timeframe.trim() || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: Tr,
    ...e
  };
  return M({
    ...t,
    observationId: Dt(t)
  });
}
function zi(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: Rr,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return M({
    ...t,
    observationId: Lt(t)
  });
}
function Lt(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${H(n)}`;
}
function Dt(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${H(n)}`;
}
function De(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(D(e.snapshot));
  return M({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${H({
      logicalObjectId: e.logicalObjectId,
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      snapshot: t
    })}`,
    objectType: e.objectType,
    eventTime: e.eventTime,
    knownAt: e.knownAt,
    snapshot: t
  });
}
function Bt(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${H(n)}`;
}
const Gi = Er({
  schemaVersion: Ot,
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
      historyLookbackSeconds: 180 * 86400,
      maximumReferenceStalenessSeconds: 3600
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
  sourcePolicy: { allowedSources: ["bybit", "binance", "okx"] },
  executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
  liquidityPolicy: {
    minimumQuoteNotional: 1e6,
    windowSeconds: 24 * 3600,
    missingData: "warn"
  },
  createdAt: 17e8
});
function Qi(e) {
  var c, l;
  ei(e);
  const t = e.strategyProfile ?? dr, n = /* @__PURE__ */ new Map(), r = [], o = [], i = [], s = [], a = /* @__PURE__ */ new Set();
  for (const [u, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = Vr(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (a.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    a.add(m);
    const b = z(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((g) => X(g, e.selectionProfile.scanTimeframe)).filter((g) => g <= e.to).filter((g) => Zr(g, e.selectionProfile)), v = {
      previousGate: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const g of b) {
      const E = g >= e.from, R = e.selectionProfile.moveDetectors.map(
        (x) => Pr(x, d, g, e.selectionProfile.scanTimeframe)
      );
      if (E)
        for (const x of R)
          for (const V of x.observations)
            n.set(V.observationId, V);
      const T = Kr(
        R.map((x) => x.result),
        e.selectionProfile.detectorCombination
      ), P = Lr(
        d,
        g,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), S = Fr(
        d,
        g,
        e.selectionProfile,
        R,
        P,
        e.universeHistory ?? []
      ), y = S.results, p = y.every((x) => x.passed), O = T.passed && p, G = !p || T.evaluable;
      if (E)
        for (const x of S.evidence)
          x.schemaVersion === Mt && n.set(x.observationId, x);
      const ne = Br(
        d,
        g,
        R.map((x) => x.result),
        y,
        S.evidence,
        T.passed,
        p,
        O,
        G
      );
      if (E && r.push(ne), v.activeEpisode && g >= v.activeEpisode.activeUntil && (v.activeEpisode.detectedAt >= e.from && v.activeEpisode.activeUntil <= e.to && i.push(
        Ne(
          v.activeEpisode,
          v.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), v.activeEpisode = null), G && !O ? (v.falseSince ?? (v.falseSince = g), !v.armed && g - v.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (E && ((c = v.blockedEpisode) == null ? void 0 : c.detectedAt) != null && v.blockedEpisode.detectedAt >= e.from && i.push(
        Ne(v.blockedEpisode, g, "reset", "radarGateReset", "armed")
      ), v.activeEpisode = null, v.blockedEpisode = null, v.armed = !0)) : v.falseSince = null, G && O && v.previousGate === !1 && v.armed) {
        const x = _r({
          series: d,
          asOf: g,
          profile: e.selectionProfile,
          detectorEvaluations: R,
          selectionEvaluation: ne,
          hardGateEvidence: S.evidence,
          venueEligibility: P,
          lifecycleHistory: ((l = e.lifecycleHistory) == null ? void 0 : l[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (E) {
          o.push(x), i.push(
            Ne(x, g, "active", "detected", "blockedUntilReset")
          );
          const V = Or(x, d, e.selectionProfile, t);
          s.push(V);
          for (const N of x.contextObservations)
            n.set(N.observationId, N);
        }
        v.activeEpisode = x, v.blockedEpisode = x, v.armed = !1;
      }
      v.previousGate = G ? O : null;
    }
  }
  return M({
    schemaVersion: wr,
    selectionProfileRef: Gt(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(zt),
    gateEvaluations: r.sort(ri),
    episodes: o.sort(ii),
    episodeStatusObservations: i.sort(oi),
    replayCaseManifests: s.sort((u, f) => u.id.localeCompare(f.id))
  });
}
function Pr(e, t, n, r) {
  return e.type === "rollingTroughRunup" ? Cr(e, t, n, r) : e.type === "elapsedWindowReturn" ? Ir(e, t, n, r) : e.type === "maximumWindowReturn" ? Nr(e, t, n, r) : Ht(e, t, n);
}
function Cr(e, t, n, r) {
  const o = z(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, a = (i ? o.filter(
    (v) => v.bucket >= i.bucket - e.lookbackSeconds && v.bucket <= i.bucket && i.bucket - v.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((v, g) => I(g.c) && (!v || g.c < v.c || g.c === v.c && g.bucket < v.bucket) ? g : v, null), c = i && a && I(a.c) ? (i.c / a.c - 1) * 100 : null, l = Ur(o, i, e), u = qt(l, c, e.minimumSampleCount), f = [];
  i || f.push(q("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a || f.push(q("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = L(e), m = le({
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
    percentile: u.percentile,
    zScore: u.zScore,
    sampleCount: l.length,
    historyCandles: Ke(o, i, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...u.notes]
  }), h = c != null && c + 1e-12 >= e.minimumRunupPct && ye(m.percentile, e.minimumPercentile) && ye(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, b = a ? Dr(t, n, a, m) : null;
  return {
    result: xe(
      e,
      h,
      [m],
      h ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${ke(c)} versus ${ke(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: b
  };
}
function Ir(e, t, n, r) {
  const o = Vt(e, t, n, r), i = Ut(o, e);
  return {
    result: xe(
      e,
      i,
      [o],
      i ? o.observationId : null,
      o.value == null ? "Elapsed return unavailable" : `${Qt(e.windowSeconds)} return ${ke(o.value)}`
    ),
    observations: [o],
    anchor: null
  };
}
function Nr(e, t, n, r) {
  const o = [...new Set(e.windowsSeconds)].sort((u, f) => u - f).map(
    (u) => Vt(
      {
        ...e,
        id: `${e.id}:${u}`,
        type: "elapsedWindowReturn",
        windowSeconds: u
      },
      t,
      n,
      r
    )
  ), i = o.filter((u) => u.value != null).sort(
    (u, f) => (f.value ?? -1 / 0) - (u.value ?? -1 / 0) || (u.window ?? 1 / 0) - (f.window ?? 1 / 0)
  )[0] ?? null, s = z(t.candlesByTimeframe[r] ?? [], r, n), a = le({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "maximum_window_return",
    metricVersion: "maximum-window-return.1",
    window: (i == null ? void 0 : i.window) ?? null,
    referenceTime: (i == null ? void 0 : i.referenceTime) ?? null,
    referenceValue: (i == null ? void 0 : i.referenceValue) ?? null,
    value: (i == null ? void 0 : i.value) ?? null,
    unit: "percent",
    percentile: (i == null ? void 0 : i.percentile) ?? null,
    zScore: (i == null ? void 0 : i.zScore) ?? null,
    sampleCount: (i == null ? void 0 : i.sampleCount) ?? 0,
    historyCandles: Ke(
      s,
      s.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: L(e),
    notes: i ? i.dataQualityNotes : [q("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Ut(a, e), l = [...o, a];
  return {
    result: xe(
      e,
      c,
      l,
      c ? (i == null ? void 0 : i.observationId) ?? null : null,
      (i == null ? void 0 : i.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Qt(i.window ?? 0)} return ${ke(i.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function Ht(e, t, n) {
  const r = e.analysisTimeframe, o = z(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = jr(o, e.emaPeriod).at(-1) ?? null, a = zr(o, e.atrPeriod).at(-1) ?? null, c = i && s != null && a != null && a > 0 ? (i.c - s) / a : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  i || u.push(q("NO_COMPLETED_CANDLE", "error", `No completed ${r} candle exists at cutoff`)), (o.length < l || c == null) && u.push(
    q(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${r} candles`
    )
  );
  const f = le({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: (i == null ? void 0 : i.bucket) ?? null,
    referenceValue: s,
    value: c,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: o.length,
    historyCandles: o.slice(-l),
    configHash: L(e),
    notes: Ye(u)
  }), d = c != null && o.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: xe(
      e,
      d,
      [f],
      d ? f.observationId : null,
      c == null ? "EMA/ATR displacement unavailable" : `EMA displacement ${c.toFixed(2)} ATR`
    ),
    observations: [f],
    anchor: null
  };
}
function Vt(e, t, n, r) {
  const o = z(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = i ? Xe(o, i.bucket - e.windowSeconds) : null, a = i && s ? i.bucket - e.windowSeconds - s.bucket : null, c = a != null && e.maximumReferenceStalenessSeconds != null && a > e.maximumReferenceStalenessSeconds, l = i && s && !c && I(s.c) ? (i.c / s.c - 1) * 100 : null, u = qr(o, i, e), f = qt(u, l, e.minimumSampleCount), d = [...f.notes];
  return i || d.push(q("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s ? c && d.push(q("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(q("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), le({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (s == null ? void 0 : s.bucket) ?? null,
    referenceValue: (s == null ? void 0 : s.c) ?? null,
    value: l,
    unit: "percent",
    percentile: f.percentile,
    zScore: f.zScore,
    sampleCount: u.length,
    historyCandles: Ke(
      o,
      i,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: L(e),
    notes: Ye(d)
  });
}
function _r(e) {
  var y;
  const t = e.detectorEvaluations.filter((p) => p.result.passed), n = Be(
    t.flatMap(
      (p) => p.observations.filter(
        (O) => O.observationId === p.result.winningObservationId
      )
    )
  ), r = ((y = t.find((p) => p.anchor)) == null ? void 0 : y.anchor) ?? null, o = z(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), i = lt(e.series, e.asOf, e.profile.scanTimeframe, 86400), s = lt(e.series, e.asOf, e.profile.scanTimeframe, 172800), a = $t(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((p) => p.observations).find((p) => p.metricCode === "ema_atr_displacement") ?? null ?? Ht(
    {
      id: "context-ema-atr-displacement",
      type: "emaAtrDisplacement",
      analysisTimeframe: e.profile.scanTimeframe,
      emaPeriod: 20,
      atrPeriod: 14,
      minimumAtrDisplacement: 0,
      minimumSampleCount: 20
    },
    e.series,
    e.asOf
  ).observations[0], u = $r(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = Be([
    ...n,
    i,
    s,
    a,
    l
  ]), d = t[0], m = d ? n.find(
    (p) => p.observationId === d.result.winningObservationId
  ) ?? n[0] ?? null : null, h = Mr(
    o,
    r,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    i,
    s,
    a,
    l,
    u
  ), b = Gr(
    e.lifecycleHistory,
    e.series,
    e.asOf
  ), v = (b == null ? void 0 : b.candidate) ?? null, g = (b == null ? void 0 : b.asOf) ?? null, E = b && g != null ? De({
    logicalObjectId: (v == null ? void 0 : v.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: b.updatedTs,
    knownAt: g,
    snapshot: b
  }) : null, R = v ? De({
    logicalObjectId: v.id,
    objectType: "SetupCandidateEpisode",
    eventTime: v.detectionEventTime,
    knownAt: g ?? v.detectedAt,
    snapshot: v
  }) : null, T = {
    schemaVersion: pr,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((p) => p.result.detectorId),
    triggeringObservations: n,
    selectionGateEvaluationId: e.selectionEvaluation.id,
    hardGateResults: e.selectionEvaluation.hardGateResults,
    hardGateEvidence: e.hardGateEvidence,
    contextObservations: f,
    selectionAnchor: r,
    pathContext: h,
    initialLifecycleCandidateId: (v == null ? void 0 : v.id) ?? null,
    initialLifecycleCandidateRef: R,
    initialLifecycleState: (b == null ? void 0 : b.state) ?? null,
    initialLifecycleStateRef: E,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Ye([
      ...f.flatMap((p) => p.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, P = `radar-episode:${H({
    symbol: T.symbol,
    source: T.source,
    profileHash: T.selectionProfileHash,
    detectedAt: T.detectedAt,
    triggeringObservationIds: n.map((p) => p.observationId)
  })}`, S = { ...T, id: P, logicalObjectId: P };
  return M({
    ...S,
    observationId: `radar-episode-observation:${H(S)}`
  });
}
function Or(e, t, n, r) {
  const o = Object.keys(t.candlesByTimeframe).filter(
    (c) => z(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Je), i = Object.fromEntries(
    o.map((c) => {
      var u, f;
      const l = z(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((f = l.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: l.at(-1) ? X(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), s = o.filter(
    (c) => i[c].completedCandleCount > 0
  ), a = {
    schemaVersion: Sr,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Gt(n),
    lifecycleVersion: Q,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: s,
    preRollRequirements: Xr(n),
    dataCoverageByTimeframe: i,
    initialRadarObservations: e.contextObservations,
    initialHardGateResults: e.hardGateResults,
    initialHardGateEvidence: e.hardGateEvidence,
    initialLifecycleState: e.initialLifecycleState,
    initialLifecycleStateRef: e.initialLifecycleStateRef,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return M({
    ...a,
    id: `replay-case:${H(a)}`
  });
}
function lt(e, t, n, r) {
  const o = {
    id: `context-return-${r}`,
    type: "elapsedWindowReturn",
    windowSeconds: r,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: r,
    maximumReferenceStalenessSeconds: null
  }, i = z(e.candlesByTimeframe[n] ?? [], n, t), s = i.at(-1) ?? null, a = s ? Xe(i, s.bucket - r) : null, c = s && a && I(a.c) ? (s.c / a.c - 1) * 100 : null, l = c == null ? [q("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return le({
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
    configHash: L(o),
    notes: l
  });
}
function $t(e, t, n) {
  var f;
  const r = n.scanTimeframe, o = z(e.candlesByTimeframe[r] ?? [], r, t), i = o.at(-1) ?? null, s = i ? o.filter((d) => d.bucket > i.bucket - n.liquidityPolicy.windowSeconds) : [], a = s.map(
    (d) => ee(d.v_quote) ? d.v_quote : ee(d.v_base) ? d.v_base * d.c : null
  ), c = a.length > 0 && a.every((d) => d != null), l = c ? a.reduce((d, m) => d + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return le({
    series: e,
    asOf: t,
    timeframe: r,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((f = s[0]) == null ? void 0 : f.bucket) ?? null,
    referenceValue: null,
    value: l,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: s.length,
    historyCandles: s,
    configHash: L(u),
    notes: c ? [] : [q("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function le(e) {
  var l, u;
  const t = ((l = e.historyCandles[0]) == null ? void 0 : l.bucket) ?? null, n = ((u = e.historyCandles.at(-1)) == null ? void 0 : u.bucket) ?? null, r = e.timeframe && e.historyCandles.at(-1) ? X(e.historyCandles.at(-1), e.timeframe) : e.asOf, o = L(
    e.historyCandles.map((f) => ({
      bucket: f.bucket,
      ts: f.ts,
      o: f.o,
      h: f.h,
      l: f.l,
      c: f.c,
      vBase: ee(f.v_base) ? f.v_base : null,
      vQuote: ee(f.v_quote) ? f.v_quote : null,
      ver: ee(f.ver) ? f.ver : null
    }))
  ), i = `radar-metric:${H({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.window,
    configHash: e.configHash
  })}`, s = {
    schemaVersion: Mt,
    logicalObjectId: i,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    requestedAsOf: e.asOf,
    effectiveAsOf: r,
    knownAt: r,
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
    inputHash: o,
    dataQualityNotes: e.notes
  }, { requestedAsOf: a, ...c } = s;
  return M({
    ...s,
    observationId: `radar-observation:${H(c)}`
  });
}
function Mr(e, t, n, r, o, i, s, a, c) {
  const l = t ? e.find((v) => v.bucket === t.timestamp) ?? null : null, f = (l ? e.filter((v) => v.bucket <= l.bucket) : []).reduce((v, g) => I(g.c) && (!v || g.c > v.c || g.c === v.c && g.bucket < v.bucket) ? g : v, null), d = e.at(-1) ?? null, m = t && f && I(f.c) ? (t.price / f.c - 1) * 100 : null, h = t && f && d && f.c > t.price ? (d.c - t.price) / (f.c - t.price) : null, b = t && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: o.value,
    net48hReturnPct: i.value,
    triggeringLocalImpulseReturnPct: (r == null ? void 0 : r.unit) === "percent" ? r.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (r == null ? void 0 : r.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (f == null ? void 0 : f.c) ?? null,
    priorPeakTime: (f == null ? void 0 : f.bucket) ?? null,
    priorDrawdownPct: m,
    recoveryFraction: h,
    currentAtrDisplacement: a.value,
    triggeringPercentile: (r == null ? void 0 : r.percentile) ?? null,
    triggeringZScore: (r == null ? void 0 : r.zScore) ?? null,
    quoteNotional: s.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([v, g]) => [
        v,
        typeof g.snapshot == "object" && g.snapshot != null && !Array.isArray(g.snapshot) && typeof g.snapshot.state == "string" ? g.snapshot.state : "unknown"
      ])
    ),
    contextTags: b
  };
}
function Fr(e, t, n, r, o, i) {
  const s = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return fe(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = Be(r.flatMap((h) => h.observations));
        s.push(...d);
        const m = !r.some(
          (h) => h.observations.some(
            (b) => b.dataQualityNotes.some((v) => v.severity === "error")
          )
        );
        return fe(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        s.push(o);
        const d = Yr(o.status, n.executionVenuePolicy.mode);
        return fe(
          c,
          d,
          `Execution venue ${o.status}`,
          [o]
        );
      }
      if (c === "selectedUniverse") {
        const d = Wr(i, e, t);
        return d && s.push(d), fe(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const l = $t(e, t, n);
      s.push(l);
      const u = n.liquidityPolicy.minimumQuoteNotional, f = u == null || l.value == null ? u == null || n.liquidityPolicy.missingData === "warn" : l.value >= u;
      return fe(
        c,
        f,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: ni(s)
  };
}
function fe(e, t, n, r) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(r.map((o) => o.observationId))].sort()
  };
}
function Lr(e, t, n, r) {
  const o = n.executionVenuePolicy.intendedVenue ?? "ignored", i = [...r].filter(
    (a) => a.symbol.toUpperCase() === e.symbol.toUpperCase() && a.executionVenue.toLowerCase() === o.toLowerCase() && a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo >= t)
  );
  for (const a of i)
    if (Bt(a) !== a.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const s = Ze(
    i,
    (a) => [a.effectiveFrom, a.knownAt],
    "execution-venue eligibility"
  );
  return s || xr({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: o,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      q(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function Dr(e, t, n, r) {
  const o = {
    logicalObjectId: `selection-anchor:${H({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - X(n, r.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: r.observationId
  };
  return M({
    ...o,
    observationId: `selection-anchor-observation:${H(o)}`
  });
}
function Ne(e, t, n, r, o) {
  const i = {
    schemaVersion: Ar,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: r,
    rearmState: o
  };
  return M({
    ...i,
    observationId: `radar-status:${H(i)}`
  });
}
function Br(e, t, n, r, o, i, s, a, c) {
  const l = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: r,
    hardGateEvidence: o,
    evaluable: c,
    detectorGatePassed: i,
    hardGatesPassed: s,
    compositePassed: a
  };
  return M({
    ...l,
    id: `radar-gate:${H(l)}`
  });
}
function xe(e, t, n, r, o) {
  const i = t || n.every(
    (s) => s.dataQualityNotes.every((a) => a.severity !== "error")
  );
  return {
    detectorId: e.id,
    detectorType: e.type,
    evaluable: i,
    passed: t,
    observationIds: n.map((s) => s.observationId),
    winningObservationId: r,
    explanation: o
  };
}
function z(e, t, n) {
  const r = e.filter((o) => {
    if (!Number.isFinite(o.bucket))
      throw new RangeError("Candle bucket must be finite");
    return X(o, t) <= n;
  });
  return Hr(r);
}
function Hr(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of [...e].sort((r, o) => r.bucket - o.bucket || r.ts - o.ts)) {
    if (!ti(n))
      throw new RangeError(`Invalid candle for bucket ${n.bucket}`);
    const r = t.get(n.bucket);
    if (r && ut(r) !== ut(n))
      throw new Error(
        `Conflicting candle revisions for bucket ${n.bucket}; supply cutoff-resolved history`
      );
    t.set(n.bucket, n);
  }
  return [...t.values()].sort((n, r) => n.bucket - r.bucket);
}
function Vr(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([r, o]) => {
      if (!I(K(r)))
        throw new RangeError(`Invalid radar timeframe ${r}`);
      return [r, z(o, r, t)];
    })
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function $r(e, t, n) {
  const r = e.filter(
    (i) => i.symbol.toUpperCase() === t.symbol.toUpperCase() && i.source === t.source && i.knownAt <= n
  );
  for (const i of r)
    if (Dt(i) !== i.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const o = /* @__PURE__ */ new Map();
  for (const i of new Set(r.map((s) => s.timeframe))) {
    const s = Ze(
      r.filter((a) => a.timeframe === i),
      (a) => [a.knownAt, a.eventTime],
      `market-structure ${i}`
    );
    s && o.set(i, s);
  }
  return Object.fromEntries(
    [...o.entries()].sort(([i], [s]) => Je(i, s)).map(
      ([i, s]) => [
        i,
        De({
          logicalObjectId: s.logicalObjectId,
          objectType: "MarketStructure",
          eventTime: s.eventTime,
          knownAt: s.knownAt,
          snapshot: { state: s.state, detail: s.snapshot }
        })
      ]
    )
  );
}
function ut(e) {
  return D({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: ee(e.v_base) ? e.v_base : null,
    vQuote: ee(e.v_quote) ? e.v_quote : null,
    ver: ee(e.ver) ? e.ver : null
  });
}
function Xe(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function qr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = Xe(e, i.bucket - n.windowSeconds);
    if (!s || !I(s.c)) continue;
    const a = i.bucket - n.windowSeconds - s.bucket;
    n.maximumReferenceStalenessSeconds != null && a > n.maximumReferenceStalenessSeconds || o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function Ur(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = e.filter(
      (a) => a.bucket <= i.bucket && a.bucket >= i.bucket - n.lookbackSeconds && i.bucket - a.bucket <= n.maximumTroughAgeSeconds && I(a.c)
    ).sort((a, c) => a.c - c.c || a.bucket - c.bucket)[0];
    s && o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function qt(e, t, n) {
  const r = [];
  if (e.length < n && r.push(
    q(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: r };
  const o = e.filter((l) => l <= t).length / e.length * 100, i = e.reduce((l, u) => l + u, 0) / e.length, s = e.reduce((l, u) => l + (u - i) ** 2, 0) / e.length, a = Math.sqrt(s), c = a > 0 ? (t - i) / a : null;
  return { percentile: o, zScore: c, notes: r };
}
function Ke(e, t, n) {
  return t ? e.filter((r) => r.bucket >= t.bucket - n) : [];
}
function Ut(e, t) {
  return e.value != null && ye(e.value, t.minimumReturnPct) && ye(e.percentile, t.minimumPercentile) && ye(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function jr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let r = e.slice(0, t).reduce((i, s) => i + s.c, 0) / t;
  n[t - 1] = r;
  const o = 2 / (t + 1);
  for (let i = t; i < e.length; i += 1)
    r = e[i].c * o + r * (1 - o), n[i] = r;
  return n;
}
function zr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  const r = e.map((i, s) => {
    var c;
    const a = ((c = e[s - 1]) == null ? void 0 : c.c) ?? i.c;
    return Math.max(i.h - i.l, Math.abs(i.h - a), Math.abs(i.l - a));
  });
  let o = r.slice(0, t).reduce((i, s) => i + s, 0) / t;
  n[t - 1] = o;
  for (let i = t; i < r.length; i += 1)
    o = (o * (t - 1) + r[i]) / t, n[i] = o;
  return n;
}
function Gr(e, t, n) {
  const r = e.filter((s) => s.asOf != null && s.asOf <= n);
  for (const s of r) Qr(s, t, n);
  const o = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), i = r.filter((s) => s.asOf === o);
  if (new Set(i.map((s) => D(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${o}`);
  return i[0] ?? null;
}
function Qr(e, t, n) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== Q || !e.lifecycleConfigHash.trim())
    throw new Error("Lifecycle snapshot is incompatible with the radar profile");
  $(e.asOf, n, "lifecycle asOf"), $(e.updatedTs, n, "lifecycle updatedTs"), $(e.stateSince, n, "lifecycle stateSince");
  const r = e.candidate;
  if (r) {
    if (r.symbol.toUpperCase() !== t.symbol.toUpperCase() || r.source.toLowerCase() !== t.source.toLowerCase() || r.setupFamily !== e.setupFamily || r.lifecycleVersion !== e.lifecycleVersion || r.lifecycleConfigHash !== e.lifecycleConfigHash)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [o, i] of [
      ["candidate detectedAt", r.detectedAt],
      ["candidate detectionEventTime", r.detectionEventTime],
      ["candidate episodeHighTime", r.episodeHighTime],
      ["candidate stateSince", r.stateSince],
      ["candidate terminalAt", r.terminalAt]
    ])
      $(i, n, o);
    for (const o of r.initialMtfContext)
      $(o.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const o of e.evidence)
    if ($(o.eventTime, n, "lifecycle evidence eventTime"), $(o.knownAt, n, "lifecycle evidence knownAt"), o.knownAt < o.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const o of e.transitions)
    $(o.knownAt, n, "lifecycle transition knownAt");
  for (const [o, i] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (i && ($(i.eventTime, n, `${o} eventTime`), $(i.knownAt, n, `${o} knownAt`), i.knownAt < i.eventTime))
      throw new Error(`${o} knownAt precedes eventTime`);
  for (const o of e.confluence)
    if ($(o.eventTime, n, "lifecycle confluence eventTime"), $(o.knownAt, n, "lifecycle confluence knownAt"), o.eventTime != null && o.knownAt != null && o.knownAt < o.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function $(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function Wr(e, t, n) {
  const r = [...e].filter(
    (o) => o.symbol.toUpperCase() === t.symbol.toUpperCase() && o.source === t.source && o.knownAt <= n && o.effectiveFrom <= n && (o.effectiveTo == null || o.effectiveTo >= n)
  );
  for (const o of r)
    if (Lt(o) !== o.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Ze(
    r,
    (o) => [o.effectiveFrom, o.knownAt],
    "universe membership"
  );
}
function Xr(e) {
  const t = /* @__PURE__ */ new Map();
  function n(r, o, i, s) {
    const a = t.get(r) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    a.duration = Math.max(a.duration, o), a.bars = Math.max(a.bars, i), a.purposes.add(s), t.set(r, a);
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
  return [...t.entries()].sort(([r], [o]) => Je(r, o)).map(([r, o]) => ({
    timeframe: r,
    minimumDurationSeconds: o.duration,
    minimumBars: o.bars,
    purposes: [...o.purposes].sort()
  }));
}
function Kr(e, t) {
  const n = e.filter((o) => o.passed).length, r = e.filter((o) => !o.evaluable).length;
  return t.mode === "all" ? {
    passed: n === e.length,
    evaluable: e.some((o) => o.evaluable && !o.passed) || r === 0
  } : t.mode === "atLeast" ? {
    passed: n >= t.count,
    evaluable: n >= t.count || n + r < t.count
  } : {
    passed: n > 0,
    evaluable: n > 0 || r === 0
  };
}
function Yr(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Zr(e, t) {
  const n = K(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function C(e) {
  throw new RangeError(e);
}
function jt(e) {
  var n;
  e.schemaVersion !== Ot && C("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && C("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && C("Only impulse_fade_v1 radar profiles are supported"), I(K(e.scanTimeframe)) || C("scanTimeframe must be valid"), e.evaluationCadence.mode !== "completedScanCandle" && C("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && C("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || C("At least one move detector is required"), new Set(e.moveDetectors.map((r) => r.id)).size !== e.moveDetectors.length && C("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && C("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((r) => !t.has(r)) && C("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || C("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && C("atLeast detector count must be between one and the detector count"), (!I(e.episodeExpiry.maximumAgeSeconds) || !I(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && C("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((r) => !r.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !I(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && C("Radar profile policies are invalid");
  for (const r of e.moveDetectors) Jr(r);
}
function Jr(e) {
  if (e.id.trim() || C("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || C(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && C(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!I(K(e.analysisTimeframe)) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && C(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!I(e.historyLookbackSeconds) || !_e(e.minimumPercentile, 0, 100) || !_e(e.minimumZScore)) && C(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!I(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !I(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && C(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!_e(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && C(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !I(e.windowSeconds) && C(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !I(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && C(`Detector ${e.id} requires unique positive windows`);
}
function ei(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Ft(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (jt(n), e.strategyProfile) {
    if (We(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: r, ...o } = e.strategyProfile;
    Nt(o);
  }
}
function _e(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function ye(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function ti(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && I(e.o) && I(e.h) && I(e.l) && I(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && Oe(e.v_base) && Oe(e.v_quote) && Oe(e.ver);
}
function Oe(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function I(e) {
  return Number.isFinite(e) && e > 0;
}
function ee(e) {
  return e != null && Number.isFinite(e);
}
function q(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Ye(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Be(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(zt);
}
function ni(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function Ze(e, t, n) {
  if (!e.length) return null;
  const r = [...e].sort((a, c) => {
    const l = t(a), u = t(c);
    for (let f = 0; f < Math.max(l.length, u.length); f += 1) {
      const d = (l[f] ?? -1 / 0) - (u[f] ?? -1 / 0);
      if (d !== 0) return d;
    }
    return a.observationId.localeCompare(c.observationId);
  }), o = r.at(-1), i = t(o), s = r.filter((a) => {
    const c = t(a);
    return c.length === i.length && c.every((l, u) => l === i[u]);
  });
  if (new Set(s.map((a) => a.observationId)).size > 1)
    throw new Error(`Conflicting ${n} observations at the same precedence`);
  return o;
}
function zt(e, t) {
  return e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function ri(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function ii(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function oi(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function Je(e, t) {
  return K(e) - K(t) || e.localeCompare(t);
}
function Gt(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function ke(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Qt(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function H(e) {
  return L(e).slice(8);
}
function Wi(e) {
  return D(e);
}
const si = "linear-quote-perpetual-risk.1", ai = "sizing-result.1", ci = "trade-plan.1", li = "decision-record.1";
function Wt(e) {
  const t = [], n = [
    ie(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(ie("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((N) => !Number.isFinite(N) || N <= 0) && t.push(ie("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(ie("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && A(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!we(e.intendedEntryPrice, e.venueRules.priceTick) || !we(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (N) => !we(N.targetPrice, e.venueRules.priceTick)
  )) && A(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !we(e.leveragePolicy.leverage, e.venueRules.leverageStep) && A(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    ie(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const o = e.riskRequest.accountRiskFraction != null, i = e.riskRequest.fixedRiskAmount != null;
  o === i && t.push(
    ie(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (o && (!U(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!U(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && A(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (N) => !Number.isFinite(N) || N < 0
  ) && A(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && A(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const s = i ? e.riskRequest.fixedRiskAmount : o ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (s == null || !Number.isFinite(s) || s <= 0) && A(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), fi(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const a = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = U(a) ? a : null, l = U(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && A(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = s != null && u != null && u > 0 ? s / u : null;
  let d = f == null ? null : ft(f, e.venueRules.quantityStep);
  if (d != null && s != null && u != null)
    for (; d > 0 && d * u > s + Math.max(1e-10, s * 1e-12); )
      d = ft(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = d != null && d > 0 ? d : null, h = m == null ? null : m * e.intendedEntryPrice, b = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, v = m == null || l == null ? null : m * l * e.executionAssumptions.stopExitFeeRate, g = m == null || u == null ? null : m * u;
  (m == null || m < e.venueRules.minQuantity) && A(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (h == null || h < e.venueRules.minNotional) && A(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const E = e.riskRequest.maximumNotional;
  E != null && h != null && h > E && A(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${E}`
  );
  const R = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, T = e.accountState.availableBalance == null ? R : Math.min(R, e.accountState.availableBalance), P = h != null && T > 0 ? h / T : null, S = bi(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  S != null && S > e.venueRules.maxLeverage && A(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${S} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const y = h != null && S != null && S > 0 ? h / S : null;
  y != null && y > R + 1e-10 && A(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), y != null && e.accountState.availableBalance != null && y > e.accountState.availableBalance + 1e-10 && A(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const p = m != null && c != null && l != null ? m * (l - c) : null, O = di(
    e.targets,
    m,
    c,
    p,
    g,
    e.executionAssumptions
  ), G = Ae(
    O.map((N) => N.grossReward * N.positionFraction)
  ), ne = Ae(
    O.map((N) => N.netProjectedReward * N.positionFraction)
  ), x = Ae(
    O.map(
      (N) => N.weightedGrossRContribution == null ? null : N.weightedGrossRContribution
    )
  ), V = Ae(
    O.map(
      (N) => N.weightedRContribution == null ? null : N.weightedRContribution
    )
  );
  return M({
    schemaVersion: ai,
    sizingModelVersion: si,
    side: e.side,
    riskBudget: s,
    rawQuantity: f,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: h,
    estimatedEntryFee: b,
    estimatedStopFee: v,
    projectedLossAtStop: g,
    projectedLossPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    selectedLeverage: S,
    minimumRequiredLeverage: P,
    initialMargin: y,
    marginPercentEquity: y == null || e.accountState.equity <= 0 ? null : y / e.accountState.equity * 100,
    marginPercentAvailableBalance: y == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : y / e.accountState.availableBalance * 100,
    targetOutcomes: O,
    weightedGrossReward: G,
    weightedProjectedReward: ne,
    weightedGrossR: x,
    weightedProjectedR: V,
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
function Xi(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = Wt({
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
    schemaVersion: ci,
    snapshotId: e.snapshot.id,
    setupFamily: J,
    lifecycleVersion: Q,
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
  }, r = { ...n, id: e.id ?? Xt(n) }, o = ui({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return M({ ...r, complianceResult: o });
}
function ui(e) {
  var d, m, h;
  const { strategyProfile: t, snapshot: n, plan: r } = e, o = [...r.sizingResult.hardErrors], i = [], s = [...r.sizingResult.warnings], a = Wt({
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
  (We(t) !== t.profileHash || _t(n) !== n.id || Xt(r) !== r.id || D(a) !== D(r.sizingResult)) && A(
    o,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (d = n.candidateEpisode) != null && d.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && A(
    o,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== It || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || D(r.executionAssumptions) !== D(t.executionAssumptions)) && A(
    o,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(r.entryPlan.orderPlanType) || A(
    i,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${r.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(r.stopPlan.derivationType) || A(
    i,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${r.stopPlan.derivationType} is not permitted`
  );
  for (const b of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(b.derivationType) || A(
      i,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${b.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && A(
    i,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = r.targetPlans.reduce(
    (b, v) => b + v.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && A(
    o,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), vi(n, r, o), yi(r, o), mi(n, t, i), hi(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((m = n.candidateEpisode) == null ? void 0 : m.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && A(
    i,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), r.sizingResult.initialMargin != null && r.sizingResult.initialMargin > r.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && A(
    i,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && r.sizingResult.grossNotional != null && r.sizingResult.grossNotional > t.riskPolicy.maximumNotional && A(
    i,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && r.sizingResult.weightedProjectedR != null && r.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && A(
    i,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${r.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), r.sizingResult.projectedLossAtStop != null && r.sizingResult.projectedLossAtStop > r.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && A(
    i,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = i.some((b) => b.code === "NO_ACTIVE_CANDIDATE"), u = ((h = r.discretionaryOverrideReason) == null ? void 0 : h.trim()) || null;
  r.status === "finalized" && i.length > 0 && !l && !u && A(
    o,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return o.length > 0 ? f = "InvalidPlan" : l ? f = "OutOfStrategy" : i.length === 0 ? f = "Compliant" : u ? f = "Overridden" : f = "OutOfStrategy", M({
    classification: f,
    hardErrors: o,
    strategyViolations: i,
    warnings: s,
    overrideReason: u
  });
}
function Ki(e) {
  var r, o;
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
    schemaVersion: li,
    sessionId: e.sessionId ?? null,
    snapshotId: e.snapshot.id,
    decisionTime: e.decisionTime,
    action: e.action,
    confidence: e.confidence ?? null,
    thesis: ((r = e.thesis) == null ? void 0 : r.trim()) || null,
    tags: [...e.tags ?? []],
    nextCondition: ((o = e.nextCondition) == null ? void 0 : o.trim()) || null,
    skipReason: e.skipReason ?? null,
    tradePlan: e.tradePlan ?? null
  }, n = e.id ?? `decision:${L(t).slice(8)}`;
  return M({ ...t, id: n });
}
function fi(e, t, n, r) {
  (!e.length || e.some((i) => i.targetPrice >= t)) && A(r, "NO_VALID_TARGET", "Every short target must be below entry");
  const o = e.reduce((i, s) => i + s.positionFraction, 0);
  (e.some(
    (i) => !Number.isFinite(i.positionFraction) || i.positionFraction <= 0
  ) || Math.abs(o - 1) > n) && A(
    r,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function di(e, t, n, r, o, i) {
  return t == null || n == null ? [] : e.map((s) => {
    const a = s.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), c = t * (n - a), l = t * n * i.entryFeeRate, u = t * a * i.targetExitFeeRate, f = c - l - u, d = r != null && r > 0 ? c / r : null, m = o != null && o > 0 ? f / o : null;
    return {
      targetId: s.id,
      targetPrice: s.targetPrice,
      effectiveTargetPrice: a,
      positionFraction: s.positionFraction,
      grossReward: c,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: f,
      grossR: d,
      projectedR: m,
      weightedGrossRContribution: d == null ? null : d * s.positionFraction,
      weightedRContribution: m == null ? null : m * s.positionFraction
    };
  });
}
function mi(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    A(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (A(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && A(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && A(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const o = e.lifecycleEvidence.some(
    (i) => i.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !o && A(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && A(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function hi(e, t, n) {
  var c;
  const r = t.entryPolicy.requiredDataQuality, o = r.candidateMetricsRequired && e.candidateMetrics == null, i = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, s = r.minimumHistoryCoverageRatio != null && (i == null || i < r.minimumHistoryCoverageRatio), a = e.dataQualityNotes.some(
    (l) => r.rejectedNoteSeverities.includes(l.severity)
  );
  (o || s || a) && A(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function vi(e, t, n) {
  const r = new Map(
    mr(e).map((i) => [i.id, i])
  ), o = [
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
  for (const i of o) {
    if (!i.id && !i.reference && !i.requiresReference) continue;
    if (!i.id || !i.reference) {
      A(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    i.reference.knownAt > e.effectiveAsOf && A(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${i.id} was not known at the decision cutoff`
    );
    const s = r.get(i.id);
    s ? D(s) !== D(i.reference) && A(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${i.id} differs from the frozen snapshot object`
    ) : A(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${i.id} is absent from the decision snapshot`
    );
  }
}
function yi(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && A(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const o = e.stopPlan.referenceLevel;
  if (o && e.stopPlan.derivationType !== "manual") {
    const i = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? o.rangeHigh ?? o.price : o.price, { basisPoints: s, atrFraction: a, atrValue: c } = e.stopPlan.buffer;
    let l = i;
    s != null && a != null ? A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : s != null ? l = i * (1 + s / 1e4) : a != null && (U(c ?? 0) ? l = i + a * (c ?? 0) : A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const i of e.targetPlans) {
    const s = i.referenceLevel;
    if (!s || i.derivationType === "manual" || i.derivationType === "fixedRMultiple")
      continue;
    (i.derivationType === "supportZone" ? i.targetPrice >= (s.rangeLow ?? s.price) - n && i.targetPrice <= (s.rangeHigh ?? s.price) + n : Math.abs(i.targetPrice - s.price) <= n + 1e-12) || A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${i.id} does not match its frozen reference`
    );
  }
}
function bi(e, t, n) {
  return e.mode === "manual" ? U(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, gi(t, n));
}
function Xt(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${L(r).slice(8)}`;
}
function ft(e, t) {
  if (!U(e) || !U(t)) return 0;
  const n = Kt(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function gi(e, t) {
  if (!U(e) || !U(t)) return e;
  const n = Kt(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Kt(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function we(e, t) {
  if (!Number.isFinite(e) || !U(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Ae(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function U(e) {
  return Number.isFinite(e) && e > 0;
}
function ie(e, t) {
  return { code: e, message: t };
}
function A(e, t, n) {
  e.some((r) => r.code === t) || e.push(ie(t, n));
}
export {
  Fi as CANDLE_TIMESTAMP_SEMANTICS,
  li as DECISION_RECORD_SCHEMA_VERSION,
  It as DECISION_SNAPSHOT_SCHEMA_VERSION,
  dr as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  kr as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  Gi as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  de as IMPULSE_FADE_CANDIDATE_GATE,
  cn as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  Q as IMPULSE_FADE_LIFECYCLE_VERSION,
  cr as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  lr as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  J as IMPULSE_FADE_SETUP_FAMILY,
  pr as RADAR_EPISODE_SCHEMA_VERSION,
  Mt as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  wr as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  Ot as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  Ar as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  Tr as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  Rr as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  Sr as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  si as SIZING_MODEL_VERSION,
  ai as SIZING_RESULT_SCHEMA_VERSION,
  ar as STRATEGY_PROFILE_SCHEMA_VERSION,
  ci as TRADE_PLAN_SCHEMA_VERSION,
  Ti as appendSyntheticCandle,
  ae as bucketStart,
  Wt as calculateLinearPerpetualSizing,
  X as candleCloseTime,
  et as candleToBytes,
  Yt as candlesToBytes,
  L as canonicalHash,
  Wi as canonicalRadarJson,
  D as canonicalSerialize,
  Tt as computeAnchoredVwapLine,
  Di as computeAnchoredVwapSignals,
  Li as computeAnchoredVwapSnapshot,
  _i as computeAtrLine,
  Pi as computeBollingerBands,
  wi as computeCloseChangePct,
  Ei as computeEmaLine,
  Ve as computeExtensionSnapshot,
  Ni as computeMacd,
  he as computeMarketStructure,
  Tn as computeRelativeCumulativeReturnLine,
  Vi as computeRelativeStrengthDivergences,
  Ci as computeRsiLine,
  ln as computeSetupState,
  Ri as computeSmaLine,
  Ii as computeStochRsi,
  Bi as computeStructureActiveLevels,
  Hi as computeSupportResistanceZones,
  kn as computeSupportResistanceZonesFromSwings,
  An as computeSwingPoints,
  Ai as computeViewBounds,
  xi as computeWmaLine,
  Ki as createDecisionRecord,
  qi as createDecisionReferenceLevel,
  Ui as createDecisionSnapshot,
  De as createDurableObjectReference,
  xr as createExecutionVenueEligibilityObservation,
  fr as createImpulseFadeResearchProfile,
  Er as createRadarSelectionProfile,
  ji as createRadarStructureObservation,
  Nt as createStrategyProfile,
  Xi as createTradePlan,
  zi as createUniverseMembershipObservation,
  ur as decisionReferenceObservationId,
  _t as decisionSnapshotId,
  mr as decisionSnapshotReferenceLevels,
  Mi as evaluateImpulseFadeSnapshot,
  Oi as evaluateImpulseFadeTimeline,
  ui as evaluateTradePlanCompliance,
  Bt as executionVenueEligibilityObservationId,
  M as immutableJsonClone,
  ce as impulseFadeLifecycleConfigHash,
  $i as lineToBytes,
  ki as makeSyntheticCandles,
  Zt as mergeLiveCandle,
  dt as normalizeOhlcvPoint,
  pi as normalizeRestTimeframe,
  mt as packHistoricalCandles,
  Si as prependHistoricalCandles,
  Ft as radarSelectionProfileHash,
  Dt as radarStructureObservationId,
  Qi as scanRadarEpisodes,
  We as strategyProfileHash,
  K as timeframeToSeconds,
  Xt as tradePlanId,
  Lt as universeMembershipObservationId
};
