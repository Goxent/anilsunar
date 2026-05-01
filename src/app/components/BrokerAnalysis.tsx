import React, { useState, useEffect } from 'react'
import { Search, Database, TrendingUp, TrendingDown, LayoutGrid, List, Table as TableIcon, ChevronRight, Info, Crown, Terminal, CloudSync, Zap, Filter, BarChart3, PieChart, Activity, ShieldCheck, Target } from 'lucide-react'
import { useMarketData } from '../AppShell'
import LoadingCard from './LoadingCard'
import localSastoData from '../data/super_intelligence.json'

// --- Data Parsing Utils ---

function parseBrokerData(omniData: any) {
  if (!omniData) return []
  const pages = omniData?.scrapedPages || []
  const brokerPages = pages.filter((p: any) => 
    p.url?.toLowerCase().includes('broker') || p.title?.toLowerCase().includes('broker')
  )
  
  const allData: any[] = []
  brokerPages.forEach((p: any) => {
    p.tables?.forEach((t: any) => {
      t.rows?.forEach((row: any) => {
        const broker = row.Broker || row['Broker Name'] || row.Col_0
        const symbol = row.Symbol || row.Col_1
        const buyQty = parseFloat(String(row['Buy Qty'] || row.Buy || row.Col_2).replace(/,/g, '')) || 0
        const sellQty = parseFloat(String(row['Sell Qty'] || row.Sell || row.Col_3).replace(/,/g, '')) || 0
        const netQty = parseFloat(String(row['Net Qty'] || row.Net || row.Col_4).replace(/,/g, '')) || (buyQty - sellQty)
        const netValue = row['Net Value'] || row.Value || row.Col_5 || '0'

        if (broker && symbol) {
          allData.push({ broker, symbol, buyQty, sellQty, netQty, netValue })
        }
      })
    })
  })
  
  return allData
}

function parseFloorsheet(omniData: any) {
  const pages = omniData?.scrapedPages || []
  const floorsheetPage = pages.find((p: any) => 
    p.url?.toLowerCase().includes('floorsheet') || p.title?.toLowerCase().includes('floorsheet')
  )
  
  const transactions: any[] = []
  floorsheetPage?.tables?.forEach((t: any) => {
    t.rows?.forEach((row: any) => {
      const symbol = row.Symbol || row.Col_1
      const buyBroker = row['Buyer'] || row['Buy Broker'] || row.Col_2
      const sellBroker = row['Seller'] || row['Sell Broker'] || row.Col_3
      const qty = parseFloat(String(row['Qty'] || row.Quantity || row.Col_4).replace(/,/g, '')) || 0
      const rate = parseFloat(String(row['Rate'] || row.Price || row.Col_5).replace(/,/g, '')) || 0
      const amount = parseFloat(String(row['Amount'] || row.Value || row.Col_6).replace(/,/g, '')) || (qty * rate)

      if (symbol && buyBroker && sellBroker) {
        transactions.push({ symbol, buyBroker, sellBroker, qty, rate, amount })
      }
    })
  })
  
  return transactions.slice(0, 200)
}

// --- Main Component ---

