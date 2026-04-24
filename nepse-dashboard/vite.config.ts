import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-simulator',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/nepse-live') {
            res.setHeader('Content-Type', 'application/json');
            // Simulating the response from api/nepse-live.js
            res.end(JSON.stringify({
              timestamp: new Date().toISOString(),
              index: 2787.15,
              change: 12.45,
              changePct: 0.45,
              turnover: 1250000000,
              volume: 4500000,
              breadth: { advances: 145, declines: 82, unchanged: 12 },
              topGainers: [],
              topLosers: []
            }));
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
})
