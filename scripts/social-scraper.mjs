import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

chromium.use(stealth());

const SEARCH_QUERIES = [
  'NEPSE stock market nepal',
  'NEPSE analysis today',
  'Share Market Nepal facebook group'
];

async function runSocialScraper() {
  console.log('📱 Social Scraper starting...');
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const socialData = [];

    for (const query of SEARCH_QUERIES) {
      console.log(`🔍 Searching for: ${query}...`);
      // Use Google Search as a proxy to find public social posts
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle' });
      
      const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.g')).slice(0, 5).map(el => ({
          title: el.querySelector('h3')?.innerText,
          link: el.querySelector('a')?.href,
          snippet: el.querySelector('.VwiC3b')?.innerText
        }));
      });
      
      socialData.push({ query, results });
      await new Promise(r => setTimeout(r, 2000));
    }

    const output = {
      timestamp: new Date().toISOString(),
      data: socialData
    };

    const outPath = path.join(__dirname, '../src/app/data/social-sentiment.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

    console.log(`✅ Saved social sentiment to social-sentiment.json`);

  } catch (err) {
    console.error('❌ Social Scraper failed:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

runSocialScraper();
