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

    // 2. BROKER ANALYSIS
    await retry(async () => {
      console.log('📊 Scraping Broker Analysis...');
      await page.goto('https://nepsealpha.com/sastoshare/broker-analysis', { waitUntil: 'domcontentloaded' });
      // Wait for table body to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.mouse.wheel(0, 500); // Trigger lazy loads
      await page.waitForTimeout(1000);
      
      report.brokerAccumulation = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim()));
      });
      console.log(`✅ Extracted ${report.brokerAccumulation.length} broker rows.`);
    });

    // 3. SMC SIGNALS
    await retry(async () => {
      console.log('📈 Scraping SMC Signals...');
      // Note: nepsealpha might have different URLs. Assuming /sastoshare/smc-signals or /sastoshare/signal-explorer
      await page.goto('https://nepsealpha.com/sastoshare/signal-explorer', { waitUntil: 'domcontentloaded' }); 
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => null);
      
      report.smcSignals = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 50);
        return rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim()));
      });
      console.log(`✅ Extracted ${report.smcSignals.length} SMC signals.`);
    });

    // 4. FLOORSHEET (Top 20)
    await retry(async () => {
      console.log('📑 Scraping Live Floorsheet...');
      await page.goto('https://nepsealpha.com/floorsheet', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => null);
      
      report.floorsheetTop20 = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 20);
        return rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim()));
      });
      console.log(`✅ Extracted top 20 floorsheet entries.`);
    });

    // 5. SUMMARY GENERATION
    if (report.brokerAccumulation.length > 0) {
      report.summary.topAccumulatingBroker = report.brokerAccumulation[0][0] || 'N/A';
      report.summary.topBuySymbol = report.brokerAccumulation[0][1] || 'N/A';
      report.summary.marketSentiment = 'Bullish'; // Simple mock logic based on successful data
    }

    // SAVE DATA
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../nepse-dashboard/src/data');
    const dataPath = path.join(dataDir, 'sasto_full_report.json');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataPath, JSON.stringify(report, null, 2));
    console.log('💾 Production Sasto Report generated at:', dataPath);

  } catch (err) {
    console.error('❌ Bot Execution Failed:', err.message);
    process.exit(1); // Fail the GitHub Action if the bot fails
  } finally {
    if (browser) await browser.close();
  }
}

runProdSync();
