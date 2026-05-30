import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { ADMIN_SESSION_COOKIE_NAME, getAdminSessionSecret, isAdminSessionActive } from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import type { WorkSettings, WorkSettingsInput } from "@/lib/types";

const SETTINGS_COLLECTION = "admin_settings";
const SETTINGS_DOCUMENT_ID = "work_github";

type StoredWorkSettings = {
  githubTokenCiphertext?: string;
  githubUsername: string;
  updatedAt: string;
  v: 1;
};

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function getEncryptionKey() {
  return createHash("sha256").update(getAdminSessionSecret()).digest();
}

function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptSecret(value: string) {
  const [ivPart, tagPart, payloadPart] = value.split(".");

  if (!ivPart || !tagPart || !payloadPart) {
    throw new Error("Stored GitHub token is invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(payloadPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function readStoredWorkSettings() {
  if (!hasFirebaseAdminConfig) {
    return null;
  }

  const snapshot = await getAdminFirestore()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOCUMENT_ID)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as StoredWorkSettings;
}

export async function readWorkSettingsForEditor() {
  const storedSettings = await readStoredWorkSettings();
  const envUsername = readEnv("GITHUB_USERNAME");
  const envToken = readEnv("GITHUB_TOKEN");

  return {
    canPersist: hasFirebaseAdminConfig,
    githubUsername: storedSettings?.githubUsername || envUsername,
    hasGithubToken: Boolean(storedSettings?.githubTokenCiphertext || envToken),
    source: storedSettings ? "firestore" : "env",
  } satisfies WorkSettings;
}

export async function saveWorkSettings(settings: WorkSettingsInput) {
  if (!hasFirebaseAdminConfig) {
    throw new Error(
      "Firebase Admin is required to persist GitHub work settings from edit mode. Configure the Admin SDK first.",
    );
  }

  const githubUsername = settings.githubUsername.trim().replace(/^@/, "");

  if (!githubUsername) {
    throw new Error("GitHub username is required.");
  }

  const existing = await readStoredWorkSettings();
  const githubTokenCiphertext = settings.githubToken?.trim()
    ? encryptSecret(settings.githubToken.trim())
    : existing?.githubTokenCiphertext;

  const nextSettings: StoredWorkSettings = {
    githubUsername,
    updatedAt: new Date().toISOString(),
    v: 1,
  };

  if (githubTokenCiphertext) {
    nextSettings.githubTokenCiphertext = githubTokenCiphertext;
  }

  await getAdminFirestore()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOCUMENT_ID)
    .set(nextSettings);

  return readWorkSettingsForEditor();
}

export async function readResolvedGithubSettings() {
  const storedSettings = await readStoredWorkSettings();
  const githubToken = storedSettings?.githubTokenCiphertext
    ? decryptSecret(storedSettings.githubTokenCiphertext)
    : readEnv("GITHUB_TOKEN");

  return {
    githubToken,
    githubUsername: storedSettings?.githubUsername || readEnv("GITHUB_USERNAME"),
  };
}

export function assertAdminSessionFromCookie(value?: string | null) {
  return isAdminSessionActive(value);
}

export { ADMIN_SESSION_COOKIE_NAME };
