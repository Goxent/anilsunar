import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// File paths
const paths = {
  news: path.join(__dirname, '../src/app/data/nepal-news.json'),
  notices: path.join(__dirname, '../src/app/data/notices.json'),
  intelligence: path.join(__dirname, '../src/app/data/deep_intelligence.json'),
  fundamental: path.join(__dirname, '../src/app/data/fundamental-data.json'),
  output: path.join(__dirname, '../src/app/data/linkedin-content.json'),
}

function load(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return {} }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ============================================================
// GEMINI — Research phase (FREE)
// ============================================================
async function geminiResearch(prompt) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + '\n\nReturn ONLY valid JSON, no markdown.' }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    }
  )
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.search(/[\[{]/)
    const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    return JSON.parse(clean.slice(s, e + 1))
  } catch { return { raw: text } }
}

// ============================================================
// CLAUDE — Polish phase (PAID supervisor)
// ============================================================
async function claudePolish(prompt) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.log('   ⚠️  No Claude key — returning Gemini draft as-is')
    return null
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const d = await res.json()
  if (d.error) { console.warn('Claude error:', d.error.message); return null }

  const text = d.content?.[0]?.text || ''
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.search(/[\[{]/)
    const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    return JSON.parse(clean.slice(s, e + 1))
  } catch { return { polishedText: text } }
}

