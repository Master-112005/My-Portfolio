import { mergePortfolioData } from "@/data/defaultData";
import type {
  ContactMailerSettings,
  ContactMailerSettingsInput,
  ContactMessageInput,
  PortfolioData,
  WorkSettings,
  WorkSettingsInput,
} from "@/lib/types";

export type AdminSessionStatus = {
  authenticated: boolean;
  lockedUntil: number;
  remainingAttempts: number;
};

export type ApiRequestError = Error & {
  lockedUntil?: number;
  remainingAttempts?: number;
  status?: number;
};

type ContactMailerSettingsEnvelope = {
  canPersist?: boolean;
  error?: string;
  fromEmail?: string;
  fromName?: string;
  hasPassword?: boolean;
  smtpHost?: string;
  smtpPort?: string;
  smtpSecure?: boolean;
  smtpUser?: string;
  source?: "env" | "firestore";
  toEmail?: string;
};

type WorkSettingsEnvelope = {
  canPersist?: boolean;
  error?: string;
  githubUsername?: string;
  hasGithubToken?: boolean;
  source?: "env" | "firestore";
};

type ApiEnvelope = {
  authenticated?: boolean;
  data?: Partial<PortfolioData>;
  error?: string;
  lockedUntil?: number;
  ok?: boolean;
  remainingAttempts?: number;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as ApiEnvelope;
  }

  try {
    return JSON.parse(text) as ApiEnvelope;
  } catch {
    return {} as ApiEnvelope;
  }
}

async function requestApi<T extends ApiEnvelope>(input: string, init?: RequestInit) {
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
    const error = new Error(
      payload.error || `Request to ${input} failed with status ${response.status}.`,
    ) as ApiRequestError;

    error.lockedUntil = payload.lockedUntil;
    error.remainingAttempts = payload.remainingAttempts;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export async function loadPortfolioData() {
  const payload = await requestApi<{ data: Partial<PortfolioData> }>("/api/portfolio", {
    method: "GET",
  });
  return mergePortfolioData(payload.data);
}

export async function savePortfolioData(data: PortfolioData) {
  const payload = await requestApi<{ data: Partial<PortfolioData> }>("/api/portfolio", {
    body: JSON.stringify({ data }),
    method: "PUT",
  });
  return mergePortfolioData(payload.data);
}

export const loadPortfolio = loadPortfolioData;
export const savePortfolio = savePortfolioData;

export async function submitContactMessage(message: ContactMessageInput) {
  await requestApi<{ ok: boolean }>("/api/contact", {
    body: JSON.stringify(message),
    method: "POST",
  });
}

export async function loadAdminSessionStatus() {
  const payload = await requestApi<AdminSessionStatus>("/api/admin/session", {
    method: "GET",
  });

  return {
    authenticated: payload.authenticated ?? false,
    lockedUntil: payload.lockedUntil ?? 0,
    remainingAttempts: payload.remainingAttempts ?? 0,
  };
}

export async function unlockAdminSession(password: string) {
  const payload = await requestApi<AdminSessionStatus>("/api/admin/session", {
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
  await requestApi<{ ok: boolean }>("/api/admin/session", {
    method: "DELETE",
  });
}

export async function loadContactMailerSettings() {
  const payload = await requestApi<ContactMailerSettingsEnvelope>("/api/admin/contact-settings", {
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
  } satisfies ContactMailerSettings;
}

export async function saveContactMailerSettings(settings: ContactMailerSettingsInput) {
  const payload = await requestApi<ContactMailerSettingsEnvelope>("/api/admin/contact-settings", {
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
  } satisfies ContactMailerSettings;
}

export async function loadWorkSettings() {
  const payload = await requestApi<WorkSettingsEnvelope>("/api/admin/work-settings", {
    method: "GET",
  });

  return {
    canPersist: payload.canPersist ?? false,
    githubUsername: payload.githubUsername ?? "",
    hasGithubToken: payload.hasGithubToken ?? false,
    source: payload.source ?? "env",
  } satisfies WorkSettings;
}

export async function saveWorkSettings(settings: WorkSettingsInput) {
  const payload = await requestApi<WorkSettingsEnvelope>("/api/admin/work-settings", {
    body: JSON.stringify(settings),
    method: "PUT",
  });

  return {
    canPersist: payload.canPersist ?? false,
    githubUsername: payload.githubUsername ?? "",
    hasGithubToken: payload.hasGithubToken ?? false,
    source: payload.source ?? "env",
  } satisfies WorkSettings;
}
