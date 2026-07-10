// Admin dashboard view. Imported by `app/dashboard/page.tsx` when the
// signed-in role is ADMIN. We redirect to `/admin` so the admin
// layout (which forces the admin sidebar + header) is the only place
// admins land — keeping `/admin` as the single canonical home for
// admin views.

import { redirect } from "next/navigation";

export function AdminDashboardView() {
  redirect("/admin");
}