import { TrendingUp, TrendingDown, BarChart3, Clock, RefreshCw, Copy, ExternalLink, X, CheckCircle2, ChevronUp, ChevronDown, Activity, Info } from 'lucide-react'
import omniData from '../data/market-omni-data.json'
import React, { useState } from 'react'
import { useToast } from '../AppShell'

function parseMarketData(omniData: any) {
  const pages = omniData?.scrapedPages || []
  
  // Find the EOD Summary page
  const eodPage = pages.find((p: any) => 
    p.title?.includes('EOD') || p.title?.includes('Summary') || 
    p.url?.includes('daily-summary')
  )
  
  const tables = eodPage?.tables || []
  
  // Parse key-value rows (Col_0 = label, Col_1 = value)
  const kvData: Record<string, string> = {}
  tables.forEach((t: any) => {
    t.rows?.forEach((row: any) => {
      if (row.Col_0 && row.Col_1) {
        kvData[row.Col_0] = row.Col_1
      }
    })
  })

  // Also check Table 2 for Advances/Declines if not in KV
  const sectorTable = tables.find((t: any) => t.headers?.includes('+Ve Stocks'))
  let advances = parseInt(kvData['Advances']) || 0
  let declines = parseInt(kvData['Declines']) || 0
  let unchanged = parseInt(kvData['Unchanged']) || 0

  if (sectorTable && advances === 0) {
    sectorTable.rows.forEach((r: any) => {
      advances += parseInt(r['+Ve Stocks']) || 0
      declines += parseInt(r['-Ve Stocks']) || 0
    })
  }
  
  // Find stocks page for gainers/losers
  const stocksPage = pages.find((p: any) => 
    p.url?.includes('top-stocks') || p.title?.includes('Stock') || p.title?.includes('Home')
  )
  
  return {
    index: kvData['Current'] || 'N/A',
    date: kvData['Date'] || 'N/A',
    dailyGain: kvData['Daily Gain'] || '0.0%',
    turnover: kvData['Turnover'] || 'N/A',
    totalTurnover: kvData['Total Turnover'] || kvData['Turnover'] || 'N/A',
    advances: advances || '0',
    declines: declines || '0',
    unchanged: unchanged || '0',
    lastUpdated: omniData?.timestamp || null,
    stocksPage: stocksPage?.tables?.[0]?.rows || []
  }
}

function getAllPageData(omniData: any) {
  return (omniData?.scrapedPages || []).map((p: any) => ({
    title: p.title,
    url: p.url,
    rowCount: p.tables?.reduce((acc: number, t: any) => acc + (t.rows?.length || 0), 0) || 0
  }))
}

export default function MarketOverview() {
  const { showToast } = useToast()
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const data = parseMarketData(omniData)
  const sources = getAllPageData(omniData)
  
  const isPositive = !data.dailyGain.startsWith('-')
  const lastUpdatedDate = data.lastUpdated ? new Date(data.lastUpdated) : null
  const isStale = lastUpdatedDate ? (Date.now() - lastUpdatedDate.getTime() > 24 * 60 * 60 * 1000) : true

  const copyCommand = () => {
    navigator.clipboard.writeText('npm run full-sync')
    setCopied(true)
    showToast("Command copied to clipboard!", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Market Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Live intelligence from NEPSE Intelligence Pipeline</p>
        </div>
        <button 
          onClick={() => setShowSyncModal(true)}
          className="btn"
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw size={16} /> Sync Dashboard
        </button>
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(12px)'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: 450, position: 'relative', border: '1px solid var(--gold)', padding: 32 }}>
            <button 
              onClick={() => setShowSyncModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
              }}>
                <RefreshCw size={40} className="text-gold" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Sync Now</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                Trigger the Omni-Crawler to scrape Sasto Share and update all dashboard analytics.
              </p>
            </div>

            <div style={{ background: '#0a0a0a', padding: 20, borderRadius: 12, marginBottom: 32, border: '1px solid var(--border)', position: 'relative' }}>
              <code style={{ color: 'var(--gold)', fontSize: 15, fontFamily: 'monospace', fontWeight: 600 }}>npm run full-sync</code>
              <button 
                onClick={copyCommand}
                style={{ 
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--gold)', border: 'none', padding: '8px 16px',
                  borderRadius: 6, color: 'black', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => setShowSyncModal(false)}
              className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}
            >
              Close instructions
            </button>
          </div>
        </div>
      )}

      {/* Section 1 — Hero stats bar */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>NEPSE Index</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>{data.index}</span>
            <span style={{ 
              fontSize: 16, fontWeight: 700, color: isPositive ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {data.dailyGain}
            </span>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Turnover</p>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{data.totalTurnover.replace('NPR.', 'NPR ')}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Market Date</p>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{data.date}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Market Breadth</p>
          <div style={{ display: 'flex', gap: 4, height: 24, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ flex: data.advances, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{data.advances}</div>
            <div style={{ flex: data.unchanged, background: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{data.unchanged}</div>
            <div style={{ flex: data.declines, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{data.declines}</div>
          </div>
        </div>
      </div>

      {/* Section 2 — Last synced banner */}
      <div style={{ 
        padding: '12px 20px', borderRadius: 12, 
        background: isStale ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        border: `1px solid ${isStale ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <Info size={16} color={isStale ? 'var(--gold)' : 'var(--green)'} />
          <span>
            Data from: <strong style={{ color: isStale ? 'var(--gold)' : 'var(--green)' }}>{data.date}</strong>
            {isStale && <span style={{ marginLeft: 8 }}>(Stale - Market has moved)</span>}
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Run <code>npm run full-sync</code> to refresh
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Section 3 — Top Stocks table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Top Moving Stocks</h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Last 100 sessions</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>SYMBOL</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>PRICE</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>CHANGE%</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-secondary)' }}>VOLUME</th>
                </tr>
              </thead>
              <tbody>
                {data.stocksPage.slice(0, 20).map((stock: any, i: number) => {
                  const symbol = stock.Symbol || stock.Col_1 || 'N/A'
                  const price = stock['Current Price'] || stock['Price(NPR)'] || '0'
                  const change = stock['Percent Change'] || stock['Change'] || '0%'
                  const volume = stock['Volume'] || '0'
                  const isUp = !change.startsWith('-')
                  
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 24px', fontWeight: 700 }}>{symbol}</td>
                      <td style={{ padding: '12px 24px' }}>{price}</td>
                      <td style={{ padding: '12px 24px', color: isUp ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {change}
                      </td>
                      <td style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: 13 }}>{volume}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 4 — Quick Stats cards */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <Activity size={20} style={{ margin: '0 auto 8px', color: 'var(--gold)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Sentiment</p>
              <p style={{ fontWeight: 800, color: parseInt(data.advances as string) > parseInt(data.declines as string) ? 'var(--green)' : 'var(--red)' }}>
                {parseInt(data.advances as string) > parseInt(data.declines as string) ? 'BULLISH' : 'BEARISH'}
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Active Stocks</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{data.stocksPage.length}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Breadth Ratio</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{(parseInt(data.advances as string) / (parseInt(data.declines as string) || 1)).toFixed(2)}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Top Turnover</p>
              <p style={{ fontSize: 14, fontWeight: 800 }}>{data.stocksPage[0]?.Symbol || 'N/A'}</p>
            </div>
          </div>

          {/* Section 5 — Data Sources */}
          <div className="card">
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={14} /> Intelligence Sources
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sources.map((source: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{source.title}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 10 }}>{source.rowCount} rows</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Terminal } from 'lucide-react'
