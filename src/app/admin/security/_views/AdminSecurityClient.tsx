"use client";

import { useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  IconLockSquare,
  IconRefresh,
  IconShieldLock,
  IconShieldOff,
  IconUserOff,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  type MfaCoverage,
  type SecuritySummary,
  useAdminSecurity,
  useBanUser,
  useUnbanUser,
} from "@/lib/hooks/useAdminSecurity";

const FALLBACK: SecuritySummary = {
  failedLogins24h: 0,
  failedLoginsTrend: [],
  suspiciousIps: [],
  mfa: { enabledCount: 0, disabledCount: 0, enforcedRoles: [] },
  bannedUsers: 0,
  activeAdmins: 0,
  highRiskSessions: 0,
};

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "danger" | "warning" | "ok";
}) {
  const toneClass =
    tone === "danger"
      ? "text-rose-600 dark:text-rose-300"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-300"
        : "text-foreground";
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </Card>
  );
}

function FailedLoginChart({ buckets }: { buckets: SecuritySummary["failedLoginsTrend"] }) {
  const max = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.count)),
    [buckets],
  );
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Failed logins (24h)</h3>
        <span className="text-muted-foreground text-xs">per hour</span>
      </div>
      {buckets.length === 0 ? (
        <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
          No data.
        </div>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {buckets.map((b) => (
            <div
              key={b.hour}
              className="bg-rose-500/40 hover:bg-rose-500/60 flex-1 rounded-t"
              style={{ height: `${(b.count / max) * 100}%` }}
              title={`${b.hour} → ${b.count}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function MfaCoverageCard({ mfa }: { mfa: MfaCoverage }) {
  const total = mfa.enabledCount + mfa.disabledCount;
  const pct = total === 0 ? 0 : Math.round((mfa.enabledCount / total) * 100);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="text-sm font-medium">MFA coverage</h3>
      <div className="flex items-center justify-between text-sm">
        <span>{pct}% of users</span>
        <span className="text-muted-foreground text-xs">
          {mfa.enabledCount.toLocaleString()} on / {mfa.disabledCount.toLocaleString()} off
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
      </div>
      {mfa.enforcedRoles.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {mfa.enforcedRoles.map((r) => (
            <Badge key={r} variant="secondary">
              {r} enforced
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">No role enforcement</span>
      )}
    </Card>
  );
}

export function AdminSecurityClient() {
  const { data, isLoading, refetch, isFetching } = useAdminSecurity();
  const summary = data ?? FALLBACK;

  const ban = useBanUser();
  const unban = useUnbanUser();

  const [confirmIpBan, setConfirmIpBan] = useState<{
    ip: string;
  } | null>(null);

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
          <p className="text-muted-foreground text-sm">
            Platform-wide auth health and risk signals.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <IconRefresh className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard
            label="Failed logins (24h)"
            value={summary.failedLogins24h}
            tone={summary.failedLogins24h > 50 ? "danger" : "ok"}
          />
          <MetricCard
            label="Suspicious IPs"
            value={summary.suspiciousIps.length}
            tone={summary.suspiciousIps.length > 0 ? "warning" : "ok"}
          />
          <MetricCard
            label="Banned users"
            value={summary.bannedUsers}
          />
          <MetricCard
            label="High-risk sessions"
            value={summary.highRiskSessions}
            tone={summary.highRiskSessions > 0 ? "warning" : "ok"}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <FailedLoginChart buckets={summary.failedLoginsTrend} />
        )}
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <MfaCoverageCard mfa={summary.mfa} />
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium">Suspicious IPs</h3>
            <span className="text-muted-foreground text-xs">
              Aggregated failed-login sources with country dispersion.
            </span>
          </div>
          <IconShieldLock className="text-muted-foreground size-4" />
        </div>
        {summary.suspiciousIps.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
            <IconShieldOff className="size-8" />
            Nothing flagged in the last 24 hours.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.suspiciousIps.map((row) => (
                <TableRow key={row.ip}>
                  <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                  <TableCell className="text-sm">{row.attempts}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {row.countries.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(row.lastSeen).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmIpBan({ ip: row.ip })}
                      >
                        <IconUserOff className="mr-1.5 size-4" />
                        Block IP
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <IconLockSquare className="size-5" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{summary.activeAdmins} active admin sessions</span>
          <span className="text-muted-foreground text-xs">
            Review active admins in the user directory and revoke any sessions you don't recognize.
          </span>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirmIpBan)}
        onOpenChange={(o) => {
          if (!o) setConfirmIpBan(null);
        }}
        title={`Block ${confirmIpBan?.ip ?? ""}?`}
        description="All requests from this IP will receive a 403 for the next 24 hours. Ban list rotates automatically."
        confirmLabel="Block IP"
        variant="destructive"
        onConfirm={async () => {
          if (!confirmIpBan) return;
          try {
            await ban.mutateAsync(confirmIpBan.ip);
            toast.success("IP blocked.");
            setConfirmIpBan(null);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed.");
          }
        }}
      />

      <Button
        variant="outline"
        size="sm"
        className="self-end"
        onClick={async () => {
          try {
            // example of unban path; admin would invoke via the user detail page normally
            await unban.mutateAsync("");
            toast.success("Reloaded.");
          } catch {
            /* noop */
          }
        }}
      >
        Trigger unban path
      </Button>
    </div>
  );
}