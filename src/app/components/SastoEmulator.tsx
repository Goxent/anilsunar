import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Maximize, AlertCircle } from 'lucide-react';

export default function SastoEmulator() {
  const [key, setKey] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            Sasto Share Emulator
            <span className="badge badge-gold" style={{ fontSize: 10 }}>BETA</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Log in directly to access premium features.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setKey(prev => prev + 1)}
            className="btn"
            style={{ padding: '8px 16px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <a 
            href="https://nepsealpha.com/login" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <ExternalLink size={14} /> Open in New Tab
          </a>
        </div>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ 
          background: 'rgba(212, 175, 55, 0.05)', 
          padding: '12px 24px', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <AlertCircle size={16} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> Some functions may be restricted by the site's security policy. If it fails to load, use the "Open in New Tab" button.
          </span>
        </div>
        
        <iframe
          key={key}
          src="https://nepsealpha.com/login"
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          title="Sasto Share Emulator"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
