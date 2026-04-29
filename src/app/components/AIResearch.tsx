import React, { useState } from 'react'
import { Brain, Search, Sparkles, TrendingUp, AlertCircle, FileText, Activity, MessageSquare, RefreshCw, ShieldCheck, Zap, Target } from 'lucide-react'
import { useMarketData, useToast } from '../AppShell'
import LoadingCard from './LoadingCard'
import { callClaude } from '../lib/ai'

function getQuickPicks(omniData: any) {
  if (!omniData) return ['NABIL', 'UPPER', 'NLIC']
  const pages = omniData?.scrapedPages || []
  const topStocksPage = pages.find((p: any) => p.url?.includes('top-stocks') || p.title?.includes('Home'))
  if (topStocksPage?.tables?.[0]?.rows) {
    return topStocksPage.tables[0].rows
      .slice(0, 10)
      .map((r: any) => r.Symbol || r.Col_1)
      .filter(Boolean)
  }
  return ['NABIL', 'UPPER', 'NLIC', 'SHIVM', 'CHCL', 'GBIME', 'KBL', 'NTC', 'HIDCL', 'EBL']
}

export default function AIResearch() {
  const { showToast } = useToast()
  const { omniData, aiBrief, loading } = useMarketData()
  const [activeView, setActiveView] = useState<'analysis' | 'brief'>('analysis')
  const [symbol, setSymbol] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  if (loading) return <LoadingCard rows={10} cols={3} />

  const quickPicks = getQuickPicks(omniData)

  const analyzeStock = async (selectedSymbol: string) => {
    const sym = selectedSymbol || symbol
    if (!sym) return
    
    setAnalyzing(true)
    setSymbol(sym.toUpperCase())
    setResult(null)
    
    try {
      const pages = omniData?.scrapedPages || []
      let stockInfo = null
      let brokerData = []

      for (const page of pages) {
        for (const table of (page.tables || [])) {
          const row = table.rows?.find((r: any) => (r.Symbol || r.Col_1 || '').toUpperCase() === sym.toUpperCase())
          if (row) stockInfo = row
          
          if (page.url?.includes('broker') || page.url?.includes('floorsheet')) {
             const rows = table.rows?.filter((r: any) => (r.Symbol || r.Col_1 || '').toUpperCase() === sym.toUpperCase())
             if (rows?.length) brokerData.push(...rows)
          }
        }
      }

      if (!stockInfo) {
        throw new Error(`Symbol ${sym} not found in today's data lake.`)
      }

      const prompt = `Analyze this NEPSE stock: ${sym}
      Today's Data: ${JSON.stringify(stockInfo)}
      Recent Broker/Floorsheet Data: ${JSON.stringify(brokerData.slice(0, 20))}
      
      Provide a concise 4-section analysis:
      📊 Technical: Summary of current price movement and trend.
      🏦 Broker Activity: Insights from the provided broker data (who is buying/selling).
      ⚖️ Risk Level: Low, Medium, or High.
      🎯 Suggestion: Strong Buy, Accumulate, Hold, or Avoid.
      One-line reason for the suggestion.
      
      Respond in valid JSON with keys: technical, broker, risk, suggestion, reason.`

      const text = await callClaude(prompt, 1000)
      const jsonStr = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(jsonStr)
      
      setResult({
        ...parsed,
        symbol: sym.toUpperCase(),
        price: stockInfo.LTP || stockInfo['Current Price'] || stockInfo['Price(NPR)'] || 'N/A',
        change: stockInfo['Percent Change'] || stockInfo['Change'] || stockInfo['Daily Chg'] || '0%'
      })
      showToast(`AI Audit complete for ${sym}`, 'success')
    } catch (err: any) {
      console.error(err)
      showToast(err.message, 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>AI Research Lab</h2>
          <div className="flex items-center gap-3 mt-4">
            <p className="text-zinc-500 text-sm">Neural-powered intelligence and deep-core stock auditing.</p>
            <div className="status-chip status-chip-success">
               <ShieldCheck size={12} /> Secure Proxy
            </div>
          </div>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveView('analysis')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
          >
            <Sparkles size={14} /> Stock Auditor
          </button>
          <button 
            onClick={() => setActiveView('brief')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === 'brief' ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
          >
            <FileText size={14} /> Daily Brief
          </button>
        </div>
      </div>

      {activeView === 'analysis' ? (
        <div className="space-y-8 animate-fade-in">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Enter stock symbol for a neural audit (e.g. UPPER)..."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-gold/50 transition-all text-lg"
              />
            </div>
            <button 
              onClick={() => analyzeStock('')}
              disabled={analyzing}
              className="btn btn-primary px-10 rounded-2xl disabled:opacity-50"
            >
              {analyzing ? <><RefreshCw size={18} className="animate-spin mr-2" /> Auditing</> : <><Zap size={18} /> Run Audit</>}
            </button>
          </div>

          {/* Quick Picks */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-2">Deep Radar:</span>
            {quickPicks.map(p => (
              <button 
                key={p} 
                onClick={() => analyzeStock(p)}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold hover:border-gold/50 hover:text-gold transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Analysis Result */}
          {result && (
            <div className="premium-card p-10 space-y-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <Brain size={160} />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8 border-b border-white/5 pb-10">
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-5xl font-black text-gold tracking-tighter">{result.symbol}</h3>
                       <div className="status-chip status-chip-info">NEURAL AUDIT COMPLETE</div>
                    </div>
                    <div className="flex gap-6 items-baseline">
                       <span className="text-2xl font-black text-white">NPR {result.price}</span>
                       <span className={`text-lg font-bold ${result.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.change}
                       </span>
                    </div>
                 </div>
                 <div className="text-left md:text-right space-y-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural Verdict</p>
                    <div className={`text-2xl font-black px-8 py-3 rounded-2xl inline-block border-2 ${
                       result.suggestion.includes('Buy') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 
                       result.suggestion.includes('Avoid') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 
                       'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    }`}>
                       {result.suggestion.toUpperCase()}
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                 <div className="space-y-4">
                    <h4 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                       <Activity size={18} color="var(--gold)" /> Market Velocity & Technicals
                    </h4>
                    <p className="text-zinc-300 leading-relaxed text-lg">{result.technical}</p>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                       <TrendingUp size={18} color="var(--gold)" /> Institutional Footprint
                    </h4>
                    <p className="text-zinc-300 leading-relaxed text-lg">{result.broker}</p>
                 </div>
               </div>

               <div className="relative z-10 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Risk Factor</p>
                       <span className={`text-sm font-black px-3 py-1 rounded-md ${
                          result.risk === 'Low' ? 'text-emerald-400 bg-emerald-500/10' : 
                          result.risk === 'High' ? 'text-red-400 bg-red-500/10' : 
                          'text-amber-400 bg-amber-500/10'
                       }`}>
                          {result.risk.toUpperCase()}
                       </span>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Core Rationale</p>
                       <p className="text-sm font-bold text-white">{result.reason}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 text-zinc-600">
                    <Brain size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Claude 3.5 Sonnet Analysis</span>
                 </div>
               </div>
            </div>
          )}

          {!result && !analyzing && (
            <div className="premium-card p-20 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
              <Brain size={64} className="text-zinc-500" />
              <div className="max-w-xs">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Enter a terminal symbol to initiate a neural equity audit.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {aiBrief && aiBrief.marketSummary ? (
            <div className="space-y-8">
              <div className="premium-card border-l-4 border-gold p-10 space-y-6">
                <div className="flex items-center gap-3">
                   <MessageSquare size={20} color="var(--gold)" />
                   <h3 className="text-sm font-black text-gold uppercase tracking-widest">Executive Market Intelligence</h3>
                </div>
                <p className="text-xl font-medium text-zinc-200 leading-relaxed max-w-4xl">{aiBrief.marketSummary}</p>
              </div>

              <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="p-8 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-4">
                  <Target size={20} color="var(--gold)" />
                  <h3 className="text-xl font-black uppercase tracking-tight">High-Probability Alpha Radar</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Strategic Signal</th>
                        <th>Neural Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiBrief.topPicks.map((pick: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="font-black text-gold text-xl">{pick.symbol}</td>
                          <td>
                            <span className={`status-chip ${pick.target.includes('BUY') ? 'status-chip-success' : 'status-chip-info'}`}>
                              {pick.target}
                            </span>
                          </td>
                          <td className="text-zinc-400 text-sm leading-relaxed">{pick.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-card p-20 flex flex-col items-center justify-center text-center space-y-8">
              <div className="p-6 rounded-full bg-red-500/5 border border-red-500/10 text-red-500/30">
                 <AlertCircle size={64} />
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl font-black mb-2">Alpha Brief Unavailable</h3>
                <p className="text-zinc-500">The daily intelligence brief has not been generated for this cycle. Run the full automation pipeline to refresh.</p>
              </div>
              <div className="p-4 bg-black border border-zinc-800 rounded-xl font-mono text-gold text-sm">
                 npm run full-sync
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
