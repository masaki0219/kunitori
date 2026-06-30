import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL!, // RTDB に必須
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// `getReactNativePersistence` がインストール済み firebase バージョンの
// `firebase/auth` 型から import できず tsc --noEmit がエラーになったため、
// 永続化なしの getAuth にフォールバック（指示書記載の代替策）。
// 冷起動ごとに匿名アカウントが増えるが、auth != null 要件自体は満たす。
export const auth = getAuth(app);

// 匿名認証の完了を待つ単一プロミス。RTDB アクセス前に必ず await する。
// 永続化からの復元を onAuthStateChanged で待ち、未ログイン時のみ匿名サインインする。
// （currentUser を同期参照すると復元前で null になり、毎回新 uid を発行してしまうため）
// サインイン失敗（オフライン等）でも resolve させ、起動は止めない。実書き込みはルールで弾かれる。
export const authReady: Promise<void> = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    if (user) { resolve(); return; }
    signInAnonymously(auth).then(() => resolve()).catch(() => resolve());
  });
});
