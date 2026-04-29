import React from 'react'
import { Layers, Info, Lock, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, Target, BarChart, Zap } from 'lucide-react'
import { useMarketData } from '../AppShell'
import LoadingCard from './LoadingCard'

function parseSectorData(omniData: any) {
  if (!omniData) return []
  const pages = omniData?.scrapedPages || []
  
  const eodPage = pages.find((p: any) => 
    p.title?.includes('EOD') || p.url?.includes('daily-summary')
  )
  
  const sectorTable = eodPage?.tables?.find((t: any) => 
    t.headers?.some((h: any) => h.includes('Sector')) && t.headers?.some((h: any) => h.includes('Gain'))
  )
  
  if (!sectorTable) return []

  return sectorTable.rows.map((row: any) => ({
    name: row.Sector || row.Col_0,
    changePct: parseFloat(String(row['Daily Gain'] || row['Change'] || row.Col_1 || '0').replace('%', '')),
    turnover: row.Turnover || row.Value || row.Col_2 || '0',
    advances: parseInt(row['+Ve Stocks'] || row['Advances'] || '0'),
    declines: parseInt(row['-Ve Stocks'] || row['Declines'] || '0')
  }))
}

export default function SectorHeatmap() {
  const { omniData, loading } = useMarketData()
  
  if (loading || !omniData) return <LoadingCard rows={10} cols={3} />

  const sectorData = parseSectorData(omniData)

  if (sectorData.length === 0) {
    return (
      <div className="premium-card flex flex-col items-center justify-center p-20 text-center space-y-6">
        <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
           <Layers size={48} />
        </div>
        <div className="max-w-md">
          <h3 className="text-2xl font-black mb-2">No Sector Velocity Detected</h3>
          <p className="text-zinc-500">Sector-specific heatmaps require a daily EOD summary sync. Run the Omni Crawler to map the current money flow.</p>
        </div>
      </div>
    )
  }

  const sortedByGain = [...sectorData].sort((a, b) => b.changePct - a.changePct)
  const topGainer = sortedByGain[0]
  const topLoser = sortedByGain[sortedByGain.length - 1]
  const topTurnover = [...sectorData].sort((a, b) => parseFloat(String(b.turnover).replace(/,/g, '')) - parseFloat(String(a.turnover).replace(/,/g, '')))[0]

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Sector Heatmap</h2>
          <p className="text-zinc-500 mt-4 text-sm">Visualizing relative strength and rotational velocity across NEPSE sectors.</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sectorData.map((sector, i) => {
          const isUp = sector.changePct >= 0
          const absChange = Math.abs(sector.changePct)
          const intensity = Math.min(absChange / 3, 1) * 0.4 + 0.1
          
          let cardBg = 'rgba(24, 24, 27, 0.4)'
          let accentColor = 'rgba(255, 255, 255, 0.1)'
          
          if (sector.changePct > 1.5) {
             cardBg = `rgba(16, 185, 129, ${intensity + 0.05})`
             accentColor = 'rgba(16, 185, 129, 0.2)'
          } else if (sector.changePct > 0.3) {
             cardBg = `rgba(16, 185, 129, ${intensity})`
             accentColor = 'rgba(16, 185, 129, 0.1)'
          } else if (sector.changePct < -1.5) {
             cardBg = `rgba(239, 68, 68, ${intensity + 0.05})`
             accentColor = 'rgba(239, 68, 68, 0.2)'
          } else if (sector.changePct < -0.3) {
             cardBg = `rgba(239, 68, 68, ${intensity})`
             accentColor = 'rgba(239, 68, 68, 0.1)'
          }

          return (
            <div 
              key={i} 
              className="premium-card group"
              style={{ 
                background: cardBg,
                borderColor: accentColor,
                padding: '24px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="font-black text-lg text-white group-hover:text-gold transition-colors">{sector.name}</span>
                <div className={`flex items-center gap-1 text-xl font-black ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  {sector.changePct.toFixed(2)}%
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sector Volume</p>
                      <p className="font-bold text-sm">NPR {(parseFloat(String(sector.turnover).replace(/,/g, '')) / 1000000).toFixed(1)}M</p>
                   </div>
                   <BarChart size={16} className="text-zinc-600" />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-2">
                    <span className="text-emerald-500">{sector.advances} Advancing</span>
                    <span className="text-red-500">{sector.declines} Declining</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(sector.advances / (sector.advances + sector.declines || 1)) * 100}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${(sector.declines / (sector.advances + sector.declines || 1)) * 100}%` }} className="bg-red-500" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rotation Insight */}
      <div className="premium-card border-l-4 border-gold bg-gold/5 p-8">
        <div className="flex items-center gap-4 mb-6">
           <Zap size={24} color="var(--gold)" />
           <h3 className="text-xl font-black tracking-tight uppercase">Capital Rotation Audit</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-2">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Rotational Momentum</p>
            <p className="text-sm leading-relaxed text-zinc-300">
              Institutional capital is aggressively flowing FROM <span className="text-red-400 font-black">{topLoser?.name}</span> AND ROTATING INTO <span className="text-emerald-400 font-black">{topGainer?.name}</span>.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Market Leader</p>
            <div className="flex items-center gap-3">
               <span className="text-lg font-black text-white">{topGainer?.name}</span>
               <span className="status-chip status-chip-success">+{topGainer?.changePct.toFixed(2)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Highest Liquidity Node</p>
            <div className="flex items-center gap-3">
               <span className="text-lg font-black text-white">{topTurnover?.name}</span>
               <span className="text-zinc-500 font-bold">NPR {(parseFloat(String(topTurnover?.turnover).replace(/,/g, '')) / 1000000000).toFixed(2)}B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Section */}
      <div className="premium-card relative overflow-hidden p-16 text-center border-dashed">
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 mb-6">
            <Lock size={24} />
          </div>
          <h4 className="text-xl font-black mb-2">Long-Term Cycle Analytics</h4>
          <p className="text-zinc-500 max-w-sm">Historical sector correlations and cyclical trends will unlock after 14 days of algorithmic data collection.</p>
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>
    </div>
  )
}
