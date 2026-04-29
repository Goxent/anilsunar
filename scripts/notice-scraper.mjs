import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '../src/app/data/notices.json')
const EXISTING_PATH = path.join(__dirname, '../src/app/data/notices.json')

// ============================================================
// SOURCES — All Nepal regulatory websites to scrape
// ============================================================
const SOURCES = [
  {
    name: 'OCR Nepal',
    url: 'https://ocr.gov.np/',
    category: 'Corporate Law',
    badge: 'OCR',
    color: '#1a73e8',
    keywords: ['notice', 'circular', 'update', 'registration', 'deadline',
      'regulation', 'act', 'rule', 'form', 'सूचना', 'परिपत्र']
  },
  {
    name: 'IRD Nepal',
    url: 'https://ird.gov.np/',
    category: 'Taxation',
    badge: 'IRD',
    color: '#e53935',
    keywords: ['notice', 'circular', 'tax', 'vat', 'return', 'filing',
      'deadline', 'revenue', 'income', 'tds', 'pan', 'सूचना']
  },
  {
    name: 'ICAN Nepal',
    url: 'https://en.ican.org.np/en/',
    category: 'Auditing',
    badge: 'ICAN',
    color: '#2e7d32',
    keywords: ['notice', 'circular', 'exam', 'result', 'training',
      'announcement', 'update', 'audit', 'standard']
  },
  {
    name: 'SEBON Nepal',
    url: 'https://sebon.gov.np/',
    category: 'Securities Law',
    badge: 'SEBON',
    color: '#6a1b9a',
    keywords: ['notice', 'circular', 'regulation', 'securities', 'ipo',
      'listing', 'directive', 'order', 'सूचना', 'परिपत्र']
  },
  {
    name: 'NRB Nepal',
    url: 'https://www.nrb.org.np/category/notices/',
    category: 'Banking',
    badge: 'NRB',
    color: '#e65100',
    keywords: ['notice', 'circular', 'directive', 'banking', 'forex',
      'monetary', 'bfi', 'interest', 'rate']
  },
  {
    name: 'NEPSE',
    url: 'https://www.nepalstock.com.np/company-notice',
    category: 'Stock Market',
    badge: 'NEPSE',
    color: '#00695c',
    keywords: ['notice', 'dividend', 'agm', 'right', 'bonus', 'ipo',
      'listing', 'announcement', 'circular']
  },
  {
    name: 'Ministry of Finance',
    url: 'https://mof.gov.np/en/notice',
    category: 'Finance',
    badge: 'MOF',
    color: '#283593',
    keywords: ['notice', 'budget', 'policy', 'circular', 'directive',
      'fiscal', 'revenue', 'expenditure']
  }
]

// ============================================================
// FETCHER — Downloads HTML from a website
// ============================================================
async function fetchWebsite(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`⚠️  ${url} returned status ${response.status}`)
      return null
    }

    return await response.text()
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`⚠️  Timeout fetching ${url}`)
    } else {
      console.warn(`⚠️  Error fetching ${url}: ${err.message}`)
    }
    return null
  }
}

// ============================================================
// PARSER — Extracts notices from HTML
// ============================================================
function parseNotices(html, source) {
  const notices = []
  const seen = new Set()

  // Extract all anchor tags
  const linkPattern = /<a[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1].trim()
    const rawText = match[2].replace(/<[^>]*>/g, '').trim()
    const title = cleanText(rawText)

    if (!title || title.length < 12 || title.length > 300) continue
    if (seen.has(title.toLowerCase())) continue

    if (isRelevantNotice(title, source.keywords)) {
      seen.add(title.toLowerCase())
      const fullLink = buildFullUrl(href, source.url)

      notices.push({
        id: generateId(title, source.name),
        title,
        source: source.name,
        category: source.category,
        badge: source.badge,
        badgeColor: source.color,
        link: fullLink,
        summary: buildSummary(title, source.name),
        detectedAt: new Date().toISOString(),
        isNew: true
      })
    }
  }

  // Also try to get dates near notices
  // Look for date patterns near notice titles
  const datePattern = /(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{1,2}\s+\w+\s+\d{4})/g

  return notices.slice(0, 15) // max 15 per source
}

