export type AIProvider = 'gemini' | 'claude'

// ============================================================
// CONFIG
// ============================================================
const DEFAULT_PROVIDER: AIProvider = 'gemini'

// ============================================================
// GEMINI — routed through server-side proxy (/api/gemini-proxy)
// The GEMINI_API_KEY lives only on the server — never in the browser.
// ============================================================
async function callGemini(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const res = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: 'gemini-2.0-flash',
      maxTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Gemini proxy error ${res.status}: ${err?.error || 'Unknown'}`)
  }

  const data = await res.json()
  const text = data?.text
  if (!text) throw new Error('Empty response from Gemini proxy')
  return text
}

// ============================================================
// CLAUDE — goes through /api/claude-analyze serverless route
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
