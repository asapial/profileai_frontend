"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { register } from "@/lib/auth";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFERRAL_RE = /^[A-Za-z0-9_-]{4,24}$/;
const PASSWORD_RE = {
  length: /.{8,}/,
  upper: /[A-Z]/,
  digit: /\d/,
  special: /[^A-Za-z0-9]/,
};

type FieldErrors = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referredByCode: string;
  acceptTerms: string;
}>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [referredByCode, setReferredByCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Pre-fill referral code from `?ref=` query param (e.g. /register?ref=ABCDE).
  // We compute the effective value (user-typed or query-derived) inline so
  // the input is fully controlled without needing a sync setState in an effect.
  const referredByFromQuery = (() => {
    const raw = searchParams.get("ref");
    return raw && REFERRAL_RE.test(raw) ? raw : "";
  })();
  const effectiveReferredByCode = referredByCode || referredByFromQuery;

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!firstName.trim()) next.firstName = "First name is required.";
    else if (firstName.trim().length > 50)
      next.firstName = "First name is too long.";

    if (!lastName.trim()) next.lastName = "Last name is required.";
    else if (lastName.trim().length > 50)
      next.lastName = "Last name is too long.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else {
      if (!PASSWORD_RE.length.test(password))
        next.password = "Password must be at least 8 characters.";
      else if (!PASSWORD_RE.upper.test(password))
        next.password = "Add at least one uppercase letter.";
      else if (!PASSWORD_RE.digit.test(password))
        next.password = "Add at least one number.";
      else if (!PASSWORD_RE.special.test(password))
        next.password = "Add at least one special character.";
    }

    if (!confirmPassword) next.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password)
      next.confirmPassword = "Passwords do not match.";

    if (referredByCode && !REFERRAL_RE.test(referredByCode)) {
      next.referredByCode = "Use 4–24 letters, numbers, '-' or '_'.";
    }

    if (!acceptTerms) next.acceptTerms = "You must accept the terms to continue.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    const referralToSend = effectiveReferredByCode.trim();
    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      acceptTerms: true,
      ...(referralToSend ? { referredByCode: referralToSend } : {}),
    });

    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      return;
    }

    // Success — bounce to verify-email. We pass the email so the user doesn't
    // have to re-type it after the page reload.
    const params = new URLSearchParams({ email: result.email });
    router.push(`/verify-email?${params.toString()}`);
  };

  const clearError = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-7 shadow-xl shadow-violet-500/5 backdrop-blur-md sm:p-9">
      {/* Brand mark */}
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          ProFile <span className="text-gradient">AI</span>
        </span>
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start building AI-powered resumes for free.
        </p>
      </header>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-5">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              First name
            </label>
            <div className="relative">
              <User
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearError("firstName");
                }}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={
                  fieldErrors.firstName ? "firstName-error" : undefined
                }
                placeholder="Alex"
                className={cn(
                  "w-full rounded-md border bg-background py-2.5 pl-9 pr-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  fieldErrors.firstName
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-input"
                )}
              />
            </div>
            {fieldErrors.firstName && (
              <p
                id="firstName-error"
                className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearError("lastName");
              }}
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={
                fieldErrors.lastName ? "lastName-error" : undefined
              }
              placeholder="Johnson"
              className={cn(
                "w-full rounded-md border bg-background py-2.5 px-3 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                fieldErrors.lastName
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
            />
            {fieldErrors.lastName && (
              <p
                id="lastName-error"
                className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {fieldErrors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
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
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              placeholder="you@example.com"
              className={cn(
                "w-full rounded-md border bg-background py-2.5 pl-9 pr-3 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                fieldErrors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
            />
          </div>
          {fieldErrors.email && (
            <p
              id="email-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
                if (confirmPassword) clearError("confirmPassword");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              placeholder="Create a strong password"
              className={cn(
                "w-full rounded-md border bg-background py-2.5 pl-9 pr-10 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                fieldErrors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrength password={password} />
          {fieldErrors.password && (
            <p
              id="password-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword ? "confirmPassword-error" : undefined
              }
              placeholder="Repeat your password"
              className={cn(
                "w-full rounded-md border bg-background py-2.5 pl-9 pr-10 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                fieldErrors.confirmPassword
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              aria-pressed={showConfirm}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p
              id="confirmPassword-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Referral code (optional) */}
        <div>
          <label
            htmlFor="referredByCode"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Referral code{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <div className="relative">
            <Gift
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="referredByCode"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={referredByCode}
              onChange={(e) => {
                setReferredByCode(e.target.value);
                clearError("referredByCode");
              }}
              aria-invalid={Boolean(fieldErrors.referredByCode)}
              aria-describedby={
                fieldErrors.referredByCode ? "referredByCode-error" : undefined
              }
              placeholder="e.g. ALEX-2026"
              className={cn(
                "w-full rounded-md border bg-background py-2.5 pl-9 pr-3 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                fieldErrors.referredByCode
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
            />
          </div>
          {fieldErrors.referredByCode && (
            <p
              id="referredByCode-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.referredByCode}
            </p>
          )}
        </div>

        {/* Accept terms */}
        <div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                clearError("acceptTerms");
              }}
              aria-invalid={Boolean(fieldErrors.acceptTerms)}
              aria-describedby={
                fieldErrors.acceptTerms ? "acceptTerms-error" : undefined
              }
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.acceptTerms && (
            <p
              id="acceptTerms-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.acceptTerms}
            </p>
          )}
        </div>

        {/* Form-level error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <Check className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
