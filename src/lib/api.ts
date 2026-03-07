import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { createPortfolioDataClone, mergePortfolioData } from "@/data/defaultData";
import { firestore, hasFirebaseConfig } from "@/lib/firebase";
import type { ContactMessageInput, PortfolioData } from "@/lib/types";

const PORTFOLIO_COLLECTION = "portfolio";
const PORTFOLIO_DOCUMENT_ID = "data";

function createFirestoreConfigurationError() {
  return new Error(
    "Firebase Firestore is not configured. Add the required NEXT_PUBLIC_FIREBASE_* environment variables.",
  );
}

export async function loadPortfolioData() {
  const db = firestore;

  if (!db || !hasFirebaseConfig) {
    return createPortfolioDataClone();
  }

  try {
    const snapshot = await getDoc(doc(db, PORTFOLIO_COLLECTION, PORTFOLIO_DOCUMENT_ID));

    if (!snapshot.exists()) {
      const seededData = createPortfolioDataClone();
      await savePortfolioData(seededData);
      return seededData;
    }

    return mergePortfolioData(snapshot.data() as Partial<PortfolioData>);
  } catch {
    return createPortfolioDataClone();
  }
}

export async function savePortfolioData(data: PortfolioData) {
  const db = firestore;

  if (!db || !hasFirebaseConfig) {
    throw createFirestoreConfigurationError();
  }

  await setDoc(doc(db, PORTFOLIO_COLLECTION, PORTFOLIO_DOCUMENT_ID), data, {
    merge: false,
  });

  return data;
}

export const loadPortfolio = loadPortfolioData;
export const savePortfolio = savePortfolioData;

export async function submitContactMessage(message: ContactMessageInput) {
  const db = firestore;

  if (!db || !hasFirebaseConfig) {
    throw createFirestoreConfigurationError();
  }

  await addDoc(collection(db, "contact_messages"), {
    ...message,
    createdAt: serverTimestamp(),
  });
}
