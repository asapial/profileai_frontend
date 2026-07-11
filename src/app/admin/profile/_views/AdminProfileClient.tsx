"use client";

// Admin Profile — Personal / Security / Devices tabs.
//
// All mutations invalidate the relevant `admin-profile` query keys so
// the corresponding tab refreshes without a full route transition.
// Device and session revoke use optimistic removal with rollback on
// failure (see `AdminRevokeDialog` below).

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconKey,
  IconLogout,
  IconShield,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useAdminDevices,
  useAdminProfile,
  useAdminSessions,
  useChangeAdminPassword,
  useRevokeAdminDevice,
  useRevokeAdminSession,
  useRevokeAllAdminSessions,
  useToggleAdminTwoFactor,
  useTrustAdminDevice,
  useUpdateAdminProfile,
  type AdminDevice,
  type AdminSession,
} from "@/lib/hooks/useAdminProfile";

export function AdminProfileClient() {
  const profile = useAdminProfile();
  const [tab, setTab] = useState("personal");

  if (profile.isLoading && !profile.data) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (profile.error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive lg:px-6">
        Couldn&apos;t load your admin profile. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <ProfileHeader
        email={profile.data?.email ?? ""}
        name={profile.data?.name ?? null}
        twoFactorEnabled={Boolean(profile.data?.twoFactorEnabled)}
      />

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
        <TabsList className="w-full justify-start overflow-x-auto md:max-w-2xl">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Sessions &amp; devices</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalTab
            firstName={profile.data?.profile?.firstName ?? ""}
            lastName={profile.data?.profile?.lastName ?? ""}
            phone={profile.data?.profile?.phone ?? ""}
            email={profile.data?.email ?? ""}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab twoFactorEnabled={Boolean(profile.data?.twoFactorEnabled)} />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileHeader({
  email,
  name,
  twoFactorEnabled,
}: {
  email: string;
  name: string | null;
  twoFactorEnabled: boolean;
}) {
  return (
    <Card className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-base font-semibold text-violet-700 dark:text-violet-300">
          {(name ?? email).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold">
            {name ?? "Admin account"}
          </span>
          <span className="text-muted-foreground text-sm">{email}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" className="gap-1">
          <IconShield className="h-3 w-3" />
          Admin
        </Badge>
        {twoFactorEnabled ? (
          <Badge variant="outline" className="gap-1 text-emerald-700">
            <IconCheck className="h-3 w-3" /> 2FA on
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <IconAlertTriangle className="h-3 w-3" /> 2FA off
          </Badge>
        )}
      </div>
    </Card>
  );
}

function PersonalTab({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const update = useUpdateAdminProfile();
  const [values, setValues] = useState({ firstName, lastName, phone });

  const dirty =
    values.firstName !== firstName ||
    values.lastName !== lastName ||
    values.phone !== phone;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Personal details</h2>
        <p className="text-muted-foreground text-sm">
          This information appears in audit log entries and review notes.
        </p>
      </div>
      <Separator />
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await update.mutateAsync({
              firstName: values.firstName,
              lastName: values.lastName,
              phone: values.phone,
            });
            toast.success("Profile updated.");
          } catch (err: unknown) {
            const msg =
              err instanceof Error ? err.message : "Could not save.";
            toast.error(msg);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={values.firstName}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, firstName: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={values.lastName}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, lastName: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={values.phone}
            placeholder="Optional"
            onChange={(e) =>
              setValues((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} readOnly className="bg-muted/40" />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save personal details"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SecurityTab({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const changePassword = useChangeAdminPassword();
  const toggle = useToggleAdminTwoFactor();

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<{
    title: string;
    description: React.ReactNode;
    onConfirm: () => Promise<unknown>;
  } | null>(null);

  const pwValid =
    passwords.next.length >= 12 &&
    passwords.next === passwords.confirm &&
    passwords.current.length > 0;

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pwValid) return;
    try {
      const result = await changePassword.mutateAsync({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success(
        result.revokedOtherSessions > 0
          ? `Password changed. ${result.revokedOtherSessions} other session(s) signed out.`
          : "Password changed.",
      );
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Change failed.");
    }
  }

  function attemptToggle2FA() {
    setShowRevokeConfirm({
      title: twoFactorEnabled ? "Disable 2FA?" : "Enable 2FA",
      description: twoFactorEnabled ? (
        <>
          Admin 2FA enforcement is normally platform-wide. Disabling it on
          your own account is allowed, but your security posture will be
          weaker than your peers.
        </>
      ) : (
        <>
          You&apos;ll need an authenticator app. Scan the QR shown on the
          next screen and confirm with a 6-digit code.
        </>
      ),
      confirmLabel: twoFactorEnabled ? "Disable 2FA" : "Enable 2FA",
      destructive: twoFactorEnabled,
      onConfirm: async () => {
        try {
          await toggle.mutateAsync({ enabled: !twoFactorEnabled });
          toast.success(
            twoFactorEnabled ? "2FA disabled." : "2FA enabled.",
          );
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed.");
          throw err;
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Password</h2>
          <p className="text-muted-foreground text-sm">
            Changing your password signs out every other active session.
          </p>
        </div>
        <Separator />
        <form
          onSubmit={submitPassword}
          className="grid gap-3 md:grid-cols-3"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, current: e.target.value }))
              }
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.next}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, next: e.target.value }))
              }
              autoComplete="new-password"
              aria-invalid={
                passwords.next.length > 0 && passwords.next.length < 12
              }
            />
            <span className="text-muted-foreground text-xs">
              Minimum 12 characters.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              autoComplete="new-password"
              aria-invalid={
                passwords.confirm.length > 0 && passwords.next !== passwords.confirm
              }
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button
              type="submit"
              disabled={!pwValid || changePassword.isPending}
              className="gap-2"
            >
              <IconKey className="size-4" />
              {changePassword.isPending ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Two-factor authentication</h2>
          <p className="text-muted-foreground text-sm">
            {twoFactorEnabled
              ? "2FA is active on this account. Disable only if you must."
              : "Enable 2FA to add a second verification step on every login."}
          </p>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <Badge variant={twoFactorEnabled ? "default" : "destructive"}>
            {twoFactorEnabled ? "Active" : "Not configured"}
          </Badge>
          <Button
            variant={twoFactorEnabled ? "destructive" : "default"}
            disabled={toggle.isPending}
            onClick={attemptToggle2FA}
            className="gap-2"
          >
            <IconShield className="size-4" />
            {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </Button>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(showRevokeConfirm)}
        onOpenChange={(o) => {
          if (!o) setShowRevokeConfirm(null);
        }}
        title={showRevokeConfirm?.title ?? ""}
        description={showRevokeConfirm?.description ?? null}
        confirmLabel={showRevokeConfirm?.confirmLabel ?? "Confirm"}
        destructive={showRevokeConfirm?.title?.startsWith("Disable")}
        busy={toggle.isPending}
        onConfirm={async () => {
          if (showRevokeConfirm) {
            await showRevokeConfirm.onConfirm();
          }
        }}
      />
    </div>
  );
}

function DevicesTab() {
  const sessions = useAdminSessions();
  const devices = useAdminDevices();
  const revokeSession = useRevokeAdminSession();
  const revokeDevice = useRevokeAdminDevice();
  const trustDevice = useTrustAdminDevice();
  const revokeAllSessions = useRevokeAllAdminSessions();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<unknown>;
  } | null>(null);

  function attemptRevokeSession(session: AdminSession) {
    setConfirmAction({
      title: session.isCurrent ? "Sign out this device?" : "Revoke session?",
      description: session.isCurrent ? (
        <>
          You&apos;ll be signed out immediately and have to re-authenticate
          (including 2FA if enabled) to come back in.
        </>
      ) : (
        <>
          <span className="text-muted-foreground text-xs">
            {session.deviceLabel ?? "Unknown device"} ·{" "}
            {session.ipAddress ?? "—"}
          </span>
        </>
      ),
      confirmLabel: session.isCurrent ? "Sign out" : "Revoke",
      destructive: true,
      onConfirm: async () => {
        try {
          await revokeSession.mutateAsync(session.id);
          toast.success("Session revoked.");
          if (session.isCurrent) {
            window.location.href = "/login";
          }
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed.");
          throw err;
        }
      },
    });
  }

  function attemptRevokeDevice(device: AdminDevice) {
    setConfirmAction({
      title: "Revoke device?",
      description: (
        <span className="text-muted-foreground text-xs">
          {device.deviceLabel ?? "Unknown device"} · {device.location ?? "—"}
        </span>
      ),
      confirmLabel: "Revoke device",
      destructive: true,
      onConfirm: async () => {
        try {
          await revokeDevice.mutateAsync(device.id);
          toast.success("Device revoked.");
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed.");
          throw err;
        }
      },
    });
  }

  function attemptRevokeAll() {
    setConfirmAction({
      title: "Sign out everywhere?",
      description:
        "All other sessions will be terminated. This device will remain signed in.",
      confirmLabel: "Sign out other sessions",
      destructive: true,
      onConfirm: async () => {
        try {
          const result = await revokeAllSessions.mutateAsync();
          toast.success(`Revoked ${result.revoked} session(s).`);
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed.");
          throw err;
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Active sessions</h2>
            <p className="text-muted-foreground text-sm">
              Where you&apos;re currently signed in. Revoke any session that
              doesn&apos;t look like yours.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={attemptRevokeAll}
            disabled={revokeAllSessions.isPending}
          >
            <IconLogout className="size-4" />
            Sign out everywhere
          </Button>
        </div>
        <Separator />
        {sessions.isLoading && !sessions.data ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !sessions.data || sessions.data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No active sessions found.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.data.map((s) => (
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
                  onClick={() => attemptRevokeSession(s)}
                  disabled={revokeSession.isPending}
                >
                  <IconTrash className="size-4" />
                  {s.isCurrent ? "Sign out" : "Revoke"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Trusted devices</h2>
          <p className="text-muted-foreground text-sm">
            Devices that remember you across logins. Revoke if a device was
            lost or sold.
          </p>
        </div>
        <Separator />
        {devices.isLoading && !devices.data ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !devices.data || devices.data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No saved devices.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {devices.data.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {d.deviceLabel ?? "Unknown device"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {d.location ?? "—"} · last login{" "}
                    {new Date(d.lastLoginAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={d.isTrusted ? "default" : "outline"}
                    onClick={() =>
                      trustDevice.mutate({
                        id: d.id,
                        trusted: !d.isTrusted,
                      })
                    }
                    disabled={trustDevice.isPending}
                  >
                    {d.isTrusted ? "Trusted" : "Trust"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => attemptRevokeDevice(d)}
                    disabled={revokeDevice.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <IconCopy className="mt-0.5 size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            Every device and session action writes an entry to the audit
            log with your admin ID, target device, and timestamp.
          </p>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? null}
        confirmLabel={confirmAction?.confirmLabel ?? "Confirm"}
        destructive={confirmAction?.destructive}
        busy={
          revokeSession.isPending ||
          revokeDevice.isPending ||
          revokeAllSessions.isPending
        }
        onConfirm={async () => {
          if (confirmAction) await confirmAction.onConfirm();
        }}
      />
    </div>
  );
}
