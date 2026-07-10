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
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { postLoginRoute, verifyTwoFactor } from "@/lib/auth";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

function getSafeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

export function TwoFactorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill("")
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(emailParam);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If the user landed directly on /login/2fa without ?email=, kick them
  // back to the password screen — we can't verify a code without context.
  useEffect(() => {
    if (!emailParam) router.replace("/login");
  }, [emailParam, router]);

  useEffect(() => {
    // Autofocus the first slot on mount.
    inputRefs.current[0]?.focus();
  }, []);

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
      // Auto-advance to next empty slot.
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

    setError(null);
    setSubmitting(true);

    const result = await verifyTwoFactor({ email: email.trim(), otp: code });
    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      // Clear the inputs so the user can retype.
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    // Sync role to middleware before navigation so /admin gates pass
    // immediately on the first push (admin tabs are a frequent source
    // of "redirected to login right after I logged in" bugs).
    void fetch("/api/auth/post-login", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      /* non-fatal */
    });

    const intended = getSafeRedirect(params.get("redirect"));
    const destination = intended ?? postLoginRoute(result.user);
    router.push(destination);
    router.refresh();
  };

  const maskedEmail = email
    ? (() => {
        const [user, domain] = email.split("@");
        if (!user || !domain) return email;
        const visible = user.slice(0, 2);
        return `${visible}${"•".repeat(Math.max(user.length - 2, 1))}@${domain}`;
      })()
    : "";

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

      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Two-factor verification
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Enter your 6-digit code
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a one-time code to{" "}
          {maskedEmail ? (
            <span className="font-medium text-foreground">{maskedEmail}</span>
          ) : (
            "your email"
          )}
          . The code expires in 10 minutes.
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
            className="flex gap-1.5 sm:justify-between sm:gap-2"
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
                  "h-10 min-w-0 flex-1 rounded-md border border-input bg-background text-center text-lg font-semibold sm:h-14 sm:max-w-12",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
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

        <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() =>
              alert(
                "Resend is wired but not implemented in this build — your backend exposes POST /auth/otp/resend."
              )
            }
          >
            Resend code
          </button>
        </div>
      </form>
    </div>
  );
}
