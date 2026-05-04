export type AIProvider = 'gemini' | 'claude'

// ============================================================
// CONFIG — change provider here when Claude API is ready
// ============================================================
const DEFAULT_PROVIDER: AIProvider = 'gemini'
// When you have Claude API key, change to:
// const DEFAULT_PROVIDER: AIProvider = 'claude'

// ============================================================
// GEMINI — free, works now
// ============================================================
async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'VITE_GEMINI_API_KEY not set. Get a free key from aistudio.google.com'
    )
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      `Gemini error ${response.status}: ${err?.error?.message || 'Unknown'}`
    )
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

// ============================================================
// CLAUDE — paid, add when ready
// Goes through /api/claude-analyze serverless route
// so the API key is NEVER exposed in browser
// ============================================================
async function callClaude(prompt: string): Promise<string> {
  const response = await fetch('/api/claude-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 2000 })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown' }))
    throw new Error(err.error || `Claude API failed: ${response.status}`)
  }

  const data = await response.json()
  return data.text || ''
}

// ============================================================
// MAIN CALLER — use this everywhere in the app
// ============================================================
export async function callAI(
  prompt: string,
  provider: AIProvider = DEFAULT_PROVIDER
): Promise<string> {
  if (provider === 'claude') {
    try {
      return await callClaude(prompt)
    } catch (err) {
      console.warn('Claude failed, falling back to Gemini:', err)
      return await callGemini(prompt)
    }
  }
  return await callGemini(prompt)
}

// ============================================================
// JSON PARSER — safely parses AI response as JSON
// ============================================================
export function parseAIJson<T>(text: string, fallback: T): T {
  try {
    const clean = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    // Find first { or [ and last } or ]
    const start = clean.search(/[\[{]/)
    const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    if (start === -1 || end === -1) return fallback
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return fallback
  }
}

// ============================================================
// CURRENT PROVIDER INFO — for UI display
// ============================================================
export function getAIProviderInfo() {
  return {
    name: DEFAULT_PROVIDER === 'gemini' ? 'Gemini 2.0 Flash' : 'Claude Haiku 4.5',
    badge: DEFAULT_PROVIDER === 'gemini' ? '✦ Gemini' : '◆ Claude',
    color: DEFAULT_PROVIDER === 'gemini' ? '#4285f4' : '#d97706',
    isFree: DEFAULT_PROVIDER === 'gemini'
  }
}
