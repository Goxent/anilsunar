
export interface StockData {
  symbol: string; name: string; sector: string; ltp: number; change: number; changePct: number;
  high: number; low: number; open: number; volume: number; turnover: number; prevClose: number;
  signal?: string; score?: number;
}
export const SAMPLE_STOCKS: StockData[] = [

];
export const MARKET_SUMMARY = { nepseIndex: 2000, change: 0, changePct: 0 };
export const ACCUMULATION_SIGNALS = [];
