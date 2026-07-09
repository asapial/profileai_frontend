"use client"

import Link from "next/link"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  quickCreate,
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
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip={quickCreate?.label ?? "Quick Create"}
              asChild={Boolean(quickCreate?.href)}
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
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
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
