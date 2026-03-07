"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { EditForms } from "@/admin/EditForms";
import { UnlockPanel } from "@/admin/UnlockPanel";
import ContactForm from "@/components/Contact/ContactForm";
import Footer from "@/components/Footer/Footer";
import HeroSection from "@/components/Hero/HeroSection";
import SkillsBlock from "@/components/Hero/SkillsBlock";
import TimelineSection from "@/components/Timeline/TimelineSection";
import ThemeToggle from "@/components/ThemeToggle";
import { useSiteData } from "@/lib/site-context";

const Desktop = dynamic(() => import("@/components/Projects/Desktop"), {
  ssr: false,
  loading: () => (
    <section className="section-shell">
      <div className="panel-surface-strong rounded-[2.25rem] px-5 py-12 sm:px-8 lg:px-10">
        <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)]/60 text-sm text-[color:var(--text-soft)]">
          Loading desktop workspace...
        </div>
      </div>
    </section>
  ),
});

export default function PortfolioExperience() {
  const { data, isLoading, isSaving, saveError } = useSiteData();

  return (
    <div className="relative overflow-x-clip pb-16">
      <ThemeToggle />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(249,115,22,0.12),_transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.06))]" />
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -12 }}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-full border border-[color:var(--line)] bg-[color:var(--bg-elevated)] px-4 py-2 text-xs text-[color:var(--text-soft)] backdrop-blur xl:left-8"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${isSaving ? "bg-amber-400" : "bg-emerald-400"}`} />
        <span>{isLoading ? "Loading story data" : isSaving ? "Saving edits" : "Portfolio ready"}</span>
        {saveError ? <span className="text-rose-400">{saveError}</span> : null}
      </motion.div>

      <main className="space-y-10 py-6 sm:space-y-12 sm:py-8">
        <HeroSection />
        <TimelineSection />
        <Desktop />
        <SkillsBlock groups={data.profile.skillGroups} />
        <ContactForm />
        <Footer />
      </main>

      <UnlockPanel />
      <EditForms />
    </div>
  );
}
