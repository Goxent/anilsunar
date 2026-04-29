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
    const { type = 'market' } = req.query; // 'market' or 'intel'
    
    let docId = 'latest';
    let collection = type === 'intel' ? 'intelligence' : 'market';
    
    const snap = await db.collection(collection).doc(docId).get();
    
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Data not found' });
    }

    // Add cache control to avoid over-fetching
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(snap.data());
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch cloud data' });
  }
}
