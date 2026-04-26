import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, Sparkles, Lightbulb, TrendingUp, Save, History, Trash2 } from 'lucide-react'
import { collection, addDoc, Timestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { callAI, AIModel } from '../lib/ai'
import aiDigest from '../data/ai_digest.json'

export default function AIResearch() {
  const [symbol, setSymbol] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState<'research' | 'content' | 'history'>('research')
  const [aiModel, setAiModel] = useState<AIModel>('claude')
  const [history, setHistory] = useState<any[]>([])

  const digestTimestamp = aiDigest?.timestamp ? new Date(aiDigest.timestamp) : null
  const hoursAgo = digestTimestamp ? Math.floor((new Date().getTime() - digestTimestamp.getTime()) / (1000 * 60 * 60)) : 0

  useEffect(() => {
    if (!auth.currentUser || mode !== 'history') return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/nepse_analysis`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [mode]);

  const handleResearch = async () => {
    // ... (rest of the handleResearch function remains the same)
    if (!symbol.trim()) return
    setIsLoading(true)
    setOutput('')

    try {
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

      const text = await callAI(prompt, aiModel)
      setOutput(text)
    } catch (err: any) {
      console.error(err)
      setOutput(`Error: ${err.message || 'Something went wrong.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToFirestore = async () => {
    if (!output || !auth.currentUser) return
    setIsSaving(true)
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/nepse_analysis`), {
        symbol,
        content: output,
        type: mode,
        model: aiModel,
        createdAt: Timestamp.now(),
        date: new Date().toLocaleDateString()
      })
      alert('Analysis saved to Firestore!')
    } catch (err) {
      console.error(err)
      alert('Failed to save analysis.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>AI Research</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Powered by Gemini 2.0 — research stocks and generate content ideas</p>

      {/* Today's AI Brief */}
      {aiDigest && aiDigest.marketSummary && (
        <div className="card" style={{ marginBottom: 32, border: '1px solid var(--gold)', background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)' }}>
              <Sparkles size={18} /> Today's AI Brief
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Last updated: {hoursAgo} hours ago</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: 24 }}>
            {aiDigest.marketSummary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* YouTube Ideas */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#ff0000' }}>
                <TrendingUp size={14} /> YouTube Ideas
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiDigest.youtubeIdeas?.map((idea: any, i: number) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '2px solid #ff0000' }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{idea.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{idea.concept}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* LinkedIn Ideas */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#0a66c2' }}>
                <Lightbulb size={14} /> LinkedIn Ideas
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiDigest.linkedinIdeas?.map((idea: any, i: number) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '2px solid #0a66c2' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{idea.postText || idea.title || idea.angle || JSON.stringify(idea)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode & Model Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" onClick={() => setMode('research')}
            style={{ background: mode === 'research' ? 'var(--gold-dim)' : undefined, color: mode === 'research' ? 'var(--gold)' : undefined, borderColor: mode === 'research' ? 'rgba(245,158,11,0.3)' : undefined }}>
            <TrendingUp size={16} /> Stock Research
          </button>
          <button className="btn" onClick={() => setMode('content')}
            style={{ background: mode === 'content' ? 'var(--gold-dim)' : undefined, color: mode === 'content' ? 'var(--gold)' : undefined, borderColor: mode === 'content' ? 'rgba(245,158,11,0.3)' : undefined }}>
            <Lightbulb size={16} /> Content Ideas
          </button>
          <button className="btn" onClick={() => setMode('history')}
            style={{ background: mode === 'history' ? 'var(--gold-dim)' : undefined, color: mode === 'history' ? 'var(--gold)' : undefined, borderColor: mode === 'history' ? 'rgba(245,158,11,0.3)' : undefined }}>
            <History size={16} /> Analysis Vault
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10 }}>
          <button 
            onClick={() => setAiModel('gemini')}
            style={{ 
              fontSize: 11, 
              padding: '6px 12px', 
              borderRadius: 8, 
              border: 'none',
              background: aiModel === 'gemini' ? 'var(--gold)' : 'transparent',
              color: aiModel === 'gemini' ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >Gemini 2.0</button>
          <button 
            onClick={() => setAiModel('claude')}
            style={{ 
              fontSize: 11, 
              padding: '6px 12px', 
              borderRadius: 8, 
              border: 'none',
              background: aiModel === 'claude' ? 'var(--gold)' : 'transparent',
              color: aiModel === 'claude' ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >Claude 3.5</button>
        </div>
      </div>

      {/* Main UI */}
      {mode !== 'history' ? (
        <>
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
                {mode === 'research' ? `Analyzing with ${aiModel === 'gemini' ? 'Gemini' : 'Claude'}...` : `Generating with ${aiModel === 'gemini' ? 'Gemini' : 'Claude'}...`}
              </p>
            </div>
          )}

          {output && !isLoading && (
            <div className="card" style={{ borderLeft: '3px solid var(--gold)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <button className="btn btn-primary" onClick={handleSaveToFirestore} disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? 'Saving...' : 'Save to Firestore'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                  {mode === 'research' ? 'AI Analysis' : 'Content Ideas'} — {symbol} ({aiModel.toUpperCase()})
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
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, opacity: 0.5 }}>
              <History size={32} style={{ marginBottom: 16 }} />
              <p>No saved analyses found in your vault.</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{item.symbol}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {item.type === 'research' ? 'Stock Research' : 'Content Ideas'} • {item.model?.toUpperCase()} • {item.date}
                    </p>
                  </div>
                  <button 
                    className="btn" 
                    style={{ color: 'var(--red)', padding: '8px' }}
                    onClick={async () => {
                      if (confirm('Delete this analysis?')) {
                        await deleteDoc(doc(db, `users/${auth.currentUser?.uid}/nepse_analysis`, item.id))
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)', maxHeight: 300, overflowY: 'auto' }}>
                  {item.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
