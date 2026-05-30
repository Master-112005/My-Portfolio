import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  assertAdminSessionFromCookie,
  readWorkSettingsForEditor,
  saveWorkSettings,
} from "@/lib/work-settings";
import type { WorkSettingsInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Admin session required to manage GitHub work settings." },
    {
      headers: createNoStoreHeaders(),
      status: 401,
    },
  );
}

function createErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to manage GitHub work settings.";

  return NextResponse.json(
    { error: message },
    {
      headers: createNoStoreHeaders(),
      status: 500,
    },
  );
}

export async function GET(request: NextRequest) {
  if (!assertAdminSessionFromCookie(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
    return createUnauthorizedResponse();
  }

  try {
    return NextResponse.json(await readWorkSettingsForEditor(), {
      headers: createNoStoreHeaders(),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  if (!assertAdminSessionFromCookie(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
    return createUnauthorizedResponse();
  }

  try {
    const body = (await request.json().catch(() => null)) as WorkSettingsInput | null;

    if (!body) {
      return NextResponse.json(
        { error: "GitHub work settings payload is missing." },
        {
          headers: createNoStoreHeaders(),
          status: 400,
        },
      );
    }

    return NextResponse.json(await saveWorkSettings(body), {
      headers: createNoStoreHeaders(),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
