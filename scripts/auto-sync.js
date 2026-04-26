const { exec } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const run = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { cwd: ROOT }, (err, stdout, stderr) => {
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    if (err) reject(err)
    else resolve()
  })
})

async function main() {
  console.log('🔄 Starting Goxent daily sync —', new Date().toLocaleString())

  try {
    console.log('📡 Step 1: Fetching Sasto Share data...')
    await run('node scripts/sasto-analyzer.cjs')

    console.log('🤖 Step 2: Generating AI digest + sending email...')
    await run('node scripts/ai-digest.mjs')

    console.log('📦 Step 3: Committing to GitHub...')
    await run('git add src/app/data/')
    await run('git commit -m "chore: daily market sync ' + new Date().toISOString().split('T')[0] + '"')
    await run('git push')

    console.log('✅ Daily sync complete!', new Date().toLocaleString())
  } catch (err) {
    console.error('❌ Sync failed:', err.message)
    process.exit(1)
  }
}

main()
