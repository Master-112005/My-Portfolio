import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore/lite";

export const firebasePublicConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

export const hasFirebaseConfig = Object.values(firebasePublicConfig).every(
  (value) => typeof value === "string" && value.length > 0,
);

let publicApp: FirebaseApp | null = null;
let publicFirestore: Firestore | null = null;

export function getPublicFirebaseApp() {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (publicApp) {
    return publicApp;
  }

  publicApp = getApps().length
    ? getApp()
    : initializeApp(firebasePublicConfig as FirebaseOptions);

  return publicApp;
}

export function getPublicFirestore() {
  if (publicFirestore) {
    return publicFirestore;
  }

  const app = getPublicFirebaseApp();
  publicFirestore = app ? getFirestore(app) : null;
  return publicFirestore;
}
