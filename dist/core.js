var vo = Object.defineProperty;
var di = (e) => {
  throw TypeError(e);
};
var po = (e, t, n) => t in e ? vo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ee = (e, t, n) => po(e, typeof t != "symbol" ? t + "" : t, n), Vt = (e, t, n) => t.has(e) || di("Cannot " + n);
var O = (e, t, n) => (Vt(e, t, "read from private field"), n ? n.call(e) : t.get(e)), ue = (e, t, n) => t.has(e) ? di("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), Ie = (e, t, n, i) => (Vt(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), de = (e, t, n) => (Vt(e, t, "access private method"), n);
function T(e) {
  const t = /* @__PURE__ */ new Set();
  function n(r, o = !1) {
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
    if (t.has(r)) throw new TypeError("Canonical JSON does not support cycles");
    t.add(r);
    let a;
    return Array.isArray(r) ? a = `[${r.map((s) => n(s, !0) ?? "null").join(",")}]` : a = `{${Object.keys(r).sort().flatMap((c) => {
      const u = n(r[c]);
      return u == null ? [] : [`${JSON.stringify(c)}:${u}`];
    }).join(",")}}`, t.delete(r), a;
  }
  const i = n(e);
  if (i == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return i;
}
function R(e) {
  const t = new TextEncoder().encode(T(e));
  let n = 0xcbf29ce484222325n;
  for (const i of t)
    n ^= BigInt(i), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function h(e) {
  return Vi(JSON.parse(T(e)));
}
function Vi(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) Vi(t);
    Object.freeze(e);
  }
  return e;
}
const fi = 5;
function Pt(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function vn(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const t = Number.parseInt(e, 10), n = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(t) && Number.isSafeInteger(t * n);
}
function L(e) {
  if (!vn(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return Pt(e);
}
function we(e, t) {
  return e.knownAt ?? e.bucket + L(t);
}
function pn(e, t, n) {
  const i = L(t), r = /* @__PURE__ */ new Map(), o = e.filter((a) => {
    if (!Number.isFinite(a.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (a.bucket + i > n) return !1;
    if (a.knownAt != null && !Number.isFinite(a.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${a.bucket}`);
    return we(a, t) <= n;
  });
  for (const a of [...o].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!So(a) || a.bucket % i !== 0 || Math.floor(a.ts / i) * i !== a.bucket)
      throw new RangeError(`Invalid candle for bucket ${a.bucket}`);
    const s = we(a, t);
    if (s < a.bucket + i)
      throw new RangeError(`Candle revision predates close for bucket ${a.bucket}`);
    const c = r.get(a.bucket);
    if (c) {
      const u = we(c, t);
      if (u === s && pi(c, t) !== pi(a, t))
        throw new Error(`Conflicting candle revisions for bucket ${a.bucket} at ${s}`);
      if (u > s) continue;
    }
    r.set(a.bucket, a);
  }
  return [...r.values()].sort((a, s) => a.bucket - s.bucket);
}
function Fl(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function _e(e, t) {
  return Math.floor(e / t) * t;
}
function Bi(e) {
  const t = zi(e);
  if (!t || typeof t != "object") return null;
  const n = t, i = vi(n.ts), r = ie(n.o), o = ie(n.h), a = ie(n.l), s = ie(n.c), c = n.knownAt == null ? void 0 : vi(n.knownAt);
  return i == null || r == null || o == null || a == null || s == null || n.knownAt != null && c == null ? null : {
    ts: i,
    o: r,
    h: o,
    l: a,
    c: s,
    v_base: ie(n.v_base),
    v_quote: ie(n.v_quote),
    ver: ie(n.ver),
    knownAt: c ?? void 0
  };
}
function $i(e, t, n) {
  const i = Pt(t), r = Ao(
    e.map((s, c) => qi(s, c)).filter((s) => s != null),
    i
  ).slice(-Math.max(1, n));
  if (!r.length)
    return {
      timeframeSec: i,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const o = _e(r[0].ts, i), a = r.map((s) => {
    const c = _e(s.ts, i);
    return {
      ...s,
      bucket: c,
      x: (c - o) / i
    };
  });
  return hn({
    timeframeSec: i,
    firstBucket: o,
    candles: a,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function Ml(e, t, n) {
  const i = e.candles.length, r = t.map((a, s) => qi(a, s)).filter((a) => a != null).filter((a) => _e(a.ts, e.timeframeSec) < e.firstBucket).sort(Ui);
  if (!r.length) return 0;
  const o = $i(
    [...r, ...e.candles],
    n,
    r.length + e.candles.length
  );
  return e.timeframeSec = o.timeframeSec, e.firstBucket = o.firstBucket, e.candles = o.candles, e.positionByBucket = o.positionByBucket, Math.max(0, e.candles.length - i);
}
function ho(e) {
  const t = new Float32Array(e.length * fi);
  return e.forEach((n, i) => {
    t.set([n.x, n.o, n.h, n.l, n.c], i * fi);
  }), new Uint8Array(t.buffer);
}
function mi(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function Ll(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function yo(e, t, n, i = 3) {
  const r = Bi(t);
  if (!r) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const o = _e(r.ts, e.timeframeSec);
  if (o < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const a = e.positionByBucket.get(o), s = (o - e.firstBucket) / e.timeframeSec, c = { ...r, bucket: o, x: s };
  if (a != null)
    return To(c, e.candles[a]) ? { kind: "ignore", reason: "stale-version" } : Ro(e.candles[a], c) ? (e.candles[a] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[a] = c, {
      kind: "replace",
      position: a,
      bytes: mi(c)
    });
  const u = e.candles[e.candles.length - 1];
  return o <= u.bucket ? { kind: "ignore", reason: "stale-gap" } : (o - u.bucket) / e.timeframeSec > i ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), go(e), { kind: "reset", bytes: ho(e.candles) }) : (hn(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: mi(c)
  }));
}
function Dl(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, i = -1 / 0;
  for (const a of e)
    n = Math.min(n, a.l), i = Math.max(i, a.h);
  for (const a of t)
    for (let s = 1; s < a.length; s += 2) {
      const c = a[s];
      Number.isFinite(c) && (n = Math.min(n, c), i = Math.max(i, c));
    }
  const o = Math.max(1e-9, i - n) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: n - o,
    maxY: i + o
  };
}
function Hl(e, t, n) {
  const i = Pt(n), r = Math.floor(Date.now() / 1e3), o = _e(r, i), a = e.split("").reduce((u, l) => u + l.charCodeAt(0), 0), s = [];
  let c = 40 + a % 160;
  for (let u = Math.max(1, t) - 1; u >= 0; u--) {
    const l = o - u * i, d = Math.sin((t - u + a) / 9) * 0.8, f = c, m = Math.max(1e-4, f + d + Math.cos((t - u) / 13) * 0.35), v = Math.max(f, m) + 0.35 + Math.abs(Math.sin(u + a)) * 0.5, y = Math.min(f, m) - 0.35 - Math.abs(Math.cos(u + a)) * 0.5, p = 50 + a % 90 + Math.abs(Math.sin((t - u + a) / 5)) * 180;
    s.push({ ts: l, o: f, h: v, l: y, c: m, v_base: p, v_quote: p * m }), c = m;
  }
  return $i(s, n, t);
}
function Vl(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const i = n.bucket + e.timeframeSec, r = Math.sin(i / 600) * 0.7, o = n.c, a = Math.max(1e-4, o + r), s = Math.max(o, a) + 0.5, c = Math.min(o, a) - 0.5, u = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(r) * 0.36));
  return yo(e, { ts: i, o, h: s, l: c, c: a, v_base: u, v_quote: u * a }, t);
}
function go(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  hn(e);
}
function hn(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function qi(e, t) {
  const n = Bi(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function Ao(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = _e(i.ts, t), o = n.get(r);
    (!o || Ui(i, o) > 0) && n.set(r, i);
  }
  return Array.from(n.entries()).sort(([i], [r]) => i - r).map(([, i]) => Eo(i));
}
function Ui(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, i = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== i ? n - i : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function Eo(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function vi(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? bo(e) : wo(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function bo(e) {
  const [
    t,
    n = 1,
    i = 0,
    r = 0,
    o = 0,
    a = 0,
    s = 0,
    c = 0,
    u = 0
  ] = e, l = Math.floor(Number(a) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(i) - Number(s),
    Number(r) - Number(c),
    Number(o) - Number(u),
    l
  );
}
function wo(e) {
  const [t, n = 1, i = 1, r = 0, o = 0, a = 0, s = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(i),
    Number(r),
    Number(o),
    Number(a),
    Number(s)
  );
}
function Ro(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function To(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function ie(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function So(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && dt(e.o) && dt(e.h) && dt(e.l) && dt(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && ft(e.v_base) && ft(e.v_quote) && ft(e.ver) && ft(e.knownAt);
}
function pi(e, t) {
  return T({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: ie(e.v_base) ?? null,
    vQuote: ie(e.v_quote) ?? null,
    ver: ie(e.ver) ?? null,
    knownAt: we(e, t)
  });
}
function dt(e) {
  return Number.isFinite(e) && e > 0;
}
function ft(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function zi(e) {
  if (typeof e == "string")
    try {
      return zi(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
const ve = "impulse_fade_v1", te = "impulse_fade_v1.lifecycle.1", xo = "impulse_fade_v1.lifecycle-config.1", ze = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function Bl(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.c, o >= t && (i -= e[o - t].c), o >= t - 1 && n.push(r.x, i / t);
  }), new Float32Array(n);
}
function $l(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], i = 2 / (t + 1);
  let r = 0;
  for (let o = 0; o < t; o++)
    r += e[o].c;
  r /= t, n.push(e[t - 1].x, r);
  for (let o = t; o < e.length; o++)
    r = (e[o].c - r) * i + r, n.push(e[o].x, r);
  return new Float32Array(n);
}
function ql(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], i = t * (t + 1) / 2;
  for (let r = t - 1; r < e.length; r++) {
    let o = 0;
    for (let a = 0; a < t; a++)
      o += e[r - t + 1 + a].c * (a + 1);
    n.push(e[r].x, o / i);
  }
  return new Float32Array(n);
}
function Ul(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const i = [], r = [], o = [];
  let a = 0, s = 0;
  return e.forEach((c, u) => {
    if (a += c.c, s += c.c * c.c, u >= t) {
      const l = e[u - t].c;
      a -= l, s -= l * l;
    }
    if (u >= t - 1) {
      const l = a / t, d = Math.max(0, s / t - l * l), f = Math.sqrt(d) * n;
      i.push(c.x, l), r.push(c.x, l + f), o.push(c.x, l - f);
    }
  }), {
    basis: new Float32Array(i),
    upper: new Float32Array(r),
    lower: new Float32Array(o)
  };
}
function zl(e, t = 14) {
  return Re(nr(e, t));
}
function Ql(e, t = 14, n = 14, i = 3, r = 3) {
  const o = nr(e, t), a = Te(n);
  if (o.length < a)
    return { k: new Float32Array(), d: new Float32Array() };
  const s = [];
  for (let l = a - 1; l < o.length; l++) {
    let d = 1 / 0, f = -1 / 0;
    for (let y = 0; y < a; y++) {
      const p = o[l - y].value;
      d = Math.min(d, p), f = Math.max(f, p);
    }
    const m = f - d, v = m > 0 ? (o[l].value - d) / m * 100 : 50;
    s.push({ x: o[l].x, value: v });
  }
  const c = bi(s, Te(i)), u = bi(c, Te(r));
  return {
    k: Re(c),
    d: Re(u)
  };
}
function jl(e, t = 12, n = 26, i = 9) {
  const r = tn(e, t), o = tn(e, n), a = [];
  for (let l = 0; l < e.length; l++) {
    const d = r[l], f = o[l];
    d == null || f == null || a.push({ x: e[l].x, value: d - f });
  }
  const s = Ta(a, i), c = new Map(a.map((l) => [l.x, l.value])), u = s.map((l) => ({
    x: l.x,
    value: (c.get(l.x) ?? l.value) - l.value
  }));
  return {
    macd: Re(a),
    signal: Re(s),
    histogram: Re(u)
  };
}
function Wl(e, t = 14) {
  const n = kt(e, t), i = [];
  return n.forEach((r, o) => {
    r != null && i.push({ x: e[o].x, value: r });
  }), Re(i);
}
function yn(e, t = {}) {
  const n = F(t.windowSeconds, 60, 2592e3, 86400), i = F(t.historyDays, 1, 365, 180), r = F(t.minSamples, 1, 5e3, 20), o = F(t.emaPeriod, 2, 500, 20), a = F(t.atrPeriod, 2, 500, 14), s = er(e);
  if (!s)
    return oa(n);
  const c = e.indexOf(s), u = tr(e, s.bucket - n, c), l = u && z(u.c) ? (s.c / u.c - 1) * 100 : null, d = l == null ? [] : aa(e, {
    windowSeconds: n,
    earliestBucket: s.bucket - i * 86400,
    excludeBucket: s.bucket
  }), f = l != null && d.length >= r ? sa(d, l) : null, m = l != null && d.length >= r ? ca(d, l) : null, v = tn(e, o)[c] ?? null, y = kt(e, a)[c] ?? null, p = v != null && y != null && Number.isFinite(v) && Number.isFinite(y) && y > 0 ? (s.c - v) / y : null;
  return {
    candle: s,
    referenceCandle: u,
    windowSeconds: n,
    returnPct: l,
    percentile: f,
    zScore: m,
    rollingReturnCount: d.length,
    ema: v,
    atr: y,
    atrExtension: p
  };
}
function Po(e = {}) {
  var Q, W, N;
  const t = e.executionTimeframe ?? "chart", n = S(e.asOf), i = S(e.latestTs) ?? jo(e.candles ?? [], t) ?? S((Q = e.structure) == null ? void 0 : Q.updatedTs) ?? S((W = e.marketStructure) == null ? void 0 : W.summary.updatedTs) ?? null, r = n ?? i, o = r == null ? null : wn(e.candles ?? [], r, t), a = (o == null ? void 0 : o.candle.c) ?? S(e.latestPrice), s = Co(e.marketStructure ?? null, n), c = (s == null ? void 0 : s.summary) ?? Io(e.structure, n), u = e.htfStructures ?? [], l = n == null ? e.htfStructures ?? [] : An(e.htfStructures ?? [], n), d = (e.srZones ?? []).filter(
    (M) => n == null || V(M) <= n
  ), f = (e.rsDivergences ?? []).filter(
    (M) => n == null || V(M) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (M) => n == null || V(M) <= n
  ), v = q(e.resistanceNearPct, 0, 10, 1.5), y = q(e.retestNearPct, 0, 10, 0.8), p = Xo(e.extension ?? null), g = Yo(d, a, v), w = Zo(f), b = Jo(c), k = ea(
    m,
    e.avwapDistancePct
  ), P = ta(c, d, a, y), E = na(p, g, c, a), A = [
    p,
    g,
    w,
    b,
    k,
    P
  ], x = {
    checks: A,
    asOf: r,
    updatedTs: i,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? De({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, I = Vo({
    extension: p,
    htfResistance: g,
    htfStructures: l,
    rsWeakness: w,
    structureShift: b,
    avwapFailure: k,
    retest: P,
    invalidated: E
  });
  return (N = e.candles) != null && N.length && r != null ? No({
    ...e,
    asOf: r,
    latestPrice: a,
    marketStructure: s,
    structure: c,
    htfStructures: u,
    srZones: d,
    rsDivergences: f,
    anchoredVwapSignals: m,
    checks: A,
    executionTimeframe: t
  }) : Xi({
    ...x,
    state: I,
    reason: ra(I, A),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function Co(e, t) {
  var o;
  if (!e || t == null) return e;
  const n = e.swings.filter((a) => a.knownAt <= t), i = e.breaks.filter((a) => a.knownAt <= t), r = ((o = pe(i)) == null ? void 0 : o.direction) ?? "neutral";
  return {
    swings: n,
    breaks: i,
    trend: r,
    summary: Tn(n, i, r)
  };
}
function Io(e, t) {
  if (!e || t == null) return e ?? null;
  const n = S(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function Gl(e) {
  return ko(e).records;
}
function De(e = {}) {
  var t, n, i, r, o, a, s, c, u, l, d;
  return R({
    lifecycleVersion: te,
    lifecycleConfigVersion: xo,
    candidateGate: ze,
    extension: {
      windowSeconds: F(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: F((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: F((i = e.extensionOptions) == null ? void 0 : i.minSamples, 1, 5e3, 20),
      emaPeriod: F((r = e.extensionOptions) == null ? void 0 : r.emaPeriod, 2, 500, 20),
      atrPeriod: F((o = e.extensionOptions) == null ? void 0 : o.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: F(
        (a = e.marketStructureOptions) == null ? void 0 : a.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: F(
        (s = e.marketStructureOptions) == null ? void 0 : s.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: F((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: q((u = e.marketStructureOptions) == null ? void 0 : u.minMoveAtr, 0, 10, 0.75),
      maxSwings: F((l = e.marketStructureOptions) == null ? void 0 : l.maxSwings, 1, 500, 120),
      maxBreaks: F((d = e.marketStructureOptions) == null ? void 0 : d.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: q(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: q(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: q(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: q(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: q(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: F(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Kl(e) {
  var s;
  const t = Wi(e), n = pe(t);
  if (n == null) return null;
  const i = ji(e, n), r = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], a = new Set(
    o.map((c) => Ae(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && V(c) <= n && a.add(V(c));
  for (const c of [...a].sort((u, l) => u - l))
    gn(
      Ct(o, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (s = e.config) == null ? void 0 : s.marketStructureOptions,
      c,
      r
    );
  return Qi(
    e,
    n,
    r,
    i
  );
}
function ko(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], i = e.config ?? {}, r = De(i), o = Wi(e), a = ji(
    e,
    pe(o) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), l = S(e.from) ?? -1 / 0;
  let d = null;
  return { records: o.map((m) => {
    var b, k, P, E, A;
    const v = Qi(
      e,
      m,
      s,
      a
    ), y = Gi(e.candidateMetrics, m), p = (y == null ? void 0 : y.metrics) ?? bn(
      yn(
        Ct(n, t, m),
        i.extensionOptions
      )
    );
    d = v;
    const g = v.evidence.filter((x) => c.has(x.id) ? !1 : (c.add(x.id), x.knownAt >= l)), w = v.transitions.filter((x) => {
      const I = Oo(x);
      return u.has(I) ? !1 : (u.add(I), x.knownAt >= l);
    });
    return {
      asOf: m,
      setupFamily: ve,
      lifecycleVersion: te,
      lifecycleConfigHash: r,
      candidateGatePassed: Ye(p),
      candidateId: ((b = v.candidate) == null ? void 0 : b.id) ?? null,
      candidateDetectedAt: ((k = v.candidate) == null ? void 0 : k.detectedAt) ?? null,
      initialMtfContext: ((P = v.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: pe(w) ?? null,
      transitions: w,
      evidenceAdded: g,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((E = v.candidate) == null ? void 0 : E.episodeHigh) ?? null,
      episodeHighTime: ((A = v.candidate) == null ? void 0 : A.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: d };
}
function Qi(e, t, n, i) {
  const r = e.executionTimeframe, o = e.candlesByTimeframe[r] ?? [], a = e.config ?? {}, s = De(a), c = Ct(o, r, t), u = yn(c, a.extensionOptions), l = Gi(e.candidateMetrics, t), d = (l == null ? void 0 : l.metrics) ?? bn(u), f = gn(
    c,
    r,
    e.structureEvents ?? [],
    a.marketStructureOptions,
    t,
    n
  ), m = i.filter(
    (y) => (y.summary.updatedTs ?? 0) <= t
  ), v = pe(c) ?? null;
  return Po({
    candles: o,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: r,
    asOf: t,
    extensionOptions: a.extensionOptions,
    candidateMetrics: e.candidateMetrics,
    extension: d,
    marketStructure: f,
    structure: f.summary,
    htfStructures: m,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (v == null ? void 0 : v.c) ?? null,
    latestTs: t,
    resistanceNearPct: a.resistanceNearPct,
    retestNearPct: a.retestNearPct,
    retestToleranceBps: a.retestToleranceBps,
    retestToleranceAtr: a.retestToleranceAtr,
    invalidationBps: a.invalidationBps,
    maxCandidateAgeSeconds: a.maxCandidateAgeSeconds,
    lifecycleConfigHash: s
  });
}
function ji(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, i]) => {
    const r = new Set(
      i.map((o) => Ae(o, n)).filter((o) => o <= t)
    );
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === n && V(o) <= t && r.add(V(o));
    return [...r].sort((o, a) => o - a).map((o) => {
      var s;
      const a = gn(
        Ct(i, n, o),
        n,
        e.structureEvents ?? [],
        (s = e.config) == null ? void 0 : s.marketStructureOptions,
        o
      );
      return {
        timeframe: n,
        summary: { ...a.summary, updatedTs: o }
      };
    });
  });
}
const Xl = "openTime";
function Ae(e, t) {
  return (S(e.bucket) ?? S(e.ts) ?? 0) + Math.max(1, Pt(t));
}
function Ct(e, t, n) {
  return pn(e, t, n);
}
function Wi(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [o, a] of Object.entries(e.candlesByTimeframe))
    for (const s of a)
      t.add(s.knownAt ?? Ae(s, o));
  for (const o of e.candidateMetrics ?? [])
    t.add(S(o.knownAt) ?? o.asOf);
  for (const o of e.structureEvents ?? []) t.add(V(o));
  for (const o of e.avwapEvents ?? []) t.add(V(o));
  for (const o of e.relativeStrengthEvents ?? []) t.add(V(o));
  for (const o of e.supportResistanceZones ?? []) t.add(V(o));
  for (const o of e.evaluationPoints ?? []) {
    const a = S(o);
    a != null && t.add(a);
  }
  const n = [...t].filter(Number.isFinite).sort((o, a) => o - a), i = S(e.from) ?? n[0] ?? 0, r = S(e.to) ?? pe(n) ?? i;
  return t.add(i), t.add(r), [...t].filter((o) => Number.isFinite(o) && o >= i && o <= r).sort((o, a) => o - a);
}
function Gi(e, t) {
  return pe([...e ?? []].filter((n) => (S(n.knownAt) ?? n.asOf) <= t).sort(
    (n, i) => (S(n.knownAt) ?? n.asOf) - (S(i.knownAt) ?? i.asOf) || n.asOf - i.asOf
  )) ?? null;
}
function gn(e, t, n, i, r, o) {
  var d;
  const a = je(e, i), s = n.filter(
    (f) => (!f.sourceTimeframe || f.sourceTimeframe === t) && V(f) <= r
  ), c = o ?? /* @__PURE__ */ new Map();
  for (const f of [...a.breaks, ...s])
    c.set(
      me(
        f.kind,
        t,
        f.eventTime,
        f.knownAt,
        `${f.direction}:${f.level}`
      ),
      f
    );
  const u = [...c.values()].filter((f) => f.knownAt <= r).sort(
    (f, m) => f.knownAt - m.knownAt || f.eventTime - m.eventTime
  );
  if (!u.length) return a;
  const l = ((d = pe(u)) == null ? void 0 : d.direction) ?? a.trend;
  return {
    swings: a.swings,
    breaks: u,
    trend: l,
    summary: Tn(a.swings, u, l)
  };
}
function Oo(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function No(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, i = _o(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), r = Uo(i, n);
  let o = Fo(i, e);
  if (!o && Ye(e.extension ?? null)) {
    const a = wn(t, e.asOf, e.executionTimeframe);
    a && (o = {
      index: a.index,
      candle: a.candle,
      eventTime: ne(a.candle),
      knownAt: Math.min(
        e.asOf,
        le(t, a.index, e.executionTimeframe)
      ),
      metrics: En(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, r.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return o ? Ki(o, e, e.asOf, r) : Xi({
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
function _o(e, t, n, i, r) {
  if (r != null && r.length)
    return [...r].map((a) => {
      const s = S(a.knownAt) ?? a.asOf, c = wn(e, s, i);
      if (!c || s > n) return null;
      const u = S(a.eventTime) ?? ne(c.candle), l = En(a.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: u,
        knownAt: s,
        metrics: l,
        pass: Ye(l),
        rollingReturnCount: Math.max(0, Math.trunc(a.sampleCount ?? 0))
      };
    }).filter((a) => a != null).sort((a, s) => a.knownAt - s.knownAt || a.eventTime - s.eventTime);
  const o = [];
  for (let a = 0; a < e.length; a += 1) {
    const s = e[a], c = le(e, a, i);
    if (c > n) continue;
    const u = yn(e.slice(0, a + 1), t), l = bn(u);
    o.push({
      index: a,
      candle: s,
      eventTime: ne(s),
      knownAt: c,
      metrics: l,
      pass: Ye(l),
      rollingReturnCount: u.rollingReturnCount
    });
  }
  return o;
}
function Fo(e, t) {
  var o;
  const n = [];
  let i = !1;
  for (const a of e)
    a.pass && !i && n.push(a), i = a.pass;
  if (!n.length) return null;
  let r = n[0];
  for (const a of n.slice(1)) {
    const c = ((o = Ki(r, t, a.knownAt, []).candidate) == null ? void 0 : o.terminalAt) ?? null;
    c != null && e.some((u) => u.knownAt > c && u.knownAt < a.knownAt && !u.pass) && (r = a);
  }
  return r;
}
function Ki(e, t, n, i) {
  const r = (t.symbol ?? "UNKNOWN").toUpperCase(), o = t.source ?? "chart", a = t.venue ?? "", s = t.executionTimeframe, c = An(
    t.htfStructures ?? [],
    e.knownAt
  ).map((A) => ({
    timeframe: A.timeframe,
    state: A.summary.state,
    trend: A.summary.trend,
    transitionDirection: A.summary.transitionDirection,
    updatedTs: A.summary.updatedTs
  })), u = Qo({
    setupFamily: ve,
    symbol: r,
    source: o,
    venue: a,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), l = [
    {
      id: me("candidate_detected", s, e.eventTime, e.knownAt),
      code: "candidate_detected",
      explanation: "Impulse Fade v1 extension gate crossed from false to true",
      eventTime: e.eventTime,
      knownAt: e.knownAt,
      sourceTimeframe: s,
      price: e.candle.c,
      contributesTo: "developing"
    }
  ], d = [
    {
      from: "notCandidate",
      to: "developing",
      knownAt: e.knownAt,
      evidenceIds: [l[0].id],
      evidenceCodes: [l[0].code],
      explanation: "Candidate episode detected"
    }
  ], f = Do(t, e, n), m = Mo(e, t, n);
  let v = "developing", y = e.knownAt, p = null, g = null, w = null, b = null, k = null;
  for (const A of m) {
    if (p != null) break;
    if (!(A.knownAt < e.knownAt || A.knownAt > n)) {
      if (A.lifecycleKind === "deterioration") {
        l.push({ ...A, contributesTo: "deteriorating" }), v === "developing" && (d.push(Be(v, "deteriorating", A)), v = "deteriorating", y = A.knownAt);
        continue;
      }
      if (A.lifecycleKind === "bearishBreak") {
        l.push({ ...A, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (d.push(Be(v, "waitingForRetest", A)), v = "waitingForRetest", y = A.knownAt, g = A.breakLevel ?? null);
        continue;
      }
      if (A.lifecycleKind === "retest") {
        v === "waitingForRetest" && g && A.relatedEventId === g.evidenceId && A.knownAt > g.knownAt && (l.push({ ...A, contributesTo: "entryCandidate" }), d.push(Be(v, "entryCandidate", A)), v = "entryCandidate", y = A.knownAt, w = A.breakLevel ?? g);
        continue;
      }
      if (A.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (l.push({ ...A, contributesTo: "invalidated" }), d.push(Be(v, "invalidated", A)), v = "invalidated", y = A.knownAt, p = A.knownAt, b = A.explanation);
        continue;
      }
      A.lifecycleKind === "expiry" && v !== "entryCandidate" && (l.push({ ...A, contributesTo: "expired" }), d.push(Be(v, "expired", A)), v = "expired", y = A.knownAt, p = A.knownAt, k = A.explanation);
    }
  }
  const P = Ji(
    t.candles ?? [],
    e.eventTime,
    n,
    s
  ), E = {
    id: u,
    setupFamily: ve,
    lifecycleVersion: te,
    lifecycleConfigHash: t.lifecycleConfigHash ?? De({
      extensionOptions: t.extensionOptions,
      resistanceNearPct: t.resistanceNearPct,
      retestNearPct: t.retestNearPct,
      retestToleranceBps: t.retestToleranceBps,
      retestToleranceAtr: t.retestToleranceAtr,
      invalidationBps: t.invalidationBps,
      maxCandidateAgeSeconds: t.maxCandidateAgeSeconds
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
    stateSince: y,
    terminalAt: p
  };
  return {
    strategy: "pumpFade",
    setupFamily: ve,
    lifecycleVersion: te,
    lifecycleConfigHash: E.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: y,
    label: It(v),
    reason: zo(v, l, d, b, k),
    checks: t.checks,
    updatedTs: n,
    candidate: E,
    evidence: l.sort((A, x) => A.knownAt - x.knownAt || A.eventTime - x.eventTime),
    transitions: d,
    pendingConditions: Zi(v, g),
    activeBreakLevel: g,
    retestLevel: w,
    confluence: f,
    invalidationReason: b,
    expiryReason: k,
    dataQuality: i
  };
}
function Mo(e, t, n) {
  const i = [], r = t.executionTimeframe;
  for (const u of t.rsDivergences ?? []) {
    if (u.direction !== "bearish") continue;
    const l = V(u);
    if (!Qe(u, e, n)) continue;
    const d = u.signal === "break" ? "rs_break_bearish" : u.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    i.push({
      id: me(d, r, u.eventTime, l, u.x),
      code: d,
      explanation: `${u.label}: bearish relative-strength deterioration`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: r,
      price: u.price,
      value: u.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const u of t.anchoredVwapSignals ?? []) {
    const l = V(u);
    u.kind !== "failedReclaim" || !Qe(u, e, n) || i.push({
      id: me("avwap_failed_reclaim", r, u.eventTime, l, u.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: r,
      price: u.price,
      level: u.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const o = Ho(t), a = [];
  for (const u of o) {
    const l = V(u);
    if (u.direction !== "bearish" || !Qe(u, e, n)) continue;
    const d = u.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", f = me(d, r, u.eventTime, l, u.x), m = {
      level: u.level,
      sourceTimeframe: r,
      eventTime: u.eventTime,
      knownAt: l,
      evidenceId: f
    }, v = {
      id: f,
      code: d,
      explanation: `${u.label} down through ${oe(u.level)}`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: r,
      level: u.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    a.push(v), i.push(v);
  }
  for (const u of a) {
    const l = Lo(e, u, t, n);
    l && i.push(l);
  }
  for (const u of o) {
    const l = V(u);
    if (u.kind !== "StructureBreak" || u.direction !== "bullish" || !Qe(u, e, n))
      continue;
    const d = (t.candles ?? [])[u.index], f = Ji(
      t.candles ?? [],
      e.eventTime,
      l - 1,
      r
    ), m = q(t.invalidationBps, 0, 1e3, 10);
    !d || (f == null ? void 0 : f.price) == null || d.c <= f.price * (1 + m / 1e4) || i.push({
      id: me("bullish_continuation_invalidation", r, u.eventTime, l, u.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${oe(f.price)}`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: r,
      price: d.c,
      level: f.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const s = F(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + s;
  return c <= n && i.push({
    id: me("candidate_expired", r, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Ko(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: r,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), i.sort(
    (u, l) => u.knownAt - l.knownAt || u.eventTime - l.eventTime || u.sortPriority - l.sortPriority || u.code.localeCompare(l.code)
  );
}
function Lo(e, t, n, i) {
  var l;
  const r = n.candles ?? [], o = t.breakLevel;
  if (!o || !Number.isFinite(o.level)) return null;
  const a = q(n.retestToleranceBps, 0, 1e3, 35), s = q(n.retestToleranceAtr, 0, 10, 0.25), c = F((l = n.extensionOptions) == null ? void 0 : l.atrPeriod, 2, 100, 14), u = kt(r, c);
  for (let d = 0; d < r.length; d += 1) {
    const f = r[d], m = le(r, d, n.executionTimeframe), v = ne(f);
    if (m <= t.knownAt || v < t.knownAt || v < e.knownAt || m > i)
      continue;
    const y = u[d] ?? 0, p = Math.max(
      o.level * (a / 1e4),
      Number.isFinite(y) ? y * s : 0
    );
    if (f.h >= o.level - p && f.l <= o.level + p && f.c < o.level && f.c <= f.o)
      return {
        id: me(
          "bearish_retest_rejection",
          o.sourceTimeframe,
          ne(f),
          m,
          d
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${oe(o.level)}`,
        eventTime: v,
        knownAt: m,
        sourceTimeframe: o.sourceTimeframe,
        price: f.c,
        level: o.level,
        relatedEventId: o.evidenceId,
        lifecycleKind: "retest",
        sortPriority: 40,
        breakLevel: o
      };
  }
  return null;
}
function Do(e, t, n) {
  const i = [], r = Rn(
    e.srZones.filter((s) => V(s) <= n),
    e.latestPrice,
    q(e.resistanceNearPct, 0, 10, 1.5)
  );
  r && i.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${oe(r.low)}-${oe(r.high)}`,
    eventTime: r.eventTime,
    knownAt: r.knownAt,
    sourceTimeframe: "MTF",
    level: r.center
  });
  const o = [...e.anchoredVwapSignals ?? []].filter(
    (s) => s.kind === "loss" && Qe(s, t, n)
  ).sort((s, c) => V(c) - V(s))[0];
  o && V(o) <= n && i.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: o.vwap
  });
  const a = S(e.avwapDistancePct);
  a != null && i.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${We(a, 1)}% from AVWAP`,
    value: a,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of An(e.htfStructures, n))
    s.summary.state !== "neutral" && i.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: Go(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return i;
}
function An(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    const r = S(i.summary.updatedTs);
    if (r != null && r > t) continue;
    const o = n.get(i.timeframe), a = S(o == null ? void 0 : o.summary.updatedTs) ?? -1 / 0;
    (!o || (r ?? -1 / 0) >= a) && n.set(i.timeframe, i);
  }
  return [...n.values()];
}
function Ho(e) {
  var i, r, o;
  const t = (r = (i = e.marketStructure) == null ? void 0 : i.breaks) != null && r.length ? e.marketStructure.breaks : (o = e.structure) != null && o.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((a) => {
    const s = `${a.kind}:${a.direction}:${a.x}:${a.level}:${V(a)}`;
    return n.has(s) ? !1 : (n.add(s), !0);
  });
}
function Vo(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && hi(e.htfResistance, e.htfStructures) ? "deteriorating" : hi(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function Xi(e) {
  return {
    strategy: "pumpFade",
    setupFamily: ve,
    lifecycleVersion: te,
    lifecycleConfigHash: e.lifecycleConfigHash ?? De(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: It(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: Zi(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function Yi(e, t = {}) {
  const n = la(e, t);
  if (n == null) return new Float32Array();
  const i = [];
  let r = 0, o = 0;
  for (let a = n; a < e.length; a += 1) {
    const s = e[a];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!z(c)) continue;
    const u = ua(s, c);
    u <= 0 || (r += u, o += c * u, i.push(s.x, o / r));
  }
  return new Float32Array(i);
}
function Yl(e, t = {}) {
  const n = S(t.anchorBucket), i = S(t.anchorX), r = Yi(e, t);
  if (r.length < 2)
    return {
      anchorBucket: n,
      anchorX: i,
      value: null,
      distancePct: null,
      candle: null
    };
  const o = r[r.length - 1], a = er(e), s = a && z(o) ? (a.c - o) / o * 100 : null;
  return {
    anchorBucket: n,
    anchorX: i,
    value: o,
    distancePct: s,
    candle: a
  };
}
function Zl(e, t = {}, n = 20) {
  const i = F(n, 1, 200, 20), r = Yi(e, t);
  if (r.length < 4) return [];
  const o = new Map(e.map((c, u) => [c.x, { candle: c, index: u }])), a = [];
  let s = null;
  for (let c = 0; c < r.length; c += 2) {
    const u = r[c], l = r[c + 1], d = o.get(u);
    if (!d || !z(l) || !z(d.candle.c)) continue;
    const f = le(e, d.index), m = d.candle.c > l ? "above" : d.candle.c < l ? "below" : null;
    m && (s === "above" && m === "below" ? a.push(Bt("loss", d.index, d.candle, l, f)) : s === "below" && m === "above" ? a.push(Bt("reclaim", d.index, d.candle, l, f)) : s === "below" && m === "below" && d.candle.h >= l && d.candle.c < l && a.push(
      Bt("failedReclaim", d.index, d.candle, l, f)
    ), s = m);
  }
  return a.slice(-i);
}
function Bo(e, t = {}) {
  const n = F(t.lookback, 20, 2e3, 500), i = F(t.pivotStrength, 1, 20, 3), r = F(t.atrPeriod, 2, 100, 14), o = q(t.minMoveAtr, 0, 10, 0.75), a = F(t.maxSwings, 1, 500, 120), s = Math.max(0, e.length - n), c = e.slice(s);
  if (c.length < i * 2 + 1) return [];
  const u = kt(e, r), l = [];
  for (let f = i; f < c.length - i; f += 1) {
    const m = c[f], v = s + f, y = u[v] ?? null, p = le(e, v + i);
    Ea(c, f, i) && l.push(yi("SwingHigh", v, m, m.h, y, p)), ba(c, f, i) && l.push(yi("SwingLow", v, m, m.l, y, p));
  }
  const d = [];
  for (const f of l) {
    const m = d[d.length - 1];
    if (!m) {
      d.push(f);
      continue;
    }
    if (m.kind === f.kind) {
      ha(f, m) && (d[d.length - 1] = f);
      continue;
    }
    Math.abs(f.price - m.price) >= ya(f, m, o) && d.push(f);
  }
  return da(d).slice(-a);
}
function je(e, t = {}) {
  const n = F(t.maxSwings, 1, 500, 120), i = F(t.maxBreaks, 1, 200, 24), r = Bo(e, {
    ...t,
    maxSwings: Math.max(n, i * 4)
  }), o = [], a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, u = null, l = null, d = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const y = le(e, v);
    for (; c < r.length && r[c].index < v && r[c].knownAt <= y; ) {
      const g = r[c];
      g.kind === "SwingHigh" ? u = g : l = g, c += 1;
    }
    const p = e[v];
    if (u && !a.has(u.x) && p.c > u.price) {
      const g = d === "bearish" ? "StructureShift" : "StructureBreak";
      o.push(gi(g, "bullish", v, p, u, y)), a.add(u.x), d = "bullish";
    }
    if (l && !s.has(l.x) && p.c < l.price) {
      const g = d === "bullish" ? "StructureShift" : "StructureBreak";
      o.push(gi(g, "bearish", v, p, l, y)), s.add(l.x), d = "bearish";
    }
  }
  const f = r.slice(-n), m = o.slice(-i);
  return {
    swings: f,
    breaks: m,
    trend: d,
    summary: Tn(f, m, d)
  };
}
function Jl(e) {
  var r;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Ei(t, "SwingHigh", "rangeHigh", null, !0),
      Ei(t, "SwingLow", "rangeLow", null, !1)
    ].filter((o) => !!o);
  const i = n.state === "transitional" ? n.transitionDirection ?? ((r = n.lastBreak) == null ? void 0 : r.direction) ?? e.trend : n.state;
  return i === "bullish" ? [
    vt(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    vt(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((o) => !!o) : i === "bearish" ? [
    vt(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    vt(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((o) => !!o) : [];
}
function eu(e, t = {}) {
  var c, u;
  const n = F(t.lookback, 20, 1e3, 240), i = F(t.pivotStrength, 1, 20, 3), r = F(t.maxZones, 1, 12, 6), o = q(t.thicknessBps, 1, 100, 10), a = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = je(e, {
    lookback: n,
    pivotStrength: i,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return $o(s.swings, {
    maxZones: r,
    thicknessBps: o,
    latestX: a,
    referencePrice: t.referencePrice ?? ((u = e[e.length - 1]) == null ? void 0 : u.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function $o(e, t = {}) {
  var u;
  const n = F(t.maxZones, 1, 12, 6), i = q(t.thicknessBps, 1, 100, 10), r = t.latestX ?? ((u = e[e.length - 1]) == null ? void 0 : u.x) ?? 0, o = S(t.referencePrice), a = t.zonesPerSide == null ? null : F(t.zonesPerSide, 1, 12, 3), s = [];
  for (const l of e)
    ga(
      s,
      l.kind === "SwingHigh" ? "resistance" : "support",
      l,
      r - l.x + 1,
      i
    );
  const c = s.filter((l) => Number.isFinite(l.center) && l.high > l.low).sort((l, d) => d.score - l.score || d.touches - l.touches || d.lastX - l.lastX).slice(0, Math.max(n * 2, n));
  return Aa(c, n, o, a);
}
function qo(e, t) {
  const n = new Map(
    t.filter((a) => z(a.c)).map((a) => [a.bucket, a])
  );
  let i = null, r = null;
  const o = [];
  for (const a of e) {
    if (!z(a.c)) continue;
    const s = n.get(a.bucket);
    if (!s || !z(s.c)) continue;
    (i == null || r == null) && (i = a.c, r = s.c);
    const c = a.c / i / (s.c / r);
    o.push(a.x, (c - 1) * 100);
  }
  return new Float32Array(o);
}
function tu(e, t, n = {}) {
  var P;
  const i = F(n.maxDivergences, 1, 100, 16), r = q(n.minDeltaPct, 0, 50, 0.5), o = F(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), a = n.includeDivergences ?? !0, s = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, u = qo(e, t), l = Ra(u);
  if (!e.length || l.size < 2) return [];
  const f = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - o, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, i * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, i * 2)
  }, v = je(e, {
    ...m
  }), y = ma(e, u), p = je(y, {
    ...m
  }), g = new Map(e.map((E, A) => [E.x, { candle: E, index: A }])), w = [];
  let b = null, k = null;
  for (const E of v.swings) {
    const A = l.get(E.x);
    if (!(A == null || !Number.isFinite(A))) {
      if (E.kind === "SwingHigh") {
        if (b) {
          const x = l.get(b.x);
          x != null && Number.isFinite(x) && (E.price > b.price && A <= x - r ? a && w.push(
            mt(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              E,
              b,
              A,
              x,
              v.summary.state,
              p.summary.state
            )
          ) : E.price < b.price && A >= x + r && s && w.push(
            mt(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              E,
              b,
              A,
              x,
              v.summary.state,
              p.summary.state
            )
          ));
        }
        b = E;
        continue;
      }
      if (k) {
        const x = l.get(k.x);
        x != null && Number.isFinite(x) && (E.price > k.price && A <= x - r ? s && w.push(
          mt(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            E,
            k,
            A,
            x,
            v.summary.state,
            p.summary.state
          )
        ) : E.price < k.price && A >= x + r && a && w.push(
          mt(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            E,
            k,
            A,
            x,
            v.summary.state,
            p.summary.state
          )
        ));
      }
      k = E;
    }
  }
  if (c)
    for (const E of p.breaks) {
      if (E.x < f) continue;
      const A = g.get(E.x), x = l.get(E.x);
      if (!A || x == null || !Number.isFinite(x)) continue;
      const I = je(e.slice(0, A.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      va(E.direction, I.summary.state) && w.push(
        fa(
          E.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          E.direction,
          E.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          A.index,
          A.candle,
          x,
          E,
          I.summary.state,
          p.summary.state
        )
      );
    }
  return w.filter((E) => E.x >= f).sort((E, A) => E.x - A.x || Ai(E.signal) - Ai(A.signal)).slice(-i);
}
function nu(e) {
  return new Uint8Array(e.buffer);
}
function En(e) {
  return {
    returnPct: S(e == null ? void 0 : e.returnPct),
    percentile: S(e == null ? void 0 : e.percentile),
    zScore: S(e == null ? void 0 : e.zScore),
    atrExtension: S(e == null ? void 0 : e.atrExtension)
  };
}
function bn(e) {
  return {
    returnPct: S(e.returnPct),
    percentile: S(e.percentile),
    zScore: S(e.zScore),
    atrExtension: S(e.atrExtension)
  };
}
function Ye(e) {
  const t = En(e);
  return t.returnPct != null && t.returnPct >= ze.returnPct || t.percentile != null && t.percentile >= ze.percentile || t.zScore != null && t.zScore >= ze.zScore || t.atrExtension != null && t.atrExtension >= ze.atrExtension;
}
function Uo(e, t) {
  const n = [], i = F(t.minSamples, 1, 1e4, 20), r = e[e.length - 1] ?? null;
  return r ? r.rollingReturnCount < i && n.push(
    `Rolling-return history has ${r.rollingReturnCount}/${i} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function Be(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function zo(e, t, n, i, r) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return i ?? "Continuation invalidated the fade setup";
  if (e === "expired") return r ?? "Candidate expired before progressing";
  const o = n[n.length - 1];
  if (o && o.to === e) return o.explanation;
  const a = t.filter((c) => c.contributesTo === e), s = a[a.length - 1];
  return (s == null ? void 0 : s.explanation) ?? It(e);
}
function Zi(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${oe(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function Qo(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function me(e, t, n, i, r) {
  return [e, t, n, i, r ?? ""].map((o) => String(o).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Ji(e, t, n, i) {
  let r = null;
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], s = ne(a);
    s < t || le(e, o, i) > n || Number.isFinite(a.h) && (!r || a.h > r.price) && (r = { price: a.h, eventTime: s });
  }
  return r;
}
function jo(e, t) {
  return e.length ? le(e, e.length - 1, t) : null;
}
function wn(e, t, n) {
  for (let i = e.length - 1; i >= 0; i -= 1)
    if (le(e, i, n) <= t)
      return { candle: e[i], index: i };
  return null;
}
function ne(e) {
  const t = S(e.ts);
  return t ?? S(e.bucket) ?? 0;
}
function le(e, t, n) {
  const i = e[t];
  return i ? i.knownAt != null && Number.isFinite(i.knownAt) ? i.knownAt : n != null && String(n).trim() !== "chart" ? Ae(i, n) : (S(i.bucket) ?? ne(i)) + Wo(e, t) : 0;
}
function Wo(e, t) {
  var o, a, s;
  const n = S((o = e[t]) == null ? void 0 : o.bucket) ?? ne(e[t]), i = S((a = e[t + 1]) == null ? void 0 : a.bucket);
  if (i != null && i > n) return i - n;
  const r = S((s = e[t - 1]) == null ? void 0 : s.bucket);
  return r != null && n > r ? n - r : 1;
}
function V(e) {
  return S(e.knownAt) ?? S(e.eventTime) ?? S(e.ts) ?? S(e.bucket) ?? 0;
}
function Qe(e, t, n) {
  const i = V(e), r = S(e.eventTime) ?? S(e.ts) ?? S(e.bucket) ?? i;
  return i > t.knownAt && i <= n && r >= t.knownAt;
}
function Go(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Ko(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function z(e) {
  return Number.isFinite(e) && e > 0;
}
function Xo(e) {
  const t = S(e == null ? void 0 : e.returnPct), n = S(e == null ? void 0 : e.percentile), i = S(e == null ? void 0 : e.zScore), r = S(e == null ? void 0 : e.atrExtension), o = [
    t == null ? null : `24h ${We(t, 1)}%`,
    r == null ? null : `Ext ${We(r, 1)} ATR`,
    i == null ? null : `Z ${We(i, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: Ye({ returnPct: t, percentile: n, zScore: i, atrExtension: r }) ? "pass" : "pending",
    detail: o.join(" | ") || "No extension context yet"
  };
}
function Yo(e, t, n) {
  const i = Rn(e, t, n);
  return i ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${oe(i.low)}-${oe(i.high)} strength ${i.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Zo(e) {
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
function Jo(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function ea(e, t) {
  const n = [...e].reverse().find((o) => o.kind === "loss" || o.kind === "failedReclaim"), i = S(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || i != null && i <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (i == null ? "No AVWAP failure" : `AVWAP ${We(i, 1)}%`)
  };
}
function ta(e, t, n, i) {
  var c;
  const r = S((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), o = r != null && n != null && ia(n, r) <= i, a = Rn(t, n, i);
  return {
    key: "retest",
    label: "Retest",
    status: !!(o || a) ? "pass" : "pending",
    detail: o ? `Retesting ${oe(r)}` : a ? `Near R ${oe(a.center)}` : "No retest yet"
  };
}
function na(e, t, n, i) {
  var o;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || i == null) return !1;
  const r = S((o = n.lastSwingHigh) == null ? void 0 : o.price);
  return r != null && i > r * 1.01;
}
function hi(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Rn(e, t, n) {
  return t == null || !z(t) ? null : e.filter((i) => i.kind === "resistance").map((i) => ({
    zone: i,
    distance: t >= i.low && t <= i.high ? 0 : t < i.low ? (i.low - t) / t * 100 : (t - i.high) / t * 100
  })).filter((i) => i.distance <= n).sort((i, r) => i.distance - r.distance || r.zone.strength - i.zone.strength).map((i) => i.zone)[0] ?? null;
}
function ia(e, t) {
  return !z(e) || !z(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function It(e) {
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
function ra(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((i) => i.status === "pass").map((i) => i.label);
  return n.length ? n.join(" + ") : It(e);
}
function We(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function oe(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function S(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function pe(e) {
  return e[e.length - 1];
}
function er(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (z(n.c)) return n;
  }
  return null;
}
function oa(e) {
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
function tr(e, t, n) {
  const i = Math.min(e.length - 1, Math.max(0, n - 1));
  let r = null;
  for (let o = i; o >= 0; o -= 1) {
    const a = e[o];
    if (a.bucket <= t && z(a.c)) {
      r = a;
      break;
    }
  }
  return r;
}
function aa(e, t) {
  const n = [];
  for (let i = 1; i < e.length; i += 1) {
    const r = e[i];
    if (r.bucket < t.earliestBucket || r.bucket >= t.excludeBucket || !z(r.c)) continue;
    const o = tr(e, r.bucket - t.windowSeconds, i);
    !o || !z(o.c) || n.push((r.c / o.c - 1) * 100);
  }
  return n;
}
function sa(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const i = n.filter((o) => o < t).length, r = n.filter((o) => o === t).length;
  return (i + r * 0.5) / n.length * 100;
}
function ca(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const i = n.reduce((a, s) => a + s, 0) / n.length, r = n.reduce((a, s) => a + (s - i) ** 2, 0) / (n.length - 1), o = Math.sqrt(r);
  return o > 0 ? (t - i) / o : null;
}
function Bt(e, t, n, i, r) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: i,
    eventTime: ne(n),
    knownAt: r
  };
}
function la(e, t) {
  const n = t.anchorBucket == null ? null : Number(t.anchorBucket);
  if (n != null && Number.isFinite(n)) {
    const r = e.findIndex((o) => o.bucket >= n);
    return r >= 0 ? r : null;
  }
  const i = t.anchorX == null ? null : Number(t.anchorX);
  if (i != null && Number.isFinite(i)) {
    const r = e.findIndex((o) => o.x >= i);
    return r >= 0 ? r : null;
  }
  return null;
}
function ua(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const i = Number(e.v_quote);
  return Number.isFinite(i) && i > 0 && t > 0 ? i / t : 0;
}
function yi(e, t, n, i, r, o) {
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
    eventTime: ne(n),
    knownAt: o
  };
}
function da(e) {
  let t = null, n = null;
  return e.map((i) => {
    if (i.kind === "SwingHigh") {
      const s = t == null ? "SwingHigh" : i.price > t.price ? "HigherHigh" : "LowerHigh", u = { ...i, structure: s, label: s === "SwingHigh" ? "SH" : s === "HigherHigh" ? "HH" : "LH" };
      return t = u, u;
    }
    const r = n == null ? "SwingLow" : i.price > n.price ? "HigherLow" : "LowerLow", a = { ...i, structure: r, label: r === "SwingLow" ? "SL" : r === "HigherLow" ? "HL" : "LL" };
    return n = a, a;
  });
}
function gi(e, t, n, i, r, o) {
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
    eventTime: ne(i),
    knownAt: o
  };
}
function mt(e, t, n, i, r, o, a, s, c, u) {
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
    previousPrice: o.price,
    rs: a,
    previousRs: s,
    priceLabel: r.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: u,
    eventTime: r.eventTime,
    knownAt: Math.max(r.knownAt, o.knownAt)
  };
}
function fa(e, t, n, i, r, o, a, s, c) {
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
function ma(e, t) {
  const n = new Map(e.map((o) => [o.x, o])), i = [];
  let r = null;
  for (let o = 0; o < t.length; o += 2) {
    const a = t[o], s = t[o + 1], c = n.get(a);
    if (!c || !Number.isFinite(s)) continue;
    const u = r ?? s;
    i.push({
      ...c,
      o: u,
      h: s,
      l: s,
      c: s,
      v_base: 0,
      v_quote: 0
    }), r = s;
  }
  return i;
}
function va(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Ai(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function Tn(e, t, n) {
  const i = t[t.length - 1] ?? null, r = en(e, "SwingHigh"), o = en(e, "SwingLow"), a = e[e.length - 1] ?? null, s = pa(t), c = e.length === 0 ? "neutral" : i == null || s ? "range" : i.kind === "StructureShift" ? "transitional" : i.direction, u = c === "transitional" ? (i == null ? void 0 : i.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: u,
    lastBreak: i,
    lastSwingHigh: r,
    lastSwingLow: o,
    updatedX: (i == null ? void 0 : i.x) ?? (a == null ? void 0 : a.x) ?? null,
    updatedTs: (i == null ? void 0 : i.knownAt) ?? (a == null ? void 0 : a.knownAt) ?? null
  };
}
function vt(e, t, n, i, r) {
  for (let a = e.length - 1; a >= 0; a -= 1) {
    const s = e[a];
    if (s.kind === t && n.includes(s.structure))
      return Jt(i, r, s);
  }
  const o = en(e, t);
  return o ? Jt(i, r, o) : null;
}
function Ei(e, t, n, i, r) {
  let o = null;
  for (const a of e)
    a.kind === t && (!o || (r ? a.price > o.price : a.price < o.price)) && (o = a);
  return o ? Jt(n, i, o) : null;
}
function Jt(e, t, n) {
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
function pa(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function en(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const i = e[n];
    if (i.kind === t) return i;
  }
  return null;
}
function ha(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function ya(e, t, n) {
  const i = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, i * n);
}
function kt(e, t) {
  const n = Te(t), i = Array(e.length).fill(null);
  if (e.length < n) return i;
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
  for (let a = 0; a < n; a += 1) o += r[a];
  o /= n, i[n - 1] = o;
  for (let a = n; a < e.length; a += 1)
    o = (o * (n - 1) + r[a]) / n, i[a] = o;
  return i;
}
function ga(e, t, n, i, r) {
  const o = n.price;
  if (!Number.isFinite(o) || o <= 0) return;
  const a = Math.max(o * (r / 1e4), Number.EPSILON), s = o - a, c = o + a, u = 1 / Math.max(1, i), l = e.find(
    (m) => m.kind === t && wa(m.low, m.high, s, c)
  );
  if (!l) {
    e.push({
      kind: t,
      low: s,
      high: c,
      center: o,
      touches: 1,
      score: 1 + u,
      strength: 1 + u,
      lastX: n.x,
      eventTime: n.eventTime,
      knownAt: n.knownAt,
      source: "swing",
      structures: [n.structure]
    });
    return;
  }
  const d = l.touches + 1;
  l.center = (l.center * l.touches + o) / d, l.touches = d, l.score += 1 + u, l.strength = l.score, l.lastX = Math.max(l.lastX, n.x), l.eventTime = Math.max(l.eventTime, n.eventTime), l.knownAt = Math.max(l.knownAt, n.knownAt), l.structures.push(n.structure);
  const f = Math.max(l.center * (r / 1e4), Number.EPSILON);
  l.low = Math.min(l.low, l.center - f, s), l.high = Math.max(l.high, l.center + f, c);
}
function Aa(e, t, n, i) {
  if (!n || !i) return e.slice(0, t);
  const r = /* @__PURE__ */ new Set(), o = e.filter((s) => s.center <= n).sort((s, c) => n - s.center - (n - c.center) || c.score - s.score).slice(0, i), a = e.filter((s) => s.center > n).sort((s, c) => s.center - n - (c.center - n) || c.score - s.score).slice(0, i);
  for (const s of [...o, ...a])
    r.add(s);
  for (const s of e) {
    if (r.size >= t) break;
    r.add(s);
  }
  return Array.from(r).sort((s, c) => c.score - s.score || c.touches - s.touches || c.lastX - s.lastX).slice(0, t);
}
function Ea(e, t, n) {
  const i = e[t].h;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].h >= i || e[t + r].h > i) return !1;
  return !0;
}
function ba(e, t, n) {
  const i = e[t].l;
  if (!Number.isFinite(i)) return !1;
  for (let r = 1; r <= n; r += 1)
    if (e[t - r].l <= i || e[t + r].l < i) return !1;
  return !0;
}
function wa(e, t, n, i) {
  return e <= i && n <= t;
}
function Ra(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const i = e[n], r = e[n + 1];
    Number.isFinite(i) && Number.isFinite(r) && t.set(i, r);
  }
  return t;
}
function tn(e, t) {
  const n = Te(t), i = Array(e.length).fill(null);
  if (e.length < n) return i;
  const r = 2 / (n + 1);
  let o = 0;
  for (let a = 0; a < n; a++) o += e[a].c;
  o /= n, i[n - 1] = o;
  for (let a = n; a < e.length; a++)
    o = (e[a].c - o) * r + o, i[a] = o;
  return i;
}
function Ta(e, t) {
  const n = Te(t);
  if (e.length < n) return [];
  const i = [], r = 2 / (n + 1);
  let o = 0;
  for (let a = 0; a < n; a++) o += e[a].value;
  o /= n, i.push({ x: e[n - 1].x, value: o });
  for (let a = n; a < e.length; a++)
    o = (e[a].value - o) * r + o, i.push({ x: e[a].x, value: o });
  return i;
}
function nr(e, t) {
  const n = Te(t);
  if (e.length <= n) return [];
  let i = 0, r = 0;
  for (let a = 1; a <= n; a++) {
    const s = e[a].c - e[a - 1].c;
    s >= 0 ? i += s : r += Math.abs(s);
  }
  i /= n, r /= n;
  const o = [
    { x: e[n].x, value: wi(i, r) }
  ];
  for (let a = n + 1; a < e.length; a++) {
    const s = e[a].c - e[a - 1].c, c = Math.max(0, s), u = Math.max(0, -s);
    i = (i * (n - 1) + c) / n, r = (r * (n - 1) + u) / n, o.push({ x: e[a].x, value: wi(i, r) });
  }
  return o;
}
function bi(e, t) {
  if (e.length < t) return [];
  const n = [];
  let i = 0;
  return e.forEach((r, o) => {
    i += r.value, o >= t && (i -= e[o - t].value), o >= t - 1 && n.push({ x: r.x, value: i / t });
  }), n;
}
function Re(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function wi(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function Te(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function F(e, t, n, i) {
  return Math.floor(q(e, t, n, i));
}
function q(e, t, n, i) {
  const r = Number(e);
  return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : i;
}
const Sa = "strategy-profile.1", ir = "decision-snapshot.1", xa = "impulse_fade_v1.research.default", Pa = "1";
function Ca(e) {
  return `decision-reference-observation:${R({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function ot(e) {
  const { profileHash: t, ...n } = e;
  return R(n);
}
function rr(e) {
  if (Ze(e.createdAt, "createdAt"), e.setupFamily !== ve || e.lifecycleVersion !== te || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [r, o] of Object.entries(e.timeframeRoles))
    if (r === "contextTimeframes") {
      if (!o.every((a) => a.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (o != null && !o.trim())
      throw new TypeError(`${r} cannot be blank`);
  if (Ri(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), Ri(
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
  const i = h(e);
  return h({
    ...i,
    profileHash: ot(i)
  });
}
function Ia(e = {}) {
  var o, a;
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
    requiredDataQuality: n,
    factors: i
  };
  return rr({
    schemaVersion: Sa,
    id: e.id ?? xa,
    version: e.version ?? Pa,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: ve,
    lifecycleVersion: te,
    lifecycleConfigHash: e.lifecycleConfigHash ?? De(),
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
const ka = Ia();
function iu(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (Ha(e.price, "reference price"), Ze(e.eventTime, "reference eventTime"), Ze(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = Ca(e.sourceObject);
  if (e.sourceObject.observationId != null && e.sourceObject.observationId !== t)
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
      observationId: t
    }
  });
}
function Oa(e) {
  var o, a, s, c;
  if (Ze(e.decisionTime, "decisionTime"), Ze(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  _a(e.lifecycle.candidate, e.effectiveAsOf), Fa(e.candidateMetrics, e.effectiveAsOf);
  const t = [...e.dataQualityNotes];
  Da([
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ]);
  for (const u of e.lifecycle.dataQuality)
    t.push({
      code: "LIFECYCLE_DATA_QUALITY_NOTE",
      severity: "warning",
      message: u
    });
  const n = Na(
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
  for (const u of (n == null ? void 0 : n.insufficientDataReasons) ?? [])
    t.push({
      code: `CANDIDATE_METRICS_${u.code}`,
      severity: "error",
      message: u.message
    });
  const i = {
    snapshotSchemaVersion: ir,
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
    lifecycleEvidence: qt(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: Ma(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: $t(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: $t(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: qt(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: qt(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: $t(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, r = Sn(i);
  return h({ ...i, id: r });
}
function Sn(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${R(n).slice(8)}`;
}
function or(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const i of t) {
    const r = n.get(i.id);
    if (r && T(r) !== T(i))
      throw new RangeError(`Conflicting decision reference id ${i.id}`);
    n.set(i.id, i);
  }
  return [...n.values()];
}
function Na(e, t, n, i) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || i != null && i.venue && e.exchange.toLowerCase() !== i.venue.toLowerCase() ? null : e;
}
function _a(e, t) {
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
function Fa(e, t) {
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
function Ma(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [i]) => n.localeCompare(i)).map(([n, i]) => [
      n,
      La(i) <= t ? i : null
    ])
  );
}
function $t(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, i) => n.knownAt - i.knownAt || n.id.localeCompare(i.id));
}
function qt(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, i) => n.knownAt - i.knownAt || n.eventTime - i.eventTime || R(n).localeCompare(R(i))
  );
}
function La(e) {
  var t, n, i;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((i = e.lastSwingLow) == null ? void 0 : i.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function Da(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const i = t.get(n.id);
    if (i && T(i) !== T(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function Ze(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function Ha(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function Ri(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const ar = "radar-selection-profile.1", xn = "radar-episode.1", sr = "replay-case-manifest.1", Pn = "radar-metric-observation.1", Va = "radar-scan-result.1", Ba = "radar-episode-status.1", Cn = "execution-venue-eligibility.1", $a = "radar-structure-observation.1", In = "radar-universe-membership.1";
function kn(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return R(n);
}
function qa(e) {
  return pr(e), h({
    ...e,
    canonicalConfigHash: kn(e)
  });
}
function Ua(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: Cn,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...t,
    observationId: Nt(t)
  });
}
function ru(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !vn(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: $a,
    ...e
  };
  return h({
    ...t,
    observationId: cr(t)
  });
}
function ou(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: In,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return h({
    ...t,
    observationId: Ot(t)
  });
}
function Ot(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${j(n)}`;
}
function cr(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${j(n)}`;
}
function nn(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(T(e.snapshot));
  return h({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${j({
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
function Nt(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${j(n)}`;
}
const au = qa({
  schemaVersion: ar,
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
function su(e) {
  var c, u;
  hs(e);
  const t = e.strategyProfile ?? ka, n = /* @__PURE__ */ new Map(), i = [], r = [], o = [], a = [], s = /* @__PURE__ */ new Set();
  for (const [l, d] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([f], [m]) => f.localeCompare(m)
  )) {
    const f = ns(d, e.to), m = `${f.symbol.toUpperCase()}\0${f.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${f.symbol} from ${f.source}`);
    s.add(m);
    const y = ae(
      f.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((g) => Ae(g, e.selectionProfile.scanTimeframe)).filter((g) => g <= e.to).filter((g) => vs(g, e.selectionProfile)), p = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const g of y) {
      const w = Fe(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      p.previousEvaluationAsOf != null && g - p.previousEvaluationAsOf > w && (p.previousGate = null, p.falseSince = null);
      const b = g >= e.from, k = e.selectionProfile.moveDetectors.map(
        (M) => za(M, f, g, e.selectionProfile.scanTimeframe)
      );
      if (b)
        for (const M of k)
          for (const _ of M.observations)
            n.set(_.requestId, _);
      const P = fs(
        k.map((M) => M.result),
        e.selectionProfile.detectorCombination
      ), E = Za(
        f,
        g,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), A = Ya(
        f,
        g,
        e.selectionProfile,
        k,
        E,
        e.universeHistory ?? []
      ), x = A.results, I = x.every((M) => M.passed), Q = P.passed && I, W = !I || P.evaluable;
      if (b)
        for (const M of A.evidence)
          M.schemaVersion === Pn && n.set(M.requestId, M);
      const N = es(
        f,
        g,
        k.map((M) => M.result),
        x,
        A.evidence,
        P.passed,
        I,
        Q,
        W
      );
      if (b && i.push(N), p.activeEpisode && g >= p.activeEpisode.activeUntil && (p.activeEpisode.detectedAt >= e.from && p.activeEpisode.activeUntil <= e.to && o.push(
        Ut(
          p.activeEpisode,
          p.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), p.activeEpisode = null), W && !Q ? (p.falseSince ?? (p.falseSince = g), !p.armed && g - p.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (b && ((c = p.blockedEpisode) == null ? void 0 : c.detectedAt) != null && p.blockedEpisode.detectedAt >= e.from && o.push(
        Ut(p.blockedEpisode, g, "reset", "radarGateReset", "armed")
      ), p.activeEpisode = null, p.blockedEpisode = null, p.armed = !0)) : p.falseSince = null, W && Q && p.previousGate === !1 && p.armed) {
        const M = Ga({
          series: f,
          asOf: g,
          profile: e.selectionProfile,
          strategyProfile: t,
          detectorEvaluations: k,
          selectionEvaluation: N,
          hardGateEvidence: A.evidence,
          venueEligibility: E,
          lifecycleHistory: ((u = e.lifecycleHistory) == null ? void 0 : u[l]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (b) {
          r.push(M), o.push(
            Ut(M, g, "active", "detected", "blockedUntilReset")
          );
          const _ = Ka(M, f, e.selectionProfile, t);
          a.push(_);
          for (const ut of M.contextObservations)
            n.set(ut.requestId, ut);
        }
        p.activeEpisode = M, p.blockedEpisode = M, p.armed = !1;
      }
      p.previousGate = W ? Q : null, p.previousEvaluationAsOf = g;
    }
  }
  return h({
    schemaVersion: Va,
    selectionProfileRef: yr(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(hr),
    gateEvaluations: i.sort(gs),
    episodes: r.sort(As),
    episodeStatusObservations: o.sort(Es),
    replayCaseManifests: a.sort((l, d) => l.id.localeCompare(d.id))
  });
}
function za(e, t, n, i) {
  return e.type === "rollingTroughRunup" ? Qa(e, t, n, i) : e.type === "elapsedWindowReturn" ? ja(e, t, n, i) : e.type === "maximumWindowReturn" ? Wa(e, t, n, i) : lr(e, t, n);
}
function Qa(e, t, n, i) {
  const r = ae(t.candlesByTimeframe[i] ?? [], i, n), o = r.at(-1) ?? null, s = (o ? r.filter(
    (p) => p.bucket >= o.bucket - e.lookbackSeconds && p.bucket <= o.bucket && o.bucket - p.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((p, g) => U(g.c) && (!p || g.c < p.c || g.c === p.c && g.bucket < p.bucket) ? g : p, null), c = o && s && U(s.c) ? (o.c / s.c - 1) * 100 : null, u = os(r, o, e), l = mr(u, c, e.minimumSampleCount), d = [];
  o || d.push(Z("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || d.push(Z("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const f = R(e), m = He({
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
    percentile: l.percentile,
    zScore: l.zScore,
    sampleCount: u.length,
    historyCandles: _n(r, o, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: f,
    notes: [...d, ...l.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && Ge(m.percentile, e.minimumPercentile) && Ge(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, y = s ? Ja(t, n, s, m) : null;
  return {
    result: _t(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${Rt(c)} versus ${Rt(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: y
  };
}
function ja(e, t, n, i) {
  const r = ur(e, t, n, i), o = vr(r, e);
  return {
    result: _t(
      e,
      o,
      [r],
      o ? r.observationId : null,
      r.value == null ? "Elapsed return unavailable" : `${gr(e.windowSeconds)} return ${Rt(r.value)}`
    ),
    observations: [r],
    anchor: null
  };
}
function Wa(e, t, n, i) {
  const r = [...new Set(e.windowsSeconds)].sort((l, d) => l - d).map(
    (l) => ur(
      {
        ...e,
        id: `${e.id}:${l}`,
        type: "elapsedWindowReturn",
        windowSeconds: l
      },
      t,
      n,
      i
    )
  ), o = r.filter((l) => l.value != null).sort(
    (l, d) => (d.value ?? -1 / 0) - (l.value ?? -1 / 0) || (l.window ?? 1 / 0) - (d.window ?? 1 / 0)
  )[0] ?? null, a = ae(t.candlesByTimeframe[i] ?? [], i, n), s = He({
    series: t,
    asOf: n,
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
    historyCandles: _n(
      a,
      a.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: R(e),
    notes: o ? o.dataQualityNotes : [Z("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = vr(s, e), u = [...r, s];
  return {
    result: _t(
      e,
      c,
      u,
      c ? (o == null ? void 0 : o.observationId) ?? null : null,
      (o == null ? void 0 : o.value) == null ? "Maximum elapsed return unavailable" : `Winning ${gr(o.window ?? 0)} return ${Rt(o.value)}`
    ),
    observations: u,
    anchor: null
  };
}
function lr(e, t, n) {
  const i = e.analysisTimeframe, r = ae(t.candlesByTimeframe[i] ?? [], i, n), o = r.at(-1) ?? null, a = as(r, e.emaPeriod).at(-1) ?? null, s = ss(r, e.atrPeriod).at(-1) ?? null, c = o && a != null && s != null && s > 0 ? (o.c - a) / s : null, u = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), l = [];
  o || l.push(Z("NO_COMPLETED_CANDLE", "error", `No completed ${i} candle exists at cutoff`)), (r.length < u || c == null) && l.push(
    Z(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${u} completed ${i} candles`
    )
  );
  const d = He({
    series: t,
    asOf: n,
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
    historyCandles: r.slice(-u),
    configHash: R(e),
    notes: Fn(l)
  }), f = c != null && r.length >= u && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: _t(
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
function ur(e, t, n, i) {
  const r = ae(t.candlesByTimeframe[i] ?? [], i, n), o = r.at(-1) ?? null, a = o ? Nn(r, o.bucket - e.windowSeconds) : null, s = o && a ? o.bucket - e.windowSeconds - a.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, u = o && a && !c && U(a.c) ? (o.c / a.c - 1) * 100 : null, l = rs(r, o, e), d = mr(l, u, e.minimumSampleCount), f = [...d.notes];
  return o || f.push(Z("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a ? c && f.push(Z("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : f.push(Z("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), He({
    series: t,
    asOf: n,
    timeframe: i,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: (a == null ? void 0 : a.c) ?? null,
    value: u,
    unit: "percent",
    percentile: d.percentile,
    zScore: d.zScore,
    sampleCount: l.length,
    historyCandles: _n(
      r,
      o,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: R(e),
    notes: Fn(f)
  });
}
function Ga(e) {
  var x;
  const t = e.detectorEvaluations.filter((I) => I.result.passed), n = rn(
    t.flatMap(
      (I) => I.observations.filter(
        (Q) => Q.observationId === I.result.winningObservationId
      )
    )
  ), i = ((x = t.find((I) => I.anchor)) == null ? void 0 : x.anchor) ?? null, r = ae(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), o = Ti(e.series, e.asOf, e.profile.scanTimeframe, 86400), a = Ti(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = fr(e.series, e.asOf, e.profile), u = e.detectorEvaluations.flatMap((I) => I.observations).find((I) => I.metricCode === "ema_atr_displacement") ?? null ?? lr(
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
  ).observations[0], l = is(
    e.structureHistory,
    e.series,
    e.asOf
  ), d = rn([
    ...n,
    o,
    a,
    s,
    u
  ]), f = t[0], m = f ? n.find(
    (I) => I.observationId === f.result.winningObservationId
  ) ?? n[0] ?? null : null, v = Xa(
    r,
    i,
    (f == null ? void 0 : f.result.detectorId) ?? "unknown",
    m,
    o,
    a,
    s,
    u,
    l
  ), y = cs(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), p = y != null && y.candidate ? y : null, g = (p == null ? void 0 : p.candidate) ?? null, w = (p == null ? void 0 : p.asOf) ?? null, b = p && w != null ? nn({
    logicalObjectId: (g == null ? void 0 : g.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: p.updatedTs,
    knownAt: w,
    snapshot: p
  }) : null, k = g ? nn({
    logicalObjectId: g.id,
    objectType: "SetupCandidateEpisode",
    eventTime: g.detectionEventTime,
    knownAt: w ?? g.detectedAt,
    snapshot: g
  }) : null, P = {
    schemaVersion: xn,
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
    contextObservations: d,
    selectionAnchor: i,
    pathContext: v,
    initialLifecycleCandidateId: (g == null ? void 0 : g.id) ?? null,
    initialLifecycleCandidateRef: k,
    initialLifecycleState: (p == null ? void 0 : p.state) ?? null,
    initialLifecycleStateRef: b,
    initialMtfStructure: l,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Fn([
      ...d.flatMap((I) => I.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, E = `radar-episode:${j({
    symbol: P.symbol,
    source: P.source,
    profileHash: P.selectionProfileHash,
    detectedAt: P.detectedAt,
    triggeringObservationIds: n.map((I) => I.observationId)
  })}`, A = { ...P, id: E, logicalObjectId: E };
  return h({
    ...A,
    observationId: On(A)
  });
}
function Ka(e, t, n, i) {
  const r = Object.keys(t.candlesByTimeframe).filter(
    (c) => ae(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Ln), o = Object.fromEntries(
    r.map((c) => {
      var l, d;
      const u = ae(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((l = u[0]) == null ? void 0 : l.bucket) ?? null,
          availableEnd: ((d = u.at(-1)) == null ? void 0 : d.bucket) ?? null,
          completedThrough: u.at(-1) ? Ae(u.at(-1), c) : null,
          completedCandleCount: u.length
        }
      ];
    })
  ), a = r.filter(
    (c) => o[c].completedCandleCount > 0
  ), s = {
    schemaVersion: sr,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: yr(n),
    lifecycleVersion: te,
    strategyProfileRef: {
      id: i.id,
      version: i.version,
      profileHash: i.profileHash
    },
    availableTimeframes: a,
    preRollRequirements: ds(n),
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
    id: dr(s)
  });
}
function dr(e) {
  const { id: t, ...n } = e;
  return `replay-case:${j(n)}`;
}
function On(e) {
  const { observationId: t, ...n } = e;
  return `radar-episode-observation:${j(n)}`;
}
function Ti(e, t, n, i) {
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
  }, o = ae(e.candlesByTimeframe[n] ?? [], n, t), a = o.at(-1) ?? null, s = a ? Nn(o, a.bucket - i) : null, c = a && s && U(s.c) ? (a.c / s.c - 1) * 100 : null, u = c == null ? [Z("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${i}-second reference exists`)] : [];
  return He({
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
    historyCandles: o,
    configHash: R(r),
    notes: u
  });
}
function fr(e, t, n) {
  var d;
  const i = n.scanTimeframe, r = ae(e.candlesByTimeframe[i] ?? [], i, t), o = r.at(-1) ?? null, a = o ? r.filter((f) => f.bucket > o.bucket - n.liquidityPolicy.windowSeconds) : [], s = a.map(
    (f) => Ke(f.v_quote) ? f.v_quote : Ke(f.v_base) ? f.v_base * f.c : null
  ), c = s.length > 0 && s.every((f) => f != null), u = c ? s.reduce((f, m) => f + (m ?? 0), 0) : null, l = {
    metric: "quote_notional",
    timeframe: i,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return He({
    series: e,
    asOf: t,
    timeframe: i,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((d = a[0]) == null ? void 0 : d.bucket) ?? null,
    referenceValue: null,
    value: u,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: a.length,
    historyCandles: a,
    configHash: R(l),
    notes: c ? [] : [Z("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function He(e) {
  var l, d;
  const t = ((l = e.historyCandles[0]) == null ? void 0 : l.bucket) ?? null, n = ((d = e.historyCandles.at(-1)) == null ? void 0 : d.bucket) ?? null, i = e.timeframe && e.historyCandles.at(-1) ? Ae(e.historyCandles.at(-1), e.timeframe) : e.asOf, r = e.timeframe ? e.historyCandles.reduce(
    (f, m) => Math.max(f, we(m, e.timeframe)),
    i
  ) : e.asOf, o = R(
    e.historyCandles.map((f) => ({
      bucket: f.bucket,
      ts: f.ts,
      o: f.o,
      h: f.h,
      l: f.l,
      c: f.c,
      vBase: Ke(f.v_base) ? f.v_base : null,
      vQuote: Ke(f.v_quote) ? f.v_quote : null,
      ver: Ke(f.ver) ? f.ver : null,
      knownAt: e.timeframe ? we(f, e.timeframe) : null
    }))
  ), a = `radar-metric:${j({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.logicalWindow === void 0 ? e.window : e.logicalWindow,
    configHash: e.configHash
  })}`, s = {
    schemaVersion: Pn,
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
    historyStart: t,
    historyEnd: n,
    configHash: e.configHash,
    inputHash: o,
    dataQualityNotes: e.notes
  }, c = `radar-observation:${j(s)}`, u = e.asOf;
  return h({
    ...s,
    observationId: c,
    requestId: `radar-observation-request:${j({ observationId: c, requestedAsOf: u })}`,
    requestedAsOf: u
  });
}
function Xa(e, t, n, i, r, o, a, s, c) {
  const u = t ? e.find((p) => p.bucket === t.timestamp) ?? null : null, d = (u ? e.filter((p) => p.bucket <= u.bucket) : []).reduce((p, g) => U(g.c) && (!p || g.c > p.c || g.c === p.c && g.bucket < p.bucket) ? g : p, null), f = e.at(-1) ?? null, m = t && d && U(d.c) ? (t.price / d.c - 1) * 100 : null, v = t && d && f && d.c > t.price ? (f.c - t.price) / (d.c - t.price) : null, y = t && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: r.value,
    net48hReturnPct: o.value,
    triggeringLocalImpulseReturnPct: (i == null ? void 0 : i.unit) === "percent" ? i.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (i == null ? void 0 : i.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (d == null ? void 0 : d.c) ?? null,
    priorPeakTime: (d == null ? void 0 : d.bucket) ?? null,
    priorDrawdownPct: m,
    recoveryFraction: v,
    currentAtrDisplacement: s.value,
    triggeringPercentile: (i == null ? void 0 : i.percentile) ?? null,
    triggeringZScore: (i == null ? void 0 : i.zScore) ?? null,
    quoteNotional: a.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([p, g]) => [
        p,
        typeof g.snapshot == "object" && g.snapshot != null && !Array.isArray(g.snapshot) && typeof g.snapshot.state == "string" ? g.snapshot.state : "unknown"
      ])
    ),
    contextTags: y
  };
}
function Ya(e, t, n, i, r, o) {
  const a = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const f = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return $e(c, f, f ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const f = rn(i.flatMap((v) => v.observations));
        a.push(...f);
        const m = !i.some(
          (v) => v.observations.some(
            (y) => y.dataQualityNotes.some((p) => p.severity === "error")
          )
        );
        return $e(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          f
        );
      }
      if (c === "executionVenueEligibility") {
        a.push(r);
        const f = ms(r.status, n.executionVenuePolicy.mode);
        return $e(
          c,
          f,
          `Execution venue ${r.status}`,
          [r]
        );
      }
      if (c === "selectedUniverse") {
        const f = us(o, e, t);
        return f && a.push(f), $e(
          c,
          (f == null ? void 0 : f.included) === !0,
          f ? f.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          f ? [f] : []
        );
      }
      const u = fr(e, t, n);
      a.push(u);
      const l = n.liquidityPolicy.minimumQuoteNotional, d = l == null || u.value == null ? l == null || n.liquidityPolicy.missingData === "warn" : u.value >= l;
      return $e(
        c,
        d,
        l == null ? "No minimum liquidity configured" : u.value == null ? "Quote-notional history unavailable" : `Quote notional ${u.value} versus ${l} minimum`,
        [u]
      );
    }),
    evidence: ys(a)
  };
}
function $e(e, t, n, i) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(i.map((r) => r.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        i.flatMap(
          (r) => r.schemaVersion === Pn ? [r.requestId] : []
        )
      )
    ].sort()
  };
}
function Za(e, t, n, i) {
  const r = n.executionVenuePolicy.intendedVenue ?? "ignored", o = [...i].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === r.toLowerCase() && s.knownAt <= t && s.effectiveFrom <= t && (s.effectiveTo == null || s.effectiveTo >= t)
  );
  for (const s of o)
    if (Nt(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const a = Mn(
    o,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return a || Ua({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: r,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      Z(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function Ja(e, t, n, i) {
  const r = {
    logicalObjectId: `selection-anchor:${j({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - Ae(n, i.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: i.observationId
  };
  return h({
    ...r,
    observationId: `selection-anchor-observation:${j(r)}`
  });
}
function Ut(e, t, n, i, r) {
  const o = {
    schemaVersion: Ba,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: i,
    rearmState: r
  };
  return h({
    ...o,
    observationId: `radar-status:${j(o)}`
  });
}
function es(e, t, n, i, r, o, a, s, c) {
  const u = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: i,
    hardGateEvidence: r,
    evaluable: c,
    detectorGatePassed: o,
    hardGatesPassed: a,
    compositePassed: s
  };
  return h({
    ...u,
    id: `radar-gate:${j(u)}`
  });
}
function _t(e, t, n, i, r) {
  var a;
  const o = t || n.every(
    (s) => s.dataQualityNotes.every((c) => c.severity !== "error")
  );
  return {
    detectorId: e.id,
    detectorType: e.type,
    evaluable: o,
    passed: t,
    observationIds: n.map((s) => s.observationId),
    observationRequestIds: n.map((s) => s.requestId),
    winningObservationId: i,
    winningObservationRequestId: ((a = n.find((s) => s.observationId === i)) == null ? void 0 : a.requestId) ?? null,
    explanation: r
  };
}
function ae(e, t, n) {
  return pn(e, t, n);
}
function ts(e, t, n) {
  const i = L(t);
  return e.filter((r) => {
    if (!Number.isFinite(r.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (r.bucket + i > n) return !1;
    if (r.knownAt != null && !Number.isFinite(r.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${r.bucket}`);
    return we(r, t) <= n;
  });
}
function ns(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([i, r]) => (Fe(i), [i, ts(r, i, t)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function is(e, t, n) {
  const i = e.filter(
    (o) => o.symbol.toUpperCase() === t.symbol.toUpperCase() && o.source === t.source && o.knownAt <= n
  );
  for (const o of i)
    if (cr(o) !== o.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const r = /* @__PURE__ */ new Map();
  for (const o of new Set(i.map((a) => a.timeframe))) {
    const a = Mn(
      i.filter((s) => s.timeframe === o),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${o}`
    );
    a && r.set(o, a);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([o], [a]) => Ln(o, a)).map(
      ([o, a]) => [
        o,
        nn({
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
function Nn(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function rs(e, t, n) {
  if (!t) return [];
  const i = t.bucket - n.historyLookbackSeconds, r = [];
  for (const o of e) {
    if (o.bucket < i || o.bucket >= t.bucket) continue;
    const a = Nn(e, o.bucket - n.windowSeconds);
    if (!a || !U(a.c)) continue;
    const s = o.bucket - n.windowSeconds - a.bucket;
    n.maximumReferenceStalenessSeconds != null && s > n.maximumReferenceStalenessSeconds || r.push((o.c / a.c - 1) * 100);
  }
  return r;
}
function os(e, t, n) {
  if (!t) return [];
  const i = t.bucket - n.historyLookbackSeconds, r = [];
  for (const o of e) {
    if (o.bucket < i || o.bucket >= t.bucket) continue;
    const a = e.filter(
      (s) => s.bucket <= o.bucket && s.bucket >= o.bucket - n.lookbackSeconds && o.bucket - s.bucket <= n.maximumTroughAgeSeconds && U(s.c)
    ).sort((s, c) => s.c - c.c || s.bucket - c.bucket)[0];
    a && r.push((o.c / a.c - 1) * 100);
  }
  return r;
}
function mr(e, t, n) {
  const i = [];
  if (e.length < n && i.push(
    Z(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: i };
  const r = e.filter((u) => u <= t).length / e.length * 100, o = e.reduce((u, l) => u + l, 0) / e.length, a = e.reduce((u, l) => u + (l - o) ** 2, 0) / e.length, s = Math.sqrt(a), c = s > 0 ? (t - o) / s : null;
  return { percentile: r, zScore: c, notes: i };
}
function _n(e, t, n) {
  return t ? e.filter((i) => i.bucket >= t.bucket - n) : [];
}
function vr(e, t) {
  return e.value != null && Ge(e.value, t.minimumReturnPct) && Ge(e.percentile, t.minimumPercentile) && Ge(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function as(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let i = e.slice(0, t).reduce((o, a) => o + a.c, 0) / t;
  n[t - 1] = i;
  const r = 2 / (t + 1);
  for (let o = t; o < e.length; o += 1)
    i = e[o].c * r + i * (1 - r), n[o] = i;
  return n;
}
function ss(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  const i = e.map((o, a) => {
    var c;
    const s = ((c = e[a - 1]) == null ? void 0 : c.c) ?? o.c;
    return Math.max(o.h - o.l, Math.abs(o.h - s), Math.abs(o.l - s));
  });
  let r = i.slice(0, t).reduce((o, a) => o + a, 0) / t;
  n[t - 1] = r;
  for (let o = t; o < i.length; o += 1)
    r = (r * (t - 1) + i[o]) / t, n[o] = r;
  return n;
}
function cs(e, t, n, i) {
  const r = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= n
  );
  for (const s of r)
    ls(s, t, n, i);
  const o = Math.max(...r.map((s) => s.asOf ?? -1 / 0)), a = r.filter((s) => s.asOf === o);
  if (new Set(a.map((s) => T(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${o}`);
  return a[0] ?? null;
}
function ls(e, t, n, i) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== te || e.lifecycleVersion !== i.lifecycleVersion || e.lifecycleConfigHash !== i.lifecycleConfigHash || e.executionTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  K(e.asOf, n, "lifecycle asOf"), K(e.updatedTs, n, "lifecycle updatedTs"), K(e.stateSince, n, "lifecycle stateSince");
  const r = e.candidate;
  if (r) {
    const o = [t.source, t.dataOrigin].filter((s) => s != null).some((s) => s.toLowerCase() === r.source.toLowerCase()), a = !r.venue.trim() || r.venue.toLowerCase() === t.source.toLowerCase();
    if (r.symbol.toUpperCase() !== t.symbol.toUpperCase() || !o || !a || r.setupFamily !== e.setupFamily || r.lifecycleVersion !== e.lifecycleVersion || r.lifecycleConfigHash !== e.lifecycleConfigHash || r.executionTimeframe !== i.timeframeRoles.executionTimeframe)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [s, c] of [
      ["candidate detectedAt", r.detectedAt],
      ["candidate detectionEventTime", r.detectionEventTime],
      ["candidate episodeHighTime", r.episodeHighTime],
      ["candidate stateSince", r.stateSince],
      ["candidate terminalAt", r.terminalAt]
    ])
      K(c, n, s);
    for (const s of r.initialMtfContext)
      K(s.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const o of e.evidence)
    if (K(o.eventTime, n, "lifecycle evidence eventTime"), K(o.knownAt, n, "lifecycle evidence knownAt"), o.knownAt < o.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const o of e.transitions)
    K(o.knownAt, n, "lifecycle transition knownAt");
  for (const [o, a] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (a && (K(a.eventTime, n, `${o} eventTime`), K(a.knownAt, n, `${o} knownAt`), a.knownAt < a.eventTime))
      throw new Error(`${o} knownAt precedes eventTime`);
  for (const o of e.confluence)
    if (K(o.eventTime, n, "lifecycle confluence eventTime"), K(o.knownAt, n, "lifecycle confluence knownAt"), o.eventTime != null && o.knownAt != null && o.knownAt < o.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function K(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function us(e, t, n) {
  const i = [...e].filter(
    (r) => r.symbol.toUpperCase() === t.symbol.toUpperCase() && r.source === t.source && r.knownAt <= n && r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo >= n)
  );
  for (const r of i)
    if (Ot(r) !== r.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Mn(
    i,
    (r) => [r.effectiveFrom, r.knownAt],
    "universe membership"
  );
}
function ds(e) {
  const t = /* @__PURE__ */ new Map();
  function n(i, r, o, a) {
    const s = t.get(i) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    s.duration = Math.max(s.duration, r), s.bars = Math.max(s.bars, o), s.purposes.add(a), t.set(i, s);
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
  return [...t.entries()].sort(([i], [r]) => Ln(i, r)).map(([i, r]) => ({
    timeframe: i,
    minimumDurationSeconds: r.duration,
    minimumBars: r.bars,
    purposes: [...r.purposes].sort()
  }));
}
function fs(e, t) {
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
function ms(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function vs(e, t) {
  const n = Fe(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function D(e) {
  throw new RangeError(e);
}
function pr(e) {
  var n;
  e.schemaVersion !== ar && D("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && D("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && D("Only impulse_fade_v1 radar profiles are supported");
  try {
    Fe(e.scanTimeframe);
  } catch {
    D("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && D("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && D("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || D("At least one move detector is required"), new Set(e.moveDetectors.map((i) => i.id)).size !== e.moveDetectors.length && D("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && D("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((i) => !t.has(i)) && D("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || D("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && D("atLeast detector count must be between one and the detector count"), (!U(e.episodeExpiry.maximumAgeSeconds) || !U(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && D("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((i) => !i.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !U(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && D("Radar profile policies are invalid");
  for (const i of e.moveDetectors) ps(i);
}
function ps(e) {
  if (e.id.trim() || D("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || D(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && D(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!vn(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && D(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!U(e.historyLookbackSeconds) || !zt(e.minimumPercentile, 0, 100) || !zt(e.minimumZScore)) && D(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!U(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !U(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && D(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!zt(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && D(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !U(e.windowSeconds) && D(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !U(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && D(`Detector ${e.id} requires unique positive windows`);
}
function hs(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (kn(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (pr(n), e.strategyProfile) {
    if (ot(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: i, ...r } = e.strategyProfile;
    rr(r);
  }
}
function zt(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function Ge(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function U(e) {
  return Number.isFinite(e) && e > 0;
}
function Ke(e) {
  return e != null && Number.isFinite(e);
}
function Z(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Fn(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function rn(e) {
  return [...new Map(e.map((t) => [t.requestId, t])).values()].sort(hr);
}
function ys(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function Mn(e, t, n) {
  if (!e.length) return null;
  const i = [...e].sort((s, c) => {
    const u = t(s), l = t(c);
    for (let d = 0; d < Math.max(u.length, l.length); d += 1) {
      const f = (u[d] ?? -1 / 0) - (l[d] ?? -1 / 0);
      if (f !== 0) return f;
    }
    return s.observationId.localeCompare(c.observationId);
  }), r = i.at(-1), o = t(r), a = i.filter((s) => {
    const c = t(s);
    return c.length === o.length && c.every((u, l) => u === o[l]);
  });
  if (new Set(a.map((s) => s.observationId)).size > 1)
    throw new Error(`Conflicting ${n} observations at the same precedence`);
  return r;
}
function hr(e, t) {
  return e.requestedAsOf - t.requestedAsOf || e.observationId.localeCompare(t.observationId) || e.requestId.localeCompare(t.requestId);
}
function gs(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function As(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function Es(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function Ln(e, t) {
  return Fe(e) - Fe(t) || e.localeCompare(t);
}
function Fe(e) {
  return L(e);
}
function yr(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function Rt(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function gr(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function j(e) {
  return R(e).slice(8);
}
function cu(e) {
  return T(e);
}
const Ar = /* @__PURE__ */ new WeakMap();
function bs(e, t) {
  Ar.set(e, t);
}
function G(e) {
  const t = Ar.get(e);
  if (!t)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return t;
}
const Ve = "replay-engine.1", Dn = "replay-session-config.1", Er = "replay-session.1", br = "replay-command.1", wr = "replay-event.1", ws = "replay-decision-frame.1", Rs = "replay-wake-plan.1", Ts = "replay-wake-condition.1", Ss = "replay-wake-result.1", xs = "replay-data-bundle.1", Hn = "replay-outcome-envelope.1", Vn = "replay-analysis-state.1", Bn = "replay-known-event.1";
var J, it, on;
class lu {
  constructor(t) {
    ue(this, it);
    ue(this, J);
    Ie(this, J, h({
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
    const n = de(this, it, on).call(this, t);
    return {
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: ((r = n.at(-1)) == null ? void 0 : r.closeTime) ?? null,
      revisionHistoryAvailable: O(this, J).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(t) {
    return h(
      de(this, it, on).call(this, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions() {
    return [];
  }
  async loadAnalysisStateHistory(t) {
    return h(
      (O(this, J).analysisStateHistory ?? []).filter(
        (n) => Xe(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return h(
      (O(this, J).knownEvents ?? []).filter(
        (n) => Xe(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadPointInTimeVenueEvidence(t) {
    return h(
      (O(this, J).venueEvidence ?? []).filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return h(
      (O(this, J).universeEvidence ?? []).filter(
        (n) => Xe(n, t) && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadRadarEpisode(t) {
    return h(
      O(this, J).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
J = new WeakMap(), it = new WeakSet(), on = function(t) {
  return [...O(this, J).candles].filter(
    (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe
  ).sort(
    (n, i) => n.openTime - i.openTime || n.knownAt - i.knownAt || n.observationId.localeCompare(i.observationId)
  );
};
function $n(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return R(n);
}
function Ps(e, t) {
  if (e.schemaVersion !== Dn || e.replayEngineVersion !== Ve)
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  Tr(e.strategyProfileRef, t);
  const n = e.evaluationTimeframe ?? t.timeframeRoles.executionTimeframe;
  L(n);
  const i = Qn(e.visibleTimeframes);
  if (!i.includes(n))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (Si(e.maximumCaseDuration, "maximumCaseDuration"), Si(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
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
    evaluationTimeframe: n,
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
    canonicalConfigHash: $n(o)
  });
}
function uu(e) {
  const t = Qn([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return Ps(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: Dn,
      replayEngineVersion: Ve,
      visibleTimeframes: t,
      displayPreRollByTimeframe: Object.fromEntries(
        t.map((n) => [
          n,
          Math.max(L(n) * 200, 86400)
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
function qn(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function Un(e) {
  const { observationId: t, ...n } = e;
  return `replay-candle-observation:${R(n).slice(8)}`;
}
function Cs(e) {
  const t = L(e.timeframe);
  if (!Number.isFinite(e.openTime) || e.openTime < 0)
    throw new RangeError("Candle openTime must be a non-negative finite timestamp");
  if (e.openTime % t !== 0)
    throw new RangeError("Candle openTime must align to its timeframe");
  for (const [o, a] of Object.entries({ o: e.o, h: e.h, l: e.l, c: e.c }))
    if (!Number.isFinite(a) || a <= 0) throw new RangeError(`Candle ${o} must be positive`);
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
    logicalCandleId: qn(e),
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
  return h({ ...r, observationId: Un(r) });
}
function Ft(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-state:${R(n).slice(8)}`;
}
function du(e) {
  if (an(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const t = {
    schemaVersion: Vn,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...t, id: Ft(t) });
}
function zn(e) {
  const { id: t, ...n } = e;
  return `replay-known-event:${R(n).slice(8)}`;
}
function fu(e) {
  if (an(e.eventTime, "eventTime"), an(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && L(e.timeframe);
  const t = {
    schemaVersion: Bn,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return h({ ...t, id: zn(t) });
}
async function mu(e) {
  var E, A, x, I, Q, W;
  Is(e);
  const { manifest: t, sessionConfig: n, historicalDataAdapter: i } = e, r = await ((E = i.loadRadarEpisode) == null ? void 0 : E.call(i, t.radarEpisodeId));
  if (!r) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  ks(t, r);
  const o = Qn([
    ...n.visibleTimeframes,
    n.evaluationTimeframe,
    ...t.preRollRequirements.map((N) => N.timeframe)
  ]), a = t.startAsOf + n.maximumCaseDuration, s = {}, c = {}, u = {}, l = [];
  for (const N of o) {
    const M = Ds(t, e.strategyProfile, N), _ = Math.max(0, t.startAsOf - M), ut = n.displayPreRollByTimeframe[N] ?? 0, ui = Math.max(0, t.startAsOf - ut);
    s[N] = _, c[N] = ui;
    const Ce = await i.getCoverage({
      symbol: t.symbol,
      source: t.source,
      timeframe: N
    });
    if (Ce.timeframe !== N) throw new Error(`Coverage timeframe mismatch for ${N}`);
    if (Ce.earliestOpenTime == null || Ce.earliestOpenTime > _)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${N}`);
    Ce.earliestOpenTime > ui && l.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${N} display history begins after the configured display pre-roll`
    }), Ce.revisionHistoryAvailable || l.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${N} candle revision history is unavailable`
    });
    const uo = await i.loadCandleHistory({
      symbol: t.symbol,
      source: t.source,
      timeframe: N,
      from: _,
      to: a
    }), fo = Ce.revisionHistoryAvailable ? await ((A = i.loadCandleRevisions) == null ? void 0 : A.call(i, {
      symbol: t.symbol,
      source: t.source,
      timeframe: N,
      from: _,
      to: a
    })) ?? [] : [];
    u[N] = Os(
      [...uo, ...fo].filter((mo) => mo.knownAt <= a),
      t,
      N,
      _,
      a
    );
  }
  const d = {
    symbol: t.symbol,
    source: t.source,
    from: Math.min(...Object.values(s)),
    to: a
  }, f = Ns(
    await ((x = i.loadAnalysisStateHistory) == null ? void 0 : x.call(i, d)) ?? [],
    t
  );
  if (!f.some((N) => N.knownAt <= t.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = _s(
    await ((I = i.loadKnownEvents) == null ? void 0 : I.call(i, d)) ?? [],
    t
  ), v = Fs(
    await ((Q = i.loadPointInTimeVenueEvidence) == null ? void 0 : Q.call(i, d)) ?? [],
    t
  ), y = Ms(
    await ((W = i.loadPointInTimeUniverseEvidence) == null ? void 0 : W.call(i, d)) ?? [],
    t
  ), p = {
    schemaVersion: xs,
    symbol: t.symbol.toUpperCase(),
    source: t.source,
    analysisStartByTimeframe: s,
    displayStartByTimeframe: c,
    candlesByTimeframe: u,
    analysisStateHistory: f,
    knownEvents: m,
    venueEvidence: v,
    universeEvidence: y,
    radarEpisode: r,
    dataQualityNotes: l
  }, g = await Ne(p), w = await Rr(p, t.startAsOf), b = h({
    ...p,
    causalPrefixFingerprint: w,
    internalBundleFingerprint: g
  }), k = h({
    ...p,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(u).map(([N, M]) => [
        N,
        M.filter(
          (_) => _.closeTime <= t.startAsOf && _.knownAt <= t.startAsOf
        )
      ])
    ),
    analysisStateHistory: f.filter(
      (N) => N.knownAt <= t.startAsOf
    ),
    knownEvents: m.filter((N) => N.knownAt <= t.startAsOf),
    venueEvidence: v.filter((N) => N.knownAt <= t.startAsOf),
    universeEvidence: y.filter((N) => N.knownAt <= t.startAsOf),
    causalPrefixFingerprint: w
  }), P = {
    manifest: h(t),
    sessionConfig: h(n),
    strategyProfile: h(e.strategyProfile),
    radarSelectionProfile: h(e.radarSelectionProfile),
    venueRules: h(e.venueRules ?? null),
    dataBundle: k
  };
  return bs(P, b), P;
}
async function vu(e, t) {
  if (t > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: n, ...i } = e.dataBundle;
  return Rr(i, t);
}
async function Rr(e, t) {
  return Ne({
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
async function Ne(e) {
  var i;
  if (!((i = globalThis.crypto) != null && i.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const t = new TextEncoder().encode(T(e)), n = await globalThis.crypto.subtle.digest("SHA-256", t);
  return `sha256:${[...new Uint8Array(n)].map((r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function Is(e) {
  const { manifest: t, sessionConfig: n, strategyProfile: i, radarSelectionProfile: r } = e;
  if (t.schemaVersion !== sr || dr(t) !== t.id || t.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (t.startAsOf !== t.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (kn(r) !== r.canonicalConfigHash || t.selectionProfileRef.id !== r.id || t.selectionProfileRef.version !== r.version || t.selectionProfileRef.canonicalConfigHash !== r.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (ot(i) !== i.profileHash || i.lifecycleVersion !== te || t.lifecycleVersion !== i.lifecycleVersion || t.strategyProfileRef.id !== i.id || t.strategyProfileRef.version !== i.version || t.strategyProfileRef.profileHash !== i.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (n.schemaVersion !== Dn || n.replayEngineVersion !== Ve || $n(n) !== n.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (Tr(n.strategyProfileRef, i), n.evaluationTimeframe !== i.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (n.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (n.venueRulesRef && e.venueRules) {
    const o = Hs(e.venueRules);
    if (T(o) !== T(n.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function ks(e, t) {
  var i, r, o;
  if (t.schemaVersion !== xn || t.id !== e.radarEpisodeId || t.observationId !== e.radarEpisodeObservationId || On(t) !== t.observationId || t.symbol.toUpperCase() !== e.symbol.toUpperCase() || t.source !== e.source || t.detectedAt !== e.detectedAt || t.effectiveAsOf !== e.startAsOf)
    throw new Error("RadarEpisode sidecar does not match the ReplayCaseManifest");
  if ([
    ...t.triggeringObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...t.contextObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...t.hardGateEvidence.map((a) => a.knownAt),
    (i = t.selectionAnchor) == null ? void 0 : i.timestamp,
    (r = t.initialLifecycleCandidateRef) == null ? void 0 : r.knownAt,
    (o = t.initialLifecycleStateRef) == null ? void 0 : o.knownAt,
    ...Object.values(t.initialMtfStructure).map((a) => a.knownAt)
  ].filter((a) => a != null).some((a) => !Number.isFinite(a) || a > e.startAsOf))
    throw new Error("RadarEpisode contains evidence unavailable at replay start");
}
function Os(e, t, n, i, r) {
  const o = /* @__PURE__ */ new Map();
  for (const s of e) {
    const c = Cs({
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
    if (s.symbol.toUpperCase() !== t.symbol.toUpperCase() || s.source !== t.source || s.timeframe !== n || s.openTime < i || s.openTime > r || s.logicalCandleId !== qn(s) || s.observationId !== Un(s) || T(s) !== T(c))
      throw new Error(`Invalid replay candle provenance for ${n}`);
    const u = T(s), l = o.get(s.observationId);
    if (l && T(l) !== u)
      throw new Error(`Conflicting candle observation ${s.observationId}`);
    o.set(s.observationId, s);
  }
  const a = [...o.values()].sort(
    (s, c) => s.openTime - c.openTime || s.knownAt - c.knownAt || s.observationId.localeCompare(c.observationId)
  );
  for (const s of [...new Set(a.map((c) => c.knownAt))])
    pn(a.map(Ls), n, s);
  return h(a);
}
function Ns(e, t) {
  const n = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== Vn || r.id !== Ft(r) || !Xe(r, t))
      throw new Error("Analysis state observation failed provenance verification");
    const o = i.get(r.knownAt);
    if (o && T(o) !== T(r))
      throw new Error(`Conflicting analysis states at ${r.knownAt}`);
    i.set(r.knownAt, r);
  }
  return h([...i.values()]);
}
function _s(e, t) {
  const n = [...e].sort((r, o) => r.knownAt - o.knownAt || r.id.localeCompare(o.id)), i = /* @__PURE__ */ new Map();
  for (const r of n) {
    if (r.schemaVersion !== Bn || r.id !== zn(r) || !Xe(r, t) || r.knownAt < r.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const o = i.get(r.id);
    if (o && T(o) !== T(r))
      throw new Error(`Conflicting replay known event ${r.id}`);
    i.set(r.id, r);
  }
  return h([...i.values()]);
}
function Fs(e, t) {
  return h(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== Cn || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.marketDataSource !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== Nt(i))
        throw new Error("Execution-venue evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function Ms(e, t) {
  return h(
    e.map((n) => {
      var r;
      const i = n;
      if (i.schemaVersion !== In || ((r = i.symbol) == null ? void 0 : r.toUpperCase()) !== t.symbol.toUpperCase() || i.source !== t.source || !Number.isFinite(i.knownAt) || !Number.isFinite(i.effectiveFrom) || i.effectiveTo != null && (!Number.isFinite(i.effectiveTo) || i.effectiveTo <= i.effectiveFrom) || i.observationId !== Ot(i))
        throw new Error("Universe evidence failed provenance verification");
      return i;
    }).sort((n, i) => n.knownAt - i.knownAt)
  );
}
function Ls(e) {
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
function Ds(e, t, n) {
  const i = e.preRollRequirements.filter((o) => o.timeframe === n).reduce(
    (o, a) => Math.max(
      o,
      a.minimumDurationSeconds,
      a.minimumBars * L(n)
    ),
    0
  ), r = n === t.timeframeRoles.candidateTimeframe ? 180 * 86400 : n === t.timeframeRoles.structureTimeframe || t.timeframeRoles.contextTimeframes.includes(n) ? 90 * 86400 : L(n) * 250;
  return Math.max(i, r);
}
function Hs(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: R(e)
  };
}
function Tr(e, t) {
  if (e.id !== t.id || e.version !== t.version || e.profileHash !== t.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function Qn(e) {
  const t = [];
  for (const n of e)
    L(n), t.includes(n) || t.push(n);
  if (!t.length) throw new RangeError("At least one timeframe is required");
  return t;
}
function Si(e, t) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${t} must be a positive integer number of seconds`);
}
function an(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
function Xe(e, t) {
  return e.symbol.toUpperCase() === t.symbol.toUpperCase() && e.source === t.source;
}
const Sr = "linear-quote-perpetual-risk.1", Vs = "sizing-result.1", xr = "trade-plan.1", Bs = "decision-record.1";
function Pr(e) {
  const t = [], n = [
    be(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(be("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((_) => !Number.isFinite(_) || _ <= 0) && t.push(be("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(be("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && C(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!pt(e.intendedEntryPrice, e.venueRules.priceTick) || !pt(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (_) => !pt(_.targetPrice, e.venueRules.priceTick)
  )) && C(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !pt(e.leveragePolicy.leverage, e.venueRules.leverageStep) && C(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    be(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const r = e.riskRequest.accountRiskFraction != null, o = e.riskRequest.fixedRiskAmount != null;
  r === o && t.push(
    be(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (r && (!ee(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || o && (!ee(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && C(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (_) => !Number.isFinite(_) || _ < 0
  ) && C(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && C(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const a = o ? e.riskRequest.fixedRiskAmount : r ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (a == null || !Number.isFinite(a) || a <= 0) && C(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Us(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = ee(s) ? s : null, u = ee(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, l = c != null && u != null ? u - c + c * e.executionAssumptions.entryFeeRate + u * e.executionAssumptions.stopExitFeeRate : null;
  (l == null || !Number.isFinite(l) || l <= 0) && C(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const d = a != null && l != null && l > 0 ? a / l : null;
  let f = d == null ? null : xi(d, e.venueRules.quantityStep);
  if (f != null && a != null && l != null)
    for (; f > 0 && f * l > a + Math.max(1e-10, a * 1e-12); )
      f = xi(
        f - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = f != null && f > 0 ? f : null, v = m == null ? null : m * e.intendedEntryPrice, y = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, p = m == null || u == null ? null : m * u * e.executionAssumptions.stopExitFeeRate, g = m == null || l == null ? null : m * l;
  (m == null || m < e.venueRules.minQuantity) && C(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && C(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const w = e.riskRequest.maximumNotional;
  w != null && v != null && v > w && C(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${w}`
  );
  const b = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, k = e.accountState.availableBalance == null ? b : Math.min(b, e.accountState.availableBalance), P = v != null && k > 0 ? v / k : null, E = Ks(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  E != null && E > e.venueRules.maxLeverage && C(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${E} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const A = v != null && E != null && E > 0 ? v / E : null;
  A != null && A > b + 1e-10 && C(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), A != null && e.accountState.availableBalance != null && A > e.accountState.availableBalance + 1e-10 && C(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const x = m != null && c != null && u != null ? m * (u - c) : null, I = zs(
    e.targets,
    m,
    c,
    x,
    g,
    e.executionAssumptions
  ), Q = ht(
    I.map((_) => _.grossReward * _.positionFraction)
  ), W = ht(
    I.map((_) => _.netProjectedReward * _.positionFraction)
  ), N = ht(
    I.map(
      (_) => _.weightedGrossRContribution == null ? null : _.weightedGrossRContribution
    )
  ), M = ht(
    I.map(
      (_) => _.weightedRContribution == null ? null : _.weightedRContribution
    )
  );
  return h({
    schemaVersion: Vs,
    sizingModelVersion: Sr,
    side: e.side,
    riskBudget: a,
    rawQuantity: d,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: u,
    stopDistanceAbsolute: c == null || u == null ? null : u - c,
    stopDistancePercent: c == null || u == null ? null : (u - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: v,
    estimatedEntryFee: y,
    estimatedStopFee: p,
    projectedLossAtStop: g,
    projectedLossPercentEquity: g == null || e.accountState.equity <= 0 ? null : g / e.accountState.equity * 100,
    selectedLeverage: E,
    minimumRequiredLeverage: P,
    initialMargin: A,
    marginPercentEquity: A == null || e.accountState.equity <= 0 ? null : A / e.accountState.equity * 100,
    marginPercentAvailableBalance: A == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : A / e.accountState.availableBalance * 100,
    targetOutcomes: I,
    weightedGrossReward: Q,
    weightedProjectedReward: W,
    weightedGrossR: N,
    weightedProjectedR: M,
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
function $s(e) {
  var o;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = Pr({
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
    schemaVersion: xr,
    snapshotId: e.snapshot.id,
    setupFamily: ve,
    lifecycleVersion: te,
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
    discretionaryOverrideReason: ((o = e.discretionaryOverrideReason) == null ? void 0 : o.trim()) || null,
    status: e.status,
    createdAt: e.createdAt
  }, i = { ...n, id: e.id ?? jn(n) }, r = qs({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: i
  });
  return h({ ...i, complianceResult: r });
}
function qs(e) {
  var f, m;
  const { strategyProfile: t, snapshot: n, plan: i } = e, r = [...i.sizingResult.hardErrors], o = [], a = [...i.sizingResult.warnings], s = Pr({
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
  (ot(t) !== t.profileHash || Sn(n) !== n.id || jn(i) !== i.id || T(s) !== T(i.sizingResult)) && C(
    r,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), i.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() && C(
    r,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (n.snapshotSchemaVersion !== ir || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || i.setupFamily !== t.setupFamily || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash || i.strategyProfileId !== t.id || i.strategyProfileVersion !== t.version || i.strategyProfileHash !== t.profileHash || T(i.executionAssumptions) !== T(t.executionAssumptions)) && C(
    r,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(i.entryPlan.orderPlanType) || C(
    o,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${i.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(i.stopPlan.derivationType) || C(
    o,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${i.stopPlan.derivationType} is not permitted`
  );
  for (const v of i.targetPlans)
    t.targetPolicy.permittedDerivations.includes(v.derivationType) || C(
      o,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  i.targetPlans.length > t.targetPolicy.maximumTargets && C(
    o,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = i.targetPlans.reduce(
    (v, y) => v + y.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && C(
    r,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), Ws(n, i, r), Gs(i, r), Qs(n, t, o), js(n, t, o), t.stopPolicy.requireOutsideEpisodeHigh && ((f = n.candidateEpisode) == null ? void 0 : f.episodeHigh) != null && i.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && C(
    o,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), i.sizingResult.initialMargin != null && i.sizingResult.initialMargin > i.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && C(
    o,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && i.sizingResult.grossNotional != null && i.sizingResult.grossNotional > t.riskPolicy.maximumNotional && C(
    o,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && i.sizingResult.weightedProjectedR != null && i.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && C(
    o,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${i.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), i.sizingResult.projectedLossAtStop != null && i.sizingResult.projectedLossAtStop > i.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && C(
    o,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const u = o.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), l = ((m = i.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  i.status === "finalized" && o.length > 0 && !u && !l && C(
    r,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let d;
  return r.length > 0 ? d = "InvalidPlan" : u ? d = "OutOfStrategy" : o.length === 0 ? d = "Compliant" : l ? d = "Overridden" : d = "OutOfStrategy", h({
    classification: d,
    hardErrors: r,
    strategyViolations: o,
    warnings: a,
    overrideReason: l
  });
}
function Qt(e) {
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
    schemaVersion: Bs,
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
  }, n = e.id ?? `decision:${R(t).slice(8)}`;
  return h({ ...t, id: n });
}
function Us(e, t, n, i) {
  (!e.length || e.some((o) => o.targetPrice >= t)) && C(i, "NO_VALID_TARGET", "Every short target must be below entry");
  const r = e.reduce((o, a) => o + a.positionFraction, 0);
  (e.some(
    (o) => !Number.isFinite(o.positionFraction) || o.positionFraction <= 0
  ) || Math.abs(r - 1) > n) && C(
    i,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function zs(e, t, n, i, r, o) {
  return t == null || n == null ? [] : e.map((a) => {
    const s = a.targetPrice * (1 + o.adverseTargetSlippageBps / 1e4), c = t * (n - s), u = t * n * o.entryFeeRate, l = t * s * o.targetExitFeeRate, d = c - u - l, f = i != null && i > 0 ? c / i : null, m = r != null && r > 0 ? d / r : null;
    return {
      targetId: a.id,
      targetPrice: a.targetPrice,
      effectiveTargetPrice: s,
      positionFraction: a.positionFraction,
      grossReward: c,
      expectedEntryFee: u,
      expectedExitFee: l,
      netProjectedReward: d,
      grossR: f,
      projectedR: m,
      weightedGrossRContribution: f == null ? null : f * a.positionFraction,
      weightedRContribution: m == null ? null : m * a.positionFraction
    };
  });
}
function Qs(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    C(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (C(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && C(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && C(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const r = e.lifecycleEvidence.some(
    (o) => o.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !r && C(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && C(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function js(e, t, n) {
  var c;
  const i = t.entryPolicy.requiredDataQuality, r = i.candidateMetricsRequired && e.candidateMetrics == null, o = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, a = i.minimumHistoryCoverageRatio != null && (o == null || o < i.minimumHistoryCoverageRatio), s = e.dataQualityNotes.some(
    (u) => i.rejectedNoteSeverities.includes(u.severity)
  );
  (r || a || s) && C(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function Ws(e, t, n) {
  const i = new Map(
    or(e).map((o) => [o.id, o])
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
    ...t.targetPlans.map((o) => ({
      requiresReference: o.derivationType !== "manual" && o.derivationType !== "fixedRMultiple",
      id: o.referenceLevelId,
      reference: o.referenceLevel
    }))
  ];
  for (const o of r) {
    if (!o.id && !o.reference && !o.requiresReference) continue;
    if (!o.id || !o.reference) {
      C(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    o.reference.knownAt > e.effectiveAsOf && C(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${o.id} was not known at the decision cutoff`
    );
    const a = i.get(o.id);
    a ? T(a) !== T(o.reference) && C(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${o.id} differs from the frozen snapshot object`
    ) : C(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${o.id} is absent from the decision snapshot`
    );
  }
}
function Gs(e, t) {
  const n = e.venueRules.priceTick, i = e.entryPlan.associatedReferenceLevel;
  i && Math.abs(e.entryPlan.intendedPrice - i.price) > n + 1e-12 && C(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const r = e.stopPlan.referenceLevel;
  if (r && e.stopPlan.derivationType !== "manual") {
    const o = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? r.rangeHigh ?? r.price : r.price, { basisPoints: a, atrFraction: s, atrValue: c } = e.stopPlan.buffer;
    let u = o;
    a != null && s != null ? C(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : a != null ? u = o * (1 + a / 1e4) : s != null && (ee(c ?? 0) ? u = o + s * (c ?? 0) : C(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - u) > n + 1e-12 && C(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const o of e.targetPlans) {
    const a = o.referenceLevel;
    if (!a || o.derivationType === "manual" || o.derivationType === "fixedRMultiple")
      continue;
    (o.derivationType === "supportZone" ? o.targetPrice >= (a.rangeLow ?? a.price) - n && o.targetPrice <= (a.rangeHigh ?? a.price) + n : Math.abs(o.targetPrice - a.price) <= n + 1e-12) || C(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${o.id} does not match its frozen reference`
    );
  }
}
function Ks(e, t, n) {
  return e.mode === "manual" ? ee(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, Xs(t, n));
}
function jn(e) {
  const {
    id: t,
    complianceResult: n,
    ...i
  } = e;
  return `trade-plan:${R(i).slice(8)}`;
}
function xi(e, t) {
  if (!ee(e) || !ee(t)) return 0;
  const n = Cr(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function Xs(e, t) {
  if (!ee(e) || !ee(t)) return e;
  const n = Cr(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Cr(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function pt(e, t) {
  if (!Number.isFinite(e) || !ee(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function ht(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function ee(e) {
  return Number.isFinite(e) && e > 0;
}
function be(e, t) {
  return { code: e, message: t };
}
function C(e, t, n) {
  e.some((i) => i.code === t) || e.push(be(t, n));
}
const at = "execution-engine.1", Ir = "execution-profile.1", kr = "execution-session.1", Ys = "execution-order.1", Zs = "execution-fill.1", Or = "execution-event.1", Js = "execution-result.1", ec = "execution-data-bundle.1", Wn = "execution-candle.1", Nr = "execution-trade.1", _r = "execution-quote.1", tc = "execution-path-resolution.1", Gn = "venue-execution-rules.1", nc = "venue-fee-schedule.1", Fr = "funding-observation.1", ic = "position-ledger.1";
var X;
class rc {
  constructor(t) {
    ue(this, X);
    Ee(this, "fundingDataAvailable");
    Ee(this, "tradeDataCompleteness");
    Ee(this, "quoteDataCompleteness");
    this.fundingDataAvailable = t.fundingDataAvailable ?? t.funding !== void 0, this.tradeDataCompleteness = t.tradeDataCompleteness ?? (t.trades ? "partial" : "unavailable"), this.quoteDataCompleteness = t.quoteDataCompleteness ?? (t.quotes ? "partial" : "unavailable"), Ie(this, X, h({
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
    for (const i of O(this, X).candles.filter((r) => fe(r, t))) {
      const r = n.get(i.timeframe) ?? [];
      r.push(i), n.set(i.timeframe, r);
    }
    return h(Object.fromEntries([...n].map(([i, r]) => [
      i,
      {
        from: Math.min(...r.map((o) => o.openTime)),
        to: Math.max(...r.map((o) => o.closeTime)),
        count: r.length
      }
    ])));
  }
  async loadCandles(t) {
    return h(O(this, X).candles.filter(
      (n) => fe(n, t) && n.timeframe === t.timeframe && n.openTime >= t.from && n.openTime <= t.to
    ).sort(cc));
  }
  async loadTrades(t) {
    return h((O(this, X).trades ?? []).filter(
      (n) => fe(n, t) && qe(n.eventTime, t)
    ).sort(yt));
  }
  async loadQuotes(t) {
    return h((O(this, X).quotes ?? []).filter(
      (n) => fe(n, t) && qe(n.eventTime, t)
    ).sort(yt));
  }
  async loadMarkPrices(t) {
    return h((O(this, X).markPrices ?? []).filter(
      (n) => fe(n, t) && qe(n.eventTime, t)
    ).sort(yt));
  }
  async loadIndexPrices(t) {
    return h((O(this, X).indexPrices ?? []).filter(
      (n) => fe(n, t) && qe(n.eventTime, t)
    ).sort(yt));
  }
  async loadFundingObservations(t) {
    return h((O(this, X).funding ?? []).filter(
      (n) => fe(n, t) && qe(n.fundingTime, t)
    ).sort((n, i) => n.fundingTime - i.fundingTime || n.id.localeCompare(i.id)));
  }
  async loadVenueRuleEvidence(t) {
    return h((O(this, X).venueRuleEvidence ?? []).filter(
      (n) => fe(n, t)
    ));
  }
}
X = new WeakMap();
function Mr(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return R(n);
}
function oc(e) {
  if (e.schemaVersion !== Ir || e.executionEngineVersion !== at) throw new Error("Unsupported execution profile schema or engine version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Execution profile id and version are required");
  if (e.ambiguityPolicy !== "StrictAmbiguity")
    throw new Error("execution-engine.1 only implements StrictAmbiguity");
  jt(e.orderActivationPolicy.delaySeconds, "activation delay"), lc(e.maximumExecutionHorizon, "execution horizon"), jt(
    e.restingLimitFillPolicy.penetrationTicks,
    "entry penetration ticks"
  ), jt(
    e.targetFillPolicy.penetrationTicks,
    "target penetration ticks"
  );
  for (const i of [
    e.slippageModel.marketEntryBps,
    e.slippageModel.stopExitBps,
    e.slippageModel.marketExitBps
  ]) if (!Number.isFinite(i) || i < 0) throw new RangeError("Slippage bps must be non-negative");
  const t = [...new Set(e.pathResolutionPolicy.candleTimeframesFinestFirst)];
  if (t.forEach(L), !t.length) throw new RangeError("Execution profile requires candle resolution timeframes");
  const n = h({
    ...e,
    pathResolutionPolicy: { candleTimeframesFinestFirst: t }
  });
  return h({ ...n, canonicalConfigHash: Mr(n) });
}
function pu(e) {
  return oc({
    id: "linear-short.replay.research.default",
    version: "1",
    schemaVersion: Ir,
    executionEngineVersion: at,
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
function Lr(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return R(n);
}
function hu(e) {
  if (e.schemaVersion !== nc)
    throw new Error("Unsupported venue fee schedule schema");
  if (Br(e.effectiveFrom, e.effectiveUntil, "fee schedule"), !Number.isFinite(e.makerRate) || e.makerRate < 0 || !Number.isFinite(e.takerRate) || e.takerRate < 0) throw new RangeError("Fee rates must be non-negative finite values");
  if (!e.provenance.trim()) throw new TypeError("Fee schedule provenance is required");
  return h({
    ...e,
    canonicalConfigHash: Lr(e)
  });
}
function Kn(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return R(n);
}
function ac(e, t) {
  if (e.schemaVersion !== Gn)
    throw new Error("Unsupported venue execution rules schema");
  Br(e.effectiveFrom, e.effectiveUntil, "venue rules");
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
  return h({
    ...e,
    symbol: e.symbol.toUpperCase(),
    canonicalConfigHash: Kn({
      ...e,
      symbol: e.symbol.toUpperCase()
    })
  });
}
function yu(e, t, n) {
  return ac({
    id: `${e.venue}:${e.symbol}:linear-perp.execution.research`,
    version: "1",
    schemaVersion: Gn,
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
    feeScheduleRef: sc(t),
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
function Xn(e) {
  const t = L(e.timeframe);
  if (!Number.isInteger(e.openTime) || e.openTime < 0 || e.openTime % t !== 0)
    throw new RangeError("Execution candle openTime must align to its timeframe");
  for (const i of [e.o, e.h, e.l, e.c])
    if (!Number.isFinite(i) || i <= 0) throw new RangeError("Execution OHLC must be positive");
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Execution candle high/low do not contain open and close");
  const n = {
    schemaVersion: Wn,
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
  return h({
    ...n,
    id: `execution-candle:${R(n).slice(8)}`
  });
}
function gu(e, t = e.source) {
  return Xn({
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
function Dr(e) {
  he(e.eventTime, "trade eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (he(t, "trade knownAt"), t < e.eventTime) throw new RangeError("Trade knownAt cannot precede eventTime");
  if (!Number.isFinite(e.price) || e.price <= 0) throw new RangeError("Trade price must be positive");
  if (!Number.isFinite(e.quantity) || e.quantity <= 0) throw new RangeError("Trade quantity must be positive");
  const n = {
    schemaVersion: Nr,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: t,
    price: e.price,
    quantity: e.quantity,
    side: e.side
  };
  return h({
    ...n,
    id: `execution-trade:${R(n).slice(8)}`
  });
}
function Hr(e) {
  he(e.eventTime, "quote eventTime");
  const t = e.knownAt ?? e.eventTime;
  if (he(t, "quote knownAt"), t < e.eventTime) throw new RangeError("Quote knownAt cannot precede eventTime");
  if (!Number.isFinite(e.bid) || !Number.isFinite(e.ask) || e.bid <= 0 || e.ask <= 0 || e.bid > e.ask) throw new RangeError("Quote requires positive bid <= ask");
  const n = {
    schemaVersion: _r,
    venue: e.venue,
    symbol: e.symbol.toUpperCase(),
    eventTime: e.eventTime,
    knownAt: t,
    bid: e.bid,
    ask: e.ask
  };
  return h({
    ...n,
    id: `execution-quote:${R(n).slice(8)}`
  });
}
function Vr(e) {
  he(e.fundingTime, "fundingTime");
  const t = e.knownAt ?? e.fundingTime;
  if (he(t, "funding knownAt"), t < e.fundingTime) throw new RangeError("Funding knownAt cannot precede fundingTime");
  if (!Number.isFinite(e.rate)) throw new RangeError("Funding rate must be finite");
  if (e.markPrice != null && (!Number.isFinite(e.markPrice) || e.markPrice <= 0))
    throw new RangeError("Funding mark price must be positive");
  const n = {
    schemaVersion: Fr,
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
  return h({
    ...n,
    id: `funding-observation:${R(n).slice(8)}`
  });
}
function sc(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function fe(e, t) {
  return e.venue.toLowerCase() === t.venue.toLowerCase() && e.symbol.toUpperCase() === t.symbol.toUpperCase();
}
function qe(e, t) {
  return e >= t.from && e <= t.to;
}
function cc(e, t) {
  return e.openTime - t.openTime || e.knownAt - t.knownAt || e.id.localeCompare(t.id);
}
function yt(e, t) {
  return e.eventTime - t.eventTime || e.id.localeCompare(t.id);
}
function Br(e, t, n) {
  if (e != null && he(e, `${n} effectiveFrom`), t != null && he(t, `${n} effectiveUntil`), e != null && t != null && t <= e)
    throw new RangeError(`${n} effectiveUntil must follow effectiveFrom`);
}
function jt(e, t) {
  if (!Number.isInteger(e) || e < 0) throw new RangeError(`${t} must be non-negative`);
}
function lc(e, t) {
  if (!Number.isInteger(e) || e <= 0) throw new RangeError(`${t} must be positive`);
}
function he(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
async function Au(e) {
  uc(e);
  const t = e.replayFrame.effectiveAsOf, i = t + e.executionProfile.orderActivationPolicy.delaySeconds + e.executionProfile.maximumExecutionHorizon, r = Math.max(
    ...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(L)
  ), o = {
    venue: e.venueRules.venue,
    symbol: e.venueRules.symbol,
    from: t,
    to: i + (e.executionProfile.forceCloseAtHorizon ? r : 0)
  }, a = {};
  for (const w of e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst) {
    const b = await e.historicalDataAdapter.loadCandles({ ...o, timeframe: w });
    dc(b, o.venue, o.symbol, w), a[w] = b;
  }
  const s = await ke(e.historicalDataAdapter.loadTrades, e.historicalDataAdapter, o), c = await ke(e.historicalDataAdapter.loadQuotes, e.historicalDataAdapter, o), u = await ke(e.historicalDataAdapter.loadMarkPrices, e.historicalDataAdapter, o), l = await ke(e.historicalDataAdapter.loadIndexPrices, e.historicalDataAdapter, o), d = e.historicalDataAdapter.fundingDataAvailable ?? e.historicalDataAdapter.loadFundingObservations != null, f = await ke(
    e.historicalDataAdapter.loadFundingObservations,
    e.historicalDataAdapter,
    o
  ), m = await ke(
    e.historicalDataAdapter.loadVenueRuleEvidence,
    e.historicalDataAdapter,
    o
  );
  if (fc(s, c, u, l, f, o.venue, o.symbol), e.historicalDataAdapter.tradeDataCompleteness === "complete" && s.some((w) => w.knownAt !== w.eventTime)) throw new Error("Complete ordered-trade data requires knownAt equal to eventTime");
  const v = {
    candlesByTimeframe: a,
    trades: s,
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: c,
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: u,
    indexPrices: l,
    funding: f
  }, y = {
    candlesByTimeframe: Object.fromEntries(Object.entries(a).map(([w, b]) => [
      w,
      b.filter((k) => k.knownAt <= t)
    ])),
    trades: s.filter((w) => w.knownAt <= t),
    quotes: c.filter((w) => w.knownAt <= t),
    markPrices: u.filter((w) => w.knownAt <= t),
    indexPrices: l.filter((w) => w.knownAt <= t)
  }, p = [
    "CANDLE_ONLY_EXECUTION_IS_APPROXIMATE",
    ...e.feeSchedule.assumptionStatus === "researchAssumption" ? ["RESEARCH_FEE_ASSUMPTION"] : [],
    ...e.venueRules.assumptionStatus === "researchAssumption" ? ["RESEARCH_VENUE_RULE_ASSUMPTION"] : [],
    ...d ? [] : ["FUNDING_DATA_UNAVAILABLE"],
    ...e.venueRules.liquidationModel ? [] : ["EXACT_LIQUIDATION_MODEL_UNAVAILABLE"],
    ...s.length && e.historicalDataAdapter.tradeDataCompleteness !== "complete" ? ["PARTIAL_TRADE_DATA_NOT_USED_FOR_PATH_RESOLUTION"] : [],
    ...e.executionProfile.stopTriggerPolicy.source !== "last" && e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? ["STOP_TRIGGER_LAST_PRICE_FALLBACK_AUTHORIZED"] : []
  ], g = {
    schemaVersion: ec,
    venue: o.venue,
    symbol: o.symbol,
    from: o.from,
    to: o.to,
    candlesByTimeframe: h(a),
    trades: h(s),
    tradeDataCompleteness: e.historicalDataAdapter.tradeDataCompleteness ?? "unavailable",
    quotes: h(c),
    quoteDataCompleteness: e.historicalDataAdapter.quoteDataCompleteness ?? "unavailable",
    markPrices: h(u),
    indexPrices: h(l),
    funding: h(f),
    fundingDataAvailable: d,
    venueRuleEvidence: h(m),
    causalPrefixFingerprint: await Ne(y),
    internalBundleFingerprint: await Ne(v),
    fundingDataFingerprint: d ? await Ne(f.filter((w) => w.knownAt <= t)) : null,
    dataQualityNotes: p
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
function uc(e) {
  const { replaySession: t, replayFrame: n, tradePlan: i, strategyProfile: r, executionProfile: o, venueRules: a, feeSchedule: s } = e;
  if (n.sessionId !== t.id || n.id !== t.currentFrameId)
    throw new Error("Execution frame does not match the replay session");
  if (t.state !== "TradePlanRecorded" && t.state !== "Revealed") throw new Error("Execution requires a replay session with a recorded TradePlan");
  if (n.decisionSnapshot.id !== i.snapshotId || Sn(n.decisionSnapshot) !== n.decisionSnapshot.id || i.id !== jn(i) || i.schemaVersion !== xr || i.status !== "finalized" || i.side !== "short" || i.complianceResult.hardErrors.length > 0) throw new Error("Execution requires an intact finalized short TradePlan");
  if (!t.planningAttempts.some(
    (p) => p.accepted && p.frameId === n.id && p.tradePlan.id === i.id
  )) throw new Error("TradePlan is not the accepted plan for the replay frame");
  if (ot(r) !== r.profileHash || i.strategyProfileId !== r.id || i.strategyProfileVersion !== r.version || i.strategyProfileHash !== r.profileHash || i.lifecycleVersion !== t.lifecycleVersion || i.lifecycleConfigHash !== t.lifecycleConfigHash) throw new Error("Execution strategy or lifecycle reference mismatch");
  if (o.canonicalConfigHash !== Mr(o))
    throw new Error("Execution profile hash mismatch");
  if (a.canonicalConfigHash !== Kn(a))
    throw new Error("Venue execution rules hash mismatch");
  if (s.canonicalConfigHash !== Lr(s))
    throw new Error("Venue fee schedule hash mismatch");
  const u = n.effectiveAsOf;
  Pi(s, u, "fee schedule"), Pi(a, u, "venue execution rules");
  const l = u + o.orderActivationPolicy.delaySeconds + o.maximumExecutionHorizon + (o.forceCloseAtHorizon ? Math.max(...o.pathResolutionPolicy.candleTimeframesFinestFirst.map(L)) : 0);
  if (s.effectiveUntil != null && s.effectiveUntil <= l || a.effectiveUntil != null && a.effectiveUntil <= l) throw new Error("Selected fee schedule and venue rules must cover the execution horizon");
  if (a.venue.toLowerCase() !== i.venueRules.venue.toLowerCase() || a.symbol !== i.venueRules.symbol.toUpperCase() || a.quantityStep !== i.venueRules.quantityStep || a.priceTick !== i.venueRules.priceTick || a.maximumLeverage !== i.venueRules.maxLeverage || a.feeScheduleRef.hash !== s.canonicalConfigHash) throw new Error("Execution rules do not match the frozen planning-rule subset");
  if (i.entryPlan.orderPlanType === "manualReference")
    throw new Error("manualReference is not an executable entry order type");
  const d = i.entryPlan.orderPlanType === "limit" ? "limit" : i.entryPlan.orderPlanType === "stopMarket" ? "stopMarket" : "market";
  if (!a.supportedOrderTypes.includes(d))
    throw new Error(`Venue rules do not support ${d}`);
  if (!a.stopTriggerSources.includes(o.stopTriggerPolicy.source))
    throw new Error("Configured protective-stop trigger source is unsupported by venue rules");
  const f = i.sizingResult.roundedQuantity;
  if (f == null || f <= 0 || !mc(f, a.quantityStep))
    throw new Error("TradePlan has no executable step-aligned quantity");
  const m = f * i.entryPlan.intendedPrice;
  if (f < a.minimumQuantity || m < a.minimumNotional || a.maximumQuantity != null && f > a.maximumQuantity || a.maximumNotional != null && m > a.maximumNotional || (i.sizingResult.selectedLeverage ?? Number.POSITIVE_INFINITY) > a.maximumLeverage) throw new Error("TradePlan exceeds selected venue execution limits");
  if (!o.pathResolutionPolicy.candleTimeframesFinestFirst.includes(
    r.timeframeRoles.executionTimeframe
  )) throw new Error("Execution profile must include the strategy execution timeframe");
  const v = i.sizingResult.initialMargin;
  if (v == null || v <= 0) throw new Error("TradePlan has no initial margin");
  const y = i.entryPlan.intendedPrice + v / f;
  if (i.stopPlan.stopPrice >= y)
    throw new Error("Planned stop reaches the bankruptcy bound without a verified liquidation model");
}
function Pi(e, t, n) {
  if (e.effectiveFrom != null && t < e.effectiveFrom || e.effectiveUntil != null && t >= e.effectiveUntil) throw new Error(`${n} is not effective at the decision time`);
}
async function ke(e, t, n) {
  return e ? e.call(t, n) : [];
}
function dc(e, t, n, i) {
  const r = /* @__PURE__ */ new Set();
  let o = -1;
  for (const a of e) {
    if (a.schemaVersion !== Wn || a.venue.toLowerCase() !== t.toLowerCase() || a.symbol !== n.toUpperCase() || a.timeframe !== i || a.id !== Xn(a).id || a.openTime <= o || r.has(a.id)) throw new Error(`Invalid or duplicate execution candle ${a.id}`);
    o = a.openTime, r.add(a.id);
  }
}
function fc(e, t, n, i, r, o, a) {
  const s = [...e, ...t, ...n, ...i], c = /* @__PURE__ */ new Set();
  for (const u of s) {
    if (u.venue.toLowerCase() !== o.toLowerCase() || u.symbol.toUpperCase() !== a.toUpperCase() || u.knownAt < u.eventTime || c.has(u.id)) throw new Error(`Invalid or duplicate execution observation ${u.id}`);
    const l = "price" in u ? Dr(u).id : Hr(u).id;
    if (u.id !== l) throw new Error(`Execution observation identity mismatch ${u.id}`);
    c.add(u.id);
  }
  for (const u of r) {
    if (u.venue.toLowerCase() !== o.toLowerCase() || u.symbol.toUpperCase() !== a.toUpperCase() || u.id !== Vr(u).id || c.has(u.id)) throw new Error(`Invalid or duplicate funding observation ${u.id}`);
    c.add(u.id);
  }
}
function mc(e, t) {
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
const Ci = "execution-json-data.1";
function vc(e) {
  const t = xe(e, "Execution JSON data");
  if (Kt(t, [
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
  ], "Execution JSON data"), t.schemaVersion !== Ci)
    throw new Error("Unsupported execution JSON data schema");
  const n = Gt(t.venue, "venue"), i = Gt(t.symbol, "symbol").toUpperCase(), r = pc(t.candles, n, i), o = hc(t.trades, n, i), a = Wt(t.quotes, n, i, "quotes"), s = Wt(t.markPrices, n, i, "markPrices"), c = Wt(t.indexPrices, n, i, "indexPrices"), u = Ii(t.tradeDataCompleteness, "tradeDataCompleteness"), l = Ii(t.quoteDataCompleteness, "quoteDataCompleteness");
  if (u === "unavailable" && o.length)
    throw new Error("Unavailable trade data cannot contain observations");
  if (l === "unavailable" && a.length)
    throw new Error("Unavailable quote data cannot contain observations");
  const d = xe(t.funding, "funding");
  let f;
  if (d.availability === "available")
    Kt(d, ["availability", "observations"], "available funding"), f = {
      availability: "available",
      observations: yc(d.observations, n, i)
    };
  else if (d.availability === "unavailable")
    Kt(d, ["availability", "reason"], "unavailable funding"), f = {
      availability: "unavailable",
      reason: Gt(d.reason, "funding reason")
    };
  else
    throw new Error("Funding availability must be available or unavailable");
  const m = ct(t.venueRuleEvidence, "venueRuleEvidence").map((v, y) => gc(v, n, i, y));
  return Ac([
    ...r,
    ...o,
    ...a,
    ...s,
    ...c,
    ...f.availability === "available" ? f.observations : [],
    ...m
  ]), h({
    schemaVersion: Ci,
    venue: n,
    symbol: i,
    candles: Ec(r),
    trades: gt(o),
    tradeDataCompleteness: u,
    quotes: gt(a),
    quoteDataCompleteness: l,
    markPrices: gt(s),
    indexPrices: gt(c),
    funding: f.availability === "available" ? {
      availability: "available",
      observations: [...f.observations].sort(
        (v, y) => v.fundingTime - y.fundingTime || v.knownAt - y.knownAt || v.id.localeCompare(y.id)
      )
    } : f,
    venueRuleEvidence: [...m].sort(
      (v, y) => (v.effectiveFrom ?? -1) - (y.effectiveFrom ?? -1) || v.id.localeCompare(y.id)
    )
  });
}
var Y;
class Eu {
  constructor(t) {
    Ee(this, "fundingDataAvailable");
    Ee(this, "tradeDataCompleteness");
    Ee(this, "quoteDataCompleteness");
    ue(this, Y);
    const n = vc(t);
    this.fundingDataAvailable = n.funding.availability === "available", this.tradeDataCompleteness = n.tradeDataCompleteness, this.quoteDataCompleteness = n.quoteDataCompleteness, Ie(this, Y, new rc({
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
    return O(this, Y).getCoverage(t);
  }
  loadCandles(t) {
    return O(this, Y).loadCandles(t);
  }
  loadTrades(t) {
    return O(this, Y).loadTrades(t);
  }
  loadQuotes(t) {
    return O(this, Y).loadQuotes(t);
  }
  loadMarkPrices(t) {
    return O(this, Y).loadMarkPrices(t);
  }
  loadIndexPrices(t) {
    return O(this, Y).loadIndexPrices(t);
  }
  loadFundingObservations(t) {
    return O(this, Y).loadFundingObservations(t);
  }
  loadVenueRuleEvidence(t) {
    return O(this, Y).loadVenueRuleEvidence(t);
  }
}
Y = new WeakMap();
function pc(e, t, n) {
  const i = /* @__PURE__ */ new Set();
  return ct(e, "candles").map((r, o) => {
    const a = xe(r, `candles[${o}]`);
    if (a.schemaVersion !== Wn) throw new Error(`Invalid candle schema at ${o}`);
    const s = Xn(a);
    Mt(a, s, `candle ${o}`), st(s, t, n, `candle ${o}`);
    const c = `${s.timeframe}:${s.openTime}`;
    if (i.has(c)) throw new Error(`Duplicate candle interval ${c}`);
    return i.add(c), s;
  });
}
function hc(e, t, n) {
  return ct(e, "trades").map((i, r) => {
    const o = xe(i, `trades[${r}]`);
    if (o.schemaVersion !== Nr) throw new Error(`Invalid trade schema at ${r}`);
    const a = Dr(o);
    return Mt(o, a, `trade ${r}`), st(a, t, n, `trade ${r}`), a;
  });
}
function Wt(e, t, n, i) {
  return ct(e, i).map((r, o) => {
    const a = xe(r, `${i}[${o}]`);
    if (a.schemaVersion !== _r) throw new Error(`Invalid quote schema at ${i}[${o}]`);
    const s = Hr(a);
    return Mt(a, s, `${i}[${o}]`), st(s, t, n, `${i}[${o}]`), s;
  });
}
function yc(e, t, n) {
  return ct(e, "funding observations").map((i, r) => {
    const o = xe(i, `funding[${r}]`);
    if (o.schemaVersion !== Fr) throw new Error(`Invalid funding schema at ${r}`);
    const a = Vr(o);
    return Mt(o, a, `funding ${r}`), st(a, t, n, `funding ${r}`), a;
  });
}
function gc(e, t, n, i) {
  const r = xe(e, `venueRuleEvidence[${i}]`);
  if (r.schemaVersion !== Gn || r.canonicalConfigHash !== Kn(r)) throw new Error(`Invalid venue-rule evidence at ${i}`);
  return st(r, t, n, `venueRuleEvidence[${i}]`), h(r);
}
function Mt(e, t, n) {
  if (T(e) !== T(t))
    throw new Error(`Non-canonical or unknown fields in ${n}`);
}
function st(e, t, n, i) {
  if (e.venue.toLowerCase() !== t.toLowerCase() || e.symbol.toUpperCase() !== n)
    throw new Error(`${i} instrument identity mismatch`);
}
function Ac(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e) {
    if (t.has(n.id)) throw new Error(`Duplicate execution observation id ${n.id}`);
    t.add(n.id);
  }
}
function Ii(e, t) {
  if (e !== "complete" && e !== "partial" && e !== "unavailable")
    throw new Error(`${t} must be complete, partial, or unavailable`);
  return e;
}
function Ec(e) {
  return [...e].sort(
    (t, n) => t.openTime - n.openTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function gt(e) {
  return [...e].sort(
    (t, n) => t.eventTime - n.eventTime || t.knownAt - n.knownAt || t.id.localeCompare(n.id)
  );
}
function xe(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e)) throw new TypeError(`${t} must be an object`);
  return e;
}
function ct(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function Gt(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} must be a non-empty string`);
  return e;
}
function Kt(e, t, n) {
  const i = [...t].sort(), r = Object.keys(e).sort();
  if (T(r) !== T(i))
    throw new Error(`${n} has missing or unknown fields`);
}
const bc = "execution-reveal-envelope.1";
function bu(e) {
  const { replaySession: t, replayOutcomeEnvelope: n, executionSession: i } = e, { id: r, ...o } = n;
  if (n.schemaVersion !== Hn || n.id !== `replay-outcome:${R(o).slice(8)}` || t.state !== "Revealed" || t.revealedOutcomeEnvelopeId == null || t.revealedOutcomeEnvelopeId !== n.id || n.sessionId !== t.id) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (i.replaySessionId !== t.id || i.result == null || !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(i.state)) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (i.result.executionSessionId !== i.id)
    throw new Error("Execution result identity mismatch");
  if (!Number.isFinite(e.revealedAt) || e.revealedAt < 0)
    throw new RangeError("Execution reveal time must be a valid timestamp");
  const a = {
    schemaVersion: bc,
    replaySessionId: t.id,
    replayOutcomeEnvelopeId: n.id,
    executionSessionId: i.id,
    revealedAt: e.revealedAt,
    caseOutcomeEnvelope: n,
    executionResult: i.result,
    executionEvents: i.executionEvents
  };
  return h({
    ...a,
    id: `execution-reveal:${R(a).slice(8)}`
  });
}
const se = /* @__PURE__ */ new Set([
  "Closed",
  "EntryExpired",
  "OpenAtHorizon",
  "Ambiguous",
  "Failed"
]);
function Yn(e) {
  Xc(e);
  const t = e.tradePlan, n = e.replayFrame, i = n.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, r = {
    schemaVersion: kr,
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
    executionEngineVersion: at,
    executionProfileRef: bt(e.executionProfile),
    venueRulesRef: bt(e.venueRules),
    feeScheduleRef: bt(e.feeSchedule),
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint,
    fundingDataFingerprint: e.dataBundle.fundingDataFingerprint,
    decisionTime: n.effectiveAsOf,
    orderActivationTime: i,
    executionHorizonTime: i + e.executionProfile.maximumExecutionHorizon
  }, o = {
    ...r,
    id: `execution-session:${R(r).slice(8)}`
  }, a = {
    ...o,
    revision: 0,
    currentAsOf: o.decisionTime,
    state: "Created",
    stateSince: o.decisionTime,
    orders: [],
    fills: [],
    positionLedger: zc(e),
    executionEvents: [],
    pathResolutionRecords: [],
    fundingRecords: [],
    excursionObservations: [],
    result: null,
    dataQualityNotes: [...e.dataBundle.dataQualityNotes],
    errors: []
  };
  return B(a, {
    type: "ExecutionCreated",
    eventTime: o.decisionTime,
    processingAsOf: o.decisionTime,
    explanation: "Execution inputs validated and bound to the finalized TradePlan"
  }), ri(a);
}
function wc(e, t, n) {
  if (oi(e), Yc(e, t), tl(n, "targetAsOf"), n < e.currentAsOf) throw new RangeError("Execution cannot move backward");
  if (se.has(e.state)) return h(e);
  const i = Tc(t, n);
  if (i.executionEvents.length < e.executionEvents.length)
    throw new Error("Execution target precedes already processed causal events");
  const r = i.executionEvents.slice(0, e.executionEvents.length);
  if (T(r) !== T(e.executionEvents))
    throw new Error("Execution history changed under the same session identity");
  return i;
}
function Rc(e, t) {
  const n = t.executionProfile.forceCloseAtHorizon ? 2 * Math.max(...t.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(L)) : 0;
  return wc(e, t, e.executionHorizonTime + n);
}
function wu(e) {
  return Rc(Yn(e), e);
}
function Tc(e, t) {
  const n = Yn(e), i = Zc(n);
  if (t < i.orderActivationTime) return n;
  Sc(i, e);
  const r = e.executionProfile.forceCloseAtHorizon ? t : Math.min(t, i.executionHorizonTime), o = xc(e, r), a = e.dataBundle.funding.filter((c) => c.knownAt <= r);
  let s = 0;
  for (const c of o) {
    if (se.has(i.state)) break;
    for (; s < a.length && a[s].fundingTime < c.eventTime && (Xt(i, e, a[s++], null), !se.has(i.state)); )
      ;
    if (se.has(i.state) || Dc(i, e, c.eventTime, t)) break;
    if (e.executionProfile.forceCloseAtHorizon && c.eventTime >= i.executionHorizonTime && (i.state === "Open" || i.state === "PartiallyClosed")) {
      $r(i, e, c);
      break;
    }
    Ic(i, e, c);
    const u = i.fills.length;
    kc(i, e, c);
    const l = i.fills.length > u;
    for (; s < a.length && a[s].fundingTime >= c.eventTime && a[s].fundingTime < c.intervalEnd && (Xt(i, e, a[s++], l ? c : null), !se.has(i.state)); )
      ;
    se.has(i.state) || B(i, {
      type: "PathResolved",
      eventTime: c.intervalEnd,
      processingAsOf: c.processingAsOf,
      sourceObservationIds: [c.id],
      explanation: `Execution interval resolved with ${c.resolution} ${c.exact ? "ordered" : "OHLC"} data`
    });
  }
  for (; !se.has(i.state) && s < a.length && a[s].fundingTime <= Math.min(t, i.executionHorizonTime); ) Xt(i, e, a[s++], null);
  return se.has(i.state) || Lc(i, e, o, t), ri(i);
}
function Sc(e, t) {
  const n = t.tradePlan, i = n.entryPlan.orderPlanType === "marketNextAvailable" ? "entryMarket" : n.entryPlan.orderPlanType === "limit" ? "entryLimit" : "entryStopMarket", r = St(e.id, {
    kind: i,
    side: "sell",
    quantity: n.sizingResult.roundedQuantity,
    remainingQuantity: n.sizingResult.roundedQuantity,
    limitPrice: i === "entryLimit" ? et(n.entryPlan.intendedPrice, t.venueRules.priceTick, "up") : null,
    triggerPrice: i === "entryStopMarket" ? et(n.entryPlan.intendedPrice, t.venueRules.priceTick, "down") : null,
    activationTime: e.orderActivationTime,
    status: "active",
    reduceOnly: !1,
    parentTargetId: null,
    liquidityAssumption: i === "entryLimit" ? "assumedMaker" : "taker"
  });
  e.orders.push(r), B(e, {
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
function xc(e, t) {
  const n = e.replayFrame.effectiveAsOf + e.executionProfile.orderActivationPolicy.delaySeconds, i = n + e.executionProfile.maximumExecutionHorizon, r = e.executionProfile.forceCloseAtHorizon ? i + Math.max(...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst.map(L)) : i, o = e.dataBundle.trades.filter(
    (l) => l.knownAt <= t && l.eventTime >= n && l.eventTime <= r
  );
  if (o.length && e.dataBundle.tradeDataCompleteness === "complete") return o.map((l) => ({
    id: l.id,
    eventTime: l.eventTime,
    intervalEnd: l.eventTime,
    processingAsOf: l.knownAt,
    open: l.price,
    high: l.price,
    low: l.price,
    close: l.price,
    resolution: "trade",
    exact: !0
  }));
  const a = e.strategyProfile.timeframeRoles.executionTimeframe, s = e.dataBundle.candlesByTimeframe[a] ?? [], c = [];
  for (const l of s) {
    if (l.knownAt > t || l.closeTime <= n || l.openTime > r) continue;
    const d = Pc(e, l, t) ?? [l];
    for (const f of d)
      f.closeTime <= n || f.openTime > r || c.push(Cc(f));
  }
  return [...new Map(c.map((l) => [l.id, l])).values()].sort(
    (l, d) => l.eventTime - d.eventTime || l.processingAsOf - d.processingAsOf || l.id.localeCompare(d.id)
  );
}
function Pc(e, t, n) {
  const i = L(t.timeframe), r = [...e.executionProfile.pathResolutionPolicy.candleTimeframesFinestFirst].filter((o) => L(o) < i).sort((o, a) => L(o) - L(a));
  for (const o of r) {
    const a = L(o), s = i / a;
    if (!Number.isInteger(s)) continue;
    const c = (e.dataBundle.candlesByTimeframe[o] ?? []).filter(
      (d) => d.openTime >= t.openTime && d.closeTime <= t.closeTime && d.knownAt <= Math.min(n, t.knownAt)
    );
    if (c.length !== s) continue;
    let u = t.openTime, l = !0;
    for (const d of c) {
      if (d.openTime !== u) {
        l = !1;
        break;
      }
      u = d.closeTime;
    }
    if (l && u === t.closeTime) return c;
  }
  return null;
}
function Cc(e) {
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
function Ic(e, t, n) {
  const i = {
    schemaVersion: tc,
    intervalStart: n.eventTime,
    intervalEnd: n.intervalEnd,
    requestedResolution: t.strategyProfile.timeframeRoles.executionTimeframe,
    selectedResolution: n.resolution,
    dataSource: n.exact ? "trades" : "candles",
    dataFingerprint: R([n.id]),
    exactOrApproximate: n.exact ? "exact" : "approximate",
    sourceObservationIds: [n.id],
    ambiguities: []
  }, r = {
    ...i,
    id: `execution-path:${R(i).slice(8)}`
  };
  e.pathResolutionRecords.push(r);
}
function kc(e, t, n) {
  e.state === "PendingEntry" && Oc(e, t, n), (e.state === "Open" || e.state === "PartiallyClosed") && (qc(e, n), _c(e, t, n));
}
function Oc(e, t, n) {
  const i = ti(e);
  if (!i || n.eventTime < i.activationTime) return;
  let r = null, o = i.liquidityAssumption, a = 0;
  if (i.kind === "entryMarket")
    r = n.open, o = "taker", a = t.executionProfile.slippageModel.marketEntryBps;
  else if (i.kind === "entryLimit") {
    const l = i.limitPrice;
    n.open >= l ? (r = n.open, o = "assumedTaker") : jc(n, l, t.executionProfile.restingLimitFillPolicy, t.venueRules.priceTick) && (r = l, o = "assumedMaker");
  } else {
    const l = i.triggerPrice;
    n.open <= l ? r = n.open : n.low <= l && (r = l), r != null && (o = "taker", a = t.executionProfile.slippageModel.marketEntryBps);
  }
  if (r == null) return;
  const s = Gc(t, n);
  if (!n.exact && i.kind !== "entryMarket" && s.length) {
    Tt(e, t, n, [i.id, ...s], "ENTRY_AND_EXIT_INTRABAR_ORDER_UNKNOWN");
    return;
  }
  const c = Lt(e, t, i, n, r, o, a, "entry"), u = c.price * c.quantity;
  if (c.quantity < t.venueRules.minimumQuantity || u < t.venueRules.minimumNotional || t.venueRules.maximumQuantity != null && c.quantity > t.venueRules.maximumQuantity || t.venueRules.maximumNotional != null && u > t.venueRules.maximumNotional) {
    Je(e, t, n.eventTime, n.processingAsOf, "Actual entry fill violates venue execution limits");
    return;
  }
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(c), Vc(e, t, c), B(e, {
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
  }), Nc(e, t, c);
}
function Nc(e, t, n) {
  const i = St(e.id, {
    kind: "protectiveStop",
    side: "buy",
    quantity: n.quantity,
    remainingQuantity: n.quantity,
    limitPrice: null,
    triggerPrice: et(t.tradePlan.stopPlan.stopPrice, t.venueRules.priceTick, "up"),
    activationTime: n.eventTime,
    status: "active",
    reduceOnly: !0,
    parentTargetId: null,
    liquidityAssumption: "taker"
  });
  e.orders.push(i), B(e, {
    type: "ProtectiveStopActivated",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: i.quantity,
    referencePrice: i.triggerPrice,
    explanation: "Static reduce-only protective buy stop activated after entry"
  });
  const r = Qc(n.quantity, t.tradePlan.targetPlans.map((o) => ({
    id: o.id,
    fraction: o.positionFraction
  })), t.venueRules.quantityStep);
  for (const o of [...t.tradePlan.targetPlans].sort((a, s) => s.targetPrice - a.targetPrice || a.id.localeCompare(s.id))) {
    const a = r[o.id] ?? 0;
    if (a <= 0) continue;
    const s = St(e.id, {
      kind: "target",
      side: "buy",
      quantity: a,
      remainingQuantity: a,
      limitPrice: et(o.targetPrice, t.venueRules.priceTick, "down"),
      triggerPrice: null,
      activationTime: n.eventTime,
      status: "active",
      reduceOnly: !0,
      parentTargetId: o.id,
      liquidityAssumption: "assumedMaker"
    });
    e.orders.push(s), e.positionLedger.openTargetQuantities[o.id] = a, B(e, {
      type: "TargetActivated",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      orderIds: [s.id],
      quantity: a,
      referencePrice: s.limitPrice,
      explanation: "Static reduce-only target activated after entry"
    });
  }
}
function _c(e, t, n) {
  const i = jr(e), r = ii(e), o = i ? qr(t, n, i.triggerPrice) : null;
  if (o != null && o.unavailable) {
    Je(
      e,
      t,
      n.eventTime,
      n.processingAsOf,
      `Required ${t.executionProfile.stopTriggerPolicy.source} stop-trigger series is unavailable`
    );
    return;
  }
  const a = (o == null ? void 0 : o.touched) ?? !1, s = r.filter(
    (u) => Wc(n, u.limitPrice, t.executionProfile.targetFillPolicy, t.venueRules.priceTick)
  );
  if (!n.exact && a && s.length) {
    Tt(
      e,
      t,
      n,
      [i.id, ...s.map((u) => u.id)],
      "STOP_AND_TARGET_INTRABAR_ORDER_UNKNOWN"
    );
    return;
  }
  const c = e.positionLedger.bankruptcyBoundApprox;
  if (c != null && n.high >= c) {
    B(e, {
      type: "BankruptcyBoundCrossed",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      quantity: e.positionLedger.remainingQuantity,
      referencePrice: c,
      sourceObservationIds: [n.id],
      explanation: "Simple isolated-margin bankruptcy bound crossed without a verified liquidation model",
      dataQualityNotes: ["BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL"]
    }), Tt(e, t, n, i ? [i.id] : [], "BANKRUPTCY_BOUND_CROSSED_WITHOUT_LIQUIDATION_MODEL");
    return;
  }
  if (a) {
    Mc(e, t, n, i, (o == null ? void 0 : o.referencePrice) ?? i.triggerPrice);
    return;
  }
  for (const u of s.sort((l, d) => d.limitPrice - l.limitPrice || l.id.localeCompare(d.id))) {
    if (e.positionLedger.remainingQuantity <= 0) break;
    Fc(e, t, n, u);
  }
}
function Fc(e, t, n, i) {
  const r = Math.min(i.remainingQuantity, e.positionLedger.remainingQuantity), o = Lt(e, t, i, n, i.limitPrice, "assumedMaker", 0, "target", r);
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(o), Jn(e, o), delete e.positionLedger.openTargetQuantities[i.parentTargetId], B(e, {
    type: "TargetFilled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    fillIds: [o.id],
    quantity: r,
    referencePrice: i.limitPrice,
    actualPrice: o.price,
    feeAmount: o.feeAmount,
    sourceObservationIds: [n.id],
    explanation: "Reduce-only target filled without market slippage",
    dataQualityNotes: n.exact ? [] : ["RESTING_LIMIT_FILL_ASSUMPTION"]
  });
  const a = jr(e);
  if (e.positionLedger.remainingQuantity > 0 && a) {
    a.quantity = e.positionLedger.remainingQuantity, a.remainingQuantity = e.positionLedger.remainingQuantity, e.positionLedger.remainingProtectiveStopQuantity = e.positionLedger.remainingQuantity, B(e, {
      type: "ProtectiveStopQuantityAdjusted",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      orderIds: [a.id],
      quantity: a.quantity,
      sourceObservationIds: [n.id],
      explanation: "Protective stop reduced to the exact remaining position"
    }), B(e, {
      type: "PositionPartiallyClosed",
      eventTime: n.eventTime,
      processingAsOf: n.processingAsOf,
      stateAfter: "PartiallyClosed",
      fillIds: [o.id],
      quantity: e.positionLedger.remainingQuantity,
      sourceObservationIds: [n.id],
      explanation: "A planned target reduced the position"
    });
    return;
  }
  a && ei(e, a, n, "All planned target quantity filled"), Zn(e, t, n, "AllTargets", o);
}
function Mc(e, t, n, i, r) {
  const o = r;
  B(e, {
    type: "ProtectiveStopTriggered",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: o,
    sourceObservationIds: [n.id],
    explanation: n.open >= i.triggerPrice ? "Protective stop triggered by an adverse gap" : "Protective stop trigger crossed"
  });
  const a = Lt(
    e,
    t,
    i,
    n,
    o,
    "taker",
    t.executionProfile.slippageModel.stopExitBps,
    "stop",
    e.positionLedger.remainingQuantity
  );
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(a), Jn(e, a), e.positionLedger.remainingProtectiveStopQuantity = 0, B(e, {
    type: "ProtectiveStopFilled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [i.id],
    fillIds: [a.id],
    quantity: a.quantity,
    referencePrice: o,
    actualPrice: a.price,
    feeAmount: a.feeAmount,
    sourceObservationIds: [n.id],
    explanation: "Protective buy stop filled with adverse stop slippage"
  });
  for (const c of ii(e)) ei(e, c, n, "Protective stop closed the position");
  const s = e.fills.some((c) => {
    var u;
    return ((u = Se(e, c.orderId)) == null ? void 0 : u.kind) === "target";
  });
  Zn(e, t, n, s ? "StopAfterPartialTargets" : "Stop", a);
}
function Zn(e, t, n, i, r) {
  Bc(e), e.result = Me(e, t, "Closed", i, null), B(e, {
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
function Xt(e, t, n, i) {
  if (e.state !== "Open" && e.state !== "PartiallyClosed" || e.fundingRecords.some((m) => m.observationId === n.id)) return;
  if (i && t.venueRules.fundingConvention.sameTimestampOrdering === "ambiguous") {
    Tt(
      e,
      t,
      i,
      Wr(e).map((m) => m.id),
      "FUNDING_AND_FILL_ORDER_UNKNOWN"
    );
    return;
  }
  const r = n.markPrice;
  if (r == null) {
    e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE") || e.dataQualityNotes.push("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), t.executionProfile.fundingPolicy.absence === "requireComplete" && Je(e, t, n.fundingTime, n.knownAt, "Funding reference price is unavailable");
    return;
  }
  const o = t.venueRules.fundingConvention.sameTimestampOrdering, a = e.fills.filter((m) => m.eventTime === n.fundingTime), s = a.find((m) => m.side === "sell"), c = a.filter((m) => m.side === "buy"), u = o === "fundingBeforePosition" ? ye(
    e.positionLedger.remainingQuantity + c.reduce((m, v) => m + v.quantity, 0) - ((s == null ? void 0 : s.quantity) ?? 0),
    12
  ) : e.positionLedger.remainingQuantity;
  if (u <= 0) return;
  const l = H(u * r * n.rate), d = {
    observationId: n.id,
    fundingTime: n.fundingTime,
    processingAsOf: Math.max(n.knownAt, (i == null ? void 0 : i.processingAsOf) ?? n.knownAt),
    positionQuantity: u,
    referencePrice: r,
    rate: n.rate,
    amount: l,
    quoteCurrency: t.tradePlan.accountState.quoteCurrency
  }, f = {
    ...d,
    id: `execution-funding:${R(d).slice(8)}`
  };
  e.fundingRecords.push(f), l >= 0 ? e.positionLedger.fundingReceived = H(e.positionLedger.fundingReceived + l) : e.positionLedger.fundingPaid = H(e.positionLedger.fundingPaid + -l), e.positionLedger.netFunding = H(
    e.positionLedger.fundingReceived - e.positionLedger.fundingPaid
  ), lt(e), B(e, {
    type: "FundingApplied",
    eventTime: n.fundingTime,
    processingAsOf: f.processingAsOf,
    quantity: f.positionQuantity,
    referencePrice: r,
    fundingAmount: l,
    sourceObservationIds: [n.id],
    explanation: l >= 0 ? "Positive funding paid to the open short" : "Negative funding charged to the open short"
  });
}
function Lc(e, t, n, i) {
  const r = Qr(e, t);
  if ((e.state === "Created" || e.state === "PendingEntry") && i >= r) {
    if (!ki(n, r, t)) {
      Je(e, t, r, i, "Price data does not cover the entry expiry window");
      return;
    }
    const a = ti(e);
    a && (a.status = "expired", B(e, {
      type: "EntryOrderExpired",
      eventTime: r,
      processingAsOf: r,
      stateAfter: "EntryExpired",
      orderIds: [a.id],
      quantity: a.quantity,
      explanation: "Entry remained unfilled through its deterministic expiry"
    }), e.result = Me(e, t, "EntryExpired", null, null), sn(e));
    return;
  }
  if (i < e.executionHorizonTime || e.state !== "Open" && e.state !== "PartiallyClosed") return;
  const o = [...n].reverse().find((a) => a.eventTime <= e.executionHorizonTime);
  if (!o || !ki(n, e.executionHorizonTime, t)) {
    Je(e, t, e.executionHorizonTime, i, "No eligible price observation exists at the execution horizon");
    return;
  }
  if (t.executionProfile.forceCloseAtHorizon) {
    const a = n.find((s) => s.eventTime >= e.executionHorizonTime);
    if (!a) return;
    $r(e, t, a);
    return;
  }
  $c(e, o.close), B(e, {
    type: "ExecutionHorizonReached",
    eventTime: e.executionHorizonTime,
    processingAsOf: Math.max(e.executionHorizonTime, o.processingAsOf),
    stateAfter: "OpenAtHorizon",
    quantity: e.positionLedger.remainingQuantity,
    referencePrice: o.close,
    sourceObservationIds: [o.id],
    explanation: "Position remains open; no exit was fabricated at the research horizon"
  }), e.result = Me(e, t, "OpenAtHorizon", null, null), sn(e);
}
function ki(e, t, n) {
  const i = [...e].reverse().find((o) => o.eventTime <= t);
  if (!i) return !1;
  const r = L(n.strategyProfile.timeframeRoles.executionTimeframe);
  return t - i.intervalEnd <= r;
}
function $r(e, t, n) {
  const i = St(e.id, {
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
  const r = Lt(
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
  i.status = "filled", i.remainingQuantity = 0, e.fills.push(r), Jn(e, r);
  for (const o of Wr(e).filter((a) => a.id !== i.id))
    ei(e, o, n, "Forced horizon close cancelled protection");
  B(e, {
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
  }), Zn(e, t, n, "ForcedHorizonClose", r);
}
function Dc(e, t, n, i) {
  if (e.state !== "PendingEntry") return !1;
  const r = Qr(e, t);
  if (n < r || i < r) return !1;
  const o = ti(e);
  return o.status = "expired", B(e, {
    type: "EntryOrderExpired",
    eventTime: r,
    processingAsOf: r,
    stateAfter: "EntryExpired",
    orderIds: [o.id],
    quantity: o.quantity,
    explanation: "Entry expired before the next eligible observation"
  }), e.result = Me(e, t, "EntryExpired", null, null), sn(e), !0;
}
function Tt(e, t, n, i, r) {
  const o = Hc(e, t, n, i), a = o.map((u) => u.estimatedNetPnl).filter((u) => u != null), s = {
    code: r,
    intervalStart: n.eventTime,
    intervalEnd: n.intervalEnd,
    orderIds: i,
    sourceObservationIds: [n.id],
    branches: o,
    lowerNetPnlBound: a.length ? Math.min(...a) : null,
    upperNetPnlBound: a.length ? Math.max(...a) : null,
    explanation: "Available observations do not establish a unique chronological execution path"
  }, c = e.pathResolutionRecords.at(-1);
  c && !c.ambiguities.includes(r) && c.ambiguities.push(r), e.result = Me(e, t, "Ambiguous", null, s), B(e, {
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
function Hc(e, t, n, i) {
  const r = ni(e), o = (r == null ? void 0 : r.quantity) ?? t.tradePlan.sizingResult.roundedQuantity, a = r ? e.positionLedger.remainingQuantity : o, s = (r == null ? void 0 : r.price) ?? t.tradePlan.entryPlan.intendedPrice, c = Ur(
    Math.max(n.open, t.tradePlan.stopPlan.stopPrice),
    t.executionProfile.slippageModel.stopExitBps,
    "buy",
    t.venueRules.priceTick
  ).price, u = e.positionLedger.realizedGrossPnl, l = e.positionLedger.totalFees || H(o * s * t.feeSchedule.takerRate), d = H(
    u + a * (s - c) - l - a * c * t.feeSchedule.takerRate + e.positionLedger.netFunding
  ), f = [{
    id: `execution-branch:${R([e.id, n.id, "stop-first"]).slice(8)}`,
    label: "stop-first",
    orderedOrderIds: i.filter((y) => {
      var p;
      return y.includes("stop") || ((p = Se(e, y)) == null ? void 0 : p.kind) === "protectiveStop";
    }),
    estimatedNetPnl: d
  }], m = ii(e).filter((y) => i.includes(y.id)).sort((y, p) => p.limitPrice - y.limitPrice || y.id.localeCompare(p.id)), v = m.length ? m.map((y) => ({ quantity: y.remainingQuantity, price: y.limitPrice, id: y.id })) : [...t.tradePlan.targetPlans].filter((y) => i.includes(y.id)).sort((y, p) => p.targetPrice - y.targetPrice || y.id.localeCompare(p.id)).map((y) => ({
    quantity: zr(o * y.positionFraction, t.venueRules.quantityStep),
    price: y.targetPrice,
    id: y.id
  }));
  if (v.length) {
    let y = a, p = u, g = l;
    const w = [];
    for (const P of v) {
      const E = Math.min(y, P.quantity);
      E <= 0 || (p += E * (s - P.price), g += E * P.price * t.feeSchedule.makerRate, y = ye(y - E, 12), w.push(P.id));
    }
    i.some((P) => {
      var E;
      return P.includes("stop") || ((E = Se(e, P)) == null ? void 0 : E.kind) === "protectiveStop";
    }) && y > 0 && (p += y * (s - c), g += y * c * t.feeSchedule.takerRate, w.push(...i.filter((P) => {
      var E;
      return P.includes("stop") || ((E = Se(e, P)) == null ? void 0 : E.kind) === "protectiveStop";
    })));
    const k = H(p - g + e.positionLedger.netFunding);
    f.push({
      id: `execution-branch:${R([e.id, n.id, "target-first"]).slice(8)}`,
      label: "target-first",
      orderedOrderIds: w,
      estimatedNetPnl: k
    });
  }
  return f;
}
function Je(e, t, n, i, r) {
  e.errors.push(r), e.result = Me(e, t, "Failed", null, null), B(e, {
    type: "ExecutionFailed",
    eventTime: n,
    processingAsOf: i,
    stateAfter: "Failed",
    explanation: r
  });
}
function Lt(e, t, n, i, r, o, a, s, c = n.quantity) {
  const u = a > 0 ? Ur(r, a, n.side, t.venueRules.priceTick) : { price: r, adjustment: 0 }, l = a > 0 ? {
    model: t.executionProfile.slippageModel.model,
    version: t.executionProfile.slippageModel.version,
    bps: a,
    referencePrice: r,
    signedPriceAdjustment: u.adjustment,
    finalFillPrice: u.price
  } : null, d = o === "maker" || o === "assumedMaker" ? t.feeSchedule.makerRate : t.feeSchedule.takerRate, f = {
    schemaVersion: Zs,
    orderId: n.id,
    eventTime: i.eventTime,
    processingAsOf: i.processingAsOf,
    side: n.side,
    quantity: c,
    referencePrice: r,
    price: u.price,
    slippage: l,
    liquidityRole: o,
    feeRate: d,
    feeAmount: H(u.price * c * d),
    feeCurrency: t.tradePlan.accountState.quoteCurrency,
    feeScheduleRef: bt(t.feeSchedule),
    sourceObservationIds: [i.id],
    dataQualityNotes: [
      ...i.exact ? [] : [`${s.toUpperCase()}_CANDLE_APPROXIMATION`],
      ...o.startsWith("assumed") ? ["LIQUIDITY_ROLE_ASSUMED"] : []
    ]
  };
  return {
    ...f,
    id: `execution-fill:${R(f).slice(8)}`
  };
}
function Vc(e, t, n) {
  const i = e.positionLedger;
  i.originalFilledQuantity = n.quantity, i.remainingQuantity = n.quantity, i.averageEntryPrice = n.price, i.initialNotional = H(n.quantity * n.price), i.initialMargin = H(i.initialNotional / i.selectedLeverage), i.maximumMarginUsed = i.initialMargin, i.marginAllocation = i.initialMargin, i.entryFees = n.feeAmount, i.totalFees = n.feeAmount, i.remainingProtectiveStopQuantity = n.quantity, i.bankruptcyBoundApprox = n.price + i.initialMargin / n.quantity, lt(e);
}
function Jn(e, t) {
  const n = e.positionLedger, i = n.originalFilledQuantity - n.remainingQuantity, r = i + t.quantity;
  n.averageExitPrice = r > 0 ? H(((n.averageExitPrice ?? 0) * i + t.price * t.quantity) / r) : null, n.realizedGrossPnl = H(
    n.realizedGrossPnl + t.quantity * (n.averageEntryPrice - t.price)
  ), n.remainingQuantity = ye(
    Math.max(0, n.remainingQuantity - t.quantity),
    12
  ), n.exitFees = H(n.exitFees + t.feeAmount), n.totalFees = H(n.entryFees + n.exitFees), n.remainingProtectiveStopQuantity = n.remainingQuantity, lt(e);
}
function Bc(e) {
  const t = e.positionLedger;
  t.remainingQuantity = 0, t.unrealizedGrossPnl = 0, t.unrealizedNetPnlExcludingUnknownFutureCosts = 0, t.remainingProtectiveStopQuantity = 0, t.openTargetQuantities = {}, lt(e), t.accountEquityAfter = H(t.accountEquityBefore + t.realizedNetPnl);
}
function $c(e, t) {
  const n = e.positionLedger;
  n.unrealizedGrossPnl = H(n.remainingQuantity * (n.averageEntryPrice - t)), n.unrealizedNetPnlExcludingUnknownFutureCosts = n.unrealizedGrossPnl, lt(e);
}
function lt(e) {
  const t = e.positionLedger;
  t.realizedNetPnl = H(t.realizedGrossPnl - t.totalFees + t.netFunding);
}
function qc(e, t) {
  const n = ni(e);
  if (!n) return;
  const i = Se(e, n.orderId);
  if (!t.exact && n.eventTime === t.eventTime && (i == null ? void 0 : i.kind) !== "entryMarket") return;
  const r = {
    sourceObservationId: t.id,
    eventTime: t.eventTime,
    processingAsOf: t.processingAsOf,
    resolution: t.resolution,
    high: t.high,
    low: t.low
  };
  e.excursionObservations.some((a) => a.sourceObservationId === t.id) || e.excursionObservations.push(r);
  const o = e.positionLedger.remainingQuantity * Math.max(
    0,
    t.high - e.positionLedger.averageEntryPrice
  );
  e.positionLedger.maximumAdverseUnrealizedLoss = H(Math.max(
    e.positionLedger.maximumAdverseUnrealizedLoss,
    o
  ));
}
function Me(e, t, n, i, r) {
  var w;
  const o = ni(e), a = e.fills.filter((b) => b.side === "buy").map((b) => {
    const k = Se(e, b.orderId), P = k.kind === "target" ? "target" : i === "ForcedHorizonClose" ? "forcedHorizonClose" : "stop";
    return {
      fillId: b.id,
      kind: P,
      targetId: k.parentTargetId,
      quantity: b.quantity,
      price: b.price,
      eventTime: b.eventTime,
      grossPnl: o ? H(b.quantity * (o.price - b.price)) : 0,
      fee: b.feeAmount
    };
  }), s = a.find((b) => b.kind === "stop") ?? null, c = Uc(e, o), u = !t.dataBundle.fundingDataAvailable || e.dataQualityNotes.includes("FUNDING_REFERENCE_PRICE_UNAVAILABLE"), l = H(
    e.positionLedger.realizedNetPnl + e.positionLedger.unrealizedGrossPnl
  ), d = r ? "ambiguous" : u ? "fundingIncomplete" : "complete", f = d === "complete" ? l : null, m = t.tradePlan.sizingResult.projectedLossAtStop, v = t.tradePlan.sizingResult.riskBudget, y = a.filter((b) => b.kind === "target").map((b) => b.eventTime).sort()[0] ?? null, p = a.length ? Math.max(...a.map((b) => b.eventTime)) : null, g = {
    schemaVersion: Js,
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
    usedMarketDataFingerprint: R(
      e.pathResolutionRecords.flatMap((b) => b.sourceObservationIds)
    ),
    pathResolutionRecords: h(e.pathResolutionRecords),
    fundingDataFingerprint: t.dataBundle.fundingDataAvailable ? R(e.fundingRecords.map((b) => b.observationId)) : null,
    status: n,
    closeReason: i,
    entrySummary: o,
    exitSummary: a,
    targetSummary: a.filter((b) => b.kind === "target"),
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
    actualNetPnl: f,
    netPnlExcludingUnknownFunding: l,
    actualNetPnlCompleteness: d,
    budgetR: f != null && v ? f / v : null,
    plannedRiskR: f != null && m ? f / m : null,
    grossR: m ? e.positionLedger.realizedGrossPnl / m : null,
    netR: f != null && m ? f / m : null,
    ...c,
    holdingDuration: o ? (p ?? e.executionHorizonTime) - o.eventTime : null,
    timeToFirstTarget: o && y != null ? y - o.eventTime : null,
    timeToStop: o && s ? s.eventTime - o.eventTime : null,
    timeToFullExit: o && p != null && e.positionLedger.remainingQuantity === 0 ? p - o.eventTime : null,
    initialNotional: e.positionLedger.initialNotional,
    averageEntry: e.positionLedger.averageEntryPrice,
    averageExit: e.positionLedger.averageExitPrice,
    maximumMarginUsed: e.positionLedger.maximumMarginUsed,
    entrySlippage: (o == null ? void 0 : o.slippage) ?? null,
    stopSlippage: s ? ((w = e.fills.find((b) => b.id === s.fillId)) == null ? void 0 : w.slippage) ?? null : null,
    actualVsProjectedStopLoss: s && m ? H(-e.positionLedger.realizedNetPnl - m) : null,
    ambiguity: r,
    dataQualityNotes: [...new Set(e.dataQualityNotes)],
    executionModelVersion: at
  };
  return {
    ...g,
    id: `execution-result:${R(g).slice(8)}`
  };
}
function Uc(e, t) {
  if (!t || !e.excursionObservations.length) return {
    maximumAdverseExcursion: null,
    maximumFavorableExcursion: null,
    maePrice: null,
    mfePrice: null,
    maeTime: null,
    mfeTime: null,
    excursionResolution: null
  };
  const n = e.excursionObservations.reduce((r, o) => o.high > r.high ? o : r), i = e.excursionObservations.reduce((r, o) => o.low < r.low ? o : r);
  return {
    maximumAdverseExcursion: Math.max(0, n.high - t.price),
    maximumFavorableExcursion: Math.max(0, t.price - i.low),
    maePrice: n.high,
    mfePrice: i.low,
    maeTime: n.eventTime,
    mfeTime: i.eventTime,
    excursionResolution: Kc(e.excursionObservations.map((r) => r.resolution))
  };
}
function B(e, t) {
  const n = e.state, i = e.executionEvents.at(-1);
  if (i && t.processingAsOf < i.processingAsOf)
    throw new Error("Execution event processing time cannot move backward");
  t.stateAfter && t.stateAfter !== n && (Gr(n, t.stateAfter), e.state = t.stateAfter, e.stateSince = t.eventTime), e.currentAsOf = Math.max(e.currentAsOf, t.processingAsOf);
  const r = {
    schemaVersion: Or,
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
    id: `execution-event:${R(r).slice(8)}`
  };
  e.executionEvents.push(o), e.revision = e.executionEvents.length;
}
function sn(e) {
  const t = e.executionEvents.pop();
  if (!t) throw new Error("Execution has no event to finalize");
  const n = {
    ...t,
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
  }, { id: i, ...r } = n;
  e.executionEvents.push({
    ...r,
    id: `execution-event:${R(r).slice(8)}`
  }), e.revision = e.executionEvents.length;
}
function ei(e, t, n, i) {
  t.status = "cancelled", t.remainingQuantity = 0, t.parentTargetId && delete e.positionLedger.openTargetQuantities[t.parentTargetId], B(e, {
    type: "OrderCancelled",
    eventTime: n.eventTime,
    processingAsOf: n.processingAsOf,
    orderIds: [t.id],
    sourceObservationIds: [n.id],
    explanation: i
  });
}
function St(e, t) {
  const n = { schemaVersion: Ys, ...t };
  return {
    ...n,
    id: `execution-order:${R([e, n]).slice(8)}`
  };
}
function zc(e) {
  return {
    schemaVersion: ic,
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
function Qc(e, t, n) {
  const i = {};
  let r = 0;
  if (t.forEach((o, a) => {
    const s = a === t.length - 1 ? ye(e - r, xt(n)) : zr(e * o.fraction, n);
    i[o.id] = Math.max(0, s), r = ye(r + s, xt(n));
  }), r > e + n * 1e-9) throw new Error("Target allocation exceeds filled position");
  return i;
}
function jc(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.high >= t : n.policy === "PenetrationByTicks" ? e.high >= t + n.penetrationTicks * i : e.high >= t;
}
function Wc(e, t, n, i) {
  return n.policy === "ExactDataRequired" ? e.exact && e.low <= t : n.policy === "PenetrationByTicks" ? e.low <= t - n.penetrationTicks * i : e.low <= t;
}
function qr(e, t, n) {
  const i = e.executionProfile.stopTriggerPolicy.source;
  if (i === "last")
    return {
      touched: t.high >= n,
      referencePrice: t.open >= n ? t.open : n,
      unavailable: !1
    };
  const o = (i === "mark" ? e.dataBundle.markPrices : e.dataBundle.indexPrices).filter(
    (s) => s.eventTime >= t.eventTime && s.eventTime < Math.max(t.intervalEnd, t.eventTime + 1) && s.knownAt <= t.processingAsOf
  ), a = o.find((s) => (s.bid + s.ask) / 2 >= n);
  return a ? {
    touched: !0,
    referencePrice: Math.max(n, (a.bid + a.ask) / 2),
    unavailable: !1
  } : o.length ? { touched: !1, referencePrice: n, unavailable: !1 } : e.executionProfile.stopTriggerPolicy.authorizedFallback === "last" ? {
    touched: t.high >= n,
    referencePrice: t.open >= n ? t.open : n,
    unavailable: !1
  } : { touched: !1, referencePrice: n, unavailable: !0 };
}
function Gc(e, t) {
  const n = [];
  qr(e, t, e.tradePlan.stopPlan.stopPrice).touched && n.push("planned-stop");
  for (const i of e.tradePlan.targetPlans) t.low <= i.targetPrice && n.push(i.id);
  return n;
}
function Ur(e, t, n, i) {
  const r = n === "sell" ? e * (1 - t / 1e4) : e * (1 + t / 1e4), o = et(r, i, n === "sell" ? "down" : "up");
  return { price: o, adjustment: H(o - e) };
}
function et(e, t, n) {
  const i = n === "up" ? Math.ceil(e / t - 1e-12) : Math.floor(e / t + 1e-12);
  return ye(i * t, xt(t));
}
function zr(e, t) {
  return ye(Math.floor(e / t + 1e-12) * t, xt(t));
}
function H(e) {
  return ye(e, 12);
}
function ye(e, t) {
  return Number(e.toFixed(Math.min(15, Math.max(t, 0))));
}
function xt(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function Qr(e, t) {
  return Math.min(
    t.tradePlan.entryPlan.expiresAt ?? Number.POSITIVE_INFINITY,
    e.executionHorizonTime
  );
}
function ti(e) {
  return e.orders.find((t) => t.kind.startsWith("entry") && t.status === "active") ?? null;
}
function ni(e) {
  return e.fills.find((t) => {
    var n;
    return (n = Se(e, t.orderId)) == null ? void 0 : n.kind.startsWith("entry");
  }) ?? null;
}
function jr(e) {
  return e.orders.find((t) => t.kind === "protectiveStop" && t.status === "active") ?? null;
}
function ii(e) {
  return e.orders.filter((t) => t.kind === "target" && t.status === "active");
}
function Wr(e) {
  return e.orders.filter(
    (t) => (t.kind === "protectiveStop" || t.kind === "target") && t.status === "active"
  );
}
function Se(e, t) {
  return e.orders.find((n) => n.id === t) ?? null;
}
function bt(e) {
  return { id: e.id, version: e.version, hash: e.canonicalConfigHash };
}
function Kc(e) {
  return e.includes("trade") ? "trade" : [...e].sort((t, n) => L(t) - L(n))[0] ?? null;
}
function Gr(e, t) {
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
function Xc(e) {
  if (e.dataBundle.schemaVersion !== "execution-data-bundle.1" || e.executionProfile.executionEngineVersion !== at) throw new Error("Execution case identity is invalid");
  if (e.tradePlan.snapshotId !== e.replayFrame.decisionSnapshot.id)
    throw new Error("Execution TradePlan snapshot mismatch");
}
function Yc(e, t) {
  const n = Yn(t), i = cn(e), r = cn(n);
  if (T(i) !== T(r))
    throw new Error("Execution session does not match the loaded case");
}
function Zc(e) {
  const t = JSON.parse(T(e)), { integrityHash: n, ...i } = t;
  return i;
}
function ri(e) {
  const t = h(e);
  return h({ ...t, integrityHash: R(t) });
}
function cn(e) {
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
function oi(e) {
  if (e.schemaVersion !== kr)
    throw new Error("Unsupported execution session schema");
  const { integrityHash: t, ...n } = e;
  if (R(n) !== t) throw new Error("Execution session integrity mismatch");
  const i = Jc(e);
  if (T(i) !== T(e))
    throw new Error("Execution event-log reconstruction differs from direct state");
}
function Jc(e) {
  var i;
  const t = cn(e), n = {
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
    const { id: o, ...a } = r;
    if (r.schemaVersion !== Or || r.executionSessionId !== e.id || r.sequence !== n.executionEvents.length || o !== `execution-event:${R(a).slice(8)}` || r.stateBefore !== n.state) throw new Error(`Invalid execution event ${r.id}`);
    if (r.stateAfter !== r.stateBefore && Gr(r.stateBefore, r.stateAfter), r.processingAsOf < n.currentAsOf)
      throw new Error(`Execution event processing time moved backward at ${r.id}`);
    n.state = r.stateAfter, r.stateAfter !== r.stateBefore && (n.stateSince = r.eventTime), n.currentAsOf = Math.max(n.currentAsOf, r.processingAsOf), n.orders = h(r.ordersAfter), n.fills = h(r.fillsAfter), n.positionLedger = h(r.positionLedgerAfter), n.pathResolutionRecords = h(r.pathResolutionRecordsAfter), n.fundingRecords = h(r.fundingRecordsAfter), n.excursionObservations = h(r.excursionObservationsAfter), n.result = h(r.resultAfter), n.dataQualityNotes = [...r.sessionDataQualityNotesAfter], n.errors = [...r.errorsAfter], el(n, r), n.executionEvents.push(h(r)), n.revision += 1;
  }
  return ri(n);
}
function el(e, t) {
  const n = /* @__PURE__ */ new Set();
  for (const s of e.orders) {
    if (n.has(s.id) || s.quantity <= 0 || s.remainingQuantity < 0 || s.remainingQuantity > s.quantity) throw new Error(`Invalid execution order snapshot at ${t.id}`);
    n.add(s.id);
  }
  const i = /* @__PURE__ */ new Set();
  let r = 0, o = 0, a = 0;
  for (const s of e.fills) {
    if (i.has(s.id) || !n.has(s.orderId) || s.quantity <= 0 || s.price <= 0 || s.feeAmount < 0) throw new Error(`Invalid execution fill snapshot at ${t.id}`);
    i.add(s.id), s.side === "sell" ? r += s.quantity : o += s.quantity, a += s.feeAmount;
  }
  if (o > r + 1e-9 || Math.abs(e.positionLedger.remainingQuantity - (r - o)) > 1e-8)
    throw new Error(`Execution quantity conservation failed at ${t.id}`);
  if (Math.abs(e.positionLedger.totalFees - H(a)) > 1e-9)
    throw new Error(`Execution fee conservation failed at ${t.id}`);
  if (se.has(e.state) && e.result == null)
    throw new Error(`Terminal execution event has no result at ${t.id}`);
  if (e.result) {
    const { id: s, ...c } = e.result;
    if (s !== `execution-result:${R(c).slice(8)}`)
      throw new Error(`Execution result identity mismatch at ${t.id}`);
  }
}
function Ru(e) {
  return oi(e), T(e);
}
function Tu(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized execution session must be an object");
  const n = t;
  return oi(n), h(n);
}
function tl(e, t) {
  if (!Number.isFinite(e) || e < 0) throw new RangeError(`${t} must be a valid timestamp`);
}
const Oi = "replay-json-data.1";
function nl(e) {
  const t = Pe(e, "Replay JSON data");
  if (t.schemaVersion !== Oi)
    throw new Error("Unsupported Replay JSON data schema");
  const n = Le(t.symbol, "Replay JSON data symbol").toUpperCase(), i = Le(t.source, "Replay JSON data source"), r = un(t.candles, "candles"), o = Ue(
    t.candleRevisions,
    "candleRevisions"
  ), a = un(t.radarEpisodes, "radarEpisodes"), s = Ue(
    t.analysisStateHistory,
    "analysisStateHistory"
  ), c = Ue(t.knownEvents, "knownEvents"), u = Ue(
    t.venueEvidence,
    "venueEvidence"
  ), l = Ue(
    t.universeEvidence,
    "universeEvidence"
  ), d = fl(
    t.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (o.length > 0 && !d)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return il(r, o, n, i), rl(a, n, i), ol(s, n, i), al(c, n, i), sl(u, n, i), cl(l, n, i), h({
    schemaVersion: Oi,
    symbol: n,
    source: i,
    candles: Fi(r),
    candleRevisions: Fi(o),
    radarEpisodes: [...a].sort(
      (f, m) => f.detectedAt - m.detectedAt || f.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (f, m) => f.knownAt - m.knownAt || f.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (f, m) => f.knownAt - m.knownAt || f.id.localeCompare(m.id)
    ),
    venueEvidence: [...u].sort(Mi),
    universeEvidence: [...l].sort(Mi),
    revisionHistoryAvailable: d
  });
}
var $, ce, wt, ln;
class Su {
  constructor(t) {
    ue(this, ce);
    ue(this, $);
    Ie(this, $, nl(t));
  }
  async getCoverage(t) {
    var i;
    Xr(t);
    const n = de(this, ce, wt).call(this, [...O(this, $).candles, ...O(this, $).candleRevisions], t);
    return h({
      timeframe: t.timeframe,
      earliestOpenTime: ((i = n[0]) == null ? void 0 : i.openTime) ?? null,
      latestCloseTime: n.length ? Math.max(...n.map((r) => r.closeTime)) : null,
      revisionHistoryAvailable: O(this, $).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(t) {
    return _i(t), h(
      de(this, ce, wt).call(this, O(this, $).candles, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions(t) {
    return _i(t), O(this, $).revisionHistoryAvailable ? h(
      de(this, ce, wt).call(this, O(this, $).candleRevisions, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(t) {
    return At(t), h(
      O(this, $).venueEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && Ni(n, t)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return At(t), h(
      O(this, $).universeEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && Ni(n, t)
      )
    );
  }
  async loadAnalysisStateHistory(t) {
    return At(t), h(
      O(this, $).analysisStateHistory.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return At(t), de(this, ce, ln).call(this, t) ? h(
      O(this, $).knownEvents.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    ) : [];
  }
  async loadRadarEpisode(t) {
    if (typeof t != "string" || !t.trim())
      throw new TypeError("Radar episode id is required");
    return h(
      O(this, $).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
$ = new WeakMap(), ce = new WeakSet(), wt = function(t, n) {
  return de(this, ce, ln).call(this, n) ? t.filter((i) => i.timeframe === n.timeframe) : [];
}, ln = function(t) {
  return t.symbol.toUpperCase() === O(this, $).symbol && t.source === O(this, $).source;
};
function il(e, t, n, i) {
  const r = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const s of [...e, ...t]) {
    Pe(s, "Replay candle");
    const c = L(s.timeframe);
    if (s.symbol.toUpperCase() !== n || s.source !== i || !re(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !re(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== qn(s) || s.observationId !== Un(s) || !ll(s) || !Yt(s.vBase) || !Yt(s.vQuote) || !ul(s.revision) || !Yt(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    ge(o, s.observationId, s, "candle observation"), ge(
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
  for (const s of t) {
    const c = r.get(s.logicalCandleId);
    if (!c) throw new Error(`Candle revision has no base record: ${s.logicalCandleId}`);
    if (s.knownAt <= c.knownAt)
      throw new Error(`Candle revision must be published after its base record: ${s.logicalCandleId}`);
  }
}
function rl(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Pe(r, "Radar episode"), r.schemaVersion !== xn || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== On(r))
      throw new Error(`Invalid radar episode ${r.id ?? "<unknown>"}`);
    ge(i, r.id, r, "radar episode");
  }
}
function ol(e, t, n) {
  const i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of e) {
    if (Pe(o, "Replay analysis state"), o.schemaVersion !== Vn || o.symbol.toUpperCase() !== t || o.source !== n || !re(o.knownAt) || o.lifecycle.asOf == null || o.lifecycle.asOf > o.knownAt || o.id !== Ft(o))
      throw new Error(`Invalid replay analysis state ${o.id ?? "<unknown>"}`);
    ge(i, o.id, o, "analysis state observation"), ge(r, o.knownAt, o, "analysis state knowledge time");
  }
}
function al(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Pe(r, "Replay known event"), r.schemaVersion !== Bn || r.symbol.toUpperCase() !== t || r.source !== n || !re(r.eventTime) || !re(r.knownAt) || r.knownAt < r.eventTime || r.id !== zn(r))
      throw new Error(`Invalid replay known event ${r.id ?? "<unknown>"}`);
    r.timeframe != null && L(r.timeframe), ge(i, r.id, r, "known event");
  }
}
function sl(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Pe(r, "Venue evidence"), r.schemaVersion !== Cn || r.symbol.toUpperCase() !== t || r.marketDataSource !== n || r.observationId !== Nt(r))
      throw new Error(`Invalid execution-venue evidence ${r.observationId ?? "<unknown>"}`);
    Kr(r, "execution-venue evidence"), ge(i, r.observationId, r, "execution-venue evidence");
  }
}
function cl(e, t, n) {
  const i = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (Pe(r, "Universe evidence"), r.schemaVersion !== In || r.symbol.toUpperCase() !== t || r.source !== n || r.observationId !== Ot(r))
      throw new Error(`Invalid universe evidence ${r.observationId ?? "<unknown>"}`);
    Kr(r, "universe evidence"), ge(i, r.observationId, r, "universe evidence");
  }
}
function Kr(e, t) {
  if (!re(e.effectiveFrom) || !re(e.knownAt) || e.effectiveTo != null && (!re(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${t} interval`);
}
function Ni(e, t) {
  return e.knownAt <= t.to && e.effectiveFrom <= t.to && (e.effectiveTo == null || e.effectiveTo >= t.from);
}
function Xr(e) {
  Le(e.symbol, "Replay query symbol"), Le(e.source, "Replay query source"), L(e.timeframe);
}
function _i(e) {
  Xr(e), Yr(e.from, e.to);
}
function At(e) {
  Le(e.symbol, "Replay evidence query symbol"), Le(e.source, "Replay evidence query source"), Yr(e.from, e.to);
}
function Yr(e, t) {
  if (!re(e) || !re(t) || t < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function Fi(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function Mi(e, t) {
  return e.effectiveFrom - t.effectiveFrom || e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function ge(e, t, n, i) {
  const r = e.get(t);
  if (r && T(r) !== T(n))
    throw new Error(`Conflicting ${i}`);
  e.set(t, n);
}
function ll(e) {
  return Et(e.o) && Et(e.h) && Et(e.l) && Et(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function Et(e) {
  return Number.isFinite(e) && e > 0;
}
function Yt(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function ul(e) {
  return e == null || dl(e);
}
function dl(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function re(e) {
  return Number.isFinite(e) && e >= 0;
}
function Pe(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function Le(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function fl(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function un(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function Ue(e, t) {
  return e == null ? [] : un(e, t);
}
var rt;
class xu {
  constructor(t) {
    ue(this, rt);
    Ie(this, rt, h(t));
  }
  async revealCaseOutcome(t) {
    const n = O(this, rt)[t.manifestId];
    if (!n) throw new Error(`No outcome is available for ${t.manifestId}`);
    const i = {
      schemaVersion: Hn,
      sessionId: t.sessionId,
      manifestId: t.manifestId,
      revealedAt: t.revealedAt,
      revealedBeforeDecisionCompletion: t.revealedBeforeDecisionCompletion,
      outcome: n
    };
    return h({
      ...i,
      id: `replay-outcome:${R(i).slice(8)}`
    });
  }
}
rt = new WeakMap();
function Pu(e, t) {
  return Ht(e), h({
    schemaVersion: br,
    id: t.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: t.type,
    payload: t.payload ?? {}
  });
}
function Zr(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && L(e.timeframe), e.type === "PriceCrossesKnownLevel" && !Zt(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!Zt(e.frozenLowerBound) || !Zt(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const t = {
    schemaVersion: Ts,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map(Zr) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return h({
    ...t,
    id: `replay-wake-condition:${R(t).slice(8)}`
  });
}
function Cu(e) {
  var n, i;
  if (Hi(e.createdAt, "wake plan createdAt"), Hi(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((n = e.scheduledReview) == null ? void 0 : n.mode) === "nextCompletedCandle" && L(e.scheduledReview.timeframe), ((i = e.scheduledReview) == null ? void 0 : i.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const t = {
    schemaVersion: Rs,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map(Zr),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!t.scheduledReview && !t.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return h({
    ...t,
    id: `replay-wake-plan:${R(t).slice(8)}`
  });
}
function Iu(e) {
  ci(e);
  const t = {
    schemaVersion: Er,
    id: Jr(e),
    replayEngineVersion: Ve,
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
    createdAtLogicalTime: e.manifest.startAsOf
  };
  return si({
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
function Jr(e) {
  return `replay-session:${R({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function dn(e) {
  var y, p;
  const { loaded: t, session: n, effectiveAsOf: i } = e, r = G(t);
  if (i < t.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const o = tt(t, i), a = h({ ...o.lifecycle, asOf: i }), s = [
    ...r.dataQualityNotes,
    ...o.dataQualityNotes,
    ...o.lifecycle.asOf != null && o.lifecycle.asOf < i ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${o.id} was carried forward from ${o.lifecycle.asOf}`
    }] : []
  ], c = Oa({
    symbol: t.manifest.symbol,
    source: t.manifest.source,
    decisionTime: i,
    effectiveAsOf: i,
    strategyProfile: t.strategyProfile,
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
  }), u = {}, l = {}, d = {};
  for (const g of t.sessionConfig.visibleTimeframes) {
    const w = eo(
      r.candlesByTimeframe[g] ?? [],
      i
    ).filter((b) => b.openTime >= r.displayStartByTimeframe[g]);
    u[g] = w, d[g] = w.at(-1) ?? null, l[g] = {
      timeframe: g,
      displayStart: r.displayStartByTimeframe[g],
      visibleStart: ((y = w[0]) == null ? void 0 : y.openTime) ?? null,
      visibleEnd: ((p = w.at(-1)) == null ? void 0 : p.closeTime) ?? null,
      completedCandleCount: w.length
    };
  }
  const f = await Ne({
    effectiveAsOf: i,
    analysisObservationId: o.id,
    visibleCandlesByTimeframe: u
  }), m = n.decisionRecords.map((g) => {
    var w;
    return {
      decisionRecordId: g.id,
      frameId: ((w = n.frames.find((b) => b.decisionSnapshot.id === g.snapshotId)) == null ? void 0 : w.id) ?? "",
      action: g.action,
      decisionTime: g.decisionTime
    };
  }), v = {
    schemaVersion: ws,
    sessionId: n.id,
    manifestId: t.manifest.id,
    radarEpisodeId: t.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: i,
    evaluationTimeframe: t.sessionConfig.evaluationTimeframe,
    radarContext: ml(t),
    decisionSnapshot: c,
    visibleCandlesByTimeframe: u,
    visibleCoverageByTimeframe: l,
    latestVisibleCandleByTimeframe: d,
    visibleDataFingerprint: f,
    lifecycleState: c.lifecycleState,
    lifecycleStateSince: c.lifecycleStateSince,
    pendingConditions: c.pendingConditions,
    priorDecisionSummary: m,
    activeWakeResult: e.wakeResult ?? null,
    dataQualityNotes: s,
    generatedAtLogicalTime: i
  };
  return h({
    ...v,
    id: `replay-frame:${R(v).slice(8)}`
  });
}
function ml(e) {
  const t = e.dataBundle.radarEpisode;
  return h({
    radarEpisodeId: t.id,
    triggeringDetectorIds: t.triggeringDetectorIds,
    triggeringObservations: t.triggeringObservations,
    selectionAnchor: t.selectionAnchor,
    pathContext: t.pathContext,
    hardGateResults: t.hardGateResults
  });
}
function tt(e, t) {
  const i = G(e).analysisStateHistory.filter(
    (r) => r.knownAt <= t
  ).at(-1);
  if (!i || i.id !== Ft(i))
    throw new Error(`No verified point-in-time analysis state is available at ${t}`);
  return i;
}
function eo(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (i.closeTime > t || i.knownAt > t) continue;
    const r = n.get(i.logicalCandleId);
    if (!r || r.knownAt < i.knownAt) n.set(i.logicalCandleId, i);
    else if (r.knownAt === i.knownAt && T(r) !== T(i))
      throw new Error(`Conflicting candle revisions for ${i.logicalCandleId}`);
  }
  return h(
    [...n.values()].sort(
      (i, r) => i.openTime - r.openTime || i.knownAt - r.knownAt
    )
  );
}
async function ku(e, t, n, i) {
  ci(e), Ht(t), co(t, e);
  const r = t.events.find((c) => c.command.id === n.id);
  if (r) {
    if (T(r.command) !== T(n))
      throw new Error(`Command id ${n.id} was reused with a different payload`);
    return { session: h(t), event: r, outcomeEnvelope: null, idempotent: !0 };
  }
  to(t, n);
  let o, a = null;
  if (n.type === "StartSession") {
    if (t.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await dn({
      loaded: e,
      session: t,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    o = Oe(n, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (t.state !== "Active" && n.type !== "RevealOutcome")
      throw new Error(`Command ${n.type} is not allowed while session is ${t.state}`);
    const c = fn(t);
    if (n.type === "Wait") {
      no(e, t, c, n.payload.wakePlan);
      const u = Qt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [n.payload.reason, ...n.payload.tags ?? []],
        nextCondition: wl(n.payload.wakePlan)
      }), l = await ro(
        e,
        t,
        c,
        n.payload.wakePlan
      ), d = h({
        ...t,
        decisionRecords: [...t.decisionRecords, u]
      }), f = await dn({
        loaded: e,
        session: d,
        requestedAsOf: l.requestedAsOf,
        effectiveAsOf: l.effectiveAsOf,
        wakeResult: l.wakeResult
      });
      o = Oe(n, l.state, f.effectiveAsOf, {
        frame: f,
        decisionRecord: u,
        wakePlan: n.payload.wakePlan,
        wakeResult: l.wakeResult,
        terminalReason: l.terminalReason
      });
    } else if (n.type === "Skip") {
      if (!n.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const u = Qt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [...n.payload.tags ?? [], ...n.payload.reasons.slice(1)],
        skipReason: n.payload.reasons[0]
      });
      o = Oe(n, "Skipped", c.effectiveAsOf, {
        decisionRecord: u
      });
    } else if (n.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const u = $s({
        ...n.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), l = yl(e, u), d = h({
        id: `replay-planning-attempt:${R({
          sessionId: t.id,
          frameId: c.id,
          tradePlan: u
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: u,
        accepted: l == null,
        rejectionReason: l
      }), f = l ? null : Qt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: u
      });
      o = Oe(
        n,
        l ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: d, decisionRecord: f }
      );
    } else if (n.type === "Abandon") {
      if (!n.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      o = Oe(n, "Abandoned", c.effectiveAsOf);
    } else {
      const u = await Cl(e, t, n, i);
      a = u.envelope, o = Oe(n, "Revealed", u.revealedAt, {
        terminalReason: t.terminalReason,
        revealedBeforeDecisionCompletion: u.early,
        outcomeEnvelopeId: u.envelope.id
      });
    }
  }
  const s = vl(t, o);
  return {
    session: ai(t, s),
    event: s,
    outcomeEnvelope: a,
    idempotent: !1
  };
}
function Oe(e, t, n, i = {}) {
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
function vl(e, t) {
  const n = {
    schemaVersion: wr,
    sequence: e.revision + 1,
    ...t
  };
  return h({
    ...n,
    id: `replay-event:${R(n).slice(8)}`
  });
}
function ai(e, t) {
  var n;
  if (t.schemaVersion !== wr)
    throw new Error("Replay event schema is invalid");
  if (t.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (t.id !== hl(t)) throw new Error("Replay event identity is invalid");
  if (t.command.sessionId !== e.id || t.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (t.frame) {
    const { id: i, ...r } = t.frame;
    if (t.frame.id !== `replay-frame:${R(r).slice(8)}` || t.frame.sessionId !== e.id || t.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    li(t.frame);
  }
  if (t.decisionRecord && t.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (t.wakePlan && t.wakePlan.id !== io(t.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (t.wakeResult) {
    const { id: i, ...r } = t.wakeResult;
    if (t.wakeResult.id !== `replay-wake-result:${R(r).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return pl(e, t), si({
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
function pl(e, t) {
  var l, d, f;
  const n = t.currentAsOfAfter === e.currentAsOf, i = t.frame == null, r = t.decisionRecord == null, o = t.planningAttempt == null, a = t.wakePlan == null && t.wakeResult == null, s = !t.revealedBeforeDecisionCompletionAfter && t.revealedOutcomeEnvelopeIdAfter == null;
  if (t.stateAfter === "Failed")
    throw new Error("Failed replay sessions cannot be synthesized from accepted commands");
  if (t.command.type === "StartSession") {
    if (e.state !== "Created" || t.stateAfter !== "Active" || !t.frame || t.currentAsOfAfter !== t.frame.effectiveAsOf || t.currentAsOfAfter !== e.createdAtLogicalTime || !r || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("StartSession event transition is invalid");
    return;
  }
  if (t.command.type === "Wait") {
    const m = t.stateAfter === "CaseWindowEnded";
    if (e.state !== "Active" || !t.frame || !t.decisionRecord || t.decisionRecord.action !== "Wait" || !t.wakePlan || !t.wakeResult || t.wakeResult.wakePlanId !== t.wakePlan.id || ((l = t.frame.activeWakeResult) == null ? void 0 : l.id) !== t.wakeResult.id || t.currentAsOfAfter !== t.frame.effectiveAsOf || !["Active", "CaseWindowEnded"].includes(t.stateAfter) || m !== (t.terminalReasonAfter != null) || !o || !s) throw new Error("Wait event transition is invalid");
    return;
  }
  if (t.command.type === "Skip") {
    if (e.state !== "Active" || t.stateAfter !== "Skipped" || !t.decisionRecord || t.decisionRecord.action !== "Skip" || !n || !i || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("Skip event transition is invalid");
    return;
  }
  if (t.command.type === "ProposeTrade") {
    const m = ((d = t.planningAttempt) == null ? void 0 : d.accepted) === !0, v = t.planningAttempt ? `replay-planning-attempt:${R({
      sessionId: e.id,
      frameId: t.planningAttempt.frameId,
      tradePlan: t.planningAttempt.tradePlan
    }).slice(8)}` : null;
    if (e.state !== "Active" || !t.planningAttempt || t.planningAttempt.id !== v || t.planningAttempt.frameId !== e.currentFrameId || t.planningAttempt.attemptedAt !== e.currentAsOf || t.stateAfter !== (m ? "TradePlanRecorded" : "Active") || (m ? ((f = t.decisionRecord) == null ? void 0 : f.action) !== "ProposeTrade" : t.decisionRecord != null) || !n || !i || !a || !s || t.terminalReasonAfter != null) throw new Error("ProposeTrade event transition is invalid");
    return;
  }
  if (t.command.type === "Abandon") {
    if (e.state !== "Active" || t.stateAfter !== "Abandoned" || !n || !i || !r || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("Abandon event transition is invalid");
    return;
  }
  const c = [
    "Skipped",
    "TradePlanRecorded",
    "CaseWindowEnded",
    "Abandoned"
  ].includes(e.state), u = e.state === "Active" && t.command.payload.abandonActive && t.revealedBeforeDecisionCompletionAfter;
  if (!c && !u || t.stateAfter !== "Revealed" || !n || !i || !r || !o || !a || t.revealedOutcomeEnvelopeIdAfter == null || t.terminalReasonAfter !== e.terminalReason) throw new Error("RevealOutcome event transition is invalid");
}
function hl(e) {
  const { id: t, ...n } = e;
  return `replay-event:${R(n).slice(8)}`;
}
function to(e, t) {
  if (t.schemaVersion !== br || !t.id.trim())
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
function fn(e) {
  const t = e.frames.find((n) => n.id === e.currentFrameId);
  if (!t || t.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return t;
}
function yl(e, t) {
  if (t.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (t.sizingResult.sizingModelVersion !== Sr)
    return "Sizing model version mismatch";
  if (t.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (t.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (t.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && T(t.venueRules) !== T(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const n = e.manifest.executionVenueEligibility.executionVenue;
  return n && t.venueRules.venue.toLowerCase() !== n.toLowerCase() ? "Trade plan venue does not match the manifest execution venue" : gl(e, t.createdAt, n) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function gl(e, t, n) {
  const i = G(e).venueEvidence.filter(
    (o) => o.knownAt <= t && o.effectiveFrom <= t && (o.effectiveTo == null || o.effectiveTo > t) && o.executionVenue.toLowerCase() === n.toLowerCase()
  ).at(-1);
  if (i) return i.status;
  const r = e.manifest.executionVenueEligibility;
  return r.effectiveFrom <= t && (r.effectiveTo == null || r.effectiveTo > t) ? r.status : "Unavailable";
}
function no(e, t, n, i) {
  var r;
  if (i.id !== io(i)) throw new Error("Wake plan identity is invalid");
  if (i.submittedFrameId !== n.id || i.createdAt !== n.effectiveAsOf)
    throw new Error("Wake plan must be frozen against the current frame");
  if (i.deadlineAsOf > n.effectiveAsOf + e.sessionConfig.maximumSingleWaitDuration || i.deadlineAsOf > e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration)
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  if (((r = i.scheduledReview) == null ? void 0 : r.mode) === "nextCompletedCandle" && !Object.hasOwn(
    G(e).candlesByTimeframe,
    i.scheduledReview.timeframe
  ))
    throw new RangeError(
      `Scheduled review timeframe ${i.scheduledReview.timeframe} is not loaded`
    );
  for (const o of Dt(i.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(o.type))
      throw new RangeError(`Wake condition ${o.type} is not allowed`);
    if (o.id !== Al(o))
      throw new Error(`Wake condition ${o.id} failed deterministic verification`);
  }
  if (El(n, i.conditions), bl(e, n, i.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (t.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function io(e) {
  const { id: t, ...n } = e;
  return `replay-wake-plan:${R(n).slice(8)}`;
}
function Al(e) {
  const { id: t, ...n } = e;
  return `replay-wake-condition:${R(n).slice(8)}`;
}
function El(e, t) {
  const n = or(e.decisionSnapshot);
  for (const i of Dt(t)) {
    if (i.type === "PriceCrossesKnownLevel") {
      const r = n.find((o) => o.id === i.referenceId);
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame reference ${i.referenceId}`);
      if (r.price !== i.frozenPrice)
        throw new Error("Frozen level price does not match the current DecisionFrame");
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = n.find(
        (o) => o.sourceObject.observationId === i.zoneObservationId
      );
      if (!r || r.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame zone ${i.zoneObservationId}`);
      if (r.rangeLow !== i.frozenLowerBound || r.rangeHigh !== i.frozenUpperBound)
        throw new Error("Frozen zone bounds do not match the current DecisionFrame");
    }
  }
}
function bl(e, t, n) {
  for (const i of Dt(n)) {
    if (i.type === "LifecycleStateEntered" && t.lifecycleState === i.state) return !0;
    if (i.type === "PriceCrossesKnownLevel") {
      const r = nt(e, i.timeframe, t.effectiveAsOf);
      if (r != null && (i.direction === "above" && r >= i.frozenPrice || i.direction === "below" && r <= i.frozenPrice)) return !0;
    }
    if (i.type === "PriceEntersKnownZone") {
      const r = nt(e, i.timeframe, t.effectiveAsOf);
      if (r != null && r >= i.frozenLowerBound && r <= i.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function Dt(e) {
  return e.flatMap(
    (t) => t.type === "AnyOf" ? [t, ...Dt(t.conditions)] : [t]
  );
}
function wl(e) {
  return T({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((t) => t.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function ro(e, t, n, i) {
  var P;
  const r = n.effectiveAsOf, o = G(e), a = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = Tl(e), c = Rl(e, r, i.scheduledReview), u = ((P = i.scheduledReview) == null ? void 0 : P.mode) === "elapsedDuration" ? r + i.scheduledReview.durationSeconds : c ?? i.deadlineAsOf, l = Math.min(i.deadlineAsOf, a, s);
  if (l < r) throw new Error("Historical coverage ends before the replay clock");
  const d = /* @__PURE__ */ new Set([l]);
  for (const E of o.analysisStateHistory)
    E.knownAt > r && E.knownAt <= l && d.add(E.knownAt);
  for (const E of o.knownEvents)
    E.knownAt > r && E.knownAt <= l && d.add(E.knownAt);
  for (const E of Object.values(o.candlesByTimeframe))
    for (const A of E) {
      const x = Math.max(A.closeTime, A.knownAt);
      x > r && x <= l && d.add(x);
    }
  c != null && c > r && c <= l && d.add(c), i.deadlineAsOf > r && i.deadlineAsOf <= l && d.add(i.deadlineAsOf), a > r && a <= l && d.add(a), s > r && s <= l && d.add(s);
  const f = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null
  }, m = [...d].sort((E, A) => E - A);
  let v = l, y = "DEADLINE_REACHED", p = [], g = [], w = null;
  for (const E of m) {
    f.evaluationPointsChecked.push(E);
    const A = Sl(e, E, r);
    f.lifecycleTransitionsEncountered.push(...A);
    const x = oo(e, i.conditions, r, E, f), I = Pl(e, E, r);
    if (I) {
      v = E, y = "CASE_BOUNDARY_REACHED", w = I, p = x.conditionIds, g = x.eventIds, x.conditionIds.length && (f.firstTriggeringEffectiveAsOf = E);
      break;
    }
    if (x.conditionIds.length) {
      v = E, y = "CONDITION_TRIGGERED", p = x.conditionIds, g = x.eventIds, f.firstTriggeringEffectiveAsOf = E;
      break;
    }
    if (c != null && E >= c) {
      v = E, y = "SCHEDULED_REVIEW";
      break;
    }
    if (E >= l) {
      v = l, l === a ? (y = "CASE_BOUNDARY_REACHED", w = "MAXIMUM_CASE_DURATION") : l === s ? (y = "CASE_BOUNDARY_REACHED", w = "DATA_COVERAGE_ENDED") : y = "DEADLINE_REACHED";
      break;
    }
  }
  const b = {
    schemaVersion: Ss,
    wakePlanId: i.id,
    startedAt: r,
    effectiveAsOf: v,
    reason: y,
    triggeredConditionIds: [...new Set(p)],
    triggeringEventIds: [...new Set(g)],
    auditTrace: f
  }, k = h({
    ...b,
    id: `replay-wake-result:${R(b).slice(8)}`
  });
  return {
    requestedAsOf: u,
    effectiveAsOf: v,
    state: w ? "CaseWindowEnded" : "Active",
    terminalReason: w,
    wakeResult: k
  };
}
function Rl(e, t, n) {
  if (!n) return null;
  if (n.mode === "nextCompletedCandle")
    return Li(e, n.timeframe, t);
  const i = L(e.sessionConfig.evaluationTimeframe), r = t + n.durationSeconds, o = Math.ceil(r / i) * i;
  return Li(e, e.sessionConfig.evaluationTimeframe, o - 1);
}
function Li(e, t, n) {
  return (G(e).candlesByTimeframe[t] ?? []).filter((i) => i.closeTime > n).map((i) => Math.max(i.closeTime, i.knownAt)).sort((i, r) => i - r)[0] ?? null;
}
function Tl(e) {
  const n = (G(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((i) => i.closeTime);
  return n.length ? Math.max(...n) : e.manifest.startAsOf;
}
function Sl(e, t, n) {
  var a;
  const i = G(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === t && s.knownAt > n
  ).map((s) => s.id), r = (a = mn(e, t)) == null ? void 0 : a.lifecycle.currentState, o = tt(e, t);
  return r !== o.lifecycle.currentState && i.push(o.id), [...new Set(i)];
}
function mn(e, t) {
  return G(e).analysisStateHistory.filter((n) => n.knownAt < t).at(-1) ?? null;
}
function oo(e, t, n, i, r) {
  const o = [], a = [];
  for (const s of t) {
    const c = xl(e, s, n, i, r);
    c.matched && (o.push(...c.conditionIds), a.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(o)], eventIds: [...new Set(a)] };
}
function xl(e, t, n, i, r) {
  var u, l;
  if (t.type === "AnyOf") {
    const d = oo(e, t.conditions, n, i, r), f = d.conditionIds.length > 0;
    return r.conditionEvaluations.push({
      conditionId: t.id,
      effectiveAsOf: i,
      matched: f,
      matchedEventIds: d.eventIds
    }), {
      matched: f,
      conditionIds: f ? [t.id, ...d.conditionIds] : [],
      eventIds: d.eventIds
    };
  }
  const o = G(e).knownEvents.filter(
    (d) => d.knownAt === i && d.knownAt > n
  );
  let a = [], s = !1;
  if (t.type === "NextLifecycleTransition")
    a = o.filter((d) => d.kind === "lifecycleTransition"), s = a.length > 0 || ((u = mn(e, i)) == null ? void 0 : u.lifecycle.currentState) !== tt(e, i).lifecycle.currentState;
  else if (t.type === "LifecycleStateEntered")
    a = o.filter(
      (d) => d.kind === "lifecycleTransition" && d.lifecycleState === t.state
    ), s = a.length > 0 || tt(e, i).lifecycle.currentState === t.state && ((l = mn(e, i)) == null ? void 0 : l.lifecycle.currentState) !== t.state;
  else if (t.type === "StructureEventConfirmed")
    a = o.filter(
      (d) => d.kind === "structure" && d.timeframe === t.timeframe && d.eventType === t.eventType && d.direction === t.direction
    ), s = a.length > 0;
  else if (t.type === "AvwapEventConfirmed")
    a = o.filter(
      (d) => d.kind === "avwap" && d.eventType === t.eventType && (t.avwapId == null || d.avwapId === t.avwapId)
    ), s = a.length > 0;
  else if (t.type === "RelativeStrengthEventConfirmed")
    a = o.filter(
      (d) => d.kind === "relativeStrength" && d.eventType === t.eventType && (t.timeframe == null || d.timeframe === t.timeframe)
    ), s = a.length > 0;
  else if (t.type === "RadarOrLifecycleTerminal")
    a = o.filter(
      (d) => d.kind === "radarTerminal" || d.kind === "lifecycleTerminal"
    ), s = a.length > 0;
  else if (t.type === "PriceCrossesKnownLevel") {
    const d = Di(e, t.timeframe, i), f = nt(e, t.timeframe, i);
    s = d != null && f != null && (t.direction === "above" ? d < t.frozenPrice && f >= t.frozenPrice : d > t.frozenPrice && f <= t.frozenPrice);
  } else if (t.type === "PriceEntersKnownZone") {
    const d = Di(e, t.timeframe, i), f = nt(e, t.timeframe, i), m = (v) => v >= t.frozenLowerBound && v <= t.frozenUpperBound;
    s = d != null && f != null && !m(d) && m(f);
  }
  const c = a.map((d) => d.id);
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
function Pl(e, t, n) {
  const i = G(e).knownEvents.filter(
    (r) => r.knownAt === t && r.knownAt > n
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && i.some((r) => r.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (i.some((r) => r.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(tt(e, t).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function nt(e, t, n) {
  var i;
  return ((i = eo(
    G(e).candlesByTimeframe[t] ?? [],
    n
  ).at(-1)) == null ? void 0 : i.c) ?? null;
}
function Di(e, t, n) {
  const r = (G(e).candlesByTimeframe[t] ?? []).map((o) => Math.max(o.closeTime, o.knownAt)).filter((o) => o < n);
  return r.length ? nt(e, t, Math.max(...r)) : null;
}
async function Cl(e, t, n, i) {
  if (!i) throw new Error("Outcome reveal requires a separate ReplayOutcomeStore");
  const r = ["Skipped", "TradePlanRecorded", "CaseWindowEnded", "Abandoned"].includes(
    t.state
  ), o = t.state === "Active";
  if (o && (!n.payload.abandonActive || !e.sessionConfig.allowEarlyReveal))
    throw new Error("Active replay reveal requires configured explicit abandon-and-reveal");
  if (!r && !o) throw new Error(`Outcome cannot be revealed from ${t.state}`);
  const a = t.currentAsOf ?? e.manifest.startAsOf, s = await i.revealCaseOutcome({
    sessionId: t.id,
    manifestId: t.manifestId,
    revealedAt: a,
    revealedBeforeDecisionCompletion: o
  });
  return Il(t, s, o), { envelope: s, early: o, revealedAt: a };
}
function Il(e, t, n) {
  const { id: i, ...r } = t;
  if (t.schemaVersion !== Hn || t.id !== `replay-outcome:${R(r).slice(8)}` || t.sessionId !== e.id || t.manifestId !== e.manifestId || t.revealedBeforeDecisionCompletion !== n)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function Ou(e) {
  Ht(e), lo(e);
  for (const t of e.frames) li(t);
  return T(e);
}
function kl(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized replay session must be an object");
  const n = t;
  Ht(n), lo(n);
  for (const i of n.frames) li(i);
  return h(n);
}
async function Nu(e, t) {
  const n = kl(e);
  ci(t), co(n, t);
  const i = Ol(n);
  if (T(i) !== T(n))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (n.currentAsOf != null && n.currentFrameId != null) {
    const r = fn(n), o = n.events.findIndex((l) => {
      var d;
      return ((d = l.frame) == null ? void 0 : d.id) === r.id;
    });
    if (o < 0) throw new Error("Current replay frame is absent from the event log");
    let a = ao(so(n));
    for (const l of n.events.slice(0, o))
      a = ai(a, l);
    const s = n.events[o];
    let c = r.activeWakeResult;
    if (s.command.type === "Wait") {
      const l = fn(a);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      no(
        t,
        a,
        l,
        s.wakePlan
      );
      const d = await ro(
        t,
        a,
        l,
        s.wakePlan
      );
      if (T(d.wakeResult) !== T(s.wakeResult) || d.requestedAsOf !== r.requestedAsOf || d.effectiveAsOf !== r.effectiveAsOf || d.state !== s.stateAfter || d.terminalReason !== s.terminalReasonAfter)
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      c = d.wakeResult;
    }
    if (s.decisionRecord && (a = h({
      ...a,
      decisionRecords: [...a.decisionRecords, s.decisionRecord]
    })), (await dn({
      loaded: t,
      session: a,
      requestedAsOf: r.requestedAsOf,
      effectiveAsOf: r.effectiveAsOf,
      wakeResult: c
    })).id !== r.id)
      throw new Error("Replay resume data does not reproduce the current DecisionFrame");
  }
  return n;
}
function Ol(e) {
  let t = ao(so(e));
  const n = /* @__PURE__ */ new Set();
  for (const i of e.events) {
    if (n.has(i.command.id)) throw new Error("Replay event log repeats a command id");
    n.add(i.command.id), to(t, i.command), t = ai(t, i);
  }
  return t;
}
function ao(e) {
  return si({
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
function so(e) {
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
    createdAtLogicalTime: e.createdAtLogicalTime
  });
}
function si(e) {
  const { integrityHash: t, ...n } = e;
  return h({ ...n, integrityHash: R(n) });
}
function Ht(e) {
  if (e.schemaVersion !== Er || e.replayEngineVersion !== Ve) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: t, ...n } = e;
  if (t !== R(n)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function ci(e) {
  if ($n(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || e.sessionConfig.replayEngineVersion !== Ve || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function co(e, t) {
  if (e.id !== Jr(t) || e.manifestId !== t.manifest.id || e.radarEpisodeId !== t.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== t.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== t.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== t.strategyProfile.profileHash || e.lifecycleVersion !== t.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== t.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== t.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== t.dataBundle.causalPrefixFingerprint || T(e.venueRulesRef) !== T(t.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function li(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const t of Object.values(e.visibleCandlesByTimeframe))
    if (t.some((n) => n.closeTime > e.effectiveAsOf || n.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  Nl(e, e.effectiveAsOf);
}
function Nl(e, t) {
  const n = (i) => {
    if (!(!i || typeof i != "object")) {
      if (Array.isArray(i)) {
        i.forEach(n);
        return;
      }
      for (const [r, o] of Object.entries(i)) {
        if (r === "knownAt" && typeof o == "number" && o > t)
          throw new Error("Replay frame contains evidence not known at its cutoff");
        n(o);
      }
    }
  };
  n(e);
}
function lo(e) {
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
      for (const [r, o] of Object.entries(i)) {
        if (t.has(r)) throw new Error(`Public replay session contains forbidden key ${r}`);
        n(o);
      }
    }
  };
  n(e);
}
function Zt(e) {
  return Number.isFinite(e) && e > 0;
}
function Hi(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
export {
  Xl as CANDLE_TIMESTAMP_SEMANTICS,
  Bs as DECISION_RECORD_SCHEMA_VERSION,
  ir as DECISION_SNAPSHOT_SCHEMA_VERSION,
  ka as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  Wn as EXECUTION_CANDLE_SCHEMA_VERSION,
  ec as EXECUTION_DATA_BUNDLE_SCHEMA_VERSION,
  at as EXECUTION_ENGINE_VERSION,
  Or as EXECUTION_EVENT_SCHEMA_VERSION,
  Zs as EXECUTION_FILL_SCHEMA_VERSION,
  Ci as EXECUTION_JSON_DATA_SCHEMA_VERSION,
  Ys as EXECUTION_ORDER_SCHEMA_VERSION,
  tc as EXECUTION_PATH_RESOLUTION_SCHEMA_VERSION,
  Ir as EXECUTION_PROFILE_SCHEMA_VERSION,
  _r as EXECUTION_QUOTE_SCHEMA_VERSION,
  Js as EXECUTION_RESULT_SCHEMA_VERSION,
  bc as EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION,
  kr as EXECUTION_SESSION_SCHEMA_VERSION,
  Nr as EXECUTION_TRADE_SCHEMA_VERSION,
  Cn as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  au as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  Fr as FUNDING_OBSERVATION_SCHEMA_VERSION,
  ze as IMPULSE_FADE_CANDIDATE_GATE,
  xo as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  te as IMPULSE_FADE_LIFECYCLE_VERSION,
  xa as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  Pa as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  ve as IMPULSE_FADE_SETUP_FAMILY,
  rc as InMemoryReplayExecutionDataAdapter,
  lu as InMemoryReplayHistoricalDataAdapter,
  xu as InMemoryReplayOutcomeStore,
  Eu as JsonReplayExecutionDataAdapter,
  Su as JsonReplayHistoricalDataAdapter,
  ic as POSITION_LEDGER_SCHEMA_VERSION,
  xn as RADAR_EPISODE_SCHEMA_VERSION,
  Pn as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  Va as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  ar as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  Ba as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  $a as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  In as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  Vn as REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  sr as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  br as REPLAY_COMMAND_SCHEMA_VERSION,
  xs as REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
  ws as REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  Ve as REPLAY_ENGINE_VERSION,
  wr as REPLAY_EVENT_SCHEMA_VERSION,
  Oi as REPLAY_JSON_DATA_SCHEMA_VERSION,
  Bn as REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  Hn as REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  Dn as REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  Er as REPLAY_SESSION_SCHEMA_VERSION,
  Ts as REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  Rs as REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  Ss as REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  Sr as SIZING_MODEL_VERSION,
  Vs as SIZING_RESULT_SCHEMA_VERSION,
  Sa as STRATEGY_PROFILE_SCHEMA_VERSION,
  xr as TRADE_PLAN_SCHEMA_VERSION,
  Gn as VENUE_EXECUTION_RULES_SCHEMA_VERSION,
  nc as VENUE_FEE_SCHEDULE_SCHEMA_VERSION,
  wc as advanceExecutionTo,
  Vl as appendSyntheticCandle,
  ku as applyReplayCommand,
  _e as bucketStart,
  Pr as calculateLinearPerpetualSizing,
  Ae as candleCloseTime,
  we as candleRevisionKnownAt,
  mi as candleToBytes,
  ho as candlesToBytes,
  R as canonicalHash,
  cu as canonicalRadarJson,
  T as canonicalSerialize,
  Yi as computeAnchoredVwapLine,
  Zl as computeAnchoredVwapSignals,
  Yl as computeAnchoredVwapSnapshot,
  Wl as computeAtrLine,
  Ul as computeBollingerBands,
  Ll as computeCloseChangePct,
  $l as computeEmaLine,
  yn as computeExtensionSnapshot,
  jl as computeMacd,
  je as computeMarketStructure,
  qo as computeRelativeCumulativeReturnLine,
  tu as computeRelativeStrengthDivergences,
  zl as computeRsiLine,
  Po as computeSetupState,
  Bl as computeSmaLine,
  Ql as computeStochRsi,
  Jl as computeStructureActiveLevels,
  eu as computeSupportResistanceZones,
  $o as computeSupportResistanceZonesFromSwings,
  Bo as computeSwingPoints,
  Dl as computeViewBounds,
  ql as computeWmaLine,
  Qt as createDecisionRecord,
  iu as createDecisionReferenceLevel,
  Oa as createDecisionSnapshot,
  uu as createDefaultReplaySessionConfig,
  nn as createDurableObjectReference,
  Xn as createExecutionCandleObservation,
  oc as createExecutionProfile,
  Hr as createExecutionQuoteObservation,
  Yn as createExecutionSession,
  Dr as createExecutionTradeObservation,
  Ua as createExecutionVenueEligibilityObservation,
  pu as createExperimentalExecutionProfile,
  Vr as createFundingObservation,
  Ia as createImpulseFadeResearchProfile,
  qa as createRadarSelectionProfile,
  ru as createRadarStructureObservation,
  du as createReplayAnalysisStateObservation,
  Cs as createReplayCandleRecord,
  Pu as createReplayCommand,
  fu as createReplayKnownEvent,
  Iu as createReplaySession,
  Ps as createReplaySessionConfig,
  Zr as createReplayWakeCondition,
  Cu as createReplayWakePlan,
  yu as createResearchVenueExecutionRules,
  rr as createStrategyProfile,
  $s as createTradePlan,
  ou as createUniverseMembershipObservation,
  ac as createVenueExecutionRules,
  hu as createVenueFeeSchedule,
  Ca as decisionReferenceObservationId,
  Sn as decisionSnapshotId,
  or as decisionSnapshotReferenceLevels,
  Tu as deserializeExecutionSession,
  kl as deserializeReplaySession,
  Kl as evaluateImpulseFadeSnapshot,
  Gl as evaluateImpulseFadeTimeline,
  qs as evaluateTradePlanCompliance,
  gu as executionCandleFromReplay,
  Mr as executionProfileHash,
  Nt as executionVenueEligibilityObservationId,
  Lr as feeScheduleHash,
  Rc as finalizeExecutionAtHorizon,
  h as immutableJsonClone,
  De as impulseFadeLifecycleConfigHash,
  vn as isStrictTimeframe,
  nu as lineToBytes,
  Au as loadExecutionCase,
  mu as loadReplayCase,
  Hl as makeSyntheticCandles,
  yo as mergeLiveCandle,
  Bi as normalizeOhlcvPoint,
  Fl as normalizeRestTimeframe,
  $i as packHistoricalCandles,
  vc as parseExecutionJsonHistoricalDataFixture,
  nl as parseReplayJsonHistoricalDataFixture,
  Ml as prependHistoricalCandles,
  On as radarEpisodeObservationId,
  kn as radarSelectionProfileHash,
  cr as radarStructureObservationId,
  Jc as reconstructExecutionSessionFromEvents,
  Ol as reconstructReplaySession,
  Ft as replayAnalysisStateObservationId,
  qn as replayCandleLogicalId,
  Un as replayCandleObservationId,
  dr as replayCaseManifestId,
  vu as replayDataFingerprintAt,
  zn as replayKnownEventId,
  $n as replaySessionConfigHash,
  Ne as replaySha256,
  Nu as resumeReplaySession,
  bu as revealExecutionOutcome,
  su as scanRadarEpisodes,
  pn as selectCompletedCandleRevisionsAt,
  Ru as serializeExecutionSession,
  Ou as serializeReplaySession,
  wu as simulateExecutionToHorizon,
  ot as strategyProfileHash,
  L as strictTimeframeToSeconds,
  Pt as timeframeToSeconds,
  jn as tradePlanId,
  Ot as universeMembershipObservationId,
  oi as validateExecutionSessionIntegrity,
  Kn as venueExecutionRulesHash
};
