import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, '../src/app/data/history');

// ─── Fuzzy Column Finder ─────────────────────────────────────────────────────
function findCol(row, keywords) {
  const keys = Object.keys(row);
  for (const key of keys) {
    const k = key.toLowerCase().replace(/[\s_\-]/g, '');
    if (keywords.some(kw => k.includes(kw))) return key;
  }
  return null;
}

function parseNum(val) {
  if (val === null || val === undefined) return 0;
  return parseFloat(String(val).replace(/[,%\s]/g, '')) || 0;
}

// ─── Load History ────────────────────────────────────────────────────────────
function loadHistoryFiles(maxDays = 30) {
  if (!fs.existsSync(HISTORY_DIR)) return [];

  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort() // ascending by date string
    .slice(-maxDays);

  const snapshots = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(HISTORY_DIR, file), 'utf8');
      snapshots.push({ date: file.replace('.json', ''), data: JSON.parse(raw) });
    } catch (e) {
      console.error(`⚠️  Could not read ${file}: ${e.message}`);
    }
  }
  return snapshots;
}

// ─── Extract Stock Rows From a Snapshot ─────────────────────────────────────
function extractStockRows(snapshot) {
  const pages = snapshot.data?.scrapedPages || [];

  // Prefer daily-summary or home page tables
  const preferred = pages.filter(p =>
    p.url?.includes('daily-summary') || p.url?.includes('/home')
  );
  const fallback = pages; // if preferred has nothing, check all pages

  const candidates = preferred.length > 0 ? preferred : fallback;

  for (const page of candidates) {
    for (const table of page.tables || []) {
      if (!table.rows || table.rows.length === 0) continue;
      const sample = table.rows[0];
      const symKey = findCol(sample, ['symbol', 'stock', 'scrip']);
      const priceKey = findCol(sample, ['ltp', 'lasttradedprice', 'lastprice', 'price', 'closeprice', 'close']);
      if (symKey && priceKey) return { rows: table.rows, symKey, priceKey };
    }
  }
  return null;
}

