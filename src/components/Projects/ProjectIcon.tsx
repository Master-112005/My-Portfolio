"use client";

import { motion } from "framer-motion";

import { EditButton } from "@/admin/EditMode";
import type { ProjectData } from "@/lib/types";

type ProjectIconProps = {
  isActive: boolean;
  onOpen: (project: ProjectData, element: HTMLButtonElement) => void;
  project: ProjectData;
};

export default function ProjectIcon({ isActive, onOpen, project }: ProjectIconProps) {
  const accent = project.accent.trim() || "var(--accent)";
  const icon = project.icon.trim();
  const name = project.name.trim();
  const status = project.status.trim();

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-[8.5rem] flex-col items-center gap-3 rounded-[1.5rem] border border-transparent p-3 text-center transition"
      style={{
        borderColor: isActive ? `color-mix(in srgb, ${accent} 34%, transparent)` : "transparent",
        background: isActive ? `color-mix(in srgb, ${accent} 12%, transparent)` : "transparent",
      }}
    >
      <button
        type="button"
        onClick={(event) => onOpen(project, event.currentTarget)}
        className="flex w-full flex-col items-center gap-3 text-center"
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border text-lg font-semibold tracking-[0.12em] text-white shadow-lg transition group-hover:shadow-xl"
          style={{
            borderColor: `color-mix(in srgb, ${accent} 34%, transparent)`,
            background: `linear-gradient(145deg, ${accent}, #0f172a)`,
          }}
        >
          {icon}
        </div>
        <div className="space-y-1">
          {name ? <p className="text-sm font-medium text-slate-100">{name}</p> : null}
          {status ? <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{status}</p> : null}
        </div>
      </button>

      <div className="absolute right-1 top-1">
        <EditButton section="projects" itemId={project.id} label="Edit" />
      </div>
    </motion.div>
  );
}
