export type AIModel = 'gemini' | 'claude';

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
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
    if (!apiKey) throw new Error('VITE_CLAUDE_API_KEY not set');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }
}
