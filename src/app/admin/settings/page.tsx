import { adminApi, ServerApiError } from "@/lib/adminApi";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import type { PlatformSetting } from "@/lib/hooks/useAdminSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  let initial: PlatformSetting[] | undefined;
  try {
    const res = await adminApi.get<PlatformSetting[]>("/admin/settings");
    initial = res.data;
  } catch (err: unknown) {
    if (err instanceof ServerApiError && err.status === 401) {
      // proxy handles login redirect — render empty form
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Global defaults, security thresholds, and operational toggles.
          Changes propagate immediately and are recorded in the audit log.
        </p>
      </div>
      <AdminSettingsForm initial={initial} />
    </div>
  );
}
