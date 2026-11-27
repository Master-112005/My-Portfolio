"use client";
import { motion } from "framer-motion";
import { EditButton } from "@/components/EditMode";
const skillLevelCopy = {
    linear: { label: "Linear", width: "25%" },
    better: { label: "Better", width: "50%" },
    good: { label: "Good", width: "75%" },
    advanced: { label: "Advanced", width: "100%" },
};
export default function SkillsBlock({ section, skills }) {
    const visibleSkills = skills
        .map((item, index) => ({
        key: `${index}-${item.name.trim()}`,
        level: item.level,
        name: item.name.trim(),
    }))
        .filter((item) => item.name);
    if (!visibleSkills.length) {
        return null;
    }
    const title = section.title.trim() || "Skills";
    return (<section id="skills" className="section-shell">
      <div className="panel-surface-strong relative overflow-hidden rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.36),transparent)]"/>
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-neutral-400/8 blur-3xl"/>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-neutral-500/8 blur-3xl"/>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text)] sm:text-4xl">{title}</h2>
          <EditButton section="skills" label="Edit skills"/>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleSkills.map((skill, index) => {
            const level = skillLevelCopy[skill.level] ?? skillLevelCopy.good;
            return (<motion.div key={skill.key} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }} className="rounded-[1.05rem] border border-[color:var(--line)] bg-black/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[color:var(--text)]">{skill.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                    {level.label}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/15">
                  <div className="h-full rounded-full" style={{
                    width: level.width,
                    background: `linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 44%, white))`,
                }}/>
                </div>
              </motion.div>);
        })}
        </div>
      </div>
    </section>);
}
