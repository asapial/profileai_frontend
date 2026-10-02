"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  label = "System",
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
  label?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobileNavigation = () => {
    if (isMobile) setOpenMobile(false)
  }
  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel className="sidebar-section-label px-2 text-xs font-bold uppercase tracking-[0.18em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                tooltip={item.title}
                className="sidebar-nav-button h-10 rounded-xl px-2.5"
              >
                <Link
                  href={item.url}
                  aria-current={pathname === item.url || pathname.startsWith(`${item.url}/`) ? "page" : undefined}
                  onClick={closeMobileNavigation}
                >
                  <item.icon />
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
