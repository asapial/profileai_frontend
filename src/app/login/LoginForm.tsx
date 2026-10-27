"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  completeDeviceRecovery,
  login,
  logout as clearFailedLogin,
  postLoginRoute,
  syncFrontendSession,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useAuthMascot } from "@/components/auth/AuthMascotContext";

import { api } from "@/lib/api";
import type { LoginResponse } from "@/types";
import { safeRedirectPath, twoFactorLoginPath } from "@/lib/auth-redirect";
import { useClientSearchParams } from "@/lib/hooks/useClientSearchParams";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useClientSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";
  const showSuccessBanner = justVerified || justReset;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(searchParams.get("google") === "1");
  const [recoveringDevices, setRecoveringDevices] = useState(false);
  const [deviceRecoveryToken, setDeviceRecoveryToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(searchParams.get("oauth_error") ? "Google sign-in was cancelled or unsuccessful. Please try again." : null);
  const [shakeKey, setShakeKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [passwordActive, setPasswordActive] = useState(false);

  const { setPasswordState } = useAuthMascot();

  useEffect(() => {
    setPasswordState(passwordActive, showPassword);
  }, [passwordActive, showPassword, setPasswordState]);

  useEffect(
    () => () => setPasswordState(false, false),
    [setPasswordState],
  );

  const googleStarted = useRef(false);
  useEffect(() => {
    if (searchParams.get("google") !== "1" || googleStarted.current) return;
    googleStarted.current = true;
    void (async () => {
      try {
        const result = await api.post<LoginResponse>("/auth/google/session", {});
        if ("deviceLimitReached" in result) { setDeviceRecoveryToken(result.recoveryToken); return; }
        if (result.twoFactorRequired) { router.replace(twoFactorLoginPath(result.email, searchParams.get("redirect"))); return; }
        if (!(await syncFrontendSession(result.accessToken))) throw new Error("Could not secure the browser session. Please sign in again.");
        window.location.replace(safeRedirectPath(searchParams.get("redirect")) ?? postLoginRoute(result.user));
      } catch (e) { setError(e instanceof Error ? e.message : "Google sign-in failed."); }
      finally { setSubmitting(false); }
    })();
  }, [searchParams, router]);

  const validate = (): boolean => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const triggerShake = () => setShakeKey((k) => k + 1);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDeviceRecoveryToken(null);
    if (!validate()) { triggerShake(); return; }

    setSubmitting(true);
    const result = await login({
      email: email.trim().toLowerCase(),
      password,
    });

    if (result.kind === "2fa") {
      router.push(twoFactorLoginPath(result.email, searchParams.get("redirect")));
      return;
    }
    if (result.kind === "device-limit") {
      setSubmitting(false);
      setDeviceRecoveryToken(result.recoveryToken);
      return;
    }
    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      triggerShake();
      return;
    }

    if (!(await syncFrontendSession(result.accessToken))) {
      await clearFailedLogin();
      setSubmitting(false);
      setError("Login succeeded, but the browser session could not be secured. Please try again.");
      triggerShake();
      return;
    }

    const intended = safeRedirectPath(searchParams.get("redirect"));
    const destination = intended ?? postLoginRoute(result.user);
    router.push(destination);
    router.refresh();
  };

  const replaceExistingDevices = async () => {
    if (!deviceRecoveryToken || recoveringDevices) return;
    setError(null);
    setRecoveringDevices(true);

    const result = await completeDeviceRecovery(deviceRecoveryToken);
    if (result.kind === "error") {
      setRecoveringDevices(false);
      setDeviceRecoveryToken(null);
      setError(result.message);
      return;
    }

    if (!(await syncFrontendSession(result.accessToken))) {
      await clearFailedLogin();
      setRecoveringDevices(false);
      setDeviceRecoveryToken(null);
      setError("Login succeeded, but the browser session could not be secured. Please try again.");
      return;
    }

    const intended = safeRedirectPath(searchParams.get("redirect"));
    router.push(intended ?? postLoginRoute(result.user));
    router.refresh();
  };

  return (
    <AuthCard>
      <AuthBrandMark note="Sign in" />

      {showSuccessBanner && (
        <div role="status" className="ax-banner ax-banner-success" style={{ marginBottom: 20 }}>
          <CheckCircle2 size={16} />
          <div>
            <p style={{ fontWeight: 650 }}>
              {justVerified ? "Email verified" : "Password reset complete"}
            </p>
            <p style={{ opacity: 0.85 }}>
              {justVerified
                ? "Your email is confirmed. You can now log in to your account."
                : "Your password has been updated. Please sign in with your new password."}
            </p>
          </div>
        </div>
      )}

      <header>
        <h1>Welcome back</h1>
        <p>Pick up your drafts and plan your next move.</p>
      </header>

      <div style={{ marginTop: 24 }}>
        <GoogleButton label="Sign in with Google" disabled={submitting} />
      </div>

      <div className="ax-rule">or sign in with email</div>

      <form
        noValidate
        onSubmit={onSubmit}
        key={shakeKey}
        className={cn("ax-form", error && shakeKey > 0 && "animate-auth-shake")}
      >
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
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
          <div className="ax-label-row">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
          <div
            className="ax-field"
            onFocus={() => setPasswordActive(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setPasswordActive(false);
              }
            }}
          >
            <Lock aria-hidden size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              placeholder="••••••••"
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
          {fieldErrors.password && (
            <p id="password-error" className="ax-error">
              <AlertCircle size={12} />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {deviceRecoveryToken && (
          <div role="alert" className="ax-banner ax-banner-warn">
            <AlertCircle size={16} />
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <p style={{ fontWeight: 650 }}>Device limit reached</p>
                <p style={{ marginTop: 4, opacity: 0.9 }}>
                  You proved ownership of this account. To continue, sign out all existing devices
                  and keep only this device signed in.
                </p>
              </div>
              <button
                type="button"
                disabled={recoveringDevices}
                onClick={replaceExistingDevices}
                className="ax-submit"
                style={{ minHeight: 40, boxShadow: "none" }}
              >
                {recoveringDevices && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign out existing devices and continue
              </button>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="ax-banner ax-banner-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting} className="ax-submit">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing you in…</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Log in</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="ax-form-foot">
        New to ProfileAI?{" "}
        <Link href="/register">Create a free account</Link>
      </p>
      <p className="ax-assurance">
        <ShieldCheck size={13} /> Your workspace. Your control.
      </p>
    </AuthCard>
  );
}
