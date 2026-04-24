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

async function fix() {
  console.log('🛠️ Fixing Notion Database schemas (Raw API Mode)...');

  const dbIds = {
    experience: process.env.NOTION_EXPERIENCE_DB_ID,
    projects: process.env.NOTION_PROJECTS_DB_ID,
    posts: process.env.NOTION_POSTS_DB_ID,
  };

  // 1. Update Experience Schema
  if (dbIds.experience) {
    console.log('📝 Updating Experience schema...');
    await request('PATCH', `/v1/databases/${dbIds.experience}`, {
      properties: {
        Role: { title: {} },
        Company: { rich_text: {} },
        Period: { rich_text: {} },
        Description: { rich_text: {} },
        Skills: { multi_select: {} },
      },
    });
  }

  // 2. Update Projects Schema
  if (dbIds.projects) {
    console.log('📝 Updating Projects schema...');
    await request('PATCH', `/v1/databases/${dbIds.projects}`, {
      properties: {
        Title: { title: {} },
        Description: { rich_text: {} },
        Tags: { multi_select: {} },
        Status: { select: { options: [
          { name: 'Live', color: 'green' },
          { name: 'Building', color: 'yellow' },
          { name: 'Archived', color: 'gray' }
        ] } },
        Link: { url: {} },
      },
    });
  }

  // 3. Update Posts Schema
  if (dbIds.posts) {
    console.log('📝 Updating Posts schema...');
    await request('PATCH', `/v1/databases/${dbIds.posts}`, {
      properties: {
        Title: { title: {} },
        Date: { date: {} },
        Tag: { select: {} },
        Excerpt: { rich_text: {} },
        Slug: { rich_text: {} },
      },
    });
  }

  console.log('✅ Schemas updated! Now populating data...');

  // 4. Populate Experience
  if (dbIds.experience) {
    const experience = JSON.parse(fs.readFileSync('src/content/experience.json', 'utf8'));
    for (const item of experience) {
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
  }

  // 5. Populate Projects
  if (dbIds.projects) {
    const projects = JSON.parse(fs.readFileSync('src/content/projects.json', 'utf8'));
    for (const item of projects) {
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
  }

  console.log('🎉 All done! Your Notion databases are now fully set up and populated.');
}

fix().catch(err => console.error('❌ Error:', err.message));
