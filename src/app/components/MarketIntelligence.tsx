import { Activity, Zap, Star, TrendingUp, Info } from 'lucide-react'
import aiDataRaw from '../data/ai_digest.json'

// Type-safe cast for the JSON data
const aiData = aiDataRaw as unknown as {
  timestamp: string;
  marketSummary: string;
  topPicks: Array<{
    symbol: string;
    target: string;
    reason: string;
  }>;
};

export default function MarketIntelligence() {
  const { marketSummary, topPicks, timestamp } = aiData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div className="terminal-text" style={{ marginBottom: 4 }}>SYSTEM://ALPHA_INTELLIGENCE_v2</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Market Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <span className="pulse"></span> 
            Omni-Crawler Data Lake & Claude 3.5 Analysis Active
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Last Analysis Update</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{new Date(timestamp).toLocaleString('en-NP')}</p>
        </div>
      </div>

      {/* Alpha Market Summary */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--gold)', background: 'linear-gradient(90deg, rgba(245,158,11,0.05) 0%, transparent 100%)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} /> Alpha Market Summary
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-primary)', maxWidth: '900px' }}>
          {marketSummary || 'Analyzing market data lake...'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Top 10 High-Probability Picks */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} style={{ color: 'var(--gold)' }} /> AI High-Probability Picks
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>
              Based on Broker Accumulation & F-Scores
            </span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>SYMBOL</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>ACTION</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>ALPHA REASONING</th>
                </tr>
              </thead>
              <tbody>
                {topPicks && topPicks.length > 0 ? topPicks.map((pick, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--gold)' }}>{pick.symbol}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 800, 
                        padding: '4px 8px', 
                        borderRadius: 4,
                        background: pick.target.includes('BUY') ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: pick.target.includes('BUY') ? '#22c55e' : '#f59e0b',
                        border: `1px solid ${pick.target.includes('BUY') ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`
                      }}>
                        {pick.target}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      {pick.reason}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                      <Activity className="spin" style={{ marginBottom: 12 }} />
                      <p>Omni-Crawler mapping the platform... Please wait for 6 PM sync.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(245,158,11,0.03)', borderRadius: 12, border: '1px dashed rgba(245,158,11,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Info size={20} style={{ color: 'var(--gold)', marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>CA Analyst Note</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              These signals are generated by analyzing live Floorsheet anomalies and Broker holdings across 62 dynamic data points. Always cross-verify with your own auditing standards before executing trades.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
