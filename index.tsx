import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AppShell from './src/app/AppShell'
import './index.css'

const hostname = window.location.hostname

// If visiting app.anilsunar.com.np or localhost:3001 → show dashboard only
const isAppSubdomain = 
  hostname === 'app.anilsunar.com.np' || 
  hostname.startsWith('app.') ||
  window.location.port === '3001'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAppSubdomain ? (
      // App subdomain: render AppShell directly, no router needed
      <AppShell />
    ) : (
      // Main domain: render main website with /app fallback
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    )}
  </React.StrictMode>
)