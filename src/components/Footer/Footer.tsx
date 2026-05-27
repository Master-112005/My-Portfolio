"use client";

import Link from "next/link";

import { EditButton } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";

export default function Footer() {
  const { data } = useSiteData();
  const { footer } = data;
  const links = footer.links.filter((link) => link.label.trim() && link.href.trim());
  const note = footer.note.trim();
  const quote = footer.quote.trim();
  const copyrightLabel = footer.copyrightLabel.trim();

  return (
    <footer className="section-shell">
      <div className="panel-surface-strong rounded-[2rem] px-5 py-8 sm:px-8 sm:py-10">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
