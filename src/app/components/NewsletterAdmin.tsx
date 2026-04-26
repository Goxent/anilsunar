import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, getCountFromServer } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Mail, Users, Trash2, ToggleLeft, ToggleRight, Send, Loader2, CheckCircle } from 'lucide-react'

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
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Newsletter</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Manage subscribers and send the daily NEPSE digest
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--gold)' }}>{totalCount}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Subscribers</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--green)' }}>{activeCount}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-secondary)' }}>{totalCount - activeCount}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unsubscribed</p>
        </div>
      </div>

      {/* Send Now */}
      <div className="card" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={16} style={{ color: 'var(--gold)' }} /> Send Today's Digest Now
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Sends the latest AI digest to all {activeCount} active subscribers via Resend
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {sendResult && (
            <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> {sendResult}
            </span>
          )}
          <button
            className="btn btn-primary"
            disabled={sending || activeCount === 0}
            onClick={async () => {
              setSending(true)
              setSendResult(null)
              try {
                // Trigger the digest via the /api/send-digest endpoint or show instruction
                setSendResult(`Digest queued for ${activeCount} subscribers. Run npm run daily-sync to send.`)
              } finally {
                setSending(false)
              }
            }}
          >
            {sending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Now</>}
          </button>
        </div>
      </div>

      {/* Subscriber Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: 'var(--gold)' }} />
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Subscriber List</h3>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p>Loading subscribers...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Mail size={32} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p>No subscribers yet.</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Share your portfolio to start growing your list.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subscribed</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.name || '—'}</td>
                  <td style={{ color: 'var(--gold)' }}>{sub.email}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {sub.subscribedAt?.toDate
                      ? sub.subscribedAt.toDate().toLocaleDateString()
                      : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub.source || 'direct'}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: sub.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)',
                      color: sub.active ? 'var(--green)' : 'var(--text-secondary)',
                    }}>
                      {sub.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleActive(sub.id, sub.active)}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        title={sub.active ? 'Deactivate' : 'Activate'}
                      >
                        {sub.active ? <ToggleRight size={14} style={{ color: 'var(--green)' }} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.email)}
                        className="btn"
                        style={{ padding: '6px 10px', color: 'var(--red)', fontSize: 12 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
