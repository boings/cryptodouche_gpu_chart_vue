function Se(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function Ti(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ae(e, t) {
  return Math.floor(e / t) * t;
}
function gt(e) {
  const t = At(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = st(n.ts), o = re(n.o), i = re(n.h), s = re(n.l), a = re(n.c), c = n.knownAt == null ? void 0 : st(n.knownAt);
  return r == null || o == null || i == null || s == null || a == null || n.knownAt != null && c == null ? null : {
    ts: r,
    o,
    h: i,
    l: s,
    c: a,
    v_base: re(n.v_base),
    v_quote: re(n.v_quote),
    ver: re(n.ver),
    knownAt: c ?? void 0
  };
}
function pt(e, t, n) {
  const r = Se(t), o = an(
    e.map((a, c) => St(a, c)).filter((a) => a != null),
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
  return $e({
    timeframeSec: r,
    firstBucket: i,
    candles: s,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Ri(e, t, n) {
  const r = e.candles.length, o = t.map((s, a) => St(s, a)).filter((s) => s != null).filter((s) => ae(s.ts, e.timeframeSec) < e.firstBucket).sort(wt);
  if (!o.length) return 0;
  const i = pt(
    [...o, ...e.candles],
    n,
    o.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function rn(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function ot(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function Ei(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function on(e, t, n, r = 3) {
  const o = gt(t);
  if (!o) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = ae(o.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const s = e.positionByBucket.get(i), a = (i - e.firstBucket) / e.timeframeSec, c = { ...o, bucket: i, x: a };
  if (s != null)
    return dn(c, e.candles[s]) ? { kind: "ignore", reason: "stale-version" } : fn(e.candles[s], c) ? (e.candles[s] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[s] = c, {
      kind: "replace",
      position: s,
      bytes: ot(c)
    });
  const l = e.candles[e.candles.length - 1];
  return i <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - l.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), sn(e), { kind: "reset", bytes: rn(e.candles) }) : ($e(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: ot(c)
  }));
}
function xi(e, t = []) {
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
function Pi(e, t, n) {
  const r = Se(n), o = Math.floor(Date.now() / 1e3), i = ae(o, r), s = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), a = [];
  let c = 40 + s % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = i - l * r, d = Math.sin((t - l + s) / 9) * 0.8, f = c, h = Math.max(1e-4, f + d + Math.cos((t - l) / 13) * 0.35), v = Math.max(f, h) + 0.35 + Math.abs(Math.sin(l + s)) * 0.5, g = Math.min(f, h) - 0.35 - Math.abs(Math.cos(l + s)) * 0.5, m = 50 + s % 90 + Math.abs(Math.sin((t - l + s) / 5)) * 180;
    a.push({ ts: u, o: f, h: v, l: g, c: h, v_base: m, v_quote: m * h }), c = h;
  }
  return pt(a, n, t);
}
function Ci(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, o = Math.sin(r / 600) * 0.7, i = n.c, s = Math.max(1e-4, i + o), a = Math.max(i, s) + 0.5, c = Math.min(i, s) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(o) * 0.36));
  return on(e, { ts: r, o: i, h: a, l: c, c: s, v_base: l, v_quote: l * s }, t);
}
function sn(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  $e(e);
}
function $e(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function St(e, t) {
  const n = gt(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function an(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = ae(r.ts, t), i = n.get(o);
    (!i || wt(r, i) > 0) && n.set(o, r);
  }
  return Array.from(n.entries()).sort(([r], [o]) => r - o).map(([, r]) => cn(r));
}
function wt(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function cn(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function st(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? ln(e) : un(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function ln(e) {
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
function un(e) {
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
function fn(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function dn(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function re(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function At(e) {
  if (typeof e == "string")
    try {
      return At(JSON.parse(e));
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
  return kt(JSON.parse(D(e)));
}
function kt(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) kt(t);
    Object.freeze(e);
  }
  return e;
}
const Z = "impulse_fade_v1", G = "impulse_fade_v1.lifecycle.1", mn = "impulse_fade_v1.lifecycle-config.1", me = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function Ii(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((o, i) => {
    r += o.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(o.x, r / t);
  }), new Float32Array(n);
}
function Ni(e, t = 20) {
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
function _i(e, t = 20) {
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
function Oi(e, t = 20, n = 2) {
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
      const u = s / t, d = Math.max(0, a / t - u * u), f = Math.sqrt(d) * n;
      r.push(c.x, u), o.push(c.x, u + f), i.push(c.x, u - f);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(o),
    lower: new Float32Array(i)
  };
}
function Mi(e, t = 14) {
  return oe(Ft(e, t));
}
function Fi(e, t = 14, n = 14, r = 3, o = 3) {
  const i = Ft(e, t), s = se(n);
  if (i.length < s)
    return { k: new Float32Array(), d: new Float32Array() };
  const a = [];
  for (let u = s - 1; u < i.length; u++) {
    let d = 1 / 0, f = -1 / 0;
    for (let g = 0; g < s; g++) {
      const m = i[u - g].value;
      d = Math.min(d, m), f = Math.max(f, m);
    }
    const h = f - d, v = h > 0 ? (i[u].value - d) / h * 100 : 50;
    a.push({ x: i[u].x, value: v });
  }
  const c = dt(a, se(r)), l = dt(c, se(o));
  return {
    k: oe(c),
    d: oe(l)
  };
}
function Li(e, t = 12, n = 26, r = 9) {
  const o = Be(e, t), i = Be(e, n), s = [];
  for (let u = 0; u < e.length; u++) {
    const d = o[u], f = i[u];
    d == null || f == null || s.push({ x: e[u].x, value: d - f });
  }
  const a = fr(s, r), c = new Map(s.map((u) => [u.x, u.value])), l = a.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: oe(s),
    signal: oe(a),
    histogram: oe(l)
  };
}
function Di(e, t = 14) {
  const n = Ce(e, t), r = [];
  return n.forEach((o, i) => {
    o != null && r.push({ x: e[i].x, value: o });
  }), oe(r);
}
function qe(e, t = {}) {
  const n = T(t.windowSeconds, 60, 2592e3, 86400), r = T(t.historyDays, 1, 365, 180), o = T(t.minSamples, 1, 5e3, 20), i = T(t.emaPeriod, 2, 500, 20), s = T(t.atrPeriod, 2, 500, 14), a = Ot(e);
  if (!a)
    return Gn(n);
  const c = e.indexOf(a), l = Mt(e, a.bucket - n, c), u = l && B(l.c) ? (a.c / l.c - 1) * 100 : null, d = u == null ? [] : Qn(e, {
    windowSeconds: n,
    earliestBucket: a.bucket - r * 86400,
    excludeBucket: a.bucket
  }), f = u != null && d.length >= o ? Wn(d, u) : null, h = u != null && d.length >= o ? Xn(d, u) : null, v = Be(e, i)[c] ?? null, g = Ce(e, s)[c] ?? null, m = v != null && g != null && Number.isFinite(v) && Number.isFinite(g) && g > 0 ? (a.c - v) / g : null;
  return {
    candle: a,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: f,
    zScore: h,
    rollingReturnCount: d.length,
    ema: v,
    atr: g,
    atrExtension: m
  };
}
function hn(e = {}) {
  var q, z, ne;
  const t = e.executionTimeframe ?? "chart", n = p(e.asOf), r = p(e.latestTs) ?? On(e.candles ?? [], t) ?? p((q = e.structure) == null ? void 0 : q.updatedTs) ?? p((z = e.marketStructure) == null ? void 0 : z.summary.updatedTs) ?? null, o = n ?? r, i = o == null ? null : Qe(e.candles ?? [], o, t), s = (i == null ? void 0 : i.candle.c) ?? p(e.latestPrice), a = vn(e.marketStructure ?? null, n), c = (a == null ? void 0 : a.summary) ?? yn(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : je(e.htfStructures ?? [], n), d = (e.srZones ?? []).filter(
    (P) => n == null || _(P) <= n
  ), f = (e.rsDivergences ?? []).filter(
    (P) => n == null || _(P) <= n
  ), h = (e.anchoredVwapSignals ?? []).filter(
    (P) => n == null || _(P) <= n
  ), v = F(e.resistanceNearPct, 0, 10, 1.5), g = F(e.retestNearPct, 0, 10, 0.8), m = Dn(e.extension ?? null), b = Bn(d, s, v), C = Hn(f), R = Vn(c), E = $n(
    h,
    e.avwapDistancePct
  ), x = qn(c, d, s, g), S = Un(m, b, c, s), y = [
    m,
    b,
    C,
    R,
    E,
    x
  ], A = {
    checks: y,
    asOf: o,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? le({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, k = En({
    extension: m,
    htfResistance: b,
    htfStructures: u,
    rsWeakness: C,
    structureShift: R,
    avwapFailure: E,
    retest: x,
    invalidated: S
  });
  return (ne = e.candles) != null && ne.length && o != null ? pn({
    ...e,
    asOf: o,
    latestPrice: s,
    marketStructure: a,
    structure: c,
    htfStructures: l,
    srZones: d,
    rsDivergences: f,
    anchoredVwapSignals: h,
    checks: y,
    executionTimeframe: t
  }) : Ct({
    ...A,
    state: k,
    reason: zn(k, y),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function vn(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((s) => s.knownAt <= t), r = e.breaks.filter((s) => s.knownAt <= t), o = ((i = ee(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: o,
    summary: Xe(n, r, o)
  };
}
function yn(e, t) {
  if (!e || t == null) return e ?? null;
  const n = p(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function Bi(e) {
  return bn(e).records;
}
function le(e = {}) {
  var t, n, r, o, i, s, a, c, l, u, d;
  return L({
    lifecycleVersion: G,
    lifecycleConfigVersion: mn,
    candidateGate: me,
    extension: {
      windowSeconds: T(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: T((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: T((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: T((o = e.extensionOptions) == null ? void 0 : o.emaPeriod, 2, 500, 20),
      atrPeriod: T((i = e.extensionOptions) == null ? void 0 : i.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: T(
        (s = e.marketStructureOptions) == null ? void 0 : s.lookback,
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
      minMoveAtr: F((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: T((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: T((d = e.marketStructureOptions) == null ? void 0 : d.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: F(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: F(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: F(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: F(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: F(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: T(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Hi(e) {
  var a;
  const t = Et(e), n = ee(t);
  if (n == null) return null;
  const r = Rt(e, n), o = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], s = new Set(
    i.map((c) => X(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && _(c) <= n && s.add(_(c));
  for (const c of [...s].sort((l, u) => l - u))
    Ue(
      xe(i, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (a = e.config) == null ? void 0 : a.marketStructureOptions,
      c,
      o
    );
  return Tt(
    e,
    n,
    o,
    r
  );
}
function bn(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, o = le(r), i = Et(e), s = Rt(
    e,
    ee(i) ?? 0
  ), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = p(e.from) ?? -1 / 0;
  let d = null;
  return { records: i.map((h) => {
    var R, E, x, S, y;
    const v = Tt(
      e,
      h,
      a,
      s
    ), g = xt(e.candidateMetrics, h), m = (g == null ? void 0 : g.metrics) ?? Ge(
      qe(
        xe(n, t, h),
        r.extensionOptions
      )
    );
    d = v;
    const b = v.evidence.filter((A) => c.has(A.id) ? !1 : (c.add(A.id), A.knownAt >= u)), C = v.transitions.filter((A) => {
      const k = gn(A);
      return l.has(k) ? !1 : (l.add(k), A.knownAt >= u);
    });
    return {
      asOf: h,
      setupFamily: Z,
      lifecycleVersion: G,
      lifecycleConfigHash: o,
      candidateGatePassed: ge(m),
      candidateId: ((R = v.candidate) == null ? void 0 : R.id) ?? null,
      candidateDetectedAt: ((E = v.candidate) == null ? void 0 : E.detectedAt) ?? null,
      initialMtfContext: ((x = v.candidate) == null ? void 0 : x.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: ee(C) ?? null,
      transitions: C,
      evidenceAdded: b,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((S = v.candidate) == null ? void 0 : S.episodeHigh) ?? null,
      episodeHighTime: ((y = v.candidate) == null ? void 0 : y.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: d };
}
function Tt(e, t, n, r) {
  const o = e.executionTimeframe, i = e.candlesByTimeframe[o] ?? [], s = e.config ?? {}, a = le(s), c = xe(i, o, t), l = qe(c, s.extensionOptions), u = xt(e.candidateMetrics, t), d = (u == null ? void 0 : u.metrics) ?? Ge(l), f = Ue(
    c,
    o,
    e.structureEvents ?? [],
    s.marketStructureOptions,
    t,
    n
  ), h = r.filter(
    (g) => (g.summary.updatedTs ?? 0) <= t
  ), v = ee(c) ?? null;
  return hn({
    candles: i,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: o,
    asOf: t,
    extensionOptions: s.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: d,
    marketStructure: f,
    structure: f.summary,
    htfStructures: h,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (v == null ? void 0 : v.c) ?? null,
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
function Rt(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const o = new Set(
      r.map((i) => X(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && _(i) <= t && o.add(_(i));
    return [...o].sort((i, s) => i - s).map((i) => {
      var a;
      const s = Ue(
        xe(r, n, i),
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
const Vi = "openTime";
function X(e, t) {
  return (p(e.bucket) ?? p(e.ts) ?? 0) + Math.max(1, Se(t));
}
function xe(e, t, n) {
  return e.filter((r) => X(r, t) <= n);
}
function Et(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, s] of Object.entries(e.candlesByTimeframe))
    for (const a of s) t.add(X(a, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(p(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(_(i));
  for (const i of e.avwapEvents ?? []) t.add(_(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(_(i));
  for (const i of e.supportResistanceZones ?? []) t.add(_(i));
  for (const i of e.evaluationPoints ?? []) {
    const s = p(i);
    s != null && t.add(s);
  }
  const n = [...t].filter(Number.isFinite).sort((i, s) => i - s), r = p(e.from) ?? n[0] ?? 0, o = p(e.to) ?? ee(n) ?? r;
  return t.add(r), t.add(o), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= o).sort((i, s) => i - s);
}
function xt(e, t) {
  return ee([...e ?? []].filter((n) => (p(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (p(n.knownAt) ?? n.asOf) - (p(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function Ue(e, t, n, r, o, i) {
  var d;
  const s = ve(e, r), a = n.filter(
    (f) => (!f.sourceTimeframe || f.sourceTimeframe === t) && _(f) <= o
  ), c = i ?? /* @__PURE__ */ new Map();
  for (const f of [...s.breaks, ...a])
    c.set(
      Y(
        f.kind,
        t,
        f.eventTime,
        f.knownAt,
        `${f.direction}:${f.level}`
      ),
      f
    );
  const l = [...c.values()].filter((f) => f.knownAt <= o).sort(
    (f, h) => f.knownAt - h.knownAt || f.eventTime - h.eventTime
  );
  if (!l.length) return s;
  const u = ((d = ee(l)) == null ? void 0 : d.direction) ?? s.trend;
  return {
    swings: s.swings,
    breaks: l,
    trend: u,
    summary: Xe(s.swings, l, u)
  };
}
function gn(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function pn(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = Sn(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), o = In(r, n);
  let i = wn(r, e);
  if (!i && ge(e.extension ?? null)) {
    const s = Qe(t, e.asOf, e.executionTimeframe);
    s && (i = {
      index: s.index,
      candle: s.candle,
      eventTime: j(s.candle),
      knownAt: Math.min(
        e.asOf,
        K(t, s.index, e.executionTimeframe)
      ),
      metrics: ze(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, o.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? Pt(i, e, e.asOf, o) : Ct({
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
function Sn(e, t, n, r, o) {
  if (o != null && o.length)
    return [...o].map((s) => {
      const a = p(s.knownAt) ?? s.asOf, c = Qe(e, a, r);
      if (!c || a > n) return null;
      const l = p(s.eventTime) ?? j(c.candle), u = ze(s.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: a,
        metrics: u,
        pass: ge(u),
        rollingReturnCount: Math.max(0, Math.trunc(s.sampleCount ?? 0))
      };
    }).filter((s) => s != null).sort((s, a) => s.knownAt - a.knownAt || s.eventTime - a.eventTime);
  const i = [];
  for (let s = 0; s < e.length; s += 1) {
    const a = e[s], c = K(e, s, r);
    if (c > n) continue;
    const l = qe(e.slice(0, s + 1), t), u = Ge(l);
    i.push({
      index: s,
      candle: a,
      eventTime: j(a),
      knownAt: c,
      metrics: u,
      pass: ge(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return i;
}
function wn(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const s of e)
    s.pass && !r && n.push(s), r = s.pass;
  if (!n.length) return null;
  let o = n[0];
  for (const s of n.slice(1)) {
    const c = ((i = Pt(o, t, s.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < s.knownAt && !l.pass) && (o = s);
  }
  return o;
}
function Pt(e, t, n, r) {
  const o = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", s = t.venue ?? "", a = t.executionTimeframe, c = je(
    t.htfStructures ?? [],
    e.knownAt
  ).map((y) => ({
    timeframe: y.timeframe,
    state: y.summary.state,
    trend: y.summary.trend,
    transitionDirection: y.summary.transitionDirection,
    updatedTs: y.summary.updatedTs
  })), l = _n({
    setupFamily: Z,
    symbol: o,
    source: i,
    venue: s,
    executionTimeframe: a,
    detectedAt: e.knownAt
  }), u = [
    {
      id: Y("candidate_detected", a, e.eventTime, e.knownAt),
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
  ], f = Tn(t, e, n), h = An(e, t, n);
  let v = "developing", g = e.knownAt, m = null, b = null, C = null, R = null, E = null;
  for (const y of h) {
    if (m != null) break;
    if (!(y.knownAt < e.knownAt || y.knownAt > n)) {
      if (y.lifecycleKind === "deterioration") {
        u.push({ ...y, contributesTo: "deteriorating" }), v === "developing" && (d.push(fe(v, "deteriorating", y)), v = "deteriorating", g = y.knownAt);
        continue;
      }
      if (y.lifecycleKind === "bearishBreak") {
        u.push({ ...y, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (d.push(fe(v, "waitingForRetest", y)), v = "waitingForRetest", g = y.knownAt, b = y.breakLevel ?? null);
        continue;
      }
      if (y.lifecycleKind === "retest") {
        v === "waitingForRetest" && b && y.relatedEventId === b.evidenceId && y.knownAt > b.knownAt && (u.push({ ...y, contributesTo: "entryCandidate" }), d.push(fe(v, "entryCandidate", y)), v = "entryCandidate", g = y.knownAt, C = y.breakLevel ?? b);
        continue;
      }
      if (y.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (u.push({ ...y, contributesTo: "invalidated" }), d.push(fe(v, "invalidated", y)), v = "invalidated", g = y.knownAt, m = y.knownAt, R = y.explanation);
        continue;
      }
      y.lifecycleKind === "expiry" && v !== "entryCandidate" && (u.push({ ...y, contributesTo: "expired" }), d.push(fe(v, "expired", y)), v = "expired", g = y.knownAt, m = y.knownAt, E = y.explanation);
    }
  }
  const x = _t(
    t.candles ?? [],
    e.eventTime,
    n,
    a
  ), S = {
    id: l,
    setupFamily: Z,
    lifecycleVersion: G,
    lifecycleConfigHash: t.lifecycleConfigHash ?? le({
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
    episodeHigh: (x == null ? void 0 : x.price) ?? null,
    episodeHighTime: (x == null ? void 0 : x.eventTime) ?? null,
    currentState: v,
    stateSince: g,
    terminalAt: m
  };
  return {
    strategy: "pumpFade",
    setupFamily: Z,
    lifecycleVersion: G,
    lifecycleConfigHash: S.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: a,
    state: v,
    currentState: v,
    stateSince: g,
    label: Pe(v),
    reason: Nn(v, u, d, R, E),
    checks: t.checks,
    updatedTs: n,
    candidate: S,
    evidence: u.sort((y, A) => y.knownAt - A.knownAt || y.eventTime - A.eventTime),
    transitions: d,
    pendingConditions: Nt(v, b),
    activeBreakLevel: b,
    retestLevel: C,
    confluence: f,
    invalidationReason: R,
    expiryReason: E,
    dataQuality: r
  };
}
function An(e, t, n) {
  const r = [], o = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = _(l);
    if (!he(l, e, n)) continue;
    const d = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: Y(d, o, l.eventTime, u, l.x),
      code: d,
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
    l.kind !== "failedReclaim" || !he(l, e, n) || r.push({
      id: Y("avwap_failed_reclaim", o, l.eventTime, u, l.x),
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
  const i = Rn(t), s = [];
  for (const l of i) {
    const u = _(l);
    if (l.direction !== "bearish" || !he(l, e, n)) continue;
    const d = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", f = Y(d, o, l.eventTime, u, l.x), h = {
      level: l.level,
      sourceTimeframe: o,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: f
    }, v = {
      id: f,
      code: d,
      explanation: `${l.label} down through ${Q(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: h
    };
    s.push(v), r.push(v);
  }
  for (const l of s) {
    const u = kn(e, l, t, n);
    u && r.push(u);
  }
  for (const l of i) {
    const u = _(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !he(l, e, n))
      continue;
    const d = (t.candles ?? [])[l.index], f = _t(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      o
    ), h = F(t.invalidationBps, 0, 1e3, 10);
    !d || (f == null ? void 0 : f.price) == null || d.c <= f.price * (1 + h / 1e4) || r.push({
      id: Y("bullish_continuation_invalidation", o, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${Q(f.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: o,
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
    id: Y("candidate_expired", o, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Ln(a)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: o,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function kn(e, t, n, r) {
  var u;
  const o = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const s = F(n.retestToleranceBps, 0, 1e3, 35), a = F(n.retestToleranceAtr, 0, 10, 0.25), c = T((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = Ce(o, c);
  for (let d = 0; d < o.length; d += 1) {
    const f = o[d], h = K(o, d, n.executionTimeframe), v = j(f);
    if (h <= t.knownAt || v < t.knownAt || v < e.knownAt || h > r)
      continue;
    const g = l[d] ?? 0, m = Math.max(
      i.level * (s / 1e4),
      Number.isFinite(g) ? g * a : 0
    );
    if (f.h >= i.level - m && f.l <= i.level + m && f.c < i.level && f.c <= f.o)
      return {
        id: Y(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          j(f),
          h,
          d
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${Q(i.level)}`,
        eventTime: v,
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
function Tn(e, t, n) {
  const r = [], o = We(
    e.srZones.filter((a) => _(a) <= n),
    e.latestPrice,
    F(e.resistanceNearPct, 0, 10, 1.5)
  );
  o && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${Q(o.low)}-${Q(o.high)}`,
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: "MTF",
    level: o.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (a) => a.kind === "loss" && he(a, t, n)
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
  const s = p(e.avwapDistancePct);
  s != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${ye(s, 1)}% from AVWAP`,
    value: s,
    sourceTimeframe: e.executionTimeframe
  });
  for (const a of je(e.htfStructures, n))
    a.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${a.timeframe} structure`,
      detail: Fn(a.summary),
      eventTime: a.summary.updatedTs,
      knownAt: a.summary.updatedTs,
      sourceTimeframe: a.timeframe
    });
  return r;
}
function je(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = p(r.summary.updatedTs);
    if (o != null && o > t) continue;
    const i = n.get(r.timeframe), s = p(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (o ?? -1 / 0) >= s) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function Rn(e) {
  var r, o, i;
  const t = (o = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && o.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((s) => {
    const a = `${s.kind}:${s.direction}:${s.x}:${s.level}:${_(s)}`;
    return n.has(a) ? !1 : (n.add(a), !0);
  });
}
function En(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && at(e.htfResistance, e.htfStructures) ? "deteriorating" : at(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function Ct(e) {
  return {
    strategy: "pumpFade",
    setupFamily: Z,
    lifecycleVersion: G,
    lifecycleConfigHash: e.lifecycleConfigHash ?? le(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: Pe(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: Nt(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function It(e, t = {}) {
  const n = Kn(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let o = 0, i = 0;
  for (let s = n; s < e.length; s += 1) {
    const a = e[s];
    if (!a) continue;
    const c = (a.h + a.l + a.c) / 3;
    if (!B(c)) continue;
    const l = Yn(a, c);
    l <= 0 || (o += l, i += c * l, r.push(a.x, i / o));
  }
  return new Float32Array(r);
}
function $i(e, t = {}) {
  const n = p(t.anchorBucket), r = p(t.anchorX), o = It(e, t);
  if (o.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = o[o.length - 1], s = Ot(e), a = s && B(i) ? (s.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: a,
    candle: s
  };
}
function qi(e, t = {}, n = 20) {
  const r = T(n, 1, 200, 20), o = It(e, t);
  if (o.length < 4) return [];
  const i = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), s = [];
  let a = null;
  for (let c = 0; c < o.length; c += 2) {
    const l = o[c], u = o[c + 1], d = i.get(l);
    if (!d || !B(u) || !B(d.candle.c)) continue;
    const f = K(e, d.index), h = d.candle.c > u ? "above" : d.candle.c < u ? "below" : null;
    h && (a === "above" && h === "below" ? s.push(Ne("loss", d.index, d.candle, u, f)) : a === "below" && h === "above" ? s.push(Ne("reclaim", d.index, d.candle, u, f)) : a === "below" && h === "below" && d.candle.h >= u && d.candle.c < u && s.push(
      Ne("failedReclaim", d.index, d.candle, u, f)
    ), a = h);
  }
  return s.slice(-r);
}
function xn(e, t = {}) {
  const n = T(t.lookback, 20, 2e3, 500), r = T(t.pivotStrength, 1, 20, 3), o = T(t.atrPeriod, 2, 100, 14), i = F(t.minMoveAtr, 0, 10, 0.75), s = T(t.maxSwings, 1, 500, 120), a = Math.max(0, e.length - n), c = e.slice(a);
  if (c.length < r * 2 + 1) return [];
  const l = Ce(e, o), u = [];
  for (let f = r; f < c.length - r; f += 1) {
    const h = c[f], v = a + f, g = l[v] ?? null, m = K(e, v + r);
    ar(c, f, r) && u.push(ct("SwingHigh", v, h, h.h, g, m)), cr(c, f, r) && u.push(ct("SwingLow", v, h, h.l, g, m));
  }
  const d = [];
  for (const f of u) {
    const h = d[d.length - 1];
    if (!h) {
      d.push(f);
      continue;
    }
    if (h.kind === f.kind) {
      rr(f, h) && (d[d.length - 1] = f);
      continue;
    }
    Math.abs(f.price - h.price) >= ir(f, h, i) && d.push(f);
  }
  return Zn(d).slice(-s);
}
function ve(e, t = {}) {
  const n = T(t.maxSwings, 1, 500, 120), r = T(t.maxBreaks, 1, 200, 24), o = xn(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], s = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, d = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const g = K(e, v);
    for (; c < o.length && o[c].index < v && o[c].knownAt <= g; ) {
      const b = o[c];
      b.kind === "SwingHigh" ? l = b : u = b, c += 1;
    }
    const m = e[v];
    if (l && !s.has(l.x) && m.c > l.price) {
      const b = d === "bearish" ? "StructureShift" : "StructureBreak";
      i.push(lt(b, "bullish", v, m, l, g)), s.add(l.x), d = "bullish";
    }
    if (u && !a.has(u.x) && m.c < u.price) {
      const b = d === "bullish" ? "StructureShift" : "StructureBreak";
      i.push(lt(b, "bearish", v, m, u, g)), a.add(u.x), d = "bearish";
    }
  }
  const f = o.slice(-n), h = i.slice(-r);
  return {
    swings: f,
    breaks: h,
    trend: d,
    summary: Xe(f, h, d)
  };
}
function Ui(e) {
  var o;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      ft(t, "SwingHigh", "rangeHigh", null, !0),
      ft(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((o = n.lastBreak) == null ? void 0 : o.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    Ae(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    Ae(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((i) => !!i) : r === "bearish" ? [
    Ae(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    Ae(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((i) => !!i) : [];
}
function ji(e, t = {}) {
  var c, l;
  const n = T(t.lookback, 20, 1e3, 240), r = T(t.pivotStrength, 1, 20, 3), o = T(t.maxZones, 1, 12, 6), i = F(t.thicknessBps, 1, 100, 10), s = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, a = ve(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return Pn(a.swings, {
    maxZones: o,
    thicknessBps: i,
    latestX: s,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function Pn(e, t = {}) {
  var l;
  const n = T(t.maxZones, 1, 12, 6), r = F(t.thicknessBps, 1, 100, 10), o = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, i = p(t.referencePrice), s = t.zonesPerSide == null ? null : T(t.zonesPerSide, 1, 12, 3), a = [];
  for (const u of e)
    or(
      a,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      o - u.x + 1,
      r
    );
  const c = a.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, d) => d.score - u.score || d.touches - u.touches || d.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return sr(c, n, i, s);
}
function Cn(e, t) {
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
function zi(e, t, n = {}) {
  var x;
  const r = T(n.maxDivergences, 1, 100, 16), o = F(n.minDeltaPct, 0, 50, 0.5), i = T(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), s = n.includeDivergences ?? !0, a = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = Cn(e, t), u = ur(l);
  if (!e.length || u.size < 2) return [];
  const f = (((x = e[e.length - 1]) == null ? void 0 : x.x) ?? 0) - i, h = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, v = ve(e, {
    ...h
  }), g = er(e, l), m = ve(g, {
    ...h
  }), b = new Map(e.map((S, y) => [S.x, { candle: S, index: y }])), C = [];
  let R = null, E = null;
  for (const S of v.swings) {
    const y = u.get(S.x);
    if (!(y == null || !Number.isFinite(y))) {
      if (S.kind === "SwingHigh") {
        if (R) {
          const A = u.get(R.x);
          A != null && Number.isFinite(A) && (S.price > R.price && y <= A - o ? s && C.push(
            we(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              S,
              R,
              y,
              A,
              v.summary.state,
              m.summary.state
            )
          ) : S.price < R.price && y >= A + o && a && C.push(
            we(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              S,
              R,
              y,
              A,
              v.summary.state,
              m.summary.state
            )
          ));
        }
        R = S;
        continue;
      }
      if (E) {
        const A = u.get(E.x);
        A != null && Number.isFinite(A) && (S.price > E.price && y <= A - o ? a && C.push(
          we(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            S,
            E,
            y,
            A,
            v.summary.state,
            m.summary.state
          )
        ) : S.price < E.price && y >= A + o && s && C.push(
          we(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            S,
            E,
            y,
            A,
            v.summary.state,
            m.summary.state
          )
        ));
      }
      E = S;
    }
  }
  if (c)
    for (const S of m.breaks) {
      if (S.x < f) continue;
      const y = b.get(S.x), A = u.get(S.x);
      if (!y || A == null || !Number.isFinite(A)) continue;
      const k = ve(e.slice(0, y.index + 1), {
        ...h,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      tr(S.direction, k.summary.state) && C.push(
        Jn(
          S.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          S.direction,
          S.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          y.index,
          y.candle,
          A,
          S,
          k.summary.state,
          m.summary.state
        )
      );
    }
  return C.filter((S) => S.x >= f).sort((S, y) => S.x - y.x || ut(S.signal) - ut(y.signal)).slice(-r);
}
function Gi(e) {
  return new Uint8Array(e.buffer);
}
function ze(e) {
  return {
    returnPct: p(e == null ? void 0 : e.returnPct),
    percentile: p(e == null ? void 0 : e.percentile),
    zScore: p(e == null ? void 0 : e.zScore),
    atrExtension: p(e == null ? void 0 : e.atrExtension)
  };
}
function Ge(e) {
  return {
    returnPct: p(e.returnPct),
    percentile: p(e.percentile),
    zScore: p(e.zScore),
    atrExtension: p(e.atrExtension)
  };
}
function ge(e) {
  const t = ze(e);
  return t.returnPct != null && t.returnPct >= me.returnPct || t.percentile != null && t.percentile >= me.percentile || t.zScore != null && t.zScore >= me.zScore || t.atrExtension != null && t.atrExtension >= me.atrExtension;
}
function In(e, t) {
  const n = [], r = T(t.minSamples, 1, 1e4, 20), o = e[e.length - 1] ?? null;
  return o ? o.rollingReturnCount < r && n.push(
    `Rolling-return history has ${o.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function fe(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function Nn(e, t, n, r, o) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return o ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const s = t.filter((c) => c.contributesTo === e), a = s[s.length - 1];
  return (a == null ? void 0 : a.explanation) ?? Pe(e);
}
function Nt(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${Q(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function _n(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Y(e, t, n, r, o) {
  return [e, t, n, r, o ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function _t(e, t, n, r) {
  let o = null;
  for (let i = 0; i < e.length; i += 1) {
    const s = e[i], a = j(s);
    a < t || K(e, i, r) > n || Number.isFinite(s.h) && (!o || s.h > o.price) && (o = { price: s.h, eventTime: a });
  }
  return o;
}
function On(e, t) {
  return e.length ? K(e, e.length - 1, t) : null;
}
function Qe(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (K(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function j(e) {
  const t = p(e.ts);
  return t ?? p(e.bucket) ?? 0;
}
function K(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? X(r, n) : (p(r.bucket) ?? j(r)) + Mn(e, t) : 0;
}
function Mn(e, t) {
  var i, s, a;
  const n = p((i = e[t]) == null ? void 0 : i.bucket) ?? j(e[t]), r = p((s = e[t + 1]) == null ? void 0 : s.bucket);
  if (r != null && r > n) return r - n;
  const o = p((a = e[t - 1]) == null ? void 0 : a.bucket);
  return o != null && n > o ? n - o : 1;
}
function _(e) {
  return p(e.knownAt) ?? p(e.eventTime) ?? p(e.ts) ?? p(e.bucket) ?? 0;
}
function he(e, t, n) {
  const r = _(e), o = p(e.eventTime) ?? p(e.ts) ?? p(e.bucket) ?? r;
  return r > t.knownAt && r <= n && o >= t.knownAt;
}
function Fn(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Ln(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function B(e) {
  return Number.isFinite(e) && e > 0;
}
function Dn(e) {
  const t = p(e == null ? void 0 : e.returnPct), n = p(e == null ? void 0 : e.percentile), r = p(e == null ? void 0 : e.zScore), o = p(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${ye(t, 1)}%`,
    o == null ? null : `Ext ${ye(o, 1)} ATR`,
    r == null ? null : `Z ${ye(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((a) => !!a);
  return {
    key: "extension",
    label: "Extension",
    status: ge({ returnPct: t, percentile: n, zScore: r, atrExtension: o }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function Bn(e, t, n) {
  const r = We(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${Q(r.low)}-${Q(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Hn(e) {
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
function Vn(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function $n(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = p(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${ye(r, 1)}%`)
  };
}
function qn(e, t, n, r) {
  var c;
  const o = p((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), i = o != null && n != null && jn(n, o) <= r, s = We(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || s) ? "pass" : "pending",
    detail: i ? `Retesting ${Q(o)}` : s ? `Near R ${Q(s.center)}` : "No retest yet"
  };
}
function Un(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const o = p((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return o != null && r > o * 1.01;
}
function at(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function We(e, t, n) {
  return t == null || !B(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, o) => r.distance - o.distance || o.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function jn(e, t) {
  return !B(e) || !B(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function Pe(e) {
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
function zn(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : Pe(e);
}
function ye(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function Q(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function p(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function ee(e) {
  return e[e.length - 1];
}
function Ot(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (B(n.c)) return n;
  }
  return null;
}
function Gn(e) {
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
function Mt(e, t, n) {
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
function Qn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const o = e[r];
    if (o.bucket < t.earliestBucket || o.bucket >= t.excludeBucket || !B(o.c)) continue;
    const i = Mt(e, o.bucket - t.windowSeconds, r);
    !i || !B(i.c) || n.push((o.c / i.c - 1) * 100);
  }
  return n;
}
function Wn(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, o = n.filter((i) => i === t).length;
  return (r + o * 0.5) / n.length * 100;
}
function Xn(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((s, a) => s + a, 0) / n.length, o = n.reduce((s, a) => s + (a - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(o);
  return i > 0 ? (t - r) / i : null;
}
function Ne(e, t, n, r, o) {
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
function Kn(e, t) {
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
function Yn(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function ct(e, t, n, r, o, i) {
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
function Zn(e) {
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
function lt(e, t, n, r, o, i) {
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
function we(e, t, n, r, o, i, s, a, c, l) {
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
function Jn(e, t, n, r, o, i, s, a, c) {
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
function er(e, t) {
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
function tr(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function ut(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function Xe(e, t, n) {
  const r = t[t.length - 1] ?? null, o = De(e, "SwingHigh"), i = De(e, "SwingLow"), s = e[e.length - 1] ?? null, a = nr(t), c = e.length === 0 ? "neutral" : r == null || a ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, l = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
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
function Ae(e, t, n, r, o) {
  for (let s = e.length - 1; s >= 0; s -= 1) {
    const a = e[s];
    if (a.kind === t && n.includes(a.structure))
      return Le(r, o, a);
  }
  const i = De(e, t);
  return i ? Le(r, o, i) : null;
}
function ft(e, t, n, r, o) {
  let i = null;
  for (const s of e)
    s.kind === t && (!i || (o ? s.price > i.price : s.price < i.price)) && (i = s);
  return i ? Le(n, r, i) : null;
}
function Le(e, t, n) {
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
function nr(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function De(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function rr(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function ir(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function Ce(e, t) {
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
function or(e, t, n, r, o) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const s = Math.max(i * (o / 1e4), Number.EPSILON), a = i - s, c = i + s, l = 1 / Math.max(1, r), u = e.find(
    (h) => h.kind === t && lr(h.low, h.high, a, c)
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
  const f = Math.max(u.center * (o / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - f, a), u.high = Math.max(u.high, u.center + f, c);
}
function sr(e, t, n, r) {
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
function ar(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].h >= r || e[t + o].h > r) return !1;
  return !0;
}
function cr(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].l <= r || e[t + o].l < r) return !1;
  return !0;
}
function lr(e, t, n, r) {
  return e <= r && n <= t;
}
function ur(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], o = e[n + 1];
    Number.isFinite(r) && Number.isFinite(o) && t.set(r, o);
  }
  return t;
}
function Be(e, t) {
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
function fr(e, t) {
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
function Ft(e, t) {
  const n = se(t);
  if (e.length <= n) return [];
  let r = 0, o = 0;
  for (let s = 1; s <= n; s++) {
    const a = e[s].c - e[s - 1].c;
    a >= 0 ? r += a : o += Math.abs(a);
  }
  r /= n, o /= n;
  const i = [
    { x: e[n].x, value: mt(r, o) }
  ];
  for (let s = n + 1; s < e.length; s++) {
    const a = e[s].c - e[s - 1].c, c = Math.max(0, a), l = Math.max(0, -a);
    r = (r * (n - 1) + c) / n, o = (o * (n - 1) + l) / n, i.push({ x: e[s].x, value: mt(r, o) });
  }
  return i;
}
function dt(e, t) {
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
function mt(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function se(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function T(e, t, n, r) {
  return Math.floor(F(e, t, n, r));
}
function F(e, t, n, r) {
  const o = Number(e);
  return Number.isFinite(o) ? Math.max(t, Math.min(n, o)) : r;
}
const dr = "strategy-profile.1", Lt = "decision-snapshot.1", mr = "impulse_fade_v1.research.default", hr = "1";
function vr(e) {
  return `decision-reference-observation:${L({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function Ke(e) {
  const { profileHash: t, ...n } = e;
  return L(n);
}
function Dt(e) {
  if (pe(e.createdAt, "createdAt"), e.setupFamily !== Z || e.lifecycleVersion !== G || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [o, i] of Object.entries(e.timeframeRoles))
    if (o === "contextTimeframes") {
      if (!i.every((s) => s.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${o} cannot be blank`);
  if (ht(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), ht(
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
    profileHash: Ke(r)
  });
}
function yr(e = {}) {
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
  return Dt({
    schemaVersion: dr,
    id: e.id ?? mr,
    version: e.version ?? hr,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: Z,
    lifecycleVersion: G,
    lifecycleConfigHash: e.lifecycleConfigHash ?? le(),
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
const br = yr();
function Qi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (kr(e.price, "reference price"), pe(e.eventTime, "reference eventTime"), pe(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = vr(e.sourceObject);
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
function Wi(e) {
  var i, s, a, c;
  if (pe(e.decisionTime, "decisionTime"), pe(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
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
  Ar([
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
  const n = pr(
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
    snapshotSchemaVersion: Lt,
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
    lifecycleEvidence: Oe(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: Sr(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: _e(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: _e(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((a = e.avwapState) == null ? void 0 : a.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: Oe(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: Oe(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: _e(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, o = Bt(r);
  return M({ ...r, id: o });
}
function Bt(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${L(n).slice(8)}`;
}
function gr(e) {
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
function pr(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function Sr(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      wr(r) <= t ? r : null
    ])
  );
}
function _e(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function Oe(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || L(n).localeCompare(L(r))
  );
}
function wr(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function Ar(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && D(r) !== D(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function pe(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function kr(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function ht(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const Ht = "radar-selection-profile.1", Tr = "radar-episode.1", Rr = "replay-case-manifest.1", Ye = "radar-metric-observation.1", Er = "radar-scan-result.1", xr = "radar-episode-status.1", Pr = "execution-venue-eligibility.1", Cr = "radar-structure-observation.1", Ir = "radar-universe-membership.1";
function Vt(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return L(n);
}
function Nr(e) {
  return Kt(e), M({
    ...e,
    canonicalConfigHash: Vt(e)
  });
}
function _r(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: Pr,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return M({
    ...t,
    observationId: Ut(t)
  });
}
function Xi(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !rt(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: Cr,
    ...e
  };
  return M({
    ...t,
    observationId: qt(t)
  });
}
function Ki(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: Ir,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return M({
    ...t,
    observationId: $t(t)
  });
}
function $t(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${H(n)}`;
}
function qt(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${H(n)}`;
}
function He(e) {
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
function Ut(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${H(n)}`;
}
const Yi = Nr({
  schemaVersion: Ht,
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
function Zi(e) {
  var c, l;
  oi(e);
  const t = e.strategyProfile ?? br, n = /* @__PURE__ */ new Map(), r = [], o = [], i = [], s = [], a = /* @__PURE__ */ new Set();
  for (const [u, d] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([f], [h]) => f.localeCompare(h)
  )) {
    const f = zr(d, e.to), h = `${f.symbol.toUpperCase()}\0${f.source.toLowerCase()}`;
    if (a.has(h))
      throw new Error(`Duplicate radar series identity for ${f.symbol} from ${f.source}`);
    a.add(h);
    const g = W(
      f.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((b) => X(b, e.selectionProfile.scanTimeframe)).filter((b) => b <= e.to).filter((b) => ri(b, e.selectionProfile)), m = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const b of g) {
      const C = te(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      m.previousEvaluationAsOf != null && b - m.previousEvaluationAsOf > C && (m.previousGate = null, m.falseSince = null);
      const R = b >= e.from, E = e.selectionProfile.moveDetectors.map(
        (P) => Or(P, f, b, e.selectionProfile.scanTimeframe)
      );
      if (R)
        for (const P of E)
          for (const I of P.observations)
            n.set(I.requestId, I);
      const x = ti(
        E.map((P) => P.result),
        e.selectionProfile.detectorCombination
      ), S = $r(
        f,
        b,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), y = Vr(
        f,
        b,
        e.selectionProfile,
        E,
        S,
        e.universeHistory ?? []
      ), A = y.results, k = A.every((P) => P.passed), q = x.passed && k, z = !k || x.evaluable;
      if (R)
        for (const P of y.evidence)
          P.schemaVersion === Ye && n.set(P.requestId, P);
      const ne = Ur(
        f,
        b,
        E.map((P) => P.result),
        A,
        y.evidence,
        x.passed,
        k,
        q,
        z
      );
      if (R && r.push(ne), m.activeEpisode && b >= m.activeEpisode.activeUntil && (m.activeEpisode.detectedAt >= e.from && m.activeEpisode.activeUntil <= e.to && i.push(
        Me(
          m.activeEpisode,
          m.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), m.activeEpisode = null), z && !q ? (m.falseSince ?? (m.falseSince = b), !m.armed && b - m.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (R && ((c = m.blockedEpisode) == null ? void 0 : c.detectedAt) != null && m.blockedEpisode.detectedAt >= e.from && i.push(
        Me(m.blockedEpisode, b, "reset", "radarGateReset", "armed")
      ), m.activeEpisode = null, m.blockedEpisode = null, m.armed = !0)) : m.falseSince = null, z && q && m.previousGate === !1 && m.armed) {
        const P = Dr({
          series: f,
          asOf: b,
          profile: e.selectionProfile,
          strategyProfile: t,
          detectorEvaluations: E,
          selectionEvaluation: ne,
          hardGateEvidence: y.evidence,
          venueEligibility: S,
          lifecycleHistory: ((l = e.lifecycleHistory) == null ? void 0 : l[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (R) {
          o.push(P), i.push(
            Me(P, b, "active", "detected", "blockedUntilReset")
          );
          const I = Br(P, f, e.selectionProfile, t);
          s.push(I);
          for (const it of P.contextObservations)
            n.set(it.requestId, it);
        }
        m.activeEpisode = P, m.blockedEpisode = P, m.armed = !1;
      }
      m.previousGate = z ? q : null, m.previousEvaluationAsOf = b;
    }
  }
  return M({
    schemaVersion: Er,
    selectionProfileRef: Zt(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(Yt),
    gateEvaluations: r.sort(ci),
    episodes: o.sort(li),
    episodeStatusObservations: i.sort(ui),
    replayCaseManifests: s.sort((u, d) => u.id.localeCompare(d.id))
  });
}
function Or(e, t, n, r) {
  return e.type === "rollingTroughRunup" ? Mr(e, t, n, r) : e.type === "elapsedWindowReturn" ? Fr(e, t, n, r) : e.type === "maximumWindowReturn" ? Lr(e, t, n, r) : jt(e, t, n);
}
function Mr(e, t, n, r) {
  const o = W(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, a = (i ? o.filter(
    (m) => m.bucket >= i.bucket - e.lookbackSeconds && m.bucket <= i.bucket && i.bucket - m.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((m, b) => O(b.c) && (!m || b.c < m.c || b.c === m.c && b.bucket < m.bucket) ? b : m, null), c = i && a && O(a.c) ? (i.c / a.c - 1) * 100 : null, l = Wr(o, i, e), u = Wt(l, c, e.minimumSampleCount), d = [];
  i || d.push($("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a || d.push($("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const f = L(e), h = ue({
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
    historyCandles: Je(o, i, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: f,
    notes: [...d, ...u.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && be(h.percentile, e.minimumPercentile) && be(h.zScore, e.minimumZScore) && h.sampleCount >= e.minimumSampleCount, g = a ? qr(t, n, a, h) : null;
  return {
    result: Ie(
      e,
      v,
      [h],
      v ? h.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${Ee(c)} versus ${Ee(e.minimumRunupPct)} minimum`
    ),
    observations: [h],
    anchor: g
  };
}
function Fr(e, t, n, r) {
  const o = zt(e, t, n, r), i = Xt(o, e);
  return {
    result: Ie(
      e,
      i,
      [o],
      i ? o.observationId : null,
      o.value == null ? "Elapsed return unavailable" : `${Jt(e.windowSeconds)} return ${Ee(o.value)}`
    ),
    observations: [o],
    anchor: null
  };
}
function Lr(e, t, n, r) {
  const o = [...new Set(e.windowsSeconds)].sort((u, d) => u - d).map(
    (u) => zt(
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
    (u, d) => (d.value ?? -1 / 0) - (u.value ?? -1 / 0) || (u.window ?? 1 / 0) - (d.window ?? 1 / 0)
  )[0] ?? null, s = W(t.candlesByTimeframe[r] ?? [], r, n), a = ue({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "maximum_window_return",
    metricVersion: "maximum-window-return.1",
    window: (i == null ? void 0 : i.window) ?? null,
    logicalWindow: null,
    referenceTime: (i == null ? void 0 : i.referenceTime) ?? null,
    referenceValue: (i == null ? void 0 : i.referenceValue) ?? null,
    value: (i == null ? void 0 : i.value) ?? null,
    unit: "percent",
    percentile: (i == null ? void 0 : i.percentile) ?? null,
    zScore: (i == null ? void 0 : i.zScore) ?? null,
    sampleCount: (i == null ? void 0 : i.sampleCount) ?? 0,
    historyCandles: Je(
      s,
      s.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: L(e),
    notes: i ? i.dataQualityNotes : [$("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Xt(a, e), l = [...o, a];
  return {
    result: Ie(
      e,
      c,
      l,
      c ? (i == null ? void 0 : i.observationId) ?? null : null,
      (i == null ? void 0 : i.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Jt(i.window ?? 0)} return ${Ee(i.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function jt(e, t, n) {
  const r = e.analysisTimeframe, o = W(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = Xr(o, e.emaPeriod).at(-1) ?? null, a = Kr(o, e.atrPeriod).at(-1) ?? null, c = i && s != null && a != null && a > 0 ? (i.c - s) / a : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  i || u.push($("NO_COMPLETED_CANDLE", "error", `No completed ${r} candle exists at cutoff`)), (o.length < l || c == null) && u.push(
    $(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${r} candles`
    )
  );
  const d = ue({
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
    notes: et(u)
  }), f = c != null && o.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: Ie(
      e,
      f,
      [d],
      f ? d.observationId : null,
      c == null ? "EMA/ATR displacement unavailable" : `EMA displacement ${c.toFixed(2)} ATR`
    ),
    observations: [d],
    anchor: null
  };
}
function zt(e, t, n, r) {
  const o = W(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = i ? Ze(o, i.bucket - e.windowSeconds) : null, a = i && s ? i.bucket - e.windowSeconds - s.bucket : null, c = a != null && e.maximumReferenceStalenessSeconds != null && a > e.maximumReferenceStalenessSeconds, l = i && s && !c && O(s.c) ? (i.c / s.c - 1) * 100 : null, u = Qr(o, i, e), d = Wt(u, l, e.minimumSampleCount), f = [...d.notes];
  return i || f.push($("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s ? c && f.push($("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : f.push($("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), ue({
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
    percentile: d.percentile,
    zScore: d.zScore,
    sampleCount: u.length,
    historyCandles: Je(
      o,
      i,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: L(e),
    notes: et(f)
  });
}
function Dr(e) {
  var A;
  const t = e.detectorEvaluations.filter((k) => k.result.passed), n = Ve(
    t.flatMap(
      (k) => k.observations.filter(
        (q) => q.observationId === k.result.winningObservationId
      )
    )
  ), r = ((A = t.find((k) => k.anchor)) == null ? void 0 : A.anchor) ?? null, o = W(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), i = vt(e.series, e.asOf, e.profile.scanTimeframe, 86400), s = vt(e.series, e.asOf, e.profile.scanTimeframe, 172800), a = Gt(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((k) => k.observations).find((k) => k.metricCode === "ema_atr_displacement") ?? null ?? jt(
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
  ).observations[0], u = Gr(
    e.structureHistory,
    e.series,
    e.asOf
  ), d = Ve([
    ...n,
    i,
    s,
    a,
    l
  ]), f = t[0], h = f ? n.find(
    (k) => k.observationId === f.result.winningObservationId
  ) ?? n[0] ?? null : null, v = Hr(
    o,
    r,
    (f == null ? void 0 : f.result.detectorId) ?? "unknown",
    h,
    i,
    s,
    a,
    l,
    u
  ), g = Yr(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), m = g != null && g.candidate ? g : null, b = (m == null ? void 0 : m.candidate) ?? null, C = (m == null ? void 0 : m.asOf) ?? null, R = m && C != null ? He({
    logicalObjectId: (b == null ? void 0 : b.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: m.updatedTs,
    knownAt: C,
    snapshot: m
  }) : null, E = b ? He({
    logicalObjectId: b.id,
    objectType: "SetupCandidateEpisode",
    eventTime: b.detectionEventTime,
    knownAt: C ?? b.detectedAt,
    snapshot: b
  }) : null, x = {
    schemaVersion: Tr,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((k) => k.result.detectorId),
    triggeringObservations: n,
    selectionGateEvaluationId: e.selectionEvaluation.id,
    hardGateResults: e.selectionEvaluation.hardGateResults,
    hardGateEvidence: e.hardGateEvidence,
    contextObservations: d,
    selectionAnchor: r,
    pathContext: v,
    initialLifecycleCandidateId: (b == null ? void 0 : b.id) ?? null,
    initialLifecycleCandidateRef: E,
    initialLifecycleState: (m == null ? void 0 : m.state) ?? null,
    initialLifecycleStateRef: R,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: et([
      ...d.flatMap((k) => k.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, S = `radar-episode:${H({
    symbol: x.symbol,
    source: x.source,
    profileHash: x.selectionProfileHash,
    detectedAt: x.detectedAt,
    triggeringObservationIds: n.map((k) => k.observationId)
  })}`, y = { ...x, id: S, logicalObjectId: S };
  return M({
    ...y,
    observationId: `radar-episode-observation:${H(y)}`
  });
}
function Br(e, t, n, r) {
  const o = Object.keys(t.candlesByTimeframe).filter(
    (c) => W(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(nt), i = Object.fromEntries(
    o.map((c) => {
      var u, d;
      const l = W(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((d = l.at(-1)) == null ? void 0 : d.bucket) ?? null,
          completedThrough: l.at(-1) ? X(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), s = o.filter(
    (c) => i[c].completedCandleCount > 0
  ), a = {
    schemaVersion: Rr,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Zt(n),
    lifecycleVersion: G,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: s,
    preRollRequirements: ei(n),
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
function vt(e, t, n, r) {
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
  }, i = W(e.candlesByTimeframe[n] ?? [], n, t), s = i.at(-1) ?? null, a = s ? Ze(i, s.bucket - r) : null, c = s && a && O(a.c) ? (s.c / a.c - 1) * 100 : null, l = c == null ? [$("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return ue({
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
function Gt(e, t, n) {
  var d;
  const r = n.scanTimeframe, o = W(e.candlesByTimeframe[r] ?? [], r, t), i = o.at(-1) ?? null, s = i ? o.filter((f) => f.bucket > i.bucket - n.liquidityPolicy.windowSeconds) : [], a = s.map(
    (f) => J(f.v_quote) ? f.v_quote : J(f.v_base) ? f.v_base * f.c : null
  ), c = a.length > 0 && a.every((f) => f != null), l = c ? a.reduce((f, h) => f + (h ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return ue({
    series: e,
    asOf: t,
    timeframe: r,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((d = s[0]) == null ? void 0 : d.bucket) ?? null,
    referenceValue: null,
    value: l,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: s.length,
    historyCandles: s,
    configHash: L(u),
    notes: c ? [] : [$("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function ue(e) {
  var u, d;
  const t = ((u = e.historyCandles[0]) == null ? void 0 : u.bucket) ?? null, n = ((d = e.historyCandles.at(-1)) == null ? void 0 : d.bucket) ?? null, r = e.timeframe && e.historyCandles.at(-1) ? X(e.historyCandles.at(-1), e.timeframe) : e.asOf, o = e.timeframe ? e.historyCandles.reduce(
    (f, h) => Math.max(f, ce(h, e.timeframe)),
    r
  ) : e.asOf, i = L(
    e.historyCandles.map((f) => ({
      bucket: f.bucket,
      ts: f.ts,
      o: f.o,
      h: f.h,
      l: f.l,
      c: f.c,
      vBase: J(f.v_base) ? f.v_base : null,
      vQuote: J(f.v_quote) ? f.v_quote : null,
      ver: J(f.ver) ? f.ver : null,
      knownAt: e.timeframe ? ce(f, e.timeframe) : null
    }))
  ), s = `radar-metric:${H({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.logicalWindow === void 0 ? e.window : e.logicalWindow,
    configHash: e.configHash
  })}`, a = {
    schemaVersion: Ye,
    logicalObjectId: s,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    effectiveAsOf: r,
    knownAt: o,
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
    inputHash: i,
    dataQualityNotes: e.notes
  }, c = `radar-observation:${H(a)}`, l = e.asOf;
  return M({
    ...a,
    observationId: c,
    requestId: `radar-observation-request:${H({ observationId: c, requestedAsOf: l })}`,
    requestedAsOf: l
  });
}
function Hr(e, t, n, r, o, i, s, a, c) {
  const l = t ? e.find((m) => m.bucket === t.timestamp) ?? null : null, d = (l ? e.filter((m) => m.bucket <= l.bucket) : []).reduce((m, b) => O(b.c) && (!m || b.c > m.c || b.c === m.c && b.bucket < m.bucket) ? b : m, null), f = e.at(-1) ?? null, h = t && d && O(d.c) ? (t.price / d.c - 1) * 100 : null, v = t && d && f && d.c > t.price ? (f.c - t.price) / (d.c - t.price) : null, g = t && h != null && h < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: o.value,
    net48hReturnPct: i.value,
    triggeringLocalImpulseReturnPct: (r == null ? void 0 : r.unit) === "percent" ? r.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (r == null ? void 0 : r.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (d == null ? void 0 : d.c) ?? null,
    priorPeakTime: (d == null ? void 0 : d.bucket) ?? null,
    priorDrawdownPct: h,
    recoveryFraction: v,
    currentAtrDisplacement: a.value,
    triggeringPercentile: (r == null ? void 0 : r.percentile) ?? null,
    triggeringZScore: (r == null ? void 0 : r.zScore) ?? null,
    quoteNotional: s.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([m, b]) => [
        m,
        typeof b.snapshot == "object" && b.snapshot != null && !Array.isArray(b.snapshot) && typeof b.snapshot.state == "string" ? b.snapshot.state : "unknown"
      ])
    ),
    contextTags: g
  };
}
function Vr(e, t, n, r, o, i) {
  const s = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const f = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return de(c, f, f ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const f = Ve(r.flatMap((v) => v.observations));
        s.push(...f);
        const h = !r.some(
          (v) => v.observations.some(
            (g) => g.dataQualityNotes.some((m) => m.severity === "error")
          )
        );
        return de(
          c,
          h,
          h ? "Required metrics available" : "Required metric data unavailable",
          f
        );
      }
      if (c === "executionVenueEligibility") {
        s.push(o);
        const f = ni(o.status, n.executionVenuePolicy.mode);
        return de(
          c,
          f,
          `Execution venue ${o.status}`,
          [o]
        );
      }
      if (c === "selectedUniverse") {
        const f = Jr(i, e, t);
        return f && s.push(f), de(
          c,
          (f == null ? void 0 : f.included) === !0,
          f ? f.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          f ? [f] : []
        );
      }
      const l = Gt(e, t, n);
      s.push(l);
      const u = n.liquidityPolicy.minimumQuoteNotional, d = u == null || l.value == null ? u == null || n.liquidityPolicy.missingData === "warn" : l.value >= u;
      return de(
        c,
        d,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: ai(s)
  };
}
function de(e, t, n, r) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(r.map((o) => o.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        r.flatMap(
          (o) => o.schemaVersion === Ye ? [o.requestId] : []
        )
      )
    ].sort()
  };
}
function $r(e, t, n, r) {
  const o = n.executionVenuePolicy.intendedVenue ?? "ignored", i = [...r].filter(
    (a) => a.symbol.toUpperCase() === e.symbol.toUpperCase() && a.executionVenue.toLowerCase() === o.toLowerCase() && a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo >= t)
  );
  for (const a of i)
    if (Ut(a) !== a.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const s = tt(
    i,
    (a) => [a.effectiveFrom, a.knownAt],
    "execution-venue eligibility"
  );
  return s || _r({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: o,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      $(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function qr(e, t, n, r) {
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
function Me(e, t, n, r, o) {
  const i = {
    schemaVersion: xr,
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
function Ur(e, t, n, r, o, i, s, a, c) {
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
function Ie(e, t, n, r, o) {
  var s;
  const i = t || n.every(
    (a) => a.dataQualityNotes.every((c) => c.severity !== "error")
  );
  return {
    detectorId: e.id,
    detectorType: e.type,
    evaluable: i,
    passed: t,
    observationIds: n.map((a) => a.observationId),
    observationRequestIds: n.map((a) => a.requestId),
    winningObservationId: r,
    winningObservationRequestId: ((s = n.find((a) => a.observationId === r)) == null ? void 0 : s.requestId) ?? null,
    explanation: o
  };
}
function W(e, t, n) {
  return jr(Qt(e, t, n), t);
}
function Qt(e, t, n) {
  const r = te(t);
  return e.filter((o) => {
    if (!Number.isFinite(o.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (o.bucket + r > n) return !1;
    if (o.knownAt != null && !Number.isFinite(o.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${o.bucket}`);
    return ce(o, t) <= n;
  });
}
function jr(e, t) {
  const n = te(t), r = /* @__PURE__ */ new Map();
  for (const o of [...e].sort((i, s) => i.bucket - s.bucket || i.ts - s.ts)) {
    if (!si(o) || o.bucket % n !== 0 || Math.floor(o.ts / n) * n !== o.bucket)
      throw new RangeError(`Invalid candle for bucket ${o.bucket}`);
    const i = o.bucket + n, s = ce(o, t);
    if (s < i)
      throw new RangeError(`Candle revision predates close for bucket ${o.bucket}`);
    const a = r.get(o.bucket);
    if (a) {
      const c = ce(a, t);
      if (c === s && yt(a, t) !== yt(o, t))
        throw new Error(
          `Conflicting candle revisions for bucket ${o.bucket} at ${s}`
        );
      if (c > s) continue;
    }
    r.set(o.bucket, o);
  }
  return [...r.values()].sort((o, i) => o.bucket - i.bucket);
}
function zr(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([r, o]) => (te(r), [r, Qt(o, r, t)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function Gr(e, t, n) {
  const r = e.filter(
    (i) => i.symbol.toUpperCase() === t.symbol.toUpperCase() && i.source === t.source && i.knownAt <= n
  );
  for (const i of r)
    if (qt(i) !== i.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const o = /* @__PURE__ */ new Map();
  for (const i of new Set(r.map((s) => s.timeframe))) {
    const s = tt(
      r.filter((a) => a.timeframe === i),
      (a) => [a.knownAt, a.eventTime],
      `market-structure ${i}`
    );
    s && o.set(i, s);
  }
  return Object.fromEntries(
    [...o.entries()].sort(([i], [s]) => nt(i, s)).map(
      ([i, s]) => [
        i,
        He({
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
function yt(e, t) {
  return D({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: J(e.v_base) ? e.v_base : null,
    vQuote: J(e.v_quote) ? e.v_quote : null,
    ver: J(e.ver) ? e.ver : null,
    knownAt: ce(e, t)
  });
}
function ce(e, t) {
  return e.knownAt ?? X(e, t);
}
function Ze(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function Qr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = Ze(e, i.bucket - n.windowSeconds);
    if (!s || !O(s.c)) continue;
    const a = i.bucket - n.windowSeconds - s.bucket;
    n.maximumReferenceStalenessSeconds != null && a > n.maximumReferenceStalenessSeconds || o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function Wr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = e.filter(
      (a) => a.bucket <= i.bucket && a.bucket >= i.bucket - n.lookbackSeconds && i.bucket - a.bucket <= n.maximumTroughAgeSeconds && O(a.c)
    ).sort((a, c) => a.c - c.c || a.bucket - c.bucket)[0];
    s && o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function Wt(e, t, n) {
  const r = [];
  if (e.length < n && r.push(
    $(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: r };
  const o = e.filter((l) => l <= t).length / e.length * 100, i = e.reduce((l, u) => l + u, 0) / e.length, s = e.reduce((l, u) => l + (u - i) ** 2, 0) / e.length, a = Math.sqrt(s), c = a > 0 ? (t - i) / a : null;
  return { percentile: o, zScore: c, notes: r };
}
function Je(e, t, n) {
  return t ? e.filter((r) => r.bucket >= t.bucket - n) : [];
}
function Xt(e, t) {
  return e.value != null && be(e.value, t.minimumReturnPct) && be(e.percentile, t.minimumPercentile) && be(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function Xr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let r = e.slice(0, t).reduce((i, s) => i + s.c, 0) / t;
  n[t - 1] = r;
  const o = 2 / (t + 1);
  for (let i = t; i < e.length; i += 1)
    r = e[i].c * o + r * (1 - o), n[i] = r;
  return n;
}
function Kr(e, t) {
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
function Yr(e, t, n, r) {
  const o = e.filter(
    (a) => a.candidate != null && a.asOf != null && a.asOf <= n
  );
  for (const a of o)
    Zr(a, t, n, r);
  const i = Math.max(...o.map((a) => a.asOf ?? -1 / 0)), s = o.filter((a) => a.asOf === i);
  if (new Set(s.map((a) => D(a))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${i}`);
  return s[0] ?? null;
}
function Zr(e, t, n, r) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== G || e.lifecycleVersion !== r.lifecycleVersion || e.lifecycleConfigHash !== r.lifecycleConfigHash || e.executionTimeframe !== r.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  V(e.asOf, n, "lifecycle asOf"), V(e.updatedTs, n, "lifecycle updatedTs"), V(e.stateSince, n, "lifecycle stateSince");
  const o = e.candidate;
  if (o) {
    const i = [t.source, t.dataOrigin].filter((a) => a != null).some((a) => a.toLowerCase() === o.source.toLowerCase()), s = !o.venue.trim() || o.venue.toLowerCase() === t.source.toLowerCase();
    if (o.symbol.toUpperCase() !== t.symbol.toUpperCase() || !i || !s || o.setupFamily !== e.setupFamily || o.lifecycleVersion !== e.lifecycleVersion || o.lifecycleConfigHash !== e.lifecycleConfigHash || o.executionTimeframe !== r.timeframeRoles.executionTimeframe)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [a, c] of [
      ["candidate detectedAt", o.detectedAt],
      ["candidate detectionEventTime", o.detectionEventTime],
      ["candidate episodeHighTime", o.episodeHighTime],
      ["candidate stateSince", o.stateSince],
      ["candidate terminalAt", o.terminalAt]
    ])
      V(c, n, a);
    for (const a of o.initialMtfContext)
      V(a.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const i of e.evidence)
    if (V(i.eventTime, n, "lifecycle evidence eventTime"), V(i.knownAt, n, "lifecycle evidence knownAt"), i.knownAt < i.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const i of e.transitions)
    V(i.knownAt, n, "lifecycle transition knownAt");
  for (const [i, s] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (s && (V(s.eventTime, n, `${i} eventTime`), V(s.knownAt, n, `${i} knownAt`), s.knownAt < s.eventTime))
      throw new Error(`${i} knownAt precedes eventTime`);
  for (const i of e.confluence)
    if (V(i.eventTime, n, "lifecycle confluence eventTime"), V(i.knownAt, n, "lifecycle confluence knownAt"), i.eventTime != null && i.knownAt != null && i.knownAt < i.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function V(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function Jr(e, t, n) {
  const r = [...e].filter(
    (o) => o.symbol.toUpperCase() === t.symbol.toUpperCase() && o.source === t.source && o.knownAt <= n && o.effectiveFrom <= n && (o.effectiveTo == null || o.effectiveTo >= n)
  );
  for (const o of r)
    if ($t(o) !== o.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return tt(
    r,
    (o) => [o.effectiveFrom, o.knownAt],
    "universe membership"
  );
}
function ei(e) {
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
  return [...t.entries()].sort(([r], [o]) => nt(r, o)).map(([r, o]) => ({
    timeframe: r,
    minimumDurationSeconds: o.duration,
    minimumBars: o.bars,
    purposes: [...o.purposes].sort()
  }));
}
function ti(e, t) {
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
function ni(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function ri(e, t) {
  const n = te(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function N(e) {
  throw new RangeError(e);
}
function Kt(e) {
  var n;
  e.schemaVersion !== Ht && N("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && N("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && N("Only impulse_fade_v1 radar profiles are supported");
  try {
    te(e.scanTimeframe);
  } catch {
    N("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && N("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && N("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || N("At least one move detector is required"), new Set(e.moveDetectors.map((r) => r.id)).size !== e.moveDetectors.length && N("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && N("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((r) => !t.has(r)) && N("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || N("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && N("atLeast detector count must be between one and the detector count"), (!O(e.episodeExpiry.maximumAgeSeconds) || !O(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && N("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((r) => !r.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !O(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && N("Radar profile policies are invalid");
  for (const r of e.moveDetectors) ii(r);
}
function ii(e) {
  if (e.id.trim() || N("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || N(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && N(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!rt(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && N(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!O(e.historyLookbackSeconds) || !Fe(e.minimumPercentile, 0, 100) || !Fe(e.minimumZScore)) && N(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!O(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !O(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && N(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!Fe(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && N(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !O(e.windowSeconds) && N(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !O(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && N(`Detector ${e.id} requires unique positive windows`);
}
function oi(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Vt(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (Kt(n), e.strategyProfile) {
    if (Ke(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: r, ...o } = e.strategyProfile;
    Dt(o);
  }
}
function Fe(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function be(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function si(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && O(e.o) && O(e.h) && O(e.l) && O(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && ke(e.v_base) && ke(e.v_quote) && ke(e.ver) && ke(e.knownAt);
}
function ke(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function O(e) {
  return Number.isFinite(e) && e > 0;
}
function J(e) {
  return e != null && Number.isFinite(e);
}
function $(e, t, n) {
  return { code: e, severity: t, message: n };
}
function et(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Ve(e) {
  return [...new Map(e.map((t) => [t.requestId, t])).values()].sort(Yt);
}
function ai(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function tt(e, t, n) {
  if (!e.length) return null;
  const r = [...e].sort((a, c) => {
    const l = t(a), u = t(c);
    for (let d = 0; d < Math.max(l.length, u.length); d += 1) {
      const f = (l[d] ?? -1 / 0) - (u[d] ?? -1 / 0);
      if (f !== 0) return f;
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
function Yt(e, t) {
  return e.requestedAsOf - t.requestedAsOf || e.observationId.localeCompare(t.observationId) || e.requestId.localeCompare(t.requestId);
}
function ci(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function li(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function ui(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function nt(e, t) {
  return te(e) - te(t) || e.localeCompare(t);
}
function rt(e) {
  return /^[1-9]\d*[mhd]$/.test(e) && O(Se(e));
}
function te(e) {
  if (!rt(e))
    throw new RangeError(`Invalid radar timeframe ${e}`);
  return Se(e);
}
function Zt(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function Ee(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Jt(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function H(e) {
  return L(e).slice(8);
}
function Ji(e) {
  return D(e);
}
const fi = "linear-quote-perpetual-risk.1", di = "sizing-result.1", mi = "trade-plan.1", hi = "decision-record.1";
function en(e) {
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
  ].some((I) => !Number.isFinite(I) || I <= 0) && t.push(ie("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(ie("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && w(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!Te(e.intendedEntryPrice, e.venueRules.priceTick) || !Te(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (I) => !Te(I.targetPrice, e.venueRules.priceTick)
  )) && w(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !Te(e.leveragePolicy.leverage, e.venueRules.leverageStep) && w(
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
  ), (o && (!U(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!U(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && w(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (I) => !Number.isFinite(I) || I < 0
  ) && w(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && w(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const s = i ? e.riskRequest.fixedRiskAmount : o ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (s == null || !Number.isFinite(s) || s <= 0) && w(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), yi(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const a = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = U(a) ? a : null, l = U(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && w(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const d = s != null && u != null && u > 0 ? s / u : null;
  let f = d == null ? null : bt(d, e.venueRules.quantityStep);
  if (f != null && s != null && u != null)
    for (; f > 0 && f * u > s + Math.max(1e-10, s * 1e-12); )
      f = bt(
        f - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const h = f != null && f > 0 ? f : null, v = h == null ? null : h * e.intendedEntryPrice, g = h == null || c == null ? null : h * c * e.executionAssumptions.entryFeeRate, m = h == null || l == null ? null : h * l * e.executionAssumptions.stopExitFeeRate, b = h == null || u == null ? null : h * u;
  (h == null || h < e.venueRules.minQuantity) && w(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && w(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const C = e.riskRequest.maximumNotional;
  C != null && v != null && v > C && w(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${C}`
  );
  const R = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, E = e.accountState.availableBalance == null ? R : Math.min(R, e.accountState.availableBalance), x = v != null && E > 0 ? v / E : null, S = Ai(
    e.leveragePolicy,
    x,
    e.venueRules.leverageStep
  );
  S != null && S > e.venueRules.maxLeverage && w(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${S} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const y = v != null && S != null && S > 0 ? v / S : null;
  y != null && y > R + 1e-10 && w(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), y != null && e.accountState.availableBalance != null && y > e.accountState.availableBalance + 1e-10 && w(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const A = h != null && c != null && l != null ? h * (l - c) : null, k = bi(
    e.targets,
    h,
    c,
    A,
    b,
    e.executionAssumptions
  ), q = Re(
    k.map((I) => I.grossReward * I.positionFraction)
  ), z = Re(
    k.map((I) => I.netProjectedReward * I.positionFraction)
  ), ne = Re(
    k.map(
      (I) => I.weightedGrossRContribution == null ? null : I.weightedGrossRContribution
    )
  ), P = Re(
    k.map(
      (I) => I.weightedRContribution == null ? null : I.weightedRContribution
    )
  );
  return M({
    schemaVersion: di,
    sizingModelVersion: fi,
    side: e.side,
    riskBudget: s,
    rawQuantity: d,
    roundedQuantity: h,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: v,
    estimatedEntryFee: g,
    estimatedStopFee: m,
    projectedLossAtStop: b,
    projectedLossPercentEquity: b == null || e.accountState.equity <= 0 ? null : b / e.accountState.equity * 100,
    selectedLeverage: S,
    minimumRequiredLeverage: x,
    initialMargin: y,
    marginPercentEquity: y == null || e.accountState.equity <= 0 ? null : y / e.accountState.equity * 100,
    marginPercentAvailableBalance: y == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : y / e.accountState.availableBalance * 100,
    targetOutcomes: k,
    weightedGrossReward: q,
    weightedProjectedReward: z,
    weightedGrossR: ne,
    weightedProjectedR: P,
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
function eo(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = en({
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
    schemaVersion: mi,
    snapshotId: e.snapshot.id,
    setupFamily: Z,
    lifecycleVersion: G,
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
  }, r = { ...n, id: e.id ?? tn(n) }, o = vi({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return M({ ...r, complianceResult: o });
}
function vi(e) {
  var f, h, v;
  const { strategyProfile: t, snapshot: n, plan: r } = e, o = [...r.sizingResult.hardErrors], i = [], s = [...r.sizingResult.warnings], a = en({
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
  (Ke(t) !== t.profileHash || Bt(n) !== n.id || tn(r) !== r.id || D(a) !== D(r.sizingResult)) && w(
    o,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (f = n.candidateEpisode) != null && f.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && w(
    o,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== Lt || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || D(r.executionAssumptions) !== D(t.executionAssumptions)) && w(
    o,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(r.entryPlan.orderPlanType) || w(
    i,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${r.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(r.stopPlan.derivationType) || w(
    i,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${r.stopPlan.derivationType} is not permitted`
  );
  for (const g of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(g.derivationType) || w(
      i,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${g.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && w(
    i,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = r.targetPlans.reduce(
    (g, m) => g + m.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && w(
    o,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), Si(n, r, o), wi(r, o), gi(n, t, i), pi(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((h = n.candidateEpisode) == null ? void 0 : h.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && w(
    i,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), r.sizingResult.initialMargin != null && r.sizingResult.initialMargin > r.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && w(
    i,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && r.sizingResult.grossNotional != null && r.sizingResult.grossNotional > t.riskPolicy.maximumNotional && w(
    i,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && r.sizingResult.weightedProjectedR != null && r.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && w(
    i,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${r.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), r.sizingResult.projectedLossAtStop != null && r.sizingResult.projectedLossAtStop > r.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && w(
    i,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = i.some((g) => g.code === "NO_ACTIVE_CANDIDATE"), u = ((v = r.discretionaryOverrideReason) == null ? void 0 : v.trim()) || null;
  r.status === "finalized" && i.length > 0 && !l && !u && w(
    o,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let d;
  return o.length > 0 ? d = "InvalidPlan" : l ? d = "OutOfStrategy" : i.length === 0 ? d = "Compliant" : u ? d = "Overridden" : d = "OutOfStrategy", M({
    classification: d,
    hardErrors: o,
    strategyViolations: i,
    warnings: s,
    overrideReason: u
  });
}
function to(e) {
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
    schemaVersion: hi,
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
function yi(e, t, n, r) {
  (!e.length || e.some((i) => i.targetPrice >= t)) && w(r, "NO_VALID_TARGET", "Every short target must be below entry");
  const o = e.reduce((i, s) => i + s.positionFraction, 0);
  (e.some(
    (i) => !Number.isFinite(i.positionFraction) || i.positionFraction <= 0
  ) || Math.abs(o - 1) > n) && w(
    r,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function bi(e, t, n, r, o, i) {
  return t == null || n == null ? [] : e.map((s) => {
    const a = s.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), c = t * (n - a), l = t * n * i.entryFeeRate, u = t * a * i.targetExitFeeRate, d = c - l - u, f = r != null && r > 0 ? c / r : null, h = o != null && o > 0 ? d / o : null;
    return {
      targetId: s.id,
      targetPrice: s.targetPrice,
      effectiveTargetPrice: a,
      positionFraction: s.positionFraction,
      grossReward: c,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: d,
      grossR: f,
      projectedR: h,
      weightedGrossRContribution: f == null ? null : f * s.positionFraction,
      weightedRContribution: h == null ? null : h * s.positionFraction
    };
  });
}
function gi(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    w(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (w(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && w(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && w(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const o = e.lifecycleEvidence.some(
    (i) => i.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !o && w(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && w(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function pi(e, t, n) {
  var c;
  const r = t.entryPolicy.requiredDataQuality, o = r.candidateMetricsRequired && e.candidateMetrics == null, i = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, s = r.minimumHistoryCoverageRatio != null && (i == null || i < r.minimumHistoryCoverageRatio), a = e.dataQualityNotes.some(
    (l) => r.rejectedNoteSeverities.includes(l.severity)
  );
  (o || s || a) && w(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function Si(e, t, n) {
  const r = new Map(
    gr(e).map((i) => [i.id, i])
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
      w(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    i.reference.knownAt > e.effectiveAsOf && w(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${i.id} was not known at the decision cutoff`
    );
    const s = r.get(i.id);
    s ? D(s) !== D(i.reference) && w(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${i.id} differs from the frozen snapshot object`
    ) : w(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${i.id} is absent from the decision snapshot`
    );
  }
}
function wi(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && w(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const o = e.stopPlan.referenceLevel;
  if (o && e.stopPlan.derivationType !== "manual") {
    const i = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? o.rangeHigh ?? o.price : o.price, { basisPoints: s, atrFraction: a, atrValue: c } = e.stopPlan.buffer;
    let l = i;
    s != null && a != null ? w(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : s != null ? l = i * (1 + s / 1e4) : a != null && (U(c ?? 0) ? l = i + a * (c ?? 0) : w(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && w(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const i of e.targetPlans) {
    const s = i.referenceLevel;
    if (!s || i.derivationType === "manual" || i.derivationType === "fixedRMultiple")
      continue;
    (i.derivationType === "supportZone" ? i.targetPrice >= (s.rangeLow ?? s.price) - n && i.targetPrice <= (s.rangeHigh ?? s.price) + n : Math.abs(i.targetPrice - s.price) <= n + 1e-12) || w(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${i.id} does not match its frozen reference`
    );
  }
}
function Ai(e, t, n) {
  return e.mode === "manual" ? U(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, ki(t, n));
}
function tn(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${L(r).slice(8)}`;
}
function bt(e, t) {
  if (!U(e) || !U(t)) return 0;
  const n = nn(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function ki(e, t) {
  if (!U(e) || !U(t)) return e;
  const n = nn(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function nn(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function Te(e, t) {
  if (!Number.isFinite(e) || !U(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Re(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function U(e) {
  return Number.isFinite(e) && e > 0;
}
function ie(e, t) {
  return { code: e, message: t };
}
function w(e, t, n) {
  e.some((r) => r.code === t) || e.push(ie(t, n));
}
export {
  Vi as CANDLE_TIMESTAMP_SEMANTICS,
  hi as DECISION_RECORD_SCHEMA_VERSION,
  Lt as DECISION_SNAPSHOT_SCHEMA_VERSION,
  br as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Pr as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  Yi as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  me as IMPULSE_FADE_CANDIDATE_GATE,
  mn as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  G as IMPULSE_FADE_LIFECYCLE_VERSION,
  mr as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  hr as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  Z as IMPULSE_FADE_SETUP_FAMILY,
  Tr as RADAR_EPISODE_SCHEMA_VERSION,
  Ye as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  Er as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  Ht as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  xr as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  Cr as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  Ir as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  Rr as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  fi as SIZING_MODEL_VERSION,
  di as SIZING_RESULT_SCHEMA_VERSION,
  dr as STRATEGY_PROFILE_SCHEMA_VERSION,
  mi as TRADE_PLAN_SCHEMA_VERSION,
  Ci as appendSyntheticCandle,
  ae as bucketStart,
  en as calculateLinearPerpetualSizing,
  X as candleCloseTime,
  ot as candleToBytes,
  rn as candlesToBytes,
  L as canonicalHash,
  Ji as canonicalRadarJson,
  D as canonicalSerialize,
  It as computeAnchoredVwapLine,
  qi as computeAnchoredVwapSignals,
  $i as computeAnchoredVwapSnapshot,
  Di as computeAtrLine,
  Oi as computeBollingerBands,
  Ei as computeCloseChangePct,
  Ni as computeEmaLine,
  qe as computeExtensionSnapshot,
  Li as computeMacd,
  ve as computeMarketStructure,
  Cn as computeRelativeCumulativeReturnLine,
  zi as computeRelativeStrengthDivergences,
  Mi as computeRsiLine,
  hn as computeSetupState,
  Ii as computeSmaLine,
  Fi as computeStochRsi,
  Ui as computeStructureActiveLevels,
  ji as computeSupportResistanceZones,
  Pn as computeSupportResistanceZonesFromSwings,
  xn as computeSwingPoints,
  xi as computeViewBounds,
  _i as computeWmaLine,
  to as createDecisionRecord,
  Qi as createDecisionReferenceLevel,
  Wi as createDecisionSnapshot,
  He as createDurableObjectReference,
  _r as createExecutionVenueEligibilityObservation,
  yr as createImpulseFadeResearchProfile,
  Nr as createRadarSelectionProfile,
  Xi as createRadarStructureObservation,
  Dt as createStrategyProfile,
  eo as createTradePlan,
  Ki as createUniverseMembershipObservation,
  vr as decisionReferenceObservationId,
  Bt as decisionSnapshotId,
  gr as decisionSnapshotReferenceLevels,
  Hi as evaluateImpulseFadeSnapshot,
  Bi as evaluateImpulseFadeTimeline,
  vi as evaluateTradePlanCompliance,
  Ut as executionVenueEligibilityObservationId,
  M as immutableJsonClone,
  le as impulseFadeLifecycleConfigHash,
  Gi as lineToBytes,
  Pi as makeSyntheticCandles,
  on as mergeLiveCandle,
  gt as normalizeOhlcvPoint,
  Ti as normalizeRestTimeframe,
  pt as packHistoricalCandles,
  Ri as prependHistoricalCandles,
  Vt as radarSelectionProfileHash,
  qt as radarStructureObservationId,
  Zi as scanRadarEpisodes,
  Ke as strategyProfileHash,
  Se as timeframeToSeconds,
  tn as tradePlanId,
  $t as universeMembershipObservationId
};
