export type AIModel = 'gemini' | 'claude';

/**
 * AI utility — calls Claude through the /api/claude-analyze serverless proxy.
 * The API key is stored server-side only; never exposed to the browser.
 */
export async function callClaude(
  prompt: string,
  maxTokens = 2000,
  model = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const response = await fetch('/api/claude-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Claude API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

/**
 * Unified AI caller. Redirects to secure proxy for Claude.
 */
export async function callAI(prompt: string, model: AIModel = 'claude') {
  if (model === 'gemini') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } else {
    // Always use the secure proxy for Claude
    return callClaude(prompt, 1500, 'claude-3-5-sonnet-20241022');
  }
}
