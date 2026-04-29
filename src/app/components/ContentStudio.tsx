import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Youtube, TrendingUp, BookOpen, 
  Save, Trash2, Calendar, FileText, Sparkles, 
  ChevronRight, Layout, History, MessageSquare, 
  PenTool, Clock, Trash, Copy
} from 'lucide-react';
import { useToast } from '../AppShell';
import { callClaude } from '../lib/ai';

interface ContentIdea {
  id: string;
  title: string;
  date: string;
  type: 'YouTube Ideas' | 'NEPSE Deep Dive' | 'Trending Topics';
  topic: string;
  content: string;
  notes?: string;
}

export default function ContentStudio() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'research' | 'editor'>('research');
  
  // Research state
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState('');
  
  // Editor state
  const [editingIdea, setEditingIdea] = useState<Partial<ContentIdea>>({
    title: '',
    content: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('goxent_content_ideas');
    if (saved) setIdeas(JSON.parse(saved));
  }, []);

  const saveToLocal = (updatedIdeas: ContentIdea[]) => {
    localStorage.setItem('goxent_content_ideas', JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);
  };

  const handleResearch = async (type: ContentIdea['type']) => {
    if (!researchTopic) {
      showToast("Please enter a research topic or stock symbol", "error");
      return;
    }

    setIsResearching(true);
    setResearchResult('');
    
    try {
      let prompt = '';
      if (type === 'YouTube Ideas') {
        prompt = `Generate 5 YouTube video title ideas for my channel "Goxent" about Nepal finance targeting retail investors. 
        Topic: ${researchTopic}.
        For each idea, provide:
        1. Title (Click-worthy)
        2. Hook (First 30 seconds)
        3. Thumbnail Concept
        4. 5 Key Talking Points
        Respond in a clean Markdown format.`;
      } else if (type === 'NEPSE Deep Dive') {
        prompt = `Research the stock/topic "${researchTopic}" in the context of NEPSE (Nepal Stock Exchange). 
        Provide a detailed content brief including:
        1. Current Market Context
        2. Technical/Fundamental Data Points to cover
        3. Key Risks & Opportunities
        4. "What to tell the viewers" summary.
        Respond in a clean Markdown format.`;
      } else {
        prompt = `What are the trending topics or common questions Nepali investors have about "${researchTopic}" right now? 
        Provide 5 trending themes with data-backed reasoning and a suggested "Hot Take" for each to trigger engagement.
        Respond in a clean Markdown format.`;
      }

      const result = await callClaude(prompt, 1500);
      setResearchResult(result);
      showToast("Research complete!", "success");
    } catch (err: any) {
      showToast("Research failed: " + err.message, "error");
    } finally {
      setIsResearching(false);
    }
  };

  const saveResearchAsIdea = () => {
    if (!researchResult) return;
    
    const newIdea: ContentIdea = {
      id: Date.now().toString(),
      title: `${researchTopic} - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      type: 'YouTube Ideas', // Default
      topic: researchTopic,
      content: researchResult,
      notes: ''
    };

    const updated = [newIdea, ...ideas];
    saveToLocal(updated);
    setSelectedId(newIdea.id);
    setActiveMode('editor');
    setEditingIdea(newIdea);
    showToast("Research saved to My Ideas", "success");
  };

  const selectIdea = (id: string) => {
    const idea = ideas.find(i => i.id === id);
    if (idea) {
      setSelectedId(id);
      setEditingIdea(idea);
      setActiveMode('editor');
    }
  };

  const updateIdea = (updates: Partial<ContentIdea>) => {
    setEditingIdea(prev => ({ ...prev, ...updates }));
    if (selectedId) {
      const updated = ideas.map(i => i.id === selectedId ? { ...i, ...updates } : i);
      saveToLocal(updated);
    }
  };

  const deleteIdea = (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    const updated = ideas.filter(i => i.id !== id);
    saveToLocal(updated);
    if (selectedId === id) {
      setSelectedId(null);
      setActiveMode('research');
    }
    showToast("Idea deleted", "info");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', margin: '-24px', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: 300, 
        borderRight: '1px solid var(--border)', 
        background: 'var(--bg-secondary)', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--gold)" /> Idea Vault
          </h3>
          <button 
            onClick={() => { setActiveMode('research'); setSelectedId(null); setResearchResult(''); }}
            style={{ 
              width: '100%', marginTop: 16, padding: '10px', 
              background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', 
              border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              fontSize: 13, fontWeight: 700, cursor: 'pointer' 
            }}
          >
            <Plus size={16} /> New Research
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {ideas.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, marginTop: 40 }}>No ideas saved yet.</p>
          ) : (
            ideas.map(idea => (
              <div 
                key={idea.id}
                onClick={() => selectIdea(idea.id)}
                style={{ 
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                  background: selectedId === idea.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedId === idea.id ? 'var(--gold)' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idea.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                  <Calendar size={10} /> {new Date(idea.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', padding: '0 24px', background: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border)', height: 50, alignItems: 'center', gap: 32 
        }}>
          <button 
            onClick={() => setActiveMode('research')}
            style={{ 
              height: '100%', background: 'none', border: 'none', cursor: 'pointer',
              color: activeMode === 'research' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: 700, borderBottom: activeMode === 'research' ? '2px solid var(--gold)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Sparkles size={16} /> AI Research
          </button>
          <button 
            onClick={() => setActiveMode('editor')}
            style={{ 
              height: '100%', background: 'none', border: 'none', cursor: 'pointer',
              color: activeMode === 'editor' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: 700, borderBottom: activeMode === 'editor' ? '2px solid var(--gold)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <PenTool size={16} /> My Ideas
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
          {activeMode === 'research' ? (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Content Intelligence</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Research trends and generate high-impact video ideas for Goxent.</p>
              </div>

              <div className="card" style={{ padding: 32, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Topic or Stock Symbol</label>
                  <input 
                    type="text" 
                    value={researchTopic}
                    onChange={(e) => setResearchTopic(e.target.value)}
                    placeholder="e.g. NABIL, Real Estate Bubble, Monetary Policy..."
                    style={{ width: '100%', padding: '16px', fontSize: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <button onClick={() => handleResearch('YouTube Ideas')} disabled={isResearching} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <Youtube size={24} color="#ef4444" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>YouTube Ideas</span>
                  </button>
                  <button onClick={() => handleResearch('NEPSE Deep Dive')} disabled={isResearching} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <TrendingUp size={24} color="var(--gold)" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>NEPSE Deep Dive</span>
                  </button>
                  <button onClick={() => handleResearch('Trending Topics')} disabled={isResearching} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <Layout size={24} color="var(--info-color)" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Trending Topics</span>
                  </button>
                </div>
              </div>

              {isResearching && (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Claude is analyzing Nepal finance data...</p>
                </div>
              )}

              {researchResult && (
                <div className="animate-fade-in" style={{ marginTop: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Research Result</h3>
                    <button onClick={saveResearchAsIdea} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'black', fontWeight: 700, borderRadius: 8, border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <Save size={16} /> Save to Ideas
                    </button>
                  </div>
                  <div className="card" style={{ padding: 32, background: 'white', color: '#1a1a1a', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap' }}>
                    {researchResult}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <input 
                  type="text" 
                  value={editingIdea.title || ''} 
                  onChange={(e) => updateIdea({ title: e.target.value })}
                  placeholder="Idea Title..."
                  style={{ fontSize: 32, fontWeight: 900, background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                />
                <button onClick={() => deleteIdea(selectedId!)} style={{ padding: 8, color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Script / Brief</label>
                    <textarea 
                      value={editingIdea.content || ''} 
                      onChange={(e) => updateIdea({ content: e.target.value })}
                      placeholder="Write your script or research notes here..."
                      style={{ width: '100%', height: 600, padding: 24, fontSize: 15, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, color: 'white', lineHeight: 1.6, resize: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={16} color="var(--gold)" /> Side Notes
                    </h4>
                    <textarea 
                      value={editingIdea.notes || ''} 
                      onChange={(e) => updateIdea({ notes: e.target.value })}
                      placeholder="Internal team notes..."
                      style={{ width: '100%', height: 200, padding: 12, fontSize: 13, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', resize: 'none' }}
                    />
                  </div>

                  <button onClick={() => copyToClipboard(editingIdea.content || '')} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                    <Copy size={16} /> Copy Brief
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
