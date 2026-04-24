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
          <div className="terminal-text" style={{ marginBottom: 4 }}>SYSTEM://TERMINAL_ALPHA_V1</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Market Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <span className="pulse"></span> 
            Sasto Premium Real-time Data Pipeline Active
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Secure Access Session</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{updatedAt || 'SYNCING...'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Sector Rotation Card */}
        <div className="card" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} /> Sector Momentum
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rotation.length > 0 ? rotation.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{r}</span>
                <span style={{ color: 'var(--green)' }}>↑</span>
              </div>
            )) : <div style={{ opacity: 0.3 }}>Scanning sectors...</div>}
          </div>
        </div>

        {/* VIP Signals Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} /> Sasto Premium Signals
            </h3>
            <span className="terminal-text">ALPHA_ONLY</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ fontSize: 10 }}>Symbol</th>
                  <th style={{ fontSize: 10 }}>Entry Zone</th>
                  <th style={{ fontSize: 10 }}>Target</th>
                  <th style={{ fontSize: 10 }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {picks.length > 0 ? picks.map((pick, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 800 }}>{pick.symbol}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{pick.entry || 'CMP'}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{pick.target}</td>
                    <td><div style={{ width: 40, height: 4, background: 'var(--gold)', borderRadius: 2 }}></div></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, opacity: 0.3 }}>Waiting for market signals...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sentiment Analyzer */}
        <div className="card">
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={14} /> Alpha Sentiment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {sentiment.length > 0 ? sentiment.map((s, i) => (
               <p key={i} style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)', borderLeft: '2px solid var(--gold)', paddingLeft: 12 }}>{s}</p>
             )) : <p style={{ opacity: 0.3 }}>Listening to market chatter...</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, border: '1px dashed var(--border)', fontSize: 11, color: 'var(--text-secondary)' }}>
        ⚠️ Information integrated from Sasto Share Premium. This dashboard is for Anil Sunar's personal trading intelligence.
      </div>
    </div>
  )
}
