"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
      <section className="relative isolate overflow-hidden px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent" aria-hidden="true" />
        <div data-aos="fade-up" className="glass-panel premium-ring mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
            <div>
              <span className="premium-kicker"><Sparkles className="h-4 w-4" /> Contact the team</span>
              <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Tell us what you need. We’ll route it to the right person.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Product questions, billing, partnerships, privacy, or security—send one clear message and follow it from the same support workspace our team uses.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2"><Clock3 className="h-4 w-4 text-primary" /> Typical weekday reply under 4 hours</span>
                <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2"><ShieldCheck className="h-4 w-4 text-primary" /> Private ticket routing</span>
              </div>
            </div>
            <div className="relative rounded-[1.75rem] border bg-card/80 p-6 shadow-xl shadow-violet-500/10 sm:p-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><MessageSquareText className="h-5 w-5" /></div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-primary">One message, two reliable paths</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Visible in the admin inbox. Delivered by email.</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />Your request becomes a support ticket immediately.</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />Every configured admin recipient receives an email copy.</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />The reply-to address is set to your email for a faster response.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
          <aside className="space-y-4">
            {[
              [LifeBuoy, "Product support", "Account access, resumes, templates, exports, or application tracking."],
              [Building2, "Teams & partnerships", "Coaches, universities, workforce programs, and hiring teams."],
              [LockKeyhole, "Privacy & security", "Data requests, suspicious activity, or responsible disclosure."],
            ].map(([Icon, title, description], index) => {
              const Symbol = Icon as typeof LifeBuoy;
              return (
                <article key={String(title)} data-aos="fade-up" data-aos-delay={String(index * 70)} className="glass-subtle rounded-2xl p-5">
                  <Symbol className="h-5 w-5 text-primary" />
                  <h2 className="mt-4 font-semibold">{String(title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(description)}</p>
                </article>
              );
            })}
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-sm leading-6 text-muted-foreground">
              <strong className="block text-foreground">Keep sensitive details out.</strong>
              Never send passwords, one-time codes, access tokens, full card numbers, or unredacted identity documents.
            </div>
            <p className="px-1 text-sm text-muted-foreground">
              Looking for a quick answer? <Link href="/help" className="font-semibold text-primary hover:underline">Visit the Help Center</Link>.
            </p>
          </aside>

          <div data-aos="fade-up" className="glass-panel rounded-[1.75rem] p-5 sm:p-8 lg:p-10">
            {reference ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center" role="status">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Message received</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your request is with our team.</h2>
                <p className="mt-4 max-w-lg leading-7 text-muted-foreground">It is now visible in the admin support dashboard. Email delivery is handled using the recipients configured by the admin team.</p>
                <p className="mt-5 rounded-xl border bg-muted/40 px-4 py-2 font-mono text-sm">Reference: {reference}</p>
                <button type="button" onClick={() => setReference(null)} className="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:underline">Send another message <ArrowRight className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Contact form</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">How can we help?</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Fields marked required help us route your request without another round of questions.</p>
                <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" name="name" autoComplete="name" error={fieldErrors.name} clearError={() => setFieldErrors((current) => ({ ...current, name: undefined }))} placeholder="Alex Morgan" />
                    <Field label="Email" name="email" type="email" autoComplete="email" error={fieldErrors.email} clearError={() => setFieldErrors((current) => ({ ...current, email: undefined }))} placeholder="alex@example.com" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company or organization" name="company" autoComplete="organization" placeholder="Optional" />
                    <label className="block text-sm font-medium">Topic
                      <select name="category" defaultValue="GENERAL" className="mt-2 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <Field label="Subject" name="subject" error={fieldErrors.subject} clearError={() => setFieldErrors((current) => ({ ...current, subject: undefined }))} placeholder="A short summary of your request" />
                  <label className="block text-sm font-medium">Message
                    <textarea
                      name="message"
                      rows={7}
                      maxLength={5000}
                      onChange={(event) => { setMessageLength(event.target.value.length); if (fieldErrors.message) setFieldErrors((current) => ({ ...current, message: undefined })); }}
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={fieldErrors.message ? "message-error" : "message-count"}
                      placeholder="What happened, what did you expect, and what would a useful outcome look like?"
                      className={cn("mt-2 w-full rounded-xl border bg-card px-3 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring", fieldErrors.message ? "border-destructive" : "border-input")}
                    />
                    <span className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
                      <span id="message-error" className="text-destructive">{fieldErrors.message}</span>
                      <span id="message-count" className="ml-auto">{messageLength}/5000</span>
                    </span>
                  </label>
                  <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <label className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                    <input name="consent" type="checkbox" onChange={() => fieldErrors.consent && setFieldErrors((current) => ({ ...current, consent: undefined }))} className="mt-1 h-4 w-4 rounded border-input" />
                    <span>I agree that ProFile AI may use these details to respond to this request. See the <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.</span>
                  </label>
                  {fieldErrors.consent && <p className="text-sm text-destructive">{fieldErrors.consent}</p>}
                  {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
                  <button type="submit" disabled={submitting} className="studio-button min-h-12 w-full justify-center rounded-xl text-sm disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending securely…</> : <><Send className="h-4 w-4" /> Send message <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><FileCheck2 className="h-3.5 w-3.5" />Creates a private support ticket for the admin team.</p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ label, name, error, clearError, className, onChange, ...props }: { label: string; name: string; error?: string; clearError?: () => void } & InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${name}-error`;
  return (
    <label className="block text-sm font-medium">{label}
      <input
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          onChange?.(event);
          if (error) clearError?.();
        }}
        className={cn("mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", error ? "border-destructive" : "border-input", className)}
        {...props}
      />
      {error && <span id={errorId} className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
