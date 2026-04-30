import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Helper to safely load JSON
function loadJson(fileName) {
  const filePath = path.join(__dirname, '../src/app/data', fileName);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`⚠️ Failed to load ${fileName}: ${e.message}`);
  }
  return {};
}

// Helper to call Gemini API
async function callGeminiAPI(promptText) {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is missing');
  
  const fullPrompt = promptText + "\n\nReturn ONLY raw JSON, no markdown fences, no preamble.";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }]
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }
  
  const json = await response.json();
  const rawText = json.candidates[0]?.content?.parts[0]?.text || '{}';
  try {
    return JSON.parse(rawText.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error('Failed to parse Gemini output:', rawText);
    throw new Error('Gemini did not return valid JSON');
  }
}

export default async function runAIAnalyst() {
  console.log('🤖 Starting AI Analyst V2 Pipeline...');
  
  // 1. Load Data
  console.log('📦 Loading data context...');
  const omniData = loadJson('market-omni-data.json');
  const techSignals = loadJson('technical-signals.json');
  const brokerFlow = loadJson('broker-flow-5d.json');
  const tearsheets = loadJson('tearsheets/_index.json');
  const weekly = loadJson('rolling/weekly-summary.json');
  const monthly = loadJson('rolling/monthly-summary.json');
  const notices = loadJson('notices.json');

  const omniString = JSON.stringify(omniData).substring(0, 60000); // Truncate
  const noticesString = JSON.stringify((notices.posts || []).slice(0, 10));

  // --- STAGE 1 ---
  console.log('🧠 STAGE 1: Analyzing Market Structure & Sectors...');
  const stage1Prompt = `
You are a senior NEPSE market analyst with 20 years of experience trading Nepalese stocks.
Analyze the following multi-source data package and produce a market structure report.

WEEKLY DATA (last 5 trading days):
${JSON.stringify(weekly).substring(0, 5000)}

MONTHLY DATA (last 20 trading days):
${JSON.stringify(monthly).substring(0, 5000)}

TODAY'S RAW MARKET DATA:
${omniString}

REGULATORY NOTICES:
${noticesString}

YOUR TASK:
Analyze the big picture. Return JSON with:
{
  "marketPhase": "BULL_TRENDING" | "BEAR_TRENDING" | "SIDEWAYS_CONSOLIDATION" | "DISTRIBUTION" | "ACCUMULATION_PHASE",
  "marketPhaseReason": "2-3 sentence technical explanation",
  "hotSectors": [{ "sector": string, "momentum": "STRONG"|"MODERATE"|"WEAK", "reason": string }],
  "avoidSectors": [{ "sector": string, "reason": string }],
  "regulatoryAlerts": [{ "notice": string, "impact": "HIGH"|"MEDIUM"|"LOW", "affectedStocks": [] }],
  "weeklyBias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "keyRiskToday": string
}`;

  const stage1 = await callGeminiAPI(stage1Prompt);
  console.log(`✔️ Stage 1 Complete. Market Phase: ${stage1.marketPhase}`);

  // --- STAGE 2 ---
  console.log('🧠 STAGE 2: Stock Screening & Signal Fusion...');
  const stage2Prompt = `
You are a NEPSE quantitative analyst. You have already established:
Market Phase: ${stage1.marketPhase}
Hot Sectors: ${JSON.stringify(stage1.hotSectors)}
Avoid Sectors: ${JSON.stringify(stage1.avoidSectors)}

Now fuse the following technical + fundamental + broker data to identify the best trading opportunities.

TECHNICAL SIGNALS (RSI, EMA Cross, Momentum Scores):
${JSON.stringify(techSignals).substring(0, 10000)}

BROKER ACCUMULATION PATTERNS (5-day smart money flow):
${JSON.stringify(brokerFlow).substring(0, 5000)}

FUNDAMENTAL SNAPSHOT (top candidates):
${JSON.stringify(tearsheets).substring(0, 5000)}

RULES — Think like an experienced operator:
1. NEVER recommend stocks in sectors you flagged as AVOID in Stage 1
2. Prioritize stocks with BOTH a technical signal AND broker accumulation confirmation
3. A Golden Cross EMA + Institutional Accumulation + RSI under 60 = very strong signal
4. F-Score > 200 Cr with rising momentum = fundamentally backed
5. Stocks near 52-week highs with volume spike = potential breakout
6. Ignore stocks with P/E > 40 unless hyper-growth story
7. Spread picks across 3-4 different sectors (diversification)
8. Include at minimum: 2 defensive picks (Banks/Finance), 2 growth picks (Hydro/MFI), 1 speculative pick

Return JSON:
{
  "topCandidates": [
    {
      "symbol": "STRING",
      "sector": "STRING",
      "signals": ["STRING"],
      "fundamentalScore": "STRONG"|"MODERATE"|"WEAK",
      "brokerSignal": "ACCUMULATING"|"NEUTRAL"|"DISTRIBUTING",
      "technicalScore": 0,
      "compositeScore": 0,
      "thesis": "STRING"
    }
  ]
}`;

  const stage2 = await callGeminiAPI(stage2Prompt);
  console.log(`✔️ Stage 2 Complete. Screened ${stage2.topCandidates?.length || 0} candidates.`);

  // --- STAGE 3 ---
  console.log('🧠 STAGE 3: Final Risk Assessment & Recommendations...');
  
  const todayDate = new Date();
  const nepalDateStr = new Date(todayDate.getTime() + (5.75 * 3600000)).toISOString().split('T')[0];

  const stage3Prompt = `
You are the final decision maker for today's NEPSE portfolio recommendations.

Market Context: ${JSON.stringify(stage1)}
Top Candidates from screening: ${JSON.stringify(stage2.topCandidates)}

TODAY IS: ${nepalDateStr}
MARKET PHASE: ${stage1.marketPhase}

Your job: Select the BEST 10 stocks from the candidates list. Apply these final filters:
1. Ensure sector diversification (max 3 from same sector)
2. Flag each with position sizing recommendation: FULL (high conviction), HALF (medium), LIGHT (speculative)
3. Give entry zone (use recent LTP ± 1-2% as range)
4. Give a stop loss suggestion based on recent support
5. Give a short-term target (5-10% from entry in trending market, 3-5% in sideways)
6. Assign a time horizon: DAY_TRADE, SWING (2-7 days), SHORT_TERM (2-4 weeks), MEDIUM_TERM (1-3 months)

Return JSON:
{
  "generatedAt": "ISO string",
  "marketPhase": "STRING",
  "weeklyBias": "STRING",
  "marketSummary": "STRING",
  "keyRisk": "STRING",
  "topPicks": [
    {
      "rank": 0,
      "symbol": "STRING",
      "sector": "STRING",
      "signal": "STRONG BUY" | "BUY" | "ACCUMULATE" | "BREAKOUT WATCH",
      "entryZone": "STRING",
      "stopLoss": "STRING",
      "target": "STRING",
      "timeHorizon": "STRING",
      "positionSize": "FULL" | "HALF" | "LIGHT",
      "thesis": "STRING",
      "signals": ["STRING"],
      "riskLevel": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "linkedinIdeas": [
    { "hook": "STRING", "angle": "EDUCATIONAL"|"HOT_TAKE"|"DATA_STORY"|"REGULATORY_ALERT", "brief": "STRING" }
  ]
}`;

  const stage3 = await callGeminiAPI(stage3Prompt);
  console.log(`✔️ Stage 3 Complete. Generated final top 10 picks.`);

  // --- SAVE ---
  // Ensure the legacy structure still exists so the UI doesn't completely break,
  // although the UI expects marketSummary, marketSentiment, institutionalFocus, topPicks, anomalies
  const legacyFormat = {
    timestamp: stage3.generatedAt || new Date().toISOString(),
    marketSummary: stage3.marketSummary,
    marketSentiment: stage3.weeklyBias,
    institutionalFocus: stage1.hotSectors.map(s => s.sector).join(', '),
    topPicks: stage3.topPicks.map(p => ({
      symbol: p.symbol,
      target: p.signal,
      reason: p.thesis
    })),
    anomalies: stage1.regulatoryAlerts.map(r => r.notice).slice(0, 5),
    linkedinIdeas: stage3.linkedinIdeas
  };

  const digestPath = path.join(__dirname, '../src/app/data/ai_digest.json');
  fs.writeFileSync(digestPath, JSON.stringify(legacyFormat, null, 2));

  const deepIntelPath = path.join(__dirname, '../src/app/data/deep_intelligence.json');
  const deepIntel = {
    generatedAt: new Date().toISOString(),
    stage1,
    stage2,
    stage3
  };
  fs.writeFileSync(deepIntelPath, JSON.stringify(deepIntel, null, 2));

  console.log('💾 Intelligence safely stored to ai_digest.json and deep_intelligence.json.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAIAnalyst().catch(console.error);
}
