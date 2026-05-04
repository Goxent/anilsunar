import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

function loadJson(fileName) {
  const filePath = path.join(__dirname, '../src/app/data', fileName);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`⚠️ Failed to load ${fileName}: ${e.message}`);
  }
  return null;
}

function saveJson(fileName, data) {
  const filePath = path.join(__dirname, '../src/app/data', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function callAI(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
  
  const fullPrompt = promptText + "\n\nReturn ONLY raw JSON. No markdown fences, no preamble.";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} ${errText}`);
  }
  
  const json = await response.json();
  const rawText = json.candidates[0]?.content?.parts[0]?.text || '{}';
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const s = clean.search(/[\[{]/);
    const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    return JSON.parse(clean.slice(s, e + 1));
  } catch (e) {
    console.error('Failed to parse AI output:', rawText);
    return null;
  }
}

export default async function runPortfolioManager() {
  console.log('👔 Starting BlackRock Portfolio Manager AI...');
  
  const quantData = loadJson('quant-top10.json');
  const newsData = loadJson('nepal-news.json');

  if (!quantData || !quantData.top10 || quantData.top10.length === 0) {
    console.warn('⚠️ No Top 10 data from Quant Engine. AI has nothing to analyze.');
    // Generate a fallback
    saveJson('deep_intelligence.json', {
      timestamp: new Date().toISOString(),
      marketVerdict: "Quant Engine provided no candidates. Market data might be missing.",
      activePicks: []
    });
    return;
  }

  const top10 = quantData.top10;
  
  // Filter news for relevance
  const recentNews = (newsData || []).slice(0, 15).map(n => n.title).join(' | ');

  const prompt = `You are a Lead Portfolio Manager at a top-tier quantitative firm like BlackRock.
Our Node.js Quant Engine has just processed the entire NEPSE market and selected the absolute best 10 stocks based on a rigorous mathematical model (Value, Momentum, Institutional Flow).

Here are the Top 10 mathematical finalists:
${JSON.stringify(top10, null, 2)}

Here are the latest market headlines:
${recentNews}

Your job is to provide the final qualitative review. 
For each of the 10 stocks, write a concise, highly professional "Investment Thesis" (1-2 sentences max). 
If the news indicates a systemic risk or specific risk for a sector, note it.

Return a JSON object in this exact format:
{
  "marketVerdict": "A 2-sentence macro verdict on the current state of the market based on the news and the types of stocks the quant engine favored (e.g. 'The quant model heavily favors commercial banks, aligning with recent regulatory easing...').",
  "activePicks": [
    {
      "symbol": "SYMBOL",
      "sector": "Sector Name",
      "quantScore": 85.5,
      "thesis": "Your professional 2-sentence thesis here."
    }
  ]
}
`;

  console.log('🧠 Sending Top 10 to AI for qualitative review...');
  const aiResult = await callAI(prompt);

  if (aiResult) {
    aiResult.timestamp = new Date().toISOString();
    saveJson('deep_intelligence.json', aiResult);
    console.log('✅ AI Portfolio Manager complete. Saved to deep_intelligence.json.');
  } else {
    console.log('❌ AI Failed to generate valid analysis.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPortfolioManager().catch(e => {
    console.error('❌ Pipeline Error:', e);
    process.exit(1);
  });
}
