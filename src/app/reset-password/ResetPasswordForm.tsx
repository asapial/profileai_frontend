"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { OtpInput } from "@/components/auth/OtpInput";
import { requestPasswordReset, resetPassword } from "@/lib/auth";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 60;

const PASSWORD_RE = {
  minLength: /.{8,}/,
  upper: /[A-Z]/,
  digit: /\d/,
  symbol: /[^A-Za-z0-9]/,
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  const [otpValue, setOtpValue] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const startCooldown = useCallback(() => setCooldown(RESEND_COOLDOWN), []);

  const passwordChecks = {
    minLength: PASSWORD_RE.minLength.test(newPassword),
    upper: PASSWORD_RE.upper.test(newPassword),
    digit: PASSWORD_RE.digit.test(newPassword),
    symbol: PASSWORD_RE.symbol.test(newPassword),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const validate = (): string | null => {
    if (otpValue.length !== 6) return "Enter the 6-digit code from your email.";
    if (!newPassword) return "Choose a new password.";
    if (!passwordValid) return "Password must be 8+ characters with an uppercase letter, a number, and a symbol.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    const result = await resetPassword({
      email,
      otp: otpValue,
      newPassword,
      confirmPassword,
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login?reset=1"), 2500);
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    const result = await requestPasswordReset({ email });
    setResending(false);
    if (!result.ok) { setError(result.message); return; }
    setOtpKey((k) => k + 1);
    setOtpValue("");
    startCooldown();
  };

  if (done) {
    return (
      <AuthCard>
        <div className="text-center space-y-5">
          <div
            className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full animate-auth-pulse-glow"
            style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Password updated</h1>
          <p className="text-sm text-muted-foreground">
            All other sessions have been signed out. Redirecting you to log in…
          </p>
          <Link
            href="/login?reset=1"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            Continue to login
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthBrandMark />

      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-primary">{email}</span>. Enter it below with a new
          password.
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

      <form onSubmit={submit} noValidate className="space-y-6">
        {/* OTP */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reset code</label>
          <OtpInput
            key={otpKey}
            onChange={setOtpValue}
            hasError={Boolean(error && otpValue.length < 6)}
            disabled={submitting}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Code expires in 10 minutes.</span>
            {cooldown > 0 ? (
              <span>
                Resend in <span className="font-semibold text-primary">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1 text-primary transition-colors hover:opacity-80 disabled:opacity-60"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", resending && "animate-spin")} />
                Resend code
              </button>
            )}
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <div className="relative flex items-center rounded-xl border border-border/70 bg-background/60 transition-colors focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/20">
            <Lock className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="mr-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <div
            className={cn(
              "relative flex items-center rounded-xl border bg-background/60 transition-colors",
              confirmPassword && !passwordsMatch
                ? "border-red-500/50 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/20"
                : "border-border/70 focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/20"
            )}
          >
            <ShieldCheck className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          id="reset-password-submit"
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
              Updating password…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Update password
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
        <Link
          href="/forgot-password"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Use a different email
        </Link>
      </div>
    </AuthCard>
  );
}
