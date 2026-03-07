"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { EditButton, useEditMode } from "@/admin/EditMode";
import ProjectIcon from "@/components/Projects/ProjectIcon";
import VSCodeWindow from "@/components/Projects/VSCodeWindow";
import { useSiteData } from "@/lib/site-context";
import { usePortfolioUiStore } from "@/lib/ui-store";

export default function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const { appendProject, data } = useSiteData();
  const { isEditMode, openEditor } = useEditMode();
  const activeProjectId = usePortfolioUiStore((state) => state.activeProjectId);
  const closeProjectWindow = usePortfolioUiStore((state) => state.closeProjectWindow);
  const cursorState = usePortfolioUiStore((state) => state.cursorState);
  const isGuideActive = usePortfolioUiStore((state) => state.isGuideActive);
  const maximizeProjectWindow = usePortfolioUiStore((state) => state.maximizeProjectWindow);
  const minimizeProjectWindow = usePortfolioUiStore((state) => state.minimizeProjectWindow);
  const openProjectWindow = usePortfolioUiStore((state) => state.openProjectWindow);
  const resetPointer = usePortfolioUiStore((state) => state.resetPointer);
  const restoreProjectWindow = usePortfolioUiStore((state) => state.restoreProjectWindow);
  const setCursorState = usePortfolioUiStore((state) => state.setCursorState);
  const setGuideActive = usePortfolioUiStore((state) => state.setGuideActive);
  const windowMode = usePortfolioUiStore((state) => state.windowMode);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      resetPointer();
    };
  }, [resetPointer]);

  const schedule = (callback: () => void, delay: number) => {
    const timeout = window.setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
  };

  const handleOpenProject = (projectId: string, element: HTMLButtonElement) => {
    const desktopBounds = desktopRef.current?.getBoundingClientRect();
    const targetBounds = element.getBoundingClientRect();
    const nextCursor = desktopBounds
      ? {
          x: targetBounds.left - desktopBounds.left + targetBounds.width * 0.5,
          y: targetBounds.top - desktopBounds.top + targetBounds.height * 0.5,
        }
      : {
          x: 160,
          y: 120,
        };

    setGuideActive(true);
    setCursorState({
      clicking: false,
      visible: true,
      ...nextCursor,
    });

    schedule(() => {
      setCursorState((current) => ({
        ...current,
        clicking: true,
      }));
    }, 350);

    schedule(() => {
      openProjectWindow(projectId);
    }, 620);

    schedule(() => {
      setCursorState((current) => ({
        ...current,
        clicking: false,
      }));
      setGuideActive(false);
    }, 920);
  };

  const handleAddProject = async () => {
    const project = await appendProject();
    openEditor("projects", project.id);
  };

  const activeProject = data.projects.find((project) => project.id === activeProjectId) ?? null;
  const guideStatus = cursorState.clicking
    ? "Clicking project icon"
    : isGuideActive
      ? "Moving toward icon"
      : activeProject
        ? "Window open"
        : "Waiting for a launch";

  return (
    <section id="projects" className="section-shell">
      <div className="panel-surface-strong rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Project desktop</span>
              <EditButton section="projects" itemId={data.projects[0]?.id} label="Edit projects" />
              {isEditMode ? (
                <button type="button" onClick={() => void handleAddProject()} className="edit-button">
                  <span aria-hidden="true">+</span>
                  <span>Add project</span>
                </button>
              ) : null}
            </div>
            <h2 className="section-title max-w-3xl font-semibold text-[color:var(--text)]">
              Project work presented in an interactive desktop workspace.
            </h2>
            <p className="section-copy max-w-2xl">
              Open any project to inspect its details, structure, and notes inside the editor-style window.
            </p>
          </div>
        </div>

        <div
          ref={desktopRef}
          className="relative min-h-[48rem] overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[#08111c]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.24),_transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),_transparent_26%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-white/8 bg-black/25 px-5 py-4 text-sm text-slate-300 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Narrative OS
              </span>
              <span>Project explorer</span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Click icon to launch
            </span>
          </div>

          <div className="grid gap-4 px-5 pb-6 pt-24 sm:grid-cols-[repeat(2,8.5rem)] lg:grid-cols-[repeat(3,8.5rem)]">
            {data.projects.map((project) => (
              <ProjectIcon
                key={project.id}
                project={project}
                isActive={activeProjectId === project.id}
                onOpen={(item, element) => handleOpenProject(item.id, element)}
              />
            ))}
          </div>

          <motion.div
            animate={isGuideActive ? { x: 8, y: -6 } : { x: 0, y: 0 }}
            className="absolute bottom-6 left-6 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 text-slate-200 backdrop-blur"
          >
            <div className="relative flex h-16 w-16 items-end justify-center">
              <motion.div
                animate={{
                  x: isGuideActive ? 8 : 0,
                  rotate: cursorState.clicking ? 12 : 0,
                }}
                className="absolute bottom-5 right-1 h-9 w-2 rounded-full bg-cyan-200/90 origin-bottom"
              />
              <div className="absolute bottom-10 h-5 w-5 rounded-full bg-cyan-200" />
              <div className="h-8 w-8 rounded-t-full bg-cyan-300/90" />
              <div className="absolute bottom-0 h-8 w-11 rounded-[1rem] bg-cyan-400/35" />
            </div>
            <div>
              <p className="font-semibold text-white">Desktop guide</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{guideStatus}</p>
            </div>
          </motion.div>

          <AnimatePresence>
            {cursorState.visible ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: cursorState.clicking ? 0.92 : 1,
                  x: cursorState.x,
                  y: cursorState.y,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="pointer-events-none absolute left-0 top-0 z-30"
              >
                <div className="relative -translate-x-1/2 -translate-y-1/2">
                  <div className="h-10 w-10 rounded-full border border-cyan-300/40 bg-cyan-300/14 backdrop-blur" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/90" />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {activeProject ? (
              <VSCodeWindow
                key={activeProject.id}
                project={activeProject}
                mode={windowMode}
                onClose={closeProjectWindow}
                onMinimize={minimizeProjectWindow}
                onMaximize={maximizeProjectWindow}
                onRestore={restoreProjectWindow}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
