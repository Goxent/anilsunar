import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IN = path.join(__dirname, '../src/app/data/notices.json')
const OUT = path.join(__dirname, '../src/app/data/notice_posts.json')

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.7,maxOutputTokens:1024} }) }
  )
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function buildPrompt(notice) {
  return `You are a LinkedIn ghostwriter for a Nepal-based Chartered Accountant (CA)
who specialises in auditing, NEPSE analysis, corporate law, and taxation.

New regulatory notice:
Source: ${notice.source}
Category: ${notice.category}
Title: "${notice.title}"
Link: ${notice.link}

Write a LinkedIn post that makes this CA look like a knowledgeable thought leader.

Respond ONLY in valid JSON. No extra text. No markdown fences.
{
  "headline": "First hook line — stops scrolling (max 12 words)",
  "body": "Post body 120-180 words. Professional, clear, practical. Max 2 emojis.",
  "callToAction": "Single CTA sentence",
  "hashtags": ["#Nepal", "#CA", "#Compliance", "2 more specific ones"],
  "bestTimeToPost": "Morning or Evening",
  "topicBadge": "${notice.category}"
}`
}

function fallback(notice) {
  const intros = {
    'OCR Nepal': '🏢 Company compliance update from OCR Nepal!',
    'IRD Nepal': '💰 Tax update from Inland Revenue Department!',
    'ICAN Nepal': '📊 ICAN Nepal has issued a new notice!',
    'SEBON Nepal': '📈 New securities regulation from SEBON!',
    'NRB Nepal': '🏦 Nepal Rastra Bank has a new directive!',
    'NEPSE': '📉 New notice from Nepal Stock Exchange!',
  }
  return {
    headline: `${notice.source}: ${notice.title.slice(0,55)}`,
    body: `${intros[notice.source]||'📢 Regulatory update!'}\n\n📌 ${notice.title}\n\nThis update from ${notice.source} may affect ${notice.category.toLowerCase()} compliance requirements for Nepal professionals.\n\n✅ Review the full notice and consult your advisor.\n\n🔗 ${notice.link}`,
    callToAction: 'Share this with your team if relevant.',
    hashtags: ['#Nepal','#Compliance','#CA',`#${notice.badge}Nepal`],
    bestTimeToPost: 'Morning',
    topicBadge: notice.category,
    isTemplate: true
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  console.log('✍️  Notice AI Writer — Starting...')
  const notices = JSON.parse(fs.readFileSync(IN,'utf8')).notices || []
  let existing = {}
  try { existing = JSON.parse(fs.readFileSync(OUT,'utf8')).posts || {} } catch {}

  const toProcess = notices.filter(n => n.isNew && !existing[n.id]).slice(0,10)
  console.log(`📋 Processing ${toProcess.length} new notices`)

  const hasGemini = !!process.env.GEMINI_API_KEY
  if (!hasGemini) console.log('⚠️  No Gemini key — using templates')

  for (const notice of toProcess) {
    console.log(`  ✍️  ${notice.title.slice(0,50)}...`)
    let post
    if (hasGemini) {
      try {
        const raw = await callGemini(buildPrompt(notice))
        const clean = raw.replace(/```json|```/g,'').trim()
        const s = clean.search(/[{[]/)
        const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
        post = JSON.parse(clean.slice(s, e+1))
        post.generatedBy = 'gemini'
        await sleep(3000)
      } catch(e) {
        console.warn(`     ⚠️  Gemini failed: ${e.message}`)
        post = fallback(notice)
      }
    } else {
      post = fallback(notice)
    }
    existing[notice.id] = {
      ...post, noticeId: notice.id, noticeTitle: notice.title,
      source: notice.source, badgeColor: notice.badgeColor,
      link: notice.link, createdAt: new Date().toISOString()
    }
  }

  fs.writeFileSync(OUT, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    totalPosts: Object.keys(existing).length,
    posts: existing
  }, null, 2))

  console.log(`✅ ${Object.keys(existing).length} posts saved`)
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
