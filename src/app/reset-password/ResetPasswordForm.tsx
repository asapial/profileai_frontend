"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { requestPasswordReset, resetPassword } from "@/lib/auth";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
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

  // Bounce users without an email param back to the request page so we
  // never render an OTP form against an unknown account.
  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  const [otp, setOtp] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => "")
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Seed the cooldown synchronously so the resend button starts disabled
  // without triggering an extra render.
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN);

  // Tick down once a second; init is handled by useState above.
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
  }, []);

  const updateOtpAt = (index: number, value: string) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = event.target.value.replace(/\D/g, "");
    if (!raw) {
      updateOtpAt(index, "");
      return;
    }
    // Paste of full code — distribute across slots.
    if (raw.length > 1) {
      const digits = raw.slice(0, OTP_LENGTH).split("");
      setOtp((prev) => {
        const next = [...prev];
        for (let i = 0; i < OTP_LENGTH; i += 1) {
          next[i] = digits[i] ?? "";
        }
        return next;
      });
      const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[focusIndex]?.focus();
      return;
    }
    updateOtpAt(index, raw);
    if (index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const digits = pasted.slice(0, OTP_LENGTH).split("");
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = digits[i] ?? "";
      }
      return next;
    });
    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const passwordChecks = {
    minLength: PASSWORD_RE.minLength.test(newPassword),
    upper: PASSWORD_RE.upper.test(newPassword),
    digit: PASSWORD_RE.digit.test(newPassword),
    symbol: PASSWORD_RE.symbol.test(newPassword),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const validate = (): string | null => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      return "Enter the 6-digit code from your email.";
    }
    if (!newPassword) {
      return "Choose a new password.";
    }
    if (!passwordValid) {
      return "Password must be 8+ characters with an uppercase letter, a number, and a symbol.";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const result = await resetPassword({
      email,
      otp: otp.join(""),
      newPassword,
      confirmPassword,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login?reset=1"), 2500);
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    const result = await requestPasswordReset({ email });
    setResending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    otpRefs.current[0]?.focus();
    startCooldown();
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 p-5 text-center shadow-xl shadow-violet-500/5 backdrop-blur-md min-[360px]:p-6 sm:p-9">
        <div
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full"
          style={{
            background: "rgba(16,185,129,0.15)",
            border: "2px solid rgba(16,185,129,0.4)",
          }}
        >
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          All other sessions have been signed out. Redirecting you to log in…
        </p>
        <Link
          href="/login?reset=1"
          className="btn-primary mt-6 inline-flex w-full items-center justify-center"
        >
          Continue to login
        </Link>
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
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-primary">{email}</span>. Enter
          it below with a new password.
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
          <label className="text-sm font-medium text-foreground">
            Reset code
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={OTP_LENGTH}
                value={digit}
                onChange={(e) => handleOtpChange(index, e)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                id={`reset-otp-${index}`}
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-lg border border-border/70 bg-background/60 text-center text-lg font-semibold text-foreground sm:h-12 sm:max-w-12 sm:rounded-xl",
                  "outline-none transition-colors",
                  "focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Code expires in 10 minutes.</span>
            {cooldown > 0 ? (
              <span>
                Resend in{" "}
                <span className="font-semibold text-primary">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1 text-primary transition-colors hover:opacity-80 disabled:opacity-60"
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5",
                    resending && "animate-spin"
                  )}
                />
                Resend code
              </button>
            )}
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="text-sm font-medium text-foreground"
          >
            New password
          </label>
          <div
            className={cn(
              "relative flex items-center rounded-xl border border-border/70 bg-background/60 transition-colors",
              "focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/20"
            )}
          >
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
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-foreground"
          >
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
          className="btn-primary inline-flex w-full items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password…
            </>
          ) : (
            "Update password"
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
    </div>
  );
}
