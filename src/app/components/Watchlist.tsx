import { useState, useEffect } from 'react'
import { Plus, Trash2, Star, AlertTriangle, ExternalLink } from 'lucide-react'
import omniData from '../data/market-omni-data.json'

interface WatchItem {
  id: string; symbol: string; addedAt: string
  alertAbove: number | null; alertBelow: number | null; notes: string
}

function getLTP(symbol: string): number | null {
  const stocks = (omniData as any)?.structured?.topStocks || []
  const found = stocks.find((s: any) => s.symbol?.toUpperCase() === symbol.toUpperCase())
  return found?.ltp || null
}

const KEY = 'goxent_watchlist'
const load = (): WatchItem[] => { try { return JSON.parse(localStorage.getItem(KEY)||'[]') } catch { return [] } }
const save = (items: WatchItem[]) => localStorage.setItem(KEY, JSON.stringify(items))
const uid = () => Math.random().toString(36).slice(2,9)

export default function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>(load)
  const [symbol, setSymbol] = useState('')
  const [expandId, setExpandId] = useState<string|null>(null)
  const [editForm, setEditForm] = useState({ alertAbove:'', alertBelow:'', notes:'' })

  useEffect(() => { save(items) }, [items])

  const addItem = () => {
    if (!symbol.trim()) return
    setItems(prev => [...prev, {
      id: uid(), symbol: symbol.toUpperCase(),
      addedAt: new Date().toISOString(),
      alertAbove: null, alertBelow: null, notes: ''
    }])
    setSymbol('')
  }

  const saveEdit = (id: string) => {
    setItems(prev => prev.map(x => x.id!==id ? x : {
      ...x,
      alertAbove: editForm.alertAbove ? parseFloat(editForm.alertAbove) : null,
      alertBelow: editForm.alertBelow ? parseFloat(editForm.alertBelow) : null,
      notes: editForm.notes
    }))
    setExpandId(null)
  }

  const rows = items.map(item => {
    const ltp = getLTP(item.symbol)
    const aboveAlert = item.alertAbove && ltp && ltp > item.alertAbove
    const belowAlert = item.alertBelow && ltp && ltp < item.alertBelow
    const status = aboveAlert ? '🔴 Above Target' : belowAlert ? '🔴 Below Stop' : '👁 Watching'
    const statusColor = (aboveAlert||belowAlert) ? '#ef4444' : '#94a3b8'
    return { ...item, ltp, status, statusColor, hasAlert: aboveAlert||belowAlert }
  })

  const triggered = rows.filter(r => r.hasAlert)

  return (
    <div style={{ padding:24, maxWidth:900 }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'0.3em',color:'var(--gold)',margin:'0 0 6px' }}>NEPSE ANALYSIS</p>
        <h2 style={{ fontSize:28,fontWeight:800,color:'white',margin:'0 0 4px' }}>Watchlist</h2>
        <p style={{ color:'var(--text-secondary)',fontSize:14,margin:0 }}>
          Monitor stocks and set price alerts
        </p>
      </div>

      {/* ALERTS BANNER */}
      {triggered.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:10,padding:'12px 16px',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
            <AlertTriangle size={16} color="#ef4444"/>
            <span style={{ color:'#ef4444',fontWeight:700,fontSize:13 }}>
              {triggered.length} Price Alert{triggered.length!==1?'s':''} Triggered
            </span>
          </div>
          {triggered.map(r => (
            <div key={r.id} style={{ color:'#fca5a5',fontSize:12,marginLeft:24 }}>
              • {r.symbol}: LTP {r.ltp} — {r.status}
            </div>
          ))}
        </div>
      )}

      {/* ADD FORM */}
      <div style={{ display:'flex',gap:10,marginBottom:20 }}>
        <input
          value={symbol}
          onChange={e=>setSymbol(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==='Enter'&&addItem()}
          placeholder="Type stock symbol e.g. NABIL"
          style={{ flex:1,background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
            padding:'10px 14px',color:'white',fontSize:13,outline:'none' }}
        />
        <button onClick={addItem}
          style={{ background:'var(--gold)',color:'black',border:'none',
            borderRadius:8,padding:'10px 20px',cursor:'pointer',
            fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6 }}>
          <Plus size={14}/> Add
        </button>
      </div>

      {/* WATCHLIST TABLE */}
      {items.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--text-secondary)' }}>
          <Star size={40} style={{ marginBottom:12,opacity:0.3 }}/>
          <p style={{ fontSize:16,fontWeight:600,color:'#64748b',margin:'0 0 8px' }}>
            Watchlist is empty
          </p>
          <p style={{ fontSize:13,margin:0 }}>Add stocks to monitor their price</p>
        </div>
      ) : (
        <div>
          {rows.map(item => (
            <div key={item.id} style={{ background:'rgba(255,255,255,0.02)',
              border:`1px solid ${item.hasAlert?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.06)'}`,
              borderRadius:12,padding:'14px 20px',marginBottom:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:16 }}>
                <span style={{ color:'#f59e0b',fontWeight:800,fontSize:16,minWidth:80 }}>
                  {item.symbol}
                </span>
                <span style={{ color:'white',fontWeight:600,fontSize:15,minWidth:80 }}>
                  {item.ltp ? `NPR ${item.ltp.toLocaleString()}` : '—'}
                </span>
                <span style={{ color:item.statusColor,fontSize:12,fontWeight:600 }}>
                  {item.status}
                </span>
                <span style={{ color:'var(--text-secondary)',fontSize:11,marginLeft:'auto' }}>
                  {item.alertAbove ? `↑ ${item.alertAbove}` : ''}
                  {item.alertAbove && item.alertBelow ? ' · ' : ''}
                  {item.alertBelow ? `↓ ${item.alertBelow}` : ''}
                </span>
                <button onClick={() => {
                  setExpandId(expandId===item.id?null:item.id)
                  setEditForm({ alertAbove:String(item.alertAbove||''),
                    alertBelow:String(item.alertBelow||''), notes:item.notes })
                }}
                  style={{ background:'rgba(255,255,255,0.05)',border:'none',
                    borderRadius:6,padding:'4px 10px',cursor:'pointer',
                    color:'#94a3b8',fontSize:11 }}>
                  Set Alert
                </button>
                <button onClick={()=>setItems(prev=>prev.filter(x=>x.id!==item.id))}
                  style={{ background:'rgba(239,68,68,0.1)',border:'none',
                    borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#ef4444' }}>
                  <Trash2 size={12}/>
                </button>
              </div>

              {expandId===item.id && (
                <div style={{ marginTop:14,paddingTop:14,
                  borderTop:'1px solid rgba(255,255,255,0.06)',
                  display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:12 }}>
                  {[
                    { key:'alertAbove', label:'Alert if above (NPR)' },
                    { key:'alertBelow', label:'Alert if below (NPR)' },
                    { key:'notes', label:'Notes' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'block',color:'var(--text-secondary)',
                        fontSize:10,fontWeight:700,marginBottom:4,textTransform:'uppercase' }}>
                        {f.label}
                      </label>
                      <input
                        value={(editForm as any)[f.key]}
                        onChange={e=>setEditForm(prev=>({...prev,[f.key]:e.target.value}))}
                        style={{ width:'100%',background:'rgba(255,255,255,0.05)',
                          border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
                          padding:'6px 10px',color:'white',fontSize:12,outline:'none',
                          boxSizing:'border-box' }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <button onClick={()=>saveEdit(item.id)}
                      style={{ background:'var(--gold)',color:'black',border:'none',
                        borderRadius:6,padding:'6px 16px',cursor:'pointer',
                        fontWeight:700,fontSize:12 }}>
                      Save Alert
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
