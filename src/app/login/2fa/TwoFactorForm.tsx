"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  completeDeviceRecovery,
  logout as clearFailedLogin,
  postLoginRoute,
  verifyTwoFactor,
} from "@/lib/auth";
import { OtpInput } from "@/components/auth/OtpInput";
import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function getSafeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

async function syncFrontendSession(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/post-login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function TwoFactorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get("email") ?? "";

  const [otpValue, setOtpValue] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveringDevices, setRecoveringDevices] = useState(false);
  const [deviceRecoveryToken, setDeviceRecoveryToken] = useState<string | null>(null);
  const email = emailParam;
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!emailParam) router.replace("/login");
  }, [emailParam, router]);

  const maskedEmail = email
    ? (() => {
        const [user, domain] = email.split("@");
        if (!user || !domain) return email;
        const visible = user.slice(0, 2);
        return `${visible}${"•".repeat(Math.max(user.length - 2, 1))}@${domain}`;
      })()
    : "";

  const isComplete = otpValue.length === 6;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await verifyTwoFactor({ email: email.trim(), otp: otpValue });
    if (result.kind === "device-limit") {
      setSubmitting(false);
      setDeviceRecoveryToken(result.recoveryToken);
      return;
    }
    if (result.kind === "error") {
      setSubmitting(false);
      setError(result.message);
      setOtpKey((k) => k + 1);
      setOtpValue("");
      return;
    }

    if (!(await syncFrontendSession(result.accessToken))) {
      await clearFailedLogin();
      setSubmitting(false);
      setError("Verification succeeded, but the browser session could not be secured. Please log in again.");
      return;
    }

    const intended = getSafeRedirect(params.get("redirect"));
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
      setError("Verification succeeded, but the browser session could not be secured. Please log in again.");
      return;
    }

    const intended = getSafeRedirect(params.get("redirect"));
    router.push(intended ?? postLoginRoute(result.user));
    router.refresh();
  };

  const handleResend = async () => {
    if (resending || !email.trim()) return;
    setResending(true);
    setResendMsg(null);
    try {
      await api.post("/auth/otp/resend", { email: email.trim(), type: "TWO_FACTOR" });
      setResendMsg("A new code has been sent to your email.");
      setOtpKey((k) => k + 1);
      setOtpValue("");
    } catch {
      setResendMsg("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard>
      <AuthBrandMark />

      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 animate-auth-shield-pulse text-primary" />
          Two-factor verification
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Enter your 6-digit code</h1>
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
                  Verification succeeded. Sign out all existing devices to keep only this device
                  signed in.
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
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              "Resend code"
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
