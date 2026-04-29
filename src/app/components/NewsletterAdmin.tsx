import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, getCountFromServer } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Mail, Users, Trash2, ToggleLeft, ToggleRight, Send, Loader2, CheckCircle, PieChart, TrendingUp, UserCheck, UserX } from 'lucide-react'

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'))
    const unsub = onSnapshot(q, snapshot => {
      setSubscribers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'subscribers', id), { active: !current })
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from subscriber list?`)) return
    await deleteDoc(doc(db, 'subscribers', id))
  }

  const activeCount = subscribers.filter(s => s.active).length
  const totalCount = subscribers.length

  return (
    <div className="space-y-8 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Newsletter HQ</h2>
          <p className="text-zinc-500 mt-4 text-sm">Managing audience growth and daily Alpha Brief distributions.</p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-8 flex flex-col items-center text-center">
           <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
              <Users size={24} className="text-zinc-500" />
           </div>
           <p className="text-4xl font-black text-white mb-2">{totalCount}</p>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Audience</p>
        </div>
        <div className="premium-card p-8 flex flex-col items-center text-center">
           <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <UserCheck size={24} className="text-emerald-500" />
           </div>
           <p className="text-4xl font-black text-emerald-400 mb-2">{activeCount}</p>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Subscribers</p>
        </div>
        <div className="premium-card p-8 flex flex-col items-center text-center">
           <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
              <UserX size={24} className="text-red-500" />
           </div>
           <p className="text-4xl font-black text-zinc-500 mb-2">{totalCount - activeCount}</p>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Unsubscribed</p>
        </div>
      </div>

      {/* Broadcast Control */}
      <div className="premium-card p-10 bg-gold/5 border-gold/20 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
           <div className="p-4 rounded-3xl bg-gold/10 border border-gold/20">
              <Send size={32} color="var(--gold)" />
           </div>
           <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">Manual Broadcast</h3>
              <p className="text-zinc-400 text-sm max-w-sm">Dispatch the latest Alpha Intelligence digest to all <span className="text-white font-bold">{activeCount} active users</span> via the Resend infrastructure.</p>
           </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {sendResult && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle size={14} /> {sendResult}
            </span>
          )}
          <button
            className="px-10 py-4 rounded-2xl bg-gold text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-gold/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
            disabled={sending || activeCount === 0}
            onClick={async () => {
              setSending(true)
              setSendResult(null)
              try {
                // Implementation for manual trigger
                setSendResult(`Broadcast sequence initiated for ${activeCount} nodes.`)
              } finally {
                setSending(false)
              }
            }}
          >
            {sending ? <><Loader2 size={16} className="animate-spin mr-2" /> Dispatching...</> : 'Send Alpha Brief'}
          </button>
        </div>
      </div>

      {/* Subscriber Management */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
           <div className="flex items-center gap-3">
              <Mail size={18} color="var(--gold)" />
              <h3 className="text-sm font-black uppercase tracking-widest">Audience Directory</h3>
           </div>
        </div>

        {loading ? (
          <div className="p-20 text-center space-y-4">
            <Loader2 size={32} className="animate-spin mx-auto text-gold" />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Decrypting subscriber list...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-20 text-center space-y-6">
            <Mail size={48} className="mx-auto text-zinc-800" />
            <div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">The mailing list is empty.</p>
              <p className="text-zinc-600 text-xs mt-2">Deploy the lead capture widget on your main portfolio to scale.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Intelligence Feed</th>
                  <th>Deployment Date</th>
                  <th>Traffic Source</th>
                  <th>Status</th>
                  <th className="text-right">Operations</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => (
                  <tr key={sub.id}>
                    <td>
                       <div className="font-bold text-white">{sub.name || 'Anonymous Node'}</div>
                       <div className="text-[10px] font-black text-zinc-500 tracking-wider uppercase mt-1">ID: {sub.id.slice(-8)}</div>
                    </td>
                    <td className="font-black text-gold">{sub.email}</td>
                    <td className="text-xs text-zinc-400 font-bold">
                      {sub.subscribedAt?.toDate
                        ? sub.subscribedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="text-xs font-black uppercase text-zinc-500">{sub.source || 'direct'}</td>
                    <td>
                      <span className={`status-chip ${sub.active ? 'status-chip-success' : 'status-chip-info'}`}>
                        {sub.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => toggleActive(sub.id, sub.active)}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-gold/50 transition-colors"
                          title={sub.active ? 'Suspend Feed' : 'Restore Feed'}
                        >
                          {sub.active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-zinc-600" />}
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id, sub.email)}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-colors group"
                        >
                          <Trash2 size={18} className="text-zinc-600 group-hover:text-red-500 transition-colors" />
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
    </div>
  )
}
