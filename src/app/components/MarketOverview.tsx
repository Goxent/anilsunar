import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react'
import sastoReport from '../data/sasto_premium_report.json'

export default function MarketOverview() {
  const premiumData = sastoReport?.data || []
  let index = 'N/A'
  let changePct = 'N/A'
  let turnover = 'N/A'

  if (premiumData.length > 0) {
    const rawText = premiumData[0]
    const lines = rawText.split('\n')
    
    // Extracted values based on typical Sasto Share format
    if (lines[0]) index = lines[0].trim()
    if (lines[1]) changePct = lines[1].trim()
    
    // Find Turnover line
    const turnoverLine = lines.find(l => l.includes('Turnover'))
    if (turnoverLine) {
      turnover = turnoverLine.replace('Turnover', '').trim()
    }
  }

  const isPositive = !changePct.startsWith('-')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Market Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Scraped NEPSE market summary from Sasto Share</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> UPDATED
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {sastoReport.lastUpdated || 'Unknown'}
          </span>
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
          color: isPositive ? 'var(--green)' : 'var(--red)',
          fontSize: 20, fontWeight: 700,
        }}>
          {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          {changePct}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Turnover</p>
            <p style={{ fontWeight: 700, fontSize: 18 }}>{turnover}</p>
          </div>
        </div>
      </div>

      {/* Live Chart Embed */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} style={{ color: 'var(--gold)' }} /> NEPSE Index Chart
          </h3>
          <span className="badge badge-gold">Live</span>
        </div>
        <iframe
          src="https://nepsealpha.com/trading/chart?symbol=NEPSE"
          style={{ width: '100%', height: 450, border: 'none' }}
          title="NEPSE Chart"
        />
      </div>
    </div>
  )
}
