"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  quickCreate,
  label = "Workspace",
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  /**
   * Optional primary CTA shown at the top of the nav. When `href` is
   * provided we render a real link so the user can preview the
   * destination on hover and middle-click to open in a new tab.
   */
  quickCreate?: { label: string; href?: string }
  label?: string
}) {
  const pathname = usePathname()
  const isCurrent = (url: string) =>
    pathname === url ||
    (url !== "/dashboard" && url !== "/admin" && pathname.startsWith(`${url}/`))

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.16em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip={quickCreate?.label ?? "Quick Create"}
              asChild={Boolean(quickCreate?.href)}
              className="h-10 min-w-8 rounded-xl border border-white/15 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 duration-200 ease-linear hover:from-violet-500 hover:to-fuchsia-400 hover:text-white active:text-white"
            >
              {quickCreate?.href ? (
                <Link href={quickCreate.href}>
                  <IconCirclePlusFilled />
                  <span>{quickCreate.label}</span>
                </Link>
              ) : (
                <>
                  <IconCirclePlusFilled />
                  <span>{quickCreate?.label ?? "Quick Create"}</span>
                </>
              )}
            </SidebarMenuButton>
            <Button
              size="icon"
              asChild
              className="size-10 rounded-xl group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <Link href={pathname.startsWith("/admin") ? "/admin/tickets" : "/dashboard/notifications"}>
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isCurrent(item.url)}
                className="h-9 rounded-lg px-2.5 data-[active=true]:bg-gradient-to-r data-[active=true]:from-violet-500/15 data-[active=true]:to-fuchsia-500/10 data-[active=true]:text-primary"
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
