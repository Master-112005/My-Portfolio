"use client";

import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { EditButton, useEditMode } from "@/admin/EditMode";
import EducationBox from "@/components/Timeline/EducationBox";
import { useSiteData } from "@/lib/site-context";
import { useElementScrollProgress } from "@/utils/scroll";

export default function TimelineSection() {
  const { appendEducationItem, data } = useSiteData();
  const { isEditMode, openEditor } = useEditMode();
  const { education } = data;
  const { ref, scrollYProgress } = useElementScrollProgress<HTMLElement>();
  const pathProgress = useMotionValue(0);
  const animationControlsRef = useRef<{ stop: () => void } | null>(null);
  const [progress, setProgress] = useState(0);
  const [pinnedStageId, setPinnedStageId] = useState<string | null>(null);

  useMotionValueEvent(pathProgress, "change", (latest) => {
    setProgress(latest);
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (pinnedStageId) {
      return;
    }

    pathProgress.set(latest);
  });

  useEffect(() => {
    return () => {
      animationControlsRef.current?.stop();
    };
  }, []);

  const scrollStageIndex = useMemo(() => {
    if (!education.length) {
      return -1;
    }

    return Math.min(education.length - 1, Math.floor(progress * education.length));
  }, [education.length, progress]);
  const scrollStageId = scrollStageIndex >= 0 ? education[scrollStageIndex]?.id ?? null : null;
  const activeStageId = pinnedStageId;
  const timelineRowHeight = 17.5;
  const timelineHeightRem = Math.max(education.length * timelineRowHeight, 32);
  const progressPercent = Math.round(progress * 100);
  const activeStage = scrollStageId ? education.find((item) => item.id === scrollStageId) ?? null : null;
  const snakePath = useMemo(() => {
    if (!education.length) {
      return "";
    }

    const points = education.map((_, index) => {
      const x = index % 2 === 0 ? 32 : 68;
      const y = 8 + index * (84 / Math.max(education.length - 1, 1));
      return { x, y };
    });

    return points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `${path} C ${controlX} ${previous.y + 4}, ${controlX} ${point.y - 4}, ${point.x} ${point.y}`;
    }, "");
  }, [education]);

  const handleAddStage = async () => {
    const item = await appendEducationItem();
    openEditor("education", item.id);
  };

  const handleSelectStage = (stageId: string) => {
    if (pinnedStageId === stageId) {
      animationControlsRef.current?.stop();
      setPinnedStageId(null);
      pathProgress.set(scrollYProgress.get());
      return;
    }

    animationControlsRef.current?.stop();
    setPinnedStageId(stageId);

    const index = education.findIndex((item) => item.id === stageId);
    const nextProgress = education.length > 1 ? index / (education.length - 1) : 0;

    animationControlsRef.current = animate(pathProgress, nextProgress, {
      type: "spring",
      stiffness: 92,
      damping: 22,
      mass: 0.95,
    });
  };

  return (
    <section id="timeline" ref={ref} className="relative py-16 sm:py-20">
      <div className="space-y-8 px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">Education journey</span>
            <EditButton section="education" itemId={education[0]?.id} label="Edit stages" />
            {isEditMode ? (
              <button type="button" onClick={() => void handleAddStage()} className="edit-button">
                <span aria-hidden="true">+</span>
                <span>Add stage</span>
              </button>
            ) : null}
          </div>
          <h2 className="section-title max-w-4xl font-semibold text-[color:var(--text)]">
            Education milestones arranged as a guided journey.
          </h2>
          <p className="section-copy max-w-2xl">
            Open any milestone to read the details from each stage of the academic path.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]/56 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
              Education Path
            </span>
            <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]/56 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent)]">
              {progressPercent}% viewed
            </span>
            {activeStage ? (
              <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]/56 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
                {activeStage.title}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative" style={{ minHeight: `${timelineHeightRem}rem` }}>
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-20 h-[70%] w-[42rem] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
            <div className="absolute bottom-10 left-1/2 h-[45%] w-[34rem] -translate-x-1/2 rounded-full bg-orange-500/8 blur-3xl" />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-12 bottom-12 hidden w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(103,232,249,0.08),rgba(103,232,249,0.22),rgba(249,115,22,0.08))] lg:block" />

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <path d={snakePath} fill="none" stroke="rgba(103,232,249,0.18)" strokeWidth="2.4" strokeLinecap="round" />
              <path d={snakePath} fill="none" stroke="rgba(249,115,22,0.08)" strokeWidth="6" strokeLinecap="round" />
              {education.map((item, index) => {
                const x = index % 2 === 0 ? 32 : 68;
                const y = 8 + index * (84 / Math.max(education.length - 1, 1));
                const isActive = activeStageId === item.id;

                return (
                  <g key={`${item.id}-node`}>
                    <circle cx={x} cy={y} r="2.8" fill={`${item.accent}22`} />
                    <circle cx={x} cy={y} r={isActive ? "1.65" : "1.2"} fill={item.accent} />
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="relative grid gap-y-14 lg:grid-cols-[minmax(18rem,1fr)_minmax(5rem,9rem)_minmax(18rem,1fr)] lg:gap-x-12 xl:grid-cols-[minmax(20rem,1fr)_minmax(6rem,10rem)_minmax(20rem,1fr)]"
            style={{ gridTemplateRows: `repeat(${Math.max(education.length, 1)}, minmax(15rem, auto))` }}
          >
            {education.map((item, index) => (
              <div
                key={item.id}
                className={index % 2 === 0 ? "lg:col-start-1" : "lg:col-start-3"}
                style={{ gridRow: `${index + 1}` }}
              >
                <EducationBox
                  index={index}
                  item={item}
                  side={index % 2 === 0 ? "left" : "right"}
                  isActive={activeStageId === item.id}
                  onSelect={() => handleSelectStage(item.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
