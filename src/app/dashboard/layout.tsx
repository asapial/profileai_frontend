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
      className="premium-dashboard bg-transparent"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <a
        href="#main"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <AppSidebar role={role ?? undefined} />
      <SidebarInset>
        <SiteHeader
          role={role ?? undefined}
          cta={
            role === "ADMIN"
              ? { label: "New template", href: "/admin/templates/create" }
              : { label: "Create document", href: "/dashboard/documents/new" }
          }
        />
        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
          <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
            <div className="app-workspace-content flex min-w-0 max-w-full flex-col gap-5 overflow-x-clip py-5 md:gap-8 md:py-8">
              {children}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
