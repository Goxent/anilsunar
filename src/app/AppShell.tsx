import { useState, useEffect, ReactNode, createContext, useContext } from 'react'
import { 
  TrendingUp, 
  Search, 
  Users, 
  Brain, 
  Pencil, 
  Settings, 
  LogOut,
  Terminal,
  RefreshCw,
  X,
  AlertCircle,
  Menu,
  Sparkles,
  Bell,
  Briefcase,
  Star,
  Layout
} from 'lucide-react'

// Tab Components
import DailyBrief    from './components/DailyBrief'
import StockAnalyzer from './components/StockAnalyzer'
import StockScreener from './components/StockScreener'
import SmartMoney    from './components/SmartMoney'
import PortfolioTracker from './components/PortfolioTracker'
import Watchlist        from './components/Watchlist'
import NoticeTracker    from './components/NoticeTracker'
import ContentStudio from './components/ContentStudio'
import ControlPanel  from './components/ControlPanel'
import SiteStudio    from './components/SiteStudio'

import LoadingCard from './components/LoadingCard'
import { auth, googleProvider, db } from './lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import localOmniData from './data/market-omni-data.json'
import localAiBrief from './data/ai_digest.json'

// Context for Cloud Data
const MarketDataContext = createContext<{
  omniData: any;
  aiBrief: any;
  loading: boolean;
  refresh: () => void;
}>({ omniData: null, aiBrief: null, loading: true, refresh: () => {} });

export const useMarketData = () => useContext(MarketDataContext);

