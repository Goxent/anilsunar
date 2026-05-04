import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_PATH = path.join(__dirname, '../src/app/data/market-omni-data.json')
const LOG_PATH = path.join(__dirname, '../logs/login-debug.png')

const GUARANTEED_PAGES = [
  'https://nepsealpha.com/sastoshare',
  'https://nepsealpha.com/sastoshare/swing-trader',
  'https://nepsealpha.com/sastoshare/broker-analysis',
  'https://nepsealpha.com/sastoshare/sector-performance',
  'https://nepsealpha.com/sastoshare/stock-health',
  'https://nepsealpha.com/trading-menu/top-stocks',
  'https://nepsealpha.com/nepse-data/eod',
  'https://nepsealpha.com/trading/live-market',
]

function buildStructuredData(scrapedPages) {
  const structured = {
    marketIndex: {},
    topStocks: [],
    brokerData: [],
    swingSignals: [],
    sectorData: [],
    floorsheet: []
  }

  scrapedPages.forEach(page => {
    const url = page.url || ''
    const tables = page.tables || []

    tables.forEach(table => {
      const headers = (table.headers || []).map(h => (h || '').toLowerCase())
      const rows = table.rows || []

      // Market index — key-value pairs
      if (url.includes('eod') || url.includes('daily') ||
        page.title?.toLowerCase().includes('summary')) {
        rows.forEach(row => {
          const key = row.Col_0 || row.Label || row.Metric || row.Name
          const val = row.Col_1 || row.Value || row.Data
          if (key && val) {
            structured.marketIndex[key.trim()] = String(val).trim()
          }
        })
      }

      // Stock list — has Symbol and LTP or Price columns
      if (headers.some(h => h.includes('symbol') || h.includes('ltp') || h.includes('price'))) {
        rows.forEach(row => {
          const symbol = row.Symbol || row['Stock Symbol'] || row.Col_0
          const ltp = parseFloat(
            String(row.LTP || row['Price(NPR)'] || row['Last Price'] || row.Col_1 || '0')
            .replace(/,/g, '')
          )
          const change = row['Percent Change'] || row['Change%'] || row.Change || '0%'
          const volume = parseInt(
            String(row.Volume || row['Trade Volume'] || row.Col_3 || '0')
            .replace(/,/g, '')
          ) || 0

          if (symbol && ltp > 0) {
            const existing = structured.topStocks.find(s => s.symbol === symbol)
            if (!existing) {
              structured.topStocks.push({ symbol, ltp, change, volume })
            }
          }
        })
      }

      // Broker data
      if (url.includes('broker') || url.includes('floorsheet') ||
        headers.some(h => h.includes('broker') || h.includes('buy qty'))) {
        rows.forEach(row => {
          const symbol = row.Symbol || row.Stock || row.Col_0
          const broker = row.Broker || row['Broker Name'] || row.Col_1
          const buyQty = parseInt(String(row['Buy Qty'] || row.Buy || '0').replace(/,/g, '')) || 0
          const sellQty = parseInt(String(row['Sell Qty'] || row.Sell || '0').replace(/,/g, '')) || 0
          if (symbol || broker) {
            structured.brokerData.push({ symbol, broker, buyQty, sellQty, netQty: buyQty - sellQty })
          }
        })
      }

      // Swing signals
      if (url.includes('swing') ||
        headers.some(h => h.includes('signal') || h.includes('action') || h.includes('recommendation'))) {
        rows.forEach(row => {
          const symbol = row.Symbol || row.Stock
          const signal = row.Signal || row.Action || row.Recommendation || row.Col_1
          const price = row.Price || row.LTP || row.Col_2
          if (symbol && signal) {
            structured.swingSignals.push({ symbol, signal, price })
          }
        })
      }

      // Sector data
      if (url.includes('sector') ||
        headers.some(h => h.includes('sector'))) {
        rows.forEach(row => {
          const sector = row.Sector || row['Sector Name'] || row.Col_0
          const change = row['% Change'] || row.Change || row.Col_1
          const turnover = row.Turnover || row.Col_2
          if (sector) {
            structured.sectorData.push({ sector, change, turnover })
          }
        })
      }
    })
  })

  return structured
}

