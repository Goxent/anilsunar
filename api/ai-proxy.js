export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt, maxTokens = 1500 } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set on server' })

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
        })
      }
    )
    const data = await response.json()
    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || 'Gemini API error' })
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
