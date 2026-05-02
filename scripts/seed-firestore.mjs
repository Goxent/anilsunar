import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyDktrGzsvcJKuch0XJxGt6_ZmukN8V3ar8",
  projectId: "app-anil-sunar",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = [
  { name: 'content_posts', file: 'posts.json' },
  { name: 'content_projects', file: 'projects.json' },
  { name: 'content_experience', file: 'experience.json' },
  { name: 'content_courses', file: 'courses.json' }
];

async function seed() {
  for (const { name, file } of collections) {
    const dataPath = path.join(__dirname, '../src/content', file);
    if (!fs.existsSync(dataPath)) continue;
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Seeding ${name} (${data.length} items)...`);
    
    for (const item of data) {
      // Use the item.id as the document ID, or create a random one
      const docRef = item.id ? doc(db, name, String(item.id)) : doc(collection(db, name));
      await setDoc(docRef, item);
    }
  }
  
  // Seed basic settings
  await setDoc(doc(db, 'content_settings', 'general'), {
    heroTitle: "CA Professional & Artist",
    heroSubtitle: "Bridging the gap between corporate finance, auditing, and creative arts.",
    email: "anil99senchury@gmail.com",
    linkedin: "https://linkedin.com/in/anilsunar",
    youtube: "https://youtube.com/@goxent"
  });

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(console.error);
