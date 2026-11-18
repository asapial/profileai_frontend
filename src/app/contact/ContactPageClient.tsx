"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { PublicEnvironment } from "@/components/public/PublicPageShell";
import styles from "@/components/public/AccessPages.module.css";

type Category = "GENERAL" | "PRODUCT_SUPPORT" | "BILLING" | "PARTNERSHIP" | "PRIVACY" | "SECURITY";
type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message" | "consent", string>>;

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: "GENERAL", label: "General question" },
  { value: "PRODUCT_SUPPORT", label: "Product support" },
  { value: "BILLING", label: "Billing & subscription" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVACY", label: "Privacy request" },
  { value: "SECURITY", label: "Security concern" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactPageClient() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim().toLowerCase(),
      company: String(data.get("company") ?? "").trim(),
      category: String(data.get("category") ?? "GENERAL") as Category,
      subject: String(data.get("subject") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };
    const next: FieldErrors = {};
    if (payload.name.length < 2) next.name = "Please enter your name.";
    if (!EMAIL_RE.test(payload.email)) next.email = "Enter a valid email address.";
    if (payload.subject.length < 4) next.subject = "Add a short subject.";
    if (payload.message.length < 20) next.message = "Please add a little more detail.";
    if (!payload.consent) next.consent = "Please agree so our team can reply.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<{ ticketId: string; reference: string }>("/contact", payload);
      setReference(result.reference);
      form.reset();
      setMessageLength(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your message could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className={styles.hero}>
        <PublicEnvironment kind="contact" />
        <div className={styles.container}>
          <div className={styles.heroCopy} data-public-reveal>
            <h1 data-public-reveal>Talk to the right people.</h1>
            <p>Product support, billing, partnerships, privacy or security.</p>
          </div>
        </div>
      </section>
      <section className={styles.container} aria-label="Contact the team">
        <div className={styles.contactLayout}>
          <aside className={styles.support}>
            {[
              ["Product support", "Account access, resumes, templates, exports, or application tracking."],
              ["Teams & partnerships", "Coaches, universities, workforce programs, and hiring teams."],
              ["Privacy & security", "Data requests, suspicious activity, or responsible disclosure."],
            ].map(([title, description]) => (
              <article key={title} data-public-reveal><h2>{title}</h2><p>{description}</p></article>
            ))}
            <div className={styles.supportNote} data-public-reveal>
              <strong>Keep sensitive details out.</strong>
              Never send passwords, one-time codes, access tokens, full card numbers, or unredacted identity documents.
            </div>
            <Link href="/help" className={styles.helpLink} data-public-reveal>Visit the Help Center <ArrowRight size={16} aria-hidden /></Link>
          </aside>
          <div className={styles.formPanel} data-public-reveal>
            {reference ? (
              <div className={styles.success} role="status">
                <CheckCircle2 aria-hidden />
                <h2>Your request is with our team.</h2>
                <p>Keep your reference number handy when following up.</p>
                <p className={styles.reference}>Reference: {reference}</p>
                <button type="button" onClick={() => setReference(null)} className={styles.helpLink}>Send another message <ArrowRight size={16} aria-hidden /></button>
              </div>
            ) : (
              <>
                <h2 data-public-reveal>How can we help?</h2>
                <form className={styles.form} onSubmit={submit} noValidate data-ui>
                  <div className={styles.twoFields}>
                    <Field label="Name" name="name" autoComplete="name" error={fieldErrors.name} clearError={() => setFieldErrors((current) => ({ ...current, name: undefined }))} placeholder="Your name" />
                    <Field label="Email" name="email" type="email" autoComplete="email" error={fieldErrors.email} clearError={() => setFieldErrors((current) => ({ ...current, email: undefined }))} placeholder="you@example.com" />
                  </div>
                  <div className={styles.twoFields}>
                    <Field label="Company or organization" name="company" autoComplete="organization" placeholder="Your company" optional />
                    <label className={styles.field}>Topic
                      <select name="category" defaultValue="GENERAL">
                        {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <Field label="Subject" name="subject" error={fieldErrors.subject} clearError={() => setFieldErrors((current) => ({ ...current, subject: undefined }))} placeholder="A short summary of your request" />
                  <label className={styles.field}>Message
                    <textarea
                      name="message" rows={6} maxLength={5000}
                      onChange={(event) => { setMessageLength(event.target.value.length); if (fieldErrors.message) setFieldErrors((current) => ({ ...current, message: undefined })); }}
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={fieldErrors.message ? "message-error message-count" : "message-count"}
                      placeholder="Tell us what you need help with…"
                    />
                    <span className={styles.fieldMeta}>
                      {fieldErrors.message && <span id="message-error" className={styles.error}>{fieldErrors.message}</span>}
                      <span id="message-count" className={styles.count}>{messageLength}/5000</span>
                    </span>
                  </label>
                  <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <label className={styles.consent}>
                    <input name="consent" type="checkbox" aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "consent-error" : undefined} onChange={() => fieldErrors.consent && setFieldErrors((current) => ({ ...current, consent: undefined }))} />
                    <span>I agree that ProfileAI may use these details to respond to this request. See the <Link href="/privacy">Privacy Policy</Link>.</span>
                  </label>
                  {fieldErrors.consent && <p id="consent-error" className={styles.error}>{fieldErrors.consent}</p>}
                  {error && <div role="alert" className={styles.alert}>{error}</div>}
                  <button type="submit" disabled={submitting} className={styles.submit}>
                    {submitting ? <><Loader2 size={17} className="animate-spin" aria-hidden /> Sending…</> : <><Send size={17} aria-hidden /> Send message</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ label, name, error, clearError, optional, className, onChange, ...props }: { label: string; name: string; error?: string; clearError?: () => void; optional?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const errorId = name + "-error";
  return (
    <label className={styles.field}>
      <span>{label} {optional && <span className={styles.optional}>(Optional)</span>}</span>
      <input
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => { onChange?.(event); if (error) clearError?.(); }}
        className={className}
        {...props}
      />
      {error && <span id={errorId} className={styles.error}>{error}</span>}
    </label>
  );
}
