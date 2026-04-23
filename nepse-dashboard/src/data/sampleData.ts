// Sample NEPSE market data for demo purposes
// In production, this will be fetched from Google Sheets via Apps Script

export interface StockData {
  symbol: string
  name: string
  sector: string
  ltp: number
  change: number
  changePct: number
  high: number
  low: number
  open: number
  volume: number
  turnover: number
  prevClose: number
}

export interface BrokerTrade {
  date: string
  broker: number
  brokerName: string
  symbol: string
  qty: number
  rate: number
  side: 'buy' | 'sell'
}

export interface AccumulationSignal {
  symbol: string
  broker: number
  brokerName: string
  netQty: number
  totalBought: number
  totalSold: number
  daysActive: number
  score: number
  signal: 'Accumulation' | 'Distribution' | 'Strong Accumulation'
}

export const MARKET_SUMMARY = {
  nepseIndex: 2145.67,
  change: 12.34,
  changePct: 0.58,
  totalTurnover: 3_450_000_000,
  totalVolume: 8_234_567,
  totalTrades: 45_678,
  advances: 142,
  declines: 78,
  unchanged: 15,
  marketCap: 3_567_000_000_000,
}

export const SECTOR_DATA = [
  { name: 'Commercial Banks', change: 1.2, index: 1523 },
  { name: 'Development Banks', change: -0.4, index: 4234 },
  { name: 'Finance', change: 0.8, index: 2156 },
  { name: 'Microfinance', change: -1.1, index: 3421 },
  { name: 'Hydropower', change: 2.3, index: 1876 },
  { name: 'Insurance', change: 0.3, index: 7654 },
  { name: 'Hotels', change: -0.2, index: 3210 },
  { name: 'Manufacturing', change: 1.5, index: 5432 },
  { name: 'Life Insurance', change: 0.7, index: 8765 },
  { name: 'Investment', change: -0.6, index: 654 },
]

export const SAMPLE_STOCKS: StockData[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks', ltp: 1250, change: 18, changePct: 1.46, high: 1265, low: 1230, open: 1232, volume: 45230, turnover: 56_537_500, prevClose: 1232 },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', ltp: 845, change: -12, changePct: -1.4, high: 860, low: 840, open: 857, volume: 67890, turnover: 57_367_050, prevClose: 857 },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', sector: 'Life Insurance', ltp: 1120, change: 35, changePct: 3.23, high: 1130, low: 1080, open: 1085, volume: 23456, turnover: 26_270_720, prevClose: 1085 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydro', sector: 'Hydropower', ltp: 456, change: 22, changePct: 5.07, high: 460, low: 430, open: 434, volume: 89012, turnover: 40_589_472, prevClose: 434 },
  { symbol: 'NHPC', name: 'Nepal Hydro & Electric', sector: 'Hydropower', ltp: 567, change: -8, changePct: -1.39, high: 580, low: 560, open: 575, volume: 34567, turnover: 19_599_489, prevClose: 575 },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks', ltp: 345, change: 5, changePct: 1.47, high: 350, low: 340, open: 340, volume: 123456, turnover: 42_592_320, prevClose: 340 },
  { symbol: 'SHL', name: 'Soaltee Hotel Limited', sector: 'Hotels', ltp: 678, change: -15, changePct: -2.16, high: 695, low: 670, open: 693, volume: 12345, turnover: 8_369_910, prevClose: 693 },
  { symbol: 'SHIVM', name: 'Shivam Cements Limited', sector: 'Manufacturing', ltp: 890, change: 30, changePct: 3.49, high: 895, low: 855, open: 860, volume: 56789, turnover: 50_542_210, prevClose: 860 },
  { symbol: 'ADBL', name: 'Agriculture Dev Bank', sector: 'Development Banks', ltp: 412, change: 2, changePct: 0.49, high: 420, low: 408, open: 410, volume: 34500, turnover: 14_214_000, prevClose: 410 },
  { symbol: 'PLIC', name: 'Prime Life Insurance', sector: 'Life Insurance', ltp: 654, change: -20, changePct: -2.97, high: 680, low: 650, open: 674, volume: 45600, turnover: 29_822_400, prevClose: 674 },
  { symbol: 'CHCL', name: 'Chilime Hydropower', sector: 'Hydropower', ltp: 534, change: 14, changePct: 2.69, high: 540, low: 518, open: 520, volume: 28900, turnover: 15_432_600, prevClose: 520 },
  { symbol: 'KBL', name: 'Kumari Bank Limited', sector: 'Commercial Banks', ltp: 278, change: 8, changePct: 2.96, high: 280, low: 268, open: 270, volume: 98700, turnover: 27_438_600, prevClose: 270 },
]

export const ACCUMULATION_SIGNALS: AccumulationSignal[] = [
  { symbol: 'UPPER', broker: 45, brokerName: 'Broker #45', netQty: 45000, totalBought: 52000, totalSold: 7000, daysActive: 8, score: 92, signal: 'Strong Accumulation' },
  { symbol: 'NLIC', broker: 12, brokerName: 'Broker #12', netQty: 23000, totalBought: 28000, totalSold: 5000, daysActive: 6, score: 78, signal: 'Accumulation' },
  { symbol: 'SHIVM', broker: 33, brokerName: 'Broker #33', netQty: 18000, totalBought: 22000, totalSold: 4000, daysActive: 5, score: 72, signal: 'Accumulation' },
  { symbol: 'SHL', broker: 21, brokerName: 'Broker #21', netQty: -15000, totalBought: 3000, totalSold: 18000, daysActive: 7, score: 85, signal: 'Distribution' },
  { symbol: 'CHCL', broker: 45, brokerName: 'Broker #45', netQty: 12000, totalBought: 15000, totalSold: 3000, daysActive: 4, score: 65, signal: 'Accumulation' },
  { symbol: 'KBL', broker: 9, brokerName: 'Broker #9', netQty: 34000, totalBought: 38000, totalSold: 4000, daysActive: 9, score: 95, signal: 'Strong Accumulation' },
]