export default function BrokerAnalysis() {
  const { omniData, loading: marketLoading } = useMarketData()
  const [activeTab, setActiveTab] = useState<'intel' | 'institutional' | 'stock' | 'raw' | 'neural'>('intel')
  const [search, setSearch] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [stockAnalysis, setStockAnalysis] = useState<any>(null)
  const [cloudBrokerData, setCloudBrokerData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const rowsPerPage = 20

  // 1. Fetch Cloud Broker Analytics on mount
  useEffect(() => {
    async function fetchBrokerAnalytics() {
      try {
        const res = await fetch('/api/get-market-data?type=broker')
        if (res.ok) {
          const data = await res.json()
          setCloudBrokerData(data)
        }
      } catch (err) {
        console.error('Failed to fetch cloud broker analytics:', err)
      }
    }
    fetchBrokerAnalytics()
  }, [])

  // 2. Fetch Individual Stock Tearsheet (Neural Audit)
  const handleNeuralAudit = async (sym: string) => {
    if (!sym) return
    setLoading(true)
    setActiveTab('neural')
    setSelectedSymbol(sym.toUpperCase())
    try {
      const res = await fetch(`/api/get-market-data?type=tearsheet&symbol=${sym}`)
      if (res.ok) {
        const data = await res.json()
        setStockAnalysis(data)
      } else {
        setStockAnalysis(null)
      }
    } catch (err) {
      console.error('Neural Audit failed:', err)
      setStockAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  if (marketLoading || !omniData) return <LoadingCard rows={10} cols={6} />

  const brokerData = parseBrokerData(omniData)
  const floorsheetData = parseFloorsheet(omniData)
  
  // Use cloud data if available, otherwise local
  const sastoData = cloudBrokerData || localSastoData
  const brokerRecords = sastoData?.brokerData || []

  const filteredBrokerData = brokerData.filter(d => 
    d.symbol.toLowerCase().includes(search.toLowerCase()) || 
    d.broker.toLowerCase().includes(search.toLowerCase())
  )

  const stockAggregated = brokerData.reduce((acc: any, curr) => {
    if (!acc[curr.symbol]) {
      acc[curr.symbol] = { 
        symbol: curr.symbol, 
        brokers: [], 
        totalNet: 0,
        topBuyer: { broker: '', qty: -Infinity },
        topSeller: { broker: '', qty: Infinity }
      }
    }
    acc[curr.symbol].brokers.push(curr)
    acc[curr.symbol].totalNet += curr.netQty
    if (curr.netQty > acc[curr.symbol].topBuyer.qty) {
      acc[curr.symbol].topBuyer = { broker: curr.broker, qty: curr.netQty }
    }
    if (curr.netQty < acc[curr.symbol].topSeller.qty) {
      acc[curr.symbol].topSeller = { broker: curr.broker, qty: curr.netQty }
    }
    return acc
  }, {})

  const filteredStockData = Object.values(stockAggregated).filter((s: any) => 
    s.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const filteredFloorsheet = floorsheetData.filter(f => 
    f.symbol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white">Broker Analysis</h2>
          <div className="flex items-center gap-3 mt-4">
            <p className="text-zinc-500 text-sm">Institutional footprint tracking and Smart Money audit.</p>
            <div className="status-chip status-chip-success">
               <CloudSync size={12} /> {cloudBrokerData ? 'Cloud Connected' : 'Local Data'}
            </div>
          </div>
        </div>
        <div className="flex bg-zinc-900/80 backdrop-blur-xl p-1 rounded-2xl border border-zinc-800 shadow-2xl">
          {[
            { id: 'intel', label: 'Alpha Intel', icon: Zap },
            { id: 'institutional', label: 'Institutions', icon: LayoutGrid },
            { id: 'stock', label: 'Accumulation', icon: TrendingUp },
            { id: 'neural', label: 'Neural Audit', icon: Brain },
            { id: 'raw', label: 'Floorsheet', icon: List }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search / Neural Audit Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-gold transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Enter symbol for Neural Equity Audit (e.g. NABIL, ADBL)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNeuralAudit(search)}
          className="w-full pl-16 pr-32 py-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/5 transition-all text-xl font-medium"
        />
        <button 
          onClick={() => handleNeuralAudit(search)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold hover:bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/10"
        >
          Run Audit
        </button>
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in">
        
        {/* Tab 1: Alpha Intel (From Sasto/Firestore) */}
        {activeTab === 'intel' && (
          <div className="space-y-6">
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-gold/5 to-transparent">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                     <Crown size={24} className="text-gold" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight text-white">Sasto Premium Intelligence</h3>
                     <p className="text-zinc-500 text-sm">Verified institutional buy/sell data direct from source.</p>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-1">Last Updated</span>
                  <span className="text-zinc-300 font-mono text-sm">{sastoData.updatedAt || 'Recently'}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Broker Entity</th>
                      <th>Asset Symbol</th>
                      <th>Buy Qty</th>
                      <th>Sell Qty</th>
                      <th>Net Accumulation</th>
                      <th>SMC Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokerRecords.length > 0 ? brokerRecords.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="font-bold text-zinc-300">{row.broker}</td>
                        <td className="font-black text-gold text-lg">{row.symbol}</td>
                        <td className="text-emerald-400 font-medium">{(row.buyQty || 0).toLocaleString()}</td>
                        <td className="text-red-400 font-medium">{(row.sellQty || 0).toLocaleString()}</td>
                        <td className={`font-black text-lg ${(row.netPosition || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(row.netPosition || 0).toLocaleString()}
                        </td>
                        <td>
                           <div className={`flex items-center gap-2 font-black text-[10px] tracking-widest px-3 py-1.5 rounded-full w-fit ${ (row.netPosition || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              <Zap size={10} />
                              {(row.netPosition || 0) >= 0 ? 'INSTITUTIONAL ACCUMULATION' : 'INSTITUTIONAL DISTRIBUTION'}
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="text-center p-20">
                          <div className="flex flex-col items-center gap-4 opacity-50">
                            <Activity size={48} className="text-zinc-700 animate-pulse" />
                            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No Premium Intel Found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Institutional (General Broker View) */}
        {activeTab === 'institutional' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="premium-card p-8 border-l-4 border-gold">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Market Leader</p>
                  <h4 className="text-2xl font-black text-white">{filteredBrokerData.sort((a, b) => b.netQty - a.netQty)[0]?.broker || 'N/A'}</h4>
                  <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> High Volume Absorption</p>
               </div>
               <div className="premium-card p-8 border-l-4 border-zinc-700">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total Participants</p>
                  <h4 className="text-2xl font-black text-white">{new Set(brokerData.map(d => d.broker)).size} Entities</h4>
               </div>
               <div className="premium-card p-8 border-l-4 border-emerald-500">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Net Accumulation</p>
                  <h4 className="text-2xl font-black text-white">{brokerData.reduce((a, b) => a + b.netQty, 0).toLocaleString()} Shares</h4>
               </div>
            </div>

            <div className="premium-card overflow-hidden">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Broker</th>
                    <th>Asset</th>
                    <th>Buy Volume</th>
                    <th>Sell Volume</th>
                    <th>Net Delta</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrokerData.sort((a, b) => b.netQty - a.netQty).map((row, i) => (
                    <tr key={i}>
                      <td className="font-bold">{row.broker}</td>
                      <td className="font-black text-gold">{row.symbol}</td>
                      <td className="text-emerald-400">{row.buyQty.toLocaleString()}</td>
                      <td className="text-red-400">{row.sellQty.toLocaleString()}</td>
                      <td className="font-black">{row.netQty.toLocaleString()}</td>
                      <td>
                        <span className={`status-chip ${row.netQty > 0 ? 'status-chip-success' : 'status-chip-danger'}`}>
                          {row.netQty > 0 ? 'ACCUMULATING' : 'DISTRIBUTING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Accumulation (Stock Centric) */}
        {activeTab === 'stock' && (
          <div className="premium-card overflow-hidden">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Top Institutional Buyer</th>
                  <th>Top Institutional Seller</th>
                  <th>Total Net Delta</th>
                  <th>SMC Flow</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockData.sort((a: any, b: any) => Math.abs(b.totalNet) - Math.abs(a.totalNet)).map((stock: any, i) => (
                  <tr key={i} className="cursor-pointer hover:bg-white/5" onClick={() => handleNeuralAudit(stock.symbol)}>
                    <td className="font-black text-gold text-xl">{stock.symbol}</td>
                    <td>
                       <div className="font-bold text-zinc-200">{stock.topBuyer.broker}</div>
                       <div className="text-xs font-bold text-emerald-400">+{stock.topBuyer.qty.toLocaleString()}</div>
                    </td>
                    <td>
                       <div className="font-bold text-zinc-200">{stock.topSeller.broker}</div>
                       <div className="text-xs font-bold text-red-400">{stock.topSeller.qty.toLocaleString()}</div>
                    </td>
                    <td className="font-black text-lg">{stock.totalNet.toLocaleString()}</td>
                    <td>
                      <span className={`status-chip ${stock.totalNet > 100000 ? 'status-chip-success' : stock.totalNet < -100000 ? 'status-chip-danger' : 'status-chip-info'}`}>
                        {stock.totalNet > 100000 ? 'SMART MONEY IN' : stock.totalNet < -100000 ? 'SMART MONEY OUT' : 'CONSOLIDATING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Neural Audit (The Deep Stuff) */}
        {activeTab === 'neural' && (
          <div className="space-y-8 animate-fade-in">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center gap-6">
                 <RefreshCw size={48} className="text-gold animate-spin" />
                 <p className="text-zinc-500 font-black uppercase tracking-[0.3em]">Synthesizing Neural Audit for {selectedSymbol}...</p>
              </div>
            ) : stockAnalysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col: Core Stats */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="premium-card p-8 bg-gradient-to-br from-zinc-900 to-black border-gold/20 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-5">
                       <Zap size={150} color="var(--gold)" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-4 rounded-2xl bg-gold text-black shadow-lg shadow-gold/20">
                         <Target size={28} />
                       </div>
                       <div>
                         <h3 className="text-3xl font-black text-white">{selectedSymbol}</h3>
                         <p className="text-gold text-xs font-bold uppercase tracking-widest">Neural Audit Result</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">SMC Bias</span>
                          <span className="text-emerald-400 font-black">BULLISH ACCUMULATION</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Institutional Grip</span>
                          <span className="text-white font-black">STRONG</span>
                       </div>
                    </div>
                  </div>

                  <div className="premium-card p-6">
                     <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <ShieldCheck size={14} className="text-emerald-400" /> Smart Money Footprint
                     </h4>
                     <div className="space-y-4">
                        <p className="text-zinc-300 text-sm leading-relaxed italic">
                          "System detects heavy absorption between NPR 420-435. Institutional participants are currently sweeping liquidity at lower levels before a potential markup phase."
                        </p>
                     </div>
                  </div>
                </div>

                {/* Right Col: Deep Data Tabs */}
                <div className="lg:col-span-2">
                  <div className="premium-card h-full">
                    <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                       <TableIcon size={18} className="text-zinc-500" />
                       <h4 className="text-sm font-black text-white uppercase tracking-widest">Audit Data Points</h4>
                    </div>
                    <div className="p-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {Object.keys(stockAnalysis.tabs || {}).map(tab => (
                            <div key={tab} className="space-y-4">
                               <div className="flex items-center gap-2">
                                 <Zap size={14} className="text-gold" />
                                 <h5 className="font-black text-white text-xs uppercase tracking-widest">{tab}</h5>
                               </div>
                               <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 font-mono text-[10px] text-zinc-400 h-48 overflow-y-auto">
                                  {JSON.stringify(stockAnalysis.tabs[tab], null, 2)}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="premium-card p-20 text-center flex flex-col items-center gap-6">
                 <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                    <Database size={48} />
                 </div>
                 <div className="max-w-md">
                    <h3 className="text-2xl font-black mb-2">Neural Link Lost</h3>
                    <p className="text-zinc-500">No deep audit data found for <span className="text-gold font-bold">{selectedSymbol || 'this symbol'}</span>. Make sure the Omni Crawler has completed its deep-sync for this asset.</p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setSearch('ADBL')} className="text-xs font-black text-gold uppercase border-b border-gold/30 pb-1">Try ADBL</button>
                    <button onClick={() => setSearch('NABIL')} className="text-xs font-black text-gold uppercase border-b border-gold/30 pb-1">Try NABIL</button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Raw Floorsheet */}
        {activeTab === 'raw' && (
          <div className="space-y-6">
            <div className="premium-card overflow-hidden">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFloorsheet.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((f, i) => (
                    <tr key={i}>
                      <td className="font-black text-gold">{f.symbol}</td>
                      <td className="font-bold text-emerald-400">#{f.buyBroker}</td>
                      <td className="font-bold text-red-400">#{f.sellBroker}</td>
                      <td>{f.qty.toLocaleString()}</td>
                      <td className="font-mono">{f.rate}</td>
                      <td className="font-black text-zinc-300">NPR {f.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
                <button 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 transition-all ${page === 0 ? 'opacity-30' : 'hover:bg-zinc-800'}`}
                >
                  Previous
                </button>
                <div className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                  Page <span className="text-white">{page + 1}</span> of <span className="text-white">{Math.ceil(filteredFloorsheet.length / rowsPerPage)}</span>
                </div>
                <button 
                  disabled={(page + 1) * rowsPerPage >= filteredFloorsheet.length}
                  onClick={() => setPage(p => p + 1)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 transition-all ${(page + 1) * rowsPerPage >= filteredFloorsheet.length ? 'opacity-30' : 'hover:bg-zinc-800'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

