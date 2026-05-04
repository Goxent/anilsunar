import { useState, useMemo } from 'react'
import { Copy, Check, Clock, Bookmark, BookmarkCheck,
  RefreshCw, Pencil, Sparkles, TrendingUp,
  FileText, Scale, Wallet, BarChart3, Globe } from 'lucide-react'
import linkedinContent from '../data/linkedin-content.json'

// ── TYPES ─────────────────────────────────────────────────────
interface Post {
  topicType: string
  finalTitle?: string
  finalHook?: string
  finalBody?: string
  finalCTA?: string
  finalHashtags?: string[]
  copyText?: string
  bestPostTime?: string
  estimatedEngagement?: string
  supervisorNote?: string
  geminiDraftQuality?: string
  // Gemini fallback fields
  angle?: string
  draftHook?: string
  draftBody?: string
  draftHashtags?: string[]
}

// ── CONFIG ─────────────────────────────────────────────────────
const TOPIC_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  'NEPSE':             { color: '#00897b', icon: <BarChart3 size={12}/>, label: 'NEPSE' },
  'GLOBAL_MARKET':     { color: '#1a73e8', icon: <Globe size={12}/>,    label: 'Global Market' },
  'REGULATORY':        { color: '#e53935', icon: <Scale size={12}/>,    label: 'Regulatory' },
  'AUDITING':          { color: '#2e7d32', icon: <FileText size={12}/>, label: 'Auditing' },
  'FINANCIAL_LITERACY':{ color: '#f59e0b', icon: <TrendingUp size={12}/>, label: 'Finance' },
  'Taxation':          { color: '#e53935', icon: <Wallet size={12}/>,   label: 'Taxation' },
  'Corporate Law':     { color: '#6a1b9a', icon: <Scale size={12}/>,    label: 'Corporate Law' },
}

// ── COPY HOOK ─────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string|null>(null)
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text || '')
    setCopied(id)
    setTimeout(() => setCopied(null), 2500)
  }
  return { copy, copied }
}

