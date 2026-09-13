"use client";

import * as React from "react";
import Image from "next/image";
import {
  IconBell,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconFileDescription,
  IconFlag,
  IconGift,
  IconHelp,
  IconHomeEdit,
  IconListDetails,
  IconLock,
  IconReceipt,
  IconReport,
  IconSearch,
  IconSettings,
  IconShield,
  IconSpeakerphone,
  IconTag,
  IconTicket,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Role } from "@/types";

type SidebarItem = { title: string; url: string; icon: Icon };

type SidebarConfig = {
  brand: { name: string; href: string };
  user: { name: string; email: string; avatar: string };
  navMainLabel: string;
  navMain: SidebarItem[];
  toolsLabel: string;
  tools: SidebarItem[];
  navSecondaryLabel: string;
  navSecondary: SidebarItem[];
  quickCreate: { label: string; href: string };
};

/** Every destination below maps to a real page in the current App Router. */
const USER_CONFIG: SidebarConfig = {
  brand: { name: "ProfileAI", href: "/dashboard" },
  user: { name: "Member", email: "Your career workspace", avatar: "" },
  navMainLabel: "Workspace",
  navMain: [
    { title: "Overview", url: "/dashboard", icon: IconDashboard },
    { title: "Job workspace", url: "/dashboard/jobs", icon: IconSearch },
    { title: "Career studio", url: "/dashboard/career", icon: IconFileDescription },
    { title: "Resumes", url: "/dashboard/resumes", icon: IconListDetails },
    {
      title: "Applications",
      url: "/dashboard/applications",
      icon: IconListDetails,
    },
    {
      title: "Templates",
      url: "/dashboard/templates",
      icon: IconFileDescription,
    },
  ],
  toolsLabel: "Career tools",
  tools: [
    { title: "Role insights", url: "/dashboard/ats", icon: IconSearch },
    {
      title: "Cover Letters",
      url: "/dashboard/cover-letters",
      icon: IconFileDescription,
    },
    { title: "Analytics", url: "/dashboard/analytics", icon: IconChartBar },
    { title: "Exports", url: "/dashboard/exports", icon: IconReport },
    { title: "Referrals", url: "/dashboard/referrals", icon: IconGift },
  ],
  navSecondaryLabel: "Account",
  navSecondary: [
    { title: "Notifications", url: "/dashboard/notifications", icon: IconBell },
    { title: "Billing", url: "/dashboard/billing", icon: IconCreditCard },
    { title: "Support", url: "/dashboard/support", icon: IconHelp },
    { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
  ],
  quickCreate: { label: "New resume", href: "/dashboard/resumes/new" },
};

const ADMIN_CONFIG: SidebarConfig = {
  brand: { name: "ProfileAI Admin", href: "/admin" },
  user: { name: "Administrator", email: "Platform control center", avatar: "" },
  navMainLabel: "Admin console",
  navMain: [
    { title: "Overview", url: "/admin", icon: IconDashboard },
    { title: "Source health", url: "/admin/sources", icon: IconSearch },
    { title: "Homepage", url: "/admin/homepage", icon: IconHomeEdit },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Resumes", url: "/admin/resumes", icon: IconListDetails },
    { title: "Templates", url: "/admin/templates", icon: IconFileDescription },
  ],
  toolsLabel: "Operations",
  tools: [
    { title: "Tickets", url: "/admin/tickets", icon: IconTicket },
    { title: "Analytics", url: "/admin/analytics", icon: IconChartBar },
    { title: "Reports", url: "/admin/reports", icon: IconReport },
    { title: "Moderation", url: "/admin/moderation", icon: IconShield },
    {
      title: "Announcements",
      url: "/admin/announcements",
      icon: IconSpeakerphone,
    },
    { title: "Coupons", url: "/admin/coupons", icon: IconTag },
    { title: "Invoices", url: "/admin/invoices", icon: IconReceipt },
    { title: "Plans", url: "/admin/plans", icon: IconCreditCard },
    { title: "Billing", url: "/admin/billing", icon: IconCreditCard },
    { title: "Exports", url: "/admin/exports", icon: IconFileDescription },
  ],
  navSecondaryLabel: "System",
  navSecondary: [
    { title: "Help articles", url: "/admin/help-articles", icon: IconHelp },
    { title: "Security", url: "/admin/security", icon: IconShield },
    { title: "Feature flags", url: "/admin/feature-flags", icon: IconFlag },
    { title: "Audit log", url: "/admin/audit-log", icon: IconLock },
    { title: "Settings", url: "/admin/settings", icon: IconSettings },
  ],
  quickCreate: { label: "New template", href: "/admin/templates/create" },
};

function pickConfig(role: Role | null | undefined): SidebarConfig {
  return role === "ADMIN" ? ADMIN_CONFIG : USER_CONFIG;
}

export function AppSidebar({
  role,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: Role | null;
  user?: Partial<SidebarConfig["user"]>;
}) {
  const config = pickConfig(role);
  const navUser = { ...config.user, ...user };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-3 pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12 rounded-xl px-2">
              <a href={config.brand.href}>
                <Image
                  src="/brand/profileai-mark.svg"
                  alt=""
                  width={48}
                  height={48}
                  className="size-9 shrink-0 drop-shadow-lg"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-tight">
                    {config.brand.name}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">
                    {role === "ADMIN" ? "Control center" : "Career studio"}
                  </span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <NavMain
          items={config.navMain}
          quickCreate={config.quickCreate}
          label={config.navMainLabel}
        />
        <details className="studio-tools">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-sidebar-foreground">
            {config.toolsLabel}
          </summary>
          <NavDocuments items={config.tools} label={config.toolsLabel} />
        </details>
        <NavSecondary
          items={config.navSecondary}
          label={config.navSecondaryLabel}
          className="mt-auto"
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <NavUser user={navUser} role={role ?? "USER"} />
      </SidebarFooter>
    </Sidebar>
  );
}
