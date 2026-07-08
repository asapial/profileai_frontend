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
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { resendVerificationOtp, verifyEmail } from "@/lib/auth";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
// Email verification OTPs are not server-side rate limited, so the
// resend button is available immediately after each request.
const RESEND_COOLDOWN = 0;

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
  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill("")
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If the user landed without ?email=, kick them back to /register —
  // we can't verify a code without context.
  useEffect(() => {
    if (!emailParam) router.replace("/register");
  }, [emailParam, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const setSlot = useCallback((index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const char = raw.slice(-1);
    if (char) {
      setSlot(index, char);
      if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    } else {
      setSlot(index, "");
    }
  };

  const handleKeyDown =
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < Math.min(text.length, OTP_LENGTH); i += 1) {
      next[i] = text[i]!;
    }
    setDigits(next);
    const last = Math.min(text.length, OTP_LENGTH) - 1;
    inputRefs.current[Math.min(last + 1, OTP_LENGTH - 1)]?.focus();
  };

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || submitting) return;
    if (!email.trim()) {
      setError("Please enter the email you registered with.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await verifyEmail({
      email: email.trim().toLowerCase(),
      otp: code,
    });
    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    // Bounce to /login with a `verified=1` flag so the login screen can
    // surface a success toast.
    router.push("/login?verified=1");
  };

  const onResend = async () => {
    if (cooldown > 0 || resending || !email.trim()) return;
    setResending(true);
    setResendMsg(null);
    const result = await resendVerificationOtp({
      email: email.trim().toLowerCase(),
    });
    setResending(false);
    setResendMsg(result.message);
    if (result.ok) {
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-7 shadow-xl shadow-violet-500/5 backdrop-blur-md sm:p-9">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          ProFile <span className="text-gradient">AI</span>
        </span>
      </div>

      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <Mail className="h-3.5 w-3.5 text-primary" />
          Email verification
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Check your inbox
        </h1>
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
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
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
              className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground">
            Verification code
          </legend>
          <div
            className="flex justify-between gap-2"
            role="group"
            aria-label="Six-digit verification code"
            onPaste={handlePaste}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={handleChange(index)}
                onKeyDown={handleKeyDown(index)}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                className={cn(
                  "h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "sm:h-14 sm:w-12"
                )}
              />
            ))}
          </div>
        </fieldset>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendMsg && !error && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-300"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{resendMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!isComplete || submitting}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
              <span>Verify and continue</span>
              <ShieldCheck className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-sm">
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
    </div>
  );
}
