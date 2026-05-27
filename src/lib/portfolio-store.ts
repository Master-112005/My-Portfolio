import "server-only";

import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore/lite";

import { createPortfolioDataClone, mergePortfolioData } from "@/data/defaultData";
import { getPublicFirestore, hasFirebaseConfig } from "@/lib/firebase";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import type { ContactMessageInput, PortfolioData } from "@/lib/types";

const CONTACT_COLLECTION = "contact_messages";
const PORTFOLIO_COLLECTION = "portfolio";
const PORTFOLIO_DOCUMENT_ID = "data";

export function getPortfolioStoreBackend() {
  if (hasFirebaseAdminConfig) {
    return "admin";
  }

  if (hasFirebaseConfig) {
    return "public";
  }

  return "none";
}

function createContactMessagePayload(message: ContactMessageInput) {
  return {
    ...message,
    createdAt: new Date().toISOString(),
  };
}

function createFirebaseConfigurationError() {
  return new Error(
    "Firebase is not configured. Add the required public Firebase values or a Firebase Admin service account.",
  );
}

function normalizeStoreError(error: unknown, action: "load" | "save" | "submit") {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    code.includes("permission-denied") ||
    code === "7" ||
    message.includes("missing or insufficient permissions") ||
    message.includes("permission denied")
  ) {
    return new Error(
      "Firestore permission denied. The app is reaching Firebase, but the project is still blocking this operation.",
    );
  }

  if (message.includes("service account") || message.includes("private key")) {
    return new Error(
      "Firebase Admin is configured incorrectly. Check the service account credentials in your environment variables.",
    );
  }

  if (message.includes("api key not valid")) {
    return new Error("The Firebase API key is invalid for this project.");
  }

  if (
    message.includes("firestore api has not been used") ||
    message.includes("cloud firestore api has not been used")
  ) {
    return new Error("Cloud Firestore API is disabled for the configured Firebase project.");
  }

  if (action === "load") {
    return new Error("Failed to load portfolio data from Firestore.");
  }

  if (action === "save") {
    return new Error("Failed to save portfolio data to Firestore.");
  }

  return new Error("Failed to submit the contact message.");
}

async function readPortfolioWithAdmin() {
  const snapshot = await getAdminFirestore()
    .collection(PORTFOLIO_COLLECTION)
    .doc(PORTFOLIO_DOCUMENT_ID)
    .get();

  if (!snapshot.exists) {
    const seededData = createPortfolioDataClone();
    await writePortfolioToStore(seededData);
    return seededData;
  }

  return mergePortfolioData(snapshot.data() as Partial<PortfolioData>);
}

async function writePortfolioWithAdmin(data: PortfolioData) {
  await getAdminFirestore()
    .collection(PORTFOLIO_COLLECTION)
    .doc(PORTFOLIO_DOCUMENT_ID)
    .set(data);

  return data;
}

async function submitContactWithAdmin(message: ContactMessageInput) {
  await getAdminFirestore()
    .collection(CONTACT_COLLECTION)
    .add(createContactMessagePayload(message));
}

async function readPortfolioWithPublicSdk() {
  const db = getPublicFirestore();

  if (!db) {
    throw createFirebaseConfigurationError();
  }

  const snapshot = await getDoc(doc(db, PORTFOLIO_COLLECTION, PORTFOLIO_DOCUMENT_ID));

  if (!snapshot.exists()) {
    const seededData = createPortfolioDataClone();
    await writePortfolioToStore(seededData);
    return seededData;
  }

  return mergePortfolioData(snapshot.data() as Partial<PortfolioData>);
}

async function writePortfolioWithPublicSdk(data: PortfolioData) {
  const db = getPublicFirestore();

  if (!db) {
    throw createFirebaseConfigurationError();
  }

  await setDoc(doc(db, PORTFOLIO_COLLECTION, PORTFOLIO_DOCUMENT_ID), data, {
    merge: false,
  });

  return data;
}

async function submitContactWithPublicSdk(message: ContactMessageInput) {
  const db = getPublicFirestore();

  if (!db) {
    throw createFirebaseConfigurationError();
  }

  await addDoc(collection(db, CONTACT_COLLECTION), createContactMessagePayload(message));
}

export async function readPortfolioFromStore() {
  try {
    if (getPortfolioStoreBackend() === "admin") {
      return await readPortfolioWithAdmin();
    }

    if (getPortfolioStoreBackend() === "public") {
      return await readPortfolioWithPublicSdk();
    }

    throw createFirebaseConfigurationError();
  } catch (error) {
    throw normalizeStoreError(error, "load");
  }
}

export async function writePortfolioToStore(data: PortfolioData) {
  try {
    if (getPortfolioStoreBackend() === "admin") {
      return await writePortfolioWithAdmin(data);
    }

    if (getPortfolioStoreBackend() === "public") {
      return await writePortfolioWithPublicSdk(data);
    }

    throw createFirebaseConfigurationError();
  } catch (error) {
    throw normalizeStoreError(error, "save");
  }
}

export async function submitContactToStore(message: ContactMessageInput) {
  try {
    if (getPortfolioStoreBackend() === "admin") {
      await submitContactWithAdmin(message);
      return;
    }

    if (getPortfolioStoreBackend() === "public") {
      await submitContactWithPublicSdk(message);
      return;
    }

    throw createFirebaseConfigurationError();
  } catch (error) {
    throw normalizeStoreError(error, "submit");
  }
}
