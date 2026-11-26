import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/settings";
import { getPortfolioStoreBackend, submitContactToStore } from "@/lib/portfolio-store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
function createHeaders() {
    return {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Portfolio-Store-Backend": getPortfolioStoreBackend(),
    };
}
function createErrorResponse(error) {
    const message = error instanceof Error ? error.message : "Contact request failed.";
    const lowered = message.toLowerCase();
    const status = lowered.includes("permission denied") ? 403 : 500;
    return NextResponse.json({ error: message }, {
        headers: createHeaders(),
        status,
    });
}
function validateMessage(message) {
    if (message.name.trim().length < 2) {
        return "Please enter a valid name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email.trim())) {
        return "Please enter a valid email address.";
    }
    if (message.message.trim().length < 12) {
        return "Message should be at least 12 characters.";
    }
    return null;
}
export async function POST(request) {
    try {
        const body = (await request.json().catch(() => null));
        if (!body) {
            return NextResponse.json({ error: "Contact payload is missing." }, {
                headers: createHeaders(),
                status: 400,
            });
        }
        const validationError = validateMessage(body);
        if (validationError) {
            return NextResponse.json({ error: validationError }, {
                headers: createHeaders(),
                status: 400,
            });
        }
        const message = {
            email: body.email.trim(),
            message: body.message.trim(),
            name: body.name.trim(),
        };
        await sendContactEmail(message);
        try {
            await submitContactToStore(message);
        }
        catch (error) {
            console.error("Contact message email delivered but Firestore persistence failed.", error);
        }
        return NextResponse.json({ ok: true }, {
            headers: createHeaders(),
            status: 201,
        });
    }
    catch (error) {
        return createErrorResponse(error);
    }
}
