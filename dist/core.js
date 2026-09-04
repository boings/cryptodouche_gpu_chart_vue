var Ma = Object.defineProperty;
var ir = (e) => {
  throw TypeError(e);
};
var Fa = (e, n, t) => n in e ? Ma(e, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[n] = t;
var ge = (e, n, t) => Fa(e, typeof n != "symbol" ? n + "" : n, t), Rt = (e, n, t) => n.has(e) || ir("Cannot " + t);
var R = (e, n, t) => (Rt(e, n, "read from private field"), t ? t.call(e) : n.get(e)), Z = (e, n, t) => n.has(e) ? ir("Cannot add the same private member more than once") : n instanceof WeakSet ? n.add(e) : n.set(e, t), te = (e, n, t, i) => (Rt(e, n, "write to private field"), i ? i.call(e, t) : n.set(e, t), t), J = (e, n, t) => (Rt(e, n, "access private method"), t);
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
function T(e) {
  const n = new TextEncoder().encode(S(e));
  let t = 0xcbf29ce484222325n;
  for (const i of n)
    t ^= BigInt(i), t = BigInt.asUintN(64, t * 0x100000001b3n);
  return `fnv1a64:${t.toString(16).padStart(16, "0")}`;
}
function h(e) {
  return qr(JSON.parse(S(e)));
}
function qr(e) {
  if (e && typeof e == "object") {
    for (const n of Object.values(e)) qr(n);
    Object.freeze(e);
  }
  return e;
}
const rr = 5;
function at(e) {
  const n = String(e).trim().toLowerCase();
  return n.endsWith("m") ? parseInt(n, 10) * 60 : n.endsWith("h") ? parseInt(n, 10) * 60 * 60 : n.endsWith("d") ? parseInt(n, 10) * 24 * 60 * 60 : parseInt(n, 10) * 60;
}
function ri(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const n = Number.parseInt(e, 10), t = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(n) && Number.isSafeInteger(n * t);
}
function _(e) {
  if (!ri(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return at(e);
}
function He(e, n) {
  return e.knownAt ?? e.bucket + _(n);
}
function st(e, n, t) {
  const i = _(n), r = /* @__PURE__ */ new Map(), o = e.filter((a) => {
    if (!Number.isFinite(a.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (a.bucket + i > t) return !1;
    if (a.knownAt != null && !Number.isFinite(a.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${a.bucket}`);
    return He(a, n) <= t;
  });
  for (const a of [...o].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!Qa(a) || a.bucket % i !== 0 || Math.floor(a.ts / i) * i !== a.bucket)
      throw new RangeError(`Invalid candle for bucket ${a.bucket}`);
    const s = He(a, n);
    if (s < a.bucket + i)
      throw new RangeError(`Candle revision predates close for bucket ${a.bucket}`);
    const c = r.get(a.bucket);
    if (c) {
      const l = He(c, n);
      if (l === s && sr(c, n) !== sr(a, n))
        throw new Error(`Conflicting candle revisions for bucket ${a.bucket} at ${s}`);
      if (l > s) continue;
    }
    r.set(a.bucket, a);
  }
  return [...r.values()].sort((a, s) => a.bucket - s.bucket);
}
function Zf(e) {
  const n = String(e).trim().toLowerCase();
  return n === "60" ? "1h" : n.endsWith("m") || n.endsWith("h") || n.endsWith("d") ? n : `${n}m`;
}
function tn(e, n) {
  return Math.floor(e / n) * n;
}
function zr(e) {
  const n = Gr(e);
  if (!n || typeof n != "object") return null;
  const t = n, i = ar(t.ts), r = me(t.o), o = me(t.h), a = me(t.l), s = me(t.c), c = t.knownAt == null ? void 0 : ar(t.knownAt);
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
function Qr(e, n, t) {
  const i = at(n), r = Ba(
    e.map((s, c) => jr(s, c)).filter((s) => s != null),
    i
  ).slice(-Math.max(1, t));
  if (!r.length)
    return {
      timeframeSec: i,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const o = tn(r[0].ts, i), a = r.map((s) => {
    const c = tn(s.ts, i);
    return {
      ...s,
      bucket: c,
      x: (c - o) / i
    };
  });
  return oi({
    timeframeSec: i,
    firstBucket: o,
    candles: a,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Jf(e, n, t) {
  const i = e.candles.length, r = n.map((a, s) => jr(a, s)).filter((a) => a != null).filter((a) => tn(a.ts, e.timeframeSec) < e.firstBucket).sort(Wr);
  if (!r.length) return 0;
  const o = Qr(
    [...r, ...e.candles],
    t,
    r.length + e.candles.length
  );
  return e.timeframeSec = o.timeframeSec, e.firstBucket = o.firstBucket, e.candles = o.candles, e.positionByBucket = o.positionByBucket, Math.max(0, e.candles.length - i);
}
function La(e) {
  const n = new Float32Array(e.length * rr);
  return e.forEach((t, i) => {
    n.set([t.x, t.o, t.h, t.l, t.c], i * rr);
  }), new Uint8Array(n.buffer);
}
function or(e) {
  const n = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(n.buffer);
}
function ed(e) {
  if (e.length < 2) return null;
  const n = e[e.length - 2], t = e[e.length - 1];
  return !Number.isFinite(n.c) || !Number.isFinite(t.c) || n.c === 0 ? null : (t.c - n.c) / Math.abs(n.c) * 100;
}
function Da(e, n, t, i = 3) {
  const r = zr(n);
  if (!r) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const o = tn(r.ts, e.timeframeSec);
  if (o < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const a = e.positionByBucket.get(o), s = (o - e.firstBucket) / e.timeframeSec, c = { ...r, bucket: o, x: s };
  if (a != null)
    return za(c, e.candles[a]) ? { kind: "ignore", reason: "stale-version" } : qa(e.candles[a], c) ? (e.candles[a] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[a] = c, {
      kind: "replace",
      position: a,
      bytes: or(c)
    });
  const l = e.candles[e.candles.length - 1];
  return o <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (o - l.bucket) / e.timeframeSec > i ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, t) ? (e.candles.splice(0, e.candles.length - Math.max(1, t)), Ha(e), { kind: "reset", bytes: La(e.candles) }) : (oi(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: or(c)
  }));
}
function nd(e, n = []) {
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
function td(e, n, t) {
  const i = at(t), r = Math.floor(Date.now() / 1e3), o = tn(r, i), a = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), s = [];
  let c = 40 + a % 160;
  for (let l = Math.max(1, n) - 1; l >= 0; l--) {
    const u = o - l * i, f = Math.sin((n - l + a) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((n - l) / 13) * 0.35), v = Math.max(d, m) + 0.35 + Math.abs(Math.sin(l + a)) * 0.5, p = Math.min(d, m) - 0.35 - Math.abs(Math.cos(l + a)) * 0.5, y = 50 + a % 90 + Math.abs(Math.sin((n - l + a) / 5)) * 180;
    s.push({ ts: u, o: d, h: v, l: p, c: m, v_base: y, v_quote: y * m }), c = m;
  }
  return Qr(s, t, n);
}
function id(e, n) {
  const t = e.candles[e.candles.length - 1];
  if (!t) return { kind: "ignore", reason: "empty-history" };
  const i = t.bucket + e.timeframeSec, r = Math.sin(i / 600) * 0.7, o = t.c, a = Math.max(1e-4, o + r), s = Math.max(o, a) + 0.5, c = Math.min(o, a) - 0.5, l = Math.max(1, (t.v_base ?? 100) * (0.82 + Math.abs(r) * 0.36));
  return Da(e, { ts: i, o, h: s, l: c, c: a, v_base: l, v_quote: l * a }, n);
}
function Ha(e) {
  const n = e.candles[0];
  e.firstBucket = n ? n.bucket : 0;
  for (const t of e.candles)
    t.x = (t.bucket - e.firstBucket) / e.timeframeSec;
  oi(e);
}
function oi(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((n, t) => {
    e.positionByBucket.set(n.bucket, t);
  }), e;
}
function jr(e, n) {
  const t = zr(e);
  return t ? { ...t, sourceOrder: n } : null;
}
function Ba(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = tn(i.ts, n), o = t.get(r);
    (!o || Wr(i, o) > 0) && t.set(r, i);
  }
  return Array.from(t.entries()).sort(([i], [r]) => i - r).map(([, i]) => Va(i));
}
function Wr(e, n) {
  const t = e.ver ?? Number.NEGATIVE_INFINITY, i = n.ver ?? Number.NEGATIVE_INFINITY;
  return t !== i ? t - i : e.ts !== n.ts ? e.ts - n.ts : e.sourceOrder - n.sourceOrder;
}
function Va(e) {
  const { sourceOrder: n, ...t } = e;
  return t;
}
function ar(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const n = Date.parse(e);
    return Number.isNaN(n) ? null : Math.floor(n / 1e3);
  }
  if (Array.isArray(e)) {
    const n = e.length >= 9 ? $a(e) : Ua(e);
    return Number.isNaN(n) ? null : Math.floor(n / 1e3);
  }
  return null;
}
function $a(e) {
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
function Ua(e) {
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
function qa(e, n) {
  return e.o === n.o && e.h === n.h && e.l === n.l && e.c === n.c && Object.is(e.v_base, n.v_base) && Object.is(e.v_quote, n.v_quote);
}
function za(e, n) {
  return e.ver == null || n.ver == null ? !1 : e.ver < n.ver;
}
function me(e) {
  const n = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(n) ? n : void 0;
}
function Qa(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && Vn(e.o) && Vn(e.h) && Vn(e.l) && Vn(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && $n(e.v_base) && $n(e.v_quote) && $n(e.ver) && $n(e.knownAt);
}
function sr(e, n) {
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
    knownAt: He(e, n)
  });
}
function Vn(e) {
  return Number.isFinite(e) && e > 0;
}
function $n(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Gr(e) {
  if (typeof e == "string")
    try {
      return Gr(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const n = e.data;
    if (n && typeof n == "object") return n;
  }
  return e;
}
const xe = "impulse_fade_v1", fe = "impulse_fade_v1.lifecycle.1", ja = "impulse_fade_v1.lifecycle-config.1", yn = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function rd(e, n = 20) {
  if (e.length < n) return new Float32Array();
  const t = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.c, o >= n && (i -= e[o - n].c), o >= n - 1 && t.push(r.x, i / n);
  }), new Float32Array(t);
}
function Wa(e, n = 20) {
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
function od(e, n = 20) {
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
function ad(e, n = 20, t = 2) {
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
function sd(e, n = 14) {
  return Ve(co(e, n));
}
function Ga(e, n = 14, t = 14, i = 3, r = 3) {
  const o = co(e, n), a = $e(t);
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
  const c = mr(s, $e(i)), l = mr(c, $e(r));
  return {
    k: Ve(c),
    d: Ve(l)
  };
}
function cd(e, n = 12, t = 26, i = 9) {
  const r = $t(e, n), o = $t(e, t), a = [];
  for (let u = 0; u < e.length; u++) {
    const f = r[u], d = o[u];
    f == null || d == null || a.push({ x: e[u].x, value: f - d });
  }
  const s = Ys(a, i), c = new Map(a.map((u) => [u.x, u.value])), l = s.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: Ve(a),
    signal: Ve(s),
    histogram: Ve(l)
  };
}
function Ya(e, n = 14) {
  const t = ut(e, n), i = [];
  return t.forEach((r, o) => {
    r != null && i.push({ x: e[o].x, value: r });
  }), Ve(i);
}
function qe(e, n = {}) {
  const t = D(n.windowSeconds, 60, 2592e3, 86400), i = D(n.historyDays, 1, 365, 180), r = D(n.minSamples, 1, 5e3, 20), o = D(n.emaPeriod, 2, 500, 20), a = D(n.atrPeriod, 2, 500, 14), s = ao(e);
  if (!s)
    return ks(t);
  const c = e.indexOf(s), l = so(e, s.bucket - t, c), u = l && K(l.c) ? (s.c / l.c - 1) * 100 : null, f = u == null ? [] : Os(e, {
    windowSeconds: t,
    earliestBucket: s.bucket - i * 86400,
    excludeBucket: s.bucket
  }), d = u != null && f.length >= r ? Ns(f, u) : null, m = u != null && f.length >= r ? _s(f, u) : null, v = $t(e, o)[c] ?? null, p = ut(e, a)[c] ?? null, y = v != null && p != null && Number.isFinite(v) && Number.isFinite(p) && p > 0 ? (s.c - v) / p : null;
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
function Ka(e = {}) {
  var j, q, M;
  const n = e.executionTimeframe ?? "chart", t = I(e.asOf), i = I(e.latestTs) ?? ps(e.candles ?? [], n) ?? I((j = e.structure) == null ? void 0 : j.updatedTs) ?? I((q = e.marketStructure) == null ? void 0 : q.summary.updatedTs) ?? null, r = t ?? i, o = r == null ? null : fi(e.candles ?? [], r, n), a = (o == null ? void 0 : o.candle.c) ?? I(e.latestPrice), s = Xa(e.marketStructure ?? null, t), c = (s == null ? void 0 : s.summary) ?? Za(e.structure, t), l = e.htfStructures ?? [], u = t == null ? e.htfStructures ?? [] : si(e.htfStructures ?? [], t), f = (e.srZones ?? []).filter(
    (L) => t == null || V(L) <= t
  ), d = (e.rsDivergences ?? []).filter(
    (L) => t == null || V(L) <= t
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (L) => t == null || V(L) <= t
  ), v = G(e.resistanceNearPct, 0, 10, 1.5), p = G(e.retestNearPct, 0, 10, 0.8), y = ws(e.extension ?? null), g = Es(f, a, v), w = Ts(d), E = Rs(c), O = Ss(
    m,
    e.avwapDistancePct
  ), P = Cs(c, f, a, p), b = xs(y, g, c, a), A = [
    y,
    g,
    w,
    E,
    O,
    P
  ], C = {
    checks: A,
    asOf: r,
    updatedTs: i,
    executionTimeframe: n,
    lifecycleConfigHash: e.lifecycleConfigHash ?? sn({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, k = cs({
    extension: y,
    htfResistance: g,
    htfStructures: u,
    rsWeakness: w,
    structureShift: E,
    avwapFailure: O,
    retest: P,
    invalidated: b
  });
  return (M = e.candles) != null && M.length && r != null ? ns({
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
  }) : no({
    ...C,
    state: k,
    reason: Is(k, A),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function Xa(e, n) {
  var o;
  if (!e || n == null) return e;
  const t = e.swings.filter((a) => a.knownAt <= n), i = e.breaks.filter((a) => a.knownAt <= n), r = ((o = Pe(i)) == null ? void 0 : o.direction) ?? "neutral";
  return {
    swings: t,
    breaks: i,
    trend: r,
    summary: mi(t, i, r)
  };
}
function Za(e, n) {
  if (!e || n == null) return e ?? null;
  const t = I(e.updatedTs);
  return t == null || t <= n ? e : null;
}
function ld(e) {
  return Ja(e).records;
}
function sn(e = {}) {
  var n, t, i, r, o, a, s, c, l, u, f;
  return T({
    lifecycleVersion: fe,
    lifecycleConfigVersion: ja,
    candidateGate: yn,
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
function Yr(e) {
  var s;
  const n = Zr(e), t = Pe(n);
  if (t == null) return null;
  const i = Xr(e, t), r = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], a = new Set(
    o.map((c) => _e(c, e.executionTimeframe)).filter((c) => c <= t)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && V(c) <= t && a.add(V(c));
  for (const c of [...a].sort((l, u) => l - u))
    ai(
      ct(o, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (s = e.config) == null ? void 0 : s.marketStructureOptions,
      c,
      r
    );
  return Kr(
    e,
    t,
    r,
    i
  );
}
function Ja(e) {
  const n = e.executionTimeframe, t = e.candlesByTimeframe[n] ?? [], i = e.config ?? {}, r = sn(i), o = Zr(e), a = Xr(
    e,
    Pe(o) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = I(e.from) ?? -1 / 0;
  let f = null;
  return { records: o.map((m) => {
    var E, O, P, b, A;
    const v = Kr(
      e,
      m,
      s,
      a
    ), p = Jr(e.candidateMetrics, m), y = (p == null ? void 0 : p.metrics) ?? ui(
      qe(
        ct(t, n, m),
        i.extensionOptions
      )
    );
    f = v;
    const g = v.evidence.filter((C) => c.has(C.id) ? !1 : (c.add(C.id), C.knownAt >= u)), w = v.transitions.filter((C) => {
      const k = es(C);
      return l.has(k) ? !1 : (l.add(k), C.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: xe,
      lifecycleVersion: fe,
      lifecycleConfigHash: r,
      candidateGatePassed: En(y),
      candidateId: ((E = v.candidate) == null ? void 0 : E.id) ?? null,
      candidateDetectedAt: ((O = v.candidate) == null ? void 0 : O.detectedAt) ?? null,
      initialMtfContext: ((P = v.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: Pe(w) ?? null,
      transitions: w,
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
function Kr(e, n, t, i) {
  const r = e.executionTimeframe, o = e.candlesByTimeframe[r] ?? [], a = e.config ?? {}, s = sn(a), c = ct(o, r, n), l = qe(c, a.extensionOptions), u = Jr(e.candidateMetrics, n), f = (u == null ? void 0 : u.metrics) ?? ui(l), d = ai(
    c,
    r,
    e.structureEvents ?? [],
    a.marketStructureOptions,
    n,
    t
  ), m = i.filter(
    (p) => (p.summary.updatedTs ?? 0) <= n
  ), v = Pe(c) ?? null;
  return Ka({
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
function Xr(e, n) {
  return Object.entries(e.candlesByTimeframe).filter(([t]) => t !== e.executionTimeframe).flatMap(([t, i]) => {
    const r = new Set(
      i.map((o) => _e(o, t)).filter((o) => o <= n)
    );
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === t && V(o) <= n && r.add(V(o));
    return [...r].sort((o, a) => o - a).map((o) => {
      var s;
      const a = ai(
        ct(i, t, o),
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
const ud = "openTime";
function _e(e, n) {
  return (I(e.bucket) ?? I(e.ts) ?? 0) + Math.max(1, at(n));
}
function ct(e, n, t) {
  return st(e, n, t);
}
function Zr(e) {
  const n = /* @__PURE__ */ new Set();
  for (const [o, a] of Object.entries(e.candlesByTimeframe))
    for (const s of a)
      n.add(s.knownAt ?? _e(s, o));
  for (const o of e.candidateMetrics ?? [])
    n.add(I(o.knownAt) ?? o.asOf);
  for (const o of e.structureEvents ?? []) n.add(V(o));
  for (const o of e.avwapEvents ?? []) n.add(V(o));
  for (const o of e.relativeStrengthEvents ?? []) n.add(V(o));
  for (const o of e.supportResistanceZones ?? []) n.add(V(o));
  for (const o of e.evaluationPoints ?? []) {
    const a = I(o);
    a != null && n.add(a);
  }
  const t = [...n].filter(Number.isFinite).sort((o, a) => o - a), i = I(e.from) ?? t[0] ?? 0, r = I(e.to) ?? Pe(t) ?? i;
  return n.add(i), n.add(r), [...n].filter((o) => Number.isFinite(o) && o >= i && o <= r).sort((o, a) => o - a);
}
function Jr(e, n) {
  return Pe([...e ?? []].filter((t) => (I(t.knownAt) ?? t.asOf) <= n).sort(
    (t, i) => (I(t.knownAt) ?? t.asOf) - (I(i.knownAt) ?? i.asOf) || t.asOf - i.asOf
  )) ?? null;
}
function ai(e, n, t, i, r, o) {
  var f;
  const a = Be(e, i), s = t.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === n) && V(d) <= r
  ), c = o ?? /* @__PURE__ */ new Map();
  for (const d of [...a.breaks, ...s])
    c.set(
      Se(
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
  const u = ((f = Pe(l)) == null ? void 0 : f.direction) ?? a.trend;
  return {
    swings: a.swings,
    breaks: l,
    trend: u,
    summary: mi(a.swings, l, u)
  };
}
function es(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function ns(e) {
  const n = e.candles ?? [], t = e.extensionOptions ?? {}, i = ts(
    n,
    t,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), r = vs(i, t);
  let o = is(i, e);
  if (!o && En(e.extension ?? null)) {
    const a = fi(n, e.asOf, e.executionTimeframe);
    a && (o = {
      index: a.index,
      candle: a.candle,
      eventTime: de(a.candle),
      knownAt: Math.min(
        e.asOf,
        Te(n, a.index, e.executionTimeframe)
      ),
      metrics: li(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, r.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return o ? eo(o, e, e.asOf, r) : no({
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
function ts(e, n, t, i, r) {
  if (r != null && r.length)
    return [...r].map((a) => {
      const s = I(a.knownAt) ?? a.asOf, c = fi(e, s, i);
      if (!c || s > t) return null;
      const l = I(a.eventTime) ?? de(c.candle), u = li(a.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: s,
        metrics: u,
        pass: En(u),
        rollingReturnCount: Math.max(0, Math.trunc(a.sampleCount ?? 0))
      };
    }).filter((a) => a != null).sort((a, s) => a.knownAt - s.knownAt || a.eventTime - s.eventTime);
  const o = [];
  for (let a = 0; a < e.length; a += 1) {
    const s = e[a], c = Te(e, a, i);
    if (c > t) continue;
    const l = qe(e.slice(0, a + 1), n), u = ui(l);
    o.push({
      index: a,
      candle: s,
      eventTime: de(s),
      knownAt: c,
      metrics: u,
      pass: En(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return o;
}
function is(e, n) {
  var o;
  const t = [];
  let i = !1;
  for (const a of e)
    a.pass && !i && t.push(a), i = a.pass;
  if (!t.length) return null;
  let r = t[0];
  for (const a of t.slice(1)) {
    const c = ((o = eo(r, n, a.knownAt, []).candidate) == null ? void 0 : o.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < a.knownAt && !l.pass) && (r = a);
  }
  return r;
}
function eo(e, n, t, i) {
  const r = (n.symbol ?? "UNKNOWN").toUpperCase(), o = n.source ?? "chart", a = n.venue ?? "", s = n.executionTimeframe, c = si(
    n.htfStructures ?? [],
    e.knownAt
  ).map((A) => ({
    timeframe: A.timeframe,
    state: A.summary.state,
    trend: A.summary.trend,
    transitionDirection: A.summary.transitionDirection,
    updatedTs: A.summary.updatedTs
  })), l = hs({
    setupFamily: xe,
    symbol: r,
    source: o,
    venue: a,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), u = [
    {
      id: Se("candidate_detected", s, e.eventTime, e.knownAt),
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
  ], d = as(n, e, t), m = rs(e, n, t);
  let v = "developing", p = e.knownAt, y = null, g = null, w = null, E = null, O = null;
  for (const A of m) {
    if (y != null) break;
    if (!(A.knownAt < e.knownAt || A.knownAt > t)) {
      if (A.lifecycleKind === "deterioration") {
        u.push({ ...A, contributesTo: "deteriorating" }), v === "developing" && (f.push(fn(v, "deteriorating", A)), v = "deteriorating", p = A.knownAt);
        continue;
      }
      if (A.lifecycleKind === "bearishBreak") {
        u.push({ ...A, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (f.push(fn(v, "waitingForRetest", A)), v = "waitingForRetest", p = A.knownAt, g = A.breakLevel ?? null);
        continue;
      }
      if (A.lifecycleKind === "retest") {
        v === "waitingForRetest" && g && A.relatedEventId === g.evidenceId && A.knownAt > g.knownAt && (u.push({ ...A, contributesTo: "entryCandidate" }), f.push(fn(v, "entryCandidate", A)), v = "entryCandidate", p = A.knownAt, w = A.breakLevel ?? g);
        continue;
      }
      if (A.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (u.push({ ...A, contributesTo: "invalidated" }), f.push(fn(v, "invalidated", A)), v = "invalidated", p = A.knownAt, y = A.knownAt, E = A.explanation);
        continue;
      }
      A.lifecycleKind === "expiry" && v !== "entryCandidate" && (u.push({ ...A, contributesTo: "expired" }), f.push(fn(v, "expired", A)), v = "expired", p = A.knownAt, y = A.knownAt, O = A.explanation);
    }
  }
  const P = oo(
    n.candles ?? [],
    e.eventTime,
    t,
    s
  ), b = {
    id: l,
    setupFamily: xe,
    lifecycleVersion: fe,
    lifecycleConfigHash: n.lifecycleConfigHash ?? sn({
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
    episodeHigh: (P == null ? void 0 : P.price) ?? null,
    episodeHighTime: (P == null ? void 0 : P.eventTime) ?? null,
    currentState: v,
    stateSince: p,
    terminalAt: y
  };
  return {
    strategy: "pumpFade",
    setupFamily: xe,
    lifecycleVersion: fe,
    lifecycleConfigHash: b.lifecycleConfigHash,
    asOf: t,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: p,
    label: lt(v),
    reason: ys(v, u, f, E, O),
    checks: n.checks,
    updatedTs: t,
    candidate: b,
    evidence: u.sort((A, C) => A.knownAt - C.knownAt || A.eventTime - C.eventTime),
    transitions: f,
    pendingConditions: ro(v, g),
    activeBreakLevel: g,
    retestLevel: w,
    confluence: d,
    invalidationReason: E,
    expiryReason: O,
    dataQuality: i
  };
}
function rs(e, n, t) {
  const i = [], r = n.executionTimeframe;
  for (const l of n.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = V(l);
    if (!hn(l, e, t)) continue;
    const f = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    i.push({
      id: Se(f, r, l.eventTime, u, l.x),
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
    l.kind !== "failedReclaim" || !hn(l, e, t) || i.push({
      id: Se("avwap_failed_reclaim", r, l.eventTime, u, l.x),
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
  const o = ss(n), a = [];
  for (const l of o) {
    const u = V(l);
    if (l.direction !== "bearish" || !hn(l, e, t)) continue;
    const f = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = Se(f, r, l.eventTime, u, l.x), m = {
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
    const u = os(e, l, n, t);
    u && i.push(u);
  }
  for (const l of o) {
    const u = V(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !hn(l, e, t))
      continue;
    const f = (n.candles ?? [])[l.index], d = oo(
      n.candles ?? [],
      e.eventTime,
      u - 1,
      r
    ), m = G(n.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || i.push({
      id: Se("bullish_continuation_invalidation", r, l.eventTime, u, l.x),
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
    id: Se("candidate_expired", r, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${bs(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: r,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), i.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function os(e, n, t, i) {
  var u;
  const r = t.candles ?? [], o = n.breakLevel;
  if (!o || !Number.isFinite(o.level)) return null;
  const a = G(t.retestToleranceBps, 0, 1e3, 35), s = G(t.retestToleranceAtr, 0, 10, 0.25), c = D((u = t.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = ut(r, c);
  for (let f = 0; f < r.length; f += 1) {
    const d = r[f], m = Te(r, f, t.executionTimeframe), v = de(d);
    if (m <= n.knownAt || v < n.knownAt || v < e.knownAt || m > i)
      continue;
    const p = l[f] ?? 0, y = Math.max(
      o.level * (a / 1e4),
      Number.isFinite(p) ? p * s : 0
    );
    if (d.h >= o.level - y && d.l <= o.level + y && d.c < o.level && d.c <= d.o)
      return {
        id: Se(
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
function as(e, n, t) {
  const i = [], r = di(
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
    (s) => s.kind === "loss" && hn(s, n, t)
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
  const a = I(e.avwapDistancePct);
  a != null && i.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${gn(a, 1)}% from AVWAP`,
    value: a,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of si(e.htfStructures, t))
    s.summary.state !== "neutral" && i.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: As(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return i;
}
function si(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = I(i.summary.updatedTs);
    if (r != null && r > n) continue;
    const o = t.get(i.timeframe), a = I(o == null ? void 0 : o.summary.updatedTs) ?? -1 / 0;
    (!o || (r ?? -1 / 0) >= a) && t.set(i.timeframe, i);
  }
  return [...t.values()];
}
function ss(e) {
  var i, r, o;
  const n = (r = (i = e.marketStructure) == null ? void 0 : i.breaks) != null && r.length ? e.marketStructure.breaks : (o = e.structure) != null && o.lastBreak ? [e.structure.lastBreak] : [], t = /* @__PURE__ */ new Set();
  return n.filter((a) => {
    const s = `${a.kind}:${a.direction}:${a.x}:${a.level}:${V(a)}`;
    return t.has(s) ? !1 : (t.add(s), !0);
  });
}
function cs(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && cr(e.htfResistance, e.htfStructures) ? "deteriorating" : cr(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function no(e) {
  return {
    strategy: "pumpFade",
    setupFamily: xe,
    lifecycleVersion: fe,
    lifecycleConfigHash: e.lifecycleConfigHash ?? sn(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: lt(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: ro(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function ci(e, n = {}) {
  const t = Ms(e, n);
  if (t == null) return new Float32Array();
  const i = [];
  let r = 0, o = 0;
  for (let a = t; a < e.length; a += 1) {
    const s = e[a];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!K(c)) continue;
    const l = Fs(s, c);
    l <= 0 || (r += l, o += c * l, i.push(s.x, o / r));
  }
  return new Float32Array(i);
}
function ls(e, n = {}) {
  const t = I(n.anchorBucket), i = I(n.anchorX), r = ci(e, n);
  if (r.length < 2)
    return {
      anchorBucket: t,
      anchorX: i,
      value: null,
      distancePct: null,
      candle: null
    };
  const o = r[r.length - 1], a = ao(e), s = a && K(o) ? (a.c - o) / o * 100 : null;
  return {
    anchorBucket: t,
    anchorX: i,
    value: o,
    distancePct: s,
    candle: a
  };
}
function us(e, n = {}, t = 20) {
  const i = D(t, 1, 200, 20), r = ci(e, n);
  if (r.length < 4) return [];
  const o = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), a = [];
  let s = null;
  for (let c = 0; c < r.length; c += 2) {
    const l = r[c], u = r[c + 1], f = o.get(l);
    if (!f || !K(u) || !K(f.candle.c)) continue;
    const d = Te(e, f.index), m = f.candle.c > u ? "above" : f.candle.c < u ? "below" : null;
    m && (s === "above" && m === "below" ? a.push(St("loss", f.index, f.candle, u, d)) : s === "below" && m === "above" ? a.push(St("reclaim", f.index, f.candle, u, d)) : s === "below" && m === "below" && f.candle.h >= u && f.candle.c < u && a.push(
      St("failedReclaim", f.index, f.candle, u, d)
    ), s = m);
  }
  return a.slice(-i);
}
function fs(e, n = {}) {
  const t = D(n.lookback, 20, 2e3, 500), i = D(n.pivotStrength, 1, 20, 3), r = D(n.atrPeriod, 2, 100, 14), o = G(n.minMoveAtr, 0, 10, 0.75), a = D(n.maxSwings, 1, 500, 120), s = Math.max(0, e.length - t), c = e.slice(s);
  if (c.length < i * 2 + 1) return [];
  const l = ut(e, r), u = [];
  for (let d = i; d < c.length - i; d += 1) {
    const m = c[d], v = s + d, p = l[v] ?? null, y = Te(e, v + i);
    Qs(c, d, i) && u.push(lr("SwingHigh", v, m, m.h, p, y)), js(c, d, i) && u.push(lr("SwingLow", v, m, m.l, p, y));
  }
  const f = [];
  for (const d of u) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      $s(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= Us(d, m, o) && f.push(d);
  }
  return Ls(f).slice(-a);
}
function Be(e, n = {}) {
  const t = D(n.maxSwings, 1, 500, 120), i = D(n.maxBreaks, 1, 200, 24), r = fs(e, {
    ...n,
    maxSwings: Math.max(t, i * 4)
  }), o = [], a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, f = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const p = Te(e, v);
    for (; c < r.length && r[c].index < v && r[c].knownAt <= p; ) {
      const g = r[c];
      g.kind === "SwingHigh" ? l = g : u = g, c += 1;
    }
    const y = e[v];
    if (l && !a.has(l.x) && y.c > l.price) {
      const g = f === "bearish" ? "StructureShift" : "StructureBreak";
      o.push(ur(g, "bullish", v, y, l, p)), a.add(l.x), f = "bullish";
    }
    if (u && !s.has(u.x) && y.c < u.price) {
      const g = f === "bullish" ? "StructureShift" : "StructureBreak";
      o.push(ur(g, "bearish", v, y, u, p)), s.add(u.x), f = "bearish";
    }
  }
  const d = r.slice(-t), m = o.slice(-i);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: mi(d, m, f)
  };
}
function ds(e) {
  var r;
  const { swings: n, summary: t } = e;
  if (!n.length || t.state === "neutral") return [];
  if (t.state === "range")
    return [
      dr(n, "SwingHigh", "rangeHigh", null, !0),
      dr(n, "SwingLow", "rangeLow", null, !1)
    ].filter((o) => !!o);
  const i = t.state === "transitional" ? t.transitionDirection ?? ((r = t.lastBreak) == null ? void 0 : r.direction) ?? e.trend : t.state;
  return i === "bullish" ? [
    qn(
      n,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    qn(
      n,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((o) => !!o) : i === "bearish" ? [
    qn(
      n,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    qn(
      n,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((o) => !!o) : [];
}
function fd(e, n = {}) {
  var c, l;
  const t = D(n.lookback, 20, 1e3, 240), i = D(n.pivotStrength, 1, 20, 3), r = D(n.maxZones, 1, 12, 6), o = G(n.thicknessBps, 1, 100, 10), a = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = Be(e, {
    lookback: t,
    pivotStrength: i,
    atrPeriod: n.atrPeriod,
    minMoveAtr: n.minMoveAtr ?? 0,
    maxSwings: Math.min(500, t),
    maxBreaks: 24
  });
  return to(s.swings, {
    maxZones: r,
    thicknessBps: o,
    latestX: a,
    referencePrice: n.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: n.zonesPerSide
  });
}
function to(e, n = {}) {
  var l;
  const t = D(n.maxZones, 1, 12, 6), i = G(n.thicknessBps, 1, 100, 10), r = n.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, o = I(n.referencePrice), a = n.zonesPerSide == null ? null : D(n.zonesPerSide, 1, 12, 3), s = [];
  for (const u of e)
    qs(
      s,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      r - u.x + 1,
      i
    );
  const c = s.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, f) => f.score - u.score || f.touches - u.touches || f.lastX - u.lastX).slice(0, Math.max(t * 2, t));
  return zs(c, t, o, a);
}
function io(e, n) {
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
function ms(e, n, t = {}) {
  var P;
  const i = D(t.maxDivergences, 1, 100, 16), r = G(t.minDeltaPct, 0, 50, 0.5), o = D(
    t.maxAgeBars,
    1,
    2e3,
    t.lookback ?? 240
  ), a = t.includeDivergences ?? !0, s = t.includeLeads ?? !0, c = t.includeBreaks ?? !0, l = io(e, n), u = Gs(l);
  if (!e.length || u.size < 2) return [];
  const d = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - o, m = {
    ...t,
    maxSwings: Math.max(t.maxSwings ?? 120, i * 4),
    maxBreaks: Math.max(t.maxBreaks ?? 24, i * 2)
  }, v = Be(e, {
    ...m
  }), p = Hs(e, l), y = Be(p, {
    ...m
  }), g = new Map(e.map((b, A) => [b.x, { candle: b, index: A }])), w = [];
  let E = null, O = null;
  for (const b of v.swings) {
    const A = u.get(b.x);
    if (!(A == null || !Number.isFinite(A))) {
      if (b.kind === "SwingHigh") {
        if (E) {
          const C = u.get(E.x);
          C != null && Number.isFinite(C) && (b.price > E.price && A <= C - r ? a && w.push(
            Un(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              b,
              E,
              A,
              C,
              v.summary.state,
              y.summary.state
            )
          ) : b.price < E.price && A >= C + r && s && w.push(
            Un(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              b,
              E,
              A,
              C,
              v.summary.state,
              y.summary.state
            )
          ));
        }
        E = b;
        continue;
      }
      if (O) {
        const C = u.get(O.x);
        C != null && Number.isFinite(C) && (b.price > O.price && A <= C - r ? s && w.push(
          Un(
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
        ) : b.price < O.price && A >= C + r && a && w.push(
          Un(
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
      const k = Be(e.slice(0, A.index + 1), {
        ...m,
        maxBreaks: Math.max(8, t.maxBreaks ?? 24)
      });
      Bs(b.direction, k.summary.state) && w.push(
        Ds(
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
  return w.filter((b) => b.x >= d).sort((b, A) => b.x - A.x || fr(b.signal) - fr(A.signal)).slice(-i);
}
function dd(e) {
  return new Uint8Array(e.buffer);
}
function li(e) {
  return {
    returnPct: I(e == null ? void 0 : e.returnPct),
    percentile: I(e == null ? void 0 : e.percentile),
    zScore: I(e == null ? void 0 : e.zScore),
    atrExtension: I(e == null ? void 0 : e.atrExtension)
  };
}
function ui(e) {
  return {
    returnPct: I(e.returnPct),
    percentile: I(e.percentile),
    zScore: I(e.zScore),
    atrExtension: I(e.atrExtension)
  };
}
function En(e) {
  const n = li(e);
  return n.returnPct != null && n.returnPct >= yn.returnPct || n.percentile != null && n.percentile >= yn.percentile || n.zScore != null && n.zScore >= yn.zScore || n.atrExtension != null && n.atrExtension >= yn.atrExtension;
}
function vs(e, n) {
  const t = [], i = D(n.minSamples, 1, 1e4, 20), r = e[e.length - 1] ?? null;
  return r ? r.rollingReturnCount < i && t.push(
    `Rolling-return history has ${r.rollingReturnCount}/${i} samples for percentile and Z-score`
  ) : t.push("No candle history was available at the requested asOf time"), t;
}
function fn(e, n, t) {
  return {
    from: e,
    to: n,
    knownAt: t.knownAt,
    evidenceIds: [t.id],
    evidenceCodes: [t.code],
    explanation: t.explanation
  };
}
function ys(e, n, t, i, r) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return i ?? "Continuation invalidated the fade setup";
  if (e === "expired") return r ?? "Candidate expired before progressing";
  const o = t[t.length - 1];
  if (o && o.to === e) return o.explanation;
  const a = n.filter((c) => c.contributesTo === e), s = a[a.length - 1];
  return (s == null ? void 0 : s.explanation) ?? lt(e);
}
function ro(e, n) {
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
function hs(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((n) => String(n || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Se(e, n, t, i, r) {
  return [e, n, t, i, r ?? ""].map((o) => String(o).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function oo(e, n, t, i) {
  let r = null;
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], s = de(a);
    s < n || Te(e, o, i) > t || Number.isFinite(a.h) && (!r || a.h > r.price) && (r = { price: a.h, eventTime: s });
  }
  return r;
}
function ps(e, n) {
  return e.length ? Te(e, e.length - 1, n) : null;
}
function fi(e, n, t) {
  for (let i = e.length - 1; i >= 0; i -= 1)
    if (Te(e, i, t) <= n)
      return { candle: e[i], index: i };
  return null;
}
function de(e) {
  const n = I(e.ts);
  return n ?? I(e.bucket) ?? 0;
}
function Te(e, n, t) {
  const i = e[n];
  return i ? i.knownAt != null && Number.isFinite(i.knownAt) ? i.knownAt : t != null && String(t).trim() !== "chart" ? _e(i, t) : (I(i.bucket) ?? de(i)) + gs(e, n) : 0;
}
function gs(e, n) {
  var o, a, s;
  const t = I((o = e[n]) == null ? void 0 : o.bucket) ?? de(e[n]), i = I((a = e[n + 1]) == null ? void 0 : a.bucket);
  if (i != null && i > t) return i - t;
  const r = I((s = e[n - 1]) == null ? void 0 : s.bucket);
  return r != null && t > r ? t - r : 1;
}
function V(e) {
  return I(e.knownAt) ?? I(e.eventTime) ?? I(e.ts) ?? I(e.bucket) ?? 0;
}
function hn(e, n, t) {
  const i = V(e), r = I(e.eventTime) ?? I(e.ts) ?? I(e.bucket) ?? i;
  return i > n.knownAt && i <= t && r >= n.knownAt;
}
function As(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function bs(e) {
  const n = Math.max(0, Math.round(e));
  return n >= 86400 ? `${Math.round(n / 86400)}d` : n >= 3600 ? `${Math.round(n / 3600)}h` : n >= 60 ? `${Math.round(n / 60)}m` : `${n}s`;
}
function K(e) {
  return Number.isFinite(e) && e > 0;
}
function ws(e) {
  const n = I(e == null ? void 0 : e.returnPct), t = I(e == null ? void 0 : e.percentile), i = I(e == null ? void 0 : e.zScore), r = I(e == null ? void 0 : e.atrExtension), o = [
    n == null ? null : `24h ${gn(n, 1)}%`,
    r == null ? null : `Ext ${gn(r, 1)} ATR`,
    i == null ? null : `Z ${gn(i, 1)}`,
    t == null ? null : `Pctl ${Math.round(t)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: En({ returnPct: n, percentile: t, zScore: i, atrExtension: r }) ? "pass" : "pending",
    detail: o.join(" | ") || "No extension context yet"
  };
}
function Es(e, n, t) {
  const i = di(e, n, t);
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
function Ts(e) {
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
function Rs(e) {
  const n = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: n ? "pass" : "pending",
    detail: n ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Ss(e, n) {
  const t = [...e].reverse().find((o) => o.kind === "loss" || o.kind === "failedReclaim"), i = I(n);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!t || i != null && i <= -0.2 ? "pass" : "pending",
    detail: (t == null ? void 0 : t.label) ?? (i == null ? "No AVWAP failure" : `AVWAP ${gn(i, 1)}%`)
  };
}
function Cs(e, n, t, i) {
  var c;
  const r = I((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), o = r != null && t != null && Ps(t, r) <= i, a = di(n, t, i);
  return {
    key: "retest",
    label: "Retest",
    status: !!(o || a) ? "pass" : "pending",
    detail: o ? `Retesting ${ye(r)}` : a ? `Near R ${ye(a.center)}` : "No retest yet"
  };
}
function xs(e, n, t, i) {
  var o;
  if (e.status !== "pass" || n.status !== "pass" || (t == null ? void 0 : t.state) !== "bullish" || i == null) return !1;
  const r = I((o = t.lastSwingHigh) == null ? void 0 : o.price);
  return r != null && i > r * 1.01;
}
function cr(e, n) {
  return e.status === "pass" || n.some((t) => t.summary.state !== "neutral");
}
function di(e, n, t) {
  return n == null || !K(n) ? null : e.filter((i) => i.kind === "resistance").map((i) => ({
    zone: i,
    distance: n >= i.low && n <= i.high ? 0 : n < i.low ? (i.low - n) / n * 100 : (n - i.high) / n * 100
  })).filter((i) => i.distance <= t).sort((i, r) => i.distance - r.distance || r.zone.strength - i.zone.strength).map((i) => i.zone)[0] ?? null;
}
function Ps(e, n) {
  return !K(e) || !K(n) ? 1 / 0 : Math.abs((e / n - 1) * 100);
}
function lt(e) {
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
function Is(e, n) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const t = n.filter((i) => i.status === "pass").map((i) => i.label);
  return t.length ? t.join(" + ") : lt(e);
}
function gn(e, n = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(n)}`;
}
function ye(e) {
  const n = Math.abs(e);
  return n >= 1e3 ? e.toFixed(0) : n >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function I(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function Pe(e) {
  return e[e.length - 1];
}
function ao(e) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const t = e[n];
    if (K(t.c)) return t;
  }
  return null;
}
function ks(e) {
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
function so(e, n, t) {
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
function Os(e, n) {
  const t = [];
  for (let i = 1; i < e.length; i += 1) {
    const r = e[i];
    if (r.bucket < n.earliestBucket || r.bucket >= n.excludeBucket || !K(r.c)) continue;
    const o = so(e, r.bucket - n.windowSeconds, i);
    !o || !K(o.c) || t.push((r.c / o.c - 1) * 100);
  }
  return t;
}
function Ns(e, n) {
  if (!e.length || !Number.isFinite(n)) return null;
  const t = e.filter(Number.isFinite);
  if (!t.length) return null;
  const i = t.filter((o) => o < n).length, r = t.filter((o) => o === n).length;
  return (i + r * 0.5) / t.length * 100;
}
function _s(e, n) {
  const t = e.filter(Number.isFinite);
  if (t.length < 2 || !Number.isFinite(n)) return null;
  const i = t.reduce((a, s) => a + s, 0) / t.length, r = t.reduce((a, s) => a + (s - i) ** 2, 0) / (t.length - 1), o = Math.sqrt(r);
  return o > 0 ? (n - i) / o : null;
}
function St(e, n, t, i, r) {
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
function Ms(e, n) {
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
function Fs(e, n) {
  const t = Number(e.v_base);
  if (Number.isFinite(t) && t > 0) return t;
  const i = Number(e.v_quote);
  return Number.isFinite(i) && i > 0 && n > 0 ? i / n : 0;
}
function lr(e, n, t, i, r, o) {
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
function Ls(e) {
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
function ur(e, n, t, i, r, o) {
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
function Un(e, n, t, i, r, o, a, s, c, l) {
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
function Ds(e, n, t, i, r, o, a, s, c) {
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
function Hs(e, n) {
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
function Bs(e, n) {
  return e === "bearish" ? n === "bullish" || n === "transitional" : n === "bearish" || n === "transitional";
}
function fr(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function mi(e, n, t) {
  const i = n[n.length - 1] ?? null, r = Vt(e, "SwingHigh"), o = Vt(e, "SwingLow"), a = e[e.length - 1] ?? null, s = Vs(n), c = e.length === 0 ? "neutral" : i == null || s ? "range" : i.kind === "StructureShift" ? "transitional" : i.direction, l = c === "transitional" ? (i == null ? void 0 : i.direction) ?? null : null;
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
function qn(e, n, t, i, r) {
  for (let a = e.length - 1; a >= 0; a -= 1) {
    const s = e[a];
    if (s.kind === n && t.includes(s.structure))
      return Bt(i, r, s);
  }
  const o = Vt(e, n);
  return o ? Bt(i, r, o) : null;
}
function dr(e, n, t, i, r) {
  let o = null;
  for (const a of e)
    a.kind === n && (!o || (r ? a.price > o.price : a.price < o.price)) && (o = a);
  return o ? Bt(t, i, o) : null;
}
function Bt(e, n, t) {
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
function Vs(e) {
  const n = e.slice(-5).filter((t) => t.kind === "StructureShift");
  if (n.length < 3) return !1;
  for (let t = 1; t < n.length; t += 1)
    if (n[t].direction === n[t - 1].direction)
      return !1;
  return !0;
}
function Vt(e, n) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const i = e[t];
    if (i.kind === n) return i;
  }
  return null;
}
function $s(e, n) {
  return e.kind === "SwingHigh" ? e.price > n.price : e.price < n.price;
}
function Us(e, n, t) {
  const i = e.atr != null && Number.isFinite(e.atr) ? e.atr : n.atr != null && Number.isFinite(n.atr) ? n.atr : 0;
  return Math.max(0, i * t);
}
function ut(e, n) {
  const t = $e(n), i = Array(e.length).fill(null);
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
function qs(e, n, t, i, r) {
  const o = t.price;
  if (!Number.isFinite(o) || o <= 0) return;
  const a = Math.max(o * (r / 1e4), Number.EPSILON), s = o - a, c = o + a, l = 1 / Math.max(1, i), u = e.find(
    (m) => m.kind === n && Ws(m.low, m.high, s, c)
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
function zs(e, n, t, i) {
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
function Qs(e, n, t) {
  const i = e[n].h;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= t; r += 1)
    if (e[n - r].h >= i || e[n + r].h > i) return !1;
  return !0;
}
function js(e, n, t) {
  const i = e[n].l;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= t; r += 1)
    if (e[n - r].l <= i || e[n + r].l < i) return !1;
  return !0;
}
function Ws(e, n, t, i) {
  return e <= i && t <= n;
}
function Gs(e) {
  const n = /* @__PURE__ */ new Map();
  for (let t = 0; t < e.length; t += 2) {
    const i = e[t], r = e[t + 1];
    Number.isFinite(i) && Number.isFinite(r) && n.set(i, r);
  }
  return n;
}
function $t(e, n) {
  const t = $e(n), i = Array(e.length).fill(null);
  if (e.length < t) return i;
  const r = 2 / (t + 1);
  let o = 0;
  for (let a = 0; a < t; a++) o += e[a].c;
  o /= t, i[t - 1] = o;
  for (let a = t; a < e.length; a++)
    o = (e[a].c - o) * r + o, i[a] = o;
  return i;
}
function Ys(e, n) {
  const t = $e(n);
  if (e.length < t) return [];
  const i = [], r = 2 / (t + 1);
  let o = 0;
  for (let a = 0; a < t; a++) o += e[a].value;
  o /= t, i.push({ x: e[t - 1].x, value: o });
  for (let a = t; a < e.length; a++)
    o = (e[a].value - o) * r + o, i.push({ x: e[a].x, value: o });
  return i;
}
function co(e, n) {
  const t = $e(n);
  if (e.length <= t) return [];
  let i = 0, r = 0;
  for (let a = 1; a <= t; a++) {
    const s = e[a].c - e[a - 1].c;
    s >= 0 ? i += s : r += Math.abs(s);
  }
  i /= t, r /= t;
  const o = [
    { x: e[t].x, value: vr(i, r) }
  ];
  for (let a = t + 1; a < e.length; a++) {
    const s = e[a].c - e[a - 1].c, c = Math.max(0, s), l = Math.max(0, -s);
    i = (i * (t - 1) + c) / t, r = (r * (t - 1) + l) / t, o.push({ x: e[a].x, value: vr(i, r) });
  }
  return o;
}
function mr(e, n) {
  if (e.length < n) return [];
  const t = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.value, o >= n && (i -= e[o - n].value), o >= n - 1 && t.push({ x: r.x, value: i / n });
  }), t;
}
function Ve(e) {
  const n = [];
  for (const t of e)
    n.push(t.x, t.value);
  return new Float32Array(n);
}
function vr(e, n) {
  return n === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / n);
}
function $e(e) {
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
const Ks = "strategy-profile.1", lo = "decision-snapshot.1", Xs = "impulse_fade_v1.research.default", Zs = "1";
function Js(e) {
  return `decision-reference-observation:${T({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function kn(e) {
  const { profileHash: n, ...t } = e;
  return T(t);
}
function uo(e) {
  if (Tn(e.createdAt, "createdAt"), e.setupFamily !== xe || e.lifecycleVersion !== fe || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [r, o] of Object.entries(e.timeframeRoles))
    if (r === "contextTimeframes") {
      if (!o.every((a) => a.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (o != null && !o.trim())
      throw new TypeError(`${r} cannot be blank`);
  if (yr(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), yr(
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
    profileHash: kn(i)
  });
}
function ec(e = {}) {
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
  return uo({
    schemaVersion: Ks,
    id: e.id ?? Xs,
    version: e.version ?? Zs,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: xe,
    lifecycleVersion: fe,
    lifecycleConfigHash: e.lifecycleConfigHash ?? sn(),
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
const nc = ec();
function vi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (lc(e.price, "reference price"), Tn(e.eventTime, "reference eventTime"), Tn(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const n = Js(e.sourceObject);
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
function tc(e) {
  var o, a, s, c;
  if (Tn(e.decisionTime, "decisionTime"), Tn(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  rc(e.lifecycle.candidate, e.effectiveAsOf), oc(e.candidateMetrics, e.effectiveAsOf);
  const n = [...e.dataQualityNotes];
  cc([
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
  const t = ic(
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
    snapshotSchemaVersion: lo,
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
    lifecycleEvidence: xt(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: t,
    structureByTimeframe: ac(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: Ct(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: Ct(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: xt(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: xt(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: Ct(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: n
  }, r = yi(i);
  return h({ ...i, id: r });
}
function yi(e) {
  const { id: n, ...t } = e;
  return `decision-snapshot:${T(t).slice(8)}`;
}
function fo(e) {
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
function ic(e, n, t, i) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > n || e.symbol.toUpperCase() !== t.toUpperCase() || e.marketType.toLowerCase() !== "perp" || i != null && i.venue && e.exchange.toLowerCase() !== i.venue.toLowerCase() ? null : e;
}
function rc(e, n) {
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
function oc(e, n) {
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
function ac(e, n) {
  return Object.fromEntries(
    Object.entries(e).sort(([t], [i]) => t.localeCompare(i)).map(([t, i]) => [
      t,
      sc(i) <= n ? i : null
    ])
  );
}
function Ct(e, n) {
  return e.filter((t) => t.knownAt <= n).sort((t, i) => t.knownAt - i.knownAt || t.id.localeCompare(i.id));
}
function xt(e, n) {
  return e.filter((t) => t.knownAt <= n).sort(
    (t, i) => t.knownAt - i.knownAt || t.eventTime - i.eventTime || T(t).localeCompare(T(i))
  );
}
function sc(e) {
  var n, t, i;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((n = e.lastBreak) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((t = e.lastSwingHigh) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((i = e.lastSwingLow) == null ? void 0 : i.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function cc(e) {
  const n = /* @__PURE__ */ new Map();
  for (const t of e) {
    const i = n.get(t.id);
    if (i && S(i) !== S(t))
      throw new RangeError(`Conflicting decision reference id ${t.id}`);
    n.set(t.id, t);
  }
}
function Tn(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite Unix timestamp`);
}
function lc(e, n) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${n} must be a positive finite number`);
}
function yr(e, n) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${n} must be in (0, 1]`);
}
const mo = "radar-selection-profile.1", hi = "radar-episode.1", vo = "replay-case-manifest.1", pi = "radar-metric-observation.1", uc = "radar-scan-result.1", fc = "radar-episode-status.1", gi = "execution-venue-eligibility.1", dc = "radar-structure-observation.1", Ai = "radar-universe-membership.1";
function bi(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function mc(e) {
  return Eo(e), h({
    ...e,
    canonicalConfigHash: bi(e)
  });
}
function vc(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const n = {
    schemaVersion: gi,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...n,
    observationId: dt(n)
  });
}
function md(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !ri(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const n = {
    schemaVersion: dc,
    ...e
  };
  return h({
    ...n,
    observationId: yo(n)
  });
}
function vd(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const n = {
    schemaVersion: Ai,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...n,
    observationId: ft(n)
  });
}
function ft(e) {
  const { observationId: n, ...t } = e;
  return `radar-universe-observation:${X(t)}`;
}
function yo(e) {
  const { observationId: n, ...t } = e;
  return `radar-structure-observation:${X(t)}`;
}
function Ut(e) {
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
function dt(e) {
  const { observationId: n, ...t } = e;
  return `execution-venue-observation:${X(t)}`;
}
const yd = mc({
  schemaVersion: mo,
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
function hd(e) {
  var c, l;
  $c(e);
  const n = e.strategyProfile ?? nc, t = /* @__PURE__ */ new Map(), i = [], r = [], o = [], a = [], s = /* @__PURE__ */ new Set();
  for (const [u, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = xc(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    s.add(m);
    const p = he(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((g) => _e(g, e.selectionProfile.scanTimeframe)).filter((g) => g <= e.to).filter((g) => Bc(g, e.selectionProfile)), y = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const g of p) {
      const w = rn(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      y.previousEvaluationAsOf != null && g - y.previousEvaluationAsOf > w && (y.previousGate = null, y.falseSince = null);
      const E = g >= e.from, O = e.selectionProfile.moveDetectors.map(
        (L) => yc(L, d, g, e.selectionProfile.scanTimeframe)
      );
      if (E)
        for (const L of O)
          for (const F of L.observations)
            t.set(F.requestId, F);
      const P = Dc(
        O.map((L) => L.result),
        e.selectionProfile.detectorCombination
      ), b = Tc(
        d,
        g,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), A = Ec(
        d,
        g,
        e.selectionProfile,
        O,
        b,
        e.universeHistory ?? []
      ), C = A.results, k = C.every((L) => L.passed), j = P.passed && k, q = !k || P.evaluable;
      if (E)
        for (const L of A.evidence)
          L.schemaVersion === pi && t.set(L.requestId, L);
      const M = Sc(
        d,
        g,
        O.map((L) => L.result),
        C,
        A.evidence,
        P.passed,
        k,
        j,
        q
      );
      if (E && i.push(M), y.activeEpisode && g >= y.activeEpisode.activeUntil && (y.activeEpisode.detectedAt >= e.from && y.activeEpisode.activeUntil <= e.to && o.push(
        Pt(
          y.activeEpisode,
          y.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), y.activeEpisode = null), q && !j ? (y.falseSince ?? (y.falseSince = g), !y.armed && g - y.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (E && ((c = y.blockedEpisode) == null ? void 0 : c.detectedAt) != null && y.blockedEpisode.detectedAt >= e.from && o.push(
        Pt(y.blockedEpisode, g, "reset", "radarGateReset", "armed")
      ), y.activeEpisode = null, y.blockedEpisode = null, y.armed = !0)) : y.falseSince = null, q && j && y.previousGate === !1 && y.armed) {
        const L = Ac({
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
        if (E) {
          r.push(L), o.push(
            Pt(L, g, "active", "detected", "blockedUntilReset")
          );
          const F = bc(L, d, e.selectionProfile, n);
          a.push(F);
          for (const Me of L.contextObservations)
            t.set(Me.requestId, Me);
        }
        y.activeEpisode = L, y.blockedEpisode = L, y.armed = !1;
      }
      y.previousGate = q ? j : null, y.previousEvaluationAsOf = g;
    }
  }
  return h({
    schemaVersion: uc,
    selectionProfileRef: Ro(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...t.values()].sort(To),
    gateEvaluations: i.sort(qc),
    episodes: r.sort(zc),
    episodeStatusObservations: o.sort(Qc),
    replayCaseManifests: a.sort((u, f) => u.id.localeCompare(f.id))
  });
}
function yc(e, n, t, i) {
  return e.type === "rollingTroughRunup" ? hc(e, n, t, i) : e.type === "elapsedWindowReturn" ? pc(e, n, t, i) : e.type === "maximumWindowReturn" ? gc(e, n, t, i) : ho(e, n, t);
}
function hc(e, n, t, i) {
  const r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, s = (o ? r.filter(
    (y) => y.bucket >= o.bucket - e.lookbackSeconds && y.bucket <= o.bucket && o.bucket - y.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((y, g) => Y(g.c) && (!y || g.c < y.c || g.c === y.c && g.bucket < y.bucket) ? g : y, null), c = o && s && Y(s.c) ? (o.c / s.c - 1) * 100 : null, l = kc(r, o, e), u = bo(l, c, e.minimumSampleCount), f = [];
  o || f.push(se("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || f.push(se("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = T(e), m = cn({
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
    historyCandles: Ti(r, o, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...u.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && An(m.percentile, e.minimumPercentile) && An(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, p = s ? Rc(n, t, s, m) : null;
  return {
    result: mt(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${nt(c)} versus ${nt(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: p
  };
}
function pc(e, n, t, i) {
  const r = po(e, n, t, i), o = wo(r, e);
  return {
    result: mt(
      e,
      o,
      [r],
      o ? r.observationId : null,
      r.value == null ? "Elapsed return unavailable" : `${So(e.windowSeconds)} return ${nt(r.value)}`
    ),
    observations: [r],
    anchor: null
  };
}
function gc(e, n, t, i) {
  const r = [...new Set(e.windowsSeconds)].sort((u, f) => u - f).map(
    (u) => po(
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
  )[0] ?? null, a = he(n.candlesByTimeframe[i] ?? [], i, t), s = cn({
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
    historyCandles: Ti(
      a,
      a.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: T(e),
    notes: o ? o.dataQualityNotes : [se("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = wo(s, e), l = [...r, s];
  return {
    result: mt(
      e,
      c,
      l,
      c ? (o == null ? void 0 : o.observationId) ?? null : null,
      (o == null ? void 0 : o.value) == null ? "Maximum elapsed return unavailable" : `Winning ${So(o.window ?? 0)} return ${nt(o.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function ho(e, n, t) {
  const i = e.analysisTimeframe, r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, a = Oc(r, e.emaPeriod).at(-1) ?? null, s = Nc(r, e.atrPeriod).at(-1) ?? null, c = o && a != null && s != null && s > 0 ? (o.c - a) / s : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  o || u.push(se("NO_COMPLETED_CANDLE", "error", `No completed ${i} candle exists at cutoff`)), (r.length < l || c == null) && u.push(
    se(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${i} candles`
    )
  );
  const f = cn({
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
    configHash: T(e),
    notes: Ri(u)
  }), d = c != null && r.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: mt(
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
function po(e, n, t, i) {
  const r = he(n.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, a = o ? Ei(r, o.bucket - e.windowSeconds) : null, s = o && a ? o.bucket - e.windowSeconds - a.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, l = o && a && !c && Y(a.c) ? (o.c / a.c - 1) * 100 : null, u = Ic(r, o, e), f = bo(u, l, e.minimumSampleCount), d = [...f.notes];
  return o || d.push(se("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a ? c && d.push(se("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(se("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), cn({
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
    historyCandles: Ti(
      r,
      o,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: T(e),
    notes: Ri(d)
  });
}
function Ac(e) {
  var C;
  const n = e.detectorEvaluations.filter((k) => k.result.passed), t = qt(
    n.flatMap(
      (k) => k.observations.filter(
        (j) => j.observationId === k.result.winningObservationId
      )
    )
  ), i = ((C = n.find((k) => k.anchor)) == null ? void 0 : C.anchor) ?? null, r = he(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), o = hr(e.series, e.asOf, e.profile.scanTimeframe, 86400), a = hr(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = Ao(e.series, e.asOf, e.profile), l = e.detectorEvaluations.flatMap((k) => k.observations).find((k) => k.metricCode === "ema_atr_displacement") ?? null ?? ho(
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
  ).observations[0], u = Pc(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = qt([
    ...t,
    o,
    a,
    s,
    l
  ]), d = n[0], m = d ? t.find(
    (k) => k.observationId === d.result.winningObservationId
  ) ?? t[0] ?? null : null, v = wc(
    r,
    i,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    o,
    a,
    s,
    l,
    u
  ), p = _c(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), y = p != null && p.candidate ? p : null, g = (y == null ? void 0 : y.candidate) ?? null, w = (y == null ? void 0 : y.asOf) ?? null, E = y && w != null ? Ut({
    logicalObjectId: (g == null ? void 0 : g.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: y.updatedTs,
    knownAt: w,
    snapshot: y
  }) : null, O = g ? Ut({
    logicalObjectId: g.id,
    objectType: "SetupCandidateEpisode",
    eventTime: g.detectionEventTime,
    knownAt: w ?? g.detectedAt,
    snapshot: g
  }) : null, P = {
    schemaVersion: hi,
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
    initialLifecycleStateRef: E,
    initialMtfStructure: u,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Ri([
      ...f.flatMap((k) => k.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, b = `radar-episode:${X({
    symbol: P.symbol,
    source: P.source,
    profileHash: P.selectionProfileHash,
    detectedAt: P.detectedAt,
    triggeringObservationIds: t.map((k) => k.observationId)
  })}`, A = { ...P, id: b, logicalObjectId: b };
  return h({
    ...A,
    observationId: wi(A)
  });
}
function bc(e, n, t, i) {
  const r = Object.keys(n.candlesByTimeframe).filter(
    (c) => he(n.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Ci), o = Object.fromEntries(
    r.map((c) => {
      var u, f;
      const l = he(n.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((u = l[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((f = l.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: l.at(-1) ? _e(l.at(-1), c) : null,
          completedCandleCount: l.length
        }
      ];
    })
  ), a = r.filter(
    (c) => o[c].completedCandleCount > 0
  ), s = {
    schemaVersion: vo,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Ro(t),
    lifecycleVersion: fe,
    strategyProfileRef: {
      id: i.id,
      version: i.version,
      profileHash: i.profileHash
    },
    availableTimeframes: a,
    preRollRequirements: Lc(t),
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
    id: go(s)
  });
}
function go(e) {
  const { id: n, ...t } = e;
  return `replay-case:${X(t)}`;
}
function wi(e) {
  const { observationId: n, ...t } = e;
  return `radar-episode-observation:${X(t)}`;
}
function hr(e, n, t, i) {
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
  }, o = he(e.candlesByTimeframe[t] ?? [], t, n), a = o.at(-1) ?? null, s = a ? Ei(o, a.bucket - i) : null, c = a && s && Y(s.c) ? (a.c / s.c - 1) * 100 : null, l = c == null ? [se("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${i}-second reference exists`)] : [];
  return cn({
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
    configHash: T(r),
    notes: l
  });
}
function Ao(e, n, t) {
  var f;
  const i = t.scanTimeframe, r = he(e.candlesByTimeframe[i] ?? [], i, n), o = r.at(-1) ?? null, a = o ? r.filter((d) => d.bucket > o.bucket - t.liquidityPolicy.windowSeconds) : [], s = a.map(
    (d) => bn(d.v_quote) ? d.v_quote : bn(d.v_base) ? d.v_base * d.c : null
  ), c = s.length > 0 && s.every((d) => d != null), l = c ? s.reduce((d, m) => d + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: i,
    windowSeconds: t.liquidityPolicy.windowSeconds
  };
  return cn({
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
    configHash: T(u),
    notes: c ? [] : [se("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function cn(e) {
  var u, f;
  const n = ((u = e.historyCandles[0]) == null ? void 0 : u.bucket) ?? null, t = ((f = e.historyCandles.at(-1)) == null ? void 0 : f.bucket) ?? null, i = e.timeframe && e.historyCandles.at(-1) ? _e(e.historyCandles.at(-1), e.timeframe) : e.asOf, r = e.timeframe ? e.historyCandles.reduce(
    (d, m) => Math.max(d, He(m, e.timeframe)),
    i
  ) : e.asOf, o = T(
    e.historyCandles.map((d) => ({
      bucket: d.bucket,
      ts: d.ts,
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      vBase: bn(d.v_base) ? d.v_base : null,
      vQuote: bn(d.v_quote) ? d.v_quote : null,
      ver: bn(d.ver) ? d.ver : null,
      knownAt: e.timeframe ? He(d, e.timeframe) : null
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
    schemaVersion: pi,
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
function wc(e, n, t, i, r, o, a, s, c) {
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
function Ec(e, n, t, i, r, o) {
  const a = [];
  return {
    results: t.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = t.sourcePolicy.allowedSources == null || t.sourcePolicy.allowedSources.includes(e.source);
        return dn(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = qt(i.flatMap((v) => v.observations));
        a.push(...d);
        const m = !i.some(
          (v) => v.observations.some(
            (p) => p.dataQualityNotes.some((y) => y.severity === "error")
          )
        );
        return dn(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        a.push(r);
        const d = Hc(r.status, t.executionVenuePolicy.mode);
        return dn(
          c,
          d,
          `Execution venue ${r.status}`,
          [r]
        );
      }
      if (c === "selectedUniverse") {
        const d = Fc(o, e, n);
        return d && a.push(d), dn(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const l = Ao(e, n, t);
      a.push(l);
      const u = t.liquidityPolicy.minimumQuoteNotional, f = u == null || l.value == null ? u == null || t.liquidityPolicy.missingData === "warn" : l.value >= u;
      return dn(
        c,
        f,
        u == null ? "No minimum liquidity configured" : l.value == null ? "Quote-notional history unavailable" : `Quote notional ${l.value} versus ${u} minimum`,
        [l]
      );
    }),
    evidence: Uc(a)
  };
}
function dn(e, n, t, i) {
  return {
    code: e,
    passed: n,
    explanation: t,
    evidenceObservationIds: [...new Set(i.map((r) => r.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        i.flatMap(
          (r) => r.schemaVersion === pi ? [r.requestId] : []
        )
      )
    ].sort()
  };
}
function Tc(e, n, t, i) {
  const r = t.executionVenuePolicy.intendedVenue ?? "ignored", o = [...i].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === r.toLowerCase() && s.knownAt <= n && s.effectiveFrom <= n && (s.effectiveTo == null || s.effectiveTo >= n)
  );
  for (const s of o)
    if (dt(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const a = Si(
    o,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return a || vc({
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
function Rc(e, n, t, i) {
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
    ageSeconds: Math.max(0, n - _e(t, i.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: i.observationId
  };
  return h({
    ...r,
    observationId: `selection-anchor-observation:${X(r)}`
  });
}
function Pt(e, n, t, i, r) {
  const o = {
    schemaVersion: fc,
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
function Sc(e, n, t, i, r, o, a, s, c) {
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
function mt(e, n, t, i, r) {
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
  return st(e, n, t);
}
function Cc(e, n, t) {
  const i = _(n);
  return e.filter((r) => {
    if (!Number.isFinite(r.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (r.bucket + i > t) return !1;
    if (r.knownAt != null && !Number.isFinite(r.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${r.bucket}`);
    return He(r, n) <= t;
  });
}
function xc(e, n) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const t = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([i, r]) => (rn(i), [i, Cc(r, i, n)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: t
  };
}
function Pc(e, n, t) {
  const i = e.filter(
    (o) => o.symbol.toUpperCase() === n.symbol.toUpperCase() && o.source === n.source && o.knownAt <= t
  );
  for (const o of i)
    if (yo(o) !== o.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const r = /* @__PURE__ */ new Map();
  for (const o of new Set(i.map((a) => a.timeframe))) {
    const a = Si(
      i.filter((s) => s.timeframe === o),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${o}`
    );
    a && r.set(o, a);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([o], [a]) => Ci(o, a)).map(
      ([o, a]) => [
        o,
        Ut({
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
function Ei(e, n) {
  for (let t = e.length - 1; t >= 0; t -= 1)
    if (e[t].bucket <= n) return e[t];
  return null;
}
function Ic(e, n, t) {
  if (!n) return [];
  const i = n.bucket - t.historyLookbackSeconds, r = [];
  for (const o of e) {
    if (o.bucket < i || o.bucket >= n.bucket) continue;
    const a = Ei(e, o.bucket - t.windowSeconds);
    if (!a || !Y(a.c)) continue;
    const s = o.bucket - t.windowSeconds - a.bucket;
    t.maximumReferenceStalenessSeconds != null && s > t.maximumReferenceStalenessSeconds || r.push((o.c / a.c - 1) * 100);
  }
  return r;
}
function kc(e, n, t) {
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
function bo(e, n, t) {
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
function Ti(e, n, t) {
  return n ? e.filter((i) => i.bucket >= n.bucket - t) : [];
}
function wo(e, n) {
  return e.value != null && An(e.value, n.minimumReturnPct) && An(e.percentile, n.minimumPercentile) && An(e.zScore, n.minimumZScore) && e.sampleCount >= n.minimumSampleCount;
}
function Oc(e, n) {
  const t = new Array(e.length).fill(null);
  if (e.length < n) return t;
  let i = e.slice(0, n).reduce((o, a) => o + a.c, 0) / n;
  t[n - 1] = i;
  const r = 2 / (n + 1);
  for (let o = n; o < e.length; o += 1)
    i = e[o].c * r + i * (1 - r), t[o] = i;
  return t;
}
function Nc(e, n) {
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
function _c(e, n, t, i) {
  const r = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= t
  );
  for (const s of r)
    Mc(s, n, t, i);
  const o = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), a = r.filter((s) => s.asOf === o);
  if (new Set(a.map((s) => S(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${o}`);
  return a[0] ?? null;
}
function Mc(e, n, t, i) {
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
function Fc(e, n, t) {
  const i = [...e].filter(
    (r) => r.symbol.toUpperCase() === n.symbol.toUpperCase() && r.source === n.source && r.knownAt <= t && r.effectiveFrom <= t && (r.effectiveTo == null || r.effectiveTo >= t)
  );
  for (const r of i)
    if (ft(r) !== r.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Si(
    i,
    (r) => [r.effectiveFrom, r.knownAt],
    "universe membership"
  );
}
function Lc(e) {
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
  return [...n.entries()].sort(([i], [r]) => Ci(i, r)).map(([i, r]) => ({
    timeframe: i,
    minimumDurationSeconds: r.duration,
    minimumBars: r.bars,
    purposes: [...r.purposes].sort()
  }));
}
function Dc(e, n) {
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
function Hc(e, n) {
  return n === "ignore" ? !0 : n === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Bc(e, n) {
  const t = rn(n.scanTimeframe);
  return Math.floor(e / t) % n.evaluationCadence.everyBars === 0;
}
function H(e) {
  throw new RangeError(e);
}
function Eo(e) {
  var t;
  e.schemaVersion !== mo && H("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && H("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && H("Only impulse_fade_v1 radar profiles are supported");
  try {
    rn(e.scanTimeframe);
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
  for (const i of e.moveDetectors) Vc(i);
}
function Vc(e) {
  if (e.id.trim() || H("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || H(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && H(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!ri(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && H(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!Y(e.historyLookbackSeconds) || !It(e.minimumPercentile, 0, 100) || !It(e.minimumZScore)) && H(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!Y(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !Y(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && H(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!It(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && H(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !Y(e.windowSeconds) && H(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((n) => !Y(n)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && H(`Detector ${e.id} requires unique positive windows`);
}
function $c(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (bi(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: n, ...t } = e.selectionProfile;
  if (Eo(t), e.strategyProfile) {
    if (kn(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: i, ...r } = e.strategyProfile;
    uo(r);
  }
}
function It(e, n = -1 / 0, t = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= n && e <= t;
}
function An(e, n) {
  return n == null || e != null && e + 1e-12 >= n;
}
function Y(e) {
  return Number.isFinite(e) && e > 0;
}
function bn(e) {
  return e != null && Number.isFinite(e);
}
function se(e, n, t) {
  return { code: e, severity: n, message: t };
}
function Ri(e) {
  return [...new Map(e.map((n) => [`${n.code}:${n.severity}:${n.message}`, n])).values()].sort((n, t) => n.code.localeCompare(t.code));
}
function qt(e) {
  return [...new Map(e.map((n) => [n.requestId, n])).values()].sort(To);
}
function Uc(e) {
  return [...new Map(e.map((n) => [n.observationId, n])).values()].sort(
    (n, t) => n.observationId.localeCompare(t.observationId)
  );
}
function Si(e, n, t) {
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
function To(e, n) {
  return e.requestedAsOf - n.requestedAsOf || e.observationId.localeCompare(n.observationId) || e.requestId.localeCompare(n.requestId);
}
function qc(e, n) {
  return e.asOf - n.asOf || e.symbol.localeCompare(n.symbol) || e.source.localeCompare(n.source);
}
function zc(e, n) {
  return e.detectedAt - n.detectedAt || e.id.localeCompare(n.id);
}
function Qc(e, n) {
  return e.asOf - n.asOf || e.observationId.localeCompare(n.observationId);
}
function Ci(e, n) {
  return rn(e) - rn(n) || e.localeCompare(n);
}
function rn(e) {
  return _(e);
}
function Ro(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function nt(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function So(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function X(e) {
  return T(e).slice(8);
}
function pd(e) {
  return S(e);
}
const Co = /* @__PURE__ */ new WeakMap();
function jc(e, n) {
  Co.set(e, n);
}
function ne(e) {
  const n = Co.get(e);
  if (!n)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return n;
}
const vt = "replay-engine.1", Ie = "replay-engine.2", xi = "replay-session-config.1", xo = "replay-session.1", Po = "replay-command.1", Io = "replay-event.1", Wc = "replay-decision-frame.1", Gc = "replay-wake-plan.1", Yc = "replay-wake-condition.1", Kc = "replay-wake-result.1", Xc = "replay-data-bundle.1", Pi = "replay-outcome-envelope.1", Ii = "replay-analysis-state.1", ki = "replay-known-event.1";
var le, Pn, zt;
class gd {
  constructor(n) {
    Z(this, Pn);
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
    const t = J(this, Pn, zt).call(this, n);
    return {
      timeframe: n.timeframe,
      earliestOpenTime: ((i = t[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: ((r = t.at(-1)) == null ? void 0 : r.closeTime) ?? null,
      revisionHistoryAvailable: R(this, le).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(n) {
    return h(
      J(this, Pn, zt).call(this, n).filter(
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
le = new WeakMap(), Pn = new WeakSet(), zt = function(n) {
  return [...R(this, le).candles].filter(
    (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && t.timeframe === n.timeframe
  ).sort(
    (t, i) => t.openTime - i.openTime || t.knownAt - i.knownAt || t.observationId.localeCompare(i.observationId)
  );
};
function Oi(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function ko(e, n) {
  if (e.schemaVersion !== xi || !pt(e.replayEngineVersion))
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  _o(e.strategyProfileRef, n);
  const t = e.evaluationTimeframe ?? n.timeframeRoles.executionTimeframe;
  _(t);
  const i = _i(e.visibleTimeframes);
  if (!i.includes(t))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (pr(e.maximumCaseDuration, "maximumCaseDuration"), pr(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
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
    canonicalConfigHash: Oi(o)
  });
}
function Ad(e) {
  const n = _i([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return ko(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: xi,
      replayEngineVersion: vt,
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
function yt(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function On(e) {
  const { observationId: n, ...t } = e;
  return `replay-candle-observation:${T(t).slice(8)}`;
}
function Oo(e) {
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
    logicalCandleId: yt(e),
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
  return h({ ...r, observationId: On(r) });
}
function ht(e) {
  const { id: n, ...t } = e;
  return `replay-analysis-state:${T(t).slice(8)}`;
}
function Zc(e) {
  if (Qt(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const n = {
    schemaVersion: Ii,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...n, id: ht(n) });
}
function Ni(e) {
  const { id: n, ...t } = e;
  return `replay-known-event:${T(t).slice(8)}`;
}
function zn(e) {
  if (Qt(e.eventTime, "eventTime"), Qt(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && _(e.timeframe);
  const n = {
    schemaVersion: ki,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...n, id: Ni(n) });
}
async function Jc(e) {
  var b, A, C, k, j, q;
  el(e);
  const { manifest: n, sessionConfig: t, historicalDataAdapter: i } = e, r = await ((b = i.loadRadarEpisode) == null ? void 0 : b.call(i, n.radarEpisodeId));
  if (!r) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  nl(n, r);
  const o = _i([
    ...t.visibleTimeframes,
    t.evaluationTimeframe,
    ...n.preRollRequirements.map((M) => M.timeframe)
  ]), a = n.startAsOf + t.maximumCaseDuration, s = {}, c = {}, l = {}, u = [];
  for (const M of o) {
    const L = cl(n, e.strategyProfile, M), F = Math.max(0, n.startAsOf - L), Me = t.displayPreRollByTimeframe[M] ?? 0, un = Math.max(0, n.startAsOf - Me);
    s[M] = F, c[M] = un;
    const pe = await i.getCoverage({
      symbol: n.symbol,
      source: n.source,
      timeframe: M
    });
    if (pe.timeframe !== M) throw new Error(`Coverage timeframe mismatch for ${M}`);
    if (pe.earliestOpenTime == null || pe.earliestOpenTime > F)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${M}`);
    pe.earliestOpenTime > un && u.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${M} display history begins after the configured display pre-roll`
    }), pe.revisionHistoryAvailable || u.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${M} candle revision history is unavailable`
    });
    const Hn = await i.loadCandleHistory({
      symbol: n.symbol,
      source: n.source,
      timeframe: M,
      from: F,
      to: a
    }), Bn = pe.revisionHistoryAvailable ? await ((A = i.loadCandleRevisions) == null ? void 0 : A.call(i, {
      symbol: n.symbol,
      source: n.source,
      timeframe: M,
      from: F,
      to: a
    })) ?? [] : [];
    l[M] = tl(
      [...Hn, ...Bn].filter((x) => x.knownAt <= a),
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
  }, d = il(
    await ((C = i.loadAnalysisStateHistory) == null ? void 0 : C.call(i, f)) ?? [],
    n
  );
  if (!d.some((M) => M.knownAt <= n.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = rl(
    await ((k = i.loadKnownEvents) == null ? void 0 : k.call(i, f)) ?? [],
    n
  ), v = ol(
    await ((j = i.loadPointInTimeVenueEvidence) == null ? void 0 : j.call(i, f)) ?? [],
    n
  ), p = al(
    await ((q = i.loadPointInTimeUniverseEvidence) == null ? void 0 : q.call(i, f)) ?? [],
    n
  ), y = {
    schemaVersion: Xc,
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
  }, g = await nn(y), w = await No(y, n.startAsOf), E = h({
    ...y,
    causalPrefixFingerprint: w,
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
    causalPrefixFingerprint: w
  }), P = {
    manifest: h(n),
    sessionConfig: h(t),
    strategyProfile: h(e.strategyProfile),
    radarSelectionProfile: h(e.radarSelectionProfile),
    venueRules: h(e.venueRules ?? null),
    dataBundle: O,
    ...e.materializedAnalysisBinding ? { materializedAnalysisBinding: h(e.materializedAnalysisBinding) } : {}
  };
  return jc(P, E), P;
}
async function bd(e, n) {
  if (n > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: t, ...i } = e.dataBundle;
  return No(i, n);
}
async function No(e, n) {
  return nn({
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
async function nn(e) {
  var i;
  if (!((i = globalThis.crypto) != null && i.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const n = new TextEncoder().encode(S(e)), t = await globalThis.crypto.subtle.digest("SHA-256", n);
  return `sha256:${[...new Uint8Array(t)].map((r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function el(e) {
  const { manifest: n, sessionConfig: t, strategyProfile: i, radarSelectionProfile: r } = e;
  if (n.schemaVersion !== vo || go(n) !== n.id || n.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (n.startAsOf !== n.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (bi(r) !== r.canonicalConfigHash || n.selectionProfileRef.id !== r.id || n.selectionProfileRef.version !== r.version || n.selectionProfileRef.canonicalConfigHash !== r.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (kn(i) !== i.profileHash || i.lifecycleVersion !== fe || n.lifecycleVersion !== i.lifecycleVersion || n.strategyProfileRef.id !== i.id || n.strategyProfileRef.version !== i.version || n.strategyProfileRef.profileHash !== i.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (t.schemaVersion !== xi || !pt(t.replayEngineVersion) || Oi(t) !== t.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (t.replayEngineVersion === Ie && (!e.materializedAnalysisBinding || e.materializedAnalysisBinding.replayEngineVersion !== Ie || e.materializedAnalysisBinding.lifecycleConfigHash !== i.lifecycleConfigHash || e.materializedAnalysisBinding.radarProfileHash !== r.canonicalConfigHash || e.materializedAnalysisBinding.strategyProfileHash !== i.profileHash))
    throw new Error("Materialized replay configuration is missing its analysis binding");
  if (t.replayEngineVersion === vt && e.materializedAnalysisBinding)
    throw new Error("replay-engine.1 cannot accept a materialized analysis binding");
  if (_o(t.strategyProfileRef, i), t.evaluationTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (t.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (t.venueRulesRef && e.venueRules) {
    const o = ll(e.venueRules);
    if (S(o) !== S(t.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function pt(e) {
  return e === vt || e === Ie;
}
function nl(e, n) {
  var i, r, o;
  if (n.schemaVersion !== hi || n.id !== e.radarEpisodeId || n.observationId !== e.radarEpisodeObservationId || wi(n) !== n.observationId || n.symbol.toUpperCase() !== e.symbol.toUpperCase() || n.source !== e.source || n.detectedAt !== e.detectedAt || n.effectiveAsOf !== e.startAsOf)
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
function tl(e, n, t, i, r) {
  const o = /* @__PURE__ */ new Map();
  for (const s of e) {
    const c = Oo({
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
    if (s.symbol.toUpperCase() !== n.symbol.toUpperCase() || s.source !== n.source || s.timeframe !== t || s.openTime < i || s.openTime > r || s.logicalCandleId !== yt(s) || s.observationId !== On(s) || S(s) !== S(c))
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
    st(a.map(sl), t, s);
  return h(a);
}
function il(e, n) {
  const t = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (r.schemaVersion !== Ii || r.id !== ht(r) || !wn(r, n))
      throw new Error("Analysis state observation failed provenance verification");
    const o = i.get(r.knownAt);
    if (o && S(o) !== S(r))
      throw new Error(`Conflicting analysis states at ${r.knownAt}`);
    i.set(r.knownAt, r);
  }
  return h([...i.values()]);
}
function rl(e, n) {
  const t = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (r.schemaVersion !== ki || r.id !== Ni(r) || !wn(r, n) || r.knownAt < r.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const o = i.get(r.id);
    if (o && S(o) !== S(r))
      throw new Error(`Conflicting replay known event ${r.id}`);
    i.set(r.id, r);
  }
  return h([...i.values()]);
}
function ol(e, n) {
  return h(
    e.map((t) => {
      var r;
      const i = t;
      if (i.schemaVersion !== gi || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== n.symbol.toUpperCase() || i.marketDataSource !== n.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== dt(i))
        throw new Error("Execution-venue evidence failed provenance verification");
      return i;
    }).sort((t, i) => t.knownAt - i.knownAt)
  );
}
function al(e, n) {
  return h(
    e.map((t) => {
      var r;
      const i = t;
      if (i.schemaVersion !== Ai || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== n.symbol.toUpperCase() || i.source !== n.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== ft(i))
        throw new Error("Universe evidence failed provenance verification");
      return i;
    }).sort((t, i) => t.knownAt - i.knownAt)
  );
}
function sl(e) {
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
function cl(e, n, t) {
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
function ll(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: T(e)
  };
}
function _o(e, n) {
  if (e.id !== n.id || e.version !== n.version || e.profileHash !== n.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function _i(e) {
  const n = [];
  for (const t of e)
    _(t), n.includes(t) || n.push(t);
  if (!n.length) throw new RangeError("At least one timeframe is required");
  return n;
}
function pr(e, n) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${n} must be a positive integer number of seconds`);
}
function Qt(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite timestamp`);
}
function wn(e, n) {
  return e.symbol.toUpperCase() === n.symbol.toUpperCase() && e.source === n.source;
}
const Mo = "linear-quote-perpetual-risk.1", ul = "sizing-result.1", Fo = "trade-plan.1", fl = "decision-record.1";
function Lo(e) {
  const n = [], t = [
    Fe(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && n.push(Fe("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((F) => !Number.isFinite(F) || F <= 0) && n.push(Fe("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && n.push(Fe("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && N(
    n,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!Qn(e.intendedEntryPrice, e.venueRules.priceTick) || !Qn(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (F) => !Qn(F.targetPrice, e.venueRules.priceTick)
  )) && N(
    n,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !Qn(e.leveragePolicy.leverage, e.venueRules.leverageStep) && N(
    n,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && t.push(
    Fe(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const r = e.riskRequest.accountRiskFraction != null, o = e.riskRequest.fixedRiskAmount != null;
  r === o && n.push(
    Fe(
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
  (a == null || !Number.isFinite(a) || a <= 0) && N(n, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), vl(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    n
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = ue(s) ? s : null, l = ue(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && N(n, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = a != null && u != null && u > 0 ? a / u : null;
  let d = f == null ? null : gr(f, e.venueRules.quantityStep);
  if (d != null && a != null && u != null)
    for (; d > 0 && d * u > a + Math.max(1e-10, a * 1e-12); )
      d = gr(
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
  const w = e.riskRequest.maximumNotional;
  w != null && v != null && v > w && N(
    n,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${w}`
  );
  const E = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, O = e.accountState.availableBalance == null ? E : Math.min(E, e.accountState.availableBalance), P = v != null && O > 0 ? v / O : null, b = bl(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  b != null && b > e.venueRules.maxLeverage && N(
    n,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${b} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const A = v != null && b != null && b > 0 ? v / b : null;
  A != null && A > E + 1e-10 && N(
    n,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), A != null && e.accountState.availableBalance != null && A > e.accountState.availableBalance + 1e-10 && N(
    n,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const C = m != null && c != null && l != null ? m * (l - c) : null, k = yl(
    e.targets,
    m,
    c,
    C,
    g,
    e.executionAssumptions
  ), j = jn(
    k.map((F) => F.grossReward * F.positionFraction)
  ), q = jn(
    k.map((F) => F.netProjectedReward * F.positionFraction)
  ), M = jn(
    k.map(
      (F) => F.weightedGrossRContribution == null ? null : F.weightedGrossRContribution
    )
  ), L = jn(
    k.map(
      (F) => F.weightedRContribution == null ? null : F.weightedRContribution
    )
  );
  return h({
    schemaVersion: ul,
    sizingModelVersion: Mo,
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
    minimumRequiredLeverage: P,
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
function dl(e) {
  var o;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const n = Lo({
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
    schemaVersion: Fo,
    snapshotId: e.snapshot.id,
    setupFamily: xe,
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
  }, i = { ...t, id: e.id ?? Mi(t) }, r = ml({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: i
  });
  return h({ ...i, complianceResult: r });
}
function ml(e) {
  var d, m;
  const { strategyProfile: n, snapshot: t, plan: i } = e, r = [...i.sizingResult.hardErrors], o = [], a = [...i.sizingResult.warnings], s = Lo({
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
  (kn(n) !== n.profileHash || yi(t) !== t.id || Mi(i) !== i.id || S(s) !== S(i.sizingResult)) && N(
    r,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), i.venueRules.symbol.toUpperCase() !== t.symbol.toUpperCase() && N(
    r,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (t.snapshotSchemaVersion !== lo || t.strategyProfileId !== n.id || t.strategyProfileVersion !== n.version || t.strategyProfileHash !== n.profileHash || t.lifecycleVersion !== n.lifecycleVersion || t.lifecycleConfigHash !== n.lifecycleConfigHash || i.setupFamily !== n.setupFamily || i.lifecycleVersion !== n.lifecycleVersion || i.lifecycleConfigHash !== n.lifecycleConfigHash || i.strategyProfileId !== n.id || i.strategyProfileVersion !== n.version || i.strategyProfileHash !== n.profileHash || S(i.executionAssumptions) !== S(n.executionAssumptions)) && N(
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
  ), gl(t, i, r), Al(i, r), hl(t, n, o), pl(t, n, o), n.stopPolicy.requireOutsideEpisodeHigh && ((d = t.candidateEpisode) == null ? void 0 : d.episodeHigh) != null && i.stopPlan.stopPrice <= t.candidateEpisode.episodeHigh && N(
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
function kt(e) {
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
    schemaVersion: fl,
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
  }, t = e.id ?? `decision:${T(n).slice(8)}`;
  return h({ ...n, id: t });
}
function vl(e, n, t, i) {
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
function yl(e, n, t, i, r, o) {
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
function hl(e, n, t) {
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
function pl(e, n, t) {
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
function gl(e, n, t) {
  const i = new Map(
    fo(e).map((o) => [o.id, o])
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
function Al(e, n) {
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
function bl(e, n, t) {
  return e.mode === "manual" ? ue(e.leverage) ? e.leverage : null : n == null ? null : Math.max(1, wl(n, t));
}
function Mi(e) {
  const {
    id: n,
    complianceResult: t,
    ...i
  } = e;
  return `trade-plan:${T(i).slice(8)}`;
}
function gr(e, n) {
  if (!ue(e) || !ue(n)) return 0;
  const t = Do(n);
  return Number((Math.floor(e / n + 1e-12) * n).toFixed(t));
}
function wl(e, n) {
  if (!ue(e) || !ue(n)) return e;
  const t = Do(n);
  return Number((Math.ceil(e / n - 1e-12) * n).toFixed(t));
}
function Do(e) {
  const n = e.toString().toLowerCase();
  return n.includes("e-") ? Number(n.split("e-")[1]) : n.includes(".") ? n.length - n.indexOf(".") - 1 : 0;
}
function Qn(e, n) {
  if (!Number.isFinite(e) || !ue(n)) return !1;
  const t = Math.round(e / n) * n;
  return Math.abs(e - t) <= Math.max(1e-12, n * 1e-9);
}
function jn(e) {
  return e.some((n) => n == null) ? null : e.reduce((n, t) => n + (t ?? 0), 0);
}
function ue(e) {
  return Number.isFinite(e) && e > 0;
}
function Fe(e, n) {
  return { code: e, message: n };
}
function N(e, n, t) {
  e.some((i) => i.code === n) || e.push(Fe(n, t));
}
const Nn = "execution-engine.1", Ho = "execution-profile.1", Bo = "execution-session.1", El = "execution-order.1", Tl = "execution-fill.1", Vo = "execution-event.1", Rl = "execution-result.1", Sl = "execution-data-bundle.1", Fi = "execution-candle.1", $o = "execution-trade.1", Uo = "execution-quote.1", Cl = "execution-path-resolution.1", Li = "venue-execution-rules.1", xl = "venue-fee-schedule.1", qo = "funding-observation.1", Pl = "position-ledger.1";
var re;
class Il {
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
    for (const i of R(this, re).candles.filter((r) => Re(r, n))) {
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
      (t) => Re(t, n) && t.timeframe === n.timeframe && t.openTime >= n.from && t.openTime <= n.to
    ).sort(_l));
  }
  async loadTrades(n) {
    return h((R(this, re).trades ?? []).filter(
      (t) => Re(t, n) && mn(t.eventTime, n)
    ).sort(Wn));
  }
  async loadQuotes(n) {
    return h((R(this, re).quotes ?? []).filter(
      (t) => Re(t, n) && mn(t.eventTime, n)
    ).sort(Wn));
  }
  async loadMarkPrices(n) {
    return h((R(this, re).markPrices ?? []).filter(
      (t) => Re(t, n) && mn(t.eventTime, n)
    ).sort(Wn));
  }
  async loadIndexPrices(n) {
    return h((R(this, re).indexPrices ?? []).filter(
      (t) => Re(t, n) && mn(t.eventTime, n)
    ).sort(Wn));
  }
  async loadFundingObservations(n) {
    return h((R(this, re).funding ?? []).filter(
      (t) => Re(t, n) && mn(t.fundingTime, n)
    ).sort((t, i) => t.fundingTime - i.fundingTime || t.id.localeCompare(i.id)));
  }
  async loadVenueRuleEvidence(n) {
    return h((R(this, re).venueRuleEvidence ?? []).filter(
      (t) => Re(t, n)
    ));
  }
}
re = new WeakMap();
function zo(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function kl(e) {
  if (e.schemaVersion !== Ho || e.executionEngineVersion !== Nn) throw new Error("Unsupported execution profile schema or engine version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Execution profile id and version are required");
  if (e.ambiguityPolicy !== "StrictAmbiguity")
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  Ot(e.orderActivationPolicy.delaySeconds, "activation delay"), Ml(e.maximumExecutionHorizon, "execution horizon"), Ot(
    e.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks"
  ), Ot(
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
  return h({ ...t, canonicalConfigHash: zo(t) });
}
function wd(e) {
  return kl({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: Ho,
    executionEngineVersion: Nn,
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
function Qo(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function Ed(e) {
  if (e.schemaVersion !== xl)
    throw new Error("Unsupported venue fee schedule schema");
  if (Yo(e.effectiveFrom, e.effectiveUntil, "fee schedule"), !Number.isFinite(e.makerRate) || e.makerRate < 0 || !Number.isFinite(e.takerRate) || e.takerRate < 0) throw new RangeError("Fee rates must be non-negative finite values");
  if (!e.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return h({
    ...e,
    canonicalConfigHash: Qo(e)
  });
}
function Di(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function Ol(e, n) {
  if (e.schemaVersion !== Li)
    throw new Error("Unsupported venue execution rules schema");
  Yo(e.effectiveFrom, e.effectiveUntil, "venue rules");
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
    canonicalConfigHash: Di({
      ...e,
      symbol: e.symbol.toUpperCase()
    })
  });
}
function Td(e, n, t) {
  return Ol({
    id: `${e.venue}:${e.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: Li,
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
    feeScheduleRef: Nl(n),
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
function Hi(e) {
  const n = _(e.timeframe);
  if (!Number.isInteger(e.openTime) || e.openTime < 0 || e.openTime % n !== 0)
    throw new RangeError("Execution candle openTime must align to its timeframe");
  for (const i of [e.o, e.h, e.l, e.c])
    if (!Number.isFinite(i) || i <= 0) throw new RangeError("Execution OHLC must be positive");
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Execution candle high/low do not contain open and close");
  const t = {
    schemaVersion: Fi,
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
    id: `execution-candle:${T(t).slice(8)}`
  });
}
function Rd(e, n = e.source) {
  return Hi({
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
function jo(e) {
  ke(e.eventTime, "trade eventTime");
  const n = e.knownAt ?? e.eventTime;
  if (ke(n, "trade knownAt"), n < e.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(e.price) || e.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(e.quantity) || e.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const t = {
    schemaVersion: $o,
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
    id: `execution-trade:${T(t).slice(8)}`
  });
}
function Wo(e) {
  ke(e.eventTime, "quote eventTime");
  const n = e.knownAt ?? e.eventTime;
  if (ke(n, "quote knownAt"), n < e.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (!Number.isFinite(e.bid) || !Number.isFinite(e.ask) || e.bid <= 0 || e.ask <= 0 || e.bid > e.ask) throw new RangeError("Quote requires positive bid <= ask");
  const t = {
    schemaVersion: Uo,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: n,
    bid: e.bid,
    ask: e.ask
  };
  return h({
    ...t,
    id: `execution-quote:${T(t).slice(8)}`
  });
}
function Go(e) {
  ke(e.fundingTime, "fundingTime");
  const n = e.knownAt ?? e.fundingTime;
  if (ke(n, "funding knownAt"), n < e.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(e.rate)) throw new RangeError("Funding rate must be finite");
  if (e.markPrice != null && (!Number.isFinite(e.markPrice) || e.markPrice <= 0))
    throw new RangeError("Funding mark price must be positive");
  const t = {
    schemaVersion: qo,
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
    id: `funding-observation:${T(t).slice(8)}`
  });
}
function Nl(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function Re(e, n) {
  return e.venue.toLowerCase() === n.venue.toLowerCase() && e.symbol.toUpperCase() === n.symbol.toUpperCase();
}
function mn(e, n) {
  return e >= n.from && e <= n.to;
}
function _l(e, n) {
  return e.openTime - n.openTime || e.knownAt - n.knownAt || e.id.localeCompare(n.id);
}
function Wn(e, n) {
  return e.eventTime - n.eventTime || e.id.localeCompare(n.id);
}
function Yo(e, n, t) {
  if (e != null && ke(e, `${t} effectiveFrom`), n != null && ke(n, `${t} effectiveUntil`), e != null && n != null && n <= e)
    throw new RangeError(`${t} effectiveUntil must follow effectiveFrom`);
}
function Ot(e, n) {
  if (!Number.isInteger(e) || e < 0) throw new RangeError(`${n} must be non-negative`);
}
function Ml(e, n) {
  if (!Number.isInteger(e) || e <= 0) throw new RangeError(`${n} must be positive`);
}
function ke(e, n) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${n} must be a valid timestamp`);
}
async function Sd(e) {
  Fl(e);
  const n = e.replayFrame.effectiveAsOf, i = n + e.executionProfile.orderActivationPolicy.delaySeconds + e.executionProfile.maximumExecutionHorizon, r = Math.max(
    ...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)
  ), o = {
    venue: e.venueRules.venue,
    symbol: e.venueRules.symbol,
    from: n,
    to: i + (e.executionProfile.forceCloseAtHorizon ? r : 0)
  }, a = {};
  for (const w of e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const E = await e.historicalDataAdapter.loadCandles({ ...o, timeframe: w });
    Ll(E, o.venue, o.symbol, w), a[w] = E;
  }
  const s = await Ke(e.historicalDataAdapter.loadTrades, e.historicalDataAdapter, o), c = await Ke(e.historicalDataAdapter.loadQuotes, e.historicalDataAdapter, o), l = await Ke(e.historicalDataAdapter.loadMarkPrices, e.historicalDataAdapter, o), u = await Ke(e.historicalDataAdapter.loadIndexPrices, e.historicalDataAdapter, o), f = e.historicalDataAdapter.fundingDataAvailable ?? e.historicalDataAdapter.loadFundingObservations != null, d = await Ke(
    e.historicalDataAdapter.loadFundingObservations,
    e.historicalDataAdapter,
    o
  ), m = await Ke(
    e.historicalDataAdapter.loadVenueRuleEvidence,
    e.historicalDataAdapter,
    o
  );
  if (Dl(s, c, l, u, d, o.venue, o.symbol), e.historicalDataAdapter.tradeDataCompleteness === "complete" && s.some((w) => w.knownAt !== w.eventTime)) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
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
    candlesByTimeframe: Object.fromEntries(Object.entries(a).map(([w, E]) => [
      w,
      E.filter((O) => O.knownAt <= n)
    ])),
    trades: s.filter((w) => w.knownAt <= n),
    quotes: c.filter((w) => w.knownAt <= n),
    markPrices: l.filter((w) => w.knownAt <= n),
    indexPrices: u.filter((w) => w.knownAt <= n)
  }, y = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...e.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : [],
    ...e.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : [],
    ...f ? [] : ["FUNDING_DATA_UNAVAILABLE"],
    ...e.venueRules.liquidationModel ? [] : ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"],
    ...s.length && e.historicalDataAdapter.tradeDataCompleteness !== "complete" ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"] : [],
    ...e.executionProfile.stopTriggerPolicy.source !== "last" && e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"] : []
  ], g = {
    schemaVersion: Sl,
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
    causalPrefixFingerprint: await nn(p),
    internalBundleFingerprint: await nn(v),
    fundingDataFingerprint: f ? await nn(d.filter((w) => w.knownAt <= n)) : null,
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
function Fl(e) {
  const { replaySession: n, replayFrame: t, tradePlan: i, strategyProfile: r, executionProfile: o, venueRules: a, feeSchedule: s } = e;
  if (t.sessionId !== n.id || t.id !== n.currentFrameId)
    throw new Error("Execution frame does not match the replay session");
  if (n.state !== "TradePlanRecorded" && n.state !== "Revealed") throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (t.decisionSnapshot.id !== i.snapshotId || yi(t.decisionSnapshot) !== t.decisionSnapshot.id || i.id !== Mi(i) || i.schemaVersion !== Fo || i.status !== "finalized" || i.side !== "short" || i.complianceResult.hardErrors.length > 0) throw new Error("Execution requires an intact finalized short TradePlan");
  if (!n.planningAttempts.some(
    (y) => y.accepted && y.frameId === t.id && y.tradePlan.id === i.id
  )) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (kn(r) !== r.profileHash || i.strategyProfileId !== r.id || i.strategyProfileVersion !== r.version || i.strategyProfileHash !== r.profileHash || i.lifecycleVersion !== n.lifecycleVersion || i.lifecycleConfigHash !== n.lifecycleConfigHash) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (o.canonicalConfigHash !== zo(o))
    throw new Error("Execution profile hash mismatch");
  if (a.canonicalConfigHash !== Di(a))
    throw new Error("Venue execution rules hash mismatch");
  if (s.canonicalConfigHash !== Qo(s))
    throw new Error("Venue fee schedule hash mismatch");
  const l = t.effectiveAsOf;
  Ar(s, l, "fee schedule"), Ar(a, l, "venue execution rules");
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
  if (d == null || d <= 0 || !Hl(d, a.quantityStep))
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
function Ar(e, n, t) {
  if (e.effectiveFrom != null && n < e.effectiveFrom || e.effectiveUntil != null && n >= e.effectiveUntil) throw new Error(`${t} is not effective at the decision time`);
}
async function Ke(e, n, t) {
  return e ? e.call(n, t) : [];
}
function Ll(e, n, t, i) {
  const r = /* @__PURE__ */ new Set();
  let o = -1;
  for (const a of e) {
    if (a.schemaVersion !== Fi || a.venue.toLowerCase() !== n.toLowerCase() || a.symbol !== t.toUpperCase() || a.timeframe !== i || a.id !== Hi(a).id || a.openTime <= o || r.has(a.id)) throw new Error(`Invalid or duplicate execution candle ${a.id}`);
    o = a.openTime, r.add(a.id);
  }
}
function Dl(e, n, t, i, r, o, a) {
  const s = [...e, ...n, ...t, ...i], c = /* @__PURE__ */ new Set();
  for (const l of s) {
    if (l.venue.toLowerCase() !== o.toLowerCase() || l.symbol.toUpperCase() !== a.toUpperCase() || l.knownAt < l.eventTime || c.has(l.id)) throw new Error(`Invalid or duplicate execution observation ${l.id}`);
    const u = "price" in l ? jo(l).id : Wo(l).id;
    if (l.id !== u) throw new Error(`Execution observation identity mismatch ${l.id}`);
    c.add(l.id);
  }
  for (const l of r) {
    if (l.venue.toLowerCase() !== o.toLowerCase() || l.symbol.toUpperCase() !== a.toUpperCase() || l.id !== Go(l).id || c.has(l.id)) throw new Error(`Invalid or duplicate funding observation ${l.id}`);
    c.add(l.id);
  }
}
function Hl(e, n) {
  const t = Math.round(e / n) * n;
  return Math.abs(e - t) <= Math.max(1e-12, n * 1e-9);
}
const br = "execution-json-data.1";
function Bl(e) {
  const n = ze(e, "Execution JSON data");
  if (Mt(n, [
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
  ], "Execution JSON data"), n.schemaVersion !== br)
    throw new Error("Unsupported execution JSON data schema");
  const t = _t(n.venue, "venue"), i = _t(n.symbol, "symbol").toUpperCase(), r = Vl(n.candles, t, i), o = $l(n.trades, t, i), a = Nt(n.quotes, t, i, "quotes"), s = Nt(n.markPrices, t, i, "markPrices"), c = Nt(n.indexPrices, t, i, "indexPrices"), l = wr(n.tradeDataCompleteness, "tradeDataCompleteness"), u = wr(n.quoteDataCompleteness, "quoteDataCompleteness");
  if (l === "unavailable" && o.length)
    throw new Error("Unavailable trade data cannot contain observations");
  if (u === "unavailable" && a.length)
    throw new Error("Unavailable quote data cannot contain observations");
  const f = ze(n.funding, "funding");
  let d;
  if (f.availability === "available")
    Mt(f, ["availability", "observations"], "available funding"), d = {
      availability: "available",
      observations: Ul(f.observations, t, i)
    };
  else if (f.availability === "unavailable")
    Mt(f, ["availability", "reason"], "unavailable funding"), d = {
      availability: "unavailable",
      reason: _t(f.reason, "funding reason")
    };
  else
    throw new Error("Funding availability must be available or unavailable");
  const m = Mn(n.venueRuleEvidence, "venueRuleEvidence").map((v, p) => ql(v, t, i, p));
  return zl([
    ...r,
    ...o,
    ...a,
    ...s,
    ...c,
    ...d.availability === "available" ? d.observations : [],
    ...m
  ]), h({
    schemaVersion: br,
    venue: t,
    symbol: i,
    candles: Ql(r),
    trades: Gn(o),
    tradeDataCompleteness: l,
    quotes: Gn(a),
    quoteDataCompleteness: u,
    markPrices: Gn(s),
    indexPrices: Gn(c),
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
class Cd {
  constructor(n) {
    ge(this, "fundingDataAvailable");
    ge(this, "tradeDataCompleteness");
    ge(this, "quoteDataCompleteness");
    Z(this, oe);
    const t = Bl(n);
    this.fundingDataAvailable = t.funding.availability === "available", this.tradeDataCompleteness = t.tradeDataCompleteness, this.quoteDataCompleteness = t.quoteDataCompleteness, te(this, oe, new Il({
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
function Vl(e, n, t) {
  const i = /* @__PURE__ */ new Set();
  return Mn(e, "candles").map((r, o) => {
    const a = ze(r, `candles[${o}]`);
    if (a.schemaVersion !== Fi) throw new Error(`Invalid candle schema at ${o}`);
    const s = Hi(a);
    gt(a, s, `candle ${o}`), _n(s, n, t, `candle ${o}`);
    const c = `${s.timeframe}:${s.openTime}`;
    if (i.has(c)) throw new Error(`Duplicate candle interval ${c}`);
    return i.add(c), s;
  });
}
function $l(e, n, t) {
  return Mn(e, "trades").map((i, r) => {
    const o = ze(i, `trades[${r}]`);
    if (o.schemaVersion !== $o) throw new Error(`Invalid trade schema at ${r}`);
    const a = jo(o);
    return gt(o, a, `trade ${r}`), _n(a, n, t, `trade ${r}`), a;
  });
}
function Nt(e, n, t, i) {
  return Mn(e, i).map((r, o) => {
    const a = ze(r, `${i}[${o}]`);
    if (a.schemaVersion !== Uo) throw new Error(`Invalid quote schema at ${i}[${o}]`);
    const s = Wo(a);
    return gt(a, s, `${i}[${o}]`), _n(s, n, t, `${i}[${o}]`), s;
  });
}
function Ul(e, n, t) {
  return Mn(e, "funding observations").map((i, r) => {
    const o = ze(i, `funding[${r}]`);
    if (o.schemaVersion !== qo) throw new Error(`Invalid funding schema at ${r}`);
    const a = Go(o);
    return gt(o, a, `funding ${r}`), _n(a, n, t, `funding ${r}`), a;
  });
}
function ql(e, n, t, i) {
  const r = ze(e, `venueRuleEvidence[${i}]`);
  if (r.schemaVersion !== Li || r.canonicalConfigHash !== Di(r)) throw new Error(`Invalid venue-rule evidence at ${i}`);
  return _n(r, n, t, `venueRuleEvidence[${i}]`), h(r);
}
function gt(e, n, t) {
  if (S(e) !== S(n))
    throw new Error(`Non-canonical or unknown fields in ${t}`);
}
function _n(e, n, t, i) {
  if (e.venue.toLowerCase() !== n.toLowerCase() || e.symbol.toUpperCase() !== t)
    throw new Error(`${i} instrument identity mismatch`);
}
function zl(e) {
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
function Ql(e) {
  return [...e].sort(
    (n, t) => n.openTime - t.openTime || n.knownAt - t.knownAt || n.id.localeCompare(t.id)
  );
}
function Gn(e) {
  return [...e].sort(
    (n, t) => n.eventTime - t.eventTime || n.knownAt - t.knownAt || n.id.localeCompare(t.id)
  );
}
function ze(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new TypeError(`${n} must be an object`);
  return e;
}
function Mn(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
function _t(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} must be a non-empty string`);
  return e;
}
function Mt(e, n, t) {
  const i = [...n].sort(), r = Object.keys(e).sort();
  if (S(r) !== S(i))
    throw new Error(`${t} has missing or unknown fields`);
}
const jl = "execution-reveal-envelope.1";
function xd(e) {
  const { replaySession: n, replayOutcomeEnvelope: t, executionSession: i } = e, { id: r, ...o } = t;
  if (t.schemaVersion !== Pi || t.id !== `replay-outcome:${T(o).slice(8)}` || n.state !== "Revealed" || n.revealedOutcomeEnvelopeId == null || n.revealedOutcomeEnvelopeId !== t.id || t.sessionId !== n.id) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (i.replaySessionId !== n.id || i.result == null || !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(i.state)) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (i.result.executionSessionId !== i.id)
    throw new Error("Execution result identity mismatch");
  if (!Number.isFinite(e.revealedAt) || e.revealedAt < 0)
    throw new RangeError("Execution reveal time must be a valid timestamp");
  const a = {
    schemaVersion: jl,
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
    id: `execution-reveal:${T(a).slice(8)}`
  });
}
const Ae = /* @__PURE__ */ new Set([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed"
]);
function Bi(e) {
  wu(e);
  const n = e.tradePlan, t = e.replayFrame, i = t.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, r = {
    schemaVersion: Bo,
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
    executionEngineVersion: Nn,
    executionProfileRef: Zn(e.executionProfile),
    venueRulesRef: Zn(e.venueRules),
    feeScheduleRef: Zn(e.feeSchedule),
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: e.dataBundle.fundingDataFingerprint,
    decisionTime: t.effectiveAsOf,
    orderActivationTime: i,
    executionHorizonTime: i + e.executionProfile.maximumExecutionHorizon
  }, o = {
    ...r,
    id: `execution-session:${T(r).slice(8)}`
  }, a = {
    ...o,
    revision: 0,
    currentAsOf: o.decisionTime,
    state: "Created",
    stateSince: o.decisionTime,
    orders: [],
    fills: [],
    positionLedger: yu(e),
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
  }), ji(a);
}
function Wl(e, n, t) {
  if (Wi(e), Eu(e, n), Cu(t, "targetAsOf"), t < e.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (Ae.has(e.state)) return h(e);
  const i = Yl(n, t);
  if (i.executionEvents.length < e.executionEvents.length)
    throw new Error("Execution target precedes already processed causal events");
  const r = i.executionEvents.slice(0, e.executionEvents.length);
  if (S(r) !== S(e.executionEvents))
    throw new Error("Execution history changed under the same session identity");
  return i;
}
function Gl(e, n) {
  const t = n.executionProfile.forceCloseAtHorizon ? 2 * Math.max(...n.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(_)) : 0;
  return Wl(e, n, e.executionHorizonTime + t);
}
function Pd(e) {
  return Gl(Bi(e), e);
}
function Yl(e, n) {
  const t = Bi(e), i = Tu(t);
  if (n < i.orderActivationTime) return t;
  Kl(i, e);
  const r = e.executionProfile.forceCloseAtHorizon ? n : Math.min(n, i.executionHorizonTime), o = Xl(e, r), a = e.dataBundle.funding.filter((c) => c.knownAt <= r);
  let s = 0;
  for (const c of o) {
    if (Ae.has(i.state)) break;
    for (; s < a.length && a[s].fundingTime < c.eventTime && (Ft(i, e, a[s++], null), !Ae.has(i.state)); )
      ;
    if (Ae.has(i.state) || cu(i, e, c.eventTime, n)) break;
    if (e.executionProfile.forceCloseAtHorizon && c.eventTime >= i.executionHorizonTime && (i.state === "Open" || i.state === "PartiallyClosed")) {
      Ko(i, e, c);
      break;
    }
    eu(i, e, c);
    const l = i.fills.length;
    nu(i, e, c);
    const u = i.fills.length > l;
    for (; s < a.length && a[s].fundingTime >= c.eventTime && a[s].fundingTime < c.intervalEnd && (Ft(i, e, a[s++], u ? c : null), !Ae.has(i.state)); )
      ;
    Ae.has(i.state) || $(i, {
      type: "PathResolved",
      eventTime: c.intervalEnd,
      processingAsOf: c.processingAsOf,
      sourceObservationIds: [c.id],
      explanation: `Execution interval resolved with ${c.resolution} ${c.exact ? "ordered" : "OHLC"} data`
    });
  }
  for (; !Ae.has(i.state) && s < a.length && a[s].fundingTime <= Math.min(n, i.executionHorizonTime); ) Ft(i, e, a[s++], null);
  return Ae.has(i.state) || su(i, e, o, n), ji(i);
}
function Kl(e, n) {
  const t = n.tradePlan, i = t.entryPlan.orderPlanType === "marketNextAvailable" ? "entryMarket" : t.entryPlan.orderPlanType === "limit" ? "entryLimit" : "entryStopMarket", r = it(e.id, {
    kind: i,
    side: "sell",
    quantity: t.sizingResult.roundedQuantity,
    remainingQuantity: t.sizingResult.roundedQuantity,
    limitPrice: i === "entryLimit" ? Sn(t.entryPlan.intendedPrice, n.venueRules.priceTick, "up") : null,
    triggerPrice: i === "entryStopMarket" ? Sn(t.entryPlan.intendedPrice, n.venueRules.priceTick, "down") : null,
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
function Xl(e, n) {
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
    const f = Zl(e, u, n) ?? [u];
    for (const d of f)
      d.closeTime <= t || d.openTime > r || c.push(Jl(d));
  }
  return [...new Map(c.map((u) => [u.id, u])).values()].sort(
    (u, f) => u.eventTime - f.eventTime || u.processingAsOf - f.processingAsOf || u.id.localeCompare(f.id)
  );
}
function Zl(e, n, t) {
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
function Jl(e) {
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
function eu(e, n, t) {
  const i = {
    schemaVersion: Cl,
    intervalStart: t.eventTime,
    intervalEnd: t.intervalEnd,
    requestedResolution: n.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: t.resolution,
    dataSource: t.exact ? "trades" : "candles",
    dataFingerprint: T([t.id]),
    exactOrApproximate: t.exact ? "exact" : "approximate",
    sourceObservationIds: [t.id],
    ambiguities: []
  }, r = {
    ...i,
    id: `execution-path:${T(i).slice(8)}`
  };
  e.pathResolutionRecords.push(r);
}
function nu(e, n, t) {
  e.state === "PendingEntry" && tu(e, n, t), (e.state === "Open" || e.state === "PartiallyClosed") && (mu(e, t), ru(e, n, t));
}
function tu(e, n, t) {
  const i = qi(e);
  if (!i || t.eventTime < i.activationTime) return;
  let r = null, o = i.liquidityAssumption, a = 0;
  if (i.kind === "entryMarket")
    r = t.open, o = "taker", a = n.executionProfile.slippageModel.marketEntryBps;
  else if (i.kind === "entryLimit") {
    const u = i.limitPrice;
    t.open >= u ? (r = t.open, o = "assumedTaker") : pu(t, u, n.executionProfile.restingLimitFillPolicy, n.venueRules.priceTick) && (r = u, o = "assumedMaker");
  } else {
    const u = i.triggerPrice;
    t.open <= u ? r = t.open : t.low <= u && (r = u), r != null && (o = "taker", a = n.executionProfile.slippageModel.marketEntryBps);
  }
  if (r == null) return;
  const s = Au(n, t);
  if (!t.exact && i.kind !== "entryMarket" && s.length) {
    tt(e, n, t, [i.id, ...s], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const c = At(e, n, i, t, r, o, a, "entry"), l = c.price * c.quantity;
  if (c.quantity < n.venueRules.minimumQuantity || l < n.venueRules.minimumNotional || n.venueRules.maximumQuantity != null && c.quantity > n.venueRules.maximumQuantity || n.venueRules.maximumNotional != null && l > n.venueRules.maximumNotional) {
    Rn(e, n, t.eventTime, t.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(c), uu(e, n, c), $(e, {
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
  }), iu(e, n, c);
}
function iu(e, n, t) {
  const i = it(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: t.quantity,
    remainingQuantity: t.quantity,
    limitPrice: null,
    triggerPrice: Sn(n.tradePlan.stopPlan.stopPrice, n.venueRules.priceTick, "up"),
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
  const r = hu(t.quantity, n.tradePlan.targetPlans.map((o) => ({
    id: o.id,
    fraction: o.positionFraction
  })), n.venueRules.quantityStep);
  for (const o of [...n.tradePlan.targetPlans].sort((a, s) => s.targetPrice - a.targetPrice || a.id.localeCompare(s.id))) {
    const a = r[o.id] ?? 0;
    if (a <= 0) continue;
    const s = it(e.id, {
      kind: "target",
      side: "buy",
      quantity: a,
      remainingQuantity: a,
      limitPrice: Sn(o.targetPrice, n.venueRules.priceTick, "down"),
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
function ru(e, n, t) {
  const i = na(e), r = Qi(e), o = i ? Xo(n, t, i.triggerPrice) : null;
  if (o != null && o.unavailable) {
    Rn(
      e,
      n,
      t.eventTime,
      t.processingAsOf,
      `Required ${n.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`
    );
    return;
  }
  const a = (o == null ? void 0 : o.touched) ?? !1, s = r.filter(
    (l) => gu(t, l.limitPrice, n.executionProfile.targetFillPolicy, n.venueRules.priceTick)
  );
  if (!t.exact && a && s.length) {
    tt(
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
    }), tt(e, n, t, i ? [i.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (a) {
    au(e, n, t, i, (o == null ? void 0 : o.referencePrice) ?? i.triggerPrice);
    return;
  }
  for (const l of s.sort((u, f) => f.limitPrice - u.limitPrice || u.id.localeCompare(f.id))) {
    if (e.positionLedger.remainingQuantity <= 0) break;
    ou(e, n, t, l);
  }
}
function ou(e, n, t, i) {
  const r = Math.min(i.remainingQuantity, e.positionLedger.remainingQuantity), o = At(e, n, i, t, i.limitPrice, "assumedMaker", 0, "target", r);
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(o), $i(e, o), delete e.positionLedger.openTargetQuantities[i.parentTargetId], $(e, {
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
  const a = na(e);
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
  a && Ui(e, a, t, "All planned target quantity filled"), Vi(e, n, t, "AllTargets", o);
}
function au(e, n, t, i, r) {
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
  const a = At(
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
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(a), $i(e, a), e.positionLedger.remainingProtectiveStopQuantity = 0, $(e, {
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
  for (const c of Qi(e)) Ui(e, c, t, "Protective stop closed the position");
  const s = e.fills.some((c) => {
    var l;
    return ((l = Ue(e, c.orderId)) == null ? void 0 : l.kind) === "target";
  });
  Vi(e, n, t, s ? "StopAfterPartialTargets" : "Stop", a);
}
function Vi(e, n, t, i, r) {
  fu(e), e.result = on(e, n, "Closed", i, null), $(e, {
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
function Ft(e, n, t, i) {
  if (e.state !== "Open" && e.state !== "PartiallyClosed" || e.fundingRecords.some((m) => m.observationId === t.id)) return;
  if (i && n.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    tt(
      e,
      n,
      i,
      ta(e).map((m) => m.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN"
    );
    return;
  }
  const r = t.markPrice;
  if (r == null) {
    e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE") || e.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), n.executionProfile.fundingPolicy.absence === "requireComplete" && Rn(e, n, t.fundingTime, t.knownAt, "Funding reference price is unavailable");
    return;
  }
  const o = n.venueRules.fundingConvention.sameTimestampOrdering, a = e.fills.filter((m) => m.eventTime === t.fundingTime), s = a.find((m) => m.side === "sell"), c = a.filter((m) => m.side === "buy"), l = o === "fundingBeforePosition" ? Oe(
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
    id: `execution-funding:${T(f).slice(8)}`
  };
  e.fundingRecords.push(d), u >= 0 ? e.positionLedger.fundingReceived = B(e.positionLedger.fundingReceived + u) : e.positionLedger.fundingPaid = B(e.positionLedger.fundingPaid + -u), e.positionLedger.netFunding = B(
    e.positionLedger.fundingReceived - e.positionLedger.fundingPaid
  ), Fn(e), $(e, {
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
function su(e, n, t, i) {
  const r = ea(e, n);
  if ((e.state === "Created" || e.state === "PendingEntry") && i >= r) {
    if (!Er(t, r, n)) {
      Rn(e, n, r, i, "Price data does not cover the entry expiry window");
      return;
    }
    const a = qi(e);
    a && (a.status = "expired", $(e, {
      type: "EntryOrderExpired",
      eventTime: r,
      processingAsOf: r,
      stateAfter: "EntryExpired",
      orderIds: [a.id],
      quantity: a.quantity,
      explanation: "Entry remained unfilled through its deterministic expiry"
    }), e.result = on(e, n, "EntryExpired", null, null), jt(e));
    return;
  }
  if (i < e.executionHorizonTime || e.state !== "Open" && e.state !== "PartiallyClosed") return;
  const o = [...t].reverse().find((a) => a.eventTime <= e.executionHorizonTime);
  if (!o || !Er(t, e.executionHorizonTime, n)) {
    Rn(e, n, e.executionHorizonTime, i, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (n.executionProfile.forceCloseAtHorizon) {
    const a = t.find((s) => s.eventTime >= e.executionHorizonTime);
    if (!a) return;
    Ko(e, n, a);
    return;
  }
  du(e, o.close), $(e, {
    type: "ExecutionHorizonReached",
    eventTime: e.executionHorizonTime,
    processingAsOf: Math.max(e.executionHorizonTime, o.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: o.close,
    sourceObservationIds: [o.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon"
  }), e.result = on(e, n, "OpenAtHorizon", null, null), jt(e);
}
function Er(e, n, t) {
  const i = [...e].reverse().find((o) => o.eventTime <= n);
  if (!i) return !1;
  const r = _(t.strategyProfile.timeframeRoles.executionTimeframe);
  return n - i.intervalEnd <= r;
}
function Ko(e, n, t) {
  const i = it(e.id, {
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
  const r = At(
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
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(r), $i(e, r);
  for (const o of ta(e).filter((a) => a.id !== i.id))
    Ui(e, o, t, "Forced horizon close cancelled protection");
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
  }), Vi(e, n, t, "ForcedHorizonClose", r);
}
function cu(e, n, t, i) {
  if (e.state !== "PendingEntry") return !1;
  const r = ea(e, n);
  if (t < r || i < r) return !1;
  const o = qi(e);
  return o.status = "expired", $(e, {
    type: "EntryOrderExpired",
    eventTime: r,
    processingAsOf: r,
    stateAfter: "EntryExpired",
    orderIds: [o.id],
    quantity: o.quantity,
    explanation: "Entry expired before the next eligible observation"
  }), e.result = on(e, n, "EntryExpired", null, null), jt(e), !0;
}
function tt(e, n, t, i, r) {
  const o = lu(e, n, t, i), a = o.map((l) => l.estimatedNetPnl).filter((l) => l != null), s = {
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
  c && !c.ambiguities.includes(r) && c.ambiguities.push(r), e.result = on(e, n, "Ambiguous", null, s), $(e, {
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
function lu(e, n, t, i) {
  const r = zi(e), o = (r == null ? void 0 : r.quantity) ?? n.tradePlan.sizingResult.roundedQuantity, a = r ? e.positionLedger.remainingQuantity : o, s = (r == null ? void 0 : r.price) ?? n.tradePlan.entryPlan.intendedPrice, c = Zo(
    Math.max(t.open, n.tradePlan.stopPlan.stopPrice),
    n.executionProfile.slippageModel.stopExitBps,
    "buy",
    n.venueRules.priceTick
  ).price, l = e.positionLedger.realizedGrossPnl, u = e.positionLedger.totalFees || B(o * s * n.feeSchedule.takerRate), f = B(
    l + a * (s - c) - u - a * c * n.feeSchedule.takerRate + e.positionLedger.netFunding
  ), d = [{
    id: `execution-branch:${T([e.id, t.id, "stop-first"]).slice(8)}`,
    label: "stop-first",
    orderedOrderIds: i.filter((p) => {
      var y;
      return p.includes("stop") || ((y = Ue(e, p)) == null ? void 0 : y.kind) === "protectiveStop";
    }),
    estimatedNetPnl: f
  }], m = Qi(e).filter((p) => i.includes(p.id)).sort((p, y) => y.limitPrice - p.limitPrice || p.id.localeCompare(y.id)), v = m.length ? m.map((p) => ({ quantity: p.remainingQuantity, price: p.limitPrice, id: p.id })) : [...n.tradePlan.targetPlans].filter((p) => i.includes(p.id)).sort((p, y) => y.targetPrice - p.targetPrice || p.id.localeCompare(y.id)).map((p) => ({
    quantity: Jo(o * p.positionFraction, n.venueRules.quantityStep),
    price: p.targetPrice,
    id: p.id
  }));
  if (v.length) {
    let p = a, y = l, g = u;
    const w = [];
    for (const P of v) {
      const b = Math.min(p, P.quantity);
      b <= 0 || (y += b * (s - P.price), g += b * P.price * n.feeSchedule.makerRate, p = Oe(p - b, 12), w.push(P.id));
    }
    i.some((P) => {
      var b;
      return P.includes("stop") || ((b = Ue(e, P)) == null ? void 0 : b.kind) === "protectiveStop";
    }) && p > 0 && (y += p * (s - c), g += p * c * n.feeSchedule.takerRate, w.push(...i.filter((P) => {
      var b;
      return P.includes("stop") || ((b = Ue(e, P)) == null ? void 0 : b.kind) === "protectiveStop";
    })));
    const O = B(y - g + e.positionLedger.netFunding);
    d.push({
      id: `execution-branch:${T([e.id, t.id, "target-first"]).slice(8)}`,
      label: "target-first",
      orderedOrderIds: w,
      estimatedNetPnl: O
    });
  }
  return d;
}
function Rn(e, n, t, i, r) {
  e.errors.push(r), e.result = on(e, n, "Failed", null, null), $(e, {
    type: "ExecutionFailed",
    eventTime: t,
    processingAsOf: i,
    stateAfter: "Failed",
    explanation: r
  });
}
function At(e, n, t, i, r, o, a, s, c = t.quantity) {
  const l = a > 0 ? Zo(r, a, t.side, n.venueRules.priceTick) : { price: r, adjustment: 0 }, u = a > 0 ? {
    model: n.executionProfile.slippageModel.model,
    version: n.executionProfile.slippageModel.version,
    bps: a,
    referencePrice: r,
    signedPriceAdjustment: l.adjustment,
    finalFillPrice: l.price
  } : null, f = o === "maker" || o === "assumedMaker" ? n.feeSchedule.makerRate : n.feeSchedule.takerRate, d = {
    schemaVersion: Tl,
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
    feeScheduleRef: Zn(n.feeSchedule),
    sourceObservationIds: [i.id],
    dataQualityNotes: [
      ...i.exact ? [] : [`${s.toUpperCase()}_CANDLE_APPROXIMATION`],
      ...o.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []
    ]
  };
  return {
    ...d,
    id: `execution-fill:${T(d).slice(8)}`
  };
}
function uu(e, n, t) {
  const i = e.positionLedger;
  i.originalFilledQuantity = t.quantity, i.remainingQuantity = t.quantity, i.averageEntryPrice = t.price, i.initialNotional = B(t.quantity * t.price), i.initialMargin = B(i.initialNotional / i.selectedLeverage), i.maximumMarginUsed = i.initialMargin, i.marginAllocation = i.initialMargin, i.entryFees = t.feeAmount, i.totalFees = t.feeAmount, i.remainingProtectiveStopQuantity = t.quantity, i.bankruptcyBoundApprox = t.price + i.initialMargin / t.quantity, Fn(e);
}
function $i(e, n) {
  const t = e.positionLedger, i = t.originalFilledQuantity - t.remainingQuantity, r = i + n.quantity;
  t.averageExitPrice = r > 0 ? B(((t.averageExitPrice ?? 0) * i + n.price * n.quantity) / r) : null, t.realizedGrossPnl = B(
    t.realizedGrossPnl + n.quantity * (t.averageEntryPrice - n.price)
  ), t.remainingQuantity = Oe(
    Math.max(0, t.remainingQuantity - n.quantity),
    12
  ), t.exitFees = B(t.exitFees + n.feeAmount), t.totalFees = B(t.entryFees + t.exitFees), t.remainingProtectiveStopQuantity = t.remainingQuantity, Fn(e);
}
function fu(e) {
  const n = e.positionLedger;
  n.remainingQuantity = 0, n.unrealizedGrossPnl = 0, n.unrealizedNetPnlExcludingUnknownFutureCosts = 0, n.remainingProtectiveStopQuantity = 0, n.openTargetQuantities = {}, Fn(e), n.accountEquityAfter = B(n.accountEquityBefore + n.realizedNetPnl);
}
function du(e, n) {
  const t = e.positionLedger;
  t.unrealizedGrossPnl = B(t.remainingQuantity * (t.averageEntryPrice - n)), t.unrealizedNetPnlExcludingUnknownFutureCosts = t.unrealizedGrossPnl, Fn(e);
}
function Fn(e) {
  const n = e.positionLedger;
  n.realizedNetPnl = B(n.realizedGrossPnl - n.totalFees + n.netFunding);
}
function mu(e, n) {
  const t = zi(e);
  if (!t) return;
  const i = Ue(e, t.orderId);
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
function on(e, n, t, i, r) {
  var w;
  const o = zi(e), a = e.fills.filter((E) => E.side === "buy").map((E) => {
    const O = Ue(e, E.orderId), P = O.kind === "target" ? "target" : i === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: E.id,
      kind: P,
      targetId: O.parentTargetId,
      quantity: E.quantity,
      price: E.price,
      eventTime: E.eventTime,
      grossPnl: o ? B(E.quantity * (o.price - E.price)) : 0,
      fee: E.feeAmount
    };
  }), s = a.find((E) => E.kind === "stop") ?? null, c = vu(e, o), l = !n.dataBundle.fundingDataAvailable || e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), u = B(
    e.positionLedger.realizedNetPnl + e.positionLedger.unrealizedGrossPnl
  ), f = r ? "ambiguous" : l ? "fundingIncomplete" : "complete", d = f === "complete" ? u : null, m = n.tradePlan.sizingResult.projectedLossAtStop, v = n.tradePlan.sizingResult.riskBudget, p = a.filter((E) => E.kind === "target").map((E) => E.eventTime).sort()[0] ?? null, y = a.length ? Math.max(...a.map((E) => E.eventTime)) : null, g = {
    schemaVersion: Rl,
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
    usedMarketDataFingerprint: T(
      e.pathResolutionRecords.flatMap((E) => E.sourceObservationIds)
    ),
    pathResolutionRecords: h(e.pathResolutionRecords),
    fundingDataFingerprint: n.dataBundle.fundingDataAvailable ? T(e.fundingRecords.map((E) => E.observationId)) : null,
    status: t,
    closeReason: i,
    entrySummary: o,
    exitSummary: a,
    targetSummary: a.filter((E) => E.kind === "target"),
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
    stopSlippage: s ? ((w = e.fills.find((E) => E.id === s.fillId)) == null ? void 0 : w.slippage) ?? null : null,
    actualVsProjectedStopLoss: s && m ? B(-e.positionLedger.realizedNetPnl - m) : null,
    ambiguity: r,
    dataQualityNotes: [...new Set(e.dataQualityNotes)],
    executionModelVersion: Nn
  };
  return {
    ...g,
    id: `execution-result:${T(g).slice(8)}`
  };
}
function vu(e, n) {
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
    excursionResolution: bu(e.excursionObservations.map((r) => r.resolution))
  };
}
function $(e, n) {
  const t = e.state, i = e.executionEvents.at(-1);
  if (i && n.processingAsOf < i.processingAsOf)
    throw new Error("Execution event processing time cannot move backward");
  n.stateAfter && n.stateAfter !== t && (ia(t, n.stateAfter), e.state = n.stateAfter, e.stateSince = n.eventTime), e.currentAsOf = Math.max(e.currentAsOf, n.processingAsOf);
  const r = {
    schemaVersion: Vo,
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
    id: `execution-event:${T(r).slice(8)}`
  };
  e.executionEvents.push(o), e.revision = e.executionEvents.length;
}
function jt(e) {
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
    id: `execution-event:${T(r).slice(8)}`
  }), e.revision = e.executionEvents.length;
}
function Ui(e, n, t, i) {
  n.status = "cancelled", n.remainingQuantity = 0, n.parentTargetId && delete e.positionLedger.openTargetQuantities[n.parentTargetId], $(e, {
    type: "OrderCancelled",
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    orderIds: [n.id],
    sourceObservationIds: [t.id],
    explanation: i
  });
}
function it(e, n) {
  const t = { schemaVersion: El, ...n };
  return {
    ...t,
    id: `execution-order:${T([e, t]).slice(8)}`
  };
}
function yu(e) {
  return {
    schemaVersion: Pl,
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
function hu(e, n, t) {
  const i = {};
  let r = 0;
  if (n.forEach((o, a) => {
    const s = a === n.length - 1 ? Oe(e - r, rt(t)) : Jo(e * o.fraction, t);
    i[o.id] = Math.max(0, s), r = Oe(r + s, rt(t));
  }), r > e + t * 1e-9) throw new Error("Target allocation exceeds filled position");
  return i;
}
function pu(e, n, t, i) {
  return t.policy === "ExactDataRequired" ? e.exact && e.high >= n : t.policy === "PenetrationByTicks" ? e.high >= n + t.penetrationTicks * i : e.high >= n;
}
function gu(e, n, t, i) {
  return t.policy === "ExactDataRequired" ? e.exact && e.low <= n : t.policy === "PenetrationByTicks" ? e.low <= n - t.penetrationTicks * i : e.low <= n;
}
function Xo(e, n, t) {
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
function Au(e, n) {
  const t = [];
  Xo(e, n, e.tradePlan.stopPlan.stopPrice).touched && t.push("planned-stop");
  for (const i of e.tradePlan.targetPlans) n.low <= i.targetPrice && t.push(i.id);
  return t;
}
function Zo(e, n, t, i) {
  const r = t === "sell" ? e * (1 - n / 1e4) : e * (1 + n / 1e4), o = Sn(r, i, t === "sell" ? "down" : "up");
  return { price: o, adjustment: B(o - e) };
}
function Sn(e, n, t) {
  const i = t === "up" ? Math.ceil(e / n - 1e-12) : Math.floor(e / n + 1e-12);
  return Oe(i * n, rt(n));
}
function Jo(e, n) {
  return Oe(Math.floor(e / n + 1e-12) * n, rt(n));
}
function B(e) {
  return Oe(e, 12);
}
function Oe(e, n) {
  return Number(e.toFixed(Math.min(15, Math.max(n, 0))));
}
function rt(e) {
  const n = e.toString().toLowerCase();
  return n.includes("e-") ? Number(n.split("e-")[1]) : n.includes(".") ? n.length - n.indexOf(".") - 1 : 0;
}
function ea(e, n) {
  return Math.min(
    n.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    e.executionHorizonTime
  );
}
function qi(e) {
  return e.orders.find((n) => n.kind.startsWith("entry") && n.status === "active") ?? null;
}
function zi(e) {
  return e.fills.find((n) => {
    var t;
    return (t = Ue(e, n.orderId)) == null ? void 0 : t.kind.startsWith("entry");
  }) ?? null;
}
function na(e) {
  return e.orders.find((n) => n.kind === "protectiveStop" && n.status === "active") ?? null;
}
function Qi(e) {
  return e.orders.filter((n) => n.kind === "target" && n.status === "active");
}
function ta(e) {
  return e.orders.filter(
    (n) => (n.kind === "protectiveStop" || n.kind === "target") && n.status === "active"
  );
}
function Ue(e, n) {
  return e.orders.find((t) => t.id === n) ?? null;
}
function Zn(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function bu(e) {
  return e.includes("trade") ? "trade" : [...e].sort((n, t) => _(n) - _(t))[0] ?? null;
}
function ia(e, n) {
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
function wu(e) {
  if (e.dataBundle.schemaVersion !== "execution-data-bundle.1" || e.executionProfile.executionEngineVersion !== Nn) throw new Error("Execution case identity is invalid");
  if (e.tradePlan.snapshotId !== e.replayFrame.decisionSnapshot.id)
    throw new Error("Execution TradePlan snapshot mismatch");
}
function Eu(e, n) {
  const t = Bi(n), i = Wt(e), r = Wt(t);
  if (S(i) !== S(r))
    throw new Error("Execution session does not match the loaded case");
}
function Tu(e) {
  const n = JSON.parse(S(e)), { integrityHash: t, ...i } = n;
  return i;
}
function ji(e) {
  const n = h(e);
  return h({ ...n, integrityHash: T(n) });
}
function Wt(e) {
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
function Wi(e) {
  if (e.schemaVersion !== Bo)
    throw new Error("Unsupported execution session schema");
  const { integrityHash: n, ...t } = e;
  if (T(t) !== n) throw new Error("Execution session integrity mismatch");
  const i = Ru(e);
  if (S(i) !== S(e))
    throw new Error("Execution event-log reconstruction differs from direct state");
}
function Ru(e) {
  var i;
  const n = Wt(e), t = {
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
    if (r.schemaVersion !== Vo || r.executionSessionId !== e.id || r.sequence !== t.executionEvents.length || o !== `execution-event:${T(a).slice(8)}` || r.stateBefore !== t.state) throw new Error(`Invalid execution event ${r.id}`);
    if (r.stateAfter !== r.stateBefore && ia(r.stateBefore, r.stateAfter), r.processingAsOf < t.currentAsOf)
      throw new Error(`Execution event processing time moved backward at ${r.id}`);
    t.state = r.stateAfter, r.stateAfter !== r.stateBefore && (t.stateSince = r.eventTime), t.currentAsOf = Math.max(t.currentAsOf, r.processingAsOf), t.orders = h(r.ordersAfter), t.fills = h(r.fillsAfter), t.positionLedger = h(r.positionLedgerAfter), t.pathResolutionRecords = h(r.pathResolutionRecordsAfter), t.fundingRecords = h(r.fundingRecordsAfter), t.excursionObservations = h(r.excursionObservationsAfter), t.result = h(r.resultAfter), t.dataQualityNotes = [...r.sessionDataQualityNotesAfter], t.errors = [...r.errorsAfter], Su(t, r), t.executionEvents.push(h(r)), t.revision += 1;
  }
  return ji(t);
}
function Su(e, n) {
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
    if (s !== `execution-result:${T(c).slice(8)}`)
      throw new Error(`Execution result identity mismatch at ${n.id}`);
  }
}
function Id(e) {
  return Wi(e), S(e);
}
function kd(e) {
  const n = JSON.parse(e);
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new TypeError("Serialized execution session must be an object");
  const t = n;
  return Wi(t), h(t);
}
function Cu(e, n) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${n} must be a valid timestamp`);
}
const Ln = Ie, Qe = "replay-analysis-engine.1", ra = "replay-analysis-profile.1", oa = "replay-analysis-state.2", xu = "replay-analysis-observation.1", Od = "replay-analysis-frame.1", Pu = "replay-analysis-data-bundle.1", aa = "avwap-anchor-spec.1", Gt = "relative-ratio.1", Iu = {
  windowSeconds: 86400,
  historyDays: 180,
  minSamples: 20,
  emaPeriod: 20,
  atrPeriod: 14
}, Tr = {
  lookback: 500,
  pivotStrength: 3,
  atrPeriod: 14,
  minMoveAtr: 0.75,
  maxSwings: 120,
  maxBreaks: 24
};
function sa(e) {
  const { canonicalConfigHash: n, ...t } = e;
  return T(t);
}
function ku(e, n) {
  if (e.schemaVersion !== ra || e.analysisEngineVersion !== Qe)
    throw new RangeError("Unsupported replay analysis profile version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay analysis profile id and version are required");
  const t = Xt(e.evaluatedTimeframes);
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
    contextTimeframes: Xt(e.contextTimeframes),
    referenceMarketPolicy: {
      ...e.referenceMarketPolicy,
      symbol: e.referenceMarketPolicy.symbol.toUpperCase()
    }
  });
  return h({
    ...i,
    canonicalConfigHash: sa(i)
  });
}
function Nd(e, n = {}) {
  const t = Xt([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]), i = e.lifecycleConfigHash;
  return ku(
    {
      id: "impulse_fade_v1.replay-analysis.experimental",
      version: "1",
      schemaVersion: ra,
      analysisEngineVersion: Qe,
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
      extensionConfig: Iu,
      stochasticRsiConfig: {
        timeframe: e.timeframeRoles.executionTimeframe,
        rsiPeriod: 14,
        stochPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      },
      structureConfig: Tr,
      supportResistanceConfig: {
        maxZones: 6,
        thicknessBps: 10,
        latestX: 0,
        referencePrice: null,
        zonesPerSide: 3
      },
      relativeStrengthConfig: {
        ...Tr,
        timeframe: e.timeframeRoles.executionTimeframe,
        formulaVersion: Gt,
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
function ca(e) {
  var un, pe, Hn, Bn;
  Ou(e);
  const n = la(e), t = e.analysisProfile, i = e.symbol.toUpperCase(), r = t.referenceMarketPolicy.symbol, o = t.referenceMarketPolicy.source ?? e.source, a = {}, s = {};
  for (const x of t.evaluatedTimeframes)
    a[x] = Ce(
      e.candlesByTimeframe[x] ?? [],
      x,
      n
    ), s[x] = Ce(
      e.referenceCandlesByTimeframe[x] ?? [],
      x,
      n
    );
  const c = T({
    schemaVersion: Pu,
    symbol: i,
    source: e.source,
    referenceSymbol: r,
    referenceSource: o,
    effectiveAsOf: n,
    targetObservationIds: Sr(a),
    referenceObservationIds: Sr(s),
    anchorObservationIds: (e.avwapAnchors ?? []).filter((x) => x.knownAt <= n).map((x) => x.anchorCandleObservationId).sort()
  }), l = T({
    analysisEngineVersion: t.analysisEngineVersion,
    profileHash: t.canonicalConfigHash
  }), u = {}, f = {}, d = {}, m = [], v = [], p = [], y = {}, g = [], w = [];
  for (const x of t.evaluatedTimeframes) {
    const z = a[x], We = qe(z.candles, t.extensionConfig);
    u[x] = We;
    const Ge = x === t.stochasticRsiConfig.timeframe ? Ga(
      z.candles,
      t.stochasticRsiConfig.rsiPeriod,
      t.stochasticRsiConfig.stochPeriod,
      t.stochasticRsiConfig.kPeriod,
      t.stochasticRsiConfig.dPeriod
    ) : null;
    f[x] = {
      ema: Ze(Wa(z.candles, t.extensionConfig.emaPeriod)),
      atr: Ze(Ya(z.candles, t.extensionConfig.atrPeriod)),
      stochRsi: Ge ? { k: Ze(Ge.k), d: Ze(Ge.d) } : null,
      configurationHash: T({
        extension: t.extensionConfig,
        stochasticRsi: x === t.stochasticRsiConfig.timeframe ? t.stochasticRsiConfig : null
      })
    };
    const ce = Be(z.candles, t.structureConfig), Et = T(t.structureConfig), Na = Je({
      logicalId: `market-structure:${e.source}:${i}:${x}`,
      component: `structure:${x}`,
      timeframe: x,
      eventTime: ce.summary.updatedTs ?? n,
      knownAt: Math.max(
        ((un = ce.summary.lastBreak) == null ? void 0 : un.knownAt) ?? 0,
        ((pe = ce.summary.lastSwingHigh) == null ? void 0 : pe.knownAt) ?? 0,
        ((Hn = ce.summary.lastSwingLow) == null ? void 0 : Hn.knownAt) ?? 0
      ) || n,
      evaluatedAt: n,
      configurationHash: Et,
      sourceObservationIds: z.replay.map((U) => U.observationId),
      value: ce
    });
    d[x] = { timeframe: x, observation: Na };
    for (const U of ce.breaks)
      m.push(Je({
        logicalId: Vu(e.source, i, x, U),
        component: "structureEvent",
        timeframe: x,
        eventTime: U.eventTime,
        knownAt: U.knownAt,
        evaluatedAt: Yt(U.knownAt, t.executionTimeframe),
        configurationHash: Et,
        sourceObservationIds: Kt(z, U.knownAt),
        value: U
      }));
    for (const U of ds(ce))
      v.push(Bu(e, x, U));
    const Ye = z.candles.at(-1), _a = {
      ...t.supportResistanceConfig,
      latestX: (Ye == null ? void 0 : Ye.x) ?? 0,
      referencePrice: (Ye == null ? void 0 : Ye.c) ?? null
    }, er = to(ce.swings, _a);
    w.push(...er);
    const nr = T(t.supportResistanceConfig);
    for (const U of er) {
      const tr = $u(ce.swings, U, e, x);
      p.push(Je({
        logicalId: `sr-zone:${e.source}:${i}:${x}:${U.kind}:${tr[0] ?? U.eventTime}`,
        component: "supportResistanceZone",
        timeframe: x,
        eventTime: U.eventTime,
        knownAt: U.knownAt,
        evaluatedAt: n,
        configurationHash: nr,
        sourceObservationIds: Kt(z, U.knownAt),
        value: { ...U, originatingSwingIds: tr }
      }));
    }
    const Tt = `timeframe:${x}`;
    if (y[Tt] = Le(
      Tt,
      n,
      z,
      l,
      qu(t, x)
    ), y[`extension:${x}`] = Le(
      `extension:${x}`,
      n,
      z,
      T(t.extensionConfig),
      Math.max(
        t.extensionConfig.emaPeriod,
        t.extensionConfig.atrPeriod + 1,
        Math.ceil(t.extensionConfig.windowSeconds / _(x)) + 1
      )
    ), y[`structure:${x}`] = Le(
      `structure:${x}`,
      n,
      z,
      Et,
      t.structureConfig.pivotStrength * 2 + 1
    ), y[`supportResistance:${x}`] = Le(
      `supportResistance:${x}`,
      n,
      z,
      nr,
      t.structureConfig.pivotStrength * 2 + 1
    ), x === t.stochasticRsiConfig.timeframe) {
      const U = t.stochasticRsiConfig.rsiPeriod + t.stochasticRsiConfig.stochPeriod + t.stochasticRsiConfig.kPeriod + t.stochasticRsiConfig.dPeriod - 3;
      y[`stochRsi:${x}`] = Le(
        `stochRsi:${x}`,
        n,
        z,
        T(t.stochasticRsiConfig),
        U
      );
    }
    z.candles.length || g.push(Jn("ANALYSIS_COMPONENT_UNAVAILABLE", Tt, "No completed candles"));
  }
  const E = e.strategyProfile.timeframeRoles.candidateTimeframe, O = a[E] ?? Ce(
    e.candlesByTimeframe[E] ?? [],
    E,
    n
  ), P = _u(
    e,
    E,
    O,
    n
  );
  for (const x of P.insufficientDataReasons)
    g.push(Jn(x.code, `extension:${E}`, x.message));
  y.candidateMetrics = {
    ...Le(
      "candidateMetrics",
      n,
      O,
      T(t.extensionConfig),
      t.extensionConfig.minSamples
    ),
    status: P.insufficientDataReasons.length ? "insufficientHistory" : "available"
  };
  const b = t.relativeStrengthConfig.timeframe, A = a[b] ?? Ce(
    e.candlesByTimeframe[b] ?? [],
    b,
    n
  ), C = s[b] ?? Ce(
    e.referenceCandlesByTimeframe[b] ?? [],
    b,
    n
  ), k = Fu(
    e,
    b,
    A,
    C,
    o
  ), j = k.status === "available" ? ms(
    A.candles,
    C.candles,
    t.relativeStrengthConfig
  ).map((x) => {
    var Ge;
    const z = ((Ge = C.replay.find(
      (ce) => ce.openTime === x.bucket
    )) == null ? void 0 : Ge.knownAt) ?? x.knownAt, We = Math.max(x.knownAt, z);
    return Je({
      logicalId: `rs-event:${e.source}:${i}:${b}:${x.kind}:${x.bucket}`,
      component: "relativeStrengthEvent",
      timeframe: b,
      eventTime: x.eventTime,
      knownAt: We,
      evaluatedAt: Yt(
        We,
        e.analysisProfile.executionTimeframe
      ),
      configurationHash: T(t.relativeStrengthConfig),
      sourceObservationIds: zu(A, C, We),
      value: { ...x, knownAt: We }
    });
  }) : [];
  y.relativeStrength = Uu(
    n,
    A,
    C,
    k.status,
    T(t.relativeStrengthConfig)
  ), k.status !== "available" && g.push(Jn(
    k.status === "missingSynchronizedReferenceData" ? "MISSING_SYNCHRONIZED_REFERENCE_DATA" : "ANALYSIS_COMPONENT_UNAVAILABLE",
    "relativeStrength",
    "RS-vs-BTC requires exact completed target/reference bar alignment"
  ));
  const q = Lu(e, a, n);
  g.push(...q.notes), y.avwap = q.freshness;
  const M = Mu(
    e,
    E,
    n
  ), L = ((Bn = d[t.executionTimeframe]) == null ? void 0 : Bn.observation.value) ?? null, F = Yr({
    symbol: i,
    source: e.source,
    venue: e.source,
    executionTimeframe: t.executionTimeframe,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(a).map(([x, z]) => [
        x,
        z.candles
      ])
    ),
    candidateMetrics: M,
    structureEvents: m.map((x) => ({
      ...x.value,
      sourceTimeframe: x.timeframe
    })),
    supportResistanceZones: w,
    avwapEvents: q.events.map((x) => x.value),
    relativeStrengthEvents: j.map((x) => x.value),
    config: e.lifecycleConfig,
    to: n
  }) ?? Hu(e, n, L), Me = {
    schemaVersion: oa,
    replayEngineVersion: Ln,
    analysisEngineVersion: Qe,
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
    candidateMetrics: P,
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
    dataQualityNotes: Qu(g)
  };
  return h({
    ...Me,
    id: `replay-analysis-state:${T(Me).slice(8)}`
  });
}
function Ou(e) {
  if (!Number.isFinite(e.asOf) || e.asOf < 0)
    throw new RangeError("Analysis asOf must be a non-negative finite timestamp");
  if (sa(e.analysisProfile) !== e.analysisProfile.canonicalConfigHash)
    throw new Error("Replay analysis profile failed deterministic hash verification");
  if (e.strategyProfile.lifecycleConfigHash !== e.analysisProfile.lifecycleConfigRef.configHash)
    throw new Error("Analysis lifecycle configuration does not match the strategy profile");
  if (e.radarEpisode.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.radarEpisode.source !== e.source)
    throw new Error("Radar episode does not match the materialized instrument");
  const n = e.analysisProfile.referenceMarketPolicy.symbol, t = e.analysisProfile.referenceMarketPolicy.source ?? e.source;
  Rr(
    e.candlesByTimeframe,
    e.symbol,
    e.source,
    e.asOf,
    "target"
  ), Rr(
    e.referenceCandlesByTimeframe,
    n,
    t,
    e.asOf,
    "reference"
  );
}
function Rr(e, n, t, i, r) {
  for (const [o, a] of Object.entries(e)) {
    _(o);
    for (const s of a)
      if (!(s.knownAt > i) && (s.symbol.toUpperCase() !== n.toUpperCase() || s.source !== t || s.timeframe !== o))
        throw new Error(`Materialized ${r} candle identity mismatch for ${o}`);
  }
}
function la(e) {
  const n = e.analysisProfile.executionTimeframe, t = e.candlesByTimeframe[n] ?? [], i = [...new Set(t.map((r) => r.closeTime).filter((r) => r <= e.asOf))].sort((r, o) => o - r);
  for (const r of i)
    if (ln(t, r).some((o) => o.closeTime === r))
      return r;
  throw new RangeError("NO_COMPLETED_EVALUATION_CANDLE");
}
function Ce(e, n, t) {
  var s;
  const i = ln(e, t), r = e.length ? Math.min(...e.map((c) => c.openTime)) : ((s = i[0]) == null ? void 0 : s.openTime) ?? 0, o = _(n), a = i.map((c) => Nu(c, r, o));
  return st(a, n, t), { replay: i, candles: a };
}
function ln(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > n || i.knownAt > n) continue;
    if (On(i) !== i.observationId)
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
function Nu(e, n, t) {
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
function Ze(e) {
  const n = [];
  for (let t = 0; t < e.length; t += 2)
    n.push({ x: e[t], value: e[t + 1] });
  return n;
}
function Yt(e, n) {
  const t = _(n);
  return Math.ceil(e / t) * t;
}
function Je(e) {
  const n = {
    schemaVersion: xu,
    ...e,
    sourceObservationIds: [...new Set(e.sourceObservationIds)].sort()
  };
  return h({
    ...n,
    observationId: `replay-analysis-observation:${T(n).slice(8)}`
  });
}
function _u(e, n, t, i) {
  var m, v, p, y, g, w;
  const r = e.analysisProfile, o = qe(t.candles, r.extensionConfig), a = Math.max(0, i - r.extensionConfig.historyDays * 86400), s = ((m = t.replay[0]) == null ? void 0 : m.openTime) ?? null, c = ((v = t.replay.at(-1)) == null ? void 0 : v.closeTime) ?? null, l = i - a, u = s == null || c == null ? null : Math.max(0, c - Math.max(s, a)), f = [];
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
    r.evaluatedTimeframes.map((E) => {
      var b, A;
      const O = Ce(
        e.candlesByTimeframe[E] ?? [],
        E,
        i
      ), P = qe(O.candles, r.extensionConfig);
      return [E, {
        timeframe: E,
        emaPeriod: r.extensionConfig.emaPeriod,
        atrPeriod: r.extensionConfig.atrPeriod,
        latestTs: ((b = P.candle) == null ? void 0 : b.bucket) ?? null,
        latestClose: ((A = P.candle) == null ? void 0 : A.c) ?? null,
        ema: P.ema,
        atr: P.atr,
        atrExtension: P.atrExtension
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
      referenceClose: ((w = o.referenceCandle) == null ? void 0 : w.c) ?? null,
      returnPct: o.returnPct,
      percentile: o.percentile,
      zScore: o.zScore
    },
    timeframeExtensions: d,
    updatedAt: i
  });
}
function Mu(e, n, t) {
  return ln(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    t
  ).map((r) => {
    const o = Ce(
      e.candlesByTimeframe[n] ?? [],
      n,
      r.closeTime
    ), a = qe(o.candles, e.analysisProfile.extensionConfig);
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
function Fu(e, n, t, i, r, o) {
  const a = new Set(t.replay.map((y) => y.openTime)), s = new Map(i.replay.map((y) => [y.openTime, y])), c = [...a].some((y) => !s.has(y)), l = !t.replay.length || !i.replay.length ? "unavailable" : c ? "missingSynchronizedReferenceData" : "available";
  if (l !== "available")
    return {
      targetSymbol: e.symbol.toUpperCase(),
      targetSource: e.source,
      referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
      referenceSource: r,
      formulaVersion: Gt,
      normalizationAnchor: null,
      series: [],
      structure: null,
      status: l
    };
  const u = io(t.candles, i.candles), f = Ze(u), d = new Map(t.candles.map((y) => [y.x, y])), m = f.map((y) => ({ ...d.get(y.x), o: y.value, h: y.value, l: y.value, c: y.value })), v = t.replay[0], p = s.get(v.openTime);
  return {
    targetSymbol: e.symbol.toUpperCase(),
    targetSource: e.source,
    referenceSymbol: e.analysisProfile.referenceMarketPolicy.symbol,
    referenceSource: r,
    formulaVersion: Gt,
    normalizationAnchor: {
      targetObservationId: v.observationId,
      referenceObservationId: p.observationId,
      closeTime: v.closeTime
    },
    series: f,
    structure: Be(m, e.analysisProfile.structureConfig),
    status: l
  };
}
function Lu(e, n, t) {
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
    configurationHash: T(e.analysisProfile.avwapConfig)
  };
  const s = e.avwapAnchors ?? [];
  if (!s.length)
    return o.push(Jn("ANALYSIS_COMPONENT_UNAVAILABLE", "avwap", "No explicit AVWAP anchor was supplied")), { states: i, events: r, notes: o, freshness: a };
  for (const l of s) {
    Du(l, e, n, t);
    const u = n[l.timeframe], f = { anchorBucket: l.anchorTime }, d = ls(u.candles, f), m = u.replay.filter((p) => p.openTime >= l.anchorTime).map((p) => p.observationId), v = Je({
      logicalId: `avwap:${l.id}`,
      component: "avwap",
      timeframe: l.timeframe,
      eventTime: l.anchorTime,
      knownAt: Math.max(l.knownAt, ((c = u.replay.at(-1)) == null ? void 0 : c.knownAt) ?? l.knownAt),
      evaluatedAt: t,
      configurationHash: T({ anchor: l, config: e.analysisProfile.avwapConfig }),
      sourceObservationIds: [l.anchorCandleObservationId, ...m],
      value: d
    });
    i.push({
      anchor: l,
      series: Ze(ci(u.candles, f)),
      snapshot: d,
      observation: v
    });
    for (const p of us(
      u.candles,
      f,
      e.analysisProfile.avwapConfig.maxSignals
    ))
      r.push(Je({
        logicalId: `avwap-event:${l.id}:${p.kind}:${p.bucket}`,
        component: "avwapEvent",
        timeframe: l.timeframe,
        eventTime: p.eventTime,
        knownAt: p.knownAt,
        evaluatedAt: Yt(
          p.knownAt,
          e.analysisProfile.executionTimeframe
        ),
        configurationHash: v.configurationHash,
        sourceObservationIds: [l.anchorCandleObservationId, ...Kt(u, p.knownAt)],
        value: p
      }));
    a = Le(
      "avwap",
      t,
      u,
      v.configurationHash,
      1
    );
  }
  return { states: i, events: r, notes: o, freshness: a };
}
function Du(e, n, t, i) {
  if (e.schemaVersion !== aa || e.symbol.toUpperCase() !== n.symbol.toUpperCase() || e.source !== n.source || e.knownAt > i || e.selectedAt > i) throw new RangeError(`AVWAP anchor ${e.id} was not known at the cutoff`);
  const r = t[e.timeframe];
  if (!r) throw new RangeError(`AVWAP anchor timeframe ${e.timeframe} is not evaluated`);
  const o = r.replay.find(
    (a) => a.logicalCandleId === e.anchorCandleLogicalId
  );
  if (!o || o.observationId !== e.anchorCandleObservationId || o.openTime !== e.anchorTime || o.knownAt > e.selectedAt) throw new RangeError(`AVWAP anchor ${e.id} does not reference the visible frozen revision`);
}
function _d(e) {
  if (!e.id.trim() || !e.provenance.trim())
    throw new TypeError("AVWAP anchor id and provenance are required");
  if (e.knownAt > e.selectedAt)
    throw new RangeError("AVWAP anchor cannot be selected before it is known");
  return _(e.timeframe), h({
    ...e,
    schemaVersion: aa,
    symbol: e.symbol.toUpperCase()
  });
}
function Hu(e, n, t) {
  const i = Ce(
    e.candlesByTimeframe[e.analysisProfile.executionTimeframe] ?? [],
    e.analysisProfile.executionTimeframe,
    n
  ), r = Yr({
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
function Bu(e, n, t) {
  const i = ua(e.source, e.symbol, n, t.sourceSwing), r = `structure-level:${e.source}:${e.symbol.toUpperCase()}:${n}:${t.role}:${i}`;
  return vi({
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
function Vu(e, n, t, i) {
  return `structure-event:${e}:${n}:${t}:${i.kind}:${i.direction}:${i.bucket}:${i.sourceSwingX}`;
}
function ua(e, n, t, i) {
  return `swing:${e}:${n.toUpperCase()}:${t}:${i.kind}:${i.bucket}`;
}
function $u(e, n, t, i) {
  return e.filter((r) => r.price >= n.low && r.price <= n.high && (n.kind === "resistance" ? r.kind === "SwingHigh" : r.kind === "SwingLow")).sort((r, o) => r.bucket - o.bucket || r.knownAt - o.knownAt).map((r) => ua(t.source, t.symbol, i, r));
}
function Le(e, n, t, i, r) {
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
function Uu(e, n, t, i, r) {
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
function qu(e, n) {
  return Math.max(
    e.extensionConfig.emaPeriod,
    e.extensionConfig.atrPeriod + 1,
    n === e.stochasticRsiConfig.timeframe ? e.stochasticRsiConfig.rsiPeriod + e.stochasticRsiConfig.stochPeriod + e.stochasticRsiConfig.kPeriod + e.stochasticRsiConfig.dPeriod : 0,
    e.structureConfig.pivotStrength * 2 + 1
  );
}
function Kt(e, n) {
  return e.replay.filter((t) => t.knownAt <= n).map((t) => t.observationId);
}
function zu(e, n, t) {
  const i = new Map(n.replay.map((r) => [r.openTime, r]));
  return e.replay.flatMap((r) => {
    if (r.knownAt > t) return [];
    const o = i.get(r.openTime);
    return o && o.knownAt <= t ? [r.observationId, o.observationId] : [];
  });
}
function Sr(e) {
  return Object.fromEntries(Object.entries(e).map(([n, t]) => [
    n,
    t.replay.map((i) => i.observationId)
  ]));
}
function Jn(e, n, t) {
  return { code: e, severity: "warning", message: `${n}: ${t}` };
}
function Qu(e) {
  return [...new Map(e.map((n) => [S(n), n])).values()];
}
function Xt(e) {
  const n = [];
  for (const t of e)
    _(t), n.includes(t) || n.push(t);
  return n;
}
function ju(e) {
  const n = e.avwapStates[0];
  return !n || n.snapshot.value == null ? null : {
    reference: vi({
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
function Wu(e) {
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
function Gu(e) {
  return e.supportResistanceZones.map((n) => vi({
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
const Cr = "replay-analysis-data.1";
function Yu(e) {
  const n = Gi(e, "Replay analysis JSON data");
  if (ma(n, ["schemaVersion", "target", "reference"], "Replay analysis JSON data"), n.schemaVersion !== Cr)
    throw new Error("Unsupported Replay analysis JSON data schema");
  const t = xr(n.target, "target"), i = xr(n.reference, "reference");
  return h({
    schemaVersion: Cr,
    target: t,
    reference: i
  });
}
var Q, we, pn, fa;
class Ku {
  constructor(n) {
    Z(this, we);
    Z(this, Q);
    te(this, Q, Yu(n));
  }
  async getCoverage(n) {
    da(n);
    const t = J(this, we, fa).call(this, n);
    if (!t) return Ju(n.timeframe);
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
    return J(this, we, pn).call(this, R(this, Q).target, R(this, Q).target.candles, n);
  }
  async loadCandleRevisions(n) {
    return R(this, Q).target.revisionHistoryAvailable ? J(this, we, pn).call(this, R(this, Q).target, R(this, Q).target.candleRevisions, n) : h([]);
  }
  async loadReferenceCandles(n) {
    return J(this, we, pn).call(this, R(this, Q).reference, R(this, Q).reference.candles, n);
  }
  async loadReferenceCandleRevisions(n) {
    return R(this, Q).reference.revisionHistoryAvailable ? J(this, we, pn).call(this, R(this, Q).reference, R(this, Q).reference.candleRevisions, n) : h([]);
  }
}
Q = new WeakMap(), we = new WeakSet(), pn = function(n, t, i) {
  return ef(i), Lt(n, i) ? h(
    t.filter(
      (r) => r.timeframe === i.timeframe && r.openTime >= i.from && r.openTime <= i.to
    )
  ) : h([]);
}, fa = function(n) {
  return Lt(R(this, Q).target, n) ? R(this, Q).target : Lt(R(this, Q).reference, n) ? R(this, Q).reference : null;
};
class Md extends Ku {
  constructor(n) {
    super(n);
  }
}
function xr(e, n) {
  const t = Gi(e, `Replay analysis ${n} series`);
  ma(
    t,
    ["symbol", "source", "candles", "candleRevisions", "revisionHistoryAvailable"],
    `Replay analysis ${n} series`
  );
  const i = ot(t.symbol, `${n} symbol`).toUpperCase(), r = ot(t.source, `${n} source`), o = kr(t.candles, `${n} candles`), a = kr(
    t.candleRevisions,
    `${n} candleRevisions`
  ), s = nf(
    t.revisionHistoryAvailable,
    `${n} revisionHistoryAvailable`
  );
  if (a.length > 0 && !s)
    throw new Error(`${n} candle revisions require revisionHistoryAvailable=true`);
  return Xu(o, a, i, r, n), {
    symbol: i,
    source: r,
    candles: Pr(o),
    candleRevisions: Pr(a),
    revisionHistoryAvailable: s
  };
}
function Xu(e, n, t, i, r) {
  const o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (const l of [...e, ...n]) {
    if (Zu(l, t, i, r), a.has(l.observationId))
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
function Zu(e, n, t, i) {
  const r = Gi(e, `Replay analysis ${i} candle`), o = _(r.timeframe);
  let a;
  try {
    a = Oo({
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
  if (r.symbol !== n || r.source !== t || !en(r.openTime) || r.openTime % o !== 0 || r.closeTime !== r.openTime + o || !en(r.closeTime) || !en(r.knownAt) || r.knownAt < r.closeTime || r.correctionPublishedAt != null && !en(r.correctionPublishedAt) || r.logicalCandleId !== yt(r) || r.observationId !== On(r) || !Ir(r.vBase) || !Ir(r.vQuote) || S(r) !== S(a))
    throw new Error(`Invalid ${i} replay candle ${r.observationId ?? "<unknown>"}`);
}
function Lt(e, n) {
  return n.symbol.toUpperCase() === e.symbol && n.source === e.source;
}
function Ju(e) {
  return h({
    timeframe: e,
    earliestOpenTime: null,
    latestCloseTime: null,
    revisionHistoryAvailable: !1
  });
}
function da(e) {
  ot(e.symbol, "Replay analysis query symbol"), ot(e.source, "Replay analysis query source"), _(e.timeframe);
}
function ef(e) {
  if (da(e), !en(e.from) || !en(e.to) || e.to < e.from)
    throw new RangeError("Replay analysis query range must contain ordered Unix-second timestamps");
}
function Pr(e) {
  return [...e].sort(
    (n, t) => n.timeframe.localeCompare(t.timeframe) || n.openTime - t.openTime || n.knownAt - t.knownAt || n.observationId.localeCompare(t.observationId)
  );
}
function ma(e, n, t) {
  const i = Object.keys(e).sort(), r = [...n].sort();
  if (i.length !== r.length || i.some((o, a) => o !== r[a]))
    throw new Error(`${t} has unsupported or missing fields`);
}
function Ir(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function en(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function Gi(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${n} must be an object`);
  return e;
}
function ot(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} is required`);
  return e;
}
function nf(e, n) {
  if (typeof e != "boolean") throw new TypeError(`${n} must be boolean`);
  return e;
}
function kr(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
const Yi = "replay-analysis-session.1", tf = "replay-analysis-session-event.1", rf = 128, be = /* @__PURE__ */ new Map();
function Fd(e) {
  const n = h(e), t = {
    schemaVersion: Yi,
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
    replayEngineVersion: Ln,
    analysisEngineVersion: Qe,
    revision: 0,
    input: n,
    currentRequestedAsOf: null,
    currentEffectiveAsOf: null,
    states: [],
    events: []
  };
  return ha(t);
}
function of(e, n) {
  return Dn(e), Zt({ ...e.input, asOf: n });
}
function af(e, n, t = {}) {
  var d, m;
  if (Dn(e), !Number.isFinite(n) || n < 0)
    throw new RangeError("Analysis session asOf must be a non-negative finite timestamp");
  const i = mf(e.input, t), r = vf(
    e.input,
    i,
    e.input.analysisProfile.executionTimeframe
  ), o = r == null ? [...e.states] : e.states.filter((v) => v.effectiveAsOf < r), a = e.states.filter((v) => !o.some((p) => p.id === v.id)).map((v) => v.id), s = [...e.events];
  a.length && s.push(va({
    sequence: s.length,
    kind: "invalidated",
    effectiveAsOf: r,
    analysisStateId: null,
    invalidatedStateIds: a,
    sourceObservationIds: yf(e.input, i)
  }));
  const c = ((d = o.at(-1)) == null ? void 0 : d.effectiveAsOf) ?? -1 / 0, l = ln(
    i.candlesByTimeframe[i.analysisProfile.executionTimeframe] ?? [],
    n
  ).map((v) => v.closeTime).filter((v) => v > c && v <= n), u = [...o];
  for (const v of l)
    Or(u, s, Zt({ ...i, asOf: v }));
  const f = Zt({ ...i, asOf: n });
  return ((m = u.at(-1)) == null ? void 0 : m.id) !== f.id && Or(u, s, f), ha({
    schemaVersion: Yi,
    id: e.id,
    replayEngineVersion: Ln,
    analysisEngineVersion: Qe,
    revision: e.revision + 1,
    input: i,
    currentRequestedAsOf: n,
    currentEffectiveAsOf: f.effectiveAsOf,
    states: u,
    events: s
  });
}
function sf(e) {
  return Dn(e), S(e);
}
function cf(e) {
  const n = JSON.parse(e);
  return Dn(n), h(n);
}
function Dn(e) {
  if (e.schemaVersion !== Yi || e.replayEngineVersion !== Ln || e.analysisEngineVersion !== Qe) throw new Error("Unsupported replay analysis session version");
  const { integrityHash: n, ...t } = e;
  if (e.integrityHash !== T(t))
    throw new Error("Replay analysis session failed integrity verification");
  if (e.events.some((r, o) => r.sequence !== o || r.id !== ya(r)))
    throw new Error("Replay analysis session event log failed integrity verification");
  const i = e.states.map((r) => r.id);
  if (new Set(i).size !== i.length)
    throw new Error("Replay analysis session contains duplicate states");
}
function lf(e) {
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
class Ld {
  constructor(n) {
    ge(this, "replayEngineVersion", Ln);
    Z(this, ae);
    Dn(n), te(this, ae, h(n));
  }
  getRequiredCoverage() {
    return lf(R(this, ae).input);
  }
  materializeAt(n) {
    return of(R(this, ae), n);
  }
  advanceTo(n, t = {}) {
    return te(this, ae, af(R(this, ae), n, t)), R(this, ae).states.at(-1);
  }
  serializeState() {
    return sf(R(this, ae));
  }
  resumeState(n) {
    te(this, ae, cf(n));
  }
  snapshot() {
    return h(R(this, ae));
  }
}
ae = new WeakMap();
var De;
class Dd {
  constructor(n) {
    ge(this, "replayEngineVersion", "replay-engine.1");
    Z(this, De);
    te(this, De, h([...n].sort(
      (t, i) => t.knownAt - i.knownAt || t.id.localeCompare(i.id)
    )));
  }
  getRequiredCoverage() {
    return [];
  }
  materializeAt(n) {
    const t = R(this, De).filter((i) => i.knownAt <= n).at(-1);
    if (!t) throw new Error(`No supplied replay analysis observation is known at ${n}`);
    return h(t);
  }
  advanceTo(n) {
    return this.materializeAt(n);
  }
  serializeState() {
    return S(R(this, De));
  }
  resumeState(n) {
    if (S(JSON.parse(n)) !== S(R(this, De)))
      throw new Error("Supplied replay analysis observations cannot be replaced during resume");
  }
}
De = new WeakMap();
function Hd() {
  be.clear();
}
function Bd() {
  return be.size;
}
function Zt(e) {
  const n = uf(e), t = be.get(n);
  if (t)
    return be.delete(n), be.set(n, t), h(t);
  const i = ca(e);
  for (be.set(n, i); be.size > rf; ) {
    const r = be.keys().next().value;
    if (r == null) break;
    be.delete(r);
  }
  return h(i);
}
function uf(e) {
  const n = ff(e), t = (i) => Object.fromEntries(Object.entries(i).map(([r, o]) => [
    r,
    ln(o, n).map((a) => a.observationId)
  ]));
  return T({
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
function ff(e) {
  return la(e);
}
function Or(e, n, t) {
  e.some((i) => i.id === t.id) || (e.push(t), n.push(va({
    sequence: n.length,
    kind: "materialized",
    effectiveAsOf: t.effectiveAsOf,
    analysisStateId: t.id,
    invalidatedStateIds: [],
    sourceObservationIds: df(t)
  })));
}
function df(e) {
  return [...new Set(Object.values(e.freshnessByComponent).flatMap((n) => n.sourceObservationIds))].sort();
}
function va(e) {
  const n = {
    schemaVersion: tf,
    ...e
  };
  return h({ ...n, id: ya(n) });
}
function ya(e) {
  const { id: n, ...t } = e;
  return `replay-analysis-session-event:${T(t).slice(8)}`;
}
function mf(e, n) {
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
function vf(e, n, t) {
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
function yf(e, n) {
  const t = /* @__PURE__ */ new Set([
    ...Object.values(e.candlesByTimeframe).flat().map((i) => i.observationId),
    ...Object.values(e.referenceCandlesByTimeframe).flat().map((i) => i.observationId)
  ]);
  return [
    ...Object.values(n.candlesByTimeframe).flat(),
    ...Object.values(n.referenceCandlesByTimeframe).flat()
  ].map((i) => i.observationId).filter((i) => !t.has(i)).sort();
}
function ha(e) {
  return h({
    ...e,
    integrityHash: T(e)
  });
}
const Nr = "replay-json-data.1";
function hf(e) {
  const n = je(e, "Replay JSON data");
  if (n.schemaVersion !== Nr)
    throw new Error("Unsupported Replay JSON data schema");
  const t = an(n.symbol, "Replay JSON data symbol").toUpperCase(), i = an(n.source, "Replay JSON data source"), r = ei(n.candles, "candles"), o = vn(
    n.candleRevisions,
    "candleRevisions"
  ), a = ei(n.radarEpisodes, "radarEpisodes"), s = vn(
    n.analysisStateHistory,
    "analysisStateHistory"
  ), c = vn(n.knownEvents, "knownEvents"), l = vn(
    n.venueEvidence,
    "venueEvidence"
  ), u = vn(
    n.universeEvidence,
    "universeEvidence"
  ), f = Cf(
    n.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (o.length > 0 && !f)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return pf(r, o, t, i), gf(a, t, i), Af(s, t, i), bf(c, t, i), wf(l, t, i), Ef(u, t, i), h({
    schemaVersion: Nr,
    symbol: t,
    source: i,
    candles: Fr(r),
    candleRevisions: Fr(o),
    radarEpisodes: [...a].sort(
      (d, m) => d.detectedAt - m.detectedAt || d.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    venueEvidence: [...l].sort(Lr),
    universeEvidence: [...u].sort(Lr),
    revisionHistoryAvailable: f
  });
}
var W, Ee, et, Jt;
class Vd {
  constructor(n) {
    Z(this, Ee);
    Z(this, W);
    te(this, W, hf(n));
  }
  async getCoverage(n) {
    var i;
    ga(n);
    const t = J(this, Ee, et).call(this, [...R(this, W).candles, ...R(this, W).candleRevisions], n);
    return h({
      timeframe: n.timeframe,
      earliestOpenTime: ((i = t[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: t.length ? Math.max(...t.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: R(this, W).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(n) {
    return Mr(n), h(
      J(this, Ee, et).call(this, R(this, W).candles, n).filter(
        (t) => t.openTime >= n.from && t.openTime <= n.to
      )
    );
  }
  async loadCandleRevisions(n) {
    return Mr(n), R(this, W).revisionHistoryAvailable ? h(
      J(this, Ee, et).call(this, R(this, W).candleRevisions, n).filter(
        (t) => t.openTime >= n.from && t.openTime <= n.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(n) {
    return Yn(n), h(
      R(this, W).venueEvidence.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.marketDataSource === n.source && _r(t, n)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(n) {
    return Yn(n), h(
      R(this, W).universeEvidence.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && _r(t, n)
      )
    );
  }
  async loadAnalysisStateHistory(n) {
    return Yn(n), h(
      R(this, W).analysisStateHistory.filter(
        (t) => t.symbol.toUpperCase() === n.symbol.toUpperCase() && t.source === n.source && t.knownAt >= n.from && t.knownAt <= n.to
      )
    );
  }
  async loadKnownEvents(n) {
    return Yn(n), J(this, Ee, Jt).call(this, n) ? h(
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
W = new WeakMap(), Ee = new WeakSet(), et = function(n, t) {
  return J(this, Ee, Jt).call(this, t) ? n.filter((i) => i.timeframe === t.timeframe) : [];
}, Jt = function(n) {
  return n.symbol.toUpperCase() === R(this, W).symbol && n.source === R(this, W).source;
};
function pf(e, n, t, i) {
  const r = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const s of [...e, ...n]) {
    je(s, "Replay candle");
    const c = _(s.timeframe);
    if (s.symbol.toUpperCase() !== t || s.source !== i || !ve(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !ve(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== yt(s) || s.observationId !== On(s) || !Tf(s) || !Dt(s.vBase) || !Dt(s.vQuote) || !Rf(s.revision) || !Dt(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    Ne(o, s.observationId, s, "candle observation"), Ne(
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
function gf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (je(r, "Radar episode"), r.schemaVersion !== hi || r.symbol.toUpperCase() !== n || r.source !== t || r.observationId !== wi(r))
      throw new Error(`Invalid radar episode ${r.id ?? "<unknown>"}`);
    Ne(i, r.id, r, "radar episode");
  }
}
function Af(e, n, t) {
  const i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of e) {
    if (je(o, "Replay analysis state"), o.schemaVersion !== Ii || o.symbol.toUpperCase() !== n || o.source !== t || !ve(o.knownAt) || o.lifecycle.asOf == null || o.lifecycle.asOf > o.knownAt || o.id !== ht(o))
      throw new Error(`Invalid replay analysis state ${o.id ?? "<unknown>"}`);
    Ne(i, o.id, o, "analysis state observation"), Ne(r, o.knownAt, o, "analysis state knowledge time");
  }
}
function bf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (je(r, "Replay known event"), r.schemaVersion !== ki || r.symbol.toUpperCase() !== n || r.source !== t || !ve(r.eventTime) || !ve(r.knownAt) || r.knownAt < r.eventTime || r.id !== Ni(r))
      throw new Error(`Invalid replay known event ${r.id ?? "<unknown>"}`);
    r.timeframe != null && _(r.timeframe), Ne(i, r.id, r, "known event");
  }
}
function wf(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (je(r, "Venue evidence"), r.schemaVersion !== gi || r.symbol.toUpperCase() !== n || r.marketDataSource !== t || r.observationId !== dt(r))
      throw new Error(`Invalid execution-venue evidence ${r.observationId ?? "<unknown>"}`);
    pa(r, "execution-venue evidence"), Ne(i, r.observationId, r, "execution-venue evidence");
  }
}
function Ef(e, n, t) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (je(r, "Universe evidence"), r.schemaVersion !== Ai || r.symbol.toUpperCase() !== n || r.source !== t || r.observationId !== ft(r))
      throw new Error(`Invalid universe evidence ${r.observationId ?? "<unknown>"}`);
    pa(r, "universe evidence"), Ne(i, r.observationId, r, "universe evidence");
  }
}
function pa(e, n) {
  if (!ve(e.effectiveFrom) || !ve(e.knownAt) || e.effectiveTo != null && (!ve(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${n} interval`);
}
function _r(e, n) {
  return e.knownAt <= n.to && e.effectiveFrom <= n.to && (e.effectiveTo == null || e.effectiveTo >= n.from);
}
function ga(e) {
  an(e.symbol, "Replay query symbol"), an(e.source, "Replay query source"), _(e.timeframe);
}
function Mr(e) {
  ga(e), Aa(e.from, e.to);
}
function Yn(e) {
  an(e.symbol, "Replay evidence query symbol"), an(e.source, "Replay evidence query source"), Aa(e.from, e.to);
}
function Aa(e, n) {
  if (!ve(e) || !ve(n) || n < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function Fr(e) {
  return [...e].sort(
    (n, t) => n.timeframe.localeCompare(t.timeframe) || n.openTime - t.openTime || n.knownAt - t.knownAt || n.observationId.localeCompare(t.observationId)
  );
}
function Lr(e, n) {
  return e.effectiveFrom - n.effectiveFrom || e.knownAt - n.knownAt || e.observationId.localeCompare(n.observationId);
}
function Ne(e, n, t, i) {
  const r = e.get(n);
  if (r && S(r) !== S(t))
    throw new Error(`Conflicting ${i}`);
  e.set(n, t);
}
function Tf(e) {
  return Kn(e.o) && Kn(e.h) && Kn(e.l) && Kn(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function Kn(e) {
  return Number.isFinite(e) && e > 0;
}
function Dt(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Rf(e) {
  return e == null || Sf(e);
}
function Sf(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function ve(e) {
  return Number.isFinite(e) && e >= 0;
}
function je(e, n) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${n} must be an object`);
  return e;
}
function an(e, n) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${n} is required`);
  return e;
}
function Cf(e, n) {
  if (typeof e != "boolean") throw new TypeError(`${n} must be boolean`);
  return e;
}
function ei(e, n) {
  if (!Array.isArray(e)) throw new TypeError(`${n} must be an array`);
  return e;
}
function vn(e, n) {
  return e == null ? [] : ei(e, n);
}
function $d(e, n) {
  return ko({
    ...e,
    replayEngineVersion: Ie
  }, n);
}
async function Ud(e) {
  if (e.sessionConfig.replayEngineVersion !== Ie)
    throw new RangeError("Materialized replay loading requires replay-engine.2");
  if (e.analysisProfile.executionTimeframe !== e.sessionConfig.evaluationTimeframe || e.analysisProfile.canonicalConfigHash === "" || e.analysisProfile.lifecycleConfigRef.configHash !== e.strategyProfile.lifecycleConfigHash) throw new Error("Materialized replay analysis/profile configuration mismatch");
  const n = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, t = e.analysisProfile.referenceMarketPolicy.symbol, i = e.analysisProfile.referenceMarketPolicy.source ?? e.manifest.source, r = {}, o = {}, a = {}, s = {}, c = {};
  for (const w of e.analysisProfile.evaluatedTimeframes) {
    const E = { symbol: e.manifest.symbol, source: e.manifest.source, timeframe: w }, O = { symbol: t, source: i, timeframe: w }, [P, b] = await Promise.all([
      e.analysisDataAdapter.getCoverage(E),
      e.analysisDataAdapter.getCoverage(O)
    ]);
    c[w] = P;
    const A = Hr(E, P, n), C = Hr(O, b, n);
    r[w] = A ? await e.analysisDataAdapter.loadCandles(A) : [], o[w] = A ? await e.analysisDataAdapter.loadCandleRevisions(A) : [], a[w] = C ? await e.analysisDataAdapter.loadReferenceCandles(C) : [], s[w] = C ? await e.analysisDataAdapter.loadReferenceCandleRevisions(C) : [];
  }
  const l = Br(r, o), u = Br(a, s), f = {
    symbol: e.manifest.symbol,
    source: e.manifest.source,
    candlesByTimeframe: l,
    referenceCandlesByTimeframe: u,
    avwapAnchors: e.avwapAnchors,
    radarEpisode: await kf(e.historicalDataAdapter, e.manifest.radarEpisodeId),
    radarSelectionProfile: e.radarSelectionProfile,
    strategyProfile: e.strategyProfile,
    analysisProfile: e.analysisProfile,
    lifecycleConfig: e.lifecycleConfig
  }, d = /* @__PURE__ */ new Set([e.manifest.startAsOf]);
  for (const w of ln(
    l[e.analysisProfile.executionTimeframe] ?? [],
    n
  ))
    w.closeTime >= e.manifest.startAsOf && w.closeTime <= n && d.add(w.closeTime);
  const m = [...d].sort((w, E) => w - E).map((w) => ca({ ...f, asOf: w })), v = m.map(xf), p = Pf(m), y = m.find((w) => w.effectiveAsOf === e.manifest.startAsOf) ?? m[0];
  if (!y) throw new Error("No materialized analysis state exists at replay start");
  const g = new If({
    evidence: e.historicalDataAdapter,
    targetBaseByTimeframe: r,
    targetRevisionsByTimeframe: o,
    targetCoverage: c,
    observations: v,
    knownEvents: p,
    radarEpisode: f.radarEpisode
  });
  return Jc({
    manifest: e.manifest,
    sessionConfig: e.sessionConfig,
    historicalDataAdapter: g,
    strategyProfile: e.strategyProfile,
    radarSelectionProfile: e.radarSelectionProfile,
    venueRules: e.venueRules,
    materializedAnalysisBinding: {
      replayEngineVersion: Ie,
      analysisEngineVersion: Qe,
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
function xf(e) {
  const n = Gu(e), t = ju(e);
  return Zc({
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
    relativeStrengthState: Wu(e),
    relativeStrengthEvents: e.relativeStrengthEvents.map((i) => i.value),
    visibleOrSelectedReferenceLevels: [
      ...e.activeStructureLevels,
      ...n,
      ...t ? [t.reference] : []
    ],
    dataQualityNotes: e.dataQualityNotes,
    materializedStateRef: {
      id: e.id,
      schemaVersion: oa,
      analysisEngineVersion: e.analysisEngineVersion,
      analysisProfileHash: e.analysisProfileRef.hash,
      dataBundleFingerprint: e.dataBundleFingerprint
    }
  });
}
function Pf(e) {
  const n = /* @__PURE__ */ new Map(), t = (i) => n.set(i.id, i);
  for (const i of e) {
    for (const r of i.structureEvents)
      r.evaluatedAt === i.effectiveAsOf && t(zn({
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
        detail: Xn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.relativeStrengthEvents)
      r.evaluatedAt === i.effectiveAsOf && t(zn({
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
        detail: Xn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.avwapEvents)
      r.evaluatedAt === i.effectiveAsOf && t(zn({
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
        detail: Xn({ observationId: r.observationId, rawKnownAt: r.knownAt, value: r.value })
      }));
    for (const r of i.lifecycleResult.transitions)
      r.knownAt === i.effectiveAsOf && t(zn({
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
        detail: Xn(r)
      }));
  }
  return h([...n.values()].sort(
    (i, r) => i.knownAt - r.knownAt || i.id.localeCompare(r.id)
  ));
}
var ee;
class If {
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
    return Dr(R(this, ee).targetBaseByTimeframe[n.timeframe] ?? [], n);
  }
  async loadCandleRevisions(n) {
    return Dr(R(this, ee).targetRevisionsByTimeframe[n.timeframe] ?? [], n);
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
function Dr(e, n) {
  return h(e.filter((t) => t.symbol === n.symbol.toUpperCase() && t.source === n.source && t.timeframe === n.timeframe && t.openTime >= n.from && t.openTime <= n.to));
}
async function kf(e, n) {
  var i;
  const t = await ((i = e.loadRadarEpisode) == null ? void 0 : i.call(e, n));
  if (!t) throw new Error("Exact RadarEpisode sidecar is required for materialized replay");
  return t;
}
function Hr(e, n, t) {
  return n.earliestOpenTime == null ? null : { ...e, from: n.earliestOpenTime, to: t };
}
function Br(e, n) {
  return Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(n)])].map(
    (t) => [t, [
      ...e[t] ?? [],
      ...n[t] ?? []
    ]]
  ));
}
function Xn(e) {
  return h(e);
}
var In;
class qd {
  constructor(n) {
    Z(this, In);
    te(this, In, h(n));
  }
  async revealCaseOutcome(n) {
    const t = R(this, In)[n.manifestId];
    if (!t) throw new Error(`No outcome is available for ${n.manifestId}`);
    const i = {
      schemaVersion: Pi,
      sessionId: n.sessionId,
      manifestId: n.manifestId,
      revealedAt: n.revealedAt,
      revealedBeforeDecisionCompletion: n.revealedBeforeDecisionCompletion,
      outcome: t
    };
    return h({
      ...i,
      id: `replay-outcome:${T(i).slice(8)}`
    });
  }
}
In = new WeakMap();
function zd(e, n) {
  return wt(e), h({
    schemaVersion: Po,
    id: n.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: n.type,
    payload: n.payload ?? {}
  });
}
function ba(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && _(e.timeframe), e.type === "PriceCrossesKnownLevel" && !Ht(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!Ht(e.frozenLowerBound) || !Ht(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const n = {
    schemaVersion: Yc,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map(ba) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return h({
    ...n,
    id: `replay-wake-condition:${T(n).slice(8)}`
  });
}
function Qd(e) {
  var t, i;
  if (Ur(e.createdAt, "wake plan createdAt"), Ur(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((t = e.scheduledReview) == null ? void 0 : t.mode) === "nextCompletedCandle" && _(e.scheduledReview.timeframe), ((i = e.scheduledReview) == null ? void 0 : i.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const n = {
    schemaVersion: Gc,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map(ba),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!n.scheduledReview && !n.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return h({
    ...n,
    id: `replay-wake-plan:${T(n).slice(8)}`
  });
}
function jd(e) {
  Zi(e);
  const n = {
    schemaVersion: xo,
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
  return Xi({
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
  return `replay-session:${T({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function ni(e) {
  var p, y;
  const { loaded: n, session: t, effectiveAsOf: i } = e, r = ne(n);
  if (i < n.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const o = Cn(n, i), a = h({ ...o.lifecycle, asOf: i }), s = [
    ...r.dataQualityNotes,
    ...o.dataQualityNotes,
    ...n.sessionConfig.replayEngineVersion === vt && o.lifecycle.asOf != null && o.lifecycle.asOf < i ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${o.id} was carried forward from ${o.lifecycle.asOf}`
    }] : []
  ], c = tc({
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
    const w = Ea(
      r.candlesByTimeframe[g] ?? [],
      i
    ).filter((E) => E.openTime >= r.displayStartByTimeframe[g]);
    l[g] = w, f[g] = w.at(-1) ?? null, u[g] = {
      timeframe: g,
      displayStart: r.displayStartByTimeframe[g],
      visibleStart: ((p = w[0]) == null ? void 0 : p.openTime) ?? null,
      visibleEnd: ((y = w.at(-1)) == null ? void 0 : y.closeTime) ?? null,
      completedCandleCount: w.length
    };
  }
  const d = await nn({
    effectiveAsOf: i,
    analysisObservationId: o.id,
    visibleCandlesByTimeframe: l
  }), m = t.decisionRecords.map((g) => {
    var w;
    return {
      decisionRecordId: g.id,
      frameId: ((w = t.frames.find((E) => E.decisionSnapshot.id === g.snapshotId)) == null ? void 0 : w.id) ?? "",
      action: g.action,
      decisionTime: g.decisionTime
    };
  }), v = {
    schemaVersion: Wc,
    sessionId: t.id,
    manifestId: n.manifest.id,
    radarEpisodeId: n.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: i,
    evaluationTimeframe: n.sessionConfig.evaluationTimeframe,
    radarContext: Of(n),
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
    id: `replay-frame:${T(v).slice(8)}`
  });
}
function Of(e) {
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
function Cn(e, n) {
  const i = ne(e).analysisStateHistory.filter(
    (r) => r.knownAt <= n
  ).at(-1);
  if (!i || i.id !== ht(i))
    throw new Error(`No verified point-in-time analysis state is available at ${n}`);
  return i;
}
function Ea(e, n) {
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
async function Wd(e, n, t, i) {
  Zi(e), wt(n), ka(n, e);
  const r = n.events.find((c) => c.command.id === t.id);
  if (r) {
    if (S(r.command) !== S(t))
      throw new Error(`Command id ${t.id} was reused with a different payload`);
    return { session: h(n), event: r, outcomeEnvelope: null, idempotent: !0 };
  }
  Ta(n, t);
  let o, a = null;
  if (t.type === "StartSession") {
    if (n.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await ni({
      loaded: e,
      session: n,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    o = Xe(t, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (n.state !== "Active" && t.type !== "RevealOutcome")
      throw new Error(`Command ${t.type} is not allowed while session is ${n.state}`);
    const c = ti(n);
    if (t.type === "Wait") {
      Ra(e, n, c, t.payload.wakePlan);
      const l = kt({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: t.payload.confidence,
        thesis: t.payload.thesis,
        tags: [t.payload.reason, ...t.payload.tags ?? []],
        nextCondition: Vf(t.payload.wakePlan)
      }), u = await Ca(
        e,
        n,
        c,
        t.payload.wakePlan
      ), f = h({
        ...n,
        decisionRecords: [...n.decisionRecords, l]
      }), d = await ni({
        loaded: e,
        session: f,
        requestedAsOf: u.requestedAsOf,
        effectiveAsOf: u.effectiveAsOf,
        wakeResult: u.wakeResult
      });
      o = Xe(t, u.state, d.effectiveAsOf, {
        frame: d,
        decisionRecord: l,
        wakePlan: t.payload.wakePlan,
        wakeResult: u.wakeResult,
        terminalReason: u.terminalReason
      });
    } else if (t.type === "Skip") {
      if (!t.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const l = kt({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: t.payload.confidence,
        thesis: t.payload.thesis,
        tags: [...t.payload.tags ?? [], ...t.payload.reasons.slice(1)],
        skipReason: t.payload.reasons[0]
      });
      o = Xe(t, "Skipped", c.effectiveAsOf, {
        decisionRecord: l
      });
    } else if (t.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const l = dl({
        ...t.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), u = Ff(e, l), f = h({
        id: `replay-planning-attempt:${T({
          sessionId: n.id,
          frameId: c.id,
          tradePlan: l
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: l,
        accepted: u == null,
        rejectionReason: u
      }), d = u ? null : kt({
        sessionId: n.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: l
      });
      o = Xe(
        t,
        u ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: f, decisionRecord: d }
      );
    } else if (t.type === "Abandon") {
      if (!t.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      o = Xe(t, "Abandoned", c.effectiveAsOf);
    } else {
      const l = await jf(e, n, t, i);
      a = l.envelope, o = Xe(t, "Revealed", l.revealedAt, {
        terminalReason: n.terminalReason,
        revealedBeforeDecisionCompletion: l.early,
        outcomeEnvelopeId: l.envelope.id
      });
    }
  }
  const s = Nf(n, o);
  return {
    session: Ki(n, s),
    event: s,
    outcomeEnvelope: a,
    idempotent: !1
  };
}
function Xe(e, n, t, i = {}) {
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
function Nf(e, n) {
  const t = {
    schemaVersion: Io,
    sequence: e.revision + 1,
    ...n
  };
  return h({
    ...t,
    id: `replay-event:${T(t).slice(8)}`
  });
}
function Ki(e, n) {
  var t;
  if (n.schemaVersion !== Io)
    throw new Error("Replay event schema is invalid");
  if (n.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (n.id !== Mf(n)) throw new Error("Replay event identity is invalid");
  if (n.command.sessionId !== e.id || n.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (n.frame) {
    const { id: i, ...r } = n.frame;
    if (n.frame.id !== `replay-frame:${T(r).slice(8)}` || n.frame.sessionId !== e.id || n.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    Ji(n.frame);
  }
  if (n.decisionRecord && n.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (n.wakePlan && n.wakePlan.id !== Sa(n.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (n.wakeResult) {
    const { id: i, ...r } = n.wakeResult;
    if (n.wakeResult.id !== `replay-wake-result:${T(r).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return _f(e, n), Xi({
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
function _f(e, n) {
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
    const m = ((f = n.planningAttempt) == null ? void 0 : f.accepted) === !0, v = n.planningAttempt ? `replay-planning-attempt:${T({
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
function Mf(e) {
  const { id: n, ...t } = e;
  return `replay-event:${T(t).slice(8)}`;
}
function Ta(e, n) {
  if (n.schemaVersion !== Po || !n.id.trim())
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
function ti(e) {
  const n = e.frames.find((t) => t.id === e.currentFrameId);
  if (!n || n.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return n;
}
function Ff(e, n) {
  if (n.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (n.sizingResult.sizingModelVersion !== Mo)
    return "Sizing model version mismatch";
  if (n.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (n.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (n.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && S(n.venueRules) !== S(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const t = e.manifest.executionVenueEligibility.executionVenue;
  return t && n.venueRules.venue.toLowerCase() !== t.toLowerCase() ? "Trade plan venue does not match the manifest execution venue" : Lf(e, n.createdAt, t) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function Lf(e, n, t) {
  const i = ne(e).venueEvidence.filter(
    (o) => o.knownAt <= n && o.effectiveFrom <= n && (o.effectiveTo == null || o.effectiveTo > n) && o.executionVenue.toLowerCase() === t.toLowerCase()
  ).at(-1);
  if (i) return i.status;
  const r = e.manifest.executionVenueEligibility;
  return r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo > n) ? r.status : "Unavailable";
}
function Ra(e, n, t, i) {
  var r;
  if (i.id !== Sa(i)) throw new Error("Wake plan identity is invalid");
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
  for (const o of bt(i.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(o.type))
      throw new RangeError(`Wake condition ${o.type} is not allowed`);
    if (o.id !== Df(o))
      throw new Error(`Wake condition ${o.id} failed deterministic verification`);
  }
  if (Hf(t, i.conditions), Bf(e, t, i.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (n.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function Sa(e) {
  const { id: n, ...t } = e;
  return `replay-wake-plan:${T(t).slice(8)}`;
}
function Df(e) {
  const { id: n, ...t } = e;
  return `replay-wake-condition:${T(t).slice(8)}`;
}
function Hf(e, n) {
  const t = fo(e.decisionSnapshot);
  for (const i of bt(n)) {
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
function Bf(e, n, t) {
  for (const i of bt(t)) {
    if (i.type === "LifecycleStateEntered" && n.lifecycleState === i.state) return !0;
    if (i.type === "PriceCrossesKnownLevel") {
      const r = xn(e, i.timeframe, n.effectiveAsOf);
      if (r != null && (i.direction === "above" && r >= i.frozenPrice || i.direction === "below" && r <= i.frozenPrice)) return !0;
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = xn(e, i.timeframe, n.effectiveAsOf);
      if (r != null && r >= i.frozenLowerBound && r <= i.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function bt(e) {
  return e.flatMap(
    (n) => n.type === "AnyOf" ? [n, ...bt(n.conditions)] : [n]
  );
}
function Vf(e) {
  return S({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((n) => n.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function Ca(e, n, t, i) {
  var P;
  const r = t.effectiveAsOf, o = ne(e), a = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = Uf(e), c = $f(e, r, i.scheduledReview), l = ((P = i.scheduledReview) == null ? void 0 : P.mode) === "elapsedDuration" ? r + i.scheduledReview.durationSeconds : c ?? i.deadlineAsOf, u = Math.min(i.deadlineAsOf, a, s);
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
  let v = u, p = "DEADLINE_REACHED", y = [], g = [], w = null;
  for (const b of m) {
    d.evaluationPointsChecked.push(b);
    const A = qf(e, b, r);
    d.lifecycleTransitionsEncountered.push(...A);
    const C = xa(e, i.conditions, r, b, d), k = Qf(e, b, r);
    if (k) {
      v = b, p = "CASE_BOUNDARY_REACHED", w = k, y = C.conditionIds, g = C.eventIds, C.conditionIds.length && (d.firstTriggeringEffectiveAsOf = b);
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
      v = u, u === a ? (p = "CASE_BOUNDARY_REACHED", w = "MAXIMUM_CASE_DURATION") : u === s ? (p = "CASE_BOUNDARY_REACHED", w = "DATA_COVERAGE_ENDED") : p = "DEADLINE_REACHED";
      break;
    }
  }
  const E = {
    schemaVersion: Kc,
    wakePlanId: i.id,
    startedAt: r,
    effectiveAsOf: v,
    reason: p,
    triggeredConditionIds: [...new Set(y)],
    triggeringEventIds: [...new Set(g)],
    auditTrace: d
  }, O = h({
    ...E,
    id: `replay-wake-result:${T(E).slice(8)}`
  });
  return {
    requestedAsOf: l,
    effectiveAsOf: v,
    state: w ? "CaseWindowEnded" : "Active",
    terminalReason: w,
    wakeResult: O
  };
}
function $f(e, n, t) {
  if (!t) return null;
  if (t.mode === "nextCompletedCandle")
    return Vr(e, t.timeframe, n);
  const i = _(e.sessionConfig.evaluationTimeframe), r = n + t.durationSeconds, o = Math.ceil(r / i) * i;
  return Vr(e, e.sessionConfig.evaluationTimeframe, o - 1);
}
function Vr(e, n, t) {
  return (ne(e).candlesByTimeframe[n] ?? []).filter((i) => i.closeTime > t).map((i) => Math.max(i.closeTime, i.knownAt)).sort((i, r) => i - r)[0] ?? null;
}
function Uf(e) {
  const t = (ne(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((i) => i.closeTime);
  return t.length ? Math.max(...t) : e.manifest.startAsOf;
}
function qf(e, n, t) {
  var a;
  const i = ne(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === n && s.knownAt > t
  ).map((s) => s.id), r = (a = ii(e, n)) == null ? void 0 : a.lifecycle.currentState, o = Cn(e, n);
  return r !== o.lifecycle.currentState && i.push(o.id), [...new Set(i)];
}
function ii(e, n) {
  return ne(e).analysisStateHistory.filter((t) => t.knownAt < n).at(-1) ?? null;
}
function xa(e, n, t, i, r) {
  const o = [], a = [];
  for (const s of n) {
    const c = zf(e, s, t, i, r);
    c.matched && (o.push(...c.conditionIds), a.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(o)], eventIds: [...new Set(a)] };
}
function zf(e, n, t, i, r) {
  var l, u;
  if (n.type === "AnyOf") {
    const f = xa(e, n.conditions, t, i, r), d = f.conditionIds.length > 0;
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
    a = o.filter((f) => f.kind === "lifecycleTransition"), s = a.length > 0 || ((l = ii(e, i)) == null ? void 0 : l.lifecycle.currentState) !== Cn(e, i).lifecycle.currentState;
  else if (n.type === "LifecycleStateEntered")
    a = o.filter(
      (f) => f.kind === "lifecycleTransition" && f.lifecycleState === n.state
    ), s = a.length > 0 || Cn(e, i).lifecycle.currentState === n.state && ((u = ii(e, i)) == null ? void 0 : u.lifecycle.currentState) !== n.state;
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
    const f = $r(e, n.timeframe, i), d = xn(e, n.timeframe, i);
    s = f != null && d != null && (n.direction === "above" ? f < n.frozenPrice && d >= n.frozenPrice : f > n.frozenPrice && d <= n.frozenPrice);
  } else if (n.type === "PriceEntersKnownZone") {
    const f = $r(e, n.timeframe, i), d = xn(e, n.timeframe, i), m = (v) => v >= n.frozenLowerBound && v <= n.frozenUpperBound;
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
function Qf(e, n, t) {
  const i = ne(e).knownEvents.filter(
    (r) => r.knownAt === n && r.knownAt > t
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && i.some((r) => r.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (i.some((r) => r.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(Cn(e, n).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function xn(e, n, t) {
  var i;
  return ((i = Ea(
    ne(e).candlesByTimeframe[n] ?? [],
    t
  ).at(-1)) == null ? void 0 : i.c) ?? null;
}
function $r(e, n, t) {
  const r = (ne(e).candlesByTimeframe[n] ?? []).map((o) => Math.max(o.closeTime, o.knownAt)).filter((o) => o < t);
  return r.length ? xn(e, n, Math.max(...r)) : null;
}
async function jf(e, n, t, i) {
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
  return Wf(n, s, o), { envelope: s, early: o, revealedAt: a };
}
function Wf(e, n, t) {
  const { id: i, ...r } = n;
  if (n.schemaVersion !== Pi || n.id !== `replay-outcome:${T(r).slice(8)}` || n.sessionId !== e.id || n.manifestId !== e.manifestId || n.revealedBeforeDecisionCompletion !== t)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function Gd(e) {
  wt(e), Oa(e);
  for (const n of e.frames) Ji(n);
  return S(e);
}
function Gf(e) {
  const n = JSON.parse(e);
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new TypeError("Serialized replay session must be an object");
  const t = n;
  wt(t), Oa(t);
  for (const i of t.frames) Ji(i);
  return h(t);
}
async function Yd(e, n) {
  const t = Gf(e);
  Zi(n), ka(t, n);
  const i = Yf(t);
  if (S(i) !== S(t))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (t.currentAsOf != null && t.currentFrameId != null) {
    const r = ti(t), o = t.events.findIndex((u) => {
      var f;
      return ((f = u.frame) == null ? void 0 : f.id) === r.id;
    });
    if (o < 0) throw new Error("Current replay frame is absent from the event log");
    let a = Pa(Ia(t));
    for (const u of t.events.slice(0, o))
      a = Ki(a, u);
    const s = t.events[o];
    let c = r.activeWakeResult;
    if (s.command.type === "Wait") {
      const u = ti(a);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      Ra(
        n,
        a,
        u,
        s.wakePlan
      );
      const f = await Ca(
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
    })), (await ni({
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
function Yf(e) {
  let n = Pa(Ia(e));
  const t = /* @__PURE__ */ new Set();
  for (const i of e.events) {
    if (t.has(i.command.id)) throw new Error("Replay event log repeats a command id");
    t.add(i.command.id), Ta(n, i.command), n = Ki(n, i);
  }
  return n;
}
function Pa(e) {
  return Xi({
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
function Ia(e) {
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
function Xi(e) {
  const { integrityHash: n, ...t } = e;
  return h({ ...t, integrityHash: T(t) });
}
function wt(e) {
  if (e.schemaVersion !== xo || !pt(e.replayEngineVersion)) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: n, ...t } = e;
  if (n !== T(t)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function Zi(e) {
  if (Oi(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || !pt(e.sessionConfig.replayEngineVersion) || e.sessionConfig.replayEngineVersion === Ie && !e.materializedAnalysisBinding || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function ka(e, n) {
  if (e.id !== wa(n) || e.manifestId !== n.manifest.id || e.radarEpisodeId !== n.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== n.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== n.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== n.strategyProfile.profileHash || e.lifecycleVersion !== n.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== n.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== n.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== n.dataBundle.causalPrefixFingerprint || e.replayEngineVersion !== n.sessionConfig.replayEngineVersion || S(e.materializedAnalysisRef ?? null) !== S(n.materializedAnalysisBinding ?? null) || S(e.venueRulesRef) !== S(n.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function Ji(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const n of Object.values(e.visibleCandlesByTimeframe))
    if (n.some((t) => t.closeTime > e.effectiveAsOf || t.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  Kf(e, e.effectiveAsOf);
}
function Kf(e, n) {
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
function Oa(e) {
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
function Ht(e) {
  return Number.isFinite(e) && e > 0;
}
function Ur(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a non-negative finite timestamp`);
}
export {
  aa as AVWAP_ANCHOR_SCHEMA_VERSION,
  ud as CANDLE_TIMESTAMP_SEMANTICS,
  fl as DECISION_RECORD_SCHEMA_VERSION,
  lo as DECISION_SNAPSHOT_SCHEMA_VERSION,
  nc as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Fi as EXECUTION_CANDLE_SCHEMA_VERSION,
  Sl as EXECUTION_DATA_BUNDLE_SCHEMA_VERSION,
  Nn as EXECUTION_ENGINE_VERSION,
  Vo as EXECUTION_EVENT_SCHEMA_VERSION,
  Tl as EXECUTION_FILL_SCHEMA_VERSION,
  br as EXECUTION_JSON_DATA_SCHEMA_VERSION,
  El as EXECUTION_ORDER_SCHEMA_VERSION,
  Cl as EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
  Ho as EXECUTION_PROFILE_SCHEMA_VERSION,
  Uo as EXECUTION_QUOTE_SCHEMA_VERSION,
  Rl as EXECUTION_RESULT_SCHEMA_VERSION,
  jl as EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION,
  Bo as EXECUTION_SESSION_SCHEMA_VERSION,
  $o as EXECUTION_TRADE_SCHEMA_VERSION,
  gi as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  yd as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  qo as FUNDING_OBSERVATION_SCHEMA_VERSION,
  yn as IMPULSE_FADE_CANDIDATE_GATE,
  ja as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  fe as IMPULSE_FADE_LIFECYCLE_VERSION,
  Xs as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  Zs as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  xe as IMPULSE_FADE_SETUP_FAMILY,
  Md as InMemoryReplayAnalysisDataAdapter,
  Il as InMemoryReplayExecutionDataAdapter,
  gd as InMemoryReplayHistoricalDataAdapter,
  qd as InMemoryReplayOutcomeStore,
  Ku as JsonReplayAnalysisDataAdapter,
  Cd as JsonReplayExecutionDataAdapter,
  Vd as JsonReplayHistoricalDataAdapter,
  oa as MATERIALIZED_REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  Ln as MATERIALIZED_REPLAY_ENGINE_VERSION,
  Ld as MaterializedReplayAnalysisProvider,
  Pl as POSITION_LEDGER_SCHEMA_VERSION,
  hi as RADAR_EPISODE_SCHEMA_VERSION,
  pi as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  uc as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  mo as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  fc as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  dc as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  Ai as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  Gt as RELATIVE_STRENGTH_FORMULA_VERSION,
  Pu as REPLAY_ANALYSIS_DATA_BUNDLE_SCHEMA_VERSION,
  Qe as REPLAY_ANALYSIS_ENGINE_VERSION,
  Od as REPLAY_ANALYSIS_FRAME_SCHEMA_VERSION,
  Cr as REPLAY_ANALYSIS_JSON_DATA_SCHEMA_VERSION,
  xu as REPLAY_ANALYSIS_OBSERVATION_SCHEMA_VERSION,
  ra as REPLAY_ANALYSIS_PROFILE_SCHEMA_VERSION,
  tf as REPLAY_ANALYSIS_SESSION_EVENT_SCHEMA_VERSION,
  Yi as REPLAY_ANALYSIS_SESSION_SCHEMA_VERSION,
  Ii as REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  vo as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  Po as REPLAY_COMMAND_SCHEMA_VERSION,
  Xc as REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
  Wc as REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  vt as REPLAY_ENGINE_VERSION,
  Io as REPLAY_EVENT_SCHEMA_VERSION,
  Nr as REPLAY_JSON_DATA_SCHEMA_VERSION,
  ki as REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  Ie as REPLAY_MATERIALIZED_ENGINE_VERSION,
  Pi as REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  xi as REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  xo as REPLAY_SESSION_SCHEMA_VERSION,
  Yc as REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  Gc as REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  Kc as REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  Mo as SIZING_MODEL_VERSION,
  ul as SIZING_RESULT_SCHEMA_VERSION,
  Ks as STRATEGY_PROFILE_SCHEMA_VERSION,
  Dd as SuppliedObservationReplayAnalysisProvider,
  Fo as TRADE_PLAN_SCHEMA_VERSION,
  Li as VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  xl as VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  Wl as advanceExecutionTo,
  af as advanceReplayAnalysisTo,
  id as appendSyntheticCandle,
  Wd as applyReplayCommand,
  tn as bucketStart,
  Lo as calculateLinearPerpetualSizing,
  _e as candleCloseTime,
  He as candleRevisionKnownAt,
  or as candleToBytes,
  La as candlesToBytes,
  T as canonicalHash,
  pd as canonicalRadarJson,
  S as canonicalSerialize,
  Hd as clearReplayAnalysisCache,
  ci as computeAnchoredVwapLine,
  us as computeAnchoredVwapSignals,
  ls as computeAnchoredVwapSnapshot,
  Ya as computeAtrLine,
  ad as computeBollingerBands,
  ed as computeCloseChangePct,
  Wa as computeEmaLine,
  qe as computeExtensionSnapshot,
  cd as computeMacd,
  Be as computeMarketStructure,
  io as computeRelativeCumulativeReturnLine,
  ms as computeRelativeStrengthDivergences,
  sd as computeRsiLine,
  Ka as computeSetupState,
  rd as computeSmaLine,
  Ga as computeStochRsi,
  ds as computeStructureActiveLevels,
  fd as computeSupportResistanceZones,
  to as computeSupportResistanceZonesFromSwings,
  fs as computeSwingPoints,
  nd as computeViewBounds,
  od as computeWmaLine,
  _d as createAvwapAnchorSpec,
  kt as createDecisionRecord,
  vi as createDecisionReferenceLevel,
  tc as createDecisionSnapshot,
  Ad as createDefaultReplaySessionConfig,
  Ut as createDurableObjectReference,
  Hi as createExecutionCandleObservation,
  kl as createExecutionProfile,
  Wo as createExecutionQuoteObservation,
  Bi as createExecutionSession,
  jo as createExecutionTradeObservation,
  vc as createExecutionVenueEligibilityObservation,
  wd as createExperimentalExecutionProfile,
  Nd as createExperimentalReplayAnalysisProfile,
  Go as createFundingObservation,
  ec as createImpulseFadeResearchProfile,
  $d as createMaterializedReplaySessionConfig,
  mc as createRadarSelectionProfile,
  md as createRadarStructureObservation,
  ku as createReplayAnalysisProfile,
  Fd as createReplayAnalysisSession,
  Zc as createReplayAnalysisStateObservation,
  Oo as createReplayCandleRecord,
  zd as createReplayCommand,
  zn as createReplayKnownEvent,
  jd as createReplaySession,
  ko as createReplaySessionConfig,
  ba as createReplayWakeCondition,
  Qd as createReplayWakePlan,
  Td as createResearchVenueExecutionRules,
  uo as createStrategyProfile,
  dl as createTradePlan,
  vd as createUniverseMembershipObservation,
  Ol as createVenueExecutionRules,
  Ed as createVenueFeeSchedule,
  Js as decisionReferenceObservationId,
  yi as decisionSnapshotId,
  fo as decisionSnapshotReferenceLevels,
  kd as deserializeExecutionSession,
  cf as deserializeReplayAnalysisSession,
  Gf as deserializeReplaySession,
  la as effectiveReplayAnalysisAsOf,
  Yr as evaluateImpulseFadeSnapshot,
  ld as evaluateImpulseFadeTimeline,
  ml as evaluateTradePlanCompliance,
  Rd as executionCandleFromReplay,
  zo as executionProfileHash,
  dt as executionVenueEligibilityObservationId,
  Qo as feeScheduleHash,
  Gl as finalizeExecutionAtHorizon,
  h as immutableJsonClone,
  sn as impulseFadeLifecycleConfigHash,
  ri as isStrictTimeframe,
  pt as isSupportedReplayEngineVersion,
  dd as lineToBytes,
  Sd as loadExecutionCase,
  Ud as loadMaterializedReplayCase,
  Jc as loadReplayCase,
  td as makeSyntheticCandles,
  ca as materializeReplayAnalysis,
  of as materializeReplayAnalysisAt,
  Pf as materializedAnalysisKnownEvents,
  xf as materializedStateToReplayObservation,
  Da as mergeLiveCandle,
  zr as normalizeOhlcvPoint,
  Zf as normalizeRestTimeframe,
  Qr as packHistoricalCandles,
  Bl as parseExecutionJsonHistoricalDataFixture,
  Yu as parseReplayAnalysisJsonDataFixture,
  hf as parseReplayJsonHistoricalDataFixture,
  Jf as prependHistoricalCandles,
  wi as radarEpisodeObservationId,
  bi as radarSelectionProfileHash,
  yo as radarStructureObservationId,
  Ru as reconstructExecutionSessionFromEvents,
  Yf as reconstructReplaySession,
  ju as replayAnalysisAvwapDecisionState,
  uf as replayAnalysisCacheKey,
  Bd as replayAnalysisCacheSize,
  sa as replayAnalysisProfileHash,
  Wu as replayAnalysisRelativeStrengthDecisionState,
  lf as replayAnalysisRequiredCoverage,
  ht as replayAnalysisStateObservationId,
  Gu as replayAnalysisSupportResistanceReferences,
  yt as replayCandleLogicalId,
  On as replayCandleObservationId,
  go as replayCaseManifestId,
  bd as replayDataFingerprintAt,
  Ni as replayKnownEventId,
  Oi as replaySessionConfigHash,
  nn as replaySha256,
  Yd as resumeReplaySession,
  xd as revealExecutionOutcome,
  hd as scanRadarEpisodes,
  st as selectCompletedCandleRevisionsAt,
  ln as selectReplayRecordsAt,
  Id as serializeExecutionSession,
  sf as serializeReplayAnalysisSession,
  Gd as serializeReplaySession,
  Pd as simulateExecutionToHorizon,
  kn as strategyProfileHash,
  _ as strictTimeframeToSeconds,
  at as timeframeToSeconds,
  Mi as tradePlanId,
  ft as universeMembershipObservationId,
  Wi as validateExecutionSessionIntegrity,
  Dn as validateReplayAnalysisSession,
  Di as venueExecutionRulesHash
};
