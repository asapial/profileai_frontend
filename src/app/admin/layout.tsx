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
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" role="ADMIN" />
      <SidebarInset>
        <SiteHeader
          role="ADMIN"
          title="Admin overview"
          cta={{ label: "New template", href: "/admin/templates/new" }}
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
  );
}