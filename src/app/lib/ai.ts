// All AI calls go through the server proxy. No API keys in the browser.

export async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens })
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `AI proxy error: ${response.status}`)
  }
  const data = await response.json()
  return data.text || ''
}

// Keep this for direct Claude calls (already server-side)
export async function callClaude(prompt: string, maxTokens = 2000): Promise<string> {
  const response = await fetch('/api/claude-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens, model: 'claude-haiku-4-5-20251001' })
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Claude API failed: ${response.status}`)
  }
  const data = await response.json()
  return data.text || ''
}
