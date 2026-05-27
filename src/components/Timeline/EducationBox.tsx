"use client";

import { AnimatePresence, motion } from "framer-motion";

import { EditButton } from "@/admin/EditMode";
import type { EducationItem } from "@/lib/types";

type EducationBoxProps = {
  index: number;
  isActive: boolean;
  item: EducationItem;
  onSelect: () => void;
  side: "left" | "right";
};

export default function EducationBox({
  index,
  isActive,
  item,
  onSelect,
  side,
}: EducationBoxProps) {
  const accent = item.accent.trim() || "var(--accent)";
  const title = item.title.trim();
  const period = item.period.trim();
  const summary = item.summary.trim();
  const institution = item.institution.trim();
  const details = item.details.map((detail) => detail.trim()).filter(Boolean);

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="panel-surface-strong relative w-full max-w-[30rem] overflow-hidden rounded-[1.75rem] p-5 text-left"
      style={{
        borderColor: isActive ? accent : "var(--line)",
        marginLeft: side === "right" ? "auto" : undefined,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />
      <div
        className={`absolute top-1/2 hidden h-px w-14 -translate-y-1/2 lg:block ${
          side === "left" ? "right-[-3.5rem]" : "left-[-3.5rem]"
        }`}
        style={{
          background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${accent}, transparent)`,
        }}
      />
      <div
        className={`absolute top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white/20 lg:block ${
          side === "left" ? "right-[-4.15rem]" : "left-[-4.15rem]"
        }`}
        style={{
          backgroundColor: accent,
          boxShadow: `0 0 22px color-mix(in srgb, ${accent} 55%, transparent)`,
        }}
      />

      <div className="absolute right-5 top-5 z-10 flex flex-col items-end gap-2">
        <div
        className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]"
        style={{
          backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          color: accent,
        }}
        >
          {isActive ? "Opened" : "Locked"}
        </div>
        <EditButton section="education" itemId={item.id} label="Edit stage" />
      </div>

      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-4 pr-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
              Stage {String(index + 1).padStart(2, "0")}
            </p>
            {title ? (
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                {title}
              </h3>
            ) : null}
            {period ? (
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                {period}
              </p>
            ) : null}
            {summary ? <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--text-soft)]">{summary}</p> : null}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isActive ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-5 border-t border-[color:var(--line)] pt-5">
                {institution ? (
                  <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                    {institution}
                  </p>
                ) : null}
                {details.length ? (
                  <ul className="mt-4 space-y-3">
                    {details.map((detail) => (
                      <li key={detail} className="flex gap-3 text-sm leading-7 text-[color:var(--text-soft)]">
                        <span
                          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex items-center justify-between border-t border-[color:var(--line)] pt-4 text-sm text-[color:var(--text-soft)]"
            >
              <span>Click to open the full milestone.</span>
              <span className="font-mono uppercase tracking-[0.2em]">Open</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
