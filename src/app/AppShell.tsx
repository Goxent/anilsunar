import { useState, useEffect, ReactNode } from 'react'
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
  ChevronRight,
  ChevronDown,
  Globe,
  Mail
} from 'lucide-react'
import MarketOverview from './components/MarketOverview'
import MarketIntelligence from './components/MarketIntelligence'
import StockScreener from './components/StockScreener'
import BrokerAnalysis from './components/BrokerAnalysis'
import AIResearch from './components/AIResearch'
import ContentStudio from './components/ContentStudio'
import NewsletterAdmin from './components/NewsletterAdmin'
import UserManagement from './components/UserManagement'
import SastoEmulator from './components/SastoEmulator'
import AdminDashboard from '../../components/AdminDashboard'
import { auth, googleProvider, db } from './lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const NAV_GROUPS = [
  {
    id: 'nepse',
    label: 'NEPSE Analysis',
    color: '#4ADE80',
    icon: TrendingUp,
    tabs: [
      { id: 'market', label: 'Market Overview', icon: LayoutDashboard, component: MarketOverview },
      { id: 'emulator', label: 'Sasto Share Emulator', icon: Search, component: SastoEmulator },
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
      { id: 'users', label: 'User Management', icon: Users, component: UserManagement },
    ]
  }
]



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
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('market')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    let isMounted = true;
    
    // Fallback timeout just in case Firebase hangs
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Firebase auth state change took too long. Forcing load to stop.");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser ? firebaseUser.uid : 'none');
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          console.log("Fetching user role...");
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          console.log("User role fetched.");
          
          let userRole: 'admin' | 'user' = 'user'
          
          if (userSnap.exists()) {
            userRole = userSnap.data().role || 'user'
          } else {
            console.log("User doc does not exist. Creating...");
            if (firebaseUser.email === 'anil99senchury@gmail.com') {
              userRole = 'admin'
            }
            await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: userRole,
              createdAt: new Date().toISOString()
            })
            console.log("User doc created.");
          }
          setRole(userRole)
        } catch (err) {
          console.error("Error fetching/setting role:", err)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      
      if (isMounted) {
        clearTimeout(timeout);
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      if (isMounted) {
        clearTimeout(timeout);
        setLoading(false);
      }
    })

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    }
  }, [])

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setAuthMessage('Password reset link sent to your email.');
      } else if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setAuthMessage('Account created! Verification email sent.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Authentication failed:", error);
      // Clean up Firebase error messages
      const msg = error.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\./, '');
      setAuthError(msg || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    signOut(auth)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div style={{ color: 'var(--gold)' }}>Loading Command Center...</div></div>
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="card" style={{ width: 400, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <Lock size={40} style={{ color: 'var(--gold)', marginBottom: 16, margin: '0 auto' }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Goxent Command Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Private access — anilsunar.com.np</p>
          </div>
          
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isForgotPassword && (
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            
            {!isForgotPassword && !isSignUp && (
              <div style={{ textAlign: 'right' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsForgotPassword(true);
                    setAuthError('');
                    setAuthMessage('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {authError && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{authError}</p>}
            {authMessage && <p style={{ color: 'var(--green)', fontSize: 13, margin: 0 }}>{authMessage}</p>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}>
              {isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>

          <button type="button" onClick={handleLogin} className="btn" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', marginBottom: 16 }}>
            Sign in with Google
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
              }
              setAuthError('');
              setAuthMessage('');
            }} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: 13, 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isForgotPassword 
              ? 'Back to Sign In' 
              : (isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up")}
          </button>
        </div>
      </div>
    )
  }

  if (user && !user.emailVerified) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="card" style={{ width: 400, textAlign: 'center' }}>
          <Mail size={40} style={{ color: 'var(--gold)', marginBottom: 16, margin: '0 auto' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Verify your email</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            We've sent a verification link to <strong>{user.email}</strong>. 
            Please check your inbox and click the link to continue.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
            >
              I've verified my email
            </button>
            <button 
              onClick={handleLogout} 
              className="btn" 
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allowedGroups = NAV_GROUPS.filter(group => {
    if (group.id === 'admin') return role === 'admin'
    return true
  })

  // Find the active component across all groups
  const allTabs = allowedGroups.flatMap(group => group.tabs)
  const activeTabInfo = allTabs.find(t => t.id === activeTab) || allTabs[0]
  const ActiveComponent = activeTabInfo?.component || MarketOverview

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
          width: 280,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{ marginBottom: 32, padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                background: 'var(--gold)', 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--bg-primary)',
                fontWeight: 800,
                fontSize: 18
              }}>
                G
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.1em', color: 'white' }}>OXENT</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Command Center</span>
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: 8, 
              padding: '12px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }}></div>
                <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>Live</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{todayStr}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {allowedGroups.map((group, idx) => (
              <div key={group.id}>
                <NavGroupSection group={group} activeTab={activeTab} setActiveTab={setActiveTab} />
                {idx < allowedGroups.length - 1 && (
                  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                )}
              </div>
            ))}
          </nav>

          {/* Footer User Profile & Actions */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16, padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 800 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName || 'User'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>{role}</div>
              </div>
            </div>
            <a 
              href="https://anilsunar.com.np" 
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Globe size={16} /> Main Website
            </a>
            
            <button 
              onClick={handleLogout} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%', 
                padding: '12px',
                border: 'none', 
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1, marginLeft: 280, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <header style={{
            height: 64,
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(5, 5, 8, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeTabInfo?.label}
            </h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              app.anilsunar.com.np
            </div>
          </header>

          <main style={{ padding: 32, flex: 1 }}>
            <ActiveComponent />
          </main>
        </div>
      </div>
  )
}
