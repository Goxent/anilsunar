import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Search, Filter, HelpCircle, ChevronDown, ChevronUp, Activity, BarChart3, Users } from 'lucide-react'
import brokerFlowRaw from '../data/broker-flow-5d.json'

export default function SmartMoney() {
  const [filter, setFilter] = useState<'ALL'|'ACCUMULATION'|'DISTRIBUTION'|'NEUTRAL'>('ALL')
  const [search, setSearch] = useState('')
  const [showHowTo, setShowHowTo] = useState(false)

  const stocks = brokerFlowRaw?.stocks || []
  const generatedAt = (brokerFlowRaw as any)?.generatedAt || null

  const filtered = useMemo(() => {
    return stocks
      .filter(s => filter === 'ALL' || s.pattern === filter)
      .filter(s => !search || s.symbol.toUpperCase().includes(search.toUpperCase()))
      .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
  }, [stocks, filter, search])

  const accumulationCount = stocks.filter(s => s.pattern === 'ACCUMULATION').length
  const distributionCount = stocks.filter(s => s.pattern === 'DISTRIBUTION').length

  const getRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Unknown'
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `${diffHrs}h ago`
    return then.toLocaleDateString()
  }

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="card-base p-10 text-center max-w-md">
          <TrendingUp size={48} className="text-3 mx-auto mb-6" />
          <h2 className="font-display text-[22px] font-bold text-1 mb-3">No broker flow data yet</h2>
          <p className="text-2 text-sm leading-relaxed mb-6">
            Smart Money data is built from 5 consecutive days of floorsheet history. 
            Run the bot daily — data will appear after 5 days.
          </p>
          <div className="p-3 bg-bg-2 border border-border rounded-lg text-[11px] text-2 font-medium">
            Note: You can still access raw floorsheet data directly on SastoShare.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[26px] font-bold text-1">Smart Money</h1>
        <div className="font-mono text-[11px] text-2">
          5-Day Analysis · {getRelativeTime(generatedAt)}
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="card-base p-4 px-5 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={16} className="text-green" />
          <span className="font-mono text-[15px] font-bold text-green">{accumulationCount} Accumulating</span>
        </div>
        <div className="w-[1px] h-4 bg-border" />
        <div className="flex items-center gap-3">
          <TrendingDown size={16} className="text-red" />
          <span className="font-mono text-[15px] font-bold text-red">{distributionCount} Distributing</span>
        </div>
        <div className="w-[1px] h-4 bg-border" />
        <div className="text-[13px] text-2 font-medium">{stocks.length} stocks tracked</div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['ALL', 'ACCUMULATION', 'DISTRIBUTION', 'NEUTRAL'].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p as any)}
              className={`badge transition-all ${filter === p ? 'badge-gold' : 'badge-gray hover:border-gold-border cursor-pointer'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-3" size={14} />
          <input 
            type="text" 
            placeholder="Search symbol..."
            className="w-[200px] pl-9 pr-3 py-1.5 bg-1 border border-border rounded-md font-mono text-[13px] text-1 focus:border-gold outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((stock: any) => (
          <div key={stock.symbol} className="card-base p-5 flex flex-col gap-5">
            {/* TOP ROW */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[18px] font-bold text-gold">{stock.symbol}</span>
              <span className={`badge ${
                stock.pattern === 'ACCUMULATION' ? 'badge-green' :
                stock.pattern === 'DISTRIBUTION' ? 'badge-red' : 'badge-gray'
              }`}>
                {stock.pattern === 'ACCUMULATION' ? 'ACCUMULATING' :
                 stock.pattern === 'DISTRIBUTION' ? 'DISTRIBUTING' : 'NEUTRAL'}
              </span>
            </div>

            {/* CONFIDENCE */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-2 uppercase tracking-widest">Confidence</span>
                <span className="font-mono text-[13px] font-bold text-1">{stock.confidence}%</span>
              </div>
              <div className="w-full h-[3px] bg-border rounded-full overflow-hidden">
                <div 
                  style={{ 
                    width: `${stock.confidence}%`,
                    background: stock.confidence > 66 ? 'var(--green)' : stock.confidence > 33 ? 'var(--amber)' : 'var(--red)'
                  }} 
                  className="h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* NET FLOW */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-2 uppercase tracking-widest">Net Flow</span>
              <div className="w-full h-1.5 bg-border rounded-full relative">
                {stock.netFlow !== 0 && (
                  <div 
                    style={{ 
                      width: `${Math.min(50, (Math.abs(stock.netFlow) / 1000) * 50)}%`,
                      left: stock.netFlow > 0 ? '50%' : 'auto',
                      right: stock.netFlow < 0 ? '50%' : 'auto',
                      background: stock.netFlow > 0 ? 'var(--green)' : 'var(--red)'
                    }} 
                    className="absolute h-full transition-all duration-500 rounded-full"
                  />
                )}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-3 bg-white/20" />
              </div>
              <div className="font-mono text-[11px] font-bold text-1">
                {stock.netFlow > 0 ? '+' : ''}{stock.netFlow.toLocaleString()} shares
              </div>
            </div>

            {/* BROKERS */}
            {stock.pattern === 'ACCUMULATION' && stock.topBuyers?.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.03]">
                <span className="text-[10px] font-bold text-green uppercase tracking-widest">Key Buyers</span>
                <div className="flex flex-col gap-1.5">
                  {stock.topBuyers.slice(0, 3).map((b: any, i: number) => (
                    <div key={i} className="font-mono text-[12px] text-2 flex items-center gap-2">
                      <span className="text-3">#</span>
                      <span>Broker #{b.broker} · {b.days}d · {b.totalQty.toLocaleString()} shares</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stock.pattern === 'DISTRIBUTION' && stock.topSellers?.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.03]">
                <span className="text-[10px] font-bold text-red uppercase tracking-widest">Key Sellers</span>
                <div className="flex flex-col gap-1.5">
                  {stock.topSellers.slice(0, 3).map((b: any, i: number) => (
                    <div key={i} className="font-mono text-[12px] text-2 flex items-center gap-2">
                      <span className="text-3">#</span>
                      <span>Broker #{b.broker} · {b.days}d · {b.totalQty.toLocaleString()} shares</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stock.pattern === 'NEUTRAL' && (
              <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.03]">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-2 uppercase tracking-widest">Mixed Activity</span>
                  <div className="text-[11px] font-mono text-3 italic">
                    Both buying and selling pressure equalized over the last 5 days.
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* HOW TO USE */}
      <div className="card-base overflow-hidden">
        <button 
          onClick={() => setShowHowTo(!showHowTo)}
          className="w-full p-4 flex items-center justify-between text-[14px] font-bold text-1 hover:bg-bg-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-gold" />
            How to use Smart Money data
          </div>
          {showHowTo ? <ChevronUp size={18} className="text-3" /> : <ChevronDown size={18} className="text-3" />}
        </button>
        {showHowTo && (
          <div className="p-6 pt-2 border-t border-border flex flex-col gap-4 text-sm text-2 leading-relaxed">
            <p>
              1. <strong>Accumulation</strong> means a broker house has been consistently buying a stock 
              over multiple days. This is a strong signal when confidence &gt; 70%.
            </p>
            <p>
              2. <strong>Distribution</strong> means net selling pressure. High-confidence distribution
              often precedes price drops — consider reducing or avoiding.
            </p>
            <p>
              3. This data is from processed floorsheet records, not raw transactions. 
              Always combine with technical analysis before acting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
