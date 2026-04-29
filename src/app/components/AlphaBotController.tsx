import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Database, Shield, History, Terminal, AlertTriangle, CheckCircle2, Cpu, Activity, Zap, ExternalLink, Key } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ScrapedRecord {
  id: string;
  timestamp: string;
  index: string;
  changePct: string;
  sentiment: string;
  topPicks: Array<{ symbol: string; signal: string }>;
}

const GITHUB_REPO = 'Goxent/anilsunar'
const WORKFLOW_FILE = 'sasto-sync.yml'
const WORKFLOW_DISPATCH_URL = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`
const GITHUB_ACTIONS_URL = `https://github.com/${GITHUB_REPO}/actions`

export default function AlphaBotController() {
  const [pat, setPat] = useState(sessionStorage.getItem('github_pat') || '');
  const [isTriggering, setIsTriggering] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<ScrapedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, 'sasto_records'), orderBy('timestamp', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScrapedRecord[];
      setHistory(records);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    if (!pat) {
      setStatus({ type: 'error', message: 'GitHub PAT is required for secure authentication.' });
      return;
    }

    setIsTriggering(true);
    setStatus({ type: 'info', message: 'Handshaking with GitHub Cloud...' });
    sessionStorage.setItem('github_pat', pat);

    try {
      const response = await fetch(WORKFLOW_DISPATCH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Bot core initialized! Sync will commence in 15s.' });
      } else {
        const err = await response.json();
        setStatus({ type: 'error', message: `Uplink failed: ${err.message || 'Access Denied'}` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Satellite error: ${err.message}` });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-10 fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Alpha Bot Control</h2>
          <p className="text-zinc-500 mt-4 text-sm">Managing the automated market scraping core and historical record sync.</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 px-5 rounded-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Core Engine Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Command Center */}
        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-10 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                <Shield className="text-gold" size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Access Key</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3">GitHub Personal Access Token</label>
                <div className="relative">
                   <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                   <input 
                    type="password"
                    value={pat}
                    onChange={(e) => setPat(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-gold/50 outline-none transition-all font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                   <Info size={12} /> Requires repo & workflow scopes
                </div>
              </div>

              <button 
                onClick={handleTrigger}
                disabled={isTriggering}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
                   isTriggering ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gold text-black shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isTriggering ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                {isTriggering ? 'Engaging Link' : 'Trigger Global Sync'}
              </button>

              {status && (
                <div className={`p-5 rounded-2xl flex items-start gap-4 text-xs font-bold leading-relaxed border animate-fade-in ${
                  status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : 
                   status.type === 'error' ? <AlertTriangle size={18} className="shrink-0" /> : 
                   <Terminal size={18} className="shrink-0" />}
                  <span>{status.message}</span>
                </div>
              )}

              <a
                href={GITHUB_ACTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-zinc-700 hover:text-white transition-all group"
              >
                <Activity size={16} className="group-hover:text-gold transition-colors" /> View Satellite Telemetry <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="premium-card p-10 bg-zinc-900/10 border-dashed">
            <h4 className="font-black text-xs mb-6 flex items-center gap-3 uppercase tracking-[0.1em] text-zinc-500">
              <Cpu size={14} /> Protocol Lifecycle
            </h4>
            <div className="space-y-4">
              {[
                { step: '01', desc: 'Secure PAT Handshake' },
                { step: '02', desc: 'Action Dispatch (Main Branch)' },
                { step: '03', desc: 'Headless Scrape Cycle (~180s)' },
                { step: '04', desc: 'Neural Digest Generation' },
                { step: '05', desc: 'Cloud Data Commit & Patch' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gold/40">{item.step}</span>
                  <div className="h-px flex-1 bg-zinc-800/50" />
                  <span className="text-[11px] font-bold text-zinc-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History Radar */}
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card min-h-[600px]" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                   <History className="text-gold" size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Sync Telemetry</h3>
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Live Database Log</p>
                </div>
              </div>
              <button 
                onClick={fetchHistory}
                className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-600 hover:text-gold"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
                <RefreshCw size={48} className="animate-spin text-zinc-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Uplink...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Sync ID</th>
                      <th>Market Sentiment</th>
                      <th>Index Delta</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-white/5 transition-colors">
                        <td>
                           <div className="font-bold text-white text-sm">{record.id}</div>
                           <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{new Date(record.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td>
                           <span className="text-xs font-bold text-zinc-400">{record.sentiment}</span>
                        </td>
                        <td>
                           <span className={`text-lg font-black ${record.changePct.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                              {record.changePct}
                           </span>
                        </td>
                        <td className="text-right">
                           <span className="status-chip status-chip-success">ARCHIVED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 gap-8 text-center opacity-20">
                <Database size={64} className="text-zinc-500" />
                <div className="max-w-xs space-y-2">
                  <p className="text-xl font-black uppercase tracking-tighter">Database Silent</p>
                  <p className="text-xs font-bold uppercase tracking-widest">No historical sync packets detected in the current sector.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
