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

export default async function runTearsheetCrawler(existingPage = null) {
  console.log('📄 Starting Tearsheet Deep Diver...');
  
  // Load candidate lists
  let candidates = new Set();
  try {
    const techPath = path.join(__dirname, '../src/app/data/technical-signals.json');
    if (fs.existsSync(techPath)) {
      const techData = JSON.parse(fs.readFileSync(techPath, 'utf8'));
      if (techData.topCandidates) techData.topCandidates.forEach(c => candidates.add(c));
    }
    
    const brokerPath = path.join(__dirname, '../src/app/data/broker-flow-5d.json');
    if (fs.existsSync(brokerPath)) {
      const brokerData = JSON.parse(fs.readFileSync(brokerPath, 'utf8'));
      if (brokerData.patterns) {
        brokerData.patterns
          .filter(p => p.pattern === 'INSTITUTIONAL_ACCUMULATION')
          .forEach(p => candidates.add(p.symbol));
      }
    }
  } catch (err) {
    console.error('⚠️ Could not load candidate lists:', err.message);
  }

  const symbols = Array.from(candidates).slice(0, 20); // Max 20 symbols
  if (symbols.length === 0) {
    console.log('⚠️ No candidates found for tearsheet crawling.');
    return;
  }

  console.log(`🎯 Targets: ${symbols.join(', ')}`);

  let browser;
  let page = existingPage;
  
  if (!page) {
    console.log('🌐 No existing session provided. Launching new browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
    
    const email = process.env.SASTO_EMAIL;
    const password = process.env.SASTO_PASSWORD;
    if (!email || !password) throw new Error('SASTO_EMAIL/SASTO_PASSWORD missing for standalone run.');

    await page.goto('https://nepsealpha.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    if (!page.url().match(/dashboard|sastoshare|home/i)) {
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  }

  const outDir = path.join(__dirname, '../src/app/data/tearsheets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const indexData = {
    generatedAt: new Date().toISOString(),
    symbols: []
  };

  for (const symbol of symbols) {
    try {
      const url = `https://nepsealpha.com/sastoshare/tearsheet/${symbol}`;
      console.log(`\n🔎 Deep diving: ${symbol}`);
      
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (response && response.status() === 404) {
        console.log(`   ⏭️ 404 Not Found for ${symbol}. Skipping.`);
        continue;
      }
      
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        const getText = (selector) => document.querySelector(selector)?.innerText.trim() || '';
        
        // Extract basic fundamentals from any card or table
        const tables = Array.from(document.querySelectorAll('table')).map(table => {
          const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
          const rows = Array.from(table.querySelectorAll('tr')).map(tr => {
            const cells = Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText.trim());
            return cells;
          });
          return { headers, rows };
        });

        // Heuristics to find specific metrics
        const allText = document.body.innerText;
        
        const extractMetric = (keywords) => {
          // This is a naive regex-based fallback if it's not neatly in a table
          // Look for "Keyword: Value" or similar
          for (const kw of keywords) {
            const regex = new RegExp(`${kw}[\\s\\n:]*([\\d,\\.-]+)`, 'i');
            const match = allText.match(regex);
            if (match && match[1]) return parseFloat(match[1].replace(/,/g, ''));
          }
          return null;
        };

        const pe = extractMetric(['P/E Ratio', 'PE', 'P/E']);
        const eps = extractMetric(['EPS', 'Earning Per Share']);
        const roe = extractMetric(['ROE', 'Return on Equity']);
        const bookValue = extractMetric(['Book Value', 'BV']);
        const div52w = extractMetric(['Dividend Yield', 'Div Yield', 'Yield']);
        const marketCap = extractMetric(['Market Cap', 'Capitalization']);

        const news = Array.from(document.querySelectorAll('.news-item, .headline, [class*="news"] a'))
          .slice(0, 3)
          .map(el => el.innerText.trim())
          .filter(Boolean);

        return { tables, metrics: { pe, eps, roe, bookValue, div52w, marketCap }, news };
      });

      fs.writeFileSync(path.join(outDir, `${symbol}.json`), JSON.stringify(data, null, 2));

      indexData.symbols.push({
        symbol,
        pe: data.metrics.pe,
        eps: data.metrics.eps,
        roe: data.metrics.roe,
        bookValue: data.metrics.bookValue,
        div52w: data.metrics.div52w,
        marketCap: data.metrics.marketCap,
        nearEvents: [] // extracted if logic permits
      });
      
      console.log(`   ✔️ Saved tearsheet for ${symbol}`);
    } catch (err) {
      console.error(`   ❌ Failed to extract ${symbol}: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify(indexData, null, 2));
  console.log(`\n💾 Tearsheet summary saved to _index.json`);

  if (!existingPage && browser) {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTearsheetCrawler();
}
