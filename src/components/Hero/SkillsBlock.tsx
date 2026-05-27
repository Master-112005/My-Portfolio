"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { EditButton } from "@/admin/EditMode";
import type { SectionIntroData, SkillGroup, SkillLevel } from "@/lib/types";

type SkillsBlockProps = {
  groups: SkillGroup[];
  section: SectionIntroData;
};

const skillLevelCopy: Record<SkillLevel, { label: string; width: string }> = {
  linear: { label: "Linear", width: "25%" },
  better: { label: "Better", width: "50%" },
  good: { label: "Good", width: "75%" },
  advanced: { label: "Advanced", width: "100%" },
};

export default function SkillsBlock({ groups, section }: SkillsBlockProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const visibleGroups = groups
    .map((group, index) => ({
      ...group,
      id: `${group.title.trim() || group.marker.trim() || "skill-cluster"}-${index}`,
      accent: group.accent.trim() || "var(--accent)",
      items: group.items
        .map((item) => ({
          name: item.name.trim(),
          level: item.level,
        }))
        .filter((item) => item.name),
      marker: group.marker.trim(),
      title: group.title.trim(),
    }))
    .filter((group) => group.title || group.marker || group.items.length);

  if (!visibleGroups.length) {
    return null;
  }

  const eyebrow = section.eyebrow.trim() || "Skills block";
  const title = section.title.trim() || "Skills";
  const description =
    section.description.trim() ||
    "A quick view of the languages, tools, frameworks, and working strengths behind the portfolio.";

  return (
    <section id="skills" className="section-shell">
      <div className="panel-surface-strong relative overflow-hidden rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.36),transparent)]" />
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-orange-500/8 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{eyebrow}</span>
              <EditButton section="skills" label="Edit skills" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text)] sm:text-4xl">{title}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-soft)] sm:text-base">{description}</p>
        </div>

        <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group, index) => {
            const isExpanded = expandedGroup === group.id;

            return (
              <motion.article
                key={group.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[21rem] self-start overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 p-6 shadow-[0_18px_46px_rgba(2,6,23,0.14)] backdrop-blur"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${group.accent}, transparent)` }}
                />
                <div
                  className="absolute -right-8 top-4 h-24 w-24 rounded-full blur-3xl"
                  style={{ backgroundColor: `${group.accent}18` }}
                />

                <div className="relative flex h-full flex-col">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup((current) => (current === group.id ? null : group.id))}
                    aria-expanded={isExpanded}
                    className="flex w-full flex-1 flex-col text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
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

                      <span
                        className="rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]"
                        style={{
                          borderColor: `color-mix(in srgb, ${group.accent} 22%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${group.accent} 10%, transparent)`,
                        }}
                      >
                        {isExpanded ? "Hide levels" : "Show levels"}
                      </span>
                    </div>

                    {!isExpanded ? (
                      <div className="mt-5 flex flex-1 flex-col justify-between">
                        {group.items.length ? (
                          <div className="flex flex-wrap gap-2.5">
                            {group.items.slice(0, 6).map((item) => (
                              <span
                                key={`${group.id}-${item.name}`}
                                className="rounded-[0.95rem] border px-3 py-2 font-mono text-sm tracking-[0.02em] text-[color:var(--text)]"
                                style={{
                                  borderColor: `color-mix(in srgb, ${group.accent} 20%, transparent)`,
                                  backgroundColor: `color-mix(in srgb, ${group.accent} 14%, transparent)`,
                                }}
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-5 text-sm leading-7 text-[color:var(--text-soft)]">Add skills in edit mode.</p>
                        )}

                        <p className="mt-6 text-sm leading-7 text-[color:var(--text-soft)]">
                          Tap this cluster to expand it and see how well each skill is known.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {group.items.map((item) => {
                          const level = skillLevelCopy[item.level] ?? skillLevelCopy.good;

                          return (
                            <div
                              key={`${group.id}-${item.name}`}
                              className="rounded-[1.05rem] border border-[color:var(--line)] bg-black/10 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-[color:var(--text)]">{item.name}</span>
                                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                                  {level.label}
                                </span>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-black/15">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: level.width,
                                    background: `linear-gradient(90deg, ${group.accent}, color-mix(in srgb, ${group.accent} 44%, white))`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