// ─── Technical Computations ──────────────────────────────────────────────────
function computeRSI(prices, period = 14) {
  if (prices.length < 2) return 50;
  const n = Math.min(period, prices.length - 1);
  let gains = 0, losses = 0;
  for (let i = prices.length - n; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / n;
  const avgLoss = losses / n;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function computeEMA(prices, period) {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return parseFloat(ema.toFixed(4));
}

function computeEMASeries(prices, period) {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const series = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    series.push(prices[i] * k + series[i - 1] * (1 - k));
  }
  return series;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default async function runTechnicalEngine() {
  console.log('⚙️  Technical Engine starting...');
  const snapshots = loadHistoryFiles(30);

  if (snapshots.length === 0) {
    console.error('❌ No history snapshots found. Run omni-crawler first.');
    return;
  }

  console.log(`📂 Loaded ${snapshots.length} history snapshots.`);

  // Build per-stock series
  const seriesMap = {}; // { SYMBOL: { dates, prices, volumes, changes } }

  for (const snap of snapshots) {
    const result = extractStockRows(snap);
    if (!result) continue;
    const { rows, symKey, priceKey } = result;

    const changeKey = findCol(rows[0], ['change', 'percent', 'chg', 'pctchange', '% change', '%change']);
    const volKey = findCol(rows[0], ['volume', 'vol', 'qty', 'quantity', 'sharetrade']);
    for (const row of rows) {
      const symbol = (row[symKey] || '').trim().toUpperCase();
      if (!symbol || symbol.length > 12) continue;

      const price = parseNum(row[priceKey]);
      if (price <= 0) continue;

      if (!seriesMap[symbol]) {
        seriesMap[symbol] = { dates: [], prices: [], volumes: [], changes: [] };
      }

      seriesMap[symbol].dates.push(snap.date);
      seriesMap[symbol].prices.push(price);
      seriesMap[symbol].volumes.push(volKey ? parseNum(row[volKey]) : 0);
      seriesMap[symbol].changes.push(changeKey ? parseNum(row[changeKey]) : 0);
    }
  }

  // Load external data for fused scoring
  const BROKER_FILE = path.join(__dirname, '../src/app/data/broker-flow-5d.json');
  const FUNDAMENTAL_FILE = path.join(__dirname, '../src/app/data/fundamental-data.json');
  
  const brokerFlows = fs.existsSync(BROKER_FILE) ? JSON.parse(fs.readFileSync(BROKER_FILE, 'utf8')).stocks : [];
  const fundamentals = fs.existsSync(FUNDAMENTAL_FILE) ? JSON.parse(fs.readFileSync(FUNDAMENTAL_FILE, 'utf8')).stocks : [];

  const stocks = [];

  for (const [symbol, series] of Object.entries(seriesMap)) {
    if (series.prices.length < 5) continue; // require at least 5 days

    const prices = series.prices;
    const volumes = series.volumes;
    const changes = series.changes;

    // a) RSI
    const rsi = computeRSI(prices);
    let rsiLabel = 'NEUTRAL';
    if (rsi < 30) rsiLabel = 'OVERSOLD';
    else if (rsi > 70) rsiLabel = 'OVERBOUGHT';

    // b) EMA + Cross
    const ema5Series = computeEMASeries(prices, 5);
    const ema20Series = computeEMASeries(prices, 20);
    const lastIdx = ema5Series.length - 1;
    const prevIdx = lastIdx - 1;

    let emaCross = 'NONE';
    if (prevIdx >= 0) {
      const ema5Now = ema5Series[lastIdx], ema20Now = ema20Series[lastIdx];
      const ema5Prev = ema5Series[prevIdx], ema20Prev = ema20Series[prevIdx];
      if (ema5Prev <= ema20Prev && ema5Now > ema20Now) emaCross = 'GOLDEN';
      else if (ema5Prev >= ema20Prev && ema5Now < ema20Now) emaCross = 'DEATH';
    }

    const ema5 = ema5Series[lastIdx] ?? 0;
    const ema20 = ema20Series[lastIdx] ?? 0;

    // c) Volume Signal
    const todayVol = volumes[volumes.length - 1];
    const last10Vols = volumes.slice(-10).filter(v => v > 0);
    const avgVol = last10Vols.length > 0 ? last10Vols.reduce((a, b) => a + b, 0) / last10Vols.length : 0;
    const volumeSignal = avgVol > 0 && todayVol > avgVol * 2 ? 'SPIKE' : 'NORMAL';

    // d) Momentum
    const mom1d = changes.length >= 1 ? changes[changes.length - 1] : 0;
    const mom5d = changes.slice(-5).reduce((a, b) => a + b, 0);
    const mom20d = changes.slice(-20).reduce((a, b) => a + b, 0);

    // e) Fused Data Enrichment
    const brokerMatch = brokerFlows.find(s => s.symbol === symbol);
    const fundamentalMatch = fundamentals.find(s => s.symbol === symbol);

    // f) Advanced Smart Score (Max 100)
    let smartScore = 0;
    
    // 1. Technical Health (Max 35)
    if (rsi >= 45 && rsi <= 60) smartScore += 15; // Golden RSI zone
    else if (rsi >= 35 && rsi <= 65) smartScore += 10;
    if (emaCross === 'GOLDEN') smartScore += 15;
    if (mom5d > 0 && mom1d > 0) smartScore += 5;

    // 2. Volume & Price Action (Max 25)
    if (volumeSignal === 'SPIKE') smartScore += 15;
    if (prices[prices.length - 1] > prices[prices.length - 2]) smartScore += 10; // Price uptrend

    // 3. Smart Money Concept (SMC) Algorithm (Max 30)
    if (brokerMatch) {
      if (brokerMatch.pattern === 'ACCUMULATION') {
        smartScore += 20;
        if (brokerMatch.confidence > 80) smartScore += 10;
        else if (brokerMatch.confidence > 60) smartScore += 5;
      }
    }

    // 4. Fundamental Quality (Max 10)
    if (fundamentalMatch) {
      const pe = parseNum(fundamentalMatch.pe);
      const eps = parseNum(fundamentalMatch.eps);
      if (pe > 0 && pe < 30) smartScore += 5; // Reasonable PE
      if (eps > 0) smartScore += 5; // Profitable
    }

    // Signals strings
    const signals = [];
    if (emaCross === 'GOLDEN') signals.push('GOLDEN CROSS');
    if (emaCross === 'DEATH') signals.push('DEATH CROSS');
    if (rsiLabel === 'OVERSOLD') signals.push('RSI OVERSOLD');
    if (rsiLabel === 'OVERBOUGHT') signals.push('RSI OVERBOUGHT');
    if (volumeSignal === 'SPIKE') signals.push('VOLUME SPIKE');
    if (mom5d > 5) signals.push('BULLISH MOMENTUM');
    if (brokerMatch?.pattern === 'ACCUMULATION') signals.push('SMART MONEY ACCUMULATION');

    stocks.push({
      symbol,
      smartScore,
      rsi,
      rsiLabel,
      ema5: parseFloat(ema5.toFixed(2)),
      ema20: parseFloat(ema20.toFixed(2)),
      emaCross,
      volumeSignal,
      mom1d: parseFloat(mom1d.toFixed(2)),
      mom5d: parseFloat(mom5d.toFixed(2)),
      mom20d: parseFloat(mom20d.toFixed(2)),
      signals,
      fundamental: {
        pe: fundamentalMatch?.pe || 'N/A',
        eps: fundamentalMatch?.eps || 'N/A'
      },
      brokerFlow: {
        pattern: brokerMatch?.pattern || 'NEUTRAL',
        confidence: brokerMatch?.confidence || 0
      }
    });
  }

  stocks.sort((a, b) => b.smartScore - a.smartScore);

  const output = {
    computedAt: new Date().toISOString(),
    daysOfHistory: snapshots.length,
    topCandidates: stocks.slice(0, 15).map(s => s.symbol),
    stocks,
  };

  const outPath = path.join(__dirname, '../src/app/data/technical-signals.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`✅ Technical Engine complete — ${stocks.length} stocks scored, saved to technical-signals.json`);
  console.log(`   Top 5: ${stocks.slice(0, 5).map(s => `${s.symbol}(${s.smartScore})`).join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTechnicalEngine().catch(console.error);
}
