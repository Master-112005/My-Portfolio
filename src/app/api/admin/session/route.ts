import { NextRequest, NextResponse } from "next/server";

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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function createNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function applyAttemptStateCookie(response: NextResponse, lockedUntil: number, failedAttempts: number) {
  const token = createUnlockAttemptToken({ failedAttempts, lockedUntil });

  if (!token) {
    response.cookies.delete(ADMIN_ATTEMPTS_COOKIE_NAME);
    return;
  }

  const remainingSeconds =
    lockedUntil > Date.now()
      ? Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000))
      : 5 * 60;

  response.cookies.set(
    ADMIN_ATTEMPTS_COOKIE_NAME,
    token,
    createCookieOptions(remainingSeconds),
  );
}

export async function GET(request: NextRequest) {
  const normalizedAttemptState = normalizeUnlockAttemptState(
    readUnlockAttemptState(request.cookies.get(ADMIN_ATTEMPTS_COOKIE_NAME)?.value),
  );
  const response = NextResponse.json(
    {
      authenticated: isAdminSessionActive(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value),
      lockedUntil: normalizedAttemptState.lockedUntil,
      remainingAttempts: getRemainingAttempts(normalizedAttemptState),
    },
    {
      headers: createNoStoreHeaders(),
    },
  );

  applyAttemptStateCookie(
    response,
    normalizedAttemptState.lockedUntil,
    normalizedAttemptState.failedAttempts,
  );

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<{
    password: string;
  }> | null;
  const password = body?.password?.trim() ?? "";
  const normalizedAttemptState = normalizeUnlockAttemptState(
    readUnlockAttemptState(request.cookies.get(ADMIN_ATTEMPTS_COOKIE_NAME)?.value),
  );

  if (normalizedAttemptState.lockedUntil > Date.now()) {
    const response = NextResponse.json(
      {
        authenticated: false,
        error: "Too many failed attempts. Edit mode is temporarily locked.",
        lockedUntil: normalizedAttemptState.lockedUntil,
        remainingAttempts: 0,
      },
      {
        headers: createNoStoreHeaders(),
        status: 429,
      },
    );

    applyAttemptStateCookie(
      response,
      normalizedAttemptState.lockedUntil,
      normalizedAttemptState.failedAttempts,
    );

    return response;
  }

  if (!/^\d{12}$/.test(password)) {
    return NextResponse.json(
      {
        authenticated: false,
        error: "Password must be exactly 12 digits.",
        lockedUntil: normalizedAttemptState.lockedUntil,
        remainingAttempts: getRemainingAttempts(normalizedAttemptState),
      },
      {
        headers: createNoStoreHeaders(),
        status: 400,
      },
    );
  }

  if (!verifyAdminPassword(password)) {
    const failedAttempts = normalizedAttemptState.failedAttempts + 1;
    const nextAttemptState =
      failedAttempts >= 5
        ? createLockedAttemptState()
        : createRetryAttemptState(failedAttempts);
    const response = NextResponse.json(
      {
        authenticated: false,
        error:
          nextAttemptState.lockedUntil > 0
            ? "Too many failed attempts. Edit mode is temporarily locked."
            : `Incorrect password. ${getRemainingAttempts(nextAttemptState)} attempt(s) remaining.`,
        lockedUntil: nextAttemptState.lockedUntil,
        remainingAttempts: getRemainingAttempts(nextAttemptState),
      },
      {
        headers: createNoStoreHeaders(),
        status: nextAttemptState.lockedUntil > 0 ? 429 : 401,
      },
    );

    applyAttemptStateCookie(
      response,
      nextAttemptState.lockedUntil,
      nextAttemptState.failedAttempts,
    );
    response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      lockedUntil: 0,
      remainingAttempts: getRemainingAttempts(resetUnlockAttemptState()),
    },
    {
      headers: createNoStoreHeaders(),
    },
  );

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken(),
    createCookieOptions(SESSION_MAX_AGE_SECONDS),
  );
  response.cookies.delete(ADMIN_ATTEMPTS_COOKIE_NAME);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: createNoStoreHeaders(),
    },
  );

  response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);

  return response;
}
