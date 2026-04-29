import React, { useState, useEffect } from 'react'
import { Star, Trash2, Bell, AlertTriangle, Search, Info, Plus, X, Edit2, CloudSync } from 'lucide-react'
import { useMarketData, useToast } from '../AppShell'
import LoadingCard from './LoadingCard'
import { auth, db } from '../lib/firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

function getStockData(symbol: string, omniData: any) {
  if (!omniData) return null
  const pages = omniData?.scrapedPages || []
  for (const page of pages) {
    for (const table of (page.tables || [])) {
      const row = table.rows?.find((r: any) => 
        (r.Symbol || r.Col_1 || r.symbol || '').toUpperCase() === symbol.toUpperCase()
      )
      if (row) {
        return {
          price: parseFloat(String(row['Current Price'] || row['Price(NPR)'] || row.LTP || row.Col_2 || '0').replace(/,/g, '')),
          change: row['Percent Change'] || row['Change'] || row['Daily Chg'] || '0%'
        }
      }
    }
  }
  return null
}

interface WatchItem {
  id: string
  symbol: string
  addedAt: string
  alertAbove: number | null
  alertBelow: number | null
  notes: string
}

export default function Watchlist() {
  const { showToast } = useToast()
  const { omniData, loading: omniLoading } = useMarketData()
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newSymbol, setNewSymbol] = useState('')
  const [editingItem, setEditingItem] = useState<WatchItem | null>(null)

  // Firestore Sync
  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'users', user.uid, 'data', 'watchlist')
    
    const init = async () => {
      try {
        const snap = await getDoc(docRef)
        let firestoreData = snap.exists() ? snap.data().items || [] : []
        
        // Migration: Check localStorage
        const local = localStorage.getItem('goxent_watchlist')
        if (local && firestoreData.length === 0) {
          firestoreData = JSON.parse(local)
          await setDoc(docRef, { items: firestoreData, lastUpdated: new Date().toISOString() })
          console.log("Watchlist migrated to Firestore.")
        }
        
        setWatchlist(firestoreData)
      } catch (err) {
        console.error("Failed to load watchlist:", err)
      } finally {
        setLoading(false)
      }
    }

    init()

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setWatchlist(doc.data().items || [])
      }
    })

    return () => unsubscribe()
  }, [])

  const saveToFirestore = async (newWatchlist: WatchItem[]) => {
    const user = auth.currentUser
    if (!user) return
    const docRef = doc(db, 'users', user.uid, 'data', 'watchlist')
    await setDoc(docRef, { items: newWatchlist, lastUpdated: new Date().toISOString() })
    setWatchlist(newWatchlist)
  }

  const addToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymbol) return
    const symbol = newSymbol.toUpperCase()
    
    if (watchlist.find(w => w.symbol === symbol)) {
      showToast(`${symbol} is already in your watchlist`, 'info')
      return
    }

    const data = getStockData(symbol, omniData)
    if (!data) {
      showToast(`Symbol ${symbol} not found in today's data — added anyway`, 'warning')
    } else {
      showToast(`Added ${symbol} to watchlist`, 'success')
    }

    const newItem: WatchItem = {
      id: Date.now().toString(),
      symbol,
      addedAt: new Date().toISOString(),
      alertAbove: null,
      alertBelow: null,
      notes: ''
    }

    await saveToFirestore([...watchlist, newItem])
    setNewSymbol('')
  }

  const removeItem = async (id: string) => {
    if (confirm('Remove from watchlist?')) {
      await saveToFirestore(watchlist.filter(w => w.id !== id))
      showToast('Removed from watchlist', 'info')
    }
  }

  const updateAlerts = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    const updated = watchlist.map(w => w.id === editingItem.id ? editingItem : w)
    await saveToFirestore(updated)
    setEditingItem(null)
    showToast(`Alerts updated for ${editingItem.symbol}`, 'success')
  }

  if (loading || omniLoading) return <LoadingCard rows={8} cols={5} />

  const itemsWithData = watchlist.map(w => {
    const data = getStockData(w.symbol, omniData)
    const isTriggeredAbove = w.alertAbove && data && data.price > w.alertAbove
    const isTriggeredBelow = w.alertBelow && data && data.price < w.alertBelow
    return { ...w, data, isTriggeredAbove, isTriggeredBelow }
  })

  const triggeredCount = itemsWithData.filter(i => i.isTriggeredAbove || i.isTriggeredBelow).length

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Watchlist</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor potential entries & price alerts.</p>
            <span className="status-chip status-chip-success">
              <CloudSync size={12} /> Live Sync
            </span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {triggeredCount > 0 && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-6 animate-pulse">
          <div className="p-3 rounded-full bg-red-500/20">
            <Bell size={24} color="var(--danger-color)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 900, color: 'var(--danger-color)', fontSize: 16, margin: 0 }}>{triggeredCount} Threshold Alerts Triggered</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {itemsWithData.filter(i => i.isTriggeredAbove || i.isTriggeredBelow).map(i => (
                <span key={i.id} className="status-chip status-chip-danger" style={{ fontSize: 11 }}>
                  {i.symbol}: {i.isTriggeredAbove ? `>${i.alertAbove}` : `<${i.alertBelow}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search/Add Bar */}
      <form onSubmit={addToWatchlist} className="flex gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search symbol to monitor (e.g. UPPER, HDL)..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            style={{ paddingLeft: 48, borderRadius: 16 }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', borderRadius: 16 }}>
          <Plus size={20} /> Add to Radar
        </button>
      </form>

      {/* Watchlist Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Monitored Assets</h3>
          <div className="flex gap-4">
             <div className="status-chip status-chip-info">Price Monitoring Active</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Current Price</th>
                <th>24h Change</th>
                <th>Upper Alert</th>
                <th>Lower Alert</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsWithData.map((w) => {
                const isUp = w.data?.change.startsWith('+') || !w.data?.change.startsWith('-')
                const isAlert = w.isTriggeredAbove || w.isTriggeredBelow
                const status = w.isTriggeredAbove ? 'Ceiling Broken' : w.isTriggeredBelow ? 'Floor Broken' : 'Watching'

                return (
                  <tr key={w.id} style={{ background: isAlert ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 900, color: 'var(--gold)', fontSize: 15 }}>{w.symbol}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Radar active since {new Date(w.addedAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ fontWeight: 800 }}>{w.data?.price ? `NPR ${w.data.price.toLocaleString()}` : '—'}</td>
                    <td style={{ color: isUp ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 900 }}>
                       {w.data?.change || '—'}
                    </td>
                    <td>{w.alertAbove ? `NPR ${w.alertAbove}` : '—'}</td>
                    <td>{w.alertBelow ? `NPR ${w.alertBelow}` : '—'}</td>
                    <td>
                      <span className={`status-chip ${isAlert ? 'status-chip-danger' : 'status-chip-info'}`}>
                        {isAlert ? <AlertTriangle size={10} /> : <Star size={10} />}
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingItem(w)} className="btn" style={{ padding: 6 }}><Edit2 size={14} /></button>
                        <button onClick={() => removeItem(w.id)} className="btn" style={{ padding: 6, color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 64, textAlign: 'center' }}>
                    <div style={{ opacity: 0.3, marginBottom: 12 }}><Star size={48} style={{ margin: '0 auto' }} /></div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Your radar is clear. Add a symbol to start monitoring price actions.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Alerts Modal */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)' }}>
          <form onSubmit={updateAlerts} className="premium-card animate-fade-in" style={{ width: 420, position: 'relative', border: '1px solid var(--gold)', padding: 40 }}>
            <button type="button" onClick={() => setEditingItem(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Threshold Alerts</h3>
            <p style={{ color: 'var(--gold)', fontWeight: 900, marginBottom: 32, fontSize: 18 }}>{editingItem.symbol}</p>
            
            <div className="space-y-6">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Upper Threshold (Sell Target)</label>
                <input type="number" step="0.01" value={editingItem.alertAbove || ''} onChange={(e) => setEditingItem({...editingItem, alertAbove: e.target.value ? parseFloat(e.target.value) : null})} placeholder="Notify if price exceeds..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Lower Threshold (Buy Zone)</label>
                <input type="number" step="0.01" value={editingItem.alertBelow || ''} onChange={(e) => setEditingItem({...editingItem, alertBelow: e.target.value ? parseFloat(e.target.value) : null})} placeholder="Notify if price falls below..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Strategy Notes</label>
                <textarea value={editingItem.notes} onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})} placeholder="Entry/Exit rationale..." style={{ height: 80, resize: 'none' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 12 }}>
                Save Radar Thresholds
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
