import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  assertAdminSessionFromCookie,
  readContactMailerSettingsForEditor,
  saveContactMailerSettings,
} from "@/lib/mailer";
import type { ContactMailerSettingsInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Admin session required to manage contact mailer settings." },
    {
      headers: createNoStoreHeaders(),
      status: 401,
    },
  );
}

function createErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to manage contact mailer settings.";

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
    const settings = await readContactMailerSettingsForEditor();

    return NextResponse.json(settings, {
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
    const body = (await request.json().catch(() => null)) as ContactMailerSettingsInput | null;

    if (!body) {
      return NextResponse.json(
        { error: "Mailer settings payload is missing." },
        {
          headers: createNoStoreHeaders(),
          status: 400,
        },
      );
    }

    const settings = await saveContactMailerSettings(body);

    return NextResponse.json(settings, {
      headers: createNoStoreHeaders(),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
