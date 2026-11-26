import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
    ADMIN_ATTEMPTS_COOKIE_NAME,
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken,
    createLockedAttemptState,
    createRetryAttemptState,
    createUnlockAttemptToken,
    getRemainingAttempts,
    isAdminSessionActive,
    normalizeUnlockAttemptState,
    readUnlockAttemptState,
    resetUnlockAttemptState,
    SESSION_MAX_AGE_SECONDS,
    verifyAdminPassword,
} from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase";
import {
    readContactMailerSettingsForEditor,
    readWorkSettingsForEditor,
    saveContactMailerSettings,
    saveWorkSettings,
} from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESUME_COLLECTION = "admin_assets";
const RESUME_DOCUMENT_ID = "resume_pdf";
const RESUME_CHUNK_SIZE = 600 * 1024;
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

const MEDIA_COLLECTION = "project_media_assets";
const MEDIA_CHUNK_SIZE = 600 * 1024;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

function createCookieOptions(maxAge) {
    return {
        httpOnly: true,
        maxAge,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    };
}

function createNoStoreHeaders() {
    return {
        "Cache-Control": "no-store, no-cache, must-revalidate",
    };
}

function createErrorResponse(message, status) {
    return NextResponse.json({ error: message }, {
        headers: createNoStoreHeaders(),
        status,
    });
}

function createUnauthorizedResponse(message) {
    return createErrorResponse(message, 401);
}

function hasAdminSession(request) {
    return isAdminSessionActive(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);
}

function applyAttemptStateCookie(response, lockedUntil, failedAttempts) {
    const token = createUnlockAttemptToken({ failedAttempts, lockedUntil });
    if (!token) {
        response.cookies.delete(ADMIN_ATTEMPTS_COOKIE_NAME);
        return;
    }
    const remainingSeconds = lockedUntil > Date.now()
        ? Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000))
        : 5 * 60;
    response.cookies.set(ADMIN_ATTEMPTS_COOKIE_NAME, token, createCookieOptions(remainingSeconds));
}

// --- Session ---------------------------------------------------------------

function readSessionStatus(request) {
    const attemptState = normalizeUnlockAttemptState(readUnlockAttemptState(request.cookies.get(ADMIN_ATTEMPTS_COOKIE_NAME)?.value));
    const response = NextResponse.json({
        authenticated: hasAdminSession(request),
        lockedUntil: attemptState.lockedUntil,
        remainingAttempts: getRemainingAttempts(attemptState),
    }, {
        headers: createNoStoreHeaders(),
    });
    applyAttemptStateCookie(response, attemptState.lockedUntil, attemptState.failedAttempts);
    return response;
}

async function unlockSession(request) {
    const body = (await request.json().catch(() => null));
    const password = body?.password?.trim() ?? "";
    const attemptState = normalizeUnlockAttemptState(readUnlockAttemptState(request.cookies.get(ADMIN_ATTEMPTS_COOKIE_NAME)?.value));

    if (attemptState.lockedUntil > Date.now()) {
        const response = NextResponse.json({
            authenticated: false,
            error: "Too many failed attempts. Edit mode is temporarily locked.",
            lockedUntil: attemptState.lockedUntil,
            remainingAttempts: 0,
        }, {
            headers: createNoStoreHeaders(),
            status: 429,
        });
        applyAttemptStateCookie(response, attemptState.lockedUntil, attemptState.failedAttempts);
        return response;
    }

    if (!/^\d{12}$/.test(password)) {
        return NextResponse.json({
            authenticated: false,
            error: "Password must be exactly 12 digits.",
            lockedUntil: attemptState.lockedUntil,
            remainingAttempts: getRemainingAttempts(attemptState),
        }, {
            headers: createNoStoreHeaders(),
            status: 400,
        });
    }

    if (!verifyAdminPassword(password)) {
        const failedAttempts = attemptState.failedAttempts + 1;
        const nextAttemptState = failedAttempts >= 5
            ? createLockedAttemptState()
            : createRetryAttemptState(failedAttempts);
        const response = NextResponse.json({
            authenticated: false,
            error: nextAttemptState.lockedUntil > 0
                ? "Too many failed attempts. Edit mode is temporarily locked."
                : `Incorrect password. ${getRemainingAttempts(nextAttemptState)} attempt(s) remaining.`,
            lockedUntil: nextAttemptState.lockedUntil,
            remainingAttempts: getRemainingAttempts(nextAttemptState),
        }, {
            headers: createNoStoreHeaders(),
            status: nextAttemptState.lockedUntil > 0 ? 429 : 401,
        });
        applyAttemptStateCookie(response, nextAttemptState.lockedUntil, nextAttemptState.failedAttempts);
        response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
        return response;
    }

    const response = NextResponse.json({
        authenticated: true,
        lockedUntil: 0,
        remainingAttempts: getRemainingAttempts(resetUnlockAttemptState()),
    }, {
        headers: createNoStoreHeaders(),
    });
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken(), createCookieOptions(SESSION_MAX_AGE_SECONDS));
    response.cookies.delete(ADMIN_ATTEMPTS_COOKIE_NAME);
    return response;
}

