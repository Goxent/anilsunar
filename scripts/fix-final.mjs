import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.NOTION_TOKEN;

async function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.notion.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fixFinal() {
  console.log('🛠️ Final schema repair in progress...');

  const dbIds = {
    experience: process.env.NOTION_EXPERIENCE_DB_ID,
    projects: process.env.NOTION_PROJECTS_DB_ID,
    posts: process.env.NOTION_POSTS_DB_ID,
  };

  for (const [key, id] of Object.entries(dbIds)) {
    if (!id) continue;
    
    console.log(`🔍 Inspecting ${key} database...`);
    const db = await request('GET', `/v1/databases/${id}`);
    
    // Find the title property name (it might be 'Name' or 'Title')
    const titlePropName = Object.keys(db.properties).find(k => db.properties[k].type === 'title');
    
    console.log(`📝 Updating ${key} columns...`);
    const properties = {};
    
    if (key === 'experience') {
      properties[titlePropName] = { name: 'Role' };
      properties['Company'] = { rich_text: {} };
      properties['Period'] = { rich_text: {} };
      properties['Description'] = { rich_text: {} };
      properties['Skills'] = { multi_select: {} };
    } else if (key === 'projects') {
      properties[titlePropName] = { name: 'Title' };
      properties['Description'] = { rich_text: {} };
      properties['Tags'] = { multi_select: {} };
      properties['Status'] = { select: { options: [
        { name: 'Live', color: 'green' },
        { name: 'Building', color: 'yellow' },
        { name: 'Archived', color: 'gray' }
      ] } };
      properties['Link'] = { url: {} };
    } else if (key === 'posts') {
      properties[titlePropName] = { name: 'Title' };
      properties['Date'] = { date: {} };
      properties['Tag'] = { select: {} };
      properties['Excerpt'] = { rich_text: {} };
      properties['Slug'] = { rich_text: {} };
    }

    await request('PATCH', `/v1/databases/${id}`, { properties });
  }

  console.log('✅ Columns created! Populating data...');

  // Populate Experience
  const expData = JSON.parse(fs.readFileSync('src/content/experience.json', 'utf8'));
  for (const item of expData) {
    await request('POST', '/v1/pages', {
      parent: { database_id: dbIds.experience },
      properties: {
        Role: { title: [{ text: { content: item.role } }] },
        Company: { rich_text: [{ text: { content: item.company } }] },
        Period: { rich_text: [{ text: { content: item.period } }] },
        Description: { rich_text: [{ text: { content: item.description } }] },
        Skills: { multi_select: item.skills.map(s => ({ name: s })) },
      }
    });
  }

  // Populate Projects
  const projData = JSON.parse(fs.readFileSync('src/content/projects.json', 'utf8'));
  for (const item of projData) {
    await request('POST', '/v1/pages', {
      parent: { database_id: dbIds.projects },
      properties: {
        Title: { title: [{ text: { content: item.title } }] },
        Description: { rich_text: [{ text: { content: item.description } }] },
        Tags: { multi_select: item.tags.map(t => ({ name: t })) },
        Status: { select: { name: item.status } },
        Link: { url: item.link || 'https://github.com' },
      }
    });
  }

  console.log('🎉 SUCCESS! Refresh your Notion page now.');
}

fixFinal().catch(err => console.error('❌ Error:', err.message));
