"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 60;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) { setError("Enter the email associated with your account."); return; }
    if (!EMAIL_RE.test(trimmed)) { setError("Enter a valid email address."); return; }

    setSubmitting(true);
    const result = await requestPasswordReset({ email: trimmed.toLowerCase() });
    setSubmitting(false);

    if (!result.ok) { setError(result.message); return; }
    setSubmitted(true);
    startCooldown();
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) { setError("Enter a valid email address first."); return; }
    setError(null);
    setResending(true);
    const result = await requestPasswordReset({ email: trimmed.toLowerCase() });
    setResending(false);
    if (!result.ok) { setError(result.message); return; }
    startCooldown();
  };

  if (submitted) {
    return (
      <AuthCard>
        <AuthBrandMark />

        <div className="space-y-5 text-center">
          {/* Animated success icon */}
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-full animate-auth-pulse-glow"
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "2px solid rgba(139,92,246,0.4)",
            }}
          >
            <CheckCircle2 className="h-8 w-8 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-primary">{email.trim().toLowerCase()}</span>, we just
              sent a 6-digit reset code. The code expires in 10 minutes.
            </p>
          </div>

          <Link
            href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            <Mail className="h-4 w-4" />
            Enter the reset code
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>

          <div className="space-y-2 pt-2 text-sm">
            {cooldown > 0 ? (
              <p className="text-muted-foreground">
                Didn&apos;t get it?{" "}
                <span className="font-semibold text-primary">Resend in {cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-primary transition-colors hover:opacity-80"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", resending && "animate-spin")} />
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCooldown(0);
                if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
              }}
              className="text-primary underline-offset-2 hover:underline"
            >
              Use a different email
            </button>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthBrandMark />

      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send a one-time code to reset your
          password.
        </p>
      </header>

      {error && (
        <div
          id="forgot-password-error"
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <span className="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "forgot-password-error" : undefined}
              placeholder="you@example.com"
              className="auth-input"
            />
          </div>
        </div>

        <button
          type="submit"
          id="forgot-password-submit"
          disabled={submitting}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all",
            "bg-gradient-to-r from-violet-600 to-fuchsia-600",
            "hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending code…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send reset code
              <ArrowRight className="h-4 w-4 opacity-70" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
        <Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
