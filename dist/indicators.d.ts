import type { CandleRecord } from "./types";
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
export declare function lineToBytes(line: Float32Array): Uint8Array;
