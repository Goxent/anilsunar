import crypto from 'crypto';

// In-memory timestamp to rate limit triggers (serverless resets on cold start)
let lastTriggerTime = 0;

export default async function handler(req, res) {
  // 1. Handle Notion's verification challenge
  if (req.body && req.body.challenge) {
    console.log('✅ Notion verification challenge received.');
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // 2. Validate Request Signature
  const signature = req.headers['x-notion-signature'];
  const secret = process.env.NOTION_WEBHOOK_SECRET;

  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const bodyString = JSON.stringify(req.body);
    const digest = hmac.update(bodyString).digest('hex');

    if (digest !== signature) {
      console.warn('⚠️ Invalid Notion webhook signature.');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // 3. Trigger GitHub Actions Workflow
  const now = Date.now();
  if (now - lastTriggerTime < 60000) {
    console.log('⏳ Rebuild already triggered in the last 60s. Skipping.');
    return res.status(200).json({ triggered: false, reason: 'rate_limited' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_PAT;

  if (!owner || !repo || !token) {
    console.error('❌ GitHub environment variables missing (GITHUB_OWNER, GITHUB_REPO, GITHUB_PAT).');
    return res.status(200).json({ error: 'Config missing' }); // Return 200 to Notion to prevent retries
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/notion-sync.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Goxent-Notion-Webhook'
        },
        body: JSON.stringify({ ref: 'main' })
      }
    );

    if (response.ok) {
      console.log('🚀 GitHub workflow dispatch triggered successfully.');
      lastTriggerTime = now;
      return res.status(200).json({ triggered: true });
    } else {
      const errorText = await response.text();
      console.error(`❌ GitHub API error: ${response.status} ${errorText}`);
      return res.status(200).json({ triggered: false, error: 'github_api_error' });
    }
  } catch (error) {
    console.error('❌ Webhook trigger failed:', error.message);
    return res.status(200).json({ triggered: false, error: error.message });
  }
}
