export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { symbol, ltp, sector } = req.body || {}
  if (!symbol) return res.status(400).json({ error: 'symbol required' })

  const geminiKey = process.env.VITE_GEMINI_API_KEY
  if (!geminiKey) return res.status(503).json({ error: 'Gemini key not configured' })

  // Gather context from multiple sources
  const sources = []

  // 1. MeroLagani data
  try {
    const mlRes = await fetch(`https://merolagani.com/CompanyDetail.aspx?symbol=${symbol}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0' },
      signal: AbortSignal.timeout(8000)
    })
    if (mlRes.ok) {
      const html = await mlRes.text()
      const peMatch = html.match(/P\/E Ratio[^>]*>[\s]*([0-9.]+)/i)
      const epsMatch = html.match(/EPS[^>]*>[\s]*([0-9.]+)/i)
      const bvMatch = html.match(/Book Value[^>]*>[\s]*([0-9.]+)/i)
      sources.push({
        source: 'MeroLagani',
        data: {
          pe: peMatch?.[1] || null,
          eps: epsMatch?.[1] || null,
          bookValue: bvMatch?.[1] || null
        }
      })
    }
  } catch { /* skip */ }

  // 2. Sharesansar news for this symbol
  try {
    const ssRes = await fetch(
      `https://www.sharesansar.com/company/${symbol.toLowerCase()}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0' },
        signal: AbortSignal.timeout(8000) }
    )
    if (ssRes.ok) {
      const html = await ssRes.text()
      const newsMatches = [...html.matchAll(/<h[23][^>]*>([^<]{20,200})<\/h[23]>/gi)]
      const newsItems = newsMatches.slice(0, 5).map(m => m[1].trim())
      sources.push({ source: 'Sharesansar', data: { recentNews: newsItems } })
    }
  } catch { /* skip */ }

  // 3. NEPSE official data
  try {
    const nepseRes = await fetch(
      `https://www.nepalstock.com.np/api/nots/company/price/${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (nepseRes.ok) {
      const d = await nepseRes.json()
      sources.push({ source: 'NEPSE Official', data: d })
    }
  } catch { /* skip */ }

  const prompt = `You are a NEPSE stock analyst. Analyze this stock comprehensively.

STOCK: ${symbol}
CURRENT LTP: NPR ${ltp}
SECTOR: ${sector || 'Unknown'}

DATA GATHERED FROM MULTIPLE SOURCES:
${JSON.stringify(sources, null, 2)}

Provide a comprehensive stock analysis. Return ONLY valid JSON:
{
  "symbol": "${symbol}",
  "currentPrice": ${ltp || 0},
  "oneLinerSummary": "One sentence about this stock right now",
  "technicalView": {
    "trend": "UPTREND" | "DOWNTREND" | "SIDEWAYS",
    "keyLevel": "Important price level to watch",
    "momentum": "STRONG" | "MODERATE" | "WEAK",
    "comment": "2 sentences on technical position"
  },
  "fundamentalView": {
    "peRatio": "value or null",
    "eps": "value or null",
    "bookValue": "value or null",
    "pbRatio": "calculated or null",
    "verdict": "UNDERVALUED" | "FAIRLY_VALUED" | "OVERVALUED",
    "comment": "2 sentences on fundamental strength"
  },
  "newsAndSentiment": {
    "recentNews": ["news item 1", "news item 2"],
    "socialSentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
    "keyDevelopment": "Most important recent development"
  },
  "globalContext": "How global market conditions affect this stock/sector",
  "brokerActivity": "Based on available data, describe institutional interest",
  "overallVerdict": "BUY" | "ACCUMULATE" | "HOLD" | "AVOID",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "targetPrice": "estimated or null",
  "stopLoss": "estimated or null",
  "investorType": "LONG_TERM" | "SWING" | "BOTH" | "NEITHER"
}`

  try {
    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
        })
      }
    )

    const gemData = await gemRes.json()
    const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.search(/[\[{]/)
    const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    const analysis = JSON.parse(clean.slice(s, e + 1))

    // If Claude key exists, have Claude add a risk check
    const claudeKey = process.env.ANTHROPIC_API_KEY
    let claudeNote = null

    if (claudeKey) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Review this NEPSE stock analysis for ${symbol} and add one expert caution or confirmation.

Analysis: ${JSON.stringify(analysis)}

Return JSON only:
{
  "expertNote": "2-sentence expert observation that Gemini may have missed",
  "confidenceRating": "HIGH" | "MEDIUM" | "LOW",
  "keyWatch": "One specific thing to monitor"
}`
          }]
        })
      })

      const cd = await claudeRes.json()
      const ct = cd.content?.[0]?.text || '{}'
      try {
        const cc = ct.replace(/```json|```/g, '').trim()
        claudeNote = JSON.parse(cc.slice(cc.search(/[\[{]/), Math.max(cc.lastIndexOf('}'), cc.lastIndexOf(']')) + 1))
      } catch { /* skip */ }
    }

    return res.status(200).json({
      ...analysis,
      claudeExpertNote: claudeNote,
      supervisorActive: !!claudeKey,
      sourceCount: sources.length,
      analyzedAt: new Date().toISOString()
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
