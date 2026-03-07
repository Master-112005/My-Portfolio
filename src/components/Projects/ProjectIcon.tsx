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
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-[8.5rem] flex-col items-center gap-3 rounded-[1.5rem] border border-transparent p-3 text-center transition"
      style={{
        borderColor: isActive ? `${project.accent}55` : "transparent",
        background: isActive ? `${project.accent}12` : "transparent",
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
            borderColor: `${project.accent}55`,
            background: `linear-gradient(145deg, ${project.accent}, #0f172a)`,
          }}
        >
          {project.icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--text)]">{project.name}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">{project.status}</p>
        </div>
      </button>

      <div className="absolute right-1 top-1">
        <EditButton section="projects" itemId={project.id} label="Edit" />
      </div>
    </motion.div>
  );
}
