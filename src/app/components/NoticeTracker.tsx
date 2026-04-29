import { useState, useMemo } from 'react'
import { Bell, Copy, Check, ExternalLink, Filter,
  RefreshCw, FileText, TrendingUp, Scale, Building2,
  Landmark, BarChart3, Wallet } from 'lucide-react'
import noticesData from '../data/notices.json'
import postsData from '../data/notice_posts.json'

// ============================================================
// TYPE DEFINITIONS
// ============================================================
interface Notice {
  id: string
  title: string
  source: string
  category: string
  badge: string
  badgeColor: string
  link: string
  summary: string
  detectedAt: string
  isNew?: boolean
  emailedAt?: string
}

interface Post {
  headline: string
  body: string
  callToAction: string
  hashtags: string[]
  topicBadge: string
  bestTimeToPost: string
  estimatedReach: string
  keyInsight: string
  generatedBy?: string
  isTemplate?: boolean
  createdAt: string
  noticeTitle: string
  source: string
  link: string
  badgeColor: string
}

// ============================================================
// CATEGORY ICONS
// ============================================================
const CategoryIcon = ({ category }: { category: string }) => {
  const icons: Record<string, React.ReactNode> = {
    'Corporate Law': <Building2 size={14} />,
    'Taxation': <Wallet size={14} />,
    'Auditing': <FileText size={14} />,
    'Securities Law': <Scale size={14} />,
    'Banking': <Landmark size={14} />,
    'Stock Market': <BarChart3 size={14} />,
    'Finance': <TrendingUp size={14} />,
  }
  return <span>{icons[category] || <Bell size={14} />}</span>
}

// ============================================================
// COPY HOOK
// ============================================================
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copy, copied }
}

// ============================================================
// LINKEDIN POST CARD
// ============================================================
function LinkedInPostCard({ post, noticeId }: { post: Post; noticeId: string }) {
  const { copy, copied } = useCopy()
  const fullPostText = `${post.headline}\n\n${post.body}\n\n${post.callToAction}\n\n${post.hashtags?.join(' ')}`

  return (
    <div style={{
      background: 'rgba(129,140,248,0.05)',
      border: '1px solid rgba(129,140,248,0.2)',
      borderRadius: 12, padding: 20, marginTop: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700,
          color: '#818cf8', textTransform: 'uppercase',
          letterSpacing: '0.15em' }}>
          💼 LinkedIn Post Draft
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => copy(post.headline, `headline-${noticeId}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.3)',
              borderRadius: 6, padding: '4px 10px',
              color: '#818cf8', fontSize: 11,
              cursor: 'pointer', fontWeight: 600
            }}
          >
            {copied === `headline-${noticeId}`
              ? <><Check size={12} /> Copied!</>
              : <><Copy size={12} /> Hook</>}
          </button>
          <button
            onClick={() => copy(fullPostText, `full-${noticeId}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#818cf8', border: 'none',
              borderRadius: 6, padding: '4px 10px',
              color: 'white', fontSize: 11,
              cursor: 'pointer', fontWeight: 600
            }}
          >
            {copied === `full-${noticeId}`
              ? <><Check size={12} /> Copied!</>
              : <><Copy size={12} /> Full Post</>}
          </button>
        </div>
      </div>

      {/* Headline */}
      <p style={{ color: '#e2e8f0', fontWeight: 700,
        fontSize: 14, margin: '0 0 10px',
        fontStyle: 'italic' }}>
        "{post.headline}"
      </p>

      {/* Body preview */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
        padding: 14, marginBottom: 12
      }}>
        <p style={{ color: '#94a3b8', fontSize: 13,
          margin: 0, lineHeight: 1.7,
          whiteSpace: 'pre-line' }}>
          {post.body}
        </p>
      </div>

      {/* CTA */}
      <p style={{ color: '#f59e0b', fontSize: 12,
        margin: '0 0 10px', fontWeight: 600 }}>
        → {post.callToAction}
      </p>

      {/* Hashtags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4,
        marginBottom: 12 }}>
        {(post.hashtags || []).map(tag => (
          <span key={tag} style={{
            background: 'rgba(129,140,248,0.1)',
            color: '#818cf8', fontSize: 11,
            padding: '2px 8px', borderRadius: 10
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12,
        fontSize: 11, color: '#475569' }}>
        <span>⏰ Best: {post.bestTimeToPost}</span>
        <span>📊 Reach: {post.estimatedReach}</span>
        {post.generatedBy === 'gemini' &&
          <span style={{ color: '#4285f4' }}>✦ Gemini AI</span>}
        {post.isTemplate &&
          <span style={{ color: '#64748b' }}>📝 Template</span>}
      </div>

      {/* Key insight */}
      {post.keyInsight && !post.isTemplate && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'rgba(212,175,55,0.08)',
          borderLeft: '3px solid rgba(212,175,55,0.4)',
          borderRadius: '0 6px 6px 0'
        }}>
          <p style={{ color: '#f59e0b', fontSize: 12,
            margin: 0, fontStyle: 'italic' }}>
            💡 Expert angle: {post.keyInsight}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// NOTICE CARD
