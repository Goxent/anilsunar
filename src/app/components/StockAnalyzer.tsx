import React, { useState, useMemo, useEffect } from 'react'
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  ShieldAlert,
  Zap,
  ArrowRight
} from 'lucide-react'
import { useMarketData } from '../AppShell'
import { callAI } from '../lib/ai'
import fundamentalData from '../data/fundamental-data.json'
import deepIntelligence from '../data/deep_intelligence.json'

export default function StockAnalyzer() {
  const { omniData } = useMarketData()
  
  // State
  const [query, setQuery] = useState('')
  const [activeSymbol, setActiveSymbol] = useState('') 
  const [phase, setPhase] = useState<'idle'|'scraping'|'fundamentals'|'ai'|'done'|'error'>('idle')
  const [scraped, setScraped] = useState<any>(null)
  const [fundamentals, setFundamentals] = useState<any>(null)
  const [aiResult, setAiResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Lookup Map
  const fundMap = useMemo(() => {
    if (!fundamentalData?.stocks) return {}
    return Object.fromEntries(
      fundamentalData.stocks.map((s: any) => [s.symbol.toUpperCase(), s])
    )
  }, [])

  // Quick Picks
  const quickPicks = useMemo(() => {
    const stage3 = (deepIntelligence as any)?.stage3 || {}
    const topPicks = stage3.topPicks || []
    if (topPicks.length > 0) {
      return topPicks.slice(0, 8).map((p: any) => p.symbol.toUpperCase())
    }
    return ['NABIL','UPPER','CHCL','GBIME','NTC','HIDCL','EBL','NLIC']
  }, [])

  async function analyze(symbol: string) {
    const sym = symbol.toUpperCase().trim()
    if (!sym) return

    setActiveSymbol(sym)
    setPhase('scraping')
    setError('')
    setScraped(null)
    setFundamentals(null)
    setAiResult(null)

    try {
      // 1. SCRAPING PHASE
      const pages = omniData?.scrapedPages || []
      const matchedPages: any[] = []
      let ltp = '—'
      let change = '—'
      let volume = '—'
      let sector = '—'

      pages.forEach((page: any) => {
        const matchingRows: any[] = []
        
        page.tables?.forEach((table: any) => {
          table.rows?.forEach((row: any) => {
            const values = Object.values(row).map(v => String(v).toUpperCase())
            if (values.includes(sym)) {
              matchingRows.push(row)
              
              // Extract specific fields if found
              if (ltp === '—') ltp = row['LTP'] || row['Price'] || row['Current Price'] || row['Price(NPR)'] || '—'
              if (change === '—') change = row['Change%'] || row['% Change'] || row['Percent Change'] || row['Daily Gain'] || '—'
              if (volume === '—') volume = row['Volume'] || row['Quantity'] || '—'
              if (sector === '—') sector = row['Sector'] || '—'
            }
          })
        })

        if (matchingRows.length > 0) {
          matchedPages.push({
            pageTitle: page.title || 'Untitled Page',
            pageUrl: page.url || '#',
            rows: matchingRows
          })
        }
      })

      const scrapedInfo = {
        symbol: sym,
        matchedPages,
        ltp,
        change,
        volume,
        sector
      }
      setScraped(scrapedInfo)

      // 2. FUNDAMENTALS PHASE
      setPhase('fundamentals')
      const fund = fundMap[sym] || null
      setFundamentals(fund)

      // 3. AI PHASE
      setPhase('ai')
      const dataSummary = JSON.stringify({
        symbol: sym,
        ltp: scrapedInfo.ltp,
        change: scrapedInfo.change,
        volume: scrapedInfo.volume,
        sector: scrapedInfo.sector,
        fundamentals: fund || 'not in database',
        pagesFoundIn: matchedPages.map(p => p.pageTitle)
      })

      const prompt = `You are a NEPSE stock analyst. Analyze ${sym} listed on the Nepal Stock Exchange.

Available data from today's market scan:
${dataSummary}

Provide a research report with these 5 sections:
1. BUSINESS: What does this company do? Revenue model, sector position in Nepal. (2-3 sentences)
2. RECENT_NEWS: Any significant news about this company in the last 6 months — dividend announcements, right shares, management changes, regulatory actions, financial results. If you have limited recent information, say "No major recent news found — check MeroLagani or ShareSansar for latest updates."
3. FUNDAMENTALS: Analyze the P/E ratio (pe), EPS, and Book Value shown. How do they compare to NEPSE sector averages? Is the stock overvalued or undervalued?
4. RISKS: List exactly 3 specific risks for this stock. Be specific to this company, not generic.
5. VERDICT: One of: STRONG BUY / BUY / HOLD / AVOID. Then 2 sentences explaining exactly why.

Return ONLY valid JSON. No markdown, no explanation outside JSON:
{
  "business": "string",
  "recentNews": "string", 
  "fundamentals": "string",
  "risks": ["risk1", "risk2", "risk3"],
  "verdict": "BUY",
  "verdictReason": "string"
}`

      const rawText = await callAI(prompt)
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setAiResult(parsed)
      setPhase('done')

    } catch (err: any) {
      console.error(err)
      setPhase('error')
      setError(err.message || 'An unexpected error occurred during analysis.')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    analyze(query)
  }

  const isPositive = scraped?.change && !scraped.change.startsWith('-') && scraped.change !== '—'

  return (
    <div className="flex flex-col gap-8">
      {/* SEARCH BAR & QUICK PICKS */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-3" size={20} />
            <input 
              type="text" 
              placeholder="Search NEPSE symbol — e.g. NABIL, UPPER, CHCL"
              className="w-full pl-12 pr-4 py-[14px] bg-1 border border-border rounded-[10px] text-[15px] text-1 focus:border-gold outline-none transition-colors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-[14px] bg-gold text-black font-bold rounded-[10px] text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={phase !== 'idle' && phase !== 'done' && phase !== 'error'}
          >
            Analyze
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-2 uppercase tracking-widest">Today's picks:</span>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((sym) => (
              <button
                key={sym}
                onClick={() => { setQuery(sym); analyze(sym); }}
                className={`px-3.5 py-1.5 rounded-md border text-[12px] font-mono font-bold transition-all ${
                  activeSymbol === sym 
                  ? 'badge-gold' 
                  : 'bg-1 border-border text-2 hover:border-gold-border hover:text-gold'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LOADING STEPS */}
      {(phase !== 'idle' && phase !== 'done' && phase !== 'error') && (
        <div className="card-base p-8 max-w-md mx-auto w-full flex flex-col gap-6">
          <LoadingStep 
            label="Reading SastoShare data" 
            status={phase === 'scraping' ? 'active' : 'done'} 
          />
          <LoadingStep 
            label="Loading fundamentals" 
            status={phase === 'scraping' ? 'pending' : phase === 'fundamentals' ? 'active' : 'done'} 
          />
          <LoadingStep 
            label="Generating AI research" 
            status={phase === 'ai' ? 'active' : phase === 'done' ? 'done' : 'pending'} 
          />
        </div>
      )}

      {/* ERROR STATE */}
      {phase === 'error' && (
        <div className="card-base border-red-border p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-dim rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red" size={24} />
          </div>
          <h3 className="font-display text-xl font-bold text-1 mb-2">Analysis Failed</h3>
          <p className="text-2 text-sm mb-6">{error}</p>
          <button 
            onClick={() => analyze(activeSymbol)}
            className="btn w-full justify-center"
          >
            <RefreshCw size={14} className="mr-2" /> Try Again
          </button>
        </div>
      )}

      {/* IDLE STATE */}
      {phase === 'idle' && (
        <div className="py-20 text-center flex flex-col items-center gap-4 opacity-50">
          <Activity size={48} className="text-3" />
          <p className="text-2 font-medium">Search a stock symbol above to begin analysis.</p>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'done' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 animate-in fade-in duration-500">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8">
            <div className="text-[10px] font-bold text-2 uppercase tracking-[0.2em]">Sasto Share Data</div>
            
            {/* Price Card */}
            <div className="card-base p-6 relative overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between">
                  <h1 className="font-display text-[42px] font-bold text-gold leading-none">{scraped?.symbol}</h1>
                  <div className={`badge ${isPositive ? 'badge-green' : 'badge-red'} px-3 py-1 text-sm`}>
                    {scraped?.change}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-1">{scraped?.ltp}</span>
                  <span className="text-2 text-xs font-bold uppercase tracking-widest">NPR</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
                  <Metric label="Volume" value={scraped?.volume} />
                  <Metric label="Sector" value={scraped?.sector} />
                  <Metric label="P/E Ratio" value={fundamentals?.pe || '—'} />
                  <Metric label="EPS" value={fundamentals?.eps || '—'} />
                </div>
              </div>
            </div>

            {/* SastoShare Data Details */}
            <div className="card-base p-6">
              <div className="text-[12px] font-bold text-2 uppercase tracking-widest mb-6">SastoShare Data</div>
              <div className="flex flex-col gap-8">
                {scraped?.matchedPages?.length > 0 ? scraped.matchedPages.slice(0, 4).map((page: any, pi: number) => (
                  <div key={pi} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <span className="text-[11px] font-bold text-gold uppercase tracking-wider">{page.pageTitle}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                      {Object.entries(page.rows[0]).map(([key, val]: [string, any], ki) => {
                        if (key.match(/Col_\d+/i)) return null
                        return (
                          <div key={ki} className="flex justify-between items-center border-b border-white/[0.03] pb-1">
                            <span className="text-[11px] text-3 font-bold uppercase">{key}</span>
                            <span className="text-[13px] font-mono text-1">{String(val)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )) : (
                  <div className="py-4 text-center text-2 text-sm italic">
                    This symbol was not found in today's scraped data.
                  </div>
                )}
              </div>
            </div>

            {/* Fundamentals Card */}
            <div className="card-base p-6">
              <div className="text-[12px] font-bold text-2 uppercase tracking-widest mb-6">Fundamentals</div>
              {fundamentals ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  <BigMetric label="EPS" value={fundamentals.eps} />
                  <BigMetric label="P/E" value={fundamentals.pe} />
                  <BigMetric label="Book Value" value={fundamentals.bookValue} />
                  <BigMetric label="LTP" value={fundamentals.ltp} />
                </div>
              ) : (
                <div className="py-4 text-center text-2 text-sm italic">
                  Not in fundamental database — run tearsheet crawler.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-8">
            <div className="text-[10px] font-bold text-2 uppercase tracking-[0.2em]">AI Research</div>

            {/* Verdict Badge */}
            <div className="flex flex-col gap-3 items-center">
              <div className={`w-full py-4 rounded-xl text-center text-lg font-black tracking-[0.2em] uppercase border shadow-lg ${
                aiResult?.verdict === 'STRONG BUY' ? 'badge-green border-green-border' :
                aiResult?.verdict === 'BUY'        ? 'badge-blue border-blue-border' :
                aiResult?.verdict === 'HOLD'       ? 'badge-amber border-amber-border' :
                'badge-red border-red-border'
              }`}>
                {aiResult?.verdict}
              </div>
              <p className="font-display italic text-1 text-[15px] text-center px-4 leading-relaxed">
                "{aiResult?.verdictReason}"
              </p>
            </div>

            {/* Research Sections */}
            <div className="flex flex-col gap-4">
              <ResearchCard label="Business" color="text-2" content={aiResult?.business} />
              <ResearchCard label="Recent News" color="text-2" content={aiResult?.recentNews} />
              <ResearchCard label="Fundamentals Analysis" color="text-2" content={aiResult?.fundamentals} />
              <ResearchCard label="Key Risks" color="text-red" isList items={aiResult?.risks} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingStep({ label, status }: { label: string, status: 'pending'|'active'|'done' }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
        status === 'done' ? 'bg-green text-black' : 
        status === 'active' ? 'bg-gold-dim border border-gold-border' : 
        'bg-bg-2 border border-border text-3'
      }`}>
        {status === 'done' ? <CheckCircle2 size={14} /> : 
         status === 'active' ? <RefreshCw size={14} className="text-gold animate-spin" /> :
         <Circle size={10} />}
      </div>
      <span className={`text-sm font-bold tracking-wide transition-colors ${
        status === 'active' ? 'text-gold' : status === 'done' ? 'text-1' : 'text-3'
      }`}>
        {label}
      </span>
    </div>
  )
}

function Metric({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-3 uppercase tracking-wider">{label}</span>
      <span className="text-[13px] font-mono font-bold text-1 truncate">{value}</span>
    </div>
  )
}

function BigMetric({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xl font-black text-1">{value || '—'}</span>
      <span className="text-[10px] font-bold text-2 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function ResearchCard({ label, color, content, isList, items }: { label: string, color: string, content?: string, isList?: boolean, items?: string[] }) {
  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <div className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</div>
      {isList && items ? (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-red font-mono text-xs font-bold">{i + 1}.</span>
              <span className="text-sm text-1 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-1 leading-relaxed">{content}</p>
      )}
    </div>
  )
}
