"use client";

import { motion } from "framer-motion";

import { EditButton } from "@/admin/EditMode";
import type { SkillGroup } from "@/lib/types";

type SkillsBlockProps = {
  groups: SkillGroup[];
};

export default function SkillsBlock({ groups }: SkillsBlockProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      accent: group.accent.trim() || "var(--accent)",
      items: group.items.map((item) => item.trim()).filter(Boolean),
      marker: group.marker.trim(),
      title: group.title.trim(),
    }))
    .filter((group) => group.title || group.marker || group.items.length);

  if (!visibleGroups.length) {
    return null;
  }

  return (
    <section id="skills" className="section-shell">
      <div className="panel-surface-strong relative overflow-hidden rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.36),transparent)]" />
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-orange-500/8 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Skills block</span>
              <EditButton section="skills" label="Edit skills" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text)] sm:text-4xl">Skills</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-soft)] sm:text-base">
            A quick view of the languages, tools, frameworks, and working strengths behind the portfolio.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group, index) => (
            <motion.article
              key={`${group.title}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 p-6 shadow-[0_18px_46px_rgba(2,6,23,0.14)] backdrop-blur"
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${group.accent}, transparent)` }}
              />
              <div
                className="absolute -right-8 top-4 h-24 w-24 rounded-full blur-3xl"
                style={{ backgroundColor: `${group.accent}18` }}
              />

              <div className="relative space-y-5">
                <div className="flex items-center gap-3">
                  {group.marker ? (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[1rem] border font-mono text-sm font-semibold uppercase tracking-[0.22em]"
                      style={{
                        borderColor: `color-mix(in srgb, ${group.accent} 34%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${group.accent} 12%, transparent)`,
                        color: group.accent,
                      }}
                    >
                      {group.marker}
                    </div>
                  ) : null}
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[color:var(--text-soft)]">
                      Skill cluster
                    </p>
                    {group.title ? (
                      <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                        {group.title}
                      </h3>
                    ) : null}
                  </div>
                </div>

                {group.items.length ? (
                  <div className="flex flex-wrap gap-2.5">
                    {group.items.map((item) => (
                      <span
                        key={`${group.title}-${item}`}
                        className="rounded-[0.95rem] border px-3 py-2 font-mono text-sm tracking-[0.02em] text-[color:var(--text)]"
                        style={{
                          borderColor: `color-mix(in srgb, ${group.accent} 20%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${group.accent} 14%, transparent)`,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
