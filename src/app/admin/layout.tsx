// Shared chrome for the `/admin` route tree.
//
// The edge proxy (`src/proxy.ts`) already gates `/admin/*` so only ADMIN
// sessions can reach a server layout — but we still re-read the role here
// so non-admins get bounced to `/dashboard` at the server boundary
// instead of rendering admin chrome. Mirrors the pattern in
// `app/dashboard/layout.tsx`.

import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getRoleFromCookies } from "@/lib/role";

import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRoleFromCookies();
  if (role !== "ADMIN") {
    // Non-admin signed-in user landed here despite the edge gate — fall
    // back to their home instead of /login (which would be confusing for
    // a logged-in user). Anonymous users never reach this layout because
    // the proxy redirects them.
    redirect("/dashboard");
  }

  return (
    <SidebarProvider
      className="admin-console premium-dashboard bg-transparent"
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
      <AppSidebar role="ADMIN" />
      <SidebarInset>
        <SiteHeader
          role="ADMIN"
          cta={{ label: "New template", href: "/admin/templates/create" }}
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
  );
}
