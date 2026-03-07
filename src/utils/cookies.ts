"use client";

type CookieOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
};

export function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

export function writeCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const {
    maxAgeSeconds,
    path = "/",
    sameSite = "Lax",
  } = options;
  const segments = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];

  if (typeof maxAgeSeconds === "number") {
    segments.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }

  document.cookie = segments.join("; ");
}

export function deleteCookie(name: string) {
  writeCookie(name, "", { maxAgeSeconds: 0 });
}