// ============================================================
// HELPERS
// ============================================================
function cleanText(text) {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isRelevantNotice(title, keywords) {
  if (!title || title.length < 12) return false
  // Skip navigation items
  const skipWords = ['home', 'about', 'contact', 'login', 'sign in',
    'facebook', 'twitter', 'youtube', 'skip to', 'menu', 'search']
  const titleLower = title.toLowerCase()
  if (skipWords.some(w => titleLower === w || titleLower.startsWith(w + ' '))) return false
  return keywords.some(k => titleLower.includes(k.toLowerCase()))
}

function buildFullUrl(href, baseUrl) {
  if (!href || href === '#' || href === '' || href.startsWith('javascript')) return baseUrl
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) {
    const base = baseUrl.match(/^https?:\/\/[^/]+/)
    return base ? base[0] + href : baseUrl
  }
  return baseUrl + '/' + href
}

function generateId(title, source) {
  const str = (source + title).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32)
  return str + '_' + Date.now().toString(36)
}

function buildSummary(title, sourceName) {
  const sourceDescriptions = {
    'OCR Nepal': 'New notice from Office of Company Registrar affecting company compliance',
    'IRD Nepal': 'New update from Inland Revenue Department affecting tax obligations',
    'ICAN Nepal': 'New update from ICAN affecting chartered accountants and auditors',
    'SEBON Nepal': 'New circular from Securities Board affecting capital markets',
    'NRB Nepal': 'New directive from Nepal Rastra Bank affecting banking sector',
    'NEPSE': 'New market notice from Nepal Stock Exchange',
    'Ministry of Finance': 'New policy notice from Ministry of Finance'
  }
  return (sourceDescriptions[sourceName] || 'New regulatory notice') + ': ' + title
}

// ============================================================
// DEDUPLICATION — checks against existing saved notices
// ============================================================
function loadExistingNotices() {
  try {
    if (fs.existsSync(EXISTING_PATH)) {
      const raw = fs.readFileSync(EXISTING_PATH, 'utf8')
      const data = JSON.parse(raw)
      return data.notices || []
    }
  } catch (e) {
    console.warn('⚠️  Could not load existing notices:', e.message)
  }
  return []
}

function detectNewNotices(scraped, existing) {
  const existingTitles = new Set(
    existing.map(n => n.title?.toLowerCase().trim())
  )

  return scraped.filter(notice => {
    const titleLower = notice.title.toLowerCase().trim()
    // Check exact match
    if (existingTitles.has(titleLower)) return false
    // Check if very similar (one contains the other and length > 20)
    for (const existing of existingTitles) {
      if (existing.length > 20 && titleLower.length > 20) {
        if (existing.includes(titleLower) || titleLower.includes(existing)) return false
      }
    }
    return true
  })
}

// ============================================================
// SLEEP helper
// ============================================================
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================
// MAIN FUNCTION
// ============================================================
async function runNoticeScraper() {
  console.log('🚀 Notice Scraper Nepal — Starting...')
  console.log('⏰ Run time:', new Date().toLocaleString())

  const existingNotices = loadExistingNotices()
  console.log(`📋 Existing notices: ${existingNotices.length}`)

  const allScraped = []

  for (const source of SOURCES) {
    console.log(`\n🔍 Scraping: ${source.name} (${source.url})`)
    const html = await fetchWebsite(source.url)

    if (html) {
      const notices = parseNotices(html, source)
      console.log(`   Found: ${notices.length} notices`)
      allScraped.push(...notices)
    } else {
      console.log(`   ⚠️  Skipped — could not fetch`)
    }

    // Wait 2 seconds between requests to be polite
    await sleep(2000)
  }

  console.log(`\n📊 Total scraped: ${allScraped.length}`)

  // Detect only new ones
  const newNotices = detectNewNotices(allScraped, existingNotices)
  console.log(`🆕 New notices: ${newNotices.length}`)

  // Merge new with existing (newest first, max 200 total)
  const merged = [...newNotices, ...existingNotices].slice(0, 200)

  // Save to file
  const output = {
    lastUpdated: new Date().toISOString(),
    totalCount: merged.length,
    newCount: newNotices.length,
    sources: SOURCES.map(s => s.name),
    notices: merged
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved ${merged.length} notices to notices.json`)
  console.log(`   New this run: ${newNotices.length}`)

  return { allScraped, newNotices, merged }
}

// Run the scraper
runNoticeScraper().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

export { runNoticeScraper, SOURCES }
