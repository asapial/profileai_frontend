"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import type { Role } from "@/types";

const ROUTE_TITLES: Array<[string, string]> = [
  ["/dashboard/resumes/new", "Create resume"],
  ["/dashboard/resumes", "Resumes"],
  ["/dashboard/applications", "Applications"],
  ["/dashboard/cover-letters", "Cover letters"],
  ["/dashboard/templates", "Templates"],
  ["/dashboard/ats", "Role insights"],
  ["/dashboard/analytics", "Career analytics"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/exports", "Exports"],
  ["/dashboard/referrals", "Referrals"],
  ["/dashboard/billing", "Billing"],
  ["/dashboard/support", "Support"],
  ["/dashboard/profile", "Profile"],
  ["/dashboard/settings", "Settings"],
  ["/admin/templates/create", "Create template"],
  ["/admin/homepage", "Homepage studio"],
  ["/admin/help-articles", "Help articles"],
  ["/admin/feature-flags", "Feature flags"],
  ["/admin/audit-log", "Audit log"],
  ["/admin/announcements", "Announcements"],
  ["/admin/moderation", "Moderation"],
  ["/admin/analytics", "Platform analytics"],
  ["/admin/templates", "Templates"],
  ["/admin/resumes", "Resumes"],
  ["/admin/security", "Security"],
  ["/admin/settings", "Settings"],
  ["/admin/profile", "Profile"],
  ["/admin/reports", "Reports"],
  ["/admin/exports", "Exports"],
  ["/admin/billing", "Billing"],
  ["/admin/invoices", "Invoices"],
  ["/admin/coupons", "Coupons"],
  ["/admin/plans", "Plans"],
  ["/admin/tickets", "Support tickets"],
  ["/admin/users", "Users"],
];

function titleForPath(pathname: string, role?: Role | null) {
  const match = ROUTE_TITLES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.[1] ?? (role === "ADMIN" ? "Admin overview" : "Dashboard");
}

export function SiteHeader({
  title,
  role,
}: {
  title?: string;
  role?: Role | null;
  cta?: { label: string; href: string };
}) {
  const pathname = usePathname();
  const pageTitle = title ?? titleForPath(pathname, role);

  return (
    <header className="sticky top-0 z-30 flex min-h-(--header-height) min-w-0 shrink-0 items-center gap-2 border-b border-white/40 bg-background/58 backdrop-blur-2xl transition-[width,height] ease-linear dark:border-white/8 dark:bg-background/55">
      <div className="flex min-w-0 w-full items-center gap-1 px-3 py-2 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 size-9 rounded-xl border border-border/60 bg-background/45" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-6"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {pageTitle}
            </p>
          </div>
          <p className="hidden text-[10px] text-muted-foreground sm:block">
            {role === "ADMIN"
              ? "Platform control center"
              : "Your career workspace"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}
