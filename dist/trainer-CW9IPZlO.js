var rs = Object.defineProperty;
var fr = (e) => {
  throw TypeError(e);
};
var as = (e, t, n) => t in e ? rs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var be = (e, t, n) => as(e, typeof t != "symbol" ? t + "" : t, n), xn = (e, t, n) => t.has(e) || fr("Cannot " + n);
var R = (e, t, n) => (xn(e, t, "read from private field"), n ? n.call(e) : t.get(e)), ee = (e, t, n) => t.has(e) ? fr("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), ae = (e, t, n, i) => (xn(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), te = (e, t, n) => (xn(e, t, "access private method"), n);
function C(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r, a = !1) {
    if (r === null) return "null";
    if (typeof r == "string" || typeof r == "boolean")
      return JSON.stringify(r);
    if (typeof r == "number") {
      if (!Number.isFinite(r))
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      return Object.is(r, -0) ? "0" : JSON.stringify(r);
    }
    if (r === void 0) return a ? "null" : void 0;
    if (typeof r != "object")
      throw new TypeError(`Canonical JSON does not support ${typeof r}`);
    if (Object.getPrototypeOf(r) !== Object.prototype && !Array.isArray(r))
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    if (t.has(r)) throw new TypeError("Canonical JSON does not support cycles");
    t.add(r);
    let o;
    return Array.isArray(r) ? o = `[${r.map((s) => n(s, !0) ?? "null").join(",")}]` : o = `{${Object.keys(r).sort().flatMap((c) => {
      const l = n(r[c]);
      return l == null ? [] : [`${JSON.stringify(c)}:${l}`];
    }).join(",")}}`, t.delete(r), o;
  }
  const i = n(e);
  if (i == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return i;
}
function T(e) {
  const t = new TextEncoder().encode(C(e));
  let n = 3421674724, i = 2216829733;
  for (const r of t) {
    i = (i ^ r) >>> 0;
    const a = i * 435;
    n = Math.imul(n, 435) + Math.floor(a / 4294967296) + (i << 8) >>> 0, i = a >>> 0;
  }
  return `fnv1a64:${n.toString(16).padStart(8, "0")}${i.toString(16).padStart(8, "0")}`;
}
function y(e) {
  return ia(JSON.parse(C(e)));
}
function ia(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) ia(t);
    Object.freeze(e);
  }
  return e;
}
const dr = 5;
function fn(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function mi(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const t = Number.parseInt(e, 10), n = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(t) && Number.isSafeInteger(t * n);
}
function F(e) {
  if (!mi(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return fn(e);
}
function $e(e, t) {
  return e.knownAt ?? e.bucket + F(t);
}
function dn(e, t, n) {
  const i = F(t), r = /* @__PURE__ */ new Map(), a = e.filter((o) => {
    if (!Number.isFinite(o.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (o.bucket + i > n) return !1;
    if (o.knownAt != null && !Number.isFinite(o.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${o.bucket}`);
    return $e(o, t) <= n;
  });
  for (const o of [...a].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!ys(o) || o.bucket % i !== 0 || Math.floor(o.ts / i) * i !== o.bucket)
      throw new RangeError(`Invalid candle for bucket ${o.bucket}`);
    const s = $e(o, t);
    if (s < o.bucket + i)
      throw new RangeError(`Candle revision predates close for bucket ${o.bucket}`);
    const c = r.get(o.bucket);
    if (c) {
      const l = $e(c, t);
      if (l === s && yr(c, t) !== yr(o, t))
        throw new Error(`Conflicting candle revisions for bucket ${o.bucket} at ${s}`);
      if (l > s) continue;
    }
    r.set(o.bucket, o);
  }
  return [...r.values()].sort((o, s) => o.bucket - s.bucket);
}
function Fd(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function rt(e, t) {
  return Math.floor(e / t) * t;
}
function ra(e) {
  const t = ca(e);
  if (!t || typeof t != "object") return null;
  const n = t, i = vr(n.ts), r = ye(n.o), a = ye(n.h), o = ye(n.l), s = ye(n.c), c = n.knownAt == null ? void 0 : vr(n.knownAt);
  return i == null || r == null || a == null || o == null || s == null || n.knownAt != null && c == null ? null : {
    ts: i,
    o: r,
    h: a,
    l: o,
    c: s,
    v_base: ye(n.v_base),
    v_quote: ye(n.v_quote),
    ver: ye(n.ver),
    knownAt: c ?? void 0
  };
}
function aa(e, t, n) {
  const i = fn(t), r = ls(
    e.map((s, c) => oa(s, c)).filter((s) => s != null),
    i
  ).slice(-Math.max(1, n));
  if (!r.length)
    return {
      timeframeSec: i,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const a = rt(r[0].ts, i), o = r.map((s) => {
    const c = rt(s.ts, i);
    return {
      ...s,
      bucket: c,
      x: (c - a) / i
    };
  });
  return vi({
    timeframeSec: i,
    firstBucket: a,
    candles: o,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Ld(e, t, n) {
  const i = e.candles.length, r = t.map((o, s) => oa(o, s)).filter((o) => o != null).filter((o) => rt(o.ts, e.timeframeSec) < e.firstBucket).sort(sa);
  if (!r.length) return 0;
  const a = aa(
    [...r, ...e.candles],
    n,
    r.length + e.candles.length
  );
  return e.timeframeSec = a.timeframeSec, e.firstBucket = a.firstBucket, e.candles = a.candles, e.positionByBucket = a.positionByBucket, Math.max(0, e.candles.length - i);
}
function os(e) {
  const t = new Float32Array(e.length * dr);
  return e.forEach((n, i) => {
    t.set([n.x, n.o, n.h, n.l, n.c], i * dr);
  }), new Uint8Array(t.buffer);
}
function mr(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function Dd(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function ss(e, t, n, i = 3) {
  const r = ra(t);
  if (!r) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const a = rt(r.ts, e.timeframeSec);
  if (a < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const o = e.positionByBucket.get(a), s = (a - e.firstBucket) / e.timeframeSec, c = { ...r, bucket: a, x: s };
  if (o != null)
    return vs(c, e.candles[o]) ? { kind: "ignore", reason: "stale-version" } : ms(e.candles[o], c) ? (e.candles[o] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[o] = c, {
      kind: "replace",
      position: o,
      bytes: mr(c)
    });
  const l = e.candles[e.candles.length - 1];
  return a <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (a - l.bucket) / e.timeframeSec > i ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), cs(e), { kind: "reset", bytes: os(e.candles) }) : (vi(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: mr(c)
  }));
}
function Hd(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, i = -1 / 0;
  for (const o of e)
    n = Math.min(n, o.l), i = Math.max(i, o.h);
  for (const o of t)
    for (let s = 1; s < o.length; s += 2) {
      const c = o[s];
      Number.isFinite(c) && (n = Math.min(n, c), i = Math.max(i, c));
    }
  const a = Math.max(1e-9, i - n) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: n - a,
    maxY: i + a
  };
}
function Bd(e, t, n) {
  const i = fn(n), r = Math.floor(Date.now() / 1e3), a = rt(r, i), o = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), s = [];
  let c = 40 + o % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = a - l * i, f = Math.sin((t - l + o) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((t - l) / 13) * 0.35), v = Math.max(d, m) + 0.35 + Math.abs(Math.sin(l + o)) * 0.5, p = Math.min(d, m) - 0.35 - Math.abs(Math.cos(l + o)) * 0.5, h = 50 + o % 90 + Math.abs(Math.sin((t - l + o) / 5)) * 180;
    s.push({ ts: u, o: d, h: v, l: p, c: m, v_base: h, v_quote: h * m }), c = m;
  }
  return aa(s, n, t);
}
function Vd(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const i = n.bucket + e.timeframeSec, r = Math.sin(i / 600) * 0.7, a = n.c, o = Math.max(1e-4, a + r), s = Math.max(a, o) + 0.5, c = Math.min(a, o) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(r) * 0.36));
  return ss(e, { ts: i, o: a, h: s, l: c, c: o, v_base: l, v_quote: l * o }, t);
}
function cs(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  vi(e);
}
function vi(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function oa(e, t) {
  const n = ra(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function ls(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = rt(i.ts, t), a = n.get(r);
    (!a || sa(i, a) > 0) && n.set(r, i);
  }
  return Array.from(n.entries()).sort(([i], [r]) => i - r).map(([, i]) => us(i));
}
function sa(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, i = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== i ? n - i : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function us(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function vr(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? fs(e) : ds(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function fs(e) {
  const [
    t,
    n = 1,
    i = 0,
    r = 0,
    a = 0,
    o = 0,
    s = 0,
    c = 0,
    l = 0
  ] = e, u = Math.floor(Number(o) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(i) - Number(s),
    Number(r) - Number(c),
    Number(a) - Number(l),
    u
  );
}
function ds(e) {
  const [t, n = 1, i = 1, r = 0, a = 0, o = 0, s = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(i),
    Number(r),
    Number(a),
    Number(o),
    Number(s)
  );
}
function ms(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function vs(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function ye(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function ys(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && zt(e.o) && zt(e.h) && zt(e.l) && zt(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && Qt(e.v_base) && Qt(e.v_quote) && Qt(e.ver) && Qt(e.knownAt);
}
function yr(e, t) {
  return C({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: ye(e.v_base) ?? null,
    vQuote: ye(e.v_quote) ?? null,
    ver: ye(e.ver) ?? null,
    knownAt: $e(e, t)
  });
}
function zt(e) {
  return Number.isFinite(e) && e > 0;
}
function Qt(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function ca(e) {
  if (typeof e == "string")
    try {
      return ca(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
const ke = "impulse_fade_v1", me = "impulse_fade_v1.lifecycle.1", hs = "impulse_fade_v1.lifecycle-config.1", ht = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function $d(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let i = 0;
  return e.forEach((r, a) => {
    i += r.c, a >= t && (i -= e[a - t].c), a >= t - 1 && n.push(r.x, i / t);
  }), new Float32Array(n);
}
function ps(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], i = 2 / (t + 1);
  let r = 0;
  for (let a = 0; a < t; a++)
    r += e[a].c;
  r /= t, n.push(e[t - 1].x, r);
  for (let a = t; a < e.length; a++)
    r = (e[a].c - r) * i + r, n.push(e[a].x, r);
  return new Float32Array(n);
}
function Ud(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], i = t * (t + 1) / 2;
  for (let r = t - 1; r < e.length; r++) {
    let a = 0;
    for (let o = 0; o < t; o++)
      a += e[r - t + 1 + o].c * (o + 1);
    n.push(e[r].x, a / i);
  }
  return new Float32Array(n);
}
function qd(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const i = [], r = [], a = [];
  let o = 0, s = 0;
  return e.forEach((c, l) => {
    if (o += c.c, s += c.c * c.c, l >= t) {
      const u = e[l - t].c;
      o -= u, s -= u * u;
    }
    if (l >= t - 1) {
      const u = o / t, f = Math.max(0, s / t - u * u), d = Math.sqrt(f) * n;
      i.push(c.x, u), r.push(c.x, u + d), a.push(c.x, u - d);
    }
  }), {
    basis: new Float32Array(i),
    upper: new Float32Array(r),
    lower: new Float32Array(a)
  };
}
function zd(e, t = 14) {
  return Ue(Ea(e, t));
}
function gs(e, t = 14, n = 14, i = 3, r = 3) {
  const a = Ea(e, t), o = qe(n);
  if (a.length < o)
    return { k: new Float32Array(), d: new Float32Array() };
  const s = [];
  for (let u = o - 1; u < a.length; u++) {
    let f = 1 / 0, d = -1 / 0;
    for (let p = 0; p < o; p++) {
      const h = a[u - p].value;
      f = Math.min(f, h), d = Math.max(d, h);
    }
    const m = d - f, v = m > 0 ? (a[u].value - f) / m * 100 : 50;
    s.push({ x: a[u].x, value: v });
  }
  const c = wr(s, qe(i)), l = wr(c, qe(r));
  return {
    k: Ue(c),
    d: Ue(l)
  };
}
function Qd(e, t = 12, n = 26, i = 9) {
  const r = Wn(e, t), a = Wn(e, n), o = [];
  for (let u = 0; u < e.length; u++) {
    const f = r[u], d = a[u];
    f == null || d == null || o.push({ x: e[u].x, value: f - d });
  }
  const s = Ac(o, i), c = new Map(o.map((u) => [u.x, u.value])), l = s.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: Ue(o),
    signal: Ue(s),
    histogram: Ue(l)
  };
}
function As(e, t = 14) {
  const n = yn(e, t), i = [];
  return n.forEach((r, a) => {
    r != null && i.push({ x: e[a].x, value: r });
  }), Ue(i);
}
function at(e, t = {}) {
  const n = L(t.windowSeconds, 60, 2592e3, 86400), i = L(t.historyDays, 1, 365, 180), r = L(t.minSamples, 1, 5e3, 20), a = L(t.emaPeriod, 2, 500, 20), o = L(t.atrPeriod, 2, 500, 14), s = ba(e);
  if (!s)
    return ec(n);
  const c = e.indexOf(s), l = wa(e, s.bucket - n, c), u = l && X(l.c) ? (s.c / l.c - 1) * 100 : null, f = u == null ? [] : tc(e, {
    windowSeconds: n,
    earliestBucket: s.bucket - i * 86400,
    excludeBucket: s.bucket
  }), d = u != null && f.length >= r ? nc(f, u) : null, m = u != null && f.length >= r ? ic(f, u) : null, v = Wn(e, a)[c] ?? null, p = yn(e, o)[c] ?? null, h = v != null && p != null && Number.isFinite(v) && Number.isFinite(p) && p > 0 ? (s.c - v) / p : null;
  return {
    candle: s,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: d,
    zScore: m,
    rollingReturnCount: f.length,
    ema: v,
    atr: p,
    atrExtension: h
  };
}
function bs(e = {}) {
  var H, j, N;
  const t = e.executionTimeframe ?? "chart", n = k(e.asOf), i = k(e.latestTs) ?? $s(e.candles ?? [], t) ?? k((H = e.structure) == null ? void 0 : H.updatedTs) ?? k((j = e.marketStructure) == null ? void 0 : j.summary.updatedTs) ?? null, r = n ?? i, a = r == null ? null : bi(e.candles ?? [], r, t), o = (a == null ? void 0 : a.candle.c) ?? k(e.latestPrice), s = ws(e.marketStructure ?? null, n), c = (s == null ? void 0 : s.summary) ?? Es(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : hi(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (B) => n == null || D(B) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (B) => n == null || D(B) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (B) => n == null || D(B) <= n
  ), v = K(e.resistanceNearPct, 0, 10, 1.5), p = K(e.retestNearPct, 0, 10, 0.8), h = Qs(e.extension ?? null), A = js(f, o, v), b = Ws(d), E = Gs(c), _ = Ks(
    m,
    e.avwapDistancePct
  ), P = Ys(c, f, o, p), w = Xs(h, A, c, o), g = [
    h,
    A,
    b,
    E,
    _,
    P
  ], S = {
    checks: g,
    asOf: r,
    updatedTs: i,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ct({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, I = Ns({
    extension: h,
    htfResistance: A,
    htfStructures: u,
    rsWeakness: b,
    structureShift: E,
    avwapFailure: _,
    retest: P,
    invalidated: w
  });
  return (N = e.candles) != null && N.length && r != null ? Ss({
    ...e,
    asOf: r,
    latestPrice: o,
    marketStructure: s,
    structure: c,
    htfStructures: l,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: m,
    checks: g,
    executionTimeframe: t
  }) : ya({
    ...S,
    state: I,
    reason: Js(I, g),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function ws(e, t) {
  var a;
  if (!e || t == null) return e;
  const n = e.swings.filter((o) => o.knownAt <= t), i = e.breaks.filter((o) => o.knownAt <= t), r = ((a = Ne(i)) == null ? void 0 : a.direction) ?? "neutral";
  return {
    swings: n,
    breaks: i,
    trend: r,
    summary: Ei(n, i, r)
  };
}
function Es(e, t) {
  if (!e || t == null) return e ?? null;
  const n = k(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function jd(e) {
  return Ts(e).records;
}
function ct(e = {}) {
  var t, n, i, r, a, o, s, c, l, u, f;
  return T({
    lifecycleVersion: me,
    lifecycleConfigVersion: hs,
    candidateGate: ht,
    extension: {
      windowSeconds: L(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: L((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: L((i = e.extensionOptions) == null ? void 0 : i.minSamples, 1, 5e3, 20),
      emaPeriod: L((r = e.extensionOptions) == null ? void 0 : r.emaPeriod, 2, 500, 20),
      atrPeriod: L((a = e.extensionOptions) == null ? void 0 : a.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: L(
        (o = e.marketStructureOptions) == null ? void 0 : o.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: L(
        (s = e.marketStructureOptions) == null ? void 0 : s.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: L((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: K((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: L((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: L((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: K(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: K(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: K(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: K(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: K(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: L(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function la(e) {
  var c;
  const t = da(e), n = Ne(t);
  if (n == null) return null;
  const i = k(e.from) ?? -1 / 0, r = fa(e, n), a = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], s = new Set(
    o.map((l) => De(l, e.executionTimeframe)).filter((l) => l >= i && l <= n)
  );
  for (const l of e.structureEvents ?? [])
    (!l.sourceTimeframe || l.sourceTimeframe === e.executionTimeframe) && D(l) >= i && D(l) <= n && s.add(D(l));
  for (const l of [...s].sort((u, f) => u - f))
    yi(
      mn(o, e.executionTimeframe, l),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (c = e.config) == null ? void 0 : c.marketStructureOptions,
      l,
      a
    );
  return ua(
    e,
    n,
    a,
    r
  );
}
function Ts(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], i = e.config ?? {}, r = ct(i), a = da(e), o = fa(
    e,
    Ne(a) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = k(e.from) ?? -1 / 0;
  let f = null;
  return { records: a.map((m) => {
    var E, _, P, w, g;
    const v = ua(
      e,
      m,
      s,
      o
    ), p = ma(e.candidateMetrics, m), h = (p == null ? void 0 : p.metrics) ?? Ai(
      at(
        mn(n, t, m),
        i.extensionOptions
      )
    );
    f = v;
    const A = v.evidence.filter((S) => c.has(S.id) ? !1 : (c.add(S.id), S.knownAt >= u)), b = v.transitions.filter((S) => {
      const I = Rs(S);
      return l.has(I) ? !1 : (l.add(I), S.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: ke,
      lifecycleVersion: me,
      lifecycleConfigHash: r,
      candidateGatePassed: Rt(h),
      candidateId: ((E = v.candidate) == null ? void 0 : E.id) ?? null,
      candidateDetectedAt: ((_ = v.candidate) == null ? void 0 : _.detectedAt) ?? null,
      initialMtfContext: ((P = v.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: Ne(b) ?? null,
      transitions: b,
      evidenceAdded: A,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((w = v.candidate) == null ? void 0 : w.episodeHigh) ?? null,
      episodeHighTime: ((g = v.candidate) == null ? void 0 : g.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: f };
}
function ua(e, t, n, i) {
  const r = e.executionTimeframe, a = e.candlesByTimeframe[r] ?? [], o = e.config ?? {}, s = ct(o), c = mn(a, r, t), l = at(c, o.extensionOptions), u = ma(e.candidateMetrics, t), f = (u == null ? void 0 : u.metrics) ?? Ai(l), d = yi(
    c,
    r,
    e.structureEvents ?? [],
    o.marketStructureOptions,
    t,
    n
  ), m = i.filter(
    (p) => (p.summary.updatedTs ?? 0) <= t
  ), v = Ne(c) ?? null;
  return bs({
    candles: a,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: r,
    asOf: t,
    extensionOptions: o.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: f,
    marketStructure: d,
    structure: d.summary,
    htfStructures: m,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (v == null ? void 0 : v.c) ?? null,
    latestTs: t,
    resistanceNearPct: o.resistanceNearPct,
    retestNearPct: o.retestNearPct,
    retestToleranceBps: o.retestToleranceBps,
    retestToleranceAtr: o.retestToleranceAtr,
    invalidationBps: o.invalidationBps,
    maxCandidateAgeSeconds: o.maxCandidateAgeSeconds,
    lifecycleConfigHash: s
  });
}
function fa(e, t) {
  const n = k(e.from) ?? -1 / 0;
  return Object.entries(e.candlesByTimeframe).filter(([i]) => i !== e.executionTimeframe).flatMap(([i, r]) => {
    const a = new Set(
      r.map((o) => De(o, i)).filter((o) => o >= n && o <= t)
    );
    Number.isFinite(n) && n <= t && a.add(n);
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === i && D(o) >= n && D(o) <= t && a.add(D(o));
    return [...a].sort((o, s) => o - s).map((o) => {
      var c;
      const s = yi(
        mn(r, i, o),
        i,
        e.structureEvents ?? [],
        (c = e.config) == null ? void 0 : c.marketStructureOptions,
        o
      );
      return {
        timeframe: i,
        summary: { ...s.summary, updatedTs: o }
      };
    });
  });
}
const Wd = "openTime";
function De(e, t) {
  return (k(e.bucket) ?? k(e.ts) ?? 0) + Math.max(1, fn(t));
}
function mn(e, t, n) {
  return dn(e, t, n);
}
function da(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [a, o] of Object.entries(e.candlesByTimeframe))
    for (const s of o)
      t.add(s.knownAt ?? De(s, a));
  for (const a of e.candidateMetrics ?? [])
    t.add(k(a.knownAt) ?? a.asOf);
  for (const a of e.structureEvents ?? []) t.add(D(a));
  for (const a of e.avwapEvents ?? []) t.add(D(a));
  for (const a of e.relativeStrengthEvents ?? []) t.add(D(a));
  for (const a of e.supportResistanceZones ?? []) t.add(D(a));
  for (const a of e.evaluationPoints ?? []) {
    const o = k(a);
    o != null && t.add(o);
  }
  const n = [...t].filter(Number.isFinite).sort((a, o) => a - o), i = k(e.from) ?? n[0] ?? 0, r = k(e.to) ?? Ne(n) ?? i;
  return t.add(i), t.add(r), [...t].filter((a) => Number.isFinite(a) && a >= i && a <= r).sort((a, o) => a - o);
}
function ma(e, t) {
  return Ne([...e ?? []].filter((n) => (k(n.knownAt) ?? n.asOf) <= t).sort(
    (n, i) => (k(n.knownAt) ?? n.asOf) - (k(i.knownAt) ?? i.asOf) || n.asOf - i.asOf
  )) ?? null;
}
function yi(e, t, n, i, r, a) {
  var f;
  const o = Oe(e, i), s = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && D(d) <= r
  ), c = a ?? /* @__PURE__ */ new Map();
  for (const d of [...o.breaks, ...s])
    c.set(
      xe(
        d.kind,
        t,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const l = [...c.values()].filter((d) => d.knownAt <= r).sort(
    (d, m) => d.knownAt - m.knownAt || d.eventTime - m.eventTime
  );
  if (!l.length) return o;
  const u = ((f = Ne(l)) == null ? void 0 : f.direction) ?? o.trend;
  return {
    swings: o.swings,
    breaks: l,
    trend: u,
    summary: Ei(o.swings, l, u)
  };
}
function Rs(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function Ss(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, i = Cs(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), r = Hs(i, n);
  let a = Ps(i, e);
  if (!a && Rt(e.extension ?? null)) {
    const o = bi(t, e.asOf, e.executionTimeframe);
    o && (a = {
      index: o.index,
      candle: o.candle,
      eventTime: ve(o.candle),
      knownAt: Math.min(
        e.asOf,
        Ce(t, o.index, e.executionTimeframe)
      ),
      metrics: gi(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, r.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return a ? va(a, e, e.asOf, r) : ya({
    checks: e.checks,
    asOf: e.asOf,
    updatedTs: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: "notCandidate",
    reason: "No active Impulse Fade v1 candidate",
    dataQuality: r,
    lifecycleConfigHash: e.lifecycleConfigHash
  });
}
function Cs(e, t, n, i, r) {
  if (r != null && r.length)
    return [...r].map((o) => {
      const s = k(o.knownAt) ?? o.asOf, c = bi(e, s, i);
      if (!c || s > n) return null;
      const l = k(o.eventTime) ?? ve(c.candle), u = gi(o.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: s,
        metrics: u,
        pass: Rt(u),
        rollingReturnCount: Math.max(0, Math.trunc(o.sampleCount ?? 0))
      };
    }).filter((o) => o != null).sort((o, s) => o.knownAt - s.knownAt || o.eventTime - s.eventTime);
  const a = [];
  for (let o = 0; o < e.length; o += 1) {
    const s = e[o], c = Ce(e, o, i);
    if (c > n) continue;
    const l = at(e.slice(0, o + 1), t), u = Ai(l);
    a.push({
      index: o,
      candle: s,
      eventTime: ve(s),
      knownAt: c,
      metrics: u,
      pass: Rt(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return a;
}
function Ps(e, t) {
  var a;
  const n = [];
  let i = !1;
  for (const o of e)
    o.pass && !i && n.push(o), i = o.pass;
  if (!n.length) return null;
  let r = n[0];
  for (const o of n.slice(1)) {
    const c = ((a = va(r, t, o.knownAt, []).candidate) == null ? void 0 : a.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < o.knownAt && !l.pass) && (r = o);
  }
  return r;
}
function va(e, t, n, i) {
  const r = (t.symbol ?? "UNKNOWN").toUpperCase(), a = t.source ?? "chart", o = t.venue ?? "", s = t.executionTimeframe, c = hi(
    t.htfStructures ?? [],
    e.knownAt
  ).map((g) => ({
    timeframe: g.timeframe,
    state: g.summary.state,
    trend: g.summary.trend,
    transitionDirection: g.summary.transitionDirection,
    updatedTs: g.summary.updatedTs
  })), l = Vs({
    setupFamily: ke,
    symbol: r,
    source: a,
    venue: o,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), u = [
    {
      id: xe("candidate_detected", s, e.eventTime, e.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      sourceTimeframe: s,
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
  ], d = ks(t, e, n), m = xs(e, t, n);
  let v = "developing", p = e.knownAt, h = null, A = null, b = null, E = null, _ = null;
  for (const g of m) {
    if (h != null) break;
    if (!(g.knownAt < e.knownAt || g.knownAt > n)) {
      if (g.lifecycleKind === "deterioration") {
        u.push({ ...g, contributesTo: "deteriorating" }), v === "developing" && (f.push(dt(v, "deteriorating", g)), v = "deteriorating", p = g.knownAt);
        continue;
      }
      if (g.lifecycleKind === "bearishBreak") {
        u.push({ ...g, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (f.push(dt(v, "waitingForRetest", g)), v = "waitingForRetest", p = g.knownAt, A = g.breakLevel ?? null);
        continue;
      }
      if (g.lifecycleKind === "retest") {
        v === "waitingForRetest" && A && g.relatedEventId === A.evidenceId && g.knownAt > A.knownAt && (u.push({ ...g, contributesTo: "entryCandidate" }), f.push(dt(v, "entryCandidate", g)), v = "entryCandidate", p = g.knownAt, b = g.breakLevel ?? A);
        continue;
      }
      if (g.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (u.push({ ...g, contributesTo: "invalidated" }), f.push(dt(v, "invalidated", g)), v = "invalidated", p = g.knownAt, h = g.knownAt, E = g.explanation);
        continue;
      }
      g.lifecycleKind === "expiry" && v !== "entryCandidate" && (u.push({ ...g, contributesTo: "expired" }), f.push(dt(v, "expired", g)), v = "expired", p = g.knownAt, h = g.knownAt, _ = g.explanation);
    }
  }
  const P = Aa(
    t.candles ?? [],
    e.eventTime,
    n,
    s
  ), w = {
    id: l,
    setupFamily: ke,
    lifecycleVersion: me,
    lifecycleConfigHash: t.lifecycleConfigHash ?? ct({
      extensionOptions: t.extensionOptions,
      resistanceNearPct: t.resistanceNearPct,
      retestNearPct: t.retestNearPct,
      retestToleranceBps: t.retestToleranceBps,
      retestToleranceAtr: t.retestToleranceAtr,
      invalidationBps: t.invalidationBps,
      maxCandidateAgeSeconds: t.maxCandidateAgeSeconds
    }),
    symbol: r,
    source: a,
    venue: o,
    executionTimeframe: s,
    detectedAt: e.knownAt,
    detectionEventTime: e.eventTime,
    detectionMetrics: e.metrics,
    initialMtfContext: c,
    episodeHigh: (P == null ? void 0 : P.price) ?? null,
    episodeHighTime: (P == null ? void 0 : P.eventTime) ?? null,
    currentState: v,
    stateSince: p,
    terminalAt: h
  };
  return {
    strategy: "pumpFade",
    setupFamily: ke,
    lifecycleVersion: me,
    lifecycleConfigHash: w.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: p,
    label: vn(v),
    reason: Bs(v, u, f, E, _),
    checks: t.checks,
    updatedTs: n,
    candidate: w,
    evidence: u.sort((g, S) => g.knownAt - S.knownAt || g.eventTime - S.eventTime),
    transitions: f,
    pendingConditions: ga(v, A),
    activeBreakLevel: A,
    retestLevel: b,
    confluence: d,
    invalidationReason: E,
    expiryReason: _,
    dataQuality: i
  };
}
function xs(e, t, n) {
  const i = [], r = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = D(l);
    if (!pt(l, e, n)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    i.push({
      id: xe(f, r, l.eventTime, u, l.x),
      code: f,
      explanation: `${l.label}: bearish relative-strength deterioration`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      price: l.price,
      value: l.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const l of t.anchoredVwapSignals ?? []) {
    const u = D(l);
    l.kind !== "failedReclaim" || !pt(l, e, n) || i.push({
      id: xe("avwap_failed_reclaim", r, l.eventTime, u, l.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      price: l.price,
      level: l.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const a = Os(t), o = [];
  for (const l of a) {
    const u = D(l);
    if (l.direction !== "bearish" || !pt(l, e, n)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = xe(f, r, l.eventTime, u, l.x), m = {
      level: l.level,
      sourceTimeframe: r,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: d
    }, v = {
      id: d,
      code: f,
      explanation: `${l.label} down through ${pe(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    o.push(v), i.push(v);
  }
  for (const l of o) {
    const u = Is(e, l, t, n);
    u && i.push(u);
  }
  for (const l of a) {
    const u = D(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !pt(l, e, n))
      continue;
    const f = (t.candles ?? [])[l.index], d = Aa(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      r
    ), m = K(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || i.push({
      id: xe("bullish_continuation_invalidation", r, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${pe(d.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const s = L(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + s;
  return c <= n && i.push({
    id: xe("candidate_expired", r, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${zs(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: r,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), i.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function Is(e, t, n, i) {
  var u;
  const r = n.candles ?? [], a = t.breakLevel;
  if (!a || !Number.isFinite(a.level)) return null;
  const o = K(n.retestToleranceBps, 0, 1e3, 35), s = K(n.retestToleranceAtr, 0, 10, 0.25), c = L((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = yn(r, c);
  for (let f = 0; f < r.length; f += 1) {
    const d = r[f], m = Ce(r, f, n.executionTimeframe), v = ve(d);
    if (m <= t.knownAt || v < t.knownAt || v < e.knownAt || m > i)
      continue;
    const p = l[f] ?? 0, h = Math.max(
      a.level * (o / 1e4),
      Number.isFinite(p) ? p * s : 0
    );
    if (d.h >= a.level - h && d.l <= a.level + h && d.c < a.level && d.c <= d.o)
      return {
        id: xe(
          "bearish_retest_rejection",
          a.sourceTimeframe,
          ve(d),
          m,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${pe(a.level)}`,
        eventTime: v,
        knownAt: m,
        sourceTimeframe: a.sourceTimeframe,
        price: d.c,
        level: a.level,
        relatedEventId: a.evidenceId,
        lifecycleKind: "retest",
        sortPriority: 40,
        breakLevel: a
      };
  }
  return null;
}
function ks(e, t, n) {
  const i = [], r = wi(
    e.srZones.filter((s) => D(s) <= n),
    e.latestPrice,
    K(e.resistanceNearPct, 0, 10, 1.5)
  );
  r && i.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${pe(r.low)}-${pe(r.high)}`,
    eventTime: r.eventTime,
    knownAt: r.knownAt,
    sourceTimeframe: "MTF",
    level: r.center
  });
  const a = [...e.anchoredVwapSignals ?? []].filter(
    (s) => s.kind === "loss" && pt(s, t, n)
  ).sort((s, c) => D(c) - D(s))[0];
  a && D(a) <= n && i.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: a.eventTime,
    knownAt: a.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: a.vwap
  });
  const o = k(e.avwapDistancePct);
  o != null && i.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${bt(o, 1)}% from AVWAP`,
    value: o,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of hi(e.htfStructures, n))
    s.summary.state !== "neutral" && i.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: qs(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return i;
}
function hi(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = k(i.summary.updatedTs);
    if (r != null && r > t) continue;
    const a = n.get(i.timeframe), o = k(a == null ? void 0 : a.summary.updatedTs) ?? -1 / 0;
    (!a || (r ?? -1 / 0) >= o) && n.set(i.timeframe, i);
  }
  return [...n.values()];
}
function Os(e) {
  var i, r, a;
  const t = (r = (i = e.marketStructure) == null ? void 0 : i.breaks) != null && r.length ? e.marketStructure.breaks : (a = e.structure) != null && a.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((o) => {
    const s = `${o.kind}:${o.direction}:${o.x}:${o.level}:${D(o)}`;
    return n.has(s) ? !1 : (n.add(s), !0);
  });
}
function Ns(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && hr(e.htfResistance, e.htfStructures) ? "deteriorating" : hr(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function ya(e) {
  return {
    strategy: "pumpFade",
    setupFamily: ke,
    lifecycleVersion: me,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ct(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: vn(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: ga(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function pi(e, t = {}) {
  const n = rc(e, t);
  if (n == null) return new Float32Array();
  const i = [];
  let r = 0, a = 0;
  for (let o = n; o < e.length; o += 1) {
    const s = e[o];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!X(c)) continue;
    const l = ac(s, c);
    l <= 0 || (r += l, a += c * l, i.push(s.x, a / r));
  }
  return new Float32Array(i);
}
function _s(e, t = {}) {
  const n = k(t.anchorBucket), i = k(t.anchorX), r = pi(e, t);
  if (r.length < 2)
    return {
      anchorBucket: n,
      anchorX: i,
      value: null,
      distancePct: null,
      candle: null
    };
  const a = r[r.length - 1], o = ba(e), s = o && X(a) ? (o.c - a) / a * 100 : null;
  return {
    anchorBucket: n,
    anchorX: i,
    value: a,
    distancePct: s,
    candle: o
  };
}
function Ms(e, t = {}, n = 20) {
  const i = L(n, 1, 200, 20), r = pi(e, t);
  if (r.length < 4) return [];
  const a = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), o = [];
  let s = null;
  for (let c = 0; c < r.length; c += 2) {
    const l = r[c], u = r[c + 1], f = a.get(l);
    if (!f || !X(u) || !X(f.candle.c)) continue;
    const d = Ce(e, f.index), m = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    m && (s === "above" && m === "below" ? o.push(In("loss", f.index, f.candle, u, d)) : s === "below" && m === "above" ? o.push(In("reclaim", f.index, f.candle, u, d)) : s === "below" && m === "below" && f.candle.h >= u && f.candle.c < u && o.push(
      In("failedReclaim", f.index, f.candle, u, d)
    ), s = m);
  }
  return o.slice(-i);
}
function Fs(e, t = {}) {
  const n = L(t.lookback, 20, 2e3, 500), i = L(t.pivotStrength, 1, 20, 3), r = L(t.atrPeriod, 2, 100, 14), a = K(t.minMoveAtr, 0, 10, 0.75), o = L(t.maxSwings, 1, 500, 120), s = Math.max(0, e.length - n), c = e.slice(s);
  if (c.length < i * 2 + 1) return [];
  const l = yn(e, r), u = [];
  for (let d = i; d < c.length - i; d += 1) {
    const m = c[d], v = s + d, p = l[v] ?? null, h = Ce(e, v + i);
    yc(c, d, i) && u.push(pr("SwingHigh", v, m, m.h, p, h)), hc(c, d, i) && u.push(pr("SwingLow", v, m, m.l, p, h));
  }
  const f = [];
  for (const d of u) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      fc(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= dc(d, m, a) && f.push(d);
  }
  return oc(f).slice(-o);
}
function Oe(e, t = {}) {
  const n = L(t.maxSwings, 1, 500, 120), i = L(t.maxBreaks, 1, 200, 24), r = Fs(e, {
    ...t,
    maxSwings: Math.max(n, i * 4)
  }), a = [], o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, f = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const p = Ce(e, v);
    for (; c < r.length && r[c].index < v && r[c].knownAt <= p; ) {
      const A = r[c];
      A.kind === "SwingHigh" ? l = A : u = A, c += 1;
    }
    const h = e[v];
    if (l && !o.has(l.x) && h.c > l.price) {
      const A = f === "bearish" ? "StructureShift" : "StructureBreak";
      a.push(gr(A, "bullish", v, h, l, p)), o.add(l.x), f = "bullish";
    }
    if (u && !s.has(u.x) && h.c < u.price) {
      const A = f === "bullish" ? "StructureShift" : "StructureBreak";
      a.push(gr(A, "bearish", v, h, u, p)), s.add(u.x), f = "bearish";
    }
  }
  const d = r.slice(-n), m = a.slice(-i);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: Ei(d, m, f)
  };
}
function Ls(e) {
  var r;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      br(t, "SwingHigh", "rangeHigh", null, !0),
      br(t, "SwingLow", "rangeLow", null, !1)
    ].filter((a) => !!a);
  const i = n.state === "transitional" ? n.transitionDirection ?? ((r = n.lastBreak) == null ? void 0 : r.direction) ?? e.trend : n.state;
  return i === "bullish" ? [
    Wt(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    Wt(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((a) => !!a) : i === "bearish" ? [
    Wt(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    Wt(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((a) => !!a) : [];
}
function Gd(e, t = {}) {
  var c, l;
  const n = L(t.lookback, 20, 1e3, 240), i = L(t.pivotStrength, 1, 20, 3), r = L(t.maxZones, 1, 12, 6), a = K(t.thicknessBps, 1, 100, 10), o = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = Oe(e, {
    lookback: n,
    pivotStrength: i,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return ha(s.swings, {
    maxZones: r,
    thicknessBps: a,
    latestX: o,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function ha(e, t = {}) {
  var l;
  const n = L(t.maxZones, 1, 12, 6), i = K(t.thicknessBps, 1, 100, 10), r = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, a = k(t.referencePrice), o = t.zonesPerSide == null ? null : L(t.zonesPerSide, 1, 12, 3), s = [];
  for (const u of e)
    mc(
      s,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      r - u.x + 1,
      i
    );
  const c = s.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return vc(c, n, a, o);
}
function pa(e, t) {
  const n = new Map(
    t.filter((o) => X(o.c)).map((o) => [o.bucket, o])
  );
  let i = null, r = null;
  const a = [];
  for (const o of e) {
    if (!X(o.c)) continue;
    const s = n.get(o.bucket);
    if (!s || !X(s.c)) continue;
    (i == null || r == null) && (i = o.c, r = s.c);
    const c = o.c / i / (s.c / r);
    a.push(o.x, (c - 1) * 100);
  }
  return new Float32Array(a);
}
function Ds(e, t, n = {}) {
  var P;
  const i = L(n.maxDivergences, 1, 100, 16), r = K(n.minDeltaPct, 0, 50, 0.5), a = L(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), o = n.includeDivergences ?? !0, s = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = pa(e, t), u = gc(l);
  if (!e.length || u.size < 2) return [];
  const d = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - a, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, i * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, i * 2)
  }, v = Oe(e, {
    ...m
  }), p = cc(e, l), h = Oe(p, {
    ...m
  }), A = new Map(e.map((w, g) => [w.x, { candle: w, index: g }])), b = [];
  let E = null, _ = null;
  for (const w of v.swings) {
    const g = u.get(w.x);
    if (!(g == null || !Number.isFinite(g))) {
      if (w.kind === "SwingHigh") {
        if (E) {
          const S = u.get(E.x);
          S != null && Number.isFinite(S) && (w.price > E.price && g <= S - r ? o && b.push(
            jt(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              w,
              E,
              g,
              S,
              v.summary.state,
              h.summary.state
            )
          ) : w.price < E.price && g >= S + r && s && b.push(
            jt(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              w,
              E,
              g,
              S,
              v.summary.state,
              h.summary.state
            )
          ));
        }
        E = w;
        continue;
      }
      if (_) {
        const S = u.get(_.x);
        S != null && Number.isFinite(S) && (w.price > _.price && g <= S - r ? s && b.push(
          jt(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            w,
            _,
            g,
            S,
            v.summary.state,
            h.summary.state
          )
        ) : w.price < _.price && g >= S + r && o && b.push(
          jt(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            w,
            _,
            g,
            S,
            v.summary.state,
            h.summary.state
          )
        ));
      }
      _ = w;
    }
  }
  if (c)
    for (const w of h.breaks) {
      if (w.x < d) continue;
      const g = A.get(w.x), S = u.get(w.x);
      if (!g || S == null || !Number.isFinite(S)) continue;
      const I = Oe(e.slice(0, g.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      lc(w.direction, I.summary.state) && b.push(
        sc(
          w.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          w.direction,
          w.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          g.index,
          g.candle,
          S,
          w,
          I.summary.state,
          h.summary.state
        )
      );
    }
  return b.filter((w) => w.x >= d).sort((w, g) => w.x - g.x || Ar(w.signal) - Ar(g.signal)).slice(-i);
}
function Kd(e) {
  return new Uint8Array(e.buffer);
}
function gi(e) {
  return {
    returnPct: k(e == null ? void 0 : e.returnPct),
    percentile: k(e == null ? void 0 : e.percentile),
    zScore: k(e == null ? void 0 : e.zScore),
    atrExtension: k(e == null ? void 0 : e.atrExtension)
  };
}
function Ai(e) {
  return {
    returnPct: k(e.returnPct),
    percentile: k(e.percentile),
    zScore: k(e.zScore),
    atrExtension: k(e.atrExtension)
  };
}
function Rt(e) {
  const t = gi(e);
  return t.returnPct != null && t.returnPct >= ht.returnPct || t.percentile != null && t.percentile >= ht.percentile || t.zScore != null && t.zScore >= ht.zScore || t.atrExtension != null && t.atrExtension >= ht.atrExtension;
}
function Hs(e, t) {
  const n = [], i = L(t.minSamples, 1, 1e4, 20), r = e[e.length - 1] ?? null;
  return r ? r.rollingReturnCount < i && n.push(
    `Rolling-return history has ${r.rollingReturnCount}/${i} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function dt(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function Bs(e, t, n, i, r) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return i ?? "Continuation invalidated the fade setup";
  if (e === "expired") return r ?? "Candidate expired before progressing";
  const a = n[n.length - 1];
  if (a && a.to === e) return a.explanation;
  const o = t.filter((c) => c.contributesTo === e), s = o[o.length - 1];
  return (s == null ? void 0 : s.explanation) ?? vn(e);
}
function ga(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${pe(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function Vs(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function xe(e, t, n, i, r) {
  return [e, t, n, i, r ?? ""].map((a) => String(a).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Aa(e, t, n, i) {
  let r = null;
  for (let a = 0; a < e.length; a += 1) {
    const o = e[a], s = ve(o);
    s < t || Ce(e, a, i) > n || Number.isFinite(o.h) && (!r || o.h > r.price) && (r = { price: o.h, eventTime: s });
  }
  return r;
}
function $s(e, t) {
  return e.length ? Ce(e, e.length - 1, t) : null;
}
function bi(e, t, n) {
  for (let i = e.length - 1; i >= 0; i -= 1)
    if (Ce(e, i, n) <= t)
      return { candle: e[i], index: i };
  return null;
}
function ve(e) {
  const t = k(e.ts);
  return t ?? k(e.bucket) ?? 0;
}
function Ce(e, t, n) {
  const i = e[t];
  return i ? i.knownAt != null && Number.isFinite(i.knownAt) ? i.knownAt : n != null && String(n).trim() !== "chart" ? De(i, n) : (k(i.bucket) ?? ve(i)) + Us(e, t) : 0;
}
function Us(e, t) {
  var a, o, s;
  const n = k((a = e[t]) == null ? void 0 : a.bucket) ?? ve(e[t]), i = k((o = e[t + 1]) == null ? void 0 : o.bucket);
  if (i != null && i > n) return i - n;
  const r = k((s = e[t - 1]) == null ? void 0 : s.bucket);
  return r != null && n > r ? n - r : 1;
}
function D(e) {
  return k(e.knownAt) ?? k(e.eventTime) ?? k(e.ts) ?? k(e.bucket) ?? 0;
}
function pt(e, t, n) {
  const i = D(e), r = k(e.eventTime) ?? k(e.ts) ?? k(e.bucket) ?? i;
  return i > t.knownAt && i <= n && r >= t.knownAt;
}
function qs(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function zs(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function X(e) {
  return Number.isFinite(e) && e > 0;
}
function Qs(e) {
  const t = k(e == null ? void 0 : e.returnPct), n = k(e == null ? void 0 : e.percentile), i = k(e == null ? void 0 : e.zScore), r = k(e == null ? void 0 : e.atrExtension), a = [
    t == null ? null : `24h ${bt(t, 1)}%`,
    r == null ? null : `Ext ${bt(r, 1)} ATR`,
    i == null ? null : `Z ${bt(i, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: Rt({ returnPct: t, percentile: n, zScore: i, atrExtension: r }) ? "pass" : "pending",
    detail: a.join(" | ") || "No extension context yet"
  };
}
function js(e, t, n) {
  const i = wi(e, t, n);
  return i ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${pe(i.low)}-${pe(i.high)} strength ${i.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Ws(e) {
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
function Gs(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Ks(e, t) {
  const n = [...e].reverse().find((a) => a.kind === "loss" || a.kind === "failedReclaim"), i = k(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || i != null && i <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (i == null ? "No AVWAP failure" : `AVWAP ${bt(i, 1)}%`)
  };
}
function Ys(e, t, n, i) {
  var c;
  const r = k((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), a = r != null && n != null && Zs(n, r) <= i, o = wi(t, n, i);
  return {
    key: "retest",
    label: "Retest",
    status: !!(a || o) ? "pass" : "pending",
    detail: a ? `Retesting ${pe(r)}` : o ? `Near R ${pe(o.center)}` : "No retest yet"
  };
}
function Xs(e, t, n, i) {
  var a;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || i == null) return !1;
  const r = k((a = n.lastSwingHigh) == null ? void 0 : a.price);
  return r != null && i > r * 1.01;
}
function hr(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function wi(e, t, n) {
  return t == null || !X(t) ? null : e.filter((i) => i.kind === "resistance").map((i) => ({
    zone: i,
    distance: t >= i.low && t <= i.high ? 0 : t < i.low ? (i.low - t) / t * 100 : (t - i.high) / t * 100
  })).filter((i) => i.distance <= n).sort((i, r) => i.distance - r.distance || r.zone.strength - i.zone.strength).map((i) => i.zone)[0] ?? null;
}
function Zs(e, t) {
  return !X(e) || !X(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function vn(e) {
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
function Js(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((i) => i.status === "pass").map((i) => i.label);
  return n.length ? n.join(" + ") : vn(e);
}
function bt(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function pe(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function k(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function Ne(e) {
  return e[e.length - 1];
}
function ba(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (X(n.c)) return n;
  }
  return null;
}
function ec(e) {
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
function wa(e, t, n) {
  const i = Math.min(e.length - 1, Math.max(0, n - 1));
  let r = 0, a = i, o = -1;
  for (; r <= a; ) {
    const s = Math.floor((r + a) / 2);
    e[s].bucket <= t ? (o = s, r = s + 1) : a = s - 1;
  }
  for (; o >= 0 && !X(e[o].c); ) o -= 1;
  return o >= 0 ? e[o] : null;
}
function tc(e, t) {
  const n = [];
  for (let i = 1; i < e.length; i += 1) {
    const r = e[i];
    if (r.bucket < t.earliestBucket || r.bucket >= t.excludeBucket || !X(r.c)) continue;
    const a = wa(e, r.bucket - t.windowSeconds, i);
    !a || !X(a.c) || n.push((r.c / a.c - 1) * 100);
  }
  return n;
}
function nc(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const i = n.filter((a) => a < t).length, r = n.filter((a) => a === t).length;
  return (i + r * 0.5) / n.length * 100;
}
function ic(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const i = n.reduce((o, s) => o + s, 0) / n.length, r = n.reduce((o, s) => o + (s - i) ** 2, 0) / (n.length - 1), a = Math.sqrt(r);
  return a > 0 ? (t - i) / a : null;
}
function In(e, t, n, i, r) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: i,
    eventTime: ve(n),
    knownAt: r
  };
}
function rc(e, t) {
  const n = t.anchorBucket == null ? null : Number(t.anchorBucket);
  if (n != null && Number.isFinite(n)) {
    const r = e.findIndex((a) => a.bucket >= n);
    return r >= 0 ? r : null;
  }
  const i = t.anchorX == null ? null : Number(t.anchorX);
  if (i != null && Number.isFinite(i)) {
    const r = e.findIndex((a) => a.x >= i);
    return r >= 0 ? r : null;
  }
  return null;
}
function ac(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const i = Number(e.v_quote);
  return Number.isFinite(i) && i > 0 && t > 0 ? i / t : 0;
}
function pr(e, t, n, i, r, a) {
  return {
    kind: e,
    structure: e,
    label: e === "SwingHigh" ? "SH" : "SL",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: i,
    atr: r,
    eventTime: ve(n),
    knownAt: a
  };
}
function oc(e) {
  let t = null, n = null;
  return e.map((i) => {
    if (i.kind === "SwingHigh") {
      const s = t == null ? "SwingHigh" : i.price > t.price ? "HigherHigh" : "LowerHigh", l = { ...i, structure: s, label: s === "SwingHigh" ? "SH" : s === "HigherHigh" ? "HH" : "LH" };
      return t = l, l;
    }
    const r = n == null ? "SwingLow" : i.price > n.price ? "HigherLow" : "LowerLow", o = { ...i, structure: r, label: r === "SwingLow" ? "SL" : r === "HigherLow" ? "HL" : "LL" };
    return n = o, o;
  });
}
function gr(e, t, n, i, r, a) {
  return {
    kind: e,
    direction: t,
    label: e === "StructureBreak" ? "BOS" : "Shift",
    index: n,
    x: i.x,
    ts: i.ts,
    bucket: i.bucket,
    level: r.price,
    sourceSwingX: r.x,
    sourceSwingPrice: r.price,
    eventTime: ve(i),
    knownAt: a
  };
}
function jt(e, t, n, i, r, a, o, s, c, l) {
  return {
    kind: e,
    signal: t,
    direction: n,
    label: i,
    index: r.index,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    price: r.price,
    previousPrice: a.price,
    rs: o,
    previousRs: s,
    priceLabel: r.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: l,
    eventTime: r.eventTime,
    knownAt: Math.max(r.knownAt, a.knownAt)
  };
}
function sc(e, t, n, i, r, a, o, s, c) {
  return {
    kind: e,
    signal: "break",
    direction: t,
    label: n,
    index: i,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    price: t === "bearish" ? r.l : r.h,
    previousPrice: null,
    rs: a,
    previousRs: o.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak: o,
    priceStructureState: s,
    rsStructureState: c,
    eventTime: o.eventTime,
    knownAt: o.knownAt
  };
}
function cc(e, t) {
  const n = new Map(e.map((a) => [a.x, a])), i = [];
  let r = null;
  for (let a = 0; a < t.length; a += 2) {
    const o = t[a], s = t[a + 1], c = n.get(o);
    if (!c || !Number.isFinite(s)) continue;
    const l = r ?? s;
    i.push({
      ...c,
      o: l,
      h: s,
      l: s,
      c: s,
      v_base: 0,
      v_quote: 0
    }), r = s;
  }
  return i;
}
function lc(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Ar(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function Ei(e, t, n) {
  const i = t[t.length - 1] ?? null, r = jn(e, "SwingHigh"), a = jn(e, "SwingLow"), o = e[e.length - 1] ?? null, s = uc(t), c = e.length === 0 ? "neutral" : i == null || s ? "range" : i.kind === "StructureShift" ? "transitional" : i.direction, l = c === "transitional" ? (i == null ? void 0 : i.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: l,
    lastBreak: i,
    lastSwingHigh: r,
    lastSwingLow: a,
    updatedX: (i == null ? void 0 : i.x) ?? (o == null ? void 0 : o.x) ?? null,
    updatedTs: (i == null ? void 0 : i.knownAt) ?? (o == null ? void 0 : o.knownAt) ?? null
  };
}
function Wt(e, t, n, i, r) {
  for (let o = e.length - 1; o >= 0; o -= 1) {
    const s = e[o];
    if (s.kind === t && n.includes(s.structure))
      return Qn(i, r, s);
  }
  const a = jn(e, t);
  return a ? Qn(i, r, a) : null;
}
function br(e, t, n, i, r) {
  let a = null;
  for (const o of e)
    o.kind === t && (!a || (r ? o.price > a.price : o.price < a.price)) && (a = o);
  return a ? Qn(n, i, a) : null;
}
function Qn(e, t, n) {
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
function uc(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function jn(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const i = e[n];
    if (i.kind === t) return i;
  }
  return null;
}
function fc(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function dc(e, t, n) {
  const i = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, i * n);
}
function yn(e, t) {
  const n = qe(t), i = Array(e.length).fill(null);
  if (e.length < n) return i;
  const r = e.map((o, s) => {
    if (s === 0) return o.h - o.l;
    const c = e[s - 1].c;
    return Math.max(
      o.h - o.l,
      Math.abs(o.h - c),
      Math.abs(o.l - c)
    );
  });
  let a = 0;
  for (let o = 0; o < n; o += 1) a += r[o];
  a /= n, i[n - 1] = a;
  for (let o = n; o < e.length; o += 1)
    a = (a * (n - 1) + r[o]) / n, i[o] = a;
  return i;
}
function mc(e, t, n, i, r) {
  const a = n.price;
  if (!Number.isFinite(a) || a <= 0) return;
  const o = Math.max(a * (r / 1e4), Number.EPSILON), s = a - o, c = a + o, l = 1 / Math.max(1, i), u = e.find(
    (m) => m.kind === t && pc(m.low, m.high, s, c)
  );
  if (!u) {
    e.push({
      kind: t,
      low: s,
      high: c,
      center: a,
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
  u.center = (u.center * u.touches + a) / f, u.touches = f, u.score += 1 + l, u.strength = u.score, u.lastX = Math.max(u.lastX, n.x), u.eventTime = Math.max(u.eventTime, n.eventTime), u.knownAt = Math.max(u.knownAt, n.knownAt), u.structures.push(n.structure);
  const d = Math.max(u.center * (r / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - d, s), u.high = Math.max(u.high, u.center + d, c);
}
function vc(e, t, n, i) {
  if (!n || !i) return e.slice(0, t);
  const r = /* @__PURE__ */ new Set(), a = e.filter((s) => s.center <= n).sort((s, c) => n - s.center - (n - c.center) || c.score - s.score).slice(0, i), o = e.filter((s) => s.center > n).sort((s, c) => s.center - n - (c.center - n) || c.score - s.score).slice(0, i);
  for (const s of [...a, ...o])
    r.add(s);
  for (const s of e) {
    if (r.size >= t) break;
    r.add(s);
  }
  return Array.from(r).sort((s, c) => c.score - s.score || c.touches - s.touches || c.lastX - s.lastX).slice(0, t);
}
function yc(e, t, n) {
  const i = e[t].h;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].h >= i || e[t + r].h > i) return !1;
  return !0;
}
function hc(e, t, n) {
  const i = e[t].l;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].l <= i || e[t + r].l < i) return !1;
  return !0;
}
function pc(e, t, n, i) {
  return e <= i && n <= t;
}
function gc(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const i = e[n], r = e[n + 1];
    Number.isFinite(i) && Number.isFinite(r) && t.set(i, r);
  }
  return t;
}
function Wn(e, t) {
  const n = qe(t), i = Array(e.length).fill(null);
  if (e.length < n) return i;
  const r = 2 / (n + 1);
  let a = 0;
  for (let o = 0; o < n; o++) a += e[o].c;
  a /= n, i[n - 1] = a;
  for (let o = n; o < e.length; o++)
    a = (e[o].c - a) * r + a, i[o] = a;
  return i;
}
function Ac(e, t) {
  const n = qe(t);
  if (e.length < n) return [];
  const i = [], r = 2 / (n + 1);
  let a = 0;
  for (let o = 0; o < n; o++) a += e[o].value;
  a /= n, i.push({ x: e[n - 1].x, value: a });
  for (let o = n; o < e.length; o++)
    a = (e[o].value - a) * r + a, i.push({ x: e[o].x, value: a });
  return i;
}
function Ea(e, t) {
  const n = qe(t);
  if (e.length <= n) return [];
  let i = 0, r = 0;
  for (let o = 1; o <= n; o++) {
    const s = e[o].c - e[o - 1].c;
    s >= 0 ? i += s : r += Math.abs(s);
  }
  i /= n, r /= n;
  const a = [
    { x: e[n].x, value: Er(i, r) }
  ];
  for (let o = n + 1; o < e.length; o++) {
    const s = e[o].c - e[o - 1].c, c = Math.max(0, s), l = Math.max(0, -s);
    i = (i * (n - 1) + c) / n, r = (r * (n - 1) + l) / n, a.push({ x: e[o].x, value: Er(i, r) });
  }
  return a;
}
function wr(e, t) {
  if (e.length < t) return [];
  const n = [];
  let i = 0;
  return e.forEach((r, a) => {
    i += r.value, a >= t && (i -= e[a - t].value), a >= t - 1 && n.push({ x: r.x, value: i / t });
  }), n;
}
function Ue(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function Er(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function qe(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function L(e, t, n, i) {
  return Math.floor(K(e, t, n, i));
}
function K(e, t, n, i) {
  const r = Number(e);
  return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : i;
}
const bc = "strategy-profile.1", Ta = "decision-snapshot.1", wc = "impulse_fade_v1.research.default", Ec = "1";
function Tc(e) {
  return `decision-reference-observation:${T({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function Nt(e) {
  const { profileHash: t, ...n } = e;
  return T(n);
}
function Ra(e) {
  if (St(e.createdAt, "createdAt"), e.setupFamily !== ke || e.lifecycleVersion !== me || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [r, a] of Object.entries(e.timeframeRoles))
    if (r === "contextTimeframes") {
      if (!a.every((o) => o.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (a != null && !a.trim())
      throw new TypeError(`${r} cannot be blank`);
  if (Tr(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), Tr(
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
    (r) => !e.entryPolicy.factors.hardGate.includes(r)
  ))
    throw new RangeError(
      "Impulse Fade lifecycle 1 requires unique, supported hard-gate factor roles"
    );
  if (Object.values(e.executionAssumptions).some(
    (r) => !Number.isFinite(r) || r < 0
  ))
    throw new RangeError("Execution assumptions must be non-negative finite numbers");
  if (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4)
    throw new RangeError("Adverse-slippage allowances must be below 10,000 basis points");
  const i = y(e);
  return y({
    ...i,
    profileHash: Nt(i)
  });
}
function Rc(e = {}) {
  var a, o;
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
    ...(a = e.entryPolicy) == null ? void 0 : a.requiredDataQuality
  }, i = {
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
  }, r = {
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
    factors: i
  };
  return Ra({
    schemaVersion: bc,
    id: e.id ?? wc,
    version: e.version ?? Ec,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: ke,
    lifecycleVersion: me,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ct(),
    side: "short",
    timeframeRoles: t,
    entryPolicy: r,
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
const Sc = Rc();
function Ti(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (_c(e.price, "reference price"), St(e.eventTime, "reference eventTime"), St(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = Tc(e.sourceObject);
  if (e.sourceObject.observationId != null && e.sourceObject.observationId !== t)
    throw new Error("Decision reference source observation failed deterministic verification");
  return y({
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
function Cc(e) {
  var a, o, s, c;
  if (St(e.decisionTime, "decisionTime"), St(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  xc(e.lifecycle.candidate, e.effectiveAsOf), Ic(e.candidateMetrics, e.effectiveAsOf);
  const t = [...e.dataQualityNotes];
  Nc([
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
  const n = Pc(
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
  const i = {
    snapshotSchemaVersion: Ta,
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
    candidateEpisode: ((a = e.lifecycle.candidate) == null ? void 0 : a.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate : null,
    activeCandidateId: ((o = e.lifecycle.candidate) == null ? void 0 : o.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate.id : null,
    lifecycleState: e.lifecycle.currentState,
    lifecycleStateSince: e.lifecycle.stateSince,
    lifecycleEvidence: On(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: kc(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: kn(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: kn(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: On(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: On(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: kn(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, r = Ri(i);
  return y({ ...i, id: r });
}
function Ri(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${T(n).slice(8)}`;
}
function Sa(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const i of t) {
    const r = n.get(i.id);
    if (r && C(r) !== C(i))
      throw new RangeError(`Conflicting decision reference id ${i.id}`);
    n.set(i.id, i);
  }
  return [...n.values()];
}
function Pc(e, t, n, i) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || i != null && i.venue && e.exchange.toLowerCase() !== i.venue.toLowerCase() ? null : e;
}
function xc(e, t) {
  if (!e) return;
  if ([
    e.detectedAt,
    e.detectionEventTime,
    e.stateSince,
    e.episodeHighTime,
    e.terminalAt,
    ...e.initialMtfContext.map((i) => i.updatedTs)
  ].filter((i) => i != null).some((i) => !Number.isFinite(i) || i > t))
    throw new RangeError("Candidate episode contains information after effectiveAsOf");
}
function Ic(e, t) {
  if (!e) return;
  if ([
    e.requestedAsOf,
    e.effectiveAsOf,
    e.updatedAt,
    e.historyCoverage.requestedEndTs,
    e.historyCoverage.availableEndTs,
    e.extension.latestTs,
    e.extension.referenceTs,
    ...Object.values(e.timeframeExtensions).map((i) => i.latestTs)
  ].filter((i) => i != null).some((i) => !Number.isFinite(i) || i > t))
    throw new RangeError("Candidate metrics contain information after effectiveAsOf");
}
function kc(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [i]) => n.localeCompare(i)).map(([n, i]) => [
      n,
      Oc(i) <= t ? i : null
    ])
  );
}
function kn(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, i) => n.knownAt - i.knownAt || n.id.localeCompare(i.id));
}
function On(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, i) => n.knownAt - i.knownAt || n.eventTime - i.eventTime || T(n).localeCompare(T(i))
  );
}
function Oc(e) {
  var t, n, i;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((i = e.lastSwingLow) == null ? void 0 : i.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function Nc(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const i = t.get(n.id);
    if (i && C(i) !== C(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function St(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function _c(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function Tr(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const Ca = "radar-selection-profile.1", Si = "radar-episode.1", Pa = "replay-case-manifest.1", Ci = "radar-metric-observation.1", Mc = "radar-scan-result.1", Fc = "radar-episode-status.1", Pi = "execution-venue-eligibility.1", Lc = "radar-structure-observation.1", xi = "radar-universe-membership.1";
function Ii(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function Dc(e) {
  return La(e), y({
    ...e,
    canonicalConfigHash: Ii(e)
  });
}
function Hc(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: Pi,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return y({
    ...t,
    observationId: pn(t)
  });
}
function Yd(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !mi(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: Lc,
    ...e
  };
  return y({
    ...t,
    observationId: xa(t)
  });
}
function Xd(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: xi,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return y({
    ...t,
    observationId: hn(t)
  });
}
function hn(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${J(n)}`;
}
function xa(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${J(n)}`;
}
function Gn(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(C(e.snapshot));
  return y({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${J({
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
function pn(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${J(n)}`;
}
const Zd = Dc({
  schemaVersion: Ca,
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
function Jd(e) {
  var c, l;
  ml(e);
  const t = e.strategyProfile ?? Sc, n = /* @__PURE__ */ new Map(), i = [], r = [], a = [], o = [], s = /* @__PURE__ */ new Set();
  for (const [u, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = Zc(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    s.add(m);
    const v = ge(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ), p = Math.max(
      0,
      e.from - Bc(e.selectionProfile)
    ), h = v.map((E) => De(E, e.selectionProfile.scanTimeframe)).filter((E) => E >= p).filter((E) => E <= e.to).filter((E) => fl(E, e.selectionProfile)), A = e.candidateEvaluationPoints ? new Set(e.candidateEvaluationPoints) : null, b = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const E of h) {
      const _ = Qe(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      b.previousEvaluationAsOf != null && E - b.previousEvaluationAsOf > _ && (b.previousGate = null, b.falseSince = null);
      const P = E >= e.from, w = A == null || A.has(E), g = w ? e.selectionProfile.moveDetectors.map(
        (O) => Vc(O, d, E, e.selectionProfile.scanTimeframe)
      ) : [];
      if (P)
        for (const O of g)
          for (const ie of O.observations)
            n.set(ie.requestId, ie);
      const S = w ? Gc(
        d,
        E,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ) : null;
      let I = [], H = [], j = !1, N = !0, B = null;
      if (w) {
        const O = ll(
          g.map((z) => z.result),
          e.selectionProfile.detectorCombination
        ), ie = Wc(
          d,
          E,
          e.selectionProfile,
          g,
          S,
          e.universeHistory ?? []
        );
        I = ie.results, H = ie.evidence;
        const re = I.every((z) => z.passed);
        if (j = O.passed && re, N = !re || O.evaluable, P)
          for (const z of H)
            z.schemaVersion === Ci && n.set(z.requestId, z);
        B = Yc(
          d,
          E,
          g.map((z) => z.result),
          I,
          H,
          O.passed,
          re,
          j,
          N
        ), P && i.push(B);
      }
      if (b.activeEpisode && E >= b.activeEpisode.activeUntil && (b.activeEpisode.detectedAt >= e.from && b.activeEpisode.activeUntil <= e.to && a.push(
        Nn(
          b.activeEpisode,
          b.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), b.activeEpisode = null), N && !j ? (b.falseSince ?? (b.falseSince = E), !b.armed && E - b.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (P && ((c = b.blockedEpisode) == null ? void 0 : c.detectedAt) != null && b.blockedEpisode.detectedAt >= e.from && a.push(
        Nn(b.blockedEpisode, E, "reset", "radarGateReset", "armed")
      ), b.activeEpisode = null, b.blockedEpisode = null, b.armed = !0)) : b.falseSince = null, w && B && S && N && j && b.previousGate === !1 && b.armed) {
        const O = zc({
          series: d,
          asOf: E,
          profile: e.selectionProfile,
          strategyProfile: t,
          detectorEvaluations: g,
          selectionEvaluation: B,
          hardGateEvidence: H,
          venueEligibility: S,
          lifecycleHistory: ((l = e.lifecycleHistory) == null ? void 0 : l[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (P) {
          r.push(O), a.push(
            Nn(O, E, "active", "detected", "blockedUntilReset")
          );
          const ie = Qc(O, d, e.selectionProfile, t);
          o.push(ie);
          for (const re of O.contextObservations)
            n.set(re.requestId, re);
        }
        b.activeEpisode = O, b.blockedEpisode = O, b.armed = !1;
      }
      b.previousGate = N ? j : null, b.previousEvaluationAsOf = E;
    }
  }
  return y({
    schemaVersion: Mc,
    selectionProfileRef: Ha(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(Da),
    gateEvaluations: i.sort(yl),
    episodes: r.sort(hl),
    episodeStatusObservations: a.sort(pl),
    replayCaseManifests: o.sort((u, f) => u.id.localeCompare(f.id))
  });
}
function Bc(e) {
  const t = Qe(e.scanTimeframe) * e.evaluationCadence.everyBars;
  return Math.max(
    e.episodeExpiry.maximumAgeSeconds,
    e.resetPolicy.minimumFalseDurationSeconds
  ) + t;
}
function Vc(e, t, n, i) {
  return e.type === "rollingTroughRunup" ? $c(e, t, n, i) : e.type === "elapsedWindowReturn" ? Uc(e, t, n, i) : e.type === "maximumWindowReturn" ? qc(e, t, n, i) : Ia(e, t, n);
}
function $c(e, t, n, i) {
  const r = ge(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, s = (a ? r.filter(
    (h) => h.bucket >= a.bucket - e.lookbackSeconds && h.bucket <= a.bucket && a.bucket - h.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((h, A) => Y(A.c) && (!h || A.c < h.c || A.c === h.c && A.bucket < h.bucket) ? A : h, null), c = a && s && Y(s.c) ? (a.c / s.c - 1) * 100 : null, l = tl(r, a, e), u = Ma(l, c, e.minimumSampleCount), f = [];
  a || f.push(ue("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || f.push(ue("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = T(e), m = lt({
    series: t,
    asOf: n,
    timeframe: i,
    metricCode: "rolling_trough_runup",
    metricVersion: "rolling-trough-runup.1",
    window: e.lookbackSeconds,
    referenceTime: (s == null ? void 0 : s.bucket) ?? null,
    referenceValue: (s == null ? void 0 : s.c) ?? null,
    value: c,
    unit: "percent",
    percentile: u.percentile,
    zScore: u.zScore,
    sampleCount: l.length,
    historyCandles: Oi(r, a, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...u.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && wt(m.percentile, e.minimumPercentile) && wt(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, p = s ? Kc(t, n, s, m) : null;
  return {
    result: gn(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${on(c)} versus ${on(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: p
  };
}
function Uc(e, t, n, i) {
  const r = ka(e, t, n, i), a = Fa(r, e);
  return {
    result: gn(
      e,
      a,
      [r],
      a ? r.observationId : null,
      r.value == null ? "Elapsed return unavailable" : `${Ba(e.windowSeconds)} return ${on(r.value)}`
    ),
    observations: [r],
    anchor: null
  };
}
function qc(e, t, n, i) {
  const r = [...new Set(e.windowsSeconds)].sort((u, f) => u - f).map(
    (u) => ka(
      {
        ...e,
        id: `${e.id}:${u}`,
        type: "elapsedWindowReturn",
        windowSeconds: u
      },
      t,
      n,
      i
    )
  ), a = r.filter((u) => u.value != null).sort(
    (u, f) => (f.value ?? -1 / 0) - (u.value ?? -1 / 0) || (u.window ?? 1 / 0) - (f.window ?? 1 / 0)
  )[0] ?? null, o = ge(t.candlesByTimeframe[i] ?? [], i, n), s = lt({
    series: t,
    asOf: n,
    timeframe: i,
    metricCode: "maximum_window_return",
    metricVersion: "maximum-window-return.1",
    window: (a == null ? void 0 : a.window) ?? null,
    logicalWindow: null,
    referenceTime: (a == null ? void 0 : a.referenceTime) ?? null,
    referenceValue: (a == null ? void 0 : a.referenceValue) ?? null,
    value: (a == null ? void 0 : a.value) ?? null,
    unit: "percent",
    percentile: (a == null ? void 0 : a.percentile) ?? null,
    zScore: (a == null ? void 0 : a.zScore) ?? null,
    sampleCount: (a == null ? void 0 : a.sampleCount) ?? 0,
    historyCandles: Oi(
      o,
      o.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: T(e),
    notes: a ? a.dataQualityNotes : [ue("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Fa(s, e), l = [...r, s];
  return {
    result: gn(
      e,
      c,
      l,
      c ? (a == null ? void 0 : a.observationId) ?? null : null,
      (a == null ? void 0 : a.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Ba(a.window ?? 0)} return ${on(a.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function Ia(e, t, n) {
  const i = e.analysisTimeframe, r = ge(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, o = il(r, e.emaPeriod).at(-1) ?? null, s = rl(r, e.atrPeriod).at(-1) ?? null, c = a && o != null && s != null && s > 0 ? (a.c - o) / s : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  a || u.push(ue("NO_COMPLETED_CANDLE", "error", `No completed ${i} candle exists at cutoff`)), (r.length < l || c == null) && u.push(
    ue(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${i} candles`
    )
  );
  const f = lt({
    series: t,
    asOf: n,
    timeframe: i,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: o,
    value: c,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: r.length,
    historyCandles: r.slice(-l),
    configHash: T(e),
    notes: Ni(u)
  }), d = c != null && r.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: gn(
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
function ka(e, t, n, i) {
  const r = ge(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, o = a ? _a(r, a.bucket - e.windowSeconds) : null, s = a && o ? a.bucket - e.windowSeconds - o.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, l = a && o && !c && Y(o.c) ? (a.c / o.c - 1) * 100 : null, u = el(r, a, e), f = Ma(u, l, e.minimumSampleCount), d = [...f.notes];
  return a || d.push(ue("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), o ? c && d.push(ue("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(ue("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), lt({
    series: t,
    asOf: n,
    timeframe: i,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (o == null ? void 0 : o.bucket) ?? null,
    referenceValue: (o == null ? void 0 : o.c) ?? null,
    value: l,
    unit: "percent",
    percentile: f.percentile,
    zScore: f.zScore,
    sampleCount: u.length,
    historyCandles: Oi(
      r,
      a,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: T(e),
    notes: Ni(d)
  });
}
function zc(e) {
  var S;
  const t = e.detectorEvaluations.filter((I) => I.result.passed), n = Kn(
    t.flatMap(
      (I) => I.observations.filter(
        (H) => H.observationId === I.result.winningObservationId
      )
    )
  ), i = ((S = t.find((I) => I.anchor)) == null ? void 0 : S.anchor) ?? null, r = ge(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), a = Rr(e.series, e.asOf, e.profile.scanTimeframe, 86400), o = Rr(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = Na(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((I) => I.observations).find((I) => I.metricCode === "ema_atr_displacement") ?? null ?? Ia(
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
  ).observations[0], u = Jc(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = Kn([
    ...n,
    a,
    o,
    s,
    l
  ]), d = t[0], m = d ? n.find(
    (I) => I.observationId === d.result.winningObservationId
  ) ?? n[0] ?? null : null, v = jc(
    r,
    i,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    a,
    o,
    s,
    l,
    u
  ), p = al(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), h = p != null && p.candidate ? p : null, A = (h == null ? void 0 : h.candidate) ?? null, b = (h == null ? void 0 : h.asOf) ?? null, E = h && b != null ? Gn({
    logicalObjectId: (A == null ? void 0 : A.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: h.updatedTs,
    knownAt: b,
    snapshot: h
  }) : null, _ = A ? Gn({
    logicalObjectId: A.id,
    objectType: "SetupCandidateEpisode",
    eventTime: A.detectionEventTime,
    knownAt: b ?? A.detectedAt,
    snapshot: A
  }) : null, P = {
    schemaVersion: Si,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((I) => I.result.detectorId),
    triggeringObservations: n,
    selectionGateEvaluationId: e.selectionEvaluation.id,
    hardGateResults: e.selectionEvaluation.hardGateResults,
    hardGateEvidence: e.hardGateEvidence,
    contextObservations: f,
    selectionAnchor: i,
    pathContext: v,
    initialLifecycleCandidateId: (A == null ? void 0 : A.id) ?? null,
    initialLifecycleCandidateRef: _,
    initialLifecycleState: (h == null ? void 0 : h.state) ?? null,
    initialLifecycleStateRef: E,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Ni([
      ...f.flatMap((I) => I.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, w = `radar-episode:${J({
    symbol: P.symbol,
    source: P.source,
    profileHash: P.selectionProfileHash,
    detectedAt: P.detectedAt,
    triggeringObservationIds: n.map((I) => I.observationId)
  })}`, g = { ...P, id: w, logicalObjectId: w };
  return y({
    ...g,
    observationId: ki(g)
  });
}
function Qc(e, t, n, i) {
  const r = Object.keys(t.candlesByTimeframe).filter(
    (c) => ge(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Mi), a = Object.fromEntries(
    r.map((c) => {
      var u, f;
      const l = ge(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((f = l.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: l.at(-1) ? De(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), o = r.filter(
    (c) => a[c].completedCandleCount > 0
  ), s = {
    schemaVersion: Pa,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Ha(n),
    lifecycleVersion: me,
    strategyProfileRef: {
      id: i.id,
      version: i.version,
      profileHash: i.profileHash
    },
    availableTimeframes: o,
    preRollRequirements: cl(n),
    dataCoverageByTimeframe: a,
    initialRadarObservations: e.contextObservations,
    initialHardGateResults: e.hardGateResults,
    initialHardGateEvidence: e.hardGateEvidence,
    initialLifecycleState: e.initialLifecycleState,
    initialLifecycleStateRef: e.initialLifecycleStateRef,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return y({
    ...s,
    id: Oa(s)
  });
}
function Oa(e) {
  const { id: t, ...n } = e;
  return `replay-case:${J(n)}`;
}
function ki(e) {
  const { observationId: t, ...n } = e;
  return `radar-episode-observation:${J(n)}`;
}
function Rr(e, t, n, i) {
  const r = {
    id: `context-return-${i}`,
    type: "elapsedWindowReturn",
    windowSeconds: i,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: i,
    maximumReferenceStalenessSeconds: null
  }, a = ge(e.candlesByTimeframe[n] ?? [], n, t), o = a.at(-1) ?? null, s = o ? _a(a, o.bucket - i) : null, c = o && s && Y(s.c) ? (o.c / s.c - 1) * 100 : null, l = c == null ? [ue("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${i}-second reference exists`)] : [];
  return lt({
    series: e,
    asOf: t,
    timeframe: n,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: i,
    referenceTime: (s == null ? void 0 : s.bucket) ?? null,
    referenceValue: (s == null ? void 0 : s.c) ?? null,
    value: c,
    unit: "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: a,
    configHash: T(r),
    notes: l
  });
}
function Na(e, t, n) {
  var f;
  const i = n.scanTimeframe, r = ge(e.candlesByTimeframe[i] ?? [], i, t), a = r.at(-1) ?? null, o = a ? r.filter((d) => d.bucket > a.bucket - n.liquidityPolicy.windowSeconds) : [], s = o.map(
    (d) => Et(d.v_quote) ? d.v_quote : Et(d.v_base) ? d.v_base * d.c : null
  ), c = s.length > 0 && s.every((d) => d != null), l = c ? s.reduce((d, m) => d + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: i,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return lt({
    series: e,
    asOf: t,
    timeframe: i,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((f = o[0]) == null ? void 0 : f.bucket) ?? null,
    referenceValue: null,
    value: l,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: o.length,
    historyCandles: o,
    configHash: T(u),
    notes: c ? [] : [ue("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function lt(e) {
  var u, f;
  const t = ((u = e.historyCandles[0]) == null ? void 0 : u.bucket) ?? null, n = ((f = e.historyCandles.at(-1)) == null ? void 0 : f.bucket) ?? null, i = e.timeframe && e.historyCandles.at(-1) ? De(e.historyCandles.at(-1), e.timeframe) : e.asOf, r = e.timeframe ? e.historyCandles.reduce(
    (d, m) => Math.max(d, $e(m, e.timeframe)),
    i
  ) : e.asOf, a = T(
    e.historyCandles.map((d) => ({
      bucket: d.bucket,
      ts: d.ts,
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      vBase: Et(d.v_base) ? d.v_base : null,
      vQuote: Et(d.v_quote) ? d.v_quote : null,
      ver: Et(d.ver) ? d.ver : null,
      knownAt: e.timeframe ? $e(d, e.timeframe) : null
    }))
  ), o = `radar-metric:${J({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.logicalWindow === void 0 ? e.window : e.logicalWindow,
    configHash: e.configHash
  })}`, s = {
    schemaVersion: Ci,
    logicalObjectId: o,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    effectiveAsOf: i,
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
    inputHash: a,
    dataQualityNotes: e.notes
  }, c = `radar-observation:${J(s)}`, l = e.asOf;
  return y({
    ...s,
    observationId: c,
    requestId: `radar-observation-request:${J({ observationId: c, requestedAsOf: l })}`,
    requestedAsOf: l
  });
}
function jc(e, t, n, i, r, a, o, s, c) {
  const l = t ? e.find((h) => h.bucket === t.timestamp) ?? null : null, f = (l ? e.filter((h) => h.bucket <= l.bucket) : []).reduce((h, A) => Y(A.c) && (!h || A.c > h.c || A.c === h.c && A.bucket < h.bucket) ? A : h, null), d = e.at(-1) ?? null, m = t && f && Y(f.c) ? (t.price / f.c - 1) * 100 : null, v = t && f && d && f.c > t.price ? (d.c - t.price) / (f.c - t.price) : null, p = t && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: r.value,
    net48hReturnPct: a.value,
    triggeringLocalImpulseReturnPct: (i == null ? void 0 : i.unit) === "percent" ? i.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (i == null ? void 0 : i.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (f == null ? void 0 : f.c) ?? null,
    priorPeakTime: (f == null ? void 0 : f.bucket) ?? null,
    priorDrawdownPct: m,
    recoveryFraction: v,
    currentAtrDisplacement: s.value,
    triggeringPercentile: (i == null ? void 0 : i.percentile) ?? null,
    triggeringZScore: (i == null ? void 0 : i.zScore) ?? null,
    quoteNotional: o.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([h, A]) => [
        h,
        typeof A.snapshot == "object" && A.snapshot != null && !Array.isArray(A.snapshot) && typeof A.snapshot.state == "string" ? A.snapshot.state : "unknown"
      ])
    ),
    contextTags: p
  };
}
function Wc(e, t, n, i, r, a) {
  const o = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return mt(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = Kn(i.flatMap((v) => v.observations));
        o.push(...d);
        const m = !i.some(
          (v) => v.observations.some(
            (p) => p.dataQualityNotes.some((h) => h.severity === "error")
          )
        );
        return mt(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        o.push(r);
        const d = ul(r.status, n.executionVenuePolicy.mode);
        return mt(
          c,
          d,
          `Execution venue ${r.status}`,
          [r]
        );
      }
      if (c === "selectedUniverse") {
        const d = sl(a, e, t);
        return d && o.push(d), mt(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const l = Na(e, t, n);
      o.push(l);
      const u = n.liquidityPolicy.minimumQuoteNotional, f = u == null || l.value == null ? u == null || n.liquidityPolicy.missingData === "warn" : l.value >= u;
      return mt(
        c,
        f,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: vl(o)
  };
}
function mt(e, t, n, i) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(i.map((r) => r.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        i.flatMap(
          (r) => r.schemaVersion === Ci ? [r.requestId] : []
        )
      )
    ].sort()
  };
}
function Gc(e, t, n, i) {
  const r = n.executionVenuePolicy.intendedVenue ?? "ignored", a = [...i].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === r.toLowerCase() && s.knownAt <= t && s.effectiveFrom <= t && (s.effectiveTo == null || s.effectiveTo >= t)
  );
  for (const s of a)
    if (pn(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const o = _i(
    a,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return o || Hc({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: r,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      ue(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function Kc(e, t, n, i) {
  const r = {
    logicalObjectId: `selection-anchor:${J({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - De(n, i.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: i.observationId
  };
  return y({
    ...r,
    observationId: `selection-anchor-observation:${J(r)}`
  });
}
function Nn(e, t, n, i, r) {
  const a = {
    schemaVersion: Fc,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: i,
    rearmState: r
  };
  return y({
    ...a,
    observationId: `radar-status:${J(a)}`
  });
}
function Yc(e, t, n, i, r, a, o, s, c) {
  const l = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: i,
    hardGateEvidence: r,
    evaluable: c,
    detectorGatePassed: a,
    hardGatesPassed: o,
    compositePassed: s
  };
  return y({
    ...l,
    id: `radar-gate:${J(l)}`
  });
}
function gn(e, t, n, i, r) {
  var o;
  const a = t || n.every(
    (s) => s.dataQualityNotes.every((c) => c.severity !== "error")
  );
  return {
    detectorId: e.id,
    detectorType: e.type,
    evaluable: a,
    passed: t,
    observationIds: n.map((s) => s.observationId),
    observationRequestIds: n.map((s) => s.requestId),
    winningObservationId: i,
    winningObservationRequestId: ((o = n.find((s) => s.observationId === i)) == null ? void 0 : o.requestId) ?? null,
    explanation: r
  };
}
function ge(e, t, n) {
  return dn(e, t, n);
}
function Xc(e, t, n) {
  const i = F(t);
  return e.filter((r) => {
    if (!Number.isFinite(r.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (r.bucket + i > n) return !1;
    if (r.knownAt != null && !Number.isFinite(r.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${r.bucket}`);
    return $e(r, t) <= n;
  });
}
function Zc(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([i, r]) => (Qe(i), [i, Xc(r, i, t)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function Jc(e, t, n) {
  const i = e.filter(
    (a) => a.symbol.toUpperCase() === t.symbol.toUpperCase() && a.source === t.source && a.knownAt <= n
  );
  for (const a of i)
    if (xa(a) !== a.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const r = /* @__PURE__ */ new Map();
  for (const a of new Set(i.map((o) => o.timeframe))) {
    const o = _i(
      i.filter((s) => s.timeframe === a),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${a}`
    );
    o && r.set(a, o);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([a], [o]) => Mi(a, o)).map(
      ([a, o]) => [
        a,
        Gn({
          logicalObjectId: o.logicalObjectId,
          objectType: "MarketStructure",
          eventTime: o.eventTime,
          knownAt: o.knownAt,
          snapshot: { state: o.state, detail: o.snapshot }
        })
      ]
    )
  );
}
function _a(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function el(e, t, n) {
  if (!t) return [];
  const i = t.bucket - n.historyLookbackSeconds, r = [];
  for (const a of e) {
    if (a.bucket < i || a.bucket >= t.bucket) continue;
    const o = nl(e, a.bucket - n.windowSeconds);
    if (!o || !Y(o.c)) continue;
    const s = a.bucket - n.windowSeconds - o.bucket;
    n.maximumReferenceStalenessSeconds != null && s > n.maximumReferenceStalenessSeconds || r.push((a.c / o.c - 1) * 100);
  }
  return r;
}
function tl(e, t, n) {
  if (!t) return [];
  const i = t.bucket - n.historyLookbackSeconds, r = [], a = [];
  let o = 0;
  for (let s = 0; s < e.length; s += 1) {
    const c = e[s], l = Math.max(
      c.bucket - n.lookbackSeconds,
      c.bucket - n.maximumTroughAgeSeconds
    );
    for (; o < a.length && e[a[o]].bucket < l; )
      o += 1;
    if (Y(c.c)) {
      for (; a.length > o && e[a[a.length - 1]].c > c.c; )
        a.pop();
      a.push(s);
    }
    if (c.bucket < i || c.bucket >= t.bucket) continue;
    const u = a[o], f = u == null ? null : e[u];
    f && r.push((c.c / f.c - 1) * 100);
  }
  return r;
}
function nl(e, t) {
  let n = 0, i = e.length - 1, r = null;
  for (; n <= i; ) {
    const a = Math.floor((n + i) / 2), o = e[a];
    o.bucket <= t ? (r = o, n = a + 1) : i = a - 1;
  }
  return r;
}
function Ma(e, t, n) {
  const i = [];
  if (e.length < n && i.push(
    ue(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: i };
  const r = e.filter((l) => l <= t).length / e.length * 100, a = e.reduce((l, u) => l + u, 0) / e.length, o = e.reduce((l, u) => l + (u - a) ** 2, 0) / e.length, s = Math.sqrt(o), c = s > 0 ? (t - a) / s : null;
  return { percentile: r, zScore: c, notes: i };
}
function Oi(e, t, n) {
  return t ? e.filter((i) => i.bucket >= t.bucket - n) : [];
}
function Fa(e, t) {
  return e.value != null && wt(e.value, t.minimumReturnPct) && wt(e.percentile, t.minimumPercentile) && wt(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function il(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let i = e.slice(0, t).reduce((a, o) => a + o.c, 0) / t;
  n[t - 1] = i;
  const r = 2 / (t + 1);
  for (let a = t; a < e.length; a += 1)
    i = e[a].c * r + i * (1 - r), n[a] = i;
  return n;
}
function rl(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  const i = e.map((a, o) => {
    var c;
    const s = ((c = e[o - 1]) == null ? void 0 : c.c) ?? a.c;
    return Math.max(a.h - a.l, Math.abs(a.h - s), Math.abs(a.l - s));
  });
  let r = i.slice(0, t).reduce((a, o) => a + o, 0) / t;
  n[t - 1] = r;
  for (let a = t; a < i.length; a += 1)
    r = (r * (t - 1) + i[a]) / t, n[a] = r;
  return n;
}
function al(e, t, n, i) {
  const r = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= n
  );
  for (const s of r)
    ol(s, t, n, i);
  const a = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), o = r.filter((s) => s.asOf === a);
  if (new Set(o.map((s) => C(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${a}`);
  return o[0] ?? null;
}
function ol(e, t, n, i) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== me || e.lifecycleVersion !== i.lifecycleVersion || e.lifecycleConfigHash !== i.lifecycleConfigHash || e.executionTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  oe(e.asOf, n, "lifecycle asOf"), oe(e.updatedTs, n, "lifecycle updatedTs"), oe(e.stateSince, n, "lifecycle stateSince");
  const r = e.candidate;
  if (r) {
    const a = [t.source, t.dataOrigin].filter((s) => s != null).some((s) => s.toLowerCase() === r.source.toLowerCase()), o = !r.venue.trim() || r.venue.toLowerCase() === t.source.toLowerCase();
    if (r.symbol.toUpperCase() !== t.symbol.toUpperCase() || !a || !o || r.setupFamily !== e.setupFamily || r.lifecycleVersion !== e.lifecycleVersion || r.lifecycleConfigHash !== e.lifecycleConfigHash || r.executionTimeframe !== i.timeframeRoles.executionTimeframe)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [s, c] of [
      ["candidate detectedAt", r.detectedAt],
      ["candidate detectionEventTime", r.detectionEventTime],
      ["candidate episodeHighTime", r.episodeHighTime],
      ["candidate stateSince", r.stateSince],
      ["candidate terminalAt", r.terminalAt]
    ])
      oe(c, n, s);
    for (const s of r.initialMtfContext)
      oe(s.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const a of e.evidence)
    if (oe(a.eventTime, n, "lifecycle evidence eventTime"), oe(a.knownAt, n, "lifecycle evidence knownAt"), a.knownAt < a.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const a of e.transitions)
    oe(a.knownAt, n, "lifecycle transition knownAt");
  for (const [a, o] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (o && (oe(o.eventTime, n, `${a} eventTime`), oe(o.knownAt, n, `${a} knownAt`), o.knownAt < o.eventTime))
      throw new Error(`${a} knownAt precedes eventTime`);
  for (const a of e.confluence)
    if (oe(a.eventTime, n, "lifecycle confluence eventTime"), oe(a.knownAt, n, "lifecycle confluence knownAt"), a.eventTime != null && a.knownAt != null && a.knownAt < a.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function oe(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function sl(e, t, n) {
  const i = [...e].filter(
    (r) => r.symbol.toUpperCase() === t.symbol.toUpperCase() && r.source === t.source && r.knownAt <= n && r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo >= n)
  );
  for (const r of i)
    if (hn(r) !== r.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return _i(
    i,
    (r) => [r.effectiveFrom, r.knownAt],
    "universe membership"
  );
}
function cl(e) {
  const t = /* @__PURE__ */ new Map();
  function n(i, r, a, o) {
    const s = t.get(i) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    s.duration = Math.max(s.duration, r), s.bars = Math.max(s.bars, a), s.purposes.add(o), t.set(i, s);
  }
  n(e.scanTimeframe, 172800, 0, "24h/48h path context"), n(e.scanTimeframe, e.liquidityPolicy.windowSeconds, 0, "liquidity context");
  for (const i of e.moveDetectors)
    i.type === "rollingTroughRunup" ? n(e.scanTimeframe, i.lookbackSeconds, 0, i.id) : i.type === "elapsedWindowReturn" ? n(e.scanTimeframe, i.windowSeconds + i.historyLookbackSeconds, 0, i.id) : i.type === "maximumWindowReturn" ? n(
      e.scanTimeframe,
      Math.max(...i.windowsSeconds) + i.historyLookbackSeconds,
      0,
      i.id
    ) : n(
      i.analysisTimeframe,
      0,
      Math.max(i.emaPeriod, i.atrPeriod) + 1,
      i.id
    );
  return [...t.entries()].sort(([i], [r]) => Mi(i, r)).map(([i, r]) => ({
    timeframe: i,
    minimumDurationSeconds: r.duration,
    minimumBars: r.bars,
    purposes: [...r.purposes].sort()
  }));
}
function ll(e, t) {
  const n = e.filter((r) => r.passed).length, i = e.filter((r) => !r.evaluable).length;
  return t.mode === "all" ? {
    passed: n === e.length,
    evaluable: e.some((r) => r.evaluable && !r.passed) || i === 0
  } : t.mode === "atLeast" ? {
    passed: n >= t.count,
    evaluable: n >= t.count || n + i < t.count
  } : {
    passed: n > 0,
    evaluable: n > 0 || i === 0
  };
}
function ul(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function fl(e, t) {
  const n = Qe(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function V(e) {
  throw new RangeError(e);
}
function La(e) {
  var n;
  e.schemaVersion !== Ca && V("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && V("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && V("Only impulse_fade_v1 radar profiles are supported");
  try {
    Qe(e.scanTimeframe);
  } catch {
    V("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && V("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && V("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || V("At least one move detector is required"), new Set(e.moveDetectors.map((i) => i.id)).size !== e.moveDetectors.length && V("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && V("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((i) => !t.has(i)) && V("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || V("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && V("atLeast detector count must be between one and the detector count"), (!Y(e.episodeExpiry.maximumAgeSeconds) || !Y(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && V("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((i) => !i.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !Y(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && V("Radar profile policies are invalid");
  for (const i of e.moveDetectors) dl(i);
}
function dl(e) {
  if (e.id.trim() || V("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || V(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && V(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!mi(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && V(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!Y(e.historyLookbackSeconds) || !_n(e.minimumPercentile, 0, 100) || !_n(e.minimumZScore)) && V(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!Y(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !Y(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && V(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!_n(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && V(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !Y(e.windowSeconds) && V(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !Y(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && V(`Detector ${e.id} requires unique positive windows`);
}
function ml(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Ii(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (La(n), e.strategyProfile) {
    if (Nt(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: i, ...r } = e.strategyProfile;
    Ra(r);
  }
}
function _n(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function wt(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function Y(e) {
  return Number.isFinite(e) && e > 0;
}
function Et(e) {
  return e != null && Number.isFinite(e);
}
function ue(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Ni(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Kn(e) {
  return [...new Map(e.map((t) => [t.requestId, t])).values()].sort(Da);
}
function vl(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function _i(e, t, n) {
  if (!e.length) return null;
  const i = [...e].sort((s, c) => {
    const l = t(s), u = t(c);
    for (let f = 0; f < Math.max(l.length, u.length); f += 1) {
      const d = (l[f] ?? -1 / 0) - (u[f] ?? -1 / 0);
      if (d !== 0) return d;
    }
    return s.observationId.localeCompare(c.observationId);
  }), r = i.at(-1), a = t(r), o = i.filter((s) => {
    const c = t(s);
    return c.length === a.length && c.every((l, u) => l === a[u]);
  });
  if (new Set(o.map((s) => s.observationId)).size > 1)
    throw new Error(`Conflicting ${n} observations at the same precedence`);
  return r;
}
function Da(e, t) {
  return e.requestedAsOf - t.requestedAsOf || e.observationId.localeCompare(t.observationId) || e.requestId.localeCompare(t.requestId);
}
function yl(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function hl(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function pl(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function Mi(e, t) {
  return Qe(e) - Qe(t) || e.localeCompare(t);
}
function Qe(e) {
  return F(e);
}
function Ha(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function on(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Ba(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function J(e) {
  return T(e).slice(8);
}
function em(e) {
  return C(e);
}
const Va = /* @__PURE__ */ new WeakMap(), $a = /* @__PURE__ */ new WeakMap();
function Ua(e, t) {
  Va.set(e, t);
}
function Z(e) {
  const t = Va.get(e);
  if (!t)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return t;
}
function gl(e, t) {
  $a.set(e, t);
}
async function Yn(e, t) {
  var a;
  const n = $a.get(e);
  if (!n) return;
  const i = Z(e);
  if ((((a = i.analysisStateHistory.at(-1)) == null ? void 0 : a.knownAt) ?? -1 / 0) >= t) return;
  const r = await n.materializeThrough(t);
  Ua(e, Object.freeze({
    ...i,
    analysisStateHistory: Object.freeze([...r.analysisStateHistory]),
    knownEvents: Object.freeze([...r.knownEvents])
  }));
}
const An = "replay-engine.1", _e = "replay-engine.2", Fi = "replay-session-config.1", qa = "replay-session.1", za = "replay-command.1", Qa = "replay-event.1", Al = "replay-decision-frame.1", bl = "replay-wake-plan.1", wl = "replay-wake-condition.1", El = "replay-wake-result.1", Tl = "replay-data-bundle.1", Li = "replay-outcome-envelope.1", Di = "replay-analysis-state.1", Hi = "replay-known-event.1";
var fe, kt, Xn;
class tm {
  constructor(t) {
    ee(this, kt);
    ee(this, fe);
    ae(this, fe, y({
      ...t,
      analysisStateHistory: t.analysisStateHistory ?? [],
      knownEvents: t.knownEvents ?? [],
      venueEvidence: t.venueEvidence ?? [],
      universeEvidence: t.universeEvidence ?? [],
      revisionHistoryAvailable: t.revisionHistoryAvailable ?? !1
    }));
  }
  async getCoverage(t) {
    var i, r;
    const n = te(this, kt, Xn).call(this, t);
    return {
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: ((r = n.at(-1)) == null ? void 0 : r.closeTime) ?? null,
      revisionHistoryAvailable: R(this, fe).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(t) {
    return y(
      te(this, kt, Xn).call(this, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions() {
    return [];
  }
  async loadAnalysisStateHistory(t) {
    return y(
      (R(this, fe).analysisStateHistory ?? []).filter(
        (n) => Tt(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return y(
      (R(this, fe).knownEvents ?? []).filter(
        (n) => Tt(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadPointInTimeVenueEvidence(t) {
    return y(
      (R(this, fe).venueEvidence ?? []).filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return y(
      (R(this, fe).universeEvidence ?? []).filter(
        (n) => Tt(n, t) && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadRadarEpisode(t) {
    return y(
      R(this, fe).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
fe = new WeakMap(), kt = new WeakSet(), Xn = function(t) {
  return [...R(this, fe).candles].filter(
    (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe
  ).sort(
    (n, i) => n.openTime - i.openTime || n.knownAt - i.knownAt || n.observationId.localeCompare(i.observationId)
  );
};
function Bi(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function ja(e, t) {
  if (e.schemaVersion !== Fi || !En(e.replayEngineVersion))
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  Ka(e.strategyProfileRef, t);
  const n = e.evaluationTimeframe ?? t.timeframeRoles.executionTimeframe;
  F(n);
  const i = $i(e.visibleTimeframes);
  if (!i.includes(n))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (Sr(e.maximumCaseDuration, "maximumCaseDuration"), Sr(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
    throw new RangeError("defaultWaitDeadline must fit within maximumSingleWaitDuration");
  for (const o of i) {
    const s = e.displayPreRollByTimeframe[o];
    if (!Number.isFinite(s) || s < 0)
      throw new RangeError(`Missing non-negative display pre-roll for ${o}`);
  }
  const r = [...new Set(e.allowedWakeConditionTypes)];
  if (!r.length)
    throw new RangeError("At least one wake condition type must be allowed");
  const a = {
    ...e,
    evaluationTimeframe: n,
    visibleTimeframes: i,
    displayPreRollByTimeframe: Object.fromEntries(
      Object.entries(e.displayPreRollByTimeframe).sort(
        ([o], [s]) => o.localeCompare(s)
      )
    ),
    allowedWakeConditionTypes: r,
    defaultWaitDeadline: e.defaultWaitDeadline ?? null,
    identityPresentationMode: e.identityPresentationMode ?? null,
    endOnRadarEpisodeTerminal: e.endOnRadarEpisodeTerminal ?? !1,
    endOnLifecycleTerminal: e.endOnLifecycleTerminal ?? !1,
    venueRulesRef: e.venueRulesRef ?? null
  };
  return y({
    ...a,
    canonicalConfigHash: Bi(a)
  });
}
function nm(e) {
  const t = $i([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return ja(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: Fi,
      replayEngineVersion: An,
      visibleTimeframes: t,
      displayPreRollByTimeframe: Object.fromEntries(
        t.map((n) => [
          n,
          Math.max(F(n) * 200, 86400)
        ])
      ),
      maximumCaseDuration: 72 * 3600,
      maximumSingleWaitDuration: 24 * 3600,
      defaultWaitDeadline: 12 * 3600,
      allowedWakeConditionTypes: [
        "NextLifecycleTransition",
        "LifecycleStateEntered",
        "StructureEventConfirmed",
        "AvwapEventConfirmed",
        "RelativeStrengthEventConfirmed",
        "PriceCrossesKnownLevel",
        "PriceEntersKnownZone",
        "RadarOrLifecycleTerminal",
        "AnyOf"
      ],
      completedCandlesOnly: !0,
      identityPresentationMode: "full",
      allowEarlyReveal: !1,
      allowOutOfStrategyPlans: !1,
      allowDiscretionaryOverrides: !0,
      endOnRadarEpisodeTerminal: !1,
      endOnLifecycleTerminal: !1,
      strategyProfileRef: {
        id: e.id,
        version: e.version,
        profileHash: e.profileHash
      }
    },
    e
  );
}
function bn(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function _t(e) {
  const { observationId: t, ...n } = e;
  return `replay-candle-observation:${T(n).slice(8)}`;
}
function Wa(e) {
  const t = F(e.timeframe);
  if (!Number.isFinite(e.openTime) || e.openTime < 0)
    throw new RangeError("Candle openTime must be a non-negative finite timestamp");
  if (e.openTime % t !== 0)
    throw new RangeError("Candle openTime must align to its timeframe");
  for (const [a, o] of Object.entries({ o: e.o, h: e.h, l: e.l, c: e.c }))
    if (!Number.isFinite(o) || o <= 0) throw new RangeError(`Candle ${a} must be positive`);
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Candle high/low do not contain open and close");
  const n = e.openTime + t, i = e.knownAt ?? e.correctionPublishedAt ?? n;
  if (!Number.isFinite(i) || i < n)
    throw new RangeError("Candle knownAt cannot precede its close");
  if (e.correctionPublishedAt != null && (!Number.isFinite(e.correctionPublishedAt) || e.correctionPublishedAt < n || e.correctionPublishedAt > i))
    throw new RangeError("Correction publication time must fall between closeTime and knownAt");
  if (e.revision != null && (!Number.isInteger(e.revision) || e.revision < 0))
    throw new RangeError("Candle revision must be a non-negative integer");
  const r = {
    logicalCandleId: bn(e),
    symbol: e.symbol.toUpperCase(),
    source: e.source,
    timeframe: e.timeframe,
    openTime: e.openTime,
    closeTime: n,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: e.vBase ?? null,
    vQuote: e.vQuote ?? null,
    knownAt: i,
    revision: e.revision ?? null,
    correctionPublishedAt: e.correctionPublishedAt ?? null
  };
  return y({ ...r, observationId: _t(r) });
}
function wn(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-state:${T(n).slice(8)}`;
}
function Rl(e) {
  if (Zn(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const t = {
    schemaVersion: Di,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return y({ ...t, id: wn(t) });
}
function Vi(e) {
  const { id: t, ...n } = e;
  return `replay-known-event:${T(n).slice(8)}`;
}
function Gt(e) {
  if (Zn(e.eventTime, "eventTime"), Zn(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && F(e.timeframe);
  const t = {
    schemaVersion: Hi,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return y({ ...t, id: Vi(t) });
}
async function Sl(e) {
  var w, g, S, I, H, j;
  Cl(e);
  const { manifest: t, sessionConfig: n, historicalDataAdapter: i } = e, r = await ((w = i.loadRadarEpisode) == null ? void 0 : w.call(i, t.radarEpisodeId));
  if (!r) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  Pl(t, r);
  const a = $i([
    ...n.visibleTimeframes,
    n.evaluationTimeframe,
    ...t.preRollRequirements.map((N) => N.timeframe)
  ]), o = t.startAsOf + n.maximumCaseDuration, s = {}, c = {}, l = {}, u = [];
  for (const N of a) {
    const B = Ml(t, e.strategyProfile, N), O = Math.max(0, t.startAsOf - B), ie = n.displayPreRollByTimeframe[N] ?? 0, re = Math.max(0, t.startAsOf - ie);
    s[N] = O, c[N] = re;
    const z = await i.getCoverage({
      symbol: t.symbol,
      source: t.source,
      timeframe: N
    });
    if (z.timeframe !== N) throw new Error(`Coverage timeframe mismatch for ${N}`);
    if (z.earliestOpenTime == null || z.earliestOpenTime > O)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${N}`);
    z.earliestOpenTime > re && u.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${N} display history begins after the configured display pre-roll`
    }), z.revisionHistoryAvailable || u.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${N} candle revision history is unavailable`
    });
    const Vt = await i.loadCandleHistory({
      symbol: t.symbol,
      source: t.source,
      timeframe: N,
      from: O,
      to: o
    }), $t = z.revisionHistoryAvailable ? await ((g = i.loadCandleRevisions) == null ? void 0 : g.call(i, {
      symbol: t.symbol,
      source: t.source,
      timeframe: N,
      from: O,
      to: o
    })) ?? [] : [];
    l[N] = xl(
      [...Vt, ...$t].filter((Ut) => Ut.knownAt <= o),
      t,
      N,
      O,
      o
    );
  }
  const f = {
    symbol: t.symbol,
    source: t.source,
    from: Math.min(...Object.values(s)),
    to: o
  }, d = Il(
    await ((S = i.loadAnalysisStateHistory) == null ? void 0 : S.call(i, f)) ?? [],
    t
  );
  if (!d.some((N) => N.knownAt <= t.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = kl(
    await ((I = i.loadKnownEvents) == null ? void 0 : I.call(i, f)) ?? [],
    t
  ), v = Ol(
    await ((H = i.loadPointInTimeVenueEvidence) == null ? void 0 : H.call(i, f)) ?? [],
    t
  ), p = Nl(
    await ((j = i.loadPointInTimeUniverseEvidence) == null ? void 0 : j.call(i, f)) ?? [],
    t
  ), h = {
    schemaVersion: Tl,
    symbol: t.symbol.toUpperCase(),
    source: t.source,
    analysisStartByTimeframe: s,
    displayStartByTimeframe: c,
    candlesByTimeframe: l,
    analysisStateHistory: d,
    knownEvents: m,
    venueEvidence: v,
    universeEvidence: p,
    radarEpisode: r,
    dataQualityNotes: u
  }, A = await it(h), b = await Ga(h, t.startAsOf), E = y({
    ...h,
    causalPrefixFingerprint: b,
    internalBundleFingerprint: A
  }), _ = y({
    ...h,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(l).map(([N, B]) => [
        N,
        B.filter(
          (O) => O.closeTime <= t.startAsOf && O.knownAt <= t.startAsOf
        )
      ])
    ),
    analysisStateHistory: d.filter(
      (N) => N.knownAt <= t.startAsOf
    ),
    knownEvents: m.filter((N) => N.knownAt <= t.startAsOf),
    venueEvidence: v.filter((N) => N.knownAt <= t.startAsOf),
    universeEvidence: p.filter((N) => N.knownAt <= t.startAsOf),
    causalPrefixFingerprint: b
  }), P = {
    manifest: y(t),
    sessionConfig: y(n),
    strategyProfile: y(e.strategyProfile),
    radarSelectionProfile: y(e.radarSelectionProfile),
    venueRules: y(e.venueRules ?? null),
    dataBundle: _,
    ...e.materializedAnalysisBinding ? { materializedAnalysisBinding: y(e.materializedAnalysisBinding) } : {}
  };
  return Ua(P, E), P;
}
async function im(e, t) {
  if (t > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: n, ...i } = e.dataBundle;
  return Ga(i, t);
}
async function Ga(e, t) {
  return it({
    schemaVersion: e.schemaVersion,
    symbol: e.symbol,
    source: e.source,
    radarEpisode: e.radarEpisode,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(e.candlesByTimeframe).map(([n, i]) => [
        n,
        i.filter((r) => r.closeTime <= t && r.knownAt <= t)
      ])
    ),
    analysisStateHistory: e.analysisStateHistory.filter((n) => n.knownAt <= t),
    knownEvents: e.knownEvents.filter((n) => n.knownAt <= t),
    venueEvidence: e.venueEvidence.filter((n) => n.knownAt <= t),
    universeEvidence: e.universeEvidence.filter((n) => n.knownAt <= t),
    dataQualityNotes: e.dataQualityNotes
  });
}
async function it(e) {
  var i;
  if (!((i = globalThis.crypto) != null && i.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const t = new TextEncoder().encode(C(e)), n = await globalThis.crypto.subtle.digest("SHA-256", t);
  return `sha256:${[...new Uint8Array(n)].map((r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function Cl(e) {
  const { manifest: t, sessionConfig: n, strategyProfile: i, radarSelectionProfile: r } = e;
  if (t.schemaVersion !== Pa || Oa(t) !== t.id || t.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (t.startAsOf !== t.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (Ii(r) !== r.canonicalConfigHash || t.selectionProfileRef.id !== r.id || t.selectionProfileRef.version !== r.version || t.selectionProfileRef.canonicalConfigHash !== r.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (Nt(i) !== i.profileHash || i.lifecycleVersion !== me || t.lifecycleVersion !== i.lifecycleVersion || t.strategyProfileRef.id !== i.id || t.strategyProfileRef.version !== i.version || t.strategyProfileRef.profileHash !== i.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (n.schemaVersion !== Fi || !En(n.replayEngineVersion) || Bi(n) !== n.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (n.replayEngineVersion === _e && (!e.materializedAnalysisBinding || e.materializedAnalysisBinding.replayEngineVersion !== _e || e.materializedAnalysisBinding.lifecycleConfigHash !== i.lifecycleConfigHash || e.materializedAnalysisBinding.radarProfileHash !== r.canonicalConfigHash || e.materializedAnalysisBinding.strategyProfileHash !== i.profileHash))
    throw new Error("Materialized replay configuration is missing its analysis binding");
  if (n.replayEngineVersion === An && e.materializedAnalysisBinding)
    throw new Error("replay-engine.1 cannot accept a materialized analysis binding");
  if (Ka(n.strategyProfileRef, i), n.evaluationTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (n.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (n.venueRulesRef && e.venueRules) {
    const a = Fl(e.venueRules);
    if (C(a) !== C(n.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function En(e) {
  return e === An || e === _e;
}
function Pl(e, t) {
  var i, r, a;
  if (t.schemaVersion !== Si || t.id !== e.radarEpisodeId || t.observationId !== e.radarEpisodeObservationId || ki(t) !== t.observationId || t.symbol.toUpperCase() !== e.symbol.toUpperCase() || t.source !== e.source || t.detectedAt !== e.detectedAt || t.effectiveAsOf !== e.startAsOf)
    throw new Error("RadarEpisode sidecar does not match the ReplayCaseManifest");
  if ([
    ...t.triggeringObservations.flatMap((o) => [o.effectiveAsOf, o.knownAt]),
    ...t.contextObservations.flatMap((o) => [o.effectiveAsOf, o.knownAt]),
    ...t.hardGateEvidence.map((o) => o.knownAt),
    (i = t.selectionAnchor) == null ? void 0 : i.timestamp,
    (r = t.initialLifecycleCandidateRef) == null ? void 0 : r.knownAt,
    (a = t.initialLifecycleStateRef) == null ? void 0 : a.knownAt,
    ...Object.values(t.initialMtfStructure).map((o) => o.knownAt)
  ].filter((o) => o != null).some((o) => !Number.isFinite(o) || o > e.startAsOf))
    throw new Error("RadarEpisode contains evidence unavailable at replay start");
}
function xl(e, t, n, i, r) {
  const a = /* @__PURE__ */ new Map();
  for (const l of e) {
    const u = Wa({
      symbol: l.symbol,
      source: l.source,
      timeframe: l.timeframe,
      openTime: l.openTime,
      o: l.o,
      h: l.h,
      l: l.l,
      c: l.c,
      vBase: l.vBase,
      vQuote: l.vQuote,
      knownAt: l.knownAt,
      revision: l.revision,
      correctionPublishedAt: l.correctionPublishedAt
    });
    if (l.symbol.toUpperCase() !== t.symbol.toUpperCase() || l.source !== t.source || l.timeframe !== n || l.openTime < i || l.openTime > r || l.logicalCandleId !== bn(l) || l.observationId !== _t(l) || C(l) !== C(u))
      throw new Error(`Invalid replay candle provenance for ${n}`);
    const f = C(l), d = a.get(l.observationId);
    if (d && C(d) !== f)
      throw new Error(`Conflicting candle observation ${l.observationId}`);
    a.set(l.observationId, l);
  }
  const o = [...a.values()].sort(
    (l, u) => l.openTime - u.openTime || l.knownAt - u.knownAt || l.observationId.localeCompare(u.observationId)
  ), s = o.some((l) => l.correctionPublishedAt != null) ? [...new Set(o.filter((l) => l.correctionPublishedAt != null).map((l) => l.knownAt))] : [], c = o.length ? Math.max(...o.map((l) => l.knownAt)) : null;
  for (const l of [.../* @__PURE__ */ new Set([
    ...s,
    ...c == null ? [] : [c]
  ])])
    dn(o.map(_l), n, l);
  return y(o);
}
function Il(e, t) {
  const n = [...e].sort((r, a) => r.knownAt - a.knownAt || r.id.localeCompare(a.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== Di || r.id !== wn(r) || !Tt(r, t))
      throw new Error("Analysis state observation failed provenance verification");
    const a = i.get(r.knownAt);
    if (a && C(a) !== C(r))
      throw new Error(`Conflicting analysis states at ${r.knownAt}`);
    i.set(r.knownAt, r);
  }
  return y([...i.values()]);
}
function kl(e, t) {
  const n = [...e].sort((r, a) => r.knownAt - a.knownAt || r.id.localeCompare(a.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== Hi || r.id !== Vi(r) || !Tt(r, t) || r.knownAt < r.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const a = i.get(r.id);
    if (a && C(a) !== C(r))
      throw new Error(`Conflicting replay known event ${r.id}`);
    i.set(r.id, r);
  }
  return y([...i.values()]);
}
function Ol(e, t) {
  return y(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== Pi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.marketDataSource !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== pn(i))
        throw new Error("Execution-venue evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function Nl(e, t) {
  return y(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== xi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.source !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== hn(i))
        throw new Error("Universe evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function _l(e) {
  return {
    bucket: e.openTime,
    ts: e.openTime,
    x: e.openTime,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    v_base: e.vBase ?? void 0,
    v_quote: e.vQuote ?? void 0,
    ver: e.revision ?? void 0,
    knownAt: e.knownAt
  };
}
function Ml(e, t, n) {
  const i = e.preRollRequirements.filter((a) => a.timeframe === n).reduce(
    (a, o) => Math.max(
      a,
      o.minimumDurationSeconds,
      o.minimumBars * F(n)
    ),
    0
  ), r = n === t.timeframeRoles.candidateTimeframe ? 180 * 86400 : n === t.timeframeRoles.structureTimeframe || t.timeframeRoles.contextTimeframes.includes(n) ? 90 * 86400 : F(n) * 250;
  return Math.max(i, r);
}
function Fl(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: T(e)
  };
}
function Ka(e, t) {
  if (e.id !== t.id || e.version !== t.version || e.profileHash !== t.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function $i(e) {
  const t = [];
  for (const n of e)
    F(n), t.includes(n) || t.push(n);
  if (!t.length) throw new RangeError("At least one timeframe is required");
  return t;
}
function Sr(e, t) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${t} must be a positive integer number of seconds`);
}
function Zn(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
function Tt(e, t) {
  return e.symbol.toUpperCase() === t.symbol.toUpperCase() && e.source === t.source;
}
const Ya = "linear-quote-perpetual-risk.1", Ll = "sizing-result.1", Xa = "trade-plan.1", Dl = "decision-record.1";
function Za(e) {
  const t = [], n = [
    He(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(He("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((O) => !Number.isFinite(O) || O <= 0) && t.push(He("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(He("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && M(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!Kt(e.intendedEntryPrice, e.venueRules.priceTick) || !Kt(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (O) => !Kt(O.targetPrice, e.venueRules.priceTick)
  )) && M(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !Kt(e.leveragePolicy.leverage, e.venueRules.leverageStep) && M(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    He(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const r = e.riskRequest.accountRiskFraction != null, a = e.riskRequest.fixedRiskAmount != null;
  r === a && t.push(
    He(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (r && (!de(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || a && (!de(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && M(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (O) => !Number.isFinite(O) || O < 0
  ) && M(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && M(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const o = a ? e.riskRequest.fixedRiskAmount : r ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (o == null || !Number.isFinite(o) || o <= 0) && M(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Vl(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = de(s) ? s : null, l = de(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && M(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = o != null && u != null && u > 0 ? o / u : null;
  let d = f == null ? null : Cr(f, e.venueRules.quantityStep);
  if (d != null && o != null && u != null)
    for (; d > 0 && d * u > o + Math.max(1e-10, o * 1e-12); )
      d = Cr(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = d != null && d > 0 ? d : null, v = m == null ? null : m * e.intendedEntryPrice, p = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, h = m == null || l == null ? null : m * l * e.executionAssumptions.stopExitFeeRate, A = m == null || u == null ? null : m * u;
  (m == null || m < e.venueRules.minQuantity) && M(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && M(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const b = e.riskRequest.maximumNotional;
  b != null && v != null && v > b && M(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${b}`
  );
  const E = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, _ = e.accountState.availableBalance == null ? E : Math.min(E, e.accountState.availableBalance), P = v != null && _ > 0 ? v / _ : null, w = jl(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  w != null && w > e.venueRules.maxLeverage && M(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${w} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const g = v != null && w != null && w > 0 ? v / w : null;
  g != null && g > E + 1e-10 && M(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), g != null && e.accountState.availableBalance != null && g > e.accountState.availableBalance + 1e-10 && M(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const S = m != null && c != null && l != null ? m * (l - c) : null, I = $l(
    e.targets,
    m,
    c,
    S,
    A,
    e.executionAssumptions
  ), H = Yt(
    I.map((O) => O.grossReward * O.positionFraction)
  ), j = Yt(
    I.map((O) => O.netProjectedReward * O.positionFraction)
  ), N = Yt(
    I.map(
      (O) => O.weightedGrossRContribution == null ? null : O.weightedGrossRContribution
    )
  ), B = Yt(
    I.map(
      (O) => O.weightedRContribution == null ? null : O.weightedRContribution
    )
  );
  return y({
    schemaVersion: Ll,
    sizingModelVersion: Ya,
    side: e.side,
    riskBudget: o,
    rawQuantity: f,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: v,
    estimatedEntryFee: p,
    estimatedStopFee: h,
    projectedLossAtStop: A,
    projectedLossPercentEquity: A == null || e.accountState.equity <= 0 ? null : A / e.accountState.equity * 100,
    selectedLeverage: w,
    minimumRequiredLeverage: P,
    initialMargin: g,
    marginPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    marginPercentAvailableBalance: g == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : g / e.accountState.availableBalance * 100,
    targetOutcomes: I,
    weightedGrossReward: H,
    weightedProjectedReward: j,
    weightedGrossR: N,
    weightedProjectedR: B,
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
function Hl(e) {
  var a;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = Za({
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
    schemaVersion: Xa,
    snapshotId: e.snapshot.id,
    setupFamily: ke,
    lifecycleVersion: me,
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
    discretionaryOverrideReason: ((a = e.discretionaryOverrideReason) == null ? void 0 : a.trim()) || null,
    status: e.status,
    createdAt: e.createdAt
  }, i = { ...n, id: e.id ?? Ui(n) }, r = Bl({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: i
  });
  return y({ ...i, complianceResult: r });
}
function Bl(e) {
  var d, m;
  const { strategyProfile: t, snapshot: n, plan: i } = e, r = [...i.sizingResult.hardErrors], a = [], o = [...i.sizingResult.warnings], s = Za({
    side: i.side,
    intendedEntryPrice: i.entryPlan.intendedPrice,
    stopPrice: i.stopPlan.stopPrice,
    targets: i.targetPlans,
    accountState: i.accountState,
    riskRequest: i.riskRequest,
    executionAssumptions: i.executionAssumptions,
    venueRules: i.venueRules,
    leveragePolicy: i.leveragePolicy,
    stopDistanceAtr: i.sizingResult.stopDistanceAtr,
    targetFractionTolerance: t.targetPolicy.fractionTolerance
  });
  (Nt(t) !== t.profileHash || Ri(n) !== n.id || Ui(i) !== i.id || C(s) !== C(i.sizingResult)) && M(
    r,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), i.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() && M(
    r,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (n.snapshotSchemaVersion !== Ta || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || i.setupFamily !== t.setupFamily || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash || i.strategyProfileId !== t.id || i.strategyProfileVersion !== t.version || i.strategyProfileHash !== t.profileHash || C(i.executionAssumptions) !== C(t.executionAssumptions)) && M(
    r,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(i.entryPlan.orderPlanType) || M(
    a,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${i.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(i.stopPlan.derivationType) || M(
    a,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${i.stopPlan.derivationType} is not permitted`
  );
  for (const v of i.targetPlans)
    t.targetPolicy.permittedDerivations.includes(v.derivationType) || M(
      a,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  i.targetPlans.length > t.targetPolicy.maximumTargets && M(
    a,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = i.targetPlans.reduce(
    (v, p) => v + p.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && M(
    r,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), zl(n, i, r), Ql(i, r), Ul(n, t, a), ql(n, t, a), t.stopPolicy.requireOutsideEpisodeHigh && ((d = n.candidateEpisode) == null ? void 0 : d.episodeHigh) != null && i.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && M(
    a,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), i.sizingResult.initialMargin != null && i.sizingResult.initialMargin > i.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && M(
    a,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && i.sizingResult.grossNotional != null && i.sizingResult.grossNotional > t.riskPolicy.maximumNotional && M(
    a,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && i.sizingResult.weightedProjectedR != null && i.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && M(
    a,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${i.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), i.sizingResult.projectedLossAtStop != null && i.sizingResult.projectedLossAtStop > i.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && M(
    a,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = a.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), u = ((m = i.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  i.status === "finalized" && a.length > 0 && !l && !u && M(
    r,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return r.length > 0 ? f = "InvalidPlan" : l ? f = "OutOfStrategy" : a.length === 0 ? f = "Compliant" : u ? f = "Overridden" : f = "OutOfStrategy", y({
    classification: f,
    hardErrors: r,
    strategyViolations: a,
    warnings: o,
    overrideReason: u
  });
}
function Mn(e) {
  var i, r;
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
    schemaVersion: Dl,
    sessionId: e.sessionId ?? null,
    snapshotId: e.snapshot.id,
    decisionTime: e.decisionTime,
    action: e.action,
    confidence: e.confidence ?? null,
    thesis: ((i = e.thesis) == null ? void 0 : i.trim()) || null,
    tags: [...e.tags ?? []],
    nextCondition: ((r = e.nextCondition) == null ? void 0 : r.trim()) || null,
    skipReason: e.skipReason ?? null,
    tradePlan: e.tradePlan ?? null
  }, n = e.id ?? `decision:${T(t).slice(8)}`;
  return y({ ...t, id: n });
}
function Vl(e, t, n, i) {
  (!e.length || e.some((a) => a.targetPrice >= t)) && M(i, "NO_VALID_TARGET", "Every short target must be below entry");
  const r = e.reduce((a, o) => a + o.positionFraction, 0);
  (e.some(
    (a) => !Number.isFinite(a.positionFraction) || a.positionFraction <= 0
  ) || Math.abs(r - 1) > n) && M(
    i,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function $l(e, t, n, i, r, a) {
  return t == null || n == null ? [] : e.map((o) => {
    const s = o.targetPrice * (1 + a.adverseTargetSlippageBps / 1e4), c = t * (n - s), l = t * n * a.entryFeeRate, u = t * s * a.targetExitFeeRate, f = c - l - u, d = i != null && i > 0 ? c / i : null, m = r != null && r > 0 ? f / r : null;
    return {
      targetId: o.id,
      targetPrice: o.targetPrice,
      effectiveTargetPrice: s,
      positionFraction: o.positionFraction,
      grossReward: c,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: f,
      grossR: d,
      projectedR: m,
      weightedGrossRContribution: d == null ? null : d * o.positionFraction,
      weightedRContribution: m == null ? null : m * o.positionFraction
    };
  });
}
function Ul(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    M(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (M(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && M(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && M(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const r = e.lifecycleEvidence.some(
    (a) => a.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !r && M(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && M(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function ql(e, t, n) {
  var c;
  const i = t.entryPolicy.requiredDataQuality, r = i.candidateMetricsRequired && e.candidateMetrics == null, a = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, o = i.minimumHistoryCoverageRatio != null && (a == null || a < i.minimumHistoryCoverageRatio), s = e.dataQualityNotes.some(
    (l) => i.rejectedNoteSeverities.includes(l.severity)
  );
  (r || o || s) && M(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function zl(e, t, n) {
  const i = new Map(
    Sa(e).map((a) => [a.id, a])
  ), r = [
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
    ...t.targetPlans.map((a) => ({
      requiresReference: a.derivationType !== "manual" && a.derivationType !== "fixedRMultiple",
      id: a.referenceLevelId,
      reference: a.referenceLevel
    }))
  ];
  for (const a of r) {
    if (!a.id && !a.reference && !a.requiresReference) continue;
    if (!a.id || !a.reference) {
      M(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    a.reference.knownAt > e.effectiveAsOf && M(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${a.id} was not known at the decision cutoff`
    );
    const o = i.get(a.id);
    o ? C(o) !== C(a.reference) && M(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${a.id} differs from the frozen snapshot object`
    ) : M(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${a.id} is absent from the decision snapshot`
    );
  }
}
function Ql(e, t) {
  const n = e.venueRules.priceTick, i = e.entryPlan.associatedReferenceLevel;
  i && Math.abs(e.entryPlan.intendedPrice - i.price) > n + 1e-12 && M(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const r = e.stopPlan.referenceLevel;
  if (r && e.stopPlan.derivationType !== "manual") {
    const a = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? r.rangeHigh ?? r.price : r.price, { basisPoints: o, atrFraction: s, atrValue: c } = e.stopPlan.buffer;
    let l = a;
    o != null && s != null ? M(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : o != null ? l = a * (1 + o / 1e4) : s != null && (de(c ?? 0) ? l = a + s * (c ?? 0) : M(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && M(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const a of e.targetPlans) {
    const o = a.referenceLevel;
    if (!o || a.derivationType === "manual" || a.derivationType === "fixedRMultiple")
      continue;
    (a.derivationType === "supportZone" ? a.targetPrice >= (o.rangeLow ?? o.price) - n && a.targetPrice <= (o.rangeHigh ?? o.price) + n : Math.abs(a.targetPrice - o.price) <= n + 1e-12) || M(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${a.id} does not match its frozen reference`
    );
  }
}
function jl(e, t, n) {
  return e.mode === "manual" ? de(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, Wl(t, n));
}
function Ui(e) {
  const {
    id: t,
    complianceResult: n,
    ...i
  } = e;
  return `trade-plan:${T(i).slice(8)}`;
}
function Cr(e, t) {
  if (!de(e) || !de(t)) return 0;
  const n = Ja(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function Wl(e, t) {
  if (!de(e) || !de(t)) return e;
  const n = Ja(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Ja(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function Kt(e, t) {
  if (!Number.isFinite(e) || !de(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Yt(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function de(e) {
  return Number.isFinite(e) && e > 0;
}
function He(e, t) {
  return { code: e, message: t };
}
function M(e, t, n) {
  e.some((i) => i.code === t) || e.push(He(t, n));
}
const Mt = "execution-engine.1", eo = "execution-profile.1", to = "execution-session.1", Gl = "execution-order.1", Kl = "execution-fill.1", no = "execution-event.1", Yl = "execution-result.1", Xl = "execution-data-bundle.1", qi = "execution-candle.1", io = "execution-trade.1", ro = "execution-quote.1", Zl = "execution-path-resolution.1", zi = "venue-execution-rules.1", Jl = "venue-fee-schedule.1", ao = "funding-observation.1", eu = "position-ledger.1";
var se;
class tu {
  constructor(t) {
    ee(this, se);
    be(this, "fundingDataAvailable");
    be(this, "tradeDataCompleteness");
    be(this, "quoteDataCompleteness");
    this.fundingDataAvailable = t.fundingDataAvailable ?? t.funding !== void 0, this.tradeDataCompleteness = t.tradeDataCompleteness ?? (t.trades ? "partial" : "unavailable"), this.quoteDataCompleteness = t.quoteDataCompleteness ?? (t.quotes ? "partial" : "unavailable"), ae(this, se, y({
      ...t,
      funding: t.funding ?? [],
      fundingDataAvailable: t.fundingDataAvailable ?? t.funding !== void 0,
      trades: t.trades ?? [],
      tradeDataCompleteness: t.tradeDataCompleteness ?? (t.trades ? "partial" : "unavailable"),
      quotes: t.quotes ?? [],
      quoteDataCompleteness: t.quoteDataCompleteness ?? (t.quotes ? "partial" : "unavailable"),
      markPrices: t.markPrices ?? [],
      indexPrices: t.indexPrices ?? [],
      venueRuleEvidence: t.venueRuleEvidence ?? []
    }));
  }
  async getCoverage(t) {
    const n = /* @__PURE__ */ new Map();
    for (const i of R(this, se).candles.filter((r) => Pe(r, t))) {
      const r = n.get(i.timeframe) ?? [];
      r.push(i), n.set(i.timeframe, r);
    }
    return y(Object.fromEntries([...n].map(([i, r]) => [
      i,
      {
        from: Math.min(...r.map((a) => a.openTime)),
        to: Math.max(...r.map((a) => a.closeTime)),
        count: r.length
      }
    ])));
  }
  async loadCandles(t) {
    return y(R(this, se).candles.filter(
      (n) => Pe(n, t) && n.timeframe === t.timeframe && n.openTime >= t.from && n.openTime <= t.to
    ).sort(au));
  }
  async loadTrades(t) {
    return y((R(this, se).trades ?? []).filter(
      (n) => Pe(n, t) && vt(n.eventTime, t)
    ).sort(Xt));
  }
  async loadQuotes(t) {
    return y((R(this, se).quotes ?? []).filter(
      (n) => Pe(n, t) && vt(n.eventTime, t)
    ).sort(Xt));
  }
  async loadMarkPrices(t) {
    return y((R(this, se).markPrices ?? []).filter(
      (n) => Pe(n, t) && vt(n.eventTime, t)
    ).sort(Xt));
  }
  async loadIndexPrices(t) {
    return y((R(this, se).indexPrices ?? []).filter(
      (n) => Pe(n, t) && vt(n.eventTime, t)
    ).sort(Xt));
  }
  async loadFundingObservations(t) {
    return y((R(this, se).funding ?? []).filter(
      (n) => Pe(n, t) && vt(n.fundingTime, t)
    ).sort((n, i) => n.fundingTime - i.fundingTime || n.id.localeCompare(i.id)));
  }
  async loadVenueRuleEvidence(t) {
    return y((R(this, se).venueRuleEvidence ?? []).filter(
      (n) => Pe(n, t)
    ));
  }
}
se = new WeakMap();
function oo(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function nu(e) {
  if (e.schemaVersion !== eo || e.executionEngineVersion !== Mt) throw new Error("Unsupported execution profile schema or engine version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Execution profile id and version are required");
  if (e.ambiguityPolicy !== "StrictAmbiguity")
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  Fn(e.orderActivationPolicy.delaySeconds, "activation delay"), ou(e.maximumExecutionHorizon, "execution horizon"), Fn(
    e.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks"
  ), Fn(
    e.targetFillPolicy.penetrationTicks,
    "target penetration ticks"
  );
  for (const i of [
    e.slippageModel.marketEntryBps,
    e.slippageModel.stopExitBps,
    e.slippageModel.marketExitBps
  ]) if (!Number.isFinite(i) || i < 0) throw new RangeError("Slippage bps must be non-negative");
  const t = [...new Set(e.pathResolutionPolicy.candleTimeframesFinestFirst)];
  if (t.forEach(F), !t.length) throw new RangeError("Execution profile requires candle resolution timeframes");
  const n = y({
    ...e,
    pathResolutionPolicy: { candleTimeframesFinestFirst: t }
  });
  return y({ ...n, canonicalConfigHash: oo(n) });
}
function rm(e) {
  return nu({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: eo,
    executionEngineVersion: Mt,
    supportedInstrumentType: "linearQuotePerpetual",
    supportedPositionMode: "oneWaySinglePosition",
    supportedMarginMode: "isolatedResearch",
    orderActivationPolicy: { delaySeconds: 0 },
    entryFillPolicy: { marketDataPreference: "orderedTradesThenCandles" },
    restingLimitFillPolicy: { policy: "TouchFills", penetrationTicks: 1 },
    stopTriggerPolicy: { source: "last", authorizedFallback: null },
    targetFillPolicy: { policy: "TouchFills", penetrationTicks: 1 },
    slippageModel: {
      model: "FixedBpsSlippage",
      version: "1",
      marketEntryBps: 5,
      stopExitBps: 10,
      marketExitBps: 10
    },
    feePolicy: { requirePointInTimeSchedule: !0 },
    fundingPolicy: { absence: "markIncomplete" },
    pathResolutionPolicy: { candleTimeframesFinestFirst: e },
    maximumExecutionHorizon: 72 * 3600,
    forceCloseAtHorizon: !1,
    ambiguityPolicy: "StrictAmbiguity"
  });
}
function so(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function am(e) {
  if (e.schemaVersion !== Jl)
    throw new Error("Unsupported venue fee schedule schema");
  if (fo(e.effectiveFrom, e.effectiveUntil, "fee schedule"), !Number.isFinite(e.makerRate) || e.makerRate < 0 || !Number.isFinite(e.takerRate) || e.takerRate < 0) throw new RangeError("Fee rates must be non-negative finite values");
  if (!e.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return y({
    ...e,
    canonicalConfigHash: so(e)
  });
}
function Qi(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function iu(e, t) {
  if (e.schemaVersion !== zi)
    throw new Error("Unsupported venue execution rules schema");
  fo(e.effectiveFrom, e.effectiveUntil, "venue rules");
  for (const n of [
    e.priceTick,
    e.quantityStep,
    e.minimumQuantity,
    e.minimumNotional,
    e.maximumLeverage
  ]) if (!Number.isFinite(n) || n <= 0) throw new RangeError("Venue execution limits must be positive");
  for (const [n, i] of [
    [e.maximumQuantity, "maximumQuantity"],
    [e.maximumNotional, "maximumNotional"]
  ])
    if (n != null && (!Number.isFinite(n) || n <= 0))
      throw new RangeError(`${i} must be null or positive`);
  if (e.feeScheduleRef.id !== t.id || e.feeScheduleRef.version !== t.version || e.feeScheduleRef.hash !== t.canonicalConfigHash) throw new Error("Venue execution rules fee schedule reference mismatch");
  if (!e.stopTriggerSources.length || !e.supportedOrderTypes.length)
    throw new RangeError("Venue execution rules require trigger sources and order types");
  if (!e.provenance.trim()) throw new TypeError("Venue rules provenance is required");
  return y({
    ...e,
    symbol: e.symbol.toUpperCase(),
    canonicalConfigHash: Qi({
      ...e,
      symbol: e.symbol.toUpperCase()
    })
  });
}
function om(e, t, n) {
  return iu({
    id: `${e.venue}:${e.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: zi,
    venue: e.venue,
    symbol: e.symbol,
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: n,
    effectiveUntil: null,
    priceTick: e.priceTick,
    quantityStep: e.quantityStep,
    minimumQuantity: e.minQuantity,
    minimumNotional: e.minNotional,
    maximumQuantity: null,
    maximumNotional: null,
    maximumLeverage: e.maxLeverage,
    feeScheduleRef: ru(t),
    stopTriggerSources: ["last"],
    supportedOrderTypes: ["market", "limit", "stopMarket"],
    maintenanceMarginModel: e.maintenanceMarginModel ? {
      id: e.maintenanceMarginModel.modelId,
      version: e.maintenanceMarginModel.version,
      verifiedAt: e.maintenanceMarginModel.verifiedAt
    } : null,
    liquidationModel: e.liquidationModel ? {
      id: e.liquidationModel.modelId,
      version: e.liquidationModel.version,
      verifiedAt: e.liquidationModel.verifiedAt
    } : null,
    fundingConvention: {
      positiveRateMeaning: "longsPayShorts",
      sameTimestampOrdering: "ambiguous"
    },
    provenance: "Research adaptation of frozen TradePlan VenueRiskRules",
    assumptionStatus: "researchAssumption"
  }, t);
}
function ji(e) {
  const t = F(e.timeframe);
  if (!Number.isInteger(e.openTime) || e.openTime < 0 || e.openTime % t !== 0)
    throw new RangeError("Execution candle openTime must align to its timeframe");
  for (const i of [e.o, e.h, e.l, e.c])
    if (!Number.isFinite(i) || i <= 0) throw new RangeError("Execution OHLC must be positive");
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Execution candle high/low do not contain open and close");
  const n = {
    schemaVersion: qi,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    timeframe: e.timeframe,
    openTime: e.openTime,
    closeTime: e.openTime + t,
    knownAt: e.knownAt ?? e.openTime + t,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: e.vBase ?? null,
    sourceObservationId: e.sourceObservationId ?? null
  };
  if (n.knownAt < n.closeTime)
    throw new RangeError("Execution candle knownAt cannot precede closeTime");
  return y({
    ...n,
    id: `execution-candle:${T(n).slice(8)}`
  });
}
function sm(e, t = e.source) {
  return ji({
    venue: t,
    symbol: e.symbol,
    timeframe: e.timeframe,
    openTime: e.openTime,
    knownAt: e.knownAt,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: e.vBase,
    sourceObservationId: e.observationId
  });
}
function co(e) {
  Me(e.eventTime, "trade eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (Me(t, "trade knownAt"), t < e.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(e.price) || e.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(e.quantity) || e.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const n = {
    schemaVersion: io,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: t,
    price: e.price,
    quantity: e.quantity,
    side: e.side
  };
  return y({
    ...n,
    id: `execution-trade:${T(n).slice(8)}`
  });
}
function lo(e) {
  Me(e.eventTime, "quote eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (Me(t, "quote knownAt"), t < e.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (!Number.isFinite(e.bid) || !Number.isFinite(e.ask) || e.bid <= 0 || e.ask <= 0 || e.bid > e.ask) throw new RangeError("Quote requires positive bid <= ask");
  const n = {
    schemaVersion: ro,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: t,
    bid: e.bid,
    ask: e.ask
  };
  return y({
    ...n,
    id: `execution-quote:${T(n).slice(8)}`
  });
}
function uo(e) {
  Me(e.fundingTime, "fundingTime");
  const t = e.knownAt ?? e.fundingTime;
  if (Me(t, "funding knownAt"), t < e.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(e.rate)) throw new RangeError("Funding rate must be finite");
  if (e.markPrice != null && (!Number.isFinite(e.markPrice) || e.markPrice <= 0))
    throw new RangeError("Funding mark price must be positive");
  const n = {
    schemaVersion: ao,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    fundingTime: e.fundingTime,
    knownAt: t,
    rate: e.rate,
    rateConvention: e.rateConvention ?? "positiveLongsPayShorts",
    markPrice: e.markPrice ?? null,
    markPriceSource: e.markPriceSource ?? null,
    dataProvenance: e.dataProvenance
  };
  return y({
    ...n,
    id: `funding-observation:${T(n).slice(8)}`
  });
}
function ru(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function Pe(e, t) {
  return e.venue.toLowerCase() === t.venue.toLowerCase() && e.symbol.toUpperCase() === t.symbol.toUpperCase();
}
function vt(e, t) {
  return e >= t.from && e <= t.to;
}
function au(e, t) {
  return e.openTime - t.openTime || e.knownAt - t.knownAt || e.id.localeCompare(t.id);
}
function Xt(e, t) {
  return e.eventTime - t.eventTime || e.id.localeCompare(t.id);
}
function fo(e, t, n) {
  if (e != null && Me(e, `${n} effectiveFrom`), t != null && Me(t, `${n} effectiveUntil`), e != null && t != null && t <= e)
    throw new RangeError(`${n} effectiveUntil must follow effectiveFrom`);
}
function Fn(e, t) {
  if (!Number.isInteger(e) || e < 0) throw new RangeError(`${t} must be non-negative`);
}
function ou(e, t) {
  if (!Number.isInteger(e) || e <= 0) throw new RangeError(`${t} must be positive`);
}
function Me(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
async function cm(e) {
  su(e);
  const t = e.replayFrame.effectiveAsOf, i = t + e.executionProfile.orderActivationPolicy.delaySeconds + e.executionProfile.maximumExecutionHorizon, r = Math.max(
    ...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(F)
  ), a = {
    venue: e.venueRules.venue,
    symbol: e.venueRules.symbol,
    from: t,
    to: i + (e.executionProfile.forceCloseAtHorizon ? r : 0)
  }, o = {};
  for (const b of e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const E = await e.historicalDataAdapter.loadCandles({ ...a, timeframe: b });
    cu(E, a.venue, a.symbol, b), o[b] = E;
  }
  const s = await Ze(e.historicalDataAdapter.loadTrades, e.historicalDataAdapter, a), c = await Ze(e.historicalDataAdapter.loadQuotes, e.historicalDataAdapter, a), l = await Ze(e.historicalDataAdapter.loadMarkPrices, e.historicalDataAdapter, a), u = await Ze(e.historicalDataAdapter.loadIndexPrices, e.historicalDataAdapter, a), f = e.historicalDataAdapter.fundingDataAvailable ?? e.historicalDataAdapter.loadFundingObservations != null, d = await Ze(
    e.historicalDataAdapter.loadFundingObservations,
    e.historicalDataAdapter,
    a
  ), m = await Ze(
    e.historicalDataAdapter.loadVenueRuleEvidence,
    e.historicalDataAdapter,
    a
  );
  if (lu(s, c, l, u, d, a.venue, a.symbol), e.historicalDataAdapter.tradeDataCompleteness === "complete" && s.some((b) => b.knownAt !== b.eventTime)) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
  const v = {
    candlesByTimeframe: o,
    trades: s,
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: c,
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: l,
    indexPrices: u,
    funding: d
  }, p = {
    candlesByTimeframe: Object.fromEntries(Object.entries(o).map(([b, E]) => [
      b,
      E.filter((_) => _.knownAt <= t)
    ])),
    trades: s.filter((b) => b.knownAt <= t),
    quotes: c.filter((b) => b.knownAt <= t),
    markPrices: l.filter((b) => b.knownAt <= t),
    indexPrices: u.filter((b) => b.knownAt <= t)
  }, h = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...e.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : [],
    ...e.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : [],
    ...f ? [] : ["FUNDING_DATA_UNAVAILABLE"],
    ...e.venueRules.liquidationModel ? [] : ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"],
    ...s.length && e.historicalDataAdapter.tradeDataCompleteness !== "complete" ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"] : [],
    ...e.executionProfile.stopTriggerPolicy.source !== "last" && e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"] : []
  ], A = {
    schemaVersion: Xl,
    venue: a.venue,
    symbol: a.symbol,
    from: a.from,
    to: a.to,
    candlesByTimeframe: y(o),
    trades: y(s),
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: y(c),
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: y(l),
    indexPrices: y(u),
    funding: y(d),
    fundingDataAvailable: f,
    venueRuleEvidence: y(m),
    causalPrefixFingerprint: await it(p),
    internalBundleFingerprint: await it(v),
    fundingDataFingerprint: f ? await it(d.filter((b) => b.knownAt <= t)) : null,
    dataQualityNotes: h
  };
  return y({
    replaySession: e.replaySession,
    replayFrame: e.replayFrame,
    tradePlan: e.tradePlan,
    strategyProfile: e.strategyProfile,
    executionProfile: e.executionProfile,
    venueRules: e.venueRules,
    feeSchedule: e.feeSchedule,
    dataBundle: A
  });
}
function su(e) {
  const { replaySession: t, replayFrame: n, tradePlan: i, strategyProfile: r, executionProfile: a, venueRules: o, feeSchedule: s } = e;
  if (n.sessionId !== t.id || n.id !== t.currentFrameId)
    throw new Error("Execution frame does not match the replay session");
  if (t.state !== "TradePlanRecorded" && t.state !== "Revealed") throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (n.decisionSnapshot.id !== i.snapshotId || Ri(n.decisionSnapshot) !== n.decisionSnapshot.id || i.id !== Ui(i) || i.schemaVersion !== Xa || i.status !== "finalized" || i.side !== "short" || i.complianceResult.hardErrors.length > 0) throw new Error("Execution requires an intact finalized short TradePlan");
  if (!t.planningAttempts.some(
    (h) => h.accepted && h.frameId === n.id && h.tradePlan.id === i.id
  )) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (Nt(r) !== r.profileHash || i.strategyProfileId !== r.id || i.strategyProfileVersion !== r.version || i.strategyProfileHash !== r.profileHash || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (a.canonicalConfigHash !== oo(a))
    throw new Error("Execution profile hash mismatch");
  if (o.canonicalConfigHash !== Qi(o))
    throw new Error("Venue execution rules hash mismatch");
  if (s.canonicalConfigHash !== so(s))
    throw new Error("Venue fee schedule hash mismatch");
  const l = n.effectiveAsOf;
  Pr(s, l, "fee schedule"), Pr(o, l, "venue execution rules");
  const u = l + a.orderActivationPolicy.delaySeconds + a.maximumExecutionHorizon + (a.forceCloseAtHorizon ? Math.max(...a.pathResolutionPolicy.candleTimeframesFinestFirst.map(F)) : 0);
  if (s.effectiveUntil != null && s.effectiveUntil <= u || o.effectiveUntil != null && o.effectiveUntil <= u) throw new Error("Selected fee schedule and venue rules must cover the execution horizon");
  if (o.venue.toLowerCase() !== i.venueRules.venue.toLowerCase() || o.symbol !== i.venueRules.symbol.toUpperCase() || o.quantityStep !== i.venueRules.quantityStep || o.priceTick !== i.venueRules.priceTick || o.maximumLeverage !== i.venueRules.maxLeverage || o.feeScheduleRef.hash !== s.canonicalConfigHash) throw new Error("Execution rules do not match the frozen planning-rule subset");
  if (i.entryPlan.orderPlanType === "manualReference")
    throw new Error("manualReference is not an executable entry order type");
  const f = i.entryPlan.orderPlanType === "limit" ? "limit" : i.entryPlan.orderPlanType === "stopMarket" ? "stopMarket" : "market";
  if (!o.supportedOrderTypes.includes(f))
    throw new Error(`Venue rules do not support ${f}`);
  if (!o.stopTriggerSources.includes(a.stopTriggerPolicy.source))
    throw new Error("Configured protective-stop trigger source is unsupported by venue rules");
  const d = i.sizingResult.roundedQuantity;
  if (d == null || d <= 0 || !uu(d, o.quantityStep))
    throw new Error("TradePlan has no executable step-aligned quantity");
  const m = d * i.entryPlan.intendedPrice;
  if (d < o.minimumQuantity || m < o.minimumNotional || o.maximumQuantity != null && d > o.maximumQuantity || o.maximumNotional != null && m > o.maximumNotional || (i.sizingResult.selectedLeverage ?? Number.POSITIVE_INFINITY) > o.maximumLeverage) throw new Error("TradePlan exceeds selected venue execution limits");
  if (!a.pathResolutionPolicy.candleTimeframesFinestFirst.includes(
    r.timeframeRoles.executionTimeframe
  )) throw new Error("Execution profile must include the strategy execution timeframe");
  const v = i.sizingResult.initialMargin;
  if (v == null || v <= 0) throw new Error("TradePlan has no initial margin");
  const p = i.entryPlan.intendedPrice + v / d;
  if (i.stopPlan.stopPrice >= p)
    throw new Error("Planned stop reaches the bankruptcy bound without a verified liquidation model");
}
function Pr(e, t, n) {
  if (e.effectiveFrom != null && t < e.effectiveFrom || e.effectiveUntil != null && t >= e.effectiveUntil) throw new Error(`${n} is not effective at the decision time`);
}
async function Ze(e, t, n) {
  return e ? e.call(t, n) : [];
}
function cu(e, t, n, i) {
  const r = /* @__PURE__ */ new Set();
  let a = -1;
  for (const o of e) {
    if (o.schemaVersion !== qi || o.venue.toLowerCase() !== t.toLowerCase() || o.symbol !== n.toUpperCase() || o.timeframe !== i || o.id !== ji(o).id || o.openTime <= a || r.has(o.id)) throw new Error(`Invalid or duplicate execution candle ${o.id}`);
    a = o.openTime, r.add(o.id);
  }
}
function lu(e, t, n, i, r, a, o) {
  const s = [...e, ...t, ...n, ...i], c = /* @__PURE__ */ new Set();
  for (const l of s) {
    if (l.venue.toLowerCase() !== a.toLowerCase() || l.symbol.toUpperCase() !== o.toUpperCase() || l.knownAt < l.eventTime || c.has(l.id)) throw new Error(`Invalid or duplicate execution observation ${l.id}`);
    const u = "price" in l ? co(l).id : lo(l).id;
    if (l.id !== u) throw new Error(`Execution observation identity mismatch ${l.id}`);
    c.add(l.id);
  }
  for (const l of r) {
    if (l.venue.toLowerCase() !== a.toLowerCase() || l.symbol.toUpperCase() !== o.toUpperCase() || l.id !== uo(l).id || c.has(l.id)) throw new Error(`Invalid or duplicate funding observation ${l.id}`);
    c.add(l.id);
  }
}
function uu(e, t) {
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
const xr = "execution-json-data.1";
function fu(e) {
  const t = je(e, "Execution JSON data");
  if (Hn(t, [
    "schemaVersion",
    "venue",
    "symbol",
    "candles",
    "trades",
    "tradeDataCompleteness",
    "quotes",
    "quoteDataCompleteness",
    "markPrices",
    "indexPrices",
    "funding",
    "venueRuleEvidence"
  ], "Execution JSON data"), t.schemaVersion !== xr)
    throw new Error("Unsupported execution JSON data schema");
  const n = Dn(t.venue, "venue"), i = Dn(t.symbol, "symbol").toUpperCase(), r = du(t.candles, n, i), a = mu(t.trades, n, i), o = Ln(t.quotes, n, i, "quotes"), s = Ln(t.markPrices, n, i, "markPrices"), c = Ln(t.indexPrices, n, i, "indexPrices"), l = Ir(t.tradeDataCompleteness, "tradeDataCompleteness"), u = Ir(t.quoteDataCompleteness, "quoteDataCompleteness");
  if (l === "unavailable" && a.length)
    throw new Error("Unavailable trade data cannot contain observations");
  if (u === "unavailable" && o.length)
    throw new Error("Unavailable quote data cannot contain observations");
  const f = je(t.funding, "funding");
  let d;
  if (f.availability === "available")
    Hn(f, ["availability", "observations"], "available funding"), d = {
      availability: "available",
      observations: vu(f.observations, n, i)
    };
  else if (f.availability === "unavailable")
    Hn(f, ["availability", "reason"], "unavailable funding"), d = {
      availability: "unavailable",
      reason: Dn(f.reason, "funding reason")
    };
  else
    throw new Error("Funding availability must be available or unavailable");
  const m = Lt(t.venueRuleEvidence, "venueRuleEvidence").map((v, p) => yu(v, n, i, p));
  return hu([
    ...r,
    ...a,
    ...o,
    ...s,
    ...c,
    ...d.availability === "available" ? d.observations : [],
    ...m
  ]), y({
    schemaVersion: xr,
    venue: n,
    symbol: i,
    candles: pu(r),
    trades: Zt(a),
    tradeDataCompleteness: l,
    quotes: Zt(o),
    quoteDataCompleteness: u,
    markPrices: Zt(s),
    indexPrices: Zt(c),
    funding: d.availability === "available" ? {
      availability: "available",
      observations: [...d.observations].sort(
        (v, p) => v.fundingTime - p.fundingTime || v.knownAt - p.knownAt || v.id.localeCompare(p.id)
      )
    } : d,
    venueRuleEvidence: [...m].sort(
      (v, p) => (v.effectiveFrom ?? -1) - (p.effectiveFrom ?? -1) || v.id.localeCompare(p.id)
    )
  });
}
var ce;
class lm {
  constructor(t) {
    be(this, "fundingDataAvailable");
    be(this, "tradeDataCompleteness");
    be(this, "quoteDataCompleteness");
    ee(this, ce);
    const n = fu(t);
    this.fundingDataAvailable = n.funding.availability === "available", this.tradeDataCompleteness = n.tradeDataCompleteness, this.quoteDataCompleteness = n.quoteDataCompleteness, ae(this, ce, new tu({
      candles: n.candles,
      trades: n.trades,
      tradeDataCompleteness: n.tradeDataCompleteness,
      quotes: n.quotes,
      quoteDataCompleteness: n.quoteDataCompleteness,
      markPrices: n.markPrices,
      indexPrices: n.indexPrices,
      funding: n.funding.availability === "available" ? n.funding.observations : [],
      fundingDataAvailable: this.fundingDataAvailable,
      venueRuleEvidence: n.venueRuleEvidence
    }));
  }
  getCoverage(t) {
    return R(this, ce).getCoverage(t);
  }
  loadCandles(t) {
    return R(this, ce).loadCandles(t);
  }
  loadTrades(t) {
    return R(this, ce).loadTrades(t);
  }
  loadQuotes(t) {
    return R(this, ce).loadQuotes(t);
  }
  loadMarkPrices(t) {
    return R(this, ce).loadMarkPrices(t);
  }
  loadIndexPrices(t) {
    return R(this, ce).loadIndexPrices(t);
  }
  loadFundingObservations(t) {
    return R(this, ce).loadFundingObservations(t);
  }
  loadVenueRuleEvidence(t) {
    return R(this, ce).loadVenueRuleEvidence(t);
  }
}
ce = new WeakMap();
function du(e, t, n) {
  const i = /* @__PURE__ */ new Set();
  return Lt(e, "candles").map((r, a) => {
    const o = je(r, `candles[${a}]`);
    if (o.schemaVersion !== qi) throw new Error(`Invalid candle schema at ${a}`);
    const s = ji(o);
    Tn(o, s, `candle ${a}`), Ft(s, t, n, `candle ${a}`);
    const c = `${s.timeframe}:${s.openTime}`;
    if (i.has(c)) throw new Error(`Duplicate candle interval ${c}`);
    return i.add(c), s;
  });
}
function mu(e, t, n) {
  return Lt(e, "trades").map((i, r) => {
    const a = je(i, `trades[${r}]`);
    if (a.schemaVersion !== io) throw new Error(`Invalid trade schema at ${r}`);
    const o = co(a);
    return Tn(a, o, `trade ${r}`), Ft(o, t, n, `trade ${r}`), o;
  });
}
function Ln(e, t, n, i) {
  return Lt(e, i).map((r, a) => {
    const o = je(r, `${i}[${a}]`);
    if (o.schemaVersion !== ro) throw new Error(`Invalid quote schema at ${i}[${a}]`);
    const s = lo(o);
    return Tn(o, s, `${i}[${a}]`), Ft(s, t, n, `${i}[${a}]`), s;
  });
}
function vu(e, t, n) {
  return Lt(e, "funding observations").map((i, r) => {
    const a = je(i, `funding[${r}]`);
    if (a.schemaVersion !== ao) throw new Error(`Invalid funding schema at ${r}`);
    const o = uo(a);
    return Tn(a, o, `funding ${r}`), Ft(o, t, n, `funding ${r}`), o;
  });
}
function yu(e, t, n, i) {
  const r = je(e, `venueRuleEvidence[${i}]`);
  if (r.schemaVersion !== zi || r.canonicalConfigHash !== Qi(r)) throw new Error(`Invalid venue-rule evidence at ${i}`);
  return Ft(r, t, n, `venueRuleEvidence[${i}]`), y(r);
}
function Tn(e, t, n) {
  if (C(e) !== C(t))
    throw new Error(`Non-canonical or unknown fields in ${n}`);
}
function Ft(e, t, n, i) {
  if (e.venue.toLowerCase() !== t.toLowerCase() || e.symbol.toUpperCase() !== n)
    throw new Error(`${i} instrument identity mismatch`);
}
function hu(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e) {
    if (t.has(n.id)) throw new Error(`Duplicate execution observation id ${n.id}`);
    t.add(n.id);
  }
}
function Ir(e, t) {
  if (e !== "complete" && e !== "partial" && e !== "unavailable")
    throw new Error(`${t} must be complete, partial, or unavailable`);
  return e;
}
function pu(e) {
  return [...e].sort(
    (t, n) => t.openTime - n.openTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function Zt(e) {
  return [...e].sort(
    (t, n) => t.eventTime - n.eventTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function je(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new TypeError(`${t} must be an object`);
  return e;
}
function Lt(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function Dn(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} must be a non-empty string`);
  return e;
}
function Hn(e, t, n) {
  const i = [...t].sort(), r = Object.keys(e).sort();
  if (C(r) !== C(i))
    throw new Error(`${n} has missing or unknown fields`);
}
const gu = "execution-reveal-envelope.1";
function um(e) {
  const { replaySession: t, replayOutcomeEnvelope: n, executionSession: i } = e, { id: r, ...a } = n;
  if (n.schemaVersion !== Li || n.id !== `replay-outcome:${T(a).slice(8)}` || t.state !== "Revealed" || t.revealedOutcomeEnvelopeId == null || t.revealedOutcomeEnvelopeId !== n.id || n.sessionId !== t.id) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (i.replaySessionId !== t.id || i.result == null || !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(i.state)) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (i.result.executionSessionId !== i.id)
    throw new Error("Execution result identity mismatch");
  if (!Number.isFinite(e.revealedAt) || e.revealedAt < 0)
    throw new RangeError("Execution reveal time must be a valid timestamp");
  const o = {
    schemaVersion: gu,
    replaySessionId: t.id,
    replayOutcomeEnvelopeId: n.id,
    executionSessionId: i.id,
    revealedAt: e.revealedAt,
    caseOutcomeEnvelope: n,
    executionResult: i.result,
    executionEvents: i.executionEvents
  };
  return y({
    ...o,
    id: `execution-reveal:${T(o).slice(8)}`
  });
}
const we = /* @__PURE__ */ new Set([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed"
]);
function Wi(e) {
  Wu(e);
  const t = e.tradePlan, n = e.replayFrame, i = n.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, r = {
    schemaVersion: to,
    replaySessionId: e.replaySession.id,
    replayFrameId: n.id,
    decisionSnapshotId: n.decisionSnapshot.id,
    tradePlanId: t.id,
    tradePlanSchemaVersion: t.schemaVersion,
    strategyProfileRef: {
      id: e.strategyProfile.id,
      version: e.strategyProfile.version,
      hash: e.strategyProfile.profileHash
    },
    lifecycleVersion: t.lifecycleVersion,
    lifecycleConfigHash: t.lifecycleConfigHash,
    sizingModelVersion: t.sizingResult.sizingModelVersion,
    replayEngineVersion: e.replaySession.replayEngineVersion,
    executionEngineVersion: Mt,
    executionProfileRef: nn(e.executionProfile),
    venueRulesRef: nn(e.venueRules),
    feeScheduleRef: nn(e.feeSchedule),
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: e.dataBundle.fundingDataFingerprint,
    decisionTime: n.effectiveAsOf,
    orderActivationTime: i,
    executionHorizonTime: i + e.executionProfile.maximumExecutionHorizon
  }, a = {
    ...r,
    id: `execution-session:${T(r).slice(8)}`
  }, o = {
    ...a,
    revision: 0,
    currentAsOf: a.decisionTime,
    state: "Created",
    stateSince: a.decisionTime,
    orders: [],
    fills: [],
    positionLedger: $u(e),
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [...e.dataBundle.dataQualityNotes],
    errors: []
  };
  return U(o, {
    type: "ExecutionCreated",
    eventTime: a.decisionTime,
    processingAsOf: a.decisionTime,
    explanation: "Execution inputs validated and bound to the finalized TradePlan"
  }), er(o);
}
function Au(e, t, n) {
  if (tr(e), Gu(e, t), Zu(n, "targetAsOf"), n < e.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (we.has(e.state)) return y(e);
  const i = wu(t, n);
  if (i.executionEvents.length < e.executionEvents.length)
    throw new Error("Execution target precedes already processed causal events");
  const r = i.executionEvents.slice(0, e.executionEvents.length);
  if (C(r) !== C(e.executionEvents))
    throw new Error("Execution history changed under the same session identity");
  return i;
}
function bu(e, t) {
  const n = t.executionProfile.forceCloseAtHorizon ? 2 * Math.max(...t.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(F)) : 0;
  return Au(e, t, e.executionHorizonTime + n);
}
function fm(e) {
  return bu(Wi(e), e);
}
function wu(e, t) {
  const n = Wi(e), i = Ku(n);
  if (t < i.orderActivationTime) return n;
  Eu(i, e);
  const r = e.executionProfile.forceCloseAtHorizon ? t : Math.min(t, i.executionHorizonTime), a = Tu(e, r), o = e.dataBundle.funding.filter((c) => c.knownAt <= r);
  let s = 0;
  for (const c of a) {
    if (we.has(i.state)) break;
    for (; s < o.length && o[s].fundingTime < c.eventTime && (Bn(i, e, o[s++], null), !we.has(i.state)); )
      ;
    if (we.has(i.state) || Mu(i, e, c.eventTime, t)) break;
    if (e.executionProfile.forceCloseAtHorizon && c.eventTime >= i.executionHorizonTime && (i.state === "Open" || i.state === "PartiallyClosed")) {
      mo(i, e, c);
      break;
    }
    Cu(i, e, c);
    const l = i.fills.length;
    Pu(i, e, c);
    const u = i.fills.length > l;
    for (; s < o.length && o[s].fundingTime >= c.eventTime && o[s].fundingTime < c.intervalEnd && (Bn(i, e, o[s++], u ? c : null), !we.has(i.state)); )
      ;
    we.has(i.state) || U(i, {
      type: "PathResolved",
      eventTime: c.intervalEnd,
      processingAsOf: c.processingAsOf,
      sourceObservationIds: [c.id],
      explanation: `Execution interval resolved with ${c.resolution} ${c.exact ? "ordered" : "OHLC"} data`
    });
  }
  for (; !we.has(i.state) && s < o.length && o[s].fundingTime <= Math.min(t, i.executionHorizonTime); ) Bn(i, e, o[s++], null);
  return we.has(i.state) || _u(i, e, a, t), er(i);
}
function Eu(e, t) {
  const n = t.tradePlan, i = n.entryPlan.orderPlanType === "marketNextAvailable" ? "entryMarket" : n.entryPlan.orderPlanType === "limit" ? "entryLimit" : "entryStopMarket", r = cn(e.id, {
    kind: i,
    side: "sell",
    quantity: n.sizingResult.roundedQuantity,
    remainingQuantity: n.sizingResult.roundedQuantity,
    limitPrice: i === "entryLimit" ? Pt(n.entryPlan.intendedPrice, t.venueRules.priceTick, "up") : null,
    triggerPrice: i === "entryStopMarket" ? Pt(n.entryPlan.intendedPrice, t.venueRules.priceTick, "down") : null,
    activationTime: e.orderActivationTime,
    status: "active",
    reduceOnly: !1,
    parentTargetId: null,
    liquidityAssumption: i === "entryLimit" ? "assumedMaker" : "taker"
  });
  e.orders.push(r), U(e, {
    type: "EntryOrderActivated",
    eventTime: e.orderActivationTime,
    processingAsOf: e.orderActivationTime,
    stateAfter: "PendingEntry",
    orderIds: [r.id],
    quantity: r.quantity,
    referencePrice: r.limitPrice ?? r.triggerPrice,
    explanation: "Finalized entry order became active after the configured causal delay"
  });
}
function Tu(e, t) {
  const n = e.replayFrame.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, i = n + e.executionProfile.maximumExecutionHorizon, r = e.executionProfile.forceCloseAtHorizon ? i + Math.max(...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(F)) : i, a = e.dataBundle.trades.filter(
    (u) => u.knownAt <= t && u.eventTime >= n && u.eventTime <= r
  );
  if (a.length && e.dataBundle.tradeDataCompleteness === "complete") return a.map((u) => ({
    id: u.id,
    eventTime: u.eventTime,
    intervalEnd: u.eventTime,
    processingAsOf: u.knownAt,
    open: u.price,
    high: u.price,
    low: u.price,
    close: u.price,
    resolution: "trade",
    exact: !0
  }));
  const o = e.strategyProfile.timeframeRoles.executionTimeframe, s = e.dataBundle.candlesByTimeframe[o] ?? [], c = [];
  for (const u of s) {
    if (u.knownAt > t || u.closeTime <= n || u.openTime > r) continue;
    const f = Ru(e, u, t) ?? [u];
    for (const d of f)
      d.closeTime <= n || d.openTime > r || c.push(Su(d));
  }
  return [...new Map(c.map((u) => [u.id, u])).values()].sort(
    (u, f) => u.eventTime - f.eventTime || u.processingAsOf - f.processingAsOf || u.id.localeCompare(f.id)
  );
}
function Ru(e, t, n) {
  const i = F(t.timeframe), r = [...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst].filter((a) => F(a) < i).sort((a, o) => F(a) - F(o));
  for (const a of r) {
    const o = F(a), s = i / o;
    if (!Number.isInteger(s)) continue;
    const c = (e.dataBundle.candlesByTimeframe[a] ?? []).filter(
      (f) => f.openTime >= t.openTime && f.closeTime <= t.closeTime && f.knownAt <= Math.min(n, t.knownAt)
    );
    if (c.length !== s) continue;
    let l = t.openTime, u = !0;
    for (const f of c) {
      if (f.openTime !== l) {
        u = !1;
        break;
      }
      l = f.closeTime;
    }
    if (u && l === t.closeTime) return c;
  }
  return null;
}
function Su(e) {
  return {
    id: e.id,
    eventTime: e.openTime,
    intervalEnd: e.closeTime,
    processingAsOf: e.knownAt,
    open: e.o,
    high: e.h,
    low: e.l,
    close: e.c,
    resolution: e.timeframe,
    exact: !1
  };
}
function Cu(e, t, n) {
  const i = {
    schemaVersion: Zl,
    intervalStart: n.eventTime,
    intervalEnd: n.intervalEnd,
    requestedResolution: t.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: n.resolution,
    dataSource: n.exact ? "trades" : "candles",
    dataFingerprint: T([n.id]),
    exactOrApproximate: n.exact ? "exact" : "approximate",
    sourceObservationIds: [n.id],
    ambiguities: []
  }, r = {
    ...i,
    id: `execution-path:${T(i).slice(8)}`
  };
  e.pathResolutionRecords.push(r);
}
function Pu(e, t, n) {
  e.state === "PendingEntry" && xu(e, t, n), (e.state === "Open" || e.state === "PartiallyClosed") && (Bu(e, n), ku(e, t, n));
}
function xu(e, t, n) {
  const i = Xi(e);
  if (!i || n.eventTime < i.activationTime) return;
  let r = null, a = i.liquidityAssumption, o = 0;
  if (i.kind === "entryMarket")
    r = n.open, a = "taker", o = t.executionProfile.slippageModel.marketEntryBps;
  else if (i.kind === "entryLimit") {
    const u = i.limitPrice;
    n.open >= u ? (r = n.open, a = "assumedTaker") : qu(n, u, t.executionProfile.restingLimitFillPolicy, t.venueRules.priceTick) && (r = u, a = "assumedMaker");
  } else {
    const u = i.triggerPrice;
    n.open <= u ? r = n.open : n.low <= u && (r = u), r != null && (a = "taker", o = t.executionProfile.slippageModel.marketEntryBps);
  }
  if (r == null) return;
  const s = Qu(t, n);
  if (!n.exact && i.kind !== "entryMarket" && s.length) {
    sn(e, t, n, [i.id, ...s], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const c = Rn(e, t, i, n, r, a, o, "entry"), l = c.price * c.quantity;
  if (c.quantity < t.venueRules.minimumQuantity || l < t.venueRules.minimumNotional || t.venueRules.maximumQuantity != null && c.quantity > t.venueRules.maximumQuantity || t.venueRules.maximumNotional != null && l > t.venueRules.maximumNotional) {
    Ct(e, t, n.eventTime, n.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(c), Lu(e, t, c), U(e, {
    type: "EntryOrderFilled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    stateAfter: "Open",
    orderIds: [i.id],
    fillIds: [c.id],
    quantity: c.quantity,
    referencePrice: r,
    actualPrice: c.price,
    feeAmount: c.feeAmount,
    sourceObservationIds: [n.id],
    explanation: i.kind === "entryMarket" ? "Short entry filled at the next eligible observation with adverse slippage" : "Short entry filled under the configured deterministic entry policy",
    dataQualityNotes: n.exact ? [] : ["CANDLE_ENTRY_FILL_APPROXIMATION"]
  }), Iu(e, t, c);
}
function Iu(e, t, n) {
  const i = cn(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: n.quantity,
    remainingQuantity: n.quantity,
    limitPrice: null,
    triggerPrice: Pt(t.tradePlan.stopPlan.stopPrice, t.venueRules.priceTick, "up"),
    activationTime: n.eventTime,
    status: "active",
    reduceOnly: !0,
    parentTargetId: null,
    liquidityAssumption: "taker"
  });
  e.orders.push(i), U(e, {
    type: "ProtectiveStopActivated",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: i.quantity,
    referencePrice: i.triggerPrice,
    explanation: "Static reduce-only protective buy stop activated after entry"
  });
  const r = Uu(n.quantity, t.tradePlan.targetPlans.map((a) => ({
    id: a.id,
    fraction: a.positionFraction
  })), t.venueRules.quantityStep);
  for (const a of [...t.tradePlan.targetPlans].sort((o, s) => s.targetPrice - o.targetPrice || o.id.localeCompare(s.id))) {
    const o = r[a.id] ?? 0;
    if (o <= 0) continue;
    const s = cn(e.id, {
      kind: "target",
      side: "buy",
      quantity: o,
      remainingQuantity: o,
      limitPrice: Pt(a.targetPrice, t.venueRules.priceTick, "down"),
      triggerPrice: null,
      activationTime: n.eventTime,
      status: "active",
      reduceOnly: !0,
      parentTargetId: a.id,
      liquidityAssumption: "assumedMaker"
    });
    e.orders.push(s), e.positionLedger.openTargetQuantities[a.id] = o, U(e, {
      type: "TargetActivated",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      orderIds: [s.id],
      quantity: o,
      referencePrice: s.limitPrice,
      explanation: "Static reduce-only target activated after entry"
    });
  }
}
function ku(e, t, n) {
  const i = go(e), r = Ji(e), a = i ? vo(t, n, i.triggerPrice) : null;
  if (a != null && a.unavailable) {
    Ct(
      e,
      t,
      n.eventTime,
      n.processingAsOf,
      `Required ${t.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`
    );
    return;
  }
  const o = (a == null ? void 0 : a.touched) ?? !1, s = r.filter(
    (l) => zu(n, l.limitPrice, t.executionProfile.targetFillPolicy, t.venueRules.priceTick)
  );
  if (!n.exact && o && s.length) {
    sn(
      e,
      t,
      n,
      [i.id, ...s.map((l) => l.id)],
      "STOP_AND_TARGET_INTRABAR_ORDER_UNKNOWN"
    );
    return;
  }
  const c = e.positionLedger.bankruptcyBoundApprox;
  if (c != null && n.high >= c) {
    U(e, {
      type: "BankruptcyBoundCrossed",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      quantity: e.positionLedger.remainingQuantity,
      referencePrice: c,
      sourceObservationIds: [n.id],
      explanation: "Simple isolated-margin bankruptcy bound crossed without a verified liquidation model",
      dataQualityNotes: ["BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL"]
    }), sn(e, t, n, i ? [i.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (o) {
    Nu(e, t, n, i, (a == null ? void 0 : a.referencePrice) ?? i.triggerPrice);
    return;
  }
  for (const l of s.sort((u, f) => f.limitPrice - u.limitPrice || u.id.localeCompare(f.id))) {
    if (e.positionLedger.remainingQuantity <= 0) break;
    Ou(e, t, n, l);
  }
}
function Ou(e, t, n, i) {
  const r = Math.min(i.remainingQuantity, e.positionLedger.remainingQuantity), a = Rn(e, t, i, n, i.limitPrice, "assumedMaker", 0, "target", r);
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(a), Ki(e, a), delete e.positionLedger.openTargetQuantities[i.parentTargetId], U(e, {
    type: "TargetFilled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    fillIds: [a.id],
    quantity: r,
    referencePrice: i.limitPrice,
    actualPrice: a.price,
    feeAmount: a.feeAmount,
    sourceObservationIds: [n.id],
    explanation: "Reduce-only target filled without market slippage",
    dataQualityNotes: n.exact ? [] : ["RESTING_LIMIT_FILL_ASSUMPTION"]
  });
  const o = go(e);
  if (e.positionLedger.remainingQuantity > 0 && o) {
    o.quantity = e.positionLedger.remainingQuantity, o.remainingQuantity = e.positionLedger.remainingQuantity, e.positionLedger.remainingProtectiveStopQuantity = e.positionLedger.remainingQuantity, U(e, {
      type: "ProtectiveStopQuantityAdjusted",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      orderIds: [o.id],
      quantity: o.quantity,
      sourceObservationIds: [n.id],
      explanation: "Protective stop reduced to the exact remaining position"
    }), U(e, {
      type: "PositionPartiallyClosed",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      stateAfter: "PartiallyClosed",
      fillIds: [a.id],
      quantity: e.positionLedger.remainingQuantity,
      sourceObservationIds: [n.id],
      explanation: "A planned target reduced the position"
    });
    return;
  }
  o && Yi(e, o, n, "All planned target quantity filled"), Gi(e, t, n, "AllTargets", a);
}
function Nu(e, t, n, i, r) {
  const a = r;
  U(e, {
    type: "ProtectiveStopTriggered",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: a,
    sourceObservationIds: [n.id],
    explanation: n.open >= i.triggerPrice ? "Protective stop triggered by an adverse gap" : "Protective stop trigger crossed"
  });
  const o = Rn(
    e,
    t,
    i,
    n,
    a,
    "taker",
    t.executionProfile.slippageModel.stopExitBps,
    "stop",
    e.positionLedger.remainingQuantity
  );
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(o), Ki(e, o), e.positionLedger.remainingProtectiveStopQuantity = 0, U(e, {
    type: "ProtectiveStopFilled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    fillIds: [o.id],
    quantity: o.quantity,
    referencePrice: a,
    actualPrice: o.price,
    feeAmount: o.feeAmount,
    sourceObservationIds: [n.id],
    explanation: "Protective buy stop filled with adverse stop slippage"
  });
  for (const c of Ji(e)) Yi(e, c, n, "Protective stop closed the position");
  const s = e.fills.some((c) => {
    var l;
    return ((l = ze(e, c.orderId)) == null ? void 0 : l.kind) === "target";
  });
  Gi(e, t, n, s ? "StopAfterPartialTargets" : "Stop", o);
}
function Gi(e, t, n, i, r) {
  Du(e), e.result = ot(e, t, "Closed", i, null), U(e, {
    type: "PositionClosed",
    eventTime: r.eventTime,
    processingAsOf: r.processingAsOf,
    stateAfter: "Closed",
    fillIds: [r.id],
    quantity: 0,
    actualPrice: r.price,
    sourceObservationIds: [n.id],
    explanation: `Position closed: ${i}`
  });
}
function Bn(e, t, n, i) {
  if (e.state !== "Open" && e.state !== "PartiallyClosed" || e.fundingRecords.some((m) => m.observationId === n.id)) return;
  if (i && t.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    sn(
      e,
      t,
      i,
      Ao(e).map((m) => m.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN"
    );
    return;
  }
  const r = n.markPrice;
  if (r == null) {
    e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE") || e.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), t.executionProfile.fundingPolicy.absence === "requireComplete" && Ct(e, t, n.fundingTime, n.knownAt, "Funding reference price is unavailable");
    return;
  }
  const a = t.venueRules.fundingConvention.sameTimestampOrdering, o = e.fills.filter((m) => m.eventTime === n.fundingTime), s = o.find((m) => m.side === "sell"), c = o.filter((m) => m.side === "buy"), l = a === "fundingBeforePosition" ? Fe(
    e.positionLedger.remainingQuantity + c.reduce((m, v) => m + v.quantity, 0) - ((s == null ? void 0 : s.quantity) ?? 0),
    12
  ) : e.positionLedger.remainingQuantity;
  if (l <= 0) return;
  const u = $(l * r * n.rate), f = {
    observationId: n.id,
    fundingTime: n.fundingTime,
    processingAsOf: Math.max(n.knownAt, (i == null ? void 0 : i.processingAsOf) ?? n.knownAt),
    positionQuantity: l,
    referencePrice: r,
    rate: n.rate,
    amount: u,
    quoteCurrency: t.tradePlan.accountState.quoteCurrency
  }, d = {
    ...f,
    id: `execution-funding:${T(f).slice(8)}`
  };
  e.fundingRecords.push(d), u >= 0 ? e.positionLedger.fundingReceived = $(e.positionLedger.fundingReceived + u) : e.positionLedger.fundingPaid = $(e.positionLedger.fundingPaid + -u), e.positionLedger.netFunding = $(
    e.positionLedger.fundingReceived - e.positionLedger.fundingPaid
  ), Dt(e), U(e, {
    type: "FundingApplied",
    eventTime: n.fundingTime,
    processingAsOf: d.processingAsOf,
    quantity: d.positionQuantity,
    referencePrice: r,
    fundingAmount: u,
    sourceObservationIds: [n.id],
    explanation: u >= 0 ? "Positive funding paid to the open short" : "Negative funding charged to the open short"
  });
}
function _u(e, t, n, i) {
  const r = po(e, t);
  if ((e.state === "Created" || e.state === "PendingEntry") && i >= r) {
    if (!kr(n, r, t)) {
      Ct(e, t, r, i, "Price data does not cover the entry expiry window");
      return;
    }
    const o = Xi(e);
    o && (o.status = "expired", U(e, {
      type: "EntryOrderExpired",
      eventTime: r,
      processingAsOf: r,
      stateAfter: "EntryExpired",
      orderIds: [o.id],
      quantity: o.quantity,
      explanation: "Entry remained unfilled through its deterministic expiry"
    }), e.result = ot(e, t, "EntryExpired", null, null), Jn(e));
    return;
  }
  if (i < e.executionHorizonTime || e.state !== "Open" && e.state !== "PartiallyClosed") return;
  const a = [...n].reverse().find((o) => o.eventTime <= e.executionHorizonTime);
  if (!a || !kr(n, e.executionHorizonTime, t)) {
    Ct(e, t, e.executionHorizonTime, i, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (t.executionProfile.forceCloseAtHorizon) {
    const o = n.find((s) => s.eventTime >= e.executionHorizonTime);
    if (!o) return;
    mo(e, t, o);
    return;
  }
  Hu(e, a.close), U(e, {
    type: "ExecutionHorizonReached",
    eventTime: e.executionHorizonTime,
    processingAsOf: Math.max(e.executionHorizonTime, a.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: a.close,
    sourceObservationIds: [a.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon"
  }), e.result = ot(e, t, "OpenAtHorizon", null, null), Jn(e);
}
function kr(e, t, n) {
  const i = [...e].reverse().find((a) => a.eventTime <= t);
  if (!i) return !1;
  const r = F(n.strategyProfile.timeframeRoles.executionTimeframe);
  return t - i.intervalEnd <= r;
}
function mo(e, t, n) {
  const i = cn(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: e.positionLedger.remainingQuantity,
    remainingQuantity: e.positionLedger.remainingQuantity,
    limitPrice: null,
    triggerPrice: null,
    activationTime: e.executionHorizonTime,
    status: "active",
    reduceOnly: !0,
    parentTargetId: null,
    liquidityAssumption: "taker"
  });
  e.orders.push(i);
  const r = Rn(
    e,
    t,
    i,
    n,
    n.open,
    "taker",
    t.executionProfile.slippageModel.marketExitBps,
    "forcedHorizonClose",
    e.positionLedger.remainingQuantity
  );
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(r), Ki(e, r);
  for (const a of Ao(e).filter((o) => o.id !== i.id))
    Yi(e, a, n, "Forced horizon close cancelled protection");
  U(e, {
    type: "ForcedHorizonClose",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    fillIds: [r.id],
    orderIds: [i.id],
    quantity: r.quantity,
    referencePrice: n.open,
    actualPrice: r.price,
    feeAmount: r.feeAmount,
    sourceObservationIds: [n.id],
    explanation: "Configured research policy forced a market close at the first eligible observation"
  }), Gi(e, t, n, "ForcedHorizonClose", r);
}
function Mu(e, t, n, i) {
  if (e.state !== "PendingEntry") return !1;
  const r = po(e, t);
  if (n < r || i < r) return !1;
  const a = Xi(e);
  return a.status = "expired", U(e, {
    type: "EntryOrderExpired",
    eventTime: r,
    processingAsOf: r,
    stateAfter: "EntryExpired",
    orderIds: [a.id],
    quantity: a.quantity,
    explanation: "Entry expired before the next eligible observation"
  }), e.result = ot(e, t, "EntryExpired", null, null), Jn(e), !0;
}
function sn(e, t, n, i, r) {
  const a = Fu(e, t, n, i), o = a.map((l) => l.estimatedNetPnl).filter((l) => l != null), s = {
    code: r,
    intervalStart: n.eventTime,
    intervalEnd: n.intervalEnd,
    orderIds: i,
    sourceObservationIds: [n.id],
    branches: a,
    lowerNetPnlBound: o.length ? Math.min(...o) : null,
    upperNetPnlBound: o.length ? Math.max(...o) : null,
    explanation: "Available observations do not establish a unique chronological execution path"
  }, c = e.pathResolutionRecords.at(-1);
  c && !c.ambiguities.includes(r) && c.ambiguities.push(r), e.result = ot(e, t, "Ambiguous", null, s), U(e, {
    type: "AmbiguityDetected",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    stateAfter: "Ambiguous",
    orderIds: i,
    sourceObservationIds: [n.id],
    explanation: s.explanation,
    dataQualityNotes: [r]
  });
}
function Fu(e, t, n, i) {
  const r = Zi(e), a = (r == null ? void 0 : r.quantity) ?? t.tradePlan.sizingResult.roundedQuantity, o = r ? e.positionLedger.remainingQuantity : a, s = (r == null ? void 0 : r.price) ?? t.tradePlan.entryPlan.intendedPrice, c = yo(
    Math.max(n.open, t.tradePlan.stopPlan.stopPrice),
    t.executionProfile.slippageModel.stopExitBps,
    "buy",
    t.venueRules.priceTick
  ).price, l = e.positionLedger.realizedGrossPnl, u = e.positionLedger.totalFees || $(a * s * t.feeSchedule.takerRate), f = $(
    l + o * (s - c) - u - o * c * t.feeSchedule.takerRate + e.positionLedger.netFunding
  ), d = [{
    id: `execution-branch:${T([e.id, n.id, "stop-first"]).slice(8)}`,
    label: "stop-first",
    orderedOrderIds: i.filter((p) => {
      var h;
      return p.includes("stop") || ((h = ze(e, p)) == null ? void 0 : h.kind) === "protectiveStop";
    }),
    estimatedNetPnl: f
  }], m = Ji(e).filter((p) => i.includes(p.id)).sort((p, h) => h.limitPrice - p.limitPrice || p.id.localeCompare(h.id)), v = m.length ? m.map((p) => ({ quantity: p.remainingQuantity, price: p.limitPrice, id: p.id })) : [...t.tradePlan.targetPlans].filter((p) => i.includes(p.id)).sort((p, h) => h.targetPrice - p.targetPrice || p.id.localeCompare(h.id)).map((p) => ({
    quantity: ho(a * p.positionFraction, t.venueRules.quantityStep),
    price: p.targetPrice,
    id: p.id
  }));
  if (v.length) {
    let p = o, h = l, A = u;
    const b = [];
    for (const P of v) {
      const w = Math.min(p, P.quantity);
      w <= 0 || (h += w * (s - P.price), A += w * P.price * t.feeSchedule.makerRate, p = Fe(p - w, 12), b.push(P.id));
    }
    i.some((P) => {
      var w;
      return P.includes("stop") || ((w = ze(e, P)) == null ? void 0 : w.kind) === "protectiveStop";
    }) && p > 0 && (h += p * (s - c), A += p * c * t.feeSchedule.takerRate, b.push(...i.filter((P) => {
      var w;
      return P.includes("stop") || ((w = ze(e, P)) == null ? void 0 : w.kind) === "protectiveStop";
    })));
    const _ = $(h - A + e.positionLedger.netFunding);
    d.push({
      id: `execution-branch:${T([e.id, n.id, "target-first"]).slice(8)}`,
      label: "target-first",
      orderedOrderIds: b,
      estimatedNetPnl: _
    });
  }
  return d;
}
function Ct(e, t, n, i, r) {
  e.errors.push(r), e.result = ot(e, t, "Failed", null, null), U(e, {
    type: "ExecutionFailed",
    eventTime: n,
    processingAsOf: i,
    stateAfter: "Failed",
    explanation: r
  });
}
function Rn(e, t, n, i, r, a, o, s, c = n.quantity) {
  const l = o > 0 ? yo(r, o, n.side, t.venueRules.priceTick) : { price: r, adjustment: 0 }, u = o > 0 ? {
    model: t.executionProfile.slippageModel.model,
    version: t.executionProfile.slippageModel.version,
    bps: o,
    referencePrice: r,
    signedPriceAdjustment: l.adjustment,
    finalFillPrice: l.price
  } : null, f = a === "maker" || a === "assumedMaker" ? t.feeSchedule.makerRate : t.feeSchedule.takerRate, d = {
    schemaVersion: Kl,
    orderId: n.id,
    eventTime: i.eventTime,
    processingAsOf: i.processingAsOf,
    side: n.side,
    quantity: c,
    referencePrice: r,
    price: l.price,
    slippage: u,
    liquidityRole: a,
    feeRate: f,
    feeAmount: $(l.price * c * f),
    feeCurrency: t.tradePlan.accountState.quoteCurrency,
    feeScheduleRef: nn(t.feeSchedule),
    sourceObservationIds: [i.id],
    dataQualityNotes: [
      ...i.exact ? [] : [`${s.toUpperCase()}_CANDLE_APPROXIMATION`],
      ...a.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []
    ]
  };
  return {
    ...d,
    id: `execution-fill:${T(d).slice(8)}`
  };
}
function Lu(e, t, n) {
  const i = e.positionLedger;
  i.originalFilledQuantity = n.quantity, i.remainingQuantity = n.quantity, i.averageEntryPrice = n.price, i.initialNotional = $(n.quantity * n.price), i.initialMargin = $(i.initialNotional / i.selectedLeverage), i.maximumMarginUsed = i.initialMargin, i.marginAllocation = i.initialMargin, i.entryFees = n.feeAmount, i.totalFees = n.feeAmount, i.remainingProtectiveStopQuantity = n.quantity, i.bankruptcyBoundApprox = n.price + i.initialMargin / n.quantity, Dt(e);
}
function Ki(e, t) {
  const n = e.positionLedger, i = n.originalFilledQuantity - n.remainingQuantity, r = i + t.quantity;
  n.averageExitPrice = r > 0 ? $(((n.averageExitPrice ?? 0) * i + t.price * t.quantity) / r) : null, n.realizedGrossPnl = $(
    n.realizedGrossPnl + t.quantity * (n.averageEntryPrice - t.price)
  ), n.remainingQuantity = Fe(
    Math.max(0, n.remainingQuantity - t.quantity),
    12
  ), n.exitFees = $(n.exitFees + t.feeAmount), n.totalFees = $(n.entryFees + n.exitFees), n.remainingProtectiveStopQuantity = n.remainingQuantity, Dt(e);
}
function Du(e) {
  const t = e.positionLedger;
  t.remainingQuantity = 0, t.unrealizedGrossPnl = 0, t.unrealizedNetPnlExcludingUnknownFutureCosts = 0, t.remainingProtectiveStopQuantity = 0, t.openTargetQuantities = {}, Dt(e), t.accountEquityAfter = $(t.accountEquityBefore + t.realizedNetPnl);
}
function Hu(e, t) {
  const n = e.positionLedger;
  n.unrealizedGrossPnl = $(n.remainingQuantity * (n.averageEntryPrice - t)), n.unrealizedNetPnlExcludingUnknownFutureCosts = n.unrealizedGrossPnl, Dt(e);
}
function Dt(e) {
  const t = e.positionLedger;
  t.realizedNetPnl = $(t.realizedGrossPnl - t.totalFees + t.netFunding);
}
function Bu(e, t) {
  const n = Zi(e);
  if (!n) return;
  const i = ze(e, n.orderId);
  if (!t.exact && n.eventTime === t.eventTime && (i == null ? void 0 : i.kind) !== "entryMarket") return;
  const r = {
    sourceObservationId: t.id,
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    resolution: t.resolution,
    high: t.high,
    low: t.low
  };
  e.excursionObservations.some((o) => o.sourceObservationId === t.id) || e.excursionObservations.push(r);
  const a = e.positionLedger.remainingQuantity * Math.max(
    0,
    t.high - e.positionLedger.averageEntryPrice
  );
  e.positionLedger.maximumAdverseUnrealizedLoss = $(Math.max(
    e.positionLedger.maximumAdverseUnrealizedLoss,
    a
  ));
}
function ot(e, t, n, i, r) {
  var b;
  const a = Zi(e), o = e.fills.filter((E) => E.side === "buy").map((E) => {
    const _ = ze(e, E.orderId), P = _.kind === "target" ? "target" : i === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: E.id,
      kind: P,
      targetId: _.parentTargetId,
      quantity: E.quantity,
      price: E.price,
      eventTime: E.eventTime,
      grossPnl: a ? $(E.quantity * (a.price - E.price)) : 0,
      fee: E.feeAmount
    };
  }), s = o.find((E) => E.kind === "stop") ?? null, c = Vu(e, a), l = !t.dataBundle.fundingDataAvailable || e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), u = $(
    e.positionLedger.realizedNetPnl + e.positionLedger.unrealizedGrossPnl
  ), f = r ? "ambiguous" : l ? "fundingIncomplete" : "complete", d = f === "complete" ? u : null, m = t.tradePlan.sizingResult.projectedLossAtStop, v = t.tradePlan.sizingResult.riskBudget, p = o.filter((E) => E.kind === "target").map((E) => E.eventTime).sort()[0] ?? null, h = o.length ? Math.max(...o.map((E) => E.eventTime)) : null, A = {
    schemaVersion: Yl,
    executionSessionId: e.id,
    replaySessionId: e.replaySessionId,
    replayFrameId: e.replayFrameId,
    decisionSnapshotId: e.decisionSnapshotId,
    tradePlanId: t.tradePlan.id,
    tradePlanSchemaVersion: e.tradePlanSchemaVersion,
    strategyProfileRef: e.strategyProfileRef,
    lifecycleVersion: e.lifecycleVersion,
    lifecycleConfigHash: e.lifecycleConfigHash,
    sizingModelVersion: e.sizingModelVersion,
    replayEngineVersion: e.replayEngineVersion,
    executionProfileRef: e.executionProfileRef,
    venueRulesRef: e.venueRulesRef,
    feeScheduleRef: e.feeScheduleRef,
    marketDataBundleFingerprint: e.marketDataBundleFingerprint,
    usedMarketDataFingerprint: T(
      e.pathResolutionRecords.flatMap((E) => E.sourceObservationIds)
    ),
    pathResolutionRecords: y(e.pathResolutionRecords),
    fundingDataFingerprint: t.dataBundle.fundingDataAvailable ? T(e.fundingRecords.map((E) => E.observationId)) : null,
    status: n,
    closeReason: i,
    entrySummary: a,
    exitSummary: o,
    targetSummary: o.filter((E) => E.kind === "target"),
    stopSummary: s,
    fundingSummary: {
      received: e.positionLedger.fundingReceived,
      paid: e.positionLedger.fundingPaid,
      net: e.positionLedger.netFunding,
      records: e.fundingRecords.length
    },
    feeSummary: {
      entry: e.positionLedger.entryFees,
      exit: e.positionLedger.exitFees,
      total: e.positionLedger.totalFees,
      currency: t.tradePlan.accountState.quoteCurrency
    },
    plannedRiskBudget: v,
    projectedLossAtStop: m,
    actualRealizedLossOrProfit: e.positionLedger.realizedGrossPnl,
    actualNetPnl: d,
    netPnlExcludingUnknownFunding: u,
    actualNetPnlCompleteness: f,
    budgetR: d != null && v ? d / v : null,
    plannedRiskR: d != null && m ? d / m : null,
    grossR: m ? e.positionLedger.realizedGrossPnl / m : null,
    netR: d != null && m ? d / m : null,
    ...c,
    holdingDuration: a ? (h ?? e.executionHorizonTime) - a.eventTime : null,
    timeToFirstTarget: a && p != null ? p - a.eventTime : null,
    timeToStop: a && s ? s.eventTime - a.eventTime : null,
    timeToFullExit: a && h != null && e.positionLedger.remainingQuantity === 0 ? h - a.eventTime : null,
    initialNotional: e.positionLedger.initialNotional,
    averageEntry: e.positionLedger.averageEntryPrice,
    averageExit: e.positionLedger.averageExitPrice,
    maximumMarginUsed: e.positionLedger.maximumMarginUsed,
    entrySlippage: (a == null ? void 0 : a.slippage) ?? null,
    stopSlippage: s ? ((b = e.fills.find((E) => E.id === s.fillId)) == null ? void 0 : b.slippage) ?? null : null,
    actualVsProjectedStopLoss: s && m ? $(-e.positionLedger.realizedNetPnl - m) : null,
    ambiguity: r,
    dataQualityNotes: [...new Set(e.dataQualityNotes)],
    executionModelVersion: Mt
  };
  return {
    ...A,
    id: `execution-result:${T(A).slice(8)}`
  };
}
function Vu(e, t) {
  if (!t || !e.excursionObservations.length) return {
    maximumAdverseExcursion: null,
    maximumFavorableExcursion: null,
    maePrice: null,
    mfePrice: null,
    maeTime: null,
    mfeTime: null,
    excursionResolution: null
  };
  const n = e.excursionObservations.reduce((r, a) => a.high > r.high ? a : r), i = e.excursionObservations.reduce((r, a) => a.low < r.low ? a : r);
  return {
    maximumAdverseExcursion: Math.max(0, n.high - t.price),
    maximumFavorableExcursion: Math.max(0, t.price - i.low),
    maePrice: n.high,
    mfePrice: i.low,
    maeTime: n.eventTime,
    mfeTime: i.eventTime,
    excursionResolution: ju(e.excursionObservations.map((r) => r.resolution))
  };
}
function U(e, t) {
  const n = e.state, i = e.executionEvents.at(-1);
  if (i && t.processingAsOf < i.processingAsOf)
    throw new Error("Execution event processing time cannot move backward");
  t.stateAfter && t.stateAfter !== n && (bo(n, t.stateAfter), e.state = t.stateAfter, e.stateSince = t.eventTime), e.currentAsOf = Math.max(e.currentAsOf, t.processingAsOf);
  const r = {
    schemaVersion: no,
    executionSessionId: e.id,
    sequence: e.executionEvents.length,
    type: t.type,
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    stateBefore: n,
    stateAfter: e.state,
    orderIds: t.orderIds ?? [],
    fillIds: t.fillIds ?? [],
    quantity: t.quantity ?? null,
    referencePrice: t.referencePrice ?? null,
    actualPrice: t.actualPrice ?? null,
    feeAmount: t.feeAmount ?? null,
    fundingAmount: t.fundingAmount ?? null,
    sourceObservationIds: t.sourceObservationIds ?? [],
    explanation: t.explanation,
    dataQualityNotes: t.dataQualityNotes ?? [],
    ordersAfter: y(e.orders),
    fillsAfter: y(e.fills),
    positionLedgerAfter: y(e.positionLedger),
    pathResolutionRecordsAfter: y(e.pathResolutionRecords),
    fundingRecordsAfter: y(e.fundingRecords),
    excursionObservationsAfter: y(e.excursionObservations),
    resultAfter: y(e.result),
    sessionDataQualityNotesAfter: [...e.dataQualityNotes],
    errorsAfter: [...e.errors]
  }, a = {
    ...r,
    id: `execution-event:${T(r).slice(8)}`
  };
  e.executionEvents.push(a), e.revision = e.executionEvents.length;
}
function Jn(e) {
  const t = e.executionEvents.pop();
  if (!t) throw new Error("Execution has no event to finalize");
  const n = {
    ...t,
    id: void 0,
    sequence: e.executionEvents.length,
    ordersAfter: y(e.orders),
    fillsAfter: y(e.fills),
    positionLedgerAfter: y(e.positionLedger),
    pathResolutionRecordsAfter: y(e.pathResolutionRecords),
    fundingRecordsAfter: y(e.fundingRecords),
    excursionObservationsAfter: y(e.excursionObservations),
    resultAfter: y(e.result),
    sessionDataQualityNotesAfter: [...e.dataQualityNotes],
    errorsAfter: [...e.errors]
  }, { id: i, ...r } = n;
  e.executionEvents.push({
    ...r,
    id: `execution-event:${T(r).slice(8)}`
  }), e.revision = e.executionEvents.length;
}
function Yi(e, t, n, i) {
  t.status = "cancelled", t.remainingQuantity = 0, t.parentTargetId && delete e.positionLedger.openTargetQuantities[t.parentTargetId], U(e, {
    type: "OrderCancelled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [t.id],
    sourceObservationIds: [n.id],
    explanation: i
  });
}
function cn(e, t) {
  const n = { schemaVersion: Gl, ...t };
  return {
    ...n,
    id: `execution-order:${T([e, n]).slice(8)}`
  };
}
function $u(e) {
  return {
    schemaVersion: eu,
    originalFilledQuantity: 0,
    remainingQuantity: 0,
    averageEntryPrice: null,
    averageExitPrice: null,
    initialNotional: 0,
    initialMargin: 0,
    maximumMarginUsed: 0,
    realizedGrossPnl: 0,
    unrealizedGrossPnl: 0,
    entryFees: 0,
    exitFees: 0,
    totalFees: 0,
    fundingReceived: 0,
    fundingPaid: 0,
    netFunding: 0,
    realizedNetPnl: 0,
    unrealizedNetPnlExcludingUnknownFutureCosts: 0,
    accountEquityBefore: e.tradePlan.accountState.equity,
    accountEquityAfter: null,
    remainingProtectiveStopQuantity: 0,
    openTargetQuantities: {},
    selectedLeverage: e.tradePlan.sizingResult.selectedLeverage,
    marginAllocation: 0,
    maximumAdverseUnrealizedLoss: 0,
    bankruptcyBoundApprox: null,
    liquidationEvaluation: e.venueRules.liquidationModel ? "VerifiedModelNotImplemented" : "Unavailable"
  };
}
function Uu(e, t, n) {
  const i = {};
  let r = 0;
  if (t.forEach((a, o) => {
    const s = o === t.length - 1 ? Fe(e - r, ln(n)) : ho(e * a.fraction, n);
    i[a.id] = Math.max(0, s), r = Fe(r + s, ln(n));
  }), r > e + n * 1e-9) throw new Error("Target allocation exceeds filled position");
  return i;
}
function qu(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.high >= t : n.policy === "PenetrationByTicks" ? e.high >= t + n.penetrationTicks * i : e.high >= t;
}
function zu(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.low <= t : n.policy === "PenetrationByTicks" ? e.low <= t - n.penetrationTicks * i : e.low <= t;
}
function vo(e, t, n) {
  const i = e.executionProfile.stopTriggerPolicy.source;
  if (i === "last")
    return {
      touched: t.high >= n,
      referencePrice: t.open >= n ? t.open : n,
      unavailable: !1
    };
  const a = (i === "mark" ? e.dataBundle.markPrices : e.dataBundle.indexPrices).filter(
    (s) => s.eventTime >= t.eventTime && s.eventTime < Math.max(t.intervalEnd, t.eventTime + 1) && s.knownAt <= t.processingAsOf
  ), o = a.find((s) => (s.bid + s.ask) / 2 >= n);
  return o ? {
    touched: !0,
    referencePrice: Math.max(n, (o.bid + o.ask) / 2),
    unavailable: !1
  } : a.length ? { touched: !1, referencePrice: n, unavailable: !1 } : e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? {
    touched: t.high >= n,
    referencePrice: t.open >= n ? t.open : n,
    unavailable: !1
  } : { touched: !1, referencePrice: n, unavailable: !0 };
}
function Qu(e, t) {
  const n = [];
  vo(e, t, e.tradePlan.stopPlan.stopPrice).touched && n.push("planned-stop");
  for (const i of e.tradePlan.targetPlans) t.low <= i.targetPrice && n.push(i.id);
  return n;
}
function yo(e, t, n, i) {
  const r = n === "sell" ? e * (1 - t / 1e4) : e * (1 + t / 1e4), a = Pt(r, i, n === "sell" ? "down" : "up");
  return { price: a, adjustment: $(a - e) };
}
function Pt(e, t, n) {
  const i = n === "up" ? Math.ceil(e / t - 1e-12) : Math.floor(e / t + 1e-12);
  return Fe(i * t, ln(t));
}
function ho(e, t) {
  return Fe(Math.floor(e / t + 1e-12) * t, ln(t));
}
function $(e) {
  return Fe(e, 12);
}
function Fe(e, t) {
  return Number(e.toFixed(Math.min(15, Math.max(t, 0))));
}
function ln(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function po(e, t) {
  return Math.min(
    t.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    e.executionHorizonTime
  );
}
function Xi(e) {
  return e.orders.find((t) => t.kind.startsWith("entry") && t.status === "active") ?? null;
}
function Zi(e) {
  return e.fills.find((t) => {
    var n;
    return (n = ze(e, t.orderId)) == null ? void 0 : n.kind.startsWith("entry");
  }) ?? null;
}
function go(e) {
  return e.orders.find((t) => t.kind === "protectiveStop" && t.status === "active") ?? null;
}
function Ji(e) {
  return e.orders.filter((t) => t.kind === "target" && t.status === "active");
}
function Ao(e) {
  return e.orders.filter(
    (t) => (t.kind === "protectiveStop" || t.kind === "target") && t.status === "active"
  );
}
function ze(e, t) {
  return e.orders.find((n) => n.id === t) ?? null;
}
function nn(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function ju(e) {
  return e.includes("trade") ? "trade" : [...e].sort((t, n) => F(t) - F(n))[0] ?? null;
}
function bo(e, t) {
  if (!{
    Created: ["PendingEntry", "Failed"],
    PendingEntry: ["Open", "EntryExpired", "Ambiguous", "Failed"],
    Open: ["PartiallyClosed", "Closed", "OpenAtHorizon", "Ambiguous", "Failed"],
    PartiallyClosed: ["PartiallyClosed", "Closed", "OpenAtHorizon", "Ambiguous", "Failed"],
    Closed: [],
    EntryExpired: [],
    OpenAtHorizon: [],
    Ambiguous: [],
    Failed: []
  }[e].includes(t)) throw new Error(`Invalid execution transition ${e} -> ${t}`);
}
function Wu(e) {
  if (e.dataBundle.schemaVersion !== "execution-data-bundle.1" || e.executionProfile.executionEngineVersion !== Mt) throw new Error("Execution case identity is invalid");
  if (e.tradePlan.snapshotId !== e.replayFrame.decisionSnapshot.id)
    throw new Error("Execution TradePlan snapshot mismatch");
}
function Gu(e, t) {
  const n = Wi(t), i = ei(e), r = ei(n);
  if (C(i) !== C(r))
    throw new Error("Execution session does not match the loaded case");
}
function Ku(e) {
  const t = JSON.parse(C(e)), { integrityHash: n, ...i } = t;
  return i;
}
function er(e) {
  const t = y(e);
  return y({ ...t, integrityHash: T(t) });
}
function ei(e) {
  return {
    id: e.id,
    schemaVersion: e.schemaVersion,
    replaySessionId: e.replaySessionId,
    replayFrameId: e.replayFrameId,
    decisionSnapshotId: e.decisionSnapshotId,
    tradePlanId: e.tradePlanId,
    tradePlanSchemaVersion: e.tradePlanSchemaVersion,
    strategyProfileRef: e.strategyProfileRef,
    lifecycleVersion: e.lifecycleVersion,
    lifecycleConfigHash: e.lifecycleConfigHash,
    sizingModelVersion: e.sizingModelVersion,
    replayEngineVersion: e.replayEngineVersion,
    executionEngineVersion: e.executionEngineVersion,
    executionProfileRef: e.executionProfileRef,
    venueRulesRef: e.venueRulesRef,
    feeScheduleRef: e.feeScheduleRef,
    marketDataBundleFingerprint: e.marketDataBundleFingerprint,
    fundingDataFingerprint: e.fundingDataFingerprint,
    decisionTime: e.decisionTime,
    orderActivationTime: e.orderActivationTime,
    executionHorizonTime: e.executionHorizonTime
  };
}
function tr(e) {
  if (e.schemaVersion !== to)
    throw new Error("Unsupported execution session schema");
  const { integrityHash: t, ...n } = e;
  if (T(n) !== t) throw new Error("Execution session integrity mismatch");
  const i = Yu(e);
  if (C(i) !== C(e))
    throw new Error("Execution event-log reconstruction differs from direct state");
}
function Yu(e) {
  var i;
  const t = ei(e), n = {
    ...t,
    revision: 0,
    currentAsOf: t.decisionTime,
    state: "Created",
    stateSince: t.decisionTime,
    orders: [],
    fills: [],
    positionLedger: ((i = e.executionEvents[0]) == null ? void 0 : i.positionLedgerAfter) ?? e.positionLedger,
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [],
    errors: []
  };
  for (const r of e.executionEvents) {
    const { id: a, ...o } = r;
    if (r.schemaVersion !== no || r.executionSessionId !== e.id || r.sequence !== n.executionEvents.length || a !== `execution-event:${T(o).slice(8)}` || r.stateBefore !== n.state) throw new Error(`Invalid execution event ${r.id}`);
    if (r.stateAfter !== r.stateBefore && bo(r.stateBefore, r.stateAfter), r.processingAsOf < n.currentAsOf)
      throw new Error(`Execution event processing time moved backward at ${r.id}`);
    n.state = r.stateAfter, r.stateAfter !== r.stateBefore && (n.stateSince = r.eventTime), n.currentAsOf = Math.max(n.currentAsOf, r.processingAsOf), n.orders = y(r.ordersAfter), n.fills = y(r.fillsAfter), n.positionLedger = y(r.positionLedgerAfter), n.pathResolutionRecords = y(r.pathResolutionRecordsAfter), n.fundingRecords = y(r.fundingRecordsAfter), n.excursionObservations = y(r.excursionObservationsAfter), n.result = y(r.resultAfter), n.dataQualityNotes = [...r.sessionDataQualityNotesAfter], n.errors = [...r.errorsAfter], Xu(n, r), n.executionEvents.push(y(r)), n.revision += 1;
  }
  return er(n);
}
function Xu(e, t) {
  const n = /* @__PURE__ */ new Set();
  for (const s of e.orders) {
    if (n.has(s.id) || s.quantity <= 0 || s.remainingQuantity < 0 || s.remainingQuantity > s.quantity) throw new Error(`Invalid execution order snapshot at ${t.id}`);
    n.add(s.id);
  }
  const i = /* @__PURE__ */ new Set();
  let r = 0, a = 0, o = 0;
  for (const s of e.fills) {
    if (i.has(s.id) || !n.has(s.orderId) || s.quantity <= 0 || s.price <= 0 || s.feeAmount < 0) throw new Error(`Invalid execution fill snapshot at ${t.id}`);
    i.add(s.id), s.side === "sell" ? r += s.quantity : a += s.quantity, o += s.feeAmount;
  }
  if (a > r + 1e-9 || Math.abs(e.positionLedger.remainingQuantity - (r - a)) > 1e-8)
    throw new Error(`Execution quantity conservation failed at ${t.id}`);
  if (Math.abs(e.positionLedger.totalFees - $(o)) > 1e-9)
    throw new Error(`Execution fee conservation failed at ${t.id}`);
  if (we.has(e.state) && e.result == null)
    throw new Error(`Terminal execution event has no result at ${t.id}`);
  if (e.result) {
    const { id: s, ...c } = e.result;
    if (s !== `execution-result:${T(c).slice(8)}`)
      throw new Error(`Execution result identity mismatch at ${t.id}`);
  }
}
function dm(e) {
  return tr(e), C(e);
}
function mm(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized execution session must be an object");
  const n = t;
  return tr(n), y(n);
}
function Zu(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
const Ht = _e, We = "replay-analysis-engine.1", wo = "replay-analysis-profile.1", Eo = "replay-analysis-state.2", Ju = "replay-analysis-observation.1", vm = "replay-analysis-frame.1", ef = "replay-analysis-data-bundle.1", To = "avwap-anchor-spec.1", ti = "relative-ratio.1", tf = {
  windowSeconds: 86400,
  historyDays: 180,
  minSamples: 20,
  emaPeriod: 20,
  atrPeriod: 14
}, Or = {
  lookback: 500,
  pivotStrength: 3,
  atrPeriod: 14,
  minMoveAtr: 0.75,
  maxSwings: 120,
  maxBreaks: 24
};
function Ro(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return T(n);
}
function nf(e, t) {
  if (e.schemaVersion !== wo || e.analysisEngineVersion !== We)
    throw new RangeError("Unsupported replay analysis profile version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay analysis profile id and version are required");
  const n = oi(e.evaluatedTimeframes);
  if (!n.includes(e.executionTimeframe))
    throw new RangeError("The execution timeframe must be evaluated");
  for (const r of [
    ...n,
    ...e.contextTimeframes,
    e.stochasticRsiConfig.timeframe,
    e.relativeStrengthConfig.timeframe
  ]) F(r);
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay analysis requires completedCandlesOnly=true");
  if (e.referenceMarketPolicy.allowForwardFill || !e.referenceMarketPolicy.requireExactCompletedCloseAlignment || e.alignmentPolicy !== "exactCompletedClose")
    throw new RangeError("Analysis engine 1 requires exact reference-bar alignment");
  if (t && (e.executionTimeframe !== t.timeframeRoles.executionTimeframe || e.lifecycleConfigRef.configHash !== t.lifecycleConfigHash))
    throw new RangeError("Analysis profile does not match strategy timeframe/lifecycle roles");
  const i = y({
    ...e,
    evaluatedTimeframes: n,
    contextTimeframes: oi(e.contextTimeframes),
    referenceMarketPolicy: {
      ...e.referenceMarketPolicy,
      symbol: e.referenceMarketPolicy.symbol.toUpperCase()
    }
  });
  return y({
    ...i,
    canonicalConfigHash: Ro(i)
  });
}
function ym(e, t = {}) {
  const n = oi([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]), i = e.lifecycleConfigHash;
  return nf(
    {
      id: "impulse_fade_v1.replay-analysis.experimental",
      version: "1",
      schemaVersion: wo,
      analysisEngineVersion: We,
      symbolSourcePolicy: { marketType: "perp", requireConfiguredSource: !0 },
      referenceMarketPolicy: {
        symbol: "BTCUSDT",
        source: null,
        requireExactCompletedCloseAlignment: !0,
        allowForwardFill: !1
      },
      evaluatedTimeframes: n,
      executionTimeframe: e.timeframeRoles.executionTimeframe,
      contextTimeframes: e.timeframeRoles.contextTimeframes,
      extensionConfig: tf,
      stochasticRsiConfig: {
        timeframe: e.timeframeRoles.executionTimeframe,
        rsiPeriod: 14,
        stochPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      },
      structureConfig: Or,
      supportResistanceConfig: {
        maxZones: 6,
        thicknessBps: 10,
        latestX: 0,
        referencePrice: null,
        zonesPerSide: 3
      },
      relativeStrengthConfig: {
        ...Or,
        timeframe: e.timeframeRoles.executionTimeframe,
        formulaVersion: ti,
        minDeltaPct: 0.5,
        maxAgeBars: 240,
        maxDivergences: 16,
        includeDivergences: !0,
        includeLeads: !0,
        includeBreaks: !0
      },
      avwapConfig: { maxSignals: 20, priceBasis: "typical", volumeBasis: "baseThenQuote" },
      lifecycleConfigRef: {
        version: "impulse_fade_v1.lifecycle.1",
        configHash: i
      },
      completedCandlesOnly: !0,
      missingDataPolicy: "componentUnavailable",
      alignmentPolicy: "exactCompletedClose",
      correctionPolicy: "latestKnownRevisionAtCutoff",
      ...t
    },
    e
  );
}
function ni(e) {
  var z, Vt, $t, Ut;
  rf(e);
  const t = So(e), n = e.analysisProfile, i = e.includeComponentProvenance !== !1, r = e.symbol.toUpperCase(), a = n.referenceMarketPolicy.symbol, o = n.referenceMarketPolicy.source ?? e.source, s = {}, c = {};
  for (const x of n.evaluatedTimeframes)
    s[x] = Ie(
      e.candlesByTimeframe[x] ?? [],
      x,
      t
    ), c[x] = Ie(
      e.referenceCandlesByTimeframe[x] ?? [],
      x,
      t
    );
  const l = T({
    schemaVersion: ef,
    symbol: r,
    source: e.source,
    referenceSymbol: a,
    referenceSource: o,
    effectiveAsOf: t,
    targetObservationIds: Hr(s),
    referenceObservationIds: Hr(c),
    anchorObservationIds: (e.avwapAnchors ?? []).filter((x) => x.knownAt <= t && x.selectedAt <= t).map((x) => x.anchorCandleObservationId).sort()
  }), u = T({
    analysisEngineVersion: n.analysisEngineVersion,
    profileHash: n.canonicalConfigHash
  }), f = {}, d = {}, m = {}, v = [], p = [], h = [], A = {}, b = [], E = [];
  for (const x of n.evaluatedTimeframes) {
    const Q = s[x], Ye = ri(
      e.candlesByTimeframe[x] ?? [],
      Q,
      n.extensionConfig
    );
    f[x] = Ye;
    const ut = e.includeIndicatorSeries !== !1, ft = ut && x === n.stochasticRsiConfig.timeframe ? gs(
      Q.candles,
      n.stochasticRsiConfig.rsiPeriod,
      n.stochasticRsiConfig.stochPeriod,
      n.stochasticRsiConfig.kPeriod,
      n.stochasticRsiConfig.dPeriod
    ) : null;
    ut && (d[x] = {
      ema: et(ps(Q.candles, n.extensionConfig.emaPeriod)),
      atr: et(As(Q.candles, n.extensionConfig.atrPeriod)),
      stochRsi: ft ? { k: et(ft.k), d: et(ft.d) } : null,
      configurationHash: T({
        extension: n.extensionConfig,
        stochasticRsi: x === n.stochasticRsiConfig.timeframe ? n.stochasticRsiConfig : null
      })
    });
    const qt = T(n.structureConfig), Ae = sf(
      e.candlesByTimeframe[x] ?? [],
      Q,
      n.structureConfig,
      qt
    ), ns = tt({
      logicalId: `market-structure:${e.source}:${r}:${x}`,
      component: `structure:${x}`,
      timeframe: x,
      eventTime: Ae.summary.updatedTs ?? t,
      knownAt: Math.max(
        ((z = Ae.summary.lastBreak) == null ? void 0 : z.knownAt) ?? 0,
        ((Vt = Ae.summary.lastSwingHigh) == null ? void 0 : Vt.knownAt) ?? 0,
        (($t = Ae.summary.lastSwingLow) == null ? void 0 : $t.knownAt) ?? 0
      ) || t,
      evaluatedAt: t,
      configurationHash: qt,
      sourceObservationIds: Q.replay.map((q) => q.observationId),
      value: Ae
    }, i);
    m[x] = { timeframe: x, observation: ns };
    for (const q of Ae.breaks)
      v.push(tt({
        logicalId: hf(e.source, r, x, q),
        component: "structureEvent",
        timeframe: x,
        eventTime: q.eventTime,
        knownAt: q.knownAt,
        evaluatedAt: ii(q.knownAt, n.executionTimeframe),
        configurationHash: qt,
        sourceObservationIds: ai(Q, q.knownAt),
        value: q
      }, i));
    for (const q of Ls(Ae))
      p.push(yf(e, x, q));
    const Xe = Q.candles.at(-1), is = {
      ...n.supportResistanceConfig,
      latestX: (Xe == null ? void 0 : Xe.x) ?? 0,
      referencePrice: (Xe == null ? void 0 : Xe.c) ?? null
    }, cr = ha(Ae.swings, is);
    E.push(...cr);
    const lr = T(n.supportResistanceConfig);
    for (const q of cr) {
      const ur = pf(Ae.swings, q, e, x);
      h.push(tt({
        logicalId: `sr-zone:${e.source}:${r}:${x}:${q.kind}:${ur[0] ?? q.eventTime}`,
        component: "supportResistanceZone",
        timeframe: x,
        eventTime: q.eventTime,
        knownAt: q.knownAt,
        evaluatedAt: t,
        configurationHash: lr,
        sourceObservationIds: ai(Q, q.knownAt),
        value: { ...q, originatingSwingIds: ur }
      }, i));
    }
    const Pn = `timeframe:${x}`;
    if (A[Pn] = Be(
      Pn,
      t,
      Q,
      u,
      Af(n, x),
      i
    ), A[`extension:${x}`] = Be(
      `extension:${x}`,
      t,
      Q,
      T(n.extensionConfig),
      Math.max(
        n.extensionConfig.emaPeriod,
        n.extensionConfig.atrPeriod + 1,
        Math.ceil(n.extensionConfig.windowSeconds / F(x)) + 1
      ),
      i
    ), A[`structure:${x}`] = Be(
      `structure:${x}`,
      t,
      Q,
      qt,
      n.structureConfig.pivotStrength * 2 + 1,
      i
    ), A[`supportResistance:${x}`] = Be(
      `supportResistance:${x}`,
      t,
      Q,
      lr,
      n.structureConfig.pivotStrength * 2 + 1,
      i
    ), x === n.stochasticRsiConfig.timeframe) {
      const q = n.stochasticRsiConfig.rsiPeriod + n.stochasticRsiConfig.stochPeriod + n.stochasticRsiConfig.kPeriod + n.stochasticRsiConfig.dPeriod - 3;
      A[`stochRsi:${x}`] = Be(
        `stochRsi:${x}`,
        t,
        Q,
        T(n.stochasticRsiConfig),
        q,
        i
      );
    }
    Q.candles.length || b.push(rn("ANALYSIS_COMPONENT_UNAVAILABLE", Pn, "No completed candles"));
  }
  const _ = e.strategyProfile.timeframeRoles.candidateTimeframe, P = s[_] ?? Ie(
    e.candlesByTimeframe[_] ?? [],
    _,
    t
  ), w = of(
    e,
    _,
    P,
    t,
    s,
    f
  );
  for (const x of w.insufficientDataReasons)
    b.push(rn(x.code, `extension:${_}`, x.message));
  A.candidateMetrics = {
    ...Be(
      "candidateMetrics",
      t,
      P,
      T(n.extensionConfig),
      n.extensionConfig.minSamples,
      i
    ),
    status: w.insufficientDataReasons.length ? "insufficientHistory" : "available"
  };
  const g = n.relativeStrengthConfig.timeframe, S = s[g] ?? Ie(
    e.candlesByTimeframe[g] ?? [],
    g,
    t
  ), I = c[g] ?? Ie(
    e.referenceCandlesByTimeframe[g] ?? [],
    g,
    t
  ), H = ff(
    e,
    g,
    S,
    I,
    o
  ), j = H.status === "available" ? Ds(
    S.candles,
    I.candles,
    n.relativeStrengthConfig
  ).map((x) => {
    var ut;
    const Q = ((ut = I.replay.find(
      (ft) => ft.openTime === x.bucket
    )) == null ? void 0 : ut.knownAt) ?? x.knownAt, Ye = Math.max(x.knownAt, Q);
    return tt({
      logicalId: `rs-event:${e.source}:${r}:${g}:${x.kind}:${x.bucket}`,
      component: "relativeStrengthEvent",
      timeframe: g,
      eventTime: x.eventTime,
      knownAt: Ye,
      evaluatedAt: ii(
        Ye,
        e.analysisProfile.executionTimeframe
      ),
      configurationHash: T(n.relativeStrengthConfig),
      sourceObservationIds: bf(S, I, Ye),
      value: { ...x, knownAt: Ye }
    }, i);
  }) : [];
  A.relativeStrength = gf(
    t,
    S,
    I,
    H.status,
    T(n.relativeStrengthConfig),
    i
  ), H.status !== "available" && b.push(rn(
    H.status === "missingSynchronizedReferenceData" ? "MISSING_SYNCHRONIZED_REFERENCE_DATA" : "ANALYSIS_COMPONENT_UNAVAILABLE",
    "relativeStrength",
    "RS-vs-BTC requires exact completed target/reference bar alignment"
  ));
  const N = df(
    e,
    s,
    t,
    i
  );
  b.push(...N.notes), A.avwap = N.freshness;
  const B = cf(
    e,
    _,
    t
  ), O = ((Ut = m[n.executionTimeframe]) == null ? void 0 : Ut.observation.value) ?? null, ie = la({
    symbol: r,
    source: e.source,
    venue: e.source,
    executionTimeframe: n.executionTimeframe,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(s).map(([x, Q]) => [
        x,
        Q.candles
      ])
    ),
    candidateMetrics: B,
    structureEvents: v.map((x) => ({
      ...x.value,
      sourceTimeframe: x.timeframe
    })),
    supportResistanceZones: E,
    avwapEvents: N.events.map((x) => x.value),
    relativeStrengthEvents: j.map((x) => x.value),
    config: e.lifecycleConfig,
    from: e.radarEpisode.detectedAt,
    to: t
  }) ?? vf(e, t, O), re = {
    schemaVersion: Eo,
    replayEngineVersion: Ht,
    analysisEngineVersion: We,
    symbol: r,
    source: e.source,
    requestedAsOf: e.asOf,
    effectiveAsOf: t,
    analysisProfileRef: {
      id: n.id,
      version: n.version,
      hash: n.canonicalConfigHash
    },
    lifecycleConfigRef: n.lifecycleConfigRef,
    radarProfileRef: {
      id: e.radarSelectionProfile.id,
      version: e.radarSelectionProfile.version,
      hash: e.radarSelectionProfile.canonicalConfigHash
    },
    strategyProfileRef: {
      id: e.strategyProfile.id,
      version: e.strategyProfile.version,
      hash: e.strategyProfile.profileHash
    },
    referenceMarket: { symbol: a, source: o },
    dataBundleFingerprint: l,
    candidateMetrics: w,
    extensionContext: f,
    indicatorSeries: d,
    structureByTimeframe: m,
    structureEvents: v,
    activeStructureLevels: p,
    supportResistanceZones: h,
    relativeStrength: H,
    relativeStrengthEvents: j,
    avwapStates: N.states,
    avwapEvents: N.events,
    lifecycleResult: ie,
    setupState: ie,
    coverageByComponent: A,
    freshnessByComponent: A,
    dataQualityNotes: wf(b)
  };
  return y({
    ...re,
    id: `replay-analysis-state:${T(re).slice(8)}`
  });
}
function rf(e) {
  if (!Number.isFinite(e.asOf) || e.asOf < 0)
    throw new RangeError("Analysis asOf must be a non-negative finite timestamp");
  if (Ro(e.analysisProfile) !== e.analysisProfile.canonicalConfigHash)
    throw new Error("Replay analysis profile failed deterministic hash verification");
  if (e.strategyProfile.lifecycleConfigHash !== e.analysisProfile.lifecycleConfigRef.configHash)
    throw new Error("Analysis lifecycle configuration does not match the strategy profile");
  if (e.radarEpisode.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.radarEpisode.source !== e.source)
    throw new Error("Radar episode does not match the materialized instrument");
  const t = e.analysisProfile.referenceMarketPolicy.symbol, n = e.analysisProfile.referenceMarketPolicy.source ?? e.source;
  Nr(
    e.candlesByTimeframe,
    e.symbol,
    e.source,
    e.asOf,
    "target"
  ), Nr(
    e.referenceCandlesByTimeframe,
    t,
    n,
    e.asOf,
    "reference"
  );
}
function Nr(e, t, n, i, r) {
  for (const [a, o] of Object.entries(e)) {
    F(a);
    for (const s of o)
      if (!(s.knownAt > i) && (s.symbol.toUpperCase() !== t.toUpperCase() || s.source !== n || s.timeframe !== a))
        throw new Error(`Materialized ${r} candle identity mismatch for ${a}`);
  }
}
function So(e) {
  const t = e.analysisProfile.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], i = [...new Set(n.map((r) => r.closeTime).filter((r) => r <= e.asOf))].sort((r, a) => a - r);
  for (const r of i)
    if (Ge(n, r).some((a) => a.closeTime === r))
      return r;
  throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
}
function Ie(e, t, n) {
  var f, d, m;
  const i = (d = (f = Vn.get(e)) == null ? void 0 : f.get(t)) == null ? void 0 : d.get(n);
  if (i) return i;
  af(e, t);
  const r = Ge(e, n), a = e.length ? Math.min(...e.map((v) => v.openTime)) : ((m = r[0]) == null ? void 0 : m.openTime) ?? 0, o = F(t), s = Object.freeze(
    r.map((v) => Object.freeze(xo(v, a, o)))
  ), c = Object.freeze({ replay: r, candles: s });
  let l = Vn.get(e);
  l || (l = /* @__PURE__ */ new Map(), Vn.set(e, l));
  let u = l.get(t);
  return u || (u = /* @__PURE__ */ new Map(), l.set(t, u)), Po(u, n, c), c;
}
const Vn = /* @__PURE__ */ new WeakMap(), _r = /* @__PURE__ */ new WeakSet();
function af(e, t) {
  if (Object.isFrozen(e) && _r.has(e)) return;
  const n = e.length ? Math.min(...e.map((a) => a.openTime)) : 0, i = F(t), r = e.length ? Math.max(...e.map((a) => Math.max(a.closeTime, a.knownAt))) : 0;
  dn(
    e.map((a) => xo(a, n, i)),
    t,
    r
  ), Object.isFrozen(e) && _r.add(e);
}
function Ge(e, t) {
  var o;
  const n = (o = $n.get(e)) == null ? void 0 : o.get(t);
  if (n) return n;
  const i = /* @__PURE__ */ new Map();
  for (const s of e) {
    if (s.closeTime > t || s.knownAt > t) continue;
    if (_t(s) !== s.observationId)
      throw new Error(`Candle observation ${s.observationId} failed identity verification`);
    const c = i.get(s.logicalCandleId);
    if (!c || c.knownAt < s.knownAt)
      i.set(s.logicalCandleId, s);
    else if (c.knownAt === s.knownAt && C(c) !== C(s))
      throw new Error(`Conflicting candle revisions for ${s.logicalCandleId}`);
  }
  const r = Object.freeze([...i.values()].sort(
    (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt
  ));
  let a = $n.get(e);
  return a || (a = /* @__PURE__ */ new Map(), $n.set(e, a)), Po(a, t, r), r;
}
const Co = 512, $n = /* @__PURE__ */ new WeakMap();
function Po(e, t, n) {
  for (e.set(t, n); e.size > Co; ) {
    const i = e.keys().next().value;
    if (i == null) break;
    e.delete(i);
  }
}
function xo(e, t, n) {
  return {
    ts: e.openTime,
    bucket: e.openTime,
    x: (e.openTime - t) / n,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    v_base: e.vBase ?? void 0,
    v_quote: e.vQuote ?? void 0,
    ver: e.revision ?? void 0,
    knownAt: e.knownAt
  };
}
function et(e) {
  const t = [];
  for (let n = 0; n < e.length; n += 2)
    t.push({ x: e[n], value: e[n + 1] });
  return t;
}
function ii(e, t) {
  const n = F(t);
  return Math.ceil(e / n) * n;
}
function tt(e, t = !0) {
  const n = {
    schemaVersion: Ju,
    ...e,
    sourceObservationIds: [...new Set(e.sourceObservationIds)].sort()
  };
  return y({
    ...n,
    sourceObservationIds: t ? n.sourceObservationIds : [],
    observationId: `replay-analysis-observation:${T(n).slice(8)}`
  });
}
function of(e, t, n, i, r, a) {
  var p, h, A, b, E, _;
  const o = e.analysisProfile, s = a[t] ?? ri(
    e.candlesByTimeframe[t] ?? [],
    n,
    o.extensionConfig
  ), c = Math.max(0, i - o.extensionConfig.historyDays * 86400), l = ((p = n.replay[0]) == null ? void 0 : p.openTime) ?? null, u = ((h = n.replay.at(-1)) == null ? void 0 : h.closeTime) ?? null, f = i - c, d = l == null || u == null ? null : Math.max(0, u - Math.max(l, c)), m = [];
  (!s.candle || !s.referenceCandle) && m.push({
    code: "INSUFFICIENT_ANALYSIS_HISTORY",
    scope: `extension:${t}`,
    message: `Elapsed ${o.extensionConfig.windowSeconds}s return is unavailable`,
    required: o.extensionConfig.windowSeconds,
    available: d,
    unit: "seconds"
  }), s.rollingReturnCount < o.extensionConfig.minSamples && m.push({
    code: "INSUFFICIENT_ANALYSIS_HISTORY",
    scope: `extension-distribution:${t}`,
    message: `Rolling-return history has ${s.rollingReturnCount}/${o.extensionConfig.minSamples} samples`,
    required: o.extensionConfig.minSamples,
    available: s.rollingReturnCount,
    unit: "samples"
  });
  const v = Object.fromEntries(
    o.evaluatedTimeframes.map((P) => {
      var S, I;
      const w = r[P] ?? Ie(
        e.candlesByTimeframe[P] ?? [],
        P,
        i
      ), g = a[P] ?? ri(
        e.candlesByTimeframe[P] ?? [],
        w,
        o.extensionConfig
      );
      return [P, {
        timeframe: P,
        emaPeriod: o.extensionConfig.emaPeriod,
        atrPeriod: o.extensionConfig.atrPeriod,
        latestTs: ((S = g.candle) == null ? void 0 : S.bucket) ?? null,
        latestClose: ((I = g.candle) == null ? void 0 : I.c) ?? null,
        ema: g.ema,
        atr: g.atr,
        atrExtension: g.atrExtension
      }];
    })
  );
  return y({
    symbol: e.symbol.toUpperCase(),
    exchange: e.source,
    marketType: o.symbolSourcePolicy.marketType,
    source: "external",
    baseTimeframe: t,
    requestedAsOf: e.asOf,
    effectiveAsOf: i,
    sampleCount: n.candles.length,
    historyCoverage: {
      requestedStartTs: c,
      requestedEndTs: i,
      availableStartTs: l,
      availableEndTs: u,
      coveredSeconds: d,
      requestedSeconds: f,
      coverageRatio: d == null || f === 0 ? null : Math.min(1, d / f)
    },
    insufficientDataReasons: m,
    extension: {
      windowSeconds: s.windowSeconds,
      historyDays: o.extensionConfig.historyDays,
      sampleCount: s.rollingReturnCount,
      latestTs: ((A = s.candle) == null ? void 0 : A.bucket) ?? null,
      referenceTs: ((b = s.referenceCandle) == null ? void 0 : b.bucket) ?? null,
      latestClose: ((E = s.candle) == null ? void 0 : E.c) ?? null,
      referenceClose: ((_ = s.referenceCandle) == null ? void 0 : _.c) ?? null,
      returnPct: s.returnPct,
      percentile: s.percentile,
      zScore: s.zScore
    },
    timeframeExtensions: v,
    updatedAt: i
  });
}
const Mr = /* @__PURE__ */ new WeakMap(), Fr = /* @__PURE__ */ new WeakMap(), Lr = /* @__PURE__ */ new WeakMap();
function ri(e, t, n) {
  var s;
  if (!Io(e)) return at(t.candles, n);
  const i = `${((s = t.replay.at(-1)) == null ? void 0 : s.observationId) ?? "empty"}:${T(n)}`;
  let r = Mr.get(e);
  r || (r = /* @__PURE__ */ new Map(), Mr.set(e, r));
  const a = r.get(i);
  if (a) return a;
  const o = at(t.candles, n);
  return ko(r, i, o), o;
}
function sf(e, t, n, i) {
  var c;
  if (!Io(e)) return Oe(t.candles, n);
  const r = `${((c = t.replay.at(-1)) == null ? void 0 : c.observationId) ?? "empty"}:${i}`;
  let a = Fr.get(e);
  a || (a = /* @__PURE__ */ new Map(), Fr.set(e, a));
  const o = a.get(r);
  if (o) return o;
  const s = Oe(t.candles, n);
  return ko(a, r, s), s;
}
function Io(e) {
  const t = Lr.get(e);
  if (t != null) return t;
  const n = e.every((i) => i.correctionPublishedAt == null);
  return Lr.set(e, n), n;
}
function ko(e, t, n) {
  for (e.set(t, n); e.size > Co; ) {
    const i = e.keys().next().value;
    if (i == null) break;
    e.delete(i);
  }
}
function cf(e, t, n) {
  const i = e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [], r = e.candlesByTimeframe[t] ?? [], a = T(e.analysisProfile.extensionConfig);
  let o = Dr.get(i);
  o || (o = /* @__PURE__ */ new WeakMap(), Dr.set(i, o));
  let s = o.get(r);
  s || (s = /* @__PURE__ */ new Map(), o.set(r, s));
  let c = s.get(a);
  c || (c = uf(e, t, i, r), s.set(a, c));
  const l = c.filter(
    (f) => (f.knownAt ?? f.asOf) <= n
  ), u = lf(e.radarEpisode, n);
  return u ? [
    u,
    ...l.filter((f) => f.asOf > u.asOf)
  ] : l;
}
function lf(e, t) {
  var c;
  if (!Number.isFinite(e.detectedAt) || e.detectedAt > t) return null;
  const n = ((c = e.triggeringObservations) == null ? void 0 : c.find(
    (l) => l.knownAt <= e.detectedAt && l.effectiveAsOf <= e.detectedAt && l.value != null && Number.isFinite(l.value)
  )) ?? null, i = e.pathContext, r = Jt(
    (i == null ? void 0 : i.triggeringLocalImpulseReturnPct) ?? (n == null ? void 0 : n.value)
  ), a = Jt(
    (i == null ? void 0 : i.triggeringPercentile) ?? (n == null ? void 0 : n.percentile)
  ), o = Jt((i == null ? void 0 : i.triggeringZScore) ?? (n == null ? void 0 : n.zScore)), s = Jt(i == null ? void 0 : i.currentAtrDisplacement);
  return [r, a, o, s].every((l) => l == null) ? null : {
    asOf: e.detectedAt,
    eventTime: (n == null ? void 0 : n.effectiveAsOf) ?? e.detectedAt,
    knownAt: e.detectedAt,
    metrics: {
      returnPct: r,
      percentile: a,
      zScore: o,
      atrExtension: s
    },
    sampleCount: n == null ? void 0 : n.sampleCount
  };
}
function Jt(e) {
  return e != null && Number.isFinite(e) ? e : null;
}
const Dr = /* @__PURE__ */ new WeakMap();
function uf(e, t, n, i) {
  const r = Math.max(
    0,
    ...n.map((f) => f.knownAt ?? f.closeTime)
  ), a = Ge(n, r), o = Ie(i, t, r);
  let s = -1, c = -2, l = null, u = 0;
  return a.map((f) => {
    for (; s + 1 < o.replay.length && o.replay[s + 1].closeTime <= f.closeTime && (o.replay[s + 1].knownAt ?? o.replay[s + 1].closeTime) <= f.closeTime; ) s += 1;
    if (s !== c || !l) {
      const d = at(
        o.candles.slice(0, s + 1),
        e.analysisProfile.extensionConfig
      );
      c = s, l = {
        returnPct: d.returnPct,
        percentile: d.percentile,
        zScore: d.zScore,
        atrExtension: d.atrExtension
      }, u = d.rollingReturnCount;
    }
    return {
      asOf: f.closeTime,
      eventTime: f.closeTime,
      knownAt: f.closeTime,
      metrics: l,
      sampleCount: u
    };
  });
}
function ff(e, t, n, i, r, a) {
  const o = new Set(n.replay.map((h) => h.openTime)), s = new Map(i.replay.map((h) => [h.openTime, h])), c = [...o].some((h) => !s.has(h)), l = !n.replay.length || !i.replay.length ? "unavailable" : c ? "missingSynchronizedReferenceData" : "available";
  if (l !== "available")
    return {
      targetSymbol: e.symbol.toUpperCase(),
      targetSource: e.source,
      referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
      referenceSource: r,
      formulaVersion: ti,
      normalizationAnchor: null,
      series: [],
      structure: null,
      status: l
    };
  const u = pa(n.candles, i.candles), f = et(u), d = new Map(n.candles.map((h) => [h.x, h])), m = f.map((h) => ({ ...d.get(h.x), o: h.value, h: h.value, l: h.value, c: h.value })), v = n.replay[0], p = s.get(v.openTime);
  return {
    targetSymbol: e.symbol.toUpperCase(),
    targetSource: e.source,
    referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
    referenceSource: r,
    formulaVersion: ti,
    normalizationAnchor: {
      targetObservationId: v.observationId,
      referenceObservationId: p.observationId,
      closeTime: v.closeTime
    },
    series: e.includeComponentProvenance === !1 ? f.slice(-1) : f,
    structure: Oe(m, e.analysisProfile.structureConfig),
    status: l
  };
}
function df(e, t, n, i) {
  var l;
  const r = [], a = [], o = [];
  let s = {
    component: "avwap",
    evaluatedAt: n,
    latestInputCloseTime: null,
    latestInputKnownAt: null,
    status: "unavailable",
    sampleCount: 0,
    requiredCoverage: null,
    availableCoverage: null,
    sourceObservationIds: [],
    configurationHash: T(e.analysisProfile.avwapConfig)
  };
  const c = (e.avwapAnchors ?? []).filter(
    (u) => u.knownAt <= n && u.selectedAt <= n
  );
  if (!c.length)
    return o.push(rn("ANALYSIS_COMPONENT_UNAVAILABLE", "avwap", "No explicit AVWAP anchor was supplied")), { states: r, events: a, notes: o, freshness: s };
  for (const u of c) {
    mf(u, e, t, n);
    const f = t[u.timeframe], d = { anchorBucket: u.anchorTime }, m = _s(f.candles, d), v = f.replay.filter((h) => h.openTime >= u.anchorTime).map((h) => h.observationId), p = tt({
      logicalId: `avwap:${u.id}`,
      component: "avwap",
      timeframe: u.timeframe,
      eventTime: u.anchorTime,
      knownAt: Math.max(
        u.knownAt,
        u.selectedAt,
        ((l = f.replay.at(-1)) == null ? void 0 : l.knownAt) ?? u.knownAt
      ),
      evaluatedAt: n,
      configurationHash: T({ anchor: u, config: e.analysisProfile.avwapConfig }),
      sourceObservationIds: [u.anchorCandleObservationId, ...v],
      value: m
    }, i);
    r.push({
      anchor: u,
      series: i ? et(pi(f.candles, d)) : [],
      snapshot: m,
      observation: p
    });
    for (const h of Ms(
      f.candles,
      d,
      e.analysisProfile.avwapConfig.maxSignals
    )) {
      const A = Math.max(h.knownAt, u.selectedAt);
      a.push(tt({
        logicalId: `avwap-event:${u.id}:${h.kind}:${h.bucket}`,
        component: "avwapEvent",
        timeframe: u.timeframe,
        eventTime: h.eventTime,
        knownAt: A,
        evaluatedAt: ii(
          A,
          e.analysisProfile.executionTimeframe
        ),
        configurationHash: p.configurationHash,
        sourceObservationIds: [u.anchorCandleObservationId, ...ai(f, h.knownAt)],
        value: { ...h, knownAt: A }
      }, i));
    }
    s = Be(
      "avwap",
      n,
      f,
      p.configurationHash,
      1,
      i
    );
  }
  return { states: r, events: a, notes: o, freshness: s };
}
function mf(e, t, n, i) {
  if (e.schemaVersion !== To || e.symbol.toUpperCase() !== t.symbol.toUpperCase() || e.source !== t.source || e.knownAt > i || e.selectedAt > i) throw new RangeError(`AVWAP anchor ${e.id} was not known at the cutoff`);
  const r = n[e.timeframe];
  if (!r) throw new RangeError(`AVWAP anchor timeframe ${e.timeframe} is not evaluated`);
  const a = r.replay.find(
    (o) => o.logicalCandleId === e.anchorCandleLogicalId
  );
  if (!a || a.observationId !== e.anchorCandleObservationId || a.openTime !== e.anchorTime || a.knownAt > e.selectedAt) throw new RangeError(`AVWAP anchor ${e.id} does not reference the visible frozen revision`);
}
function hm(e) {
  if (!e.id.trim() || !e.provenance.trim())
    throw new TypeError("AVWAP anchor id and provenance are required");
  if (e.knownAt > e.selectedAt)
    throw new RangeError("AVWAP anchor cannot be selected before it is known");
  return F(e.timeframe), y({
    ...e,
    schemaVersion: To,
    symbol: e.symbol.toUpperCase()
  });
}
function vf(e, t, n) {
  const i = Ie(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    e.analysisProfile.executionTimeframe,
    t
  ), r = la({
    symbol: e.symbol,
    source: e.source,
    executionTimeframe: e.analysisProfile.executionTimeframe,
    candlesByTimeframe: {
      [e.analysisProfile.executionTimeframe]: i.candles
    },
    structureEvents: (n == null ? void 0 : n.breaks) ?? [],
    config: e.lifecycleConfig,
    to: t
  });
  if (!r) throw new Error("Unable to materialize lifecycle at the evaluation cutoff");
  return r;
}
function yf(e, t, n) {
  const i = Oo(e.source, e.symbol, t, n.sourceSwing), r = `structure-level:${e.source}:${e.symbol.toUpperCase()}:${t}:${n.role}:${i}`;
  return Ti({
    id: r,
    kind: "structureLevel",
    price: n.price,
    sourceTimeframe: t,
    eventTime: n.eventTime,
    knownAt: n.knownAt,
    sourceObject: {
      objectType: "StructureActiveLevel",
      objectId: r,
      snapshot: y(n)
    }
  });
}
function hf(e, t, n, i) {
  return `structure-event:${e}:${t}:${n}:${i.kind}:${i.direction}:${i.bucket}:${i.sourceSwingX}`;
}
function Oo(e, t, n, i) {
  return `swing:${e}:${t.toUpperCase()}:${n}:${i.kind}:${i.bucket}`;
}
function pf(e, t, n, i) {
  return e.filter((r) => r.price >= t.low && r.price <= t.high && (t.kind === "resistance" ? r.kind === "SwingHigh" : r.kind === "SwingLow")).sort((r, a) => r.bucket - a.bucket || r.knownAt - a.knownAt).map((r) => Oo(n.source, n.symbol, i, r));
}
function Be(e, t, n, i, r, a = !0) {
  const o = n.replay.at(-1);
  return {
    component: e,
    evaluatedAt: t,
    latestInputCloseTime: (o == null ? void 0 : o.closeTime) ?? null,
    latestInputKnownAt: (o == null ? void 0 : o.knownAt) ?? null,
    status: n.replay.length >= r ? "available" : "insufficientHistory",
    sampleCount: n.replay.length,
    requiredCoverage: r,
    availableCoverage: n.replay.length,
    sourceObservationIds: a ? n.replay.map((s) => s.observationId) : [],
    configurationHash: i
  };
}
function gf(e, t, n, i, r, a = !0) {
  const o = t.replay.at(-1), s = n.replay.at(-1);
  return {
    component: "relativeStrength",
    evaluatedAt: e,
    latestInputCloseTime: Math.max(
      (o == null ? void 0 : o.closeTime) ?? 0,
      (s == null ? void 0 : s.closeTime) ?? 0
    ) || null,
    latestInputKnownAt: Math.max(
      (o == null ? void 0 : o.knownAt) ?? 0,
      (s == null ? void 0 : s.knownAt) ?? 0
    ) || null,
    status: i,
    sampleCount: Math.min(t.replay.length, n.replay.length),
    requiredCoverage: t.replay.length,
    availableCoverage: n.replay.length,
    sourceObservationIds: a ? [
      ...t.replay.map((c) => c.observationId),
      ...n.replay.map((c) => c.observationId)
    ].sort() : [],
    configurationHash: r
  };
}
function Af(e, t) {
  return Math.max(
    e.extensionConfig.emaPeriod,
    e.extensionConfig.atrPeriod + 1,
    t === e.stochasticRsiConfig.timeframe ? e.stochasticRsiConfig.rsiPeriod + e.stochasticRsiConfig.stochPeriod + e.stochasticRsiConfig.kPeriod + e.stochasticRsiConfig.dPeriod : 0,
    e.structureConfig.pivotStrength * 2 + 1
  );
}
function ai(e, t) {
  return e.replay.filter((n) => n.knownAt <= t).map((n) => n.observationId);
}
function bf(e, t, n) {
  const i = new Map(t.replay.map((r) => [r.openTime, r]));
  return e.replay.flatMap((r) => {
    if (r.knownAt > n) return [];
    const a = i.get(r.openTime);
    return a && a.knownAt <= n ? [r.observationId, a.observationId] : [];
  });
}
function Hr(e) {
  return Object.fromEntries(Object.entries(e).map(([t, n]) => [
    t,
    n.replay.map((i) => i.observationId)
  ]));
}
function rn(e, t, n) {
  return { code: e, severity: "warning", message: `${t}: ${n}` };
}
function wf(e) {
  return [...new Map(e.map((t) => [C(t), t])).values()];
}
function oi(e) {
  const t = [];
  for (const n of e)
    F(n), t.includes(n) || t.push(n);
  return t;
}
function Ef(e) {
  const t = e.avwapStates[0];
  return !t || t.snapshot.value == null ? null : {
    reference: Ti({
      id: `avwap-reference:${t.anchor.id}`,
      kind: "avwap",
      price: t.snapshot.value,
      sourceTimeframe: t.anchor.timeframe,
      eventTime: t.anchor.anchorTime,
      knownAt: t.observation.knownAt,
      sourceObject: {
        objectType: "AnchoredVwap",
        objectId: t.observation.logicalId,
        snapshot: y({
          ...t.snapshot,
          analysisObservationId: t.observation.observationId
        })
      }
    }),
    distancePct: t.snapshot.distancePct,
    anchorReason: t.anchor.provenance,
    eventTime: t.anchor.anchorTime,
    knownAt: t.observation.knownAt
  };
}
function Tf(e) {
  var i;
  const t = e.relativeStrength.series.at(-1), n = e.freshnessByComponent.relativeStrength;
  return !t || !n || e.relativeStrength.status !== "available" ? null : {
    referenceSymbol: e.relativeStrength.referenceSymbol,
    normalized: !0,
    value: t.value,
    structure: ((i = e.relativeStrength.structure) == null ? void 0 : i.summary) ?? null,
    eventTime: n.latestInputCloseTime ?? e.effectiveAsOf,
    knownAt: n.latestInputKnownAt ?? e.effectiveAsOf
  };
}
function Rf(e) {
  return e.supportResistanceZones.map((t) => Ti({
    id: t.logicalId,
    kind: t.value.kind === "support" ? "supportZone" : "resistanceZone",
    price: t.value.center,
    rangeLow: t.value.low,
    rangeHigh: t.value.high,
    sourceTimeframe: t.timeframe,
    eventTime: t.eventTime,
    knownAt: t.knownAt,
    sourceObject: {
      objectType: "SupportResistanceZone",
      objectId: t.logicalId,
      snapshot: y({
        ...t.value,
        analysisObservationId: t.observationId
      })
    }
  }));
}
const Br = "replay-analysis-data.1";
function Sf(e) {
  const t = nr(e, "Replay analysis JSON data");
  if (Mo(t, ["schemaVersion", "target", "reference"], "Replay analysis JSON data"), t.schemaVersion !== Br)
    throw new Error("Unsupported Replay analysis JSON data schema");
  const n = Vr(t.target, "target"), i = Vr(t.reference, "reference");
  return y({
    schemaVersion: Br,
    target: n,
    reference: i
  });
}
var W, Te, gt, No;
class Cf {
  constructor(t) {
    ee(this, Te);
    ee(this, W);
    ae(this, W, Sf(t));
  }
  async getCoverage(t) {
    _o(t);
    const n = te(this, Te, No).call(this, t);
    if (!n) return If(t.timeframe);
    const i = [...n.candles, ...n.candleRevisions].filter(
      (r) => r.timeframe === t.timeframe
    );
    return y({
      timeframe: t.timeframe,
      earliestOpenTime: i.length ? Math.min(...i.map((r) => r.openTime)) : null,
      latestCloseTime: i.length ? Math.max(...i.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: n.revisionHistoryAvailable
    });
  }
  // Kept as a plain-language alias for callers that model coverage as a query operation.
  async coverage(t) {
    return this.getCoverage(t);
  }
  async loadCandles(t) {
    return te(this, Te, gt).call(this, R(this, W).target, R(this, W).target.candles, t);
  }
  async loadCandleRevisions(t) {
    return R(this, W).target.revisionHistoryAvailable ? te(this, Te, gt).call(this, R(this, W).target, R(this, W).target.candleRevisions, t) : y([]);
  }
  async loadReferenceCandles(t) {
    return te(this, Te, gt).call(this, R(this, W).reference, R(this, W).reference.candles, t);
  }
  async loadReferenceCandleRevisions(t) {
    return R(this, W).reference.revisionHistoryAvailable ? te(this, Te, gt).call(this, R(this, W).reference, R(this, W).reference.candleRevisions, t) : y([]);
  }
}
W = new WeakMap(), Te = new WeakSet(), gt = function(t, n, i) {
  return kf(i), Un(t, i) ? y(
    n.filter(
      (r) => r.timeframe === i.timeframe && r.openTime >= i.from && r.openTime <= i.to
    )
  ) : y([]);
}, No = function(t) {
  return Un(R(this, W).target, t) ? R(this, W).target : Un(R(this, W).reference, t) ? R(this, W).reference : null;
};
class pm extends Cf {
  constructor(t) {
    super(t);
  }
}
function Vr(e, t) {
  const n = nr(e, `Replay analysis ${t} series`);
  Mo(
    n,
    ["symbol", "source", "candles", "candleRevisions", "revisionHistoryAvailable"],
    `Replay analysis ${t} series`
  );
  const i = un(n.symbol, `${t} symbol`).toUpperCase(), r = un(n.source, `${t} source`), a = qr(n.candles, `${t} candles`), o = qr(
    n.candleRevisions,
    `${t} candleRevisions`
  ), s = Of(
    n.revisionHistoryAvailable,
    `${t} revisionHistoryAvailable`
  );
  if (o.length > 0 && !s)
    throw new Error(`${t} candle revisions require revisionHistoryAvailable=true`);
  return Pf(a, o, i, r, t), {
    symbol: i,
    source: r,
    candles: $r(a),
    candleRevisions: $r(o),
    revisionHistoryAvailable: s
  };
}
function Pf(e, t, n, i, r) {
  const a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (const l of [...e, ...t]) {
    if (xf(l, n, i, r), o.has(l.observationId))
      throw new Error(`Duplicate ${r} candle observation ${l.observationId}`);
    o.add(l.observationId);
    const u = `${l.logicalCandleId}\0${l.knownAt}`;
    if (s.has(u))
      throw new Error(`Conflicting ${r} candle revision precedence for ${l.logicalCandleId}`);
    s.add(u);
  }
  for (const l of e) {
    if (l.correctionPublishedAt != null)
      throw new Error(`Base ${r} candle cannot have correction provenance`);
    if (a.has(l.logicalCandleId))
      throw new Error(`Base ${r} history contains revisions for ${l.logicalCandleId}`);
    a.set(l.logicalCandleId, l);
  }
  const c = /* @__PURE__ */ new Map();
  for (const l of t) {
    if (!a.get(l.logicalCandleId))
      throw new Error(`${r} candle revision has no base record: ${l.logicalCandleId}`);
    if (l.revision == null || l.correctionPublishedAt == null)
      throw new Error(`${r} candle revision requires revision and correction provenance`);
    const f = c.get(l.logicalCandleId) ?? [];
    f.push(l), c.set(l.logicalCandleId, f);
  }
  for (const [l, u] of c) {
    const f = a.get(l);
    let d = f.knownAt, m = f.knownAt, v = f.revision ?? -1;
    for (const p of [...u].sort(
      (h, A) => h.knownAt - A.knownAt || h.correctionPublishedAt - A.correctionPublishedAt || h.revision - A.revision
    )) {
      if (p.knownAt <= d || p.correctionPublishedAt <= m || p.revision <= v)
        throw new Error(`${r} candle revisions must have monotonic correction provenance: ${l}`);
      d = p.knownAt, m = p.correctionPublishedAt, v = p.revision;
    }
  }
}
function xf(e, t, n, i) {
  const r = nr(e, `Replay analysis ${i} candle`), a = F(r.timeframe);
  let o;
  try {
    o = Wa({
      symbol: r.symbol,
      source: r.source,
      timeframe: r.timeframe,
      openTime: r.openTime,
      o: r.o,
      h: r.h,
      l: r.l,
      c: r.c,
      vBase: r.vBase,
      vQuote: r.vQuote,
      knownAt: r.knownAt,
      revision: r.revision,
      correctionPublishedAt: r.correctionPublishedAt
    });
  } catch {
    throw new Error(`Invalid ${i} replay candle ${r.observationId ?? "<unknown>"}`);
  }
  if (r.symbol !== t || r.source !== n || !nt(r.openTime) || r.openTime % a !== 0 || r.closeTime !== r.openTime + a || !nt(r.closeTime) || !nt(r.knownAt) || r.knownAt < r.closeTime || r.correctionPublishedAt != null && !nt(r.correctionPublishedAt) || r.logicalCandleId !== bn(r) || r.observationId !== _t(r) || !Ur(r.vBase) || !Ur(r.vQuote) || C(r) !== C(o))
    throw new Error(`Invalid ${i} replay candle ${r.observationId ?? "<unknown>"}`);
}
function Un(e, t) {
  return t.symbol.toUpperCase() === e.symbol && t.source === e.source;
}
function If(e) {
  return y({
    timeframe: e,
    earliestOpenTime: null,
    latestCloseTime: null,
    revisionHistoryAvailable: !1
  });
}
function _o(e) {
  un(e.symbol, "Replay analysis query symbol"), un(e.source, "Replay analysis query source"), F(e.timeframe);
}
function kf(e) {
  if (_o(e), !nt(e.from) || !nt(e.to) || e.to < e.from)
    throw new RangeError("Replay analysis query range must contain ordered Unix-second timestamps");
}
function $r(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function Mo(e, t, n) {
  const i = Object.keys(e).sort(), r = [...t].sort();
  if (i.length !== r.length || i.some((a, o) => a !== r[o]))
    throw new Error(`${n} has unsupported or missing fields`);
}
function Ur(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function nt(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function nr(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function un(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function Of(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function qr(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
const ir = "replay-analysis-session.1", Nf = "replay-analysis-session-event.1", _f = 128, Ee = /* @__PURE__ */ new Map();
function gm(e) {
  const t = y(e), n = {
    schemaVersion: ir,
    id: `replay-analysis-session:${T({
      symbol: e.symbol.toUpperCase(),
      source: e.source,
      analysisProfileHash: e.analysisProfile.canonicalConfigHash,
      strategyProfileHash: e.strategyProfile.profileHash,
      radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
      radarEpisodeId: e.radarEpisode.id,
      referenceMarket: e.analysisProfile.referenceMarketPolicy,
      anchors: e.avwapAnchors ?? []
    }).slice(8)}`,
    replayEngineVersion: Ht,
    analysisEngineVersion: We,
    revision: 0,
    input: t,
    currentRequestedAsOf: null,
    currentEffectiveAsOf: null,
    states: [],
    events: []
  };
  return Do(n);
}
function Mf(e, t) {
  return Bt(e), si({ ...e.input, asOf: t });
}
function Ff(e, t, n = {}) {
  var d, m;
  if (Bt(e), !Number.isFinite(t) || t < 0)
    throw new RangeError("Analysis session asOf must be a non-negative finite timestamp");
  const i = Uf(e.input, n), r = qf(
    e.input,
    i,
    e.input.analysisProfile.executionTimeframe
  ), a = r == null ? [...e.states] : e.states.filter((v) => v.effectiveAsOf < r), o = e.states.filter((v) => !a.some((p) => p.id === v.id)).map((v) => v.id), s = [...e.events];
  o.length && s.push(Fo({
    sequence: s.length,
    kind: "invalidated",
    effectiveAsOf: r,
    analysisStateId: null,
    invalidatedStateIds: o,
    sourceObservationIds: zf(e.input, i)
  }));
  const c = ((d = a.at(-1)) == null ? void 0 : d.effectiveAsOf) ?? -1 / 0, l = Ge(
    i.candlesByTimeframe[i.analysisProfile.executionTimeframe] ?? [],
    t
  ).map((v) => v.closeTime).filter((v) => v > c && v <= t), u = [...a];
  for (const v of l)
    zr(u, s, si({ ...i, asOf: v }));
  const f = si({ ...i, asOf: t });
  return ((m = u.at(-1)) == null ? void 0 : m.id) !== f.id && zr(u, s, f), Do({
    schemaVersion: ir,
    id: e.id,
    replayEngineVersion: Ht,
    analysisEngineVersion: We,
    revision: e.revision + 1,
    input: i,
    currentRequestedAsOf: t,
    currentEffectiveAsOf: f.effectiveAsOf,
    states: u,
    events: s
  });
}
function Lf(e) {
  return Bt(e), C(e);
}
function Df(e) {
  const t = JSON.parse(e);
  return Bt(t), y(t);
}
function Bt(e) {
  if (e.schemaVersion !== ir || e.replayEngineVersion !== Ht || e.analysisEngineVersion !== We) throw new Error("Unsupported replay analysis session version");
  const { integrityHash: t, ...n } = e;
  if (e.integrityHash !== T(n))
    throw new Error("Replay analysis session failed integrity verification");
  if (e.events.some((r, a) => r.sequence !== a || r.id !== Lo(r)))
    throw new Error("Replay analysis session event log failed integrity verification");
  const i = e.states.map((r) => r.id);
  if (new Set(i).size !== i.length)
    throw new Error("Replay analysis session contains duplicate states");
}
function Hf(e) {
  const t = e.analysisProfile;
  return t.evaluatedTimeframes.flatMap((n) => {
    const i = F(n), r = [{
      component: `timeframe:${n}`,
      timeframe: n,
      minimumSamples: Math.max(
        t.extensionConfig.emaPeriod,
        t.extensionConfig.atrPeriod + 1,
        t.structureConfig.pivotStrength * 2 + 1
      ),
      minimumSeconds: t.extensionConfig.historyDays * 86400
    }];
    return n === t.relativeStrengthConfig.timeframe && r.push({
      component: "relativeStrength",
      timeframe: n,
      minimumSamples: t.structureConfig.pivotStrength * 2 + 1,
      minimumSeconds: t.relativeStrengthConfig.maxAgeBars * i
    }), r;
  });
}
var le;
class Am {
  constructor(t) {
    be(this, "replayEngineVersion", Ht);
    ee(this, le);
    Bt(t), ae(this, le, y(t));
  }
  getRequiredCoverage() {
    return Hf(R(this, le).input);
  }
  materializeAt(t) {
    return Mf(R(this, le), t);
  }
  advanceTo(t, n = {}) {
    return ae(this, le, Ff(R(this, le), t, n)), R(this, le).states.at(-1);
  }
  serializeState() {
    return Lf(R(this, le));
  }
  resumeState(t) {
    ae(this, le, Df(t));
  }
  snapshot() {
    return y(R(this, le));
  }
}
le = new WeakMap();
var Ve;
class bm {
  constructor(t) {
    be(this, "replayEngineVersion", "replay-engine.1");
    ee(this, Ve);
    ae(this, Ve, y([...t].sort(
      (n, i) => n.knownAt - i.knownAt || n.id.localeCompare(i.id)
    )));
  }
  getRequiredCoverage() {
    return [];
  }
  materializeAt(t) {
    const n = R(this, Ve).filter((i) => i.knownAt <= t).at(-1);
    if (!n) throw new Error(`No supplied replay analysis observation is known at ${t}`);
    return y(n);
  }
  advanceTo(t) {
    return this.materializeAt(t);
  }
  serializeState() {
    return C(R(this, Ve));
  }
  resumeState(t) {
    if (C(JSON.parse(t)) !== C(R(this, Ve)))
      throw new Error("Supplied replay analysis observations cannot be replaced during resume");
  }
}
Ve = new WeakMap();
function wm() {
  Ee.clear();
}
function Em() {
  return Ee.size;
}
function si(e) {
  const t = Bf(e), n = Ee.get(t);
  if (n)
    return Ee.delete(t), Ee.set(t, n), y(n);
  const i = ni(e);
  for (Ee.set(t, i); Ee.size > _f; ) {
    const r = Ee.keys().next().value;
    if (r == null) break;
    Ee.delete(r);
  }
  return y(i);
}
function Bf(e) {
  const t = Vf(e), n = (i) => Object.fromEntries(Object.entries(i).map(([r, a]) => [
    r,
    Ge(a, t).map((o) => o.observationId)
  ]));
  return T({
    symbol: e.symbol.toUpperCase(),
    source: e.source,
    referenceMarket: e.analysisProfile.referenceMarketPolicy,
    effectiveAsOf: t,
    requestedAsOf: e.asOf,
    target: n(e.candlesByTimeframe),
    reference: n(e.referenceCandlesByTimeframe),
    analysisProfileHash: e.analysisProfile.canonicalConfigHash,
    lifecycleConfigHash: e.analysisProfile.lifecycleConfigRef.configHash,
    radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
    strategyProfileHash: e.strategyProfile.profileHash,
    anchors: e.avwapAnchors ?? []
  });
}
function Vf(e) {
  return So(e);
}
function zr(e, t, n) {
  e.some((i) => i.id === n.id) || (e.push(n), t.push(Fo({
    sequence: t.length,
    kind: "materialized",
    effectiveAsOf: n.effectiveAsOf,
    analysisStateId: n.id,
    invalidatedStateIds: [],
    sourceObservationIds: $f(n)
  })));
}
function $f(e) {
  return [...new Set(Object.values(e.freshnessByComponent).flatMap((t) => t.sourceObservationIds))].sort();
}
function Fo(e) {
  const t = {
    schemaVersion: Nf,
    ...e
  };
  return y({ ...t, id: Lo(t) });
}
function Lo(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-session-event:${T(n).slice(8)}`;
}
function Uf(e, t) {
  const n = (i, r = {}) => Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(i), ...Object.keys(r)])].map(
    (a) => {
      const o = /* @__PURE__ */ new Map();
      for (const s of [...i[a] ?? [], ...r[a] ?? []])
        o.set(s.observationId, s);
      return [a, [...o.values()].sort(
        (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt
      )];
    }
  ));
  return y({
    ...e,
    candlesByTimeframe: n(e.candlesByTimeframe, t.candlesByTimeframe),
    referenceCandlesByTimeframe: n(
      e.referenceCandlesByTimeframe,
      t.referenceCandlesByTimeframe
    ),
    avwapAnchors: t.avwapAnchors ?? e.avwapAnchors
  });
}
function qf(e, t, n) {
  const i = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((c) => c.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((c) => c.observationId)
  ]), r = [
    ...Object.values(t.candlesByTimeframe).flat(),
    ...Object.values(t.referenceCandlesByTimeframe).flat()
  ].filter((c) => !i.has(c.observationId)), a = C(e.avwapAnchors ?? []) !== C(t.avwapAnchors ?? []), o = Math.min(
    ...r.map((c) => c.knownAt),
    ...a ? (t.avwapAnchors ?? []).map((c) => c.knownAt) : []
  );
  if (!Number.isFinite(o)) return null;
  const s = F(n);
  return Math.ceil(o / s) * s;
}
function zf(e, t) {
  const n = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((i) => i.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((i) => i.observationId)
  ]);
  return [
    ...Object.values(t.candlesByTimeframe).flat(),
    ...Object.values(t.referenceCandlesByTimeframe).flat()
  ].map((i) => i.observationId).filter((i) => !n.has(i)).sort();
}
function Do(e) {
  return y({
    ...e,
    integrityHash: T(e)
  });
}
const Qr = "replay-json-data.1";
function Qf(e) {
  const t = Ke(e, "Replay JSON data");
  if (t.schemaVersion !== Qr)
    throw new Error("Unsupported Replay JSON data schema");
  const n = st(t.symbol, "Replay JSON data symbol").toUpperCase(), i = st(t.source, "Replay JSON data source"), r = li(t.candles, "candles"), a = yt(
    t.candleRevisions,
    "candleRevisions"
  ), o = li(t.radarEpisodes, "radarEpisodes"), s = yt(
    t.analysisStateHistory,
    "analysisStateHistory"
  ), c = yt(t.knownEvents, "knownEvents"), l = yt(
    t.venueEvidence,
    "venueEvidence"
  ), u = yt(
    t.universeEvidence,
    "universeEvidence"
  ), f = td(
    t.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (a.length > 0 && !f)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return jf(r, a, n, i), Wf(o, n, i), Gf(s, n, i), Kf(c, n, i), Yf(l, n, i), Xf(u, n, i), y({
    schemaVersion: Qr,
    symbol: n,
    source: i,
    candles: Gr(r),
    candleRevisions: Gr(a),
    radarEpisodes: [...o].sort(
      (d, m) => d.detectedAt - m.detectedAt || d.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    venueEvidence: [...l].sort(Kr),
    universeEvidence: [...u].sort(Kr),
    revisionHistoryAvailable: f
  });
}
var G, Re, an, ci;
class Tm {
  constructor(t) {
    ee(this, Re);
    ee(this, G);
    ae(this, G, Qf(t));
  }
  async getCoverage(t) {
    var i;
    Bo(t);
    const n = te(this, Re, an).call(this, [...R(this, G).candles, ...R(this, G).candleRevisions], t);
    return y({
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: n.length ? Math.max(...n.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: R(this, G).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(t) {
    return Wr(t), y(
      te(this, Re, an).call(this, R(this, G).candles, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions(t) {
    return Wr(t), R(this, G).revisionHistoryAvailable ? y(
      te(this, Re, an).call(this, R(this, G).candleRevisions, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(t) {
    return en(t), y(
      R(this, G).venueEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && jr(n, t)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return en(t), y(
      R(this, G).universeEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && jr(n, t)
      )
    );
  }
  async loadAnalysisStateHistory(t) {
    return en(t), y(
      R(this, G).analysisStateHistory.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return en(t), te(this, Re, ci).call(this, t) ? y(
      R(this, G).knownEvents.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    ) : [];
  }
  async loadRadarEpisode(t) {
    if (typeof t != "string" || !t.trim())
      throw new TypeError("Radar episode id is required");
    return y(
      R(this, G).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
G = new WeakMap(), Re = new WeakSet(), an = function(t, n) {
  return te(this, Re, ci).call(this, n) ? t.filter((i) => i.timeframe === n.timeframe) : [];
}, ci = function(t) {
  return t.symbol.toUpperCase() === R(this, G).symbol && t.source === R(this, G).source;
};
function jf(e, t, n, i) {
  const r = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const s of [...e, ...t]) {
    Ke(s, "Replay candle");
    const c = F(s.timeframe);
    if (s.symbol.toUpperCase() !== n || s.source !== i || !he(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !he(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== bn(s) || s.observationId !== _t(s) || !Zf(s) || !qn(s.vBase) || !qn(s.vQuote) || !Jf(s.revision) || !qn(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    Le(a, s.observationId, s, "candle observation"), Le(
      o,
      `${s.logicalCandleId}\0${s.knownAt}`,
      s,
      "candle revision precedence"
    );
  }
  for (const s of e) {
    const c = r.get(s.logicalCandleId);
    if (c && c.observationId !== s.observationId)
      throw new Error(`Base candle history contains revisions for ${s.logicalCandleId}`);
    r.set(s.logicalCandleId, s);
  }
  for (const s of t) {
    const c = r.get(s.logicalCandleId);
    if (!c) throw new Error(`Candle revision has no base record: ${s.logicalCandleId}`);
    if (s.knownAt <= c.knownAt)
      throw new Error(`Candle revision must be published after its base record: ${s.logicalCandleId}`);
  }
}
function Wf(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Ke(r, "Radar episode"), r.schemaVersion !== Si || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== ki(r))
      throw new Error(`Invalid radar episode ${r.id ?? "<unknown>"}`);
    Le(i, r.id, r, "radar episode");
  }
}
function Gf(e, t, n) {
  const i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const a of e) {
    if (Ke(a, "Replay analysis state"), a.schemaVersion !== Di || a.symbol.toUpperCase() !== t || a.source !== n || !he(a.knownAt) || a.lifecycle.asOf == null || a.lifecycle.asOf > a.knownAt || a.id !== wn(a))
      throw new Error(`Invalid replay analysis state ${a.id ?? "<unknown>"}`);
    Le(i, a.id, a, "analysis state observation"), Le(r, a.knownAt, a, "analysis state knowledge time");
  }
}
function Kf(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Ke(r, "Replay known event"), r.schemaVersion !== Hi || r.symbol.toUpperCase() !== t || r.source !== n || !he(r.eventTime) || !he(r.knownAt) || r.knownAt < r.eventTime || r.id !== Vi(r))
      throw new Error(`Invalid replay known event ${r.id ?? "<unknown>"}`);
    r.timeframe != null && F(r.timeframe), Le(i, r.id, r, "known event");
  }
}
function Yf(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Ke(r, "Venue evidence"), r.schemaVersion !== Pi || r.symbol.toUpperCase() !== t || r.marketDataSource !== n || r.observationId !== pn(r))
      throw new Error(`Invalid execution-venue evidence ${r.observationId ?? "<unknown>"}`);
    Ho(r, "execution-venue evidence"), Le(i, r.observationId, r, "execution-venue evidence");
  }
}
function Xf(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Ke(r, "Universe evidence"), r.schemaVersion !== xi || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== hn(r))
      throw new Error(`Invalid universe evidence ${r.observationId ?? "<unknown>"}`);
    Ho(r, "universe evidence"), Le(i, r.observationId, r, "universe evidence");
  }
}
function Ho(e, t) {
  if (!he(e.effectiveFrom) || !he(e.knownAt) || e.effectiveTo != null && (!he(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${t} interval`);
}
function jr(e, t) {
  return e.knownAt <= t.to && e.effectiveFrom <= t.to && (e.effectiveTo == null || e.effectiveTo >= t.from);
}
function Bo(e) {
  st(e.symbol, "Replay query symbol"), st(e.source, "Replay query source"), F(e.timeframe);
}
function Wr(e) {
  Bo(e), Vo(e.from, e.to);
}
function en(e) {
  st(e.symbol, "Replay evidence query symbol"), st(e.source, "Replay evidence query source"), Vo(e.from, e.to);
}
function Vo(e, t) {
  if (!he(e) || !he(t) || t < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function Gr(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function Kr(e, t) {
  return e.effectiveFrom - t.effectiveFrom || e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function Le(e, t, n, i) {
  const r = e.get(t);
  if (r && C(r) !== C(n))
    throw new Error(`Conflicting ${i}`);
  e.set(t, n);
}
function Zf(e) {
  return tn(e.o) && tn(e.h) && tn(e.l) && tn(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function tn(e) {
  return Number.isFinite(e) && e > 0;
}
function qn(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Jf(e) {
  return e == null || ed(e);
}
function ed(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function he(e) {
  return Number.isFinite(e) && e >= 0;
}
function Ke(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function st(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function td(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function li(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function yt(e, t) {
  return e == null ? [] : li(e, t);
}
function Rm(e, t) {
  return ja({
    ...e,
    replayEngineVersion: _e
  }, t);
}
async function Sm(e) {
  if (e.sessionConfig.replayEngineVersion !== _e)
    throw new RangeError("Materialized replay loading requires replay-engine.2");
  if (e.analysisProfile.executionTimeframe !== e.sessionConfig.evaluationTimeframe || e.analysisProfile.canonicalConfigHash === "" || e.analysisProfile.lifecycleConfigRef.configHash !== e.strategyProfile.lifecycleConfigHash) throw new Error("Materialized replay analysis/profile configuration mismatch");
  const t = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, n = e.analysisProfile.referenceMarketPolicy.symbol, i = e.analysisProfile.referenceMarketPolicy.source ?? e.manifest.source, r = {}, a = {}, o = {}, s = {}, c = {};
  for (const g of e.analysisProfile.evaluatedTimeframes) {
    const S = { symbol: e.manifest.symbol, source: e.manifest.source, timeframe: g }, I = { symbol: n, source: i, timeframe: g }, [H, j] = await Promise.all([
      e.analysisDataAdapter.getCoverage(S),
      e.analysisDataAdapter.getCoverage(I)
    ]);
    c[g] = H;
    const N = Math.max(
      0,
      e.manifest.startAsOf - od(e, g)
    ), B = Xr(S, H, N, t), O = Xr(I, j, N, t);
    r[g] = B ? await e.analysisDataAdapter.loadCandles(B) : [], a[g] = B ? await e.analysisDataAdapter.loadCandleRevisions(B) : [], o[g] = O ? await e.analysisDataAdapter.loadReferenceCandles(O) : [], s[g] = O ? await e.analysisDataAdapter.loadReferenceCandleRevisions(O) : [];
  }
  const l = Jr(r, a), u = Jr(o, s), f = {
    symbol: e.manifest.symbol,
    source: e.manifest.source,
    candlesByTimeframe: l,
    referenceCandlesByTimeframe: u,
    avwapAnchors: e.avwapAnchors,
    radarEpisode: await ad(e.historicalDataAdapter, e.manifest.radarEpisodeId),
    radarSelectionProfile: e.radarSelectionProfile,
    strategyProfile: e.strategyProfile,
    analysisProfile: e.analysisProfile,
    lifecycleConfig: e.lifecycleConfig
  }, d = /* @__PURE__ */ new Set([e.manifest.startAsOf]);
  for (const g of Ge(
    l[e.analysisProfile.executionTimeframe] ?? [],
    t
  ))
    g.closeTime >= e.manifest.startAsOf && g.closeTime <= t && d.add(g.closeTime);
  const m = [...d].sort((g, S) => g - S), v = [], p = [];
  let h = [], A = -1;
  const b = async (g) => {
    for (; A + 1 < m.length && m[A + 1] <= g; ) {
      A += 1;
      const S = ni({
        ...f,
        asOf: m[A],
        includeIndicatorSeries: !1,
        includeComponentProvenance: !1
      });
      v.push(S), p.push(nd(S));
    }
    return h = id(v), { analysisStateHistory: p, knownEvents: h };
  };
  await b(e.manifest.startAsOf);
  const E = v.find((g) => g.effectiveAsOf === e.manifest.startAsOf) ?? v[0];
  if (!E) throw new Error("No materialized analysis state exists at replay start");
  const _ = (e.avwapAnchors ?? []).some((g) => g.type === "manual") ? ni({
    ...f,
    avwapAnchors: (e.avwapAnchors ?? []).filter((g) => g.type !== "manual"),
    asOf: E.effectiveAsOf,
    includeIndicatorSeries: !1,
    includeComponentProvenance: !1
  }) : E, P = new rd({
    evidence: e.historicalDataAdapter,
    targetBaseByTimeframe: r,
    targetRevisionsByTimeframe: a,
    targetCoverage: c,
    observations: p,
    knownEvents: h,
    radarEpisode: f.radarEpisode
  }), w = await Sl({
    manifest: e.manifest,
    sessionConfig: e.sessionConfig,
    historicalDataAdapter: P,
    strategyProfile: e.strategyProfile,
    radarSelectionProfile: e.radarSelectionProfile,
    venueRules: e.venueRules,
    materializedAnalysisBinding: {
      replayEngineVersion: _e,
      analysisEngineVersion: We,
      analysisProfileRef: {
        id: e.analysisProfile.id,
        version: e.analysisProfile.version,
        hash: e.analysisProfile.canonicalConfigHash
      },
      referenceMarket: { symbol: n, source: i },
      // Runtime manual anchors are append-only analysis actions. They must not
      // replace the immutable case/session binding established at detection.
      causalDataBundleFingerprint: _.dataBundleFingerprint,
      lifecycleConfigHash: e.strategyProfile.lifecycleConfigHash,
      radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
      strategyProfileHash: e.strategyProfile.profileHash
    }
  });
  return gl(w, { materializeThrough: b }), w;
}
async function Cm(e) {
  var d;
  const t = e.manifest.startAsOf, n = t + e.sessionConfig.maximumCaseDuration;
  await Yn(e, n);
  const i = Z(e), r = Object.fromEntries(
    Object.entries(i.candlesByTimeframe).map(([m, v]) => [
      m,
      Ge(v, n)
    ])
  ), a = Object.fromEntries(
    Object.entries(r).map(([m, v]) => [
      m,
      v.filter((p) => p.closeTime > t && p.knownAt <= n)
    ])
  ), o = i.analysisStateHistory.filter((m) => m.knownAt >= t && m.knownAt <= n).map((m) => ({ knownAt: m.knownAt, state: m.lifecycle.currentState })), s = {};
  for (const m of o)
    s[m.state] == null && (s[m.state] = m.knownAt);
  const l = ((d = (r[e.sessionConfig.evaluationTimeframe] ?? []).filter((m) => m.closeTime <= t && m.knownAt <= t).at(-1)) == null ? void 0 : d.c) ?? null, u = a[e.sessionConfig.evaluationTimeframe] ?? [], f = i.knownEvents.filter((m) => (m.kind === "radarTerminal" || m.kind === "lifecycleTerminal") && m.knownAt >= t && m.knownAt <= n);
  return y({
    futureCandlesByTimeframe: a,
    lifecycleTimeline: o,
    radarTerminalResult: f.length ? At({ events: f }) : null,
    maximumFavorablePriceExcursionFromDetected: l && u.length ? (l - Math.min(...u.map((m) => m.l))) / l * 100 : null,
    maximumAdversePriceExcursionFromDetected: l && u.length ? (Math.max(...u.map((m) => m.h)) - l) / l * 100 : null,
    lifecycleStateTimestamps: s,
    dataQualityNotes: i.dataQualityNotes
  });
}
function nd(e) {
  const t = Rf(e), n = Ef(e);
  return Rl({
    symbol: e.symbol,
    source: e.source,
    knownAt: e.effectiveAsOf,
    lifecycle: e.lifecycleResult,
    candidateMetrics: e.candidateMetrics,
    structureByTimeframe: Object.fromEntries(
      Object.entries(e.structureByTimeframe).map(([i, r]) => [
        i,
        r.observation.value.summary
      ])
    ),
    activeStructureLevels: e.activeStructureLevels,
    supportResistanceZones: t,
    avwapState: n,
    avwapEvents: e.avwapEvents.map((i) => i.value),
    relativeStrengthState: Tf(e),
    relativeStrengthEvents: e.relativeStrengthEvents.map((i) => i.value),
    visibleOrSelectedReferenceLevels: [
      ...e.activeStructureLevels,
      ...t,
      ...n ? [n.reference] : []
    ],
    dataQualityNotes: e.dataQualityNotes,
    materializedStateRef: {
      id: e.id,
      schemaVersion: Eo,
      analysisEngineVersion: e.analysisEngineVersion,
      analysisProfileHash: e.analysisProfileRef.hash,
      dataBundleFingerprint: e.dataBundleFingerprint
    }
  });
}
function id(e) {
  const t = /* @__PURE__ */ new Map(), n = (i) => t.set(i.id, i);
  for (const i of e) {
    for (const r of i.structureEvents)
      r.evaluatedAt === i.effectiveAsOf && n(Gt({
        symbol: i.symbol,
        source: i.source,
        kind: "structure",
        eventType: r.value.label,
        direction: r.value.direction,
        timeframe: r.timeframe,
        lifecycleState: null,
        avwapId: null,
        eventTime: r.eventTime,
        knownAt: i.effectiveAsOf,
        detail: At({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.relativeStrengthEvents)
      r.evaluatedAt === i.effectiveAsOf && n(Gt({
        symbol: i.symbol,
        source: i.source,
        kind: "relativeStrength",
        eventType: r.value.signal,
        direction: r.value.direction,
        timeframe: r.timeframe,
        lifecycleState: null,
        avwapId: null,
        eventTime: r.eventTime,
        knownAt: i.effectiveAsOf,
        detail: At({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.avwapEvents) {
      if (r.evaluatedAt !== i.effectiveAsOf) continue;
      const a = `:${r.value.kind}:${r.eventTime}`, o = r.logicalId.startsWith("avwap-event:") && r.logicalId.endsWith(a) ? r.logicalId.slice(12, -a.length) : null;
      n(Gt({
        symbol: i.symbol,
        source: i.source,
        kind: "avwap",
        eventType: r.value.kind,
        direction: r.value.kind === "loss" || r.value.kind === "failedReclaim" ? "bearish" : "bullish",
        timeframe: r.timeframe,
        lifecycleState: null,
        avwapId: o,
        eventTime: r.eventTime,
        knownAt: i.effectiveAsOf,
        detail: At({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    }
    for (const r of i.lifecycleResult.transitions)
      r.knownAt === i.effectiveAsOf && n(Gt({
        symbol: i.symbol,
        source: i.source,
        kind: "lifecycleTransition",
        eventType: `${r.from}->${r.to}`,
        direction: null,
        timeframe: i.lifecycleResult.executionTimeframe,
        lifecycleState: r.to,
        avwapId: null,
        eventTime: r.knownAt,
        knownAt: i.effectiveAsOf,
        detail: At(r)
      }));
  }
  return y([...t.values()].sort(
    (i, r) => i.knownAt - r.knownAt || i.id.localeCompare(r.id)
  ));
}
var ne;
class rd {
  constructor(t) {
    ee(this, ne);
    ae(this, ne, t);
  }
  async getCoverage(t) {
    return y(R(this, ne).targetCoverage[t.timeframe] ?? {
      timeframe: t.timeframe,
      earliestOpenTime: null,
      latestCloseTime: null,
      revisionHistoryAvailable: !1
    });
  }
  async loadCandleHistory(t) {
    return Yr(R(this, ne).targetBaseByTimeframe[t.timeframe] ?? [], t);
  }
  async loadCandleRevisions(t) {
    return Yr(R(this, ne).targetRevisionsByTimeframe[t.timeframe] ?? [], t);
  }
  async loadAnalysisStateHistory(t) {
    return y(R(this, ne).observations.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to));
  }
  async loadKnownEvents(t) {
    return y(R(this, ne).knownEvents.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to));
  }
  async loadPointInTimeVenueEvidence(t) {
    var n, i;
    return ((i = (n = R(this, ne).evidence).loadPointInTimeVenueEvidence) == null ? void 0 : i.call(n, t)) ?? [];
  }
  async loadPointInTimeUniverseEvidence(t) {
    var n, i;
    return ((i = (n = R(this, ne).evidence).loadPointInTimeUniverseEvidence) == null ? void 0 : i.call(n, t)) ?? [];
  }
  async loadRadarEpisode(t) {
    return t === R(this, ne).radarEpisode.id ? y(R(this, ne).radarEpisode) : null;
  }
}
ne = new WeakMap();
function Yr(e, t) {
  return y(e.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe && n.openTime >= t.from && n.openTime <= t.to));
}
async function ad(e, t) {
  var i;
  const n = await ((i = e.loadRadarEpisode) == null ? void 0 : i.call(e, t));
  if (!n) throw new Error("Exact RadarEpisode sidecar is required for materialized replay");
  return n;
}
function Xr(e, t, n, i) {
  return t.earliestOpenTime == null ? null : { ...e, from: Math.max(t.earliestOpenTime, n), to: i };
}
function od(e, t) {
  const n = e.manifest.preRollRequirements.filter((a) => a.timeframe === t).reduce((a, o) => Math.max(
    a,
    o.minimumDurationSeconds,
    o.minimumBars * Zr(t)
  ), 0), i = e.strategyProfile.timeframeRoles, r = t === i.candidateTimeframe ? e.analysisProfile.extensionConfig.historyDays * 86400 : t === i.structureTimeframe || i.contextTimeframes.includes(t) ? 90 * 86400 : Zr(t) * 250;
  return Math.max(n, r);
}
function Zr(e) {
  const t = /^(\d+)(m|h|d)$/i.exec(e);
  if (!t) throw new RangeError(`Unsupported materialized replay timeframe ${e}`);
  const n = Number(t[1]), i = t[2].toLowerCase();
  return n * (i === "m" ? 60 : i === "h" ? 3600 : 86400);
}
function Jr(e, t) {
  return Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)])].map(
    (n) => [n, Object.freeze([
      ...e[n] ?? [],
      ...t[n] ?? []
    ])]
  ));
}
function At(e) {
  return y(e);
}
var Ot;
class Pm {
  constructor(t) {
    ee(this, Ot);
    ae(this, Ot, y(t));
  }
  async revealCaseOutcome(t) {
    const n = R(this, Ot)[t.manifestId];
    if (!n) throw new Error(`No outcome is available for ${t.manifestId}`);
    const i = {
      schemaVersion: Li,
      sessionId: t.sessionId,
      manifestId: t.manifestId,
      revealedAt: t.revealedAt,
      revealedBeforeDecisionCompletion: t.revealedBeforeDecisionCompletion,
      outcome: n
    };
    return y({
      ...i,
      id: `replay-outcome:${T(i).slice(8)}`
    });
  }
}
Ot = new WeakMap();
function xm(e, t) {
  return Cn(e), y({
    schemaVersion: za,
    id: t.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: t.type,
    payload: t.payload ?? {}
  });
}
function $o(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && F(e.timeframe), e.type === "PriceCrossesKnownLevel" && !zn(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!zn(e.frozenLowerBound) || !zn(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const t = {
    schemaVersion: wl,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map($o) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return y({
    ...t,
    id: `replay-wake-condition:${T(t).slice(8)}`
  });
}
function Im(e) {
  var n, i;
  if (na(e.createdAt, "wake plan createdAt"), na(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((n = e.scheduledReview) == null ? void 0 : n.mode) === "nextCompletedCandle" && F(e.scheduledReview.timeframe), ((i = e.scheduledReview) == null ? void 0 : i.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const t = {
    schemaVersion: bl,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map($o),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!t.scheduledReview && !t.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return y({
    ...t,
    id: `replay-wake-plan:${T(t).slice(8)}`
  });
}
function km(e) {
  or(e);
  const t = {
    schemaVersion: qa,
    id: Uo(e),
    replayEngineVersion: e.sessionConfig.replayEngineVersion,
    manifestId: e.manifest.id,
    manifestSchemaVersion: e.manifest.schemaVersion,
    radarEpisodeId: e.dataBundle.radarEpisode.id,
    radarEpisodeObservationId: e.dataBundle.radarEpisode.observationId,
    radarSelectionProfileRef: {
      id: e.radarSelectionProfile.id,
      version: e.radarSelectionProfile.version,
      hash: e.radarSelectionProfile.canonicalConfigHash
    },
    strategyProfileRef: {
      id: e.strategyProfile.id,
      version: e.strategyProfile.version,
      hash: e.strategyProfile.profileHash
    },
    lifecycleVersion: e.strategyProfile.lifecycleVersion,
    lifecycleConfigHash: e.strategyProfile.lifecycleConfigHash,
    sessionConfigRef: {
      id: e.sessionConfig.id,
      version: e.sessionConfig.version,
      hash: e.sessionConfig.canonicalConfigHash
    },
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    venueRulesRef: e.sessionConfig.venueRulesRef,
    createdAtLogicalTime: e.manifest.startAsOf,
    ...e.materializedAnalysisBinding ? { materializedAnalysisRef: e.materializedAnalysisBinding } : {}
  };
  return ar({
    ...t,
    revision: 0,
    state: "Created",
    currentAsOf: null,
    currentFrameId: null,
    frames: [],
    decisionRecords: [],
    planningAttempts: [],
    events: [],
    terminalReason: null,
    revealedBeforeDecisionCompletion: !1,
    revealedOutcomeEnvelopeId: null
  });
}
function Uo(e) {
  return `replay-session:${T({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function ui(e) {
  var p, h;
  const { loaded: t, session: n, effectiveAsOf: i } = e, r = Z(t);
  if (i < t.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const a = xt(t, i), o = y({ ...a.lifecycle, asOf: i }), s = [
    ...r.dataQualityNotes,
    ...a.dataQualityNotes,
    ...t.sessionConfig.replayEngineVersion === An && a.lifecycle.asOf != null && a.lifecycle.asOf < i ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${a.id} was carried forward from ${a.lifecycle.asOf}`
    }] : []
  ], c = Cc({
    symbol: t.manifest.symbol,
    source: t.manifest.source,
    decisionTime: i,
    effectiveAsOf: i,
    strategyProfile: t.strategyProfile,
    lifecycle: o,
    candidateMetrics: a.candidateMetrics,
    structureByTimeframe: a.structureByTimeframe,
    activeStructureLevels: a.activeStructureLevels,
    supportResistanceZones: a.supportResistanceZones,
    avwapState: a.avwapState,
    avwapEvents: a.avwapEvents,
    relativeStrengthState: a.relativeStrengthState,
    relativeStrengthEvents: a.relativeStrengthEvents,
    visibleOrSelectedReferenceLevels: a.visibleOrSelectedReferenceLevels,
    dataQualityNotes: s
  }), l = {}, u = {}, f = {};
  for (const A of t.sessionConfig.visibleTimeframes) {
    const b = qo(
      r.candlesByTimeframe[A] ?? [],
      i
    ).filter((E) => E.openTime >= r.displayStartByTimeframe[A]);
    l[A] = b, f[A] = b.at(-1) ?? null, u[A] = {
      timeframe: A,
      displayStart: r.displayStartByTimeframe[A],
      visibleStart: ((p = b[0]) == null ? void 0 : p.openTime) ?? null,
      visibleEnd: ((h = b.at(-1)) == null ? void 0 : h.closeTime) ?? null,
      completedCandleCount: b.length
    };
  }
  const d = await it({
    effectiveAsOf: i,
    analysisObservationId: a.id,
    visibleCandlesByTimeframe: l
  }), m = n.decisionRecords.map((A) => {
    var b;
    return {
      decisionRecordId: A.id,
      frameId: ((b = n.frames.find((E) => E.decisionSnapshot.id === A.snapshotId)) == null ? void 0 : b.id) ?? "",
      action: A.action,
      decisionTime: A.decisionTime
    };
  }), v = {
    schemaVersion: Al,
    sessionId: n.id,
    manifestId: t.manifest.id,
    radarEpisodeId: t.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: i,
    evaluationTimeframe: t.sessionConfig.evaluationTimeframe,
    radarContext: sd(t),
    decisionSnapshot: c,
    visibleCandlesByTimeframe: l,
    visibleCoverageByTimeframe: u,
    latestVisibleCandleByTimeframe: f,
    visibleDataFingerprint: d,
    lifecycleState: c.lifecycleState,
    lifecycleStateSince: c.lifecycleStateSince,
    pendingConditions: c.pendingConditions,
    priorDecisionSummary: m,
    activeWakeResult: e.wakeResult ?? null,
    dataQualityNotes: s,
    generatedAtLogicalTime: i,
    ...a.materializedStateRef ? { materializedAnalysisStateRef: a.materializedStateRef } : {}
  };
  return y({
    ...v,
    id: `replay-frame:${T(v).slice(8)}`
  });
}
function sd(e) {
  const t = e.dataBundle.radarEpisode;
  return y({
    radarEpisodeId: t.id,
    triggeringDetectorIds: t.triggeringDetectorIds,
    triggeringObservations: t.triggeringObservations,
    selectionAnchor: t.selectionAnchor,
    pathContext: t.pathContext,
    hardGateResults: t.hardGateResults
  });
}
function xt(e, t) {
  const i = Z(e).analysisStateHistory.filter(
    (r) => r.knownAt <= t
  ).at(-1);
  if (!i || i.id !== wn(i))
    throw new Error(`No verified point-in-time analysis state is available at ${t}`);
  return i;
}
function qo(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > t || i.knownAt > t) continue;
    const r = n.get(i.logicalCandleId);
    if (!r || r.knownAt < i.knownAt) n.set(i.logicalCandleId, i);
    else if (r.knownAt === i.knownAt && C(r) !== C(i))
      throw new Error(`Conflicting candle revisions for ${i.logicalCandleId}`);
  }
  return y(
    [...n.values()].sort(
      (i, r) => i.openTime - r.openTime || i.knownAt - r.knownAt
    )
  );
}
async function Om(e, t, n, i) {
  or(e), Cn(t), Zo(t, e);
  const r = t.events.find((c) => c.command.id === n.id);
  if (r) {
    if (C(r.command) !== C(n))
      throw new Error(`Command id ${n.id} was reused with a different payload`);
    return { session: y(t), event: r, outcomeEnvelope: null, idempotent: !0 };
  }
  zo(t, n), n.type === "StartSession" && await Yn(e, e.manifest.startAsOf);
  let a, o = null;
  if (n.type === "StartSession") {
    if (t.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await ui({
      loaded: e,
      session: t,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    a = Je(n, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (t.state !== "Active" && n.type !== "RevealOutcome")
      throw new Error(`Command ${n.type} is not allowed while session is ${t.state}`);
    const c = fi(t);
    if (n.type === "Wait") {
      Qo(e, t, c, n.payload.wakePlan);
      const l = Go(
        e,
        c.effectiveAsOf,
        n.payload.wakePlan.scheduledReview
      );
      await Yn(
        e,
        Math.min(
          n.payload.wakePlan.deadlineAsOf,
          e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration,
          l ?? 1 / 0
        )
      );
      const u = Mn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [n.payload.reason, ...n.payload.tags ?? []],
        nextCondition: hd(n.payload.wakePlan)
      }), f = await Wo(
        e,
        t,
        c,
        n.payload.wakePlan
      ), d = y({
        ...t,
        decisionRecords: [...t.decisionRecords, u]
      }), m = await ui({
        loaded: e,
        session: d,
        requestedAsOf: f.requestedAsOf,
        effectiveAsOf: f.effectiveAsOf,
        wakeResult: f.wakeResult
      });
      a = Je(n, f.state, m.effectiveAsOf, {
        frame: m,
        decisionRecord: u,
        wakePlan: n.payload.wakePlan,
        wakeResult: f.wakeResult,
        terminalReason: f.terminalReason
      });
    } else if (n.type === "Skip") {
      if (!n.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const l = Mn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [...n.payload.tags ?? [], ...n.payload.reasons.slice(1)],
        skipReason: n.payload.reasons[0]
      });
      a = Je(n, "Skipped", c.effectiveAsOf, {
        decisionRecord: l
      });
    } else if (n.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const l = Hl({
        ...n.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), u = fd(e, l), f = y({
        id: `replay-planning-attempt:${T({
          sessionId: t.id,
          frameId: c.id,
          tradePlan: l
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: l,
        accepted: u == null,
        rejectionReason: u
      }), d = u ? null : Mn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: l
      });
      a = Je(
        n,
        u ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: f, decisionRecord: d }
      );
    } else if (n.type === "Abandon") {
      if (!n.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      a = Je(n, "Abandoned", c.effectiveAsOf);
    } else {
      const l = await wd(e, t, n, i);
      o = l.envelope, a = Je(n, "Revealed", l.revealedAt, {
        terminalReason: t.terminalReason,
        revealedBeforeDecisionCompletion: l.early,
        outcomeEnvelopeId: l.envelope.id
      });
    }
  }
  const s = cd(t, a);
  return {
    session: rr(t, s),
    event: s,
    outcomeEnvelope: o,
    idempotent: !1
  };
}
function Je(e, t, n, i = {}) {
  return {
    command: e,
    stateAfter: t,
    currentAsOfAfter: n,
    frame: i.frame ?? null,
    decisionRecord: i.decisionRecord ?? null,
    planningAttempt: i.planningAttempt ?? null,
    wakePlan: i.wakePlan ?? null,
    wakeResult: i.wakeResult ?? null,
    terminalReasonAfter: i.terminalReason ?? null,
    revealedBeforeDecisionCompletionAfter: i.revealedBeforeDecisionCompletion ?? !1,
    revealedOutcomeEnvelopeIdAfter: i.outcomeEnvelopeId ?? null
  };
}
function cd(e, t) {
  const n = {
    schemaVersion: Qa,
    sequence: e.revision + 1,
    ...t
  };
  return y({
    ...n,
    id: `replay-event:${T(n).slice(8)}`
  });
}
function rr(e, t) {
  var n;
  if (t.schemaVersion !== Qa)
    throw new Error("Replay event schema is invalid");
  if (t.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (t.id !== ud(t)) throw new Error("Replay event identity is invalid");
  if (t.command.sessionId !== e.id || t.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (t.frame) {
    const { id: i, ...r } = t.frame;
    if (t.frame.id !== `replay-frame:${T(r).slice(8)}` || t.frame.sessionId !== e.id || t.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    sr(t.frame);
  }
  if (t.decisionRecord && t.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (t.wakePlan && t.wakePlan.id !== jo(t.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (t.wakeResult) {
    const { id: i, ...r } = t.wakeResult;
    if (t.wakeResult.id !== `replay-wake-result:${T(r).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return ld(e, t), ar({
    ...e,
    revision: t.sequence,
    state: t.stateAfter,
    currentAsOf: t.currentAsOfAfter,
    currentFrameId: ((n = t.frame) == null ? void 0 : n.id) ?? e.currentFrameId,
    frames: t.frame ? [...e.frames, t.frame] : e.frames,
    decisionRecords: t.decisionRecord ? [...e.decisionRecords, t.decisionRecord] : e.decisionRecords,
    planningAttempts: t.planningAttempt ? [...e.planningAttempts, t.planningAttempt] : e.planningAttempts,
    events: [...e.events, t],
    terminalReason: t.terminalReasonAfter,
    revealedBeforeDecisionCompletion: e.revealedBeforeDecisionCompletion || t.revealedBeforeDecisionCompletionAfter,
    revealedOutcomeEnvelopeId: t.revealedOutcomeEnvelopeIdAfter ?? e.revealedOutcomeEnvelopeId
  });
}
function ld(e, t) {
  var u, f, d;
  const n = t.currentAsOfAfter === e.currentAsOf, i = t.frame == null, r = t.decisionRecord == null, a = t.planningAttempt == null, o = t.wakePlan == null && t.wakeResult == null, s = !t.revealedBeforeDecisionCompletionAfter && t.revealedOutcomeEnvelopeIdAfter == null;
  if (t.stateAfter === "Failed")
    throw new Error("Failed replay sessions cannot be synthesized from accepted commands");
  if (t.command.type === "StartSession") {
    if (e.state !== "Created" || t.stateAfter !== "Active" || !t.frame || t.currentAsOfAfter !== t.frame.effectiveAsOf || t.currentAsOfAfter !== e.createdAtLogicalTime || !r || !a || !o || !s || t.terminalReasonAfter != null) throw new Error("StartSession event transition is invalid");
    return;
  }
  if (t.command.type === "Wait") {
    const m = t.stateAfter === "CaseWindowEnded";
    if (e.state !== "Active" || !t.frame || !t.decisionRecord || t.decisionRecord.action !== "Wait" || !t.wakePlan || !t.wakeResult || t.wakeResult.wakePlanId !== t.wakePlan.id || ((u = t.frame.activeWakeResult) == null ? void 0 : u.id) !== t.wakeResult.id || t.currentAsOfAfter !== t.frame.effectiveAsOf || !["Active", "CaseWindowEnded"].includes(t.stateAfter) || m !== (t.terminalReasonAfter != null) || !a || !s) throw new Error("Wait event transition is invalid");
    return;
  }
  if (t.command.type === "Skip") {
    if (e.state !== "Active" || t.stateAfter !== "Skipped" || !t.decisionRecord || t.decisionRecord.action !== "Skip" || !n || !i || !a || !o || !s || t.terminalReasonAfter != null) throw new Error("Skip event transition is invalid");
    return;
  }
  if (t.command.type === "ProposeTrade") {
    const m = ((f = t.planningAttempt) == null ? void 0 : f.accepted) === !0, v = t.planningAttempt ? `replay-planning-attempt:${T({
      sessionId: e.id,
      frameId: t.planningAttempt.frameId,
      tradePlan: t.planningAttempt.tradePlan
    }).slice(8)}` : null;
    if (e.state !== "Active" || !t.planningAttempt || t.planningAttempt.id !== v || t.planningAttempt.frameId !== e.currentFrameId || t.planningAttempt.attemptedAt !== e.currentAsOf || t.stateAfter !== (m ? "TradePlanRecorded" : "Active") || (m ? ((d = t.decisionRecord) == null ? void 0 : d.action) !== "ProposeTrade" : t.decisionRecord != null) || !n || !i || !o || !s || t.terminalReasonAfter != null) throw new Error("ProposeTrade event transition is invalid");
    return;
  }
  if (t.command.type === "Abandon") {
    if (e.state !== "Active" || t.stateAfter !== "Abandoned" || !n || !i || !r || !a || !o || !s || t.terminalReasonAfter != null) throw new Error("Abandon event transition is invalid");
    return;
  }
  const c = [
    "Skipped",
    "TradePlanRecorded",
    "CaseWindowEnded",
    "Abandoned"
  ].includes(e.state), l = e.state === "Active" && t.command.payload.abandonActive && t.revealedBeforeDecisionCompletionAfter;
  if (!c && !l || t.stateAfter !== "Revealed" || !n || !i || !r || !a || !o || t.revealedOutcomeEnvelopeIdAfter == null || t.terminalReasonAfter !== e.terminalReason) throw new Error("RevealOutcome event transition is invalid");
}
function ud(e) {
  const { id: t, ...n } = e;
  return `replay-event:${T(n).slice(8)}`;
}
function zo(e, t) {
  if (t.schemaVersion !== za || !t.id.trim())
    throw new Error("Replay command schema or id is invalid");
  if (t.sessionId !== e.id) throw new Error("Replay command targets another session");
  if (t.expectedRevision !== e.revision)
    throw new Error(`Stale replay revision ${t.expectedRevision}; expected ${e.revision}`);
  if (t.currentFrameId !== e.currentFrameId)
    throw new Error("Replay command does not reference the current frame");
  const n = e.currentAsOf ?? e.createdAtLogicalTime;
  if (t.submittedLogicalTime !== n)
    throw new Error("Replay command submittedLogicalTime must equal the current replay clock");
  if (e.state === "Revealed" || e.state === "Failed")
    throw new Error(`No commands are accepted after ${e.state}`);
}
function fi(e) {
  const t = e.frames.find((n) => n.id === e.currentFrameId);
  if (!t || t.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return t;
}
function fd(e, t) {
  if (t.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (t.sizingResult.sizingModelVersion !== Ya)
    return "Sizing model version mismatch";
  if (t.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (t.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (t.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && C(t.venueRules) !== C(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const n = e.manifest.executionVenueEligibility.executionVenue, i = e.manifest.executionVenueEligibility.marketDataSource, r = t.venueRules.venue.toLowerCase();
  return n && r !== n.toLowerCase() && r !== i.toLowerCase() ? "Trade plan venue does not match the intended or proxy execution venue" : dd(e, t.createdAt, n) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function dd(e, t, n) {
  const i = Z(e).venueEvidence.filter(
    (a) => a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo > t) && a.executionVenue.toLowerCase() === n.toLowerCase()
  ).at(-1);
  if (i) return i.status;
  const r = e.manifest.executionVenueEligibility;
  return r.effectiveFrom <= t && (r.effectiveTo == null || r.effectiveTo > t) ? r.status : "Unavailable";
}
function Qo(e, t, n, i) {
  var r;
  if (i.id !== jo(i)) throw new Error("Wake plan identity is invalid");
  if (i.submittedFrameId !== n.id || i.createdAt !== n.effectiveAsOf)
    throw new Error("Wake plan must be frozen against the current frame");
  if (i.deadlineAsOf > n.effectiveAsOf + e.sessionConfig.maximumSingleWaitDuration || i.deadlineAsOf > e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration)
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  if (((r = i.scheduledReview) == null ? void 0 : r.mode) === "nextCompletedCandle" && !Object.hasOwn(
    Z(e).candlesByTimeframe,
    i.scheduledReview.timeframe
  ))
    throw new RangeError(
      `Scheduled review timeframe ${i.scheduledReview.timeframe} is not loaded`
    );
  for (const a of Sn(i.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(a.type))
      throw new RangeError(`Wake condition ${a.type} is not allowed`);
    if (a.id !== md(a))
      throw new Error(`Wake condition ${a.id} failed deterministic verification`);
  }
  if (vd(n, i.conditions), yd(e, n, i.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (t.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function jo(e) {
  const { id: t, ...n } = e;
  return `replay-wake-plan:${T(n).slice(8)}`;
}
function md(e) {
  const { id: t, ...n } = e;
  return `replay-wake-condition:${T(n).slice(8)}`;
}
function vd(e, t) {
  const n = Sa(e.decisionSnapshot);
  for (const i of Sn(t)) {
    if (i.type === "PriceCrossesKnownLevel") {
      const r = n.find((a) => a.id === i.referenceId);
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame reference ${i.referenceId}`);
      if (r.price !== i.frozenPrice)
        throw new Error("Frozen level price does not match the current DecisionFrame");
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = n.find(
        (a) => a.sourceObject.observationId === i.zoneObservationId
      );
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame zone ${i.zoneObservationId}`);
      if (r.rangeLow !== i.frozenLowerBound || r.rangeHigh !== i.frozenUpperBound)
        throw new Error("Frozen zone bounds do not match the current DecisionFrame");
    }
  }
}
function yd(e, t, n) {
  for (const i of Sn(n)) {
    if (i.type === "LifecycleStateEntered" && t.lifecycleState === i.state) return !0;
    if (i.type === "PriceCrossesKnownLevel") {
      const r = It(e, i.timeframe, t.effectiveAsOf);
      if (r != null && (i.direction === "above" && r >= i.frozenPrice || i.direction === "below" && r <= i.frozenPrice)) return !0;
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = It(e, i.timeframe, t.effectiveAsOf);
      if (r != null && r >= i.frozenLowerBound && r <= i.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function Sn(e) {
  return e.flatMap(
    (t) => t.type === "AnyOf" ? [t, ...Sn(t.conditions)] : [t]
  );
}
function hd(e) {
  return C({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((t) => t.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function Wo(e, t, n, i) {
  var P;
  const r = n.effectiveAsOf, a = Z(e), o = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = pd(e), c = Go(e, r, i.scheduledReview), l = ((P = i.scheduledReview) == null ? void 0 : P.mode) === "elapsedDuration" ? r + i.scheduledReview.durationSeconds : c ?? i.deadlineAsOf, u = Math.min(i.deadlineAsOf, o, s);
  if (u < r) throw new Error("Historical coverage ends before the replay clock");
  const f = /* @__PURE__ */ new Set([u]);
  for (const w of a.analysisStateHistory)
    w.knownAt > r && w.knownAt <= u && f.add(w.knownAt);
  for (const w of a.knownEvents)
    w.knownAt > r && w.knownAt <= u && f.add(w.knownAt);
  for (const w of Object.values(a.candlesByTimeframe))
    for (const g of w) {
      const S = Math.max(g.closeTime, g.knownAt);
      S > r && S <= u && f.add(S);
    }
  c != null && c > r && c <= u && f.add(c), i.deadlineAsOf > r && i.deadlineAsOf <= u && f.add(i.deadlineAsOf), o > r && o <= u && f.add(o), s > r && s <= u && f.add(s);
  const d = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null
  }, m = [...f].sort((w, g) => w - g);
  let v = u, p = "DEADLINE_REACHED", h = [], A = [], b = null;
  for (const w of m) {
    d.evaluationPointsChecked.push(w);
    const g = gd(e, w, r);
    d.lifecycleTransitionsEncountered.push(...g);
    const S = Ko(e, i.conditions, r, w, d), I = bd(e, w, r);
    if (I) {
      v = w, p = "CASE_BOUNDARY_REACHED", b = I, h = S.conditionIds, A = S.eventIds, S.conditionIds.length && (d.firstTriggeringEffectiveAsOf = w);
      break;
    }
    if (S.conditionIds.length) {
      v = w, p = "CONDITION_TRIGGERED", h = S.conditionIds, A = S.eventIds, d.firstTriggeringEffectiveAsOf = w;
      break;
    }
    if (c != null && w >= c) {
      v = w, p = "SCHEDULED_REVIEW";
      break;
    }
    if (w >= u) {
      v = u, u === o ? (p = "CASE_BOUNDARY_REACHED", b = "MAXIMUM_CASE_DURATION") : u === s ? (p = "CASE_BOUNDARY_REACHED", b = "DATA_COVERAGE_ENDED") : p = "DEADLINE_REACHED";
      break;
    }
  }
  const E = {
    schemaVersion: El,
    wakePlanId: i.id,
    startedAt: r,
    effectiveAsOf: v,
    reason: p,
    triggeredConditionIds: [...new Set(h)],
    triggeringEventIds: [...new Set(A)],
    auditTrace: d
  }, _ = y({
    ...E,
    id: `replay-wake-result:${T(E).slice(8)}`
  });
  return {
    requestedAsOf: l,
    effectiveAsOf: v,
    state: b ? "CaseWindowEnded" : "Active",
    terminalReason: b,
    wakeResult: _
  };
}
function Go(e, t, n) {
  if (!n) return null;
  if (n.mode === "nextCompletedCandle")
    return ea(e, n.timeframe, t);
  const i = F(e.sessionConfig.evaluationTimeframe), r = t + n.durationSeconds, a = Math.ceil(r / i) * i;
  return ea(e, e.sessionConfig.evaluationTimeframe, a - 1);
}
function ea(e, t, n) {
  return (Z(e).candlesByTimeframe[t] ?? []).filter((i) => i.closeTime > n).map((i) => Math.max(i.closeTime, i.knownAt)).sort((i, r) => i - r)[0] ?? null;
}
function pd(e) {
  const n = (Z(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((i) => i.closeTime);
  return n.length ? Math.max(...n) : e.manifest.startAsOf;
}
function gd(e, t, n) {
  var o;
  const i = Z(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === t && s.knownAt > n
  ).map((s) => s.id), r = (o = di(e, t)) == null ? void 0 : o.lifecycle.currentState, a = xt(e, t);
  return r !== a.lifecycle.currentState && i.push(a.id), [...new Set(i)];
}
function di(e, t) {
  return Z(e).analysisStateHistory.filter((n) => n.knownAt < t).at(-1) ?? null;
}
function Ko(e, t, n, i, r) {
  const a = [], o = [];
  for (const s of t) {
    const c = Ad(e, s, n, i, r);
    c.matched && (a.push(...c.conditionIds), o.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(a)], eventIds: [...new Set(o)] };
}
function Ad(e, t, n, i, r) {
  var l, u;
  if (t.type === "AnyOf") {
    const f = Ko(e, t.conditions, n, i, r), d = f.conditionIds.length > 0;
    return r.conditionEvaluations.push({
      conditionId: t.id,
      effectiveAsOf: i,
      matched: d,
      matchedEventIds: f.eventIds
    }), {
      matched: d,
      conditionIds: d ? [t.id, ...f.conditionIds] : [],
      eventIds: f.eventIds
    };
  }
  const a = Z(e).knownEvents.filter(
    (f) => f.knownAt === i && f.knownAt > n
  );
  let o = [], s = !1;
  if (t.type === "NextLifecycleTransition")
    o = a.filter((f) => f.kind === "lifecycleTransition"), s = o.length > 0 || ((l = di(e, i)) == null ? void 0 : l.lifecycle.currentState) !== xt(e, i).lifecycle.currentState;
  else if (t.type === "LifecycleStateEntered")
    o = a.filter(
      (f) => f.kind === "lifecycleTransition" && f.lifecycleState === t.state
    ), s = o.length > 0 || xt(e, i).lifecycle.currentState === t.state && ((u = di(e, i)) == null ? void 0 : u.lifecycle.currentState) !== t.state;
  else if (t.type === "StructureEventConfirmed")
    o = a.filter(
      (f) => f.kind === "structure" && f.timeframe === t.timeframe && f.eventType === t.eventType && f.direction === t.direction
    ), s = o.length > 0;
  else if (t.type === "AvwapEventConfirmed")
    o = a.filter(
      (f) => f.kind === "avwap" && f.eventType === t.eventType && (t.avwapId == null || f.avwapId === t.avwapId)
    ), s = o.length > 0;
  else if (t.type === "RelativeStrengthEventConfirmed")
    o = a.filter(
      (f) => f.kind === "relativeStrength" && f.eventType === t.eventType && (t.timeframe == null || f.timeframe === t.timeframe)
    ), s = o.length > 0;
  else if (t.type === "RadarOrLifecycleTerminal")
    o = a.filter(
      (f) => f.kind === "radarTerminal" || f.kind === "lifecycleTerminal"
    ), s = o.length > 0;
  else if (t.type === "PriceCrossesKnownLevel") {
    const f = ta(e, t.timeframe, i), d = It(e, t.timeframe, i);
    s = f != null && d != null && (t.direction === "above" ? f < t.frozenPrice && d >= t.frozenPrice : f > t.frozenPrice && d <= t.frozenPrice);
  } else if (t.type === "PriceEntersKnownZone") {
    const f = ta(e, t.timeframe, i), d = It(e, t.timeframe, i), m = (v) => v >= t.frozenLowerBound && v <= t.frozenUpperBound;
    s = f != null && d != null && !m(f) && m(d);
  }
  const c = o.map((f) => f.id);
  return r.conditionEvaluations.push({
    conditionId: t.id,
    effectiveAsOf: i,
    matched: s,
    matchedEventIds: c
  }), {
    matched: s,
    conditionIds: s ? [t.id] : [],
    eventIds: c
  };
}
function bd(e, t, n) {
  const i = Z(e).knownEvents.filter(
    (r) => r.knownAt === t && r.knownAt > n
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && i.some((r) => r.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (i.some((r) => r.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(xt(e, t).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function It(e, t, n) {
  var i;
  return ((i = qo(
    Z(e).candlesByTimeframe[t] ?? [],
    n
  ).at(-1)) == null ? void 0 : i.c) ?? null;
}
function ta(e, t, n) {
  const r = (Z(e).candlesByTimeframe[t] ?? []).map((a) => Math.max(a.closeTime, a.knownAt)).filter((a) => a < n);
  return r.length ? It(e, t, Math.max(...r)) : null;
}
async function wd(e, t, n, i) {
  if (!i) throw new Error("Outcome reveal requires a separate ReplayOutcomeStore");
  const r = ["Skipped", "TradePlanRecorded", "CaseWindowEnded", "Abandoned"].includes(
    t.state
  ), a = t.state === "Active";
  if (a && (!n.payload.abandonActive || !e.sessionConfig.allowEarlyReveal))
    throw new Error("Active replay reveal requires configured explicit abandon-and-reveal");
  if (!r && !a) throw new Error(`Outcome cannot be revealed from ${t.state}`);
  const o = t.currentAsOf ?? e.manifest.startAsOf, s = await i.revealCaseOutcome({
    sessionId: t.id,
    manifestId: t.manifestId,
    revealedAt: o,
    revealedBeforeDecisionCompletion: a
  });
  return Ed(t, s, a), { envelope: s, early: a, revealedAt: o };
}
function Ed(e, t, n) {
  const { id: i, ...r } = t;
  if (t.schemaVersion !== Li || t.id !== `replay-outcome:${T(r).slice(8)}` || t.sessionId !== e.id || t.manifestId !== e.manifestId || t.revealedBeforeDecisionCompletion !== n)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function Nm(e) {
  Cn(e), Jo(e);
  for (const t of e.frames) sr(t);
  return C(e);
}
function Td(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized replay session must be an object");
  const n = t;
  Cn(n), Jo(n);
  for (const i of n.frames) sr(i);
  return y(n);
}
async function _m(e, t) {
  const n = Td(e);
  or(t), Zo(n, t);
  const i = Rd(n);
  if (C(i) !== C(n))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (n.currentAsOf != null && n.currentFrameId != null) {
    const r = fi(n), a = n.events.findIndex((u) => {
      var f;
      return ((f = u.frame) == null ? void 0 : f.id) === r.id;
    });
    if (a < 0) throw new Error("Current replay frame is absent from the event log");
    let o = Yo(Xo(n));
    for (const u of n.events.slice(0, a))
      o = rr(o, u);
    const s = n.events[a];
    let c = r.activeWakeResult;
    if (s.command.type === "Wait") {
      const u = fi(o);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      Qo(
        t,
        o,
        u,
        s.wakePlan
      );
      const f = await Wo(
        t,
        o,
        u,
        s.wakePlan
      );
      if (C(f.wakeResult) !== C(s.wakeResult) || f.requestedAsOf !== r.requestedAsOf || f.effectiveAsOf !== r.effectiveAsOf || f.state !== s.stateAfter || f.terminalReason !== s.terminalReasonAfter)
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      c = f.wakeResult;
    }
    if (s.decisionRecord && (o = y({
      ...o,
      decisionRecords: [...o.decisionRecords, s.decisionRecord]
    })), (await ui({
      loaded: t,
      session: o,
      requestedAsOf: r.requestedAsOf,
      effectiveAsOf: r.effectiveAsOf,
      wakeResult: c
    })).id !== r.id)
      throw new Error("Replay resume data does not reproduce the current DecisionFrame");
  }
  return n;
}
function Rd(e) {
  let t = Yo(Xo(e));
  const n = /* @__PURE__ */ new Set();
  for (const i of e.events) {
    if (n.has(i.command.id)) throw new Error("Replay event log repeats a command id");
    n.add(i.command.id), zo(t, i.command), t = rr(t, i);
  }
  return t;
}
function Yo(e) {
  return ar({
    ...e,
    revision: 0,
    state: "Created",
    currentAsOf: null,
    currentFrameId: null,
    frames: [],
    decisionRecords: [],
    planningAttempts: [],
    events: [],
    terminalReason: null,
    revealedBeforeDecisionCompletion: !1,
    revealedOutcomeEnvelopeId: null
  });
}
function Xo(e) {
  return y({
    schemaVersion: e.schemaVersion,
    id: e.id,
    replayEngineVersion: e.replayEngineVersion,
    manifestId: e.manifestId,
    manifestSchemaVersion: e.manifestSchemaVersion,
    radarEpisodeId: e.radarEpisodeId,
    radarEpisodeObservationId: e.radarEpisodeObservationId,
    radarSelectionProfileRef: e.radarSelectionProfileRef,
    strategyProfileRef: e.strategyProfileRef,
    lifecycleVersion: e.lifecycleVersion,
    lifecycleConfigHash: e.lifecycleConfigHash,
    sessionConfigRef: e.sessionConfigRef,
    marketDataBundleFingerprint: e.marketDataBundleFingerprint,
    venueRulesRef: e.venueRulesRef,
    createdAtLogicalTime: e.createdAtLogicalTime,
    ...e.materializedAnalysisRef ? { materializedAnalysisRef: e.materializedAnalysisRef } : {}
  });
}
function ar(e) {
  const { integrityHash: t, ...n } = e;
  return y({ ...n, integrityHash: T(n) });
}
function Cn(e) {
  if (e.schemaVersion !== qa || !En(e.replayEngineVersion)) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: t, ...n } = e;
  if (t !== T(n)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function or(e) {
  if (Bi(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || !En(e.sessionConfig.replayEngineVersion) || e.sessionConfig.replayEngineVersion === _e && !e.materializedAnalysisBinding || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function Zo(e, t) {
  if (e.id !== Uo(t) || e.manifestId !== t.manifest.id || e.radarEpisodeId !== t.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== t.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== t.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== t.strategyProfile.profileHash || e.lifecycleVersion !== t.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== t.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== t.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== t.dataBundle.causalPrefixFingerprint || e.replayEngineVersion !== t.sessionConfig.replayEngineVersion || C(e.materializedAnalysisRef ?? null) !== C(t.materializedAnalysisBinding ?? null) || C(e.venueRulesRef) !== C(t.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function sr(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const t of Object.values(e.visibleCandlesByTimeframe))
    if (t.some((n) => n.closeTime > e.effectiveAsOf || n.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  Sd(e, e.effectiveAsOf);
}
function Sd(e, t) {
  const n = (i) => {
    if (!(!i || typeof i != "object")) {
      if (Array.isArray(i)) {
        i.forEach(n);
        return;
      }
      for (const [r, a] of Object.entries(i)) {
        if (r === "knownAt" && typeof a == "number" && a > t)
          throw new Error("Replay frame contains evidence not known at its cutoff");
        n(a);
      }
    }
  };
  n(e);
}
function Jo(e) {
  const t = /* @__PURE__ */ new Set([
    "futureOutcomeRef",
    "futureCandlesByTimeframe",
    "outcome",
    "maximumFavorablePriceExcursionFromDetected",
    "maximumAdversePriceExcursionFromDetected",
    "radarTerminalResult",
    "lifecycleStateTimestamps",
    "executionResult",
    "executionEvents",
    "fills",
    "actualNetPnl",
    "maximumAdverseExcursion",
    "maximumFavorableExcursion"
  ]), n = (i) => {
    if (!(!i || typeof i != "object")) {
      if (Array.isArray(i)) {
        i.forEach(n);
        return;
      }
      for (const [r, a] of Object.entries(i)) {
        if (t.has(r)) throw new Error(`Public replay session contains forbidden key ${r}`);
        n(a);
      }
    }
  };
  n(e);
}
function zn(e) {
  return Number.isFinite(e) && e > 0;
}
function na(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
const Cd = "trainer-ui.1", Mm = "trainer-worker-protocol.1", Pd = "trainer-presentation-profile.1", xd = "trainer-study-run.1", Fm = "trainer-study-case.1", Id = "trainer-case-bundle.1", Lm = "trainer-public-frame.1", Dm = "trainer-analysis-action.1", kd = "trainer-review-record.1", Hm = "trainer-local-store.1", Od = "trainer-corpus-index.1";
function Bm(e) {
  const t = y(e), n = {
    ...t,
    bundleFingerprint: es(t)
  };
  return Nd(n), y(n);
}
function es(e) {
  const { bundleFingerprint: t, ...n } = e;
  return T(n);
}
function Nd(e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError("TrainerCaseBundle must be an object");
  const t = e;
  if (t.schemaVersion !== Id)
    throw new Error(`Unsupported trainer case bundle schema: ${String(t.schemaVersion)}`);
  if (Se(t.bundleId, "bundleId"), Se(t.bundleFingerprint, "bundleFingerprint"), t.bundleFingerprint !== es(t))
    throw new Error("TrainerCaseBundle fingerprint mismatch");
  if (t.safeDescriptor.replayCaseManifestId !== t.replayCaseManifest.id)
    throw new Error("Safe descriptor ReplayCaseManifest reference mismatch");
  if (t.safeDescriptor.radarEpisodeId !== t.replayCaseManifest.radarEpisodeId)
    throw new Error("Safe descriptor RadarEpisode reference mismatch");
  const n = t.replayCaseManifest.selectionProfileRef;
  if (n.id !== t.radarSelectionProfile.id || n.version !== t.radarSelectionProfile.version || n.canonicalConfigHash !== t.radarSelectionProfile.canonicalConfigHash) throw new Error("RadarSelectionProfile reference mismatch");
  const i = t.replayCaseManifest.strategyProfileRef;
  if (i.id !== t.strategyProfile.id || i.version !== t.strategyProfile.version || i.profileHash !== t.strategyProfile.profileHash) throw new Error("StrategyProfile reference mismatch");
  if (t.replaySessionConfig.strategyProfileRef.id !== t.strategyProfile.id || t.replaySessionConfig.strategyProfileRef.profileHash !== t.strategyProfile.profileHash) throw new Error("ReplaySessionConfig strategy reference mismatch");
  if (t.replayAnalysisProfile.lifecycleConfigRef.version !== t.strategyProfile.lifecycleVersion || t.replayAnalysisProfile.lifecycleConfigRef.configHash !== t.strategyProfile.lifecycleConfigHash) throw new Error("ReplayAnalysisProfile lifecycle reference mismatch");
  if (t.safeDescriptor.symbol !== t.replayCaseManifest.symbol)
    throw new Error("Safe descriptor symbol mismatch");
  if (t.safeDescriptor.source !== t.replayCaseManifest.source)
    throw new Error("Safe descriptor source mismatch");
}
function Vm(e, t) {
  Se(e, "corpus id"), ts(t.map((i) => i.id), "case id");
  const n = {
    schemaVersion: Od,
    id: e,
    cases: y(t)
  };
  return y({ ...n, fingerprint: T(n) });
}
function $m(e, t, n, i = {}) {
  if (Se(t, "selection seed"), !Number.isInteger(n) || n < 1) throw new RangeError("Case count must be positive");
  const r = e.cases.filter((o) => _d(o, i)), a = /* @__PURE__ */ new Map();
  for (const o of r)
    a.has(o.radarEpisodeId) || a.set(o.radarEpisodeId, o);
  return y([...a.values()].sort((o, s) => {
    const c = T({ seed: t, corpus: e.fingerprint, caseId: o.id }), l = T({ seed: t, corpus: e.fingerprint, caseId: s.id });
    return c.localeCompare(l) || o.id.localeCompare(s.id);
  }).slice(0, n));
}
function Um(e, t, n = !1) {
  return y(!t || n ? e : {
    ...e,
    detectedAt: null,
    symbol: null,
    source: null
  });
}
function qm(e) {
  if (e.schemaVersion !== Pd)
    throw new Error("Unsupported trainer presentation profile schema");
  if (Se(e.id, "presentation profile id"), Se(e.version, "presentation profile version"), !e.paneTimeframes.length || e.paneTimeframes.length > 4)
    throw new RangeError("A presentation profile requires one to four panes");
  return y({ ...e, canonicalConfigHash: T(e) });
}
function zm(e) {
  if (Se(e.id, "study run id"), Se(e.selectionSeed, "selection seed"), e.requestedCaseCount !== e.selectedCaseIds.length)
    throw new Error("Requested and selected case counts must match");
  ts(e.selectedCaseIds, "selected case id");
  const t = {
    ...y(e),
    schemaVersion: xd,
    trainerVersion: Cd
  };
  return y({ ...t, canonicalConfigHash: T(t) });
}
function Qm(e) {
  if (Se(e.id, "review id"), e.decisionQualityRating != null && (!Number.isInteger(e.decisionQualityRating) || e.decisionQualityRating < 1 || e.decisionQualityRating > 5)) throw new RangeError("Decision quality rating must be from 1 through 5");
  return y({
    ...e,
    schemaVersion: kd
  });
}
function _d(e, t) {
  if (t.radarSelectionProfileId && e.radarSelectionProfileRef.id !== t.radarSelectionProfileId || t.triggerDetectorId && !e.triggerDetectorIds.includes(t.triggerDetectorId) || t.scanTimeframe && e.scanTimeframe !== t.scanTimeframe || t.source && e.source !== t.source || t.dataQualityStatus && e.dataQualityStatus !== t.dataQualityStatus || t.venueEligibility && e.venueEligibility !== t.venueEligibility || t.pathContextTag && !e.pathContextTags.includes(t.pathContextTag)) return !1;
  if (t.minimumSelectionMetric) {
    const n = e.selectionMetrics[t.minimumSelectionMetric.key];
    if (typeof n != "number" || n < t.minimumSelectionMetric.value) return !1;
  }
  if (t.maximumSelectionMetric) {
    const n = e.selectionMetrics[t.maximumSelectionMetric.key];
    if (typeof n != "number" || n > t.maximumSelectionMetric.value) return !1;
  }
  return !0;
}
function Se(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
}
function ts(e, t) {
  if (new Set(e).size !== e.length) throw new Error(`Duplicate ${t}`);
}
export {
  Br as $,
  To as A,
  tu as B,
  Wd as C,
  Dl as D,
  qi as E,
  ao as F,
  tm as G,
  Pm as H,
  ht as I,
  Cf as J,
  lm as K,
  Tm as L,
  Eo as M,
  Ht as N,
  Am as O,
  eu as P,
  Ci as Q,
  Si as R,
  Mc as S,
  Ca as T,
  Fc as U,
  Lc as V,
  xi as W,
  ti as X,
  ef as Y,
  We as Z,
  vm as _,
  Ta as a,
  zd as a$,
  Ju as a0,
  wo as a1,
  Nf as a2,
  ir as a3,
  Di as a4,
  Pa as a5,
  za as a6,
  Tl as a7,
  Al as a8,
  An as a9,
  zi as aA,
  Jl as aB,
  Au as aC,
  Ff as aD,
  Vd as aE,
  Om as aF,
  rt as aG,
  Za as aH,
  De as aI,
  $e as aJ,
  mr as aK,
  os as aL,
  em as aM,
  C as aN,
  wm as aO,
  pi as aP,
  Ms as aQ,
  _s as aR,
  As as aS,
  qd as aT,
  Dd as aU,
  ps as aV,
  at as aW,
  Qd as aX,
  Oe as aY,
  pa as aZ,
  Ds as a_,
  Qa as aa,
  Qr as ab,
  Hi as ac,
  _e as ad,
  Li as ae,
  Fi as af,
  qa as ag,
  wl as ah,
  bl as ai,
  El as aj,
  Ya as ak,
  Ll as al,
  bc as am,
  bm as an,
  Xa as ao,
  Dm as ap,
  Id as aq,
  Od as ar,
  Hm as as,
  Pd as at,
  Lm as au,
  kd as av,
  Fm as aw,
  xd as ax,
  Cd as ay,
  Mm as az,
  Sc as b,
  bu as b$,
  bs as b0,
  $d as b1,
  gs as b2,
  Ls as b3,
  Gd as b4,
  ha as b5,
  Fs as b6,
  Hd as b7,
  Ud as b8,
  hm as b9,
  $o as bA,
  Im as bB,
  om as bC,
  Ra as bD,
  Hl as bE,
  Bm as bF,
  Vm as bG,
  qm as bH,
  Qm as bI,
  zm as bJ,
  Xd as bK,
  iu as bL,
  am as bM,
  Tc as bN,
  Ri as bO,
  Sa as bP,
  mm as bQ,
  Df as bR,
  Td as bS,
  So as bT,
  la as bU,
  jd as bV,
  Bl as bW,
  sm as bX,
  oo as bY,
  pn as bZ,
  so as b_,
  Mn as ba,
  Ti as bb,
  Cc as bc,
  nm as bd,
  Gn as be,
  ji as bf,
  nu as bg,
  lo as bh,
  Wi as bi,
  co as bj,
  Hc as bk,
  rm as bl,
  ym as bm,
  uo as bn,
  Rc as bo,
  Rm as bp,
  Dc as bq,
  Yd as br,
  nf as bs,
  gm as bt,
  Rl as bu,
  Wa as bv,
  xm as bw,
  Gt as bx,
  km as by,
  ja as bz,
  T as c,
  ct as c0,
  mi as c1,
  En as c2,
  Kd as c3,
  cm as c4,
  Sm as c5,
  Sl as c6,
  Bd as c7,
  ni as c8,
  Mf as c9,
  _t as cA,
  Oa as cB,
  im as cC,
  Vi as cD,
  Bi as cE,
  it as cF,
  _m as cG,
  um as cH,
  Jd as cI,
  dn as cJ,
  Ge as cK,
  $m as cL,
  dm as cM,
  Lf as cN,
  Nm as cO,
  fm as cP,
  Nt as cQ,
  fn as cR,
  Ui as cS,
  es as cT,
  hn as cU,
  tr as cV,
  Bt as cW,
  Nd as cX,
  Qi as cY,
  Cm as ca,
  id as cb,
  nd as cc,
  ss as cd,
  ra as ce,
  Fd as cf,
  aa as cg,
  fu as ch,
  Sf as ci,
  Qf as cj,
  Ld as ck,
  ki as cl,
  Ii as cm,
  xa as cn,
  Yu as co,
  Rd as cp,
  Um as cq,
  Ef as cr,
  Bf as cs,
  Em as ct,
  Ro as cu,
  Tf as cv,
  Hf as cw,
  wn as cx,
  Rf as cy,
  bn as cz,
  Xl as d,
  Mt as e,
  no as f,
  Kl as g,
  xr as h,
  y as i,
  Gl as j,
  Zl as k,
  eo as l,
  ro as m,
  Yl as n,
  gu as o,
  to as p,
  io as q,
  Pi as r,
  F as s,
  Zd as t,
  hs as u,
  me as v,
  wc as w,
  Ec as x,
  ke as y,
  pm as z
};