function clearSession() {
    const response = NextResponse.json({ ok: true }, {
        headers: createNoStoreHeaders(),
    });
    response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
    return response;
}

// --- Uploads ---------------------------------------------------------------

function sanitizeFileName(value, fallback, mustEndWith) {
    const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
    if (mustEndWith && !normalized.toLowerCase().endsWith(mustEndWith)) {
        return fallback;
    }
    return normalized || fallback;
}

function getMediaType(contentType) {
    if (contentType.startsWith("image/")) {
        return "image";
    }
    if (contentType.startsWith("video/")) {
        return "video";
    }
    return null;
}

async function clearResumeChunks() {
    const chunkDocuments = await getAdminFirestore()
        .collection(RESUME_COLLECTION)
        .doc(RESUME_DOCUMENT_ID)
        .collection("chunks")
        .listDocuments();
    for (let index = 0; index < chunkDocuments.length; index += 450) {
        const batch = getAdminFirestore().batch();
        chunkDocuments.slice(index, index + 450).forEach((chunkDocument) => batch.delete(chunkDocument));
        await batch.commit();
    }
}

async function saveResumePdf(bytes, fileName, updatedAt) {
    await clearResumeChunks();
    const chunkCollection = getAdminFirestore()
        .collection(RESUME_COLLECTION)
        .doc(RESUME_DOCUMENT_ID)
        .collection("chunks");
    for (let offset = 0, index = 0; offset < bytes.length; offset += RESUME_CHUNK_SIZE, index += 1) {
        await chunkCollection.doc(String(index).padStart(4, "0")).set({
            data: bytes.subarray(offset, offset + RESUME_CHUNK_SIZE).toString("base64"),
            order: index,
        });
    }
    await getAdminFirestore()
        .collection(RESUME_COLLECTION)
        .doc(RESUME_DOCUMENT_ID)
        .set({
            contentType: "application/pdf",
            fileName,
            size: bytes.length,
            updatedAt,
            v: 1,
        });
}

async function uploadResume(request) {
    if (!hasFirebaseAdminConfig) {
        return createErrorResponse("Firebase Admin is required to persist resume PDFs from edit mode.", 500);
    }
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
        return createErrorResponse("Resume PDF payload is missing.", 400);
    }
    if (file.size <= 0) {
        return createErrorResponse("Resume PDF is empty.", 400);
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
        return createErrorResponse("Resume PDF must be 5 MB or smaller.", 400);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("utf8") !== "%PDF-") {
        return createErrorResponse("Uploaded file must be a valid PDF.", 400);
    }
    const updatedAt = new Date().toISOString();
    const fileName = sanitizeFileName(file.name, "resume.pdf", ".pdf");
    await saveResumePdf(bytes, fileName, updatedAt);
    return NextResponse.json({
        fileName,
        fileHref: `/api/resume?v=${encodeURIComponent(updatedAt)}`,
        updatedAt,
    }, {
        headers: createNoStoreHeaders(),
    });
}

