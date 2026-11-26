import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { getAdminSessionSecret } from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase";

const SETTINGS_COLLECTION = "admin_settings";
const MAILER_DOCUMENT_ID = "contact_mailer";
const WORK_DOCUMENT_ID = "work_github";

function readEnv(name) {
    return process.env[name]?.trim() || "";
}

// --- Shared encrypted settings storage -------------------------------------

function getEncryptionKey() {
    return createHash("sha256").update(getAdminSessionSecret()).digest();
}

function encryptSecret(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptSecret(value, label) {
    const [ivPart, tagPart, payloadPart] = value.split(".");
    if (!ivPart || !tagPart || !payloadPart) {
        throw new Error(`Stored ${label} is invalid.`);
    }
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
        decipher.update(Buffer.from(payloadPart, "base64url")),
        decipher.final(),
    ]).toString("utf8");
}

async function readSettingsDocument(documentId) {
    if (!hasFirebaseAdminConfig) {
        return null;
    }
    const snapshot = await getAdminFirestore()
        .collection(SETTINGS_COLLECTION)
        .doc(documentId)
        .get();
    return snapshot.exists ? snapshot.data() : null;
}

async function writeSettingsDocument(documentId, data) {
    await getAdminFirestore()
        .collection(SETTINGS_COLLECTION)
        .doc(documentId)
        .set(data);
}

// --- Contact mailer --------------------------------------------------------

function parseSmtpPort(value) {
    const port = Number(value);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error("SMTP port must be a valid positive integer.");
    }
    return port;
}

function parseBooleanValue(value, fallback) {
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

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatAddress(name, email) {
    return `"${name.replaceAll('"', '\\"')}" <${email}>`;
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

export async function readContactMailerSettingsForEditor() {
    const envSettings = getEnvMailerSettings();
    const storedSettings = await readSettingsDocument(MAILER_DOCUMENT_ID);
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
    };
}

function validateMailerSettingsInput(settings) {
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
    }
    catch (error) {
        return error instanceof Error ? error.message : "SMTP port is invalid.";
    }
    return null;
}

export async function saveContactMailerSettings(settings) {
    if (!hasFirebaseAdminConfig) {
        throw new Error("Firebase Admin is required to persist mailer settings from edit mode. Configure the Admin SDK first.");
    }
    const validationError = validateMailerSettingsInput(settings);
    if (validationError) {
        throw new Error(validationError);
    }
    const existing = await readSettingsDocument(MAILER_DOCUMENT_ID);
    const passwordCiphertext = settings.smtpPass?.trim()
        ? encryptSecret(settings.smtpPass.trim())
        : existing?.passwordCiphertext;
    const nextSettings = {
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
    await writeSettingsDocument(MAILER_DOCUMENT_ID, nextSettings);
    return readContactMailerSettingsForEditor();
}

async function getResolvedMailerConfig() {
    const envSettings = getEnvMailerSettings();
    const storedSettings = await readSettingsDocument(MAILER_DOCUMENT_ID);
    const smtpPass = storedSettings?.passwordCiphertext
        ? decryptSecret(storedSettings.passwordCiphertext, "contact mailer password")
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
    };
    if (!config.smtpHost ||
        !config.smtpUser ||
        !config.smtpPass ||
        !config.toEmail ||
        !config.fromEmail ||
        !config.smtpPort) {
        throw new Error("Contact mailer is not configured. Open edit mode, set the mailer settings, and save them before using the contact form.");
    }
    return config;
}

export async function sendContactEmail(message) {
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
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111;">
        <h2 style="margin-bottom: 16px;">New portfolio contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(message.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; border: 1px solid #d4d4d4; padding: 16px; border-radius: 12px;">${escapeHtml(message.message)}</div>
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

// --- GitHub work settings --------------------------------------------------

export async function readWorkSettingsForEditor() {
    const storedSettings = await readSettingsDocument(WORK_DOCUMENT_ID);
    const envUsername = readEnv("GITHUB_USERNAME");
    const envToken = readEnv("GITHUB_TOKEN");
    return {
        canPersist: hasFirebaseAdminConfig,
        githubUsername: storedSettings?.githubUsername || envUsername,
        hasGithubToken: Boolean(storedSettings?.githubTokenCiphertext || envToken),
        source: storedSettings ? "firestore" : "env",
    };
}

export async function saveWorkSettings(settings) {
    if (!hasFirebaseAdminConfig) {
        throw new Error("Firebase Admin is required to persist GitHub work settings from edit mode. Configure the Admin SDK first.");
    }
    const githubUsername = settings.githubUsername.trim().replace(/^@/, "");
    if (!githubUsername) {
        throw new Error("GitHub username is required.");
    }
    const existing = await readSettingsDocument(WORK_DOCUMENT_ID);
    const githubTokenCiphertext = settings.githubToken?.trim()
        ? encryptSecret(settings.githubToken.trim())
        : existing?.githubTokenCiphertext;
    const nextSettings = {
        githubUsername,
        updatedAt: new Date().toISOString(),
        v: 1,
    };
    if (githubTokenCiphertext) {
        nextSettings.githubTokenCiphertext = githubTokenCiphertext;
    }
    await writeSettingsDocument(WORK_DOCUMENT_ID, nextSettings);
    return readWorkSettingsForEditor();
}

export async function readResolvedGithubSettings() {
    const storedSettings = await readSettingsDocument(WORK_DOCUMENT_ID);
    const githubToken = storedSettings?.githubTokenCiphertext
        ? decryptSecret(storedSettings.githubTokenCiphertext, "GitHub token")
        : readEnv("GITHUB_TOKEN");
    return {
        githubToken,
        githubUsername: storedSettings?.githubUsername || readEnv("GITHUB_USERNAME"),
    };
}
