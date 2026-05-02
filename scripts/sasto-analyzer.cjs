const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
require('dotenv').config();

const EMAIL = process.env.SASTO_EMAIL;
const PASSWORD = process.env.SASTO_PASSWORD;
const DEBUG = process.env.DEBUG_BOT === 'true';

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
  // Use headless mode in GitHub Actions or if HEADLESS env var is not explicitly 'false'
  const isHeadless = process.env.GITHUB_ACTIONS === 'true' || process.env.HEADLESS !== 'false';
  const browser = await chromium.launch({ 
    headless: isHeadless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
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
      await page.waitForURL(/.*dashboard|.*home|.*sastoshare/, { timeout: 30000 });
      console.log('✅ Login successful!');
    });

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        topAccumulatingBroker: 'N/A',
        topBuySymbol: 'N/A',
        topSellSymbol: 'N/A',
        marketSentiment: 'Neutral',
        nepseIndex: 'N/A',
        nepseChange: '0.0%'
      },
      brokerAccumulation: [],
      smcSignals: [],
      floorsheetTop20: []
    };

    // 2. QUANT RANKINGS & SCORES (Scraping the overview of top stocks)
    await retry(async () => {
      console.log('📊 Scraping Quant Rankings & Health Scores...');
      await page.goto('https://nepsealpha.com/sastoshare/home', { waitUntil: 'networkidle', timeout: 30000 });
      if (DEBUG) await page.screenshot({ path: `logs/debug-${Date.now()}.png`, fullPage: true });
      await page.waitForSelector('table tbody tr', { timeout: 20000 }).catch(() => null);
      await page.waitForTimeout(4000);
      
      report.quantAnalysis = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'))
          .filter(r => r.innerText.trim() !== '')
          .slice(0, 30);
        return rows.map(r => {
          const cells = r.querySelectorAll('td');
          return {
            symbol: cells[0]?.innerText.trim(),
            fScore: cells[5]?.innerText.trim(),
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
      await page.goto('https://nepsealpha.com/sastoshare/swing-gain', { waitUntil: 'networkidle', timeout: 30000 }); 
      if (DEBUG) await page.screenshot({ path: `logs/debug-${Date.now()}.png`, fullPage: true });
      await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(4000);
      
      report.smcSignals = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'))
          .filter(r => r.innerText.trim() !== '')
          .slice(0, 20);
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
      await page.goto('https://nepsealpha.com/sastoshare/floorsheet/today', { waitUntil: 'domcontentloaded' });
      if (DEBUG) await page.screenshot({ path: `logs/debug-${Date.now()}.png`, fullPage: true });
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => null);
      await page.waitForTimeout(3000);

      // Try clicking Broker Analysis if visible
      await page.click('text="Broker Analysis"').catch(() => null);
      
      report.brokerAccumulation = await page.evaluate(() => {
        const table = document.querySelector('table');
        if (!table) return [];
        const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'))
          .map(h => h.innerText.trim().toLowerCase());
        
        const brokerIdx = headers.findIndex(h => h.includes('broker'));
        const symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('scrip') || h.includes('top buy'));
        const netIdx    = headers.findIndex(h => h.includes('net') || h.includes('holding') || h.includes('position'));

        const rows = Array.from(table.querySelectorAll('tbody tr'))
          .filter(r => r.innerText.trim() !== '')
          .slice(0, 15);

        return rows.map(r => {
          const cells = r.querySelectorAll('td');
          return {
            broker: cells[brokerIdx !== -1 ? brokerIdx : 1]?.innerText.trim() || 'N/A',
            topBuy: cells[symbolIdx !== -1 ? symbolIdx : 2]?.innerText.trim() || 'N/A',
            netHolding: cells[netIdx !== -1 ? netIdx : 4]?.innerText.trim() || '0'
          };
        });
      });
      console.log(`✅ Extracted top broker holdings.`);
    });

    // 5. LIVE STOCK PRICES (Updating the Screener)
    await retry(async () => {
      console.log('📉 Scraping Today\'s Prices for the Screener...');
      await page.goto('https://nepsealpha.com/trading-menu/top-stocks', { waitUntil: 'domcontentloaded' });
      if (DEBUG) await page.screenshot({ path: `logs/debug-${Date.now()}.png`, fullPage: true });
      
      const content = await page.textContent('body');
      try {
        const jsonData = JSON.parse(content);
        if (jsonData.topStocks) {
          report.liveStocks = jsonData.topStocks.map(s => ({
            symbol: s.gainer?.[0] || s.looser?.[0] || s.turnover?.[0] || 'N/A',
            ltp: parseFloat(s.gainer?.[2] || s.looser?.[2] || s.turnover?.[2]) || 0,
            changePct: parseFloat(s.gainer?.[2] || s.looser?.[2]) || 0,
            volume: 0 // JSON doesn't seem to have volume directly in this summary
          }));
          console.log(`✅ Parsed JSON data for ${report.liveStocks.length} stocks.`);
          return;
        }
      } catch (e) {
        // Not JSON, fallback to table
      }

      await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(3000);
      
      report.liveStocks = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'))
          .filter(r => r.innerText.trim() !== '')
          .slice(0, 100);
        return rows.map(r => {
          const cells = r.querySelectorAll('td');
          return {
            symbol: cells[1]?.innerText.trim(),
            ltp: parseFloat(cells[2]?.innerText.replace(/,/g, '')) || 0,
            changePct: parseFloat(cells[3]?.innerText.replace(/%/g, '')) || 0,
            volume: parseFloat(cells[5]?.innerText.replace(/,/g, '')) || 0
          };
        });
      });

      // Attempt to extract NEPSE index from the page text
      const pageText = await page.evaluate(() => document.body.innerText);
      const indexMatch = pageText.match(/NEPSE[\s:]*([\d,]+\.\d+)/i);
      const changeMatch = pageText.match(/([\+\-]?\d+\.\d+)%/);
      if (indexMatch && indexMatch[1]) {
        report.summary.nepseIndex = indexMatch[1];
      }
      if (changeMatch && changeMatch[1]) {
        report.summary.nepseChange = changeMatch[1] + '%';
      }
      
      console.log(`✅ Extracted live data for ${report.liveStocks.length} stocks. Index: ${report.summary.nepseIndex}`);
    });

    // 6. AUTO-ANALYSIS & DASHBOARD SYNC
    const finalData = {
      timestamp: new Date().toISOString(),
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
      brokerData: report.brokerAccumulation.map(b => ({
        broker: b.broker,
        symbol: b.topBuy,
        buyQty: parseFloat(b.netHolding.replace(/,/g, '')) > 0 ? parseFloat(b.netHolding.replace(/,/g, '')) : 0,
        sellQty: parseFloat(b.netHolding.replace(/,/g, '')) < 0 ? Math.abs(parseFloat(b.netHolding.replace(/,/g, ''))) : 0,
        netPosition: parseFloat(b.netHolding.replace(/,/g, '')) || 0
      })),
      sentiment: [
        `Market Sentiment: ${report.smcSignals.length > 5 ? 'Bullish' : 'Neutral'}`,
        `Strategy: Focus on ${report.quantAnalysis.filter(s => s.value === 'A').length} Value A stocks.`
      ],
      marketSummary: {
        index: report.summary.nepseIndex,
        changePct: report.summary.nepseChange,
        turnover: 'N/A'
      },
      rotation: report.quantAnalysis.slice(0, 5).map(s => s.symbol + ' (M: ' + s.momentum + ')')
    };

    // 7. GENERATE SAMPLE DATA (TypeScript File)
    const stockCode = report.liveStocks.map(s => 
      `  { symbol: '${s.symbol}', name: '${s.symbol} Group', sector: 'Trending', ltp: ${s.ltp}, change: 0, changePct: ${s.changePct}, high: ${s.ltp}, low: ${s.ltp}, open: ${s.ltp}, volume: ${s.volume}, turnover: 0, prevClose: ${s.ltp} }`
    ).join(',\n');

    const sampleDataTS = `
export interface StockData {
  symbol: string; name: string; sector: string; ltp: number; change: number; changePct: number;
  high: number; low: number; open: number; volume: number; turnover: number; prevClose: number;
}
export const SAMPLE_STOCKS: StockData[] = [
${stockCode}
];
export const MARKET_SUMMARY = { nepseIndex: ${finalData.rotation[0]?.match(/\d+/) || 2000}, change: 0, changePct: 0 };
export const ACCUMULATION_SIGNALS = [];
`;

    // SAVE ALL DATA
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '..', 'src', 'app', 'data');
    
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'data', 'sasto_premium_report.json'), JSON.stringify(finalData, null, 2));
    fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'data', 'super_intelligence.json'), JSON.stringify(finalData, null, 2));
    fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'data', 'sampleData.ts'), sampleDataTS);
    console.log(`✅ Data saved to ${dataDir}`);
    
    // 8. AUTO-EMAIL BROADCAST (Daily Alpha Brief)
    if (process.env.RESEND_API_KEY) {
      console.log('📧 Sending Daily Alpha Brief to email...');
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
          <h2 style="color: #f59e0b;">🛡️ Goxent Alpha Brief</h2>
          <p style="color: #666;">Market Analysis for ${new Date().toLocaleDateString()}</p>
          <hr />
          <h3 style="color: #10b981;">🚀 Top Quant Picks (F-Score > 7)</h3>
          <ul>${finalData.picks.map(p => `<li><strong>${p.symbol}</strong>: ${p.entry} - ${p.target}</li>`).join('')}</ul>
          <h3 style="color: #3b82f6;">📈 Swing Signals</h3>
          <ul>${finalData.signals.slice(0, 5).map(s => `<li>${s.symbol}: ${s.signal} (${s.type})</li>`).join('')}</ul>
          <hr />
          <p style="font-size: 12px; color: #999;">This report was auto-generated by your Sasto Share Bot.</p>
        </div>
      `;

      try {
        await fetch('https://app.anilsunar.com.np/api/send-email', { // Using the production API
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'anil99senchury@gmail.com',
            subject: `Daily NEPSE Alpha: ${new Date().toLocaleDateString()}`,
            html: emailHtml
          })
        });
        console.log('✅ Email Brief Sent!');
      } catch (e) {
        console.warn('⚠️ Email broadcast failed, but data was saved.');
      }
    }

    // 8. PUSH TO FIREBASE (Historical Analysis)
    if (process.env.FIREBASE_API_KEY) {
      console.log('📡 Syncing data to Firebase Firestore...');
      try {
        const dateId = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const url = `https://firestore.googleapis.com/v1/projects/app-anil-sunar/databases/(default)/documents/sasto_records/${dateId}?key=${process.env.FIREBASE_API_KEY}`;
        
        const payload = {
          fields: {
            timestamp: { stringValue: new Date().toISOString() },
            index: { stringValue: report.summary.nepseIndex },
            changePct: { stringValue: report.summary.nepseChange },
            sentiment: { stringValue: finalData.sentiment[0] },
            topPicks: { arrayValue: { values: finalData.picks.slice(0, 5).map(p => ({
              mapValue: { fields: {
                symbol: { stringValue: p.symbol },
                signal: { stringValue: p.target }
              }}
            })) }}
          }
        };

        const response = await fetch(url, {
          method: 'PATCH', // PATCH with document ID will create or overwrite
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log(`✅ Data synced to Firestore as document: ${dateId}`);
        } else {
          const errData = await response.json();
          console.warn('⚠️ Firestore Sync Failed:', errData.error?.message || 'Unknown error');
        }
      } catch (e) {
        console.warn('⚠️ Firestore connection error:', e.message);
      }
    }

    console.log('💾 Ultimate Dashboard Sync Complete!');

  } catch (err) {
    console.error('❌ Bot Execution Failed:', err.message);
    process.exit(1); 
  } finally {
    if (browser) await browser.close();
  }
}

runProdSync();
