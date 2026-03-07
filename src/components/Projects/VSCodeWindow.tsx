"use client";

import { motion } from "framer-motion";

import type { ProjectData } from "@/lib/types";

type WindowMode = "normal" | "maximized" | "minimized";

type VSCodeWindowProps = {
  mode: WindowMode;
  onClose: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  project: ProjectData;
};

function ControlButton({
  color,
  label,
  onClick,
}: {
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-3.5 w-3.5 rounded-full transition hover:scale-110"
      style={{ backgroundColor: color }}
    />
  );
}

export default function VSCodeWindow({
  mode,
  onClose,
  onMaximize,
  onMinimize,
  onRestore,
  project,
}: VSCodeWindowProps) {
  const shellClassName =
    mode === "maximized"
      ? "inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]"
      : mode === "minimized"
        ? "bottom-4 right-4 h-[5.5rem] w-[20rem]"
        : "bottom-6 left-[6%] h-[76%] w-[88%]";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={`absolute ${shellClassName} panel-surface-strong overflow-hidden rounded-[1.6rem] border border-slate-700/70 bg-[#0f1727]/95 text-slate-100`}
    >
      <div className="flex h-full flex-col">
        <div
          className="flex items-center justify-between border-b border-slate-700/60 bg-[#111827] px-4 py-3"
          onDoubleClick={mode === "minimized" ? onRestore : onMaximize}
        >
          <div className="flex items-center gap-2">
            <ControlButton color="#fb7185" label="Close" onClick={onClose} />
            <ControlButton
              color="#facc15"
              label={mode === "minimized" ? "Restore" : "Minimize"}
              onClick={mode === "minimized" ? onRestore : onMinimize}
            />
            <ControlButton color="#4ade80" label="Maximize" onClick={onMaximize} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono uppercase tracking-[0.22em]">
              {mode === "maximized" ? "Fullscreen" : mode === "minimized" ? "Minimized" : "Editor"}
            </span>
            <span className="truncate">{project.name}.workspace</span>
          </div>
        </div>

        {mode === "minimized" ? (
          <button
            type="button"
            onClick={onRestore}
            className="flex flex-1 items-center justify-between px-4 text-left text-sm text-slate-300 transition hover:bg-white/5"
          >
            <div>
              <p className="font-semibold text-slate-100">{project.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Click to restore window</p>
            </div>
            <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]">
              Restore
            </span>
          </button>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_1fr]">
            <aside className="min-h-0 border-r border-slate-700/60 bg-[#111827] px-4 py-4">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Explorer</p>
              <div className="space-y-2 overflow-y-auto pr-1">
                {project.fileTree.map((file) => {
                  const depth = file.split("/").length - 1;

                  return (
                    <div
                      key={file}
                      className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                      style={{ paddingLeft: `${0.75 + depth * 0.7}rem` }}
                    >
                      {file.split("/").at(-1)}
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#172033] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/6 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    README.md
                  </span>
                  <span className="text-sm text-slate-400">{project.tagline}</span>
                </div>
                <a
                  href={project.liveHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-3 py-1 text-xs font-semibold text-slate-950"
                  style={{ backgroundColor: project.accent }}
                >
                  Open Live
                </a>
              </div>

              <div className="grid gap-6 px-5 py-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Overview</p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{project.name}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{project.description}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Key features</p>
                    <ul className="mt-4 space-y-3">
                      {project.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-sm leading-7 text-slate-300">
                          <span className="mt-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.accent }} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Code excerpt</p>
                    <pre className="mt-4 overflow-x-auto rounded-[1.25rem] border border-slate-700/70 bg-[#0a101a] p-4 text-sm leading-7 text-cyan-100">
                      <code>{project.codeSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[1.4rem] border border-slate-700/70 bg-white/5 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Stack</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-600/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-slate-700/70 bg-white/5 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Links</p>
                    <div className="mt-4 space-y-3">
                      <a
                        href={project.repoHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-3 py-3 text-sm text-slate-200 transition hover:bg-white/5"
                      >
                        <span>Repository</span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Open</span>
                      </a>
                      <a
                        href={project.liveHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-3 py-3 text-sm text-slate-200 transition hover:bg-white/5"
                      >
                        <span>Live preview</span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Open</span>
                      </a>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-slate-700/70 bg-white/5 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{project.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
