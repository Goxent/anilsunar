import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Youtube, TrendingUp, BookOpen, 
  Save, Trash2, Calendar, FileText, Sparkles, 
  ChevronRight, Layout, History, MessageSquare, 
  PenTool, Clock, Trash, Copy, Brain, Share2, Target, Check, Briefcase
} from 'lucide-react';
import { useToast } from '../AppShell';
import { callGemini } from '../lib/ai';

interface ContentIdea {
  id: string;
  title: string;
  date: string;
  type: 'YouTube Ideas' | 'NEPSE Deep Dive' | 'Trending Topics' | 'LinkedIn Ideas';
  topic: string;
  content: string;
  notes?: string;
}

interface LinkedInIdea {
  topic_badge: string;
  title: string;
  hook: string;
  angle: string;
  key_takeaway: string;
  best_time: string;
  hashtags: string[];
}

export default function ContentStudio() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'research' | 'editor'>('research');
  
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState('');
  const [linkedInIdeas, setLinkedInIdeas] = useState<LinkedInIdea[]>([]);
  
  // Regulatory state
  const [regulatoryNotices, setRegulatoryNotices] = useState<any[]>([]);

  // Editor state
  const [editingIdea, setEditingIdea] = useState<Partial<ContentIdea>>({
    title: '',
    content: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('goxent_content_ideas');
    if (saved) setIdeas(JSON.parse(saved));

    // Try to load regulatory notices dynamically
    import('../data/regulatory-notices.json')
      .then((data) => {
        if (data.default) setRegulatoryNotices(data.default);
      })
      .catch(() => console.log('No regulatory notices found. Run the scraper first.'));
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
    setLinkedInIdeas([]);
    
    try {
      if (type === 'LinkedIn Ideas') {
        const linkedinPrompt = `You are a personal brand strategist for Nepal professionals.

The user is a Nepal-based professional with expertise in:
- Auditing and accounting (ICAN, Nepal Standards on Auditing)
- NEPSE stock market analysis  
- Corporate finance and business strategy
- Nepal corporate law (Companies Act 2063, Securities Act)
- Nepal taxation (Income Tax Act 2058, VAT, TDS rules)
- General finance and business insights

Topic they want to create content about: "${researchTopic}"

Generate exactly 4 LinkedIn post ideas. For each idea:
- topic_badge: One of [Auditing, Accounting, NEPSE, Corporate Law, Taxation, Finance]
- title: Headline for the LinkedIn post (max 12 words, curiosity-driven)
- hook: First sentence that stops the scroll (punchy, 1 sentence)
- angle: The unique insight or perspective (2-3 sentences)
- key_takeaway: What reader will learn (1 sentence)
- best_time: "Morning" or "Evening"
- hashtags: 3 relevant Nepal finance hashtags

Respond ONLY in valid JSON array format. No markdown, no explanation.`;

        const result = await callGemini(linkedinPrompt);
        const clean = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        setLinkedInIdeas(parsed);
        showToast("LinkedIn strategy generated!", "success");
      } else {
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

        const result = await callGemini(prompt);
        setResearchResult(result);
        showToast("Research complete!", "success");
      }
    } catch (err: any) {
      showToast("Research failed: " + err.message, "error");
    } finally {
      setIsResearching(false);
    }
  };

  const saveResearchAsIdea = () => {
    if (!researchResult && linkedInIdeas.length === 0) return;
    
    const content = researchResult || JSON.stringify(linkedInIdeas, null, 2);
    const newIdea: ContentIdea = {
      id: Date.now().toString(),
      title: `${researchTopic} - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      type: 'YouTube Ideas', 
      topic: researchTopic,
      content: content,
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

  const renderLinkedInIdeas = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      {linkedInIdeas.map((idea, idx) => (
        <div key={idx} className="premium-card p-8 flex flex-col h-full hover:border-gold/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              idea.topic_badge === 'NEPSE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              idea.topic_badge === 'Taxation' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {idea.topic_badge}
            </span>
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold">
              <Clock size={12} /> {idea.best_time}
            </div>
          </div>

          <h3 className="text-xl font-black text-white mb-4 leading-tight">{idea.title}</h3>
          
          <div className="bg-zinc-900/50 rounded-xl p-4 mb-4 border border-zinc-800 italic text-zinc-300 text-sm">
            "{idea.hook}"
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
            {idea.angle}
          </p>

          <div className="border-l-2 border-gold pl-4 py-1 mb-6">
            <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Key Takeaway</p>
            <p className="text-white text-xs font-bold">{idea.key_takeaway}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {idea.hashtags.map(tag => (
              <span key={tag} className="text-[10px] font-bold text-zinc-600">{tag}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto">
            <button 
              onClick={() => copyToClipboard(idea.hook)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:text-gold hover:border-gold/30 transition-all"
            >
              <Copy size={14} /> Copy Hook
            </button>
            <button 
              onClick={() => copyToClipboard(`${idea.title}\n\n${idea.hook}\n\n${idea.angle}\n\n${idea.key_takeaway}\n\n${idea.hashtags.join(' ')}`)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              <Share2 size={14} /> Copy Post
            </button>
          </div>
        </div>
      ))}
    </div>
  );

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
            onClick={() => { setActiveMode('research'); setSelectedId(null); setResearchResult(''); setLinkedInIdeas([]); }}
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
          <button 
            onClick={() => setActiveMode('regulatory')}
            style={{ 
              height: '100%', background: 'none', border: 'none', cursor: 'pointer',
              color: activeMode === 'regulatory' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: 700, borderBottom: activeMode === 'regulatory' ? '2px solid var(--gold)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <BookOpen size={16} /> Regulatory Updates
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
          {activeMode === 'research' ? (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Content Intelligence</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Research trends and generate high-impact video ideas for Goxent.</p>
              </div>

              <div className="premium-card p-10 space-y-8">
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.1em' }}>Topic or Stock Symbol</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="e.g. NABIL, Real Estate Bubble, Monetary Policy..."
                      style={{ width: '100%', padding: '20px 20px 20px 60px', fontSize: 18, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 20, color: 'white', fontWeight: 600 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <button onClick={() => handleResearch('YouTube Ideas')} disabled={isResearching} className="premium-card p-6 flex flex-col items-center gap-4 hover:border-gold/30 transition-all cursor-pointer group">
                    <Youtube size={28} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>YouTube Ideas</span>
                  </button>
                  <button onClick={() => handleResearch('NEPSE Deep Dive')} disabled={isResearching} className="premium-card p-6 flex flex-col items-center gap-4 hover:border-gold/30 transition-all cursor-pointer group">
                    <TrendingUp size={28} className="text-gold group-hover:scale-110 transition-transform" />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEPSE Deep Dive</span>
                  </button>
                  <button onClick={() => handleResearch('Trending Topics')} disabled={isResearching} className="premium-card p-6 flex flex-col items-center gap-4 hover:border-gold/30 transition-all cursor-pointer group">
                    <Layout size={28} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trending Topics</span>
                  </button>
                  <button onClick={() => handleResearch('LinkedIn Ideas')} disabled={isResearching} className="premium-card p-6 flex flex-col items-center gap-4 hover:border-gold/30 transition-all cursor-pointer group">
                    <Share2 size={28} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn Ideas</span>
                  </button>
                </div>
                
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
                  Powered by Gemini 2.0 Flash · Free tier
                </p>
              </div>

              {isResearching && (
                <div style={{ textAlign: 'center', padding: 80 }} className="fade-in">
                  <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 24px' }}></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Gemini is analyzing Nepal finance data...</p>
                </div>
              )}

              {linkedInIdeas.length > 0 && renderLinkedInIdeas()}

              {researchResult && (
                <div className="animate-fade-in" style={{ marginTop: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Research Intelligence</h3>
                    <button onClick={saveResearchAsIdea} style={{ padding: '10px 24px', background: 'var(--gold)', color: 'black', fontWeight: 800, borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Save size={16} /> Save to Ideas
                    </button>
                  </div>
                  <div className="premium-card p-12 bg-white text-[#1a1a1a] leading-relaxed fontSize-16 white-space-pre-wrap">
                    {researchResult}
                  </div>
                </div>
              )}
            </div>
          ) : activeMode === 'editor' ? (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <input 
                  type="text" 
                  value={editingIdea.title || ''} 
                  onChange={(e) => updateIdea({ title: e.target.value })}
                  placeholder="Idea Title..."
                  style={{ fontSize: 40, fontWeight: 900, background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', letterSpacing: '-0.02em' }}
                />
                <button onClick={() => deleteIdea(selectedId!)} style={{ padding: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
                  <Trash size={24} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.1em' }}>Script / Brief Content</label>
                    <textarea 
                      value={editingIdea.content || ''} 
                      onChange={(e) => updateIdea({ content: e.target.value })}
                      placeholder="Write your script or research notes here..."
                      style={{ width: '100%', minHeight: 700, padding: 32, fontSize: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 20, color: 'white', lineHeight: 1.8, resize: 'none', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div className="premium-card p-8">
                    <h4 style={{ fontSize: 12, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <MessageSquare size={18} color="var(--gold)" /> Side Notes
                    </h4>
                    <textarea 
                      value={editingIdea.notes || ''} 
                      onChange={(e) => updateIdea({ notes: e.target.value })}
                      placeholder="Internal team notes, research links, or distribution strategy..."
                      style={{ width: '100%', height: 300, padding: 20, fontSize: 13, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 16, color: 'white', resize: 'none', outline: 'none', lineHeight: 1.6 }}
                    />
                  </div>

                  <button onClick={() => copyToClipboard(editingIdea.content || '')} style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>
                    <Copy size={18} /> Copy Full Brief
                  </button>
                  
                  <div className="premium-card p-8 bg-gold/5 border-gold/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Target size={18} className="text-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold">Optimization Tips</span>
                    </div>
                    <ul className="space-y-3 text-[11px] text-zinc-400 font-bold">
                      <li>• Keep hooks under 12 words</li>
                      <li>• Focus on ICAN compliance</li>
                      <li>• Add 2 local NEPSE hashtags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMode === 'regulatory' ? (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Regulatory Intelligence</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Latest notices from OCR, IRD, and ICAN. Use these for compliance and content ideas.</p>
              </div>

              {regulatoryNotices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80 }} className="premium-card">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>No notices available. The scraper might be running or data is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regulatoryNotices.slice(0, 50).map((notice, idx) => (
                    <a 
                      key={idx} 
                      href={notice.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="premium-card p-6 flex flex-col hover:border-gold/30 transition-all cursor-pointer group no-underline"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          notice.source === 'OCR Nepal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          notice.source === 'IRD Nepal' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {notice.source}
                        </span>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold">
                          <Calendar size={12} /> {new Date(notice.date).toLocaleDateString()}
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 leading-tight group-hover:text-gold transition-colors">{notice.title}</h3>
                      <div className="mt-auto pt-4 flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest group-hover:text-gold transition-colors">
                        View Notice <ChevronRight size={14} />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
