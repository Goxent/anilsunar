import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DATABASES = {
  posts: process.env.NOTION_POSTS_DB_ID,
  experience: process.env.NOTION_EXPERIENCE_DB_ID,
  projects: process.env.NOTION_PROJECTS_DB_ID,
};

async function fetchDatabase(dbId, transformer) {
  if (!dbId) return null;
  try {
    const response = await notion.databases.query({
      database_id: dbId,
    });
    return response.results.map(transformer);
  } catch (error) {
    console.error(`Error fetching database ${dbId}:`, error.message);
    return null;
  }
}

const transformers = {
  posts: (page) => {
    const props = page.properties;
    return {
      id: page.id,
      title: props.Title?.title[0]?.plain_text || 'Untitled',
      date: props.Date?.date?.start || '',
      tag: props.Tag?.select?.name || 'Article',
      excerpt: props.Excerpt?.rich_text[0]?.plain_text || '',
      slug: props.Slug?.rich_text[0]?.plain_text || page.id,
    };
  },
  experience: (page) => {
    const props = page.properties;
    return {
      id: page.id,
      role: props.Role?.title[0]?.plain_text || '',
      company: props.Company?.rich_text[0]?.plain_text || '',
      period: props.Period?.rich_text[0]?.plain_text || '',
      description: props.Description?.rich_text[0]?.plain_text || '',
      skills: props.Skills?.multi_select?.map(s => s.name) || [],
    };
  },
  projects: (page) => {
    const props = page.properties;
    return {
      id: page.id,
      title: props.Title?.title[0]?.plain_text || '',
      description: props.Description?.rich_text[0]?.plain_text || '',
      tags: props.Tags?.multi_select?.map(t => t.name) || [],
      status: props.Status?.select?.name || 'Building',
      link: props.Link?.url || '',
    };
  }
};

async function syncAll() {
  if (!process.env.NOTION_TOKEN) {
    console.log('NOTION_TOKEN not found. Skipping sync.');
    return;
  }

  const contentDir = path.join(__dirname, '../src/content');
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });

  for (const [key, dbId] of Object.entries(DATABASES)) {
    if (!dbId) {
      console.log(`Skipping ${key} (DB ID not provided in .env)`);
      continue;
    }

    console.log(`Fetching ${key}...`);
    const data = await fetchDatabase(dbId, transformers[key]);
    if (data) {
      fs.writeFileSync(
        path.join(contentDir, `${key}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`✅ Synced ${data.length} ${key} items.`);
    }
  }
}

syncAll();

