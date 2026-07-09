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
    ? `${user.profile?.firstName?.[0] ?? user.name?.[0] ?? "U"}${
        user.profile?.lastName?.[0] ?? ""
      }`.toUpperCase()
    : "U";

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/70 bg-background/80 px-4 shadow-[0_1px_0_0_hsl(258_90%_66%/0.06)] backdrop-blur-xl sm:px-6">
      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resumes, applications…"
            className="h-10 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground transition focus-visible:border-violet-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/60 text-muted-foreground transition hover:border-violet-500/30 hover:text-violet-600"
        >
          <Bell className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow shadow-violet-500/40"
          />
        </Link>

        {user?.twoFactorEnabled && (
          <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            2FA
          </span>
        )}

        <div className="hidden items-center gap-3 rounded-full border border-border/60 bg-background/60 py-1 pl-1 pr-3 sm:flex">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-semibold text-white shadow shadow-violet-500/30 ring-2 ring-background">
            {initials}
          </div>
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-foreground">
              {user?.profile?.firstName ?? user?.name ?? "Loading…"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Logout"
          onClick={handleLogout}
          className="rounded-xl text-muted-foreground hover:text-violet-600"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
