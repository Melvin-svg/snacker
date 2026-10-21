import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForInitialization12345",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "snacker-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "snacker-app",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://snacker-app-default-rtdb.firebaseio.com",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "snacker-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

// Safe singleton initialization for Next.js SSR & fast refresh
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreDb;
try {
  firestoreDb = getFirestore(app);
} catch (e) {
  console.warn("Firestore initialization notice:", e.message);
}

let realtimeDb;
try {
  realtimeDb = getDatabase(app);
} catch (e) {
  console.warn("Realtime Database initialization notice:", e.message);
}

export const db = firestoreDb;
export const rtdb = realtimeDb;
export default app;