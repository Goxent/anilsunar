import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Download, 
  Search, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  ShieldAlert,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useMarketData } from '../AppShell';

// Optional datasets
import fundamentalData from '../data/fundamental-data.json';
import technicalData from '../data/technical-signals.json';
import brokerData from '../data/broker-flow-5d.json';

// Types
type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function StockScreener() {
  const { omniData } = useMarketData();
  
  // State
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [signalFilter, setSignalFilter] = useState('All');
  const [timeframe, setTimeframe] = useState<'Daily'|'Weekly'|'Monthly'>('Daily'); // Future proofing
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // 1. Build Combined Dataset
  const combinedData = useMemo(() => {
    if (!omniData || !omniData.structured) return [];

    const stocks = omniData.structured.topStocks || [];
    const fundMap = new Map((fundamentalData?.stocks || []).map((s: any) => [s.symbol, s]));
    const techMap = new Map((technicalData?.stocks || []).map((s: any) => [s.symbol, s]));
    const brokerMap = new Map((brokerData?.brokerFlow || []).map((s: any) => [s.symbol, s]));
    const swingMap = new Map((omniData.structured.swingSignals || []).map((s: any) => [s.symbol, s]));
    
    // Attempt to extract sector map from scrapedPages if missing from topStocks directly
    const sectorMap = new Map();
    (omniData.scrapedPages || []).forEach((page: any) => {
      (page.tables || []).forEach((table: any) => {
        (table.rows || []).forEach((row: any) => {
          const sym = row['Symbol'] || row['Stock Symbol'] || row.Col_0;
          const sec = row['Sector'];
          if (sym && sec) sectorMap.set(sym.toUpperCase(), sec);
        });
      });
    });

    return stocks.map((s: any) => {
      const sym = s.symbol.toUpperCase();
      const fund = fundMap.get(sym) || {};
      const tech = techMap.get(sym) || {};
      const bro = brokerMap.get(sym) || {};
      const swing = swingMap.get(sym) || {};
      
      const price = parseFloat(String(s.ltp).replace(/,/g, '')) || 0;
      const vol = parseInt(String(s.volume).replace(/,/g, '')) || 0;
      
      return {
        symbol: sym,
        sector: sectorMap.get(sym) || 'Unknown',
        price: price,
        change: s.change || '0%',
        volume: vol,
        pe: fund.pe ? parseFloat(fund.pe) : null,
        pb: fund.pb ? parseFloat(fund.pb) : null,
        eps: fund.eps ? parseFloat(fund.eps) : null,
        techScore: tech.score || 0,
        techSignal: tech.recommendation || 'NEUTRAL',
        brokerNet: bro.netQty || 0,
        brokerSentiment: bro.sentiment || 'NEUTRAL',
        swingSignal: swing.signal || 'None'
      };
    });
  }, [omniData]);

  // 2. Extract unique filters
  const sectors = useMemo(() => ['All', ...Array.from(new Set(combinedData.map(d => d.sector))).filter(s => s !== 'Unknown').sort()], [combinedData]);
  const signals = ['All', 'STRONG_BUY', 'BUY', 'ACCUMULATE', 'NEUTRAL', 'AVOID', 'SELL'];

  // 3. Filter Data
  const filteredData = useMemo(() => {
    return combinedData.filter(d => {
      const matchSearch = d.symbol.includes(search.toUpperCase());
      const matchSector = sectorFilter === 'All' || d.sector === sectorFilter;
      const matchSignal = signalFilter === 'All' || d.techSignal === signalFilter;
      return matchSearch && matchSector && matchSignal;
    });
  }, [combinedData, search, sectorFilter, signalFilter]);

  // 4. Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (aVal === null) aVal = sortConfig.direction === 'asc' ? Infinity : -Infinity;
      if (bVal === null) bVal = sortConfig.direction === 'asc' ? Infinity : -Infinity;
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Handlers
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-600" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-accent-400" /> : <ArrowDown size={14} className="text-accent-400" />;
  };

  const exportCSV = () => {
    if (sortedData.length === 0) return;
    const headers = Object.keys(sortedData[0]).join(',');
    const rows = sortedData.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goxent_screener_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // Render Helpers
  const formatNum = (n: number | null) => n !== null && !isNaN(n) ? n.toLocaleString() : '—';
  const getSignalColor = (sig: string) => {
    if (sig.includes('BUY')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (sig.includes('ACCUMULATE')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (sig.includes('SELL') || sig.includes('DISTRIBUTION')) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (sig.includes('AVOID')) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  if (!omniData || combinedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-white/5 bg-surface-900/30 rounded-2xl">
        <ShieldAlert className="text-slate-500 mb-4" size={48} />
        <h3 className="text-xl text-slate-300 font-medium">No Data Available</h3>
        <p className="text-slate-500 mt-2">Run the Omni Crawler to populate the screener.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-surface-900 border border-white/5 rounded-2xl overflow-hidden">
      
      {/* HEADER & CONTROLS */}
      <div className="p-5 border-b border-white/5 bg-surface-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search symbol..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent-400 w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select 
              value={sectorFilter} 
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={signalFilter} 
              onChange={(e) => setSignalFilter(e.target.value)}
              className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
            >
              {signals.map(s => <option key={s} value={s}>{s === 'All' ? 'All Signals' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Toggle (Future Proofing) */}
          <div className="flex bg-surface-900 border border-white/10 rounded-lg p-1">
            {['Daily', 'Weekly', 'Monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === tf ? 'bg-accent-400 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Download size={16} />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-950 sticky top-0 z-10 text-slate-400 font-medium text-xs uppercase tracking-wider shadow-sm">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('symbol')}>
                <div className="flex items-center gap-2">Symbol {getSortIcon('symbol')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('price')}>
                <div className="flex items-center justify-end gap-2">LTP {getSortIcon('price')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('change')}>
                <div className="flex items-center justify-end gap-2">% Chg {getSortIcon('change')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('volume')}>
                <div className="flex items-center justify-end gap-2">Volume {getSortIcon('volume')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('pe')}>
                <div className="flex items-center justify-end gap-2">P/E {getSortIcon('pe')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('techScore')}>
                <div className="flex items-center gap-2">Tech Score {getSortIcon('techScore')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('techSignal')}>
                <div className="flex items-center gap-2">Signal {getSortIcon('techSignal')}</div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('brokerNet')}>
                <div className="flex items-center justify-end gap-2">Broker Flow {getSortIcon('brokerNet')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {sortedData.map((row: any, i: number) => (
              <tr key={row.symbol} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-3">
                  <div className="font-semibold text-white">{row.symbol}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[120px]">{row.sector}</div>
                </td>
                <td className="px-6 py-3 text-right font-medium">{formatNum(row.price)}</td>
                <td className={`px-6 py-3 text-right font-medium ${String(row.change).includes('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {row.change}
                </td>
                <td className="px-6 py-3 text-right">{formatNum(row.volume)}</td>
                <td className="px-6 py-3 text-right text-slate-400">{row.pe ? row.pe.toFixed(1) : '—'}</td>
                
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-surface-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${row.techScore > 65 ? 'bg-emerald-500' : row.techScore < 40 ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.max(0, Math.min(100, row.techScore))}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{row.techScore}</span>
                  </div>
                </td>
                
                <td className="px-6 py-3">
                  <span className={`px-2.5 py-1 rounded border text-xs font-semibold ${getSignalColor(row.techSignal)}`}>
                    {row.techSignal.replace('_', ' ')}
                  </span>
                </td>

                <td className="px-6 py-3 text-right">
                  <div className={`font-medium ${row.brokerNet > 0 ? 'text-blue-400' : row.brokerNet < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {row.brokerNet > 0 ? '+' : ''}{formatNum(row.brokerNet)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                    {row.brokerSentiment.replace('_', ' ')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedData.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No stocks match your filters.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/5 bg-surface-950 text-xs text-slate-500 flex justify-between items-center">
        <div>Showing {sortedData.length} of {combinedData.length} stocks</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1"><Activity size={12}/> Timeframe: {timeframe}</div>
        </div>
      </div>

    </div>
  );
}
