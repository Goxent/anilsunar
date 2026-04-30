import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOTICES_PATH = path.join(__dirname, '../src/app/data/notices.json')

try {
  const data = JSON.parse(fs.readFileSync(NOTICES_PATH, 'utf8'))
  const newCount = data.notices.filter(n => n.isNew).length
  
  data.notices = data.notices.map(n => ({ ...n, isNew: false }))
  data.newCount = 0
  
  fs.writeFileSync(NOTICES_PATH, JSON.stringify(data, null, 2))
  console.log(`✅ Fixed ${newCount} notices (marked as not new).`)
} catch (e) {
  console.error('❌ Error fixing notices:', e.message)
}
