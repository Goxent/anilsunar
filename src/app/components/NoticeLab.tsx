import { useState, useMemo } from 'react'
import { 
  Bell, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react'
import noticesRaw from '../data/notices.json'
import noticePostsRaw from '../data/notice_posts.json'

export default function NoticeLab() {
  const [activeTab, setActiveTab] = useState<'drafts'|'notices'>('drafts')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [copiedId, setCopiedId] = useState<string|null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Data processing
  const posts = useMemo(() => {
    return Object.values((noticePostsRaw as any)?.posts || {})
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [])

  const notices = noticesRaw?.notices || []
  const lastScraped = noticesRaw?.lastUpdated || (noticePostsRaw as any)?.lastUpdated || null

  const categories = useMemo(() => {
    const set = new Set(posts.map((p: any) => p.category || p.topicBadge).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (categoryFilter === 'All') return posts
    return posts.filter((p: any) => (p.category || p.topicBadge) === categoryFilter)
  }, [posts, categoryFilter])

  const getRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Unknown'
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `${diffHrs}h ago`
    return `${Math.floor(diffHrs / 24)}d ago`
  }

  async function copyPost(post: any, id: string) {
    const text = `${post.body}\n\n${post.hashtags.join(' ')}`
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function triggerRefresh() {
    setIsSyncing(true)
    try {
      await fetch('/api/run-sync', { 
        method: 'POST', 
        body: JSON.stringify({ type: 'notices' }), 
        headers: { 'Content-Type': 'application/json' } 
      })
      // Usually would reload or wait for bot
    } catch (err) {
      console.error(err)
    } finally {
      setIsSyncing(false)
    }
  }

  const getBadgeClass = (color?: string) => {
    if (!color) return 'badge-gray'
    if (color.includes('#1a73e8') || color.includes('blue')) return 'badge-blue'
    if (color.includes('#e53935') || color.includes('red')) return 'badge-red'
    if (color.includes('#f57c00') || color.includes('orange')) return 'badge-amber'
    return 'badge-gray'
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-1">Notice Lab</h1>
          <p className="text-2 text-sm mt-1">Regulatory intelligence & automated social content.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[11px] text-2">Last scraped {getRelativeTime(lastScraped)}</span>
          </div>
          <button 
            onClick={triggerRefresh}
            className={`badge badge-gray flex items-center gap-2 cursor-pointer transition-all hover:border-gold-border ${isSyncing ? 'opacity-50' : ''}`}
            disabled={isSyncing}
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('drafts')}
          className={`badge py-1.5 px-4 text-[13px] cursor-pointer transition-all ${activeTab === 'drafts' ? 'badge-gold' : 'badge-gray hover:border-gold-border'}`}
        >
          LinkedIn Drafts ({posts.length})
        </button>
        <button 
          onClick={() => setActiveTab('notices')}
          className={`badge py-1.5 px-4 text-[13px] cursor-pointer transition-all ${activeTab === 'notices' ? 'badge-gold' : 'badge-gray hover:border-gold-border'}`}
        >
          All Notices ({notices.length})
        </button>
      </div>

      {/* DRAFTS TAB */}
      {activeTab === 'drafts' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: any) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`badge text-[11px] font-bold cursor-pointer transition-all ${categoryFilter === cat ? 'badge-blue' : 'badge-gray hover:border-blue-border'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="card-base p-20 text-center flex flex-col items-center gap-4">
              <Sparkles size={48} className="text-3" />
              <p className="text-2">No LinkedIn drafts available. Run the notice scraper to generate posts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredPosts.map((post: any) => {
                const id = post.noticeId || post.headline
                const isCopied = copiedId === id
                const openingLine = post.body?.split('\n').filter((l: string) => l.trim().length > 0)[0] || ''

                return (
                  <div key={id} className="card-base p-6 flex flex-col gap-4 relative">
                    {post.isTemplate && (
                      <div className="absolute -top-2 -right-2">
                        <span className="badge badge-amber shadow-lg">Template</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`badge ${getBadgeClass(post.badgeColor)}`}>
                        {post.category || post.topicBadge || 'REGULATORY'}
                      </span>
                      <div className="flex gap-2">
                        <span className="badge badge-gray text-[10px]">{post.bestTimeToPost || 'Morning'}</span>
                        <span className="badge badge-gray text-[10px] uppercase font-bold">{post.estimatedReach || 'Medium'} Reach</span>
                      </div>
                    </div>

                    <h2 className="font-display text-[18px] font-bold text-1 leading-tight">{post.headline}</h2>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-3 uppercase tracking-widest">Opening line</span>
                      <div className="bg-bg-0 border-l-[3px] border-gold p-4 rounded-r-lg font-display text-[14px] italic text-1 leading-relaxed">
                        "{openingLine}"
                      </div>
                    </div>

                    {post.keyInsight && post.keyInsight !== "Template post" && (
                      <p className="text-[12px] text-2 leading-relaxed">
                        <span className="font-bold text-3 uppercase mr-2 text-[10px]">Insight</span>
                        {post.keyInsight}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex gap-1.5 overflow-hidden">
                        {post.hashtags?.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="badge badge-gray text-[10px] font-mono py-0.5 px-2 truncate">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={() => copyPost(post, id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-[12px] transition-all cursor-pointer ${
                          isCopied 
                          ? 'bg-green-dim border-green-border text-green' 
                          : 'bg-bg-1 border-border text-1 hover:border-gold-border hover:text-gold'
                        }`}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        {isCopied ? 'Copied!' : 'Copy Post'}
                      </button>
                    </div>

                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-3 hover:text-gold transition-colors flex items-center gap-1 w-fit"
                    >
                      Source: {post.source} <ExternalLink size={10} />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* NOTICES TAB */}
      {activeTab === 'notices' && (
        <div className="card-base p-0 overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col">
            {notices.map((notice: any, i: number) => (
              <div 
                key={notice.id || i} 
                className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-bg-2 transition-colors"
              >
                <div className="w-24 shrink-0">
                  <span className={`badge text-[10px] w-full justify-center ${getBadgeClass(notice.badgeColor)}`}>
                    {notice.badge || notice.category || 'NOTICE'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-1 text-[14px] font-medium leading-snug truncate">{notice.title}</h3>
                  <p className="text-3 text-[11px] font-bold uppercase tracking-wider mt-0.5">{notice.source}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[11px] text-2 font-mono">{getRelativeTime(notice.detectedAt)}</span>
                  <a 
                    href={notice.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-3 hover:text-gold transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
