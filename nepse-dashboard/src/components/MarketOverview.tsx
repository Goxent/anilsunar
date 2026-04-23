import { TrendingUp, TrendingDown, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import intelData from '../data/market_intelligence.json'
import { SECTOR_DATA } from '../data/sampleData'

export default function MarketOverview() {
  const { liveData, topStocks } = intelData;
  const { summary } = liveData;

  const topGainers: any[] = topStocks.filter((s: any) => !s.changePct.includes('-')).slice(0, 5)
  const topLosers: any[] = topStocks.filter((s: any) => s.changePct.includes('-')).slice(0, 5)

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Market Overview</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>NEPSE market summary and sector performance</p>

      {/* Index Card */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>NEPSE Index</p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{summary.index}</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: !summary.change.includes('-') ? 'var(--green)' : 'var(--red)',
          fontSize: 20, fontWeight: 700,
        }}>
          {!summary.change.includes('-') ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          {summary.change} ({summary.changePct})
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div><p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Turnover</p><p style={{ fontWeight: 700 }}>{summary.turnover}</p></div>
          <div><p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Volume</p><p style={{ fontWeight: 700 }}>{summary.volume}</p></div>
          <div><p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Updated At</p><p style={{ fontWeight: 700 }}>{intelData.timestamp.split(',')[1]}</p></div>
        </div>
      </div>

      {/* Market Breadth + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>
        {/* Breadth */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--gold)' }} /> Market Breadth
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>Advances</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{summary.breadth.advances}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>Declines</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{summary.breadth.declines}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Unchanged</span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{summary.breadth.unchanged}</span>
            </div>
            {/* Visual bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: `${(parseInt(summary.breadth.advances) / (parseInt(summary.breadth.advances) + parseInt(summary.breadth.declines) + parseInt(summary.breadth.unchanged))) * 100}%`, background: 'var(--green)' }}></div>
              <div style={{ width: `${(parseInt(summary.breadth.unchanged) / (parseInt(summary.breadth.advances) + parseInt(summary.breadth.declines) + parseInt(summary.breadth.unchanged))) * 100}%`, background: '#555' }}></div>
              <div style={{ width: `${(parseInt(summary.breadth.declines) / (parseInt(summary.breadth.advances) + parseInt(summary.breadth.declines) + parseInt(summary.breadth.unchanged))) * 100}%`, background: 'var(--red)' }}></div>
            </div>
          </div>
        </div>

        {/* Live Chart Embed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} style={{ color: 'var(--gold)' }} /> NEPSE Index Chart
            </h3>
            <span className="badge badge-gold">Live</span>
          </div>
          <iframe
            src="https://nepsealpha.com/trading/chart?symbol=NEPSE"
            style={{ width: '100%', height: 350, border: 'none' }}
            title="NEPSE Chart"
          />
        </div>
      </div>

      {/* Sector Performance */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Sector Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {SECTOR_DATA.map(s => (
            <div key={s.name} style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: s.change >= 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {s.change >= 0 ? '+' : ''}{s.change}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--green)' }}>🔥 Top Gainers</h3>
          <table>
            <thead><tr><th>Symbol</th><th>LTP</th><th>Change</th></tr></thead>
            <tbody>
              {topGainers.map(s => (
                <tr key={s.symbol}>
                  <td style={{ fontWeight: 600 }}>{s.symbol}</td>
                  <td>{s.ltp}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{s.changePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--red)' }}>📉 Top Losers</h3>
          <table>
            <thead><tr><th>Symbol</th><th>LTP</th><th>Change</th></tr></thead>
            <tbody>
              {topLosers.map(s => (
                <tr key={s.symbol}>
                  <td style={{ fontWeight: 600 }}>{s.symbol}</td>
                  <td>{s.ltp}</td>
                  <td style={{ color: 'var(--red)', fontWeight: 600 }}>{s.changePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
