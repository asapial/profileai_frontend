import { ServerApiError, adminApi } from "@/lib/adminApi";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import type { AdminUserListResponse } from "@/lib/hooks/useAdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let initial: Awaited<
    ReturnType<typeof adminApi.get<AdminUserListResponse>>
  > | null = null;
  try {
    initial = await adminApi.get<AdminUserListResponse>(
      "/admin/users?page=1&limit=20",
    );
  } catch (err: unknown) {
    if (err instanceof ServerApiError && err.status === 401) {
      // Login redirect handled by the proxy, but render an empty
      // directory rather than a crash if the cookie vanished mid-render.
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Search, filter, and manage every account on the platform.
        </p>
      </div>
      <AdminUsersTable initial={initial?.data} />
    </div>
  );
}
