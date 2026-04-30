import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

chromium.use(stealth());

// ─── Nepal Date Helper (UTC+5:45) ───────────────────────────────────────────
function getNepalDateString() {
  const nowMs = Date.now() + 5.75 * 60 * 60 * 1000;
  const nd = new Date(nowMs);
  const yyyy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nd.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Retry Wrapper ───────────────────────────────────────────────────────────
async function retry(fn, maxRetries = 3, delayMs = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`  ⚠️  Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) await sleep(delayMs);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Pages to Scrape ────────────────────────────────────────────────────────
const TARGETS = [
  'https://nepsealpha.com/sastoshare/home',
  'https://nepsealpha.com/sastoshare/daily-summary',
  'https://nepsealpha.com/trading-menu/top-stocks',
  'https://nepsealpha.com/sastoshare/swing-gain',
  'https://nepsealpha.com/sastoshare/stock-health',
  'https://nepsealpha.com/sastoshare/broker-analysis',
  'https://nepsealpha.com/sastoshare/floorsheet/today',
  'https://nepsealpha.com/sastoshare/sector-performance',
  'https://nepsealpha.com/sastoshare/sector-rotation/index',
  'https://nepsealpha.com/sastoshare/technical-screener',
  'https://nepsealpha.com/sastoshare/momentum-screener',
  'https://nepsealpha.com/sastoshare/overbought-oversold',
  'https://nepsealpha.com/sastoshare/bifs-financials',
  'https://nepsealpha.com/sastoshare/insurance-financials',
  'https://nepsealpha.com/sastoshare/hydro-financials',
  'https://nepsealpha.com/sastoshare/mfin-financials',
  'https://nepsealpha.com/sastoshare/dividend-book/book-trend',
  'https://nepsealpha.com/sastoshare/market-breadth',
];

// ─── Page Evaluator ──────────────────────────────────────────────────────────
const PAGE_EXTRACTOR = () => {
  // Extract all tables — no row limit
  const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
    // Try thead > th first, fall back to first row
    let headers = Array.from(table.querySelectorAll('thead th, thead td'))
      .map(th => th.innerText.trim().replace(/\s+/g, ' '));
    if (headers.length === 0) {
      headers = Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td'))
        .map(td => td.innerText.trim().replace(/\s+/g, ' '));
    }

    const bodyRows = table.querySelectorAll('tbody tr');
    const rowSource = bodyRows.length > 0
      ? Array.from(bodyRows)
      : Array.from(table.querySelectorAll('tr')).slice(1);

    const rows = rowSource.map(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length === 0) return null;
      const obj = {};
      cells.forEach((td, i) => {
        obj[headers[i] || `Col_${i}`] = td.innerText.trim().replace(/\s+/g, ' ');
      });
      return obj;
    }).filter(Boolean);

    return { tableIndex: idx, headers, rows };
  });

  // Extract stat cards / metric boxes
  const statCards = Array.from(document.querySelectorAll(
    '.stat, .card, .metric, .badge, .indicator, [class*="stat"], [class*="score"], [class*="metric"], [class*="indicator"]'
  )).reduce((acc, el) => {
    const text = el.innerText.trim();
    if (!text || text.length > 200) return acc; // skip huge containers
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      acc.push({ label: lines[0], value: lines.slice(1).join(' ') });
    } else if (lines.length === 1) {
      acc.push({ label: lines[0], value: '' });
    }
    return acc;
  }, []);

  return {
    title: document.title,
    tables,
    statCards,
  };
};

// ─── History Helpers ─────────────────────────────────────────────────────────
function saveHistory(data) {
  const historyDir = path.join(__dirname, '../src/app/data/history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  const todayStr = getNepalDateString();
  const snapshotPath = path.join(historyDir, `${todayStr}.json`);

  if (fs.existsSync(snapshotPath)) {
    console.log(`ℹ️  Snapshot for ${todayStr} already exists — skipping.`);
    return;
  }

  fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2));
  console.log(`📅 History snapshot saved → history/${todayStr}.json`);
}

function pruneHistory(keepDays = 90) {
  const historyDir = path.join(__dirname, '../src/app/data/history');
  if (!fs.existsSync(historyDir)) return;

  const todayMs = Date.now() + 5.75 * 60 * 60 * 1000;
  const cutoffMs = todayMs - keepDays * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(historyDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
  let deleted = 0;
  files.forEach(file => {
    const dateStr = file.replace('.json', '');
    const fileMs = new Date(dateStr).getTime();
    if (fileMs < cutoffMs) {
      fs.unlinkSync(path.join(historyDir, file));
      deleted++;
    }
  });

  if (deleted > 0) console.log(`🗑️  Pruned ${deleted} history file(s) older than ${keepDays} days.`);
}

// ─── Main Crawler ────────────────────────────────────────────────────────────
export default async function runCrawler() {
  const email = process.env.SASTO_EMAIL;
  const password = process.env.SASTO_PASSWORD;
  if (!email || !password) {
    throw new Error('SASTO_EMAIL and SASTO_PASSWORD must be set in environment variables.');
  }

  console.log('🕷️  Omni Crawler starting...');
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    // ── LOGIN ────────────────────────────────────────────────────────────────
    await retry(async () => {
      console.log('🔐 Logging in...');
      await page.goto('https://nepsealpha.com/login', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Skip login if already authenticated
      if (/dashboard|sastoshare|home/i.test(page.url())) {
        console.log('✅ Already authenticated.');
        return;
      }

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');

      await page.waitForURL(/dashboard|sastoshare|home/i, { timeout: 20000 });
      console.log(`✅ Login successful → ${page.url()}`);
    }, 3, 2000);

    // ── SCRAPE LOOP ──────────────────────────────────────────────────────────
    const scrapedPages = [];

    for (const url of TARGETS) {
      try {
        console.log(`\n📄 Scraping: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
        await sleep(2500);

        const extracted = await page.evaluate(PAGE_EXTRACTOR);

        scrapedPages.push({
          url,
          title: extracted.title,
          scrapedAt: new Date().toISOString(),
          tables: extracted.tables,
          statCards: extracted.statCards,
        });

        console.log(
          `   ✔  ${extracted.tables.length} tables` +
          ` | ${extracted.tables.reduce((a, t) => a + t.rows.length, 0)} rows` +
          ` | ${extracted.statCards.length} stat cards`
        );
      } catch (err) {
        console.error(`   ❌ Failed to scrape ${url}: ${err.message}`);
      }
    }

    // ── SAVE ─────────────────────────────────────────────────────────────────
    const output = {
      timestamp: new Date().toISOString(),
      totalTargets: TARGETS.length,
      successCount: scrapedPages.length,
      scrapedPages,
    };

    // 1. Today's live snapshot
    const dataDir = path.join(__dirname, '../src/app/data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const mainPath = path.join(dataDir, 'market-omni-data.json');
    fs.writeFileSync(mainPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved → src/app/data/market-omni-data.json`);

    // 2. Daily history snapshot
    saveHistory(output);

    // 3. Prune history older than 90 days
    pruneHistory(90);

    // ── SUMMARY TABLE ─────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(80));
    console.log('📊  CRAWL SUMMARY');
    console.log('─'.repeat(80));
    scrapedPages.forEach(p => {
      const tableCount = p.tables.length.toString().padStart(2);
      const rowCount = p.tables.reduce((a, t) => a + t.rows.length, 0).toString().padStart(4);
      const cardCount = p.statCards.length.toString().padStart(2);
      const shortUrl = p.url.replace('https://nepsealpha.com', '').substring(0, 45).padEnd(45);
      console.log(`  ${shortUrl}  tables:${tableCount}  rows:${rowCount}  cards:${cardCount}`);
    });
    console.log('─'.repeat(80));
    console.log(`  ✅ ${scrapedPages.length}/${TARGETS.length} pages successful\n`);

  } catch (err) {
    console.error('\n🚨 Crawler aborted:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCrawler();
}
