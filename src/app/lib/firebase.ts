import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDktrGzsvcJKuch0XJxGt6_ZmukN8V3ar8",
  authDomain: "app-anil-sunar.firebaseapp.com",
  projectId: "app-anil-sunar",
  storageBucket: "app-anil-sunar.firebasestorage.app",
  messagingSenderId: "295312785744",
  appId: "1:295312785744:web:a4c93aacf30172d11d2c55",
  measurementId: "G-CYS1NQEWP6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, db, googleProvider, analytics };
