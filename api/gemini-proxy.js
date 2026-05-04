/**
 * api/gemini-proxy.js
 * Vercel serverless function — proxies all Gemini calls server-side.
 * The GEMINI_API_KEY never reaches the browser bundle.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Gemini not configured on server' })

  const { prompt, model = 'gemini-2.0-flash', maxTokens = 2048, temperature = 0.7 } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        }),
        signal: AbortSignal.timeout(30000)
      }
    )

    const data = await upstream.json()
    if (data.error) return res.status(502).json({ error: data.error.message })

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
