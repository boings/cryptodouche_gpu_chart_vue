function re(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function ui(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ie(e, t) {
  return Math.floor(e / t) * t;
}
function st(e) {
  const t = ut(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = Xt(n.ts), o = Z(n.o), i = Z(n.h), s = Z(n.l), a = Z(n.c);
  return r == null || o == null || i == null || s == null || a == null ? null : {
    ts: r,
    o,
    h: i,
    l: s,
    c: a,
    v_base: Z(n.v_base),
    v_quote: Z(n.v_quote),
    ver: Z(n.ver)
  };
}
function at(e, t, n) {
  const r = re(t), o = Gt(
    e.map((a, c) => ct(a, c)).filter((a) => a != null),
    r
  ).slice(-Math.max(1, n));
  if (!o.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const i = ie(o[0].ts, r), s = o.map((a) => {
    const c = ie(a.ts, r);
    return {
      ...a,
      bucket: c,
      x: (c - i) / r
    };
  });
  return Me({
    timeframeSec: r,
    firstBucket: i,
    candles: s,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function fi(e, t, n) {
  const r = e.candles.length, o = t.map((s, a) => ct(s, a)).filter((s) => s != null).filter((s) => ie(s.ts, e.timeframeSec) < e.firstBucket).sort(lt);
  if (!o.length) return 0;
  const i = at(
    [...o, ...e.candles],
    n,
    o.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function jt(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function Ge(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function di(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function zt(e, t, n, r = 3) {
  const o = st(t);
  if (!o) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = ie(o.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const s = e.positionByBucket.get(i), a = (i - e.firstBucket) / e.timeframeSec, c = { ...o, bucket: i, x: a };
  if (s != null)
    return Jt(c, e.candles[s]) ? { kind: "ignore", reason: "stale-version" } : Zt(e.candles[s], c) ? (e.candles[s] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[s] = c, {
      kind: "replace",
      position: s,
      bytes: Ge(c)
    });
  const u = e.candles[e.candles.length - 1];
  return i <= u.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - u.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Qt(e), { kind: "reset", bytes: jt(e.candles) }) : (Me(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: Ge(c)
  }));
}
function mi(e, t = []) {
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
function hi(e, t, n) {
  const r = re(n), o = Math.floor(Date.now() / 1e3), i = ie(o, r), s = e.split("").reduce((u, l) => u + l.charCodeAt(0), 0), a = [];
  let c = 40 + s % 160;
  for (let u = Math.max(1, t) - 1; u >= 0; u--) {
    const l = i - u * r, f = Math.sin((t - u + s) / 9) * 0.8, d = c, h = Math.max(1e-4, d + f + Math.cos((t - u) / 13) * 0.35), m = Math.max(d, h) + 0.35 + Math.abs(Math.sin(u + s)) * 0.5, v = Math.min(d, h) - 0.35 - Math.abs(Math.cos(u + s)) * 0.5, y = 50 + s % 90 + Math.abs(Math.sin((t - u + s) / 5)) * 180;
    a.push({ ts: l, o: d, h: m, l: v, c: h, v_base: y, v_quote: y * h }), c = h;
  }
  return at(a, n, t);
}
function vi(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, o = Math.sin(r / 600) * 0.7, i = n.c, s = Math.max(1e-4, i + o), a = Math.max(i, s) + 0.5, c = Math.min(i, s) - 0.5, u = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(o) * 0.36));
  return zt(e, { ts: r, o: i, h: a, l: c, c: s, v_base: u, v_quote: u * s }, t);
}
function Qt(e) {
  const t = e.candles[0];
  e.firstBucket = t ? t.bucket : 0;
  for (const n of e.candles)
    n.x = (n.bucket - e.firstBucket) / e.timeframeSec;
  Me(e);
}
function Me(e) {
  return e.positionByBucket = /* @__PURE__ */ new Map(), e.candles.forEach((t, n) => {
    e.positionByBucket.set(t.bucket, n);
  }), e;
}
function ct(e, t) {
  const n = st(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function Gt(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = ie(r.ts, t), i = n.get(o);
    (!i || lt(r, i) > 0) && n.set(o, r);
  }
  return Array.from(n.entries()).sort(([r], [o]) => r - o).map(([, r]) => Wt(r));
}
function lt(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function Wt(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function Xt(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? Kt(e) : Yt(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function Kt(e) {
  const [
    t,
    n = 1,
    r = 0,
    o = 0,
    i = 0,
    s = 0,
    a = 0,
    c = 0,
    u = 0
  ] = e, l = Math.floor(Number(s) / 1e6);
  return Date.UTC(
    Number(t),
    0,
    Number(n),
    Number(r) - Number(a),
    Number(o) - Number(c),
    Number(i) - Number(u),
    l
  );
}
function Yt(e) {
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
function Zt(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function Jt(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function Z(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function ut(e) {
  if (typeof e == "string")
    try {
      return ut(JSON.parse(e));
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
      const u = n(o[c]);
      return u == null ? [] : [`${JSON.stringify(c)}:${u}`];
    }).join(",")}}`, t.delete(o), s;
  }
  const r = n(e);
  if (r == null) throw new TypeError("Canonical JSON root cannot be undefined");
  return r;
}
function O(e) {
  const t = new TextEncoder().encode(M(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function I(e) {
  return ft(JSON.parse(M(e)));
}
function ft(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) ft(t);
    Object.freeze(e);
  }
  return e;
}
const G = "impulse_fade_v1", U = "impulse_fade_v1.lifecycle.1", en = "impulse_fade_v1.lifecycle-config.1", ce = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function yi(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((o, i) => {
    r += o.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(o.x, r / t);
  }), new Float32Array(n);
}
function bi(e, t = 20) {
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
function gi(e, t = 20) {
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
function pi(e, t = 20, n = 2) {
  if (e.length < t)
    return {
      basis: new Float32Array(),
      upper: new Float32Array(),
      lower: new Float32Array()
    };
  const r = [], o = [], i = [];
  let s = 0, a = 0;
  return e.forEach((c, u) => {
    if (s += c.c, a += c.c * c.c, u >= t) {
      const l = e[u - t].c;
      s -= l, a -= l * l;
    }
    if (u >= t - 1) {
      const l = s / t, f = Math.max(0, a / t - l * l), d = Math.sqrt(f) * n;
      r.push(c.x, l), o.push(c.x, l + d), i.push(c.x, l - d);
    }
  }), {
    basis: new Float32Array(r),
    upper: new Float32Array(o),
    lower: new Float32Array(i)
  };
}
function Si(e, t = 14) {
  return ee(kt(e, t));
}
function wi(e, t = 14, n = 14, r = 3, o = 3) {
  const i = kt(e, t), s = te(n);
  if (i.length < s)
    return { k: new Float32Array(), d: new Float32Array() };
  const a = [];
  for (let l = s - 1; l < i.length; l++) {
    let f = 1 / 0, d = -1 / 0;
    for (let v = 0; v < s; v++) {
      const y = i[l - v].value;
      f = Math.min(f, y), d = Math.max(d, y);
    }
    const h = d - f, m = h > 0 ? (i[l].value - f) / h * 100 : 50;
    a.push({ x: i[l].x, value: m });
  }
  const c = Je(a, te(r)), u = Je(c, te(o));
  return {
    k: ee(c),
    d: ee(u)
  };
}
function Ai(e, t = 12, n = 26, r = 9) {
  const o = _e(e, t), i = _e(e, n), s = [];
  for (let l = 0; l < e.length; l++) {
    const f = o[l], d = i[l];
    f == null || d == null || s.push({ x: e[l].x, value: f - d });
  }
  const a = Jn(s, r), c = new Map(s.map((l) => [l.x, l.value])), u = a.map((l) => ({
    x: l.x,
    value: (c.get(l.x) ?? l.value) - l.value
  }));
  return {
    macd: ee(s),
    signal: ee(a),
    histogram: ee(u)
  };
}
function ki(e, t = 14) {
  const n = Re(e, t), r = [];
  return n.forEach((o, i) => {
    o != null && r.push({ x: e[i].x, value: o });
  }), ee(r);
}
function Fe(e, t = {}) {
  const n = k(t.windowSeconds, 60, 2592e3, 86400), r = k(t.historyDays, 1, 365, 180), o = k(t.minSamples, 1, 5e3, 20), i = k(t.emaPeriod, 2, 500, 20), s = k(t.atrPeriod, 2, 500, 14), a = wt(e);
  if (!a)
    return Mn(n);
  const c = e.indexOf(a), u = At(e, a.bucket - n, c), l = u && L(u.c) ? (a.c / u.c - 1) * 100 : null, f = l == null ? [] : Fn(e, {
    windowSeconds: n,
    earliestBucket: a.bucket - r * 86400,
    excludeBucket: a.bucket
  }), d = l != null && f.length >= o ? Ln(f, l) : null, h = l != null && f.length >= o ? Dn(f, l) : null, m = _e(e, i)[c] ?? null, v = Re(e, s)[c] ?? null, y = m != null && v != null && Number.isFinite(m) && Number.isFinite(v) && v > 0 ? (a.c - m) / v : null;
  return {
    candle: a,
    referenceCandle: u,
    windowSeconds: n,
    returnPct: l,
    percentile: d,
    zScore: h,
    rollingReturnCount: f.length,
    ema: m,
    atr: v,
    atrExtension: y
  };
}
function tn(e = {}) {
  var K, ve, ye;
  const t = e.executionTimeframe ?? "chart", n = w(e.asOf), r = w(e.latestTs) ?? wn(e.candles ?? [], t) ?? w((K = e.structure) == null ? void 0 : K.updatedTs) ?? w((ve = e.marketStructure) == null ? void 0 : ve.summary.updatedTs) ?? null, o = n ?? r, i = o == null ? null : Ve(e.candles ?? [], o, t), s = (i == null ? void 0 : i.candle.c) ?? w(e.latestPrice), a = nn(e.marketStructure ?? null, n), c = (a == null ? void 0 : a.summary) ?? rn(e.structure, n), u = e.htfStructures ?? [], l = n == null ? e.htfStructures ?? [] : De(e.htfStructures ?? [], n), f = (e.srZones ?? []).filter(
    (Y) => n == null || P(Y) <= n
  ), d = (e.rsDivergences ?? []).filter(
    (Y) => n == null || P(Y) <= n
  ), h = (e.anchoredVwapSignals ?? []).filter(
    (Y) => n == null || P(Y) <= n
  ), m = _(e.resistanceNearPct, 0, 10, 1.5), v = _(e.retestNearPct, 0, 10, 0.8), y = Tn(e.extension ?? null), p = En(f, s, m), E = xn(d), T = Pn(c), R = Cn(
    h,
    e.avwapDistancePct
  ), x = In(c, f, s, v), S = Nn(y, p, c, s), b = [
    y,
    p,
    E,
    T,
    R,
    x
  ], g = {
    checks: b,
    asOf: o,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? oe({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, C = hn({
    extension: y,
    htfResistance: p,
    htfStructures: l,
    rsWeakness: E,
    structureShift: T,
    avwapFailure: R,
    retest: x,
    invalidated: S
  });
  return (ye = e.candles) != null && ye.length && o != null ? an({
    ...e,
    asOf: o,
    latestPrice: s,
    marketStructure: a,
    structure: c,
    htfStructures: u,
    srZones: f,
    rsDivergences: d,
    anchoredVwapSignals: h,
    checks: b,
    executionTimeframe: t
  }) : bt({
    ...g,
    state: C,
    reason: On(C, b),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function nn(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((s) => s.knownAt <= t), r = e.breaks.filter((s) => s.knownAt <= t), o = ((i = W(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: o,
    summary: qe(n, r, o)
  };
}
function rn(e, t) {
  if (!e || t == null) return e ?? null;
  const n = w(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function Ri(e) {
  return on(e).records;
}
function oe(e = {}) {
  var t, n, r, o, i, s, a, c, u, l, f;
  return O({
    lifecycleVersion: U,
    lifecycleConfigVersion: en,
    candidateGate: ce,
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
      minMoveAtr: _((u = e.marketStructureOptions) == null ? void 0 : u.minMoveAtr, 0, 10, 0.75),
      maxSwings: k((l = e.marketStructureOptions) == null ? void 0 : l.maxSwings, 1, 500, 120),
      maxBreaks: k((f = e.marketStructureOptions) == null ? void 0 : f.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: _(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: _(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: _(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: _(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: _(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: k(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function Ti(e) {
  var a;
  const t = ht(e), n = W(t);
  if (n == null) return null;
  const r = mt(e, n), o = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], s = new Set(
    i.map((c) => j(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && P(c) <= n && s.add(P(c));
  for (const c of [...s].sort((u, l) => u - l))
    Le(
      Ae(i, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (a = e.config) == null ? void 0 : a.marketStructureOptions,
      c,
      o
    );
  return dt(
    e,
    n,
    o,
    r
  );
}
function on(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, o = oe(r), i = ht(e), s = mt(
    e,
    W(i) ?? 0
  ), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), l = w(e.from) ?? -1 / 0;
  let f = null;
  return { records: i.map((h) => {
    var T, R, x, S, b;
    const m = dt(
      e,
      h,
      a,
      s
    ), v = vt(e.candidateMetrics, h), y = (v == null ? void 0 : v.metrics) ?? He(
      Fe(
        Ae(n, t, h),
        r.extensionOptions
      )
    );
    f = m;
    const p = m.evidence.filter((g) => c.has(g.id) ? !1 : (c.add(g.id), g.knownAt >= l)), E = m.transitions.filter((g) => {
      const C = sn(g);
      return u.has(C) ? !1 : (u.add(C), g.knownAt >= l);
    });
    return {
      asOf: h,
      setupFamily: G,
      lifecycleVersion: U,
      lifecycleConfigHash: o,
      candidateGatePassed: me(y),
      candidateId: ((T = m.candidate) == null ? void 0 : T.id) ?? null,
      candidateDetectedAt: ((R = m.candidate) == null ? void 0 : R.detectedAt) ?? null,
      initialMtfContext: ((x = m.candidate) == null ? void 0 : x.initialMtfContext) ?? [],
      currentState: m.currentState,
      stateSince: m.stateSince,
      transition: W(E) ?? null,
      transitions: E,
      evidenceAdded: p,
      pendingConditions: m.pendingConditions,
      confluence: m.confluence,
      episodeHigh: ((S = m.candidate) == null ? void 0 : S.episodeHigh) ?? null,
      episodeHighTime: ((b = m.candidate) == null ? void 0 : b.episodeHighTime) ?? null,
      activeBreakLevel: m.activeBreakLevel,
      retestLevel: m.retestLevel,
      terminalReason: m.invalidationReason ?? m.expiryReason,
      dataQualityNotes: m.dataQuality
    };
  }), latestSnapshot: f };
}
function dt(e, t, n, r) {
  const o = e.executionTimeframe, i = e.candlesByTimeframe[o] ?? [], s = e.config ?? {}, a = oe(s), c = Ae(i, o, t), u = Fe(c, s.extensionOptions), l = vt(e.candidateMetrics, t), f = (l == null ? void 0 : l.metrics) ?? He(u), d = Le(
    c,
    o,
    e.structureEvents ?? [],
    s.marketStructureOptions,
    t,
    n
  ), h = r.filter(
    (v) => (v.summary.updatedTs ?? 0) <= t
  ), m = W(c) ?? null;
  return tn({
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
    htfStructures: h,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (m == null ? void 0 : m.c) ?? null,
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
function mt(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const o = new Set(
      r.map((i) => j(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && P(i) <= t && o.add(P(i));
    return [...o].sort((i, s) => i - s).map((i) => {
      var a;
      const s = Le(
        Ae(r, n, i),
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
const Ei = "openTime";
function j(e, t) {
  return (w(e.bucket) ?? w(e.ts) ?? 0) + Math.max(1, re(t));
}
function Ae(e, t, n) {
  return e.filter((r) => j(r, t) <= n);
}
function ht(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, s] of Object.entries(e.candlesByTimeframe))
    for (const a of s) t.add(j(a, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(w(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(P(i));
  for (const i of e.avwapEvents ?? []) t.add(P(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(P(i));
  for (const i of e.supportResistanceZones ?? []) t.add(P(i));
  for (const i of e.evaluationPoints ?? []) {
    const s = w(i);
    s != null && t.add(s);
  }
  const n = [...t].filter(Number.isFinite).sort((i, s) => i - s), r = w(e.from) ?? n[0] ?? 0, o = w(e.to) ?? W(n) ?? r;
  return t.add(r), t.add(o), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= o).sort((i, s) => i - s);
}
function vt(e, t) {
  return W([...e ?? []].filter((n) => (w(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (w(n.knownAt) ?? n.asOf) - (w(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function Le(e, t, n, r, o, i) {
  var f;
  const s = ue(e, r), a = n.filter(
    (d) => (!d.sourceTimeframe || d.sourceTimeframe === t) && P(d) <= o
  ), c = i ?? /* @__PURE__ */ new Map();
  for (const d of [...s.breaks, ...a])
    c.set(
      Q(
        d.kind,
        t,
        d.eventTime,
        d.knownAt,
        `${d.direction}:${d.level}`
      ),
      d
    );
  const u = [...c.values()].filter((d) => d.knownAt <= o).sort(
    (d, h) => d.knownAt - h.knownAt || d.eventTime - h.eventTime
  );
  if (!u.length) return s;
  const l = ((f = W(u)) == null ? void 0 : f.direction) ?? s.trend;
  return {
    swings: s.swings,
    breaks: u,
    trend: l,
    summary: qe(s.swings, u, l)
  };
}
function sn(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function an(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = cn(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), o = gn(r, n);
  let i = ln(r, e);
  if (!i && me(e.extension ?? null)) {
    const s = Ve(t, e.asOf, e.executionTimeframe);
    s && (i = {
      index: s.index,
      candle: s.candle,
      eventTime: $(s.candle),
      knownAt: Math.min(
        e.asOf,
        z(t, s.index, e.executionTimeframe)
      ),
      metrics: Be(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, o.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? yt(i, e, e.asOf, o) : bt({
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
function cn(e, t, n, r, o) {
  if (o != null && o.length)
    return [...o].map((s) => {
      const a = w(s.knownAt) ?? s.asOf, c = Ve(e, a, r);
      if (!c || a > n) return null;
      const u = w(s.eventTime) ?? $(c.candle), l = Be(s.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: u,
        knownAt: a,
        metrics: l,
        pass: me(l),
        rollingReturnCount: Math.max(0, Math.trunc(s.sampleCount ?? 0))
      };
    }).filter((s) => s != null).sort((s, a) => s.knownAt - a.knownAt || s.eventTime - a.eventTime);
  const i = [];
  for (let s = 0; s < e.length; s += 1) {
    const a = e[s], c = z(e, s, r);
    if (c > n) continue;
    const u = Fe(e.slice(0, s + 1), t), l = He(u);
    i.push({
      index: s,
      candle: a,
      eventTime: $(a),
      knownAt: c,
      metrics: l,
      pass: me(l),
      rollingReturnCount: u.rollingReturnCount
    });
  }
  return i;
}
function ln(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const s of e)
    s.pass && !r && n.push(s), r = s.pass;
  if (!n.length) return null;
  let o = n[0];
  for (const s of n.slice(1)) {
    const c = ((i = yt(o, t, s.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    c != null && e.some((u) => u.knownAt > c && u.knownAt < s.knownAt && !u.pass) && (o = s);
  }
  return o;
}
function yt(e, t, n, r) {
  const o = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", s = t.venue ?? "", a = t.executionTimeframe, c = De(
    t.htfStructures ?? [],
    e.knownAt
  ).map((b) => ({
    timeframe: b.timeframe,
    state: b.summary.state,
    trend: b.summary.trend,
    transitionDirection: b.summary.transitionDirection,
    updatedTs: b.summary.updatedTs
  })), u = Sn({
    setupFamily: G,
    symbol: o,
    source: i,
    venue: s,
    executionTimeframe: a,
    detectedAt: e.knownAt
  }), l = [
    {
      id: Q("candidate_detected", a, e.eventTime, e.knownAt),
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
      evidenceIds: [l[0].id],
      evidenceCodes: [l[0].code],
      explanation: "Candidate episode detected"
    }
  ], d = dn(t, e, n), h = un(e, t, n);
  let m = "developing", v = e.knownAt, y = null, p = null, E = null, T = null, R = null;
  for (const b of h) {
    if (y != null) break;
    if (!(b.knownAt < e.knownAt || b.knownAt > n)) {
      if (b.lifecycleKind === "deterioration") {
        l.push({ ...b, contributesTo: "deteriorating" }), m === "developing" && (f.push(ae(m, "deteriorating", b)), m = "deteriorating", v = b.knownAt);
        continue;
      }
      if (b.lifecycleKind === "bearishBreak") {
        l.push({ ...b, contributesTo: "waitingForRetest" }), (m === "developing" || m === "deteriorating") && (f.push(ae(m, "waitingForRetest", b)), m = "waitingForRetest", v = b.knownAt, p = b.breakLevel ?? null);
        continue;
      }
      if (b.lifecycleKind === "retest") {
        m === "waitingForRetest" && p && b.relatedEventId === p.evidenceId && b.knownAt > p.knownAt && (l.push({ ...b, contributesTo: "entryCandidate" }), f.push(ae(m, "entryCandidate", b)), m = "entryCandidate", v = b.knownAt, E = b.breakLevel ?? p);
        continue;
      }
      if (b.lifecycleKind === "invalidation") {
        (m === "deteriorating" || m === "waitingForRetest" || m === "entryCandidate") && (l.push({ ...b, contributesTo: "invalidated" }), f.push(ae(m, "invalidated", b)), m = "invalidated", v = b.knownAt, y = b.knownAt, T = b.explanation);
        continue;
      }
      b.lifecycleKind === "expiry" && m !== "entryCandidate" && (l.push({ ...b, contributesTo: "expired" }), f.push(ae(m, "expired", b)), m = "expired", v = b.knownAt, y = b.knownAt, R = b.explanation);
    }
  }
  const x = St(
    t.candles ?? [],
    e.eventTime,
    n,
    a
  ), S = {
    id: u,
    setupFamily: G,
    lifecycleVersion: U,
    lifecycleConfigHash: t.lifecycleConfigHash ?? oe({
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
    currentState: m,
    stateSince: v,
    terminalAt: y
  };
  return {
    strategy: "pumpFade",
    setupFamily: G,
    lifecycleVersion: U,
    lifecycleConfigHash: S.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: a,
    state: m,
    currentState: m,
    stateSince: v,
    label: ke(m),
    reason: pn(m, l, f, T, R),
    checks: t.checks,
    updatedTs: n,
    candidate: S,
    evidence: l.sort((b, g) => b.knownAt - g.knownAt || b.eventTime - g.eventTime),
    transitions: f,
    pendingConditions: pt(m, p),
    activeBreakLevel: p,
    retestLevel: E,
    confluence: d,
    invalidationReason: T,
    expiryReason: R,
    dataQuality: r
  };
}
function un(e, t, n) {
  const r = [], o = t.executionTimeframe;
  for (const u of t.rsDivergences ?? []) {
    if (u.direction !== "bearish") continue;
    const l = P(u);
    if (!le(u, e, n)) continue;
    const f = u.signal === "break" ? "rs_break_bearish" : u.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: Q(f, o, u.eventTime, l, u.x),
      code: f,
      explanation: `${u.label}: bearish relative-strength deterioration`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: o,
      price: u.price,
      value: u.rs,
      lifecycleKind: "deterioration",
      sortPriority: 10
    });
  }
  for (const u of t.anchoredVwapSignals ?? []) {
    const l = P(u);
    u.kind !== "failedReclaim" || !le(u, e, n) || r.push({
      id: Q("avwap_failed_reclaim", o, u.eventTime, l, u.x),
      code: "avwap_failed_reclaim",
      explanation: "AVWAP failed reclaim confirmed after candidate detection",
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: o,
      price: u.price,
      level: u.vwap,
      lifecycleKind: "deterioration",
      sortPriority: 20
    });
  }
  const i = mn(t), s = [];
  for (const u of i) {
    const l = P(u);
    if (u.direction !== "bearish" || !le(u, e, n)) continue;
    const f = u.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", d = Q(f, o, u.eventTime, l, u.x), h = {
      level: u.level,
      sourceTimeframe: o,
      eventTime: u.eventTime,
      knownAt: l,
      evidenceId: d
    }, m = {
      id: d,
      code: f,
      explanation: `${u.label} down through ${q(u.level)}`,
      eventTime: u.eventTime,
      knownAt: l,
      sourceTimeframe: o,
      level: u.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: h
    };
    s.push(m), r.push(m);
  }
  for (const u of s) {
    const l = fn(e, u, t, n);
    l && r.push(l);
  }
  for (const u of i) {
    const l = P(u);
    if (u.kind !== "StructureBreak" || u.direction !== "bullish" || !le(u, e, n))
      continue;
    const f = (t.candles ?? [])[u.index], d = St(
      t.candles ?? [],
      e.eventTime,
      l - 1,
      o
    ), h = _(t.invalidationBps, 0, 1e3, 10);
    !f || (d == null ? void 0 : d.price) == null || f.c <= d.price * (1 + h / 1e4) || r.push({
      id: Q("bullish_continuation_invalidation", o, u.eventTime, l, u.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${q(d.price)}`,
      eventTime: u.eventTime,
      knownAt: l,
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
    id: Q("candidate_expired", o, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${Rn(a)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: o,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (u, l) => u.knownAt - l.knownAt || u.eventTime - l.eventTime || u.sortPriority - l.sortPriority || u.code.localeCompare(l.code)
  );
}
function fn(e, t, n, r) {
  var l;
  const o = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const s = _(n.retestToleranceBps, 0, 1e3, 35), a = _(n.retestToleranceAtr, 0, 10, 0.25), c = k((l = n.extensionOptions) == null ? void 0 : l.atrPeriod, 2, 100, 14), u = Re(o, c);
  for (let f = 0; f < o.length; f += 1) {
    const d = o[f], h = z(o, f, n.executionTimeframe), m = $(d);
    if (h <= t.knownAt || m < t.knownAt || m < e.knownAt || h > r)
      continue;
    const v = u[f] ?? 0, y = Math.max(
      i.level * (s / 1e4),
      Number.isFinite(v) ? v * a : 0
    );
    if (d.h >= i.level - y && d.l <= i.level + y && d.c < i.level && d.c <= d.o)
      return {
        id: Q(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          $(d),
          h,
          f
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${q(i.level)}`,
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
function dn(e, t, n) {
  const r = [], o = $e(
    e.srZones.filter((a) => P(a) <= n),
    e.latestPrice,
    _(e.resistanceNearPct, 0, 10, 1.5)
  );
  o && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${q(o.low)}-${q(o.high)}`,
    eventTime: o.eventTime,
    knownAt: o.knownAt,
    sourceTimeframe: "MTF",
    level: o.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (a) => a.kind === "loss" && le(a, t, n)
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
  const s = w(e.avwapDistancePct);
  s != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${fe(s, 1)}% from AVWAP`,
    value: s,
    sourceTimeframe: e.executionTimeframe
  });
  for (const a of De(e.htfStructures, n))
    a.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${a.timeframe} structure`,
      detail: kn(a.summary),
      eventTime: a.summary.updatedTs,
      knownAt: a.summary.updatedTs,
      sourceTimeframe: a.timeframe
    });
  return r;
}
function De(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = w(r.summary.updatedTs);
    if (o != null && o > t) continue;
    const i = n.get(r.timeframe), s = w(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (o ?? -1 / 0) >= s) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function mn(e) {
  var r, o, i;
  const t = (o = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && o.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((s) => {
    const a = `${s.kind}:${s.direction}:${s.x}:${s.level}:${P(s)}`;
    return n.has(a) ? !1 : (n.add(a), !0);
  });
}
function hn(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && We(e.htfResistance, e.htfStructures) ? "deteriorating" : We(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function bt(e) {
  return {
    strategy: "pumpFade",
    setupFamily: G,
    lifecycleVersion: U,
    lifecycleConfigHash: e.lifecycleConfigHash ?? oe(),
    asOf: e.asOf,
    executionTimeframe: e.executionTimeframe,
    state: e.state,
    currentState: e.state,
    stateSince: e.asOf,
    label: ke(e.state),
    reason: e.reason,
    checks: e.checks,
    updatedTs: e.updatedTs,
    candidate: null,
    evidence: [],
    transitions: [],
    pendingConditions: pt(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function gt(e, t = {}) {
  const n = Bn(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let o = 0, i = 0;
  for (let s = n; s < e.length; s += 1) {
    const a = e[s];
    if (!a) continue;
    const c = (a.h + a.l + a.c) / 3;
    if (!L(c)) continue;
    const u = Hn(a, c);
    u <= 0 || (o += u, i += c * u, r.push(a.x, i / o));
  }
  return new Float32Array(r);
}
function xi(e, t = {}) {
  const n = w(t.anchorBucket), r = w(t.anchorX), o = gt(e, t);
  if (o.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = o[o.length - 1], s = wt(e), a = s && L(i) ? (s.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: a,
    candle: s
  };
}
function Pi(e, t = {}, n = 20) {
  const r = k(n, 1, 200, 20), o = gt(e, t);
  if (o.length < 4) return [];
  const i = new Map(e.map((c, u) => [c.x, { candle: c, index: u }])), s = [];
  let a = null;
  for (let c = 0; c < o.length; c += 2) {
    const u = o[c], l = o[c + 1], f = i.get(u);
    if (!f || !L(l) || !L(f.candle.c)) continue;
    const d = z(e, f.index), h = f.candle.c > l ? "above" : f.candle.c < l ? "below" : null;
    h && (a === "above" && h === "below" ? s.push(Ee("loss", f.index, f.candle, l, d)) : a === "below" && h === "above" ? s.push(Ee("reclaim", f.index, f.candle, l, d)) : a === "below" && h === "below" && f.candle.h >= l && f.candle.c < l && s.push(
      Ee("failedReclaim", f.index, f.candle, l, d)
    ), a = h);
  }
  return s.slice(-r);
}
function vn(e, t = {}) {
  const n = k(t.lookback, 20, 2e3, 500), r = k(t.pivotStrength, 1, 20, 3), o = k(t.atrPeriod, 2, 100, 14), i = _(t.minMoveAtr, 0, 10, 0.75), s = k(t.maxSwings, 1, 500, 120), a = Math.max(0, e.length - n), c = e.slice(a);
  if (c.length < r * 2 + 1) return [];
  const u = Re(e, o), l = [];
  for (let d = r; d < c.length - r; d += 1) {
    const h = c[d], m = a + d, v = u[m] ?? null, y = z(e, m + r);
    Xn(c, d, r) && l.push(Xe("SwingHigh", m, h, h.h, v, y)), Kn(c, d, r) && l.push(Xe("SwingLow", m, h, h.l, v, y));
  }
  const f = [];
  for (const d of l) {
    const h = f[f.length - 1];
    if (!h) {
      f.push(d);
      continue;
    }
    if (h.kind === d.kind) {
      zn(d, h) && (f[f.length - 1] = d);
      continue;
    }
    Math.abs(d.price - h.price) >= Qn(d, h, i) && f.push(d);
  }
  return Vn(f).slice(-s);
}
function ue(e, t = {}) {
  const n = k(t.maxSwings, 1, 500, 120), r = k(t.maxBreaks, 1, 200, 24), o = vn(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], s = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  let c = 0, u = null, l = null, f = "neutral";
  for (let m = 0; m < e.length; m += 1) {
    const v = z(e, m);
    for (; c < o.length && o[c].index < m && o[c].knownAt <= v; ) {
      const p = o[c];
      p.kind === "SwingHigh" ? u = p : l = p, c += 1;
    }
    const y = e[m];
    if (u && !s.has(u.x) && y.c > u.price) {
      const p = f === "bearish" ? "StructureShift" : "StructureBreak";
      i.push(Ke(p, "bullish", m, y, u, v)), s.add(u.x), f = "bullish";
    }
    if (l && !a.has(l.x) && y.c < l.price) {
      const p = f === "bullish" ? "StructureShift" : "StructureBreak";
      i.push(Ke(p, "bearish", m, y, l, v)), a.add(l.x), f = "bearish";
    }
  }
  const d = o.slice(-n), h = i.slice(-r);
  return {
    swings: d,
    breaks: h,
    trend: f,
    summary: qe(d, h, f)
  };
}
function Ci(e) {
  var o;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Ze(t, "SwingHigh", "rangeHigh", null, !0),
      Ze(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((o = n.lastBreak) == null ? void 0 : o.direction) ?? e.trend : n.state;
  return r === "bullish" ? [
    ge(
      t,
      "SwingHigh",
      ["HigherHigh", "SwingHigh"],
      "continuation",
      "bullish"
    ),
    ge(
      t,
      "SwingLow",
      ["HigherLow", "SwingLow"],
      "shift",
      "bearish"
    )
  ].filter((i) => !!i) : r === "bearish" ? [
    ge(
      t,
      "SwingLow",
      ["LowerLow", "SwingLow"],
      "continuation",
      "bearish"
    ),
    ge(
      t,
      "SwingHigh",
      ["LowerHigh", "SwingHigh"],
      "shift",
      "bullish"
    )
  ].filter((i) => !!i) : [];
}
function Ii(e, t = {}) {
  var c, u;
  const n = k(t.lookback, 20, 1e3, 240), r = k(t.pivotStrength, 1, 20, 3), o = k(t.maxZones, 1, 12, 6), i = _(t.thicknessBps, 1, 100, 10), s = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, a = ue(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return yn(a.swings, {
    maxZones: o,
    thicknessBps: i,
    latestX: s,
    referencePrice: t.referencePrice ?? ((u = e[e.length - 1]) == null ? void 0 : u.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function yn(e, t = {}) {
  var u;
  const n = k(t.maxZones, 1, 12, 6), r = _(t.thicknessBps, 1, 100, 10), o = t.latestX ?? ((u = e[e.length - 1]) == null ? void 0 : u.x) ?? 0, i = w(t.referencePrice), s = t.zonesPerSide == null ? null : k(t.zonesPerSide, 1, 12, 3), a = [];
  for (const l of e)
    Gn(
      a,
      l.kind === "SwingHigh" ? "resistance" : "support",
      l,
      o - l.x + 1,
      r
    );
  const c = a.filter((l) => Number.isFinite(l.center) && l.high > l.low).sort((l, f) => f.score - l.score || f.touches - l.touches || f.lastX - l.lastX).slice(0, Math.max(n * 2, n));
  return Wn(c, n, i, s);
}
function bn(e, t) {
  const n = new Map(
    t.filter((s) => L(s.c)).map((s) => [s.bucket, s])
  );
  let r = null, o = null;
  const i = [];
  for (const s of e) {
    if (!L(s.c)) continue;
    const a = n.get(s.bucket);
    if (!a || !L(a.c)) continue;
    (r == null || o == null) && (r = s.c, o = a.c);
    const c = s.c / r / (a.c / o);
    i.push(s.x, (c - 1) * 100);
  }
  return new Float32Array(i);
}
function Ni(e, t, n = {}) {
  var x;
  const r = k(n.maxDivergences, 1, 100, 16), o = _(n.minDeltaPct, 0, 50, 0.5), i = k(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), s = n.includeDivergences ?? !0, a = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, u = bn(e, t), l = Zn(u);
  if (!e.length || l.size < 2) return [];
  const d = (((x = e[e.length - 1]) == null ? void 0 : x.x) ?? 0) - i, h = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, m = ue(e, {
    ...h
  }), v = qn(e, u), y = ue(v, {
    ...h
  }), p = new Map(e.map((S, b) => [S.x, { candle: S, index: b }])), E = [];
  let T = null, R = null;
  for (const S of m.swings) {
    const b = l.get(S.x);
    if (!(b == null || !Number.isFinite(b))) {
      if (S.kind === "SwingHigh") {
        if (T) {
          const g = l.get(T.x);
          g != null && Number.isFinite(g) && (S.price > T.price && b <= g - o ? s && E.push(
            be(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              S,
              T,
              b,
              g,
              m.summary.state,
              y.summary.state
            )
          ) : S.price < T.price && b >= g + o && a && E.push(
            be(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              S,
              T,
              b,
              g,
              m.summary.state,
              y.summary.state
            )
          ));
        }
        T = S;
        continue;
      }
      if (R) {
        const g = l.get(R.x);
        g != null && Number.isFinite(g) && (S.price > R.price && b <= g - o ? a && E.push(
          be(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            S,
            R,
            b,
            g,
            m.summary.state,
            y.summary.state
          )
        ) : S.price < R.price && b >= g + o && s && E.push(
          be(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            S,
            R,
            b,
            g,
            m.summary.state,
            y.summary.state
          )
        ));
      }
      R = S;
    }
  }
  if (c)
    for (const S of y.breaks) {
      if (S.x < d) continue;
      const b = p.get(S.x), g = l.get(S.x);
      if (!b || g == null || !Number.isFinite(g)) continue;
      const C = ue(e.slice(0, b.index + 1), {
        ...h,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      Un(S.direction, C.summary.state) && E.push(
        $n(
          S.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          S.direction,
          S.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          b.index,
          b.candle,
          g,
          S,
          C.summary.state,
          y.summary.state
        )
      );
    }
  return E.filter((S) => S.x >= d).sort((S, b) => S.x - b.x || Ye(S.signal) - Ye(b.signal)).slice(-r);
}
function _i(e) {
  return new Uint8Array(e.buffer);
}
function Be(e) {
  return {
    returnPct: w(e == null ? void 0 : e.returnPct),
    percentile: w(e == null ? void 0 : e.percentile),
    zScore: w(e == null ? void 0 : e.zScore),
    atrExtension: w(e == null ? void 0 : e.atrExtension)
  };
}
function He(e) {
  return {
    returnPct: w(e.returnPct),
    percentile: w(e.percentile),
    zScore: w(e.zScore),
    atrExtension: w(e.atrExtension)
  };
}
function me(e) {
  const t = Be(e);
  return t.returnPct != null && t.returnPct >= ce.returnPct || t.percentile != null && t.percentile >= ce.percentile || t.zScore != null && t.zScore >= ce.zScore || t.atrExtension != null && t.atrExtension >= ce.atrExtension;
}
function gn(e, t) {
  const n = [], r = k(t.minSamples, 1, 1e4, 20), o = e[e.length - 1] ?? null;
  return o ? o.rollingReturnCount < r && n.push(
    `Rolling-return history has ${o.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function ae(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function pn(e, t, n, r, o) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return o ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const s = t.filter((c) => c.contributesTo === e), a = s[s.length - 1];
  return (a == null ? void 0 : a.explanation) ?? ke(e);
}
function pt(e, t) {
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
function Sn(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function Q(e, t, n, r, o) {
  return [e, t, n, r, o ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function St(e, t, n, r) {
  let o = null;
  for (let i = 0; i < e.length; i += 1) {
    const s = e[i], a = $(s);
    a < t || z(e, i, r) > n || Number.isFinite(s.h) && (!o || s.h > o.price) && (o = { price: s.h, eventTime: a });
  }
  return o;
}
function wn(e, t) {
  return e.length ? z(e, e.length - 1, t) : null;
}
function Ve(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (z(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function $(e) {
  const t = w(e.ts);
  return t ?? w(e.bucket) ?? 0;
}
function z(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? j(r, n) : (w(r.bucket) ?? $(r)) + An(e, t) : 0;
}
function An(e, t) {
  var i, s, a;
  const n = w((i = e[t]) == null ? void 0 : i.bucket) ?? $(e[t]), r = w((s = e[t + 1]) == null ? void 0 : s.bucket);
  if (r != null && r > n) return r - n;
  const o = w((a = e[t - 1]) == null ? void 0 : a.bucket);
  return o != null && n > o ? n - o : 1;
}
function P(e) {
  return w(e.knownAt) ?? w(e.eventTime) ?? w(e.ts) ?? w(e.bucket) ?? 0;
}
function le(e, t, n) {
  const r = P(e), o = w(e.eventTime) ?? w(e.ts) ?? w(e.bucket) ?? r;
  return r > t.knownAt && r <= n && o >= t.knownAt;
}
function kn(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function Rn(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function L(e) {
  return Number.isFinite(e) && e > 0;
}
function Tn(e) {
  const t = w(e == null ? void 0 : e.returnPct), n = w(e == null ? void 0 : e.percentile), r = w(e == null ? void 0 : e.zScore), o = w(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${fe(t, 1)}%`,
    o == null ? null : `Ext ${fe(o, 1)} ATR`,
    r == null ? null : `Z ${fe(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((a) => !!a);
  return {
    key: "extension",
    label: "Extension",
    status: me({ returnPct: t, percentile: n, zScore: r, atrExtension: o }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function En(e, t, n) {
  const r = $e(e, t, n);
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
function xn(e) {
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
function Pn(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function Cn(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = w(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${fe(r, 1)}%`)
  };
}
function In(e, t, n, r) {
  var c;
  const o = w((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), i = o != null && n != null && _n(n, o) <= r, s = $e(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || s) ? "pass" : "pending",
    detail: i ? `Retesting ${q(o)}` : s ? `Near R ${q(s.center)}` : "No retest yet"
  };
}
function Nn(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const o = w((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return o != null && r > o * 1.01;
}
function We(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function $e(e, t, n) {
  return t == null || !L(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, o) => r.distance - o.distance || o.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function _n(e, t) {
  return !L(e) || !L(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
}
function ke(e) {
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
function On(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : ke(e);
}
function fe(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function q(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function w(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function W(e) {
  return e[e.length - 1];
}
function wt(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (L(n.c)) return n;
  }
  return null;
}
function Mn(e) {
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
function At(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let o = null;
  for (let i = r; i >= 0; i -= 1) {
    const s = e[i];
    if (s.bucket <= t && L(s.c)) {
      o = s;
      break;
    }
  }
  return o;
}
function Fn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const o = e[r];
    if (o.bucket < t.earliestBucket || o.bucket >= t.excludeBucket || !L(o.c)) continue;
    const i = At(e, o.bucket - t.windowSeconds, r);
    !i || !L(i.c) || n.push((o.c / i.c - 1) * 100);
  }
  return n;
}
function Ln(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, o = n.filter((i) => i === t).length;
  return (r + o * 0.5) / n.length * 100;
}
function Dn(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((s, a) => s + a, 0) / n.length, o = n.reduce((s, a) => s + (a - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(o);
  return i > 0 ? (t - r) / i : null;
}
function Ee(e, t, n, r, o) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: $(n),
    knownAt: o
  };
}
function Bn(e, t) {
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
function Hn(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function Xe(e, t, n, r, o, i) {
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
    eventTime: $(n),
    knownAt: i
  };
}
function Vn(e) {
  let t = null, n = null;
  return e.map((r) => {
    if (r.kind === "SwingHigh") {
      const a = t == null ? "SwingHigh" : r.price > t.price ? "HigherHigh" : "LowerHigh", u = { ...r, structure: a, label: a === "SwingHigh" ? "SH" : a === "HigherHigh" ? "HH" : "LH" };
      return t = u, u;
    }
    const o = n == null ? "SwingLow" : r.price > n.price ? "HigherLow" : "LowerLow", s = { ...r, structure: o, label: o === "SwingLow" ? "SL" : o === "HigherLow" ? "HL" : "LL" };
    return n = s, s;
  });
}
function Ke(e, t, n, r, o, i) {
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
    eventTime: $(r),
    knownAt: i
  };
}
function be(e, t, n, r, o, i, s, a, c, u) {
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
    rsStructureState: u,
    eventTime: o.eventTime,
    knownAt: Math.max(o.knownAt, i.knownAt)
  };
}
function $n(e, t, n, r, o, i, s, a, c) {
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
function qn(e, t) {
  const n = new Map(e.map((i) => [i.x, i])), r = [];
  let o = null;
  for (let i = 0; i < t.length; i += 2) {
    const s = t[i], a = t[i + 1], c = n.get(s);
    if (!c || !Number.isFinite(a)) continue;
    const u = o ?? a;
    r.push({
      ...c,
      o: u,
      h: a,
      l: a,
      c: a,
      v_base: 0,
      v_quote: 0
    }), o = a;
  }
  return r;
}
function Un(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Ye(e) {
  switch (e) {
    case "break":
      return 2;
    case "divergence":
      return 1;
    case "lead":
      return 0;
  }
}
function qe(e, t, n) {
  const r = t[t.length - 1] ?? null, o = Ne(e, "SwingHigh"), i = Ne(e, "SwingLow"), s = e[e.length - 1] ?? null, a = jn(t), c = e.length === 0 ? "neutral" : r == null || a ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, u = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
  return {
    state: c,
    trend: n,
    transitionDirection: u,
    lastBreak: r,
    lastSwingHigh: o,
    lastSwingLow: i,
    updatedX: (r == null ? void 0 : r.x) ?? (s == null ? void 0 : s.x) ?? null,
    updatedTs: (r == null ? void 0 : r.knownAt) ?? (s == null ? void 0 : s.knownAt) ?? null
  };
}
function ge(e, t, n, r, o) {
  for (let s = e.length - 1; s >= 0; s -= 1) {
    const a = e[s];
    if (a.kind === t && n.includes(a.structure))
      return Ie(r, o, a);
  }
  const i = Ne(e, t);
  return i ? Ie(r, o, i) : null;
}
function Ze(e, t, n, r, o) {
  let i = null;
  for (const s of e)
    s.kind === t && (!i || (o ? s.price > i.price : s.price < i.price)) && (i = s);
  return i ? Ie(n, r, i) : null;
}
function Ie(e, t, n) {
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
function jn(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Ne(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function zn(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Qn(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function Re(e, t) {
  const n = te(t), r = Array(e.length).fill(null);
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
function Gn(e, t, n, r, o) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const s = Math.max(i * (o / 1e4), Number.EPSILON), a = i - s, c = i + s, u = 1 / Math.max(1, r), l = e.find(
    (h) => h.kind === t && Yn(h.low, h.high, a, c)
  );
  if (!l) {
    e.push({
      kind: t,
      low: a,
      high: c,
      center: i,
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
  l.center = (l.center * l.touches + i) / f, l.touches = f, l.score += 1 + u, l.strength = l.score, l.lastX = Math.max(l.lastX, n.x), l.eventTime = Math.max(l.eventTime, n.eventTime), l.knownAt = Math.max(l.knownAt, n.knownAt), l.structures.push(n.structure);
  const d = Math.max(l.center * (o / 1e4), Number.EPSILON);
  l.low = Math.min(l.low, l.center - d, a), l.high = Math.max(l.high, l.center + d, c);
}
function Wn(e, t, n, r) {
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
function Xn(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].h >= r || e[t + o].h > r) return !1;
  return !0;
}
function Kn(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let o = 1; o <= n; o += 1)
    if (e[t - o].l <= r || e[t + o].l < r) return !1;
  return !0;
}
function Yn(e, t, n, r) {
  return e <= r && n <= t;
}
function Zn(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], o = e[n + 1];
    Number.isFinite(r) && Number.isFinite(o) && t.set(r, o);
  }
  return t;
}
function _e(e, t) {
  const n = te(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const o = 2 / (n + 1);
  let i = 0;
  for (let s = 0; s < n; s++) i += e[s].c;
  i /= n, r[n - 1] = i;
  for (let s = n; s < e.length; s++)
    i = (e[s].c - i) * o + i, r[s] = i;
  return r;
}
function Jn(e, t) {
  const n = te(t);
  if (e.length < n) return [];
  const r = [], o = 2 / (n + 1);
  let i = 0;
  for (let s = 0; s < n; s++) i += e[s].value;
  i /= n, r.push({ x: e[n - 1].x, value: i });
  for (let s = n; s < e.length; s++)
    i = (e[s].value - i) * o + i, r.push({ x: e[s].x, value: i });
  return r;
}
function kt(e, t) {
  const n = te(t);
  if (e.length <= n) return [];
  let r = 0, o = 0;
  for (let s = 1; s <= n; s++) {
    const a = e[s].c - e[s - 1].c;
    a >= 0 ? r += a : o += Math.abs(a);
  }
  r /= n, o /= n;
  const i = [
    { x: e[n].x, value: et(r, o) }
  ];
  for (let s = n + 1; s < e.length; s++) {
    const a = e[s].c - e[s - 1].c, c = Math.max(0, a), u = Math.max(0, -a);
    r = (r * (n - 1) + c) / n, o = (o * (n - 1) + u) / n, i.push({ x: e[s].x, value: et(r, o) });
  }
  return i;
}
function Je(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((o, i) => {
    r += o.value, i >= t && (r -= e[i - t].value), i >= t - 1 && n.push({ x: o.x, value: r / t });
  }), n;
}
function ee(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function et(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function te(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function k(e, t, n, r) {
  return Math.floor(_(e, t, n, r));
}
function _(e, t, n, r) {
  const o = Number(e);
  return Number.isFinite(o) ? Math.max(t, Math.min(n, o)) : r;
}
const er = "strategy-profile.1", Rt = "decision-snapshot.1", tr = "impulse_fade_v1.research.default", nr = "1";
function Tt(e) {
  const { profileHash: t, ...n } = e;
  return O(n);
}
function rr(e) {
  if (he(e.createdAt, "createdAt"), e.setupFamily !== G || e.lifecycleVersion !== U || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [o, i] of Object.entries(e.timeframeRoles))
    if (o === "contextTimeframes") {
      if (!i.every((s) => s.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${o} cannot be blank`);
  if (tt(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), tt(
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
  const r = I(e);
  return I({
    ...r,
    profileHash: Tt(r)
  });
}
function ir(e = {}) {
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
  return rr({
    schemaVersion: er,
    id: e.id ?? tr,
    version: e.version ?? nr,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: G,
    lifecycleVersion: U,
    lifecycleConfigHash: e.lifecycleConfigHash ?? oe(),
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
const or = ir();
function Oi(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (fr(e.price, "reference price"), he(e.eventTime, "reference eventTime"), he(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
    throw new RangeError("Reference knownAt cannot precede eventTime");
  return I({
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
function Mi(e) {
  var i, s, a, c;
  if (he(e.decisionTime, "decisionTime"), he(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
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
  ur([
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
  const n = ar(
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
    snapshotSchemaVersion: Rt,
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
    lifecycleEvidence: Pe(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: cr(e.structureByTimeframe, e.effectiveAsOf),
    activeStructureLevels: xe(e.activeStructureLevels, e.effectiveAsOf),
    supportResistanceZones: xe(
      e.supportResistanceZones,
      e.effectiveAsOf
    ),
    avwapState: ((a = e.avwapState) == null ? void 0 : a.knownAt) != null && e.avwapState.knownAt <= e.effectiveAsOf && e.avwapState.reference.knownAt <= e.effectiveAsOf ? e.avwapState : null,
    avwapEvents: Pe(e.avwapEvents, e.effectiveAsOf),
    relativeStrengthState: ((c = e.relativeStrengthState) == null ? void 0 : c.knownAt) != null && e.relativeStrengthState.knownAt <= e.effectiveAsOf ? e.relativeStrengthState : null,
    relativeStrengthEvents: Pe(
      e.relativeStrengthEvents,
      e.effectiveAsOf
    ),
    visibleOrSelectedReferenceLevels: xe(
      e.visibleOrSelectedReferenceLevels,
      e.effectiveAsOf
    ),
    dataQualityNotes: t
  }, o = Et(r);
  return I({ ...r, id: o });
}
function Et(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${O(n).slice(8)}`;
}
function sr(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const o = n.get(r.id);
    if (o && M(o) !== M(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function ar(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function cr(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      lr(r) <= t ? r : null
    ])
  );
}
function xe(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function Pe(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || O(n).localeCompare(O(r))
  );
}
function lr(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function ur(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && M(r) !== M(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function he(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function fr(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function tt(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const xt = "radar-selection-profile.1", dr = "radar-episode.1", mr = "replay-case-manifest.1", hr = "radar-metric-observation.1", vr = "radar-scan-result.1", yr = "radar-episode-status.1", br = "execution-venue-eligibility.1", gr = "radar-structure-observation.1", pr = "radar-universe-membership.1";
function Pt(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return O(n);
}
function Sr(e) {
  return jr(e), I({
    ...e,
    canonicalConfigHash: Pt(e)
  });
}
function wr(e) {
  if (!e.symbol.trim() || !e.marketDataSource.trim() || !e.executionVenue.trim() || !e.evidenceSource.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Execution-venue eligibility observation is invalid");
  const t = {
    schemaVersion: br,
    logicalObjectId: `execution-venue:${e.executionVenue.toLowerCase()}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return I({
    ...t,
    observationId: Nt(t)
  });
}
function Fi(e) {
  if (!e.logicalObjectId.trim() || !e.symbol.trim() || !e.source.trim() || !e.timeframe.trim() || !e.state.trim() || !Number.isFinite(e.eventTime) || !Number.isFinite(e.knownAt) || e.knownAt < e.eventTime)
    throw new RangeError("Radar structure observation is invalid");
  const t = {
    schemaVersion: gr,
    ...e
  };
  return I({
    ...t,
    observationId: It(t)
  });
}
function Li(e) {
  if (!e.symbol.trim() || !e.source.trim() || !Number.isFinite(e.effectiveFrom) || !Number.isFinite(e.knownAt) || e.effectiveTo != null && (!Number.isFinite(e.effectiveTo) || e.effectiveTo < e.effectiveFrom))
    throw new RangeError("Universe membership observation is invalid");
  const t = {
    schemaVersion: pr,
    logicalObjectId: `radar-universe:${e.source}:${e.symbol.toUpperCase()}`,
    ...e
  };
  return I({
    ...t,
    observationId: Ct(t)
  });
}
function Ct(e) {
  const { observationId: t, ...n } = e;
  return `radar-universe-observation:${B(n)}`;
}
function It(e) {
  const { observationId: t, ...n } = e;
  return `radar-structure-observation:${B(n)}`;
}
function Oe(e) {
  if (!e.logicalObjectId.trim() || !e.objectType.trim() || !Number.isFinite(e.knownAt) || e.eventTime != null && (!Number.isFinite(e.eventTime) || e.eventTime > e.knownAt))
    throw new RangeError("Durable object reference is invalid");
  const t = JSON.parse(M(e.snapshot));
  return I({
    logicalObjectId: e.logicalObjectId,
    observationId: `${e.objectType.toLowerCase()}-observation:${B({
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
  return `execution-venue-observation:${B(n)}`;
}
const Di = Sr({
  schemaVersion: xt,
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
function Bi(e) {
  var c;
  Qr(e);
  const t = e.strategyProfile ?? or, n = /* @__PURE__ */ new Map(), r = [], o = [], i = [], s = [], a = /* @__PURE__ */ new Set();
  for (const [u, l] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([f], [d]) => f.localeCompare(d)
  )) {
    const f = `${l.symbol.toUpperCase()}\0${l.source.toLowerCase()}`;
    if (a.has(f))
      throw new Error(`Duplicate radar series identity for ${l.symbol} from ${l.source}`);
    a.add(f);
    const h = Ft(l.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? []).map((v) => j(v, e.selectionProfile.scanTimeframe)).filter((v) => v <= e.to).filter((v) => Ur(v, e.selectionProfile)), m = {
      previousGate: !1,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const v of h) {
      const y = v >= e.from, p = e.selectionProfile.moveDetectors.map(
        (g) => Ar(g, l, v, e.selectionProfile.scanTimeframe)
      );
      if (y)
        for (const g of p)
          for (const C of g.observations)
            n.set(C.observationId, C);
      const E = $r(
        p.map((g) => g.result.passed),
        e.selectionProfile.detectorCombination
      ), T = Ir(
        l,
        v,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), R = Cr(
        l,
        v,
        e.selectionProfile,
        p,
        T,
        e.universeHistory ?? []
      ), x = R.every((g) => g.passed), S = E && x, b = _r(
        l,
        v,
        p.map((g) => g.result),
        R,
        E,
        x,
        S
      );
      if (y && r.push(b), m.activeEpisode && v >= m.activeEpisode.activeUntil && (y && i.push(
        Ce(m.activeEpisode, v, "expired", "maximumAgeElapsed", "blockedUntilReset")
      ), m.activeEpisode = null), S ? m.falseSince = null : (m.falseSince ?? (m.falseSince = v), !m.armed && v - m.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (y && m.blockedEpisode && i.push(
        Ce(m.blockedEpisode, v, "reset", "radarGateReset", "armed")
      ), m.activeEpisode = null, m.blockedEpisode = null, m.armed = !0)), S && !m.previousGate && m.armed) {
        const g = Er({
          series: l,
          asOf: v,
          profile: e.selectionProfile,
          detectorEvaluations: p,
          venueEligibility: T,
          lifecycleHistory: ((c = e.lifecycleHistory) == null ? void 0 : c[u]) ?? [],
          structureHistory: e.structureHistory ?? []
        });
        if (y) {
          o.push(g), i.push(
            Ce(g, v, "active", "detected", "blockedUntilReset")
          );
          const C = xr(g, l, e.selectionProfile, t);
          s.push(C);
          for (const K of g.contextObservations)
            n.set(K.observationId, K);
        }
        m.activeEpisode = g, m.blockedEpisode = g, m.armed = !1;
      }
      m.previousGate = S;
    }
  }
  return I({
    schemaVersion: vr,
    selectionProfileRef: Ht(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(Bt),
    gateEvaluations: r.sort(Wr),
    episodes: o.sort(Xr),
    episodeStatusObservations: i.sort(Kr),
    replayCaseManifests: s.sort((u, l) => u.id.localeCompare(l.id))
  });
}
function Ar(e, t, n, r) {
  return e.type === "rollingTroughRunup" ? kr(e, t, n, r) : e.type === "elapsedWindowReturn" ? Rr(e, t, n, r) : e.type === "maximumWindowReturn" ? Tr(e, t, n, r) : _t(e, t, n);
}
function kr(e, t, n, r) {
  const o = X(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, a = (i ? o.filter(
    (y) => y.bucket >= i.bucket - e.lookbackSeconds && y.bucket <= i.bucket && i.bucket - y.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((y, p) => F(p.c) && (!y || p.c < y.c || p.c === y.c && p.bucket < y.bucket) ? p : y, null), c = i && a && F(a.c) ? (i.c / a.c - 1) * 100 : null, u = Fr(o, i, e), l = Lt(u, c, e.minimumSampleCount), f = [];
  i || f.push(H("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a || f.push(H("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const d = O(e), h = se({
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
    percentile: l.percentile,
    zScore: l.zScore,
    sampleCount: u.length,
    historyCandles: je(o, i, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: d,
    notes: [...f, ...l.notes]
  }), m = c != null && c + 1e-12 >= e.minimumRunupPct && de(h.percentile, e.minimumPercentile) && de(h.zScore, e.minimumZScore) && h.sampleCount >= e.minimumSampleCount, v = a ? Nr(t, n, a, h) : null;
  return {
    result: Te(
      e,
      m,
      [h],
      m ? h.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${we(c)} versus ${we(e.minimumRunupPct)} minimum`
    ),
    observations: [h],
    anchor: v
  };
}
function Rr(e, t, n, r) {
  const o = Ot(e, t, n, r), i = Dt(o, e);
  return {
    result: Te(
      e,
      i,
      [o],
      i ? o.observationId : null,
      o.value == null ? "Elapsed return unavailable" : `${Vt(e.windowSeconds)} return ${we(o.value)}`
    ),
    observations: [o],
    anchor: null
  };
}
function Tr(e, t, n, r) {
  const o = [...new Set(e.windowsSeconds)].sort((l, f) => l - f).map(
    (l) => Ot(
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
  ), i = o.filter((l) => l.value != null).sort(
    (l, f) => (f.value ?? -1 / 0) - (l.value ?? -1 / 0) || (l.window ?? 1 / 0) - (f.window ?? 1 / 0)
  )[0] ?? null, s = X(t.candlesByTimeframe[r] ?? [], r, n), a = se({
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
    historyCandles: je(
      s,
      s.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: O(e),
    notes: i ? i.dataQualityNotes : [H("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Dt(a, e), u = [...o, a];
  return {
    result: Te(
      e,
      c,
      u,
      c ? (i == null ? void 0 : i.observationId) ?? null : null,
      (i == null ? void 0 : i.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Vt(i.window ?? 0)} return ${we(i.value)}`
    ),
    observations: u,
    anchor: null
  };
}
function _t(e, t, n) {
  const r = e.analysisTimeframe, o = X(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = Lr(o, e.emaPeriod).at(-1) ?? null, a = Dr(o, e.atrPeriod).at(-1) ?? null, c = i && s != null && a != null && a > 0 ? (i.c - s) / a : null, u = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), l = [];
  i || l.push(H("NO_COMPLETED_CANDLE", "error", `No completed ${r} candle exists at cutoff`)), (o.length < u || c == null) && l.push(
    H(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${u} completed ${r} candles`
    )
  );
  const f = se({
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
    historyCandles: o.slice(-u),
    configHash: O(e),
    notes: ze(l)
  }), d = c != null && o.length >= u && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: Te(
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
function Ot(e, t, n, r) {
  const o = X(t.candlesByTimeframe[r] ?? [], r, n), i = o.at(-1) ?? null, s = i ? Ue(o, i.bucket - e.windowSeconds) : null, a = i && s ? i.bucket - e.windowSeconds - s.bucket : null, c = a != null && e.maximumReferenceStalenessSeconds != null && a > e.maximumReferenceStalenessSeconds, u = i && s && !c && F(s.c) ? (i.c / s.c - 1) * 100 : null, l = Mr(o, i, e), f = Lt(l, u, e.minimumSampleCount), d = [...f.notes];
  return i || d.push(H("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), s ? c && d.push(H("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : d.push(H("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), se({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (s == null ? void 0 : s.bucket) ?? null,
    referenceValue: (s == null ? void 0 : s.c) ?? null,
    value: u,
    unit: "percent",
    percentile: f.percentile,
    zScore: f.zScore,
    sampleCount: l.length,
    historyCandles: je(
      o,
      i,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: O(e),
    notes: ze(d)
  });
}
function Er(e) {
  var b;
  const t = e.detectorEvaluations.filter((g) => g.result.passed), n = it(
    t.flatMap(
      (g) => g.observations.filter(
        (C) => g.result.observationIds.includes(C.observationId)
      )
    )
  ), r = ((b = t.find((g) => g.anchor)) == null ? void 0 : b.anchor) ?? null, o = X(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), i = nt(e.series, e.asOf, e.profile.scanTimeframe, 86400), s = nt(e.series, e.asOf, e.profile.scanTimeframe, 172800), a = Mt(e.series, e.asOf, e.profile), u = e.detectorEvaluations.flatMap((g) => g.observations).find((g) => g.metricCode === "ema_atr_displacement") ?? null ?? _t(
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
  ).observations[0], l = Or(
    e.structureHistory,
    e.series,
    e.asOf
  ), f = it([
    ...n,
    i,
    s,
    a,
    u
  ]), d = t[0], h = d ? n.find(
    (g) => g.observationId === d.result.winningObservationId
  ) ?? n[0] ?? null : null, m = Pr(
    o,
    r,
    (d == null ? void 0 : d.result.detectorId) ?? "unknown",
    h,
    i,
    s,
    a,
    u,
    l
  ), v = Br(e.lifecycleHistory, e.asOf), y = (v == null ? void 0 : v.candidate) ?? null, p = (v == null ? void 0 : v.asOf) ?? null, E = v && p != null ? Oe({
    logicalObjectId: (y == null ? void 0 : y.id) ?? `impulse-fade-lifecycle:${e.series.source}:${e.series.symbol}`,
    objectType: "SetupStateSnapshot",
    eventTime: v.updatedTs,
    knownAt: p,
    snapshot: v
  }) : null, T = y ? Oe({
    logicalObjectId: y.id,
    objectType: "SetupCandidateEpisode",
    eventTime: y.detectionEventTime,
    knownAt: p ?? y.detectedAt,
    snapshot: y
  }) : null, R = {
    schemaVersion: dr,
    symbol: e.series.symbol,
    source: e.series.source,
    setupFamily: e.profile.setupFamily,
    selectionProfileId: e.profile.id,
    selectionProfileVersion: e.profile.version,
    selectionProfileHash: e.profile.canonicalConfigHash,
    detectedAt: e.asOf,
    effectiveAsOf: e.asOf,
    scanTimeframe: e.profile.scanTimeframe,
    triggeringDetectorIds: t.map((g) => g.result.detectorId),
    triggeringObservations: n,
    contextObservations: f,
    selectionAnchor: r,
    pathContext: m,
    initialLifecycleCandidateId: (y == null ? void 0 : y.id) ?? null,
    initialLifecycleCandidateRef: T,
    initialLifecycleState: (v == null ? void 0 : v.state) ?? null,
    initialLifecycleStateRef: E,
    initialMtfStructure: l,
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: ze([
      ...f.flatMap((g) => g.dataQualityNotes),
      ...e.venueEligibility.dataQualityNotes
    ])
  }, x = `radar-episode:${B({
    symbol: R.symbol,
    source: R.source,
    profileHash: R.selectionProfileHash,
    detectedAt: R.detectedAt,
    triggeringObservationIds: n.map((g) => g.observationId)
  })}`, S = { ...R, id: x, logicalObjectId: x };
  return I({
    ...S,
    observationId: `radar-episode-observation:${B(S)}`
  });
}
function xr(e, t, n, r) {
  const o = Object.keys(t.candlesByTimeframe).sort(Qe), i = Object.fromEntries(
    o.map((a) => {
      var u, l;
      const c = X(t.candlesByTimeframe[a] ?? [], a, e.detectedAt);
      return [
        a,
        {
          availableStart: ((u = c[0]) == null ? void 0 : u.bucket) ?? null,
          availableEnd: ((l = c.at(-1)) == null ? void 0 : l.bucket) ?? null,
          completedThrough: c.at(-1) ? j(c.at(-1), a) : null,
          completedCandleCount: c.length
        }
      ];
    })
  ), s = {
    schemaVersion: mr,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Ht(n),
    lifecycleVersion: U,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: o,
    preRollRequirements: Vr(n),
    dataCoverageByTimeframe: i,
    initialRadarObservations: e.contextObservations,
    initialLifecycleState: e.initialLifecycleState,
    initialLifecycleStateRef: e.initialLifecycleStateRef,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return I({
    ...s,
    id: `replay-case:${B(s)}`
  });
}
function nt(e, t, n, r) {
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
  }, i = X(e.candlesByTimeframe[n] ?? [], n, t), s = i.at(-1) ?? null, a = s ? Ue(i, s.bucket - r) : null, c = s && a && F(a.c) ? (s.c / a.c - 1) * 100 : null, u = c == null ? [H("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return se({
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
    configHash: O(o),
    notes: u
  });
}
function Mt(e, t, n) {
  var f;
  const r = n.scanTimeframe, o = X(e.candlesByTimeframe[r] ?? [], r, t), i = o.at(-1) ?? null, s = i ? o.filter((d) => d.bucket > i.bucket - n.liquidityPolicy.windowSeconds) : [], a = s.map(
    (d) => ne(d.v_quote) ? d.v_quote : ne(d.v_base) ? d.v_base * d.c : null
  ), c = a.length > 0 && a.every((d) => d != null), u = c ? a.reduce((d, h) => d + (h ?? 0), 0) : null, l = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return se({
    series: e,
    asOf: t,
    timeframe: r,
    metricCode: "quote_notional",
    metricVersion: "quote-notional.1",
    window: n.liquidityPolicy.windowSeconds,
    referenceTime: ((f = s[0]) == null ? void 0 : f.bucket) ?? null,
    referenceValue: null,
    value: u,
    unit: "quoteNotional",
    percentile: null,
    zScore: null,
    sampleCount: s.length,
    historyCandles: s,
    configHash: O(l),
    notes: c ? [] : [H("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function se(e) {
  var s, a;
  const t = ((s = e.historyCandles[0]) == null ? void 0 : s.bucket) ?? null, n = ((a = e.historyCandles.at(-1)) == null ? void 0 : a.bucket) ?? null, r = O(
    e.historyCandles.map((c) => ({
      bucket: c.bucket,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      vBase: ne(c.v_base) ? c.v_base : null,
      vQuote: ne(c.v_quote) ? c.v_quote : null
    }))
  ), o = `radar-metric:${B({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.window,
    configHash: e.configHash
  })}`, i = {
    schemaVersion: hr,
    logicalObjectId: o,
    metricCode: e.metricCode,
    metricVersion: e.metricVersion,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
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
  return I({
    ...i,
    observationId: `radar-observation:${B(i)}`
  });
}
function Pr(e, t, n, r, o, i, s, a, c) {
  const u = t ? e.find((y) => y.bucket === t.timestamp) ?? null : null, f = (u ? e.filter((y) => y.bucket <= u.bucket) : []).reduce((y, p) => F(p.c) && (!y || p.c > y.c || p.c === y.c && p.bucket < y.bucket) ? p : y, null), d = e.at(-1) ?? null, h = t && f && F(f.c) ? (t.price / f.c - 1) * 100 : null, m = t && f && d && f.c > t.price ? (d.c - t.price) / (f.c - t.price) : null, v = t && h != null && h < -5 ? ["rebound_after_drawdown"] : ["unknown"];
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
    priorDrawdownPct: h,
    recoveryFraction: m,
    currentAtrDisplacement: a.value,
    triggeringPercentile: (r == null ? void 0 : r.percentile) ?? null,
    triggeringZScore: (r == null ? void 0 : r.zScore) ?? null,
    quoteNotional: s.value,
    mtfStructureStates: Object.fromEntries(
      Object.entries(c).map(([y, p]) => [
        y,
        typeof p.snapshot == "object" && p.snapshot != null && !Array.isArray(p.snapshot) && typeof p.snapshot.state == "string" ? p.snapshot.state : "unknown"
      ])
    ),
    contextTags: v
  };
}
function Cr(e, t, n, r, o, i) {
  return n.hardGates.map((s) => {
    if (s === "sourcePolicy") {
      const l = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
      return { code: s, passed: l, explanation: l ? "Source allowed" : "Source excluded" };
    }
    if (s === "dataQuality") {
      const l = !r.some(
        (f) => f.observations.some(
          (d) => d.dataQualityNotes.some((h) => h.severity === "error")
        )
      );
      return { code: s, passed: l, explanation: l ? "Required metrics available" : "Required metric data unavailable" };
    }
    if (s === "executionVenueEligibility") {
      const l = qr(o.status, n.executionVenuePolicy.mode);
      return { code: s, passed: l, explanation: `Execution venue ${o.status}` };
    }
    if (s === "selectedUniverse") {
      const l = Hr(i, e, t);
      return {
        code: s,
        passed: (l == null ? void 0 : l.included) === !0,
        explanation: l ? l.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown"
      };
    }
    const a = Mt(e, t, n), c = n.liquidityPolicy.minimumQuoteNotional, u = c == null || a.value == null ? c == null || n.liquidityPolicy.missingData === "warn" : a.value >= c;
    return {
      code: s,
      passed: u,
      explanation: c == null ? "No minimum liquidity configured" : a.value == null ? "Quote-notional history unavailable" : `Quote notional ${a.value} versus ${c} minimum`
    };
  });
}
function Ir(e, t, n, r) {
  const o = n.executionVenuePolicy.intendedVenue ?? "ignored", i = [...r].filter(
    (s) => s.symbol.toUpperCase() === e.symbol.toUpperCase() && s.marketDataSource === e.source && s.executionVenue.toLowerCase() === o.toLowerCase() && s.knownAt <= t && s.effectiveFrom <= t && (s.effectiveTo == null || s.effectiveTo >= t)
  ).sort((s, a) => s.effectiveFrom - a.effectiveFrom || s.knownAt - a.knownAt).at(-1);
  if (i) {
    if (Nt(i) !== i.observationId)
      throw new Error("Execution-venue eligibility observation failed deterministic verification");
    return i;
  }
  return wr({
    symbol: e.symbol,
    marketDataSource: e.source,
    executionVenue: o,
    status: "Unknown",
    effectiveFrom: t,
    effectiveTo: null,
    knownAt: t,
    evidenceSource: "missingHistoricalObservation",
    dataQualityNotes: [
      H(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  });
}
function Nr(e, t, n, r) {
  const o = {
    logicalObjectId: `selection-anchor:${B({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - j(n, r.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: r.observationId
  };
  return I({
    ...o,
    observationId: `selection-anchor-observation:${B(o)}`
  });
}
function Ce(e, t, n, r, o) {
  const i = {
    schemaVersion: yr,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: r,
    rearmState: o
  };
  return I({
    ...i,
    observationId: `radar-status:${B(i)}`
  });
}
function _r(e, t, n, r, o, i, s) {
  const a = {
    symbol: e.symbol,
    source: e.source,
    asOf: t,
    detectorResults: n,
    hardGateResults: r,
    detectorGatePassed: o,
    hardGatesPassed: i,
    compositePassed: s
  };
  return I({
    ...a,
    id: `radar-gate:${B(a)}`
  });
}
function Te(e, t, n, r, o) {
  return {
    detectorId: e.id,
    detectorType: e.type,
    passed: t,
    observationIds: n.map((i) => i.observationId),
    winningObservationId: r,
    explanation: o
  };
}
function X(e, t, n) {
  return Ft(e).filter((r) => j(r, t) <= n);
}
function Ft(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of [...e].sort((r, o) => r.bucket - o.bucket || r.ts - o.ts)) {
    if (!Gr(n)) continue;
    const r = t.get(n.bucket);
    if (r && rt(r) !== rt(n))
      throw new Error(
        `Conflicting candle revisions for bucket ${n.bucket}; supply cutoff-resolved history`
      );
    t.set(n.bucket, n);
  }
  return [...t.values()].sort((n, r) => n.bucket - r.bucket);
}
function Or(e, t, n) {
  const r = /* @__PURE__ */ new Map();
  for (const o of e.filter(
    (i) => i.symbol.toUpperCase() === t.symbol.toUpperCase() && i.source === t.source && i.knownAt <= n
  ).sort((i, s) => i.knownAt - s.knownAt || i.observationId.localeCompare(s.observationId))) {
    if (It(o) !== o.observationId)
      throw new Error("Radar structure observation failed deterministic verification");
    r.set(o.timeframe, o);
  }
  return Object.fromEntries(
    [...r.entries()].sort(([o], [i]) => Qe(o, i)).map(
      ([o, i]) => [
        o,
        Oe({
          logicalObjectId: i.logicalObjectId,
          objectType: "MarketStructure",
          eventTime: i.eventTime,
          knownAt: i.knownAt,
          snapshot: { state: i.state, detail: i.snapshot }
        })
      ]
    )
  );
}
function rt(e) {
  return M({
    bucket: e.bucket,
    ts: e.ts,
    o: e.o,
    h: e.h,
    l: e.l,
    c: e.c,
    vBase: ne(e.v_base) ? e.v_base : null,
    vQuote: ne(e.v_quote) ? e.v_quote : null,
    ver: ne(e.ver) ? e.ver : null
  });
}
function Ue(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function Mr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = Ue(e, i.bucket - n.windowSeconds);
    if (!s || !F(s.c)) continue;
    const a = i.bucket - n.windowSeconds - s.bucket;
    n.maximumReferenceStalenessSeconds != null && a > n.maximumReferenceStalenessSeconds || o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function Fr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, o = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const s = e.filter(
      (a) => a.bucket <= i.bucket && a.bucket >= i.bucket - n.lookbackSeconds && i.bucket - a.bucket <= n.maximumTroughAgeSeconds && F(a.c)
    ).sort((a, c) => a.c - c.c || a.bucket - c.bucket)[0];
    s && o.push((i.c / s.c - 1) * 100);
  }
  return o;
}
function Lt(e, t, n) {
  const r = [];
  if (e.length < n && r.push(
    H(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: r };
  const o = e.filter((u) => u <= t).length / e.length * 100, i = e.reduce((u, l) => u + l, 0) / e.length, s = e.reduce((u, l) => u + (l - i) ** 2, 0) / e.length, a = Math.sqrt(s), c = a > 0 ? (t - i) / a : null;
  return { percentile: o, zScore: c, notes: r };
}
function je(e, t, n) {
  return t ? e.filter((r) => r.bucket >= t.bucket - n) : [];
}
function Dt(e, t) {
  return e.value != null && de(e.value, t.minimumReturnPct) && de(e.percentile, t.minimumPercentile) && de(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function Lr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let r = e.slice(0, t).reduce((i, s) => i + s.c, 0) / t;
  n[t - 1] = r;
  const o = 2 / (t + 1);
  for (let i = t; i < e.length; i += 1)
    r = e[i].c * o + r * (1 - o), n[i] = r;
  return n;
}
function Dr(e, t) {
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
function Br(e, t) {
  return [...e].filter((n) => n.asOf != null && n.asOf <= t).sort((n, r) => (n.asOf ?? 0) - (r.asOf ?? 0)).at(-1) ?? null;
}
function Hr(e, t, n) {
  const r = [...e].filter(
    (o) => o.symbol.toUpperCase() === t.symbol.toUpperCase() && o.source === t.source && o.knownAt <= n && o.effectiveFrom <= n && (o.effectiveTo == null || o.effectiveTo >= n)
  ).sort((o, i) => o.effectiveFrom - i.effectiveFrom || o.knownAt - i.knownAt).at(-1) ?? null;
  if (r && Ct(r) !== r.observationId)
    throw new Error("Universe membership observation failed deterministic verification");
  return r;
}
function Vr(e) {
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
  return [...t.entries()].sort(([r], [o]) => Qe(r, o)).map(([r, o]) => ({
    timeframe: r,
    minimumDurationSeconds: o.duration,
    minimumBars: o.bars,
    purposes: [...o.purposes].sort()
  }));
}
function $r(e, t) {
  return t.mode === "all" ? e.every(Boolean) : t.mode === "atLeast" ? e.filter(Boolean).length >= t.count : e.some(Boolean);
}
function qr(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Ur(e, t) {
  const n = re(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function D(e) {
  throw new RangeError(e);
}
function jr(e) {
  e.schemaVersion !== xt && D("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && D("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && D("Only impulse_fade_v1 radar profiles are supported"), F(re(e.scanTimeframe)) || D("scanTimeframe must be valid"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && D("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || D("At least one move detector is required"), new Set(e.moveDetectors.map((t) => t.id)).size !== e.moveDetectors.length && D("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && D("Hard gates must be unique"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && D("atLeast detector count must be between one and the detector count"), (!F(e.episodeExpiry.maximumAgeSeconds) || !F(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && D("Episode expiry, reset duration, and createdAt must be valid");
  for (const t of e.moveDetectors) zr(t);
}
function zr(e) {
  e.id.trim() || D("Detector ID is required"), Object.entries(e).filter(([n, r]) => n !== "minimumReturnPct" && n !== "minimumPercentile" && n !== "minimumZScore" && typeof r == "number").map(([, n]) => n).some((n) => !Number.isFinite(n) || n < 0) && D(`Detector ${e.id} contains invalid numeric settings`), e.type === "maximumWindowReturn" && !e.windowsSeconds.length && D(`Detector ${e.id} requires at least one window`);
}
function Qr(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Pt(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
}
function de(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function Gr(e) {
  return Number.isFinite(e.bucket) && F(e.o) && F(e.h) && F(e.l) && F(e.c);
}
function F(e) {
  return Number.isFinite(e) && e > 0;
}
function ne(e) {
  return e != null && Number.isFinite(e);
}
function H(e, t, n) {
  return { code: e, severity: t, message: n };
}
function ze(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function it(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(Bt);
}
function Bt(e, t) {
  return e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function Wr(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function Xr(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function Kr(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function Qe(e, t) {
  return re(e) - re(t) || e.localeCompare(t);
}
function Ht(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function we(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Vt(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function B(e) {
  return O(e).slice(8);
}
function Hi(e) {
  return M(e);
}
const Yr = "linear-quote-perpetual-risk.1", Zr = "sizing-result.1", Jr = "trade-plan.1", ei = "decision-record.1";
function $t(e) {
  const t = [], n = [
    J(
      "EXACT_LIQUIDATION_MODEL_UNAVAILABLE",
      "Exact liquidation is unavailable without a verified venue calculator"
    )
  ];
  e.side !== "short" && t.push(J("UNSUPPORTED_SIDE", "Only short Impulse Fade plans are supported")), [
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
  ].some((N) => !Number.isFinite(N) || N <= 0) && t.push(J("INVALID_NUMERIC_INPUT", "Sizing inputs must be positive finite numbers")), e.stopPrice <= e.intendedEntryPrice && t.push(J("STOP_NOT_ABOVE_ENTRY", "A short stop must be above entry")), (e.accountState.availableBalance != null && e.accountState.availableBalance < 0 || e.riskRequest.maximumNotional != null && e.riskRequest.maximumNotional <= 0 || e.venueRules.feeSchedule.makerRate < 0 || e.venueRules.feeSchedule.takerRate < 0) && A(
    t,
    "INVALID_NUMERIC_INPUT",
    "Balances, notional limits, and venue fee rates must be valid non-negative values"
  ), (!pe(e.intendedEntryPrice, e.venueRules.priceTick) || !pe(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (N) => !pe(N.targetPrice, e.venueRules.priceTick)
  )) && A(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !pe(e.leveragePolicy.leverage, e.venueRules.leverageStep) && A(
    t,
    "LEVERAGE_STEP_MISMATCH",
    `Manual leverage must align to venue step ${e.venueRules.leverageStep}`
  ), (e.executionAssumptions.entryFeeRate < e.venueRules.feeSchedule.makerRate || e.executionAssumptions.stopExitFeeRate < e.venueRules.feeSchedule.takerRate || e.executionAssumptions.targetExitFeeRate < e.venueRules.feeSchedule.makerRate) && n.push(
    J(
      "FEE_ASSUMPTION_BELOW_VENUE_SCHEDULE",
      "One or more fee assumptions are below the supplied venue schedule"
    )
  );
  const o = e.riskRequest.accountRiskFraction != null, i = e.riskRequest.fixedRiskAmount != null;
  o === i && t.push(
    J(
      "RISK_REQUEST_INVALID",
      "Specify exactly one of accountRiskFraction or fixedRiskAmount"
    )
  ), (o && (!V(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!V(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && A(
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
  (s == null || !Number.isFinite(s) || s <= 0) && A(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), ni(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const a = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = V(a) ? a : null, u = V(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, l = c != null && u != null ? u - c + c * e.executionAssumptions.entryFeeRate + u * e.executionAssumptions.stopExitFeeRate : null;
  (l == null || !Number.isFinite(l) || l <= 0) && A(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const f = s != null && l != null && l > 0 ? s / l : null;
  let d = f == null ? null : ot(f, e.venueRules.quantityStep);
  if (d != null && s != null && l != null)
    for (; d > 0 && d * l > s + Math.max(1e-10, s * 1e-12); )
      d = ot(
        d - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const h = d != null && d > 0 ? d : null, m = h == null ? null : h * e.intendedEntryPrice, v = h == null || c == null ? null : h * c * e.executionAssumptions.entryFeeRate, y = h == null || u == null ? null : h * u * e.executionAssumptions.stopExitFeeRate, p = h == null || l == null ? null : h * l;
  (h == null || h < e.venueRules.minQuantity) && A(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (m == null || m < e.venueRules.minNotional) && A(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const E = e.riskRequest.maximumNotional;
  E != null && m != null && m > E && A(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${E}`
  );
  const T = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, R = e.accountState.availableBalance == null ? T : Math.min(T, e.accountState.availableBalance), x = m != null && R > 0 ? m / R : null, S = ci(
    e.leveragePolicy,
    x,
    e.venueRules.leverageStep
  );
  S != null && S > e.venueRules.maxLeverage && A(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${S} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const b = m != null && S != null && S > 0 ? m / S : null;
  b != null && b > T + 1e-10 && A(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), b != null && e.accountState.availableBalance != null && b > e.accountState.availableBalance + 1e-10 && A(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const g = h != null && c != null && u != null ? h * (u - c) : null, C = ri(
    e.targets,
    h,
    c,
    g,
    p,
    e.executionAssumptions
  ), K = Se(
    C.map((N) => N.grossReward * N.positionFraction)
  ), ve = Se(
    C.map((N) => N.netProjectedReward * N.positionFraction)
  ), ye = Se(
    C.map(
      (N) => N.weightedGrossRContribution == null ? null : N.weightedGrossRContribution
    )
  ), Y = Se(
    C.map(
      (N) => N.weightedRContribution == null ? null : N.weightedRContribution
    )
  );
  return I({
    schemaVersion: Zr,
    sizingModelVersion: Yr,
    side: e.side,
    riskBudget: s,
    rawQuantity: f,
    roundedQuantity: h,
    effectiveEntry: c,
    effectiveStop: u,
    stopDistanceAbsolute: c == null || u == null ? null : u - c,
    stopDistancePercent: c == null || u == null ? null : (u - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: m,
    estimatedEntryFee: v,
    estimatedStopFee: y,
    projectedLossAtStop: p,
    projectedLossPercentEquity: p == null || e.accountState.equity <= 0 ? null : p / e.accountState.equity * 100,
    selectedLeverage: S,
    minimumRequiredLeverage: x,
    initialMargin: b,
    marginPercentEquity: b == null || e.accountState.equity <= 0 ? null : b / e.accountState.equity * 100,
    marginPercentAvailableBalance: b == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : b / e.accountState.availableBalance * 100,
    targetOutcomes: C,
    weightedGrossReward: K,
    weightedProjectedReward: ve,
    weightedGrossR: ye,
    weightedProjectedR: Y,
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
function Vi(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = $t({
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
    schemaVersion: Jr,
    snapshotId: e.snapshot.id,
    setupFamily: G,
    lifecycleVersion: U,
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
  }, r = { ...n, id: e.id ?? qt(n) }, o = ti({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return I({ ...r, complianceResult: o });
}
function ti(e) {
  var d, h, m;
  const { strategyProfile: t, snapshot: n, plan: r } = e, o = [...r.sizingResult.hardErrors], i = [], s = [...r.sizingResult.warnings], a = $t({
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
  (Tt(t) !== t.profileHash || Et(n) !== n.id || qt(r) !== r.id || M(a) !== M(r.sizingResult)) && A(
    o,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (d = n.candidateEpisode) != null && d.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && A(
    o,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== Rt || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || M(r.executionAssumptions) !== M(t.executionAssumptions)) && A(
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
  for (const v of r.targetPlans)
    t.targetPolicy.permittedDerivations.includes(v.derivationType) || A(
      i,
      "TARGET_DERIVATION_NOT_PERMITTED",
      `Target derivation ${v.derivationType} is not permitted`
    );
  r.targetPlans.length > t.targetPolicy.maximumTargets && A(
    i,
    "TOO_MANY_TARGETS",
    `Plan has more than ${t.targetPolicy.maximumTargets} targets`
  );
  const c = r.targetPlans.reduce(
    (v, y) => v + y.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && A(
    o,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), si(n, r, o), ai(r, o), ii(n, t, i), oi(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((h = n.candidateEpisode) == null ? void 0 : h.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && A(
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
  const u = i.some((v) => v.code === "NO_ACTIVE_CANDIDATE"), l = ((m = r.discretionaryOverrideReason) == null ? void 0 : m.trim()) || null;
  r.status === "finalized" && i.length > 0 && !u && !l && A(
    o,
    "OVERRIDE_REASON_REQUIRED",
    "A finalized discretionary override requires a user-supplied reason"
  );
  let f;
  return o.length > 0 ? f = "InvalidPlan" : u ? f = "OutOfStrategy" : i.length === 0 ? f = "Compliant" : l ? f = "Overridden" : f = "OutOfStrategy", I({
    classification: f,
    hardErrors: o,
    strategyViolations: i,
    warnings: s,
    overrideReason: l
  });
}
function $i(e) {
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
    schemaVersion: ei,
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
  }, n = e.id ?? `decision:${O(t).slice(8)}`;
  return I({ ...t, id: n });
}
function ni(e, t, n, r) {
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
function ri(e, t, n, r, o, i) {
  return t == null || n == null ? [] : e.map((s) => {
    const a = s.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), c = t * (n - a), u = t * n * i.entryFeeRate, l = t * a * i.targetExitFeeRate, f = c - u - l, d = r != null && r > 0 ? c / r : null, h = o != null && o > 0 ? f / o : null;
    return {
      targetId: s.id,
      targetPrice: s.targetPrice,
      effectiveTargetPrice: a,
      positionFraction: s.positionFraction,
      grossReward: c,
      expectedEntryFee: u,
      expectedExitFee: l,
      netProjectedReward: f,
      grossR: d,
      projectedR: h,
      weightedGrossRContribution: d == null ? null : d * s.positionFraction,
      weightedRContribution: h == null ? null : h * s.positionFraction
    };
  });
}
function ii(e, t, n) {
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
function oi(e, t, n) {
  var c;
  const r = t.entryPolicy.requiredDataQuality, o = r.candidateMetricsRequired && e.candidateMetrics == null, i = ((c = e.candidateMetrics) == null ? void 0 : c.historyCoverage.coverageRatio) ?? null, s = r.minimumHistoryCoverageRatio != null && (i == null || i < r.minimumHistoryCoverageRatio), a = e.dataQualityNotes.some(
    (u) => r.rejectedNoteSeverities.includes(u.severity)
  );
  (o || s || a) && A(
    n,
    "DATA_QUALITY_INSUFFICIENT",
    "Decision snapshot does not meet the profile data-quality requirements"
  );
}
function si(e, t, n) {
  const r = new Map(
    sr(e).map((i) => [i.id, i])
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
    s ? M(s) !== M(i.reference) && A(
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
function ai(e, t) {
  const n = e.venueRules.priceTick, r = e.entryPlan.associatedReferenceLevel;
  r && Math.abs(e.entryPlan.intendedPrice - r.price) > n + 1e-12 && A(
    t,
    "REFERENCE_PRICE_MISMATCH",
    "Entry price does not match its frozen reference level"
  );
  const o = e.stopPlan.referenceLevel;
  if (o && e.stopPlan.derivationType !== "manual") {
    const i = e.stopPlan.derivationType === "supportResistanceZoneBoundary" ? o.rangeHigh ?? o.price : o.price, { basisPoints: s, atrFraction: a, atrValue: c } = e.stopPlan.buffer;
    let u = i;
    s != null && a != null ? A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "Stop buffer must use basis points or ATR, not both"
    ) : s != null ? u = i * (1 + s / 1e4) : a != null && (V(c ?? 0) ? u = i + a * (c ?? 0) : A(
      t,
      "REFERENCE_PRICE_MISMATCH",
      "ATR stop buffers require the frozen ATR value"
    )), Math.abs(e.stopPlan.stopPrice - u) > n + 1e-12 && A(
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
function ci(e, t, n) {
  return e.mode === "manual" ? V(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, li(t, n));
}
function qt(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${O(r).slice(8)}`;
}
function ot(e, t) {
  if (!V(e) || !V(t)) return 0;
  const n = Ut(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function li(e, t) {
  if (!V(e) || !V(t)) return e;
  const n = Ut(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Ut(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function pe(e, t) {
  if (!Number.isFinite(e) || !V(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function Se(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function V(e) {
  return Number.isFinite(e) && e > 0;
}
function J(e, t) {
  return { code: e, message: t };
}
function A(e, t, n) {
  e.some((r) => r.code === t) || e.push(J(t, n));
}
export {
  Ei as CANDLE_TIMESTAMP_SEMANTICS,
  ei as DECISION_RECORD_SCHEMA_VERSION,
  Rt as DECISION_SNAPSHOT_SCHEMA_VERSION,
  or as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  br as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  Di as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  ce as IMPULSE_FADE_CANDIDATE_GATE,
  en as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  U as IMPULSE_FADE_LIFECYCLE_VERSION,
  tr as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  nr as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  G as IMPULSE_FADE_SETUP_FAMILY,
  dr as RADAR_EPISODE_SCHEMA_VERSION,
  hr as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  vr as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  xt as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  yr as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  gr as RADAR_STRUCTURE_OBSERVATION_SCHEMA_VERSION,
  pr as RADAR_UNIVERSE_MEMBERSHIP_SCHEMA_VERSION,
  mr as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  Yr as SIZING_MODEL_VERSION,
  Zr as SIZING_RESULT_SCHEMA_VERSION,
  er as STRATEGY_PROFILE_SCHEMA_VERSION,
  Jr as TRADE_PLAN_SCHEMA_VERSION,
  vi as appendSyntheticCandle,
  ie as bucketStart,
  $t as calculateLinearPerpetualSizing,
  j as candleCloseTime,
  Ge as candleToBytes,
  jt as candlesToBytes,
  O as canonicalHash,
  Hi as canonicalRadarJson,
  M as canonicalSerialize,
  gt as computeAnchoredVwapLine,
  Pi as computeAnchoredVwapSignals,
  xi as computeAnchoredVwapSnapshot,
  ki as computeAtrLine,
  pi as computeBollingerBands,
  di as computeCloseChangePct,
  bi as computeEmaLine,
  Fe as computeExtensionSnapshot,
  Ai as computeMacd,
  ue as computeMarketStructure,
  bn as computeRelativeCumulativeReturnLine,
  Ni as computeRelativeStrengthDivergences,
  Si as computeRsiLine,
  tn as computeSetupState,
  yi as computeSmaLine,
  wi as computeStochRsi,
  Ci as computeStructureActiveLevels,
  Ii as computeSupportResistanceZones,
  yn as computeSupportResistanceZonesFromSwings,
  vn as computeSwingPoints,
  mi as computeViewBounds,
  gi as computeWmaLine,
  $i as createDecisionRecord,
  Oi as createDecisionReferenceLevel,
  Mi as createDecisionSnapshot,
  Oe as createDurableObjectReference,
  wr as createExecutionVenueEligibilityObservation,
  ir as createImpulseFadeResearchProfile,
  Sr as createRadarSelectionProfile,
  Fi as createRadarStructureObservation,
  rr as createStrategyProfile,
  Vi as createTradePlan,
  Li as createUniverseMembershipObservation,
  Et as decisionSnapshotId,
  sr as decisionSnapshotReferenceLevels,
  Ti as evaluateImpulseFadeSnapshot,
  Ri as evaluateImpulseFadeTimeline,
  ti as evaluateTradePlanCompliance,
  Nt as executionVenueEligibilityObservationId,
  I as immutableJsonClone,
  oe as impulseFadeLifecycleConfigHash,
  _i as lineToBytes,
  hi as makeSyntheticCandles,
  zt as mergeLiveCandle,
  st as normalizeOhlcvPoint,
  ui as normalizeRestTimeframe,
  at as packHistoricalCandles,
  fi as prependHistoricalCandles,
  Pt as radarSelectionProfileHash,
  It as radarStructureObservationId,
  Bi as scanRadarEpisodes,
  Tt as strategyProfileHash,
  re as timeframeToSeconds,
  qt as tradePlanId,
  Ct as universeMembershipObservationId
};
