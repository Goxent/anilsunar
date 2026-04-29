import React, { useState } from 'react'
import { Search, Database, TrendingUp, TrendingDown, LayoutGrid, List, Table as TableIcon, ChevronRight, Info, Crown, Terminal, CloudSync, Zap, Filter, BarChart3, PieChart } from 'lucide-react'
import { useMarketData } from '../AppShell'
import LoadingCard from './LoadingCard'
import sastoData from '../data/super_intelligence.json'

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

export default function BrokerAnalysis() {
  const { omniData, loading } = useMarketData()
  const [activeTab, setActiveTab] = useState<'broker' | 'stock' | 'raw' | 'sasto'>('sasto')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 20

  if (loading || !omniData) return <LoadingCard rows={10} cols={6} />

  const brokerData = parseBrokerData(omniData)
  const floorsheetData = parseFloorsheet(omniData)
  const isEmpty = brokerData.length === 0 && floorsheetData.length === 0

  if (isEmpty) {
    return (
      <div className="premium-card flex flex-col items-center justify-center p-20 text-center space-y-6">
        <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
           <Database size={48} />
        </div>
        <div className="max-w-md">
          <h3 className="text-2xl font-black mb-2">Ocean of Data Missing</h3>
          <p className="text-zinc-500">The local data lake is currently empty for broker analytics. Deploy the Omni Crawler to harvest floorsheet and institutional metrics.</p>
        </div>
        <div className="p-4 bg-black border border-zinc-800 rounded-xl font-mono text-gold text-sm">
           npm run omni-sync
        </div>
        <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Requires Sasto Premium Credentials</p>
      </div>
    )
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Broker Analytics</h2>
          <div className="flex items-center gap-3 mt-4">
            <p className="text-zinc-500 text-sm">Tracking institutional footprints and Smart Money movements.</p>
            <div className="status-chip status-chip-success">
               <CloudSync size={12} /> Live Flow
            </div>
          </div>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'sasto', label: 'Alpha Intel', icon: Zap },
            { id: 'broker', label: 'Institutional', icon: LayoutGrid },
            { id: 'stock', label: 'Accumulation', icon: TrendingUp },
            { id: 'raw', label: 'Floorsheet', icon: List }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-zinc-500 hover:text-white'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Filter by institutional entity or asset symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-gold/50 transition-all text-lg"
        />
      </div>

      {activeTab === 'sasto' && (
        <div className="space-y-6 animate-fade-in">
          <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <Crown size={20} color="var(--gold)" />
                 <h3 className="text-lg font-black tracking-tight">Sasto Premium Intelligence</h3>
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Refreshed: {sastoData.updatedAt || 'N/A'}</span>
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
                    <th>Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {sastoData.brokerData.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="font-bold">{row.broker}</td>
                      <td className="font-black text-gold">{row.symbol}</td>
                      <td className="text-emerald-400">{(row.buyQty || 0).toLocaleString()}</td>
                      <td className="text-red-400">{(row.sellQty || 0).toLocaleString()}</td>
                      <td className={`font-black ${(row.netPosition || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(row.netPosition || 0).toLocaleString()}
                      </td>
                      <td>
                         <span className={`status-chip ${(row.netPosition || 0) >= 0 ? 'status-chip-success' : 'status-chip-danger'}`}>
                            {(row.netPosition || 0) >= 0 ? 'BULLISH' : 'BEARISH'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broker' && (
        <div className="space-y-6 animate-fade-in">
          <div className="premium-card flex items-center gap-6 p-6 border-l-4 border-gold bg-gold/5">
             <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20">
                <BarChart3 size={32} color="var(--gold)" />
             </div>
             <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Top Accumulating Entity</p>
                <h3 className="text-2xl font-black text-white">{filteredBrokerData.sort((a, b) => b.netQty - a.netQty)[0]?.broker || 'N/A'}</h3>
             </div>
          </div>

          <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Broker</th>
                    <th>Symbol</th>
                    <th>Buy Volume</th>
                    <th>Sell Volume</th>
                    <th>Net Delta</th>
                    <th>Strategic Status</th>
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
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="premium-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Institutional Buyer</th>
                  <th>Institutional Seller</th>
                  <th>Total Net Delta</th>
                  <th>Smart Money Flow</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockData.map((stock: any, i) => (
                  <tr key={i}>
                    <td className="font-black text-gold text-lg">{stock.symbol}</td>
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
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="space-y-6 animate-fade-in">
          <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Quantity</th>
                    <th>Avg Rate</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFloorsheet.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((f, i) => (
                    <tr key={i}>
                      <td className="font-black text-gold">{f.symbol}</td>
                      <td className="font-bold text-emerald-400">{f.buyBroker}</td>
                      <td className="font-bold text-red-400">{f.sellBroker}</td>
                      <td>{f.qty.toLocaleString()}</td>
                      <td className="font-mono">{f.rate}</td>
                      <td className="font-black">NPR {f.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
              <button 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className={`btn px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
              >
                Previous
              </button>
              <div className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                Page <span className="text-white">{page + 1}</span> of <span className="text-white">{Math.ceil(filteredFloorsheet.length / rowsPerPage)}</span>
              </div>
              <button 
                disabled={(page + 1) * rowsPerPage >= filteredFloorsheet.length}
                onClick={() => setPage(p => p + 1)}
                className={`btn px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${(page + 1) * rowsPerPage >= filteredFloorsheet.length ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
