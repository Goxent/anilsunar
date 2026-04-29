import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

chromium.use(stealth());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/app/data');
const NOTICES_FILE = path.join(DATA_DIR, 'regulatory-notices.json');

const sites = [
  { name: "OCR Nepal", url: "https://ocr.gov.np/" },
  { name: "IRD Nepal", url: "https://ird.gov.np/" },
  { name: "ICAN Nepal", url: "https://en.ican.org.np/en/" }
];

// -------------------------------------------------------
// Checks if two titles are very similar (avoids near duplicates)
// -------------------------------------------------------
function similarityCheck(title1, title2) {
  if (!title1 || !title2) return false;
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  
  if (t1 === t2) return true;

  const shorter = t1.length < t2.length ? t1 : t2;
  const longer = t1.length < t2.length ? t2 : t1;

  if (longer.includes(shorter) && shorter.length > 20) {
    return true;
  }

  return false;
}

function isTitleSaved(title, existingNotices) {
  for (const notice of existingNotices) {
    if (similarityCheck(notice.title, title)) return true;
  }
  return false;
}

async function scrapeNotices() {
  console.log('🏛️ Initiating Gov-Scraper for Regulatory Notices...');
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let existingNotices = [];
  if (fs.existsSync(NOTICES_FILE)) {
    existingNotices = JSON.parse(fs.readFileSync(NOTICES_FILE, 'utf8'));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const newNotices = [];
  
  for (const site of sites) {
    console.log(`\n🔍 Scraping: ${site.name} (${site.url})`);
    const page = await context.newPage();
    
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Generic extraction: look for common link text patterns that signify notices
      // This is a naive extraction; ideally we'd have specific selectors per site.
      const links = await page.$$eval('a', anchors => {
        return anchors.map(a => ({
          title: a.innerText.trim().replace(/\n/g, ' '),
          link: a.href
        })).filter(a => a.title.length > 20 && a.title.length < 200 && a.link.startsWith('http'));
      });
      
      // Deduplicate links on the same page
      const uniquePageLinks = [];
      const seenTitles = new Set();
      for (const item of links) {
        if (!seenTitles.has(item.title)) {
          seenTitles.add(item.title);
          uniquePageLinks.push(item);
        }
      }

      console.log(`📋 Found ${uniquePageLinks.length} potential notices from ${site.name}`);
      
      for (const item of uniquePageLinks) {
        if (!isTitleSaved(item.title, existingNotices) && !isTitleSaved(item.title, newNotices)) {
          console.log(`🆕 NEW notice found: ${item.title}`);
          newNotices.push({
            date: new Date().toISOString(),
            source: site.name,
            title: item.title,
            summary: "Extracted from recent updates",
            link: item.link
          });
        }
      }
      
    } catch (error) {
      console.log(`⚠️ Skipping ${site.name} — could not fetch page: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (newNotices.length > 0) {
    const combinedNotices = [...newNotices, ...existingNotices];
    // Keep only the last 500 notices to prevent the file from growing indefinitely
    const trimmedNotices = combinedNotices.slice(0, 500);
    fs.writeFileSync(NOTICES_FILE, JSON.stringify(trimmedNotices, null, 2));
    console.log(`\n✅ Saved ${newNotices.length} new notices to ${NOTICES_FILE}`);
  } else {
    console.log(`\n📭 No new notices to save.`);
  }
}

scrapeNotices().catch(console.error);
