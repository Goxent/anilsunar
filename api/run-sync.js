export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const authHeader = req.headers.authorization
  const expectedToken = process.env.SYNC_SECRET_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Return instructions since we cannot run Node scripts from Vercel edge
  return res.status(200).json({ 
    message: 'Sync initiated. Run npm run full-sync locally to update data.',
    lastDataTimestamp: null,
    nextSteps: ['Run: npm run full-sync', 'Data auto-pushes to GitHub', 'Vercel redeploys in ~1 min']
  })
}
