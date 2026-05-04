import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@app': path.resolve(__dirname, 'src/app'),
    }
  },
  optimizeDeps: {
    exclude: ['firebase-admin', 'playwright', '@playwright/test']
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          recharts: ['recharts'],
        }
      }
    },
    target: 'es2020',
    sourcemap: false
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Note: To use vercel functions locally, run 'vercel dev' which usually starts on 3000. But if Vite is on 3000, vercel dev might be on 3001. We'll set this up so we don't need a full server for now if we can help it.
        // Wait, vercel dev starts a separate server. We can also just use a simple express proxy or mock for the API if needed.
        // But for now, we can use an external URL or just point to localhost:3000 assuming vercel dev handles Vite.
        // Actually, Vercel dev wraps Vite. So `/api` requests go to Vercel, and the rest to Vite. We don't strictly need a proxy here if running via `vercel dev`.
        // However, if running `npm run dev` (vite), it won't have the API.
        // A common pattern is to run a local express server or use Vite plugins for Vercel. 
        // Let's proxy to the deployed Vercel app for local dev API if the local vercel server isn't running, but for security, we can't do that easily without auth.
        // Let's just point it to localhost:3001 and expect the user to run `vercel dev` instead of `npm run dev` if they need the APIs.
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
