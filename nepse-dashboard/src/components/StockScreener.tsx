import { useState } from 'react'
import { Search, ArrowUpDown, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { SAMPLE_STOCKS, StockData } from '../data/sampleData'

const SECTORS = ['All', ...Array.from(new Set(SAMPLE_STOCKS.map(s => s.sector)))]

export default function StockScreener() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')
  const [sortKey, setSortKey] = useState<keyof StockData>('changePct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [chartSymbol, setChartSymbol] = useState('')

  const handleSort = (key: keyof StockData) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = SAMPLE_STOCKS
    .filter(s => sector === 'All' || s.sector === sector)
    .filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'asc' ? av - bv : bv - av
    })

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Stock Screener</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Filter, sort, and analyze NEPSE stocks</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            placeholder="Search symbol or company name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTORS.map(s => (
            <button key={s} className="btn" onClick={() => setSector(s)}
              style={{ background: sector === s ? 'var(--gold-dim)' : undefined, color: sector === s ? 'var(--gold)' : undefined, borderColor: sector === s ? 'rgba(245,158,11,0.3)' : undefined, fontSize: 12 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Popup */}
      {chartSymbol && (
        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} style={{ color: 'var(--gold)' }} /> {chartSymbol} Chart
            </h3>
            <button className="btn" onClick={() => setChartSymbol('')} style={{ padding: '6px 12px', fontSize: 12 }}>Close</button>
          </div>
          <iframe
            src={`https://nepsealpha.com/trading/chart?symbol=${chartSymbol}`}
            style={{ width: '100%', height: 400, border: 'none' }}
            title={`${chartSymbol} Chart`}
          />
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th>Sector</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ltp')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>LTP <ArrowUpDown size={12} /></span>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('changePct')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Change % <ArrowUpDown size={12} /></span>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('volume')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Volume <ArrowUpDown size={12} /></span>
              </th>
              <th>High / Low</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.symbol}>
                <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{s.symbol}</td>
                <td style={{ fontSize: 13, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</td>
                <td><span className="badge badge-gold">{s.sector}</span></td>
                <td style={{ fontWeight: 600 }}>Rs. {s.ltp}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {s.changePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                  </span>
                </td>
                <td>{s.volume.toLocaleString()}</td>
                <td style={{ fontSize: 13 }}>{s.high} / {s.low}</td>
                <td>
                  <button className="btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => setChartSymbol(s.symbol)}>
                    <BarChart3 size={12} /> Chart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
