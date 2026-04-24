import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function setup() {
  console.log('🚀 Starting Notion CMS Setup...');

  // 1. Find a parent page
  const searchResponse = await notion.search({
    filter: { property: 'object', value: 'page' },
  });

  if (searchResponse.results.length === 0) {
    console.error('❌ No pages found! Please go to a Notion page and Share it with your integration.');
    return;
  }

  const parentPage = searchResponse.results[0];
  console.log(`📂 Found parent page: ${parentPage.properties.title?.title[0]?.plain_text || 'Untitled'}`);

  const databases = {};

  // 2. Create Experience Database
  console.log('🏗️ Creating Experience database...');
  const expDb = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPage.id },
    title: [{ type: 'text', text: { content: 'Experience' } }],
    properties: {
      Role: { title: {} },
      Company: { rich_text: {} },
      Period: { rich_text: {} },
      Description: { rich_text: {} },
      Skills: { multi_select: {} },
    },
  });
  databases.NOTION_EXPERIENCE_DB_ID = expDb.id;

  // 3. Create Projects Database
  console.log('🏗️ Creating Projects database...');
  const projDb = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPage.id },
    title: [{ type: 'text', text: { content: 'Projects' } }],
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
  databases.NOTION_PROJECTS_DB_ID = projDb.id;

  // 4. Create Posts Database
  console.log('🏗️ Creating Posts database...');
  const postsDb = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPage.id },
    title: [{ type: 'text', text: { content: 'Posts' } }],
    properties: {
      Title: { title: {} },
      Date: { date: {} },
      Tag: { select: {} },
      Excerpt: { rich_text: {} },
      Slug: { rich_text: {} },
    },
  });
  databases.NOTION_POSTS_DB_ID = postsDb.id;


  // 5. Update .env file
  console.log('📝 Updating .env file...');
  let envContent = fs.readFileSync('.env', 'utf8');
  for (const [key, value] of Object.entries(databases)) {
    const regex = new RegExp(`${key}=.*`, 'g');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync('.env', envContent);

  // 6. Populate Databases
  console.log('💉 Populating databases with current content...');
  
  // Populate Experience
  const experience = JSON.parse(fs.readFileSync('src/content/experience.json', 'utf8'));
  for (const item of experience) {
    await notion.pages.create({
      parent: { database_id: databases.NOTION_EXPERIENCE_DB_ID },
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
  const projects = JSON.parse(fs.readFileSync('src/content/projects.json', 'utf8'));
  for (const item of projects) {
    await notion.pages.create({
      parent: { database_id: databases.NOTION_PROJECTS_DB_ID },
      properties: {
        Title: { title: [{ text: { content: item.title } }] },
        Description: { rich_text: [{ text: { content: item.description } }] },
        Tags: { multi_select: item.tags.map(t => ({ name: t })) },
        Status: { select: { name: item.status } },
        Link: { url: item.link || 'https://github.com' },
      }
    });
  }

  console.log('✅ Setup complete! Databases created, populated, and .env updated.');
  console.log('Now you can run "npm run content" anytime to fetch updates.');
}


setup().catch(console.error);
