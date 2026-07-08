"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { getCurrentUser, logout, CurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function DashboardTopbar() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => {
      if (mounted) setUser(u);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const initials = user
    ? `${user.profile?.firstName?.[0] ?? user.name?.[0] ?? "U"}${user.profile?.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resumes, applications…"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </Link>
        {user?.twoFactorEnabled && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            2FA
          </span>
        )}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium">
              {user?.profile?.firstName ?? user?.name ?? "Loading…"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-semibold text-white shadow">
            {initials}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
