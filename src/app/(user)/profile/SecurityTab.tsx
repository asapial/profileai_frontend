"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  KeyRound,
  LogOut,
  Monitor,
  Shield,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useChangePassword,
  useLoginDevices,
  useRevokeDevice,
  useRevokeSession,
  useSessions,
  useToggleTwoFactor,
  useTrustDevice,
} from "@/lib/hooks/useSecurity";
import { api } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <PasswordSection />
      <TwoFactorSection />
      <SessionsSection />
      <DevicesSection />
    </div>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const mut = useChangePassword();

  const submit = () => {
    if (form.next !== form.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (form.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    mut.mutate(
      { currentPassword: form.current, newPassword: form.next },
      {
        onSuccess: () => {
          toast.success("Password updated");
          setForm({ current: "", next: "", confirm: "" });
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Failed to change password"),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-violet-500" />
          Change password
        </CardTitle>
        <CardDescription>
          Use at least 8 characters. We&apos;ll log you out everywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          label="Current password"
          type="password"
          value={form.current}
          onChange={(v) => setForm((f) => ({ ...f, current: v }))}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="New password"
            type="password"
            value={form.next}
            onChange={(v) => setForm((f) => ({ ...f, next: v }))}
          />
          <Input
            label="Confirm"
            type="password"
            value={form.confirm}
            onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
          />
        </div>
        <Button
          onClick={submit}
          disabled={mut.isPending}
          className="gap-2"
        >
          <KeyRound className="h-4 w-4" />
          {mut.isPending ? "Updating…" : "Update password"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TwoFactorSection() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const mut = useToggleTwoFactor();

  useEffect(() => {
    api
      .get<{ user: CurrentUser }>("/auth/me")
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, []);

  const enabled = Boolean(me?.twoFactorEnabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-violet-500" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Add a one-time code at sign-in to protect your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant={enabled ? "outline" : "default"}
          onClick={() => mut.mutate(!enabled)}
          disabled={mut.isPending}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          {enabled ? "Disable 2FA" : "Enable 2FA"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionsSection() {
  const { data, isLoading } = useSessions();
  const revoke = useRevokeSession();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-violet-500" />
          Active sessions
        </CardTitle>
        <CardDescription>
          Sign out of devices you no longer use.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {s.deviceLabel ?? s.userAgent ?? "Unknown device"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.ipAddress ?? "—"}
                  </p>
                </div>
                {s.isCurrent ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                    Current
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revoke.mutate(s.id)}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DevicesSection() {
  const { data, isLoading } = useLoginDevices();
  const trust = useTrustDevice();
  const revoke = useRevokeDevice();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-violet-500" />
          Trusted devices
        </CardTitle>
        <CardDescription>
          Manage devices that can skip extra verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trusted devices.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {d.deviceLabel ?? "Unknown device"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.location ?? d.ipAddress ?? "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => trust.mutate(d.id)}
                    disabled={d.isTrusted}
                  >
                    {d.isTrusted ? "Trusted" : "Trust"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke.mutate(d.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
    </div>
  );
}