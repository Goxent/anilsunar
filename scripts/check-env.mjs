import dotenv from 'dotenv'
dotenv.config()

const required = [
  'VITE_DASHBOARD_PASSWORD',
  'VITE_ANTHROPIC_API_KEY', 
  'SASTO_EMAIL',
  'SASTO_PASSWORD',
  'RESEND_API_KEY',
  'TO_EMAIL'
]

const optional = ['VITE_GEMINI_API_KEY']

console.log('\n🔍 Checking environment variables...\n')
let allGood = true

required.forEach(key => {
  const val = process.env[key]
  if (!val || val.includes('your_')) {
    console.log(`❌ MISSING: ${key}`)
    allGood = false
  } else {
    console.log(`✅ OK: ${key} = ${val.slice(0,6)}...`)
  }
})

optional.forEach(key => {
  const val = process.env[key]
  console.log(`${val ? '✅' : '⚠️ '} OPTIONAL: ${key}`)
})

console.log(allGood ? '\n✅ All required vars set!\n' : '\n❌ Fix missing vars in .env before running bots\n')
if (!allGood) process.exit(1)
