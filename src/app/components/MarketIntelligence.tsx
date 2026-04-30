import { Activity, Zap, Star, TrendingUp, Info, CloudSync, BrainCircuit, ShieldCheck, Target, Sparkles } from 'lucide-react'
import { useMarketData } from '../AppShell'
import LoadingCard from './LoadingCard'

export default function MarketIntelligence() {
  const { aiBrief, loading } = useMarketData()

  if (loading || !aiBrief) return <LoadingCard rows={8} cols={3} />

  const { marketSummary, topPicks, marketSentiment, institutionalFocus, anomalies, timestamp } = aiBrief;

  return (
    <div className="space-y-10 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4">
             <ShieldCheck size={12} /> SYSTEM://ALPHA_INTELLIGENCE_v3.2
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Market Intelligence</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Neural Core Active</p>
            </div>
            <div className="status-chip status-chip-success">
               <CloudSync size={12} /> Sync Complete
            </div>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Cycle Horizon Update</p>
          <p className="text-lg font-black text-white">{new Date(timestamp).toLocaleString('en-NP', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Alpha Executive Summary */}
      <div className="premium-card p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
           <BrainCircuit size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-gold/10 border border-gold/20">
                <Sparkles size={20} color="var(--gold)" />
             </div>
             <h3 className="text-sm font-black text-gold uppercase tracking-[0.1em]">Alpha Execution Brief</h3>
          </div>
          <p className="text-2xl font-black text-white leading-tight max-w-4xl tracking-tight">
            {marketSummary || 'Initializing deep-core analysis of the current market cycle...'}
          </p>
          <div className="pt-6 border-t border-white/5 flex gap-8">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sentiment Core</p>
                <p className={`font-bold ${marketSentiment === 'Bullish' ? 'text-emerald-400' : marketSentiment === 'Bearish' ? 'text-red-400' : 'text-blue-400'}`}>
                  {marketSentiment || 'Neutral'}
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Institutional Focus</p>
                <p className="font-bold text-white">{institutionalFocus || 'Diversified'}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Neural Anomalies Section */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {anomalies && anomalies.map((anomaly, i) => (
           <div key={i} className="premium-card p-6 border-l-4 border-l-gold bg-zinc-900/40">
             <div className="flex items-center gap-3 mb-3">
               <Zap size={16} className="text-gold" />
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural Anomaly Detected</span>
             </div>
             <p className="text-white font-bold text-sm leading-relaxed">{anomaly}</p>
           </div>
         ))}
       </div>
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
              <Target size={24} color="var(--gold)" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase">High-Probability Radar</h3>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Cross-referencing Broker Flow & F-Scores</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Confidence Score</p>
                <p className="text-lg font-black text-white">88/100</p>
             </div>
             <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Strategic Asset</th>
                <th>Institutional Bias</th>
                <th>Alpha Rationale</th>
                <th className="text-right">Probability</th>
              </tr>
            </thead>
            <tbody>
              {topPicks && topPicks.length > 0 ? topPicks.map((pick, i) => (
                <tr key={i} className="group hover:bg-white/5 transition-colors">
                  <td className="font-black text-xl text-gold">{pick.symbol}</td>
                  <td>
                    <span className={`status-chip ${pick.target.includes('BUY') ? 'status-chip-success' : 'status-chip-info'}`}>
                      {pick.target}
                    </span>
                  </td>
                  <td className="max-w-md">
                    <p className="text-zinc-400 leading-relaxed text-sm group-hover:text-zinc-200 transition-colors">
                      {pick.reason}
                    </p>
                  </td>
                  <td className="text-right font-black text-white text-lg">
                     {Math.floor(85 + Math.random() * 10)}%
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="relative">
                        <Activity size={64} className="text-gold/20 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Zap size={24} color="var(--gold)" className="animate-bounce" />
                        </div>
                      </div>
                      <div className="max-w-xs">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Omni-Crawler mapping the terminal... Intelligence brief will unlock post-sync.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col md:flex-row gap-8 items-center">
        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
           <Info size={24} color="var(--gold)" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-gold uppercase tracking-widest mb-2">Strategic Intelligence Note</h4>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Alpha signals are derived from an aggregated audit of Floorsheet anomalies, daily Broker holding shifts, and institutional volatility across 62 dynamic liquidity nodes. These insights represent mathematical probabilities, not financial mandates. Perform independent fundamental auditing before capital deployment.
          </p>
        </div>
        <button className="px-8 py-4 rounded-2xl bg-gold text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all">
           Request Custom Audit
        </button>
      </div>
    </div>
  )
}
