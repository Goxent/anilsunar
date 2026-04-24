import { useState, useEffect } from 'react'
import { Lightbulb, Search, TrendingUp, Save, Copy, Trash2, Plus, MessageSquare, Send } from 'lucide-react'

type Idea = {
  id: string;
  title: string;
  content: string;
  type: string;
  date: string;
}

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState<'ai' | 'ideas'>('ai')
  const [topic, setTopic] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState({ title: '', content: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('goxent_ideas')
    if (saved) setIdeas(JSON.parse(saved))
  }, [])

  const saveIdeas = (newIdeas: Idea[]) => {
    setIdeas(newIdeas)
    localStorage.setItem('goxent_ideas', JSON.stringify(newIdeas))
  }

  const callClaude = async (promptType: string) => {
    if (!topic && promptType !== 'trending') {
      alert("Please enter a topic or symbol first.")
      return
    }

    setLoading(true)
    setAiOutput('')
    
    let prompt = ''
    if (promptType === 'youtube') {
      prompt = `Act as an expert YouTube strategist for a Nepal Finance channel called "Goxent". The target audience is Nepali retail investors. Generate 5 highly engaging YouTube video title ideas about: "${topic}". For each idea, provide:\n1. The Hook (first 5 seconds)\n2. Thumbnail Concept\n3. 3 Key Talking points.\nFormat clearly with bold headings.`
    } else if (promptType === 'deepdive') {
      prompt = `Act as a senior NEPSE financial analyst. Provide a content research brief for the topic/stock: "${topic}". Include:\n1. What to cover (The core narrative)\n2. Key data points to look up\n3. The narrative angle (Bullish/Bearish/Neutral)\n4. Why Nepali investors should care.`
    } else {
      prompt = `Act as a NEPSE market pulse expert. What are the 3 hottest trending topics in Nepal finance right now? For each, explain WHY it's trending and suggest a content angle for a finance creator.`
    }

    try {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
      if (!apiKey) {
        setAiOutput("Error: VITE_CLAUDE_API_KEY is not set in your .env file. Please add it to use AI features.")
        setLoading(false)
        return
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620', // Updated to valid sonnet model
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'API Error')
      }

      const data = await res.json()
      setAiOutput(data.content[0].text)
    } catch (err: any) {
      setAiOutput(`Error generating content: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAI = () => {
    if (!aiOutput) return
    const idea: Idea = {
      id: Date.now().toString(),
      title: topic ? `Research: ${topic}` : 'Trending Topics',
      content: aiOutput,
      type: 'AI Research',
      date: new Date().toLocaleDateString()
    }
    saveIdeas([idea, ...ideas])
    setActiveTab('ideas')
  }

  const handleAddIdea = () => {
    if (!newIdea.title) return
    const idea: Idea = {
      id: Date.now().toString(),
      title: newIdea.title,
      content: newIdea.content,
      type: 'Manual',
      date: new Date().toLocaleDateString()
    }
    saveIdeas([idea, ...ideas])
    setNewIdea({ title: '', content: '' })
    setIsAdding(false)
  }

  const deleteIdea = (id: string) => {
    saveIdeas(ideas.filter(i => i.id !== id))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>Saved Ideas</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ideas.map(idea => (
            <div key={idea.id} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent' }} onClick={() => setActiveTab('ideas')}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idea.title}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
                <span>{idea.type}</span>
                <span>{idea.date}</span>
              </div>
            </div>
          ))}
          {ideas.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 24 }}>No saved ideas.</p>}
        </div>
      </div>

      {/* Main Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 16 }}>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'ai' ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: activeTab === 'ai' ? 700 : 500, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setActiveTab('ai')}
          ><Search size={18} /> AI Research</button>
          <button 
            style={{ background: 'none', border: 'none', color: activeTab === 'ideas' ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: activeTab === 'ideas' ? 700 : 500, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setActiveTab('ideas')}
          ><Lightbulb size={18} /> My Ideas</button>
        </div>

        {activeTab === 'ai' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Enter stock symbol (e.g. NICA) or topic (e.g. Hydropower bubble)..." 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button className="btn" onClick={() => callClaude('youtube')}><Search size={14}/> YouTube Ideas</button>
              <button className="btn" onClick={() => callClaude('deepdive')}><MessageSquare size={14}/> NEPSE Deep Dive</button>
              <button className="btn" onClick={() => callClaude('trending')}><TrendingUp size={14}/> Trending Topics</button>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, overflowY: 'auto', border: '1px solid var(--border)', position: 'relative' }}>
              {loading ? (
                <div style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Claude is thinking...</div>
              ) : aiOutput ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
                  {aiOutput}
                  <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={handleSaveAI}><Save size={14} /> Save</button>
                    <button 
                      className="btn" 
                      onClick={async () => {
                        const email = prompt("Enter email to send research:");
                        if (!email) return;
                        try {
                          const res = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              to: email,
                              subject: `Goxent Research: ${topic || 'Market Pulse'}`,
                              html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                                <h1 style="color: #f59e0b;">NEPSE Research Report</h1>
                                <p><strong>Topic:</strong> ${topic || 'Trending'}</p>
                                <hr />
                                <div style="white-space: pre-wrap;">${aiOutput}</div>
                                <hr />
                                <p style="font-size: 12px; color: #666;">Generated by Goxent Premium Terminal</p>
                              </div>`
                            })
                          });
                          if (res.ok) alert("Research sent successfully!");
                          else throw new Error("Failed to send");
                        } catch (err) {
                          alert("Error sending email: " + err.message);
                        }
                      }}
                    >
                      <Send size={14} /> Email Report
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                  <Search size={32} style={{ opacity: 0.2 }} />
                  <p>Select a research type to generate content ideas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Idea Vault</h3>
              <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}><Plus size={16}/> Add Idea</button>
            </div>

            {isAdding && (
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 24, border: '1px solid var(--gold)' }}>
                <input type="text" placeholder="Idea Title" value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} style={{ marginBottom: 12 }} />
                <textarea placeholder="Write your ideas, scripts, or hooks here..." value={newIdea.content} onChange={e => setNewIdea({...newIdea, content: e.target.value})} rows={5} style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={handleAddIdea}>Save Idea</button>
                  <button className="btn" onClick={() => setIsAdding(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ideas.map(idea => (
                <div key={idea.id} style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{idea.title}</h4>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{idea.type} • {idea.date}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" style={{ padding: '6px 10px' }} onClick={() => navigator.clipboard.writeText(idea.content)}><Copy size={14}/></button>
                      <button className="btn" style={{ padding: '6px 10px', color: 'var(--red)' }} onClick={() => deleteIdea(idea.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                    {idea.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
