// Admin dashboard view. Imported by `app/dashboard/page.tsx` and
// rendered for the ADMIN role. Composition mirrors the user view so
// the chrome and spacing stay consistent; only the data surface
// differs.

import { AdminSectionCards } from "@/components/dashboard/admin/AdminSectionCards"
import { AdminUsersTable } from "@/components/dashboard/admin/AdminUsersTable"

export function AdminDashboardView() {
  return (
    <>
      <AdminSectionCards />
      <div className="px-4 lg:px-6">
        <AdminUsersTable />
      </div>
    </>
  )
}