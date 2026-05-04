import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Cache keys
const CACHE_PREFIX = 'goxent_market_data_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 6; // 6 hours

interface CachedData {
  timestamp: number;
  data: any;
}

export function useFirebaseData() {
  const [data, setData] = useState<any>({
    omni: null,
    quant: null,
    intelligence: null,
    fundamentals: null,
    technicals: null,
    brokerFlow: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchDoc = async (collection: string, document: string) => {
          const cacheKey = `${CACHE_PREFIX}${collection}_${document}`;
          const cached = localStorage.getItem(cacheKey);
          
          if (cached) {
            const parsed: CachedData = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
              return parsed.data;
            }
          }

          const docRef = doc(db, collection, document);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const docData = docSnap.data();
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: docData
            }));
            return docData;
          }
          return null;
        };

        // Fetch all data in parallel
        const [omni, quant, intelligence, fundamentals, technicals, brokerFlow] = await Promise.all([
          fetchDoc('market', 'latest'),
          fetchDoc('quant', 'latest'),
          fetchDoc('intelligence', 'latest'),
          fetchDoc('market', 'fundamentals'),
          fetchDoc('market', 'technicals'),
          fetchDoc('market', 'broker_flow')
        ]);

        setData({
          omni,
          quant,
          intelligence,
          fundamentals,
          technicals,
          brokerFlow,
          loading: false,
          error: null
        });

      } catch (err: any) {
        console.error('Error fetching from Firebase:', err);
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }

    fetchData();
  }, []);

  return data;
}
