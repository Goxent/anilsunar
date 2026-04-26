import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(stealthPlugin());
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

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

async function runOmniSpider() {
  console.log('🕷️ Initiating Omni-Crawler Spider for Sasto Share...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  const dataLake = {
    timestamp: new Date().toISOString(),
    scrapedPages: []
  };

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

    // 2. AUTO-DISCOVER LINKS
    console.log('🗺️ Mapping platform links...');
    await page.goto('https://nepsealpha.com/sastoshare', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      const sastoLinks = new Set();
      
      allLinks.forEach(a => {
        const href = a.href;
        // Collect internal sastoshare tool links
        if (href && href.includes('/sastoshare/') && !href.includes('logout') && !href.includes('#')) {
          sastoLinks.add(href);
        }
      });
      
      // Also grab general nepsealpha top-stocks or floorsheet if visible
      allLinks.forEach(a => {
         const href = a.href;
         if (href && (href.includes('trading-menu/top-stocks') || href.includes('floorsheet'))) {
             sastoLinks.add(href);
         }
      });

      return Array.from(sastoLinks);
    });

    console.log(`🎯 Discovered ${links.length} potential data sources.`);
    
    // Limit to 15 pages max to save time/tokens if there are hundreds
    const targetLinks = links.slice(0, 15);

    // 3. OMNI-EXTRACTION
    for (const link of targetLinks) {
      console.log(`\n🕸️ Crawling: ${link}`);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000); // Wait for dynamic tables to render

        // Extract tables dynamically
        const pageData = await page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          const extractedTables = [];

          tables.forEach((table, tableIndex) => {
            // Get Headers
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
            
            // Get Rows (limit to top 30 rows per table to avoid massive garbage)
            const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 30);
            
            const rowData = rows.map(row => {
              const cells = Array.from(row.querySelectorAll('td'));
              const obj = {};
              cells.forEach((cell, i) => {
                const headerName = headers[i] || `Col_${i}`;
                obj[headerName] = cell.innerText.trim();
              });
              return obj;
            });

            if (rowData.length > 0) {
              extractedTables.push({
                tableIndex,
                headers,
                rows: rowData
              });
            }
          });

          return {
            title: document.title,
            url: window.location.href,
            tables: extractedTables
          };
        });

        if (pageData.tables.length > 0) {
          console.log(`   ✅ Extracted ${pageData.tables.length} tables from ${pageData.title}`);
          dataLake.scrapedPages.push(pageData);
        } else {
          console.log(`   ⚠️ No tables found on this page.`);
        }

      } catch (e) {
        console.error(`   ❌ Failed to crawl ${link}: ${e.message}`);
      }
    }

    // 4. SAVE THE DATA LAKE
    const dataPath = path.join(__dirname, '../src/app/data/market-omni-data.json');
    
    // Ensure dir exists
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(dataPath, JSON.stringify(dataLake, null, 2));
    console.log(`\n💾 Omni-Data Lake saved successfully! Total pages extracted: ${dataLake.scrapedPages.length}`);

  } catch (error) {
    console.error('🚨 Omni-Crawler crashed:', error);
  } finally {
    await browser.close();
  }
}

runOmniSpider();
