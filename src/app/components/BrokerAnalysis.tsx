import React, { useState } from 'react'
import { Search, Database, TrendingUp, TrendingDown, LayoutGrid, List, Table as TableIcon, ChevronRight, Info } from 'lucide-react'
import omniData from '../data/market-omni-data.json'

function parseBrokerData(omniData: any) {
  const pages = omniData?.scrapedPages || []
  const brokerPages = pages.filter((p: any) => 
    p.url?.toLowerCase().includes('broker') || p.title?.toLowerCase().includes('broker')
  )
  
  const allData: any[] = []
  brokerPages.forEach((p: any) => {
    p.tables?.forEach((t: any) => {
      t.rows?.forEach((row: any) => {
        // Map common broker analysis headers
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
  
  return transactions.slice(0, 200) // Limit to top 200 for performance
}

export default function BrokerAnalysis() {
  const [activeTab, setActiveTab] = useState<'broker' | 'stock' | 'raw'>('broker')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 20

  const brokerData = parseBrokerData(omniData)
  const floorsheetData = parseFloorsheet(omniData)

  const isEmpty = brokerData.length === 0 && floorsheetData.length === 0

  if (isEmpty) {
    return (
      <div className="card" style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--border)' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
        }}>
          <Database size={40} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>No broker data synced yet</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
          The local data lake is empty for this session. Run the Omni Crawler to fetch today's floorsheet and broker metrics.
        </p>
        <div style={{ background: 'black', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 12, border: '1px solid var(--border)' }}>
          <code style={{ color: 'var(--gold)', fontWeight: 600 }}>npm run omni-sync</code>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          This requires your Sasto Share premium login credentials in the .env file.
        </p>
      </div>
    )
  }

  // Filter logic
  const filteredBrokerData = brokerData.filter(d => 
    d.symbol.toLowerCase().includes(search.toLowerCase()) || 
    d.broker.toLowerCase().includes(search.toLowerCase())
  )

  // Aggregate by Stock for Tab 2
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Broker Analysis</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Deep dive into Smart Money movements and floorsheet anomalies.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 12, padding: 4 }}>
          <button 
            onClick={() => setActiveTab('broker')}
            style={{ 
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === 'broker' ? 'var(--gold)' : 'transparent',
              color: activeTab === 'broker' ? 'black' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <LayoutGrid size={14} /> Broker Accumulation
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            style={{ 
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === 'stock' ? 'var(--gold)' : 'transparent',
              color: activeTab === 'stock' ? 'black' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <TrendingUp size={14} /> Stock Accumulation
          </button>
          <button 
            onClick={() => setActiveTab('raw')}
            style={{ 
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === 'raw' ? 'var(--gold)' : 'transparent',
              color: activeTab === 'raw' ? 'black' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <List size={14} /> Raw Floorsheet
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search by stock symbol or broker name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', padding: '14px 14px 14px 48px', borderRadius: 12, 
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'white', fontSize: 15
          }}
        />
      </div>

      {activeTab === 'broker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary Card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--gold)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={24} color="var(--gold)" />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Top Accumulating Broker</p>
              <p style={{ fontSize: 18, fontWeight: 800 }}>{filteredBrokerData.sort((a, b) => b.netQty - a.netQty)[0]?.broker || 'N/A'}</p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>BROKER</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SYMBOL</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>BUY QTY</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SELL QTY</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>NET POSITION</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SENTIMENT</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrokerData.sort((a, b) => b.netQty - a.netQty).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>{row.broker}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--gold)', fontWeight: 800 }}>{row.symbol}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--green)' }}>{row.buyQty.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--red)' }}>{row.sellQty.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>{row.netQty.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800,
                        background: row.netQty > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: row.netQty > 0 ? 'var(--green)' : 'var(--red)'
                      }}>
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

      {activeTab === 'stock' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SYMBOL</th>
                <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>TOP BUYER</th>
                <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>TOP SELLER</th>
                <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>NET BROKER BUY</th>
                <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SIGNAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredStockData.map((stock: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--gold)' }}>{stock.symbol}</td>
                  <td style={{ padding: '16px 24px' }}>{stock.topBuyer.broker} <span style={{ fontSize: 10, color: 'var(--green)' }}>(+{stock.topBuyer.qty.toLocaleString()})</span></td>
                  <td style={{ padding: '16px 24px' }}>{stock.topSeller.broker} <span style={{ fontSize: 10, color: 'var(--red)' }}>({stock.topSeller.qty.toLocaleString()})</span></td>
                  <td style={{ padding: '16px 24px', fontWeight: 700 }}>{stock.totalNet.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800,
                      background: stock.totalNet > 100000 ? 'rgba(16,185,129,0.2)' : stock.totalNet < -100000 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                      color: stock.totalNet > 100000 ? 'var(--green)' : stock.totalNet < -100000 ? 'var(--red)' : 'var(--text-secondary)'
                    }}>
                      {stock.totalNet > 100000 ? 'SMART MONEY IN' : stock.totalNet < -100000 ? 'SMART MONEY OUT' : 'NEUTRAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'raw' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SYMBOL</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>BUYER</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SELLER</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>QTY</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>RATE</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {filteredFloorsheet.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>{f.symbol}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--green)' }}>{f.buyBroker}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--red)' }}>{f.sellBroker}</td>
                    <td style={{ padding: '16px 24px' }}>{f.qty.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px' }}>{f.rate}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{f.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 20 }}>
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn" style={{ opacity: page === 0 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
              Page {page + 1} of {Math.ceil(filteredFloorsheet.length / rowsPerPage)}
            </span>
            <button 
              disabled={(page + 1) * rowsPerPage >= filteredFloorsheet.length}
              onClick={() => setPage(p => p + 1)}
              className="btn" style={{ opacity: (page + 1) * rowsPerPage >= filteredFloorsheet.length ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { Crown, Terminal } from 'lucide-react'
