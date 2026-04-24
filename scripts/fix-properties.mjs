import { Client } from '@notionhq/client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function fix() {
  console.log('🛠️ Fixing Notion Database schemas...');

  const dbIds = {
    experience: process.env.NOTION_EXPERIENCE_DB_ID,
    projects: process.env.NOTION_PROJECTS_DB_ID,
    posts: process.env.NOTION_POSTS_DB_ID,
  };

  // 1. Update Experience Schema
  if (dbIds.experience) {
    console.log('📝 Updating Experience schema...');
    await notion.databases.update({
      database_id: dbIds.experience,
      properties: {
        Role: { title: {} }, // 'Name' is renamed to 'Role'
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
    await notion.databases.update({
      database_id: dbIds.projects,
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
    await notion.databases.update({
      database_id: dbIds.posts,
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
      await notion.pages.create({
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
      await notion.pages.create({
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

fix().catch(err => {
  console.error('❌ Error:', err.message);
  if (err.body) console.error(err.body);
});
