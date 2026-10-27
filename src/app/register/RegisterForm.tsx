"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FocusEvent, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { register } from "@/lib/auth";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { AvatarUpload } from "@/components/auth/AvatarUpload";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { useAuthMascot } from "@/components/auth/AuthMascotContext";
import { cn } from "@/lib/utils";
import { useClientSearchParams } from "@/lib/hooks/useClientSearchParams";

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
  const searchParams = useClientSearchParams();

  const [photoBusy, setPhotoBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
  const [shakeKey, setShakeKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [activePassword, setActivePassword] = useState<"password" | "confirm" | null>(null);

  const { setPasswordState } = useAuthMascot();

  const activePasswordVisible =
    activePassword === "password" ? showPassword : activePassword === "confirm" ? showConfirm : false;

  useEffect(() => {
    setPasswordState(Boolean(activePassword), activePasswordVisible);
  }, [activePassword, activePasswordVisible, setPasswordState]);

  useEffect(
    () => () => setPasswordState(false, false),
    [setPasswordState],
  );

  const passwordFieldFocus = (field: "password" | "confirm") => () => setActivePassword(field);
  const passwordFieldBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActivePassword(null);
    }
  };

  const referredByFromQuery = (() => {
    const raw = searchParams.get("ref");
    return raw && REFERRAL_RE.test(raw) ? raw : "";
  })();
  const effectiveReferredByCode = referredByCode || referredByFromQuery;

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!firstName.trim()) next.firstName = "First name is required.";
    else if (firstName.trim().length > 50) next.firstName = "First name is too long.";

    if (!lastName.trim()) next.lastName = "Last name is required.";
    else if (lastName.trim().length > 50) next.lastName = "Last name is too long.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else {
      if (!PASSWORD_RE.length.test(password)) next.password = "Password must be at least 8 characters.";
      else if (!PASSWORD_RE.upper.test(password)) next.password = "Add at least one uppercase letter.";
      else if (!PASSWORD_RE.digit.test(password)) next.password = "Add at least one number.";
      else if (!PASSWORD_RE.special.test(password)) next.password = "Add at least one special character.";
    }

    if (!confirmPassword) next.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";

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
    if (photoBusy || submitting) return;
    if (!validate()) {
      setShakeKey((k) => k + 1);
      return;
    }

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
      ...(avatarUrl ? { avatarUrl } : {}),
    });

    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      setShakeKey((k) => k + 1);
      return;
    }

    const params = new URLSearchParams({ email: result.email });
    const selectedPlan = searchParams.get("plan");
    const selectedBilling = searchParams.get("billing");
    if (selectedPlan === "pro" || selectedPlan === "business") params.set("plan", selectedPlan);
    if (selectedBilling === "monthly" || selectedBilling === "yearly") params.set("billing", selectedBilling);
    router.push(`/verify-email?${params.toString()}`);
  };

  const clearError = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <AuthCard>
      <AuthBrandMark note="Create account" />

      <header>
        <h1>Create your account</h1>
        <p>Start building AI-powered resumes for free.</p>
      </header>

      <div style={{ marginTop: 24 }}>
        <GoogleButton label="Sign up with Google" disabled={submitting || photoBusy} />
      </div>

      <div className="ax-rule">or register with email</div>

      <form
        noValidate
        onSubmit={onSubmit}
        className={cn("ax-form", error && shakeKey > 0 && "animate-auth-shake")}
      >
        <div className="ax-name-grid">
          <div>
            <label htmlFor="firstName">First name</label>
            <div className="ax-field">
              <User aria-hidden size={16} />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                placeholder="Alex"
                className={cn("auth-input", fieldErrors.firstName && "error")}
              />
            </div>
            {fieldErrors.firstName && (
              <p id="firstName-error" className="ax-error">
                <AlertCircle size={12} />
                {fieldErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName">Last name</label>
            <div className="ax-field">
              <User aria-hidden size={16} />
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                aria-invalid={Boolean(fieldErrors.lastName)}
                aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                placeholder="Johnson"
                className={cn("auth-input", fieldErrors.lastName && "error")}
              />
            </div>
            {fieldErrors.lastName && (
              <p id="lastName-error" className="ax-error">
                <AlertCircle size={12} />
                {fieldErrors.lastName}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <div className="ax-field">
            <Mail aria-hidden size={16} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              placeholder="you@example.com"
              className={cn("auth-input", fieldErrors.email && "error")}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="ax-error">
              <AlertCircle size={12} />
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <div
            className="ax-field"
            onFocus={passwordFieldFocus("password")}
            onBlur={passwordFieldBlur}
          >
            <Lock aria-hidden size={16} />
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
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              placeholder="Create a strong password"
              className={cn("auth-input pr-10", fieldErrors.password && "error")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="ax-eye"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {fieldErrors.password && (
            <p id="password-error" className="ax-error">
              <AlertCircle size={12} />
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <div
            className="ax-field"
            onFocus={passwordFieldFocus("confirm")}
            onBlur={passwordFieldBlur}
          >
            <Lock aria-hidden size={16} />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
              placeholder="Repeat your password"
              className={cn("auth-input pr-10", fieldErrors.confirmPassword && "error")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              aria-pressed={showConfirm}
              className="ax-eye"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id="confirmPassword-error" className="ax-error">
              <AlertCircle size={12} />
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <details className="ax-optional" open={Boolean(fieldErrors.referredByCode) || undefined}>
          <summary>
            Add a photo or referral code <span>Optional</span>
          </summary>
          <div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <AvatarUpload onUpload={setAvatarUrl} onBusyChange={setPhotoBusy} disabled={submitting} />
            </div>

            <div>
              <label htmlFor="referredByCode">Referral code</label>
              <div className="ax-field">
                <Gift aria-hidden size={16} />
                <input
                  id="referredByCode"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={referredByCode}
                  onChange={(e) => { setReferredByCode(e.target.value); clearError("referredByCode"); }}
                  aria-invalid={Boolean(fieldErrors.referredByCode)}
                  aria-describedby={fieldErrors.referredByCode ? "referredByCode-error" : undefined}
                  placeholder="e.g. ALEX-2026"
                  className={cn("auth-input", fieldErrors.referredByCode && "error")}
                />
              </div>
              {fieldErrors.referredByCode && (
                <p id="referredByCode-error" className="ax-error">
                  <AlertCircle size={12} />
                  {fieldErrors.referredByCode}
                </p>
              )}
            </div>
          </div>
        </details>

        <div>
          <label className="ax-consent">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => { setAcceptTerms(e.target.checked); clearError("acceptTerms"); }}
              aria-invalid={Boolean(fieldErrors.acceptTerms)}
              aria-describedby={fieldErrors.acceptTerms ? "acceptTerms-error" : undefined}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          {fieldErrors.acceptTerms && (
            <p id="acceptTerms-error" className="ax-error">
              <AlertCircle size={12} />
              {fieldErrors.acceptTerms}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="ax-banner ax-banner-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting || photoBusy} className="ax-submit">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="ax-form-foot">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
      <p className="ax-assurance">
        <Check size={13} /> Free to start. No card required.
      </p>
    </AuthCard>
  );
}
