"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { EditButton } from "@/admin/EditMode";
import IDCard from "@/components/Hero/IDCard";
import { useSiteData } from "@/lib/site-context";
import { fadeUpVariant, staggerParentVariant } from "@/utils/animations";

export default function HeroSection() {
  const { data } = useSiteData();
  const { profile } = data;

  return (
    <section id="hero" className="section-shell pt-20 sm:pt-24">
      <div className="ambient-grid noise-overlay panel-surface-strong relative overflow-hidden rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]" />
        <div className="absolute -left-14 top-24 h-52 w-52 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />
        <div className="absolute bottom-12 right-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute right-6 top-6 hidden h-28 w-28 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)]/70 lg:block"
        />
        <motion.div
          animate={{ y: [0, 18, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute bottom-14 left-10 hidden h-20 w-20 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]/60 lg:block"
        />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            variants={staggerParentVariant}
            initial="hidden"
            animate="visible"
            className="relative z-10 space-y-6"
          >
            <motion.div variants={fadeUpVariant} className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Interactive developer narrative</span>
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
                Scroll, explore, edit
              </span>
              <EditButton section="profile" label="Edit profile / ID card" />
            </motion.div>

            <motion.div variants={fadeUpVariant} className="space-y-5">
              <h1 className="section-title max-w-3xl font-semibold text-[color:var(--text)]">
                <span className="block">{profile.name}</span>
                <span className="text-gradient">{profile.tagline}</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-soft)] sm:text-xl">
                {profile.intro}
              </p>
            </motion.div>

            <motion.div variants={fadeUpVariant} className="flex flex-wrap gap-3">
              {profile.heroActions.map((action) => (
                <Link
                  key={`${action.label}-${action.href}`}
                  href={action.href}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 ${
                    action.variant === "primary"
                      ? "bg-[color:var(--accent)] text-slate-950 hover:brightness-110"
                      : "border border-[color:var(--line)] bg-[color:var(--surface)]/70 text-[color:var(--text)] hover:-translate-y-0.5"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUpVariant}
              className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)]/60 p-5 sm:grid-cols-3"
            >
              <div>
                <p className="eyebrow">Role</p>
                <p className="mt-2 text-base font-medium text-[color:var(--text)]">{profile.role}</p>
              </div>
              <div>
                <p className="eyebrow">Location</p>
                <p className="mt-2 text-base font-medium text-[color:var(--text)]">{profile.location}</p>
              </div>
              <div>
                <p className="eyebrow">Availability</p>
                <p className="mt-2 text-base font-medium text-[color:var(--text)]">{profile.availability}</p>
              </div>
            </motion.div>
          </motion.div>

          <div className="relative z-10 overflow-hidden rounded-[2.25rem] border border-black/8 bg-[#030508] px-4 py-8 shadow-[0_32px_80px_rgba(0,0,0,0.18)] sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.18),transparent_28%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_32%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_24%)]" />
            <IDCard profile={profile} />
          </div>
        </div>

      </div>
    </section>
  );
}
