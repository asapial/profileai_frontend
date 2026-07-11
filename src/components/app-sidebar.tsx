"use client"

import * as React from "react"
import {
  IconBell,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconFileDescription,
  IconFlag,
  IconGift,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconLock,
  IconMegaphone,
  IconReceipt,
  IconReport,
  IconSearch,
  IconSettings,
  IconShield,
  IconTag,
  IconTicket,
  IconUsers,
  type Icon,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ModeToggleCompact } from "@/components/mode-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Role } from "@/types"

/**
 * Navigation payload for a single role. We keep the same primitives used
 * by the shadcn sidebar so the chrome (colors, spacing, focus rings) is
 * unchanged regardless of the active role.
 */
type SidebarConfig = {
  brand: { name: string; href: string }
  user: { name: string; email: string; avatar: string }
  navMain: { title: string; url: string; icon: Icon }[]
  documents: { name: string; url: string; icon: Icon }[]
  navSecondary: {
    title: string
    url: string
    icon: Icon
  }[]
  quickCreate?: { label: string; href: string }
}

const USER_CONFIG: SidebarConfig = {
  brand: { name: "ProfileAI", href: "/dashboard" },
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    { title: "Overview", url: "/dashboard", icon: IconDashboard },
    { title: "Resumes", url: "/dashboard/resumes", icon: IconListDetails },
    { title: "Templates", url: "/dashboard/templates", icon: IconFileDescription },
    { title: "Analytics", url: "/dashboard/analytics", icon: IconChartBar },
    { title: "Notifications", url: "/dashboard/notifications", icon: IconBell },
    { title: "Profile", url: "/dashboard/profile", icon: IconUsers },
  ],
  documents: [
    { name: "Cover Letters", url: "/dashboard/cover-letters", icon: IconFileDescription },
    { name: "Exports", url: "/dashboard/exports", icon: IconReport },
    { name: "Referrals", url: "/dashboard/referrals", icon: IconGift },
    { name: "Billing", url: "/dashboard/billing", icon: IconCreditCard },
  ],
  navSecondary: [
    { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
    { title: "Get Help", url: "/help", icon: IconHelp },
    { title: "Search", url: "#", icon: IconSearch },
  ],
  quickCreate: { label: "New resume", href: "/dashboard/resumes/new" },
}

const ADMIN_CONFIG: SidebarConfig = {
  brand: { name: "ProfileAI · Admin", href: "/admin" },
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    { title: "Overview", url: "/admin", icon: IconDashboard },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Resumes", url: "/admin/resumes", icon: IconListDetails },
    { title: "Templates", url: "/admin/templates", icon: IconFileDescription },
    { title: "Tickets", url: "/admin/tickets", icon: IconTicket },
    { title: "Analytics", url: "/admin/analytics", icon: IconChartBar },
    { title: "Reports", url: "/admin/reports", icon: IconReport },
  ],
  documents: [
    { name: "Announcements", url: "/admin/announcements", icon: IconMegaphone },
    { name: "Coupons", url: "/admin/coupons", icon: IconTag },
    { name: "Invoices", url: "/admin/invoices", icon: IconReceipt },
    { name: "Plans", url: "/admin/plans", icon: IconCreditCard },
    { name: "Help articles", url: "/admin/help-articles", icon: IconHelp },
    { name: "Exports", url: "/admin/exports", icon: IconFileDescription },
  ],
  navSecondary: [
    { title: "Profile", url: "/admin/profile", icon: IconUsers },
    { title: "Security", url: "/admin/security", icon: IconShield },
    { title: "Feature flags", url: "/admin/feature-flags", icon: IconFlag },
    { title: "Audit log", url: "/admin/audit-log", icon: IconLock },
    { title: "Settings", url: "/admin/settings", icon: IconSettings },
  ],
  quickCreate: { label: "New template", href: "/admin/templates/new" },
}

const DEFAULT_CONFIG = USER_CONFIG

function pickConfig(role: Role | null | undefined): SidebarConfig {
  if (role === "ADMIN") return ADMIN_CONFIG
  if (role === "USER") return USER_CONFIG
  return DEFAULT_CONFIG
}

export function AppSidebar({
  role,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: Role | null
  /**
   * Optional user overrides — the layout passes the resolved profile here
   * so the sidebar doesn't need a client-side fetch.
   */
  user?: Partial<SidebarConfig["user"]>
}) {
  const config = pickConfig(role)
  const navUser = { ...config.user, ...user }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href={config.brand.href}>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">
                  {config.brand.name}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={config.navMain}
          quickCreate={config.quickCreate}
        />
        <NavDocuments items={config.documents} />
        <NavSecondary items={config.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Theme
          </span>
          <ModeToggleCompact />
        </div>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
