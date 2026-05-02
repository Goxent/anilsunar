import { useState, useEffect } from 'react'
import { 
  Terminal, 
  Users, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  UserCheck, 
  UserPlus, 
  Trash2,
  Trash,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { db, auth } from '../lib/firebase'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore'
import { useToast } from '../AppShell'

export default function ControlPanel() {
  const { showToast } = useToast()
  
  // Bot States
  const [syncType, setSyncType] = useState<'all'|'notices'|'ai'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ok:boolean, msg:string}|null>(null)
  
  // Data States
  const [history, setHistory] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [subscribers, setSubscribers] = useState<any[]>([])

  useEffect(() => {
    // 1. Sync History
    const historyQuery = query(collection(db, 'sasto_records'), orderBy('timestamp', 'desc'), limit(10))
    const unsubHistory = onSnapshot(historyQuery, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // 2. Users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // 3. Newsletter
    const subQuery = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'))
    const unsubSubs = onSnapshot(subQuery, (snap) => {
      setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubHistory()
      unsubUsers()
      unsubSubs()
    }
  }, [])

  // SYNC FUNCTION
  async function triggerSync() {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const res = await fetch('/api/run-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType })
      })
      const data = await res.json()
      if (res.ok) {
        setSyncStatus({ ok: true, msg: 'Sync triggered successfully. Check back in ~15 minutes.' })
        showToast("Bot pipeline initiated", "success")
      } else {
        setSyncStatus({ ok: false, msg: data.error || 'Trigger failed.' })
        showToast(data.error || "Sync trigger failed", "error")
      }
    } catch(e: any) {
      setSyncStatus({ ok: false, msg: e.message })
      showToast(e.message, "error")
    } finally {
      setSyncing(false)
    }
  }

  // ROLE UPDATE FUNCTION
  async function handleRoleToggle(userId: string, currentRole: string, email: string) {
    if (email === 'anil99senchury@gmail.com' || email === auth.currentUser?.email) {
      showToast("Cannot modify own account or owner account", "error")
      return
    }

    let nextRole = 'user'
    if (currentRole === 'pending') nextRole = 'user'
    else if (currentRole === 'user') nextRole = 'admin'
    else if (currentRole === 'admin') nextRole = 'user'

    try {
      await updateDoc(doc(db, 'users', userId), { role: nextRole })
      showToast(`Role updated to ${nextRole}`, "success")
    } catch (err: any) {
      showToast(err.message, "error")
    }
  }

  // SUBSCRIBER TOGGLE
  async function toggleSubscriber(id: string, current: boolean) {
    try {
      await updateDoc(doc(db, 'subscribers', id), { active: !current })
      showToast("Subscriber status updated", "success")
    } catch (err: any) {
      showToast(err.message, "error")
    }
  }

  // SUBSCRIBER DELETE
  async function deleteSubscriber(id: string) {
    if (!window.confirm("Are you sure you want to delete this subscriber?")) return
    try {
      await deleteDoc(doc(db, 'subscribers', id))
      showToast("Subscriber removed", "success")
    } catch (err: any) {
      showToast(err.message, "error")
    }
  }

  const activeSubCount = subscribers.filter(s => s.active).length

  return (
    <div className="flex flex-col gap-10">
      
      {/* SECTION 1: ALPHA BOT */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[20px] font-bold text-1 flex items-center gap-2">
            <Terminal size={18} className="text-gold" /> Alpha Bot
          </h2>
          <p className="text-2 text-[12px]">Trigger the daily intelligence & scraping pipeline remotely.</p>
        </div>

        <div className="card-base p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-3 uppercase tracking-widest">Select Sync Scope</span>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Full Sync' },
                { id: 'notices', label: 'Notices Only' },
                { id: 'ai', label: 'AI Analysis' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSyncType(t.id as any)}
                  className={`badge transition-all cursor-pointer ${syncType === t.id ? 'badge-gold' : 'badge-gray hover:border-gold-border'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={triggerSync}
              disabled={syncing}
              className="w-fit px-8 py-3 bg-gold text-black font-bold rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {syncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {syncing ? 'Triggering...' : 'Run Sync'}
            </button>

            {syncStatus && (
              <div className={`badge ${syncStatus.ok ? 'badge-green' : 'badge-red'} py-2 px-4 rounded-md w-fit`}>
                <div className="flex items-center gap-2">
                  {syncStatus.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{syncStatus.msg}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-3 uppercase tracking-widest">Sync History</span>
              <span className="text-[10px] text-2 font-mono">Last 10 Records</span>
            </div>
            <div className="card-base p-0 overflow-hidden border-border/50">
              {history.length > 0 ? (
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-bg-0 text-3 uppercase font-bold border-b border-border">
                      <th className="p-3">Date</th>
                      <th className="p-3">NEPSE</th>
                      <th className="p-3">Change</th>
                      <th className="p-3">Phase</th>
                      <th className="p-3">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec: any) => (
                      <tr key={rec.id} className="border-b border-border/50 hover:bg-bg-2 transition-colors">
                        <td className="p-3 text-1">{new Date(rec.timestamp).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-gold">{rec.nepse || '—'}</td>
                        <td className={`p-3 font-bold ${rec.change?.startsWith('+') ? 'text-green' : 'text-red'}`}>{rec.change || '0.00%'}</td>
                        <td className="p-3">
                           <span className={`badge py-0.5 px-2 text-[9px] ${rec.phase === 'BULL' ? 'badge-green' : rec.phase === 'BEAR' ? 'badge-red' : 'badge-gray'}`}>
                             {rec.phase || 'N/A'}
                           </span>
                        </td>
                        <td className="p-3 text-2">{rec.sentiment || 'NEUTRAL'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-3 text-sm italic">No sync records yet.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-0 border-t border-border" />

      {/* SECTION 2: USERS */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[20px] font-bold text-1 flex items-center gap-2">
            <Users size={18} className="text-blue" /> Access Control
          </h2>
          <p className="text-2 text-[12px]">Manage user permissions and account verification.</p>
        </div>

        <div className="card-base p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-3">
                <td className="p-4 pl-6">User / Identity</td>
                <td className="p-4">Role</td>
                <td className="p-4">Joined</td>
                <td className="p-4 pr-6 text-right">Actions</td>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const isPending = u.role === 'pending'
                const isSelf = u.email === auth.currentUser?.email
                const isOwner = u.email === 'anil99senchury@gmail.com'
                const initials = (u.displayName || u.email || '?').charAt(0).toUpperCase()

                return (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-bg-2 transition-all ${isPending ? 'border-l-[3px] border-l-amber' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          u.role === 'admin' ? 'bg-gold text-black' : 
                          u.role === 'user' ? 'bg-blue text-white' : 'bg-amber text-black'
                        }`}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-1 truncate max-w-[180px]">{u.email}</span>
                          {isSelf && <span className="text-[9px] text-gold font-bold uppercase">You</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-gold' : 
                        u.role === 'user' ? 'badge-blue' : 'badge-amber'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-2 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleRoleToggle(u.id, u.role, u.email)}
                        disabled={isSelf || isOwner}
                        className={`badge transition-all py-1.5 px-3 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          u.role === 'pending' ? 'badge-green hover:brightness-110' :
                          u.role === 'user' ? 'badge-gray hover:border-gold-border' :
                          'badge-red hover:brightness-110'
                        }`}
                      >
                        {u.role === 'pending' ? 'Approve' : u.role === 'user' ? 'Make Admin' : 'Revoke Admin'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-0 border-t border-border" />

      {/* SECTION 3: NEWSLETTER */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[20px] font-bold text-1 flex items-center gap-2">
            <Mail size={18} className="text-purple" /> Newsletter
          </h2>
          <p className="text-2 text-[12px]">Monitor subscribers and mailing list growth.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-base p-4 bg-bg-1">
            <div className="text-[10px] font-bold text-3 uppercase mb-1">Total Subscribers</div>
            <div className="font-mono text-xl font-black text-1">{subscribers.length}</div>
          </div>
          <div className="card-base p-4 bg-green-dim border-green-border">
            <div className="text-[10px] font-bold text-green uppercase mb-1">Active</div>
            <div className="font-mono text-xl font-black text-green">{activeSubCount}</div>
          </div>
          <div className="card-base p-4 bg-red-dim border-red-border">
            <div className="text-[10px] font-bold text-red uppercase mb-1">Inactive</div>
            <div className="font-mono text-xl font-black text-red">{subscribers.length - activeSubCount}</div>
          </div>
        </div>

        <div className="card-base p-0 overflow-hidden">
          {subscribers.length > 0 ? (
            <div className="flex flex-col">
              {subscribers.slice(0, 20).map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0 hover:bg-bg-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-1 truncate block">{sub.email}</span>
                    <span className="text-[10px] text-2 font-mono">Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleSubscriber(sub.id, sub.active)}
                      className={`badge py-1 px-3 cursor-pointer transition-all ${sub.active ? 'badge-green' : 'badge-red'}`}
                    >
                      {sub.active ? 'Active' : 'Inactive'}
                    </button>
                    <button 
                      onClick={() => deleteSubscriber(sub.id)}
                      className="p-2 rounded-md hover:bg-red-dim text-3 hover:text-red transition-all"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-3 text-sm italic">No subscribers yet.</div>
          )}
        </div>
      </section>

    </div>
  )
}
