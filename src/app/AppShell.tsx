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
import AdminDashboard from '../../components/AdminDashboard'

const NAV_GROUPS = [
  {
    id: 'nepse',
    label: 'NEPSE Analysis',
    color: '#4ADE80',
    icon: TrendingUp,
    tabs: [
      { id: 'market', label: 'Market Overview', icon: LayoutDashboard, component: MarketOverview },
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
    ]
  }
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
  const [activeTab, setActiveTab] = useState('market')

  const handleLogout = () => {
    sessionStorage.removeItem('app_auth')
    window.location.reload()
  }

  // Find the active component across all groups
  const allTabs = NAV_GROUPS.flatMap(group => group.tabs)
  const activeTabInfo = allTabs.find(t => t.id === activeTab)
  const ActiveComponent = activeTabInfo?.component || MarketOverview

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

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
            {NAV_GROUPS.map((group, idx) => (
              <div key={group.id}>
                <NavGroupSection group={group} activeTab={activeTab} setActiveTab={setActiveTab} />
                {idx < NAV_GROUPS.length - 1 && (
                  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px' }}>
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
    </AuthGate>
  )
}
