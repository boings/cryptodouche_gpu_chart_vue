function te(e) {
  const t = String(e).trim().toLowerCase();
  return t.endsWith("m") ? parseInt(t, 10) * 60 : t.endsWith("h") ? parseInt(t, 10) * 60 * 60 : t.endsWith("d") ? parseInt(t, 10) * 24 * 60 * 60 : parseInt(t, 10) * 60;
}
function ni(e) {
  const t = String(e).trim().toLowerCase();
  return t === "60" ? "1h" : t.endsWith("m") || t.endsWith("h") || t.endsWith("d") ? t : `${t}m`;
}
function ne(e, t) {
  return Math.floor(e / t) * t;
}
function rt(e) {
  const t = at(e);
  if (!t || typeof t != "object") return null;
  const n = t, r = Ut(n.ts), s = Z(n.o), i = Z(n.h), o = Z(n.l), a = Z(n.c);
  return r == null || s == null || i == null || o == null || a == null ? null : {
    ts: r,
    o: s,
    h: i,
    l: o,
    c: a,
    v_base: Z(n.v_base),
    v_quote: Z(n.v_quote),
    ver: Z(n.ver)
  };
}
function it(e, t, n) {
  const r = te(t), s = qt(
    e.map((a, c) => st(a, c)).filter((a) => a != null),
    r
  ).slice(-Math.max(1, n));
  if (!s.length)
    return {
      timeframeSec: r,
      firstBucket: 0,
      candles: [],
      positionByBucket: /* @__PURE__ */ new Map()
    };
  const i = ne(s[0].ts, r), o = s.map((a) => {
    const c = ne(a.ts, r);
    return {
      ...a,
      bucket: c,
      x: (c - i) / r
    };
  });
  return Me({
    timeframeSec: r,
    firstBucket: i,
    candles: o,
    positionByBucket: /* @__PURE__ */ new Map()
  });
}
function ri(e, t, n) {
  const r = e.candles.length, s = t.map((o, a) => st(o, a)).filter((o) => o != null).filter((o) => ne(o.ts, e.timeframeSec) < e.firstBucket).sort(ot);
  if (!s.length) return 0;
  const i = it(
    [...s, ...e.candles],
    n,
    s.length + e.candles.length
  );
  return e.timeframeSec = i.timeframeSec, e.firstBucket = i.firstBucket, e.candles = i.candles, e.positionByBucket = i.positionByBucket, Math.max(0, e.candles.length - r);
}
function Dt(e) {
  const t = new Float32Array(e.length * 5);
  return e.forEach((n, r) => {
    t.set([n.x, n.o, n.h, n.l, n.c], r * 5);
  }), new Uint8Array(t.buffer);
}
function je(e) {
  const t = new Float32Array([e.x, e.o, e.h, e.l, e.c]);
  return new Uint8Array(t.buffer);
}
function ii(e) {
  if (e.length < 2) return null;
  const t = e[e.length - 2], n = e[e.length - 1];
  return !Number.isFinite(t.c) || !Number.isFinite(n.c) || t.c === 0 ? null : (n.c - t.c) / Math.abs(t.c) * 100;
}
function Ht(e, t, n, r = 3) {
  const s = rt(t);
  if (!s) return { kind: "ignore", reason: "invalid-payload" };
  if (!e.candles.length || e.firstBucket === 0)
    return { kind: "ignore", reason: "empty-history" };
  const i = ne(s.ts, e.timeframeSec);
  if (i < e.firstBucket) return { kind: "ignore", reason: "before-history" };
  const o = e.positionByBucket.get(i), a = (i - e.firstBucket) / e.timeframeSec, c = { ...s, bucket: i, x: a };
  if (o != null)
    return Qt(c, e.candles[o]) ? { kind: "ignore", reason: "stale-version" } : Gt(e.candles[o], c) ? (e.candles[o] = c, { kind: "ignore", reason: "unchanged" }) : (e.candles[o] = c, {
      kind: "replace",
      position: o,
      bytes: je(c)
    });
  const l = e.candles[e.candles.length - 1];
  return i <= l.bucket ? { kind: "ignore", reason: "stale-gap" } : (i - l.bucket) / e.timeframeSec > r ? { kind: "ignore", reason: "gap-too-large" } : (e.candles.push(c), e.candles.length > Math.max(1, n) ? (e.candles.splice(0, e.candles.length - Math.max(1, n)), Vt(e), { kind: "reset", bytes: Dt(e.candles) }) : (Me(e), {
    kind: "append",
    position: e.candles.length - 1,
    bytes: je(c)
  }));
}
function si(e, t = []) {
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
function oi(e, t, n) {
  const r = te(n), s = Math.floor(Date.now() / 1e3), i = ne(s, r), o = e.split("").reduce((l, u) => l + u.charCodeAt(0), 0), a = [];
  let c = 40 + o % 160;
  for (let l = Math.max(1, t) - 1; l >= 0; l--) {
    const u = i - l * r, d = Math.sin((t - l + o) / 9) * 0.8, f = c, m = Math.max(1e-4, f + d + Math.cos((t - l) / 13) * 0.35), h = Math.max(f, m) + 0.35 + Math.abs(Math.sin(l + o)) * 0.5, y = Math.min(f, m) - 0.35 - Math.abs(Math.cos(l + o)) * 0.5, p = 50 + o % 90 + Math.abs(Math.sin((t - l + o) / 5)) * 180;
    a.push({ ts: u, o: f, h, l: y, c: m, v_base: p, v_quote: p * m }), c = m;
  }
  return it(a, n, t);
}
function ai(e, t) {
  const n = e.candles[e.candles.length - 1];
  if (!n) return { kind: "ignore", reason: "empty-history" };
  const r = n.bucket + e.timeframeSec, s = Math.sin(r / 600) * 0.7, i = n.c, o = Math.max(1e-4, i + s), a = Math.max(i, o) + 0.5, c = Math.min(i, o) - 0.5, l = Math.max(1, (n.v_base ?? 100) * (0.82 + Math.abs(s) * 0.36));
  return Ht(e, { ts: r, o: i, h: a, l: c, c: o, v_base: l, v_quote: l * o }, t);
}
function Vt(e) {
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
function st(e, t) {
  const n = rt(e);
  return n ? { ...n, sourceOrder: t } : null;
}
function qt(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = ne(r.ts, t), i = n.get(s);
    (!i || ot(r, i) > 0) && n.set(s, r);
  }
  return Array.from(n.entries()).sort(([r], [s]) => r - s).map(([, r]) => $t(r));
}
function ot(e, t) {
  const n = e.ver ?? Number.NEGATIVE_INFINITY, r = t.ver ?? Number.NEGATIVE_INFINITY;
  return n !== r ? n - r : e.ts !== t.ts ? e.ts - t.ts : e.sourceOrder - t.sourceOrder;
}
function $t(e) {
  const { sourceOrder: t, ...n } = e;
  return n;
}
function Ut(e) {
  if (typeof e == "number")
    return Number.isFinite(e) ? e >= 1e12 ? Math.floor(e / 1e3) : Math.floor(e) : null;
  if (typeof e == "string") {
    const t = Date.parse(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  if (Array.isArray(e)) {
    const t = e.length >= 9 ? zt(e) : jt(e);
    return Number.isNaN(t) ? null : Math.floor(t / 1e3);
  }
  return null;
}
function zt(e) {
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
function jt(e) {
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
function Gt(e, t) {
  return e.o === t.o && e.h === t.h && e.l === t.l && e.c === t.c && Object.is(e.v_base, t.v_base) && Object.is(e.v_quote, t.v_quote);
}
function Qt(e, t) {
  return e.ver == null || t.ver == null ? !1 : e.ver < t.ver;
}
function Z(e) {
  const t = typeof e == "number" ? e : typeof e == "string" ? Number(e) : NaN;
  return Number.isFinite(t) ? t : void 0;
}
function at(e) {
  if (typeof e == "string")
    try {
      return at(JSON.parse(e));
    } catch {
      return null;
    }
  if (e && typeof e == "object" && "data" in e) {
    const t = e.data;
    if (t && typeof t == "object") return t;
  }
  return e;
}
function B(e) {
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
function _(e) {
  const t = new TextEncoder().encode(B(e));
  let n = 0xcbf29ce484222325n;
  for (const r of t)
    n ^= BigInt(r), n = BigInt.asUintN(64, n * 0x100000001b3n);
  return `fnv1a64:${n.toString(16).padStart(16, "0")}`;
}
function N(e) {
  return ct(JSON.parse(B(e)));
}
function ct(e) {
  if (e && typeof e == "object") {
    for (const t of Object.values(e)) ct(t);
    Object.freeze(e);
  }
  return e;
}
const Q = "impulse_fade_v1", U = "impulse_fade_v1.lifecycle.1", Wt = "impulse_fade_v1.lifecycle-config.1", oe = Object.freeze({
  returnPct: 8,
  percentile: 95,
  zScore: 2,
  atrExtension: 2,
  mode: "any"
});
function ci(e, t = 20) {
  if (e.length < t) return new Float32Array();
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.c, i >= t && (r -= e[i - t].c), i >= t - 1 && n.push(s.x, r / t);
  }), new Float32Array(n);
}
function li(e, t = 20) {
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
function ui(e, t = 20) {
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
function fi(e, t = 20, n = 2) {
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
function di(e, t = 14) {
  return J(St(e, t));
}
function mi(e, t = 14, n = 14, r = 3, s = 3) {
  const i = St(e, t), o = ee(n);
  if (i.length < o)
    return { k: new Float32Array(), d: new Float32Array() };
  const a = [];
  for (let u = o - 1; u < i.length; u++) {
    let d = 1 / 0, f = -1 / 0;
    for (let y = 0; y < o; y++) {
      const p = i[u - y].value;
      d = Math.min(d, p), f = Math.max(f, p);
    }
    const m = f - d, h = m > 0 ? (i[u].value - d) / m * 100 : 50;
    a.push({ x: i[u].x, value: h });
  }
  const c = Ze(a, ee(r)), l = Ze(c, ee(s));
  return {
    k: J(c),
    d: J(l)
  };
}
function hi(e, t = 12, n = 26, r = 9) {
  const s = _e(e, t), i = _e(e, n), o = [];
  for (let u = 0; u < e.length; u++) {
    const d = s[u], f = i[u];
    d == null || f == null || o.push({ x: e[u].x, value: d - f });
  }
  const a = Qn(o, r), c = new Map(o.map((u) => [u.x, u.value])), l = a.map((u) => ({
    x: u.x,
    value: (c.get(u.x) ?? u.value) - u.value
  }));
  return {
    macd: J(o),
    signal: J(a),
    histogram: J(l)
  };
}
function vi(e, t = 14) {
  const n = Re(e, t), r = [];
  return n.forEach((s, i) => {
    s != null && r.push({ x: e[i].x, value: s });
  }), J(r);
}
function Fe(e, t = {}) {
  const n = R(t.windowSeconds, 60, 2592e3, 86400), r = R(t.historyDays, 1, 365, 180), s = R(t.minSamples, 1, 5e3, 20), i = R(t.emaPeriod, 2, 500, 20), o = R(t.atrPeriod, 2, 500, 14), a = pt(e);
  if (!a)
    return Pn(n);
  const c = e.indexOf(a), l = bt(e, a.bucket - n, c), u = l && M(l.c) ? (a.c / l.c - 1) * 100 : null, d = u == null ? [] : Cn(e, {
    windowSeconds: n,
    earliestBucket: a.bucket - r * 86400,
    excludeBucket: a.bucket
  }), f = u != null && d.length >= s ? Nn(d, u) : null, m = u != null && d.length >= s ? In(d, u) : null, h = _e(e, i)[c] ?? null, y = Re(e, o)[c] ?? null, p = h != null && y != null && Number.isFinite(h) && Number.isFinite(y) && y > 0 ? (a.c - h) / y : null;
  return {
    candle: a,
    referenceCandle: l,
    windowSeconds: n,
    returnPct: u,
    percentile: f,
    zScore: m,
    rollingReturnCount: d.length,
    ema: h,
    atr: y,
    atrExtension: p
  };
}
function Xt(e = {}) {
  var me, he, ve;
  const t = e.executionTimeframe ?? "chart", n = b(e.asOf), r = b(e.latestTs) ?? vn(e.candles ?? [], t) ?? b((me = e.structure) == null ? void 0 : me.updatedTs) ?? b((he = e.marketStructure) == null ? void 0 : he.summary.updatedTs) ?? null, s = n ?? r, i = s == null ? null : He(e.candles ?? [], s, t), o = (i == null ? void 0 : i.candle.c) ?? b(e.latestPrice), a = Yt(e.marketStructure ?? null, n), c = (a == null ? void 0 : a.summary) ?? Zt(e.structure, n), l = e.htfStructures ?? [], u = n == null ? e.htfStructures ?? [] : Le(e.htfStructures ?? [], n), d = (e.srZones ?? []).filter(
    (Y) => n == null || x(Y) <= n
  ), f = (e.rsDivergences ?? []).filter(
    (Y) => n == null || x(Y) <= n
  ), m = (e.anchoredVwapSignals ?? []).filter(
    (Y) => n == null || x(Y) <= n
  ), h = I(e.resistanceNearPct, 0, 10, 1.5), y = I(e.retestNearPct, 0, 10, 0.8), p = bn(e.extension ?? null), w = Sn(d, o, h), E = wn(f), A = An(c), T = kn(
    m,
    e.avwapDistancePct
  ), P = Rn(c, d, o, y), g = Tn(p, w, c, o), v = [
    p,
    w,
    E,
    A,
    T,
    P
  ], k = {
    checks: v,
    asOf: s,
    updatedTs: r,
    executionTimeframe: t,
    lifecycleConfigHash: e.lifecycleConfigHash ?? re({
      extensionOptions: e.extensionOptions,
      resistanceNearPct: e.resistanceNearPct,
      retestNearPct: e.retestNearPct,
      retestToleranceBps: e.retestToleranceBps,
      retestToleranceAtr: e.retestToleranceAtr,
      invalidationBps: e.invalidationBps,
      maxCandidateAgeSeconds: e.maxCandidateAgeSeconds
    })
  }, F = cn({
    extension: p,
    htfResistance: w,
    htfStructures: u,
    rsWeakness: E,
    structureShift: A,
    avwapFailure: T,
    retest: P,
    invalidated: g
  });
  return (ve = e.candles) != null && ve.length && s != null ? en({
    ...e,
    asOf: s,
    latestPrice: o,
    marketStructure: a,
    structure: c,
    htfStructures: l,
    srZones: d,
    rsDivergences: f,
    anchoredVwapSignals: m,
    checks: v,
    executionTimeframe: t
  }) : ht({
    ...k,
    state: F,
    reason: xn(F, v),
    dataQuality: ["Chronological setup lifecycle requires candle history"]
  });
}
function Yt(e, t) {
  var i;
  if (!e || t == null) return e;
  const n = e.swings.filter((o) => o.knownAt <= t), r = e.breaks.filter((o) => o.knownAt <= t), s = ((i = W(r)) == null ? void 0 : i.direction) ?? "neutral";
  return {
    swings: n,
    breaks: r,
    trend: s,
    summary: qe(n, r, s)
  };
}
function Zt(e, t) {
  if (!e || t == null) return e ?? null;
  const n = b(e.updatedTs);
  return n == null || n <= t ? e : null;
}
function yi(e) {
  return Kt(e).records;
}
function re(e = {}) {
  var t, n, r, s, i, o, a, c, l, u, d;
  return _({
    lifecycleVersion: U,
    lifecycleConfigVersion: Wt,
    candidateGate: oe,
    extension: {
      windowSeconds: R(
        (t = e.extensionOptions) == null ? void 0 : t.windowSeconds,
        60,
        30 * 86400,
        86400
      ),
      historyDays: R((n = e.extensionOptions) == null ? void 0 : n.historyDays, 1, 365, 180),
      minSamples: R((r = e.extensionOptions) == null ? void 0 : r.minSamples, 1, 5e3, 20),
      emaPeriod: R((s = e.extensionOptions) == null ? void 0 : s.emaPeriod, 2, 500, 20),
      atrPeriod: R((i = e.extensionOptions) == null ? void 0 : i.atrPeriod, 2, 500, 14)
    },
    marketStructure: {
      lookback: R(
        (o = e.marketStructureOptions) == null ? void 0 : o.lookback,
        20,
        2e3,
        500
      ),
      pivotStrength: R(
        (a = e.marketStructureOptions) == null ? void 0 : a.pivotStrength,
        1,
        20,
        3
      ),
      atrPeriod: R((c = e.marketStructureOptions) == null ? void 0 : c.atrPeriod, 2, 100, 14),
      minMoveAtr: I((l = e.marketStructureOptions) == null ? void 0 : l.minMoveAtr, 0, 10, 0.75),
      maxSwings: R((u = e.marketStructureOptions) == null ? void 0 : u.maxSwings, 1, 500, 120),
      maxBreaks: R((d = e.marketStructureOptions) == null ? void 0 : d.maxBreaks, 1, 200, 24)
    },
    resistanceNearPct: I(e.resistanceNearPct, 0, 10, 1.5),
    retestNearPct: I(e.retestNearPct, 0, 10, 0.8),
    retestToleranceBps: I(e.retestToleranceBps, 0, 1e3, 35),
    retestToleranceAtr: I(e.retestToleranceAtr, 0, 10, 0.25),
    invalidationBps: I(e.invalidationBps, 0, 1e3, 10),
    maxCandidateAgeSeconds: R(
      e.maxCandidateAgeSeconds,
      60,
      30 * 86400,
      4320 * 60
    )
  });
}
function gi(e) {
  var a;
  const t = ft(e), n = W(t);
  if (n == null) return null;
  const r = ut(e, n), s = /* @__PURE__ */ new Map(), i = e.candlesByTimeframe[e.executionTimeframe] ?? [], o = new Set(
    i.map((c) => z(c, e.executionTimeframe)).filter((c) => c <= n)
  );
  for (const c of e.structureEvents ?? [])
    (!c.sourceTimeframe || c.sourceTimeframe === e.executionTimeframe) && x(c) <= n && o.add(x(c));
  for (const c of [...o].sort((l, u) => l - u))
    Oe(
      Ae(i, e.executionTimeframe, c),
      e.executionTimeframe,
      e.structureEvents ?? [],
      (a = e.config) == null ? void 0 : a.marketStructureOptions,
      c,
      s
    );
  return lt(
    e,
    n,
    s,
    r
  );
}
function Kt(e) {
  const t = e.executionTimeframe, n = e.candlesByTimeframe[t] ?? [], r = e.config ?? {}, s = re(r), i = ft(e), o = ut(
    e,
    W(i) ?? 0
  ), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = b(e.from) ?? -1 / 0;
  let d = null;
  return { records: i.map((m) => {
    var A, T, P, g, v;
    const h = lt(
      e,
      m,
      a,
      o
    ), y = dt(e.candidateMetrics, m), p = (y == null ? void 0 : y.metrics) ?? De(
      Fe(
        Ae(n, t, m),
        r.extensionOptions
      )
    );
    d = h;
    const w = h.evidence.filter((k) => c.has(k.id) ? !1 : (c.add(k.id), k.knownAt >= u)), E = h.transitions.filter((k) => {
      const F = Jt(k);
      return l.has(F) ? !1 : (l.add(F), k.knownAt >= u);
    });
    return {
      asOf: m,
      setupFamily: Q,
      lifecycleVersion: U,
      lifecycleConfigHash: s,
      candidateGatePassed: fe(p),
      candidateId: ((A = h.candidate) == null ? void 0 : A.id) ?? null,
      candidateDetectedAt: ((T = h.candidate) == null ? void 0 : T.detectedAt) ?? null,
      initialMtfContext: ((P = h.candidate) == null ? void 0 : P.initialMtfContext) ?? [],
      currentState: h.currentState,
      stateSince: h.stateSince,
      transition: W(E) ?? null,
      transitions: E,
      evidenceAdded: w,
      pendingConditions: h.pendingConditions,
      confluence: h.confluence,
      episodeHigh: ((g = h.candidate) == null ? void 0 : g.episodeHigh) ?? null,
      episodeHighTime: ((v = h.candidate) == null ? void 0 : v.episodeHighTime) ?? null,
      activeBreakLevel: h.activeBreakLevel,
      retestLevel: h.retestLevel,
      terminalReason: h.invalidationReason ?? h.expiryReason,
      dataQualityNotes: h.dataQuality
    };
  }), latestSnapshot: d };
}
function lt(e, t, n, r) {
  const s = e.executionTimeframe, i = e.candlesByTimeframe[s] ?? [], o = e.config ?? {}, a = re(o), c = Ae(i, s, t), l = Fe(c, o.extensionOptions), u = dt(e.candidateMetrics, t), d = (u == null ? void 0 : u.metrics) ?? De(l), f = Oe(
    c,
    s,
    e.structureEvents ?? [],
    o.marketStructureOptions,
    t,
    n
  ), m = r.filter(
    (y) => (y.summary.updatedTs ?? 0) <= t
  ), h = W(c) ?? null;
  return Xt({
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
    htfStructures: m,
    srZones: e.supportResistanceZones,
    rsDivergences: e.relativeStrengthEvents,
    anchoredVwapSignals: e.avwapEvents,
    latestPrice: (h == null ? void 0 : h.c) ?? null,
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
function ut(e, t) {
  return Object.entries(e.candlesByTimeframe).filter(([n]) => n !== e.executionTimeframe).flatMap(([n, r]) => {
    const s = new Set(
      r.map((i) => z(i, n)).filter((i) => i <= t)
    );
    for (const i of e.structureEvents ?? [])
      i.sourceTimeframe === n && x(i) <= t && s.add(x(i));
    return [...s].sort((i, o) => i - o).map((i) => {
      var a;
      const o = Oe(
        Ae(r, n, i),
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
const pi = "openTime";
function z(e, t) {
  return (b(e.bucket) ?? b(e.ts) ?? 0) + Math.max(1, te(t));
}
function Ae(e, t, n) {
  return e.filter((r) => z(r, t) <= n);
}
function ft(e) {
  const t = /* @__PURE__ */ new Set();
  for (const [i, o] of Object.entries(e.candlesByTimeframe))
    for (const a of o) t.add(z(a, i));
  for (const i of e.candidateMetrics ?? [])
    t.add(b(i.knownAt) ?? i.asOf);
  for (const i of e.structureEvents ?? []) t.add(x(i));
  for (const i of e.avwapEvents ?? []) t.add(x(i));
  for (const i of e.relativeStrengthEvents ?? []) t.add(x(i));
  for (const i of e.supportResistanceZones ?? []) t.add(x(i));
  for (const i of e.evaluationPoints ?? []) {
    const o = b(i);
    o != null && t.add(o);
  }
  const n = [...t].filter(Number.isFinite).sort((i, o) => i - o), r = b(e.from) ?? n[0] ?? 0, s = b(e.to) ?? W(n) ?? r;
  return t.add(r), t.add(s), [...t].filter((i) => Number.isFinite(i) && i >= r && i <= s).sort((i, o) => i - o);
}
function dt(e, t) {
  return W([...e ?? []].filter((n) => (b(n.knownAt) ?? n.asOf) <= t).sort(
    (n, r) => (b(n.knownAt) ?? n.asOf) - (b(r.knownAt) ?? r.asOf) || n.asOf - r.asOf
  )) ?? null;
}
function Oe(e, t, n, r, s, i) {
  var d;
  const o = ce(e, r), a = n.filter(
    (f) => (!f.sourceTimeframe || f.sourceTimeframe === t) && x(f) <= s
  ), c = i ?? /* @__PURE__ */ new Map();
  for (const f of [...o.breaks, ...a])
    c.set(
      G(
        f.kind,
        t,
        f.eventTime,
        f.knownAt,
        `${f.direction}:${f.level}`
      ),
      f
    );
  const l = [...c.values()].filter((f) => f.knownAt <= s).sort(
    (f, m) => f.knownAt - m.knownAt || f.eventTime - m.eventTime
  );
  if (!l.length) return o;
  const u = ((d = W(l)) == null ? void 0 : d.direction) ?? o.trend;
  return {
    swings: o.swings,
    breaks: l,
    trend: u,
    summary: qe(o.swings, l, u)
  };
}
function Jt(e) {
  return [
    e.from,
    e.to,
    e.knownAt,
    ...e.evidenceIds
  ].join(":");
}
function en(e) {
  const t = e.candles ?? [], n = e.extensionOptions ?? {}, r = tn(
    t,
    n,
    e.asOf,
    e.executionTimeframe,
    e.candidateMetrics
  ), s = dn(r, n);
  let i = nn(r, e);
  if (!i && fe(e.extension ?? null)) {
    const o = He(t, e.asOf, e.executionTimeframe);
    o && (i = {
      index: o.index,
      candle: o.candle,
      eventTime: V(o.candle),
      knownAt: Math.min(
        e.asOf,
        j(t, o.index, e.executionTimeframe)
      ),
      metrics: Be(e.extension ?? null),
      pass: !0,
      rollingReturnCount: 0
    }, s.push(
      "Candidate gate used latest shared metrics because chart history had no passing gate edge"
    ));
  }
  return i ? mt(i, e, e.asOf, s) : ht({
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
function tn(e, t, n, r, s) {
  if (s != null && s.length)
    return [...s].map((o) => {
      const a = b(o.knownAt) ?? o.asOf, c = He(e, a, r);
      if (!c || a > n) return null;
      const l = b(o.eventTime) ?? V(c.candle), u = Be(o.metrics);
      return {
        index: c.index,
        candle: c.candle,
        eventTime: l,
        knownAt: a,
        metrics: u,
        pass: fe(u),
        rollingReturnCount: Math.max(0, Math.trunc(o.sampleCount ?? 0))
      };
    }).filter((o) => o != null).sort((o, a) => o.knownAt - a.knownAt || o.eventTime - a.eventTime);
  const i = [];
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o], c = j(e, o, r);
    if (c > n) continue;
    const l = Fe(e.slice(0, o + 1), t), u = De(l);
    i.push({
      index: o,
      candle: a,
      eventTime: V(a),
      knownAt: c,
      metrics: u,
      pass: fe(u),
      rollingReturnCount: l.rollingReturnCount
    });
  }
  return i;
}
function nn(e, t) {
  var i;
  const n = [];
  let r = !1;
  for (const o of e)
    o.pass && !r && n.push(o), r = o.pass;
  if (!n.length) return null;
  let s = n[0];
  for (const o of n.slice(1)) {
    const c = ((i = mt(s, t, o.knownAt, []).candidate) == null ? void 0 : i.terminalAt) ?? null;
    c != null && e.some((l) => l.knownAt > c && l.knownAt < o.knownAt && !l.pass) && (s = o);
  }
  return s;
}
function mt(e, t, n, r) {
  const s = (t.symbol ?? "UNKNOWN").toUpperCase(), i = t.source ?? "chart", o = t.venue ?? "", a = t.executionTimeframe, c = Le(
    t.htfStructures ?? [],
    e.knownAt
  ).map((v) => ({
    timeframe: v.timeframe,
    state: v.summary.state,
    trend: v.summary.trend,
    transitionDirection: v.summary.transitionDirection,
    updatedTs: v.summary.updatedTs
  })), l = hn({
    setupFamily: Q,
    symbol: s,
    source: i,
    venue: o,
    executionTimeframe: a,
    detectedAt: e.knownAt
  }), u = [
    {
      id: G("candidate_detected", a, e.eventTime, e.knownAt),
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
  ], f = on(t, e, n), m = rn(e, t, n);
  let h = "developing", y = e.knownAt, p = null, w = null, E = null, A = null, T = null;
  for (const v of m) {
    if (p != null) break;
    if (!(v.knownAt < e.knownAt || v.knownAt > n)) {
      if (v.lifecycleKind === "deterioration") {
        u.push({ ...v, contributesTo: "deteriorating" }), h === "developing" && (d.push(se(h, "deteriorating", v)), h = "deteriorating", y = v.knownAt);
        continue;
      }
      if (v.lifecycleKind === "bearishBreak") {
        u.push({ ...v, contributesTo: "waitingForRetest" }), (h === "developing" || h === "deteriorating") && (d.push(se(h, "waitingForRetest", v)), h = "waitingForRetest", y = v.knownAt, w = v.breakLevel ?? null);
        continue;
      }
      if (v.lifecycleKind === "retest") {
        h === "waitingForRetest" && w && v.relatedEventId === w.evidenceId && v.knownAt > w.knownAt && (u.push({ ...v, contributesTo: "entryCandidate" }), d.push(se(h, "entryCandidate", v)), h = "entryCandidate", y = v.knownAt, E = v.breakLevel ?? w);
        continue;
      }
      if (v.lifecycleKind === "invalidation") {
        (h === "deteriorating" || h === "waitingForRetest" || h === "entryCandidate") && (u.push({ ...v, contributesTo: "invalidated" }), d.push(se(h, "invalidated", v)), h = "invalidated", y = v.knownAt, p = v.knownAt, A = v.explanation);
        continue;
      }
      v.lifecycleKind === "expiry" && h !== "entryCandidate" && (u.push({ ...v, contributesTo: "expired" }), d.push(se(h, "expired", v)), h = "expired", y = v.knownAt, p = v.knownAt, T = v.explanation);
    }
  }
  const P = gt(
    t.candles ?? [],
    e.eventTime,
    n,
    a
  ), g = {
    id: l,
    setupFamily: Q,
    lifecycleVersion: U,
    lifecycleConfigHash: t.lifecycleConfigHash ?? re({
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
    episodeHigh: (P == null ? void 0 : P.price) ?? null,
    episodeHighTime: (P == null ? void 0 : P.eventTime) ?? null,
    currentState: h,
    stateSince: y,
    terminalAt: p
  };
  return {
    strategy: "pumpFade",
    setupFamily: Q,
    lifecycleVersion: U,
    lifecycleConfigHash: g.lifecycleConfigHash,
    asOf: n,
    executionTimeframe: a,
    state: h,
    currentState: h,
    stateSince: y,
    label: ke(h),
    reason: mn(h, u, d, A, T),
    checks: t.checks,
    updatedTs: n,
    candidate: g,
    evidence: u.sort((v, k) => v.knownAt - k.knownAt || v.eventTime - k.eventTime),
    transitions: d,
    pendingConditions: yt(h, w),
    activeBreakLevel: w,
    retestLevel: E,
    confluence: f,
    invalidationReason: A,
    expiryReason: T,
    dataQuality: r
  };
}
function rn(e, t, n) {
  const r = [], s = t.executionTimeframe;
  for (const l of t.rsDivergences ?? []) {
    if (l.direction !== "bearish") continue;
    const u = x(l);
    if (!ae(l, e, n)) continue;
    const d = l.signal === "break" ? "rs_break_bearish" : l.signal === "lead" ? "rs_lead_bearish" : "rs_div_bearish";
    r.push({
      id: G(d, s, l.eventTime, u, l.x),
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
    const u = x(l);
    l.kind !== "failedReclaim" || !ae(l, e, n) || r.push({
      id: G("avwap_failed_reclaim", s, l.eventTime, u, l.x),
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
  const i = an(t), o = [];
  for (const l of i) {
    const u = x(l);
    if (l.direction !== "bearish" || !ae(l, e, n)) continue;
    const d = l.kind === "StructureShift" ? "bearish_structure_shift" : "bearish_structure_break", f = G(d, s, l.eventTime, u, l.x), m = {
      level: l.level,
      sourceTimeframe: s,
      eventTime: l.eventTime,
      knownAt: u,
      evidenceId: f
    }, h = {
      id: f,
      code: d,
      explanation: `${l.label} down through ${$(l.level)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      level: l.level,
      lifecycleKind: "bearishBreak",
      sortPriority: 30,
      breakLevel: m
    };
    o.push(h), r.push(h);
  }
  for (const l of o) {
    const u = sn(e, l, t, n);
    u && r.push(u);
  }
  for (const l of i) {
    const u = x(l);
    if (l.kind !== "StructureBreak" || l.direction !== "bullish" || !ae(l, e, n))
      continue;
    const d = (t.candles ?? [])[l.index], f = gt(
      t.candles ?? [],
      e.eventTime,
      u - 1,
      s
    ), m = I(t.invalidationBps, 0, 1e3, 10);
    !d || (f == null ? void 0 : f.price) == null || d.c <= f.price * (1 + m / 1e4) || r.push({
      id: G("bullish_continuation_invalidation", s, l.eventTime, u, l.x),
      code: "bullish_continuation_invalidation",
      explanation: `Bullish continuation closed beyond episode high ${$(f.price)}`,
      eventTime: l.eventTime,
      knownAt: u,
      sourceTimeframe: s,
      price: d.c,
      level: f.price,
      lifecycleKind: "invalidation",
      sortPriority: 50
    });
  }
  const a = R(
    t.maxCandidateAgeSeconds,
    60,
    30 * 86400,
    4320 * 60
  ), c = e.knownAt + a;
  return c <= n && r.push({
    id: G("candidate_expired", s, e.eventTime, c),
    code: "candidate_expired",
    explanation: `Candidate did not reach entry state within ${pn(a)}`,
    eventTime: c,
    knownAt: c,
    sourceTimeframe: s,
    lifecycleKind: "expiry",
    sortPriority: 90
  }), r.sort(
    (l, u) => l.knownAt - u.knownAt || l.eventTime - u.eventTime || l.sortPriority - u.sortPriority || l.code.localeCompare(u.code)
  );
}
function sn(e, t, n, r) {
  var u;
  const s = n.candles ?? [], i = t.breakLevel;
  if (!i || !Number.isFinite(i.level)) return null;
  const o = I(n.retestToleranceBps, 0, 1e3, 35), a = I(n.retestToleranceAtr, 0, 10, 0.25), c = R((u = n.extensionOptions) == null ? void 0 : u.atrPeriod, 2, 100, 14), l = Re(s, c);
  for (let d = 0; d < s.length; d += 1) {
    const f = s[d], m = j(s, d, n.executionTimeframe), h = V(f);
    if (m <= t.knownAt || h < t.knownAt || h < e.knownAt || m > r)
      continue;
    const y = l[d] ?? 0, p = Math.max(
      i.level * (o / 1e4),
      Number.isFinite(y) ? y * a : 0
    );
    if (f.h >= i.level - p && f.l <= i.level + p && f.c < i.level && f.c <= f.o)
      return {
        id: G(
          "bearish_retest_rejection",
          i.sourceTimeframe,
          V(f),
          m,
          d
        ),
        code: "bearish_retest_rejection",
        explanation: `Bearish rejection after retest of ${$(i.level)}`,
        eventTime: h,
        knownAt: m,
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
function on(e, t, n) {
  const r = [], s = Ve(
    e.srZones.filter((a) => x(a) <= n),
    e.latestPrice,
    I(e.resistanceNearPct, 0, 10, 1.5)
  );
  s && r.push({
    code: "near_htf_resistance",
    label: "HTF resistance",
    detail: `Near R ${$(s.low)}-${$(s.high)}`,
    eventTime: s.eventTime,
    knownAt: s.knownAt,
    sourceTimeframe: "MTF",
    level: s.center
  });
  const i = [...e.anchoredVwapSignals ?? []].filter(
    (a) => a.kind === "loss" && ae(a, t, n)
  ).sort((a, c) => x(c) - x(a))[0];
  i && x(i) <= n && r.push({
    code: "avwap_loss_context",
    label: "AVWAP loss",
    detail: "Weak context only",
    eventTime: i.eventTime,
    knownAt: i.knownAt,
    sourceTimeframe: e.executionTimeframe,
    level: i.vwap
  });
  const o = b(e.avwapDistancePct);
  o != null && r.push({
    code: "avwap_distance",
    label: "AVWAP distance",
    detail: `${le(o, 1)}% from AVWAP`,
    value: o,
    sourceTimeframe: e.executionTimeframe
  });
  for (const a of Le(e.htfStructures, n))
    a.summary.state !== "neutral" && r.push({
      code: "mtf_structure_context",
      label: `${a.timeframe} structure`,
      detail: gn(a.summary),
      eventTime: a.summary.updatedTs,
      knownAt: a.summary.updatedTs,
      sourceTimeframe: a.timeframe
    });
  return r;
}
function Le(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const r of e) {
    const s = b(r.summary.updatedTs);
    if (s != null && s > t) continue;
    const i = n.get(r.timeframe), o = b(i == null ? void 0 : i.summary.updatedTs) ?? -1 / 0;
    (!i || (s ?? -1 / 0) >= o) && n.set(r.timeframe, r);
  }
  return [...n.values()];
}
function an(e) {
  var r, s, i;
  const t = (s = (r = e.marketStructure) == null ? void 0 : r.breaks) != null && s.length ? e.marketStructure.breaks : (i = e.structure) != null && i.lastBreak ? [e.structure.lastBreak] : [], n = /* @__PURE__ */ new Set();
  return t.filter((o) => {
    const a = `${o.kind}:${o.direction}:${o.x}:${o.level}:${x(o)}`;
    return n.has(a) ? !1 : (n.add(a), !0);
  });
}
function cn(e) {
  return e.extension.status !== "pass" ? "notCandidate" : e.invalidated ? "invalidated" : e.structureShift.status === "pass" && e.retest.status === "pass" && (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") ? "entryCandidate" : e.structureShift.status === "pass" ? "waitingForRetest" : (e.rsWeakness.status === "pass" || e.avwapFailure.status === "pass") && Ge(e.htfResistance, e.htfStructures) ? "deteriorating" : Ge(e.htfResistance, e.htfStructures) ? "developing" : "notCandidate";
}
function ht(e) {
  return {
    strategy: "pumpFade",
    setupFamily: Q,
    lifecycleVersion: U,
    lifecycleConfigHash: e.lifecycleConfigHash ?? re(),
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
    pendingConditions: yt(e.state, null),
    activeBreakLevel: null,
    retestLevel: null,
    confluence: [],
    invalidationReason: e.state === "invalidated" ? e.reason : null,
    expiryReason: e.state === "expired" ? e.reason : null,
    dataQuality: e.dataQuality ?? []
  };
}
function vt(e, t = {}) {
  const n = _n(e, t);
  if (n == null) return new Float32Array();
  const r = [];
  let s = 0, i = 0;
  for (let o = n; o < e.length; o += 1) {
    const a = e[o];
    if (!a) continue;
    const c = (a.h + a.l + a.c) / 3;
    if (!M(c)) continue;
    const l = Mn(a, c);
    l <= 0 || (s += l, i += c * l, r.push(a.x, i / s));
  }
  return new Float32Array(r);
}
function bi(e, t = {}) {
  const n = b(t.anchorBucket), r = b(t.anchorX), s = vt(e, t);
  if (s.length < 2)
    return {
      anchorBucket: n,
      anchorX: r,
      value: null,
      distancePct: null,
      candle: null
    };
  const i = s[s.length - 1], o = pt(e), a = o && M(i) ? (o.c - i) / i * 100 : null;
  return {
    anchorBucket: n,
    anchorX: r,
    value: i,
    distancePct: a,
    candle: o
  };
}
function Si(e, t = {}, n = 20) {
  const r = R(n, 1, 200, 20), s = vt(e, t);
  if (s.length < 4) return [];
  const i = new Map(e.map((c, l) => [c.x, { candle: c, index: l }])), o = [];
  let a = null;
  for (let c = 0; c < s.length; c += 2) {
    const l = s[c], u = s[c + 1], d = i.get(l);
    if (!d || !M(u) || !M(d.candle.c)) continue;
    const f = j(e, d.index), m = d.candle.c > u ? "above" : d.candle.c < u ? "below" : null;
    m && (a === "above" && m === "below" ? o.push(Ee("loss", d.index, d.candle, u, f)) : a === "below" && m === "above" ? o.push(Ee("reclaim", d.index, d.candle, u, f)) : a === "below" && m === "below" && d.candle.h >= u && d.candle.c < u && o.push(
      Ee("failedReclaim", d.index, d.candle, u, f)
    ), a = m);
  }
  return o.slice(-r);
}
function ln(e, t = {}) {
  const n = R(t.lookback, 20, 2e3, 500), r = R(t.pivotStrength, 1, 20, 3), s = R(t.atrPeriod, 2, 100, 14), i = I(t.minMoveAtr, 0, 10, 0.75), o = R(t.maxSwings, 1, 500, 120), a = Math.max(0, e.length - n), c = e.slice(a);
  if (c.length < r * 2 + 1) return [];
  const l = Re(e, s), u = [];
  for (let f = r; f < c.length - r; f += 1) {
    const m = c[f], h = a + f, y = l[h] ?? null, p = j(e, h + r);
    Un(c, f, r) && u.push(Qe("SwingHigh", h, m, m.h, y, p)), zn(c, f, r) && u.push(Qe("SwingLow", h, m, m.l, y, p));
  }
  const d = [];
  for (const f of u) {
    const m = d[d.length - 1];
    if (!m) {
      d.push(f);
      continue;
    }
    if (m.kind === f.kind) {
      Hn(f, m) && (d[d.length - 1] = f);
      continue;
    }
    Math.abs(f.price - m.price) >= Vn(f, m, i) && d.push(f);
  }
  return Fn(d).slice(-o);
}
function ce(e, t = {}) {
  const n = R(t.maxSwings, 1, 500, 120), r = R(t.maxBreaks, 1, 200, 24), s = ln(e, {
    ...t,
    maxSwings: Math.max(n, r * 4)
  }), i = [], o = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  let c = 0, l = null, u = null, d = "neutral";
  for (let h = 0; h < e.length; h += 1) {
    const y = j(e, h);
    for (; c < s.length && s[c].index < h && s[c].knownAt <= y; ) {
      const w = s[c];
      w.kind === "SwingHigh" ? l = w : u = w, c += 1;
    }
    const p = e[h];
    if (l && !o.has(l.x) && p.c > l.price) {
      const w = d === "bearish" ? "StructureShift" : "StructureBreak";
      i.push(We(w, "bullish", h, p, l, y)), o.add(l.x), d = "bullish";
    }
    if (u && !a.has(u.x) && p.c < u.price) {
      const w = d === "bullish" ? "StructureShift" : "StructureBreak";
      i.push(We(w, "bearish", h, p, u, y)), a.add(u.x), d = "bearish";
    }
  }
  const f = s.slice(-n), m = i.slice(-r);
  return {
    swings: f,
    breaks: m,
    trend: d,
    summary: qe(f, m, d)
  };
}
function wi(e) {
  var s;
  const { swings: t, summary: n } = e;
  if (!t.length || n.state === "neutral") return [];
  if (n.state === "range")
    return [
      Ye(t, "SwingHigh", "rangeHigh", null, !0),
      Ye(t, "SwingLow", "rangeLow", null, !1)
    ].filter((i) => !!i);
  const r = n.state === "transitional" ? n.transitionDirection ?? ((s = n.lastBreak) == null ? void 0 : s.direction) ?? e.trend : n.state;
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
function Ai(e, t = {}) {
  var c, l;
  const n = R(t.lookback, 20, 1e3, 240), r = R(t.pivotStrength, 1, 20, 3), s = R(t.maxZones, 1, 12, 6), i = I(t.thicknessBps, 1, 100, 10), o = ((c = e[e.length - 1]) == null ? void 0 : c.x) ?? 0, a = ce(e, {
    lookback: n,
    pivotStrength: r,
    atrPeriod: t.atrPeriod,
    minMoveAtr: t.minMoveAtr ?? 0,
    maxSwings: Math.min(500, n),
    maxBreaks: 24
  });
  return un(a.swings, {
    maxZones: s,
    thicknessBps: i,
    latestX: o,
    referencePrice: t.referencePrice ?? ((l = e[e.length - 1]) == null ? void 0 : l.c) ?? null,
    zonesPerSide: t.zonesPerSide
  });
}
function un(e, t = {}) {
  var l;
  const n = R(t.maxZones, 1, 12, 6), r = I(t.thicknessBps, 1, 100, 10), s = t.latestX ?? ((l = e[e.length - 1]) == null ? void 0 : l.x) ?? 0, i = b(t.referencePrice), o = t.zonesPerSide == null ? null : R(t.zonesPerSide, 1, 12, 3), a = [];
  for (const u of e)
    qn(
      a,
      u.kind === "SwingHigh" ? "resistance" : "support",
      u,
      s - u.x + 1,
      r
    );
  const c = a.filter((u) => Number.isFinite(u.center) && u.high > u.low).sort((u, d) => d.score - u.score || d.touches - u.touches || d.lastX - u.lastX).slice(0, Math.max(n * 2, n));
  return $n(c, n, i, o);
}
function fn(e, t) {
  const n = new Map(
    t.filter((o) => M(o.c)).map((o) => [o.bucket, o])
  );
  let r = null, s = null;
  const i = [];
  for (const o of e) {
    if (!M(o.c)) continue;
    const a = n.get(o.bucket);
    if (!a || !M(a.c)) continue;
    (r == null || s == null) && (r = o.c, s = a.c);
    const c = o.c / r / (a.c / s);
    i.push(o.x, (c - 1) * 100);
  }
  return new Float32Array(i);
}
function ki(e, t, n = {}) {
  var P;
  const r = R(n.maxDivergences, 1, 100, 16), s = I(n.minDeltaPct, 0, 50, 0.5), i = R(
    n.maxAgeBars,
    1,
    2e3,
    n.lookback ?? 240
  ), o = n.includeDivergences ?? !0, a = n.includeLeads ?? !0, c = n.includeBreaks ?? !0, l = fn(e, t), u = Gn(l);
  if (!e.length || u.size < 2) return [];
  const f = (((P = e[e.length - 1]) == null ? void 0 : P.x) ?? 0) - i, m = {
    ...n,
    maxSwings: Math.max(n.maxSwings ?? 120, r * 4),
    maxBreaks: Math.max(n.maxBreaks ?? 24, r * 2)
  }, h = ce(e, {
    ...m
  }), y = Ln(e, l), p = ce(y, {
    ...m
  }), w = new Map(e.map((g, v) => [g.x, { candle: g, index: v }])), E = [];
  let A = null, T = null;
  for (const g of h.swings) {
    const v = u.get(g.x);
    if (!(v == null || !Number.isFinite(v))) {
      if (g.kind === "SwingHigh") {
        if (A) {
          const k = u.get(A.x);
          k != null && Number.isFinite(k) && (g.price > A.price && v <= k - s ? o && E.push(
            ye(
              "bearishHigh",
              "divergence",
              "bearish",
              "RS DIV ↓",
              g,
              A,
              v,
              k,
              h.summary.state,
              p.summary.state
            )
          ) : g.price < A.price && v >= k + s && a && E.push(
            ye(
              "bullishHigh",
              "lead",
              "bullish",
              "RS LEAD ↑",
              g,
              A,
              v,
              k,
              h.summary.state,
              p.summary.state
            )
          ));
        }
        A = g;
        continue;
      }
      if (T) {
        const k = u.get(T.x);
        k != null && Number.isFinite(k) && (g.price > T.price && v <= k - s ? a && E.push(
          ye(
            "bearishLow",
            "lead",
            "bearish",
            "RS LEAD ↓",
            g,
            T,
            v,
            k,
            h.summary.state,
            p.summary.state
          )
        ) : g.price < T.price && v >= k + s && o && E.push(
          ye(
            "bullishLow",
            "divergence",
            "bullish",
            "RS DIV ↑",
            g,
            T,
            v,
            k,
            h.summary.state,
            p.summary.state
          )
        ));
      }
      T = g;
    }
  }
  if (c)
    for (const g of p.breaks) {
      if (g.x < f) continue;
      const v = w.get(g.x), k = u.get(g.x);
      if (!v || k == null || !Number.isFinite(k)) continue;
      const F = ce(e.slice(0, v.index + 1), {
        ...m,
        maxBreaks: Math.max(8, n.maxBreaks ?? 24)
      });
      Bn(g.direction, F.summary.state) && E.push(
        On(
          g.direction === "bearish" ? "bearishBreak" : "bullishBreak",
          g.direction,
          g.direction === "bearish" ? "RS BREAK ↓" : "RS BREAK ↑",
          v.index,
          v.candle,
          k,
          g,
          F.summary.state,
          p.summary.state
        )
      );
    }
  return E.filter((g) => g.x >= f).sort((g, v) => g.x - v.x || Xe(g.signal) - Xe(v.signal)).slice(-r);
}
function Ri(e) {
  return new Uint8Array(e.buffer);
}
function Be(e) {
  return {
    returnPct: b(e == null ? void 0 : e.returnPct),
    percentile: b(e == null ? void 0 : e.percentile),
    zScore: b(e == null ? void 0 : e.zScore),
    atrExtension: b(e == null ? void 0 : e.atrExtension)
  };
}
function De(e) {
  return {
    returnPct: b(e.returnPct),
    percentile: b(e.percentile),
    zScore: b(e.zScore),
    atrExtension: b(e.atrExtension)
  };
}
function fe(e) {
  const t = Be(e);
  return t.returnPct != null && t.returnPct >= oe.returnPct || t.percentile != null && t.percentile >= oe.percentile || t.zScore != null && t.zScore >= oe.zScore || t.atrExtension != null && t.atrExtension >= oe.atrExtension;
}
function dn(e, t) {
  const n = [], r = R(t.minSamples, 1, 1e4, 20), s = e[e.length - 1] ?? null;
  return s ? s.rollingReturnCount < r && n.push(
    `Rolling-return history has ${s.rollingReturnCount}/${r} samples for percentile and Z-score`
  ) : n.push("No candle history was available at the requested asOf time"), n;
}
function se(e, t, n) {
  return {
    from: e,
    to: t,
    knownAt: n.knownAt,
    evidenceIds: [n.id],
    evidenceCodes: [n.code],
    explanation: n.explanation
  };
}
function mn(e, t, n, r, s) {
  if (e === "notCandidate") return "No active Impulse Fade v1 candidate";
  if (e === "invalidated") return r ?? "Continuation invalidated the fade setup";
  if (e === "expired") return s ?? "Candidate expired before progressing";
  const i = n[n.length - 1];
  if (i && i.to === e) return i.explanation;
  const o = t.filter((c) => c.contributesTo === e), a = o[o.length - 1];
  return (a == null ? void 0 : a.explanation) ?? ke(e);
}
function yt(e, t) {
  switch (e) {
    case "developing":
      return [
        "Post-detection RS weakness, AVWAP failed reclaim, or bearish structure break"
      ];
    case "deteriorating":
      return ["Confirmed bearish structure break on the execution timeframe"];
    case "waitingForRetest":
      return [
        t ? `Retest ${$(t.level)} and confirm bearish rejection` : "Retest the broken structure level and confirm bearish rejection"
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
function hn(e) {
  return [
    e.setupFamily,
    e.symbol,
    e.source,
    e.venue,
    e.executionTimeframe,
    String(e.detectedAt)
  ].map((t) => String(t || "na").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function G(e, t, n, r, s) {
  return [e, t, n, r, s ?? ""].map((i) => String(i).toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")).join(":");
}
function gt(e, t, n, r) {
  let s = null;
  for (let i = 0; i < e.length; i += 1) {
    const o = e[i], a = V(o);
    a < t || j(e, i, r) > n || Number.isFinite(o.h) && (!s || o.h > s.price) && (s = { price: o.h, eventTime: a });
  }
  return s;
}
function vn(e, t) {
  return e.length ? j(e, e.length - 1, t) : null;
}
function He(e, t, n) {
  for (let r = e.length - 1; r >= 0; r -= 1)
    if (j(e, r, n) <= t)
      return { candle: e[r], index: r };
  return null;
}
function V(e) {
  const t = b(e.ts);
  return t ?? b(e.bucket) ?? 0;
}
function j(e, t, n) {
  const r = e[t];
  return r ? n != null && String(n).trim() !== "chart" ? z(r, n) : (b(r.bucket) ?? V(r)) + yn(e, t) : 0;
}
function yn(e, t) {
  var i, o, a;
  const n = b((i = e[t]) == null ? void 0 : i.bucket) ?? V(e[t]), r = b((o = e[t + 1]) == null ? void 0 : o.bucket);
  if (r != null && r > n) return r - n;
  const s = b((a = e[t - 1]) == null ? void 0 : a.bucket);
  return s != null && n > s ? n - s : 1;
}
function x(e) {
  return b(e.knownAt) ?? b(e.eventTime) ?? b(e.ts) ?? b(e.bucket) ?? 0;
}
function ae(e, t, n) {
  const r = x(e), s = b(e.eventTime) ?? b(e.ts) ?? b(e.bucket) ?? r;
  return r > t.knownAt && r <= n && s >= t.knownAt;
}
function gn(e) {
  return e.state === "transitional" && e.transitionDirection ? `Transitional ${e.transitionDirection}` : e.state;
}
function pn(e) {
  const t = Math.max(0, Math.round(e));
  return t >= 86400 ? `${Math.round(t / 86400)}d` : t >= 3600 ? `${Math.round(t / 3600)}h` : t >= 60 ? `${Math.round(t / 60)}m` : `${t}s`;
}
function M(e) {
  return Number.isFinite(e) && e > 0;
}
function bn(e) {
  const t = b(e == null ? void 0 : e.returnPct), n = b(e == null ? void 0 : e.percentile), r = b(e == null ? void 0 : e.zScore), s = b(e == null ? void 0 : e.atrExtension), i = [
    t == null ? null : `24h ${le(t, 1)}%`,
    s == null ? null : `Ext ${le(s, 1)} ATR`,
    r == null ? null : `Z ${le(r, 1)}`,
    n == null ? null : `Pctl ${Math.round(n)}`
  ].filter((a) => !!a);
  return {
    key: "extension",
    label: "Extension",
    status: fe({ returnPct: t, percentile: n, zScore: r, atrExtension: s }) ? "pass" : "pending",
    detail: i.join(" | ") || "No extension context yet"
  };
}
function Sn(e, t, n) {
  const r = Ve(e, t, n);
  return r ? {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pass",
    detail: `R ${$(r.low)}-${$(r.high)} strength ${r.strength.toFixed(1)}`
  } : {
    key: "htfResistance",
    label: "HTF resistance",
    status: "pending",
    detail: "No nearby resistance zone"
  };
}
function wn(e) {
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
function An(e) {
  const t = (e == null ? void 0 : e.state) === "bearish" || (e == null ? void 0 : e.state) === "transitional" && e.transitionDirection === "bearish";
  return {
    key: "structureShift",
    label: "Structure shift",
    status: t ? "pass" : "pending",
    detail: t ? e.state === "bearish" ? "Bearish structure" : "Bearish transition" : "No bearish structure shift"
  };
}
function kn(e, t) {
  const n = [...e].reverse().find((i) => i.kind === "loss" || i.kind === "failedReclaim"), r = b(t);
  return {
    key: "avwapFailure",
    label: "AVWAP failure",
    status: !!n || r != null && r <= -0.2 ? "pass" : "pending",
    detail: (n == null ? void 0 : n.label) ?? (r == null ? "No AVWAP failure" : `AVWAP ${le(r, 1)}%`)
  };
}
function Rn(e, t, n, r) {
  var c;
  const s = b((c = e == null ? void 0 : e.lastBreak) == null ? void 0 : c.level), i = s != null && n != null && En(n, s) <= r, o = Ve(t, n, r);
  return {
    key: "retest",
    label: "Retest",
    status: !!(i || o) ? "pass" : "pending",
    detail: i ? `Retesting ${$(s)}` : o ? `Near R ${$(o.center)}` : "No retest yet"
  };
}
function Tn(e, t, n, r) {
  var i;
  if (e.status !== "pass" || t.status !== "pass" || (n == null ? void 0 : n.state) !== "bullish" || r == null) return !1;
  const s = b((i = n.lastSwingHigh) == null ? void 0 : i.price);
  return s != null && r > s * 1.01;
}
function Ge(e, t) {
  return e.status === "pass" || t.some((n) => n.summary.state !== "neutral");
}
function Ve(e, t, n) {
  return t == null || !M(t) ? null : e.filter((r) => r.kind === "resistance").map((r) => ({
    zone: r,
    distance: t >= r.low && t <= r.high ? 0 : t < r.low ? (r.low - t) / t * 100 : (t - r.high) / t * 100
  })).filter((r) => r.distance <= n).sort((r, s) => r.distance - s.distance || s.zone.strength - r.zone.strength).map((r) => r.zone)[0] ?? null;
}
function En(e, t) {
  return !M(e) || !M(t) ? 1 / 0 : Math.abs((e / t - 1) * 100);
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
function xn(e, t) {
  if (e === "notCandidate") return "Waiting for extension context";
  if (e === "invalidated") return "Continuation invalidated the fade setup";
  if (e === "expired") return "Candidate expired before progressing";
  const n = t.filter((r) => r.status === "pass").map((r) => r.label);
  return n.length ? n.join(" + ") : ke(e);
}
function le(e, t = 1) {
  return `${e > 0 ? "+" : ""}${e.toFixed(t)}`;
}
function $(e) {
  const t = Math.abs(e);
  return t >= 1e3 ? e.toFixed(0) : t >= 1 ? e.toFixed(3).replace(/\.?0+$/, "") : e.toFixed(6).replace(/\.?0+$/, "");
}
function b(e) {
  return e == null || !Number.isFinite(e) ? null : Number(e);
}
function W(e) {
  return e[e.length - 1];
}
function pt(e) {
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    if (M(n.c)) return n;
  }
  return null;
}
function Pn(e) {
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
function bt(e, t, n) {
  const r = Math.min(e.length - 1, Math.max(0, n - 1));
  let s = null;
  for (let i = r; i >= 0; i -= 1) {
    const o = e[i];
    if (o.bucket <= t && M(o.c)) {
      s = o;
      break;
    }
  }
  return s;
}
function Cn(e, t) {
  const n = [];
  for (let r = 1; r < e.length; r += 1) {
    const s = e[r];
    if (s.bucket < t.earliestBucket || s.bucket >= t.excludeBucket || !M(s.c)) continue;
    const i = bt(e, s.bucket - t.windowSeconds, r);
    !i || !M(i.c) || n.push((s.c / i.c - 1) * 100);
  }
  return n;
}
function Nn(e, t) {
  if (!e.length || !Number.isFinite(t)) return null;
  const n = e.filter(Number.isFinite);
  if (!n.length) return null;
  const r = n.filter((i) => i < t).length, s = n.filter((i) => i === t).length;
  return (r + s * 0.5) / n.length * 100;
}
function In(e, t) {
  const n = e.filter(Number.isFinite);
  if (n.length < 2 || !Number.isFinite(t)) return null;
  const r = n.reduce((o, a) => o + a, 0) / n.length, s = n.reduce((o, a) => o + (a - r) ** 2, 0) / (n.length - 1), i = Math.sqrt(s);
  return i > 0 ? (t - r) / i : null;
}
function Ee(e, t, n, r, s) {
  return {
    kind: e,
    label: e === "loss" ? "AVWAP loss" : e === "reclaim" ? "AVWAP reclaim" : "Failed AVWAP reclaim",
    index: t,
    x: n.x,
    ts: n.ts,
    bucket: n.bucket,
    price: n.c,
    vwap: r,
    eventTime: V(n),
    knownAt: s
  };
}
function _n(e, t) {
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
function Mn(e, t) {
  const n = Number(e.v_base);
  if (Number.isFinite(n) && n > 0) return n;
  const r = Number(e.v_quote);
  return Number.isFinite(r) && r > 0 && t > 0 ? r / t : 0;
}
function Qe(e, t, n, r, s, i) {
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
    eventTime: V(n),
    knownAt: i
  };
}
function Fn(e) {
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
function We(e, t, n, r, s, i) {
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
    eventTime: V(r),
    knownAt: i
  };
}
function ye(e, t, n, r, s, i, o, a, c, l) {
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
function On(e, t, n, r, s, i, o, a, c) {
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
function Ln(e, t) {
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
function Bn(e, t) {
  return e === "bearish" ? t === "bullish" || t === "transitional" : t === "bearish" || t === "transitional";
}
function Xe(e) {
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
  const r = t[t.length - 1] ?? null, s = Ie(e, "SwingHigh"), i = Ie(e, "SwingLow"), o = e[e.length - 1] ?? null, a = Dn(t), c = e.length === 0 ? "neutral" : r == null || a ? "range" : r.kind === "StructureShift" ? "transitional" : r.direction, l = c === "transitional" ? (r == null ? void 0 : r.direction) ?? null : null;
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
function ge(e, t, n, r, s) {
  for (let o = e.length - 1; o >= 0; o -= 1) {
    const a = e[o];
    if (a.kind === t && n.includes(a.structure))
      return Ne(r, s, a);
  }
  const i = Ie(e, t);
  return i ? Ne(r, s, i) : null;
}
function Ye(e, t, n, r, s) {
  let i = null;
  for (const o of e)
    o.kind === t && (!i || (s ? o.price > i.price : o.price < i.price)) && (i = o);
  return i ? Ne(n, r, i) : null;
}
function Ne(e, t, n) {
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
function Dn(e) {
  const t = e.slice(-5).filter((n) => n.kind === "StructureShift");
  if (t.length < 3) return !1;
  for (let n = 1; n < t.length; n += 1)
    if (t[n].direction === t[n - 1].direction)
      return !1;
  return !0;
}
function Ie(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1) {
    const r = e[n];
    if (r.kind === t) return r;
  }
  return null;
}
function Hn(e, t) {
  return e.kind === "SwingHigh" ? e.price > t.price : e.price < t.price;
}
function Vn(e, t, n) {
  const r = e.atr != null && Number.isFinite(e.atr) ? e.atr : t.atr != null && Number.isFinite(t.atr) ? t.atr : 0;
  return Math.max(0, r * n);
}
function Re(e, t) {
  const n = ee(t), r = Array(e.length).fill(null);
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
function qn(e, t, n, r, s) {
  const i = n.price;
  if (!Number.isFinite(i) || i <= 0) return;
  const o = Math.max(i * (s / 1e4), Number.EPSILON), a = i - o, c = i + o, l = 1 / Math.max(1, r), u = e.find(
    (m) => m.kind === t && jn(m.low, m.high, a, c)
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
function $n(e, t, n, r) {
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
function Un(e, t, n) {
  const r = e[t].h;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].h >= r || e[t + s].h > r) return !1;
  return !0;
}
function zn(e, t, n) {
  const r = e[t].l;
  if (!Number.isFinite(r)) return !1;
  for (let s = 1; s <= n; s += 1)
    if (e[t - s].l <= r || e[t + s].l < r) return !1;
  return !0;
}
function jn(e, t, n, r) {
  return e <= r && n <= t;
}
function Gn(e) {
  const t = /* @__PURE__ */ new Map();
  for (let n = 0; n < e.length; n += 2) {
    const r = e[n], s = e[n + 1];
    Number.isFinite(r) && Number.isFinite(s) && t.set(r, s);
  }
  return t;
}
function _e(e, t) {
  const n = ee(t), r = Array(e.length).fill(null);
  if (e.length < n) return r;
  const s = 2 / (n + 1);
  let i = 0;
  for (let o = 0; o < n; o++) i += e[o].c;
  i /= n, r[n - 1] = i;
  for (let o = n; o < e.length; o++)
    i = (e[o].c - i) * s + i, r[o] = i;
  return r;
}
function Qn(e, t) {
  const n = ee(t);
  if (e.length < n) return [];
  const r = [], s = 2 / (n + 1);
  let i = 0;
  for (let o = 0; o < n; o++) i += e[o].value;
  i /= n, r.push({ x: e[n - 1].x, value: i });
  for (let o = n; o < e.length; o++)
    i = (e[o].value - i) * s + i, r.push({ x: e[o].x, value: i });
  return r;
}
function St(e, t) {
  const n = ee(t);
  if (e.length <= n) return [];
  let r = 0, s = 0;
  for (let o = 1; o <= n; o++) {
    const a = e[o].c - e[o - 1].c;
    a >= 0 ? r += a : s += Math.abs(a);
  }
  r /= n, s /= n;
  const i = [
    { x: e[n].x, value: Ke(r, s) }
  ];
  for (let o = n + 1; o < e.length; o++) {
    const a = e[o].c - e[o - 1].c, c = Math.max(0, a), l = Math.max(0, -a);
    r = (r * (n - 1) + c) / n, s = (s * (n - 1) + l) / n, i.push({ x: e[o].x, value: Ke(r, s) });
  }
  return i;
}
function Ze(e, t) {
  if (e.length < t) return [];
  const n = [];
  let r = 0;
  return e.forEach((s, i) => {
    r += s.value, i >= t && (r -= e[i - t].value), i >= t - 1 && n.push({ x: s.x, value: r / t });
  }), n;
}
function J(e) {
  const t = [];
  for (const n of e)
    t.push(n.x, n.value);
  return new Float32Array(t);
}
function Ke(e, t) {
  return t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t);
}
function ee(e) {
  const t = Math.floor(Number(e));
  return Number.isFinite(t) ? Math.max(1, t) : 1;
}
function R(e, t, n, r) {
  return Math.floor(I(e, t, n, r));
}
function I(e, t, n, r) {
  const s = Number(e);
  return Number.isFinite(s) ? Math.max(t, Math.min(n, s)) : r;
}
const Wn = "strategy-profile.1", wt = "decision-snapshot.1", Xn = "impulse_fade_v1.research.default", Yn = "1";
function At(e) {
  const { profileHash: t, ...n } = e;
  return _(n);
}
function Zn(e) {
  if (de(e.createdAt, "createdAt"), e.setupFamily !== Q || e.lifecycleVersion !== U || e.side !== "short")
    throw new RangeError("This core currently supports only the short Impulse Fade v1 profile");
  if (!e.id.trim() || !e.version.trim() || !e.lifecycleConfigHash.trim())
    throw new TypeError("Profile id, version, and lifecycleConfigHash are required");
  for (const [s, i] of Object.entries(e.timeframeRoles))
    if (s === "contextTimeframes") {
      if (!i.every((o) => o.trim()))
        throw new TypeError("Context timeframes cannot contain blank values");
    } else if (i != null && !i.trim())
      throw new TypeError(`${s} cannot be blank`);
  if (Je(e.riskPolicy.maximumAccountRiskFraction, "maximum account risk"), Je(
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
    profileHash: At(r)
  });
}
function Kn(e = {}) {
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
  return Zn({
    schemaVersion: Wn,
    id: e.id ?? Xn,
    version: e.version ?? Yn,
    name: e.name ?? "Impulse Fade v1 research default",
    setupFamily: Q,
    lifecycleVersion: U,
    lifecycleConfigHash: e.lifecycleConfigHash ?? re(),
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
const Jn = Kn();
function Ti(e) {
  if (!e.id.trim()) throw new TypeError("Decision reference id is required");
  if (sr(e.price, "reference price"), de(e.eventTime, "reference eventTime"), de(e.knownAt, "reference knownAt"), e.knownAt < e.eventTime)
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
function Ei(e) {
  var i, o, a, c;
  if (de(e.decisionTime, "decisionTime"), de(e.effectiveAsOf, "effectiveAsOf"), e.effectiveAsOf > e.decisionTime)
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
  ir([
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
  const n = tr(
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
    snapshotSchemaVersion: wt,
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
    lifecycleEvidence: Pe(e.lifecycle.evidence, e.effectiveAsOf),
    pendingConditions: [...e.lifecycle.pendingConditions],
    candidateMetrics: n,
    structureByTimeframe: nr(e.structureByTimeframe, e.effectiveAsOf),
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
  }, s = kt(r);
  return N({ ...r, id: s });
}
function kt(e) {
  const { id: t, ...n } = e;
  return `decision-snapshot:${_(n).slice(8)}`;
}
function er(e) {
  const t = [
    ...e.activeStructureLevels,
    ...e.supportResistanceZones,
    ...e.visibleOrSelectedReferenceLevels,
    ...e.avwapState ? [e.avwapState.reference] : []
  ], n = /* @__PURE__ */ new Map();
  for (const r of t) {
    const s = n.get(r.id);
    if (s && B(s) !== B(r))
      throw new RangeError(`Conflicting decision reference id ${r.id}`);
    n.set(r.id, r);
  }
  return [...n.values()];
}
function tr(e, t, n, r) {
  return !e || e.effectiveAsOf == null || e.effectiveAsOf > t || e.symbol.toUpperCase() !== n.toUpperCase() || e.marketType.toLowerCase() !== "perp" || r != null && e.source !== r.source || r != null && r.venue && e.exchange.toLowerCase() !== r.venue.toLowerCase() ? null : e;
}
function nr(e, t) {
  return Object.fromEntries(
    Object.entries(e).sort(([n], [r]) => n.localeCompare(r)).map(([n, r]) => [
      n,
      rr(r) <= t ? r : null
    ])
  );
}
function xe(e, t) {
  return e.filter((n) => n.knownAt <= t).sort((n, r) => n.knownAt - r.knownAt || n.id.localeCompare(r.id));
}
function Pe(e, t) {
  return e.filter((n) => n.knownAt <= t).sort(
    (n, r) => n.knownAt - r.knownAt || n.eventTime - r.eventTime || _(n).localeCompare(_(r))
  );
}
function rr(e) {
  var t, n, r;
  return e ? Math.max(
    e.updatedTs ?? -1 / 0,
    ((t = e.lastBreak) == null ? void 0 : t.knownAt) ?? -1 / 0,
    ((n = e.lastSwingHigh) == null ? void 0 : n.knownAt) ?? -1 / 0,
    ((r = e.lastSwingLow) == null ? void 0 : r.knownAt) ?? -1 / 0
  ) : -1 / 0;
}
function ir(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const r = t.get(n.id);
    if (r && B(r) !== B(n))
      throw new RangeError(`Conflicting decision reference id ${n.id}`);
    t.set(n.id, n);
  }
}
function de(e, t) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${t} must be a non-negative finite Unix timestamp`);
}
function sr(e, t) {
  if (!Number.isFinite(e) || e <= 0)
    throw new RangeError(`${t} must be a positive finite number`);
}
function Je(e, t) {
  if (!Number.isFinite(e) || e <= 0 || e > 1)
    throw new RangeError(`${t} must be in (0, 1]`);
}
const Rt = "radar-selection-profile.1", or = "radar-episode.1", ar = "replay-case-manifest.1", cr = "radar-metric-observation.1", lr = "radar-scan-result.1", ur = "radar-episode-status.1", fr = "execution-venue-eligibility.1";
function Tt(e) {
  const { canonicalConfigHash: t, ...n } = e;
  return _(n);
}
function dr(e) {
  return Lr(e), N({
    ...e,
    canonicalConfigHash: Tt(e)
  });
}
const xi = dr({
  schemaVersion: Rt,
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
  sourcePolicy: { allowedSources: ["external", "local"] },
  executionVenuePolicy: { intendedVenue: "phemex", mode: "allowUnknown" },
  liquidityPolicy: {
    minimumQuoteNotional: 1e6,
    windowSeconds: 24 * 3600,
    missingData: "warn"
  },
  createdAt: 17e8
});
function Pi(e) {
  var a;
  Dr(e);
  const t = e.strategyProfile ?? Jn, n = /* @__PURE__ */ new Map(), r = [], s = [], i = [], o = [];
  for (const [c, l] of Object.entries(e.candlesBySymbolAndTimeframe).sort(
    ([u], [d]) => u.localeCompare(d)
  )) {
    const d = Pt(l.candlesByTimeframe[e.selectionProfile.scanTimeframe] ?? []).map((m) => z(m, e.selectionProfile.scanTimeframe)).filter((m) => m <= e.to).filter((m) => Or(m, e.selectionProfile)), f = {
      previousGate: !1,
      activeEpisode: null,
      blockedEpisode: null,
      falseSince: null,
      armed: !0
    };
    for (const m of d) {
      const h = m >= e.from, y = e.selectionProfile.moveDetectors.map(
        (g) => mr(g, l, m, e.selectionProfile.scanTimeframe)
      );
      if (h)
        for (const g of y)
          for (const v of g.observations)
            n.set(v.observationId, v);
      const p = Mr(
        y.map((g) => g.result.passed),
        e.selectionProfile.detectorCombination
      ), w = Ar(
        l,
        m,
        e.selectionProfile,
        e.venueEligibilityHistory ?? []
      ), E = wr(
        l,
        m,
        e.selectionProfile,
        y,
        w,
        e.universeHistory ?? []
      ), A = E.every((g) => g.passed), T = p && A, P = Tr(
        l,
        m,
        y.map((g) => g.result),
        E,
        p,
        A,
        T
      );
      if (h && r.push(P), f.activeEpisode && m >= f.activeEpisode.activeUntil && (h && i.push(
        Ce(f.activeEpisode, m, "expired", "maximumAgeElapsed", "blockedUntilReset")
      ), f.activeEpisode = null), T ? f.falseSince = null : (f.falseSince ?? (f.falseSince = m), !f.armed && m - f.falseSince >= e.selectionProfile.resetPolicy.minimumFalseDurationSeconds && (h && f.blockedEpisode && i.push(
        Ce(f.blockedEpisode, m, "reset", "radarGateReset", "armed")
      ), f.activeEpisode = null, f.blockedEpisode = null, f.armed = !0)), T && !f.previousGate && f.armed) {
        const g = pr({
          series: l,
          asOf: m,
          profile: e.selectionProfile,
          detectorEvaluations: y,
          venueEligibility: w,
          lifecycleHistory: ((a = e.lifecycleHistory) == null ? void 0 : a[c]) ?? []
        });
        if (h) {
          s.push(g), i.push(
            Ce(g, m, "active", "detected", "blockedUntilReset")
          );
          const v = br(g, l, e.selectionProfile, t);
          o.push(v);
          for (const k of g.contextObservations)
            n.set(k.observationId, k);
        }
        f.activeEpisode = g, f.blockedEpisode = g, f.armed = !1;
      }
      f.previousGate = T;
    }
  }
  return N({
    schemaVersion: lr,
    selectionProfileRef: Mt(e.selectionProfile),
    from: e.from,
    to: e.to,
    observations: [...n.values()].sort(It),
    gateEvaluations: r.sort(Vr),
    episodes: s.sort(qr),
    episodeStatusObservations: i.sort($r),
    replayCaseManifests: o.sort((c, l) => c.id.localeCompare(l.id))
  });
}
function mr(e, t, n, r) {
  return e.type === "rollingTroughRunup" ? hr(e, t, n, r) : e.type === "elapsedWindowReturn" ? vr(e, t, n, r) : e.type === "maximumWindowReturn" ? yr(e, t, n, r) : gr(e, t, n);
}
function hr(e, t, n, r) {
  const s = X(t.candlesByTimeframe[r] ?? [], r, n), i = s.at(-1) ?? null, a = (i ? s.filter(
    (p) => p.bucket >= i.bucket - e.lookbackSeconds && p.bucket <= i.bucket && i.bucket - p.bucket <= e.maximumTroughAgeSeconds
  ) : []).reduce((p, w) => O(w.c) && (!p || w.c < p.c || w.c === p.c && w.bucket < p.bucket) ? w : p, null), c = i && a && O(a.c) ? (i.c / a.c - 1) * 100 : null, l = xr(s, i, e), u = Ct(l, c, e.minimumSampleCount), d = [];
  i || d.push(D("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), a || d.push(D("NO_ELIGIBLE_TROUGH", "error", "No eligible completed-close trough exists"));
  const f = _(e), m = ie({
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
    historyCandles: Ue(s, i, e.historyLookbackSeconds + e.lookbackSeconds),
    configHash: f,
    notes: [...d, ...u.notes]
  }), h = c != null && c + 1e-12 >= e.minimumRunupPct && ue(m.percentile, e.minimumPercentile) && ue(m.zScore, e.minimumZScore) && m.sampleCount >= e.minimumSampleCount, y = a ? kr(t, n, a, m) : null;
  return {
    result: Te(
      e,
      h,
      [m],
      h ? m.observationId : null,
      c == null ? "Run-up unavailable" : `Completed-close run-up ${we(c)} versus ${we(e.minimumRunupPct)} minimum`
    ),
    observations: [m],
    anchor: y
  };
}
function vr(e, t, n, r) {
  const s = Et(e, t, n, r), i = Nt(s, e);
  return {
    result: Te(
      e,
      i,
      [s],
      i ? s.observationId : null,
      s.value == null ? "Elapsed return unavailable" : `${Ft(e.windowSeconds)} return ${we(s.value)}`
    ),
    observations: [s],
    anchor: null
  };
}
function yr(e, t, n, r) {
  const s = [...new Set(e.windowsSeconds)].sort((u, d) => u - d).map(
    (u) => Et(
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
  ), i = s.filter((u) => u.value != null).sort(
    (u, d) => (d.value ?? -1 / 0) - (u.value ?? -1 / 0) || (u.window ?? 1 / 0) - (d.window ?? 1 / 0)
  )[0] ?? null, o = X(t.candlesByTimeframe[r] ?? [], r, n), a = ie({
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
    historyCandles: Ue(
      o,
      o.at(-1) ?? null,
      e.historyLookbackSeconds + Math.max(...e.windowsSeconds)
    ),
    configHash: _(e),
    notes: i ? i.dataQualityNotes : [D("NO_WINDOW_RETURN_AVAILABLE", "error", "No configured elapsed window has a reference")]
  }), c = Nt(a, e), l = [...s, a];
  return {
    result: Te(
      e,
      c,
      l,
      c ? (i == null ? void 0 : i.observationId) ?? null : null,
      (i == null ? void 0 : i.value) == null ? "Maximum elapsed return unavailable" : `Winning ${Ft(i.window ?? 0)} return ${we(i.value)}`
    ),
    observations: l,
    anchor: null
  };
}
function gr(e, t, n) {
  const r = e.analysisTimeframe, s = X(t.candlesByTimeframe[r] ?? [], r, n), i = s.at(-1) ?? null, o = Pr(s, e.emaPeriod).at(-1) ?? null, a = Cr(s, e.atrPeriod).at(-1) ?? null, c = i && o != null && a != null && a > 0 ? (i.c - o) / a : null, l = Math.max(e.minimumSampleCount, e.emaPeriod, e.atrPeriod), u = [];
  i || u.push(D("NO_COMPLETED_CANDLE", "error", `No completed ${r} candle exists at cutoff`)), (s.length < l || c == null) && u.push(
    D(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `EMA/ATR displacement requires ${l} completed ${r} candles`
    )
  );
  const d = ie({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "ema_atr_displacement",
    metricVersion: "ema-atr-displacement.1",
    window: null,
    referenceTime: (i == null ? void 0 : i.bucket) ?? null,
    referenceValue: o,
    value: c,
    unit: "atr",
    percentile: null,
    zScore: null,
    sampleCount: s.length,
    historyCandles: s.slice(-l),
    configHash: _(e),
    notes: ze(u)
  }), f = c != null && s.length >= l && c + 1e-12 >= e.minimumAtrDisplacement;
  return {
    result: Te(
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
function Et(e, t, n, r) {
  const s = X(t.candlesByTimeframe[r] ?? [], r, n), i = s.at(-1) ?? null, o = i ? $e(s, i.bucket - e.windowSeconds) : null, a = i && o ? i.bucket - e.windowSeconds - o.bucket : null, c = a != null && e.maximumReferenceStalenessSeconds != null && a > e.maximumReferenceStalenessSeconds, l = i && o && !c && O(o.c) ? (i.c / o.c - 1) * 100 : null, u = Er(s, i, e), d = Ct(u, l, e.minimumSampleCount), f = [...d.notes];
  return i || f.push(D("NO_COMPLETED_CANDLE", "error", "No completed scan candle exists at cutoff")), o ? c && f.push(D("ELAPSED_REFERENCE_STALE", "error", "Elapsed-window reference exceeds allowed staleness")) : f.push(D("ELAPSED_REFERENCE_UNAVAILABLE", "error", "No completed elapsed-window reference exists")), ie({
    series: t,
    asOf: n,
    timeframe: r,
    metricCode: "elapsed_window_return",
    metricVersion: "elapsed-window-return.1",
    window: e.windowSeconds,
    referenceTime: (o == null ? void 0 : o.bucket) ?? null,
    referenceValue: (o == null ? void 0 : o.c) ?? null,
    value: l,
    unit: "percent",
    percentile: d.percentile,
    zScore: d.zScore,
    sampleCount: u.length,
    historyCandles: Ue(
      s,
      i,
      e.historyLookbackSeconds + e.windowSeconds
    ),
    configHash: _(e),
    notes: ze(f)
  });
}
function pr(e) {
  var E;
  const t = e.detectorEvaluations.filter((A) => A.result.passed), n = tt(
    t.flatMap(
      (A) => A.observations.filter(
        (T) => A.result.observationIds.includes(T.observationId)
      )
    )
  ), r = ((E = t.find((A) => A.anchor)) == null ? void 0 : E.anchor) ?? null, s = X(
    e.series.candlesByTimeframe[e.profile.scanTimeframe] ?? [],
    e.profile.scanTimeframe,
    e.asOf
  ), i = et(e.series, e.asOf, e.profile.scanTimeframe, 86400), o = et(e.series, e.asOf, e.profile.scanTimeframe, 172800), a = xt(e.series, e.asOf, e.profile), c = tt([
    ...n,
    i,
    o,
    a
  ]), l = t[0], u = l ? n.find(
    (A) => A.observationId === l.result.winningObservationId
  ) ?? n[0] ?? null : null, d = Sr(
    s,
    r,
    (l == null ? void 0 : l.result.detectorId) ?? "unknown",
    u,
    i,
    o,
    a
  ), f = Nr(e.lifecycleHistory, e.asOf), m = (f == null ? void 0 : f.candidate) ?? null, h = m ? Rr(
    m.id,
    "SetupCandidateEpisode",
    m.detectionEventTime,
    m.detectedAt,
    m
  ) : null, y = {
    schemaVersion: or,
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
    initialLifecycleCandidateId: (m == null ? void 0 : m.id) ?? null,
    initialLifecycleCandidateRef: h,
    initialLifecycleState: (f == null ? void 0 : f.state) ?? null,
    initialMtfStructure: {},
    activeUntil: e.asOf + e.profile.episodeExpiry.maximumAgeSeconds,
    terminalAt: null,
    terminalReason: null,
    rearmState: "blockedUntilReset",
    executionVenueEligibility: e.venueEligibility,
    dataQualityNotes: ze(c.flatMap((A) => A.dataQualityNotes))
  }, p = `radar-episode:${q({
    symbol: y.symbol,
    source: y.source,
    profileHash: y.selectionProfileHash,
    detectedAt: y.detectedAt,
    triggeringObservationIds: n.map((A) => A.observationId)
  })}`, w = { ...y, id: p, logicalObjectId: p };
  return N({
    ...w,
    observationId: `radar-episode-observation:${q(w)}`
  });
}
function br(e, t, n, r) {
  const s = Object.keys(t.candlesByTimeframe).sort(_t), i = Object.fromEntries(
    s.map((a) => {
      var l, u;
      const c = X(t.candlesByTimeframe[a] ?? [], a, e.detectedAt);
      return [
        a,
        {
          availableStart: ((l = c[0]) == null ? void 0 : l.bucket) ?? null,
          availableEnd: ((u = c.at(-1)) == null ? void 0 : u.bucket) ?? null,
          completedThrough: c.at(-1) ? z(c.at(-1), a) : null,
          completedCandleCount: c.length
        }
      ];
    })
  ), o = {
    schemaVersion: ar,
    radarEpisodeId: e.id,
    radarEpisodeObservationId: e.observationId,
    symbol: e.symbol,
    source: e.source,
    detectedAt: e.detectedAt,
    startAsOf: e.detectedAt,
    selectionProfileRef: Mt(n),
    lifecycleVersion: U,
    strategyProfileRef: {
      id: r.id,
      version: r.version,
      profileHash: r.profileHash
    },
    availableTimeframes: s,
    preRollRequirements: _r(n),
    dataCoverageByTimeframe: i,
    initialRadarObservations: e.contextObservations,
    initialLifecycleState: e.initialLifecycleState,
    executionVenueEligibility: e.executionVenueEligibility,
    dataQualityNotes: e.dataQualityNotes,
    futureOutcomeRef: null
  };
  return N({
    ...o,
    id: `replay-case:${q(o)}`
  });
}
function et(e, t, n, r) {
  const s = {
    id: `context-return-${r}`,
    type: "elapsedWindowReturn",
    windowSeconds: r,
    minimumReturnPct: null,
    minimumPercentile: null,
    minimumZScore: null,
    minimumSampleCount: 0,
    historyLookbackSeconds: r,
    maximumReferenceStalenessSeconds: null
  }, i = X(e.candlesByTimeframe[n] ?? [], n, t), o = i.at(-1) ?? null, a = o ? $e(i, o.bucket - r) : null, c = o && a && O(a.c) ? (o.c / a.c - 1) * 100 : null, l = c == null ? [D("ELAPSED_REFERENCE_UNAVAILABLE", "warning", `No completed ${r}-second reference exists`)] : [];
  return ie({
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
    configHash: _(s),
    notes: l
  });
}
function xt(e, t, n) {
  var d;
  const r = n.scanTimeframe, s = X(e.candlesByTimeframe[r] ?? [], r, t), i = s.at(-1) ?? null, o = i ? s.filter((f) => f.bucket > i.bucket - n.liquidityPolicy.windowSeconds) : [], a = o.map(
    (f) => Se(f.v_quote) ? f.v_quote : Se(f.v_base) ? f.v_base * f.c : null
  ), c = a.length > 0 && a.every((f) => f != null), l = c ? a.reduce((f, m) => f + (m ?? 0), 0) : null, u = {
    metric: "quote_notional",
    timeframe: r,
    windowSeconds: n.liquidityPolicy.windowSeconds
  };
  return ie({
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
    configHash: _(u),
    notes: c ? [] : [D("QUOTE_NOTIONAL_UNAVAILABLE", "warning", "Quote-notional history is incomplete")]
  });
}
function ie(e) {
  var o, a;
  const t = ((o = e.historyCandles[0]) == null ? void 0 : o.bucket) ?? null, n = ((a = e.historyCandles.at(-1)) == null ? void 0 : a.bucket) ?? null, r = _(
    e.historyCandles.map((c) => ({
      bucket: c.bucket,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      vBase: Se(c.v_base) ? c.v_base : null,
      vQuote: Se(c.v_quote) ? c.v_quote : null
    }))
  ), s = `radar-metric:${q({
    metricCode: e.metricCode,
    symbol: e.series.symbol,
    source: e.series.source,
    dataOrigin: e.series.dataOrigin ?? null,
    timeframe: e.timeframe,
    window: e.window,
    configHash: e.configHash
  })}`, i = {
    schemaVersion: cr,
    logicalObjectId: s,
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
  return N({
    ...i,
    observationId: `radar-observation:${q(i)}`
  });
}
function Sr(e, t, n, r, s, i, o) {
  const a = t ? e.find((h) => h.bucket === t.timestamp) ?? null : null, l = (a ? e.filter((h) => h.bucket <= a.bucket) : []).reduce((h, y) => O(y.c) && (!h || y.c > h.c || y.c === h.c && y.bucket < h.bucket) ? y : h, null), u = e.at(-1) ?? null, d = t && l && O(l.c) ? (t.price / l.c - 1) * 100 : null, f = t && l && u && l.c > t.price ? (u.c - t.price) / (l.c - t.price) : null, m = t && d != null && d < -5 ? ["rebound_after_drawdown"] : ["unknown"];
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
    contextTags: m
  };
}
function wr(e, t, n, r, s, i) {
  return n.hardGates.map((o) => {
    if (o === "sourcePolicy") {
      const u = n.sourcePolicy.allowedSources == null || n.sourcePolicy.allowedSources.includes(e.source);
      return { code: o, passed: u, explanation: u ? "Source allowed" : "Source excluded" };
    }
    if (o === "dataQuality") {
      const u = !r.some(
        (d) => d.observations.some(
          (f) => f.dataQualityNotes.some((m) => m.severity === "error")
        )
      );
      return { code: o, passed: u, explanation: u ? "Required metrics available" : "Required metric data unavailable" };
    }
    if (o === "executionVenueEligibility") {
      const u = Fr(s.status, n.executionVenuePolicy.mode);
      return { code: o, passed: u, explanation: `Execution venue ${s.status}` };
    }
    if (o === "selectedUniverse") {
      const u = Ir(i, e, t);
      return {
        code: o,
        passed: (u == null ? void 0 : u.included) === !0,
        explanation: u ? u.included ? "Symbol included" : "Symbol excluded" : "Historical universe membership unknown"
      };
    }
    const a = xt(e, t, n), c = n.liquidityPolicy.minimumQuoteNotional, l = c == null || a.value == null ? c == null || n.liquidityPolicy.missingData === "warn" : a.value >= c;
    return {
      code: o,
      passed: l,
      explanation: c == null ? "No minimum liquidity configured" : a.value == null ? "Quote-notional history unavailable" : `Quote notional ${a.value} versus ${c} minimum`
    };
  });
}
function Ar(e, t, n, r) {
  const s = n.executionVenuePolicy.intendedVenue ?? "ignored", i = [...r].filter(
    (a) => a.symbol.toUpperCase() === e.symbol.toUpperCase() && a.marketDataSource === e.source && a.executionVenue.toLowerCase() === s.toLowerCase() && a.knownAt <= t && a.effectiveFrom <= t && (a.effectiveTo == null || a.effectiveTo >= t)
  ).sort((a, c) => a.effectiveFrom - c.effectiveFrom || a.knownAt - c.knownAt).at(-1);
  if (i) return i;
  const o = {
    schemaVersion: fr,
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
      D(
        "EXECUTION_VENUE_HISTORY_UNAVAILABLE",
        "warning",
        "No point-in-time execution-venue eligibility observation was supplied"
      )
    ]
  };
  return N({
    ...o,
    observationId: `execution-venue-observation:${q(o)}`
  });
}
function kr(e, t, n, r) {
  const s = {
    logicalObjectId: `selection-anchor:${q({
      symbol: e.symbol,
      source: e.source,
      timestamp: n.bucket,
      price: n.c,
      referenceField: "close"
    })}`,
    timestamp: n.bucket,
    price: n.c,
    ageSeconds: Math.max(0, t - z(n, r.timeframe ?? "1h")),
    referenceField: "close",
    sourceObservationId: r.observationId
  };
  return N({
    ...s,
    observationId: `selection-anchor-observation:${q(s)}`
  });
}
function Ce(e, t, n, r, s) {
  const i = {
    schemaVersion: ur,
    logicalObjectId: e.id,
    episodeId: e.id,
    asOf: t,
    status: n,
    reason: r,
    rearmState: s
  };
  return N({
    ...i,
    observationId: `radar-status:${q(i)}`
  });
}
function Rr(e, t, n, r, s) {
  return N({
    logicalObjectId: e,
    observationId: `${t.toLowerCase()}-observation:${q({ logicalObjectId: e, knownAt: r, snapshot: s })}`,
    objectType: t,
    eventTime: n,
    knownAt: r
  });
}
function Tr(e, t, n, r, s, i, o) {
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
    id: `radar-gate:${q(a)}`
  });
}
function Te(e, t, n, r, s) {
  return {
    detectorId: e.id,
    detectorType: e.type,
    passed: t,
    observationIds: n.map((i) => i.observationId),
    winningObservationId: r,
    explanation: s
  };
}
function X(e, t, n) {
  return Pt(e).filter((r) => z(r, t) <= n);
}
function Pt(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of [...e].sort((r, s) => r.bucket - s.bucket || r.ts - s.ts))
    Hr(n) && t.set(n.bucket, n);
  return [...t.values()].sort((n, r) => n.bucket - r.bucket);
}
function $e(e, t) {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].bucket <= t) return e[n];
  return null;
}
function Er(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, s = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const o = $e(e, i.bucket - n.windowSeconds);
    if (!o || !O(o.c)) continue;
    const a = i.bucket - n.windowSeconds - o.bucket;
    n.maximumReferenceStalenessSeconds != null && a > n.maximumReferenceStalenessSeconds || s.push((i.c / o.c - 1) * 100);
  }
  return s;
}
function xr(e, t, n) {
  if (!t) return [];
  const r = t.bucket - n.historyLookbackSeconds, s = [];
  for (const i of e) {
    if (i.bucket < r || i.bucket >= t.bucket) continue;
    const o = e.filter(
      (a) => a.bucket <= i.bucket && a.bucket >= i.bucket - n.lookbackSeconds && i.bucket - a.bucket <= n.maximumTroughAgeSeconds && O(a.c)
    ).sort((a, c) => a.c - c.c || a.bucket - c.bucket)[0];
    o && s.push((i.c / o.c - 1) * 100);
  }
  return s;
}
function Ct(e, t, n) {
  const r = [];
  if (e.length < n && r.push(
    D(
      "INSUFFICIENT_METRIC_HISTORY",
      "error",
      `Metric requires ${n} historical samples but has ${e.length}`
    )
  ), t == null || e.length === 0 || e.length < n)
    return { percentile: null, zScore: null, notes: r };
  const s = e.filter((l) => l <= t).length / e.length * 100, i = e.reduce((l, u) => l + u, 0) / e.length, o = e.reduce((l, u) => l + (u - i) ** 2, 0) / e.length, a = Math.sqrt(o), c = a > 0 ? (t - i) / a : null;
  return { percentile: s, zScore: c, notes: r };
}
function Ue(e, t, n) {
  return t ? e.filter((r) => r.bucket >= t.bucket - n) : [];
}
function Nt(e, t) {
  return e.value != null && ue(e.value, t.minimumReturnPct) && ue(e.percentile, t.minimumPercentile) && ue(e.zScore, t.minimumZScore) && e.sampleCount >= t.minimumSampleCount;
}
function Pr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  let r = e.slice(0, t).reduce((i, o) => i + o.c, 0) / t;
  n[t - 1] = r;
  const s = 2 / (t + 1);
  for (let i = t; i < e.length; i += 1)
    r = e[i].c * s + r * (1 - s), n[i] = r;
  return n;
}
function Cr(e, t) {
  const n = new Array(e.length).fill(null);
  if (e.length < t) return n;
  const r = e.map((i, o) => {
    var c;
    const a = ((c = e[o - 1]) == null ? void 0 : c.c) ?? i.c;
    return Math.max(i.h - i.l, Math.abs(i.h - a), Math.abs(i.l - a));
  });
  let s = r.slice(0, t).reduce((i, o) => i + o, 0) / t;
  n[t - 1] = s;
  for (let i = t; i < r.length; i += 1)
    s = (s * (t - 1) + r[i]) / t, n[i] = s;
  return n;
}
function Nr(e, t) {
  return [...e].filter((n) => n.asOf != null && n.asOf <= t).sort((n, r) => (n.asOf ?? 0) - (r.asOf ?? 0)).at(-1) ?? null;
}
function Ir(e, t, n) {
  return [...e].filter(
    (r) => r.symbol.toUpperCase() === t.symbol.toUpperCase() && r.source === t.source && r.knownAt <= n && r.effectiveFrom <= n && (r.effectiveTo == null || r.effectiveTo >= n)
  ).sort((r, s) => r.effectiveFrom - s.effectiveFrom || r.knownAt - s.knownAt).at(-1) ?? null;
}
function _r(e) {
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
  return [...t.entries()].sort(([r], [s]) => _t(r, s)).map(([r, s]) => ({
    timeframe: r,
    minimumDurationSeconds: s.duration,
    minimumBars: s.bars,
    purposes: [...s.purposes].sort()
  }));
}
function Mr(e, t) {
  return t.mode === "all" ? e.every(Boolean) : t.mode === "atLeast" ? e.filter(Boolean).length >= t.count : e.some(Boolean);
}
function Fr(e, t) {
  return t === "ignore" ? !0 : t === "requireKnownAvailable" ? e === "Available" : e !== "Unavailable";
}
function Or(e, t) {
  const n = te(t.scanTimeframe);
  return Math.floor(e / n) % t.evaluationCadence.everyBars === 0;
}
function L(e) {
  throw new RangeError(e);
}
function Lr(e) {
  e.schemaVersion !== Rt && L("Unsupported radar selection profile schema"), (!e.id.trim() || !e.version.trim() || !e.name.trim()) && L("Radar profile identity fields are required"), e.setupFamily !== "impulse_fade_v1" && L("Only impulse_fade_v1 radar profiles are supported"), Number.isFinite(te(e.scanTimeframe)) || L("scanTimeframe must be valid"), (!Number.isInteger(e.evaluationCadence.everyBars) || e.evaluationCadence.everyBars < 1) && L("evaluation cadence must contain a positive integer bar count"), e.moveDetectors.length || L("At least one move detector is required"), new Set(e.moveDetectors.map((t) => t.id)).size !== e.moveDetectors.length && L("Move detector IDs must be unique"), new Set(e.hardGates).size !== e.hardGates.length && L("Hard gates must be unique"), e.detectorCombination.mode === "atLeast" && (!Number.isInteger(e.detectorCombination.count) || e.detectorCombination.count < 1 || e.detectorCombination.count > e.moveDetectors.length) && L("atLeast detector count must be between one and the detector count"), (!O(e.episodeExpiry.maximumAgeSeconds) || !O(e.resetPolicy.minimumFalseDurationSeconds) || !Number.isFinite(e.createdAt)) && L("Episode expiry, reset duration, and createdAt must be valid");
  for (const t of e.moveDetectors) Br(t);
}
function Br(e) {
  e.id.trim() || L("Detector ID is required"), Object.entries(e).filter(([n, r]) => n !== "minimumReturnPct" && n !== "minimumPercentile" && n !== "minimumZScore" && typeof r == "number").map(([, n]) => n).some((n) => !Number.isFinite(n) || n < 0) && L(`Detector ${e.id} contains invalid numeric settings`), e.type === "maximumWindowReturn" && !e.windowsSeconds.length && L(`Detector ${e.id} requires at least one window`);
}
function Dr(e) {
  if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to < e.from)
    throw new RangeError("Radar scan range must be finite and ordered");
  if (Tt(e.selectionProfile) !== e.selectionProfile.canonicalConfigHash)
    throw new Error("Radar selection profile failed deterministic hash verification");
}
function ue(e, t) {
  return t == null || e != null && e + 1e-12 >= t;
}
function Hr(e) {
  return Number.isFinite(e.bucket) && O(e.o) && O(e.h) && O(e.l) && O(e.c);
}
function O(e) {
  return Number.isFinite(e) && e > 0;
}
function Se(e) {
  return e != null && Number.isFinite(e);
}
function D(e, t, n) {
  return { code: e, severity: t, message: n };
}
function ze(e) {
  return [...new Map(e.map((t) => [`${t.code}:${t.severity}:${t.message}`, t])).values()].sort((t, n) => t.code.localeCompare(n.code));
}
function tt(e) {
  return [...new Map(e.map((t) => [t.observationId, t])).values()].sort(It);
}
function It(e, t) {
  return e.knownAt - t.knownAt || e.observationId.localeCompare(t.observationId);
}
function Vr(e, t) {
  return e.asOf - t.asOf || e.symbol.localeCompare(t.symbol) || e.source.localeCompare(t.source);
}
function qr(e, t) {
  return e.detectedAt - t.detectedAt || e.id.localeCompare(t.id);
}
function $r(e, t) {
  return e.asOf - t.asOf || e.observationId.localeCompare(t.observationId);
}
function _t(e, t) {
  return te(e) - te(t) || e.localeCompare(t);
}
function Mt(e) {
  return {
    id: e.id,
    version: e.version,
    canonicalConfigHash: e.canonicalConfigHash
  };
}
function we(e) {
  return `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
}
function Ft(e) {
  return e % 86400 === 0 ? `${e / 86400}d` : e % 3600 === 0 ? `${e / 3600}h` : e % 60 === 0 ? `${e / 60}m` : `${e}s`;
}
function q(e) {
  return _(e).slice(8);
}
function Ci(e) {
  return B(e);
}
const Ur = "linear-quote-perpetual-risk.1", zr = "sizing-result.1", jr = "trade-plan.1", Gr = "decision-record.1";
function Ot(e) {
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
  ), (!pe(e.intendedEntryPrice, e.venueRules.priceTick) || !pe(e.stopPrice, e.venueRules.priceTick) || e.targets.some(
    (C) => !pe(C.targetPrice, e.venueRules.priceTick)
  )) && S(
    t,
    "PRICE_TICK_MISMATCH",
    `Entry, stop, and targets must align to price tick ${e.venueRules.priceTick}`
  ), e.leveragePolicy.mode === "manual" && !pe(e.leveragePolicy.leverage, e.venueRules.leverageStep) && S(
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
  ), (s && (!H(e.riskRequest.accountRiskFraction ?? 0) || (e.riskRequest.accountRiskFraction ?? 0) > 1) || i && (!H(e.riskRequest.fixedRiskAmount ?? 0) || (e.riskRequest.fixedRiskAmount ?? 0) > e.accountState.equity) || e.riskRequest.maximumMarginAllocationFraction > 1) && S(
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
  (o == null || !Number.isFinite(o) || o <= 0) && S(t, "RISK_REQUEST_INVALID", "Risk budget must be positive and finite"), Wr(
    e.targets,
    e.intendedEntryPrice,
    e.targetFractionTolerance ?? 1e-8,
    t
  );
  const a = e.intendedEntryPrice * (1 - e.executionAssumptions.adverseEntrySlippageBps / 1e4), c = H(a) ? a : null, l = H(e.stopPrice) ? e.stopPrice * (1 + e.executionAssumptions.adverseStopSlippageBps / 1e4) : null, u = c != null && l != null ? l - c + c * e.executionAssumptions.entryFeeRate + l * e.executionAssumptions.stopExitFeeRate : null;
  (u == null || !Number.isFinite(u) || u <= 0) && S(t, "INVALID_NUMERIC_INPUT", "Per-unit stop risk must be positive");
  const d = o != null && u != null && u > 0 ? o / u : null;
  let f = d == null ? null : nt(d, e.venueRules.quantityStep);
  if (f != null && o != null && u != null)
    for (; f > 0 && f * u > o + Math.max(1e-10, o * 1e-12); )
      f = nt(
        f - e.venueRules.quantityStep,
        e.venueRules.quantityStep
      );
  const m = f != null && f > 0 ? f : null, h = m == null ? null : m * e.intendedEntryPrice, y = m == null || c == null ? null : m * c * e.executionAssumptions.entryFeeRate, p = m == null || l == null ? null : m * l * e.executionAssumptions.stopExitFeeRate, w = m == null || u == null ? null : m * u;
  (m == null || m < e.venueRules.minQuantity) && S(
    t,
    "MINIMUM_QUANTITY_NOT_MET",
    `Rounded quantity is below venue minimum ${e.venueRules.minQuantity}`
  ), (h == null || h < e.venueRules.minNotional) && S(
    t,
    "MINIMUM_NOTIONAL_NOT_MET",
    `Notional is below venue minimum ${e.venueRules.minNotional}`
  );
  const E = e.riskRequest.maximumNotional;
  E != null && h != null && h > E && S(
    t,
    "MAXIMUM_NOTIONAL_EXCEEDED",
    `Notional exceeds configured maximum ${E}`
  );
  const A = e.accountState.equity * e.riskRequest.maximumMarginAllocationFraction, T = e.accountState.availableBalance == null ? A : Math.min(A, e.accountState.availableBalance), P = h != null && T > 0 ? h / T : null, g = ei(
    e.leveragePolicy,
    P,
    e.venueRules.leverageStep
  );
  g != null && g > e.venueRules.maxLeverage && S(
    t,
    "MAX_LEVERAGE_EXCEEDED",
    `Required leverage ${g} exceeds venue maximum ${e.venueRules.maxLeverage}`
  );
  const v = h != null && g != null && g > 0 ? h / g : null;
  v != null && v > A + 1e-10 && S(
    t,
    "MARGIN_ALLOCATION_EXCEEDED",
    "Initial margin exceeds the configured account-equity allocation"
  ), v != null && e.accountState.availableBalance != null && v > e.accountState.availableBalance + 1e-10 && S(
    t,
    "AVAILABLE_BALANCE_EXCEEDED",
    "Initial margin exceeds available balance"
  );
  const k = m != null && c != null && l != null ? m * (l - c) : null, F = Xr(
    e.targets,
    m,
    c,
    k,
    w,
    e.executionAssumptions
  ), me = be(
    F.map((C) => C.grossReward * C.positionFraction)
  ), he = be(
    F.map((C) => C.netProjectedReward * C.positionFraction)
  ), ve = be(
    F.map(
      (C) => C.weightedGrossRContribution == null ? null : C.weightedGrossRContribution
    )
  ), Y = be(
    F.map(
      (C) => C.weightedRContribution == null ? null : C.weightedRContribution
    )
  );
  return N({
    schemaVersion: zr,
    sizingModelVersion: Ur,
    side: e.side,
    riskBudget: o,
    rawQuantity: d,
    roundedQuantity: m,
    effectiveEntry: c,
    effectiveStop: l,
    stopDistanceAbsolute: c == null || l == null ? null : l - c,
    stopDistancePercent: c == null || l == null ? null : (l - c) / c * 100,
    stopDistanceAtr: e.stopDistanceAtr ?? null,
    grossNotional: h,
    estimatedEntryFee: y,
    estimatedStopFee: p,
    projectedLossAtStop: w,
    projectedLossPercentEquity: w == null || e.accountState.equity <= 0 ? null : w / e.accountState.equity * 100,
    selectedLeverage: g,
    minimumRequiredLeverage: P,
    initialMargin: v,
    marginPercentEquity: v == null || e.accountState.equity <= 0 ? null : v / e.accountState.equity * 100,
    marginPercentAvailableBalance: v == null || e.accountState.availableBalance == null || e.accountState.availableBalance <= 0 ? null : v / e.accountState.availableBalance * 100,
    targetOutcomes: F,
    weightedGrossReward: me,
    weightedProjectedReward: he,
    weightedGrossR: ve,
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
function Ni(e) {
  var i;
  if (!Number.isFinite(e.createdAt) || e.createdAt < e.snapshot.decisionTime)
    throw new RangeError("Trade plan createdAt cannot precede its decision snapshot");
  const t = Ot({
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
    schemaVersion: jr,
    snapshotId: e.snapshot.id,
    setupFamily: Q,
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
  }, r = { ...n, id: e.id ?? Lt(n) }, s = Qr({
    strategyProfile: e.strategyProfile,
    snapshot: e.snapshot,
    plan: r
  });
  return N({ ...r, complianceResult: s });
}
function Qr(e) {
  var f, m, h;
  const { strategyProfile: t, snapshot: n, plan: r } = e, s = [...r.sizingResult.hardErrors], i = [], o = [...r.sizingResult.warnings], a = Ot({
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
  (At(t) !== t.profileHash || kt(n) !== n.id || Lt(r) !== r.id || B(a) !== B(r.sizingResult)) && S(
    s,
    "SERIALIZED_INTEGRITY_MISMATCH",
    "A serialized profile, snapshot, plan, or sizing result failed deterministic verification"
  ), (r.venueRules.symbol.toUpperCase() !== n.symbol.toUpperCase() || (f = n.candidateEpisode) != null && f.venue && r.venueRules.venue.toLowerCase() !== n.candidateEpisode.venue.toLowerCase()) && S(
    s,
    "INSTRUMENT_IDENTITY_MISMATCH",
    "Venue risk rules do not match the snapshot instrument"
  ), (n.snapshotSchemaVersion !== wt || n.strategyProfileId !== t.id || n.strategyProfileVersion !== t.version || n.strategyProfileHash !== t.profileHash || n.lifecycleVersion !== t.lifecycleVersion || n.lifecycleConfigHash !== t.lifecycleConfigHash || r.setupFamily !== t.setupFamily || r.lifecycleVersion !== t.lifecycleVersion || r.lifecycleConfigHash !== t.lifecycleConfigHash || r.strategyProfileId !== t.id || r.strategyProfileVersion !== t.version || r.strategyProfileHash !== t.profileHash || B(r.executionAssumptions) !== B(t.executionAssumptions)) && S(
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
    (y, p) => y + p.positionFraction,
    0
  );
  Math.abs(c - 1) > t.targetPolicy.fractionTolerance && S(
    s,
    "TARGET_FRACTIONS_INVALID",
    `Target fractions exceed profile tolerance ${t.targetPolicy.fractionTolerance}`
  ), Kr(n, r, s), Jr(r, s), Yr(n, t, i), Zr(n, t, i), t.stopPolicy.requireOutsideEpisodeHigh && ((m = n.candidateEpisode) == null ? void 0 : m.episodeHigh) != null && r.stopPlan.stopPrice <= n.candidateEpisode.episodeHigh && S(
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
  const l = i.some((y) => y.code === "NO_ACTIVE_CANDIDATE"), u = ((h = r.discretionaryOverrideReason) == null ? void 0 : h.trim()) || null;
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
function Ii(e) {
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
    schemaVersion: Gr,
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
  }, n = e.id ?? `decision:${_(t).slice(8)}`;
  return N({ ...t, id: n });
}
function Wr(e, t, n, r) {
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
function Xr(e, t, n, r, s, i) {
  return t == null || n == null ? [] : e.map((o) => {
    const a = o.targetPrice * (1 + i.adverseTargetSlippageBps / 1e4), c = t * (n - a), l = t * n * i.entryFeeRate, u = t * a * i.targetExitFeeRate, d = c - l - u, f = r != null && r > 0 ? c / r : null, m = s != null && s > 0 ? d / s : null;
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
      projectedR: m,
      weightedGrossRContribution: f == null ? null : f * o.positionFraction,
      weightedRContribution: m == null ? null : m * o.positionFraction
    };
  });
}
function Yr(e, t, n) {
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
function Zr(e, t, n) {
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
function Kr(e, t, n) {
  const r = new Map(
    er(e).map((i) => [i.id, i])
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
    o ? B(o) !== B(i.reference) && S(
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
function Jr(e, t) {
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
    ) : o != null ? l = i * (1 + o / 1e4) : a != null && (H(c ?? 0) ? l = i + a * (c ?? 0) : S(
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
function ei(e, t, n) {
  return e.mode === "manual" ? H(e.leverage) ? e.leverage : null : t == null ? null : Math.max(1, ti(t, n));
}
function Lt(e) {
  const {
    id: t,
    complianceResult: n,
    ...r
  } = e;
  return `trade-plan:${_(r).slice(8)}`;
}
function nt(e, t) {
  if (!H(e) || !H(t)) return 0;
  const n = Bt(t);
  return Number((Math.floor(e / t + 1e-12) * t).toFixed(n));
}
function ti(e, t) {
  if (!H(e) || !H(t)) return e;
  const n = Bt(t);
  return Number((Math.ceil(e / t - 1e-12) * t).toFixed(n));
}
function Bt(e) {
  const t = e.toString().toLowerCase();
  return t.includes("e-") ? Number(t.split("e-")[1]) : t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
}
function pe(e, t) {
  if (!Number.isFinite(e) || !H(t)) return !1;
  const n = Math.round(e / t) * t;
  return Math.abs(e - n) <= Math.max(1e-12, t * 1e-9);
}
function be(e) {
  return e.some((t) => t == null) ? null : e.reduce((t, n) => t + (n ?? 0), 0);
}
function H(e) {
  return Number.isFinite(e) && e > 0;
}
function K(e, t) {
  return { code: e, message: t };
}
function S(e, t, n) {
  e.some((r) => r.code === t) || e.push(K(t, n));
}
export {
  pi as CANDLE_TIMESTAMP_SEMANTICS,
  Gr as DECISION_RECORD_SCHEMA_VERSION,
  wt as DECISION_SNAPSHOT_SCHEMA_VERSION,
  Jn as DEFAULT_IMPULSE_FADE_RESEARCH_PROFILE,
  fr as EXECUTION_VENUE_ELIGIBILITY_SCHEMA_VERSION,
  xi as EXPERIMENTAL_IMPULSE_FADE_RADAR_PROFILE,
  oe as IMPULSE_FADE_CANDIDATE_GATE,
  Wt as IMPULSE_FADE_LIFECYCLE_CONFIG_VERSION,
  U as IMPULSE_FADE_LIFECYCLE_VERSION,
  Xn as IMPULSE_FADE_RESEARCH_PROFILE_ID,
  Yn as IMPULSE_FADE_RESEARCH_PROFILE_VERSION,
  Q as IMPULSE_FADE_SETUP_FAMILY,
  or as RADAR_EPISODE_SCHEMA_VERSION,
  cr as RADAR_METRIC_OBSERVATION_SCHEMA_VERSION,
  lr as RADAR_SCAN_RESULT_SCHEMA_VERSION,
  Rt as RADAR_SELECTION_PROFILE_SCHEMA_VERSION,
  ur as RADAR_STATUS_OBSERVATION_SCHEMA_VERSION,
  ar as REPLAY_CASE_MANIFEST_SCHEMA_VERSION,
  Ur as SIZING_MODEL_VERSION,
  zr as SIZING_RESULT_SCHEMA_VERSION,
  Wn as STRATEGY_PROFILE_SCHEMA_VERSION,
  jr as TRADE_PLAN_SCHEMA_VERSION,
  ai as appendSyntheticCandle,
  ne as bucketStart,
  Ot as calculateLinearPerpetualSizing,
  z as candleCloseTime,
  je as candleToBytes,
  Dt as candlesToBytes,
  _ as canonicalHash,
  Ci as canonicalRadarJson,
  B as canonicalSerialize,
  vt as computeAnchoredVwapLine,
  Si as computeAnchoredVwapSignals,
  bi as computeAnchoredVwapSnapshot,
  vi as computeAtrLine,
  fi as computeBollingerBands,
  ii as computeCloseChangePct,
  li as computeEmaLine,
  Fe as computeExtensionSnapshot,
  hi as computeMacd,
  ce as computeMarketStructure,
  fn as computeRelativeCumulativeReturnLine,
  ki as computeRelativeStrengthDivergences,
  di as computeRsiLine,
  Xt as computeSetupState,
  ci as computeSmaLine,
  mi as computeStochRsi,
  wi as computeStructureActiveLevels,
  Ai as computeSupportResistanceZones,
  un as computeSupportResistanceZonesFromSwings,
  ln as computeSwingPoints,
  si as computeViewBounds,
  ui as computeWmaLine,
  Ii as createDecisionRecord,
  Ti as createDecisionReferenceLevel,
  Ei as createDecisionSnapshot,
  Kn as createImpulseFadeResearchProfile,
  dr as createRadarSelectionProfile,
  Zn as createStrategyProfile,
  Ni as createTradePlan,
  kt as decisionSnapshotId,
  er as decisionSnapshotReferenceLevels,
  gi as evaluateImpulseFadeSnapshot,
  yi as evaluateImpulseFadeTimeline,
  Qr as evaluateTradePlanCompliance,
  N as immutableJsonClone,
  re as impulseFadeLifecycleConfigHash,
  Ri as lineToBytes,
  oi as makeSyntheticCandles,
  Ht as mergeLiveCandle,
  rt as normalizeOhlcvPoint,
  ni as normalizeRestTimeframe,
  it as packHistoricalCandles,
  ri as prependHistoricalCandles,
  Tt as radarSelectionProfileHash,
  Pi as scanRadarEpisodes,
  At as strategyProfileHash,
  te as timeframeToSeconds,
  Lt as tradePlanId
};
