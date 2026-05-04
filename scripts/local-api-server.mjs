import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '../api');

// Dynamically load all Vercel serverless functions from the /api folder
async function mountApiRoutes() {
  if (!fs.existsSync(apiDir)) return;
  
  const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
  
  for (const file of files) {
    const routeName = `/api/${file.replace('.js', '').replace('.mjs', '')}`;
    const modulePath = `file://${path.join(apiDir, file)}`;
    
    try {
      const module = await import(modulePath);
      const handler = module.default;
      
      if (typeof handler === 'function') {
        app.all(routeName, async (req, res) => {
          try {
            await handler(req, res);
          } catch (err) {
            console.error(`Error in ${routeName}:`, err);
            if (!res.headersSent) res.status(500).json({ error: err.message });
          }
        });
        console.log(`🔌 Mounted local API route: ${routeName}`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to mount ${file}:`, err.message);
    }
  }
}

const PORT = 3001;

mountApiRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Local API Server running on http://localhost:${PORT}`);
    console.log(`👉 Your Vite app on port 3000 will automatically proxy /api to this server.`);
  });
});
