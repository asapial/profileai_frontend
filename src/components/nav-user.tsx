"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import {
  IconBell,
  IconChevronRight,
  IconCreditCard,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react"

import { getCurrentUser, logout } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavUserData = { name: string; email: string; avatar: string }

function initials(name: string) {
  const value = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  return value || "PA"
}

function ThemeControl() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  // next-themes can only resolve the persisted preference in the browser.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])
  const selected = mounted ? theme ?? resolvedTheme ?? "system" : "system"

  return (
    <div className="px-2 py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold">Appearance</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {selected}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/40 bg-muted/45 p-1 dark:border-white/8">
        {[
          { value: "light", label: "Light", icon: IconSun },
          { value: "dark", label: "Dark", icon: IconMoon },
          { value: "system", label: "Auto", icon: IconSettings },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setTheme(option.value)
            }}
            className={cn(
              "flex min-h-9 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition",
              selected === option.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <option.icon className="size-3.5" />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function NavUser({
  user,
  role,
}: {
  user: NavUserData
  role: Role
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const account = useQuery({
    queryKey: ["auth", "me", "sidebar"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  })

  const current = account.data
  const displayName = current?.name?.trim() || user.name
  const displayEmail = current?.email || user.email
  const avatar = current?.profile?.avatarUrl || user.avatar
  const profileHref = role === "ADMIN" ? "/admin/profile" : "/dashboard/profile"
  const settingsHref = role === "ADMIN" ? "/admin/settings" : "/dashboard/settings"
  const notificationsHref =
    role === "ADMIN" ? "/admin/announcements" : "/dashboard/notifications"
  const billingHref = role === "ADMIN" ? "/admin/billing" : "/dashboard/billing"

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Open profile and appearance menu"
              className="h-auto min-h-14 rounded-xl border border-white/35 bg-background/40 px-2.5 py-2 shadow-sm backdrop-blur-xl transition hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground dark:border-white/8 dark:bg-white/4"
            >
              <span className="relative">
                <Avatar className="size-9 rounded-xl ring-2 ring-background">
                  {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-semibold text-white">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {role === "ADMIN" ? "Administrator" : "Profile & preferences"}
                </span>
              </span>
              <IconChevronRight className="ml-auto size-4 text-muted-foreground transition-transform data-[state=open]:rotate-90" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl p-2"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={10}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/8 p-3 ring-1 ring-primary/10">
                <Avatar className="size-10 rounded-xl">
                  {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-semibold text-white">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{displayName}</span>
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      {role}
                    </span>
                  </div>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <ThemeControl />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileHref}><IconUserCircle />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={notificationsHref}><IconBell />Notifications</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={billingHref}><IconCreditCard />Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={settingsHref}><IconSettings />Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onSelect={(event) => {
                event.preventDefault()
                void handleLogout()
              }}
            >
              <IconLogout />
              {loggingOut ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
