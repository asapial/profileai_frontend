// Dashboard landing — single route that dispatches on the resolved
// role. We can't keep parallel `(user)` and `(admin)` route groups
// because they both resolve to `/dashboard` and Next.js rejects that.
// The role is already resolved server-side by `app/dashboard/layout.tsx`
// (see `lib/role.ts`), so this page just re-reads it and renders the
// matching view. Default = user (matches `proxy.ts` HOME_ROUTE_BY_ROLE).

import { AdminDashboardView } from "./_views/admin-dashboard"
import { UserDashboardView } from "./_views/user-dashboard"
import { getRoleFromCookies } from "@/lib/role"

export default async function DashboardPage() {
  const role = await getRoleFromCookies()
  return role === "ADMIN" ? <AdminDashboardView /> : <UserDashboardView />
}
