import { NextResponse } from "next/server";

import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESUME_COLLECTION = "admin_assets";
const RESUME_DOCUMENT_ID = "resume_pdf";

type ResumeMetadata = {
  contentType?: string;
  fileName?: string;
  updatedAt?: string;
};

type ResumeChunk = {
  data?: string;
  order?: number;
};

function createNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

export async function GET() {
  if (!hasFirebaseAdminConfig) {
    return NextResponse.json(
      { error: "Resume PDF is not configured." },
      {
        headers: createNoStoreHeaders(),
        status: 404,
      },
    );
  }

  const resumeDocument = getAdminFirestore()
    .collection(RESUME_COLLECTION)
    .doc(RESUME_DOCUMENT_ID);
  const metadataSnapshot = await resumeDocument.get();

  if (!metadataSnapshot.exists) {
    return NextResponse.json(
      { error: "Resume PDF has not been uploaded." },
      {
        headers: createNoStoreHeaders(),
        status: 404,
      },
    );
  }

  const metadata = metadataSnapshot.data() as ResumeMetadata;
  const chunkSnapshot = await resumeDocument.collection("chunks").orderBy("order", "asc").get();
  const chunks = chunkSnapshot.docs
    .map((document) => document.data() as ResumeChunk)
    .filter((chunk) => typeof chunk.data === "string")
    .map((chunk) => Buffer.from(chunk.data as string, "base64"));

  if (!chunks.length) {
    return NextResponse.json(
      { error: "Resume PDF data is missing." },
      {
        headers: createNoStoreHeaders(),
        status: 404,
      },
    );
  }

  const fileName = metadata.fileName || "resume.pdf";
  const body = Buffer.concat(chunks);

  return new NextResponse(body, {
    headers: {
      ...createNoStoreHeaders(),
      "Content-Disposition": `inline; filename="${fileName.replaceAll('"', '\\"')}"`,
      "Content-Length": String(body.length),
      "Content-Type": metadata.contentType || "application/pdf",
      "Last-Modified": metadata.updatedAt ? new Date(metadata.updatedAt).toUTCString() : new Date().toUTCString(),
    },
  });
}
