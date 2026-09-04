var hs = Object.defineProperty;
var Ar = (e) => {
  throw TypeError(e);
};
var ps = (e, t, n) => t in e ? hs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var we = (e, t, n) => ps(e, typeof t != "symbol" ? t + "" : t, n), kn = (e, t, n) => t.has(e) || Ar("Cannot " + n);
var S = (e, t, n) => (kn(e, t, "read from private field"), n ? n.call(e) : t.get(e)), ne = (e, t, n) => t.has(e) ? Ar("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), se = (e, t, n, i) => (kn(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), ie = (e, t, n) => (kn(e, t, "access private method"), n);
function R(e) {
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
function w(e) {
  const t = new TextEncoder().encode(R(e));
  let n = 3421674724, i = 2216829733;
  for (const r of t) {
    i = (i ^ r) >>> 0;
    const a = i * 435;
    n = Math.imul(n, 435) + Math.floor(a / 4294967296) + (i << 8) >>> 0, i = a >>> 0;
  }
  return `fnv1a64:${n.toString(16).padStart(8, "0")}${i.toString(16).padStart(8, "0")}`;
}
function y(e) {
  return ya(JSON.parse(R(e)));
}
function ya(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) ya(t);
    Object.freeze(e);
  }
  return e;
}
const Er = 5;
function yn(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function Ei(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const t = Number.parseInt(e, 10), n = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(t) && Number.isSafeInteger(t * n);
}
function k(e) {
  if (!Ei(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return yn(e);
}
function qe(e, t) {
  return e.knownAt ?? e.bucket + k(t);
}
function hn(e, t, n) {
  const i = k(t), r = /* @__PURE__ */ new Map(), a = e.filter((o) => {
    if (!Number.isFinite(o.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (o.bucket + i > n) return !1;
    if (o.knownAt != null && !Number.isFinite(o.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${o.bucket}`);
    return qe(o, t) <= n;
  });
  for (const o of [...a].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!Is(o) || o.bucket % i !== 0 || Math.floor(o.ts / i) * i !== o.bucket)
      throw new RangeError(`Invalid candle for bucket ${o.bucket}`);
    const s = qe(o, t);
    if (s < o.bucket + i)
      throw new RangeError(`Candle revision predates close for bucket ${o.bucket}`);
    const c = r.get(o.bucket);
    if (c) {
      const l = qe(c, t);
      if (l === s && Tr(c, t) !== Tr(o, t))
        throw new Error(`Conflicting candle revisions for bucket ${o.bucket} at ${s}`);
      if (l > s) continue;
    }
    r.set(o.bucket, o);
  }
  return [...r.values()].sort((o, s) => o.bucket - s.bucket);
}
function am(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ot(e, t) {
  return Math.floor(e / t) * t;
}
function ha(e) {
  const t = Ea(e);
  if (!t || typeof t != "object") return null;
  const n = t, i = wr(n.ts), r = pe(n.o), a = pe(n.h), o = pe(n.l), s = pe(n.c), c = n.knownAt == null ? void 0 : wr(n.knownAt);
  return i == null || r == null || a == null || o == null || s == null || n.knownAt != null && c == null ? null : {
    ts: i,
    o: r,
    h: a,
    l: o,
    c: s,
    v_base: pe(n.v_base),
    v_quote: pe(n.v_quote),
    ver: pe(n.ver),
    knownAt: c ?? void 0
  };
}
function pa(e, t, n) {
  const i = yn(t), r = bs(
    e.map((s, c) => ga(s, c)).filter((s) => s != null),
    i
  ).slice(-Math.max(1, n));
  if (!r.length)
    return {
      timeframeSec: i,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const a = ot(r[0].ts, i), o = r.map((s) => {
    const c = ot(s.ts, i);
    return {
      ...s,
      bucket: c,
      x: (c - a) / i
    };
  });
  return bi({
    timeframeSec: i,
    firstBucket: a,
    candles: o,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function om(e, t, n) {
  const i = e.candles.length, r = t.map((o, s) => ga(o, s)).filter((o) => o != null).filter((o) => ot(o.ts, e.timeframeSec) < e.firstBucket).sort(Aa);
  if (!r.length) return 0;
  const a = pa(
    [...r, ...e.candles],
    n,
    r.length + e.candles.length
  );
  return e.timeframeSec = a.timeframeSec, e.firstBucket = a.firstBucket, e.candles = a.candles, e.positionByBucket = a.positionByBucket, Math.max(0, e.candles.length - i);
}
function gs(e) {
  const t = new Float32Array(e.length * Er);
  return e.forEach((n, i) => {
    t.set([n.x, n.o, n.h, n.l, n.c], i * Er);
  }), new Uint8Array(t.buffer);
}
function br(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function sm(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function As(e, t, n, i = 3) {
  const r = ha(t);
  if (!r) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const a = ot(r.ts, e.timeframeSec);
  if (a < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const o = e.positionByBucket.get(a), s = (a - e.firstBucket) / e.timeframeSec, c = { ...r, bucket: a, x: s };
  if (o != null)
    return Cs(c, e.candles[o]) ? { kind: "ignore", reason: "stale-version" } : Rs(e.candles[o], c) ? (e.candles[o] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[o] = c, {
      kind: "replace",
      position: o,
      bytes: br(c)
    });
  const l = e.candles[e.candles.length - 1];
  return a <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (a - l.bucket) / e.timeframeSec > i ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Es(e), { kind: "reset", bytes: gs(e.candles) }) : (bi(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: br(c)
  }));
}
function cm(e, t = []) {
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
function lm(e, t, n) {
  const i = yn(n), r = Math.floor(Date.now() / 1e3), a = ot(r, i), o = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), s = [];
  let c = 40 + o % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = a - l * i, f = Math.sin((t - l + o) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((t - l) / 13) * 0.35), v = Math.max(d, m) + 0.35 + Math.abs(Math.sin(l + o)) * 0.5, p = Math.min(d, m) - 0.35 - Math.abs(Math.cos(l + o)) * 0.5, h = 50 + o % 90 + Math.abs(Math.sin((t - l + o) / 5)) * 180;
    s.push({ ts: u, o: d, h: v, l: p, c: m, v_base: h, v_quote: h * m }), c = m;
  }
  return pa(s, n, t);
}
function um(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const i = n.bucket + e.timeframeSec, r = Math.sin(i / 600) * 0.7, a = n.c, o = Math.max(1e-4, a + r), s = Math.max(a, o) + 0.5, c = Math.min(a, o) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(r) * 0.36));
  return As(e, { ts: i, o: a, h: s, l: c, c: o, v_base: l, v_quote: l * o }, t);
}
function Es(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  bi(e);
}
function bi(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function ga(e, t) {
  const n = ha(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function bs(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = ot(i.ts, t), a = n.get(r);
    (!a || Aa(i, a) > 0) && n.set(r, i);
  }
  return Array.from(n.entries()).sort(([i], [r]) => i - r).map(([, i]) => ws(i));
}
function Aa(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, i = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== i ? n - i : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function ws(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function wr(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? Ts(e) : Ss(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function Ts(e) {
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
function Ss(e) {
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
function Rs(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function Cs(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function pe(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function Is(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && Wt(e.o) && Wt(e.h) && Wt(e.l) && Wt(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && Gt(e.v_base) && Gt(e.v_quote) && Gt(e.ver) && Gt(e.knownAt);
}
function Tr(e, t) {
  return R({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: pe(e.v_base) ?? null,
    vQuote: pe(e.v_quote) ?? null,
    ver: pe(e.ver) ?? null,
    knownAt: qe(e, t)
  });
}
function Wt(e) {
  return Number.isFinite(e) && e > 0;
}
function Gt(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Ea(e) {
  if (typeof e == "string")
    try {
      return Ea(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
const Ne = "impulse_fade_v1", ye = "impulse_fade_v1.lifecycle.1", Ps = "impulse_fade_v1.lifecycle-config.1", At = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function fm(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let i = 0;
  return e.forEach((r, a) => {
    i += r.c, a >= t && (i -= e[a - t].c), a >= t - 1 && n.push(r.x, i / t);
  }), new Float32Array(n);
}
function xs(e, t = 20) {
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
function dm(e, t = 20) {
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
function mm(e, t = 20, n = 2) {
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
function vm(e, t = 14) {
  return ze(Ma(e, t));
}
function Os(e, t = 14, n = 14, i = 3, r = 3) {
  const a = Ma(e, t), o = Qe(n);
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
  const c = xr(s, Qe(i)), l = xr(c, Qe(r));
  return {
    k: ze(c),
    d: ze(l)
  };
}
function ym(e, t = 12, n = 26, i = 9) {
  const r = Kn(e, t), a = Kn(e, n), o = [];
  for (let u = 0; u < e.length; u++) {
    const f = r[u], d = a[u];
    f == null || d == null || o.push({ x: e[u].x, value: f - d });
  }
  const s = kc(o, i), c = new Map(o.map((u) => [u.x, u.value])), l = s.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: ze(o),
    signal: ze(s),
    histogram: ze(l)
  };
}
function ks(e, t = 14) {
  const n = An(e, t), i = [];
  return n.forEach((r, a) => {
    r != null && i.push({ x: e[a].x, value: r });
  }), ze(i);
}
function st(e, t = {}) {
  const n = H(t.windowSeconds, 60, 2592e3, 86400), i = H(t.historyDays, 1, 365, 180), r = H(t.minSamples, 1, 5e3, 20), a = H(t.emaPeriod, 2, 500, 20), o = H(t.atrPeriod, 2, 500, 14), s = Na(e);
  if (!s)
    return dc(n);
  const c = e.indexOf(s), l = _a(e, s.bucket - n, c), u = l && J(l.c) ? (s.c / l.c - 1) * 100 : null, f = u == null ? [] : mc(e, {
    windowSeconds: n,
    earliestBucket: s.bucket - i * 86400,
    excludeBucket: s.bucket
  }), d = u != null && f.length >= r ? vc(f, u) : null, m = u != null && f.length >= r ? yc(f, u) : null, v = Kn(e, a)[c] ?? null, p = An(e, o)[c] ?? null, h = v != null && p != null && Number.isFinite(v) && Number.isFinite(p) && p > 0 ? (s.c - v) / p : null;
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
function Ns(e = {}) {
  var B, W, _;
  const t = e.executionTimeframe ?? "chart", n = O(e.asOf), i = O(e.latestTs) ?? Js(e.candles ?? [], t) ?? O((B = e.structure) == null ? void 0 : B.updatedTs) ?? O((W = e.marketStructure) == null ? void 0 : W.summary.updatedTs) ?? null, r = n ?? i, a = r == null ? null : Ii(e.candles ?? [], r, t), o = (a == null ? void 0 : a.candle.c) ?? O(e.latestPrice), s = _s(e.marketStructure ?? null, n), c = (s == null ? void 0 : s.summary) ?? Ms(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : Ti(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (V) => n == null || D(V) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (V) => n == null || D(V) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (V) => n == null || D(V) <= n
  ), v = X(e.resistanceNearPct, 0, 10, 1.5), p = X(e.retestNearPct, 0, 10, 0.8), h = ic(e.extension ?? null), A = rc(f, o, v), E = ac(d), T = oc(c), M = sc(
    m,
    e.avwapDistancePct
  ), I = cc(c, f, o, p), b = lc(h, A, c, o), g = [
    h,
    A,
    E,
    T,
    M,
    I
  ], C = {
    checks: g,
    asOf: r,
    updatedTs: i,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ut({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, x = zs({
    extension: h,
    htfResistance: A,
    htfStructures: u,
    rsWeakness: E,
    structureShift: T,
    avwapFailure: M,
    retest: I,
    invalidated: b
  });
  return (_ = e.candles) != null && _.length && r != null ? Hs({
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
  }) : Ia({
    ...C,
    state: x,
    reason: fc(x, g),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function _s(e, t) {
  var a;
  if (!e || t == null) return e;
  const n = e.swings.filter((o) => o.knownAt <= t), i = e.breaks.filter((o) => o.knownAt <= t), r = ((a = Me(i)) == null ? void 0 : a.direction) ?? "neutral";
  return {
    swings: n,
    breaks: i,
    trend: r,
    summary: xi(n, i, r)
  };
}
function Ms(e, t) {
  if (!e || t == null) return e ?? null;
  const n = O(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function hm(e) {
  return Fs(e).records;
}
function ut(e = {}) {
  var t, n, i, r, a, o, s, c, l, u, f;
  return w({
    lifecycleVersion: ye,
    lifecycleConfigVersion: Ps,
    candidateGate: At,
    extension: {
      windowSeconds: H(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: H((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: H((i = e.extensionOptions) == null ? void 0 : i.minSamples, 1, 5e3, 20),
      emaPeriod: H((r = e.extensionOptions) == null ? void 0 : r.emaPeriod, 2, 500, 20),
      atrPeriod: H((a = e.extensionOptions) == null ? void 0 : a.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: H(
        (o = e.marketStructureOptions) == null ? void 0 : o.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: H(
        (s = e.marketStructureOptions) == null ? void 0 : s.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: H((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: X((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: H((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: H((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: X(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: X(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: X(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: X(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: X(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: H(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function ba(e) {
  var c;
  const t = Sa(e), n = Me(t);
  if (n == null) return null;
  const i = O(e.from) ?? -1 / 0, r = Ta(e, n), a = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], s = new Set(
    o.map((l) => Be(l, e.executionTimeframe)).filter((l) => l >= i && l <= n)
  );
  for (const l of e.structureEvents ?? [])
    (!l.sourceTimeframe || l.sourceTimeframe === e.executionTimeframe) && D(l) >= i && D(l) <= n && s.add(D(l));
  for (const l of [...s].sort((u, f) => u - f))
    wi(
      pn(o, e.executionTimeframe, l),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (c = e.config) == null ? void 0 : c.marketStructureOptions,
      l,
      a
    );
  return wa(
    e,
    n,
    a,
    r
  );
}
function Fs(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], i = e.config ?? {}, r = ut(i), a = Sa(e), o = Ta(
    e,
    Me(a) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = O(e.from) ?? -1 / 0;
  let f = null;
  return { records: a.map((m) => {
    var T, M, I, b, g;
    const v = wa(
      e,
      m,
      s,
      o
    ), p = Ra(e.candidateMetrics, m), h = (p == null ? void 0 : p.metrics) ?? Ci(
      st(
        pn(n, t, m),
        i.extensionOptions
      )
    );
    f = v;
    const A = v.evidence.filter((C) => c.has(C.id) ? !1 : (c.add(C.id), C.knownAt >= u)), E = v.transitions.filter((C) => {
      const x = Ls(C);
      return l.has(x) ? !1 : (l.add(x), C.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: Ne,
      lifecycleVersion: ye,
      lifecycleConfigHash: r,
      candidateGatePassed: It(h),
      candidateId: ((T = v.candidate) == null ? void 0 : T.id) ?? null,
      candidateDetectedAt: ((M = v.candidate) == null ? void 0 : M.detectedAt) ?? null,
      initialMtfContext: ((I = v.candidate) == null ? void 0 : I.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: Me(E) ?? null,
      transitions: E,
      evidenceAdded: A,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((b = v.candidate) == null ? void 0 : b.episodeHigh) ?? null,
      episodeHighTime: ((g = v.candidate) == null ? void 0 : g.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: f };
}
function wa(e, t, n, i) {
  const r = e.executionTimeframe, a = e.candlesByTimeframe[r] ?? [], o = e.config ?? {}, s = ut(o), c = pn(a, r, t), l = st(c, o.extensionOptions), u = Ra(e.candidateMetrics, t), f = (u == null ? void 0 : u.metrics) ?? Ci(l), d = wi(
    c,
    r,
    e.structureEvents ?? [],
    o.marketStructureOptions,
    t,
    n
  ), m = i.filter(
    (p) => (p.summary.updatedTs ?? 0) <= t
  ), v = Me(c) ?? null;
  return Ns({
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
function Ta(e, t) {
  const n = O(e.from) ?? -1 / 0;
  return Object.entries(e.candlesByTimeframe).filter(([i]) => i !== e.executionTimeframe).flatMap(([i, r]) => {
    const a = new Set(
      r.map((o) => Be(o, i)).filter((o) => o >= n && o <= t)
    );
    Number.isFinite(n) && n <= t && a.add(n);
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === i && D(o) >= n && D(o) <= t && a.add(D(o));
    return [...a].sort((o, s) => o - s).map((o) => {
      var c;
      const s = wi(
        pn(r, i, o),
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
const pm = "openTime";
function Be(e, t) {
  return (O(e.bucket) ?? O(e.ts) ?? 0) + Math.max(1, yn(t));
}
function pn(e, t, n) {
  return hn(e, t, n);
}
function Sa(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [a, o] of Object.entries(e.candlesByTimeframe))
    for (const s of o)
      t.add(s.knownAt ?? Be(s, a));
  for (const a of e.candidateMetrics ?? [])
    t.add(O(a.knownAt) ?? a.asOf);
  for (const a of e.structureEvents ?? []) t.add(D(a));
  for (const a of e.avwapEvents ?? []) t.add(D(a));
  for (const a of e.relativeStrengthEvents ?? []) t.add(D(a));
  for (const a of e.supportResistanceZones ?? []) t.add(D(a));
  for (const a of e.evaluationPoints ?? []) {
    const o = O(a);
    o != null && t.add(o);
  }
  const n = [...t].filter(Number.isFinite).sort((a, o) => a - o), i = O(e.from) ?? n[0] ?? 0, r = O(e.to) ?? Me(n) ?? i;
  return t.add(i), t.add(r), [...t].filter((a) => Number.isFinite(a) && a >= i && a <= r).sort((a, o) => a - o);
}
function Ra(e, t) {
  return Me([...e ?? []].filter((n) => (O(n.knownAt) ?? n.asOf) <= t).sort(
    (n, i) => (O(n.knownAt) ?? n.asOf) - (O(i.knownAt) ?? i.asOf) || n.asOf - i.asOf
  )) ?? null;
}
function wi(e, t, n, i, r, a) {
  var f;
  const o = _e(e, i), s = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && D(d) <= r
  ), c = a ?? /* @__PURE__ */ new Map();
  for (const d of [...o.breaks, ...s])
    c.set(
      Oe(
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
  const u = ((f = Me(l)) == null ? void 0 : f.direction) ?? o.trend;
  return {
    swings: o.swings,
    breaks: l,
    trend: u,
    summary: xi(o.swings, l, u)
  };
}
function Ls(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function Hs(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, i = Ds(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), r = Ks(i, n);
  let a = Bs(i, e);
  if (!a && It(e.extension ?? null)) {
    const o = Ii(t, e.asOf, e.executionTimeframe);
    o && (a = {
      index: o.index,
      candle: o.candle,
      eventTime: he(o.candle),
      knownAt: Math.min(
        e.asOf,
        Pe(t, o.index, e.executionTimeframe)
      ),
      metrics: Ri(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, r.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return a ? Ca(a, e, e.asOf, r) : Ia({
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
function Ds(e, t, n, i, r) {
  if (r != null && r.length)
    return [...r].map((o) => {
      const s = O(o.knownAt) ?? o.asOf, c = Ii(e, s, i);
      if (!c || s > n) return null;
      const l = O(o.eventTime) ?? he(c.candle), u = Ri(o.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: s,
        metrics: u,
        pass: It(u),
        rollingReturnCount: Math.max(0, Math.trunc(o.sampleCount ?? 0))
      };
    }).filter((o) => o != null).sort((o, s) => o.knownAt - s.knownAt || o.eventTime - s.eventTime);
  const a = [];
  for (let o = 0; o < e.length; o += 1) {
    const s = e[o], c = Pe(e, o, i);
    if (c > n) continue;
    const l = st(e.slice(0, o + 1), t), u = Ci(l);
    a.push({
      index: o,
      candle: s,
      eventTime: he(s),
      knownAt: c,
      metrics: u,
      pass: It(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return a;
}
function Bs(e, t) {
  var a;
  const n = [];
  let i = !1;
  for (const o of e)
    o.pass && !i && n.push(o), i = o.pass;
  if (!n.length) return null;
  let r = n[0];
  for (const o of n.slice(1)) {
    const c = ((a = Ca(r, t, o.knownAt, []).candidate) == null ? void 0 : a.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < o.knownAt && !l.pass) && (r = o);
  }
  return r;
}
function Ca(e, t, n, i) {
  const r = (t.symbol ?? "UNKNOWN").toUpperCase(), a = t.source ?? "chart", o = t.venue ?? "", s = t.executionTimeframe, c = Ti(
    t.htfStructures ?? [],
    e.knownAt
  ).map((g) => ({
    timeframe: g.timeframe,
    state: g.summary.state,
    trend: g.summary.trend,
    transitionDirection: g.summary.transitionDirection,
    updatedTs: g.summary.updatedTs
  })), l = Zs({
    setupFamily: Ne,
    symbol: r,
    source: a,
    venue: o,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), u = [
    {
      id: Oe("candidate_detected", s, e.eventTime, e.knownAt),
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
  ], d = Us(t, e, n), m = Vs(e, t, n);
  let v = "developing", p = e.knownAt, h = null, A = null, E = null, T = null, M = null;
  for (const g of m) {
    if (h != null) break;
    if (!(g.knownAt < e.knownAt || g.knownAt > n)) {
      if (g.lifecycleKind === "deterioration") {
        u.push({ ...g, contributesTo: "deteriorating" }), v === "developing" && (f.push(yt(v, "deteriorating", g)), v = "deteriorating", p = g.knownAt);
        continue;
      }
      if (g.lifecycleKind === "bearishBreak") {
        u.push({ ...g, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (f.push(yt(v, "waitingForRetest", g)), v = "waitingForRetest", p = g.knownAt, A = g.breakLevel ?? null);
        continue;
      }
      if (g.lifecycleKind === "retest") {
        v === "waitingForRetest" && A && g.relatedEventId === A.evidenceId && g.knownAt > A.knownAt && (u.push({ ...g, contributesTo: "entryCandidate" }), f.push(yt(v, "entryCandidate", g)), v = "entryCandidate", p = g.knownAt, E = g.breakLevel ?? A);
        continue;
      }
      if (g.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (u.push({ ...g, contributesTo: "invalidated" }), f.push(yt(v, "invalidated", g)), v = "invalidated", p = g.knownAt, h = g.knownAt, T = g.explanation);
        continue;
      }
      g.lifecycleKind === "expiry" && v !== "entryCandidate" && (u.push({ ...g, contributesTo: "expired" }), f.push(yt(v, "expired", g)), v = "expired", p = g.knownAt, h = g.knownAt, M = g.explanation);
    }
  }
  const I = ka(
    t.candles ?? [],
    e.eventTime,
    n,
    s
  ), b = {
    id: l,
    setupFamily: Ne,
    lifecycleVersion: ye,
    lifecycleConfigHash: t.lifecycleConfigHash ?? ut({
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
    episodeHigh: (I == null ? void 0 : I.price) ?? null,
    episodeHighTime: (I == null ? void 0 : I.eventTime) ?? null,
    currentState: v,
    stateSince: p,
    terminalAt: h
  };
  return {
    strategy: "pumpFade",
    setupFamily: Ne,
    lifecycleVersion: ye,
    lifecycleConfigHash: b.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: p,
    label: gn(v),
    reason: Xs(v, u, f, T, M),
    checks: t.checks,
    updatedTs: n,
    candidate: b,
    evidence: u.sort((g, C) => g.knownAt - C.knownAt || g.eventTime - C.eventTime),
    transitions: f,
    pendingConditions: Oa(v, A),
    activeBreakLevel: A,
    retestLevel: E,
    confluence: d,
    invalidationReason: T,
    expiryReason: M,
    dataQuality: i
  };
}
function Vs(e, t, n) {
  const i = [], r = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = D(l);
    if (!Et(l, e, n)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    i.push({
      id: Oe(f, r, l.eventTime, u, l.x),
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
    l.kind !== "failedReclaim" || !Et(l, e, n) || i.push({
      id: Oe("avwap_failed_reclaim", r, l.eventTime, u, l.x),
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
  const a = qs(t), o = [];
  for (const l of a) {
    const u = D(l);
    if (l.direction !== "bearish" || !Et(l, e, n)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = Oe(f, r, l.eventTime, u, l.x), m = {
      level: l.level,
      sourceTimeframe: r,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: d
    }, v = {
      id: d,
      code: f,
      explanation: `${l.label} down through ${Ae(l.level)}`,
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
    const u = $s(e, l, t, n);
    u && i.push(u);
  }
  for (const l of a) {
    const u = D(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !Et(l, e, n))
      continue;
    const f = (t.candles ?? [])[l.index], d = ka(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      r
    ), m = X(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || i.push({
      id: Oe("bullish_continuation_invalidation", r, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${Ae(d.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const s = H(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + s;
  return c <= n && i.push({
    id: Oe("candidate_expired", r, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${nc(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: r,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), i.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function $s(e, t, n, i) {
  var u;
  const r = n.candles ?? [], a = t.breakLevel;
  if (!a || !Number.isFinite(a.level)) return null;
  const o = X(n.retestToleranceBps, 0, 1e3, 35), s = X(n.retestToleranceAtr, 0, 10, 0.25), c = H((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = An(r, c);
  for (let f = 0; f < r.length; f += 1) {
    const d = r[f], m = Pe(r, f, n.executionTimeframe), v = he(d);
    if (m <= t.knownAt || v < t.knownAt || v < e.knownAt || m > i)
      continue;
    const p = l[f] ?? 0, h = Math.max(
      a.level * (o / 1e4),
      Number.isFinite(p) ? p * s : 0
    );
    if (d.h >= a.level - h && d.l <= a.level + h && d.c < a.level && d.c <= d.o)
      return {
        id: Oe(
          "bearish_retest_rejection",
          a.sourceTimeframe,
          he(d),
          m,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${Ae(a.level)}`,
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
function Us(e, t, n) {
  const i = [], r = Pi(
    e.srZones.filter((s) => D(s) <= n),
    e.latestPrice,
    X(e.resistanceNearPct, 0, 10, 1.5)
  );
  r && i.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${Ae(r.low)}-${Ae(r.high)}`,
    eventTime: r.eventTime,
    knownAt: r.knownAt,
    sourceTimeframe: "MTF",
    level: r.center
  });
  const a = [...e.anchoredVwapSignals ?? []].filter(
    (s) => s.kind === "loss" && Et(s, t, n)
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
  const o = O(e.avwapDistancePct);
  o != null && i.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${Tt(o, 1)}% from AVWAP`,
    value: o,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of Ti(e.htfStructures, n))
    s.summary.state !== "neutral" && i.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: tc(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return i;
}
function Ti(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = O(i.summary.updatedTs);
    if (r != null && r > t) continue;
    const a = n.get(i.timeframe), o = O(a == null ? void 0 : a.summary.updatedTs) ?? -1 / 0;
    (!a || (r ?? -1 / 0) >= o) && n.set(i.timeframe, i);
  }
  return [...n.values()];
}
function qs(e) {
  var i, r, a;
  const t = (r = (i = e.marketStructure) == null ? void 0 : i.breaks) != null && r.length ? e.marketStructure.breaks : (a = e.structure) != null && a.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((o) => {
    const s = `${o.kind}:${o.direction}:${o.x}:${o.level}:${D(o)}`;
    return n.has(s) ? !1 : (n.add(s), !0);
  });
}
function zs(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && Sr(e.htfResistance, e.htfStructures) ? "deteriorating" : Sr(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function Ia(e) {
  return {
    strategy: "pumpFade",
    setupFamily: Ne,
    lifecycleVersion: ye,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ut(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: gn(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: Oa(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function Si(e, t = {}) {
  const n = hc(e, t);
  if (n == null) return new Float32Array();
  const i = [];
  let r = 0, a = 0;
  for (let o = n; o < e.length; o += 1) {
    const s = e[o];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!J(c)) continue;
    const l = pc(s, c);
    l <= 0 || (r += l, a += c * l, i.push(s.x, a / r));
  }
  return new Float32Array(i);
}
function Qs(e, t = {}) {
  const n = O(t.anchorBucket), i = O(t.anchorX), r = Si(e, t);
  if (r.length < 2)
    return {
      anchorBucket: n,
      anchorX: i,
      value: null,
      distancePct: null,
      candle: null
    };
  const a = r[r.length - 1], o = Na(e), s = o && J(a) ? (o.c - a) / a * 100 : null;
  return {
    anchorBucket: n,
    anchorX: i,
    value: a,
    distancePct: s,
    candle: o
  };
}
function js(e, t = {}, n = 20) {
  const i = H(n, 1, 200, 20), r = Si(e, t);
  if (r.length < 4) return [];
  const a = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), o = [];
  let s = null;
  for (let c = 0; c < r.length; c += 2) {
    const l = r[c], u = r[c + 1], f = a.get(l);
    if (!f || !J(u) || !J(f.candle.c)) continue;
    const d = Pe(e, f.index), m = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    m && (s === "above" && m === "below" ? o.push(Nn("loss", f.index, f.candle, u, d)) : s === "below" && m === "above" ? o.push(Nn("reclaim", f.index, f.candle, u, d)) : s === "below" && m === "below" && f.candle.h >= u && f.candle.c < u && o.push(
      Nn("failedReclaim", f.index, f.candle, u, d)
    ), s = m);
  }
  return o.slice(-i);
}
function Ws(e, t = {}) {
  const n = H(t.lookback, 20, 2e3, 500), i = H(t.pivotStrength, 1, 20, 3), r = H(t.atrPeriod, 2, 100, 14), a = X(t.minMoveAtr, 0, 10, 0.75), o = H(t.maxSwings, 1, 500, 120), s = Math.max(0, e.length - n), c = e.slice(s);
  if (c.length < i * 2 + 1) return [];
  const l = An(e, r), u = [];
  for (let d = i; d < c.length - i; d += 1) {
    const m = c[d], v = s + d, p = l[v] ?? null, h = Pe(e, v + i);
    Ic(c, d, i) && u.push(Rr("SwingHigh", v, m, m.h, p, h)), Pc(c, d, i) && u.push(Rr("SwingLow", v, m, m.l, p, h));
  }
  const f = [];
  for (const d of u) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      Tc(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= Sc(d, m, a) && f.push(d);
  }
  return gc(f).slice(-o);
}
function _e(e, t = {}) {
  const n = H(t.maxSwings, 1, 500, 120), i = H(t.maxBreaks, 1, 200, 24), r = Ws(e, {
    ...t,
    maxSwings: Math.max(n, i * 4)
  }), a = [], o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, f = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const p = Pe(e, v);
    for (; c < r.length && r[c].index < v && r[c].knownAt <= p; ) {
      const A = r[c];
      A.kind === "SwingHigh" ? l = A : u = A, c += 1;
    }
    const h = e[v];
    if (l && !o.has(l.x) && h.c > l.price) {
      const A = f === "bearish" ? "StructureShift" : "StructureBreak";
      a.push(Cr(A, "bullish", v, h, l, p)), o.add(l.x), f = "bullish";
    }
    if (u && !s.has(u.x) && h.c < u.price) {
      const A = f === "bullish" ? "StructureShift" : "StructureBreak";
      a.push(Cr(A, "bearish", v, h, u, p)), s.add(u.x), f = "bearish";
    }
  }
  const d = r.slice(-n), m = a.slice(-i);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: xi(d, m, f)
  };
}
function Gs(e) {
  var r;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Pr(t, "SwingHigh", "rangeHigh", null, !0),
      Pr(t, "SwingLow", "rangeLow", null, !1)
    ].filter((a) => !!a);
  const i = n.state === "transitional" ? n.transitionDirection ?? ((r = n.lastBreak) == null ? void 0 : r.direction) ?? e.trend : n.state;
  return i === "bullish" ? [
    Kt(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    Kt(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((a) => !!a) : i === "bearish" ? [
    Kt(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    Kt(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((a) => !!a) : [];
}
function gm(e, t = {}) {
  var c, l;
  const n = H(t.lookback, 20, 1e3, 240), i = H(t.pivotStrength, 1, 20, 3), r = H(t.maxZones, 1, 12, 6), a = X(t.thicknessBps, 1, 100, 10), o = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = _e(e, {
    lookback: n,
    pivotStrength: i,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return Pa(s.swings, {
    maxZones: r,
    thicknessBps: a,
    latestX: o,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function Pa(e, t = {}) {
  var l;
  const n = H(t.maxZones, 1, 12, 6), i = X(t.thicknessBps, 1, 100, 10), r = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, a = O(t.referencePrice), o = t.zonesPerSide == null ? null : H(t.zonesPerSide, 1, 12, 3), s = [];
  for (const u of e)
    Rc(
      s,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      r - u.x + 1,
      i
    );
  const c = s.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return Cc(c, n, a, o);
}
function xa(e, t) {
  const n = new Map(
    t.filter((o) => J(o.c)).map((o) => [o.bucket, o])
  );
  let i = null, r = null;
  const a = [];
  for (const o of e) {
    if (!J(o.c)) continue;
    const s = n.get(o.bucket);
    if (!s || !J(s.c)) continue;
    (i == null || r == null) && (i = o.c, r = s.c);
    const c = o.c / i / (s.c / r);
    a.push(o.x, (c - 1) * 100);
  }
  return new Float32Array(a);
}
function Ys(e, t, n = {}) {
  var I;
  const i = H(n.maxDivergences, 1, 100, 16), r = X(n.minDeltaPct, 0, 50, 0.5), a = H(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), o = n.includeDivergences ?? !0, s = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = xa(e, t), u = Oc(l);
  if (!e.length || u.size < 2) return [];
  const d = (((I = e[e.length - 1]) == null ? void 0 : I.x) ?? 0) - a, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, i * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, i * 2)
  }, v = _e(e, {
    ...m
  }), p = Ec(e, l), h = _e(p, {
    ...m
  }), A = new Map(e.map((b, g) => [b.x, { candle: b, index: g }])), E = [];
  let T = null, M = null;
  for (const b of v.swings) {
    const g = u.get(b.x);
    if (!(g == null || !Number.isFinite(g))) {
      if (b.kind === "SwingHigh") {
        if (T) {
          const C = u.get(T.x);
          C != null && Number.isFinite(C) && (b.price > T.price && g <= C - r ? o && E.push(
            Yt(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              b,
              T,
              g,
              C,
              v.summary.state,
              h.summary.state
            )
          ) : b.price < T.price && g >= C + r && s && E.push(
            Yt(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              b,
              T,
              g,
              C,
              v.summary.state,
              h.summary.state
            )
          ));
        }
        T = b;
        continue;
      }
      if (M) {
        const C = u.get(M.x);
        C != null && Number.isFinite(C) && (b.price > M.price && g <= C - r ? s && E.push(
          Yt(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            b,
            M,
            g,
            C,
            v.summary.state,
            h.summary.state
          )
        ) : b.price < M.price && g >= C + r && o && E.push(
          Yt(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            b,
            M,
            g,
            C,
            v.summary.state,
            h.summary.state
          )
        ));
      }
      M = b;
    }
  }
  if (c)
    for (const b of h.breaks) {
      if (b.x < d) continue;
      const g = A.get(b.x), C = u.get(b.x);
      if (!g || C == null || !Number.isFinite(C)) continue;
      const x = _e(e.slice(0, g.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      bc(b.direction, x.summary.state) && E.push(
        Ac(
          b.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          b.direction,
          b.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          g.index,
          g.candle,
          C,
          b,
          x.summary.state,
          h.summary.state
        )
      );
    }
  return E.filter((b) => b.x >= d).sort((b, g) => b.x - g.x || Ir(b.signal) - Ir(g.signal)).slice(-i);
}
function Am(e) {
  return new Uint8Array(e.buffer);
}
function Ri(e) {
  return {
    returnPct: O(e == null ? void 0 : e.returnPct),
    percentile: O(e == null ? void 0 : e.percentile),
    zScore: O(e == null ? void 0 : e.zScore),
    atrExtension: O(e == null ? void 0 : e.atrExtension)
  };
}
function Ci(e) {
  return {
    returnPct: O(e.returnPct),
    percentile: O(e.percentile),
    zScore: O(e.zScore),
    atrExtension: O(e.atrExtension)
  };
}
function It(e) {
  const t = Ri(e);
  return t.returnPct != null && t.returnPct >= At.returnPct || t.percentile != null && t.percentile >= At.percentile || t.zScore != null && t.zScore >= At.zScore || t.atrExtension != null && t.atrExtension >= At.atrExtension;
}
function Ks(e, t) {
  const n = [], i = H(t.minSamples, 1, 1e4, 20), r = e[e.length - 1] ?? null;
  return r ? r.rollingReturnCount < i && n.push(
    `Rolling-return history has ${r.rollingReturnCount}/${i} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function yt(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function Xs(e, t, n, i, r) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return i ?? "Continuation invalidated the fade setup";
  if (e === "expired") return r ?? "Candidate expired before progressing";
  const a = n[n.length - 1];
  if (a && a.to === e) return a.explanation;
  const o = t.filter((c) => c.contributesTo === e), s = o[o.length - 1];
  return (s == null ? void 0 : s.explanation) ?? gn(e);
}
function Oa(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${Ae(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function Zs(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Oe(e, t, n, i, r) {
  return [e, t, n, i, r ?? ""].map((a) => String(a).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function ka(e, t, n, i) {
  let r = null;
  for (let a = 0; a < e.length; a += 1) {
    const o = e[a], s = he(o);
    s < t || Pe(e, a, i) > n || Number.isFinite(o.h) && (!r || o.h > r.price) && (r = { price: o.h, eventTime: s });
  }
  return r;
}
function Js(e, t) {
  return e.length ? Pe(e, e.length - 1, t) : null;
}
function Ii(e, t, n) {
  for (let i = e.length - 1; i >= 0; i -= 1)
    if (Pe(e, i, n) <= t)
      return { candle: e[i], index: i };
  return null;
}
function he(e) {
  const t = O(e.ts);
  return t ?? O(e.bucket) ?? 0;
}
function Pe(e, t, n) {
  const i = e[t];
  return i ? i.knownAt != null && Number.isFinite(i.knownAt) ? i.knownAt : n != null && String(n).trim() !== "chart" ? Be(i, n) : (O(i.bucket) ?? he(i)) + ec(e, t) : 0;
}
function ec(e, t) {
  var a, o, s;
  const n = O((a = e[t]) == null ? void 0 : a.bucket) ?? he(e[t]), i = O((o = e[t + 1]) == null ? void 0 : o.bucket);
  if (i != null && i > n) return i - n;
  const r = O((s = e[t - 1]) == null ? void 0 : s.bucket);
  return r != null && n > r ? n - r : 1;
}
function D(e) {
  return O(e.knownAt) ?? O(e.eventTime) ?? O(e.ts) ?? O(e.bucket) ?? 0;
}
function Et(e, t, n) {
  const i = D(e), r = O(e.eventTime) ?? O(e.ts) ?? O(e.bucket) ?? i;
  return i > t.knownAt && i <= n && r >= t.knownAt;
}
function tc(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function nc(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function J(e) {
  return Number.isFinite(e) && e > 0;
}
function ic(e) {
  const t = O(e == null ? void 0 : e.returnPct), n = O(e == null ? void 0 : e.percentile), i = O(e == null ? void 0 : e.zScore), r = O(e == null ? void 0 : e.atrExtension), a = [
    t == null ? null : `24h ${Tt(t, 1)}%`,
    r == null ? null : `Ext ${Tt(r, 1)} ATR`,
    i == null ? null : `Z ${Tt(i, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: It({ returnPct: t, percentile: n, zScore: i, atrExtension: r }) ? "pass" : "pending",
    detail: a.join(" | ") || "No extension context yet"
  };
}
function rc(e, t, n) {
  const i = Pi(e, t, n);
  return i ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${Ae(i.low)}-${Ae(i.high)} strength ${i.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function ac(e) {
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
function oc(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function sc(e, t) {
  const n = [...e].reverse().find((a) => a.kind === "loss" || a.kind === "failedReclaim"), i = O(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || i != null && i <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (i == null ? "No AVWAP failure" : `AVWAP ${Tt(i, 1)}%`)
  };
}
function cc(e, t, n, i) {
  var c;
  const r = O((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), a = r != null && n != null && uc(n, r) <= i, o = Pi(t, n, i);
  return {
    key: "retest",
    label: "Retest",
    status: !!(a || o) ? "pass" : "pending",
    detail: a ? `Retesting ${Ae(r)}` : o ? `Near R ${Ae(o.center)}` : "No retest yet"
  };
}
function lc(e, t, n, i) {
  var a;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || i == null) return !1;
  const r = O((a = n.lastSwingHigh) == null ? void 0 : a.price);
  return r != null && i > r * 1.01;
}
function Sr(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Pi(e, t, n) {
  return t == null || !J(t) ? null : e.filter((i) => i.kind === "resistance").map((i) => ({
    zone: i,
    distance: t >= i.low && t <= i.high ? 0 : t < i.low ? (i.low - t) / t * 100 : (t - i.high) / t * 100
  })).filter((i) => i.distance <= n).sort((i, r) => i.distance - r.distance || r.zone.strength - i.zone.strength).map((i) => i.zone)[0] ?? null;
}
function uc(e, t) {
  return !J(e) || !J(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function gn(e) {
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
function fc(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((i) => i.status === "pass").map((i) => i.label);
  return n.length ? n.join(" + ") : gn(e);
}
function Tt(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function Ae(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function O(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function Me(e) {
  return e[e.length - 1];
}
function Na(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (J(n.c)) return n;
  }
  return null;
}
function dc(e) {
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
function _a(e, t, n) {
  const i = Math.min(e.length - 1, Math.max(0, n - 1));
  let r = 0, a = i, o = -1;
  for (; r <= a; ) {
    const s = Math.floor((r + a) / 2);
    e[s].bucket <= t ? (o = s, r = s + 1) : a = s - 1;
  }
  for (; o >= 0 && !J(e[o].c); ) o -= 1;
  return o >= 0 ? e[o] : null;
}
function mc(e, t) {
  const n = [];
  for (let i = 1; i < e.length; i += 1) {
    const r = e[i];
    if (r.bucket < t.earliestBucket || r.bucket >= t.excludeBucket || !J(r.c)) continue;
    const a = _a(e, r.bucket - t.windowSeconds, i);
    !a || !J(a.c) || n.push((r.c / a.c - 1) * 100);
  }
  return n;
}
function vc(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const i = n.filter((a) => a < t).length, r = n.filter((a) => a === t).length;
  return (i + r * 0.5) / n.length * 100;
}
function yc(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const i = n.reduce((o, s) => o + s, 0) / n.length, r = n.reduce((o, s) => o + (s - i) ** 2, 0) / (n.length - 1), a = Math.sqrt(r);
  return a > 0 ? (t - i) / a : null;
}
function Nn(e, t, n, i, r) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: i,
    eventTime: he(n),
    knownAt: r
  };
}
function hc(e, t) {
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
function pc(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const i = Number(e.v_quote);
  return Number.isFinite(i) && i > 0 && t > 0 ? i / t : 0;
}
function Rr(e, t, n, i, r, a) {
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
    eventTime: he(n),
    knownAt: a
  };
}
function gc(e) {
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
function Cr(e, t, n, i, r, a) {
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
    eventTime: he(i),
    knownAt: a
  };
}
function Yt(e, t, n, i, r, a, o, s, c, l) {
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
function Ac(e, t, n, i, r, a, o, s, c) {
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
function Ec(e, t) {
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
function bc(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Ir(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function xi(e, t, n) {
  const i = t[t.length - 1] ?? null, r = Yn(e, "SwingHigh"), a = Yn(e, "SwingLow"), o = e[e.length - 1] ?? null, s = wc(t), c = e.length === 0 ? "neutral" : i == null || s ? "range" : i.kind === "StructureShift" ? "transitional" : i.direction, l = c === "transitional" ? (i == null ? void 0 : i.direction) ?? null : null;
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
function Kt(e, t, n, i, r) {
  for (let o = e.length - 1; o >= 0; o -= 1) {
    const s = e[o];
    if (s.kind === t && n.includes(s.structure))
      return Gn(i, r, s);
  }
  const a = Yn(e, t);
  return a ? Gn(i, r, a) : null;
}
function Pr(e, t, n, i, r) {
  let a = null;
  for (const o of e)
    o.kind === t && (!a || (r ? o.price > a.price : o.price < a.price)) && (a = o);
  return a ? Gn(n, i, a) : null;
}
function Gn(e, t, n) {
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
function wc(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Yn(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const i = e[n];
    if (i.kind === t) return i;
  }
  return null;
}
function Tc(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Sc(e, t, n) {
  const i = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, i * n);
}
function An(e, t) {
  const n = Qe(t), i = Array(e.length).fill(null);
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
function Rc(e, t, n, i, r) {
  const a = n.price;
  if (!Number.isFinite(a) || a <= 0) return;
  const o = Math.max(a * (r / 1e4), Number.EPSILON), s = a - o, c = a + o, l = 1 / Math.max(1, i), u = e.find(
    (m) => m.kind === t && xc(m.low, m.high, s, c)
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
function Cc(e, t, n, i) {
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
function Ic(e, t, n) {
  const i = e[t].h;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].h >= i || e[t + r].h > i) return !1;
  return !0;
}
function Pc(e, t, n) {
  const i = e[t].l;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].l <= i || e[t + r].l < i) return !1;
  return !0;
}
function xc(e, t, n, i) {
  return e <= i && n <= t;
}
function Oc(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const i = e[n], r = e[n + 1];
    Number.isFinite(i) && Number.isFinite(r) && t.set(i, r);
  }
  return t;
}
function Kn(e, t) {
  const n = Qe(t), i = Array(e.length).fill(null);
  if (e.length < n) return i;
  const r = 2 / (n + 1);
  let a = 0;
  for (let o = 0; o < n; o++) a += e[o].c;
  a /= n, i[n - 1] = a;
  for (let o = n; o < e.length; o++)
    a = (e[o].c - a) * r + a, i[o] = a;
  return i;
}
function kc(e, t) {
  const n = Qe(t);
  if (e.length < n) return [];
  const i = [], r = 2 / (n + 1);
  let a = 0;
  for (let o = 0; o < n; o++) a += e[o].value;
  a /= n, i.push({ x: e[n - 1].x, value: a });
  for (let o = n; o < e.length; o++)
    a = (e[o].value - a) * r + a, i.push({ x: e[o].x, value: a });
  return i;
}
function Ma(e, t) {
  const n = Qe(t);
  if (e.length <= n) return [];
  let i = 0, r = 0;
  for (let o = 1; o <= n; o++) {
    const s = e[o].c - e[o - 1].c;
    s >= 0 ? i += s : r += Math.abs(s);
  }
  i /= n, r /= n;
  const a = [
    { x: e[n].x, value: Or(i, r) }
  ];
  for (let o = n + 1; o < e.length; o++) {
    const s = e[o].c - e[o - 1].c, c = Math.max(0, s), l = Math.max(0, -s);
    i = (i * (n - 1) + c) / n, r = (r * (n - 1) + l) / n, a.push({ x: e[o].x, value: Or(i, r) });
  }
  return a;
}
function xr(e, t) {
  if (e.length < t) return [];
  const n = [];
  let i = 0;
  return e.forEach((r, a) => {
    i += r.value, a >= t && (i -= e[a - t].value), a >= t - 1 && n.push({ x: r.x, value: i / t });
  }), n;
}
function ze(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function Or(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function Qe(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function H(e, t, n, i) {
  return Math.floor(X(e, t, n, i));
}
function X(e, t, n, i) {
  const r = Number(e);
  return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : i;
}
const Nc = "strategy-profile.1", Fa = "decision-snapshot.1", _c = "impulse_fade_v1.research.default", Mc = "1";
function Fc(e) {
  return `decision-reference-observation:${w({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function Ft(e) {
  const { profileHash: t, ...n } = e;
  return w(n);
}
function La(e) {
  if (Pt(e.createdAt, "createdAt"), e.setupFamily !== Ne || e.lifecycleVersion !== ye || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [r, a] of Object.entries(e.timeframeRoles))
    if (r === "contextTimeframes") {
      if (!a.every((o) => o.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (a != null && !a.trim())
      throw new TypeError(`${r} cannot be blank`);
  if (kr(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), kr(
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
    profileHash: Ft(i)
  });
}
function Lc(e = {}) {
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
  return La({
    schemaVersion: Nc,
    id: e.id ?? _c,
    version: e.version ?? Mc,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: Ne,
    lifecycleVersion: ye,
    lifecycleConfigHash: e.lifecycleConfigHash ?? ut(),
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
const Hc = Lc();
function Oi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (Qc(e.price, "reference price"), Pt(e.eventTime, "reference eventTime"), Pt(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = Fc(e.sourceObject);
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
function Dc(e) {
  var a, o, s, c;
  if (Pt(e.decisionTime, "decisionTime"), Pt(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  Vc(e.lifecycle.candidate, e.effectiveAsOf), $c(e.candidateMetrics, e.effectiveAsOf);
  const t = [...e.dataQualityNotes];
  zc([
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
  const n = Bc(
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
    snapshotSchemaVersion: Fa,
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
    lifecycleEvidence: Mn(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: Uc(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: _n(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: _n(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: Mn(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: Mn(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: _n(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, r = ki(i);
  return y({ ...i, id: r });
}
function ki(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${w(n).slice(8)}`;
}
function Ha(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const i of t) {
    const r = n.get(i.id);
    if (r && R(r) !== R(i))
      throw new RangeError(`Conflicting decision reference id ${i.id}`);
    n.set(i.id, i);
  }
  return [...n.values()];
}
function Bc(e, t, n, i) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || i != null && i.venue && e.exchange.toLowerCase() !== i.venue.toLowerCase() ? null : e;
}
function Vc(e, t) {
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
function $c(e, t) {
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
function Uc(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [i]) => n.localeCompare(i)).map(([n, i]) => [
      n,
      qc(i) <= t ? i : null
    ])
  );
}
function _n(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, i) => n.knownAt - i.knownAt || n.id.localeCompare(i.id));
}
function Mn(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, i) => n.knownAt - i.knownAt || n.eventTime - i.eventTime || w(n).localeCompare(w(i))
  );
}
function qc(e) {
  var t, n, i;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((i = e.lastSwingLow) == null ? void 0 : i.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function zc(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const i = t.get(n.id);
    if (i && R(i) !== R(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function Pt(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function Qc(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function kr(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const Da = "radar-selection-profile.1", Ni = "radar-episode.1", Ba = "replay-case-manifest.1", _i = "radar-metric-observation.1", jc = "radar-scan-result.1", Wc = "radar-episode-status.1", Mi = "execution-venue-eligibility.1", Gc = "radar-structure-observation.1", Fi = "radar-universe-membership.1";
function Li(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function Yc(e) {
  return Ga(e), y({
    ...e,
    canonicalConfigHash: Li(e)
  });
}
function Kc(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: Mi,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return y({
    ...t,
    observationId: bn(t)
  });
}
function Em(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !Ei(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: Gc,
    ...e
  };
  return y({
    ...t,
    observationId: Va(t)
  });
}
function bm(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: Fi,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return y({
    ...t,
    observationId: En(t)
  });
}
function En(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${te(n)}`;
}
function Va(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${te(n)}`;
}
function Xn(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(R(e.snapshot));
  return y({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${te({
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
function bn(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${te(n)}`;
}
const wm = Yc({
  schemaVersion: Da,
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
function Tm(e) {
  var c, l;
  Rl(e);
  const t = e.strategyProfile ?? Hc, n = /* @__PURE__ */ new Map(), i = [], r = [], a = [], o = [], s = /* @__PURE__ */ new Set();
  for (const [u, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = ul(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    s.add(m);
    const v = Ee(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ), p = Math.max(
      0,
      e.from - Xc(e.selectionProfile)
    ), h = v.map((T) => Be(T, e.selectionProfile.scanTimeframe)).filter((T) => T >= p).filter((T) => T <= e.to).filter((T) => Tl(T, e.selectionProfile)), A = e.candidateEvaluationPoints ? new Set(e.candidateEvaluationPoints) : null, E = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const T of h) {
      const M = We(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      E.previousEvaluationAsOf != null && T - E.previousEvaluationAsOf > M && (E.previousGate = null, E.falseSince = null);
      const I = T >= e.from, b = A == null || A.has(T), g = b ? e.selectionProfile.moveDetectors.map(
        (N) => Zc(N, d, T, e.selectionProfile.scanTimeframe)
      ) : [];
      if (I)
        for (const N of g)
          for (const ae of N.observations)
            n.set(ae.requestId, ae);
      const C = b ? ol(
        d,
        T,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ) : null;
      let x = [], B = [], W = !1, _ = !0, V = null;
      if (b) {
        const N = bl(
          g.map((Q) => Q.result),
          e.selectionProfile.detectorCombination
        ), ae = al(
          d,
          T,
          e.selectionProfile,
          g,
          C,
          e.universeHistory ?? []
        );
        x = ae.results, B = ae.evidence;
        const oe = x.every((Q) => Q.passed);
        if (W = N.passed && oe, _ = !oe || N.evaluable, I)
          for (const Q of B)
            Q.schemaVersion === _i && n.set(Q.requestId, Q);
        V = cl(
          d,
          T,
          g.map((Q) => Q.result),
          x,
          B,
          N.passed,
          oe,
          W,
          _
        ), I && i.push(V);
      }
      if (E.activeEpisode && T >= E.activeEpisode.activeUntil && (E.activeEpisode.detectedAt >= e.from && E.activeEpisode.activeUntil <= e.to && a.push(
        Fn(
          E.activeEpisode,
          E.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), E.activeEpisode = null), _ && !W ? (E.falseSince ?? (E.falseSince = T), !E.armed && T - E.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (I && ((c = E.blockedEpisode) == null ? void 0 : c.detectedAt) != null && E.blockedEpisode.detectedAt >= e.from && a.push(
        Fn(E.blockedEpisode, T, "reset", "radarGateReset", "armed")
      ), E.activeEpisode = null, E.blockedEpisode = null, E.armed = !0)) : E.falseSince = null, b && V && C && _ && W && E.previousGate === !1 && E.armed) {
        const N = nl({
          series: d,
          asOf: T,
          profile: e.selectionProfile,
          strategyProfile: t,
          detectorEvaluations: g,
          selectionEvaluation: V,
          hardGateEvidence: B,
          venueEligibility: C,
          lifecycleHistory: ((l = e.lifecycleHistory) == null ? void 0 : l[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (I) {
          r.push(N), a.push(
            Fn(N, T, "active", "detected", "blockedUntilReset")
          );
          const ae = il(N, d, e.selectionProfile, t);
          o.push(ae);
          for (const oe of N.contextObservations)
            n.set(oe.requestId, oe);
        }
        E.activeEpisode = N, E.blockedEpisode = N, E.armed = !1;
      }
      E.previousGate = _ ? W : null, E.previousEvaluationAsOf = T;
    }
  }
  return y({
    schemaVersion: jc,
    selectionProfileRef: Ka(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(Ya),
    gateEvaluations: i.sort(Il),
    episodes: r.sort(Pl),
    episodeStatusObservations: a.sort(xl),
    replayCaseManifests: o.sort((u, f) => u.id.localeCompare(f.id))
  });
}
function Xc(e) {
  const t = We(e.scanTimeframe) * e.evaluationCadence.everyBars;
  return Math.max(
    e.episodeExpiry.maximumAgeSeconds,
    e.resetPolicy.minimumFalseDurationSeconds
  ) + t;
}
function Zc(e, t, n, i) {
  return e.type === "rollingTroughRunup" ? Jc(e, t, n, i) : e.type === "elapsedWindowReturn" ? el(e, t, n, i) : e.type === "maximumWindowReturn" ? tl(e, t, n, i) : $a(e, t, n);
}
function Jc(e, t, n, i) {
  const r = Ee(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, s = (a ? r.filter(
    (h) => h.bucket >= a.bucket - e.lookbackSeconds && h.bucket <= a.bucket && a.bucket - h.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((h, A) => Z(A.c) && (!h || A.c < h.c || A.c === h.c && A.bucket < h.bucket) ? A : h, null), c = a && s && Z(s.c) ? (a.c / s.c - 1) * 100 : null, l = ml(r, a, e), u = ja(l, c, e.minimumSampleCount), f = [];
  a || f.push(de("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || f.push(de("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = w(e), m = ft({
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
    historyCandles: Di(r, a, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...u.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && St(m.percentile, e.minimumPercentile) && St(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, p = s ? sl(t, n, s, m) : null;
  return {
    result: wn(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${ln(c)} versus ${ln(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: p
  };
}
function el(e, t, n, i) {
  const r = Ua(e, t, n, i), a = Wa(r, e);
  return {
    result: wn(
      e,
      a,
      [r],
      a ? r.observationId : null,
      r.value == null ? "Elapsed return unavailable" : `${Xa(e.windowSeconds)} return ${ln(r.value)}`
    ),
    observations: [r],
    anchor: null
  };
}
function tl(e, t, n, i) {
  const r = [...new Set(e.windowsSeconds)].sort((u, f) => u - f).map(
    (u) => Ua(
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
  )[0] ?? null, o = Ee(t.candlesByTimeframe[i] ?? [], i, n), s = ft({
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
    historyCandles: Di(
      o,
      o.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: w(e),
    notes: a ? a.dataQualityNotes : [de("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Wa(s, e), l = [...r, s];
  return {
    result: wn(
      e,
      c,
      l,
      c ? (a == null ? void 0 : a.observationId) ?? null : null,
      (a == null ? void 0 : a.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Xa(a.window ?? 0)} return ${ln(a.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function $a(e, t, n) {
  const i = e.analysisTimeframe, r = Ee(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, o = yl(r, e.emaPeriod).at(-1) ?? null, s = hl(r, e.atrPeriod).at(-1) ?? null, c = a && o != null && s != null && s > 0 ? (a.c - o) / s : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  a || u.push(de("NO_COMPLETED_CANDLE", "error", `No completed ${i} candle exists at cutoff`)), (r.length < l || c == null) && u.push(
    de(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${i} candles`
    )
  );
  const f = ft({
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
    configHash: w(e),
    notes: Bi(u)
  }), d = c != null && r.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: wn(
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
function Ua(e, t, n, i) {
  const r = Ee(t.candlesByTimeframe[i] ?? [], i, n), a = r.at(-1) ?? null, o = a ? Qa(r, a.bucket - e.windowSeconds) : null, s = a && o ? a.bucket - e.windowSeconds - o.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, l = a && o && !c && Z(o.c) ? (a.c / o.c - 1) * 100 : null, u = dl(r, a, e), f = ja(u, l, e.minimumSampleCount), d = [...f.notes];
  return a || d.push(de("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), o ? c && d.push(de("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(de("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), ft({
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
    historyCandles: Di(
      r,
      a,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: w(e),
    notes: Bi(d)
  });
}
function nl(e) {
  var C;
  const t = e.detectorEvaluations.filter((x) => x.result.passed), n = Zn(
    t.flatMap(
      (x) => x.observations.filter(
        (B) => B.observationId === x.result.winningObservationId
      )
    )
  ), i = ((C = t.find((x) => x.anchor)) == null ? void 0 : C.anchor) ?? null, r = Ee(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), a = Nr(e.series, e.asOf, e.profile.scanTimeframe, 86400), o = Nr(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = za(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((x) => x.observations).find((x) => x.metricCode === "ema_atr_displacement") ?? null ?? $a(
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
  ).observations[0], u = fl(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = Zn([
    ...n,
    a,
    o,
    s,
    l
  ]), d = t[0], m = d ? n.find(
    (x) => x.observationId === d.result.winningObservationId
  ) ?? n[0] ?? null : null, v = rl(
    r,
    i,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    a,
    o,
    s,
    l,
    u
  ), p = pl(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), h = p != null && p.candidate ? p : null, A = (h == null ? void 0 : h.candidate) ?? null, E = (h == null ? void 0 : h.asOf) ?? null, T = h && E != null ? Xn({
    logicalObjectId: (A == null ? void 0 : A.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: h.updatedTs,
    knownAt: E,
    snapshot: h
  }) : null, M = A ? Xn({
    logicalObjectId: A.id,
    objectType: "SetupCandidateEpisode",
    eventTime: A.detectionEventTime,
    knownAt: E ?? A.detectedAt,
    snapshot: A
  }) : null, I = {
    schemaVersion: Ni,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((x) => x.result.detectorId),
    triggeringObservations: n,
    selectionGateEvaluationId: e.selectionEvaluation.id,
    hardGateResults: e.selectionEvaluation.hardGateResults,
    hardGateEvidence: e.hardGateEvidence,
    contextObservations: f,
    selectionAnchor: i,
    pathContext: v,
    initialLifecycleCandidateId: (A == null ? void 0 : A.id) ?? null,
    initialLifecycleCandidateRef: M,
    initialLifecycleState: (h == null ? void 0 : h.state) ?? null,
    initialLifecycleStateRef: T,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Bi([
      ...f.flatMap((x) => x.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, b = `radar-episode:${te({
    symbol: I.symbol,
    source: I.source,
    profileHash: I.selectionProfileHash,
    detectedAt: I.detectedAt,
    triggeringObservationIds: n.map((x) => x.observationId)
  })}`, g = { ...I, id: b, logicalObjectId: b };
  return y({
    ...g,
    observationId: Hi(g)
  });
}
function il(e, t, n, i) {
  const r = Object.keys(t.candlesByTimeframe).filter(
    (c) => Ee(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort($i), a = Object.fromEntries(
    r.map((c) => {
      var u, f;
      const l = Ee(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((f = l.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: l.at(-1) ? Be(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), o = r.filter(
    (c) => a[c].completedCandleCount > 0
  ), s = {
    schemaVersion: Ba,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Ka(n),
    lifecycleVersion: ye,
    strategyProfileRef: {
      id: i.id,
      version: i.version,
      profileHash: i.profileHash
    },
    availableTimeframes: o,
    preRollRequirements: El(n),
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
    id: qa(s)
  });
}
function qa(e) {
  const { id: t, ...n } = e;
  return `replay-case:${te(n)}`;
}
function Hi(e) {
  const { observationId: t, ...n } = e;
  return `radar-episode-observation:${te(n)}`;
}
function Nr(e, t, n, i) {
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
  }, a = Ee(e.candlesByTimeframe[n] ?? [], n, t), o = a.at(-1) ?? null, s = o ? Qa(a, o.bucket - i) : null, c = o && s && Z(s.c) ? (o.c / s.c - 1) * 100 : null, l = c == null ? [de("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${i}-second reference exists`)] : [];
  return ft({
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
    configHash: w(r),
    notes: l
  });
}
function za(e, t, n) {
  var f;
  const i = n.scanTimeframe, r = Ee(e.candlesByTimeframe[i] ?? [], i, t), a = r.at(-1) ?? null, o = a ? r.filter((d) => d.bucket > a.bucket - n.liquidityPolicy.windowSeconds) : [], s = o.map(
    (d) => Rt(d.v_quote) ? d.v_quote : Rt(d.v_base) ? d.v_base * d.c : null
  ), c = s.length > 0 && s.every((d) => d != null), l = c ? s.reduce((d, m) => d + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: i,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return ft({
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
    configHash: w(u),
    notes: c ? [] : [de("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function ft(e) {
  var u, f;
  const t = ((u = e.historyCandles[0]) == null ? void 0 : u.bucket) ?? null, n = ((f = e.historyCandles.at(-1)) == null ? void 0 : f.bucket) ?? null, i = e.timeframe && e.historyCandles.at(-1) ? Be(e.historyCandles.at(-1), e.timeframe) : e.asOf, r = e.timeframe ? e.historyCandles.reduce(
    (d, m) => Math.max(d, qe(m, e.timeframe)),
    i
  ) : e.asOf, a = w(
    e.historyCandles.map((d) => ({
      bucket: d.bucket,
      ts: d.ts,
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      vBase: Rt(d.v_base) ? d.v_base : null,
      vQuote: Rt(d.v_quote) ? d.v_quote : null,
      ver: Rt(d.ver) ? d.ver : null,
      knownAt: e.timeframe ? qe(d, e.timeframe) : null
    }))
  ), o = `radar-metric:${te({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.logicalWindow === void 0 ? e.window : e.logicalWindow,
    configHash: e.configHash
  })}`, s = {
    schemaVersion: _i,
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
  }, c = `radar-observation:${te(s)}`, l = e.asOf;
  return y({
    ...s,
    observationId: c,
    requestId: `radar-observation-request:${te({ observationId: c, requestedAsOf: l })}`,
    requestedAsOf: l
  });
}
function rl(e, t, n, i, r, a, o, s, c) {
  const l = t ? e.find((h) => h.bucket === t.timestamp) ?? null : null, f = (l ? e.filter((h) => h.bucket <= l.bucket) : []).reduce((h, A) => Z(A.c) && (!h || A.c > h.c || A.c === h.c && A.bucket < h.bucket) ? A : h, null), d = e.at(-1) ?? null, m = t && f && Z(f.c) ? (t.price / f.c - 1) * 100 : null, v = t && f && d && f.c > t.price ? (d.c - t.price) / (f.c - t.price) : null, p = t && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
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
function al(e, t, n, i, r, a) {
  const o = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return ht(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = Zn(i.flatMap((v) => v.observations));
        o.push(...d);
        const m = !i.some(
          (v) => v.observations.some(
            (p) => p.dataQualityNotes.some((h) => h.severity === "error")
          )
        );
        return ht(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        o.push(r);
        const d = wl(r.status, n.executionVenuePolicy.mode);
        return ht(
          c,
          d,
          `Execution venue ${r.status}`,
          [r]
        );
      }
      if (c === "selectedUniverse") {
        const d = Al(a, e, t);
        return d && o.push(d), ht(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const l = za(e, t, n);
      o.push(l);
      const u = n.liquidityPolicy.minimumQuoteNotional, f = u == null || l.value == null ? u == null || n.liquidityPolicy.missingData === "warn" : l.value >= u;
      return ht(
        c,
        f,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: Cl(o)
  };
}
function ht(e, t, n, i) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(i.map((r) => r.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        i.flatMap(
          (r) => r.schemaVersion === _i ? [r.requestId] : []
        )
      )
    ].sort()
  };
}
function ol(e, t, n, i) {
  const r = n.executionVenuePolicy.intendedVenue ?? "ignored", a = [...i].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === r.toLowerCase() && s.knownAt <= t && s.effectiveFrom <= t && (s.effectiveTo == null || s.effectiveTo >= t)
  );
  for (const s of a)
    if (bn(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const o = Vi(
    a,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return o || Kc({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: r,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      de(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function sl(e, t, n, i) {
  const r = {
    logicalObjectId: `selection-anchor:${te({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - Be(n, i.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: i.observationId
  };
  return y({
    ...r,
    observationId: `selection-anchor-observation:${te(r)}`
  });
}
function Fn(e, t, n, i, r) {
  const a = {
    schemaVersion: Wc,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: i,
    rearmState: r
  };
  return y({
    ...a,
    observationId: `radar-status:${te(a)}`
  });
}
function cl(e, t, n, i, r, a, o, s, c) {
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
    id: `radar-gate:${te(l)}`
  });
}
function wn(e, t, n, i, r) {
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
function Ee(e, t, n) {
  return hn(e, t, n);
}
function ll(e, t, n) {
  const i = k(t);
  return e.filter((r) => {
    if (!Number.isFinite(r.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (r.bucket + i > n) return !1;
    if (r.knownAt != null && !Number.isFinite(r.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${r.bucket}`);
    return qe(r, t) <= n;
  });
}
function ul(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([i, r]) => (We(i), [i, ll(r, i, t)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function fl(e, t, n) {
  const i = e.filter(
    (a) => a.symbol.toUpperCase() === t.symbol.toUpperCase() && a.source === t.source && a.knownAt <= n
  );
  for (const a of i)
    if (Va(a) !== a.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const r = /* @__PURE__ */ new Map();
  for (const a of new Set(i.map((o) => o.timeframe))) {
    const o = Vi(
      i.filter((s) => s.timeframe === a),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${a}`
    );
    o && r.set(a, o);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([a], [o]) => $i(a, o)).map(
      ([a, o]) => [
        a,
        Xn({
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
function Qa(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function dl(e, t, n) {
  if (!t) return [];
  const i = t.bucket - n.historyLookbackSeconds, r = [];
  for (const a of e) {
    if (a.bucket < i || a.bucket >= t.bucket) continue;
    const o = vl(e, a.bucket - n.windowSeconds);
    if (!o || !Z(o.c)) continue;
    const s = a.bucket - n.windowSeconds - o.bucket;
    n.maximumReferenceStalenessSeconds != null && s > n.maximumReferenceStalenessSeconds || r.push((a.c / o.c - 1) * 100);
  }
  return r;
}
function ml(e, t, n) {
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
    if (Z(c.c)) {
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
function vl(e, t) {
  let n = 0, i = e.length - 1, r = null;
  for (; n <= i; ) {
    const a = Math.floor((n + i) / 2), o = e[a];
    o.bucket <= t ? (r = o, n = a + 1) : i = a - 1;
  }
  return r;
}
function ja(e, t, n) {
  const i = [];
  if (e.length < n && i.push(
    de(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: i };
  const r = e.filter((l) => l <= t).length / e.length * 100, a = e.reduce((l, u) => l + u, 0) / e.length, o = e.reduce((l, u) => l + (u - a) ** 2, 0) / e.length, s = Math.sqrt(o), c = s > 0 ? (t - a) / s : null;
  return { percentile: r, zScore: c, notes: i };
}
function Di(e, t, n) {
  return t ? e.filter((i) => i.bucket >= t.bucket - n) : [];
}
function Wa(e, t) {
  return e.value != null && St(e.value, t.minimumReturnPct) && St(e.percentile, t.minimumPercentile) && St(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function yl(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let i = e.slice(0, t).reduce((a, o) => a + o.c, 0) / t;
  n[t - 1] = i;
  const r = 2 / (t + 1);
  for (let a = t; a < e.length; a += 1)
    i = e[a].c * r + i * (1 - r), n[a] = i;
  return n;
}
function hl(e, t) {
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
function pl(e, t, n, i) {
  const r = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= n
  );
  for (const s of r)
    gl(s, t, n, i);
  const a = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), o = r.filter((s) => s.asOf === a);
  if (new Set(o.map((s) => R(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${a}`);
  return o[0] ?? null;
}
function gl(e, t, n, i) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== ye || e.lifecycleVersion !== i.lifecycleVersion || e.lifecycleConfigHash !== i.lifecycleConfigHash || e.executionTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  ce(e.asOf, n, "lifecycle asOf"), ce(e.updatedTs, n, "lifecycle updatedTs"), ce(e.stateSince, n, "lifecycle stateSince");
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
      ce(c, n, s);
    for (const s of r.initialMtfContext)
      ce(s.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const a of e.evidence)
    if (ce(a.eventTime, n, "lifecycle evidence eventTime"), ce(a.knownAt, n, "lifecycle evidence knownAt"), a.knownAt < a.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const a of e.transitions)
    ce(a.knownAt, n, "lifecycle transition knownAt");
  for (const [a, o] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (o && (ce(o.eventTime, n, `${a} eventTime`), ce(o.knownAt, n, `${a} knownAt`), o.knownAt < o.eventTime))
      throw new Error(`${a} knownAt precedes eventTime`);
  for (const a of e.confluence)
    if (ce(a.eventTime, n, "lifecycle confluence eventTime"), ce(a.knownAt, n, "lifecycle confluence knownAt"), a.eventTime != null && a.knownAt != null && a.knownAt < a.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function ce(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function Al(e, t, n) {
  const i = [...e].filter(
    (r) => r.symbol.toUpperCase() === t.symbol.toUpperCase() && r.source === t.source && r.knownAt <= n && r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo >= n)
  );
  for (const r of i)
    if (En(r) !== r.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Vi(
    i,
    (r) => [r.effectiveFrom, r.knownAt],
    "universe membership"
  );
}
function El(e) {
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
  return [...t.entries()].sort(([i], [r]) => $i(i, r)).map(([i, r]) => ({
    timeframe: i,
    minimumDurationSeconds: r.duration,
    minimumBars: r.bars,
    purposes: [...r.purposes].sort()
  }));
}
function bl(e, t) {
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
function wl(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Tl(e, t) {
  const n = We(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function $(e) {
  throw new RangeError(e);
}
function Ga(e) {
  var n;
  e.schemaVersion !== Da && $("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && $("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && $("Only impulse_fade_v1 radar profiles are supported");
  try {
    We(e.scanTimeframe);
  } catch {
    $("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && $("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && $("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || $("At least one move detector is required"), new Set(e.moveDetectors.map((i) => i.id)).size !== e.moveDetectors.length && $("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && $("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((i) => !t.has(i)) && $("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || $("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && $("atLeast detector count must be between one and the detector count"), (!Z(e.episodeExpiry.maximumAgeSeconds) || !Z(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && $("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((i) => !i.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !Z(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && $("Radar profile policies are invalid");
  for (const i of e.moveDetectors) Sl(i);
}
function Sl(e) {
  if (e.id.trim() || $("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || $(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && $(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!Ei(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && $(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!Z(e.historyLookbackSeconds) || !Ln(e.minimumPercentile, 0, 100) || !Ln(e.minimumZScore)) && $(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!Z(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !Z(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && $(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!Ln(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && $(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !Z(e.windowSeconds) && $(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !Z(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && $(`Detector ${e.id} requires unique positive windows`);
}
function Rl(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Li(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (Ga(n), e.strategyProfile) {
    if (Ft(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: i, ...r } = e.strategyProfile;
    La(r);
  }
}
function Ln(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function St(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function Z(e) {
  return Number.isFinite(e) && e > 0;
}
function Rt(e) {
  return e != null && Number.isFinite(e);
}
function de(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Bi(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Zn(e) {
  return [...new Map(e.map((t) => [t.requestId, t])).values()].sort(Ya);
}
function Cl(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function Vi(e, t, n) {
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
function Ya(e, t) {
  return e.requestedAsOf - t.requestedAsOf || e.observationId.localeCompare(t.observationId) || e.requestId.localeCompare(t.requestId);
}
function Il(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function Pl(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function xl(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function $i(e, t) {
  return We(e) - We(t) || e.localeCompare(t);
}
function We(e) {
  return k(e);
}
function Ka(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function ln(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Xa(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function te(e) {
  return w(e).slice(8);
}
function Sm(e) {
  return R(e);
}
const Za = /* @__PURE__ */ new WeakMap(), Ja = /* @__PURE__ */ new WeakMap();
function eo(e, t) {
  Za.set(e, t);
}
function ee(e) {
  const t = Za.get(e);
  if (!t)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return t;
}
function Ol(e, t) {
  Ja.set(e, t);
}
async function Jn(e, t) {
  var a;
  const n = Ja.get(e);
  if (!n) return;
  const i = ee(e);
  if ((((a = i.analysisStateHistory.at(-1)) == null ? void 0 : a.knownAt) ?? -1 / 0) >= t) return;
  const r = await n.materializeThrough(t);
  eo(e, Object.freeze({
    ...i,
    analysisStateHistory: Object.freeze([...r.analysisStateHistory]),
    knownEvents: Object.freeze([...r.knownEvents])
  }));
}
const Tn = "replay-engine.1", Fe = "replay-engine.2", Ui = "replay-session-config.1", to = "replay-session.1", no = "replay-command.1", io = "replay-event.1", kl = "replay-decision-frame.1", Nl = "replay-wake-plan.1", _l = "replay-wake-condition.1", Ml = "replay-wake-result.1", Fl = "replay-data-bundle.1", qi = "replay-outcome-envelope.1", zi = "replay-analysis-state.1", Qi = "replay-known-event.1";
var me, _t, ei;
class Rm {
  constructor(t) {
    ne(this, _t);
    ne(this, me);
    se(this, me, y({
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
    const n = ie(this, _t, ei).call(this, t);
    return {
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: ((r = n.at(-1)) == null ? void 0 : r.closeTime) ?? null,
      revisionHistoryAvailable: S(this, me).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(t) {
    return y(
      ie(this, _t, ei).call(this, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions() {
    return [];
  }
  async loadAnalysisStateHistory(t) {
    return y(
      (S(this, me).analysisStateHistory ?? []).filter(
        (n) => Ct(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return y(
      (S(this, me).knownEvents ?? []).filter(
        (n) => Ct(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadPointInTimeVenueEvidence(t) {
    return y(
      (S(this, me).venueEvidence ?? []).filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return y(
      (S(this, me).universeEvidence ?? []).filter(
        (n) => Ct(n, t) && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadRadarEpisode(t) {
    return y(
      S(this, me).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
me = new WeakMap(), _t = new WeakSet(), ei = function(t) {
  return [...S(this, me).candles].filter(
    (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe
  ).sort(
    (n, i) => n.openTime - i.openTime || n.knownAt - i.knownAt || n.observationId.localeCompare(i.observationId)
  );
};
function ji(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function ro(e, t) {
  if (e.schemaVersion !== Ui || !Rn(e.replayEngineVersion))
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  so(e.strategyProfileRef, t);
  const n = e.evaluationTimeframe ?? t.timeframeRoles.executionTimeframe;
  k(n);
  const i = Gi(e.visibleTimeframes);
  if (!i.includes(n))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (_r(e.maximumCaseDuration, "maximumCaseDuration"), _r(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
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
    canonicalConfigHash: ji(a)
  });
}
function Cm(e) {
  const t = Gi([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return ro(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: Ui,
      replayEngineVersion: Tn,
      visibleTimeframes: t,
      displayPreRollByTimeframe: Object.fromEntries(
        t.map((n) => [
          n,
          Math.max(k(n) * 200, 86400)
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
function Lt(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function dt(e) {
  const { observationId: t, ...n } = e;
  return `replay-candle-observation:${w(n).slice(8)}`;
}
function ao(e) {
  const t = k(e.timeframe);
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
    logicalCandleId: Lt(e),
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
  return y({ ...r, observationId: dt(r) });
}
function Sn(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-state:${w(n).slice(8)}`;
}
function Ll(e) {
  if (ti(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const t = {
    schemaVersion: zi,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return y({ ...t, id: Sn(t) });
}
function Wi(e) {
  const { id: t, ...n } = e;
  return `replay-known-event:${w(n).slice(8)}`;
}
function Xt(e) {
  if (ti(e.eventTime, "eventTime"), ti(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && k(e.timeframe);
  const t = {
    schemaVersion: Qi,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return y({ ...t, id: Wi(t) });
}
async function Hl(e) {
  var b, g, C, x, B, W;
  Dl(e);
  const { manifest: t, sessionConfig: n, historicalDataAdapter: i } = e, r = await ((b = i.loadRadarEpisode) == null ? void 0 : b.call(i, t.radarEpisodeId));
  if (!r) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  Bl(t, r);
  const a = Gi([
    ...n.visibleTimeframes,
    n.evaluationTimeframe,
    ...t.preRollRequirements.map((_) => _.timeframe)
  ]), o = t.startAsOf + n.maximumCaseDuration, s = {}, c = {}, l = {}, u = [];
  for (const _ of a) {
    const V = jl(t, e.strategyProfile, _), N = Math.max(0, t.startAsOf - V), ae = n.displayPreRollByTimeframe[_] ?? 0, oe = Math.max(0, t.startAsOf - ae);
    s[_] = N, c[_] = oe;
    const Q = await i.getCoverage({
      symbol: t.symbol,
      source: t.source,
      timeframe: _
    });
    if (Q.timeframe !== _) throw new Error(`Coverage timeframe mismatch for ${_}`);
    if (Q.earliestOpenTime == null || Q.earliestOpenTime > N)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${_}`);
    Q.earliestOpenTime > oe && u.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${_} display history begins after the configured display pre-roll`
    }), Q.revisionHistoryAvailable || u.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${_} candle revision history is unavailable`
    });
    const qt = await i.loadCandleHistory({
      symbol: t.symbol,
      source: t.source,
      timeframe: _,
      from: N,
      to: o
    }), zt = Q.revisionHistoryAvailable ? await ((g = i.loadCandleRevisions) == null ? void 0 : g.call(i, {
      symbol: t.symbol,
      source: t.source,
      timeframe: _,
      from: N,
      to: o
    })) ?? [] : [];
    l[_] = Vl(
      [...qt, ...zt].filter((Qt) => Qt.knownAt <= o),
      t,
      _,
      N,
      o
    );
  }
  const f = {
    symbol: t.symbol,
    source: t.source,
    from: Math.min(...Object.values(s)),
    to: o
  }, d = $l(
    await ((C = i.loadAnalysisStateHistory) == null ? void 0 : C.call(i, f)) ?? [],
    t
  );
  if (!d.some((_) => _.knownAt <= t.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = Ul(
    await ((x = i.loadKnownEvents) == null ? void 0 : x.call(i, f)) ?? [],
    t
  ), v = ql(
    await ((B = i.loadPointInTimeVenueEvidence) == null ? void 0 : B.call(i, f)) ?? [],
    t
  ), p = zl(
    await ((W = i.loadPointInTimeUniverseEvidence) == null ? void 0 : W.call(i, f)) ?? [],
    t
  ), h = {
    schemaVersion: Fl,
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
  }, A = await at(h), E = await oo(h, t.startAsOf), T = y({
    ...h,
    causalPrefixFingerprint: E,
    internalBundleFingerprint: A
  }), M = y({
    ...h,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(l).map(([_, V]) => [
        _,
        V.filter(
          (N) => N.closeTime <= t.startAsOf && N.knownAt <= t.startAsOf
        )
      ])
    ),
    analysisStateHistory: d.filter(
      (_) => _.knownAt <= t.startAsOf
    ),
    knownEvents: m.filter((_) => _.knownAt <= t.startAsOf),
    venueEvidence: v.filter((_) => _.knownAt <= t.startAsOf),
    universeEvidence: p.filter((_) => _.knownAt <= t.startAsOf),
    causalPrefixFingerprint: E
  }), I = {
    manifest: y(t),
    sessionConfig: y(n),
    strategyProfile: y(e.strategyProfile),
    radarSelectionProfile: y(e.radarSelectionProfile),
    venueRules: y(e.venueRules ?? null),
    dataBundle: M,
    ...e.materializedAnalysisBinding ? { materializedAnalysisBinding: y(e.materializedAnalysisBinding) } : {}
  };
  return eo(I, T), I;
}
async function Im(e, t) {
  if (t > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: n, ...i } = e.dataBundle;
  return oo(i, t);
}
async function oo(e, t) {
  return at({
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
async function at(e) {
  var i;
  if (!((i = globalThis.crypto) != null && i.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const t = new TextEncoder().encode(R(e)), n = await globalThis.crypto.subtle.digest("SHA-256", t);
  return `sha256:${[...new Uint8Array(n)].map((r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function Dl(e) {
  const { manifest: t, sessionConfig: n, strategyProfile: i, radarSelectionProfile: r } = e;
  if (t.schemaVersion !== Ba || qa(t) !== t.id || t.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (t.startAsOf !== t.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (Li(r) !== r.canonicalConfigHash || t.selectionProfileRef.id !== r.id || t.selectionProfileRef.version !== r.version || t.selectionProfileRef.canonicalConfigHash !== r.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (Ft(i) !== i.profileHash || i.lifecycleVersion !== ye || t.lifecycleVersion !== i.lifecycleVersion || t.strategyProfileRef.id !== i.id || t.strategyProfileRef.version !== i.version || t.strategyProfileRef.profileHash !== i.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (n.schemaVersion !== Ui || !Rn(n.replayEngineVersion) || ji(n) !== n.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (n.replayEngineVersion === Fe && (!e.materializedAnalysisBinding || e.materializedAnalysisBinding.replayEngineVersion !== Fe || e.materializedAnalysisBinding.lifecycleConfigHash !== i.lifecycleConfigHash || e.materializedAnalysisBinding.radarProfileHash !== r.canonicalConfigHash || e.materializedAnalysisBinding.strategyProfileHash !== i.profileHash))
    throw new Error("Materialized replay configuration is missing its analysis binding");
  if (n.replayEngineVersion === Tn && e.materializedAnalysisBinding)
    throw new Error("replay-engine.1 cannot accept a materialized analysis binding");
  if (so(n.strategyProfileRef, i), n.evaluationTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (n.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (n.venueRulesRef && e.venueRules) {
    const a = Wl(e.venueRules);
    if (R(a) !== R(n.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function Rn(e) {
  return e === Tn || e === Fe;
}
function Bl(e, t) {
  var i, r, a;
  if (t.schemaVersion !== Ni || t.id !== e.radarEpisodeId || t.observationId !== e.radarEpisodeObservationId || Hi(t) !== t.observationId || t.symbol.toUpperCase() !== e.symbol.toUpperCase() || t.source !== e.source || t.detectedAt !== e.detectedAt || t.effectiveAsOf !== e.startAsOf)
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
function Vl(e, t, n, i, r) {
  const a = /* @__PURE__ */ new Map();
  for (const l of e) {
    const u = ao({
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
    if (l.symbol.toUpperCase() !== t.symbol.toUpperCase() || l.source !== t.source || l.timeframe !== n || l.openTime < i || l.openTime > r || l.logicalCandleId !== Lt(l) || l.observationId !== dt(l) || R(l) !== R(u))
      throw new Error(`Invalid replay candle provenance for ${n}`);
    const f = R(l), d = a.get(l.observationId);
    if (d && R(d) !== f)
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
    hn(o.map(Ql), n, l);
  return y(o);
}
function $l(e, t) {
  const n = [...e].sort((r, a) => r.knownAt - a.knownAt || r.id.localeCompare(a.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== zi || r.id !== Sn(r) || !Ct(r, t))
      throw new Error("Analysis state observation failed provenance verification");
    const a = i.get(r.knownAt);
    if (a && R(a) !== R(r))
      throw new Error(`Conflicting analysis states at ${r.knownAt}`);
    i.set(r.knownAt, r);
  }
  return y([...i.values()]);
}
function Ul(e, t) {
  const n = [...e].sort((r, a) => r.knownAt - a.knownAt || r.id.localeCompare(a.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== Qi || r.id !== Wi(r) || !Ct(r, t) || r.knownAt < r.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const a = i.get(r.id);
    if (a && R(a) !== R(r))
      throw new Error(`Conflicting replay known event ${r.id}`);
    i.set(r.id, r);
  }
  return y([...i.values()]);
}
function ql(e, t) {
  return y(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== Mi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.marketDataSource !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== bn(i))
        throw new Error("Execution-venue evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function zl(e, t) {
  return y(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== Fi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.source !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== En(i))
        throw new Error("Universe evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function Ql(e) {
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
function jl(e, t, n) {
  const i = e.preRollRequirements.filter((a) => a.timeframe === n).reduce(
    (a, o) => Math.max(
      a,
      o.minimumDurationSeconds,
      o.minimumBars * k(n)
    ),
    0
  ), r = n === t.timeframeRoles.candidateTimeframe ? 180 * 86400 : n === t.timeframeRoles.structureTimeframe || t.timeframeRoles.contextTimeframes.includes(n) ? 90 * 86400 : k(n) * 250;
  return Math.max(i, r);
}
function Wl(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: w(e)
  };
}
function so(e, t) {
  if (e.id !== t.id || e.version !== t.version || e.profileHash !== t.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function Gi(e) {
  const t = [];
  for (const n of e)
    k(n), t.includes(n) || t.push(n);
  if (!t.length) throw new RangeError("At least one timeframe is required");
  return t;
}
function _r(e, t) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${t} must be a positive integer number of seconds`);
}
function ti(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
function Ct(e, t) {
  return e.symbol.toUpperCase() === t.symbol.toUpperCase() && e.source === t.source;
}
const Gl = "chart-analysis-digest.1", Yl = "chart-analysis-comparison.1", Kl = Object.freeze({
  price: 12,
  volume: 8,
  percentage: 8,
  ratio: 10,
  oscillator: 8,
  score: 8
}), Mr = [
  "SCHEMA_VERSION_MISMATCH",
  "MODE_MISMATCH",
  "IDENTITY_MISMATCH",
  "DIGEST_FINGERPRINT_MISMATCH",
  "REQUESTED_ASOF_MISMATCH",
  "EFFECTIVE_ASOF_MISMATCH",
  "CANDLE_PREFIX_MISMATCH",
  "TIMEFRAME_BUCKET_MISMATCH",
  "REFERENCE_ALIGNMENT_MISMATCH",
  "PROFILE_CONFIG_MISMATCH",
  "CANDIDATE_METRIC_MISMATCH",
  "STOCH_RSI_MISMATCH",
  "STRUCTURE_STATE_MISMATCH",
  "STRUCTURE_EVENT_MISMATCH",
  "ACTIVE_LEVEL_MISMATCH",
  "SR_ZONE_MISMATCH",
  "RS_VALUE_MISMATCH",
  "RS_EVENT_MISMATCH",
  "AVWAP_VALUE_MISMATCH",
  "AVWAP_EVENT_MISMATCH",
  "LIFECYCLE_STATE_MISMATCH",
  "LIFECYCLE_EVIDENCE_MISMATCH",
  "SETUP_STATE_MISMATCH",
  "DATA_QUALITY_MISMATCH",
  "RENDERING_CONTENT_MISMATCH",
  "FUTURE_DATA_EXPOSURE",
  "UNKNOWN"
], Xl = /* @__PURE__ */ new Set([
  "analysisProfileRef",
  "lifecycleConfigRef",
  "radarProfileRef",
  "strategyProfileRef"
]), Yi = /* @__PURE__ */ new Set([
  "asOf",
  "effectiveAsOf",
  "eventTime",
  "knownAt",
  "evaluatedAt",
  "updatedAt",
  "updatedTs",
  "stateSince",
  "detectedAt",
  "detectionEventTime",
  "episodeHighTime",
  "terminalAt",
  "selectedAt",
  "anchorTime",
  "closeTime",
  "correctionPublishedAt",
  "latestCloseTime",
  "latestInputCloseTime",
  "latestInputKnownAt",
  "latestTs",
  "referenceTs",
  "availableEndTs",
  "requestedEndTs"
]);
function Zl(e, t) {
  if (!Number.isFinite(e)) throw new TypeError(`${t} metric must be finite`);
  const n = Number(e.toFixed(Kl[t]));
  return Object.is(n, -0) ? 0 : n;
}
function Pm(e) {
  var o;
  Jl(e);
  const { state: t } = e, n = Object.fromEntries(
    Object.entries(t.indicatorSeries).flatMap(
      ([s, c]) => c.stochRsi ? [[s, { ...c.stochRsi, configurationHash: c.configurationHash }]] : []
    )
  ), i = {
    analysisProfileRef: t.analysisProfileRef,
    lifecycleConfigRef: t.lifecycleConfigRef,
    radarProfileRef: t.radarProfileRef,
    strategyProfileRef: t.strategyProfileRef,
    ...e.profileAndConfigRefs
  }, r = t.setupState, a = {
    schemaVersion: Gl,
    mode: e.mode,
    symbolOrRedactedAlias: e.symbolOrRedactedAlias ?? t.symbol,
    sourceOrRedactedSource: e.sourceOrRedactedSource ?? t.source,
    requestedAsOf: t.requestedAsOf,
    effectiveAsOf: t.effectiveAsOf,
    candlePrefixByTimeframe: eu(
      e.candlePrefixesByTimeframe,
      t
    ),
    candidateMetrics: Y(t.candidateMetrics, "ratio"),
    extensionContext: Y(t.extensionContext, "price"),
    stochasticRsiByTimeframe: Y(n, "oscillator"),
    structureByTimeframe: Y(t.structureByTimeframe, "price"),
    structureEvents: Y(t.structureEvents, "price"),
    activeStructureLevels: Y(t.activeStructureLevels, "price"),
    supportResistanceZones: Y(t.supportResistanceZones, "price"),
    relativeStrengthState: Y(t.relativeStrength, "ratio"),
    relativeStrengthEvents: Y(t.relativeStrengthEvents, "ratio"),
    avwapStates: Y(t.avwapStates, "price"),
    avwapEvents: Y(t.avwapEvents, "price"),
    lifecycleState: Y({
      candidateId: ((o = t.lifecycleResult.candidate) == null ? void 0 : o.id) ?? null,
      state: t.lifecycleResult.currentState,
      stateSince: t.lifecycleResult.stateSince
    }, "ratio"),
    lifecycleEvidence: Y(t.lifecycleResult.evidence, "ratio"),
    pendingConditions: [...t.lifecycleResult.pendingConditions],
    setupState: Y({
      label: r.label,
      reason: r.reason,
      checks: r.checks,
      transitions: r.transitions,
      activeBreakLevel: r.activeBreakLevel,
      retestLevel: r.retestLevel,
      confluence: r.confluence,
      invalidationReason: r.invalidationReason,
      expiryReason: r.expiryReason,
      dataQuality: r.dataQuality
    }, "ratio"),
    componentCoverage: Y(t.coverageByComponent, "ratio"),
    componentFreshness: Y(t.freshnessByComponent, "ratio"),
    dataQualityNotes: y(t.dataQualityNotes),
    profileAndConfigRefs: y(i)
  };
  return y({
    ...a,
    digestFingerprint: ni(a)
  });
}
function ni(e) {
  const { digestFingerprint: t, ...n } = e;
  return w(n);
}
function xm(e, t) {
  const n = [];
  L(n, "MODE_MISMATCH", "live.mode", e.mode, "liveHistorical"), L(n, "MODE_MISMATCH", "replay.mode", t.mode, "replay"), L(
    n,
    "DIGEST_FINGERPRINT_MISMATCH",
    "live.digestFingerprint",
    e.digestFingerprint,
    ni(e)
  ), L(
    n,
    "DIGEST_FINGERPRINT_MISMATCH",
    "replay.digestFingerprint",
    t.digestFingerprint,
    ni(t)
  );
  for (const r of Fr(e))
    n.push(un(
      "FUTURE_DATA_EXPOSURE",
      `live.${r}`,
      Hr(e, r),
      null
    ));
  for (const r of Fr(t))
    n.push(un(
      "FUTURE_DATA_EXPOSURE",
      `replay.${r}`,
      null,
      Hr(t, r)
    ));
  L(n, "SCHEMA_VERSION_MISMATCH", "schemaVersion", e.schemaVersion, t.schemaVersion), L(n, "IDENTITY_MISMATCH", "symbolOrRedactedAlias", e.symbolOrRedactedAlias, t.symbolOrRedactedAlias), L(n, "IDENTITY_MISMATCH", "sourceOrRedactedSource", e.sourceOrRedactedSource, t.sourceOrRedactedSource), L(n, "REQUESTED_ASOF_MISMATCH", "requestedAsOf", e.requestedAsOf, t.requestedAsOf), L(n, "EFFECTIVE_ASOF_MISMATCH", "effectiveAsOf", e.effectiveAsOf, t.effectiveAsOf), ru(n, e.candlePrefixByTimeframe, t.candlePrefixByTimeframe), L(n, "PROFILE_CONFIG_MISMATCH", "profileAndConfigRefs", e.profileAndConfigRefs, t.profileAndConfigRefs), L(n, "CANDIDATE_METRIC_MISMATCH", "candidateMetrics", e.candidateMetrics, t.candidateMetrics), L(n, "CANDIDATE_METRIC_MISMATCH", "extensionContext", e.extensionContext, t.extensionContext), L(n, "STOCH_RSI_MISMATCH", "stochasticRsiByTimeframe", e.stochasticRsiByTimeframe, t.stochasticRsiByTimeframe), L(n, "STRUCTURE_STATE_MISMATCH", "structureByTimeframe", e.structureByTimeframe, t.structureByTimeframe), L(n, "STRUCTURE_EVENT_MISMATCH", "structureEvents", e.structureEvents, t.structureEvents), L(n, "ACTIVE_LEVEL_MISMATCH", "activeStructureLevels", e.activeStructureLevels, t.activeStructureLevels), L(n, "SR_ZONE_MISMATCH", "supportResistanceZones", e.supportResistanceZones, t.supportResistanceZones), au(n, e.relativeStrengthState, t.relativeStrengthState), L(n, "RS_VALUE_MISMATCH", "relativeStrengthState", Lr(e), Lr(t)), L(n, "RS_EVENT_MISMATCH", "relativeStrengthEvents", e.relativeStrengthEvents, t.relativeStrengthEvents), L(n, "AVWAP_VALUE_MISMATCH", "avwapStates", e.avwapStates, t.avwapStates), L(n, "AVWAP_EVENT_MISMATCH", "avwapEvents", e.avwapEvents, t.avwapEvents), L(n, "LIFECYCLE_STATE_MISMATCH", "lifecycleState", e.lifecycleState, t.lifecycleState), L(n, "LIFECYCLE_EVIDENCE_MISMATCH", "lifecycleEvidence", e.lifecycleEvidence, t.lifecycleEvidence), L(n, "LIFECYCLE_EVIDENCE_MISMATCH", "pendingConditions", e.pendingConditions, t.pendingConditions), L(n, "SETUP_STATE_MISMATCH", "setupState", e.setupState, t.setupState), L(n, "DATA_QUALITY_MISMATCH", "componentCoverage", e.componentCoverage, t.componentCoverage), L(n, "DATA_QUALITY_MISMATCH", "componentFreshness", e.componentFreshness, t.componentFreshness), L(n, "DATA_QUALITY_MISMATCH", "dataQualityNotes", e.dataQualityNotes, t.dataQualityNotes), n.sort(
    (r, a) => Mr.indexOf(r.classification) - Mr.indexOf(a.classification) || r.path.localeCompare(a.path)
  );
  const i = {
    schemaVersion: Yl,
    liveDigestFingerprint: e.digestFingerprint,
    replayDigestFingerprint: t.digestFingerprint,
    discrepancies: n,
    analyticalParityPassed: n.length === 0
  };
  return y({
    ...i,
    comparisonFingerprint: w(i)
  });
}
function Jl(e) {
  if (!["development", "test", "audit"].includes(e.availability))
    throw new Error("ChartAnalysisDigest is available only in development, test, or audit contexts");
  if (e.mode !== "liveHistorical" && e.mode !== "replay")
    throw new TypeError("Unsupported ChartAnalysisDigest mode");
  const { state: t } = e;
  if (!Number.isFinite(t.requestedAsOf) || !Number.isFinite(t.effectiveAsOf))
    throw new TypeError("ChartAnalysisDigest cutoffs must be finite");
  if (t.effectiveAsOf > t.requestedAsOf)
    throw new RangeError("effectiveAsOf cannot exceed requestedAsOf");
  if (!(e.symbolOrRedactedAlias ?? t.symbol).trim())
    throw new TypeError("ChartAnalysisDigest symbol or alias is required");
  if (!(e.sourceOrRedactedSource ?? t.source).trim())
    throw new TypeError("ChartAnalysisDigest source or redacted source is required");
  for (const n of Object.keys(e.profileAndConfigRefs))
    if (Xl.has(n))
      throw new Error(`Additional profile/config reference cannot override ${n}`);
  if (t.candidateMetrics.effectiveAsOf !== t.effectiveAsOf)
    throw new Error("Candidate metrics cutoff does not match analysis effectiveAsOf");
  if (t.lifecycleResult.asOf !== t.effectiveAsOf || t.setupState.asOf !== t.effectiveAsOf)
    throw new Error("Lifecycle/setup state cutoff does not match analysis effectiveAsOf");
  ii({
    candidateMetrics: t.candidateMetrics,
    extensionContext: t.extensionContext,
    structureByTimeframe: t.structureByTimeframe,
    structureEvents: t.structureEvents,
    activeStructureLevels: t.activeStructureLevels,
    supportResistanceZones: t.supportResistanceZones,
    relativeStrength: t.relativeStrength,
    relativeStrengthEvents: t.relativeStrengthEvents,
    avwapStates: t.avwapStates,
    avwapEvents: t.avwapEvents,
    lifecycleResult: t.lifecycleResult,
    setupState: t.setupState,
    coverageByComponent: t.coverageByComponent,
    freshnessByComponent: t.freshnessByComponent
  }, t.effectiveAsOf, "state"), tu(t);
}
function eu(e, t) {
  return Object.keys(e).sort((n, i) => k(n) - k(i) || n.localeCompare(i)).map((n) => {
    var c, l;
    const i = e[n] ?? [];
    let r = -1 / 0;
    const a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
    for (const u of i) {
      if (u.symbol !== t.symbol || u.source !== t.source || u.timeframe !== n)
        throw new Error(`Candle prefix identity mismatch for ${n}`);
      if (u.openTime <= r)
        throw new Error(`Candle prefix must be strictly ordered for ${n}`);
      if (u.closeTime > t.effectiveAsOf || u.knownAt > t.effectiveAsOf)
        throw new Error(`FUTURE_DATA_EXPOSURE:candlePrefixesByTimeframe.${n}`);
      if (u.logicalCandleId !== Lt(u))
        throw new Error(`Invalid logical candle identity for ${n}`);
      if (u.observationId !== dt(u))
        throw new Error(`Invalid candle observation identity for ${n}`);
      if (a.has(u.logicalCandleId) || o.has(u.observationId))
        throw new Error(`Duplicate candle identity in ${n} prefix`);
      r = u.openTime, a.add(u.logicalCandleId), o.add(u.observationId);
    }
    const s = Y(i, "price");
    return {
      timeframe: n,
      count: i.length,
      firstOpenTime: ((c = i[0]) == null ? void 0 : c.openTime) ?? null,
      latestCloseTime: ((l = i.at(-1)) == null ? void 0 : l.closeTime) ?? null,
      logicalCandleIds: i.map((u) => u.logicalCandleId),
      observationIds: i.map((u) => u.observationId),
      prefixFingerprint: w(s)
    };
  });
}
function tu(e) {
  for (const [n, i] of Object.entries(e.extensionContext)) {
    const r = k(n);
    for (const [a, o] of [["candle", i.candle], ["referenceCandle", i.referenceCandle]])
      if (o && (o.bucket + r > e.effectiveAsOf || (o.knownAt ?? 0) > e.effectiveAsOf))
        throw new Error(`FUTURE_DATA_EXPOSURE:extensionContext.${n}.${a}`);
  }
  for (const [n, i] of Object.entries(e.candidateMetrics.timeframeExtensions))
    if (i.latestTs != null && i.latestTs + k(n) > e.effectiveAsOf)
      throw new Error(`FUTURE_DATA_EXPOSURE:candidateMetrics.timeframeExtensions.${n}.latestTs`);
  const t = k(e.candidateMetrics.baseTimeframe);
  for (const [n, i] of [
    ["latestTs", e.candidateMetrics.extension.latestTs],
    ["referenceTs", e.candidateMetrics.extension.referenceTs]
  ])
    if (i != null && i + t > e.effectiveAsOf)
      throw new Error(`FUTURE_DATA_EXPOSURE:candidateMetrics.extension.${n}`);
  for (const n of e.avwapStates)
    if (n.anchor.anchorTime + k(n.anchor.timeframe) > e.effectiveAsOf)
      throw new Error(`FUTURE_DATA_EXPOSURE:avwapStates.${n.anchor.id}.anchorTime`);
}
function ii(e, t, n) {
  if (e == null || typeof e != "object") return;
  if (Array.isArray(e)) {
    e.forEach((r, a) => ii(r, t, `${n}[${a}]`));
    return;
  }
  const i = e;
  if (typeof i.eventTime == "number" && typeof i.knownAt == "number" && i.knownAt < i.eventTime)
    throw new Error(`Invalid evidence chronology at ${n}`);
  for (const [r, a] of Object.entries(i)) {
    const o = `${n}.${r}`;
    if (Yi.has(r) && typeof a == "number" && a > t)
      throw new Error(`FUTURE_DATA_EXPOSURE:${o}`);
    ii(a, t, o);
  }
}
function Y(e, t) {
  return y(ri(e, t));
}
function ri(e, t, n = "") {
  if (typeof e == "number") {
    if (nu(n)) {
      if (!Number.isFinite(e)) throw new TypeError(`${n || "numeric"} value must be finite`);
      return Object.is(e, -0) ? 0 : e;
    }
    return Zl(e, iu(n, t));
  }
  return Array.isArray(e) ? e.map((i) => ri(i, t, n)) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([i, r]) => [
    i,
    ri(r, t, i)
  ])) : e;
}
function nu(e) {
  return Yi.has(e) || [
    "openTime",
    "firstOpenTime",
    "bucket",
    "ts",
    "x",
    "index",
    "lastX",
    "sourceSwingX",
    "count",
    "sampleCount",
    "requiredCoverage",
    "availableCoverage",
    "rollingReturnCount",
    "touches",
    "revision",
    "windowSeconds",
    "historyDays",
    "emaPeriod",
    "atrPeriod",
    "rsiPeriod",
    "stochPeriod",
    "kPeriod",
    "dPeriod",
    "coveredSeconds",
    "requestedSeconds",
    "requestedStartTs",
    "availableStartTs"
  ].includes(e);
}
function iu(e, t) {
  return ["vBase", "vQuote", "volume", "volumeBase", "volumeQuote"].includes(e) ? "volume" : e === "percentile" || e.endsWith("Pct") || e.endsWith("Percent") ? "percentage" : ["zScore", "coverageRatio", "atrExtension"].includes(e) ? "ratio" : ["score", "strength"].includes(e) ? "score" : [
    "o",
    "h",
    "l",
    "c",
    "open",
    "high",
    "low",
    "close",
    "price",
    "previousPrice",
    "level",
    "sourceSwingPrice",
    "rangeLow",
    "rangeHigh",
    "center",
    "latestClose",
    "referenceClose",
    "ema",
    "atr",
    "vwap",
    "episodeHigh"
  ].includes(e) ? "price" : t;
}
function Fr(e) {
  const t = [];
  for (const [n, i] of e.candlePrefixByTimeframe.entries())
    i.latestCloseTime != null && i.latestCloseTime > e.effectiveAsOf && t.push(`candlePrefixByTimeframe[${n}].latestCloseTime`);
  return ai({
    candidateMetrics: e.candidateMetrics,
    extensionContext: e.extensionContext,
    structureByTimeframe: e.structureByTimeframe,
    structureEvents: e.structureEvents,
    activeStructureLevels: e.activeStructureLevels,
    supportResistanceZones: e.supportResistanceZones,
    relativeStrengthState: e.relativeStrengthState,
    relativeStrengthEvents: e.relativeStrengthEvents,
    avwapStates: e.avwapStates,
    avwapEvents: e.avwapEvents,
    lifecycleState: e.lifecycleState,
    lifecycleEvidence: e.lifecycleEvidence,
    setupState: e.setupState,
    componentCoverage: e.componentCoverage,
    componentFreshness: e.componentFreshness
  }, e.effectiveAsOf, "", t), [...new Set(t)].sort();
}
function ai(e, t, n, i) {
  if (!(e == null || typeof e != "object")) {
    if (Array.isArray(e)) {
      e.forEach((r, a) => ai(r, t, `${n}[${a}]`, i));
      return;
    }
    for (const [r, a] of Object.entries(e)) {
      const o = n ? `${n}.${r}` : r;
      Yi.has(r) && typeof a == "number" && a > t && i.push(o), ai(a, t, o, i);
    }
  }
}
function ru(e, t, n) {
  const i = new Map(t.map((o) => [o.timeframe, o])), r = new Map(n.map((o) => [o.timeframe, o])), a = [.../* @__PURE__ */ new Set([...i.keys(), ...r.keys()])].sort((o, s) => k(o) - k(s) || o.localeCompare(s));
  for (const o of a) {
    const s = i.get(o), c = r.get(o);
    if (!s || !c) {
      e.push(un("TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${o}`, s ?? null, c ?? null));
      continue;
    }
    L(e, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${o}.count`, s.count, c.count), L(e, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${o}.firstOpenTime`, s.firstOpenTime, c.firstOpenTime), L(e, "TIMEFRAME_BUCKET_MISMATCH", `candlePrefixByTimeframe.${o}.latestCloseTime`, s.latestCloseTime, c.latestCloseTime), L(e, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${o}.logicalCandleIds`, s.logicalCandleIds, c.logicalCandleIds), L(e, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${o}.observationIds`, s.observationIds, c.observationIds), L(e, "CANDLE_PREFIX_MISMATCH", `candlePrefixByTimeframe.${o}.prefixFingerprint`, s.prefixFingerprint, c.prefixFingerprint);
  }
}
function au(e, t, n) {
  L(e, "REFERENCE_ALIGNMENT_MISMATCH", "relativeStrengthState.referenceAlignment", {
    targetSymbol: t.targetSymbol,
    targetSource: t.targetSource,
    referenceSymbol: t.referenceSymbol,
    referenceSource: t.referenceSource,
    formulaVersion: t.formulaVersion,
    normalizationAnchor: t.normalizationAnchor,
    status: t.status
  }, {
    targetSymbol: n.targetSymbol,
    targetSource: n.targetSource,
    referenceSymbol: n.referenceSymbol,
    referenceSource: n.referenceSource,
    formulaVersion: n.formulaVersion,
    normalizationAnchor: n.normalizationAnchor,
    status: n.status
  });
}
function Lr(e) {
  return {
    series: e.relativeStrengthState.series,
    structure: e.relativeStrengthState.structure
  };
}
function L(e, t, n, i, r) {
  R(i) !== R(r) && e.push(un(t, n, i, r));
}
function un(e, t, n, i) {
  const r = {
    classification: e,
    path: t,
    liveFingerprint: w(n),
    replayFingerprint: w(i),
    message: `${e} at ${t}`
  };
  return {
    id: `chart-analysis-discrepancy:${w(r).slice(8)}`,
    ...r
  };
}
function Hr(e, t) {
  return t.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean).reduce(
    (i, r) => i && typeof i == "object" ? i[r] : null,
    e
  );
}
const co = "linear-quote-perpetual-risk.1", ou = "sizing-result.1", lo = "trade-plan.1", su = "decision-record.1";
function uo(e) {
  const t = [], n = [
    Ve(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(Ve("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((N) => !Number.isFinite(N) || N <= 0) && t.push(Ve("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(Ve("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && F(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!Zt(e.intendedEntryPrice, e.venueRules.priceTick) || !Zt(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (N) => !Zt(N.targetPrice, e.venueRules.priceTick)
  )) && F(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !Zt(e.leveragePolicy.leverage, e.venueRules.leverageStep) && F(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    Ve(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const r = e.riskRequest.accountRiskFraction != null, a = e.riskRequest.fixedRiskAmount != null;
  r === a && t.push(
    Ve(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (r && (!ve(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || a && (!ve(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && F(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (N) => !Number.isFinite(N) || N < 0
  ) && F(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && F(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const o = a ? e.riskRequest.fixedRiskAmount : r ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (o == null || !Number.isFinite(o) || o <= 0) && F(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), uu(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = ve(s) ? s : null, l = ve(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && F(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = o != null && u != null && u > 0 ? o / u : null;
  let d = f == null ? null : Dr(f, e.venueRules.quantityStep);
  if (d != null && o != null && u != null)
    for (; d > 0 && d * u > o + Math.max(1e-10, o * 1e-12); )
      d = Dr(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = d != null && d > 0 ? d : null, v = m == null ? null : m * e.intendedEntryPrice, p = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, h = m == null || l == null ? null : m * l * e.executionAssumptions.stopExitFeeRate, A = m == null || u == null ? null : m * u;
  (m == null || m < e.venueRules.minQuantity) && F(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && F(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const E = e.riskRequest.maximumNotional;
  E != null && v != null && v > E && F(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${E}`
  );
  const T = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, M = e.accountState.availableBalance == null ? T : Math.min(T, e.accountState.availableBalance), I = v != null && M > 0 ? v / M : null, b = hu(
    e.leveragePolicy,
    I,
    e.venueRules.leverageStep
  );
  b != null && b > e.venueRules.maxLeverage && F(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${b} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const g = v != null && b != null && b > 0 ? v / b : null;
  g != null && g > T + 1e-10 && F(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), g != null && e.accountState.availableBalance != null && g > e.accountState.availableBalance + 1e-10 && F(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const C = m != null && c != null && l != null ? m * (l - c) : null, x = fu(
    e.targets,
    m,
    c,
    C,
    A,
    e.executionAssumptions
  ), B = Jt(
    x.map((N) => N.grossReward * N.positionFraction)
  ), W = Jt(
    x.map((N) => N.netProjectedReward * N.positionFraction)
  ), _ = Jt(
    x.map(
      (N) => N.weightedGrossRContribution == null ? null : N.weightedGrossRContribution
    )
  ), V = Jt(
    x.map(
      (N) => N.weightedRContribution == null ? null : N.weightedRContribution
    )
  );
  return y({
    schemaVersion: ou,
    sizingModelVersion: co,
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
    selectedLeverage: b,
    minimumRequiredLeverage: I,
    initialMargin: g,
    marginPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    marginPercentAvailableBalance: g == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : g / e.accountState.availableBalance * 100,
    targetOutcomes: x,
    weightedGrossReward: B,
    weightedProjectedReward: W,
    weightedGrossR: _,
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
function cu(e) {
  var a;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = uo({
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
    schemaVersion: lo,
    snapshotId: e.snapshot.id,
    setupFamily: Ne,
    lifecycleVersion: ye,
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
  }, i = { ...n, id: e.id ?? Ki(n) }, r = lu({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: i
  });
  return y({ ...i, complianceResult: r });
}
function lu(e) {
  var d, m;
  const { strategyProfile: t, snapshot: n, plan: i } = e, r = [...i.sizingResult.hardErrors], a = [], o = [...i.sizingResult.warnings], s = uo({
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
  (Ft(t) !== t.profileHash || ki(n) !== n.id || Ki(i) !== i.id || R(s) !== R(i.sizingResult)) && F(
    r,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), i.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() && F(
    r,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (n.snapshotSchemaVersion !== Fa || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || i.setupFamily !== t.setupFamily || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash || i.strategyProfileId !== t.id || i.strategyProfileVersion !== t.version || i.strategyProfileHash !== t.profileHash || R(i.executionAssumptions) !== R(t.executionAssumptions)) && F(
    r,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(i.entryPlan.orderPlanType) || F(
    a,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${i.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(i.stopPlan.derivationType) || F(
    a,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${i.stopPlan.derivationType} is not permitted`
  );
  for (const v of i.targetPlans)
    t.targetPolicy.permittedDerivations.includes(v.derivationType) || F(
      a,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  i.targetPlans.length > t.targetPolicy.maximumTargets && F(
    a,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = i.targetPlans.reduce(
    (v, p) => v + p.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && F(
    r,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), vu(n, i, r), yu(i, r), du(n, t, a), mu(n, t, a), t.stopPolicy.requireOutsideEpisodeHigh && ((d = n.candidateEpisode) == null ? void 0 : d.episodeHigh) != null && i.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && F(
    a,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), i.sizingResult.initialMargin != null && i.sizingResult.initialMargin > i.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && F(
    a,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && i.sizingResult.grossNotional != null && i.sizingResult.grossNotional > t.riskPolicy.maximumNotional && F(
    a,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && i.sizingResult.weightedProjectedR != null && i.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && F(
    a,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${i.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), i.sizingResult.projectedLossAtStop != null && i.sizingResult.projectedLossAtStop > i.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && F(
    a,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = a.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), u = ((m = i.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  i.status === "finalized" && a.length > 0 && !l && !u && F(
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
function Hn(e) {
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
    schemaVersion: su,
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
  }, n = e.id ?? `decision:${w(t).slice(8)}`;
  return y({ ...t, id: n });
}
function uu(e, t, n, i) {
  (!e.length || e.some((a) => a.targetPrice >= t)) && F(i, "NO_VALID_TARGET", "Every short target must be below entry");
  const r = e.reduce((a, o) => a + o.positionFraction, 0);
  (e.some(
    (a) => !Number.isFinite(a.positionFraction) || a.positionFraction <= 0
  ) || Math.abs(r - 1) > n) && F(
    i,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function fu(e, t, n, i, r, a) {
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
function du(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    F(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (F(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && F(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && F(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const r = e.lifecycleEvidence.some(
    (a) => a.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !r && F(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && F(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function mu(e, t, n) {
  var c;
  const i = t.entryPolicy.requiredDataQuality, r = i.candidateMetricsRequired && e.candidateMetrics == null, a = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, o = i.minimumHistoryCoverageRatio != null && (a == null || a < i.minimumHistoryCoverageRatio), s = e.dataQualityNotes.some(
    (l) => i.rejectedNoteSeverities.includes(l.severity)
  );
  (r || o || s) && F(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function vu(e, t, n) {
  const i = new Map(
    Ha(e).map((a) => [a.id, a])
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
      F(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    a.reference.knownAt > e.effectiveAsOf && F(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${a.id} was not known at the decision cutoff`
    );
    const o = i.get(a.id);
    o ? R(o) !== R(a.reference) && F(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${a.id} differs from the frozen snapshot object`
    ) : F(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${a.id} is absent from the decision snapshot`
    );
  }
}
function yu(e, t) {
  const n = e.venueRules.priceTick, i = e.entryPlan.associatedReferenceLevel;
  i && Math.abs(e.entryPlan.intendedPrice - i.price) > n + 1e-12 && F(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const r = e.stopPlan.referenceLevel;
  if (r && e.stopPlan.derivationType !== "manual") {
    const a = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? r.rangeHigh ?? r.price : r.price, { basisPoints: o, atrFraction: s, atrValue: c } = e.stopPlan.buffer;
    let l = a;
    o != null && s != null ? F(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : o != null ? l = a * (1 + o / 1e4) : s != null && (ve(c ?? 0) ? l = a + s * (c ?? 0) : F(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > n + 1e-12 && F(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const a of e.targetPlans) {
    const o = a.referenceLevel;
    if (!o || a.derivationType === "manual" || a.derivationType === "fixedRMultiple")
      continue;
    (a.derivationType === "supportZone" ? a.targetPrice >= (o.rangeLow ?? o.price) - n && a.targetPrice <= (o.rangeHigh ?? o.price) + n : Math.abs(a.targetPrice - o.price) <= n + 1e-12) || F(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${a.id} does not match its frozen reference`
    );
  }
}
function hu(e, t, n) {
  return e.mode === "manual" ? ve(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, pu(t, n));
}
function Ki(e) {
  const {
    id: t,
    complianceResult: n,
    ...i
  } = e;
  return `trade-plan:${w(i).slice(8)}`;
}
function Dr(e, t) {
  if (!ve(e) || !ve(t)) return 0;
  const n = fo(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function pu(e, t) {
  if (!ve(e) || !ve(t)) return e;
  const n = fo(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function fo(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function Zt(e, t) {
  if (!Number.isFinite(e) || !ve(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Jt(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function ve(e) {
  return Number.isFinite(e) && e > 0;
}
function Ve(e, t) {
  return { code: e, message: t };
}
function F(e, t, n) {
  e.some((i) => i.code === t) || e.push(Ve(t, n));
}
const Ht = "execution-engine.1", mo = "execution-profile.1", vo = "execution-session.1", gu = "execution-order.1", Au = "execution-fill.1", yo = "execution-event.1", Eu = "execution-result.1", bu = "execution-data-bundle.1", Xi = "execution-candle.1", ho = "execution-trade.1", po = "execution-quote.1", wu = "execution-path-resolution.1", Zi = "venue-execution-rules.1", Tu = "venue-fee-schedule.1", go = "funding-observation.1", Su = "position-ledger.1";
var le;
class Ru {
  constructor(t) {
    ne(this, le);
    we(this, "fundingDataAvailable");
    we(this, "tradeDataCompleteness");
    we(this, "quoteDataCompleteness");
    this.fundingDataAvailable = t.fundingDataAvailable ?? t.funding !== void 0, this.tradeDataCompleteness = t.tradeDataCompleteness ?? (t.trades ? "partial" : "unavailable"), this.quoteDataCompleteness = t.quoteDataCompleteness ?? (t.quotes ? "partial" : "unavailable"), se(this, le, y({
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
    for (const i of S(this, le).candles.filter((r) => xe(r, t))) {
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
    return y(S(this, le).candles.filter(
      (n) => xe(n, t) && n.timeframe === t.timeframe && n.openTime >= t.from && n.openTime <= t.to
    ).sort(xu));
  }
  async loadTrades(t) {
    return y((S(this, le).trades ?? []).filter(
      (n) => xe(n, t) && pt(n.eventTime, t)
    ).sort(en));
  }
  async loadQuotes(t) {
    return y((S(this, le).quotes ?? []).filter(
      (n) => xe(n, t) && pt(n.eventTime, t)
    ).sort(en));
  }
  async loadMarkPrices(t) {
    return y((S(this, le).markPrices ?? []).filter(
      (n) => xe(n, t) && pt(n.eventTime, t)
    ).sort(en));
  }
  async loadIndexPrices(t) {
    return y((S(this, le).indexPrices ?? []).filter(
      (n) => xe(n, t) && pt(n.eventTime, t)
    ).sort(en));
  }
  async loadFundingObservations(t) {
    return y((S(this, le).funding ?? []).filter(
      (n) => xe(n, t) && pt(n.fundingTime, t)
    ).sort((n, i) => n.fundingTime - i.fundingTime || n.id.localeCompare(i.id)));
  }
  async loadVenueRuleEvidence(t) {
    return y((S(this, le).venueRuleEvidence ?? []).filter(
      (n) => xe(n, t)
    ));
  }
}
le = new WeakMap();
function Ao(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function Cu(e) {
  if (e.schemaVersion !== mo || e.executionEngineVersion !== Ht) throw new Error("Unsupported execution profile schema or engine version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Execution profile id and version are required");
  if (e.ambiguityPolicy !== "StrictAmbiguity")
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  Dn(e.orderActivationPolicy.delaySeconds, "activation delay"), Ou(e.maximumExecutionHorizon, "execution horizon"), Dn(
    e.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks"
  ), Dn(
    e.targetFillPolicy.penetrationTicks,
    "target penetration ticks"
  );
  for (const i of [
    e.slippageModel.marketEntryBps,
    e.slippageModel.stopExitBps,
    e.slippageModel.marketExitBps
  ]) if (!Number.isFinite(i) || i < 0) throw new RangeError("Slippage bps must be non-negative");
  const t = [...new Set(e.pathResolutionPolicy.candleTimeframesFinestFirst)];
  if (t.forEach(k), !t.length) throw new RangeError("Execution profile requires candle resolution timeframes");
  const n = y({
    ...e,
    pathResolutionPolicy: { candleTimeframesFinestFirst: t }
  });
  return y({ ...n, canonicalConfigHash: Ao(n) });
}
function Om(e) {
  return Cu({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: mo,
    executionEngineVersion: Ht,
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
function Eo(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function km(e) {
  if (e.schemaVersion !== Tu)
    throw new Error("Unsupported venue fee schedule schema");
  if (So(e.effectiveFrom, e.effectiveUntil, "fee schedule"), !Number.isFinite(e.makerRate) || e.makerRate < 0 || !Number.isFinite(e.takerRate) || e.takerRate < 0) throw new RangeError("Fee rates must be non-negative finite values");
  if (!e.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return y({
    ...e,
    canonicalConfigHash: Eo(e)
  });
}
function Ji(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function Iu(e, t) {
  if (e.schemaVersion !== Zi)
    throw new Error("Unsupported venue execution rules schema");
  So(e.effectiveFrom, e.effectiveUntil, "venue rules");
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
    canonicalConfigHash: Ji({
      ...e,
      symbol: e.symbol.toUpperCase()
    })
  });
}
function Nm(e, t, n) {
  return Iu({
    id: `${e.venue}:${e.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: Zi,
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
    feeScheduleRef: Pu(t),
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
function er(e) {
  const t = k(e.timeframe);
  if (!Number.isInteger(e.openTime) || e.openTime < 0 || e.openTime % t !== 0)
    throw new RangeError("Execution candle openTime must align to its timeframe");
  for (const i of [e.o, e.h, e.l, e.c])
    if (!Number.isFinite(i) || i <= 0) throw new RangeError("Execution OHLC must be positive");
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Execution candle high/low do not contain open and close");
  const n = {
    schemaVersion: Xi,
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
    id: `execution-candle:${w(n).slice(8)}`
  });
}
function _m(e, t = e.source) {
  return er({
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
function bo(e) {
  Le(e.eventTime, "trade eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (Le(t, "trade knownAt"), t < e.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(e.price) || e.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(e.quantity) || e.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const n = {
    schemaVersion: ho,
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
    id: `execution-trade:${w(n).slice(8)}`
  });
}
function wo(e) {
  Le(e.eventTime, "quote eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (Le(t, "quote knownAt"), t < e.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (!Number.isFinite(e.bid) || !Number.isFinite(e.ask) || e.bid <= 0 || e.ask <= 0 || e.bid > e.ask) throw new RangeError("Quote requires positive bid <= ask");
  const n = {
    schemaVersion: po,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: t,
    bid: e.bid,
    ask: e.ask
  };
  return y({
    ...n,
    id: `execution-quote:${w(n).slice(8)}`
  });
}
function To(e) {
  Le(e.fundingTime, "fundingTime");
  const t = e.knownAt ?? e.fundingTime;
  if (Le(t, "funding knownAt"), t < e.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(e.rate)) throw new RangeError("Funding rate must be finite");
  if (e.markPrice != null && (!Number.isFinite(e.markPrice) || e.markPrice <= 0))
    throw new RangeError("Funding mark price must be positive");
  const n = {
    schemaVersion: go,
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
    id: `funding-observation:${w(n).slice(8)}`
  });
}
function Pu(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function xe(e, t) {
  return e.venue.toLowerCase() === t.venue.toLowerCase() && e.symbol.toUpperCase() === t.symbol.toUpperCase();
}
function pt(e, t) {
  return e >= t.from && e <= t.to;
}
function xu(e, t) {
  return e.openTime - t.openTime || e.knownAt - t.knownAt || e.id.localeCompare(t.id);
}
function en(e, t) {
  return e.eventTime - t.eventTime || e.id.localeCompare(t.id);
}
function So(e, t, n) {
  if (e != null && Le(e, `${n} effectiveFrom`), t != null && Le(t, `${n} effectiveUntil`), e != null && t != null && t <= e)
    throw new RangeError(`${n} effectiveUntil must follow effectiveFrom`);
}
function Dn(e, t) {
  if (!Number.isInteger(e) || e < 0) throw new RangeError(`${t} must be non-negative`);
}
function Ou(e, t) {
  if (!Number.isInteger(e) || e <= 0) throw new RangeError(`${t} must be positive`);
}
function Le(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
async function Mm(e) {
  ku(e);
  const t = e.replayFrame.effectiveAsOf, i = t + e.executionProfile.orderActivationPolicy.delaySeconds + e.executionProfile.maximumExecutionHorizon, r = Math.max(
    ...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(k)
  ), a = {
    venue: e.venueRules.venue,
    symbol: e.venueRules.symbol,
    from: t,
    to: i + (e.executionProfile.forceCloseAtHorizon ? r : 0)
  }, o = {};
  for (const E of e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const T = await e.historicalDataAdapter.loadCandles({ ...a, timeframe: E });
    Nu(T, a.venue, a.symbol, E), o[E] = T;
  }
  const s = await et(e.historicalDataAdapter.loadTrades, e.historicalDataAdapter, a), c = await et(e.historicalDataAdapter.loadQuotes, e.historicalDataAdapter, a), l = await et(e.historicalDataAdapter.loadMarkPrices, e.historicalDataAdapter, a), u = await et(e.historicalDataAdapter.loadIndexPrices, e.historicalDataAdapter, a), f = e.historicalDataAdapter.fundingDataAvailable ?? e.historicalDataAdapter.loadFundingObservations != null, d = await et(
    e.historicalDataAdapter.loadFundingObservations,
    e.historicalDataAdapter,
    a
  ), m = await et(
    e.historicalDataAdapter.loadVenueRuleEvidence,
    e.historicalDataAdapter,
    a
  );
  if (_u(s, c, l, u, d, a.venue, a.symbol), e.historicalDataAdapter.tradeDataCompleteness === "complete" && s.some((E) => E.knownAt !== E.eventTime)) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
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
    candlesByTimeframe: Object.fromEntries(Object.entries(o).map(([E, T]) => [
      E,
      T.filter((M) => M.knownAt <= t)
    ])),
    trades: s.filter((E) => E.knownAt <= t),
    quotes: c.filter((E) => E.knownAt <= t),
    markPrices: l.filter((E) => E.knownAt <= t),
    indexPrices: u.filter((E) => E.knownAt <= t)
  }, h = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...e.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : [],
    ...e.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : [],
    ...f ? [] : ["FUNDING_DATA_UNAVAILABLE"],
    ...e.venueRules.liquidationModel ? [] : ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"],
    ...s.length && e.historicalDataAdapter.tradeDataCompleteness !== "complete" ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"] : [],
    ...e.executionProfile.stopTriggerPolicy.source !== "last" && e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"] : []
  ], A = {
    schemaVersion: bu,
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
    causalPrefixFingerprint: await at(p),
    internalBundleFingerprint: await at(v),
    fundingDataFingerprint: f ? await at(d.filter((E) => E.knownAt <= t)) : null,
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
function ku(e) {
  const { replaySession: t, replayFrame: n, tradePlan: i, strategyProfile: r, executionProfile: a, venueRules: o, feeSchedule: s } = e;
  if (n.sessionId !== t.id || n.id !== t.currentFrameId)
    throw new Error("Execution frame does not match the replay session");
  if (t.state !== "TradePlanRecorded" && t.state !== "Revealed") throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (n.decisionSnapshot.id !== i.snapshotId || ki(n.decisionSnapshot) !== n.decisionSnapshot.id || i.id !== Ki(i) || i.schemaVersion !== lo || i.status !== "finalized" || i.side !== "short" || i.complianceResult.hardErrors.length > 0) throw new Error("Execution requires an intact finalized short TradePlan");
  if (!t.planningAttempts.some(
    (h) => h.accepted && h.frameId === n.id && h.tradePlan.id === i.id
  )) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (Ft(r) !== r.profileHash || i.strategyProfileId !== r.id || i.strategyProfileVersion !== r.version || i.strategyProfileHash !== r.profileHash || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (a.canonicalConfigHash !== Ao(a))
    throw new Error("Execution profile hash mismatch");
  if (o.canonicalConfigHash !== Ji(o))
    throw new Error("Venue execution rules hash mismatch");
  if (s.canonicalConfigHash !== Eo(s))
    throw new Error("Venue fee schedule hash mismatch");
  const l = n.effectiveAsOf;
  Br(s, l, "fee schedule"), Br(o, l, "venue execution rules");
  const u = l + a.orderActivationPolicy.delaySeconds + a.maximumExecutionHorizon + (a.forceCloseAtHorizon ? Math.max(...a.pathResolutionPolicy.candleTimeframesFinestFirst.map(k)) : 0);
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
  if (d == null || d <= 0 || !Mu(d, o.quantityStep))
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
function Br(e, t, n) {
  if (e.effectiveFrom != null && t < e.effectiveFrom || e.effectiveUntil != null && t >= e.effectiveUntil) throw new Error(`${n} is not effective at the decision time`);
}
async function et(e, t, n) {
  return e ? e.call(t, n) : [];
}
function Nu(e, t, n, i) {
  const r = /* @__PURE__ */ new Set();
  let a = -1;
  for (const o of e) {
    if (o.schemaVersion !== Xi || o.venue.toLowerCase() !== t.toLowerCase() || o.symbol !== n.toUpperCase() || o.timeframe !== i || o.id !== er(o).id || o.openTime <= a || r.has(o.id)) throw new Error(`Invalid or duplicate execution candle ${o.id}`);
    a = o.openTime, r.add(o.id);
  }
}
function _u(e, t, n, i, r, a, o) {
  const s = [...e, ...t, ...n, ...i], c = /* @__PURE__ */ new Set();
  for (const l of s) {
    if (l.venue.toLowerCase() !== a.toLowerCase() || l.symbol.toUpperCase() !== o.toUpperCase() || l.knownAt < l.eventTime || c.has(l.id)) throw new Error(`Invalid or duplicate execution observation ${l.id}`);
    const u = "price" in l ? bo(l).id : wo(l).id;
    if (l.id !== u) throw new Error(`Execution observation identity mismatch ${l.id}`);
    c.add(l.id);
  }
  for (const l of r) {
    if (l.venue.toLowerCase() !== a.toLowerCase() || l.symbol.toUpperCase() !== o.toUpperCase() || l.id !== To(l).id || c.has(l.id)) throw new Error(`Invalid or duplicate funding observation ${l.id}`);
    c.add(l.id);
  }
}
function Mu(e, t) {
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
const Vr = "execution-json-data.1";
function Fu(e) {
  const t = Ge(e, "Execution JSON data");
  if ($n(t, [
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
  ], "Execution JSON data"), t.schemaVersion !== Vr)
    throw new Error("Unsupported execution JSON data schema");
  const n = Vn(t.venue, "venue"), i = Vn(t.symbol, "symbol").toUpperCase(), r = Lu(t.candles, n, i), a = Hu(t.trades, n, i), o = Bn(t.quotes, n, i, "quotes"), s = Bn(t.markPrices, n, i, "markPrices"), c = Bn(t.indexPrices, n, i, "indexPrices"), l = $r(t.tradeDataCompleteness, "tradeDataCompleteness"), u = $r(t.quoteDataCompleteness, "quoteDataCompleteness");
  if (l === "unavailable" && a.length)
    throw new Error("Unavailable trade data cannot contain observations");
  if (u === "unavailable" && o.length)
    throw new Error("Unavailable quote data cannot contain observations");
  const f = Ge(t.funding, "funding");
  let d;
  if (f.availability === "available")
    $n(f, ["availability", "observations"], "available funding"), d = {
      availability: "available",
      observations: Du(f.observations, n, i)
    };
  else if (f.availability === "unavailable")
    $n(f, ["availability", "reason"], "unavailable funding"), d = {
      availability: "unavailable",
      reason: Vn(f.reason, "funding reason")
    };
  else
    throw new Error("Funding availability must be available or unavailable");
  const m = Bt(t.venueRuleEvidence, "venueRuleEvidence").map((v, p) => Bu(v, n, i, p));
  return Vu([
    ...r,
    ...a,
    ...o,
    ...s,
    ...c,
    ...d.availability === "available" ? d.observations : [],
    ...m
  ]), y({
    schemaVersion: Vr,
    venue: n,
    symbol: i,
    candles: $u(r),
    trades: tn(a),
    tradeDataCompleteness: l,
    quotes: tn(o),
    quoteDataCompleteness: u,
    markPrices: tn(s),
    indexPrices: tn(c),
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
var ue;
class Fm {
  constructor(t) {
    we(this, "fundingDataAvailable");
    we(this, "tradeDataCompleteness");
    we(this, "quoteDataCompleteness");
    ne(this, ue);
    const n = Fu(t);
    this.fundingDataAvailable = n.funding.availability === "available", this.tradeDataCompleteness = n.tradeDataCompleteness, this.quoteDataCompleteness = n.quoteDataCompleteness, se(this, ue, new Ru({
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
    return S(this, ue).getCoverage(t);
  }
  loadCandles(t) {
    return S(this, ue).loadCandles(t);
  }
  loadTrades(t) {
    return S(this, ue).loadTrades(t);
  }
  loadQuotes(t) {
    return S(this, ue).loadQuotes(t);
  }
  loadMarkPrices(t) {
    return S(this, ue).loadMarkPrices(t);
  }
  loadIndexPrices(t) {
    return S(this, ue).loadIndexPrices(t);
  }
  loadFundingObservations(t) {
    return S(this, ue).loadFundingObservations(t);
  }
  loadVenueRuleEvidence(t) {
    return S(this, ue).loadVenueRuleEvidence(t);
  }
}
ue = new WeakMap();
function Lu(e, t, n) {
  const i = /* @__PURE__ */ new Set();
  return Bt(e, "candles").map((r, a) => {
    const o = Ge(r, `candles[${a}]`);
    if (o.schemaVersion !== Xi) throw new Error(`Invalid candle schema at ${a}`);
    const s = er(o);
    Cn(o, s, `candle ${a}`), Dt(s, t, n, `candle ${a}`);
    const c = `${s.timeframe}:${s.openTime}`;
    if (i.has(c)) throw new Error(`Duplicate candle interval ${c}`);
    return i.add(c), s;
  });
}
function Hu(e, t, n) {
  return Bt(e, "trades").map((i, r) => {
    const a = Ge(i, `trades[${r}]`);
    if (a.schemaVersion !== ho) throw new Error(`Invalid trade schema at ${r}`);
    const o = bo(a);
    return Cn(a, o, `trade ${r}`), Dt(o, t, n, `trade ${r}`), o;
  });
}
function Bn(e, t, n, i) {
  return Bt(e, i).map((r, a) => {
    const o = Ge(r, `${i}[${a}]`);
    if (o.schemaVersion !== po) throw new Error(`Invalid quote schema at ${i}[${a}]`);
    const s = wo(o);
    return Cn(o, s, `${i}[${a}]`), Dt(s, t, n, `${i}[${a}]`), s;
  });
}
function Du(e, t, n) {
  return Bt(e, "funding observations").map((i, r) => {
    const a = Ge(i, `funding[${r}]`);
    if (a.schemaVersion !== go) throw new Error(`Invalid funding schema at ${r}`);
    const o = To(a);
    return Cn(a, o, `funding ${r}`), Dt(o, t, n, `funding ${r}`), o;
  });
}
function Bu(e, t, n, i) {
  const r = Ge(e, `venueRuleEvidence[${i}]`);
  if (r.schemaVersion !== Zi || r.canonicalConfigHash !== Ji(r)) throw new Error(`Invalid venue-rule evidence at ${i}`);
  return Dt(r, t, n, `venueRuleEvidence[${i}]`), y(r);
}
function Cn(e, t, n) {
  if (R(e) !== R(t))
    throw new Error(`Non-canonical or unknown fields in ${n}`);
}
function Dt(e, t, n, i) {
  if (e.venue.toLowerCase() !== t.toLowerCase() || e.symbol.toUpperCase() !== n)
    throw new Error(`${i} instrument identity mismatch`);
}
function Vu(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e) {
    if (t.has(n.id)) throw new Error(`Duplicate execution observation id ${n.id}`);
    t.add(n.id);
  }
}
function $r(e, t) {
  if (e !== "complete" && e !== "partial" && e !== "unavailable")
    throw new Error(`${t} must be complete, partial, or unavailable`);
  return e;
}
function $u(e) {
  return [...e].sort(
    (t, n) => t.openTime - n.openTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function tn(e) {
  return [...e].sort(
    (t, n) => t.eventTime - n.eventTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function Ge(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new TypeError(`${t} must be an object`);
  return e;
}
function Bt(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function Vn(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} must be a non-empty string`);
  return e;
}
function $n(e, t, n) {
  const i = [...t].sort(), r = Object.keys(e).sort();
  if (R(r) !== R(i))
    throw new Error(`${n} has missing or unknown fields`);
}
const Uu = "execution-reveal-envelope.1";
function Lm(e) {
  const { replaySession: t, replayOutcomeEnvelope: n, executionSession: i } = e, { id: r, ...a } = n;
  if (n.schemaVersion !== qi || n.id !== `replay-outcome:${w(a).slice(8)}` || t.state !== "Revealed" || t.revealedOutcomeEnvelopeId == null || t.revealedOutcomeEnvelopeId !== n.id || n.sessionId !== t.id) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (i.replaySessionId !== t.id || i.result == null || !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(i.state)) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (i.result.executionSessionId !== i.id)
    throw new Error("Execution result identity mismatch");
  if (!Number.isFinite(e.revealedAt) || e.revealedAt < 0)
    throw new RangeError("Execution reveal time must be a valid timestamp");
  const o = {
    schemaVersion: Uu,
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
    id: `execution-reveal:${w(o).slice(8)}`
  });
}
const Te = /* @__PURE__ */ new Set([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed"
]);
function tr(e) {
  gf(e);
  const t = e.tradePlan, n = e.replayFrame, i = n.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, r = {
    schemaVersion: vo,
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
    executionEngineVersion: Ht,
    executionProfileRef: on(e.executionProfile),
    venueRulesRef: on(e.venueRules),
    feeScheduleRef: on(e.feeSchedule),
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: e.dataBundle.fundingDataFingerprint,
    decisionTime: n.effectiveAsOf,
    orderActivationTime: i,
    executionHorizonTime: i + e.executionProfile.maximumExecutionHorizon
  }, a = {
    ...r,
    id: `execution-session:${w(r).slice(8)}`
  }, o = {
    ...a,
    revision: 0,
    currentAsOf: a.decisionTime,
    state: "Created",
    stateSince: a.decisionTime,
    orders: [],
    fills: [],
    positionLedger: df(e),
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [...e.dataBundle.dataQualityNotes],
    errors: []
  };
  return q(o, {
    type: "ExecutionCreated",
    eventTime: a.decisionTime,
    processingAsOf: a.decisionTime,
    explanation: "Execution inputs validated and bound to the finalized TradePlan"
  }), cr(o);
}
function qu(e, t, n) {
  if (lr(e), Af(e, t), Tf(n, "targetAsOf"), n < e.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (Te.has(e.state)) return y(e);
  const i = Qu(t, n), r = e.executionEvents.filter((s) => s.type !== "PathResolved"), a = i.executionEvents.filter((s) => s.type !== "PathResolved");
  if (a.length < r.length)
    throw new Error("Execution target precedes already processed causal events");
  const o = a.slice(0, r.length);
  if (R(o) !== R(r))
    throw new Error("Execution history changed under the same session identity");
  return i;
}
function zu(e, t) {
  const n = t.executionProfile.forceCloseAtHorizon ? 2 * Math.max(...t.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(k)) : 0;
  return qu(e, t, e.executionHorizonTime + n);
}
function Hm(e) {
  return zu(tr(e), e);
}
function Qu(e, t) {
  const n = tr(e), i = Ef(n);
  if (t < i.orderActivationTime) return n;
  ju(i, e);
  const r = e.executionProfile.forceCloseAtHorizon ? t : Math.min(t, i.executionHorizonTime), a = Wu(e, r), o = e.dataBundle.funding.filter((l) => l.knownAt <= r);
  let s = 0;
  for (const l of a) {
    if (Te.has(i.state)) break;
    for (; s < o.length && o[s].fundingTime < l.eventTime && (Un(i, e, o[s++], null), !Te.has(i.state)); )
      ;
    if (Te.has(i.state) || af(i, e, l.eventTime, t)) break;
    if (e.executionProfile.forceCloseAtHorizon && l.eventTime >= i.executionHorizonTime && (i.state === "Open" || i.state === "PartiallyClosed")) {
      Ro(i, e, l);
      break;
    }
    Ku(i, e, l);
    const u = i.fills.length;
    Xu(i, e, l);
    const f = i.fills.length > u;
    for (; s < o.length && o[s].fundingTime >= l.eventTime && o[s].fundingTime < l.intervalEnd && (Un(i, e, o[s++], f ? l : null), !Te.has(i.state)); )
      ;
    i.currentAsOf = Math.max(i.currentAsOf, l.processingAsOf);
  }
  for (; !Te.has(i.state) && s < o.length && o[s].fundingTime <= Math.min(t, i.executionHorizonTime); ) Un(i, e, o[s++], null);
  Te.has(i.state) || rf(i, e, a, t);
  const c = a.at(-1);
  return !Te.has(i.state) && c && q(i, {
    type: "PathResolved",
    eventTime: c.intervalEnd,
    processingAsOf: c.processingAsOf,
    sourceObservationIds: [c.id],
    explanation: `Execution processed through ${c.resolution} ${c.exact ? "ordered" : "OHLC"} data`
  }), cr(i);
}
function ju(e, t) {
  const n = t.tradePlan, i = n.entryPlan.orderPlanType === "marketNextAvailable" ? "entryMarket" : n.entryPlan.orderPlanType === "limit" ? "entryLimit" : "entryStopMarket", r = dn(e.id, {
    kind: i,
    side: "sell",
    quantity: n.sizingResult.roundedQuantity,
    remainingQuantity: n.sizingResult.roundedQuantity,
    limitPrice: i === "entryLimit" ? Ot(n.entryPlan.intendedPrice, t.venueRules.priceTick, "up") : null,
    triggerPrice: i === "entryStopMarket" ? Ot(n.entryPlan.intendedPrice, t.venueRules.priceTick, "down") : null,
    activationTime: e.orderActivationTime,
    status: "active",
    reduceOnly: !1,
    parentTargetId: null,
    liquidityAssumption: i === "entryLimit" ? "assumedMaker" : "taker"
  });
  e.orders.push(r), q(e, {
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
function Wu(e, t) {
  const n = e.replayFrame.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, i = n + e.executionProfile.maximumExecutionHorizon, r = e.executionProfile.forceCloseAtHorizon ? i + Math.max(...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(k)) : i, a = e.dataBundle.trades.filter(
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
    const f = Gu(e, u, t) ?? [u];
    for (const d of f)
      d.closeTime <= n || d.openTime > r || c.push(Yu(d));
  }
  return [...new Map(c.map((u) => [u.id, u])).values()].sort(
    (u, f) => u.eventTime - f.eventTime || u.processingAsOf - f.processingAsOf || u.id.localeCompare(f.id)
  );
}
function Gu(e, t, n) {
  const i = k(t.timeframe), r = [...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst].filter((a) => k(a) < i).sort((a, o) => k(a) - k(o));
  for (const a of r) {
    const o = k(a), s = i / o;
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
function Yu(e) {
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
function Ku(e, t, n) {
  const i = {
    schemaVersion: wu,
    intervalStart: n.eventTime,
    intervalEnd: n.intervalEnd,
    requestedResolution: t.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: n.resolution,
    dataSource: n.exact ? "trades" : "candles",
    dataFingerprint: w([n.id]),
    exactOrApproximate: n.exact ? "exact" : "approximate",
    sourceObservationIds: [n.id],
    ambiguities: []
  }, r = {
    ...i,
    id: `execution-path:${w(i).slice(8)}`
  };
  e.pathResolutionRecords.push(r);
}
function Xu(e, t, n) {
  e.state === "PendingEntry" && Zu(e, t, n), (e.state === "Open" || e.state === "PartiallyClosed") && (uf(e, n), ef(e, t, n));
}
function Zu(e, t, n) {
  const i = ar(e);
  if (!i || n.eventTime < i.activationTime) return;
  let r = null, a = i.liquidityAssumption, o = 0;
  if (i.kind === "entryMarket")
    r = n.open, a = "taker", o = t.executionProfile.slippageModel.marketEntryBps;
  else if (i.kind === "entryLimit") {
    const u = i.limitPrice;
    n.open >= u ? (r = n.open, a = "assumedTaker") : vf(n, u, t.executionProfile.restingLimitFillPolicy, t.venueRules.priceTick) && (r = u, a = "assumedMaker");
  } else {
    const u = i.triggerPrice;
    n.open <= u ? r = n.open : n.low <= u && (r = u), r != null && (a = "taker", o = t.executionProfile.slippageModel.marketEntryBps);
  }
  if (r == null) return;
  const s = hf(t, n);
  if (!n.exact && i.kind !== "entryMarket" && s.length) {
    fn(e, t, n, [i.id, ...s], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const c = In(e, t, i, n, r, a, o, "entry"), l = c.price * c.quantity;
  if (c.quantity < t.venueRules.minimumQuantity || l < t.venueRules.minimumNotional || t.venueRules.maximumQuantity != null && c.quantity > t.venueRules.maximumQuantity || t.venueRules.maximumNotional != null && l > t.venueRules.maximumNotional) {
    xt(e, t, n.eventTime, n.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(c), sf(e, t, c), q(e, {
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
  }), Ju(e, t, c);
}
function Ju(e, t, n) {
  const i = dn(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: n.quantity,
    remainingQuantity: n.quantity,
    limitPrice: null,
    triggerPrice: Ot(t.tradePlan.stopPlan.stopPrice, t.venueRules.priceTick, "up"),
    activationTime: n.eventTime,
    status: "active",
    reduceOnly: !0,
    parentTargetId: null,
    liquidityAssumption: "taker"
  });
  e.orders.push(i), q(e, {
    type: "ProtectiveStopActivated",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: i.quantity,
    referencePrice: i.triggerPrice,
    explanation: "Static reduce-only protective buy stop activated after entry"
  });
  const r = mf(n.quantity, t.tradePlan.targetPlans.map((a) => ({
    id: a.id,
    fraction: a.positionFraction
  })), t.venueRules.quantityStep);
  for (const a of [...t.tradePlan.targetPlans].sort((o, s) => s.targetPrice - o.targetPrice || o.id.localeCompare(s.id))) {
    const o = r[a.id] ?? 0;
    if (o <= 0) continue;
    const s = dn(e.id, {
      kind: "target",
      side: "buy",
      quantity: o,
      remainingQuantity: o,
      limitPrice: Ot(a.targetPrice, t.venueRules.priceTick, "down"),
      triggerPrice: null,
      activationTime: n.eventTime,
      status: "active",
      reduceOnly: !0,
      parentTargetId: a.id,
      liquidityAssumption: "assumedMaker"
    });
    e.orders.push(s), e.positionLedger.openTargetQuantities[a.id] = o, q(e, {
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
function ef(e, t, n) {
  const i = Oo(e), r = sr(e), a = i ? Co(t, n, i.triggerPrice) : null;
  if (a != null && a.unavailable) {
    xt(
      e,
      t,
      n.eventTime,
      n.processingAsOf,
      `Required ${t.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`
    );
    return;
  }
  const o = (a == null ? void 0 : a.touched) ?? !1, s = r.filter(
    (l) => yf(n, l.limitPrice, t.executionProfile.targetFillPolicy, t.venueRules.priceTick)
  );
  if (!n.exact && o && s.length) {
    fn(
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
    q(e, {
      type: "BankruptcyBoundCrossed",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      quantity: e.positionLedger.remainingQuantity,
      referencePrice: c,
      sourceObservationIds: [n.id],
      explanation: "Simple isolated-margin bankruptcy bound crossed without a verified liquidation model",
      dataQualityNotes: ["BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL"]
    }), fn(e, t, n, i ? [i.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (o) {
    nf(e, t, n, i, (a == null ? void 0 : a.referencePrice) ?? i.triggerPrice);
    return;
  }
  for (const l of s.sort((u, f) => f.limitPrice - u.limitPrice || u.id.localeCompare(f.id))) {
    if (e.positionLedger.remainingQuantity <= 0) break;
    tf(e, t, n, l);
  }
}
function tf(e, t, n, i) {
  const r = Math.min(i.remainingQuantity, e.positionLedger.remainingQuantity), a = In(e, t, i, n, i.limitPrice, "assumedMaker", 0, "target", r);
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(a), ir(e, a), delete e.positionLedger.openTargetQuantities[i.parentTargetId], q(e, {
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
  const o = Oo(e);
  if (e.positionLedger.remainingQuantity > 0 && o) {
    o.quantity = e.positionLedger.remainingQuantity, o.remainingQuantity = e.positionLedger.remainingQuantity, e.positionLedger.remainingProtectiveStopQuantity = e.positionLedger.remainingQuantity, q(e, {
      type: "ProtectiveStopQuantityAdjusted",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      orderIds: [o.id],
      quantity: o.quantity,
      sourceObservationIds: [n.id],
      explanation: "Protective stop reduced to the exact remaining position"
    }), q(e, {
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
  o && rr(e, o, n, "All planned target quantity filled"), nr(e, t, n, "AllTargets", a);
}
function nf(e, t, n, i, r) {
  const a = r;
  q(e, {
    type: "ProtectiveStopTriggered",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: a,
    sourceObservationIds: [n.id],
    explanation: n.open >= i.triggerPrice ? "Protective stop triggered by an adverse gap" : "Protective stop trigger crossed"
  });
  const o = In(
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
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(o), ir(e, o), e.positionLedger.remainingProtectiveStopQuantity = 0, q(e, {
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
  for (const c of sr(e)) rr(e, c, n, "Protective stop closed the position");
  const s = e.fills.some((c) => {
    var l;
    return ((l = je(e, c.orderId)) == null ? void 0 : l.kind) === "target";
  });
  nr(e, t, n, s ? "StopAfterPartialTargets" : "Stop", o);
}
function nr(e, t, n, i, r) {
  cf(e), e.result = ct(e, t, "Closed", i, null), q(e, {
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
function Un(e, t, n, i) {
  if (e.state !== "Open" && e.state !== "PartiallyClosed" || e.fundingRecords.some((m) => m.observationId === n.id)) return;
  if (i && t.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    fn(
      e,
      t,
      i,
      ko(e).map((m) => m.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN"
    );
    return;
  }
  const r = n.markPrice;
  if (r == null) {
    e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE") || e.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), t.executionProfile.fundingPolicy.absence === "requireComplete" && xt(e, t, n.fundingTime, n.knownAt, "Funding reference price is unavailable");
    return;
  }
  const a = t.venueRules.fundingConvention.sameTimestampOrdering, o = e.fills.filter((m) => m.eventTime === n.fundingTime), s = o.find((m) => m.side === "sell"), c = o.filter((m) => m.side === "buy"), l = a === "fundingBeforePosition" ? He(
    e.positionLedger.remainingQuantity + c.reduce((m, v) => m + v.quantity, 0) - ((s == null ? void 0 : s.quantity) ?? 0),
    12
  ) : e.positionLedger.remainingQuantity;
  if (l <= 0) return;
  const u = U(l * r * n.rate), f = {
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
    id: `execution-funding:${w(f).slice(8)}`
  };
  e.fundingRecords.push(d), u >= 0 ? e.positionLedger.fundingReceived = U(e.positionLedger.fundingReceived + u) : e.positionLedger.fundingPaid = U(e.positionLedger.fundingPaid + -u), e.positionLedger.netFunding = U(
    e.positionLedger.fundingReceived - e.positionLedger.fundingPaid
  ), Vt(e), q(e, {
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
function rf(e, t, n, i) {
  const r = xo(e, t);
  if ((e.state === "Created" || e.state === "PendingEntry") && i >= r) {
    if (!Ur(n, r, t)) {
      xt(e, t, r, i, "Price data does not cover the entry expiry window");
      return;
    }
    const o = ar(e);
    o && (o.status = "expired", q(e, {
      type: "EntryOrderExpired",
      eventTime: r,
      processingAsOf: r,
      stateAfter: "EntryExpired",
      orderIds: [o.id],
      quantity: o.quantity,
      explanation: "Entry remained unfilled through its deterministic expiry"
    }), e.result = ct(e, t, "EntryExpired", null, null), oi(e));
    return;
  }
  if (i < e.executionHorizonTime || e.state !== "Open" && e.state !== "PartiallyClosed") return;
  const a = [...n].reverse().find((o) => o.eventTime <= e.executionHorizonTime);
  if (!a || !Ur(n, e.executionHorizonTime, t)) {
    xt(e, t, e.executionHorizonTime, i, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (t.executionProfile.forceCloseAtHorizon) {
    const o = n.find((s) => s.eventTime >= e.executionHorizonTime);
    if (!o) return;
    Ro(e, t, o);
    return;
  }
  lf(e, a.close), q(e, {
    type: "ExecutionHorizonReached",
    eventTime: e.executionHorizonTime,
    processingAsOf: Math.max(e.executionHorizonTime, a.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: a.close,
    sourceObservationIds: [a.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon"
  }), e.result = ct(e, t, "OpenAtHorizon", null, null), oi(e);
}
function Ur(e, t, n) {
  const i = [...e].reverse().find((a) => a.eventTime <= t);
  if (!i) return !1;
  const r = k(n.strategyProfile.timeframeRoles.executionTimeframe);
  return t - i.intervalEnd <= r;
}
function Ro(e, t, n) {
  const i = dn(e.id, {
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
  const r = In(
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
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(r), ir(e, r);
  for (const a of ko(e).filter((o) => o.id !== i.id))
    rr(e, a, n, "Forced horizon close cancelled protection");
  q(e, {
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
  }), nr(e, t, n, "ForcedHorizonClose", r);
}
function af(e, t, n, i) {
  if (e.state !== "PendingEntry") return !1;
  const r = xo(e, t);
  if (n < r || i < r) return !1;
  const a = ar(e);
  return a.status = "expired", q(e, {
    type: "EntryOrderExpired",
    eventTime: r,
    processingAsOf: r,
    stateAfter: "EntryExpired",
    orderIds: [a.id],
    quantity: a.quantity,
    explanation: "Entry expired before the next eligible observation"
  }), e.result = ct(e, t, "EntryExpired", null, null), oi(e), !0;
}
function fn(e, t, n, i, r) {
  const a = of(e, t, n, i), o = a.map((l) => l.estimatedNetPnl).filter((l) => l != null), s = {
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
  c && !c.ambiguities.includes(r) && c.ambiguities.push(r), e.result = ct(e, t, "Ambiguous", null, s), q(e, {
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
function of(e, t, n, i) {
  const r = or(e), a = (r == null ? void 0 : r.quantity) ?? t.tradePlan.sizingResult.roundedQuantity, o = r ? e.positionLedger.remainingQuantity : a, s = (r == null ? void 0 : r.price) ?? t.tradePlan.entryPlan.intendedPrice, c = Io(
    Math.max(n.open, t.tradePlan.stopPlan.stopPrice),
    t.executionProfile.slippageModel.stopExitBps,
    "buy",
    t.venueRules.priceTick
  ).price, l = e.positionLedger.realizedGrossPnl, u = e.positionLedger.totalFees || U(a * s * t.feeSchedule.takerRate), f = U(
    l + o * (s - c) - u - o * c * t.feeSchedule.takerRate + e.positionLedger.netFunding
  ), d = [{
    id: `execution-branch:${w([e.id, n.id, "stop-first"]).slice(8)}`,
    label: "stop-first",
    orderedOrderIds: i.filter((p) => {
      var h;
      return p.includes("stop") || ((h = je(e, p)) == null ? void 0 : h.kind) === "protectiveStop";
    }),
    estimatedNetPnl: f
  }], m = sr(e).filter((p) => i.includes(p.id)).sort((p, h) => h.limitPrice - p.limitPrice || p.id.localeCompare(h.id)), v = m.length ? m.map((p) => ({ quantity: p.remainingQuantity, price: p.limitPrice, id: p.id })) : [...t.tradePlan.targetPlans].filter((p) => i.includes(p.id)).sort((p, h) => h.targetPrice - p.targetPrice || p.id.localeCompare(h.id)).map((p) => ({
    quantity: Po(a * p.positionFraction, t.venueRules.quantityStep),
    price: p.targetPrice,
    id: p.id
  }));
  if (v.length) {
    let p = o, h = l, A = u;
    const E = [];
    for (const I of v) {
      const b = Math.min(p, I.quantity);
      b <= 0 || (h += b * (s - I.price), A += b * I.price * t.feeSchedule.makerRate, p = He(p - b, 12), E.push(I.id));
    }
    i.some((I) => {
      var b;
      return I.includes("stop") || ((b = je(e, I)) == null ? void 0 : b.kind) === "protectiveStop";
    }) && p > 0 && (h += p * (s - c), A += p * c * t.feeSchedule.takerRate, E.push(...i.filter((I) => {
      var b;
      return I.includes("stop") || ((b = je(e, I)) == null ? void 0 : b.kind) === "protectiveStop";
    })));
    const M = U(h - A + e.positionLedger.netFunding);
    d.push({
      id: `execution-branch:${w([e.id, n.id, "target-first"]).slice(8)}`,
      label: "target-first",
      orderedOrderIds: E,
      estimatedNetPnl: M
    });
  }
  return d;
}
function xt(e, t, n, i, r) {
  e.errors.push(r), e.result = ct(e, t, "Failed", null, null), q(e, {
    type: "ExecutionFailed",
    eventTime: n,
    processingAsOf: i,
    stateAfter: "Failed",
    explanation: r
  });
}
function In(e, t, n, i, r, a, o, s, c = n.quantity) {
  const l = o > 0 ? Io(r, o, n.side, t.venueRules.priceTick) : { price: r, adjustment: 0 }, u = o > 0 ? {
    model: t.executionProfile.slippageModel.model,
    version: t.executionProfile.slippageModel.version,
    bps: o,
    referencePrice: r,
    signedPriceAdjustment: l.adjustment,
    finalFillPrice: l.price
  } : null, f = a === "maker" || a === "assumedMaker" ? t.feeSchedule.makerRate : t.feeSchedule.takerRate, d = {
    schemaVersion: Au,
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
    feeAmount: U(l.price * c * f),
    feeCurrency: t.tradePlan.accountState.quoteCurrency,
    feeScheduleRef: on(t.feeSchedule),
    sourceObservationIds: [i.id],
    dataQualityNotes: [
      ...i.exact ? [] : [`${s.toUpperCase()}_CANDLE_APPROXIMATION`],
      ...a.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []
    ]
  };
  return {
    ...d,
    id: `execution-fill:${w(d).slice(8)}`
  };
}
function sf(e, t, n) {
  const i = e.positionLedger;
  i.originalFilledQuantity = n.quantity, i.remainingQuantity = n.quantity, i.averageEntryPrice = n.price, i.initialNotional = U(n.quantity * n.price), i.initialMargin = U(i.initialNotional / i.selectedLeverage), i.maximumMarginUsed = i.initialMargin, i.marginAllocation = i.initialMargin, i.entryFees = n.feeAmount, i.totalFees = n.feeAmount, i.remainingProtectiveStopQuantity = n.quantity, i.bankruptcyBoundApprox = n.price + i.initialMargin / n.quantity, Vt(e);
}
function ir(e, t) {
  const n = e.positionLedger, i = n.originalFilledQuantity - n.remainingQuantity, r = i + t.quantity;
  n.averageExitPrice = r > 0 ? U(((n.averageExitPrice ?? 0) * i + t.price * t.quantity) / r) : null, n.realizedGrossPnl = U(
    n.realizedGrossPnl + t.quantity * (n.averageEntryPrice - t.price)
  ), n.remainingQuantity = He(
    Math.max(0, n.remainingQuantity - t.quantity),
    12
  ), n.exitFees = U(n.exitFees + t.feeAmount), n.totalFees = U(n.entryFees + n.exitFees), n.remainingProtectiveStopQuantity = n.remainingQuantity, Vt(e);
}
function cf(e) {
  const t = e.positionLedger;
  t.remainingQuantity = 0, t.unrealizedGrossPnl = 0, t.unrealizedNetPnlExcludingUnknownFutureCosts = 0, t.remainingProtectiveStopQuantity = 0, t.openTargetQuantities = {}, Vt(e), t.accountEquityAfter = U(t.accountEquityBefore + t.realizedNetPnl);
}
function lf(e, t) {
  const n = e.positionLedger;
  n.unrealizedGrossPnl = U(n.remainingQuantity * (n.averageEntryPrice - t)), n.unrealizedNetPnlExcludingUnknownFutureCosts = n.unrealizedGrossPnl, Vt(e);
}
function Vt(e) {
  const t = e.positionLedger;
  t.realizedNetPnl = U(t.realizedGrossPnl - t.totalFees + t.netFunding);
}
function uf(e, t) {
  const n = or(e);
  if (!n) return;
  const i = je(e, n.orderId);
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
  e.positionLedger.maximumAdverseUnrealizedLoss = U(Math.max(
    e.positionLedger.maximumAdverseUnrealizedLoss,
    a
  ));
}
function ct(e, t, n, i, r) {
  var E;
  const a = or(e), o = e.fills.filter((T) => T.side === "buy").map((T) => {
    const M = je(e, T.orderId), I = M.kind === "target" ? "target" : i === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: T.id,
      kind: I,
      targetId: M.parentTargetId,
      quantity: T.quantity,
      price: T.price,
      eventTime: T.eventTime,
      grossPnl: a ? U(T.quantity * (a.price - T.price)) : 0,
      fee: T.feeAmount
    };
  }), s = o.find((T) => T.kind === "stop") ?? null, c = ff(e, a), l = !t.dataBundle.fundingDataAvailable || e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), u = U(
    e.positionLedger.realizedNetPnl + e.positionLedger.unrealizedGrossPnl
  ), f = r ? "ambiguous" : l ? "fundingIncomplete" : "complete", d = f === "complete" ? u : null, m = t.tradePlan.sizingResult.projectedLossAtStop, v = t.tradePlan.sizingResult.riskBudget, p = o.filter((T) => T.kind === "target").map((T) => T.eventTime).sort()[0] ?? null, h = o.length ? Math.max(...o.map((T) => T.eventTime)) : null, A = {
    schemaVersion: Eu,
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
    usedMarketDataFingerprint: w(
      e.pathResolutionRecords.flatMap((T) => T.sourceObservationIds)
    ),
    pathResolutionRecords: y(e.pathResolutionRecords),
    fundingDataFingerprint: t.dataBundle.fundingDataAvailable ? w(e.fundingRecords.map((T) => T.observationId)) : null,
    status: n,
    closeReason: i,
    entrySummary: a,
    exitSummary: o,
    targetSummary: o.filter((T) => T.kind === "target"),
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
    stopSlippage: s ? ((E = e.fills.find((T) => T.id === s.fillId)) == null ? void 0 : E.slippage) ?? null : null,
    actualVsProjectedStopLoss: s && m ? U(-e.positionLedger.realizedNetPnl - m) : null,
    ambiguity: r,
    dataQualityNotes: [...new Set(e.dataQualityNotes)],
    executionModelVersion: Ht
  };
  return {
    ...A,
    id: `execution-result:${w(A).slice(8)}`
  };
}
function ff(e, t) {
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
    excursionResolution: pf(e.excursionObservations.map((r) => r.resolution))
  };
}
function q(e, t) {
  const n = e.state, i = e.executionEvents.at(-1);
  if (i && t.processingAsOf < i.processingAsOf)
    throw new Error("Execution event processing time cannot move backward");
  t.stateAfter && t.stateAfter !== n && (No(n, t.stateAfter), e.state = t.stateAfter, e.stateSince = t.eventTime), e.currentAsOf = Math.max(e.currentAsOf, t.processingAsOf);
  const r = {
    schemaVersion: yo,
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
    id: `execution-event:${w(r).slice(8)}`
  };
  e.executionEvents.push(a), e.revision = e.executionEvents.length;
}
function oi(e) {
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
    id: `execution-event:${w(r).slice(8)}`
  }), e.revision = e.executionEvents.length;
}
function rr(e, t, n, i) {
  t.status = "cancelled", t.remainingQuantity = 0, t.parentTargetId && delete e.positionLedger.openTargetQuantities[t.parentTargetId], q(e, {
    type: "OrderCancelled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [t.id],
    sourceObservationIds: [n.id],
    explanation: i
  });
}
function dn(e, t) {
  const n = { schemaVersion: gu, ...t };
  return {
    ...n,
    id: `execution-order:${w([e, n]).slice(8)}`
  };
}
function df(e) {
  return {
    schemaVersion: Su,
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
function mf(e, t, n) {
  const i = {};
  let r = 0;
  if (t.forEach((a, o) => {
    const s = o === t.length - 1 ? He(e - r, mn(n)) : Po(e * a.fraction, n);
    i[a.id] = Math.max(0, s), r = He(r + s, mn(n));
  }), r > e + n * 1e-9) throw new Error("Target allocation exceeds filled position");
  return i;
}
function vf(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.high >= t : n.policy === "PenetrationByTicks" ? e.high >= t + n.penetrationTicks * i : e.high >= t;
}
function yf(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.low <= t : n.policy === "PenetrationByTicks" ? e.low <= t - n.penetrationTicks * i : e.low <= t;
}
function Co(e, t, n) {
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
function hf(e, t) {
  const n = [];
  Co(e, t, e.tradePlan.stopPlan.stopPrice).touched && n.push("planned-stop");
  for (const i of e.tradePlan.targetPlans) t.low <= i.targetPrice && n.push(i.id);
  return n;
}
function Io(e, t, n, i) {
  const r = n === "sell" ? e * (1 - t / 1e4) : e * (1 + t / 1e4), a = Ot(r, i, n === "sell" ? "down" : "up");
  return { price: a, adjustment: U(a - e) };
}
function Ot(e, t, n) {
  const i = n === "up" ? Math.ceil(e / t - 1e-12) : Math.floor(e / t + 1e-12);
  return He(i * t, mn(t));
}
function Po(e, t) {
  return He(Math.floor(e / t + 1e-12) * t, mn(t));
}
function U(e) {
  return He(e, 12);
}
function He(e, t) {
  return Number(e.toFixed(Math.min(15, Math.max(t, 0))));
}
function mn(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function xo(e, t) {
  return Math.min(
    t.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    e.executionHorizonTime
  );
}
function ar(e) {
  return e.orders.find((t) => t.kind.startsWith("entry") && t.status === "active") ?? null;
}
function or(e) {
  return e.fills.find((t) => {
    var n;
    return (n = je(e, t.orderId)) == null ? void 0 : n.kind.startsWith("entry");
  }) ?? null;
}
function Oo(e) {
  return e.orders.find((t) => t.kind === "protectiveStop" && t.status === "active") ?? null;
}
function sr(e) {
  return e.orders.filter((t) => t.kind === "target" && t.status === "active");
}
function ko(e) {
  return e.orders.filter(
    (t) => (t.kind === "protectiveStop" || t.kind === "target") && t.status === "active"
  );
}
function je(e, t) {
  return e.orders.find((n) => n.id === t) ?? null;
}
function on(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function pf(e) {
  return e.includes("trade") ? "trade" : [...e].sort((t, n) => k(t) - k(n))[0] ?? null;
}
function No(e, t) {
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
function gf(e) {
  if (e.dataBundle.schemaVersion !== "execution-data-bundle.1" || e.executionProfile.executionEngineVersion !== Ht) throw new Error("Execution case identity is invalid");
  if (e.tradePlan.snapshotId !== e.replayFrame.decisionSnapshot.id)
    throw new Error("Execution TradePlan snapshot mismatch");
}
function Af(e, t) {
  const n = tr(t), i = si(e), r = si(n);
  if (R(i) !== R(r))
    throw new Error("Execution session does not match the loaded case");
}
function Ef(e) {
  const t = JSON.parse(R(e)), { integrityHash: n, ...i } = t;
  return i;
}
function cr(e) {
  const t = y(e);
  return y({ ...t, integrityHash: w(t) });
}
function si(e) {
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
function lr(e) {
  if (e.schemaVersion !== vo)
    throw new Error("Unsupported execution session schema");
  const { integrityHash: t, ...n } = e;
  if (w(n) !== t) throw new Error("Execution session integrity mismatch");
  const i = bf(e);
  if (R(i) !== R(e))
    throw new Error("Execution event-log reconstruction differs from direct state");
}
function bf(e) {
  var i;
  const t = si(e), n = {
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
    if (r.schemaVersion !== yo || r.executionSessionId !== e.id || r.sequence !== n.executionEvents.length || a !== `execution-event:${w(o).slice(8)}` || r.stateBefore !== n.state) throw new Error(`Invalid execution event ${r.id}`);
    if (r.stateAfter !== r.stateBefore && No(r.stateBefore, r.stateAfter), r.processingAsOf < n.currentAsOf)
      throw new Error(`Execution event processing time moved backward at ${r.id}`);
    n.state = r.stateAfter, r.stateAfter !== r.stateBefore && (n.stateSince = r.eventTime), n.currentAsOf = Math.max(n.currentAsOf, r.processingAsOf), n.orders = y(r.ordersAfter), n.fills = y(r.fillsAfter), n.positionLedger = y(r.positionLedgerAfter), n.pathResolutionRecords = y(r.pathResolutionRecordsAfter), n.fundingRecords = y(r.fundingRecordsAfter), n.excursionObservations = y(r.excursionObservationsAfter), n.result = y(r.resultAfter), n.dataQualityNotes = [...r.sessionDataQualityNotesAfter], n.errors = [...r.errorsAfter], wf(n, r), n.executionEvents.push(y(r)), n.revision += 1;
  }
  return cr(n);
}
function wf(e, t) {
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
  if (Math.abs(e.positionLedger.totalFees - U(o)) > 1e-9)
    throw new Error(`Execution fee conservation failed at ${t.id}`);
  if (Te.has(e.state) && e.result == null)
    throw new Error(`Terminal execution event has no result at ${t.id}`);
  if (e.result) {
    const { id: s, ...c } = e.result;
    if (s !== `execution-result:${w(c).slice(8)}`)
      throw new Error(`Execution result identity mismatch at ${t.id}`);
  }
}
function Dm(e) {
  return lr(e), R(e);
}
function Bm(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized execution session must be an object");
  const n = t;
  return lr(n), y(n);
}
function Tf(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
const $t = Fe, Ye = "replay-analysis-engine.1", _o = "replay-analysis-profile.1", Mo = "replay-analysis-state.2", Sf = "replay-analysis-observation.1", Vm = "replay-analysis-frame.1", Rf = "replay-analysis-data-bundle.1", Fo = "avwap-anchor-spec.1", ci = "relative-ratio.1", Cf = {
  windowSeconds: 86400,
  historyDays: 180,
  minSamples: 20,
  emaPeriod: 20,
  atrPeriod: 14
}, qr = {
  lookback: 500,
  pivotStrength: 3,
  atrPeriod: 14,
  minMoveAtr: 0.75,
  maxSwings: 120,
  maxBreaks: 24
};
function Lo(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return w(n);
}
function If(e, t) {
  if (e.schemaVersion !== _o || e.analysisEngineVersion !== Ye)
    throw new RangeError("Unsupported replay analysis profile version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay analysis profile id and version are required");
  const n = mi(e.evaluatedTimeframes);
  if (!n.includes(e.executionTimeframe))
    throw new RangeError("The execution timeframe must be evaluated");
  for (const r of [
    ...n,
    ...e.contextTimeframes,
    e.stochasticRsiConfig.timeframe,
    e.relativeStrengthConfig.timeframe
  ]) k(r);
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay analysis requires completedCandlesOnly=true");
  if (e.referenceMarketPolicy.allowForwardFill || !e.referenceMarketPolicy.requireExactCompletedCloseAlignment || e.alignmentPolicy !== "exactCompletedClose")
    throw new RangeError("Analysis engine 1 requires exact reference-bar alignment");
  if (t && (e.executionTimeframe !== t.timeframeRoles.executionTimeframe || e.lifecycleConfigRef.configHash !== t.lifecycleConfigHash))
    throw new RangeError("Analysis profile does not match strategy timeframe/lifecycle roles");
  const i = y({
    ...e,
    evaluatedTimeframes: n,
    contextTimeframes: mi(e.contextTimeframes),
    referenceMarketPolicy: {
      ...e.referenceMarketPolicy,
      symbol: e.referenceMarketPolicy.symbol.toUpperCase()
    }
  });
  return y({
    ...i,
    canonicalConfigHash: Lo(i)
  });
}
function $m(e, t = {}) {
  const n = mi([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]), i = e.lifecycleConfigHash;
  return If(
    {
      id: "impulse_fade_v1.replay-analysis.experimental",
      version: "1",
      schemaVersion: _o,
      analysisEngineVersion: Ye,
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
      extensionConfig: Cf,
      stochasticRsiConfig: {
        timeframe: e.timeframeRoles.executionTimeframe,
        rsiPeriod: 14,
        stochPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      },
      structureConfig: qr,
      supportResistanceConfig: {
        maxZones: 6,
        thicknessBps: 10,
        latestX: 0,
        referencePrice: null,
        zonesPerSide: 3
      },
      relativeStrengthConfig: {
        ...qr,
        timeframe: e.timeframeRoles.executionTimeframe,
        formulaVersion: ci,
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
function li(e) {
  var Q, qt, zt, Qt;
  Pf(e);
  const t = Ho(e), n = e.analysisProfile, i = e.includeComponentProvenance !== !1, r = e.symbol.toUpperCase(), a = n.referenceMarketPolicy.symbol, o = n.referenceMarketPolicy.source ?? e.source, s = {}, c = {};
  for (const P of n.evaluatedTimeframes)
    s[P] = ke(
      e.candlesByTimeframe[P] ?? [],
      P,
      t
    ), c[P] = ke(
      e.referenceCandlesByTimeframe[P] ?? [],
      P,
      t
    );
  const l = w({
    schemaVersion: Rf,
    symbol: r,
    source: e.source,
    referenceSymbol: a,
    referenceSource: o,
    effectiveAsOf: t,
    targetObservationIds: Kr(s),
    referenceObservationIds: Kr(c),
    anchorObservationIds: (e.avwapAnchors ?? []).filter((P) => P.knownAt <= t && P.selectedAt <= t).map((P) => P.anchorCandleObservationId).sort()
  }), u = w({
    analysisEngineVersion: n.analysisEngineVersion,
    profileHash: n.canonicalConfigHash
  }), f = {}, d = {}, m = {}, v = [], p = [], h = [], A = {}, E = [], T = [];
  for (const P of n.evaluatedTimeframes) {
    const j = s[P], Ze = fi(
      e.candlesByTimeframe[P] ?? [],
      j,
      n.extensionConfig
    );
    f[P] = Ze;
    const mt = e.includeIndicatorSeries !== !1, vt = mt && P === n.stochasticRsiConfig.timeframe ? Os(
      j.candles,
      n.stochasticRsiConfig.rsiPeriod,
      n.stochasticRsiConfig.stochPeriod,
      n.stochasticRsiConfig.kPeriod,
      n.stochasticRsiConfig.dPeriod
    ) : null;
    mt && (d[P] = {
      ema: nt(xs(j.candles, n.extensionConfig.emaPeriod)),
      atr: nt(ks(j.candles, n.extensionConfig.atrPeriod)),
      stochRsi: vt ? { k: nt(vt.k), d: nt(vt.d) } : null,
      configurationHash: w({
        extension: n.extensionConfig,
        stochasticRsi: P === n.stochasticRsiConfig.timeframe ? n.stochasticRsiConfig : null
      })
    });
    const jt = w(n.structureConfig), be = kf(
      e.candlesByTimeframe[P] ?? [],
      j,
      n.structureConfig,
      jt
    ), vs = it({
      logicalId: `market-structure:${e.source}:${r}:${P}`,
      component: `structure:${P}`,
      timeframe: P,
      eventTime: be.summary.updatedTs ?? t,
      knownAt: Math.max(
        ((Q = be.summary.lastBreak) == null ? void 0 : Q.knownAt) ?? 0,
        ((qt = be.summary.lastSwingHigh) == null ? void 0 : qt.knownAt) ?? 0,
        ((zt = be.summary.lastSwingLow) == null ? void 0 : zt.knownAt) ?? 0
      ) || t,
      evaluatedAt: t,
      configurationHash: jt,
      sourceObservationIds: j.replay.map((z) => z.observationId),
      value: be
    }, i);
    m[P] = { timeframe: P, observation: vs };
    for (const z of be.breaks)
      v.push(it({
        logicalId: Vf(e.source, r, P, z),
        component: "structureEvent",
        timeframe: P,
        eventTime: z.eventTime,
        knownAt: z.knownAt,
        evaluatedAt: ui(z.knownAt, n.executionTimeframe),
        configurationHash: jt,
        sourceObservationIds: di(j, z.knownAt),
        value: z
      }, i));
    for (const z of Gs(be))
      p.push(Bf(e, P, z));
    const Je = j.candles.at(-1), ys = {
      ...n.supportResistanceConfig,
      latestX: (Je == null ? void 0 : Je.x) ?? 0,
      referencePrice: (Je == null ? void 0 : Je.c) ?? null
    }, hr = Pa(be.swings, ys);
    T.push(...hr);
    const pr = w(n.supportResistanceConfig);
    for (const z of hr) {
      const gr = $f(be.swings, z, e, P);
      h.push(it({
        logicalId: `sr-zone:${e.source}:${r}:${P}:${z.kind}:${gr[0] ?? z.eventTime}`,
        component: "supportResistanceZone",
        timeframe: P,
        eventTime: z.eventTime,
        knownAt: z.knownAt,
        evaluatedAt: t,
        configurationHash: pr,
        sourceObservationIds: di(j, z.knownAt),
        value: { ...z, originatingSwingIds: gr }
      }, i));
    }
    const On = `timeframe:${P}`;
    if (A[On] = $e(
      On,
      t,
      j,
      u,
      qf(n, P),
      i
    ), A[`extension:${P}`] = $e(
      `extension:${P}`,
      t,
      j,
      w(n.extensionConfig),
      Math.max(
        n.extensionConfig.emaPeriod,
        n.extensionConfig.atrPeriod + 1,
        Math.ceil(n.extensionConfig.windowSeconds / k(P)) + 1
      ),
      i
    ), A[`structure:${P}`] = $e(
      `structure:${P}`,
      t,
      j,
      jt,
      n.structureConfig.pivotStrength * 2 + 1,
      i
    ), A[`supportResistance:${P}`] = $e(
      `supportResistance:${P}`,
      t,
      j,
      pr,
      n.structureConfig.pivotStrength * 2 + 1,
      i
    ), P === n.stochasticRsiConfig.timeframe) {
      const z = n.stochasticRsiConfig.rsiPeriod + n.stochasticRsiConfig.stochPeriod + n.stochasticRsiConfig.kPeriod + n.stochasticRsiConfig.dPeriod - 3;
      A[`stochRsi:${P}`] = $e(
        `stochRsi:${P}`,
        t,
        j,
        w(n.stochasticRsiConfig),
        z,
        i
      );
    }
    j.candles.length || E.push(sn("ANALYSIS_COMPONENT_UNAVAILABLE", On, "No completed candles"));
  }
  const M = e.strategyProfile.timeframeRoles.candidateTimeframe, I = s[M] ?? ke(
    e.candlesByTimeframe[M] ?? [],
    M,
    t
  ), b = Of(
    e,
    M,
    I,
    t,
    s,
    f
  );
  for (const P of b.insufficientDataReasons)
    E.push(sn(P.code, `extension:${M}`, P.message));
  A.candidateMetrics = {
    ...$e(
      "candidateMetrics",
      t,
      I,
      w(n.extensionConfig),
      n.extensionConfig.minSamples,
      i
    ),
    status: b.insufficientDataReasons.length ? "insufficientHistory" : "available"
  };
  const g = n.relativeStrengthConfig.timeframe, C = s[g] ?? ke(
    e.candlesByTimeframe[g] ?? [],
    g,
    t
  ), x = c[g] ?? ke(
    e.referenceCandlesByTimeframe[g] ?? [],
    g,
    t
  ), B = Ff(
    e,
    g,
    C,
    x,
    o
  ), W = B.status === "available" ? Ys(
    C.candles,
    x.candles,
    n.relativeStrengthConfig
  ).map((P) => {
    var mt;
    const j = ((mt = x.replay.find(
      (vt) => vt.openTime === P.bucket
    )) == null ? void 0 : mt.knownAt) ?? P.knownAt, Ze = Math.max(P.knownAt, j);
    return it({
      logicalId: `rs-event:${e.source}:${r}:${g}:${P.kind}:${P.bucket}`,
      component: "relativeStrengthEvent",
      timeframe: g,
      eventTime: P.eventTime,
      knownAt: Ze,
      evaluatedAt: ui(
        Ze,
        e.analysisProfile.executionTimeframe
      ),
      configurationHash: w(n.relativeStrengthConfig),
      sourceObservationIds: zf(C, x, Ze),
      value: { ...P, knownAt: Ze }
    }, i);
  }) : [];
  A.relativeStrength = Uf(
    t,
    C,
    x,
    B.status,
    w(n.relativeStrengthConfig),
    i
  ), B.status !== "available" && E.push(sn(
    B.status === "missingSynchronizedReferenceData" ? "MISSING_SYNCHRONIZED_REFERENCE_DATA" : "ANALYSIS_COMPONENT_UNAVAILABLE",
    "relativeStrength",
    "RS-vs-BTC requires exact completed target/reference bar alignment"
  ));
  const _ = Lf(
    e,
    s,
    t,
    i
  );
  E.push(..._.notes), A.avwap = _.freshness;
  const V = Nf(
    e,
    M,
    t
  ), N = ((Qt = m[n.executionTimeframe]) == null ? void 0 : Qt.observation.value) ?? null, ae = ba({
    symbol: r,
    source: e.source,
    venue: e.source,
    executionTimeframe: n.executionTimeframe,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(s).map(([P, j]) => [
        P,
        j.candles
      ])
    ),
    candidateMetrics: V,
    structureEvents: v.map((P) => ({
      ...P.value,
      sourceTimeframe: P.timeframe
    })),
    supportResistanceZones: T,
    avwapEvents: _.events.map((P) => P.value),
    relativeStrengthEvents: W.map((P) => P.value),
    config: e.lifecycleConfig,
    from: e.radarEpisode.detectedAt,
    to: t
  }) ?? Df(e, t, N), oe = {
    schemaVersion: Mo,
    replayEngineVersion: $t,
    analysisEngineVersion: Ye,
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
    candidateMetrics: b,
    extensionContext: f,
    indicatorSeries: d,
    structureByTimeframe: m,
    structureEvents: v,
    activeStructureLevels: p,
    supportResistanceZones: h,
    relativeStrength: B,
    relativeStrengthEvents: W,
    avwapStates: _.states,
    avwapEvents: _.events,
    lifecycleResult: ae,
    setupState: ae,
    coverageByComponent: A,
    freshnessByComponent: A,
    dataQualityNotes: Qf(E)
  };
  return y({
    ...oe,
    id: `replay-analysis-state:${w(oe).slice(8)}`
  });
}
function Pf(e) {
  if (!Number.isFinite(e.asOf) || e.asOf < 0)
    throw new RangeError("Analysis asOf must be a non-negative finite timestamp");
  if (Lo(e.analysisProfile) !== e.analysisProfile.canonicalConfigHash)
    throw new Error("Replay analysis profile failed deterministic hash verification");
  if (e.strategyProfile.lifecycleConfigHash !== e.analysisProfile.lifecycleConfigRef.configHash)
    throw new Error("Analysis lifecycle configuration does not match the strategy profile");
  if (e.radarEpisode.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.radarEpisode.source !== e.source)
    throw new Error("Radar episode does not match the materialized instrument");
  const t = e.analysisProfile.referenceMarketPolicy.symbol, n = e.analysisProfile.referenceMarketPolicy.source ?? e.source;
  zr(
    e.candlesByTimeframe,
    e.symbol,
    e.source,
    e.asOf,
    "target"
  ), zr(
    e.referenceCandlesByTimeframe,
    t,
    n,
    e.asOf,
    "reference"
  );
}
function zr(e, t, n, i, r) {
  for (const [a, o] of Object.entries(e)) {
    k(a);
    for (const s of o)
      if (!(s.knownAt > i) && (s.symbol.toUpperCase() !== t.toUpperCase() || s.source !== n || s.timeframe !== a))
        throw new Error(`Materialized ${r} candle identity mismatch for ${a}`);
  }
}
function Ho(e) {
  const t = e.analysisProfile.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], i = [...new Set(n.map((r) => r.closeTime).filter((r) => r <= e.asOf))].sort((r, a) => a - r);
  for (const r of i)
    if (Ke(n, r).some((a) => a.closeTime === r))
      return r;
  throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
}
function ke(e, t, n) {
  var f, d, m;
  const i = (d = (f = qn.get(e)) == null ? void 0 : f.get(t)) == null ? void 0 : d.get(n);
  if (i) return i;
  xf(e, t);
  const r = Ke(e, n), a = e.length ? Math.min(...e.map((v) => v.openTime)) : ((m = r[0]) == null ? void 0 : m.openTime) ?? 0, o = k(t), s = Object.freeze(
    r.map((v) => Object.freeze(Vo(v, a, o)))
  ), c = Object.freeze({ replay: r, candles: s });
  let l = qn.get(e);
  l || (l = /* @__PURE__ */ new Map(), qn.set(e, l));
  let u = l.get(t);
  return u || (u = /* @__PURE__ */ new Map(), l.set(t, u)), Bo(u, n, c), c;
}
const qn = /* @__PURE__ */ new WeakMap(), Qr = /* @__PURE__ */ new WeakSet();
function xf(e, t) {
  if (Object.isFrozen(e) && Qr.has(e)) return;
  const n = e.length ? Math.min(...e.map((a) => a.openTime)) : 0, i = k(t), r = e.length ? Math.max(...e.map((a) => Math.max(a.closeTime, a.knownAt))) : 0;
  hn(
    e.map((a) => Vo(a, n, i)),
    t,
    r
  ), Object.isFrozen(e) && Qr.add(e);
}
function Ke(e, t) {
  var o;
  const n = (o = zn.get(e)) == null ? void 0 : o.get(t);
  if (n) return n;
  const i = /* @__PURE__ */ new Map();
  for (const s of e) {
    if (s.closeTime > t || s.knownAt > t) continue;
    if (dt(s) !== s.observationId)
      throw new Error(`Candle observation ${s.observationId} failed identity verification`);
    const c = i.get(s.logicalCandleId);
    if (!c || c.knownAt < s.knownAt)
      i.set(s.logicalCandleId, s);
    else if (c.knownAt === s.knownAt && R(c) !== R(s))
      throw new Error(`Conflicting candle revisions for ${s.logicalCandleId}`);
  }
  const r = Object.freeze([...i.values()].sort(
    (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt
  ));
  let a = zn.get(e);
  return a || (a = /* @__PURE__ */ new Map(), zn.set(e, a)), Bo(a, t, r), r;
}
const Do = 512, zn = /* @__PURE__ */ new WeakMap();
function Bo(e, t, n) {
  for (e.set(t, n); e.size > Do; ) {
    const i = e.keys().next().value;
    if (i == null) break;
    e.delete(i);
  }
}
function Vo(e, t, n) {
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
function nt(e) {
  const t = [];
  for (let n = 0; n < e.length; n += 2)
    t.push({ x: e[n], value: e[n + 1] });
  return t;
}
function ui(e, t) {
  const n = k(t);
  return Math.ceil(e / n) * n;
}
function it(e, t = !0) {
  const n = {
    schemaVersion: Sf,
    ...e,
    sourceObservationIds: [...new Set(e.sourceObservationIds)].sort()
  };
  return y({
    ...n,
    sourceObservationIds: t ? n.sourceObservationIds : [],
    observationId: `replay-analysis-observation:${w(n).slice(8)}`
  });
}
function Of(e, t, n, i, r, a) {
  var p, h, A, E, T, M;
  const o = e.analysisProfile, s = a[t] ?? fi(
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
    o.evaluatedTimeframes.map((I) => {
      var C, x;
      const b = r[I] ?? ke(
        e.candlesByTimeframe[I] ?? [],
        I,
        i
      ), g = a[I] ?? fi(
        e.candlesByTimeframe[I] ?? [],
        b,
        o.extensionConfig
      );
      return [I, {
        timeframe: I,
        emaPeriod: o.extensionConfig.emaPeriod,
        atrPeriod: o.extensionConfig.atrPeriod,
        latestTs: ((C = g.candle) == null ? void 0 : C.bucket) ?? null,
        latestClose: ((x = g.candle) == null ? void 0 : x.c) ?? null,
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
      referenceTs: ((E = s.referenceCandle) == null ? void 0 : E.bucket) ?? null,
      latestClose: ((T = s.candle) == null ? void 0 : T.c) ?? null,
      referenceClose: ((M = s.referenceCandle) == null ? void 0 : M.c) ?? null,
      returnPct: s.returnPct,
      percentile: s.percentile,
      zScore: s.zScore
    },
    timeframeExtensions: v,
    updatedAt: i
  });
}
const jr = /* @__PURE__ */ new WeakMap(), Wr = /* @__PURE__ */ new WeakMap(), Gr = /* @__PURE__ */ new WeakMap();
function fi(e, t, n) {
  var s;
  if (!$o(e)) return st(t.candles, n);
  const i = `${((s = t.replay.at(-1)) == null ? void 0 : s.observationId) ?? "empty"}:${w(n)}`;
  let r = jr.get(e);
  r || (r = /* @__PURE__ */ new Map(), jr.set(e, r));
  const a = r.get(i);
  if (a) return a;
  const o = st(t.candles, n);
  return Uo(r, i, o), o;
}
function kf(e, t, n, i) {
  var c;
  if (!$o(e)) return _e(t.candles, n);
  const r = `${((c = t.replay.at(-1)) == null ? void 0 : c.observationId) ?? "empty"}:${i}`;
  let a = Wr.get(e);
  a || (a = /* @__PURE__ */ new Map(), Wr.set(e, a));
  const o = a.get(r);
  if (o) return o;
  const s = _e(t.candles, n);
  return Uo(a, r, s), s;
}
function $o(e) {
  const t = Gr.get(e);
  if (t != null) return t;
  const n = e.every((i) => i.correctionPublishedAt == null);
  return Gr.set(e, n), n;
}
function Uo(e, t, n) {
  for (e.set(t, n); e.size > Do; ) {
    const i = e.keys().next().value;
    if (i == null) break;
    e.delete(i);
  }
}
function Nf(e, t, n) {
  const i = e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [], r = e.candlesByTimeframe[t] ?? [], a = w(e.analysisProfile.extensionConfig);
  let o = Yr.get(i);
  o || (o = /* @__PURE__ */ new WeakMap(), Yr.set(i, o));
  let s = o.get(r);
  s || (s = /* @__PURE__ */ new Map(), o.set(r, s));
  let c = s.get(a);
  c || (c = Mf(e, t, i, r), s.set(a, c));
  const l = c.filter(
    (f) => (f.knownAt ?? f.asOf) <= n
  ), u = _f(e.radarEpisode, n);
  return u ? [
    u,
    ...l.filter((f) => f.asOf > u.asOf)
  ] : l;
}
function _f(e, t) {
  var c;
  if (!Number.isFinite(e.detectedAt) || e.detectedAt > t) return null;
  const n = ((c = e.triggeringObservations) == null ? void 0 : c.find(
    (l) => l.knownAt <= e.detectedAt && l.effectiveAsOf <= e.detectedAt && l.value != null && Number.isFinite(l.value)
  )) ?? null, i = e.pathContext, r = nn(
    (i == null ? void 0 : i.triggeringLocalImpulseReturnPct) ?? (n == null ? void 0 : n.value)
  ), a = nn(
    (i == null ? void 0 : i.triggeringPercentile) ?? (n == null ? void 0 : n.percentile)
  ), o = nn((i == null ? void 0 : i.triggeringZScore) ?? (n == null ? void 0 : n.zScore)), s = nn(i == null ? void 0 : i.currentAtrDisplacement);
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
function nn(e) {
  return e != null && Number.isFinite(e) ? e : null;
}
const Yr = /* @__PURE__ */ new WeakMap();
function Mf(e, t, n, i) {
  const r = Math.max(
    0,
    ...n.map((f) => f.knownAt ?? f.closeTime)
  ), a = Ke(n, r), o = ke(i, t, r);
  let s = -1, c = -2, l = null, u = 0;
  return a.map((f) => {
    for (; s + 1 < o.replay.length && o.replay[s + 1].closeTime <= f.closeTime && (o.replay[s + 1].knownAt ?? o.replay[s + 1].closeTime) <= f.closeTime; ) s += 1;
    if (s !== c || !l) {
      const d = st(
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
function Ff(e, t, n, i, r, a) {
  const o = new Set(n.replay.map((h) => h.openTime)), s = new Map(i.replay.map((h) => [h.openTime, h])), c = [...o].some((h) => !s.has(h)), l = !n.replay.length || !i.replay.length ? "unavailable" : c ? "missingSynchronizedReferenceData" : "available";
  if (l !== "available")
    return {
      targetSymbol: e.symbol.toUpperCase(),
      targetSource: e.source,
      referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
      referenceSource: r,
      formulaVersion: ci,
      normalizationAnchor: null,
      series: [],
      structure: null,
      status: l
    };
  const u = xa(n.candles, i.candles), f = nt(u), d = new Map(n.candles.map((h) => [h.x, h])), m = f.map((h) => ({ ...d.get(h.x), o: h.value, h: h.value, l: h.value, c: h.value })), v = n.replay[0], p = s.get(v.openTime);
  return {
    targetSymbol: e.symbol.toUpperCase(),
    targetSource: e.source,
    referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
    referenceSource: r,
    formulaVersion: ci,
    normalizationAnchor: {
      targetObservationId: v.observationId,
      referenceObservationId: p.observationId,
      closeTime: v.closeTime
    },
    series: e.includeComponentProvenance === !1 ? f.slice(-1) : f,
    structure: _e(m, e.analysisProfile.structureConfig),
    status: l
  };
}
function Lf(e, t, n, i) {
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
    configurationHash: w(e.analysisProfile.avwapConfig)
  };
  const c = (e.avwapAnchors ?? []).filter(
    (u) => u.knownAt <= n && u.selectedAt <= n
  );
  if (!c.length)
    return o.push(sn("ANALYSIS_COMPONENT_UNAVAILABLE", "avwap", "No explicit AVWAP anchor was supplied")), { states: r, events: a, notes: o, freshness: s };
  for (const u of c) {
    Hf(u, e, t, n);
    const f = t[u.timeframe], d = { anchorBucket: u.anchorTime }, m = Qs(f.candles, d), v = f.replay.filter((h) => h.openTime >= u.anchorTime).map((h) => h.observationId), p = it({
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
      configurationHash: w({ anchor: u, config: e.analysisProfile.avwapConfig }),
      sourceObservationIds: [u.anchorCandleObservationId, ...v],
      value: m
    }, i);
    r.push({
      anchor: u,
      series: i ? nt(Si(f.candles, d)) : [],
      snapshot: m,
      observation: p
    });
    for (const h of js(
      f.candles,
      d,
      e.analysisProfile.avwapConfig.maxSignals
    )) {
      const A = Math.max(h.knownAt, u.selectedAt);
      a.push(it({
        logicalId: `avwap-event:${u.id}:${h.kind}:${h.bucket}`,
        component: "avwapEvent",
        timeframe: u.timeframe,
        eventTime: h.eventTime,
        knownAt: A,
        evaluatedAt: ui(
          A,
          e.analysisProfile.executionTimeframe
        ),
        configurationHash: p.configurationHash,
        sourceObservationIds: [u.anchorCandleObservationId, ...di(f, h.knownAt)],
        value: { ...h, knownAt: A }
      }, i));
    }
    s = $e(
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
function Hf(e, t, n, i) {
  if (e.schemaVersion !== Fo || e.symbol.toUpperCase() !== t.symbol.toUpperCase() || e.source !== t.source || e.knownAt > i || e.selectedAt > i) throw new RangeError(`AVWAP anchor ${e.id} was not known at the cutoff`);
  const r = n[e.timeframe];
  if (!r) throw new RangeError(`AVWAP anchor timeframe ${e.timeframe} is not evaluated`);
  const a = r.replay.find(
    (o) => o.logicalCandleId === e.anchorCandleLogicalId
  );
  if (!a || a.observationId !== e.anchorCandleObservationId || a.openTime !== e.anchorTime || a.knownAt > e.selectedAt) throw new RangeError(`AVWAP anchor ${e.id} does not reference the visible frozen revision`);
}
function Um(e) {
  if (!e.id.trim() || !e.provenance.trim())
    throw new TypeError("AVWAP anchor id and provenance are required");
  if (e.knownAt > e.selectedAt)
    throw new RangeError("AVWAP anchor cannot be selected before it is known");
  return k(e.timeframe), y({
    ...e,
    schemaVersion: Fo,
    symbol: e.symbol.toUpperCase()
  });
}
function Df(e, t, n) {
  const i = ke(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    e.analysisProfile.executionTimeframe,
    t
  ), r = ba({
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
function Bf(e, t, n) {
  const i = qo(e.source, e.symbol, t, n.sourceSwing), r = `structure-level:${e.source}:${e.symbol.toUpperCase()}:${t}:${n.role}:${i}`;
  return Oi({
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
function Vf(e, t, n, i) {
  return `structure-event:${e}:${t}:${n}:${i.kind}:${i.direction}:${i.bucket}:${i.sourceSwingX}`;
}
function qo(e, t, n, i) {
  return `swing:${e}:${t.toUpperCase()}:${n}:${i.kind}:${i.bucket}`;
}
function $f(e, t, n, i) {
  return e.filter((r) => r.price >= t.low && r.price <= t.high && (t.kind === "resistance" ? r.kind === "SwingHigh" : r.kind === "SwingLow")).sort((r, a) => r.bucket - a.bucket || r.knownAt - a.knownAt).map((r) => qo(n.source, n.symbol, i, r));
}
function $e(e, t, n, i, r, a = !0) {
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
function Uf(e, t, n, i, r, a = !0) {
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
function qf(e, t) {
  return Math.max(
    e.extensionConfig.emaPeriod,
    e.extensionConfig.atrPeriod + 1,
    t === e.stochasticRsiConfig.timeframe ? e.stochasticRsiConfig.rsiPeriod + e.stochasticRsiConfig.stochPeriod + e.stochasticRsiConfig.kPeriod + e.stochasticRsiConfig.dPeriod : 0,
    e.structureConfig.pivotStrength * 2 + 1
  );
}
function di(e, t) {
  return e.replay.filter((n) => n.knownAt <= t).map((n) => n.observationId);
}
function zf(e, t, n) {
  const i = new Map(t.replay.map((r) => [r.openTime, r]));
  return e.replay.flatMap((r) => {
    if (r.knownAt > n) return [];
    const a = i.get(r.openTime);
    return a && a.knownAt <= n ? [r.observationId, a.observationId] : [];
  });
}
function Kr(e) {
  return Object.fromEntries(Object.entries(e).map(([t, n]) => [
    t,
    n.replay.map((i) => i.observationId)
  ]));
}
function sn(e, t, n) {
  return { code: e, severity: "warning", message: `${t}: ${n}` };
}
function Qf(e) {
  return [...new Map(e.map((t) => [R(t), t])).values()];
}
function mi(e) {
  const t = [];
  for (const n of e)
    k(n), t.includes(n) || t.push(n);
  return t;
}
function jf(e) {
  const t = e.avwapStates[0];
  return !t || t.snapshot.value == null ? null : {
    reference: Oi({
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
function Wf(e) {
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
function Gf(e) {
  return e.supportResistanceZones.map((t) => Oi({
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
const Xr = "replay-analysis-data.1";
function Yf(e) {
  const t = ur(e, "Replay analysis JSON data");
  if (jo(t, ["schemaVersion", "target", "reference"], "Replay analysis JSON data"), t.schemaVersion !== Xr)
    throw new Error("Unsupported Replay analysis JSON data schema");
  const n = Zr(t.target, "target"), i = Zr(t.reference, "reference");
  return y({
    schemaVersion: Xr,
    target: n,
    reference: i
  });
}
var G, Re, bt, zo;
class Kf {
  constructor(t) {
    ne(this, Re);
    ne(this, G);
    se(this, G, Yf(t));
  }
  async getCoverage(t) {
    Qo(t);
    const n = ie(this, Re, zo).call(this, t);
    if (!n) return Jf(t.timeframe);
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
    return ie(this, Re, bt).call(this, S(this, G).target, S(this, G).target.candles, t);
  }
  async loadCandleRevisions(t) {
    return S(this, G).target.revisionHistoryAvailable ? ie(this, Re, bt).call(this, S(this, G).target, S(this, G).target.candleRevisions, t) : y([]);
  }
  async loadReferenceCandles(t) {
    return ie(this, Re, bt).call(this, S(this, G).reference, S(this, G).reference.candles, t);
  }
  async loadReferenceCandleRevisions(t) {
    return S(this, G).reference.revisionHistoryAvailable ? ie(this, Re, bt).call(this, S(this, G).reference, S(this, G).reference.candleRevisions, t) : y([]);
  }
}
G = new WeakMap(), Re = new WeakSet(), bt = function(t, n, i) {
  return ed(i), Qn(t, i) ? y(
    n.filter(
      (r) => r.timeframe === i.timeframe && r.openTime >= i.from && r.openTime <= i.to
    )
  ) : y([]);
}, zo = function(t) {
  return Qn(S(this, G).target, t) ? S(this, G).target : Qn(S(this, G).reference, t) ? S(this, G).reference : null;
};
class qm extends Kf {
  constructor(t) {
    super(t);
  }
}
function Zr(e, t) {
  const n = ur(e, `Replay analysis ${t} series`);
  jo(
    n,
    ["symbol", "source", "candles", "candleRevisions", "revisionHistoryAvailable"],
    `Replay analysis ${t} series`
  );
  const i = vn(n.symbol, `${t} symbol`).toUpperCase(), r = vn(n.source, `${t} source`), a = ta(n.candles, `${t} candles`), o = ta(
    n.candleRevisions,
    `${t} candleRevisions`
  ), s = td(
    n.revisionHistoryAvailable,
    `${t} revisionHistoryAvailable`
  );
  if (o.length > 0 && !s)
    throw new Error(`${t} candle revisions require revisionHistoryAvailable=true`);
  return Xf(a, o, i, r, t), {
    symbol: i,
    source: r,
    candles: Jr(a),
    candleRevisions: Jr(o),
    revisionHistoryAvailable: s
  };
}
function Xf(e, t, n, i, r) {
  const a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (const l of [...e, ...t]) {
    if (Zf(l, n, i, r), o.has(l.observationId))
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
function Zf(e, t, n, i) {
  const r = ur(e, `Replay analysis ${i} candle`), a = k(r.timeframe);
  let o;
  try {
    o = ao({
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
  if (r.symbol !== t || r.source !== n || !rt(r.openTime) || r.openTime % a !== 0 || r.closeTime !== r.openTime + a || !rt(r.closeTime) || !rt(r.knownAt) || r.knownAt < r.closeTime || r.correctionPublishedAt != null && !rt(r.correctionPublishedAt) || r.logicalCandleId !== Lt(r) || r.observationId !== dt(r) || !ea(r.vBase) || !ea(r.vQuote) || R(r) !== R(o))
    throw new Error(`Invalid ${i} replay candle ${r.observationId ?? "<unknown>"}`);
}
function Qn(e, t) {
  return t.symbol.toUpperCase() === e.symbol && t.source === e.source;
}
function Jf(e) {
  return y({
    timeframe: e,
    earliestOpenTime: null,
    latestCloseTime: null,
    revisionHistoryAvailable: !1
  });
}
function Qo(e) {
  vn(e.symbol, "Replay analysis query symbol"), vn(e.source, "Replay analysis query source"), k(e.timeframe);
}
function ed(e) {
  if (Qo(e), !rt(e.from) || !rt(e.to) || e.to < e.from)
    throw new RangeError("Replay analysis query range must contain ordered Unix-second timestamps");
}
function Jr(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function jo(e, t, n) {
  const i = Object.keys(e).sort(), r = [...t].sort();
  if (i.length !== r.length || i.some((a, o) => a !== r[o]))
    throw new Error(`${n} has unsupported or missing fields`);
}
function ea(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function rt(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function ur(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function vn(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function td(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function ta(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
const fr = "replay-analysis-session.1", nd = "replay-analysis-session-event.1", id = 128, Se = /* @__PURE__ */ new Map();
function zm(e) {
  const t = y(e), n = {
    schemaVersion: fr,
    id: `replay-analysis-session:${w({
      symbol: e.symbol.toUpperCase(),
      source: e.source,
      analysisProfileHash: e.analysisProfile.canonicalConfigHash,
      strategyProfileHash: e.strategyProfile.profileHash,
      radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
      radarEpisodeId: e.radarEpisode.id,
      referenceMarket: e.analysisProfile.referenceMarketPolicy,
      anchors: e.avwapAnchors ?? []
    }).slice(8)}`,
    replayEngineVersion: $t,
    analysisEngineVersion: Ye,
    revision: 0,
    input: t,
    currentRequestedAsOf: null,
    currentEffectiveAsOf: null,
    states: [],
    events: []
  };
  return Yo(n);
}
function rd(e, t) {
  return Ut(e), vi({ ...e.input, asOf: t });
}
function ad(e, t, n = {}) {
  var d, m;
  if (Ut(e), !Number.isFinite(t) || t < 0)
    throw new RangeError("Analysis session asOf must be a non-negative finite timestamp");
  const i = dd(e.input, n), r = md(
    e.input,
    i,
    e.input.analysisProfile.executionTimeframe
  ), a = r == null ? [...e.states] : e.states.filter((v) => v.effectiveAsOf < r), o = e.states.filter((v) => !a.some((p) => p.id === v.id)).map((v) => v.id), s = [...e.events];
  o.length && s.push(Wo({
    sequence: s.length,
    kind: "invalidated",
    effectiveAsOf: r,
    analysisStateId: null,
    invalidatedStateIds: o,
    sourceObservationIds: vd(e.input, i)
  }));
  const c = ((d = a.at(-1)) == null ? void 0 : d.effectiveAsOf) ?? -1 / 0, l = Ke(
    i.candlesByTimeframe[i.analysisProfile.executionTimeframe] ?? [],
    t
  ).map((v) => v.closeTime).filter((v) => v > c && v <= t), u = [...a];
  for (const v of l)
    na(u, s, vi({ ...i, asOf: v }));
  const f = vi({ ...i, asOf: t });
  return ((m = u.at(-1)) == null ? void 0 : m.id) !== f.id && na(u, s, f), Yo({
    schemaVersion: fr,
    id: e.id,
    replayEngineVersion: $t,
    analysisEngineVersion: Ye,
    revision: e.revision + 1,
    input: i,
    currentRequestedAsOf: t,
    currentEffectiveAsOf: f.effectiveAsOf,
    states: u,
    events: s
  });
}
function od(e) {
  return Ut(e), R(e);
}
function sd(e) {
  const t = JSON.parse(e);
  return Ut(t), y(t);
}
function Ut(e) {
  if (e.schemaVersion !== fr || e.replayEngineVersion !== $t || e.analysisEngineVersion !== Ye) throw new Error("Unsupported replay analysis session version");
  const { integrityHash: t, ...n } = e;
  if (e.integrityHash !== w(n))
    throw new Error("Replay analysis session failed integrity verification");
  if (e.events.some((r, a) => r.sequence !== a || r.id !== Go(r)))
    throw new Error("Replay analysis session event log failed integrity verification");
  const i = e.states.map((r) => r.id);
  if (new Set(i).size !== i.length)
    throw new Error("Replay analysis session contains duplicate states");
}
function cd(e) {
  const t = e.analysisProfile;
  return t.evaluatedTimeframes.flatMap((n) => {
    const i = k(n), r = [{
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
var fe;
class Qm {
  constructor(t) {
    we(this, "replayEngineVersion", $t);
    ne(this, fe);
    Ut(t), se(this, fe, y(t));
  }
  getRequiredCoverage() {
    return cd(S(this, fe).input);
  }
  materializeAt(t) {
    return rd(S(this, fe), t);
  }
  advanceTo(t, n = {}) {
    return se(this, fe, ad(S(this, fe), t, n)), S(this, fe).states.at(-1);
  }
  serializeState() {
    return od(S(this, fe));
  }
  resumeState(t) {
    se(this, fe, sd(t));
  }
  snapshot() {
    return y(S(this, fe));
  }
}
fe = new WeakMap();
var Ue;
class jm {
  constructor(t) {
    we(this, "replayEngineVersion", "replay-engine.1");
    ne(this, Ue);
    se(this, Ue, y([...t].sort(
      (n, i) => n.knownAt - i.knownAt || n.id.localeCompare(i.id)
    )));
  }
  getRequiredCoverage() {
    return [];
  }
  materializeAt(t) {
    const n = S(this, Ue).filter((i) => i.knownAt <= t).at(-1);
    if (!n) throw new Error(`No supplied replay analysis observation is known at ${t}`);
    return y(n);
  }
  advanceTo(t) {
    return this.materializeAt(t);
  }
  serializeState() {
    return R(S(this, Ue));
  }
  resumeState(t) {
    if (R(JSON.parse(t)) !== R(S(this, Ue)))
      throw new Error("Supplied replay analysis observations cannot be replaced during resume");
  }
}
Ue = new WeakMap();
function Wm() {
  Se.clear();
}
function Gm() {
  return Se.size;
}
function vi(e) {
  const t = ld(e), n = Se.get(t);
  if (n)
    return Se.delete(t), Se.set(t, n), y(n);
  const i = li(e);
  for (Se.set(t, i); Se.size > id; ) {
    const r = Se.keys().next().value;
    if (r == null) break;
    Se.delete(r);
  }
  return y(i);
}
function ld(e) {
  const t = ud(e), n = (i) => Object.fromEntries(Object.entries(i).map(([r, a]) => [
    r,
    Ke(a, t).map((o) => o.observationId)
  ]));
  return w({
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
function ud(e) {
  return Ho(e);
}
function na(e, t, n) {
  e.some((i) => i.id === n.id) || (e.push(n), t.push(Wo({
    sequence: t.length,
    kind: "materialized",
    effectiveAsOf: n.effectiveAsOf,
    analysisStateId: n.id,
    invalidatedStateIds: [],
    sourceObservationIds: fd(n)
  })));
}
function fd(e) {
  return [...new Set(Object.values(e.freshnessByComponent).flatMap((t) => t.sourceObservationIds))].sort();
}
function Wo(e) {
  const t = {
    schemaVersion: nd,
    ...e
  };
  return y({ ...t, id: Go(t) });
}
function Go(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-session-event:${w(n).slice(8)}`;
}
function dd(e, t) {
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
function md(e, t, n) {
  const i = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((c) => c.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((c) => c.observationId)
  ]), r = [
    ...Object.values(t.candlesByTimeframe).flat(),
    ...Object.values(t.referenceCandlesByTimeframe).flat()
  ].filter((c) => !i.has(c.observationId)), a = R(e.avwapAnchors ?? []) !== R(t.avwapAnchors ?? []), o = Math.min(
    ...r.map((c) => c.knownAt),
    ...a ? (t.avwapAnchors ?? []).map((c) => c.knownAt) : []
  );
  if (!Number.isFinite(o)) return null;
  const s = k(n);
  return Math.ceil(o / s) * s;
}
function vd(e, t) {
  const n = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((i) => i.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((i) => i.observationId)
  ]);
  return [
    ...Object.values(t.candlesByTimeframe).flat(),
    ...Object.values(t.referenceCandlesByTimeframe).flat()
  ].map((i) => i.observationId).filter((i) => !n.has(i)).sort();
}
function Yo(e) {
  return y({
    ...e,
    integrityHash: w(e)
  });
}
const ia = "replay-json-data.1";
function yd(e) {
  const t = Xe(e, "Replay JSON data");
  if (t.schemaVersion !== ia)
    throw new Error("Unsupported Replay JSON data schema");
  const n = lt(t.symbol, "Replay JSON data symbol").toUpperCase(), i = lt(t.source, "Replay JSON data source"), r = hi(t.candles, "candles"), a = gt(
    t.candleRevisions,
    "candleRevisions"
  ), o = hi(t.radarEpisodes, "radarEpisodes"), s = gt(
    t.analysisStateHistory,
    "analysisStateHistory"
  ), c = gt(t.knownEvents, "knownEvents"), l = gt(
    t.venueEvidence,
    "venueEvidence"
  ), u = gt(
    t.universeEvidence,
    "universeEvidence"
  ), f = Rd(
    t.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (a.length > 0 && !f)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return hd(r, a, n, i), pd(o, n, i), gd(s, n, i), Ad(c, n, i), Ed(l, n, i), bd(u, n, i), y({
    schemaVersion: ia,
    symbol: n,
    source: i,
    candles: oa(r),
    candleRevisions: oa(a),
    radarEpisodes: [...o].sort(
      (d, m) => d.detectedAt - m.detectedAt || d.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    venueEvidence: [...l].sort(sa),
    universeEvidence: [...u].sort(sa),
    revisionHistoryAvailable: f
  });
}
var K, Ce, cn, yi;
class Ym {
  constructor(t) {
    ne(this, Ce);
    ne(this, K);
    se(this, K, yd(t));
  }
  async getCoverage(t) {
    var i;
    Xo(t);
    const n = ie(this, Ce, cn).call(this, [...S(this, K).candles, ...S(this, K).candleRevisions], t);
    return y({
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: n.length ? Math.max(...n.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: S(this, K).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(t) {
    return aa(t), y(
      ie(this, Ce, cn).call(this, S(this, K).candles, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions(t) {
    return aa(t), S(this, K).revisionHistoryAvailable ? y(
      ie(this, Ce, cn).call(this, S(this, K).candleRevisions, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(t) {
    return rn(t), y(
      S(this, K).venueEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && ra(n, t)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return rn(t), y(
      S(this, K).universeEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && ra(n, t)
      )
    );
  }
  async loadAnalysisStateHistory(t) {
    return rn(t), y(
      S(this, K).analysisStateHistory.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return rn(t), ie(this, Ce, yi).call(this, t) ? y(
      S(this, K).knownEvents.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    ) : [];
  }
  async loadRadarEpisode(t) {
    if (typeof t != "string" || !t.trim())
      throw new TypeError("Radar episode id is required");
    return y(
      S(this, K).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
K = new WeakMap(), Ce = new WeakSet(), cn = function(t, n) {
  return ie(this, Ce, yi).call(this, n) ? t.filter((i) => i.timeframe === n.timeframe) : [];
}, yi = function(t) {
  return t.symbol.toUpperCase() === S(this, K).symbol && t.source === S(this, K).source;
};
function hd(e, t, n, i) {
  const r = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const s of [...e, ...t]) {
    Xe(s, "Replay candle");
    const c = k(s.timeframe);
    if (s.symbol.toUpperCase() !== n || s.source !== i || !ge(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !ge(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== Lt(s) || s.observationId !== dt(s) || !wd(s) || !jn(s.vBase) || !jn(s.vQuote) || !Td(s.revision) || !jn(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    De(a, s.observationId, s, "candle observation"), De(
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
function pd(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Xe(r, "Radar episode"), r.schemaVersion !== Ni || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== Hi(r))
      throw new Error(`Invalid radar episode ${r.id ?? "<unknown>"}`);
    De(i, r.id, r, "radar episode");
  }
}
function gd(e, t, n) {
  const i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const a of e) {
    if (Xe(a, "Replay analysis state"), a.schemaVersion !== zi || a.symbol.toUpperCase() !== t || a.source !== n || !ge(a.knownAt) || a.lifecycle.asOf == null || a.lifecycle.asOf > a.knownAt || a.id !== Sn(a))
      throw new Error(`Invalid replay analysis state ${a.id ?? "<unknown>"}`);
    De(i, a.id, a, "analysis state observation"), De(r, a.knownAt, a, "analysis state knowledge time");
  }
}
function Ad(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Xe(r, "Replay known event"), r.schemaVersion !== Qi || r.symbol.toUpperCase() !== t || r.source !== n || !ge(r.eventTime) || !ge(r.knownAt) || r.knownAt < r.eventTime || r.id !== Wi(r))
      throw new Error(`Invalid replay known event ${r.id ?? "<unknown>"}`);
    r.timeframe != null && k(r.timeframe), De(i, r.id, r, "known event");
  }
}
function Ed(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Xe(r, "Venue evidence"), r.schemaVersion !== Mi || r.symbol.toUpperCase() !== t || r.marketDataSource !== n || r.observationId !== bn(r))
      throw new Error(`Invalid execution-venue evidence ${r.observationId ?? "<unknown>"}`);
    Ko(r, "execution-venue evidence"), De(i, r.observationId, r, "execution-venue evidence");
  }
}
function bd(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Xe(r, "Universe evidence"), r.schemaVersion !== Fi || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== En(r))
      throw new Error(`Invalid universe evidence ${r.observationId ?? "<unknown>"}`);
    Ko(r, "universe evidence"), De(i, r.observationId, r, "universe evidence");
  }
}
function Ko(e, t) {
  if (!ge(e.effectiveFrom) || !ge(e.knownAt) || e.effectiveTo != null && (!ge(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${t} interval`);
}
function ra(e, t) {
  return e.knownAt <= t.to && e.effectiveFrom <= t.to && (e.effectiveTo == null || e.effectiveTo >= t.from);
}
function Xo(e) {
  lt(e.symbol, "Replay query symbol"), lt(e.source, "Replay query source"), k(e.timeframe);
}
function aa(e) {
  Xo(e), Zo(e.from, e.to);
}
function rn(e) {
  lt(e.symbol, "Replay evidence query symbol"), lt(e.source, "Replay evidence query source"), Zo(e.from, e.to);
}
function Zo(e, t) {
  if (!ge(e) || !ge(t) || t < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function oa(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function sa(e, t) {
  return e.effectiveFrom - t.effectiveFrom || e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function De(e, t, n, i) {
  const r = e.get(t);
  if (r && R(r) !== R(n))
    throw new Error(`Conflicting ${i}`);
  e.set(t, n);
}
function wd(e) {
  return an(e.o) && an(e.h) && an(e.l) && an(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function an(e) {
  return Number.isFinite(e) && e > 0;
}
function jn(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Td(e) {
  return e == null || Sd(e);
}
function Sd(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function ge(e) {
  return Number.isFinite(e) && e >= 0;
}
function Xe(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function lt(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function Rd(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function hi(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function gt(e, t) {
  return e == null ? [] : hi(e, t);
}
function Km(e, t) {
  return ro({
    ...e,
    replayEngineVersion: Fe
  }, t);
}
async function Xm(e) {
  if (e.sessionConfig.replayEngineVersion !== Fe)
    throw new RangeError("Materialized replay loading requires replay-engine.2");
  if (e.analysisProfile.executionTimeframe !== e.sessionConfig.evaluationTimeframe || e.analysisProfile.canonicalConfigHash === "" || e.analysisProfile.lifecycleConfigRef.configHash !== e.strategyProfile.lifecycleConfigHash) throw new Error("Materialized replay analysis/profile configuration mismatch");
  const t = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, n = e.analysisProfile.referenceMarketPolicy.symbol, i = e.analysisProfile.referenceMarketPolicy.source ?? e.manifest.source, r = {}, a = {}, o = {}, s = {}, c = {};
  for (const g of e.analysisProfile.evaluatedTimeframes) {
    const C = { symbol: e.manifest.symbol, source: e.manifest.source, timeframe: g }, x = { symbol: n, source: i, timeframe: g }, [B, W] = await Promise.all([
      e.analysisDataAdapter.getCoverage(C),
      e.analysisDataAdapter.getCoverage(x)
    ]);
    c[g] = B;
    const _ = Math.max(
      0,
      e.manifest.startAsOf - Od(e, g)
    ), V = la(C, B, _, t), N = la(x, W, _, t);
    r[g] = V ? await e.analysisDataAdapter.loadCandles(V) : [], a[g] = V ? await e.analysisDataAdapter.loadCandleRevisions(V) : [], o[g] = N ? await e.analysisDataAdapter.loadReferenceCandles(N) : [], s[g] = N ? await e.analysisDataAdapter.loadReferenceCandleRevisions(N) : [];
  }
  const l = fa(r, a), u = fa(o, s), f = {
    symbol: e.manifest.symbol,
    source: e.manifest.source,
    candlesByTimeframe: l,
    referenceCandlesByTimeframe: u,
    avwapAnchors: e.avwapAnchors,
    radarEpisode: await xd(e.historicalDataAdapter, e.manifest.radarEpisodeId),
    radarSelectionProfile: e.radarSelectionProfile,
    strategyProfile: e.strategyProfile,
    analysisProfile: e.analysisProfile,
    lifecycleConfig: e.lifecycleConfig
  }, d = /* @__PURE__ */ new Set([e.manifest.startAsOf]);
  for (const g of Ke(
    l[e.analysisProfile.executionTimeframe] ?? [],
    t
  ))
    g.closeTime >= e.manifest.startAsOf && g.closeTime <= t && d.add(g.closeTime);
  const m = [...d].sort((g, C) => g - C), v = [], p = [];
  let h = [], A = -1;
  const E = async (g) => {
    for (; A + 1 < m.length && m[A + 1] <= g; ) {
      A += 1;
      const C = li({
        ...f,
        asOf: m[A],
        includeIndicatorSeries: !1,
        includeComponentProvenance: !1
      });
      v.push(C), p.push(Cd(C));
    }
    return h = Id(v), { analysisStateHistory: p, knownEvents: h };
  };
  await E(e.manifest.startAsOf);
  const T = v.find((g) => g.effectiveAsOf === e.manifest.startAsOf) ?? v[0];
  if (!T) throw new Error("No materialized analysis state exists at replay start");
  const M = (e.avwapAnchors ?? []).some((g) => g.type === "manual") ? li({
    ...f,
    avwapAnchors: (e.avwapAnchors ?? []).filter((g) => g.type !== "manual"),
    asOf: T.effectiveAsOf,
    includeIndicatorSeries: !1,
    includeComponentProvenance: !1
  }) : T, I = new Pd({
    evidence: e.historicalDataAdapter,
    targetBaseByTimeframe: r,
    targetRevisionsByTimeframe: a,
    targetCoverage: c,
    observations: p,
    knownEvents: h,
    radarEpisode: f.radarEpisode
  }), b = await Hl({
    manifest: e.manifest,
    sessionConfig: e.sessionConfig,
    historicalDataAdapter: I,
    strategyProfile: e.strategyProfile,
    radarSelectionProfile: e.radarSelectionProfile,
    venueRules: e.venueRules,
    materializedAnalysisBinding: {
      replayEngineVersion: Fe,
      analysisEngineVersion: Ye,
      analysisProfileRef: {
        id: e.analysisProfile.id,
        version: e.analysisProfile.version,
        hash: e.analysisProfile.canonicalConfigHash
      },
      referenceMarket: { symbol: n, source: i },
      // Runtime manual anchors are append-only analysis actions. They must not
      // replace the immutable case/session binding established at detection.
      causalDataBundleFingerprint: M.dataBundleFingerprint,
      lifecycleConfigHash: e.strategyProfile.lifecycleConfigHash,
      radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
      strategyProfileHash: e.strategyProfile.profileHash
    }
  });
  return Ol(b, { materializeThrough: E }), b;
}
async function Zm(e) {
  var d;
  const t = e.manifest.startAsOf, n = t + e.sessionConfig.maximumCaseDuration;
  await Jn(e, n);
  const i = ee(e), r = Object.fromEntries(
    Object.entries(i.candlesByTimeframe).map(([m, v]) => [
      m,
      Ke(v, n)
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
    radarTerminalResult: f.length ? wt({ events: f }) : null,
    maximumFavorablePriceExcursionFromDetected: l && u.length ? (l - Math.min(...u.map((m) => m.l))) / l * 100 : null,
    maximumAdversePriceExcursionFromDetected: l && u.length ? (Math.max(...u.map((m) => m.h)) - l) / l * 100 : null,
    lifecycleStateTimestamps: s,
    dataQualityNotes: i.dataQualityNotes
  });
}
function Cd(e) {
  const t = Gf(e), n = jf(e);
  return Ll({
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
    relativeStrengthState: Wf(e),
    relativeStrengthEvents: e.relativeStrengthEvents.map((i) => i.value),
    visibleOrSelectedReferenceLevels: [
      ...e.activeStructureLevels,
      ...t,
      ...n ? [n.reference] : []
    ],
    dataQualityNotes: e.dataQualityNotes,
    materializedStateRef: {
      id: e.id,
      schemaVersion: Mo,
      analysisEngineVersion: e.analysisEngineVersion,
      analysisProfileHash: e.analysisProfileRef.hash,
      dataBundleFingerprint: e.dataBundleFingerprint
    }
  });
}
function Id(e) {
  const t = /* @__PURE__ */ new Map(), n = (i) => t.set(i.id, i);
  for (const i of e) {
    for (const r of i.structureEvents)
      r.evaluatedAt === i.effectiveAsOf && n(Xt({
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
        detail: wt({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.relativeStrengthEvents)
      r.evaluatedAt === i.effectiveAsOf && n(Xt({
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
        detail: wt({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.avwapEvents) {
      if (r.evaluatedAt !== i.effectiveAsOf) continue;
      const a = `:${r.value.kind}:${r.eventTime}`, o = r.logicalId.startsWith("avwap-event:") && r.logicalId.endsWith(a) ? r.logicalId.slice(12, -a.length) : null;
      n(Xt({
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
        detail: wt({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    }
    for (const r of i.lifecycleResult.transitions)
      r.knownAt === i.effectiveAsOf && n(Xt({
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
        detail: wt(r)
      }));
  }
  return y([...t.values()].sort(
    (i, r) => i.knownAt - r.knownAt || i.id.localeCompare(r.id)
  ));
}
var re;
class Pd {
  constructor(t) {
    ne(this, re);
    se(this, re, t);
  }
  async getCoverage(t) {
    return y(S(this, re).targetCoverage[t.timeframe] ?? {
      timeframe: t.timeframe,
      earliestOpenTime: null,
      latestCloseTime: null,
      revisionHistoryAvailable: !1
    });
  }
  async loadCandleHistory(t) {
    return ca(S(this, re).targetBaseByTimeframe[t.timeframe] ?? [], t);
  }
  async loadCandleRevisions(t) {
    return ca(S(this, re).targetRevisionsByTimeframe[t.timeframe] ?? [], t);
  }
  async loadAnalysisStateHistory(t) {
    return y(S(this, re).observations.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to));
  }
  async loadKnownEvents(t) {
    return y(S(this, re).knownEvents.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to));
  }
  async loadPointInTimeVenueEvidence(t) {
    var n, i;
    return ((i = (n = S(this, re).evidence).loadPointInTimeVenueEvidence) == null ? void 0 : i.call(n, t)) ?? [];
  }
  async loadPointInTimeUniverseEvidence(t) {
    var n, i;
    return ((i = (n = S(this, re).evidence).loadPointInTimeUniverseEvidence) == null ? void 0 : i.call(n, t)) ?? [];
  }
  async loadRadarEpisode(t) {
    return t === S(this, re).radarEpisode.id ? y(S(this, re).radarEpisode) : null;
  }
}
re = new WeakMap();
function ca(e, t) {
  return y(e.filter((n) => n.symbol === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe && n.openTime >= t.from && n.openTime <= t.to));
}
async function xd(e, t) {
  var i;
  const n = await ((i = e.loadRadarEpisode) == null ? void 0 : i.call(e, t));
  if (!n) throw new Error("Exact RadarEpisode sidecar is required for materialized replay");
  return n;
}
function la(e, t, n, i) {
  return t.earliestOpenTime == null ? null : { ...e, from: Math.max(t.earliestOpenTime, n), to: i };
}
function Od(e, t) {
  const n = e.manifest.preRollRequirements.filter((a) => a.timeframe === t).reduce((a, o) => Math.max(
    a,
    o.minimumDurationSeconds,
    o.minimumBars * ua(t)
  ), 0), i = e.strategyProfile.timeframeRoles, r = t === i.candidateTimeframe ? e.analysisProfile.extensionConfig.historyDays * 86400 : t === i.structureTimeframe || i.contextTimeframes.includes(t) ? 90 * 86400 : ua(t) * 250;
  return Math.max(n, r);
}
function ua(e) {
  const t = /^(\d+)(m|h|d)$/i.exec(e);
  if (!t) throw new RangeError(`Unsupported materialized replay timeframe ${e}`);
  const n = Number(t[1]), i = t[2].toLowerCase();
  return n * (i === "m" ? 60 : i === "h" ? 3600 : 86400);
}
function fa(e, t) {
  return Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)])].map(
    (n) => [n, Object.freeze([
      ...e[n] ?? [],
      ...t[n] ?? []
    ])]
  ));
}
function wt(e) {
  return y(e);
}
var Mt;
class Jm {
  constructor(t) {
    ne(this, Mt);
    se(this, Mt, y(t));
  }
  async revealCaseOutcome(t) {
    const n = S(this, Mt)[t.manifestId];
    if (!n) throw new Error(`No outcome is available for ${t.manifestId}`);
    const i = {
      schemaVersion: qi,
      sessionId: t.sessionId,
      manifestId: t.manifestId,
      revealedAt: t.revealedAt,
      revealedBeforeDecisionCompletion: t.revealedBeforeDecisionCompletion,
      outcome: n
    };
    return y({
      ...i,
      id: `replay-outcome:${w(i).slice(8)}`
    });
  }
}
Mt = new WeakMap();
function ev(e, t) {
  return xn(e), y({
    schemaVersion: no,
    id: t.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: t.type,
    payload: t.payload ?? {}
  });
}
function Jo(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && k(e.timeframe), e.type === "PriceCrossesKnownLevel" && !Wn(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!Wn(e.frozenLowerBound) || !Wn(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const t = {
    schemaVersion: _l,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map(Jo) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return y({
    ...t,
    id: `replay-wake-condition:${w(t).slice(8)}`
  });
}
function tv(e) {
  var n, i;
  if (va(e.createdAt, "wake plan createdAt"), va(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((n = e.scheduledReview) == null ? void 0 : n.mode) === "nextCompletedCandle" && k(e.scheduledReview.timeframe), ((i = e.scheduledReview) == null ? void 0 : i.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const t = {
    schemaVersion: Nl,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map(Jo),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!t.scheduledReview && !t.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return y({
    ...t,
    id: `replay-wake-plan:${w(t).slice(8)}`
  });
}
function nv(e) {
  vr(e);
  const t = {
    schemaVersion: to,
    id: es(e),
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
  return mr({
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
function es(e) {
  return `replay-session:${w({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function pi(e) {
  var p, h;
  const { loaded: t, session: n, effectiveAsOf: i } = e, r = ee(t);
  if (i < t.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const a = kt(t, i), o = y({ ...a.lifecycle, asOf: i }), s = [
    ...r.dataQualityNotes,
    ...a.dataQualityNotes,
    ...t.sessionConfig.replayEngineVersion === Tn && a.lifecycle.asOf != null && a.lifecycle.asOf < i ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${a.id} was carried forward from ${a.lifecycle.asOf}`
    }] : []
  ], c = Dc({
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
    const E = ts(
      r.candlesByTimeframe[A] ?? [],
      i
    ).filter((T) => T.openTime >= r.displayStartByTimeframe[A]);
    l[A] = E, f[A] = E.at(-1) ?? null, u[A] = {
      timeframe: A,
      displayStart: r.displayStartByTimeframe[A],
      visibleStart: ((p = E[0]) == null ? void 0 : p.openTime) ?? null,
      visibleEnd: ((h = E.at(-1)) == null ? void 0 : h.closeTime) ?? null,
      completedCandleCount: E.length
    };
  }
  const d = await at({
    effectiveAsOf: i,
    analysisObservationId: a.id,
    visibleCandlesByTimeframe: l
  }), m = n.decisionRecords.map((A) => {
    var E;
    return {
      decisionRecordId: A.id,
      frameId: ((E = n.frames.find((T) => T.decisionSnapshot.id === A.snapshotId)) == null ? void 0 : E.id) ?? "",
      action: A.action,
      decisionTime: A.decisionTime
    };
  }), v = {
    schemaVersion: kl,
    sessionId: n.id,
    manifestId: t.manifest.id,
    radarEpisodeId: t.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: i,
    evaluationTimeframe: t.sessionConfig.evaluationTimeframe,
    radarContext: kd(t),
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
    id: `replay-frame:${w(v).slice(8)}`
  });
}
function kd(e) {
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
function kt(e, t) {
  const i = ee(e).analysisStateHistory.filter(
    (r) => r.knownAt <= t
  ).at(-1);
  if (!i || i.id !== Sn(i))
    throw new Error(`No verified point-in-time analysis state is available at ${t}`);
  return i;
}
function ts(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > t || i.knownAt > t) continue;
    const r = n.get(i.logicalCandleId);
    if (!r || r.knownAt < i.knownAt) n.set(i.logicalCandleId, i);
    else if (r.knownAt === i.knownAt && R(r) !== R(i))
      throw new Error(`Conflicting candle revisions for ${i.logicalCandleId}`);
  }
  return y(
    [...n.values()].sort(
      (i, r) => i.openTime - r.openTime || i.knownAt - r.knownAt
    )
  );
}
async function iv(e, t, n, i) {
  vr(e), xn(t), us(t, e);
  const r = t.events.find((c) => c.command.id === n.id);
  if (r) {
    if (R(r.command) !== R(n))
      throw new Error(`Command id ${n.id} was reused with a different payload`);
    return { session: y(t), event: r, outcomeEnvelope: null, idempotent: !0 };
  }
  ns(t, n), n.type === "StartSession" && await Jn(e, e.manifest.startAsOf);
  let a, o = null;
  if (n.type === "StartSession") {
    if (t.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await pi({
      loaded: e,
      session: t,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    a = tt(n, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (t.state !== "Active" && n.type !== "RevealOutcome")
      throw new Error(`Command ${n.type} is not allowed while session is ${t.state}`);
    const c = gi(t);
    if (n.type === "Wait") {
      is(e, t, c, n.payload.wakePlan);
      const l = os(
        e,
        c.effectiveAsOf,
        n.payload.wakePlan.scheduledReview
      );
      await Jn(
        e,
        Math.min(
          n.payload.wakePlan.deadlineAsOf,
          e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration,
          l ?? 1 / 0
        )
      );
      const u = Hn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [n.payload.reason, ...n.payload.tags ?? []],
        nextCondition: Vd(n.payload.wakePlan)
      }), f = await as(
        e,
        t,
        c,
        n.payload.wakePlan
      ), d = y({
        ...t,
        decisionRecords: [...t.decisionRecords, u]
      }), m = await pi({
        loaded: e,
        session: d,
        requestedAsOf: f.requestedAsOf,
        effectiveAsOf: f.effectiveAsOf,
        wakeResult: f.wakeResult
      });
      a = tt(n, f.state, m.effectiveAsOf, {
        frame: m,
        decisionRecord: u,
        wakePlan: n.payload.wakePlan,
        wakeResult: f.wakeResult,
        terminalReason: f.terminalReason
      });
    } else if (n.type === "Skip") {
      if (!n.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const l = Hn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [...n.payload.tags ?? [], ...n.payload.reasons.slice(1)],
        skipReason: n.payload.reasons[0]
      });
      a = tt(n, "Skipped", c.effectiveAsOf, {
        decisionRecord: l
      });
    } else if (n.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const l = cu({
        ...n.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), u = Fd(e, l), f = y({
        id: `replay-planning-attempt:${w({
          sessionId: t.id,
          frameId: c.id,
          tradePlan: l
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: l,
        accepted: u == null,
        rejectionReason: u
      }), d = u ? null : Hn({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: l
      });
      a = tt(
        n,
        u ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: f, decisionRecord: d }
      );
    } else if (n.type === "Abandon") {
      if (!n.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      a = tt(n, "Abandoned", c.effectiveAsOf);
    } else {
      const l = await Qd(e, t, n, i);
      o = l.envelope, a = tt(n, "Revealed", l.revealedAt, {
        terminalReason: t.terminalReason,
        revealedBeforeDecisionCompletion: l.early,
        outcomeEnvelopeId: l.envelope.id
      });
    }
  }
  const s = Nd(t, a);
  return {
    session: dr(t, s),
    event: s,
    outcomeEnvelope: o,
    idempotent: !1
  };
}
function tt(e, t, n, i = {}) {
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
function Nd(e, t) {
  const n = {
    schemaVersion: io,
    sequence: e.revision + 1,
    ...t
  };
  return y({
    ...n,
    id: `replay-event:${w(n).slice(8)}`
  });
}
function dr(e, t) {
  var n;
  if (t.schemaVersion !== io)
    throw new Error("Replay event schema is invalid");
  if (t.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (t.id !== Md(t)) throw new Error("Replay event identity is invalid");
  if (t.command.sessionId !== e.id || t.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (t.frame) {
    const { id: i, ...r } = t.frame;
    if (t.frame.id !== `replay-frame:${w(r).slice(8)}` || t.frame.sessionId !== e.id || t.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    yr(t.frame);
  }
  if (t.decisionRecord && t.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (t.wakePlan && t.wakePlan.id !== rs(t.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (t.wakeResult) {
    const { id: i, ...r } = t.wakeResult;
    if (t.wakeResult.id !== `replay-wake-result:${w(r).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return _d(e, t), mr({
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
function _d(e, t) {
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
    const m = ((f = t.planningAttempt) == null ? void 0 : f.accepted) === !0, v = t.planningAttempt ? `replay-planning-attempt:${w({
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
function Md(e) {
  const { id: t, ...n } = e;
  return `replay-event:${w(n).slice(8)}`;
}
function ns(e, t) {
  if (t.schemaVersion !== no || !t.id.trim())
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
function gi(e) {
  const t = e.frames.find((n) => n.id === e.currentFrameId);
  if (!t || t.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return t;
}
function Fd(e, t) {
  if (t.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (t.sizingResult.sizingModelVersion !== co)
    return "Sizing model version mismatch";
  if (t.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (t.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (t.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && R(t.venueRules) !== R(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const n = e.manifest.executionVenueEligibility.executionVenue, i = e.manifest.executionVenueEligibility.marketDataSource, r = t.venueRules.venue.toLowerCase();
  return n && r !== n.toLowerCase() && r !== i.toLowerCase() ? "Trade plan venue does not match the intended or proxy execution venue" : Ld(e, t.createdAt, n) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function Ld(e, t, n) {
  const i = ee(e).venueEvidence.filter(
    (a) => a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo > t) && a.executionVenue.toLowerCase() === n.toLowerCase()
  ).at(-1);
  if (i) return i.status;
  const r = e.manifest.executionVenueEligibility;
  return r.effectiveFrom <= t && (r.effectiveTo == null || r.effectiveTo > t) ? r.status : "Unavailable";
}
function is(e, t, n, i) {
  var r;
  if (i.id !== rs(i)) throw new Error("Wake plan identity is invalid");
  if (i.submittedFrameId !== n.id || i.createdAt !== n.effectiveAsOf)
    throw new Error("Wake plan must be frozen against the current frame");
  if (i.deadlineAsOf > n.effectiveAsOf + e.sessionConfig.maximumSingleWaitDuration || i.deadlineAsOf > e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration)
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  if (((r = i.scheduledReview) == null ? void 0 : r.mode) === "nextCompletedCandle" && !Object.hasOwn(
    ee(e).candlesByTimeframe,
    i.scheduledReview.timeframe
  ))
    throw new RangeError(
      `Scheduled review timeframe ${i.scheduledReview.timeframe} is not loaded`
    );
  for (const a of Pn(i.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(a.type))
      throw new RangeError(`Wake condition ${a.type} is not allowed`);
    if (a.id !== Hd(a))
      throw new Error(`Wake condition ${a.id} failed deterministic verification`);
  }
  if (Dd(n, i.conditions), Bd(e, n, i.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (t.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function rs(e) {
  const { id: t, ...n } = e;
  return `replay-wake-plan:${w(n).slice(8)}`;
}
function Hd(e) {
  const { id: t, ...n } = e;
  return `replay-wake-condition:${w(n).slice(8)}`;
}
function Dd(e, t) {
  const n = Ha(e.decisionSnapshot);
  for (const i of Pn(t)) {
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
function Bd(e, t, n) {
  for (const i of Pn(n)) {
    if (i.type === "LifecycleStateEntered" && t.lifecycleState === i.state) return !0;
    if (i.type === "PriceCrossesKnownLevel") {
      const r = Nt(e, i.timeframe, t.effectiveAsOf);
      if (r != null && (i.direction === "above" && r >= i.frozenPrice || i.direction === "below" && r <= i.frozenPrice)) return !0;
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = Nt(e, i.timeframe, t.effectiveAsOf);
      if (r != null && r >= i.frozenLowerBound && r <= i.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function Pn(e) {
  return e.flatMap(
    (t) => t.type === "AnyOf" ? [t, ...Pn(t.conditions)] : [t]
  );
}
function Vd(e) {
  return R({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((t) => t.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function as(e, t, n, i) {
  var I;
  const r = n.effectiveAsOf, a = ee(e), o = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = $d(e), c = os(e, r, i.scheduledReview), l = ((I = i.scheduledReview) == null ? void 0 : I.mode) === "elapsedDuration" ? r + i.scheduledReview.durationSeconds : c ?? i.deadlineAsOf, u = Math.min(i.deadlineAsOf, o, s);
  if (u < r) throw new Error("Historical coverage ends before the replay clock");
  const f = /* @__PURE__ */ new Set([u]);
  for (const b of a.analysisStateHistory)
    b.knownAt > r && b.knownAt <= u && f.add(b.knownAt);
  for (const b of a.knownEvents)
    b.knownAt > r && b.knownAt <= u && f.add(b.knownAt);
  for (const b of Object.values(a.candlesByTimeframe))
    for (const g of b) {
      const C = Math.max(g.closeTime, g.knownAt);
      C > r && C <= u && f.add(C);
    }
  c != null && c > r && c <= u && f.add(c), i.deadlineAsOf > r && i.deadlineAsOf <= u && f.add(i.deadlineAsOf), o > r && o <= u && f.add(o), s > r && s <= u && f.add(s);
  const d = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null
  }, m = [...f].sort((b, g) => b - g);
  let v = u, p = "DEADLINE_REACHED", h = [], A = [], E = null;
  for (const b of m) {
    d.evaluationPointsChecked.push(b);
    const g = Ud(e, b, r);
    d.lifecycleTransitionsEncountered.push(...g);
    const C = ss(e, i.conditions, r, b, d), x = zd(e, b, r);
    if (x) {
      v = b, p = "CASE_BOUNDARY_REACHED", E = x, h = C.conditionIds, A = C.eventIds, C.conditionIds.length && (d.firstTriggeringEffectiveAsOf = b);
      break;
    }
    if (C.conditionIds.length) {
      v = b, p = "CONDITION_TRIGGERED", h = C.conditionIds, A = C.eventIds, d.firstTriggeringEffectiveAsOf = b;
      break;
    }
    if (c != null && b >= c) {
      v = b, p = "SCHEDULED_REVIEW";
      break;
    }
    if (b >= u) {
      v = u, u === o ? (p = "CASE_BOUNDARY_REACHED", E = "MAXIMUM_CASE_DURATION") : u === s ? (p = "CASE_BOUNDARY_REACHED", E = "DATA_COVERAGE_ENDED") : p = "DEADLINE_REACHED";
      break;
    }
  }
  const T = {
    schemaVersion: Ml,
    wakePlanId: i.id,
    startedAt: r,
    effectiveAsOf: v,
    reason: p,
    triggeredConditionIds: [...new Set(h)],
    triggeringEventIds: [...new Set(A)],
    auditTrace: d
  }, M = y({
    ...T,
    id: `replay-wake-result:${w(T).slice(8)}`
  });
  return {
    requestedAsOf: l,
    effectiveAsOf: v,
    state: E ? "CaseWindowEnded" : "Active",
    terminalReason: E,
    wakeResult: M
  };
}
function os(e, t, n) {
  if (!n) return null;
  if (n.mode === "nextCompletedCandle")
    return da(e, n.timeframe, t);
  const i = k(e.sessionConfig.evaluationTimeframe), r = t + n.durationSeconds, a = Math.ceil(r / i) * i;
  return da(e, e.sessionConfig.evaluationTimeframe, a - 1);
}
function da(e, t, n) {
  return (ee(e).candlesByTimeframe[t] ?? []).filter((i) => i.closeTime > n).map((i) => Math.max(i.closeTime, i.knownAt)).sort((i, r) => i - r)[0] ?? null;
}
function $d(e) {
  const n = (ee(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((i) => i.closeTime);
  return n.length ? Math.max(...n) : e.manifest.startAsOf;
}
function Ud(e, t, n) {
  var o;
  const i = ee(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === t && s.knownAt > n
  ).map((s) => s.id), r = (o = Ai(e, t)) == null ? void 0 : o.lifecycle.currentState, a = kt(e, t);
  return r !== a.lifecycle.currentState && i.push(a.id), [...new Set(i)];
}
function Ai(e, t) {
  return ee(e).analysisStateHistory.filter((n) => n.knownAt < t).at(-1) ?? null;
}
function ss(e, t, n, i, r) {
  const a = [], o = [];
  for (const s of t) {
    const c = qd(e, s, n, i, r);
    c.matched && (a.push(...c.conditionIds), o.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(a)], eventIds: [...new Set(o)] };
}
function qd(e, t, n, i, r) {
  var l, u;
  if (t.type === "AnyOf") {
    const f = ss(e, t.conditions, n, i, r), d = f.conditionIds.length > 0;
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
  const a = ee(e).knownEvents.filter(
    (f) => f.knownAt === i && f.knownAt > n
  );
  let o = [], s = !1;
  if (t.type === "NextLifecycleTransition")
    o = a.filter((f) => f.kind === "lifecycleTransition"), s = o.length > 0 || ((l = Ai(e, i)) == null ? void 0 : l.lifecycle.currentState) !== kt(e, i).lifecycle.currentState;
  else if (t.type === "LifecycleStateEntered")
    o = a.filter(
      (f) => f.kind === "lifecycleTransition" && f.lifecycleState === t.state
    ), s = o.length > 0 || kt(e, i).lifecycle.currentState === t.state && ((u = Ai(e, i)) == null ? void 0 : u.lifecycle.currentState) !== t.state;
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
    const f = ma(e, t.timeframe, i), d = Nt(e, t.timeframe, i);
    s = f != null && d != null && (t.direction === "above" ? f < t.frozenPrice && d >= t.frozenPrice : f > t.frozenPrice && d <= t.frozenPrice);
  } else if (t.type === "PriceEntersKnownZone") {
    const f = ma(e, t.timeframe, i), d = Nt(e, t.timeframe, i), m = (v) => v >= t.frozenLowerBound && v <= t.frozenUpperBound;
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
function zd(e, t, n) {
  const i = ee(e).knownEvents.filter(
    (r) => r.knownAt === t && r.knownAt > n
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && i.some((r) => r.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (i.some((r) => r.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(kt(e, t).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function Nt(e, t, n) {
  var i;
  return ((i = ts(
    ee(e).candlesByTimeframe[t] ?? [],
    n
  ).at(-1)) == null ? void 0 : i.c) ?? null;
}
function ma(e, t, n) {
  const r = (ee(e).candlesByTimeframe[t] ?? []).map((a) => Math.max(a.closeTime, a.knownAt)).filter((a) => a < n);
  return r.length ? Nt(e, t, Math.max(...r)) : null;
}
async function Qd(e, t, n, i) {
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
  return jd(t, s, a), { envelope: s, early: a, revealedAt: o };
}
function jd(e, t, n) {
  const { id: i, ...r } = t;
  if (t.schemaVersion !== qi || t.id !== `replay-outcome:${w(r).slice(8)}` || t.sessionId !== e.id || t.manifestId !== e.manifestId || t.revealedBeforeDecisionCompletion !== n)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function rv(e) {
  xn(e), fs(e);
  for (const t of e.frames) yr(t);
  return R(e);
}
function Wd(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized replay session must be an object");
  const n = t;
  xn(n), fs(n);
  for (const i of n.frames) yr(i);
  return y(n);
}
async function av(e, t) {
  const n = Wd(e);
  vr(t), us(n, t);
  const i = Gd(n);
  if (R(i) !== R(n))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (n.currentAsOf != null && n.currentFrameId != null) {
    const r = gi(n), a = n.events.findIndex((u) => {
      var f;
      return ((f = u.frame) == null ? void 0 : f.id) === r.id;
    });
    if (a < 0) throw new Error("Current replay frame is absent from the event log");
    let o = cs(ls(n));
    for (const u of n.events.slice(0, a))
      o = dr(o, u);
    const s = n.events[a];
    let c = r.activeWakeResult;
    if (s.command.type === "Wait") {
      const u = gi(o);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      is(
        t,
        o,
        u,
        s.wakePlan
      );
      const f = await as(
        t,
        o,
        u,
        s.wakePlan
      );
      if (R(f.wakeResult) !== R(s.wakeResult) || f.requestedAsOf !== r.requestedAsOf || f.effectiveAsOf !== r.effectiveAsOf || f.state !== s.stateAfter || f.terminalReason !== s.terminalReasonAfter)
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      c = f.wakeResult;
    }
    if (s.decisionRecord && (o = y({
      ...o,
      decisionRecords: [...o.decisionRecords, s.decisionRecord]
    })), (await pi({
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
function Gd(e) {
  let t = cs(ls(e));
  const n = /* @__PURE__ */ new Set();
  for (const i of e.events) {
    if (n.has(i.command.id)) throw new Error("Replay event log repeats a command id");
    n.add(i.command.id), ns(t, i.command), t = dr(t, i);
  }
  return t;
}
function cs(e) {
  return mr({
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
function ls(e) {
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
function mr(e) {
  const { integrityHash: t, ...n } = e;
  return y({ ...n, integrityHash: w(n) });
}
function xn(e) {
  if (e.schemaVersion !== to || !Rn(e.replayEngineVersion)) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: t, ...n } = e;
  if (t !== w(n)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function vr(e) {
  if (ji(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || !Rn(e.sessionConfig.replayEngineVersion) || e.sessionConfig.replayEngineVersion === Fe && !e.materializedAnalysisBinding || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function us(e, t) {
  if (e.id !== es(t) || e.manifestId !== t.manifest.id || e.radarEpisodeId !== t.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== t.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== t.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== t.strategyProfile.profileHash || e.lifecycleVersion !== t.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== t.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== t.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== t.dataBundle.causalPrefixFingerprint || e.replayEngineVersion !== t.sessionConfig.replayEngineVersion || R(e.materializedAnalysisRef ?? null) !== R(t.materializedAnalysisBinding ?? null) || R(e.venueRulesRef) !== R(t.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function yr(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const t of Object.values(e.visibleCandlesByTimeframe))
    if (t.some((n) => n.closeTime > e.effectiveAsOf || n.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  Yd(e, e.effectiveAsOf);
}
function Yd(e, t) {
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
function fs(e) {
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
function Wn(e) {
  return Number.isFinite(e) && e > 0;
}
function va(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
const Kd = "trainer-ui.1", ov = "trainer-worker-protocol.1", Xd = "trainer-presentation-profile.1", Zd = "trainer-study-run.1", sv = "trainer-study-case.1", Jd = "trainer-case-bundle.1", cv = "trainer-public-frame.1", lv = "trainer-analysis-action.1", em = "trainer-review-record.1", uv = "trainer-local-store.1", tm = "trainer-corpus-index.1";
function fv(e) {
  const t = y(e), n = {
    ...t,
    bundleFingerprint: ds(t)
  };
  return nm(n), y(n);
}
function ds(e) {
  const { bundleFingerprint: t, ...n } = e;
  return w(n);
}
function nm(e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError("TrainerCaseBundle must be an object");
  const t = e;
  if (t.schemaVersion !== Jd)
    throw new Error(`Unsupported trainer case bundle schema: ${String(t.schemaVersion)}`);
  if (Ie(t.bundleId, "bundleId"), Ie(t.bundleFingerprint, "bundleFingerprint"), t.bundleFingerprint !== ds(t))
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
function dv(e, t) {
  Ie(e, "corpus id"), ms(t.map((i) => i.id), "case id");
  const n = {
    schemaVersion: tm,
    id: e,
    cases: y(t)
  };
  return y({ ...n, fingerprint: w(n) });
}
function mv(e, t, n, i = {}) {
  if (Ie(t, "selection seed"), !Number.isInteger(n) || n < 1) throw new RangeError("Case count must be positive");
  const r = e.cases.filter((o) => im(o, i)), a = /* @__PURE__ */ new Map();
  for (const o of r)
    a.has(o.radarEpisodeId) || a.set(o.radarEpisodeId, o);
  return y([...a.values()].sort((o, s) => {
    const c = w({ seed: t, corpus: e.fingerprint, caseId: o.id }), l = w({ seed: t, corpus: e.fingerprint, caseId: s.id });
    return c.localeCompare(l) || o.id.localeCompare(s.id);
  }).slice(0, n));
}
function vv(e, t, n = !1) {
  return y(!t || n ? e : {
    ...e,
    detectedAt: null,
    symbol: null,
    source: null
  });
}
function yv(e) {
  if (e.schemaVersion !== Xd)
    throw new Error("Unsupported trainer presentation profile schema");
  if (Ie(e.id, "presentation profile id"), Ie(e.version, "presentation profile version"), !e.paneTimeframes.length || e.paneTimeframes.length > 4)
    throw new RangeError("A presentation profile requires one to four panes");
  return y({ ...e, canonicalConfigHash: w(e) });
}
function hv(e) {
  if (Ie(e.id, "study run id"), Ie(e.selectionSeed, "selection seed"), e.requestedCaseCount !== e.selectedCaseIds.length)
    throw new Error("Requested and selected case counts must match");
  ms(e.selectedCaseIds, "selected case id");
  const t = {
    ...y(e),
    schemaVersion: Zd,
    trainerVersion: Kd
  };
  return y({ ...t, canonicalConfigHash: w(t) });
}
function pv(e) {
  if (Ie(e.id, "review id"), e.decisionQualityRating != null && (!Number.isInteger(e.decisionQualityRating) || e.decisionQualityRating < 1 || e.decisionQualityRating > 5)) throw new RangeError("Decision quality rating must be from 1 through 5");
  return y({
    ...e,
    schemaVersion: em
  });
}
function im(e, t) {
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
function Ie(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
}
function ms(e, t) {
  if (new Set(e).size !== e.length) throw new Error(`Duplicate ${t}`);
}
export {
  ci as $,
  Fo as A,
  _c as B,
  pm as C,
  su as D,
  Xi as E,
  go as F,
  Mc as G,
  Ne as H,
  At as I,
  qm as J,
  Ru as K,
  Rm as L,
  Jm as M,
  Kf as N,
  Fm as O,
  Ym as P,
  Mo as Q,
  $t as R,
  Qm as S,
  Su as T,
  Ni as U,
  _i as V,
  jc as W,
  Da as X,
  Wc as Y,
  Gc as Z,
  Fi as _,
  Yl as a,
  sm as a$,
  Rf as a0,
  Ye as a1,
  Vm as a2,
  Xr as a3,
  Sf as a4,
  _o as a5,
  nd as a6,
  fr as a7,
  zi as a8,
  Ba as a9,
  sv as aA,
  Zd as aB,
  Kd as aC,
  ov as aD,
  Zi as aE,
  Tu as aF,
  qu as aG,
  ad as aH,
  um as aI,
  iv as aJ,
  ot as aK,
  uo as aL,
  Be as aM,
  qe as aN,
  br as aO,
  gs as aP,
  Sm as aQ,
  R as aR,
  Zl as aS,
  ni as aT,
  Wm as aU,
  xm as aV,
  Si as aW,
  js as aX,
  Qs as aY,
  ks as aZ,
  mm as a_,
  no as aa,
  Fl as ab,
  kl as ac,
  Tn as ad,
  io as ae,
  ia as af,
  Qi as ag,
  Fe as ah,
  qi as ai,
  Ui as aj,
  to as ak,
  _l as al,
  Nl as am,
  Ml as an,
  co as ao,
  ou as ap,
  Nc as aq,
  jm as ar,
  lo as as,
  lv as at,
  Jd as au,
  tm as av,
  uv as aw,
  Xd as ax,
  cv as ay,
  em as az,
  Gl as b,
  Ho as b$,
  xs as b0,
  st as b1,
  ym as b2,
  _e as b3,
  xa as b4,
  Ys as b5,
  vm as b6,
  Ns as b7,
  fm as b8,
  Os as b9,
  If as bA,
  zm as bB,
  Ll as bC,
  ao as bD,
  ev as bE,
  Xt as bF,
  nv as bG,
  ro as bH,
  Jo as bI,
  tv as bJ,
  Nm as bK,
  La as bL,
  cu as bM,
  fv as bN,
  dv as bO,
  yv as bP,
  pv as bQ,
  hv as bR,
  bm as bS,
  Iu as bT,
  km as bU,
  Fc as bV,
  ki as bW,
  Ha as bX,
  Bm as bY,
  sd as bZ,
  Wd as b_,
  Gs as ba,
  gm as bb,
  Pa as bc,
  Ws as bd,
  cm as be,
  dm as bf,
  Um as bg,
  Pm as bh,
  Hn as bi,
  Oi as bj,
  Dc as bk,
  Cm as bl,
  Xn as bm,
  er as bn,
  Cu as bo,
  wo as bp,
  tr as bq,
  bo as br,
  Kc as bs,
  Om as bt,
  $m as bu,
  To as bv,
  Lc as bw,
  Km as bx,
  Yc as by,
  Em as bz,
  w as c,
  ds as c$,
  ba as c0,
  hm as c1,
  lu as c2,
  _m as c3,
  Ao as c4,
  bn as c5,
  Eo as c6,
  zu as c7,
  ut as c8,
  Ei as c9,
  ld as cA,
  Gm as cB,
  Lo as cC,
  Wf as cD,
  cd as cE,
  Sn as cF,
  Gf as cG,
  Lt as cH,
  dt as cI,
  qa as cJ,
  Im as cK,
  Wi as cL,
  ji as cM,
  at as cN,
  av as cO,
  Lm as cP,
  Tm as cQ,
  hn as cR,
  Ke as cS,
  mv as cT,
  Dm as cU,
  od as cV,
  rv as cW,
  Hm as cX,
  Ft as cY,
  yn as cZ,
  Ki as c_,
  Rn as ca,
  Am as cb,
  Mm as cc,
  Xm as cd,
  Hl as ce,
  lm as cf,
  li as cg,
  rd as ch,
  Zm as ci,
  Id as cj,
  Cd as ck,
  As as cl,
  ha as cm,
  am as cn,
  pa as co,
  Fu as cp,
  Yf as cq,
  yd as cr,
  om as cs,
  Hi as ct,
  Li as cu,
  Va as cv,
  bf as cw,
  Gd as cx,
  vv as cy,
  jf as cz,
  Mr as d,
  En as d0,
  lr as d1,
  Ut as d2,
  nm as d3,
  Ji as d4,
  Kl as e,
  Fa as f,
  Hc as g,
  bu as h,
  y as i,
  Ht as j,
  yo as k,
  Au as l,
  Vr as m,
  gu as n,
  wu as o,
  mo as p,
  po as q,
  Eu as r,
  k as s,
  Uu as t,
  vo as u,
  ho as v,
  Mi as w,
  wm as x,
  Ps as y,
  ye as z
};
