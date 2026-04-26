import { TrendingUp, TrendingDown, BarChart3, Activity, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function MarketOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/nepse-live')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch live data:', err)
        setData({ error: true })
      } finally {
        setLoading(false)
      }
    }
    fetchLive()
    const interval = setInterval(fetchLive, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>Loading live market data...</div>
  }

  if (!data || data.error) {
    return <div style={{ padding: 24, color: 'var(--red)', background: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>Failed to load live data. Retrying...</div>
  }

  const { index, change, changePct, turnover, volume, breadth, topGainers, topLosers, timestamp } = data
  const isFresh = new Date().getTime() - new Date(timestamp).getTime() < 360000 // 6 minutes

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Market Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Live NEPSE market summary from official sources</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isFresh ? (
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-slow 2s infinite' }} /> LIVE</span>
          ) : (
            <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> DELAYED</span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Index Card */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>NEPSE Index</p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{index}</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: parseFloat(change || '0') >= 0 ? 'var(--green)' : 'var(--red)',
          fontSize: 20, fontWeight: 700,
        }}>
          {parseFloat(change || '0') >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          {change} ({changePct}%)
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div><p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Turnover</p><p style={{ fontWeight: 700 }}>{turnover || 'N/A'}</p></div>
          <div><p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Volume</p><p style={{ fontWeight: 700 }}>{volume || 'N/A'}</p></div>
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
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{breadth.advances}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>Declines</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{breadth.declines}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Unchanged</span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{breadth.unchanged}</span>
            </div>
            {/* Visual bar */}
            {breadth.advances > 0 && (
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ width: `${(parseInt(breadth.advances) / (parseInt(breadth.advances) + parseInt(breadth.declines) + parseInt(breadth.unchanged))) * 100}%`, background: 'var(--green)' }}></div>
                <div style={{ width: `${(parseInt(breadth.unchanged) / (parseInt(breadth.advances) + parseInt(breadth.declines) + parseInt(breadth.unchanged))) * 100}%`, background: '#555' }}></div>
                <div style={{ width: `${(parseInt(breadth.declines) / (parseInt(breadth.advances) + parseInt(breadth.declines) + parseInt(breadth.unchanged))) * 100}%`, background: 'var(--red)' }}></div>
              </div>
            )}
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

      {/* Top Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--green)' }}>🔥 Top Gainers</h3>
          {topGainers.length > 0 ? (
            <table>
              <thead><tr><th>Symbol</th><th>LTP</th><th>Change</th></tr></thead>
              <tbody>
                {topGainers.map((s: any) => (
                  <tr key={s.symbol}>
                    <td style={{ fontWeight: 600 }}>{s.symbol}</td>
                    <td>{s.ltp}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{s.changePct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Market data not available.</p>}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--red)' }}>📉 Top Losers</h3>
          {topLosers.length > 0 ? (
            <table>
              <thead><tr><th>Symbol</th><th>LTP</th><th>Change</th></tr></thead>
              <tbody>
                {topLosers.map((s: any) => (
                  <tr key={s.symbol}>
                    <td style={{ fontWeight: 600 }}>{s.symbol}</td>
                    <td>{s.ltp}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>{s.changePct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Market data not available.</p>}
        </div>
      </div>
    </div>
  )
}
