import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────
const FIREBASE_API_KEY   = 'AIzaSyDktrGzsvcJKuch0XJxGt6_ZmukN8V3ar8';
const FIREBASE_PROJECT   = 'app-anil-sunar';
const FIRESTORE_BASE     = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadJson(relPath, fallback = null) {
  const fullPath = path.join(__dirname, '..', relPath);
  try {
    if (fs.existsSync(fullPath)) return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.warn(`⚠️  Could not load ${relPath}: ${e.message}`);
  }
  return fallback;
}

function cap(obj, maxChars = 60000) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return str.length > maxChars ? str.slice(0, maxChars) + '\n...[TRUNCATED]' : str;
}

// ─── Extract subset of omniData pages ────────────────────────────────────────
function pagesMatching(omniData, keywords) {
  return (omniData?.scrapedPages || [])
    .filter(p => keywords.some(kw => p.url?.includes(kw)))
    .map(p => ({ url: p.url, title: p.title, tables: p.tables, statCards: p.statCards }));
}

// ─── Gemini API Call ─────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key found (VITE_GEMINI_API_KEY or GEMINI_API_KEY)');

  const body = {
    contents: [{ parts: [{ text: prompt + '\n\nReturn ONLY raw JSON. No markdown. No explanation.' }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error(`Gemini returned non-JSON: ${raw.slice(0, 300)}`);
  }
}

// ─── Email ───────────────────────────────────────────────────────────────────
async function getActiveSubscribers() {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/subscribers?key=${FIREBASE_API_KEY}`);
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents
      .filter(d => d.fields?.active?.booleanValue === true)
      .map(d => ({ email: d.fields?.email?.stringValue, name: d.fields?.name?.stringValue || '' }))
      .filter(s => s.email);
  } catch (err) {
    console.warn('⚠️  Could not fetch subscribers:', err.message);
    return [];
  }
}

async function sendDigestEmail(digest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'anil99senchury@gmail.com';
  if (!RESEND_API_KEY) { console.log('⚠️  No RESEND_API_KEY — skipping email'); return; }

  const subscribers = await getActiveSubscribers();
  const recipients  = [{ email: TO_EMAIL, name: 'Anil Sunar' }, ...subscribers.filter(s => s.email !== TO_EMAIL)];
  console.log(`📧 Sending digest to ${recipients.length} recipient(s)...`);

  const picks   = (digest.topPicks || []).slice(0, 10);
  const ideas   = digest.linkedinIdeas || [];

  const signalColor = s =>
    s === 'STRONG BUY' ? { bg: '#14532d', fg: '#4ade80' } :
    s === 'BREAKOUT'   ? { bg: '#1e3a5f', fg: '#60a5fa' } :
    s === 'BUY'        ? { bg: '#1a3320', fg: '#4ade80' } :
                         { bg: '#451a03', fg: '#fbbf24' };

  const picksHtml = picks.map(p => {
    const c = signalColor(p.signal || p.target || '');
    return `<tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#f59e0b;font-weight:bold;font-size:15px;">${p.symbol}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
        <span style="background:${c.bg};color:${c.fg};padding:3px 10px;border-radius:4px;font-size:11px;font-weight:bold;">${p.signal || p.target}</span>
        ${p.entryZone ? `<div style="color:#64748b;font-size:11px;margin-top:4px;">Entry: ${p.entryZone} · SL: ${p.stopLoss || 'N/A'} · T: ${p.target || 'N/A'}</div>` : ''}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">${p.thesis || p.reason || ''}</td>
    </tr>`;
  }).join('');

  const ideasHtml = ideas.map(idea => `
    <div style="background:#1a1a2e;border-left:3px solid #818cf8;border-radius:0 8px 8px 0;padding:16px;margin:10px 0;">
      <p style="color:#e2e8f0;font-weight:bold;margin:0 0 4px;">${idea.hook || idea.title || ''}</p>
      ${idea.angle ? `<span style="background:#312e81;color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:11px;">${idea.angle}</span>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html><html><body style="background:#0d0d1a;font-family:Arial,sans-serif;color:#e2e8f0;padding:0;margin:0;">
    <div style="background:linear-gradient(135deg,#1a1a2e,#0d0d1a);padding:40px 32px;text-align:center;border-bottom:1px solid #f59e0b33;">
      <h1 style="color:#f59e0b;font-size:24px;margin:0;letter-spacing:0.1em;">⚡ GOXENT ALPHA BRIEF</h1>
      <p style="color:#475569;margin:8px 0 0;font-size:13px;">${new Date().toLocaleDateString('en-NP', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · NEPSE Command Center</p>
    </div>
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#1a1a2e;border:1px solid #f59e0b44;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#f59e0b;margin:0 0 12px;font-size:16px;">📊 Market Summary</h2>
        <p style="color:#cbd5e1;line-height:1.8;margin:0;">${digest.marketSummary}</p>
        ${digest.marketPhase ? `<p style="color:#64748b;font-size:12px;margin:12px 0 0;">Phase: <strong style="color:#f59e0b;">${digest.marketPhase}</strong></p>` : ''}
      </div>
      <h2 style="color:#4ade80;font-size:16px;margin:0 0 12px;">🎯 Top Picks</h2>
      <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#0f172a;">
          <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:12px;">SYMBOL</th>
          <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:12px;">SIGNAL</th>
          <th style="padding:12px 16px;text-align:left;color:#64748b;font-size:12px;">THESIS</th>
        </tr></thead>
        <tbody>${picksHtml}</tbody>
      </table>
      <h2 style="color:#818cf8;font-size:16px;margin:0 0 12px;">✍️ LinkedIn Content Ideas</h2>
      ${ideasHtml}
      <div style="text-align:center;padding:24px 0 8px;border-top:1px solid #1e293b;margin-top:24px;">
        <a href="https://app.anilsunar.com.np" style="color:#f59e0b;text-decoration:none;font-size:13px;">Open Goxent Command Center →</a>
        <p style="color:#334155;font-size:11px;margin:8px 0 0;">Goxent · anilsunar.com.np</p>
      </div>
    </div>
  </body></html>`;

  let sent = 0;
  for (const recipient of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Goxent Brief <brief@anilsunar.com.np>',
        to: [recipient.email],
        subject: `📊 NEPSE Daily Brief — ${new Date().toLocaleDateString('en-NP')}`,
        html
      })
    });
    if (res.ok) { console.log(`✅ Sent to ${recipient.email}`); sent++; }
    else { const err = await res.json(); console.error(`❌ Failed for ${recipient.email}:`, err.message || err); }
  }
  console.log(`📬 Digest delivered to ${sent}/${recipients.length} subscribers.`);
}

