import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Database, Shield, History, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

export default function AlphaBotController() {
  const [pat, setPat] = useState(localStorage.getItem('github_pat') || '');
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
      setStatus({ type: 'error', message: 'GitHub PAT is required to trigger the bot.' });
      return;
    }

    setIsTriggering(true);
    setStatus({ type: 'info', message: 'Sending trigger signal to GitHub Actions...' });
    localStorage.setItem('github_pat', pat);

    try {
      const response = await fetch('https://api.github.com/repos/Goxent/anilsunar/actions/workflows/sasto-sync.yml/dispatches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Bot triggered successfully! It will start in 10-20 seconds.' });
      } else {
        const err = await response.json();
        setStatus({ type: 'error', message: `Trigger failed: ${err.message || 'Unknown error'}` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Network error: ${err.message}` });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Alpha Bot Controller</h2>
          <p className="text-zinc-400">Manage the automated Sasto Share scraper and review historical records.</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-2 px-4 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-500 uppercase tracking-wider">System Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-gold" size={20} />
              <h3 className="text-lg font-bold">Bot Authentication</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Github Fine-Grained PAT</label>
                <input 
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="github_pat_..."
                  className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm focus:border-gold outline-none transition-all"
                />
                <p className="text-[10px] text-zinc-500 mt-2">Required to trigger GitHub Actions remotely.</p>
              </div>

              <button 
                onClick={handleTrigger}
                disabled={isTriggering}
                className={`w-full btn ${isTriggering ? 'opacity-50 cursor-not-allowed' : 'btn-primary'} flex items-center justify-center gap-3 py-4`}
              >
                {isTriggering ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                {isTriggering ? 'Triggering...' : 'Trigger Manual Scraping'}
              </button>

              {status && (
                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : 
                   status.type === 'error' ? <AlertTriangle size={18} className="shrink-0" /> : 
                   <Terminal size={18} className="shrink-0" />}
                  <span>{status.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-zinc-900/20 border-dashed border-zinc-800">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-widest text-zinc-500">
              <Terminal size={14} /> Bot Specs
            </h4>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Engine</span>
                <span className="text-zinc-300">Playwright / Stealth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Environment</span>
                <span className="text-zinc-300">GitHub Runner (Ubuntu)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Frequency</span>
                <span className="text-zinc-300">Daily @ 12:15 PM UTC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <History className="text-gold" size={20} />
                <h3 className="text-lg font-bold">Database Records</h3>
              </div>
              <button 
                onClick={fetchHistory}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw size={32} className="animate-spin text-gold" />
                <p className="text-sm text-zinc-500">Fetching historical records...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="py-4 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                      <th className="py-4 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Index</th>
                      <th className="py-4 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Change</th>
                      <th className="py-4 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Sentiment</th>
                      <th className="py-4 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Picks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors group">
                        <td className="py-4 px-4 text-sm font-medium text-zinc-300">{record.id}</td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-bold text-white tracking-tight">{record.index}</span>
                        </td>
                        <td className={`py-4 px-4 text-sm font-bold ${record.changePct.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                          {record.changePct}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                            record.sentiment.includes('Bullish') ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                            record.sentiment.includes('Bearish') ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                            'border-zinc-500/20 text-zinc-500 bg-zinc-500/5'
                          }`}>
                            {record.sentiment.split(':')[1]?.trim() || 'Neutral'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            {record.topPicks?.map((pick, i) => (
                              <span key={i} className="text-[10px] bg-zinc-800 p-1 px-2 rounded-md text-zinc-400">
                                {pick.symbol}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Database size={48} className="text-zinc-800" />
                <div>
                  <p className="text-zinc-300 font-bold">No historical data yet</p>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto">Trigger the bot to start populating your historical market database.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
