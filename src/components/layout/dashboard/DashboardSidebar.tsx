"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Bell,
  LayoutTemplate,
  UserRound,
  Sparkles,
  ScrollText,
  BarChart3,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/cover-letter", label: "Cover Letters", icon: ScrollText },
  { href: "/analyzer", label: "JD Analyzer", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border/70 bg-gradient-to-b from-background via-background to-violet-50/40 backdrop-blur-md md:flex dark:to-violet-950/20">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-6">
        <Link href="/dashboard" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-violet-500 text-white shadow-lg shadow-violet-500/30 ring-1 ring-violet-500/20 transition-transform group-hover:scale-105 group-hover:shadow-violet-500/40">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-gradient">
              ProFile AI
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Career Studio
            </span>
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-violet-600/12 via-fuchsia-500/10 to-transparent text-foreground shadow-[inset_1px_0_0_0_hsl(258_90%_66%)]"
                      : "text-muted-foreground hover:bg-violet-500/5 hover:text-foreground"
                  )}
                >
                  {/* Active glow indicator */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
                    />
                  )}
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-lg transition-all",
                      active
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-violet-500/10 group-hover:text-violet-600 dark:group-hover:text-violet-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / support card */}
      <div className="border-t border-border/60 p-4">
        <Link
          href="/help"
          className="group flex items-center gap-3 rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/8 to-fuchsia-500/8 p-3 text-sm transition-all hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/80 text-violet-600 ring-1 ring-violet-500/20 group-hover:text-violet-700 dark:text-violet-300">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <span className="flex-1 leading-tight">
            <span className="block font-medium text-foreground">
              Need a hand?
            </span>
            <span className="block text-xs text-muted-foreground">
              Visit the help center
            </span>
          </span>
        </Link>
        <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground/70">
          © {new Date().getFullYear()} ProFile AI
        </p>
      </div>
    </aside>
  );
}
