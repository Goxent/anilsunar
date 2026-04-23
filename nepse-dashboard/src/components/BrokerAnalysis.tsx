import { AlertTriangle, Shield, TrendingUp, TrendingDown, Eye, Crown } from 'lucide-react'
import { ACCUMULATION_SIGNALS } from '../data/sampleData'
import sastoReport from '../data/sasto_premium_report.json'
import superData from '../data/super_intelligence.json'

export default function BrokerAnalysis() {
  const sorted = [...ACCUMULATION_SIGNALS].sort((a, b) => b.score - a.score)
  const premiumData = sastoReport?.data || []
  const brokerData = (superData as any)?.brokerData || []

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Broker Analysis</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Detect accumulation, distribution, and potential insider activity from floorsheet data</p>

      {/* Sasto Premium Insights */}
      {premiumData.length > 0 && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--gold)', background: 'linear-gradient(135deg, var(--bg-card) 0%, #1a1a10 100%)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)' }}>
            <Crown size={16} /> Sasto Share Premium Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {premiumData.map((text, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 13, color: 'var(--text-primary)', borderLeft: '2px solid var(--gold)' }}>
                {text.length > 200 ? text.substring(0, 200) + '...' : text}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 12, textAlign: 'right' }}>
            Last Synced: {sastoReport.lastUpdated}
          </p>
        </div>
      )}

      {/* Algorithm Explanation */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--gold)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={16} style={{ color: 'var(--gold)' }} /> How Detection Works
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          We analyze the daily floorsheet data to track <strong style={{ color: 'var(--text-primary)' }}>individual broker activity</strong> per stock over rolling windows (5, 10, 20 days). 
          When a single broker consistently buys large quantities across multiple days without selling, it triggers an <strong style={{ color: 'var(--green)' }}>Accumulation</strong> signal. 
          When multiple brokers do this simultaneously, it flags as <strong style={{ color: 'var(--gold)' }}>Strong Accumulation</strong> — a potential indicator of informed buying. 
          Conversely, sustained selling by a broker after accumulation triggers a <strong style={{ color: 'var(--red)' }}>Distribution</strong> warning.
        </p>
      </div>

      {/* Signals Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>
            {ACCUMULATION_SIGNALS.filter(s => s.signal === 'Strong Accumulation').length}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strong Accumulation</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>
            {ACCUMULATION_SIGNALS.filter(s => s.signal === 'Accumulation').length}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accumulation</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>
            {ACCUMULATION_SIGNALS.filter(s => s.signal === 'Distribution').length}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Distribution</p>
        </div>
      </div>

      {/* Signals Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {brokerData && brokerData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Broker Name</th>
                <th>Symbol</th>
                <th>Buy Qty</th>
                <th>Sell Qty</th>
                <th>Net Position</th>
              </tr>
            </thead>
            <tbody>
              {brokerData.map((row: any, i: number) => {
                const netPos = parseInt(row[4] || '0')
                return (
                  <tr key={i}>
                    <td>{row[0] || '-'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{row[1] || '-'}</td>
                    <td style={{ color: 'var(--green)' }}>{row[2] || '-'}</td>
                    <td style={{ color: 'var(--red)' }}>{row[3] || '-'}</td>
                    <td style={{ fontWeight: 600, color: netPos >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {netPos >= 0 ? '+' : ''}{netPos.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>Data not yet synced</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Run the sasto-analyzer bot to populate this data.</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        ⚠️ This analysis is for educational/personal use only. Accumulation signals do not guarantee insider activity. 
        Always do your own research before making investment decisions.
      </p>
    </div>
  )
}
