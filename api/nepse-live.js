export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  };

  try {
    // 2. Fetch Live Market Summary
    const summaryRes = await fetch('https://www.nepalstock.com.np/api/nots/nepse-data', { headers });
    const summaryData = summaryRes.ok ? await summaryRes.json() : [];

    // 3. Fetch Top Turnover (as proxy for gainers/losers or specific performance)
    const topRes = await fetch('https://www.nepalstock.com.np/api/nots/top-ten/turnover', { headers });
    const topData = topRes.ok ? await topRes.json() : [];

    // 4. Combine and Format
    // Note: Official API structure often varies, we map safely
    const latest = summaryData[0] || {};
    
    const combined = {
      timestamp: new Date().toISOString(),
      index: latest.index || 'N/A',
      change: latest.change || '0.0',
      changePct: latest.perChange || '0.0',
      turnover: latest.turnover || '0.0',
      volume: latest.volume || '0',
      breadth: {
        advances: latest.advances || 0,
        declines: latest.declines || 0,
        unchanged: latest.unchanged || 0
      },
      topGainers: topData.slice(0, 10).map(s => ({
        symbol: s.symbol,
        ltp: s.ltp,
        change: s.pointChange,
        changePct: s.percentageChange
      })),
      topLosers: [] // Usually requires a different endpoint, but we fallback gracefully
    };

    // 5. Cache Control
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(combined);

  } catch (error) {
    console.error('NEPSE Live API Error:', error);
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      index: 'N/A',
      change: '0.0',
      changePct: '0.0',
      turnover: '0.0',
      volume: '0',
      breadth: { advances: 0, declines: 0, unchanged: 0 },
      topGainers: [],
      topLosers: [],
      status: 'offline'
    });
  }
}
