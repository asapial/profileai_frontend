"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, type FormEvent } from "react";
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
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { GoogleButton } from "@/components/auth/GoogleButton";

import { api } from "@/lib/api";
import type { LoginResponse } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSafeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

async function syncFrontendSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/post-login", {
      method: "POST",
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const googleStarted = useRef(false);
  useEffect(() => {
    if (searchParams.get("google") !== "1" || googleStarted.current) return;
    googleStarted.current = true;
    void (async () => {
      try {
        const result = await api.post<LoginResponse>("/auth/google/session", {});
        if ("deviceLimitReached" in result) { setDeviceRecoveryToken(result.recoveryToken); return; }
        if (result.twoFactorRequired) { router.replace(`/login/2fa?email=${encodeURIComponent(result.email)}`); return; }
        if (!(await syncFrontendSession())) throw new Error("Could not secure the browser session. Please sign in again.");
        window.location.replace(postLoginRoute(result.user));
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
      const params = new URLSearchParams({ email: result.email });
      router.push(`/login/2fa?${params.toString()}`);
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

    if (!(await syncFrontendSession())) {
      await clearFailedLogin();
      setSubmitting(false);
      setError("Login succeeded, but the browser session could not be secured. Please try again.");
      triggerShake();
      return;
    }

    const intended = getSafeRedirect(searchParams.get("redirect"));
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

    if (!(await syncFrontendSession())) {
      await clearFailedLogin();
      setRecoveringDevices(false);
      setDeviceRecoveryToken(null);
      setError("Login succeeded, but the browser session could not be secured. Please try again.");
      return;
    }

    const intended = getSafeRedirect(searchParams.get("redirect"));
    router.push(intended ?? postLoginRoute(result.user));
    router.refresh();
  };

  return (
    <AuthCard>
      <AuthBrandMark />

      {/* Success banner */}
      {showSuccessBanner && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 p-4 text-sm text-emerald-300"
          style={{ background: "rgba(16,185,129,0.08)" }}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-200">
              {justVerified ? "Email verified" : "Password reset complete"}
            </p>
            <p className="text-emerald-300/80">
              {justVerified
                ? "Your email is confirmed. You can now log in to your account."
                : "Your password has been updated. Please sign in with your new password."}
            </p>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick up your drafts and plan your next move.
        </p>
      </header>

      {/* Google OAuth */}
      <div className="mt-6">
        <GoogleButton label="Sign in with Google" disabled={submitting} />
      </div>

      {/* Divider */}
      <div className="relative my-5 flex items-center gap-3">
        <div className="flex-1 border-t border-border/60" />
        <span className="text-xs font-medium text-muted-foreground">or sign in with email</span>
        <div className="flex-1 border-t border-border/60" />
      </div>

      <form
        noValidate
        onSubmit={onSubmit}
        key={shakeKey}
        className={cn("space-y-5", error && shakeKey > 0 && "animate-auth-shake")}
      >
        {/* Email */}
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
              className={cn(
                "auth-input",
                fieldErrors.email && "error"
              )}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
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
              className={cn(
                "auth-input pr-10",
                fieldErrors.password && "error"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Device limit banner */}
        {deviceRecoveryToken && (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          >
            <div className="flex items-start gap-2 text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Device limit reached</p>
                <p className="mt-1 text-amber-200/80">
                  You proved ownership of this account. To continue, sign out all existing devices and
                  keep only this device signed in.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={recoveringDevices}
              onClick={replaceExistingDevices}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-200 px-3 py-2 font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recoveringDevices && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign out existing devices and continue
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
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
              <span>Signing you in…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Log in</span>
              <ArrowRight className="h-4 w-4 opacity-70" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ProFile AI?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthCard>
  );
}
