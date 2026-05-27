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

function WindowAction({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "close";
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition ${
        tone === "close"
          ? "border-rose-400/24 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18"
          : "border-slate-700/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTab({
  active,
  label,
  meta,
  accent,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[10rem] rounded-[1.1rem] border px-4 py-3 text-left transition ${
        active
          ? "text-white shadow-[0_16px_28px_rgba(2,6,23,0.28)]"
          : "border-slate-700/70 bg-slate-900/52 text-slate-300 hover:bg-slate-800/80"
      }`}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${accent} 45%, rgba(148,163,184,0.32))`,
              background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 20%, rgba(15,23,42,0.96)), rgba(15,23,42,0.96))`,
            }
          : undefined
      }
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{meta}</div>
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-700/70 bg-slate-950/45 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
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
      label: "Screenshots",
      meta: images.length ? `${images.length} images` : "No screenshots",
      kind: "gallery",
    },
    {
      id: "stack",
      label: "Stack & Links",
      meta: stack.length ? `${stack.length} tools` : "Tools and URLs",
      kind: "stack",
    },
    {
      id: "readme",
      label: "Notes",
      meta: readme ? "README content" : "Project notes",
      kind: "readme",
    },
    ...customSections.map(
      (section): ExplorerSection => ({
        id: section.id,
        label: section.title,
        meta: "Custom view",
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
        ? "bottom-4 right-4 h-[6rem] w-[21rem]"
        : "bottom-6 left-[5%] h-[82%] w-[90%]";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className={`absolute ${shellClassName} overflow-hidden rounded-[1.8rem] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(8,15,28,0.94))] text-slate-100 shadow-[0_32px_90px_rgba(2,6,23,0.45)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.08),transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_26%)]" />

      <div className="relative flex h-full flex-col">
        <div
          className="border-b border-slate-700/60 bg-slate-950/70 px-4 py-4 backdrop-blur"
          onDoubleClick={mode === "minimized" ? onRestore : onMaximize}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex flex-1 flex-wrap items-center gap-3">
                {name ? <h3 className="truncate text-2xl font-semibold tracking-[-0.04em] text-white">{name}</h3> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]"
                    style={{
                      borderColor: `color-mix(in srgb, ${accent} 35%, rgba(148,163,184,0.3))`,
                      backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                      color: accent,
                    }}
                  >
                    {mode === "maximized" ? "Fullscreen" : mode === "minimized" ? "Minimized" : "Project view"}
                  </span>
                  {status ? (
                    <span className="rounded-full border border-slate-700/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      {status}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {repoHref ? (
                  <a
                    href={repoHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Open repo
                  </a>
                ) : null}
                {liveHref ? (
                  <a
                    href={liveHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-950"
                    style={{ backgroundColor: accent }}
                  >
                    Open live site
                  </a>
                ) : null}
                <div className="flex items-center gap-2">
                  <WindowAction
                    label={mode === "minimized" ? "Restore" : "Minimize"}
                    onClick={mode === "minimized" ? onRestore : onMinimize}
                  >
                    -
                  </WindowAction>
                  <WindowAction
                    label={mode === "maximized" ? "Windowed" : "Fullscreen"}
                    onClick={mode === "maximized" ? onRestore : onMaximize}
                  >
                    []
                  </WindowAction>
                  <WindowAction label="Close" onClick={onClose} tone="close">
                    x
                  </WindowAction>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {tagline ? <p className="max-w-3xl text-sm leading-7 text-slate-400">{tagline}</p> : <span />}
              {mode !== "minimized" ? (
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {name ? `${name}.workspace` : "project.workspace"}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {mode === "minimized" ? (
          <button
            type="button"
            onClick={onRestore}
            className="flex flex-1 items-center justify-between px-4 text-left transition hover:bg-white/5"
          >
            <div>
              {name ? <p className="font-semibold text-white">{name}</p> : null}
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Click to restore project window</p>
            </div>
            <span className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200">
              Restore
            </span>
          </button>
        ) : (
          <>
            <div className="border-b border-slate-700/60 bg-slate-950/42 px-4 py-3">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {sections.map((section) => (
                  <SectionTab
                    key={section.id}
                    active={section.id === activeSection.id}
                    label={section.label}
                    meta={section.meta}
                    accent={accent}
                    onClick={() => setActiveSectionId(section.id)}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-5 py-5 sm:px-6 sm:py-6">
                {activeSection.kind === "overview" ? (
                  <div className="space-y-6">
                    <section className="rounded-[1.6rem] border border-slate-700/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Project overview</p>
                          {name ? <h4 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{name}</h4> : null}
                          {description ? <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p> : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <StatCard label="Features" value={features.length} />
                          <StatCard label="Screens" value={images.length} />
                          <StatCard label="Stack" value={stack.length} />
                        </div>
                      </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                      <section className="rounded-[1.45rem] border border-slate-700/70 bg-slate-950/42 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Highlights</p>
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

                      <section className="rounded-[1.45rem] border border-slate-700/70 bg-slate-950/42 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Project structure</p>
                        {fileTree.length ? (
                          <div className="mt-4 space-y-2">
                            {fileTree.map((file) => {
                              const depth = file.split("/").length - 1;

                              return (
                                <div
                                  key={file}
                                  className="rounded-[0.95rem] border border-slate-700/60 bg-[#0b1220] px-3 py-2 text-sm text-slate-300"
                                  style={{ paddingLeft: `${0.9 + depth * 0.65}rem` }}
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
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              {activeImage.caption.trim() || activeImage.alt.trim() || "Project preview"}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Featured screenshot</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveSectionId("gallery")}
                            className="rounded-full border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                          >
                            View all screenshots
                          </button>
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {activeSection.kind === "gallery" ? (
                  images.length ? (
                    <div className="space-y-6">
                      {activeImage ? (
                        <section className="overflow-hidden rounded-[1.55rem] border border-slate-700/70 bg-[#0a101a]">
                          <div className="aspect-[16/9] overflow-hidden">
                            <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/70 px-4 py-4">
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
                                : "border-slate-700/70 bg-slate-950/42 hover:bg-slate-900/70"
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
                    <section className="rounded-[1.5rem] border border-dashed border-slate-700/70 bg-slate-950/42 px-5 py-8 text-sm leading-7 text-slate-400">
                      Add one or more screenshots in edit mode to populate this view.
                    </section>
                  )
                ) : null}

                {activeSection.kind === "stack" ? (
                  <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/42 p-5">
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
                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/42 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Project links</p>
                        <div className="mt-4 space-y-3">
                          {repoHref ? (
                            <a
                              href={repoHref}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
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
                              className="flex items-center justify-between rounded-[1rem] border border-slate-700/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
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
                        <section className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/42 p-5">
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
                    <section className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/42 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">README.md</p>
                      <article className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {readme || "Add a project README in edit mode to show the story, decisions, and implementation notes here."}
                      </article>
                    </section>

                    {codeSnippet ? (
                      <section className="rounded-[1.5rem] border border-slate-700/70 bg-[#0a101a] p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Implementation snippet</p>
                        <pre className="mt-4 overflow-x-auto rounded-[1rem] bg-black/25 p-4 text-sm leading-7 text-cyan-100">
                          <code>{codeSnippet}</code>
                        </pre>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {activeSection.kind === "custom" ? (
                  <section className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/42 p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Custom section</p>
                    <h4 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{activeSection.label}</h4>
                    <article className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {activeSection.content}
                    </article>
                  </section>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
