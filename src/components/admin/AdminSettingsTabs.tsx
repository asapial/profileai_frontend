"use client";

// Tabbed platform settings shell (A-P8).
//
// Tabs:
// - General       : platform limits + maintenance (delegates to AdminSettingsForm)
// - Security      : MFA policy, password rules, session/IP lockout
// - Email         : sender identity + templates + test-send
// - Branding      : logo, primary color, support email, footer links
//
// Each non-General tab is currently a self-contained stub that hits its
// dedicated TanStack Query endpoint. If the endpoint is not yet live the
// panel surfaces a graceful empty state.

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconMail,
  IconPalette,
  IconShield,
  IconSliders,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { api, ApiError } from "@/lib/api";
import type { PlatformSetting } from "@/lib/hooks/useAdminSettings";

type Props = {
  initial?: PlatformSetting[];
};

type SecurityPolicy = {
  mfaRequiredForAdmins: boolean;
  passwordMinLength: number;
  requireMfa: boolean;
  failedLoginLockoutThreshold: number;
  failedLoginLockoutMinutes: number;
  allowListAdminIps: string[];
};

type EmailIdentity = {
  fromName: string;
  fromAddress: string;
  replyToAddress: string;
};

type BrandingProfile = {
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
  footerLinks: Array<{ label: string; href: string }>;
};

export function AdminSettingsTabs({ initial }: Props) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">
          <IconSliders className="mr-1.5 size-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security">
          <IconShield className="mr-1.5 size-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="email">
          <IconMail className="mr-1.5 size-4" />
          Email
        </TabsTrigger>
        <TabsTrigger value="branding">
          <IconPalette className="mr-1.5 size-4" />
          Branding
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-4">
        <AdminSettingsForm initial={initial} />
      </TabsContent>
      <TabsContent value="security" className="mt-4">
        <SecurityPanel />
      </TabsContent>
      <TabsContent value="email" className="mt-4">
        <EmailPanel />
      </TabsContent>
      <TabsContent value="branding" className="mt-4">
        <BrandingPanel />
      </TabsContent>
    </Tabs>
  );
}

