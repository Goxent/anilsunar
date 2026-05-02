import React, { useState, useMemo } from 'react'
import { 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { useMarketData } from '../AppShell'
import deepIntelligence from '../data/deep_intelligence.json'
import aiBriefFallback from '../data/ai_digest.json'

export default function DailyBrief() {
  const { omniData } = useMarketData()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Data Extraction
  const stage1 = (deepIntelligence as any)?.stage1 || {}
  const stage3 = (deepIntelligence as any)?.stage3 || {}

  const topPicks = useMemo(() => {
    const picks = (stage3.topPicks?.length > 0)
      ? stage3.topPicks
      : (aiBriefFallback.topPicks || [])
    return picks
  }, [stage3, aiBriefFallback])

  const marketSummary = stage3.marketSummary || aiBriefFallback.marketSummary || ''
  const marketPhase   = stage3.marketPhase   || aiBriefFallback.marketPhase   || 'SIDEWAYS'
  const keyRisk       = stage1.keyRisk       || aiBriefFallback.keyRisk       || ''
  const hotSectors    = stage1.hotSectors    || []
  const weakSectors   = stage1.weakSectors   || []
  const overallBias   = stage1.overallBias   || (aiBriefFallback as any).marketSentiment || 'NEUTRAL'
  const generatedAt   = stage3.generatedAt   || aiBriefFallback.timestamp || null

  // NEPSE Index Parsing
  const indexData = useMemo(() => {
    const summaryPage = omniData?.scrapedPages?.find((p: any) => p.url?.includes('daily-summary'))
    if (!summaryPage) return null

    const kvData: Record<string, string> = {}
    summaryPage.tables?.forEach((t: any) => {
      t.rows?.forEach((row: any) => {
        const keys = Object.keys(row)
        if (keys.length >= 2) {
          const label = row[keys[0]]
          const value = row[keys[1]]
          if (label && value) kvData[label] = value
        }
      })
    })

    return {
      current: kvData['Current'] || '—',
      gain: kvData['Daily Gain'] || '—',
      turnover: kvData['Turnover'] || '—',
      advances: kvData['Advances'] || '—',
      declines: kvData['Declines'] || '—',
      date: kvData['Date'] || '—'
    }
  }, [omniData])

  const getRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Unknown'
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    }
    if (diffHrs < 24) return `${diffHrs}h ago`
    return then.toLocaleDateString()
  }

  // Empty State
  if (topPicks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="card-base p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-gold-dim rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-gold" size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-1 mb-3">No brief generated yet</h2>
          <p className="text-2 text-sm mb-8">Run the Alpha Bot to generate today's market intelligence.</p>
          <div className="text-gold font-bold text-xs uppercase tracking-widest">
            Waiting for Intelligence Sync
          </div>
        </div>
      </div>
    )
  }

  const isPositive = indexData?.gain && !indexData.gain.startsWith('-') && indexData.gain !== '—'

  return (
    <div className="flex flex-col gap-6 -m-6">
      {/* SECTION 1: Top Bar */}
      <div className="bg-1 h-12 border-b border-border px-6 flex items-center justify-between sticky top-[56px] z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2 text-[10px] font-bold uppercase tracking-widest">NEPSE</span>
            <span className="font-mono text-base font-bold text-1">{indexData?.current || '—'}</span>
            {indexData?.gain !== '—' && (
              <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                {indexData?.gain}
              </span>
            )}
          </div>
          <div className="h-4 w-[1px] bg-border mx-2" />
          <div className="font-mono text-xs text-2">
            Advances {indexData?.advances} · Declines {indexData?.declines}
          </div>
        </div>
        <div className="text-[11px] text-2 font-medium">
          Generated {getRelativeTime(generatedAt)}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* SECTION 2: AI Summary */}
        <div className="max-w-[900px]">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold mb-3">
            Market Intelligence
          </div>
          {marketSummary && marketSummary !== "Market analysis unavailable." && (
            <p className="font-display text-xl italic text-1 leading-relaxed mb-6">
              "{marketSummary}"
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <span className={`badge ${
              marketPhase === 'BULL' ? 'badge-green' : 
              marketPhase === 'BEAR' ? 'badge-red' : 
              'badge-gray'
            }`}>
              {marketPhase} PHASE
            </span>
            <span className={`badge ${
              overallBias === 'BULLISH' ? 'badge-green' : 
              overallBias === 'BEARISH' ? 'badge-red' : 
              'badge-gray'
            }`}>
              {overallBias} BIAS
            </span>
            {keyRisk && (
              <span className="badge badge-amber max-w-[300px] truncate">
                RISK: {keyRisk.length > 40 ? keyRisk.substring(0, 40) + '...' : keyRisk}
              </span>
            )}
          </div>
        </div>

        {/* SECTION 3: Top Picks Table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-1">Today's Top Picks</h3>
            <span className="badge badge-gray">{topPicks.length} stocks</span>
          </div>

          <div className="card-base overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-2">
                  <td className="p-3 pl-4 w-12">#</td>
                  <td className="p-3">Symbol</td>
                  <td className="p-3">Signal</td>
                  <td className="p-3">Entry</td>
                  <td className="p-3">Stop</td>
                  <td className="p-3">Target</td>
                  <td className="p-3">Upside</td>
                  <td className="p-3">Horizon</td>
                  <td className="p-3 pr-4 text-right">Signals</td>
                </tr>
              </thead>
              <tbody>
                {topPicks.map((pick: any, idx: number) => {
                  const isExpanded = expandedRow === pick.symbol
                  const upside = pick.upside || '—'
                  const isUpsidePositive = upside.startsWith('+')

                  return (
                    <React.Fragment key={pick.symbol}>
                      <tr 
                        className="border-b border-border hover:bg-bg-2 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(isExpanded ? null : pick.symbol)}
                      >
                        <td className="p-4 pl-4 font-mono text-[13px] text-2">{idx + 1}</td>
                        <td className="p-4 font-mono text-[15px] font-bold text-gold">
                          {pick.symbol}
                        </td>
                        <td className="p-4">
                          <span className={`badge ${
                            pick.signal === 'STRONG BUY' ? 'badge-green' :
                            pick.signal === 'BUY'        ? 'badge-blue'  :
                            pick.signal === 'ACCUMULATE' ? 'badge-amber' :
                            pick.signal === 'BREAKOUT'   ? 'badge-purple' :
                            'badge-gray'
                          }`}>
                            {pick.signal}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[12px] text-2">{pick.entryZone || '—'}</td>
                        <td className="p-4 font-mono text-[12px] text-red">{pick.stopLoss || '—'}</td>
                        <td className="p-4 font-mono text-[12px] text-green">{pick.target || '—'}</td>
                        <td className={`p-4 font-mono text-[13px] font-bold ${isUpsidePositive ? 'text-green' : 'text-red'}`}>
                          {upside}
                        </td>
                        <td className="p-4">
                          <span className="badge badge-gray text-[10px]">
                            {pick.timeHorizon || pick.horizon || 'SWING'}
                          </span>
                        </td>
                        <td className="p-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pick.signals?.slice(0, 2).map((s: string, i: number) => (
                              <span key={i} className="badge badge-gray text-[9px] py-0.5 px-1.5">
                                {s}
                              </span>
                            ))}
                            {pick.signals?.length > 2 && (
                              <span className="text-[9px] text-3 font-bold">
                                +{pick.signals.length - 2}
                              </span>
                            )}
                            <div className="ml-2 text-2">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-bg-2 p-0 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="p-6 pl-16 border-b border-border">
                              <div className="flex flex-col gap-5">
                                <p className="font-display text-sm italic text-1 leading-relaxed max-w-[700px]">
                                  "{pick.thesis || 'No detailed analysis provided for this pick.'}"
                                </p>
                                <div className="flex flex-wrap gap-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-3 uppercase">Conviction</span>
                                    <span className="text-xs font-bold text-1">{pick.conviction || pick.positionSize || 'Medium'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-3 uppercase">Risk Level</span>
                                    <span className="text-xs font-bold text-1">{pick.riskLevel || 'Standard'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-3 uppercase">Sector</span>
                                    <span className="text-xs font-bold text-1">{pick.sector || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hot Sectors */}
          <div className="card-base p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-4">
              Hot Sectors
            </div>
            <div className="flex flex-col gap-3">
              {hotSectors.length > 0 ? hotSectors.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-1">{s.name || s}</span>
                  <span className={`badge ${s.momentum === 'STRONG' ? 'badge-green' : 'badge-amber'}`}>
                    {s.momentum || 'MODERATE'}
                  </span>
                </div>
              )) : (
                <span className="text-xs text-2">Run bot for sector data</span>
              )}
            </div>
          </div>

          {/* Sectors to Avoid */}
          <div className="card-base p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-red mb-4">
              Avoid Today
            </div>
            <div className="flex flex-col gap-3">
              {weakSectors.length > 0 ? weakSectors.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-1">{s.name || s}</span>
                  <span className="badge badge-red">AVOID</span>
                </div>
              )) : (
                <span className="text-xs text-2">—</span>
              )}
            </div>
          </div>

          {/* Key Risk */}
          <div className="card-base p-5 bg-amber-dim border-amber-border">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber mb-4">
              Key Risk
            </div>
            <p className="text-sm text-1 leading-relaxed">
              {keyRisk || 'No major systemic risks identified for the current session.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