// ============================================================
// MAIN PIPELINE
// ============================================================
async function runLinkedInPipeline() {
  console.log('🚀 LinkedIn Content Pipeline — Starting...')

  const news = load(paths.news)
  const notices = load(paths.notices)
  const intelligence = load(paths.intelligence)
  const fundamental = load(paths.fundamental)

  const articles = (news.articles || []).slice(0, 15)
  const newNotices = (notices.notices || []).filter(n => n.isNew).slice(0, 5)
  const marketVerdict = intelligence.marketVerdict || 'NEUTRAL'
  const executiveSummary = intelligence.executiveSummary || ''
  const topPicks = (intelligence.activePicks || []).slice(0, 3)

  // ─── PHASE 1: Gemini Research ─────────────────────────────
  console.log('\n📰 PHASE 1: Gemini gathering content ideas...')

  const researchPrompt = `You are a research assistant helping a Nepal-based CA professional
create LinkedIn content. You have access to today's data:

NEPAL MARKET NEWS (today):
${articles.map(a => `- ${a.title} (${a.source})`).join('\n')}

NEPSE MARKET VERDICT: ${marketVerdict}
MARKET SUMMARY: ${executiveSummary}

TOP STOCK PICKS TODAY: ${topPicks.map(p => p.symbol).join(', ')}

NEW REGULATORY NOTICES:
${newNotices.map(n => `- ${n.source}: ${n.title}`).join('\n') || 'None today'}

The CA professional's expertise:
- Chartered Accountant (ICAN member, Nepal)
- NEPSE stock market analyst
- Corporate law (Companies Act 2063, Securities Act)
- Nepal taxation (Income Tax Act 2058, VAT, TDS)
- Auditing and accounting standards

Generate 6 LinkedIn post IDEAS (not full posts yet — just ideas).
Topic distribution MUST be:
- 2 posts about today's NEPSE market / top picks
- 1 post about global markets and how they affect Nepal
- 1 post about a regulatory or tax update (from notices above)
- 1 post about auditing / CA profession
- 1 post about financial literacy for Nepal investors

For each idea return JSON:
[{
  "topicType": "NEPSE" | "GLOBAL_MARKET" | "REGULATORY" | "AUDITING" | "FINANCIAL_LITERACY",
  "angle": "The specific angle or insight to cover (2 sentences)",
  "keyData": "Specific data points or news to mention",
  "targetAudience": "Who this is for",
  "draftHook": "First sentence draft — attention-grabbing",
  "draftBody": "150-word draft body",
  "draftHashtags": ["#Nepal", "#CA", "3 more"],
  "estimatedEngagement": "HIGH" | "MEDIUM" | "NICHE",
  "bestPostTime": "Morning 8AM" | "Evening 7PM" | "Lunch 1PM"
}]`

  const geminiIdeas = await geminiResearch(researchPrompt)
  const ideas = Array.isArray(geminiIdeas) ? geminiIdeas : []
  console.log(`   ✅ Gemini generated ${ideas.length} content ideas`)

  await sleep(2000)

  // ─── PHASE 2: Claude Polish ───────────────────────────────
  console.log('\n✨ PHASE 2: Claude polishing posts...')

  const claudePrompt = `You are a professional LinkedIn ghostwriter and CA career coach.
Your client is a Nepal-based Chartered Accountant who wants to build a strong
personal brand around NEPSE analysis, taxation, auditing, and finance.

Your junior researcher (Gemini) has produced these 6 content ideas:
${JSON.stringify(ideas, null, 2)}

Your job as the SENIOR EDITOR:
1. Take each idea and write a FINAL, publish-ready LinkedIn post
2. Ensure each post sounds like a thoughtful CA professional — not an AI
3. Make the hook genuinely stop scrolling
4. Add specific, credible details (not generic statements)
5. Keep body 150-180 words
6. Use line breaks for readability (every 2-3 sentences)
7. Maximum 2 emojis per post — use sparingly
8. End with a question to drive comments

For each of the 6 ideas, return the polished version:
[{
  "topicType": "same as input",
  "finalTitle": "Post headline (shown as first line)",
  "finalHook": "First 1-2 sentences — MUST stop scrolling",
  "finalBody": "Full post body — 150-180 words with line breaks using \\n\\n",
  "finalCTA": "Question or CTA for comments",
  "finalHashtags": ["#Nepal", "#CA", "3 specific ones"],
  "copyText": "The complete ready-to-paste LinkedIn post",
  "bestPostTime": "keep from Gemini suggestion",
  "supervisorNote": "One sentence — what makes this post strong",
  "geminiDraftQuality": "GOOD" | "NEEDS_WORK"
}]`

  const claudePolished = await claudePolish(claudePrompt)

  // ─── PHASE 3: Save output ─────────────────────────────────
  const posts = claudePolished || ideas.map(idea => ({
    ...idea,
    copyText: `${idea.draftHook}\n\n${idea.draftBody}\n\n${idea.draftHashtags?.join(' ')}`,
    finalTitle: idea.angle,
    supervisorNote: 'Generated by Gemini (Claude not configured)',
    supervisorActive: false
  }))

  const output = {
    generatedAt: new Date().toISOString(),
    supervisorActive: !!process.env.ANTHROPIC_API_KEY,
    pipeline: process.env.ANTHROPIC_API_KEY
      ? 'gemini-research + claude-polish'
      : 'gemini-only',
    totalPosts: posts.length || 0,
    marketContext: {
      verdict: marketVerdict,
      summary: executiveSummary,
      topPicks: topPicks.map(p => p.symbol)
    },
    posts: Array.isArray(posts) ? posts : [],
    geminiIdeas: ideas,
    costEstimate: {
      geminiCalls: 1,
      claudeCalls: process.env.ANTHROPIC_API_KEY ? 1 : 0,
      estimatedCost: process.env.ANTHROPIC_API_KEY ? '~$0.018' : '$0.00'
    }
  }

  fs.writeFileSync(paths.output, JSON.stringify(output, null, 2))
  console.log(`\n✅ LinkedIn pipeline complete`)
  console.log(`   Posts: ${output.totalPosts}`)
  console.log(`   Supervisor: ${output.supervisorActive ? '◆ Claude' : '✦ Gemini only'}`)
  console.log(`   Cost: ${output.costEstimate.estimatedCost}`)
}

runLinkedInPipeline().catch(e => {
  console.error('❌', e.message); process.exit(1)
})
export { runLinkedInPipeline }
