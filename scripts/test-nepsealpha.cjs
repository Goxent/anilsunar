const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://nepsealpha.com', { waitUntil: 'domcontentloaded' });
    
    const summary = await page.evaluate(() => {
      // Find elements that contain "NEPSE" and numbers
      const texts = Array.from(document.querySelectorAll('*')).filter(el => {
         return el.innerText && el.innerText.includes('NEPSE') && /\d{4}/.test(el.innerText) && el.children.length === 0;
      }).map(el => el.innerText);
      return texts;
    });
    console.log('Summary texts:', summary);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
