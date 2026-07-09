"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  ScrollText,
  BarChart3,
  Briefcase,
  Bell,
  LifeBuoy,
  CreditCard,
  Activity,
  LogOut,
  UserRound,
  Sparkles,
} from "lucide-react";
import { Navbar1 } from "@/components/navbar1";
import { logout } from "@/lib/auth";

// Local mirror of the MenuItem shape used by the shadcn navbar1 block
// (the block keeps the type internal; redefining here avoids a local edit
// to upstream block code while staying in sync with the prop contract).
interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarShellProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

export function NavbarShell({ isAuthenticated, userName }: NavbarShellProps) {
  const router = useRouter();

  const menu: MenuItem[] = useMemo(
    () => [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <LayoutDashboard className="size-4 shrink-0" />,
      },
      {
        title: "Resumes",
        url: "/resumes",
        icon: <FileText className="size-4 shrink-0" />,
      },
      {
        title: "Build",
        url: "#",
        items: [
          {
            title: "Resume builder",
            description: "Create a polished, ATS-friendly resume in minutes",
            icon: <FileText className="size-5 shrink-0" />,
            url: "/resume/create",
          },
          {
            title: "Cover letters",
            description: "Tailored letters that match each job description",
            icon: <ScrollText className="size-5 shrink-0" />,
            url: "/cover-letters",
          },
          {
            title: "JD analyzer",
            description: "Score your resume against any job description",
            icon: <BarChart3 className="size-5 shrink-0" />,
            url: "/analyzer",
          },
          {
            title: "Templates",
            description: "Hand-crafted designs ready to customize",
            icon: <LayoutTemplate className="size-5 shrink-0" />,
            url: "/templates",
          },
        ],
      },
      {
        title: "Track",
        url: "#",
        items: [
          {
            title: "Applications",
            description: "Keep every opportunity organized in one place",
            icon: <Briefcase className="size-5 shrink-0" />,
            url: "/applications",
          },
          {
            title: "Notifications",
            description: "Updates, reminders, and recruiter signals",
            icon: <Bell className="size-5 shrink-0" />,
            url: "/notifications",
          },
        ],
      },
      {
        title: "Resources",
        url: "#",
        items: [
          {
            title: "Help center",
            description: "Answers to the most common questions",
            icon: <LifeBuoy className="size-5 shrink-0" />,
            url: "/help",
          },
          {
            title: "Pricing",
            description: "Plans, limits, and billing",
            icon: <CreditCard className="size-5 shrink-0" />,
            url: "/pricing",
          },
          {
            title: "Status",
            description: "Live service and API status",
            icon: <Activity className="size-5 shrink-0" />,
            url: "/help#status",
          },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest('a[href="#logout"]');
      if (a) {
        e.preventDefault();
        void (async () => {
          try {
            await logout();
          } catch {
            // ignore: cookies cleared on the server regardless
          }
          router.push("/login");
          router.refresh();
        })();
      }
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, true);
  }, [isAuthenticated, router]);

  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/75 shadow-[0_1px_0_0_hsl(258_90%_66%/0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand logo */}
        <a
          href="/dashboard"
          className="group flex items-center gap-2.5"
          aria-label="ProFile AI home"
        >
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
        </a>

        {/* Navbar1 component (desktop menu, mobile sheet) */}
        <div className="flex flex-1 justify-end">
          <Navbar1
            menu={menu}
            auth={
              isAuthenticated
                ? {
                    login: {
                      title: userName ? `Sign out` : "Sign out",
                      url: "#logout",
                    },
                    signup: { title: "Profile", url: "/profile" },
                  }
                : {
                    login: { title: "Sign in", url: "/login" },
                    signup: { title: "Get started", url: "/register" },
                  }
            }
          />
        </div>
      </div>

      {/* Authenticated user pill — placed in the top-right gutter next to the
          nav actions on large screens; mobile users still see it in the sheet. */}
      {isAuthenticated && userName && (
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 sm:block">
          <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-border/60 bg-background/80 py-1 pl-1 pr-3 text-xs shadow-sm lg:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[10px] font-semibold text-white shadow shadow-violet-500/30">
              {userName
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className="font-medium text-foreground">{userName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
