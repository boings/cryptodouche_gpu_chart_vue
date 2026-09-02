import type { CandleRecord } from "./types";
export interface SupportResistanceZone {
    kind: "support" | "resistance";
    low: number;
    high: number;
    center: number;
    touches: number;
    score: number;
    lastX: number;
}
export interface SupportResistanceZoneOptions {
    lookback?: number;
    pivotStrength?: number;
    maxZones?: number;
    thicknessBps?: number;
    atrPeriod?: number;
    minMoveAtr?: number;
}
export type SwingPointKind = "SwingHigh" | "SwingLow";
export type SwingPointStructure = SwingPointKind | "HigherHigh" | "HigherLow" | "LowerHigh" | "LowerLow";
export type SwingPointLabel = "SH" | "SL" | "HH" | "HL" | "LH" | "LL";
export type StructureBreakKind = "StructureBreak" | "StructureShift";
export type StructureDirection = "bullish" | "bearish";
export interface SwingPoint {
    kind: SwingPointKind;
    structure: SwingPointStructure;
    label: SwingPointLabel;
    index: number;
    x: number;
    ts: number;
    bucket: number;
    price: number;
    atr: number | null;
}
export interface StructureBreak {
    kind: StructureBreakKind;
    direction: StructureDirection;
    label: "BOS" | "Shift";
    index: number;
    x: number;
    ts: number;
    bucket: number;
    level: number;
    sourceSwingX: number;
    sourceSwingPrice: number;
}
export interface MarketStructureOptions {
    lookback?: number;
    pivotStrength?: number;
    atrPeriod?: number;
    minMoveAtr?: number;
    maxSwings?: number;
    maxBreaks?: number;
}
export interface MarketStructureState {
    swings: SwingPoint[];
    breaks: StructureBreak[];
    trend: StructureDirection | "neutral";
}
export interface AnchoredVwapOptions {
    anchorBucket?: number | null;
    anchorX?: number | null;
}
export declare function computeSmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeEmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeWmaLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeBollingerBands(candles: CandleRecord[], period?: number, stdDev?: number): {
    basis: Float32Array;
    upper: Float32Array;
    lower: Float32Array;
};
export declare function computeRsiLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeStochRsi(candles: CandleRecord[], rsiPeriod?: number, stochPeriod?: number, kPeriod?: number, dPeriod?: number): {
    k: Float32Array;
    d: Float32Array;
};
export declare function computeMacd(candles: CandleRecord[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
    macd: Float32Array;
    signal: Float32Array;
    histogram: Float32Array;
};
export declare function computeAtrLine(candles: CandleRecord[], period?: number): Float32Array;
export declare function computeAnchoredVwapLine(candles: CandleRecord[], options?: AnchoredVwapOptions): Float32Array;
export declare function computeSwingPoints(candles: CandleRecord[], options?: MarketStructureOptions): SwingPoint[];
export declare function computeMarketStructure(candles: CandleRecord[], options?: MarketStructureOptions): MarketStructureState;
export declare function computeSupportResistanceZones(candles: CandleRecord[], options?: SupportResistanceZoneOptions): SupportResistanceZone[];
export declare function computeRelativeCumulativeReturnLine(candles: CandleRecord[], benchmarkCandles: CandleRecord[]): Float32Array;
export declare function lineToBytes(line: Float32Array): Uint8Array;
