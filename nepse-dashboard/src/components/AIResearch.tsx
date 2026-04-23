import { useState } from 'react'
import { Brain, Send, Loader2, Sparkles, Lightbulb, TrendingUp } from 'lucide-react'

export default function AIResearch() {
  const [symbol, setSymbol] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'research' | 'content'>('research')

  const handleResearch = async () => {
    if (!symbol.trim()) return
    setIsLoading(true)
    setOutput('')

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
      if (!apiKey) {
        setOutput('Please configure VITE_GEMINI_API_KEY in your .env file.')
        setIsLoading(false)
        return
      }

      const prompt = mode === 'research'
        ? `You are a NEPSE stock market analyst. Analyze the stock "${symbol}" traded on Nepal Stock Exchange (NEPSE). Provide:
1. Company Overview (what sector, what they do)
2. Recent Market Sentiment (based on general knowledge of Nepal's market)
3. Key Financial Ratios to look for (P/E, P/B, ROE)
4. Technical Analysis Summary (support/resistance levels, trend)
5. Risk Factors
6. Investment Thesis (Bull case vs Bear case)
Keep it concise and actionable. Format with clear sections.`
        : `You are a content strategist for a financial YouTube channel in Nepal called "Goxent". Based on the current NEPSE stock "${symbol}", suggest:
1. 3 YouTube video ideas (with catchy titles)
2. 3 Instagram post/reel ideas
3. 1 Newsletter topic
4. Key talking points for each
Target audience: Nepali retail investors aged 20-35.
Format clearly with sections.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
      setOutput(text)
    } catch (err) {
      console.error(err)
      setOutput('Error generating analysis. Please check your API key and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>AI Research</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Powered by Gemini 2.0 — research stocks and generate content ideas</p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn" onClick={() => setMode('research')}
          style={{ background: mode === 'research' ? 'var(--gold-dim)' : undefined, color: mode === 'research' ? 'var(--gold)' : undefined, borderColor: mode === 'research' ? 'rgba(245,158,11,0.3)' : undefined }}>
          <TrendingUp size={16} /> Stock Research
        </button>
        <button className="btn" onClick={() => setMode('content')}
          style={{ background: mode === 'content' ? 'var(--gold-dim)' : undefined, color: mode === 'content' ? 'var(--gold)' : undefined, borderColor: mode === 'content' ? 'rgba(245,158,11,0.3)' : undefined }}>
          <Lightbulb size={16} /> Content Ideas
        </button>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Brain size={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <input
            placeholder={mode === 'research' ? 'Enter stock symbol (e.g., NABIL, UPPER, NLIC)...' : 'Enter topic or stock symbol for content ideas...'}
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleResearch()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleResearch} disabled={isLoading || !symbol.trim()}
            style={{ flexShrink: 0 }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {mode === 'research' ? 'Analyze' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Output */}
      {isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {mode === 'research' ? 'Analyzing stock data with Gemini AI...' : 'Generating content ideas...'}
          </p>
        </div>
      )}

      {output && !isLoading && (
        <div className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
              {mode === 'research' ? 'AI Analysis' : 'Content Ideas'} — {symbol}
            </span>
          </div>
          <div style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
          }}>
            {output}
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      {!output && !isLoading && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={16} style={{ color: 'var(--gold)' }} /> Quick Picks
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['NABIL', 'UPPER', 'NLIC', 'SHIVM', 'CHCL', 'GBIME', 'KBL'].map(s => (
              <button key={s} className="btn" onClick={() => { setSymbol(s); }} style={{ fontSize: 12 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
