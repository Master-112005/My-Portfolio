import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME, isAdminSessionActive } from "@/lib/admin-session";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const RESUME_COLLECTION = "admin_assets";
const RESUME_DOCUMENT_ID = "resume_pdf";
const RESUME_CHUNK_SIZE = 600 * 1024;

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

function sanitizeFileName(value: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : "resume.pdf";
}

async function clearExistingChunks() {
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

async function saveResumePdf(bytes: Buffer, fileName: string, updatedAt: string) {
  await clearExistingChunks();

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

export async function POST(request: NextRequest) {
  if (!isAdminSessionActive(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
    return createErrorResponse("Admin session required to upload a resume.", 401);
  }

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
  const fileName = sanitizeFileName(file.name);
  await saveResumePdf(bytes, fileName, updatedAt);

  return NextResponse.json(
    {
      fileName,
      fileHref: `/api/resume?v=${encodeURIComponent(updatedAt)}`,
      updatedAt,
    },
    {
      headers: createNoStoreHeaders(),
    },
  );
}
