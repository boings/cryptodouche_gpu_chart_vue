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
export declare function computeSupportResistanceZones(candles: CandleRecord[], options?: SupportResistanceZoneOptions): SupportResistanceZone[];
export declare function computeRelativeCumulativeReturnLine(candles: CandleRecord[], benchmarkCandles: CandleRecord[]): Float32Array;
export declare function lineToBytes(line: Float32Array): Uint8Array;
