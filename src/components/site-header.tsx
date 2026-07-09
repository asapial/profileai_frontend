"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import type { Role } from "@/types";

export function SiteHeader({
  title,
  role,
  cta,
}: {
  /** Page-level title shown in the top bar (e.g. "Overview"). */
  title?: string;
  /**
   * Optional role context so the header can render a small badge and a
   * role-appropriate primary CTA. Pass `null` to hide the badge.
   */
  role?: Role | null;
  /** Optional primary CTA on the right side of the header. */
  cta?: { label: string; href: string };
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title ?? "Dashboard"}</h1>
        {role ? (
          <span
            className={
              "ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset " +
              (role === "ADMIN"
                ? "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300"
                : "bg-primary/10 text-primary ring-primary/20")
            }
          >
            {role === "ADMIN" ? "Admin" : "Member"}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell />
          {cta ? (
            <Button asChild size="sm" className="hidden sm:flex">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
