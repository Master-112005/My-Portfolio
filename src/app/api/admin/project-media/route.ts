import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME, isAdminSessionActive } from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
const MEDIA_COLLECTION = "project_media_assets";
const MEDIA_CHUNK_SIZE = 600 * 1024;

function createNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      headers: createNoStoreHeaders(),
      status,
    },
  );
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized || fallback;
}

function getMediaType(contentType: string) {
  if (contentType.startsWith("image/")) {
    return "image" as const;
  }

  if (contentType.startsWith("video/")) {
    return "video" as const;
  }

  return null;
}

async function saveProjectMedia(bytes: Buffer, file: File, mediaType: "image" | "video") {
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

  return {
    fileHref: `/api/project-media/${id}?v=${encodeURIComponent(updatedAt)}`,
    fileName,
    mediaType,
    updatedAt,
  };
}

export async function POST(request: NextRequest) {
  if (!isAdminSessionActive(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
    return createErrorResponse("Admin session required to upload project media.", 401);
  }

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
  const result = await saveProjectMedia(bytes, file, mediaType);

  return NextResponse.json(result, {
    headers: createNoStoreHeaders(),
  });
}
