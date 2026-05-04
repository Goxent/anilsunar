import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, '../src/app/data/nepal-news.json')

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchHtml(url, timeout = 12000) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeout)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

function cleanText(t) {
  return (t || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim()
}

function extractArticles(html, source, config) {
  const articles = []
  const seen = new Set()

  const patterns = [
    /<h[23][^>]*class="[^"]*(?:title|headline|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h[23]>/gi,
    /<a[^>]*href="([^"]*)"[^>]*class="[^"]*(?:title|headline)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi,
  ]

  for (const pattern of patterns) {
    let m
    while ((m = pattern.exec(html)) !== null && articles.length < 15) {
      const rawTitle = m[2] || m[1] || ''
      const title = cleanText(rawTitle)
      if (!title || title.length < 15 || title.length > 300) continue
      if (seen.has(title.toLowerCase())) continue

      const titleLower = title.toLowerCase()
      const isRelevant = config.keywords.some(k => titleLower.includes(k))
      if (!isRelevant) continue

      seen.add(title.toLowerCase())

      const beforeMatch = html.slice(Math.max(0, m.index - 200), m.index)
      const urlMatch = beforeMatch.match(/href="([^"]+)"[^>]*>\s*$/) ||
        html.slice(m.index, m.index + 500).match(/href="([^"]+)"/)

      let url = urlMatch?.[1] || config.url
      if (url.startsWith('/')) url = new URL(config.url).origin + url
      if (!url.startsWith('http')) url = config.url

      articles.push({
        title,
        url,
        source: source.name,
        badge: source.badge,
        category: source.category,
        scrapedAt: new Date().toISOString(),
        summary: title,
        isGlobal: source.isGlobal || false
      })
    }
    if (articles.length >= 8) break
  }

  return articles.slice(0, 8)
}

// ────────────────────────────────────────────────
// News sources
// ────────────────────────────────────────────────
const NEPAL_SOURCES = [
  { name: 'Onlinekhabar Finance', badge: 'OK',
    url: 'https://english.onlinekhabar.com/category/business',
    category: 'Nepal Business',
    keywords: ['nepse','bank','economy','finance','stock','market','tax','company','billion','crore'] },
  { name: 'Karobar Daily', badge: 'KD',
    url: 'https://www.karobardaily.com/',
    category: 'Nepal Business',
    keywords: ['बैंक','शेयर','बजार','अर्थ','कम्पनी','लाभांश','ब्याज','कर','नेप्से'] },
  { name: 'Sharesansar', badge: 'SS',
    url: 'https://www.sharesansar.com/',
    category: 'Nepal Stock',
    keywords: ['nepse','share','stock','broker','dividend','ipo','bonus','right'] },
  { name: 'Nepali Paisa', badge: 'NP',
    url: 'https://nepalipaisa.com/',
    category: 'Nepal Finance',
    keywords: ['market','stock','bank','finance','nepse','economy','company'] },
  { name: 'MeroLagani', badge: 'ML',
    url: 'https://merolagani.com/NewsList.aspx',
    category: 'Nepal Stock',
    keywords: ['nepse','share','company','market','bank','dividend','ipo','analysis'] },
  { name: 'Arthik Abhiyan', badge: 'AA',
    url: 'https://www.arthabodh.com/',
    category: 'Nepal Economy',
    keywords: ['अर्थ','बजेट','राजस्व','नेप्से','कम्पनी','बैंक','बिमा'] },
]

const GLOBAL_SOURCES = [
  { name: 'Reuters Markets', badge: 'RT', isGlobal: true,
    url: 'https://www.reuters.com/markets/asia/',
    category: 'Global Market',
    keywords: ['asia','emerging market','india','china','fed','interest rate','dollar','gold','oil','inflation'] },
  { name: 'Yahoo Finance Asia', badge: 'YF', isGlobal: true,
    url: 'https://finance.yahoo.com/topic/stock-market-news/',
    category: 'Global Finance',
    keywords: ['market','stock','rate','fed','inflation','gdp','economy','asia','emerging','oil','gold'] },
  { name: 'Economic Times Markets', badge: 'ET', isGlobal: true,
    url: 'https://economictimes.indiatimes.com/markets',
    category: 'India Markets',
    keywords: ['sensex','nifty','india','market','economy','rbi','bank','company','stock','ipo'] },
]