// ── POST CARD ─────────────────────────────────────────────────
function PostCard({ post, index }: { post: Post; index: number }) {
  const { copy, copied } = useCopy()
  const [saved, setSaved] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('goxent_saved_posts') || '[]')
      return s.includes(index)
    } catch { return false }
  })

  const config = TOPIC_CONFIG[post.topicType] || {
    color: '#64748b', icon: <Pencil size={12}/>, label: post.topicType
  }

  const hook       = post.finalHook || post.draftHook || ''
  const body       = post.finalBody || post.draftBody || ''
  const cta        = post.finalCTA || ''
  const hashtags   = post.finalHashtags || post.draftHashtags || []
  const copyText   = post.copyText ||
    [post.finalTitle, hook, body, cta, hashtags.join(' ')].filter(Boolean).join('\n\n')

  const toggleSave = () => {
    try {
      const s: number[] = JSON.parse(localStorage.getItem('goxent_saved_posts') || '[]')
      const next = saved ? s.filter((x: number) => x !== index) : [...s, index]
      localStorage.setItem('goxent_saved_posts', JSON.stringify(next))
      setSaved(!saved)
    } catch { /* skip */ }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `3px solid ${config.color}`,
        borderRadius: 16, padding: 22,
        transition: 'border-color 0.2s ease',
        opacity: saved ? 0.6 : 1
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = config.color + '44' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            display:'flex', alignItems:'center', gap:4,
            background: config.color, color:'white',
            padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700
          }}>
            {config.icon} {config.label}
          </span>
          {post.estimatedEngagement && (
            <span style={{
              fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
              background: post.estimatedEngagement === 'HIGH'
                ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
              color: post.estimatedEngagement === 'HIGH' ? '#4ADE80' : '#64748b'
            }}>
              {post.estimatedEngagement} REACH
            </span>
          )}
          {post.geminiDraftQuality === 'NEEDS_WORK' && (
            <span style={{ fontSize:10, color:'#f59e0b' }}>⚡ Claude improved</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {post.bestPostTime && (
            <span style={{ color:'var(--text-2,#64748b)', fontSize:11,
              display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10}/> {post.bestPostTime}
            </span>
          )}
          <button
            onClick={toggleSave}
            style={{ background:'none', border:'none', cursor:'pointer',
              color: saved ? '#f59e0b' : '#475569', padding:4 }}
          >
            {saved ? <BookmarkCheck size={16}/> : <Bookmark size={16}/>}
          </button>
        </div>
      </div>

      {/* Sub-title */}
      {post.finalTitle && (
        <p style={{ color:'#94a3b8', fontSize:11, margin:'0 0 8px',
          textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {post.finalTitle}
        </p>
      )}

      {/* Hook */}
      <div style={{
        background:'rgba(0,0,0,0.3)', borderRadius:8,
        padding:'12px 14px', marginBottom:12,
        borderLeft:`3px solid ${config.color}`
      }}>
        <p style={{ color:'#e2e8f0', fontSize:14, margin:0, fontWeight:700, lineHeight:1.5 }}>
          "{hook}"
        </p>
      </div>

      {/* Body preview */}
      <div style={{ marginBottom:12 }}>
        <p style={{ color:'#94a3b8', fontSize:13, margin:0, lineHeight:1.7, whiteSpace:'pre-line' }}>
          {body.slice(0, 300)}{body.length > 300 ? '...' : ''}
        </p>
        {cta && (
          <p style={{ color:'#f59e0b', fontSize:13, margin:'8px 0 0', fontWeight:600 }}>
            → {cta}
          </p>
        )}
      </div>

      {/* Hashtags */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:14 }}>
        {hashtags.map((tag: string) => (
          <span key={tag} style={{
            background:'rgba(129,140,248,0.1)', color:'#818cf8',
            fontSize:11, padding:'2px 8px', borderRadius:10
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Claude supervisor note */}
      {post.supervisorNote && !post.supervisorNote.includes('Gemini') && (
        <div style={{
          background:'rgba(212,175,55,0.06)',
          border:'1px solid rgba(212,175,55,0.15)',
          borderRadius:8, padding:'8px 12px', marginBottom:12
        }}>
          <p style={{ color:'#f59e0b', fontSize:11, margin:0, fontWeight:600 }}>
            ◆ Claude: {post.supervisorNote}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={() => copy(hook, `hook-${index}`)}
          style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, padding:'8px 12px', cursor:'pointer',
            color:'#94a3b8', fontSize:12, fontWeight:600
          }}
        >
          {copied === `hook-${index}` ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Hook</>}
        </button>
        <button
          onClick={() => copy(copyText, `full-${index}`)}
          style={{
            flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            background: config.color, border:'none',
            borderRadius:8, padding:'8px 16px', cursor:'pointer',
            color:'white', fontSize:12, fontWeight:700
          }}
        >
          {copied === `full-${index}` ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy Full Post</>}
        </button>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function ContentStudio() {
  const content = linkedinContent as any
  const posts: Post[] = content?.posts || []
  const [filter, setFilter] = useState('All')

  const topics = ['All', ...Array.from(new Set(posts.map((p: Post) => p.topicType)))]

  const filtered = useMemo(() =>
    filter === 'All' ? posts : posts.filter((p: Post) => p.topicType === filter),
    [posts, filter]
  )

  const dataAge = content?.generatedAt
    ? Math.round((Date.now() - new Date(content.generatedAt).getTime()) / 3600000)
    : null

  const supervisorActive = content?.supervisorActive

  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.3em', color:'var(--gold,#d4af37)', margin:'0 0 6px' }}>
          CONTENT & AI
        </p>
        <h2 style={{ fontSize:28, fontWeight:800, color:'white', margin:'0 0 6px' }}>
          Content Studio
        </h2>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <p style={{ color:'var(--text-2,#64748b)', fontSize:14, margin:0 }}>
            LinkedIn posts for Nepal CA professional
          </p>
          <div style={{
            padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
            background: supervisorActive ? 'rgba(217,119,6,0.15)' : 'rgba(66,133,244,0.15)',
            border: `1px solid ${supervisorActive ? 'rgba(217,119,6,0.4)' : 'rgba(66,133,244,0.4)'}`,
            color: supervisorActive ? '#d97706' : '#4285f4',
            display:'flex', alignItems:'center', gap:4
          }}>
            <Sparkles size={10}/>
            {supervisorActive ? '◆ Gemini + Claude' : '✦ Gemini'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Posts Ready',  value: posts.length,                                          color:'var(--gold,#d4af37)' },
          { label:'High Reach',   value: posts.filter((p: Post) => p.estimatedEngagement === 'HIGH').length, color:'#4ADE80' },
          { label:'AI Pipeline',  value: supervisorActive ? 'Dual AI' : 'Gemini',               color:'#818cf8', isText:true },
          { label:'Data Age',     value: dataAge !== null ? `${dataAge}h` : 'No data',          color: dataAge && dataAge > 24 ? '#f59e0b' : '#4ADE80', isText:true },
        ].map(s => (
          <div key={s.label} style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:12, padding:'14px 16px'
          }}>
            <p style={{ color:s.color, fontSize: s.isText ? 16 : 24, fontWeight:800, margin:'0 0 4px' }}>
              {s.value}
            </p>
            <p style={{ color:'var(--text-2,#64748b)', fontSize:11, margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Freshness banner */}
      {dataAge !== null && (
        <div style={{
          background: dataAge > 24 ? 'rgba(245,158,11,0.08)' : 'rgba(74,222,128,0.08)',
          border: `1px solid ${dataAge > 24 ? 'rgba(245,158,11,0.2)' : 'rgba(74,222,128,0.2)'}`,
          borderRadius:10, padding:'10px 16px', marginBottom:20,
          display:'flex', alignItems:'center', gap:8, fontSize:13,
          color: dataAge > 24 ? '#f59e0b' : '#4ADE80'
        }}>
          <RefreshCw size={14}/>
          {dataAge > 24
            ? `Content is ${dataAge}h old — run: npm run linkedin-pipeline`
            : `Fresh content — generated ${dataAge}h ago`}
        </div>
      )}

      {/* No content state */}
      {posts.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-2,#64748b)' }}>
          <Pencil size={40} style={{ marginBottom:12, opacity:0.3 }}/>
          <p style={{ fontSize:16, fontWeight:600, color:'#64748b', margin:'0 0 12px' }}>
            No content generated yet
          </p>
          <p style={{ fontSize:13, margin:'0 0 16px' }}>
            Run this command in your terminal:
          </p>
          <code style={{
            background:'rgba(255,255,255,0.06)',
            padding:'8px 20px', borderRadius:8, fontSize:13, color:'#f59e0b'
          }}>
            npm run linkedin-pipeline
          </code>
        </div>
      )}

      {/* Topic filter + posts */}
      {posts.length > 0 && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  background: filter === t ? 'var(--gold,#d4af37)' : 'rgba(255,255,255,0.05)',
                  color: filter === t ? 'black' : '#94a3b8',
                  border:'none', borderRadius:8, padding:'6px 14px',
                  cursor:'pointer', fontSize:12, fontWeight:700
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(440px,1fr))', gap:20 }}>
            {filtered.map((post: Post, i: number) => (
              <PostCard key={i} post={post} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
