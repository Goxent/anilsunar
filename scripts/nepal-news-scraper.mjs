import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── RSS Sources (Financial News Nepal) ──────────────────────────────────────
const RSS_SOURCES = [
  {
    name: 'Onlinekhabar Finance',
    url: 'https://onlinekhabar.com/category/financial/feed',
    category: 'Business',
    badge: 'OK',
    color: '#e53935',
  },
  {
    name: 'Karobar Daily',
    url: 'https://karobardaily.com/feed',
    category: 'Business',
    badge: 'KD',
    color: '#1a73e8',
  },
  {
    name: 'Sharesansar',
    url: 'https://sharesansar.com/category/latest/feed',
    category: 'Stock Market',
    badge: 'SS',
    color: '#f59e0b',
  },
  {
    name: 'Nepali Paisa',
    url: 'https://nepalipaisa.com/feed',
    category: 'Finance',
    badge: 'NP',
    color: '#2e7d32',
  },
  {
    name: 'Arthik Daily',
    url: 'https://arthikdainik.com/feed',
    category: 'Economy',
    badge: 'AD',
    color: '#6a1b9a',
  },
  {
    name: 'MeroLagani News',
    url: 'https://merolagani.com/rss.aspx?type=news',
    category: 'Stock Market',
    badge: 'ML',
    color: '#0288d1',
  },
];

// Financial keywords to filter relevant articles
const FINANCIAL_KEYWORDS = [
  'nepse', 'share', 'stock', 'bank', 'finance', 'investment', 'interest rate',
  'inflation', 'economy', 'budget', 'tax', 'dividend', 'ipo', 'fpo', 'sebon',
  'nrb', 'nepal rastra bank', 'monetary', 'fiscal', 'gdp', 'revenue', 'export',
  'import', 'remittance', 'insurance', 'microfinance', 'hydro', 'hydropower',
  'project', 'bond', 'debenture', 'mutual fund', 'portfolio', 'market', 'price',
  'बैंक', 'शेयर', 'बजार', 'लगानी', 'ब्याज', 'नेप्से', 'कम्पनी', 'आर्थिक',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isFinanciallyRelevant(title = '', desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  return FINANCIAL_KEYWORDS.some(kw => text.includes(kw));
}

function parseRSSDate(dateStr) {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return (match[1] || match[2] || '').trim();
}

function parseRSSFeed(xml, source) {
  const items = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const block of itemBlocks) {
    const title       = extractTag(block, 'title');
    const link        = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate     = extractTag(block, 'pubDate');

    if (!title || !link) continue;
    if (!isFinanciallyRelevant(title, description)) continue;

    // Strip HTML from description
    const cleanDesc = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 300);

    items.push({
      title,
      url: link,
      summary: cleanDesc,
      publishedAt: parseRSSDate(pubDate),
      source: source.name,
      category: source.category,
      badge: source.badge,
      color: source.color,
    });
  }

  return items;
}

async function fetchSource(source) {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Goxent Intelligence Bot)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.log(`   ⚠️  ${source.name}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseRSSFeed(xml, source);
    console.log(`   ✔  ${source.name}: ${items.length} financial articles`);
    return items;
  } catch (err) {
    console.error(`   ❌ ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default async function runNepalNewsScraper() {
  console.log('📰 Nepal Financial News Scraper starting...');

  const allArticles = [];

  for (const source of RSS_SOURCES) {
    const articles = await fetchSource(source);
    allArticles.push(...articles);
  }

  // Sort newest first
  allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Deduplicate by URL
  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  const output = {
    scrapedAt: new Date().toISOString(),
    totalCount: unique.length,
    sources: RSS_SOURCES.map(s => s.name),
    articles: unique,
  };

  const outPath = path.join(__dirname, '../src/app/data/nepal-news.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`✅ Nepal News Scraper complete — ${unique.length} financial articles saved.`);
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runNepalNewsScraper().catch(console.error);
}
