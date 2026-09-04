var Da = Object.defineProperty;
var rr = (e) => {
  throw TypeError(e);
};
var Ha = (e, n, t) => n in e ? Da(e, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[n] = t;
var ge = (e, n, t) => Ha(e, typeof n != "symbol" ? n + "" : n, t), St = (e, n, t) => n.has(e) || rr("Cannot " + t);
var R = (e, n, t) => (St(e, n, "read from private field"), t ? t.call(e) : n.get(e)), Z = (e, n, t) => n.has(e) ? rr("Cannot add the same private member more than once") : n instanceof WeakSet ? n.add(e) : n.set(e, t), te = (e, n, t, i) => (St(e, n, "write to private field"), i ? i.call(e, t) : n.set(e, t), t), J = (e, n, t) => (St(e, n, "access private method"), t);
function S(e) {
  const n = /* @__PURE__ */ new Set();
  function t(r, o = !1) {
    if (r === null) return "null";
    if (typeof r == "string" || typeof r == "boolean")
      return JSON.stringify(r);
    if (typeof r == "number") {
      if (!Number.isFinite(r))
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      return Object.is(r, -0) ? "0" : JSON.stringify(r);
    }
    if (r === void 0) return o ? "null" : void 0;
    if (typeof r != "object")
      throw new TypeError(`Canonical JSON does not support ${typeof r}`);
    if (Object.getPrototypeOf(r) !== Object.prototype && !Array.isArray(r))
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    if (n.has(r)) throw new TypeError("Canonical JSON does not support cycles");
    n.add(r);
    let a;
    return Array.isArray(r) ? a = `[${r.map((s) => t(s, !0) ?? "null").join(",")}]` : a = `{${Object.keys(r).sort().flatMap((c) => {
      const l = t(r[c]);
      return l == null ? [] : [`${JSON.stringify(c)}:${l}`];
    }).join(",")}}`, n.delete(r), a;
  }
  const i = t(e);
  if (i == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return i;
}
function w(e) {
  const n = new TextEncoder().encode(S(e));
  let t = 0xcbf29ce484222325n;
  for (const i of n)
    t ^= BigInt(i), t = BigInt.asUintN(64, t * 0x100000001b3n);
  return `fnv1a64:${t.toString(16).padStart(16, "0")}`;
}
function h(e) {
  return zr(JSON.parse(S(e)));
}
function zr(e) {
  if (e && typeof e == "object") {
    for (const n of Object.values(e)) zr(n);
    Object.freeze(e);
  }
  return e;
}
const or = 5;
function st(e) {
  const n = String(e).trim().toLowerCase();
  return n.endsWith("m") ? parseInt(n, 10) * 60 : n.endsWith("h") ? parseInt(n, 10) * 60 * 60 : n.endsWith("d") ? parseInt(n, 10) * 24 * 60 * 60 : parseInt(n, 10) * 60;
}
function oi(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const n = Number.parseInt(e, 10), t = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(n) && Number.isSafeInteger(n * t);
}
function _(e) {
  if (!oi(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return st(e);
}
function Be(e, n) {
  return e.knownAt ?? e.bucket + _(n);
}
function ct(e, n, t) {
  const i = _(n), r = /* @__PURE__ */ new Map(), o = e.filter((a) => {
    if (!Number.isFinite(a.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (a.bucket + i > t) return !1;
    if (a.knownAt != null && !Number.isFinite(a.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${a.bucket}`);
    return Be(a, n) <= t;
  });
  for (const a of [...o].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!Ga(a) || a.bucket % i !== 0 || Math.floor(a.ts / i) * i !== a.bucket)
      throw new RangeError(`Invalid candle for bucket ${a.bucket}`);
    const s = Be(a, n);
    if (s < a.bucket + i)
      throw new RangeError(`Candle revision predates close for bucket ${a.bucket}`);
    const c = r.get(a.bucket);
    if (c) {
      const l = Be(c, n);
      if (l === s && cr(c, n) !== cr(a, n))
        throw new Error(`Conflicting candle revisions for bucket ${a.bucket} at ${s}`);
      if (l > s) continue;
    }
    r.set(a.bucket, a);
  }
  return [...r.values()].sort((a, s) => a.bucket - s.bucket);
}
function ld(e) {
  const n = String(e).trim().toLowerCase();
  return n === "60" ? "1h" : n.endsWith("m") || n.endsWith("h") || n.endsWith("d") ? n : `${n}m`;
}
function rn(e, n) {
  return Math.floor(e / n) * n;
}
function Qr(e) {
  const n = Yr(e);
  if (!n || typeof n != "object") return null;
  const t = n, i = sr(t.ts), r = me(t.o), o = me(t.h), a = me(t.l), s = me(t.c), c = t.knownAt == null ? void 0 : sr(t.knownAt);
  return i == null || r == null || o == null || a == null || s == null || t.knownAt != null && c == null ? null : {
    ts: i,
    o: r,
    h: o,
    l: a,
    c: s,
    v_base: me(t.v_base),
    v_quote: me(t.v_quote),
    ver: me(t.ver),
    knownAt: c ?? void 0
  };
}
function jr(e, n, t) {
  const i = st(n), r = Ua(
    e.map((s, c) => Wr(s, c)).filter((s) => s != null),
    i
  ).slice(-Math.max(1, t));
  if (!r.length)
    return {
      timeframeSec: i,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const o = rn(r[0].ts, i), a = r.map((s) => {
    const c = rn(s.ts, i);
    return {
      ...s,
      bucket: c,
      x: (c - o) / i
    };
  });
  return ai({
    timeframeSec: i,
    firstBucket: o,
    candles: a,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function ud(e, n, t) {
  const i = e.candles.length, r = n.map((a, s) => Wr(a, s)).filter((a) => a != null).filter((a) => rn(a.ts, e.timeframeSec) < e.firstBucket).sort(Gr);
  if (!r.length) return 0;
  const o = jr(
    [...r, ...e.candles],
    t,
    r.length + e.candles.length
  );
  return e.timeframeSec = o.timeframeSec, e.firstBucket = o.firstBucket, e.candles = o.candles, e.positionByBucket = o.positionByBucket, Math.max(0, e.candles.length - i);
}
function Ba(e) {
  const n = new Float32Array(e.length * or);
  return e.forEach((t, i) => {
    n.set([t.x, t.o, t.h, t.l, t.c], i * or);
  }), new Uint8Array(n.buffer);
}
function ar(e) {
  const n = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(n.buffer);
}
function fd(e) {
  if (e.length < 2) return null;
  const n = e[e.length - 2], t = e[e.length - 1];
  return !Number.isFinite(n.c) || !Number.isFinite(t.c) || n.c === 0 ? null : (t.c - n.c) / Math.abs(n.c) * 100;
}
function Va(e, n, t, i = 3) {
  const r = Qr(n);
  if (!r) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const o = rn(r.ts, e.timeframeSec);
  if (o < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const a = e.positionByBucket.get(o), s = (o - e.firstBucket) / e.timeframeSec, c = { ...r, bucket: o, x: s };
  if (a != null)
    return Wa(c, e.candles[a]) ? { kind: "ignore", reason: "stale-version" } : ja(e.candles[a], c) ? (e.candles[a] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[a] = c, {
      kind: "replace",
      position: a,
      bytes: ar(c)
    });
  const l = e.candles[e.candles.length - 1];
  return o <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (o - l.bucket) / e.timeframeSec > i ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, t) ? (e.candles.splice(0, e.candles.length - Math.max(1, t)), $a(e), { kind: "reset", bytes: Ba(e.candles) }) : (ai(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: ar(c)
  }));
}
function dd(e, n = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let t = 1 / 0, i = -1 / 0;
  for (const a of e)
    t = Math.min(t, a.l), i = Math.max(i, a.h);
  for (const a of n)
    for (let s = 1; s < a.length; s += 2) {
      const c = a[s];
      Number.isFinite(c) && (t = Math.min(t, c), i = Math.max(i, c));
    }
  const o = Math.max(1e-9, i - t) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: t - o,
    maxY: i + o
  };
}
function md(e, n, t) {
  const i = st(t), r = Math.floor(Date.now() / 1e3), o = rn(r, i), a = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), s = [];
  let c = 40 + a % 160;
  for (let l = Math.max(1, n) - 1; l >= 0; l--) {
    const u = o - l * i, f = Math.sin((n - l + a) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((n - l) / 13) * 0.35), v = Math.max(d, m) + 0.35 + Math.abs(Math.sin(l + a)) * 0.5, p = Math.min(d, m) - 0.35 - Math.abs(Math.cos(l + a)) * 0.5, y = 50 + a % 90 + Math.abs(Math.sin((n - l + a) / 5)) * 180;
    s.push({ ts: u, o: d, h: v, l: p, c: m, v_base: y, v_quote: y * m }), c = m;
  }
  return jr(s, t, n);
}
function vd(e, n) {
  const t = e.candles[e.candles.length - 1];
  if (!t) return { kind: "ignore", reason: "empty-history" };
  const i = t.bucket + e.timeframeSec, r = Math.sin(i / 600) * 0.7, o = t.c, a = Math.max(1e-4, o + r), s = Math.max(o, a) + 0.5, c = Math.min(o, a) - 0.5, l = Math.max(1, (t.v_base ?? 100) * (0.82 + Math.abs(r) * 0.36));
  return Va(e, { ts: i, o, h: s, l: c, c: a, v_base: l, v_quote: l * a }, n);
}
function $a(e) {
  const n = e.candles[0];
  e.firstBucket = n ? n.bucket : 0;
  for (const t of e.candles)
    t.x = (t.bucket - e.firstBucket) / e.timeframeSec;
  ai(e);
}
function ai(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((n, t) => {
    e.positionByBucket.set(n.bucket, t);
  }), e;
}
function Wr(e, n) {
  const t = Qr(e);
  return t ? { ...t, sourceOrder: n } : null;
}
function Ua(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = rn(i.ts, n), o = t.get(r);
    (!o || Gr(i, o) > 0) && t.set(r, i);
  }
  return Array.from(t.entries()).sort(([i], [r]) => i - r).map(([, i]) => qa(i));
}
function Gr(e, n) {
  const t = e.ver ?? Number.NEGATIVE_INFINITY, i = n.ver ?? Number.NEGATIVE_INFINITY;
  return t !== i ? t - i : e.ts !== n.ts ? e.ts - n.ts : e.sourceOrder - n.sourceOrder;
}
function qa(e) {
  const { sourceOrder: n, ...t } = e;
  return t;
}
function sr(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const n = Date.parse(e);
    return Number.isNaN(n) ? null : Math.floor(n / 1e3);
  }
  if (Array.isArray(e)) {
    const n = e.length >= 9 ? za(e) : Qa(e);
    return Number.isNaN(n) ? null : Math.floor(n / 1e3);
  }
  return null;
}
function za(e) {
  const [
    n,
    t = 1,
    i = 0,
    r = 0,
    o = 0,
    a = 0,
    s = 0,
    c = 0,
    l = 0
  ] = e, u = Math.floor(Number(a) / 1e6);
  return Date.UTC(
    Number(n),
    0,
    Number(t),
    Number(i) - Number(s),
    Number(r) - Number(c),
    Number(o) - Number(l),
    u
  );
}
function Qa(e) {
  const [n, t = 1, i = 1, r = 0, o = 0, a = 0, s = 0] = e;
  return Date.UTC(
    Number(n),
    Number(t) - 1,
    Number(i),
    Number(r),
    Number(o),
    Number(a),
    Number(s)
  );
}
function ja(e, n) {
  return e.o === n.o && e.h === n.h && e.l === n.l && e.c === n.c && Object.is(e.v_base, n.v_base) && Object.is(e.v_quote, n.v_quote);
}
function Wa(e, n) {
  return e.ver == null || n.ver == null ? !1 : e.ver < n.ver;
}
function me(e) {
  const n = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(n) ? n : void 0;
}
function Ga(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && $n(e.o) && $n(e.h) && $n(e.l) && $n(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && Un(e.v_base) && Un(e.v_quote) && Un(e.ver) && Un(e.knownAt);
}
function cr(e, n) {
  return S({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: me(e.v_base) ?? null,
    vQuote: me(e.v_quote) ?? null,
    ver: me(e.ver) ?? null,
    knownAt: Be(e, n)
  });
}
function $n(e) {
  return Number.isFinite(e) && e > 0;
}
function Un(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Yr(e) {
  if (typeof e == "string")
    try {
      return Yr(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const n = e.data;
    if (n && typeof n == "object") return n;
  }
  return e;
}
const Ie = "impulse_fade_v1", fe = "impulse_fade_v1.lifecycle.1", Ya = "impulse_fade_v1.lifecycle-config.1", hn = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function yd(e, n = 20) {
  if (e.length < n) return new Float32Array();
  const t = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.c, o >= n && (i -= e[o - n].c), o >= n - 1 && t.push(r.x, i / n);
  }), new Float32Array(t);
}
function Ka(e, n = 20) {
  if (e.length < n) return new Float32Array();
  const t = [], i = 2 / (n + 1);
  let r = 0;
  for (let o = 0; o < n; o++)
    r += e[o].c;
  r /= n, t.push(e[n - 1].x, r);
  for (let o = n; o < e.length; o++)
    r = (e[o].c - r) * i + r, t.push(e[o].x, r);
  return new Float32Array(t);
}
function hd(e, n = 20) {
  if (e.length < n) return new Float32Array();
  const t = [], i = n * (n + 1) / 2;
  for (let r = n - 1; r < e.length; r++) {
    let o = 0;
    for (let a = 0; a < n; a++)
      o += e[r - n + 1 + a].c * (a + 1);
    t.push(e[r].x, o / i);
  }
  return new Float32Array(t);
}
function pd(e, n = 20, t = 2) {
  if (e.length < n)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const i = [], r = [], o = [];
  let a = 0, s = 0;
  return e.forEach((c, l) => {
    if (a += c.c, s += c.c * c.c, l >= n) {
      const u = e[l - n].c;
      a -= u, s -= u * u;
    }
    if (l >= n - 1) {
      const u = a / n, f = Math.max(0, s / n - u * u), d = Math.sqrt(f) * t;
      i.push(c.x, u), r.push(c.x, u + d), o.push(c.x, u - d);
    }
  }), {
    basis: new Float32Array(i),
    upper: new Float32Array(r),
    lower: new Float32Array(o)
  };
}
function gd(e, n = 14) {
  return $e(lo(e, n));
}
function Xa(e, n = 14, t = 14, i = 3, r = 3) {
  const o = lo(e, n), a = Ue(t);
  if (o.length < a)
    return { k: new Float32Array(), d: new Float32Array() };
  const s = [];
  for (let u = a - 1; u < o.length; u++) {
    let f = 1 / 0, d = -1 / 0;
    for (let p = 0; p < a; p++) {
      const y = o[u - p].value;
      f = Math.min(f, y), d = Math.max(d, y);
    }
    const m = d - f, v = m > 0 ? (o[u].value - f) / m * 100 : 50;
    s.push({ x: o[u].x, value: v });
  }
  const c = vr(s, Ue(i)), l = vr(c, Ue(r));
  return {
    k: $e(c),
    d: $e(l)
  };
}
function Ad(e, n = 12, t = 26, i = 9) {
  const r = Ut(e, n), o = Ut(e, t), a = [];
  for (let u = 0; u < e.length; u++) {
    const f = r[u], d = o[u];
    f == null || d == null || a.push({ x: e[u].x, value: f - d });
  }
  const s = Zs(a, i), c = new Map(a.map((u) => [u.x, u.value])), l = s.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: $e(a),
    signal: $e(s),
    histogram: $e(l)
  };
}
function Za(e, n = 14) {
  const t = ft(e, n), i = [];
  return t.forEach((r, o) => {
    r != null && i.push({ x: e[o].x, value: r });
  }), $e(i);
}
function ze(e, n = {}) {
  const t = D(n.windowSeconds, 60, 2592e3, 86400), i = D(n.historyDays, 1, 365, 180), r = D(n.minSamples, 1, 5e3, 20), o = D(n.emaPeriod, 2, 500, 20), a = D(n.atrPeriod, 2, 500, 14), s = so(e);
  if (!s)
    return _s(t);
  const c = e.indexOf(s), l = co(e, s.bucket - t, c), u = l && K(l.c) ? (s.c / l.c - 1) * 100 : null, f = u == null ? [] : Ms(e, {
    windowSeconds: t,
    earliestBucket: s.bucket - i * 86400,
    excludeBucket: s.bucket
  }), d = u != null && f.length >= r ? Fs(f, u) : null, m = u != null && f.length >= r ? Ls(f, u) : null, v = Ut(e, o)[c] ?? null, p = ft(e, a)[c] ?? null, y = v != null && p != null && Number.isFinite(v) && Number.isFinite(p) && p > 0 ? (s.c - v) / p : null;
  return {
    candle: s,
    referenceCandle: l,
    windowSeconds: t,
    returnPct: u,
    percentile: d,
    zScore: m,
    rollingReturnCount: f.length,
    ema: v,
    atr: p,
    atrExtension: y
  };
}
function Ja(e = {}) {
  var j, q, M;
  const n = e.executionTimeframe ?? "chart", t = x(e.asOf), i = x(e.latestTs) ?? bs(e.candles ?? [], n) ?? x((j = e.structure) == null ? void 0 : j.updatedTs) ?? x((q = e.marketStructure) == null ? void 0 : q.summary.updatedTs) ?? null, r = t ?? i, o = r == null ? null : di(e.candles ?? [], r, n), a = (o == null ? void 0 : o.candle.c) ?? x(e.latestPrice), s = es(e.marketStructure ?? null, t), c = (s == null ? void 0 : s.summary) ?? ns(e.structure, t), l = e.htfStructures ?? [], u = t == null ? e.htfStructures ?? [] : ci(e.htfStructures ?? [], t), f = (e.srZones ?? []).filter(
    (L) => t == null || V(L) <= t
  ), d = (e.rsDivergences ?? []).filter(
    (L) => t == null || V(L) <= t
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (L) => t == null || V(L) <= t
  ), v = G(e.resistanceNearPct, 0, 10, 1.5), p = G(e.retestNearPct, 0, 10, 0.8), y = Rs(e.extension ?? null), g = Ss(f, a, v), E = Cs(d), T = Ps(c), O = Is(
    m,
    e.avwapDistancePct
  ), I = xs(c, f, a, p), b = ks(y, g, c, a), A = [
    y,
    g,
    E,
    T,
    O,
    I
  ], C = {
    checks: A,
    asOf: r,
    updatedTs: i,
    executionTimeframe: n,
    lifecycleConfigHash: e.lifecycleConfigHash ?? cn({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, k = fs({
    extension: y,
    htfResistance: g,
    htfStructures: u,
    rsWeakness: E,
    structureShift: T,
    avwapFailure: O,
    retest: I,
    invalidated: b
  });
  return (M = e.candles) != null && M.length && r != null ? rs({
    ...e,
    asOf: r,
    latestPrice: a,
    marketStructure: s,
    structure: c,
    htfStructures: l,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: m,
    checks: A,
    executionTimeframe: n
  }) : to({
    ...C,
    state: k,
    reason: Ns(k, A),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function es(e, n) {
  var o;
  if (!e || n == null) return e;
  const t = e.swings.filter((a) => a.knownAt <= n), i = e.breaks.filter((a) => a.knownAt <= n), r = ((o = xe(i)) == null ? void 0 : o.direction) ?? "neutral";
  return {
    swings: t,
    breaks: i,
    trend: r,
    summary: vi(t, i, r)
  };
}
function ns(e, n) {
  if (!e || n == null) return e ?? null;
  const t = x(e.updatedTs);
  return t == null || t <= n ? e : null;
}
function bd(e) {
  return ts(e).records;
}
function cn(e = {}) {
  var n, t, i, r, o, a, s, c, l, u, f;
  return w({
    lifecycleVersion: fe,
    lifecycleConfigVersion: Ya,
    candidateGate: hn,
    extension: {
      windowSeconds: D(
        (n = e.extensionOptions) == null ? void 0 : n.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: D((t = e.extensionOptions) == null ? void 0 : t.historyDays, 1, 365, 180),
      minSamples: D((i = e.extensionOptions) == null ? void 0 : i.minSamples, 1, 5e3, 20),
      emaPeriod: D((r = e.extensionOptions) == null ? void 0 : r.emaPeriod, 2, 500, 20),
      atrPeriod: D((o = e.extensionOptions) == null ? void 0 : o.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: D(
        (a = e.marketStructureOptions) == null ? void 0 : a.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: D(
        (s = e.marketStructureOptions) == null ? void 0 : s.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: D((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: G((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: D((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: D((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: G(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: G(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: G(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: G(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: G(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: D(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Kr(e) {
  var s;
  const n = Jr(e), t = xe(n);
  if (t == null) return null;
  const i = Zr(e, t), r = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], a = new Set(
    o.map((c) => Me(c, e.executionTimeframe)).filter((c) => c <= t)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && V(c) <= t && a.add(V(c));
  for (const c of [...a].sort((l, u) => l - u))
    si(
      lt(o, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (s = e.config) == null ? void 0 : s.marketStructureOptions,
      c,
      r
    );
  return Xr(
    e,
    t,
    r,
    i
  );
}
function ts(e) {
  const n = e.executionTimeframe, t = e.candlesByTimeframe[n] ?? [], i = e.config ?? {}, r = cn(i), o = Jr(e), a = Zr(
    e,
    xe(o) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = x(e.from) ?? -1 / 0;
  let f = null;
  return { records: o.map((m) => {
    var T, O, I, b, A;
    const v = Xr(
      e,
      m,
      s,
      a
    ), p = eo(e.candidateMetrics, m), y = (p == null ? void 0 : p.metrics) ?? fi(
      ze(
        lt(t, n, m),
        i.extensionOptions
      )
    );
    f = v;
    const g = v.evidence.filter((C) => c.has(C.id) ? !1 : (c.add(C.id), C.knownAt >= u)), E = v.transitions.filter((C) => {
      const k = is(C);
      return l.has(k) ? !1 : (l.add(k), C.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: Ie,
      lifecycleVersion: fe,
      lifecycleConfigHash: r,
      candidateGatePassed: Tn(y),
      candidateId: ((T = v.candidate) == null ? void 0 : T.id) ?? null,
      candidateDetectedAt: ((O = v.candidate) == null ? void 0 : O.detectedAt) ?? null,
      initialMtfContext: ((I = v.candidate) == null ? void 0 : I.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: xe(E) ?? null,
      transitions: E,
      evidenceAdded: g,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((b = v.candidate) == null ? void 0 : b.episodeHigh) ?? null,
      episodeHighTime: ((A = v.candidate) == null ? void 0 : A.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: f };
}
function Xr(e, n, t, i) {
  const r = e.executionTimeframe, o = e.candlesByTimeframe[r] ?? [], a = e.config ?? {}, s = cn(a), c = lt(o, r, n), l = ze(c, a.extensionOptions), u = eo(e.candidateMetrics, n), f = (u == null ? void 0 : u.metrics) ?? fi(l), d = si(
    c,
    r,
    e.structureEvents ?? [],
    a.marketStructureOptions,
    n,
    t
  ), m = i.filter(
    (p) => (p.summary.updatedTs ?? 0) <= n
  ), v = xe(c) ?? null;
  return Ja({
    candles: o,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: r,
    asOf: n,
    extensionOptions: a.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: f,
    marketStructure: d,
    structure: d.summary,
    htfStructures: m,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (v == null ? void 0 : v.c) ?? null,
    latestTs: n,
    resistanceNearPct: a.resistanceNearPct,
    retestNearPct: a.retestNearPct,
    retestToleranceBps: a.retestToleranceBps,
    retestToleranceAtr: a.retestToleranceAtr,
    invalidationBps: a.invalidationBps,
    maxCandidateAgeSeconds: a.maxCandidateAgeSeconds,
    lifecycleConfigHash: s
  });
}
function Zr(e, n) {
  return Object.entries(e.candlesByTimeframe).filter(([t]) => t !== e.executionTimeframe).flatMap(([t, i]) => {
    const r = new Set(
      i.map((o) => Me(o, t)).filter((o) => o <= n)
    );
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === t && V(o) <= n && r.add(V(o));
    return [...r].sort((o, a) => o - a).map((o) => {
      var s;
      const a = si(
        lt(i, t, o),
        t,
        e.structureEvents ?? [],
        (s = e.config) == null ? void 0 : s.marketStructureOptions,
        o
      );
      return {
        timeframe: t,
        summary: { ...a.summary, updatedTs: o }
      };
    });
  });
}
const Ed = "openTime";
function Me(e, n) {
  return (x(e.bucket) ?? x(e.ts) ?? 0) + Math.max(1, st(n));
}
function lt(e, n, t) {
  return ct(e, n, t);
}
function Jr(e) {
  const n = /* @__PURE__ */ new Set();
  for (const [o, a] of Object.entries(e.candlesByTimeframe))
    for (const s of a)
      n.add(s.knownAt ?? Me(s, o));
  for (const o of e.candidateMetrics ?? [])
    n.add(x(o.knownAt) ?? o.asOf);
  for (const o of e.structureEvents ?? []) n.add(V(o));
  for (const o of e.avwapEvents ?? []) n.add(V(o));
  for (const o of e.relativeStrengthEvents ?? []) n.add(V(o));
  for (const o of e.supportResistanceZones ?? []) n.add(V(o));
  for (const o of e.evaluationPoints ?? []) {
    const a = x(o);
    a != null && n.add(a);
  }
  const t = [...n].filter(Number.isFinite).sort((o, a) => o - a), i = x(e.from) ?? t[0] ?? 0, r = x(e.to) ?? xe(t) ?? i;
  return n.add(i), n.add(r), [...n].filter((o) => Number.isFinite(o) && o >= i && o <= r).sort((o, a) => o - a);
}
function eo(e, n) {
  return xe([...e ?? []].filter((t) => (x(t.knownAt) ?? t.asOf) <= n).sort(
    (t, i) => (x(t.knownAt) ?? t.asOf) - (x(i.knownAt) ?? i.asOf) || t.asOf - i.asOf
  )) ?? null;
}
function si(e, n, t, i, r, o) {
  var f;
  const a = Ve(e, i), s = t.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === n) && V(d) <= r
  ), c = o ?? /* @__PURE__ */ new Map();
  for (const d of [...a.breaks, ...s])
    c.set(
      Ce(
        d.kind,
        n,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const l = [...c.values()].filter((d) => d.knownAt <= r).sort(
    (d, m) => d.knownAt - m.knownAt || d.eventTime - m.eventTime
  );
  if (!l.length) return a;
  const u = ((f = xe(l)) == null ? void 0 : f.direction) ?? a.trend;
  return {
    swings: a.swings,
    breaks: l,
    trend: u,
    summary: vi(a.swings, l, u)
  };
}
function is(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function rs(e) {
  const n = e.candles ?? [], t = e.extensionOptions ?? {}, i = os(
    n,
    t,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), r = ps(i, t);
  let o = as(i, e);
  if (!o && Tn(e.extension ?? null)) {
    const a = di(n, e.asOf, e.executionTimeframe);
    a && (o = {
      index: a.index,
      candle: a.candle,
      eventTime: de(a.candle),
      knownAt: Math.min(
        e.asOf,
        Re(n, a.index, e.executionTimeframe)
      ),
      metrics: ui(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, r.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return o ? no(o, e, e.asOf, r) : to({
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
function os(e, n, t, i, r) {
  if (r != null && r.length)
    return [...r].map((a) => {
      const s = x(a.knownAt) ?? a.asOf, c = di(e, s, i);
      if (!c || s > t) return null;
      const l = x(a.eventTime) ?? de(c.candle), u = ui(a.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: s,
        metrics: u,
        pass: Tn(u),
        rollingReturnCount: Math.max(0, Math.trunc(a.sampleCount ?? 0))
      };
    }).filter((a) => a != null).sort((a, s) => a.knownAt - s.knownAt || a.eventTime - s.eventTime);
  const o = [];
  for (let a = 0; a < e.length; a += 1) {
    const s = e[a], c = Re(e, a, i);
    if (c > t) continue;
    const l = ze(e.slice(0, a + 1), n), u = fi(l);
    o.push({
      index: a,
      candle: s,
      eventTime: de(s),
      knownAt: c,
      metrics: u,
      pass: Tn(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return o;
}
function as(e, n) {
  var o;
  const t = [];
  let i = !1;
  for (const a of e)
    a.pass && !i && t.push(a), i = a.pass;
  if (!t.length) return null;
  let r = t[0];
  for (const a of t.slice(1)) {
    const c = ((o = no(r, n, a.knownAt, []).candidate) == null ? void 0 : o.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < a.knownAt && !l.pass) && (r = a);
  }
  return r;
}
function no(e, n, t, i) {
  const r = (n.symbol ?? "UNKNOWN").toUpperCase(), o = n.source ?? "chart", a = n.venue ?? "", s = n.executionTimeframe, c = ci(
    n.htfStructures ?? [],
    e.knownAt
  ).map((A) => ({
    timeframe: A.timeframe,
    state: A.summary.state,
    trend: A.summary.trend,
    transitionDirection: A.summary.transitionDirection,
    updatedTs: A.summary.updatedTs
  })), l = As({
    setupFamily: Ie,
    symbol: r,
    source: o,
    venue: a,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), u = [
    {
      id: Ce("candidate_detected", s, e.eventTime, e.knownAt),
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
  ], d = ls(n, e, t), m = ss(e, n, t);
  let v = "developing", p = e.knownAt, y = null, g = null, E = null, T = null, O = null;
  for (const A of m) {
    if (y != null) break;
    if (!(A.knownAt < e.knownAt || A.knownAt > t)) {
      if (A.lifecycleKind === "deterioration") {
        u.push({ ...A, contributesTo: "deteriorating" }), v === "developing" && (f.push(dn(v, "deteriorating", A)), v = "deteriorating", p = A.knownAt);
        continue;
      }
      if (A.lifecycleKind === "bearishBreak") {
        u.push({ ...A, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (f.push(dn(v, "waitingForRetest", A)), v = "waitingForRetest", p = A.knownAt, g = A.breakLevel ?? null);
        continue;
      }
      if (A.lifecycleKind === "retest") {
        v === "waitingForRetest" && g && A.relatedEventId === g.evidenceId && A.knownAt > g.knownAt && (u.push({ ...A, contributesTo: "entryCandidate" }), f.push(dn(v, "entryCandidate", A)), v = "entryCandidate", p = A.knownAt, E = A.breakLevel ?? g);
        continue;
      }
      if (A.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (u.push({ ...A, contributesTo: "invalidated" }), f.push(dn(v, "invalidated", A)), v = "invalidated", p = A.knownAt, y = A.knownAt, T = A.explanation);
        continue;
      }
      A.lifecycleKind === "expiry" && v !== "entryCandidate" && (u.push({ ...A, contributesTo: "expired" }), f.push(dn(v, "expired", A)), v = "expired", p = A.knownAt, y = A.knownAt, O = A.explanation);
    }
  }
  const I = ao(
    n.candles ?? [],
    e.eventTime,
    t,
    s
  ), b = {
    id: l,
    setupFamily: Ie,
    lifecycleVersion: fe,
    lifecycleConfigHash: n.lifecycleConfigHash ?? cn({
      extensionOptions: n.extensionOptions,
      resistanceNearPct: n.resistanceNearPct,
      retestNearPct: n.retestNearPct,
      retestToleranceBps: n.retestToleranceBps,
      retestToleranceAtr: n.retestToleranceAtr,
      invalidationBps: n.invalidationBps,
      maxCandidateAgeSeconds: n.maxCandidateAgeSeconds
    }),
    symbol: r,
    source: o,
    venue: a,
    executionTimeframe: s,
    detectedAt: e.knownAt,
    detectionEventTime: e.eventTime,
    detectionMetrics: e.metrics,
    initialMtfContext: c,
    episodeHigh: (I == null ? void 0 : I.price) ?? null,
    episodeHighTime: (I == null ? void 0 : I.eventTime) ?? null,
    currentState: v,
    stateSince: p,
    terminalAt: y
  };
  return {
    strategy: "pumpFade",
    setupFamily: Ie,
    lifecycleVersion: fe,
    lifecycleConfigHash: b.lifecycleConfigHash,
    asOf: t,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: p,
    label: ut(v),
    reason: gs(v, u, f, T, O),
    checks: n.checks,
    updatedTs: t,
    candidate: b,
    evidence: u.sort((A, C) => A.knownAt - C.knownAt || A.eventTime - C.eventTime),
    transitions: f,
    pendingConditions: oo(v, g),
    activeBreakLevel: g,
    retestLevel: E,
    confluence: d,
    invalidationReason: T,
    expiryReason: O,
    dataQuality: i
  };
}
function ss(e, n, t) {
  const i = [], r = n.executionTimeframe;
  for (const l of n.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = V(l);
    if (!pn(l, e, t)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    i.push({
      id: Ce(f, r, l.eventTime, u, l.x),
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
  for (const l of n.anchoredVwapSignals ?? []) {
    const u = V(l);
    l.kind !== "failedReclaim" || !pn(l, e, t) || i.push({
      id: Ce("avwap_failed_reclaim", r, l.eventTime, u, l.x),
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
  const o = us(n), a = [];
  for (const l of o) {
    const u = V(l);
    if (l.direction !== "bearish" || !pn(l, e, t)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = Ce(f, r, l.eventTime, u, l.x), m = {
      level: l.level,
      sourceTimeframe: r,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: d
    }, v = {
      id: d,
      code: f,
      explanation: `${l.label} down through ${ye(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    a.push(v), i.push(v);
  }
  for (const l of a) {
    const u = cs(e, l, n, t);
    u && i.push(u);
  }
  for (const l of o) {
    const u = V(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !pn(l, e, t))
      continue;
    const f = (n.candles ?? [])[l.index], d = ao(
      n.candles ?? [],
      e.eventTime,
      u - 1,
      r
    ), m = G(n.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || i.push({
      id: Ce("bullish_continuation_invalidation", r, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${ye(d.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: r,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const s = D(
    n.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + s;
  return c <= t && i.push({
    id: Ce("candidate_expired", r, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Ts(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: r,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), i.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function cs(e, n, t, i) {
  var u;
  const r = t.candles ?? [], o = n.breakLevel;
  if (!o || !Number.isFinite(o.level)) return null;
  const a = G(t.retestToleranceBps, 0, 1e3, 35), s = G(t.retestToleranceAtr, 0, 10, 0.25), c = D((u = t.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = ft(r, c);
  for (let f = 0; f < r.length; f += 1) {
    const d = r[f], m = Re(r, f, t.executionTimeframe), v = de(d);
    if (m <= n.knownAt || v < n.knownAt || v < e.knownAt || m > i)
      continue;
    const p = l[f] ?? 0, y = Math.max(
      o.level * (a / 1e4),
      Number.isFinite(p) ? p * s : 0
    );
    if (d.h >= o.level - y && d.l <= o.level + y && d.c < o.level && d.c <= d.o)
      return {
        id: Ce(
          "bearish_retest_rejection",
          o.sourceTimeframe,
          de(d),
          m,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${ye(o.level)}`,
        eventTime: v,
        knownAt: m,
        sourceTimeframe: o.sourceTimeframe,
        price: d.c,
        level: o.level,
        relatedEventId: o.evidenceId,
        lifecycleKind: "retest",
        sortPriority: 40,
        breakLevel: o
      };
  }
  return null;
}
function ls(e, n, t) {
  const i = [], r = mi(
    e.srZones.filter((s) => V(s) <= t),
    e.latestPrice,
    G(e.resistanceNearPct, 0, 10, 1.5)
  );
  r && i.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${ye(r.low)}-${ye(r.high)}`,
    eventTime: r.eventTime,
    knownAt: r.knownAt,
    sourceTimeframe: "MTF",
    level: r.center
  });
  const o = [...e.anchoredVwapSignals ?? []].filter(
    (s) => s.kind === "loss" && pn(s, n, t)
  ).sort((s, c) => V(c) - V(s))[0];
  o && V(o) <= t && i.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: o.vwap
  });
  const a = x(e.avwapDistancePct);
  a != null && i.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${An(a, 1)}% from AVWAP`,
    value: a,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of ci(e.htfStructures, t))
    s.summary.state !== "neutral" && i.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: ws(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return i;
}
function ci(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = x(i.summary.updatedTs);
    if (r != null && r > n) continue;
    const o = t.get(i.timeframe), a = x(o == null ? void 0 : o.summary.updatedTs) ?? -1 / 0;
    (!o || (r ?? -1 / 0) >= a) && t.set(i.timeframe, i);
  }
  return [...t.values()];
}
function us(e) {
  var i, r, o;
  const n = (r = (i = e.marketStructure) == null ? void 0 : i.breaks) != null && r.length ? e.marketStructure.breaks : (o = e.structure) != null && o.lastBreak ? [e.structure.lastBreak] : [], t = /* @__PURE__ */ new Set();
  return n.filter((a) => {
    const s = `${a.kind}:${a.direction}:${a.x}:${a.level}:${V(a)}`;
    return t.has(s) ? !1 : (t.add(s), !0);
  });
}
function fs(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && lr(e.htfResistance, e.htfStructures) ? "deteriorating" : lr(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function to(e) {
  return {
    strategy: "pumpFade",
    setupFamily: Ie,
    lifecycleVersion: fe,
    lifecycleConfigHash: e.lifecycleConfigHash ?? cn(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: ut(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: oo(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function li(e, n = {}) {
  const t = Ds(e, n);
  if (t == null) return new Float32Array();
  const i = [];
  let r = 0, o = 0;
  for (let a = t; a < e.length; a += 1) {
    const s = e[a];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!K(c)) continue;
    const l = Hs(s, c);
    l <= 0 || (r += l, o += c * l, i.push(s.x, o / r));
  }
  return new Float32Array(i);
}
function ds(e, n = {}) {
  const t = x(n.anchorBucket), i = x(n.anchorX), r = li(e, n);
  if (r.length < 2)
    return {
      anchorBucket: t,
      anchorX: i,
      value: null,
      distancePct: null,
      candle: null
    };
  const o = r[r.length - 1], a = so(e), s = a && K(o) ? (a.c - o) / o * 100 : null;
  return {
    anchorBucket: t,
    anchorX: i,
    value: o,
    distancePct: s,
    candle: a
  };
}
function ms(e, n = {}, t = 20) {
  const i = D(t, 1, 200, 20), r = li(e, n);
  if (r.length < 4) return [];
  const o = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), a = [];
  let s = null;
  for (let c = 0; c < r.length; c += 2) {
    const l = r[c], u = r[c + 1], f = o.get(l);
    if (!f || !K(u) || !K(f.candle.c)) continue;
    const d = Re(e, f.index), m = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    m && (s === "above" && m === "below" ? a.push(Ct("loss", f.index, f.candle, u, d)) : s === "below" && m === "above" ? a.push(Ct("reclaim", f.index, f.candle, u, d)) : s === "below" && m === "below" && f.candle.h >= u && f.candle.c < u && a.push(
      Ct("failedReclaim", f.index, f.candle, u, d)
    ), s = m);
  }
  return a.slice(-i);
}
function vs(e, n = {}) {
  const t = D(n.lookback, 20, 2e3, 500), i = D(n.pivotStrength, 1, 20, 3), r = D(n.atrPeriod, 2, 100, 14), o = G(n.minMoveAtr, 0, 10, 0.75), a = D(n.maxSwings, 1, 500, 120), s = Math.max(0, e.length - t), c = e.slice(s);
  if (c.length < i * 2 + 1) return [];
  const l = ft(e, r), u = [];
  for (let d = i; d < c.length - i; d += 1) {
    const m = c[d], v = s + d, p = l[v] ?? null, y = Re(e, v + i);
    Gs(c, d, i) && u.push(ur("SwingHigh", v, m, m.h, p, y)), Ys(c, d, i) && u.push(ur("SwingLow", v, m, m.l, p, y));
  }
  const f = [];
  for (const d of u) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      zs(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= Qs(d, m, o) && f.push(d);
  }
  return Bs(f).slice(-a);
}
function Ve(e, n = {}) {
  const t = D(n.maxSwings, 1, 500, 120), i = D(n.maxBreaks, 1, 200, 24), r = vs(e, {
    ...n,
    maxSwings: Math.max(t, i * 4)
  }), o = [], a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, f = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const p = Re(e, v);
    for (; c < r.length && r[c].index < v && r[c].knownAt <= p; ) {
      const g = r[c];
      g.kind === "SwingHigh" ? l = g : u = g, c += 1;
    }
    const y = e[v];
    if (l && !a.has(l.x) && y.c > l.price) {
      const g = f === "bearish" ? "StructureShift" : "StructureBreak";
      o.push(fr(g, "bullish", v, y, l, p)), a.add(l.x), f = "bullish";
    }
    if (u && !s.has(u.x) && y.c < u.price) {
      const g = f === "bullish" ? "StructureShift" : "StructureBreak";
      o.push(fr(g, "bearish", v, y, u, p)), s.add(u.x), f = "bearish";
    }
  }
  const d = r.slice(-t), m = o.slice(-i);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: vi(d, m, f)
  };
}
function ys(e) {
  var r;
  const { swings: n, summary: t } = e;
  if (!n.length || t.state === "neutral") return [];
  if (t.state === "range")
    return [
      mr(n, "SwingHigh", "rangeHigh", null, !0),
      mr(n, "SwingLow", "rangeLow", null, !1)
    ].filter((o) => !!o);
  const i = t.state === "transitional" ? t.transitionDirection ?? ((r = t.lastBreak) == null ? void 0 : r.direction) ?? e.trend : t.state;
  return i === "bullish" ? [
    zn(
      n,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    zn(
      n,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((o) => !!o) : i === "bearish" ? [
    zn(
      n,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    zn(
      n,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((o) => !!o) : [];
}
function wd(e, n = {}) {
  var c, l;
  const t = D(n.lookback, 20, 1e3, 240), i = D(n.pivotStrength, 1, 20, 3), r = D(n.maxZones, 1, 12, 6), o = G(n.thicknessBps, 1, 100, 10), a = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = Ve(e, {
    lookback: t,
    pivotStrength: i,
    atrPeriod: n.atrPeriod,
    minMoveAtr: n.minMoveAtr ?? 0,
    maxSwings: Math.min(500, t),
    maxBreaks: 24
  });
  return io(s.swings, {
    maxZones: r,
    thicknessBps: o,
    latestX: a,
    referencePrice: n.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: n.zonesPerSide
  });
}
function io(e, n = {}) {
  var l;
  const t = D(n.maxZones, 1, 12, 6), i = G(n.thicknessBps, 1, 100, 10), r = n.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, o = x(n.referencePrice), a = n.zonesPerSide == null ? null : D(n.zonesPerSide, 1, 12, 3), s = [];
  for (const u of e)
    js(
      s,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      r - u.x + 1,
      i
    );
  const c = s.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(t * 2, t));
  return Ws(c, t, o, a);
}
function ro(e, n) {
  const t = new Map(
    n.filter((a) => K(a.c)).map((a) => [a.bucket, a])
  );
  let i = null, r = null;
  const o = [];
  for (const a of e) {
    if (!K(a.c)) continue;
    const s = t.get(a.bucket);
    if (!s || !K(s.c)) continue;
    (i == null || r == null) && (i = a.c, r = s.c);
    const c = a.c / i / (s.c / r);
    o.push(a.x, (c - 1) * 100);
  }
  return new Float32Array(o);
}
function hs(e, n, t = {}) {
  var I;
  const i = D(t.maxDivergences, 1, 100, 16), r = G(t.minDeltaPct, 0, 50, 0.5), o = D(
    t.maxAgeBars,
    1,
    2e3,
    t.lookback ?? 240
  ), a = t.includeDivergences ?? !0, s = t.includeLeads ?? !0, c = t.includeBreaks ?? !0, l = ro(e, n), u = Xs(l);
  if (!e.length || u.size < 2) return [];
  const d = (((I = e[e.length - 1]) == null ? void 0 : I.x) ?? 0) - o, m = {
    ...t,
    maxSwings: Math.max(t.maxSwings ?? 120, i * 4),
    maxBreaks: Math.max(t.maxBreaks ?? 24, i * 2)
  }, v = Ve(e, {
    ...m
  }), p = $s(e, l), y = Ve(p, {
    ...m
  }), g = new Map(e.map((b, A) => [b.x, { candle: b, index: A }])), E = [];
  let T = null, O = null;
  for (const b of v.swings) {
    const A = u.get(b.x);
    if (!(A == null || !Number.isFinite(A))) {
      if (b.kind === "SwingHigh") {
        if (T) {
          const C = u.get(T.x);
          C != null && Number.isFinite(C) && (b.price > T.price && A <= C - r ? a && E.push(
            qn(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              b,
              T,
              A,
              C,
              v.summary.state,
              y.summary.state
            )
          ) : b.price < T.price && A >= C + r && s && E.push(
            qn(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              b,
              T,
              A,
              C,
              v.summary.state,
              y.summary.state
            )
          ));
        }
        T = b;
        continue;
      }
      if (O) {
        const C = u.get(O.x);
        C != null && Number.isFinite(C) && (b.price > O.price && A <= C - r ? s && E.push(
          qn(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            b,
            O,
            A,
            C,
            v.summary.state,
            y.summary.state
          )
        ) : b.price < O.price && A >= C + r && a && E.push(
          qn(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            b,
            O,
            A,
            C,
            v.summary.state,
            y.summary.state
          )
        ));
      }
      O = b;
    }
  }
  if (c)
    for (const b of y.breaks) {
      if (b.x < d) continue;
      const A = g.get(b.x), C = u.get(b.x);
      if (!A || C == null || !Number.isFinite(C)) continue;
      const k = Ve(e.slice(0, A.index + 1), {
        ...m,
        maxBreaks: Math.max(8, t.maxBreaks ?? 24)
      });
      Us(b.direction, k.summary.state) && E.push(
        Vs(
          b.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          b.direction,
          b.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          A.index,
          A.candle,
          C,
          b,
          k.summary.state,
          y.summary.state
        )
      );
    }
  return E.filter((b) => b.x >= d).sort((b, A) => b.x - A.x || dr(b.signal) - dr(A.signal)).slice(-i);
}
function Td(e) {
  return new Uint8Array(e.buffer);
}
function ui(e) {
  return {
    returnPct: x(e == null ? void 0 : e.returnPct),
    percentile: x(e == null ? void 0 : e.percentile),
    zScore: x(e == null ? void 0 : e.zScore),
    atrExtension: x(e == null ? void 0 : e.atrExtension)
  };
}
function fi(e) {
  return {
    returnPct: x(e.returnPct),
    percentile: x(e.percentile),
    zScore: x(e.zScore),
    atrExtension: x(e.atrExtension)
  };
}
function Tn(e) {
  const n = ui(e);
  return n.returnPct != null && n.returnPct >= hn.returnPct || n.percentile != null && n.percentile >= hn.percentile || n.zScore != null && n.zScore >= hn.zScore || n.atrExtension != null && n.atrExtension >= hn.atrExtension;
}
function ps(e, n) {
  const t = [], i = D(n.minSamples, 1, 1e4, 20), r = e[e.length - 1] ?? null;
  return r ? r.rollingReturnCount < i && t.push(
    `Rolling-return history has ${r.rollingReturnCount}/${i} samples for percentile and Z-score`
  ) : t.push("No candle history was available at the requested asOf time"), t;
}
function dn(e, n, t) {
  return {
    from: e,
    to: n,
    knownAt: t.knownAt,
    evidenceIds: [t.id],
    evidenceCodes: [t.code],
    explanation: t.explanation
  };
}
function gs(e, n, t, i, r) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return i ?? "Continuation invalidated the fade setup";
  if (e === "expired") return r ?? "Candidate expired before progressing";
  const o = t[t.length - 1];
  if (o && o.to === e) return o.explanation;
  const a = n.filter((c) => c.contributesTo === e), s = a[a.length - 1];
  return (s == null ? void 0 : s.explanation) ?? ut(e);
}
function oo(e, n) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        n ? `Retest ${ye(n.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function As(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((n) => String(n || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Ce(e, n, t, i, r) {
  return [e, n, t, i, r ?? ""].map((o) => String(o).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function ao(e, n, t, i) {
  let r = null;
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], s = de(a);
    s < n || Re(e, o, i) > t || Number.isFinite(a.h) && (!r || a.h > r.price) && (r = { price: a.h, eventTime: s });
  }
  return r;
}
function bs(e, n) {
  return e.length ? Re(e, e.length - 1, n) : null;
}
function di(e, n, t) {
  for (let i = e.length - 1; i >= 0; i -= 1)
    if (Re(e, i, t) <= n)
      return { candle: e[i], index: i };
  return null;
}
function de(e) {
  const n = x(e.ts);
  return n ?? x(e.bucket) ?? 0;
}
function Re(e, n, t) {
  const i = e[n];
  return i ? i.knownAt != null && Number.isFinite(i.knownAt) ? i.knownAt : t != null && String(t).trim() !== "chart" ? Me(i, t) : (x(i.bucket) ?? de(i)) + Es(e, n) : 0;
}
function Es(e, n) {
  var o, a, s;
  const t = x((o = e[n]) == null ? void 0 : o.bucket) ?? de(e[n]), i = x((a = e[n + 1]) == null ? void 0 : a.bucket);
  if (i != null && i > t) return i - t;
  const r = x((s = e[n - 1]) == null ? void 0 : s.bucket);
  return r != null && t > r ? t - r : 1;
}
function V(e) {
  return x(e.knownAt) ?? x(e.eventTime) ?? x(e.ts) ?? x(e.bucket) ?? 0;
}
function pn(e, n, t) {
  const i = V(e), r = x(e.eventTime) ?? x(e.ts) ?? x(e.bucket) ?? i;
  return i > n.knownAt && i <= t && r >= n.knownAt;
}
function ws(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Ts(e) {
  const n = Math.max(0, Math.round(e));
  return n >= 86400 ? `${Math.round(n / 86400)}d` : n >= 3600 ? `${Math.round(n / 3600)}h` : n >= 60 ? `${Math.round(n / 60)}m` : `${n}s`;
}
function K(e) {
  return Number.isFinite(e) && e > 0;
}
function Rs(e) {
  const n = x(e == null ? void 0 : e.returnPct), t = x(e == null ? void 0 : e.percentile), i = x(e == null ? void 0 : e.zScore), r = x(e == null ? void 0 : e.atrExtension), o = [
    n == null ? null : `24h ${An(n, 1)}%`,
    r == null ? null : `Ext ${An(r, 1)} ATR`,
    i == null ? null : `Z ${An(i, 1)}`,
    t == null ? null : `Pctl ${Math.round(t)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: Tn({ returnPct: n, percentile: t, zScore: i, atrExtension: r }) ? "pass" : "pending",
    detail: o.join(" | ") || "No extension context yet"
  };
}
function Ss(e, n, t) {
  const i = mi(e, n, t);
  return i ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${ye(i.low)}-${ye(i.high)} strength ${i.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Cs(e) {
  const n = [...e].reverse().find((t) => t.direction === "bearish");
  return n ? {
    key: "rsWeakness",
    label: "RS weakness",
    status: "pass",
    detail: n.label
  } : {
    key: "rsWeakness",
    label: "RS weakness",
    status: "pending",
    detail: "No bearish RS event"
  };
}
function Ps(e) {
  const n = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: n ? "pass" : "pending",
    detail: n ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Is(e, n) {
  const t = [...e].reverse().find((o) => o.kind === "loss" || o.kind === "failedReclaim"), i = x(n);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!t || i != null && i <= -0.2 ? "pass" : "pending",
    detail: (t == null ? void 0 : t.label) ?? (i == null ? "No AVWAP failure" : `AVWAP ${An(i, 1)}%`)
  };
}
function xs(e, n, t, i) {
  var c;
  const r = x((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), o = r != null && t != null && Os(t, r) <= i, a = mi(n, t, i);
  return {
    key: "retest",
    label: "Retest",
    status: !!(o || a) ? "pass" : "pending",
    detail: o ? `Retesting ${ye(r)}` : a ? `Near R ${ye(a.center)}` : "No retest yet"
  };
}
function ks(e, n, t, i) {
  var o;
  if (e.status !== "pass" || n.status !== "pass" || (t == null ? void 0 : t.state) !== "bullish" || i == null) return !1;
  const r = x((o = t.lastSwingHigh) == null ? void 0 : o.price);
  return r != null && i > r * 1.01;
}
function lr(e, n) {
  return e.status === "pass" || n.some((t) => t.summary.state !== "neutral");
}
function mi(e, n, t) {
  return n == null || !K(n) ? null : e.filter((i) => i.kind === "resistance").map((i) => ({
    zone: i,
    distance: n >= i.low && n <= i.high ? 0 : n < i.low ? (i.low - n) / n * 100 : (n - i.high) / n * 100
  })).filter((i) => i.distance <= t).sort((i, r) => i.distance - r.distance || r.zone.strength - i.zone.strength).map((i) => i.zone)[0] ?? null;
}
function Os(e, n) {
  return !K(e) || !K(n) ? 1 / 0 : Math.abs((e / n - 1) * 100);
}
function ut(e) {
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
function Ns(e, n) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const t = n.filter((i) => i.status === "pass").map((i) => i.label);
  return t.length ? t.join(" + ") : ut(e);
}
function An(e, n = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(n)}`;
}
function ye(e) {
  const n = Math.abs(e);
  return n >= 1e3 ? e.toFixed(0) : n >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function x(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function xe(e) {
  return e[e.length - 1];
}
function so(e) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const t = e[n];
    if (K(t.c)) return t;
  }
  return null;
}
function _s(e) {
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
function co(e, n, t) {
  const i = Math.min(e.length - 1, Math.max(0, t - 1));
  let r = null;
  for (let o = i; o >= 0; o -= 1) {
    const a = e[o];
    if (a.bucket <= n && K(a.c)) {
      r = a;
      break;
    }
  }
  return r;
}
function Ms(e, n) {
  const t = [];
  for (let i = 1; i < e.length; i += 1) {
    const r = e[i];
    if (r.bucket < n.earliestBucket || r.bucket >= n.excludeBucket || !K(r.c)) continue;
    const o = co(e, r.bucket - n.windowSeconds, i);
    !o || !K(o.c) || t.push((r.c / o.c - 1) * 100);
  }
  return t;
}
function Fs(e, n) {
  if (!e.length || !Number.isFinite(n)) return null;
  const t = e.filter(Number.isFinite);
  if (!t.length) return null;
  const i = t.filter((o) => o < n).length, r = t.filter((o) => o === n).length;
  return (i + r * 0.5) / t.length * 100;
}
function Ls(e, n) {
  const t = e.filter(Number.isFinite);
  if (t.length < 2 || !Number.isFinite(n)) return null;
  const i = t.reduce((a, s) => a + s, 0) / t.length, r = t.reduce((a, s) => a + (s - i) ** 2, 0) / (t.length - 1), o = Math.sqrt(r);
  return o > 0 ? (n - i) / o : null;
}
function Ct(e, n, t, i, r) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: n,
    x: t.x,
    ts: t.ts,
    bucket: t.bucket,
    price: t.c,
    vwap: i,
    eventTime: de(t),
    knownAt: r
  };
}
function Ds(e, n) {
  const t = n.anchorBucket == null ? null : Number(n.anchorBucket);
  if (t != null && Number.isFinite(t)) {
    const r = e.findIndex((o) => o.bucket >= t);
    return r >= 0 ? r : null;
  }
  const i = n.anchorX == null ? null : Number(n.anchorX);
  if (i != null && Number.isFinite(i)) {
    const r = e.findIndex((o) => o.x >= i);
    return r >= 0 ? r : null;
  }
  return null;
}
function Hs(e, n) {
  const t = Number(e.v_base);
  if (Number.isFinite(t) && t > 0) return t;
  const i = Number(e.v_quote);
  return Number.isFinite(i) && i > 0 && n > 0 ? i / n : 0;
}
function ur(e, n, t, i, r, o) {
  return {
    kind: e,
    structure: e,
    label: e === "SwingHigh" ? "SH" : "SL",
    index: n,
    x: t.x,
    ts: t.ts,
    bucket: t.bucket,
    price: i,
    atr: r,
    eventTime: de(t),
    knownAt: o
  };
}
function Bs(e) {
  let n = null, t = null;
  return e.map((i) => {
    if (i.kind === "SwingHigh") {
      const s = n == null ? "SwingHigh" : i.price > n.price ? "HigherHigh" : "LowerHigh", l = { ...i, structure: s, label: s === "SwingHigh" ? "SH" : s === "HigherHigh" ? "HH" : "LH" };
      return n = l, l;
    }
    const r = t == null ? "SwingLow" : i.price > t.price ? "HigherLow" : "LowerLow", a = { ...i, structure: r, label: r === "SwingLow" ? "SL" : r === "HigherLow" ? "HL" : "LL" };
    return t = a, a;
  });
}
function fr(e, n, t, i, r, o) {
  return {
    kind: e,
    direction: n,
    label: e === "StructureBreak" ? "BOS" : "Shift",
    index: t,
    x: i.x,
    ts: i.ts,
    bucket: i.bucket,
    level: r.price,
    sourceSwingX: r.x,
    sourceSwingPrice: r.price,
    eventTime: de(i),
    knownAt: o
  };
}
function qn(e, n, t, i, r, o, a, s, c, l) {
  return {
    kind: e,
    signal: n,
    direction: t,
    label: i,
    index: r.index,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    price: r.price,
    previousPrice: o.price,
    rs: a,
    previousRs: s,
    priceLabel: r.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: l,
    eventTime: r.eventTime,
    knownAt: Math.max(r.knownAt, o.knownAt)
  };
}
function Vs(e, n, t, i, r, o, a, s, c) {
  return {
    kind: e,
    signal: "break",
    direction: n,
    label: t,
    index: i,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    price: n === "bearish" ? r.l : r.h,
    previousPrice: null,
    rs: o,
    previousRs: a.sourceSwingPrice,
    priceLabel: "Break",
    sourceBreak: a,
    priceStructureState: s,
    rsStructureState: c,
    eventTime: a.eventTime,
    knownAt: a.knownAt
  };
}
function $s(e, n) {
  const t = new Map(e.map((o) => [o.x, o])), i = [];
  let r = null;
  for (let o = 0; o < n.length; o += 2) {
    const a = n[o], s = n[o + 1], c = t.get(a);
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
function Us(e, n) {
  return e === "bearish" ? n === "bullish" || n === "transitional" : n === "bearish" || n === "transitional";
}
function dr(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function vi(e, n, t) {
  const i = n[n.length - 1] ?? null, r = $t(e, "SwingHigh"), o = $t(e, "SwingLow"), a = e[e.length - 1] ?? null, s = qs(n), c = e.length === 0 ? "neutral" : i == null || s ? "range" : i.kind === "StructureShift" ? "transitional" : i.direction, l = c === "transitional" ? (i == null ? void 0 : i.direction) ?? null : null;
  return {
    state: c,
    trend: t,
    transitionDirection: l,
    lastBreak: i,
    lastSwingHigh: r,
    lastSwingLow: o,
    updatedX: (i == null ? void 0 : i.x) ?? (a == null ? void 0 : a.x) ?? null,
    updatedTs: (i == null ? void 0 : i.knownAt) ?? (a == null ? void 0 : a.knownAt) ?? null
  };
}
function zn(e, n, t, i, r) {
  for (let a = e.length - 1; a >= 0; a -= 1) {
    const s = e[a];
    if (s.kind === n && t.includes(s.structure))
      return Vt(i, r, s);
  }
  const o = $t(e, n);
  return o ? Vt(i, r, o) : null;
}
function mr(e, n, t, i, r) {
  let o = null;
  for (const a of e)
    a.kind === n && (!o || (r ? a.price > o.price : a.price < o.price)) && (o = a);
  return o ? Vt(t, i, o) : null;
}
function Vt(e, n, t) {
  return {
    role: e,
    direction: n,
    price: t.price,
    x: t.x,
    ts: t.ts,
    bucket: t.bucket,
    eventTime: t.eventTime,
    knownAt: t.knownAt,
    sourceSwing: t
  };
}
function qs(e) {
  const n = e.slice(-5).filter((t) => t.kind === "StructureShift");
  if (n.length < 3) return !1;
  for (let t = 1; t < n.length; t += 1)
    if (n[t].direction === n[t - 1].direction)
      return !1;
  return !0;
}
function $t(e, n) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const i = e[t];
    if (i.kind === n) return i;
  }
  return null;
}
function zs(e, n) {
  return e.kind === "SwingHigh" ? e.price > n.price : e.price < n.price;
}
function Qs(e, n, t) {
  const i = e.atr != null && Number.isFinite(e.atr) ? e.atr : n.atr != null && Number.isFinite(n.atr) ? n.atr : 0;
  return Math.max(0, i * t);
}
function ft(e, n) {
  const t = Ue(n), i = Array(e.length).fill(null);
  if (e.length < t) return i;
  const r = e.map((a, s) => {
    if (s === 0) return a.h - a.l;
    const c = e[s - 1].c;
    return Math.max(
      a.h - a.l,
      Math.abs(a.h - c),
      Math.abs(a.l - c)
    );
  });
  let o = 0;
  for (let a = 0; a < t; a += 1) o += r[a];
  o /= t, i[t - 1] = o;
  for (let a = t; a < e.length; a += 1)
    o = (o * (t - 1) + r[a]) / t, i[a] = o;
  return i;
}
function js(e, n, t, i, r) {
  const o = t.price;
  if (!Number.isFinite(o) || o <= 0) return;
  const a = Math.max(o * (r / 1e4), Number.EPSILON), s = o - a, c = o + a, l = 1 / Math.max(1, i), u = e.find(
    (m) => m.kind === n && Ks(m.low, m.high, s, c)
  );
  if (!u) {
    e.push({
      kind: n,
      low: s,
      high: c,
      center: o,
      touches: 1,
      score: 1 + l,
      strength: 1 + l,
      lastX: t.x,
      eventTime: t.eventTime,
      knownAt: t.knownAt,
      source: "swing",
      structures: [t.structure]
    });
    return;
  }
  const f = u.touches + 1;
  u.center = (u.center * u.touches + o) / f, u.touches = f, u.score += 1 + l, u.strength = u.score, u.lastX = Math.max(u.lastX, t.x), u.eventTime = Math.max(u.eventTime, t.eventTime), u.knownAt = Math.max(u.knownAt, t.knownAt), u.structures.push(t.structure);
  const d = Math.max(u.center * (r / 1e4), Number.EPSILON);
  u.low = Math.min(u.low, u.center - d, s), u.high = Math.max(u.high, u.center + d, c);
}
function Ws(e, n, t, i) {
  if (!t || !i) return e.slice(0, n);
  const r = /* @__PURE__ */ new Set(), o = e.filter((s) => s.center <= t).sort((s, c) => t - s.center - (t - c.center) || c.score - s.score).slice(0, i), a = e.filter((s) => s.center > t).sort((s, c) => s.center - t - (c.center - t) || c.score - s.score).slice(0, i);
  for (const s of [...o, ...a])
    r.add(s);
  for (const s of e) {
    if (r.size >= n) break;
    r.add(s);
  }
  return Array.from(r).sort((s, c) => c.score - s.score || c.touches - s.touches || c.lastX - s.lastX).slice(0, n);
}
function Gs(e, n, t) {
  const i = e[n].h;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= t; r += 1)
    if (e[n - r].h >= i || e[n + r].h > i) return !1;
  return !0;
}
function Ys(e, n, t) {
  const i = e[n].l;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= t; r += 1)
    if (e[n - r].l <= i || e[n + r].l < i) return !1;
  return !0;
}
function Ks(e, n, t, i) {
  return e <= i && t <= n;
}
function Xs(e) {
  const n = /* @__PURE__ */ new Map();
  for (let t = 0; t < e.length; t += 2) {
    const i = e[t], r = e[t + 1];
    Number.isFinite(i) && Number.isFinite(r) && n.set(i, r);
  }
  return n;
}
function Ut(e, n) {
  const t = Ue(n), i = Array(e.length).fill(null);
  if (e.length < t) return i;
  const r = 2 / (t + 1);
  let o = 0;
  for (let a = 0; a < t; a++) o += e[a].c;
  o /= t, i[t - 1] = o;
  for (let a = t; a < e.length; a++)
    o = (e[a].c - o) * r + o, i[a] = o;
  return i;
}
function Zs(e, n) {
  const t = Ue(n);
  if (e.length < t) return [];
  const i = [], r = 2 / (t + 1);
  let o = 0;
  for (let a = 0; a < t; a++) o += e[a].value;
  o /= t, i.push({ x: e[t - 1].x, value: o });
  for (let a = t; a < e.length; a++)
    o = (e[a].value - o) * r + o, i.push({ x: e[a].x, value: o });
  return i;
}
function lo(e, n) {
  const t = Ue(n);
  if (e.length <= t) return [];
  let i = 0, r = 0;
  for (let a = 1; a <= t; a++) {
    const s = e[a].c - e[a - 1].c;
    s >= 0 ? i += s : r += Math.abs(s);
  }
  i /= t, r /= t;
  const o = [
    { x: e[t].x, value: yr(i, r) }
  ];
  for (let a = t + 1; a < e.length; a++) {
    const s = e[a].c - e[a - 1].c, c = Math.max(0, s), l = Math.max(0, -s);
    i = (i * (t - 1) + c) / t, r = (r * (t - 1) + l) / t, o.push({ x: e[a].x, value: yr(i, r) });
  }
  return o;
}
function vr(e, n) {
  if (e.length < n) return [];
  const t = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.value, o >= n && (i -= e[o - n].value), o >= n - 1 && t.push({ x: r.x, value: i / n });
  }), t;
}
function $e(e) {
  const n = [];
  for (const t of e)
    n.push(t.x, t.value);
  return new Float32Array(n);
}
function yr(e, n) {
  return n === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / n);
}
function Ue(e) {
  const n = Math.floor(Number(e));
  return Number.isFinite(n) ? Math.max(1, n) : 1;
}
function D(e, n, t, i) {
  return Math.floor(G(e, n, t, i));
}
function G(e, n, t, i) {
  const r = Number(e);
  return Number.isFinite(r) ? Math.max(n, Math.min(t, r)) : i;
}
const Js = "strategy-profile.1", uo = "decision-snapshot.1", ec = "impulse_fade_v1.research.default", nc = "1";
function tc(e) {
  return `decision-reference-observation:${w({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function On(e) {
  const { profileHash: n, ...t } = e;
  return w(t);
}
function fo(e) {
  if (Rn(e.createdAt, "createdAt"), e.setupFamily !== Ie || e.lifecycleVersion !== fe || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [r, o] of Object.entries(e.timeframeRoles))
    if (r === "contextTimeframes") {
      if (!o.every((a) => a.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (o != null && !o.trim())
      throw new TypeError(`${r} cannot be blank`);
  if (hr(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), hr(
    e.riskPolicy.maximumMarginAllocationFraction,
    "maximum margin allocation"
  ), !Number.isInteger(e.targetPolicy.maximumTargets) || e.targetPolicy.maximumTargets < 1 || !Number.isFinite(e.targetPolicy.fractionTolerance) || e.targetPolicy.fractionTolerance < 0)
    throw new RangeError("Target policy limits are invalid");
  const n = [
    "activeCandidate",
    "entryCandidate",
    "confirmedRetest",
    "referenceIntegrity",
    "dataQuality",
    "risk",
    "margin",
    "rewardRisk"
  ], t = Object.values(e.entryPolicy.factors).flat();
  if (new Set(t).size !== t.length || n.some(
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
  const i = h(e);
  return h({
    ...i,
    profileHash: On(i)
  });
}
function ic(e = {}) {
  var o, a;
  const n = {
    candidateTimeframe: "1h",
    structureTimeframe: "1h",
    executionTimeframe: "15m",
    triggerTimeframe: "15m",
    contextTimeframes: ["4h", "1d"],
    ...e.timeframeRoles
  }, t = {
    candidateMetricsRequired: !0,
    minimumHistoryCoverageRatio: 0.9,
    rejectedNoteSeverities: ["error"],
    ...(o = e.entryPolicy) == null ? void 0 : o.requiredDataQuality
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
    ...(a = e.entryPolicy) == null ? void 0 : a.factors
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
    requiredDataQuality: t,
    factors: i
  };
  return fo({
    schemaVersion: Js,
    id: e.id ?? ec,
    version: e.version ?? nc,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: Ie,
    lifecycleVersion: fe,
    lifecycleConfigHash: e.lifecycleConfigHash ?? cn(),
    side: "short",
    timeframeRoles: n,
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
const rc = ic();
function yi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (dc(e.price, "reference price"), Rn(e.eventTime, "reference eventTime"), Rn(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const n = tc(e.sourceObject);
  if (e.sourceObject.observationId != null && e.sourceObject.observationId !== n)
    throw new Error("Decision reference source observation failed deterministic verification");
  return h({
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
      observationId: n
    }
  });
}
function oc(e) {
  var o, a, s, c;
  if (Rn(e.decisionTime, "decisionTime"), Rn(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  sc(e.lifecycle.candidate, e.effectiveAsOf), cc(e.candidateMetrics, e.effectiveAsOf);
  const n = [...e.dataQualityNotes];
  fc([
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ]);
  for (const l of e.lifecycle.dataQuality)
    n.push({
      code: "LIFECYCLE_DATA_QUALITY_NOTE",
      severity: "warning",
      message: l
    });
  const t = ac(
    e.candidateMetrics,
    e.effectiveAsOf,
    e.symbol,
    e.lifecycle.candidate ?? null
  );
  e.candidateMetrics && !t && n.push({
    code: "CANDIDATE_METRICS_AFTER_CUTOFF",
    severity: "error",
    message: "Candidate metrics were not valid for the symbol, venue, or decision cutoff"
  });
  for (const l of (t == null ? void 0 : t.insufficientDataReasons) ?? [])
    n.push({
      code: `CANDIDATE_METRICS_${l.code}`,
      severity: "error",
      message: l.message
    });
  const i = {
    snapshotSchemaVersion: uo,
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
    candidateEpisode: ((o = e.lifecycle.candidate) == null ? void 0 : o.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate : null,
    activeCandidateId: ((a = e.lifecycle.candidate) == null ? void 0 : a.detectedAt) != null && e.lifecycle.candidate.detectedAt <= e.effectiveAsOf ? e.lifecycle.candidate.id : null,
    lifecycleState: e.lifecycle.currentState,
    lifecycleStateSince: e.lifecycle.stateSince,
    lifecycleEvidence: It(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: t,
    structureByTimeframe: lc(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: Pt(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: Pt(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: It(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: It(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: Pt(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: n
  }, r = hi(i);
  return h({ ...i, id: r });
}
function hi(e) {
  const { id: n, ...t } = e;
  return `decision-snapshot:${w(t).slice(8)}`;
}
function mo(e) {
  const n = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], t = /* @__PURE__ */ new Map();
  for (const i of n) {
    const r = t.get(i.id);
    if (r && S(r) !== S(i))
      throw new RangeError(`Conflicting decision reference id ${i.id}`);
    t.set(i.id, i);
  }
  return [...t.values()];
}
function ac(e, n, t, i) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > n || e.symbol.toUpperCase() !== t.toUpperCase() || e.marketType.toLowerCase() !== "perp" || i != null && i.venue && e.exchange.toLowerCase() !== i.venue.toLowerCase() ? null : e;
}
function sc(e, n) {
  if (!e) return;
  if ([
    e.detectedAt,
    e.detectionEventTime,
    e.stateSince,
    e.episodeHighTime,
    e.terminalAt,
    ...e.initialMtfContext.map((i) => i.updatedTs)
  ].filter((i) => i != null).some((i) => !Number.isFinite(i) || i > n))
    throw new RangeError("Candidate episode contains information after effectiveAsOf");
}
function cc(e, n) {
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
  ].filter((i) => i != null).some((i) => !Number.isFinite(i) || i > n))
    throw new RangeError("Candidate metrics contain information after effectiveAsOf");
}
function lc(e, n) {
  return Object.fromEntries(
    Object.entries(e).sort(([t], [i]) => t.localeCompare(i)).map(([t, i]) => [
      t,
      uc(i) <= n ? i : null
    ])
  );
}
function Pt(e, n) {
  return e.filter((t) => t.knownAt <= n).sort((t, i) => t.knownAt - i.knownAt || t.id.localeCompare(i.id));
}
function It(e, n) {
  return e.filter((t) => t.knownAt <= n).sort(
    (t, i) => t.knownAt - i.knownAt || t.eventTime - i.eventTime || w(t).localeCompare(w(i))
  );
}
function uc(e) {
  var n, t, i;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((n = e.lastBreak) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((t = e.lastSwingHigh) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((i = e.lastSwingLow) == null ? void 0 : i.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function fc(e) {
  const n = /* @__PURE__ */ new Map();
  for (const t of e) {
    const i = n.get(t.id);
    if (i && S(i) !== S(t))
      throw new RangeError(`Conflicting decision reference id ${t.id}`);
    n.set(t.id, t);
  }
}
function Rn(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite Unix timestamp`);
}
function dc(e, n) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${n} must be a positive finite number`);
}
function hr(e, n) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${n} must be in (0, 1]`);
}
const vo = "radar-selection-profile.1", pi = "radar-episode.1", yo = "replay-case-manifest.1", gi = "radar-metric-observation.1", mc = "radar-scan-result.1", vc = "radar-episode-status.1", Ai = "execution-venue-eligibility.1", yc = "radar-structure-observation.1", bi = "radar-universe-membership.1";
function Ei(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function hc(e) {
  return To(e), h({
    ...e,
    canonicalConfigHash: Ei(e)
  });
}
function pc(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const n = {
    schemaVersion: Ai,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...n,
    observationId: mt(n)
  });
}
function Rd(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !oi(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const n = {
    schemaVersion: yc,
    ...e
  };
  return h({
    ...n,
    observationId: ho(n)
  });
}
function Sd(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const n = {
    schemaVersion: bi,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...n,
    observationId: dt(n)
  });
}
function dt(e) {
  const { observationId: n, ...t } = e;
  return `radar-universe-observation:${X(t)}`;
}
function ho(e) {
  const { observationId: n, ...t } = e;
  return `radar-structure-observation:${X(t)}`;
}
function qt(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const n = JSON.parse(S(e.snapshot));
  return h({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${X({
      logicalObjectId: e.logicalObjectId,
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      snapshot: n
    })}`,
    objectType: e.objectType,
    eventTime: e.eventTime,
    knownAt: e.knownAt,
    snapshot: n
  });
}
function mt(e) {
  const { observationId: n, ...t } = e;
  return `execution-venue-observation:${X(t)}`;
}
const Cd = hc({
  schemaVersion: vo,
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
function Pd(e) {
  var c, l;
  zc(e);
  const n = e.strategyProfile ?? rc, t = /* @__PURE__ */ new Map(), i = [], r = [], o = [], a = [], s = /* @__PURE__ */ new Set();
  for (const [u, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = kc(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    s.add(m);
    const p = he(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((g) => Me(g, e.selectionProfile.scanTimeframe)).filter((g) => g <= e.to).filter((g) => Uc(g, e.selectionProfile)), y = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const g of p) {
      const E = on(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      y.previousEvaluationAsOf != null && g - y.previousEvaluationAsOf > E && (y.previousGate = null, y.falseSince = null);
      const T = g >= e.from, O = e.selectionProfile.moveDetectors.map(
        (L) => gc(L, d, g, e.selectionProfile.scanTimeframe)
      );
      if (T)
        for (const L of O)
          for (const F of L.observations)
            t.set(F.requestId, F);
      const I = Vc(
        O.map((L) => L.result),
        e.selectionProfile.detectorCombination
      ), b = Cc(
        d,
        g,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), A = Sc(
        d,
        g,
        e.selectionProfile,
        O,
        b,
        e.universeHistory ?? []
      ), C = A.results, k = C.every((L) => L.passed), j = I.passed && k, q = !k || I.evaluable;
      if (T)
        for (const L of A.evidence)
          L.schemaVersion === gi && t.set(L.requestId, L);
      const M = Ic(
        d,
        g,
        O.map((L) => L.result),
        C,
        A.evidence,
        I.passed,
        k,
        j,
        q
      );
      if (T && i.push(M), y.activeEpisode && g >= y.activeEpisode.activeUntil && (y.activeEpisode.detectedAt >= e.from && y.activeEpisode.activeUntil <= e.to && o.push(
        xt(
          y.activeEpisode,
          y.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), y.activeEpisode = null), q && !j ? (y.falseSince ?? (y.falseSince = g), !y.armed && g - y.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (T && ((c = y.blockedEpisode) == null ? void 0 : c.detectedAt) != null && y.blockedEpisode.detectedAt >= e.from && o.push(
        xt(y.blockedEpisode, g, "reset", "radarGateReset", "armed")
      ), y.activeEpisode = null, y.blockedEpisode = null, y.armed = !0)) : y.falseSince = null, q && j && y.previousGate === !1 && y.armed) {
        const L = wc({
          series: d,
          asOf: g,
          profile: e.selectionProfile,
          strategyProfile: n,
          detectorEvaluations: O,
          selectionEvaluation: M,
          hardGateEvidence: A.evidence,
          venueEligibility: b,
          lifecycleHistory: ((l = e.lifecycleHistory) == null ? void 0 : l[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (T) {
          r.push(L), o.push(
            xt(L, g, "active", "detected", "blockedUntilReset")
          );
          const F = Tc(L, d, e.selectionProfile, n);
          a.push(F);
          for (const Fe of L.contextObservations)
            t.set(Fe.requestId, Fe);
        }
        y.activeEpisode = L, y.blockedEpisode = L, y.armed = !1;
      }
      y.previousGate = q ? j : null, y.previousEvaluationAsOf = g;
    }
  }
  return h({
    schemaVersion: mc,
    selectionProfileRef: So(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...t.values()].sort(Ro),
    gateEvaluations: i.sort(jc),
    episodes: r.sort(Wc),
    episodeStatusObservations: o.sort(Gc),
    replayCaseManifests: a.sort((u, f) => u.id.localeCompare(f.id))
  });
}
function gc(e, n, t, i) {
  return e.type === "rollingTroughRunup" ? Ac(e, n, t, i) : e.type === "elapsedWindowReturn" ? bc(e, n, t, i) : e.type === "maximumWindowReturn" ? Ec(e, n, t, i) : po(e, n, t);
}
function Ac(e, n, t, i) {
  const r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, s = (o ? r.filter(
    (y) => y.bucket >= o.bucket - e.lookbackSeconds && y.bucket <= o.bucket && o.bucket - y.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((y, g) => Y(g.c) && (!y || g.c < y.c || g.c === y.c && g.bucket < y.bucket) ? g : y, null), c = o && s && Y(s.c) ? (o.c / s.c - 1) * 100 : null, l = _c(r, o, e), u = Eo(l, c, e.minimumSampleCount), f = [];
  o || f.push(se("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || f.push(se("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = w(e), m = ln({
    series: n,
    asOf: t,
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
    historyCandles: Ri(r, o, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...u.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && bn(m.percentile, e.minimumPercentile) && bn(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, p = s ? Pc(n, t, s, m) : null;
  return {
    result: vt(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${tt(c)} versus ${tt(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: p
  };
}
function bc(e, n, t, i) {
  const r = go(e, n, t, i), o = wo(r, e);
  return {
    result: vt(
      e,
      o,
      [r],
      o ? r.observationId : null,
      r.value == null ? "Elapsed return unavailable" : `${Co(e.windowSeconds)} return ${tt(r.value)}`
    ),
    observations: [r],
    anchor: null
  };
}
function Ec(e, n, t, i) {
  const r = [...new Set(e.windowsSeconds)].sort((u, f) => u - f).map(
    (u) => go(
      {
        ...e,
        id: `${e.id}:${u}`,
        type: "elapsedWindowReturn",
        windowSeconds: u
      },
      n,
      t,
      i
    )
  ), o = r.filter((u) => u.value != null).sort(
    (u, f) => (f.value ?? -1 / 0) - (u.value ?? -1 / 0) || (u.window ?? 1 / 0) - (f.window ?? 1 / 0)
  )[0] ?? null, a = he(n.candlesByTimeframe[i] ?? [], i, t), s = ln({
    series: n,
    asOf: t,
    timeframe: i,
    metricCode: "maximum_window_return",
    metricVersion: "maximum-window-return.1",
    window: (o == null ? void 0 : o.window) ?? null,
    logicalWindow: null,
    referenceTime: (o == null ? void 0 : o.referenceTime) ?? null,
    referenceValue: (o == null ? void 0 : o.referenceValue) ?? null,
    value: (o == null ? void 0 : o.value) ?? null,
    unit: "percent",
    percentile: (o == null ? void 0 : o.percentile) ?? null,
    zScore: (o == null ? void 0 : o.zScore) ?? null,
    sampleCount: (o == null ? void 0 : o.sampleCount) ?? 0,
    historyCandles: Ri(
      a,
      a.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: w(e),
    notes: o ? o.dataQualityNotes : [se("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = wo(s, e), l = [...r, s];
  return {
    result: vt(
      e,
      c,
      l,
      c ? (o == null ? void 0 : o.observationId) ?? null : null,
      (o == null ? void 0 : o.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Co(o.window ?? 0)} return ${tt(o.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function po(e, n, t) {
  const i = e.analysisTimeframe, r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, a = Mc(r, e.emaPeriod).at(-1) ?? null, s = Fc(r, e.atrPeriod).at(-1) ?? null, c = o && a != null && s != null && s > 0 ? (o.c - a) / s : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  o || u.push(se("NO_COMPLETED_CANDLE", "error", `No completed ${i} candle exists at cutoff`)), (r.length < l || c == null) && u.push(
    se(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${i} candles`
    )
  );
  const f = ln({
    series: n,
    asOf: t,
    timeframe: i,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: (o == null ? void 0 : o.bucket) ?? null,
    referenceValue: a,
    value: c,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: r.length,
    historyCandles: r.slice(-l),
    configHash: w(e),
    notes: Si(u)
  }), d = c != null && r.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: vt(
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
function go(e, n, t, i) {
  const r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, a = o ? Ti(r, o.bucket - e.windowSeconds) : null, s = o && a ? o.bucket - e.windowSeconds - a.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, l = o && a && !c && Y(a.c) ? (o.c / a.c - 1) * 100 : null, u = Nc(r, o, e), f = Eo(u, l, e.minimumSampleCount), d = [...f.notes];
  return o || d.push(se("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a ? c && d.push(se("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(se("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), ln({
    series: n,
    asOf: t,
    timeframe: i,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: (a == null ? void 0 : a.c) ?? null,
    value: l,
    unit: "percent",
    percentile: f.percentile,
    zScore: f.zScore,
    sampleCount: u.length,
    historyCandles: Ri(
      r,
      o,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: w(e),
    notes: Si(d)
  });
}
function wc(e) {
  var C;
  const n = e.detectorEvaluations.filter((k) => k.result.passed), t = zt(
    n.flatMap(
      (k) => k.observations.filter(
        (j) => j.observationId === k.result.winningObservationId
      )
    )
  ), i = ((C = n.find((k) => k.anchor)) == null ? void 0 : C.anchor) ?? null, r = he(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), o = pr(e.series, e.asOf, e.profile.scanTimeframe, 86400), a = pr(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = bo(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((k) => k.observations).find((k) => k.metricCode === "ema_atr_displacement") ?? null ?? po(
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
  ).observations[0], u = Oc(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = zt([
    ...t,
    o,
    a,
    s,
    l
  ]), d = n[0], m = d ? t.find(
    (k) => k.observationId === d.result.winningObservationId
  ) ?? t[0] ?? null : null, v = Rc(
    r,
    i,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    o,
    a,
    s,
    l,
    u
  ), p = Lc(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), y = p != null && p.candidate ? p : null, g = (y == null ? void 0 : y.candidate) ?? null, E = (y == null ? void 0 : y.asOf) ?? null, T = y && E != null ? qt({
    logicalObjectId: (g == null ? void 0 : g.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: y.updatedTs,
    knownAt: E,
    snapshot: y
  }) : null, O = g ? qt({
    logicalObjectId: g.id,
    objectType: "SetupCandidateEpisode",
    eventTime: g.detectionEventTime,
    knownAt: E ?? g.detectedAt,
    snapshot: g
  }) : null, I = {
    schemaVersion: pi,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: n.map((k) => k.result.detectorId),
    triggeringObservations: t,
    selectionGateEvaluationId: e.selectionEvaluation.id,
    hardGateResults: e.selectionEvaluation.hardGateResults,
    hardGateEvidence: e.hardGateEvidence,
    contextObservations: f,
    selectionAnchor: i,
    pathContext: v,
    initialLifecycleCandidateId: (g == null ? void 0 : g.id) ?? null,
    initialLifecycleCandidateRef: O,
    initialLifecycleState: (y == null ? void 0 : y.state) ?? null,
    initialLifecycleStateRef: T,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Si([
      ...f.flatMap((k) => k.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, b = `radar-episode:${X({
    symbol: I.symbol,
    source: I.source,
    profileHash: I.selectionProfileHash,
    detectedAt: I.detectedAt,
    triggeringObservationIds: t.map((k) => k.observationId)
  })}`, A = { ...I, id: b, logicalObjectId: b };
  return h({
    ...A,
    observationId: wi(A)
  });
}
function Tc(e, n, t, i) {
  const r = Object.keys(n.candlesByTimeframe).filter(
    (c) => he(n.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Pi), o = Object.fromEntries(
    r.map((c) => {
      var u, f;
      const l = he(n.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((f = l.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: l.at(-1) ? Me(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), a = r.filter(
    (c) => o[c].completedCandleCount > 0
  ), s = {
    schemaVersion: yo,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: So(t),
    lifecycleVersion: fe,
    strategyProfileRef: {
      id: i.id,
      version: i.version,
      profileHash: i.profileHash
    },
    availableTimeframes: a,
    preRollRequirements: Bc(t),
    dataCoverageByTimeframe: o,
    initialRadarObservations: e.contextObservations,
    initialHardGateResults: e.hardGateResults,
    initialHardGateEvidence: e.hardGateEvidence,
    initialLifecycleState: e.initialLifecycleState,
    initialLifecycleStateRef: e.initialLifecycleStateRef,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return h({
    ...s,
    id: Ao(s)
  });
}
function Ao(e) {
  const { id: n, ...t } = e;
  return `replay-case:${X(t)}`;
}
function wi(e) {
  const { observationId: n, ...t } = e;
  return `radar-episode-observation:${X(t)}`;
}
function pr(e, n, t, i) {
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
  }, o = he(e.candlesByTimeframe[t] ?? [], t, n), a = o.at(-1) ?? null, s = a ? Ti(o, a.bucket - i) : null, c = a && s && Y(s.c) ? (a.c / s.c - 1) * 100 : null, l = c == null ? [se("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${i}-second reference exists`)] : [];
  return ln({
    series: e,
    asOf: n,
    timeframe: t,
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
    historyCandles: o,
    configHash: w(r),
    notes: l
  });
}
function bo(e, n, t) {
  var f;
  const i = t.scanTimeframe, r = he(e.candlesByTimeframe[i] ?? [], i, n), o = r.at(-1) ?? null, a = o ? r.filter((d) => d.bucket > o.bucket - t.liquidityPolicy.windowSeconds) : [], s = a.map(
    (d) => En(d.v_quote) ? d.v_quote : En(d.v_base) ? d.v_base * d.c : null
  ), c = s.length > 0 && s.every((d) => d != null), l = c ? s.reduce((d, m) => d + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: i,
    windowSeconds: t.liquidityPolicy.windowSeconds
  };
  return ln({
    series: e,
    asOf: n,
    timeframe: i,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: t.liquidityPolicy.windowSeconds,
    referenceTime: ((f = a[0]) == null ? void 0 : f.bucket) ?? null,
    referenceValue: null,
    value: l,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: a.length,
    historyCandles: a,
    configHash: w(u),
    notes: c ? [] : [se("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function ln(e) {
  var u, f;
  const n = ((u = e.historyCandles[0]) == null ? void 0 : u.bucket) ?? null, t = ((f = e.historyCandles.at(-1)) == null ? void 0 : f.bucket) ?? null, i = e.timeframe && e.historyCandles.at(-1) ? Me(e.historyCandles.at(-1), e.timeframe) : e.asOf, r = e.timeframe ? e.historyCandles.reduce(
    (d, m) => Math.max(d, Be(m, e.timeframe)),
    i
  ) : e.asOf, o = w(
    e.historyCandles.map((d) => ({
      bucket: d.bucket,
      ts: d.ts,
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      vBase: En(d.v_base) ? d.v_base : null,
      vQuote: En(d.v_quote) ? d.v_quote : null,
      ver: En(d.ver) ? d.ver : null,
      knownAt: e.timeframe ? Be(d, e.timeframe) : null
    }))
  ), a = `radar-metric:${X({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.logicalWindow === void 0 ? e.window : e.logicalWindow,
    configHash: e.configHash
  })}`, s = {
    schemaVersion: gi,
    logicalObjectId: a,
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
    historyStart: n,
    historyEnd: t,
    configHash: e.configHash,
    inputHash: o,
    dataQualityNotes: e.notes
  }, c = `radar-observation:${X(s)}`, l = e.asOf;
  return h({
    ...s,
    observationId: c,
    requestId: `radar-observation-request:${X({ observationId: c, requestedAsOf: l })}`,
    requestedAsOf: l
  });
}
function Rc(e, n, t, i, r, o, a, s, c) {
  const l = n ? e.find((y) => y.bucket === n.timestamp) ?? null : null, f = (l ? e.filter((y) => y.bucket <= l.bucket) : []).reduce((y, g) => Y(g.c) && (!y || g.c > y.c || g.c === y.c && g.bucket < y.bucket) ? g : y, null), d = e.at(-1) ?? null, m = n && f && Y(f.c) ? (n.price / f.c - 1) * 100 : null, v = n && f && d && f.c > n.price ? (d.c - n.price) / (f.c - n.price) : null, p = n && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: r.value,
    net48hReturnPct: o.value,
    triggeringLocalImpulseReturnPct: (i == null ? void 0 : i.unit) === "percent" ? i.value : null,
    triggeringDetectorId: t,
    triggeringWindowSeconds: (i == null ? void 0 : i.window) ?? null,
    selectionAnchorPrice: (n == null ? void 0 : n.price) ?? null,
    selectionAnchorTime: (n == null ? void 0 : n.timestamp) ?? null,
    selectionAnchorAgeSeconds: (n == null ? void 0 : n.ageSeconds) ?? null,
    priorPeakPrice: (f == null ? void 0 : f.c) ?? null,
    priorPeakTime: (f == null ? void 0 : f.bucket) ?? null,
    priorDrawdownPct: m,
    recoveryFraction: v,
    currentAtrDisplacement: s.value,
    triggeringPercentile: (i == null ? void 0 : i.percentile) ?? null,
    triggeringZScore: (i == null ? void 0 : i.zScore) ?? null,
    quoteNotional: a.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([y, g]) => [
        y,
        typeof g.snapshot == "object" && g.snapshot != null && !Array.isArray(g.snapshot) && typeof g.snapshot.state == "string" ? g.snapshot.state : "unknown"
      ])
    ),
    contextTags: p
  };
}
function Sc(e, n, t, i, r, o) {
  const a = [];
  return {
    results: t.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = t.sourcePolicy.allowedSources == null || t.sourcePolicy.allowedSources.includes(e.source);
        return mn(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = zt(i.flatMap((v) => v.observations));
        a.push(...d);
        const m = !i.some(
          (v) => v.observations.some(
            (p) => p.dataQualityNotes.some((y) => y.severity === "error")
          )
        );
        return mn(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        a.push(r);
        const d = $c(r.status, t.executionVenuePolicy.mode);
        return mn(
          c,
          d,
          `Execution venue ${r.status}`,
          [r]
        );
      }
      if (c === "selectedUniverse") {
        const d = Hc(o, e, n);
        return d && a.push(d), mn(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const l = bo(e, n, t);
      a.push(l);
      const u = t.liquidityPolicy.minimumQuoteNotional, f = u == null || l.value == null ? u == null || t.liquidityPolicy.missingData === "warn" : l.value >= u;
      return mn(
        c,
        f,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: Qc(a)
  };
}
function mn(e, n, t, i) {
  return {
    code: e,
    passed: n,
    explanation: t,
    evidenceObservationIds: [...new Set(i.map((r) => r.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        i.flatMap(
          (r) => r.schemaVersion === gi ? [r.requestId] : []
        )
      )
    ].sort()
  };
}
function Cc(e, n, t, i) {
  const r = t.executionVenuePolicy.intendedVenue ?? "ignored", o = [...i].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === r.toLowerCase() && s.knownAt <= n && s.effectiveFrom <= n && (s.effectiveTo == null || s.effectiveTo >= n)
  );
  for (const s of o)
    if (mt(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const a = Ci(
    o,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return a || pc({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: r,
    status: "Unknown",
    effectiveFrom: n,
    effectiveTo: null,
    knownAt: n,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      se(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function Pc(e, n, t, i) {
  const r = {
    logicalObjectId: `selection-anchor:${X({
      symbol: e.symbol,
      source: e.source,
      timestamp: t.bucket,
      price: t.c,
      referenceField: "close"
    })}`,
    timestamp: t.bucket,
    price: t.c,
    ageSeconds: Math.max(0, n - Me(t, i.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: i.observationId
  };
  return h({
    ...r,
    observationId: `selection-anchor-observation:${X(r)}`
  });
}
function xt(e, n, t, i, r) {
  const o = {
    schemaVersion: vc,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: n,
    status: t,
    reason: i,
    rearmState: r
  };
  return h({
    ...o,
    observationId: `radar-status:${X(o)}`
  });
}
function Ic(e, n, t, i, r, o, a, s, c) {
  const l = {
    symbol: e.symbol,
    source: e.source,
    asOf: n,
    detectorResults: t,
    hardGateResults: i,
    hardGateEvidence: r,
    evaluable: c,
    detectorGatePassed: o,
    hardGatesPassed: a,
    compositePassed: s
  };
  return h({
    ...l,
    id: `radar-gate:${X(l)}`
  });
}
function vt(e, n, t, i, r) {
  var a;
  const o = n || t.every(
    (s) => s.dataQualityNotes.every((c) => c.severity !== "error")
  );
  return {
    detectorId: e.id,
    detectorType: e.type,
    evaluable: o,
    passed: n,
    observationIds: t.map((s) => s.observationId),
    observationRequestIds: t.map((s) => s.requestId),
    winningObservationId: i,
    winningObservationRequestId: ((a = t.find((s) => s.observationId === i)) == null ? void 0 : a.requestId) ?? null,
    explanation: r
  };
}
function he(e, n, t) {
  return ct(e, n, t);
}
function xc(e, n, t) {
  const i = _(n);
  return e.filter((r) => {
    if (!Number.isFinite(r.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (r.bucket + i > t) return !1;
    if (r.knownAt != null && !Number.isFinite(r.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${r.bucket}`);
    return Be(r, n) <= t;
  });
}
function kc(e, n) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const t = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([i, r]) => (on(i), [i, xc(r, i, n)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: t
  };
}
function Oc(e, n, t) {
  const i = e.filter(
    (o) => o.symbol.toUpperCase() === n.symbol.toUpperCase() && o.source === n.source && o.knownAt <= t
  );
  for (const o of i)
    if (ho(o) !== o.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const r = /* @__PURE__ */ new Map();
  for (const o of new Set(i.map((a) => a.timeframe))) {
    const a = Ci(
      i.filter((s) => s.timeframe === o),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${o}`
    );
    a && r.set(o, a);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([o], [a]) => Pi(o, a)).map(
      ([o, a]) => [
        o,
        qt({
          logicalObjectId: a.logicalObjectId,
          objectType: "MarketStructure",
          eventTime: a.eventTime,
          knownAt: a.knownAt,
          snapshot: { state: a.state, detail: a.snapshot }
        })
      ]
    )
  );
}
function Ti(e, n) {
  for (let t = e.length - 1; t >= 0; t -= 1)
    if (e[t].bucket <= n) return e[t];
  return null;
}
function Nc(e, n, t) {
  if (!n) return [];
  const i = n.bucket - t.historyLookbackSeconds, r = [];
  for (const o of e) {
    if (o.bucket < i || o.bucket >= n.bucket) continue;
    const a = Ti(e, o.bucket - t.windowSeconds);
    if (!a || !Y(a.c)) continue;
    const s = o.bucket - t.windowSeconds - a.bucket;
    t.maximumReferenceStalenessSeconds != null && s > t.maximumReferenceStalenessSeconds || r.push((o.c / a.c - 1) * 100);
  }
  return r;
}
function _c(e, n, t) {
  if (!n) return [];
  const i = n.bucket - t.historyLookbackSeconds, r = [];
  for (const o of e) {
    if (o.bucket < i || o.bucket >= n.bucket) continue;
    const a = e.filter(
      (s) => s.bucket <= o.bucket && s.bucket >= o.bucket - t.lookbackSeconds && o.bucket - s.bucket <= t.maximumTroughAgeSeconds && Y(s.c)
    ).sort((s, c) => s.c - c.c || s.bucket - c.bucket)[0];
    a && r.push((o.c / a.c - 1) * 100);
  }
  return r;
}
function Eo(e, n, t) {
  const i = [];
  if (e.length < t && i.push(
    se(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${t} historical samples but has ${e.length}`
    )
  ), n == null || e.length === 0 || e.length < t)
    return { percentile: null, zScore: null, notes: i };
  const r = e.filter((l) => l <= n).length / e.length * 100, o = e.reduce((l, u) => l + u, 0) / e.length, a = e.reduce((l, u) => l + (u - o) ** 2, 0) / e.length, s = Math.sqrt(a), c = s > 0 ? (n - o) / s : null;
  return { percentile: r, zScore: c, notes: i };
}
function Ri(e, n, t) {
  return n ? e.filter((i) => i.bucket >= n.bucket - t) : [];
}
function wo(e, n) {
  return e.value != null && bn(e.value, n.minimumReturnPct) && bn(e.percentile, n.minimumPercentile) && bn(e.zScore, n.minimumZScore) && e.sampleCount >= n.minimumSampleCount;
}
function Mc(e, n) {
  const t = new Array(e.length).fill(null);
  if (e.length < n) return t;
  let i = e.slice(0, n).reduce((o, a) => o + a.c, 0) / n;
  t[n - 1] = i;
  const r = 2 / (n + 1);
  for (let o = n; o < e.length; o += 1)
    i = e[o].c * r + i * (1 - r), t[o] = i;
  return t;
}
function Fc(e, n) {
  const t = new Array(e.length).fill(null);
  if (e.length < n) return t;
  const i = e.map((o, a) => {
    var c;
    const s = ((c = e[a - 1]) == null ? void 0 : c.c) ?? o.c;
    return Math.max(o.h - o.l, Math.abs(o.h - s), Math.abs(o.l - s));
  });
  let r = i.slice(0, n).reduce((o, a) => o + a, 0) / n;
  t[n - 1] = r;
  for (let o = n; o < i.length; o += 1)
    r = (r * (n - 1) + i[o]) / n, t[o] = r;
  return t;
}
function Lc(e, n, t, i) {
  const r = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= t
  );
  for (const s of r)
    Dc(s, n, t, i);
  const o = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), a = r.filter((s) => s.asOf === o);
  if (new Set(a.map((s) => S(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${o}`);
  return a[0] ?? null;
}
function Dc(e, n, t, i) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== fe || e.lifecycleVersion !== i.lifecycleVersion || e.lifecycleConfigHash !== i.lifecycleConfigHash || e.executionTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  ie(e.asOf, t, "lifecycle asOf"), ie(e.updatedTs, t, "lifecycle updatedTs"), ie(e.stateSince, t, "lifecycle stateSince");
  const r = e.candidate;
  if (r) {
    const o = [n.source, n.dataOrigin].filter((s) => s != null).some((s) => s.toLowerCase() === r.source.toLowerCase()), a = !r.venue.trim() || r.venue.toLowerCase() === n.source.toLowerCase();
    if (r.symbol.toUpperCase() !== n.symbol.toUpperCase() || !o || !a || r.setupFamily !== e.setupFamily || r.lifecycleVersion !== e.lifecycleVersion || r.lifecycleConfigHash !== e.lifecycleConfigHash || r.executionTimeframe !== i.timeframeRoles.executionTimeframe)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [s, c] of [
      ["candidate detectedAt", r.detectedAt],
      ["candidate detectionEventTime", r.detectionEventTime],
      ["candidate episodeHighTime", r.episodeHighTime],
      ["candidate stateSince", r.stateSince],
      ["candidate terminalAt", r.terminalAt]
    ])
      ie(c, t, s);
    for (const s of r.initialMtfContext)
      ie(s.updatedTs, t, "candidate MTF context updatedTs");
  }
  for (const o of e.evidence)
    if (ie(o.eventTime, t, "lifecycle evidence eventTime"), ie(o.knownAt, t, "lifecycle evidence knownAt"), o.knownAt < o.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const o of e.transitions)
    ie(o.knownAt, t, "lifecycle transition knownAt");
  for (const [o, a] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (a && (ie(a.eventTime, t, `${o} eventTime`), ie(a.knownAt, t, `${o} knownAt`), a.knownAt < a.eventTime))
      throw new Error(`${o} knownAt precedes eventTime`);
  for (const o of e.confluence)
    if (ie(o.eventTime, t, "lifecycle confluence eventTime"), ie(o.knownAt, t, "lifecycle confluence knownAt"), o.eventTime != null && o.knownAt != null && o.knownAt < o.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function ie(e, n, t) {
  if (e != null && (!Number.isFinite(e) || e > n))
    throw new Error(`${t} exceeds the radar cutoff`);
}
function Hc(e, n, t) {
  const i = [...e].filter(
    (r) => r.symbol.toUpperCase() === n.symbol.toUpperCase() && r.source === n.source && r.knownAt <= t && r.effectiveFrom <= t && (r.effectiveTo == null || r.effectiveTo >= t)
  );
  for (const r of i)
    if (dt(r) !== r.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Ci(
    i,
    (r) => [r.effectiveFrom, r.knownAt],
    "universe membership"
  );
}
function Bc(e) {
  const n = /* @__PURE__ */ new Map();
  function t(i, r, o, a) {
    const s = n.get(i) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    s.duration = Math.max(s.duration, r), s.bars = Math.max(s.bars, o), s.purposes.add(a), n.set(i, s);
  }
  t(e.scanTimeframe, 172800, 0, "24h/48h path context"), t(e.scanTimeframe, e.liquidityPolicy.windowSeconds, 0, "liquidity context");
  for (const i of e.moveDetectors)
    i.type === "rollingTroughRunup" ? t(e.scanTimeframe, i.lookbackSeconds, 0, i.id) : i.type === "elapsedWindowReturn" ? t(e.scanTimeframe, i.windowSeconds + i.historyLookbackSeconds, 0, i.id) : i.type === "maximumWindowReturn" ? t(
      e.scanTimeframe,
      Math.max(...i.windowsSeconds) + i.historyLookbackSeconds,
      0,
      i.id
    ) : t(
      i.analysisTimeframe,
      0,
      Math.max(i.emaPeriod, i.atrPeriod) + 1,
      i.id
    );
  return [...n.entries()].sort(([i], [r]) => Pi(i, r)).map(([i, r]) => ({
    timeframe: i,
    minimumDurationSeconds: r.duration,
    minimumBars: r.bars,
    purposes: [...r.purposes].sort()
  }));
}
function Vc(e, n) {
  const t = e.filter((r) => r.passed).length, i = e.filter((r) => !r.evaluable).length;
  return n.mode === "all" ? {
    passed: t === e.length,
    evaluable: e.some((r) => r.evaluable && !r.passed) || i === 0
  } : n.mode === "atLeast" ? {
    passed: t >= n.count,
    evaluable: t >= n.count || t + i < n.count
  } : {
    passed: t > 0,
    evaluable: t > 0 || i === 0
  };
}
function $c(e, n) {
  return n === "ignore" ? !0 : n === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Uc(e, n) {
  const t = on(n.scanTimeframe);
  return Math.floor(e / t) % n.evaluationCadence.everyBars === 0;
}
function H(e) {
  throw new RangeError(e);
}
function To(e) {
  var t;
  e.schemaVersion !== vo && H("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && H("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && H("Only impulse_fade_v1 radar profiles are supported");
  try {
    on(e.scanTimeframe);
  } catch {
    H("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && H("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && H("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || H("At least one move detector is required"), new Set(e.moveDetectors.map((i) => i.id)).size !== e.moveDetectors.length && H("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && H("Hard gates must be unique");
  const n = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((i) => !n.has(i)) && H("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || H("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && H("atLeast detector count must be between one and the detector count"), (!Y(e.episodeExpiry.maximumAgeSeconds) || !Y(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && H("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((i) => !i.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((t = e.executionVenuePolicy.intendedVenue) != null && t.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !Y(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && H("Radar profile policies are invalid");
  for (const i of e.moveDetectors) qc(i);
}
function qc(e) {
  if (e.id.trim() || H("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || H(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && H(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!oi(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && H(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!Y(e.historyLookbackSeconds) || !kt(e.minimumPercentile, 0, 100) || !kt(e.minimumZScore)) && H(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!Y(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !Y(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && H(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!kt(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && H(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !Y(e.windowSeconds) && H(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((n) => !Y(n)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && H(`Detector ${e.id} requires unique positive windows`);
}
function zc(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Ei(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: n, ...t } = e.selectionProfile;
  if (To(t), e.strategyProfile) {
    if (On(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: i, ...r } = e.strategyProfile;
    fo(r);
  }
}
function kt(e, n = -1 / 0, t = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= n && e <= t;
}
function bn(e, n) {
  return n == null || e != null && e + 1e-12 >= n;
}
function Y(e) {
  return Number.isFinite(e) && e > 0;
}
function En(e) {
  return e != null && Number.isFinite(e);
}
function se(e, n, t) {
  return { code: e, severity: n, message: t };
}
function Si(e) {
  return [...new Map(e.map((n) => [`${n.code}:${n.severity}:${n.message}`, n])).values()].sort((n, t) => n.code.localeCompare(t.code));
}
function zt(e) {
  return [...new Map(e.map((n) => [n.requestId, n])).values()].sort(Ro);
}
function Qc(e) {
  return [...new Map(e.map((n) => [n.observationId, n])).values()].sort(
    (n, t) => n.observationId.localeCompare(t.observationId)
  );
}
function Ci(e, n, t) {
  if (!e.length) return null;
  const i = [...e].sort((s, c) => {
    const l = n(s), u = n(c);
    for (let f = 0; f < Math.max(l.length, u.length); f += 1) {
      const d = (l[f] ?? -1 / 0) - (u[f] ?? -1 / 0);
      if (d !== 0) return d;
    }
    return s.observationId.localeCompare(c.observationId);
  }), r = i.at(-1), o = n(r), a = i.filter((s) => {
    const c = n(s);
    return c.length === o.length && c.every((l, u) => l === o[u]);
  });
  if (new Set(a.map((s) => s.observationId)).size > 1)
    throw new Error(`Conflicting ${t} observations at the same precedence`);
  return r;
}
function Ro(e, n) {
  return e.requestedAsOf - n.requestedAsOf || e.observationId.localeCompare(n.observationId) || e.requestId.localeCompare(n.requestId);
}
function jc(e, n) {
  return e.asOf - n.asOf || e.symbol.localeCompare(n.symbol) || e.source.localeCompare(n.source);
}
function Wc(e, n) {
  return e.detectedAt - n.detectedAt || e.id.localeCompare(n.id);
}
function Gc(e, n) {
  return e.asOf - n.asOf || e.observationId.localeCompare(n.observationId);
}
function Pi(e, n) {
  return on(e) - on(n) || e.localeCompare(n);
}
function on(e) {
  return _(e);
}
function So(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function tt(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Co(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function X(e) {
  return w(e).slice(8);
}
function Id(e) {
  return S(e);
}
const Po = /* @__PURE__ */ new WeakMap();
function Yc(e, n) {
  Po.set(e, n);
}
function ne(e) {
  const n = Po.get(e);
  if (!n)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return n;
}
const yt = "replay-engine.1", ke = "replay-engine.2", Ii = "replay-session-config.1", Io = "replay-session.1", xo = "replay-command.1", ko = "replay-event.1", Kc = "replay-decision-frame.1", Xc = "replay-wake-plan.1", Zc = "replay-wake-condition.1", Jc = "replay-wake-result.1", el = "replay-data-bundle.1", xi = "replay-outcome-envelope.1", ki = "replay-analysis-state.1", Oi = "replay-known-event.1";
var le, xn, Qt;
class xd {
  constructor(n) {
    Z(this, xn);
    Z(this, le);
    te(this, le, h({
      ...n,
      analysisStateHistory: n.analysisStateHistory ?? [],
      knownEvents: n.knownEvents ?? [],
      venueEvidence: n.venueEvidence ?? [],
      universeEvidence: n.universeEvidence ?? [],
      revisionHistoryAvailable: n.revisionHistoryAvailable ?? !1
    }));
  }
  async getCoverage(n) {
    var i, r;
    const t = J(this, xn, Qt).call(this, n);
    return {
      timeframe: n.timeframe,
      earliestOpenTime: ((i = t[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: ((r = t.at(-1)) == null ? void 0 : r.closeTime) ?? null,
      revisionHistoryAvailable: R(this, le).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(n) {
    return h(
      J(this, xn, Qt).call(this, n).filter(
        (t) => t.openTime >= n.from && t.openTime <= n.to
      )
    );
  }
  async loadCandleRevisions() {
    return [];
  }
  async loadAnalysisStateHistory(n) {
    return h(
      (R(this, le).analysisStateHistory ?? []).filter(
        (t) => wn(t, n) && t.knownAt >= n.from && t.knownAt <= n.to
      )
    );
  }
  async loadKnownEvents(n) {
    return h(
      (R(this, le).knownEvents ?? []).filter(
        (t) => wn(t, n) && t.knownAt >= n.from && t.knownAt <= n.to
      )
    );
  }
  async loadPointInTimeVenueEvidence(n) {
    return h(
      (R(this, le).venueEvidence ?? []).filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.marketDataSource === n.source && t.knownAt <= n.to && t.effectiveFrom <= n.to && (t.effectiveTo == null || t.effectiveTo >= n.from)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(n) {
    return h(
      (R(this, le).universeEvidence ?? []).filter(
        (t) => wn(t, n) && t.knownAt <= n.to && t.effectiveFrom <= n.to && (t.effectiveTo == null || t.effectiveTo >= n.from)
      )
    );
  }
  async loadRadarEpisode(n) {
    return h(
      R(this, le).radarEpisodes.find((t) => t.id === n) ?? null
    );
  }
}
le = new WeakMap(), xn = new WeakSet(), Qt = function(n) {
  return [...R(this, le).candles].filter(
    (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && t.timeframe === n.timeframe
  ).sort(
    (t, i) => t.openTime - i.openTime || t.knownAt - i.knownAt || t.observationId.localeCompare(i.observationId)
  );
};
function Ni(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function Oo(e, n) {
  if (e.schemaVersion !== Ii || !gt(e.replayEngineVersion))
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  Mo(e.strategyProfileRef, n);
  const t = e.evaluationTimeframe ?? n.timeframeRoles.executionTimeframe;
  _(t);
  const i = Mi(e.visibleTimeframes);
  if (!i.includes(t))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (gr(e.maximumCaseDuration, "maximumCaseDuration"), gr(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
    throw new RangeError("defaultWaitDeadline must fit within maximumSingleWaitDuration");
  for (const a of i) {
    const s = e.displayPreRollByTimeframe[a];
    if (!Number.isFinite(s) || s < 0)
      throw new RangeError(`Missing non-negative display pre-roll for ${a}`);
  }
  const r = [...new Set(e.allowedWakeConditionTypes)];
  if (!r.length)
    throw new RangeError("At least one wake condition type must be allowed");
  const o = {
    ...e,
    evaluationTimeframe: t,
    visibleTimeframes: i,
    displayPreRollByTimeframe: Object.fromEntries(
      Object.entries(e.displayPreRollByTimeframe).sort(
        ([a], [s]) => a.localeCompare(s)
      )
    ),
    allowedWakeConditionTypes: r,
    defaultWaitDeadline: e.defaultWaitDeadline ?? null,
    identityPresentationMode: e.identityPresentationMode ?? null,
    endOnRadarEpisodeTerminal: e.endOnRadarEpisodeTerminal ?? !1,
    endOnLifecycleTerminal: e.endOnLifecycleTerminal ?? !1,
    venueRulesRef: e.venueRulesRef ?? null
  };
  return h({
    ...o,
    canonicalConfigHash: Ni(o)
  });
}
function kd(e) {
  const n = Mi([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return Oo(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: Ii,
      replayEngineVersion: yt,
      visibleTimeframes: n,
      displayPreRollByTimeframe: Object.fromEntries(
        n.map((t) => [
          t,
          Math.max(_(t) * 200, 86400)
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
function ht(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function Nn(e) {
  const { observationId: n, ...t } = e;
  return `replay-candle-observation:${w(t).slice(8)}`;
}
function No(e) {
  const n = _(e.timeframe);
  if (!Number.isFinite(e.openTime) || e.openTime < 0)
    throw new RangeError("Candle openTime must be a non-negative finite timestamp");
  if (e.openTime % n !== 0)
    throw new RangeError("Candle openTime must align to its timeframe");
  for (const [o, a] of Object.entries({ o: e.o, h: e.h, l: e.l, c: e.c }))
    if (!Number.isFinite(a) || a <= 0) throw new RangeError(`Candle ${o} must be positive`);
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Candle high/low do not contain open and close");
  const t = e.openTime + n, i = e.knownAt ?? e.correctionPublishedAt ?? t;
  if (!Number.isFinite(i) || i < t)
    throw new RangeError("Candle knownAt cannot precede its close");
  if (e.correctionPublishedAt != null && (!Number.isFinite(e.correctionPublishedAt) || e.correctionPublishedAt < t || e.correctionPublishedAt > i))
    throw new RangeError("Correction publication time must fall between closeTime and knownAt");
  if (e.revision != null && (!Number.isInteger(e.revision) || e.revision < 0))
    throw new RangeError("Candle revision must be a non-negative integer");
  const r = {
    logicalCandleId: ht(e),
    symbol: e.symbol.toUpperCase(),
    source: e.source,
    timeframe: e.timeframe,
    openTime: e.openTime,
    closeTime: t,
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
  return h({ ...r, observationId: Nn(r) });
}
function pt(e) {
  const { id: n, ...t } = e;
  return `replay-analysis-state:${w(t).slice(8)}`;
}
function nl(e) {
  if (jt(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const n = {
    schemaVersion: ki,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...n, id: pt(n) });
}
function _i(e) {
  const { id: n, ...t } = e;
  return `replay-known-event:${w(t).slice(8)}`;
}
function Qn(e) {
  if (jt(e.eventTime, "eventTime"), jt(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && _(e.timeframe);
  const n = {
    schemaVersion: Oi,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...n, id: _i(n) });
}
async function tl(e) {
  var b, A, C, k, j, q;
  il(e);
  const { manifest: n, sessionConfig: t, historicalDataAdapter: i } = e, r = await ((b = i.loadRadarEpisode) == null ? void 0 : b.call(i, n.radarEpisodeId));
  if (!r) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  rl(n, r);
  const o = Mi([
    ...t.visibleTimeframes,
    t.evaluationTimeframe,
    ...n.preRollRequirements.map((M) => M.timeframe)
  ]), a = n.startAsOf + t.maximumCaseDuration, s = {}, c = {}, l = {}, u = [];
  for (const M of o) {
    const L = fl(n, e.strategyProfile, M), F = Math.max(0, n.startAsOf - L), Fe = t.displayPreRollByTimeframe[M] ?? 0, fn = Math.max(0, n.startAsOf - Fe);
    s[M] = F, c[M] = fn;
    const pe = await i.getCoverage({
      symbol: n.symbol,
      source: n.source,
      timeframe: M
    });
    if (pe.timeframe !== M) throw new Error(`Coverage timeframe mismatch for ${M}`);
    if (pe.earliestOpenTime == null || pe.earliestOpenTime > F)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${M}`);
    pe.earliestOpenTime > fn && u.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${M} display history begins after the configured display pre-roll`
    }), pe.revisionHistoryAvailable || u.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${M} candle revision history is unavailable`
    });
    const Bn = await i.loadCandleHistory({
      symbol: n.symbol,
      source: n.source,
      timeframe: M,
      from: F,
      to: a
    }), Vn = pe.revisionHistoryAvailable ? await ((A = i.loadCandleRevisions) == null ? void 0 : A.call(i, {
      symbol: n.symbol,
      source: n.source,
      timeframe: M,
      from: F,
      to: a
    })) ?? [] : [];
    l[M] = ol(
      [...Bn, ...Vn].filter((P) => P.knownAt <= a),
      n,
      M,
      F,
      a
    );
  }
  const f = {
    symbol: n.symbol,
    source: n.source,
    from: Math.min(...Object.values(s)),
    to: a
  }, d = al(
    await ((C = i.loadAnalysisStateHistory) == null ? void 0 : C.call(i, f)) ?? [],
    n
  );
  if (!d.some((M) => M.knownAt <= n.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = sl(
    await ((k = i.loadKnownEvents) == null ? void 0 : k.call(i, f)) ?? [],
    n
  ), v = cl(
    await ((j = i.loadPointInTimeVenueEvidence) == null ? void 0 : j.call(i, f)) ?? [],
    n
  ), p = ll(
    await ((q = i.loadPointInTimeUniverseEvidence) == null ? void 0 : q.call(i, f)) ?? [],
    n
  ), y = {
    schemaVersion: el,
    symbol: n.symbol.toUpperCase(),
    source: n.source,
    analysisStartByTimeframe: s,
    displayStartByTimeframe: c,
    candlesByTimeframe: l,
    analysisStateHistory: d,
    knownEvents: m,
    venueEvidence: v,
    universeEvidence: p,
    radarEpisode: r,
    dataQualityNotes: u
  }, g = await tn(y), E = await _o(y, n.startAsOf), T = h({
    ...y,
    causalPrefixFingerprint: E,
    internalBundleFingerprint: g
  }), O = h({
    ...y,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(l).map(([M, L]) => [
        M,
        L.filter(
          (F) => F.closeTime <= n.startAsOf && F.knownAt <= n.startAsOf
        )
      ])
    ),
    analysisStateHistory: d.filter(
      (M) => M.knownAt <= n.startAsOf
    ),
    knownEvents: m.filter((M) => M.knownAt <= n.startAsOf),
    venueEvidence: v.filter((M) => M.knownAt <= n.startAsOf),
    universeEvidence: p.filter((M) => M.knownAt <= n.startAsOf),
    causalPrefixFingerprint: E
  }), I = {
    manifest: h(n),
    sessionConfig: h(t),
    strategyProfile: h(e.strategyProfile),
    radarSelectionProfile: h(e.radarSelectionProfile),
    venueRules: h(e.venueRules ?? null),
    dataBundle: O,
    ...e.materializedAnalysisBinding ? { materializedAnalysisBinding: h(e.materializedAnalysisBinding) } : {}
  };
  return Yc(I, T), I;
}
async function Od(e, n) {
  if (n > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: t, ...i } = e.dataBundle;
  return _o(i, n);
}
async function _o(e, n) {
  return tn({
    schemaVersion: e.schemaVersion,
    symbol: e.symbol,
    source: e.source,
    radarEpisode: e.radarEpisode,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(e.candlesByTimeframe).map(([t, i]) => [
        t,
        i.filter((r) => r.closeTime <= n && r.knownAt <= n)
      ])
    ),
    analysisStateHistory: e.analysisStateHistory.filter((t) => t.knownAt <= n),
    knownEvents: e.knownEvents.filter((t) => t.knownAt <= n),
    venueEvidence: e.venueEvidence.filter((t) => t.knownAt <= n),
    universeEvidence: e.universeEvidence.filter((t) => t.knownAt <= n),
    dataQualityNotes: e.dataQualityNotes
  });
}
async function tn(e) {
  var i;
  if (!((i = globalThis.crypto) != null && i.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const n = new TextEncoder().encode(S(e)), t = await globalThis.crypto.subtle.digest("SHA-256", n);
  return `sha256:${[...new Uint8Array(t)].map((r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function il(e) {
  const { manifest: n, sessionConfig: t, strategyProfile: i, radarSelectionProfile: r } = e;
  if (n.schemaVersion !== yo || Ao(n) !== n.id || n.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (n.startAsOf !== n.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (Ei(r) !== r.canonicalConfigHash || n.selectionProfileRef.id !== r.id || n.selectionProfileRef.version !== r.version || n.selectionProfileRef.canonicalConfigHash !== r.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (On(i) !== i.profileHash || i.lifecycleVersion !== fe || n.lifecycleVersion !== i.lifecycleVersion || n.strategyProfileRef.id !== i.id || n.strategyProfileRef.version !== i.version || n.strategyProfileRef.profileHash !== i.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (t.schemaVersion !== Ii || !gt(t.replayEngineVersion) || Ni(t) !== t.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (t.replayEngineVersion === ke && (!e.materializedAnalysisBinding || e.materializedAnalysisBinding.replayEngineVersion !== ke || e.materializedAnalysisBinding.lifecycleConfigHash !== i.lifecycleConfigHash || e.materializedAnalysisBinding.radarProfileHash !== r.canonicalConfigHash || e.materializedAnalysisBinding.strategyProfileHash !== i.profileHash))
    throw new Error("Materialized replay configuration is missing its analysis binding");
  if (t.replayEngineVersion === yt && e.materializedAnalysisBinding)
    throw new Error("replay-engine.1 cannot accept a materialized analysis binding");
  if (Mo(t.strategyProfileRef, i), t.evaluationTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (t.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (t.venueRulesRef && e.venueRules) {
    const o = dl(e.venueRules);
    if (S(o) !== S(t.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function gt(e) {
  return e === yt || e === ke;
}
function rl(e, n) {
  var i, r, o;
  if (n.schemaVersion !== pi || n.id !== e.radarEpisodeId || n.observationId !== e.radarEpisodeObservationId || wi(n) !== n.observationId || n.symbol.toUpperCase() !== e.symbol.toUpperCase() || n.source !== e.source || n.detectedAt !== e.detectedAt || n.effectiveAsOf !== e.startAsOf)
    throw new Error("RadarEpisode sidecar does not match the ReplayCaseManifest");
  if ([
    ...n.triggeringObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...n.contextObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...n.hardGateEvidence.map((a) => a.knownAt),
    (i = n.selectionAnchor) == null ? void 0 : i.timestamp,
    (r = n.initialLifecycleCandidateRef) == null ? void 0 : r.knownAt,
    (o = n.initialLifecycleStateRef) == null ? void 0 : o.knownAt,
    ...Object.values(n.initialMtfStructure).map((a) => a.knownAt)
  ].filter((a) => a != null).some((a) => !Number.isFinite(a) || a > e.startAsOf))
    throw new Error("RadarEpisode contains evidence unavailable at replay start");
}
function ol(e, n, t, i, r) {
  const o = /* @__PURE__ */ new Map();
  for (const s of e) {
    const c = No({
      symbol: s.symbol,
      source: s.source,
      timeframe: s.timeframe,
      openTime: s.openTime,
      o: s.o,
      h: s.h,
      l: s.l,
      c: s.c,
      vBase: s.vBase,
      vQuote: s.vQuote,
      knownAt: s.knownAt,
      revision: s.revision,
      correctionPublishedAt: s.correctionPublishedAt
    });
    if (s.symbol.toUpperCase() !== n.symbol.toUpperCase() || s.source !== n.source || s.timeframe !== t || s.openTime < i || s.openTime > r || s.logicalCandleId !== ht(s) || s.observationId !== Nn(s) || S(s) !== S(c))
      throw new Error(`Invalid replay candle provenance for ${t}`);
    const l = S(s), u = o.get(s.observationId);
    if (u && S(u) !== l)
      throw new Error(`Conflicting candle observation ${s.observationId}`);
    o.set(s.observationId, s);
  }
  const a = [...o.values()].sort(
    (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt || s.observationId.localeCompare(c.observationId)
  );
  for (const s of [...new Set(a.map((c) => c.knownAt))])
    ct(a.map(ul), t, s);
  return h(a);
}
function al(e, n) {
  const t = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (r.schemaVersion !== ki || r.id !== pt(r) || !wn(r, n))
      throw new Error("Analysis state observation failed provenance verification");
    const o = i.get(r.knownAt);
    if (o && S(o) !== S(r))
      throw new Error(`Conflicting analysis states at ${r.knownAt}`);
    i.set(r.knownAt, r);
  }
  return h([...i.values()]);
}
function sl(e, n) {
  const t = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (r.schemaVersion !== Oi || r.id !== _i(r) || !wn(r, n) || r.knownAt < r.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const o = i.get(r.id);
    if (o && S(o) !== S(r))
      throw new Error(`Conflicting replay known event ${r.id}`);
    i.set(r.id, r);
  }
  return h([...i.values()]);
}
function cl(e, n) {
  return h(
    e.map((t) => {
      var r;
      const i = t;
      if (i.schemaVersion !== Ai || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== n.symbol.toUpperCase() || i.marketDataSource !== n.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== mt(i))
        throw new Error("Execution-venue evidence failed provenance verification");
      return i;
    }).sort((t, i) => t.knownAt - i.knownAt)
  );
}
function ll(e, n) {
  return h(
    e.map((t) => {
      var r;
      const i = t;
      if (i.schemaVersion !== bi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== n.symbol.toUpperCase() || i.source !== n.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== dt(i))
        throw new Error("Universe evidence failed provenance verification");
      return i;
    }).sort((t, i) => t.knownAt - i.knownAt)
  );
}
function ul(e) {
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
function fl(e, n, t) {
  const i = e.preRollRequirements.filter((o) => o.timeframe === t).reduce(
    (o, a) => Math.max(
      o,
      a.minimumDurationSeconds,
      a.minimumBars * _(t)
    ),
    0
  ), r = t === n.timeframeRoles.candidateTimeframe ? 180 * 86400 : t === n.timeframeRoles.structureTimeframe || n.timeframeRoles.contextTimeframes.includes(t) ? 90 * 86400 : _(t) * 250;
  return Math.max(i, r);
}
function dl(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: w(e)
  };
}
function Mo(e, n) {
  if (e.id !== n.id || e.version !== n.version || e.profileHash !== n.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function Mi(e) {
  const n = [];
  for (const t of e)
    _(t), n.includes(t) || n.push(t);
  if (!n.length) throw new RangeError("At least one timeframe is required");
  return n;
}
function gr(e, n) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${n} must be a positive integer number of seconds`);
}
function jt(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite timestamp`);
}
function wn(e, n) {
  return e.symbol.toUpperCase() === n.symbol.toUpperCase() && e.source === n.source;
}
const Fo = "linear-quote-perpetual-risk.1", ml = "sizing-result.1", Lo = "trade-plan.1", vl = "decision-record.1";
function Do(e) {
  const n = [], t = [
    Le(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && n.push(Le("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((F) => !Number.isFinite(F) || F <= 0) && n.push(Le("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && n.push(Le("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && N(
    n,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!jn(e.intendedEntryPrice, e.venueRules.priceTick) || !jn(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (F) => !jn(F.targetPrice, e.venueRules.priceTick)
  )) && N(
    n,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !jn(e.leveragePolicy.leverage, e.venueRules.leverageStep) && N(
    n,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && t.push(
    Le(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const r = e.riskRequest.accountRiskFraction != null, o = e.riskRequest.fixedRiskAmount != null;
  r === o && n.push(
    Le(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (r && (!ue(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || o && (!ue(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && N(
    n,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (F) => !Number.isFinite(F) || F < 0
  ) && N(
    n,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && N(
    n,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const a = o ? e.riskRequest.fixedRiskAmount : r ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (a == null || !Number.isFinite(a) || a <= 0) && N(n, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), pl(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    n
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = ue(s) ? s : null, l = ue(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && N(n, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = a != null && u != null && u > 0 ? a / u : null;
  let d = f == null ? null : Ar(f, e.venueRules.quantityStep);
  if (d != null && a != null && u != null)
    for (; d > 0 && d * u > a + Math.max(1e-10, a * 1e-12); )
      d = Ar(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = d != null && d > 0 ? d : null, v = m == null ? null : m * e.intendedEntryPrice, p = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, y = m == null || l == null ? null : m * l * e.executionAssumptions.stopExitFeeRate, g = m == null || u == null ? null : m * u;
  (m == null || m < e.venueRules.minQuantity) && N(
    n,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && N(
    n,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const E = e.riskRequest.maximumNotional;
  E != null && v != null && v > E && N(
    n,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${E}`
  );
  const T = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, O = e.accountState.availableBalance == null ? T : Math.min(T, e.accountState.availableBalance), I = v != null && O > 0 ? v / O : null, b = Tl(
    e.leveragePolicy,
    I,
    e.venueRules.leverageStep
  );
  b != null && b > e.venueRules.maxLeverage && N(
    n,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${b} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const A = v != null && b != null && b > 0 ? v / b : null;
  A != null && A > T + 1e-10 && N(
    n,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), A != null && e.accountState.availableBalance != null && A > e.accountState.availableBalance + 1e-10 && N(
    n,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const C = m != null && c != null && l != null ? m * (l - c) : null, k = gl(
    e.targets,
    m,
    c,
    C,
    g,
    e.executionAssumptions
  ), j = Wn(
    k.map((F) => F.grossReward * F.positionFraction)
  ), q = Wn(
    k.map((F) => F.netProjectedReward * F.positionFraction)
  ), M = Wn(
    k.map(
      (F) => F.weightedGrossRContribution == null ? null : F.weightedGrossRContribution
    )
  ), L = Wn(
    k.map(
      (F) => F.weightedRContribution == null ? null : F.weightedRContribution
    )
  );
  return h({
    schemaVersion: ml,
    sizingModelVersion: Fo,
    side: e.side,
    riskBudget: a,
    rawQuantity: f,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: v,
    estimatedEntryFee: p,
    estimatedStopFee: y,
    projectedLossAtStop: g,
    projectedLossPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    selectedLeverage: b,
    minimumRequiredLeverage: I,
    initialMargin: A,
    marginPercentEquity: A == null || e.accountState.equity <= 0 ? null : A / e.accountState.equity * 100,
    marginPercentAvailableBalance: A == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : A / e.accountState.availableBalance * 100,
    targetOutcomes: k,
    weightedGrossReward: j,
    weightedProjectedReward: q,
    weightedGrossR: M,
    weightedProjectedR: L,
    liquidationStatus: {
      status: "unavailable",
      exactPrice: null,
      modelVersion: null,
      reason: "EXACT_LIQUIDATION_MODEL_UNAVAILABLE"
    },
    hardErrors: n,
    warnings: t
  });
}
function yl(e) {
  var o;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const n = Do({
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
  }), t = {
    schemaVersion: Lo,
    snapshotId: e.snapshot.id,
    setupFamily: Ie,
    lifecycleVersion: fe,
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
    sizingResult: n,
    venueRules: e.venueRules,
    leveragePolicy: e.leveragePolicy,
    executionAssumptions: e.strategyProfile.executionAssumptions,
    discretionaryOverrideReason: ((o = e.discretionaryOverrideReason) == null ? void 0 : o.trim()) || null,
    status: e.status,
    createdAt: e.createdAt
  }, i = { ...t, id: e.id ?? Fi(t) }, r = hl({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: i
  });
  return h({ ...i, complianceResult: r });
}
function hl(e) {
  var d, m;
  const { strategyProfile: n, snapshot: t, plan: i } = e, r = [...i.sizingResult.hardErrors], o = [], a = [...i.sizingResult.warnings], s = Do({
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
    targetFractionTolerance: n.targetPolicy.fractionTolerance
  });
  (On(n) !== n.profileHash || hi(t) !== t.id || Fi(i) !== i.id || S(s) !== S(i.sizingResult)) && N(
    r,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), i.venueRules.symbol.toUpperCase() !== t.symbol.toUpperCase() && N(
    r,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (t.snapshotSchemaVersion !== uo || t.strategyProfileId !== n.id || t.strategyProfileVersion !== n.version || t.strategyProfileHash !== n.profileHash || t.lifecycleVersion !== n.lifecycleVersion || t.lifecycleConfigHash !== n.lifecycleConfigHash || i.setupFamily !== n.setupFamily || i.lifecycleVersion !== n.lifecycleVersion || i.lifecycleConfigHash !== n.lifecycleConfigHash || i.strategyProfileId !== n.id || i.strategyProfileVersion !== n.version || i.strategyProfileHash !== n.profileHash || S(i.executionAssumptions) !== S(n.executionAssumptions)) && N(
    r,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), n.entryPolicy.permittedOrderPlanTypes.includes(i.entryPlan.orderPlanType) || N(
    o,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${i.entryPlan.orderPlanType} is not permitted by the profile`
  ), n.stopPolicy.permittedDerivations.includes(i.stopPlan.derivationType) || N(
    o,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${i.stopPlan.derivationType} is not permitted`
  );
  for (const v of i.targetPlans)
    n.targetPolicy.permittedDerivations.includes(v.derivationType) || N(
      o,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  i.targetPlans.length > n.targetPolicy.maximumTargets && N(
    o,
    "TOO_MANY_TARGETS",
    `Plan has more than ${n.targetPolicy.maximumTargets} targets`
  );
  const c = i.targetPlans.reduce(
    (v, p) => v + p.positionFraction,
    0
  );
  Math.abs(c - 1) > n.targetPolicy.fractionTolerance && N(
    r,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${n.targetPolicy.fractionTolerance}`
  ), El(t, i, r), wl(i, r), Al(t, n, o), bl(t, n, o), n.stopPolicy.requireOutsideEpisodeHigh && ((d = t.candidateEpisode) == null ? void 0 : d.episodeHigh) != null && i.stopPlan.stopPrice <= t.candidateEpisode.episodeHigh && N(
    o,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), i.sizingResult.initialMargin != null && i.sizingResult.initialMargin > i.accountState.equity * n.riskPolicy.maximumMarginAllocationFraction + 1e-10 && N(
    o,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), n.riskPolicy.maximumNotional != null && i.sizingResult.grossNotional != null && i.sizingResult.grossNotional > n.riskPolicy.maximumNotional && N(
    o,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), n.entryPolicy.minimumRewardRisk != null && i.sizingResult.weightedProjectedR != null && i.sizingResult.weightedProjectedR < n.entryPolicy.minimumRewardRisk && N(
    o,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${i.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${n.entryPolicy.minimumRewardRisk}`
  ), i.sizingResult.projectedLossAtStop != null && i.sizingResult.projectedLossAtStop > i.accountState.equity * n.riskPolicy.maximumAccountRiskFraction + 1e-10 && N(
    o,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const l = o.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), u = ((m = i.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  i.status === "finalized" && o.length > 0 && !l && !u && N(
    r,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return r.length > 0 ? f = "InvalidPlan" : l ? f = "OutOfStrategy" : o.length === 0 ? f = "Compliant" : u ? f = "Overridden" : f = "OutOfStrategy", h({
    classification: f,
    hardErrors: r,
    strategyViolations: o,
    warnings: a,
    overrideReason: u
  });
}
function Ot(e) {
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
  const n = {
    schemaVersion: vl,
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
  }, t = e.id ?? `decision:${w(n).slice(8)}`;
  return h({ ...n, id: t });
}
function pl(e, n, t, i) {
  (!e.length || e.some((o) => o.targetPrice >= n)) && N(i, "NO_VALID_TARGET", "Every short target must be below entry");
  const r = e.reduce((o, a) => o + a.positionFraction, 0);
  (e.some(
    (o) => !Number.isFinite(o.positionFraction) || o.positionFraction <= 0
  ) || Math.abs(r - 1) > t) && N(
    i,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function gl(e, n, t, i, r, o) {
  return n == null || t == null ? [] : e.map((a) => {
    const s = a.targetPrice * (1 + o.adverseTargetSlippageBps / 1e4), c = n * (t - s), l = n * t * o.entryFeeRate, u = n * s * o.targetExitFeeRate, f = c - l - u, d = i != null && i > 0 ? c / i : null, m = r != null && r > 0 ? f / r : null;
    return {
      targetId: a.id,
      targetPrice: a.targetPrice,
      effectiveTargetPrice: s,
      positionFraction: a.positionFraction,
      grossReward: c,
      expectedEntryFee: l,
      expectedExitFee: u,
      netProjectedReward: f,
      grossR: d,
      projectedR: m,
      weightedGrossRContribution: d == null ? null : d * a.positionFraction,
      weightedRContribution: m == null ? null : m * a.positionFraction
    };
  });
}
function Al(e, n, t) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    N(t, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  n.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (N(
    t,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && N(
    t,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && N(
    t,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const r = e.lifecycleEvidence.some(
    (o) => o.code === "bearish_retest_rejection"
  );
  (n.entryPolicy.retestRequired || n.entryPolicy.confirmedRejectionRequired) && !r && N(
    t,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && n.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > n.entryPolicy.maxAgeSinceEntryCandidateSeconds && N(t, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function bl(e, n, t) {
  var c;
  const i = n.entryPolicy.requiredDataQuality, r = i.candidateMetricsRequired && e.candidateMetrics == null, o = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, a = i.minimumHistoryCoverageRatio != null && (o == null || o < i.minimumHistoryCoverageRatio), s = e.dataQualityNotes.some(
    (l) => i.rejectedNoteSeverities.includes(l.severity)
  );
  (r || a || s) && N(
    t,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function El(e, n, t) {
  const i = new Map(
    mo(e).map((o) => [o.id, o])
  ), r = [
    {
      requiresReference: !1,
      id: n.entryPlan.associatedReferenceLevelId,
      reference: n.entryPlan.associatedReferenceLevel
    },
    {
      requiresReference: n.stopPlan.derivationType !== "manual",
      id: n.stopPlan.referenceLevelId,
      reference: n.stopPlan.referenceLevel
    },
    ...n.targetPlans.map((o) => ({
      requiresReference: o.derivationType !== "manual" && o.derivationType !== "fixedRMultiple",
      id: o.referenceLevelId,
      reference: o.referenceLevel
    }))
  ];
  for (const o of r) {
    if (!o.id && !o.reference && !o.requiresReference) continue;
    if (!o.id || !o.reference) {
      N(
        t,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    o.reference.knownAt > e.effectiveAsOf && N(
      t,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${o.id} was not known at the decision cutoff`
    );
    const a = i.get(o.id);
    a ? S(a) !== S(o.reference) && N(
      t,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${o.id} differs from the frozen snapshot object`
    ) : N(
      t,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${o.id} is absent from the decision snapshot`
    );
  }
}
function wl(e, n) {
  const t = e.venueRules.priceTick, i = e.entryPlan.associatedReferenceLevel;
  i && Math.abs(e.entryPlan.intendedPrice - i.price) > t + 1e-12 && N(
    n,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const r = e.stopPlan.referenceLevel;
  if (r && e.stopPlan.derivationType !== "manual") {
    const o = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? r.rangeHigh ?? r.price : r.price, { basisPoints: a, atrFraction: s, atrValue: c } = e.stopPlan.buffer;
    let l = o;
    a != null && s != null ? N(
      n,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : a != null ? l = o * (1 + a / 1e4) : s != null && (ue(c ?? 0) ? l = o + s * (c ?? 0) : N(
      n,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - l) > t + 1e-12 && N(
      n,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const o of e.targetPlans) {
    const a = o.referenceLevel;
    if (!a || o.derivationType === "manual" || o.derivationType === "fixedRMultiple")
      continue;
    (o.derivationType === "supportZone" ? o.targetPrice >= (a.rangeLow ?? a.price) - t && o.targetPrice <= (a.rangeHigh ?? a.price) + t : Math.abs(o.targetPrice - a.price) <= t + 1e-12) || N(
      n,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${o.id} does not match its frozen reference`
    );
  }
}
function Tl(e, n, t) {
  return e.mode === "manual" ? ue(e.leverage) ? e.leverage : null : n == null ? null : Math.max(1, Rl(n, t));
}
function Fi(e) {
  const {
    id: n,
    complianceResult: t,
    ...i
  } = e;
  return `trade-plan:${w(i).slice(8)}`;
}
function Ar(e, n) {
  if (!ue(e) || !ue(n)) return 0;
  const t = Ho(n);
  return Number((Math.floor(e / n + 1e-12) * n).toFixed(t));
}
function Rl(e, n) {
  if (!ue(e) || !ue(n)) return e;
  const t = Ho(n);
  return Number((Math.ceil(e / n - 1e-12) * n).toFixed(t));
}
function Ho(e) {
  const n = e.toString().toLowerCase();
  return n.includes("e-") ? Number(n.split("e-")[1]) : n.includes(".") ? n.length - n.indexOf(".") - 1 : 0;
}
function jn(e, n) {
  if (!Number.isFinite(e) || !ue(n)) return !1;
  const t = Math.round(e / n) * n;
  return Math.abs(e - t) <= Math.max(1e-12, n * 1e-9);
}
function Wn(e) {
  return e.some((n) => n == null) ? null : e.reduce((n, t) => n + (t ?? 0), 0);
}
function ue(e) {
  return Number.isFinite(e) && e > 0;
}
function Le(e, n) {
  return { code: e, message: n };
}
function N(e, n, t) {
  e.some((i) => i.code === n) || e.push(Le(n, t));
}
const _n = "execution-engine.1", Bo = "execution-profile.1", Vo = "execution-session.1", Sl = "execution-order.1", Cl = "execution-fill.1", $o = "execution-event.1", Pl = "execution-result.1", Il = "execution-data-bundle.1", Li = "execution-candle.1", Uo = "execution-trade.1", qo = "execution-quote.1", xl = "execution-path-resolution.1", Di = "venue-execution-rules.1", kl = "venue-fee-schedule.1", zo = "funding-observation.1", Ol = "position-ledger.1";
var re;
class Nl {
  constructor(n) {
    Z(this, re);
    ge(this, "fundingDataAvailable");
    ge(this, "tradeDataCompleteness");
    ge(this, "quoteDataCompleteness");
    this.fundingDataAvailable = n.fundingDataAvailable ?? n.funding !== void 0, this.tradeDataCompleteness = n.tradeDataCompleteness ?? (n.trades ? "partial" : "unavailable"), this.quoteDataCompleteness = n.quoteDataCompleteness ?? (n.quotes ? "partial" : "unavailable"), te(this, re, h({
      ...n,
      funding: n.funding ?? [],
      fundingDataAvailable: n.fundingDataAvailable ?? n.funding !== void 0,
      trades: n.trades ?? [],
      tradeDataCompleteness: n.tradeDataCompleteness ?? (n.trades ? "partial" : "unavailable"),
      quotes: n.quotes ?? [],
      quoteDataCompleteness: n.quoteDataCompleteness ?? (n.quotes ? "partial" : "unavailable"),
      markPrices: n.markPrices ?? [],
      indexPrices: n.indexPrices ?? [],
      venueRuleEvidence: n.venueRuleEvidence ?? []
    }));
  }
  async getCoverage(n) {
    const t = /* @__PURE__ */ new Map();
    for (const i of R(this, re).candles.filter((r) => Se(r, n))) {
      const r = t.get(i.timeframe) ?? [];
      r.push(i), t.set(i.timeframe, r);
    }
    return h(Object.fromEntries([...t].map(([i, r]) => [
      i,
      {
        from: Math.min(...r.map((o) => o.openTime)),
        to: Math.max(...r.map((o) => o.closeTime)),
        count: r.length
      }
    ])));
  }
  async loadCandles(n) {
    return h(R(this, re).candles.filter(
      (t) => Se(t, n) && t.timeframe === n.timeframe && t.openTime >= n.from && t.openTime <= n.to
    ).sort(Ll));
  }
  async loadTrades(n) {
    return h((R(this, re).trades ?? []).filter(
      (t) => Se(t, n) && vn(t.eventTime, n)
    ).sort(Gn));
  }
  async loadQuotes(n) {
    return h((R(this, re).quotes ?? []).filter(
      (t) => Se(t, n) && vn(t.eventTime, n)
    ).sort(Gn));
  }
  async loadMarkPrices(n) {
    return h((R(this, re).markPrices ?? []).filter(
      (t) => Se(t, n) && vn(t.eventTime, n)
    ).sort(Gn));
  }
  async loadIndexPrices(n) {
    return h((R(this, re).indexPrices ?? []).filter(
      (t) => Se(t, n) && vn(t.eventTime, n)
    ).sort(Gn));
  }
  async loadFundingObservations(n) {
    return h((R(this, re).funding ?? []).filter(
      (t) => Se(t, n) && vn(t.fundingTime, n)
    ).sort((t, i) => t.fundingTime - i.fundingTime || t.id.localeCompare(i.id)));
  }
  async loadVenueRuleEvidence(n) {
    return h((R(this, re).venueRuleEvidence ?? []).filter(
      (t) => Se(t, n)
    ));
  }
}
re = new WeakMap();
function Qo(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function _l(e) {
  if (e.schemaVersion !== Bo || e.executionEngineVersion !== _n) throw new Error("Unsupported execution profile schema or engine version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Execution profile id and version are required");
  if (e.ambiguityPolicy !== "StrictAmbiguity")
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  Nt(e.orderActivationPolicy.delaySeconds, "activation delay"), Dl(e.maximumExecutionHorizon, "execution horizon"), Nt(
    e.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks"
  ), Nt(
    e.targetFillPolicy.penetrationTicks,
    "target penetration ticks"
  );
  for (const i of [
    e.slippageModel.marketEntryBps,
    e.slippageModel.stopExitBps,
    e.slippageModel.marketExitBps
  ]) if (!Number.isFinite(i) || i < 0) throw new RangeError("Slippage bps must be non-negative");
  const n = [...new Set(e.pathResolutionPolicy.candleTimeframesFinestFirst)];
  if (n.forEach(_), !n.length) throw new RangeError("Execution profile requires candle resolution timeframes");
  const t = h({
    ...e,
    pathResolutionPolicy: { candleTimeframesFinestFirst: n }
  });
  return h({ ...t, canonicalConfigHash: Qo(t) });
}
function Nd(e) {
  return _l({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: Bo,
    executionEngineVersion: _n,
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
function jo(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function _d(e) {
  if (e.schemaVersion !== kl)
    throw new Error("Unsupported venue fee schedule schema");
  if (Ko(e.effectiveFrom, e.effectiveUntil, "fee schedule"), !Number.isFinite(e.makerRate) || e.makerRate < 0 || !Number.isFinite(e.takerRate) || e.takerRate < 0) throw new RangeError("Fee rates must be non-negative finite values");
  if (!e.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return h({
    ...e,
    canonicalConfigHash: jo(e)
  });
}
function Hi(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function Ml(e, n) {
  if (e.schemaVersion !== Di)
    throw new Error("Unsupported venue execution rules schema");
  Ko(e.effectiveFrom, e.effectiveUntil, "venue rules");
  for (const t of [
    e.priceTick,
    e.quantityStep,
    e.minimumQuantity,
    e.minimumNotional,
    e.maximumLeverage
  ]) if (!Number.isFinite(t) || t <= 0) throw new RangeError("Venue execution limits must be positive");
  for (const [t, i] of [
    [e.maximumQuantity, "maximumQuantity"],
    [e.maximumNotional, "maximumNotional"]
  ])
    if (t != null && (!Number.isFinite(t) || t <= 0))
      throw new RangeError(`${i} must be null or positive`);
  if (e.feeScheduleRef.id !== n.id || e.feeScheduleRef.version !== n.version || e.feeScheduleRef.hash !== n.canonicalConfigHash) throw new Error("Venue execution rules fee schedule reference mismatch");
  if (!e.stopTriggerSources.length || !e.supportedOrderTypes.length)
    throw new RangeError("Venue execution rules require trigger sources and order types");
  if (!e.provenance.trim()) throw new TypeError("Venue rules provenance is required");
  return h({
    ...e,
    symbol: e.symbol.toUpperCase(),
    canonicalConfigHash: Hi({
      ...e,
      symbol: e.symbol.toUpperCase()
    })
  });
}
function Md(e, n, t) {
  return Ml({
    id: `${e.venue}:${e.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: Di,
    venue: e.venue,
    symbol: e.symbol,
    instrumentType: "linearQuotePerpetual",
    effectiveFrom: t,
    effectiveUntil: null,
    priceTick: e.priceTick,
    quantityStep: e.quantityStep,
    minimumQuantity: e.minQuantity,
    minimumNotional: e.minNotional,
    maximumQuantity: null,
    maximumNotional: null,
    maximumLeverage: e.maxLeverage,
    feeScheduleRef: Fl(n),
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
  }, n);
}
function Bi(e) {
  const n = _(e.timeframe);
  if (!Number.isInteger(e.openTime) || e.openTime < 0 || e.openTime % n !== 0)
    throw new RangeError("Execution candle openTime must align to its timeframe");
  for (const i of [e.o, e.h, e.l, e.c])
    if (!Number.isFinite(i) || i <= 0) throw new RangeError("Execution OHLC must be positive");
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Execution candle high/low do not contain open and close");
  const t = {
    schemaVersion: Li,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    timeframe: e.timeframe,
    openTime: e.openTime,
    closeTime: e.openTime + n,
    knownAt: e.knownAt ?? e.openTime + n,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: e.vBase ?? null,
    sourceObservationId: e.sourceObservationId ?? null
  };
  if (t.knownAt < t.closeTime)
    throw new RangeError("Execution candle knownAt cannot precede closeTime");
  return h({
    ...t,
    id: `execution-candle:${w(t).slice(8)}`
  });
}
function Fd(e, n = e.source) {
  return Bi({
    venue: n,
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
function Wo(e) {
  Oe(e.eventTime, "trade eventTime");
  const n = e.knownAt ?? e.eventTime;
  if (Oe(n, "trade knownAt"), n < e.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(e.price) || e.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(e.quantity) || e.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const t = {
    schemaVersion: Uo,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: n,
    price: e.price,
    quantity: e.quantity,
    side: e.side
  };
  return h({
    ...t,
    id: `execution-trade:${w(t).slice(8)}`
  });
}
function Go(e) {
  Oe(e.eventTime, "quote eventTime");
  const n = e.knownAt ?? e.eventTime;
  if (Oe(n, "quote knownAt"), n < e.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (!Number.isFinite(e.bid) || !Number.isFinite(e.ask) || e.bid <= 0 || e.ask <= 0 || e.bid > e.ask) throw new RangeError("Quote requires positive bid <= ask");
  const t = {
    schemaVersion: qo,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: n,
    bid: e.bid,
    ask: e.ask
  };
  return h({
    ...t,
    id: `execution-quote:${w(t).slice(8)}`
  });
}
function Yo(e) {
  Oe(e.fundingTime, "fundingTime");
  const n = e.knownAt ?? e.fundingTime;
  if (Oe(n, "funding knownAt"), n < e.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(e.rate)) throw new RangeError("Funding rate must be finite");
  if (e.markPrice != null && (!Number.isFinite(e.markPrice) || e.markPrice <= 0))
    throw new RangeError("Funding mark price must be positive");
  const t = {
    schemaVersion: zo,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    fundingTime: e.fundingTime,
    knownAt: n,
    rate: e.rate,
    rateConvention: e.rateConvention ?? "positiveLongsPayShorts",
    markPrice: e.markPrice ?? null,
    markPriceSource: e.markPriceSource ?? null,
    dataProvenance: e.dataProvenance
  };
  return h({
    ...t,
    id: `funding-observation:${w(t).slice(8)}`
  });
}
function Fl(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function Se(e, n) {
  return e.venue.toLowerCase() === n.venue.toLowerCase() && e.symbol.toUpperCase() === n.symbol.toUpperCase();
}
function vn(e, n) {
  return e >= n.from && e <= n.to;
}
function Ll(e, n) {
  return e.openTime - n.openTime || e.knownAt - n.knownAt || e.id.localeCompare(n.id);
}
function Gn(e, n) {
  return e.eventTime - n.eventTime || e.id.localeCompare(n.id);
}
function Ko(e, n, t) {
  if (e != null && Oe(e, `${t} effectiveFrom`), n != null && Oe(n, `${t} effectiveUntil`), e != null && n != null && n <= e)
    throw new RangeError(`${t} effectiveUntil must follow effectiveFrom`);
}
function Nt(e, n) {
  if (!Number.isInteger(e) || e < 0) throw new RangeError(`${n} must be non-negative`);
}
function Dl(e, n) {
  if (!Number.isInteger(e) || e <= 0) throw new RangeError(`${n} must be positive`);
}
function Oe(e, n) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${n} must be a valid timestamp`);
}
async function Ld(e) {
  Hl(e);
  const n = e.replayFrame.effectiveAsOf, i = n + e.executionProfile.orderActivationPolicy.delaySeconds + e.executionProfile.maximumExecutionHorizon, r = Math.max(
    ...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)
  ), o = {
    venue: e.venueRules.venue,
    symbol: e.venueRules.symbol,
    from: n,
    to: i + (e.executionProfile.forceCloseAtHorizon ? r : 0)
  }, a = {};
  for (const E of e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const T = await e.historicalDataAdapter.loadCandles({ ...o, timeframe: E });
    Bl(T, o.venue, o.symbol, E), a[E] = T;
  }
  const s = await Xe(e.historicalDataAdapter.loadTrades, e.historicalDataAdapter, o), c = await Xe(e.historicalDataAdapter.loadQuotes, e.historicalDataAdapter, o), l = await Xe(e.historicalDataAdapter.loadMarkPrices, e.historicalDataAdapter, o), u = await Xe(e.historicalDataAdapter.loadIndexPrices, e.historicalDataAdapter, o), f = e.historicalDataAdapter.fundingDataAvailable ?? e.historicalDataAdapter.loadFundingObservations != null, d = await Xe(
    e.historicalDataAdapter.loadFundingObservations,
    e.historicalDataAdapter,
    o
  ), m = await Xe(
    e.historicalDataAdapter.loadVenueRuleEvidence,
    e.historicalDataAdapter,
    o
  );
  if (Vl(s, c, l, u, d, o.venue, o.symbol), e.historicalDataAdapter.tradeDataCompleteness === "complete" && s.some((E) => E.knownAt !== E.eventTime)) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
  const v = {
    candlesByTimeframe: a,
    trades: s,
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: c,
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: l,
    indexPrices: u,
    funding: d
  }, p = {
    candlesByTimeframe: Object.fromEntries(Object.entries(a).map(([E, T]) => [
      E,
      T.filter((O) => O.knownAt <= n)
    ])),
    trades: s.filter((E) => E.knownAt <= n),
    quotes: c.filter((E) => E.knownAt <= n),
    markPrices: l.filter((E) => E.knownAt <= n),
    indexPrices: u.filter((E) => E.knownAt <= n)
  }, y = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...e.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : [],
    ...e.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : [],
    ...f ? [] : ["FUNDING_DATA_UNAVAILABLE"],
    ...e.venueRules.liquidationModel ? [] : ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"],
    ...s.length && e.historicalDataAdapter.tradeDataCompleteness !== "complete" ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"] : [],
    ...e.executionProfile.stopTriggerPolicy.source !== "last" && e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"] : []
  ], g = {
    schemaVersion: Il,
    venue: o.venue,
    symbol: o.symbol,
    from: o.from,
    to: o.to,
    candlesByTimeframe: h(a),
    trades: h(s),
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: h(c),
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: h(l),
    indexPrices: h(u),
    funding: h(d),
    fundingDataAvailable: f,
    venueRuleEvidence: h(m),
    causalPrefixFingerprint: await tn(p),
    internalBundleFingerprint: await tn(v),
    fundingDataFingerprint: f ? await tn(d.filter((E) => E.knownAt <= n)) : null,
    dataQualityNotes: y
  };
  return h({
    replaySession: e.replaySession,
    replayFrame: e.replayFrame,
    tradePlan: e.tradePlan,
    strategyProfile: e.strategyProfile,
    executionProfile: e.executionProfile,
    venueRules: e.venueRules,
    feeSchedule: e.feeSchedule,
    dataBundle: g
  });
}
function Hl(e) {
  const { replaySession: n, replayFrame: t, tradePlan: i, strategyProfile: r, executionProfile: o, venueRules: a, feeSchedule: s } = e;
  if (t.sessionId !== n.id || t.id !== n.currentFrameId)
    throw new Error("Execution frame does not match the replay session");
  if (n.state !== "TradePlanRecorded" && n.state !== "Revealed") throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (t.decisionSnapshot.id !== i.snapshotId || hi(t.decisionSnapshot) !== t.decisionSnapshot.id || i.id !== Fi(i) || i.schemaVersion !== Lo || i.status !== "finalized" || i.side !== "short" || i.complianceResult.hardErrors.length > 0) throw new Error("Execution requires an intact finalized short TradePlan");
  if (!n.planningAttempts.some(
    (y) => y.accepted && y.frameId === t.id && y.tradePlan.id === i.id
  )) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (On(r) !== r.profileHash || i.strategyProfileId !== r.id || i.strategyProfileVersion !== r.version || i.strategyProfileHash !== r.profileHash || i.lifecycleVersion !== n.lifecycleVersion || i.lifecycleConfigHash !== n.lifecycleConfigHash) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (o.canonicalConfigHash !== Qo(o))
    throw new Error("Execution profile hash mismatch");
  if (a.canonicalConfigHash !== Hi(a))
    throw new Error("Venue execution rules hash mismatch");
  if (s.canonicalConfigHash !== jo(s))
    throw new Error("Venue fee schedule hash mismatch");
  const l = t.effectiveAsOf;
  br(s, l, "fee schedule"), br(a, l, "venue execution rules");
  const u = l + o.orderActivationPolicy.delaySeconds + o.maximumExecutionHorizon + (o.forceCloseAtHorizon ? Math.max(...o.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)) : 0);
  if (s.effectiveUntil != null && s.effectiveUntil <= u || a.effectiveUntil != null && a.effectiveUntil <= u) throw new Error("Selected fee schedule and venue rules must cover the execution horizon");
  if (a.venue.toLowerCase() !== i.venueRules.venue.toLowerCase() || a.symbol !== i.venueRules.symbol.toUpperCase() || a.quantityStep !== i.venueRules.quantityStep || a.priceTick !== i.venueRules.priceTick || a.maximumLeverage !== i.venueRules.maxLeverage || a.feeScheduleRef.hash !== s.canonicalConfigHash) throw new Error("Execution rules do not match the frozen planning-rule subset");
  if (i.entryPlan.orderPlanType === "manualReference")
    throw new Error("manualReference is not an executable entry order type");
  const f = i.entryPlan.orderPlanType === "limit" ? "limit" : i.entryPlan.orderPlanType === "stopMarket" ? "stopMarket" : "market";
  if (!a.supportedOrderTypes.includes(f))
    throw new Error(`Venue rules do not support ${f}`);
  if (!a.stopTriggerSources.includes(o.stopTriggerPolicy.source))
    throw new Error("Configured protective-stop trigger source is unsupported by venue rules");
  const d = i.sizingResult.roundedQuantity;
  if (d == null || d <= 0 || !$l(d, a.quantityStep))
    throw new Error("TradePlan has no executable step-aligned quantity");
  const m = d * i.entryPlan.intendedPrice;
  if (d < a.minimumQuantity || m < a.minimumNotional || a.maximumQuantity != null && d > a.maximumQuantity || a.maximumNotional != null && m > a.maximumNotional || (i.sizingResult.selectedLeverage ?? Number.POSITIVE_INFINITY) > a.maximumLeverage) throw new Error("TradePlan exceeds selected venue execution limits");
  if (!o.pathResolutionPolicy.candleTimeframesFinestFirst.includes(
    r.timeframeRoles.executionTimeframe
  )) throw new Error("Execution profile must include the strategy execution timeframe");
  const v = i.sizingResult.initialMargin;
  if (v == null || v <= 0) throw new Error("TradePlan has no initial margin");
  const p = i.entryPlan.intendedPrice + v / d;
  if (i.stopPlan.stopPrice >= p)
    throw new Error("Planned stop reaches the bankruptcy bound without a verified liquidation model");
}
function br(e, n, t) {
  if (e.effectiveFrom != null && n < e.effectiveFrom || e.effectiveUntil != null && n >= e.effectiveUntil) throw new Error(`${t} is not effective at the decision time`);
}
async function Xe(e, n, t) {
  return e ? e.call(n, t) : [];
}
function Bl(e, n, t, i) {
  const r = /* @__PURE__ */ new Set();
  let o = -1;
  for (const a of e) {
    if (a.schemaVersion !== Li || a.venue.toLowerCase() !== n.toLowerCase() || a.symbol !== t.toUpperCase() || a.timeframe !== i || a.id !== Bi(a).id || a.openTime <= o || r.has(a.id)) throw new Error(`Invalid or duplicate execution candle ${a.id}`);
    o = a.openTime, r.add(a.id);
  }
}
function Vl(e, n, t, i, r, o, a) {
  const s = [...e, ...n, ...t, ...i], c = /* @__PURE__ */ new Set();
  for (const l of s) {
    if (l.venue.toLowerCase() !== o.toLowerCase() || l.symbol.toUpperCase() !== a.toUpperCase() || l.knownAt < l.eventTime || c.has(l.id)) throw new Error(`Invalid or duplicate execution observation ${l.id}`);
    const u = "price" in l ? Wo(l).id : Go(l).id;
    if (l.id !== u) throw new Error(`Execution observation identity mismatch ${l.id}`);
    c.add(l.id);
  }
  for (const l of r) {
    if (l.venue.toLowerCase() !== o.toLowerCase() || l.symbol.toUpperCase() !== a.toUpperCase() || l.id !== Yo(l).id || c.has(l.id)) throw new Error(`Invalid or duplicate funding observation ${l.id}`);
    c.add(l.id);
  }
}
function $l(e, n) {
  const t = Math.round(e / n) * n;
  return Math.abs(e - t) <= Math.max(1e-12, n * 1e-9);
}
const Er = "execution-json-data.1";
function Ul(e) {
  const n = Qe(e, "Execution JSON data");
  if (Ft(n, [
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
  ], "Execution JSON data"), n.schemaVersion !== Er)
    throw new Error("Unsupported execution JSON data schema");
  const t = Mt(n.venue, "venue"), i = Mt(n.symbol, "symbol").toUpperCase(), r = ql(n.candles, t, i), o = zl(n.trades, t, i), a = _t(n.quotes, t, i, "quotes"), s = _t(n.markPrices, t, i, "markPrices"), c = _t(n.indexPrices, t, i, "indexPrices"), l = wr(n.tradeDataCompleteness, "tradeDataCompleteness"), u = wr(n.quoteDataCompleteness, "quoteDataCompleteness");
  if (l === "unavailable" && o.length)
    throw new Error("Unavailable trade data cannot contain observations");
  if (u === "unavailable" && a.length)
    throw new Error("Unavailable quote data cannot contain observations");
  const f = Qe(n.funding, "funding");
  let d;
  if (f.availability === "available")
    Ft(f, ["availability", "observations"], "available funding"), d = {
      availability: "available",
      observations: Ql(f.observations, t, i)
    };
  else if (f.availability === "unavailable")
    Ft(f, ["availability", "reason"], "unavailable funding"), d = {
      availability: "unavailable",
      reason: Mt(f.reason, "funding reason")
    };
  else
    throw new Error("Funding availability must be available or unavailable");
  const m = Fn(n.venueRuleEvidence, "venueRuleEvidence").map((v, p) => jl(v, t, i, p));
  return Wl([
    ...r,
    ...o,
    ...a,
    ...s,
    ...c,
    ...d.availability === "available" ? d.observations : [],
    ...m
  ]), h({
    schemaVersion: Er,
    venue: t,
    symbol: i,
    candles: Gl(r),
    trades: Yn(o),
    tradeDataCompleteness: l,
    quotes: Yn(a),
    quoteDataCompleteness: u,
    markPrices: Yn(s),
    indexPrices: Yn(c),
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
var oe;
class Dd {
  constructor(n) {
    ge(this, "fundingDataAvailable");
    ge(this, "tradeDataCompleteness");
    ge(this, "quoteDataCompleteness");
    Z(this, oe);
    const t = Ul(n);
    this.fundingDataAvailable = t.funding.availability === "available", this.tradeDataCompleteness = t.tradeDataCompleteness, this.quoteDataCompleteness = t.quoteDataCompleteness, te(this, oe, new Nl({
      candles: t.candles,
      trades: t.trades,
      tradeDataCompleteness: t.tradeDataCompleteness,
      quotes: t.quotes,
      quoteDataCompleteness: t.quoteDataCompleteness,
      markPrices: t.markPrices,
      indexPrices: t.indexPrices,
      funding: t.funding.availability === "available" ? t.funding.observations : [],
      fundingDataAvailable: this.fundingDataAvailable,
      venueRuleEvidence: t.venueRuleEvidence
    }));
  }
  getCoverage(n) {
    return R(this, oe).getCoverage(n);
  }
  loadCandles(n) {
    return R(this, oe).loadCandles(n);
  }
  loadTrades(n) {
    return R(this, oe).loadTrades(n);
  }
  loadQuotes(n) {
    return R(this, oe).loadQuotes(n);
  }
  loadMarkPrices(n) {
    return R(this, oe).loadMarkPrices(n);
  }
  loadIndexPrices(n) {
    return R(this, oe).loadIndexPrices(n);
  }
  loadFundingObservations(n) {
    return R(this, oe).loadFundingObservations(n);
  }
  loadVenueRuleEvidence(n) {
    return R(this, oe).loadVenueRuleEvidence(n);
  }
}
oe = new WeakMap();
function ql(e, n, t) {
  const i = /* @__PURE__ */ new Set();
  return Fn(e, "candles").map((r, o) => {
    const a = Qe(r, `candles[${o}]`);
    if (a.schemaVersion !== Li) throw new Error(`Invalid candle schema at ${o}`);
    const s = Bi(a);
    At(a, s, `candle ${o}`), Mn(s, n, t, `candle ${o}`);
    const c = `${s.timeframe}:${s.openTime}`;
    if (i.has(c)) throw new Error(`Duplicate candle interval ${c}`);
    return i.add(c), s;
  });
}
function zl(e, n, t) {
  return Fn(e, "trades").map((i, r) => {
    const o = Qe(i, `trades[${r}]`);
    if (o.schemaVersion !== Uo) throw new Error(`Invalid trade schema at ${r}`);
    const a = Wo(o);
    return At(o, a, `trade ${r}`), Mn(a, n, t, `trade ${r}`), a;
  });
}
function _t(e, n, t, i) {
  return Fn(e, i).map((r, o) => {
    const a = Qe(r, `${i}[${o}]`);
    if (a.schemaVersion !== qo) throw new Error(`Invalid quote schema at ${i}[${o}]`);
    const s = Go(a);
    return At(a, s, `${i}[${o}]`), Mn(s, n, t, `${i}[${o}]`), s;
  });
}
function Ql(e, n, t) {
  return Fn(e, "funding observations").map((i, r) => {
    const o = Qe(i, `funding[${r}]`);
    if (o.schemaVersion !== zo) throw new Error(`Invalid funding schema at ${r}`);
    const a = Yo(o);
    return At(o, a, `funding ${r}`), Mn(a, n, t, `funding ${r}`), a;
  });
}
function jl(e, n, t, i) {
  const r = Qe(e, `venueRuleEvidence[${i}]`);
  if (r.schemaVersion !== Di || r.canonicalConfigHash !== Hi(r)) throw new Error(`Invalid venue-rule evidence at ${i}`);
  return Mn(r, n, t, `venueRuleEvidence[${i}]`), h(r);
}
function At(e, n, t) {
  if (S(e) !== S(n))
    throw new Error(`Non-canonical or unknown fields in ${t}`);
}
function Mn(e, n, t, i) {
  if (e.venue.toLowerCase() !== n.toLowerCase() || e.symbol.toUpperCase() !== t)
    throw new Error(`${i} instrument identity mismatch`);
}
function Wl(e) {
  const n = /* @__PURE__ */ new Set();
  for (const t of e) {
    if (n.has(t.id)) throw new Error(`Duplicate execution observation id ${t.id}`);
    n.add(t.id);
  }
}
function wr(e, n) {
  if (e !== "complete" && e !== "partial" && e !== "unavailable")
    throw new Error(`${n} must be complete, partial, or unavailable`);
  return e;
}
function Gl(e) {
  return [...e].sort(
    (n, t) => n.openTime - t.openTime || n.knownAt - t.knownAt || n.id.localeCompare(t.id)
  );
}
function Yn(e) {
  return [...e].sort(
    (n, t) => n.eventTime - t.eventTime || n.knownAt - t.knownAt || n.id.localeCompare(t.id)
  );
}
function Qe(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new TypeError(`${n} must be an object`);
  return e;
}
function Fn(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
function Mt(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} must be a non-empty string`);
  return e;
}
function Ft(e, n, t) {
  const i = [...n].sort(), r = Object.keys(e).sort();
  if (S(r) !== S(i))
    throw new Error(`${t} has missing or unknown fields`);
}
const Yl = "execution-reveal-envelope.1";
function Hd(e) {
  const { replaySession: n, replayOutcomeEnvelope: t, executionSession: i } = e, { id: r, ...o } = t;
  if (t.schemaVersion !== xi || t.id !== `replay-outcome:${w(o).slice(8)}` || n.state !== "Revealed" || n.revealedOutcomeEnvelopeId == null || n.revealedOutcomeEnvelopeId !== t.id || t.sessionId !== n.id) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (i.replaySessionId !== n.id || i.result == null || !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(i.state)) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (i.result.executionSessionId !== i.id)
    throw new Error("Execution result identity mismatch");
  if (!Number.isFinite(e.revealedAt) || e.revealedAt < 0)
    throw new RangeError("Execution reveal time must be a valid timestamp");
  const a = {
    schemaVersion: Yl,
    replaySessionId: n.id,
    replayOutcomeEnvelopeId: t.id,
    executionSessionId: i.id,
    revealedAt: e.revealedAt,
    caseOutcomeEnvelope: t,
    executionResult: i.result,
    executionEvents: i.executionEvents
  };
  return h({
    ...a,
    id: `execution-reveal:${w(a).slice(8)}`
  });
}
const Ae = /* @__PURE__ */ new Set([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed"
]);
function Vi(e) {
  Ru(e);
  const n = e.tradePlan, t = e.replayFrame, i = t.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, r = {
    schemaVersion: Vo,
    replaySessionId: e.replaySession.id,
    replayFrameId: t.id,
    decisionSnapshotId: t.decisionSnapshot.id,
    tradePlanId: n.id,
    tradePlanSchemaVersion: n.schemaVersion,
    strategyProfileRef: {
      id: e.strategyProfile.id,
      version: e.strategyProfile.version,
      hash: e.strategyProfile.profileHash
    },
    lifecycleVersion: n.lifecycleVersion,
    lifecycleConfigHash: n.lifecycleConfigHash,
    sizingModelVersion: n.sizingResult.sizingModelVersion,
    replayEngineVersion: e.replaySession.replayEngineVersion,
    executionEngineVersion: _n,
    executionProfileRef: Jn(e.executionProfile),
    venueRulesRef: Jn(e.venueRules),
    feeScheduleRef: Jn(e.feeSchedule),
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: e.dataBundle.fundingDataFingerprint,
    decisionTime: t.effectiveAsOf,
    orderActivationTime: i,
    executionHorizonTime: i + e.executionProfile.maximumExecutionHorizon
  }, o = {
    ...r,
    id: `execution-session:${w(r).slice(8)}`
  }, a = {
    ...o,
    revision: 0,
    currentAsOf: o.decisionTime,
    state: "Created",
    stateSince: o.decisionTime,
    orders: [],
    fills: [],
    positionLedger: gu(e),
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [...e.dataBundle.dataQualityNotes],
    errors: []
  };
  return $(a, {
    type: "ExecutionCreated",
    eventTime: o.decisionTime,
    processingAsOf: o.decisionTime,
    explanation: "Execution inputs validated and bound to the finalized TradePlan"
  }), Wi(a);
}
function Kl(e, n, t) {
  if (Gi(e), Su(e, n), xu(t, "targetAsOf"), t < e.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (Ae.has(e.state)) return h(e);
  const i = Zl(n, t);
  if (i.executionEvents.length < e.executionEvents.length)
    throw new Error("Execution target precedes already processed causal events");
  const r = i.executionEvents.slice(0, e.executionEvents.length);
  if (S(r) !== S(e.executionEvents))
    throw new Error("Execution history changed under the same session identity");
  return i;
}
function Xl(e, n) {
  const t = n.executionProfile.forceCloseAtHorizon ? 2 * Math.max(...n.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)) : 0;
  return Kl(e, n, e.executionHorizonTime + t);
}
function Bd(e) {
  return Xl(Vi(e), e);
}
function Zl(e, n) {
  const t = Vi(e), i = Cu(t);
  if (n < i.orderActivationTime) return t;
  Jl(i, e);
  const r = e.executionProfile.forceCloseAtHorizon ? n : Math.min(n, i.executionHorizonTime), o = eu(e, r), a = e.dataBundle.funding.filter((c) => c.knownAt <= r);
  let s = 0;
  for (const c of o) {
    if (Ae.has(i.state)) break;
    for (; s < a.length && a[s].fundingTime < c.eventTime && (Lt(i, e, a[s++], null), !Ae.has(i.state)); )
      ;
    if (Ae.has(i.state) || fu(i, e, c.eventTime, n)) break;
    if (e.executionProfile.forceCloseAtHorizon && c.eventTime >= i.executionHorizonTime && (i.state === "Open" || i.state === "PartiallyClosed")) {
      Xo(i, e, c);
      break;
    }
    iu(i, e, c);
    const l = i.fills.length;
    ru(i, e, c);
    const u = i.fills.length > l;
    for (; s < a.length && a[s].fundingTime >= c.eventTime && a[s].fundingTime < c.intervalEnd && (Lt(i, e, a[s++], u ? c : null), !Ae.has(i.state)); )
      ;
    Ae.has(i.state) || $(i, {
      type: "PathResolved",
      eventTime: c.intervalEnd,
      processingAsOf: c.processingAsOf,
      sourceObservationIds: [c.id],
      explanation: `Execution interval resolved with ${c.resolution} ${c.exact ? "ordered" : "OHLC"} data`
    });
  }
  for (; !Ae.has(i.state) && s < a.length && a[s].fundingTime <= Math.min(n, i.executionHorizonTime); ) Lt(i, e, a[s++], null);
  return Ae.has(i.state) || uu(i, e, o, n), Wi(i);
}
function Jl(e, n) {
  const t = n.tradePlan, i = t.entryPlan.orderPlanType === "marketNextAvailable" ? "entryMarket" : t.entryPlan.orderPlanType === "limit" ? "entryLimit" : "entryStopMarket", r = rt(e.id, {
    kind: i,
    side: "sell",
    quantity: t.sizingResult.roundedQuantity,
    remainingQuantity: t.sizingResult.roundedQuantity,
    limitPrice: i === "entryLimit" ? Cn(t.entryPlan.intendedPrice, n.venueRules.priceTick, "up") : null,
    triggerPrice: i === "entryStopMarket" ? Cn(t.entryPlan.intendedPrice, n.venueRules.priceTick, "down") : null,
    activationTime: e.orderActivationTime,
    status: "active",
    reduceOnly: !1,
    parentTargetId: null,
    liquidityAssumption: i === "entryLimit" ? "assumedMaker" : "taker"
  });
  e.orders.push(r), $(e, {
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
function eu(e, n) {
  const t = e.replayFrame.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, i = t + e.executionProfile.maximumExecutionHorizon, r = e.executionProfile.forceCloseAtHorizon ? i + Math.max(...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)) : i, o = e.dataBundle.trades.filter(
    (u) => u.knownAt <= n && u.eventTime >= t && u.eventTime <= r
  );
  if (o.length && e.dataBundle.tradeDataCompleteness === "complete") return o.map((u) => ({
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
  const a = e.strategyProfile.timeframeRoles.executionTimeframe, s = e.dataBundle.candlesByTimeframe[a] ?? [], c = [];
  for (const u of s) {
    if (u.knownAt > n || u.closeTime <= t || u.openTime > r) continue;
    const f = nu(e, u, n) ?? [u];
    for (const d of f)
      d.closeTime <= t || d.openTime > r || c.push(tu(d));
  }
  return [...new Map(c.map((u) => [u.id, u])).values()].sort(
    (u, f) => u.eventTime - f.eventTime || u.processingAsOf - f.processingAsOf || u.id.localeCompare(f.id)
  );
}
function nu(e, n, t) {
  const i = _(n.timeframe), r = [...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst].filter((o) => _(o) < i).sort((o, a) => _(o) - _(a));
  for (const o of r) {
    const a = _(o), s = i / a;
    if (!Number.isInteger(s)) continue;
    const c = (e.dataBundle.candlesByTimeframe[o] ?? []).filter(
      (f) => f.openTime >= n.openTime && f.closeTime <= n.closeTime && f.knownAt <= Math.min(t, n.knownAt)
    );
    if (c.length !== s) continue;
    let l = n.openTime, u = !0;
    for (const f of c) {
      if (f.openTime !== l) {
        u = !1;
        break;
      }
      l = f.closeTime;
    }
    if (u && l === n.closeTime) return c;
  }
  return null;
}
function tu(e) {
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
function iu(e, n, t) {
  const i = {
    schemaVersion: xl,
    intervalStart: t.eventTime,
    intervalEnd: t.intervalEnd,
    requestedResolution: n.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: t.resolution,
    dataSource: t.exact ? "trades" : "candles",
    dataFingerprint: w([t.id]),
    exactOrApproximate: t.exact ? "exact" : "approximate",
    sourceObservationIds: [t.id],
    ambiguities: []
  }, r = {
    ...i,
    id: `execution-path:${w(i).slice(8)}`
  };
  e.pathResolutionRecords.push(r);
}
function ru(e, n, t) {
  e.state === "PendingEntry" && ou(e, n, t), (e.state === "Open" || e.state === "PartiallyClosed") && (hu(e, t), su(e, n, t));
}
function ou(e, n, t) {
  const i = zi(e);
  if (!i || t.eventTime < i.activationTime) return;
  let r = null, o = i.liquidityAssumption, a = 0;
  if (i.kind === "entryMarket")
    r = t.open, o = "taker", a = n.executionProfile.slippageModel.marketEntryBps;
  else if (i.kind === "entryLimit") {
    const u = i.limitPrice;
    t.open >= u ? (r = t.open, o = "assumedTaker") : bu(t, u, n.executionProfile.restingLimitFillPolicy, n.venueRules.priceTick) && (r = u, o = "assumedMaker");
  } else {
    const u = i.triggerPrice;
    t.open <= u ? r = t.open : t.low <= u && (r = u), r != null && (o = "taker", a = n.executionProfile.slippageModel.marketEntryBps);
  }
  if (r == null) return;
  const s = wu(n, t);
  if (!t.exact && i.kind !== "entryMarket" && s.length) {
    it(e, n, t, [i.id, ...s], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const c = bt(e, n, i, t, r, o, a, "entry"), l = c.price * c.quantity;
  if (c.quantity < n.venueRules.minimumQuantity || l < n.venueRules.minimumNotional || n.venueRules.maximumQuantity != null && c.quantity > n.venueRules.maximumQuantity || n.venueRules.maximumNotional != null && l > n.venueRules.maximumNotional) {
    Sn(e, n, t.eventTime, t.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(c), mu(e, n, c), $(e, {
    type: "EntryOrderFilled",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    stateAfter: "Open",
    orderIds: [i.id],
    fillIds: [c.id],
    quantity: c.quantity,
    referencePrice: r,
    actualPrice: c.price,
    feeAmount: c.feeAmount,
    sourceObservationIds: [t.id],
    explanation: i.kind === "entryMarket" ? "Short entry filled at the next eligible observation with adverse slippage" : "Short entry filled under the configured deterministic entry policy",
    dataQualityNotes: t.exact ? [] : ["CANDLE_ENTRY_FILL_APPROXIMATION"]
  }), au(e, n, c);
}
function au(e, n, t) {
  const i = rt(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: t.quantity,
    remainingQuantity: t.quantity,
    limitPrice: null,
    triggerPrice: Cn(n.tradePlan.stopPlan.stopPrice, n.venueRules.priceTick, "up"),
    activationTime: t.eventTime,
    status: "active",
    reduceOnly: !0,
    parentTargetId: null,
    liquidityAssumption: "taker"
  });
  e.orders.push(i), $(e, {
    type: "ProtectiveStopActivated",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [i.id],
    quantity: i.quantity,
    referencePrice: i.triggerPrice,
    explanation: "Static reduce-only protective buy stop activated after entry"
  });
  const r = Au(t.quantity, n.tradePlan.targetPlans.map((o) => ({
    id: o.id,
    fraction: o.positionFraction
  })), n.venueRules.quantityStep);
  for (const o of [...n.tradePlan.targetPlans].sort((a, s) => s.targetPrice - a.targetPrice || a.id.localeCompare(s.id))) {
    const a = r[o.id] ?? 0;
    if (a <= 0) continue;
    const s = rt(e.id, {
      kind: "target",
      side: "buy",
      quantity: a,
      remainingQuantity: a,
      limitPrice: Cn(o.targetPrice, n.venueRules.priceTick, "down"),
      triggerPrice: null,
      activationTime: t.eventTime,
      status: "active",
      reduceOnly: !0,
      parentTargetId: o.id,
      liquidityAssumption: "assumedMaker"
    });
    e.orders.push(s), e.positionLedger.openTargetQuantities[o.id] = a, $(e, {
      type: "TargetActivated",
      eventTime: t.eventTime,
      processingAsOf: t.processingAsOf,
      orderIds: [s.id],
      quantity: a,
      referencePrice: s.limitPrice,
      explanation: "Static reduce-only target activated after entry"
    });
  }
}
function su(e, n, t) {
  const i = ta(e), r = ji(e), o = i ? Zo(n, t, i.triggerPrice) : null;
  if (o != null && o.unavailable) {
    Sn(
      e,
      n,
      t.eventTime,
      t.processingAsOf,
      `Required ${n.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`
    );
    return;
  }
  const a = (o == null ? void 0 : o.touched) ?? !1, s = r.filter(
    (l) => Eu(t, l.limitPrice, n.executionProfile.targetFillPolicy, n.venueRules.priceTick)
  );
  if (!t.exact && a && s.length) {
    it(
      e,
      n,
      t,
      [i.id, ...s.map((l) => l.id)],
      "STOP_AND_TARGET_INTRABAR_ORDER_UNKNOWN"
    );
    return;
  }
  const c = e.positionLedger.bankruptcyBoundApprox;
  if (c != null && t.high >= c) {
    $(e, {
      type: "BankruptcyBoundCrossed",
      eventTime: t.eventTime,
      processingAsOf: t.processingAsOf,
      quantity: e.positionLedger.remainingQuantity,
      referencePrice: c,
      sourceObservationIds: [t.id],
      explanation: "Simple isolated-margin bankruptcy bound crossed without a verified liquidation model",
      dataQualityNotes: ["BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL"]
    }), it(e, n, t, i ? [i.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (a) {
    lu(e, n, t, i, (o == null ? void 0 : o.referencePrice) ?? i.triggerPrice);
    return;
  }
  for (const l of s.sort((u, f) => f.limitPrice - u.limitPrice || u.id.localeCompare(f.id))) {
    if (e.positionLedger.remainingQuantity <= 0) break;
    cu(e, n, t, l);
  }
}
function cu(e, n, t, i) {
  const r = Math.min(i.remainingQuantity, e.positionLedger.remainingQuantity), o = bt(e, n, i, t, i.limitPrice, "assumedMaker", 0, "target", r);
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(o), Ui(e, o), delete e.positionLedger.openTargetQuantities[i.parentTargetId], $(e, {
    type: "TargetFilled",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [i.id],
    fillIds: [o.id],
    quantity: r,
    referencePrice: i.limitPrice,
    actualPrice: o.price,
    feeAmount: o.feeAmount,
    sourceObservationIds: [t.id],
    explanation: "Reduce-only target filled without market slippage",
    dataQualityNotes: t.exact ? [] : ["RESTING_LIMIT_FILL_ASSUMPTION"]
  });
  const a = ta(e);
  if (e.positionLedger.remainingQuantity > 0 && a) {
    a.quantity = e.positionLedger.remainingQuantity, a.remainingQuantity = e.positionLedger.remainingQuantity, e.positionLedger.remainingProtectiveStopQuantity = e.positionLedger.remainingQuantity, $(e, {
      type: "ProtectiveStopQuantityAdjusted",
      eventTime: t.eventTime,
      processingAsOf: t.processingAsOf,
      orderIds: [a.id],
      quantity: a.quantity,
      sourceObservationIds: [t.id],
      explanation: "Protective stop reduced to the exact remaining position"
    }), $(e, {
      type: "PositionPartiallyClosed",
      eventTime: t.eventTime,
      processingAsOf: t.processingAsOf,
      stateAfter: "PartiallyClosed",
      fillIds: [o.id],
      quantity: e.positionLedger.remainingQuantity,
      sourceObservationIds: [t.id],
      explanation: "A planned target reduced the position"
    });
    return;
  }
  a && qi(e, a, t, "All planned target quantity filled"), $i(e, n, t, "AllTargets", o);
}
function lu(e, n, t, i, r) {
  const o = r;
  $(e, {
    type: "ProtectiveStopTriggered",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [i.id],
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: o,
    sourceObservationIds: [t.id],
    explanation: t.open >= i.triggerPrice ? "Protective stop triggered by an adverse gap" : "Protective stop trigger crossed"
  });
  const a = bt(
    e,
    n,
    i,
    t,
    o,
    "taker",
    n.executionProfile.slippageModel.stopExitBps,
    "stop",
    e.positionLedger.remainingQuantity
  );
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(a), Ui(e, a), e.positionLedger.remainingProtectiveStopQuantity = 0, $(e, {
    type: "ProtectiveStopFilled",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [i.id],
    fillIds: [a.id],
    quantity: a.quantity,
    referencePrice: o,
    actualPrice: a.price,
    feeAmount: a.feeAmount,
    sourceObservationIds: [t.id],
    explanation: "Protective buy stop filled with adverse stop slippage"
  });
  for (const c of ji(e)) qi(e, c, t, "Protective stop closed the position");
  const s = e.fills.some((c) => {
    var l;
    return ((l = qe(e, c.orderId)) == null ? void 0 : l.kind) === "target";
  });
  $i(e, n, t, s ? "StopAfterPartialTargets" : "Stop", a);
}
function $i(e, n, t, i, r) {
  vu(e), e.result = an(e, n, "Closed", i, null), $(e, {
    type: "PositionClosed",
    eventTime: r.eventTime,
    processingAsOf: r.processingAsOf,
    stateAfter: "Closed",
    fillIds: [r.id],
    quantity: 0,
    actualPrice: r.price,
    sourceObservationIds: [t.id],
    explanation: `Position closed: ${i}`
  });
}
function Lt(e, n, t, i) {
  if (e.state !== "Open" && e.state !== "PartiallyClosed" || e.fundingRecords.some((m) => m.observationId === t.id)) return;
  if (i && n.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    it(
      e,
      n,
      i,
      ia(e).map((m) => m.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN"
    );
    return;
  }
  const r = t.markPrice;
  if (r == null) {
    e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE") || e.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), n.executionProfile.fundingPolicy.absence === "requireComplete" && Sn(e, n, t.fundingTime, t.knownAt, "Funding reference price is unavailable");
    return;
  }
  const o = n.venueRules.fundingConvention.sameTimestampOrdering, a = e.fills.filter((m) => m.eventTime === t.fundingTime), s = a.find((m) => m.side === "sell"), c = a.filter((m) => m.side === "buy"), l = o === "fundingBeforePosition" ? Ne(
    e.positionLedger.remainingQuantity + c.reduce((m, v) => m + v.quantity, 0) - ((s == null ? void 0 : s.quantity) ?? 0),
    12
  ) : e.positionLedger.remainingQuantity;
  if (l <= 0) return;
  const u = B(l * r * t.rate), f = {
    observationId: t.id,
    fundingTime: t.fundingTime,
    processingAsOf: Math.max(t.knownAt, (i == null ? void 0 : i.processingAsOf) ?? t.knownAt),
    positionQuantity: l,
    referencePrice: r,
    rate: t.rate,
    amount: u,
    quoteCurrency: n.tradePlan.accountState.quoteCurrency
  }, d = {
    ...f,
    id: `execution-funding:${w(f).slice(8)}`
  };
  e.fundingRecords.push(d), u >= 0 ? e.positionLedger.fundingReceived = B(e.positionLedger.fundingReceived + u) : e.positionLedger.fundingPaid = B(e.positionLedger.fundingPaid + -u), e.positionLedger.netFunding = B(
    e.positionLedger.fundingReceived - e.positionLedger.fundingPaid
  ), Ln(e), $(e, {
    type: "FundingApplied",
    eventTime: t.fundingTime,
    processingAsOf: d.processingAsOf,
    quantity: d.positionQuantity,
    referencePrice: r,
    fundingAmount: u,
    sourceObservationIds: [t.id],
    explanation: u >= 0 ? "Positive funding paid to the open short" : "Negative funding charged to the open short"
  });
}
function uu(e, n, t, i) {
  const r = na(e, n);
  if ((e.state === "Created" || e.state === "PendingEntry") && i >= r) {
    if (!Tr(t, r, n)) {
      Sn(e, n, r, i, "Price data does not cover the entry expiry window");
      return;
    }
    const a = zi(e);
    a && (a.status = "expired", $(e, {
      type: "EntryOrderExpired",
      eventTime: r,
      processingAsOf: r,
      stateAfter: "EntryExpired",
      orderIds: [a.id],
      quantity: a.quantity,
      explanation: "Entry remained unfilled through its deterministic expiry"
    }), e.result = an(e, n, "EntryExpired", null, null), Wt(e));
    return;
  }
  if (i < e.executionHorizonTime || e.state !== "Open" && e.state !== "PartiallyClosed") return;
  const o = [...t].reverse().find((a) => a.eventTime <= e.executionHorizonTime);
  if (!o || !Tr(t, e.executionHorizonTime, n)) {
    Sn(e, n, e.executionHorizonTime, i, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (n.executionProfile.forceCloseAtHorizon) {
    const a = t.find((s) => s.eventTime >= e.executionHorizonTime);
    if (!a) return;
    Xo(e, n, a);
    return;
  }
  yu(e, o.close), $(e, {
    type: "ExecutionHorizonReached",
    eventTime: e.executionHorizonTime,
    processingAsOf: Math.max(e.executionHorizonTime, o.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: o.close,
    sourceObservationIds: [o.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon"
  }), e.result = an(e, n, "OpenAtHorizon", null, null), Wt(e);
}
function Tr(e, n, t) {
  const i = [...e].reverse().find((o) => o.eventTime <= n);
  if (!i) return !1;
  const r = _(t.strategyProfile.timeframeRoles.executionTimeframe);
  return n - i.intervalEnd <= r;
}
function Xo(e, n, t) {
  const i = rt(e.id, {
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
  const r = bt(
    e,
    n,
    i,
    t,
    t.open,
    "taker",
    n.executionProfile.slippageModel.marketExitBps,
    "forcedHorizonClose",
    e.positionLedger.remainingQuantity
  );
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(r), Ui(e, r);
  for (const o of ia(e).filter((a) => a.id !== i.id))
    qi(e, o, t, "Forced horizon close cancelled protection");
  $(e, {
    type: "ForcedHorizonClose",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    fillIds: [r.id],
    orderIds: [i.id],
    quantity: r.quantity,
    referencePrice: t.open,
    actualPrice: r.price,
    feeAmount: r.feeAmount,
    sourceObservationIds: [t.id],
    explanation: "Configured research policy forced a market close at the first eligible observation"
  }), $i(e, n, t, "ForcedHorizonClose", r);
}
function fu(e, n, t, i) {
  if (e.state !== "PendingEntry") return !1;
  const r = na(e, n);
  if (t < r || i < r) return !1;
  const o = zi(e);
  return o.status = "expired", $(e, {
    type: "EntryOrderExpired",
    eventTime: r,
    processingAsOf: r,
    stateAfter: "EntryExpired",
    orderIds: [o.id],
    quantity: o.quantity,
    explanation: "Entry expired before the next eligible observation"
  }), e.result = an(e, n, "EntryExpired", null, null), Wt(e), !0;
}
function it(e, n, t, i, r) {
  const o = du(e, n, t, i), a = o.map((l) => l.estimatedNetPnl).filter((l) => l != null), s = {
    code: r,
    intervalStart: t.eventTime,
    intervalEnd: t.intervalEnd,
    orderIds: i,
    sourceObservationIds: [t.id],
    branches: o,
    lowerNetPnlBound: a.length ? Math.min(...a) : null,
    upperNetPnlBound: a.length ? Math.max(...a) : null,
    explanation: "Available observations do not establish a unique chronological execution path"
  }, c = e.pathResolutionRecords.at(-1);
  c && !c.ambiguities.includes(r) && c.ambiguities.push(r), e.result = an(e, n, "Ambiguous", null, s), $(e, {
    type: "AmbiguityDetected",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    stateAfter: "Ambiguous",
    orderIds: i,
    sourceObservationIds: [t.id],
    explanation: s.explanation,
    dataQualityNotes: [r]
  });
}
function du(e, n, t, i) {
  const r = Qi(e), o = (r == null ? void 0 : r.quantity) ?? n.tradePlan.sizingResult.roundedQuantity, a = r ? e.positionLedger.remainingQuantity : o, s = (r == null ? void 0 : r.price) ?? n.tradePlan.entryPlan.intendedPrice, c = Jo(
    Math.max(t.open, n.tradePlan.stopPlan.stopPrice),
    n.executionProfile.slippageModel.stopExitBps,
    "buy",
    n.venueRules.priceTick
  ).price, l = e.positionLedger.realizedGrossPnl, u = e.positionLedger.totalFees || B(o * s * n.feeSchedule.takerRate), f = B(
    l + a * (s - c) - u - a * c * n.feeSchedule.takerRate + e.positionLedger.netFunding
  ), d = [{
    id: `execution-branch:${w([e.id, t.id, "stop-first"]).slice(8)}`,
    label: "stop-first",
    orderedOrderIds: i.filter((p) => {
      var y;
      return p.includes("stop") || ((y = qe(e, p)) == null ? void 0 : y.kind) === "protectiveStop";
    }),
    estimatedNetPnl: f
  }], m = ji(e).filter((p) => i.includes(p.id)).sort((p, y) => y.limitPrice - p.limitPrice || p.id.localeCompare(y.id)), v = m.length ? m.map((p) => ({ quantity: p.remainingQuantity, price: p.limitPrice, id: p.id })) : [...n.tradePlan.targetPlans].filter((p) => i.includes(p.id)).sort((p, y) => y.targetPrice - p.targetPrice || p.id.localeCompare(y.id)).map((p) => ({
    quantity: ea(o * p.positionFraction, n.venueRules.quantityStep),
    price: p.targetPrice,
    id: p.id
  }));
  if (v.length) {
    let p = a, y = l, g = u;
    const E = [];
    for (const I of v) {
      const b = Math.min(p, I.quantity);
      b <= 0 || (y += b * (s - I.price), g += b * I.price * n.feeSchedule.makerRate, p = Ne(p - b, 12), E.push(I.id));
    }
    i.some((I) => {
      var b;
      return I.includes("stop") || ((b = qe(e, I)) == null ? void 0 : b.kind) === "protectiveStop";
    }) && p > 0 && (y += p * (s - c), g += p * c * n.feeSchedule.takerRate, E.push(...i.filter((I) => {
      var b;
      return I.includes("stop") || ((b = qe(e, I)) == null ? void 0 : b.kind) === "protectiveStop";
    })));
    const O = B(y - g + e.positionLedger.netFunding);
    d.push({
      id: `execution-branch:${w([e.id, t.id, "target-first"]).slice(8)}`,
      label: "target-first",
      orderedOrderIds: E,
      estimatedNetPnl: O
    });
  }
  return d;
}
function Sn(e, n, t, i, r) {
  e.errors.push(r), e.result = an(e, n, "Failed", null, null), $(e, {
    type: "ExecutionFailed",
    eventTime: t,
    processingAsOf: i,
    stateAfter: "Failed",
    explanation: r
  });
}
function bt(e, n, t, i, r, o, a, s, c = t.quantity) {
  const l = a > 0 ? Jo(r, a, t.side, n.venueRules.priceTick) : { price: r, adjustment: 0 }, u = a > 0 ? {
    model: n.executionProfile.slippageModel.model,
    version: n.executionProfile.slippageModel.version,
    bps: a,
    referencePrice: r,
    signedPriceAdjustment: l.adjustment,
    finalFillPrice: l.price
  } : null, f = o === "maker" || o === "assumedMaker" ? n.feeSchedule.makerRate : n.feeSchedule.takerRate, d = {
    schemaVersion: Cl,
    orderId: t.id,
    eventTime: i.eventTime,
    processingAsOf: i.processingAsOf,
    side: t.side,
    quantity: c,
    referencePrice: r,
    price: l.price,
    slippage: u,
    liquidityRole: o,
    feeRate: f,
    feeAmount: B(l.price * c * f),
    feeCurrency: n.tradePlan.accountState.quoteCurrency,
    feeScheduleRef: Jn(n.feeSchedule),
    sourceObservationIds: [i.id],
    dataQualityNotes: [
      ...i.exact ? [] : [`${s.toUpperCase()}_CANDLE_APPROXIMATION`],
      ...o.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []
    ]
  };
  return {
    ...d,
    id: `execution-fill:${w(d).slice(8)}`
  };
}
function mu(e, n, t) {
  const i = e.positionLedger;
  i.originalFilledQuantity = t.quantity, i.remainingQuantity = t.quantity, i.averageEntryPrice = t.price, i.initialNotional = B(t.quantity * t.price), i.initialMargin = B(i.initialNotional / i.selectedLeverage), i.maximumMarginUsed = i.initialMargin, i.marginAllocation = i.initialMargin, i.entryFees = t.feeAmount, i.totalFees = t.feeAmount, i.remainingProtectiveStopQuantity = t.quantity, i.bankruptcyBoundApprox = t.price + i.initialMargin / t.quantity, Ln(e);
}
function Ui(e, n) {
  const t = e.positionLedger, i = t.originalFilledQuantity - t.remainingQuantity, r = i + n.quantity;
  t.averageExitPrice = r > 0 ? B(((t.averageExitPrice ?? 0) * i + n.price * n.quantity) / r) : null, t.realizedGrossPnl = B(
    t.realizedGrossPnl + n.quantity * (t.averageEntryPrice - n.price)
  ), t.remainingQuantity = Ne(
    Math.max(0, t.remainingQuantity - n.quantity),
    12
  ), t.exitFees = B(t.exitFees + n.feeAmount), t.totalFees = B(t.entryFees + t.exitFees), t.remainingProtectiveStopQuantity = t.remainingQuantity, Ln(e);
}
function vu(e) {
  const n = e.positionLedger;
  n.remainingQuantity = 0, n.unrealizedGrossPnl = 0, n.unrealizedNetPnlExcludingUnknownFutureCosts = 0, n.remainingProtectiveStopQuantity = 0, n.openTargetQuantities = {}, Ln(e), n.accountEquityAfter = B(n.accountEquityBefore + n.realizedNetPnl);
}
function yu(e, n) {
  const t = e.positionLedger;
  t.unrealizedGrossPnl = B(t.remainingQuantity * (t.averageEntryPrice - n)), t.unrealizedNetPnlExcludingUnknownFutureCosts = t.unrealizedGrossPnl, Ln(e);
}
function Ln(e) {
  const n = e.positionLedger;
  n.realizedNetPnl = B(n.realizedGrossPnl - n.totalFees + n.netFunding);
}
function hu(e, n) {
  const t = Qi(e);
  if (!t) return;
  const i = qe(e, t.orderId);
  if (!n.exact && t.eventTime === n.eventTime && (i == null ? void 0 : i.kind) !== "entryMarket") return;
  const r = {
    sourceObservationId: n.id,
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    resolution: n.resolution,
    high: n.high,
    low: n.low
  };
  e.excursionObservations.some((a) => a.sourceObservationId === n.id) || e.excursionObservations.push(r);
  const o = e.positionLedger.remainingQuantity * Math.max(
    0,
    n.high - e.positionLedger.averageEntryPrice
  );
  e.positionLedger.maximumAdverseUnrealizedLoss = B(Math.max(
    e.positionLedger.maximumAdverseUnrealizedLoss,
    o
  ));
}
function an(e, n, t, i, r) {
  var E;
  const o = Qi(e), a = e.fills.filter((T) => T.side === "buy").map((T) => {
    const O = qe(e, T.orderId), I = O.kind === "target" ? "target" : i === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: T.id,
      kind: I,
      targetId: O.parentTargetId,
      quantity: T.quantity,
      price: T.price,
      eventTime: T.eventTime,
      grossPnl: o ? B(T.quantity * (o.price - T.price)) : 0,
      fee: T.feeAmount
    };
  }), s = a.find((T) => T.kind === "stop") ?? null, c = pu(e, o), l = !n.dataBundle.fundingDataAvailable || e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), u = B(
    e.positionLedger.realizedNetPnl + e.positionLedger.unrealizedGrossPnl
  ), f = r ? "ambiguous" : l ? "fundingIncomplete" : "complete", d = f === "complete" ? u : null, m = n.tradePlan.sizingResult.projectedLossAtStop, v = n.tradePlan.sizingResult.riskBudget, p = a.filter((T) => T.kind === "target").map((T) => T.eventTime).sort()[0] ?? null, y = a.length ? Math.max(...a.map((T) => T.eventTime)) : null, g = {
    schemaVersion: Pl,
    executionSessionId: e.id,
    replaySessionId: e.replaySessionId,
    replayFrameId: e.replayFrameId,
    decisionSnapshotId: e.decisionSnapshotId,
    tradePlanId: n.tradePlan.id,
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
    pathResolutionRecords: h(e.pathResolutionRecords),
    fundingDataFingerprint: n.dataBundle.fundingDataAvailable ? w(e.fundingRecords.map((T) => T.observationId)) : null,
    status: t,
    closeReason: i,
    entrySummary: o,
    exitSummary: a,
    targetSummary: a.filter((T) => T.kind === "target"),
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
      currency: n.tradePlan.accountState.quoteCurrency
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
    holdingDuration: o ? (y ?? e.executionHorizonTime) - o.eventTime : null,
    timeToFirstTarget: o && p != null ? p - o.eventTime : null,
    timeToStop: o && s ? s.eventTime - o.eventTime : null,
    timeToFullExit: o && y != null && e.positionLedger.remainingQuantity === 0 ? y - o.eventTime : null,
    initialNotional: e.positionLedger.initialNotional,
    averageEntry: e.positionLedger.averageEntryPrice,
    averageExit: e.positionLedger.averageExitPrice,
    maximumMarginUsed: e.positionLedger.maximumMarginUsed,
    entrySlippage: (o == null ? void 0 : o.slippage) ?? null,
    stopSlippage: s ? ((E = e.fills.find((T) => T.id === s.fillId)) == null ? void 0 : E.slippage) ?? null : null,
    actualVsProjectedStopLoss: s && m ? B(-e.positionLedger.realizedNetPnl - m) : null,
    ambiguity: r,
    dataQualityNotes: [...new Set(e.dataQualityNotes)],
    executionModelVersion: _n
  };
  return {
    ...g,
    id: `execution-result:${w(g).slice(8)}`
  };
}
function pu(e, n) {
  if (!n || !e.excursionObservations.length) return {
    maximumAdverseExcursion: null,
    maximumFavorableExcursion: null,
    maePrice: null,
    mfePrice: null,
    maeTime: null,
    mfeTime: null,
    excursionResolution: null
  };
  const t = e.excursionObservations.reduce((r, o) => o.high > r.high ? o : r), i = e.excursionObservations.reduce((r, o) => o.low < r.low ? o : r);
  return {
    maximumAdverseExcursion: Math.max(0, t.high - n.price),
    maximumFavorableExcursion: Math.max(0, n.price - i.low),
    maePrice: t.high,
    mfePrice: i.low,
    maeTime: t.eventTime,
    mfeTime: i.eventTime,
    excursionResolution: Tu(e.excursionObservations.map((r) => r.resolution))
  };
}
function $(e, n) {
  const t = e.state, i = e.executionEvents.at(-1);
  if (i && n.processingAsOf < i.processingAsOf)
    throw new Error("Execution event processing time cannot move backward");
  n.stateAfter && n.stateAfter !== t && (ra(t, n.stateAfter), e.state = n.stateAfter, e.stateSince = n.eventTime), e.currentAsOf = Math.max(e.currentAsOf, n.processingAsOf);
  const r = {
    schemaVersion: $o,
    executionSessionId: e.id,
    sequence: e.executionEvents.length,
    type: n.type,
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    stateBefore: t,
    stateAfter: e.state,
    orderIds: n.orderIds ?? [],
    fillIds: n.fillIds ?? [],
    quantity: n.quantity ?? null,
    referencePrice: n.referencePrice ?? null,
    actualPrice: n.actualPrice ?? null,
    feeAmount: n.feeAmount ?? null,
    fundingAmount: n.fundingAmount ?? null,
    sourceObservationIds: n.sourceObservationIds ?? [],
    explanation: n.explanation,
    dataQualityNotes: n.dataQualityNotes ?? [],
    ordersAfter: h(e.orders),
    fillsAfter: h(e.fills),
    positionLedgerAfter: h(e.positionLedger),
    pathResolutionRecordsAfter: h(e.pathResolutionRecords),
    fundingRecordsAfter: h(e.fundingRecords),
    excursionObservationsAfter: h(e.excursionObservations),
    resultAfter: h(e.result),
    sessionDataQualityNotesAfter: [...e.dataQualityNotes],
    errorsAfter: [...e.errors]
  }, o = {
    ...r,
    id: `execution-event:${w(r).slice(8)}`
  };
  e.executionEvents.push(o), e.revision = e.executionEvents.length;
}
function Wt(e) {
  const n = e.executionEvents.pop();
  if (!n) throw new Error("Execution has no event to finalize");
  const t = {
    ...n,
    id: void 0,
    sequence: e.executionEvents.length,
    ordersAfter: h(e.orders),
    fillsAfter: h(e.fills),
    positionLedgerAfter: h(e.positionLedger),
    pathResolutionRecordsAfter: h(e.pathResolutionRecords),
    fundingRecordsAfter: h(e.fundingRecords),
    excursionObservationsAfter: h(e.excursionObservations),
    resultAfter: h(e.result),
    sessionDataQualityNotesAfter: [...e.dataQualityNotes],
    errorsAfter: [...e.errors]
  }, { id: i, ...r } = t;
  e.executionEvents.push({
    ...r,
    id: `execution-event:${w(r).slice(8)}`
  }), e.revision = e.executionEvents.length;
}
function qi(e, n, t, i) {
  n.status = "cancelled", n.remainingQuantity = 0, n.parentTargetId && delete e.positionLedger.openTargetQuantities[n.parentTargetId], $(e, {
    type: "OrderCancelled",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [n.id],
    sourceObservationIds: [t.id],
    explanation: i
  });
}
function rt(e, n) {
  const t = { schemaVersion: Sl, ...n };
  return {
    ...t,
    id: `execution-order:${w([e, t]).slice(8)}`
  };
}
function gu(e) {
  return {
    schemaVersion: Ol,
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
function Au(e, n, t) {
  const i = {};
  let r = 0;
  if (n.forEach((o, a) => {
    const s = a === n.length - 1 ? Ne(e - r, ot(t)) : ea(e * o.fraction, t);
    i[o.id] = Math.max(0, s), r = Ne(r + s, ot(t));
  }), r > e + t * 1e-9) throw new Error("Target allocation exceeds filled position");
  return i;
}
function bu(e, n, t, i) {
  return t.policy === "ExactDataRequired" ? e.exact && e.high >= n : t.policy === "PenetrationByTicks" ? e.high >= n + t.penetrationTicks * i : e.high >= n;
}
function Eu(e, n, t, i) {
  return t.policy === "ExactDataRequired" ? e.exact && e.low <= n : t.policy === "PenetrationByTicks" ? e.low <= n - t.penetrationTicks * i : e.low <= n;
}
function Zo(e, n, t) {
  const i = e.executionProfile.stopTriggerPolicy.source;
  if (i === "last")
    return {
      touched: n.high >= t,
      referencePrice: n.open >= t ? n.open : t,
      unavailable: !1
    };
  const o = (i === "mark" ? e.dataBundle.markPrices : e.dataBundle.indexPrices).filter(
    (s) => s.eventTime >= n.eventTime && s.eventTime < Math.max(n.intervalEnd, n.eventTime + 1) && s.knownAt <= n.processingAsOf
  ), a = o.find((s) => (s.bid + s.ask) / 2 >= t);
  return a ? {
    touched: !0,
    referencePrice: Math.max(t, (a.bid + a.ask) / 2),
    unavailable: !1
  } : o.length ? { touched: !1, referencePrice: t, unavailable: !1 } : e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? {
    touched: n.high >= t,
    referencePrice: n.open >= t ? n.open : t,
    unavailable: !1
  } : { touched: !1, referencePrice: t, unavailable: !0 };
}
function wu(e, n) {
  const t = [];
  Zo(e, n, e.tradePlan.stopPlan.stopPrice).touched && t.push("planned-stop");
  for (const i of e.tradePlan.targetPlans) n.low <= i.targetPrice && t.push(i.id);
  return t;
}
function Jo(e, n, t, i) {
  const r = t === "sell" ? e * (1 - n / 1e4) : e * (1 + n / 1e4), o = Cn(r, i, t === "sell" ? "down" : "up");
  return { price: o, adjustment: B(o - e) };
}
function Cn(e, n, t) {
  const i = t === "up" ? Math.ceil(e / n - 1e-12) : Math.floor(e / n + 1e-12);
  return Ne(i * n, ot(n));
}
function ea(e, n) {
  return Ne(Math.floor(e / n + 1e-12) * n, ot(n));
}
function B(e) {
  return Ne(e, 12);
}
function Ne(e, n) {
  return Number(e.toFixed(Math.min(15, Math.max(n, 0))));
}
function ot(e) {
  const n = e.toString().toLowerCase();
  return n.includes("e-") ? Number(n.split("e-")[1]) : n.includes(".") ? n.length - n.indexOf(".") - 1 : 0;
}
function na(e, n) {
  return Math.min(
    n.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    e.executionHorizonTime
  );
}
function zi(e) {
  return e.orders.find((n) => n.kind.startsWith("entry") && n.status === "active") ?? null;
}
function Qi(e) {
  return e.fills.find((n) => {
    var t;
    return (t = qe(e, n.orderId)) == null ? void 0 : t.kind.startsWith("entry");
  }) ?? null;
}
function ta(e) {
  return e.orders.find((n) => n.kind === "protectiveStop" && n.status === "active") ?? null;
}
function ji(e) {
  return e.orders.filter((n) => n.kind === "target" && n.status === "active");
}
function ia(e) {
  return e.orders.filter(
    (n) => (n.kind === "protectiveStop" || n.kind === "target") && n.status === "active"
  );
}
function qe(e, n) {
  return e.orders.find((t) => t.id === n) ?? null;
}
function Jn(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function Tu(e) {
  return e.includes("trade") ? "trade" : [...e].sort((n, t) => _(n) - _(t))[0] ?? null;
}
function ra(e, n) {
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
  }[e].includes(n)) throw new Error(`Invalid execution transition ${e} -> ${n}`);
}
function Ru(e) {
  if (e.dataBundle.schemaVersion !== "execution-data-bundle.1" || e.executionProfile.executionEngineVersion !== _n) throw new Error("Execution case identity is invalid");
  if (e.tradePlan.snapshotId !== e.replayFrame.decisionSnapshot.id)
    throw new Error("Execution TradePlan snapshot mismatch");
}
function Su(e, n) {
  const t = Vi(n), i = Gt(e), r = Gt(t);
  if (S(i) !== S(r))
    throw new Error("Execution session does not match the loaded case");
}
function Cu(e) {
  const n = JSON.parse(S(e)), { integrityHash: t, ...i } = n;
  return i;
}
function Wi(e) {
  const n = h(e);
  return h({ ...n, integrityHash: w(n) });
}
function Gt(e) {
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
function Gi(e) {
  if (e.schemaVersion !== Vo)
    throw new Error("Unsupported execution session schema");
  const { integrityHash: n, ...t } = e;
  if (w(t) !== n) throw new Error("Execution session integrity mismatch");
  const i = Pu(e);
  if (S(i) !== S(e))
    throw new Error("Execution event-log reconstruction differs from direct state");
}
function Pu(e) {
  var i;
  const n = Gt(e), t = {
    ...n,
    revision: 0,
    currentAsOf: n.decisionTime,
    state: "Created",
    stateSince: n.decisionTime,
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
    const { id: o, ...a } = r;
    if (r.schemaVersion !== $o || r.executionSessionId !== e.id || r.sequence !== t.executionEvents.length || o !== `execution-event:${w(a).slice(8)}` || r.stateBefore !== t.state) throw new Error(`Invalid execution event ${r.id}`);
    if (r.stateAfter !== r.stateBefore && ra(r.stateBefore, r.stateAfter), r.processingAsOf < t.currentAsOf)
      throw new Error(`Execution event processing time moved backward at ${r.id}`);
    t.state = r.stateAfter, r.stateAfter !== r.stateBefore && (t.stateSince = r.eventTime), t.currentAsOf = Math.max(t.currentAsOf, r.processingAsOf), t.orders = h(r.ordersAfter), t.fills = h(r.fillsAfter), t.positionLedger = h(r.positionLedgerAfter), t.pathResolutionRecords = h(r.pathResolutionRecordsAfter), t.fundingRecords = h(r.fundingRecordsAfter), t.excursionObservations = h(r.excursionObservationsAfter), t.result = h(r.resultAfter), t.dataQualityNotes = [...r.sessionDataQualityNotesAfter], t.errors = [...r.errorsAfter], Iu(t, r), t.executionEvents.push(h(r)), t.revision += 1;
  }
  return Wi(t);
}
function Iu(e, n) {
  const t = /* @__PURE__ */ new Set();
  for (const s of e.orders) {
    if (t.has(s.id) || s.quantity <= 0 || s.remainingQuantity < 0 || s.remainingQuantity > s.quantity) throw new Error(`Invalid execution order snapshot at ${n.id}`);
    t.add(s.id);
  }
  const i = /* @__PURE__ */ new Set();
  let r = 0, o = 0, a = 0;
  for (const s of e.fills) {
    if (i.has(s.id) || !t.has(s.orderId) || s.quantity <= 0 || s.price <= 0 || s.feeAmount < 0) throw new Error(`Invalid execution fill snapshot at ${n.id}`);
    i.add(s.id), s.side === "sell" ? r += s.quantity : o += s.quantity, a += s.feeAmount;
  }
  if (o > r + 1e-9 || Math.abs(e.positionLedger.remainingQuantity - (r - o)) > 1e-8)
    throw new Error(`Execution quantity conservation failed at ${n.id}`);
  if (Math.abs(e.positionLedger.totalFees - B(a)) > 1e-9)
    throw new Error(`Execution fee conservation failed at ${n.id}`);
  if (Ae.has(e.state) && e.result == null)
    throw new Error(`Terminal execution event has no result at ${n.id}`);
  if (e.result) {
    const { id: s, ...c } = e.result;
    if (s !== `execution-result:${w(c).slice(8)}`)
      throw new Error(`Execution result identity mismatch at ${n.id}`);
  }
}
function Vd(e) {
  return Gi(e), S(e);
}
function $d(e) {
  const n = JSON.parse(e);
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new TypeError("Serialized execution session must be an object");
  const t = n;
  return Gi(t), h(t);
}
function xu(e, n) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${n} must be a valid timestamp`);
}
const Dn = ke, je = "replay-analysis-engine.1", oa = "replay-analysis-profile.1", aa = "replay-analysis-state.2", ku = "replay-analysis-observation.1", Ud = "replay-analysis-frame.1", Ou = "replay-analysis-data-bundle.1", sa = "avwap-anchor-spec.1", Yt = "relative-ratio.1", Nu = {
  windowSeconds: 86400,
  historyDays: 180,
  minSamples: 20,
  emaPeriod: 20,
  atrPeriod: 14
}, Rr = {
  lookback: 500,
  pivotStrength: 3,
  atrPeriod: 14,
  minMoveAtr: 0.75,
  maxSwings: 120,
  maxBreaks: 24
};
function ca(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return w(t);
}
function _u(e, n) {
  if (e.schemaVersion !== oa || e.analysisEngineVersion !== je)
    throw new RangeError("Unsupported replay analysis profile version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay analysis profile id and version are required");
  const t = Zt(e.evaluatedTimeframes);
  if (!t.includes(e.executionTimeframe))
    throw new RangeError("The execution timeframe must be evaluated");
  for (const r of [
    ...t,
    ...e.contextTimeframes,
    e.stochasticRsiConfig.timeframe,
    e.relativeStrengthConfig.timeframe
  ]) _(r);
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay analysis requires completedCandlesOnly=true");
  if (e.referenceMarketPolicy.allowForwardFill || !e.referenceMarketPolicy.requireExactCompletedCloseAlignment || e.alignmentPolicy !== "exactCompletedClose")
    throw new RangeError("Analysis engine 1 requires exact reference-bar alignment");
  if (n && (e.executionTimeframe !== n.timeframeRoles.executionTimeframe || e.lifecycleConfigRef.configHash !== n.lifecycleConfigHash))
    throw new RangeError("Analysis profile does not match strategy timeframe/lifecycle roles");
  const i = h({
    ...e,
    evaluatedTimeframes: t,
    contextTimeframes: Zt(e.contextTimeframes),
    referenceMarketPolicy: {
      ...e.referenceMarketPolicy,
      symbol: e.referenceMarketPolicy.symbol.toUpperCase()
    }
  });
  return h({
    ...i,
    canonicalConfigHash: ca(i)
  });
}
function qd(e, n = {}) {
  const t = Zt([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]), i = e.lifecycleConfigHash;
  return _u(
    {
      id: "impulse_fade_v1.replay-analysis.experimental",
      version: "1",
      schemaVersion: oa,
      analysisEngineVersion: je,
      symbolSourcePolicy: { marketType: "perp", requireConfiguredSource: !0 },
      referenceMarketPolicy: {
        symbol: "BTCUSDT",
        source: null,
        requireExactCompletedCloseAlignment: !0,
        allowForwardFill: !1
      },
      evaluatedTimeframes: t,
      executionTimeframe: e.timeframeRoles.executionTimeframe,
      contextTimeframes: e.timeframeRoles.contextTimeframes,
      extensionConfig: Nu,
      stochasticRsiConfig: {
        timeframe: e.timeframeRoles.executionTimeframe,
        rsiPeriod: 14,
        stochPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      },
      structureConfig: Rr,
      supportResistanceConfig: {
        maxZones: 6,
        thicknessBps: 10,
        latestX: 0,
        referencePrice: null,
        zonesPerSide: 3
      },
      relativeStrengthConfig: {
        ...Rr,
        timeframe: e.timeframeRoles.executionTimeframe,
        formulaVersion: Yt,
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
      ...n
    },
    e
  );
}
function la(e) {
  var fn, pe, Bn, Vn;
  Mu(e);
  const n = ua(e), t = e.analysisProfile, i = e.symbol.toUpperCase(), r = t.referenceMarketPolicy.symbol, o = t.referenceMarketPolicy.source ?? e.source, a = {}, s = {};
  for (const P of t.evaluatedTimeframes)
    a[P] = Pe(
      e.candlesByTimeframe[P] ?? [],
      P,
      n
    ), s[P] = Pe(
      e.referenceCandlesByTimeframe[P] ?? [],
      P,
      n
    );
  const c = w({
    schemaVersion: Ou,
    symbol: i,
    source: e.source,
    referenceSymbol: r,
    referenceSource: o,
    effectiveAsOf: n,
    targetObservationIds: Cr(a),
    referenceObservationIds: Cr(s),
    anchorObservationIds: (e.avwapAnchors ?? []).filter((P) => P.knownAt <= n).map((P) => P.anchorCandleObservationId).sort()
  }), l = w({
    analysisEngineVersion: t.analysisEngineVersion,
    profileHash: t.canonicalConfigHash
  }), u = {}, f = {}, d = {}, m = [], v = [], p = [], y = {}, g = [], E = [];
  for (const P of t.evaluatedTimeframes) {
    const z = a[P], Ge = ze(z.candles, t.extensionConfig);
    u[P] = Ge;
    const Ye = P === t.stochasticRsiConfig.timeframe ? Xa(
      z.candles,
      t.stochasticRsiConfig.rsiPeriod,
      t.stochasticRsiConfig.stochPeriod,
      t.stochasticRsiConfig.kPeriod,
      t.stochasticRsiConfig.dPeriod
    ) : null;
    f[P] = {
      ema: Je(Ka(z.candles, t.extensionConfig.emaPeriod)),
      atr: Je(Za(z.candles, t.extensionConfig.atrPeriod)),
      stochRsi: Ye ? { k: Je(Ye.k), d: Je(Ye.d) } : null,
      configurationHash: w({
        extension: t.extensionConfig,
        stochasticRsi: P === t.stochasticRsiConfig.timeframe ? t.stochasticRsiConfig : null
      })
    };
    const ce = Ve(z.candles, t.structureConfig), Tt = w(t.structureConfig), Fa = en({
      logicalId: `market-structure:${e.source}:${i}:${P}`,
      component: `structure:${P}`,
      timeframe: P,
      eventTime: ce.summary.updatedTs ?? n,
      knownAt: Math.max(
        ((fn = ce.summary.lastBreak) == null ? void 0 : fn.knownAt) ?? 0,
        ((pe = ce.summary.lastSwingHigh) == null ? void 0 : pe.knownAt) ?? 0,
        ((Bn = ce.summary.lastSwingLow) == null ? void 0 : Bn.knownAt) ?? 0
      ) || n,
      evaluatedAt: n,
      configurationHash: Tt,
      sourceObservationIds: z.replay.map((U) => U.observationId),
      value: ce
    });
    d[P] = { timeframe: P, observation: Fa };
    for (const U of ce.breaks)
      m.push(en({
        logicalId: qu(e.source, i, P, U),
        component: "structureEvent",
        timeframe: P,
        eventTime: U.eventTime,
        knownAt: U.knownAt,
        evaluatedAt: Kt(U.knownAt, t.executionTimeframe),
        configurationHash: Tt,
        sourceObservationIds: Xt(z, U.knownAt),
        value: U
      }));
    for (const U of ys(ce))
      v.push(Uu(e, P, U));
    const Ke = z.candles.at(-1), La = {
      ...t.supportResistanceConfig,
      latestX: (Ke == null ? void 0 : Ke.x) ?? 0,
      referencePrice: (Ke == null ? void 0 : Ke.c) ?? null
    }, nr = io(ce.swings, La);
    E.push(...nr);
    const tr = w(t.supportResistanceConfig);
    for (const U of nr) {
      const ir = zu(ce.swings, U, e, P);
      p.push(en({
        logicalId: `sr-zone:${e.source}:${i}:${P}:${U.kind}:${ir[0] ?? U.eventTime}`,
        component: "supportResistanceZone",
        timeframe: P,
        eventTime: U.eventTime,
        knownAt: U.knownAt,
        evaluatedAt: n,
        configurationHash: tr,
        sourceObservationIds: Xt(z, U.knownAt),
        value: { ...U, originatingSwingIds: ir }
      }));
    }
    const Rt = `timeframe:${P}`;
    if (y[Rt] = De(
      Rt,
      n,
      z,
      l,
      ju(t, P)
    ), y[`extension:${P}`] = De(
      `extension:${P}`,
      n,
      z,
      w(t.extensionConfig),
      Math.max(
        t.extensionConfig.emaPeriod,
        t.extensionConfig.atrPeriod + 1,
        Math.ceil(t.extensionConfig.windowSeconds / _(P)) + 1
      )
    ), y[`structure:${P}`] = De(
      `structure:${P}`,
      n,
      z,
      Tt,
      t.structureConfig.pivotStrength * 2 + 1
    ), y[`supportResistance:${P}`] = De(
      `supportResistance:${P}`,
      n,
      z,
      tr,
      t.structureConfig.pivotStrength * 2 + 1
    ), P === t.stochasticRsiConfig.timeframe) {
      const U = t.stochasticRsiConfig.rsiPeriod + t.stochasticRsiConfig.stochPeriod + t.stochasticRsiConfig.kPeriod + t.stochasticRsiConfig.dPeriod - 3;
      y[`stochRsi:${P}`] = De(
        `stochRsi:${P}`,
        n,
        z,
        w(t.stochasticRsiConfig),
        U
      );
    }
    z.candles.length || g.push(et("ANALYSIS_COMPONENT_UNAVAILABLE", Rt, "No completed candles"));
  }
  const T = e.strategyProfile.timeframeRoles.candidateTimeframe, O = a[T] ?? Pe(
    e.candlesByTimeframe[T] ?? [],
    T,
    n
  ), I = Lu(
    e,
    T,
    O,
    n
  );
  for (const P of I.insufficientDataReasons)
    g.push(et(P.code, `extension:${T}`, P.message));
  y.candidateMetrics = {
    ...De(
      "candidateMetrics",
      n,
      O,
      w(t.extensionConfig),
      t.extensionConfig.minSamples
    ),
    status: I.insufficientDataReasons.length ? "insufficientHistory" : "available"
  };
  const b = t.relativeStrengthConfig.timeframe, A = a[b] ?? Pe(
    e.candlesByTimeframe[b] ?? [],
    b,
    n
  ), C = s[b] ?? Pe(
    e.referenceCandlesByTimeframe[b] ?? [],
    b,
    n
  ), k = Hu(
    e,
    b,
    A,
    C,
    o
  ), j = k.status === "available" ? hs(
    A.candles,
    C.candles,
    t.relativeStrengthConfig
  ).map((P) => {
    var Ye;
    const z = ((Ye = C.replay.find(
      (ce) => ce.openTime === P.bucket
    )) == null ? void 0 : Ye.knownAt) ?? P.knownAt, Ge = Math.max(P.knownAt, z);
    return en({
      logicalId: `rs-event:${e.source}:${i}:${b}:${P.kind}:${P.bucket}`,
      component: "relativeStrengthEvent",
      timeframe: b,
      eventTime: P.eventTime,
      knownAt: Ge,
      evaluatedAt: Kt(
        Ge,
        e.analysisProfile.executionTimeframe
      ),
      configurationHash: w(t.relativeStrengthConfig),
      sourceObservationIds: Wu(A, C, Ge),
      value: { ...P, knownAt: Ge }
    });
  }) : [];
  y.relativeStrength = Qu(
    n,
    A,
    C,
    k.status,
    w(t.relativeStrengthConfig)
  ), k.status !== "available" && g.push(et(
    k.status === "missingSynchronizedReferenceData" ? "MISSING_SYNCHRONIZED_REFERENCE_DATA" : "ANALYSIS_COMPONENT_UNAVAILABLE",
    "relativeStrength",
    "RS-vs-BTC requires exact completed target/reference bar alignment"
  ));
  const q = Bu(e, a, n);
  g.push(...q.notes), y.avwap = q.freshness;
  const M = Du(
    e,
    T,
    n
  ), L = ((Vn = d[t.executionTimeframe]) == null ? void 0 : Vn.observation.value) ?? null, F = Kr({
    symbol: i,
    source: e.source,
    venue: e.source,
    executionTimeframe: t.executionTimeframe,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(a).map(([P, z]) => [
        P,
        z.candles
      ])
    ),
    candidateMetrics: M,
    structureEvents: m.map((P) => ({
      ...P.value,
      sourceTimeframe: P.timeframe
    })),
    supportResistanceZones: E,
    avwapEvents: q.events.map((P) => P.value),
    relativeStrengthEvents: j.map((P) => P.value),
    config: e.lifecycleConfig,
    to: n
  }) ?? $u(e, n, L), Fe = {
    schemaVersion: aa,
    replayEngineVersion: Dn,
    analysisEngineVersion: je,
    symbol: i,
    source: e.source,
    requestedAsOf: e.asOf,
    effectiveAsOf: n,
    analysisProfileRef: {
      id: t.id,
      version: t.version,
      hash: t.canonicalConfigHash
    },
    lifecycleConfigRef: t.lifecycleConfigRef,
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
    referenceMarket: { symbol: r, source: o },
    dataBundleFingerprint: c,
    candidateMetrics: I,
    extensionContext: u,
    indicatorSeries: f,
    structureByTimeframe: d,
    structureEvents: m,
    activeStructureLevels: v,
    supportResistanceZones: p,
    relativeStrength: k,
    relativeStrengthEvents: j,
    avwapStates: q.states,
    avwapEvents: q.events,
    lifecycleResult: F,
    setupState: F,
    coverageByComponent: y,
    freshnessByComponent: y,
    dataQualityNotes: Gu(g)
  };
  return h({
    ...Fe,
    id: `replay-analysis-state:${w(Fe).slice(8)}`
  });
}
function Mu(e) {
  if (!Number.isFinite(e.asOf) || e.asOf < 0)
    throw new RangeError("Analysis asOf must be a non-negative finite timestamp");
  if (ca(e.analysisProfile) !== e.analysisProfile.canonicalConfigHash)
    throw new Error("Replay analysis profile failed deterministic hash verification");
  if (e.strategyProfile.lifecycleConfigHash !== e.analysisProfile.lifecycleConfigRef.configHash)
    throw new Error("Analysis lifecycle configuration does not match the strategy profile");
  if (e.radarEpisode.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.radarEpisode.source !== e.source)
    throw new Error("Radar episode does not match the materialized instrument");
  const n = e.analysisProfile.referenceMarketPolicy.symbol, t = e.analysisProfile.referenceMarketPolicy.source ?? e.source;
  Sr(
    e.candlesByTimeframe,
    e.symbol,
    e.source,
    e.asOf,
    "target"
  ), Sr(
    e.referenceCandlesByTimeframe,
    n,
    t,
    e.asOf,
    "reference"
  );
}
function Sr(e, n, t, i, r) {
  for (const [o, a] of Object.entries(e)) {
    _(o);
    for (const s of a)
      if (!(s.knownAt > i) && (s.symbol.toUpperCase() !== n.toUpperCase() || s.source !== t || s.timeframe !== o))
        throw new Error(`Materialized ${r} candle identity mismatch for ${o}`);
  }
}
function ua(e) {
  const n = e.analysisProfile.executionTimeframe, t = e.candlesByTimeframe[n] ?? [], i = [...new Set(t.map((r) => r.closeTime).filter((r) => r <= e.asOf))].sort((r, o) => o - r);
  for (const r of i)
    if (un(t, r).some((o) => o.closeTime === r))
      return r;
  throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
}
function Pe(e, n, t) {
  var s;
  const i = un(e, t), r = e.length ? Math.min(...e.map((c) => c.openTime)) : ((s = i[0]) == null ? void 0 : s.openTime) ?? 0, o = _(n), a = i.map((c) => Fu(c, r, o));
  return ct(a, n, t), { replay: i, candles: a };
}
function un(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > n || i.knownAt > n) continue;
    if (Nn(i) !== i.observationId)
      throw new Error(`Candle observation ${i.observationId} failed identity verification`);
    const r = t.get(i.logicalCandleId);
    if (!r || r.knownAt < i.knownAt)
      t.set(i.logicalCandleId, i);
    else if (r.knownAt === i.knownAt && S(r) !== S(i))
      throw new Error(`Conflicting candle revisions for ${i.logicalCandleId}`);
  }
  return h([...t.values()].sort(
    (i, r) => i.openTime - r.openTime || i.knownAt - r.knownAt
  ));
}
function Fu(e, n, t) {
  return {
    ts: e.openTime,
    bucket: e.openTime,
    x: (e.openTime - n) / t,
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
function Je(e) {
  const n = [];
  for (let t = 0; t < e.length; t += 2)
    n.push({ x: e[t], value: e[t + 1] });
  return n;
}
function Kt(e, n) {
  const t = _(n);
  return Math.ceil(e / t) * t;
}
function en(e) {
  const n = {
    schemaVersion: ku,
    ...e,
    sourceObservationIds: [...new Set(e.sourceObservationIds)].sort()
  };
  return h({
    ...n,
    observationId: `replay-analysis-observation:${w(n).slice(8)}`
  });
}
function Lu(e, n, t, i) {
  var m, v, p, y, g, E;
  const r = e.analysisProfile, o = ze(t.candles, r.extensionConfig), a = Math.max(0, i - r.extensionConfig.historyDays * 86400), s = ((m = t.replay[0]) == null ? void 0 : m.openTime) ?? null, c = ((v = t.replay.at(-1)) == null ? void 0 : v.closeTime) ?? null, l = i - a, u = s == null || c == null ? null : Math.max(0, c - Math.max(s, a)), f = [];
  (!o.candle || !o.referenceCandle) && f.push({
    code: "INSUFFICIENT_ANALYSIS_HISTORY",
    scope: `extension:${n}`,
    message: `Elapsed ${r.extensionConfig.windowSeconds}s return is unavailable`,
    required: r.extensionConfig.windowSeconds,
    available: u,
    unit: "seconds"
  }), o.rollingReturnCount < r.extensionConfig.minSamples && f.push({
    code: "INSUFFICIENT_ANALYSIS_HISTORY",
    scope: `extension-distribution:${n}`,
    message: `Rolling-return history has ${o.rollingReturnCount}/${r.extensionConfig.minSamples} samples`,
    required: r.extensionConfig.minSamples,
    available: o.rollingReturnCount,
    unit: "samples"
  });
  const d = Object.fromEntries(
    r.evaluatedTimeframes.map((T) => {
      var b, A;
      const O = Pe(
        e.candlesByTimeframe[T] ?? [],
        T,
        i
      ), I = ze(O.candles, r.extensionConfig);
      return [T, {
        timeframe: T,
        emaPeriod: r.extensionConfig.emaPeriod,
        atrPeriod: r.extensionConfig.atrPeriod,
        latestTs: ((b = I.candle) == null ? void 0 : b.bucket) ?? null,
        latestClose: ((A = I.candle) == null ? void 0 : A.c) ?? null,
        ema: I.ema,
        atr: I.atr,
        atrExtension: I.atrExtension
      }];
    })
  );
  return h({
    symbol: e.symbol.toUpperCase(),
    exchange: e.source,
    marketType: r.symbolSourcePolicy.marketType,
    source: "external",
    baseTimeframe: n,
    requestedAsOf: e.asOf,
    effectiveAsOf: i,
    sampleCount: t.candles.length,
    historyCoverage: {
      requestedStartTs: a,
      requestedEndTs: i,
      availableStartTs: s,
      availableEndTs: c,
      coveredSeconds: u,
      requestedSeconds: l,
      coverageRatio: u == null || l === 0 ? null : Math.min(1, u / l)
    },
    insufficientDataReasons: f,
    extension: {
      windowSeconds: o.windowSeconds,
      historyDays: r.extensionConfig.historyDays,
      sampleCount: o.rollingReturnCount,
      latestTs: ((p = o.candle) == null ? void 0 : p.bucket) ?? null,
      referenceTs: ((y = o.referenceCandle) == null ? void 0 : y.bucket) ?? null,
      latestClose: ((g = o.candle) == null ? void 0 : g.c) ?? null,
      referenceClose: ((E = o.referenceCandle) == null ? void 0 : E.c) ?? null,
      returnPct: o.returnPct,
      percentile: o.percentile,
      zScore: o.zScore
    },
    timeframeExtensions: d,
    updatedAt: i
  });
}
function Du(e, n, t) {
  return un(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    t
  ).map((r) => {
    const o = Pe(
      e.candlesByTimeframe[n] ?? [],
      n,
      r.closeTime
    ), a = ze(o.candles, e.analysisProfile.extensionConfig);
    return {
      asOf: r.closeTime,
      eventTime: r.closeTime,
      knownAt: r.closeTime,
      metrics: {
        returnPct: a.returnPct,
        percentile: a.percentile,
        zScore: a.zScore,
        atrExtension: a.atrExtension
      },
      sampleCount: a.rollingReturnCount
    };
  });
}
function Hu(e, n, t, i, r, o) {
  const a = new Set(t.replay.map((y) => y.openTime)), s = new Map(i.replay.map((y) => [y.openTime, y])), c = [...a].some((y) => !s.has(y)), l = !t.replay.length || !i.replay.length ? "unavailable" : c ? "missingSynchronizedReferenceData" : "available";
  if (l !== "available")
    return {
      targetSymbol: e.symbol.toUpperCase(),
      targetSource: e.source,
      referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
      referenceSource: r,
      formulaVersion: Yt,
      normalizationAnchor: null,
      series: [],
      structure: null,
      status: l
    };
  const u = ro(t.candles, i.candles), f = Je(u), d = new Map(t.candles.map((y) => [y.x, y])), m = f.map((y) => ({ ...d.get(y.x), o: y.value, h: y.value, l: y.value, c: y.value })), v = t.replay[0], p = s.get(v.openTime);
  return {
    targetSymbol: e.symbol.toUpperCase(),
    targetSource: e.source,
    referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
    referenceSource: r,
    formulaVersion: Yt,
    normalizationAnchor: {
      targetObservationId: v.observationId,
      referenceObservationId: p.observationId,
      closeTime: v.closeTime
    },
    series: f,
    structure: Ve(m, e.analysisProfile.structureConfig),
    status: l
  };
}
function Bu(e, n, t) {
  var c;
  const i = [], r = [], o = [];
  let a = {
    component: "avwap",
    evaluatedAt: t,
    latestInputCloseTime: null,
    latestInputKnownAt: null,
    status: "unavailable",
    sampleCount: 0,
    requiredCoverage: null,
    availableCoverage: null,
    sourceObservationIds: [],
    configurationHash: w(e.analysisProfile.avwapConfig)
  };
  const s = e.avwapAnchors ?? [];
  if (!s.length)
    return o.push(et("ANALYSIS_COMPONENT_UNAVAILABLE", "avwap", "No explicit AVWAP anchor was supplied")), { states: i, events: r, notes: o, freshness: a };
  for (const l of s) {
    Vu(l, e, n, t);
    const u = n[l.timeframe], f = { anchorBucket: l.anchorTime }, d = ds(u.candles, f), m = u.replay.filter((p) => p.openTime >= l.anchorTime).map((p) => p.observationId), v = en({
      logicalId: `avwap:${l.id}`,
      component: "avwap",
      timeframe: l.timeframe,
      eventTime: l.anchorTime,
      knownAt: Math.max(
        l.knownAt,
        l.selectedAt,
        ((c = u.replay.at(-1)) == null ? void 0 : c.knownAt) ?? l.knownAt
      ),
      evaluatedAt: t,
      configurationHash: w({ anchor: l, config: e.analysisProfile.avwapConfig }),
      sourceObservationIds: [l.anchorCandleObservationId, ...m],
      value: d
    });
    i.push({
      anchor: l,
      series: Je(li(u.candles, f)),
      snapshot: d,
      observation: v
    });
    for (const p of ms(
      u.candles,
      f,
      e.analysisProfile.avwapConfig.maxSignals
    )) {
      const y = Math.max(p.knownAt, l.selectedAt);
      r.push(en({
        logicalId: `avwap-event:${l.id}:${p.kind}:${p.bucket}`,
        component: "avwapEvent",
        timeframe: l.timeframe,
        eventTime: p.eventTime,
        knownAt: y,
        evaluatedAt: Kt(
          y,
          e.analysisProfile.executionTimeframe
        ),
        configurationHash: v.configurationHash,
        sourceObservationIds: [l.anchorCandleObservationId, ...Xt(u, p.knownAt)],
        value: { ...p, knownAt: y }
      }));
    }
    a = De(
      "avwap",
      t,
      u,
      v.configurationHash,
      1
    );
  }
  return { states: i, events: r, notes: o, freshness: a };
}
function Vu(e, n, t, i) {
  if (e.schemaVersion !== sa || e.symbol.toUpperCase() !== n.symbol.toUpperCase() || e.source !== n.source || e.knownAt > i || e.selectedAt > i) throw new RangeError(`AVWAP anchor ${e.id} was not known at the cutoff`);
  const r = t[e.timeframe];
  if (!r) throw new RangeError(`AVWAP anchor timeframe ${e.timeframe} is not evaluated`);
  const o = r.replay.find(
    (a) => a.logicalCandleId === e.anchorCandleLogicalId
  );
  if (!o || o.observationId !== e.anchorCandleObservationId || o.openTime !== e.anchorTime || o.knownAt > e.selectedAt) throw new RangeError(`AVWAP anchor ${e.id} does not reference the visible frozen revision`);
}
function zd(e) {
  if (!e.id.trim() || !e.provenance.trim())
    throw new TypeError("AVWAP anchor id and provenance are required");
  if (e.knownAt > e.selectedAt)
    throw new RangeError("AVWAP anchor cannot be selected before it is known");
  return _(e.timeframe), h({
    ...e,
    schemaVersion: sa,
    symbol: e.symbol.toUpperCase()
  });
}
function $u(e, n, t) {
  const i = Pe(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    e.analysisProfile.executionTimeframe,
    n
  ), r = Kr({
    symbol: e.symbol,
    source: e.source,
    executionTimeframe: e.analysisProfile.executionTimeframe,
    candlesByTimeframe: {
      [e.analysisProfile.executionTimeframe]: i.candles
    },
    structureEvents: (t == null ? void 0 : t.breaks) ?? [],
    config: e.lifecycleConfig,
    to: n
  });
  if (!r) throw new Error("Unable to materialize lifecycle at the evaluation cutoff");
  return r;
}
function Uu(e, n, t) {
  const i = fa(e.source, e.symbol, n, t.sourceSwing), r = `structure-level:${e.source}:${e.symbol.toUpperCase()}:${n}:${t.role}:${i}`;
  return yi({
    id: r,
    kind: "structureLevel",
    price: t.price,
    sourceTimeframe: n,
    eventTime: t.eventTime,
    knownAt: t.knownAt,
    sourceObject: {
      objectType: "StructureActiveLevel",
      objectId: r,
      snapshot: h(t)
    }
  });
}
function qu(e, n, t, i) {
  return `structure-event:${e}:${n}:${t}:${i.kind}:${i.direction}:${i.bucket}:${i.sourceSwingX}`;
}
function fa(e, n, t, i) {
  return `swing:${e}:${n.toUpperCase()}:${t}:${i.kind}:${i.bucket}`;
}
function zu(e, n, t, i) {
  return e.filter((r) => r.price >= n.low && r.price <= n.high && (n.kind === "resistance" ? r.kind === "SwingHigh" : r.kind === "SwingLow")).sort((r, o) => r.bucket - o.bucket || r.knownAt - o.knownAt).map((r) => fa(t.source, t.symbol, i, r));
}
function De(e, n, t, i, r) {
  const o = t.replay.at(-1);
  return {
    component: e,
    evaluatedAt: n,
    latestInputCloseTime: (o == null ? void 0 : o.closeTime) ?? null,
    latestInputKnownAt: (o == null ? void 0 : o.knownAt) ?? null,
    status: t.replay.length >= r ? "available" : "insufficientHistory",
    sampleCount: t.replay.length,
    requiredCoverage: r,
    availableCoverage: t.replay.length,
    sourceObservationIds: t.replay.map((a) => a.observationId),
    configurationHash: i
  };
}
function Qu(e, n, t, i, r) {
  const o = n.replay.at(-1), a = t.replay.at(-1);
  return {
    component: "relativeStrength",
    evaluatedAt: e,
    latestInputCloseTime: Math.max(
      (o == null ? void 0 : o.closeTime) ?? 0,
      (a == null ? void 0 : a.closeTime) ?? 0
    ) || null,
    latestInputKnownAt: Math.max(
      (o == null ? void 0 : o.knownAt) ?? 0,
      (a == null ? void 0 : a.knownAt) ?? 0
    ) || null,
    status: i,
    sampleCount: Math.min(n.replay.length, t.replay.length),
    requiredCoverage: n.replay.length,
    availableCoverage: t.replay.length,
    sourceObservationIds: [
      ...n.replay.map((s) => s.observationId),
      ...t.replay.map((s) => s.observationId)
    ].sort(),
    configurationHash: r
  };
}
function ju(e, n) {
  return Math.max(
    e.extensionConfig.emaPeriod,
    e.extensionConfig.atrPeriod + 1,
    n === e.stochasticRsiConfig.timeframe ? e.stochasticRsiConfig.rsiPeriod + e.stochasticRsiConfig.stochPeriod + e.stochasticRsiConfig.kPeriod + e.stochasticRsiConfig.dPeriod : 0,
    e.structureConfig.pivotStrength * 2 + 1
  );
}
function Xt(e, n) {
  return e.replay.filter((t) => t.knownAt <= n).map((t) => t.observationId);
}
function Wu(e, n, t) {
  const i = new Map(n.replay.map((r) => [r.openTime, r]));
  return e.replay.flatMap((r) => {
    if (r.knownAt > t) return [];
    const o = i.get(r.openTime);
    return o && o.knownAt <= t ? [r.observationId, o.observationId] : [];
  });
}
function Cr(e) {
  return Object.fromEntries(Object.entries(e).map(([n, t]) => [
    n,
    t.replay.map((i) => i.observationId)
  ]));
}
function et(e, n, t) {
  return { code: e, severity: "warning", message: `${n}: ${t}` };
}
function Gu(e) {
  return [...new Map(e.map((n) => [S(n), n])).values()];
}
function Zt(e) {
  const n = [];
  for (const t of e)
    _(t), n.includes(t) || n.push(t);
  return n;
}
function Yu(e) {
  const n = e.avwapStates[0];
  return !n || n.snapshot.value == null ? null : {
    reference: yi({
      id: `avwap-reference:${n.anchor.id}`,
      kind: "avwap",
      price: n.snapshot.value,
      sourceTimeframe: n.anchor.timeframe,
      eventTime: n.anchor.anchorTime,
      knownAt: n.observation.knownAt,
      sourceObject: {
        objectType: "AnchoredVwap",
        objectId: n.observation.logicalId,
        snapshot: h({
          ...n.snapshot,
          analysisObservationId: n.observation.observationId
        })
      }
    }),
    distancePct: n.snapshot.distancePct,
    anchorReason: n.anchor.provenance,
    eventTime: n.anchor.anchorTime,
    knownAt: n.observation.knownAt
  };
}
function Ku(e) {
  var i;
  const n = e.relativeStrength.series.at(-1), t = e.freshnessByComponent.relativeStrength;
  return !n || !t || e.relativeStrength.status !== "available" ? null : {
    referenceSymbol: e.relativeStrength.referenceSymbol,
    normalized: !0,
    value: n.value,
    structure: ((i = e.relativeStrength.structure) == null ? void 0 : i.summary) ?? null,
    eventTime: t.latestInputCloseTime ?? e.effectiveAsOf,
    knownAt: t.latestInputKnownAt ?? e.effectiveAsOf
  };
}
function Xu(e) {
  return e.supportResistanceZones.map((n) => yi({
    id: n.logicalId,
    kind: n.value.kind === "support" ? "supportZone" : "resistanceZone",
    price: n.value.center,
    rangeLow: n.value.low,
    rangeHigh: n.value.high,
    sourceTimeframe: n.timeframe,
    eventTime: n.eventTime,
    knownAt: n.knownAt,
    sourceObject: {
      objectType: "SupportResistanceZone",
      objectId: n.logicalId,
      snapshot: h({
        ...n.value,
        analysisObservationId: n.observationId
      })
    }
  }));
}
const Pr = "replay-analysis-data.1";
function Zu(e) {
  const n = Yi(e, "Replay analysis JSON data");
  if (va(n, ["schemaVersion", "target", "reference"], "Replay analysis JSON data"), n.schemaVersion !== Pr)
    throw new Error("Unsupported Replay analysis JSON data schema");
  const t = Ir(n.target, "target"), i = Ir(n.reference, "reference");
  return h({
    schemaVersion: Pr,
    target: t,
    reference: i
  });
}
var Q, Ee, gn, da;
class Ju {
  constructor(n) {
    Z(this, Ee);
    Z(this, Q);
    te(this, Q, Zu(n));
  }
  async getCoverage(n) {
    ma(n);
    const t = J(this, Ee, da).call(this, n);
    if (!t) return tf(n.timeframe);
    const i = [...t.candles, ...t.candleRevisions].filter(
      (r) => r.timeframe === n.timeframe
    );
    return h({
      timeframe: n.timeframe,
      earliestOpenTime: i.length ? Math.min(...i.map((r) => r.openTime)) : null,
      latestCloseTime: i.length ? Math.max(...i.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: t.revisionHistoryAvailable
    });
  }
  // Kept as a plain-language alias for callers that model coverage as a query operation.
  async coverage(n) {
    return this.getCoverage(n);
  }
  async loadCandles(n) {
    return J(this, Ee, gn).call(this, R(this, Q).target, R(this, Q).target.candles, n);
  }
  async loadCandleRevisions(n) {
    return R(this, Q).target.revisionHistoryAvailable ? J(this, Ee, gn).call(this, R(this, Q).target, R(this, Q).target.candleRevisions, n) : h([]);
  }
  async loadReferenceCandles(n) {
    return J(this, Ee, gn).call(this, R(this, Q).reference, R(this, Q).reference.candles, n);
  }
  async loadReferenceCandleRevisions(n) {
    return R(this, Q).reference.revisionHistoryAvailable ? J(this, Ee, gn).call(this, R(this, Q).reference, R(this, Q).reference.candleRevisions, n) : h([]);
  }
}
Q = new WeakMap(), Ee = new WeakSet(), gn = function(n, t, i) {
  return rf(i), Dt(n, i) ? h(
    t.filter(
      (r) => r.timeframe === i.timeframe && r.openTime >= i.from && r.openTime <= i.to
    )
  ) : h([]);
}, da = function(n) {
  return Dt(R(this, Q).target, n) ? R(this, Q).target : Dt(R(this, Q).reference, n) ? R(this, Q).reference : null;
};
class Qd extends Ju {
  constructor(n) {
    super(n);
  }
}
function Ir(e, n) {
  const t = Yi(e, `Replay analysis ${n} series`);
  va(
    t,
    ["symbol", "source", "candles", "candleRevisions", "revisionHistoryAvailable"],
    `Replay analysis ${n} series`
  );
  const i = at(t.symbol, `${n} symbol`).toUpperCase(), r = at(t.source, `${n} source`), o = Or(t.candles, `${n} candles`), a = Or(
    t.candleRevisions,
    `${n} candleRevisions`
  ), s = of(
    t.revisionHistoryAvailable,
    `${n} revisionHistoryAvailable`
  );
  if (a.length > 0 && !s)
    throw new Error(`${n} candle revisions require revisionHistoryAvailable=true`);
  return ef(o, a, i, r, n), {
    symbol: i,
    source: r,
    candles: xr(o),
    candleRevisions: xr(a),
    revisionHistoryAvailable: s
  };
}
function ef(e, n, t, i, r) {
  const o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (const l of [...e, ...n]) {
    if (nf(l, t, i, r), a.has(l.observationId))
      throw new Error(`Duplicate ${r} candle observation ${l.observationId}`);
    a.add(l.observationId);
    const u = `${l.logicalCandleId}\0${l.knownAt}`;
    if (s.has(u))
      throw new Error(`Conflicting ${r} candle revision precedence for ${l.logicalCandleId}`);
    s.add(u);
  }
  for (const l of e) {
    if (l.correctionPublishedAt != null)
      throw new Error(`Base ${r} candle cannot have correction provenance`);
    if (o.has(l.logicalCandleId))
      throw new Error(`Base ${r} history contains revisions for ${l.logicalCandleId}`);
    o.set(l.logicalCandleId, l);
  }
  const c = /* @__PURE__ */ new Map();
  for (const l of n) {
    if (!o.get(l.logicalCandleId))
      throw new Error(`${r} candle revision has no base record: ${l.logicalCandleId}`);
    if (l.revision == null || l.correctionPublishedAt == null)
      throw new Error(`${r} candle revision requires revision and correction provenance`);
    const f = c.get(l.logicalCandleId) ?? [];
    f.push(l), c.set(l.logicalCandleId, f);
  }
  for (const [l, u] of c) {
    const f = o.get(l);
    let d = f.knownAt, m = f.knownAt, v = f.revision ?? -1;
    for (const p of [...u].sort(
      (y, g) => y.knownAt - g.knownAt || y.correctionPublishedAt - g.correctionPublishedAt || y.revision - g.revision
    )) {
      if (p.knownAt <= d || p.correctionPublishedAt <= m || p.revision <= v)
        throw new Error(`${r} candle revisions must have monotonic correction provenance: ${l}`);
      d = p.knownAt, m = p.correctionPublishedAt, v = p.revision;
    }
  }
}
function nf(e, n, t, i) {
  const r = Yi(e, `Replay analysis ${i} candle`), o = _(r.timeframe);
  let a;
  try {
    a = No({
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
  if (r.symbol !== n || r.source !== t || !nn(r.openTime) || r.openTime % o !== 0 || r.closeTime !== r.openTime + o || !nn(r.closeTime) || !nn(r.knownAt) || r.knownAt < r.closeTime || r.correctionPublishedAt != null && !nn(r.correctionPublishedAt) || r.logicalCandleId !== ht(r) || r.observationId !== Nn(r) || !kr(r.vBase) || !kr(r.vQuote) || S(r) !== S(a))
    throw new Error(`Invalid ${i} replay candle ${r.observationId ?? "<unknown>"}`);
}
function Dt(e, n) {
  return n.symbol.toUpperCase() === e.symbol && n.source === e.source;
}
function tf(e) {
  return h({
    timeframe: e,
    earliestOpenTime: null,
    latestCloseTime: null,
    revisionHistoryAvailable: !1
  });
}
function ma(e) {
  at(e.symbol, "Replay analysis query symbol"), at(e.source, "Replay analysis query source"), _(e.timeframe);
}
function rf(e) {
  if (ma(e), !nn(e.from) || !nn(e.to) || e.to < e.from)
    throw new RangeError("Replay analysis query range must contain ordered Unix-second timestamps");
}
function xr(e) {
  return [...e].sort(
    (n, t) => n.timeframe.localeCompare(t.timeframe) || n.openTime - t.openTime || n.knownAt - t.knownAt || n.observationId.localeCompare(t.observationId)
  );
}
function va(e, n, t) {
  const i = Object.keys(e).sort(), r = [...n].sort();
  if (i.length !== r.length || i.some((o, a) => o !== r[a]))
    throw new Error(`${t} has unsupported or missing fields`);
}
function kr(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function nn(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function Yi(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${n} must be an object`);
  return e;
}
function at(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} is required`);
  return e;
}
function of(e, n) {
  if (typeof e != "boolean") throw new TypeError(`${n} must be boolean`);
  return e;
}
function Or(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
const Ki = "replay-analysis-session.1", af = "replay-analysis-session-event.1", sf = 128, be = /* @__PURE__ */ new Map();
function jd(e) {
  const n = h(e), t = {
    schemaVersion: Ki,
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
    replayEngineVersion: Dn,
    analysisEngineVersion: je,
    revision: 0,
    input: n,
    currentRequestedAsOf: null,
    currentEffectiveAsOf: null,
    states: [],
    events: []
  };
  return pa(t);
}
function cf(e, n) {
  return Hn(e), Jt({ ...e.input, asOf: n });
}
function lf(e, n, t = {}) {
  var d, m;
  if (Hn(e), !Number.isFinite(n) || n < 0)
    throw new RangeError("Analysis session asOf must be a non-negative finite timestamp");
  const i = hf(e.input, t), r = pf(
    e.input,
    i,
    e.input.analysisProfile.executionTimeframe
  ), o = r == null ? [...e.states] : e.states.filter((v) => v.effectiveAsOf < r), a = e.states.filter((v) => !o.some((p) => p.id === v.id)).map((v) => v.id), s = [...e.events];
  a.length && s.push(ya({
    sequence: s.length,
    kind: "invalidated",
    effectiveAsOf: r,
    analysisStateId: null,
    invalidatedStateIds: a,
    sourceObservationIds: gf(e.input, i)
  }));
  const c = ((d = o.at(-1)) == null ? void 0 : d.effectiveAsOf) ?? -1 / 0, l = un(
    i.candlesByTimeframe[i.analysisProfile.executionTimeframe] ?? [],
    n
  ).map((v) => v.closeTime).filter((v) => v > c && v <= n), u = [...o];
  for (const v of l)
    Nr(u, s, Jt({ ...i, asOf: v }));
  const f = Jt({ ...i, asOf: n });
  return ((m = u.at(-1)) == null ? void 0 : m.id) !== f.id && Nr(u, s, f), pa({
    schemaVersion: Ki,
    id: e.id,
    replayEngineVersion: Dn,
    analysisEngineVersion: je,
    revision: e.revision + 1,
    input: i,
    currentRequestedAsOf: n,
    currentEffectiveAsOf: f.effectiveAsOf,
    states: u,
    events: s
  });
}
function uf(e) {
  return Hn(e), S(e);
}
function ff(e) {
  const n = JSON.parse(e);
  return Hn(n), h(n);
}
function Hn(e) {
  if (e.schemaVersion !== Ki || e.replayEngineVersion !== Dn || e.analysisEngineVersion !== je) throw new Error("Unsupported replay analysis session version");
  const { integrityHash: n, ...t } = e;
  if (e.integrityHash !== w(t))
    throw new Error("Replay analysis session failed integrity verification");
  if (e.events.some((r, o) => r.sequence !== o || r.id !== ha(r)))
    throw new Error("Replay analysis session event log failed integrity verification");
  const i = e.states.map((r) => r.id);
  if (new Set(i).size !== i.length)
    throw new Error("Replay analysis session contains duplicate states");
}
function df(e) {
  const n = e.analysisProfile;
  return n.evaluatedTimeframes.flatMap((t) => {
    const i = _(t), r = [{
      component: `timeframe:${t}`,
      timeframe: t,
      minimumSamples: Math.max(
        n.extensionConfig.emaPeriod,
        n.extensionConfig.atrPeriod + 1,
        n.structureConfig.pivotStrength * 2 + 1
      ),
      minimumSeconds: n.extensionConfig.historyDays * 86400
    }];
    return t === n.relativeStrengthConfig.timeframe && r.push({
      component: "relativeStrength",
      timeframe: t,
      minimumSamples: n.structureConfig.pivotStrength * 2 + 1,
      minimumSeconds: n.relativeStrengthConfig.maxAgeBars * i
    }), r;
  });
}
var ae;
class Wd {
  constructor(n) {
    ge(this, "replayEngineVersion", Dn);
    Z(this, ae);
    Hn(n), te(this, ae, h(n));
  }
  getRequiredCoverage() {
    return df(R(this, ae).input);
  }
  materializeAt(n) {
    return cf(R(this, ae), n);
  }
  advanceTo(n, t = {}) {
    return te(this, ae, lf(R(this, ae), n, t)), R(this, ae).states.at(-1);
  }
  serializeState() {
    return uf(R(this, ae));
  }
  resumeState(n) {
    te(this, ae, ff(n));
  }
  snapshot() {
    return h(R(this, ae));
  }
}
ae = new WeakMap();
var He;
class Gd {
  constructor(n) {
    ge(this, "replayEngineVersion", "replay-engine.1");
    Z(this, He);
    te(this, He, h([...n].sort(
      (t, i) => t.knownAt - i.knownAt || t.id.localeCompare(i.id)
    )));
  }
  getRequiredCoverage() {
    return [];
  }
  materializeAt(n) {
    const t = R(this, He).filter((i) => i.knownAt <= n).at(-1);
    if (!t) throw new Error(`No supplied replay analysis observation is known at ${n}`);
    return h(t);
  }
  advanceTo(n) {
    return this.materializeAt(n);
  }
  serializeState() {
    return S(R(this, He));
  }
  resumeState(n) {
    if (S(JSON.parse(n)) !== S(R(this, He)))
      throw new Error("Supplied replay analysis observations cannot be replaced during resume");
  }
}
He = new WeakMap();
function Yd() {
  be.clear();
}
function Kd() {
  return be.size;
}
function Jt(e) {
  const n = mf(e), t = be.get(n);
  if (t)
    return be.delete(n), be.set(n, t), h(t);
  const i = la(e);
  for (be.set(n, i); be.size > sf; ) {
    const r = be.keys().next().value;
    if (r == null) break;
    be.delete(r);
  }
  return h(i);
}
function mf(e) {
  const n = vf(e), t = (i) => Object.fromEntries(Object.entries(i).map(([r, o]) => [
    r,
    un(o, n).map((a) => a.observationId)
  ]));
  return w({
    symbol: e.symbol.toUpperCase(),
    source: e.source,
    referenceMarket: e.analysisProfile.referenceMarketPolicy,
    effectiveAsOf: n,
    requestedAsOf: e.asOf,
    target: t(e.candlesByTimeframe),
    reference: t(e.referenceCandlesByTimeframe),
    analysisProfileHash: e.analysisProfile.canonicalConfigHash,
    lifecycleConfigHash: e.analysisProfile.lifecycleConfigRef.configHash,
    radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
    strategyProfileHash: e.strategyProfile.profileHash,
    anchors: e.avwapAnchors ?? []
  });
}
function vf(e) {
  return ua(e);
}
function Nr(e, n, t) {
  e.some((i) => i.id === t.id) || (e.push(t), n.push(ya({
    sequence: n.length,
    kind: "materialized",
    effectiveAsOf: t.effectiveAsOf,
    analysisStateId: t.id,
    invalidatedStateIds: [],
    sourceObservationIds: yf(t)
  })));
}
function yf(e) {
  return [...new Set(Object.values(e.freshnessByComponent).flatMap((n) => n.sourceObservationIds))].sort();
}
function ya(e) {
  const n = {
    schemaVersion: af,
    ...e
  };
  return h({ ...n, id: ha(n) });
}
function ha(e) {
  const { id: n, ...t } = e;
  return `replay-analysis-session-event:${w(t).slice(8)}`;
}
function hf(e, n) {
  const t = (i, r = {}) => Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(i), ...Object.keys(r)])].map(
    (o) => {
      const a = /* @__PURE__ */ new Map();
      for (const s of [...i[o] ?? [], ...r[o] ?? []])
        a.set(s.observationId, s);
      return [o, [...a.values()].sort(
        (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt
      )];
    }
  ));
  return h({
    ...e,
    candlesByTimeframe: t(e.candlesByTimeframe, n.candlesByTimeframe),
    referenceCandlesByTimeframe: t(
      e.referenceCandlesByTimeframe,
      n.referenceCandlesByTimeframe
    ),
    avwapAnchors: n.avwapAnchors ?? e.avwapAnchors
  });
}
function pf(e, n, t) {
  const i = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((c) => c.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((c) => c.observationId)
  ]), r = [
    ...Object.values(n.candlesByTimeframe).flat(),
    ...Object.values(n.referenceCandlesByTimeframe).flat()
  ].filter((c) => !i.has(c.observationId)), o = S(e.avwapAnchors ?? []) !== S(n.avwapAnchors ?? []), a = Math.min(
    ...r.map((c) => c.knownAt),
    ...o ? (n.avwapAnchors ?? []).map((c) => c.knownAt) : []
  );
  if (!Number.isFinite(a)) return null;
  const s = _(t);
  return Math.ceil(a / s) * s;
}
function gf(e, n) {
  const t = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((i) => i.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((i) => i.observationId)
  ]);
  return [
    ...Object.values(n.candlesByTimeframe).flat(),
    ...Object.values(n.referenceCandlesByTimeframe).flat()
  ].map((i) => i.observationId).filter((i) => !t.has(i)).sort();
}
function pa(e) {
  return h({
    ...e,
    integrityHash: w(e)
  });
}
const _r = "replay-json-data.1";
function Af(e) {
  const n = We(e, "Replay JSON data");
  if (n.schemaVersion !== _r)
    throw new Error("Unsupported Replay JSON data schema");
  const t = sn(n.symbol, "Replay JSON data symbol").toUpperCase(), i = sn(n.source, "Replay JSON data source"), r = ni(n.candles, "candles"), o = yn(
    n.candleRevisions,
    "candleRevisions"
  ), a = ni(n.radarEpisodes, "radarEpisodes"), s = yn(
    n.analysisStateHistory,
    "analysisStateHistory"
  ), c = yn(n.knownEvents, "knownEvents"), l = yn(
    n.venueEvidence,
    "venueEvidence"
  ), u = yn(
    n.universeEvidence,
    "universeEvidence"
  ), f = xf(
    n.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (o.length > 0 && !f)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return bf(r, o, t, i), Ef(a, t, i), wf(s, t, i), Tf(c, t, i), Rf(l, t, i), Sf(u, t, i), h({
    schemaVersion: _r,
    symbol: t,
    source: i,
    candles: Lr(r),
    candleRevisions: Lr(o),
    radarEpisodes: [...a].sort(
      (d, m) => d.detectedAt - m.detectedAt || d.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    venueEvidence: [...l].sort(Dr),
    universeEvidence: [...u].sort(Dr),
    revisionHistoryAvailable: f
  });
}
var W, we, nt, ei;
class Xd {
  constructor(n) {
    Z(this, we);
    Z(this, W);
    te(this, W, Af(n));
  }
  async getCoverage(n) {
    var i;
    Aa(n);
    const t = J(this, we, nt).call(this, [...R(this, W).candles, ...R(this, W).candleRevisions], n);
    return h({
      timeframe: n.timeframe,
      earliestOpenTime: ((i = t[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: t.length ? Math.max(...t.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: R(this, W).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(n) {
    return Fr(n), h(
      J(this, we, nt).call(this, R(this, W).candles, n).filter(
        (t) => t.openTime >= n.from && t.openTime <= n.to
      )
    );
  }
  async loadCandleRevisions(n) {
    return Fr(n), R(this, W).revisionHistoryAvailable ? h(
      J(this, we, nt).call(this, R(this, W).candleRevisions, n).filter(
        (t) => t.openTime >= n.from && t.openTime <= n.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(n) {
    return Kn(n), h(
      R(this, W).venueEvidence.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.marketDataSource === n.source && Mr(t, n)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(n) {
    return Kn(n), h(
      R(this, W).universeEvidence.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && Mr(t, n)
      )
    );
  }
  async loadAnalysisStateHistory(n) {
    return Kn(n), h(
      R(this, W).analysisStateHistory.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && t.knownAt >= n.from && t.knownAt <= n.to
      )
    );
  }
  async loadKnownEvents(n) {
    return Kn(n), J(this, we, ei).call(this, n) ? h(
      R(this, W).knownEvents.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && t.knownAt >= n.from && t.knownAt <= n.to
      )
    ) : [];
  }
  async loadRadarEpisode(n) {
    if (typeof n != "string" || !n.trim())
      throw new TypeError("Radar episode id is required");
    return h(
      R(this, W).radarEpisodes.find((t) => t.id === n) ?? null
    );
  }
}
W = new WeakMap(), we = new WeakSet(), nt = function(n, t) {
  return J(this, we, ei).call(this, t) ? n.filter((i) => i.timeframe === t.timeframe) : [];
}, ei = function(n) {
  return n.symbol.toUpperCase() === R(this, W).symbol && n.source === R(this, W).source;
};
function bf(e, n, t, i) {
  const r = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const s of [...e, ...n]) {
    We(s, "Replay candle");
    const c = _(s.timeframe);
    if (s.symbol.toUpperCase() !== t || s.source !== i || !ve(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !ve(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== ht(s) || s.observationId !== Nn(s) || !Cf(s) || !Ht(s.vBase) || !Ht(s.vQuote) || !Pf(s.revision) || !Ht(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    _e(o, s.observationId, s, "candle observation"), _e(
      a,
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
  for (const s of n) {
    const c = r.get(s.logicalCandleId);
    if (!c) throw new Error(`Candle revision has no base record: ${s.logicalCandleId}`);
    if (s.knownAt <= c.knownAt)
      throw new Error(`Candle revision must be published after its base record: ${s.logicalCandleId}`);
  }
}
function Ef(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (We(r, "Radar episode"), r.schemaVersion !== pi || r.symbol.toUpperCase() !== n || r.source !== t || r.observationId !== wi(r))
      throw new Error(`Invalid radar episode ${r.id ?? "<unknown>"}`);
    _e(i, r.id, r, "radar episode");
  }
}
function wf(e, n, t) {
  const i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of e) {
    if (We(o, "Replay analysis state"), o.schemaVersion !== ki || o.symbol.toUpperCase() !== n || o.source !== t || !ve(o.knownAt) || o.lifecycle.asOf == null || o.lifecycle.asOf > o.knownAt || o.id !== pt(o))
      throw new Error(`Invalid replay analysis state ${o.id ?? "<unknown>"}`);
    _e(i, o.id, o, "analysis state observation"), _e(r, o.knownAt, o, "analysis state knowledge time");
  }
}
function Tf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (We(r, "Replay known event"), r.schemaVersion !== Oi || r.symbol.toUpperCase() !== n || r.source !== t || !ve(r.eventTime) || !ve(r.knownAt) || r.knownAt < r.eventTime || r.id !== _i(r))
      throw new Error(`Invalid replay known event ${r.id ?? "<unknown>"}`);
    r.timeframe != null && _(r.timeframe), _e(i, r.id, r, "known event");
  }
}
function Rf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (We(r, "Venue evidence"), r.schemaVersion !== Ai || r.symbol.toUpperCase() !== n || r.marketDataSource !== t || r.observationId !== mt(r))
      throw new Error(`Invalid execution-venue evidence ${r.observationId ?? "<unknown>"}`);
    ga(r, "execution-venue evidence"), _e(i, r.observationId, r, "execution-venue evidence");
  }
}
function Sf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (We(r, "Universe evidence"), r.schemaVersion !== bi || r.symbol.toUpperCase() !== n || r.source !== t || r.observationId !== dt(r))
      throw new Error(`Invalid universe evidence ${r.observationId ?? "<unknown>"}`);
    ga(r, "universe evidence"), _e(i, r.observationId, r, "universe evidence");
  }
}
function ga(e, n) {
  if (!ve(e.effectiveFrom) || !ve(e.knownAt) || e.effectiveTo != null && (!ve(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${n} interval`);
}
function Mr(e, n) {
  return e.knownAt <= n.to && e.effectiveFrom <= n.to && (e.effectiveTo == null || e.effectiveTo >= n.from);
}
function Aa(e) {
  sn(e.symbol, "Replay query symbol"), sn(e.source, "Replay query source"), _(e.timeframe);
}
function Fr(e) {
  Aa(e), ba(e.from, e.to);
}
function Kn(e) {
  sn(e.symbol, "Replay evidence query symbol"), sn(e.source, "Replay evidence query source"), ba(e.from, e.to);
}
function ba(e, n) {
  if (!ve(e) || !ve(n) || n < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function Lr(e) {
  return [...e].sort(
    (n, t) => n.timeframe.localeCompare(t.timeframe) || n.openTime - t.openTime || n.knownAt - t.knownAt || n.observationId.localeCompare(t.observationId)
  );
}
function Dr(e, n) {
  return e.effectiveFrom - n.effectiveFrom || e.knownAt - n.knownAt || e.observationId.localeCompare(n.observationId);
}
function _e(e, n, t, i) {
  const r = e.get(n);
  if (r && S(r) !== S(t))
    throw new Error(`Conflicting ${i}`);
  e.set(n, t);
}
function Cf(e) {
  return Xn(e.o) && Xn(e.h) && Xn(e.l) && Xn(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function Xn(e) {
  return Number.isFinite(e) && e > 0;
}
function Ht(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Pf(e) {
  return e == null || If(e);
}
function If(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function ve(e) {
  return Number.isFinite(e) && e >= 0;
}
function We(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${n} must be an object`);
  return e;
}
function sn(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} is required`);
  return e;
}
function xf(e, n) {
  if (typeof e != "boolean") throw new TypeError(`${n} must be boolean`);
  return e;
}
function ni(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
function yn(e, n) {
  return e == null ? [] : ni(e, n);
}
function Zd(e, n) {
  return Oo({
    ...e,
    replayEngineVersion: ke
  }, n);
}
async function Jd(e) {
  if (e.sessionConfig.replayEngineVersion !== ke)
    throw new RangeError("Materialized replay loading requires replay-engine.2");
  if (e.analysisProfile.executionTimeframe !== e.sessionConfig.evaluationTimeframe || e.analysisProfile.canonicalConfigHash === "" || e.analysisProfile.lifecycleConfigRef.configHash !== e.strategyProfile.lifecycleConfigHash) throw new Error("Materialized replay analysis/profile configuration mismatch");
  const n = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, t = e.analysisProfile.referenceMarketPolicy.symbol, i = e.analysisProfile.referenceMarketPolicy.source ?? e.manifest.source, r = {}, o = {}, a = {}, s = {}, c = {};
  for (const E of e.analysisProfile.evaluatedTimeframes) {
    const T = { symbol: e.manifest.symbol, source: e.manifest.source, timeframe: E }, O = { symbol: t, source: i, timeframe: E }, [I, b] = await Promise.all([
      e.analysisDataAdapter.getCoverage(T),
      e.analysisDataAdapter.getCoverage(O)
    ]);
    c[E] = I;
    const A = Br(T, I, n), C = Br(O, b, n);
    r[E] = A ? await e.analysisDataAdapter.loadCandles(A) : [], o[E] = A ? await e.analysisDataAdapter.loadCandleRevisions(A) : [], a[E] = C ? await e.analysisDataAdapter.loadReferenceCandles(C) : [], s[E] = C ? await e.analysisDataAdapter.loadReferenceCandleRevisions(C) : [];
  }
  const l = Vr(r, o), u = Vr(a, s), f = {
    symbol: e.manifest.symbol,
    source: e.manifest.source,
    candlesByTimeframe: l,
    referenceCandlesByTimeframe: u,
    avwapAnchors: e.avwapAnchors,
    radarEpisode: await _f(e.historicalDataAdapter, e.manifest.radarEpisodeId),
    radarSelectionProfile: e.radarSelectionProfile,
    strategyProfile: e.strategyProfile,
    analysisProfile: e.analysisProfile,
    lifecycleConfig: e.lifecycleConfig
  }, d = /* @__PURE__ */ new Set([e.manifest.startAsOf]);
  for (const E of un(
    l[e.analysisProfile.executionTimeframe] ?? [],
    n
  ))
    E.closeTime >= e.manifest.startAsOf && E.closeTime <= n && d.add(E.closeTime);
  const m = [...d].sort((E, T) => E - T).map((E) => la({ ...f, asOf: E })), v = m.map(kf), p = Of(m), y = m.find((E) => E.effectiveAsOf === e.manifest.startAsOf) ?? m[0];
  if (!y) throw new Error("No materialized analysis state exists at replay start");
  const g = new Nf({
    evidence: e.historicalDataAdapter,
    targetBaseByTimeframe: r,
    targetRevisionsByTimeframe: o,
    targetCoverage: c,
    observations: v,
    knownEvents: p,
    radarEpisode: f.radarEpisode
  });
  return tl({
    manifest: e.manifest,
    sessionConfig: e.sessionConfig,
    historicalDataAdapter: g,
    strategyProfile: e.strategyProfile,
    radarSelectionProfile: e.radarSelectionProfile,
    venueRules: e.venueRules,
    materializedAnalysisBinding: {
      replayEngineVersion: ke,
      analysisEngineVersion: je,
      analysisProfileRef: {
        id: e.analysisProfile.id,
        version: e.analysisProfile.version,
        hash: e.analysisProfile.canonicalConfigHash
      },
      referenceMarket: { symbol: t, source: i },
      causalDataBundleFingerprint: y.dataBundleFingerprint,
      lifecycleConfigHash: e.strategyProfile.lifecycleConfigHash,
      radarProfileHash: e.radarSelectionProfile.canonicalConfigHash,
      strategyProfileHash: e.strategyProfile.profileHash
    }
  });
}
function kf(e) {
  const n = Xu(e), t = Yu(e);
  return nl({
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
    supportResistanceZones: n,
    avwapState: t,
    avwapEvents: e.avwapEvents.map((i) => i.value),
    relativeStrengthState: Ku(e),
    relativeStrengthEvents: e.relativeStrengthEvents.map((i) => i.value),
    visibleOrSelectedReferenceLevels: [
      ...e.activeStructureLevels,
      ...n,
      ...t ? [t.reference] : []
    ],
    dataQualityNotes: e.dataQualityNotes,
    materializedStateRef: {
      id: e.id,
      schemaVersion: aa,
      analysisEngineVersion: e.analysisEngineVersion,
      analysisProfileHash: e.analysisProfileRef.hash,
      dataBundleFingerprint: e.dataBundleFingerprint
    }
  });
}
function Of(e) {
  const n = /* @__PURE__ */ new Map(), t = (i) => n.set(i.id, i);
  for (const i of e) {
    for (const r of i.structureEvents)
      r.evaluatedAt === i.effectiveAsOf && t(Qn({
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
        detail: Zn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.relativeStrengthEvents)
      r.evaluatedAt === i.effectiveAsOf && t(Qn({
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
        detail: Zn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.avwapEvents)
      r.evaluatedAt === i.effectiveAsOf && t(Qn({
        symbol: i.symbol,
        source: i.source,
        kind: "avwap",
        eventType: r.value.kind,
        direction: r.value.kind === "loss" || r.value.kind === "failedReclaim" ? "bearish" : "bullish",
        timeframe: r.timeframe,
        lifecycleState: null,
        avwapId: r.logicalId.split(":").slice(2, -2).join(":") || null,
        eventTime: r.eventTime,
        knownAt: i.effectiveAsOf,
        detail: Zn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.lifecycleResult.transitions)
      r.knownAt === i.effectiveAsOf && t(Qn({
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
        detail: Zn(r)
      }));
  }
  return h([...n.values()].sort(
    (i, r) => i.knownAt - r.knownAt || i.id.localeCompare(r.id)
  ));
}
var ee;
class Nf {
  constructor(n) {
    Z(this, ee);
    te(this, ee, n);
  }
  async getCoverage(n) {
    return h(R(this, ee).targetCoverage[n.timeframe] ?? {
      timeframe: n.timeframe,
      earliestOpenTime: null,
      latestCloseTime: null,
      revisionHistoryAvailable: !1
    });
  }
  async loadCandleHistory(n) {
    return Hr(R(this, ee).targetBaseByTimeframe[n.timeframe] ?? [], n);
  }
  async loadCandleRevisions(n) {
    return Hr(R(this, ee).targetRevisionsByTimeframe[n.timeframe] ?? [], n);
  }
  async loadAnalysisStateHistory(n) {
    return h(R(this, ee).observations.filter((t) => t.symbol === n.symbol.toUpperCase() && t.source === n.source && t.knownAt >= n.from && t.knownAt <= n.to));
  }
  async loadKnownEvents(n) {
    return h(R(this, ee).knownEvents.filter((t) => t.symbol === n.symbol.toUpperCase() && t.source === n.source && t.knownAt >= n.from && t.knownAt <= n.to));
  }
  async loadPointInTimeVenueEvidence(n) {
    var t, i;
    return ((i = (t = R(this, ee).evidence).loadPointInTimeVenueEvidence) == null ? void 0 : i.call(t, n)) ?? [];
  }
  async loadPointInTimeUniverseEvidence(n) {
    var t, i;
    return ((i = (t = R(this, ee).evidence).loadPointInTimeUniverseEvidence) == null ? void 0 : i.call(t, n)) ?? [];
  }
  async loadRadarEpisode(n) {
    return n === R(this, ee).radarEpisode.id ? h(R(this, ee).radarEpisode) : null;
  }
}
ee = new WeakMap();
function Hr(e, n) {
  return h(e.filter((t) => t.symbol === n.symbol.toUpperCase() && t.source === n.source && t.timeframe === n.timeframe && t.openTime >= n.from && t.openTime <= n.to));
}
async function _f(e, n) {
  var i;
  const t = await ((i = e.loadRadarEpisode) == null ? void 0 : i.call(e, n));
  if (!t) throw new Error("Exact RadarEpisode sidecar is required for materialized replay");
  return t;
}
function Br(e, n, t) {
  return n.earliestOpenTime == null ? null : { ...e, from: n.earliestOpenTime, to: t };
}
function Vr(e, n) {
  return Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(n)])].map(
    (t) => [t, [
      ...e[t] ?? [],
      ...n[t] ?? []
    ]]
  ));
}
function Zn(e) {
  return h(e);
}
var kn;
class em {
  constructor(n) {
    Z(this, kn);
    te(this, kn, h(n));
  }
  async revealCaseOutcome(n) {
    const t = R(this, kn)[n.manifestId];
    if (!t) throw new Error(`No outcome is available for ${n.manifestId}`);
    const i = {
      schemaVersion: xi,
      sessionId: n.sessionId,
      manifestId: n.manifestId,
      revealedAt: n.revealedAt,
      revealedBeforeDecisionCompletion: n.revealedBeforeDecisionCompletion,
      outcome: t
    };
    return h({
      ...i,
      id: `replay-outcome:${w(i).slice(8)}`
    });
  }
}
kn = new WeakMap();
function nm(e, n) {
  return wt(e), h({
    schemaVersion: xo,
    id: n.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: n.type,
    payload: n.payload ?? {}
  });
}
function Ea(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && _(e.timeframe), e.type === "PriceCrossesKnownLevel" && !Bt(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!Bt(e.frozenLowerBound) || !Bt(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const n = {
    schemaVersion: Zc,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map(Ea) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return h({
    ...n,
    id: `replay-wake-condition:${w(n).slice(8)}`
  });
}
function tm(e) {
  var t, i;
  if (qr(e.createdAt, "wake plan createdAt"), qr(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((t = e.scheduledReview) == null ? void 0 : t.mode) === "nextCompletedCandle" && _(e.scheduledReview.timeframe), ((i = e.scheduledReview) == null ? void 0 : i.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const n = {
    schemaVersion: Xc,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map(Ea),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!n.scheduledReview && !n.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return h({
    ...n,
    id: `replay-wake-plan:${w(n).slice(8)}`
  });
}
function im(e) {
  Ji(e);
  const n = {
    schemaVersion: Io,
    id: wa(e),
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
  return Zi({
    ...n,
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
function wa(e) {
  return `replay-session:${w({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function ti(e) {
  var p, y;
  const { loaded: n, session: t, effectiveAsOf: i } = e, r = ne(n);
  if (i < n.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const o = Pn(n, i), a = h({ ...o.lifecycle, asOf: i }), s = [
    ...r.dataQualityNotes,
    ...o.dataQualityNotes,
    ...n.sessionConfig.replayEngineVersion === yt && o.lifecycle.asOf != null && o.lifecycle.asOf < i ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${o.id} was carried forward from ${o.lifecycle.asOf}`
    }] : []
  ], c = oc({
    symbol: n.manifest.symbol,
    source: n.manifest.source,
    decisionTime: i,
    effectiveAsOf: i,
    strategyProfile: n.strategyProfile,
    lifecycle: a,
    candidateMetrics: o.candidateMetrics,
    structureByTimeframe: o.structureByTimeframe,
    activeStructureLevels: o.activeStructureLevels,
    supportResistanceZones: o.supportResistanceZones,
    avwapState: o.avwapState,
    avwapEvents: o.avwapEvents,
    relativeStrengthState: o.relativeStrengthState,
    relativeStrengthEvents: o.relativeStrengthEvents,
    visibleOrSelectedReferenceLevels: o.visibleOrSelectedReferenceLevels,
    dataQualityNotes: s
  }), l = {}, u = {}, f = {};
  for (const g of n.sessionConfig.visibleTimeframes) {
    const E = Ta(
      r.candlesByTimeframe[g] ?? [],
      i
    ).filter((T) => T.openTime >= r.displayStartByTimeframe[g]);
    l[g] = E, f[g] = E.at(-1) ?? null, u[g] = {
      timeframe: g,
      displayStart: r.displayStartByTimeframe[g],
      visibleStart: ((p = E[0]) == null ? void 0 : p.openTime) ?? null,
      visibleEnd: ((y = E.at(-1)) == null ? void 0 : y.closeTime) ?? null,
      completedCandleCount: E.length
    };
  }
  const d = await tn({
    effectiveAsOf: i,
    analysisObservationId: o.id,
    visibleCandlesByTimeframe: l
  }), m = t.decisionRecords.map((g) => {
    var E;
    return {
      decisionRecordId: g.id,
      frameId: ((E = t.frames.find((T) => T.decisionSnapshot.id === g.snapshotId)) == null ? void 0 : E.id) ?? "",
      action: g.action,
      decisionTime: g.decisionTime
    };
  }), v = {
    schemaVersion: Kc,
    sessionId: t.id,
    manifestId: n.manifest.id,
    radarEpisodeId: n.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: i,
    evaluationTimeframe: n.sessionConfig.evaluationTimeframe,
    radarContext: Mf(n),
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
    ...o.materializedStateRef ? { materializedAnalysisStateRef: o.materializedStateRef } : {}
  };
  return h({
    ...v,
    id: `replay-frame:${w(v).slice(8)}`
  });
}
function Mf(e) {
  const n = e.dataBundle.radarEpisode;
  return h({
    radarEpisodeId: n.id,
    triggeringDetectorIds: n.triggeringDetectorIds,
    triggeringObservations: n.triggeringObservations,
    selectionAnchor: n.selectionAnchor,
    pathContext: n.pathContext,
    hardGateResults: n.hardGateResults
  });
}
function Pn(e, n) {
  const i = ne(e).analysisStateHistory.filter(
    (r) => r.knownAt <= n
  ).at(-1);
  if (!i || i.id !== pt(i))
    throw new Error(`No verified point-in-time analysis state is available at ${n}`);
  return i;
}
function Ta(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > n || i.knownAt > n) continue;
    const r = t.get(i.logicalCandleId);
    if (!r || r.knownAt < i.knownAt) t.set(i.logicalCandleId, i);
    else if (r.knownAt === i.knownAt && S(r) !== S(i))
      throw new Error(`Conflicting candle revisions for ${i.logicalCandleId}`);
  }
  return h(
    [...t.values()].sort(
      (i, r) => i.openTime - r.openTime || i.knownAt - r.knownAt
    )
  );
}
async function rm(e, n, t, i) {
  Ji(e), wt(n), Oa(n, e);
  const r = n.events.find((c) => c.command.id === t.id);
  if (r) {
    if (S(r.command) !== S(t))
      throw new Error(`Command id ${t.id} was reused with a different payload`);
    return { session: h(n), event: r, outcomeEnvelope: null, idempotent: !0 };
  }
  Ra(n, t);
  let o, a = null;
  if (t.type === "StartSession") {
    if (n.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await ti({
      loaded: e,
      session: n,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    o = Ze(t, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (n.state !== "Active" && t.type !== "RevealOutcome")
      throw new Error(`Command ${t.type} is not allowed while session is ${n.state}`);
    const c = ii(n);
    if (t.type === "Wait") {
      Sa(e, n, c, t.payload.wakePlan);
      const l = Ot({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: t.payload.confidence,
        thesis: t.payload.thesis,
        tags: [t.payload.reason, ...t.payload.tags ?? []],
        nextCondition: qf(t.payload.wakePlan)
      }), u = await Pa(
        e,
        n,
        c,
        t.payload.wakePlan
      ), f = h({
        ...n,
        decisionRecords: [...n.decisionRecords, l]
      }), d = await ti({
        loaded: e,
        session: f,
        requestedAsOf: u.requestedAsOf,
        effectiveAsOf: u.effectiveAsOf,
        wakeResult: u.wakeResult
      });
      o = Ze(t, u.state, d.effectiveAsOf, {
        frame: d,
        decisionRecord: l,
        wakePlan: t.payload.wakePlan,
        wakeResult: u.wakeResult,
        terminalReason: u.terminalReason
      });
    } else if (t.type === "Skip") {
      if (!t.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const l = Ot({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: t.payload.confidence,
        thesis: t.payload.thesis,
        tags: [...t.payload.tags ?? [], ...t.payload.reasons.slice(1)],
        skipReason: t.payload.reasons[0]
      });
      o = Ze(t, "Skipped", c.effectiveAsOf, {
        decisionRecord: l
      });
    } else if (t.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const l = yl({
        ...t.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), u = Hf(e, l), f = h({
        id: `replay-planning-attempt:${w({
          sessionId: n.id,
          frameId: c.id,
          tradePlan: l
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: l,
        accepted: u == null,
        rejectionReason: u
      }), d = u ? null : Ot({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: l
      });
      o = Ze(
        t,
        u ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: f, decisionRecord: d }
      );
    } else if (t.type === "Abandon") {
      if (!t.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      o = Ze(t, "Abandoned", c.effectiveAsOf);
    } else {
      const l = await Yf(e, n, t, i);
      a = l.envelope, o = Ze(t, "Revealed", l.revealedAt, {
        terminalReason: n.terminalReason,
        revealedBeforeDecisionCompletion: l.early,
        outcomeEnvelopeId: l.envelope.id
      });
    }
  }
  const s = Ff(n, o);
  return {
    session: Xi(n, s),
    event: s,
    outcomeEnvelope: a,
    idempotent: !1
  };
}
function Ze(e, n, t, i = {}) {
  return {
    command: e,
    stateAfter: n,
    currentAsOfAfter: t,
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
function Ff(e, n) {
  const t = {
    schemaVersion: ko,
    sequence: e.revision + 1,
    ...n
  };
  return h({
    ...t,
    id: `replay-event:${w(t).slice(8)}`
  });
}
function Xi(e, n) {
  var t;
  if (n.schemaVersion !== ko)
    throw new Error("Replay event schema is invalid");
  if (n.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (n.id !== Df(n)) throw new Error("Replay event identity is invalid");
  if (n.command.sessionId !== e.id || n.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (n.frame) {
    const { id: i, ...r } = n.frame;
    if (n.frame.id !== `replay-frame:${w(r).slice(8)}` || n.frame.sessionId !== e.id || n.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    er(n.frame);
  }
  if (n.decisionRecord && n.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (n.wakePlan && n.wakePlan.id !== Ca(n.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (n.wakeResult) {
    const { id: i, ...r } = n.wakeResult;
    if (n.wakeResult.id !== `replay-wake-result:${w(r).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return Lf(e, n), Zi({
    ...e,
    revision: n.sequence,
    state: n.stateAfter,
    currentAsOf: n.currentAsOfAfter,
    currentFrameId: ((t = n.frame) == null ? void 0 : t.id) ?? e.currentFrameId,
    frames: n.frame ? [...e.frames, n.frame] : e.frames,
    decisionRecords: n.decisionRecord ? [...e.decisionRecords, n.decisionRecord] : e.decisionRecords,
    planningAttempts: n.planningAttempt ? [...e.planningAttempts, n.planningAttempt] : e.planningAttempts,
    events: [...e.events, n],
    terminalReason: n.terminalReasonAfter,
    revealedBeforeDecisionCompletion: e.revealedBeforeDecisionCompletion || n.revealedBeforeDecisionCompletionAfter,
    revealedOutcomeEnvelopeId: n.revealedOutcomeEnvelopeIdAfter ?? e.revealedOutcomeEnvelopeId
  });
}
function Lf(e, n) {
  var u, f, d;
  const t = n.currentAsOfAfter === e.currentAsOf, i = n.frame == null, r = n.decisionRecord == null, o = n.planningAttempt == null, a = n.wakePlan == null && n.wakeResult == null, s = !n.revealedBeforeDecisionCompletionAfter && n.revealedOutcomeEnvelopeIdAfter == null;
  if (n.stateAfter === "Failed")
    throw new Error("Failed replay sessions cannot be synthesized from accepted commands");
  if (n.command.type === "StartSession") {
    if (e.state !== "Created" || n.stateAfter !== "Active" || !n.frame || n.currentAsOfAfter !== n.frame.effectiveAsOf || n.currentAsOfAfter !== e.createdAtLogicalTime || !r || !o || !a || !s || n.terminalReasonAfter != null) throw new Error("StartSession event transition is invalid");
    return;
  }
  if (n.command.type === "Wait") {
    const m = n.stateAfter === "CaseWindowEnded";
    if (e.state !== "Active" || !n.frame || !n.decisionRecord || n.decisionRecord.action !== "Wait" || !n.wakePlan || !n.wakeResult || n.wakeResult.wakePlanId !== n.wakePlan.id || ((u = n.frame.activeWakeResult) == null ? void 0 : u.id) !== n.wakeResult.id || n.currentAsOfAfter !== n.frame.effectiveAsOf || !["Active", "CaseWindowEnded"].includes(n.stateAfter) || m !== (n.terminalReasonAfter != null) || !o || !s) throw new Error("Wait event transition is invalid");
    return;
  }
  if (n.command.type === "Skip") {
    if (e.state !== "Active" || n.stateAfter !== "Skipped" || !n.decisionRecord || n.decisionRecord.action !== "Skip" || !t || !i || !o || !a || !s || n.terminalReasonAfter != null) throw new Error("Skip event transition is invalid");
    return;
  }
  if (n.command.type === "ProposeTrade") {
    const m = ((f = n.planningAttempt) == null ? void 0 : f.accepted) === !0, v = n.planningAttempt ? `replay-planning-attempt:${w({
      sessionId: e.id,
      frameId: n.planningAttempt.frameId,
      tradePlan: n.planningAttempt.tradePlan
    }).slice(8)}` : null;
    if (e.state !== "Active" || !n.planningAttempt || n.planningAttempt.id !== v || n.planningAttempt.frameId !== e.currentFrameId || n.planningAttempt.attemptedAt !== e.currentAsOf || n.stateAfter !== (m ? "TradePlanRecorded" : "Active") || (m ? ((d = n.decisionRecord) == null ? void 0 : d.action) !== "ProposeTrade" : n.decisionRecord != null) || !t || !i || !a || !s || n.terminalReasonAfter != null) throw new Error("ProposeTrade event transition is invalid");
    return;
  }
  if (n.command.type === "Abandon") {
    if (e.state !== "Active" || n.stateAfter !== "Abandoned" || !t || !i || !r || !o || !a || !s || n.terminalReasonAfter != null) throw new Error("Abandon event transition is invalid");
    return;
  }
  const c = [
    "Skipped",
    "TradePlanRecorded",
    "CaseWindowEnded",
    "Abandoned"
  ].includes(e.state), l = e.state === "Active" && n.command.payload.abandonActive && n.revealedBeforeDecisionCompletionAfter;
  if (!c && !l || n.stateAfter !== "Revealed" || !t || !i || !r || !o || !a || n.revealedOutcomeEnvelopeIdAfter == null || n.terminalReasonAfter !== e.terminalReason) throw new Error("RevealOutcome event transition is invalid");
}
function Df(e) {
  const { id: n, ...t } = e;
  return `replay-event:${w(t).slice(8)}`;
}
function Ra(e, n) {
  if (n.schemaVersion !== xo || !n.id.trim())
    throw new Error("Replay command schema or id is invalid");
  if (n.sessionId !== e.id) throw new Error("Replay command targets another session");
  if (n.expectedRevision !== e.revision)
    throw new Error(`Stale replay revision ${n.expectedRevision}; expected ${e.revision}`);
  if (n.currentFrameId !== e.currentFrameId)
    throw new Error("Replay command does not reference the current frame");
  const t = e.currentAsOf ?? e.createdAtLogicalTime;
  if (n.submittedLogicalTime !== t)
    throw new Error("Replay command submittedLogicalTime must equal the current replay clock");
  if (e.state === "Revealed" || e.state === "Failed")
    throw new Error(`No commands are accepted after ${e.state}`);
}
function ii(e) {
  const n = e.frames.find((t) => t.id === e.currentFrameId);
  if (!n || n.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return n;
}
function Hf(e, n) {
  if (n.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (n.sizingResult.sizingModelVersion !== Fo)
    return "Sizing model version mismatch";
  if (n.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (n.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (n.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && S(n.venueRules) !== S(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const t = e.manifest.executionVenueEligibility.executionVenue;
  return t && n.venueRules.venue.toLowerCase() !== t.toLowerCase() ? "Trade plan venue does not match the manifest execution venue" : Bf(e, n.createdAt, t) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function Bf(e, n, t) {
  const i = ne(e).venueEvidence.filter(
    (o) => o.knownAt <= n && o.effectiveFrom <= n && (o.effectiveTo == null || o.effectiveTo > n) && o.executionVenue.toLowerCase() === t.toLowerCase()
  ).at(-1);
  if (i) return i.status;
  const r = e.manifest.executionVenueEligibility;
  return r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo > n) ? r.status : "Unavailable";
}
function Sa(e, n, t, i) {
  var r;
  if (i.id !== Ca(i)) throw new Error("Wake plan identity is invalid");
  if (i.submittedFrameId !== t.id || i.createdAt !== t.effectiveAsOf)
    throw new Error("Wake plan must be frozen against the current frame");
  if (i.deadlineAsOf > t.effectiveAsOf + e.sessionConfig.maximumSingleWaitDuration || i.deadlineAsOf > e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration)
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  if (((r = i.scheduledReview) == null ? void 0 : r.mode) === "nextCompletedCandle" && !Object.hasOwn(
    ne(e).candlesByTimeframe,
    i.scheduledReview.timeframe
  ))
    throw new RangeError(
      `Scheduled review timeframe ${i.scheduledReview.timeframe} is not loaded`
    );
  for (const o of Et(i.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(o.type))
      throw new RangeError(`Wake condition ${o.type} is not allowed`);
    if (o.id !== Vf(o))
      throw new Error(`Wake condition ${o.id} failed deterministic verification`);
  }
  if ($f(t, i.conditions), Uf(e, t, i.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (n.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function Ca(e) {
  const { id: n, ...t } = e;
  return `replay-wake-plan:${w(t).slice(8)}`;
}
function Vf(e) {
  const { id: n, ...t } = e;
  return `replay-wake-condition:${w(t).slice(8)}`;
}
function $f(e, n) {
  const t = mo(e.decisionSnapshot);
  for (const i of Et(n)) {
    if (i.type === "PriceCrossesKnownLevel") {
      const r = t.find((o) => o.id === i.referenceId);
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame reference ${i.referenceId}`);
      if (r.price !== i.frozenPrice)
        throw new Error("Frozen level price does not match the current DecisionFrame");
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = t.find(
        (o) => o.sourceObject.observationId === i.zoneObservationId
      );
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame zone ${i.zoneObservationId}`);
      if (r.rangeLow !== i.frozenLowerBound || r.rangeHigh !== i.frozenUpperBound)
        throw new Error("Frozen zone bounds do not match the current DecisionFrame");
    }
  }
}
function Uf(e, n, t) {
  for (const i of Et(t)) {
    if (i.type === "LifecycleStateEntered" && n.lifecycleState === i.state) return !0;
    if (i.type === "PriceCrossesKnownLevel") {
      const r = In(e, i.timeframe, n.effectiveAsOf);
      if (r != null && (i.direction === "above" && r >= i.frozenPrice || i.direction === "below" && r <= i.frozenPrice)) return !0;
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = In(e, i.timeframe, n.effectiveAsOf);
      if (r != null && r >= i.frozenLowerBound && r <= i.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function Et(e) {
  return e.flatMap(
    (n) => n.type === "AnyOf" ? [n, ...Et(n.conditions)] : [n]
  );
}
function qf(e) {
  return S({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((n) => n.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function Pa(e, n, t, i) {
  var I;
  const r = t.effectiveAsOf, o = ne(e), a = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = Qf(e), c = zf(e, r, i.scheduledReview), l = ((I = i.scheduledReview) == null ? void 0 : I.mode) === "elapsedDuration" ? r + i.scheduledReview.durationSeconds : c ?? i.deadlineAsOf, u = Math.min(i.deadlineAsOf, a, s);
  if (u < r) throw new Error("Historical coverage ends before the replay clock");
  const f = /* @__PURE__ */ new Set([u]);
  for (const b of o.analysisStateHistory)
    b.knownAt > r && b.knownAt <= u && f.add(b.knownAt);
  for (const b of o.knownEvents)
    b.knownAt > r && b.knownAt <= u && f.add(b.knownAt);
  for (const b of Object.values(o.candlesByTimeframe))
    for (const A of b) {
      const C = Math.max(A.closeTime, A.knownAt);
      C > r && C <= u && f.add(C);
    }
  c != null && c > r && c <= u && f.add(c), i.deadlineAsOf > r && i.deadlineAsOf <= u && f.add(i.deadlineAsOf), a > r && a <= u && f.add(a), s > r && s <= u && f.add(s);
  const d = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null
  }, m = [...f].sort((b, A) => b - A);
  let v = u, p = "DEADLINE_REACHED", y = [], g = [], E = null;
  for (const b of m) {
    d.evaluationPointsChecked.push(b);
    const A = jf(e, b, r);
    d.lifecycleTransitionsEncountered.push(...A);
    const C = Ia(e, i.conditions, r, b, d), k = Gf(e, b, r);
    if (k) {
      v = b, p = "CASE_BOUNDARY_REACHED", E = k, y = C.conditionIds, g = C.eventIds, C.conditionIds.length && (d.firstTriggeringEffectiveAsOf = b);
      break;
    }
    if (C.conditionIds.length) {
      v = b, p = "CONDITION_TRIGGERED", y = C.conditionIds, g = C.eventIds, d.firstTriggeringEffectiveAsOf = b;
      break;
    }
    if (c != null && b >= c) {
      v = b, p = "SCHEDULED_REVIEW";
      break;
    }
    if (b >= u) {
      v = u, u === a ? (p = "CASE_BOUNDARY_REACHED", E = "MAXIMUM_CASE_DURATION") : u === s ? (p = "CASE_BOUNDARY_REACHED", E = "DATA_COVERAGE_ENDED") : p = "DEADLINE_REACHED";
      break;
    }
  }
  const T = {
    schemaVersion: Jc,
    wakePlanId: i.id,
    startedAt: r,
    effectiveAsOf: v,
    reason: p,
    triggeredConditionIds: [...new Set(y)],
    triggeringEventIds: [...new Set(g)],
    auditTrace: d
  }, O = h({
    ...T,
    id: `replay-wake-result:${w(T).slice(8)}`
  });
  return {
    requestedAsOf: l,
    effectiveAsOf: v,
    state: E ? "CaseWindowEnded" : "Active",
    terminalReason: E,
    wakeResult: O
  };
}
function zf(e, n, t) {
  if (!t) return null;
  if (t.mode === "nextCompletedCandle")
    return $r(e, t.timeframe, n);
  const i = _(e.sessionConfig.evaluationTimeframe), r = n + t.durationSeconds, o = Math.ceil(r / i) * i;
  return $r(e, e.sessionConfig.evaluationTimeframe, o - 1);
}
function $r(e, n, t) {
  return (ne(e).candlesByTimeframe[n] ?? []).filter((i) => i.closeTime > t).map((i) => Math.max(i.closeTime, i.knownAt)).sort((i, r) => i - r)[0] ?? null;
}
function Qf(e) {
  const t = (ne(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((i) => i.closeTime);
  return t.length ? Math.max(...t) : e.manifest.startAsOf;
}
function jf(e, n, t) {
  var a;
  const i = ne(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === n && s.knownAt > t
  ).map((s) => s.id), r = (a = ri(e, n)) == null ? void 0 : a.lifecycle.currentState, o = Pn(e, n);
  return r !== o.lifecycle.currentState && i.push(o.id), [...new Set(i)];
}
function ri(e, n) {
  return ne(e).analysisStateHistory.filter((t) => t.knownAt < n).at(-1) ?? null;
}
function Ia(e, n, t, i, r) {
  const o = [], a = [];
  for (const s of n) {
    const c = Wf(e, s, t, i, r);
    c.matched && (o.push(...c.conditionIds), a.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(o)], eventIds: [...new Set(a)] };
}
function Wf(e, n, t, i, r) {
  var l, u;
  if (n.type === "AnyOf") {
    const f = Ia(e, n.conditions, t, i, r), d = f.conditionIds.length > 0;
    return r.conditionEvaluations.push({
      conditionId: n.id,
      effectiveAsOf: i,
      matched: d,
      matchedEventIds: f.eventIds
    }), {
      matched: d,
      conditionIds: d ? [n.id, ...f.conditionIds] : [],
      eventIds: f.eventIds
    };
  }
  const o = ne(e).knownEvents.filter(
    (f) => f.knownAt === i && f.knownAt > t
  );
  let a = [], s = !1;
  if (n.type === "NextLifecycleTransition")
    a = o.filter((f) => f.kind === "lifecycleTransition"), s = a.length > 0 || ((l = ri(e, i)) == null ? void 0 : l.lifecycle.currentState) !== Pn(e, i).lifecycle.currentState;
  else if (n.type === "LifecycleStateEntered")
    a = o.filter(
      (f) => f.kind === "lifecycleTransition" && f.lifecycleState === n.state
    ), s = a.length > 0 || Pn(e, i).lifecycle.currentState === n.state && ((u = ri(e, i)) == null ? void 0 : u.lifecycle.currentState) !== n.state;
  else if (n.type === "StructureEventConfirmed")
    a = o.filter(
      (f) => f.kind === "structure" && f.timeframe === n.timeframe && f.eventType === n.eventType && f.direction === n.direction
    ), s = a.length > 0;
  else if (n.type === "AvwapEventConfirmed")
    a = o.filter(
      (f) => f.kind === "avwap" && f.eventType === n.eventType && (n.avwapId == null || f.avwapId === n.avwapId)
    ), s = a.length > 0;
  else if (n.type === "RelativeStrengthEventConfirmed")
    a = o.filter(
      (f) => f.kind === "relativeStrength" && f.eventType === n.eventType && (n.timeframe == null || f.timeframe === n.timeframe)
    ), s = a.length > 0;
  else if (n.type === "RadarOrLifecycleTerminal")
    a = o.filter(
      (f) => f.kind === "radarTerminal" || f.kind === "lifecycleTerminal"
    ), s = a.length > 0;
  else if (n.type === "PriceCrossesKnownLevel") {
    const f = Ur(e, n.timeframe, i), d = In(e, n.timeframe, i);
    s = f != null && d != null && (n.direction === "above" ? f < n.frozenPrice && d >= n.frozenPrice : f > n.frozenPrice && d <= n.frozenPrice);
  } else if (n.type === "PriceEntersKnownZone") {
    const f = Ur(e, n.timeframe, i), d = In(e, n.timeframe, i), m = (v) => v >= n.frozenLowerBound && v <= n.frozenUpperBound;
    s = f != null && d != null && !m(f) && m(d);
  }
  const c = a.map((f) => f.id);
  return r.conditionEvaluations.push({
    conditionId: n.id,
    effectiveAsOf: i,
    matched: s,
    matchedEventIds: c
  }), {
    matched: s,
    conditionIds: s ? [n.id] : [],
    eventIds: c
  };
}
function Gf(e, n, t) {
  const i = ne(e).knownEvents.filter(
    (r) => r.knownAt === n && r.knownAt > t
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && i.some((r) => r.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (i.some((r) => r.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(Pn(e, n).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function In(e, n, t) {
  var i;
  return ((i = Ta(
    ne(e).candlesByTimeframe[n] ?? [],
    t
  ).at(-1)) == null ? void 0 : i.c) ?? null;
}
function Ur(e, n, t) {
  const r = (ne(e).candlesByTimeframe[n] ?? []).map((o) => Math.max(o.closeTime, o.knownAt)).filter((o) => o < t);
  return r.length ? In(e, n, Math.max(...r)) : null;
}
async function Yf(e, n, t, i) {
  if (!i) throw new Error("Outcome reveal requires a separate ReplayOutcomeStore");
  const r = ["Skipped", "TradePlanRecorded", "CaseWindowEnded", "Abandoned"].includes(
    n.state
  ), o = n.state === "Active";
  if (o && (!t.payload.abandonActive || !e.sessionConfig.allowEarlyReveal))
    throw new Error("Active replay reveal requires configured explicit abandon-and-reveal");
  if (!r && !o) throw new Error(`Outcome cannot be revealed from ${n.state}`);
  const a = n.currentAsOf ?? e.manifest.startAsOf, s = await i.revealCaseOutcome({
    sessionId: n.id,
    manifestId: n.manifestId,
    revealedAt: a,
    revealedBeforeDecisionCompletion: o
  });
  return Kf(n, s, o), { envelope: s, early: o, revealedAt: a };
}
function Kf(e, n, t) {
  const { id: i, ...r } = n;
  if (n.schemaVersion !== xi || n.id !== `replay-outcome:${w(r).slice(8)}` || n.sessionId !== e.id || n.manifestId !== e.manifestId || n.revealedBeforeDecisionCompletion !== t)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function om(e) {
  wt(e), Na(e);
  for (const n of e.frames) er(n);
  return S(e);
}
function Xf(e) {
  const n = JSON.parse(e);
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new TypeError("Serialized replay session must be an object");
  const t = n;
  wt(t), Na(t);
  for (const i of t.frames) er(i);
  return h(t);
}
async function am(e, n) {
  const t = Xf(e);
  Ji(n), Oa(t, n);
  const i = Zf(t);
  if (S(i) !== S(t))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (t.currentAsOf != null && t.currentFrameId != null) {
    const r = ii(t), o = t.events.findIndex((u) => {
      var f;
      return ((f = u.frame) == null ? void 0 : f.id) === r.id;
    });
    if (o < 0) throw new Error("Current replay frame is absent from the event log");
    let a = xa(ka(t));
    for (const u of t.events.slice(0, o))
      a = Xi(a, u);
    const s = t.events[o];
    let c = r.activeWakeResult;
    if (s.command.type === "Wait") {
      const u = ii(a);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      Sa(
        n,
        a,
        u,
        s.wakePlan
      );
      const f = await Pa(
        n,
        a,
        u,
        s.wakePlan
      );
      if (S(f.wakeResult) !== S(s.wakeResult) || f.requestedAsOf !== r.requestedAsOf || f.effectiveAsOf !== r.effectiveAsOf || f.state !== s.stateAfter || f.terminalReason !== s.terminalReasonAfter)
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      c = f.wakeResult;
    }
    if (s.decisionRecord && (a = h({
      ...a,
      decisionRecords: [...a.decisionRecords, s.decisionRecord]
    })), (await ti({
      loaded: n,
      session: a,
      requestedAsOf: r.requestedAsOf,
      effectiveAsOf: r.effectiveAsOf,
      wakeResult: c
    })).id !== r.id)
      throw new Error("Replay resume data does not reproduce the current DecisionFrame");
  }
  return t;
}
function Zf(e) {
  let n = xa(ka(e));
  const t = /* @__PURE__ */ new Set();
  for (const i of e.events) {
    if (t.has(i.command.id)) throw new Error("Replay event log repeats a command id");
    t.add(i.command.id), Ra(n, i.command), n = Xi(n, i);
  }
  return n;
}
function xa(e) {
  return Zi({
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
function ka(e) {
  return h({
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
function Zi(e) {
  const { integrityHash: n, ...t } = e;
  return h({ ...t, integrityHash: w(t) });
}
function wt(e) {
  if (e.schemaVersion !== Io || !gt(e.replayEngineVersion)) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: n, ...t } = e;
  if (n !== w(t)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function Ji(e) {
  if (Ni(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || !gt(e.sessionConfig.replayEngineVersion) || e.sessionConfig.replayEngineVersion === ke && !e.materializedAnalysisBinding || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function Oa(e, n) {
  if (e.id !== wa(n) || e.manifestId !== n.manifest.id || e.radarEpisodeId !== n.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== n.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== n.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== n.strategyProfile.profileHash || e.lifecycleVersion !== n.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== n.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== n.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== n.dataBundle.causalPrefixFingerprint || e.replayEngineVersion !== n.sessionConfig.replayEngineVersion || S(e.materializedAnalysisRef ?? null) !== S(n.materializedAnalysisBinding ?? null) || S(e.venueRulesRef) !== S(n.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function er(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const n of Object.values(e.visibleCandlesByTimeframe))
    if (n.some((t) => t.closeTime > e.effectiveAsOf || t.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  Jf(e, e.effectiveAsOf);
}
function Jf(e, n) {
  const t = (i) => {
    if (!(!i || typeof i != "object")) {
      if (Array.isArray(i)) {
        i.forEach(t);
        return;
      }
      for (const [r, o] of Object.entries(i)) {
        if (r === "knownAt" && typeof o == "number" && o > n)
          throw new Error("Replay frame contains evidence not known at its cutoff");
        t(o);
      }
    }
  };
  t(e);
}
function Na(e) {
  const n = /* @__PURE__ */ new Set([
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
  ]), t = (i) => {
    if (!(!i || typeof i != "object")) {
      if (Array.isArray(i)) {
        i.forEach(t);
        return;
      }
      for (const [r, o] of Object.entries(i)) {
        if (n.has(r)) throw new Error(`Public replay session contains forbidden key ${r}`);
        t(o);
      }
    }
  };
  t(e);
}
function Bt(e) {
  return Number.isFinite(e) && e > 0;
}
function qr(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite timestamp`);
}
const ed = "trainer-ui.1", sm = "trainer-worker-protocol.1", nd = "trainer-presentation-profile.1", td = "trainer-study-run.1", cm = "trainer-study-case.1", id = "trainer-case-bundle.1", lm = "trainer-public-frame.1", um = "trainer-analysis-action.1", rd = "trainer-review-record.1", fm = "trainer-local-store.1", od = "trainer-corpus-index.1";
function dm(e) {
  const n = h(e), t = {
    ...n,
    bundleFingerprint: _a(n)
  };
  return ad(t), h(t);
}
function _a(e) {
  const { bundleFingerprint: n, ...t } = e;
  return w(t);
}
function ad(e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError("TrainerCaseBundle must be an object");
  const n = e;
  if (n.schemaVersion !== id)
    throw new Error(`Unsupported trainer case bundle schema: ${String(n.schemaVersion)}`);
  if (Te(n.bundleId, "bundleId"), Te(n.bundleFingerprint, "bundleFingerprint"), n.bundleFingerprint !== _a(n))
    throw new Error("TrainerCaseBundle fingerprint mismatch");
  if (n.safeDescriptor.replayCaseManifestId !== n.replayCaseManifest.id)
    throw new Error("Safe descriptor ReplayCaseManifest reference mismatch");
  if (n.safeDescriptor.radarEpisodeId !== n.replayCaseManifest.radarEpisodeId)
    throw new Error("Safe descriptor RadarEpisode reference mismatch");
  const t = n.replayCaseManifest.selectionProfileRef;
  if (t.id !== n.radarSelectionProfile.id || t.version !== n.radarSelectionProfile.version || t.canonicalConfigHash !== n.radarSelectionProfile.canonicalConfigHash) throw new Error("RadarSelectionProfile reference mismatch");
  const i = n.replayCaseManifest.strategyProfileRef;
  if (i.id !== n.strategyProfile.id || i.version !== n.strategyProfile.version || i.profileHash !== n.strategyProfile.profileHash) throw new Error("StrategyProfile reference mismatch");
  if (n.replaySessionConfig.strategyProfileRef.id !== n.strategyProfile.id || n.replaySessionConfig.strategyProfileRef.profileHash !== n.strategyProfile.profileHash) throw new Error("ReplaySessionConfig strategy reference mismatch");
  if (n.replayAnalysisProfile.lifecycleConfigRef.version !== n.strategyProfile.lifecycleVersion || n.replayAnalysisProfile.lifecycleConfigRef.configHash !== n.strategyProfile.lifecycleConfigHash) throw new Error("ReplayAnalysisProfile lifecycle reference mismatch");
  if (n.safeDescriptor.symbol !== n.replayCaseManifest.symbol)
    throw new Error("Safe descriptor symbol mismatch");
  if (n.safeDescriptor.source !== n.replayCaseManifest.source)
    throw new Error("Safe descriptor source mismatch");
}
function mm(e, n) {
  Te(e, "corpus id"), Ma(n.map((i) => i.id), "case id");
  const t = {
    schemaVersion: od,
    id: e,
    cases: h(n)
  };
  return h({ ...t, fingerprint: w(t) });
}
function vm(e, n, t, i = {}) {
  if (Te(n, "selection seed"), !Number.isInteger(t) || t < 1) throw new RangeError("Case count must be positive");
  const r = e.cases.filter((a) => sd(a, i)), o = /* @__PURE__ */ new Map();
  for (const a of r)
    o.has(a.radarEpisodeId) || o.set(a.radarEpisodeId, a);
  return h([...o.values()].sort((a, s) => {
    const c = w({ seed: n, corpus: e.fingerprint, caseId: a.id }), l = w({ seed: n, corpus: e.fingerprint, caseId: s.id });
    return c.localeCompare(l) || a.id.localeCompare(s.id);
  }).slice(0, t));
}
function ym(e, n, t = !1) {
  return h(!n || t ? e : {
    ...e,
    detectedAt: null,
    symbol: null,
    source: null
  });
}
function hm(e) {
  if (e.schemaVersion !== nd)
    throw new Error("Unsupported trainer presentation profile schema");
  if (Te(e.id, "presentation profile id"), Te(e.version, "presentation profile version"), !e.paneTimeframes.length || e.paneTimeframes.length > 4)
    throw new RangeError("A presentation profile requires one to four panes");
  return h({ ...e, canonicalConfigHash: w(e) });
}
function pm(e) {
  if (Te(e.id, "study run id"), Te(e.selectionSeed, "selection seed"), e.requestedCaseCount !== e.selectedCaseIds.length)
    throw new Error("Requested and selected case counts must match");
  Ma(e.selectedCaseIds, "selected case id");
  const n = {
    ...h(e),
    schemaVersion: td,
    trainerVersion: ed
  };
  return h({ ...n, canonicalConfigHash: w(n) });
}
function gm(e) {
  if (Te(e.id, "review id"), e.decisionQualityRating != null && (!Number.isInteger(e.decisionQualityRating) || e.decisionQualityRating < 1 || e.decisionQualityRating > 5)) throw new RangeError("Decision quality rating must be from 1 through 5");
  return h({
    ...e,
    schemaVersion: rd
  });
}
function sd(e, n) {
  if (n.radarSelectionProfileId && e.radarSelectionProfileRef.id !== n.radarSelectionProfileId || n.triggerDetectorId && !e.triggerDetectorIds.includes(n.triggerDetectorId) || n.scanTimeframe && e.scanTimeframe !== n.scanTimeframe || n.source && e.source !== n.source || n.dataQualityStatus && e.dataQualityStatus !== n.dataQualityStatus || n.venueEligibility && e.venueEligibility !== n.venueEligibility || n.pathContextTag && !e.pathContextTags.includes(n.pathContextTag)) return !1;
  if (n.minimumSelectionMetric) {
    const t = e.selectionMetrics[n.minimumSelectionMetric.key];
    if (typeof t != "number" || t < n.minimumSelectionMetric.value) return !1;
  }
  if (n.maximumSelectionMetric) {
    const t = e.selectionMetrics[n.maximumSelectionMetric.key];
    if (typeof t != "number" || t > n.maximumSelectionMetric.value) return !1;
  }
  return !0;
}
function Te(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} is required`);
}
function Ma(e, n) {
  if (new Set(e).size !== e.length) throw new Error(`Duplicate ${n}`);
}
export {
  sa as AVWAP_ANCHOR_SCHEMA_VERSION,
  Ed as CANDLE_TIMESTAMP_SEMANTICS,
  vl as DECISION_RECORD_SCHEMA_VERSION,
  uo as DECISION_SNAPSHOT_SCHEMA_VERSION,
  rc as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Li as EXECUTION_CANDLE_SCHEMA_VERSION,
  Il as EXECUTION_DATA_BUNDLE_SCHEMA_VERSION,
  _n as EXECUTION_ENGINE_VERSION,
  $o as EXECUTION_EVENT_SCHEMA_VERSION,
  Cl as EXECUTION_FILL_SCHEMA_VERSION,
  Er as EXECUTION_JSON_DATA_SCHEMA_VERSION,
  Sl as EXECUTION_ORDER_SCHEMA_VERSION,
  xl as EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
  Bo as EXECUTION_PROFILE_SCHEMA_VERSION,
  qo as EXECUTION_QUOTE_SCHEMA_VERSION,
  Pl as EXECUTION_RESULT_SCHEMA_VERSION,
  Yl as EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION,
  Vo as EXECUTION_SESSION_SCHEMA_VERSION,
  Uo as EXECUTION_TRADE_SCHEMA_VERSION,
  Ai as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  Cd as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  zo as FUNDING_OBSERVATION_SCHEMA_VERSION,
  hn as IMPULSE_FADE_CANDIDATE_GATE,
  Ya as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  fe as IMPULSE_FADE_LIFECYCLE_VERSION,
  ec as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  nc as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  Ie as IMPULSE_FADE_SETUP_FAMILY,
  Qd as InMemoryReplayAnalysisDataAdapter,
  Nl as InMemoryReplayExecutionDataAdapter,
  xd as InMemoryReplayHistoricalDataAdapter,
  em as InMemoryReplayOutcomeStore,
  Ju as JsonReplayAnalysisDataAdapter,
  Dd as JsonReplayExecutionDataAdapter,
  Xd as JsonReplayHistoricalDataAdapter,
  aa as MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  Dn as MATERIALIZED_REPLAY_ENGINE_VERSION,
  Wd as MaterializedReplayAnalysisProvider,
  Ol as POSITION_LEDGER_SCHEMA_VERSION,
  pi as RADAR_EPISODE_SCHEMA_VERSION,
  gi as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  mc as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  vo as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  vc as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  yc as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  bi as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  Yt as RELATIVE_STRENGTH_FORMULA_VERSION,
  Ou as REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION,
  je as REPLAY_ANALYSIS_ENGINE_VERSION,
  Ud as REPLAY_ANALYSIS_FRAME_SCHEMA_VERSION,
  Pr as REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
  ku as REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION,
  oa as REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION,
  af as REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION,
  Ki as REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION,
  ki as REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  yo as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  xo as REPLAY_COMMAND_SCHEMA_VERSION,
  el as REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
  Kc as REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  yt as REPLAY_ENGINE_VERSION,
  ko as REPLAY_EVENT_SCHEMA_VERSION,
  _r as REPLAY_JSON_DATA_SCHEMA_VERSION,
  Oi as REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  ke as REPLAY_MATERIALIZED_ENGINE_VERSION,
  xi as REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  Ii as REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  Io as REPLAY_SESSION_SCHEMA_VERSION,
  Zc as REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  Xc as REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  Jc as REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  Fo as SIZING_MODEL_VERSION,
  ml as SIZING_RESULT_SCHEMA_VERSION,
  Js as STRATEGY_PROFILE_SCHEMA_VERSION,
  Gd as SuppliedObservationReplayAnalysisProvider,
  Lo as TRADE_PLAN_SCHEMA_VERSION,
  um as TRAINER_ANALYSIS_ACTION_SCHEMA_VERSION,
  id as TRAINER_CASE_BUNDLE_SCHEMA_VERSION,
  od as TRAINER_CORPUS_INDEX_SCHEMA_VERSION,
  fm as TRAINER_LOCAL_STORE_SCHEMA_VERSION,
  nd as TRAINER_PRESENTATION_PROFILE_SCHEMA_VERSION,
  lm as TRAINER_PUBLIC_FRAME_SCHEMA_VERSION,
  rd as TRAINER_REVIEW_RECORD_SCHEMA_VERSION,
  cm as TRAINER_STUDY_CASE_SCHEMA_VERSION,
  td as TRAINER_STUDY_RUN_SCHEMA_VERSION,
  ed as TRAINER_UI_VERSION,
  sm as TRAINER_WORKER_PROTOCOL_VERSION,
  Di as VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  kl as VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  Kl as advanceExecutionTo,
  lf as advanceReplayAnalysisTo,
  vd as appendSyntheticCandle,
  rm as applyReplayCommand,
  rn as bucketStart,
  Do as calculateLinearPerpetualSizing,
  Me as candleCloseTime,
  Be as candleRevisionKnownAt,
  ar as candleToBytes,
  Ba as candlesToBytes,
  w as canonicalHash,
  Id as canonicalRadarJson,
  S as canonicalSerialize,
  Yd as clearReplayAnalysisCache,
  li as computeAnchoredVwapLine,
  ms as computeAnchoredVwapSignals,
  ds as computeAnchoredVwapSnapshot,
  Za as computeAtrLine,
  pd as computeBollingerBands,
  fd as computeCloseChangePct,
  Ka as computeEmaLine,
  ze as computeExtensionSnapshot,
  Ad as computeMacd,
  Ve as computeMarketStructure,
  ro as computeRelativeCumulativeReturnLine,
  hs as computeRelativeStrengthDivergences,
  gd as computeRsiLine,
  Ja as computeSetupState,
  yd as computeSmaLine,
  Xa as computeStochRsi,
  ys as computeStructureActiveLevels,
  wd as computeSupportResistanceZones,
  io as computeSupportResistanceZonesFromSwings,
  vs as computeSwingPoints,
  dd as computeViewBounds,
  hd as computeWmaLine,
  zd as createAvwapAnchorSpec,
  Ot as createDecisionRecord,
  yi as createDecisionReferenceLevel,
  oc as createDecisionSnapshot,
  kd as createDefaultReplaySessionConfig,
  qt as createDurableObjectReference,
  Bi as createExecutionCandleObservation,
  _l as createExecutionProfile,
  Go as createExecutionQuoteObservation,
  Vi as createExecutionSession,
  Wo as createExecutionTradeObservation,
  pc as createExecutionVenueEligibilityObservation,
  Nd as createExperimentalExecutionProfile,
  qd as createExperimentalReplayAnalysisProfile,
  Yo as createFundingObservation,
  ic as createImpulseFadeResearchProfile,
  Zd as createMaterializedReplaySessionConfig,
  hc as createRadarSelectionProfile,
  Rd as createRadarStructureObservation,
  _u as createReplayAnalysisProfile,
  jd as createReplayAnalysisSession,
  nl as createReplayAnalysisStateObservation,
  No as createReplayCandleRecord,
  nm as createReplayCommand,
  Qn as createReplayKnownEvent,
  im as createReplaySession,
  Oo as createReplaySessionConfig,
  Ea as createReplayWakeCondition,
  tm as createReplayWakePlan,
  Md as createResearchVenueExecutionRules,
  fo as createStrategyProfile,
  yl as createTradePlan,
  dm as createTrainerCaseBundle,
  mm as createTrainerCorpusIndex,
  hm as createTrainerPresentationProfile,
  gm as createTrainerReviewRecord,
  pm as createTrainerStudyRun,
  Sd as createUniverseMembershipObservation,
  Ml as createVenueExecutionRules,
  _d as createVenueFeeSchedule,
  tc as decisionReferenceObservationId,
  hi as decisionSnapshotId,
  mo as decisionSnapshotReferenceLevels,
  $d as deserializeExecutionSession,
  ff as deserializeReplayAnalysisSession,
  Xf as deserializeReplaySession,
  ua as effectiveReplayAnalysisAsOf,
  Kr as evaluateImpulseFadeSnapshot,
  bd as evaluateImpulseFadeTimeline,
  hl as evaluateTradePlanCompliance,
  Fd as executionCandleFromReplay,
  Qo as executionProfileHash,
  mt as executionVenueEligibilityObservationId,
  jo as feeScheduleHash,
  Xl as finalizeExecutionAtHorizon,
  h as immutableJsonClone,
  cn as impulseFadeLifecycleConfigHash,
  oi as isStrictTimeframe,
  gt as isSupportedReplayEngineVersion,
  Td as lineToBytes,
  Ld as loadExecutionCase,
  Jd as loadMaterializedReplayCase,
  tl as loadReplayCase,
  md as makeSyntheticCandles,
  la as materializeReplayAnalysis,
  cf as materializeReplayAnalysisAt,
  Of as materializedAnalysisKnownEvents,
  kf as materializedStateToReplayObservation,
  Va as mergeLiveCandle,
  Qr as normalizeOhlcvPoint,
  ld as normalizeRestTimeframe,
  jr as packHistoricalCandles,
  Ul as parseExecutionJsonHistoricalDataFixture,
  Zu as parseReplayAnalysisJsonDataFixture,
  Af as parseReplayJsonHistoricalDataFixture,
  ud as prependHistoricalCandles,
  wi as radarEpisodeObservationId,
  Ei as radarSelectionProfileHash,
  ho as radarStructureObservationId,
  Pu as reconstructExecutionSessionFromEvents,
  Zf as reconstructReplaySession,
  ym as redactTrainerSafeDescriptor,
  Yu as replayAnalysisAvwapDecisionState,
  mf as replayAnalysisCacheKey,
  Kd as replayAnalysisCacheSize,
  ca as replayAnalysisProfileHash,
  Ku as replayAnalysisRelativeStrengthDecisionState,
  df as replayAnalysisRequiredCoverage,
  pt as replayAnalysisStateObservationId,
  Xu as replayAnalysisSupportResistanceReferences,
  ht as replayCandleLogicalId,
  Nn as replayCandleObservationId,
  Ao as replayCaseManifestId,
  Od as replayDataFingerprintAt,
  _i as replayKnownEventId,
  Ni as replaySessionConfigHash,
  tn as replaySha256,
  am as resumeReplaySession,
  Hd as revealExecutionOutcome,
  Pd as scanRadarEpisodes,
  ct as selectCompletedCandleRevisionsAt,
  un as selectReplayRecordsAt,
  vm as selectTrainerCases,
  Vd as serializeExecutionSession,
  uf as serializeReplayAnalysisSession,
  om as serializeReplaySession,
  Bd as simulateExecutionToHorizon,
  On as strategyProfileHash,
  _ as strictTimeframeToSeconds,
  st as timeframeToSeconds,
  Fi as tradePlanId,
  _a as trainerCaseBundleFingerprint,
  dt as universeMembershipObservationId,
  Gi as validateExecutionSessionIntegrity,
  Hn as validateReplayAnalysisSession,
  ad as validateTrainerCaseBundle,
  Hi as venueExecutionRulesHash
};
