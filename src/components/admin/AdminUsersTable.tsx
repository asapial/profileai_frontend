"use client";

// User directory table.
//
// Renders the admin/users page on the client: search + filters +
// pagination + per-row actions. The page passes the initial server
// payload so we don't flash an empty state on first paint.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconKey,
  IconMail,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShieldOff,
  IconShield,
  IconTrash,
  IconUserCheck,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminEditLimitsDrawer } from "@/components/admin/AdminEditLimitsDrawer";
import {
  useAdminUsers,
  useBulkUserAction,
  useChangeUserRole,
  useDeleteUser,
  useForceResetUser,
  useToggleUserStatus,
  useVerifyUserEmail,
  type AdminUserFilters,
  type AdminUserListItem,
  type AdminUserListResponse,
} from "@/lib/hooks/useAdminUsers";

const PAGE_SIZE = 20;

type Props = {
  initial?: AdminUserListResponse;
};

export function AdminUsersTable({ initial }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<AdminUserFilters["role"]>("all");
  const [status, setStatus] = useState<AdminUserFilters["status"]>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isFirstSearchRender = React.useRef(true);
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (isFirstSearchRender.current) {
        isFirstSearchRender.current = false;
        return;
      }
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // When filters change we want to reset pagination + selection. The
  // lint rule discourages setState in effects, so we do it in the
  // event handlers instead. Search changes are handled by the
  // debounce effect below (which also resets pagination when the
  // debounced value updates from a user-driven search).
  const resetPagination = () => {
    setPage(1);
    setSelected(new Set());
  };
  const onRoleChange = (v: AdminUserFilters["role"]) => {
    setRole(v);
    resetPagination();
  };
  const onStatusChange = (v: AdminUserFilters["status"]) => {
    setStatus(v);
    resetPagination();
  };
  const onSearchChange = (v: string) => {
    setSearch(v);
    resetPagination();
  };

  const filters: AdminUserFilters = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role,
    status,
  };

  const query = useAdminUsers(filters);
  const data = query.data ?? initial;

  const [limitsTarget, setLimitsTarget] = useState<AdminUserListItem | null>(
    null,
  );
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

  const toggleStatus = useToggleUserStatus();
  const verify = useVerifyUserEmail();
  const changeRole = useChangeUserRole();
  const forceReset = useForceResetUser();
  const remove = useDeleteUser();
  const bulk = useBulkUserAction();

  const runMutation = async (
    label: string,
    run: () => Promise<unknown>,
    onErrorMsg?: string,
  ) => {
    try {
      await run();
      toast.success(label);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : onErrorMsg ?? "Action failed.";
      toast.error(msg);
    }
  };

  const onToggleStatus = (u: AdminUserListItem) => {
    setConfirm({
      title: u.isActive ? "Ban user" : "Reactivate user",
      description: (
        <>
          {u.isActive
            ? "The user will be signed out and unable to log in until reactivated."
            : "The user will regain the ability to sign in."}
          <br />
          <span className="text-muted-foreground text-xs">{u.email}</span>
        </>
      ),
      confirmLabel: u.isActive ? "Ban user" : "Reactivate",
      destructive: u.isActive,
      run: () =>
        toggleStatus
          .mutateAsync({ id: u.id, isActive: !u.isActive })
          .then(() => undefined),
    });
  };

  const onVerify = (u: AdminUserListItem) => {
    setConfirm({
      title: "Mark email as verified",
      description: (
        <>
          Use this if the user can&apos;t verify through email. They
          will gain access to gated features immediately.
          <br />
          <span className="text-muted-foreground text-xs">{u.email}</span>
        </>
      ),
      confirmLabel: "Verify email",
      run: () => verify.mutateAsync({ id: u.id }).then(() => undefined),
    });
  };

  const onPromote = (u: AdminUserListItem) => {
    const next = u.role === "ADMIN" ? "USER" : "ADMIN";
    setConfirm({
      title: next === "ADMIN" ? "Promote to admin" : "Demote to user",
      description: (
        <>
          {next === "ADMIN"
            ? "Admin role grants full access to this console, billing controls, and audit log."
            : "Demoting removes access to admin tooling immediately."}
          <br />
          <span className="text-muted-foreground text-xs">{u.email}</span>
        </>
      ),
      confirmLabel: next === "ADMIN" ? "Promote" : "Demote",
      destructive: next === "USER",
      run: () =>
        changeRole
          .mutateAsync({ id: u.id, role: next })
          .then(() => undefined),
    });
  };

  const onForceReset = (u: AdminUserListItem) => {
    setConfirm({
      title: "Force password reset",
      description: (
        <>
          We&apos;ll email the user a one-time reset link. The current
          password will continue to work until they reset it.
          <br />
          <span className="text-muted-foreground text-xs">{u.email}</span>
        </>
      ),
      confirmLabel: "Send reset email",
      run: async () => {
        await runMutation("Reset email sent.", () =>
          forceReset.mutateAsync({ id: u.id }),
        );
      },
    });
  };

  const onDelete = (u: AdminUserListItem) => {
    setConfirm({
      title: "Delete user",
      description: (
        <>
          This permanently removes the user, their profile, resumes, and
          notifications. This cannot be undone.
          <br />
          <span className="text-muted-foreground text-xs">{u.email}</span>
        </>
      ),
      confirmLabel: "Delete user",
      destructive: true,
      run: () =>
        remove
          .mutateAsync({ id: u.id })
          .then(() => undefined)
          .finally(() => {
            setSelected((prev) => {
              if (!prev.has(u.id)) return prev;
              const next = new Set(prev);
              next.delete(u.id);
              return next;
            });
          }),
    });
  };

  const onBulk = (action: "ban" | "unban" | "verify") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setConfirm({
      title:
        action === "verify"
          ? `Verify ${ids.length} user${ids.length === 1 ? "" : "s"}`
          : `${action === "ban" ? "Ban" : "Reactivate"} ${ids.length} user${
              ids.length === 1 ? "" : "s"
            }`,
      description: "This affects everyone currently selected.",
      confirmLabel:
        action === "verify"
          ? "Verify selected"
          : action === "ban"
            ? "Ban selected"
            : "Reactivate selected",
      destructive: action === "ban",
      run: () =>
        bulk
          .mutateAsync({ userIds: ids, action })
          .then(() => {
            setSelected(new Set());
            return undefined;
          }),
    });
  };

  const users = data?.users ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const loading = query.isLoading && !data;

  const allOnPageSelected =
    users.length > 0 && users.every((u) => selected.has(u.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        for (const u of users) next.delete(u.id);
        return next;
      }
      const next = new Set(prev);
      for (const u of users) next.add(u.id);
      return next;
    });
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email"
                className="pl-9"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Select
              value={role ?? "all"}
              onValueChange={(v) =>
                onRoleChange(v as AdminUserFilters["role"])
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status ?? "all"}
              onValueChange={(v) =>
                onStatusChange(v as AdminUserFilters["status"])
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={() => router.push("/admin/users/invite")}
            className="gap-2"
          >
            <IconPlus className="size-4" />
            Invite user
          </Button>
        </div>
      </Card>

      {selected.size > 0 ? (
        <Card className="flex items-center justify-between p-3">
          <div className="text-sm">
            <span className="font-medium">{selected.size}</span> selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onBulk("verify")}
              disabled={bulk.isPending}
            >
              <IconUserCheck className="size-4" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onBulk("unban")}
              disabled={bulk.isPending}
            >
              <IconShield className="size-4" />
              Reactivate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onBulk("ban")}
              disabled={bulk.isPending}
            >
              <IconShieldOff className="size-4" />
              Ban selected
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all on page"
                  checked={allOnPageSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resumes</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : null}

            {!loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="text-muted-foreground text-sm">
                    No users match these filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading &&
              users.map((u) => (
                <TableRow
                  key={u.id}
                  data-state={selected.has(u.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${u.email}`}
                      checked={selected.has(u.id)}
                      onCheckedChange={() => toggleOne(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {u.name ?? u.profile?.firstName ?? u.email}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {u.email}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge
                        variant={u.isActive ? "outline" : "destructive"}
                      >
                        {u.isActive ? "Active" : "Banned"}
                      </Badge>
                      {u.emailVerified ? null : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {u._count.resumes}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Open actions"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Manage user</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}`}>View profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setLimitsTarget(u)}
                        >
                          <IconPlus className="mr-2 size-4" />
                          Edit limits
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onToggleStatus(u)}>
                          {u.isActive ? (
                            <>
                              <IconShieldOff className="mr-2 size-4" />
                              Ban user
                            </>
                          ) : (
                            <>
                              <IconShield className="mr-2 size-4" />
                              Reactivate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Trust</DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={u.emailVerified}
                          onSelect={() => onVerify(u)}
                        >
                          <IconMail className="mr-2 size-4" />
                          Verify email
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onForceReset(u)}>
                          <IconKey className="mr-2 size-4" />
                          Force password reset
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onPromote(u)}>
                          <IconShield className="mr-2 size-4" />
                          {u.role === "ADMIN" ? "Demote to user" : "Promote to admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDelete(u)}
                        >
                          <IconTrash className="mr-2 size-4" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {meta
            ? `Showing ${(meta.page - 1) * meta.limit + 1}–${Math.min(
                meta.page * meta.limit,
                meta.total,
              )} of ${meta.total}`
            : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <IconChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-muted-foreground tabular-nums">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <AdminEditLimitsDrawer
        userId={limitsTarget?.id ?? null}
        userEmail={limitsTarget?.email ?? null}
        initial={limitsTarget?.limits ?? null}
        open={Boolean(limitsTarget)}
        onOpenChange={(open) => {
          if (!open) setLimitsTarget(null);
        }}
      />

      <AdminConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? null}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        destructive={confirm?.destructive}
        busy={
          toggleStatus.isPending ||
          verify.isPending ||
          changeRole.isPending ||
          forceReset.isPending ||
          remove.isPending ||
          bulk.isPending
        }
        onConfirm={async () => {
          if (confirm) await confirm.run();
        }}
      />
    </div>
  );
}