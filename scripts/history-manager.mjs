import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, '../src/app/data/history');
const ROLLING_DIR = path.join(__dirname, '../src/app/data/rolling');

// Utility: Ensure directories exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Utility: Get Nepal Date String (UTC+5:45)
function getNepalDateString(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const utcMs = d.getTime();
  const nepalMs = utcMs + (5.75 * 60 * 60 * 1000);
  const nd = new Date(nepalMs);
  
  const yyyy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nd.getUTCDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

export function saveSnapshot(data) {
  try {
    ensureDir(HISTORY_DIR);
    const todayStr = getNepalDateString();
    const filePath = path.join(HISTORY_DIR, `${todayStr}.json`);

    if (fs.existsSync(filePath)) {
      console.log(`ℹ️ Snapshot already exists for today (${todayStr}). Skipping.`);
      return;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`📅 Snapshot saved for ${todayStr}`);
  } catch (error) {
    console.error(`❌ Error saving snapshot: ${error.message}`);
  }
}

export function loadHistory(days = 30) {
  try {
    ensureDir(HISTORY_DIR);
    const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json'));
    
    // Sort oldest to newest based on filename
    files.sort((a, b) => a.localeCompare(b));
    
    // Take the last 'days' files
    const targetFiles = files.slice(-days);
    
    const history = [];
    for (const file of targetFiles) {
      const filePath = path.join(HISTORY_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        history.push(JSON.parse(content));
      } catch (e) {
        console.error(`⚠️ Failed to parse history file ${file}: ${e.message}`);
      }
    }
    
    return history;
  } catch (error) {
    console.error(`❌ Error loading history: ${error.message}`);
    return [];
  }
}

export function pruneOldHistory(keepDays = 90) {
  try {
    ensureDir(HISTORY_DIR);
    const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json'));
    
    const todayDateStr = getNepalDateString();
    const todayDate = new Date(todayDateStr);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const fileDateStr = file.replace('.json', '');
      const fileDate = new Date(fileDateStr);
      
      const diffTime = todayDate.getTime() - fileDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > keepDays) {
        fs.unlinkSync(path.join(HISTORY_DIR, file));
        deletedCount++;
      }
    }
    
    console.log(`🗑️ Pruned ${deletedCount} old history file(s).`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Error pruning history: ${error.message}`);
    return 0;
  }
}

export function buildRollingView(history) {
  try {
    ensureDir(ROLLING_DIR);
    
    const extractedData = history.map(day => {
      const dateStr = getNepalDateString(day.timestamp);
      let stocks = [];
      
      const pages = day.scrapedPages || [];
      const stocksPage = pages.find(p => 
        p.url?.includes('top-stocks') || p.title?.includes('Stock') || p.title?.includes('Home')
      );
      
      if (stocksPage && stocksPage.tables && stocksPage.tables.length > 0) {
        // Collect rows across all tables on that page to capture top stocks
        let allRows = [];
        for (const t of stocksPage.tables) {
           allRows = allRows.concat(t.rows || []);
        }
        
        // Map to structured format
        stocks = allRows
          .filter(r => r.Symbol || r.Col_1 || r['Symbol/Name'])
          .map(r => ({
            symbol: r.Symbol || r.Col_1 || r['Symbol/Name'] || '',
            ltp: r['Current Price'] || r['Price(NPR)'] || r.LTP || '0',
            change: r['Percent Change'] || r['Change'] || r['% Change'] || '0%',
            volume: r['Volume'] || '0',
            turnover: r['Turnover'] || '0'
          }))
          .filter(s => s.symbol !== '');
      }
      
      return {
        date: dateStr,
        stocks
      };
    });
    
    const weeklyData = extractedData.slice(-5);
    const monthlyData = extractedData.slice(-20);
    
    fs.writeFileSync(path.join(ROLLING_DIR, 'weekly-summary.json'), JSON.stringify(weeklyData, null, 2), 'utf8');
    fs.writeFileSync(path.join(ROLLING_DIR, 'monthly-summary.json'), JSON.stringify(monthlyData, null, 2), 'utf8');
    
    console.log('📈 Rolling views (weekly & monthly) generated successfully.');
    
    return {
      weekly: weeklyData,
      monthly: monthlyData
    };
  } catch (error) {
    console.error(`❌ Error building rolling view: ${error.message}`);
    return { weekly: [], monthly: [] };
  }
}
