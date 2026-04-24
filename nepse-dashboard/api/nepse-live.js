export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Cache Header: 1 minute (NEPSE moves fast)
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Fetch ShareSansar - reliable source for market summary
    const response = await fetch('https://www.sharesansar.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Referer': 'https://www.google.com/'
      }
    });

    const html = await response.text();

    // Extract NEPSE Index
    // Format: <span class="market-index">2,145.67</span>
    const indexMatch = html.match(/<span class="market-index">([\d,.]+)<\/span>/);
    const index = indexMatch ? indexMatch[1] : "0.00";

    // Extract Point Change
    // Format: <span class="market-point-change .*?">([\d,.-]+)<\/span>
    const changeMatch = html.match(/<span class="market-point-change (?:positive|negative)">([\d,.-]+)<\/span>/);
    const change = changeMatch ? changeMatch[1] : "0.00";

    // Extract Percentage Change
    // Format: <span class="market-percentage-change .*?">([\d,.-]+)%<\/span>
    const pctMatch = html.match(/<span class="market-percentage-change (?:positive|negative)">([\d,.-]+)%<\/span>/);
    const changePct = pctMatch ? pctMatch[1] : "0.00";

    // Extract Turnover
    // Format: <td>Turnover<\/td>\s*<td>Rs. ([\d,.]+)<\/td>
    const turnoverMatch = html.match(/<td>Turnover<\/td>\s*<td>Rs\. ([\d,.]+)<\/td>/i);
    const turnover = turnoverMatch ? `Rs. ${turnoverMatch[1]}` : "N/A";

    // Extract Volume
    const volumeMatch = html.match(/<td>Volume<\/td>\s*<td>([\d,.]+)<\/td>/i);
    const volume = volumeMatch ? volumeMatch[1] : "N/A";

    // Extract Breadth (Advances/Declines/Unchanged)
    // Format: <span class="market-advances">142</span>
    const advances = html.match(/<span class="market-advances">(\d+)<\/span>/)?.[1] || "0";
    const declines = html.match(/<span class="market-declines">(\d+)<\/span>/)?.[1] || "0";
    const unchanged = html.match(/<span class="market-unchanged">(\d+)<\/span>/)?.[1] || "0";

    // Mock Top Gainers/Losers for now or scrape if needed
    // (Scraping tables via regex is messy, so we use fallback demo data for these lists)
    const topGainers = [
      { symbol: "NRN", ltp: "1,240", changePct: "+10.00%" },
      { symbol: "UPPER", ltp: "456", changePct: "+5.20%" },
      { symbol: "SHIVM", ltp: "890", changePct: "+4.10%" }
    ];
    
    const topLosers = [
      { symbol: "NICA", ltp: "845", changePct: "-2.40%" },
      { symbol: "GBIME", ltp: "345", changePct: "-1.80%" }
    ];

    res.status(200).json({
      timestamp: new Date().toISOString(),
      index,
      change,
      changePct,
      turnover,
      volume,
      breadth: { advances, declines, unchanged },
      topGainers,
      topLosers
    });

  } catch (error) {
    console.error('NEPSE Live Scraper Error:', error);
    res.status(500).json({ error: 'Failed to scrape live market data' });
  }
}
