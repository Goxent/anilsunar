import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

chromium.use(stealth());

const TARGET_URL = 'https://www.sharesansar.com/today-share-price';

async function runFundamentalAnalyzer() {
  console.log('📊 Fundamental Analyzer starting...');
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`📄 Fetching fundamentals from ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
      return rows.map(tr => {
        const cells = Array.from(tr.querySelectorAll('td'));
        if (cells.length < 10) return null;
        
        // Sharesansar table mapping (approximate, usually changes)
        // We look for headers or assume position
        return {
          symbol: cells[1]?.innerText.trim(),
          ltp: cells[6]?.innerText.trim(),
          eps: cells[14]?.innerText.trim() || 'N/A',
          pe: cells[15]?.innerText.trim() || 'N/A',
          bookValue: cells[16]?.innerText.trim() || 'N/A',
        };
      }).filter(r => r && r.symbol);
    });

    const output = {
      timestamp: new Date().toISOString(),
      count: data.length,
      stocks: data
    };

    const outPath = path.join(__dirname, '../src/app/data/fundamental-data.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

    console.log(`✅ Saved ${data.length} stocks fundamentals to fundamental-data.json`);

  } catch (err) {
    console.error('❌ Fundamental Analyzer failed:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

runFundamentalAnalyzer();
