export interface OhlcvPoint {
  ts: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v_base?: number;
  v_quote?: number;
  ver?: number;
  knownAt?: number;
}

export interface CandleRecord extends OhlcvPoint {
  bucket: number;
  x: number;
}

export interface GpuSeriesState {
  timeframeSec: number;
  firstBucket: number;
  candles: CandleRecord[];
  positionByBucket: Map<number, number>;
}

export type LiveMergeResult =
  | { kind: "ignore"; reason: string }
  | { kind: "replace"; position: number; bytes: Uint8Array }
  | { kind: "append"; position: number; bytes: Uint8Array }
  | { kind: "reset"; bytes: Uint8Array };

export interface ViewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface GpuChartTimeWindow {
  minTs: number;
  maxTs: number;
}

export type GpuChartTimeSyncAction = { kind: "window"; window: GpuChartTimeWindow };

export type GpuChartTimeSyncCommand = GpuChartTimeSyncAction & {
  seq: number;
  sourceId?: string | number;
};

export type GpuChartStreamStatus = "open" | "closed" | "error";

export interface GpuChartDataQuery {
  symbol: string;
  exchange?: string;
  marketType?: string;
  timeframe: string | number;
  limit: number;
  start?: number;
  end?: number;
}

export interface GpuChartStreamHandlers {
  onCandle: (payload: unknown) => void;
  onStatus?: (status: GpuChartStreamStatus) => void;
  onError?: (message: string) => void;
}

export type GpuChartUnsubscribe = () => void;

export interface GpuChartDataAdapter {
  loadLatest(query: GpuChartDataQuery): Promise<unknown[]>;
  loadRange?(query: GpuChartDataQuery): Promise<unknown[]>;
  subscribe?(
    query: GpuChartDataQuery,
    handlers: GpuChartStreamHandlers,
  ): GpuChartUnsubscribe | Promise<GpuChartUnsubscribe>;
}

export interface GpuChartOpenPayload {
  symbol: string;
  exchange?: string;
  marketType?: string;
  timeframe: string | number;
}

export interface GpuChartPointSelectionPayload extends GpuChartOpenPayload {
  mode: string;
  price: number;
  candle: OhlcvPoint;
}

export interface GpuChartAvwapAnchor {
  id: string;
  label: string;
  anchorBucket: number;
  visible?: boolean;
}

export interface CandidateExtensionMetrics {
  windowSeconds: number;
  historyDays: number;
  sampleCount: number;
  latestTs: number | null;
  referenceTs: number | null;
  latestClose: number | null;
  referenceClose: number | null;
  returnPct: number | null;
  percentile: number | null;
  zScore: number | null;
}

export interface CandidateTimeframeExtensionMetrics {
  timeframe: string;
  emaPeriod: number;
  atrPeriod: number;
  latestTs: number | null;
  latestClose: number | null;
  ema: number | null;
  atr: number | null;
  atrExtension: number | null;
}

export interface CandidateHistoryCoverage {
  requestedStartTs: number;
  requestedEndTs: number;
  availableStartTs: number | null;
  availableEndTs: number | null;
  coveredSeconds: number | null;
  requestedSeconds: number;
  coverageRatio: number | null;
}

export interface CandidateInsufficientDataReason {
  code: string;
  scope: string;
  message: string;
  required: number | null;
  available: number | null;
  unit: string | null;
}

export interface CandidateMetrics {
  symbol: string;
  exchange: string;
  marketType: string;
  source: "local" | "external";
  baseTimeframe: string;
  requestedAsOf: number | null;
  effectiveAsOf: number | null;
  sampleCount: number;
  historyCoverage: CandidateHistoryCoverage;
  insufficientDataReasons: CandidateInsufficientDataReason[];
  extension: CandidateExtensionMetrics;
  timeframeExtensions: Record<string, CandidateTimeframeExtensionMetrics>;
  updatedAt: number;
}
