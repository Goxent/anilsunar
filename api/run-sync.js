export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const authHeader = req.headers.authorization
  const expectedToken = process.env.SYNC_SECRET_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const githubPat = process.env.GITHUB_PAT
  const repoOwner = 'Goxent'
  const repoName = 'anilsunar'
  
  if (!githubPat) {
    return res.status(500).json({ error: 'GITHUB_PAT not configured on server.' })
  }

  const { syncType } = req.body || {}
  // Map internal syncType to GitHub pipeline input
  const pipelineMap = {
    'all': 'full',
    'notices': 'news-only',
    'ai': 'ai-only'
  }
  const pipeline = pipelineMap[syncType] || 'full'

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/daily-sync.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { pipeline }
      })
    })

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      console.error('GitHub API Error:', errText)
      return res.status(ghRes.status).json({ error: `GitHub API error: ${ghRes.statusText}` })
    }

    return res.status(200).json({ 
      message: 'Sync triggered successfully on GitHub Actions.',
      pipeline,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Fetch error:', err)
    return res.status(500).json({ error: 'Internal server error triggering sync.' })
  }
}
