import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { saveSnapshot } from './history-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

chromium.use(stealth());

const TARGETS = [
  // Group A — Market Overview
  'https://nepsealpha.com/sastoshare/home',
  'https://nepsealpha.com/sastoshare/daily-summary',
  'https://nepsealpha.com/trading-menu/top-stocks',
  // Group B — Stock Intelligence
  'https://nepsealpha.com/sastoshare/swing-gain',
  'https://nepsealpha.com/sastoshare/stock-health',
  'https://nepsealpha.com/sastoshare/bifs-financials',
  'https://nepsealpha.com/sastoshare/insurance-financials',
  'https://nepsealpha.com/sastoshare/hydro-financials',
  'https://nepsealpha.com/sastoshare/mfin-financials',
  // Group C — Broker Intelligence
  'https://nepsealpha.com/sastoshare/broker-analysis',
  'https://nepsealpha.com/sastoshare/floorsheet/today',
  'https://nepsealpha.com/sastoshare/broker-trend',
  // Group D — Sector & Macro
  'https://nepsealpha.com/sastoshare/sector-performance',
  'https://nepsealpha.com/sastoshare/sector-rotation/index',
  'https://nepsealpha.com/sastoshare/dividend-book/book-trend',
  'https://nepsealpha.com/sastoshare/market-breadth',
  // Group E — Technical
  'https://nepsealpha.com/sastoshare/technical-screener',
  'https://nepsealpha.com/sastoshare/momentum-screener',
  'https://nepsealpha.com/sastoshare/overbought-oversold',
  'https://nepsealpha.com/trading-menu/technical-analysis'
];

async function retry(fn, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`[Retry ${i + 1}/${maxRetries}] Failed, waiting ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function login(page) {
  const email = process.env.SASTO_EMAIL;
  const password = process.env.SASTO_PASSWORD;

  if (!email || !password) {
    throw new Error('SASTO_EMAIL or SASTO_PASSWORD missing in env');
  }

  console.log('🔐 Authenticating at https://nepsealpha.com/login...');
  
  await retry(async () => {
    await page.goto('https://nepsealpha.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check if already logged in by looking at URL or dashboard elements
    if (page.url().match(/dashboard|sastoshare|home/i)) {
      console.log('✅ Already logged in.');
      return;
    }

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    if (!url.match(/dashboard|sastoshare|home/i)) {
      throw new Error(`Login failed. Landed on unexpected URL: ${url}`);
    }
    console.log('✅ Login successful!');
  });
}

export default async function runOmniCrawlerV2() {
  let browser;
  try {
    console.log('🕷️ Starting Omni Crawler V2...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await login(page);

    const scrapedPages = [];
    let successCount = 0;

    for (const url of TARGETS) {
      console.log(`\n📄 Crawling: ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
        await page.waitForTimeout(2500); // 2500ms wait after navigation

        const data = await page.evaluate(() => {
          const title = document.title;
          const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim());
          
          const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
            const caption = table.querySelector('caption')?.innerText.trim() || '';
            
            let headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().replace(/\n/g, ' '));
            if (headers.length === 0) {
              // fallback to first row if no thead
              headers = Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td')).map(td => td.innerText.trim().replace(/\n/g, ' '));
            }

            const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)')).map(tr => {
              const cells = Array.from(tr.querySelectorAll('td'));
              const rowObj = {};
              cells.forEach((cell, i) => {
                const header = headers[i] || `Col_${i}`;
                rowObj[header] = cell.innerText.trim();
              });
              return rowObj;
            }).filter(r => Object.keys(r).length > 0);

            return { tableId: `table_${idx}`, caption, headers, rows };
          });

          const statCards = Array.from(document.querySelectorAll('.stat, .card, [class*="metric"], [class*="indicator"], .badge')).map(card => {
            const lines = card.innerText.trim().split('\n').filter(Boolean);
            return {
              label: lines[0] || '',
              value: lines.slice(1).join(' ') || lines[0] || ''
            };
          });

          return { title, tables, statCards, headings };
        });

        scrapedPages.push({
          url,
          title: data.title,
          scrapedAt: new Date().toISOString(),
          tables: data.tables,
          statCards: data.statCards,
          headings: data.headings
        });
        
        console.log(`   ✔️ Extracted ${data.tables.length} tables, ${data.statCards.length} cards.`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Failed to crawl ${url}: ${err.message}`);
      }
    }

    const finalData = {
      timestamp: new Date().toISOString(),
      totalTargets: TARGETS.length,
      successCount,
      scrapedPages
    };

    const outPath = path.join(__dirname, '../src/app/data/market-omni-data.json');
    if (!fs.existsSync(path.dirname(outPath))) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }
    fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2));
    console.log(`\n💾 Saved to ${outPath}`);

    // Call history manager
    try {
      saveSnapshot(finalData);
    } catch (e) {
      console.error('⚠️ Failed to save history snapshot:', e.message);
    }

    // Summary Print
    console.log('\n📊 === CRAWL SUMMARY ===');
    scrapedPages.forEach(p => {
      console.log(`- ${p.title?.substring(0, 40).padEnd(40)} : ${p.tables.length} tables | ${p.statCards.length} cards`);
    });

  } catch (error) {
    console.error('🚨 Omni Crawler failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOmniCrawlerV2();
}
