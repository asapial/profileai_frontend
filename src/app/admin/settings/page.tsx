// A-P8 server wrapper for tabbed platform settings.

import { adminApi, ServerApiError } from "@/lib/adminApi";
import { AdminSettingsTabs } from "@/components/admin/AdminSettingsTabs";
import type { PlatformSetting } from "@/lib/hooks/useAdminSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform settings · Admin" };

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
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Global defaults, security thresholds, email identity, and brand.
          Changes propagate immediately and are recorded in the audit log.
        </p>
      </div>
      <AdminSettingsTabs initial={initial} />
    </div>
  );
}
