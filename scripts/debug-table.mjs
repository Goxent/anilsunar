import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
dotenv.config();

chromium.use(stealth());

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Logging in...');
  await page.goto('https://nepsealpha.com/login');
  await page.fill('input[name="email"]', process.env.SASTO_EMAIL);
  await page.fill('input[name="password"]', process.env.SASTO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*sastoshare|.*home/);
  
  const targets = [
    'https://nepsealpha.com/sastoshare/floorsheet/today',
    'https://nepsealpha.com/sastoshare/broker-analysis'
  ];
  
  for (const url of targets) {
    console.log(`\nAnalyzing: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const data = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 'No table found';
      
      const headers = Array.from(table.querySelectorAll('th, td:first-child'))
        .slice(0, 10)
        .map(h => h.innerText.trim());
        
      const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 3).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim())
      );
      
      return { headers, rows };
    });
    
    console.log('Headers:', JSON.stringify(data.headers));
    console.log('Row 1:', JSON.stringify(data.rows?.[0]));
  }
  
  await browser.close();
}

debug();
