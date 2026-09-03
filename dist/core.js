var vn = (e) => {
  throw TypeError(e);
};
var ut = (e, t, n) => t.has(e) || vn("Cannot " + n);
var L = (e, t, n) => (ut(e, t, "read from private field"), n ? n.call(e) : t.get(e)), pe = (e, t, n) => t.has(e) ? vn("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), Ue = (e, t, n, r) => (ut(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n), oe = (e, t, n) => (ut(e, t, "access private method"), n);
function T(e) {
  const t = /* @__PURE__ */ new Set();
  function n(i, o = !1) {
    if (i === null) return "null";
    if (typeof i == "string" || typeof i == "boolean")
      return JSON.stringify(i);
    if (typeof i == "number") {
      if (!Number.isFinite(i))
        throw new TypeError("Canonical JSON does not support non-finite numbers");
      return Object.is(i, -0) ? "0" : JSON.stringify(i);
    }
    if (i === void 0) return o ? "null" : void 0;
    if (typeof i != "object")
      throw new TypeError(`Canonical JSON does not support ${typeof i}`);
    if (Object.getPrototypeOf(i) !== Object.prototype && !Array.isArray(i))
      throw new TypeError("Canonical JSON requires plain objects and arrays");
    if (t.has(i)) throw new TypeError("Canonical JSON does not support cycles");
    t.add(i);
    let a;
    return Array.isArray(i) ? a = `[${i.map((s) => n(s, !0) ?? "null").join(",")}]` : a = `{${Object.keys(i).sort().flatMap((c) => {
      const u = n(i[c]);
      return u == null ? [] : [`${JSON.stringify(c)}:${u}`];
    }).join(",")}}`, t.delete(i), a;
  }
  const r = n(e);
  if (r == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return r;
}
function C(e) {
  const t = new TextEncoder().encode(T(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function b(e) {
  return Bn(JSON.parse(T(e)));
}
function Bn(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) Bn(t);
    Object.freeze(e);
  }
  return e;
}
const hn = 5;
function Je(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function Ot(e) {
  if (!/^[1-9]\d*[mhd]$/.test(e)) return !1;
  const t = Number.parseInt(e, 10), n = e.endsWith("m") ? 60 : e.endsWith("h") ? 3600 : 86400;
  return Number.isSafeInteger(t) && Number.isSafeInteger(t * n);
}
function V(e) {
  if (!Ot(e))
    throw new RangeError(`Invalid radar/replay timeframe ${e}`);
  return Je(e);
}
function de(e, t) {
  return e.knownAt ?? e.bucket + V(t);
}
function Nt(e, t, n) {
  const r = V(t), i = /* @__PURE__ */ new Map(), o = e.filter((a) => {
    if (!Number.isFinite(a.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (a.bucket + r > n) return !1;
    if (a.knownAt != null && !Number.isFinite(a.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${a.bucket}`);
    return de(a, t) <= n;
  });
  for (const a of [...o].sort(
    (s, c) => s.bucket - c.bucket || s.ts - c.ts
  )) {
    if (!ri(a) || a.bucket % r !== 0 || Math.floor(a.ts / r) * r !== a.bucket)
      throw new RangeError(`Invalid candle for bucket ${a.bucket}`);
    const s = de(a, t);
    if (s < a.bucket + r)
      throw new RangeError(`Candle revision predates close for bucket ${a.bucket}`);
    const c = i.get(a.bucket);
    if (c) {
      const u = de(c, t);
      if (u === s && wn(c, t) !== wn(a, t))
        throw new Error(`Conflicting candle revisions for bucket ${a.bucket} at ${s}`);
      if (u > s) continue;
    }
    i.set(a.bucket, a);
  }
  return [...i.values()].sort((a, s) => a.bucket - s.bucket);
}
function ls(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ge(e, t) {
  return Math.floor(e / t) * t;
}
function Hn(e) {
  const t = qn(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = pn(n.ts), i = J(n.o), o = J(n.h), a = J(n.l), s = J(n.c), c = n.knownAt == null ? void 0 : pn(n.knownAt);
  return r == null || i == null || o == null || a == null || s == null || n.knownAt != null && c == null ? null : {
    ts: r,
    o: i,
    h: o,
    l: a,
    c: s,
    v_base: J(n.v_base),
    v_quote: J(n.v_quote),
    ver: J(n.ver),
    knownAt: c ?? void 0
  };
}
function Vn(e, t, n) {
  const r = Je(t), i = Xr(
    e.map((s, c) => $n(s, c)).filter((s) => s != null),
    r
  ).slice(-Math.max(1, n));
  if (!i.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const o = ge(i[0].ts, r), a = i.map((s) => {
    const c = ge(s.ts, r);
    return {
      ...s,
      bucket: c,
      x: (c - o) / r
    };
  });
  return _t({
    timeframeSec: r,
    firstBucket: o,
    candles: a,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function us(e, t, n) {
  const r = e.candles.length, i = t.map((a, s) => $n(a, s)).filter((a) => a != null).filter((a) => ge(a.ts, e.timeframeSec) < e.firstBucket).sort(Un);
  if (!i.length) return 0;
  const o = Vn(
    [...i, ...e.candles],
    n,
    i.length + e.candles.length
  );
  return e.timeframeSec = o.timeframeSec, e.firstBucket = o.firstBucket, e.candles = o.candles, e.positionByBucket = o.positionByBucket, Math.max(0, e.candles.length - r);
}
function Qr(e) {
  const t = new Float32Array(e.length * hn);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * hn);
  }), new Uint8Array(t.buffer);
}
function yn(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function fs(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function Kr(e, t, n, r = 3) {
  const i = Hn(t);
  if (!i) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const o = ge(i.ts, e.timeframeSec);
  if (o < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const a = e.positionByBucket.get(o), s = (o - e.firstBucket) / e.timeframeSec, c = { ...i, bucket: o, x: s };
  if (a != null)
    return ni(c, e.candles[a]) ? { kind: "ignore", reason: "stale-version" } : ti(e.candles[a], c) ? (e.candles[a] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[a] = c, {
      kind: "replace",
      position: a,
      bytes: yn(c)
    });
  const u = e.candles[e.candles.length - 1];
  return o <= u.bucket ? { kind: "ignore", reason: "stale-gap" } : (o - u.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Yr(e), { kind: "reset", bytes: Qr(e.candles) }) : (_t(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: yn(c)
  }));
}
function ds(e, t = []) {
  if (!e.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let n = 1 / 0, r = -1 / 0;
  for (const a of e)
    n = Math.min(n, a.l), r = Math.max(r, a.h);
  for (const a of t)
    for (let s = 1; s < a.length; s += 2) {
      const c = a[s];
      Number.isFinite(c) && (n = Math.min(n, c), r = Math.max(r, c));
    }
  const o = Math.max(1e-9, r - n) * 0.08;
  return {
    minX: e[0].x,
    maxX: e[e.length - 1].x,
    minY: n - o,
    maxY: r + o
  };
}
function ms(e, t, n) {
  const r = Je(n), i = Math.floor(Date.now() / 1e3), o = ge(i, r), a = e.split("").reduce((u, l) => u + l.charCodeAt(0), 0), s = [];
  let c = 40 + a % 160;
  for (let u = Math.max(1, t) - 1; u >= 0; u--) {
    const l = o - u * r, f = Math.sin((t - u + a) / 9) * 0.8, d = c, m = Math.max(1e-4, d + f + Math.cos((t - u) / 13) * 0.35), v = Math.max(d, m) + 0.35 + Math.abs(Math.sin(u + a)) * 0.5, g = Math.min(d, m) - 0.35 - Math.abs(Math.cos(u + a)) * 0.5, h = 50 + a % 90 + Math.abs(Math.sin((t - u + a) / 5)) * 180;
    s.push({ ts: l, o: d, h: v, l: g, c: m, v_base: h, v_quote: h * m }), c = m;
  }
  return Vn(s, n, t);
}
function vs(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, i = Math.sin(r / 600) * 0.7, o = n.c, a = Math.max(1e-4, o + i), s = Math.max(o, a) + 0.5, c = Math.min(o, a) - 0.5, u = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(i) * 0.36));
  return Kr(e, { ts: r, o, h: s, l: c, c: a, v_base: u, v_quote: u * a }, t);
}
function Yr(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  _t(e);
}
function _t(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function $n(e, t) {
  const n = Hn(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function Xr(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const i = ge(r.ts, t), o = n.get(i);
    (!o || Un(r, o) > 0) && n.set(i, r);
  }
  return Array.from(n.entries()).sort(([r], [i]) => r - i).map(([, r]) => Zr(r));
}
function Un(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function Zr(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function pn(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? Jr(e) : ei(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function Jr(e) {
  const [
    t,
    n = 1,
    r = 0,
    i = 0,
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
    Number(r) - Number(s),
    Number(i) - Number(c),
    Number(o) - Number(u),
    l
  );
}
function ei(e) {
  const [t, n = 1, r = 1, i = 0, o = 0, a = 0, s = 0] = e;
  return Date.UTC(
    Number(t),
    Number(n) - 1,
    Number(r),
    Number(i),
    Number(o),
    Number(a),
    Number(s)
  );
}
function ti(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function ni(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function J(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function ri(e) {
  return Number.isFinite(e.bucket) && Number.isFinite(e.ts) && qe(e.o) && qe(e.h) && qe(e.l) && qe(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h) && je(e.v_base) && je(e.v_quote) && je(e.ver) && je(e.knownAt);
}
function wn(e, t) {
  return T({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: J(e.v_base) ?? null,
    vQuote: J(e.v_quote) ?? null,
    ver: J(e.ver) ?? null,
    knownAt: de(e, t)
  });
}
function qe(e) {
  return Number.isFinite(e) && e > 0;
}
function je(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function qn(e) {
  if (typeof e == "string")
    try {
      return qn(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
const se = "impulse_fade_v1", X = "impulse_fade_v1.lifecycle.1", ii = "impulse_fade_v1.lifecycle-config.1", Ie = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function hs(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((i, o) => {
    r += i.c, o >= t && (r -= e[o - t].c), o >= t - 1 && n.push(i.x, r / t);
  }), new Float32Array(n);
}
function ys(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = 2 / (t + 1);
  let i = 0;
  for (let o = 0; o < t; o++)
    i += e[o].c;
  i /= t, n.push(e[t - 1].x, i);
  for (let o = t; o < e.length; o++)
    i = (e[o].c - i) * r + i, n.push(e[o].x, i);
  return new Float32Array(n);
}
function ps(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [], r = t * (t + 1) / 2;
  for (let i = t - 1; i < e.length; i++) {
    let o = 0;
    for (let a = 0; a < t; a++)
      o += e[i - t + 1 + a].c * (a + 1);
    n.push(e[i].x, o / r);
  }
  return new Float32Array(n);
}
function ws(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const r = [], i = [], o = [];
  let a = 0, s = 0;
  return e.forEach((c, u) => {
    if (a += c.c, s += c.c * c.c, u >= t) {
      const l = e[u - t].c;
      a -= l, s -= l * l;
    }
    if (u >= t - 1) {
      const l = a / t, f = Math.max(0, s / t - l * l), d = Math.sqrt(f) * n;
      r.push(c.x, l), i.push(c.x, l + d), o.push(c.x, l - d);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(i),
    lower: new Float32Array(o)
  };
}
function gs(e, t = 14) {
  return me(tr(e, t));
}
function bs(e, t = 14, n = 14, r = 3, i = 3) {
  const o = tr(e, t), a = ve(n);
  if (o.length < a)
    return { k: new Float32Array(), d: new Float32Array() };
  const s = [];
  for (let l = a - 1; l < o.length; l++) {
    let f = 1 / 0, d = -1 / 0;
    for (let g = 0; g < a; g++) {
      const h = o[l - g].value;
      f = Math.min(f, h), d = Math.max(d, h);
    }
    const m = d - f, v = m > 0 ? (o[l].value - f) / m * 100 : 50;
    s.push({ x: o[l].x, value: v });
  }
  const c = Sn(s, ve(r)), u = Sn(c, ve(i));
  return {
    k: me(c),
    d: me(u)
  };
}
function As(e, t = 12, n = 26, r = 9) {
  const i = At(e, t), o = At(e, n), a = [];
  for (let l = 0; l < e.length; l++) {
    const f = i[l], d = o[l];
    f == null || d == null || a.push({ x: e[l].x, value: f - d });
  }
  const s = no(a, r), c = new Map(a.map((l) => [l.x, l.value])), u = s.map((l) => ({
    x: l.x,
    value: (c.get(l.x) ?? l.value) - l.value
  }));
  return {
    macd: me(a),
    signal: me(s),
    histogram: me(u)
  };
}
function Es(e, t = 14) {
  const n = nt(e, t), r = [];
  return n.forEach((i, o) => {
    i != null && r.push({ x: e[o].x, value: i });
  }), me(r);
}
function Ft(e, t = {}) {
  const n = N(t.windowSeconds, 60, 2592e3, 86400), r = N(t.historyDays, 1, 365, 180), i = N(t.minSamples, 1, 5e3, 20), o = N(t.emaPeriod, 2, 500, 20), a = N(t.atrPeriod, 2, 500, 14), s = Jn(e);
  if (!s)
    return Di(n);
  const c = e.indexOf(s), u = er(e, s.bucket - n, c), l = u && U(u.c) ? (s.c / u.c - 1) * 100 : null, f = l == null ? [] : Bi(e, {
    windowSeconds: n,
    earliestBucket: s.bucket - r * 86400,
    excludeBucket: s.bucket
  }), d = l != null && f.length >= i ? Hi(f, l) : null, m = l != null && f.length >= i ? Vi(f, l) : null, v = At(e, o)[c] ?? null, g = nt(e, a)[c] ?? null, h = v != null && g != null && Number.isFinite(v) && Number.isFinite(g) && g > 0 ? (s.c - v) / g : null;
  return {
    candle: s,
    referenceCandle: u,
    windowSeconds: n,
    returnPct: l,
    percentile: d,
    zScore: m,
    rollingReturnCount: f.length,
    ema: v,
    atr: g,
    atrExtension: h
  };
}
function oi(e = {}) {
  var q, z, x;
  const t = e.executionTimeframe ?? "chart", n = A(e.asOf), r = A(e.latestTs) ?? Si(e.candles ?? [], t) ?? A((q = e.structure) == null ? void 0 : q.updatedTs) ?? A((z = e.marketStructure) == null ? void 0 : z.summary.updatedTs) ?? null, i = n ?? r, o = i == null ? null : Ht(e.candles ?? [], i, t), a = (o == null ? void 0 : o.candle.c) ?? A(e.latestPrice), s = ai(e.marketStructure ?? null, n), c = (s == null ? void 0 : s.summary) ?? si(e.structure, n), u = e.htfStructures ?? [], l = n == null ? e.htfStructures ?? [] : Lt(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (F) => n == null || D(F) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (F) => n == null || D(F) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (F) => n == null || D(F) <= n
  ), v = H(e.resistanceNearPct, 0, 10, 1.5), g = H(e.retestNearPct, 0, 10, 0.8), h = Ii(e.extension ?? null), y = xi(f, a, v), S = Pi(d), I = Oi(c), _ = Ni(
    m,
    e.avwapDistancePct
  ), P = _i(c, f, a, g), w = Fi(h, y, c, a), p = [
    h,
    y,
    S,
    I,
    _,
    P
  ], E = {
    checks: p,
    asOf: i,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? Ee({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, k = pi({
    extension: h,
    htfResistance: y,
    htfStructures: l,
    rsWeakness: S,
    structureShift: I,
    avwapFailure: _,
    retest: P,
    invalidated: w
  });
  return (x = e.candles) != null && x.length && i != null ? ui({
    ...e,
    asOf: i,
    latestPrice: a,
    marketStructure: s,
    structure: c,
    htfStructures: u,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: m,
    checks: p,
    executionTimeframe: t
  }) : Kn({
    ...E,
    state: k,
    reason: Li(k, p),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function ai(e, t) {
  var o;
  if (!e || t == null) return e;
  const n = e.swings.filter((a) => a.knownAt <= t), r = e.breaks.filter((a) => a.knownAt <= t), i = ((o = ce(r)) == null ? void 0 : o.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: i,
    summary: $t(n, r, i)
  };
}
function si(e, t) {
  if (!e || t == null) return e ?? null;
  const n = A(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function Rs(e) {
  return ci(e).records;
}
function Ee(e = {}) {
  var t, n, r, i, o, a, s, c, u, l, f;
  return C({
    lifecycleVersion: X,
    lifecycleConfigVersion: ii,
    candidateGate: Ie,
    extension: {
      windowSeconds: N(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: N((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: N((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: N((i = e.extensionOptions) == null ? void 0 : i.emaPeriod, 2, 500, 20),
      atrPeriod: N((o = e.extensionOptions) == null ? void 0 : o.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: N(
        (a = e.marketStructureOptions) == null ? void 0 : a.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: N(
        (s = e.marketStructureOptions) == null ? void 0 : s.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: N((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: H((u = e.marketStructureOptions) == null ? void 0 : u.minMoveAtr, 0, 10, 0.75),
      maxSwings: N((l = e.marketStructureOptions) == null ? void 0 : l.maxSwings, 1, 500, 120),
      maxBreaks: N((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: H(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: H(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: H(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: H(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: H(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: N(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Ss(e) {
  var s;
  const t = Wn(e), n = ce(t);
  if (n == null) return null;
  const r = zn(e, n), i = /* @__PURE__ */ new Map(), o = e.candlesByTimeframe[e.executionTimeframe] ?? [], a = new Set(
    o.map((c) => ue(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && D(c) <= n && a.add(D(c));
  for (const c of [...a].sort((u, l) => u - l))
    Mt(
      et(o, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (s = e.config) == null ? void 0 : s.marketStructureOptions,
      c,
      i
    );
  return jn(
    e,
    n,
    i,
    r
  );
}
function ci(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, i = Ee(r), o = Wn(e), a = zn(
    e,
    ce(o) ?? 0
  ), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), l = A(e.from) ?? -1 / 0;
  let f = null;
  return { records: o.map((m) => {
    var I, _, P, w, p;
    const v = jn(
      e,
      m,
      s,
      a
    ), g = Gn(e.candidateMetrics, m), h = (g == null ? void 0 : g.metrics) ?? Bt(
      Ft(
        et(n, t, m),
        r.extensionOptions
      )
    );
    f = v;
    const y = v.evidence.filter((E) => c.has(E.id) ? !1 : (c.add(E.id), E.knownAt >= l)), S = v.transitions.filter((E) => {
      const k = li(E);
      return u.has(k) ? !1 : (u.add(k), E.knownAt >= l);
    });
    return {
      asOf: m,
      setupFamily: se,
      lifecycleVersion: X,
      lifecycleConfigHash: i,
      candidateGatePassed: Me(h),
      candidateId: ((I = v.candidate) == null ? void 0 : I.id) ?? null,
      candidateDetectedAt: ((_ = v.candidate) == null ? void 0 : _.detectedAt) ?? null,
      initialMtfContext: ((P = v.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: v.currentState,
      stateSince: v.stateSince,
      transition: ce(S) ?? null,
      transitions: S,
      evidenceAdded: y,
      pendingConditions: v.pendingConditions,
      confluence: v.confluence,
      episodeHigh: ((w = v.candidate) == null ? void 0 : w.episodeHigh) ?? null,
      episodeHighTime: ((p = v.candidate) == null ? void 0 : p.episodeHighTime) ?? null,
      activeBreakLevel: v.activeBreakLevel,
      retestLevel: v.retestLevel,
      terminalReason: v.invalidationReason ?? v.expiryReason,
      dataQualityNotes: v.dataQuality
    };
  }), latestSnapshot: f };
}
function jn(e, t, n, r) {
  const i = e.executionTimeframe, o = e.candlesByTimeframe[i] ?? [], a = e.config ?? {}, s = Ee(a), c = et(o, i, t), u = Ft(c, a.extensionOptions), l = Gn(e.candidateMetrics, t), f = (l == null ? void 0 : l.metrics) ?? Bt(u), d = Mt(
    c,
    i,
    e.structureEvents ?? [],
    a.marketStructureOptions,
    t,
    n
  ), m = r.filter(
    (g) => (g.summary.updatedTs ?? 0) <= t
  ), v = ce(c) ?? null;
  return oi({
    candles: o,
    symbol: e.symbol,
    source: e.source,
    venue: e.venue,
    executionTimeframe: i,
    asOf: t,
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
function zn(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const i = new Set(
      r.map((o) => ue(o, n)).filter((o) => o <= t)
    );
    for (const o of e.structureEvents ?? [])
      o.sourceTimeframe === n && D(o) <= t && i.add(D(o));
    return [...i].sort((o, a) => o - a).map((o) => {
      var s;
      const a = Mt(
        et(r, n, o),
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
const ks = "openTime";
function ue(e, t) {
  return (A(e.bucket) ?? A(e.ts) ?? 0) + Math.max(1, Je(t));
}
function et(e, t, n) {
  return Nt(e, t, n);
}
function Wn(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [o, a] of Object.entries(e.candlesByTimeframe))
    for (const s of a)
      t.add(s.knownAt ?? ue(s, o));
  for (const o of e.candidateMetrics ?? [])
    t.add(A(o.knownAt) ?? o.asOf);
  for (const o of e.structureEvents ?? []) t.add(D(o));
  for (const o of e.avwapEvents ?? []) t.add(D(o));
  for (const o of e.relativeStrengthEvents ?? []) t.add(D(o));
  for (const o of e.supportResistanceZones ?? []) t.add(D(o));
  for (const o of e.evaluationPoints ?? []) {
    const a = A(o);
    a != null && t.add(a);
  }
  const n = [...t].filter(Number.isFinite).sort((o, a) => o - a), r = A(e.from) ?? n[0] ?? 0, i = A(e.to) ?? ce(n) ?? r;
  return t.add(r), t.add(i), [...t].filter((o) => Number.isFinite(o) && o >= r && o <= i).sort((o, a) => o - a);
}
function Gn(e, t) {
  return ce([...e ?? []].filter((n) => (A(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (A(n.knownAt) ?? n.asOf) - (A(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function Mt(e, t, n, r, i, o) {
  var f;
  const a = Pe(e, r), s = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && D(d) <= i
  ), c = o ?? /* @__PURE__ */ new Map();
  for (const d of [...a.breaks, ...s])
    c.set(
      ae(
        d.kind,
        t,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const u = [...c.values()].filter((d) => d.knownAt <= i).sort(
    (d, m) => d.knownAt - m.knownAt || d.eventTime - m.eventTime
  );
  if (!u.length) return a;
  const l = ((f = ce(u)) == null ? void 0 : f.direction) ?? a.trend;
  return {
    swings: a.swings,
    breaks: u,
    trend: l,
    summary: $t(a.swings, u, l)
  };
}
function li(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function ui(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = fi(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), i = Ai(r, n);
  let o = di(r, e);
  if (!o && Me(e.extension ?? null)) {
    const a = Ht(t, e.asOf, e.executionTimeframe);
    a && (o = {
      index: a.index,
      candle: a.candle,
      eventTime: Z(a.candle),
      knownAt: Math.min(
        e.asOf,
        ie(t, a.index, e.executionTimeframe)
      ),
      metrics: Dt(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, i.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return o ? Qn(o, e, e.asOf, i) : Kn({
    checks: e.checks,
    asOf: e.asOf,
    updatedTs: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: "notCandidate",
    reason: "No active Impulse Fade v1 candidate",
    dataQuality: i,
    lifecycleConfigHash: e.lifecycleConfigHash
  });
}
function fi(e, t, n, r, i) {
  if (i != null && i.length)
    return [...i].map((a) => {
      const s = A(a.knownAt) ?? a.asOf, c = Ht(e, s, r);
      if (!c || s > n) return null;
      const u = A(a.eventTime) ?? Z(c.candle), l = Dt(a.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: u,
        knownAt: s,
        metrics: l,
        pass: Me(l),
        rollingReturnCount: Math.max(0, Math.trunc(a.sampleCount ?? 0))
      };
    }).filter((a) => a != null).sort((a, s) => a.knownAt - s.knownAt || a.eventTime - s.eventTime);
  const o = [];
  for (let a = 0; a < e.length; a += 1) {
    const s = e[a], c = ie(e, a, r);
    if (c > n) continue;
    const u = Ft(e.slice(0, a + 1), t), l = Bt(u);
    o.push({
      index: a,
      candle: s,
      eventTime: Z(s),
      knownAt: c,
      metrics: l,
      pass: Me(l),
      rollingReturnCount: u.rollingReturnCount
    });
  }
  return o;
}
function di(e, t) {
  var o;
  const n = [];
  let r = !1;
  for (const a of e)
    a.pass && !r && n.push(a), r = a.pass;
  if (!n.length) return null;
  let i = n[0];
  for (const a of n.slice(1)) {
    const c = ((o = Qn(i, t, a.knownAt, []).candidate) == null ? void 0 : o.terminalAt) ?? null;
    c != null && e.some((u) => u.knownAt > c && u.knownAt < a.knownAt && !u.pass) && (i = a);
  }
  return i;
}
function Qn(e, t, n, r) {
  const i = (t.symbol ?? "UNKNOWN").toUpperCase(), o = t.source ?? "chart", a = t.venue ?? "", s = t.executionTimeframe, c = Lt(
    t.htfStructures ?? [],
    e.knownAt
  ).map((p) => ({
    timeframe: p.timeframe,
    state: p.summary.state,
    trend: p.summary.trend,
    transitionDirection: p.summary.transitionDirection,
    updatedTs: p.summary.updatedTs
  })), u = Ri({
    setupFamily: se,
    symbol: i,
    source: o,
    venue: a,
    executionTimeframe: s,
    detectedAt: e.knownAt
  }), l = [
    {
      id: ae("candidate_detected", s, e.eventTime, e.knownAt),
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
      evidenceIds: [l[0].id],
      evidenceCodes: [l[0].code],
      explanation: "Candidate episode detected"
    }
  ], d = hi(t, e, n), m = mi(e, t, n);
  let v = "developing", g = e.knownAt, h = null, y = null, S = null, I = null, _ = null;
  for (const p of m) {
    if (h != null) break;
    if (!(p.knownAt < e.knownAt || p.knownAt > n)) {
      if (p.lifecycleKind === "deterioration") {
        l.push({ ...p, contributesTo: "deteriorating" }), v === "developing" && (f.push(ke(v, "deteriorating", p)), v = "deteriorating", g = p.knownAt);
        continue;
      }
      if (p.lifecycleKind === "bearishBreak") {
        l.push({ ...p, contributesTo: "waitingForRetest" }), (v === "developing" || v === "deteriorating") && (f.push(ke(v, "waitingForRetest", p)), v = "waitingForRetest", g = p.knownAt, y = p.breakLevel ?? null);
        continue;
      }
      if (p.lifecycleKind === "retest") {
        v === "waitingForRetest" && y && p.relatedEventId === y.evidenceId && p.knownAt > y.knownAt && (l.push({ ...p, contributesTo: "entryCandidate" }), f.push(ke(v, "entryCandidate", p)), v = "entryCandidate", g = p.knownAt, S = p.breakLevel ?? y);
        continue;
      }
      if (p.lifecycleKind === "invalidation") {
        (v === "deteriorating" || v === "waitingForRetest" || v === "entryCandidate") && (l.push({ ...p, contributesTo: "invalidated" }), f.push(ke(v, "invalidated", p)), v = "invalidated", g = p.knownAt, h = p.knownAt, I = p.explanation);
        continue;
      }
      p.lifecycleKind === "expiry" && v !== "entryCandidate" && (l.push({ ...p, contributesTo: "expired" }), f.push(ke(v, "expired", p)), v = "expired", g = p.knownAt, h = p.knownAt, _ = p.explanation);
    }
  }
  const P = Zn(
    t.candles ?? [],
    e.eventTime,
    n,
    s
  ), w = {
    id: u,
    setupFamily: se,
    lifecycleVersion: X,
    lifecycleConfigHash: t.lifecycleConfigHash ?? Ee({
      extensionOptions: t.extensionOptions,
      resistanceNearPct: t.resistanceNearPct,
      retestNearPct: t.retestNearPct,
      retestToleranceBps: t.retestToleranceBps,
      retestToleranceAtr: t.retestToleranceAtr,
      invalidationBps: t.invalidationBps,
      maxCandidateAgeSeconds: t.maxCandidateAgeSeconds
    }),
    symbol: i,
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
    stateSince: g,
    terminalAt: h
  };
  return {
    strategy: "pumpFade",
    setupFamily: se,
    lifecycleVersion: X,
    lifecycleConfigHash: w.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: s,
    state: v,
    currentState: v,
    stateSince: g,
    label: tt(v),
    reason: Ei(v, l, f, I, _),
    checks: t.checks,
    updatedTs: n,
    candidate: w,
    evidence: l.sort((p, E) => p.knownAt - E.knownAt || p.eventTime - E.eventTime),
    transitions: f,
    pendingConditions: Xn(v, y),
    activeBreakLevel: y,
    retestLevel: S,
    confluence: d,
    invalidationReason: I,
    expiryReason: _,
    dataQuality: r
  };
}
function mi(e, t, n) {
  const r = [], i = t.executionTimeframe;
  for (const u of t.rsDivergences ?? []) {
    if (u.direction !== "bearish") continue;
    const l = D(u);
    if (!xe(u, e, n)) continue;
    const f = u.signal === "break" ? "rs_break_bearish" : u.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: ae(f, i, u.eventTime, l, u.x),
      code: f,
      explanation: `${u.label}: bearish relative-strength deterioration`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: i,
      price: u.price,
      value: u.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const u of t.anchoredVwapSignals ?? []) {
    const l = D(u);
    u.kind !== "failedReclaim" || !xe(u, e, n) || r.push({
      id: ae("avwap_failed_reclaim", i, u.eventTime, l, u.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: i,
      price: u.price,
      level: u.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const o = yi(t), a = [];
  for (const u of o) {
    const l = D(u);
    if (u.direction !== "bearish" || !xe(u, e, n)) continue;
    const f = u.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = ae(f, i, u.eventTime, l, u.x), m = {
      level: u.level,
      sourceTimeframe: i,
      eventTime: u.eventTime,
      knownAt: l,
      evidenceId: d
    }, v = {
      id: d,
      code: f,
      explanation: `${u.label} down through ${te(u.level)}`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: i,
      level: u.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    a.push(v), r.push(v);
  }
  for (const u of a) {
    const l = vi(e, u, t, n);
    l && r.push(l);
  }
  for (const u of o) {
    const l = D(u);
    if (u.kind !== "StructureBreak" || u.direction !== "bullish" || !xe(u, e, n))
      continue;
    const f = (t.candles ?? [])[u.index], d = Zn(
      t.candles ?? [],
      e.eventTime,
      l - 1,
      i
    ), m = H(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + m / 1e4) || r.push({
      id: ae("bullish_continuation_invalidation", i, u.eventTime, l, u.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${te(d.price)}`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: i,
      price: f.c,
      level: d.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const s = N(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + s;
  return c <= n && r.push({
    id: ae("candidate_expired", i, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Ci(s)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: i,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (u, l) => u.knownAt - l.knownAt || u.eventTime - l.eventTime || u.sortPriority - l.sortPriority || u.code.localeCompare(l.code)
  );
}
function vi(e, t, n, r) {
  var l;
  const i = n.candles ?? [], o = t.breakLevel;
  if (!o || !Number.isFinite(o.level)) return null;
  const a = H(n.retestToleranceBps, 0, 1e3, 35), s = H(n.retestToleranceAtr, 0, 10, 0.25), c = N((l = n.extensionOptions) == null ? void 0 : l.atrPeriod, 2, 100, 14), u = nt(i, c);
  for (let f = 0; f < i.length; f += 1) {
    const d = i[f], m = ie(i, f, n.executionTimeframe), v = Z(d);
    if (m <= t.knownAt || v < t.knownAt || v < e.knownAt || m > r)
      continue;
    const g = u[f] ?? 0, h = Math.max(
      o.level * (a / 1e4),
      Number.isFinite(g) ? g * s : 0
    );
    if (d.h >= o.level - h && d.l <= o.level + h && d.c < o.level && d.c <= d.o)
      return {
        id: ae(
          "bearish_retest_rejection",
          o.sourceTimeframe,
          Z(d),
          m,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${te(o.level)}`,
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
function hi(e, t, n) {
  const r = [], i = Vt(
    e.srZones.filter((s) => D(s) <= n),
    e.latestPrice,
    H(e.resistanceNearPct, 0, 10, 1.5)
  );
  i && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${te(i.low)}-${te(i.high)}`,
    eventTime: i.eventTime,
    knownAt: i.knownAt,
    sourceTimeframe: "MTF",
    level: i.center
  });
  const o = [...e.anchoredVwapSignals ?? []].filter(
    (s) => s.kind === "loss" && xe(s, t, n)
  ).sort((s, c) => D(c) - D(s))[0];
  o && D(o) <= n && r.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: o.vwap
  });
  const a = A(e.avwapDistancePct);
  a != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${Oe(a, 1)}% from AVWAP`,
    value: a,
    sourceTimeframe: e.executionTimeframe
  });
  for (const s of Lt(e.htfStructures, n))
    s.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${s.timeframe} structure`,
      detail: Ti(s.summary),
      eventTime: s.summary.updatedTs,
      knownAt: s.summary.updatedTs,
      sourceTimeframe: s.timeframe
    });
  return r;
}
function Lt(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const i = A(r.summary.updatedTs);
    if (i != null && i > t) continue;
    const o = n.get(r.timeframe), a = A(o == null ? void 0 : o.summary.updatedTs) ?? -1 / 0;
    (!o || (i ?? -1 / 0) >= a) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function yi(e) {
  var r, i, o;
  const t = (i = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && i.length ? e.marketStructure.breaks : (o = e.structure) != null && o.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((a) => {
    const s = `${a.kind}:${a.direction}:${a.x}:${a.level}:${D(a)}`;
    return n.has(s) ? !1 : (n.add(s), !0);
  });
}
function pi(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && gn(e.htfResistance, e.htfStructures) ? "deteriorating" : gn(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function Kn(e) {
  return {
    strategy: "pumpFade",
    setupFamily: se,
    lifecycleVersion: X,
    lifecycleConfigHash: e.lifecycleConfigHash ?? Ee(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: tt(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: Xn(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function Yn(e, t = {}) {
  const n = $i(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let i = 0, o = 0;
  for (let a = n; a < e.length; a += 1) {
    const s = e[a];
    if (!s) continue;
    const c = (s.h + s.l + s.c) / 3;
    if (!U(c)) continue;
    const u = Ui(s, c);
    u <= 0 || (i += u, o += c * u, r.push(s.x, o / i));
  }
  return new Float32Array(r);
}
function Ts(e, t = {}) {
  const n = A(t.anchorBucket), r = A(t.anchorX), i = Yn(e, t);
  if (i.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const o = i[i.length - 1], a = Jn(e), s = a && U(o) ? (a.c - o) / o * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: o,
    distancePct: s,
    candle: a
  };
}
function Cs(e, t = {}, n = 20) {
  const r = N(n, 1, 200, 20), i = Yn(e, t);
  if (i.length < 4) return [];
  const o = new Map(e.map((c, u) => [c.x, { candle: c, index: u }])), a = [];
  let s = null;
  for (let c = 0; c < i.length; c += 2) {
    const u = i[c], l = i[c + 1], f = o.get(u);
    if (!f || !U(l) || !U(f.candle.c)) continue;
    const d = ie(e, f.index), m = f.candle.c > l ? "above" : f.candle.c < l ? "below" : null;
    m && (s === "above" && m === "below" ? a.push(ft("loss", f.index, f.candle, l, d)) : s === "below" && m === "above" ? a.push(ft("reclaim", f.index, f.candle, l, d)) : s === "below" && m === "below" && f.candle.h >= l && f.candle.c < l && a.push(
      ft("failedReclaim", f.index, f.candle, l, d)
    ), s = m);
  }
  return a.slice(-r);
}
function wi(e, t = {}) {
  const n = N(t.lookback, 20, 2e3, 500), r = N(t.pivotStrength, 1, 20, 3), i = N(t.atrPeriod, 2, 100, 14), o = H(t.minMoveAtr, 0, 10, 0.75), a = N(t.maxSwings, 1, 500, 120), s = Math.max(0, e.length - n), c = e.slice(s);
  if (c.length < r * 2 + 1) return [];
  const u = nt(e, i), l = [];
  for (let d = r; d < c.length - r; d += 1) {
    const m = c[d], v = s + d, g = u[v] ?? null, h = ie(e, v + r);
    Zi(c, d, r) && l.push(bn("SwingHigh", v, m, m.h, g, h)), Ji(c, d, r) && l.push(bn("SwingLow", v, m, m.l, g, h));
  }
  const f = [];
  for (const d of l) {
    const m = f[f.length - 1];
    if (!m) {
      f.push(d);
      continue;
    }
    if (m.kind === d.kind) {
      Qi(d, m) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - m.price) >= Ki(d, m, o) && f.push(d);
  }
  return qi(f).slice(-a);
}
function Pe(e, t = {}) {
  const n = N(t.maxSwings, 1, 500, 120), r = N(t.maxBreaks, 1, 200, 24), i = wi(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), o = [], a = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  let c = 0, u = null, l = null, f = "neutral";
  for (let v = 0; v < e.length; v += 1) {
    const g = ie(e, v);
    for (; c < i.length && i[c].index < v && i[c].knownAt <= g; ) {
      const y = i[c];
      y.kind === "SwingHigh" ? u = y : l = y, c += 1;
    }
    const h = e[v];
    if (u && !a.has(u.x) && h.c > u.price) {
      const y = f === "bearish" ? "StructureShift" : "StructureBreak";
      o.push(An(y, "bullish", v, h, u, g)), a.add(u.x), f = "bullish";
    }
    if (l && !s.has(l.x) && h.c < l.price) {
      const y = f === "bullish" ? "StructureShift" : "StructureBreak";
      o.push(An(y, "bearish", v, h, l, g)), s.add(l.x), f = "bearish";
    }
  }
  const d = i.slice(-n), m = o.slice(-r);
  return {
    swings: d,
    breaks: m,
    trend: f,
    summary: $t(d, m, f)
  };
}
function Is(e) {
  var i;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Rn(t, "SwingHigh", "rangeHigh", null, !0),
      Rn(t, "SwingLow", "rangeLow", null, !1)
    ].filter((o) => !!o);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((i = n.lastBreak) == null ? void 0 : i.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    We(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    We(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((o) => !!o) : r === "bearish" ? [
    We(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    We(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((o) => !!o) : [];
}
function xs(e, t = {}) {
  var c, u;
  const n = N(t.lookback, 20, 1e3, 240), r = N(t.pivotStrength, 1, 20, 3), i = N(t.maxZones, 1, 12, 6), o = H(t.thicknessBps, 1, 100, 10), a = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, s = Pe(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return gi(s.swings, {
    maxZones: i,
    thicknessBps: o,
    latestX: a,
    referencePrice: t.referencePrice ?? ((u = e[e.length - 1]) == null ? void 0 : u.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function gi(e, t = {}) {
  var u;
  const n = N(t.maxZones, 1, 12, 6), r = H(t.thicknessBps, 1, 100, 10), i = t.latestX ?? ((u = e[e.length - 1]) == null ? void 0 : u.x) ?? 0, o = A(t.referencePrice), a = t.zonesPerSide == null ? null : N(t.zonesPerSide, 1, 12, 3), s = [];
  for (const l of e)
    Yi(
      s,
      l.kind === "SwingHigh" ? "resistance" : "support",
      l,
      i - l.x + 1,
      r
    );
  const c = s.filter((l) => Number.isFinite(l.center) && l.high > l.low).sort((l, f) => f.score - l.score || f.touches - l.touches || f.lastX - l.lastX).slice(0, Math.max(n * 2, n));
  return Xi(c, n, o, a);
}
function bi(e, t) {
  const n = new Map(
    t.filter((a) => U(a.c)).map((a) => [a.bucket, a])
  );
  let r = null, i = null;
  const o = [];
  for (const a of e) {
    if (!U(a.c)) continue;
    const s = n.get(a.bucket);
    if (!s || !U(s.c)) continue;
    (r == null || i == null) && (r = a.c, i = s.c);
    const c = a.c / r / (s.c / i);
    o.push(a.x, (c - 1) * 100);
  }
  return new Float32Array(o);
}
function Ps(e, t, n = {}) {
  var P;
  const r = N(n.maxDivergences, 1, 100, 16), i = H(n.minDeltaPct, 0, 50, 0.5), o = N(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), a = n.includeDivergences ?? !0, s = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, u = bi(e, t), l = to(u);
  if (!e.length || l.size < 2) return [];
  const d = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - o, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, v = Pe(e, {
    ...m
  }), g = zi(e, u), h = Pe(g, {
    ...m
  }), y = new Map(e.map((w, p) => [w.x, { candle: w, index: p }])), S = [];
  let I = null, _ = null;
  for (const w of v.swings) {
    const p = l.get(w.x);
    if (!(p == null || !Number.isFinite(p))) {
      if (w.kind === "SwingHigh") {
        if (I) {
          const E = l.get(I.x);
          E != null && Number.isFinite(E) && (w.price > I.price && p <= E - i ? a && S.push(
            ze(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              w,
              I,
              p,
              E,
              v.summary.state,
              h.summary.state
            )
          ) : w.price < I.price && p >= E + i && s && S.push(
            ze(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              w,
              I,
              p,
              E,
              v.summary.state,
              h.summary.state
            )
          ));
        }
        I = w;
        continue;
      }
      if (_) {
        const E = l.get(_.x);
        E != null && Number.isFinite(E) && (w.price > _.price && p <= E - i ? s && S.push(
          ze(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            w,
            _,
            p,
            E,
            v.summary.state,
            h.summary.state
          )
        ) : w.price < _.price && p >= E + i && a && S.push(
          ze(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            w,
            _,
            p,
            E,
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
      const p = y.get(w.x), E = l.get(w.x);
      if (!p || E == null || !Number.isFinite(E)) continue;
      const k = Pe(e.slice(0, p.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      Wi(w.direction, k.summary.state) && S.push(
        ji(
          w.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          w.direction,
          w.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          p.index,
          p.candle,
          E,
          w,
          k.summary.state,
          h.summary.state
        )
      );
    }
  return S.filter((w) => w.x >= d).sort((w, p) => w.x - p.x || En(w.signal) - En(p.signal)).slice(-r);
}
function Os(e) {
  return new Uint8Array(e.buffer);
}
function Dt(e) {
  return {
    returnPct: A(e == null ? void 0 : e.returnPct),
    percentile: A(e == null ? void 0 : e.percentile),
    zScore: A(e == null ? void 0 : e.zScore),
    atrExtension: A(e == null ? void 0 : e.atrExtension)
  };
}
function Bt(e) {
  return {
    returnPct: A(e.returnPct),
    percentile: A(e.percentile),
    zScore: A(e.zScore),
    atrExtension: A(e.atrExtension)
  };
}
function Me(e) {
  const t = Dt(e);
  return t.returnPct != null && t.returnPct >= Ie.returnPct || t.percentile != null && t.percentile >= Ie.percentile || t.zScore != null && t.zScore >= Ie.zScore || t.atrExtension != null && t.atrExtension >= Ie.atrExtension;
}
function Ai(e, t) {
  const n = [], r = N(t.minSamples, 1, 1e4, 20), i = e[e.length - 1] ?? null;
  return i ? i.rollingReturnCount < r && n.push(
    `Rolling-return history has ${i.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function ke(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function Ei(e, t, n, r, i) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return i ?? "Candidate expired before progressing";
  const o = n[n.length - 1];
  if (o && o.to === e) return o.explanation;
  const a = t.filter((c) => c.contributesTo === e), s = a[a.length - 1];
  return (s == null ? void 0 : s.explanation) ?? tt(e);
}
function Xn(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${te(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function Ri(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function ae(e, t, n, r, i) {
  return [e, t, n, r, i ?? ""].map((o) => String(o).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Zn(e, t, n, r) {
  let i = null;
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], s = Z(a);
    s < t || ie(e, o, r) > n || Number.isFinite(a.h) && (!i || a.h > i.price) && (i = { price: a.h, eventTime: s });
  }
  return i;
}
function Si(e, t) {
  return e.length ? ie(e, e.length - 1, t) : null;
}
function Ht(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (ie(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function Z(e) {
  const t = A(e.ts);
  return t ?? A(e.bucket) ?? 0;
}
function ie(e, t, n) {
  const r = e[t];
  return r ? r.knownAt != null && Number.isFinite(r.knownAt) ? r.knownAt : n != null && String(n).trim() !== "chart" ? ue(r, n) : (A(r.bucket) ?? Z(r)) + ki(e, t) : 0;
}
function ki(e, t) {
  var o, a, s;
  const n = A((o = e[t]) == null ? void 0 : o.bucket) ?? Z(e[t]), r = A((a = e[t + 1]) == null ? void 0 : a.bucket);
  if (r != null && r > n) return r - n;
  const i = A((s = e[t - 1]) == null ? void 0 : s.bucket);
  return i != null && n > i ? n - i : 1;
}
function D(e) {
  return A(e.knownAt) ?? A(e.eventTime) ?? A(e.ts) ?? A(e.bucket) ?? 0;
}
function xe(e, t, n) {
  const r = D(e), i = A(e.eventTime) ?? A(e.ts) ?? A(e.bucket) ?? r;
  return r > t.knownAt && r <= n && i >= t.knownAt;
}
function Ti(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Ci(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function U(e) {
  return Number.isFinite(e) && e > 0;
}
function Ii(e) {
  const t = A(e == null ? void 0 : e.returnPct), n = A(e == null ? void 0 : e.percentile), r = A(e == null ? void 0 : e.zScore), i = A(e == null ? void 0 : e.atrExtension), o = [
    t == null ? null : `24h ${Oe(t, 1)}%`,
    i == null ? null : `Ext ${Oe(i, 1)} ATR`,
    r == null ? null : `Z ${Oe(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((s) => !!s);
  return {
    key: "extension",
    label: "Extension",
    status: Me({ returnPct: t, percentile: n, zScore: r, atrExtension: i }) ? "pass" : "pending",
    detail: o.join(" | ") || "No extension context yet"
  };
}
function xi(e, t, n) {
  const r = Vt(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${te(r.low)}-${te(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function Pi(e) {
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
function Oi(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Ni(e, t) {
  const n = [...e].reverse().find((o) => o.kind === "loss" || o.kind === "failedReclaim"), r = A(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${Oe(r, 1)}%`)
  };
}
function _i(e, t, n, r) {
  var c;
  const i = A((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), o = i != null && n != null && Mi(n, i) <= r, a = Vt(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(o || a) ? "pass" : "pending",
    detail: o ? `Retesting ${te(i)}` : a ? `Near R ${te(a.center)}` : "No retest yet"
  };
}
function Fi(e, t, n, r) {
  var o;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const i = A((o = n.lastSwingHigh) == null ? void 0 : o.price);
  return i != null && r > i * 1.01;
}
function gn(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Vt(e, t, n) {
  return t == null || !U(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, i) => r.distance - i.distance || i.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function Mi(e, t) {
  return !U(e) || !U(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function tt(e) {
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
function Li(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : tt(e);
}
function Oe(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function te(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function A(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function ce(e) {
  return e[e.length - 1];
}
function Jn(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (U(n.c)) return n;
  }
  return null;
}
function Di(e) {
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
function er(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let i = null;
  for (let o = r; o >= 0; o -= 1) {
    const a = e[o];
    if (a.bucket <= t && U(a.c)) {
      i = a;
      break;
    }
  }
  return i;
}
function Bi(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const i = e[r];
    if (i.bucket < t.earliestBucket || i.bucket >= t.excludeBucket || !U(i.c)) continue;
    const o = er(e, i.bucket - t.windowSeconds, r);
    !o || !U(o.c) || n.push((i.c / o.c - 1) * 100);
  }
  return n;
}
function Hi(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((o) => o < t).length, i = n.filter((o) => o === t).length;
  return (r + i * 0.5) / n.length * 100;
}
function Vi(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((a, s) => a + s, 0) / n.length, i = n.reduce((a, s) => a + (s - r) ** 2, 0) / (n.length - 1), o = Math.sqrt(i);
  return o > 0 ? (t - r) / o : null;
}
function ft(e, t, n, r, i) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: Z(n),
    knownAt: i
  };
}
function $i(e, t) {
  const n = t.anchorBucket == null ? null : Number(t.anchorBucket);
  if (n != null && Number.isFinite(n)) {
    const i = e.findIndex((o) => o.bucket >= n);
    return i >= 0 ? i : null;
  }
  const r = t.anchorX == null ? null : Number(t.anchorX);
  if (r != null && Number.isFinite(r)) {
    const i = e.findIndex((o) => o.x >= r);
    return i >= 0 ? i : null;
  }
  return null;
}
function Ui(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function bn(e, t, n, r, i, o) {
  return {
    kind: e,
    structure: e,
    label: e === "SwingHigh" ? "SH" : "SL",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: r,
    atr: i,
    eventTime: Z(n),
    knownAt: o
  };
}
function qi(e) {
  let t = null, n = null;
  return e.map((r) => {
    if (r.kind === "SwingHigh") {
      const s = t == null ? "SwingHigh" : r.price > t.price ? "HigherHigh" : "LowerHigh", u = { ...r, structure: s, label: s === "SwingHigh" ? "SH" : s === "HigherHigh" ? "HH" : "LH" };
      return t = u, u;
    }
    const i = n == null ? "SwingLow" : r.price > n.price ? "HigherLow" : "LowerLow", a = { ...r, structure: i, label: i === "SwingLow" ? "SL" : i === "HigherLow" ? "HL" : "LL" };
    return n = a, a;
  });
}
function An(e, t, n, r, i, o) {
  return {
    kind: e,
    direction: t,
    label: e === "StructureBreak" ? "BOS" : "Shift",
    index: n,
    x: r.x,
    ts: r.ts,
    bucket: r.bucket,
    level: i.price,
    sourceSwingX: i.x,
    sourceSwingPrice: i.price,
    eventTime: Z(r),
    knownAt: o
  };
}
function ze(e, t, n, r, i, o, a, s, c, u) {
  return {
    kind: e,
    signal: t,
    direction: n,
    label: r,
    index: i.index,
    x: i.x,
    ts: i.ts,
    bucket: i.bucket,
    price: i.price,
    previousPrice: o.price,
    rs: a,
    previousRs: s,
    priceLabel: i.label,
    sourceBreak: null,
    priceStructureState: c,
    rsStructureState: u,
    eventTime: i.eventTime,
    knownAt: Math.max(i.knownAt, o.knownAt)
  };
}
function ji(e, t, n, r, i, o, a, s, c) {
  return {
    kind: e,
    signal: "break",
    direction: t,
    label: n,
    index: r,
    x: i.x,
    ts: i.ts,
    bucket: i.bucket,
    price: t === "bearish" ? i.l : i.h,
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
function zi(e, t) {
  const n = new Map(e.map((o) => [o.x, o])), r = [];
  let i = null;
  for (let o = 0; o < t.length; o += 2) {
    const a = t[o], s = t[o + 1], c = n.get(a);
    if (!c || !Number.isFinite(s)) continue;
    const u = i ?? s;
    r.push({
      ...c,
      o: u,
      h: s,
      l: s,
      c: s,
      v_base: 0,
      v_quote: 0
    }), i = s;
  }
  return r;
}
function Wi(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function En(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function $t(e, t, n) {
  const r = t[t.length - 1] ?? null, i = bt(e, "SwingHigh"), o = bt(e, "SwingLow"), a = e[e.length - 1] ?? null, s = Gi(t), c = e.length === 0 ? "neutral" : r == null || s ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, u = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: u,
    lastBreak: r,
    lastSwingHigh: i,
    lastSwingLow: o,
    updatedX: (r == null ? void 0 : r.x) ?? (a == null ? void 0 : a.x) ?? null,
    updatedTs: (r == null ? void 0 : r.knownAt) ?? (a == null ? void 0 : a.knownAt) ?? null
  };
}
function We(e, t, n, r, i) {
  for (let a = e.length - 1; a >= 0; a -= 1) {
    const s = e[a];
    if (s.kind === t && n.includes(s.structure))
      return gt(r, i, s);
  }
  const o = bt(e, t);
  return o ? gt(r, i, o) : null;
}
function Rn(e, t, n, r, i) {
  let o = null;
  for (const a of e)
    a.kind === t && (!o || (i ? a.price > o.price : a.price < o.price)) && (o = a);
  return o ? gt(n, r, o) : null;
}
function gt(e, t, n) {
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
function Gi(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function bt(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function Qi(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Ki(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function nt(e, t) {
  const n = ve(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const i = e.map((a, s) => {
    if (s === 0) return a.h - a.l;
    const c = e[s - 1].c;
    return Math.max(
      a.h - a.l,
      Math.abs(a.h - c),
      Math.abs(a.l - c)
    );
  });
  let o = 0;
  for (let a = 0; a < n; a += 1) o += i[a];
  o /= n, r[n - 1] = o;
  for (let a = n; a < e.length; a += 1)
    o = (o * (n - 1) + i[a]) / n, r[a] = o;
  return r;
}
function Yi(e, t, n, r, i) {
  const o = n.price;
  if (!Number.isFinite(o) || o <= 0) return;
  const a = Math.max(o * (i / 1e4), Number.EPSILON), s = o - a, c = o + a, u = 1 / Math.max(1, r), l = e.find(
    (m) => m.kind === t && eo(m.low, m.high, s, c)
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
  const f = l.touches + 1;
  l.center = (l.center * l.touches + o) / f, l.touches = f, l.score += 1 + u, l.strength = l.score, l.lastX = Math.max(l.lastX, n.x), l.eventTime = Math.max(l.eventTime, n.eventTime), l.knownAt = Math.max(l.knownAt, n.knownAt), l.structures.push(n.structure);
  const d = Math.max(l.center * (i / 1e4), Number.EPSILON);
  l.low = Math.min(l.low, l.center - d, s), l.high = Math.max(l.high, l.center + d, c);
}
function Xi(e, t, n, r) {
  if (!n || !r) return e.slice(0, t);
  const i = /* @__PURE__ */ new Set(), o = e.filter((s) => s.center <= n).sort((s, c) => n - s.center - (n - c.center) || c.score - s.score).slice(0, r), a = e.filter((s) => s.center > n).sort((s, c) => s.center - n - (c.center - n) || c.score - s.score).slice(0, r);
  for (const s of [...o, ...a])
    i.add(s);
  for (const s of e) {
    if (i.size >= t) break;
    i.add(s);
  }
  return Array.from(i).sort((s, c) => c.score - s.score || c.touches - s.touches || c.lastX - s.lastX).slice(0, t);
}
function Zi(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let i = 1; i <= n; i += 1)
    if (e[t - i].h >= r || e[t + i].h > r) return !1;
  return !0;
}
function Ji(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let i = 1; i <= n; i += 1)
    if (e[t - i].l <= r || e[t + i].l < r) return !1;
  return !0;
}
function eo(e, t, n, r) {
  return e <= r && n <= t;
}
function to(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], i = e[n + 1];
    Number.isFinite(r) && Number.isFinite(i) && t.set(r, i);
  }
  return t;
}
function At(e, t) {
  const n = ve(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const i = 2 / (n + 1);
  let o = 0;
  for (let a = 0; a < n; a++) o += e[a].c;
  o /= n, r[n - 1] = o;
  for (let a = n; a < e.length; a++)
    o = (e[a].c - o) * i + o, r[a] = o;
  return r;
}
function no(e, t) {
  const n = ve(t);
  if (e.length < n) return [];
  const r = [], i = 2 / (n + 1);
  let o = 0;
  for (let a = 0; a < n; a++) o += e[a].value;
  o /= n, r.push({ x: e[n - 1].x, value: o });
  for (let a = n; a < e.length; a++)
    o = (e[a].value - o) * i + o, r.push({ x: e[a].x, value: o });
  return r;
}
function tr(e, t) {
  const n = ve(t);
  if (e.length <= n) return [];
  let r = 0, i = 0;
  for (let a = 1; a <= n; a++) {
    const s = e[a].c - e[a - 1].c;
    s >= 0 ? r += s : i += Math.abs(s);
  }
  r /= n, i /= n;
  const o = [
    { x: e[n].x, value: kn(r, i) }
  ];
  for (let a = n + 1; a < e.length; a++) {
    const s = e[a].c - e[a - 1].c, c = Math.max(0, s), u = Math.max(0, -s);
    r = (r * (n - 1) + c) / n, i = (i * (n - 1) + u) / n, o.push({ x: e[a].x, value: kn(r, i) });
  }
  return o;
}
function Sn(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((i, o) => {
    r += i.value, o >= t && (r -= e[o - t].value), o >= t - 1 && n.push({ x: i.x, value: r / t });
  }), n;
}
function me(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function kn(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function ve(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function N(e, t, n, r) {
  return Math.floor(H(e, t, n, r));
}
function H(e, t, n, r) {
  const i = Number(e);
  return Number.isFinite(i) ? Math.max(t, Math.min(n, i)) : r;
}
const ro = "strategy-profile.1", nr = "decision-snapshot.1", io = "impulse_fade_v1.research.default", oo = "1";
function ao(e) {
  return `decision-reference-observation:${C({
    objectType: e.objectType,
    objectId: e.objectId,
    snapshot: e.snapshot
  }).slice(8)}`;
}
function rt(e) {
  const { profileHash: t, ...n } = e;
  return C(n);
}
function rr(e) {
  if (Le(e.createdAt, "createdAt"), e.setupFamily !== se || e.lifecycleVersion !== X || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [i, o] of Object.entries(e.timeframeRoles))
    if (i === "contextTimeframes") {
      if (!o.every((a) => a.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (o != null && !o.trim())
      throw new TypeError(`${i} cannot be blank`);
  if (Tn(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), Tn(
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
    (i) => !e.entryPolicy.factors.hardGate.includes(i)
  ))
    throw new RangeError(
      "Impulse Fade lifecycle 1 requires unique, supported hard-gate factor roles"
    );
  if (Object.values(e.executionAssumptions).some(
    (i) => !Number.isFinite(i) || i < 0
  ))
    throw new RangeError("Execution assumptions must be non-negative finite numbers");
  if (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4)
    throw new RangeError("Adverse-slippage allowances must be below 10,000 basis points");
  const r = b(e);
  return b({
    ...r,
    profileHash: rt(r)
  });
}
function so(e = {}) {
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
  }, i = {
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
  return rr({
    schemaVersion: ro,
    id: e.id ?? io,
    version: e.version ?? oo,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: se,
    lifecycleVersion: X,
    lifecycleConfigHash: e.lifecycleConfigHash ?? Ee(),
    side: "short",
    timeframeRoles: t,
    entryPolicy: i,
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
const co = so();
function Ns(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (po(e.price, "reference price"), Le(e.eventTime, "reference eventTime"), Le(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  const t = ao(e.sourceObject);
  if (e.sourceObject.observationId != null && e.sourceObject.observationId !== t)
    throw new Error("Decision reference source observation failed deterministic verification");
  return b({
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
function lo(e) {
  var o, a, s, c;
  if (Le(e.decisionTime, "decisionTime"), Le(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
    throw new RangeError("effectiveAsOf cannot be later than decisionTime");
  if (e.lifecycle.asOf !== e.effectiveAsOf)
    throw new RangeError("Lifecycle snapshot must be evaluated at effectiveAsOf");
  if (e.lifecycle.executionTimeframe !== e.strategyProfile.timeframeRoles.executionTimeframe)
    throw new RangeError("Lifecycle execution timeframe does not match the strategy profile");
  if (e.lifecycle.updatedTs != null && e.lifecycle.updatedTs > e.effectiveAsOf || e.lifecycle.stateSince != null && e.lifecycle.stateSince > e.effectiveAsOf)
    throw new RangeError("Lifecycle state contains information after effectiveAsOf");
  if (e.lifecycle.candidate && (e.lifecycle.candidate.lifecycleVersion !== e.lifecycle.lifecycleVersion || e.lifecycle.candidate.lifecycleConfigHash !== e.lifecycle.lifecycleConfigHash || e.lifecycle.candidate.symbol.toUpperCase() !== e.symbol.toUpperCase() || e.lifecycle.candidate.source !== e.source))
    throw new RangeError("Candidate episode provenance does not match the lifecycle snapshot");
  fo(e.lifecycle.candidate, e.effectiveAsOf), mo(e.candidateMetrics, e.effectiveAsOf);
  const t = [...e.dataQualityNotes];
  yo([
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
  const n = uo(
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
  const r = {
    snapshotSchemaVersion: nr,
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
    lifecycleEvidence: mt(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: vo(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: dt(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: dt(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((s = e.avwapState) == null ? void 0 : s.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: mt(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: mt(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: dt(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, i = ir(r);
  return b({ ...r, id: i });
}
function ir(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${C(n).slice(8)}`;
}
function or(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const i = n.get(r.id);
    if (i && T(i) !== T(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function uo(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function fo(e, t) {
  if (!e) return;
  if ([
    e.detectedAt,
    e.detectionEventTime,
    e.stateSince,
    e.episodeHighTime,
    e.terminalAt,
    ...e.initialMtfContext.map((r) => r.updatedTs)
  ].filter((r) => r != null).some((r) => !Number.isFinite(r) || r > t))
    throw new RangeError("Candidate episode contains information after effectiveAsOf");
}
function mo(e, t) {
  if (!e) return;
  if ([
    e.requestedAsOf,
    e.effectiveAsOf,
    e.updatedAt,
    e.historyCoverage.requestedEndTs,
    e.historyCoverage.availableEndTs,
    e.extension.latestTs,
    e.extension.referenceTs,
    ...Object.values(e.timeframeExtensions).map((r) => r.latestTs)
  ].filter((r) => r != null).some((r) => !Number.isFinite(r) || r > t))
    throw new RangeError("Candidate metrics contain information after effectiveAsOf");
}
function vo(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      ho(r) <= t ? r : null
    ])
  );
}
function dt(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function mt(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || C(n).localeCompare(C(r))
  );
}
function ho(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function yo(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && T(r) !== T(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function Le(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function po(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function Tn(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const ar = "radar-selection-profile.1", Ut = "radar-episode.1", sr = "replay-case-manifest.1", qt = "radar-metric-observation.1", wo = "radar-scan-result.1", go = "radar-episode-status.1", jt = "execution-venue-eligibility.1", bo = "radar-structure-observation.1", zt = "radar-universe-membership.1";
function Wt(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return C(n);
}
function Ao(e) {
  return hr(e), b({
    ...e,
    canonicalConfigHash: Wt(e)
  });
}
function Eo(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: jt,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return b({
    ...t,
    observationId: ot(t)
  });
}
function _s(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !Ot(e.timeframe) || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: bo,
    ...e
  };
  return b({
    ...t,
    observationId: cr(t)
  });
}
function Fs(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: zt,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return b({
    ...t,
    observationId: it(t)
  });
}
function it(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${j(n)}`;
}
function cr(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${j(n)}`;
}
function Et(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(T(e.snapshot));
  return b({
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
function ot(e) {
  const { observationId: t, ...n } = e;
  return `execution-venue-observation:${j(n)}`;
}
const Ms = Ao({
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
function Ls(e) {
  var c, u;
  Ko(e);
  const t = e.strategyProfile ?? co, n = /* @__PURE__ */ new Map(), r = [], i = [], o = [], a = [], s = /* @__PURE__ */ new Set();
  for (const [l, f] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([d], [m]) => d.localeCompare(m)
  )) {
    const d = Mo(f, e.to), m = `${d.symbol.toUpperCase()}\0${d.source.toLowerCase()}`;
    if (s.has(m))
      throw new Error(`Duplicate radar series identity for ${d.symbol} from ${d.source}`);
    s.add(m);
    const g = ne(
      d.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? [],
      e.selectionProfile.scanTimeframe,
      e.to
    ).map((y) => ue(y, e.selectionProfile.scanTimeframe)).filter((y) => y <= e.to).filter((y) => Go(y, e.selectionProfile)), h = {
      previousGate: null,
      previousEvaluationAsOf: null,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const y of g) {
      const S = be(e.selectionProfile.scanTimeframe) * e.selectionProfile.evaluationCadence.everyBars;
      h.previousEvaluationAsOf != null && y - h.previousEvaluationAsOf > S && (h.previousGate = null, h.falseSince = null);
      const I = y >= e.from, _ = e.selectionProfile.moveDetectors.map(
        (F) => Ro(F, d, y, e.selectionProfile.scanTimeframe)
      );
      if (I)
        for (const F of _)
          for (const O of F.observations)
            n.set(O.requestId, O);
      const P = zo(
        _.map((F) => F.result),
        e.selectionProfile.detectorCombination
      ), w = Oo(
        d,
        y,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), p = Po(
        d,
        y,
        e.selectionProfile,
        _,
        w,
        e.universeHistory ?? []
      ), E = p.results, k = E.every((F) => F.passed), q = P.passed && k, z = !k || P.evaluable;
      if (I)
        for (const F of p.evidence)
          F.schemaVersion === qt && n.set(F.requestId, F);
      const x = _o(
        d,
        y,
        _.map((F) => F.result),
        E,
        p.evidence,
        P.passed,
        k,
        q,
        z
      );
      if (I && r.push(x), h.activeEpisode && y >= h.activeEpisode.activeUntil && (h.activeEpisode.detectedAt >= e.from && h.activeEpisode.activeUntil <= e.to && o.push(
        vt(
          h.activeEpisode,
          h.activeEpisode.activeUntil,
          "expired",
          "maximumAgeElapsed",
          "blockedUntilReset"
        )
      ), h.activeEpisode = null), z && !q ? (h.falseSince ?? (h.falseSince = y), !h.armed && y - h.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (I && ((c = h.blockedEpisode) == null ? void 0 : c.detectedAt) != null && h.blockedEpisode.detectedAt >= e.from && o.push(
        vt(h.blockedEpisode, y, "reset", "radarGateReset", "armed")
      ), h.activeEpisode = null, h.blockedEpisode = null, h.armed = !0)) : h.falseSince = null, z && q && h.previousGate === !1 && h.armed) {
        const F = Co({
          series: d,
          asOf: y,
          profile: e.selectionProfile,
          strategyProfile: t,
          detectorEvaluations: _,
          selectionEvaluation: x,
          hardGateEvidence: p.evidence,
          venueEligibility: w,
          lifecycleHistory: ((u = e.lifecycleHistory) == null ? void 0 : u[l]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (I) {
          i.push(F), o.push(
            vt(F, y, "active", "detected", "blockedUntilReset")
          );
          const O = Io(F, d, e.selectionProfile, t);
          a.push(O);
          for (const $e of F.contextObservations)
            n.set($e.requestId, $e);
        }
        h.activeEpisode = F, h.blockedEpisode = F, h.armed = !1;
      }
      h.previousGate = z ? q : null, h.previousEvaluationAsOf = y;
    }
  }
  return b({
    schemaVersion: wo,
    selectionProfileRef: pr(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(yr),
    gateEvaluations: r.sort(Xo),
    episodes: i.sort(Zo),
    episodeStatusObservations: o.sort(Jo),
    replayCaseManifests: a.sort((l, f) => l.id.localeCompare(f.id))
  });
}
function Ro(e, t, n, r) {
  return e.type === "rollingTroughRunup" ? So(e, t, n, r) : e.type === "elapsedWindowReturn" ? ko(e, t, n, r) : e.type === "maximumWindowReturn" ? To(e, t, n, r) : lr(e, t, n);
}
function So(e, t, n, r) {
  const i = ne(t.candlesByTimeframe[r] ?? [], r, n), o = i.at(-1) ?? null, s = (o ? i.filter(
    (h) => h.bucket >= o.bucket - e.lookbackSeconds && h.bucket <= o.bucket && o.bucket - h.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((h, y) => $(y.c) && (!h || y.c < h.c || y.c === h.c && y.bucket < h.bucket) ? y : h, null), c = o && s && $(s.c) ? (o.c / s.c - 1) * 100 : null, u = Bo(i, o, e), l = mr(u, c, e.minimumSampleCount), f = [];
  o || f.push(Q("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s || f.push(Q("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = C(e), m = Re({
    series: t,
    asOf: n,
    timeframe: r,
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
    historyCandles: Kt(i, o, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...l.notes]
  }), v = c != null && c + 1e-12 >= e.minimumRunupPct && Ne(m.percentile, e.minimumPercentile) && Ne(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, g = s ? No(t, n, s, m) : null;
  return {
    result: at(
      e,
      v,
      [m],
      v ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${Ze(c)} versus ${Ze(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: g
  };
}
function ko(e, t, n, r) {
  const i = ur(e, t, n, r), o = vr(i, e);
  return {
    result: at(
      e,
      o,
      [i],
      o ? i.observationId : null,
      i.value == null ? "Elapsed return unavailable" : `${wr(e.windowSeconds)} return ${Ze(i.value)}`
    ),
    observations: [i],
    anchor: null
  };
}
function To(e, t, n, r) {
  const i = [...new Set(e.windowsSeconds)].sort((l, f) => l - f).map(
    (l) => ur(
      {
        ...e,
        id: `${e.id}:${l}`,
        type: "elapsedWindowReturn",
        windowSeconds: l
      },
      t,
      n,
      r
    )
  ), o = i.filter((l) => l.value != null).sort(
    (l, f) => (f.value ?? -1 / 0) - (l.value ?? -1 / 0) || (l.window ?? 1 / 0) - (f.window ?? 1 / 0)
  )[0] ?? null, a = ne(t.candlesByTimeframe[r] ?? [], r, n), s = Re({
    series: t,
    asOf: n,
    timeframe: r,
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
    historyCandles: Kt(
      a,
      a.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: C(e),
    notes: o ? o.dataQualityNotes : [Q("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = vr(s, e), u = [...i, s];
  return {
    result: at(
      e,
      c,
      u,
      c ? (o == null ? void 0 : o.observationId) ?? null : null,
      (o == null ? void 0 : o.value) == null ? "Maximum elapsed return unavailable" : `Winning ${wr(o.window ?? 0)} return ${Ze(o.value)}`
    ),
    observations: u,
    anchor: null
  };
}
function lr(e, t, n) {
  const r = e.analysisTimeframe, i = ne(t.candlesByTimeframe[r] ?? [], r, n), o = i.at(-1) ?? null, a = Ho(i, e.emaPeriod).at(-1) ?? null, s = Vo(i, e.atrPeriod).at(-1) ?? null, c = o && a != null && s != null && s > 0 ? (o.c - a) / s : null, u = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), l = [];
  o || l.push(Q("NO_COMPLETED_CANDLE", "error", `No completed ${r} candle exists at cutoff`)), (i.length < u || c == null) && l.push(
    Q(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${u} completed ${r} candles`
    )
  );
  const f = Re({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: (o == null ? void 0 : o.bucket) ?? null,
    referenceValue: a,
    value: c,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: i.length,
    historyCandles: i.slice(-u),
    configHash: C(e),
    notes: Yt(l)
  }), d = c != null && i.length >= u && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: at(
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
function ur(e, t, n, r) {
  const i = ne(t.candlesByTimeframe[r] ?? [], r, n), o = i.at(-1) ?? null, a = o ? Qt(i, o.bucket - e.windowSeconds) : null, s = o && a ? o.bucket - e.windowSeconds - a.bucket : null, c = s != null && e.maximumReferenceStalenessSeconds != null && s > e.maximumReferenceStalenessSeconds, u = o && a && !c && $(a.c) ? (o.c / a.c - 1) * 100 : null, l = Do(i, o, e), f = mr(l, u, e.minimumSampleCount), d = [...f.notes];
  return o || d.push(Q("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a ? c && d.push(Q("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(Q("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), Re({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (a == null ? void 0 : a.bucket) ?? null,
    referenceValue: (a == null ? void 0 : a.c) ?? null,
    value: u,
    unit: "percent",
    percentile: f.percentile,
    zScore: f.zScore,
    sampleCount: l.length,
    historyCandles: Kt(
      i,
      o,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: C(e),
    notes: Yt(d)
  });
}
function Co(e) {
  var E;
  const t = e.detectorEvaluations.filter((k) => k.result.passed), n = Rt(
    t.flatMap(
      (k) => k.observations.filter(
        (q) => q.observationId === k.result.winningObservationId
      )
    )
  ), r = ((E = t.find((k) => k.anchor)) == null ? void 0 : E.anchor) ?? null, i = ne(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), o = Cn(e.series, e.asOf, e.profile.scanTimeframe, 86400), a = Cn(e.series, e.asOf, e.profile.scanTimeframe, 172800), s = dr(e.series, e.asOf, e.profile), u = e.detectorEvaluations.flatMap((k) => k.observations).find((k) => k.metricCode === "ema_atr_displacement") ?? null ?? lr(
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
  ).observations[0], l = Lo(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = Rt([
    ...n,
    o,
    a,
    s,
    u
  ]), d = t[0], m = d ? n.find(
    (k) => k.observationId === d.result.winningObservationId
  ) ?? n[0] ?? null : null, v = xo(
    i,
    r,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    m,
    o,
    a,
    s,
    u,
    l
  ), g = $o(
    e.lifecycleHistory,
    e.series,
    e.asOf,
    e.strategyProfile
  ), h = g != null && g.candidate ? g : null, y = (h == null ? void 0 : h.candidate) ?? null, S = (h == null ? void 0 : h.asOf) ?? null, I = h && S != null ? Et({
    logicalObjectId: (y == null ? void 0 : y.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: h.updatedTs,
    knownAt: S,
    snapshot: h
  }) : null, _ = y ? Et({
    logicalObjectId: y.id,
    objectType: "SetupCandidateEpisode",
    eventTime: y.detectionEventTime,
    knownAt: S ?? y.detectedAt,
    snapshot: y
  }) : null, P = {
    schemaVersion: Ut,
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
    contextObservations: f,
    selectionAnchor: r,
    pathContext: v,
    initialLifecycleCandidateId: (y == null ? void 0 : y.id) ?? null,
    initialLifecycleCandidateRef: _,
    initialLifecycleState: (h == null ? void 0 : h.state) ?? null,
    initialLifecycleStateRef: I,
    initialMtfStructure: l,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: Yt([
      ...f.flatMap((k) => k.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, w = `radar-episode:${j({
    symbol: P.symbol,
    source: P.source,
    profileHash: P.selectionProfileHash,
    detectedAt: P.detectedAt,
    triggeringObservationIds: n.map((k) => k.observationId)
  })}`, p = { ...P, id: w, logicalObjectId: w };
  return b({
    ...p,
    observationId: Gt(p)
  });
}
function Io(e, t, n, r) {
  const i = Object.keys(t.candlesByTimeframe).filter(
    (c) => ne(t.candlesByTimeframe[c] ?? [], c, e.detectedAt).length > 0
  ).sort(Zt), o = Object.fromEntries(
    i.map((c) => {
      var l, f;
      const u = ne(t.candlesByTimeframe[c] ?? [], c, e.detectedAt);
      return [
        c,
        {
          availableStart: ((l = u[0]) == null ? void 0 : l.bucket) ?? null,
          availableEnd: ((f = u.at(-1)) == null ? void 0 : f.bucket) ?? null,
          completedThrough: u.at(-1) ? ue(u.at(-1), c) : null,
          completedCandleCount: u.length
        }
      ];
    })
  ), a = i.filter(
    (c) => o[c].completedCandleCount > 0
  ), s = {
    schemaVersion: sr,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: pr(n),
    lifecycleVersion: X,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: a,
    preRollRequirements: jo(n),
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
  return b({
    ...s,
    id: fr(s)
  });
}
function fr(e) {
  const { id: t, ...n } = e;
  return `replay-case:${j(n)}`;
}
function Gt(e) {
  const { observationId: t, ...n } = e;
  return `radar-episode-observation:${j(n)}`;
}
function Cn(e, t, n, r) {
  const i = {
    id: `context-return-${r}`,
    type: "elapsedWindowReturn",
    windowSeconds: r,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: r,
    maximumReferenceStalenessSeconds: null
  }, o = ne(e.candlesByTimeframe[n] ?? [], n, t), a = o.at(-1) ?? null, s = a ? Qt(o, a.bucket - r) : null, c = a && s && $(s.c) ? (a.c / s.c - 1) * 100 : null, u = c == null ? [Q("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return Re({
    series: e,
    asOf: t,
    timeframe: n,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: r,
    referenceTime: (s == null ? void 0 : s.bucket) ?? null,
    referenceValue: (s == null ? void 0 : s.c) ?? null,
    value: c,
    unit: "percent",
    percentile: null,
    zScore: null,
    sampleCount: 0,
    historyCandles: o,
    configHash: C(i),
    notes: u
  });
}
function dr(e, t, n) {
  var f;
  const r = n.scanTimeframe, i = ne(e.candlesByTimeframe[r] ?? [], r, t), o = i.at(-1) ?? null, a = o ? i.filter((d) => d.bucket > o.bucket - n.liquidityPolicy.windowSeconds) : [], s = a.map(
    (d) => _e(d.v_quote) ? d.v_quote : _e(d.v_base) ? d.v_base * d.c : null
  ), c = s.length > 0 && s.every((d) => d != null), u = c ? s.reduce((d, m) => d + (m ?? 0), 0) : null, l = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return Re({
    series: e,
    asOf: t,
    timeframe: r,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((f = a[0]) == null ? void 0 : f.bucket) ?? null,
    referenceValue: null,
    value: u,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: a.length,
    historyCandles: a,
    configHash: C(l),
    notes: c ? [] : [Q("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function Re(e) {
  var l, f;
  const t = ((l = e.historyCandles[0]) == null ? void 0 : l.bucket) ?? null, n = ((f = e.historyCandles.at(-1)) == null ? void 0 : f.bucket) ?? null, r = e.timeframe && e.historyCandles.at(-1) ? ue(e.historyCandles.at(-1), e.timeframe) : e.asOf, i = e.timeframe ? e.historyCandles.reduce(
    (d, m) => Math.max(d, de(m, e.timeframe)),
    r
  ) : e.asOf, o = C(
    e.historyCandles.map((d) => ({
      bucket: d.bucket,
      ts: d.ts,
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      vBase: _e(d.v_base) ? d.v_base : null,
      vQuote: _e(d.v_quote) ? d.v_quote : null,
      ver: _e(d.ver) ? d.ver : null,
      knownAt: e.timeframe ? de(d, e.timeframe) : null
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
    schemaVersion: qt,
    logicalObjectId: a,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    effectiveAsOf: r,
    knownAt: i,
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
  return b({
    ...s,
    observationId: c,
    requestId: `radar-observation-request:${j({ observationId: c, requestedAsOf: u })}`,
    requestedAsOf: u
  });
}
function xo(e, t, n, r, i, o, a, s, c) {
  const u = t ? e.find((h) => h.bucket === t.timestamp) ?? null : null, f = (u ? e.filter((h) => h.bucket <= u.bucket) : []).reduce((h, y) => $(y.c) && (!h || y.c > h.c || y.c === h.c && y.bucket < h.bucket) ? y : h, null), d = e.at(-1) ?? null, m = t && f && $(f.c) ? (t.price / f.c - 1) * 100 : null, v = t && f && d && f.c > t.price ? (d.c - t.price) / (f.c - t.price) : null, g = t && m != null && m < -5 ? ["rebound_after_drawdown"] : ["unknown"];
  return {
    net24hReturnPct: i.value,
    net48hReturnPct: o.value,
    triggeringLocalImpulseReturnPct: (r == null ? void 0 : r.unit) === "percent" ? r.value : null,
    triggeringDetectorId: n,
    triggeringWindowSeconds: (r == null ? void 0 : r.window) ?? null,
    selectionAnchorPrice: (t == null ? void 0 : t.price) ?? null,
    selectionAnchorTime: (t == null ? void 0 : t.timestamp) ?? null,
    selectionAnchorAgeSeconds: (t == null ? void 0 : t.ageSeconds) ?? null,
    priorPeakPrice: (f == null ? void 0 : f.c) ?? null,
    priorPeakTime: (f == null ? void 0 : f.bucket) ?? null,
    priorDrawdownPct: m,
    recoveryFraction: v,
    currentAtrDisplacement: s.value,
    triggeringPercentile: (r == null ? void 0 : r.percentile) ?? null,
    triggeringZScore: (r == null ? void 0 : r.zScore) ?? null,
    quoteNotional: a.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([h, y]) => [
        h,
        typeof y.snapshot == "object" && y.snapshot != null && !Array.isArray(y.snapshot) && typeof y.snapshot.state == "string" ? y.snapshot.state : "unknown"
      ])
    ),
    contextTags: g
  };
}
function Po(e, t, n, r, i, o) {
  const a = [];
  return {
    results: n.hardGates.map((c) => {
      if (c === "sourcePolicy") {
        const d = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
        return Te(c, d, d ? "Source allowed" : "Source excluded", []);
      }
      if (c === "dataQuality") {
        const d = Rt(r.flatMap((v) => v.observations));
        a.push(...d);
        const m = !r.some(
          (v) => v.observations.some(
            (g) => g.dataQualityNotes.some((h) => h.severity === "error")
          )
        );
        return Te(
          c,
          m,
          m ? "Required metrics available" : "Required metric data unavailable",
          d
        );
      }
      if (c === "executionVenueEligibility") {
        a.push(i);
        const d = Wo(i.status, n.executionVenuePolicy.mode);
        return Te(
          c,
          d,
          `Execution venue ${i.status}`,
          [i]
        );
      }
      if (c === "selectedUniverse") {
        const d = qo(o, e, t);
        return d && a.push(d), Te(
          c,
          (d == null ? void 0 : d.included) === !0,
          d ? d.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown",
          d ? [d] : []
        );
      }
      const u = dr(e, t, n);
      a.push(u);
      const l = n.liquidityPolicy.minimumQuoteNotional, f = l == null || u.value == null ? l == null || n.liquidityPolicy.missingData === "warn" : u.value >= l;
      return Te(
        c,
        f,
        l == null ? "No minimum liquidity configured" : u.value == null ? "Quote-notional history unavailable" : `Quote notional ${u.value} versus ${l} minimum`,
        [u]
      );
    }),
    evidence: Yo(a)
  };
}
function Te(e, t, n, r) {
  return {
    code: e,
    passed: t,
    explanation: n,
    evidenceObservationIds: [...new Set(r.map((i) => i.observationId))].sort(),
    evidenceRequestIds: [
      ...new Set(
        r.flatMap(
          (i) => i.schemaVersion === qt ? [i.requestId] : []
        )
      )
    ].sort()
  };
}
function Oo(e, t, n, r) {
  const i = n.executionVenuePolicy.intendedVenue ?? "ignored", o = [...r].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.executionVenue.toLowerCase() === i.toLowerCase() && s.knownAt <= t && s.effectiveFrom <= t && (s.effectiveTo == null || s.effectiveTo >= t)
  );
  for (const s of o)
    if (ot(s) !== s.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
  const a = Xt(
    o,
    (s) => [s.effectiveFrom, s.knownAt],
    "execution-venue eligibility"
  );
  return a || Eo({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: i,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      Q(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function No(e, t, n, r) {
  const i = {
    logicalObjectId: `selection-anchor:${j({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - ue(n, r.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: r.observationId
  };
  return b({
    ...i,
    observationId: `selection-anchor-observation:${j(i)}`
  });
}
function vt(e, t, n, r, i) {
  const o = {
    schemaVersion: go,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: r,
    rearmState: i
  };
  return b({
    ...o,
    observationId: `radar-status:${j(o)}`
  });
}
function _o(e, t, n, r, i, o, a, s, c) {
  const u = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: r,
    hardGateEvidence: i,
    evaluable: c,
    detectorGatePassed: o,
    hardGatesPassed: a,
    compositePassed: s
  };
  return b({
    ...u,
    id: `radar-gate:${j(u)}`
  });
}
function at(e, t, n, r, i) {
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
    winningObservationId: r,
    winningObservationRequestId: ((a = n.find((s) => s.observationId === r)) == null ? void 0 : a.requestId) ?? null,
    explanation: i
  };
}
function ne(e, t, n) {
  return Nt(e, t, n);
}
function Fo(e, t, n) {
  const r = V(t);
  return e.filter((i) => {
    if (!Number.isFinite(i.bucket))
      throw new RangeError("Candle bucket must be finite");
    if (i.bucket + r > n) return !1;
    if (i.knownAt != null && !Number.isFinite(i.knownAt))
      throw new RangeError(`Invalid candle revision time for bucket ${i.bucket}`);
    return de(i, t) <= n;
  });
}
function Mo(e, t) {
  if (!e.symbol.trim() || !e.source.trim())
    throw new RangeError("Radar symbol and market-data source are required");
  const n = Object.fromEntries(
    Object.entries(e.candlesByTimeframe).map(([r, i]) => (be(r), [r, Fo(i, r, t)]))
  );
  return {
    symbol: e.symbol,
    source: e.source,
    dataOrigin: e.dataOrigin ?? null,
    candlesByTimeframe: n
  };
}
function Lo(e, t, n) {
  const r = e.filter(
    (o) => o.symbol.toUpperCase() === t.symbol.toUpperCase() && o.source === t.source && o.knownAt <= n
  );
  for (const o of r)
    if (cr(o) !== o.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
  const i = /* @__PURE__ */ new Map();
  for (const o of new Set(r.map((a) => a.timeframe))) {
    const a = Xt(
      r.filter((s) => s.timeframe === o),
      (s) => [s.knownAt, s.eventTime],
      `market-structure ${o}`
    );
    a && i.set(o, a);
  }
  return Object.fromEntries(
    [...i.entries()].sort(([o], [a]) => Zt(o, a)).map(
      ([o, a]) => [
        o,
        Et({
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
function Qt(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function Do(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, i = [];
  for (const o of e) {
    if (o.bucket < r || o.bucket >= t.bucket) continue;
    const a = Qt(e, o.bucket - n.windowSeconds);
    if (!a || !$(a.c)) continue;
    const s = o.bucket - n.windowSeconds - a.bucket;
    n.maximumReferenceStalenessSeconds != null && s > n.maximumReferenceStalenessSeconds || i.push((o.c / a.c - 1) * 100);
  }
  return i;
}
function Bo(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, i = [];
  for (const o of e) {
    if (o.bucket < r || o.bucket >= t.bucket) continue;
    const a = e.filter(
      (s) => s.bucket <= o.bucket && s.bucket >= o.bucket - n.lookbackSeconds && o.bucket - s.bucket <= n.maximumTroughAgeSeconds && $(s.c)
    ).sort((s, c) => s.c - c.c || s.bucket - c.bucket)[0];
    a && i.push((o.c / a.c - 1) * 100);
  }
  return i;
}
function mr(e, t, n) {
  const r = [];
  if (e.length < n && r.push(
    Q(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: r };
  const i = e.filter((u) => u <= t).length / e.length * 100, o = e.reduce((u, l) => u + l, 0) / e.length, a = e.reduce((u, l) => u + (l - o) ** 2, 0) / e.length, s = Math.sqrt(a), c = s > 0 ? (t - o) / s : null;
  return { percentile: i, zScore: c, notes: r };
}
function Kt(e, t, n) {
  return t ? e.filter((r) => r.bucket >= t.bucket - n) : [];
}
function vr(e, t) {
  return e.value != null && Ne(e.value, t.minimumReturnPct) && Ne(e.percentile, t.minimumPercentile) && Ne(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function Ho(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let r = e.slice(0, t).reduce((o, a) => o + a.c, 0) / t;
  n[t - 1] = r;
  const i = 2 / (t + 1);
  for (let o = t; o < e.length; o += 1)
    r = e[o].c * i + r * (1 - i), n[o] = r;
  return n;
}
function Vo(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  const r = e.map((o, a) => {
    var c;
    const s = ((c = e[a - 1]) == null ? void 0 : c.c) ?? o.c;
    return Math.max(o.h - o.l, Math.abs(o.h - s), Math.abs(o.l - s));
  });
  let i = r.slice(0, t).reduce((o, a) => o + a, 0) / t;
  n[t - 1] = i;
  for (let o = t; o < r.length; o += 1)
    i = (i * (t - 1) + r[o]) / t, n[o] = i;
  return n;
}
function $o(e, t, n, r) {
  const i = e.filter(
    (s) => s.candidate != null && s.asOf != null && s.asOf <= n
  );
  for (const s of i)
    Uo(s, t, n, r);
  const o = Math.max(...i.map((s) => s.asOf ?? -1 / 0)), a = i.filter((s) => s.asOf === o);
  if (new Set(a.map((s) => T(s))).size > 1)
    throw new Error(`Conflicting lifecycle snapshots at ${o}`);
  return a[0] ?? null;
}
function Uo(e, t, n, r) {
  if (e.setupFamily !== "impulse_fade_v1" || e.lifecycleVersion !== X || e.lifecycleVersion !== r.lifecycleVersion || e.lifecycleConfigHash !== r.lifecycleConfigHash || e.executionTimeframe !== r.timeframeRoles.executionTimeframe)
    throw new Error("Lifecycle snapshot is incompatible with the manifest strategy profile");
  G(e.asOf, n, "lifecycle asOf"), G(e.updatedTs, n, "lifecycle updatedTs"), G(e.stateSince, n, "lifecycle stateSince");
  const i = e.candidate;
  if (i) {
    const o = [t.source, t.dataOrigin].filter((s) => s != null).some((s) => s.toLowerCase() === i.source.toLowerCase()), a = !i.venue.trim() || i.venue.toLowerCase() === t.source.toLowerCase();
    if (i.symbol.toUpperCase() !== t.symbol.toUpperCase() || !o || !a || i.setupFamily !== e.setupFamily || i.lifecycleVersion !== e.lifecycleVersion || i.lifecycleConfigHash !== e.lifecycleConfigHash || i.executionTimeframe !== r.timeframeRoles.executionTimeframe)
      throw new Error("Lifecycle candidate does not match the radar series and lifecycle identity");
    for (const [s, c] of [
      ["candidate detectedAt", i.detectedAt],
      ["candidate detectionEventTime", i.detectionEventTime],
      ["candidate episodeHighTime", i.episodeHighTime],
      ["candidate stateSince", i.stateSince],
      ["candidate terminalAt", i.terminalAt]
    ])
      G(c, n, s);
    for (const s of i.initialMtfContext)
      G(s.updatedTs, n, "candidate MTF context updatedTs");
  }
  for (const o of e.evidence)
    if (G(o.eventTime, n, "lifecycle evidence eventTime"), G(o.knownAt, n, "lifecycle evidence knownAt"), o.knownAt < o.eventTime)
      throw new Error("Lifecycle evidence knownAt precedes eventTime");
  for (const o of e.transitions)
    G(o.knownAt, n, "lifecycle transition knownAt");
  for (const [o, a] of [
    ["active break", e.activeBreakLevel],
    ["retest", e.retestLevel]
  ])
    if (a && (G(a.eventTime, n, `${o} eventTime`), G(a.knownAt, n, `${o} knownAt`), a.knownAt < a.eventTime))
      throw new Error(`${o} knownAt precedes eventTime`);
  for (const o of e.confluence)
    if (G(o.eventTime, n, "lifecycle confluence eventTime"), G(o.knownAt, n, "lifecycle confluence knownAt"), o.eventTime != null && o.knownAt != null && o.knownAt < o.eventTime)
      throw new Error("Lifecycle confluence knownAt precedes eventTime");
}
function G(e, t, n) {
  if (e != null && (!Number.isFinite(e) || e > t))
    throw new Error(`${n} exceeds the radar cutoff`);
}
function qo(e, t, n) {
  const r = [...e].filter(
    (i) => i.symbol.toUpperCase() === t.symbol.toUpperCase() && i.source === t.source && i.knownAt <= n && i.effectiveFrom <= n && (i.effectiveTo == null || i.effectiveTo >= n)
  );
  for (const i of r)
    if (it(i) !== i.observationId)
      throw new Error("Universe membership observation failed deterministic verification");
  return Xt(
    r,
    (i) => [i.effectiveFrom, i.knownAt],
    "universe membership"
  );
}
function jo(e) {
  const t = /* @__PURE__ */ new Map();
  function n(r, i, o, a) {
    const s = t.get(r) ?? { duration: 0, bars: 0, purposes: /* @__PURE__ */ new Set() };
    s.duration = Math.max(s.duration, i), s.bars = Math.max(s.bars, o), s.purposes.add(a), t.set(r, s);
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
  return [...t.entries()].sort(([r], [i]) => Zt(r, i)).map(([r, i]) => ({
    timeframe: r,
    minimumDurationSeconds: i.duration,
    minimumBars: i.bars,
    purposes: [...i.purposes].sort()
  }));
}
function zo(e, t) {
  const n = e.filter((i) => i.passed).length, r = e.filter((i) => !i.evaluable).length;
  return t.mode === "all" ? {
    passed: n === e.length,
    evaluable: e.some((i) => i.evaluable && !i.passed) || r === 0
  } : t.mode === "atLeast" ? {
    passed: n >= t.count,
    evaluable: n >= t.count || n + r < t.count
  } : {
    passed: n > 0,
    evaluable: n > 0 || r === 0
  };
}
function Wo(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Go(e, t) {
  const n = be(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function M(e) {
  throw new RangeError(e);
}
function hr(e) {
  var n;
  e.schemaVersion !== ar && M("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && M("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && M("Only impulse_fade_v1 radar profiles are supported");
  try {
    be(e.scanTimeframe);
  } catch {
    M("scanTimeframe must be valid");
  }
  e.evaluationCadence.mode !== "completedScanCandle" && M("Only completed-scan-candle evaluation is supported"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && M("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || M("At least one move detector is required"), new Set(e.moveDetectors.map((r) => r.id)).size !== e.moveDetectors.length && M("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && M("Hard gates must be unique");
  const t = /* @__PURE__ */ new Set([
    "dataQuality",
    "liquidity",
    "selectedUniverse",
    "sourcePolicy",
    "executionVenueEligibility"
  ]);
  e.hardGates.some((r) => !t.has(r)) && M("Radar profile contains an unsupported hard gate"), ["any", "all", "atLeast"].includes(e.detectorCombination.mode) || M("Radar profile contains an unsupported detector combination"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && M("atLeast detector count must be between one and the detector count"), (!$(e.episodeExpiry.maximumAgeSeconds) || !$(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && M("Episode expiry, reset duration, and createdAt must be valid"), (e.sourcePolicy.allowedSources != null && (e.sourcePolicy.allowedSources.some((r) => !r.trim()) || new Set(e.sourcePolicy.allowedSources).size !== e.sourcePolicy.allowedSources.length) || !["requireKnownAvailable", "allowUnknown", "ignore", "rejectKnownUnavailable"].includes(
    e.executionVenuePolicy.mode
  ) || e.executionVenuePolicy.mode !== "ignore" && !((n = e.executionVenuePolicy.intendedVenue) != null && n.trim()) || e.liquidityPolicy.minimumQuoteNotional != null && (!Number.isFinite(e.liquidityPolicy.minimumQuoteNotional) || e.liquidityPolicy.minimumQuoteNotional < 0) || !$(e.liquidityPolicy.windowSeconds) || !["fail", "warn"].includes(e.liquidityPolicy.missingData)) && M("Radar profile policies are invalid");
  for (const r of e.moveDetectors) Qo(r);
}
function Qo(e) {
  if (e.id.trim() || M("Detector ID is required"), ["elapsedWindowReturn", "rollingTroughRunup", "emaAtrDisplacement", "maximumWindowReturn"].includes(e.type) || M(`Detector ${e.id} has an unsupported type`), (!Number.isInteger(e.minimumSampleCount) || e.minimumSampleCount < 0) && M(`Detector ${e.id} has an invalid sample count`), e.type === "emaAtrDisplacement") {
    (!Ot(e.analysisTimeframe) || !Number.isInteger(e.emaPeriod) || e.emaPeriod < 1 || !Number.isInteger(e.atrPeriod) || e.atrPeriod < 1 || !Number.isFinite(e.minimumAtrDisplacement)) && M(`Detector ${e.id} has invalid EMA/ATR settings`);
    return;
  }
  if ((!$(e.historyLookbackSeconds) || !ht(e.minimumPercentile, 0, 100) || !ht(e.minimumZScore)) && M(`Detector ${e.id} contains invalid statistical settings`), e.type === "rollingTroughRunup") {
    (!$(e.lookbackSeconds) || !Number.isFinite(e.minimumRunupPct) || e.minimumRunupPct < 0 || !$(e.maximumTroughAgeSeconds) || e.referenceField !== "close") && M(`Detector ${e.id} has invalid rolling-trough settings`);
    return;
  }
  (!ht(e.minimumReturnPct) || e.maximumReferenceStalenessSeconds != null && (!Number.isFinite(e.maximumReferenceStalenessSeconds) || e.maximumReferenceStalenessSeconds < 0)) && M(`Detector ${e.id} has invalid return settings`), e.type === "elapsedWindowReturn" && !$(e.windowSeconds) && M(`Detector ${e.id} requires a positive window`), e.type === "maximumWindowReturn" && (!e.windowsSeconds.length || e.windowsSeconds.some((t) => !$(t)) || new Set(e.windowsSeconds).size !== e.windowsSeconds.length) && M(`Detector ${e.id} requires unique positive windows`);
}
function Ko(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Wt(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
  const { canonicalConfigHash: t, ...n } = e.selectionProfile;
  if (hr(n), e.strategyProfile) {
    if (rt(e.strategyProfile) !== e.strategyProfile.profileHash)
      throw new Error("Strategy profile failed deterministic hash verification");
    const { profileHash: r, ...i } = e.strategyProfile;
    rr(i);
  }
}
function ht(e, t = -1 / 0, n = 1 / 0) {
  return e == null || Number.isFinite(e) && e >= t && e <= n;
}
function Ne(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function $(e) {
  return Number.isFinite(e) && e > 0;
}
function _e(e) {
  return e != null && Number.isFinite(e);
}
function Q(e, t, n) {
  return { code: e, severity: t, message: n };
}
function Yt(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function Rt(e) {
  return [...new Map(e.map((t) => [t.requestId, t])).values()].sort(yr);
}
function Yo(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(
    (t, n) => t.observationId.localeCompare(n.observationId)
  );
}
function Xt(e, t, n) {
  if (!e.length) return null;
  const r = [...e].sort((s, c) => {
    const u = t(s), l = t(c);
    for (let f = 0; f < Math.max(u.length, l.length); f += 1) {
      const d = (u[f] ?? -1 / 0) - (l[f] ?? -1 / 0);
      if (d !== 0) return d;
    }
    return s.observationId.localeCompare(c.observationId);
  }), i = r.at(-1), o = t(i), a = r.filter((s) => {
    const c = t(s);
    return c.length === o.length && c.every((u, l) => u === o[l]);
  });
  if (new Set(a.map((s) => s.observationId)).size > 1)
    throw new Error(`Conflicting ${n} observations at the same precedence`);
  return i;
}
function yr(e, t) {
  return e.requestedAsOf - t.requestedAsOf || e.observationId.localeCompare(t.observationId) || e.requestId.localeCompare(t.requestId);
}
function Xo(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function Zo(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function Jo(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function Zt(e, t) {
  return be(e) - be(t) || e.localeCompare(t);
}
function be(e) {
  return V(e);
}
function pr(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function Ze(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function wr(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function j(e) {
  return C(e).slice(8);
}
function Ds(e) {
  return T(e);
}
const gr = /* @__PURE__ */ new WeakMap();
function ea(e, t) {
  gr.set(e, t);
}
function W(e) {
  const t = gr.get(e);
  if (!t)
    throw new Error("ReplayLoadedCase is not bound to its privileged historical-data bundle");
  return t;
}
const Se = "replay-engine.1", Jt = "replay-session-config.1", br = "replay-session.1", Ar = "replay-command.1", Er = "replay-event.1", ta = "replay-decision-frame.1", na = "replay-wake-plan.1", ra = "replay-wake-condition.1", ia = "replay-wake-result.1", oa = "replay-data-bundle.1", Rr = "replay-outcome-envelope.1", en = "replay-analysis-state.1", tn = "replay-known-event.1";
var K, He, St;
class Bs {
  constructor(t) {
    pe(this, He);
    pe(this, K);
    Ue(this, K, b({
      ...t,
      analysisStateHistory: t.analysisStateHistory ?? [],
      knownEvents: t.knownEvents ?? [],
      venueEvidence: t.venueEvidence ?? [],
      universeEvidence: t.universeEvidence ?? [],
      revisionHistoryAvailable: t.revisionHistoryAvailable ?? !1
    }));
  }
  async getCoverage(t) {
    var r, i;
    const n = oe(this, He, St).call(this, t);
    return {
      timeframe: t.timeframe,
      earliestOpenTime: ((r = n[0]) == null ? void 0 : r.openTime) ?? null,
      latestCloseTime: ((i = n.at(-1)) == null ? void 0 : i.closeTime) ?? null,
      revisionHistoryAvailable: L(this, K).revisionHistoryAvailable ?? !1
    };
  }
  async loadCandleHistory(t) {
    return b(
      oe(this, He, St).call(this, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions() {
    return [];
  }
  async loadAnalysisStateHistory(t) {
    return b(
      (L(this, K).analysisStateHistory ?? []).filter(
        (n) => Fe(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return b(
      (L(this, K).knownEvents ?? []).filter(
        (n) => Fe(n, t) && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadPointInTimeVenueEvidence(t) {
    return b(
      (L(this, K).venueEvidence ?? []).filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return b(
      (L(this, K).universeEvidence ?? []).filter(
        (n) => Fe(n, t) && n.knownAt <= t.to && n.effectiveFrom <= t.to && (n.effectiveTo == null || n.effectiveTo >= t.from)
      )
    );
  }
  async loadRadarEpisode(t) {
    return b(
      L(this, K).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
K = new WeakMap(), He = new WeakSet(), St = function(t) {
  return [...L(this, K).candles].filter(
    (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.timeframe === t.timeframe
  ).sort(
    (n, r) => n.openTime - r.openTime || n.knownAt - r.knownAt || n.observationId.localeCompare(r.observationId)
  );
};
function nn(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return C(n);
}
function aa(e, t) {
  if (e.schemaVersion !== Jt || e.replayEngineVersion !== Se)
    throw new RangeError("Unsupported replay session configuration version");
  if (!e.id.trim() || !e.version.trim())
    throw new TypeError("Replay session configuration id and version are required");
  kr(e.strategyProfileRef, t);
  const n = e.evaluationTimeframe ?? t.timeframeRoles.executionTimeframe;
  V(n);
  const r = cn(e.visibleTimeframes);
  if (!r.includes(n))
    throw new RangeError("The evaluation timeframe must be visible in Replay Phase 1");
  if (!e.completedCandlesOnly)
    throw new RangeError("Replay Phase 1 requires completedCandlesOnly=true");
  if (In(e.maximumCaseDuration, "maximumCaseDuration"), In(e.maximumSingleWaitDuration, "maximumSingleWaitDuration"), e.defaultWaitDeadline != null && (e.defaultWaitDeadline <= 0 || e.defaultWaitDeadline > e.maximumSingleWaitDuration))
    throw new RangeError("defaultWaitDeadline must fit within maximumSingleWaitDuration");
  for (const a of r) {
    const s = e.displayPreRollByTimeframe[a];
    if (!Number.isFinite(s) || s < 0)
      throw new RangeError(`Missing non-negative display pre-roll for ${a}`);
  }
  const i = [...new Set(e.allowedWakeConditionTypes)];
  if (!i.length)
    throw new RangeError("At least one wake condition type must be allowed");
  const o = {
    ...e,
    evaluationTimeframe: n,
    visibleTimeframes: r,
    displayPreRollByTimeframe: Object.fromEntries(
      Object.entries(e.displayPreRollByTimeframe).sort(
        ([a], [s]) => a.localeCompare(s)
      )
    ),
    allowedWakeConditionTypes: i,
    defaultWaitDeadline: e.defaultWaitDeadline ?? null,
    identityPresentationMode: e.identityPresentationMode ?? null,
    endOnRadarEpisodeTerminal: e.endOnRadarEpisodeTerminal ?? !1,
    endOnLifecycleTerminal: e.endOnLifecycleTerminal ?? !1,
    venueRulesRef: e.venueRulesRef ?? null
  };
  return b({
    ...o,
    canonicalConfigHash: nn(o)
  });
}
function Hs(e) {
  const t = cn([
    e.timeframeRoles.executionTimeframe,
    e.timeframeRoles.structureTimeframe,
    ...e.timeframeRoles.contextTimeframes
  ]);
  return aa(
    {
      id: "impulse_fade_v1.replay.research.default",
      version: "1",
      schemaVersion: Jt,
      replayEngineVersion: Se,
      visibleTimeframes: t,
      displayPreRollByTimeframe: Object.fromEntries(
        t.map((n) => [
          n,
          Math.max(V(n) * 200, 86400)
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
function rn(e) {
  return `replay-candle:${e.source}:${e.symbol.toUpperCase()}:${e.timeframe}:${e.openTime}`;
}
function on(e) {
  const { observationId: t, ...n } = e;
  return `replay-candle-observation:${C(n).slice(8)}`;
}
function sa(e) {
  const t = V(e.timeframe);
  if (!Number.isFinite(e.openTime) || e.openTime < 0)
    throw new RangeError("Candle openTime must be a non-negative finite timestamp");
  if (e.openTime % t !== 0)
    throw new RangeError("Candle openTime must align to its timeframe");
  for (const [o, a] of Object.entries({ o: e.o, h: e.h, l: e.l, c: e.c }))
    if (!Number.isFinite(a) || a <= 0) throw new RangeError(`Candle ${o} must be positive`);
  if (e.h < Math.max(e.o, e.c) || e.l > Math.min(e.o, e.c))
    throw new RangeError("Candle high/low do not contain open and close");
  const n = e.openTime + t, r = e.knownAt ?? e.correctionPublishedAt ?? n;
  if (!Number.isFinite(r) || r < n)
    throw new RangeError("Candle knownAt cannot precede its close");
  if (e.correctionPublishedAt != null && (!Number.isFinite(e.correctionPublishedAt) || e.correctionPublishedAt < n || e.correctionPublishedAt > r))
    throw new RangeError("Correction publication time must fall between closeTime and knownAt");
  if (e.revision != null && (!Number.isInteger(e.revision) || e.revision < 0))
    throw new RangeError("Candle revision must be a non-negative integer");
  const i = {
    logicalCandleId: rn(e),
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
    knownAt: r,
    revision: e.revision ?? null,
    correctionPublishedAt: e.correctionPublishedAt ?? null
  };
  return b({ ...i, observationId: on(i) });
}
function st(e) {
  const { id: t, ...n } = e;
  return `replay-analysis-state:${C(n).slice(8)}`;
}
function Vs(e) {
  if (kt(e.knownAt, "analysis state knownAt"), e.lifecycle.asOf == null || e.lifecycle.asOf > e.knownAt)
    throw new RangeError("Analysis lifecycle must be evaluated no later than knownAt");
  const t = {
    schemaVersion: en,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return b({ ...t, id: st(t) });
}
function an(e) {
  const { id: t, ...n } = e;
  return `replay-known-event:${C(n).slice(8)}`;
}
function $s(e) {
  if (kt(e.eventTime, "eventTime"), kt(e.knownAt, "knownAt"), e.knownAt < e.eventTime) throw new RangeError("Event knownAt cannot precede eventTime");
  e.timeframe != null && V(e.timeframe);
  const t = {
    schemaVersion: tn,
    ...e,
    symbol: e.symbol.toUpperCase()
  };
  return b({ ...t, id: an(t) });
}
async function Us(e) {
  var w, p, E, k, q, z;
  ca(e);
  const { manifest: t, sessionConfig: n, historicalDataAdapter: r } = e, i = await ((w = r.loadRadarEpisode) == null ? void 0 : w.call(r, t.radarEpisodeId));
  if (!i) throw new Error("Exact RadarEpisode sidecar is required for replay loading");
  la(t, i);
  const o = cn([
    ...n.visibleTimeframes,
    n.evaluationTimeframe,
    ...t.preRollRequirements.map((x) => x.timeframe)
  ]), a = t.startAsOf + n.maximumCaseDuration, s = {}, c = {}, u = {}, l = [];
  for (const x of o) {
    const F = ya(t, e.strategyProfile, x), O = Math.max(0, t.startAsOf - F), $e = n.displayPreRollByTimeframe[x] ?? 0, mn = Math.max(0, t.startAsOf - $e);
    s[x] = O, c[x] = mn;
    const ye = await r.getCoverage({
      symbol: t.symbol,
      source: t.source,
      timeframe: x
    });
    if (ye.timeframe !== x) throw new Error(`Coverage timeframe mismatch for ${x}`);
    if (ye.earliestOpenTime == null || ye.earliestOpenTime > O)
      throw new RangeError(`INSUFFICIENT_ANALYSIS_PREROLL:${x}`);
    ye.earliestOpenTime > mn && l.push({
      code: "INSUFFICIENT_DISPLAY_PREROLL",
      severity: "warning",
      message: `${x} display history begins after the configured display pre-roll`
    }), ye.revisionHistoryAvailable || l.push({
      code: "IMMUTABLE_CANDLE_AT_CLOSE_ASSUMED",
      severity: "warning",
      message: `${x} candle revision history is unavailable`
    });
    const zr = await r.loadCandleHistory({
      symbol: t.symbol,
      source: t.source,
      timeframe: x,
      from: O,
      to: a
    }), Wr = ye.revisionHistoryAvailable ? await ((p = r.loadCandleRevisions) == null ? void 0 : p.call(r, {
      symbol: t.symbol,
      source: t.source,
      timeframe: x,
      from: O,
      to: a
    })) ?? [] : [];
    u[x] = ua(
      [...zr, ...Wr].filter((Gr) => Gr.knownAt <= a),
      t,
      x,
      O,
      a
    );
  }
  const f = {
    symbol: t.symbol,
    source: t.source,
    from: Math.min(...Object.values(s)),
    to: a
  }, d = fa(
    await ((E = r.loadAnalysisStateHistory) == null ? void 0 : E.call(r, f)) ?? [],
    t
  );
  if (!d.some((x) => x.knownAt <= t.startAsOf))
    throw new RangeError("MISSING_POINT_IN_TIME_ANALYSIS_STATE_AT_REPLAY_START");
  const m = da(
    await ((k = r.loadKnownEvents) == null ? void 0 : k.call(r, f)) ?? [],
    t
  ), v = ma(
    await ((q = r.loadPointInTimeVenueEvidence) == null ? void 0 : q.call(r, f)) ?? [],
    t
  ), g = va(
    await ((z = r.loadPointInTimeUniverseEvidence) == null ? void 0 : z.call(r, f)) ?? [],
    t
  ), h = {
    schemaVersion: oa,
    symbol: t.symbol.toUpperCase(),
    source: t.source,
    analysisStartByTimeframe: s,
    displayStartByTimeframe: c,
    candlesByTimeframe: u,
    analysisStateHistory: d,
    knownEvents: m,
    venueEvidence: v,
    universeEvidence: g,
    radarEpisode: i,
    dataQualityNotes: l
  }, y = await sn(h), S = await Sr(h, t.startAsOf), I = b({
    ...h,
    causalPrefixFingerprint: S,
    internalBundleFingerprint: y
  }), _ = b({
    ...h,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(u).map(([x, F]) => [
        x,
        F.filter(
          (O) => O.closeTime <= t.startAsOf && O.knownAt <= t.startAsOf
        )
      ])
    ),
    analysisStateHistory: d.filter(
      (x) => x.knownAt <= t.startAsOf
    ),
    knownEvents: m.filter((x) => x.knownAt <= t.startAsOf),
    venueEvidence: v.filter((x) => x.knownAt <= t.startAsOf),
    universeEvidence: g.filter((x) => x.knownAt <= t.startAsOf),
    causalPrefixFingerprint: S
  }), P = {
    manifest: b(t),
    sessionConfig: b(n),
    strategyProfile: b(e.strategyProfile),
    radarSelectionProfile: b(e.radarSelectionProfile),
    venueRules: b(e.venueRules ?? null),
    dataBundle: _
  };
  return ea(P, I), P;
}
async function qs(e, t) {
  if (t > e.manifest.startAsOf)
    throw new RangeError("Public replay fingerprinting cannot inspect data after replay start");
  const { causalPrefixFingerprint: n, ...r } = e.dataBundle;
  return Sr(r, t);
}
async function Sr(e, t) {
  return sn({
    schemaVersion: e.schemaVersion,
    symbol: e.symbol,
    source: e.source,
    radarEpisode: e.radarEpisode,
    candlesByTimeframe: Object.fromEntries(
      Object.entries(e.candlesByTimeframe).map(([n, r]) => [
        n,
        r.filter((i) => i.closeTime <= t && i.knownAt <= t)
      ])
    ),
    analysisStateHistory: e.analysisStateHistory.filter((n) => n.knownAt <= t),
    knownEvents: e.knownEvents.filter((n) => n.knownAt <= t),
    venueEvidence: e.venueEvidence.filter((n) => n.knownAt <= t),
    universeEvidence: e.universeEvidence.filter((n) => n.knownAt <= t),
    dataQualityNotes: e.dataQualityNotes
  });
}
async function sn(e) {
  var r;
  if (!((r = globalThis.crypto) != null && r.subtle)) throw new Error("Web Crypto SHA-256 is required");
  const t = new TextEncoder().encode(T(e)), n = await globalThis.crypto.subtle.digest("SHA-256", t);
  return `sha256:${[...new Uint8Array(n)].map((i) => i.toString(16).padStart(2, "0")).join("")}`;
}
function ca(e) {
  const { manifest: t, sessionConfig: n, strategyProfile: r, radarSelectionProfile: i } = e;
  if (t.schemaVersion !== sr || fr(t) !== t.id || t.futureOutcomeRef !== null)
    throw new Error("ReplayCaseManifest failed schema or deterministic identity verification");
  if (t.startAsOf !== t.detectedAt)
    throw new RangeError("Replay must begin at the causal radar detection boundary");
  if (Wt(i) !== i.canonicalConfigHash || t.selectionProfileRef.id !== i.id || t.selectionProfileRef.version !== i.version || t.selectionProfileRef.canonicalConfigHash !== i.canonicalConfigHash)
    throw new Error("Radar selection profile reference mismatch");
  if (rt(r) !== r.profileHash || r.lifecycleVersion !== X || t.lifecycleVersion !== r.lifecycleVersion || t.strategyProfileRef.id !== r.id || t.strategyProfileRef.version !== r.version || t.strategyProfileRef.profileHash !== r.profileHash)
    throw new Error("Strategy profile reference mismatch");
  if (n.schemaVersion !== Jt || n.replayEngineVersion !== Se || nn(n) !== n.canonicalConfigHash)
    throw new Error("Replay configuration failed version or hash verification");
  if (kr(n.strategyProfileRef, r), n.evaluationTimeframe !== r.timeframeRoles.executionTimeframe)
    throw new RangeError("Replay evaluation timeframe must match the strategy execution timeframe");
  if (n.venueRulesRef && !e.venueRules)
    throw new Error("Referenced venue rules were not supplied");
  if (n.venueRulesRef && e.venueRules) {
    const o = pa(e.venueRules);
    if (T(o) !== T(n.venueRulesRef))
      throw new Error("Venue rules reference mismatch");
  }
}
function la(e, t) {
  var r, i, o;
  if (t.schemaVersion !== Ut || t.id !== e.radarEpisodeId || t.observationId !== e.radarEpisodeObservationId || Gt(t) !== t.observationId || t.symbol.toUpperCase() !== e.symbol.toUpperCase() || t.source !== e.source || t.detectedAt !== e.detectedAt || t.effectiveAsOf !== e.startAsOf)
    throw new Error("RadarEpisode sidecar does not match the ReplayCaseManifest");
  if ([
    ...t.triggeringObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...t.contextObservations.flatMap((a) => [a.effectiveAsOf, a.knownAt]),
    ...t.hardGateEvidence.map((a) => a.knownAt),
    (r = t.selectionAnchor) == null ? void 0 : r.timestamp,
    (i = t.initialLifecycleCandidateRef) == null ? void 0 : i.knownAt,
    (o = t.initialLifecycleStateRef) == null ? void 0 : o.knownAt,
    ...Object.values(t.initialMtfStructure).map((a) => a.knownAt)
  ].filter((a) => a != null).some((a) => !Number.isFinite(a) || a > e.startAsOf))
    throw new Error("RadarEpisode contains evidence unavailable at replay start");
}
function ua(e, t, n, r, i) {
  const o = /* @__PURE__ */ new Map();
  for (const s of e) {
    const c = sa({
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
    if (s.symbol.toUpperCase() !== t.symbol.toUpperCase() || s.source !== t.source || s.timeframe !== n || s.openTime < r || s.openTime > i || s.logicalCandleId !== rn(s) || s.observationId !== on(s) || T(s) !== T(c))
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
    Nt(a.map(ha), n, s);
  return b(a);
}
function fa(e, t) {
  const n = [...e].sort((i, o) => i.knownAt - o.knownAt || i.id.localeCompare(o.id)), r = /* @__PURE__ */ new Map();
  for (const i of n) {
    if (i.schemaVersion !== en || i.id !== st(i) || !Fe(i, t))
      throw new Error("Analysis state observation failed provenance verification");
    const o = r.get(i.knownAt);
    if (o && T(o) !== T(i))
      throw new Error(`Conflicting analysis states at ${i.knownAt}`);
    r.set(i.knownAt, i);
  }
  return b([...r.values()]);
}
function da(e, t) {
  const n = [...e].sort((i, o) => i.knownAt - o.knownAt || i.id.localeCompare(o.id)), r = /* @__PURE__ */ new Map();
  for (const i of n) {
    if (i.schemaVersion !== tn || i.id !== an(i) || !Fe(i, t) || i.knownAt < i.eventTime)
      throw new Error("Replay known event failed deterministic verification");
    const o = r.get(i.id);
    if (o && T(o) !== T(i))
      throw new Error(`Conflicting replay known event ${i.id}`);
    r.set(i.id, i);
  }
  return b([...r.values()]);
}
function ma(e, t) {
  return b(
    e.map((n) => {
      var i;
      const r = n;
      if (r.schemaVersion !== jt || ((i = r.symbol) == null ? void 0 : i.toUpperCase()) !== t.symbol.toUpperCase() || r.marketDataSource !== t.source || !Number.isFinite(r.knownAt) || !Number.isFinite(r.effectiveFrom) || r.effectiveTo != null && (!Number.isFinite(r.effectiveTo) || r.effectiveTo <= r.effectiveFrom) || r.observationId !== ot(r))
        throw new Error("Execution-venue evidence failed provenance verification");
      return r;
    }).sort((n, r) => n.knownAt - r.knownAt)
  );
}
function va(e, t) {
  return b(
    e.map((n) => {
      var i;
      const r = n;
      if (r.schemaVersion !== zt || ((i = r.symbol) == null ? void 0 : i.toUpperCase()) !== t.symbol.toUpperCase() || r.source !== t.source || !Number.isFinite(r.knownAt) || !Number.isFinite(r.effectiveFrom) || r.effectiveTo != null && (!Number.isFinite(r.effectiveTo) || r.effectiveTo <= r.effectiveFrom) || r.observationId !== it(r))
        throw new Error("Universe evidence failed provenance verification");
      return r;
    }).sort((n, r) => n.knownAt - r.knownAt)
  );
}
function ha(e) {
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
function ya(e, t, n) {
  const r = e.preRollRequirements.filter((o) => o.timeframe === n).reduce(
    (o, a) => Math.max(
      o,
      a.minimumDurationSeconds,
      a.minimumBars * V(n)
    ),
    0
  ), i = n === t.timeframeRoles.candidateTimeframe ? 180 * 86400 : n === t.timeframeRoles.structureTimeframe || t.timeframeRoles.contextTimeframes.includes(n) ? 90 * 86400 : V(n) * 250;
  return Math.max(r, i);
}
function pa(e) {
  return {
    id: `${e.venue}:${e.symbol}`,
    version: e.feeSchedule.version,
    hash: C(e)
  };
}
function kr(e, t) {
  if (e.id !== t.id || e.version !== t.version || e.profileHash !== t.profileHash)
    throw new Error("Replay strategy profile reference mismatch");
}
function cn(e) {
  const t = [];
  for (const n of e)
    V(n), t.includes(n) || t.push(n);
  if (!t.length) throw new RangeError("At least one timeframe is required");
  return t;
}
function In(e, t) {
  if (!Number.isFinite(e) || e <= 0 || !Number.isInteger(e))
    throw new RangeError(`${t} must be a positive integer number of seconds`);
}
function kt(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
function Fe(e, t) {
  return e.symbol.toUpperCase() === t.symbol.toUpperCase() && e.source === t.source;
}
const xn = "replay-json-data.1";
function wa(e) {
  const t = he(e, "Replay JSON data");
  if (t.schemaVersion !== xn)
    throw new Error("Unsupported Replay JSON data schema");
  const n = Ae(t.symbol, "Replay JSON data symbol").toUpperCase(), r = Ae(t.source, "Replay JSON data source"), i = Ct(t.candles, "candles"), o = Ce(
    t.candleRevisions,
    "candleRevisions"
  ), a = Ct(t.radarEpisodes, "radarEpisodes"), s = Ce(
    t.analysisStateHistory,
    "analysisStateHistory"
  ), c = Ce(t.knownEvents, "knownEvents"), u = Ce(
    t.venueEvidence,
    "venueEvidence"
  ), l = Ce(
    t.universeEvidence,
    "universeEvidence"
  ), f = Ia(
    t.revisionHistoryAvailable,
    "revisionHistoryAvailable"
  );
  if (o.length > 0 && !f)
    throw new Error("Candle revisions require revisionHistoryAvailable=true");
  return ga(i, o, n, r), ba(a, n, r), Aa(s, n, r), Ea(c, n, r), Ra(u, n, r), Sa(l, n, r), b({
    schemaVersion: xn,
    symbol: n,
    source: r,
    candles: Nn(i),
    candleRevisions: Nn(o),
    radarEpisodes: [...a].sort(
      (d, m) => d.detectedAt - m.detectedAt || d.id.localeCompare(m.id)
    ),
    analysisStateHistory: [...s].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    knownEvents: [...c].sort(
      (d, m) => d.knownAt - m.knownAt || d.id.localeCompare(m.id)
    ),
    venueEvidence: [...u].sort(_n),
    universeEvidence: [...l].sort(_n),
    revisionHistoryAvailable: f
  });
}
var B, re, Xe, Tt;
class js {
  constructor(t) {
    pe(this, re);
    pe(this, B);
    Ue(this, B, wa(t));
  }
  async getCoverage(t) {
    var r;
    Cr(t);
    const n = oe(this, re, Xe).call(this, [...L(this, B).candles, ...L(this, B).candleRevisions], t);
    return b({
      timeframe: t.timeframe,
      earliestOpenTime: ((r = n[0]) == null ? void 0 : r.openTime) ?? null,
      latestCloseTime: n.length ? Math.max(...n.map((i) => i.closeTime)) : null,
      revisionHistoryAvailable: L(this, B).revisionHistoryAvailable
    });
  }
  async loadCandleHistory(t) {
    return On(t), b(
      oe(this, re, Xe).call(this, L(this, B).candles, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    );
  }
  async loadCandleRevisions(t) {
    return On(t), L(this, B).revisionHistoryAvailable ? b(
      oe(this, re, Xe).call(this, L(this, B).candleRevisions, t).filter(
        (n) => n.openTime >= t.from && n.openTime <= t.to
      )
    ) : [];
  }
  async loadPointInTimeVenueEvidence(t) {
    return Ge(t), b(
      L(this, B).venueEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.marketDataSource === t.source && Pn(n, t)
      )
    );
  }
  async loadPointInTimeUniverseEvidence(t) {
    return Ge(t), b(
      L(this, B).universeEvidence.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && Pn(n, t)
      )
    );
  }
  async loadAnalysisStateHistory(t) {
    return Ge(t), b(
      L(this, B).analysisStateHistory.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    );
  }
  async loadKnownEvents(t) {
    return Ge(t), oe(this, re, Tt).call(this, t) ? b(
      L(this, B).knownEvents.filter(
        (n) => n.symbol.toUpperCase() === t.symbol.toUpperCase() && n.source === t.source && n.knownAt >= t.from && n.knownAt <= t.to
      )
    ) : [];
  }
  async loadRadarEpisode(t) {
    if (typeof t != "string" || !t.trim())
      throw new TypeError("Radar episode id is required");
    return b(
      L(this, B).radarEpisodes.find((n) => n.id === t) ?? null
    );
  }
}
B = new WeakMap(), re = new WeakSet(), Xe = function(t, n) {
  return oe(this, re, Tt).call(this, n) ? t.filter((r) => r.timeframe === n.timeframe) : [];
}, Tt = function(t) {
  return t.symbol.toUpperCase() === L(this, B).symbol && t.source === L(this, B).source;
};
function ga(e, t, n, r) {
  const i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const s of [...e, ...t]) {
    he(s, "Replay candle");
    const c = V(s.timeframe);
    if (s.symbol.toUpperCase() !== n || s.source !== r || !ee(s.openTime) || s.openTime % c !== 0 || s.closeTime !== s.openTime + c || !ee(s.knownAt) || s.knownAt < s.closeTime || s.logicalCandleId !== rn(s) || s.observationId !== on(s) || !ka(s) || !yt(s.vBase) || !yt(s.vQuote) || !Ta(s.revision) || !yt(s.correctionPublishedAt) || s.correctionPublishedAt != null && (s.correctionPublishedAt < s.closeTime || s.correctionPublishedAt > s.knownAt))
      throw new Error(`Invalid replay candle ${s.observationId ?? "<unknown>"}`);
    le(o, s.observationId, s, "candle observation"), le(
      a,
      `${s.logicalCandleId}\0${s.knownAt}`,
      s,
      "candle revision precedence"
    );
  }
  for (const s of e) {
    const c = i.get(s.logicalCandleId);
    if (c && c.observationId !== s.observationId)
      throw new Error(`Base candle history contains revisions for ${s.logicalCandleId}`);
    i.set(s.logicalCandleId, s);
  }
  for (const s of t) {
    const c = i.get(s.logicalCandleId);
    if (!c) throw new Error(`Candle revision has no base record: ${s.logicalCandleId}`);
    if (s.knownAt <= c.knownAt)
      throw new Error(`Candle revision must be published after its base record: ${s.logicalCandleId}`);
  }
}
function ba(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (he(i, "Radar episode"), i.schemaVersion !== Ut || i.symbol.toUpperCase() !== t || i.source !== n || i.observationId !== Gt(i))
      throw new Error(`Invalid radar episode ${i.id ?? "<unknown>"}`);
    le(r, i.id, i, "radar episode");
  }
}
function Aa(e, t, n) {
  const r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const o of e) {
    if (he(o, "Replay analysis state"), o.schemaVersion !== en || o.symbol.toUpperCase() !== t || o.source !== n || !ee(o.knownAt) || o.lifecycle.asOf == null || o.lifecycle.asOf > o.knownAt || o.id !== st(o))
      throw new Error(`Invalid replay analysis state ${o.id ?? "<unknown>"}`);
    le(r, o.id, o, "analysis state observation"), le(i, o.knownAt, o, "analysis state knowledge time");
  }
}
function Ea(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (he(i, "Replay known event"), i.schemaVersion !== tn || i.symbol.toUpperCase() !== t || i.source !== n || !ee(i.eventTime) || !ee(i.knownAt) || i.knownAt < i.eventTime || i.id !== an(i))
      throw new Error(`Invalid replay known event ${i.id ?? "<unknown>"}`);
    i.timeframe != null && V(i.timeframe), le(r, i.id, i, "known event");
  }
}
function Ra(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (he(i, "Venue evidence"), i.schemaVersion !== jt || i.symbol.toUpperCase() !== t || i.marketDataSource !== n || i.observationId !== ot(i))
      throw new Error(`Invalid execution-venue evidence ${i.observationId ?? "<unknown>"}`);
    Tr(i, "execution-venue evidence"), le(r, i.observationId, i, "execution-venue evidence");
  }
}
function Sa(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const i of e) {
    if (he(i, "Universe evidence"), i.schemaVersion !== zt || i.symbol.toUpperCase() !== t || i.source !== n || i.observationId !== it(i))
      throw new Error(`Invalid universe evidence ${i.observationId ?? "<unknown>"}`);
    Tr(i, "universe evidence"), le(r, i.observationId, i, "universe evidence");
  }
}
function Tr(e, t) {
  if (!ee(e.effectiveFrom) || !ee(e.knownAt) || e.effectiveTo != null && (!ee(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new Error(`Invalid ${t} interval`);
}
function Pn(e, t) {
  return e.knownAt <= t.to && e.effectiveFrom <= t.to && (e.effectiveTo == null || e.effectiveTo >= t.from);
}
function Cr(e) {
  Ae(e.symbol, "Replay query symbol"), Ae(e.source, "Replay query source"), V(e.timeframe);
}
function On(e) {
  Cr(e), Ir(e.from, e.to);
}
function Ge(e) {
  Ae(e.symbol, "Replay evidence query symbol"), Ae(e.source, "Replay evidence query source"), Ir(e.from, e.to);
}
function Ir(e, t) {
  if (!ee(e) || !ee(t) || t < e)
    throw new RangeError("Replay query range must contain ordered Unix-second timestamps");
}
function Nn(e) {
  return [...e].sort(
    (t, n) => t.timeframe.localeCompare(n.timeframe) || t.openTime - n.openTime || t.knownAt - n.knownAt || t.observationId.localeCompare(n.observationId)
  );
}
function _n(e, t) {
  return e.effectiveFrom - t.effectiveFrom || e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function le(e, t, n, r) {
  const i = e.get(t);
  if (i && T(i) !== T(n))
    throw new Error(`Conflicting ${r}`);
  e.set(t, n);
}
function ka(e) {
  return Qe(e.o) && Qe(e.h) && Qe(e.l) && Qe(e.c) && e.h >= Math.max(e.o, e.c, e.l) && e.l <= Math.min(e.o, e.c, e.h);
}
function Qe(e) {
  return Number.isFinite(e) && e > 0;
}
function yt(e) {
  return e == null || Number.isFinite(e) && e >= 0;
}
function Ta(e) {
  return e == null || Ca(e);
}
function Ca(e) {
  return Number.isSafeInteger(e) && e >= 0;
}
function ee(e) {
  return Number.isFinite(e) && e >= 0;
}
function he(e, t) {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw new TypeError(`${t} must be an object`);
  return e;
}
function Ae(e, t) {
  if (typeof e != "string" || !e.trim()) throw new TypeError(`${t} is required`);
  return e;
}
function Ia(e, t) {
  if (typeof e != "boolean") throw new TypeError(`${t} must be boolean`);
  return e;
}
function Ct(e, t) {
  if (!Array.isArray(e)) throw new TypeError(`${t} must be an array`);
  return e;
}
function Ce(e, t) {
  return e == null ? [] : Ct(e, t);
}
const xr = "linear-quote-perpetual-risk.1", xa = "sizing-result.1", Pa = "trade-plan.1", Oa = "decision-record.1";
function Pr(e) {
  const t = [], n = [
    fe(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(fe("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((O) => !Number.isFinite(O) || O <= 0) && t.push(fe("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(fe("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && R(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!Ke(e.intendedEntryPrice, e.venueRules.priceTick) || !Ke(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (O) => !Ke(O.targetPrice, e.venueRules.priceTick)
  )) && R(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !Ke(e.leveragePolicy.leverage, e.venueRules.leverageStep) && R(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    fe(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const i = e.riskRequest.accountRiskFraction != null, o = e.riskRequest.fixedRiskAmount != null;
  i === o && t.push(
    fe(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (i && (!Y(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || o && (!Y(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && R(
    t,
    "RISK_REQUEST_INVALID",
    "Risk and margin fractions must be in (0, 1], and fixed risk cannot exceed equity"
  ), Object.values(e.executionAssumptions).some(
    (O) => !Number.isFinite(O) || O < 0
  ) && R(
    t,
    "INVALID_NUMERIC_INPUT",
    "Fees and adverse-slippage allowances must be non-negative finite numbers"
  ), (e.executionAssumptions.adverseEntrySlippageBps >= 1e4 || e.executionAssumptions.adverseStopSlippageBps >= 1e4 || e.executionAssumptions.adverseTargetSlippageBps >= 1e4) && R(
    t,
    "INVALID_NUMERIC_INPUT",
    "Adverse-slippage allowances must be below 10,000 basis points"
  );
  const a = o ? e.riskRequest.fixedRiskAmount : i ? e.accountState.equity * (e.riskRequest.accountRiskFraction ?? 0) : null;
  (a == null || !Number.isFinite(a) || a <= 0) && R(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Fa(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const s = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = Y(s) ? s : null, u = Y(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, l = c != null && u != null ? u - c + c * e.executionAssumptions.entryFeeRate + u * e.executionAssumptions.stopExitFeeRate : null;
  (l == null || !Number.isFinite(l) || l <= 0) && R(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = a != null && l != null && l > 0 ? a / l : null;
  let d = f == null ? null : Fn(f, e.venueRules.quantityStep);
  if (d != null && a != null && l != null)
    for (; d > 0 && d * l > a + Math.max(1e-10, a * 1e-12); )
      d = Fn(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = d != null && d > 0 ? d : null, v = m == null ? null : m * e.intendedEntryPrice, g = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, h = m == null || u == null ? null : m * u * e.executionAssumptions.stopExitFeeRate, y = m == null || l == null ? null : m * l;
  (m == null || m < e.venueRules.minQuantity) && R(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (v == null || v < e.venueRules.minNotional) && R(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const S = e.riskRequest.maximumNotional;
  S != null && v != null && v > S && R(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${S}`
  );
  const I = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, _ = e.accountState.availableBalance == null ? I : Math.min(I, e.accountState.availableBalance), P = v != null && _ > 0 ? v / _ : null, w = Va(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  w != null && w > e.venueRules.maxLeverage && R(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${w} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const p = v != null && w != null && w > 0 ? v / w : null;
  p != null && p > I + 1e-10 && R(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), p != null && e.accountState.availableBalance != null && p > e.accountState.availableBalance + 1e-10 && R(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const E = m != null && c != null && u != null ? m * (u - c) : null, k = Ma(
    e.targets,
    m,
    c,
    E,
    y,
    e.executionAssumptions
  ), q = Ye(
    k.map((O) => O.grossReward * O.positionFraction)
  ), z = Ye(
    k.map((O) => O.netProjectedReward * O.positionFraction)
  ), x = Ye(
    k.map(
      (O) => O.weightedGrossRContribution == null ? null : O.weightedGrossRContribution
    )
  ), F = Ye(
    k.map(
      (O) => O.weightedRContribution == null ? null : O.weightedRContribution
    )
  );
  return b({
    schemaVersion: xa,
    sizingModelVersion: xr,
    side: e.side,
    riskBudget: a,
    rawQuantity: f,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: u,
    stopDistanceAbsolute: c == null || u == null ? null : u - c,
    stopDistancePercent: c == null || u == null ? null : (u - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: v,
    estimatedEntryFee: g,
    estimatedStopFee: h,
    projectedLossAtStop: y,
    projectedLossPercentEquity: y == null || e.accountState.equity <= 0 ? null : y / e.accountState.equity * 100,
    selectedLeverage: w,
    minimumRequiredLeverage: P,
    initialMargin: p,
    marginPercentEquity: p == null || e.accountState.equity <= 0 ? null : p / e.accountState.equity * 100,
    marginPercentAvailableBalance: p == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : p / e.accountState.availableBalance * 100,
    targetOutcomes: k,
    weightedGrossReward: q,
    weightedProjectedReward: z,
    weightedGrossR: x,
    weightedProjectedR: F,
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
function Na(e) {
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
    schemaVersion: Pa,
    snapshotId: e.snapshot.id,
    setupFamily: se,
    lifecycleVersion: X,
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
  }, r = { ...n, id: e.id ?? Or(n) }, i = _a({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return b({ ...r, complianceResult: i });
}
function _a(e) {
  var d, m;
  const { strategyProfile: t, snapshot: n, plan: r } = e, i = [...r.sizingResult.hardErrors], o = [], a = [...r.sizingResult.warnings], s = Pr({
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
  (rt(t) !== t.profileHash || ir(n) !== n.id || Or(r) !== r.id || T(s) !== T(r.sizingResult)) && R(
    i,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() && R(
    i,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot symbol"
  ), (n.snapshotSchemaVersion !== nr || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || T(r.executionAssumptions) !== T(t.executionAssumptions)) && R(
    i,
    "STRATEGY_PROFILE_VERSION_MISMATCH",
    "Snapshot and strategy profile versions or hashes do not match"
  ), t.entryPolicy.permittedOrderPlanTypes.includes(r.entryPlan.orderPlanType) || R(
    o,
    "ENTRY_ORDER_TYPE_NOT_PERMITTED",
    `Entry type ${r.entryPlan.orderPlanType} is not permitted by the profile`
  ), t.stopPolicy.permittedDerivations.includes(r.stopPlan.derivationType) || R(
    o,
    "STOP_DERIVATION_NOT_PERMITTED",
    `Stop derivation ${r.stopPlan.derivationType} is not permitted`
  );
  for (const v of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(v.derivationType) || R(
      o,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && R(
    o,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = r.targetPlans.reduce(
    (v, g) => v + g.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && R(
    i,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), Ba(n, r, i), Ha(r, i), La(n, t, o), Da(n, t, o), t.stopPolicy.requireOutsideEpisodeHigh && ((d = n.candidateEpisode) == null ? void 0 : d.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && R(
    o,
    "STOP_INSIDE_INVALIDATION_LEVEL",
    "Short stop is not beyond the candidate episode high"
  ), r.sizingResult.initialMargin != null && r.sizingResult.initialMargin > r.accountState.equity * t.riskPolicy.maximumMarginAllocationFraction + 1e-10 && R(
    o,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the strategy profile allocation"
  ), t.riskPolicy.maximumNotional != null && r.sizingResult.grossNotional != null && r.sizingResult.grossNotional > t.riskPolicy.maximumNotional && R(
    o,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    "Notional exceeds the strategy profile maximum"
  ), t.entryPolicy.minimumRewardRisk != null && r.sizingResult.weightedProjectedR != null && r.sizingResult.weightedProjectedR < t.entryPolicy.minimumRewardRisk && R(
    o,
    "REWARD_RISK_BELOW_MINIMUM",
    `Projected R ${r.sizingResult.weightedProjectedR.toFixed(3)} is below profile minimum ${t.entryPolicy.minimumRewardRisk}`
  ), r.sizingResult.projectedLossAtStop != null && r.sizingResult.projectedLossAtStop > r.accountState.equity * t.riskPolicy.maximumAccountRiskFraction + 1e-10 && R(
    o,
    "RISK_ABOVE_PROFILE_LIMIT",
    "Projected stop loss exceeds the profile risk limit"
  );
  const u = o.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), l = ((m = r.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  r.status === "finalized" && o.length > 0 && !u && !l && R(
    i,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return i.length > 0 ? f = "InvalidPlan" : u ? f = "OutOfStrategy" : o.length === 0 ? f = "Compliant" : l ? f = "Overridden" : f = "OutOfStrategy", b({
    classification: f,
    hardErrors: i,
    strategyViolations: o,
    warnings: a,
    overrideReason: l
  });
}
function pt(e) {
  var r, i;
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
    schemaVersion: Oa,
    sessionId: e.sessionId ?? null,
    snapshotId: e.snapshot.id,
    decisionTime: e.decisionTime,
    action: e.action,
    confidence: e.confidence ?? null,
    thesis: ((r = e.thesis) == null ? void 0 : r.trim()) || null,
    tags: [...e.tags ?? []],
    nextCondition: ((i = e.nextCondition) == null ? void 0 : i.trim()) || null,
    skipReason: e.skipReason ?? null,
    tradePlan: e.tradePlan ?? null
  }, n = e.id ?? `decision:${C(t).slice(8)}`;
  return b({ ...t, id: n });
}
function Fa(e, t, n, r) {
  (!e.length || e.some((o) => o.targetPrice >= t)) && R(r, "NO_VALID_TARGET", "Every short target must be below entry");
  const i = e.reduce((o, a) => o + a.positionFraction, 0);
  (e.some(
    (o) => !Number.isFinite(o.positionFraction) || o.positionFraction <= 0
  ) || Math.abs(i - 1) > n) && R(
    r,
    "TARGET_FRACTIONS_INVALID",
    "Target fractions must be positive and sum to 1"
  );
}
function Ma(e, t, n, r, i, o) {
  return t == null || n == null ? [] : e.map((a) => {
    const s = a.targetPrice * (1 + o.adverseTargetSlippageBps / 1e4), c = t * (n - s), u = t * n * o.entryFeeRate, l = t * s * o.targetExitFeeRate, f = c - u - l, d = r != null && r > 0 ? c / r : null, m = i != null && i > 0 ? f / i : null;
    return {
      targetId: a.id,
      targetPrice: a.targetPrice,
      effectiveTargetPrice: s,
      positionFraction: a.positionFraction,
      grossReward: c,
      expectedEntryFee: u,
      expectedExitFee: l,
      netProjectedReward: f,
      grossR: d,
      projectedR: m,
      weightedGrossRContribution: d == null ? null : d * a.positionFraction,
      weightedRContribution: m == null ? null : m * a.positionFraction
    };
  });
}
function La(e, t, n) {
  if (!(e.candidateEpisode != null && e.activeCandidateId === e.candidateEpisode.id && !["notCandidate", "invalidated", "expired"].includes(e.lifecycleState))) {
    R(n, "NO_ACTIVE_CANDIDATE", "No active Impulse Fade candidate exists");
    return;
  }
  t.entryPolicy.eligibleLifecycleStates.includes(e.lifecycleState) || (R(
    n,
    "ENTRY_BEFORE_ENTRY_CANDIDATE",
    `Lifecycle state ${e.lifecycleState} is not entry-eligible`
  ), (e.lifecycleState === "developing" || e.lifecycleState === "deteriorating") && R(
    n,
    "ENTRY_BEFORE_STRUCTURE_BREAK",
    "Entry precedes a confirmed bearish structure break"
  ), e.lifecycleState === "waitingForRetest" && R(
    n,
    "ENTRY_BEFORE_RETEST",
    "Entry precedes a confirmed retest and rejection"
  ));
  const i = e.lifecycleEvidence.some(
    (o) => o.code === "bearish_retest_rejection"
  );
  (t.entryPolicy.retestRequired || t.entryPolicy.confirmedRejectionRequired) && !i && R(
    n,
    "ENTRY_BEFORE_RETEST",
    "The profile requires a confirmed retest rejection"
  ), e.lifecycleState === "entryCandidate" && e.lifecycleStateSince != null && t.entryPolicy.maxAgeSinceEntryCandidateSeconds != null && e.effectiveAsOf - e.lifecycleStateSince > t.entryPolicy.maxAgeSinceEntryCandidateSeconds && R(n, "RETEST_TOO_OLD", "EntryCandidate is older than the profile limit");
}
function Da(e, t, n) {
  var c;
  const r = t.entryPolicy.requiredDataQuality, i = r.candidateMetricsRequired && e.candidateMetrics == null, o = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, a = r.minimumHistoryCoverageRatio != null && (o == null || o < r.minimumHistoryCoverageRatio), s = e.dataQualityNotes.some(
    (u) => r.rejectedNoteSeverities.includes(u.severity)
  );
  (i || a || s) && R(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function Ba(e, t, n) {
  const r = new Map(
    or(e).map((o) => [o.id, o])
  ), i = [
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
  for (const o of i) {
    if (!o.id && !o.reference && !o.requiresReference) continue;
    if (!o.id || !o.reference) {
      R(
        n,
        "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
        "A derived plan level must preserve its reference ID and source object"
      );
      continue;
    }
    o.reference.knownAt > e.effectiveAsOf && R(
      n,
      "REFERENCE_LEVEL_NOT_KNOWN_AT_DECISION_TIME",
      `Reference ${o.id} was not known at the decision cutoff`
    );
    const a = r.get(o.id);
    a ? T(a) !== T(o.reference) && R(
      n,
      "REFERENCE_LEVEL_SNAPSHOT_MISMATCH",
      `Reference ${o.id} differs from the frozen snapshot object`
    ) : R(
      n,
      "REFERENCE_LEVEL_NOT_IN_SNAPSHOT",
      `Reference ${o.id} is absent from the decision snapshot`
    );
  }
}
function Ha(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && R(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const i = e.stopPlan.referenceLevel;
  if (i && e.stopPlan.derivationType !== "manual") {
    const o = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? i.rangeHigh ?? i.price : i.price, { basisPoints: a, atrFraction: s, atrValue: c } = e.stopPlan.buffer;
    let u = o;
    a != null && s != null ? R(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : a != null ? u = o * (1 + a / 1e4) : s != null && (Y(c ?? 0) ? u = o + s * (c ?? 0) : R(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - u) > n + 1e-12 && R(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop price does not match its frozen reference and recorded buffer"
    );
  }
  for (const o of e.targetPlans) {
    const a = o.referenceLevel;
    if (!a || o.derivationType === "manual" || o.derivationType === "fixedRMultiple")
      continue;
    (o.derivationType === "supportZone" ? o.targetPrice >= (a.rangeLow ?? a.price) - n && o.targetPrice <= (a.rangeHigh ?? a.price) + n : Math.abs(o.targetPrice - a.price) <= n + 1e-12) || R(
      t,
      "REFERENCE_PRICE_MISMATCH",
      `Target ${o.id} does not match its frozen reference`
    );
  }
}
function Va(e, t, n) {
  return e.mode === "manual" ? Y(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, $a(t, n));
}
function Or(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${C(r).slice(8)}`;
}
function Fn(e, t) {
  if (!Y(e) || !Y(t)) return 0;
  const n = Nr(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function $a(e, t) {
  if (!Y(e) || !Y(t)) return e;
  const n = Nr(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Nr(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function Ke(e, t) {
  if (!Number.isFinite(e) || !Y(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Ye(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function Y(e) {
  return Number.isFinite(e) && e > 0;
}
function fe(e, t) {
  return { code: e, message: t };
}
function R(e, t, n) {
  e.some((r) => r.code === t) || e.push(fe(t, n));
}
var Ve;
class zs {
  constructor(t) {
    pe(this, Ve);
    Ue(this, Ve, b(t));
  }
  async revealCaseOutcome(t) {
    const n = L(this, Ve)[t.manifestId];
    if (!n) throw new Error(`No outcome is available for ${t.manifestId}`);
    const r = {
      schemaVersion: Rr,
      sessionId: t.sessionId,
      manifestId: t.manifestId,
      revealedAt: t.revealedAt,
      revealedBeforeDecisionCompletion: t.revealedBeforeDecisionCompletion,
      outcome: n
    };
    return b({
      ...r,
      id: `replay-outcome:${C(r).slice(8)}`
    });
  }
}
Ve = new WeakMap();
function Ws(e, t) {
  return lt(e), b({
    schemaVersion: Ar,
    id: t.id,
    sessionId: e.id,
    expectedRevision: e.revision,
    currentFrameId: e.currentFrameId,
    submittedLogicalTime: e.currentAsOf ?? e.createdAtLogicalTime,
    type: t.type,
    payload: t.payload ?? {}
  });
}
function _r(e) {
  if (e.type === "AnyOf" && e.conditions.length === 0)
    throw new RangeError("AnyOf requires at least one condition");
  if ("timeframe" in e && e.timeframe != null && V(e.timeframe), e.type === "PriceCrossesKnownLevel" && !wt(e.frozenPrice))
    throw new RangeError("Frozen level price must be positive");
  if (e.type === "PriceEntersKnownZone" && (!wt(e.frozenLowerBound) || !wt(e.frozenUpperBound) || e.frozenLowerBound > e.frozenUpperBound))
    throw new RangeError("Frozen zone bounds are invalid");
  const t = {
    schemaVersion: ra,
    ...e,
    ...e.type === "AnyOf" ? { conditions: e.conditions.map(_r) } : {},
    ...e.type === "AvwapEventConfirmed" ? { avwapId: e.avwapId ?? null } : {},
    ...e.type === "RelativeStrengthEventConfirmed" ? { timeframe: e.timeframe ?? null } : {}
  };
  return b({
    ...t,
    id: `replay-wake-condition:${C(t).slice(8)}`
  });
}
function Gs(e) {
  var n, r;
  if (Dn(e.createdAt, "wake plan createdAt"), Dn(e.deadlineAsOf, "wake plan deadlineAsOf"), e.deadlineAsOf <= e.createdAt) throw new RangeError("Wake deadline must be in the future");
  if (((n = e.scheduledReview) == null ? void 0 : n.mode) === "nextCompletedCandle" && V(e.scheduledReview.timeframe), ((r = e.scheduledReview) == null ? void 0 : r.mode) === "elapsedDuration" && (!Number.isInteger(e.scheduledReview.durationSeconds) || e.scheduledReview.durationSeconds <= 0))
    throw new RangeError("Elapsed review duration must be a positive integer");
  const t = {
    schemaVersion: na,
    submittedFrameId: e.submittedFrameId,
    createdAt: e.createdAt,
    scheduledReview: e.scheduledReview ?? null,
    conditions: (e.conditions ?? []).map(_r),
    deadlineAsOf: e.deadlineAsOf
  };
  if (!t.scheduledReview && !t.conditions.length)
    throw new RangeError("A wake plan requires a review or condition");
  return b({
    ...t,
    id: `replay-wake-plan:${C(t).slice(8)}`
  });
}
function Qs(e) {
  fn(e);
  const t = {
    schemaVersion: br,
    id: Fr(e),
    replayEngineVersion: Se,
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
  return un({
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
function Fr(e) {
  return `replay-session:${C({
    manifestId: e.manifest.id,
    sessionConfigHash: e.sessionConfig.canonicalConfigHash,
    marketDataBundleFingerprint: e.dataBundle.causalPrefixFingerprint
  }).slice(8)}`;
}
async function It(e) {
  var g, h;
  const { loaded: t, session: n, effectiveAsOf: r } = e, i = W(t);
  if (r < t.manifest.startAsOf)
    throw new RangeError("A replay frame cannot precede radar detection");
  const o = De(t, r), a = b({ ...o.lifecycle, asOf: r }), s = [
    ...i.dataQualityNotes,
    ...o.dataQualityNotes,
    ...o.lifecycle.asOf != null && o.lifecycle.asOf < r ? [{
      code: "CARRIED_FORWARD_ANALYSIS_STATE",
      severity: "warning",
      message: `Analysis observation ${o.id} was carried forward from ${o.lifecycle.asOf}`
    }] : []
  ], c = lo({
    symbol: t.manifest.symbol,
    source: t.manifest.source,
    decisionTime: r,
    effectiveAsOf: r,
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
  }), u = {}, l = {}, f = {};
  for (const y of t.sessionConfig.visibleTimeframes) {
    const S = Mr(
      i.candlesByTimeframe[y] ?? [],
      r
    ).filter((I) => I.openTime >= i.displayStartByTimeframe[y]);
    u[y] = S, f[y] = S.at(-1) ?? null, l[y] = {
      timeframe: y,
      displayStart: i.displayStartByTimeframe[y],
      visibleStart: ((g = S[0]) == null ? void 0 : g.openTime) ?? null,
      visibleEnd: ((h = S.at(-1)) == null ? void 0 : h.closeTime) ?? null,
      completedCandleCount: S.length
    };
  }
  const d = await sn({
    effectiveAsOf: r,
    analysisObservationId: o.id,
    visibleCandlesByTimeframe: u
  }), m = n.decisionRecords.map((y) => {
    var S;
    return {
      decisionRecordId: y.id,
      frameId: ((S = n.frames.find((I) => I.decisionSnapshot.id === y.snapshotId)) == null ? void 0 : S.id) ?? "",
      action: y.action,
      decisionTime: y.decisionTime
    };
  }), v = {
    schemaVersion: ta,
    sessionId: n.id,
    manifestId: t.manifest.id,
    radarEpisodeId: t.dataBundle.radarEpisode.id,
    requestedAsOf: e.requestedAsOf,
    effectiveAsOf: r,
    evaluationTimeframe: t.sessionConfig.evaluationTimeframe,
    radarContext: Ua(t),
    decisionSnapshot: c,
    visibleCandlesByTimeframe: u,
    visibleCoverageByTimeframe: l,
    latestVisibleCandleByTimeframe: f,
    visibleDataFingerprint: d,
    lifecycleState: c.lifecycleState,
    lifecycleStateSince: c.lifecycleStateSince,
    pendingConditions: c.pendingConditions,
    priorDecisionSummary: m,
    activeWakeResult: e.wakeResult ?? null,
    dataQualityNotes: s,
    generatedAtLogicalTime: r
  };
  return b({
    ...v,
    id: `replay-frame:${C(v).slice(8)}`
  });
}
function Ua(e) {
  const t = e.dataBundle.radarEpisode;
  return b({
    radarEpisodeId: t.id,
    triggeringDetectorIds: t.triggeringDetectorIds,
    triggeringObservations: t.triggeringObservations,
    selectionAnchor: t.selectionAnchor,
    pathContext: t.pathContext,
    hardGateResults: t.hardGateResults
  });
}
function De(e, t) {
  const r = W(e).analysisStateHistory.filter(
    (i) => i.knownAt <= t
  ).at(-1);
  if (!r || r.id !== st(r))
    throw new Error(`No verified point-in-time analysis state is available at ${t}`);
  return r;
}
function Mr(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    if (r.closeTime > t || r.knownAt > t) continue;
    const i = n.get(r.logicalCandleId);
    if (!i || i.knownAt < r.knownAt) n.set(r.logicalCandleId, r);
    else if (i.knownAt === r.knownAt && T(i) !== T(r))
      throw new Error(`Conflicting candle revisions for ${r.logicalCandleId}`);
  }
  return b(
    [...n.values()].sort(
      (r, i) => r.openTime - i.openTime || r.knownAt - i.knownAt
    )
  );
}
async function Ks(e, t, n, r) {
  fn(e), lt(t), qr(t, e);
  const i = t.events.find((c) => c.command.id === n.id);
  if (i) {
    if (T(i.command) !== T(n))
      throw new Error(`Command id ${n.id} was reused with a different payload`);
    return { session: b(t), event: i, outcomeEnvelope: null, idempotent: !0 };
  }
  Lr(t, n);
  let o, a = null;
  if (n.type === "StartSession") {
    if (t.state !== "Created") throw new Error("Only a Created replay session can start");
    const c = await It({
      loaded: e,
      session: t,
      requestedAsOf: e.manifest.startAsOf,
      effectiveAsOf: e.manifest.startAsOf
    });
    o = we(n, "Active", c.effectiveAsOf, { frame: c });
  } else {
    if (t.state !== "Active" && n.type !== "RevealOutcome")
      throw new Error(`Command ${n.type} is not allowed while session is ${t.state}`);
    const c = xt(t);
    if (n.type === "Wait") {
      Dr(e, t, c, n.payload.wakePlan);
      const u = pt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Wait",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [n.payload.reason, ...n.payload.tags ?? []],
        nextCondition: Xa(n.payload.wakePlan)
      }), l = await Hr(
        e,
        t,
        c,
        n.payload.wakePlan
      ), f = b({
        ...t,
        decisionRecords: [...t.decisionRecords, u]
      }), d = await It({
        loaded: e,
        session: f,
        requestedAsOf: l.requestedAsOf,
        effectiveAsOf: l.effectiveAsOf,
        wakeResult: l.wakeResult
      });
      o = we(n, l.state, d.effectiveAsOf, {
        frame: d,
        decisionRecord: u,
        wakePlan: n.payload.wakePlan,
        wakeResult: l.wakeResult,
        terminalReason: l.terminalReason
      });
    } else if (n.type === "Skip") {
      if (!n.payload.reasons.length) throw new RangeError("Skip requires at least one reason");
      const u = pt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "Skip",
        confidence: n.payload.confidence,
        thesis: n.payload.thesis,
        tags: [...n.payload.tags ?? [], ...n.payload.reasons.slice(1)],
        skipReason: n.payload.reasons[0]
      });
      o = we(n, "Skipped", c.effectiveAsOf, {
        decisionRecord: u
      });
    } else if (n.type === "ProposeTrade") {
      if (!e.venueRules) throw new Error("Trade planning requires versioned venue rules");
      const u = Na({
        ...n.payload,
        snapshot: c.decisionSnapshot,
        strategyProfile: e.strategyProfile,
        venueRules: e.venueRules,
        createdAt: c.effectiveAsOf
      }), l = Wa(e, u), f = b({
        id: `replay-planning-attempt:${C({
          sessionId: t.id,
          frameId: c.id,
          tradePlan: u
        }).slice(8)}`,
        frameId: c.id,
        attemptedAt: c.effectiveAsOf,
        tradePlan: u,
        accepted: l == null,
        rejectionReason: l
      }), d = l ? null : pt({
        sessionId: t.id,
        snapshot: c.decisionSnapshot,
        decisionTime: c.effectiveAsOf,
        action: "ProposeTrade",
        tradePlan: u
      });
      o = we(
        n,
        l ? "Active" : "TradePlanRecorded",
        c.effectiveAsOf,
        { planningAttempt: f, decisionRecord: d }
      );
    } else if (n.type === "Abandon") {
      if (!n.payload.reason.trim()) throw new TypeError("Abandon requires a reason");
      o = we(n, "Abandoned", c.effectiveAsOf);
    } else {
      const u = await rs(e, t, n, r);
      a = u.envelope, o = we(n, "Revealed", u.revealedAt, {
        terminalReason: t.terminalReason,
        revealedBeforeDecisionCompletion: u.early,
        outcomeEnvelopeId: u.envelope.id
      });
    }
  }
  const s = qa(t, o);
  return {
    session: ln(t, s),
    event: s,
    outcomeEnvelope: a,
    idempotent: !1
  };
}
function we(e, t, n, r = {}) {
  return {
    command: e,
    stateAfter: t,
    currentAsOfAfter: n,
    frame: r.frame ?? null,
    decisionRecord: r.decisionRecord ?? null,
    planningAttempt: r.planningAttempt ?? null,
    wakePlan: r.wakePlan ?? null,
    wakeResult: r.wakeResult ?? null,
    terminalReasonAfter: r.terminalReason ?? null,
    revealedBeforeDecisionCompletionAfter: r.revealedBeforeDecisionCompletion ?? !1,
    revealedOutcomeEnvelopeIdAfter: r.outcomeEnvelopeId ?? null
  };
}
function qa(e, t) {
  const n = {
    schemaVersion: Er,
    sequence: e.revision + 1,
    ...t
  };
  return b({
    ...n,
    id: `replay-event:${C(n).slice(8)}`
  });
}
function ln(e, t) {
  var n;
  if (t.schemaVersion !== Er)
    throw new Error("Replay event schema is invalid");
  if (t.sequence !== e.revision + 1) throw new Error("Replay event sequence is invalid");
  if (t.id !== za(t)) throw new Error("Replay event identity is invalid");
  if (t.command.sessionId !== e.id || t.command.expectedRevision !== e.revision)
    throw new Error("Replay event command provenance is invalid");
  if (t.frame) {
    const { id: r, ...i } = t.frame;
    if (t.frame.id !== `replay-frame:${C(i).slice(8)}` || t.frame.sessionId !== e.id || t.frame.manifestId !== e.manifestId) throw new Error("Replay event frame identity is invalid");
    dn(t.frame);
  }
  if (t.decisionRecord && t.decisionRecord.sessionId !== e.id)
    throw new Error("Replay event decision record targets another session");
  if (t.wakePlan && t.wakePlan.id !== Br(t.wakePlan))
    throw new Error("Replay event wake plan identity is invalid");
  if (t.wakeResult) {
    const { id: r, ...i } = t.wakeResult;
    if (t.wakeResult.id !== `replay-wake-result:${C(i).slice(8)}`) throw new Error("Replay event wake result identity is invalid");
  }
  return ja(e, t), un({
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
function ja(e, t) {
  var l, f, d;
  const n = t.currentAsOfAfter === e.currentAsOf, r = t.frame == null, i = t.decisionRecord == null, o = t.planningAttempt == null, a = t.wakePlan == null && t.wakeResult == null, s = !t.revealedBeforeDecisionCompletionAfter && t.revealedOutcomeEnvelopeIdAfter == null;
  if (t.stateAfter === "Failed")
    throw new Error("Failed replay sessions cannot be synthesized from accepted commands");
  if (t.command.type === "StartSession") {
    if (e.state !== "Created" || t.stateAfter !== "Active" || !t.frame || t.currentAsOfAfter !== t.frame.effectiveAsOf || t.currentAsOfAfter !== e.createdAtLogicalTime || !i || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("StartSession event transition is invalid");
    return;
  }
  if (t.command.type === "Wait") {
    const m = t.stateAfter === "CaseWindowEnded";
    if (e.state !== "Active" || !t.frame || !t.decisionRecord || t.decisionRecord.action !== "Wait" || !t.wakePlan || !t.wakeResult || t.wakeResult.wakePlanId !== t.wakePlan.id || ((l = t.frame.activeWakeResult) == null ? void 0 : l.id) !== t.wakeResult.id || t.currentAsOfAfter !== t.frame.effectiveAsOf || !["Active", "CaseWindowEnded"].includes(t.stateAfter) || m !== (t.terminalReasonAfter != null) || !o || !s) throw new Error("Wait event transition is invalid");
    return;
  }
  if (t.command.type === "Skip") {
    if (e.state !== "Active" || t.stateAfter !== "Skipped" || !t.decisionRecord || t.decisionRecord.action !== "Skip" || !n || !r || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("Skip event transition is invalid");
    return;
  }
  if (t.command.type === "ProposeTrade") {
    const m = ((f = t.planningAttempt) == null ? void 0 : f.accepted) === !0, v = t.planningAttempt ? `replay-planning-attempt:${C({
      sessionId: e.id,
      frameId: t.planningAttempt.frameId,
      tradePlan: t.planningAttempt.tradePlan
    }).slice(8)}` : null;
    if (e.state !== "Active" || !t.planningAttempt || t.planningAttempt.id !== v || t.planningAttempt.frameId !== e.currentFrameId || t.planningAttempt.attemptedAt !== e.currentAsOf || t.stateAfter !== (m ? "TradePlanRecorded" : "Active") || (m ? ((d = t.decisionRecord) == null ? void 0 : d.action) !== "ProposeTrade" : t.decisionRecord != null) || !n || !r || !a || !s || t.terminalReasonAfter != null) throw new Error("ProposeTrade event transition is invalid");
    return;
  }
  if (t.command.type === "Abandon") {
    if (e.state !== "Active" || t.stateAfter !== "Abandoned" || !n || !r || !i || !o || !a || !s || t.terminalReasonAfter != null) throw new Error("Abandon event transition is invalid");
    return;
  }
  const c = [
    "Skipped",
    "TradePlanRecorded",
    "CaseWindowEnded",
    "Abandoned"
  ].includes(e.state), u = e.state === "Active" && t.command.payload.abandonActive && t.revealedBeforeDecisionCompletionAfter;
  if (!c && !u || t.stateAfter !== "Revealed" || !n || !r || !i || !o || !a || t.revealedOutcomeEnvelopeIdAfter == null || t.terminalReasonAfter !== e.terminalReason) throw new Error("RevealOutcome event transition is invalid");
}
function za(e) {
  const { id: t, ...n } = e;
  return `replay-event:${C(n).slice(8)}`;
}
function Lr(e, t) {
  if (t.schemaVersion !== Ar || !t.id.trim())
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
function xt(e) {
  const t = e.frames.find((n) => n.id === e.currentFrameId);
  if (!t || t.effectiveAsOf !== e.currentAsOf)
    throw new Error("Active replay session has no valid current frame");
  return t;
}
function Wa(e, t) {
  if (t.status !== "finalized") return "Replay Phase 1 records only finalized plans";
  if (t.sizingResult.sizingModelVersion !== xr)
    return "Sizing model version mismatch";
  if (t.complianceResult.classification === "InvalidPlan") return "InvalidPlan";
  if (t.complianceResult.classification === "OutOfStrategy" && !e.sessionConfig.allowOutOfStrategyPlans)
    return "OutOfStrategy plans are disabled by the replay configuration";
  if (t.complianceResult.classification === "Overridden" && !e.sessionConfig.allowDiscretionaryOverrides)
    return "Discretionary overrides are disabled by the replay configuration";
  if (e.venueRules && T(t.venueRules) !== T(e.venueRules))
    return "Trade plan venue rules differ from the loaded replay rules";
  const n = e.manifest.executionVenueEligibility.executionVenue;
  return n && t.venueRules.venue.toLowerCase() !== n.toLowerCase() ? "Trade plan venue does not match the manifest execution venue" : Ga(e, t.createdAt, n) === "Unavailable" ? "Execution venue was unavailable at the replay decision time" : null;
}
function Ga(e, t, n) {
  const r = W(e).venueEvidence.filter(
    (o) => o.knownAt <= t && o.effectiveFrom <= t && (o.effectiveTo == null || o.effectiveTo > t) && o.executionVenue.toLowerCase() === n.toLowerCase()
  ).at(-1);
  if (r) return r.status;
  const i = e.manifest.executionVenueEligibility;
  return i.effectiveFrom <= t && (i.effectiveTo == null || i.effectiveTo > t) ? i.status : "Unavailable";
}
function Dr(e, t, n, r) {
  var i;
  if (r.id !== Br(r)) throw new Error("Wake plan identity is invalid");
  if (r.submittedFrameId !== n.id || r.createdAt !== n.effectiveAsOf)
    throw new Error("Wake plan must be frozen against the current frame");
  if (r.deadlineAsOf > n.effectiveAsOf + e.sessionConfig.maximumSingleWaitDuration || r.deadlineAsOf > e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration)
    throw new RangeError("Wake deadline exceeds the configured replay bounds");
  if (((i = r.scheduledReview) == null ? void 0 : i.mode) === "nextCompletedCandle" && !Object.hasOwn(
    W(e).candlesByTimeframe,
    r.scheduledReview.timeframe
  ))
    throw new RangeError(
      `Scheduled review timeframe ${r.scheduledReview.timeframe} is not loaded`
    );
  for (const o of ct(r.conditions)) {
    if (!e.sessionConfig.allowedWakeConditionTypes.includes(o.type))
      throw new RangeError(`Wake condition ${o.type} is not allowed`);
    if (o.id !== Qa(o))
      throw new Error(`Wake condition ${o.id} failed deterministic verification`);
  }
  if (Ka(n, r.conditions), Ya(e, n, r.conditions))
    throw new RangeError("A submitted wake condition is already true in the current frame");
  if (t.currentAsOf == null) throw new Error("Wait requires an active replay clock");
}
function Br(e) {
  const { id: t, ...n } = e;
  return `replay-wake-plan:${C(n).slice(8)}`;
}
function Qa(e) {
  const { id: t, ...n } = e;
  return `replay-wake-condition:${C(n).slice(8)}`;
}
function Ka(e, t) {
  const n = or(e.decisionSnapshot);
  for (const r of ct(t)) {
    if (r.type === "PriceCrossesKnownLevel") {
      const i = n.find((o) => o.id === r.referenceId);
      if (!i || i.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame reference ${r.referenceId}`);
      if (i.price !== r.frozenPrice)
        throw new Error("Frozen level price does not match the current DecisionFrame");
    }
    if (r.type === "PriceEntersKnownZone") {
      const i = n.find(
        (o) => o.sourceObject.observationId === r.zoneObservationId
      );
      if (!i || i.knownAt > e.effectiveAsOf)
        throw new Error(`Unknown current-frame zone ${r.zoneObservationId}`);
      if (i.rangeLow !== r.frozenLowerBound || i.rangeHigh !== r.frozenUpperBound)
        throw new Error("Frozen zone bounds do not match the current DecisionFrame");
    }
  }
}
function Ya(e, t, n) {
  for (const r of ct(n)) {
    if (r.type === "LifecycleStateEntered" && t.lifecycleState === r.state) return !0;
    if (r.type === "PriceCrossesKnownLevel") {
      const i = Be(e, r.timeframe, t.effectiveAsOf);
      if (i != null && (r.direction === "above" && i >= r.frozenPrice || r.direction === "below" && i <= r.frozenPrice)) return !0;
    }
    if (r.type === "PriceEntersKnownZone") {
      const i = Be(e, r.timeframe, t.effectiveAsOf);
      if (i != null && i >= r.frozenLowerBound && i <= r.frozenUpperBound) return !0;
    }
  }
  return !1;
}
function ct(e) {
  return e.flatMap(
    (t) => t.type === "AnyOf" ? [t, ...ct(t.conditions)] : [t]
  );
}
function Xa(e) {
  return T({
    scheduledReview: e.scheduledReview,
    conditionIds: e.conditions.map((t) => t.id),
    deadlineAsOf: e.deadlineAsOf
  });
}
async function Hr(e, t, n, r) {
  var P;
  const i = n.effectiveAsOf, o = W(e), a = e.manifest.startAsOf + e.sessionConfig.maximumCaseDuration, s = Ja(e), c = Za(e, i, r.scheduledReview), u = ((P = r.scheduledReview) == null ? void 0 : P.mode) === "elapsedDuration" ? i + r.scheduledReview.durationSeconds : c ?? r.deadlineAsOf, l = Math.min(r.deadlineAsOf, a, s);
  if (l < i) throw new Error("Historical coverage ends before the replay clock");
  const f = /* @__PURE__ */ new Set([l]);
  for (const w of o.analysisStateHistory)
    w.knownAt > i && w.knownAt <= l && f.add(w.knownAt);
  for (const w of o.knownEvents)
    w.knownAt > i && w.knownAt <= l && f.add(w.knownAt);
  for (const w of Object.values(o.candlesByTimeframe))
    for (const p of w) {
      const E = Math.max(p.closeTime, p.knownAt);
      E > i && E <= l && f.add(E);
    }
  c != null && c > i && c <= l && f.add(c), r.deadlineAsOf > i && r.deadlineAsOf <= l && f.add(r.deadlineAsOf), a > i && a <= l && f.add(a), s > i && s <= l && f.add(s);
  const d = {
    evaluationPointsChecked: [],
    lifecycleTransitionsEncountered: [],
    conditionEvaluations: [],
    firstTriggeringEffectiveAsOf: null
  }, m = [...f].sort((w, p) => w - p);
  let v = l, g = "DEADLINE_REACHED", h = [], y = [], S = null;
  for (const w of m) {
    d.evaluationPointsChecked.push(w);
    const p = es(e, w, i);
    d.lifecycleTransitionsEncountered.push(...p);
    const E = Vr(e, r.conditions, i, w, d), k = ns(e, w, i);
    if (k) {
      v = w, g = "CASE_BOUNDARY_REACHED", S = k, h = E.conditionIds, y = E.eventIds, E.conditionIds.length && (d.firstTriggeringEffectiveAsOf = w);
      break;
    }
    if (E.conditionIds.length) {
      v = w, g = "CONDITION_TRIGGERED", h = E.conditionIds, y = E.eventIds, d.firstTriggeringEffectiveAsOf = w;
      break;
    }
    if (c != null && w >= c) {
      v = w, g = "SCHEDULED_REVIEW";
      break;
    }
    if (w >= l) {
      v = l, l === a ? (g = "CASE_BOUNDARY_REACHED", S = "MAXIMUM_CASE_DURATION") : l === s ? (g = "CASE_BOUNDARY_REACHED", S = "DATA_COVERAGE_ENDED") : g = "DEADLINE_REACHED";
      break;
    }
  }
  const I = {
    schemaVersion: ia,
    wakePlanId: r.id,
    startedAt: i,
    effectiveAsOf: v,
    reason: g,
    triggeredConditionIds: [...new Set(h)],
    triggeringEventIds: [...new Set(y)],
    auditTrace: d
  }, _ = b({
    ...I,
    id: `replay-wake-result:${C(I).slice(8)}`
  });
  return {
    requestedAsOf: u,
    effectiveAsOf: v,
    state: S ? "CaseWindowEnded" : "Active",
    terminalReason: S,
    wakeResult: _
  };
}
function Za(e, t, n) {
  if (!n) return null;
  if (n.mode === "nextCompletedCandle")
    return Mn(e, n.timeframe, t);
  const r = V(e.sessionConfig.evaluationTimeframe), i = t + n.durationSeconds, o = Math.ceil(i / r) * r;
  return Mn(e, e.sessionConfig.evaluationTimeframe, o - 1);
}
function Mn(e, t, n) {
  return (W(e).candlesByTimeframe[t] ?? []).filter((r) => r.closeTime > n).map((r) => Math.max(r.closeTime, r.knownAt)).sort((r, i) => r - i)[0] ?? null;
}
function Ja(e) {
  const n = (W(e).candlesByTimeframe[e.sessionConfig.evaluationTimeframe] ?? []).map((r) => r.closeTime);
  return n.length ? Math.max(...n) : e.manifest.startAsOf;
}
function es(e, t, n) {
  var a;
  const r = W(e).knownEvents.filter(
    (s) => s.kind === "lifecycleTransition" && s.knownAt === t && s.knownAt > n
  ).map((s) => s.id), i = (a = Pt(e, t)) == null ? void 0 : a.lifecycle.currentState, o = De(e, t);
  return i !== o.lifecycle.currentState && r.push(o.id), [...new Set(r)];
}
function Pt(e, t) {
  return W(e).analysisStateHistory.filter((n) => n.knownAt < t).at(-1) ?? null;
}
function Vr(e, t, n, r, i) {
  const o = [], a = [];
  for (const s of t) {
    const c = ts(e, s, n, r, i);
    c.matched && (o.push(...c.conditionIds), a.push(...c.eventIds));
  }
  return { conditionIds: [...new Set(o)], eventIds: [...new Set(a)] };
}
function ts(e, t, n, r, i) {
  var u, l;
  if (t.type === "AnyOf") {
    const f = Vr(e, t.conditions, n, r, i), d = f.conditionIds.length > 0;
    return i.conditionEvaluations.push({
      conditionId: t.id,
      effectiveAsOf: r,
      matched: d,
      matchedEventIds: f.eventIds
    }), {
      matched: d,
      conditionIds: d ? [t.id, ...f.conditionIds] : [],
      eventIds: f.eventIds
    };
  }
  const o = W(e).knownEvents.filter(
    (f) => f.knownAt === r && f.knownAt > n
  );
  let a = [], s = !1;
  if (t.type === "NextLifecycleTransition")
    a = o.filter((f) => f.kind === "lifecycleTransition"), s = a.length > 0 || ((u = Pt(e, r)) == null ? void 0 : u.lifecycle.currentState) !== De(e, r).lifecycle.currentState;
  else if (t.type === "LifecycleStateEntered")
    a = o.filter(
      (f) => f.kind === "lifecycleTransition" && f.lifecycleState === t.state
    ), s = a.length > 0 || De(e, r).lifecycle.currentState === t.state && ((l = Pt(e, r)) == null ? void 0 : l.lifecycle.currentState) !== t.state;
  else if (t.type === "StructureEventConfirmed")
    a = o.filter(
      (f) => f.kind === "structure" && f.timeframe === t.timeframe && f.eventType === t.eventType && f.direction === t.direction
    ), s = a.length > 0;
  else if (t.type === "AvwapEventConfirmed")
    a = o.filter(
      (f) => f.kind === "avwap" && f.eventType === t.eventType && (t.avwapId == null || f.avwapId === t.avwapId)
    ), s = a.length > 0;
  else if (t.type === "RelativeStrengthEventConfirmed")
    a = o.filter(
      (f) => f.kind === "relativeStrength" && f.eventType === t.eventType && (t.timeframe == null || f.timeframe === t.timeframe)
    ), s = a.length > 0;
  else if (t.type === "RadarOrLifecycleTerminal")
    a = o.filter(
      (f) => f.kind === "radarTerminal" || f.kind === "lifecycleTerminal"
    ), s = a.length > 0;
  else if (t.type === "PriceCrossesKnownLevel") {
    const f = Ln(e, t.timeframe, r), d = Be(e, t.timeframe, r);
    s = f != null && d != null && (t.direction === "above" ? f < t.frozenPrice && d >= t.frozenPrice : f > t.frozenPrice && d <= t.frozenPrice);
  } else if (t.type === "PriceEntersKnownZone") {
    const f = Ln(e, t.timeframe, r), d = Be(e, t.timeframe, r), m = (v) => v >= t.frozenLowerBound && v <= t.frozenUpperBound;
    s = f != null && d != null && !m(f) && m(d);
  }
  const c = a.map((f) => f.id);
  return i.conditionEvaluations.push({
    conditionId: t.id,
    effectiveAsOf: r,
    matched: s,
    matchedEventIds: c
  }), {
    matched: s,
    conditionIds: s ? [t.id] : [],
    eventIds: c
  };
}
function ns(e, t, n) {
  const r = W(e).knownEvents.filter(
    (i) => i.knownAt === t && i.knownAt > n
  );
  return e.sessionConfig.endOnRadarEpisodeTerminal && r.some((i) => i.kind === "radarTerminal") ? "RADAR_EPISODE_TERMINAL" : e.sessionConfig.endOnLifecycleTerminal && (r.some((i) => i.kind === "lifecycleTerminal") || ["invalidated", "expired"].includes(De(e, t).lifecycle.currentState)) ? "LIFECYCLE_TERMINAL" : null;
}
function Be(e, t, n) {
  var r;
  return ((r = Mr(
    W(e).candlesByTimeframe[t] ?? [],
    n
  ).at(-1)) == null ? void 0 : r.c) ?? null;
}
function Ln(e, t, n) {
  const i = (W(e).candlesByTimeframe[t] ?? []).map((o) => Math.max(o.closeTime, o.knownAt)).filter((o) => o < n);
  return i.length ? Be(e, t, Math.max(...i)) : null;
}
async function rs(e, t, n, r) {
  if (!r) throw new Error("Outcome reveal requires a separate ReplayOutcomeStore");
  const i = ["Skipped", "TradePlanRecorded", "CaseWindowEnded", "Abandoned"].includes(
    t.state
  ), o = t.state === "Active";
  if (o && (!n.payload.abandonActive || !e.sessionConfig.allowEarlyReveal))
    throw new Error("Active replay reveal requires configured explicit abandon-and-reveal");
  if (!i && !o) throw new Error(`Outcome cannot be revealed from ${t.state}`);
  const a = t.currentAsOf ?? e.manifest.startAsOf, s = await r.revealCaseOutcome({
    sessionId: t.id,
    manifestId: t.manifestId,
    revealedAt: a,
    revealedBeforeDecisionCompletion: o
  });
  return is(t, s, o), { envelope: s, early: o, revealedAt: a };
}
function is(e, t, n) {
  const { id: r, ...i } = t;
  if (t.schemaVersion !== Rr || t.id !== `replay-outcome:${C(i).slice(8)}` || t.sessionId !== e.id || t.manifestId !== e.manifestId || t.revealedBeforeDecisionCompletion !== n)
    throw new Error("Outcome envelope failed boundary or identity verification");
}
function Ys(e) {
  lt(e), jr(e);
  for (const t of e.frames) dn(t);
  return T(e);
}
function os(e) {
  const t = JSON.parse(e);
  if (!t || typeof t != "object" || Array.isArray(t))
    throw new TypeError("Serialized replay session must be an object");
  const n = t;
  lt(n), jr(n);
  for (const r of n.frames) dn(r);
  return b(n);
}
async function Xs(e, t) {
  const n = os(e);
  fn(t), qr(n, t);
  const r = as(n);
  if (T(r) !== T(n))
    throw new Error("Replay event-log reconstruction differs from serialized direct state");
  if (n.currentAsOf != null && n.currentFrameId != null) {
    const i = xt(n), o = n.events.findIndex((l) => {
      var f;
      return ((f = l.frame) == null ? void 0 : f.id) === i.id;
    });
    if (o < 0) throw new Error("Current replay frame is absent from the event log");
    let a = $r(Ur(n));
    for (const l of n.events.slice(0, o))
      a = ln(a, l);
    const s = n.events[o];
    let c = i.activeWakeResult;
    if (s.command.type === "Wait") {
      const l = xt(a);
      if (!s.wakePlan || !s.wakeResult)
        throw new Error("Replay wait frame is missing its wake audit artifacts");
      Dr(
        t,
        a,
        l,
        s.wakePlan
      );
      const f = await Hr(
        t,
        a,
        l,
        s.wakePlan
      );
      if (T(f.wakeResult) !== T(s.wakeResult) || f.requestedAsOf !== i.requestedAsOf || f.effectiveAsOf !== i.effectiveAsOf || f.state !== s.stateAfter || f.terminalReason !== s.terminalReasonAfter)
        throw new Error("Replay resume could not causally reproduce the saved wake result");
      c = f.wakeResult;
    }
    if (s.decisionRecord && (a = b({
      ...a,
      decisionRecords: [...a.decisionRecords, s.decisionRecord]
    })), (await It({
      loaded: t,
      session: a,
      requestedAsOf: i.requestedAsOf,
      effectiveAsOf: i.effectiveAsOf,
      wakeResult: c
    })).id !== i.id)
      throw new Error("Replay resume data does not reproduce the current DecisionFrame");
  }
  return n;
}
function as(e) {
  let t = $r(Ur(e));
  const n = /* @__PURE__ */ new Set();
  for (const r of e.events) {
    if (n.has(r.command.id)) throw new Error("Replay event log repeats a command id");
    n.add(r.command.id), Lr(t, r.command), t = ln(t, r);
  }
  return t;
}
function $r(e) {
  return un({
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
function Ur(e) {
  return b({
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
function un(e) {
  const { integrityHash: t, ...n } = e;
  return b({ ...n, integrityHash: C(n) });
}
function lt(e) {
  if (e.schemaVersion !== br || e.replayEngineVersion !== Se) throw new Error("Unsupported replay session schema or engine version");
  const { integrityHash: t, ...n } = e;
  if (t !== C(n)) throw new Error("Replay session integrity mismatch");
  if (e.revision !== e.events.length) throw new Error("Replay revision does not match event count");
}
function fn(e) {
  if (nn(e.sessionConfig) !== e.sessionConfig.canonicalConfigHash || e.sessionConfig.replayEngineVersion !== Se || e.manifest.radarEpisodeId !== e.dataBundle.radarEpisode.id || e.manifest.radarEpisodeObservationId !== e.dataBundle.radarEpisode.observationId || e.manifest.selectionProfileRef.canonicalConfigHash !== e.radarSelectionProfile.canonicalConfigHash || e.manifest.strategyProfileRef.profileHash !== e.strategyProfile.profileHash)
    throw new Error("Loaded replay case identity is inconsistent");
}
function qr(e, t) {
  if (e.id !== Fr(t) || e.manifestId !== t.manifest.id || e.radarEpisodeId !== t.dataBundle.radarEpisode.id || e.radarEpisodeObservationId !== t.dataBundle.radarEpisode.observationId || e.radarSelectionProfileRef.hash !== t.radarSelectionProfile.canonicalConfigHash || e.strategyProfileRef.hash !== t.strategyProfile.profileHash || e.lifecycleVersion !== t.strategyProfile.lifecycleVersion || e.lifecycleConfigHash !== t.strategyProfile.lifecycleConfigHash || e.sessionConfigRef.hash !== t.sessionConfig.canonicalConfigHash || e.marketDataBundleFingerprint !== t.dataBundle.causalPrefixFingerprint || T(e.venueRulesRef) !== T(t.sessionConfig.venueRulesRef))
    throw new Error("Replay session cannot use this loaded manifest/profile/data bundle");
}
function dn(e) {
  if (e.decisionSnapshot.effectiveAsOf !== e.effectiveAsOf || e.generatedAtLogicalTime !== e.effectiveAsOf) throw new Error("Replay frame cutoff metadata is inconsistent");
  for (const t of Object.values(e.visibleCandlesByTimeframe))
    if (t.some((n) => n.closeTime > e.effectiveAsOf || n.knownAt > e.effectiveAsOf))
      throw new Error("Replay frame contains a future or incomplete candle");
  ss(e, e.effectiveAsOf);
}
function ss(e, t) {
  const n = (r) => {
    if (!(!r || typeof r != "object")) {
      if (Array.isArray(r)) {
        r.forEach(n);
        return;
      }
      for (const [i, o] of Object.entries(r)) {
        if (i === "knownAt" && typeof o == "number" && o > t)
          throw new Error("Replay frame contains evidence not known at its cutoff");
        n(o);
      }
    }
  };
  n(e);
}
function jr(e) {
  const t = /* @__PURE__ */ new Set([
    "futureOutcomeRef",
    "futureCandlesByTimeframe",
    "outcome",
    "maximumFavorablePriceExcursionFromDetected",
    "maximumAdversePriceExcursionFromDetected",
    "radarTerminalResult",
    "lifecycleStateTimestamps"
  ]), n = (r) => {
    if (!(!r || typeof r != "object")) {
      if (Array.isArray(r)) {
        r.forEach(n);
        return;
      }
      for (const [i, o] of Object.entries(r)) {
        if (t.has(i)) throw new Error(`Public replay session contains forbidden key ${i}`);
        n(o);
      }
    }
  };
  n(e);
}
function wt(e) {
  return Number.isFinite(e) && e > 0;
}
function Dn(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite timestamp`);
}
export {
  ks as CANDLE_TIMESTAMP_SEMANTICS,
  Oa as DECISION_RECORD_SCHEMA_VERSION,
  nr as DECISION_SNAPSHOT_SCHEMA_VERSION,
  co as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  jt as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  Ms as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  Ie as IMPULSE_FADE_CANDIDATE_GATE,
  ii as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  X as IMPULSE_FADE_LIFECYCLE_VERSION,
  io as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  oo as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  se as IMPULSE_FADE_SETUP_FAMILY,
  Bs as InMemoryReplayHistoricalDataAdapter,
  zs as InMemoryReplayOutcomeStore,
  js as JsonReplayHistoricalDataAdapter,
  Ut as RADAR_EPISODE_SCHEMA_VERSION,
  qt as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  wo as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  ar as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  go as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  bo as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  zt as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  en as REPLAY_ANALYSIS_STATE_SCHEMA_VERSION,
  sr as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  Ar as REPLAY_COMMAND_SCHEMA_VERSION,
  oa as REPLAY_DATA_BUNDLE_SCHEMA_VERSION,
  ta as REPLAY_DECISION_FRAME_SCHEMA_VERSION,
  Se as REPLAY_ENGINE_VERSION,
  Er as REPLAY_EVENT_SCHEMA_VERSION,
  xn as REPLAY_JSON_DATA_SCHEMA_VERSION,
  tn as REPLAY_KNOWN_EVENT_SCHEMA_VERSION,
  Rr as REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION,
  Jt as REPLAY_SESSION_CONFIG_SCHEMA_VERSION,
  br as REPLAY_SESSION_SCHEMA_VERSION,
  ra as REPLAY_WAKE_CONDITION_SCHEMA_VERSION,
  na as REPLAY_WAKE_PLAN_SCHEMA_VERSION,
  ia as REPLAY_WAKE_RESULT_SCHEMA_VERSION,
  xr as SIZING_MODEL_VERSION,
  xa as SIZING_RESULT_SCHEMA_VERSION,
  ro as STRATEGY_PROFILE_SCHEMA_VERSION,
  Pa as TRADE_PLAN_SCHEMA_VERSION,
  vs as appendSyntheticCandle,
  Ks as applyReplayCommand,
  ge as bucketStart,
  Pr as calculateLinearPerpetualSizing,
  ue as candleCloseTime,
  de as candleRevisionKnownAt,
  yn as candleToBytes,
  Qr as candlesToBytes,
  C as canonicalHash,
  Ds as canonicalRadarJson,
  T as canonicalSerialize,
  Yn as computeAnchoredVwapLine,
  Cs as computeAnchoredVwapSignals,
  Ts as computeAnchoredVwapSnapshot,
  Es as computeAtrLine,
  ws as computeBollingerBands,
  fs as computeCloseChangePct,
  ys as computeEmaLine,
  Ft as computeExtensionSnapshot,
  As as computeMacd,
  Pe as computeMarketStructure,
  bi as computeRelativeCumulativeReturnLine,
  Ps as computeRelativeStrengthDivergences,
  gs as computeRsiLine,
  oi as computeSetupState,
  hs as computeSmaLine,
  bs as computeStochRsi,
  Is as computeStructureActiveLevels,
  xs as computeSupportResistanceZones,
  gi as computeSupportResistanceZonesFromSwings,
  wi as computeSwingPoints,
  ds as computeViewBounds,
  ps as computeWmaLine,
  pt as createDecisionRecord,
  Ns as createDecisionReferenceLevel,
  lo as createDecisionSnapshot,
  Hs as createDefaultReplaySessionConfig,
  Et as createDurableObjectReference,
  Eo as createExecutionVenueEligibilityObservation,
  so as createImpulseFadeResearchProfile,
  Ao as createRadarSelectionProfile,
  _s as createRadarStructureObservation,
  Vs as createReplayAnalysisStateObservation,
  sa as createReplayCandleRecord,
  Ws as createReplayCommand,
  $s as createReplayKnownEvent,
  Qs as createReplaySession,
  aa as createReplaySessionConfig,
  _r as createReplayWakeCondition,
  Gs as createReplayWakePlan,
  rr as createStrategyProfile,
  Na as createTradePlan,
  Fs as createUniverseMembershipObservation,
  ao as decisionReferenceObservationId,
  ir as decisionSnapshotId,
  or as decisionSnapshotReferenceLevels,
  os as deserializeReplaySession,
  Ss as evaluateImpulseFadeSnapshot,
  Rs as evaluateImpulseFadeTimeline,
  _a as evaluateTradePlanCompliance,
  ot as executionVenueEligibilityObservationId,
  b as immutableJsonClone,
  Ee as impulseFadeLifecycleConfigHash,
  Ot as isStrictTimeframe,
  Os as lineToBytes,
  Us as loadReplayCase,
  ms as makeSyntheticCandles,
  Kr as mergeLiveCandle,
  Hn as normalizeOhlcvPoint,
  ls as normalizeRestTimeframe,
  Vn as packHistoricalCandles,
  wa as parseReplayJsonHistoricalDataFixture,
  us as prependHistoricalCandles,
  Gt as radarEpisodeObservationId,
  Wt as radarSelectionProfileHash,
  cr as radarStructureObservationId,
  as as reconstructReplaySession,
  st as replayAnalysisStateObservationId,
  rn as replayCandleLogicalId,
  on as replayCandleObservationId,
  fr as replayCaseManifestId,
  qs as replayDataFingerprintAt,
  an as replayKnownEventId,
  nn as replaySessionConfigHash,
  sn as replaySha256,
  Xs as resumeReplaySession,
  Ls as scanRadarEpisodes,
  Nt as selectCompletedCandleRevisionsAt,
  Ys as serializeReplaySession,
  rt as strategyProfileHash,
  V as strictTimeframeToSeconds,
  Je as timeframeToSeconds,
  Or as tradePlanId,
  it as universeMembershipObservationId
};
