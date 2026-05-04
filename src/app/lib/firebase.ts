import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Firebase web config — these are safe to be public (security enforced by Firestore rules)
// Values pulled from environment variables for best practice
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDktrGzsvcJKuch0XJxGt6_ZmukN8V3ar8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "app-anil-sunar.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "app-anil-sunar",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "app-anil-sunar.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "859341496359",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:859341496359:web:a6176378e9195e50587d60",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E7XEMB6L0L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const analytics = typeof window !== 'undefined' && !isLocalhost ? getAnalytics(app) : null;

export { app, auth, db, googleProvider, analytics };
