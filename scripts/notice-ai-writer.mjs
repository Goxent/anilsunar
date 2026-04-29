import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOTICES_PATH = path.join(__dirname, '../src/app/data/notices.json')
const OUTPUT_PATH = path.join(__dirname, '../src/app/data/notice_posts.json')

// ============================================================
// GEMINI API caller
// ============================================================
async function callGemini(prompt) {
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 1024
        }
      })
    }
  )

  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ============================================================
// PROMPT BUILDER — creates a Gemini prompt per notice
// ============================================================
function buildGeminiPrompt(notice) {
  const categoryContext = {
    'Corporate Law': 'OCR Nepal (Office of Company Registrar). Audience: company directors, company secretaries, business owners, legal advisors.',
    'Taxation': 'IRD Nepal (Inland Revenue Department). Audience: tax practitioners, accountants, business owners, CFOs, VAT-registered businesses.',
    'Auditing': 'ICAN Nepal (Institute of Chartered Accountants of Nepal). Audience: chartered accountants, audit firms, CA students, finance professionals.',
    'Securities Law': 'SEBON (Securities Board of Nepal). Audience: investors, stockbrokers, listed companies, NEPSE traders.',
    'Banking': 'NRB Nepal (Nepal Rastra Bank). Audience: banking professionals, BFI executives, forex dealers, finance industry.',
    'Stock Market': 'NEPSE (Nepal Stock Exchange). Audience: retail investors, institutional investors, listed companies.',
    'Finance': 'Ministry of Finance Nepal. Audience: government contractors, finance professionals, policy researchers.'
  }

  const context = categoryContext[notice.category] || 'Nepal regulatory authority. Audience: Nepal business professionals.'

  return `You are writing a LinkedIn post for a Nepal-based Chartered Accountant (CA)
who is also an auditor, NEPSE analyst, and finance content creator.

The CA's expertise areas:
- Auditing and accounting (ICAN, Nepal Standards on Auditing)
- NEPSE stock market analysis
- Nepal corporate law (Companies Act 2063, Securities Act)
- Nepal taxation (Income Tax Act 2058, VAT, TDS)
- Corporate finance and business strategy

A new regulatory notice has been published:
Source: ${notice.source} (${context})
Category: ${notice.category}
Notice Title: "${notice.title}"
Notice Link: ${notice.link}
Detected on: ${new Date(notice.detectedAt).toLocaleDateString('en-NP')}

Write a professional LinkedIn post that:
1. Positions this CA as a knowledgeable thought leader
2. Explains the notice in simple terms for the audience
3. Adds practical "what this means for you" insight
4. Has a professional but engaging tone (not too formal, not casual)
5. Includes a clear call to action

Respond ONLY in this exact JSON format, no extra text:
{
  "headline": "First line of post — hook that stops scrolling (max 15 words)",
  "body": "Full post body — 150 to 200 words. Use line breaks for readability. Use 1-2 relevant emojis only. Do NOT use excessive emojis.",
  "callToAction": "Final CTA sentence — what should reader do next?",
  "hashtags": ["#Nepal", "#Compliance", "#CA", "3 more relevant tags"],
  "topicBadge": "${notice.category}",
  "bestTimeToPost": "Morning or Evening",
  "estimatedReach": "High or Medium or Niche",
  "keyInsight": "One-sentence expert insight the CA adds (not in the post body)"
}`
}

