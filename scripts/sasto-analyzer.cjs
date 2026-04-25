const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
require('dotenv').config();

const EMAIL = process.env.SASTO_EMAIL;
const PASSWORD = process.env.SASTO_PASSWORD;

async function retry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`⚠️ Step failed, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function runProdSync() {
  console.log('🚀 Initiating Production Sasto Share Bot...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  try {
    // 1. LOGIN
    await retry(async () => {
      console.log('🔑 Attempting stealth login...');
      await page.goto('https://nepsealpha.com/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      if (await page.isVisible('input[name="email"]')) {
        await page.fill('input[name="email"]', EMAIL, { delay: 100 });
        await page.fill('input[name="password"]', PASSWORD, { delay: 150 });
        await page.click('button[type="submit"]');
      }
      await page.waitForURL(/.*dashboard|.*home|.*sastoshare/, { timeout: 15000 });
      console.log('✅ Login successful!');
    });

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        topAccumulatingBroker: 'N/A',
        topBuySymbol: 'N/A',
        topSellSymbol: 'N/A',
        marketSentiment: 'Neutral'
      },
      brokerAccumulation: [],
      smcSignals: [],
      floorsheetTop20: []
    };

    // 2. QUANT RANKINGS & SCORES (Scraping the overview of top stocks)
    await retry(async () => {
      console.log('📊 Scraping Quant Rankings & Health Scores...');
      await page.goto('https://nepsealpha.com/sastoshare/stock-analysis', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.quant-ranking, table', { timeout: 15000 }).catch(() => null);
      
      report.quantAnalysis = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 30);
        return rows.map(r => {
          const cells = r.querySelectorAll('td');
          return {
            symbol: cells[0]?.innerText.trim(),
            fScore: cells[5]?.innerText.trim(), // Assuming F-Score is in col 5
            momentum: cells[2]?.innerText.trim(),
            value: cells[3]?.innerText.trim(),
          };
        });
      });
      console.log(`✅ Extracted Quant data for ${report.quantAnalysis.length} stocks.`);
    });

    // 3. AI SIGNALS (Swing & Breakout)
    await retry(async () => {
      console.log('📈 Scraping AI Swing Signals...');
      await page.goto('https://nepsealpha.com/sastoshare/signal-explorer', { waitUntil: 'domcontentloaded' }); 
      await page.waitForSelector('.signal-card, tr', { timeout: 10000 }).catch(() => null);
      
      report.smcSignals = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 20);
        return rows.map(r => {
          const cells = r.querySelectorAll('td');
          return {
            symbol: cells[0]?.innerText.trim(),
            signal: cells[1]?.innerText.trim(),
            type: 'Swing'
          };
        });
      });
      console.log(`✅ Extracted ${report.smcSignals.length} high-probability signals.`);
    });

    // 4. BROKER HOLDING (Accumulation)
    await retry(async () => {
      console.log('📑 Scraping Broker Accumulation...');
      await page.goto('https://nepsealpha.com/sastoshare/broker-analysis', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => null);
      
      report.brokerAccumulation = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 15);
        return rows.map(r => ({
          broker: r.querySelectorAll('td')[0]?.innerText.trim(),
          topBuy: r.querySelectorAll('td')[1]?.innerText.trim(),
          netHolding: r.querySelectorAll('td')[4]?.innerText.trim()
        }));
      });
      console.log(`✅ Extracted top broker holdings.`);
    });

    // 5. AUTO-ANALYSIS LOGIC (Mapping to Dashboard)
    const finalData = {
      updatedAt: new Date().toLocaleTimeString(),
      picks: report.quantAnalysis
        .filter(s => parseInt(s.fScore) >= 7)
        .map(s => ({
          symbol: s.symbol,
          entry: 'F-Score: ' + s.fScore,
          target: s.momentum === 'A' ? 'STRONG BUY' : 'ACCUMULATE',
          strength: s.momentum === 'A' ? 100 : 80
        })),
      signals: report.smcSignals.map(s => ({
        symbol: s.symbol,
        signal: s.signal,
        type: s.type
      })),
      sentiment: [
        `Market Sentiment: ${report.smcSignals.length > 5 ? 'Bullish' : 'Neutral'}`,
        `Top Quality Pick: ${report.quantAnalysis[0]?.symbol || 'N/A'} (F-Score: ${report.quantAnalysis[0]?.fScore})`,
        `Strategy: Focus on ${report.quantAnalysis.filter(s => s.value === 'A').length} stocks identified as 'Value A' stocks.`
      ],
      rotation: report.quantAnalysis.slice(0, 5).map(s => s.symbol + ' (M: ' + s.momentum + ')')
    };

    // SAVE DATA
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../nepse-dashboard/src/data');
    const dataPath = path.join(dataDir, 'deep_intelligence.json'); // Changed to match dashboard import
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataPath, JSON.stringify(finalData, null, 2));
    console.log('💾 AI Analysis saved to:', dataPath);

  } catch (err) {
    console.error('❌ Bot Execution Failed:', err.message);
    process.exit(1); 
  } finally {
    if (browser) await browser.close();
  }
}

runProdSync();
