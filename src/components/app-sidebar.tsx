"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconBell,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconDeviceDesktopCog,
  IconFileDescription,
  IconFlag,
  IconGift,
  IconHelp,
  IconHomeEdit,
  IconRobot,
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
  SidebarRail,
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
    { title: "Agent harness", url: "/dashboard/harness", icon: IconRobot },
    { title: "Local worker", url: "/dashboard/worker", icon: IconDeviceDesktopCog },
    { title: "Documents", url: "/dashboard/documents", icon: IconListDetails },
    {
      title: "Templates",
      url: "/dashboard/templates",
      icon: IconFileDescription,
    },
  ],
  toolsLabel: "Career tools",
  tools: [
    { title: "Role insights / ATS", url: "/dashboard/ats", icon: IconSearch },
    {
      title: "Cover letters",
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
  quickCreate: { label: "Create document", href: "/dashboard/documents/new" },
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
    { title: "User subscriptions", url: "/admin/subscriptions", icon: IconCreditCard },
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 pb-3 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={config.brand.name}
              className="sidebar-brand h-14 rounded-xl px-2.5"
            >
              <Link href={config.brand.href}>
                <Image
                  src="/brand/profileai-mark.svg"
                  alt=""
                  width={48}
                  height={48}
                  priority
                  className="size-9 shrink-0 group-data-[collapsible=icon]:size-5"
                />
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-sm font-semibold tracking-tight">
                    {config.brand.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-sidebar-foreground/55">
                    {role === "ADMIN" ? "Control center" : "Career Studio"}
                  </span>
                </span>
                <span className="size-2 rounded-full bg-primary/70 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="sidebar-navigation px-2 pb-2">
        <NavMain
          items={config.navMain}
          quickCreate={config.quickCreate}
          label={config.navMainLabel}
        />
        <NavDocuments items={config.tools} label={config.toolsLabel} />
        <NavSecondary
          items={config.navSecondary}
          label={config.navSecondaryLabel}
          className="mt-auto"
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3 pt-2">
        <NavUser user={navUser} role={role ?? "USER"} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
