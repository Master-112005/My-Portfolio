"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { ProjectData } from "@/lib/types";

type WindowMode = "normal" | "maximized" | "minimized";

type ExplorerSection =
  | {
      id: "overview" | "gallery" | "stack" | "readme";
      label: string;
      meta: string;
      kind: "overview" | "gallery" | "stack" | "readme";
    }
  | {
      id: string;
      label: string;
      meta: string;
      kind: "custom";
      content: string;
    };

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<ExplorerSection["id"]>("overview");
  const accent = project.accent.trim() || "var(--accent)";
  const name = project.name.trim();
  const tagline = project.tagline.trim();
  const description = project.description.trim();
  const repoHref = project.repoHref.trim();
  const liveHref = project.liveHref.trim();
  const status = project.status.trim();
  const readme = project.readme.trim();
  const stack = project.stack.map((item) => item.trim()).filter(Boolean);
  const features = project.features.map((feature) => feature.trim()).filter(Boolean);
  const fileTree = project.fileTree.map((file) => file.trim()).filter(Boolean);
  const codeSnippet = project.codeSnippet.trim();
  const images = project.images.filter((image) => image.src.trim());
  const customSections = project.customSections
    .map((section) => ({
      id: section.id.trim(),
      title: section.title.trim(),
      content: section.content.trim(),
    }))
    .filter((section) => section.id && section.title && section.content);

  useEffect(() => {
    setActiveImageIndex(0);
    setActiveSectionId("overview");
  }, [project.id]);

  const sections: ExplorerSection[] = [
    {
      id: "overview",
      label: "Overview",
      meta: features.length ? `${features.length} highlights` : "Summary",
      kind: "overview",
    },
    {
      id: "gallery",
      label: "Project pics",
      meta: images.length ? `${images.length} screenshots` : "No screenshots yet",
      kind: "gallery",
    },
    {
      id: "stack",
      label: "Tech stack + links",
      meta: stack.length ? `${stack.length} tools listed` : "Stack and URLs",
      kind: "stack",
    },
    {
      id: "readme",
      label: "README",
      meta: readme ? "Project notes" : "Add project notes",
      kind: "readme",
    },
    ...customSections.map(
      (section): ExplorerSection => ({
        id: section.id,
        label: section.title,
        meta: "Custom section",
        kind: "custom",
        content: section.content,
      }),
    ),
  ];

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const clampedImageIndex = Math.min(activeImageIndex, Math.max(0, images.length - 1));
  const activeImage = images[clampedImageIndex] ?? null;
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
              {mode === "maximized" ? "Fullscreen" : mode === "minimized" ? "Minimized" : "Explorer"}
            </span>
            <span className="truncate">{name ? `${name}.workspace` : ""}</span>
          </div>
        </div>

        {mode === "minimized" ? (
          <button
            type="button"
            onClick={onRestore}
            className="flex flex-1 items-center justify-between px-4 text-left text-sm text-slate-300 transition hover:bg-white/5"
          >
            <div>
              {name ? <p className="font-semibold text-slate-100">{name}</p> : null}
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Click to restore window</p>
            </div>
            <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]">
              Restore
            </span>
          </button>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[17rem_1fr]">
            <aside className="flex min-h-0 flex-col border-r border-slate-700/60 bg-[#111827] px-4 py-4">
              <div className="rounded-[1.35rem] border border-slate-700/70 bg-white/5 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Explorer</p>
                {name ? <h3 className="mt-3 text-lg font-semibold text-white">{name}</h3> : null}
                {tagline ? <p className="mt-2 text-sm leading-6 text-slate-400">{tagline}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {status ? (
                    <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300">
                      {status}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    {sections.length} views
                  </span>
                </div>
              </div>

              <nav className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Project explorer sections">
                <div className="space-y-2">
                  {sections.map((section, index) => {
                    const isActive = section.id === activeSection.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSectionId(section.id)}
                        className={`w-full rounded-[1.1rem] border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-slate-400/60 bg-white/9 text-white"
                            : "border-slate-700/60 bg-transparent text-slate-300 hover:bg-white/5"
                        }`}
                        style={
                          isActive
                            ? {
                                borderColor: `color-mix(in srgb, ${accent} 48%, rgba(148, 163, 184, 0.4))`,
                                background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, transparent), rgba(255,255,255,0.04))`,
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{section.label}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{section.meta}</p>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.1rem] border border-slate-700/70 bg-white/5 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Media</p>
                  <p className="mt-2 text-lg font-semibold text-white">{images.length}</p>
                </div>
                <div className="rounded-[1.1rem] border border-slate-700/70 bg-white/5 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Stack</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stack.length}</p>
                </div>
              </div>
            </aside>

            <div className="min-h-0 overflow-y-auto">
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-[#172033]/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/6 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Explorer
                  </span>
                  <span className="text-sm text-slate-300">{activeSection.label}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {repoHref ? (
                    <a
                      href={repoHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                      Repo
                    </a>
                  ) : null}
                  {liveHref ? (
                    <a
                      href={liveHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-950"
                      style={{ backgroundColor: accent }}
                    >
                      Open Live
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="px-5 py-5">
                {activeSection.kind === "overview" ? (
                  <div className="space-y-6">
                    <section className="rounded-[1.6rem] border border-slate-700/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Project overview</p>
                          {name ? <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{name}</h3> : null}
                          {description ? <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p> : null}
                        </div>
                        <div className="grid min-w-[12rem] gap-3 sm:grid-cols-3">
                          <div className="rounded-[1.15rem] border border-slate-700/70 bg-white/5 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Features</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{features.length}</p>
                          </div>
                          <div className="rounded-[1.15rem] border border-slate-700/70 bg-white/5 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Screens</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{images.length}</p>
                          </div>
                          <div className="rounded-[1.15rem] border border-slate-700/70 bg-white/5 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Stack</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{stack.length}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Key highlights</p>
                        {features.length ? (
                          <ul className="mt-4 space-y-3">
                            {features.map((feature) => (
                              <li key={feature} className="flex gap-3 text-sm leading-7 text-slate-300">
                                <span className="mt-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-4 text-sm leading-7 text-slate-400">Add project highlights in edit mode.</p>
                        )}
                      </section>

                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Project structure</p>
                        {fileTree.length ? (
                          <div className="mt-4 space-y-2">
                            {fileTree.map((file) => {
                              const depth = file.split("/").length - 1;

                              return (
                                <div
                                  key={file}
                                  className="rounded-[0.95rem] border border-slate-700/60 bg-[#0b1220] px-3 py-2 text-sm text-slate-300"
                                  style={{ paddingLeft: `${0.9 + depth * 0.7}rem` }}
                                >
                                  {file}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-7 text-slate-400">Add important files or folders to show the project structure.</p>
                        )}
                      </section>
                    </div>

                    {activeImage ? (
                      <section className="overflow-hidden rounded-[1.55rem] border border-slate-700/70 bg-[#0a101a]">
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              {activeImage.caption.trim() || activeImage.alt.trim() || "Project preview"}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Featured screenshot</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveSectionId("gallery")}
                            className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                          >
                            Open pictures
                          </button>
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {activeSection.kind === "gallery" ? (
                  images.length ? (
                    <div className="space-y-5">
                      {activeImage ? (
                        <section className="overflow-hidden rounded-[1.55rem] border border-slate-700/70 bg-[#0a101a]">
                          <div className="aspect-[16/9] overflow-hidden">
                            <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {activeImage.caption.trim() || activeImage.alt.trim() || "Project screenshot"}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                                Screenshot {clampedImageIndex + 1} of {images.length}
                              </p>
                            </div>
                            <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              Gallery
                            </span>
                          </div>
                        </section>
                      ) : null}

                      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {images.map((image, index) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`overflow-hidden rounded-[1.25rem] border text-left transition ${
                              clampedImageIndex === index
                                ? "border-cyan-300/60 bg-cyan-300/8"
                                : "border-slate-700/70 bg-white/5 hover:bg-white/8"
                            }`}
                          >
                            <div className="aspect-[16/10] overflow-hidden bg-[#0a101a]">
                              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                            <div className="px-4 py-3">
                              <p className="line-clamp-1 text-sm font-medium text-slate-100">
                                {image.caption.trim() || image.alt.trim() || `Screenshot ${index + 1}`}
                              </p>
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                Click to preview
                              </p>
                            </div>
                          </button>
                        ))}
                      </section>
                    </div>
                  ) : (
                    <section className="rounded-[1.5rem] border border-dashed border-slate-700/70 bg-white/5 px-5 py-8 text-sm leading-7 text-slate-400">
                      Add one or more screenshots in edit mode to populate this pictures view.
                    </section>
                  )
                ) : null}

                {activeSection.kind === "stack" ? (
                  <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Tech stack</p>
                      {stack.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {stack.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-slate-600/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-slate-400">Add the project stack in edit mode.</p>
                      )}

                      {status ? (
                        <div className="mt-6 rounded-[1.15rem] border border-slate-700/70 bg-[#0b1220] p-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</p>
                          <p className="mt-2 text-sm leading-7 text-slate-300">{status}</p>
                        </div>
                      ) : null}
                    </section>

                    <div className="space-y-6">
                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Links</p>
                        <div className="mt-4 space-y-3">
                          {repoHref ? (
                            <a
                              href={repoHref}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
                            >
                              <span>Repository</span>
                              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Open</span>
                            </a>
                          ) : null}
                          {liveHref ? (
                            <a
                              href={liveHref}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
                            >
                              <span>Live preview</span>
                              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Open</span>
                            </a>
                          ) : null}
                          {!repoHref && !liveHref ? (
                            <p className="text-sm leading-7 text-slate-400">Add repository or live links in edit mode.</p>
                          ) : null}
                        </div>
                      </section>

                      {fileTree.length ? (
                        <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Important files</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {fileTree.map((file) => (
                              <span
                                key={file}
                                className="rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-300"
                              >
                                {file.split("/").at(-1)}
                              </span>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {activeSection.kind === "readme" ? (
                  <div className="space-y-6">
                    <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">README.md</p>
                      <article className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {readme || "Add a project README in edit mode to show the story, decisions, and implementation notes here."}
                      </article>
                    </section>

                    {codeSnippet ? (
                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-[#0a101a] p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Implementation snippet</p>
                        <pre className="mt-4 overflow-x-auto text-sm leading-7 text-cyan-100">
                          <code>{codeSnippet}</code>
                        </pre>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {activeSection.kind === "custom" ? (
                  <section className="rounded-[1.5rem] border border-slate-700/70 bg-white/5 p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Custom section</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{activeSection.label}</h3>
                    <article className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {activeSection.content}
                    </article>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
