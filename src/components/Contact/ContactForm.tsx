"use client";

import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";

import { EditButton, useEditMode } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";

type FormState = {
  email: string;
  message: string;
  name: string;
};

const initialFormState: FormState = {
  email: "",
  message: "",
  name: "",
};

export default function ContactForm() {
  const { data, submitMessage } = useSiteData();
  const { isEditMode, openEditor } = useEditMode();
  const contactCards = [
    { label: "Email", value: data.contact.email.trim() },
    { label: "Phone", value: data.contact.phone.trim() },
    { label: "Location", value: data.contact.location.trim() },
    { label: "Response", value: data.contact.responseTime.trim() },
  ].filter((item) => item.value);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<keyof FormState | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSuccess(false);

    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedMessage = formState.message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFormError("Please enter a valid name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (trimmedMessage.length < 12) {
      setFormError("Message should be at least 12 characters.");
      return;
    }

    setIsSending(true);

    try {
      await submitMessage({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      setFormState(initialFormState);
      setIsSuccess(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="section-shell">
      <div className="panel-surface-strong rounded-[2.25rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Creative contact</span>
              <EditButton section="contact" label="Edit contact" />
              {isEditMode ? (
                <button type="button" onClick={() => openEditor("mailer")} className="edit-button">
                  <span aria-hidden="true">+</span>
                  <span>Edit mailer</span>
                </button>
              ) : null}
            </div>
            {data.contact.headline.trim() ? (
              <h2 className="section-title max-w-xl font-semibold text-[color:var(--text)]">
                {data.contact.headline}
              </h2>
            ) : null}
            <p className="section-copy max-w-lg">
              If you have a role, project, or collaboration in mind, send a message and I will get back to you.
            </p>

            {contactCards.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {contactCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)]/70 p-4"
                  >
                    <p className="eyebrow">{card.label}</p>
                    <p className="mt-3 text-base font-medium text-[color:var(--text)]">{card.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <motion.form
            onSubmit={(event) => void handleSubmit(event)}
            className="panel-surface rounded-[2rem] border border-[color:var(--line)] p-5 sm:p-6"
          >
            <div className="grid gap-4">
              {([
                {
                  id: "name",
                  label: "Name",
                  type: "text",
                },
                {
                  id: "email",
                  label: "Email",
                  type: "email",
                },
              ] as const).map((field) => (
                <motion.label
                  key={field.id}
                  animate={{ scale: focusedField === field.id ? 1.01 : 1 }}
                  className="space-y-2"
                >
                  <span className="block font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                    {field.label}
                  </span>
                  <input
                    type={field.type}
                    value={formState[field.id]}
                    onFocus={() => setFocusedField(field.id)}
                    onBlur={() => setFocusedField((current) => (current === field.id ? null : current))}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    required
                    className="input-surface"
                  />
                </motion.label>
              ))}

              <motion.label animate={{ scale: focusedField === "message" ? 1.01 : 1 }} className="space-y-2">
                <span className="block font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                  Message
                </span>
                <textarea
                  value={formState.message}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField((current) => (current === "message" ? null : current))}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  required
                  className="input-surface min-h-[14rem] resize-y"
                />
              </motion.label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={`text-sm ${formError ? "text-rose-400" : "text-[color:var(--text-soft)]"}`}>
                {formError ?? (isSuccess ? "Message sent successfully." : data.contact.availability)}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSending}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-75"
              >
                {isSending ? "Sending..." : isSuccess ? "Sent" : "Send message"}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
