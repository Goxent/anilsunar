const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
require('dotenv').config();

const EMAIL = process.env.SASTO_EMAIL;
const PASSWORD = process.env.SASTO_PASSWORD;

async function runSuperSync() {
  console.log('🚀 Launching Super-Sync Bot (NEPSE Live + Sasto Premium)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...' });
  const page = await context.newPage();

  try {
    // 1. GET LIVE TICK FROM NEPALSTOCK.COM (Official Source)
    console.log('📈 Fetching official live tick from NEPSE...');
    await page.goto('https://www.nepalstock.com.np/', { waitUntil: 'domcontentloaded' });
    const liveTick = await page.evaluate(() => {
      return {
        index: document.querySelector('.nepse-index')?.innerText.trim() || 'N/A',
        change: document.querySelector('.index-change')?.innerText.trim() || '0',
        turnover: document.querySelector('.total-turnover')?.innerText.trim() || 'N/A'
      };
    });

    // 2. HUMAN-LIKE LOGIN TO SASTO SHARE
    console.log('🔑 Logging into Sasto Share with stealth behaviors...');
    await page.goto('https://nepsealpha.com/login');
    await page.waitForTimeout(1000 + Math.random() * 2000);
    await page.fill('input[name="email"]', EMAIL, { delay: 120 });
    await page.fill('input[name="password"]', PASSWORD, { delay: 150 });
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*home|.*sastoshare/);

    // 3. DEEP EXTRACTION (Broker Analysis & Technicals)
    console.log('📊 Mining Broker Accumulation & Technicals...');
    await page.goto('https://nepsealpha.com/sastoshare/broker-analysis');
    await page.mouse.wheel(0, 500); // Simulate human scroll
    await page.waitForTimeout(2000);
    
    const brokerData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1, 10);
      return rows.map(r => r.innerText.split('\t').map(c => c.trim()));
    });

    // 4. SAVE COMPREHENSIVE INTELLIGENCE
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../nepse-dashboard/src/data/super_intelligence.json');
    
    fs.writeFileSync(dataPath, JSON.stringify({
      timestamp: new Date().toLocaleString(),
      liveTick,
      brokerData,
      source: 'NEPSE + Sasto Premium'
    }, null, 2));
    
    console.log('💾 Super-Intelligence Database Updated!');

  } catch (err) {
    console.error('❌ Sync Error:', err.message);
  } finally {
    await browser.close();
  }
}

runSuperSync();
