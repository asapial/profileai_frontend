"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { AuthCard, AuthBrandMark } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

function safeRedirect(raw: string | null) {
  return raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

export function TwoFactorSetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"checking" | "start" | "confirm">("checking");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(safeRedirect(params.get("redirect")))}`);
      } else if (user.twoFactorEnabled) {
        router.replace(`/login?redirect=${encodeURIComponent(safeRedirect(params.get("redirect")))}&reason=2fa`);
      } else {
        setStep("start");
      }
    });
  }, [params, router]);

  const sendCode = async () => {
    setBusy(true); setError(null);
    try {
      await api.post<null>("/auth/2fa/enable", {});
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a verification code.");
    } finally { setBusy(false); }
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return;
    setBusy(true); setError(null);
    try {
      await api.post<null>("/auth/2fa/confirm", { otp });
      router.replace(safeRedirect(params.get("redirect")));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The code could not be verified.");
    } finally { setBusy(false); }
  };

  return (
    <AuthCard>
      <AuthBrandMark />
      <div className="mb-5 inline-flex rounded-xl bg-violet-500/10 p-3 text-violet-600"><ShieldCheck className="size-6" /></div>
      <h1 className="text-2xl font-bold tracking-tight">Secure your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Add an extra verification step to protect your account. We’ll send a six-digit code to your account email.</p>
      {error ? <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {step === "checking" ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Checking your account…</div>
      ) : step === "start" ? (
        <Button className="mt-6 w-full" onClick={sendCode} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Send verification code</Button>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={confirm}>
          <div><label htmlFor="setup-otp" className="mb-1.5 block text-sm font-medium">Verification code</label><Input id="setup-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></div>
          <Button className="w-full" type="submit" disabled={busy || otp.length !== 6}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Enable 2FA and continue</Button>
        </form>
      )}
    </AuthCard>
  );
}
