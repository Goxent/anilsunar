import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOTICES_PATH = path.join(__dirname, '../src/app/data/notices.json')

let content = fs.readFileSync(NOTICES_PATH, 'utf8')

// Brutal cleanup of common git conflict patterns in this file
content = content.replace(/<<<<<<< HEAD[\s\S]*?=======/g, '"isNew": false')
content = content.replace(/=======[\s\S]*?>>>>>>> [a-f0-9]+/g, '')
// Clean up double commas or trailing commas that might result
content = content.replace(/,(\s*[\]}])/g, '$1')
content = content.replace(/,,/g, ',')

fs.writeFileSync(NOTICES_PATH, content)

try {
    const data = JSON.parse(fs.readFileSync(NOTICES_PATH, 'utf8'))
    data.notices = data.notices.map(n => ({ ...n, isNew: false }))
    data.newCount = 0
    fs.writeFileSync(NOTICES_PATH, JSON.stringify(data, null, 2))
    console.log("✅ Successfully cleaned and validated notices.json")
} catch (e) {
    console.error("❌ Still failed to parse JSON:", e.message)
    // If all else fails, write a minimal valid file to unblock
    const minimal = { lastUpdated: new Date().toISOString(), notices: [] }
    fs.writeFileSync(NOTICES_PATH, JSON.stringify(minimal, null, 2))
    console.log("⚠️ Reset to minimal notices.json to fix corruption")
}
