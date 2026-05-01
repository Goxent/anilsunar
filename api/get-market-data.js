import admin from 'firebase-admin';

// Initialize Firebase Admin for serverless
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'market', symbol } = req.query; // 'market', 'intel', 'broker', 'tearsheet'
    
    let docId = 'latest';
    let collection = 'market';

    if (type === 'intel') collection = 'intelligence';
    else if (type === 'broker') collection = 'broker_analytics';
    else if (type === 'tearsheet') {
      collection = 'tearsheets';
      docId = symbol?.toUpperCase();
    }
    
    if (!docId) {
      return res.status(400).json({ error: 'Missing document ID or symbol' });
    }

    const snap = await db.collection(collection).doc(docId).get();
    
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Data not found' });
    }

    // Add cache control to avoid over-fetching
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(snap.data());
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch cloud data' });
  }
}
