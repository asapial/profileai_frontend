"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { ModeToggleCompact } from "@/components/mode-toggle";
import type { Role } from "@/types";

const ROUTE_TITLES: Array<[string, string]> = [
  ["/dashboard/documents/new", "Create document"],
  ["/dashboard/resume/create", "Create resume"],
  ["/dashboard/resume", "Resume editor"],
  ["/dashboard/applications", "Application details"],
  ["/dashboard/career", "Career Studio"],
  ["/dashboard/harness", "Agent harness"],
  ["/dashboard/documents", "Documents"],
  ["/dashboard/jobs", "Job workspace"],
  ["/dashboard/worker", "Local Worker"],
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
  ["/admin/subscriptions", "Subscriptions"],
  ["/admin/sources", "Source health"],
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
  cta,
}: {
  title?: string;
  role?: Role | null;
  cta?: { label: string; href: string };
}) {
  const pathname = usePathname();
  const pageTitle = title ?? titleForPath(pathname, role);

  return (
    <header className="sticky top-0 z-30 flex min-h-(--header-height) min-w-0 shrink-0 items-center gap-2 bg-background/96 backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex min-w-0 w-full items-center gap-1 px-3 py-2 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 size-10 rounded-xl bg-muted/70" />
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
          <p className="hidden text-xs text-muted-foreground sm:block">
            {role === "ADMIN"
              ? "Platform control center"
              : "Your career workspace"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggleCompact className="size-11 border-0 bg-muted/70" />
          <NotificationsBell
            href={role === "ADMIN" ? "/admin/announcements" : "/dashboard/notifications"}
          />
          {cta ? (
            <Link
              href={cta.href}
              data-ui="primary-action"
              className="hidden min-h-11 items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold transition-[filter,transform] active:translate-y-px sm:inline-flex"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
