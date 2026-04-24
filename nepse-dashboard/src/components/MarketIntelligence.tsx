import { Crown, ArrowUpRight, Activity, Zap, MessageSquare } from 'lucide-react'
import deepDataRaw from '../data/deep_intelligence.json'

// Type-safe cast for the JSON data
const deepData = deepDataRaw as {
  signals: any[],
  rotation: any[],
  sentiment: any[],
  picks: any[],
  updatedAt: string
};

export default function MarketIntelligence() {
  const { signals, rotation, sentiment, picks, updatedAt } = deepData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Market Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Full Sasto Premium Integration — Refined Trading Terminal</p>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
          Last Deep Sync: {updatedAt}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column: Signals & Picks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* VIP Picks */}
          <div className="card" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Crown size={20} style={{ color: 'var(--gold)' }} /> Sasto Premium Picks
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Target</th>
                  <th>Signal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((pick, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 800, color: 'var(--gold)' }}>{pick.symbol}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{pick.target}</td>
                    <td><span className="badge badge-gold">{pick.signal}</span></td>
                    <td><button className="btn" style={{ padding: '4px 8px', fontSize: 10 }}>Trade</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technical Breakouts */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--gold)' }} /> Technical Breakouts (Signals)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {signals.map((s, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{s.symbol}</span>
                  <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>{s.signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sentiment & Rotation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Market Sentiment */}
          <div className="card" style={{ background: '#0c0c14' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} style={{ color: 'var(--gold)' }} /> Alpha Sentiment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sentiment.map((text, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '10px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>
                  {text.length > 120 ? text.substring(0, 120) + '...' : text}
                </div>
              ))}
            </div>
          </div>

          {/* Sector Momentum */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: 'var(--gold)' }} /> Sector Momentum
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rotation.map((r, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {r} <ArrowUpRight size={12} style={{ color: 'var(--green)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, border: '1px dashed var(--border)', fontSize: 11, color: 'var(--text-secondary)' }}>
        ⚠️ Information integrated from Sasto Share Premium. This dashboard is for Anil Sunar's personal trading intelligence.
      </div>
    </div>
  )
}
