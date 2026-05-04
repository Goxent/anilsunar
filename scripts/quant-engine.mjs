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

function save(filename, data) {
  const p = path.join(__dirname, '../src/app/data', filename)
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

function parseNumber(val) {
  if (!val) return 0
  const parsed = parseFloat(String(val).replace(/,/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────
async function runQuantEngine() {
  console.log('📈 Starting BlackRock Quant Engine V1...')

  const omniData = load('market-omni-data.json')
  const fundData = load('fundamental-data.json')
  const techData = load('technical-signals.json')
  const brokData = load('broker-flow-5d.json')

  if (!omniData || !omniData.structured?.topStocks) {
    console.error('❌ Omni data missing.')
    process.exit(1)
  }

  // 1. Build Base Dataset
  const stocksMap = new Map()

  // Add omni (LTP, Volume, Sector)
  const sectorFallbackMap = new Map()
  ;(omniData.scrapedPages || []).forEach(page => {
    ;(page.tables || []).forEach(table => {
      ;(table.rows || []).forEach(row => {
        const sym = (row['Symbol'] || row['Stock Symbol'] || row.Col_0 || '').toUpperCase()
        const sec = row['Sector']
        if (sym && sec) sectorFallbackMap.set(sym, sec)
      })
    })
  })

  omniData.structured.topStocks.forEach(s => {
    const sym = s.symbol.toUpperCase()
    stocksMap.set(sym, {
      symbol: sym,
      ltp: parseNumber(s.ltp),
      changePct: parseNumber(s.change),
      volume: parseNumber(s.volume),
      sector: sectorFallbackMap.get(sym) || 'Unknown'
    })
  })

  // Add Fundamentals
  ;(fundData?.stocks || []).forEach(s => {
    const sym = s.symbol.toUpperCase()
    if (stocksMap.has(sym)) {
      const stock = stocksMap.get(sym)
      stock.pe = parseNumber(s.pe)
      stock.eps = parseNumber(s.eps)
      stock.bookValue = parseNumber(s.bookValue)
      stock.pb = stock.bookValue > 0 ? stock.ltp / stock.bookValue : 0
      if (s.sector && stock.sector === 'Unknown') stock.sector = s.sector
    }
  })

  // Add Technicals
  ;(techData?.stocks || []).forEach(s => {
    const sym = s.symbol.toUpperCase()
    if (stocksMap.has(sym)) {
      stocksMap.get(sym).techScore = s.technicalScore || 0
      stocksMap.get(sym).techSignal = s.recommendation || 'NEUTRAL'
    }
  })

  // Add Broker Flow
  ;(brokData?.brokerFlow || []).forEach(s => {
    const sym = s.symbol.toUpperCase()
    if (stocksMap.has(sym)) {
      stocksMap.get(sym).brokerNet = parseNumber(s.netQty)
      stocksMap.get(sym).brokerSentiment = s.sentiment || 'NEUTRAL'
    }
  })

  // Add Swing Signals
  ;(omniData.structured.swingSignals || []).forEach(s => {
    const sym = s.symbol.toUpperCase()
    if (stocksMap.has(sym)) {
      stocksMap.get(sym).swingSignal = s.signal || 'None'
    }
  })

  const allStocks = Array.from(stocksMap.values()).filter(s => s.ltp > 0)

  // 2. Compute Sector Averages for Normalization
  const sectorStats = {}
  allStocks.forEach(s => {
    if (!sectorStats[s.sector]) {
      sectorStats[s.sector] = { peSum: 0, peCount: 0, pbSum: 0, pbCount: 0 }
    }
    if (s.pe > 0 && s.pe < 100) { // filter extreme outliers
      sectorStats[s.sector].peSum += s.pe
      sectorStats[s.sector].peCount++
    }
    if (s.pb > 0 && s.pb < 20) {
      sectorStats[s.sector].pbSum += s.pb
      sectorStats[s.sector].pbCount++
    }
  })

  Object.keys(sectorStats).forEach(sec => {
    const stat = sectorStats[sec]
    stat.avgPe = stat.peCount > 0 ? stat.peSum / stat.peCount : 20 // Default PE 20
    stat.avgPb = stat.pbCount > 0 ? stat.pbSum / stat.pbCount : 2  // Default PB 2
  })

  // 3. Compute Quant Master Score (0 - 100)
  allStocks.forEach(s => {
    const stat = sectorStats[s.sector] || { avgPe: 20, avgPb: 2 }
    
    // A. Fundamental Score (Max 35 points)
    let fundScore = 0
    // PE logic: Lower than sector avg is good. If PE is negative or 0, give 0.
    if (s.pe > 0) {
      if (s.pe < stat.avgPe * 0.5) fundScore += 15
      else if (s.pe < stat.avgPe * 0.8) fundScore += 10
      else if (s.pe < stat.avgPe) fundScore += 5
    }
    // PB logic: Lower than sector avg is good.
    if (s.pb > 0) {
      if (s.pb < stat.avgPb * 0.5) fundScore += 10
      else if (s.pb < stat.avgPb) fundScore += 5
    }
    // EPS absolute strength
    if (s.eps > 40) fundScore += 10
    else if (s.eps > 20) fundScore += 5
    else if (s.eps > 0) fundScore += 2

    // B. Momentum Score (Max 35 points)
    let momScore = 0
    // Convert tech score (0-100) to max 20 points
    momScore += ((s.techScore || 50) / 100) * 20
    // Price action
    if (s.changePct > 5) momScore += 10
    else if (s.changePct > 2) momScore += 5
    else if (s.changePct < -2) momScore -= 5
    // Volume (basic logic, assuming > 50k is notable)
    if (s.volume > 100000) momScore += 5

    // C. Institutional Score (Max 30 points)
    let instScore = 0
    if (s.brokerNet > 50000) instScore += 30
    else if (s.brokerNet > 20000) instScore += 20
    else if (s.brokerNet > 5000) instScore += 10
    else if (s.brokerNet < -20000) instScore -= 10
    
    if (s.brokerSentiment.includes('STRONG_BUY')) instScore += 5

    // Total
    s.fundScore = Math.max(0, Math.min(35, fundScore))
    s.momScore = Math.max(0, Math.min(35, momScore))
    s.instScore = Math.max(0, Math.min(30, instScore))
    
    s.masterScore = s.fundScore + s.momScore + s.instScore
  })

  // 4. Sort & Diversify
  allStocks.sort((a, b) => b.masterScore - a.masterScore)

  const top10 = []
  const sectorCounts = {}

  for (const stock of allStocks) {
    if (top10.length >= 10) break
    
    const count = sectorCounts[stock.sector] || 0
    if (count < 2) { // Max 2 per sector
      top10.push(stock)
      sectorCounts[stock.sector] = count + 1
    }
  }

  // 5. Save Output
  const output = {
    computedAt: new Date().toISOString(),
    totalAnalyzed: allStocks.length,
    sectorAverages: sectorStats,
    top10: top10
  }

  save('quant-top10.json', output)
  
  console.log(`✅ Quant Engine complete`)
  console.log(`   Top 10 Stocks Selected:`)
  top10.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.symbol} (Score: ${s.masterScore.toFixed(1)} | Sector: ${s.sector})`)
  })
}

runQuantEngine().catch(e => {
  console.error('❌', e.message); process.exit(1)
})
