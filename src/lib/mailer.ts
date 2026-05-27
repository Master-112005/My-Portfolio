import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import nodemailer from "nodemailer";

import { ADMIN_SESSION_COOKIE_NAME, getAdminSessionSecret, isAdminSessionActive } from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import type { ContactMailerSettings, ContactMailerSettingsInput, ContactMessageInput } from "@/lib/types";

const CONTACT_SETTINGS_COLLECTION = "admin_settings";
const CONTACT_SETTINGS_DOCUMENT_ID = "contact_mailer";

type StoredMailerSettings = {
  fromEmail: string;
  fromName: string;
  passwordCiphertext?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  toEmail: string;
  updatedAt: string;
  v: 1;
};

type MailerConfig = {
  fromEmail: string;
  fromName: string;
  smtpPass: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  toEmail: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function parseSmtpPort(value: string) {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP port must be a valid positive integer.");
  }

  return port;
}

function parseBooleanValue(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
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
    throw new Error("Stored contact mailer password is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(payloadPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAddress(name: string, email: string) {
  return `"${name.replaceAll('"', '\\"')}" <${email}>`;
}

function createMissingSettingsError() {
  return new Error(
    "Contact mailer is not configured. Open edit mode, set the mailer settings, and save them before using the contact form.",
  );
}

function getEnvMailerSettings() {
  const smtpPort = readEnv("CONTACT_SMTP_PORT");

  return {
    fromEmail: readEnv("CONTACT_FROM_EMAIL"),
    fromName: readEnv("CONTACT_FROM_NAME") || "Portfolio Contact",
    smtpHost: readEnv("CONTACT_SMTP_HOST"),
    smtpPass: readEnv("CONTACT_SMTP_PASS"),
    smtpPort: smtpPort ? parseSmtpPort(smtpPort) : 587,
    smtpSecure: parseBooleanValue(process.env.CONTACT_SMTP_SECURE, smtpPort === "465"),
    smtpUser: readEnv("CONTACT_SMTP_USER"),
    toEmail: readEnv("CONTACT_TO_EMAIL"),
  };
}

async function readStoredMailerSettings() {
  if (!hasFirebaseAdminConfig) {
    return null;
  }

  const snapshot = await getAdminFirestore()
    .collection(CONTACT_SETTINGS_COLLECTION)
    .doc(CONTACT_SETTINGS_DOCUMENT_ID)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as StoredMailerSettings;
}

export async function readContactMailerSettingsForEditor() {
  const envSettings = getEnvMailerSettings();
  const storedSettings = await readStoredMailerSettings();

  return {
    canPersist: hasFirebaseAdminConfig,
    fromEmail: storedSettings?.fromEmail || envSettings.fromEmail,
    fromName: storedSettings?.fromName || envSettings.fromName,
    hasPassword: Boolean(storedSettings?.passwordCiphertext || envSettings.smtpPass),
    smtpHost: storedSettings?.smtpHost || envSettings.smtpHost,
    smtpPort: String(storedSettings?.smtpPort || envSettings.smtpPort || 587),
    smtpSecure: storedSettings?.smtpSecure ?? envSettings.smtpSecure,
    smtpUser: storedSettings?.smtpUser || envSettings.smtpUser,
    source: storedSettings ? "firestore" : "env",
    toEmail: storedSettings?.toEmail || envSettings.toEmail,
  } satisfies ContactMailerSettings;
}

function validateMailerSettingsInput(settings: ContactMailerSettingsInput) {
  if (!settings.smtpHost.trim()) {
    return "SMTP host is required.";
  }

  if (!settings.smtpUser.trim()) {
    return "SMTP user is required.";
  }

  if (!settings.toEmail.trim()) {
    return "Destination email is required.";
  }

  if (!settings.fromEmail.trim()) {
    return "From email is required.";
  }

  try {
    parseSmtpPort(settings.smtpPort.trim());
  } catch (error) {
    return error instanceof Error ? error.message : "SMTP port is invalid.";
  }

  return null;
}

export async function saveContactMailerSettings(settings: ContactMailerSettingsInput) {
  if (!hasFirebaseAdminConfig) {
    throw new Error(
      "Firebase Admin is required to persist mailer settings from edit mode. Configure the Admin SDK first.",
    );
  }

  const validationError = validateMailerSettingsInput(settings);

  if (validationError) {
    throw new Error(validationError);
  }

  const existing = await readStoredMailerSettings();

  const passwordCiphertext = settings.smtpPass?.trim()
    ? encryptSecret(settings.smtpPass.trim())
    : existing?.passwordCiphertext;
  const nextSettings: StoredMailerSettings = {
    fromEmail: settings.fromEmail.trim(),
    fromName: settings.fromName.trim() || "Portfolio Contact",
    smtpHost: settings.smtpHost.trim(),
    smtpPort: parseSmtpPort(settings.smtpPort.trim()),
    smtpSecure: Boolean(settings.smtpSecure),
    smtpUser: settings.smtpUser.trim(),
    toEmail: settings.toEmail.trim(),
    updatedAt: new Date().toISOString(),
    v: 1,
  };

  if (passwordCiphertext) {
    nextSettings.passwordCiphertext = passwordCiphertext;
  }

  await getAdminFirestore()
    .collection(CONTACT_SETTINGS_COLLECTION)
    .doc(CONTACT_SETTINGS_DOCUMENT_ID)
    .set(nextSettings);

  return readContactMailerSettingsForEditor();
}

async function getResolvedMailerConfig() {
  const envSettings = getEnvMailerSettings();
  const storedSettings = await readStoredMailerSettings();
  const smtpPass = storedSettings?.passwordCiphertext
    ? decryptSecret(storedSettings.passwordCiphertext)
    : envSettings.smtpPass;

  const config = {
    fromEmail: storedSettings?.fromEmail || envSettings.fromEmail,
    fromName: storedSettings?.fromName || envSettings.fromName,
    smtpHost: storedSettings?.smtpHost || envSettings.smtpHost,
    smtpPass,
    smtpPort: storedSettings?.smtpPort || envSettings.smtpPort,
    smtpSecure: storedSettings?.smtpSecure ?? envSettings.smtpSecure,
    smtpUser: storedSettings?.smtpUser || envSettings.smtpUser,
    toEmail: storedSettings?.toEmail || envSettings.toEmail,
  } satisfies Partial<MailerConfig>;

  if (
    !config.smtpHost ||
    !config.smtpUser ||
    !config.smtpPass ||
    !config.toEmail ||
    !config.fromEmail ||
    !config.smtpPort
  ) {
    throw createMissingSettingsError();
  }

  return config as MailerConfig;
}

export async function sendContactEmail(message: ContactMessageInput) {
  const config = await getResolvedMailerConfig();
  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.smtpPass,
      user: config.smtpUser,
    },
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
  });

  await transporter.sendMail({
    from: formatAddress(config.fromName, config.fromEmail),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 16px;">New portfolio contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(message.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; border: 1px solid #d1d5db; padding: 16px; border-radius: 12px;">${escapeHtml(message.message)}</div>
      </div>
    `,
    replyTo: formatAddress(message.name, message.email),
    subject: `Portfolio contact from ${message.name}`,
    text: [
      "New portfolio contact message",
      "",
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      "",
      "Message:",
      message.message,
    ].join("\n"),
    to: config.toEmail,
  });
}

export function assertAdminSessionFromCookie(value?: string | null) {
  return isAdminSessionActive(value);
}

export { ADMIN_SESSION_COOKIE_NAME };
