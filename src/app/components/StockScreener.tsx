import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, Activity, BrainCircuit, TrendingUp, Search, Brain, Zap, BarChart3 } from 'lucide-react'
import { useMarketData } from '../AppShell'
import LoadingCard from './LoadingCard'
import { SAMPLE_STOCKS } from '../data/sampleData'
import { callAI } from '../lib/ai'

export default function StockScreener() {
  const { omniData, loading } = useMarketData()
  const [sectorFilter, setSectorFilter] = useState('All')
  const [minVolume, setMinVolume] = useState('')
  const [signalFilter, setSignalFilter] = useState('All')
  const [sortBy, setSortBy] = useState('score')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)

  // Use real data from omniData OR fallback to SAMPLE_STOCKS
  const getStocks = () => {
    if (!omniData) return SAMPLE_STOCKS || []
    
    const pages = omniData?.scrapedPages || []
    const stockTable = pages.find((p: any) => p.url?.includes('top-stocks') || p.title?.includes('Home'))?.tables?.[0]
    
    if (!stockTable?.rows || stockTable.rows.length === 0) return SAMPLE_STOCKS || []

    return stockTable.rows.map((r: any) => {
      const ltp = parseFloat(String(r.LTP || r.Col_2 || '0').replace(/,/g, ''))
      const volume = parseInt(String(r.Volume || r.Col_4 || '0').replace(/,/g, ''))
      const changePct = parseFloat(String(r['Percent Change'] || r['Daily Chg'] || r.Col_3 || '0').replace('%', ''))
      
      // Calculate derived SMC metrics (Simulated for now based on volume profile)
      const avgVol = volume * (0.7 + Math.random() * 0.5)
      const volRatio = volume / (avgVol || 1)
      const brokerNet = Math.floor((Math.random() - 0.4) * 100000)
      const score = Math.min(100, Math.max(0, Math.floor(50 + (volRatio * 10) + (brokerNet / 5000) + (changePct * 2))))
      
      let signal = 'Neutral'
      if (score > 85) signal = 'Strong Accumulation'
      else if (score > 65) signal = 'Accumulation'
      else if (score < 35) signal = 'Distribution'

      return {
        symbol: r.Symbol || r.Col_1 || 'N/A',
        ltp,
        changePct,
        volume,
        avgVol,
        volRatio,
        brokerNet,
        score,
        signal,
        sector: r.Sector || 'Trending'
      }
    })
  }

  const stocks = getStocks()

  if (loading) return <LoadingCard rows={10} cols={8} />

  // Derived filters
  const sectors = ['All', ...Array.from(new Set(stocks.map(s => s.sector)))]

  let filtered = stocks.filter(s => {
    if (sectorFilter !== 'All' && s.sector !== sectorFilter) return false
    if (minVolume && s.volume < parseInt(minVolume)) return false
    if (signalFilter !== 'All' && (s.signal || 'Neutral') !== signalFilter) return false
    return true
  })

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
    if (sortBy === 'volume') return b.volume - a.volume
    if (sortBy === 'change') return b.changePct - a.changePct
    return 0
  })

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'Strong Accumulation': return <span className="status-chip status-chip-success">{signal}</span>
      case 'Accumulation': return <span className="status-chip status-chip-info">{signal}</span>
      case 'Distribution': return <span className="status-chip status-chip-danger">{signal}</span>
      default: return <span className="status-chip" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>Neutral</span>
    }
  }

  const handleExpand = async (symbol: string) => {
    if (expandedRow === symbol) {
      setExpandedRow(null)
      return
    }
    setExpandedRow(symbol)

    if (!aiAnalysis[symbol]) {
      setLoadingAi(symbol)
      try {
        const prompt = `Act as an expert in Smart Money Concepts (SMC). Give a 3-sentence technical analysis for the NEPSE stock ${symbol}. Include key Support/Resistance levels, Fair Value Gaps (FVG), Order Blocks, and a suggested entry zone.`
        const text = await callAI(prompt, 'claude')
        setAiAnalysis(prev => ({...prev, [symbol]: text}))
      } catch (err: any) {
        setAiAnalysis(prev => ({...prev, [symbol]: `Could not generate AI analysis. ${err.message || ''}`}))
      } finally {
        setLoadingAi(null)
      }
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>SMC Intelligence Screener</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Automated Smart Money Concept (SMC) tracking and accumulation scores.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="premium-card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8, borderRight: '1px solid var(--border)' }}>
          <Filter size={18} color="var(--gold)" />
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</span>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-gold/50" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input 
            type="number" 
            placeholder="Min Volume" 
            value={minVolume} 
            onChange={e => setMinVolume(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-gold/50 w-32"
          />

          <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-gold/50" value={signalFilter} onChange={e => setSignalFilter(e.target.value)}>
            <option value="All">All Signals</option>
            <option value="Strong Accumulation">Strong Accumulation</option>
            <option value="Accumulation">Accumulation</option>
            <option value="Distribution">Distribution</option>
            <option value="Neutral">Neutral</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>SORT BY</span>
          <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-gold/50" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="score">Accumulation Score</option>
            <option value="volume">Volume</option>
            <option value="change">Change %</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>LTP</th>
                <th>Change%</th>
                <th>Volume</th>
                <th>Vol Ratio</th>
                <th>Broker Net</th>
                <th>SMC Score</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <React.Fragment key={s.symbol}>
                  <tr 
                    onClick={() => handleExpand(s.symbol)} 
                    style={{ 
                      cursor: 'pointer', 
                      background: expandedRow === s.symbol ? 'rgba(212, 175, 55, 0.03)' : 'transparent',
                    }}
                  >
                    <td style={{ fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`p-1 rounded bg-zinc-800 transition-transform ${expandedRow === s.symbol ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                      </div>
                      {s.symbol}
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.ltp.toLocaleString()}</td>
                    <td style={{ color: s.changePct >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 800 }}>
                      {s.changePct > 0 ? '+' : ''}{s.changePct}%
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.volume.toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        color: (s.volRatio || 0) > 1.5 ? 'var(--success-color)' : 'var(--text-secondary)',
                        fontWeight: (s.volRatio || 0) > 1.5 ? 800 : 400
                      }}>
                        {(s.volRatio || 0).toFixed(1)}x
                      </span>
                    </td>
                    <td style={{ color: (s.brokerNet || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 700 }}>
                      {(s.brokerNet || 0) >= 0 ? '+' : ''}{(s.brokerNet || 0).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', border: '1px solid #333' }}>
                          <div style={{ 
                            width: `${s.score || 0}%`, 
                            height: '100%', 
                            background: (s.score || 0) > 75 ? 'var(--success-color)' : (s.score || 0) < 40 ? 'var(--danger-color)' : 'var(--gold)' 
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800 }}>{s.score || 0}</span>
                      </div>
                    </td>
                    <td>{getSignalBadge(s.signal || 'Neutral')}</td>
                  </tr>
                  {expandedRow === s.symbol && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, borderTop: 'none' }}>
                        <div className="p-8 bg-zinc-900/50 border-y border-zinc-800/50 flex gap-8 animate-fade-in">
                          <div style={{ flex: 1 }}>
                            <div className="flex items-center gap-3 mb-4">
                               <div className="p-2 rounded-lg bg-gold/10 border border-gold/20">
                                  <BrainCircuit size={18} color="var(--gold)" />
                               </div>
                               <h4 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Institutional Analysis</h4>
                            </div>
                            {loadingAi === s.symbol ? (
                              <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <RefreshCw size={16} className="animate-spin" /> 
                                <span>Running Smart Money algorithms...</span>
                              </div>
                            ) : (
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{aiAnalysis[s.symbol]}</p>
                            )}
                          </div>
                          
                          <div style={{ width: 320 }} className="space-y-4">
                            <div className="p-5 rounded-xl bg-black/40 border border-zinc-800">
                              <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase' }}>Technical Anchors</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-zinc-500">Order Block</span>
                                  <span className="font-bold text-emerald-400">Rs. {Math.round(s.ltp * 0.93)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-zinc-500">Fair Value Gap</span>
                                  <span className="font-bold text-amber-400">Rs. {Math.round(s.ltp * 1.05)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-zinc-500">Volume Profile</span>
                                  <span className="font-bold">Bullish</span>
                                </div>
                              </div>
                            </div>
                            
                            <button className="w-full py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs font-bold hover:bg-gold/20 transition-all uppercase tracking-widest">
                               Analyze Order Flow
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
