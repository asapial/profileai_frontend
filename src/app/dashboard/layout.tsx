// Shared dashboard chrome for the `/dashboard` route tree.
//
// Both the user-facing `(user)` group and the admin-facing `(admin)`
// group render inside this layout. The role is read server-side from
// the `userRole` cookie (with a JWT fallback) so we render the correct
// sidebar + header without a client-side flash. The edge proxy in
// `src/proxy.ts` has already gated this route for authenticated users.

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getRoleFromCookies } from "@/lib/role"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getRoleFromCookies()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" role={role ?? undefined} />
      <SidebarInset>
        <SiteHeader
          role={role ?? undefined}
          title={role === "ADMIN" ? "Admin overview" : "Dashboard"}
          cta={
            role === "ADMIN"
              ? { label: "New template", href: "/admin/templates/new" }
              : { label: "New resume", href: "/dashboard/resumes/new" }
          }
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
