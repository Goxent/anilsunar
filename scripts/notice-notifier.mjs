import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOTICES_PATH = path.join(__dirname, '../src/app/data/notices.json')
const POSTS_PATH = path.join(__dirname, '../src/app/data/notice_posts.json')

async function sendNoticeEmail() {
  const TO_EMAIL = process.env.TO_EMAIL || 'anil99senchury@gmail.com'
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    console.log('⚠️  No RESEND_API_KEY — skipping email')
    return
  }

  // Load data
  let noticesData = { notices: [] }
  let postsData = { posts: {} }

  try {
    noticesData = JSON.parse(fs.readFileSync(NOTICES_PATH, 'utf8'))
    postsData = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))
  } catch (e) {
    console.error('❌ Could not load data files')
    return
  }

  // Only email NEW notices
  const newNotices = (noticesData.notices || []).filter(n => n.isNew)

  if (newNotices.length === 0) {
    console.log('📭 No new notices — skipping email')
    return
  }

  const date = new Date().toLocaleDateString('en-NP', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Build notice cards HTML
  const noticeCards = newNotices.slice(0, 10).map((notice, i) => {
    const post = postsData.posts?.[notice.id]
    const bgColor = i % 2 === 0 ? '#1a1a2e' : '#16213e'

    return `
      <div style="background:${bgColor};border-radius:12px;
        padding:20px;margin-bottom:12px;border:1px solid #2d2d5e;">

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="background:${notice.badgeColor};color:white;
            padding:3px 10px;border-radius:20px;font-size:11px;
            font-weight:700;letter-spacing:0.05em;">
            ${notice.badge}
          </span>
          <span style="color:#64748b;font-size:11px;">${notice.category}</span>
        </div>

        <h3 style="color:#e2e8f0;font-size:15px;margin:0 0 8px;
          font-weight:700;line-height:1.4;">
          ${notice.title}
        </h3>

        <p style="color:#94a3b8;font-size:13px;margin:0 0 12px;
          line-height:1.6;">
          ${notice.summary}
        </p>

        ${post ? `
          <div style="background:#0f172a;border-left:3px solid
            ${notice.badgeColor};padding:12px;border-radius:0 8px 8px 0;
            margin-bottom:12px;">
            <p style="color:#f59e0b;font-size:11px;font-weight:700;
              margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">
              💼 LinkedIn Post Idea
            </p>
            <p style="color:#cbd5e1;font-size:13px;margin:0;
              font-style:italic;">
              "${post.headline}"
            </p>
          </div>
        ` : ''}

        <a href="${notice.link}"
          style="display:inline-block;background:${notice.badgeColor};
          color:white;padding:8px 16px;border-radius:6px;
          text-decoration:none;font-size:12px;font-weight:600;">
          Read Full Notice →
        </a>

        <span style="color:#475569;font-size:11px;margin-left:12px;">
          ${new Date(notice.detectedAt).toLocaleDateString('en-NP')}
        </span>
      </div>
    `
  }).join('')

  // Group by source for summary
  const sourceGroups = {}
  newNotices.forEach(n => {
    sourceGroups[n.source] = (sourceGroups[n.source] || 0) + 1
  })
  const sourceSummary = Object.entries(sourceGroups)
    .map(([src, count]) => `<span style="margin-right:8px;">• ${src}: ${count}</span>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<body style="background:#0d0d1a;font-family:Arial,sans-serif;
  color:#e2e8f0;margin:0;padding:0;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0d0d1a 100%);
    padding:40px 32px;text-align:center;
    border-bottom:2px solid rgba(212,175,55,0.3);">
    <div style="font-size:36px;margin-bottom:8px;">🔔</div>
    <h1 style="color:#f59e0b;font-size:26px;margin:0;font-weight:800;
      letter-spacing:0.05em;">
      GOXENT NOTICE ALERT
    </h1>
    <p style="color:#475569;margin:8px 0 0;font-size:13px;">
      ${date} · Nepal Regulatory Intelligence
    </p>
  </div>

  <div style="max-width:640px;margin:0 auto;padding:24px;">

    <!-- SUMMARY CARD -->
    <div style="background:#1a1a2e;border:1px solid rgba(212,175,55,0.3);
      border-radius:16px;padding:20px;margin-bottom:24px;">
      <h2 style="color:#f59e0b;margin:0 0 12px;font-size:16px;font-weight:700;">
        📊 Today's Regulatory Summary
      </h2>
      <p style="color:#e2e8f0;font-size:24px;font-weight:800;margin:0 0 8px;">
        ${newNotices.length} New Notice${newNotices.length !== 1 ? 's' : ''} Found
      </p>
      <div style="color:#94a3b8;font-size:12px;margin-top:8px;">
        ${sourceSummary}
      </div>
    </div>

    <!-- SOURCE BADGES -->
    <div style="margin-bottom:24px;display:flex;flex-wrap:wrap;gap:8px;">
      ${Object.entries(sourceGroups).map(([src, count]) => `
        <span style="background:rgba(255,255,255,0.05);border:1px solid
          rgba(255,255,255,0.1);padding:4px 12px;border-radius:20px;
          font-size:11px;color:#94a3b8;">
          ${src} (${count})
        </span>
      `).join('')}
    </div>

    <!-- NOTICE CARDS -->
    <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 16px;font-weight:700;">
      📋 New Notices
    </h2>
    ${noticeCards}

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0 16px;">
      <a href="https://app.anilsunar.com.np"
        style="display:inline-block;background:#f59e0b;color:#000;
        padding:14px 32px;border-radius:8px;text-decoration:none;
        font-weight:800;font-size:14px;letter-spacing:0.05em;">
        Open Goxent Dashboard →
      </a>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;padding:20px 0;
      border-top:1px solid #1e293b;margin-top:16px;">
      <p style="color:#334155;font-size:11px;margin:0;">
        Goxent Command Center · app.anilsunar.com.np<br>
        Automated regulatory intelligence for Nepal professionals
      </p>
    </div>

  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Goxent Alerts <alerts@anilsunar.com.np>',
        to: [TO_EMAIL],
        subject: `🔔 ${newNotices.length} New Regulatory Notice${newNotices.length !== 1 ? 's' : ''} — ${new Date().toLocaleDateString('en-NP')}`,
        html
      })
    })

    if (res.ok) {
      console.log(`✅ Alert email sent to ${TO_EMAIL}`)
    } else {
      const err = await res.json()
      console.error('❌ Resend error:', err)
    }
  } catch (e) {
    console.error('❌ Email send failed:', e.message)
  }

  // Mark notices as no longer new (so we don't email again)
  // We do this immediately after successful send
  noticesData.notices = noticesData.notices.map(n =>
    newNotices.find(nn => nn.id === n.id) 
      ? { ...n, isNew: false, emailedAt: new Date().toISOString() } 
      : n
  )
  
  // Also update a global lastSent timestamp to prevent rapid fire duplicates
  noticesData.lastEmailSentAt = new Date().toISOString()
  
  fs.writeFileSync(NOTICES_PATH, JSON.stringify(noticesData, null, 2))
  console.log(`✅ Marked ${newNotices.length} notices as emailed.`)
}

// Safety check: Don't run if we sent an email in the last 10 minutes (prevents race conditions)
function shouldSkip() {
  try {
    if (fs.existsSync(NOTICES_PATH)) {
      const data = JSON.parse(fs.readFileSync(NOTICES_PATH, 'utf8'))
      if (data.lastEmailSentAt) {
        const lastSent = new Date(data.lastEmailSentAt).getTime()
        const now = Date.now()
        if (now - lastSent < 10 * 60 * 1000) { // 10 mins
          return true
        }
      }
    }
  } catch (e) {}
  return false
}

if (shouldSkip()) {
  console.log('⏳ Email sent recently — skipping to prevent duplicates.')
} else {
  sendNoticeEmail().catch(console.error)
}
export { sendNoticeEmail }
