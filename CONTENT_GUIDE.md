# Content Guide: Notion CMS Integration

This portfolio uses **Notion** as a headless CMS for the **Writing** section.

## How to add a new post

1. Go to your Notion Database.
2. Create a new page with the following exact properties (case-sensitive):
   - **Title**: (Title property) The title of your post.
   - **Date**: (Date property) The publication date.
   - **Tag**: (Select property) e.g., "Poetry", "Article", "Newsletter".
   - **Excerpt**: (Rich Text property) A short summary of the post.
   - **Slug**: (Rich Text property) A URL-friendly identifier, e.g., `my-new-post`. If left blank, it will fall back to the Notion page ID.
3. Write your content in the page (Content fetching is not yet implemented in the current script, but this is the workflow for properties).

## How to update the site locally

To pull the latest changes from Notion to your local environment:
```bash
npm run content
```
This will fetch the data and overwrite `src/content/posts.json`.

## Deployment

The build script `npm run build` is configured to run `npm run content` automatically. 
When you deploy to Vercel/Netlify, make sure you add `NOTION_TOKEN` and `NOTION_DATABASE_ID` to your environment variables in their dashboard. The site will fetch the latest Notion content every time a new build is triggered.
