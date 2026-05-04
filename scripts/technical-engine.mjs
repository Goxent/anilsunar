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

// ────────────────────────────────────────────────
// Parse stocks from omni data
// ────────────────────────────────────────────────
function parseStocksFromOmni(omniData) {
  const stocks = []
  const seen = new Set()

  const pages = omniData?.scrapedPages || []
  const structured = omniData?.structured?.topStocks || []

  // Use structured data first (most reliable)
  structured.forEach(s => {
    if (!s.symbol || seen.has(s.symbol)) return
    seen.add(s.symbol)
    stocks.push({
      symbol: s.symbol.toUpperCase(),
      ltp: parseFloat(String(s.ltp).replace(/,/g, '')) || 0,
      changePct: parseFloat(String(s.change).replace(/%/g, '')) || 0,
      volume: parseInt(String(s.volume).replace(/,/g, '')) || 0,
    })
  })

  // Fallback: parse all tables
  if (stocks.length < 10) {
    pages.forEach(page => {
      ;(page.tables || []).forEach(table => {
        const headers = (table.headers || []).map(h => String(h).toLowerCase())
        if (!headers.some(h => h.includes('symbol') || h.includes('ltp'))) return
        ;(table.rows || []).forEach(row => {
          const sym = row.Symbol || row['Stock Symbol'] || row.Col_0
          const ltpRaw = row.LTP || row['Price(NPR)'] || row['Last Price'] || row.Col_1
          const ltp = parseFloat(String(ltpRaw).replace(/,/g, ''))
          const change = row['Percent Change'] || row['Change%'] || row.Change || '0'
          const vol = row.Volume || row['Trade Volume'] || '0'
          if (sym && !seen.has(sym) && ltp > 0) {
            seen.add(sym)
            stocks.push({
              symbol: String(sym).toUpperCase(),
              ltp,
              changePct: parseFloat(String(change).replace(/%/g, '')) || 0,
              volume: parseInt(String(vol).replace(/,/g, '')) || 0,
            })
          }
        })
      })
    })
  }

  return stocks
}

// ────────────────────────────────────────────────
// Technical scoring (pure math, no AI)
// ────────────────────────────────────────────────
function computeTechnicalScore(stock, fundamental) {
  let score = 50  // Base score
  const signals = []
  const flags = []

  const { ltp, changePct, volume } = stock

  // Momentum signal
  if (changePct > 3) { score += 15; signals.push('STRONG_MOMENTUM') }
  else if (changePct > 1) { score += 8; signals.push('POSITIVE_MOMENTUM') }
  else if (changePct < -3) { score -= 15; flags.push('STRONG_SELLOFF') }
  else if (changePct < -1) { score -= 8; flags.push('NEGATIVE_MOMENTUM') }

  // Volume signal (high volume = conviction)
  if (volume > 100000) { score += 10; signals.push('HIGH_VOLUME') }
  else if (volume > 50000) { score += 5; signals.push('MODERATE_VOLUME') }
  else if (volume < 10000) { score -= 5; flags.push('LOW_VOLUME') }

  // Fundamental overlay
  if (fundamental) {
    const pe = parseFloat(fundamental.pe) || 0
    const eps = parseFloat(fundamental.eps) || 0
    const bv = parseFloat(fundamental.bookValue) || 0
    const pbRatio = bv > 0 ? ltp / bv : 0

    if (eps > 0 && pe > 0 && pe < 20) { score += 10; signals.push('LOW_PE') }
    if (eps > 20) { score += 8; signals.push('HIGH_EPS') }
    if (pbRatio > 0 && pbRatio < 1.5) { score += 5; signals.push('BELOW_BOOK') }
    if (pe > 50) { score -= 10; flags.push('OVERVALUED_PE') }
  }

  score = Math.max(0, Math.min(100, score))

  let recommendation = 'NEUTRAL'
  if (score >= 75) recommendation = 'STRONG_BUY'
  else if (score >= 65) recommendation = 'BUY'
  else if (score >= 55) recommendation = 'ACCUMULATE'
  else if (score <= 30) recommendation = 'SELL'
  else if (score <= 40) recommendation = 'AVOID'

  return { score, signals, flags, recommendation }
}

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────
async function runTechnicalEngine() {
  console.log('⚙️  Technical Engine — Starting...')

  const omniData = load('market-omni-data.json')
  const fundData = load('fundamental-data.json')

  if (!omniData) {
    console.log('❌ No omni data — run npm run omni-sync first')
    process.exit(1)
  }

  const stocks = parseStocksFromOmni(omniData)
  console.log(`📊 Found ${stocks.length} stocks from omni data`)

  if (stocks.length === 0) {
    console.log('❌ No stocks parsed — check market-omni-data.json structure')
    process.exit(1)
  }

  // Build fundamental lookup
  const fundMap = {}
  ;(fundData?.stocks || []).forEach(s => {
    fundMap[s.symbol?.toUpperCase()] = s
  })

  // Compute technical scores for all stocks
  const scored = stocks.map(stock => {
    const fund = fundMap[stock.symbol]
    const technical = computeTechnicalScore(stock, fund)
    return {
      symbol: stock.symbol,
      ltp: stock.ltp,
      changePct: stock.changePct,
      volume: stock.volume,
      technicalScore: technical.score,
      signals: technical.signals,
      flags: technical.flags,
      recommendation: technical.recommendation,
      eps: parseFloat(fund?.eps) || null,
      pe: parseFloat(fund?.pe) || null,
      bookValue: parseFloat(fund?.bookValue) || null,
    }
  })

  // Sort by score descending
  scored.sort((a, b) => b.technicalScore - a.technicalScore)

  const topCandidates = scored
    .filter(s => s.recommendation === 'STRONG_BUY' || s.recommendation === 'BUY')
    .slice(0, 20)

  const output = {
    computedAt: new Date().toISOString(),
    totalStocksAnalyzed: scored.length,
    topCandidates: topCandidates.map(s => ({
      symbol: s.symbol,
      score: s.technicalScore,
      recommendation: s.recommendation,
      signals: s.signals,
    })),
    stocks: scored,
    summary: {
      bullishCount: scored.filter(s => s.changePct > 0).length,
      bearishCount: scored.filter(s => s.changePct < 0).length,
      avgScore: Math.round(scored.reduce((s, x) => s + x.technicalScore, 0) / scored.length),
    }
  }

  save('technical-signals.json', output)
  console.log(`✅ Technical Engine complete`)
  console.log(`   Stocks analyzed: ${scored.length}`)
  console.log(`   Strong Buy candidates: ${topCandidates.length}`)
  console.log(`   Market breadth: ${output.summary.bullishCount} up / ${output.summary.bearishCount} down`)
}

runTechnicalEngine().catch(e => {
  console.error('❌', e.message); process.exit(1)
})
