"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  quickCreate,
  label = "Workspace",
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  /**
   * Optional primary CTA shown at the top of the nav. When `href` is
   * provided we render a real link so the user can preview the
   * destination on hover and middle-click to open in a new tab.
   */
  quickCreate?: { label: string; href?: string };
  label?: string;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobileNavigation = () => {
    if (isMobile) setOpenMobile(false);
  };
  const isCurrent = (url: string) =>
    pathname === url ||
    (url !== "/dashboard" &&
      url !== "/admin" &&
      pathname.startsWith(`${url}/`));

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="sidebar-section-label px-2 text-xs font-bold uppercase tracking-[0.18em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="mb-1 flex items-center gap-2">
            <SidebarMenuButton
              tooltip={quickCreate?.label ?? "Quick Create"}
              asChild={Boolean(quickCreate?.href)}
              className="sidebar-quick-create h-12 min-w-8 rounded-xl bg-primary px-2.5 text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90 hover:text-primary-foreground"
            >
              {quickCreate?.href ? (
                <Link href={quickCreate.href} onClick={closeMobileNavigation}>
                  <IconCirclePlusFilled />
                  <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{quickCreate.label}</span>
                    <span className="truncate text-xs font-medium text-primary-foreground/65">Create something new</span>
                  </span>
                </Link>
              ) : (
                <>
                  <IconCirclePlusFilled />
                  <span>{quickCreate?.label ?? "Quick Create"}</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isCurrent(item.url)}
                className="sidebar-nav-button h-10 rounded-xl px-2.5"
              >
                <Link
                  href={item.url}
                  aria-current={isCurrent(item.url) ? "page" : undefined}
                  onClick={closeMobileNavigation}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
