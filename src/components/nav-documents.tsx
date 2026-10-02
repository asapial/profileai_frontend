"use client"

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

const isCurrent = (pathname: string, url: string) =>
  pathname === url || (url !== "/" && pathname.startsWith(`${url}/`))

export function NavDocuments({
  items,
  label = "Tools",
}: {
  items: { title: string; url: string; icon: Icon }[]
  label?: string
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobileNavigation = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="sidebar-section-label px-2 text-xs font-bold uppercase tracking-[0.18em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isCurrent(pathname, item.url)}
                className="sidebar-nav-button h-10 rounded-xl px-2.5"
              >
                <Link
                  href={item.url}
                  aria-current={isCurrent(pathname, item.url) ? "page" : undefined}
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
