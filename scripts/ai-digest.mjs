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

  const topPicksHtml = (digest.topPicks || []).map(pick => `
    <div style="background:#1a1a2e;border:1px solid #2d2d5e;border-radius:8px;padding:16px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;">
      <div style="flex:1;">
        <h3 style="color:#e2e8f0;margin:0 0 4px;font-size:16px;">
          <span style="color:#f59e0b;font-weight:bold;">${pick.symbol}</span>
        </h3>
        <p style="color:#94a3b8;font-size:13px;margin:0;">${pick.reason}</p>
      </div>
      <div style="margin-left:16px;">
        <span style="background:${pick.target.includes('BUY') ? '#166534' : '#b45309'};color:white;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;white-space:nowrap;">
          ${pick.target}
        </span>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#0d0d1a;font-family:Arial,sans-serif;color:#e2e8f0;padding:24px;max-width:680px;margin:0 auto;">
      <div style="text-align:center;padding:32px 0 24px;">
        <h1 style="color:#f59e0b;font-size:28px;margin:0;">🔔 Goxent Daily Brief</h1>
        <p style="color:#64748b;margin:8px 0 0;">
          ${new Date().toLocaleDateString('en-NP', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div style="background:#1a1a2e;border:1px solid #f59e0b33;border-radius:16px;padding:24px;margin:0 0 24px;">
        <h2 style="color:#f59e0b;margin:0 0 12px;font-size:18px;">📊 NEPSE Market Summary</h2>
        <p style="color:#cbd5e1;line-height:1.7;margin:0;">${digest.marketSummary}</p>
      </div>

      <div style="margin:0 0 24px;">
        <h2 style="color:#818cf8;font-size:18px;margin:0 0 4px;">🎯 Top 10 High-Probability Picks</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 12px;">
          Based on anomalies in broker accumulation, F-Scores, and technicals
        </p>
        ${topPicksHtml}
      </div>

      <div style="text-align:center;padding:20px;border-top:1px solid #1e293b;">
        <p style="color:#475569;font-size:12px;margin:0;">
          Goxent Command Center · app.anilsunar.com.np
        </p>
      </div>
    </body>
    </html>
  `;

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
