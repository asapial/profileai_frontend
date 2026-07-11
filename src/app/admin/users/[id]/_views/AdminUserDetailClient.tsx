"use client";

// Admin User Detail (A-P4).
//
// One-stop view for support: summary header + Profile / Resumes /
// Billing / Sessions / Activity tabs. Impersonation and Delete actions
// sit in the header and are gated behind confirmation. While
// impersonation is active, a sticky banner persists across every page
// until "End Impersonation" is clicked.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconChartBar,
  IconCreditCard,
  IconDeviceDesktop,
  IconHistory,
  IconShield,
  IconSparkles,
  IconTrash,
  IconUserCircle,
  IconUserShield,
} from "@tabler/icons-react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  useAdminUserDetail,
  useDeleteAdminUser,
  useImpersonateAdminUser,
  useRevokeUserSession,
  type AdminUserDetail,
} from "@/lib/hooks/useAdminUserDetail";
import type { Role } from "@/types";

type Props = {
  userId: string;
};

type ImpersonationState = {
  token: string;
  expiresAt: string;
};

const IMPERSONATION_STORAGE_KEY = "admin_impersonation";

export function AdminUserDetailClient({ userId }: Props) {
  const router = useRouter();
  const query = useAdminUserDetail(userId);
  const [activeTab, setActiveTab] = useState("profile");
  const [confirm, setConfirm] = useState<
    | {
        title: string;
        description: React.ReactNode;
        confirmLabel: string;
        destructive?: boolean;
        run: () => Promise<void>;
      }
    | null
  >(null);

  const deleteMutation = useDeleteAdminUser(userId);

  if (query.isLoading && !query.data) {
    return <DetailSkeleton />;
  }

  if (query.error || !query.data) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/admin/users">
            <IconArrowLeft className="size-4" />
            Back to users
          </Link>
        </Button>
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Couldn&apos;t load this user. They may have been deleted, or your
          admin session expired.
        </Card>
      </div>
    );
  }

  const user = query.data;

  const onDelete = () => {
    setConfirm({
      title: "Delete this account?",
      description: (
        <>
          This is a permanent GDPR-style delete. The user&apos;s profile,
          resumes, sessions, and notifications are anonymised. Active
          subscriptions are NOT automatically cancelled.
          <br />
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </>
      ),
      confirmLabel: "Delete account",
      destructive: true,
      run: async () => {
        try {
          await deleteMutation.mutateAsync();
          toast.success("Account deleted.");
          router.push("/admin/users");
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Delete failed.");
          throw err;
        }
      },
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <IconArrowLeft className="size-4" />
            Back to users
          </Link>
        </Button>
        <SummaryActions
          user={user}
          onDelete={onDelete}
          deleting={deleteMutation.isPending}
        />
      </div>

      <SummaryHeader user={user} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col gap-4"
      >
        <TabsList className="w-full justify-start overflow-x-auto md:max-w-3xl">
          <TabsTrigger value="profile" className="gap-1.5">
            <IconUserCircle className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="resumes" className="gap-1.5">
            <IconChartBar className="size-4" /> Resumes
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <IconCreditCard className="size-4" /> Billing
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5">
            <IconDeviceDesktop className="size-4" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <IconHistory className="size-4" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="resumes">
          <ResumesTab user={user} />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab user={user} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab user={user} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab user={user} />
        </TabsContent>
      </Tabs>

      <AdminConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? null}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        destructive={confirm?.destructive}
        busy={deleteMutation.isPending}
        onConfirm={async () => {
          if (confirm) await confirm.run();
        }}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function SummaryHeader({ user }: { user: AdminUserDetail }) {
  return (
    <Card className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-base font-semibold text-violet-700 dark:text-violet-300">
          {(user.name ?? user.email).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">
              {user.name ?? user.email}
            </span>
            <RoleBadge role={user.role} />
            {!user.isActive ? (
              <Badge variant="destructive">Banned</Badge>
            ) : null}
            {user.emailVerified ? null : (
              <Badge variant="secondary">Unverified email</Badge>
            )}
            {user.twoFactorEnabled ? (
              <Badge variant="outline" className="gap-1 text-emerald-700">
                <IconShield className="size-3" /> 2FA
              </Badge>
            ) : null}
          </div>
          <span className="text-muted-foreground text-sm">{user.email}</span>
        </div>
      </div>
      <dl className="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:flex md:flex-col md:items-end md:gap-0.5">
        <div>
          <dt className="inline">Joined: </dt>
          <dd className="inline font-medium text-foreground">
            {new Date(user.createdAt).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="inline">Last login: </dt>
          <dd className="inline font-medium text-foreground">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString()
              : "Never"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return (
      <Badge variant="default" className="gap-1">
        <IconUserShield className="size-3" /> Admin
      </Badge>
    );
  }
  return <Badge variant="secondary">User</Badge>;
}

function SummaryActions({
  user,
  onDelete,
  deleting,
}: {
  user: AdminUserDetail;
  onDelete: () => void;
  deleting: boolean;
}) {
  const impersonate = useImpersonateAdminUser(user.id);
  const [, forceRerender] = useState(0);
  const [active, setActive] = useState<ImpersonationState | null>(null);
  const [expiresIn, setExpiresIn] = useState<string>("");

  // Read impersonation banner state from sessionStorage so it
  // persists across navigation; clear on expiry.
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(IMPERSONATION_STORAGE_KEY)
        : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ImpersonationState;
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          setActive(parsed);
        } else {
          window.sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        }
      } catch {
        // ignore malformed
      }
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const remaining = new Date(active.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        window.sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        setActive(null);
        forceRerender((n) => n + 1);
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setExpiresIn(`${m}m ${s}s`);
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const startImpersonation = async () => {
    try {
      const result = await impersonate.mutateAsync();
      window.sessionStorage.setItem(
        IMPERSONATION_STORAGE_KEY,
        JSON.stringify(result),
      );
      setActive(result);
      toast.success("Impersonation started. Banner is now visible on every page.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Impersonation failed.",
      );
    }
  };

  const endImpersonation = () => {
    window.sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    setActive(null);
    toast.success("Impersonation ended.");
  };

  const isOtherAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={startImpersonation}
        disabled={isOtherAdmin || impersonate.isPending}
        title={
          isOtherAdmin
            ? "Impersonating another admin is blocked."
            : "Start a time-limited impersonation session."
        }
      >
        <IconUserShield className="mr-1.5 size-4" />
        Impersonate
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        disabled={deleting}
      >
        <IconTrash className="mr-1.5 size-4" />
        Delete account
      </Button>

      {active ? (
        <Card className="flex items-center gap-2 border-amber-500/60 bg-amber-100/60 px-3 py-1.5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <IconAlertTriangle className="size-4" />
          <span className="text-xs font-medium">
            Impersonating {user.email} · expires in {expiresIn || "…"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-amber-900 dark:text-amber-200"
            onClick={endImpersonation}
          >
            End
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

function ProfileTab({ user }: { user: AdminUserDetail }) {
  const profile = user.profile;
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Email", value: user.email },
    {
      label: "Phone",
      value: profile?.phone ?? <EmptyValue />,
    },
    {
      label: "Location",
      value: profile?.location ?? <EmptyValue />,
    },
    {
      label: "Headline",
      value: profile?.headline ?? <EmptyValue />,
    },
    {
      label: "Limits",
      value: user.limits ? (
        <span className="text-sm">
          Resumes: {user.limits.resumeLimit ?? "—"} · AI calls:{" "}
          {user.limits.apiLimit ?? "—"}
          {user.limits.overrideByAdmin ? (
            <Badge variant="outline" className="ml-2 text-[10px]">
              Override
            </Badge>
          ) : null}
        </span>
      ) : (
        <EmptyValue />
      ),
    },
  ];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-muted-foreground text-sm">
          Personal details as supplied by the user. Editing from here is not
          supported — escalate to the user to make changes.
        </p>
      </div>
      <Separator />
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
              {r.label}
            </dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ResumesTab({ user }: { user: AdminUserDetail }) {
  const usage = user.usage;
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Resumes</h2>
          <p className="text-muted-foreground text-sm">
            Resume content is not editable from this page. Use the User
            Directory or jump straight to the resume viewer for individual
            inspection.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total resumes" value={usage.resumeCount} />
          <Stat label="AI calls this month" value={usage.aiCallsThisMonth} />
          <Stat label="Exports this month" value={usage.exportsThisMonth} />
        </div>
      </Card>
    </div>
  );
}

function BillingTab({ user }: { user: AdminUserDetail }) {
  const b = user.billing;
  const plan = user.plan;
  const totalMajor = (b.totalSpentMinor / 100).toFixed(2);
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Plan</h2>
          <p className="text-muted-foreground text-sm">
            Current plan and renewal state. Cancellation is handled via the
            subscription tab; refunds go through the invoice page.
          </p>
        </div>
        <Separator />
        {plan ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">{plan.name}</Badge>
            <span className="text-muted-foreground text-sm">
              {plan.interval === "month" ? "Monthly" : "Yearly"} · renews{" "}
              {plan.renewsAt
                ? new Date(plan.renewsAt).toLocaleDateString()
                : "—"}
            </span>
            {plan.cancelAtPeriodEnd ? (
              <Badge variant="destructive">Cancels at period end</Badge>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No active subscription — user is on the free tier.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Billing summary</h2>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Lifetime spend"
            value={`${totalMajor} ${b.currency.toUpperCase()}`}
          />
          <Stat label="Invoices" value={b.invoicesCount} />
          <Stat
            label="Auto-renews"
            value={b.subscriptionRenewsAt
              ? new Date(b.subscriptionRenewsAt).toLocaleDateString()
              : "—"}
          />
        </div>
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/invoices?user=${user.id}`}>
              <IconCreditCard className="mr-1.5 size-4" />
              Open invoices
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SessionsTab({ user }: { user: AdminUserDetail }) {
  const revoke = useRevokeUserSession(user.id);
  const [pending, setPending] = useState<string | null>(null);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Sessions</h2>
        <p className="text-muted-foreground text-sm">
          All active login sessions for this account. Revoking the current
          session signs the user out everywhere.
        </p>
      </div>
      <Separator />
      {user.sessions.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No active sessions.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {user.sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {s.deviceLabel ?? "Unknown device"}
                  {s.isCurrent ? (
                    <Badge variant="default" className="ml-2 text-[10px]">
                      This device
                    </Badge>
                  ) : null}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {s.ipAddress ?? "—"} · last active{" "}
                  {new Date(s.lastActiveAt).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={revoke.isPending && pending === s.id}
                onClick={async () => {
                  setPending(s.id);
                  try {
                    await revoke.mutateAsync(s.id);
                    toast.success("Session revoked.");
                  } catch (err: unknown) {
                    toast.error(
                      err instanceof Error ? err.message : "Failed.",
                    );
                  } finally {
                    setPending(null);
                  }
                }}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityTab({ user }: { user: AdminUserDetail }) {
  const recent = useMemo(() => user.activity.slice(0, 50), [user.activity]);
  if (recent.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center text-sm">
          No recent activity recorded for this user.
        </p>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Recent activity</h2>
        <p className="text-muted-foreground text-sm">
          Latest 50 user-driven events. For a full platform audit, see the{" "}
          <Link
            href={`/admin/audit-log?actor=${user.id}`}
            className="underline"
          >
            audit log
          </Link>
          .
        </p>
      </div>
      <Separator />
      <ul className="flex flex-col gap-2">
        {recent.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm"
          >
            <span className="font-medium">{a.action}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(a.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/60 p-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-muted-foreground text-sm">—</span>;
}

// Silence unused-import warning for `IconSparkles` when tree-shaken.
void IconSparkles;