import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, '../src/app/data/history');

// ─── Fuzzy Column Finder ─────────────────────────────────────────────────────
function findCol(row, keywords) {
  for (const key of Object.keys(row)) {
    const k = key.toLowerCase().replace(/[\s_\-\/]/g, '');
    if (keywords.some(kw => k.includes(kw))) return key;
  }
  return null;
}

function parseNum(val) {
  return parseFloat(String(val ?? 0).replace(/[,%\s]/g, '')) || 0;
}

// ─── Load Last N History Snapshots ──────────────────────────────────────────
function loadLastSnapshots(n = 5) {
  if (!fs.existsSync(HISTORY_DIR)) return [];

  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()        // ascending
    .slice(-n);    // take newest n

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

// ─── Extract Floorsheet Rows From a Snapshot ────────────────────────────────
function extractFloorsheetRows(snapshot) {
  const pages = snapshot.data?.scrapedPages || [];
  const floorPages = pages.filter(p =>
    p.url?.includes('floorsheet') || p.title?.toLowerCase().includes('floorsheet')
  );
  const searchIn = floorPages.length > 0 ? floorPages : pages;

  for (const page of searchIn) {
    for (const table of page.tables || []) {
      const rows = table.rows || [];
      if (rows.length === 0) continue;

      const sample = rows[0];
      const symKey    = findCol(sample, ['symbol', 'stock', 'scrip', 'company']);
      const buyerKey  = findCol(sample, ['buyer', 'buybroker', 'buybr', 'buyside']);
      const sellerKey = findCol(sample, ['seller', 'sellbroker', 'sellbr', 'sellside']);
      const qtyKey    = findCol(sample, ['quantity', 'qty', 'vol', 'shares', 'unit']);

      if (symKey && buyerKey && sellerKey && qtyKey) {
        return { rows, symKey, buyerKey, sellerKey, qtyKey };
      }
    }
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default async function runBrokerTracker() {
  console.log('🕵️  Broker Tracker starting...');
  const snapshots = loadLastSnapshots(5);

  if (snapshots.length === 0) {
    console.warn('⚠️  No history snapshots found. Skipping broker tracker.');
    return;
  }

  console.log(`📂 Analysing ${snapshots.length} days of floorsheet data.`);

  // Map: symbol → broker → { bought, sold, daySet }
  const flowMap = {};  // { [symbol]: { [broker]: { bought, sold, days: Set<date> } } }

  for (const snap of snapshots) {
    const result = extractFloorsheetRows(snap);
    if (!result) {
      console.log(`   ℹ️  No floorsheet table found for ${snap.date}`);
      continue;
    }

    const { rows, symKey, buyerKey, sellerKey, qtyKey } = result;

    for (const row of rows) {
      const symbol = (row[symKey] || '').trim().toUpperCase();
      if (!symbol || symbol.length > 12) continue;

      const buyer  = String(row[buyerKey] || '').trim();
      const seller = String(row[sellerKey] || '').trim();
      const qty    = parseNum(row[qtyKey]);
      if (qty <= 0) continue;

      if (!flowMap[symbol]) flowMap[symbol] = {};

      // Record buyer
      if (buyer) {
        if (!flowMap[symbol][buyer]) flowMap[symbol][buyer] = { bought: 0, sold: 0, days: new Set() };
        flowMap[symbol][buyer].bought += qty;
        flowMap[symbol][buyer].days.add(snap.date);
      }

      // Record seller
      if (seller) {
        if (!flowMap[symbol][seller]) flowMap[symbol][seller] = { bought: 0, sold: 0, days: new Set() };
        flowMap[symbol][seller].sold += qty;
        flowMap[symbol][seller].days.add(snap.date);
      }
    }
  }

  const stocks = [];

  for (const [symbol, brokers] of Object.entries(flowMap)) {
    let totalBought = 0, totalSold = 0;
    const brokerList = [];

    for (const [broker, data] of Object.entries(brokers)) {
      totalBought += data.bought;
      totalSold   += data.sold;
      brokerList.push({
        broker,
        netFlow: data.bought - data.sold,
        bought: data.bought,
        sold: data.sold,
        days: data.days.size,
      });
    }

    const netFlow = totalBought - totalSold;

    // Detect pattern
    const topBuyers = brokerList
      .filter(b => b.bought > 0)
      .sort((a, b) => b.bought - a.bought)
      .slice(0, 3)
      .map(b => ({ broker: b.broker, totalQty: b.bought, days: b.days }));

    const topSellers = brokerList
      .filter(b => b.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3)
      .map(b => ({ broker: b.broker, totalQty: b.sold, days: b.days }));

    // Pattern detection
    let pattern = 'NEUTRAL';
    let confidence = 40;

    const hasConsistentBuyer = brokerList.some(b => b.netFlow > 0 && b.days >= 3);
    if (hasConsistentBuyer && netFlow > 0) {
      pattern = 'ACCUMULATION';
      confidence = 60 + Math.min(topBuyers[0]?.days ?? 0, 5) * 8;
    } else if (totalSold > totalBought * 1.2) {
      pattern = 'DISTRIBUTION';
      confidence = 50 + Math.min(topSellers[0]?.days ?? 0, 5) * 8;
    }

    confidence = Math.min(100, confidence);

    stocks.push({
      symbol,
      pattern,
      netFlow,
      topBuyers,
      topSellers,
      confidence,
    });
  }

  stocks.sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));

  const output = {
    generatedAt: new Date().toISOString(),
    daysAnalyzed: snapshots.length,
    stocksTracked: stocks.length,
    stocks,
  };

  const outPath = path.join(__dirname, '../src/app/data/broker-flow-5d.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const accum = stocks.filter(s => s.pattern === 'ACCUMULATION').length;
  const dist  = stocks.filter(s => s.pattern === 'DISTRIBUTION').length;
  console.log(`✅ Broker Tracker complete — ${stocks.length} stocks | ${accum} accumulation | ${dist} distribution`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBrokerTracker().catch(console.error);
}
