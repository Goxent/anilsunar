import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUNDAMENTAL_FILE = path.join(__dirname, '../src/app/data/fundamental-data.json');
const REGISTRY_FILE = path.join(__dirname, '../src/app/data/nepse-tickers.json');

export default async function updateTickerRegistry() {
  console.log('📖 Updating NEPSE Ticker Registry...');
  
  if (!fs.existsSync(FUNDAMENTAL_FILE)) {
    console.error('❌ fundamental-data.json not found. Run fundamental-analyzer.mjs first.');
    return;
  }

  try {
    const rawData = fs.readFileSync(FUNDAMENTAL_FILE, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.stocks || !Array.isArray(data.stocks)) {
      throw new Error('Invalid format in fundamental-data.json');
    }

    const tickers = data.stocks
      .map(s => s.symbol?.toUpperCase().trim())
      .filter(Boolean)
      .filter(sym => {
        // Exclude Debentures and Mutual Funds with numbers (e.g. ADBLD83, NMB50, NIBF2)
        if (/\d/.test(sym)) return false;
        // Exclude Promoter shares (usually end in P, PR, PO) e.g., HIDCLP, NABILP
        // Be careful not to exclude ordinary shares like NADEP (length 5)
        if (sym.endsWith('P') && sym.length > 5) return false;
        if (sym.endsWith('PO') || sym.endsWith('PR')) return false;
        // Exclude explicit mutual funds that might not have numbers (e.g., SFMF, NMBMF)
        if (sym.endsWith('MF')) return false;
        return true;
      })
      .sort();

    // Deduplicate
    const uniqueTickers = [...new Set(tickers)];

    const output = {
      lastUpdated: new Date().toISOString(),
      count: uniqueTickers.length,
      tickers: uniqueTickers
    };

    fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true });
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(output, null, 2));

    console.log(`✅ Ticker Registry updated with ${uniqueTickers.length} symbols.`);
    return uniqueTickers;
  } catch (err) {
    console.error(`❌ Failed to update Ticker Registry: ${err.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateTickerRegistry();
}
