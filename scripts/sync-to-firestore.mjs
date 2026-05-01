import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Initialize Firebase Admin
// Expects FIREBASE_SERVICE_ACCOUNT_JSON as a stringified JSON in env
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

if (!serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is missing from .env');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function syncData() {
  console.log('☁️ Initiating Cloud Sync to Firestore...');
  
  const omniPath = path.join(__dirname, '../src/app/data/market-omni-data.json');
  const digestPath = path.join(__dirname, '../src/app/data/ai_digest.json');

  try {
    // 1. Sync Omni Data
    if (fs.existsSync(omniPath)) {
      const omniData = JSON.parse(fs.readFileSync(omniPath, 'utf8'));
      await db.collection('market').doc('latest').set({
        ...omniData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Omni Data synced to Firestore (market/latest)');
      
      // Also archive it by date for historical tracking
      const dateKey = new Date().toISOString().split('T')[0];
      await db.collection('market_history').doc(dateKey).set({
        ...omniData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Historical record created for ${dateKey}`);
    }

    // 2. Sync AI Digest
    if (fs.existsSync(digestPath)) {
      const digestData = JSON.parse(fs.readFileSync(digestPath, 'utf8'));
      await db.collection('intelligence').doc('latest').set({
        ...digestData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ AI Digest synced to Firestore (intelligence/latest)');
    }

    // 3. Sync Deep Broker Holdings
    const deepBrokerPath = path.join(__dirname, '../src/app/data/deep-broker-holdings.json');
    if (fs.existsSync(deepBrokerPath)) {
      const deepBrokerData = JSON.parse(fs.readFileSync(deepBrokerPath, 'utf8'));
      await db.collection('broker_analytics').doc('latest').set({
        ...deepBrokerData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Deep Broker Holdings synced to Firestore (broker_analytics/latest)');
    }

    // 4. Sync Individual Tearsheets (Stock-wise data)
    const tearsheetDir = path.join(__dirname, '../src/app/data/tearsheets');
    if (fs.existsSync(tearsheetDir)) {
      const files = fs.readdirSync(tearsheetDir).filter(f => f.endsWith('.json'));
      console.log(`📡 Syncing ${files.length} tearsheets to Firestore...`);
      
      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = db.batch();
        const chunk = files.slice(i, i + batchSize);
        
        chunk.forEach(file => {
          const symbol = file.replace('.json', '');
          const data = JSON.parse(fs.readFileSync(path.join(tearsheetDir, file), 'utf8'));
          const docRef = db.collection('tearsheets').doc(symbol);
          batch.set(docRef, {
            ...data,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`   ✔️  Batch ${Math.floor(i/batchSize) + 1} synced`);
      }
      console.log('✅ All Tearsheets synced to Firestore');
    }

    console.log('🚀 Cloud Sync Complete!');
  } catch (error) {
    console.error('🚨 Sync failed:', error);
    process.exit(1);
  }
}

syncData();
