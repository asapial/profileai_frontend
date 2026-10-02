"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { resendVerificationOtp, verifyEmail } from "@/lib/auth";
import { OtpInput } from "@/components/auth/OtpInput";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const maskEmail = (value: string): string => {
  if (!value) return "";
  const [user, domain] = value.split("@");
  if (!user || !domain) return value;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(user.length - 2, 1))}@${domain}`;
};

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [otpValue, setOtpValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [otpKey, setOtpKey] = useState(0); // reset OtpInput on resend

  useEffect(() => {
    if (!emailParam) router.replace("/register");
  }, [emailParam, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const isComplete = otpValue.length === 6;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    if (!email.trim()) {
      setError("Please enter the email you registered with.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const result = await verifyEmail({
      email: email.trim().toLowerCase(),
      otp: otpValue,
    });
    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      setOtpKey((k) => k + 1);
      setOtpValue("");
      return;
    }
    router.push("/login?verified=1");
  };

  const onResend = async () => {
    if (cooldown > 0 || resending || !email.trim()) return;
    setResending(true);
    setResendMsg(null);
    const result = await resendVerificationOtp({ email: email.trim().toLowerCase() });
    setResending(false);
    setResendMsg(result.message);
    if (result.ok) {
      setCooldown(60);
      setOtpKey((k) => k + 1);
      setOtpValue("");
    }
  };

  return (
    <AuthCard>
      <AuthBrandMark />

      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <Mail className="h-3.5 w-3.5 text-primary" />
          Email verification
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Check your inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          {email ? (
            <span className="font-medium text-foreground">{maskEmail(email)}</span>
          ) : (
            "your email"
          )}
          . It expires in 10 minutes.
        </p>
      </header>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-6">
        {/* Email (editable) */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* OTP */}
        <div>
          <p className="mb-2 block text-sm font-medium text-foreground">Verification code</p>
          <OtpInput
            key={otpKey}
            onChange={setOtpValue}
            hasError={Boolean(error)}
            disabled={submitting}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendMsg && !error && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-300"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{resendMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!isComplete || submitting}
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
              <span>Verifying…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Verify and continue</span>
              <ArrowRight className="h-4 w-4 opacity-70" />
            </>
          )}
        </button>

        <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/register"
            className="inline-flex items-center gap-1 font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to register
          </Link>
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending || !email.trim()}
            className={cn(
              "inline-flex items-center gap-1 font-medium transition",
              "text-primary hover:underline",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            )}
          >
            {resending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Resend code
              </>
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
