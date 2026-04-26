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
2. Generate AI market summary + LinkedIn ideas using Claude API
3. Send email digest to your inbox via Resend
4. Save to src/app/data/ folder
5. Commit and push to GitHub (Vercel auto-deploys)

## One-time Windows scheduler setup
Run this ONCE from your project folder:
  npm run setup-scheduler

After that, every day at 7:00 AM your PC will automatically:
1. Scrape Sasto Share for latest NEPSE data
2. Generate AI market summary + LinkedIn ideas
3. Send email to your inbox
4. Push updated data to GitHub → Vercel auto-deploys

Your PC must be on at 7:00 AM for this to work.
To change the time, delete and recreate: npm run remove-scheduler

## Environment variables needed in Vercel
VITE_DASHBOARD_PASSWORD=
VITE_GEMINI_API_KEY=
VITE_ANTHROPIC_API_KEY=
SASTO_EMAIL=
SASTO_PASSWORD=
RESEND_API_KEY=
TO_EMAIL=anil99senchury@gmail.com

## Local setup
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
