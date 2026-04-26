import { GoogleGenerativeAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Load market data from sasto_premium_report.json
  const dataPath = path.join(__dirname, '../src/app/data/sasto_premium_report.json');
  let marketData = {};
  if (fs.existsSync(dataPath)) {
    marketData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  const prompt = `You are an expert in Nepal finance, auditing, accounting, 
corporate law, taxation, and NEPSE stock market analysis.

Here is today's NEPSE market data:
${JSON.stringify(marketData, null, 2)}

The user is a professional in Nepal with expertise in:
- Auditing and accounting (Nepal Standards on Auditing, ICAN)
- NEPSE stock market analysis
- Corporate finance and business strategy
- Nepal corporate law (Companies Act, Securities Act)
- Nepal taxation (Income Tax Act, VAT, TDS rules)

Generate exactly 6 LinkedIn post ideas for their personal brand. 
Mix the topics — do not give all 6 on the same subject.

Each idea must have:
- topic: one of ["Auditing", "Accounting", "NEPSE", "Corporate Law", "Taxation", "Finance"]
- title: LinkedIn post headline (max 12 words, curiosity-driven)
- angle: the unique insight or perspective to share (2-3 sentences)
- hook: the very first sentence of the post that stops the scroll (1 punchy sentence)
- keyTakeaway: what the reader will learn or feel after reading (1 sentence)
- bestTimeToPost: "Morning" or "Evening" based on topic seriousness

Topic distribution must be:
- 2 ideas about NEPSE/Finance (use today's market data)
- 1 idea about Auditing or Accounting
- 1 idea about Nepal Taxation
- 1 idea about Corporate Law or Companies Act Nepal
- 1 idea about general Finance or Business insight

Respond ONLY in valid JSON with key: linkedinIdeas (array of 6 objects)`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON response (sometimes Gemini adds ```json ... ```)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const output = {
      timestamp: new Date().toISOString(),
      marketSummary: marketData.summary || {},
      linkedinIdeas: parsed.linkedinIdeas
    };

    const outputPath = path.join(__dirname, '../src/app/data/ai_digest.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('✅ AI Digest generated and saved to src/app/data/ai_digest.json');
  } catch (error) {
    console.error('❌ Error generating AI Digest:', error);
  }
}

run();
