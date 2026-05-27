"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { useEditMode } from "@/admin/EditMode";
import {
  loadAdminSessionStatus,
  type ApiRequestError,
  unlockAdminSession,
} from "@/lib/api";

const DEFAULT_REMAINING_ATTEMPTS = 5;

export function UnlockPanel() {
  const { closeUnlock, disableEditMode, enableEditMode, isEditMode, isUnlockOpen } = useEditMode();
  const [lockedUntil, setLockedUntil] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(DEFAULT_REMAINING_ATTEMPTS);
  const isLocked = lockedUntil > currentTime;
  const remainingSeconds = Math.max(0, Math.ceil((lockedUntil - currentTime) / 1000));

  useEffect(() => {
    if (!isUnlockOpen) {
      return;
    }

    let isActive = true;

    void loadAdminSessionStatus()
      .then((status) => {
        if (!isActive) {
          return;
        }

        setLockedUntil(status.lockedUntil);
        setRemainingAttempts(status.remainingAttempts || DEFAULT_REMAINING_ATTEMPTS);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLockedUntil(0);
        setRemainingAttempts(DEFAULT_REMAINING_ATTEMPTS);
      });

    return () => {
      isActive = false;
    };
  }, [isUnlockOpen]);

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
    if (lockedUntil <= currentTime && lockedUntil !== 0) {
      setLockedUntil(0);
      setRemainingAttempts(DEFAULT_REMAINING_ATTEMPTS);
    }
  }, [currentTime, lockedUntil]);

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
      const status = await unlockAdminSession(password);

      setLockedUntil(status.lockedUntil);
      setRemainingAttempts(status.remainingAttempts || DEFAULT_REMAINING_ATTEMPTS);
      enableEditMode();
      setPassword("");
    } catch (error) {
      const requestError = error as ApiRequestError;

      setCurrentTime(Date.now());
      setLockedUntil(requestError.lockedUntil ?? 0);
      setRemainingAttempts(
        typeof requestError.remainingAttempts === "number"
          ? requestError.remainingAttempts
          : DEFAULT_REMAINING_ATTEMPTS,
      );
      setError(requestError.message);
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
              onClick={() => void disableEditMode()}
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
