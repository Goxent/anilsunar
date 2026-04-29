const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Fetching ShareSansar...');
    await page.goto('https://www.sharesansar.com/', { waitUntil: 'domcontentloaded' });
    
    const marketSummary = await page.evaluate(() => {
      // Find the NEPSE value. Usually it's in a top banner or table.
      // In ShareSansar, there's usually an id="nepse-index" or a table with class "table"
      const indexElement = document.querySelector('.index-val, #nepse_index, .index-header');
      if (indexElement) return indexElement.innerText;
      
      // Look for a table row that contains "NEPSE"
      const tds = Array.from(document.querySelectorAll('td'));
      const nepseTd = tds.find(td => td.innerText.trim().toUpperCase() === 'NEPSE');
      if (nepseTd && nepseTd.nextElementSibling) {
         return {
           index: nepseTd.nextElementSibling.innerText.trim(),
           change: nepseTd.nextElementSibling.nextElementSibling?.innerText.trim(),
           percent: nepseTd.nextElementSibling.nextElementSibling?.nextElementSibling?.innerText.trim()
         };
      }
      return null;
    });
    console.log('Market Summary:', marketSummary);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