async function uploadProjectMedia(request) {
    if (!hasFirebaseAdminConfig) {
        return createErrorResponse("Firebase Admin is required to persist project media from edit mode.", 500);
    }
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
        return createErrorResponse("Project media payload is missing.", 400);
    }
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
        return createErrorResponse("Project media must be an image or video file.", 400);
    }
    if (file.size <= 0) {
        return createErrorResponse("Project media file is empty.", 400);
    }
    if (mediaType === "image" && file.size > MAX_IMAGE_SIZE_BYTES) {
        return createErrorResponse("Project images must be 2 MB or smaller after processing.", 400);
    }
    if (mediaType === "video" && file.size > MAX_VIDEO_SIZE_BYTES) {
        return createErrorResponse("Project videos must be 200 MB or smaller.", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const updatedAt = new Date().toISOString();
    const document = getAdminFirestore().collection(MEDIA_COLLECTION).doc(id);
    const chunkCollection = document.collection("chunks");
    for (let offset = 0, index = 0; offset < bytes.length; offset += MEDIA_CHUNK_SIZE, index += 1) {
        await chunkCollection.doc(String(index).padStart(4, "0")).set({
            data: bytes.subarray(offset, offset + MEDIA_CHUNK_SIZE).toString("base64"),
            order: index,
        });
    }
    const fallbackName = mediaType === "video" ? "project-video" : "project-image";
    const fileName = sanitizeFileName(file.name, fallbackName);
    await document.set({
        contentType: file.type,
        fileName,
        mediaType,
        size: bytes.length,
        updatedAt,
        v: 1,
    });
    return NextResponse.json({
        fileHref: `/api/project-media/${id}?v=${encodeURIComponent(updatedAt)}`,
        fileName,
        mediaType,
        updatedAt,
    }, {
        headers: createNoStoreHeaders(),
    });
}

// --- Route handlers --------------------------------------------------------

export async function GET(request) {
    const resource = new URL(request.url).searchParams.get("resource") ?? "session";
    if (resource === "session") {
        return readSessionStatus(request);
    }
    if (!hasAdminSession(request)) {
        return createUnauthorizedResponse("Admin session required.");
    }
    try {
        if (resource === "mailer") {
            return NextResponse.json(await readContactMailerSettingsForEditor(), { headers: createNoStoreHeaders() });
        }
        if (resource === "work") {
            return NextResponse.json(await readWorkSettingsForEditor(), { headers: createNoStoreHeaders() });
        }
        return createErrorResponse(`Unknown admin resource: ${resource}`, 404);
    }
    catch (error) {
        return createErrorResponse(error instanceof Error ? error.message : "Failed to read admin settings.", 500);
    }
}

export async function POST(request) {
    const action = new URL(request.url).searchParams.get("action") ?? "unlock";
    if (action === "unlock") {
        return unlockSession(request);
    }
    if (!hasAdminSession(request)) {
        return createUnauthorizedResponse("Admin session required.");
    }
    try {
        if (action === "upload-resume") {
            return await uploadResume(request);
        }
        if (action === "upload-media") {
            return await uploadProjectMedia(request);
        }
        return createErrorResponse(`Unknown admin action: ${action}`, 404);
    }
    catch (error) {
        return createErrorResponse(error instanceof Error ? error.message : "Admin request failed.", 500);
    }
}

export async function PUT(request) {
    const resource = new URL(request.url).searchParams.get("resource");
    if (!hasAdminSession(request)) {
        return createUnauthorizedResponse("Admin session required.");
    }
    const body = await request.json().catch(() => null);
    if (!body) {
        return createErrorResponse("Settings payload is missing.", 400);
    }
    try {
        if (resource === "mailer") {
            return NextResponse.json(await saveContactMailerSettings(body), { headers: createNoStoreHeaders() });
        }
        if (resource === "work") {
            return NextResponse.json(await saveWorkSettings(body), { headers: createNoStoreHeaders() });
        }
        return createErrorResponse("Unknown admin resource.", 404);
    }
    catch (error) {
        return createErrorResponse(error instanceof Error ? error.message : "Failed to save admin settings.", 500);
    }
}

export async function DELETE() {
    return clearSession();
}
