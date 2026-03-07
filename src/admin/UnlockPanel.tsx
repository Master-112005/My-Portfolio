"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { useEditMode } from "@/admin/EditMode";
import { deleteCookie, readCookie, writeCookie } from "@/utils/cookies";

const DEFAULT_ADMIN_HASH = "ed2d4c4cfbe3a7d41aa1fbc0e93df82f4fbc1c82faec35a95a2907d956d5795e";
const ADMIN_PASSWORD_HASH =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH ?? DEFAULT_ADMIN_HASH;
const LOCKOUT_COOKIE_KEY = "interactive-storytelling-portfolio-unlock-attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

type UnlockAttemptState = {
  failedAttempts: number;
  lockedUntil: number;
};

function readUnlockAttemptState(): UnlockAttemptState {
  const rawValue = readCookie(LOCKOUT_COOKIE_KEY);

  if (!rawValue) {
    return {
      failedAttempts: 0,
      lockedUntil: 0,
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UnlockAttemptState>;
    return {
      failedAttempts: parsed.failedAttempts ?? 0,
      lockedUntil: parsed.lockedUntil ?? 0,
    };
  } catch {
    return {
      failedAttempts: 0,
      lockedUntil: 0,
    };
  }
}

function persistUnlockAttemptState(state: UnlockAttemptState) {
  if (state.failedAttempts === 0 && state.lockedUntil === 0) {
    deleteCookie(LOCKOUT_COOKIE_KEY);
    return;
  }

  const remainingLockoutSeconds =
    state.lockedUntil > Date.now() ? Math.ceil((state.lockedUntil - Date.now()) / 1000) : 0;

  writeCookie(LOCKOUT_COOKIE_KEY, JSON.stringify(state), {
    maxAgeSeconds: Math.max(remainingLockoutSeconds, LOCKOUT_WINDOW_MS / 1000),
  });
}

export function UnlockPanel() {
  const { closeUnlock, disableEditMode, enableEditMode, isEditMode, isUnlockOpen } = useEditMode();
  const [attemptState, setAttemptState] = useState<UnlockAttemptState>({
    failedAttempts: 0,
    lockedUntil: 0,
  });
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const isLocked = attemptState.lockedUntil > currentTime;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptState.failedAttempts);
  const remainingSeconds = Math.max(0, Math.ceil((attemptState.lockedUntil - currentTime) / 1000));

  useEffect(() => {
    setAttemptState(readUnlockAttemptState());
  }, []);

  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLocked]);

  useEffect(() => {
    if (attemptState.lockedUntil <= currentTime && attemptState.lockedUntil !== 0) {
      const resetState = {
        failedAttempts: 0,
        lockedUntil: 0,
      };

      setAttemptState(resetState);
      persistUnlockAttemptState(resetState);
    }
  }, [attemptState.lockedUntil, currentTime]);

  const lockoutLabel = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [remainingSeconds]);

  const handleClose = () => {
    setPassword("");
    setError(null);
    closeUnlock();
  };

  const handleUnlock = async () => {
    setCurrentTime(Date.now());

    if (isLocked) {
      setError(`Too many failed attempts. Try again in ${lockoutLabel}.`);
      return;
    }

    if (!/^\d{12}$/.test(password)) {
      setError("Password must be exactly 12 digits.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const hashedPassword = await sha256(password);

      if (hashedPassword !== ADMIN_PASSWORD_HASH) {
        const nextFailedAttempts = attemptState.failedAttempts + 1;
        const nextState =
          nextFailedAttempts >= MAX_ATTEMPTS
            ? {
                failedAttempts: 0,
                lockedUntil: Date.now() + LOCKOUT_WINDOW_MS,
              }
            : {
                failedAttempts: nextFailedAttempts,
                lockedUntil: 0,
              };

        setAttemptState(nextState);
        persistUnlockAttemptState(nextState);
        setCurrentTime(Date.now());
        setError(
          nextFailedAttempts >= MAX_ATTEMPTS
            ? "Too many failed attempts. Edit mode is temporarily locked."
            : `Incorrect password. ${MAX_ATTEMPTS - nextFailedAttempts} attempt(s) remaining.`,
        );
        return;
      }

      const resetState = {
        failedAttempts: 0,
        lockedUntil: 0,
      };

      setAttemptState(resetState);
      persistUnlockAttemptState(resetState);
      enableEditMode();
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isUnlockOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/58 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="panel-surface-strong relative w-full max-w-lg rounded-[2rem] p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[color:var(--text-soft)] transition hover:text-[color:var(--text)]"
              >
                Close
              </button>

              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="eyebrow">Admin Unlock</span>
                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text)]">
                    Hidden edit mode
                  </h2>
                  <p className="section-copy max-w-md text-sm sm:text-base">
                    The badge release opened the owner gate. Enter the 12-digit password to unlock inline editing.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] p-4">
                  <label className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                    Secure passcode
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={12}
                    disabled={isLocked}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value.replace(/\D/g, "").slice(0, 12));
                      setError(null);
                    }}
                    placeholder="Enter 12 digits"
                    className="input-surface text-lg tracking-[0.28em]"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--text-soft)]">
                    <span>{isLocked ? `Locked for ${lockoutLabel}` : "Exactly 12 digits are required."}</span>
                    <span>{isLocked ? `${remainingAttempts} retries` : `${password.length}/12`}</span>
                  </div>
                  {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
                </div>

                <button
                  type="button"
                  onClick={() => void handleUnlock()}
                  disabled={isVerifying || isLocked}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                >
                  {isLocked ? `Locked ${lockoutLabel}` : isVerifying ? "Verifying..." : "Unlock edit mode"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isEditMode ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-4 top-4 z-50 flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 backdrop-blur sm:left-6 sm:top-6"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span>Edit mode enabled</span>
            <button
              type="button"
              onClick={disableEditMode}
              className="rounded-full border border-emerald-300/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition hover:bg-emerald-300/10"
            >
              Exit
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
