"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 60;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  // Clean up the timer on unmount so we don't leak intervals.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email associated with your account.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    const result = await requestPasswordReset({ email: trimmed.toLowerCase() });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSubmitted(true);
    startCooldown();
  };

  const handleResend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address first.");
      return;
    }
    setError(null);
    const result = await requestPasswordReset({ email: trimmed.toLowerCase() });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    startCooldown();
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl shadow-violet-500/5 backdrop-blur-md min-[360px]:p-6 sm:p-9">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            ProFile <span className="text-gradient">AI</span>
          </span>
        </div>

        <div className="text-center space-y-5">
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-full"
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
              <span className="font-medium text-primary">
                {email.trim().toLowerCase()}
              </span>
              , we just sent a 6-digit reset code. The code expires in 10
              minutes.
            </p>
          </div>

          <Link
            href={`/reset-password?email=${encodeURIComponent(
              email.trim().toLowerCase()
            )}`}
            id="open-reset-link"
            className="btn-primary inline-flex w-full items-center justify-center"
          >
            <Mail className="h-4 w-4" />
            Enter the reset code
          </Link>

          <div className="space-y-2 pt-2 text-sm">
            {cooldown > 0 ? (
              <p className="text-muted-foreground">
                Didn&apos;t get it?{" "}
                <span className="font-semibold text-primary">
                  Resend in {cooldown}s
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-primary transition-colors hover:opacity-80"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Resend code
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
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
              }}
              className="text-primary underline-offset-2 hover:underline"
            >
              Use a different email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl shadow-violet-500/5 backdrop-blur-md min-[360px]:p-6 sm:p-9">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          ProFile <span className="text-gradient">AI</span>
        </span>
      </div>

      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send a one-time code to
          reset your password.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          <span className="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <div
            className={cn(
              "relative flex items-center rounded-xl border border-border/70 bg-background/60 transition-colors",
              "focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/20"
            )}
          >
            <Mail className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          id="forgot-password-submit"
          disabled={submitting}
          className="btn-primary inline-flex w-full items-center justify-center gap-2"
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
        <Link
          href="/register"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
