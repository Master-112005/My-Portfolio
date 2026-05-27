import { NextRequest, NextResponse } from "next/server";

import { mergePortfolioData } from "@/data/defaultData";
import { ADMIN_SESSION_COOKIE_NAME, isAdminSessionActive } from "@/lib/admin-session";
import { getPortfolioStoreBackend, readPortfolioFromStore, writePortfolioToStore } from "@/lib/portfolio-store";
import type { PortfolioData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Portfolio-Store-Backend": getPortfolioStoreBackend(),
  };
}

function createErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Portfolio request failed.";
  const loweredMessage = message.toLowerCase();
  const status =
    loweredMessage.includes("permission denied")
      ? 403
      : loweredMessage.includes("not configured")
        ? 500
        : 500;

  return NextResponse.json(
    { error: message },
    {
      headers: createHeaders(),
      status,
    },
  );
}

export async function GET() {
  try {
    const data = await readPortfolioFromStore();

    return NextResponse.json(
      { data },
      {
        headers: createHeaders(),
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminSessionActive(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.json(
      {
        error: "Admin session required to save portfolio data.",
      },
      {
        headers: createHeaders(),
        status: 401,
      },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Partial<{
      data: Partial<PortfolioData>;
    }> | null;

    if (!body?.data) {
      return NextResponse.json(
        {
          error: "Portfolio payload is missing.",
        },
        {
          headers: createHeaders(),
          status: 400,
        },
      );
    }

    const nextData = mergePortfolioData(body.data);
    await writePortfolioToStore(nextData);

    return NextResponse.json(
      { data: nextData },
      {
        headers: createHeaders(),
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
