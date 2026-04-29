
export interface StockData {
  symbol: string; name: string; sector: string; ltp: number; change: number; changePct: number;
  high: number; low: number; open: number; volume: number; turnover: number; prevClose: number;
}
export const SAMPLE_STOCKS: StockData[] = [
  { symbol: 'PCBLP', name: 'PCBLP Group', sector: 'Trending', ltp: 8.1, change: 0, changePct: 8.1, high: 8.1, low: 8.1, open: 8.1, volume: 0, turnover: 0, prevClose: 8.1 },
  { symbol: 'SKHEL', name: 'SKHEL Group', sector: 'Trending', ltp: 3.75, change: 0, changePct: 3.75, high: 3.75, low: 3.75, open: 3.75, volume: 0, turnover: 0, prevClose: 3.75 },
  { symbol: 'BJHL', name: 'BJHL Group', sector: 'Trending', ltp: 3.25, change: 0, changePct: 3.25, high: 3.25, low: 3.25, open: 3.25, volume: 0, turnover: 0, prevClose: 3.25 },
  { symbol: 'RLEL', name: 'RLEL Group', sector: 'Trending', ltp: 3.06, change: 0, changePct: 3.06, high: 3.06, low: 3.06, open: 3.06, volume: 0, turnover: 0, prevClose: 3.06 },
  { symbol: 'DLBS', name: 'DLBS Group', sector: 'Trending', ltp: 2.56, change: 0, changePct: 2.56, high: 2.56, low: 2.56, open: 2.56, volume: 0, turnover: 0, prevClose: 2.56 },
  { symbol: 'ULHC', name: 'ULHC Group', sector: 'Trending', ltp: 2.06, change: 0, changePct: 2.06, high: 2.06, low: 2.06, open: 2.06, volume: 0, turnover: 0, prevClose: 2.06 },
  { symbol: 'OHL', name: 'OHL Group', sector: 'Trending', ltp: 1.65, change: 0, changePct: 1.65, high: 1.65, low: 1.65, open: 1.65, volume: 0, turnover: 0, prevClose: 1.65 },
  { symbol: 'CORBL', name: 'CORBL Group', sector: 'Trending', ltp: 1.58, change: 0, changePct: 1.58, high: 1.58, low: 1.58, open: 1.58, volume: 0, turnover: 0, prevClose: 1.58 },
  { symbol: 'BBC', name: 'BBC Group', sector: 'Trending', ltp: 1.38, change: 0, changePct: 1.38, high: 1.38, low: 1.38, open: 1.38, volume: 0, turnover: 0, prevClose: 1.38 },
  { symbol: 'EDBL', name: 'EDBL Group', sector: 'Trending', ltp: 1.04, change: 0, changePct: 1.04, high: 1.04, low: 1.04, open: 1.04, volume: 0, turnover: 0, prevClose: 1.04 }
];
export const MARKET_SUMMARY = { nepseIndex: 8, change: 0, changePct: 0 };
export const ACCUMULATION_SIGNALS = [];
