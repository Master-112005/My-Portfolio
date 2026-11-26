import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
const DEFAULT_ADMIN_HASH = "ed2d4c4cfbe3a7d41aa1fbc0e93df82f4fbc1c82faec35a95a2907d956d5795e";
export const ADMIN_ATTEMPTS_COOKIE_NAME = "interactive-storytelling-portfolio-admin-attempts";
export const ADMIN_SESSION_COOKIE_NAME = "interactive-storytelling-portfolio-admin-session";
export const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
}
function getAdminPasswordHash() {
    return (process.env.ADMIN_PASSWORD_HASH?.trim() ||
        process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH?.trim() ||
        DEFAULT_ADMIN_HASH);
}
export function getAdminSessionSecret() {
    return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPasswordHash();
}
function signPayload(payload) {
    return createHmac("sha256", getAdminSessionSecret())
        .update(payload)
        .digest("base64url");
}
function createSignedValue(payload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedPayload}.${signPayload(encodedPayload)}`;
}
function readSignedValue(value) {
    if (!value) {
        return null;
    }
    const [encodedPayload, signature] = value.split(".");
    if (!encodedPayload || !signature || !safeEqual(signature, signPayload(encodedPayload))) {
        return null;
    }
    try {
        return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    }
    catch {
        return null;
    }
}
export function createAdminSessionToken(now = Date.now()) {
    return createSignedValue({
        exp: now + SESSION_MAX_AGE_SECONDS * 1000,
        nonce: randomUUID(),
        v: 1,
    });
}
export function readAdminSession(value) {
    const payload = readSignedValue(value);
    if (!payload || payload.exp <= Date.now()) {
        return null;
    }
    return payload;
}
export function isAdminSessionActive(value) {
    return Boolean(readAdminSession(value));
}
export function createUnlockAttemptToken(state) {
    if (state.failedAttempts <= 0 && state.lockedUntil <= 0) {
        return null;
    }
    return createSignedValue({
        failedAttempts: state.failedAttempts,
        lockedUntil: state.lockedUntil,
        v: 1,
    });
}
export function readUnlockAttemptState(value) {
    const payload = readSignedValue(value);
    if (!payload) {
        return {
            failedAttempts: 0,
            lockedUntil: 0,
        };
    }
    return {
        failedAttempts: payload.failedAttempts,
        lockedUntil: payload.lockedUntil,
    };
}
export function resetUnlockAttemptState() {
    return {
        failedAttempts: 0,
        lockedUntil: 0,
    };
}
export function normalizeUnlockAttemptState(state) {
    if (state.lockedUntil > 0 && state.lockedUntil <= Date.now()) {
        return resetUnlockAttemptState();
    }
    return state;
}
export function createLockedAttemptState(now = Date.now()) {
    return {
        failedAttempts: MAX_ATTEMPTS,
        lockedUntil: now + LOCKOUT_WINDOW_MS,
    };
}
export function createRetryAttemptState(failedAttempts) {
    return {
        failedAttempts,
        lockedUntil: 0,
    };
}
export function getRemainingAttempts(state) {
    if (state.lockedUntil > Date.now()) {
        return 0;
    }
    return Math.max(0, MAX_ATTEMPTS - state.failedAttempts);
}
export function verifyAdminPassword(password) {
    const incomingHash = createHash("sha256").update(password).digest("hex");
    return safeEqual(incomingHash, getAdminPasswordHash());
}
