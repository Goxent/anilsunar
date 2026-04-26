# anilsunar.com.np

Personal website + private app for NEPSE analysis and content creation.

## Sites
- anilsunar.com.np — Main portfolio site
- app.anilsunar.com.np — Private app (password protected)

## Daily workflow
Run this every morning before market opens:
  npm run daily-sync

This will:
1. Login to Sasto Share and scrape latest NEPSE data
2. Generate AI analysis + content ideas using Claude API
3. Save to src/app/data/ folder
4. Commit and push to GitHub (Vercel auto-deploys)

## Environment variables needed in Vercel
VITE_DASHBOARD_PASSWORD=
VITE_GEMINI_API_KEY=
VITE_ANTHROPIC_API_KEY=
SASTO_EMAIL=
SASTO_PASSWORD=

## Local setup
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
