import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, Briefcase, PieChart, Info, X, CloudSync } from 'lucide-react'
import { useMarketData, useToast } from '../AppShell'
import LoadingCard from './LoadingCard'
import { auth, db } from '../lib/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

function getCurrentPrice(symbol: string, omniData: any) {
  if (!omniData) return null
  const pages = omniData?.scrapedPages || []
  for (const page of pages) {
    for (const table of (page.tables || [])) {
      const row = table.rows?.find((r: any) => 
        (r.Symbol || r.Col_1 || r.symbol || '').toUpperCase() === symbol.toUpperCase()
      )
      if (row) {
        const price = parseFloat(String(row['Current Price'] || row['Price(NPR)'] || row.LTP || row.Col_2 || '0').replace(/,/g, ''))
        if (price > 0) return price
      }
    }
  }
  return null
}

interface Holding {
  id: string
  symbol: string
  quantity: number
  avgBuyPrice: number
  buyDate: string
  notes: string
}

export default function PortfolioTracker() {
  const { showToast } = useToast()
  const { omniData, loading: omniLoading } = useMarketData()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  // Firestore Sync
  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'users', user.uid, 'data', 'portfolio')
    
    const init = async () => {
      try {
        const snap = await getDoc(docRef)
        let firestoreData = snap.exists() ? snap.data().holdings || [] : []
        
        // Migration: Check localStorage
        const local = localStorage.getItem('goxent_portfolio')
        if (local && firestoreData.length === 0) {
          firestoreData = JSON.parse(local)
          await setDoc(docRef, { holdings: firestoreData, lastUpdated: new Date().toISOString() })
          console.log("Portfolio migrated to Firestore.")
        }
        
        setHoldings(firestoreData)
      } catch (err) {
        console.error("Failed to load portfolio:", err)
      } finally {
        setLoading(false)
      }
    }

    init()

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setHoldings(doc.data().holdings || [])
      }
    })

    return () => unsubscribe()
  }, [])

  const saveToFirestore = async (newHoldings: Holding[]) => {
    const user = auth.currentUser
    if (!user) return
    const docRef = doc(db, 'users', user.uid, 'data', 'portfolio')
    await setDoc(docRef, { holdings: newHoldings, lastUpdated: new Date().toISOString() })
    setHoldings(newHoldings)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol || !quantity || !price) return

    const newHolding: Holding = {
      id: editingId || Date.now().toString(),
      symbol: symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      avgBuyPrice: parseFloat(price),
      buyDate: date,
      notes
    }

    let updated: Holding[]
    if (editingId) {
      updated = holdings.map(h => h.id === editingId ? newHolding : h)
      showToast(`Updated ${symbol} in portfolio`, 'success')
    } else {
      updated = [...holdings, newHolding]
      showToast(`Added ${symbol} to portfolio`, 'success')
    }

    await saveToFirestore(updated)
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setSymbol('')
    setQuantity('')
    setPrice('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setEditingId(null)
  }

  const deleteHolding = async (id: string) => {
    if (confirm('Are you sure you want to delete this holding?')) {
      await saveToFirestore(holdings.filter(h => h.id !== id))
      showToast('Holding deleted', 'info')
    }
  }

  const editHolding = (h: Holding) => {
    setSymbol(h.symbol)
    setQuantity(h.quantity.toString())
    setPrice(h.avgBuyPrice.toString())
    setDate(h.buyDate)
    setNotes(h.notes)
    setEditingId(h.id)
    setShowModal(true)
  }

  if (loading || omniLoading) return <LoadingCard rows={5} cols={6} />

  // Calculations
  const processedHoldings = holdings.map(h => {
    const currentPrice = getCurrentPrice(h.symbol, omniData) || h.avgBuyPrice
    const investedValue = h.quantity * h.avgBuyPrice
    const currentValue = h.quantity * currentPrice
    const pnl = currentValue - investedValue
    const pnlPct = (pnl / (investedValue || 1)) * 100
    return { ...h, currentPrice, investedValue, currentValue, pnl, pnlPct }
  })

  const totalInvested = processedHoldings.reduce((acc, h) => acc + h.investedValue, 0)
  const totalCurrentValue = processedHoldings.reduce((acc, h) => acc + h.currentValue, 0)
  const totalPnl = totalCurrentValue - totalInvested
  const totalPnlPct = (totalPnl / (totalInvested || 1)) * 100

  // Pie Chart Data
  const totalVal = totalCurrentValue || 1
  const pieData = processedHoldings.map((h, i) => ({
    symbol: h.symbol,
    percent: (h.currentValue / totalVal) * 100,
    color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`
  }))

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Portfolio Tracker</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Private wealth & equity monitoring.</p>
            <span className="status-chip status-chip-success">
              <CloudSync size={12} /> Cloud Encrypted
            </span>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary"
          style={{ padding: '12px 24px', borderRadius: 14 }}
        >
          <Plus size={18} /> Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Total Invested</p>
          <p style={{ fontSize: 28, fontWeight: 900 }}>NPR {totalInvested.toLocaleString()}</p>
        </div>
        <div className="premium-card">
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Market Value</p>
          <p style={{ fontSize: 28, fontWeight: 900 }}>NPR {totalCurrentValue.toLocaleString()}</p>
        </div>
        <div className="premium-card">
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Net P&L</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: totalPnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString()}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: totalPnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)', opacity: 0.8 }}>
              ({totalPnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="premium-card">
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Active Holdings</p>
          <p style={{ fontSize: 28, fontWeight: 900 }}>{holdings.length}</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Equity Positions</h3>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>LIVE LTP SYNC</div>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Buy</th>
                <th>LTP</th>
                <th>Invested</th>
                <th>Current</th>
                <th>Profit/Loss</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedHoldings.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 900, color: 'var(--gold)' }}>{h.symbol}</td>
                  <td>{h.quantity}</td>
                  <td>{h.avgBuyPrice.toLocaleString()}</td>
                  <td>{h.currentPrice.toLocaleString()}</td>
                  <td style={{ fontSize: 13, opacity: 0.8 }}>{h.investedValue.toLocaleString()}</td>
                  <td style={{ fontSize: 13, fontWeight: 700 }}>{h.currentValue.toLocaleString()}</td>
                  <td style={{ color: h.pnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 900 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {h.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {h.pnl.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{h.pnlPct.toFixed(2)}%</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => editHolding(h)} className="btn" style={{ padding: 6 }}><Edit2 size={14} /></button>
                      <button onClick={() => deleteHolding(h.id)} className="btn" style={{ padding: 6, color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {holdings.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 64, textAlign: 'center' }}>
                    <div style={{ opacity: 0.4, marginBottom: 12 }}><Briefcase size={48} style={{ margin: '0 auto' }} /></div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Your portfolio is empty.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation & Insight */}
      {holdings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
          <div className="premium-card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color="var(--gold)" /> Allocation
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <svg viewBox="0 0 100 100" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
                {pieData.reduce((acc: { offset: number, elements: JSX.Element[] }, slice) => {
                  const strokeDasharray = `${slice.percent} ${100 - slice.percent}`
                  const strokeDashoffset = -acc.offset
                  acc.elements.push(
                    <circle
                      key={slice.symbol}
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="15"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )
                  acc.offset += slice.percent
                  return acc
                }, { offset: 0, elements: [] }).elements}
              </svg>
            </div>
            <div className="space-y-2">
              {pieData.slice(0, 5).map(slice => (
                <div key={slice.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: slice.color }} />
                    <span style={{ fontWeight: 800 }}>{slice.symbol}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{slice.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="premium-card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={18} color="var(--gold)" /> Intelligence Report
            </h3>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-4">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Portfolio concentration is currently high in <strong className="text-white">{pieData.sort((a, b) => b.percent - a.percent)[0]?.symbol}</strong>. 
                {totalPnl > 0 
                  ? " Your tactical positions are showing strong momentum. Consider harvesting partial profits if RSI levels across your top holdings exceed 70." 
                  : " Current market volatility has impacted your net valuation. Recommend performing a deep-dive in the AI Research tab for your laggard positions."}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-1">
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--success-color)', textTransform: 'uppercase', marginBottom: 4 }}>Top Performer</span>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{processedHoldings.sort((a, b) => b.pnlPct - a.pnlPct)[0]?.symbol}</span>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex-1">
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--danger-color)', textTransform: 'uppercase', marginBottom: 4 }}>Laggard</span>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{processedHoldings.sort((a, b) => a.pnlPct - b.pnlPct)[0]?.symbol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)' }}>
          <form onSubmit={handleSubmit} className="premium-card animate-fade-in" style={{ width: 450, position: 'relative', border: '1px solid var(--gold)', padding: 40 }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>{editingId ? 'Edit' : 'Add'} Position</h3>
            
            <div className="space-y-5">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Symbol</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="e.g. NABIL" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Avg Buy Price</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Entry Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rationale for entry..." style={{ height: 80, resize: 'none' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 12, marginTop: 12 }}>
                {editingId ? 'Update Intelligence' : 'Deploy Capital'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
