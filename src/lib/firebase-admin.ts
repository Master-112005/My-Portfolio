import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseAdminServiceAccount = {
  clientEmail: string;
  privateKey: string;
  projectId: string;
};

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function parseServiceAccountJson() {
  const rawValue = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<{
      client_email: string;
      private_key: string;
      project_id: string;
    }>;

    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
      return null;
    }

    return {
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
      projectId: parsed.project_id,
    } satisfies FirebaseAdminServiceAccount;
  } catch {
    return null;
  }
}

function resolveServiceAccount() {
  const fromJson = parseServiceAccountJson();

  if (fromJson) {
    return fromJson;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ??
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
  } satisfies FirebaseAdminServiceAccount;
}

const serviceAccount = resolveServiceAccount();

export const hasFirebaseAdminConfig = Boolean(serviceAccount);

export function getAdminFirestore() {
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

  return getFirestore(app);
}