const NAV_GROUPS = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    color: 'var(--gold)',
    tabs: [
      { id: 'brief',    label: 'Daily Brief',    icon: Sparkles,   component: DailyBrief },
      { id: 'screener', label: 'Stock Screener', icon: Layout,     component: StockScreener },
      { id: 'analyzer', label: 'Stock Analyzer',  icon: Search,     component: StockAnalyzer },
      { id: 'money',    label: 'Smart Money',     icon: TrendingUp, component: SmartMoney },
      { id: 'portfolio', label: 'Portfolio',      icon: Briefcase,  component: PortfolioTracker },
      { id: 'watchlist', label: 'Watchlist',      icon: Star,       component: Watchlist },
    ]
  },
  {
    id: 'content',
    label: 'Content',
    color: 'var(--blue)',
    tabs: [
      { id: 'notices', label: 'Notice Tracker', icon: Bell, component: NoticeTracker },
      { id: 'studio',  label: 'Content Studio', icon: Pencil,  component: ContentStudio },
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    color: 'var(--amber)',
    adminOnly: true,
    tabs: [
      { id: 'control', label: 'Control Panel', icon: Terminal, component: ControlPanel },
      { id: 'studio-site', label: 'Site Studio', icon: Layout, component: SiteStudio },
    ]
  }
]

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const ToastContext = createContext<{
  showToast: (message: string, type: Toast['type']) => void;
}>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export default function AppShell() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [activeTab, setActiveTab] = useState('brief')
  
  const [omniData, setOmniData] = useState<any>(null)
  const [aiBrief, setAiBrief] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const fetchCloudData = async () => {
    setDataLoading(true)
    try {
      const [marketRes, intelRes] = await Promise.all([
        fetch('/api/get-market-data?type=market'),
        fetch('/api/get-market-data?type=intel')
      ])
      
      let mData = null;
      let iData = null;

      if (marketRes.ok) mData = await marketRes.json();
      if (intelRes.ok) iData = await intelRes.json();

      setOmniData(mData || localOmniData);
      setAiBrief(iData || localAiBrief);
    } catch (err) {
      console.warn("Failed to fetch cloud data, using local fallback:", err)
      setOmniData(localOmniData);
      setAiBrief(localAiBrief);
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchCloudData()
  }, [])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showToast = (message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthMessage('')
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email)
        setAuthMessage('Password reset email sent! Check your inbox.')
        setIsForgotPassword(false)
      } else if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(cred.user)
        setAuthMessage('Account created! Please verify your email before signing in.')
        setIsSignUp(false)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setAuthError(err.message?.replace('Firebase: ', '') || 'Authentication failed')
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const key = e.key
      if (key === '1') handleTabChange('brief')
      if (key === '2') handleTabChange('analyzer')
      if (key === '3') handleTabChange('money')
      if (key === '4') handleTabChange('notices')
      if (key === '5') handleTabChange('studio')
      if (key === '6') handleTabChange('control')
      
      if (key === '/') {
        e.preventDefault()
        document.querySelector('input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [role, setRole] = useState<'admin' | 'user' | 'pending' | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => { if (isMounted) setLoading(false); }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          let userRole: 'admin' | 'user' | 'pending' = 'pending'
          if (userSnap.exists()) {
            userRole = userSnap.data().role || 'pending'
          } else {
            await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'pending',
              createdAt: new Date().toISOString()
            })
          }
          if (firebaseUser.email === 'anil99senchury@gmail.com') userRole = 'admin'
          setRole(userRole)
        } catch (err) { console.error(err) }
      } else {
        setUser(null)
        setRole(null)
      }
      if (isMounted) { clearTimeout(timeout); setLoading(false); }
    }, (error) => { if (isMounted) { clearTimeout(timeout); setLoading(false); } })
    return () => { isMounted = false; clearTimeout(timeout); unsubscribe(); }
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--gold-dim)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} className="animate-spin" />
        <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Command Center</div>
      </div>
    </div>
  )

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-0)' }}>
        {/* Left branding panel */}
        {!isMobile && (
          <div style={{ flex: 1, background: 'linear-gradient(160deg, #06060a 0%, #0d0d14 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, borderRight: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ width: 64, height: 64, background: 'var(--gold)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'black', marginBottom: 32 }}>G</div>
              <p style={{ fontSize: 10, letterSpacing: '0.4em', color: 'var(--gold)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Goxent</p>
              <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Command Center</h1>
              <p style={{ color: 'var(--text-2)', fontSize: 15 }}>Your private intelligence terminal for finance & content.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '📊', text: 'Real-time NEPSE analysis & live market data' },
                { icon: '🤖', text: 'AI-powered stock screening & broker intelligence' },
                { icon: '✍️', text: 'Content Studio for multi-channel distribution' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <span style={{ color: 'var(--text-2)', fontSize: 14 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Right form panel */}
        <div style={{ width: isMobile ? '100%' : 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 24 : 48 }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            {isMobile && <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 56, height: 56, background: 'var(--gold)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'black', margin: '0 auto 16px' }}>G</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Command Center</h1>
            </div>}
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 28 }}>
              {isForgotPassword ? "We'll send a reset link to your email." : isSignUp ? 'New accounts require admin approval.' : 'Sign in to your intelligence dashboard.'}
            </p>
            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {!isForgotPassword && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
              {authError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{authError}</p>}
              {authMessage && <p style={{ color: 'var(--green)', fontSize: 12, margin: 0 }}>{authMessage}</p>}
              <button type="submit" style={{ background: 'var(--gold)', color: 'black', fontWeight: 800, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <button onClick={async () => { setAuthError(''); try { await signInWithPopup(auth, googleProvider) } catch(e: any) { setAuthError(e.message) }}} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
              Continue with Google
            </button>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
              <button onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setAuthError('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 700 }}>
                {isSignUp ? 'Already have an account?' : 'Create account'}
              </button>
              {!isSignUp && <button onClick={() => { setIsForgotPassword(!isForgotPassword); setAuthError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>
                {isForgotPassword ? 'Back to sign in' : 'Forgot password?'}
              </button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Email-password users must verify before entering
  const isEmailPasswordUser = user?.providerData?.[0]?.providerId === 'password'
  if (isEmailPasswordUser && !user.emailVerified) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
        <div className="card-base" style={{ width: 400, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Verify your email</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>We sent a verification link to <strong>{user.email}</strong>.</p>
          <button onClick={() => user.reload().then(() => window.location.reload())} className="btn" style={{ width: '100%', marginBottom: 12, background: 'var(--gold)', color: 'black' }}>I've verified — Reload</button>
          <button onClick={() => signOut(auth)} className="btn" style={{ width: '100%' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  // Pending approval screen
  if (role === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
        <div className="card-base" style={{ width: 440, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Access Pending</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16 }}>The admin will approve your access shortly.</p>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 32 }}>Need immediate access? Contact <a href="mailto:anil@anilsunar.com.np" style={{ color: 'var(--gold)' }}>Anil Sunar</a></p>
          <button onClick={() => signOut(auth)} className="btn" style={{ width: '100%' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  const allowedGroups = NAV_GROUPS.filter(group => (group.adminOnly ? role === 'admin' : true))
  const allTabs = allowedGroups.flatMap(group => group.tabs)
  const activeTabInfo = allTabs.find(t => t.id === activeTab) || allTabs[0]
  const ActiveComponent = activeTabInfo?.component || DailyBrief

  const dataAgeHours = omniData?.timestamp ? (Date.now() - new Date(omniData.timestamp).getTime()) / (1000 * 60 * 60) : 100
  const freshnessColor = dataAgeHours < 24 ? 'var(--green)' : dataAgeHours < 48 ? 'var(--amber)' : 'var(--red)'
  const freshnessText = dataAgeHours < 24 ? "Live · today" : dataAgeHours < 48 ? "24h old" : "⚠ Stale"

  return (
    <ToastContext.Provider value={{ showToast }}>
      <MarketDataContext.Provider value={{ omniData, aiBrief, loading: dataLoading, refresh: fetchCloudData }}>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-0)' }}>
          
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90, backdropFilter: 'blur(4px)' }} 
            />
          )}

        {/* Sidebar */}
        <aside 
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{
            width: 240, background: 'var(--bg-1)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', padding: '20px 12px', position: 'fixed',
            top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto'
          }}
        >
          {/* Sidebar Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 32 }}>
            <div style={{ 
              width: 32, height: 32, background: 'var(--gold)', borderRadius: 8, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'black', fontWeight: 900, fontSize: 18 
            }}>
              G
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.05em' }}>GOXENT</span>
              <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>Intelligence</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {allowedGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', 
                  color: group.color, padding: '0 8px', marginBottom: 6 
                }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.tabs.map((tab: any) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontSize: 13, textAlign: 'left', transition: 'all 0.15s',
                          background: isActive ? 'var(--gold-dim)' : 'transparent',
                          color: isActive ? 'var(--gold)' : 'var(--text-2)',
                          borderLeft: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                          fontWeight: isActive ? 600 : 400
                        }}
                      >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px 8px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 12, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button 
              onClick={() => signOut(auth)} 
              style={{ 
                width: '100%', padding: '8px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)',
                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 240, display: 'flex', flexDirection: 'column' }}>
          <header style={{
            height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)', background: 'rgba(6, 6, 10, 0.85)', backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-1)', cursor: 'pointer', padding: 4 }}>
                  <Menu size={20} />
                </button>
              )}
              <h2 style={{ fontSize: 18, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                {activeTabInfo?.label}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', 
                borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-1)',
                fontSize: 11, fontFamily: 'var(--font-mono)' 
              }}>
                <div style={{ 
                  width: 6, height: 6, borderRadius: '50%', background: freshnessColor, 
                  boxShadow: `0 0 8px ${freshnessColor}` 
                }} />
                <span style={{ color: 'var(--text-2)' }}>{freshnessText}</span>
              </div>
            </div>
          </header>

          <main style={{ padding: '24px', flex: 1 }}>
            <ActiveComponent />
          </main>
        </div>

        {/* Toast Notifications */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className="card-base" 
              style={{ 
                border: `1px solid ${toast.type === 'success' ? 'var(--green-border)' : 'var(--red-border)'}`, 
                minWidth: 280, padding: '16px', background: toast.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
                color: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                fontWeight: 600, fontSize: 13
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .sidebar.open { transform: translateX(0); }
        }
        @media (min-width: 769px) {
          .sidebar { transform: translateX(0) !important; }
        }
        .nav-item:not(.active):hover {
          background: var(--bg-2) !important;
          color: var(--text-1) !important;
        }
        input, textarea {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text-1);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, textarea:focus {
          border-color: var(--gold);
        }
      `}} />
      </MarketDataContext.Provider>
    </ToastContext.Provider>
  )
}
