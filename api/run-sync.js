export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const authHeader = req.headers.authorization
  const expectedToken = process.env.SYNC_SECRET_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Return instructions since we cannot run Node scripts from Vercel edge/serverless without heavy setup
  return res.status(200).json({ 
    message: 'Sync instructions triggered.',
    nextSteps: [
      'Run: npm run full-sync locally to update the data lake',
      'The bot will scrape Sasto Share and generate AI Digest',
      'Data auto-pushes to GitHub',
      'Vercel redeploys automatically'
    ],
    timestamp: new Date().toISOString()
  })
}
