const { chromium } = require('playwright-extra');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://merolagani.com/', { waitUntil: 'domcontentloaded' });
    const nepse = await page.evaluate(() => {
      const index = document.querySelector('#nepse-value')?.innerText;
      const change = document.querySelector('.nepse-change')?.innerText; // guess
      return { index, change };
    });
    console.log('MeroLagani:', nepse);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
