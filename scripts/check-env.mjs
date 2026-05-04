import dotenv from 'dotenv'
dotenv.config()

const required = ['VITE_GEMINI_API_KEY','SASTO_EMAIL','SASTO_PASSWORD']
const optional = ['ANTHROPIC_API_KEY','RESEND_API_KEY','TO_EMAIL',
  'VITE_FIREBASE_API_KEY','VITE_DASHBOARD_PASSWORD']

console.log('\n🔍 Environment Check\n')
let ok = true

required.forEach(k => {
  const v = process.env[k]
  if (!v) { console.log(`❌ MISSING (required): ${k}`); ok = false }
  else console.log(`✅ OK: ${k} = ${v.slice(0,6)}...`)
})

optional.forEach(k => {
  const v = process.env[k]
  console.log(`${v ? '✅' : '⚠️ '} ${v ? 'OK' : 'NOT SET'} (optional): ${k}`)
})

if (!ok) {
  console.log('\n❌ Fix missing required vars before running bots\n')
  process.exit(1)
} else {
  console.log('\n✅ All required vars present — ready to sync!\n')
}
