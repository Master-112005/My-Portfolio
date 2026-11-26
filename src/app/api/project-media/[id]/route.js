import { NextResponse } from "next/server";
import { getAdminFirestore, hasFirebaseAdminConfig } from "@/lib/firebase";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MEDIA_COLLECTION = "project_media_assets";
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
function sanitizeDispositionFileName(value) {
    return value.replaceAll('"', '\\"');
}
export async function GET(_request, { params }) {
    if (!hasFirebaseAdminConfig) {
        return createErrorResponse("Project media is not configured.", 404);
    }
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
        return createErrorResponse("Project media id is invalid.", 400);
    }
    const mediaDocument = getAdminFirestore().collection(MEDIA_COLLECTION).doc(id);
    const metadataSnapshot = await mediaDocument.get();
    if (!metadataSnapshot.exists) {
        return createErrorResponse("Project media was not found.", 404);
    }
    const metadata = metadataSnapshot.data();
    const chunkSnapshot = await mediaDocument.collection("chunks").orderBy("order", "asc").get();
    const chunks = chunkSnapshot.docs
        .map((document) => document.data())
        .filter((chunk) => typeof chunk.data === "string")
        .map((chunk) => Buffer.from(chunk.data, "base64"));
    if (!chunks.length) {
        return createErrorResponse("Project media data is missing.", 404);
    }
    const body = Buffer.concat(chunks);
    const fileName = sanitizeDispositionFileName(metadata.fileName || "project-media");
    return new NextResponse(body, {
        headers: {
            ...createNoStoreHeaders(),
            "Content-Disposition": `inline; filename="${fileName}"`,
            "Content-Length": String(body.length),
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Last-Modified": metadata.updatedAt ? new Date(metadata.updatedAt).toUTCString() : new Date().toUTCString(),
        },
    });
}
