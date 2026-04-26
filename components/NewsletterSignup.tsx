import { useState } from 'react'
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '../src/app/lib/firebase'
import { Mail, CheckCircle, Loader2, TrendingUp } from 'lucide-react'

export default function NewsletterSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'exists'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    try {
      // Check if already subscribed
      const q = query(collection(db, 'subscribers'), where('email', '==', email.trim().toLowerCase()))
      const existing = await getDocs(q)
      if (!existing.empty) {
        setStatus('exists')
        return
      }

      await addDoc(collection(db, 'subscribers'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subscribedAt: Timestamp.now(),
        active: true,
        source: 'anilsunar.com.np'
      })
      setStatus('success')
      setName('')
      setEmail('')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section className="newsletter-section">
      <div className="newsletter-inner">
        <div className="newsletter-badge">
          <TrendingUp size={14} />
          Free Daily Digest
        </div>

        <h2 className="newsletter-title">
          NEPSE Market Intelligence,<br />
          <span className="newsletter-title-gold">Delivered Every Evening</span>
        </h2>

        <p className="newsletter-subtitle">
          Daily analysis of NEPSE market trends, broker accumulation signals, 
          and LinkedIn content ideas — crafted by AI, reviewed by a CA professional.
          No spam. Unsubscribe anytime.
        </p>

        {status === 'success' ? (
          <div className="newsletter-success">
            <CheckCircle size={24} />
            <div>
              <p className="newsletter-success-title">You're in! 🎉</p>
              <p className="newsletter-success-sub">Check your inbox every evening at 6 PM for the daily market brief.</p>
            </div>
          </div>
        ) : status === 'exists' ? (
          <div className="newsletter-success">
            <CheckCircle size={24} />
            <div>
              <p className="newsletter-success-title">Already subscribed!</p>
              <p className="newsletter-success-sub">You're already on the list. Watch for the evening digest.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="newsletter-input"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="newsletter-input"
            />
            <button type="submit" disabled={status === 'loading'} className="newsletter-btn">
              {status === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Subscribing...</>
              ) : (
                <><Mail size={16} /> Subscribe Free</>
              )}
            </button>
            {status === 'error' && (
              <p className="newsletter-error">Something went wrong. Please try again.</p>
            )}
          </form>
        )}

        <p className="newsletter-disclaimer">
          Sent via Resend · Powered by AI + NEPSE data · No spam guarantee
        </p>
      </div>
    </section>
  )
}
