import dotenv from 'dotenv'
dotenv.config()

const testDigest = {
  marketSummary: 'This is a test email from Goxent Command Center. If you received this, your Resend integration is working correctly.',
  topPicks: [
    { symbol: 'NABIL', target: 'STRONG BUY', reason: 'Test pick — broker accumulation signal' },
    { symbol: 'NLIC', target: 'ACCUMULATE', reason: 'Test pick — high F-Score momentum' },
  ],
  linkedinIdeas: [
    { topic: 'NEPSE', title: 'Test LinkedIn Idea', hook: 'This is a test hook sentence.', bestTimeToPost: 'Morning' }
  ]
}

// Minimal versions of the functions for testing
async function getActiveSubscribers() {
  return []; // Return empty for test
}

async function sendDigestEmail(digest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'anil99senchury@gmail.com';

  if (!RESEND_API_KEY) {
    console.log('⚠️  No RESEND_API_KEY found — skipping email');
    return;
  }

  const recipients = [
    { email: TO_EMAIL, name: 'Anil Sunar' }
  ];

  console.log(`📧 Sending test digest to ${recipients.length} recipient(s)...`);

  const formatPicks = (picks) => (picks || []).slice(0, 10).map(pick => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
        <span style="color:#f59e0b;font-weight:bold;font-size:15px;">
          ${pick.symbol}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
        <span style="background:${
          pick.target === 'STRONG BUY' ? '#14532d' : 
          pick.target === 'BREAKOUT' ? '#1e3a5f' : '#451a03'
        };color:${
          pick.target === 'STRONG BUY' ? '#4ade80' : 
          pick.target === 'BREAKOUT' ? '#60a5fa' : '#fbbf24'
        };padding:3px 10px;border-radius:4px;font-size:11px;font-weight:bold;">
          ${pick.target}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e293b;
        color:#94a3b8;font-size:13px;">
        ${pick.reason}
      </td>
    </tr>
  `).join('')

  const formatLinkedIn = (ideas) => (ideas || []).map(idea => `
    <div style="background:#1a1a2e;border-left:3px solid #818cf8;
      border-radius:0 8px 8px 0;padding:16px;margin:10px 0;">
      <div style="margin-bottom:6px;">
        <span style="background:#312e81;color:#a5b4fc;padding:2px 8px;
          border-radius:10px;font-size:11px;">${idea.topic}</span>
        <span style="color:#64748b;font-size:11px;margin-left:8px;">
          Best: ${idea.bestTimeToPost}
        </span>
      </div>
      <p style="color:#e2e8f0;font-weight:bold;margin:4px 0;">
        ${idea.title}
      </p>
      <p style="color:#94a3b8;font-style:italic;font-size:13px;margin:4px 0;">
        "${idea.hook}"
      </p>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
  <html>
  <body style="background:#0d0d1a;font-family:Arial,sans-serif;
    color:#e2e8f0;padding:0;margin:0;">
    
    <div style="background:linear-gradient(135deg,#1a1a2e,#0d0d1a);
      padding:40px 32px;text-align:center;border-bottom:1px solid #f59e0b33;">
      <div style="font-size:32px;margin-bottom:8px;">⚡</div>
      <h1 style="color:#f59e0b;font-size:24px;margin:0;letter-spacing:0.1em;">
        GOXENT ALPHA BRIEF (TEST)
      </h1>
      <p style="color:#475569;margin:8px 0 0;font-size:13px;">
        ${new Date().toLocaleDateString('en-NP', {
          weekday:'long',year:'numeric',month:'long',day:'numeric'
        })} · NEPSE Command Center
      </p>
    </div>

    <div style="max-width:640px;margin:0 auto;padding:24px;">

      <div style="background:#1a1a2e;border:1px solid #f59e0b44;
        border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#f59e0b;margin:0 0 12px;font-size:16px;">
          📊 Market Summary
        </h2>
        <p style="color:#cbd5e1;line-height:1.8;margin:0;">
          ${digest.marketSummary}
        </p>
      </div>

      <h2 style="color:#4ade80;font-size:16px;margin:0 0 12px;">
        🎯 Top 10 High-Probability Picks
      </h2>
      <table style="width:100%;border-collapse:collapse;
        background:#1a1a2e;border-radius:12px;overflow:hidden;
        margin-bottom:24px;">
        <thead>
          <tr style="background:#0f172a;">
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">SYMBOL</th>
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">SIGNAL</th>
            <th style="padding:12px 16px;text-align:left;
              color:#64748b;font-size:12px;font-weight:600;">REASON</th>
          </tr>
        </thead>
        <tbody>${formatPicks(digest.topPicks)}</tbody>
      </table>

      <h2 style="color:#818cf8;font-size:16px;margin:0 0 12px;">
        ✍️ LinkedIn Content Ideas
      </h2>
      ${formatLinkedIn(digest.linkedinIdeas)}

      <div style="text-align:center;padding:24px 0 8px;
        border-top:1px solid #1e293b;margin-top:24px;">
        <a href="https://app.anilsunar.com.np" 
          style="color:#f59e0b;text-decoration:none;font-size:13px;">
          Open Goxent Command Center →
        </a>
        <p style="color:#334155;font-size:11px;margin:8px 0 0;">
          Goxent · anilsunar.com.np
        </p>
      </div>
    </div>
  </body>
  </html>`

  for (const recipient of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Goxent Brief <brief@anilsunar.com.np>',
        to: [recipient.email],
        subject: `🧪 TEST: Goxent Daily Brief — ${new Date().toLocaleDateString('en-NP')}`,
        html
      })
    });
    if (res.ok) {
      console.log(`✅ Test email sent to ${recipient.email}`);
    } else {
      const err = await res.json();
      console.error(`❌ Test failed for ${recipient.email}:`, err);
    }
  }
}

sendDigestEmail(testDigest);
