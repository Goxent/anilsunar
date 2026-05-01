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

// ─── Utility Functions ───────────────────────────────────────────────────────
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadTickers() {
  const p = path.join(__dirname, '../src/app/data/nepse-tickers.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data.tickers || [];
  }
  return [];
}

function loadTopCandidates() {
  const p = path.join(__dirname, '../src/app/data/technical-signals.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data.topCandidates || [];
  }
  return [];
}

async function login(page) {
  const email = process.env.SASTO_EMAIL;
  const password = process.env.SASTO_PASSWORD;
  if (!email || !password) throw new Error('SASTO_EMAIL/SASTO_PASSWORD missing.');

  console.log('🔐 Authenticating at Sasto Share...');
  await page.goto('https://nepsealpha.com/login', { waitUntil: 'networkidle', timeout: 30000 });
  
  if (page.url().match(/dashboard|sastoshare|home/i)) {
    console.log('✅ Already logged in.');
    return;
  }

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  console.log(`✅ Login successful → ${page.url()}`);
}

const PAGE_EXTRACTOR = () => {
  const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
    let headers = Array.from(table.querySelectorAll('thead th, thead td'))
      .map(th => th.innerText.trim().replace(/\s+/g, ' '));
    if (headers.length === 0) {
      headers = Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td'))
        .map(td => td.innerText.trim().replace(/\s+/g, ' '));
    }
    const bodyRows = table.querySelectorAll('tbody tr');
    const rowSource = bodyRows.length > 0 ? Array.from(bodyRows) : Array.from(table.querySelectorAll('tr')).slice(1);
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

  const textNodes = Array.from(document.querySelectorAll('.stat, .metric, .indicator'))
    .map(el => el.innerText.trim())
    .filter(t => t.length > 0 && t.length < 100);

  return { tables, textNodes };
};

// ─── Handlers ───────────────────────────────────────────────────────────────

/**
 * Iterates through the given symbols, visiting their tearsheets, clicking every tab,
 * and extracting data. Saves one file per symbol in data/tearsheets/.
 */
async function handleTearsheets(page, symbols) {
  console.log(`\n📄 Starting Deep Tearsheet Handler for ${symbols.length} symbols...`);
  const outDir = path.join(__dirname, '../src/app/data/tearsheets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const sym of symbols) {
    try {
      console.log(`🔎 Deep exploring: ${sym}`);
      await page.goto(`https://nepsealpha.com/sastoshare/tearsheet/${sym}`, { waitUntil: 'domcontentloaded' });
      await sleep(2000); // Let SPA render

      const stockData = { symbol: sym, tabs: {} };

      // Find all tab links inside the tab navigation
      // Assuming Sasto Share uses standard Bootstrap/Vue tabs like a.nav-link or similar
      const tabSelectors = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('ul.nav.nav-tabs a.nav-link, .tabs a, [role="tab"]'))
          .map((el, index) => {
             // Generate a unique selector or rely on text
             return { text: el.innerText.trim(), index };
          });
      });

      console.log(`   Found ${tabSelectors.length} tabs to explore.`);

      if (tabSelectors.length === 0) {
        // Fallback if tabs aren't found, just grab the page
        stockData.tabs['Overview'] = await page.evaluate(PAGE_EXTRACTOR);
      } else {
        // Iterate and click tabs
        for (let i = 0; i < tabSelectors.length; i++) {
          const tabName = tabSelectors[i].text || `Tab_${i}`;
          // Click by element reference using index
          await page.evaluate((idx) => {
            const tabs = Array.from(document.querySelectorAll('ul.nav.nav-tabs a.nav-link, .tabs a, [role="tab"]'));
            if(tabs[idx]) tabs[idx].click();
          }, i);
          
          await sleep(1500); // Wait for tab content to render/fetch
          const data = await page.evaluate(PAGE_EXTRACTOR);
          stockData.tabs[tabName] = data;
        }
      }

      fs.writeFileSync(path.join(outDir, `${sym}.json`), JSON.stringify(stockData, null, 2));
      console.log(`   ✔️ Saved deep tearsheet for ${sym}`);
    } catch (err) {
      console.error(`   ❌ Failed on ${sym}: ${err.message}`);
    }
  }
}

