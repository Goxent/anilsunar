import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, Clock, RefreshCw, 
  Copy, ExternalLink, X, CheckCircle2, ChevronUp, 
  ChevronDown, Activity, Info, Zap, Star, Database, Terminal, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useMarketData, useToast } from '../AppShell';
import LoadingCard from './LoadingCard';
import sastoData from '../data/super_intelligence.json';

function parseMarketData(omniData: any) {
  if (!omniData) return null;
  const pages = omniData?.scrapedPages || [];
  
  // Find the EOD Summary page
  const eodPage = pages.find((p: any) => 
    p.title?.includes('EOD') || p.title?.includes('Summary') || 
    p.url?.includes('daily-summary')
  );
  
  const tables = eodPage?.tables || [];
  
  // Parse key-value rows (dynamic keys to handle 'NEPSE' vs 'Col_0')
  const kvData: Record<string, string> = {};
  tables.forEach((t: any) => {
    t.rows?.forEach((row: any) => {
      const keys = Object.keys(row);
      if (keys.length >= 2) {
        const label = row[keys[0]];
        const value = row[keys[1]];
        if (label && value) {
          kvData[label] = value;
        }
      }
    });
  });

  let advances = parseInt(kvData['Advances']) || 0;
  let declines = parseInt(kvData['Declines']) || 0;
  let unchanged = parseInt(kvData['Unchanged']) || 0;

  const stocksPage = pages.find((p: any) => 
    p.url?.includes('top-stocks') || p.title?.includes('Stock') || p.title?.includes('Home')
  );
  
  return {
    index: kvData['Current'] || 'N/A',
    date: kvData['Date'] || 'N/A',
    dailyGain: kvData['Daily Gain'] || '0.0%',
    turnover: kvData['Turnover'] || 'N/A',
    totalTurnover: kvData['Total Turnover'] || kvData['Turnover'] || 'N/A',
    advances,
    declines,
    unchanged,
    lastUpdated: omniData?.timestamp || null,
    stocksPage: stocksPage?.tables?.[0]?.rows || []
  };
}

function getAllPageData(omniData: any) {
  return (omniData?.scrapedPages || []).map((p: any) => ({
    title: p.title,
    url: p.url,
    rowCount: p.tables?.reduce((acc: number, t: any) => acc + (t.rows?.length || 0), 0) || 0
  }));
}

