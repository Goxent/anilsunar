export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sources = [
    {
      name: 'ShareSansar',
      url: 'https://www.sharesansar.com/',
      parser: (html) => ({
        index: html.match(/<span class="market-index">([\d,.]+)<\/span>/)?.[1],
        change: html.match(/<span class="market-point-change (?:positive|negative)">([\d,.-]+)<\/span>/)?.[1],
        changePct: html.match(/<span class="market-percentage-change (?:positive|negative)">([\d,.-]+)%<\/span>/)?.[1],
      })
    },
    {
      name: 'Nepalipaisa',
      url: 'https://www.nepalipaisa.com/',
      parser: (html) => ({
        index: html.match(/<span id="nepse-index">([\d,.]+)<\/span>/)?.[1],
        change: html.match(/<span id="nepse-change">([\d,.-]+)<\/span>/)?.[1],
        changePct: html.match(/<span id="nepse-percentage">([\d,.-]+)%<\/span>/)?.[1],
      })
    }
  ];

  let data = { index: "2,000.00", change: "0.00", changePct: "0.00", turnover: "N/A", volume: "N/A" };

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await response.text();
      const parsed = source.parser(html);
      
      if (parsed.index) {
        data = { ...data, ...parsed, source: source.name };
        break; // Stop if we got valid data
      }
    } catch (e) {
      console.error(`Source ${source.name} failed:`, e.message);
    }
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    ...data,
    breadth: { advances: "0", declines: "0", unchanged: "0" },
    topGainers: [],
    topLosers: []
  });
}