/**
 * Navigates to a complex page (like broker holdings) and attempts to click timeframe buttons
 * (1W, 1M, 3M, 6M) and captures the table for each timeframe.
 */
async function handleBrokerHoldings(page) {
  console.log('\n📄 Starting Interactive Broker Holdings Handler...');
  try {
    await page.goto('https://nepsealpha.com/sastoshare/floorsheet/broker-holding', { waitUntil: 'networkidle' });
    await sleep(2000);

    const brokerData = { timeframes: {} };

    // Identify buttons that look like timeframes (1W, 1M, 3M, 6M)
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, .btn, a')).filter(el => {
        const t = el.innerText.trim().toUpperCase();
        return ['1W', '1 WEEK', '1M', '1 MONTH', '3M', '3 MONTHS', '6M', '6 MONTHS', '1Y', '1 YEAR', 'ALL'].includes(t);
      }).map((el, i) => ({ text: el.innerText.trim(), index: i }));
    });

    if (buttons.length === 0) {
       console.log('   No timeframe buttons found, extracting default view.');
       brokerData.timeframes['Default'] = await page.evaluate(PAGE_EXTRACTOR);
    } else {
       for (let i = 0; i < buttons.length; i++) {
         const btnText = buttons[i].text;
         console.log(`   Clicking timeframe: ${btnText}`);
         
         // Custom clicker based on text content since index might shift if DOM changes
         await page.evaluate((text) => {
           const els = Array.from(document.querySelectorAll('button, .btn, a'));
           const target = els.find(e => e.innerText.trim() === text);
           if (target) target.click();
         }, btnText);
         
         await sleep(3000); // Wait for API call and table render
         brokerData.timeframes[btnText] = await page.evaluate(PAGE_EXTRACTOR);
       }
    }

    const outPath = path.join(__dirname, '../src/app/data/deep-broker-holdings.json');
    fs.writeFileSync(outPath, JSON.stringify(brokerData, null, 2));
    console.log(`   ✔️ Saved interactive broker holdings.`);
  } catch(err) {
    console.error(`   ❌ Failed on broker holdings: ${err.message}`);
  }
}

/**
 * Sets up network interception to catch raw JSON API responses for chart data.
 */
async function handleChartInterception(page) {
  console.log('\n📈 Starting Chart API Interceptor...');
  
  const interceptedData = {};

  // Attach listener
  page.on('response', async (response) => {
    const url = response.url();
    // Look for typical API endpoints used for charts (tradingview UDF, history, footprint, etc)
    if (url.includes('api/history') || url.includes('api/chart') || url.includes('footprint')) {
      try {
         const json = await response.json();
         console.log(`   📡 Intercepted chart data from: ${url.split('?')[0]}`);
         interceptedData[url] = json;
      } catch (e) {
         // Not JSON or failed to parse
      }
    }
  });

  try {
    await page.goto('https://nepsealpha.com/nepse-chart?mode=footprint&interval=30', { waitUntil: 'networkidle' });
    await sleep(5000); // Wait for websockets/APIs to settle

    const outPath = path.join(__dirname, '../src/app/data/deep-chart-data.json');
    fs.writeFileSync(outPath, JSON.stringify(interceptedData, null, 2));
    console.log(`   ✔️ Saved intercepted chart data (${Object.keys(interceptedData).length} requests captured).`);
  } catch(err) {
    console.error(`   ❌ Failed on chart interception: ${err.message}`);
  }
}

// ─── Main Execution ──────────────────────────────────────────────────────────
export default async function runDeepCrawler() {
  console.log('🦑 Omni Deep Crawler initialized.');
  
  // Decide targets
  const allTickers = loadTickers();
  const topCandidates = loadTopCandidates();
  
  // Deep crawl all filtered tickers instead of just top candidates.
  // Warning: This will take a long time to execute.
  const targetSymbols = allTickers;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    await login(page);

    // Run Handlers
    await handleTearsheets(page, targetSymbols);
    await handleBrokerHoldings(page);
    await handleChartInterception(page);

    console.log('\n✅ Deep Crawl Complete.');

  } catch (err) {
    console.error('\n🚨 Deep Crawler aborted:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepCrawler();
}
