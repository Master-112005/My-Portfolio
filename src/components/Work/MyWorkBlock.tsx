"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { EditButton } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";

type CalendarDay = {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
};

type GithubStats = {
  calendar: CalendarDay[];
  profileUrl: string;
  totalContributions: number;
  username: string;
};

type WorkStats = {
  generatedAt: string;
  github: GithubStats | null;
  messages: string[];
};

type HeatmapProps = {
  accent: string;
  days: CalendarDay[];
  emptyLabel: string;
};

const githubFallback: GithubStats = {
  calendar: [],
  profileUrl: "https://github.com/",
  totalContributions: 0,
  username: "GitHub",
};

const weekdays = ["Mon", "Wed", "Fri"];
const levelOpacity = ["bg-[color:var(--line)]", "opacity-40", "opacity-60", "opacity-80", "opacity-100"];

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

function buildCalendarGrid(days: CalendarDay[]) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 364);

  const startDay = start.getDay();
  start.setDate(start.getDate() - startDay);

  return Array.from({ length: 53 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const key = date.toISOString().slice(0, 10);
      return byDate.get(key) ?? { count: 0, date: key, level: 0 as const };
    }),
  );
}

function Heatmap({ accent, days, emptyLabel }: HeatmapProps) {
  const weeks = useMemo(() => buildCalendarGrid(days), [days]);
  const hasActivity = days.some((day) => day.count > 0);

  return (
    <div className="relative overflow-hidden rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/45 p-3">
      <div className="flex gap-2.5">
        <div className="hidden w-7 shrink-0 pt-5 text-[10px] leading-none text-[color:var(--text-soft)] sm:block">
          {weekdays.map((day) => (
            <div key={day} className="h-[1.08rem]">
              {day}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div className="flex min-w-[32rem] gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${week[0]?.date ?? weekIndex}`} className="grid grid-rows-7 gap-[3px]">
                {week.map((day) => {
                  const level = hasActivity ? day.level : 0;
                  const isActive = level > 0;

                  return (
                    <span
                      key={day.date}
                      title={`${day.date}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                      className={`h-[7px] w-[7px] rounded-[2px] ${isActive ? levelOpacity[level] : "bg-[color:var(--line)]"}`}
                      style={isActive ? { backgroundColor: accent } : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[color:var(--text-soft)]">
        <span className="min-w-0 truncate">{hasActivity ? "Last 12 months" : emptyLabel}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`h-2.5 w-2.5 rounded-[2px] ${level === 0 ? "bg-[color:var(--line)]" : levelOpacity[level]}`}
              style={level > 0 ? { backgroundColor: accent } : undefined}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[0.95rem] border border-[color:var(--line)] bg-[color:var(--surface)]/60 px-3.5 py-3">
      <p className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">{label}</p>
      <p className="mt-1.5 truncate text-xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">{value}</p>
    </div>
  );
}

export default function MyWorkBlock() {
  const { data } = useSiteData();
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/work-stats", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Work stats failed with ${response.status}.`);
        }

        const payload = (await response.json()) as WorkStats;

        if (isMounted) {
          setStats(payload);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Work stats could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const github = stats?.github ?? githubFallback;
  const hasLiveGithub = Boolean(stats?.github);
  const section = data.workSection;

  return (
    <section id="work" className="section-shell">
      <div className="panel-surface-strong relative overflow-hidden rounded-[2rem] px-5 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.36),transparent)]" />
        <div className="absolute -left-12 top-16 h-44 w-44 rounded-full bg-emerald-400/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-sky-500/8 blur-3xl" />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="eyebrow">{section.eyebrow}</span>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-[color:var(--text)] sm:text-4xl">
              {section.title}
            </h2>
            <EditButton section="work" label="Edit my work" />
          </div>
          <p className="max-w-xl text-sm leading-6 text-[color:var(--text-soft)]">
            {section.description}
          </p>
        </div>

        <div className="relative mt-5 grid min-w-0 gap-4">
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 rounded-[1.45rem] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 p-4 shadow-[0_18px_46px_rgba(2,6,23,0.12)] backdrop-blur sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[color:var(--text-soft)]">GitHub activity</p>
                <h3 className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">@{github.username}</h3>
              </div>
              <a
                href={github.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[color:var(--line)] px-3.5 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-[color:var(--accent)]"
              >
                Open profile
              </a>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <StatTile label="Year total" value={hasLiveGithub ? formatNumber(github.totalContributions) : "Setup"} />
              <StatTile label="Tracked days" value={hasLiveGithub ? formatNumber(github.calendar.length) : "0"} />
            </div>

            <div className="mt-4">
              <Heatmap accent="#22c55e" days={github.calendar} emptyLabel="Waiting for GitHub credentials" />
            </div>
          </motion.article>
        </div>

        {(isLoading || error || stats?.messages.length) ? (
          <div className="relative mt-4 rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/45 px-4 py-3 text-sm leading-6 text-[color:var(--text-soft)]">
            {isLoading ? "Loading live work stats..." : error || stats?.messages.join(" ")}
          </div>
        ) : null}
      </div>
    </section>
  );
}
