import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Firestore REST (no SDK needed in Node script)
const FIREBASE_API_KEY = 'AIzaSyDktrGzsvcJKuch0XJxGt6_ZmukN8V3ar8';
const FIREBASE_PROJECT = 'app-anil-sunar';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

async function getActiveSubscribers() {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/subscribers?key=${FIREBASE_API_KEY}`);
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents
      .filter(d => d.fields?.active?.booleanValue === true)
      .map(d => ({
        email: d.fields?.email?.stringValue,
        name: d.fields?.name?.stringValue || ''
      }))
      .filter(s => s.email);
  } catch (err) {
    console.warn('⚠️  Could not fetch subscribers:', err.message);
    return [];
  }
}

async function sendDigestEmail(digest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'anil99senchury@gmail.com';

  if (!RESEND_API_KEY) {
    console.log('⚠️  No RESEND_API_KEY found — skipping email');
    return;
  }

  // Fetch all active subscribers + always include the owner
  const subscribers = await getActiveSubscribers();
  const recipients = [
    { email: TO_EMAIL, name: 'Anil Sunar' },
    ...subscribers.filter(s => s.email !== TO_EMAIL)
  ];

  console.log(`📧 Sending digest to ${recipients.length} recipient(s)...`);

  const formatPicks = (picks) => (picks || []).slice(0, 10).map(pick => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
        <span style="color:#f59e0b;font-weight:bold;font-size:15px;">
          ${pick.symbol}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
        <span style="background:${
          pick.target === 'STRONG BUY' ? '#14532d' : 
          pick.target === 'BREAKOUT' ? '#1e3a5f' : '#451a03'
        };color:${
          pick.target === 'STRONG BUY' ? '#4ade80' : 
          pick.target === 'BREAKOUT' ? '#60a5fa' : '#fbbf24'
        };padding:3px 10px;border-radius:4px;font-size:11px;font-weight:bold;">
          ${pick.target}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;
        color:#94a3b8;font-size:13px;">
        ${pick.reason}
      </td>
    </tr>
  `).join('')

  const formatLinkedIn = (ideas) => (ideas || []).map(idea => `
    <div style="background:#1a1a2e;border-left:3px solid #818cf8;
      border-radius:0 8px 8px 0;padding:16px;margin:10px 0;">
      <div style="margin-bottom:6px;">
        <span style="background:#312e81;color:#a5b4fc;padding:2px 8px;
          border-radius:10px;font-size:11px;">${idea.topic}</span>
        <span style="color:#64748b;font-size:11px;margin-left:8px;">
          Best: ${idea.bestTimeToPost}
        </span>
      </div>
      <p style="color:#e2e8f0;font-weight:bold;margin:4px 0;">
        ${idea.title}
      </p>
      <p style="color:#94a3b8;font-style:italic;font-size:13px;margin:4px 0;">
        "${idea.hook}"
      </p>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
  <html>
  <body style="background:#0d0d1a;font-family:Arial,sans-serif;
    color:#e2e8f0;padding:0;margin:0;">
    
    <div style="background:linear-gradient(135deg,#1a1a2e,#0d0d1a);
      padding:40px 32px;text-align:center;border-bottom:1px solid #f59e0b33;">
      <div style="font-size:32px;margin-bottom:8px;">⚡</div>
      <h1 style="color:#f59e0b;font-size:24px;margin:0;letter-spacing:0.1em;">
        GOXENT ALPHA BRIEF
      </h1>
      <p style="color:#475569;margin:8px 0 0;font-size:13px;">
        ${new Date().toLocaleDateString('en-NP', {
          weekday:'long',year:'numeric',month:'long',day:'numeric'
        })} · NEPSE Command Center
      </p>
    </div>

    <div style="max-width:640px;margin:0 auto;padding:24px;">

      <div style="background:#1a1a2e;border:1px solid #f59e0b44;
        border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#f59e0b;margin:0 0 12px;font-size:16px;">
          📊 Market Summary
        </h2>
        <p style="color:#cbd5e1;line-height:1.8;margin:0;">
          ${digest.marketSummary}
        </p>
      </div>

      <h2 style="color:#4ade80;font-size:16px;margin:0 0 12px;">
        🎯 Top 10 High-Probability Picks
      </h2>
      <table style="width:100%;border-collapse:collapse;
        background:#1a1a2e;border-radius:12px;overflow:hidden;
        margin-bottom:24px;">
        <thead>
          <tr style="background:#0f172a;">
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">SYMBOL</th>
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">SIGNAL</th>
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">REASON</th>
          </tr>
        </thead>
        <tbody>${formatPicks(digest.topPicks)}</tbody>
      </table>

      <h2 style="color:#818cf8;font-size:16px;margin:0 0 12px;">
        ✍️ LinkedIn Content Ideas
      </h2>
      ${formatLinkedIn(digest.linkedinIdeas)}

      <div style="text-align:center;padding:24px 0 8px;
        border-top:1px solid #1e293b;margin-top:24px;">
        <a href="https://app.anilsunar.com.np" 
          style="color:#f59e0b;text-decoration:none;font-size:13px;">
          Open Goxent Command Center →
        </a>
        <p style="color:#334155;font-size:11px;margin:8px 0 0;">
          Goxent · anilsunar.com.np
        </p>
      </div>
    </div>
  </body>
  </html>`

  let sent = 0;
  for (const recipient of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Goxent Brief <brief@anilsunar.com.np>',
        to: [recipient.email],
        subject: `📊 NEPSE Daily Brief — ${new Date().toLocaleDateString('en-NP')}`,
        html
      })
    });
    if (res.ok) {
      console.log(`✅ Sent to ${recipient.email}`);
      sent++;
    } else {
      const err = await res.json();
      console.error(`❌ Failed for ${recipient.email}:`, err.message || err);
    }
  }
  console.log(`📬 Digest delivered to ${sent}/${recipients.length} subscribers.`);
}

