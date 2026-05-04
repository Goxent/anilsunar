import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const hostname = window.location.hostname
const isApp = hostname === 'app.anilsunar.com.np' ||
  hostname.startsWith('app.') ||
  window.location.port === '3001'

async function boot() {
  if (isApp) {
    const { default: AppShell } = await import('./src/app/AppShell')
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode><AppShell /></React.StrictMode>
    )
  } else {
    const { default: App } = await import('./App')
    const { BrowserRouter, Routes, Route } = await import('react-router-dom')
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    )
  }
}

boot()