// ============================================================
// TEMPLATE FALLBACK — used if Gemini API fails
// ============================================================
function buildTemplatPost(notice) {
  const intros = {
    'OCR Nepal': '🏢 Important compliance update for Nepal businesses!',
    'IRD Nepal': '💰 Tax update alert for Nepal businesses and professionals!',
    'ICAN Nepal': '📊 Important update for Nepal\'s accounting profession!',
    'SEBON Nepal': '📈 New securities regulation from SEBON Nepal!',
    'NRB Nepal': '🏦 New banking directive from Nepal Rastra Bank!',
    'NEPSE': '📉 New notice from Nepal Stock Exchange!',
    'Ministry of Finance': '💼 New policy notice from Ministry of Finance!'
  }

  const whyItMatters = {
    'Corporate Law': 'This directly affects company registration, compliance filings, and corporate governance requirements.',
    'Taxation': 'This may impact your tax filing obligations, VAT returns, or TDS compliance deadlines.',
    'Auditing': 'This is relevant for practicing CAs, audit firms, and finance professionals in Nepal.',
    'Securities Law': 'This affects listed companies, investors, and market participants in NEPSE.',
    'Banking': 'This impacts BFIs, banking operations, and regulated financial institutions in Nepal.',
    'Stock Market': 'This is important for NEPSE investors, listed companies, and stockbrokers.',
    'Finance': 'This affects government fiscal policy and has broader implications for Nepal\'s economy.'
  }

  const ctas = {
    'OCR Nepal': 'Review this with your company secretary immediately.',
    'IRD Nepal': 'Share this with your accounts team and tax consultant.',
    'ICAN Nepal': 'Fellow CAs — read the full notice and inform your clients.',
    'SEBON Nepal': 'Investors and listed companies — review your compliance status.',
    'NRB Nepal': 'Banking professionals — review your institution\'s compliance.',
    'NEPSE': 'Investors — check if your portfolio companies are affected.',
    'Ministry of Finance': 'Finance professionals — review the policy implications.'
  }

  const body = `${intros[notice.source] || '📢 Regulatory update for Nepal!'}

📌 Notice: ${notice.title}

💡 Why this matters:
${whyItMatters[notice.category] || 'This regulatory update affects professionals in Nepal.'}

✅ Action: ${ctas[notice.source] || 'Read the full notice and consult your advisor.'}

🔗 Source: ${notice.source}
🔗 Link: ${notice.link}`

  return {
    headline: `${notice.source} has issued a new notice: ${notice.title.slice(0, 60)}`,
    body,
    callToAction: ctas[notice.source] || 'Read the full notice for details.',
    hashtags: ['#Nepal', '#Compliance', '#BusinessNepal',
      `#${notice.badge}Nepal`, `#${notice.category.replace(/\s/g, '')}`],
    topicBadge: notice.category,
    bestTimeToPost: 'Morning',
    estimatedReach: 'Medium',
    keyInsight: 'Template post — Gemini API not available',
    isTemplate: true
  }
}

// ============================================================
// SLEEP helper
// ============================================================
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================
// MAIN FUNCTION
// ============================================================
async function generateNoticePosts() {
  console.log('✍️  Notice AI Writer — Starting...')
  console.log('⏰ Run time:', new Date().toLocaleString())

  // Load scraped notices
  let noticesData = { notices: [] }
  try {
    noticesData = JSON.parse(fs.readFileSync(NOTICES_PATH, 'utf8'))
  } catch (e) {
    console.error('❌ Could not read notices.json — run notice-scraper first')
    process.exit(1)
  }

  // Load existing posts to avoid regenerating
  let existingPosts = {}
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
      existingPosts = existing.posts || {}
    }
  } catch (e) {}

  const allNotices = noticesData.notices || []
  // Only process NEW notices (isNew flag or not in existing posts)
  const toProcess = allNotices.filter(n =>
    n.isNew && !existingPosts[n.id]
  ).slice(0, 10) // max 10 per run to save API quota

  console.log(`📋 Notices to process: ${toProcess.length}`)

  const hasGemini = !!process.env.VITE_GEMINI_API_KEY

  if (!hasGemini) {
    console.log('⚠️  No VITE_GEMINI_API_KEY — using template posts instead')
  }

  for (const notice of toProcess) {
    console.log(`\n✍️  Processing: ${notice.title.slice(0, 60)}...`)

    let post
    if (hasGemini) {
      try {
        const prompt = buildGeminiPrompt(notice)
        const raw = await callGemini(prompt)
        const clean = raw.replace(/```json|```/g, '').trim()
        post = JSON.parse(clean)
        post.generatedBy = 'gemini'
        console.log(`   ✅ AI post generated`)
        // Wait 3 seconds between Gemini calls (free tier rate limit)
        await sleep(3000)
      } catch (e) {
        console.warn(`   ⚠️  Gemini failed: ${e.message} — using template`)
        post = buildTemplatPost(notice)
      }
    } else {
      post = buildTemplatPost(notice)
      console.log(`   📝 Template post created`)
    }

    existingPosts[notice.id] = {
      ...post,
      noticeId: notice.id,
      noticeTitle: notice.title,
      source: notice.source,
      category: notice.category,
      badgeColor: notice.badgeColor,
      link: notice.link,
      createdAt: new Date().toISOString()
    }
  }

  // Save all posts
  const output = {
    lastUpdated: new Date().toISOString(),
    totalPosts: Object.keys(existingPosts).length,
    newPostsThisRun: toProcess.length,
    posts: existingPosts
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved ${Object.keys(existingPosts).length} posts to notice_posts.json`)

  return output
}

generateNoticePosts().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

export { generateNoticePosts }
