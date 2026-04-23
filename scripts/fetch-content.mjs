import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fetchPosts() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.log('Notion credentials not found. Skipping fetch.');
    return;
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });

    const posts = response.results.map((page) => {
      const properties = page.properties;
      return {
        id: page.id,
        title: properties.Title.title[0]?.plain_text || 'Untitled',
        date: properties.Date.date?.start || '',
        tag: properties.Tag.select?.name || 'Article',
        excerpt: properties.Excerpt.rich_text[0]?.plain_text || '',
        slug: properties.Slug.rich_text[0]?.plain_text || page.id,
      };
    });

    const contentDir = path.join(__dirname, '../src/content');
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(contentDir, 'posts.json'),
      JSON.stringify(posts, null, 2)
    );

    console.log(`Successfully fetched ${posts.length} posts from Notion.`);
  } catch (error) {
    console.error('Error fetching posts from Notion:', error);
  }
}

fetchPosts();