async function run() {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  // Load market data from the massive omni-data lake
  const dataPath = path.join(__dirname, '../src/app/data/market-omni-data.json');
  let marketData = {};
  if (fs.existsSync(dataPath)) {
    marketData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  // To prevent token limit blowouts, stringify safely (limit to first 100kb if it's ridiculously huge)
  let dataStr = JSON.stringify(marketData);
  if (dataStr.length > 80000) dataStr = dataStr.slice(0, 80000) + '... [TRUNCATED]';

  const prompt = `You are an elite quantitative analyst, auditor, and financial expert in Nepal.

Here is a massive data lake scraped dynamically from NepseAlpha/SastoShare today containing raw tables of floorsheets, broker analysis, technical signals, and fundamentals:
${dataStr}

The user is a professional CA in Nepal with expertise in:
- Auditing, accounting, and taxation
- NEPSE stock market anomalies and technical/fundamental crossovers
- Corporate finance and business strategy

Analyze this entire data lake to find hidden correlations (e.g., heavily accumulated stocks by specific brokers that also have bullish technical signals or high F-Scores). 

Write a 5-sentence "Alpha Market Summary" that exposes the most interesting anomaly or trend you found across the entire data lake.

CRITICAL: You must extract EXACTLY the Top 10 most high-probability stock picks from this data. These are stocks showing massive broker accumulation, incredible fundamentals, or strong AI/Swing signals.
For each pick, provide:
- symbol: The stock ticker
- target: "STRONG BUY", "ACCUMULATE", or "BREAKOUT"
- reason: A precise 1-sentence reason (e.g., "Broker 58 accumulated 150k units while F-Score is 8.")

Then, generate exactly 6 LinkedIn post ideas for their personal brand. Mix the topics:
- 2 ideas about NEPSE/Finance exposing the specific anomalies you found in the data lake.
- 1 idea about Auditing or Accounting
- 1 idea about Nepal Taxation
- 1 idea about Corporate Law or Companies Act Nepal
- 1 idea about general Finance or Business insight

Each idea must have:
- topic: one of ["Auditing", "Accounting", "NEPSE", "Corporate Law", "Taxation", "Finance"]
- title: LinkedIn post headline (max 12 words, curiosity-driven)
- angle: the unique insight or perspective to share (2-3 sentences)
- hook: the very first sentence of the post that stops the scroll (1 punchy sentence)
- keyTakeaway: what the reader will learn or feel after reading (1 sentence)
- bestTimeToPost: "Morning" or "Evening"

Respond ONLY in valid JSON with keys: marketSummary (string), topPicks (array of 10 objects), linkedinIdeas (array of 6 objects)`;

  try {
    console.log('🧠 Sending Omni-Data Lake to Claude 3.5 Sonnet for Deep Analysis...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content[0].text;
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const output = {
      timestamp: new Date().toISOString(),
      marketSummary: parsed.marketSummary,
      topPicks: parsed.topPicks,
      linkedinIdeas: parsed.linkedinIdeas
    };

    const outputPath = path.join(__dirname, '../src/app/data/ai_digest.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('✅ AI Digest generated and saved to src/app/data/ai_digest.json');

    await sendDigestEmail(output);
  } catch (error) {
    console.error('❌ Error generating AI Digest:', error);
  }
}

run();