function useGetOrFallback<T>(path: string, fallback: T) {
  const q = useQuery({
    queryKey: [path],
    queryFn: async () => {
      try {
        const r = await api.get<T>(path);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return fallback;
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
  return q.data ?? fallback;
}

function SecurityPanel() {
  const fallback: SecurityPolicy = {
    mfaRequiredForAdmins: true,
    passwordMinLength: 12,
    requireMfa: false,
    failedLoginLockoutThreshold: 8,
    failedLoginLockoutMinutes: 15,
    allowListAdminIps: [],
  };
  const data = useGetOrFallback<SecurityPolicy>(
    "/admin/settings/security",
    fallback,
  );

  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (next: Partial<SecurityPolicy>) =>
      api.put("/admin/settings/security", next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/admin/settings/security"] });
      toast.success("Security policy saved.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    },
  });

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Security policy</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Authentication thresholds for everyone and tighter rules for admin
        accounts.
      </p>
      <Separator className="my-4" />
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleRow
          label="MFA required for admins"
          description="Force second-factor setup before an admin can manage users or settings."
          value={data.mfaRequiredForAdmins}
          onChange={(v) => update.mutate({ mfaRequiredForAdmins: v })}
        />
        <ToggleRow
          label="MFA required for all users"
          description="Encourage every user to enroll. Strongly recommended."
          value={data.requireMfa}
          onChange={(v) => update.mutate({ requireMfa: v })}
        />
        <NumberRow
          label="Password minimum length"
          suffix="characters"
          min={8}
          max={128}
          value={data.passwordMinLength}
          onChange={(n) => update.mutate({ passwordMinLength: n })}
        />
        <NumberRow
          label="Failed-login lockout threshold"
          suffix="attempts"
          min={1}
          max={50}
          value={data.failedLoginLockoutThreshold}
          onChange={(n) => update.mutate({ failedLoginLockoutThreshold: n })}
        />
        <NumberRow
          label="Lockout duration"
          suffix="minutes"
          min={1}
          max={1440}
          value={data.failedLoginLockoutMinutes}
          onChange={(n) => update.mutate({ failedLoginLockoutMinutes: n })}
        />
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="allowlist">Admin IP allow-list</Label>
          <Input
            id="allowlist"
            value={data.allowListAdminIps.join(", ")}
            onChange={(e) =>
              update.mutate({
                allowListAdminIps: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="203.0.113.4, 198.51.100.0/24"
          />
          <p className="text-muted-foreground text-xs">
            Comma-separated CIDRs. Leave empty to allow any IP.
          </p>
        </div>
      </div>
    </Card>
  );
}

function EmailPanel() {
  const fallback: EmailIdentity = {
    fromName: "ProfileAI",
    fromAddress: "no-reply@profileai.app",
    replyToAddress: "support@profileai.app",
  };
  const data = useGetOrFallback<EmailIdentity>(
    "/admin/settings/email",
    fallback,
  );

  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (next: EmailIdentity) =>
      api.put("/admin/settings/email", next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/admin/settings/email"] });
      toast.success("Email identity saved.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="text-base font-semibold">Sender identity</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Used for transactional mail: signup, password resets, billing receipts.
        </p>
        <Separator className="my-4" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from-name">From name</Label>
            <Input
              id="from-name"
              value={data.fromName}
              onChange={(e) =>
                update.mutate({ ...data, fromName: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="from-address">From address</Label>
            <Input
              id="from-address"
              type="email"
              value={data.fromAddress}
              onChange={(e) =>
                update.mutate({ ...data, fromAddress: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="reply-to">Reply-to</Label>
            <Input
              id="reply-to"
              type="email"
              value={data.replyToAddress}
              onChange={(e) =>
                update.mutate({ ...data, replyToAddress: e.target.value })
              }
            />
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Test send</h2>
            <p className="text-muted-foreground text-sm">
              Send yourself a sample transactional email to validate DNS / SPF.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={update.isPending}
            onClick={async () => {
              try {
                await api.post("/admin/settings/email/test-send", {});
                toast.success("Test email queued.");
              } catch (err: unknown) {
                if (err instanceof ApiError && err.status === 404) {
                  toast.error(
                    "Test-send endpoint isn't wired in the backend yet.",
                  );
                  return;
                }
                toast.error(
                  err instanceof Error ? err.message : "Send failed.",
                );
              }
            }}
          >
            Send test
          </Button>
        </div>
      </Card>
    </div>
  );
}

function BrandingPanel() {
  const fallback: BrandingProfile = {
    logoUrl: null,
    primaryColor: "#1F4E79",
    supportEmail: "support@profileai.app",
    footerLinks: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  };
  const data = useGetOrFallback<BrandingProfile>(
    "/admin/settings/branding",
    fallback,
  );
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (next: BrandingProfile) =>
      api.put("/admin/settings/branding", next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/admin/settings/branding"] });
      toast.success("Branding saved.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    },
  });

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Branding</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Visible across the user-facing app and emails.
      </p>
      <Separator className="my-4" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="logo">Logo URL</Label>
          <Input
            id="logo"
            value={data.logoUrl ?? ""}
            onChange={(e) =>
              update.mutate({ ...data, logoUrl: e.target.value || null })
            }
            placeholder="https://"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="primary">Primary color</Label>
          <div className="flex items-center gap-2">
            <input
              id="primary"
              type="color"
              value={data.primaryColor}
              onChange={(e) =>
                update.mutate({ ...data, primaryColor: e.target.value })
              }
              className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
            />
            <Input
              value={data.primaryColor}
              onChange={(e) =>
                update.mutate({ ...data, primaryColor: e.target.value })
              }
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="support">Support email</Label>
          <Input
            id="support"
            type="email"
            value={data.supportEmail}
            onChange={(e) =>
              update.mutate({ ...data, supportEmail: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="footer">Footer links (JSON)</Label>
          <Input
            id="footer"
            value={JSON.stringify(data.footerLinks, null, 0)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed)) {
                  update.mutate({ ...data, footerLinks: parsed });
                }
              } catch {
                /* editing — ignore partial JSON */
              }
            }}
          />
          <p className="text-muted-foreground text-xs">
            Array of {"{ label, href }"} pairs.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <button
        type="button"
        aria-pressed={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function NumberRow({
  label,
  suffix,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="max-w-[140px]"
        />
        {suffix ? (
          <span className="text-muted-foreground text-xs">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
