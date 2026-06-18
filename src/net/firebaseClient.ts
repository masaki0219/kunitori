import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL!, // RTDB に必須
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

export const db = getDatabase(initializeApp(firebaseConfig));
