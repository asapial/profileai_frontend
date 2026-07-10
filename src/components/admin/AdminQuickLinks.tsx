"use client";

// Quick-link grid surfaced at the top of the admin dashboard so admins
// can jump straight to the most-used operational pages.

import Link from "next/link";
import {
  IconUsers,
  IconFileDescription,
  IconSettings,
  IconChartBar,
  IconReport,
  IconShield,
} from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { AdminQuickLink } from "@/lib/hooks/useAdminDashboard";

const ICONS = {
  users: IconUsers,
  templates: IconFileDescription,
  settings: IconSettings,
  analytics: IconChartBar,
  reports: IconReport,
  security: IconShield,
} as const;

type QuickLinkKey = keyof typeof ICONS;

const DEFAULT_LINKS: AdminQuickLink[] = [
  {
    label: "User directory",
    href: "/admin/users",
    description: "Search, filter, and act on accounts",
  },
  {
    label: "Templates",
    href: "/admin/templates",
    description: "Manage resume templates and defaults",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    description: "Usage, revenue, and ATS trends",
  },
  {
    label: "Platform settings",
    href: "/admin/settings",
    description: "Limits, sessions, and 2FA policy",
  },
];

function iconFor(href: string): QuickLinkKey {
  if (href.startsWith("/admin/users")) return "users";
  if (href.startsWith("/admin/templates")) return "templates";
  if (href.startsWith("/admin/analytics")) return "analytics";
  if (href.startsWith("/admin/settings")) return "settings";
  if (href.startsWith("/admin/reports")) return "reports";
  if (href.startsWith("/admin/security")) return "security";
  return "settings";
}

export function AdminQuickLinks({ links }: { links?: AdminQuickLink[] }) {
  const items = links && links.length > 0 ? links : DEFAULT_LINKS;
  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {items.map((link) => {
        const Icon = ICONS[iconFor(link.href)] ?? IconSettings;
        return (
          <Card
            key={link.href}
            className="group transition-colors hover:border-violet-500/40"
          >
            <Link
              href={link.href}
              className="flex h-full flex-col justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <Icon className="h-4 w-4" />
                </span>
                <CardTitle className="text-sm font-semibold">
                  {link.label}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {link.description}
              </CardDescription>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
