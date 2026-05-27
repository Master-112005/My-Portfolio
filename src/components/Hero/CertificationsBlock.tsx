"use client";

import { motion } from "framer-motion";

import { EditButton } from "@/admin/EditMode";
import type { CertificationItem, SectionIntroData } from "@/lib/types";

type CertificationsBlockProps = {
  items: CertificationItem[];
  section: SectionIntroData;
};

export default function CertificationsBlock({ items, section }: CertificationsBlockProps) {
  const visibleItems = items
    .map((item) => ({
      ...item,
      accent: item.accent.trim() || "var(--accent)",
      badge: item.badge.trim().slice(0, 2).toUpperCase(),
      credentialId: item.credentialId.trim(),
      href: item.href.trim(),
      issued: item.issued.trim(),
      issuer: item.issuer.trim(),
      title: item.title.trim(),
    }))
    .filter((item) => item.title || item.issuer || item.credentialId)
    .sort((left, right) => left.order - right.order);
  const hasVisibleItems = visibleItems.length > 0;

  const eyebrow = section.eyebrow.trim() || "Certifications block";
  const title = section.title.trim() || "Certifications";
  const description =
    section.description.trim() ||
    "Selected certifications presented with the same visual weight as each skill cluster card.";

  return (
    <section id="certifications" className="section-shell">
      <div className="panel-surface-strong relative overflow-hidden rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.36),transparent)]" />
        <div className="absolute left-0 top-10 h-44 w-44 rounded-full bg-sky-400/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-amber-500/8 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{eyebrow}</span>
              <EditButton section="certifications" label="Edit certifications" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text)] sm:text-4xl">{title}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-soft)] sm:text-base">{description}</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hasVisibleItems ? (
            visibleItems.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex min-h-[21rem] flex-col overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 p-6 shadow-[0_18px_46px_rgba(2,6,23,0.14)] backdrop-blur"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                />
                <div
                  className="absolute -right-8 top-4 h-24 w-24 rounded-full blur-3xl"
                  style={{ backgroundColor: `${item.accent}18` }}
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[1rem] border font-mono text-sm font-semibold uppercase tracking-[0.22em]"
                      style={{
                        borderColor: `color-mix(in srgb, ${item.accent} 34%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${item.accent} 12%, transparent)`,
                        color: item.accent,
                      }}
                    >
                      {item.badge || "CT"}
                    </div>
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[color:var(--text-soft)]">
                        Certificate
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-1 flex-col gap-4">
                    <div className="rounded-[1.05rem] border border-[color:var(--line)] bg-black/10 px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">Issuer</p>
                      <p className="mt-2 text-sm font-medium text-[color:var(--text)]">{item.issuer || "Add issuer"}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.05rem] border border-[color:var(--line)] bg-black/10 px-4 py-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">Issued</p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--text)]">{item.issued || "Add date"}</p>
                      </div>
                      <div className="rounded-[1.05rem] border border-[color:var(--line)] bg-black/10 px-4 py-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                          Credential
                        </p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--text)]">
                          {item.credentialId || "Add ID"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-950"
                          style={{ backgroundColor: item.accent }}
                        >
                          View certificate
                        </a>
                      ) : (
                        <p className="text-sm leading-7 text-[color:var(--text-soft)]">
                          Add a verification link in edit mode if you want this card to open the certificate.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-black/10 px-5 py-6 text-sm leading-7 text-[color:var(--text-soft)]">
                No certifications added yet. Use the edit button above to add a new certificate without losing this section.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
