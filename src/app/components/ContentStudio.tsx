import { useState, useEffect } from 'react'
import { Lightbulb, Search, TrendingUp, Save, Copy, Trash2, Plus, MessageSquare, Send, Users, Sparkles, Brain } from 'lucide-react'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { callAI } from '../lib/ai'
import aiDigestRaw from '../data/ai_digest.json'

const aiDigest = aiDigestRaw as {
  linkedinIdeas: Array<{
    topic: string;
    title: string;
    angle: string;
    hook: string;
    keyTakeaway: string;
    bestTimeToPost: string;
  }>
};

type Idea = {
  id: string;
  title: string;
  content: string;
  type: string;
  date: string;
  createdAt: any;
}

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState<'ai' | 'ideas' | 'digest'>('digest')
  const [topic, setTopic] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState({ title: '', content: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/ideas`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIdeas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Idea[];
      setIdeas(fetchedIdeas);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveAI = async () => {
    if (!aiOutput || !auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/ideas`), {
        title: topic || 'AI Research',
        content: aiOutput,
        type: 'AI',
        date: new Date().toLocaleDateString(),
        createdAt: Timestamp.now()
      });
      alert("Saved to Idea Vault!");
    } catch (err) {
      console.error(err);
    }
  }

  const handleSaveDigestIdea = async (idea: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/ideas`), {
        title: idea.title,
        content: `Topic: ${idea.topic}\n\nHook: ${idea.hook}\n\nAngle: ${idea.angle}\n\nKey Takeaway: ${idea.keyTakeaway}\n\nBest Time: ${idea.bestTimeToPost}`,
        type: 'LinkedIn',
        date: new Date().toLocaleDateString(),
        createdAt: Timestamp.now()
      });
      alert("Added to Idea Vault!");
    } catch (err) {
      console.error(err);
    }
  }

  const handleAddIdea = async () => {
    if (!newIdea.title || !auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/ideas`), {
        ...newIdea,
        type: 'Manual',
        date: new Date().toLocaleDateString(),
        createdAt: Timestamp.now()
      });
      setNewIdea({ title: '', content: '' });
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  }

  const deleteIdea = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/ideas`, id));
    } catch (err) {
      console.error(err);
    }
  }

  const callClaude = async (promptType: string) => {
    if (!topic && promptType !== 'trending') {
      alert("Please enter a topic or symbol first.")
      return
    }

    setLoading(true)
    try {
      const prompts: any = {
        youtube: `Generate 3 high-retention YouTube video ideas for the topic: ${topic}. Include catchy titles and a brief script outline.`,
        linkedin: `Write a viral LinkedIn post about ${topic}. Include a strong hook, value-driven body, and a CTA.`,
        deepdive: `Perform a deep dive analysis on ${topic}. Cover current trends, risks, and opportunities in the Nepal market context.`,
        trending: `What are the top 5 trending topics in the Nepal stock market and finance world today?`
      }

      const result = await callAI(prompts[promptType] || topic)
      setAiOutput(result)
    } catch (err) {
      console.error(err)
      setAiOutput("Error generating content. Check console.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>Content Studio</h2>
        <div className="tab-group" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
          <button className={`tab ${activeTab === 'digest' ? 'active' : ''}`} onClick={() => setActiveTab('digest')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> AI Suggestions
          </button>
          <button className={`tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={14} /> Custom AI
          </button>
          <button className={`tab ${activeTab === 'ideas' ? 'active' : ''}`} onClick={() => setActiveTab('ideas')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={14} /> Idea Vault
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 24, overflow: 'hidden' }}>
        {activeTab === 'digest' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Daily AI-generated LinkedIn content based on today's market anomalies.</p>
              <div style={{ fontSize: 11, color: 'var(--gold)', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.2)' }}>
                CLAUDE 3.5 SONNET
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {aiDigest.linkedinIdeas && aiDigest.linkedinIdeas.length > 0 ? aiDigest.linkedinIdeas.map((idea, i) => (
                <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--gold)', color: 'black', padding: '2px 8px', borderRadius: 4 }}>{idea.topic}</span>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleSaveDigestIdea(idea)}>
                      <Plus size={14} /> Add to Vault
                    </button>
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{idea.title}</h4>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '2px solid var(--gold)', paddingLeft: 12 }}>"{idea.hook}"</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{idea.angle}</p>
                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span>Takeaway: {idea.keyTakeaway}</span>
                    <span style={{ fontWeight: 700 }}>{idea.bestTimeToPost}</span>
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, opacity: 0.5 }}>
                   No AI suggestions yet. Run the daily sync.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Topic, stock symbol, or industry (e.g. 'Hydropower' or 'TDS')..." 
                value={topic} 
                onChange={e => setTopic(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button className="btn" onClick={() => callClaude('youtube')}><Search size={14}/> YouTube Ideas</button>
              <button className="btn" onClick={() => callClaude('linkedin')}><Users size={14}/> LinkedIn Ideas</button>
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
