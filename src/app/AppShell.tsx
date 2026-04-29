import { useState, useEffect, ReactNode, createContext, useContext } from 'react'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  Users, 
  Brain, 
  Pencil, 
  Settings, 
  Lock, 
  LogOut,
  ChevronDown,
  Globe,
  Mail,
  Terminal,
  RefreshCw,
  Copy,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Menu,
  Layers,
  Briefcase,
  Star,
  CloudSync,
  Bell
} from 'lucide-react'
import MarketOverview from './components/MarketOverview'
import MarketIntelligence from './components/MarketIntelligence'
import StockScreener from './components/StockScreener'
import BrokerAnalysis from './components/BrokerAnalysis'
import AIResearch from './components/AIResearch'
import ContentStudio from './components/ContentStudio'
import NoticeTracker from './components/NoticeTracker'
import NewsletterAdmin from './components/NewsletterAdmin'
import UserManagement from './components/UserManagement'
import AlphaBotController from './components/AlphaBotController'
import SectorHeatmap from './components/SectorHeatmap'
import PortfolioTracker from './components/PortfolioTracker'
import Watchlist from './components/Watchlist'
import LoadingCard from './components/LoadingCard'
import AdminDashboard from '../../components/AdminDashboard'
import { auth, googleProvider, db } from './lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

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
    id: 'nepse',
    label: 'NEPSE Analysis',
    color: '#4ADE80',
    icon: TrendingUp,
    tabs: [
      { id: 'market', label: 'Market Overview', icon: LayoutDashboard, component: MarketOverview },
      { id: 'sectors', label: 'Sector Heat', icon: Layers, component: SectorHeatmap },
      { id: 'portfolio', label: 'Portfolio', icon: Briefcase, component: PortfolioTracker },
      { id: 'watchlist', label: 'Watchlist', icon: Star, component: Watchlist },
      { id: 'intel', label: 'Market Intelligence', icon: TrendingUp, component: MarketIntelligence },
      { id: 'screener', label: 'Stock Screener', icon: Search, component: StockScreener },
      { id: 'broker', label: 'Broker Analysis', icon: Users, component: BrokerAnalysis },
    ]
  },
  {
    id: 'content',
    label: 'Content & AI',
    color: '#818cf8',
    icon: Pencil,
    tabs: [
      { id: 'ai', label: 'AI Research', icon: Brain, component: AIResearch },
      { id: 'studio', label: 'Content Studio', icon: Pencil, component: ContentStudio },
      { id: 'notices', label: 'Notice Tracker', icon: Bell, component: NoticeTracker },
      { id: 'newsletter', label: 'Newsletter', icon: Mail, component: NewsletterAdmin },
    ]
  },
  {
    id: 'admin',
    label: 'Admin & Settings',
    color: '#f59e0b',
    icon: Settings,
    tabs: [
      { id: 'admin', label: 'Admin Panel', icon: Settings, component: AdminDashboard },
      { id: 'bot', label: 'Alpha Bot', icon: Terminal, component: AlphaBotController },
      { id: 'users', label: 'User Management', icon: Users, component: UserManagement },
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

function NavGroupSection({ group, activeTab, setActiveTab }: { group: any, activeTab: string, setActiveTab: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div style={{ marginBottom: 16 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 8px',
          marginBottom: 8,
          cursor: 'pointer'
        }}
      >
        <span style={{ 
          fontSize: 9, 
          textTransform: 'uppercase', 
          letterSpacing: '0.2em', 
          color: group.color,
          fontWeight: 700 
        }}>
          {group.label}
        </span>
        <ChevronDown 
          size={14} 
          style={{ 
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
            transition: 'transform 0.2s'
          }} 
        />
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {group.tabs.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? 'var(--gold-dim)' : 'transparent',
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-secondary)',
                borderLeft: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <tab.icon size={18} />
              <span style={{ flex: 1 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [activeTab, setActiveTab] = useState('market')
  const [tabLoading, setTabLoading] = useState(false)
  
  // Cloud Data State
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
      
      if (marketRes.ok) setOmniData(await marketRes.json())
      if (intelRes.ok) setAiBrief(await intelRes.json())
    } catch (err) {
      console.error("Failed to fetch cloud data:", err)
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
    setTabLoading(true)
    setActiveTab(id)
    setSidebarOpen(false)
    setTimeout(() => setTabLoading(false), 500)
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
      if (key === '1') handleTabChange('market')
      if (key === '2') handleTabChange('sectors')
      if (key === '3') handleTabChange('portfolio')
      if (key === '4') handleTabChange('watchlist')
      if (key === '5') handleTabChange('bot')
      if (key === '6') handleTabChange('ai')
      
      if (key === '/') {
        e.preventDefault()
        document.querySelector('input')?.focus()
      }
      if (key === 'Escape') {
        // Find and click close buttons if any modal is open
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
            // New user — pending until admin approves
            await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'pending',
              createdAt: new Date().toISOString()
            })
          }
          // Owner email always gets admin
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div style={{ color: 'var(--gold)', fontSize: 14 }}>Loading Command Center...</div></div>

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
        {/* Left branding panel */}
        {!isMobile && (
          <div style={{ flex: 1, background: 'linear-gradient(160deg, #0d0d14 0%, #12121e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, borderRight: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ width: 64, height: 64, background: 'var(--gold)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'black', marginBottom: 32 }}>G</div>
              <p style={{ fontSize: 10, letterSpacing: '0.4em', color: 'var(--gold)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Goxent</p>
              <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>Command Center</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Your private NEPSE intelligence platform.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '📊', text: 'Real-time NEPSE analysis & live market data' },
                { icon: '🤖', text: 'AI-powered stock screening & broker intelligence' },
                { icon: '✍️', text: 'YouTube content studio for Goxent channel' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{f.text}</span>
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
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Goxent Command Center</h1>
            </div>}
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>
              {isForgotPassword ? "We'll send a reset link to your email." : isSignUp ? 'New accounts require admin approval.' : 'Sign in to your intelligence dashboard.'}
            </p>
            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '13px 16px', fontSize: 14 }} />
              {!isForgotPassword && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '13px 16px', fontSize: 14 }} />}
              {authError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{authError}</p>}
              {authMessage && <p style={{ color: 'var(--green)', fontSize: 12, margin: 0 }}>{authMessage}</p>}
              <button type="submit" style={{ background: 'var(--gold)', color: 'black', fontWeight: 800, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <button onClick={async () => { setAuthError(''); try { await signInWithPopup(auth, googleProvider) } catch(e: any) { setAuthError(e.message) }}} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Continue with Google
            </button>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
              <button onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setAuthError('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}>
                {isSignUp ? 'Already have an account?' : 'Create account'}
              </button>
              {!isSignUp && <button onClick={() => { setIsForgotPassword(!isForgotPassword); setAuthError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="card" style={{ width: 400, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Verify your email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>We sent a verification link to <strong>{user.email}</strong>. Click the link then come back.</p>
          <button onClick={() => user.reload().then(() => window.location.reload())} className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}>I've verified — Reload</button>
          <button onClick={() => signOut(auth)} className="btn" style={{ width: '100%' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  // Pending approval screen
  if (role === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="card" style={{ width: 440, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Access Pending</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Your account has been created. The admin will approve your access shortly.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 32 }}>Need immediate access? Contact <a href="mailto:anil@anilsunar.com.np" style={{ color: 'var(--gold)' }}>anil@anilsunar.com.np</a></p>
          <button onClick={() => signOut(auth)} className="btn" style={{ width: '100%' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  const allowedGroups = NAV_GROUPS.filter(group => (group.id === 'admin' ? role === 'admin' : true))
  const allTabs = allowedGroups.flatMap(group => group.tabs)
  const activeTabInfo = allTabs.find(t => t.id === activeTab) || allTabs[0]
  const ActiveComponent = activeTabInfo?.component || MarketOverview

  const dataAgeHours = omniData?.timestamp ? (Date.now() - new Date(omniData.timestamp).getTime()) / (1000 * 60 * 60) : 100
  const freshnessColor = dataAgeHours < 24 ? '#10b981' : dataAgeHours < 48 ? '#f59e0b' : '#ef4444'
  const freshnessText = dataAgeHours < 24 ? "Today's data" : dataAgeHours < 48 ? "Yesterday's data" : "Stale — sync needed"

  return (
    <ToastContext.Provider value={{ showToast }}>
      <MarketDataContext.Provider value={{ omniData, aiBrief, loading: dataLoading, refresh: fetchCloudData }}>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
          
          {/* Mobile Overlay */}
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
            width: 280, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed',
            top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto'
          }}
        >
          <div style={{ marginBottom: 32, padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)', fontWeight: 800 }}>G</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.1em', color: 'white' }}>OXENT</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Command Center</span>
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {allowedGroups.map((group, idx) => (
              <NavGroupSection key={group.id} group={group} activeTab={activeTab} setActiveTab={handleTabChange} />
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px 8px', fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Press 1-6 to navigate quickly
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 8px' }}>
            <button onClick={() => signOut(auth)} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><LogOut size={16} /> Logout</button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 280, display: 'flex', flexDirection: 'column' }}>
          <header style={{
            height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)', background: 'rgba(5, 5, 8, 0.8)', backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
                  <Menu size={22} />
                </button>
              )}
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{activeTabInfo?.label}</h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(66,133,244,0.1)',
                border: '1px solid rgba(66,133,244,0.2)',
                fontSize: 11, fontWeight: 700,
                color: '#4285f4'
              }}>
                ✦ Gemini 2.0
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 11 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: freshnessColor, boxShadow: `0 0 8px ${freshnessColor}` }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{freshnessText}</span>
              </div>
            </div>
          </header>

          <main style={{ padding: '24px', flex: 1 }}>
            {tabLoading ? <LoadingCard /> : <ActiveComponent />}
          </main>
        </div>

        {/* Toast Notifications */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {toasts.map(toast => (
            <div key={toast.id} className="card" style={{ border: `1px solid ${toast.type === 'success' ? '#4ADE80' : '#ef4444'}`, minWidth: 280, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
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
      `}} />
      </MarketDataContext.Provider>
    </ToastContext.Provider>
  )
}