export default function MarketOverview() {
  const { showToast } = useToast();
  const { omniData, aiBrief, loading: omniLoading } = useMarketData();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Live Data State
  const [liveData, setLiveData] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/nepse-live');
        const data = await res.json();
        setLiveData(data);
      } catch (err) {
        console.error("Failed to fetch live tick", err);
      } finally {
        setLiveLoading(false);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (omniLoading || liveLoading) return <LoadingCard rows={8} cols={4} />;

  const data = parseMarketData(omniData);
  if (!data) return <LoadingCard rows={8} cols={4} />;
  
  const sources = getAllPageData(omniData);

  // Freshness calculation
  const lastSyncDate = data.lastUpdated ? new Date(data.lastUpdated) : null;
  const dataAgeHours = lastSyncDate ? Math.round((Date.now() - lastSyncDate.getTime()) / 3600000) : null;
  const formattedSyncDate = lastSyncDate ? lastSyncDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

  const isPositive = !data.dailyGain.startsWith('-');
  const isLiveFresh = liveData?.timestamp && (Date.now() - new Date(liveData.timestamp).getTime() < 600000); // 10 mins

  const copyCommand = () => {
    navigator.clipboard.writeText('npm run full-sync');
    setCopied(true);
    showToast("Command copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Freshness Banner */}
      <div className="fade-in">
        {(!dataAgeHours || dataAgeHours > 48) ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">⚠️ No market data — Run bot to sync</span>
            </div>
            <button onClick={() => setShowSyncModal(true)} className="text-xs font-bold underline">Sync Now</button>
          </div>
        ) : dataAgeHours >= 24 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">⏰ Data is {dataAgeHours}h old · Last sync: {formattedSyncDate}</span>
            </div>
            <button onClick={() => setShowSyncModal(true)} className="text-xs font-bold underline">Sync Now</button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">✅ Data from {formattedSyncDate} · NEPSE {data.date}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Market Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Live trends and institutional-grade analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setShowSyncModal(true)}
            className="btn btn-primary"
            style={{ padding: '12px 24px', borderRadius: 14 }}
          >
            <RefreshCw size={18} /> Trigger Sync
          </button>
        </div>
      </div>

      {/* SECTION 2: Hero Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: NEPSE Index */}
        <div className="premium-card" style={{ padding: 24 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>NEPSE Index</span>
            <TrendingUp size={16} color="var(--gold)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 900 }}>{liveData?.index || data.index}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: isPositive ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 800, fontSize: 14 }}>
              {isPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {liveData?.changePct || data.dailyGain}%
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>As of {data.date}</p>
        </div>

        {/* Card 2: Daily Turnover */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Turnover</span>
            <BarChart3 size={16} color="var(--info-color)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
             {liveData?.turnover ? `Rs. ${liveData.turnover}` : data.turnover}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Market Activity</p>
        </div>

        {/* Card 3: Market Breadth */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Breadth</span>
            <Activity size={16} color="var(--success-color)" />
          </div>
          <div style={{ display: 'flex', gap: 4, height: 10, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ flex: liveData?.breadth?.advances || data.advances || 1, background: 'var(--success-color)' }}></div>
            <div style={{ flex: liveData?.breadth?.unchanged || data.unchanged || 1, background: 'var(--text-secondary)' }}></div>
            <div style={{ flex: liveData?.breadth?.declines || data.declines || 1, background: 'var(--danger-color)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
            <span className="text-emerald-400">{liveData?.breadth?.advances || data.advances}▲</span>
            <span className="text-zinc-500">{liveData?.breadth?.unchanged || data.unchanged}</span>
            <span className="text-red-400">{liveData?.breadth?.declines || data.declines}▼</span>
          </div>
        </div>

        {/* Card 4: Daily Sentiment */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Sentiment</span>
            <Zap size={16} color="var(--gold)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ 
              fontSize: 24, fontWeight: 900, 
              color: (liveData?.breadth?.advances || data.advances) > (liveData?.breadth?.declines || data.declines) ? 'var(--success-color)' : 'var(--danger-color)' 
            }}>
              {(liveData?.breadth?.advances || data.advances) > (liveData?.breadth?.declines || data.declines) ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Based on Advance/Decline ratio</p>
        </div>
      </div>

      {/* SECTION 3: Main Data Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--gold)" /> Top Moving Stocks
            </h3>
            <span className="status-chip status-chip-info">Last Scraped</span>
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Change%</th>
                  <th>Volume</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.stocksPage.slice(0, 15).map((stock: any, i: number) => {
                  const symbol = stock.Symbol || stock.Col_1 || 'N/A';
                  const price = stock['Current Price'] || stock['Price(NPR)'] || '0';
                  const change = stock['Percent Change'] || stock['Change'] || '0%';
                  const volume = stock['Volume'] || '0';
                  const isUp = !change.startsWith('-');

                  const addToWatchlist = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const saved = localStorage.getItem('goxent_watchlist');
                    const list = saved ? JSON.parse(saved) : [];
                    if (list.find((item: any) => item.symbol === symbol)) {
                      showToast(`${symbol} is already in your watchlist`, 'info');
                      return;
                    }
                    const newItem = {
                      id: Date.now().toString(),
                      symbol,
                      addedAt: new Date().toISOString(),
                      alertAbove: null,
                      alertBelow: null,
                      notes: 'Added from Market Overview'
                    };
                    localStorage.setItem('goxent_watchlist', JSON.stringify([...list, newItem]));
                    showToast(`Added ${symbol} to watchlist`, 'success');
                  };
                  
                    const isTopPick = aiBrief?.topPicks?.find((p: any) => p.symbol === symbol);
 
                    return (
                      <tr key={i} className={isTopPick ? 'bg-gold/5' : ''}>
                        <td style={{ fontWeight: 800, color: 'var(--gold)' }}>
                          <div className="flex items-center gap-2">
                            {symbol}
                            {isTopPick && <Zap size={12} className="text-gold animate-pulse" title="Neural Top Pick" />}
                          </div>
                        </td>
                        <td>{price}</td>
                        <td style={{ color: isUp ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 800 }}>
                          {isUp ? '+' : ''}{change}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{volume}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-2">
                            {isTopPick && (
                              <div className="status-chip status-chip-success text-[8px] py-0.5 px-1.5" title={isTopPick.reason}>
                                ALPHA
                              </div>
                            )}
                            <button onClick={addToWatchlist} className="btn" style={{ padding: 6 }}>
                              <Star size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="premium-card">
            <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={16} color="var(--gold)" /> Intelligence Feed
            </h4>
            <div className="space-y-4">
              {sources.map((source: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{source.title}</span>
                    <span className="text-[10px] text-zinc-500 truncate w-32">{source.url}</span>
                  </div>
                  <span className="status-chip status-chip-info" style={{ fontSize: 9 }}>{source.rowCount} rows</span>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card bg-gold/5" style={{ borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Zap size={20} color="var(--gold)" />
              <h4 style={{ fontSize: 14, fontWeight: 800 }}>Quick Insight</h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {aiBrief?.marketSummary ? aiBrief.marketSummary.split('.')[0] + '.' : `Market breadth is currently ${ (liveData?.breadth?.advances / (liveData?.breadth?.declines || 1)).toFixed(2) }x in favor of ${ (liveData?.breadth?.advances > liveData?.breadth?.declines) ? 'bulls' : 'bears' }.`}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(12px)'
        }}>
          <div className="premium-card animate-fade-in" style={{ maxWidth: 450, position: 'relative', border: '1px solid var(--gold)', padding: 40 }}>
            <button 
              onClick={() => setShowSyncModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ 
                width: 70, height: 70, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
              }}>
                <RefreshCw size={32} className="text-gold animate-spin-slow" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Manual Intelligence Sync</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Remotely trigger the Alpha Bot on GitHub Actions. This will scrape Sasto Share and update the full intelligence database.
              </p>
            </div>

            <div style={{ background: '#0a0a0a', padding: 20, borderRadius: 12, marginBottom: 32, border: '1px solid var(--border)', position: 'relative' }}>
              <code style={{ color: 'var(--gold)', fontSize: 14, fontFamily: 'monospace' }}>npm run full-sync</code>
              <button 
                onClick={copyCommand}
                style={{ 
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--gold)', border: 'none', padding: '6px 12px',
                  borderRadius: 6, color: 'black', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => setShowSyncModal(false)}
              className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15, borderRadius: 12 }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
