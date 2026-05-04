import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function load(filename) {
  const p = path.join(__dirname, '../src/app/data', filename)
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function parseBrokerDataFromOmni(omniData) {
  const brokerRecords = []
  const pages = omniData?.scrapedPages || []

  // Use structured data first
  const structured = omniData?.structured?.brokerData || []
  if (structured.length > 0) {
    return structured.map(r => ({
      symbol: String(r.symbol || '').toUpperCase(),
      broker: String(r.broker || ''),
      buyQty: parseInt(r.buyQty) || 0,
      sellQty: parseInt(r.sellQty) || 0,
      netQty: parseInt(r.netQty) || (parseInt(r.buyQty) - parseInt(r.sellQty)) || 0,
    })).filter(r => r.symbol && r.broker)
  }

  // Fallback: search all pages for broker tables
  pages.forEach(page => {
    const url = (page.url || '').toLowerCase()
    if (!url.includes('broker') && !url.includes('floorsheet')) return
    ;(page.tables || []).forEach(table => {
      const headers = (table.headers || []).map(h => String(h).toLowerCase())
      if (!headers.some(h => h.includes('broker') || h.includes('buy'))) return
      ;(table.rows || []).forEach(row => {
        const sym = row.Symbol || row.Stock || row.Col_0
        const broker = row.Broker || row['Broker Name'] || row.Col_1
        const buyQty = parseInt(String(row['Buy Qty'] || row.Buy || '0').replace(/,/g, '')) || 0
        const sellQty = parseInt(String(row['Sell Qty'] || row.Sell || '0').replace(/,/g, '')) || 0
        if (sym && broker) {
          brokerRecords.push({
            symbol: String(sym).toUpperCase(),
            broker: String(broker),
            buyQty,
            sellQty,
            netQty: buyQty - sellQty,
          })
        }
      })
    })
  })

  return brokerRecords
}

async function runBrokerTracker() {
  console.log('📊 Broker Tracker — Starting...')

  const omniData = load('market-omni-data.json')
  if (!omniData) {
    console.log('❌ No omni data — run npm run omni-sync first')
    process.exit(1)
  }

  const records = parseBrokerDataFromOmni(omniData)
  console.log(`📋 Raw broker records: ${records.length}`)

  // Aggregate by stock
  const stockAgg = {}
  records.forEach(r => {
    if (!stockAgg[r.symbol]) {
      stockAgg[r.symbol] = {
        symbol: r.symbol,
        totalBuyQty: 0,
        totalSellQty: 0,
        netQty: 0,
        topBuyers: [],
        topSellers: [],
        brokerCount: 0,
        sentiment: 'NEUTRAL'
      }
    }
    stockAgg[r.symbol].totalBuyQty += r.buyQty
    stockAgg[r.symbol].totalSellQty += r.sellQty
    stockAgg[r.symbol].netQty += r.netQty
    stockAgg[r.symbol].brokerCount++

    if (r.netQty > 0) {
      stockAgg[r.symbol].topBuyers.push({ broker: r.broker, qty: r.netQty })
    } else if (r.netQty < 0) {
      stockAgg[r.symbol].topSellers.push({ broker: r.broker, qty: Math.abs(r.netQty) })
    }
  })

  // Compute sentiment and sort
  const stocks = Object.values(stockAgg).map(s => {
    s.topBuyers.sort((a, b) => b.qty - a.qty)
    s.topSellers.sort((a, b) => b.qty - a.qty)
    s.topBuyers = s.topBuyers.slice(0, 3)
    s.topSellers = s.topSellers.slice(0, 3)

    if (s.netQty > s.totalBuyQty * 0.3) s.sentiment = 'STRONG_ACCUMULATION'
    else if (s.netQty > 0) s.sentiment = 'ACCUMULATION'
    else if (s.netQty < -(s.totalSellQty * 0.3)) s.sentiment = 'STRONG_DISTRIBUTION'
    else if (s.netQty < 0) s.sentiment = 'DISTRIBUTION'

    return s
  })

  stocks.sort((a, b) => b.netQty - a.netQty)

  const topAccumulating = stocks.filter(s =>
    s.sentiment === 'STRONG_ACCUMULATION' || s.sentiment === 'ACCUMULATION'
  ).slice(0, 10)

  const output = {
    generatedAt: new Date().toISOString(),
    daysAnalyzed: 1,
    stocksTracked: stocks.length,
    brokerRecordsProcessed: records.length,
    topAccumulating: topAccumulating.map(s => s.symbol),
    stocks: stocks.slice(0, 50),
    summary: {
      accumulatingCount: stocks.filter(s => s.netQty > 0).length,
      distributingCount: stocks.filter(s => s.netQty < 0).length,
      strongAccumulationCount: stocks.filter(s => s.sentiment === 'STRONG_ACCUMULATION').length,
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '../src/app/data/broker-flow-5d.json'),
    JSON.stringify(output, null, 2)
  )

  console.log(`✅ Broker Tracker complete`)
  console.log(`   Stocks tracked: ${stocks.length}`)
  console.log(`   Accumulating: ${output.summary.accumulatingCount}`)
  console.log(`   Strong accumulation: ${output.summary.strongAccumulationCount}`)
}

runBrokerTracker().catch(e => {
  console.error('❌', e.message); process.exit(1)
})
