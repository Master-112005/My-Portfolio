"use client";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
export default function ThemeToggle() {
    const { resolvedTheme, theme, setTheme } = useTheme();
    return (<motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
      <div className="panel-surface flex items-center gap-2 rounded-full p-2">
        {["system", "light", "dark"].map((item) => {
            const isActive = theme === item || (item !== "system" && resolvedTheme === item && theme !== "system");
            return (<button key={item} type="button" onClick={() => setTheme(item)} className={`rounded-full border px-3 py-2 font-mono text-xs uppercase tracking-[0.24em] transition ${isActive
                    ? "border-[color:var(--line)] bg-[color:var(--accent-soft)] text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                    : "border-transparent text-[color:var(--text-soft)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"}`}>
              {item}
            </button>);
        })}
      </div>
    </motion.div>);
}
