import { useState, ReactNode } from 'react'
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
  Mail
} from 'lucide-react'
import MarketOverview from './components/MarketOverview'
import MarketIntelligence from './components/MarketIntelligence'
import StockScreener from './components/StockScreener'
import BrokerAnalysis from './components/BrokerAnalysis'
import AIResearch from './components/AIResearch'
import ContentStudio from './components/ContentStudio'
import NewsletterAdmin from './components/NewsletterAdmin'
import AdminDashboard from '../../components/AdminDashboard'

const TABS = [
  { id: 'market', label: 'Market Overview', icon: LayoutDashboard, component: MarketOverview },
  { id: 'intel', label: 'Market Intelligence', icon: TrendingUp, component: MarketIntelligence },
  { id: 'screener', label: 'Stock Screener', icon: Search, component: StockScreener },
  { id: 'broker', label: 'Broker Analysis', icon: Users, component: BrokerAnalysis },
  { id: 'ai', label: 'AI Research', icon: Brain, component: AIResearch },
  { id: 'studio', label: 'Content Studio', icon: Pencil, component: ContentStudio },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, component: NewsletterAdmin },
  { id: 'admin', label: 'Admin Panel', icon: Settings, component: AdminDashboard },
]

function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('app_auth') === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'goxent2024'
    if (password === correctPassword) {
      sessionStorage.setItem('app_auth', 'true')
      setAuthed(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (authed) return <>{children}</>

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <form onSubmit={handleLogin} style={{ width: 400 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <Lock size={40} style={{ color: 'var(--gold)', marginBottom: 16 }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Goxent Command Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Private access — anilsunar.com.np</p>
          </div>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}>
            <Lock size={16} /> Access Command Center
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('market')

  const handleLogout = () => {
    sessionStorage.removeItem('app_auth')
    window.location.reload()
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || MarketOverview

  return (
    <AuthGate>
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
        }}>
          <div style={{ marginBottom: 40, padding: '0 8px' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--gold)' }}>GOXENT</span> Shell
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>
              Command Center v2.0
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {TABS.slice(0, 6).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--gold-dim)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <tab.icon size={18} />
                <span style={{ flex: 1 }}>{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: activeTab === 'admin' ? 'var(--gold-dim)' : 'transparent',
                color: activeTab === 'admin' ? 'var(--gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'admin' ? 600 : 400,
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <Settings size={18} />
              <span>Admin Panel</span>
            </button>

            <button onClick={handleLogout} className="btn" style={{ width: '100%', justifyContent: 'center', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
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
              {TABS.find(t => t.id === activeTab)?.label}
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
    </AuthGate>
  )
}
