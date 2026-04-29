import React from 'react'

export default function LoadingCard({ rows = 5, cols = 3 }: { rows?: number, cols?: number }) {
  return (
    <div className="premium-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <div className="skeleton-pulse" style={{ width: 56, height: 56, borderRadius: 16 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div className="skeleton-pulse" style={{ width: '35%', height: 24, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: '15%', height: 16, borderRadius: 4 }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            {Array.from({ length: cols }).map((_, j) => (
              <div 
                key={j} 
                className="skeleton-pulse" 
                style={{ 
                  flex: 1, 
                  height: 48, 
                  borderRadius: 12,
                  opacity: 1 - (j * 0.15)
                }} 
              />
            ))}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skeleton-pulse {
          0% { background-color: rgba(255, 255, 255, 0.02); }
          50% { background-color: rgba(255, 255, 255, 0.06); }
          100% { background-color: rgba(255, 255, 255, 0.02); }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  )
}