// ============================================================
function NoticeCard({ notice }: { notice: Notice }) {
  const [expanded, setExpanded] = useState(false)
  const post = (postsData.posts as Record<string, Post>)[notice.id]

  const dataAge = notice.detectedAt
    ? Math.round((Date.now() - new Date(notice.detectedAt).getTime()) / 3600000)
    : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${expanded
        ? notice.badgeColor + '44'
        : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, padding: 20,
      marginBottom: 12,
      transition: 'all 0.2s ease',
      borderLeft: `3px solid ${notice.badgeColor}`
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: notice.badgeColor,
              color: 'white', padding: '3px 10px',
              borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>
              {notice.badge}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#64748b', fontSize: 11
            }}>
              <CategoryIcon category={notice.category} />
              {notice.category}
            </span>
            {notice.isNew && (
              <span style={{
                background: 'rgba(74,222,128,0.15)',
                color: '#4ADE80', padding: '2px 8px',
                borderRadius: 10, fontSize: 10, fontWeight: 700
              }}>
                NEW
              </span>
            )}
            {dataAge !== null && (
              <span style={{ color: '#475569', fontSize: 11 }}>
                {dataAge < 24 ? `${dataAge}h ago`
                  : `${Math.round(dataAge / 24)}d ago`}
              </span>
            )}
          </div>

          <h3 style={{ color: '#e2e8f0', fontSize: 15,
            fontWeight: 700, margin: '0 0 6px',
            lineHeight: 1.4 }}>
            {notice.title}
          </h3>

          <p style={{ color: '#64748b', fontSize: 13,
            margin: 0, lineHeight: 1.5 }}>
            {notice.summary}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8,
        alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={notice.link} target="_blank" rel="noopener"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: notice.badgeColor, fontSize: 12,
            fontWeight: 600, textDecoration: 'none'
          }}>
          <ExternalLink size={12} />
          Read Full Notice
        </a>

        {post && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: expanded
                ? 'rgba(129,140,248,0.2)'
                : 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.3)',
              borderRadius: 6, padding: '4px 12px',
              color: '#818cf8', fontSize: 12,
              cursor: 'pointer', fontWeight: 600
            }}
          >
            💼 {expanded ? 'Hide' : 'View'} LinkedIn Post
          </button>
        )}

        {!post && (
          <span style={{ color: '#334155', fontSize: 11 }}>
            No post generated yet
          </span>
        )}
      </div>

      {/* LinkedIn post (expandable) */}
      {expanded && post && (
        <LinkedInPostCard post={post} noticeId={notice.id} />
      )}
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function NoticeTracker() {
  const notices: Notice[] = (noticesData.notices || []) as Notice[]
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewOnly, setShowNewOnly] = useState(false)

  const categories = ['All', 'Corporate Law', 'Taxation',
    'Auditing', 'Securities Law', 'Banking', 'Stock Market', 'Finance']
  const sources = ['All', ...Array.from(new Set(notices.map(n => n.source)))]

  const filtered = useMemo(() => {
    return notices.filter(n => {
      if (filterCategory !== 'All' && n.category !== filterCategory) return false
      if (filterSource !== 'All' && n.source !== filterSource) return false
      if (showNewOnly && !n.isNew) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return n.title.toLowerCase().includes(q) ||
          n.source.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      }
      return true
    })
  }, [notices, filterCategory, filterSource, showNewOnly, searchQuery])

  const newCount = notices.filter(n => n.isNew).length
  const postsCount = Object.keys(postsData.posts || {}).length

  const dataAge = noticesData.lastUpdated
    ? Math.round((Date.now() - new Date(noticesData.lastUpdated).getTime()) / 3600000)
    : null

  return (
    <div style={{ padding: '24px', maxWidth: 900 }}>

      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.3em',
          color: 'var(--gold)', marginBottom: 8, margin: '0 0 8px' }}>
          CONTENT & AI
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 800,
          color: 'white', margin: '0 0 4px' }}>
          Notice Tracker
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14,
          margin: 0 }}>
          Regulatory intelligence from OCR · IRD · ICAN · SEBON · NRB · NEPSE
        </p>
      </div>

      {/* DATA FRESHNESS BANNER */}
      {dataAge !== null && (
        <div style={{
          background: dataAge > 48
            ? 'rgba(239,68,68,0.1)' : dataAge > 24
            ? 'rgba(245,158,11,0.1)' : 'rgba(74,222,128,0.1)',
          border: `1px solid ${dataAge > 48
            ? 'rgba(239,68,68,0.3)' : dataAge > 24
            ? 'rgba(245,158,11,0.3)' : 'rgba(74,222,128,0.3)'}`,
          borderRadius: 10, padding: '10px 16px',
          marginBottom: 20, fontSize: 13,
          color: dataAge > 48 ? '#ef4444' : dataAge > 24
            ? '#f59e0b' : '#4ADE80',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <RefreshCw size={14} />
          {dataAge > 48
            ? `⚠️ Data is ${Math.round(dataAge/24)} days old — run npm run notice-full to refresh`
            : dataAge > 24
            ? `Data is ${dataAge}h old — consider refreshing`
            : `✅ Fresh data — last updated ${dataAge}h ago`}
        </div>
      )}

      {/* STATS ROW */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Notices', value: notices.length, color: '#e2e8f0' },
          { label: 'New Today', value: newCount, color: '#4ADE80' },
          { label: 'LinkedIn Posts', value: postsCount, color: '#818cf8' },
          { label: 'Sources Tracked', value: sources.length - 1, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '16px 20px'
          }}>
            <p style={{ color: stat.color, fontSize: 28,
              fontWeight: 800, margin: '0 0 4px' }}>
              {stat.value}
            </p>
            <p style={{ color: '#64748b', fontSize: 12,
              margin: 0 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20,
        flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '8px 12px', flex: 1,
          minWidth: 200 }}>
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            style={{
              background: 'none', border: 'none',
              color: 'white', fontSize: 13,
              outline: 'none', flex: 1
            }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px',
            color: 'white', fontSize: 13, cursor: 'pointer'
          }}
        >
          {categories.map(c => (
            <option key={c} value={c}
              style={{ background: '#1a1a2e' }}>{c}</option>
          ))}
        </select>

        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px',
            color: 'white', fontSize: 13, cursor: 'pointer'
          }}
        >
          {sources.map(s => (
            <option key={s} value={s}
              style={{ background: '#1a1a2e' }}>{s}</option>
          ))}
        </select>

        <button
          onClick={() => setShowNewOnly(!showNewOnly)}
          style={{
            background: showNewOnly
              ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showNewOnly
              ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '8px 14px',
            color: showNewOnly ? '#4ADE80' : '#94a3b8',
            fontSize: 12, cursor: 'pointer',
            fontWeight: showNewOnly ? 700 : 400
          }}
        >
          {showNewOnly ? '✅ New Only' : '⭕ Show New Only'}
        </button>
      </div>

      {/* RESULTS COUNT */}
      <p style={{ color: '#475569', fontSize: 12,
        marginBottom: 16 }}>
        Showing {filtered.length} of {notices.length} notices
      </p>

      {/* NOTICE LIST */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: '#475569'
        }}>
          <Bell size={40} style={{ marginBottom: 16,
            opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600,
            margin: '0 0 8px', color: '#64748b' }}>
            {notices.length === 0
              ? 'No notices yet' : 'No notices match your filters'}
          </p>
          {notices.length === 0 && (
            <p style={{ fontSize: 13, margin: 0 }}>
              Run <code style={{ background: 'rgba(255,255,255,0.1)',
                padding: '2px 6px', borderRadius: 4 }}>
                npm run notice-full
              </code> to scrape notices from all sources
            </p>
          )}
        </div>
      ) : (
        filtered.map(notice => (
          <NoticeCard key={notice.id} notice={notice} />
        ))
      )}
    </div>
  )
}
