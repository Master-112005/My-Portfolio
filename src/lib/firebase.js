import "server-only";
import { cert, getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestoreInstance } from "firebase-admin/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

// --- Public (client) SDK ---------------------------------------------------

export const firebasePublicConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

export const hasFirebaseConfig = Object.values(firebasePublicConfig).every((value) => typeof value === "string" && value.length > 0);

let publicApp = null;
let publicFirestore = null;

export function getPublicFirebaseApp() {
    if (!hasFirebaseConfig) {
        return null;
    }
    if (publicApp) {
        return publicApp;
    }
    publicApp = getApps().length ? getApp() : initializeApp(firebasePublicConfig);
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

// --- Admin SDK -------------------------------------------------------------

function normalizePrivateKey(value) {
    return value.replace(/\\n/g, "\n");
}

function parseServiceAccountJson() {
    const rawValue = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
    if (!rawValue) {
        return null;
    }
    try {
        const parsed = JSON.parse(rawValue);
        if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
            return null;
        }
        return {
            clientEmail: parsed.client_email,
            privateKey: normalizePrivateKey(parsed.private_key),
            projectId: parsed.project_id,
        };
    }
    catch {
        return null;
    }
}

function resolveServiceAccount() {
    const fromJson = parseServiceAccountJson();
    if (fromJson) {
        return fromJson;
    }
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
    if (!projectId || !clientEmail || !privateKey) {
        return null;
    }
    return {
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
        projectId,
    };
}

const serviceAccount = resolveServiceAccount();

export const hasFirebaseAdminConfig = Boolean(serviceAccount);

export function getAdminFirestore() {
    if (!serviceAccount) {
        throw new Error("Firebase Admin is not configured. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.");
    }
    const app = getAdminApps().length
        ? getAdminApp()
        : initializeAdminApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId,
        });
    return getAdminFirestoreInstance(app);
}