// ─── Main 3-Stage Pipeline ───────────────────────────────────────────────────
export default async function runAIAnalyst() {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  No Gemini API key — skipping AI digest (pipeline continues)');
    process.exit(0);
  }

  const omniData    = loadJson('src/app/data/market-omni-data.json', { scrapedPages: [] });
  const techSignals = loadJson('src/app/data/technical-signals.json', { stocks: [] });
  const brokerFlow  = loadJson('src/app/data/broker-flow-5d.json', { stocks: [] });
  const noticesRaw  = loadJson('src/app/data/regulatory-notices.json', []);
  const notices     = Array.isArray(noticesRaw) ? noticesRaw.slice(0, 8) : [];

  // Sector / macro pages for Stage 1
  const sectorPages = pagesMatching(omniData, [
    'sector-performance', 'sector-rotation', 'market-breadth', 'daily-summary'
  ]);

  // Stock screener pages for Stage 2
  const screenerPages = pagesMatching(omniData, [
    'stock-health', 'swing-gain', 'technical-screener',
    'momentum-screener', 'overbought-oversold', 'broker-analysis', 'floorsheet'
  ]);

  let stage1 = null, stage2 = null, stage3 = null;

  // ── STAGE 1 ─────────────────────────────────────────────────────────────────
  try {
    console.log('🧠 Stage 1: Market structure & sector analysis...');
    stage1 = await callGemini(`
You are an expert NEPSE analyst. Analyze today's market structure.

SECTOR & MARKET DATA:
${cap(sectorPages, 20000)}

RECENT REGULATORY NOTICES:
${JSON.stringify(notices)}

Return JSON:
{
  "marketPhase": "BULL" | "BEAR" | "SIDEWAYS",
  "hotSectors": ["sector1", "sector2", "sector3"],
  "weakSectors": ["sector1", "sector2"],
  "regulatoryHighlight": "string or null",
  "overallBias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "oneLinerSummary": "string"
}`);
    console.log(`   ✔  Phase: ${stage1.marketPhase} | Bias: ${stage1.overallBias}`);
  } catch (err) {
    console.warn('⚠️  Stage 1 failed:', err.message);
    stage1 = { marketPhase: 'SIDEWAYS', hotSectors: [], weakSectors: [], overallBias: 'NEUTRAL', oneLinerSummary: 'Market analysis unavailable.' };
  }

  // ── STAGE 2 ─────────────────────────────────────────────────────────────────
  try {
    console.log('🧠 Stage 2: Stock screening & signal fusion...');
    const s2result = await callGemini(`
You are screening NEPSE stocks for trading opportunities.

MARKET CONTEXT:
${JSON.stringify(stage1)}

TECHNICAL SIGNALS (RSI, EMA, Momentum — computed from 30 days of history):
${cap(techSignals, 12000)}

BROKER ACCUMULATION DATA (5-day smart money flow):
${cap(brokerFlow, 8000)}

TODAY'S SCREENER DATA (swing-gain, stock-health, technical screener, momentum screener):
${cap(screenerPages, 15000)}

RULES:
- Avoid stocks in weakSectors
- Prefer stocks where technical + broker signals BOTH confirm
- Golden Cross EMA + broker accumulation = very strong signal
- Volume spike with positive momentum = breakout candidate
- Spread picks across different sectors

Return a JSON array of your top 20 screened candidates:
[{
  "symbol": "string",
  "sector": "string",
  "technicalSignal": "string",
  "brokerSignal": "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL",
  "whyThisStock": "1 sentence"
}]`);
    stage2 = Array.isArray(s2result) ? s2result : (s2result.candidates || s2result.stocks || []);
    console.log(`   ✔  ${stage2.length} candidates screened`);
  } catch (err) {
    console.warn('⚠️  Stage 2 failed:', err.message);
    stage2 = [];
  }

  // ── STAGE 3 ─────────────────────────────────────────────────────────────────
  try {
    console.log('🧠 Stage 3: Final top 10 with entry/exit parameters...');
    stage3 = await callGemini(`
You are making final buy recommendations for NEPSE today.

MARKET PHASE: ${stage1.marketPhase} | BIAS: ${stage1.overallBias}
HOT SECTORS: ${JSON.stringify(stage1.hotSectors)}
WEAK SECTORS TO AVOID: ${JSON.stringify(stage1.weakSectors)}

SCREENED CANDIDATES:
${JSON.stringify(stage2)}

FULL SCREENER DATA:
${cap(screenerPages, 10000)}

Pick the BEST 10 from the candidates. For each:
- Entry zone (LTP ± 1%)
- Stop loss (clear support or -3% from entry)
- Target (5-8% in bull, 3-5% in sideways)
- Time horizon: SWING (2-7 days) | SHORT (2-4 weeks) | MEDIUM (1-3 months)
- Conviction: HIGH | MEDIUM | SPECULATIVE

Return JSON:
{
  "generatedAt": "ISO string",
  "marketSummary": "3 sentences for email header",
  "marketPhase": "string",
  "topPicks": [
    {
      "rank": 1,
      "symbol": "string",
      "sector": "string",
      "signal": "STRONG BUY" | "BUY" | "ACCUMULATE" | "BREAKOUT",
      "entryZone": "NPR 420-430",
      "stopLoss": "NPR 405",
      "target": "NPR 465",
      "upside": "+7%",
      "horizon": "SWING",
      "conviction": "HIGH",
      "thesis": "2 sharp sentences",
      "signals": ["signal1", "signal2"]
    }
  ],
  "linkedinIdeas": [
    { "hook": "string", "angle": "EDUCATIONAL | HOT_TAKE | DATA_STORY | REGULATORY_ALERT" }
  ]
}`);
    console.log(`   ✔  ${stage3.topPicks?.length || 0} final picks selected`);
  } catch (err) {
    console.warn('⚠️  Stage 3 failed:', err.message);
    stage3 = { generatedAt: new Date().toISOString(), marketSummary: stage1.oneLinerSummary, marketPhase: stage1.marketPhase, topPicks: [], linkedinIdeas: [] };
  }

  // ── SAVE ─────────────────────────────────────────────────────────────────────
  const dataDir = path.join(__dirname, '../src/app/data');
  fs.mkdirSync(dataDir, { recursive: true });

  // ai_digest.json — UI-compatible format (preserving existing keys the UI reads)
  const digest = {
    timestamp: stage3.generatedAt || new Date().toISOString(),
    marketSummary: stage3.marketSummary || stage1.oneLinerSummary,
    marketSentiment: stage1.overallBias,
    marketPhase: stage3.marketPhase || stage1.marketPhase,
    institutionalFocus: (stage1.hotSectors || []).join(', ') || 'General Market',
    topPicks: (stage3.topPicks || []).map(p => ({
      symbol: p.symbol,
      target: p.signal,
      reason: p.thesis,
      entryZone: p.entryZone,
      stopLoss: p.stopLoss,
      upside: p.upside,
      horizon: p.horizon,
      conviction: p.conviction,
      signals: p.signals,
    })),
    anomalies: (stage1.regulatoryHighlight ? [stage1.regulatoryHighlight] : []),
    linkedinIdeas: stage3.linkedinIdeas || [],
  };

  fs.writeFileSync(path.join(dataDir, 'ai_digest.json'), JSON.stringify(digest, null, 2));
  console.log('💾 Saved → src/app/data/ai_digest.json');

  // deep_intelligence.json — full 3-stage output
  fs.writeFileSync(path.join(dataDir, 'deep_intelligence.json'), JSON.stringify({ stage1, stage2, stage3 }, null, 2));
  console.log('💾 Saved → src/app/data/deep_intelligence.json');

  // Send email
  await sendDigestEmail(digest);
}

// Allow direct run — stays compatible with existing npm script name
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAIAnalyst().catch(err => {
    console.warn('⚠️  AI Analyst exiting with warning:', err.message);
    process.exit(0); // never fail the pipeline
  });
}
