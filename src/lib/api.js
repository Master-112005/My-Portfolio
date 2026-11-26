import { mergePortfolioData } from "@/lib/defaultData";
async function parseJsonResponse(response) {
    const text = await response.text();
    if (!text) {
        return {};
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return {};
    }
}
async function requestApi(input, init) {
    const response = await fetch(input, {
        ...init,
        cache: "no-store",
        credentials: "same-origin",
        headers: {
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
            ...(init?.headers ?? {}),
        },
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
        const error = new Error(payload.error || `Request to ${input} failed with status ${response.status}.`);
        error.lockedUntil = payload.lockedUntil;
        error.remainingAttempts = payload.remainingAttempts;
        error.status = response.status;
        throw error;
    }
    return payload;
}
export async function loadPortfolioData() {
    const payload = await requestApi("/api/portfolio", {
        method: "GET",
    });
    return mergePortfolioData(payload.data);
}
export async function savePortfolioData(data) {
    const payload = await requestApi("/api/portfolio", {
        body: JSON.stringify({ data }),
        method: "PUT",
    });
    return mergePortfolioData(payload.data);
}
export const loadPortfolio = loadPortfolioData;
export const savePortfolio = savePortfolioData;
export async function submitContactMessage(message) {
    await requestApi("/api/contact", {
        body: JSON.stringify(message),
        method: "POST",
    });
}
export async function loadAdminSessionStatus() {
    const payload = await requestApi("/api/admin?resource=session", {
        method: "GET",
    });
    return {
        authenticated: payload.authenticated ?? false,
        lockedUntil: payload.lockedUntil ?? 0,
        remainingAttempts: payload.remainingAttempts ?? 0,
    };
}
export async function unlockAdminSession(password) {
    const payload = await requestApi("/api/admin?resource=session", {
        body: JSON.stringify({ password }),
        method: "POST",
    });
    return {
        authenticated: payload.authenticated ?? false,
        lockedUntil: payload.lockedUntil ?? 0,
        remainingAttempts: payload.remainingAttempts ?? 0,
    };
}
export async function clearAdminSession() {
    await requestApi("/api/admin?resource=session", {
        method: "DELETE",
    });
}
export async function loadContactMailerSettings() {
    const payload = await requestApi("/api/admin?resource=mailer", {
        method: "GET",
    });
    return {
        canPersist: payload.canPersist ?? false,
        fromEmail: payload.fromEmail ?? "",
        fromName: payload.fromName ?? "",
        hasPassword: payload.hasPassword ?? false,
        smtpHost: payload.smtpHost ?? "",
        smtpPort: payload.smtpPort ?? "",
        smtpSecure: payload.smtpSecure ?? false,
        smtpUser: payload.smtpUser ?? "",
        source: payload.source ?? "env",
        toEmail: payload.toEmail ?? "",
    };
}
export async function saveContactMailerSettings(settings) {
    const payload = await requestApi("/api/admin?resource=mailer", {
        body: JSON.stringify(settings),
        method: "PUT",
    });
    return {
        canPersist: payload.canPersist ?? false,
        fromEmail: payload.fromEmail ?? "",
        fromName: payload.fromName ?? "",
        hasPassword: payload.hasPassword ?? false,
        smtpHost: payload.smtpHost ?? "",
        smtpPort: payload.smtpPort ?? "",
        smtpSecure: payload.smtpSecure ?? false,
        smtpUser: payload.smtpUser ?? "",
        source: payload.source ?? "env",
        toEmail: payload.toEmail ?? "",
    };
}
export async function loadWorkSettings() {
    const payload = await requestApi("/api/admin?resource=work", {
        method: "GET",
    });
    return {
        canPersist: payload.canPersist ?? false,
        githubUsername: payload.githubUsername ?? "",
        hasGithubToken: payload.hasGithubToken ?? false,
        source: payload.source ?? "env",
    };
}
export async function saveWorkSettings(settings) {
    const payload = await requestApi("/api/admin?resource=work", {
        body: JSON.stringify(settings),
        method: "PUT",
    });
    return {
        canPersist: payload.canPersist ?? false,
        githubUsername: payload.githubUsername ?? "",
        hasGithubToken: payload.hasGithubToken ?? false,
        source: payload.source ?? "env",
    };
}
export async function uploadResumePdf(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin?action=upload-resume", {
        body: formData,
        cache: "no-store",
        credentials: "same-origin",
        method: "POST",
    });
    const payload = (await parseJsonResponse(response));
    if (!response.ok) {
        const error = new Error(payload.error || `Resume upload failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
    return {
        fileHref: payload.fileHref ?? "",
        fileName: payload.fileName ?? file.name,
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };
}
export async function uploadProjectMedia(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin?action=upload-media", {
        body: formData,
        cache: "no-store",
        credentials: "same-origin",
        method: "POST",
    });
    const payload = (await parseJsonResponse(response));
    if (!response.ok) {
        const error = new Error(payload.error || `Project media upload failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
    return {
        fileHref: payload.fileHref ?? "",
        fileName: payload.fileName ?? file.name,
        mediaType: payload.mediaType ?? (file.type.startsWith("video/") ? "video" : "image"),
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };
}
