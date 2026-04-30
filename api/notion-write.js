export default async function handler(req, res) {
  // 1. Authentication
  const syncToken = req.headers['x-sync-token'];
  if (!syncToken || syncToken !== process.env.SYNC_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { database, action, pageId, data } = req.body;
  const NOTION_TOKEN = process.env.NOTION_TOKEN;

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'Notion token not configured' });
  }

  const headers = {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28'
  };

  const dbIds = {
    'posts': process.env.NOTION_POSTS_DB_ID,
    'experience': process.env.NOTION_EXPERIENCE_DB_ID,
    'projects': process.env.NOTION_PROJECTS_DB_ID,
    'content-pipeline': process.env.NOTION_CONTENT_PIPELINE_DB_ID,
    'market-journal': process.env.NOTION_MARKET_JOURNAL_DB_ID
  };

  const dbId = dbIds[database];
  if (!dbId && action === 'create') {
    return res.status(400).json({ error: `Invalid or missing database ID for: ${database}` });
  }

  // ─── Property Builders ──────────────────────────────────────────────────────
  const buildProperties = (db, fields) => {
    const props = {};

    if (db === 'posts') {
      if (fields.title) props['Title'] = { title: [{ text: { content: fields.title } }] };
      if (fields.excerpt) props['Excerpt'] = { rich_text: [{ text: { content: fields.excerpt } }] };
      if (fields.date) props['Date'] = { date: { start: fields.date } };
      if (fields.platform) props['Platform'] = { select: { name: fields.platform } };
      if (fields.url) props['Link'] = { url: fields.url };
      if (fields.slug) props['Slug'] = { rich_text: [{ text: { content: fields.slug } }] };
    } 
    else if (db === 'experience' || db === 'projects') {
      // Basic fallback for experience/projects if needed
      if (fields.title || fields.name) props['Title'] = { title: [{ text: { content: fields.title || fields.name } }] };
      if (fields.description) props['Description'] = { rich_text: [{ text: { content: fields.description } }] };
    }
    else if (db === 'content-pipeline') {
      if (fields.hook) props['Title'] = { title: [{ text: { content: fields.hook } }] };
      if (fields.fullDraft) props['FullDraft'] = { rich_text: [{ text: { content: fields.fullDraft } }] };
      props['Status'] = { select: { name: fields.status || 'DRAFT' } };
      if (fields.platform) props['Platform'] = { select: { name: fields.platform } };
      if (fields.angle) props['Angle'] = { select: { name: fields.angle } };
      if (fields.generatedAt) props['GeneratedAt'] = { date: { start: fields.generatedAt } };
    }
    else if (db === 'market-journal') {
      if (fields.title) props['Title'] = { title: [{ text: { content: fields.title } }] };
      if (fields.date) props['Date'] = { date: { start: fields.date } };
      if (fields.marketPhase) props['MarketPhase'] = { select: { name: fields.marketPhase } };
      if (fields.summary) props['Summary'] = { rich_text: [{ text: { content: fields.summary } }] };
      if (fields.topPicks) props['TopPicks'] = { rich_text: [{ text: { content: typeof fields.topPicks === 'string' ? fields.topPicks : JSON.stringify(fields.topPicks) } }] };
      if (fields.keyRisk) props['KeyRisk'] = { rich_text: [{ text: { content: fields.keyRisk } }] };
    }

    return props;
  };

  try {
    let response;
    let url;
    let method;
    let body;

    if (action === 'create') {
      url = 'https://api.notion.com/v1/pages';
      method = 'POST';
      body = {
        parent: { database_id: dbId },
        properties: buildProperties(database, data)
      };
    } else if (action === 'update') {
      if (!pageId) return res.status(400).json({ error: 'pageId required for update' });
      url = `https://api.notion.com/v1/pages/${pageId}`;
      method = 'PATCH';
      body = { properties: buildProperties(database, data) };
    } else if (action === 'delete') {
      if (!pageId) return res.status(400).json({ error: 'pageId required for delete' });
      url = `https://api.notion.com/v1/pages/${pageId}`;
      method = 'PATCH';
      body = { archived: true };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Notion ${action} on ${database}: ${response.ok ? 'SUCCESS' : 'FAILED'}`);

    if (response.ok) {
      return res.status(200).json({ success: true, pageId: result.id });
    } else {
      console.error('Notion API Error:', result);
      return res.status(response.status).json({ error: result.message || 'Notion API error' });
    }
  } catch (error) {
    console.error('Internal Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
