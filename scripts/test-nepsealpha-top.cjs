const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://nepsealpha.com/trading-menu/top-stocks', { waitUntil: 'domcontentloaded' });
    const nepse = await page.evaluate(() => {
      return document.body.innerText;
    });
    console.log('Nepse body:', nepse.substring(0, 1000));
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
