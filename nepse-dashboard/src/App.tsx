import { useState, ReactNode } from 'react'
import { BarChart3, Search, Users, Brain, TrendingUp, Lock, LogOut, LayoutDashboard, Pencil } from 'lucide-react'
import './App.css'
import MarketOverview from './components/MarketOverview'
import MarketIntelligence from './components/MarketIntelligence'
import StockScreener from './components/StockScreener'
import BrokerAnalysis from './components/BrokerAnalysis'
import AIResearch from './components/AIResearch'
import ContentStudio from './components/ContentStudio'

const TABS = [
  { id: 'market', label: 'Market Overview', icon: LayoutDashboard },
  { id: 'intel', label: 'Market Intelligence', icon: TrendingUp },
  { id: 'screener', label: 'Stock Screener', icon: Search },
  { id: 'broker', label: 'Broker Analysis', icon: Users },
  { id: 'ai', label: 'AI Research', icon: Brain },
  { id: 'studio', label: 'Content Studio', icon: Pencil },
]

// Simple password auth gate
function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('nepse_auth') === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Password is checked against env var at build time, fallback to 'goxent2024'
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'goxent2024'
    if (password === correctPassword) {
      sessionStorage.setItem('nepse_auth', 'true')
      setAuthed(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (authed) return <>{children}</>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ width: 400 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <Lock size={40} style={{ color: 'var(--gold)', marginBottom: 16 }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>NEPSE Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Private access only. Enter your password.</p>
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
            <TrendingUp size={16} /> Access Dashboard
          </button>
        </div>
      </form>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('market')

  const handleLogout = () => {
    sessionStorage.removeItem('nepse_auth')
    window.location.reload()
  }

  return (
    <AuthGate>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: 260,
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
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--gold)' }}>NEPSE</span> Dashboard
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>
              by Anil Sunar · Goxent
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {TABS.map(tab => (
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
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
            <LogOut size={16} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: 260, padding: 32 }}>
          {activeTab === 'market' && <MarketOverview />}
          {activeTab === 'intel' && <MarketIntelligence />}
          {activeTab === 'screener' && <StockScreener />}
          {activeTab === 'broker' && <BrokerAnalysis />}
          {activeTab === 'ai' && <AIResearch />}
          {activeTab === 'studio' && <ContentStudio />}
        </main>
      </div>
    </AuthGate>
  )
}

export default App