// ────────────────────────────────────────────────
// Gemini: generate article summaries
// ────────────────────────────────────────────────
async function generateSummaries(articles, globalArticles) {
  const key = process.env.GEMINI_API_KEY
  if (!key || articles.length === 0) return articles

  const prompt = `You are a Nepal financial news analyst.
Summarize these news articles for a Nepal CA professional. Focus on:
- How each article relates to Nepal's economy, NEPSE, or finance
- Key numbers or facts mentioned
- Actionable insight for investors

Nepal articles: ${JSON.stringify(articles.slice(0,10).map(a=>({title:a.title,source:a.source})))}
Global articles: ${JSON.stringify(globalArticles.slice(0,5).map(a=>({title:a.title,source:a.source})))}

Return JSON array — one entry per article:
[{
  "title": "exact title from input",
  "nepalRelevance": "How this affects Nepal markets (1 sentence)",
  "keyFact": "Most important number or fact",
  "investorAngle": "What should a Nepal investor note"
}]`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      }
    )
    const d = await res.json()
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.search(/[\[{]/)
    const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    const summaries = JSON.parse(clean.slice(s, e+1))

    const summaryMap = {}
    summaries.forEach(s => { summaryMap[s.title] = s })

    return articles.map(a => {
      const s = summaryMap[a.title]
      return s ? { ...a, nepalRelevance: s.nepalRelevance,
        keyFact: s.keyFact, investorAngle: s.investorAngle,
        summary: s.nepalRelevance || a.summary } : a
    })
  } catch { return articles }
}

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────
async function runNewsScraper() {
  console.log('📰 News Scraper — Starting...')

  const allNepal = []
  const allGlobal = []

  // Scrape Nepal sources
  for (const source of NEPAL_SOURCES) {
    console.log(`🔍 ${source.name}...`)
    const html = await fetchHtml(source.url)
    if (html) {
      const articles = extractArticles(html, source, source)
      allNepal.push(...articles)
      console.log(`   ✅ ${articles.length} articles`)
    } else {
      console.log(`   ⚠️ Could not fetch`)
    }
    await sleep(1500)
  }

  // Scrape global sources
  for (const source of GLOBAL_SOURCES) {
    console.log(`🌐 ${source.name}...`)
    const html = await fetchHtml(source.url)
    if (html) {
      const articles = extractArticles(html, source, source)
      allGlobal.push(...articles)
      console.log(`   ✅ ${articles.length} articles`)
    } else {
      console.log(`   ⚠️ Could not fetch`)
    }
    await sleep(1500)
  }

  console.log(`\n📊 Total: ${allNepal.length} Nepal + ${allGlobal.length} global articles`)

  // Gemini summaries
  console.log('🤖 Generating Gemini summaries...')
  const enrichedNepal = await generateSummaries(allNepal, allGlobal)

  const output = {
    scrapedAt: new Date().toISOString(),
    totalCount: enrichedNepal.length + allGlobal.length,
    nepalCount: enrichedNepal.length,
    globalCount: allGlobal.length,
    sources: [
      ...NEPAL_SOURCES.map(s => s.name),
      ...GLOBAL_SOURCES.map(s => s.name)
    ],
    articles: enrichedNepal,
    globalArticles: allGlobal,
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2))
  console.log(`✅ News scraper complete`)
  console.log(`   Nepal: ${enrichedNepal.length} articles`)
  console.log(`   Global: ${allGlobal.length} articles`)
}

runNewsScraper().catch(e => {
  console.error('❌', e.message); process.exit(1)
})
