"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";
import { Providers } from "@/components/providers";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  // The shadcn dashboard-01 block renders its own AppSidebar + SiteHeader via
  // SidebarProvider. Suppress the project shell chrome for /dashboard only,
  // so other (user) routes (incl. /profile) keep their original layout.
  const isShadcnDashboard = pathname === "/dashboard";

  if (isShadcnDashboard) {
    return <Providers>{children}</Providers>;
  }

  return (
    <Providers>
      <div className="flex min-h-svh min-w-0 bg-background">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
