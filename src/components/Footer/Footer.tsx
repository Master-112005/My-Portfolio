"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EditButton } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";

export default function Footer() {
  const { data } = useSiteData();
  const { footer } = data;
  const links = footer.links.filter((link) => link.label.trim() && link.href.trim());
  const note = footer.note.trim();
  const quote = footer.quote.trim();
  const copyrightLabel = footer.copyrightLabel.trim();
  const { getViewCount, recordView, viewerEmails } = useSiteData();

  const todayViews = getViewCount("today");
  const weekViews = getViewCount("week");
  const monthViews = getViewCount("month");

  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    // Initialize viewer emails from localStorage on mount
    const storedEmails = viewerEmails;
  }, [viewerEmails]);

  return (
    <footer className="section-shell">
      <div className="panel-surface-strong rounded-[2rem] px-5 py-8 sm:px-8 sm:py-10 relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Footer</span>
              <EditButton section="footer" label="Edit footer" />
            </div>
            {quote ? (
              <blockquote className="max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                "{quote}"
              </blockquote>
            ) : null}
            {note ? <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">{note}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {links.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--text-soft)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {copyrightLabel ? (
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                {copyrightLabel}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setShowAnalytics(true)}
                className="absolute top-4 right-4 rounded-full border border-[color:var(--line)] bg-transparent px-3 py-1 text-xs text-[color:var(--text-soft)] transition hover:opacity-50 data-[state=open]:opacity-100"
                aria-label="View analytics"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 3a1 1 0 011 1v2a1 1 0 11-2 0V4a1 1 0 011-1zm0 3a1 1 0 011 1v6a1 1 0 11-2 0V6a1 1 0 011-1zm0 3a1 1 0 011 1v10a1 1 0 11-2 0V12a1 1 0 011-1z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowAnalytics(true)}
              className="absolute top-4 right-4 rounded-full border border-[color:var(--line)] bg-transparent px-3 py-1 text-xs text-[color:var(--text-soft)] transition hover:opacity-50 data-[state=open]:opacity-100"
              aria-label="View analytics"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3a1 1 0 011 1v2a1 1 0 11-2 0V4a1 1 0 011-1zm0 3a1 1 0 011 1v6a1 1 0 11-2 0V6a1 1 0 011-1zm0 3a1 1 0 011 1v10a1 1 0 11-2 0V12a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Analytics Popup */}
        {showAnalytics && (
          <div
            className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowAnalytics(false)}
          >
            <div
              className="fixed top-20 right-4 bg-slate-950/95 rounded-[1.5rem] p-6 w-64 max-w-xs border border-slate-700/70 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M18.28 5.72a.75.75 0 010 1.06l-1.45 1.45a.75.75 0 01-1.06 0L10 11.94l-5.72-5.72a.75.75 0 111.06-1.06l1.45 1.45A1 1 0 0118.28 5.72z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Views Section */}
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Views</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium text-white">Today</p>
                      <p className="mt-1 text-slate-300">{todayViews}</p>
                    </div>
                    <div>
                      <p className="font-medium text-week">Week</p>
                      <p className="mt-1 text-slate-300">{weekViews}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white">Month</p>
                      <p className="mt-1 text-slate-300">{monthViews}</p>
                    </div>
                  </div>
                </div>

                {/* Viewer Emails Section */}
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Viewer Emails</p>
                  {todayViews > 0 || weekViews > 0 || monthViews > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {todayViews > 0 && (
                        <div className="p-2 rounded bg-slate-800 text-xs">
                          <span className="font-medium text-slate-300">Today:</span>
                          <span className="ml-2 text-slate-200">{viewerEmails.today || "No email recorded"}</span>
                        </div>
                      )}
                      {weekViews > 0 && (
                        <div className="p-2 rounded bg-slate-800 text-xs">
                          <span className="font-medium text-slate-300">Week:</span>
                          <span className="ml-2 text-slate-200">{viewerEmails.week || "No email recorded"}</span>
                        </div>
                      )}
                      {monthViews > 0 && (
                        <div className="p-2 rounded bg-slate-800 text-xs">
                          <span className="font-medium text-slate-300">Month:</span>
                          <span className="ml-2 text-slate-200">{viewerEmails.month || "No email recorded"}</span>
                        </div>
                      )}
                      {todayViews === 0 && weekViews === 0 && monthViews === 0 && (
                        <p className="text-slate-500 text-xs">No views recorded yet</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">No views recorded yet</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="rounded-full border border-slate-700/50 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700/80"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
