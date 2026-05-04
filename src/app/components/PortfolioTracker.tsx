import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'
import omniData from '../data/market-omni-data.json'

interface Holding {
  id: string; symbol: string; quantity: number
  avgBuyPrice: number; buyDate: string; notes: string
}

function getLTP(symbol: string): number | null {
  const stocks = (omniData as any)?.structured?.topStocks || []
  const found = stocks.find((s: any) => s.symbol?.toUpperCase() === symbol.toUpperCase())
  return found?.ltp || null
}

const KEY = 'goxent_portfolio'
const load = (): Holding[] => { try { return JSON.parse(localStorage.getItem(KEY)||'[]') } catch { return [] } }
const save = (h: Holding[]) => localStorage.setItem(KEY, JSON.stringify(h))
const uid = () => Math.random().toString(36).slice(2,9)

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>(load)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({ symbol:'',quantity:'',avgBuyPrice:'',buyDate:'',notes:'' })

  useEffect(() => { save(holdings) }, [holdings])

  const add = () => {
    if (!form.symbol || !form.quantity || !form.avgBuyPrice) return
    const h: Holding = { id: uid(), symbol: form.symbol.toUpperCase(),
      quantity: parseFloat(form.quantity), avgBuyPrice: parseFloat(form.avgBuyPrice),
      buyDate: form.buyDate, notes: form.notes }
    if (editId) {
      setHoldings(prev => prev.map(x => x.id===editId ? {...h,id:editId} : x))
      setEditId(null)
    } else {
      setHoldings(prev => [...prev, h])
    }
    setForm({ symbol:'',quantity:'',avgBuyPrice:'',buyDate:'',notes:'' })
    setAdding(false)
  }

  const remove = (id: string) => setHoldings(prev => prev.filter(h => h.id!==id))

  const startEdit = (h: Holding) => {
    setForm({ symbol:h.symbol, quantity:String(h.quantity),
      avgBuyPrice:String(h.avgBuyPrice), buyDate:h.buyDate, notes:h.notes })
    setEditId(h.id); setAdding(true)
  }

  // Summary calculations
  const rows = holdings.map(h => {
    const ltp = getLTP(h.symbol)
    const invested = h.quantity * h.avgBuyPrice
    const current = ltp ? h.quantity * ltp : null
    const pnl = current !== null ? current - invested : null
    const pnlPct = pnl !== null ? (pnl/invested*100) : null
    return { ...h, ltp, invested, current, pnl, pnlPct }
  })

  const totalInvested = rows.reduce((s,r) => s+r.invested, 0)
  const totalCurrent = rows.reduce((s,r) => s+(r.current||r.invested), 0)
  const totalPnl = totalCurrent - totalInvested
  const totalPnlPct = totalInvested > 0 ? totalPnl/totalInvested*100 : 0

  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'0.3em',color:'var(--gold)',margin:'0 0 6px' }}>NEPSE ANALYSIS</p>
        <h2 style={{ fontSize:28,fontWeight:800,color:'white',margin:'0 0 4px' }}>My Portfolio</h2>
        <p style={{ color:'var(--text-secondary)',fontSize:14,margin:0 }}>
          Track your NEPSE holdings and P&L
        </p>
      </div>

      {/* SUMMARY CARDS */}
      {holdings.length > 0 && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24 }}>
          {[
            { label:'Total Invested', value:`NPR ${totalInvested.toLocaleString()}`, color:'white' },
            { label:'Current Value', value:`NPR ${totalCurrent.toLocaleString()}`, color:'white' },
            { label:'Total P&L', value:`${totalPnl>=0?'+':''}NPR ${totalPnl.toLocaleString()}`,
              color:totalPnl>=0?'#4ADE80':'#ef4444' },
            { label:'Return %', value:`${totalPnlPct>=0?'+':''}${totalPnlPct.toFixed(2)}%`,
              color:totalPnlPct>=0?'#4ADE80':'#ef4444' },
          ].map(c => (
            <div key={c.label} style={{ background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'16px 20px' }}>
              <p style={{ color:'var(--text-secondary)',fontSize:12,margin:'0 0 6px' }}>{c.label}</p>
              <p style={{ color:c.color,fontSize:20,fontWeight:800,margin:0 }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ADD BUTTON */}
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16 }}>
        <button onClick={() => { setAdding(!adding); setEditId(null)
          setForm({symbol:'',quantity:'',avgBuyPrice:'',buyDate:'',notes:''}) }}
          style={{ display:'flex',alignItems:'center',gap:6,
            background:adding?'rgba(255,255,255,0.05)':'var(--gold)',
            color:adding?'white':'black',border:'none',borderRadius:8,
            padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13 }}>
          {adding ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Holding</>}
        </button>
      </div>

      {/* ADD/EDIT FORM */}
      {adding && (
        <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:12,padding:20,marginBottom:20 }}>
          <h3 style={{ color:'white',fontSize:14,margin:'0 0 16px',fontWeight:700 }}>
            {editId ? 'Edit Holding' : 'Add New Holding'}
          </h3>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
            {[
              { key:'symbol', label:'Symbol', placeholder:'e.g. NABIL', transform:(v:string)=>v.toUpperCase() },
              { key:'quantity', label:'Quantity', placeholder:'e.g. 100', transform:(v:string)=>v },
              { key:'avgBuyPrice', label:'Avg Buy Price (NPR)', placeholder:'e.g. 1200', transform:(v:string)=>v },
              { key:'buyDate', label:'Buy Date', placeholder:'', type:'date', transform:(v:string)=>v },
              { key:'notes', label:'Notes (optional)', placeholder:'e.g. Long term hold', transform:(v:string)=>v },
            ].map((f: any) => (
              <div key={f.key}>
                <label style={{ display:'block',color:'var(--text-secondary)',
                  fontSize:11,fontWeight:600,marginBottom:6,textTransform:'uppercase',
                  letterSpacing:'0.1em' }}>{f.label}</label>
                <input
                  type={f.type||'text'}
                  value={(form as any)[f.key]}
                  onChange={e=>setForm(prev=>({...prev,[f.key]:f.transform(e.target.value)}))}
                  placeholder={f.placeholder}
                  style={{ width:'100%',background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,
                    padding:'8px 12px',color:'white',fontSize:13,outline:'none',
                    boxSizing:'border-box' }}
                />
              </div>
            ))}
          </div>
          <button onClick={add}
            style={{ marginTop:16,background:'var(--gold)',color:'black',border:'none',
              borderRadius:8,padding:'8px 20px',cursor:'pointer',fontWeight:700,fontSize:13,
              display:'flex',alignItems:'center',gap:6 }}>
            <Save size={14}/> {editId?'Save Changes':'Add Holding'}
          </button>
        </div>
      )}

      {/* HOLDINGS TABLE */}
      {holdings.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--text-secondary)' }}>
          <Briefcase size={40} style={{ marginBottom:12,opacity:0.3 }}/>
          <p style={{ fontSize:16,fontWeight:600,color:'#64748b',margin:'0 0 8px' }}>No holdings yet</p>
          <p style={{ fontSize:13,margin:0 }}>Click "Add Holding" to track your first stock</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:700 }}>
            <thead>
              <tr style={{ background:'rgba(0,0,0,0.3)' }}>
                {['Symbol','Qty','Avg Buy','LTP','Invested','Current','P&L','P&L%',''].map(h=>(
                  <th key={h} style={{ padding:'10px 14px',textAlign:'left',
                    color:'var(--text-secondary)',fontSize:10,fontWeight:700,
                    textTransform:'uppercase',letterSpacing:'0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.03)',
                    background:r.pnl!==null?(r.pnl>=0?'rgba(74,222,128,0.02)':'rgba(239,68,68,0.02)'):'' }}>
                  <td style={{ padding:'12px 14px',color:'#f59e0b',fontWeight:700 }}>{r.symbol}</td>
                  <td style={{ padding:'12px 14px',color:'white' }}>{r.quantity}</td>
                  <td style={{ padding:'12px 14px',color:'var(--text-secondary)' }}>NPR {r.avgBuyPrice.toLocaleString()}</td>
                  <td style={{ padding:'12px 14px',color:'white',fontWeight:600 }}>
                    {r.ltp ? `NPR ${r.ltp.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding:'12px 14px',color:'var(--text-secondary)' }}>NPR {r.invested.toLocaleString()}</td>
                  <td style={{ padding:'12px 14px',color:'white' }}>
                    {r.current ? `NPR ${r.current.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding:'12px 14px',fontWeight:700,
                    color:r.pnl===null?'var(--text-secondary)':r.pnl>=0?'#4ADE80':'#ef4444' }}>
                    {r.pnl!==null ? `${r.pnl>=0?'+':''}NPR ${r.pnl.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding:'12px 14px',fontWeight:700,
                    color:r.pnlPct===null?'var(--text-secondary)':r.pnlPct>=0?'#4ADE80':'#ef4444' }}>
                    {r.pnlPct!==null ? `${r.pnlPct>=0?'+':''}${r.pnlPct.toFixed(1)}%` : '—'}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={()=>startEdit(r)}
                        style={{ background:'rgba(255,255,255,0.05)',border:'none',
                          borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#94a3b8' }}>
                        <Edit3 size={12}/>
                      </button>
                      <button onClick={()=>remove(r.id)}
                        style={{ background:'rgba(239,68,68,0.1)',border:'none',
                          borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#ef4444' }}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
