import { useState } from 'react'
import { Copy, Check, Clock, Bookmark, RefreshCw, Pencil } from 'lucide-react'
import aiDigest from '../data/ai_digest.json'
import { getAIProviderInfo } from '../lib/ai'

const TOPIC_COLORS: Record<string,string> = {
  'NEPSE': '#00695c', 'Taxation': '#e53935', 'Auditing': '#1a73e8',
  'Corporate Law': '#6a1b9a', 'Finance': '#f59e0b', 'Accounting': '#2e7d32'
}

export default function ContentStudio() {
  const digest = aiDigest as any
  const ideas = digest?.linkedinIdeas || []
  const [copied, setCopied] = useState<string|null>(null)
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('goxent_used_ideas')||'[]'))
  )
  const ai = getAIProviderInfo()

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleSave = (id: string) => {
    const next = new Set(saved)
    next.has(id) ? next.delete(id) : next.add(id)
    setSaved(next)
    localStorage.setItem('goxent_used_ideas', JSON.stringify([...next]))
  }

  const dataAge = digest?.timestamp
    ? Math.round((Date.now()-new Date(digest.timestamp).getTime())/3600000)
    : null

  return (
    <div style={{ padding:24, maxWidth:900 }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'0.3em',color:'var(--gold)',margin:'0 0 6px' }}>CONTENT & AI</p>
        <h2 style={{ fontSize:28,fontWeight:800,color:'white',margin:'0 0 4px' }}>Content Studio</h2>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <p style={{ color:'var(--text-secondary)',fontSize:14,margin:0 }}>
            LinkedIn post ideas for Nepal CA professional
          </p>
          <div style={{ padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,
            background:`${ai.color}18`,border:`1px solid ${ai.color}44`,color:ai.color }}>
            {ai.badge}
          </div>
        </div>
      </div>

      {/* FRESHNESS */}
      {dataAge !== null && (
        <div style={{ background:dataAge>24?'rgba(245,158,11,0.1)':'rgba(74,222,128,0.08)',
          border:`1px solid ${dataAge>24?'rgba(245,158,11,0.3)':'rgba(74,222,128,0.2)'}`,
          borderRadius:10,padding:'10px 16px',marginBottom:20,
          display:'flex',alignItems:'center',gap:8,fontSize:13,
          color:dataAge>24?'#f59e0b':'#4ADE80' }}>
          <RefreshCw size={14}/>
          {dataAge>24 ? `Ideas are ${dataAge}h old — run npm run full-sync to refresh`
            : `Fresh ideas generated ${dataAge}h ago`}
          <span style={{ color:'var(--text-secondary)',fontSize:11,marginLeft:'auto' }}>
            {new Date(digest.timestamp).toLocaleDateString('en-NP')}
          </span>
        </div>
      )}

      {/* NO IDEAS STATE */}
      {ideas.length === 0 && (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--text-secondary)' }}>
          <Pencil size={40} style={{ marginBottom:12,opacity:0.3 }}/>
          <p style={{ fontSize:16,fontWeight:600,color:'#64748b',margin:'0 0 8px' }}>
            No LinkedIn ideas yet
          </p>
          <p style={{ fontSize:13,margin:'0 0 16px' }}>
            Run this command from your terminal:
          </p>
          <code style={{ background:'rgba(255,255,255,0.05)',padding:'8px 16px',
            borderRadius:8,fontSize:13,color:'#f59e0b' }}>
            npm run full-sync
          </code>
        </div>
      )}

      {/* IDEAS GRID */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))',gap:16 }}>
        {ideas.map((idea: any, i: number) => {
          const topicColor = TOPIC_COLORS[idea.topic] || '#64748b'
          const isSaved = saved.has(String(i))
          const fullPost = `${idea.title}\n\n${idea.hook}\n\n${idea.angle}\n\n${idea.keyTakeaway}\n\n${(idea.hashtags||[]).join(' ')}`

          return (
            <div key={i} style={{ background:isSaved?'rgba(255,255,255,0.01)':'rgba(255,255,255,0.02)',
              border:`1px solid ${isSaved?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.06)'}`,
              borderRadius:16,padding:20,opacity:isSaved?0.6:1,
              transition:'all 0.2s' }}>

              {/* HEADER */}
              <div style={{ display:'flex',alignItems:'center',
                justifyContent:'space-between',marginBottom:14 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ background:topicColor,color:'white',padding:'3px 10px',
                    borderRadius:20,fontSize:11,fontWeight:700 }}>{idea.topic}</span>
                  <span style={{ color:'#475569',fontSize:11 }}>
                    <Clock size={10} style={{ marginRight:3,verticalAlign:'middle' }}/>
                    {idea.bestTimeToPost}
                  </span>
                </div>
                <button onClick={() => toggleSave(String(i))}
                  style={{ background:'none',border:'none',cursor:'pointer',
                    color:isSaved?'#f59e0b':'#64748b' }}>
                  <Bookmark size={16} fill={isSaved?'currentColor':'none'}/>
                </button>
              </div>

              {/* TITLE */}
              <h3 style={{ color:'white',fontSize:15,fontWeight:800,
                margin:'0 0 12px',lineHeight:1.4 }}>{idea.title}</h3>

              {/* HOOK */}
              <div style={{ background:'rgba(0,0,0,0.3)',borderRadius:8,
                padding:12,marginBottom:12,borderLeft:`3px solid ${topicColor}` }}>
                <p style={{ color:'#94a3b8',fontSize:13,margin:0,
                  fontStyle:'italic',lineHeight:1.6 }}>"{idea.hook}"</p>
              </div>

              {/* ANGLE */}
              <p style={{ color:'#cbd5e1',fontSize:13,lineHeight:1.6,
                margin:'0 0 12px' }}>{idea.angle}</p>

              {/* KEY TAKEAWAY */}
              <div style={{ background:'rgba(212,175,55,0.06)',
                border:'1px solid rgba(212,175,55,0.2)',
                borderRadius:8,padding:'8px 12px',marginBottom:14 }}>
                <p style={{ color:'#f59e0b',fontSize:12,margin:0 }}>
                  💡 {idea.keyTakeaway}
                </p>
              </div>

              {/* HASHTAGS */}
              <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:14 }}>
                {(idea.hashtags||[]).map((tag: string) => (
                  <span key={tag} style={{ background:'rgba(129,140,248,0.1)',
                    color:'#818cf8',fontSize:11,padding:'2px 8px',borderRadius:10 }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* COPY BUTTONS */}
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={() => copy(idea.hook, `hook-${i}`)}
                  style={{ display:'flex',alignItems:'center',gap:4,flex:1,
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:8,padding:'7px 12px',cursor:'pointer',
                    color:'#94a3b8',fontSize:12,fontWeight:600,justifyContent:'center' }}>
                  {copied===`hook-${i}` ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Hook</>}
                </button>
                <button onClick={() => copy(fullPost, `full-${i}`)}
                  style={{ display:'flex',alignItems:'center',gap:4,flex:1,
                    background:topicColor,border:'none',
                    borderRadius:8,padding:'7px 12px',cursor:'pointer',
                    color:'white',fontSize:12,fontWeight:700,justifyContent:'center' }}>
                  {copied===`full-${i}` ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Full Post</>}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
