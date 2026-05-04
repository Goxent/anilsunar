import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, '../src/app/data/notices.json')

const SOURCES = [
  { name: 'OCR Nepal', badge: 'OCR', url: 'https://ocr.gov.np/',
    category: 'Corporate Law', color: '#1a73e8',
    keywords: ['notice','circular','registration','deadline','regulation','act','form','सूचना','परिपत्र'] },
  { name: 'IRD Nepal', badge: 'IRD', url: 'https://ird.gov.np/',
    category: 'Taxation', color: '#e53935',
    keywords: ['notice','circular','tax','vat','return','filing','deadline','tds','pan','सूचना'] },
  { name: 'ICAN Nepal', badge: 'ICAN', url: 'https://en.ican.org.np/en/',
    category: 'Auditing', color: '#2e7d32',
    keywords: ['notice','circular','exam','result','training','announcement','audit','standard'] },
  { name: 'SEBON Nepal', badge: 'SEBON', url: 'https://sebon.gov.np/',
    category: 'Securities Law', color: '#6a1b9a',
    keywords: ['notice','circular','regulation','securities','ipo','listing','directive','सूचना'] },
  { name: 'NRB Nepal', badge: 'NRB', url: 'https://www.nrb.org.np/category/notices/',
    category: 'Banking', color: '#e65100',
    keywords: ['notice','circular','directive','banking','monetary','bfi','interest','rate'] },
  { name: 'NEPSE', badge: 'NEPSE', url: 'https://www.nepalstock.com.np/company-notice',
    category: 'Stock Market', color: '#00695c',
    keywords: ['notice','dividend','agm','right','bonus','ipo','listing','announcement'] },
]

async function fetchPage(url) {
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      }
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

function cleanText(t) {
  return (t || '')
    .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#\d+;/g,'')
    .replace(/\s+/g,' ').trim()
}

function isRelevant(title, keywords) {
  if (!title || title.length < 12 || title.length > 300) return false
  const skip = ['home','about','contact','login','facebook','twitter','skip','menu']
  const low = title.toLowerCase()
  if (skip.some(w => low === w || low.startsWith(w+' '))) return false
  return keywords.some(k => low.includes(k.toLowerCase()))
}

function buildFullUrl(href, base) {
  if (!href || href==='#' || href.startsWith('javascript')) return base
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:'+href
  if (href.startsWith('/')) return base.match(/^https?:\/\/[^/]+/)?.[0]+href || base
  return base+'/'+href
}

function makeId(title, source) {
  return (source+title).toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,28)+'_'+Date.now().toString(36)
}

function parseHtml(html, source) {
  const notices = []
  const seen = new Set()
  const re = /<a[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim()
    const title = cleanText(m[2].replace(/<[^>]*>/g,''))
    if (!isRelevant(title, source.keywords)) continue
    if (seen.has(title.toLowerCase())) continue
    seen.add(title.toLowerCase())
    notices.push({
      id: makeId(title, source.name),
      title,
      source: source.name,
      category: source.category,
      badge: source.badge,
      badgeColor: source.color,
      link: buildFullUrl(href, source.url),
      summary: `New ${source.category} update from ${source.name}: ${title}`,
      detectedAt: new Date().toISOString(),
      isNew: true,
      emailedAt: null
    })
  }
  return notices.slice(0, 12)
}

function loadExisting() {
  try { return JSON.parse(fs.readFileSync(OUTPUT,'utf8')).notices || [] }
  catch { return [] }
}

function dedup(scraped, existing) {
  const existTitles = new Set(existing.map(n => n.title?.toLowerCase().trim()))
  return scraped.filter(n => {
    const t = n.title.toLowerCase().trim()
    if (existTitles.has(t)) return false
    for (const e of existTitles) {
      if (e.length>20 && t.length>20 && (e.includes(t)||t.includes(e))) return false
    }
    return true
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  console.log('🔔 Notice Scraper — Starting...')
  const existing = loadExisting()
  console.log(`📋 Existing: ${existing.length} notices`)

  const all = []
  for (const src of SOURCES) {
    console.log(`🔍 ${src.name}...`)
    const html = await fetchPage(src.url)
    if (html) {
      const found = parseHtml(html, src)
      console.log(`   Found ${found.length} notices`)
      all.push(...found)
    } else {
      console.log(`   ⚠️ Could not fetch`)
    }
    await sleep(2000)
  }

  const newOnes = dedup(all, existing)
  console.log(`🆕 New notices: ${newOnes.length}`)

  const merged = [...newOnes, ...existing].slice(0, 300)
  fs.writeFileSync(OUTPUT, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    totalCount: merged.length,
    newCount: newOnes.length,
    notices: merged
  }, null, 2))

  console.log(`✅ Saved ${merged.length} total notices`)
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
