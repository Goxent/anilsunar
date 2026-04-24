import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  ShieldCheck, 
  PenTool, 
  Briefcase, 
  FolderGit2 
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'goxent2024';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid access code.');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // In a real scenario, this would call a Vercel Deploy Hook or a backend API
    // For now, we simulate a sync
    setTimeout(() => {
      setIsSyncing(false);
      alert('Sync triggered! If configured, your site will rebuild with the latest Notion data in a few minutes.');
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-luxury-950 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-luxury-900 border border-white/10 p-10 rounded-[40px] shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gold-500/10 rounded-2xl border border-gold-500/20">
              <ShieldCheck className="text-gold-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-white text-center mb-2">Admin Terminal</h1>
          <p className="text-slate-400 text-center mb-10 text-sm">Enter your secure access code to manage Goxent Portfolio.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Code"
                className="w-full bg-luxury-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-gold-500/50 outline-none transition-all placeholder:text-slate-700"
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-3 ml-2">{error}</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-gold-500 text-luxury-950 font-bold py-4 rounded-2xl hover:bg-gold-400 transition-all active:scale-[0.98]"
            >
              Access Dashboard
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full text-slate-500 text-sm hover:text-white transition-colors"
            >
              Back to Site
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 text-gold-500 mb-2">
              <LayoutDashboard size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Control Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white">Portfolio Admin</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync from Notion'}
            </button>
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
            >
              <LogOut size={16} />
              Exit Admin
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Notion Databases */}
          <div className="md:col-span-2 space-y-8">
            <section className="bg-luxury-900 border border-white/5 rounded-[40px] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <Database className="text-gold-500" size={24} />
                <h2 className="text-2xl font-serif text-white">Content Databases</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DatabaseLink 
                  title="Writing & Posts" 
                  description="Manage your articles and poems." 
                  icon={<PenTool />} 
                  url={`https://www.notion.so/${import.meta.env.VITE_NOTION_POSTS_DB_ID || ''}`}
                />
                <DatabaseLink 
                  title="Experience" 
                  description="Update your career timeline." 
                  icon={<Briefcase />} 
                  url={`https://www.notion.so/${import.meta.env.VITE_NOTION_EXPERIENCE_DB_ID || ''}`}
                />
                <DatabaseLink 
                  title="Projects" 
                  description="Add new technical builds." 
                  icon={<FolderGit2 />} 
                  url={`https://www.notion.so/${import.meta.env.VITE_NOTION_PROJECTS_DB_ID || ''}`}
                />
              </div>
              
              <div className="mt-10 p-6 rounded-3xl bg-gold-500/5 border border-gold-500/10">
                <h4 className="text-gold-400 font-bold text-sm mb-2">Pro Tip</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  When you update content in Notion, remember to click the <strong>"Sync from Notion"</strong> button above to trigger a fresh build of your website.
                </p>
              </div>
            </section>
          </div>

          {/* Quick Links & Status */}
          <div className="space-y-8">
            <section className="bg-luxury-900 border border-white/5 rounded-[40px] p-8">
              <h3 className="text-xl font-serif text-white mb-6">Quick Links</h3>
              <div className="space-y-4">
                <QuickLink label="Vercel Dashboard" url="https://vercel.com/dashboard" />
                <QuickLink label="GitHub Repository" url="https://github.com/anil-sunar/anil-sunar---portfolio" />
                <QuickLink label="Google Analytics" url="https://analytics.google.com" />
              </div>
            </section>

            <section className="bg-luxury-900 border border-white/5 rounded-[40px] p-8">
              <h3 className="text-xl font-serif text-white mb-6">System Status</h3>
              <div className="space-y-4">
                <StatusItem label="CMS Connection" status="Active" active />
                <StatusItem label="Market Bot" status="Operational" active />
                <StatusItem label="Last Build" status="2 hours ago" active={false} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatabaseLink: React.FC<{ title: string; description: string; icon: React.ReactNode, url: string }> = ({ title, description, icon, url }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-gold-500/30 hover:bg-white/10 transition-all group"
  >
    <div className="text-gold-500/50 group-hover:text-gold-500 mb-4 transition-colors">
      {icon}
    </div>
    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
      {title} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </h4>
    <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
  </a>
);

const QuickLink: React.FC<{ label: string; url: string }> = ({ label, url }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex justify-between items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-sm group"
  >
    <span className="text-slate-400 group-hover:text-white">{label}</span>
    <ExternalLink size={14} className="text-slate-600 group-hover:text-gold-500" />
  </a>
);

const StatusItem: React.FC<{ label: string; status: string; active: boolean }> = ({ label, status, active }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-slate-500">{label}</span>
    <div className="flex items-center gap-2">
      {active && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>}
      <span className={`text-xs font-bold ${active ? 'text-green-500' : 'text-slate-400'}`}>{status}</span>
    </div>
  </div>
);

export default AdminDashboard;