async function scrape() {
  console.log('🕷️ Omni Crawler (Stealth) — Starting...')
  
  // 0. CREATE BACKUP (Graceful Degradation)
  const backupPath = OUTPUT_PATH.replace('.json', '.backup.json')
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.copyFileSync(OUTPUT_PATH, backupPath)
    console.log('💾 Created backup of previous data.')
  }

  // Inject stealth plugin to bypass Cloudflare/Bot-detection
  chromium.use(stealth())

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled'
    ]
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  const dataLake = {
    timestamp: new Date().toISOString(),
    scrapedPages: []
  }

  try {
    // 1. LOGIN
    console.log('🔑 Logging into Sasto Share...')
    await page.goto('https://nepsealpha.com/login')
    await page.fill('input[type="email"], input[name="email"], #email', process.env.SASTO_EMAIL || '')
    await page.fill('input[type="password"], input[name="password"], #password', process.env.SASTO_PASSWORD || '')
    await page.click('button[type="submit"], .login-btn, button:has-text("Login"), button:has-text("Sign In")')

    try {
      await Promise.race([
        page.waitForURL(/dashboard|home|sastoshare|portfolio/, { timeout: 20000 }),
        page.waitForSelector('.navbar-user, .user-menu, [data-user], .logout-btn, .user-avatar', { timeout: 20000 }),
        page.waitForFunction(
          () => !window.location.href.includes('/login') && !window.location.href.includes('/signin'),
          { timeout: 20000 }
        )
      ])
      console.log('✅ Login successful')
    } catch {
      console.log('⚠️ Login timeout — may already be logged in or different UI')
      await page.screenshot({ path: LOG_PATH, fullPage: true })
    }

    // 2. SCRAPE PAGES
    for (const url of GUARANTEED_PAGES) {
      console.log(`🔍 Scraping: ${url}...`)
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        const title = await page.title()
        
        // Extract tables
        const tables = await page.evaluate(() => {
          const results = []
          document.querySelectorAll('table').forEach(table => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim())
            const rows = Array.from(table.querySelectorAll('tr')).slice(1).map(tr => {
              const row = {}
              Array.from(tr.querySelectorAll('td')).forEach((td, i) => {
                const key = headers[i] || `Col_${i}`
                row[key] = td.innerText.trim()
              })
              return row
            })
            if (rows.length > 0) results.push({ headers, rows })
          })
          return results
        })

        dataLake.scrapedPages.push({ url, title, tables })
        console.log(`   ✅ Found ${tables.length} tables`)
      } catch (err) {
        console.warn(`   ⚠️ Error scraping ${url}: ${err.message}`)
      }
    }

    // 3. STRUCTURE DATA
    dataLake.structured = buildStructuredData(dataLake.scrapedPages)
    dataLake.summary = {
      stockCount: dataLake.structured.topStocks.length,
      brokerRecords: dataLake.structured.brokerData.length,
      swingSignals: dataLake.structured.swingSignals.length,
      hasMarketIndex: Object.keys(dataLake.structured.marketIndex).length > 0,
      pagesScraped: dataLake.scrapedPages.length,
      dataQuality: dataLake.structured.topStocks.length > 0 ? 'good' : 'empty'
    }

    console.log('\n📊 Structured data summary:')
    console.log(JSON.stringify(dataLake.summary, null, 2))

    // 4. VALIDATE & SAVE
    if (dataLake.summary.stockCount === 0 || dataLake.summary.dataQuality === 'empty') {
      console.error('\n❌ CRITICAL: Scraper yielded 0 stocks. Site may be blocking us or layout changed.')
      if (fs.existsSync(backupPath)) {
        console.log('🔄 Restoring data from backup...')
        fs.copyFileSync(backupPath, OUTPUT_PATH)
        console.log('✅ Backup restored successfully.')
      }
      process.exit(1) // Fail the GitHub Action so the user is notified
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataLake, null, 2))
    console.log(`\n✅ Saved to: ${OUTPUT_PATH}`)

  } catch (err) {
    console.error('❌ Fatal error during scrape:', err)
  } finally {
    await browser.close()
  }
}

scrape()
