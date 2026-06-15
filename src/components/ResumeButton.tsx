"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { useEditMode } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";

export default function ResumeButton() {
  const { data } = useSiteData();
  const { isEditMode, openEditor } = useEditMode();
  const [isOpen, setIsOpen] = useState(false);
  const resume = data.resume;
  const hasResume = Boolean(resume.fileHref.trim());

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 sm:bottom-6 sm:right-6"
      >
        <motion.button
          type="button"
          onClick={() => setIsOpen(true)}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(37, 99, 235, 0.72)",
              "0 0 0 12px rgba(37, 99, 235, 0)",
              "0 0 0 0 rgba(37, 99, 235, 0)",
            ],
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{
            boxShadow: {
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
            },
          }}
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-blue-300/70 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/25 transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:bg-blue-700 sm:px-5"
        >
          View resume
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/62 px-4 py-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              className="panel-surface-strong flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem]"
            >
              <div className="flex flex-col gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <span className="eyebrow">Resume</span>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                    {resume.title || "Resume"}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={() => openEditor("resume")}
                      className="edit-button"
                    >
                      <span aria-hidden="true">+</span>
                      <span>Edit resume</span>
                    </button>
                  ) : null}
                  {hasResume ? (
                    <a
                      href={resume.fileHref}
                      download={resume.fileName || "resume.pdf"}
                      className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                    >
                      Download
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--text-soft)] transition hover:text-[color:var(--text)]"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-4 sm:p-6">
                {hasResume ? (
                  <iframe
                    title={resume.title || "Resume"}
                    src={resume.fileHref}
                    className="h-[72vh] w-full rounded-[1.4rem] border border-[color:var(--line)] bg-white"
                  />
                ) : (
                  <div className="flex min-h-[24rem] items-center justify-center rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)]/56 px-6 text-center text-sm leading-6 text-[color:var(--text-soft)]">
                    No resume PDF has been uploaded yet.
                    {isEditMode ? " Use Edit resume to upload one." : ""}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
