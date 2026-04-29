export type AIModel = 'gemini' | 'claude';

// Gemini API call — uses VITE_GEMINI_API_KEY (free, browser-side)
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('VITE_GEMINI_API_KEY not set. Add it to your .env file.');
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
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return text;
}

// Claude proxy — only works when ANTHROPIC_API_KEY is set on server
export async function callClaude(
  prompt: string,
  maxTokens = 2000,
  model = 'claude-haiku-4-5-20251001'
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

// Main unified caller — defaults to Gemini since Claude key not available
export async function callAI(
  prompt: string,
  preferredModel: AIModel = 'gemini'
): Promise<string> {
  if (preferredModel === 'claude') {
    return callClaude(prompt);
  }
  return callGemini(prompt);
}
