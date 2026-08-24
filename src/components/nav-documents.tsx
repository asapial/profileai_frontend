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

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.16em]">
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
                className="h-9 rounded-lg px-2.5 data-[active=true]:bg-gradient-to-r data-[active=true]:from-violet-500/15 data-[active=true]:to-fuchsia-500/10 data-[active=true]:text-primary"
              >
                <Link href={item.url}>
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
