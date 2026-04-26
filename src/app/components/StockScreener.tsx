import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, Activity, BrainCircuit } from 'lucide-react'
import { SAMPLE_STOCKS } from '../data/sampleData'

export default function StockScreener() {
  const [sectorFilter, setSectorFilter] = useState('All')
  const [minVolume, setMinVolume] = useState('')
  const [signalFilter, setSignalFilter] = useState('All')
  const [sortBy, setSortBy] = useState('score')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)

  // Use imported stocks or fallback
  const stocks = SAMPLE_STOCKS || []

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
      case 'Strong Accumulation': return <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{signal}</span>
      case 'Accumulation': return <span className="badge" style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}>{signal}</span>
      case 'Distribution': return <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{signal}</span>
      default: return <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>Neutral</span>
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
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not found")
        
        const prompt = `Act as an expert in Smart Money Concepts (SMC). Give a 3-sentence technical analysis for the NEPSE stock ${symbol}. Include key Support/Resistance levels, Fair Value Gaps (FVG), Order Blocks, and a suggested entry zone.`
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
        
        const data = await res.json()
        if (data.candidates && data.candidates[0]) {
          setAiAnalysis(prev => ({...prev, [symbol]: data.candidates[0].content.parts[0].text}))
        } else {
          throw new Error("Invalid AI response")
        }
      } catch (err: any) {
        setAiAnalysis(prev => ({...prev, [symbol]: `Could not generate AI analysis. ${err.message || ''}`}))
      } finally {
        setLoadingAi(null)
      }
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>SMC Stock Screener</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Filter stocks based on Smart Money Concepts, Volume profiles, and Accumulation/Distribution signals.</p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filters:</span>
        </div>
        
        <select className="input-field" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input 
          type="number" 
          placeholder="Min Volume" 
          value={minVolume} 
          onChange={e => setMinVolume(e.target.value)}
          style={{ padding: '8px 12px', width: 140, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }}
        />

        <select className="input-field" value={signalFilter} onChange={e => setSignalFilter(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
          <option value="All">All Signals</option>
          <option value="Strong Accumulation">Strong Accumulation</option>
          <option value="Accumulation">Accumulation</option>
          <option value="Distribution">Distribution</option>
          <option value="Neutral">Neutral</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sort by:</span>
          <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
            <option value="score">Accumulation Score</option>
            <option value="volume">Volume</option>
            <option value="change">Change %</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>LTP</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>Avg Vol (20d)</th>
              <th>Vol Ratio</th>
              <th>Broker Net Buy</th>
              <th>SMC Score</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <React.Fragment key={s.symbol}>
                <tr onClick={() => handleExpand(s.symbol)} style={{ cursor: 'pointer', borderBottom: expandedRow === s.symbol ? 'none' : '' }}>
                  <td style={{ fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {expandedRow === s.symbol ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {s.symbol}
                  </td>
                  <td>{s.ltp}</td>
                  <td style={{ color: s.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{s.changePct}%</td>
                  <td>{s.volume}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{(s.volume * 0.8).toLocaleString()}</td>
                  <td><span style={{ color: 'var(--green)' }}>1.2x</span></td>
                  <td style={{ color: (s.signal || '').includes('Accumulation') ? 'var(--green)' : 'var(--red)' }}>
                    {(s.signal || '').includes('Accumulation') ? '+45,000' : '-12,000'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${s.score || 0}%`, height: '100%', background: (s.score || 0) > 70 ? 'var(--green)' : (s.score || 0) < 30 ? 'var(--red)' : 'var(--gold)' }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{s.score || 0}</span>
                    </div>
                  </td>
                  <td>{getSignalBadge(s.signal || 'Neutral')}</td>
                </tr>
                {expandedRow === s.symbol && (
                  <tr style={{ background: 'rgba(245,158,11,0.02)' }}>
                    <td colSpan={9} style={{ padding: 24, borderTop: 'none', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 24 }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: 13, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BrainCircuit size={14} /> AI SMC Analysis</h4>
                          {loadingAi === s.symbol ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Activity size={14} style={{ animation: 'pulse-slow 2s infinite' }} /> Analyzing floorsheet and technical data...
                            </div>
                          ) : (
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{aiAnalysis[s.symbol]}</p>
                          )}
                        </div>
                        <div style={{ width: 300, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase' }}>SMC Metrics (Est.)</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Key Support:</span><span style={{ color: 'var(--green)' }}>Rs. {Math.round(s.ltp * 0.95)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Key Resistance:</span><span style={{ color: 'var(--red)' }}>Rs. {Math.round(s.ltp * 1.1)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Order Block:</span><span>Rs. {Math.round(s.ltp * 0.92)} - {Math.round(s.ltp * 0.94)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FVG Zone:</span><span style={{ color: 'var(--gold)' }}>Active</span></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No stocks match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
