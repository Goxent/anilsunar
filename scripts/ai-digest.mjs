import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OMNI_PATH = path.join(__dirname, '../src/app/data/market-omni-data.json')
const NOTICES_PATH = path.join(__dirname, '../src/app/data/notices.json')
const OUT_PATH = path.join(__dirname, '../src/app/data/ai_digest.json')

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.7,maxOutputTokens:2048}}) }
  )
  const d = await res.json()
  if (d.error) throw new Error(d.error.message)
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function parseJson(text, fallback) {
  try {
    const clean = text.replace(/```json|```/g,'').trim()
    const s = clean.search(/[{[]/)
    const e = Math.max(clean.lastIndexOf('}'),clean.lastIndexOf(']'))
    return JSON.parse(clean.slice(s,e+1))
  } catch { return fallback }
}

async function generateDigest() {
  console.log('🤖 AI Digest — Starting...')

  // Load market data
  let omni = {structured:{marketIndex:{},topStocks:[],brokerData:[],swingSignals:[]}}
  try { omni = JSON.parse(fs.readFileSync(OMNI_PATH,'utf8')) } 
  catch { console.log('⚠️  No omni data') }

  // Load notices
  let notices = []
  try { notices = JSON.parse(fs.readFileSync(NOTICES_PATH,'utf8')).notices || [] }
  catch {}

  const newNotices = notices.filter(n => n.isNew).slice(0,5)
  const idx = omni.structured?.marketIndex || {}
  const stocks = (omni.structured?.topStocks || []).slice(0,20)
  const signals = (omni.structured?.swingSignals || []).slice(0,10)

  // === MARKET SUMMARY PROMPT ===
  const marketPrompt = `You are a senior NEPSE stock market analyst in Nepal.

Today's market data:
NEPSE Index: ${idx.Current || idx['NEPSE Index'] || 'Data not available'}
Daily Change: ${idx['Daily Gain'] || idx.Change || 'N/A'}
Turnover: ${idx.Turnover || idx['Total Turnover'] || 'N/A'}
Date: ${idx.Date || new Date().toLocaleDateString()}

Top stocks: ${JSON.stringify(stocks.slice(0,10))}
Swing signals: ${JSON.stringify(signals)}

Write a 4-5 sentence professional NEPSE market summary for a CA professional.
Include: market movement, key observations, sector trend if visible, and one actionable insight.
Be specific and professional. Do not use generic filler phrases.

Respond with ONLY the summary text, no JSON, no labels.`

  // === LINKEDIN IDEAS PROMPT ===
  const linkedinPrompt = `You are a LinkedIn content strategist for a Nepal CA professional.

Background:
- Chartered Accountant (ICAN member)
- Expertise: Auditing, Nepal Tax Law, NEPSE analysis, Corporate Finance
- Audience: Nepal finance professionals, business owners, investors

Today's context:
NEPSE: ${idx.Current || 'N/A'} (${idx['Daily Gain'] || 'N/A'})
New regulatory notices: ${newNotices.map(n=>n.source+': '+n.title).join(' | ')||'None today'}

Generate exactly 5 LinkedIn post ideas. Topic distribution:
- 1 about today's NEPSE market movement
- 1 about Nepal taxation (Income Tax, VAT, TDS)
- 1 about Auditing or Accounting standards (ICAN, NSA)
- 1 about Nepal Corporate Law (Companies Act 2063) or SEBON regulations
- 1 about any of the new regulatory notices above (if any), or general finance insight

For each idea respond ONLY in valid JSON array:
[{
  "topic": "NEPSE|Taxation|Auditing|Corporate Law|Finance",
  "title": "Post headline max 12 words",
  "hook": "First sentence that stops scrolling — punchy and specific",
  "angle": "The insight or perspective — 2 sentences",
  "keyTakeaway": "What reader learns — 1 sentence",
  "hashtags": ["#Nepal","#CA","2 more specific"],
  "bestTimeToPost": "Morning or Evening"
}]`

  // === TOP PICKS PROMPT ===
  const picksPrompt = `As a NEPSE analyst, review this data:
Swing signals: ${JSON.stringify(signals)}
Top stocks: ${JSON.stringify(stocks.slice(0,15))}

List exactly 5 high-probability stock picks for today.
Respond ONLY in JSON array:
[{"symbol":"XXXX","signal":"STRONG BUY|ACCUMULATE|WATCH|AVOID","reason":"One sentence reason max 15 words"}]

Only include stocks with actual signal data. If fewer than 5 signals, return fewer.`

  let marketSummary = 'Market data not available. Run npm run omni-sync to fetch NEPSE data.'
  let linkedinIdeas = []
  let topPicks = []

  const hasGemini = !!process.env.GEMINI_API_KEY

  if (hasGemini) {
    try {
      console.log('📊 Generating market summary...')
      marketSummary = await callGemini(marketPrompt)
      console.log('✅ Market summary done')
    } catch(e) { console.warn('⚠️ Market summary failed:', e.message) }

    await new Promise(r => setTimeout(r, 3000))

    try {
      console.log('💼 Generating LinkedIn ideas...')
      const raw = await callGemini(linkedinPrompt)
      linkedinIdeas = parseJson(raw, [])
      console.log(`✅ ${linkedinIdeas.length} LinkedIn ideas generated`)
    } catch(e) { console.warn('⚠️ LinkedIn ideas failed:', e.message) }

    await new Promise(r => setTimeout(r, 3000))

    if (signals.length > 0) {
      try {
        console.log('🎯 Generating top picks...')
        const raw = await callGemini(picksPrompt)
        topPicks = parseJson(raw, [])
        console.log(`✅ ${topPicks.length} picks generated`)
      } catch(e) { console.warn('⚠️ Top picks failed:', e.message) }
    }
  } else {
    console.log('⚠️  No GEMINI_API_KEY — saving placeholder digest')
    marketSummary = 'Add GEMINI_API_KEY to .env to enable AI market summaries.'
  }

  const output = {
    timestamp: new Date().toISOString(),
    marketSummary,
    linkedinIdeas,
    topPicks,
    marketData: {
      index: idx.Current || idx['NEPSE Index'] || 'N/A',
      change: idx['Daily Gain'] || idx.Change || 'N/A',
      turnover: idx.Turnover || 'N/A',
      date: idx.Date || new Date().toLocaleDateString()
    },
    generatedBy: hasGemini ? 'gemini-2.0-flash' : 'none',
    newNoticesCount: newNotices.length
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))
  console.log('✅ Digest saved to ai_digest.json')

  // Send email if Resend is configured
  if (process.env.RESEND_API_KEY && output.marketSummary !== 'Market data not available. Run npm run omni-sync to fetch NEPSE data.') {
    await sendEmail(output, newNotices)
  } else {
    console.log('📭 Email skipped (no RESEND_API_KEY or no data)')
  }

  return output
}

async function sendEmail(digest, newNotices) {
  const TO = process.env.TO_EMAIL || 'anil99senchury@gmail.com'
  const date = new Date().toLocaleDateString('en-NP',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  const picksHtml = (digest.topPicks||[]).slice(0,5).map(p=>`
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#f59e0b;font-weight:700">${p.symbol}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e293b">
        <span style="background:${p.signal==='STRONG BUY'?'#14532d':p.signal==='ACCUMULATE'?'#1e3a5f':'#451a03'};
          color:${p.signal==='STRONG BUY'?'#4ADE80':p.signal==='ACCUMULATE'?'#60a5fa':'#fbbf24'};
          padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700">${p.signal}</span>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px">${p.reason}</td>
    </tr>`).join('')

  const ideasHtml = (digest.linkedinIdeas||[]).slice(0,5).map(i=>`
    <div style="background:#1a1a2e;border-left:3px solid #818cf8;border-radius:0 8px 8px 0;padding:14px;margin:8px 0">
      <span style="background:#312e81;color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:11px">${i.topic}</span>
      <p style="color:#e2e8f0;font-weight:700;margin:8px 0 4px;font-size:14px">${i.title}</p>
      <p style="color:#94a3b8;font-style:italic;font-size:13px;margin:0">"${i.hook}"</p>
    </div>`).join('')

  const noticesHtml = newNotices.slice(0,5).map(n=>`
    <div style="padding:10px 0;border-bottom:1px solid #1e293b">
      <span style="background:${n.badgeColor};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${n.badge}</span>
      <span style="color:#e2e8f0;font-size:13px;margin-left:8px">${n.title}</span>
    </div>`).join('')

  const html = \`<!DOCTYPE html><html><body style="background:#0d0d1a;font-family:Arial,sans-serif;color:#e2e8f0;margin:0;padding:0">
  <div style="background:linear-gradient(135deg,#1a1a2e,#0d0d1a);padding:32px;text-align:center;border-bottom:2px solid rgba(212,175,55,0.3)">
    <h1 style="color:#f59e0b;font-size:24px;margin:0;font-weight:800">⚡ GOXENT DAILY BRIEF</h1>
    <p style="color:#475569;margin:6px 0 0;font-size:13px">\${date}</p>
  </div>
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#1a1a2e;border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;margin-bottom:20px">
      <h2 style="color:#f59e0b;font-size:15px;margin:0 0 10px">📊 NEPSE Market — \${digest.marketData.index} (\${digest.marketData.change})</h2>
      <p style="color:#cbd5e1;line-height:1.7;margin:0;font-size:14px">\${digest.marketSummary}</p>
    </div>
    \${picksHtml ? \`<h2 style="color:#4ADE80;font-size:15px;margin:0 0 10px">🎯 Today's Top Picks</h2>
    <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-bottom:20px">
      <thead><tr style="background:#0f172a">
        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:11px">SYMBOL</th>
        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:11px">SIGNAL</th>
        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:11px">REASON</th>
      </tr></thead><tbody>\${picksHtml}</tbody>
    </table>\` : ''}
    \${ideasHtml ? \`<h2 style="color:#818cf8;font-size:15px;margin:0 0 10px">💼 LinkedIn Ideas</h2>\${ideasHtml}\` : ''}
    \${noticesHtml ? \`<h2 style="color:#f59e0b;font-size:15px;margin:20px 0 10px">🔔 New Regulatory Notices</h2>\${noticesHtml}\` : ''}
    <div style="text-align:center;margin:24px 0 0">
      <a href="https://app.anilsunar.com.np" style="background:#f59e0b;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px">Open Dashboard →</a>
    </div>
  </div>
</body></html>\`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':\`Bearer \${process.env.RESEND_API_KEY}\`,'Content-Type':'application/json'},
      body: JSON.stringify({
        from:'Goxent Brief <brief@anilsunar.com.np>',
        to:[TO],
        subject:\`⚡ Goxent Brief — NEPSE \${digest.marketData.index} | \${new Date().toLocaleDateString('en-NP')}\`,
        html
      })
    })
    if (res.ok) console.log(\`✅ Email sent to \${TO}\`)
    else console.warn('⚠️ Email failed:', await res.text())
  } catch(e) { console.warn('⚠️ Email error:', e.message) }
}

generateDigest().catch(e => { console.error('❌', e.message); process.exit(1) })
export { generateDigest }
